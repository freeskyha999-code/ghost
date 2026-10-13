# Roulette 轮盘赌游戏

## 项目结构

```
/
├── index.html            # 入口页面
├── server.js             # HTTP + WebSocket 服务器 (端口 8080)
├── package.json
├── CLAUDE.md
├── src/
│   ├── js/
│   │   ├── BattleSystem.js   # 战斗逻辑核心（含恶魔 AI 决策）
│   │   ├── game.js           # 游戏引擎 + 3D 场景 + 启动入口
│   │   ├── models.js         # Three.js 3D 模型库
│   │   ├── networkManager.js # WebSocket 联机管理
│   │   ├── itemManager.js    # 道具管理
│   │   ├── uiManager.js      # UI 管理
│   │   └── opening.js        # 开场动画
│   ├── css/
│   │   └── style.css
│   └── audio/                # 音效 / BGM 文件
├── node_modules/
└── .claude/
```

## 启动方式

```bash
node server.js
# 浏览器打开 http://localhost:8080
```

## 已修复的 BUG

1. **菜单点不动** — 删掉了不存在的 `demonAI.js` 引用（404）；`game.js` 里 `NetworkManager` 重复定义（SyntaxError）导致整段 JS 不执行；CDN 的 three.js 被浏览器拦截，换成本地 `node_modules/three/build/three.min.js`；`DOMContentLoaded` 里按钮绑定移到 SceneManager 初始化之前，即使 3D 初始化失败菜单也能点。
2. **弹匣打空崩溃** — `game.js` 里 `checkEmpty()` 调用了 `BattleSystem` 不存在的 `checkEmpty()` 方法（应该是 `isMagEmpty()`），TypeError 崩了。
3. **触摸屏点不了按钮** — `body` 的 `touch-action: none` 改为 `manipulation`。
4. **麻药点错位** — 同名道具用 `id` 查找永远删第一个。`useItem` 新增 `context.itemIndex` 参数，`executeAction` 传正确索引 + `findModelBySlot` 按 slotIndex 匹配模型。
5. **心脏起搏器只应抵命** — `shoot()` 里起搏器改为 `HP - 伤害 <= 0` 才触发，否则正常扣血。
6. **电击器/起搏器出率太低** — `pickItem` 删除了人工拒绝率（锯子50%、电击30%、起搏器40%），改为纯随机。
7. **多人模式不同步** — 实现了 `applyRoundWithAnimation`、`applyRoundSync`、`applyForceSync`、`broadcastStateSync`。`SYNC_ROUND` 发送完整道具对象而非仅 ID，客户端接收后正确切换视角（host 的 pItems ↔ client 的 enemyItems）并播放动画。
8. **局域网按钮** — 点击连接 WebSocket 并显示连接状态。
9. **香烟模型立着** — `models.js` 里香烟零件已旋转平躺后又整体旋转了一次，导致立起。去掉整体旋转。
10. **麻药模型过大** — scale 从 0.55 改为 0.35。
11. **电击器效果** — 新增 `taserEffect()`：蓝色电光闪烁 + 震动 + 音效（需要 `src/audio/taser_zap.mp3`）。
12. **起搏器复活动画** — 新增 `pacemakerRevive()`：黑屏 → 停所有音频 → 播放起搏器音效 → 3秒慢速渐出黑屏 + 模糊变清晰 → BGM 以150%音量恢复后渐变正常（需要 `src/audio/pacemaker_revive.mp3`）。


## P2P 联机 (PeerJS)

- 新增 src/js/peerManager.js (PeerNetworkManager extends NetworkManager)，与 WebSocket 局域网联机互不影响。
- 房主为权威端：管理玩家列表/准备/设置/开局；GameEngine 通过 socketShim(readyState/send) 收发，game.js 里的 sendNetMessage 无需改动。
- 房间号 = PeerID 去掉前缀 emlp-；信令默认走 PeerJS 官方云，可在菜单「信令服务器」填自建地址 (host:port)。
- 依赖 node_modules/peerjs/dist/peerjs.min.js；启动用 启动游戏.bat。
