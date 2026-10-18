const fs = require('fs');
const h = fs.readFileSync('E:\\game\\恶魔轮盘\\index.html', 'utf8');
const inj = "<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message)+'@'+e.lineno);});" +
"function show(txt,color){var o=document.createElement('pre');o.style.cssText='position:fixed;left:0;top:0;right:0;z-index:99999;background:rgba(0,0,0,0.7);color:'+color+';font-size:13px;padding:6px;white-space:pre-wrap;max-height:30%;overflow:hidden';o.textContent=txt;document.body.appendChild(o);}" +
"window.addEventListener('load',function(){setTimeout(function(){" +
"var m=document.getElementById('menu-screen'); if(m) m.style.display='none';" +
"var hud=document.getElementById('hud'); if(hud) hud.style.display='none';" +
"var parts=location.hash.replace('#','').split(':'); var which=parts[0]; var steps=parseInt(parts[1]||'0',10);" +
"var fake=performance.now(); performance.now=function(){return fake;};" +
"try{ var S=window._sceneManager; var log=[]; var U=new THREE.Vector3(0.5,0.8,2.5), T=new THREE.Vector3(0,4.5,-7);" +
"var ids=['beer','cigarette','saw','handcuffs','morphine','taser','check_shell'];" +
"S.renderTableItems(ids.map(function(id,i){return {id:id,slotIndex:i,name:id};}),[{id:'cigarette',slotIndex:0,name:'c'}]);" +
"function grab(slot){ var mdl=S.findModelBySlot('player',slot); if(!mdl){ log.push('NO MODEL slot '+slot); return; } S._fpGrab={model:mdl}; }" +
"var dn=function(){log.push('done');};" +
"if(which==='beer'){ grab(0); S.playBeerFirstPerson(U,dn); }" +
"else if(which==='cig'){ grab(1); S.playCigaretteFirstPerson2(U,dn); }" +
"else if(which==='saw'){ grab(2); S.playSawFirstPerson(dn); }" +
"else if(which==='cuffs'){ grab(3); S.playHandcuffsFirstPerson(U,T,dn); }" +
"else if(which==='morphine'){ grab(4); S.playMorphineFirstPerson(U,T,dn); }" +
"else if(which==='taser'){ grab(5); S.playTaserFirstPerson(dn); }" +
"else if(which==='mag'){ grab(6); S.playMagnifierFirstPerson(dn); }" +
"else if(which==='self'){ S.playShootSequence({shooterIsMe:true,selfShot:true,live:true,damage:1},function(){log.push('climax');},dn); }" +
"else if(which==='atdemon'){ S.playShootSequence({shooterIsMe:true,selfShot:false,live:true,damage:1},function(){log.push('climax');S.demonReact('hit',{damage:1,side:0.12});},dn); }" +
"else if(which==='bydemon'){ S.playShootSequence({shooterIsMe:false,selfShot:false,live:true,damage:1},function(){log.push('climax');},dn); }" +
"else if(which==='revive'){ S.demonReact('hit',{damage:1,lethal:true}); }" +
"var realRender=S.renderer.render.bind(S.renderer); S.renderer.render=function(){};" +
"for(var i=0;i<steps-1;i++){ fake+=50; S._renderWithShake(); S._demonFxStep(); if(which==='revive'&&i===60){S.demonReact('revive');} }" +
"S.renderer.render=realRender; fake+=50; S._renderWithShake(); S._demonFxStep();" +
"show(which+' step='+steps+' t='+(steps*0.05).toFixed(2)+'s '+log.join(',')+' ERRS='+JSON.stringify(window.__errs),'#0f0');" +
"}catch(e){ show('THROW '+which+' '+e.message+' '+(e.stack||'').slice(0,300),'#f55'); }" +
"},1000);});</script></body>";
fs.writeFileSync('E:\\game\\恶魔轮盘\\_t.html', h.replace('</body>', inj), 'utf8');
console.log('test page v6 written');
