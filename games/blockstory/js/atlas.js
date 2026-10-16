"use strict";
/* ============ 1. 材质图集（程序生成；用 Atlas.set(名字, 图片URL) 替换成你的材质） ============ */
const N=8,T=16,TILES=["grass_top","grass_side","dirt","stone","planks","log_side","log_top","leaves","glass","brick","lantern","wool_red"];
const H=(x,y,s)=>{const v=Math.sin(x*12.9898+y*78.233+s*37.719)*43758.5453;return v-Math.floor(v)};
const sh=(b,v,x,y,s)=>{const d=(H(x,y,s)-.5)*v;return[b[0]+d,b[1]+d,b[2]+d,255]};
const GEN={
 grass_top:(x,y)=>sh([100,165,58],40,x,y,1),
 dirt:(x,y)=>sh([134,96,67],36,x,y,2),
 grass_side:(x,y)=>y<3+(H(x,0,3)*2|0)?GEN.grass_top(x,y):GEN.dirt(x,y),
 stone:(x,y)=>sh([125,125,125],40,x,y,4),
 planks:(x,y)=>y%4==3?sh([110,85,48],20,x,y,5):sh([165,132,80],24,x,y,5),
 log_side:(x,y)=>sh(x%4==0?[78,60,36]:[104,82,50],20,x,y,6),
 log_top:(x,y)=>{const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));return sh(d>6?[90,70,42]:d%2<1?[170,140,86]:[150,120,72],14,x,y,7)},
 leaves:(x,y)=>H(x,y,8)<.18?[0,0,0,0]:sh([48,125,38],50,x,y,8),
 glass:(x,y)=>(x%15==0||y%15==0||(x==y&&x<6))?[190,225,240,255]:[0,0,0,0],
 brick:(x,y)=>{const j=((x+((y>>2)%2)*4)%8)==0;return(y%4==3||j)?sh([170,165,160],16,x,y,9):sh([150,68,58],26,x,y,9)},
 lantern:(x,y)=>(x<2||x>13||y<2||y>13)?sh([90,70,40],10,x,y,10):sh([255,214,110],30,x,y,10),
 wool_red:(x,y)=>sh([170,40,48],26,x,y,11)
};
const Atlas={cv:document.createElement("canvas"),idx:{},
 init(){this.cv.width=this.cv.height=N*T;this.ctx=this.cv.getContext("2d");TILES.forEach((n,i)=>{this.idx[n]=i;this.draw(n)});
  this.tex=new THREE.CanvasTexture(this.cv);this.tex.magFilter=this.tex.minFilter=THREE.NearestFilter;this.tex.generateMipmaps=false},
 draw(n){const i=this.idx[n],im=this.ctx.createImageData(T,T);for(let y=0;y<T;y++)for(let x=0;x<T;x++)im.data.set(GEN[n](x,y),(y*T+x)*4);this.ctx.putImageData(im,i%N*T,(i/N|0)*T)},
 set(n,src){const i=this.idx[n];if(i==null)return console.warn("没有这个材质槽:",n);const im=new Image();im.crossOrigin="anonymous";
  im.onload=()=>{const c=this.ctx,ox=i%N*T,oy=(i/N|0)*T;c.clearRect(ox,oy,T,T);c.imageSmoothingEnabled=false;c.drawImage(im,ox,oy,T,T);this.tex.needsUpdate=true;UI.hotbar()};im.src=src}};

/* ============ 2. 方块注册表（t = [顶, 侧, 底]） ============ */
const B=[null,
 {n:"grass",t:["grass_top","grass_side","dirt"]},{n:"dirt",t:["dirt"]},{n:"stone",t:["stone"]},{n:"planks",t:["planks"]},
 {n:"log",t:["log_top","log_side","log_top"]},{n:"leaves",t:["leaves"],tr:1},{n:"glass",t:["glass"],tr:1},
 {n:"brick",t:["brick"]},{n:"lantern",t:["lantern"],glow:1},{n:"wool",t:["wool_red"]}];
const ID={air:0};B.forEach((b,i)=>b&&(ID[b.n]=i));
