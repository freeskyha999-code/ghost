"use strict";
/* ============ 3. 世界：分块 + 剔除面网格 ============ */
const SX=8,CH=16,HT=40,WS=SX*CH,WD=new Uint8Array(WS*HT*WS);
const FACES=[{d:[1,0,0],s:.8,v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]]},{d:[-1,0,0],s:.8,v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]},
 {d:[0,1,0],s:1,v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},{d:[0,-1,0],s:.5,v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]},
 {d:[0,0,1],s:.9,v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]},{d:[0,0,-1],s:.7,v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]}];
/* 体素光照：天空光(垂直不衰减)+方块光，BFS 泛洪，0-15 级；方块变化后防抖 150ms 重算并刷新周边分块 */
const LT={sky:new Uint8Array(WS*HT*WS),blk:new Uint8Array(WS*HT*WS),t:0,cs:new Set(),
 idx:p=>(p[1]>=HT||p[1]<0||p[0]<0||p[2]<0||p[0]>=WS||p[2]>=WS)?-1:(p[1]*WS+p[2])*WS+p[0],
 opq:i=>{const m=WD[i];return m&&!B[m].tr},
 calc(){const sky=this.sky,blk=this.blk,qs=[],qb=[],A=WS*WS;sky.fill(0);blk.fill(0);
  for(let z=0;z<WS;z++)for(let x=0;x<WS;x++)for(let y=HT-1;y>=0;y--){const i=(y*WS+z)*WS+x;if(this.opq(i))break;sky[i]=15;qs.push(i)}
  for(let i=0;i<WD.length;i++)if(WD[i]&&B[WD[i]].glow){blk[i]=15;qb.push(i)}
  const run=(a,q,s)=>{for(let h=0;h<q.length;h++){const i=q[h],l=a[i],x=i%WS,z=(i/WS|0)%WS,y=i/A|0;
   for(let f=0;f<6;f++){const d=FACES[f].d,nx=x+d[0],ny=y+d[1],nz=z+d[2];if(nx<0||nz<0||nx>=WS||nz>=WS||ny<0||ny>=HT)continue;const n=(ny*WS+nz)*WS+nx,nl=s&&d[1]<0&&l==15?15:l-1;if(nl>a[n]&&!this.opq(n)){a[n]=nl;q.push(n)}}}};
  run(sky,qs,1);run(blk,qb,0)},
 relight(){this.t=0;this.calc();for(const c of this.cs)for(let a=-1;a<2;a++)for(let b=-1;b<2;b++){const n=W.ch.get((c.x+a)+","+(c.z+b));if(n)n.dirty=1}this.cs.clear()}};
const W={ch:new Map(),
 init(){for(let x=0;x<SX;x++)for(let z=0;z<SX;z++)this.ch.set(x+","+z,{x,z,d:new Uint8Array(CH*CH*HT),dirty:1,mesh:null})},
 get(x,y,z){if(y<0)return 3;if(y>=HT||x<0||z<0||x>=WS||z>=WS)return 0;return WD[(y*WS+z)*WS+x]},
 set(x,y,z,id){if(y<0||y>=HT||x<0||z<0||x>=WS||z>=WS)return;const c=this.ch.get((x>>4)+","+(z>>4));WD[(y*WS+z)*WS+x]=id;c.dirty=1;LT.t=performance.now()+150;LT.cs.add(c);
  for(const[a,b]of[[-1,0],[1,0],[0,-1],[0,1]]){const n=this.ch.get(((x+a)>>4)+","+((z+b)>>4));if(n&&n!==c)n.dirty=1}},
 fill(x1,y1,z1,x2,y2,z2,id){for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let z=Math.min(z1,z2);z<=Math.max(z1,z2);z++)for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)this.set(x,y,z,id)},
 top(x,z){for(let y=HT-1;y>=0;y--)if(this.get(x,y,z))return y+1;return 0},
 floorY(x,z,y0){for(let y=Math.min(HT-1,Math.floor(y0)+2);y>=0;y--)if(this.get(x,y,z))return y+1;return 0},
 build(c){const P=[],U=[],C=[],I=[],NR=[],LA=[];let n=0;const ox=c.x*CH,oz=c.z*CH,e=.002;
  for(let y=0;y<HT;y++)for(let z=0;z<CH;z++)for(let x=0;x<CH;x++){const id=WD[(y*WS+oz+z)*WS+ox+x];if(!id)continue;const b=B[id];
   for(let f=0;f<6;f++){const F=FACES[f],m=this.get(ox+x+F.d[0],y+F.d[1],oz+z+F.d[2]);if(m&&!(B[m].tr&&m!==id))continue;
    const ti=Atlas.idx[f==2?b.t[0]:f==3?(b.t[2]||b.t[0]):(b.t[1]||b.t[0])],c0=ti%N,r0=ti/N|0,u0=c0/N+e,u1=(c0+1)/N-e,v0=1-(r0+1)/N+e,v1=1-r0/N-e,na=F.d[0]?0:F.d[1]?1:2,[a1,a2]=[0,1,2].filter(i=>i!=na),bs=[ox+x+F.d[0],y+F.d[1],oz+z+F.d[2]];
    F.v.forEach((q,k)=>{P.push(x+q[0],y+q[1],z+q[2]);U.push(k==0||k==3?u0:u1,k<2?v0:v1);let sk=0,bk=0,cn=0;const o=(i,j)=>{const p=bs.slice();p[a1]+=i;p[a2]+=j;const m=this.get(p[0],p[1],p[2]),op=m&&!B[m].tr?1:0;if(!op){const k=LT.idx(p);sk+=k<0?15:LT.sky[k];bk+=k<0?0:LT.blk[k];cn++}return op},i=q[a1]*2-1,j=q[a2]*2-1,s1=o(i,0),s2=o(0,j),s3=o(i,j),ao=s1&&s2?0:3-s1-s2-s3,av=b.glow?1:[.5,.7,.86,1][ao];o(0,0);cn=cn||1;C.push(av,av,av);NR.push(F.d[0],F.d[1],F.d[2]);LA.push(sk/cn/15,bk/cn/15)});
    I.push(n,n+1,n+2,n,n+2,n+3);n+=4}}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(P,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(U,2));g.setAttribute("color",new THREE.Float32BufferAttribute(C,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(NR,3));g.setAttribute("lt",new THREE.Float32BufferAttribute(LA,2));g.setIndex(I);
  if(c.mesh){c.mesh.geometry.dispose();c.mesh.geometry=g}else{c.mesh=new THREE.Mesh(g,MAT);c.mesh.castShadow=c.mesh.receiveShadow=true;c.mesh.position.set(ox,0,oz);scene.add(c.mesh)}c.dirty=0},
 generate(){const hf=(x,z)=>{const r=Math.hypot(x-64,z-64),t=clamp((r-22)/14,0,1);return Math.round(10+t*(3*Math.sin(x*.11)*Math.cos(z*.13)+2.5*Math.sin((x+z)*.07)+2))};
  for(let x=0;x<WS;x++)for(let z=0;z<WS;z++){const h=hf(x,z);for(let y=0;y<h;y++)this.set(x,y,z,y==h-1?1:y>=h-4?2:3)}
  for(const[x,z]of[[52,70],[76,72],[56,50],[74,54],[48,60]]){const h=this.top(x,z);this.fill(x,h,z,x,h+3,z,ID.log);
   for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=2;dy<=4;dy++){if(Math.abs(dx)==2&&Math.abs(dz)==2||dy==4&&(Math.abs(dx)>1||Math.abs(dz)>1))continue;if(!this.get(x+dx,h+dy,z+dz))this.set(x+dx,h+dy,z+dz,ID.leaves)}}
  /* 小屋 */ this.fill(70,9,56,76,9,62,ID.planks);this.fill(70,10,56,76,12,62,ID.brick);this.fill(71,10,57,75,12,61,0);this.fill(70,13,56,76,13,62,ID.planks);
  this.fill(73,10,62,73,11,62,0);this.set(70,11,59,ID.glass);this.set(76,11,59,ID.glass);this.set(73,12,57,ID.lantern);
  /* 灯柱 */ for(const x of[61,67]){this.fill(x,10,63,x,11,63,ID.log);this.set(x,12,63,ID.lantern)}
  /* 红袖楼（村里的窑子） */ this.fill(66,9,44,76,9,50,ID.planks);this.fill(66,10,44,76,13,50,ID.brick);this.fill(67,10,45,75,13,49,0);this.fill(66,14,44,76,14,50,ID.planks);
  this.fill(66,13,50,76,13,50,ID.wool);this.fill(67,10,45,75,10,45,ID.wool);this.fill(71,10,50,71,11,50,0);this.set(68,11,50,ID.glass);this.set(74,11,50,ID.glass);this.set(66,11,47,ID.glass);this.set(76,11,47,ID.glass);this.set(71,13,47,ID.lantern);
  for(const x of[67,69]){this.fill(x,10,51,x,11,51,ID.log);this.set(x,12,51,ID.lantern)}}
};
