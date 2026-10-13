// ==================== 开场动画管理器（手机长按跳过 + 触摸开门） ====================
class OpeningManager {
    constructor(sceneManager, onComplete) {
        this.sm = sceneManager;
        this.scene = sceneManager.scene;
        this.camera = sceneManager.camera;
        this.renderer = sceneManager.renderer;
        this.onComplete = onComplete;

        this.phase = 'fadeIn';
        this.fadeInDuration = 1500;
        this.walkDuration = 2000;
        this.rainAudio = null;
        this.doorOpenAudio = null;

        this.dialogues = [
            "人类，你已经死了。",
            "这里是地狱。",
            "你生前没有满足轮回的条件，本应被囚禁。",
            "但今天我心情好——",
            "陪我玩个游戏。枪里有实弹和空包，我们轮流开枪。",
            "桌上有一些道具，它们能帮你活下去，规则你自己摸索。",
            "三局两胜。赢了我，就放你走。",
            "准备好了吗？"
        ];

        this.currentDialogueIndex = 0;
        this.isTyping = false;
        this.typingTimer = null;
        this.dialogueFinished = false;
        this.waitingForClick = false;
        this.spaceHoldStart = null;
        this.spaceHoldThreshold = 800;
        this.touchHoldStart = null;

        this.openingObjects = [];
        this.doorGroup = null;
        this.doorPivot = null;
        this.rainParticles = null;
        this.animFrameId = null;
        this.audioCtx = null;

        // 绑定事件
        this.boundCanvasClick = this.onCanvasClick.bind(this);
        this.boundDocumentClick = this.onDocumentClick.bind(this);
        this.boundKeyDown = this.onKeyDown.bind(this);
        this.boundKeyUp = this.onKeyUp.bind(this);
        this.boundTouchStart = this.onTouchStart.bind(this);
        this.boundTouchEnd = this.onTouchEnd.bind(this);

        this.init();
    }

    init() {
        // 隐藏主场景物体
        const namesToHide = [
            'centerSpot', 'ambientLight', 'gunGroup', 'demonGroup',
            'demonHand', 'armConnector', 'demonGlow', 'demonGlow2',
            'leftEye', 'rightEye', 'thirdEye', 'table', 'stain',
            'leftItemGrid', 'rightItemGrid'
        ];
        namesToHide.forEach(name => {
            const obj = this.scene.getObjectByName(name);
            if (obj) obj.visible = false;
        });

        document.getElementById('hud').style.display = 'none';
        document.getElementById('demon-speak-ui').style.display = 'none';
        document.getElementById('opening-click-hint').style.display = 'none';

        const tempAmbient = new THREE.AmbientLight(0x888888);
        this.scene.add(tempAmbient);
        this.openingObjects.push(tempAmbient);

        // 键盘事件
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        // 手机长按跳过
        document.addEventListener('touchstart', this.boundTouchStart);
        document.addEventListener('touchend', this.boundTouchEnd);

        // 黑屏渐亮
        const overlay = document.getElementById('opening-overlay');
        overlay.style.display = 'flex';
        overlay.style.transition = 'none';
        overlay.style.opacity = '1';
        overlay.offsetHeight;
        overlay.style.transition = `opacity ${this.fadeInDuration / 1000}s`;
        overlay.style.opacity = '0';

        // 播放雨声
        this.rainAudio = new Audio('./src/audio/rain.mp3');
        this.rainAudio.loop = true;
        this.rainAudio.volume = 0.25;
        this.rainAudio.play().catch(() => {});

        // 创建场景元素
        this.createGroundAndRoad();
        this.createWalls();
        this.createRain();
        this.createDoor();

        this.camera.position.set(0, 2.2, 6);
        this.camera.lookAt(0, 1.7, -4);
        this.startAnimationLoop();

        // 渐显后显示门提示
        setTimeout(() => {
            if (this.phase === 'fadeIn') {
                this.phase = 'waitingDoor';
                document.getElementById('opening-click-hint').innerText = '点击门进入';
                document.getElementById('opening-click-hint').style.display = 'block';
                // 门点击（桌面 + 触摸）
                this.renderer.domElement.addEventListener('click', this.boundCanvasClick);
                this.renderer.domElement.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    this.boundCanvasClick({ clientX: touch.clientX, clientY: touch.clientY });
                }, { passive: false });
            }
        }, this.fadeInDuration + 300);
    }

    // ---------- 场景构建 ----------
    createGroundAndRoad() {
        const groundGeo = new THREE.PlaneGeometry(30, 30);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        this.scene.add(ground);
        this.openingObjects.push(ground);

        const roadGeo = new THREE.PlaneGeometry(2, 12);
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, -0.05, -1);
        this.scene.add(road);
        this.openingObjects.push(road);
    }

    createWalls() {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 6), wallMat);
        leftWall.position.set(-7.5, 3, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.scene.add(leftWall);
        this.openingObjects.push(leftWall);

        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 6), wallMat);
        rightWall.position.set(7.5, 3, 0);
        rightWall.rotation.y = -Math.PI / 2;
        this.scene.add(rightWall);
        this.openingObjects.push(rightWall);

        const leftPiece = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), wallMat);
        leftPiece.position.set(-4.5, 3, -4);
        this.scene.add(leftPiece);
        this.openingObjects.push(leftPiece);

        const rightPiece = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), wallMat);
        rightPiece.position.set(4.5, 3, -4);
        this.scene.add(rightPiece);
        this.openingObjects.push(rightPiece);

        const topPiece = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), wallMat);
        topPiece.position.set(0, 5.3, -4);
        this.scene.add(topPiece);
        this.openingObjects.push(topPiece);
    }

    createRain() {
        const particles = new THREE.BufferGeometry();
        const count = 3000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i+1] = Math.random() * 10;
            positions[i+2] = (Math.random() - 0.5) * 20;
        }
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const rainMat = new THREE.PointsMaterial({ color: 0x8899aa, size: 0.08, transparent: true, opacity: 0.6 });
        this.rainParticles = new THREE.Points(particles, rainMat);
        this.scene.add(this.rainParticles);
        this.openingObjects.push(this.rainParticles);
    }

    createDoor() {
        const group = new THREE.Group();
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.5, emissive: new THREE.Color(0x110500) });
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x331100, roughness: 0.5, emissive: new THREE.Color(0x0a0300) });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xccaa66, metalness: 0.8, emissive: new THREE.Color(0x221100) });

        const frameW = 2.0, frameH = 3.4, frameT = 0.15;

        const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(frameT, frameH, frameT), frameMat);
        leftFrame.position.set(-frameW/2 - frameT/2, 0, 0);
        group.add(leftFrame);

        const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(frameT, frameH, frameT), frameMat);
        rightFrame.position.set(frameW/2 + frameT/2, 0, 0);
        group.add(rightFrame);

        const topFrame = new THREE.Mesh(new THREE.BoxGeometry(frameW + frameT*2, frameT, frameT), frameMat);
        topFrame.position.y = frameH/2;
        group.add(topFrame);

        const bottomFrame = new THREE.Mesh(new THREE.BoxGeometry(frameW + frameT*2, frameT, frameT), frameMat);
        bottomFrame.position.y = -frameH/2;
        group.add(bottomFrame);

        const pivot = new THREE.Group();
        pivot.position.set(frameW/2 + frameT/2, 0, 0);
        group.add(pivot);
        this.doorPivot = pivot;

        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH - 0.1, 0.1), doorMat);
        doorPanel.position.set(-frameW/2, 0, 0.05);
        pivot.add(doorPanel);

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8), handleMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.set(-frameW + 0.2, 0.1, 0.2);
        pivot.add(handle);

        group.position.set(0, 1.7, -4);
        this.doorGroup = group;
        this.scene.add(this.doorGroup);
        this.openingObjects.push(this.doorGroup);
    }

    startAnimationLoop() {
        const animate = () => {
            if (this.phase === 'done') return;
            this.animFrameId = requestAnimationFrame(animate);
            if (this.rainParticles && this.rainParticles.geometry) {
                const positions = this.rainParticles.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i+1] -= 0.08;
                    if (positions[i+1] < 0) {
                        positions[i+1] = 10;
                        positions[i] = (Math.random() - 0.5) * 20;
                        positions[i+2] = (Math.random() - 0.5) * 20;
                    }
                }
                this.rainParticles.geometry.attributes.position.needsUpdate = true;
            }
        };
        animate();
    }

    // ---------- 门点击 ----------
    onCanvasClick(event) {
        if (this.phase !== 'waitingDoor') return;
        const clientX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
        const clientY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : 0);
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.doorGroup.children, true);
        if (intersects.length > 0) {
            this.phase = 'walking';
            document.getElementById('opening-click-hint').style.display = 'none';
            this.renderer.domElement.removeEventListener('click', this.boundCanvasClick);
            this.startWalking();
        }
    }

    startWalking() {
        this.doorOpenAudio = new Audio('./src/audio/opendoor.mp3');
        this.doorOpenAudio.play().catch(() => {});
        this.rainAudio.pause();
        this.rainAudio = null;
        if (this.rainParticles) this.rainParticles.visible = false;

        if (this.doorPivot) {
            const animateDoor = () => {
                if (this.doorPivot.rotation.y < Math.PI / 2) {
                    this.doorPivot.rotation.y += 0.05;
                    requestAnimationFrame(animateDoor);
                }
            };
            animateDoor();
        }

        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;

        const startPos = this.camera.position.clone();
        const targetPos = new THREE.Vector3(0, 1.7, -3.5);
        const startTime = performance.now();

        setTimeout(() => {
            const overlay = document.getElementById('opening-overlay');
            overlay.style.display = 'flex';
            overlay.style.transition = 'opacity 0.6s';
            overlay.style.opacity = '1';
        }, 1000);

        const walkAnimation = (now) => {
            if (this.phase !== 'walking') return;
            const elapsed = now - startTime;
            const t = Math.min(elapsed / this.walkDuration, 1);
            const sway = Math.sin(elapsed * 0.01) * 0.04;
            const bounce = Math.abs(Math.sin(elapsed * 0.025)) * 0.08;
            this.camera.position.lerpVectors(startPos, targetPos, t);
            this.camera.position.x += sway;
            this.camera.position.y += bounce;
            this.camera.lookAt(0, 1.2, -5);
            if (t < 1) {
                this._walkFrameId = requestAnimationFrame(walkAnimation);
            } else {
                this._walkFrameId = null;
                const overlay = document.getElementById('opening-overlay');
                if (overlay.style.opacity !== '1') {
                    overlay.style.transition = 'none';
                    overlay.style.opacity = '1';
                }
                setTimeout(() => this.transitionToGameScene(), 300);
            }
        };
        this._walkFrameId = requestAnimationFrame(walkAnimation);
    }

    transitionToGameScene() {
        this.openingObjects.forEach(obj => this.scene.remove(obj));
        this.openingObjects = [];

        const namesToShow = [
            'centerSpot', 'ambientLight', 'gunGroup', 'demonGroup',
            'demonHand', 'armConnector', 'demonGlow', 'demonGlow2',
            'leftEye', 'rightEye', 'thirdEye', 'table', 'stain',
            'leftItemGrid', 'rightItemGrid'
        ];
        namesToShow.forEach(name => {
            const obj = this.scene.getObjectByName(name);
            if (obj) obj.visible = true;
        });

        this.camera.position.set(0, 5.2, 10.2);
        this.camera.lookAt(0, 0.5, 0);

        const overlay = document.getElementById('opening-overlay');
        overlay.style.transition = 'opacity 1.2s';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            this.startDemonTalk();
        }, 1200);
    }

    // ---------- 恶魔对话 ----------
    startDemonTalk() {
        this.phase = 'demonTalk';
        if (this._walkFrameId) cancelAnimationFrame(this._walkFrameId);
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;

        this.currentDialogueIndex = 0;
        this.dialogueFinished = false;
        this.waitingForClick = false;
        document.getElementById('demon-speak-ui').style.display = 'block';
        document.getElementById('btn-agree').style.display = 'none';
        this.initTypeSound();
        document.removeEventListener('click', this.boundDocumentClick);
        document.addEventListener('click', this.boundDocumentClick);
        document.addEventListener('touchstart', this.boundDocumentClick);
        this.speakNextLine();
    }

    initTypeSound() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            this.audioCtx = null;
        }
    }
    playTypeSound() {
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.type = 'square';
            osc.frequency.value = 600;
            gain.gain.value = 0.08;
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.03);
        } catch(e) {}
    }

    speakNextLine() {
        if (this.dialogueFinished) return;
        if (this.currentDialogueIndex >= this.dialogues.length) {
            this.dialogueFinished = true;
            document.getElementById('btn-agree').style.display = 'inline-block';
            document.getElementById('btn-agree').onclick = () => this.endDemonTalk();
            document.getElementById('demon-text').innerHTML = '准备好了吗？';
            document.getElementById('demon-text').style.cursor = 'default';
            document.removeEventListener('click', this.boundDocumentClick);
            document.removeEventListener('touchstart', this.boundDocumentClick);
            return;
        }
        const line = this.dialogues[this.currentDialogueIndex];
        this.typeText(line, () => {
            this.waitingForClick = true;
            const demonText = document.getElementById('demon-text');
            demonText.innerHTML += '<br><span style="font-size:0.8rem; color:#aaa;">点击继续</span>';
            demonText.style.cursor = 'pointer';
        });
    }

    typeText(text, callback) {
        const demonText = document.getElementById('demon-text');
        demonText.innerHTML = '';
        let charIndex = 0;
        this.isTyping = true;
        clearInterval(this.typingTimer);
        this.typingTimer = setInterval(() => {
            if (charIndex < text.length) {
                demonText.innerHTML += text[charIndex];
                this.playTypeSound();
                charIndex++;
            } else {
                clearInterval(this.typingTimer);
                this.isTyping = false;
                if (callback) callback();
            }
        }, 35);
    }

    onDocumentClick(event) {
        if (this.phase !== 'demonTalk' || !this.waitingForClick) return;
        event.stopPropagation();
        this.waitingForClick = false;
        document.getElementById('demon-text').style.cursor = 'default';
        this.currentDialogueIndex++;
        this.speakNextLine();
    }

    // ---------- 长按跳过 ----------
    onKeyDown(e) {
        if (e.code === 'Space') {
            if (!this.spaceHoldStart) this.spaceHoldStart = Date.now();
            if (Date.now() - this.spaceHoldStart > this.spaceHoldThreshold) {
                this.skipEntireOpening();
                this.spaceHoldStart = null;
            }
        }
    }
    onKeyUp(e) { if (e.code === 'Space') this.spaceHoldStart = null; }

    onTouchStart(e) {
        if (this.phase === 'done') return;
        this.touchHoldStart = Date.now();
    }
    onTouchEnd(e) {
        if (this.touchHoldStart && Date.now() - this.touchHoldStart > this.spaceHoldThreshold) {
            this.skipEntireOpening();
        }
        this.touchHoldStart = null;
    }

    skipEntireOpening() {
        if (this.phase === 'done') return;
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        if (this._walkFrameId) cancelAnimationFrame(this._walkFrameId);
        clearInterval(this.typingTimer);
        if (this.rainAudio) this.rainAudio.pause();
        if (this.doorOpenAudio) this.doorOpenAudio.pause();
        this.phase = 'done';
        this.openingObjects.forEach(obj => this.scene.remove(obj));
        this.openingObjects = [];

        const namesToShow = [
            'centerSpot', 'ambientLight', 'gunGroup', 'demonGroup',
            'demonHand', 'armConnector', 'demonGlow', 'demonGlow2',
            'leftEye', 'rightEye', 'thirdEye', 'table', 'stain',
            'leftItemGrid', 'rightItemGrid'
        ];
        namesToShow.forEach(name => {
            const obj = this.scene.getObjectByName(name);
            if (obj) obj.visible = true;
        });

        this.camera.position.set(0, 5.2, 10.2);
        this.camera.lookAt(0, 0.5, 0);

        document.getElementById('opening-overlay').style.display = 'none';
        document.getElementById('demon-speak-ui').style.display = 'none';
        document.getElementById('opening-click-hint').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('hud').style.opacity = '1';

        this.cleanup();
        audioMgr.fadeInBGM(3000);
        this.onComplete();
    }

    endDemonTalk() {
        document.getElementById('demon-speak-ui').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('hud').style.opacity = '0';
        document.getElementById('hud').style.transition = 'opacity 1s';
        setTimeout(() => { document.getElementById('hud').style.opacity = '1'; }, 100);
        this.cleanup();
        audioMgr.fadeInBGM(3000);
        this.onComplete();
    }

    cleanup() {
        if (this._walkFrameId) cancelAnimationFrame(this._walkFrameId);
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.renderer.domElement.removeEventListener('click', this.boundCanvasClick);
        document.removeEventListener('click', this.boundDocumentClick);
        document.removeEventListener('touchstart', this.boundDocumentClick);
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        document.removeEventListener('touchstart', this.boundTouchStart);
        document.removeEventListener('touchend', this.boundTouchEnd);
        if (this.rainAudio) this.rainAudio.pause();
        this.openingObjects.forEach(obj => this.scene.remove(obj));
        this.openingObjects = [];
    }
}