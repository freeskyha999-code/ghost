// Patch 5: items rest on the table + first-person cigarette animation (camera shot).
const fs = require('fs');
const base = 'E:\\game\\恶魔轮盘\\src\\js\\';

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

const FP = `_camHome() {
        const cam = this.camera;
        cam.position.set(0, 5.2, (window.innerWidth <= 768) ? 12.0 : 10.2);
        cam.lookAt(0, 0.5, 0);
        cam.fov = 60; cam.updateProjectionMatrix();
    }
    _runCamShot(dur, fn, done) {
        this._camShot = { t0: performance.now(), dur: dur, fn: fn };
        this._camShotDone = done || null;
    }

    // First-person cigarette: camera leans to a seated eye view, hand lifts the cigarette to the mouth,
    // inhale (ember glow), exhale (smoke in front of the face), flick away, camera returns.
    playCigaretteFirstPerson(userPosition, onComplete) {
        const cam = this.camera;
        if (cam.parent !== this.scene) this.scene.add(cam);
        const TOTAL = 4300;
        const clamp01 = (x) => Math.max(0, Math.min(1, x));
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        const seg = (t, a, b) => clamp01((t - a) / (b - a));
        const lerp = (a, b, t) => a + (b - a) * t;
        const V = (x, y, z) => new THREE.Vector3(x, y, z);

        // ---- hand rig, lives in camera space ----
        const rig = new THREE.Group();
        const skin = new THREE.MeshStandardMaterial({ color: 0xc2987a, roughness: 0.75 });
        const cloth = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.95 });
        const sleeveGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.0, 12); sleeveGeo.translate(0, -0.5, 0);
        const sleeve = new THREE.Mesh(sleeveGeo, cloth); sleeve.rotation.z = 0.85; sleeve.position.set(0.02, -0.12, 0.12); rig.add(sleeve);
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.13), skin); palm.position.set(0, -0.1, 0.1); palm.rotation.z = 0.3; rig.add(palm);
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.015, 0.12, 8), skin); thumb.position.set(-0.04, -0.035, 0.07); thumb.rotation.z = -0.9; rig.add(thumb);
        const indexF = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.14, 8), skin); indexF.position.set(0.035, -0.02, 0.06); indexF.rotation.z = 0.9; rig.add(indexF);
        const cig = this.createCigaretteModel(); cig.scale.setScalar(0.85); cig.position.set(0, 0, -0.12); rig.add(cig);
        const handLight = new THREE.PointLight(0xffe0c0, 0.8, 2.2); handLight.position.set(0.1, 0.1, 0.1); rig.add(handLight);
        let ember = null, fire = null;
        cig.traverse((o) => {
            if (o.isPointLight) fire = o;
            else if (o.isMesh && o.material && o.material.emissiveIntensity > 1) ember = o;
        });
        const ember0 = ember ? ember.material.emissiveIntensity : 2, fire0 = fire ? fire.intensity : 1.6;
        cam.add(rig);

        // ---- screen glow while inhaling ----
        const glow = document.createElement('div');
        glow.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:4;opacity:0;' +
            'background:radial-gradient(ellipse at 50% 105%, rgba(255,110,30,0.55), rgba(255,60,10,0.15) 40%, rgba(0,0,0,0) 65%)';
        document.body.appendChild(glow);

        // ---- smoke puffs, also in camera space ----
        const sc = document.createElement('canvas'); sc.width = sc.height = 64;
        const sg = sc.getContext('2d'); const grd = sg.createRadialGradient(32, 32, 2, 32, 32, 30);
        grd.addColorStop(0, 'rgba(215,215,215,0.9)'); grd.addColorStop(1, 'rgba(215,215,215,0)');
        sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);
        const smokeTex = new THREE.CanvasTexture(sc);
        const puffs = [];
        let lastPuff = 0;
        const spawnPuff = (now) => {
            const m = new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false, color: 0xbbbbbb });
            const sp = new THREE.Sprite(m); sp.renderOrder = 999;
            sp.position.set((Math.random() - 0.5) * 0.05, -0.27, -0.38); sp.scale.setScalar(0.08);
            cam.add(sp);
            puffs.push({ sp: sp, born: now, last: now, life: 1400 + Math.random() * 900,
                vx: (Math.random() - 0.5) * 0.10, vy: 0.03 + Math.random() * 0.07, vz: -(0.18 + Math.random() * 0.22) });
        };

        // ---- poses (camera space) ----
        const OFF = { p: V(0.55, -0.85, -0.5), r: V(0.3, -0.6, 0.3) };
        const R1 = { p: V(0.26, -0.20, -0.52), r: V(0.1, -0.45, 0.15) };
        const M = { p: V(0.0, -0.19, -0.34), r: V(0.55, 0.0, 0.0) };
        const R3 = { p: V(0.30, -0.34, -0.5), r: V(0.15, -0.5, 0.25) };
        const OUT = { p: V(0.6, -0.9, -0.45), r: V(0.6, -0.4, 0.5) };
        const mix = (a, b, t) => ({ p: a.p.clone().lerp(b.p, t), r: a.r.clone().lerp(b.r, t) });

        const HOME_POS = V(0, 5.2, (window.innerWidth <= 768) ? 12.0 : 10.2), HOME_LOOK = V(0, 0.5, 0);
        const FP_POS = V(0, 3.1, 8.4), FP_LOOK = V(0, 1.1, 2.0);

        this._runCamShot(TOTAL, (p, camera) => {
            const t = p * TOTAL / 1000;
            const now = performance.now();

            // camera: lean in, bow head on inhale, tilt back on exhale, return
            const c = ease(seg(t, 0, 0.6)) - ease(seg(t, 3.7, 4.3));
            const inhale = ease(seg(t, 1.0, 1.5)) * (1 - ease(seg(t, 2.3, 2.8)));
            const exhale = ease(seg(t, 2.3, 3.0)) * (1 - ease(seg(t, 3.3, 3.9)));
            const look = HOME_LOOK.clone().lerp(FP_LOOK, c);
            look.y += -0.35 * inhale + 0.8 * exhale;
            camera.position.copy(HOME_POS).lerp(FP_POS, c);
            camera.position.y += 0.03 * Math.sin(t * 2.2) * c;
            camera.lookAt(look);
            camera.fov = lerp(60, 55, c); camera.updateProjectionMatrix();

            // hand pose
            let pose = mix(OFF, R1, ease(seg(t, 0, 0.55)));
            pose = mix(pose, M, ease(seg(t, 0.5, 1.3)));
            pose = mix(pose, R3, ease(seg(t, 2.35, 3.3)));
            pose = mix(pose, OUT, ease(seg(t, 3.45, 3.95)));
            rig.position.copy(pose.p); rig.rotation.set(pose.r.x, pose.r.y, pose.r.z);
            rig.visible = t < 4.0;

            // ember / fire light / screen glow
            const burn = ease(seg(t, 1.2, 1.7)) * (1 - ease(seg(t, 2.2, 2.7)));
            if (ember) ember.material.emissiveIntensity = ember0 + 3.5 * burn;
            if (fire) fire.intensity = fire0 + 3.0 * burn;
            glow.style.opacity = String(0.8 * burn);

            // smoke while exhaling
            if (t > 2.4 && t < 3.3 && now - lastPuff > 35) { lastPuff = now; spawnPuff(now); spawnPuff(now); }
            for (let i = puffs.length - 1; i >= 0; i--) {
                const q = puffs[i], f = (now - q.born) / q.life, dt = (now - q.last) / 1000; q.last = now;
                if (f >= 1) { cam.remove(q.sp); q.sp.material.dispose(); puffs.splice(i, 1); continue; }
                q.sp.position.x += q.vx * dt; q.sp.position.y += q.vy * dt; q.sp.position.z += q.vz * dt;
                q.sp.material.opacity = 0.55 * Math.pow(Math.sin(Math.PI * f), 0.7);
                q.sp.scale.setScalar(0.08 + 0.9 * f);
            }
        }, () => {
            cam.remove(rig);
            for (const q of puffs) { cam.remove(q.sp); q.sp.material.dispose(); }
            puffs.length = 0;
            if (glow.parentNode) glow.parentNode.removeChild(glow);
            smokeTex.dispose();
            const butt = this.createCigaretteModel();
            butt.position.copy(userPosition).add(new THREE.Vector3(0, 0.25, 0.15)); this.scene.add(butt);
            this.addDiscardedItem(butt, new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15));
            if (onComplete) onComplete();
        });
    }

    `;

patch('game.js', [
    // item rest height
    ['return slots[slotIndex % 8];', 'const _r = slots[slotIndex % 8]; _r.y = 0.12; return _r;'],
    ['const targetPos = getItemSlotPosition(itemData.slotIndex, side);',
     'const targetPos = getItemSlotPosition(itemData.slotIndex, side); targetPos.y += model.userData.restOffset || 0;'],
    ["model.position.copy(getItemSlotPosition(slotIndex, 'player'));",
     "model.position.copy(getItemSlotPosition(slotIndex, 'player')); model.position.y += model.userData.restOffset || 0;"],
    ["model.position.copy(getItemSlotPosition(slotIndex, 'enemy'));",
     "model.position.copy(getItemSlotPosition(slotIndex, 'enemy')); model.position.y += model.userData.restOffset || 0;"],
    // camera shot hook in render
    ['const cam = this.camera, now = performance.now();',
     'const cam = this.camera, now = performance.now();\n' +
     '        if (this._camShot) { const k = this._camShot, kp = Math.min((now - k.t0) / k.dur, 1); k.fn(kp, cam); if (kp >= 1) { this._camShot = null; this._camHome(); if (this._camShotDone) { const d = this._camShotDone; this._camShotDone = null; d(); } } }'],
    // cigarette entry point
    ['playCigaretteAnimation(userPosition, onComplete) {',
     FP + 'playCigaretteAnimation(userPosition, onComplete, isSelf) {\n        if (isSelf) { this.playCigaretteFirstPerson(userPosition, onComplete); return; }'],
    ['this.scene.playCigaretteAnimation(userPos, () => { setTimeout(() => this.finalizeAction(), 500); });',
     'this.scene.playCigaretteAnimation(userPos, () => { setTimeout(() => this.finalizeAction(), 500); }, isSelf);']
]);

patch('models.js', [
    ['if (model) model.scale.set(1.35, 1.35, 1.35);',
     'if (model) {\n        model.scale.set(1.35, 1.35, 1.35);\n        model.updateMatrixWorld(true);\n        const _bb = new THREE.Box3().setFromObject(model);\n        model.userData.restOffset = isFinite(_bb.min.y) ? -_bb.min.y : 0;\n    }']
]);
