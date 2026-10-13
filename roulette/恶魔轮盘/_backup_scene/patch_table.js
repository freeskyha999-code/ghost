// Patch 2: redraw the table (distinct from floor), lighter floor, no-cache for dev server.
const fs = require('fs');
const base = 'E:\\game\\恶魔轮盘\\';

const TABLE_V2 = `function M_createTableTopTexture() {
    const W = 1024, H = 1024;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const planks = 7, pw = W / planks;
    for (let p = 0; p < planks; p++) {
        const h = 22 + Math.random() * 8, s = 32 + Math.random() * 12, l = 21 + Math.random() * 7;
        g.fillStyle = 'hsl(' + h + ',' + s + '%,' + l + '%)';
        g.fillRect(p * pw, 0, pw, H);
        for (let i = 0; i < 38; i++) {
            const x0 = p * pw + Math.random() * pw;
            const col = Math.random() < 0.5 ? '15,8,4' : '130,92,60';
            g.strokeStyle = 'rgba(' + col + ',' + (0.10 + Math.random() * 0.22) + ')';
            g.lineWidth = 0.7 + Math.random() * 1.8;
            g.beginPath(); g.moveTo(x0, 0);
            for (let y = 0; y <= H; y += 32) g.lineTo(x0 + (Math.random() - 0.5) * 3 + Math.sin(y * 0.01 + p) * 3, y);
            g.stroke();
        }
        if (Math.random() < 0.7) {
            const kx = p * pw + pw * (0.3 + Math.random() * 0.4), ky = Math.random() * H;
            const gr = g.createRadialGradient(kx, ky, 1, kx, ky, 20);
            gr.addColorStop(0, 'rgba(10,5,2,0.85)'); gr.addColorStop(1, 'rgba(10,5,2,0)');
            g.fillStyle = gr; g.beginPath(); g.ellipse(kx, ky, 15, 28, 0, 0, 7); g.fill();
        }
        g.fillStyle = 'rgba(4,2,1,0.95)'; g.fillRect(p * pw - 1.5, 0, 3, H);
        const jy = Math.random() * H;
        g.fillRect(p * pw, jy, pw, 2.5);
    }
    for (let i = 0; i < 45; i++) {
        const x = Math.random() * W, y = Math.random() * H, a = Math.random() * Math.PI, len = 20 + Math.random() * 90;
        g.strokeStyle = 'rgba(190,160,130,' + (0.05 + Math.random() * 0.12) + ')';
        g.lineWidth = 0.6 + Math.random();
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    const bg = g.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, W * 0.24);
    bg.addColorStop(0, 'rgba(85,6,6,0.88)'); bg.addColorStop(0.5, 'rgba(62,4,4,0.5)'); bg.addColorStop(1, 'rgba(40,2,2,0)');
    g.fillStyle = bg; g.beginPath(); g.ellipse(W * 0.5, H * 0.55, W * 0.24, H * 0.22, -0.3, 0, 7); g.fill();
    for (let i = 0; i < 40; i++) {
        const x = W * 0.25 + Math.random() * W * 0.5, y = H * 0.3 + Math.random() * H * 0.5, r = 1 + Math.random() * 7;
        g.fillStyle = 'rgba(' + (45 + Math.floor(Math.random() * 25)) + ',3,3,' + (0.3 + Math.random() * 0.5) + ')';
        g.beginPath(); g.ellipse(x, y, r, r * (0.4 + Math.random() * 0.8), Math.random() * 3, 0, 7); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
}

function M_buildTableV2(scene) {
    const T = new THREE.Group(); T.name = 'table';
    const Y = 0.09;                       // group sits at y=-0.09, so local y = world y + 0.09
    const HX = 4.6, HZ = 7.0;
    const topMat = new THREE.MeshStandardMaterial({ map: M_createTableTopTexture(), roughness: 0.8, metalness: 0.0 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x2c1b10, roughness: 0.9 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x3d2515, roughness: 0.85 });
    const iron = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.8, roughness: 0.45 });
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y + Y, z); T.add(m); return m; };

    // tabletop: faces order +x,-x,+y,-y,+z,-z
    add(new THREE.BoxGeometry(HX * 2, 0.16, HZ * 2), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat], 0, -0.08, 0);
    // raised rim so the edge reads clearly
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(HX * 2, 0.14, 0.24), trimMat, 0, 0.07, sz * (HZ - 0.12));
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.24, 0.14, HZ * 2 - 0.48), trimMat, sx * (HX - 0.12), 0.07, 0);
    // apron under the top
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(HX * 2 - 0.8, 0.4, 0.2), sideMat, 0, -0.36, sz * (HZ - 0.5));
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.2, 0.4, HZ * 2 - 1.0), sideMat, sx * (HX - 0.5), -0.36, 0);
    // legs, feet, stretchers
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const lx = sx * (HX - 0.6), lz = sz * (HZ - 0.7);
        add(new THREE.BoxGeometry(0.5, 2.96, 0.5), sideMat, lx, -1.64, lz);
        add(new THREE.BoxGeometry(0.6, 0.08, 0.6), iron, lx, -3.12, lz);
        add(new THREE.BoxGeometry(0.7, 0.05, 0.7), iron, sx * (HX - 0.35), 0.165, sz * (HZ - 0.35));
    }
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(HX * 2 - 1.6, 0.16, 0.16), sideMat, 0, -2.0, sz * (HZ - 0.7));
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.16, 0.16, HZ * 2 - 1.8), sideMat, sx * (HX - 0.6), -2.0, 0);

    M_addFloorAndFill(T);
    T.position.y = -0.09;
    scene.add(T);
}

`;

function patch(file, list) {
    let s = fs.readFileSync(base + file, 'latin1');
    for (const [a, b] of list) {
        const n = s.split(a).length - 1;
        if (n !== 1) throw new Error(file + ': anchor count ' + n + ' for: ' + a);
        s = s.replace(a, () => b);
    }
    fs.writeFileSync(base + file, s, 'latin1');
    console.log('patched', file, list.length);
}

patch('src\\js\\models.js', [
    ['function M_buildTableTextured(scene) {', TABLE_V2 + 'function M_buildTableTextured(scene) {'],
    ['M_buildTableTextured(scene);', 'M_buildTableV2(scene);'],
    ["'#2b2623'", "'#3d3834'"]
]);
patch('server.js', [
    ["res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });",
     "res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });"]
]);
