// ============================================================
// networkManager.js —— 网络管理器
// ============================================================

class NetworkManager {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.ws = null;
        this.game = null;
        this.playerName = '玩家';
        this.roomId = null;
        this.isHost = false;
        this._joining = false;

        this.uiMenu = document.getElementById('menu-screen');
        this.uiMatch = document.getElementById('matching-screen');
        this.statusText = document.getElementById('match-status');
        this.lobbyList = document.getElementById('lobby-list');
        this.roomDisplay = document.getElementById('room-id-display');
        this.playersDiv = document.getElementById('lobby-players');
        this.settingsPanel = document.getElementById('game-rules-panel');
        this.btnReady = document.getElementById('btn-ready');
        this.btnGameRules = document.getElementById('btn-game-rules');

        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            const input = document.getElementById('player-name-input');
            if (input) input.value = savedName;
        }
    }

    connect(serverAddr) {
        // 解析目标主机地址
        let wsHost = serverAddr;
        if (!wsHost) {
            const addrInput = document.getElementById('server-addr-input');
            wsHost = (addrInput && addrInput.value.trim()) ? addrInput.value.trim() : null;
        }
        if (!wsHost) {
            wsHost = window.location.hostname || '127.0.0.1';
        }

        // 如果传入的地址与当前连接地址不同，强制重连
        if (serverAddr && this._currentHost && this._currentHost !== wsHost) {
            if (this.ws) { try { this.ws.close(); } catch(e) {} this.ws = null; }
        }

        // 如果已连接到同一地址，直接请求刷新列表
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'LOBBY_LIST' }));
            this.statusText.innerText = '已连接 ' + wsHost + ' — 刷新房间列表...';
            return;
        }

        if (this.ws) { try { this.ws.close(); } catch(e) {} this.ws = null; }
        this._currentHost = wsHost;
        this._lobbyButtonsBound = false;
        const wsUrl = `ws://${wsHost}:8080`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            this.statusText.innerText = '已连接 ' + wsHost + ' — 等待房间列表...';
            this.ws.send(JSON.stringify({ type: 'LOBBY_LIST' }));
        };

        this.ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case 'ROOM_CREATED':
                        this.roomId = data.roomId;
                        this.isHost = true;
                        this.showLobbyUI(true);
                        this.roomDisplay.innerText = `房间号: ${data.roomId}`;
                        break;
                    case 'ROOM_JOINED':
                        if (this.isHost) {
                            // 房主收到"有人加入"：只刷新玩家列表，不能改身份
                            if (data.players) this.updatePlayersList(data.players);
                            this.statusText.innerText = '对手已加入，等待准备';
                            break;
                        }
                        this.isHost = false;
                        this.roomDisplay.innerText = `房间号: ${this.roomId || ''}`;
                        this.showLobbyUI(false);
                        if (data.players) this.updatePlayersList(data.players);
                        break;
                    case 'PLAYERS_UPDATED':
                        if (data.players) this.updatePlayersList(data.players);
                        break;
                    case 'LOBBY_LIST':
                        if (data.rooms) this.updateLobbyList(data.rooms);
                        break;
                    case 'GAME_START':
                        this._handleGameStart(data);
                        break;
                    case 'SETTINGS_UPDATED':
                        if (this.game) this.game.applySettings(data.settings);
                        break;
                    case 'JOIN_ERROR':
                        alert(data.message);
                        this._joining = false;
                        break;
                    case 'OPPONENT_DISCONNECTED':
                        alert('对方已断开连接');
                        this.disconnect();
                        this.uiMatch.style.display = 'none';
                        document.getElementById('menu-screen').style.display = 'flex';
                        document.getElementById('multiplayer-menu').classList.add('hidden');
                        document.getElementById('main-menu').classList.remove('hidden');
                        break;
                    default:
                        if (this.game && this.game.handleServerMessage) {
                            this.game.handleServerMessage(data);
                        }
                        break;
                }
            } catch (err) {
                console.error('消息处理出错：', err);
            }
        };

        this.ws.onerror = () => {
            this.statusText.innerText = '连接失败，请确认服务器 ' + wsHost + ' 已启动';
        };
        this.ws.onclose = () => {
            this.statusText.innerText = '已断开连接 (' + wsHost + ')';
        };
    }

    _handleGameStart(data) {
        document.getElementById('matching-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        const role = this.isHost ? 'host' : 'client';
        const players = data.players || [];
        const opponent = players.find(p => p.name !== this.playerName)?.name || '对方';

        const self = this;

        // 先创建 GameEngine（确保 this.game 在 onmessage 替换前已赋值）
        try {
            this.game = new GameEngine(this.sm, 'mp', {
                role: role,
                socket: this.ws,
                playerName: this.playerName,
                opponentName: opponent,
                settings: data.settings
            });
        } catch (err) {
            console.error('GameEngine 初始化失败：', err);
            alert('游戏加载失败，请刷新重试');
            this.disconnect();
            location.reload();
            return;
        }

        // GameEngine 创建成功后再替换 onmessage
        this.ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.type === 'OPPONENT_DISCONNECTED') {
                    alert('对方已断开连接');
                    self.disconnect();
                    document.getElementById('matching-screen').style.display = 'none';
                    document.getElementById('hud').style.display = 'none';
                    document.getElementById('menu-screen').style.display = 'flex';
                    document.getElementById('multiplayer-menu').classList.add('hidden');
                    document.getElementById('main-menu').classList.remove('hidden');
                    return;
                }
                if (msg.type === 'LOBBY_LIST' || msg.type === 'ROOM_CREATED' ||
                    msg.type === 'ROOM_JOINED' || msg.type === 'PLAYERS_UPDATED' ||
                    msg.type === 'JOIN_ERROR') {
                    return;
                }
                if (msg.type === 'SETTINGS_UPDATED') {
                    if (self.game) self.game.applySettings(msg.settings);
                    return;
                }
                if (self.game && self.game.handleServerMessage) {
                    self.game.handleServerMessage(msg);
                }
            } catch (err) {
                console.error('游戏消息处理出错：', err);
            }
        };
    }

    createRoom(roomName, isPublic) {
        this.playerName = this.getPlayerName();
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) { alert('未连接到服务器'); return; }
        this.ws.send(JSON.stringify({
            type: 'CREATE_ROOM',
            roomName: roomName,
            isPublic: isPublic,
            playerName: this.playerName
        }));
    }

    joinRoom(roomId) {
        if (this._joining) return;
        this._joining = true;
        this.isHost = false;
        this.playerName = this.getPlayerName();
        this.roomId = roomId;
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            alert('网络未连接，请先打开多人菜单');
            this._joining = false;
            return;
        }
        this.ws.send(JSON.stringify({
            type: 'JOIN_ROOM',
            roomId: roomId,
            playerName: this.playerName
        }));
        setTimeout(() => { this._joining = false; }, 5000);
    }

    setReady() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'PLAYER_READY' }));
        }
    }

    updateSettings(newSettings) {
        if (this.isHost && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'UPDATE_SETTINGS', settings: newSettings }));
        }
    }

    getPlayerName() {
        const input = document.getElementById('player-name-input');
        const name = input ? (input.value.trim() || '玩家') : '玩家';
        localStorage.setItem('playerName', name);
        return name;
    }

    showLobbyUI(isHost) {
        this.uiMatch.style.display = 'flex';
        this.statusText.innerText = isHost ? '等待对手加入...' : '已加入房间';
        this.roomDisplay.style.display = 'block';
        this.playersDiv.style.display = 'block';
        if (isHost) {
            this.playersDiv.innerHTML = `<div>${this.playerName} (房主) - 未准备</div>`;
        } else {
            this.playersDiv.innerHTML = '';
        }
        this.btnReady.style.display = 'inline-block';
        if (isHost) {
            this.btnGameRules.style.display = 'inline-block';
        } else {
            this.btnGameRules.style.display = 'none';
        }
        this.settingsPanel.style.display = 'none';
        this.bindSettingsEvents();
        this._bindLobbyButtonsOnce(isHost);
    }

    _bindLobbyButtonsOnce(isHost) {
        if (this._lobbyButtonsBound) return;
        this._lobbyButtonsBound = true;

        const readyBtn = document.getElementById('btn-ready');
        if (readyBtn) {
            readyBtn.addEventListener('click', () => this.setReady());
            readyBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.setReady();
            });
        }

        const gameRulesBtn = document.getElementById('btn-game-rules');
        if (gameRulesBtn) {
            gameRulesBtn.addEventListener('click', () => this.toggleGameRules());
            gameRulesBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.toggleGameRules();
            });
        }
    }

    updatePlayersList(players) {
        if (this.playersDiv) {
            this.playersDiv.innerHTML = players.map(p => `<div>${p.name} ${p.ready ? '已准备' : '未准备'}</div>`).join('');
        }
    }

    updateLobbyList(rooms) {
        if (!this.lobbyList) return;
        this.lobbyList.style.display = 'flex';
        if (!rooms || rooms.length === 0) {
            this.lobbyList.innerHTML = '<div class="lobby-room-entry" style="cursor:default;">暂无可用房间</div>';
        } else {
            this.lobbyList.innerHTML = rooms.map(room => {
                return `<div class="lobby-room-entry" data-roomid="${room.id}">
                    <span class="room-name">${room.name}</span>
                    <span class="room-players">${room.players}/2</span>
                </div>`;
            }).join('');
            this.lobbyList.querySelectorAll('.lobby-room-entry[data-roomid]').forEach(entry => {
                entry.addEventListener('click', (e) => {
                    const roomId = entry.dataset.roomid;
                    if (roomId) {
                        audioMgr.play('uiClick');
                        this.joinRoom(roomId);
                        document.getElementById('menu-screen').style.display = 'none';
                        this.uiMatch.style.display = 'flex';
                        this.statusText.innerText = '正在加入房间...';
                    }
                });
                // 触摸设备兼容
                entry.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const roomId = entry.dataset.roomid;
                    if (roomId) {
                        audioMgr.play('uiClick');
                        this.joinRoom(roomId);
                        document.getElementById('menu-screen').style.display = 'none';
                        this.uiMatch.style.display = 'flex';
                        this.statusText.innerText = '正在加入房间...';
                    }
                });
            });
        }
    }

    toggleGameRules() {
        if (this.settingsPanel.style.display === 'flex') {
            this.settingsPanel.style.display = 'none';
        } else {
            this.settingsPanel.style.display = 'flex';
        }
    }

    bindSettingsEvents() {
        document.getElementById('set-live-min')?.addEventListener('input', (e) => {
            document.getElementById('live-min-val').innerText = e.target.value;
        });
        document.getElementById('set-live-max')?.addEventListener('input', (e) => {
            document.getElementById('live-max-val').innerText = e.target.value;
        });
        document.getElementById('set-blank-min')?.addEventListener('input', (e) => {
            document.getElementById('blank-min-val').innerText = e.target.value;
        });
        document.getElementById('set-blank-max')?.addEventListener('input', (e) => {
            document.getElementById('blank-max-val').innerText = e.target.value;
        });
        const probIds = ['prob-check', 'prob-beer', 'prob-cig', 'prob-cuffs', 'prob-saw', 'prob-morph'];
        probIds.forEach(id => {
            document.getElementById(id)?.addEventListener('input', (e) => {
                document.getElementById(id + '-val').innerText = e.target.value + '%';
            });
        });
        document.getElementById('btn-save-settings')?.addEventListener('click', () => {
            const settings = {
                bullets: {
                    minLive: parseInt(document.getElementById('set-live-min')?.value) || 1,
                    maxLive: parseInt(document.getElementById('set-live-max')?.value) || 4,
                    minBlank: parseInt(document.getElementById('set-blank-min')?.value) || 1,
                    maxBlank: parseInt(document.getElementById('set-blank-max')?.value) || 4
                },
                itemChances: {
                    check_shell: parseInt(document.getElementById('prob-check')?.value) / 100,
                    beer: parseInt(document.getElementById('prob-beer')?.value) / 100,
                    cigarette: parseInt(document.getElementById('prob-cig')?.value) / 100,
                    handcuffs: parseInt(document.getElementById('prob-cuffs')?.value) / 100,
                    saw: parseInt(document.getElementById('prob-saw')?.value) / 100,
                    morphine: parseInt(document.getElementById('prob-morph')?.value) / 100
                }
            };
            this.updateSettings(settings);
            this.settingsPanel.style.display = 'none';
        });
    }

    disconnect() {
        this._lobbyButtonsBound = false;
        this._joining = false;
        this.isHost = false;
        this.roomId = null;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}