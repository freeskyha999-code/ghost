// Patch 3: felt tabletop with wide wooden rim, self-lit floor, fog-free item grids.
const fs = require('fs');
const f = 'E:\\game\\恶魔轮盘\\src\\js\\models.js';
let s = fs.readFileSync(f, 'latin1');

const FELT = `function M_createTableTopTexture() {
    const W = 1024, H = 1024;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#21402f'; g.fillRect(0, 0, W, H);
    // felt fibres
    for (let i = 0; i < 9000; i++) {
        const x = Math.random() * W, y = Math.random() * H, a = Math.random() * 6.28, len = 2 + Math.random() * 6;
        const v = Math.random();
        g.strokeStyle = v < 0.5 ? 'rgba(10,25,16,' + (0.15 + Math.random() * 0.25) + ')' : 'rgba(90,140,105,' + (0.05 + Math.random() * 0.1) + ')';
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    // worn, lighter patches
    for (let i = 0; i < 14; i++) {
        const x = Math.random() * W, y = Math.random() * H, r = 50 + Math.random() * 120;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(120,150,120,0.14)'); gr.addColorStop(1, 'rgba(120,150,120,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // stitched border line
    g.strokeStyle = 'rgba(190,170,110,0.55)'; g.lineWidth = 3; g.setLineDash([14, 9]);
    g.strokeRect(W * 0.035, H * 0.025, W * 0.93, H * 0.95);
    g.setLineDash([]);
    // dark edge vignette
    const vg = g.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(0,0,0,0.35)'); vg.addColorStop(0.12, 'rgba(0,0,0,0)');
    vg.addColorStop(0.88, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    // cigarette burns
    for (let i = 0; i < 9; i++) {
        const x = Math.random() * W, y = Math.random() * H, r = 5 + Math.random() * 8;
        const gr = g.createRadialGradient(x, y, 1, x, y, r);
        gr.addColorStop(0, 'rgba(5,3,2,0.95)'); gr.addColorStop(0.6, 'rgba(25,15,8,0.8)'); gr.addColorStop(1, 'rgba(25,15,8,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // blood pool and splatter
    const bg = g.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, W * 0.24);
    bg.addColorStop(0, 'rgba(95,8,8,0.9)'); bg.addColorStop(0.5, 'rgba(70,5,5,0.55)'); bg.addColorStop(1, 'rgba(45,3,3,0)');
    g.fillStyle = bg; g.beginPath(); g.ellipse(W * 0.5, H * 0.55, W * 0.24, H * 0.2, -0.3, 0, 7); g.fill();
    for (let i = 0; i < 50; i++) {
        const x = W * 0.2 + Math.random() * W * 0.6, y = H * 0.25 + Math.random() * H * 0.55, r = 1 + Math.random() * 8;
        g.fillStyle = 'rgba(' + (60 + Math.floor(Math.random() * 30)) + ',5,5,' + (0.4 + Math.random() * 0.5) + ')';
        g.beginPath(); g.ellipse(x, y, r, r * (0.4 + Math.random() * 0.8), Math.random() * 3, 0, 7); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
}

`;

const a = s.indexOf('function M_createTableTopTexture() {');
const b = s.indexOf('function M_buildTableV2(scene) {');
if (a < 0 || b < 0 || b < a) throw new Error('texture markers not found');
s = s.slice(0, a) + FELT + s.slice(b);

function rep(x, y) {
    const n = s.split(x).length - 1;
    if (n !== 1) throw new Error('anchor count ' + n + ' for: ' + x);
    s = s.replace(x, () => y);
}
rep('add(new THREE.BoxGeometry(HX * 2, 0.14, 0.24), trimMat, 0, 0.07, sz * (HZ - 0.12));',
    'add(new THREE.BoxGeometry(HX * 2, 0.2, 0.5), trimMat, 0, 0.10, sz * (HZ - 0.25));');
rep('add(new THREE.BoxGeometry(0.24, 0.14, HZ * 2 - 0.48), trimMat, sx * (HX - 0.12), 0.07, 0);',
    'add(new THREE.BoxGeometry(0.5, 0.2, HZ * 2 - 1.0), trimMat, sx * (HX - 0.25), 0.10, 0);');
rep('color: 0x3d2515, roughness: 0.85', 'color: 0x4a2c18, roughness: 0.8');
rep('add(new THREE.BoxGeometry(0.7, 0.05, 0.7), iron, sx * (HX - 0.35), 0.165, sz * (HZ - 0.35));',
    'add(new THREE.BoxGeometry(0.7, 0.05, 0.7), iron, sx * (HX - 0.4), 0.22, sz * (HZ - 0.4));');
rep('new THREE.MeshStandardMaterial({ map: M_createFloorTexture(), roughness: 0.82, metalness: 0.05 })',
    '(() => { const ft = M_createFloorTexture(); return new THREE.MeshStandardMaterial({ map: ft, emissive: 0x2a2420, emissiveMap: ft, emissiveIntensity: 0.55, roughness: 0.82, metalness: 0.05 }); })()');
rep('new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: true })',
    'new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: true, fog: false })');

fs.writeFileSync(f, s, 'latin1');
console.log('patched models.js');
