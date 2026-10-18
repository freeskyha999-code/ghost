#!/usr/bin/env python3
"""只提取「两层别墅」场景用到的素材。
用法: villa_pack.py <素材包里的 assets/minecraft 目录> <blocks.txt> <输出目录>
blocks.txt 每行一个方块 id（由游戏代码自动统计生成）。
输出: pack.json（方块状态+模型+贴图清单）、textures/、snd/、music/、ui/
"""
import json, os, shutil, subprocess, sys

R, LIST, OUT = sys.argv[1:4]
ids = [l.strip() for l in open(LIST) if l.strip()]
S, M, T = {}, {}, set()


def model(p):
    p = p.replace('minecraft:', '')
    if p in M or p.startswith('builtin'):
        return
    d = json.load(open(f'{R}/models/{p}.json'))
    # 26.x 的贴图值可能是 {sprite: ..., force_translucent: ...}，统一成字符串
    if 'textures' in d:
        d['textures'] = {k: (v['sprite'] if isinstance(v, dict) else v) for k, v in d['textures'].items()}
    M[p] = d
    if 'parent' in d:
        model(d['parent'])
    for v in d.get('textures', {}).values():
        if not v.startswith('#'):
            T.add(v.replace('minecraft:', ''))


def refs(v):
    for x in (v if isinstance(v, list) else [v]):
        model(x['model'])


for i in ids:
    f = f'{R}/blockstates/{i}.json'
    if not os.path.exists(f):
        print('缺少方块状态:', i)
        continue
    b = json.load(open(f))
    S[i] = b
    for v in b.get('variants', {}).values():
        refs(v)
    for m in b.get('multipart', []):
        refs(m['apply'])

T = sorted(t for t in T if os.path.exists(f'{R}/textures/{t}.png'))
shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)
for t in T:
    os.makedirs(os.path.dirname(f'{OUT}/textures/{t}.png'), exist_ok=True)
    shutil.copy(f'{R}/textures/{t}.png', f'{OUT}/textures/{t}.png')
json.dump({'s': S, 'm': M, 't': T}, open(f'{OUT}/pack.json', 'w'), separators=(',', ':'))

# 准星
os.makedirs(f'{OUT}/ui')
shutil.copy(f'{R}/textures/gui/sprites/hud/crosshair.png', f'{OUT}/ui/crosshair.png')

# 音效：脚步（草/木/石/砂砾）+ 开关门
os.makedirs(f'{OUT}/snd')
for k, n in (('grass', 4), ('wood', 4), ('stone', 4), ('gravel', 4)):
    for j in range(1, n + 1):
        shutil.copy(f'{R}/sounds/step/{k}{j}.ogg', f'{OUT}/snd/{k}{j}.ogg')
for k in ('open1', 'open2', 'close1', 'close2'):
    shutil.copy(f'{R}/sounds/block/wooden_door/{k}.ogg', f'{OUT}/snd/door_{k}.ogg')

# 背景音乐：只挑几首安静的，压缩成 36kbps
os.makedirs(f'{OUT}/music')
for k in ('dry_hands', 'key', 'wet_hands', 'oxygene', 'sweden'):
    if not (shutil.which('ffmpeg') and os.path.exists(f'{R}/sounds/music/game/{k}.ogg')):
        print('跳过音乐', k)
        continue
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{R}/sounds/music/game/{k}.ogg', '-vn', '-ac', '2',
                    '-ar', '32000', '-c:a', 'libvorbis', '-b:a', '36k', f'{OUT}/music/{k}.ogg'], check=True)
print('方块', len(S), '模型', len(M), '贴图', len(T))
