#!/usr/bin/env bash
# 从 packs 仓库发布页的素材包里，只提取「两层别墅」场景用到的文件到 games/mc-villa/assets/，并生成封面。
# 由 tools/extract-assets.sh 末尾调用（「提取素材」工作流）。需要 GH_TOKEN、ffmpeg、node、python3。
set -euo pipefail
cd "$(dirname "$0")/.."
A=games/mc-villa
python3 -c "import numpy,PIL" 2>/dev/null || { sudo apt-get update -y && sudo apt-get install -y python3-numpy python3-pil; }
node tools/villa_dump.js blocks $A/blocks.txt            # 方块清单由场景代码自动统计，不手写
gh release download v1 -R freeskyha999-code/packs -p 'minecraft-assets-*.zip' -O villa-pack.zip
rm -rf villa-tmp && mkdir villa-tmp && unzip -q villa-pack.zip -d villa-tmp
python3 tools/villa_pack.py villa-tmp/*/assets/minecraft $A/blocks.txt $A/assets
node tools/villa_dump.js mesh $A/assets/pack.json /tmp/mesh.bin    # 自检：缺方块/缺贴图会在这里失败
python3 tools/villa_cover.py $A/assets /tmp/mesh.bin $A/meta.json   # 封面由脚本渲染，写入 meta.json
rm -rf villa-tmp villa-pack.zip
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add $A
git commit -m "Extract villa assets" || echo "no changes"
echo "done: $(find $A/assets -type f | wc -l) files"
