// ============================================================
// peerManager.js —— PeerJS (WebRTC) 点对点联机
// 独立于 networkManager.js 的 WebSocket(局域网) 联机，互不影响。
// 复用 NetworkManager 的大厅 UI 方法；对 GameEngine 暴露一个
// 与 WebSocket 同接口的 socket 垫片 (readyState / send)。
// 房主 = 权威端：负责玩家列表、准备状态、对局设置、开局。
// ============================================================

const PEER_ID_PREFIX = 'emlp-';
const PEER_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ICE 服务器：含国内可访问的 STUN；TURN 为公共中继，仅在直连失败(对称 NAT)时兜底。
// 想要更稳：换成你自己的 TURN。
const PEER_ICE_SERVERS = [
    { urls: 'stun:stun.miwifi.com:3478' },
    { urls: 'stun:stun.qq.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turns:openrelay.metered.ca:443?transport=tcp'],
      username: 'openrelayproject', credential: 'openrelayproject' }
];

class PeerNetworkManager extends NetworkManager {
    constructor(sceneManager) {
        super(sceneManager);
        this.peer = null;
        this.conn = null;
        this.players = [];          // 仅房主维护: [{name, ready}]
        this.settings = {
            itemChances: { check_shell: 0.2, beer: 0.2, cigarette: 0.15, handcuffs: 0.15, saw: 0.1, morphine: 0.2 },
            bullets: { minLive: 1, maxLive: 4, minBlank: 1, maxBlank: 4 }
        };
        this._started = false;
        this._closing = false;
        this._connectTimer = null;
        this._clientJoined = false;

        // 给 GameEngine 用的 socket 垫片
        this.socketShim = {
            get readyState() { return 1; },   // 等价于 WebSocket.OPEN
            send: (str) => this._sendRaw(str),
            close: () => {}
        };

        const savedName = localStorage.getItem('playerName');
        const nameInput = document.getElementById('peer-name-input');
        if (savedName && nameInput) nameInput.value = savedName;
        const savedSrv = localStorage.getItem('peerServer');
        const srvInput = document.getElementById('peer-server-input');
        if (savedSrv && srvInput) srvInput.value = savedSrv;
    }

    // ---------- 基础工具 ----------
    getPlayerName() {
        const input = document.getElementById('peer-name-input');
        const name = input ? (input.value.trim() || '玩家') : '玩家';
        localStorage.setItem('playerName', name);
        return name;
    }

    _setPeerStatus(text) {
        const el = document.getElementById('peer-status');
        if (el) el.innerText = text || '';
    }

    _genCode() {
        const arr = new Uint32Array(5);
        crypto.getRandomValues(arr);
        return Array.from(arr, n => PEER_CODE_CHARS[n % PEER_CODE_CHARS.length]).join('');
    }

    _peerOptions() {
        const opts = { debug: 1, config: { iceServers: PEER_ICE_SERVERS, sdpSemantics: 'unified-plan' } };
        const srvInput = document.getElementById('peer-server-input');
        const srv = (srvInput ? srvInput.value.trim() : '') || '';
        localStorage.setItem('peerServer', srv);
        if (srv) {
            // 自建信令服务器：host:port 或 host （例 192.168.1.5:9000）
            const m = srv.match(/^(?:(https?):\/\/)?([^:\/]+)(?::(\d+))?(\/.*)?$/i);
            if (m) {
                const secure = (m[1] || '').toLowerCase() === 'https';
                opts.host = m[2];
                opts.port = m[3] ? parseInt(m[3], 10) : (secure ? 443 : 9000);
                opts.path = m[4] || '/';
                opts.secure = secure;
            }
        }
        return opts;
    }

    _libOk() {
        if (typeof Peer === 'undefined') {
            alert('PeerJS 库未加载（node_modules/peerjs/dist/peerjs.min.js 缺失）');
            return false;
        }
        return true;
    }

    _send(obj) {
        try { if (this.conn && this.conn.open) this.conn.send(obj); } catch (e) { console.error('P2P 发送失败：', e); }
    }

    _sendRaw(str) {
        try { this._send(JSON.parse(str)); } catch (e) { console.error('P2P 消息格式错误：', e); }
    }

    _showPeerMenu() {
        document.getElementById('matching-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('menu-screen').style.display = 'flex';
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('multiplayer-menu').classList.add('hidden');
        document.getElementById('peer-menu').classList.remove('hidden');
    }

    _fail(msg) {
        this.disconnect();
        this._setPeerStatus(msg);
        this._showPeerMenu();
        alert(msg);
    }

    // ---------- 覆盖 LAN 的接口 ----------
    connect() { /* PeerJS 模式无需预连接 */ }

    // ---------- 创建房间 (房主) ----------
    createRoom() {
        if (!this._libOk()) return;
        this.disconnect();
        this.playerName = this.getPlayerName();
        this.isHost = true;
        this._setPeerStatus('正在连接 PeerJS 信令服务器...');

        const tryCreate = (attempt) => {
            const code = this._genCode();
            const peer = new Peer(PEER_ID_PREFIX + code, this._peerOptions());
            this.peer = peer;

            peer.on('open', () => {
                if (this.peer !== peer) return;
                this.roomId = code;
                this.players = [{ name: this.playerName, ready: false }];
                document.getElementById('menu-screen').style.display = 'none';
                this.showLobbyUI(true);
                this.roomDisplay.innerText = `房间号: ${code}（发给朋友，对方在 P2P 联机里输入）`;
                this.statusText.innerText = '等待对手加入...';
            });
            peer.on('connection', (conn) => this._hostOnConnection(conn));
            peer.on('error', (err) => {
                if (this.peer !== peer) return;
                if (err.type === 'unavailable-id' && attempt < 5) {
                    try { peer.destroy(); } catch (e) {}
                    tryCreate(attempt + 1);
                    return;
                }
                if (this.conn && this.conn.open) { console.warn('PeerJS 错误(连接中)：', err); return; }
                const map = {
                    'network': '无法连接 PeerJS 信令服务器，请检查网络',
                    'server-error': 'PeerJS 信令服务器出错',
                    'socket-error': '与信令服务器的连接出错',
                    'socket-closed': '与信令服务器的连接被关闭'
                };
                this._fail(map[err.type] || ('创建房间失败：' + err.type));
            });
            peer.on('disconnected', () => {
                // 与信令服务器断开但已有 P2P 连接时，不影响对局；否则尝试重连以便新玩家加入
                if (this.peer === peer && !this._closing && !peer.destroyed) {
                    try { peer.reconnect(); } catch (e) {}
                }
            });
        };
        tryCreate(0);
    }

    _hostOnConnection(conn) {
        if (this.conn || this._started) {
            const reason = this._started ? '游戏已开始，无法加入' : '房间已满';
            conn.on('open', () => {
                try { conn.send({ type: 'JOIN_ERROR', message: reason }); } catch (e) {}
                setTimeout(() => { try { conn.close(); } catch (e) {} }, 300);
            });
            return;
        }
        this.conn = conn;
        conn.on('data', (d) => this._onData(d));
        conn.on('close', () => this._onConnClosed(conn));
        conn.on('error', (e) => console.warn('DataConnection 错误：', e));
    }

    // ---------- 加入房间 (客人) ----------
    joinRoom(code) {
        if (!this._libOk()) return;
        code = (code || '').trim().toUpperCase();
        if (!code) { alert('请输入房间号'); return; }
        this.disconnect();
        this.playerName = this.getPlayerName();
        this.isHost = false;
        this.roomId = code;
        this._clientJoined = false;
        this._setPeerStatus('正在连接 PeerJS 信令服务器...');

        const peer = new Peer(this._peerOptions());
        this.peer = peer;

        this._connectTimer = setTimeout(() => {
            if (this.peer === peer && !this._clientJoined) {
                this._fail('连接房主超时：房间号错误、房主不在线，或双方网络无法直连');
            }
        }, 20000);

        peer.on('open', () => {
            if (this.peer !== peer) return;
            this._setPeerStatus('正在连接房主...');
            const conn = peer.connect(PEER_ID_PREFIX + code, { reliable: true, serialization: 'json' });
            this.conn = conn;
            conn.on('open', () => {
                if (this.conn !== conn) return;
                this._send({ type: 'P_HELLO', name: this.playerName });
                this._setPeerStatus('已连接，等待房主确认...');
            });
            conn.on('data', (d) => this._onData(d));
            conn.on('close', () => this._onConnClosed(conn));
            conn.on('error', (e) => console.warn('DataConnection 错误：', e));
        });
        peer.on('error', (err) => {
            if (this.peer !== peer) return;
            if (this._clientJoined) { console.warn('PeerJS 错误(连接中)：', err); return; }
            const map = {
                'peer-unavailable': '房间不存在或房主已离线',
                'network': '无法连接 PeerJS 信令服务器，请检查网络',
                'server-error': 'PeerJS 信令服务器出错',
                'socket-error': '与信令服务器的连接出错',
                'socket-closed': '与信令服务器的连接被关闭'
            };
            this._fail(map[err.type] || ('加入房间失败：' + err.type));
        });
    }

    // ---------- 消息处理 ----------
    _onData(d) {
        if (!d || typeof d !== 'object') return;
        try {
            if (this.isHost) this._hostHandle(d);
            else this._clientHandle(d);
        } catch (err) {
            console.error('P2P 消息处理出错：', err);
        }
    }

    _hostHandle(d) {
        switch (d.type) {
            case 'P_HELLO': {
                const name = (d.name && String(d.name).slice(0, 12)) || '玩家';
                this.players = [this.players[0], { name, ready: false }];
                this._send({ type: 'ROOM_JOINED', players: this.players.map(p => ({ name: p.name, ready: p.ready })) });
                this.updatePlayersList(this.players);
                this.statusText.innerText = '对手已加入，等待准备';
                break;
            }
            case 'PLAYER_READY':
                if (this.players[1] && !this._started) {
                    this.players[1].ready = true;
                    this._broadcastPlayers();
                    this._checkReady();
                }
                break;
            default:
                this._deliverGame(d);
        }
    }

    _clientHandle(d) {
        switch (d.type) {
            case 'ROOM_JOINED':
                clearTimeout(this._connectTimer);
                this._clientJoined = true;
                this.isHost = false;
                document.getElementById('menu-screen').style.display = 'none';
                this.showLobbyUI(false);
                this.roomDisplay.innerText = `房间号: ${this.roomId || ''}`;
                if (d.players) this.updatePlayersList(d.players);
                break;
            case 'PLAYERS_UPDATED':
                if (d.players) this.updatePlayersList(d.players);
                break;
            case 'SETTINGS_UPDATED':
                this.settings = d.settings || this.settings;
                if (this.game) this.game.applySettings(d.settings);
                break;
            case 'GAME_START': {
                const hostName = (d.players && d.players[0] && d.players[0].name) || '对方';
                this._started = true;
                this._startGame('client', hostName, d.settings);
                break;
            }
            case 'JOIN_ERROR':
                this._fail(d.message || '加入失败');
                break;
            default:
                this._deliverGame(d);
        }
    }

    _deliverGame(msg) {
        if (this.game && this.game.handleServerMessage) this.game.handleServerMessage(msg);
    }

    _broadcastPlayers() {
        const list = this.players.map(p => ({ name: p.name, ready: p.ready }));
        this.updatePlayersList(list);
        this._send({ type: 'PLAYERS_UPDATED', players: list });
    }

    _checkReady() {
        if (this.players.length === 2 && this.players.every(p => p.ready)) {
            const list = this.players.map(p => ({ name: p.name, ready: true }));
            this._started = true;
            this._send({ type: 'GAME_START', settings: this.settings, players: list });
            this.players.forEach(p => p.ready = false);
            this._startGame('host', this.players[1].name, this.settings);
        }
    }

    _startGame(role, opponentName, settings) {
        document.getElementById('matching-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        try {
            this.game = new GameEngine(this.sm, 'mp', {
                role: role,
                socket: this.socketShim,
                playerName: this.playerName,
                opponentName: opponentName,
                settings: settings
            });
        } catch (err) {
            console.error('GameEngine 初始化失败：', err);
            alert('游戏加载失败，请刷新重试');
            this.disconnect();
            location.reload();
        }
    }

    _onConnClosed(conn) {
        if (this._closing || this.conn !== conn) return;
        if (this._started) {
            alert('对方已断开连接');
            this.disconnect();
            location.reload();
            return;
        }
        if (this.isHost) {
            // 大厅阶段客人离开：房主继续等待新对手
            this.conn = null;
            this.players = [this.players[0]];
            this.players[0].ready = false;
            this.updatePlayersList(this.players);
            this.statusText.innerText = '对手已离开，等待新对手...';
        } else {
            alert('房主已断开连接');
            this.disconnect();
            this._showPeerMenu();
        }
    }

    // ---------- 大厅操作 ----------
    setReady() {
        if (!this.peer) return;
        if (this.isHost) {
            if (!this.players[1] || this._started) return;
            if (this.players[0].ready) return;
            this.players[0].ready = true;
            this._broadcastPlayers();
            this._checkReady();
        } else {
            this._send({ type: 'PLAYER_READY' });
        }
    }

    updateSettings(newSettings) {
        if (!this.isHost || !this.peer) return;
        this.settings = { ...this.settings, ...newSettings };
        this._send({ type: 'SETTINGS_UPDATED', settings: this.settings });
        if (this.game) this.game.applySettings(this.settings);
    }

    disconnect() {
        this._closing = true;
        clearTimeout(this._connectTimer);
        try { if (this.conn) this.conn.close(); } catch (e) {}
        try { if (this.peer) this.peer.destroy(); } catch (e) {}
        this.conn = null;
        this.peer = null;
        this.players = [];
        this.isHost = false;
        this.roomId = null;
        this._started = false;
        this._clientJoined = false;
        this._joining = false;
        this.game = null;
        // 注意：不重置 _lobbyButtonsBound，避免大厅按钮重复绑定
        this._closing = false;
    }
}
