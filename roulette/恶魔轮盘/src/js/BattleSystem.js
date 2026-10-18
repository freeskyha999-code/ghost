// ============================================================
// BattleSystem.js —— 纯战斗逻辑核心（完整版）
// ============================================================

class BattleSystem {
    constructor(options = {}) {
        this.maxHp = options.maxHp || 4;
        this.maxItems = options.maxItems || 8;
        this.playerHp = this.maxHp;
        this.enemyHp = this.maxHp;
        this.shells = options.shells ? [...options.shells] : [];
        this.turn = 'host';
        this.nextRoundTurn = options.firstTurn || 'host';
        this.playerItems = [];
        this.enemyItems = [];
        this.playerHandcuffed = false;
        this.enemyHandcuffed = false;
        this.gunDamage = 1;
        this.gameOver = false;
        this.wins = 0;
        this.losses = 0;
        this.knownNextShell = null;
        this._emptyMagSelfShoot = false;
        this._lastTurnBeforeEmpty = null;

        // 槽位分配
        this.playerSlots = Array(8).fill(false);
        this.enemySlots = Array(8).fill(false);

        // 新道具状态
        this.playerShocked = false;
        this.enemyShocked = false;
        this.playerPacemaker = false;
        this.enemyPacemaker = false;

        this.itemPool = [
            { id: 'check_shell',  name: '检查弹膛' },
            { id: 'beer',         name: '啤酒' },
            { id: 'cigarette',    name: '香烟' },
            { id: 'handcuffs',    name: '手铐' },
            { id: 'saw',          name: '手锯' },
            { id: 'morphine',     name: '麻药' },
            { id: 'taser',        name: '电击器' },
            { id: 'defibrillator', name: '心脏起搏器' }
        ];
    }

    countLive() { return this.shells.filter(s => s === 1).length; }
    countBlank() { return this.shells.filter(s => s === 0).length; }
    totalShells() { return this.shells.length; }

    generateShells(live, blank) {
        const arr = [];
        for (let i = 0; i < live; i++) arr.push(1);
        for (let i = 0; i < blank; i++) arr.push(0);
        this._shuffle(arr);
        this.shells = arr;
        this.knownNextShell = null;
        return { live, blank };
    }

    randomShells(minLive = 1, maxLive = 4, minBlank = 1, maxBlank = 4) {
        const live = Math.floor(Math.random() * (maxLive - minLive + 1)) + minLive;
        const blank = Math.floor(Math.random() * (maxBlank - minBlank + 1)) + minBlank;
        return this.generateShells(live, blank);
    }

    addPlayerItem(item) {
        const slot = this.playerSlots.indexOf(false);
        if (slot !== -1 && this.playerItems.length < this.maxItems) {
            item.slotIndex = slot;
            this.playerSlots[slot] = true;
            this.playerItems.push(item);
            return true;
        }
        return false;
    }
    addEnemyItem(item) {
        const slot = this.enemySlots.indexOf(false);
        if (slot !== -1 && this.enemyItems.length < this.maxItems) {
            item.slotIndex = slot;
            this.enemySlots[slot] = true;
            this.enemyItems.push(item);
            return true;
        }
        return false;
    }
    removePlayerItem(index) {
        if (index >= 0 && index < this.playerItems.length) {
            const item = this.playerItems.splice(index, 1)[0];
            if (item.slotIndex !== undefined) this.playerSlots[item.slotIndex] = false;
            return item;
        }
        return null;
    }
    removeEnemyItem(index) {
        if (index >= 0 && index < this.enemyItems.length) {
            const item = this.enemyItems.splice(index, 1)[0];
            if (item.slotIndex !== undefined) this.enemySlots[item.slotIndex] = false;
            return item;
        }
        return null;
    }

    useItem(itemId, context = {}) {
        const actor = context.actor || 'host';
        const isSelf = (actor === 'host');
        if (isSelf && this.playerShocked) return { success: false, message: '被电击，无法使用道具' };
        if (!isSelf && this.enemyShocked) return { success: false, message: '被电击，无法使用道具' };

        const itemList = isSelf ? this.playerItems : this.enemyItems;
        let idx;
        if (context.itemIndex !== undefined) {
            idx = context.itemIndex;
        } else {
            idx = itemList.findIndex(it => it.id === itemId);
        }
        if (idx === -1 || idx >= itemList.length) return { success: false, message: '没有该道具' };
        const item = (isSelf ? this.removePlayerItem(idx) : this.removeEnemyItem(idx));
        let effect = {}, message = '';
        switch (itemId) {
            case 'check_shell':
                effect.knownShell = this.shells[0];
                this.knownNextShell = effect.knownShell;
                message = '查看弹膛';
                break;
            case 'beer':
                effect.ejected = this._popShell();
                this.knownNextShell = null;
                message = `退弹: ${effect.ejected === 1 ? '实弹' : '空包'}`;
                break;
            case 'cigarette':
                const hpKey = isSelf ? 'playerHp' : 'enemyHp';
                this[hpKey] = Math.min(6, this[hpKey] + 1);
                effect.healed = 1;
                message = '恢复生命';
                break;
            case 'handcuffs':
                const cuffKey = isSelf ? 'enemyHandcuffed' : 'playerHandcuffed';
                this[cuffKey] = true;
                message = '锁住对方';
                break;
            case 'saw':
                this.gunDamage = 2;
                effect.damageUp = true;
                message = '枪管锯短';
                break;
            case 'morphine': {
                const targetList = isSelf ? this.enemyItems : this.playerItems;
                if (targetList.length === 0) { message = '对方无道具'; }
                else {
                    const stealIdx = context.stealIndex !== undefined ? context.stealIndex : Math.floor(Math.random() * targetList.length);
                    const stolen = (isSelf ? this.removeEnemyItem(stealIdx) : this.removePlayerItem(stealIdx));
                    if (stolen) {
                        const mySlots = isSelf ? this.playerSlots : this.enemySlots;
                        const newSlot = mySlots.indexOf(false);
                        if (newSlot !== -1) { stolen.slotIndex = newSlot; mySlots[newSlot] = true; }
                        (isSelf ? this.playerItems : this.enemyItems).push(stolen);
                        effect.stolen = stolen;
                        effect.reorderNeeded = true;
                        message = `偷取 [${stolen.name}]`;
                    } else { message = '偷取失败'; }
                }
                break;
            }
            case 'taser':
                const shockKey = isSelf ? 'enemyShocked' : 'playerShocked';
                this[shockKey] = true;
                effect.shocked = true;
                message = '电击对方，对方下回合无法使用道具';
                break;
            case 'defibrillator':
                const paceKey = isSelf ? 'playerPacemaker' : 'enemyPacemaker';
                this[paceKey] = true;
                effect.pacemaker = true;
                message = '获得心脏起搏器，免死一次';
                break;
        }
        return { success: true, message, effect, item };
    }

    shoot(target, actor = 'host') {
        if (this.shells.length === 0) return { error: '空膛' };
        const live = this._popShell() === 1;
        this.knownNextShell = null;
        let hitTarget = null, damage = 0;
        if (live) {
            hitTarget = (target === 'enemy') ? ((actor === 'host') ? 'client' : 'host') : actor;
            damage = this.gunDamage;
            if (hitTarget === 'host') {
                if (this.playerPacemaker && this.playerHp - damage <= 0) {
                    this.playerPacemaker = false;
                    return { live, hitTarget, damage: 0, pacemakerSaved: true };
                }
                this.playerHp -= damage;
            } else {
                if (this.enemyPacemaker && this.enemyHp - damage <= 0) {
                    this.enemyPacemaker = false;
                    return { live, hitTarget, damage: 0, pacemakerSaved: true };
                }
                this.enemyHp -= damage;
            }
        }
        this.gunDamage = 1;
        return { live, hitTarget, damage };
    }

    advanceTurn(previousTurn, selfShotBlank) {
        // 清除上一回合玩家的电击状态（电击效果持续到被电玩家的回合结束）
        if (previousTurn === 'host') this.playerShocked = false;
        else this.enemyShocked = false;

        let next = (previousTurn === 'host') ? 'client' : 'host';
        if (selfShotBlank) {
            next = previousTurn;
            if (this.shells.length === 0) {
                this._emptyMagSelfShoot = true;
                this._lastTurnBeforeEmpty = previousTurn;
            }
        }
        if (next === 'client' && this.enemyHandcuffed) {
            this.enemyHandcuffed = false;
            next = 'host';
        } else if (next === 'host' && this.playerHandcuffed) {
            this.playerHandcuffed = false;
            next = 'client';
        }
        this.turn = next;
        this.nextRoundTurn = next;
        return this.turn;
    }

    prepareNewRound() {
        if (this.gameOver) return;
        this.turn = 'animating';
        this.gunDamage = 1;
        this.playerHandcuffed = false;
        this.enemyHandcuffed = false;
        this.playerShocked = false;
        this.enemyShocked = false;
        this.knownNextShell = null;
        if (this._emptyMagSelfShoot) {
            this.nextRoundTurn = this._lastTurnBeforeEmpty || 'client';
            this._emptyMagSelfShoot = false;
            this._lastTurnBeforeEmpty = null;
        } else {
            this.nextRoundTurn = Math.random() < 0.5 ? 'host' : 'client';
        }
    }

    startRoundAfterAnimation() {
        this.turn = this.nextRoundTurn || 'host';
        if (this.turn === 'animating') this.turn = 'host';
        return this.turn;
    }

    isMagEmpty() { return this.shells.length === 0; }

    checkWinCondition() {
        if (this.playerHp <= 0) return { winner: 'enemy' };
        if (this.enemyHp <= 0) return { winner: 'player' };
        return null;
    }

    settleRound() {
        const r = this.checkWinCondition();
        if (!r) return null;
        if (r.winner === 'player') this.wins++;
        else this.losses++;
        const over = (this.wins >= 2 || this.losses >= 2);
        if (over) this.gameOver = true;
        return { winner: r.winner, matchOver: over };
    }

    // 检查胜负
    checkWin() {
        return this.settleRound();
    }

    // AI是否应该行动
    shouldAIAct() {
        return this.turn === 'client' && !this.gameOver;
    }

    // 计时器超时返回应该执行的动作
    getTimeoutAction(mode, role) {
        if (mode === 'sp' && this.turn === 'client') return { type: 'ai' };
        const isMyTurn = (mode === 'sp' && this.turn === 'host') || (mode === 'mp' && this.turn === role);
        if (isMyTurn) return { type: 'shoot', target: 'enemy' };
        return null;
    }

    resetForNextRound() {
        this.playerHp = this.maxHp;
        this.enemyHp = this.maxHp;
        this.playerItems = [];
        this.enemyItems = [];
        this.playerHandcuffed = false;
        this.enemyHandcuffed = false;
        this.playerShocked = false;
        this.enemyShocked = false;
        this.playerPacemaker = false;
        this.enemyPacemaker = false;
        this.gunDamage = 1;
        this.knownNextShell = null;
        this.turn = 'host';
        this.nextRoundTurn = 'host';
        this.playerSlots = Array(8).fill(false);
        this.enemySlots = Array(8).fill(false);
    }

    resetMatch() {
        this.resetForNextRound();
        this.wins = 0;
        this.losses = 0;
        this.gameOver = false;
    }

    _popShell() { return this.shells.shift(); }
    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // ---------- 道具分发 ----------
    distributeItems(settings) {
        const maxPerSide = this.maxItems;
        const maxPlayerNew = Math.max(0, maxPerSide - this.playerItems.length);
        const maxEnemyNew = Math.max(0, maxPerSide - this.enemyItems.length);
        const numPlayerNew = Math.min(2 + Math.floor(Math.random() * 2), maxPlayerNew);
        const numEnemyNew = Math.min(2 + Math.floor(Math.random() * 2), maxEnemyNew);
        const pickItem = (isPlayer) => {
            const hp = isPlayer ? this.playerHp : this.enemyHp;
            const alreadyHas = isPlayer ? this.playerPacemaker : this.enemyPacemaker;
            const heldDefib = (isPlayer ? this.playerItems : this.enemyItems).some(i => i.id === 'defibrillator');
            const pDefib = hp <= 1 ? 0.30 : hp <= 2 ? 0.18 : 0.10;
            if (!alreadyHas && !heldDefib && Math.random() < pDefib) { const dd = this.itemPool.find(i => i.id === 'defibrillator'); if (dd) return { ...dd }; }
            for (let attempt = 0; attempt < 20; attempt++) {
                const c = this.itemPool[Math.floor(Math.random() * this.itemPool.length)];
                if (c.id === 'defibrillator') {
                    if (alreadyHas) continue;
                    const chance = 0;
                    if (Math.random() > chance) continue;
                }
                return { ...c };
            }
            return { ...this.itemPool[Math.floor(Math.random() * this.itemPool.length)] };
        };
        const newPlayerItems = [];
        const newEnemyItems = [];
        for (let i = 0; i < numPlayerNew; i++) {
            const item = pickItem(true);
            if (item.id === 'defibrillator') {
                this.playerPacemaker = true;
                newPlayerItems.push(item);
            } else {
                this.addPlayerItem(item);
                newPlayerItems.push(item);
            }
        }
        for (let i = 0; i < numEnemyNew; i++) {
            const item = pickItem(false);
            if (item.id === 'defibrillator') {
                this.enemyPacemaker = true;
                newEnemyItems.push(item);
            } else {
                this.addEnemyItem(item);
                newEnemyItems.push(item);
            }
        }
        return { newPlayerItems, newEnemyItems };
    }

    // ---------- 恶魔 AI 决策 ----------
    decideAIAction() {
        const knownShell = this.knownNextShell;
        const items = this.enemyItems;
        const liveCount = this.countLive();
        const total = this.totalShells();
        const liveRatio = total > 0 ? liveCount / total : 0;

        // 被电击时禁用道具，直接开枪
        if (this.enemyShocked) {
            if (knownShell === 0) return { type: 'shoot', target: 'self' };
            if (knownShell === 1) return { type: 'shoot', target: 'enemy' };
            // 不确定时：实弹概率低才射自己赌空包，否则射对方
            return { type: 'shoot', target: liveRatio <= 0.3 ? 'self' : 'enemy' };
        }

        if (knownShell === 1 && this.playerHp <= this.gunDamage) return { type: 'shoot', target: 'enemy' };
        if (knownShell === null && this.playerHp <= this.gunDamage && liveRatio >= 0.5) return { type: 'shoot', target: 'enemy' };

        const cigIdx = items.findIndex(i => i.id === 'cigarette');
        if (cigIdx !== -1 && this.enemyHp < 4) return { type: 'useItem', detail: cigIdx };

        const checkIdx = items.findIndex(i => i.id === 'check_shell');
        if (checkIdx !== -1 && knownShell === null) return { type: 'useItem', detail: checkIdx };

        const cuffIdx = items.findIndex(i => i.id === 'handcuffs');
        if (cuffIdx !== -1 && !this.playerHandcuffed) return { type: 'useItem', detail: cuffIdx };

        const defibIdx = items.findIndex(i => i.id === 'defibrillator');
        if (defibIdx !== -1 && !this.enemyPacemaker) return { type: 'useItem', detail: defibIdx };

        const taserIdx = items.findIndex(i => i.id === 'taser');
        if (taserIdx !== -1 && !this.playerShocked) return { type: 'useItem', detail: taserIdx };

        if (knownShell === 0) {
            const sawIdx = items.findIndex(i => i.id === 'saw');
            if (sawIdx !== -1 && this.gunDamage === 1) return { type: 'useItem', detail: sawIdx };
            return { type: 'shoot', target: 'self' };
        }

        if (knownShell === 1) {
            const sawIdx = items.findIndex(i => i.id === 'saw');
            if (sawIdx !== -1 && this.gunDamage === 1) return { type: 'useItem', detail: sawIdx };
            return { type: 'shoot', target: 'enemy' };
        }

        const beerIdx = items.findIndex(i => i.id === 'beer');
        if (beerIdx !== -1) {
            if (knownShell === 1 && this.enemyHp <= this.gunDamage && this.playerHp > this.gunDamage) {
                return { type: 'useItem', detail: beerIdx };
            }
            if (knownShell === null && liveRatio >= 0.6 && this.enemyHp <= 2) {
                return { type: 'useItem', detail: beerIdx };
            }
        }

        const morphIdx = items.findIndex(i => i.id === 'morphine');
        if (morphIdx !== -1 && this.playerItems.length > 2) {
            const stealIndex = Math.floor(Math.random() * this.playerItems.length);
            return { type: 'useItem', detail: { index: morphIdx, stealIndex } };
        }

        if (this.enemyHp <= this.gunDamage && liveRatio > 0.3) return { type: 'shoot', target: 'enemy' };
        // 不确定子弹时：实弹概率低才射自己赌空包，否则射对方
        return { type: 'shoot', target: liveRatio <= 0.35 ? 'self' : 'enemy' };
    }

    // ---------- 恶魔台词 ----------
    static DEMON_LINES = {
        intro: [
            "啊，又一局……你确定要和我玩？",
            "灯光昏暗，很好，我就喜欢这种感觉。",
            "子弹已经上膛，希望你的心脏也准备好了。"
        ],
        playerCritical: [
            "你的眼睛开始失焦了……",
            "就快结束了，坚持住哦。",
            "最后一发，为你送行。",
            "我不会让你痛苦太久的。",
            "死亡是冰冷的，就像我的手。"
        ],
        playerLowHP: [
            "你的生命在流逝……我能闻到铁锈的味道。",
            "心跳越来越慢了，不是吗？",
            "血液正在变冷，这间地下室很适合你。",
            "你还能撑几轮？我在计数。",
            "疼痛只是幻觉……但死亡是真实的。",
            "脸色发白了吧？别担心，很快就结束了。",
            "你的双手在发抖，枪都要拿不稳了。"
        ],
        demonHighHP: [
            "我的躯体比你想象的要坚韧得多。",
            "你伤不了我，就像伤不了影子。",
            "这些子弹……不过是在挠痒。",
            "你以为那点伤害能起作用？可笑。",
            "我的生命力远在你之上。"
        ],
        demonLowHP: [
            "有点疼……但还不够。",
            "你想让我倒下？还早得很。",
            "这点伤只会让我更专注。",
            "就算只剩下一个弹壳，我也会赢。",
            "你看到了我的血？那又怎样。"
        ],
        playerMissed: [
            "空包弹。运气不在你这边。",
            "浪费了一次机会，真可惜。",
            "子弹不会总是乖乖听话。",
            "哈！空膛！这种失误会要了你的命。",
            "你刚刚错过了活命的机会。"
        ],
        demonHitPlayer: [
            "子弹穿过血肉的声音……美妙。",
            "每一次冲击都会留下印记。",
            "你的身体会记住这一刻。",
            "血花飞溅的样子，真是艺术品。",
            "痛吗？那是你活着的证明。",
            "感觉如何？下一枪会更痛。"
        ],
        demonUsedItem: [
            "让我调整一下策略……",
            "工具要用在正确的时机。",
            "我也懂得利用手边的资源。",
            "你以为只有你会用道具？",
            "这个小玩意儿刚好派上用场。"
        ],
        manyLiveShells: [
            "弹膛里装满了惊喜……",
            "赔率正在升高，你感觉到了吗？",
            "下一发会是什么？我也在期待。",
            "实弹比空包多，真是刺激。",
            "空气中弥漫着火药味……还有恐惧。"
        ],
        knownLiveShell: [
            "哦……下一发可是真家伙。",
            "我看到了火与血。",
            "这一枪，你躲不掉的。",
            "实弹在膛，你的时间不多了。",
            "我的回合，子弹会唱歌。"
        ],
        knownBlankShell: [
            "嗯……原来是空的。",
            "这一发什么都不会发生，别紧张。",
            "空包弹，就像你的勇气。",
            "看来枪里装的是谎言。",
            "下一次机会，我会好好利用。"
        ],
        playerUsedItem: [
            "哦？用上了小玩具？",
            "道具救不了你的命。",
            "拖延时间而已，结局不变。",
            "你手里的东西，能改变什么？"
        ],
        demonCuffedPlayer: [
            "锁住了？真遗憾，回合跳过。",
            "现在该我连射两发了。",
            "你动不了，时间在我这边。"
        ],
        playerCuffedDemon: [
            "啧……被摆了一道。",
            "你觉得这样就能阻止我？",
            "锁链迟早会解开。"
        ],
        demonEjectedShell: [
            "这颗弹壳，我不喜欢。",
            "扔掉一个不确定因素。",
            "清扫弹膛，提高胜率。"
        ],
        demonSmoked: [
            "啊……烟雾让伤口不再疼痛。",
            "尼古丁和血液混合的味道。",
            "恢复一点生命力，继续游戏。"
        ],
        demonSawed: [
            "枪管锯短，伤害翻倍。",
            "下一发实弹会把你撕碎。",
            "凶器改造完成，血会更浓。"
        ],
        demonStoleItem: [
            "这个归我了。",
            "你的东西就是我的东西。",
            "妙手空空，多谢馈赠。",
            "你的道具，我来使用。"
        ],
        fewShellsLeft: [
            "弹膛快见底了，紧张吗？",
            "剩下的子弹不多了，猜猜哪颗是实弹？",
            "越是接近尾声，越要冷静。"
        ],
        generic: [
            "这场游戏的结局早已注定。",
            "你以为你在掌控？天真。",
            "地下室的回声不会忘记失败者。",
            "冷静下来……恐惧会让你犯错。",
            "每一步都在我的计算之中。",
            "我享受你的每一丝犹豫。",
            "来吧，做出选择。无论哪种，都是死路。",
            "这间屋子记录了多少灵魂的哀嚎，你想成为下一个吗？",
            "你的双眼透露了你的想法，我全知道。"
        ],
        demonWins: [
            "游戏结束。我说过结局早已注定。",
            "又一条灵魂留在这地下室里。",
            "你的挣扎毫无意义，不过很精彩。",
            "安息吧，我会记住你的。",
            "下一次，换个更强的对手来。"
        ]
    };

    pickDemonLine(gameState) {
        const candidates = [];
        const pHp = gameState.playerHp;
        const eHp = gameState.enemyHp;
        const shells = gameState.shells || [];
        const liveCount = shells.filter(s => s === 1).length;
        const totalShells = shells.length;
        const ctx = gameState.lastContext;

        switch (ctx) {
            case 'player_missed':       candidates.push(...BattleSystem.DEMON_LINES.playerMissed); break;
            case 'demon_hit':           candidates.push(...BattleSystem.DEMON_LINES.demonHitPlayer); break;
            case 'demon_item':          candidates.push(...BattleSystem.DEMON_LINES.demonUsedItem); break;
            case 'player_cuffed_demon': candidates.push(...BattleSystem.DEMON_LINES.playerCuffedDemon); break;
            case 'demon_cuffed_player': candidates.push(...BattleSystem.DEMON_LINES.demonCuffedPlayer); break;
            case 'demon_ejected':       candidates.push(...BattleSystem.DEMON_LINES.demonEjectedShell); break;
            case 'demon_smoked':        candidates.push(...BattleSystem.DEMON_LINES.demonSmoked); break;
            case 'demon_sawed':         candidates.push(...BattleSystem.DEMON_LINES.demonSawed); break;
            case 'demon_stole':         candidates.push(...BattleSystem.DEMON_LINES.demonStoleItem); break;
            case 'player_used_item':    candidates.push(...BattleSystem.DEMON_LINES.playerUsedItem); break;
            case 'demon_known_live':    candidates.push(...BattleSystem.DEMON_LINES.knownLiveShell); break;
            case 'demon_known_blank':   candidates.push(...BattleSystem.DEMON_LINES.knownBlankShell); break;
            case 'demon_win':           candidates.push(...BattleSystem.DEMON_LINES.demonWins); break;
        }

        if (pHp <= 1) candidates.push(...BattleSystem.DEMON_LINES.playerCritical);
        else if (pHp <= 2) candidates.push(...BattleSystem.DEMON_LINES.playerLowHP);

        if (eHp >= 5) candidates.push(...BattleSystem.DEMON_LINES.demonHighHP);
        else if (eHp <= 2) candidates.push(...BattleSystem.DEMON_LINES.demonLowHP);

        if (liveCount >= 3 && totalShells >= 4) candidates.push(...BattleSystem.DEMON_LINES.manyLiveShells);
        if (totalShells <= 2 && totalShells > 0) candidates.push(...BattleSystem.DEMON_LINES.fewShellsLeft);

        if (candidates.length === 0) candidates.push(...BattleSystem.DEMON_LINES.generic);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
}