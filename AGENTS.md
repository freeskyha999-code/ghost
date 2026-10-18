# 给 AI 的入口说明

这是 GHOST 游戏库的仓库。**开始任何修改前，先完整阅读 `README.md`。**

最重要的三条：

1. 仓库所有者已授权 AI 直接提交到 `main`，不需要等待确认；提交后向用户汇报改了什么，并回读校验。
2. 新增游戏通过 `games.json` 和新游戏目录里的 `meta.json` 接入。所有游戏统一使用根目录 `play.html` 启动详情页；不要为单个游戏把专属介绍或逻辑硬编码进启动器。建议按 `docs/game-launcher-architecture.md` 补齐 `meta.json` 的 `launch` 资料对象。不要修改已有游戏逻辑，除非用户明确要求。
3. 封面图（base64）绝不手抄，用脚本生成；推送后必须回读比对。

新增游戏的完整步骤、`meta.json` 字段说明和检查清单都在 `README.md`。


统一启动页的元数据字段、全屏降级、加载状态与新游戏接入方式，见 `docs/game-launcher-architecture.md`。