'use strict';
/* 两层别墅 · 我的世界场景引擎：直接读取原版方块状态与模型 JSON，无自建形状 */
const DN=['down','up','north','south','west','east'],HZ=['north','east','south','west'];
const NV={down:[0,-1,0],up:[0,1,0],north:[0,0,-1],south:[0,0,1],west:[-1,0,0],east:[1,0,0]};
const SHD={down:.5,up:1,north:.8,south:.8,west:.6,east:.6};
const CORN={up:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]],down:[[0,0,1],[0,0,0],[1,0,0],[1,0,1]],north:[[1,1,0],[1,0,0],[0,0,0],[0,1,0]],south:[[0,1,1],[0,0,1],[1,0,1],[1,1,1]],west:[[0,1,0],[0,0,0],[0,0,1],[0,1,1]],east:[[1,1,1],[1,0,1],[1,0,0],[1,1,0]]};
const IDX=[0,1,2,0,2,3],AIR={n:'air',p:{},o:false};
const NOSOLID=/torch|dandelion|poppy|bluet|daisy|cornflower|tulip|allium|orchid|short_grass|tall_grass|fern|rose_bush|lilac|peony|sunflower|pressure_plate|button|sapling|water$|rail|cobweb|mushroom|moss_carpet|_bud$|amethyst_cluster/;
let PK=null,TILE={},AW=512,AH=16;const MISS=new Set(),mc={};

/* ---------- 模型 ---------- */
function mdl(p){p=p.replace('minecraft:','');if(mc[p])return mc[p];const m=PK.m[p];if(!m)return mc[p]={t:{},e:[]};
 const par=m.parent?mdl(m.parent):{t:{},e:[]};return mc[p]={t:Object.assign({},par.t,m.textures||{}),e:m.elements||par.e};}
function texOf(t,r){let k=0;while(r&&r[0]==='#'&&k++<9)r=t[r.slice(1)];return r?r.replace('minecraft:',''):null;}
function layout(){PK.t.forEach((t,i)=>TILE[t]=i);AW=512;AH=Math.ceil(PK.t.length/32)*16;}
function uvPx(t,u,v){const i=TILE[t],cx=(i%32)*16,cy=((i/32)|0)*16,c=a=>Math.min(15.98,Math.max(.02,a));return[(cx+c(u))/AW,(cy+c(v))/AH];}
function match(k,p){if(!k)return true;return k.split(',').every(s=>{const[a,b]=s.split('=');return String(p[a])===b;});}
function when(w,p){if(w.OR)return w.OR.some(x=>when(x,p));if(w.AND)return w.AND.every(x=>when(x,p));return Object.entries(w).every(([k,v])=>String(v).split('|').includes(String(p[k])));}
function parts(n,p){const bs=PK.s[n],o=[];if(!bs)return o;
 if(bs.variants){for(const k in bs.variants)if(match(k,p)){const v=bs.variants[k];o.push(Array.isArray(v)?v[0]:v);break;}}
 else for(const pt of bs.multipart)if(!pt.when||when(pt.when,p)){const v=pt.apply;o.push(Array.isArray(v)?v[0]:v);}
 return o;}
/* 旋转：与原版 blockstate 的 x/y 一致（先 x 后 y，绕方块中心） */
function rX(v,a,c=8){const r=a*Math.PI/180,s=Math.round(Math.sin(r)),k=Math.round(Math.cos(r)),y=v[1]-c,z=v[2]-c;return[v[0],y*k+z*s+c,-y*s+z*k+c];}
function rY(v,a,c=8){const r=a*Math.PI/180,s=Math.round(Math.sin(r)),k=Math.round(Math.cos(r)),x=v[0]-c,z=v[2]-c;return[x*k-z*s+c,v[1],x*s+z*k+c];}
function rd(d,rx,ry){const v=rY(rX(NV[d],rx,0),ry,0);return DN.find(k=>NV[k].every((c,i)=>c===Math.round(v[i])));}
function rE(P,er){const o=er.origin,a=er.angle*Math.PI/180,s=Math.sin(a),c=Math.cos(a),k=er.rescale?1/c:1;let x=P[0]-o[0],y=P[1]-o[1],z=P[2]-o[2];
 if(er.axis==='y'){[x,z]=[(x*c-z*s)*k,(x*s+z*c)*k];}else if(er.axis==='x'){[y,z]=[(y*c+z*s)*k,(-y*s+z*c)*k];}else{[x,y]=[(x*c-y*s)*k,(x*s+y*c)*k];}
 return[x+o[0],y+o[1],z+o[2]];}
function bake(n,p){const q=[],box=[];let full=false;
 const fl=n==='water'||n==='lava',list=fl?[{}]:parts(n,p);
 for(const v of list){const m=fl?{t:{t:'block/'+n+'_still'},e:[{from:[0,0,0],to:[16,p.top==='true'?14:16,16],faces:Object.fromEntries(DN.map(d=>[d,{texture:'#t',cullface:d,tintindex:n==='water'?0:undefined}]))}]}:mdl(v.model),rx=v.x||0,ry=v.y||0;
  for(const el of m.e){const[x1,y1,z1]=el.from,[x2,y2,z2]=el.to,er=el.rotation;
   if(!er){if(x1==0&&y1==0&&z1==0&&x2==16&&y2==16&&z2==16)full=true;const a=rY(rX([x1,y1,z1],rx),ry),b=rY(rX([x2,y2,z2],rx),ry);
    box.push([Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.min(a[2],b[2]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[2],b[2])]);}
   const dU={north:[16-x2,16-y2,16-x1,16-y1],south:[x1,16-y2,x2,16-y1],west:[z1,16-y2,z2,16-y1],east:[16-z2,16-y2,16-z1,16-y1],up:[x1,z1,x2,z2],down:[x1,16-z2,x2,16-z1]};
   for(const d in el.faces){const f=el.faces[d],tp=texOf(m.t,f.texture);if(TILE[tp]===undefined){MISS.add(tp);continue;}
    const[u1,v1,u2,v2]=f.uv||dU[d];let uc=[[u1,v1],[u1,v2],[u2,v2],[u2,v1]];const r=((f.rotation||0)/90)|0;uc=uc.map((_,i)=>uc[(i+r)%4]);
    const vs=CORN[d].map((c,i)=>{let P=[c[0]?x2:x1,c[1]?y2:y1,c[2]?z2:z1];if(er)P=rE(P,er);P=rY(rX(P,rx),ry);return{p:P,t:uvPx(tp,uc[i][0],uc[i][1])};});
    q.push({v:vs,d:rd(d,rx,ry),c:f.cullface?rd(f.cullface,rx,ry):null,t:f.tintindex!==undefined||/water/.test(tp),k:tp});}}}
 return{q,box,full};}
function bk(s){return s.b||(s.b=bake(s.n,s.p));}
function opq(s){if(s.o===undefined)s.o=s.n==='air'?false:bk(s).full&&!/glass|leaves|ice|slime|honey|water|lava/.test(s.n);return s.o;}
function tint(n,k){if(/water/.test(k))return[.25,.46,.89];if(/spruce_leaves/.test(n))return[.38,.6,.38];if(/birch_leaves/.test(n))return[.5,.65,.33];if(/leaves/.test(n))return[.47,.67,.18];return[.57,.74,.35];}

/* ---------- 世界 ---------- */
class World{constructor(){this.W=96;this.H=64;this.D=96;this.c=new Uint16Array(this.W*this.H*this.D);this.pal=[AIR];this.pk={air:0};}
 id(n,p){if(n==='air')return 0;const k=n+(p?'['+Object.keys(p).sort().map(a=>a+'='+p[a]).join(',')+']':'');if(!(k in this.pk)){this.pk[k]=this.pal.length;this.pal.push({n,p:p||{}});}return this.pk[k];}
 in(x,y,z){return x>=0&&y>=0&&z>=0&&x<this.W&&y<this.H&&z<this.D;}
 get(x,y,z){return this.in(x,y,z)?this.pal[this.c[(y*this.D+z)*this.W+x]]:AIR;}
 set(x,y,z,n,p){if(this.in(x,y,z))this.c[(y*this.D+z)*this.W+x]=this.id(n,p);}
 fill(x1,y1,z1,x2,y2,z2,n,p){const i=this.id(n,p);for(let y=y1;y<=y2;y++)for(let z=z1;z<=z2;z++)for(let x=x1;x<=x2;x++)if(this.in(x,y,z))this.c[(y*this.D+z)*this.W+x]=i;}
 top(x,z){for(let y=this.H-1;y>=0;y--)if(this.get(x,y,z).n!=='air')return y;return 0;}
 /* 楼梯拐角形状、玻璃板/栅栏连接：与原版规则一致 */
 fix(){const st=s=>/_stairs$/.test(s.n),ccw={north:'west',west:'south',south:'east',east:'north'},ax=d=>d==='north'||d==='south'?'z':'x',op={north:'south',south:'north',east:'west',west:'east'};
  for(let y=0;y<this.H;y++)for(let z=0;z<this.D;z++)for(let x=0;x<this.W;x++){const s=this.get(x,y,z);if(s.n==='air')continue;let np=null;
   if(st(s)){const f=s.p.facing,h=s.p.half,[fx,,fz]=NV[f],a=this.get(x+fx,y,z+fz),b=this.get(x-fx,y,z-fz);
    const can=face=>{const[dx,,dz]=NV[face],o=this.get(x+dx,y,z+dz);return!(st(o)&&o.p.facing===f&&o.p.half===h);};let sh='straight';
    if(st(a)&&a.p.half===h&&ax(a.p.facing)!==ax(f)&&can(op[a.p.facing]))sh=a.p.facing===ccw[f]?'outer_left':'outer_right';
    else if(st(b)&&b.p.half===h&&ax(b.p.facing)!==ax(f)&&can(b.p.facing))sh=b.p.facing===ccw[f]?'inner_left':'inner_right';
    np={...s.p,shape:sh};}
   else if(/glass_pane$|iron_bars$|_fence$/.test(s.n)){np={...s.p};const pane=!/_fence$/.test(s.n);
    for(const d of HZ){const[dx,,dz]=NV[d],t=this.get(x+dx,y,z+dz);np[d]=String(opq(t)||(pane?/glass_pane$|iron_bars$|_wall$|glass$/.test(t.n):/_fence$|_fence_gate$/.test(t.n)));}}
   else if(s.n==='water'||s.n==='lava')np={top:String(this.get(x,y+1,z).n!==s.n)};
   if(np)this.set(x,y,z,s.n,np);}}}

/* ---------- 光照（天空光 + 方块光，洪水填充） ---------- */
const EMIT=s=>/^(lava|glowstone|sea_lantern)$/.test(s.n)?15:/^(torch|wall_torch|lantern|jack_o_lantern|shroomlight|campfire)$/.test(s.n)?14:s.n==='redstone_lamp'&&s.p.lit==='true'?15:/^(furnace|smoker)$/.test(s.n)&&s.p.lit==='true'?13:s.n==='amethyst_cluster'?5:s.n==='large_amethyst_bud'?4:s.n==='magma_block'?3:0;
function light(w){const W=w.W,H=w.H,D=w.D,N=W*H*D,SK=new Uint8Array(N),BK=new Uint8Array(N),op=new Uint8Array(N),qs=[],qb=[];
 for(let i=0;i<N;i++){const id=w.c[i];if(id){const s=w.pal[id];if(opq(s))op[i]=1;const e=EMIT(s);if(e){BK[i]=e;qb.push(i);}}}
 for(let z=0;z<D;z++)for(let x=0;x<W;x++)for(let y=H-1;y>=0;y--){const i=(y*D+z)*W+x;if(op[i])break;SK[i]=15;qs.push(i);}
 const nb=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
 const spread=(A,Q,sky)=>{for(let h=0;h<Q.length;h++){const i=Q[h],l=A[i];if(l<2)continue;const x=i%W,z=((i/W)|0)%D,y=(i/(W*D))|0;
  for(const[a,b,c]of nb){const X=x+a,Y=y+b,Z=z+c;if(X<0||Y<0||Z<0||X>=W||Y>=H||Z>=D)continue;const j=(Y*D+Z)*W+X;if(op[j])continue;const nl=sky&&b<0&&l===15?15:l-1;if(nl>A[j]){A[j]=nl;Q.push(j);}}}};
 spread(SK,qs,true);spread(BK,qb,false);return{SK,BK};}

/* ---------- 网格 ---------- */
class VB{constructor(){this.a=new Float32Array(1<<21);this.n=0;}
 add(x,y,z,u,v,r,g,b,s,l){if(this.n+10>this.a.length){const t=new Float32Array(this.a.length*2);t.set(this.a);this.a=t;}const a=this.a,n=this.n;a[n]=x;a[n+1]=y;a[n+2]=z;a[n+3]=u;a[n+4]=v;a[n+5]=r;a[n+6]=g;a[n+7]=b;a[n+8]=s;a[n+9]=l;this.n=n+10;}
 done(){return this.a.slice(0,this.n);}}
function build(w,L){const O=new VB(),T=new VB(),W=w.W,D=w.D,{SK,BK}=L;
 for(let y=0;y<w.H;y++)for(let z=0;z<D;z++)for(let x=0;x<W;x++){const own=(y*D+z)*W+x,id=w.c[own];if(!id)continue;
  const s=w.pal[id],b=bk(s),out=/water/.test(s.n)?T:O;
  for(const q of b.q){
   if(q.c){const v=NV[q.c],t=w.get(x+v[0],y+v[1],z+v[2]);if(opq(t)||(t.n===s.n&&/glass$|water|lava/.test(s.n)))continue;}
   const v=NV[q.d],X=x+v[0],Y=y+v[1],Z=z+v[2];let sk=SK[own],bl=BK[own];
   if(w.in(X,Y,Z)){const j=(Y*D+Z)*W+X;sk=Math.max(sk,SK[j]);bl=Math.max(bl,BK[j]);}
   const sh=SHD[q.d],c=q.t?tint(s.n,q.k):[1,1,1];
   for(const i of IDX){const e=q.v[i];out.add(x+e.p[0]/16,y+e.p[1]/16,z+e.p[2]/16,e.t[0],e.t[1],c[0]*sh,c[1]*sh,c[2]*sh,sk/15,bl/15);}}}
 return{O:O.done(),T:T.done()};}

/* ---------- 矩阵 ---------- */
function persp(f,a,n,r){const t=1/Math.tan(f/2);return[t/a,0,0,0,0,t,0,0,0,0,(r+n)/(n-r),-1,0,0,2*r*n/(n-r),0];}
function view(e,yaw,pit){const cp=Math.cos(pit),sp=Math.sin(pit),f=[-Math.sin(yaw)*cp,sp,-Math.cos(yaw)*cp];let rx=-f[2],rz=f[0];const l=Math.hypot(rx,rz);rx/=l;rz/=l;const r=[rx,0,rz],u=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]];
 return[r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-(r[0]*e[0]+r[1]*e[1]+r[2]*e[2]),-(u[0]*e[0]+u[1]*e[1]+u[2]*e[2]),f[0]*e[0]+f[1]*e[1]+f[2]*e[2],1];}
function mul(a,b){const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;}

/* ---------- 碰撞 ---------- */
function makePhys(w,P){
 const boxes=(x,y,z)=>{const s=w.get(x,y,z);return s.n==='air'||NOSOLID.test(s.n)?null:bk(s).box;};
 const hit=(px,py,pz)=>{for(let y=Math.floor(py);y<=Math.floor(py+1.79);y++)for(let z=Math.floor(pz-.3);z<=Math.floor(pz+.3);z++)for(let x=Math.floor(px-.3);x<=Math.floor(px+.3);x++){const bs=boxes(x,y,z);if(!bs)continue;
  for(const b of bs)if(px-.3<x+b[3]/16&&px+.3>x+b[0]/16&&py<y+b[4]/16&&py+1.8>y+b[1]/16&&pz-.3<z+b[5]/16&&pz+.3>z+b[2]/16)return true;}return false;};
 const mv=(ax,d)=>{const n=Math.max(1,Math.ceil(Math.abs(d)/.1)),c=d/n;for(let i=0;i<n;i++){P[ax]+=c;if(hit(P.x,P.y,P.z)){
   if(ax!=='y'&&P.g0){let ok=false;for(const h of[.1,.3,.6]){P.y+=h;if(!hit(P.x,P.y,P.z)){ok=true;break;}P.y-=h;}if(ok)continue;}
   P[ax]-=c;if(ax==='y'){if(d<0)P.g=true;P.vy=0;}return;}}};
 return{hit,mv};}

/* ---------- 浏览器端：渲染、输入、音频 ---------- */
function boot(){
 const $=id=>document.getElementById(id),cv=$('cv'),gl=cv.getContext('webgl',{antialias:false});
 const say=t=>$('ld').textContent=t;
 const P={x:39.5,y:33,z:49.5,ey:33,yaw:0,pitch:0,vy:0,g:false,g0:false},I={f:0,r:0,jump:0,run:0};
 let W,mesh={},sun=1,ac=null,SND={},started=false,acc=0,under=0,hasFl=false,flOn=false,hinted=false,amb=6,drp=3,tick=0,PU=[0,0,0],bgS,bgC,cn;
 const FP={lava:[],water:[]},LP={};
 const toast=t=>{const e=$('tt');e.textContent=t;e.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.opacity=0,3500);};
 async function load(){
  say('读取原版方块与模型…');PK=await(await fetch('assets/pack.json')).json();layout();
  say('拼合贴图图集…');const at=document.createElement('canvas');at.width=AW;at.height=AH;const g=at.getContext('2d');
  await Promise.all(PK.t.map(t=>new Promise(r=>{const im=new Image();im.onload=()=>{const i=TILE[t];g.drawImage(im,0,0,im.width,im.width,(i%32)*16,((i/32)|0)*16,16,16);r();};im.onerror=r;im.src='assets/textures/'+t+'.png';})));
  say('搭建别墅与矿洞…');W=new World();buildVilla(W);W.fix();
  say('计算光照…');const L=light(W);say('生成网格…');mesh=build(W,L);W.L=L;
  const fk={};W.pal.forEach((s,i)=>{if(s.n==='lava'||s.n==='water')fk[i]=s.n;});let c=0;
  for(let i=0;i<W.c.length;i++){const k=fk[W.c[i]];if(k&&(++c%5===0)){const x=i%W.W,z=((i/W.W)|0)%W.D,y=(i/(W.W*W.D))|0;FP[k].push([x+.5,y,z+.5]);}}
  const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,at);
  for(const[a,b]of[[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,a,b);
  upload();if(MISS.size)console.warn('缺少贴图',[...MISS]);
 }
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;};
 const pr=gl.createProgram();
 gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec3 a;attribute vec2 u;attribute vec3 c;attribute vec2 l;uniform mat4 M;varying vec2 vu;varying vec3 vc;varying vec2 vl;varying float vd;varying vec3 vp;void main(){gl_Position=M*vec4(a,1.);vu=u;vc=c;vl=l;vd=gl_Position.w;vp=a;}'));
 gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D T;uniform float S,A,N,F,L,G;uniform vec3 K,E,D;varying vec2 vu;varying vec3 vc;varying vec2 vl;varying float vd;varying vec3 vp;void main(){vec4 t=texture2D(T,vu);if(t.a<.1)discard;float b=max(vl.x*S,vl.y);b=G+(1.-G)*b*b;vec3 r=vp-E;float dd=length(r);float c=dot(r/max(dd,.001),D);float sp=smoothstep(.82,.95,c)*clamp(1.-dd/30.,0.,1.)*L;b=max(b,sp*.9);vec3 o=t.rgb*vc*b;gl_FragColor=vec4(mix(o,K,clamp((vd-N)/(F-N),0.,1.)),t.a*A);}'));
 gl.linkProgram(pr);gl.useProgram(pr);
 const loc=n=>gl.getAttribLocation(pr,n),un=n=>gl.getUniformLocation(pr,n),vb={O:gl.createBuffer(),T:gl.createBuffer()};
 function upload(){for(const k of['O','T']){gl.bindBuffer(gl.ARRAY_BUFFER,vb[k]);gl.bufferData(gl.ARRAY_BUFFER,mesh[k],gl.STATIC_DRAW);}}
 function draw(k,alpha){const n=mesh[k].length/10;if(!n)return;gl.bindBuffer(gl.ARRAY_BUFFER,vb[k]);
  [['a',3,0],['u',2,3],['c',3,5],['l',2,8]].forEach(([nm,sz,off])=>{const l=loc(nm);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,sz,gl.FLOAT,false,40,off*4);});
  gl.uniform1f(un('A'),alpha);gl.drawArrays(gl.TRIANGLES,0,n);}
 const SKY=[[.53,.74,.96],[.03,.05,.12]],DARK=[.012,.012,.018],mix=(a,b,t)=>a+(b-a)*t;
 function frame(){const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);if(cv.width!==(w*dpr|0)){cv.width=w*dpr|0;cv.height=h*dpr|0;}
  gl.viewport(0,0,cv.width,cv.height);const s0=SKY[sun>.5?0:1],k=[0,1,2].map(i=>mix(s0[i],DARK[i],under));gl.clearColor(k[0],k[1],k[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  const e=[P.x,P.ey+1.62,P.z],cp=Math.cos(P.pitch),M=mul(persp(1.2,w/h,.05,300),view(e,P.yaw,P.pitch));
  gl.uniformMatrix4fv(un('M'),false,new Float32Array(M));gl.uniform1f(un('S'),sun);gl.uniform1f(un('N'),mix(55,12,under));gl.uniform1f(un('F'),mix(95,46,under));gl.uniform3fv(un('K'),k);gl.uniform1i(un('T'),0);
  gl.uniform3fv(un('E'),e);gl.uniform3fv(un('D'),[-Math.sin(P.yaw)*cp,Math.sin(P.pitch),-Math.cos(P.yaw)*cp]);gl.uniform1f(un('L'),hasFl&&flOn?1:0);gl.uniform1f(un('G'),mix(.06,.02,under));
  draw('O',1);gl.depthMask(false);draw('T',.7);gl.depthMask(true);}
 /* 物理 */
 let ph;
 function step(dt){const sw=W.get(Math.floor(P.x),Math.floor(P.y+.5),Math.floor(P.z)).n==='water',sp=((I.run||K.ShiftLeft)?5.6:4.3)*(sw?.55:1),s=Math.sin(P.yaw),c=Math.cos(P.yaw),vx=(-s*I.f+c*I.r)*sp,vz=(-c*I.f-s*I.r)*sp;
  P.vy=Math.max(-40,P.vy-(sw?6:30)*dt);if(sw){P.vy=Math.max(P.vy,-1.5);if(I.jump||K.Space)P.vy=4;}else if((I.jump||K.Space)&&P.g)P.vy=9;P.g0=P.g;P.g=false;
  ph.mv('x',vx*dt);ph.mv('z',vz*dt);ph.mv('y',P.vy*dt);P.x=Math.min(Math.max(P.x,6),W.W-6);P.z=Math.min(Math.max(P.z,6),W.D-6);
  if(P.y<-5)P.y=40;
  /* 视角平滑：踩上地毯、小路、台阶时不再一顿一顿 */
  if(P.g&&Math.abs(P.y-P.ey)<.9)P.ey+=(P.y-P.ey)*Math.min(1,dt*18);else P.ey=P.y;
  if(P.g&&(vx||vz)){acc+=Math.hypot(vx,vz)*dt;if(acc>1.7){acc=0;const b=W.get(Math.floor(P.x),Math.floor(P.y-.05),Math.floor(P.z)).n;
   snd((/grass|dirt$|leaves|moss/.test(b)?'grass':/gravel|path|tuff|andesite|granite|diorite/.test(b)?'gravel':/planks|log|door|fence|bookshelf|barrel|wool|carpet/.test(b)?'wood':'stone')+(1+(Math.random()*4|0)),.5);}}
  /* 地下氛围：越深越暗，BGM 渐变，环境音 */
  under+=(Math.max(0,Math.min(1,(buildVilla.surface-.2-P.y)/3.5))-under)*Math.min(1,dt*1.5);
  if(bgS)bgS.volume=.35*(1-under);if(bgC)bgC.volume=.5*under;
  if(!hasFl&&!hinted&&Math.hypot(P.x-PU[0],P.z-PU[2])<6&&Math.abs(P.y-PU[1])<3){hinted=true;toast('洞口旁边有个木桶，对准它点「开关」看看');}
  if(ac&&under>.4){amb-=dt;drp-=dt;
   if(amb<=0){amb=9+Math.random()*16;const n='cave'+(1+(Math.random()*12|0));loadSnd(n).then(()=>snd(n,.5*under));}
   if(drp<=0){drp=2+Math.random()*5;const n='drip'+(1+(Math.random()*8|0));loadSnd(n).then(()=>snd(n,.45*under,.9+Math.random()*.2));}
   if((tick+=dt)>.4){tick=0;for(const k of['lava','water']){let d=99;for(const q of FP[k]){const m=Math.hypot(q[0]-P.x,q[1]-P.y,q[2]-P.z);if(m<d)d=m;}loadSnd(k).then(()=>loop(k,Math.max(0,1-d/(k==='lava'?14:12))*(k==='lava'?.6:.5)*under));}}}}
 function use(){const e=[P.x,P.ey+1.62,P.z],d=[-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch)];
  for(let t=.1;t<5;t+=.05){const x=Math.floor(e[0]+d[0]*t),y=Math.floor(e[1]+d[1]*t),z=Math.floor(e[2]+d[2]*t),s=W.get(x,y,z);
   if(!hasFl&&x===PU[0]&&y===PU[1]&&z===PU[2]){hasFl=flOn=true;$('bf').style.display='block';W.set(x,y,z,'barrel',{facing:'up',open:'true'});mesh=build(W,W.L);upload();snd('pop',.8);snd('barrel_open',.8);toast('获得了手电筒！点右侧的 🔦 开关');return;}
   if(/_door$|_trapdoor$|_fence_gate$/.test(s.n)){const o=String(s.p.open!=='true'),np={...s.p,open:o};W.set(x,y,z,s.n,np);
    if(/_door$/.test(s.n)){const y2=s.p.half==='lower'?y+1:y-1,t2=W.get(x,y2,z);if(t2.n===s.n)W.set(x,y2,z,s.n,{...t2.p,open:o});}
    snd('door_'+(o==='true'?'open':'close')+(1+(Math.random()*2|0)),.8);mesh=build(W,W.L);upload();return;}
   if(opq(s))return;}}
 function flash(){if(!hasFl)return;flOn=!flOn;snd('click',.7);}
 /* 音频（全部是原版音频文件，没有合成） */
 async function loadSnd(n){if(!ac||SND[n]!==undefined)return;SND[n]=null;try{SND[n]=await ac.decodeAudioData(await(await fetch('assets/snd/'+n+'.ogg')).arrayBuffer());}catch(e){}}
 function snd(n,v,rate){if(!ac||!SND[n])return;const s=ac.createBufferSource(),g=ac.createGain();s.buffer=SND[n];if(rate)s.playbackRate.value=rate;g.gain.value=v;s.connect(g).connect(ac.destination);s.start();}
 function loop(n,v){if(!ac||!SND[n])return;let o=LP[n];if(!o){const s=ac.createBufferSource(),g=ac.createGain();s.buffer=SND[n];s.loop=true;g.gain.value=0;s.connect(g).connect(ac.destination);s.start();o=LP[n]={g};}o.g.gain.value=v;}
 async function audio(){try{ac=new(window.AudioContext||window.webkitAudioContext)();const names=['click','pop','barrel_open'];for(const k of['grass','wood','stone','gravel'])for(let i=1;i<=4;i++)names.push(k+i);for(const k of['open1','open2','close1','close2'])names.push('door_'+k);
  await Promise.all(names.map(loadSnd));}catch(e){}
  const tr=['dry_hands','key','wet_hands','oxygene','sweden'];let i=0;bgS=new Audio();bgS.volume=.35;const nx=()=>{bgS.src='assets/music/'+tr[i++%tr.length]+'.ogg';bgS.play().catch(()=>{});};bgS.onended=nx;nx();
  const ct=['deeper','infinite_amethyst','ancestry'];let j=0;bgC=new Audio();bgC.volume=0;cn=()=>{bgC.src='assets/music/'+ct[j++%ct.length]+'.ogg';bgC.play().catch(()=>{});};bgC.onended=cn;cn();}
 /* 输入 */
 const K={};let jp=null,lp=null;const jr=$('jr'),jk=$('jk');
 addEventListener('pointerdown',e=>{if(!started||e.target.closest('button,a'))return;
  if(e.clientX<innerWidth*.45&&!jp){jp={id:e.pointerId,x:e.clientX,y:e.clientY};jr.style.cssText='display:block;left:'+(e.clientX-50)+'px;top:'+(e.clientY-50)+'px';}
  else if(e.clientX>=innerWidth*.45&&!lp)lp={id:e.pointerId,x:e.clientX,y:e.clientY};});
 addEventListener('pointermove',e=>{if(jp&&e.pointerId===jp.id){let dx=(e.clientX-jp.x)/45,dy=(e.clientY-jp.y)/45;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}I.r=dx;I.f=-dy;I.run=l>1.2?1:0;jk.style.transform='translate('+dx*30+'px,'+dy*30+'px)';}
  else if(lp&&e.pointerId===lp.id){P.yaw-=(e.clientX-lp.x)*.006;P.pitch=Math.max(-1.5,Math.min(1.5,P.pitch-(e.clientY-lp.y)*.006));lp.x=e.clientX;lp.y=e.clientY;}
  else if(document.pointerLockElement){P.yaw-=e.movementX*.0022;P.pitch=Math.max(-1.5,Math.min(1.5,P.pitch-e.movementY*.0022));}});
 const up=e=>{if(jp&&e.pointerId===jp.id){jp=null;I.f=I.r=I.run=0;jr.style.display='none';jk.style.transform='';}if(lp&&e.pointerId===lp.id)lp=null;};
 addEventListener('pointerup',up);addEventListener('pointercancel',up);
 addEventListener('keydown',e=>{K[e.code]=1;if(e.code==='KeyE')use();if(e.code==='KeyF')flash();key();});addEventListener('keyup',e=>{K[e.code]=0;key();});
 function key(){if(!jp){I.f=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0);I.r=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0);}}
 $('bj').onpointerdown=e=>{I.jump=1;e.preventDefault();};$('bj').onpointerup=$('bj').onpointercancel=()=>{I.jump=0;};
 $('bu').onpointerdown=e=>{use();e.preventDefault();};
 $('bf').onpointerdown=e=>{flash();e.preventDefault();};
 $('bs').onpointerdown=e=>{sun=sun>.5?.14:1;$('bs').textContent=sun>.5?'☀':'☾';e.preventDefault();};
 cv.addEventListener('click',e=>{if(e.pointerType==='mouse'&&started)cv.requestPointerLock&&cv.requestPointerLock();});
 $('go').onclick=async()=>{started=true;$('st').style.display='none';try{await document.documentElement.requestFullscreen();await screen.orientation.lock('landscape');}catch(e){}audio();};
 let t0=0;function loopf(t){const dt=Math.min(.05,(t-t0)/1000||0);t0=t;step(dt);frame();requestAnimationFrame(loopf);}
 load().then(()=>{ph=makePhys(W,P);const s=buildVilla.spawn;P.x=s[0];P.y=P.ey=s[1];P.z=s[2];P.yaw=s[3];PU=buildVilla.pickup;$('ld').style.display='none';$('go').style.display='block';requestAnimationFrame(loopf);}).catch(e=>{say('加载失败：'+e.message);console.error(e);});
}
if(typeof module!=='undefined')module.exports={World,bake,build,light,opq,makePhys,layout,setPK:p=>{PK=p;},MISS,parts,bk};
