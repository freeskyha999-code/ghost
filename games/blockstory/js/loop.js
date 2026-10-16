"use strict";
/* ============ 9. 主循环 ============ */
let last=performance.now(),first=true,stT=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;const locked=UI.open||cine.on;
 let fw=0,st=0;if(!locked){fw=(K.KeyW?1:0)-(K.KeyS?1:0)-mv.y;st=(K.KeyD?1:0)-(K.KeyA?1:0)+mv.x;if(K.Space&&P.g){P.v.y=8.6;P.g=false;if(!P.fly)snd.stepOn(UNDER())}}
 const l=Math.hypot(fw,st)||1,sp=P.fly?12:4.6,f=fwd();P.v.x=(f.x*fw+Math.cos(P.yaw)*st)/Math.max(1,l)*sp;P.v.z=(f.z*fw-Math.sin(P.yaw)*st)/Math.max(1,l)*sp;P.v.y=P.fly?((K.Space?1:0)-(K.ShiftLeft?1:0))*8:Math.max(-40,P.v.y-26*dt);
 P.g=false;for(const a of["x","z","y"]){P.p[a]+=P.v[a]*dt;if(a!="y")P.p[a]=clamp(P.p[a],1,WS-1);if(!P.fly&&hit(P.p)){P.p[a]-=P.v[a]*dt;if(a=="y"&&P.v.y<0)P.g=true;P.v[a]=0}}
 if(P.p.y<-20)P.p.set(64.5,14,70.5);
 if(P.g&&!LG&&!P.fly)snd.land(UNDER());LG=P.g;
 if(P.g&&(fw||st)){stT-=dt;if(stT<=0){stT=.42;snd.stepOn(W.get(Math.floor(P.p.x),Math.floor(P.p.y-.2),Math.floor(P.p.z)))}}
 const eye=P.p.clone();eye.y+=1.62+(P.g&&(fw||st)?Math.sin(now*.011)*.035:0);
 if(cine.on&&cine.cam){const k=1-Math.exp(-3*dt);camera.position.lerp(cine.cam.pos,k);cine.cur.lerp(cine.cam.look,k);camera.lookAt(cine.cur)}
 else{camera.position.copy(eye);camera.rotation.set(P.pitch,P.yaw,0)}
 const d=new THREE.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch));
 target=ED.on?ED.pickAt(ED.mx,ED.my):locked?null:pick(eye,d);hl.visible=!!target;if(target)hl.position.set(target.x+.5,target.y+.5,target.z+.5);
 NPC.update(dt);PT.update(dt);S.regions();$("xyz").textContent=P.p.x.toFixed(1)+" "+P.p.y.toFixed(1)+" "+P.p.z.toFixed(1)+(target?"  ▸ "+target.x+" "+target.y+" "+target.z:"");
 const n=!ED.on&&!locked&&!S.busy&&NPC.near();$("prompt").style.display=n?"block":"none";if(n)$("prompt").textContent=(touch?"🧱 ":"[E] ")+"与 "+n.name+" 交谈";
 let b=first?999:4;for(const c of W.ch.values())if(c.dirty&&b-->0)W.build(c);first=false;
 if(LT.t&&now>LT.t)LT.relight();SKY.position.copy(camera.position);sky(dt);for(const c of clouds){c.position.x+=dt*1.5;if(c.position.x>180)c.position.x=-60}
 COMP.render(dt)}
