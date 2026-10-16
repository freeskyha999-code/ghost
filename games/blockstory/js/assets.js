"use strict";
/* ============ 素材加载：从 assets/ 目录按需加载原版素材（贴图、皮肤、音效、BGM、太阳月亮） ============ */
const AS="assets/";
const PACK={tex:{},skins:{},snd:{},music:1};
["alex","ari","efe","kai","makena","noor","steve","sunny","zuri"].forEach(n=>{PACK.skins[n]={u:AS+"skins/wide/"+n+".png",f:false};PACK.skins[n+"_slim"]={u:AS+"skins/slim/"+n+".png",f:true}});
Object.assign(PACK.skins,typeof CUSTOM_SKINS!=="undefined"?CUSTOM_SKINS:{}); /* 自定义皮肤见 js/skins-custom.js */
const BGM=[["dry_hands","Dry Hands"],["key","Key"],["oxygene","Oxygène"],["wet_hands","Wet Hands"],["living_mice","Living Mice"],["sweden","Sweden"],["minecraft","Minecraft"],["subwoofer_lullaby","Subwoofer Lullaby"],["haggstrom","Haggstrom"],["clark","Clark"],["floating_dream","Floating Dream"],["a_familiar_room","A Familiar Room"],["mice_on_venus","Mice on Venus"],["below_and_above","Below and Above"]];
var SUNM,MOONM,BGI=-1,LG=true;
const SG={grass:"grass",dirt:"gravel",stone:"stone",planks:"wood",log:"wood",leaves:"grass",glass:"stone",brick:"stone",lantern:"stone",wool:"cloth"},SB={};
const UNDER=()=>W.get(Math.floor(P.p.x),Math.floor(P.p.y-.2),Math.floor(P.p.z));
/* 背景音乐：随机一首，边播边加载；放完隔一会儿再放下一首 */
async function bgm(){const a=ac();let i;do{i=Math.random()*BGM.length|0}while(i==BGI&&BGM.length>1);BGI=i;
 try{const r=await fetch(AS+"music/"+BGM[i][0]+".ogg");if(!r.ok)throw 0;const b=await a.decodeAudioData(await r.arrayBuffer()),n=a.createBufferSource(),g=PACK.gn||(PACK.gn=a.createGain());g.gain.value=MUTE?0:.3;g.connect(a.destination);n.buffer=b;n.connect(g);n.onended=()=>setTimeout(bgm,12000+Math.random()*25000);n.start();UI.toast("♪ "+BGM[i][1]+"（M 静音）")}
 catch(e){UI.toast("音乐加载失败，改用合成音乐");PACK.music=null;musicOn=false;music()}}
/* 挖掘/放置/脚步/起跳/落地音效 */
function playS(k,v){const l=SB[k];if(!l||MUTE)return false;try{const a=ac(),b=a.createBufferSource(),g=a.createGain();b.buffer=l[Math.random()*l.length|0];b.playbackRate.value=.92+Math.random()*.16;g.gain.value=v;b.connect(g);g.connect(a.destination);b.start();return true}catch(e){return false}}
snd.dig=n=>{if(!playS("dig_"+(SG[n]||"stone"),.6)){noise(.18,900,.2);tone(110,.12,"triangle",.08)}};
snd.land=id=>{const n=B[id]&&B[id].n;playS("step_"+(SG[n]||"stone"),.6)};
snd.stepOn=id=>{const n=B[id]&&B[id].n;if(!playS("step_"+(SG[n]||"stone"),.3))snd.step()};
async function loadSnd(){const a=ac();for(const g of["grass","gravel","stone","wood","cloth"])for(const k of["dig","step"]){const L=[];
 for(let i=1;i<=2;i++){try{const r=await fetch(`${AS}snd/${k}/${g}${i}.ogg`);if(r.ok)L.push(await a.decodeAudioData(await r.arrayBuffer()))}catch(e){}}if(L.length)SB[k+"_"+g]=L}}
/* 方块贴图：按 Atlas 槽位逐个加载；草和树叶按平原群系染绿 */
const loadImg=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u});
const tintC=(im,c)=>{const cv=document.createElement("canvas");cv.width=cv.height=16;const x=cv.getContext("2d");x.drawImage(im,0,0,im.width,im.width,0,0,16,16);x.globalCompositeOperation="multiply";x.fillStyle=c;x.fillRect(0,0,16,16);x.globalCompositeOperation="destination-in";x.drawImage(im,0,0,im.width,im.width,0,0,16,16);return cv};
async function loadTex(){const T=AS+"tex/",G="#91BD59",F="#77AB2F",m={grass_top:["grass_block_top",G],dirt:["dirt"],stone:["stone"],planks:["oak_planks"],log_side:["oak_log"],log_top:["oak_log_top"],leaves:["oak_leaves",F],glass:["glass"],brick:["bricks"],lantern:["glowstone"],wool_red:["red_wool"]};
 for(const k in m){const im=await loadImg(T+m[k][0]+".png");if(im)Atlas.set(k,m[k][1]?tintC(im,m[k][1]).toDataURL():im.src)}
 const s=await loadImg(T+"grass_block_side.png"),o=await loadImg(T+"grass_block_side_overlay.png");
 if(s&&o){const c=document.createElement("canvas");c.width=c.height=16;const x=c.getContext("2d");x.drawImage(s,0,0,16,16);x.drawImage(tintC(o,G),0,0);Atlas.set("grass_side",c.toDataURL())}}
function loadPack(){
 const L=new THREE.TextureLoader(),mk=(u,sz,c)=>{const t=L.load(u);t.magFilter=t.minFilter=THREE.NearestFilter;t.encoding=THREE.sRGBEncoding;const m=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,fog:false,color:c,blending:THREE.AdditiveBlending}));scene.add(m);return m};
 SUNM=mk(AS+"env/celestial/sun.png",34,new THREE.Color(4,3.4,2.2));MOONM=mk(AS+"env/celestial/moon/full_moon.png",26,new THREE.Color(1.6,1.7,2));
 loadTex();loadSnd()}
