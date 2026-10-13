// 联机同步仿真测试：房主 + 客户端两个 GameEngine，经带随机延迟的假网络对打，检查状态镜像一致 & 不卡死
const vm = require('vm');
const fs = require('fs');
const root = 'E:/game/恶魔轮盘/src/js/';
const K = 40; // 时间加速倍数
const realST = setTimeout, realSI = setInterval, realCT = clearTimeout, realCI = clearInterval;
const T0 = Date.now();
const simNow = () => (Date.now() - T0) * K;

function stubEl() {
    const t = { style: {}, classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} }, children: [], innerText: '', innerHTML: '', value: '', width: 100, height: 100 };
    return new Proxy(t, {
        get(o, p) { if (p in o) return o[p]; if (p === 'then') return undefined; return (...a) => stubEl(); },
        set(o, p, v) { o[p] = v; return true; }
    });
}
const els = {};
const document = {
    getElementById(id) { return els[id] || (els[id] = stubEl()); },
    querySelectorAll() { return []; }, querySelector() { return stubEl(); },
    createElement() { return stubEl(); }, addEventListener() {}, body: stubEl()
};
class AudioStub { constructor() { this.volume = 1; this.currentTime = 0; this.paused = true; } play() { return Promise.resolve(); } pause() {} }
const ctx = vm.createContext({
    console: { log: console.log, error: console.error, warn: (...a) => { const f = (e) => e ? `turn=${e.battle.turn} pI=[${e.battle.playerItems.map(i => i.id).join(',')}] eI=[${e.battle.enemyItems.map(i => i.id).join(',')}] busy=${e._evBusy}` : '-'; console.log('[warn]', ...a, '\n    host:', f(host), '\n    client:', f(client), '\n   ', (new Error().stack || '').split('\n').slice(2, 7).map(x => x.trim()).join(' <- ')); } }, document, Math, JSON, Promise, Array, Object, Error, Number, String, Date: { now: simNow },
    window: { innerWidth: 1200, innerHeight: 800, addEventListener() {}, _sceneManager: null },
    localStorage: { getItem() { return null; }, setItem() {} },
    Audio: AudioStub, WebSocket: { OPEN: 1 },
    performance: { now: simNow },
    setTimeout: (f, ms) => realST(f, (ms || 0) / K),
    setInterval: (f, ms) => realSI(f, (ms || 0) / K),
    clearTimeout: realCT, clearInterval: realCI,
    requestAnimationFrame: (f) => realST(() => f(simNow()), 16 / K),
    THREE: { Vector3: class { constructor(x, y, z) { this.x = x; this.y = y; this.z = z; } clone() { return this; } lerpVectors() {} copy() {} } },
    alert() {}, location: { reload() {} }
});
const src = ['BattleSystem.js', 'game.js', 'fx.js'].map(f => fs.readFileSync(root + f, 'utf8').replace(/^\uFEFF/, '')).join('\n;\n')
    + '\n;globalThis.__ex = { GameEngine, BattleSystem, FX };';
vm.runInContext(src, ctx, { filename: 'bundle.js' });
const { GameEngine } = ctx.__ex;

function mkScene() {
    const base = { gunGroup: {}, camera: {} };
    return new Proxy(base, {
        get(o, p) {
            if (p in o) return o[p];
            if (p === 'then') return undefined;
            return (...a) => { const cb = a.find(x => typeof x === 'function'); if (cb) realST(cb, 300 / K); };
        }
    });
}

let inflight = 0, msgCount = 0;
function link(label, getTarget) {
    let last = 0;
    return {
        readyState: 1,
        send(str) {
            msgCount++; inflight++;
            const data = JSON.parse(str);
            const delay = 3 + Math.random() * (+process.argv[3] || 22);
            const at = Math.max(last, Date.now() + delay); last = at;
            realST(() => { inflight--; getTarget().handleServerMessage(data); }, at - Date.now());
        }
    };
}
let host, client;
const settings = { itemChances: {}, bullets: { minLive: 1, maxLive: 4, minBlank: 1, maxBlank: 4 } };
host = new GameEngine(mkScene(), 'mp', { role: 'host', socket: link('h2c', () => client), playerName: 'H', opponentName: 'C', settings });
client = new GameEngine(mkScene(), 'mp', { role: 'client', socket: link('c2h', () => host), playerName: 'C', opponentName: 'H', settings });
host.showStealMenu = (l, cb) => cb(0);
client.showStealMenu = (l, cb) => cb(0);

const fails = []; let actions = 0, lastProgress = Date.now(), matches = 0, checks = 0, maxMatches = +process.argv[2] || 4;
const fail = (m) => { if (fails.length < 12) fails.push(m); };

function bot(e, name) {
    const b = e.battle;
    if (b.gameOver) return;
    if (!e._isMyTurn() || e._evBusy || e._pendingReq || b.turn === 'animating') return;
    if (Math.random() > 0.2) return;
    const items = b.playerItems;
    try {
        if (items.length && Math.random() < 0.35 && !b.playerShocked) e.handleActionClick('useItem', Math.floor(Math.random() * items.length));
        else e.handleActionClick('shoot', Math.random() < 0.5 ? 'self' : 'enemy');
        actions++; lastProgress = Date.now();
    } catch (err) { fail(name + ' 行动抛异常: ' + err.stack); }
}

const ids = (l) => l.map(i => i.id + ':' + i.slotIndex).sort().join(',');
function compare() {
    const h = host.battle, c = client.battle, d = [];
    const mir = (r) => r === 'host' ? 'client' : 'host';
    if (h.playerHp !== c.enemyHp) d.push(`hostHp ${h.playerHp} vs client.enemyHp ${c.enemyHp}`);
    if (h.enemyHp !== c.playerHp) d.push(`clientHp ${h.enemyHp} vs client.playerHp ${c.playerHp}`);
    if (h.turn !== mir(c.turn)) d.push(`turn host=${h.turn} client=${c.turn}`);
    if (h.shells.join('') !== c.shells.join('')) d.push(`shells ${h.shells.join('')} vs ${c.shells.join('')}`);
    if (ids(h.playerItems) !== ids(c.enemyItems)) d.push(`hostItems ${ids(h.playerItems)} vs ${ids(c.enemyItems)}`);
    if (ids(h.enemyItems) !== ids(c.playerItems)) d.push(`clientItems ${ids(h.enemyItems)} vs ${ids(c.playerItems)}`);
    if (h.playerHandcuffed !== c.enemyHandcuffed || h.enemyHandcuffed !== c.playerHandcuffed) d.push('handcuffs');
    if (h.playerShocked !== c.enemyShocked || h.enemyShocked !== c.playerShocked) d.push('shocked');
    if (h.playerPacemaker !== c.enemyPacemaker || h.enemyPacemaker !== c.playerPacemaker) d.push('pacemaker');
    if (h.wins !== c.losses || h.losses !== c.wins) d.push(`score ${h.wins}-${h.losses} vs ${c.wins}-${c.losses}`);
    return d;
}

let quiet = 0;
const loop = realSI(() => {
    bot(host, '房主'); bot(client, '客户端');
    const h = host.battle, c = client.battle;
    if (h.gameOver && c.gameOver) {
        matches++;
        console.log(`第 ${matches} 局结束 比分(房主视角) ${h.wins}-${h.losses}，累计动作 ${actions}，消息 ${msgCount}`);
        if (matches >= maxMatches) return finish();
        // 模拟房主点"再来一局"：客户端不按，靠 SYNC_ROUND 自动重开
        h.resetMatch(); host._animatingRound = false; host.updateScoreDisplay(); host.startNewRound();
        lastProgress = Date.now();
        return;
    }
    const settled = inflight === 0 && !host._evBusy && !client._evBusy && !host._animatingRound && !client._animatingRound
        && h.turn !== 'animating' && c.turn !== 'animating' && client._evQueue.length === 0 && !client._pendingReq;
    quiet = settled ? quiet + 1 : 0;
    if (quiet === 6) {
        checks++;
        const d = compare();
        if (d.length) fail(`静止状态不一致 #${checks}: ` + d.join(' | '));
    }
    if ((Date.now() - lastProgress) * K > 60000) { fail(`卡死: 60 秒(模拟)无进展 host.turn=${h.turn} client.turn=${c.turn} hBusy=${host._evBusy} cBusy=${client._evBusy} cQ=${client._evQueue.length} pend=${client._pendingReq} inflight=${inflight}`); finish(); }
}, 30);

function finish() {
    realCI(loop);
    console.log(`\n=== 结果 === 完成局数 ${matches}/${maxMatches}  动作 ${actions}  一致性检查 ${checks}  消息 ${msgCount}`);
    if (fails.length) { console.log('失败 ' + fails.length + ' 条:'); fails.forEach(f => console.log(' - ' + f)); process.exit(1); }
    console.log('全部通过：状态始终镜像一致，没有卡死');
    process.exit(0);
}
realST(() => { fail('真实时间 150s 总超时'); finish(); }, 150000);
process.on('uncaughtException', (e) => { fail('未捕获异常: ' + e.stack); });
