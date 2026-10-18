// Patch 8a: realistic double-barrel shotgun model (models.js) + saw-off support.
const fs = require('fs');
const u = (str) => Buffer.from(str, 'utf8').toString('latin1');
const file = 'E:\\game\\恶魔轮盘\\src\\js\\models.js';
let s = fs.readFileSync(file, 'latin1');

const GUN = u(`function M_walnutTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#4a2a14'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
        const y = Math.random() * 256, a = 0.08 + Math.random() * 0.2;
        g.strokeStyle = (Math.random() < 0.6 ? 'rgba(20,8,2,' : 'rgba(140,90,50,') + a + ')';
        g.lineWidth = 0.6 + Math.random() * 2.2;
        g.beginPath(); g.moveTo(0, y);
        for (let x = 0; x <= 256; x += 32) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 4 + (Math.random() - 0.5) * 2);
        g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

// box that tapers along z (w0,h0 at -z end -> w1,h1 at +z end) with an optional downward curve (comb drop)
function M_taperBox(w0, h0, w1, h1, len, drop, mat) {
    const geo = new THREE.BoxGeometry(1, 1, len, 1, 1, 10);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const t = (p.getZ(i) + len / 2) / len;
        p.setX(i, p.getX(i) * (w0 + (w1 - w0) * t));
        p.setY(i, p.getY(i) * (h0 + (h1 - h0) * t) - drop * t * t);
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
}

// Side-by-side double-barrel shotgun with exposed hammers. Muzzle points to -z, butt to +z.
// Groups 'barrelsLong' / 'barrelsShort' (sawn-off, hidden by default) are swapped by the saw item.
function M_createShotgunModel() {
    const g = new THREE.Group();
    const blued = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.95, roughness: 0.26 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x0c0d0e, metalness: 0.9, roughness: 0.4 });
    const caseHard = new THREE.MeshStandardMaterial({ color: 0x4a4334, metalness: 0.85, roughness: 0.42 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.9, roughness: 0.3 });
    const cutMetal = new THREE.MeshStandardMaterial({ color: 0x8a8a86, metalness: 0.9, roughness: 0.5 });
    const wood = new THREE.MeshStandardMaterial({ map: M_walnutTexture(), roughness: 0.55, metalness: 0.0 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.96 });
    const boreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const makeBarrels = (zBreech, zMuzzle, sawn) => {
        const grp = new THREE.Group();
        const L = zBreech - zMuzzle, cz = (zBreech + zMuzzle) / 2;
        for (const side of [-1, 1]) {
            const ox = side * 0.052;
            const b = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.046, L, 20), blued);
            b.rotation.x = Math.PI / 2; b.position.set(ox, 0.40, cz); grp.add(b);
            const bore = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), boreMat);
            bore.rotation.y = Math.PI; bore.position.set(ox, 0.40, zMuzzle - 0.002); grp.add(bore);
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.048, 18), sawn ? cutMetal : blued);
            ring.rotation.y = Math.PI; ring.position.set(ox, 0.40, zMuzzle - 0.001); grp.add(ring);
        }
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.016, L), darkSteel);
        rib.position.set(0, 0.446, cz); grp.add(rib);
        const bandZ = sawn ? [-0.75] : [-0.9, -2.6];
        for (const bz of bandZ) {
            const band = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.05, 0.07), darkSteel);
            band.position.set(0, 0.40, bz); grp.add(band);
        }
        if (!sawn) {
            const bead = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), brass);
            bead.position.set(0, 0.462, zMuzzle + 0.07); grp.add(bead);
            const mid = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6, roughness: 0.3 }));
            mid.position.set(0, 0.458, zMuzzle + 1.9); grp.add(mid);
        }
        return grp;
    };
    const longG = makeBarrels(0.45, -3.95, false); longG.name = 'barrelsLong'; g.add(longG);
    const shortG = makeBarrels(0.45, -2.10, true); shortG.name = 'barrelsShort'; shortG.visible = false; g.add(shortG);

    // action body, top strap, side plates, hinge pin, top lever
    const action = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.27, 1.0), caseHard); action.position.set(0, 0.33, 0.95); g.add(action);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.014, 0.95), darkSteel); strap.position.set(0, 0.472, 1.1); g.add(strap);
    for (const side of [-1, 1]) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.15, 0.55), caseHard); plate.position.set(side * 0.174, 0.34, 1.05); g.add(plate);
        for (let i = 0; i < 3; i++) {
            const line = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.006, 0.40 - i * 0.08), darkSteel);
            line.position.set(side * 0.176, 0.30 + i * 0.04, 1.05); g.add(line);
        }
        const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.12, 0.05), darkSteel);
        hammer.position.set(side * 0.072, 0.53, 1.30); hammer.rotation.x = -0.5; g.add(hammer);
        const spur = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.055, 8), blued);
        spur.rotation.z = Math.PI / 2; spur.position.set(side * 0.072, 0.585, 1.35); g.add(spur);
    }
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.36, 10), brass);
    pin.rotation.z = Math.PI / 2; pin.position.set(0, 0.30, 0.50); g.add(pin);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.22), blued); lever.position.set(0, 0.486, 1.30); lever.rotation.y = 0.35; g.add(lever);

    // forend with latch and tip cap
    const forend = M_taperBox(0.26, 0.17, 0.22, 0.12, 1.35, 0.0, wood); forend.position.set(0, 0.235, -0.28); g.add(forend);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.10, 0.04), darkSteel); tip.position.set(0, 0.24, -0.97); g.add(tip);
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.12), brass); latch.position.set(0, 0.155, 0.22); g.add(latch);

    // trigger guard and double triggers
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.013, 8, 22), blued);
    guard.rotation.x = Math.PI / 2; guard.scale.set(1.1, 0.55, 1.0); guard.position.set(0, 0.17, 1.55); g.add(guard);
    for (const tz of [1.46, 1.60]) {
        const trig = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.07, 0.020), blued);
        trig.position.set(0, 0.21, tz); trig.rotation.x = 0.3; g.add(trig);
    }

    // tapered stock with comb drop, buttplate, sling swivel
    const stock = M_taperBox(0.17, 0.22, 0.25, 0.40, 2.2, 0.14, wood); stock.position.set(0, 0.30, 2.62); g.add(stock);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.255, 0.43, 0.05), rubber); pad.position.set(0, 0.16, 3.74); g.add(pad);
    const swivel = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 12), brass); swivel.position.set(0, 0.05, 3.35); g.add(swivel);
    return g;
}

// the cut-off barrel stub (two tubes), origin at its centre, muzzle toward -z
function M_createBarrelPiece() {
    const g = new THREE.Group();
    const blued = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.95, roughness: 0.26 });
    const cutMetal = new THREE.MeshStandardMaterial({ color: 0x8a8a86, metalness: 0.9, roughness: 0.5 });
    const L = 1.85;
    for (const side of [-1, 1]) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.046, L, 16), blued);
        b.rotation.x = Math.PI / 2; b.position.set(side * 0.052, 0, 0); g.add(b);
        const cut = new THREE.Mesh(new THREE.RingGeometry(0.0, 0.050, 16), cutMetal);
        cut.position.set(side * 0.052, 0, L / 2 + 0.001); g.add(cut);
    }
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.016, L), blued); rib.position.set(0, 0.046, 0); g.add(rib);
    return g;
}

function M_buildShotgunDouble(scene) {
    const g = M_createShotgunModel();
    g.name = 'gunGroup';
    g.position.set(0, 0.46, 0);
    scene.add(g);
}
`);

const a = s.indexOf('function M_buildShotgunDouble(scene) {');
if (a < 0) throw new Error('gun start not found');
const re = /scene\.add\(g\);\s*\}/g; re.lastIndex = a;
const m = re.exec(s);
if (!m) throw new Error('gun end not found');
const b = m.index + m[0].length;
s = s.slice(0, a) + GUN + s.slice(b);
fs.writeFileSync(file, s, 'latin1');
console.log('models.js: new shotgun model written');
