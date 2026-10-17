# 方块叙事引擎（blockstory）

3D 方块世界叙事引擎。纯静态，无需构建。入口 `index.html`，代码在 `js/`，素材在 `assets/`。

## 文件结构与加载顺序

`index.html` 按下面的顺序加载 `js/*.js`（顺序不能乱，后面的文件会用到前面定义的变量）：

| 文件 | 作用 |
|---|---|
| util.js | 工具函数、WebAudio 合成音效、背景音乐入口 |
| skins-custom.js | 自定义皮肤（内嵌 PNG，数据，不是逻辑） |
| atlas.js | 方块贴图图集（先用程序画占位，再被真贴图替换）、方块注册表 B |
| world.js | 世界数据、分块网格、体素光照、地形和村子生成 |
| render.js | 渲染器、天空、昼夜、后处理（泛光、体积光）、玩家、射线、破坏和放置 |
| model.js | 原版玩家模型（Steve 粗臂 / Alex 细臂）、第二层皮肤立体化 |
| npc.js | NPC 创建与行走 |
| ui.js | 对话框、选项、标题、提示、快捷栏 |
| story.js | 剧情引擎：动作 ACT、触发器、条件 |
| input.js | 键盘、鼠标、触屏输入 |
| loop.js | 主循环 |
| story-data.js | 剧情数据（NPC、触发器、脚本），**只改这个文件就能换故事** |
| editor-json.js | JSON 剧本编辑器（高级） |
| editor.js | 可视化剧本模式（上帝视角，点击放置/破坏/填充/角色） |
| assets.js | 从 `assets/` 按需加载贴图、音效、音乐、皮肤、太阳月亮 |
| main.js | 启动 |

所有文件是普通脚本，共用全局变量，没有模块系统。

## 素材 assets/

`assets/` 是自动生成的，**不要手动修改**。来源是 `freeskyha999-code/packs` 仓库发布页里的素材包。
重新生成：在 GitHub 的 Actions 页面运行「提取素材」（`.github/workflows/extract-assets.yml`），它调用 `tools/extract-assets.sh`。
要增减素材，改 `tools/extract-assets.sh`，再重新运行。

方块贴图的对应关系在 `js/assets.js` 的 `loadTex()`：左边是图集槽位名，右边是素材文件名。草和树叶会按平原群系染绿。

## 常见修改

- 改剧情：`js/story-data.js`。
- 新增方块：`js/atlas.js` 的 `TILES`、`GEN`、`B` 各加一项，再在 `js/assets.js` 的 `loadTex()` 里加贴图对应。
- 新增皮肤：放进 `assets/skins/` 对应目录（需重新生成），或在 `js/skins-custom.js` 里加一项（内嵌 PNG）。`f: true` 表示细臂格式。
- 新增 NPC：在 `story-data.js` 的 `npcs` 里加一项，可指定 `skin`、`g`（`"f"` 为女）。

## 给 AI 维护者的规则

1. 一次只改需要的文件，每个文件都很小，整文件替换即可。
2. 推送后必须把文件读回来和本地逐字节比对。已经发生过抄错生僻汉字的事故（例如把「瞅」抄成别的字）。文案里尽量避免生僻字。
3. 不要提交二进制素材（连接器只能写文本），素材统一走 Actions 提取。
4. 新增的代码文件要同时加进 `index.html` 里的加载列表。
5. 这个游戏用到了 Mojang 的原版素材，公开分发有版权风险，由仓库所有者决定。
