'use strict';
/* 矿洞：整个洞穴系统用代码「雕」出来，只用原版方块。坐标为世界真实坐标，地表草方块层 y=C.G+C.OY(=32)。
   路线：山坡洞口 → 窄矿道 → 台阶下行 → 废弃矿井大厅 → 西：钟乳石溶洞+地下湖 / 北：深层岩浆洞 / 南：紫水晶晶洞 */
function buildMine(W,C){
 const rnd=C.rnd,Wd=W.W,Dd=W.D,ht=new Int16Array(Wd*Dd);
 for(let x=0;x<Wd;x++)for(let z=0;z<Dd;z++)ht[z*Wd+x]=W.top(x,z);
 const put=(x,y,z,n,p)=>W.set(x,y,z,n,p),nm=(x,y,z)=>W.get(x,y,z).n;
 /* 挖空一格：别把顶打穿到地表（洞口一带例外） */
 const dig=(x,y,z)=>{if(x<8||z<8||x>88||z>88||y<2)return;if(!(x>=70&&z>=44&&z<=50)&&y>ht[z*Wd+x]-3)return;W.set(x,y,z,'air');};
 const box=(x1,y1,z1,x2,y2,z2)=>{for(let y=y1;y<=y2;y++)for(let z=z1;z<=z2;z++)for(let x=x1;x<=x2;x++)dig(x,y,z);};
 const FL=[],CE=[];
 /* 平地穹顶洞室：fy 为地面方块 y，顶部呈圆顶并带噪声 */
 function dome(cx,cz,fy,rx,rz,ry,seed,tag){for(let x=cx-rx;x<=cx+rx;x++)for(let z=cz-rz;z<=cz+rz;z++){const dx=(x-cx)/rx,dz=(z-cz)/rz,r2=dx*dx+dz*dz;if(r2>=1)continue;
  const h=Math.floor(ry*Math.sqrt(1-r2)+(rnd(x,z,seed)-.5)*1.4);if(h<2)continue;box(x,fy+1,z,x,fy+h,z);FL.push([x,fy,z,tag]);CE.push([x,fy+h+1,z,tag]);}}
 const tx=(fy,x1,x2,z,w,h)=>{const r=(w-1)/2;box(Math.min(x1,x2),fy+1,z-r,Math.max(x1,x2),fy+h,z+r);};
 const tz=(fy,z1,z2,x,w,h)=>{const r=(w-1)/2;box(x-r,fy+1,Math.min(z1,z2),x+r,fy+h,Math.max(z1,z2));};
 /* 台阶下行 n 级：dir 为行进方向（原版楼梯 facing 指向“上坡”方向） */
 function ramp(ax,dir,a,c,fy0,n,w,h){const r=(w-1)/2,face=ax==='x'?(dir>0?'west':'east'):(dir>0?'north':'south');
  for(let i=0;i<n;i++){const t=a+dir*i,fy=fy0-i;for(let k=-r;k<=r;k++){if(ax==='x'){box(t,fy+1,c+k,t,fy+h,c+k);put(t,fy,c+k,'stone_stairs',{facing:face,half:'bottom',shape:'straight'});}
   else{box(c+k,fy+1,t,c+k,fy+h,t);put(c+k,fy,t,'stone_stairs',{facing:face,half:'bottom',shape:'straight'});}}}}
 const railx=(y,x1,x2,z)=>{for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)put(x,y,z,'rail',{shape:'east_west'});};
 const supX=(fy,x,zc)=>{for(const k of[-1,1]){put(x,fy+1,zc+k,'oak_fence');put(x,fy+2,zc+k,'oak_fence');}for(let k=-1;k<=1;k++)put(x,fy+3,zc+k,'oak_planks');};
 const barrel=(x,y,z)=>put(x,y,z,'barrel',{facing:'up',open:'false'});
 const oreFor=(x,y,z)=>{const r=rnd(x,z,y*13+5),d=y<16;let n=null;
  if(r<.03)n='coal_ore';else if(r<.05)n='iron_ore';else if(r<.065)n='copper_ore';else if(y<26&&r<.075)n='lapis_ore';else if(y<24&&r<.087)n='redstone_ore';else if(y<22&&r<.095)n='gold_ore';else if(y<17&&r<.108)n='diamond_ore';else if(y<22&&r<.1085)n='emerald_ore';
  return n?(d?'deepslate_'+n:n):null;};
 const orep=(x,y,z,n)=>put(x,y,z,n,/redstone/.test(n)?{lit:'false'}:undefined);
 /* 侧室：从隧道侧壁伸出的矿石小室（s=-1 朝北，+1 朝南） */
 function alcove(x,zc,s,fy){const g=zc+s*2,z1=g+s*3,z2=g+s*7;box(x,fy+1,Math.min(g,g+s*2),x,fy+3,Math.max(g,g+s*2));box(x-2,fy+1,Math.min(z1,z2),x+2,fy+3,Math.max(z1,z2));
  barrel(x,fy+1,z1+s);put(x+2,fy+2,z1+s*2,'wall_torch',{facing:'west'});put(x-2,fy+3,z2,'cobweb');put(x+2,fy+3,z1,'cobweb');
  for(let k=-2;k<=2;k++)for(let y=fy+1;y<=fy+3;y++)if(rnd(x+k,z2,y)<.55){const o=oreFor(x+k*7,y+3,z2)||(y<17?'deepslate_iron_ore':'iron_ore');orep(x+k,y,z2+s,o);}}

 /* ===== 1 洞口 + 窄矿道（3 宽 3 高）+ 台阶下行 ===== */
 tx(32,71,80,47,3,3);tz(32,47,52,80,3,3);ramp('z',1,53,80,32,6,3,4);tz(26,59,60,80,3,4);
 for(const z of[45,49])for(let y=33;y<=35;y++)put(71,y,z,'oak_log',{axis:'y'});for(let z=46;z<=48;z++)put(71,35,z,'oak_planks');
 for(const x of[75,79]){supX(32,x,47);}
 railx(33,72,80,47);put(74,35,46,'wall_torch',{facing:'east'});put(72,33,46,'barrel',{facing:'up',open:'false'});put(76,34,48,'cobweb');put(78,35,46,'cobweb');
 /* ===== 2 废弃矿井大厅（19×15，5 高） ===== */
 box(70,27,61,88,31,75);
 for(const x of[74,79,84])for(const z of[64,72])for(let y=27;y<=31;y++)put(x,y,z,'oak_log',{axis:'y'});
 for(const x of[74,79,84])for(let z=64;z<=72;z++)if(z!==68||true)put(x,31,z,'oak_planks');
 railx(27,88,67,68);for(const[x,z]of[[71,63],[87,74],[71,74],[86,62]]){barrel(x,27,z);put(x,28,z,'lantern',{hanging:'false'});}
 for(const[x,z]of[[76,66],[82,70],[76,72]]){put(x,31,z,'iron_chain',{axis:'y'});put(x,30,z,'lantern',{hanging:'true'});}
 for(let i=0;i<14;i++)put(71+(rnd(i,1,9)*17|0),30,62+(rnd(i,2,9)*13|0),'cobweb');
 /* ===== 3 西：隧道 → 台阶 → 钟乳石溶洞 A ===== */
 tx(26,69,67,68,3,4);ramp('x',-1,66,68,26,4,3,4);tx(22,62,33,68,3,3);railx(23,62,36,68);
 for(let x=57;x>=39;x-=6)supX(22,x,68);for(const x of[63,54,42])put(x,24,69,'wall_torch',{facing:'north'});
 alcove(54,68,-1,22);alcove(42,68,-1,22);alcove(48,68,-1,22);
 dome(22,68,22,14,12,8,31,'A');
 for(let x=12;x<=28;x++)for(let z=63;z<=73;z++){const dx=(x-20)/7.5,dz=(z-68)/5.5;if(dx*dx+dz*dz<1){put(x,21,z,'water');put(x,22,z,'water');}}
 for(let x=12;x<=28;x++){put(x,22,68,'oak_planks');put(x,23,67,'oak_fence');put(x,23,69,'oak_fence');if(x%8===4)put(x,24,67,'lantern',{hanging:'false'});}
 /* ===== 4 北：长隧道 → 12 级长台阶 → 岩浆洞 B（深层） ===== */
 tz(26,46,60,74,3,4);ramp('z',-1,45,74,26,12,3,4);
 dome(72,24,14,13,11,10,47,'B');
 for(let x=64;x<=80;x++)for(let z=16;z<=28;z++){const dx=(x-72)/6.5,dz=(z-22)/4.5;if(dx*dx+dz*dz<1){put(x,13,z,'lava');put(x,14,z,'lava');}}
 for(let x=64;x<=80;x++){for(let z=21;z<=23;z++)put(x,14,z,'stone_bricks');if(x>=66&&x<=78){put(x,15,20,'iron_bars');put(x,15,24,'iron_bars');}}
 for(let x=62;x<=82;x++)for(let z=15;z<=29;z++){const dx=(x-72)/6.5,dz=(z-22)/4.5,r=dx*dx+dz*dz;if(r>=1&&r<1.3&&(z<21||z>23)&&nm(x,15,z)==='air'&&nm(x,14,z)!=='air')put(x,15,z,'iron_bars');}
 for(let i=0;i<14;i++){const x=64+(rnd(i,3,5)*17|0),z=14+(rnd(i,4,5)*16|0);if(nm(x,15,z)==='air'&&nm(x,14,z)!=='lava'&&nm(x,14,z)!=='stone_bricks')put(x,14,z,'magma_block');}
 /* ===== 5 南：支路 → 台阶下行 → 紫水晶晶洞 C ===== */
 tz(22,70,77,60,3,3);
 { const cx=44,cy=18,cz=77;
   for(let x=cx-9;x<=cx+9;x++)for(let y=cy-9;y<=cy+9;y++)for(let z=cz-9;z<=cz+9;z++){const r=Math.hypot(x-cx,y-cy,z-cz);if(r>8.5)continue;
    if(r<=5.5){if(y>=15)W.set(x,y,z,'air');else if(y===14)put(x,y,z,rnd(x,z,3)<.2?'budding_amethyst':'amethyst_block');else put(x,y,z,'smooth_basalt');}
    else put(x,y,z,r<=6.5?(rnd(x,z,y)<.12?'budding_amethyst':'amethyst_block'):r<=7.5?'calcite':'smooth_basalt');}
   ramp('x',-1,59,77,22,8,3,5);tx(14,51,46,77,3,4);
   const dir=[['up',0,1,0],['down',0,-1,0],['north',0,0,-1],['south',0,0,1],['west',-1,0,0],['east',1,0,0]],cl=['amethyst_cluster','large_amethyst_bud','medium_amethyst_bud','small_amethyst_bud'];
   for(let x=cx-6;x<=cx+6;x++)for(let y=14;y<=cy+7;y++)for(let z=cz-6;z<=cz+6;z++){if(nm(x,y,z)!=='air')continue;
    for(const[f,a,b,c]of dir){const t=nm(x-a,y-b,z-c);if((t==='amethyst_block'||t==='budding_amethyst')&&rnd(x,z,y*7+a+b*2+c*3)<.2&&!(Math.abs(x-cx)<2&&z===cz&&y<17)){put(x,y,z,cl[(rnd(z,x,y)*4)|0],{facing:f});break;}}}}
 /* ===== 6 装饰：钟乳石、石笋、苔藓、蘑菇、吊灯、岩浆洞的萤石与岩浆 ===== */
 for(const[x,fy,z,tag]of FL){if(nm(x,fy+1,z)!=='air')continue;const r=rnd(x,z,5);
  if(tag==='A'&&rnd(x>>2,z>>2,77)<.4&&nm(x,fy,z)!=='water'){put(x,fy,z,'moss_block');if(rnd(x,z,3)<.14)put(x,fy+1,z,rnd(x,z,4)<.5?'red_mushroom':'brown_mushroom');else if(rnd(x,z,8)<.18)put(x,fy+1,z,'short_grass');}
  else if(r<.035&&nm(x,fy,z)!=='water'&&nm(x,fy+2,z)==='air'){put(x,fy,z,'dripstone_block');put(x,fy+1,z,'pointed_dripstone',{thickness:'tip',vertical_direction:'up'});}}
 for(const[x,cy,z,tag]of CE){if(nm(x,cy,z)==='air'||nm(x,cy-1,z)!=='air')continue;const r=rnd(x,z,6);
  if(tag==='B'&&r<.04)put(x,cy,z,'glowstone');
  else if(r<.07){put(x,cy,z,'dripstone_block');put(x,cy-1,z,'pointed_dripstone',{thickness:'tip',vertical_direction:'down'});}
  else if(r<.076&&nm(x,cy-2,z)==='air'){put(x,cy-1,z,'iron_chain',{axis:'y'});put(x,cy-2,z,'lantern',{hanging:'true'});}}
 /* ===== 7 矿石：只在暴露于空气的岩石上出现，越深越稀有；一部分成簇 ===== */
 const base=new Set(['stone','deepslate','andesite','tuff','granite','diorite']),nb=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
 for(let y=2;y<=46;y++)for(let z=8;z<=88;z++)for(let x=8;x<=88;x++){if(!base.has(nm(x,y,z)))continue;
  if(!nb.some(([a,b,c])=>W.get(x+a,y+b,z+c).n==='air'))continue;const o=oreFor(x,y,z);if(!o)continue;orep(x,y,z,o);
  if(rnd(x,z,y+41)<.6){const[a,b,c]=nb[(rnd(x,y,z)*6)|0];if(base.has(nm(x+a,y+b,z+c)))orep(x+a,y+b,z+c,o);}}
}
