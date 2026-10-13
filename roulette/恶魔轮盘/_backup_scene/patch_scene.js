// One-off patch: brighter horror scene, floor, smaller table, fill lights.
// Uses latin1 so non-UTF8 bytes elsewhere in the files are preserved exactly.
const fs = require('fs');
const root = 'E:\\game\\恶魔轮盘\\src\\js\\';

const FLOOR_FUNCS = `function M_createFloorTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#2b2623'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
        const v = 30 + Math.floor(Math.random() * 30);
        g.fillStyle = 'rgba(' + v + ',' + (v - 4) + ',' + (v - 6) + ',0.5)';
        g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
    g.strokeStyle = 'rgba(8,6,5,0.9)'; g.lineWidth = 3;
    for (let i = 0; i <= 512; i += 128) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke();
    }
    for (let i = 0; i < 7; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, r = 18 + Math.random() * 50;
        const gr = g.createRadialGradient(x, y, 2, x, y, r);
        gr.addColorStop(0, 'rgba(70,6,6,0.75)'); gr.addColorStop(1, 'rgba(70,6,6,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 8);
    return t;
}

function M_addFloorAndFill(tableGroup) {
    // tableGroup.position.y is -0.09, so local y = world y + 0.09
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60),
        new THREE.MeshStandardMaterial({ map: M_createFloorTexture(), roughness: 0.82, metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, -3.07, 0); floor.name = 'gameFloor';
    tableGroup.add(floor);
    const k = (typeof GlobalSettings !== 'undefined') ? GlobalSettings.brightness : 1;
    const mk = (light, base, x, y, z) => {
        light.userData.base = base; light.intensity = base * k;
        light.position.set(x, y + 0.09, z); tableGroup.add(light); return light;
    };
    // fill spot on the opponent side so their items are readable
    const eSpot = mk(new THREE.SpotLight(0xffc89a, 1, 18, Math.PI / 3.2, 0.7, 1.2), 2.4, 0, 7, -5.5);
    eSpot.target.position.set(0, 0.09, -5.5); tableGroup.add(eSpot.target);
    // blood-red glow under the table (lights floor and legs)
    mk(new THREE.PointLight(0xaa2a1a, 1, 14, 1.5), 1.6, 0, -2.2, 0);
    // cold fill on the player side
    mk(new THREE.PointLight(0x556688, 1, 20, 1.5), 0.7, 0, 6, 11);
}

`;

function patch(file, list) {
    let s = fs.readFileSync(root + file, 'latin1');
    for (const [a, b] of list) {
        const n = s.split(a).length - 1;
        if (n !== 1) throw new Error(file + ': anchor count ' + n + ' for: ' + a);
        s = s.replace(a, () => b);
    }
    fs.writeFileSync(root + file, s, 'latin1');
    console.log('patched', file, list.length);
}

patch('models.js', [
    ['new THREE.BoxGeometry(20, 0.18, 14), topMat', 'new THREE.BoxGeometry(12, 0.18, 14), topMat'],
    ['new THREE.BoxGeometry(20, 0.22, 0.06), edgeMat', 'new THREE.BoxGeometry(12, 0.22, 0.06), edgeMat'],
    ['for (const xv of [-10.0, 10.0]) {', 'for (const xv of [-6.0, 6.0]) {'],
    ['[[-9.3,-6.3],[9.3,-6.3],[-9.3,6.3],[9.3,6.3]]', '[[-5.3,-6.3],[5.3,-6.3],[-5.3,6.3],[5.3,6.3]]'],
    ['new THREE.BoxGeometry(18.8, 0.14, 0.18), legMat', 'new THREE.BoxGeometry(10.8, 0.14, 0.18), legMat'],
    ['for (const xv of [-9.0, 9.0]) {', 'for (const xv of [-5.0, 5.0]) {'],
    ['tableGroup.position.y = -0.09;', 'M_addFloorAndFill(tableGroup);\n    tableGroup.position.y = -0.09;'],
    ['function M_buildTableTextured(scene) {', FLOOR_FUNCS + 'function M_buildTableTextured(scene) {'],
    ['new THREE.AmbientLight(0x0a0a0a)', 'new THREE.AmbientLight(0x7a6a6a)'],
    ['ambientLight.intensity = 0.08 * brightness;', 'ambientLight.intensity = 0.32 * brightness;'],
    ['new THREE.SpotLight(0xffffff, 3.5 * brightness, 16,', 'new THREE.SpotLight(0xffffff, 4.2 * brightness, 16,']
]);

patch('game.js', [
    ['new THREE.FogExp2(0x010101, 0.08)', 'new THREE.FogExp2(0x0a0506, 0.035)'],
    ['this.renderer.setClearColor(0x010101);', 'this.renderer.setClearColor(0x0a0506);'],
    ['this.ambientLight.intensity = 0.08 * val;', 'this.ambientLight.intensity = 0.32 * val;'],
    ['if (this.centerSpot) this.centerSpot.intensity = 3.5 * val;',
     'if (this.centerSpot) this.centerSpot.intensity = 4.2 * val;\n        const _tb = this.scene.getObjectByName(\'table\'); if (_tb) _tb.traverse(o => { if (o.isLight && o.userData.base !== undefined) o.intensity = o.userData.base * val; });']
]);
