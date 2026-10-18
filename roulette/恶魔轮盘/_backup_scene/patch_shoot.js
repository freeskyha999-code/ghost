// Patch 8b: shooting cinematics, demon reactions, saw-off integration, defib odds, blank = no screen shake.
const fs = require('fs');
const u = (str) => Buffer.from(str, 'utf8').toString('latin1');
const root = 'E:\\game\\恶魔轮盘\\src\\js\\';

function load(f) { return fs.readFileSync(root + f, 'latin1'); }
function save(f, s) { fs.writeFileSync(root + f, s, 'latin1'); }
function rep(s, a, b) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error('anchor count ' + n + ' for: ' + a);
    return s.replace(a, () => b);
}
function repRe(s, re, b, expect) {
    const m = s.match(re);
    const n = m ? m.length : 0;
    if (n !== expect) throw new Error('regex count ' + n + ' (expected ' + expect + ') for: ' + re);
    return s.replace(re, () => b);
}

// ---------------------------------------------------------------- BattleSystem: defibrillator odds
let b = load('BattleSystem.js');
b = rep(b, 'const alreadyHas = isPlayer ? this.playerPacemaker : this.enemyPacemaker;',
    'const alreadyHas = isPlayer ? this.playerPacemaker : this.enemyPacemaker;\n' +
    "            const heldDefib = (isPlayer ? this.playerItems : this.enemyItems).some(i => i.id === 'defibrillator');\n" +
    '            const pDefib = hp <= 1 ? 0.30 : hp <= 2 ? 0.18 : 0.10;\n' +
    "            if (!alreadyHas && !heldDefib && Math.random() < pDefib) { const dd = this.itemPool.find(i => i.id === 'defibrillator'); if (dd) return { ...dd }; }");
b = rep(b, 'const chance = hp <= 1 ? 0.25 : hp <= 2 ? 0.12 : 0.06;', 'const chance = 0;');
save('BattleSystem.js', b);
console.log('BattleSystem.js patched');

// ---------------------------------------------------------------- game.js
let s = load('game.js');

// 1) gun reset + saw-off + demon reactions (replaces resetGun)
const GUN_METHODS = u(`resetGun() {
        if (this.gunGroup) {
            const lg = this.gunGroup.getObjectByName('barrelsLong'), sg = this.gunGroup.getObjectByName('barrelsShort');
            if (lg) lg.visible = true;
            if (sg) sg.visible = false;
            this.gunGroup.visible = true;
        }
        this.gunSawn = false;
        this._demonFx = null; this._demonDy = 0;
        const dg = this.demonGroup;
        if (dg) { dg.rotation.set(0, 0, 0); dg.position.x = 0; dg.position.z = -7.5; dg.scale.y = 1; }
    }
    sawOffGun() {
        if (!this.gunGroup || this.gunSawn) return;
        const lg = this.gunGroup.getObjectByName('barrelsLong'), sg = this.gunGroup.getObjectByName('barrelsShort');
        if (lg) lg.visible = false;
        if (sg) sg.visible = true;
        this.gunSawn = true;
        const piece = M_createBarrelPiece();
        piece.position.set(0, 0.86, -3.03);
        this.addDiscardedItem(piece, new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.15 + Math.random() * 0.3, -0.2 - Math.random() * 0.4));
    }
    demonReact(kind, o) {
        this._demonFx = { t0: performance.now(), kind: kind, o: o || {} };
        this._demonDirty = true;
        if (kind === 'hit' && typeof FX !== 'undefined' && FX.thud) { try { FX.thud(0.8, 0.05, 70); } catch (e) {} }
    }
    _demonFxStep() {
        const dg = this.demonGroup; if (!dg) return;
        const hp = Math.max(0, Math.min(4, this.demonHp == null ? 4 : this.demonHp));
        const baseRx = (4 - hp) * 0.03;          // the more wounded, the more hunched (matches real HP)
        const fx = this._demonFx;
        if (!fx) {
            if (this._demonDirty) {
                dg.rotation.x += (baseRx - dg.rotation.x) * 0.08; dg.rotation.z += (0 - dg.rotation.z) * 0.1;
                dg.position.x += (0 - dg.position.x) * 0.1; dg.position.z += (-7.5 - dg.position.z) * 0.1;
                dg.scale.y += (1 - dg.scale.y) * 0.1;
                if (Math.abs(dg.rotation.x - baseRx) < 0.002 && Math.abs(dg.position.z + 7.5) < 0.01 && Math.abs(dg.rotation.z) < 0.002) this._demonDirty = false;
            }
            return;
        }
        const t = (performance.now() - fx.t0) / 1000, o = fx.o;
        const sm = (a, c) => { const x = Math.max(0, Math.min(1, (t - a) / (c - a))); return x * x * (3 - 2 * x); };
        let rx = baseRx, rz = 0, dx = 0, dy = 0, dz = 0, sy = 1, eye = 1;
        if (fx.kind === 'hit') {
            const k = (o.damage >= 2) ? 1.3 : 1.0, side = o.side || 0.12;
            const snap = sm(0.0, 0.10) - sm(0.10, 0.30);            // head thrown back
            const hunch = sm(0.10, 0.55) - sm(1.5, 2.3);            // doubled over, clutching
            const glare = sm(1.6, 1.9) - sm(1.9, 2.6);              // straightens and glares
            const decay = Math.exp(-t * 2.2);
            rx = baseRx - 0.30 * k * snap + 0.40 * k * hunch + 0.03 * Math.sin(t * 8) * hunch;
            rz = side * k * hunch + 0.05 * Math.sin(t * 5) * hunch;
            dz = -0.45 * k * snap + 0.05 * hunch + 0.30 * glare;
            sy = 1 - 0.06 * k * hunch;
            dx = (Math.random() - 0.5) * 0.12 * decay * k;
            dy = (Math.random() - 0.5) * 0.06 * decay;
            eye = 1 + 3.0 * snap + 0.6 * glare;
            if (o.lethal) {
                const col = sm(0.55, 1.9);
                rx = baseRx - 0.30 * k * snap + 0.40 * k * sm(0.1, 0.5) + 0.55 * col;
                dy = -1.0 * col; sy = 1 - 0.08 * col; dz = -0.45 * k * snap - 0.15 * col;
                eye = (1 + 3.0 * snap) * Math.max(0, 1 - col);
            }
            if (!o.lethal && t > 2.7) this._demonFx = null;
        } else {
            const flinch = sm(0.0, 0.10) - sm(0.10, 0.40);
            const relief = sm(0.5, 1.0) - sm(1.6, 2.2);
            rx = baseRx - 0.10 * flinch + 0.05 * relief;
            rz = 0.08 * relief; dz = -0.15 * flinch + 0.18 * relief;
            eye = 1 - 0.4 * flinch + 0.5 * relief;
            if (t > 2.4) this._demonFx = null;
        }
        dg.rotation.x = rx; dg.rotation.z = rz; dg.position.x = dx; dg.position.z = -7.5 + dz;
        dg.position.y += dy; dg.scale.y = sy;
        if (this.eyeMat) this.eyeMat.emissiveIntensity *= eye;
    }
    `);
s = repRe(s, /resetGun\(\) \{[\s\S]*?\r?\n    \}\r?\n(?=\s*setDemonHp\(hp\))/g, GUN_METHODS, 1);

// 2) saw uses the new sawn-off barrels (old animation + first-person animation)
s = repRe(s, /if \(this\.gunBarrel && this\.gunGroup\) \{[\s\S]*?this\.gunBarrel = null;\s*\}/g, 'this.sawOffGun();', 2);
s = rep(s, 'const CUT = V(0, 0.85, -1.75);', 'const CUT = V(0, 0.86, -2.1);');

// 3) muzzle flash follows the barrel length
s = rep(s, 'const light = this._muzzleLight;', 'const light = this._muzzleLight; light.position.z = this.gunSawn ? -2.4 : -3.5;');
s = rep(s, 'core.position.set(0, 0.4, -3.5);', 'core.position.set(0, 0.4, this.gunSawn ? -2.4 : -3.6);');

// 4) demon reaction step in the render loop
s = rep(s, 'if (this.demonHand && this.demonHand.visible) {', 'this._demonFxStep();\n        if (this.demonHand && this.demonHand.visible) {');

// 5) _fpPlay: allow handEnd = 0 (no hands)
s = rep(s, 'rig.visible = t < (cfg.handEnd || (cfg.dur - 0.1));',
    'rig.visible = t < (cfg.handEnd !== undefined ? cfg.handEnd : (cfg.dur - 0.1));');

// 6) shooting cinematics
const SEQ = u(`_fpGunAssembly(ctx) {
        const rig = ctx.rig;
        while (rig.children.length) rig.remove(rig.children[0]);
        const S = 0.17, G0 = new THREE.Vector3(0, 0.3, -0.2);
        const gun = ctx.strip(M_createShotgunModel());
        if (this.gunSawn) {
            const lg = gun.getObjectByName('barrelsLong'), sg = gun.getObjectByName('barrelsShort');
            if (lg) lg.visible = false;
            if (sg) sg.visible = true;
        }
        gun.scale.setScalar(S); gun.position.set(-G0.x * S, -G0.y * S, -G0.z * S);
        rig.add(gun);
        const skin = new THREE.MeshStandardMaterial({ color: 0xc2987a, roughness: 0.75, emissive: 0x4a3526 });
        const cloth = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.95, emissive: 0x0c0c10 });
        const mkHand = (x, y, z, armTiltZ) => {
            const h = new THREE.Group();
            h.add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.05, 0.09), skin));
            for (let i = 0; i < 4; i++) {
                const f = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.010, 0.085, 6), skin);
                f.rotation.z = Math.PI / 2; f.position.set(0, -0.034, -0.036 + i * 0.024); h.add(f);
            }
            const th = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.011, 0.07, 6), skin);
            th.position.set(0, 0.03, -0.02); th.rotation.x = 1.2; h.add(th);
            const slGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.7, 10); slGeo.translate(0, -0.35, 0);
            const sl = new THREE.Mesh(slGeo, cloth); sl.rotation.x = -0.5; sl.rotation.z = armTiltZ; sl.position.set(0, -0.03, 0.04); h.add(sl);
            h.position.set(x, y, z); return h;
        };
        rig.add(mkHand(0.0, -0.02, 0.347, 0.4));      // right hand on the grip
        rig.add(mkHand(0.0, -0.05, -0.02, -0.2));     // left hand under the forend
        return gun;
    }

    playShootSequence(seq, onClimax, onDone) {
        if (seq.shooterIsMe && seq.selfShot) return this._shotSelfFP(seq, onClimax, onDone);
        if (seq.shooterIsMe) return this._shotAtDemonFP(seq, onClimax, onDone);
        return this._shotByDemon(seq, onClimax, onDone);
    }
    _heartbeatCue() { if (typeof FX !== 'undefined' && FX.heartbeat) { try { FX.heartbeat(72, 8, 0.5, {}, 0); } catch (e) {} } }

    // You pick the gun up, turn it on yourself, hand shaking, muzzle at your mouth, pull the trigger.
    _shotSelfFP(seq, onClimax, onDone) {
        const live = !!seq.live, PI = Math.PI;
        const common = [[0.0, 0.45, -0.85, -0.60, 0.3, 0.2, 0.2], [0.8, 0.10, -0.30, -0.62, 0.08, 0, 0], [1.0, 0.10, -0.30, -0.62, 0.08, 0, 0],
            [1.7, 0.20, -0.30, -0.78, -0.05, 1.7, 0.1], [2.4, 0.04, -0.27, -0.94, -0.12, PI, 0], [3.2, 0.02, -0.26, -0.95, -0.20, PI, 0],
            [5.2, 0.02, -0.26, -0.90, -0.22, PI, 0], [5.58, 0.02, -0.26, -0.88, -0.22, PI, 0]];
        const hand = live ? common.concat([[5.72, 0.05, -0.18, -0.74, -0.75, PI, 0.15], [6.4, 0.30, -0.95, -0.70, -0.30, PI, 0.5]])
                          : common.concat([[5.9, 0.02, -0.27, -0.92, -0.16, PI, 0], [6.7, 0.30, -0.95, -0.70, 0.2, PI, 0.3]]);
        const looks = live ? [[0, 0, 0], [2.0, 0, 0], [3.4, 0, -0.1], [5.4, 0, -0.2], [5.58, 0, -0.2], [5.66, 0, 1.6], [6.3, 0, 0.3], [7.0, 0, 0]]
                           : [[0, 0, 0], [2.0, 0, 0], [3.4, 0, -0.1], [5.4, 0, -0.2], [5.9, 0, -0.25], [6.4, 0, 0.1], [7.0, 0, 0]];
        this._fpPlay({
            dur: 7.0, handEnd: 6.9,
            cam: { pos: [0, 3.0, 8.0], look: [0, 2.4, 0.0], fov: 55, in: [0, 0.8], out: [6.2, 7.0], looks: looks },
            hand: hand,
            build: (ctx) => {
                const gun = this._fpGunAssembly(ctx);
                const vig = ctx.overlay('background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.92) 100%)');
                return { gun: gun, vig: vig };
            },
            events: [
                [0.35, () => { if (this.gunGroup) this.gunGroup.visible = false; }],
                [1.0, () => this._heartbeatCue()],
                [5.6, () => onClimax()]
            ],
            tick: (t, st, ctx) => {
                const a = 0.0015 + 0.0085 * ctx.clamp01((t - 1.2) / 3.8);
                if (t > 0.9 && t < 5.6) {
                    ctx.rig.position.x += (Math.sin(t * 23.0) * 0.6 + Math.sin(t * 37.0 + 1.3) * 0.4) * a;
                    ctx.rig.position.y += (Math.sin(t * 19.0 + 0.7) * 0.6 + Math.sin(t * 41.0) * 0.4) * a;
                    ctx.rig.rotation.z += Math.sin(t * 17.0) * a * 1.2;
                }
                if (!live && t > 5.6 && t < 5.72) { ctx.rig.position.z += 0.02; ctx.rig.rotation.x += 0.03; }
                ctx.cam.position.y += Math.sin(t * 1.9) * 0.025;
                const v = t < 5.6 ? 0.85 * ctx.clamp01((t - 1.4) / 3.8) : (live ? 0 : 0.85 * Math.max(0, 1 - (t - 5.6) / 0.6));
                st.vig.style.opacity = String(v);
            },
            finish: () => { if (this.gunGroup) this.gunGroup.visible = true; }
        }, onDone);
    }

    // You raise the gun and level it at the demon, breathing, sway, squeeze.
    _shotAtDemonFP(seq, onClimax, onDone) {
        const live = !!seq.live;
        const base = [[0.0, 0.45, -0.85, -0.60, 0.3, 0.2, 0.2], [0.8, 0.10, -0.30, -0.62, 0.08, 0, 0], [1.5, 0.07, -0.23, -0.60, 0, 0, 0], [3.88, 0.06, -0.22, -0.60, 0, 0, 0]];
        const hand = live ? base.concat([[4.0, 0.08, -0.17, -0.50, -0.45, 0, 0.03], [4.5, 0.10, -0.28, -0.60, -0.1, 0, 0], [5.1, 0.35, -0.9, -0.65, 0.2, 0.2, 0.3]])
                          : base.concat([[4.2, 0.07, -0.23, -0.60, 0, 0, 0], [5.1, 0.35, -0.9, -0.65, 0.2, 0.2, 0.3]]);
        const looks = live ? [[0, 0, 0], [3.88, 0, 0], [3.98, 0, 0.6], [4.6, 0, 0], [5.2, 0, 0]] : [[0, 0, 0], [5.2, 0, 0]];
        this._fpPlay({
            dur: 5.2, handEnd: 5.0,
            cam: { pos: [0, 3.0, 8.0], look: [0, 3.4, -7.5], fov: 52, in: [0, 0.7], out: [4.4, 5.1], looks: looks,
                   fovKeys: [[0, 0], [1.5, 0], [3.7, -8], [3.95, -8], [4.1, -2], [5.2, 0]] },
            hand: hand,
            build: (ctx) => {
                const gun = this._fpGunAssembly(ctx);
                const vig = ctx.overlay('background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)');
                const flash = ctx.overlay('background:#fff');
                return { gun: gun, vig: vig, flash: flash, fireT: -1 };
            },
            events: [
                [0.35, () => { if (this.gunGroup) this.gunGroup.visible = false; }],
                [1.0, () => this._heartbeatCue()],
                [3.9, (st, ctx) => {
                    onClimax();
                    if (live) {
                        const m = new THREE.Vector3(0, 0.40, this.gunSawn ? -2.1 : -3.95);
                        ctx.rig.updateMatrixWorld(true); st.gun.localToWorld(m); ctx.cam.worldToLocal(m);
                        ctx.puff({ add: true, tex: 'spark', pos: [m.x, m.y, m.z], vel: [0, 0, -0.3], life: 170, s0: 0.16, s1: 0.9, op: 1, color: 0xffd9a0, fadeOut: true });
                        st.fireT = ctx.t;
                    }
                }]
            ],
            tick: (t, st, ctx) => {
                const a = 0.003 + 0.006 * ctx.clamp01((t - 1.5) / 2.2);
                if (t > 1.4 && t < 3.9) {
                    ctx.rig.position.x += Math.sin(t * 2.3) * a * 1.5 + Math.sin(t * 31) * a * 0.4;
                    ctx.rig.position.y += Math.sin(t * 1.7 + 1) * a + Math.sin(t * 29) * a * 0.4;
                }
                const v = t < 3.9 ? 0.55 * ctx.clamp01((t - 1.4) / 2.4) : 0.55 * Math.max(0, 1 - (t - 3.9) / 0.4);
                st.vig.style.opacity = String(v);
                if (st.fireT > 0) st.flash.style.opacity = String(0.7 * (1 - ctx.clamp01((t - st.fireT) / 0.14)));
                ctx.cam.position.y += Math.sin(t * 1.9) * 0.02;
            },
            finish: () => { if (this.gunGroup) this.gunGroup.visible = true; }
        }, onDone);
    }

    // The demon shoots: the camera creeps toward the muzzle (at you) or toward his face (at himself).
    _shotByDemon(seq, onClimax, onDone) {
        const live = !!seq.live, self = !!seq.selfShot;
        this.aimAt(self ? 'enemy' : 'self');
        const cfg = self ? { dur: 4.6, tc: 3.2, cam: { pos: [0, 4.4, 0.8], look: [0, 4.7, -7.5], fov: 42, in: [0, 1.2], out: [3.9, 4.6] } }
                         : { dur: 4.9, tc: 3.4, cam: { pos: [0, 2.3, 6.4], look: [0, 0.95, 3.2], fov: 48, in: [0, 1.3], out: [4.2, 4.9] } };
        const maxV = self ? 0.4 : 0.75;
        this._fpPlay({
            dur: cfg.dur, handEnd: 0, cam: cfg.cam, hand: [[0, 0, 0, -3, 0, 0, 0]],
            build: (ctx) => ({ vig: ctx.overlay('background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.9) 100%)') }),
            events: [[0.3, () => this._heartbeatCue()], [cfg.tc, () => onClimax()]],
            tick: (t, st, ctx) => {
                if (!self && this.gunGroup && t > 0.7 && t < cfg.tc) {
                    this.gunGroup.rotation.y = Math.PI + Math.sin(t * 2.1) * 0.014 + Math.sin(t * 29) * 0.003 * ctx.clamp01((t - 1.5) / 1.5);
                }
                const v = t < cfg.tc ? maxV * ctx.clamp01((t - 0.6) / (cfg.tc - 0.6)) : ((live && !self) ? 0 : maxV * Math.max(0, 1 - (t - cfg.tc) / 0.6));
                st.vig.style.opacity = String(v);
                ctx.cam.position.y += Math.sin(t * 1.9) * 0.02;
            }
        }, onDone);
    }

    `);
s = rep(s, '_camHome() {', SEQ + '_camHome() {');

// 7) executeAction: new shoot branch
const SHOOT = u(`} else if (type === 'shoot') {
            let prevTurn = this.battle.turn; this.battle.turn = 'animating'; this.updateUI();
            let aimTarget = (isSelf) ? ((detail === 'self') ? 'self' : 'enemy') : ((detail === 'self') ? 'enemy' : 'self');
            const selfShot = (detail === 'self');
            const result = this.battle.shoot(detail, vActor);
            const victimIsMe = result.hitTarget === 'host';
            const afterShot = () => {
                setTimeout(() => { if (this.checkWin()) return; this.battle.advanceTurn(prevTurn, !result.live && detail === 'self'); if (this.checkEmpty()) return; this.battle.turn = this.battle.nextRoundTurn; this.finalizeAction(); }, 700);
            };
            if (result.pacemakerSaved) {
                this.scene.aimAt(aimTarget);
                setTimeout(() => {
                    this.scene.removePacemaker(result.hitTarget);
                    audioMgr.sounds.shoot.volume = 1.0;
                    audioMgr.play('shoot');
                    this.pacemakerRevive(result.hitTarget === 'host', () => {
                        this.scene.aimAt('center');
                        this.battle.advanceTurn(prevTurn, false);
                        if (!this.checkEmpty()) {
                            this.battle.turn = this.battle.nextRoundTurn;
                            this.finalizeAction();
                        }
                    });
                }, 600);
                return;
            }
            const climax = () => {
                if (result.live) {
                    this.scene.shootEffect({ victimIsMe: victimIsMe, shooterIsMe: isSelf });
                    if (victimIsMe) { if (typeof FX !== 'undefined') FX.hitImpact(this.scene, result.damage); else this.triggerShake(); }
                    else this.scene.demonReact('hit', { damage: result.damage, lethal: this.battle.enemyHp <= 0, side: Math.random() < 0.5 ? 0.12 : -0.12 });
                } else {
                    this.scene.gunClickEffect(); this.showMessage("空包弹", 1500);
                    if (!(isSelf && selfShot)) this.scene.demonReact('blank', { self: !isSelf && selfShot });
                }
            };
            this.scene.playShootSequence({ shooterIsMe: isSelf, selfShot: selfShot, live: !!result.live, damage: result.damage, victimIsMe: victimIsMe }, climax, afterShot);`);
s = repRe(s, /\} else if \(type === 'shoot'\) \{[\s\S]*?(?=\r?\n        \}\r?\n    \}\r?\n\r?\n    finalizeAction\(\) \{)/g, SHOOT, 1);

save('game.js', s);
console.log('game.js patched');
