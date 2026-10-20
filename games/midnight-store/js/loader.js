// 先加载素材，再加载游戏代码。
// http(s) 模式：素材来自 assets/img、assets/mesh（可直接替换文件）。
// file:// 模式（直接双击打开）：浏览器不允许 WebGL 读本地图片，所以改用 assets/pack.js（由素材自动打包）。
(async()=>{
 const A={};
 if(location.protocol==='file:'){
  await new Promise((ok,bad)=>{const s=document.createElement('script');s.src='assets/pack.js';s.onload=ok;s.onerror=()=>bad(new Error('缺少 assets/pack.js，请先运行 tools/pack_assets.py'));document.head.appendChild(s)});
  Object.assign(A,window.GAME_PACK);
 }else{
  const meta=await (await fetch('assets/meta.json')).json();
  A.imgs=meta.imgs;A.tmir=meta.tmir;A.mesh={};
  for(const k of meta.meshes)A.mesh[k]=await (await fetch('assets/mesh/'+k+'.json')).json();
 }
 window.ASSETS=A;
 await new Promise((ok,bad)=>{const s=document.createElement('script');s.src='js/game.js';s.onload=ok;s.onerror=()=>bad(new Error('加载 js/game.js 失败'));document.body.appendChild(s)});
})().catch(e=>{document.body.insertAdjacentHTML('beforeend','<pre style="color:#f88;padding:20px;position:fixed;z-index:99;top:0">'+e.message+'</pre>')});
