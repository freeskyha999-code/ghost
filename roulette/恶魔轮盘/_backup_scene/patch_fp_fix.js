// Patch 6: fix first-person cigarette hitch (no new light, clamp animation dt, pre-warm shaders).
const fs = require('fs');
const f = 'E:\\game\\恶魔轮盘\\src\\js\\game.js';
let s = fs.readFileSync(f, 'latin1');
function rep(a, b) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error('anchor count ' + n + ' for: ' + a);
    s = s.replace(a, () => b);
}

// 1. no extra light (light count change forces a full shader recompile = the freeze)
rep('const handLight = new THREE.PointLight(0xffe0c0, 0.8, 2.2); handLight.position.set(0.1, 0.1, 0.1); rig.add(handLight);',
    '// no extra light here: changing the light count recompiles every shader and freezes the game');
// hand lit by its own emissive instead
rep('const skin = new THREE.MeshStandardMaterial({ color: 0xc2987a, roughness: 0.75 });',
    'const skin = new THREE.MeshStandardMaterial({ color: 0xc2987a, roughness: 0.75, emissive: 0x4a3526 });');
rep('const cloth = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.95 });',
    'const cloth = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.95, emissive: 0x0c0c10 });');

// 2. animation clock: a long frame can no longer skip phases
rep('this._camShot = { t0: performance.now(), dur: dur, fn: fn };',
    'this._camShot = { t0: performance.now(), last: performance.now(), el: 0, dur: dur, fn: fn };');
rep('const k = this._camShot, kp = Math.min((now - k.t0) / k.dur, 1);',
    'const k = this._camShot; k.el += Math.min(now - k.last, 50); k.last = now; const kp = Math.min(k.el / k.dur, 1);');

// 3. pre-warm: compile smoke sprite + hand materials once at game start
const WARM = `_fpWarmup() {
        if (this._fpReady) return; this._fpReady = true;
        try {
            const cam = this.camera;
            if (cam.parent !== this.scene) this.scene.add(cam);
            const tmp = new THREE.Group();
            const wc = document.createElement('canvas'); wc.width = wc.height = 8;
            const wtex = new THREE.CanvasTexture(wc);
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: wtex, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false, color: 0xbbbbbb }));
            const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), new THREE.MeshStandardMaterial({ color: 0xc2987a, roughness: 0.75, emissive: 0x4a3526 }));
            const m2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.01, 6), new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.95, emissive: 0x0c0c10 }));
            tmp.add(sp); tmp.add(m1); tmp.add(m2); tmp.position.set(0, 0, 3);
            cam.add(tmp);
            this.renderer.compile(this.scene, cam);
            cam.remove(tmp);
            wtex.dispose(); sp.material.dispose(); m1.geometry.dispose(); m1.material.dispose(); m2.geometry.dispose(); m2.material.dispose();
        } catch (e) { /* warm-up is optional */ }
    }
    `;
rep('_camHome() {', WARM + '_camHome() {');
rep('if (this.scene) this.scene.muteEnemyItemSounds = this.isRemote;',
    'if (this.scene) { this.scene.muteEnemyItemSounds = this.isRemote; if (this.scene._fpWarmup) this.scene._fpWarmup(); }');

fs.writeFileSync(f, s, 'latin1');
console.log('patched game.js (6 edits)');
