"use strict";
/* ============ 8. 输入 ============ */
const K={},mv={x:0,y:0},touch=matchMedia("(pointer:coarse)").matches;if(touch)document.documentElement.classList.add("t");
addEventListener("keydown",e=>{K[e.code]=1;if(e.code=="Space"||e.code=="Enter"||e.code=="KeyE"){if(UI.adv){UI.adv();e.preventDefault();return}if(e.code=="KeyE")interact()}
 if(e.code.startsWith("Digit")){const i=+e.key-1;if(UI.pick){if(i<UI.n)UI.pick(i)}else if(i>=0&&i<9){P.sel=i;UI.hotbar()}}});
addEventListener("keyup",e=>K[e.code]=0);
addEventListener("keydown",e=>{if(e.code=="KeyM"){MUTE=!MUTE;UI.toast(MUTE?"已静音":"声音开启");PACK.gn&&(PACK.gn.gain.value=MUTE?0:.3)}if(e.code=="KeyF"){P.fly=!P.fly;UI.toast(P.fly?"飞行：开":"飞行：关")}if(e.code=="KeyP")ED.on?ED.exit():ED.enter()});
["pointerdown","keydown"].forEach(t=>addEventListener(t,()=>{ac();music()},{once:true}));
addEventListener("wheel",e=>{P.sel=(P.sel+(e.deltaY>0?1:8))%9;UI.hotbar()});
addEventListener("mousemove",e=>{if(document.pointerLockElement){P.yaw-=e.movementX*.0022;P.pitch=clamp(P.pitch-e.movementY*.0022,-1.5,1.5)}});
cv.addEventListener("contextmenu",e=>e.preventDefault());
cv.addEventListener("mousedown",e=>{if(ED.on)return ED.down(e);if(UI.adv)return UI.adv();if(!document.pointerLockElement){if(!UI.open&&!touch)cv.requestPointerLock();return}if(UI.open||cine.on)return;e.button==0?breakBlock():e.button==2&&(interact()||placeBlock())});
$("dlg").addEventListener("pointerdown",()=>UI.adv&&UI.adv());
if(touch){const J={id:null,x:0,y:0},L={id:null,x:0,y:0},tp=(el,fn)=>el.addEventListener("touchstart",e=>{e.preventDefault();fn(e)},{passive:false});
 tp($("joy"),e=>{if(UI.adv)return UI.adv();const t=e.changedTouches[0];J.id=t.identifier;J.x=t.clientX;J.y=t.clientY});
 $("joy").addEventListener("touchmove",e=>{for(const t of e.changedTouches)if(t.identifier==J.id){mv.x=clamp((t.clientX-J.x)/40,-1,1);mv.y=clamp((t.clientY-J.y)/40,-1,1)}},{passive:true});
 $("joy").addEventListener("touchend",()=>{J.id=null;mv.x=mv.y=0});
 tp($("look"),e=>{if(UI.adv)return UI.adv();const t=e.changedTouches[0];L.id=t.identifier;L.x=t.clientX;L.y=t.clientY;L.sx=L.x;L.sy=L.y});
 $("look").addEventListener("touchmove",e=>{for(const t of e.changedTouches)if(t.identifier==L.id){P.yaw-=(t.clientX-L.x)*.006;P.pitch=clamp(P.pitch-(t.clientY-L.y)*.006,-1.5,1.5);L.x=t.clientX;L.y=t.clientY}},{passive:true});
 $("look").addEventListener("touchend",e=>{const t=e.changedTouches[0];if(ED.on&&L.id==t.identifier&&Math.hypot(t.clientX-L.sx,t.clientY-L.sy)<12){ED.mx=t.clientX;ED.my=t.clientY;ED.act(t.clientX,t.clientY)}L.id=null});
 tp($("bJ"),()=>K.Space=1);$("bJ").addEventListener("touchend",()=>K.Space=0);tp($("bD"),()=>K.ShiftLeft=1);$("bD").addEventListener("touchend",()=>K.ShiftLeft=0);
 tp($("bB"),()=>{if(UI.adv)return UI.adv();!UI.open&&!cine.on&&breakBlock()});
 tp($("bP"),()=>{if(UI.adv)return UI.adv();if(!UI.open&&!cine.on)interact()||placeBlock()})}
