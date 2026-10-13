const fs = require('fs');
const f = 'E:\\game\\恶魔轮盘\\src\\js\\models.js';
let s = fs.readFileSync(f, 'latin1');
function rep(x, y) {
    const n = s.split(x).length - 1;
    if (n !== 1) throw new Error('anchor count ' + n + ' for: ' + x);
    s = s.replace(x, () => y);
}
rep("g.fillStyle = '#21402f'; g.fillRect(0, 0, W, H);", "g.fillStyle = '#143022'; g.fillRect(0, 0, W, H);");
rep("gr.addColorStop(0, 'rgba(120,150,120,0.14)'); gr.addColorStop(1, 'rgba(120,150,120,0)');",
    "gr.addColorStop(0, 'rgba(110,140,110,0.08)'); gr.addColorStop(1, 'rgba(110,140,110,0)');");
rep('emissiveIntensity: 0.55', 'emissiveIntensity: 0.8');
fs.writeFileSync(f, s, 'latin1');
console.log('models.js tuned');

// debug page: hide menu and put sample items on both sides
const h = fs.readFileSync('E:\\game\\恶魔轮盘\\index.html', 'utf8');
const inj = "<script>window.addEventListener('load',function(){setTimeout(function(){" +
  "var m=document.getElementById('menu-screen'); if(m) m.style.display='none';" +
  "var hud=document.getElementById('hud'); if(hud) hud.style.display='none';" +
  "try{ window._sceneManager.renderTableItems(" +
  "[{id:'beer',slotIndex:0,name:'b'},{id:'saw',slotIndex:1,name:'s'},{id:'handcuffs',slotIndex:2,name:'h'},{id:'cigarette',slotIndex:4,name:'c'}]," +
  "[{id:'beer',slotIndex:0,name:'b'},{id:'cigarette',slotIndex:1,name:'c'},{id:'check_shell',slotIndex:2,name:'k'},{id:'morphine',slotIndex:3,name:'m'},{id:'taser',slotIndex:4,name:'t'}]);" +
  "}catch(e){document.title='ERR '+e.message;}" +
  "},1200);});</script></body>";
fs.writeFileSync('E:\\game\\恶魔轮盘\\_shot.html', h.replace('</body>', inj), 'utf8');
console.log('shot page written');
