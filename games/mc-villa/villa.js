'use strict';
/* 两层别墅：只使用原版方块 id + 原版方块状态属性。坐标：x 东、z 南、y 上；地表草方块在 y=8。 */
function buildVilla(W){
 const G=8,x0=34,x1=44,z0=30,z1=38,F=(a,b,c,d,e,f,n,p)=>W.fill(a,b,c,d,e,f,n,p),S=(x,y,z,n,p)=>W.set(x,y,z,n,p);
 const rnd=(x,z,s)=>{let h=Math.imul((x*374761393+z*668265263+s*2147483647)|0,1274126177);h^=h>>>13;return((h>>>0)%1000)/1000;};
 const log=(x,y,z,a)=>S(x,y,z,'oak_log',{axis:a||'y'}),st=(x,y,z,n,f,h)=>S(x,y,z,n,{facing:f,half:h||'bottom'});
 /* 地形：院子区域平坦，外围缓缓起伏 */
 for(let x=0;x<W.W;x++)for(let z=0;z<W.D;z++){const d=Math.max(Math.abs(x-39)-20,Math.abs(z-38)-19,0),
  h=G+(d?Math.max(0,Math.round(d*.17+Math.sin(x*.31)*Math.cos(z*.27)*1.6)):0);
  F(x,0,z,x,h-4,z,'stone');F(x,h-3,z,x,h-1,z,'dirt');S(x,h,z,'grass_block',{snowy:'false'});}
 /* 地基、地板、墙 */
 F(x0,9,z0,x1,9,z1,'cobblestone');F(x0+1,9,z0+1,x1-1,9,z1-1,'oak_planks');
 F(x0,10,z0,x1,16,z0,'calcite');F(x0,10,z1,x1,16,z1,'calcite');F(x0,10,z0,x0,16,z1,'calcite');F(x1,10,z0,x1,16,z1,'calcite');
 F(x0+1,13,z0+1,x1-1,13,z1-1,'spruce_planks');F(x0+1,17,z0+1,x1-1,17,z1-1,'spruce_planks');
 for(const y of[13,17]){for(let x=x0;x<=x1;x++){S(x,y,z0,'stripped_spruce_log',{axis:'x'});S(x,y,z1,'stripped_spruce_log',{axis:'x'});}
  for(let z=z0;z<=z1;z++){S(x0,y,z,'stripped_spruce_log',{axis:'z'});S(x1,y,z,'stripped_spruce_log',{axis:'z'});}}
 for(const x of[x0,x1])for(const z of[z0,z1])for(let y=10;y<=17;y++)S(x,y,z,'spruce_log',{axis:'y'});
 /* 窗：玻璃板（连接关系由引擎按原版规则计算） */
 const win=(x,y,z)=>{S(x,y,z,'glass_pane');S(x,y+1,z,'glass_pane');};
 for(const y of[11,15]){for(const x of[36,37,41,42]){win(x,y,z0);win(x,y,z1);}for(const z of[33,34])win(x0,y,z),win(x1,y,z);}
 /* 前门 + 门前台阶 */
 S(39,10,z1,'air');S(39,11,z1,'air');
 S(39,10,z1,'spruce_door',{facing:'south',half:'lower',hinge:'left',open:'false'});S(39,11,z1,'spruce_door',{facing:'south',half:'upper',hinge:'left',open:'false'});
 for(const x of[38,39,40])st(x,9,39,'cobblestone_stairs','north');
 for(const x of[37,41]){S(x,10,40,'spruce_fence');S(x,11,40,'spruce_fence');S(x,12,40,'lantern',{hanging:'false'});}
 for(let z=40;z<=52;z++)for(const x of[38,39,40])S(x,G,z,'dirt_path');
 /* 屋顶：人字顶，楼梯 + 屋脊 */
 for(let x=x0-1;x<=x1+1;x++){for(let k=0;k<=4;k++){st(x,18+k,29+k,'dark_oak_stairs','south');st(x,18+k,39-k,'dark_oak_stairs','north');}
  S(x,22,34,'dark_oak_planks');S(x,23,34,'dark_oak_slab',{type:'bottom'});}
 F(x0,18,z0,x1,18,z0,'calcite');F(x0,18,z1,x1,18,z1,'calcite');
 for(let z=z0;z<=z1;z++){const t=18+Math.min(z-29,39-z);for(const x of[x0,x1])F(x,18,z,x,t-1,z,'calcite');}
 /* 室内楼梯（朝东上行）与楼梯口 */
 for(let k=0;k<4;k++){const x=37+k;st(x,10+k,31,'spruce_stairs','east');if(k)F(x,10,31,x,9+k,31,'spruce_planks');}
 F(37,13,31,39,13,31,'air');F(37,14,32,39,14,32,'spruce_fence');S(36,14,31,'spruce_fence');
 /* 一层：客厅（西）+ 餐厨（东），开放式 */
 for(let x=36;x<=38;x++)for(let z=33;z<=37;z++)if(!(x===37&&z===35)&&!(x===36&&z===35))S(x,10,z,'red_carpet');
 for(let z=34;z<=36;z++)st(35,10,z,'spruce_stairs','west');
 S(36,10,35,'spruce_slab',{type:'bottom'});S(37,10,35,'spruce_slab',{type:'bottom'});
 for(let y=10;y<=12;y++)for(const z of[31,32])S(35,y,z,'bookshelf');
 S(36,10,37,'potted_poppy');S(42,10,37,'potted_azure_bluet');S(35,10,37,'potted_dandelion');
 S(38,11,37,'wall_torch',{facing:'north'});S(40,11,37,'wall_torch',{facing:'north'});
 S(37,12,35,'lantern',{hanging:'true'});S(42,12,35,'lantern',{hanging:'true'});
 S(41,10,31,'furnace',{facing:'south',lit:'true'});S(42,10,31,'smoker',{facing:'south',lit:'false'});S(43,10,31,'barrel',{facing:'up',open:'false'});
 S(43,10,32,'cauldron');S(43,10,33,'crafting_table');S(41,11,31,'spruce_slab',{type:'bottom'});
 for(const[x,z]of[[41,35],[42,35],[41,36],[42,36]]){S(x,10,z,'spruce_fence');S(x,11,z,'spruce_slab',{type:'bottom'});}
 st(40,10,35,'spruce_stairs','west');st(40,10,36,'spruce_stairs','west');st(43,10,35,'spruce_stairs','east');st(43,10,36,'spruce_stairs','east');
 st(41,10,34,'spruce_stairs','north');st(42,10,34,'spruce_stairs','north');st(41,10,37,'spruce_stairs','south');st(42,10,37,'spruce_stairs','south');
 /* 二层：主卧（西）、书房与客卧（东） */
 F(39,14,33,39,16,37,'calcite');F(39,14,35,39,15,35,'air');
 S(35,14,35,'white_bed',{facing:'west',part:'head'});S(36,14,35,'white_bed',{facing:'west',part:'foot'});
 for(const z of[34,36]){S(35,14,z,'barrel',{facing:'up',open:'false'});S(35,15,z,'lantern',{hanging:'false'});}
 for(let x=36;x<=38;x++)for(let z=33;z<=37;z++)if(!(z===35&&x<=36))S(x,14,z,'blue_carpet');
 S(38,14,37,'bookshelf');S(37,14,37,'bookshelf');S(38,15,37,'bookshelf');S(37,15,37,'wall_torch',{facing:'north'});
 S(37,16,35,'lantern',{hanging:'true'});
 for(let y=14;y<=15;y++){F(42,y,31,43,y,31,'bookshelf');F(43,y,32,43,y,33,'bookshelf');}
 S(42,14,32,'lectern',{facing:'south',has_book:'false'});S(43,14,34,'crafting_table');S(40,14,33,'jukebox',{has_record:'false'});
 st(41,14,33,'spruce_stairs','west');S(42,16,33,'lantern',{hanging:'true'});
 S(43,14,36,'red_bed',{facing:'east',part:'head'});S(42,14,36,'red_bed',{facing:'east',part:'foot'});
 S(41,14,36,'barrel',{facing:'up',open:'false'});S(41,15,36,'lantern',{hanging:'false'});S(42,14,37,'potted_cornflower');
 for(let x=41;x<=42;x++)for(let z=34;z<=35;z++)S(x,14,z,'red_carpet');
 /* 院子：栅栏、门、角灯 */
 const fx0=26,fx1=52,fz0=24,fz1=52;
 for(let x=fx0;x<=fx1;x++)for(const z of[fz0,fz1])if(!(z===fz1&&x===39))S(x,G+1,z,'oak_fence');
 for(let z=fz0;z<=fz1;z++)for(const x of[fx0,fx1])S(x,G+1,z,'oak_fence');
 S(39,G+1,fz1,'oak_fence_gate',{facing:'north',in_wall:'false',open:'false',powered:'false'});
 for(const[x,z]of[[fx0,fz0],[fx1,fz0],[fx0,fz1],[fx1,fz1],[38,fz1],[40,fz1]])S(x,G+2,z,'torch');
 /* 树、花草、花圃 */
 const tree=(x,z,b)=>{const y=W.top(x,z)+1,h=4+(rnd(x,z,1)*2|0),lg=b?'birch_log':'oak_log',lv=b?'birch_leaves':'oak_leaves';
  for(let dy=h-2;dy<=h+1;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const r=dx*dx+dz*dz+(dy>=h?(dy-h+1)*2:0);if(r<=5&&!(dx===0&&dz===0&&dy<h))S(x+dx,y+dy,z+dz,lv,{});}
  for(let i=0;i<h;i++)S(x,y+i,z,lg,{axis:'y'});};
 for(const[x,z,b]of[[29,27],[49,28,1],[30,47,1],[49,46],[29,36],[50,37,1]])tree(x,z,b);
 for(let i=0;i<46;i++){const a=i*2.4,r=24+rnd(i,3,5)*28,x=Math.round(48+Math.cos(a)*r),z=Math.round(48+Math.sin(a)*r);if(x>8&&z>8&&x<88&&z<88)tree(x,z,i%3===0);}
 const fl=['poppy','dandelion','azure_bluet','cornflower','oxeye_daisy'];
 for(let x=fx0+1;x<fx1;x++)for(let z=fz0+1;z<fz1;z++){if(x>=x0-2&&x<=x1+2&&z>=z0-2&&z<=z1+2||(x>=38&&x<=40&&z>=z1))continue;
  if(W.get(x,G+1,z).n!=='air')continue;const r=rnd(x,z,7);
  if(r<.16)S(x,G+1,z,'short_grass');else if(r<.2)S(x,G+1,z,fl[(rnd(x,z,9)*5)|0]);else if(r<.215){S(x,G+1,z,'tall_grass',{half:'lower'});S(x,G+2,z,'tall_grass',{half:'upper'});}
  else if(r<.225){S(x,G+1,z,'rose_bush',{half:'lower'});S(x,G+2,z,'rose_bush',{half:'upper'});}}
 for(let i=0;i<30;i++)for(let j=0;j<12;j++){const x=Math.round(39+Math.cos(i*5.3)*(22+j)),z=Math.round(38+Math.sin(i*3.7)*(20+j));if(W.get(x,W.top(x,z),z).n==='grass_block'&&W.get(x,W.top(x,z)+1,z).n==='air'&&rnd(x,z,3)<.5)S(x,W.top(x,z)+1,z,'short_grass');}
 F(46,G+1,44,47,G+1,45,'hay_block',{axis:'y'});S(30,G+1,32,'barrel',{facing:'up',open:'false'});
 buildVilla.spawn=[39.5,9,49.5,0];
}
