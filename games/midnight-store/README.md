# 深夜便利店

## 怎么运行
- **最简单**：直接用浏览器打开 `index.html`（自动用离线包 `assets/pack.js`，不需要服务器）。
- **推荐**（文件小、加载快）：在这个文件夹里开一个静态服务器再访问，例如
  `python3 -m http.server 8000`，然后打开 `http://localhost:8000`。这种模式直接读 `assets/img` 和 `assets/mesh`。
- 请横屏游玩。第一次点“开始”才会有声音。

## 文件结构
- `index.html`：页面和样式，很小。
- `js/loader.js`：先加载素材再加载游戏。
- `js/game.js`：全部游戏代码（不含任何图片数据）。
- `lib/three.min.js`：three.js r128。
- `assets/img/`：所有贴图。`girl_*`、`clerk_*` 是人物的 正面(f)/背面(b)/侧面(s) 照片；`e_*` 是环境材质（砖、混凝土、木地板、金属、墙面、地砖、纸箱、垃圾袋、围栏）。
- `assets/mesh/`：两个人物的网格（JSON）。
- `assets/meta.json`：贴图清单。
- `assets/pack.js`：自动生成的离线包（改了素材后运行 `python3 tools/pack_assets.py` 重新生成）。

## 换贴图
直接替换 `assets/img/` 里同名文件（尺寸和格式保持一致），http 模式立刻生效；双击打开模式要重新运行一次打包脚本。
