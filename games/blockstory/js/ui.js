"use strict";
/* ============ 6. UI ============ */
const UI={open:0,adv:null,pick:null,n:0,
 say(w,t){t=fmt(t);return new Promise(res=>{$("nm").textContent=w;const el=$("tx");el.textContent="";$("dlg").style.display="block";this.open=1;let i=0;
  const tm=setInterval(()=>{el.textContent=t.slice(0,++i);if(i%2==0)sfx(300+w.charCodeAt(0)%9*35);if(i>=t.length)clearInterval(tm)},28);
  this.adv=()=>{if(i<t.length){i=t.length;el.textContent=t;clearInterval(tm)}else{$("dlg").style.display="none";this.open=0;this.adv=null;res()}}})},
 choose(opts){return new Promise(res=>{document.exitPointerLock();const box=$("choices");box.innerHTML="";box.style.display="flex";this.open=1;this.n=opts.length;
  const done=i=>{box.style.display="none";this.open=0;this.pick=null;res(i)};this.pick=done;
  opts.forEach((t,i)=>{const b=document.createElement("button");b.textContent=(i+1)+". "+fmt(t);b.onclick=()=>done(i);box.appendChild(b)})})},
 async title(t,s,d=3){const e=$("title");e.querySelector("h1").textContent=fmt(t);e.querySelector("p").textContent=fmt(s||"");e.style.opacity=1;await sleep(d*1000);e.style.opacity=0},
 toast(t){const d=document.createElement("div");d.textContent=fmt(t);$("toast").appendChild(d);setTimeout(()=>d.remove(),5000)},
 quest(t){const q=$("quest");q.style.display=t?"block":"none";q.textContent=fmt(t||"")},
 hotbar(){const h=$("hotbar");h.innerHTML="";for(let i=0;i<9;i++){const b=B[i+1],c=document.createElement("canvas"),k=Atlas.idx[b.t[1]||b.t[0]];c.width=c.height=16;
  c.getContext("2d").drawImage(Atlas.cv,k%N*T,(k/N|0)*T,T,T,0,0,16,16);c.className=i==P.sel?"on":"";c.onclick=()=>{P.sel=i;this.hotbar()};h.appendChild(c)}}};
