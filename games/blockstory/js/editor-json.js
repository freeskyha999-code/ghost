"use strict";
/* ============ 剧本模式：剧情 = 一份 JSON，可编辑/导入/导出/用链接加载 ============ */
const DEF=JSON.stringify(STORY);
const SM={on:0,
 apply(o,q){o=JSON.parse(JSON.stringify(o));for(const n of Object.values(NPC.list))scene.remove(n.g);NPC.list={};o.triggers=o.triggers||[];o.scripts=o.scripts||{};o.npcs=o.npcs||[];
  for(const k in STORY)delete STORY[k];Object.assign(STORY,o);S.f={};S.fired.clear();S.q=[];S.busy=false;UI.open=0;$("dlg").style.display=$("choices").style.display="none";UI.quest("");
  WD.fill(0);W.generate();(STORY.edits||[]).forEach(e=>W.set(e[0],e[1],e[2],e[3]));SM.sync();LT.calc();LT.cs.clear();LT.t=0;for(const c of W.ch.values())c.dirty=1;P.p.set(...(STORY.spawn||[64.5,11,70.5]));P.v.set(0,0,0);STORY.npcs.forEach(n=>NPC.add(n));if(!q)S.emit("start")},
 open(){document.exitPointerLock();$("ed").style.display="flex";$("edt").value=JSON.stringify(STORY,null,1);this.on=1;UI.open=1},
 close(){$("ed").style.display="none";this.on=0;UI.open=0},
 msg(t){$("edmsg").textContent=t},
 sync(){STORY.triggers=STORY.triggers.filter(t=>!/^_t_/.test(t.id));for(const n of STORY.npcs)if(n.lines&&n.lines.length){STORY.triggers.push({id:"_t_"+n.id,on:"talk:"+n.id,run:"_t_"+n.id});STORY.scripts["_t_"+n.id]=n.lines.map(t=>({say:n.name,text:t}))}},
 run(){try{const o=JSON.parse($("edt").value);this.apply(o);try{localStorage.setItem("bs_story",JSON.stringify(o))}catch(e){}this.close();UI.toast("剧本已载入")}catch(e){this.msg("JSON 有误："+e.message)}}};
{const b=(p,t,f)=>{const e=document.createElement("button");e.textContent=t;e.onclick=f;$(p).appendChild(e)},ins=t=>{const a=$("edt"),i=a.selectionStart;a.setRangeText(t,i,a.selectionEnd,"end");a.focus()};
 b("edr1","▶ 运行",()=>SM.run());b("edr1","导出",()=>{const u=URL.createObjectURL(new Blob([$("edt").value],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download="story.json";a.click();try{navigator.clipboard.writeText($("edt").value)}catch(e){}SM.msg("已下载并复制")});
 const l=document.createElement("label");l.className="edbtn";l.innerHTML='导入<input type="file" accept=".json,.txt" hidden>';l.firstElementChild.onchange=e=>{const f=e.target.files[0];f&&f.text().then(t=>{$("edt").value=t;SM.msg("已导入，按 ▶ 运行")})};$("edr1").appendChild(l);
 b("edr1","恢复示例",()=>{$("edt").value=JSON.stringify(JSON.parse(DEF),null,1);try{localStorage.removeItem("bs_story")}catch(e){}SM.msg("已恢复，按 ▶ 运行")});b("edr1","✕",()=>SM.close());
 [["对话",'{"say":"角色名","text":"台词"},'],["选择",'{"choice":[{"text":"选项一","run":[]},{"text":"选项二","run":[]}]},'],["建造",'{"fill":[60,9,60,66,12,66,"brick"],"delay":10},'],["触发器",'{"id":"t1","on":"talk:npcid","run":"脚本名"},'],["过场",'{"cut":true},{"cam":{"pos":[60,20,60],"look":[64,10,64]}},{"wait":2},{"cam":null},{"cut":false},']].forEach(([t,c])=>b("edr2","＋"+t,()=>ins(c)));
 $("ed").addEventListener("keydown",e=>e.stopPropagation());$("ed").addEventListener("keyup",e=>e.stopPropagation())}
