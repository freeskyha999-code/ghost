#!/usr/bin/env python3
"""把 assets/ 里的图片和模型打包成 assets/pack.js（给直接双击打开 index.html 用）。
改了贴图后运行一次：python3 tools/pack_assets.py"""
import json,base64,os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..');A=os.path.join(R,'assets')
meta=json.load(open(os.path.join(A,'meta.json'),encoding='utf8'));imgs={}
for k,p in meta['imgs'].items():
    ext=p.rsplit('.',1)[1];mime='image/png' if ext=='png' else 'image/jpeg'
    imgs[k]='data:%s;base64,%s'%(mime,base64.b64encode(open(os.path.join(R,p),'rb').read()).decode())
mesh={k:json.load(open(os.path.join(A,'mesh',k+'.json'))) for k in meta['meshes']}
open(os.path.join(A,'pack.js'),'w').write('window.GAME_PACK='+json.dumps({'imgs':imgs,'mesh':mesh,'tmir':meta['tmir']},separators=(',',':'))+';')
print('ok')
