"use strict";
/* ============ 启动 ============ */
{const _a=SM.apply;SM.apply=function(o,q){SV.reset();return _a.call(this,o,q)}}
W.init();W.generate();LT.calc();LT.t=0;LT.cs.clear();STORY.npcs.forEach(n=>NPC.add(n));UI.hotbar();loadPack();
window.MC={TD,LS,FX,BL,COMP,Atlas,B,ID,W,P,S,STORY,NPC,UI,ACT}; /* 控制台可用：MC.Atlas.set("stone","url") */
requestAnimationFrame(frame);
{let sv=null;try{sv=localStorage.getItem("bs_story")}catch(e){}const q=new URLSearchParams(location.search).get("story");
 if(q)fetch(q).then(r=>r.json()).then(o=>SM.apply(o)).catch(()=>{UI.toast("剧本加载失败");S.emit("start")});
 else if(sv)try{SM.apply(JSON.parse(sv))}catch(e){S.emit("start")}else S.emit("start")}
