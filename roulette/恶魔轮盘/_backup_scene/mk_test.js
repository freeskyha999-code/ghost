const fs = require('fs');
const h = fs.readFileSync('E:\\game\\恶魔轮盘\\index.html', 'utf8');
const inj = "<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message)+'@'+e.lineno);});" +
"window.addEventListener('load',function(){setTimeout(function(){" +
"var m=document.getElementById('menu-screen'); if(m) m.style.display='none';" +
"var hud=document.getElementById('hud'); if(hud) hud.style.display='none';" +
"try{ var S=window._sceneManager; var U=new THREE.Vector3(0.5,0.8,2.5), T=new THREE.Vector3(0,4.5,-7);" +
"var log=[]; function step(name,fn){ return function(){ log.push(name); fn(); }; }" +
"var seq=[" +
"function(n){S.playBeerFirstPerson(U,n);}," +
"function(n){S.playHandcuffsFirstPerson(U,T,n);}," +
"function(n){S.playSawFirstPerson(n);}," +
"function(n){S.playMorphineFirstPerson(U,T,n);}," +
"function(n){S.playTaserFirstPerson(n);}," +
"function(n){S.playMagnifierFirstPerson(n);}" +
"]; var names=['beer','cuffs','saw','morphine','taser','magnifier']; var i=0;" +
"function next(){ if(i>0) log.push('ok:'+names[i-1]); if(i>=seq.length){ document.title='DONE '+log.join(',')+' ERRS='+JSON.stringify(window.__errs); return; } var f=seq[i++]; try{ f(next); }catch(e){ document.title='THROW '+names[i-1]+' '+e.message; } }" +
"next();" +
"}catch(e){document.title='ERR '+e.message;}" +
"},1000);});</script></body>";
fs.writeFileSync('E:\\game\\恶魔轮盘\\_t.html', h.replace('</body>', inj), 'utf8');
console.log('test page written');
