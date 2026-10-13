const fs = require('fs');
const h = fs.readFileSync('E:\\game\\恶魔轮盘\\index.html', 'utf8');
const inj = "<script>window.addEventListener('load',function(){setTimeout(function(){" +
  "var m=document.getElementById('menu-screen'); if(m) m.style.display='none';" +
  "var hud=document.getElementById('hud'); if(hud) hud.style.display='none';" +
  "try{ var S=window._sceneManager; S.renderTableItems(" +
  "[{id:'beer',slotIndex:0,name:'b'},{id:'saw',slotIndex:1,name:'s'},{id:'handcuffs',slotIndex:2,name:'h'},{id:'cigarette',slotIndex:3,name:'c'},{id:'morphine',slotIndex:4,name:'m'},{id:'taser',slotIndex:5,name:'t'}]," +
  "[{id:'beer',slotIndex:0,name:'b'},{id:'cigarette',slotIndex:1,name:'c'},{id:'check_shell',slotIndex:2,name:'k'},{id:'morphine',slotIndex:3,name:'m'},{id:'taser',slotIndex:4,name:'t'}]);" +
  "var fp = location.search.indexOf('fp=1')>=0;" +
  "if(fp){ setTimeout(function(){ S.playCigaretteFirstPerson(new THREE.Vector3(0.5,0.8,2.5), function(){}); }, 600); }" +
  "}catch(e){document.title='ERR '+e.message;}" +
  "},1000);});</script></body>";
fs.writeFileSync('E:\\game\\恶魔轮盘\\_shot.html', h.replace('</body>', inj), 'utf8');
console.log('shot page written');
