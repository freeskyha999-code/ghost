// Patch 7: first-person animations for beer, handcuffs, saw, morphine, taser, magnifier.
const fs = require('fs');
const f = 'E:\\game\\恶魔轮盘\\src\\js\\game.js';
let s = fs.readFileSync(f, 'latin1');
function rep(a, b) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error('anchor count ' + n + ' for: ' + a);
    s = s.replace(a, () => b);
}
// taser sound: must run BEFORE the new code is inserted (the new code also contains this text)
rep("audioMgr.play('taser');", "if (!isSelf) audioMgr.play('taser');");

const FPX = `_fpTexGet(kind) {
        this._fpTex = this._fpTex || {};
        if (this._fpTex[kind]) return this._fpTex[kind];
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30);
        if (kind === 'spark') {
            gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.3, 'rgba(255,190,80,0.85)'); gr.addColorStop(1, 'rgba(255,120,20,0)');
        } else {
            gr.addColorStop(0, 'rgba(215,215,215,0.9)'); gr.addColorStop(1, 'rgba(215,215,215,0)');
        }
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        this._fpTex[kind] = new THREE.CanvasTexture(c);
        return this._fpTex[kind];
    }
    _fpTake() { const f = this._fpSelf; this._fpSelf = false; return !!f; }
    _fpHandRig() {
        const rig = new THREE.Group();
        const skin = new THREE.MeshStandardMaterial({ color: 0xc2987a, roughness: 0.75, emissive: 0x4a3526 });
        const cloth = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.95, emissive: 0x0c0c10 });
        const sleeveGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.0, 12); sleeveGeo.translate(0, -0.5, 0);
        const sleeve = new THREE.Mesh(sleeveGeo, cloth); sleeve.rotation.z = 0.85; sleeve.position.set(0.02, -0.12, 0.12); rig.add(sleeve);
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.13), skin); palm.position.set(0, -0.1, 0.1); palm.rotation.z = 0.3; rig.add(palm);
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.015, 0.12, 8), skin); thumb.position.set(-0.04, -0.035, 0.07); thumb.rotation.z = -0.9; rig.add(thumb);
        const indexF = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.14, 8), skin); indexF.position.set(0.035, -0.02, 0.06); indexF.rotation.z = 0.9; rig.add(indexF);
        const hold = new THREE.Group(); hold.position.set(0, 0, 0.06); rig.add(hold);
        return { rig: rig, hold: hold };
    }
    // Generic first-person shot. cfg: dur(s), cam{pos,look,fov,in,out,looks,fovKeys}, hand keys or handFn,
    // build(ctx), events[[t,fn]], tick(t,st,ctx), finish(st,ctx), handEnd
    _fpPlay(cfg, onComplete) {
        const cam = this.camera;
        if (cam.parent !== this.scene) this.scene.add(cam);
        const clamp01 = (x) => Math.max(0, Math.min(1, x));
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        const seg = (t, a, b) => clamp01((t - a) / (b - a));
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        const hr = this._fpHandRig(); const rig = hr.rig; cam.add(rig);
        const ctx = { cam: cam, rig: rig, hold: hr.hold, t: 0, now: performance.now(), particles: [], overlays: [], flights: [], V: V, ease: ease, seg: seg, clamp01: clamp01 };
        ctx.strip = (m) => { const ls = []; m.traverse((o) => { if (o.isLight) ls.push(o); }); ls.forEach((l) => { if (l.parent) l.parent.remove(l); }); return m; };
        ctx.puff = (o) => {
            const m = new THREE.SpriteMaterial({ map: this._fpTexGet(o.tex || 'smoke'), transparent: true, opacity: 0, depthTest: !!o.depth, depthWrite: false, fog: false,
                color: o.color || 0xbbbbbb, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending });
            const sp = new THREE.Sprite(m); sp.renderOrder = 999; sp.position.set(o.pos[0], o.pos[1], o.pos[2]); sp.scale.setScalar(o.s0 || 0.08);
            (o.world ? this.scene : cam).add(sp);
            ctx.particles.push({ sp: sp, born: ctx.now, last: ctx.now, life: o.life || 1000, v: (o.vel || [0, 0, 0]).slice(), g: o.g || 0,
                s0: o.s0 || 0.08, s1: o.s1 || 0.5, op: o.op || 0.5, fadeOut: !!o.fadeOut });
        };
        ctx.overlay = (css) => {
            const d = document.createElement('div');
            d.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:4;opacity:0;' + css;
            document.body.appendChild(d); ctx.overlays.push(d); return d;
        };
        ctx.throwModel = (model, to, dur, spin, onLand) => {
            model.updateMatrixWorld(true);
            const wp = new THREE.Vector3(), wq = new THREE.Quaternion();
            model.getWorldPosition(wp); model.getWorldQuaternion(wq);
            if (model.parent) model.parent.remove(model);
            model.position.copy(wp); model.quaternion.copy(wq); this.scene.add(model);
            ctx.flights.push({ m: model, from: wp.clone(), to: to.clone(), t0: ctx.t, dur: dur, spin: !!spin, done: false, onLand: onLand });
        };
        const st = cfg.build ? (cfg.build(ctx) || {}) : {};
        const fired = (cfg.events || []).map(() => false);
        const HOME_POS = V(0, 5.2, (window.innerWidth <= 768) ? 12.0 : 10.2), HOME_LOOK = V(0, 0.5, 0);
        const kfv = (arr, t) => {
            if (t <= arr[0][0]) return arr[0].slice(1);
            for (let i = 1; i < arr.length; i++) {
                if (t <= arr[i][0]) {
                    const a = arr[i - 1], b = arr[i], u = ease(clamp01((t - a[0]) / (b[0] - a[0])));
                    return a.slice(1).map((v, k) => v + (b[k + 1] - v) * u);
                }
            }
            return arr[arr.length - 1].slice(1);
        };
        const cm = cfg.cam;
        this._runCamShot(cfg.dur * 1000, (p, camera) => {
            const t = p * cfg.dur, now = performance.now(); ctx.t = t; ctx.now = now;
            const c = ease(seg(t, cm.in[0], cm.in[1])) - ease(seg(t, cm.out[0], cm.out[1]));
            const look = HOME_LOOK.clone().lerp(V(cm.look[0], cm.look[1], cm.look[2]), c);
            if (cm.looks) { const d = kfv(cm.looks, t); look.x += d[0]; look.y += d[1]; }
            camera.position.copy(HOME_POS).lerp(V(cm.pos[0], cm.pos[1], cm.pos[2]), c);
            camera.lookAt(look);
            camera.fov = 60 + ((cm.fov || 55) - 60) * c + (cm.fovKeys ? kfv(cm.fovKeys, t)[0] : 0);
            camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
            if (cfg.handFn) cfg.handFn(t, ctx, st);
            else { const h = kfv(cfg.hand, t); rig.position.set(h[0], h[1], h[2]); rig.rotation.set(h[3], h[4], h[5]); }
            rig.visible = t < (cfg.handEnd || (cfg.dur - 0.1));
            for (let i = 0; i < fired.length; i++) { if (!fired[i] && t >= cfg.events[i][0]) { fired[i] = true; cfg.events[i][1](st, ctx); } }
            if (cfg.tick) cfg.tick(t, st, ctx);
            for (const fl of ctx.flights) {
                const fr = clamp01((t - fl.t0) / fl.dur);
                fl.m.position.lerpVectors(fl.from, fl.to, fr); fl.m.position.y += 1.2 * Math.sin(Math.PI * fr);
                if (fl.spin && fr < 1) { fl.m.rotation.x += 0.3; fl.m.rotation.z += 0.18; }
                if (fr >= 1 && !fl.done) { fl.done = true; if (fl.onLand) fl.onLand(); }
            }
            for (let i = ctx.particles.length - 1; i >= 0; i--) {
                const q = ctx.particles[i], fq = (now - q.born) / q.life, dt = Math.min((now - q.last) / 1000, 0.05); q.last = now;
                if (fq >= 1) { if (q.sp.parent) q.sp.parent.remove(q.sp); q.sp.material.dispose(); ctx.particles.splice(i, 1); continue; }
                q.v[1] -= q.g * dt;
                q.sp.position.x += q.v[0] * dt; q.sp.position.y += q.v[1] * dt; q.sp.position.z += q.v[2] * dt;
                q.sp.material.opacity = q.fadeOut ? q.op * (1 - fq) : q.op * Math.pow(Math.sin(Math.PI * fq), 0.7);
                q.sp.scale.setScalar(q.s0 + (q.s1 - q.s0) * fq);
            }
        }, () => {
            cam.remove(rig);
            for (const q of ctx.particles) { if (q.sp.parent) q.sp.parent.remove(q.sp); q.sp.material.dispose(); }
            ctx.particles.length = 0;
            for (const d of ctx.overlays) { if (d.parentNode) d.parentNode.removeChild(d); }
            ctx.overlays.length = 0;
            if (cfg.finish) cfg.finish(st, ctx);
            if (onComplete) onComplete();
        });
    }

    playBeerFirstPerson(userPosition, onComplete) {
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        this._fpPlay({
            dur: 3.4, handEnd: 3.1,
            cam: { pos: [0, 3.1, 8.4], look: [0, 1.1, 2.0], fov: 55, in: [0, 0.6], out: [3.0, 3.5],
                   looks: [[0, 0, 0], [1.2, 0, -0.05], [1.9, 0, 0.5], [2.4, 0, 0.1], [3.4, 0, 0]] },
            hand: [[0, 0.6, -0.9, -0.5, 0.2, 0, 0], [0.55, 0.22, -0.22, -0.5, 0.05, -0.3, 0], [1.1, 0.0, -0.16, -0.36, 0.3, 0, 0],
                   [1.4, 0.0, -0.14, -0.34, 0.45, 0, 0], [2.1, 0.0, -0.09, -0.3, 1.25, 0, 0], [2.5, 0.15, -0.25, -0.45, 0.1, -0.3, 0],
                   [3.0, 0.7, -0.95, -0.4, 0.6, -0.4, 0.5]],
            build: (ctx) => { const can = ctx.strip(this.createBeerModel()); can.scale.setScalar(0.9); can.position.set(0, 0.04, 0); ctx.hold.add(can); return { can: can }; },
            events: [[2.55, (st) => { st.can.scale.y = 0.45; }]],
            tick: (t, st, ctx) => {
                if (t > 1.5 && t < 2.2 && Math.random() < 0.5) {
                    ctx.puff({ pos: [(Math.random() - 0.5) * 0.08, -0.25, -0.4], vel: [(Math.random() - 0.5) * 0.15, 0.12, -0.1], life: 700, s0: 0.03, s1: 0.1, op: 0.5, color: 0xffd36a });
                }
            },
            finish: () => {
                const can = this.createBeerModel(); can.scale.set(1, 0.5, 1);
                can.position.copy(userPosition).add(V(0, 0.25, 0.1)); this.scene.add(can);
                this.addDiscardedItem(can, V((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15));
            }
        }, onComplete);
    }

    playHandcuffsFirstPerson(userPosition, targetPosition, onComplete) {
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        this._fpPlay({
            dur: 3.4, handEnd: 2.5,
            cam: { pos: [0, 3.4, 8.2], look: [0, 2.6, -6.0], fov: 58, in: [0, 0.7], out: [2.9, 3.5] },
            hand: [[0, 0.6, -0.9, -0.5, 0.3, -0.6, 0.3], [0.55, 0.25, -0.2, -0.55, 0.1, -0.4, 0.15], [1.1, 0.12, 0.0, -0.5, 0.35, -0.2, 0.1],
                   [1.45, 0.2, -0.05, -0.38, 0.55, -0.1, 0.1], [1.65, 0.05, 0.08, -0.85, -0.2, 0, 0], [2.3, 0.7, -0.95, -0.4, 0.6, -0.4, 0.5]],
            build: (ctx) => { const cuffs = ctx.strip(this.createHandcuffsModel()); cuffs.rotation.set(0, 0, 0); cuffs.scale.setScalar(0.9); cuffs.position.set(0, -0.02, 0); ctx.hold.add(cuffs); return { cuffs: cuffs }; },
            events: [[1.65, (st, ctx) => {
                ctx.throwModel(st.cuffs, targetPosition, 0.65, true, () => {
                    ctx.puff({ world: true, add: true, tex: 'spark', pos: [targetPosition.x, targetPosition.y, targetPosition.z], life: 450, s0: 0.3, s1: 1.6, op: 0.9, color: 0xffffff, fadeOut: true });
                });
            }]],
            tick: (t, st) => { if (t > 1.0 && t < 1.55) st.cuffs.rotation.z = Math.sin(t * 30) * 0.12; },
            finish: (st) => { if (st.cuffs.parent === this.scene) this.addDiscardedItem(st.cuffs, V(0, -0.1, 0)); }
        }, onComplete);
    }

    playSawFirstPerson(onComplete) {
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        const CUT = V(0, 0.85, -1.75);
        this._fpPlay({
            dur: 3.6, handEnd: 3.3,
            cam: { pos: [0.35, 1.7, 0.4], look: [0, 0.85, -1.8], fov: 55, in: [0, 0.8], out: [2.9, 3.5] },
            build: (ctx) => { const saw = ctx.strip(this.createSawModel()); saw.position.set(-0.38, 0, 0); ctx.hold.add(saw); return { saw: saw }; },
            handFn: (t, ctx) => {
                const blade = ctx.cam.worldToLocal(CUT.clone());
                const away = V(0.75, -0.8, -0.6);
                const near = V(blade.x + 0.6, blade.y - 0.2, blade.z + 0.35);
                const touch = V(blade.x + 0.38, blade.y, blade.z);
                let p;
                if (t < 1.0) p = away.clone().lerp(near, ctx.ease(ctx.seg(t, 0.2, 1.0)));
                else if (t < 1.5) p = near.clone().lerp(touch, ctx.ease(ctx.seg(t, 1.0, 1.5)));
                else if (t < 2.5) p = touch.clone();
                else p = touch.clone().lerp(away, ctx.ease(ctx.seg(t, 2.5, 3.2)));
                if (t > 1.5 && t < 2.5) { p.x += (Math.random() - 0.5) * 0.02; p.y += (Math.random() - 0.5) * 0.02; }
                ctx.rig.position.copy(p); ctx.rig.rotation.set(0, 0, 0);
            },
            tick: (t, st, ctx) => {
                if (t > 1.55 && t < 2.45) {
                    for (let i = 0; i < 3; i++) {
                        ctx.puff({ world: true, add: true, tex: 'spark', depth: true, pos: [CUT.x + (Math.random() - 0.5) * 0.1, CUT.y, CUT.z],
                            vel: [(Math.random() - 0.5) * 2.4, 0.6 + Math.random() * 1.8, (Math.random() - 0.3) * 2.0], g: 6, life: 500, s0: 0.07, s1: 0.02, op: 1, color: 0xffaa33, fadeOut: true });
                    }
                }
            },
            events: [[2.3, () => {
                if (this.gunBarrel && this.gunGroup) {
                    this.gunGroup.remove(this.gunBarrel);
                    this.gunBarrel.position.set(0, 0.8, -1.4);
                    this.addDiscardedItem(this.gunBarrel, V((Math.random() - 0.5) * 0.2, 0.15 + Math.random() * 0.3, -0.2 - Math.random() * 0.4));
                    this.gunBarrel = null;
                }
            }]],
            finish: () => {
                const sw = this.createSawModel(); sw.position.set(0.3, 1.2, -1.0); this.scene.add(sw);
                this.addDiscardedItem(sw, V((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15));
            }
        }, onComplete);
    }

    playMorphineFirstPerson(userPosition, targetPosition, onComplete) {
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        this._fpPlay({
            dur: 3.2, handEnd: 2.4,
            cam: { pos: [0, 3.4, 8.2], look: [0, 2.6, -6.0], fov: 58, in: [0, 0.7], out: [2.7, 3.3] },
            hand: [[0, 0.6, -0.9, -0.5, 0.3, -0.6, 0.3], [0.5, 0.25, -0.22, -0.55, 0.1, -0.4, 0.15], [1.0, 0.05, -0.05, -0.45, 0.5, -0.1, 0.0],
                   [1.3, 0.05, -0.03, -0.45, 0.35, -0.1, 0.0], [1.6, 0.15, -0.1, -0.35, 0.5, -0.1, 0.1], [1.8, 0.0, 0.05, -0.8, -0.1, 0, 0],
                   [2.3, 0.7, -0.95, -0.4, 0.6, -0.4, 0.5]],
            build: (ctx) => { const syr = ctx.strip(this.createMorphineModel()); syr.rotation.set(Math.PI / 2, 0, 0); syr.position.set(0, 0, 0); ctx.hold.add(syr); return { syr: syr }; },
            events: [[1.8, (st, ctx) => {
                ctx.throwModel(st.syr, targetPosition, 0.55, false, () => {
                    ctx.puff({ world: true, add: true, tex: 'spark', pos: [targetPosition.x, targetPosition.y, targetPosition.z], life: 400, s0: 0.2, s1: 1.0, op: 0.8, color: 0xff6644, fadeOut: true });
                });
            }]],
            finish: (st) => { if (st.syr.parent === this.scene) this.addDiscardedItem(st.syr, V(0, -0.15, 0)); }
        }, onComplete);
    }

    playTaserFirstPerson(onComplete) {
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        this._fpPlay({
            dur: 2.8, handEnd: 2.5,
            cam: { pos: [0, 3.2, 8.4], look: [0, 1.8, -6.0], fov: 57, in: [0, 0.6], out: [2.3, 2.8] },
            hand: [[0, 0.6, -0.9, -0.5, 0.2, -0.5, 0.2], [0.5, 0.2, -0.2, -0.55, 0.0, -0.3, 0.1], [1.1, 0.12, -0.12, -0.62, -0.1, -0.1, 0.05],
                   [1.9, 0.12, -0.12, -0.62, -0.1, -0.1, 0.05], [2.4, 0.7, -0.95, -0.4, 0.6, -0.4, 0.5]],
            build: (ctx) => {
                const tz = ctx.strip(M_createTaserModel()); tz.position.set(0, -0.12, 0); ctx.hold.add(tz);
                const N = 14, arr = new Float32Array(N * 3);
                const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
                const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.95, fog: false, depthTest: false }));
                line.renderOrder = 998; line.visible = false; line.frustumCulled = false; ctx.rig.add(line);
                const flash = ctx.overlay('background:rgba(120,190,255,0.9)');
                return { tz: tz, line: line, geo: geo, N: N, flash: flash, fireT: -1 };
            },
            events: [[1.35, (st) => { audioMgr.play('taser'); st.line.visible = true; st.fireT = 1.35; }]],
            tick: (t, st, ctx) => {
                if (st.fireT > 0 && t < 1.95) {
                    const a = st.geo.attributes.position;
                    for (let i = 0; i < st.N; i++) {
                        const k = i / (st.N - 1), j = (i === 0) ? 0 : 0.07;
                        a.setXYZ(i, (Math.random() - 0.5) * j * (1 + k * 3), 0.202 + (Math.random() - 0.5) * j * (1 + k * 3), -0.214 - k * 2.6);
                    }
                    a.needsUpdate = true;
                    ctx.cam.position.x += (Math.random() - 0.5) * 0.05; ctx.cam.position.y += (Math.random() - 0.5) * 0.05;
                    st.flash.style.opacity = String(0.8 * (1 - ctx.clamp01((t - 1.35) / 0.4)));
                } else if (st.fireT > 0) { st.line.visible = false; st.flash.style.opacity = '0'; }
                if (t > 0.9 && t < 1.35 && Math.random() < 0.6) {
                    ctx.puff({ add: true, tex: 'spark', pos: [0.0 + (Math.random() - 0.5) * 0.06, 0.0, -0.8], vel: [0, 0, 0], life: 180, s0: 0.03, s1: 0.012, op: 0.9, color: 0x66ccff, fadeOut: true });
                }
            }
        }, onComplete);
    }

    playMagnifierFirstPerson(onComplete) {
        this._fpPlay({
            dur: 2.3, handEnd: 2.1,
            cam: { pos: [0, 2.8, 3.8], look: [0, 0.9, -0.6], fov: 50, in: [0, 0.6], out: [1.9, 2.4],
                   fovKeys: [[0, 0], [0.8, 0], [1.2, -8], [1.7, -8], [2.3, 0]] },
            hand: [[0, 0.6, -0.9, -0.5, 0.1, -0.5, 0.2], [0.5, 0.2, -0.18, -0.55, 0.0, -0.2, 0.1], [0.9, 0.05, -0.02, -0.55, 0, 0, 0],
                   [1.5, 0.0, -0.02, -0.55, 0, 0, 0], [2.0, 0.7, -0.95, -0.4, 0.6, -0.4, 0.5]],
            build: (ctx) => {
                const mag = ctx.strip(M_createMagnifierModel()); mag.rotation.set(0, 0, 0); mag.scale.setScalar(0.9); mag.position.set(0, 0.05, 0); ctx.hold.add(mag);
                const glint = ctx.overlay('background:radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.55), rgba(255,255,255,0) 40%)');
                return { mag: mag, glint: glint };
            },
            tick: (t, st, ctx) => {
                if (t > 0.9 && t < 1.5) ctx.rig.position.x += 0.02 * Math.sin(t * 5);
                st.glint.style.opacity = String(0.7 * Math.max(0, Math.sin(Math.PI * ctx.clamp01((t - 1.0) / 0.6))));
            }
        }, onComplete);
    }

    `;

// framework + new animations go in front of _camHome()
rep('_camHome() {', FPX + '_camHome() {');

// pre-warm extras: spark texture and line material
rep('tmp.add(sp); tmp.add(m1); tmp.add(m2); tmp.position.set(0, 0, 3);',
    'tmp.add(sp); tmp.add(m1); tmp.add(m2); tmp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -0.01)]), new THREE.LineBasicMaterial({ color: 0x66ccff, transparent: true, fog: false, depthTest: false }))); this._fpTexGet(\'smoke\'); this._fpTexGet(\'spark\'); tmp.position.set(0, 0, 3);');

// entry points in each play*Animation
rep('playBeerAnimation(userPosition, onComplete) {',
    'playBeerAnimation(userPosition, onComplete) {\n        if (this._fpTake()) { this.playBeerFirstPerson(userPosition, onComplete); return; }');
rep('playHandcuffsAnimation(userPosition, targetPosition, onComplete) {',
    'playHandcuffsAnimation(userPosition, targetPosition, onComplete) {\n        if (this._fpTake()) { this.playHandcuffsFirstPerson(userPosition, targetPosition, onComplete); return; }');
rep('playSawAnimation(userPosition, onComplete) {',
    'playSawAnimation(userPosition, onComplete) {\n        if (this._fpTake()) { this.playSawFirstPerson(onComplete); return; }');
rep('playMorphineAnimation(userPosition, targetPosition, onComplete) {',
    'playMorphineAnimation(userPosition, targetPosition, onComplete) {\n        if (this._fpTake()) { this.playMorphineFirstPerson(userPosition, targetPosition, onComplete); return; }');
rep('playTaserAnimation(userPosition, targetPosition, onComplete) {',
    'playTaserAnimation(userPosition, targetPosition, onComplete) {\n        if (this._fpTake()) { this.playTaserFirstPerson(onComplete); return; }');

// executeAction call sites
rep('switch (item.id) {', 'this.scene._fpSelf = isSelf;\n            switch (item.id) {');
rep("this.scene.playSawAnimation(userPos, () => { audioMgr.play('saw');",
    "if (isSelf) audioMgr.play('saw'); this.scene.playSawAnimation(userPos, () => { if (!isSelf) audioMgr.play('saw');");
rep('setTimeout(() => this.finalizeAction(), 1500);',
    'if (isSelf) { this.scene._fpSelf = false; this.scene.playMagnifierFirstPerson(() => setTimeout(() => this.finalizeAction(), 300)); } else setTimeout(() => this.finalizeAction(), 1500);');

fs.writeFileSync(f, s, 'latin1');
console.log('patched game.js: first-person items');
