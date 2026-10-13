// ============================================================
// uiManager.js —— UI 管理器
// ============================================================

class UIManager {
    /**
     * @param {object} elements - 需要的 DOM 元素集合
     * @param {HTMLElement} elements.msg - 消息中心
     * @param {HTMLElement} elements.timer - 倒计时显示
     * @param {HTMLElement} elements.enemyBubble - 敌方气泡
     * @param {HTMLElement} elements.playerBubble - 玩家气泡
     * @param {HTMLElement} elements.chatLog - 聊天记录
     * @param {HTMLElement} elements.chatInput - 聊天输入
     * @param {HTMLElement} elements.bulletCounter - 子弹计数器
     * @param {HTMLElement} elements.turnIndicator - 回合指示器
     * @param {HTMLElement} elements.score - 比分显示
     * @param {HTMLElement} elements.overlay - 伤害覆盖层
     * @param {HTMLElement} elements.blood - 血液效果
     * @param {HTMLElement} elements.opponentNameDisplay - 对手名字显示
     * @param {object} gameContext - 游戏上下文（动态获取，避免直接依赖 state）
     */
    constructor(elements, gameContext) {
        this.elements = elements;
        this.gameContext = gameContext;
        this.bubbleTimeouts = {};
    }

    // 显示消息
    showMessage(text, dur = 2000, logImportant = false) {
        const { isRemote, opponentName } = this.gameContext;
        let displayText = text;
        if (isRemote) displayText = displayText.replace(/恶魔/g, opponentName);
        this.elements.msg.innerText = displayText;
        this.elements.msg.classList.add('msg-active');
        this.appendChatLog(displayText, logImportant ? 'log-important' : 'log-sys');
        if (dur > 0) {
            setTimeout(() => {
                if (this.elements.msg.innerText === displayText) {
                    this.elements.msg.classList.remove('msg-active');
                }
            }, dur);
        }
    }

    // 更新回合指示器
    updateTurnIndicator(turn, mode, isRemote, role, opponentName) {
        if (turn === 'animating') {
            this.elements.turnIndicator.innerText = '...';
        } else if ((mode === 'sp' && turn === 'host') || (isRemote && turn === role)) {
            this.elements.turnIndicator.innerText = '你的回合';
        } else {
            this.elements.turnIndicator.innerText = opponentName + '回合';
        }
    }

    // 更新比分显示
    updateScoreDisplay(wins, losses) {
        this.elements.score.innerText = `${wins} - ${losses}`;
    }

    // 气泡弹出
    spawnBubblePopup(side, text) {
        const { playerName, opponentName } = this.gameContext;
        const bubble = side === 'player' ? this.elements.playerBubble : this.elements.enemyBubble;
        bubble.innerText = text;
        bubble.classList.add('bubble-active');
        const key = side;
        if (this.bubbleTimeouts[key]) clearTimeout(this.bubbleTimeouts[key]);
        this.bubbleTimeouts[key] = setTimeout(() => {
            bubble.classList.remove('bubble-active');
        }, 3000);
        const logClass = side === 'player' ? 'log-taunt-player' : 'log-taunt-enemy';
        const speaker = side === 'player' ? `${playerName}: ` : `${opponentName}: `;
        this.appendChatLog(speaker + text, logClass);
    }

    // 聊天记录
    appendChatLog(text, styleClass = 'log-sys') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${styleClass}`;
        entry.innerText = text;
        this.elements.chatLog.appendChild(entry);
        this.elements.chatLog.scrollTop = this.elements.chatLog.scrollHeight;
    }

    // 道具获得提示
    spawnItemToasts(list) {
        let delay = 0;
        list.forEach(name => {
            setTimeout(() => {
                const toast = document.createElement('div');
                toast.className = 'item-toast';
                toast.innerText = `+ ${name}`;
                document.getElementById('item-toast-container').appendChild(toast);
                setTimeout(() => toast.remove(), 1500);
            }, delay);
            delay += 350;
        });
    }

    // 伤害震动效果
    triggerShake() {
        this.elements.overlay.style.opacity = 1;
        this.elements.blood.style.opacity = 1;
        document.body.style.transform = "translate(12px,12px)";
        setTimeout(() => {
            document.body.style.transform = "translate(-12px,-12px)";
            setTimeout(() => {
                document.body.style.transform = "none";
                this.elements.overlay.style.opacity = 0;
                setTimeout(() => { this.elements.blood.style.opacity = 0; }, 400);
            }, 50);
        }, 50);
    }

    // 更新整个 HUD
    updateUI(state, uiElements, scene, mode, isRemote, role, opponentName, timerCallback, itemInteractionCallback) {
        // 刷新血量
        document.getElementById('player-hp').innerText = state.playerHp;
        document.getElementById('enemy-hp').innerText = state.enemyHp;
        // 子弹计数器
        this.elements.bulletCounter.innerHTML = '';
        for (let i = 0; i < state.shells.length; i++) {
            const rect = document.createElement('div');
            rect.className = 'bullet-rect';
            this.elements.bulletCounter.appendChild(rect);
        }
        // 恶魔手
        if (isRemote) {
            scene.setDemonHandVisible(false);
            scene.setDemonHandReaching(false);
        } else {
            scene.setDemonHandVisible(true);
            scene.setDemonHandReaching(state.turn === 'client');
            scene.setDemonHp(state.enemyHp);
        }
        // 是否显示射击按钮
        const isMyTurn = (mode === 'sp' && state.turn === 'host') || (isRemote && state.turn === role);
        document.getElementById('gun-actions').style.display = isMyTurn ? 'flex' : 'none';
        if (itemInteractionCallback) itemInteractionCallback(isMyTurn);
        // 更新回合指示器
        this.updateTurnIndicator(state.turn, mode, isRemote, role, opponentName);
        // 重新启动计时器
        if (timerCallback) timerCallback();
    }
}