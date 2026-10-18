// ==================== 工具函数与全局设置 ====================
function bindTap(id, callback) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', callback);
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            callback(e);
        });
    }
}

const GlobalSettings = {
    brightness: 1.0,
    bgmEnabled: true,
    setBrightness(val) {
        this.brightness = parseFloat(val);
        document.getElementById('brightness-val').innerText = this.brightness.toFixed(2);
        if (window._sceneManager) window._sceneManager.applyBrightness(this.brightness);
    },
    setBGM(enabled) {
        this.bgmEnabled = enabled;
        if (!enabled && audioMgr) audioMgr.stopBGM();
        if (enabled && audioMgr && audioMgr._wasPlaying) audioMgr.startBGM();
    }
};

// ---------- 音频管理器 ----------
class AudioManager {
    constructor() {
        this.sounds = {
            shoot: new Audio('./src/audio/ak47_shoot.ogg'),
            check: new Audio('./src/audio/ak47_put_away.ogg'),
            reload: new Audio('./src/audio/ak47_reload_empty.ogg'),
            gun_click: new Audio('./src/audio/gun_click.mp3'),
            q1: new Audio('./src/audio/92.ogg'), q2: new Audio('./src/audio/91.ogg'), q3: new Audio('./src/audio/10.ogg'), q4: new Audio('./src/audio/117.ogg'),
            beer: new Audio('./src/audio/pijiu.mp3'), cigarette: new Audio('./src/audio/huoji.mp3'), handcuffs: new Audio('./src/audio/shoukao.mp3'),
            saw: new Audio('./src/audio/juduan.mp3'), morphine: new Audio('./src/audio/zhen.mp3'),
            uiHover: new Audio('./src/audio/UI1.mp3'), uiClick: new Audio('./src/audio/UiOpen.mp3'),
            chestOpen: new Audio('./src/audio/chestopen.mp3'), chestFull: new Audio('./src/audio/chestfull.mp3'),
            itemWhoosh: new Audio('./src/audio/itemwhoosh.mp3'), itemFull: new Audio('./src/audio/itemfull.mp3'), itemFull1: new Audio('./src/audio/itemfull1.mp3'),
            taser: new Audio('./src/audio/taser_zap.mp3'),
            pacemaker: new Audio('./src/audio/pacemaker_revive.mp3'),
            heartbeat: new Audio('./src/audio/hartbeat.mp3')
        };
        this.bgm = new Audio('./src/audio/bgm.ogg');
        this.bgm.volume = 0;
        this.bgm.loop = true;
        this.bgmTimer = null;
        this._wasPlaying = false;
        this.fadeInterval = null;
    }
    fadeInBGM(duration = 2000) {
        this.stopBGM();
        this.bgm.loop = true;
        this.bgm.currentTime = 0;
        this.bgm.play().catch(() => {});
        this._wasPlaying = true;
        const steps = 20, targetVolume = 0.5;
        let step = 0;
        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            step++;
            this.bgm.volume = Math.min(targetVolume, targetVolume * (step / steps));
            if (step >= steps) { clearInterval(this.fadeInterval); this.bgm.volume = targetVolume; }
        }, duration / steps);
    }
    fadeOutBGM(duration = 2000, callback) {
        if (!this.bgm || this.bgm.paused) { if (callback) callback(); return; }
        const steps = 20;
        let step = steps;
        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            step--;
            this.bgm.volume = Math.max(0, 0.5 * (step / steps));
            if (step <= 0) { clearInterval(this.fadeInterval); this.stopBGM(); if (callback) callback(); }
        }, duration / steps);
    }
    startBGM() {
        if (!GlobalSettings.bgmEnabled) return;
        this.stopBGM();
        this.bgm.loop = true;
        this.bgm.volume = 0.5;
        this.bgm.currentTime = 0;
        this.bgm.play().catch(() => {});
        this._wasPlaying = true;
        if (this.bgmTimer) clearInterval(this.bgmTimer);
        this.bgmTimer = setInterval(() => {
            if (!GlobalSettings.bgmEnabled) { this.stopBGM(); return; }
            if (this.bgm.paused) {
                this.bgm.currentTime = 0;
                this.bgm.play().catch(() => {});
            }
        }, 10000);
    }
    stopBGM() {
        this._wasPlaying = false;
        if (this.bgmTimer) clearInterval(this.bgmTimer);
        this.bgmTimer = null;
        this.bgm.pause();
        this.bgm.currentTime = 0;
    }
    play(id) {
        if (this.sounds[id]) {
            const sound = this.sounds[id];
            sound.pause();
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
}
const audioMgr = new AudioManager();
const QUICK_CHATS = { q1: "哎呀，你看起来要输了", q2: "傻子", q3: "别浪费我时间了", q4: "运气实在太不好了" };

// ---------- 道具格子精确坐标 ----------
function getItemSlotPosition(slotIndex, side) {
    const playerZ = 4.5, enemyZ = -5.5;
    const gz = side === 'player' ? playerZ : enemyZ;
    const slots = [
        new THREE.Vector3(-2.8, 0.55, gz - 0.6),
        new THREE.Vector3(-1.6, 0.55, gz - 0.6),
        new THREE.Vector3(-2.8, 0.55, gz + 0.6),
        new THREE.Vector3(-1.6, 0.55, gz + 0.6),
        new THREE.Vector3( 1.6, 0.55, gz - 0.6),
        new THREE.Vector3( 2.8, 0.55, gz - 0.6),
        new THREE.Vector3( 1.6, 0.55, gz + 0.6),
        new THREE.Vector3( 2.8, 0.55, gz + 0.6),
    ];
    const _r = slots[slotIndex % 8]; _r.y = 0.12; return _r;
}

// ---------- 3D 场景管理器 ----------
class SceneManager {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0506, 0.035);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 5.2, 10.2);
        this.camera.lookAt(0, 0.5, 0);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x0a0506);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.container.appendChild(this.renderer.domElement);

        this.handTargetX = 2.6; this.handTargetY = 1.6; this.handTargetZ = -6.0;
        this.handCurrentX = 2.6; this.handCurrentY = 1.6; this.handCurrentZ = -6.0;
        this.ambientLight = null; this.centerSpot = null; this.demonGlow = null; this.demonGlow2 = null;
        this.demonHand = null; this.armConnector = null; this.eyeMat = null;
        this.leftEye = null; this.rightEye = null; this.thirdEye = null;
        this.shoulderPos = new THREE.Vector3(2.6, 1.6, -6.0);
        this.gunBarrel = null;
        this.discardedItems = [];
        this.tableItemMeshes = [];
        this.demonHp = 4;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.interactiveObjects = [];
        this.highlightMaterialMap = new Map();
        this.currentHovered = null;
        this.itemInteractionEnabled = false;
        this.tooltipSprites = new Map();

        this.initEnvironment();
        if (window.innerWidth <= 768) this.camera.position.z = 12.0;
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            if (window.innerWidth <= 768) this.camera.position.z = 12.0;
            else this.camera.position.z = 10.2;
            this.camera.lookAt(0, 0.5, 0);
        });
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
            this.onMouseClick({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        this.renderer.domElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        this.animate();
    }

    createCigaretteModel() { return M_createCigaretteModel(); }
    createBeerModel() { return M_createBeerModel(); }
    createHandcuffsModel() { return M_createHandcuffsModel(); }
    createSawModel() { return M_createSawModel(); }
    createMorphineModel() { return M_createMorphineModel(); }
    createMagnifierModel() { return M_createMagnifierModel(); }
    createItemModelById(id) { return M_createItemModelById(id); }

    applyBrightness(val) {
        if (this.ambientLight) this.ambientLight.intensity = 0.32 * val;
        if (this.centerSpot) this.centerSpot.intensity = 4.2 * val;
        const _tb = this.scene.getObjectByName('table'); if (_tb) _tb.traverse(o => { if (o.isLight && o.userData.base !== undefined) o.intensity = o.userData.base * val; });
        if (this.demonGlow) this.demonGlow.intensity = 0.6 * val;
        if (this.demonGlow2) this.demonGlow2.intensity = 0.3 * val;
    }
    setDemonHandVisible(visible) {
        if (this.demonHand) this.demonHand.visible = visible;
        if (this.armConnector) this.armConnector.visible = visible;
    }
    clearDiscardedItems() { for (let item of this.discardedItems) this.scene.remove(item.mesh); this.discardedItems = []; this.hideTableInfo(); }
    addDiscardedItem(mesh, velocity) { this.discardedItems.push({ mesh, velocity: velocity.clone() }); this.scene.add(mesh); }
    resetGun() {
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
        setDemonHp(hp) { this.demonHp = hp; }

    initEnvironment() {
        try { M_initScene(this.scene, GlobalSettings.brightness, this); } catch (e) { console.error('场景初始化失败:', e); return; }
        this.gunGroup = this.scene.getObjectByName('gunGroup');
        this.demonGroup = this.scene.getObjectByName('demonGroup');
        this.demonHand = this.scene.getObjectByName('demonHand');
        this.armConnector = this.scene.getObjectByName('armConnector');
        this.leftEye = this.scene.getObjectByName('leftEye');
        this.rightEye = this.scene.getObjectByName('rightEye');
        this.thirdEye = this.scene.getObjectByName('thirdEye');
        this.eyeMat = this.leftEye ? this.leftEye.material : null;
        this.gunBarrel = this.gunGroup ? this.gunGroup.children.find(c => c.geometry && c.geometry.type === 'CylinderGeometry' && c.position.z < -1) : null;
        this.centerSpot = this.scene.getObjectByName('centerSpot');
        this.ambientLight = this.scene.getObjectByName('ambientLight');
        this.demonGlow = this.scene.getObjectByName('demonGlow');
        this.demonGlow2 = this.scene.getObjectByName('demonGlow2');
        this.setDemonHandVisible(true);
    }

    setDemonHandReaching(isReaching) {
        if (isReaching) { this.handTargetX = 0.18; this.handTargetY = 0.32; this.handTargetZ = -0.25; }
        else { this.handTargetX = 2.6; this.handTargetY = 1.6; this.handTargetZ = -6.0; }
    }
    aimAt(target) {
        if (!this.gunGroup) return;
        const duration = 400, startRot = this.gunGroup.rotation.y;
        let endRot = 0;
        if (target === 'enemy') endRot = 0;
        if (target === 'self') endRot = Math.PI;
        if (target === 'center') endRot = 0;
        let startTime = null;
        const anim = (time) => {
            if (!startTime) startTime = time;
            const p = Math.min((time - startTime) / duration, 1);
            this.gunGroup.rotation.y = startRot + (endRot - startRot) * (1 - Math.pow(1 - p, 3));
            if (p < 1) requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
    }
    shootEffect(opts = {}) {
        if (!this.gunGroup) return;
        const victimIsMe = !!opts.victimIsMe, shooterIsMe = opts.shooterIsMe !== false;
        if (typeof FX !== 'undefined') FX.gunshot(true);
        audioMgr.sounds.shoot.volume = 1.0;
        audioMgr.play('shoot');
        // 枪口火光：常驻灯（强度归零），避免每次开枪增删灯光导致着色器重编译卡顿
        if (!this._muzzleLight) {
            this._muzzleLight = new THREE.PointLight(0xffc070, 0, 30);
            this._muzzleLight.position.set(0, 0.4, -3.4);
            this.gunGroup.add(this._muzzleLight);
        }
        const light = this._muzzleLight; light.position.z = this.gunSawn ? -2.4 : -3.5;
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.95 }));
        core.position.set(0, 0.4, this.gunSawn ? -2.4 : -3.6);
        this.gunGroup.add(core);
        const t0 = performance.now();
        const decay = () => {
            const p = (performance.now() - t0) / 170;
            if (p >= 1) { light.intensity = 0; this.gunGroup.remove(core); core.geometry.dispose(); core.material.dispose(); return; }
            light.intensity = 24 * (1 - p); core.material.opacity = 0.95 * (1 - p); core.scale.setScalar(1 + p * 1.8);
            requestAnimationFrame(decay);
        };
        requestAnimationFrame(decay);
        // 后坐力
        this.gunGroup.translateZ(1.3); this.gunGroup.rotation.x -= 0.2;
        setTimeout(() => { this.gunGroup.translateZ(-1.3); this.gunGroup.rotation.x += 0.2; }, 130);
        // 摄像机：被击中的一方由 FX.hitImpact 负责更猛的抖动
        if (!victimIsMe) { this.shakeCamera(shooterIsMe ? 0.6 : 0.4, 700, 1.2); this.kickFov(shooterIsMe ? 5 : 3, 300); }
    }
    gunClickEffect() {
        if (!this.gunGroup) return;
        audioMgr.play('gun_click');
        this.gunGroup.rotation.z += 0.12;
        this.gunGroup.position.z += 0.3;
        setTimeout(() => { this.gunGroup.rotation.z -= 0.12; this.gunGroup.position.z -= 0.3; }, 100);
    }
    checkShellEffect() {
        if (!this.gunGroup) return;
        audioMgr.play('check');
        this.gunGroup.rotation.z += 0.4;
        setTimeout(() => this.gunGroup.rotation.z -= 0.4, 400);
    }
    reloadAnimation() {
        if (!this.gunGroup) return;
        audioMgr.play('reload');
        this.setDemonHandReaching(false);
        this.gunGroup.position.y = 0.2;
        this.gunGroup.rotation.z = 0.2;
        setTimeout(() => { this.gunGroup.position.y = 0.4; this.gunGroup.rotation.z = 0; }, 800);
    }

    playCrateDropAnimation(newPlayerItems, newEnemyItems, allPlayerItems, allEnemyItems, onComplete) {
        const crateGroup = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), woodMat); body.position.y = 0.4;
        const lid = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.15, 1.25), woodMat); lid.position.y = 0.9; lid.name = 'lid';
        const border = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 1.3), new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true })); border.position.y = 0.45;
        crateGroup.add(body); crateGroup.add(lid); crateGroup.add(border);
        crateGroup.position.set(-1.5, 7, 1.2); crateGroup.rotation.set(0.1, 0.2, 0.15);
        this.scene.add(crateGroup);
        const startY = 7, endY = 0.7, dropDuration = 800, startTime = Date.now();
        const dropAnim = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / dropDuration, 1);
            crateGroup.position.y = startY + (endY - startY) * (t * t);
            if (t < 1) requestAnimationFrame(dropAnim);
            else { audioMgr.play('chestFull'); this.bounceCrate(crateGroup, lid, newPlayerItems, newEnemyItems, allPlayerItems, allEnemyItems, onComplete); }
        };
        requestAnimationFrame(dropAnim);
    }
    bounceCrate(crateGroup, lid, newPlayerItems, newEnemyItems, allPlayerItems, allEnemyItems, onComplete) {
        let bounceCount = 0;
        const maxBounces = 3, bounceHeight = [0.15, 0.08, 0.03], bounceTime = 100;
        const doBounce = () => {
            if (bounceCount < maxBounces) {
                crateGroup.position.y = 0.7 + bounceHeight[bounceCount];
                const shakeAngle = 0.03 * (maxBounces - bounceCount);
                crateGroup.rotation.z = shakeAngle;
                setTimeout(() => {
                    crateGroup.position.y = 0.7; crateGroup.rotation.z = -shakeAngle * 0.5;
                    setTimeout(() => { crateGroup.rotation.z = 0; }, 50);
                    bounceCount++;
                    setTimeout(doBounce, 80);
                }, bounceTime);
            } else {
                this.openCrateAndSpawnItems(crateGroup, lid, newPlayerItems, newEnemyItems, allPlayerItems, allEnemyItems, () => {
                    this.scene.remove(crateGroup);
                    if (onComplete) onComplete();
                });
            }
        };
        doBounce();
    }
    openCrateAndSpawnItems(crateGroup, lid, newPlayerItems, newEnemyItems, allPlayerItems, allEnemyItems, onComplete) {
        audioMgr.play('chestOpen');
        const targetRotX = -Math.PI / 2, startTime = Date.now();
        const lidAnim = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / 300, 1);
            lid.rotation.x = targetRotX * t;
            if (t < 1) requestAnimationFrame(lidAnim);
            else { this.spawnItemsSequentially(newPlayerItems, newEnemyItems, allPlayerItems, allEnemyItems, onComplete); }
        };
        requestAnimationFrame(lidAnim);
    }
    spawnItemsSequentially(newPlayerItems, newEnemyItems, allPlayerItems, allEnemyItems, onComplete) {
        const cratePos = new THREE.Vector3(-1.5, 0.7, 1.2);
        const newItems = [
            ...newPlayerItems.map((item) => ({ ...item, side: 'player' })),
            ...newEnemyItems.map((item) => ({ ...item, side: 'enemy' }))
        ];
        if (newItems.length === 0) { if (onComplete) onComplete(); return; }

        let index = 0;
        const processNext = () => {
            try {
            if (index >= newItems.length) { if (onComplete) onComplete(); return; }
            const itemData = newItems[index];
            const model = this.createItemModelById(itemData.id);
            if (!model) { index++; setTimeout(processNext, 50); return; }
            model.position.copy(cratePos);
            this.scene.add(model);
            if (!(this.muteEnemyItemSounds && itemData.side === 'enemy')) audioMgr.play('itemWhoosh');

            const side = itemData.side;

            // 心脏起搏器特殊处理：飞到桌面中间
            if (itemData.id === 'defibrillator') {
                const targetPos = new THREE.Vector3(0, 0.75, side === 'player' ? 4.8 : -4.0);
                const startTime = Date.now(), duration = 600;
                const anim = () => {
                    const elapsed = Date.now() - startTime;
                    const t = Math.min(elapsed / duration, 1);
                    const easeOut = 1 - Math.pow(1 - t, 3);
                    model.position.x = cratePos.x + (targetPos.x - cratePos.x) * easeOut;
                    model.position.y = cratePos.y + (targetPos.y - cratePos.y) * easeOut;
                    model.position.z = cratePos.z + (targetPos.z - cratePos.z) * easeOut;
                    if (t < 1) requestAnimationFrame(anim);
                    else {
                        if (!(this.muteEnemyItemSounds && side === 'enemy')) audioMgr.play(Math.random() < 0.5 ? 'itemFull' : 'itemFull1');
                        model.name = side + '_pacemaker';
                        model.userData.floatAnim = true;
                        model.userData.floatPhase = Math.random() * Math.PI * 2;
                        index++;
                        setTimeout(processNext, 200);
                    }
                };
                requestAnimationFrame(anim);
                return;
            }

            // 普通道具：必须有合法的 slotIndex
            if (itemData.slotIndex === undefined || itemData.slotIndex < 0) {
                index++;
                setTimeout(processNext, 100);
                return;
            }

            const targetPos = getItemSlotPosition(itemData.slotIndex, side); targetPos.y += model.userData.restOffset || 0;
            model.userData.itemData = { id: itemData.id, side, slotIndex: itemData.slotIndex };

            const startTime = Date.now(), duration = 600;
            const anim = () => {
                const elapsed = Date.now() - startTime;
                const t = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - t, 3);
                model.position.x = cratePos.x + (targetPos.x - cratePos.x) * easeOut;
                model.position.y = cratePos.y + (targetPos.y - cratePos.y) * easeOut;
                model.position.z = cratePos.z + (targetPos.z - cratePos.z) * easeOut;
                if (t < 1) requestAnimationFrame(anim);
                else {
                    if (!(this.muteEnemyItemSounds && side === 'enemy')) audioMgr.play(Math.random() < 0.5 ? 'itemFull' : 'itemFull1');
                    this.addInteractiveModel(model);
                    index++;
                    setTimeout(processNext, 200);
                }
            };
            requestAnimationFrame(anim);
            } catch(e) {
                console.error('spawnItemsSequentially error:', e);
                index++;
                setTimeout(processNext, 50);
            }
        };
        processNext();
    }

    addInteractiveModel(model) {
        this.tableItemMeshes.push(model);
        this.interactiveObjects.push(model);
        const materialRecords = [];
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat, idx) => {
                    if (mat.emissive) {
                        materialRecords.push({
                            mesh: child, materialIndex: Array.isArray(child.material) ? idx : -1,
                            originalEmissive: mat.emissive.getHex(), originalIntensity: mat.emissiveIntensity || 0
                        });
                    }
                });
            }
        });
        this.highlightMaterialMap.set(model, materialRecords);
    }
    applyHighlight(model, enable) {
        const records = this.highlightMaterialMap.get(model);
        if (!records) return;
        records.forEach(rec => {
            const mat = Array.isArray(rec.mesh.material) ? rec.mesh.material[rec.materialIndex] : rec.mesh.material;
            if (enable) { mat.emissive.set(0xffffff); mat.emissiveIntensity = 0.8; }
            else { mat.emissive.set(rec.originalEmissive); mat.emissiveIntensity = rec.originalIntensity; }
        });
    }

    createTooltipSprite(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, 128, 36);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, opacity: 0 });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.6, 0.4, 1);
        sprite.userData.floatPhase = Math.random() * Math.PI * 2;
        return sprite;
    }
    showItemTooltip(model, text) {
        this.hideItemTooltip(model);
        const sprite = this.createTooltipSprite(text);
        sprite.position.copy(model.position);
        sprite.position.y += 0.8;
        this.scene.add(sprite);
        this.tooltipSprites.set(model, sprite);
        const material = sprite.material;
        const startTime = Date.now();
        const fadeIn = () => {
            const elapsed = Date.now() - startTime;
            const opacity = Math.min(0.9, elapsed / 400 * 0.9);
            material.opacity = opacity;
            if (opacity < 0.9) requestAnimationFrame(fadeIn);
        };
        fadeIn();
    }
    hideItemTooltip(model) {
        const sprite = this.tooltipSprites.get(model);
        if (sprite) { this.scene.remove(sprite); this.tooltipSprites.delete(model); }
        if (model._tooltipDelayTimer) { clearTimeout(model._tooltipDelayTimer); model._tooltipDelayTimer = null; }
    }

    static ITEM_DESC = {
        check_shell: ['检查弹膛', '查看下一发是实弹还是空包'],
        beer: ['啤酒', '退出当前子弹'],
        cigarette: ['香烟', '恢复1点生命'],
        handcuffs: ['手铐', '对家下回合跳过'],
        saw: ['手锯', '本回合伤害翻倍'],
        morphine: ['麻药', '偷取对家一个道具'],
        taser: ['电击器', '对家下回合禁用道具'],
        defibrillator: ['心脏起搏器', '受到致命伤害时抵命']
    };

    showTableInfo(itemId) {
        this.hideTableInfo();
        const info = SceneManager.ITEM_DESC[itemId];
        if (!info) return;
        const canvas = document.createElement('canvas');
        canvas.width = 480; canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 480, 120);
        // 名称（浅白）
        ctx.fillStyle = '#eee';
        ctx.font = 'bold 28px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(info[0], 240, 42);
        // 说明（灰色）
        ctx.fillStyle = '#999';
        ctx.font = '22px "Microsoft YaHei", Arial';
        ctx.shadowBlur = 3;
        ctx.fillText(info[1], 240, 80);
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(0, 0.18, 4.0);
        mesh.name = 'table_item_info';
        this.scene.add(mesh);
        this._tableInfoMesh = mesh;
    }
    hideTableInfo() {
        if (this._tableInfoMesh) { this.scene.remove(this._tableInfoMesh); this._tableInfoMesh = null; }
    }

    renderTableItems(playerItems, enemyItems) {
        if (!playerItems) playerItems = [];
        if (!enemyItems) enemyItems = [];
        this.interactiveObjects.forEach(obj => this.applyHighlight(obj, false));
        this.interactiveObjects = []; this.highlightMaterialMap.clear();
        this.tooltipSprites.forEach((sprite, model) => this.scene.remove(sprite));
        this.tooltipSprites.clear();
        this.tableItemMeshes.forEach(mesh => { try { this.scene.remove(mesh); } catch(e) {} });
        this.tableItemMeshes = [];

        playerItems.forEach((item) => {
            try {
                const model = this.createItemModelById(item.id);
                if (model) {
                    const slotIndex = item.slotIndex !== undefined ? item.slotIndex : 0;
                    model.position.copy(getItemSlotPosition(slotIndex, 'player')); model.position.y += model.userData.restOffset || 0;
                    model.userData.itemData = { id: item.id, side: 'player', slotIndex };
                    this.scene.add(model); this.addInteractiveModel(model);
                }
            } catch(e) {}
        });

        enemyItems.forEach((item) => {
            try {
                const model = this.createItemModelById(item.id);
                if (model) {
                    const slotIndex = item.slotIndex !== undefined ? item.slotIndex : 0;
                    model.position.copy(getItemSlotPosition(slotIndex, 'enemy')); model.position.y += model.userData.restOffset || 0;
                    model.userData.itemData = { id: item.id, side: 'enemy', slotIndex };
                    this.scene.add(model); this.addInteractiveModel(model);
                }
            } catch(e) {}
        });
    }

    findModelBySideAndId(side, itemId) {
        return this.interactiveObjects.find(obj =>
            obj.userData.itemData &&
            obj.userData.itemData.side === side &&
            obj.userData.itemData.id === itemId
        );
    }

    findModelBySlot(side, slotIndex) {
        return this.interactiveObjects.find(obj =>
            obj.userData.itemData &&
            obj.userData.itemData.side === side &&
            obj.userData.itemData.slotIndex === slotIndex
        );
    }

    onMouseMove(event) {
        if (!this.itemInteractionEnabled) {
            if (this.currentHovered) { this.clearHover(); }
            return;
        }
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / this.renderer.domElement.clientHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj && !this.interactiveObjects.includes(obj)) obj = obj.parent;
            if (obj && obj !== this.currentHovered) {
                if (this.currentHovered) { this.clearHover(); }
                this.currentHovered = obj;
                this.applyHighlight(obj, true);
                // 保存原始位置/旋转，开始倾斜悬浮
                if (!obj.userData._origPos) {
                    obj.userData._origPos = obj.position.clone();
                    obj.userData._origRot = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };
                }
                obj.userData._tilt = true;
                const itemData = obj.userData.itemData;
                if (itemData) this.showTableInfo(itemData.id);
            }
        } else {
            if (this.currentHovered) { this.clearHover(); }
        }
    }
    clearHover() {
        if (this.currentHovered) {
            this.applyHighlight(this.currentHovered, false);
            this.currentHovered.userData._tilt = false;
            this.currentHovered = null;
            this.hideTableInfo();
        }
    }
    onMouseClick(event) {
        if (!this.itemInteractionEnabled || !this.currentHovered) return;
        const itemData = this.currentHovered.userData.itemData;
        if (!itemData) return;
        if (window._gameEngine) window._gameEngine.handleItemModelClick(itemData);
    }
    setItemInteractionEnabled(enabled) {
        this.itemInteractionEnabled = enabled;
        if (!enabled) { if (this.currentHovered) { this.hideItemTooltip(this.currentHovered); this.clearHover(); } }
    }
    removeItemModel(model) {
        const idx = this.interactiveObjects.indexOf(model);
        if (idx !== -1) this.interactiveObjects.splice(idx, 1);
        this.applyHighlight(model, false); this.highlightMaterialMap.delete(model);
        this.hideItemTooltip(model);
        const meshIdx = this.tableItemMeshes.indexOf(model);
        if (meshIdx !== -1) this.tableItemMeshes.splice(meshIdx, 1);
        this.scene.remove(model);
    }

    _fpWarmup() {
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
            tmp.add(sp); tmp.add(m1); tmp.add(m2); tmp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -0.01)]), new THREE.LineBasicMaterial({ color: 0x66ccff, transparent: true, fog: false, depthTest: false }))); this._fpTexGet('smoke'); this._fpTexGet('spark'); tmp.position.set(0, 0, 3);
            cam.add(tmp);
            this.renderer.compile(this.scene, cam);
            cam.remove(tmp);
            wtex.dispose(); sp.material.dispose(); m1.geometry.dispose(); m1.material.dispose(); m2.geometry.dispose(); m2.material.dispose();
        } catch (e) { /* warm-up is optional */ }
    }
    _fpTexGet(kind) {
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
            rig.visible = t < (cfg.handEnd !== undefined ? cfg.handEnd : (cfg.dur - 0.1));
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
        const CUT = V(0, 0.86, -2.1);
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
                this.sawOffGun();
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

    _fpGunAssembly(ctx) {
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

    _camHome() {
        const cam = this.camera;
        cam.position.set(0, 5.2, (window.innerWidth <= 768) ? 12.0 : 10.2);
        cam.lookAt(0, 0.5, 0);
        cam.fov = 60; cam.updateProjectionMatrix();
    }
    _runCamShot(dur, fn, done) {
        this._camShot = { t0: performance.now(), last: performance.now(), el: 0, dur: dur, fn: fn };
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
        const skin = new THREE.MeshStandardMaterial({ color: 0xc2987a, roughness: 0.75, emissive: 0x4a3526 });
        const cloth = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.95, emissive: 0x0c0c10 });
        const sleeveGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.0, 12); sleeveGeo.translate(0, -0.5, 0);
        const sleeve = new THREE.Mesh(sleeveGeo, cloth); sleeve.rotation.z = 0.85; sleeve.position.set(0.02, -0.12, 0.12); rig.add(sleeve);
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.13), skin); palm.position.set(0, -0.1, 0.1); palm.rotation.z = 0.3; rig.add(palm);
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.015, 0.12, 8), skin); thumb.position.set(-0.04, -0.035, 0.07); thumb.rotation.z = -0.9; rig.add(thumb);
        const indexF = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.14, 8), skin); indexF.position.set(0.035, -0.02, 0.06); indexF.rotation.z = 0.9; rig.add(indexF);
        const cig = this.createCigaretteModel(); cig.scale.setScalar(0.85); cig.position.set(0, 0, -0.12); rig.add(cig);
        // no extra light here: changing the light count recompiles every shader and freezes the game
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

    playCigaretteAnimation(userPosition, onComplete, isSelf) {
        if (isSelf) { this.playCigaretteFirstPerson(userPosition, onComplete); return; }
        const cig = this.createCigaretteModel(); cig.position.copy(userPosition); this.scene.add(cig);
        const targetMouth = userPosition.clone().add(new THREE.Vector3(0, 0.25, 0.15));
        const startTime = Date.now(), duration = 800;
        const anim = () => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(elapsed / duration, 1);
            cig.position.lerpVectors(userPosition, targetMouth, p);
            if (p < 1) requestAnimationFrame(anim);
            else setTimeout(() => {
                this.addDiscardedItem(cig, new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15));
                if (onComplete) onComplete();
            }, 300);
        }; requestAnimationFrame(anim);
    }
    playBeerAnimation(userPosition, onComplete) {
        if (this._fpTake()) { this.playBeerFirstPerson(userPosition, onComplete); return; }
        const beer = this.createBeerModel(); beer.position.copy(userPosition); this.scene.add(beer);
        const targetMouth = userPosition.clone().add(new THREE.Vector3(0, 0.25, 0.1));
        const startTime = Date.now(), duration = 700;
        const anim = () => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(elapsed / duration, 1);
            beer.position.lerpVectors(userPosition, targetMouth, p);
            if (p < 1) requestAnimationFrame(anim);
            else {
                beer.rotation.z = -0.8;
                for (let i = 0; i < 5; i++) {
                    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
                    drop.position.copy(beer.position).add(new THREE.Vector3(0, -0.05, 0.1));
                    this.addDiscardedItem(drop, new THREE.Vector3((Math.random() - 0.5) * 0.1, -0.05 - Math.random() * 0.15, (Math.random() - 0.5) * 0.1));
                }
                setTimeout(() => {
                    this.addDiscardedItem(beer, new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15));
                    if (onComplete) onComplete();
                }, 200);
            }
        }; requestAnimationFrame(anim);
    }
    playHandcuffsAnimation(userPosition, targetPosition, onComplete) {
        if (this._fpTake()) { this.playHandcuffsFirstPerson(userPosition, targetPosition, onComplete); return; }
        const cuffs = this.createHandcuffsModel(); cuffs.position.copy(userPosition); this.scene.add(cuffs);
        const startTime = Date.now(), duration = 600;
        const anim = () => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(elapsed / duration, 1);
            cuffs.position.lerpVectors(userPosition, targetPosition, p);
            if (p < 1) requestAnimationFrame(anim);
            else setTimeout(() => { this.addDiscardedItem(cuffs, new THREE.Vector3(0, -0.1, 0)); if (onComplete) onComplete(); }, 200);
        }; requestAnimationFrame(anim);
    }
    playSawAnimation(userPosition, onComplete) {
        if (this._fpTake()) { this.playSawFirstPerson(onComplete); return; }
        const saw = this.createSawModel(); saw.position.copy(userPosition); this.scene.add(saw);
        const gunBarrelWorldPos = new THREE.Vector3(0, 0.8, -1.4);
        const startTime = Date.now(), duration = 700;
        const anim = () => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(elapsed / duration, 1);
            saw.position.lerpVectors(userPosition, gunBarrelWorldPos, p);
            if (p < 1) requestAnimationFrame(anim);
            else {
                this.sawOffGun();
                this.addDiscardedItem(saw, new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15));
                if (onComplete) onComplete();
            }
        }; requestAnimationFrame(anim);
    }
    playMorphineAnimation(userPosition, targetPosition, onComplete) {
        if (this._fpTake()) { this.playMorphineFirstPerson(userPosition, targetPosition, onComplete); return; }
        const syringe = this.createMorphineModel(); syringe.position.copy(userPosition); this.scene.add(syringe);
        const startTime = Date.now(), duration = 500;
        const anim = () => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(elapsed / duration, 1);
            syringe.position.lerpVectors(userPosition, targetPosition, p);
            if (p < 1) requestAnimationFrame(anim);
            else setTimeout(() => {
                this.addDiscardedItem(syringe, new THREE.Vector3(0, -0.15, 0));
                if (onComplete) onComplete();
            }, 200);
        }; requestAnimationFrame(anim);
    }

    playTaserAnimation(userPosition, targetPosition, onComplete) {
        if (this._fpTake()) { this.playTaserFirstPerson(onComplete); return; }
        const taser = this.createItemModelById('taser');
        taser.position.copy(userPosition);
        taser.scale.set(1.35, 1.35, 1.35);
        this.scene.add(taser);

        const startTime = Date.now(), duration = 350;
        const anim = () => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            taser.position.lerpVectors(userPosition, targetPosition, ease);
            if (p < 1) requestAnimationFrame(anim);
            else {
                this.scene.remove(taser);
                // 蓝色电击闪光
                const blueLight = new THREE.PointLight(0x4488ff, 10, 6);
                blueLight.position.copy(targetPosition);
                this.scene.add(blueLight);
                const glow = new THREE.Mesh(
                    new THREE.SphereGeometry(0.2, 12, 12),
                    new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.7 })
                );
                glow.position.copy(targetPosition);
                this.scene.add(glow);
                // 渐消
                setTimeout(() => {
                    this.scene.remove(blueLight);
                    glow.material.opacity = 0;
                    setTimeout(() => this.scene.remove(glow), 50);
                }, 600);
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(anim);
    }

    showPacemaker(actor) {
        const side = (actor === 'host') ? 'player' : 'enemy';
        const z = side === 'player' ? 4.8 : -3.0;
        const existing = this.scene.getObjectByName(side + '_pacemaker');
        if (existing) this.scene.remove(existing);
        const model = M_createPacemakerModel();
        model.position.set(0, 0.8, z);
        model.name = side + '_pacemaker';
        model.userData.floatAnim = true;
        model.userData.floatPhase = Math.random() * Math.PI * 2;
        this.scene.add(model);
    }
    removePacemaker(actor) {
        const side = (actor === 'host') ? 'player' : 'enemy';
        const model = this.scene.getObjectByName(side + '_pacemaker');
        if (model) this.scene.remove(model);
    }

    // 摄像机抖动：多个冲击可叠加，幅度二次衰减；渲染时临时偏移，渲染后复原，不污染基准位姿
    shakeCamera(strength = 1, duration = 900, freq = 1) {
        if (!this._shakes) this._shakes = [];
        this._shakes.push({ t0: performance.now(), dur: duration, amp: strength, freq: freq, seed: Math.random() * 100 });
    }
    kickFov(delta = 8, duration = 500) { this._fovKick = { t0: performance.now(), dur: duration, delta: delta }; }
    _renderWithShake() {
        const cam = this.camera, now = performance.now();
        if (this._camShot) { const k = this._camShot; k.el += Math.min(now - k.last, 50); k.last = now; const kp = Math.min(k.el / k.dur, 1); k.fn(kp, cam); if (kp >= 1) { this._camShot = null; this._camHome(); if (this._camShotDone) { const d = this._camShotDone; this._camShotDone = null; d(); } } }
        let ox = 0, oy = 0, oz = 0, roll = 0;
        if (this._shakes && this._shakes.length) {
            this._shakes = this._shakes.filter(s => now - s.t0 < s.dur);
            for (const s of this._shakes) {
                const p = (now - s.t0) / s.dur, e = Math.pow(1 - p, 2) * s.amp, tt = (now - s.t0) * 0.001 * s.freq;
                ox += e * 0.55 * (Math.sin(tt * 53 + s.seed) + 0.5 * Math.sin(tt * 97 + s.seed * 2));
                oy += e * 0.45 * (Math.sin(tt * 61 + s.seed * 3) + 0.5 * Math.sin(tt * 89 + s.seed));
                oz += e * 0.35 * Math.sin(tt * 43 + s.seed * 5);
                roll += e * 0.05 * Math.sin(tt * 47 + s.seed * 7);
            }
        }
        if (this._fovKick) {
            const k = this._fovKick, p = (now - k.t0) / k.dur;
            if (p >= 1) { this._fovKick = null; cam.fov = 60; }
            else cam.fov = 60 + k.delta * Math.pow(1 - p, 2);
            cam.updateProjectionMatrix();
        }
        if (ox || oy || oz || roll) {
            const q = cam.quaternion.clone();
            cam.position.x += ox; cam.position.y += oy; cam.position.z += oz; cam.rotateZ(roll);
            this.renderer.render(this.scene, cam);
            cam.position.x -= ox; cam.position.y -= oy; cam.position.z -= oz; cam.quaternion.copy(q);
        } else {
            this.renderer.render(this.scene, cam);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.gunGroup && this.gunGroup.rotation.y === 0) this.gunGroup.position.y += (0.4 - this.gunGroup.position.y) * 0.1;
        if (this.demonGroup) this.demonGroup.position.y = Math.sin(Date.now() * 0.001) * 0.08;
        if (this.demonGlow && this.eyeMat) {
            let pulse = 0.5 + Math.sin(Date.now() * 0.0025) * 0.25;
            this.demonGlow.intensity = pulse * 1.0 * GlobalSettings.brightness;
            if (this.demonGlow2) this.demonGlow2.intensity = pulse * 0.5 * GlobalSettings.brightness;
            const hp = this.demonHp || 4, maxHp = 6, healthFactor = (maxHp - hp) / maxHp;
            this.eyeMat.emissiveIntensity = 0.5 + healthFactor * 3.5;
            this.eyeMat.emissive.setHSL(0, 1, 0.1 + healthFactor * 0.4);
            const scale = 1 + healthFactor * 0.45;
            if (this.leftEye) this.leftEye.scale.setScalar(scale);
            if (this.rightEye) this.rightEye.scale.setScalar(scale);
            if (this.thirdEye) this.thirdEye.scale.setScalar(scale);
        }
        this._demonFxStep();
        if (this.demonHand && this.demonHand.visible) {
            this.handCurrentX += (this.handTargetX - this.handCurrentX) * 0.12;
            this.handCurrentY += (this.handTargetY - this.handCurrentY) * 0.12;
            this.handCurrentZ += (this.handTargetZ - this.handCurrentZ) * 0.12;
            this.demonHand.position.set(this.handCurrentX, this.handCurrentY, this.handCurrentZ);
            const handPos = new THREE.Vector3(this.handCurrentX, this.handCurrentY, this.handCurrentZ);
            const dir = new THREE.Vector3().subVectors(handPos, this.shoulderPos);
            const length = dir.length();
            if (length > 0.01 && this.armConnector && this.armConnector.visible) {
                const midPoint = new THREE.Vector3().addVectors(this.shoulderPos, handPos).multiplyScalar(0.5);
                this.armConnector.position.copy(midPoint);
                this.armConnector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
                this.armConnector.scale.y = length;
            }
            if (this.handTargetZ > -2) { this.demonHand.rotation.z = -0.25; this.demonHand.rotation.y = -0.3; }
            else { this.demonHand.rotation.z = 0; this.demonHand.rotation.y = 0; }
        }
        for (let item of this.discardedItems) {
            item.velocity.y -= 0.05;
            item.mesh.position.x += item.velocity.x * 0.5; item.mesh.position.y += item.velocity.y; item.mesh.position.z += item.velocity.z * 0.5;
            if (item.mesh.position.y < 0.05) {
                item.mesh.position.y = 0.05; item.velocity.y = 0; item.velocity.x *= 0.3; item.velocity.z *= 0.3;
            }
        }
        const now = Date.now() * 0.001;
        ['player_pacemaker', 'enemy_pacemaker'].forEach(name => {
            const pm = this.scene.getObjectByName(name);
            if (pm && pm.userData.floatAnim) {
                pm.position.y = 0.8 + Math.sin(Date.now() * 0.002 + pm.userData.floatPhase) * 0.05;
                pm.rotation.y += 0.01;
            }
        });
        // 道具悬浮倾斜动画（相对旋转，不改原角度）
        const tiltSpeed = 0.1;
        for (let obj of this.interactiveObjects) {
            const ud = obj.userData;
            if (ud._tilt && ud._origPos) {
                const targetY = ud._origPos.y + 0.1;
                const targetRX = ud._origRot.x + 0.08;
                obj.position.y += (targetY - obj.position.y) * tiltSpeed;
                obj.rotation.x += (targetRX - obj.rotation.x) * tiltSpeed;
            } else if (!ud._tilt && ud._origPos) {
                obj.position.y += (ud._origPos.y - obj.position.y) * tiltSpeed;
                obj.rotation.x += (ud._origRot.x - obj.rotation.x) * tiltSpeed;
            }
        }
        this.tooltipSprites.forEach((sprite, model) => {
            if (sprite && model) {
                const baseY = model.position.y + 0.8;
                const floatY = Math.sin(now * 3 + sprite.userData.floatPhase) * 0.04;
                const floatX = Math.cos(now * 2.5 + sprite.userData.floatPhase) * 0.02;
                sprite.position.x = model.position.x + floatX;
                sprite.position.y = baseY + floatY;
                sprite.position.z = model.position.z;
            }
        });
        this._renderWithShake();
    }
}

// ---------- 游戏逻辑引擎 ----------
class GameEngine {
    constructor(sceneManager, mode = 'sp', options = {}) {
        this.scene = sceneManager;
        this.mode = mode;
        this.role = options.role || 'host';
        this.socket = options.socket || null;
        this.isRemote = (mode === 'mp'); if (this.scene) { this.scene.muteEnemyItemSounds = this.isRemote; if (this.scene._fpWarmup) this.scene._fpWarmup(); }
        this.aiTauntCooldown = 0;
        this.lastContext = null;

        this.battle = new BattleSystem({ maxHp: 4, maxItems: 8 });

        this.timerInterval = null;
        this.timeLeft = 15;
        this.aiPending = false;
        this._animatingRound = false;
        this._bgmStarted = false;
        this._eventsBound = false;
        this._roundSafetyTimer = null;
        this._evQueue = []; this._evBusy = false; this._evBusySince = 0; this._pendingReq = false; this._pendingSince = 0; this._animSince = 0; this._lastBeat = 0;

        this.playerName = options.playerName || '你';
        this.opponentName = options.opponentName || (this.mode === 'sp' ? '恶魔' : '对方');

        this.settings = options.settings || {
            itemChances: { check_shell: 0.2, beer: 0.2, cigarette: 0.15, handcuffs: 0.15, saw: 0.1, morphine: 0.2 },
            bullets: { minLive: 1, maxLive: 4, minBlank: 1, maxBlank: 4 }
        };

        this.ui = {
            pHp: document.getElementById('player-hp'),
            eHp: document.getElementById('enemy-hp'),
            msg: document.getElementById('msg-center'),
            overlay: document.getElementById('damage-overlay'),
            blood: document.getElementById('blood-splatter'),
            timer: document.getElementById('timer-box'),
            enemyBubble: document.getElementById('enemy-bubble'),
            playerBubble: document.getElementById('player-bubble'),
            chatLog: document.getElementById('chat-log'),
            chatInput: document.getElementById('chat-input'),
            bulletCounter: document.getElementById('bullet-counter'),
            turnIndicator: document.getElementById('turn-indicator'),
            score: document.getElementById('score-display'),
            opponentNameDisplay: document.getElementById('opponent-name-display')
        };

        window._gameEngine = this;
        if (this.isRemote) this.scene.setDemonHandVisible(false);
        else this.scene.setDemonHandVisible(true);
        if (this.mode === 'sp') { document.getElementById('chat-container').style.display = 'none'; }
        this.updateOpponentNameDisplay();
        if (window.innerWidth <= 768) {
            document.getElementById('hud').style.fontSize = '12px';
            document.querySelectorAll('.action-btn').forEach(b => b.style.fontSize = '0.9rem');
            document.getElementById('msg-center').style.fontSize = '0.9rem';
        }
        if (this.isRemote) this._netWatchTimer = setInterval(() => this._netWatchdog(), 1000);
        // 延迟一帧启动游戏，确保所有初始化（包括 NetworkManager.onmessage 替换）已完成
        if (mode === 'sp') {
            setTimeout(() => {
                audioMgr.fadeInBGM(2000);
                this.startNewRound();
            }, 0);
        } else if (mode === 'mp' && this.role === 'host') {
            setTimeout(() => {
                audioMgr.fadeInBGM(2000);
                this.startNewRound();
            }, 100); // 多给 100ms 确保客户端的 onmessage 也到位
        }
    }

    // ================= 联机同步：房主权威 + 客户端按序重放 =================
    // 约定：每台机器的 BattleSystem 都按"本机视角"存放：'host' = 我，'client' = 对手，
    //       playerHp / playerItems = 我的，enemy* = 对手的。客户端收到房主数据时整体镜像。
    _isMyTurn() { return this.battle.turn === 'host'; }
    _mirrorRole(r) { return r === 'host' ? 'client' : (r === 'client' ? 'host' : r); }
    _markBusy() { if (!this.isRemote) return; this._evBusy = true; this._evBusySince = Date.now(); }
    _endAct() {
        if (!this.isRemote || !this._evBusy) return;
        this._evBusy = false;
        if (this.role === 'client') setTimeout(() => this._pumpEvents(), 0);
    }

    handleServerMessage(data) {
        if (!data) return;
        if (data.type === 'CHAT_MSG') {
            if (data.senderRole !== this.role) this.handleReceivedChat(data.text, data.qId, data.senderRole);
            return;
        }
        if (data.type === 'SETTINGS_UPDATED') { this.applySettings(data.settings); return; }
        if (!this.isRemote) return;
        if (this.battle.gameOver && data.type !== 'SYNC_ROUND') return;
        if (this.role === 'host') {
            // 房主是唯一权威：客户端只发"请求"
            if (data.type === 'PLAYER_ACTION' && data.actor === 'client') this._hostHandleClientAction(data);
            else if (data.type === 'FORCE_SYNC' && data.req) this.broadcastStateSync(true);
            return;
        }
        // 客户端：房主发来的事件按到达顺序排队重放
        if (data.type === 'SYNC_ROUND' || data.type === 'PLAYER_ACTION' || data.type === 'FORCE_SYNC') {
            this._evQueue.push(data);
            this._pumpEvents();
        }
    }

    _hostHandleClientAction(data) {
        const idle = this.battle.turn === 'client' && !this._evBusy && !this._animatingRound && !this.battle.gameOver;
        if (!idle) { this.broadcastStateSync(true); return; }   // 过期/重复请求：回一份快照让对方解锁
        this._markBusy();
        this.sendNetMessage({ type: 'PLAYER_ACTION', actionType: data.actionType, detail: data.detail, actor: 'client', relay: true });
        this.executeAction(data.actionType, data.detail, 'client', null);
    }

    _pumpEvents() {
        if (!this.isRemote || this.role !== 'client') return;
        while (!this._evBusy && this._evQueue.length) {
            const ev = this._evQueue.shift();
            if (ev.type === 'FORCE_SYNC') {
                if (ev.ack) this._pendingReq = false;
                if (!this.battle.gameOver) this._clientApplySnapshot(ev.state);
                continue;
            }
            if (ev.type === 'SYNC_ROUND') {
                if (this.battle.gameOver) this._clientAutoRestart();
                this._markBusy();
                try {
                    if (ev.newPItems && ev.newEItems) this.applyRoundWithAnimation(ev);
                    else { this.applyRoundSync(ev); this.spawnItemToasts((ev.eItems || []).map(i => i.name)); this._endAct(); }
                } catch (e) { console.error('SYNC_ROUND 处理出错:', e); this._endAct(); }
                break;
            }
            if (ev.type === 'PLAYER_ACTION') {
                if (this.battle.gameOver) continue;
                this._markBusy();
                try { this.executeAction(ev.actionType, ev.detail, ev.actor, null); }
                catch (e) { console.error('PLAYER_ACTION 重放出错:', e); this._endAct(); }
                break;
            }
        }
    }

    _clientAutoRestart() {
        const es = document.getElementById('end-screen');
        if (es) es.style.display = 'none';
        this.battle.resetMatch();
        this._animatingRound = false;
        this.updateScoreDisplay();
        this.scene.clearDiscardedItems(); this.scene.resetGun();
        this.scene.renderTableItems([], []);
    }

    // 房主：当前权威状态（绝对视角 = 房主视角）
    buildState() {
        const b = this.battle;
        return {
            shells: b.shells.slice(),
            pItems: b.playerItems.map(i => ({ ...i })), eItems: b.enemyItems.map(i => ({ ...i })),
            playerHp: b.playerHp, enemyHp: b.enemyHp,
            playerHandcuffed: b.playerHandcuffed, enemyHandcuffed: b.enemyHandcuffed,
            playerShocked: b.playerShocked, enemyShocked: b.enemyShocked,
            playerPacemaker: b.playerPacemaker, enemyPacemaker: b.enemyPacemaker,
            gunDamage: b.gunDamage, knownNextShell: b.knownNextShell ?? null,
            turn: b.turn, nextTurn: b.nextRoundTurn, wins: b.wins, losses: b.losses
        };
    }
    broadcastStateSync(ack = false) {
        if (!this.isRemote || this.role !== 'host') return;
        this.sendNetMessage({ type: 'FORCE_SYNC', state: this.buildState(), ack: !!ack });
    }

    _tableSig() {
        const f = (l) => l.map(i => i.id + ':' + i.slotIndex).join(',');
        return f(this.battle.playerItems) + '/' + f(this.battle.enemyItems);
    }
    _fullSig() {
        const b = this.battle;
        return [b.turn, b.playerHp, b.enemyHp, b.shells.length, b.playerHandcuffed, b.enemyHandcuffed, b.playerShocked, b.enemyShocked,
                b.playerPacemaker, b.enemyPacemaker, b.gunDamage, b.wins, b.losses, this._tableSig()].join('|');
    }

    // 客户端：把房主的绝对状态镜像成本机视角
    _applyMirroredState(s) {
        const b = this.battle;
        const prevP = b.playerPacemaker, prevE = b.enemyPacemaker;
        const before = this._tableSig();
        if (s.enemyHp !== undefined) b.playerHp = s.enemyHp;
        if (s.playerHp !== undefined) b.enemyHp = s.playerHp;
        if (Array.isArray(s.shells)) b.shells = s.shells.slice();
        if (s.eItems) b.playerItems = s.eItems.map(i => ({ ...i }));
        if (s.pItems) b.enemyItems = s.pItems.map(i => ({ ...i }));
        b.playerHandcuffed = !!s.enemyHandcuffed; b.enemyHandcuffed = !!s.playerHandcuffed;
        b.playerShocked = !!s.enemyShocked; b.enemyShocked = !!s.playerShocked;
        b.playerPacemaker = !!s.enemyPacemaker; b.enemyPacemaker = !!s.playerPacemaker;
        b.gunDamage = s.gunDamage || 1;
        b.knownNextShell = s.knownNextShell ?? null;
        if (s.nextTurn) b.nextRoundTurn = this._mirrorRole(s.nextTurn);
        if (typeof s.wins === 'number' && typeof s.losses === 'number') { b.wins = s.losses; b.losses = s.wins; }
        this._rebuildSlots();
        if (this._tableSig() !== before) this.scene.renderTableItems(b.playerItems, b.enemyItems);
        if (b.playerPacemaker !== prevP) { if (b.playerPacemaker) this.scene.showPacemaker('host'); else this.scene.removePacemaker('host'); }
        if (b.enemyPacemaker !== prevE) { if (b.enemyPacemaker) this.scene.showPacemaker('client'); else this.scene.removePacemaker('client'); }
        this.updateScoreDisplay();
    }

    _clientApplySnapshot(s) {
        if (!s) return;
        const before = this._fullSig();
        this._applyMirroredState(s);
        if (s.turn && s.turn !== 'animating') this.battle.turn = this._mirrorRole(s.turn);
        if (this._fullSig() !== before) this.updateUI();
    }

    applyForceSync(stateData) { this._clientApplySnapshot(stateData); }

    // 看门狗：任何原因导致回合卡住时自动恢复
    _netWatchdog() {
        if (!this.isRemote || this.battle.gameOver) return;
        const now = Date.now();
        if (this._evBusy && now - this._evBusySince > 30000) {
            console.warn('[net] 动作/回合超时，强制恢复');
            this._evBusy = false; this._animatingRound = false;
            if (this.role === 'host') {
                if (this.battle.turn === 'animating') this.battle.turn = this.battle.nextRoundTurn || 'host';
                this.updateUI(); this.broadcastStateSync();
            } else {
                this.sendNetMessage({ type: 'FORCE_SYNC', req: true });
                this._pumpEvents();
            }
        }
        if (this._pendingReq && now - this._pendingSince > 6000) {
            this._pendingReq = false; this.updateUI();
            this.sendNetMessage({ type: 'FORCE_SYNC', req: true });
        }
        const stuck = this.battle.turn === 'animating' && !this._evBusy && !this._animatingRound && this._evQueue.length === 0;
        if (stuck) {
            if (!this._animSince) this._animSince = now;
            else if (now - this._animSince > 9000) {
                this._animSince = now;
                if (this.role === 'host') {
                    const t = this.battle.nextRoundTurn;
                    this.battle.turn = (t && t !== 'animating') ? t : 'host';
                    this.updateUI(); this.broadcastStateSync();
                } else this.sendNetMessage({ type: 'FORCE_SYNC', req: true });
            }
        } else this._animSince = 0;
        if (this.role === 'host') {
            if (!this._evBusy && this.battle.turn !== 'animating' && now - this._lastBeat > 4000) { this._lastBeat = now; this.broadcastStateSync(); }
        } else if (!this._evBusy && this._evQueue.length) this._pumpEvents();
    }

    updateOpponentNameDisplay() { if (this.ui.opponentNameDisplay) this.ui.opponentNameDisplay.innerText = this.opponentName; }
    setOpponentName(name) { this.opponentName = name || (this.mode === 'sp' ? '恶魔' : '对方'); this.updateOpponentNameDisplay(); this.updateScoreDisplay(); }
    applySettings(settings) { if (settings) this.settings = { ...this.settings, ...settings }; }

    initEvents() {
        bindTap('btn-shoot-enemy', () => this.handleActionClick('shoot', 'enemy'));
        bindTap('btn-shoot-self', () => this.handleActionClick('shoot', 'self'));
        const toggleBtn = document.getElementById('btn-quick-toggle');
        const menu = document.getElementById('quick-msg-menu');
        toggleBtn.onclick = () => { audioMgr.play('uiClick'); menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex'; };
        document.querySelectorAll('.taunt-btn').forEach(btn => { btn.onclick = () => { audioMgr.play('uiClick'); this.triggerLocalChat(QUICK_CHATS[btn.dataset.id], btn.dataset.id); menu.style.display = 'none'; }; });
        this.ui.chatInput.onkeydown = (e) => { if (e.key === 'Enter' && this.ui.chatInput.value.trim() !== '') { const val = this.ui.chatInput.value.trim(); this.triggerLocalChat(val, null); this.ui.chatInput.value = ''; } };
        bindTap('btn-restart', () => {
            audioMgr.play('uiClick'); document.getElementById('end-screen').style.display = 'none';
            this.battle.resetMatch();
            this.aiTauntCooldown = 0; this.lastContext = null;
            this._animatingRound = false;
            this._eventsBound = false;
            this.updateScoreDisplay();
            this.scene.clearDiscardedItems(); this.scene.renderTableItems([], []); this.scene.resetGun();
            if (this.mode === 'sp') this.scene.setDemonHandVisible(true);
            this.startNewRound();
        });
        bindTap('btn-desktop', () => { audioMgr.play('uiClick'); location.reload(); });
        document.querySelectorAll('.btn, .action-btn, .taunt-btn, .toggle-slider, #brightness-slider').forEach(btn => { btn.addEventListener('mouseenter', () => audioMgr.play('uiHover')); });
    }

    appendChatLog(text, styleClass = 'log-sys') { const entry = document.createElement('div'); entry.className = `log-entry ${styleClass}`; entry.innerText = text; this.ui.chatLog.appendChild(entry); this.ui.chatLog.scrollTop = this.ui.chatLog.scrollHeight; }
    spawnBubblePopup(side, text) { const bubble = (side === 'player') ? this.ui.playerBubble : this.ui.enemyBubble; bubble.innerText = text; bubble.classList.add('bubble-active'); if (bubble.timeoutRef) clearTimeout(bubble.timeoutRef); bubble.timeoutRef = setTimeout(() => { bubble.classList.remove('bubble-active'); }, 3000); const logClass = (side === 'player') ? 'log-taunt-player' : 'log-taunt-enemy'; const speaker = (side === 'player') ? `${this.playerName}: ` : `${this.opponentName}: `; this.appendChatLog(speaker + text, logClass); }
    triggerLocalChat(text, quickId) { this.spawnBubblePopup('player', text); if (quickId) audioMgr.play(quickId); if (this.isRemote) this.sendNetMessage({ type: 'CHAT_MSG', text: text, qId: quickId, senderRole: this.role }); }
    handleReceivedChat(text, quickId, senderRole) { let side = (senderRole === this.role) ? 'player' : 'enemy'; this.spawnBubblePopup(side, text); if (quickId) audioMgr.play(quickId); }
    spawnItemToasts(list) { let delay = 0; list.forEach(name => { setTimeout(() => { const toast = document.createElement('div'); toast.className = 'item-toast'; toast.innerText = `+ ${name}`; document.getElementById('item-toast-container').appendChild(toast); setTimeout(() => toast.remove(), 1500); }, delay); delay += 350; }); }
    showMessage(text, dur = 2000, logImportant = false) { if (this.isRemote) text = text.replace(/恶魔/g, this.opponentName); this.ui.msg.innerText = text; this.ui.msg.classList.add('msg-active'); this.appendChatLog(text, logImportant ? 'log-important' : 'log-sys'); if (dur > 0) setTimeout(() => { if (this.ui.msg.innerText === text) this.ui.msg.classList.remove('msg-active'); }, dur); }
    updateTurnIndicator() { if (this.battle.turn === 'animating') this.ui.turnIndicator.innerText = '...'; else if (this._isMyTurn()) this.ui.turnIndicator.innerText = '你的回合'; else this.ui.turnIndicator.innerText = `${this.opponentName}回合`; }
    startTimer() { clearInterval(this.timerInterval); if (this.battle.turn === 'animating') { this.ui.timer.innerText = '--'; return; } this.timeLeft = 15; this.ui.timer.innerText = this.timeLeft; this.timerInterval = setInterval(() => { this.timeLeft--; this.ui.timer.innerText = this.timeLeft; let isMyTurn = this._isMyTurn(); if (this.timeLeft <= 0) { clearInterval(this.timerInterval); const action = this.battle.getTimeoutAction(this.mode, 'host'); if (action?.type === 'ai') this.aiLogic(); else if (action?.type === 'shoot') this.handleActionClick('shoot', 'enemy'); } }, 1000); }
    updateUI() {
        if (!this._eventsBound) { this.initEvents(); this._eventsBound = true; }
        if (typeof FX !== 'undefined') FX.setLowHp(this.battle.playerHp <= 1 && this.battle.playerHp > 0 && !this.battle.gameOver);
        this.ui.pHp.innerText = this.battle.playerHp; this.ui.eHp.innerText = this.battle.enemyHp;
        this.ui.bulletCounter.innerHTML = ''; for (let i = 0; i < this.battle.shells.length; i++) { const rect = document.createElement('div'); rect.className = 'bullet-rect'; this.ui.bulletCounter.appendChild(rect); }
        if (this.isRemote) { this.scene.setDemonHandVisible(false); this.scene.setDemonHandReaching(false); } else { this.scene.setDemonHandVisible(true); this.scene.setDemonHandReaching(this.battle.turn === 'client'); this.scene.setDemonHp(this.battle.enemyHp); }
        let isMyTurn = this._isMyTurn();
        // 电击禁用道具（BattleSystem 里 player=host, enemy=client）
        const isShocked = this.battle.playerShocked;
        const canUseItems = isMyTurn && !isShocked && !this._pendingReq;
        document.getElementById('gun-actions').style.display = (isMyTurn && !this._pendingReq) ? 'flex' : 'none';
        this.scene.setItemInteractionEnabled(canUseItems);
        if (isMyTurn && isShocked) this.ui.turnIndicator.innerText = '⛔ 被电击';
        else this.updateTurnIndicator();
        this.startTimer();
    }

    startNewRound() {
        if (this.battle.gameOver || this._animatingRound || (this.isRemote && this.role !== 'host')) return;
        this._markBusy();
        if (!this.scene.gunGroup) { console.warn('gunGroup 未就绪，100ms 后重试'); setTimeout(() => this.startNewRound(), 100); return; }
        if (this._roundSafetyTimer) clearTimeout(this._roundSafetyTimer);
        // 安全计时器：动画超时自动重置
        const safetyDelay = 8000;
        this._roundSafetyTimer = setTimeout(() => {
            if (this._animatingRound && this.battle.turn === 'animating') {
                console.warn('回合动画超时，强制重置');
                this._animatingRound = false;
                this.battle.startRoundAfterAnimation();
                this.scene.clearDiscardedItems();
                this.scene.resetGun();
                this.scene.renderTableItems(this.battle.playerItems, this.battle.enemyItems);
                this.localSyncRound('连接重置...');
            }
        }, safetyDelay);
        if (this.isRemote && !this._bgmStarted) { audioMgr.fadeInBGM(2000); this._bgmStarted = true; }
        this._animatingRound = true; this.scene.clearDiscardedItems(); this.scene.resetGun();
        this.battle.prepareNewRound();
        const b = this.settings?.bullets || { minLive: 1, maxLive: 4, minBlank: 1, maxBlank: 4 };
        const { live, blank } = this.battle.randomShells(b.minLive, b.maxLive, b.minBlank, b.maxBlank);
        const { newPlayerItems, newEnemyItems } = this.battle.distributeItems(this.settings);
        this.spawnItemToasts(newPlayerItems.map(i => i.name));
        this.battle.turn = 'animating'; this.updateUI(); this.scene.aimAt('center');
        if (this.mode === 'sp') { this.scene.setDemonHandVisible(true); this.scene.setDemonHandReaching(false); }
        if (this.isRemote) { this.sendNetMessage({ type: 'SYNC_ROUND', shells: this.battle.shells, pItems: this.battle.playerItems, eItems: this.battle.enemyItems, nextTurn: this.battle.nextRoundTurn, state: this.buildState(), newPItems: newPlayerItems, newEItems: newEnemyItems, playerHp: this.battle.playerHp, enemyHp: this.battle.enemyHp }); }
        this.scene.playCrateDropAnimation(newPlayerItems, newEnemyItems, this.battle.playerItems, this.battle.enemyItems, () => {
            try {
                this._animatingRound = false;
                if (this._roundSafetyTimer) clearTimeout(this._roundSafetyTimer);
                this.localSyncRound(`实弹: ${live} 颗, 空包: ${blank} 颗`);
            } catch(e) { console.error('startNewRound callback error:', e); }
        });
    }

    localSyncRound(msgText) { this.showMessage(msgText, 3000, true); setTimeout(() => { this.battle.startRoundAfterAnimation(); this.updateUI(); this._endAct(); if (this.isRemote && this.role === 'host') this.broadcastStateSync(); if (this.mode === 'sp' && this.battle.turn === 'client') { this.aiPending = false; setTimeout(() => this.aiLogic(), 600); } }, 3000); }

    handleItemModelClick(itemData) {
        if (this.battle.turn === 'animating') return;
        let isMyTurn = this._isMyTurn();
        if (!isMyTurn) return;
        if (itemData.side !== 'player') return;
        let idx = this.battle.playerItems.findIndex(item => item.slotIndex === itemData.slotIndex);
        if (idx === -1) return;
        this.handleActionClick('useItem', idx);
    }

    handleActionClick(type, detail) {
        if (this.battle.turn === 'animating') return;
        if (this.isRemote && (this._evBusy || this._pendingReq)) return;   // 上一个动作还没结算完
        if (type === 'useItem') {
            const item = this.battle.playerItems[detail];
            if (item && item.id === 'morphine') {
                const targetList = this.battle.enemyItems;
                if (targetList.length === 0) { this.showMessage(`${this.opponentName}没有道具可窃取`, 2000); return; }
                this.showStealMenu(targetList, (stealIndex) => this._dispatchAction('useItem', { index: detail, stealIndex: stealIndex }));
                return;
            }
        }
        this._dispatchAction(type, detail);
    }

    // 单机：直接执行。联机房主：先广播再执行。联机客户端：只发请求，等房主排序后广播回来重放。
    _dispatchAction(type, detail) {
        if (!this.isRemote) { this.executeAction(type, detail, this.role); return; }
        if (this.role === 'host') {
            this._markBusy();
            this.sendNetMessage({ type: 'PLAYER_ACTION', actionType: type, detail: detail, actor: 'host', relay: true });
            this.executeAction(type, detail, 'host');
        } else {
            this._pendingReq = true; this._pendingSince = Date.now();
            clearInterval(this.timerInterval);
            const ga = document.getElementById('gun-actions'); if (ga) ga.style.display = 'none';
            this.scene.setItemInteractionEnabled(false);
            this.sendNetMessage({ type: 'PLAYER_ACTION', actionType: type, detail: detail, actor: 'client' });
        }
    }

    executeAction(type, detail, actor, line = null) {
        clearInterval(this.timerInterval);
        this._markBusy(); this._pendingReq = false;
        const isSelf = actor === this.role;
        const vActor = isSelf ? 'host' : 'client';   // 战斗系统视角：'host' = 本机玩家
        if (type === 'useItem') {
            let itemIndex, stealIndex;
            if (typeof detail === 'object') { itemIndex = detail.index; stealIndex = detail.stealIndex; }
            else itemIndex = detail;
            let itemList = isSelf ? this.battle.playerItems : this.battle.enemyItems;
            if (itemIndex >= itemList.length || itemIndex < 0) { console.warn('executeAction: 道具索引无效'); this.finalizeAction(); return; }
            let item = itemList[itemIndex];
            if (!item) { this.finalizeAction(); return; }
            const side = isSelf ? 'player' : 'enemy';
            const result = this.battle.useItem(item.id, { actor: vActor, stealIndex, itemIndex });
            if (!result.success) {
                this.showMessage(result.message, 2000);
                setTimeout(() => this.finalizeAction(), 500);
                return;
            }
            // 使用成功后移除模型
            const model = this.scene.findModelBySlot(side, item.slotIndex);
            if (model) { this.scene.removeItemModel(model); }
            let name = isSelf ? this.playerName : this.opponentName;
            this.showMessage(`${name}使用了 [${item.name}]`);
            let userPos, targetPos;
            if (isSelf) { userPos = new THREE.Vector3(0.5, 0.8, 2.5); targetPos = new THREE.Vector3(0, 4.5, -7.0); }
            else { userPos = new THREE.Vector3(0, 4.5, -7.0); targetPos = new THREE.Vector3(0.5, 0.8, 2.5); }
            if (!isSelf && line && Math.random() < 0.15) { this.spawnBubblePopup('enemy', line); }

            this.scene._fpSelf = isSelf;
            switch (item.id) {
                case 'check_shell':
                    this.scene.checkShellEffect();
                    if (isSelf) { const nextShell = this.battle.shells[0]; setTimeout(() => this.showMessage(`下一发: ${nextShell === 1 ? '【实弹】' : '【空包】'}`, 2500, true), 500); }
                    if (isSelf) { this.scene._fpSelf = false; this.scene.playMagnifierFirstPerson(() => setTimeout(() => this.finalizeAction(), 300)); } else setTimeout(() => this.finalizeAction(), 1500);
                    break;
                case 'beer':
                    audioMgr.play('beer');
                    this.scene.playBeerAnimation(userPos, () => { this.showMessage(result.message, 2000, true); setTimeout(() => { if (!this.checkEmpty()) this.finalizeAction(); }, 1000); });
                    break;
                case 'cigarette':
                    audioMgr.play('cigarette');
                    this.scene.playCigaretteAnimation(userPos, () => { setTimeout(() => this.finalizeAction(), 500); }, isSelf);
                    break;
                case 'handcuffs':
                    audioMgr.play('handcuffs');
                    this.scene.playHandcuffsAnimation(userPos, targetPos, () => { setTimeout(() => this.finalizeAction(), 500); });
                    break;
                case 'saw':
                    if (isSelf) audioMgr.play('saw'); this.scene.playSawAnimation(userPos, () => { if (!isSelf) audioMgr.play('saw'); this.showMessage(`手锯锯短枪管 伤害提高`, 2000, true); setTimeout(() => this.finalizeAction(), 500); });
                    break;
                case 'morphine':
                    audioMgr.play('morphine');
                    if (result.effect && result.effect.stolen) {
                        const victimSide = isSelf ? 'enemy' : 'player';
                        const victimName = isSelf ? this.opponentName : this.playerName;
                        this.showMessage(`麻药生效，${victimName}失去了 [${result.effect.stolen.name}]`, 2000, true);
                        const stolenModel = this.scene.findModelBySideAndId(victimSide, result.effect.stolen.id);
                        if (stolenModel) this.scene.removeItemModel(stolenModel);
                    }
                    this.scene.playMorphineAnimation(userPos, targetPos, () => {
                        if (!isSelf) this.triggerShake();
                        this.showMessage(`麻药生效，道具已转移`, 2000, true);
                        this.scene.renderTableItems(this.battle.playerItems, this.battle.enemyItems);
                        setTimeout(() => this.finalizeAction(), 500);
                    });
                    break;
                case 'taser':
                    this.scene.playTaserAnimation(userPos, targetPos, () => {
                        if (!isSelf) audioMgr.play('taser');
                        this.taserEffect(!isSelf);
                        this.showMessage(`${isSelf ? this.opponentName : '你'}被电击，下回合无法使用道具`, 2000, true);
                        setTimeout(() => this.finalizeAction(), 1800);
                    });
                    break;
                case 'defibrillator':
                    this.scene.showPacemaker(vActor);
                    this.showMessage(`获得心脏起搏器，可免死一次`, 2000, true);
                    setTimeout(() => this.finalizeAction(), 800);
                    break;
                default:
                    setTimeout(() => this.finalizeAction(), 500);
            }
        } else if (type === 'shoot') {
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
            this.scene.playShootSequence({ shooterIsMe: isSelf, selfShot: selfShot, live: !!result.live, damage: result.damage, victimIsMe: victimIsMe }, climax, afterShot);
        }
    }

    finalizeAction() {
        this._endAct();
        this.scene.aimAt('center');
        this.updateUI();
        if (this.mode === 'sp' && this.battle.turn === 'client' && !this.aiPending) {
            this.aiPending = true;
            setTimeout(() => { this.aiPending = false; this.aiLogic(); }, 800);
        }
        // MP: host broadcasts state sync after each action
        if (this.isRemote && this.role === 'host') {
            this.broadcastStateSync();
        }
    }
    checkEmpty() {
        if (this.battle.isMagEmpty()) {
            this._endAct();
            this.battle.turn = 'animating';
            this.updateUI();
            this.showMessage("装填芯片就绪...", 0, true);
            clearInterval(this.timerInterval);
            this.scene.reloadAnimation();
            this.scene.clearDiscardedItems();
            this.scene.resetGun();
            if (this.isRemote && this.role !== 'host') {
                // Client waits for host SYNC_ROUND
                return true;
            }
            setTimeout(() => this.startNewRound(), 2500);
            return true;
        }
        return false;
    }
    checkWin() {
        const settled = this.battle.checkWin();
        if (!settled) return false;
        this._endAct();
        clearInterval(this.timerInterval); this.updateScoreDisplay();
        if (settled.matchOver) {
            const win = this.battle.wins >= 2;
            this.showMessage(win ? "协议胜出。" : "连接解体。", 0, true);
            this.battle.turn = 'animating'; this._animatingRound = false; this.updateUI();
            if (this.mode === 'sp') this.scene.setDemonHandReaching(false);
            this.scene.clearDiscardedItems(); this.scene.resetGun();
            setTimeout(() => { document.getElementById('end-screen').style.display = 'flex'; document.getElementById('end-title').innerText = win ? "协议达成：生命延续" : "契约终止：物理抹除"; document.getElementById('score-final').innerText = `最终比分: ${this.playerName} ${this.battle.wins} - ${this.battle.losses} ${this.opponentName}`; }, 2000);
            return true;
        }
        this.showMessage('下回合开始', 2500, true);
        this.battle.turn = 'animating';
        this._animatingRound = false;
        if (this.mode === 'sp') this.scene.setDemonHandReaching(false);
        this.scene.clearDiscardedItems(); this.scene.resetGun();
        this.battle.resetForNextRound();
        this.scene.renderTableItems([], []);
        this.updateUI();
        setTimeout(() => { this.startNewRound(); }, 3000);
        return true;
    }
    updateScoreDisplay() { this.ui.score.innerText = `${this.battle.wins} - ${this.battle.losses}`; }
    triggerShake() { if (this.scene.shakeCamera) this.scene.shakeCamera(0.8, 900, 1.2); this.ui.overlay.style.opacity = 1; this.ui.blood.style.opacity = 1; document.body.style.transform = "translate(12px,12px)"; setTimeout(() => { document.body.style.transform = "translate(-12px,-12px)"; setTimeout(() => { document.body.style.transform = "none"; this.ui.overlay.style.opacity = 0; setTimeout(() => this.ui.blood.style.opacity = 0, 400); }, 50); }, 50); }

    taserEffect(victimIsMe = true) {
        if (typeof FX !== 'undefined') FX.taser(this.scene, victimIsMe);
    }

    // 起搏器救场：victimIsMe=true 为第一视角濒死体验，否则为旁观视角；总时长固定 8s，保证双方节奏一致
    pacemakerRevive(victimIsMe, callback) {
        if (typeof FX === 'undefined') { setTimeout(() => { if (callback) callback(); }, 3000); return; }
        FX.pacemaker(this.scene, victimIsMe, (t) => this.showMessage(t, 2500, true), callback);
    }

    aiLogic() {
        if (this.aiPending || !this.battle.shouldAIAct()) return;
        this.aiPending = true;
        if (this.mode === 'sp') { 
            this.aiTauntCooldown = Math.max(0, this.aiTauntCooldown - 1); 
            if (Math.random() < 0.05 && this.aiTauntCooldown <= 0) { 
                const line = this.battle.pickDemonLine({ 
                    playerHp: this.battle.playerHp, 
                    enemyHp: this.battle.enemyHp, 
                    shells: this.battle.shells, 
                    lastContext: this.lastContext 
                }); 
                if (line) this.spawnBubblePopup('enemy', line); 
                this.aiTauntCooldown = 5; 
                this.lastContext = null; 
            } 
        }
        const action = this.battle.decideAIAction();
        this.aiPending = false; 
        if (!action) return;
        if (action.type === 'useItem') { 
            if (typeof action.detail === 'object' && action.detail.stealIndex !== undefined) { 
                this.executeAction('useItem', { index: action.detail.index, stealIndex: action.detail.stealIndex }, 'client', action.line); 
            } else { 
                this.executeAction('useItem', action.detail, 'client', action.line); 
            } 
        } else if (action.type === 'shoot') { 
            this.executeAction('shoot', action.target, 'client', action.line); 
        }
    }

    showStealMenu(targetList, callback) { const stealUI = document.getElementById('steal-ui'), stealItems = document.getElementById('steal-items'); stealItems.innerHTML = ''; stealUI.style.display = 'flex'; targetList.forEach((item, idx) => { const btn = document.createElement('button'); btn.className = 'item-btn'; btn.style.padding = '10px 15px'; btn.style.fontSize = '1rem'; btn.innerText = item.name; btn.onmouseenter = () => audioMgr.play('uiHover'); btn.onclick = () => { audioMgr.play('uiClick'); stealUI.style.display = 'none'; callback(idx); }; stealItems.appendChild(btn); }); document.getElementById('btn-cancel-steal').onclick = () => { audioMgr.play('uiClick'); stealUI.style.display = 'none'; }; }
    sendNetMessage(obj) { if (this.socket && this.socket.readyState === WebSocket.OPEN) { this.socket.send(JSON.stringify(obj)); } }
    applyRoundSync(data) {
        this.battle.shells = data.shells || [];
        this.battle.playerItems = (data.eItems || []).map(i => ({...i}));
        this.battle.enemyItems = (data.pItems || []).map(i => ({...i}));
        this.battle.nextRoundTurn = this._mirrorRole(data.nextTurn || 'host');
        this.battle.playerHp = data.enemyHp ?? this.battle.maxHp;
        this.battle.enemyHp = data.playerHp ?? this.battle.maxHp;
        this._rebuildSlots();
        this.scene.renderTableItems(this.battle.playerItems, this.battle.enemyItems);
        this.updateUI();
    }

    applyRoundWithAnimation(data) {
        // 如果正在动画中，强制重置以接受新的回合同步
        if (this._animatingRound) {
            this._animatingRound = false;
            if (this._roundSafetyTimer) { clearTimeout(this._roundSafetyTimer); this._roundSafetyTimer = null; }
        }
        this.scene.clearDiscardedItems();
        this.scene.resetGun();
        this.battle.prepareNewRound();

        // 安全计时器（客户端侧）
        if (this._roundSafetyTimer) clearTimeout(this._roundSafetyTimer);
        this._roundSafetyTimer = setTimeout(() => {
            if (this._animatingRound && this.battle.turn === 'animating') {
                console.warn('客户端回合动画超时，强制重置');
                this._endAct();
                this._animatingRound = false;
                this.battle.startRoundAfterAnimation();
                this.scene.renderTableItems(this.battle.playerItems, this.battle.enemyItems);
                this.updateUI();
            }
        }, 12000);

        // 视角转换：host的pItems → 客户端的enemyItems，反之亦然
        this.battle.shells = data.shells || [];
        this.battle.playerItems = (data.eItems || []).map(i => ({...i}));
        this.battle.enemyItems = (data.pItems || []).map(i => ({...i}));
        this.battle.nextRoundTurn = this._mirrorRole(data.nextTurn || 'host');
        this.battle.playerHp = data.enemyHp ?? this.battle.maxHp;
        this.battle.enemyHp = data.playerHp ?? this.battle.maxHp;
        this.battle.playerPacemaker = !!(data.state && data.state.enemyPacemaker);
        this.battle.enemyPacemaker = !!(data.state && data.state.playerPacemaker);
        this.battle.gunDamage = 1;
        this._rebuildSlots();

        const newPlayerItems = (data.newEItems || []).map(i => ({...i}));
        const newEnemyItems = (data.newPItems || []).map(i => ({...i}));
        this.spawnItemToasts(newPlayerItems.map(i => i.name));

        const live = this.battle.countLive();
        const blank = this.battle.countBlank();
        this.battle.turn = 'animating'; this.updateUI();
        this.scene.aimAt('center');
        if (this.mode === 'sp') { this.scene.setDemonHandVisible(true); this.scene.setDemonHandReaching(false); }

        this._animatingRound = true;
        this.scene.playCrateDropAnimation(
            newPlayerItems, newEnemyItems,
            this.battle.playerItems, this.battle.enemyItems,
            () => {
                try {
                    this._animatingRound = false;
                    this.localSyncRound(`实弹: ${live} 颗, 空包: ${blank} 颗`);
                } catch(e) { console.error('applyRoundWithAnimation callback error:', e); }
            }
        );
    }

    _rebuildSlots() {
        this.battle.playerSlots = Array(8).fill(false);
        this.battle.enemySlots = Array(8).fill(false);
        this.battle.playerItems.forEach(item => { if (item.slotIndex !== undefined) this.battle.playerSlots[item.slotIndex] = true; });
        this.battle.enemyItems.forEach(item => { if (item.slotIndex !== undefined) this.battle.enemySlots[item.slotIndex] = true; });
    }

}

// ---------- 启动 ----------
document.addEventListener('DOMContentLoaded', () => {
    // ===== 先拿 DOM 引用（绝不抛异常） =====
    const bgmToggle = document.getElementById('bgm-toggle');
    const brightnessSlider = document.getElementById('brightness-slider');
    const settingsPanel = document.getElementById('settings-panel');
    const btnSettingsToggle = document.getElementById('btn-settings-toggle');
    const mainMenu = document.getElementById('main-menu');
    const multiplayerMenu = document.getElementById('multiplayer-menu');
    const createRoomPanel = document.getElementById('create-room-panel');
    const joinRoomPanel = document.getElementById('join-room-panel');
    const joinRoomInput = document.getElementById('join-room-input');

    // ===== 先绑所有按钮（不依赖 3D 场景） =====
    btnSettingsToggle.addEventListener('click', () => {
        audioMgr.play('uiClick');
        let popup = document.getElementById('setting-popup');
        if (popup) { popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex'; return; }
        popup = document.createElement('div');
        popup.id = 'setting-popup';
        popup.style.cssText = 'position:absolute; top:0; left:0; right:0; bottom:0; margin:auto; width:260px; height:fit-content; z-index:9999; background:rgba(10,5,5,0.97); border:2px solid #442222; padding:24px; border-radius:8px; display:flex; flex-direction:column; gap:16px; pointer-events:auto;';
        popup.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; color:#bbb; font-weight:bold;"><span>BGM</span><label class="toggle-switch"><input type="checkbox" id="bgm-popup-toggle" ${GlobalSettings.bgmEnabled ? 'checked' : ''}><span class="toggle-slider"></span></label></div><div style="display:flex; align-items:center; justify-content:space-between; gap:10px; color:#bbb; font-weight:bold;"><span>亮度</span><input type="range" id="brightness-popup-slider" min="0.15" max="3.5" step="0.05" value="${GlobalSettings.brightness}" style="width:140px;"><span id="brightness-popup-val" style="color:#ff6666;">${GlobalSettings.brightness.toFixed(2)}</span></div><button id="setting-popup-close" class="btn btn-small" style="width:100%; margin:0; padding:8px; font-size:0.9rem;">关闭</button>`;
        document.getElementById('ui-layer').appendChild(popup);
        document.getElementById('bgm-popup-toggle').addEventListener('change', (e) => { GlobalSettings.setBGM(e.target.checked); });
        document.getElementById('brightness-popup-slider').addEventListener('input', (e) => { const val = parseFloat(e.target.value); GlobalSettings.setBrightness(val); document.getElementById('brightness-popup-val').innerText = val.toFixed(2); });
        document.getElementById('setting-popup-close').addEventListener('click', () => { popup.style.display = 'none'; });
    });

    bgmToggle.addEventListener('change', () => { audioMgr.play('uiClick'); GlobalSettings.setBGM(bgmToggle.checked); });
    brightnessSlider.addEventListener('input', () => { GlobalSettings.setBrightness(brightnessSlider.value); });
    bgmToggle.parentElement.addEventListener('mouseenter', () => audioMgr.play('uiHover'));
    brightnessSlider.addEventListener('mouseenter', () => audioMgr.play('uiHover'));
    GlobalSettings.setBrightness(brightnessSlider.value); GlobalSettings.setBGM(bgmToggle.checked);

    bindTap('btn-multiplayer', () => { audioMgr.play('uiClick'); mainMenu.classList.add('hidden'); multiplayerMenu.classList.remove('hidden'); if (net) net.connect(); });
    bindTap('btn-back-main', () => { audioMgr.play('uiClick'); multiplayerMenu.classList.add('hidden'); mainMenu.classList.remove('hidden'); });
    bindTap('btn-create-room', () => { audioMgr.play('uiClick'); multiplayerMenu.classList.add('hidden'); createRoomPanel.classList.remove('hidden'); });
    bindTap('btn-create-back', () => { audioMgr.play('uiClick'); createRoomPanel.classList.add('hidden'); multiplayerMenu.classList.remove('hidden'); });
    bindTap('btn-join-room-menu', () => { audioMgr.play('uiClick'); multiplayerMenu.classList.add('hidden'); joinRoomPanel.classList.remove('hidden'); });
    bindTap('btn-join-back', () => { audioMgr.play('uiClick'); joinRoomPanel.classList.add('hidden'); multiplayerMenu.classList.remove('hidden'); });
    bindTap('btn-cancel-match', () => { audioMgr.play('uiClick'); if (net) net.disconnect(); if (peerNet) peerNet.disconnect(); document.getElementById('menu-screen').style.display = 'flex'; document.getElementById('matching-screen').style.display = 'none'; multiplayerMenu.classList.add('hidden'); document.getElementById('peer-menu').classList.add('hidden'); mainMenu.classList.remove('hidden'); });

    // ===== 再尝试初始化 3D 场景（可能因 CDN/WebGL 失败） =====
    let sceneManager = null;
    try {
        sceneManager = new SceneManager();
        window._sceneManager = sceneManager;
    } catch (e) {
        console.error('3D场景初始化失败:', e);
    }
    const net = new NetworkManager(sceneManager);

    // ===== P2P (PeerJS) 联机：独立于上面的 WebSocket 局域网联机 =====
    const peerNet = (typeof PeerNetworkManager !== 'undefined') ? new PeerNetworkManager(sceneManager) : null;
    const peerMenu = document.getElementById('peer-menu');
    bindTap('btn-peer', () => {
        audioMgr.play('uiClick');
        if (!peerNet) { alert('PeerJS 联机模块加载失败'); return; }
        mainMenu.classList.add('hidden');
        peerMenu.classList.remove('hidden');
        document.getElementById('peer-status').innerText = '';
    });
    bindTap('btn-peer-back', () => { audioMgr.play('uiClick'); peerMenu.classList.add('hidden'); mainMenu.classList.remove('hidden'); });
    bindTap('btn-peer-create', () => {
        audioMgr.play('uiClick');
        if (!peerNet) return;
        peerNet.createRoom();
    });
    bindTap('btn-peer-join', () => {
        audioMgr.play('uiClick');
        if (!peerNet) return;
        const code = document.getElementById('peer-join-input').value.trim();
        if (!code) { alert('请输入房间号'); return; }
        peerNet.joinRoom(code);
    });

    // ===== 最后绑依赖 sceneManager / net 的按钮 =====
    bindTap('btn-sp', () => {
        if (!sceneManager) { alert('3D场景加载失败，请刷新或检查网络'); return; }
        audioMgr.play('uiClick');
        document.getElementById('menu-screen').style.display = 'none';
        new OpeningManager(sceneManager, () => {
            document.getElementById('hud').style.display = 'block';
            new GameEngine(sceneManager, 'sp', { playerName: '你' });
        });
    });

    bindTap('btn-lan', () => {
        audioMgr.play('uiClick');
        if (!net) { alert('网络管理器初始化失败'); return; }
        const addrInput = document.getElementById('server-addr-input');
        const addr = (addrInput && addrInput.value.trim()) ? addrInput.value.trim() : null;
        document.getElementById('match-status').innerText = addr ? '正在连接 ' + addr + '...' : '正在连接本机服务器...';
        net.connect(addr);
    });

    bindTap('btn-create-confirm', () => {
        audioMgr.play('uiClick');
        const roomName = document.getElementById('room-name-input')?.value.trim() || '房间';
        const isPublic = document.getElementById('room-public-check')?.checked ?? true;
        createRoomPanel.classList.add('hidden');
        if (!net) { alert('网络管理器初始化失败'); return; }
        net.connect();
        let attempts = 0;
        const checkOpen = setInterval(() => {
            if (net.ws && net.ws.readyState === WebSocket.OPEN) {
                clearInterval(checkOpen); net.createRoom(roomName, isPublic);
                document.getElementById('menu-screen').style.display = 'none';
            } else if (attempts++ > 50) {
                clearInterval(checkOpen);
                alert('连接服务器失败，请确认服务器已启动');
                createRoomPanel.classList.remove('hidden');
                mainMenu.classList.add('hidden');
                multiplayerMenu.classList.remove('hidden');
            }
        }, 100);
    });

    bindTap('btn-join-confirm', () => {
        const roomId = joinRoomInput.value.trim();
        if (!roomId) { alert('请输入房间号'); return; }
        audioMgr.play('uiClick');
        joinRoomPanel.classList.add('hidden');
        if (!net) { alert('网络管理器初始化失败'); return; }
        net.connect();
        let attempts = 0;
        const checkOpen = setInterval(() => {
            if (net.ws && net.ws.readyState === WebSocket.OPEN) {
                clearInterval(checkOpen); net.joinRoom(roomId);
                document.getElementById('menu-screen').style.display = 'none';
            } else if (attempts++ > 50) {
                clearInterval(checkOpen);
                alert('连接服务器失败，请确认服务器已启动');
                joinRoomPanel.classList.remove('hidden');
                mainMenu.classList.add('hidden');
                multiplayerMenu.classList.remove('hidden');
            }
        }, 100);
    });
});