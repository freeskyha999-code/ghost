// Patch 9: natural pick-up (hand reaches the item on the table), smooth Hermite motion, cigarette ported,
// pacemaker (dedupe, badge, saved-shot cinematic, demon revive), demon-shot camera at normal height.
const fs = require('fs');
const u = (str) => Buffer.from(str, 'utf8').toString('latin1');
const file = 'E:\\game\\恶魔轮盘\\src\\js\\game.js';
let s = fs.readFileSync(file, 'latin1');
function rep(a, b) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error('anchor count ' + n + ' for: ' + a);
    s = s.replace(a, () => b);
}
function repRe(re, b) {
    const m = s.match(re);
    const n = m ? m.length : 0;
    if (n !== 1) throw new Error('regex count ' + n + ' for: ' + re);
    s = s.replace(re, () => b);
}

// ------------------------------------------------------------------ 1) _fpPlay with reach phase + Hermite motion
const FPPLAY = `_fpPlay(cfg, onComplete) {
        const cam = this.camera;
        if (cam.parent !== this.scene) this.scene.add(cam);
        const clamp01 = (x) => Math.max(0, Math.min(1, x));
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        const seg = (t, a, b) => clamp01((t - a) / (b - a));
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        const grab = this._fpGrab || null; this._fpGrab = null;
        const R = (grab && grab.model) ? 0.85 : 0;           // seconds spent reaching for the item on the table
        const SLOT = R > 0 ? grab.model.position.clone() : null;
        const hr = this._fpHandRig(); const rig = hr.rig; cam.add(rig);
        const ctx = { cam: cam, rig: rig, hold: hr.hold, t: 0, now: performance.now(), particles: [], overlays: [], flights: [], startPos: null, V: V, ease: ease, seg: seg, clamp01: clamp01 };
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
        if (R > 0) ctx.hold.visible = false;
        const fired = (cfg.events || []).map(() => false);
        const HOME_POS = V(0, 5.2, (window.innerWidth <= 768) ? 12.0 : 10.2), HOME_LOOK = V(0, 0.5, 0);
        const SEAT_POS = V(0, 3.1, 8.4), SEAT_LOOK = V(0, 1.1, 2.0);
        // smooth (Hermite) interpolation through keyframes [t, v1, v2, ...] - continuous velocity, no robotic stops
        const kfv = (arr, t) => {
            const n = arr.length;
            if (t <= arr[0][0]) return arr[0].slice(1);
            if (t >= arr[n - 1][0]) return arr[n - 1].slice(1);
            let i = 1; while (i < n - 1 && t > arr[i][0]) i++;
            const a = arr[i - 1], b = arr[i], h = b[0] - a[0], uu = (t - a[0]) / h, u2 = uu * uu, u3 = u2 * uu;
            const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + uu, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
            const out = [];
            for (let k = 1; k < a.length; k++) {
                const m0 = (i - 2 >= 0) ? (b[k] - arr[i - 2][k]) / (b[0] - arr[i - 2][0]) : 0;
                const m1 = (i < n - 1) ? (arr[i + 1][k] - a[k]) / (arr[i + 1][0] - a[0]) : 0;
                out.push(h00 * a[k] + h10 * h * m0 + h01 * b[k] + h11 * h * m1);
            }
            return out;
        };
        const cm = cfg.cam;
        const TGT_POS = V(cm.pos[0], cm.pos[1], cm.pos[2]), TGT_LOOK = V(cm.look[0], cm.look[1], cm.look[2]), TGT_FOV = cm.fov || 55;
        let grabbed = (R === 0), keysG = null;
        this._runCamShot((cfg.dur + R) * 1000, (p, camera) => {
            const T = p * (cfg.dur + R), tt = Math.max(0, T - R), now = performance.now(); ctx.t = tt; ctx.now = now;
            // camera: home -> seat (while reaching) -> item-specific view -> home
            let pos, look, fov;
            if (R > 0) {
                const c1 = ease(seg(T, 0, 0.6));
                pos = HOME_POS.clone().lerp(SEAT_POS, c1); look = HOME_LOOK.clone().lerp(SEAT_LOOK, c1); fov = 60 + (55 - 60) * c1;
                const c2 = ease(seg(tt, cm.in[0], cm.in[1]));
                pos.lerp(TGT_POS, c2); look.lerp(TGT_LOOK, c2); fov += (TGT_FOV - fov) * c2;
            } else {
                const c2 = ease(seg(tt, cm.in[0], cm.in[1]));
                pos = HOME_POS.clone().lerp(TGT_POS, c2); look = HOME_LOOK.clone().lerp(TGT_LOOK, c2); fov = 60 + (TGT_FOV - 60) * c2;
            }
            const co = ease(seg(tt, cm.out[0], cm.out[1]));
            pos.lerp(HOME_POS, co); look.lerp(HOME_LOOK, co); fov += (60 - fov) * co;
            if (cm.looks) { const d = kfv(cm.looks, tt); look.x += d[0]; look.y += d[1]; }
            camera.position.copy(pos); camera.lookAt(look);
            camera.fov = fov + (cm.fovKeys ? kfv(cm.fovKeys, tt)[0] : 0);
            camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);

            if (T < R) {
                // reach: hand comes up from below, hovers over the item, then lowers onto it
                const uu = T / R;
                const P = camera.worldToLocal(SLOT.clone().add(V(0, 0.06, 0))); P.z += 0.02;
                const H = camera.worldToLocal(SLOT.clone().add(V(0.0, 0.40, 0.1)));
                const hp = (uu < 0.55) ? V(0.6, -0.9, -0.5).lerp(H, ease(uu / 0.55)) : H.clone().lerp(P, ease((uu - 0.55) / 0.45));
                rig.position.copy(hp); rig.rotation.set(0.45 - 0.25 * uu, -0.25, 0.1);
            } else {
                if (!grabbed) {
                    grabbed = true;
                    const gp = camera.worldToLocal(SLOT.clone().add(V(0, 0.06, 0))); gp.z += 0.02;
                    ctx.startPos = gp.clone();
                    if (cfg.hand) keysG = [[0, gp.x, gp.y, gp.z, 0.2, -0.25, 0.1]].concat(cfg.hand.slice(1));
                    ctx.hold.visible = true;
                    this.removeItemModel(grab.model);
                }
                if (cfg.handFn) cfg.handFn(tt, ctx, st);
                else { const h = kfv(keysG || cfg.hand, tt); rig.position.set(h[0], h[1], h[2]); rig.rotation.set(h[3], h[4], h[5]); }
                rig.visible = tt < (cfg.handEnd !== undefined ? cfg.handEnd : (cfg.dur - 0.1));
                for (let i = 0; i < fired.length; i++) { if (!fired[i] && tt >= cfg.events[i][0]) { fired[i] = true; cfg.events[i][1](st, ctx); } }
                if (cfg.tick) cfg.tick(tt, st, ctx);
            }
            for (const fl of ctx.flights) {
                const fr = clamp01((tt - fl.t0) / fl.dur);
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
    }`;
repRe(/_fpPlay\(cfg, onComplete\) \{[\s\S]*?(?=\r?\n    \}\r?\n\r?\n    playBeerFirstPerson)/g, FPPLAY);

// ------------------------------------------------------------------ 2) saw: start from the grabbed pose, sound when cutting begins
rep('const away = V(0.75, -0.8, -0.6);', 'const away = ctx.startPos ? ctx.startPos.clone() : V(0.75, -0.8, -0.6);');
rep('events: [[2.3, () => {', 'events: [[1.5, () => audioMgr.play(\'saw\')], [2.3, () => {');
rep('if (isSelf) audioMgr.play(\'saw\'); ', '');

// ------------------------------------------------------------------ 3) cigarette ported to the common framework
const CIG = `playCigaretteFirstPerson2(userPosition, onComplete) {
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        this._fpPlay({
            dur: 4.0, handEnd: 3.7,
            cam: { pos: [0, 3.1, 8.4], look: [0, 1.1, 2.0], fov: 55, in: [0, 0.5], out: [3.3, 4.0],
                   looks: [[0, 0, 0], [0.6, 0, 0], [1.1, 0, -0.3], [2.0, 0, -0.3], [2.5, 0, 0.1], [2.9, 0, 0.7], [3.5, 0, 0.2], [4.0, 0, 0]] },
            hand: [[0, 0.55, -0.85, -0.5, 0.3, -0.6, 0.3], [0.5, 0.26, -0.20, -0.52, 0.1, -0.45, 0.15], [1.2, 0.0, -0.19, -0.34, 0.55, 0, 0],
                   [2.0, 0.0, -0.19, -0.34, 0.55, 0, 0], [2.7, 0.30, -0.34, -0.5, 0.15, -0.5, 0.25], [3.5, 0.6, -0.9, -0.45, 0.6, -0.4, 0.5]],
            build: (ctx) => {
                const cig = this.createCigaretteModel(); cig.scale.setScalar(0.85); cig.position.set(0, 0, -0.18); ctx.hold.add(cig);
                let ember = null, fire = null;
                cig.traverse((o) => { if (o.isPointLight) fire = o; else if (o.isMesh && o.material && o.material.emissiveIntensity > 1) ember = o; });
                const glow = ctx.overlay('background:radial-gradient(ellipse at 50% 105%, rgba(255,110,30,0.55), rgba(255,60,10,0.15) 40%, rgba(0,0,0,0) 65%)');
                return { cig: cig, ember: ember, fire: fire, ember0: ember ? ember.material.emissiveIntensity : 2, fire0: fire ? fire.intensity : 1.6, glow: glow, lastPuff: 0 };
            },
            tick: (t, st, ctx) => {
                const burn = ctx.ease(ctx.seg(t, 1.2, 1.7)) * (1 - ctx.ease(ctx.seg(t, 2.2, 2.7)));
                if (st.ember) st.ember.material.emissiveIntensity = st.ember0 + 3.5 * burn;
                if (st.fire) st.fire.intensity = st.fire0 + 3.0 * burn;
                st.glow.style.opacity = String(0.8 * burn);
                if (t > 2.4 && t < 3.3 && ctx.now - st.lastPuff > 35) {
                    st.lastPuff = ctx.now;
                    for (let i = 0; i < 2; i++) {
                        ctx.puff({ pos: [(Math.random() - 0.5) * 0.05, -0.27, -0.38], vel: [(Math.random() - 0.5) * 0.10, 0.03 + Math.random() * 0.07, -(0.18 + Math.random() * 0.22)],
                            life: 1400 + Math.random() * 900, s0: 0.08, s1: 0.98, op: 0.55 });
                    }
                }
            },
            finish: () => {
                const butt = this.createCigaretteModel();
                butt.position.copy(userPosition).add(V(0, 0.25, 0.15)); this.scene.add(butt);
                this.addDiscardedItem(butt, V((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15));
            }
        }, onComplete);
    }

    `;
rep('_camHome() {', CIG + '_camHome() {');
rep('if (isSelf) { this.playCigaretteFirstPerson(userPosition, onComplete); return; }', 'if (isSelf) { this.playCigaretteFirstPerson2(userPosition, onComplete); return; }');

// ------------------------------------------------------------------ 4) executeAction: grab, delayed sounds, check_shell
repRe(/if \(model\) \{ this\.scene\.removeItemModel\(model\); \}/g,
    "if (model) { if (isSelf && item.id !== 'defibrillator') this.scene._fpGrab = { model: model }; else this.scene.removeItemModel(model); }");
rep('this.scene._fpSelf = isSelf;', 'this.scene._fpSelf = isSelf; const _R = (isSelf && this.scene._fpGrab) ? 850 : 0;');
repRe(/case 'beer':\s*audioMgr\.play\('beer'\);/g, "case 'beer':\n                    setTimeout(() => audioMgr.play('beer'), _R + 900);");
repRe(/case 'cigarette':\s*audioMgr\.play\('cigarette'\);/g, "case 'cigarette':\n                    setTimeout(() => audioMgr.play('cigarette'), _R + 600);");
repRe(/audioMgr\.play\('handcuffs'\);/g, "setTimeout(() => audioMgr.play('handcuffs'), _R + 1200);");
repRe(/audioMgr\.play\('morphine'\);/g, "setTimeout(() => audioMgr.play('morphine'), _R + 700);");
const CHECK = u(`case 'check_shell': {
                    const nextShell = this.battle.shells[0];
                    if (isSelf) {
                        this.scene._fpSelf = false;
                        setTimeout(() => { this.scene.checkShellEffect(); }, 1700);
                        setTimeout(() => this.showMessage(\`下一发: \${nextShell === 1 ? '真实弹' : '空包弹'}\`, 2500, true), 2100);
                        this.scene.playMagnifierFirstPerson(() => setTimeout(() => this.finalizeAction(), 300));
                    } else {
                        this.scene.checkShellEffect();
                        setTimeout(() => this.finalizeAction(), 1500);
                    }
                    break;
                }
                `);
repRe(/case 'check_shell':[\s\S]*?break;\s*(?=case 'beer':)/g, CHECK);

// ------------------------------------------------------------------ 5) pacemaker
rep("showPacemaker(actor) {", "showPacemaker(actor) {\n        this._pmBadge(actor === 'host' ? 'player' : 'enemy', true);");
rep("removePacemaker(actor) {", "removePacemaker(actor) {\n        this._pmBadge(actor === 'host' ? 'player' : 'enemy', false);");
const PM = u(`_pmBadge(side, on) {
        const hp = document.getElementById(side === 'player' ? 'player-hp' : 'enemy-hp');
        if (!hp || !hp.parentNode) return;
        let b = document.getElementById('pm-badge-' + side);
        if (!b) {
            b = document.createElement('span'); b.id = 'pm-badge-' + side;
            b.style.cssText = 'margin-left:8px;color:#5cff9a;font-size:0.8em;text-shadow:0 0 6px #1aff7a;';
            b.textContent = '\u2665 \u8d77\u640f\u5668';
            hp.parentNode.appendChild(b);
        }
        b.style.display = on ? 'inline' : 'none';
    }
    pacemakerPulse(actor) {
        const side = (actor === 'host') ? 'player' : 'enemy';
        const m = this.scene.getObjectByName(side + '_pacemaker'); if (!m) return;
        const t0 = performance.now(), s0 = m.scale.x;
        const step = () => {
            const t = (performance.now() - t0) / 1000;
            if (t > 2.4 || !m.parent) { m.scale.setScalar(s0); return; }
            m.scale.setScalar(s0 * (1 + 0.5 * Math.abs(Math.sin(t * 14)) * (1 - t / 2.4)));
            m.rotation.z = Math.sin(t * 40) * 0.2 * (1 - t / 2.4);
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
    `);
rep('_camHome() {', PM + '_camHome() {');
rep('updateUI() {', "updateUI() {\n        if (this.scene && this.scene._pmBadge && this.battle) { this.scene._pmBadge('player', !!this.battle.playerPacemaker); this.scene._pmBadge('enemy', !!this.battle.enemyPacemaker); }");
// crate drop: never leave two pacemaker models with the same name
repRe(/\n( {20,})model\.name = side \+ '_pacemaker';/g,
    "\n$1const _oldPm = this.scene.getObjectByName(side + '_pacemaker'); if (_oldPm && _oldPm !== model) this.scene.remove(_oldPm);\n$1model.name = side + '_pacemaker';");

// saved-by-pacemaker shot: full cinematic, device pulses, then the revival
const SAVED = u(`if (result.pacemakerSaved) {
                const climaxSaved = () => {
                    this.scene.shootEffect({ victimIsMe: victimIsMe, shooterIsMe: isSelf });
                    this.scene.pacemakerPulse(result.hitTarget);
                    if (victimIsMe) this.showMessage("心脏起搏器启动！", 2500, true);
                    else { this.scene.demonReact('hit', { damage: 1, lethal: true }); setTimeout(() => this.scene.demonReact('revive'), 5000); }
                    this.pacemakerRevive(victimIsMe, () => {
                        this.scene.removePacemaker(result.hitTarget);
                        this.scene.aimAt('center');
                        this.battle.advanceTurn(prevTurn, false);
                        if (!this.checkEmpty()) {
                            this.battle.turn = this.battle.nextRoundTurn;
                            this.finalizeAction();
                        }
                    });
                };
                this.scene.playShootSequence({ shooterIsMe: isSelf, selfShot: selfShot, live: true, damage: result.damage, victimIsMe: victimIsMe }, climaxSaved, () => {});
                return;
            }`);
repRe(/if \(result\.pacemakerSaved\) \{[\s\S]*?return;\s*\}/g, SAVED);

// demon revival animation (starts from the collapsed pose)
const REVIVE = `} else if (fx.kind === 'revive') {
            const j = sm(0.0, 0.15) - sm(0.15, 0.5);          // violent jolt
            const c0 = 1 - sm(0.0, 0.2);                       // fading collapsed pose
            const rec = sm(0.5, 1.2) - sm(1.8, 2.5);           // hunched recovery
            const decay = Math.exp(-t * 2.5);
            rx = baseRx + 0.75 * c0 - 0.40 * j + 0.22 * rec;
            dy = -1.0 * c0 + 0.25 * j + (Math.random() - 0.5) * 0.08 * decay;
            dx = (Math.random() - 0.5) * 0.14 * decay;
            rz = 0.06 * Math.sin(t * 9) * (1 - sm(1.0, 2.0));
            dz = 0.10 * rec; sy = 1 - 0.05 * rec;
            eye = 0.2 + 3.5 * j + 1.0 * sm(0.3, 1.0);
            if (t > 2.7) this._demonFx = null;
        } else {
            const flinch`;
repRe(/\} else \{\s*const flinch/g, REVIVE);

// ------------------------------------------------------------------ 6) demon shooting: camera at a normal height
rep('cam: { pos: [0, 4.4, 0.8], look: [0, 4.7, -7.5], fov: 42, in: [0, 1.2], out: [3.9, 4.6] }',
    'cam: { pos: [0, 5.0, 5.5], look: [0, 4.2, -7.0], fov: 46, in: [0, 1.2], out: [3.9, 4.6] }');
rep('cam: { pos: [0, 2.3, 6.4], look: [0, 0.95, 3.2], fov: 48, in: [0, 1.3], out: [4.2, 4.9] }',
    'cam: { pos: [0, 4.4, 8.6], look: [0, 0.9, 2.6], fov: 50, in: [0, 1.5], out: [4.2, 4.9] }');

fs.writeFileSync(file, s, 'latin1');
console.log('game.js: patch 9 applied');
