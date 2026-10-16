"use strict";
/* ============ 5. NPC ============ */
const NPC={list:{},
 add(d){const f=d.g=="f",src=d.skin&&PACK.skins[d.skin]?PACK.skins[d.skin].u:d.skin||PACK.skins[f?"alex_slim":"steve"].u,mat=new THREE.MeshStandardMaterial({map:skinTex(src,id=>voxelize(g,id)),alphaTest:.5,roughness:1}),g=mkPlayer(mat,d.slim??(d.skin&&PACK.skins[d.skin]?PACK.skins[d.skin].f:f));
  const c=document.createElement("canvas");c.width=256;c.height=64;const x=c.getContext("2d");x.font="bold 34px sans-serif";x.textAlign="center";x.fillStyle="rgba(0,0,0,.6)";x.fillRect(0,8,256,48);x.fillStyle="#fff";x.fillText(d.name,128,45);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c)}));sp.scale.set(1.6,.4,1);sp.position.y=2.15;g.add(sp);
  g.position.set(d.at[0],d.y??W.top(Math.floor(d.at[0]),Math.floor(d.at[1])),d.at[1]);g.userData.id=d.id;scene.add(g);this.list[d.id]={id:d.id,name:d.name,g,to:null,sp:2,ph:0}},
 walk(id,to,sp=2){return new Promise(r=>{const n=this.list[id];n.to=to;n.sp=sp;n.res=r})},
 update(dt){for(const n of Object.values(this.list)){const g=n.g;
  if(n.to){const dx=n.to[0]-g.position.x,dz=n.to[1]-g.position.z,d=Math.hypot(dx,dz),st=n.sp*dt;if(d<=st){g.position.x=n.to[0];g.position.z=n.to[1];n.to=null;n.res&&n.res()}else{g.position.x+=dx/d*st;g.position.z+=dz/d*st;g.rotation.y=Math.atan2(dx,dz)}}
  else{const dx=P.p.x-g.position.x,dz=P.p.z-g.position.z;if(dx*dx+dz*dz<36)g.rotation.y=Math.atan2(dx,dz)}
  const Lm=g.userData.L,w=n.to?1:0;n.ph+=dt*9*w;const sw=Math.sin(n.ph)*.7*w;Lm.ra.rotation.x=sw;Lm.la.rotation.x=-sw;Lm.rl.rotation.x=-sw;Lm.ll.rotation.x=sw;
  g.position.y=W.floorY(Math.floor(g.position.x),Math.floor(g.position.z),g.position.y)}},
 near(){let best=null,bd=3.5;const f=fwd();for(const n of Object.values(this.list)){const dx=n.g.position.x-P.p.x,dz=n.g.position.z-P.p.z,d=Math.hypot(dx,dz);if(d<bd&&(dx*f.x+dz*f.z)/d>.3){bd=d;best=n}}return best}};
