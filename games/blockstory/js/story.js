"use strict";
/* ============ 7. 剧情引擎（动作 = 类原版命令；触发器 = 类原版进度） ============ */
const S={f:{},fired:new Set(),q:[],busy:false,
 cond(e){try{return!!new Function("f","return("+e+")")(this.f)}catch(x){console.warn("条件错误:",e,x);return false}},
 set(k,v){this.f[k]=v;this.watch()},
 watch(){for(const t of STORY.triggers)if(t.when&&!t.on&&!t.region){const ok=this.cond(t.when);if(ok&&!t._on)this.fire(t);t._on=ok}},
 fire(t){if(t.once&&this.fired.has(t.id)||t.on&&t.when&&!this.cond(t.when)||t.region&&t.when&&!this.cond(t.when))return;if(t.once)this.fired.add(t.id);this.q.push(t.run);this.pump()},
 emit(ev){for(const t of STORY.triggers)if(t.on===ev)this.fire(t)},
 async pump(){if(this.busy)return;this.busy=true;while(this.q.length)await this.call(this.q.shift());this.busy=false},
 async call(n){const s=STORY.scripts[n];if(!s)return console.warn("没有脚本:",n);await this.run(s)},
 async run(list){for(const a of list)await this.act(a)},
 async act(a){for(const k in a)if(ACT[k])return ACT[k](a[k],a)},
 regions(){const p=P.p;for(const t of STORY.triggers)if(t.region){const r=t.region,i=p.x>=r[0]&&p.x<=r[3]&&p.y>=r[1]&&p.y<=r[4]&&p.z>=r[2]&&p.z<=r[5];if(i&&!t._in)this.fire(t);t._in=i}}};
const cine={on:false};
const ACT={
 say:(w,a)=>UI.say(w,a.text),
 choice:async o=>{const v=o.filter(x=>!x.if||S.cond(x.if));const i=await UI.choose(v.map(x=>x.text));await S.run(v[i].run||[])},
 set:(k,a)=>S.set(k,a.value),add:(k,a)=>S.set(k,(S.f[k]||0)+(a.n??1)),
 if:(c,a)=>S.run(S.cond(c)?a.then||[]:a.else||[]),run:n=>S.call(n),
 title:(t,a)=>{snd.ding();return UI.title(t,a.sub,a.dur)},tell:t=>UI.toast(t),quest:t=>{UI.quest(t);t&&snd.ding()},wait:s=>sleep(s*1000),
 setblock:([x,y,z,n])=>W.set(x,y,z,ID[n]),
 fill:async([x1,y1,z1,x2,y2,z2,n],a)=>{if(!a.delay)return W.fill(x1,y1,z1,x2,y2,z2,ID[n]);
  for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let z=Math.min(z1,z2);z<=Math.max(z1,z2);z++)for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++){W.set(x,y,z,ID[n]);sfx(200,.02);await sleep(a.delay)}},
 tp:([x,y,z])=>P.p.set(x,y,z),walk:(id,a)=>NPC.walk(id,a.to,a.speed),
 cut:v=>{cine.on=v;if(!v)cine.cam=null},
 cam:(c)=>{if(!c){cine.cam=null;return}const pos=new THREE.Vector3(...c.pos),look=new THREE.Vector3(...c.look);
  if(!cine.cam){const d=new THREE.Vector3();camera.getWorldDirection(d);cine.cur=camera.position.clone().addScaledVector(d,10)}cine.cam={pos,look}},
 time:t=>{TD.t=t==="night"?.75:t==="day"?.15:+t},
 emit:n=>S.emit(n),sfx:f=>sfx(f)};
