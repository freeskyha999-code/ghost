const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 8080;

const rooms = new Map();

function generateRoomId() {
    return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function broadcastLobbyList(wss) {
    const list = [];
    for (const [id, room] of rooms) {
        if (room.isPublic && room.players.length < 2) {
            list.push({
                id: id,
                name: room.name,
                players: room.players.length,
                hostName: room.players[0]?.name || '未知'
            });
        }
    }
    const msg = JSON.stringify({ type: 'LOBBY_LIST', rooms: list });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && !client.roomId) {
            client.send(msg);
        }
    });
}

function sendToRoom(room, msg) {
    const data = JSON.stringify(msg);
    room.players.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN) p.ws.send(data);
    });
}

function checkReady(room) {
    if (room.players.length === 2 && room.players.every(p => p.ready)) {
        sendToRoom(room, {
            type: 'GAME_START',
            settings: room.settings,
            players: room.players.map(p => ({ name: p.name, ready: p.ready }))
        });
        room.players.forEach(p => p.ready = false);
        room.isPublic = false;
        room.inGame = true;  // 标记游戏进行中，禁止新人加入
    }
}

function leaveRoom(ws, wss) {
    const roomId = ws.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const index = room.players.findIndex(p => p.ws === ws);
    if (index !== -1) room.players.splice(index, 1);
    if (room.players.length > 0) {
        sendToRoom(room, { type: 'OPPONENT_DISCONNECTED' });
    }
    if (room.players.length === 0) {
        rooms.delete(roomId);
    } else if (!room.inGame) {
        // 游戏未开始时才重新公开房间
        room.isPublic = true;
    }
    ws.roomId = null;
    broadcastLobbyList(wss);
}

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ogg': 'audio/ogg',
        '.mp3': 'audio/mpeg',
    };
    if (filePath.includes('..')) {
        res.writeHead(403);
        return res.end('Forbidden');
    }
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not Found');
        }
        res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.roomId = null;

    ws.on('message', (raw) => {
        let data;
        try { data = JSON.parse(raw); } catch (e) { return; }

        switch (data.type) {
            case 'CREATE_ROOM': {
                const roomId = generateRoomId();
                const room = {
                    id: roomId,
                    name: data.roomName || '房间',
                    isPublic: data.isPublic !== false,
                    host: ws,
                    players: [{ ws, name: data.playerName || '玩家', ready: false }],
                    settings: {
                        itemChances: {
                            check_shell: 0.2, beer: 0.2, cigarette: 0.15, handcuffs: 0.15, saw: 0.1, morphine: 0.2
                        },
                        bullets: { minLive: 1, maxLive: 4, minBlank: 1, maxBlank: 4 }
                    }
                };
                rooms.set(roomId, room);
                ws.roomId = roomId;
                ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomId, roomName: room.name, isPublic: room.isPublic }));
                broadcastLobbyList(wss);
                break;
            }
            case 'JOIN_ROOM': {
                const roomId = data.roomId;
                if (!roomId || !rooms.has(roomId)) {
                    ws.send(JSON.stringify({ type: 'JOIN_ERROR', message: '房间不存在' }));
                    return;
                }
                const room = rooms.get(roomId);
                if (room.inGame) {
                    ws.send(JSON.stringify({ type: 'JOIN_ERROR', message: '游戏已开始，无法加入' }));
                    return;
                }
                if (room.players.length >= 2) {
                    ws.send(JSON.stringify({ type: 'JOIN_ERROR', message: '房间已满' }));
                    return;
                }
                const player = { ws, name: data.playerName || '玩家', ready: false };
                room.players.push(player);
                ws.roomId = roomId;
                sendToRoom(room, {
                    type: 'ROOM_JOINED',
                    players: room.players.map(p => ({ name: p.name, ready: p.ready }))
                });
                broadcastLobbyList(wss);
                break;
            }
            case 'PLAYER_READY': {
                if (ws.roomId && rooms.has(ws.roomId)) {
                    const room = rooms.get(ws.roomId);
                    const player = room.players.find(p => p.ws === ws);
                    if (player) {
                        player.ready = true;
                        sendToRoom(room, { type: 'PLAYERS_UPDATED', players: room.players.map(p => ({ name: p.name, ready: p.ready })) });
                        checkReady(room);
                    }
                }
                break;
            }
            case 'LOBBY_LIST': {
                broadcastLobbyList(wss);
                break;
            }
            case 'UPDATE_SETTINGS': {
                if (ws.roomId && rooms.has(ws.roomId)) {
                    const room = rooms.get(ws.roomId);
                    if (room.host === ws) {
                        room.settings = { ...room.settings, ...data.settings };
                        sendToRoom(room, { type: 'SETTINGS_UPDATED', settings: room.settings });
                    }
                }
                break;
            }
            // 所有游戏相关消息直接转发给房间内其他人
            case 'SYNC_ROUND':
            case 'PLAYER_ACTION':
            case 'FORCE_SYNC':
            case 'CHAT_MSG':
                if (ws.roomId && rooms.has(ws.roomId)) {
                    const room = rooms.get(ws.roomId);
                    if (!room.inGame) break; // 游戏未开始，忽略游戏消息
                    room.players.forEach(p => {
                        if (p.ws !== ws && p.ws.readyState === WebSocket.OPEN) {
                            try { p.ws.send(JSON.stringify(data)); } catch(e) {}
                        }
                    });
                }
                break;
        }
    });

    ws.on('close', () => leaveRoom(ws, wss));
    broadcastLobbyList(wss);
});

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});