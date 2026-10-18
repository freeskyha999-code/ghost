const fs = require('fs');
const f = 'E:\\game\\恶魔轮盘\\src\\js\\game.js';
let s = fs.readFileSync(f, 'latin1');
const re = /(\}\);\r?\n    \}\r?\n)    \}(\r?\n\r?\n    playBeerFirstPerson)/g;
const n = (s.match(re) || []).length;
if (n !== 1) throw new Error('expected 1 duplicate brace, found ' + n);
s = s.replace(re, (m, a, b) => a + b.replace(/^/, ''));
fs.writeFileSync(f, s, 'latin1');
console.log('removed duplicate closing brace');
