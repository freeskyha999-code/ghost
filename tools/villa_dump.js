// 别墅场景的 Node 工具（与浏览器里跑的是同一份 engine.js / villa.js）
//   node tools/villa_dump.js blocks <blocks.txt>        统计场景用到的方块 id
//   node tools/villa_dump.js mesh <pack.json> <out.bin> 生成网格并做自检，输出顶点数据给封面渲染
const fs = require('fs');
const dir = __dirname + '/../games/mc-villa/';
const src = fs.readFileSync(dir + 'engine.js', 'utf8') + fs.readFileSync(dir + 'villa.js', 'utf8') +
  ';return {World,buildVilla,build,light,layout,bk,MISS,setPK:p=>{PK=p}};';
const E = new Function('module', src)(undefined);
const W = new E.World();
E.buildVilla(W);
if (process.argv[2] === 'blocks') {
  const names = [...new Set(W.pal.map(s => s.n))].filter(n => n !== 'air').sort();
  fs.writeFileSync(process.argv[3], names.join('\n') + '\n');
  console.log(names.length + ' 种方块');
} else {
  E.setPK(JSON.parse(fs.readFileSync(process.argv[3], 'utf8')));
  E.layout();
  W.fix();
  const bad = W.pal.filter(s => s.n !== 'air' && s.p.shape !== undefined || /_stairs$/.test(s.n) === false).filter(s => s.n !== 'air' && E.bk(s).q.length === 0).map(s => s.n);
  if (bad.length || E.MISS.size) { console.error('自检失败：无模型', bad, '缺贴图', [...E.MISS]); process.exit(1); }
  const M = E.build(W, E.light(W));
  fs.writeFileSync(process.argv[4], Buffer.from(M.O.buffer));
  console.log('自检通过，顶点', M.O.length / 10);
}
