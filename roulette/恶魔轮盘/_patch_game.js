const fs = require('fs');
const path = require('path');
const root = 'E:/game/恶魔轮盘';
const p = root + '/src/js/game.js';
fs.copyFileSync(p, p + '.bak');
let s = fs.readFileSync(p, 'utf8');
const crlf = s.includes('\r\n');
if (crlf) s = s.replace(/\r\n/g, '\n');
const blk = (n) => fs.readFileSync(root + '/' + n, 'utf8').replace(/\r\n/g, '\n');

function rep(a, b, count = 1) {
    const n = s.split(a).length - 1;
    if (n !== count) throw new Error('匹配次数 ' + n + ' (期望 ' + count + '): ' + a.slice(0, 90));
    s = s.split(a).join(b);
}
function sliceRep(startMarker, endMarker, text) {
    const i = s.indexOf(startMarker);
    if (i < 0) throw new Error('找不到起点: ' + startMarker);
    const j = s.indexOf(endMarker, i + startMarker.length);
    if (j < 0) throw new Error('找不到终点: ' + endMarker);
    s = s.slice(0, i) + text + s.slice(j);
}
function lineRep(startMarker, text) {
    const i = s.indexOf(startMarker);
    if (i < 0) throw new Error('找不到行: ' + startMarker);
    const j = s.indexOf('\n', i);
    s = s.slice(0, i) + text + s.slice(j);
}

// 1. 心跳音频文件名拼写（实际文件是 hartbeat.mp3）
rep("heartbeat: new Audio('./src/audio/heartbeat.mp3')", "heartbeat: new Audio('./src/audio/hartbeat.mp3')");

// 2. 场景：摄像机抖动 + 新枪声/枪口火光
sliceRep('    shootEffect() {', '    gunClickEffect() {', blk('_blk_shoot.txt'));
rep('    animate() {\n', blk('_blk_shake.txt') + '    animate() {\n');
rep('        this.renderer.render(this.scene, this.camera);\n    }\n}', '        this._renderWithShake();\n    }\n}');

// 3. 引擎构造：同步状态字段 + 看门狗
rep("this._eventsBound = false;\n        this._roundSafetyTimer = null;",
    "this._eventsBound = false;\n        this._roundSafetyTimer = null;\n        this._evQueue = []; this._evBusy = false; this._evBusySince = 0; this._pendingReq = false; this._pendingSince = 0; this._animSince = 0; this._lastBeat = 0;");
rep("        // 延迟一帧启动游戏，确保所有初始化",
    "        if (this.isRemote) this._netWatchTimer = setInterval(() => this._netWatchdog(), 1000);\n        // 延迟一帧启动游戏，确保所有初始化");

// 4. 旧的 applyForceSync / broadcastStateSync 先删除，再插入新的消息分发 + 同步机制
sliceRep('    applyForceSync(stateData) {', '\n}\n\n// ---------- 启动 ----------', '');
sliceRep('    handleServerMessage(data) {', '    updateOpponentNameDisplay()', blk('_blk_net.txt'));

// 5. 回合归属统一用"本机视角"
const myTurnExpr = "(this.mode === 'sp' && this.battle.turn === 'host') || (this.isRemote && this.battle.turn === this.role)";
const cnt = s.split(myTurnExpr).length - 1;
if (cnt < 3) throw new Error('isMyTurn 表达式只匹配到 ' + cnt);
s = s.split(myTurnExpr).join('this._isMyTurn()');
console.log('isMyTurn 替换处数:', cnt);
rep('this.battle.getTimeoutAction(this.mode, this.role)', "this.battle.getTimeoutAction(this.mode, 'host')");
rep("const isShocked = (this.role === 'host') ? this.battle.playerShocked : this.battle.enemyShocked;", 'const isShocked = this.battle.playerShocked;');
rep('const canUseItems = isMyTurn && !isShocked;', 'const canUseItems = isMyTurn && !isShocked && !this._pendingReq;');
rep("document.getElementById('gun-actions').style.display = isMyTurn ? 'flex' : 'none';", "document.getElementById('gun-actions').style.display = (isMyTurn && !this._pendingReq) ? 'flex' : 'none';");
rep("if (!this._eventsBound) { this.initEvents(); this._eventsBound = true; }",
    "if (!this._eventsBound) { this.initEvents(); this._eventsBound = true; }\n        if (typeof FX !== 'undefined') FX.setLowHp(this.battle.playerHp <= 1 && this.battle.playerHp > 0 && !this.battle.gameOver);");

// 6. 点击 → 分发
sliceRep('    handleActionClick(type, detail) {', '    executeAction(type, detail, actor, line = null) {', blk('_blk_action.txt'));

// 7. executeAction：视角转换
rep("    executeAction(type, detail, actor, line = null) {\n        clearInterval(this.timerInterval);\n        const isSelf = actor === this.role;",
    "    executeAction(type, detail, actor, line = null) {\n        clearInterval(this.timerInterval);\n        this._markBusy(); this._pendingReq = false;\n        const isSelf = actor === this.role;\n        const vActor = isSelf ? 'host' : 'client';   // 战斗系统视角：'host' = 本机玩家");
rep('this.battle.useItem(item.id, { actor, stealIndex, itemIndex })', 'this.battle.useItem(item.id, { actor: vActor, stealIndex, itemIndex })');
rep('this.scene.showPacemaker(actor);', 'this.scene.showPacemaker(vActor);');
rep('const result = this.battle.shoot(detail, actor);', 'const result = this.battle.shoot(detail, vActor);');
rep('if (result.live) this.scene.shootEffect();\n                else { this.scene.gunClickEffect(); this.showMessage("空包弹", 1500); }\n                if (result.hitTarget === this.role) this.triggerShake();',
    "if (result.live) {\n                    this.scene.shootEffect({ victimIsMe: result.hitTarget === 'host', shooterIsMe: isSelf });\n                    if (result.hitTarget === 'host' && typeof FX !== 'undefined') FX.hitImpact(this.scene, result.damage);\n                    else if (result.hitTarget === 'host') this.triggerShake();\n                } else { this.scene.gunClickEffect(); this.showMessage(\"空包弹\", 1500); if (this.scene.shakeCamera) this.scene.shakeCamera(0.12, 300, 1.5); }");
rep('this.pacemakerRevive(() => {', "this.pacemakerRevive(result.hitTarget === 'host', () => {");
rep('if (!isSelf) { this.taserEffect(); this.triggerShake(); }', 'this.taserEffect(!isSelf);');
rep("setTimeout(() => this.finalizeAction(), 800);\n                    });\n                    break;\n                case 'defibrillator':",
    "setTimeout(() => this.finalizeAction(), 1800);\n                    });\n                    break;\n                case 'defibrillator':");

// 8. 结算点释放"忙"标记
rep("        if (this.battle.isMagEmpty()) {\n            this.battle.turn = 'animating';", "        if (this.battle.isMagEmpty()) {\n            this._endAct();\n            this.battle.turn = 'animating';");
rep("const settled = this.battle.checkWin();\n        if (!settled) return false;", "const settled = this.battle.checkWin();\n        if (!settled) return false;\n        this._endAct();");
rep("    finalizeAction() {\n        this.scene.aimAt('center');", "    finalizeAction() {\n        this._endAct();\n        this.scene.aimAt('center');");

// 9. 新回合：状态随 SYNC_ROUND 下发，开局/结束标记
rep("if (this.battle.gameOver || this._animatingRound || (this.isRemote && this.role !== 'host')) return;", "if (this.battle.gameOver || this._animatingRound || (this.isRemote && this.role !== 'host')) return;\n        this._markBusy();");
rep('nextTurn: this.battle.nextRoundTurn, newPItems: newPlayerItems,', 'nextTurn: this.battle.nextRoundTurn, state: this.buildState(), newPItems: newPlayerItems,');
rep("this.battle.startRoundAfterAnimation(); this.updateUI(); if (this.mode === 'sp' && this.battle.turn === 'client')",
    "this.battle.startRoundAfterAnimation(); this.updateUI(); this._endAct(); if (this.isRemote && this.role === 'host') this.broadcastStateSync(); if (this.mode === 'sp' && this.battle.turn === 'client')");

// 10. 客户端收到新回合：全部按镜像视角
rep("this.battle.nextRoundTurn = data.nextTurn || 'host';", "this.battle.nextRoundTurn = this._mirrorRole(data.nextTurn || 'host');", 2);
rep("this.battle.playerPacemaker = false;\n        this.battle.enemyPacemaker = false;\n        this.battle.gunDamage = 1;",
    "this.battle.playerPacemaker = !!(data.state && data.state.enemyPacemaker);\n        this.battle.enemyPacemaker = !!(data.state && data.state.playerPacemaker);\n        this.battle.gunDamage = 1;");
rep("console.warn('客户端回合动画超时，强制重置');", "console.warn('客户端回合动画超时，强制重置');\n                this._endAct();");

// 11. 特效：受击抖动、电击、起搏器
lineRep('    triggerShake() {', "    triggerShake() { if (this.scene.shakeCamera) this.scene.shakeCamera(0.8, 900, 1.2); this.ui.overlay.style.opacity = 1; this.ui.blood.style.opacity = 1; document.body.style.transform = \"translate(12px,12px)\"; setTimeout(() => { document.body.style.transform = \"translate(-12px,-12px)\"; setTimeout(() => { document.body.style.transform = \"none\"; this.ui.overlay.style.opacity = 0; setTimeout(() => this.ui.blood.style.opacity = 0, 400); }, 50); }, 50); }");
sliceRep('    taserEffect() {', '    aiLogic() {', blk('_blk_fx.txt'));

if (crlf) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(p, s, 'utf8');
console.log('PATCH_OK');
