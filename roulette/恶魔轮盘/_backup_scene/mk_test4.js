const fs = require('fs');
const h = fs.readFileSync('E:\\game\\恶魔轮盘\\index.html', 'utf8');
const inj = "<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message)+'@'+e.lineno);});" +
"function show(txt,color){var o=document.createElement('pre');o.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;background:#000;color:'+color+';font-size:20px;padding:16px;white-space:pre-wrap';o.textContent=txt;document.body.appendChild(o);}" +
"window.addEventListener('load',function(){setTimeout(function(){" +
"var m=document.getElementById('menu-screen'); if(m) m.style.display='none';" +
"var hud=document.getElementById('hud'); if(hud) hud.style.display='none';" +
"var parts=location.hash.replace('#','').split(':'); var which=parts[0]; var steps=parseInt(parts[1]||'80',10); var report=parts[2]!=='img';" +
"var fake=performance.now(); performance.now=function(){return fake;};" +
"try{ var S=window._sceneManager; var U=new THREE.Vector3(0.5,0.8,2.5), T=new THREE.Vector3(0,4.5,-7);" +
"S.renderTableItems([{id:'beer',slotIndex:0,name:'b'},{id:'saw',slotIndex:1,name:'s'}],[{id:'cigarette',slotIndex:0,name:'c'}]);" +
"var finished=false; var done=function(){ finished=true; };" +
"if(which==='beer') S.playBeerFirstPerson(U,done);" +
"else if(which==='cuffs') S.playHandcuffsFirstPerson(U,T,done);" +
"else if(which==='saw') S.playSawFirstPerson(done);" +
"else if(which==='morphine') S.playMorphineFirstPerson(U,T,done);" +
"else if(which==='taser') S.playTaserFirstPerson(done);" +
"else if(which==='magnifier') S.playMagnifierFirstPerson(done);" +
"for(var i=0;i<steps;i++){ fake+=50; S._renderWithShake(); }" +
"if(report) show((finished?'DONE ':'NOT-FINISHED ')+which+' steps='+steps+'\\nERRS='+JSON.stringify(window.__errs),finished?'#0f0':'#fa0');" +
"}catch(e){ show('THROW '+which+' '+e.message+'\\n'+(e.stack||''),'#f55'); }" +
"},1000);});</script></body>";
fs.writeFileSync('E:\\game\\恶魔轮盘\\_t.html', h.replace('</body>', inj), 'utf8');
console.log('test page v4 written');
