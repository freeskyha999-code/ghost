"use strict";
/* ============ 可视化剧本模式：上帝视角 + 点击编辑（全按钮操作） ============ */
const hl2=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:0xff3030}));hl2.visible=false;scene.add(hl2);
const el=(t,o,...k)=>{const e=document.createElement(t);Object.assign(e,o||{});k.forEach(c=>e.append(c));return e};
const ED={on:0,tool:"place",blk:4,A:null,mx:innerWidth/2,my:innerHeight/2,undo:[],
 HINT:{browse:"自由浏览：WASD 移动，空格/Shift 升降，右键拖动转向（手机：摇杆+拖动）",place:"点击放置选中的方块",break:"点击破坏方块",fill:"填充：依次点击对角的两个方块（选 ✕ 即清除区域）",npc:"点空地放置角色；点已有角色编辑台词",spawn:"点击设置玩家出生点"},
 ray(x,y){camera.updateMatrixWorld();return new THREE.Vector3(x/innerWidth*2-1,-y/innerHeight*2+1,.5).unproject(camera).sub(camera.position).normalize()},
 pickAt(x,y){return pick(camera.position,this.ray(x,y),90)},
 hint(t){$("edhint").textContent=t},
 set(x,y,z,id,rec){const o=W.get(x,y,z);if(o==id||y<0)return;W.set(x,y,z,id);rec.push([x,y,z,o,id])},
 commit(rec){if(!rec.length)return;this.undo.push(rec);STORY.edits=STORY.edits||[];rec.forEach(r=>STORY.edits.push([r[0],r[1],r[2],r[4]]))},
 undoLast(){const r=this.undo.pop();if(!r)return this.hint("没有可撤销的操作");for(let i=r.length-1;i>=0;i--)W.set(r[i][0],r[i][1],r[i][2],r[i][3]);STORY.edits.length-=r.length;this.hint("已撤销")},
 down(e){this.mx=e.clientX;this.my=e.clientY;if(e.button==0)this.act(e.clientX,e.clientY)},
 act(x,y){const t=this.tool,g=this.pickAt(x,y);
  if(t=="npc"){const n=this.npcAt(x,y);if(n)return this.editNpc(n.userData.id);if(g)return this.addNpc(g.px+.5,g.py,g.pz+.5);return}
  if(!g||t=="browse")return;const rec=[];
  if(t=="place")this.set(g.px,g.py,g.pz,this.blk,rec);
  else if(t=="break")this.set(g.x,g.y,g.z,0,rec);
  else if(t=="spawn"){STORY.spawn=[g.px+.5,g.py,g.pz+.5];return this.hint("出生点已设置")}
  else if(t=="fill"){if(!this.A){this.A=[g.x,g.y,g.z];hl2.position.set(g.x+.5,g.y+.5,g.z+.5);hl2.visible=true;return this.hint("填充：再点对角的第二个方块")}
   const a=this.A,b=[g.x,g.y,g.z];this.A=null;hl2.visible=false;for(let X=Math.min(a[0],b[0]);X<=Math.max(a[0],b[0]);X++)for(let Y=Math.min(a[1],b[1]);Y<=Math.max(a[1],b[1]);Y++)for(let Z=Math.min(a[2],b[2]);Z<=Math.max(a[2],b[2]);Z++)this.set(X,Y,Z,this.blk,rec);this.hint("填充完成："+rec.length+" 个方块")}
  this.commit(rec);snd.place()},
 npcAt(x,y){const r=new THREE.Raycaster();r.setFromCamera({x:x/innerWidth*2-1,y:-y/innerHeight*2+1},camera);const h=r.intersectObjects(Object.values(NPC.list).map(n=>n.g),true)[0];let o=h&&h.object;while(o&&!o.userData.id)o=o.parent;return o},
 addNpc(x,y,z){const id="n"+(Date.now()%1e6),d={id,name:"村民",at:[x,z],y,color:Math.random()*0xffffff|0,lines:["你好，旅人。"]};STORY.npcs.push(d);NPC.add(d);this.editNpc(id)},
 editNpc(id){const d=STORY.npcs.find(n=>n.id==id),p=$("ednpc");d.lines=d.lines||[];p.innerHTML="";p.style.display="flex";
  const line=(t,i)=>el("div",{className:"er"},el("input",{value:t,oninput:e=>d.lines[i]=e.target.value}),el("button",{textContent:"✕",onclick:()=>{d.lines.splice(i,1);this.editNpc(id)}}));
  p.append(el("b",{textContent:"编辑角色：名字 / 颜色"}),el("div",{className:"er"},el("input",{value:d.name,oninput:e=>{d.name=e.target.value}}),el("input",{type:"color",value:"#"+("000000"+(+d.color).toString(16)).slice(-6),oninput:e=>{d.color=parseInt(e.target.value.slice(1),16)}})),
   el("div",{className:"er"},el("button",{textContent:d.g=="f"?"♀ 女：细胳臂":"♂ 男：粗胳臂",onclick:()=>{d.g=d.g=="f"?"m":"f";d.skin=null;this.editNpc(id)}}),el("select",{onchange:e=>{d.skin=e.target.value||null;delete d.slim},innerHTML:'<option value="">默认皮肤</option>'+Object.keys(PACK.skins).filter(k=>PACK.skins[k].f==(d.g=="f")||PACK.skins[k].any).map(k=>`<option value="${k}"${d.skin==k?" selected":""}>${k}</option>`).join("")})),
   el("div",{className:"er"},el("label",{className:"edbtn",innerHTML:'上传皮肤 PNG（64x64 / 64x32）<input type="file" accept="image/png" hidden>',onchange:e=>{const f=e.target.files[0];if(f){const r=new FileReader;r.onload=()=>{d.skin=r.result;const im=new Image;im.onload=()=>{const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d");x.drawImage(im,0,0);d.slim=im.height>=64?x.getImageData(55,24,1,1).data[3]==0:false};im.src=r.result};r.readAsDataURL(f)}}})),
   el("span",{textContent:"台词（按顺序说；玩家点角色触发）"}),...d.lines.map(line),
   el("div",{className:"er"},el("button",{textContent:"＋台词",onclick:()=>{d.lines.push("");this.editNpc(id)}}),el("button",{textContent:"🗑 删除角色",onclick:()=>{STORY.npcs=STORY.npcs.filter(n=>n!=d);scene.remove(NPC.list[id].g);delete NPC.list[id];p.style.display="none"}}),el("button",{textContent:"完成",onclick:()=>{scene.remove(NPC.list[id].g);NPC.add(d);p.style.display="none"}})))},
 setTool(k){this.tool=k;this.A=null;hl2.visible=false;document.querySelectorAll("#edbar button[id]").forEach(b=>b.classList.toggle("on",b.id=="t_"+k));this.hint(this.HINT[k])},
 pal(){const h=$("edpal");h.innerHTML="";for(let i=0;i<B.length;i++){const c=el("canvas",{width:16,height:16,className:i==this.blk?"on":"",onclick:()=>{this.blk=i;this.pal()}});if(i){const b=B[i],k=Atlas.idx[b.t[1]||b.t[0]];c.getContext("2d").drawImage(Atlas.cv,k%N*T,(k/N|0)*T,T,T,0,0,16,16)}else{const x=c.getContext("2d");x.fillStyle="#a33";x.font="14px sans-serif";x.fillText("✕",2,13)}h.appendChild(c)}},
 build(){const bar=$("edbar");[["browse","✋ 浏览"],["place","🧱 放置"],["break","⛏ 破坏"],["fill","▦ 填充"],["npc","🧍 角色"],["spawn","📍 出生点"]].forEach(([k,n])=>bar.append(el("button",{id:"t_"+k,textContent:n,onclick:()=>this.setTool(k)})));
  [["↶ 撤销",()=>this.undoLast()],["☀",()=>{TD.run=false;TD.t=.15}],["🌇",()=>{TD.run=false;TD.t=.46}],["🌙",()=>{TD.run=false;TD.t=.75}],["俯视",()=>{P.p.y=44;P.pitch=-1.5}],["▶ 试玩",()=>this.test()],["💾 保存",()=>{this.save();this.hint("已保存")}],["⏏ 退出",()=>this.exit()]].forEach(([n,f])=>bar.append(el("button",{textContent:n,onclick:f})));
  ["keydown","keyup"].forEach(v=>$("ednpc").addEventListener(v,e=>e.stopPropagation()))},
 save(){try{localStorage.setItem("bs_story",JSON.stringify(STORY))}catch(e){}},
 show(v){$("edui").style.display=v?"flex":"none";["help","hotbar","sm","bB","bP"].forEach(i=>$(i).style.display=v?"none":"");$("look").style.width=v?"100%":"";$("bD").style.display=v?"flex":"none";$("edback").style.display="none"},
 enter(){if(this.on)return;document.exitPointerLock();UI.open=0;cine.on=false;SM.apply(STORY,1);this.on=1;P.fly=true;this.undo=[];const s=STORY.spawn||[64.5,11,70.5];P.p.set(s[0],s[1]+7,s[2]+8);P.pitch=-.6;P.yaw=0;
  if(!$("edbar").children.length)this.build();this.show(1);this.setTool("place");this.pal()},
 leave(){this.save();this.on=0;P.fly=false;this.show(0);SM.apply(STORY)},
 test(){this.leave();$("sm").style.display="none";$("edback").style.display="block"},
 exit(){this.leave()}};
addEventListener("mousemove",e=>{if(!ED.on)return;ED.mx=e.clientX;ED.my=e.clientY;if(e.buttons&2){P.yaw-=e.movementX*.004;P.pitch=clamp(P.pitch-e.movementY*.004,-1.55,1.55)}});
