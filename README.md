# GHOST · 游戏库

纯静态网站，部署在 GitHub Pages：https://freeskyha999-code.github.io/ghost/

每个游戏是一个独立文件夹，首页由数据自动生成。**新增游戏不需要修改 `index.html`。**

## 目录结构

```
index.html            首页（只负责显示，读取 games.json 和各游戏的 meta.json）
games.json            游戏登记表 + 标签中文名
games/<游戏>/          游戏文件夹（index.html 是游戏入口，meta.json 是游戏资料）
roulette/<游戏>/       同上（历史目录，保持原样，不要搬动）
script-mode/          独立的剧本模式工具，与游戏库首页无关，默认不要改
```

## 新增一个游戏（照这个做）

1. 在 `games/` 下建文件夹，**文件夹名用英文小写**（如 `games/my-game/`），里面放游戏入口 `index.html`。
2. 在同一文件夹放 `meta.json`（格式见下）。
3. 打开根目录 `games.json`，在 `games` 数组里加一行路径，如 `"games/my-game"`。
4. 如果用了新标签，在 `games.json` 的 `tags` 里补上「标签代号: 中文名」。
5. 提交。过一两分钟 Pages 部署完成，首页自动出现新卡片。

游戏页里请放一个返回链接：`<a href="../../">← 游戏库</a>`（游戏在二级目录时）。

## meta.json 格式

```json
{
  "name": "游戏中文名",
  "en": "ENGLISH NAME",
  "desc": "一两句话简介，会在卡片上显示两行。",
  "tags": ["horror", "strategy"],
  "status": "可玩",
  "platform": ["电脑", "手机"],
  "cover": "data:image/webp;base64,....",
  "added": "2026-10-14",
  "featured": false
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| name | 是 | 卡片标题 |
| en | 否 | 英文名，小字显示 |
| desc | 是 | 简介 |
| tags | 是 | 标签代号数组，代号要在 `games.json` 的 `tags` 里有中文名，否则直接显示代号 |
| status | 否 | `可玩`（绿点）或 `开发中`（黄点），默认 `可玩` |
| platform | 否 | 显示在卡片底部 |
| cover | 是 | 封面图，见下 |
| added | 否 | `YYYY-MM-DD`，决定「最新加入」排序 |
| featured | 否 | `true` 则成为首页大图精选。**同一时间只给一个游戏设 true**，没人设置时取列表第一个 |

### 封面规则

- 封面写成 **data URI**（`data:image/webp;base64,...`），直接放在 `meta.json` 里，不需要单独的图片文件。
- `cover` 也可以写成**字符串数组**（每项一小段），首页会自动拼接。长图建议每 100 字符一项，便于核对。
- 推荐 16:10 或正方形，webp，300–700px，体积尽量小于 30KB。
- **绝对不要手抄 base64。** 用脚本从图片生成，写文件时用工具直接写入，不要靠肉眼复制，一个字符出错整张图就废了（这个事故发生过）。

## 给 AI 维护者的规则

1. **仓库所有者已授权：AI 可以直接提交到 `main`，不需要等待确认。** 但每次提交后要向用户说明改了什么，并完成第 5 条的回读校验。
2. 不要修改已有游戏文件夹里的内容，除非用户明确要求改那个游戏。
3. 不要把游戏卡片写死到 `index.html`，只改 `games.json` 和 `meta.json`。
4. 不要移动或重命名已有游戏文件夹（链接和缓存会失效）。
5. 每次推送后必须校验：把仓库里的文件下载回来，和本地逐字节比对（`cmp`）；封面图用图片库实际解码一次，确认能打开。
6. `meta.json` 和 `games.json` 必须是合法 JSON（不能有注释、不能有尾逗号）。推送前用 JSON 解析器检查。
7. 中文路径可以存在（历史游戏就是），新游戏请用英文文件夹名。
8. 首页用 `fetch` 读取 JSON，**直接双击打开本地文件会显示「加载失败」**，要本地预览请先启动静态服务（如 `python3 -m http.server`）。

## 推送前检查清单

- [ ] `games.json` 是合法 JSON，新路径已加入
- [ ] 新文件夹里有 `index.html` 和 `meta.json`
- [ ] `meta.json` 的 `cover` 由脚本生成，能解码出图片
- [ ] 标签代号都在 `games.json` 的 `tags` 里
- [ ] 只有一个 `featured: true`
- [ ] 推送后已回读比对，结果一致

## 不在这里的东西

- `script-mode/`：独立的剧本模式/导演模式创作工具，有自己的说明，默认不要修改。
- `.bootstrap/`：初始化相关文件，不要动。
