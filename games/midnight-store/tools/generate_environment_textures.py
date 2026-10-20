"""Generate seamless, game-ready environmental texture maps for night-store."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "img"
SIZE = 1024


def periodic_noise(cells, seed):
    rng = np.random.default_rng(seed)
    grid = rng.random((cells, cells), dtype=np.float32)
    p = np.arange(SIZE, dtype=np.float32) * cells / SIZE
    i = np.floor(p).astype(np.int32)
    f = p - i
    f = f * f * (3 - 2 * f)
    ix, iy = np.meshgrid(i, i, indexing="xy")
    fx, fy = np.meshgrid(f, f, indexing="xy")
    a = grid[iy, ix]
    b = grid[iy, (ix + 1) % cells]
    c = grid[(iy + 1) % cells, ix]
    d = grid[(iy + 1) % cells, (ix + 1) % cells]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def layers(seed):
    return (
        periodic_noise(4, seed),
        periodic_noise(12, seed + 1),
        periodic_noise(40, seed + 2),
        periodic_noise(128, seed + 3),
        periodic_noise(512, seed + 4),
    )


def save_rgb(name, rgb):
    image = Image.fromarray(np.uint8(np.clip(rgb, 0, 255)), "RGB")
    image.save(OUT / name, "JPEG", quality=91, subsampling=0, optimize=True)


def make_asphalt():
    n0, n1, n2, n3, grit = layers(1201)
    broad = (n0 - .5) * 13 + (n1 - .5) * 22 + (n2 - .5) * 26
    grain = (n3 - .5) * 23 + (grit - .5) * 28
    v = 77 + broad + grain
    rgb = np.stack((v + 2, v + 3, v + 5), axis=-1)
    # Fine aggregate catches the canopy lights without making the road look paved.
    flecks = grit > .986
    rgb[flecks] += np.array([28, 29, 28], dtype=np.float32)
    dark_grit = grit < .018
    rgb[dark_grit] -= np.array([20, 19, 17], dtype=np.float32)
    save_rgb("e_asphalt.jpg", rgb)


def tile_surface(name, base, seed, stain_strength, scratch=False):
    n0, n1, n2, n3, grit = layers(seed)
    mod = (n0 - .5) * 8 + (n1 - .5) * 12 + (n2 - .5) * 15 + (n3 - .5) * 6
    grime = np.maximum(0, .25 - n1) * stain_strength
    value = base + mod - grime + (grit - .5) * 5
    rgb = np.stack((value, value + 1, value + 2), axis=-1)
    image = Image.fromarray(np.uint8(np.clip(rgb, 0, 255)), "RGB")
    draw = ImageDraw.Draw(image)
    cell = SIZE // 4
    rng = np.random.default_rng(seed + 80)
    for y in range(4):
        for x in range(4):
            x0, y0 = x * cell, y * cell
            x1, y1 = x0 + cell - 1, y0 + cell - 1
            shift = int(rng.integers(-7, 8))
            # Repeating grout and a restrained bevel make every slab legible in game.
            draw.rectangle((x0, y0, x1, y1), fill=(65, 70, 72))
            draw.rectangle((x0 + 5, y0 + 5, x1 - 5, y1 - 5), fill=(base + shift,) * 3)
            draw.line((x0 + 5, y0 + 5, x1 - 5, y0 + 5), fill=(base + shift + 8,) * 3, width=2)
            draw.line((x0 + 5, y0 + 5, x0 + 5, y1 - 5), fill=(base + shift + 5,) * 3, width=2)
            draw.line((x0 + 6, y1 - 5, x1 - 5, y1 - 5), fill=(base + shift - 8,) * 3, width=2)
            draw.line((x1 - 5, y0 + 6, x1 - 5, y1 - 5), fill=(base + shift - 7,) * 3, width=2)
    # Add tile surface grain after drawing the grout so the joints stay crisp.
    texture = np.asarray(image).astype(np.float32)
    n0, n1, n2, n3, grit = layers(seed + 300)
    variation = (n0 - .5) * 7 + (n1 - .5) * 12 + (n2 - .5) * 16 + (n3 - .5) * 10 + (grit - .5) * 12
    slab = texture[:, :, 0] > 100
    texture[slab] += variation[slab, None]
    image = Image.fromarray(np.uint8(np.clip(texture, 0, 255)), "RGB")
    if scratch:
        draw = ImageDraw.Draw(image, "RGBA")
        for _ in range(130):
            x, y = int(rng.integers(32, SIZE - 40)), int(rng.integers(32, SIZE - 8))
            dx = int(rng.integers(5, 35))
            draw.line((x, y, x + dx, y + int(rng.integers(-2, 3))), fill=(90, 92, 88, 22), width=1)
    image.convert("RGB").save(OUT / name, "JPEG", quality=91, subsampling=0, optimize=True)


def make_grass():
    n0, n1, n2, n3, grit = layers(3257)
    patch = (n0 - .5) * 17 + (n1 - .5) * 28 + (n2 - .5) * 24
    detail = (n3 - .5) * 20 + (grit - .5) * 25
    green = np.clip(65 + patch + detail, 0, 255)
    red = green * .70 + 2
    blue = green * .63 + 1
    rgb = np.stack((red, green, blue), axis=-1)
    rng = np.random.default_rng(3258)
    blades = grit > .965
    rgb[blades, 1] += rng.integers(8, 25, size=int(blades.sum()))
    rgb[blades, 0] += 2
    save_rgb("e_grass.jpg", rgb)


def make_sky():
    n0, n1, n2, n3, grit = layers(9409)
    y = np.linspace(0, 1, SIZE, dtype=np.float32)[:, None]
    stops = np.array([[3, 6, 17], [7, 17, 37], [19, 35, 57], [40, 53, 68]], dtype=np.float32)
    anchors = np.array([0, .42, .72, 1], dtype=np.float32)
    base = np.stack([np.interp(y[:, 0], anchors, stops[:, k]) for k in range(3)], axis=-1)[:, None, :]
    base = np.broadcast_to(base, (SIZE, SIZE, 3)).copy()
    haze = (n0 - .5) * 8 + (n1 - .5) * 12 + (n2 - .5) * 9
    cloud_field = .55 * n1 + .3 * n2 + .15 * n3
    band = np.exp(-((y - .72) / .12) ** 2)
    clouds = np.clip((cloud_field - .47) * 1.8, 0, 1) * band
    base += haze[..., None]
    base += clouds[..., None] * np.array([18, 23, 31], dtype=np.float32)
    base -= np.maximum(0, .18 - grit)[..., None] * 8
    image = Image.fromarray(np.uint8(np.clip(base, 0, 255)), "RGB").resize((SIZE * 2, SIZE), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(image)
    rng = np.random.default_rng(9410)
    width, height = image.size
    for _ in range(1500):
        x, yy = int(rng.integers(0, width)), int(rng.integers(12, int(height * .62)))
        radius = int(rng.choice([1, 1, 1, 2, 2, 3]))
        color = int(rng.integers(170, 255))
        color3 = (color, color, min(255, color + 5))
        draw.ellipse((x - radius, yy - radius, x + radius, yy + radius), fill=color3)
        if x < 4:
            draw.ellipse((x + width - radius, yy - radius, x + width + radius, yy + radius), fill=color3)
        elif x >= width - 4:
            draw.ellipse((x - width - radius, yy - radius, x - width + radius, yy + radius), fill=color3)
    # Moonlight halo and a small cratered moon; x wrapping keeps the panorama seamless.
    moon_x, moon_y = int(width * .71), int(height * .24)
    halo = Image.new("RGBA", image.size, (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo)
    for radius in range(150, 8, -8):
        alpha = max(1, int(16 * (1 - radius / 158) ** 2))
        halo_draw.ellipse((moon_x-radius, moon_y-radius, moon_x+radius, moon_y+radius), fill=(164, 190, 230, alpha))
    image = Image.alpha_composite(image.convert("RGBA"), halo)
    draw = ImageDraw.Draw(image)
    draw.ellipse((moon_x-12, moon_y-12, moon_x+12, moon_y+12), fill=(229, 233, 219, 255))
    draw.ellipse((moon_x-6, moon_y-8, moon_x+11, moon_y+10), fill=(193, 204, 205, 255))
    for cx, cy, radius in [(moon_x-4, moon_y-2, 2), (moon_x+4, moon_y+4, 3), (moon_x+5, moon_y-5, 1)]:
        draw.ellipse((cx-radius, cy-radius, cx+radius, cy+radius), fill=(173, 188, 195, 220))
    image.convert("RGB").save(OUT / "e_sky.jpg", "JPEG", quality=93, subsampling=0, optimize=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    make_asphalt()
    tile_surface("e_sidewalk.jpg", 151, 4721, 11)
    tile_surface("e_shopfloor.jpg", 208, 6529, 4, scratch=True)
    make_grass()
    make_sky()
