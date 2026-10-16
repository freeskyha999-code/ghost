"use strict";
/* ============ 工具 ============ */
const $=i=>document.getElementById(i),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fmt=s=>String(s).replace(/\{(\w+)\}/g,(m,k)=>S.f[k]??0);
/* 音效：全部 WebAudio 合成，零资源文件 */
let AC,NB,MUTE=false;
const ac=()=>{if(!AC){AC=new AudioContext();NB=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}if(AC.state=="suspended")AC.resume();return AC};
function tone(f,d,type="sine",v=.05,at=0){if(MUTE)return;try{const a=ac(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime+at;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d)}catch(e){}}
function noise(d,fq,v=.12){if(MUTE)return;try{const a=ac(),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime;s.buffer=NB;f.type="lowpass";f.frequency.value=fq;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(a.destination);s.start(t);s.stop(t+d)}catch(e){}}
const sfx=(f=520,d=.04)=>tone(f,d,"square",.03);
const snd={break:()=>{noise(.18,900,.2);tone(110,.12,"triangle",.08)},place:()=>{noise(.08,500,.15);tone(180,.08,"triangle",.07)},step:()=>noise(.07,380+Math.random()*200,.07),ding:()=>{tone(784,.4,"sine",.06);tone(1175,.5,"sine",.05,.1)}};
let musicOn=false;function music(){if(musicOn)return;musicOn=true;if(PACK.music){bgm();return}const sc=[261.6,293.7,329.6,392,440,523.3,587.3];(function n(){if(!MUTE&&!UI.open){const f=sc[Math.random()*7|0]*(Math.random()<.3?.5:1);tone(f,3,"sine",.035);if(Math.random()<.4)tone(f*1.5,3,"sine",.02,.35)}setTimeout(n,2500+Math.random()*4500)})()}
