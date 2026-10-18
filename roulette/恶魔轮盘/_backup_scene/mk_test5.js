const fs = require('fs');
const h = fs.readFileSync('E:\\game\\恶魔轮盘\\index.html', 'utf8');
const inj = "<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message)+'@'+e.lineno);});" +
"function show(txt,color){var o=document.createElement('pre');o.style.cssText='position:fixed;left:0;top:0;right:0;z-index:99999;background:rgba(0,0,0,0.75);color:'+color+';font-size:14px;padding:8px;white-space:pre-wrap;max-height:40%;overflow:hidden';o.textContent=txt;document.body.appendChild(o);}" +
"window.addEventListener('load',function(){setTimeout(function(){" +
"var m=document.getElementById('menu-screen'); if(m) m.style.display='none';" +
"var hud=document.getElementById('hud'); if(hud) hud.style.display='none';" +
"var parts=location.hash.replace('#','').split(':'); var which=parts[0]; var steps=parseInt(parts[1]||'0',10);" +
"var fake=performance.now(); performance.now=function(){return fake;};" +
"try{ var S=window._sceneManager; var log=[]; var cl=function(){log.push('climax');}; var dn=function(){log.push('done');};" +
"if(which==='gun'||which==='gunsawn'){ if(which==='gunsawn') S.sawOffGun(); S.camera.position.set(1.3,1.5,3.2); S.camera.lookAt(0,0.8,0.2); S.camera.fov=50; S.camera.updateProjectionMatrix(); }" +
"if(which==='gunfront'){ S.camera.position.set(-1.2,1.3,-0.5); S.camera.lookAt(0,0.8,-2.2); S.camera.fov=50; S.camera.updateProjectionMatrix(); }" +
"if(which==='self') S.playShootSequence({shooterIsMe:true,selfShot:true,live:true,damage:1},cl,dn);" +
"if(which==='selfblank') S.playShootSequence({shooterIsMe:true,selfShot:true,live:false,damage:0},cl,dn);" +
"if(which==='atdemon') S.playShootSequence({shooterIsMe:true,selfShot:false,live:true,damage:1},function(){cl();S.demonReact('hit',{damage:1,side:0.12});},dn);" +
"if(which==='bydemon') S.playShootSequence({shooterIsMe:false,selfShot:false,live:true,damage:1},cl,dn);" +
"if(which==='demonself') S.playShootSequence({shooterIsMe:false,selfShot:true,live:true,damage:1},function(){cl();S.demonReact('hit',{damage:1,side:0.12});},dn);" +
"if(which==='react') S.demonReact('hit',{damage:2,side:0.12});" +
"var realRender=S.renderer.render.bind(S.renderer); S.renderer.render=function(){};" +
"for(var i=0;i<steps-1;i++){ fake+=50; S._renderWithShake(); S._demonFxStep(); }" +
"S.renderer.render=realRender; fake+=50; S._renderWithShake(); S._demonFxStep();" +
"show(which+' step='+steps+' t='+(steps*0.05).toFixed(2)+'s '+log.join(',')+' ERRS='+JSON.stringify(window.__errs),'#0f0');" +
"}catch(e){ show('THROW '+which+' '+e.message+' '+(e.stack||'').slice(0,300),'#f55'); }" +
"},1000);});</script></body>";
fs.writeFileSync('E:\\game\\恶魔轮盘\\_t.html', h.replace('</body>', inj), 'utf8');
console.log('test page v5 written');
