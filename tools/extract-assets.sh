#!/usr/bin/env bash
# 从 packs 仓库的发布页下载素材包，提取方块叙事引擎需要的文件到 games/blockstory/assets/
# 由 .github/workflows/extract-assets.yml 调用。需要环境变量 GH_TOKEN、已安装 ffmpeg、jq。
set -euo pipefail
cd "$(dirname "$0")/.."
A=games/blockstory/assets

gh release download v1 -R freeskyha999-code/packs -p 'minecraft-assets-*.zip' -O pack.zip
rm -rf tmp && mkdir -p tmp
unzip -q pack.zip \
  "*/assets/minecraft/textures/block/*" \
  "*/assets/minecraft/textures/environment/*" \
  "*/assets/minecraft/textures/entity/player/*" \
  "*/assets/minecraft/sounds/dig/*" \
  "*/assets/minecraft/sounds/step/*" \
  "*/assets/minecraft/sounds/music/game/*" \
  -d tmp || [ $? -le 1 ]

R=$(echo tmp/*/assets/minecraft)
rm -rf "$A"
mkdir -p "$A/tex" "$A/env" "$A/skins" "$A/snd" "$A/music"
cp "$R"/textures/block/*.png "$A/tex/"
cp -r "$R"/textures/environment/* "$A/env/"
cp -r "$R"/textures/entity/player/* "$A/skins/"
cp -r "$R/sounds/dig" "$A/snd/dig"
cp -r "$R/sounds/step" "$A/snd/step"

# 背景音乐：压缩成 32kHz 双声道 36kbps，体积小很多
for k in dry_hands key oxygene wet_hands living_mice sweden minecraft subwoofer_lullaby haggstrom clark floating_dream a_familiar_room mice_on_venus below_and_above; do
  ffmpeg -v error -y -i "$R/sounds/music/game/$k.ogg" -vn -ac 2 -ar 32000 -c:a libvorbis -b:a 36k "$A/music/$k.ogg"
done

# 文件清单，方便游戏按需加载
(cd games/blockstory && find assets -type f | sort | jq -R . | jq -s . > manifest.json)
rm -rf tmp pack.zip
echo "done: $(find "$A" -type f | wc -l) files"
