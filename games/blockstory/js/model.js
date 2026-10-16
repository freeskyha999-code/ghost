"use strict";
/* ============ 原版玩家模型（Steve 粗臂 / Alex 细臂，支持 64x64 与旧版 64x32 皮肤） ============ */
const PX=.05625;
function boxUV(g,w,h,d,u,v){const f=[[u+d+w,v+d,d,h],[u,v+d,d,h],[u+d,v,w,d],[u+d+w,v,w,d],[u+d,v+d,w,h],[u+2*d+w,v+d,w,h]],uv=g.attributes.uv;
 f.forEach(([x,y,a,b],i)=>{const x0=x/64,x1=(x+a)/64,y0=1-y/64,y1=1-(y+b)/64;uv.setXY(i*4,x0,y0);uv.setXY(i*4+1,x1,y0);uv.setXY(i*4+2,x0,y1);uv.setXY(i*4+3,x1,y1)});uv.needsUpdate=true}
function part(mat,w,h,d,u,v,inf,x,y){const g=new THREE.BoxGeometry((w+inf)*PX,(h+inf)*PX,(d+inf)*PX);boxUV(g,w,h,d,u,v);const m=new THREE.Mesh(g,mat);m.castShadow=true;m.position.set(x*PX,y*PX,0);return m}
function mkPlayer(mat,slim){const G=new THREE.Group(),aw=slim?3:4,L={},O=[],ov=(P,w,h,d,u,v,t,x,y)=>{const g=new THREE.Group();g.position.set(x*PX,y*PX,0);P.add(g);O.push({g,w,h,d,u,v,t})};
 const limb=(n,w,u,v,u2,v2,px,py,cy)=>{const j=new THREE.Group();j.position.set(px*PX,py*PX,0);j.add(part(mat,w,12,4,u,v,0,0,cy));ov(j,w,12,4,u2,v2,.5,0,cy);G.add(j);L[n]=j};
 G.add(part(mat,8,8,8,0,0,0,0,28),part(mat,8,12,4,16,16,0,0,18));ov(G,8,8,8,32,0,1,0,28);ov(G,8,12,4,16,32,.5,0,18);
 limb("ra",aw,40,16,40,32,-(4+aw/2),22,-4);limb("la",aw,32,48,48,48,4+aw/2,22,-4);limb("rl",4,0,16,0,32,-2,12,-6);limb("ll",4,16,48,0,48,2,12,-6);
 G.userData.L=L;G.userData.O=O;return G}
function mirrorOld(x){const fl=(sx,sy,w,h,dx,dy)=>{x.save();x.translate(dx+w,dy);x.scale(-1,1);x.drawImage(x.canvas,sx,sy,w,h,0,0,w,h);x.restore()};
 const blk=(sx,sy,dx,dy,w,h,d)=>{fl(sx+d,sy,w,d,dx+d,dy);fl(sx+d+w,sy,w,d,dx+d+w,dy);fl(sx,sy+d,d,h,dx+d+w,dy+d);fl(sx+d,sy+d,w,h,dx+d,dy+d);fl(sx+d+w,sy+d,d,h,dx,dy+d);fl(sx+2*d+w,sy+d,w,h,dx+2*d+w,dy+d)};
 blk(0,16,16,48,4,12,4);blk(40,16,32,48,4,12,4)}
function skinTex(src,cb){const cv=document.createElement("canvas");cv.width=cv.height=64;const t=new THREE.CanvasTexture(cv);t.magFilter=t.minFilter=THREE.NearestFilter;t.encoding=THREE.sRGBEncoding;t.generateMipmaps=false;
 const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{const x=cv.getContext("2d");x.imageSmoothingEnabled=false;x.clearRect(0,0,64,64);x.drawImage(im,0,0,64,im.height>=64?64:32);if(im.height<64)mirrorOld(x);t.needsUpdate=true;cb&&cb(x.getImageData(0,0,64,64))};im.src=src;return t}
/* ============ 第二层皮肤立体化：把帽子/外套/袖子/裤子每个像素挤出成小方块（所有皮肤自动生效） ============ */
const VM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
function voxelize(G,im){const col=(x,y)=>{if(x<0||y<0||x>=64||y>=64)return null;const k=(y*64+x)*4,d=im.data;return d[k+3]>127?[d[k],d[k+1],d[k+2]]:null};
 for(const o of G.userData.O){const{w,h,d,u,v,t}=o,P=[],N=[],C=[],I=[];
  const F=[[u+d,v+d,w,h,[0,0,1],(i,j)=>[-w/2+i+.5,h/2-j-.5,d/2]],[u+2*d+w,v+d,w,h,[0,0,-1],(i,j)=>[w/2-i-.5,h/2-j-.5,-d/2]],[u+d+w,v+d,d,h,[1,0,0],(i,j)=>[w/2,h/2-j-.5,d/2-i-.5]],[u,v+d,d,h,[-1,0,0],(i,j)=>[-w/2,h/2-j-.5,-d/2+i+.5]],[u+d,v,w,d,[0,1,0],(i,j)=>[-w/2+i+.5,h/2,-d/2+j+.5]],[u+d+w,v,w,d,[0,-1,0],(i,j)=>[-w/2+i+.5,-h/2,d/2-j-.5]]];
  const quad=(c,n,hs,rgb)=>{const a=n[0]?0:n[1]?1:2,e1=(a+1)%3,e2=(a+2)%3,f=[c[0]+n[0]*hs[a],c[1]+n[1]*hs[a],c[2]+n[2]*hs[a]],q=[];
   for(const[s1,s2]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const p=f.slice();p[e1]+=s1*hs[e1];p[e2]+=s2*hs[e2];q.push(p)}
   const ux=q[1].map((x,k)=>x-q[0][k]),vx=q[3].map((x,k)=>x-q[0][k]),cr=[ux[1]*vx[2]-ux[2]*vx[1],ux[2]*vx[0]-ux[0]*vx[2],ux[0]*vx[1]-ux[1]*vx[0]];
   if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0)q.reverse();const b=P.length/3;q.forEach(p=>{P.push(...p);N.push(...n);C.push(...rgb)});I.push(b,b+1,b+2,b,b+2,b+3)};
  for(const[x0,y0,rw,rh,n,fn]of F){const a0=fn(0,0),di=fn(1,0).map((x,k)=>x-a0[k]),dj=fn(0,1).map((x,k)=>x-a0[k]);
   for(let j=0;j<rh;j++)for(let i=0;i<rw;i++){const c=col(x0+i,y0+j);if(!c)continue;const k=new THREE.Color(c[0]/255,c[1]/255,c[2]/255).convertSRGBToLinear(),rgb=[k.r,k.g,k.b],cc=fn(i,j).map((x,q)=>x+n[q]*t/2),hs=[n[0]?t/2:.5,n[1]?t/2:.5,n[2]?t/2:.5];
    quad(cc,n,hs,rgb);
    for(const[dx,dy,dv]of[[1,0,di],[-1,0,di.map(x=>-x)],[0,1,dj],[0,-1,dj.map(x=>-x)]]){const ii=i+dx,jj=j+dy;if(ii>=0&&jj>=0&&ii<rw&&jj<rh&&col(x0+ii,y0+jj))continue;quad(cc,dv,hs,rgb)}}}
  if(!P.length)continue;const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(P,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(N,3));g.setAttribute("color",new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.scale(PX,PX,PX);
  const m=new THREE.Mesh(g,VM);m.castShadow=true;o.g.add(m)}}
