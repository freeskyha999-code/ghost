"use strict";
/* ============ 生存模式：血量/饥饿、物品栏、限时挖掘、掉落物、摔伤、重生 ============ */
const HARD={grass:.45,dirt:.4,stone:3.8,planks:1.5,log:1.5,leaves:.15,glass:.25,brick:1.5,lantern:.2,wool:.6}; /* 徒手挖掘所需秒数（约为原版一半） */
const h=(t,o,...k)=>{const e=document.createElement(t);Object.assign(e,o||{});k.forEach(c=>e.append(c));return e};
document.head.appendChild(h("style",{textContent:`#hotbar{left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 6px);display:block;width:182px;height:50px;padding:0;background:none;gap:0}
#svw{position:absolute;left:0;bottom:0;width:182px;height:50px;transform-origin:50% 100%}
#svw img,#svw canvas{position:absolute;image-rendering:pixelated;pointer-events:none}
#svw .ct{position:absolute;width:17px;text-align:right;color:#fff;font:bold 8px/8px monospace;text-shadow:1px 1px 0 #3f3f3f;pointer-events:none}
#svw .sl{position:absolute;width:20px;height:22px;pointer-events:auto}
#hurt{position:fixed;inset:0;pointer-events:none;background:radial-gradient(transparent 40%,rgba(200,0,0,.6));opacity:0;transition:opacity .45s;z-index:4}
#dead{position:fixed;inset:0;background:rgba(120,0,0,.55);display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;z-index:30;font-size:38px}
#dead button{font:inherit;font-size:18px;padding:10px 28px;color:#fff;background:#555;border:2px solid #222;cursor:pointer}`}));
const GI={};for(const k in GUI){const i=new Image();i.onload=()=>SV.draw();i.src=GUI[k];GI[k]=i}
const CR=[];for(let i=0;i<10;i++){const t=new THREE.TextureLoader().load("assets/tex/destroy_stage_"+i+".png");t.magFilter=t.minFilter=THREE.NearestFilter;CR.push(t)}
const appleTex=new THREE.TextureLoader().load(GUI.apple);appleTex.magFilter=appleTex.minFilter=THREE.NearestFilter;appleTex.encoding=THREE.sRGBEncoding;
const DM=new THREE.MeshStandardMaterial({map:Atlas.tex,alphaTest:.5,roughness:1});
function tileUV(g,id){const b=B[id],k=Atlas.idx[b.t[1]||b.t[0]],c=k%N,r=k/N|0,u0=c/N,u1=(c+1)/N,v0=1-(r+1)/N,v1=1-r/N,uv=g.attributes.uv;for(let i=0;i<6;i++){uv.setXY(i*4,u0,v1);uv.setXY(i*4+1,u1,v1);uv.setXY(i*4+2,u0,v0);uv.setXY(i*4+3,u1,v0)}uv.needsUpdate=true}
const SV={hp:20,food:20,inv:Array(9).fill(null),items:[],mining:0,mk:null,mt:0,mn:0,dead:false,
 crack:(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(1.004,1.004,1.004),new THREE.MeshBasicMaterial({map:CR[0],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));m.visible=false;scene.add(m);return m})(),
 held(){return this.inv[P.sel]},
 give(id,n){for(const s of this.inv)if(n>0&&s&&s.id==id&&s.n<64){const k=Math.min(n,64-s.n);s.n+=k;n-=k}
  for(let i=0;i<9&&n>0;i++)if(!this.inv[i]){const k=Math.min(n,64);this.inv[i]={id,n:k};n-=k}this.draw();return n},
 take(){const s=this.inv[P.sel];if(s&&--s.n<=0)this.inv[P.sel]=null;this.draw()},
 eat(){if(this.food>=20)return;this.food=Math.min(20,this.food+4);this.take();tone(260,.07,"square",.05);tone(330,.07,"square",.05,.08);tone(260,.07,"square",.05,.16)},
 hurt(d){if(this.dead||d<=0)return;this.hp=Math.max(0,this.hp-d);const e=$("hurt");e.style.opacity=1;setTimeout(()=>e.style.opacity=0,120);tone(140,.18,"sawtooth",.1);this.draw();if(!this.hp)this.die()},
 die(){this.dead=true;UI.open=1;document.exitPointerLock();$("dead").style.display="flex"},
 respawn(){this.hp=20;this.food=20;this.dead=false;this.fy=null;UI.open=0;$("dead").style.display="none";P.p.set(...(STORY.spawn||[64.5,11,70.5]));P.v.set(0,0,0);this.draw()},
 reset(){this.hp=20;this.food=20;this.inv=Array(9).fill(null);this.dead=false;this.fy=null;this.mk=null;this.mining=0;P.sel=0;for(const m of this.items)scene.remove(m);this.items=[];if($("dead"))$("dead").style.display="none";this.draw()},
 icon(id){const c=document.createElement("canvas");c.width=c.height=16;const x=c.getContext("2d");x.imageSmoothingEnabled=false;
  if(id>=100)x.drawImage(GI.apple,0,0,16,16);else{const b=B[id],k=Atlas.idx[b.t[1]||b.t[0]];x.drawImage(Atlas.cv,k%N*T,(k/N|0)*T,T,T,0,0,16,16)}return c},
 draw(){const r=$("hotbar");if(!r)return;r.innerHTML="";const w=h("div",{id:"svw"});w.style.transform=`scale(${innerWidth<700?2:3})`;
  const im=(s,x,y)=>{const i=h("img",{src:s});i.style.left=x+"px";i.style.top=y+"px";w.appendChild(i)};
  for(let i=0;i<10;i++){im(GUI.hc,i*8,0);const v=this.hp-2*i;if(v>=2)im(GUI.hf,i*8,0);else if(v==1)im(GUI.hh,i*8,0);
   const x=173-i*8,f=this.food-2*i;im(GUI.fe,x,0);if(f>=2)im(GUI.ff,x,0);else if(f==1)im(GUI.fh,x,0)}
  im(GUI.xb,0,14);im(GUI.hotbar,0,28);im(GUI.sel,-1+20*P.sel,27);
  this.inv.forEach((s,k)=>{if(!s)return;const c=this.icon(s.id);c.style.cssText=`left:${3+20*k}px;top:31px;width:16px;height:16px`;w.appendChild(c);
   if(s.n>1){const t=h("div",{className:"ct",textContent:s.n});t.style.left=(3+20*k)+"px";t.style.top="39px";w.appendChild(t)}});
  for(let k=0;k<9;k++){const sl=h("div",{className:"sl",onclick:()=>{P.sel=k;this.draw()}});sl.style.left=20*k+"px";sl.style.top="28px";w.appendChild(sl)}
  r.appendChild(w)},
 drop(id,x,y,z){let m;if(id>=100){m=new THREE.Sprite(new THREE.SpriteMaterial({map:appleTex}));m.scale.set(.4,.4,.4)}else{const g=new THREE.BoxGeometry(.25,.25,.25);tileUV(g,id);m=new THREE.Mesh(g,DM);m.castShadow=true}
  m.position.set(x,y,z);m.v=new THREE.Vector3((Math.random()-.5)*1.6,2.6,(Math.random()-.5)*1.6);m.id=id;m.age=0;scene.add(m);this.items.push(m)},
 finish(t,id){const n=B[id].n;PT.burst(t.x,t.y,t.z,id);W.set(t.x,t.y,t.z,0);snd.dig(n);
  const d=n=="grass"?2:n=="glass"?0:n=="leaves"?(Math.random()<.1?100:0):id;if(d)this.drop(d,t.x+.5,t.y+.5,t.z+.5);S.emit("break:"+n);S.emit("break")},
 update(dt){if(P.fly&&!ED.on&&!window.DEV)P.fly=false;
  if(ED.on||this.dead){this.crack.visible=false;this.mk=null;return}
  const t=target;
  if(this.mining&&t&&!UI.open&&!cine.on){const id=W.get(t.x,t.y,t.z),key=t.x+","+t.y+","+t.z;if(this.mk!=key){this.mk=key;this.mt=0;this.mn=0}
   const nm=B[id].n,dur=HARD[nm]??1;this.mt+=dt;this.mn-=dt;if(this.mn<=0){this.mn=.26;playS("step_"+(SG[nm]||"stone"),.4)}
   const f=this.mt/dur;this.crack.visible=true;this.crack.position.set(t.x+.5,t.y+.5,t.z+.5);this.crack.material.map=CR[Math.min(9,f*10|0)];
   if(f>=1){this.finish(t,id);this.mk=null;this.crack.visible=false}}
  else{this.mk=null;this.crack.visible=false}
  for(let i=this.items.length-1;i>=0;i--){const m=this.items[i];m.age+=dt;m.v.y-=14*dt;m.position.addScaledVector(m.v,dt);
   if(m.v.y<0&&W.get(Math.floor(m.position.x),Math.floor(m.position.y-.13),Math.floor(m.position.z))){m.position.y=Math.floor(m.position.y-.13)+1.13;m.v.y*=-.3;m.v.x*=.7;m.v.z*=.7}
   if(m.rotation)m.rotation.y+=dt*1.5;
   const dx=P.p.x-m.position.x,dy=P.p.y+.8-m.position.y,dz=P.p.z-m.position.z;
   if(m.age>.6&&dx*dx+dy*dy+dz*dz<2&&this.give(m.id,1)==0){scene.remove(m);this.items.splice(i,1);tone(900,.06,"sine",.05)}else if(m.age>300){scene.remove(m);this.items.splice(i,1)}}
  if(!P.fly){if(P.p.y<-18)this.fy=null;if(!P.g)this.fy=Math.max(this.fy??P.p.y,P.p.y);else if(this.fy!=null){const f=this.fy-P.p.y;this.fy=null;if(f>3.2)this.hurt(Math.floor(f-3))}
   const mg=P.g&&(K.KeyW||K.KeyA||K.KeyS||K.KeyD||Math.hypot(mv.x,mv.y)>.3);this.hu=(this.hu||0)+dt*(mg?1:.25);if(this.hu>=30){this.hu=0;if(this.food>0)this.food--;this.draw()}
   this.rg=(this.rg||0)+dt;if(this.rg>=4){this.rg=0;if(this.food>=18&&this.hp<20){this.hp++;this.draw()}else if(this.food<=0)this.hurt(1)}}}};
document.body.append(h("div",{id:"hurt"}),h("div",{id:"dead"},h("div",{textContent:"你死了！"}),h("button",{textContent:"重生",onclick:()=>SV.respawn()})));
UI.hotbar=()=>SV.draw();
function breakBlock(){} /* 生存模式不再点一下就破坏：改为按住挖掘（见 SV.update） */
function placeBlock(){const it=SV.held();if(it&&it.id>=100)return SV.eat();if(!target||!it)return;const id=it.id;W.set(target.px,target.py,target.pz,id);if(hit(P.p)){W.set(target.px,target.py,target.pz,0);return}SV.take();snd.dig(B[id].n);S.emit("place:"+B[id].n)}
cv.addEventListener("mousedown",e=>{if(e.button==0&&!ED.on&&document.pointerLockElement)SV.mining=1});
addEventListener("mouseup",e=>{if(e.button==0)SV.mining=0});addEventListener("blur",()=>SV.mining=0);
$("bB").addEventListener("touchstart",()=>{if(!ED.on&&!UI.open)SV.mining=1});$("bB").addEventListener("touchend",()=>SV.mining=0);$("bB").addEventListener("touchcancel",()=>SV.mining=0);
(function tick(now){const dt=Math.min(.05,(now-(tick.l||now))/1000);tick.l=now;SV.update(dt);requestAnimationFrame(tick)})(performance.now());
