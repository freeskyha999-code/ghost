#!/usr/bin/env python3
"""用同一份场景数据做软件渲染，生成封面（全景），写入 meta.json 的 cover 字段（每 100 字符一项）。
用法: villa_cover.py <assets 目录> <顶点数据 .bin> <meta.json>"""
import base64, io, json, math, sys
import numpy as np
from PIL import Image

AS, BIN, META = sys.argv[1:4]
T = json.load(open(f'{AS}/pack.json'))['t']
AW = 512
AH = ((len(T) + 31) // 32) * 16
at = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
for i, t in enumerate(T):
    im = Image.open(f'{AS}/textures/{t}.png').convert('RGBA')
    at.paste(im.crop((0, 0, im.width, im.width)).resize((16, 16), Image.NEAREST), ((i % 32) * 16, (i // 32) * 16))
A = np.array(at)
V = np.fromfile(BIN, dtype=np.float32).reshape(-1, 10)
SKY = np.array([.53, .74, .96]) * 255


def render(e, yaw, pit, w, h, fov=1.2):
    cp, sp = math.cos(pit), math.sin(pit)
    f = np.array([-math.sin(yaw) * cp, sp, -math.cos(yaw) * cp])
    r = np.array([-f[2], 0, f[0]]); r /= np.linalg.norm(r); u = np.cross(r, f)
    P = V[:, :3] - np.array(e)
    x, y, z = P @ r, P @ u, P @ f
    t = 1 / math.tan(fov / 2)
    zz = np.maximum(z, 1e-6)
    px = ((x * t / (w / h)) / zz * .5 + .5) * w
    py = (1 - ((y * t) / zz * .5 + .5)) * h
    img = np.zeros((h, w, 3), np.float32); img[:] = SKY
    zb = np.full((h, w), 1e9, np.float32)
    n = len(V) // 3
    X, Y, Z = px.reshape(n, 3), py.reshape(n, 3), z.reshape(n, 3)
    ok = (Z > .08).all(1) & (X.max(1) > 0) & (X.min(1) < w) & (Y.max(1) > 0) & (Y.min(1) < h) & (Z.min(1) < 95)
    for k in np.nonzero(ok)[0]:
        x0, y0, z0, vv = X[k], Y[k], Z[k], V[k * 3:k * 3 + 3]
        a0, a1 = max(int(x0.min()), 0), min(int(x0.max()) + 1, w - 1)
        b0, b1 = max(int(y0.min()), 0), min(int(y0.max()) + 1, h - 1)
        if a1 < a0 or b1 < b0: continue
        den = (y0[1] - y0[2]) * (x0[0] - x0[2]) + (x0[2] - x0[1]) * (y0[0] - y0[2])
        if abs(den) < 1e-9: continue
        gx, gy = np.meshgrid(np.arange(a0, a1 + 1) + .5, np.arange(b0, b1 + 1) + .5)
        a = ((y0[1] - y0[2]) * (gx - x0[2]) + (x0[2] - x0[1]) * (gy - y0[2])) / den
        b = ((y0[2] - y0[0]) * (gx - x0[2]) + (x0[0] - x0[2]) * (gy - y0[2])) / den
        c = 1 - a - b
        m = (a >= -1e-4) & (b >= -1e-4) & (c >= -1e-4)
        if not m.any(): continue
        d = 1 / np.maximum(a / z0[0] + b / z0[1] + c / z0[2], 1e-9)
        u_ = (a * vv[0, 3] / z0[0] + b * vv[1, 3] / z0[1] + c * vv[2, 3] / z0[2]) * d
        v_ = (a * vv[0, 4] / z0[0] + b * vv[1, 4] / z0[1] + c * vv[2, 4] / z0[2]) * d
        tc = A[np.clip((v_ * AH).astype(int), 0, AH - 1), np.clip((u_ * AW).astype(int), 0, AW - 1)].astype(np.float32)
        m &= (tc[..., 3] > 25) & (d < zb[b0:b1 + 1, a0:a1 + 1])
        if not m.any(): continue
        col = a[..., None] * vv[0, 5:8] + b[..., None] * vv[1, 5:8] + c[..., None] * vv[2, 5:8]
        li = np.maximum(a * vv[0, 8] + b * vv[1, 8] + c * vv[2, 8], a * vv[0, 9] + b * vv[1, 9] + c * vv[2, 9])
        o = tc[..., :3] * col * (.06 + .94 * li * li)[..., None]
        fg = np.clip((d - 55) / 40, 0, 1)[..., None]
        o = o * (1 - fg) + SKY * fg
        img[b0:b1 + 1, a0:a1 + 1][m] = o[m]; zb[b0:b1 + 1, a0:a1 + 1][m] = d[m]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


cover = render((39.5, 13, 60), 0, .1, 640, 400)
buf = io.BytesIO(); cover.save(buf, 'WEBP', quality=60, method=6)
b64 = base64.b64encode(buf.getvalue()).decode()
uri = 'data:image/webp;base64,' + b64
meta = json.load(open(META))
meta['cover'] = [uri[i:i + 100] for i in range(0, len(uri), 100)]
json.dump(meta, open(META, 'w'), ensure_ascii=False, indent=2)
Image.open(io.BytesIO(base64.b64decode(b64))).load()  # 解码自检
print('封面', len(buf.getvalue()) // 1024, 'KB')
