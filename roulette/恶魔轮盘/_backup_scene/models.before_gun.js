// ============================================================
// models.js —— 独立建模库（全场景高精度重制版 + 扩展包）
// ============================================================

// ─────────────────────────────────────────────
// 材质工具
// ─────────────────────────────────────────────
function M_metalMat(color, metalness = 0.85, roughness = 0.25) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
function M_plasticMat(color, roughness = 0.6) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}
function M_woodMat(color = 0x5c3318, roughness = 0.85) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.0 });
}

// ─────────────────────────────────────────────
// 道具：香烟（平躺）
// ─────────────────────────────────────────────
function M_createCigaretteModel() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.52, 16),
        new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.85 }));
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.14, 16),
        new THREE.MeshStandardMaterial({ color: 0xd48c55, roughness: 0.75 }));
    filter.rotation.x = Math.PI / 2; filter.position.z = 0.33;
    g.add(filter);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xa86030, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.003, 6, 24), ringMat);
        ring.rotation.x = Math.PI / 2; ring.position.z = 0.27 + i * 0.026;
        g.add(ring);
    }
    const ash = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.07, 8),
        new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 0.97 }));
    ash.rotation.x = Math.PI / 2; ash.position.z = -0.29;
    g.add(ash);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: new THREE.Color(0xff3300), emissiveIntensity: 2.0, roughness: 0.4 }));
    ember.position.z = -0.266;
    g.add(ember);
    const fireLight = new THREE.PointLight(0xff4400, 1.6, 0.9);
    fireLight.position.z = -0.27;
    g.add(fireLight);
    // 平躺（零件已各自旋转，整体不再旋转）
    return g;
}

// ─────────────────────────────────────────────
// 道具：啤酒罐（立着）
// ─────────────────────────────────────────────
function M_createBeerModel() {
    const g = new THREE.Group();
    const canMat = new THREE.MeshStandardMaterial({ color: 0xd4d0c8, metalness: 0.88, roughness: 0.28 });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.30, 24), canMat));
    const bottomNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.082, 0.04, 24), canMat);
    bottomNeck.position.y = -0.17; g.add(bottomNeck);
    const topNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.082, 0.06, 24), canMat);
    topNeck.position.y = 0.18; g.add(topNeck);
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.012, 24),
        new THREE.MeshStandardMaterial({ color: 0xb8b4aa, metalness: 0.92, roughness: 0.22 }));
    topCap.position.y = 0.216; g.add(topCap);
    const stripe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0825, 0.0825, 0.10, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.6, side: THREE.FrontSide }));
    stripe1.position.y = 0.04; g.add(stripe1);
    const stripe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0825, 0.0825, 0.06, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xddaa00, roughness: 0.6, side: THREE.FrontSide }));
    stripe2.position.y = -0.05; g.add(stripe2);
    const tabMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 });
    const tabRing = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 20), tabMat);
    tabRing.position.set(0.02, 0.228, 0); tabRing.rotation.x = Math.PI / 2; g.add(tabRing);
    const tabArm = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.005, 0.032), tabMat);
    tabArm.position.set(-0.004, 0.228, 0); g.add(tabArm);
    return g;
}

// ─────────────────────────────────────────────
// 道具：手铐（平躺）
// ─────────────────────────────────────────────
function M_createHandcuffsModel() {
    const g = new THREE.Group();
    const chromeMat = M_metalMat(0xb0b0b8, 0.92, 0.18);
    const lockMat   = M_metalMat(0x888890, 0.85, 0.30);
    function makeCuff(offsetX) {
        const cg = new THREE.Group();
        cg.add(new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.018, 12, 40), chromeMat));
        const lockBox = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.028), lockMat);
        lockBox.position.set(0, -0.098, 0); cg.add(lockBox);
        const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 }));
        keyhole.rotation.x = Math.PI / 2; keyhole.position.set(0.015, -0.098, 0.015); cg.add(keyhole);
        const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.038, 0.024), chromeMat);
        hinge.position.set(-0.055, -0.06, 0); cg.add(hinge);
        cg.position.x = offsetX;
        return cg;
    }
    g.add(makeCuff(-0.155)); g.add(makeCuff(0.155));
    for (let i = 0; i < 5; i++) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.007, 8, 16), chromeMat);
        link.position.x = -0.07 + i * 0.035;
        link.rotation.y = (i % 2 === 0) ? 0 : Math.PI / 2;
        g.add(link);
    }
    // 平躺
    g.rotation.x = -Math.PI / 2;
    return g;
}

// ─────────────────────────────────────────────
// 道具：电锯
// ─────────────────────────────────────────────
function M_createSawModel() {
    const g = new THREE.Group();
    const bladeMat  = M_metalMat(0xd0d0d8, 0.92, 0.15);
    const guardMat  = M_plasticMat(0x222222, 0.55);
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.95 });
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.016, 48), bladeMat);
    blade.rotation.x = Math.PI / 2; g.add(blade);
    const toothMat = M_metalMat(0xe0e0e8, 0.95, 0.12);
    for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.032), toothMat);
        tooth.position.set(Math.cos(angle) * 0.263, Math.sin(angle) * 0.263, 0);
        tooth.rotation.z = angle; g.add(tooth);
    }
    const centerHole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), M_metalMat(0x555555));
    centerHole.rotation.x = Math.PI / 2; g.add(centerHole);
    const guardShape = new THREE.Shape();
    guardShape.absarc(0, 0, 0.28, -0.1, Math.PI + 0.1, false);
    const guard = new THREE.Mesh(new THREE.ShapeGeometry(guardShape), guardMat);
    guard.rotation.x = Math.PI / 2; guard.position.z = 0.014; g.add(guard);
    const motor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), M_plasticMat(0x1a1a1a, 0.5));
    motor.position.set(0.16, 0.0, 0.12); g.add(motor);
    for (let i = 0; i < 5; i++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.14, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x000000 }));
        slot.position.set(0.072 + i * 0.018, 0, 0.12); g.add(slot);
    }
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.38, 12), rubberMat);
    handle.rotation.z = Math.PI / 2; handle.position.set(0.38, 0.0, 0.05); g.add(handle);
    const frontHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 12), rubberMat);
    frontHandle.rotation.z = Math.PI / 2; frontHandle.position.set(-0.22, 0.06, 0.1); g.add(frontHandle);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.28, 8),
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.95 }));
    cord.rotation.z = Math.PI / 3; cord.position.set(0.52, -0.12, 0.05); g.add(cord);
    return g;
}

// ─────────────────────────────────────────────
// 道具：吗啡注射器（平躺 + 缩小）
// ─────────────────────────────────────────────
function M_createMorphineModel() {
    const g = new THREE.Group();
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xddeeff, metalness: 0.0, roughness: 0.05,
        transmission: 0.72, transparent: true, opacity: 0.55, ior: 1.45
    });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.42, 20), glassMat));
    const scaleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    for (let i = 0; i < 7; i++) {
        const tick = new THREE.Mesh(new THREE.TorusGeometry(0.041, 0.0025, 4, 20), scaleMat);
        tick.rotation.x = Math.PI / 2; tick.position.y = -0.17 + i * 0.055; g.add(tick);
    }
    const pistonHead = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.028, 16),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }));
    pistonHead.position.y = 0.19; g.add(pistonHead);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.22, 10), M_metalMat(0xaaaaaa));
    rod.position.y = 0.32; g.add(rod);
    const thumbRing = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 8, 24), M_metalMat(0xbbbbbb, 0.7));
    thumbRing.rotation.x = Math.PI / 2; thumbRing.position.y = 0.44; g.add(thumbRing);
    const luercone = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.040, 0.04, 14), M_metalMat(0xcccccc));
    luercone.position.y = -0.23; g.add(luercone);
    const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.24, 10), M_metalMat(0xd8d8d8, 0.95, 0.1));
    needle.position.y = -0.37; g.add(needle);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 5), M_metalMat(0xe8e8e8, 0.95, 0.08));
    tip.scale.y = 0.4; tip.position.y = -0.496; g.add(tip);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.11, 12),
        new THREE.MeshStandardMaterial({ color: 0xee6600, roughness: 0.6 }));
    cap.position.y = -0.424; g.add(cap);
    // 平躺并缩小
    g.scale.set(0.35, 0.35, 0.35);
    g.rotation.x = -Math.PI / 2;
    return g;
}

// ─────────────────────────────────────────────
// 道具：放大镜（平躺）
// ─────────────────────────────────────────────
function M_createMagnifierModel() {
    const g = new THREE.Group();
    const handleMat = M_woodMat(0x7a4420, 0.82);
    const sections = [
        { r1: 0.028, r2: 0.032, h: 0.08, y: -0.32 },
        { r1: 0.032, r2: 0.040, h: 0.12, y: -0.22 },
        { r1: 0.040, r2: 0.038, h: 0.16, y: -0.08 },
        { r1: 0.038, r2: 0.030, h: 0.05, y: 0.09  },
    ];
    sections.forEach(s => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(s.r1, s.r2, s.h, 18), handleMat);
        m.position.y = s.y; g.add(m);
    });
    const endCap = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), M_metalMat(0x888888, 0.7));
    endCap.scale.y = 0.5; endCap.position.y = -0.365; g.add(endCap);
    const frameMat = M_metalMat(0xc8c0a8, 0.75, 0.25);
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.014, 14, 48), frameMat);
    outerRing.position.y = 0.18; g.add(outerRing);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.006, 8, 48), frameMat);
    innerRing.position.y = 0.18; g.add(innerRing);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.026, 0.08, 10), frameMat);
    neck.position.y = 0.10; g.add(neck);
    const lensMat = new THREE.MeshPhysicalMaterial({
        color: 0xeef8ff, transmission: 0.92, transparent: true, opacity: 0.35,
        roughness: 0.0, metalness: 0.0, ior: 1.52
    });
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 24), lensMat);
    lens.scale.set(0.88, 0.045, 0.88); lens.position.y = 0.18; g.add(lens);
    const rivetMat = M_metalMat(0xaaaaaa, 0.8);
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), rivetMat);
        rivet.position.set(Math.cos(angle) * 0.135, 0.18, Math.sin(angle) * 0.135);
        g.add(rivet);
    }
    // 平躺
    g.rotation.x = -Math.PI / 2;
    return g;
}

// ─────────────────────────────────────────────
// 道具：泰瑟枪（电击器）
// ─────────────────────────────────────────────
function M_createTaserModel() {
    const g = new THREE.Group();
    const bodyMat   = M_plasticMat(0x1a1a1a, 0.45);
    const gripMat   = new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.92 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xddcc00, roughness: 0.55 });
    const chromeMat = M_metalMat(0xd0d0d0, 0.85, 0.20);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.14, 0.22), bodyMat);
    upper.position.set(0, 0.32, -0.04); g.add(upper);
    const lowerFront = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.08, 0.15), bodyMat);
    lowerFront.position.set(0, 0.22, -0.12); g.add(lowerFront);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.30, 0.12), gripMat);
    grip.position.set(0, 0.1, 0.04); grip.rotation.x = 0.12; g.add(grip);
    const gripBase = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.018, 0.12), M_metalMat(0x333333));
    gripBase.position.set(0, -0.055, 0.04); g.add(gripBase);
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.055, 0.042),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 }));
    trigger.position.set(0, 0.225, -0.014); trigger.rotation.x = -0.25; g.add(trigger);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.014, 0.22), yellowMat);
    stripe.position.set(0, 0.265, -0.04); g.add(stripe);
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.048, 0.022), bodyMat);
    muzzle.position.set(0, 0.32, -0.165); g.add(muzzle);
    for (const side of [-1, 1]) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.045, 8), chromeMat);
        pin.rotation.x = Math.PI / 2; pin.position.set(side * 0.018, 0.322, -0.19); g.add(pin);
        const arc = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x66ccff }));
        arc.position.set(side * 0.018, 0.322, -0.214); g.add(arc);
    }
    const safety = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.014, 0.038),
        new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 }));
    safety.position.set(0, 0.31, -0.02); g.add(safety);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ff44 }));
    led.position.set(0.032, 0.34, -0.04); g.add(led);
    const ledGlow = new THREE.PointLight(0x00ff44, 0.4, 0.3);
    ledGlow.position.copy(led.position); g.add(ledGlow);
    const arcLight = new THREE.PointLight(0x44aaff, 0.8, 0.5);
    arcLight.position.set(0, 0.322, -0.22); g.add(arcLight);
    // 抬高防止穿模
    g.position.y = 0.18;
    return g;
}

// ─────────────────────────────────────────────
// 道具：除颤器（心脏起搏器 - 旧模型，保留）
// ─────────────────────────────────────────────
function M_createDefibrillatorModel() {
    const g = new THREE.Group();
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.38, metalness: 0.25 });
    const padMat   = M_metalMat(0x777777, 0.6, 0.5);
    const wireMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.16), shellMat);
    box.position.y = 0.12; g.add(box);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x991100, roughness: 0.4 });
    for (const xv of [0.17, -0.17]) {
        const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 12), edgeMat);
        edge.position.set(xv, 0.12, 0.08); g.add(edge);
    }
    const handleMat2 = new THREE.MeshStandardMaterial({ color: 0x881100, roughness: 0.5 });
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 10), handleMat2);
    handleBar.rotation.z = Math.PI / 2; handleBar.position.set(0, 0.256, 0); g.add(handleBar);
    for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.038, 10), handleMat2);
        post.position.set(side * 0.12, 0.242, 0); g.add(post);
    }
    const screenBorder = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.095, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }));
    screenBorder.position.set(-0.04, 0.16, 0.081); g.add(screenBorder);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.148, 0.080),
        new THREE.MeshBasicMaterial({ color: 0x00dd55 }));
    screen.position.set(-0.04, 0.16, 0.087); g.add(screen);
    const shockBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.016, 16),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5 }));
    shockBtn.rotation.x = Math.PI / 2; shockBtn.position.set(0.12, 0.16, 0.082); g.add(shockBtn);
    for (const [i, c] of [[0, 0xff2200], [1, 0xffaa00], [2, 0x00ff44]]) {
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8),
            new THREE.MeshBasicMaterial({ color: c }));
        led.position.set(0.12, 0.10 + i * 0.022, 0.082); g.add(led);
    }
    function makePad(xPos) {
        const pg = new THREE.Group();
        pg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.022, 20), padMat));
        const face = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.004, 20),
            M_metalMat(0x999999, 0.5, 0.4));
        face.position.y = -0.013; pg.add(face);
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.16, 12),
            new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }));
        grip.position.y = 0.09; pg.add(grip);
        pg.position.set(xPos, -0.04, 0.06); pg.rotation.x = Math.PI / 2;
        return pg;
    }
    g.add(makePad(-0.13)); g.add(makePad(0.13));
    function makeCord(startX, arcDir) {
        const cg = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.045, 8), wireMat);
            seg.position.set(startX + arcDir * t * 0.10, 0.06 - Math.sin(t * Math.PI) * 0.12, 0.08 - t * 0.12);
            seg.rotation.x = (t - 0.5) * 0.8; seg.rotation.z = arcDir * t * 0.3;
            cg.add(seg);
        }
        return cg;
    }
    g.add(makeCord(-0.13, -1)); g.add(makeCord(0.13, 1));
    return g;
}

// ─────────────────────────────────────────────
// 新增：心脏起搏器（桌面摆放版）
// ─────────────────────────────────────────────
function M_createPacemakerModel() {
    const g = new THREE.Group();
    const shellMat = new THREE.MeshStandardMaterial({ 
        color: 0xc0c8d0, metalness: 0.85, roughness: 0.2 
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.13), shellMat);
    g.add(body);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xa8b0b8, metalness: 0.9, roughness: 0.15 });
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.13, 12), edgeMat);
    edge.rotation.x = Math.PI / 2; edge.position.set(0.075, 0, 0); g.add(edge);
    const edge2 = edge.clone(); edge2.position.set(-0.075, 0, 0); g.add(edge2);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ff66 }));
    led.position.set(0.06, 0.032, 0); g.add(led);
    const ledGlow = new THREE.PointLight(0x00ff66, 0.6, 0.5);
    ledGlow.position.copy(led.position); g.add(ledGlow);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6), wireMat);
    wire.rotation.z = Math.PI / 2; wire.position.set(-0.03, -0.02, 0.05); g.add(wire);
    g.scale.set(1.35, 1.35, 1.35);
    return g;
}

// ─────────────────────────────────────────────
// 统一道具入口
// ─────────────────────────────────────────────
function M_createItemModelById(id) {
    let model;
    switch (id) {
        case 'beer':          model = M_createBeerModel(); break;
        case 'cigarette':     model = M_createCigaretteModel(); break;
        case 'handcuffs':     model = M_createHandcuffsModel(); break;
        case 'saw':           model = M_createSawModel(); break;
        case 'morphine':      model = M_createMorphineModel(); break;
        case 'check_shell':   model = M_createMagnifierModel(); break;
        case 'taser':         model = M_createTaserModel(); break;
        case 'defibrillator': model = M_createDefibrillatorModel(); break;
        case 'pacemaker':     model = M_createPacemakerModel(); break;
        default:
            model = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1),
                new THREE.MeshBasicMaterial({ color: 0xffffff }));
    }
    if (model) {
        model.scale.set(1.35, 1.35, 1.35);
        model.updateMatrixWorld(true);
        const _bb = new THREE.Box3().setFromObject(model);
        model.userData.restOffset = isFinite(_bb.min.y) ? -_bb.min.y : 0;
    }
    return model;
}

// ─────────────────────────────────────────────
// 网格纹理
// ─────────────────────────────────────────────
function M_createGridTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
        if (Math.random() < 0.15) {
            const gray = 200 + Math.floor(Math.random() * 55);
            imageData.data[i] = gray; imageData.data[i+1] = gray; imageData.data[i+2] = gray;
            imageData.data[i+3] = 150 + Math.floor(Math.random() * 100);
        }
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const margin = 30, size = canvas.width - margin * 2, half = size / 2;
    ctx.strokeRect(margin, margin, size, size);
    ctx.beginPath(); ctx.moveTo(margin, margin + half); ctx.lineTo(margin + size, margin + half); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(margin + half, margin); ctx.lineTo(margin + half, margin + size); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.strokeRect(margin, margin, size, size);
    ctx.beginPath(); ctx.moveTo(margin, margin + half); ctx.lineTo(margin + size, margin + half); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(margin + half, margin); ctx.lineTo(margin + half, margin + size); ctx.stroke();
    return new THREE.CanvasTexture(canvas);
}

function M_createItemGrid() {
    const texture = M_createGridTexture();
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: true, fog: false });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), material);
    grid.rotation.x = -Math.PI / 2; grid.renderOrder = 1;
    return grid;
}

// ─────────────────────────────────────────────
// 程序化木纹 + 血迹桌面材质
// ─────────────────────────────────────────────
function M_createTableWoodTexture() {
    const W = 1024, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0d0806';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 120; i++) {
        const y0 = (i / 120) * H;
        const darkness = 0.3 + Math.random() * 0.55;
        const r = Math.floor(22 * darkness);
        const g = Math.floor(13 * darkness);
        const b = Math.floor(7  * darkness);
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = 1.2 + Math.random() * 3.5;
        ctx.beginPath();
        ctx.moveTo(0, y0);
        for (let x = 0; x < W; x += 18) {
            ctx.lineTo(x, y0 + (Math.random() - 0.5) * 14);
        }
        ctx.stroke();
    }

    for (let s = 0; s < 18; s++) {
        const sx = Math.random() * W;
        const sy = Math.random() * H;
        const len = 30 + Math.random() * 180;
        const angle = (Math.random() - 0.5) * 0.4;
        ctx.strokeStyle = `rgba(180,160,140,${0.04 + Math.random() * 0.10})`;
        ctx.lineWidth = 0.5 + Math.random() * 1.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        ctx.stroke();
    }

    for (let d = 0; d < 12; d++) {
        const dx = Math.random() * W;
        const dy = Math.random() * H;
        const dr = 2 + Math.random() * 6;
        const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
        grad.addColorStop(0, 'rgba(0,0,0,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.fill();
    }

    const bloodGrad = ctx.createRadialGradient(W*0.42, H*0.62, 0, W*0.42, H*0.62, W*0.28);
    bloodGrad.addColorStop(0,   'rgba(55,4,4,0.82)');
    bloodGrad.addColorStop(0.4, 'rgba(38,3,3,0.55)');
    bloodGrad.addColorStop(1,   'rgba(20,1,1,0)');
    ctx.fillStyle = bloodGrad;
    ctx.beginPath(); ctx.ellipse(W*0.42, H*0.62, W*0.28, H*0.30, -0.2, 0, Math.PI*2); ctx.fill();

    for (let sp = 0; sp < 28; sp++) {
        const spx = W*0.2 + Math.random() * W*0.55;
        const spy = H*0.25 + Math.random() * H*0.55;
        const spr = 1 + Math.random() * 9;
        ctx.fillStyle = `rgba(${35+Math.floor(Math.random()*20)},2,2,${0.25+Math.random()*0.5})`;
        ctx.beginPath(); ctx.ellipse(spx, spy, spr, spr*(0.4+Math.random()*0.8),
            Math.random()*Math.PI, 0, Math.PI*2); ctx.fill();
    }

    for (let br = 0; br < 5; br++) {
        const bx = W*0.25 + Math.random()*W*0.4;
        const by = H*0.3  + Math.random()*H*0.4;
        const blen = 40 + Math.random()*160;
        const bang  = (Math.random()-0.5)*1.2;
        ctx.strokeStyle = `rgba(40,2,2,${0.15+Math.random()*0.25})`;
        ctx.lineWidth = 2 + Math.random()*7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(bang)*blen, by + Math.sin(bang)*blen);
        ctx.stroke();
    }

    const edgeGrad = ctx.createLinearGradient(0, 0, 0, H*0.12);
    edgeGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
    edgeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeGrad; ctx.fillRect(0, 0, W, H*0.12);
    const edgeGrad2 = ctx.createLinearGradient(0, H, 0, H*0.88);
    edgeGrad2.addColorStop(0, 'rgba(0,0,0,0.55)');
    edgeGrad2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeGrad2; ctx.fillRect(0, H*0.88, W, H*0.12);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.5, 1.4);
    return tex;
}

function M_createTableLegTexture() {
    const W = 256, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#080503'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
        const y0 = (i / 60) * H;
        const v = 0.2 + Math.random() * 0.4;
        ctx.strokeStyle = `rgb(${Math.floor(18*v)},${Math.floor(10*v)},${Math.floor(5*v)})`;
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath(); ctx.moveTo(0, y0);
        for (let x = 0; x < W; x += 12)
            ctx.lineTo(x, y0 + (Math.random()-0.5)*8);
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    return tex;
}

// ─────────────────────────────────────────────
// 场景：桌子（带木纹材质）
// ─────────────────────────────────────────────
function M_createFloorTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#3d3834'; g.fillRect(0, 0, 512, 512);
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
        (() => { const ft = M_createFloorTexture(); return new THREE.MeshStandardMaterial({ map: ft, emissive: 0x2a2420, emissiveMap: ft, emissiveIntensity: 0.8, roughness: 0.82, metalness: 0.05 }); })());
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

function M_createTableTopTexture() {
    const W = 1024, H = 1024;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#143022'; g.fillRect(0, 0, W, H);
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
        gr.addColorStop(0, 'rgba(110,140,110,0.08)'); gr.addColorStop(1, 'rgba(110,140,110,0)');
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

function M_buildTableV2(scene) {
    const T = new THREE.Group(); T.name = 'table';
    const Y = 0.09;                       // group sits at y=-0.09, so local y = world y + 0.09
    const HX = 4.6, HZ = 7.0;
    const topMat = new THREE.MeshStandardMaterial({ map: M_createTableTopTexture(), roughness: 0.8, metalness: 0.0 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x2c1b10, roughness: 0.9 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.8 });
    const iron = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.8, roughness: 0.45 });
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y + Y, z); T.add(m); return m; };

    // tabletop: faces order +x,-x,+y,-y,+z,-z
    add(new THREE.BoxGeometry(HX * 2, 0.16, HZ * 2), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat], 0, -0.08, 0);
    // raised rim so the edge reads clearly
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(HX * 2, 0.2, 0.5), trimMat, 0, 0.10, sz * (HZ - 0.25));
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.5, 0.2, HZ * 2 - 1.0), trimMat, sx * (HX - 0.25), 0.10, 0);
    // apron under the top
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(HX * 2 - 0.8, 0.4, 0.2), sideMat, 0, -0.36, sz * (HZ - 0.5));
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.2, 0.4, HZ * 2 - 1.0), sideMat, sx * (HX - 0.5), -0.36, 0);
    // legs, feet, stretchers
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const lx = sx * (HX - 0.6), lz = sz * (HZ - 0.7);
        add(new THREE.BoxGeometry(0.5, 2.96, 0.5), sideMat, lx, -1.64, lz);
        add(new THREE.BoxGeometry(0.6, 0.08, 0.6), iron, lx, -3.12, lz);
        add(new THREE.BoxGeometry(0.7, 0.05, 0.7), iron, sx * (HX - 0.4), 0.22, sz * (HZ - 0.4));
    }
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(HX * 2 - 1.6, 0.16, 0.16), sideMat, 0, -2.0, sz * (HZ - 0.7));
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.16, 0.16, HZ * 2 - 1.8), sideMat, sx * (HX - 0.6), -2.0, 0);

    M_addFloorAndFill(T);
    T.position.y = -0.09;
    scene.add(T);
}

function M_buildTableTextured(scene) {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'table';

    const woodTex = M_createTableWoodTexture();
    const legTex  = M_createTableLegTexture();

    const topMat = new THREE.MeshStandardMaterial({
        map: woodTex, roughness: 0.88, metalness: 0.0
    });
    const legMat = new THREE.MeshStandardMaterial({
        map: legTex, roughness: 0.94, metalness: 0.0
    });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x080503, roughness: 0.96 });

    const topBoard = new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 14), topMat);
    topBoard.position.y = 0; tableGroup.add(topBoard);

    for (const zv of [-7.0, 7.0]) {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(12, 0.22, 0.06), edgeMat);
        edge.position.set(0, -0.02, zv);
        tableGroup.add(edge);
    }
    for (const xv of [-6.0, 6.0]) {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 14), edgeMat);
        edge.position.set(xv, -0.02, 0);
        tableGroup.add(edge);
    }

    const footMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.6 });
    for (const [lx, lz] of [[-5.3,-6.3],[5.3,-6.3],[-5.3,6.3],[5.3,6.3]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.0, 0.28), legMat);
        leg.position.set(lx, -1.59, lz); tableGroup.add(leg);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.32), footMat);
        foot.position.set(lx, -3.12, lz); tableGroup.add(foot);
    }

    for (const zv of [-5.8, 5.8]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.14, 0.18), legMat);
        b.position.set(0, -2.0, zv); tableGroup.add(b);
    }
    for (const xv of [-5.0, 5.0]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 12.2), legMat);
        b.position.set(xv, -2.0, 0); tableGroup.add(b);
    }

    M_addFloorAndFill(tableGroup);
    tableGroup.position.y = -0.09;
    scene.add(tableGroup);
}

// ─────────────────────────────────────────────
// 双管猎枪
// ─────────────────────────────────────────────
function M_buildShotgunDouble(scene) {
    const g = new THREE.Group();
    g.name = 'gunGroup';

    const steelMat  = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.92, roughness: 0.28 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, metalness: 0.88, roughness: 0.38 });
    const stockMat  = new THREE.MeshStandardMaterial({ color: 0x3b1e0a, roughness: 0.84, metalness: 0.0 });
    const stockDark = new THREE.MeshStandardMaterial({ color: 0x2a1206, roughness: 0.88, metalness: 0.0 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.96 });
    const ironMat   = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.85, roughness: 0.35 });

    for (const side of [-1, 1]) {
        const ox = side * 0.085;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.050, 4.4, 18), steelMat);
        barrel.rotation.x = Math.PI / 2; barrel.position.set(ox, 0.40, -1.7);
        g.add(barrel);
        const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 4.42, 12),
            new THREE.MeshStandardMaterial({ color: 0x040404, roughness: 0.6 }));
        bore.rotation.x = Math.PI / 2; bore.position.set(ox, 0.40, -1.7);
        g.add(bore);
        const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.048, 0.10, 16), steelMat);
        muzzle.rotation.x = Math.PI / 2; muzzle.position.set(ox, 0.40, -3.9);
        g.add(muzzle);
    }

    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.065, 4.3), darkSteel);
    rib.position.set(0, 0.40, -1.65); g.add(rib);

    for (let i = 0; i < 3; i++) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.055), steelMat);
        band.position.set(0, 0.40, -0.7 - i * 1.1); g.add(band);
    }

    const sight = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.7, roughness: 0.2 }));
    sight.position.set(0, 0.462, -3.82); g.add(sight);
    const rearBase = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.024, 0.022), steelMat);
    rearBase.position.set(0, 0.462, -0.55); g.add(rearBase);

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 1.6), darkSteel);
    receiver.position.set(0, 0.34, 0.85); g.add(receiver);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.018, 1.4), ironMat);
    rail.position.set(0, 0.55, 0.85); g.add(rail);

    for (const side of [-1, 1]) {
        const ep = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.10, 0.22),
            new THREE.MeshStandardMaterial({ color: 0x050505 }));
        ep.position.set(side * 0.161, 0.35, 0.8); g.add(ep);
        const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.11, 0.055), darkSteel);
        hammer.position.set(side * 0.075, 0.50, 1.55);
        hammer.rotation.x = -0.35; g.add(hammer);
        const hammerSpur = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 8), steelMat);
        hammerSpur.position.set(side * 0.075, 0.56, 1.62); g.add(hammerSpur);
    }

    const forestock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 1.2), stockMat);
    forestock.position.set(0, 0.22, -0.28); g.add(forestock);
    for (let i = 0; i < 10; i++) {
        const groove = new THREE.Mesh(new THREE.BoxGeometry(0.285, 0.005, 0.022),
            new THREE.MeshStandardMaterial({ color: 0x220d03, roughness: 0.97 }));
        groove.position.set(0, 0.22, -0.78 + i * 0.11); g.add(groove);
    }

    const guardRing = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.013, 8, 22), ironMat);
    guardRing.rotation.x = Math.PI / 2; guardRing.scale.set(1.1, 0.55, 1.0);
    guardRing.position.set(0, 0.17, 1.52); g.add(guardRing);
    for (const side of [-1, 1]) {
        const trig = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.072, 0.020), ironMat);
        trig.position.set(side * 0.032, 0.21, 1.50); trig.rotation.x = 0.3; g.add(trig);
    }

    const stockMain = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 1.85), stockMat);
    stockMain.position.set(0, 0.25, 2.78); g.add(stockMain);
    const stockTop = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.12, 1.65), stockDark);
    stockTop.position.set(0, 0.44, 2.78); g.add(stockTop);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.50), stockDark);
    grip.position.set(0, 0.12, 1.84); g.add(grip);
    const buttpad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.055), rubberMat);
    buttpad.position.set(0, 0.25, 3.70); g.add(buttpad);
    const stockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.32, 0.008), steelMat);
    stockPlate.position.set(0, 0.25, 3.66); g.add(stockPlate);
    for (const [sx, sy] of [[-0.07, 0.34],[0.07, 0.34],[-0.07, 0.16],[0.07, 0.16]]) {
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.012, 8),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6 }));
        screw.rotation.z = Math.PI / 2; screw.position.set(sx, sy, 3.668); g.add(screw);
    }

    g.position.set(0, 0.46, 0);
    scene.add(g);
}

// ─────────────────────────────────────────────
// 恶魔
// ─────────────────────────────────────────────
function M_buildDemon(scene) {
    const demonGroup = new THREE.Group();
    demonGroup.name = 'demonGroup';

    const skinMat = new THREE.MeshStandardMaterial({
        color: 0x050101, emissive: new THREE.Color(0x0f0000),
        roughness: 0.35, metalness: 0.75,
        transparent: true, opacity: 0.88
    });
    const boneMat = new THREE.MeshStandardMaterial({
        color: 0x1a0808, emissive: new THREE.Color(0x0d0000),
        roughness: 0.25, metalness: 0.90,
        transparent: true, opacity: 0.92
    });
    const eyeMat = new THREE.MeshStandardMaterial({
        color: 0xff0000, emissive: new THREE.Color(0x660000),
        emissiveIntensity: 2.0, roughness: 0.2, metalness: 0.0
    });
    const hornMat = new THREE.MeshStandardMaterial({
        color: 0x0a0000, emissive: new THREE.Color(0x1a0000),
        roughness: 0.2, metalness: 0.95
    });

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 0.55, 16), boneMat);
    pelvis.position.set(0, 0.28, 0); demonGroup.add(pelvis);

    for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const r = 0.22 - t * 0.08;
        const vert = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, 0.32, 12), boneMat);
        vert.position.set(0, 0.7 + i * 0.42, 0);
        demonGroup.add(vert);
        const spine = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 6), hornMat);
        spine.position.set(0, 0.88 + i * 0.42, -0.22);
        spine.rotation.x = 0.4;
        demonGroup.add(spine);
    }

    const chestMat = new THREE.MeshStandardMaterial({
        color: 0x0a0000, emissive: new THREE.Color(0x1f0000),
        roughness: 0.3, metalness: 0.7,
        transparent: true, opacity: 0.55
    });
    const chest = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 14), chestMat);
    chest.scale.set(0.85, 1.0, 0.75); chest.position.set(0, 2.2, 0);
    demonGroup.add(chest);

    for (let side of [-1, 1]) {
        for (let r = 0; r < 5; r++) {
            const rib = new THREE.Mesh(
                new THREE.TorusGeometry(0.72 + r * 0.05, 0.035, 6, 16, Math.PI * 0.72),
                boneMat
            );
            rib.position.set(side * 0.12, 1.55 + r * 0.32, 0.1);
            rib.rotation.y = side * (Math.PI * 0.5 + r * 0.06);
            rib.rotation.z = side * 0.15;
            demonGroup.add(rib);
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.18, 6), hornMat);
            tip.position.set(side * (0.82 + r * 0.04), 1.55 + r * 0.32, 0.45 + r * 0.02);
            tip.rotation.z = side * (0.8 + r * 0.06);
            demonGroup.add(tip);
        }
    }

    for (const side of [-1, 1]) {
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 16, Math.PI * 0.5), boneMat);
        collar.position.set(side * 0.18, 3.55, 0.1);
        collar.rotation.y = side * 0.6; collar.rotation.z = side * 0.5;
        demonGroup.add(collar);
    }

    for (const side of [-1, 1]) {
        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), boneMat);
        shoulder.position.set(side * 1.35, 3.4, 0); demonGroup.add(shoulder);
        for (let s = 0; s < 3; s++) {
            const sp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 6), hornMat);
            sp.position.set(side * (1.5 + s * 0.12), 3.55 + s * 0.1, -0.1);
            sp.rotation.z = side * (Math.PI / 2 + s * 0.2); sp.rotation.x = -0.2;
            demonGroup.add(sp);
        }
    }

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.55, 12), skinMat);
    neck.position.set(0, 3.82, -0.04); demonGroup.add(neck);
    for (let i = 0; i < 3; i++) {
        const nv = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.12, 10), boneMat);
        nv.position.set(0, 3.62 + i * 0.15, 0); demonGroup.add(nv);
    }

    const skull = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 16), boneMat);
    skull.scale.set(0.92, 0.88, 0.95); skull.position.set(0, 4.85, 0.05);
    demonGroup.add(skull);

    for (const side of [-1, 1]) {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), boneMat);
        cheek.scale.set(0.7, 0.5, 0.6);
        cheek.position.set(side * 0.78, 4.72, 0.62); demonGroup.add(cheek);
    }

    for (const side of [-1, 1]) {
        const brow = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.42, 8), boneMat);
        brow.rotation.z = side * 0.35; brow.rotation.x = -0.25;
        brow.position.set(side * 0.36, 5.08, 0.82); demonGroup.add(brow);
    }

    for (const side of [-1, 1]) {
        const socket = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10),
            new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1.0 }));
        socket.position.set(side * 0.38, 4.88, 0.88); demonGroup.add(socket);
        const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), eyeMat);
        eyeball.position.set(side * 0.38, 4.88, 0.92);
        eyeball.name = side === -1 ? 'leftEye' : 'rightEye';
        demonGroup.add(eyeball);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x110000, roughness: 0.5 }));
        pupil.position.set(side * 0.38, 4.88, 1.01); demonGroup.add(pupil);
    }

    const thirdEye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), eyeMat);
    thirdEye.position.set(0, 5.28, 0.82); thirdEye.name = 'thirdEye';
    demonGroup.add(thirdEye);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 6), boneMat);
    nose.rotation.x = Math.PI / 2; nose.position.set(0, 4.72, 0.96); demonGroup.add(nose);

    const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.065, 8, 20, Math.PI), boneMat);
    jaw.rotation.x = -Math.PI / 2; jaw.position.set(0, 4.32, 0.15); demonGroup.add(jaw);
    for (let i = 0; i < 6; i++) {
        const angle = -Math.PI * 0.4 + (i / 5) * Math.PI * 0.8;
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 5), boneMat);
        tooth.position.set(Math.cos(angle) * 0.5, 4.15, 0.15 + Math.sin(angle) * 0.5);
        tooth.rotation.x = Math.PI; demonGroup.add(tooth);
    }
    for (let i = 0; i < 4; i++) {
        const angle = -Math.PI * 0.28 + (i / 3) * Math.PI * 0.56;
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 5),
            new THREE.MeshStandardMaterial({ color: 0x1a0505, roughness: 0.3, metalness: 0.8 }));
        tooth.position.set(Math.cos(angle) * 0.48, 4.52, 0.14 + Math.sin(angle) * 0.48);
        demonGroup.add(tooth);
    }

    for (let side of [-1, 1]) {
        for (let h = 0; h < 2; h++) {
            const hx = side * (0.55 + h * 0.22);
            const hy = 5.8 + h * 0.3;
            const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.14, 1.5, 10), hornMat);
            horn.position.set(hx, hy, 0);
            horn.rotation.z = side * (0.42 + h * 0.18);
            horn.rotation.x = -0.1 - h * 0.08;
            demonGroup.add(horn);
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.45, 8), hornMat);
            tip.position.set(hx + side * 0.6 + side * h * 0.15, hy + 0.8 + h * 0.1, -0.1);
            tip.rotation.z = side * (0.55 + h * 0.2);
            demonGroup.add(tip);
        }
    }

    for (const side of [-1, 1]) {
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0x060000, emissive: new THREE.Color(0x0f0000),
            roughness: 0.3, metalness: 0.85,
            transparent: true, opacity: 0.75
        });
        const wingMemMat = new THREE.MeshStandardMaterial({
            color: 0x180000, roughness: 0.6, metalness: 0.2,
            transparent: true, opacity: 0.38, side: THREE.DoubleSide
        });

        const wingRoot = new THREE.Group();
        wingRoot.position.set(side * 1.2, 2.8, -0.3);
        wingRoot.rotation.y = side * -0.2;

        const boneAngles = [0.0, 0.35, 0.65];
        const boneLengths = [1.8, 1.4, 1.0];
        let prevEnd = new THREE.Vector3(0, 0, 0);
        for (let b = 0; b < 3; b++) {
            const bone = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04 - b * 0.01, 0.06 - b * 0.01, boneLengths[b], 8),
                wingMat
            );
            const bx = side * (boneLengths[b] / 2 + prevEnd.x);
            const by = boneLengths[b] * Math.sin(-boneAngles[b]) / 2 + prevEnd.y;
            bone.position.set(bx, by, 0);
            bone.rotation.z = -boneAngles[b] * side;
            wingRoot.add(bone);
            prevEnd.x += side * boneLengths[b] * Math.cos(boneAngles[b]);
            prevEnd.y -= boneLengths[b] * Math.sin(boneAngles[b]);
        }

        const wingPoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(side * 1.7, -0.5, 0.1),
            new THREE.Vector3(side * 3.2, -1.1, 0.1),
            new THREE.Vector3(side * 4.0, -2.2, 0.05),
            new THREE.Vector3(side * 2.5, -3.5, 0),
            new THREE.Vector3(0, -2.8, 0),
        ];
        const memGeo = new THREE.BufferGeometry();
        const verts = [];
        for (let p = 1; p < wingPoints.length - 1; p++) {
            verts.push(wingPoints[0].x, wingPoints[0].y, wingPoints[0].z);
            verts.push(wingPoints[p].x, wingPoints[p].y, wingPoints[p].z);
            verts.push(wingPoints[p+1].x, wingPoints[p+1].y, wingPoints[p+1].z);
        }
        memGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        memGeo.computeVertexNormals();
        const membrane = new THREE.Mesh(memGeo, wingMemMat);
        wingRoot.add(membrane);

        for (let c = 0; c < 3; c++) {
            const claw = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 0.55, 6), wingMat);
            claw.position.set(side * (3.8 + c * 0.18), -2.0 - c * 0.18, 0);
            claw.rotation.z = side * (0.3 + c * 0.25);
            wingRoot.add(claw);
        }

        demonGroup.add(wingRoot);
    }

    const tailSegments = [
        { r: 0.14, len: 0.55, x: 0,     y: 0.35, z: 0.65,  rx:  0.7 },
        { r: 0.11, len: 0.55, x: 0.2,   y: 0.05, z: 1.1,   rx:  0.3 },
        { r: 0.09, len: 0.50, x: 0.5,   y:-0.15, z: 1.5,   rx: -0.2 },
        { r: 0.07, len: 0.45, x: 0.8,   y:-0.35, z: 1.85,  rx: -0.5 },
        { r: 0.05, len: 0.40, x: 0.95,  y:-0.6,  z: 2.15,  rx: -0.7 },
    ];
    for (const s of tailSegments) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(s.r * 0.8, s.r, s.len, 10), skinMat);
        seg.position.set(s.x, s.y, s.z); seg.rotation.x = s.rx;
        demonGroup.add(seg);
    }
    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.55, 8), hornMat);
    tailTip.position.set(1.05, -0.88, 2.4); tailTip.rotation.x = -1.0;
    demonGroup.add(tailTip);

    demonGroup.position.set(0, 0, -7.5);
    scene.add(demonGroup);

    const demonGlow = new THREE.PointLight(0x990000, 0.7 * 1.0, 8);
    demonGlow.position.set(0, 4.2, -6.5); demonGlow.name = 'demonGlow'; scene.add(demonGlow);
    const demonGlow2 = new THREE.PointLight(0x660000, 0.35 * 1.0, 10);
    demonGlow2.position.set(0, 0.3, -7); demonGlow2.name = 'demonGlow2'; scene.add(demonGlow2);
    const eyeLight = new THREE.PointLight(0xff0000, 0.9, 3.5);
    eyeLight.position.set(0, 4.88, -6.5); scene.add(eyeLight);
}

// ─────────────────────────────────────────────
// 恶魔的手
// ─────────────────────────────────────────────
function M_buildDemonHand(scene, manager) {
    const demonHand = new THREE.Group();
    demonHand.name = 'demonHand';

    const skinMat = new THREE.MeshStandardMaterial({
        color: 0x0a0101, emissive: new THREE.Color(0x0a0000),
        roughness: 0.45, metalness: 0.65
    });
    const boneMat = new THREE.MeshStandardMaterial({
        color: 0x140404, emissive: new THREE.Color(0x0d0000),
        roughness: 0.25, metalness: 0.88
    });
    const clawMat = new THREE.MeshStandardMaterial({
        color: 0x050000, emissive: new THREE.Color(0x1a0000),
        roughness: 0.15, metalness: 0.95
    });

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.30, 14, 10), skinMat);
    palm.scale.set(1.0, 0.52, 0.78); palm.position.set(0, 0, 0);
    demonHand.add(palm);

    for (let i = 0; i < 4; i++) {
        const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), boneMat);
        knuckle.position.set(-0.12 + i * 0.08, 0.17, -0.1 - i * 0.02);
        demonHand.add(knuckle);
    }

    const fingerDefs = [
        [-0.26, -0.02,  0.55, -0.3, [0.22, 0.18, 0.14]],
        [-0.14, -0.28,  0.18,  0.0, [0.30, 0.25, 0.18]],
        [-0.04, -0.30,  0.04,  0.0, [0.33, 0.27, 0.20]],
        [ 0.06, -0.28, -0.08,  0.0, [0.30, 0.24, 0.18]],
        [ 0.16, -0.24, -0.22,  0.0, [0.22, 0.18, 0.14]],
    ];

    for (const [fx, fz, angleZ, angleX, segs] of fingerDefs) {
        const fingerGroup = new THREE.Group();
        fingerGroup.position.set(fx, 0.06, fz);
        fingerGroup.rotation.z = angleZ;
        fingerGroup.rotation.x = angleX;

        let curY = 0;
        for (let s = 0; s < 3; s++) {
            const r = 0.045 - s * 0.008;
            const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, segs[s], 10), skinMat);
            seg.position.y = curY + segs[s] / 2;
            fingerGroup.add(seg);
            const joint = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 8, 6), boneMat);
            joint.position.y = curY;
            fingerGroup.add(joint);
            curY += segs[s];
            if (s === 0) {
                const sub = new THREE.Group();
                sub.rotation.z = -angleZ * 0.15;
                fingerGroup.add(sub);
            }
        }

        const clawBase = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.32, 7), clawMat);
        clawBase.position.y = curY + 0.14;
        clawBase.rotation.x = 0.55;
        fingerGroup.add(clawBase);
        const clawTip = new THREE.Mesh(new THREE.ConeGeometry(0.010, 0.18, 6), clawMat);
        clawTip.position.set(0, curY + 0.35, -0.16);
        clawTip.rotation.x = 1.1;
        fingerGroup.add(clawTip);

        demonHand.add(fingerGroup);
    }

    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.25, 0.28, 14), boneMat);
    wrist.position.set(0, -0.14, 0.22); wrist.rotation.x = 0.3;
    demonHand.add(wrist);

    for (const side of [-1, 1]) {
        const wristSpike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.35, 7), clawMat);
        wristSpike.position.set(side * 0.24, -0.05, 0.15);
        wristSpike.rotation.z = side * 1.2; wristSpike.rotation.x = 0.2;
        demonHand.add(wristSpike);
    }

    const armMat = new THREE.MeshStandardMaterial({
        color: 0x080101, emissive: new THREE.Color(0x0a0000),
        roughness: 0.5, metalness: 0.6
    });
    for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const seg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12 + t * 0.06, 0.14 + t * 0.06, 0.30, 12),
            armMat
        );
        seg.position.set(0, -0.30 - i * 0.30, 0.12 + t * 0.15);
        seg.rotation.x = 0.28 + t * 0.1;
        demonHand.add(seg);
    }

    for (let i = 0; i < 3; i++) {
        const bump = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), boneMat);
        bump.position.set(0, -0.4 - i * 0.35, -0.12 - i * 0.06);
        demonHand.add(bump);
    }

    const armConnector = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.14, 1.2, 12),
        armMat
    );
    armConnector.name = 'armConnector';
    scene.add(armConnector);

    demonHand.position.set(manager.handCurrentX, manager.handCurrentY, manager.handCurrentZ);
    scene.add(demonHand);
}

// ─────────────────────────────────────────────
// 场景主函数（四个网格，位置与道具落点对齐）
// ─────────────────────────────────────────────
function M_initScene(scene, brightness, manager) {
    const centerSpot = new THREE.SpotLight(0xffffff, 4.2 * brightness, 16, Math.PI / 4, 0.4, 1.2);
    centerSpot.position.set(0, 7.5, 0);
    centerSpot.target.position.set(0, 0, 0);
    centerSpot.name = 'centerSpot';
    scene.add(centerSpot);
    scene.add(centerSpot.target);
    const ambientLight = new THREE.AmbientLight(0x7a6a6a);
    ambientLight.intensity = 0.32 * brightness;
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    M_buildTableV2(scene);
    M_buildShotgunDouble(scene);
    M_buildDemon(scene);
    M_buildDemonHand(scene, manager);

    // 玩家道具网格（左）
    const pLeftGrid = M_createItemGrid();
    pLeftGrid.position.set(-2.2, 0.11, 4.5);
    pLeftGrid.name = 'leftItemGrid';
    scene.add(pLeftGrid);

    // 玩家道具网格（右）
    const pRightGrid = M_createItemGrid();
    pRightGrid.position.set(2.2, 0.11, 4.5);
    pRightGrid.name = 'rightItemGrid';
    scene.add(pRightGrid);

    // 对方道具网格（左）
    const eLeftGrid = M_createItemGrid();
    eLeftGrid.position.set(-2.2, 0.11, -5.5);
    eLeftGrid.name = 'enemyLeftItemGrid';
    scene.add(eLeftGrid);

    // 对方道具网格（右）
    const eRightGrid = M_createItemGrid();
    eRightGrid.position.set(2.2, 0.11, -5.5);
    eRightGrid.name = 'enemyRightItemGrid';
    scene.add(eRightGrid);
}

// ─────────────────────────────────────────────
// 开场动画：雨
// ─────────────────────────────────────────────
function M_createRain() {
    const particles = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
        positions[i]   = (Math.random() - 0.5) * 20;
        positions[i+1] = Math.random() * 10;
        positions[i+2] = (Math.random() - 0.5) * 20;
    }
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rain = new THREE.Points(particles,
        new THREE.PointsMaterial({ color: 0x8899aa, size: 0.08, transparent: true, opacity: 0.6 }));
    rain.name = 'rainParticles';
    return rain;
}

// ─────────────────────────────────────────────
// 开场动画：紫色火焰
// ─────────────────────────────────────────────
function M_createPurpleFlame(position) {
    const group = new THREE.Group();
    const particleCount = 40;
    const flameGeo = new THREE.BufferGeometry();
    const flamePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        flamePositions[i]   = (Math.random() - 0.5) * 0.8;
        flamePositions[i+1] = Math.random() * 1.0;
        flamePositions[i+2] = (Math.random() - 0.5) * 0.8;
    }
    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    const flameMat = new THREE.PointsMaterial({
        color: 0x9933ff, size: 0.18, blending: THREE.AdditiveBlending,
        depthWrite: false, transparent: true, opacity: 0.8
    });
    const flameParticles = new THREE.Points(flameGeo, flameMat);
    group.add(flameParticles);
    const light = new THREE.PointLight(0x9933ff, 1.8, 6);
    group.add(light);
    group.position.copy(position);
    group.userData.light = light;
    group.userData.flameParticles = flameParticles;
    return group;
}

// ─────────────────────────────────────────────
// 开场动画：墙上文字
// ─────────────────────────────────────────────
function M_createWallWithText(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a0000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.shadowColor = '#000'; ctx.shadowBlur = 15;
    const lines = text.split('\n');
    if (lines.length === 0) lines.push(text);
    const lineHeight = 70;
    const startY = canvas.height / 2 - (lines.length * lineHeight) / 2 + 30;
    lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, startY + i * lineHeight));
    const texture = new THREE.CanvasTexture(canvas);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(6, 3),
        new THREE.MeshBasicMaterial({ map: texture }));
    plane.position.set(-5, 2, -4); plane.rotation.y = 0.3; plane.name = 'wallText';
    return plane;
}