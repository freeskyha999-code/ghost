// ============================================================
// itemManager.js —— 道具管理
// ============================================================

// ---------- 道具格子位置计算 ----------
function getItemSlotPosition(index, side) {
    const gx = index < 4 ? -2.2 : 2.2;
    const gz = side === 'player' ? 4.5 : -5.5;
    const subIdx = index % 4;
    const col = subIdx % 2 === 0 ? -0.5 : 0.5;
    const row = subIdx < 2 ? -0.5 : 0.5;
    return new THREE.Vector3(gx + col, 0.55, gz + row);
}

class ItemManager {
    /**
     * @param {SceneManager} sceneManager - 场景管理器实例
     */
    constructor(sceneManager) {
        this.scene = sceneManager;
    }

    /**
     * 从箱子里飞出道具到指定格子
     */
    spawnItemsSequentially(newPlayerItems, newEnemyItems, allPlayerItems, allEnemyItems, onComplete) {
        const cratePos = new THREE.Vector3(-1.5, 0.7, 1.2);
        const newItems = [
            ...newPlayerItems.map((item, i) => ({ ...item, side: 'player', indexInNew: i })),
            ...newEnemyItems.map((item, i) => ({ ...item, side: 'enemy', indexInNew: i }))
        ];
        if (newItems.length === 0) { if (onComplete) onComplete(); return; }

        let index = 0;
        const processNext = () => {
            if (index >= newItems.length) { if (onComplete) onComplete(); return; }
            const itemData = newItems[index];
            const model = this.scene.createItemModelById(itemData.id);
            model.position.copy(cratePos);
            this.scene.scene.add(model);
            audioMgr.play('itemWhoosh');

            const side = itemData.side;
            const allItems = side === 'player' ? allPlayerItems : allEnemyItems;
            const targetIndex = allItems.findIndex(it => it.id === itemData.id && it === allItems[allItems.indexOf(it)]);
            const targetPos = getItemSlotPosition(targetIndex, side);
            model.userData.itemData = { id: itemData.id, side: side, index: targetIndex };

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
                    audioMgr.play(Math.random() < 0.5 ? 'itemFull' : 'itemFull1');
                    this.scene.addInteractiveModel(model);
                    index++;
                    setTimeout(processNext, 200);
                }
            };
            requestAnimationFrame(anim);
        };
        processNext();
    }

    /**
     * 重新渲染桌面上所有道具
     */
    renderTableItems(playerItems, enemyItems) {
        if (!playerItems) playerItems = [];
        if (!enemyItems) enemyItems = [];
        this.scene.interactiveObjects.forEach(obj => this.scene.applyHighlight(obj, false));
        this.scene.interactiveObjects = []; this.scene.highlightMaterialMap.clear();
        this.scene.tooltipSprites.forEach((sprite, model) => this.scene.scene.remove(sprite));
        this.scene.tooltipSprites.clear();
        this.scene.tableItemMeshes.forEach(mesh => { try { this.scene.scene.remove(mesh); } catch(e) {} });
        this.scene.tableItemMeshes = [];

        playerItems.forEach((item, i) => {
            try {
                const model = this.scene.createItemModelById(item.id);
                if (model) {
                    model.position.copy(getItemSlotPosition(i, 'player'));
                    model.userData.itemData = { id: item.id, side: 'player', index: i };
                    this.scene.scene.add(model); this.scene.addInteractiveModel(model);
                }
            } catch(e) {}
        });

        enemyItems.forEach((item, i) => {
            try {
                const model = this.scene.createItemModelById(item.id);
                if (model) {
                    model.position.copy(getItemSlotPosition(i, 'enemy'));
                    model.userData.itemData = { id: item.id, side: 'enemy', index: i };
                    this.scene.scene.add(model); this.scene.addInteractiveModel(model);
                }
            } catch(e) {}
        });
    }

    /**
     * 处理点击道具模型（只有玩家自己的道具可点）
     */
    handleItemModelClick(itemData) {
        if (this.scene.itemInteractionEnabled && window._gameEngine) {
            window._gameEngine.handleItemModelClick(itemData);
        }
    }

    /**
     * 显示偷窃菜单（麻药）
     */
    showStealMenu(targetList, callback) {
        const stealUI = document.getElementById('steal-ui');
        const stealItems = document.getElementById('steal-items');
        stealItems.innerHTML = '';
        stealUI.style.display = 'flex';
        targetList.forEach((item, idx) => {
            const btn = document.createElement('button');
            btn.className = 'item-btn';
            btn.style.padding = '10px 15px';
            btn.style.fontSize = '1rem';
            btn.innerText = item.name;
            btn.onmouseenter = () => audioMgr.play('uiHover');
            btn.onclick = () => { audioMgr.play('uiClick'); stealUI.style.display = 'none'; callback(idx); };
            stealItems.appendChild(btn);
        });
        document.getElementById('btn-cancel-steal').onclick = () => { audioMgr.play('uiClick'); stealUI.style.display = 'none'; };
    }
}