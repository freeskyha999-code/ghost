
const IMGS=ASSETS.imgs,MESH=ASSETS.mesh,TMIR=ASSETS.tmir;
const PK={girl:{hf:'face',hs:'hair',ht:'hair',hb:'hair',tf:'shirt',tbc:0xe9e5df,al:'armL',ar:'armR',skirt:'skirt'},clerk:{hf:'cf',hs:'cs',ht:'cb',hb:'cb',tf:'ct',tbc:0x1b1c20,al:'ca',ar:'ca'}};
const $=id=>document.getElementById(id);
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=.95;document.body.appendChild(R.domElement);const cv=R.domElement;
const scene=new THREE.Scene(),BG=0x0a0f18;scene.background=new THREE.Color(BG);scene.fog=new THREE.Fog(BG,16,150);
const cam=new THREE.PerspectiveCamera(62,1,.05,170);cam.rotation.order='YXZ';
let yaw=Math.PI/2,pit=0,px=3.2,pz=-2.6,cmode='cine',follow=null;const cp=new THREE.Vector3(0,1.4,-16),ct=new THREE.Vector3(0,1.5,-5);
const HL=new THREE.HemisphereLight(0xdde8ff,0x555b60,.75);scene.add(HL);const lts=[-7.5,-3.5,.5].map(x=>{const l=new THREE.PointLight(0xf2f8ff,.55,11);l.position.set(x,2.6,-1);scene.add(l);return l});
const M=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o)),solid=(c,k)=>MTX(k||'pla',c),T={};
const tm=k=>M({map:T[k],alphaTest:.5});
function ctex(c,rx,ry){const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;if(rx){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry)}return t}
const cvs=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const loadAll=()=>Promise.all(Object.entries(IMGS).map(([k,s])=>new Promise(r=>{const i=new Image();i.onload=()=>{const t=new THREE.Texture(i);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.needsUpdate=true;if(k.slice(0,2)=='e_'){t.wrapS=t.wrapT=TMIR.includes(k.slice(2))?THREE.MirroredRepeatWrapping:THREE.RepeatWrapping;t.anisotropy=8}T[k]=t;r()};i.src=s})));
const add=(m,x,y,z,p)=>{m.position.set(x,y,z);(p||scene).add(m);return m};
const bx=(w,h,d,mt,x,y,z,p)=>{const g=new THREE.BoxGeometry(w,h,d);uvT(g,w,h,d,mt);return add(new THREE.Mesh(g,mt),x,y,z,p)};
function rbox(w,h,d,sx,sy,sz,t,ts,bs){const g=new THREE.BoxGeometry(w,h,d,sx,sy,sz),p=g.attributes.position,n=g.attributes.normal,a=w/2,b=h/2,c=d/2;
for(let i=0;i<p.count;i++){let qx=p.getX(i)/a,qy=p.getY(i)/b,qz=p.getZ(i)/c;const l=Math.hypot(qx,qy,qz)||1,k=1-t+t/l;
let nx=n.getX(i)*(1-t)+qx/l*t,ny=n.getY(i)*(1-t)+qy/l*t,nz=n.getZ(i)*(1-t)+qz/l*t;const nl=Math.hypot(nx,ny,nz)||1;n.setXYZ(i,nx/nl,ny/nl,nz/nl);
const s=qy>0?(ts||1):(bs||1);p.setXYZ(i,qx*k*a*s,qy*k*b,qz*k*c*s)}return g}
function b64(s,C){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new C(u.buffer)}
const QQ={girl:[262,872,860,[.013,.027,.085],135,.36],clerk:[255,1045,1040,[.01,.01,.012],150,.33]};
function human(k){const D=MESH[k],q=QQ[k],g=new THREE.Group(),geo=new THREE.BufferGeometry(),U={uA:{value:0},uP:{value:0},uHY:{value:0},uHP:{value:0},uReach:{value:0},uReachR:{value:0}};
geo.setAttribute('position',new THREE.BufferAttribute(b64(D.v,Float32Array),3));geo.setAttribute('aw',new THREE.BufferAttribute(b64(D.w,Float32Array),4));geo.setIndex(new THREE.BufferAttribute(b64(D.f,Uint32Array),1));geo.computeVertexNormals();
const m=new THREE.MeshStandardMaterial({roughness:.85});
m.onBeforeCompile=s=>{Object.assign(s.uniforms,U,{tF:{value:T[k+'_f']},tB:{value:T[k+'_b']},tS:{value:T[k+'_s']},uK:{value:D.K},uPL:{value:D.PYL},uPA:{value:D.PYA},uYH:{value:q[0]},uYL:{value:q[1]},uHem:{value:q[2]},uPN:{value:(1475-285)*D.K},uSX:{value:q[4]*D.K},uRel:{value:q[5]},uU:{value:new THREE.Vector3(...q[3])}});
s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
attribute vec4 aw;uniform float uA,uP,uPL,uPA,uHY,uHP,uPN,uYH,uK,uSX,uRel,uReach,uReachR;varying vec3 vP,vN;
vec3 R(vec3 p,float y,float a){float s=sin(a),c=cos(a);vec3 d=p-vec3(0.,y,0.);return vec3(d.x,d.y*c-d.z*s+y,d.y*s+d.z*c);}
vec3 Rz(vec3 p,vec3 c,float a){float s=sin(a),k=cos(a);vec3 d=p-c;return vec3(d.x*k-d.y*s,d.x*s+d.y*k,d.z)+c;}
vec3 tp(vec3 p,float o){float w=sin(uP)*uA*.45;p=Rz(p,vec3(uSX*o,uPA*o,0.),-uRel*aw.z);p=Rz(p,vec3(-uSX*o,uPA*o,0.),uRel*aw.w);p=R(p,uPL*o,w*aw.x);p=R(p,uPL*o,-w*aw.y);p=R(p,uPA*o,-w*.7*aw.z-uReach*1.25*aw.z);p=R(p,uPA*o,w*.7*aw.w-uReachR*1.25*aw.w);float hw=clamp((uYH+28.-(1475.-position.y/uK))/44.,0.,1.);if(hw>0.){vec3 c=vec3(0.,uPN*o,0.);vec3 d=p-c;float a=uHY*hw,b=uHP*hw;d=vec3(d.x*cos(a)+d.z*sin(a),d.y,-d.x*sin(a)+d.z*cos(a));d=vec3(d.x,d.y*cos(b)-d.z*sin(b),d.y*sin(b)+d.z*cos(b));p=c+d;}return p;}`).replace('#include <beginnormal_vertex>','vec3 objectNormal=tp(normal,0.);').replace('#include <begin_vertex>','vec3 transformed=tp(position,1.);vP=position;vN=normal;');
s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vP,vN;uniform sampler2D tF,tB,tS;uniform float uK,uYH,uYL,uHem;uniform vec3 uU;').replace('#include <map_fragment>',`vec3 n=normalize(vN);float yp=1475.-vP.y/uK,u=vP.x/(1024.*uK),v=1.-yp/1536.;float wf=pow(max(n.z,0.),3.)+.05*step(uYH+20.,yp),wb=pow(max(-n.z,0.),3.)+.05;
float ws=pow(abs(n.x),3.)*clamp(1.-smoothstep(uYH-10.,uYH+10.,yp)+smoothstep(uYL-10.,uYL+10.,yp),0.,1.);
vec3 cf=pow(texture2D(tF,vec2(.5+u,v)).rgb,vec3(2.2)),cb=pow(texture2D(tB,vec2(.5-u,v)).rgb,vec3(2.2)),cs=pow(texture2D(tS,vec2(.5-vP.z/(1024.*uK),v)).rgb,vec3(2.2));
vec3 c=(cf*wf+cb*wb+cs*ws)/(wf+wb+ws);
c=mix(c,uU,smoothstep(.3,.6,-n.y)*step(uHem-40.,yp)*step(yp,uHem+50.));diffuseColor.rgb=c;`)};
const HS=['_f','_s','_b'];(D.hp||[]).forEach((hp,pi)=>{const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.BufferAttribute(b64(hp.v,Float32Array),3));hg.setAttribute('normal',new THREE.BufferAttribute(b64(hp.n,Float32Array),3));hg.setAttribute('uv',new THREE.BufferAttribute(b64(hp.u,Float32Array),2));hg.setIndex(new THREE.BufferAttribute(b64(hp.f,Uint32Array),1));
const hm=new THREE.MeshStandardMaterial({map:T[k+HS[pi]],roughness:.85});if(pi==1){hg.setAttribute('color',new THREE.BufferAttribute(b64(hp.a,Float32Array),4));hm.vertexColors=true;hm.transparent=true;hm.depthWrite=false;hm.polygonOffset=true;hm.polygonOffsetFactor=-2;hm.polygonOffsetUnits=-2}hm.onBeforeCompile=s=>{Object.assign(s.uniforms,U,{uPN:{value:(1475-285)*D.K},uYH:{value:q[0]},uK:{value:D.K}});
s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
uniform float uHY,uHP,uPN,uYH,uK;
vec3 HR(vec3 p,float o){float hw=clamp((uYH+28.-(1475.-position.y/uK))/44.,0.,1.);if(hw>0.){vec3 c=vec3(0.,uPN*o,0.);vec3 d=p-c;float a=uHY*hw,b=uHP*hw;d=vec3(d.x*cos(a)+d.z*sin(a),d.y,-d.x*sin(a)+d.z*cos(a));d=vec3(d.x,d.y*cos(b)-d.z*sin(b),d.y*sin(b)+d.z*cos(b));p=c+d;}return p;}`).replace('#include <beginnormal_vertex>','vec3 objectNormal=HR(normal,0.);').replace('#include <begin_vertex>','vec3 transformed=HR(position,1.);')};
const hmesh=new THREE.Mesh(hg,hm);if(pi==1)hmesh.renderOrder=2;g.add(hmesh)});
g.add(new THREE.Mesh(geo,m));const sh=new THREE.Mesh(new THREE.CircleGeometry(.38,20),new THREE.MeshBasicMaterial({map:SHT(),transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.012;g.add(sh);g.U=U;g.k=k;g.t=0;g.hy=0;g.hp=0;HUM.push(g);scene.add(g);return g}
let _sht;const SHT=()=>{if(_sht)return _sht;const c=cvs(64,64),x=c.getContext('2d'),gr=x.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return _sht=new THREE.CanvasTexture(c)};
const swing=(c,a)=>{c.U.uA.value=a?1:0;c.U.uP.value=c.t};
const OB=[],DOORS=[],TICK=[],VEHICLE_BLOCKERS=[];let PY=0;
let BL=0;const blk=(a,b,c,d)=>OB.push([a,b,c,d,BL]),vblk=(a,b,c,d)=>VEHICLE_BLOCKERS.push([a,b,c,d]);
const gY=(x,z)=>x>5.6&&x<7.4&&z>11.9&&z<15.45?-Math.min(2.8,Math.max(0,(z-12)/3.2*2.8)):(x>3&&x<10&&z>=15.45&&z<21?-2.8:0);
const rn=(a,b)=>a+Math.random()*(b-a),PTC={};
function pt(k,w,h,fn){return PTC[k]||(PTC[k]=(()=>{const c=cvs(w,h),x=c.getContext('2d');fn(x,w,h);const t=ctex(c,1,1);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})())}
const spk=(x,w,h,n,a,col)=>{for(let i=0;i<n;i++){x.fillStyle=col||`rgba(${rn(40,170)|0},${rn(40,170)|0},${rn(40,170)|0},${a})`;x.fillRect(rn(0,w),rn(0,h),rn(1,3),rn(1,3))}};
const TXF={conc:(x,w,h)=>{x.fillStyle='#8a8c89';x.fillRect(0,0,w,h);spk(x,w,h,1500,.22)},
brick:(x,w,h)=>{x.fillStyle='#3d2f2b';x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=-1;c<4;c++){x.fillStyle=`hsl(${rn(8,18)},${rn(35,50)}%,${rn(26,38)}%)`;x.fillRect(c*32+(r%2)*16+1,r*16+1,30,14)}},
wood:(x,w,h)=>{for(let i=0;i<4;i++){x.fillStyle=`hsl(28,${rn(35,45)}%,${rn(36,48)}%)`;x.fillRect(0,i*32,w,31)}spk(x,w,h,500,0,'rgba(60,30,10,.3)')},
tile:(x,w,h)=>{x.fillStyle='#8f9a9c';x.fillRect(0,0,w,h);for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=`hsl(190,${rn(5,12)}%,${rn(84,92)}%)`;x.fillRect(i*32+1,j*32+1,30,30)}},
paint:(x,w,h)=>{x.fillStyle='#d9d6cc';x.fillRect(0,0,w,h);spk(x,w,h,600,.06)},
metal:(x,w,h)=>{x.fillStyle='#6c7479';x.fillRect(0,0,w,h);for(let i=0;i<h;i+=2){x.fillStyle=`rgba(255,255,255,${rn(0,.08)})`;x.fillRect(0,i,w,1)}spk(x,w,h,200,0,'rgba(120,70,30,.35)')},
card:(x,w,h)=>{x.fillStyle='#a8814f';x.fillRect(0,0,w,h);spk(x,w,h,500,0,'rgba(90,60,30,.25)');x.fillStyle='rgba(200,170,110,.7)';x.fillRect(0,h/2-4,w,8)}};
const TIL={conc:3,paint:3,brick:1.6,wood:2,tile:0.81,metal:1.6,card:1.4,asphalt:4,sidewalk:3,grass:5},RO={conc:.95,paint:.9,brick:.9,wood:.55,tile:.3,metal:.45,asphalt:.98,sidewalk:.9,grass:1};
const GL=`float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1.,0.)),f.x),mix(hh(i+vec2(0.,1.)),hh(i+vec2(1.,1.)),f.x),f.y);}`;
function brk(m,mx){m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n'+GL).replace('#include <map_fragment>',`vec4 texelColor=texture2D(map,vUv);
${mx?'texelColor=mix(texelColor,texture2D(map,mat2(.8,.6,-.6,.8)*vUv*.57+vec2(.31,.57)),smoothstep(.3,.7,vn(vUv*.4))*.7);':''}
texelColor=mapTexelToLinear(texelColor);texelColor.rgb*=.72+.55*(vn(vUv*.23)*.6+vn(vUv*.071+9.)*.4);diffuseColor*=texelColor;`)}}
const MT=(k,o)=>{const has=!!T['e_'+k],m=M(Object.assign({map:has?T['e_'+k]:pt(k,128,128,TXF[k]),roughness:RO[k]||.85},o||{}));if(has)brk(m,k=='conc'||k=='paint'||k=='metal');m.userData.tile=(k=='card')?0:(TIL[k]||0);return m};
function stileMat(){const t=(T.e_shopfloor||T.e_stile).clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3.5,2);t.anisotropy=8;t.needsUpdate=true;return M({map:t,color:0xffffff,roughness:.34})}
function wb(x0,z0,x1,z1,ya,yb,key,col){const w=x1-x0,d=z1-z0,h=yb-ya,g=new THREE.BoxGeometry(w,h,d);
if(typeof key=='string'){const uv=g.attributes.uv,S=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let i=0;i<24;i++){const s=S[i>>2];uv.setXY(i,uv.getX(i)*s[0]/(TIL[key]||1.4),uv.getY(i)*s[1]/(TIL[key]||1.4))}}
const m=new THREE.Mesh(g,typeof key=='string'?MT(key):key);m.position.set((x0+x1)/2,(ya+yb)/2,(z0+z1)/2);scene.add(m);if(col)blk(x0,x1,z0,z1);return m}
function wall(ax,c,a0,a1,gaps,key,h,y0){y0=y0||0;h=h||2.9;const T=.12;let cur=a0;
const seg=(s,e,ya,yb,col)=>{if(e-s<.02)return;ax=='x'?wb(s,c-T/2,e,c+T/2,y0+ya,y0+yb,key,col):wb(c-T/2,s,c+T/2,e,y0+ya,y0+yb,key,col)};
for(const g of gaps.slice().sort((p,q)=>p[0]-q[0])){seg(cur,g[0],0,h,1);seg(g[0],g[1],2.1,h,0);cur=g[1]}seg(cur,a1,0,h,1)}
function mkDoor(cx,cz,aZ,key,s,y){const g=new THREE.Group();g.position.set(aZ?cx:cx-.5,y||0,aZ?cz-.5:cz);scene.add(g);
const m=new THREE.Mesh(new THREE.BoxGeometry(aZ?.05:1,2.04,aZ?1:.05),MT(key));m.position.set(aZ?0:.5,1.02,aZ?.5:0);g.add(m);DOORS.push({g,x:cx,z:cz,s,a:0})}
function crate(x,y,z,w,h,d,ry){const m=bx(w,h,d,MT('card'),x,y+h/2,z);m.rotation.y=ry||0;const uv=m.geometry.attributes.uv,s=rn(.45,.8),ou=rn(0,1-s),ov=rn(0,1-s);for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*s+ou,uv.getY(i)*s+ov);return m}
function bagG(){const g=new THREE.SphereGeometry(.3,12,8),uv=g.attributes.uv,ou=rn(0,.6),ov=rn(0,.6);for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.4+ou,uv.getY(i)*.4+ov);return g}
function rack(x,z,len,aX,yo){yo=yo||0;const mt=MT('metal');for(let i=0;i<3;i++){const y=yo+.35+i*.65;aX?bx(len,.04,.5,mt,x,y,z):bx(.5,.04,len,mt,x,y,z);
let p=-len/2+.2;while(p<len/2-.25){const w=rn(.3,.5);crate(aX?x+p:x,y+.02,aX?z:z+p,aX?w:.4,rn(.25,.45),aX?.4:w);p+=w+.08}}
[-1,1].forEach(s=>[-1,1].forEach(t=>aX?bx(.04,1.9,.04,mt,x+s*len/2,yo+.95,z+t*.24):bx(.04,1.9,.04,mt,x+t*.24,yo+.95,z+s*len/2)))}
const LIGHTS=[],SGN=[];const lamp2=(x,y,z,c,i,d)=>{const l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);l.userData.base=i;LIGHTS.push(l);scene.add(l);return l};
const bulb=(x,y,z,c)=>add(new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),new THREE.MeshBasicMaterial({color:c})),x,y,z);
function sign(t,x,y,z,ry,w,h,bg,fg){const c=cvs(512,Math.max(128,Math.round(512*h/w))),g=c.getContext('2d'),W=c.width,H=c.height;g.fillStyle=bg;g.fillRect(0,0,W,H);g.fillStyle='rgba(0,0,0,.16)';g.fillRect(0,H*.72,W,H*.28);g.fillStyle='#ffd36c';g.fillRect(0,0,8,H);g.strokeStyle='rgba(255,255,255,.62)';g.lineWidth=5;g.strokeRect(14,10,W-28,H-20);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=8;const chars=Math.max(1,[...t].length);g.font=`bold ${Math.min(H*.62,(W-44)/chars*.92)}px sans-serif`;g.fillText(t,W/2,H*.51,W-48);g.shadowBlur=0;const mt=new THREE.MeshBasicMaterial({map:ctex(c,1,1),side:THREE.DoubleSide,toneMapped:false});if(!/出口|EXIT|后门/.test(t))SGN.push(mt);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mt);m.position.set(x,y,z);m.rotation.y=ry;scene.add(m)}
function fence(x0,z0,x1,z1){const L=Math.hypot(x1-x0,z1-z0),t=T.e_fence.clone();t.needsUpdate=true;t.repeat.set(L/.9,2.2/.9);
const m=new THREE.Mesh(new THREE.PlaneGeometry(L,2.2),new THREE.MeshStandardMaterial({map:t,alphaTest:.45,side:THREE.DoubleSide,roughness:.5,metalness:.3}));
m.position.set((x0+x1)/2,1.1,(z0+z1)/2);m.rotation.y=x0==x1?Math.PI/2:0;scene.add(m);const n=Math.round(L/2);for(let i=0;i<=n;i++)bx(.06,2.3,.06,MT('metal',{color:0x6a7075}),x0+(x1-x0)*i/n,1.15,z0+(z1-z0)*i/n);blk(Math.min(x0,x1)-.05,Math.max(x0,x1)+.05,Math.min(z0,z1)-.05,Math.max(z0,z1)+.05)}
function buildBOH(){

const PA='paint',fl=(a,b,c,d,k)=>wb(a,b,c,d,-.06,0,k,0),ce=(a,b,c,d)=>wb(a,b,c,d,2.9,3,PA,0);
fl(2.4,3,4,11,'conc');fl(-3,3,2.4,7,'conc');fl(-3,7,2.4,11,'wood');fl(4,5,6.4,8.2,'tile');ce(2.4,3,4,11);ce(-3,3,2.4,11);ce(4,5,6.4,8.2);
wall('z',-3,3,11,[],PA);wall('z',2.4,3,11,[[4,5],[8.5,9.5]],PA);wall('z',4,3,11,[[6,7]],PA);wall('x',7,-3,2.4,[],PA);wall('x',11,-3,4,[[2.7,3.7]],'brick');wall('x',11,4,6.4,[],'brick');wall('z',6.4,8.2,11,[],'brick');
wall('x',5,4,6.4,[],'tile');wall('x',8.2,4,6.4,[],'tile');wall('z',6.4,5,8.2,[],'tile');
mkDoor(2.4,4.5,1,'wood',-1);mkDoor(2.4,9,1,'wood',-1);mkDoor(4,6.5,1,'wood',1);mkDoor(3.2,11,0,'metal',-1);mkDoor(3.2,3,0,'metal',-1);
lamp2(3,2.6,5.5,0xf0f4ff,.7,11);lamp2(0,2.6,9,0xffe2b0,.8,8);[[3.2,2.8,4],[3.2,2.8,9],[-.3,2.8,5],[5.2,2.8,6.6],[0,2.8,9]].forEach(p=>bulb(p[0],p[1],p[2],0xfff4d0));
sign('仅限员工',3.2,2.3,2.93,Math.PI,.8,.22,'#a11','#fff');sign('后门',3.2,2.4,10.93,Math.PI,.6,.2,'#0a5','#fff');sign('WC',3.93,1.7,6.5,-Math.PI/2,.3,.3,'#246','#fff');
rack(-2.7,4.9,3.4,0);rack(-.3,6.65,3.6,1);bx(1.1,.12,1.1,MT('wood'),-.2,.06,4.6);crate(-.2,.12,4.6,.9,.5,.9);crate(-.2,.62,4.6,.7,.4,.7);
add(new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.45,10),MT('metal',{color:0xb02020})),2.2,.25,6.7);add(new THREE.Mesh(new THREE.CylinderGeometry(.2,.17,.4,12),solid(0xe0c020)),1.9,.2,3.5);
const wd=MT('wood'),ch=solid(0x4a5a6a,'fab');bx(1.5,.05,.85,wd,-.3,.76,9.4);[[-.95,-.35],[.35,-.35],[-.95,.35],[.35,.35]].forEach(p=>bx(.05,.74,.05,wd,-.3+p[0]*.75,.37,9.4+p[1]));
[[-.9,8.7],[.3,8.7],[-.9,10.1],[.3,10.1]].forEach(p=>{bx(.4,.45,.4,ch,p[0],.22,p[1]);bx(.4,.4,.05,ch,p[0],.65,p[1]+(p[1]<9?-.18:.18))});
const lk=MT('metal',{color:0x5f8db5});for(let i=0;i<5;i++)bx(.45,1.8,.42,lk,-2.72,.9,7.4+i*.45);
bx(1.9,.45,.8,solid(0x7a5048,'fab'),-1.2,.22,10.45);bx(1.9,.5,.18,solid(0x7a5048,'fab'),-1.2,.6,10.82);bx(.6,.9,.6,solid(0xe8ecee),1.95,.45,7.45);bx(.45,.28,.35,solid(0x2a2d30),1.95,1.04,7.45);
sign('02:47',2.33,2.1,10,-Math.PI/2,.5,.5,'#111','#f33');sign('排班表',-2.93,1.6,10,Math.PI/2,.9,.6,'#caa86a','#222');
const pw=solid(0xf3f5f5,'cer');bx(.65,.4,.4,pw,6.05,.2,6);bx(.2,.5,.4,pw,6.3,.55,6);bx(.55,.12,.4,pw,5,.85,8);bx(.2,.8,.2,pw,5,.4,8.05);sign('',5,1.55,8.13,Math.PI,.6,.8,'#aab9c0','#fff');
[[-4,11,5.5,22],[7.5,11,12,22],[5.5,11,7.5,12],[5.5,15.5,7.5,22]].forEach(a=>wb(a[0],a[1],a[2],a[3],-.25,0,'conc',0));
BL=2;wb(5.4,12,5.6,15.5,-2.8,0,'conc',1);wb(7.4,12,7.6,15.5,-2.8,0,'conc',1);BL=1;for(let i=0;i<8;i++)wb(5.6,12+i*.4,7.4,12.4+i*.4,-2.8,-.35*(i+1),'conc',0);
wb(3,15.5,10,21,-2.86,-2.8,'conc',0);wall('z',3,15.5,21,[],'conc',2.55,-2.8);wall('z',10,15.5,21,[],'conc',2.55,-2.8);wall('x',21,3,10,[],'conc',2.55,-2.8);wall('x',15.5,3,10,[[6,7]],'conc',2.55,-2.8);mkDoor(6.5,15.5,0,'metal',-1,-2.8);
const mm=MT('metal',{color:0x6f7a74});add(new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.7,16),mm),8.6,-1.95,19.8);
[[6.5,-.8,17,7,'z'],[8.6,-1.7,19.8,2.2,'y']].forEach(p=>{const m=add(new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,p[3],8),mm),p[0],p[1],p[2]);if(p[4]=='z')m.rotation.z=Math.PI/2});
rack(3.6,18.5,3.5,0,-2.8);rack(6.5,20.6,5,1,-2.8);crate(9.2,-2.8,16.5,.8,.6,.8);crate(9.2,-2.2,16.5,.6,.5,.6);crate(9.3,-2.8,17.6,.7,.5,.7,.4);blk(8.8,9.7,16.1,17);blk(8,9.2,19.2,20.4);
const bl=lamp2(6.5,-.9,18,0xffd9a0,1,9);bulb(6.5,-.9,18,0xffe0b0);TICK.push(()=>{bl.intensity=POW?(Math.random()<.04?.15:1):0});
BL=0;wb(12,11,12.3,22,0,5,'brick',1);fence(-4,22,12,22);fence(-4,11,-4,22);
const bg=M({map:T.e_bag,roughness:.3});for(let i=0;i<14;i++){const g=new THREE.Mesh(bagG(),bg);g.scale.set(1,.75,1);g.position.set(rn(-.1,1.7),.22+Math.floor(i/6)*.3,rn(12.2,13.5));g.rotation.y=rn(0,3);scene.add(g)}
crate(1.9,0,12.6,.7,.5,.6,.3);crate(.2,0,13.9,.6,.4,.6,-.2);for(let i=0;i<6;i++){const c=add(new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.12,8),solid([0xcc3333,0x3366cc,0xcccc44][i%3])),rn(-.6,2.4),.06,rn(12,14.2));c.rotation.z=rn(0,3)}blk(-.4,2.2,12.1,13.9);
bx(1.9,1.1,1,MT('metal',{color:0x3f8a5f}),-2.2,.55,19.6);dumpLid=bx(1.95,.08,1.05,MT('metal',{color:0x2a5a3e}),-2.2,1.14,19.6);blk(-3.2,-1.2,19,20.2);
const pd=add(new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.1),(()=>{const m=MTX('cer',0x1a2733);m.roughness=.05;m.metalness=.6;return m})()),4.5,.02,14.5);pd.rotation.x=-Math.PI/2;
bulb(3.2,2.7,11.25,0xffc880);lamp2(3.2,2.7,11.7,0xffb870,1.4,14);
TICK.push(()=>{HL.intensity=(pz>11.2||(pz>3&&px<-3.2)?.3:.75)*Math.max(.15,1+PY/3.3)*(POW?1:.22)});buildWorld();buildProps()}

const HUM=[];let DT=.016,dumpLid,boxC,zoneM,bagM,lockM,boxPut,bagTop,carry=null,tR=null;
const tdone=i=>{tasks[i].d=1;tk();if(tasks.every(a=>a.d)&&tR){const r=tR;tR=null;r()}};
const hold=t=>{$('hold').textContent=t?'手里：'+t:'';$('hold').style.opacity=t?1:0};
const setClock=t=>$('clk').textContent=t;
const AOT=(()=>{let t;return()=>t||(t=(()=>{const c=cvs(64,64),g=c.getContext('2d');g.filter='blur(6px)';g.fillStyle='#000';g.fillRect(14,14,36,36);return ctex(c,1,1)})())})();
const ao=(cx,cz,w,d,y)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w+.7,d+.7),new THREE.MeshBasicMaterial({map:AOT(),transparent:true,opacity:.6,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(cx,(y||0)+.012,cz);scene.add(m)};
function buildProps(){
[[-8.6,-.15,.9,4.1],[-7,-.15,.9,4.1],[-5.4,-.15,.9,4.1],[-3.8,-.15,.9,4.1],[-2.2,-.15,.9,4.1],[-.2,0,.9,3],[2.2,-2.6,.6,3.2],[3.65,.7,.6,2.6],[-9.7,-.6,.8,6],[-3.5,2.7,12,.8],[-2.2,19.6,1.9,1],[.8,12.9,2,1.6]].forEach(a=>ao(a[0],a[1],a[2],a[3]));ao(8.6,19.8,1.2,1.2,-2.8);ao(-.2,4.6,1.1,1.1);
bx(1.4,.02,.9,solid(0x34383b,'rub'),-2.4,.012,-4.3);
sign('新品上市',-8.6,1.7,-4.93,0,.9,1.2,'#d84a2e','#fff');sign('夜间限定',-7.2,1.6,-4.93,0,.7,.9,'#2b5fa8','#fff');sign('热食',1.0,1.7,-4.93,0,.8,.8,'#c8441a','#fff');
[[-9.4,-4.5],[3.4,2.5]].forEach(p=>{const dm=add(new THREE.Mesh(new THREE.SphereGeometry(.14,10,6,0,Math.PI*2,0,Math.PI/2),solid(0x1a1c1e)),p[0],2.9,p[1]);dm.rotation.x=Math.PI;const led=bulb(p[0]+.08,2.83,p[1]+.07,0xff2a1a);TICK.push(()=>{led.visible=Math.floor(performance.now()/700)%2==0})});
sign('02:47',3.2,2.62,2.93,Math.PI,.4,.4,'#f2f2f2','#111');
bx(.45,.32,.38,MT('metal',{color:0xffd9a0,emissive:0xff8a1a,emissiveIntensity:.35}),2.2,1.15,-1.5);bx(.28,.5,.3,solid(0x22262a),2.2,1.22,-4);
const yl=bx(.3,.6,.02,solid(0xe8c820),-1.6,.3,-3.6);yl.rotation.z=.1;add(new THREE.Mesh(new THREE.CylinderGeometry(.22,.19,.7,12),solid(0x30363a)),1.3,.35,-4.4);
const fb=bx(.14,.6,.42,MT('metal',{color:0x6d7479}),3.92,1.5,4.3);fuseBox=fb;sign('配电箱',3.84,1.5,4.3,-Math.PI/2,.34,.3,'#b11','#fff');mkIt(fb,'配电箱',()=>{});const mkP=(type,cat,x,z,wd)=>{const m=new THREE.Mesh(GEO.get(type),M({map:labelTex(type,cat,0,wd),roughness:.5}));m.position.set(x,.5,z);m.rotation.y=Math.PI;scene.add(m);return m};PKI=[mkP('box','home',-3.8,-2.78,'蜡烛'),mkP('bottle','drink',-5.4,-2.78,'矿泉水'),mkP('box','stat',-.2,-2.08,'打火机')];buildStory();
const bagM2=M({map:T.e_bag,roughness:.3});
boxC=crate(-1.4,0,5.4,.55,.42,.5,.2);mkIt(boxC,'搬起货箱',()=>{boxC.visible=false;boxC.userData.it.on=false;carry='box';hold('货箱');tdone(0);scareArmed=true;zoneM.userData.it.on=true;setObj('把货箱放到店门口旁边的黄色补货区')});
boxPut=crate(-.6,0,-3.4,.55,.42,.5,.1);boxPut.visible=false;
zoneM=new THREE.Mesh(new THREE.PlaneGeometry(1,.8),new THREE.MeshBasicMaterial({map:tapeTex(),transparent:true,opacity:.6,depthWrite:false}));zoneM.rotation.x=-Math.PI/2;zoneM.position.set(-.6,.02,-3.4);scene.add(zoneM);
mkIt(zoneM,'放下货箱',()=>{zoneM.userData.it.on=false;carry=null;hold('');boxPut.visible=true;tdone(1);bagM.userData.it.on=true;setObj('把休息室的垃圾袋拿去后巷（走廊尽头的后门）')});
bagM=new THREE.Mesh(bagG(),bagM2);bagM.scale.set(1.2,1,1.2);bagM.position.set(1.7,.28,10.4);scene.add(bagM);
mkIt(bagM,'拿起垃圾袋',()=>{bagM.visible=false;bagM.userData.it.on=false;carry='bag';hold('垃圾袋');bagScareArmed=true;dumpLid.userData.it.on=true;setObj('扔进后巷的绿色垃圾箱')});
bagTop=new THREE.Mesh(bagG(),bagM2);bagTop.position.set(-2.2,1.32,19.6);bagTop.visible=false;scene.add(bagTop);
mkIt(dumpLid,'扔进垃圾箱',()=>{dumpLid.userData.it.on=false;carry=null;hold('');bagTop.visible=true;beep(220,.2);tdone(2);setTimeout(()=>{knock();toast('地下室的方向，传来了几声闷响。')},900);lockM.userData.it.on=true;setObj('回去，锁好后门')});
lockM=bx(.1,.2,.05,solid(0x333b40),3.85,1.2,10.92);mkIt(lockM,'锁上后门',()=>{lockM.userData.it.on=false;beep(900,.08);setTimeout(()=>beep(600,.12),120);tdone(3)});
TICK.push(()=>{const cm=cmode=='cine',tx=cm?cp.x:px,ty=cm?cp.y:1.6+PY,tz=cm?cp.z:pz;for(const h of HUM){if(!h.visible)continue;const dx=tx-h.position.x,dz=tz-h.position.z,dist=Math.hypot(dx,dz),ry=h.rotation.y;
let a=Math.atan2(dx*Math.cos(ry)-dz*Math.sin(ry),dx*Math.sin(ry)+dz*Math.cos(ry));if(Math.abs(a)>2.3)a=0;a=Math.max(-1.1,Math.min(1.1,a));
const want=dist<9&&ST.look?1:0,mv=movers.some(m=>m.ch===h)?.45:1,p2=Math.max(-.35,Math.min(.35,-Math.atan2(ty-1.5,Math.max(dist,.5))));
h.hy+=(a*want*mv-h.hy)*Math.min(1,DT*6);h.hp+=(p2*want*mv-h.hp)*Math.min(1,DT*6);h.U.uHY.value=h.hy;h.U.uHP.value=h.hp}})}
async function chap2(){setClock('03:20');tasks=['去储藏室搬一箱货','把货箱放到补货区','把休息室的垃圾扔进后巷垃圾箱','回去锁好后门'].map(t=>({t,d:0}));tk();
const P=new Promise(r=>tR=r);boxC.userData.it.on=true;setObj('去储藏室搬一箱货（店里后墙右边的员工门）');await P;
setObj('');hold('');await chap3()}
function explore(){$('ov').style.display='none';setCam([3.2,1.6,-2.6],[0,1.6,-2.6]);toPlay(Math.PI/2,0);$('fd').style.transition='opacity 800ms';$('fd').style.opacity=0;setObj('自由探索')}
let NB,AMB={},WB=0,WS=0,lpx=0,lpz=0,lastStep=0,ac=0;
function startAmb(){if(!AC)return;const n=AC.sampleRate*2,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;NB=b;
const mO=(t,f)=>{const o=AC.createOscillator();o.type=t;o.frequency.value=f;const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=300;const g=AC.createGain();g.gain.value=0;o.connect(fl);fl.connect(g);g.connect(AC.destination);o.start();return g};
const s=AC.createBufferSource();s.buffer=NB;s.loop=true;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=500;f.Q.value=.6;const g=AC.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(AC.destination);s.start();
AMB.hum=mO('sawtooth',60);AMB.fr=mO('sine',50);AMB.rum=mO('sine',38);AMB.wind=g;lpx=px;lpz=pz}
const zone=()=>PY<-1?'b':(pz>11.2?'a':(pz>3.05&&!(px>1.8&&pz<3.2)?'h':'s'));
function step(){if(!AC||!NB)return;const z=zone(),s=AC.createBufferSource();s.buffer=NB;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=(px>-3&&px<2.4&&pz>7&&pz<11)?650:z=='s'?1500:1000;const g=AC.createGain();g.gain.setValueAtTime(.17,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.09);s.connect(f);f.connect(g);g.connect(AC.destination);s.start(0,Math.random()*1.5,.1)}
TICK.push(()=>{const sp=Math.hypot(px-lpx,pz-lpz)/Math.max(DT,.001);lpx=px;lpz=pz;const mv=cmode=='play'&&sp>.4&&sp<4?1:0;WS+=(mv-WS)*Math.min(1,DT*8);WB+=sp*DT*5*mv;const k=Math.floor(WB/Math.PI);if(mv&&k!==lastStep){lastStep=k;step()}
if(AMB.hum&&++ac%8==0){const z=zone(),t=AC.currentTime,S=(g,v)=>g.gain.setTargetAtTime(v,t,.4);S(AMB.hum,z=='s'?.012:z=='h'?.008:0);S(AMB.fr,z=='s'?.028:z=='h'?.012:0);S(AMB.wind,z=='a'?.035:z=='b'?.006:0);S(AMB.rum,z=='b'?.07:0);if(z=='b'&&Math.random()<.05)beep(1800+Math.random()*600,.06,.04)}});

const ST=Object.assign({grain:1,vig:1,bob:1,look:1,snd:1,hq:1},(()=>{try{return JSON.parse(localStorage.getItem('nt6')||'{}')}catch(e){return{}}})());
const SD=[['grain','胶片颗粒',['关','细','中','强']],['vig','暗角',['关','开']],['bob','走路晃动',['关','开']],['look','NPC 注视',['关','开']],['snd','声音',['关','开']],['hq','画质',['省电','标准','高']]];
(()=>{const gn=cvs(256,256),g2=gn.getContext('2d'),id=g2.createImageData(256,256);for(let i=0;i<id.data.length;i+=4){const v=Math.random()*255|0;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}g2.putImageData(id,0,0);$('gr').style.backgroundImage='url('+gn.toDataURL()+')'})();
function applySet(){$('gr').style.opacity=[0,.07,.12,.2][ST.grain];$('vg').style.display=ST.vig?'block':'none';if(AC){ST.snd?AC.resume():AC.suspend()}R.setPixelRatio([1,Math.min(devicePixelRatio,1.5),Math.min(devicePixelRatio,2)][ST.hq]);size();try{localStorage.setItem('nt6',JSON.stringify(ST))}catch(e){}}
const sp=$('set');function renderSet(){sp.innerHTML=SD.map(d=>`<div class="r"><span>${d[1]}</span><button data-k="${d[0]}">${d[2][ST[d[0]]]}</button></div>`).join('');sp.querySelectorAll('button').forEach(b=>b.onclick=()=>{const d=SD.find(x=>x[0]==b.dataset.k);ST[d[0]]=(ST[d[0]]+1)%d[2].length;applySet();renderSet()})}
$('gear').onclick=()=>{sp.style.display=sp.style.display=='block'?'none':'block';renderSet()};

function uvT(g,w,h,d,mt){const uv=g.attributes.uv,S=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++){const m=Array.isArray(mt)?mt[f]:mt,t=m&&m.userData&&m.userData.tile;if(!t)continue;for(let i=f*4;i<f*4+4;i++)uv.setXY(i,uv.getX(i)*S[f][0]/t,uv.getY(i)*S[f][1]/t)}}
const MTXC={};
function mtx(k){if(MTXC[k])return MTXC[k];const c=cvs(256,256),x=c.getContext('2d');x.fillStyle='#d4d4d4';x.fillRect(0,0,256,256);
const N=(n,a,s)=>{for(let i=0;i<n;i++){const v=rn(-a,a)|0;x.fillStyle=v>0?`rgba(255,255,255,${v/255})`:`rgba(0,0,0,${-v/255})`;x.fillRect(rn(0,256),rn(0,256),s,s)}};
if(k=='pla'){N(5000,26,1);N(200,40,2);x.strokeStyle='rgba(0,0,0,.14)';for(let i=0;i<14;i++){x.beginPath();const sx=rn(0,256),sy=rn(0,256);x.moveTo(sx,sy);x.lineTo(sx+rn(-40,40),sy+rn(-40,40));x.stroke()}}
else if(k=='fab'){for(let i=0;i<256;i+=2){x.fillStyle=`rgba(0,0,0,${.1+Math.random()*.1})`;x.fillRect(i,0,1,256);x.fillRect(0,i,256,1)}N(4000,30,1)}
else if(k=='cer'){x.fillStyle='#ececec';x.fillRect(0,0,256,256);N(2500,10,1);x.strokeStyle='rgba(0,0,0,.1)';for(let i=0;i<4;i++){x.beginPath();let sx=rn(0,256),sy=rn(0,256);x.moveTo(sx,sy);for(let j=0;j<5;j++){sx+=rn(-20,20);sy+=rn(0,20);x.lineTo(sx,sy)}x.stroke()}}
else if(k=='rub'){x.fillStyle='#8a8a8a';x.fillRect(0,0,256,256);N(9000,50,1)}
else{N(6000,18,1);x.fillStyle='rgba(0,0,0,.07)';for(let i=0;i<30;i++)x.fillRect(rn(0,256),rn(0,256),rn(10,40),1)}
const t=ctex(c,1,1);t.wrapS=t.wrapT=THREE.RepeatWrapping;return MTXC[k]=t}
const TLX={pla:.5,fab:.35,cer:.6,rub:.5,lam:.8},RX={pla:.55,fab:.95,cer:.18,rub:.95,lam:.4};
const MTX=(k,c)=>{const m=M({map:mtx(k),color:c,roughness:RX[k]});m.userData.tile=TLX[k];return m};
function plane(w,d,k,c){const g=new THREE.PlaneGeometry(w,d),uv=g.attributes.uv,t=TIL[k]||3;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/t,uv.getY(i)*d/t);const m=new THREE.Mesh(g,MT(k,{color:c}));m.rotation.x=-Math.PI/2;return m}
const dirtT=(()=>{const c=cvs(256,256),x=c.getContext('2d');x.fillStyle='rgba(255,255,255,.88)';x.fillRect(0,0,256,256);for(let i=0;i<60;i++){x.fillStyle='rgba(255,255,255,1)';x.fillRect(rn(0,256),rn(0,256),rn(4,18),rn(1,3))}for(let i=0;i<30;i++){x.fillStyle='rgba(255,255,255,.95)';x.fillRect(rn(0,256),0,rn(1,5),256)}return ctex(c,1,1)})();
const GL2=(op,c)=>M({map:dirtT,color:c||0xaed2de,transparent:true,opacity:op,roughness:.05});
const hx=c=>'#'+c.toString(16).padStart(6,'0');
function pack(col,t){const c=cvs(64,96),x=c.getContext('2d');x.fillStyle=hx(col);x.fillRect(0,0,64,96);x.fillStyle='rgba(255,255,255,.88)';x.fillRect(0,34,64,34);x.fillStyle='#222';x.font='bold 18px sans-serif';x.textAlign='center';x.fillText(t,32,58);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,0,64,6);x.fillRect(0,90,64,6);return ctex(c,1,1)}
function bottleTex(col){const c=cvs(128,64),x=c.getContext('2d');x.fillStyle=hx(col);x.fillRect(0,0,128,64);x.fillStyle='rgba(255,255,255,.9)';x.fillRect(0,20,128,26);x.fillStyle='#222';x.font='bold 14px sans-serif';x.textAlign='center';x.fillText('冰茶',64,39);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(8,0,6,64);return ctex(c,1,1)}
function scrTex(){const c=cvs(128,80),x=c.getContext('2d');x.fillStyle='#07261a';x.fillRect(0,0,128,80);x.fillStyle='#4cff9a';x.font='bold 22px monospace';x.fillText('¥ 32.00',14,38);x.font='11px monospace';x.fillText('TOTAL  3 ITEMS',14,60);return ctex(c,1,1)}
function tapeTex(){const c=cvs(64,64),x=c.getContext('2d');x.fillStyle='#e8c820';x.fillRect(0,0,64,64);x.fillStyle='#222';for(let i=-64;i<128;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+8,0);x.lineTo(i+72,64);x.lineTo(i+64,64);x.fill()}const t=ctex(c,1,1);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,2);return t}
function winTex(){const c=cvs(64,128),x=c.getContext('2d');x.fillStyle='#0f1319';x.fillRect(0,0,64,128);for(let i=0;i<40;i++){x.fillStyle=Math.random()<.35?'#e8c36a':'#1c2430';x.fillRect(4+(i%5)*12,4+((i/5)|0)*15,8,10)}const t=ctex(c,1,1);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function bldg(x,z,w,h,d){const t=winTex();t.repeat.set(w/8,h/10);const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,h/2,z);scene.add(m)}
function skyTex(){const c=cvs(512,256),x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#04060c');g.addColorStop(.6,'#0b1322');g.addColorStop(1,'#1d2c44');x.fillStyle=g;x.fillRect(0,0,512,256);for(let i=0;i<260;i++){x.fillStyle=`rgba(255,255,255,${rn(.3,1)})`;x.fillRect(rn(0,512),rn(0,150),rn(1,2),rn(1,2))}const mg=x.createRadialGradient(400,60,2,400,60,40);mg.addColorStop(0,'rgba(255,250,230,1)');mg.addColorStop(.12,'rgba(255,248,220,.95)');mg.addColorStop(.14,'rgba(200,215,255,.25)');mg.addColorStop(1,'rgba(200,215,255,0)');x.fillStyle=mg;x.fillRect(340,0,120,120);return ctex(c,1,1)}
function buildWorld(){wb(-4,10.94,-3,11.06,0,4.5,'brick',1);wb(6.4,10.94,12,11.06,0,6,'brick',1);const st=T.e_sky||skyTex();st.wrapS=THREE.RepeatWrapping;st.wrapT=THREE.ClampToEdgeWrapping;st.needsUpdate=true;const sky=new THREE.Mesh(new THREE.SphereGeometry(120,48,24),new THREE.MeshBasicMaterial({map:st,side:THREE.BackSide,fog:false,depthWrite:false,toneMapped:false}));sky.position.set(4,0,6);sky.renderOrder=-1;scene.add(sky);buildOutside()}
const LV=[.2,.55,.9,1.25,1.6];
const IT_W={can:.074,bottle:.08,cup:.125,bag:.15,box:.108,jug:.13,roll:.24,cig:.062,carton:.08};
const CATS={chips:['bag'],biscuit:['box'],noodle:['cup','bag'],drink:['bottle'],can:['can'],home:['jug','roll'],wash:['bottle','jug'],candy:['box'],bread:['bag'],stat:['box'],liquor:['bottle','carton'],tissue:['roll','box'],cig:['cig'],milk:['carton','bottle']};
const TXT={chips:['乐脆','海盐','烧烤','番茄','原味'],biscuit:['夹心','奶酥','曲奇','威化','苏打'],noodle:['红烧牛肉','酸辣','海鲜','香菇鸡','酸菜'],drink:['冰红茶','柠檬茶','橙汁','矿泉水','绿茶'],can:['可乐','汽水','啤酒','咖啡','能量'],home:['洗衣液','洗洁精','垃圾袋','消毒','柔顺剂'],wash:['洗发水','沐浴露','牙膏','洗面奶','护手霜'],candy:['薄荷','口香糖','巧克力','软糖','果冻'],bread:['吐司','面包','蛋糕','饭团','奶油卷'],stat:['电池','笔记本','胶带','便利贴','圆珠笔'],liquor:['清酒','烧酒','果酒','啤酒','米酒'],tissue:['抽纸','卷纸','湿巾','纸巾','厨纸'],cig:['','',''],milk:['鲜奶','酸奶','豆奶','可可','果奶']};
const CZH={chips:'薯片',biscuit:'饼干',noodle:'方便面',drink:'饮料',can:'罐装',home:'日用品',wash:'洗护',candy:'糖果',bread:'面包',stat:'文具',liquor:'酒类',tissue:'纸品',cig:'烟',milk:'乳品'};
const HR={chips:[15,50],biscuit:[190,340],noodle:[0,45],drink:[80,210],can:[0,360],home:[165,250],wash:[175,305],candy:[270,360],bread:[25,50],stat:[195,265],liquor:[335,45],tissue:[185,230],cig:[0,12],milk:[195,215]};
const pk=a=>a[Math.random()*a.length|0],ri=(a,b)=>a+(Math.random()*(b-a+1)|0);
function labelTex(type,cat,vi,wd){
const c=cvs(256,256),x=c.getContext('2d'),r=HR[cat]||[0,360],idx=((Number(vi)||0)%5+5)%5,span=(r[1]-r[0]+360)%360,h=(r[0]+span*idx/4)%360,names=TXT[cat]||['精选'],name=wd||names[idx%names.length]||CZH[cat]||'精选';
const hue=(v)=>`hsl(${(h+v+360)%360},76%,48%)`,text=(s,y,size,color)=>{x.fillStyle=color;x.font=`900 ${size}px sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(s,128,y,224)};
const bg=x.createLinearGradient(0,0,256,256);bg.addColorStop(0,hue(18));bg.addColorStop(.55,hue(0));bg.addColorStop(1,hue(-22));x.fillStyle=bg;x.fillRect(0,0,256,256);
x.fillStyle='rgba(255,255,255,.22)';x.fillRect(10,0,9,256);x.fillStyle='rgba(0,0,0,.16)';x.fillRect(0,238,256,18);
x.fillStyle='#f5f2e5';x.fillRect(18,16,220,28);x.fillStyle='#17443b';x.font='bold 17px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('便利精选',128,30);
const icon=(cy)=>{x.save();x.globalAlpha=.92;x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.arc(128,cy,43,0,Math.PI*2);x.fill();x.fillStyle=hue(34);if(['chips','biscuit','bread','candy'].includes(cat)){for(const [dx,dy,rr] of[[-12,-5,15],[13,-10,13],[2,13,16]]){x.beginPath();x.ellipse(128+dx,cy+dy,rr,rr*.68,dy*.01,0,Math.PI*2);x.fill()}}else if(['drink','milk','liquor','can'].includes(cat)){x.beginPath();x.arc(128,cy,24,0,Math.PI*2);x.fill();x.strokeStyle='rgba(255,255,255,.65)';x.lineWidth=4;for(let a=0;a<6;a++){x.beginPath();x.moveTo(128,cy);x.lineTo(128+24*Math.cos(a*Math.PI/3),cy+24*Math.sin(a*Math.PI/3));x.stroke()}}else if(['home','wash','tissue'].includes(cat)){x.beginPath();x.moveTo(128,cy-28);x.bezierCurveTo(101,cy+3,108,cy+28,128,cy+28);x.bezierCurveTo(151,cy+26,157,cy+1,128,cy-28);x.fill()}else{x.fillStyle=hue(34);x.fillRect(108,cy-24,40,48);x.fillStyle='rgba(255,255,255,.8)';x.fillRect(114,cy-15,28,5);x.fillRect(114,cy+10,28,5)}x.restore()};
if(type=='can'){const m=x.createLinearGradient(0,0,256,0);m.addColorStop(0,'#222b33');m.addColorStop(.18,hue(-10));m.addColorStop(.52,hue(8));m.addColorStop(.82,hue(-8));m.addColorStop(1,'#222b33');x.fillStyle=m;x.fillRect(0,0,256,256);x.fillStyle='#cbd1d3';x.fillRect(0,0,256,16);x.fillRect(0,240,256,16);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(22,20,7,216);icon(83);text(name,160,30,'#fff');text('350 mL',211,16,'#f5df9a')}
else if(type=='bottle'){x.fillStyle=hue(-5);x.fillRect(0,0,256,256);x.fillStyle='rgba(255,255,255,.23)';x.fillRect(34,0,12,256);x.fillStyle='rgba(0,0,0,.14)';x.fillRect(0,0,256,42);x.fillRect(0,214,256,42);x.fillStyle='#f5f1de';x.fillRect(0,70,256,100);x.fillStyle=hue(28);x.fillRect(0,70,12,100);x.fillRect(244,70,12,100);icon(91);text(name,157,27,hue(-20));text('500 mL',193,15,'#fff')}
else if(type=='cup'){x.fillStyle='#ece9dd';x.fillRect(0,0,256,256);x.fillStyle='#273039';x.fillRect(0,8,256,17);x.fillRect(0,231,256,17);x.fillStyle=hue(-4);x.fillRect(0,28,256,38);text('热腾腾',46,18,'#fff');icon(127);text(name,190,25,hue(-25));text('方便速食',218,14,'#343a3a')}
else if(type=='bag'){x.fillStyle='rgba(0,0,0,.14)';x.fillRect(0,0,256,10);x.fillRect(0,246,256,10);x.fillStyle='#f5f0df';x.fillRect(18,72,220,98);icon(112);text(name,174,27,'#fff');text('净含量 60 g',212,15,'#fff')}
else if(type=='box'||type=='carton'){x.fillStyle='#f5f1e6';x.fillRect(17,68,222,106);x.fillStyle=hue(30);x.fillRect(0,222,256,34);icon(112);text(name,171,27,hue(-26));text(type=='carton'?'鲜活冷藏':'严选好物',239,15,'#fff')}
else if(type=='jug'||type=='roll'){x.fillStyle='#eef1ed';x.fillRect(0,0,256,256);x.fillStyle=hue(-8);x.fillRect(0,0,256,49);x.fillRect(0,207,256,49);text(cat=='tissue'?'柔软亲肤':'清洁护理',24,18,'#fff');icon(117);x.fillStyle=hue(32);x.fillRect(15,160,226,42);text(name,181,24,'#fff');text('家用装',229,14,'#fff')}
else if(type=='cig'){x.fillStyle='#e8e5d8';x.fillRect(18,64,220,132);x.fillStyle='#a32624';x.fillRect(0,0,256,54);text('吸烟有害健康',27,19,'#fff');icon(119);text(name||'香烟',178,25,'#292b2b');text('请勿向未成年人出售',226,13,'#fff')}
else{x.fillStyle='#f2eee2';x.fillRect(18,70,220,105);icon(120);text(name,180,25,hue(-25));text(CZH[cat]||'精选商品',220,15,'#fff')}
return ctex(c,1,1)}
function gMerge(gs){const pos=[],nor=[],uv=[],idx=[];let off=0;for(const g of gs){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(u.getX(i),u.getY(i))}const ix=g.index?Array.from(g.index.array):[...Array(p.count).keys()];for(const i of ix)idx.push(i+off);off+=p.count}const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));m.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));m.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));m.setIndex(idx);return m}
function setUV(g,fn){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){const r=fn(p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i),u.getX(i),u.getY(i));if(r)u.setXY(i,r[0],r[1])}}
const boxUV=(g)=>setUV(g,(x,y,z,nx,ny,nz)=>Math.abs(nz)>.5?null:[.02,.5]);
const GEOC={},GEO={can:()=>{const g=new THREE.CylinderGeometry(.033,.033,.122,10);g.translate(0,.061,0);setUV(g,(x,y,z,nx,ny)=>Math.abs(ny)>.9?[.5,ny>0?.97:.03]:null);return g},
bottle:()=>{const a=new THREE.CylinderGeometry(.035,.035,.15,10);a.translate(0,.075,0);setUV(a,(x,y,z,nx,ny,nz,u,v)=>Math.abs(ny)>.9?[.5,.3]:[u,v*.6]);const b=new THREE.CylinderGeometry(.014,.035,.035,10);b.translate(0,.1675,0);setUV(b,(x,y,z,nx,ny,nz,u,v)=>[u,.62+v*.18]);const c=new THREE.CylinderGeometry(.014,.014,.04,10);c.translate(0,.205,0);setUV(c,(x,y,z,nx,ny,nz,u,v)=>[u,.86+v*.14]);return gMerge([a,b,c])},
cup:()=>{const a=new THREE.CylinderGeometry(.058,.043,.1,10,1,true);a.translate(0,.05,0);setUV(a,(x,y,z,nx,ny,nz,u,v)=>[u,v*.89]);const b=new THREE.CylinderGeometry(.059,.059,.008,10);b.translate(0,.104,0);setUV(b,()=>[.5,.96]);return gMerge([a,b])},
bag:()=>{const g=new THREE.BoxGeometry(.14,.2,.04,3,5,1);g.translate(0,.1,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i)-.1,Z=p.getZ(i);if(Math.abs(Z)>.01){const k=(1-(X/.07)**2)*(1-(Y/.1)**2);p.setZ(i,Z+Math.sign(Z)*.014*k);if(Math.abs(Y)>.088)p.setZ(i,Z*.3)}}g.computeVertexNormals();boxUV(g);return g},
box:()=>{const g=new THREE.BoxGeometry(.105,.14,.045);g.translate(0,.07,0);boxUV(g);return g},carton:()=>{const g=new THREE.BoxGeometry(.075,.17,.075);g.translate(0,.085,0);return g},
jug:()=>{const a=new THREE.BoxGeometry(.12,.22,.075);a.translate(0,.11,0);boxUV(a);const b=new THREE.CylinderGeometry(.03,.03,.03,8);b.translate(.03,.235,0);setUV(b,()=>[.9,.85]);return gMerge([a,b])},
roll:()=>{const g=new THREE.BoxGeometry(.23,.11,.11);g.translate(0,.055,0);boxUV(g);return g},cig:()=>{const g=new THREE.BoxGeometry(.055,.085,.022);g.translate(0,.0425,0);boxUV(g);return g}};
GEO.get=t=>GEOC[t]||(GEOC[t]=GEO[t]());
const INST={};
function put(type,cat,vi,x,y,z,ry){const k=type+'|'+cat+'|'+vi,o=INST[k]||(INST[k]={type,cat,vi,m:[]});o.m.push(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry),new THREE.Vector3(1,1,1)))}
function flushItems(){for(const k in INST){const o=INST[k],mat=M({map:labelTex(o.type,o.cat,o.vi),roughness:o.type=='can'?.3:.6,metalness:o.type=='can'?.35:0});const im=new THREE.InstancedMesh(GEO.get(o.type),mat,o.m.length);o.m.forEach((m,i)=>im.setMatrixAt(i,m));im.frustumCulled=false;scene.add(im)}}
function fill(ax,fixed,a0,a1,y,face,cat){let p=a0+.04,type=pk(CATS[cat]),vi=ri(0,4),run=ri(5,10);const ry=Math.atan2(face[0],face[1]);
while(true){const w=IT_W[type]*(1.03+Math.random()*.1);if(p+w>a1-.03)break;if(Math.random()>.035){const cc=p+w/2,d=(Math.random()-.5)*.016;put(type,cat,vi,ax=='z'?fixed+face[0]*d:cc,y,ax=='z'?cc:fixed+face[1]*d,ry+(Math.random()-.5)*.1)}p+=w;if(--run<=0){type=pk(CATS[cat]);vi=ri(0,4);run=ri(5,10)}}}
const perfT=(()=>{const c=cvs(64,64),g=c.getContext('2d');g.fillStyle='#b9c0c3';g.fillRect(0,0,64,64);g.fillStyle='#4a5055';for(let i=4;i<64;i+=8)for(let j=4;j<64;j+=8){g.beginPath();g.arc(i,j,1.6,0,7);g.fill()}const t=ctex(c,1,1);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
const railT=(()=>{const c=cvs(128,16),g=c.getContext('2d');g.fillStyle='#f2f2ee';g.fillRect(0,0,128,16);for(let i=0;i<128;i+=21){g.fillStyle=Math.random()<.5?'#f2d21a':'#ffffff';g.fillRect(i+2,2,18,12);g.fillStyle='#c22';g.font='bold 9px sans-serif';g.fillText((ri(3,99))+'.0',i+4,12)}const t=ctex(c,1,1);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
let _pm,_rm;const perfM=()=>{if(!_pm){_pm=M({map:perfT,roughness:.6});_pm.userData.tile=.5}return _pm},railM=()=>{if(!_rm){_rm=M({map:railT,roughness:.5});_rm.userData.tile=.6}return _rm};
function column(x,z){bx(.42,3,.42,MT('paint',{color:0xe8ece9}),x,1.5,z);bx(.46,.12,.46,MT('metal',{color:0x30353a}),x,.06,z);bx(.44,.14,.44,MT('paint',{color:0x1f9d7a}),x,2.5,z);blk(x-.23,x+.23,z-.23,z+.23)}
function gondola(x,z0,z1,cL,cR,title){const L=z1-z0,cz=(z0+z1)/2,dkm=MT('metal',{color:0x30353a}),bm=MT('metal',{color:0xcfd6d9});
bx(.66,.12,L,dkm,x,.06,cz);bx(.05,1.8,L,perfM(),x,.96,cz);const nU=Math.max(2,Math.round(L/1.2)+1);for(let i=0;i<nU;i++)bx(.1,1.86,.07,dkm,x,.93,z0+L*i/(nU-1));bx(.62,.07,L+.04,dkm,x,1.88,cz);
[-1,1].forEach((s,si)=>{const cat=si?cR:cL;LV.forEach(y=>{bx(.32,.02,L,bm,x+s*.19,y,cz);bx(.02,.06,L,railM(),x+s*.355,y+.005,cz);fill('z',x+s*.2,z0,z1,y+.011,[s,0],cat)})});
sign(title,x,2.3,z0-.02,Math.PI,.9,.3,'#1f6a52','#fff');sign(title,x,2.3,z1+.02,0,.9,.3,'#1f6a52','#fff');[-.3,.3].forEach(o=>{bx(.02,.7,.02,dkm,x+o,2.62,z0);bx(.02,.7,.02,dkm,x+o,2.62,z1)});
bx(.52,.5,.5,MT('wood'),x,.25+.0,z0-.42);for(let i=0;i<3;i++)for(let j=0;j<2;j++)put('box',cL,ri(0,4),x-.14+i*.14,.5,z0-.42+(j-.5)*.16,Math.PI+(Math.random()-.5)*.2);
blk(x-.35,x+.35,z0-.65,z1+.1)}
function wallUnit(ax,fx,a0,a1,face,cats,lv){const L=a1-a0,c=(a0+a1)/2,bm=MT('metal',{color:0xcfd6d9}),dkm=MT('metal',{color:0x30353a}),Z=ax=='z',P=(al,o)=>Z?[fx+face[0]*o,al]:[al,fx+face[1]*o],top=lv[lv.length-1]+.3;
const sp=P(c,.03);bx(Z?.05:L,top,Z?L:.05,perfM(),sp[0],top/2,sp[1]);
lv.forEach(y=>{const b=P(c,.19),r=P(c,.355);bx(Z?.32:L,.02,Z?L:.32,bm,b[0],y,b[1]);bx(Z?.02:L,.06,Z?L:.02,railM(),r[0],y+.005,r[1]);
const seg=L/cats.length;cats.forEach((cat,i)=>fill(ax,Z?fx+face[0]*.2:fx+face[1]*.2,a0+seg*i,a0+seg*(i+1),y+.011,face,cat))});
const seg=L/cats.length;cats.forEach((cat,i)=>{if(cat=='cig')return;const q=P(a0+seg*(i+.5),.3);sign(CZH[cat],q[0],2.25,q[1],Math.atan2(face[0],face[1]),.9,.28,'#1f6a52','#fff')});
if(Z)blk(fx-.02+Math.min(0,face[0]*.5),fx+.02+Math.max(0,face[0]*.5),a0,a1);else blk(a0,a1,fx-.02+Math.min(0,face[1]*.5),fx+.02+Math.max(0,face[1]*.5))}
function fridgeBank(){const dkm=MT('metal',{color:0x30353a}),mt=MT('metal',{color:0xaeb6ba});
bx(.04,2,2.6,dkm,3.93,1,.7);bx(.55,2,.04,dkm,3.65,1,-.6);bx(.55,2,.04,dkm,3.65,1,2);bx(.58,.3,2.64,mt,3.65,1.85,.7);bx(.58,.25,2.64,dkm,3.65,.125,.7);
const lamp=new THREE.MeshBasicMaterial({color:0xe8f4ff});bx(.02,.02,2.5,lamp,3.5,1.72,.7);
[.45,.8,1.15,1.5].forEach(y=>{bx(.45,.02,2.5,mt,3.7,y,.7);fill('z',3.62,-.55,1.95,y+.011,[-1,0],pk(['drink','can','milk']))});
for(const zz of[-.6,.25,1.1,2.0])bx(.05,1.45,.05,mt,3.34,1.12,zz);bx(.05,.05,2.6,mt,3.34,.4,.7);bx(.05,.05,2.6,mt,3.34,1.78,.7);
const g1=bx(.02,1.35,.85,GL2(.2),3.33,1.1,-.17);g1.userData.skip=1;bx(.02,1.35,.9,GL2(.2),3.33,1.1,1.55);
const fp=new THREE.Group();fp.position.set(3.33,1.1,.25);scene.add(fp);const fd=bx(.02,1.35,.85,GL2(.45),0,0,.425,fp);bx(.03,.4,.03,mt,-.03,0,.75,fp);fp.rotation.y=-1.1;
const fi=mkIt(fd,'放进冰柜 · 关门',async()=>{fi.on=false;await anim(.9,k=>fp.rotation.y=-1.1*(1-k));done(1)});window.FI=fi;
sign('冷饮',3.33,2.12,.7,-Math.PI/2,1,.3,'#1f6aa0','#fff')}

TXF.ceil=(x,w,h)=>{x.fillStyle='#e6e9e9';x.fillRect(0,0,w,h);spk(x,w,h,500,.05);x.fillStyle='#8c9292';x.fillRect(0,0,w,2);x.fillRect(0,0,2,h);x.fillRect(0,h/2,w,1);x.fillRect(w/2,0,1,h)};TIL.ceil=1.2;RO.ceil=.9;
let POW=true,NOTEOPEN=false,FLON=false,PKI=[],bagP,drw,flashM,fuseBox,brkS=[],logM,candleM,schNote,flameM,flameL,LPM,toT,fuseSeq=[],readNote=false;
const FLS=new THREE.SpotLight(0xfff0d0,0,16,.55,.45,1.2),_dv=new THREE.Vector3();scene.add(FLS,FLS.target);
function setPower(on){POW=on;LIGHTS.forEach(l=>l.intensity=on?l.userData.base:0);SGN.forEach(m=>m.color.setHex(on?0xffffff:0x2a2c2e));if(LPM)LPM.color.setHex(on?0xf6fcff:0x2a2d30)}
function toast(t,ms){const e=$('toast');e.textContent=t;e.style.opacity=1;clearTimeout(toT);toT=setTimeout(()=>e.style.opacity=0,ms||3400)}
function showNote(t,txt){return new Promise(r=>{const e=$('note');e.innerHTML='<b>'+t+'</b><p>'+txt.replace(/\n/g,'<br>')+'</p><i>点击关闭</i>';e.style.display='block';NOTEOPEN=true;const c=()=>{e.style.display='none';NOTEOPEN=false;e.removeEventListener('pointerdown',c);r()};setTimeout(()=>e.addEventListener('pointerdown',c),250)})}
const waitFor=f=>new Promise(r=>{const t=setInterval(()=>{if(f()){clearInterval(t);r()}},250)});
const knock=()=>[0,260,520].forEach(t=>setTimeout(()=>beep(80,.18,.35),t));
async function beat(t,ms){const y=yaw,p=pit;cmode='cine';bars(1);cp.set(px,1.6+PY,pz);ct.set(px-Math.sin(y)*5,1.6+PY+Math.tan(p)*5,pz-Math.cos(y)*5);await sub('',t,ms||2400);toPlay(y,p);cp.set(px,1.6+PY,pz)}
async function faceY(ch,a,s){const a0=ch.rotation.y,d=((a-a0+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;await anim(s,k=>ch.rotation.y=a0+d*k)}
const reachA=(ch,side,to,s)=>{const U=side>0?ch.U.uReach:ch.U.uReachR,f=U.value;return anim(s,k=>{U.value=f+(to-f)*k})};
const HPOS=(h,s,r)=>{const D=MESH[h.k],ry=h.rotation.y,lx=s*.21,lz=.52*Math.sin(1.25*r);return new THREE.Vector3(h.position.x+lx*Math.cos(ry)+lz*Math.sin(ry),h.position.y+D.PYA-.52*Math.cos(1.25*r),h.position.z-lx*Math.sin(ry)+lz*Math.cos(ry))};
function billTex(){const c=cvs(128,64),x=c.getContext('2d');x.fillStyle='#d9e4c2';x.fillRect(0,0,128,64);x.strokeStyle='#4a7a4a';x.lineWidth=3;x.strokeRect(3,3,122,58);x.fillStyle='#3a6a3a';x.beginPath();x.arc(64,32,18,0,7);x.fill();x.fillStyle='#e8f0d8';x.font='bold 20px sans-serif';x.textAlign='center';x.fillText('¥',64,40);x.fillStyle='#3a6a3a';x.font='bold 14px sans-serif';x.fillText('100',20,40);x.fillText('100',108,40);return ctex(c,1,1)}
function paperTex(l1){const c=cvs(128,160),x=c.getContext('2d');x.fillStyle='#efe6c8';x.fillRect(0,0,128,160);x.fillStyle='#7a6a4a';for(let i=0;i<9;i++)x.fillRect(12,22+i*14,rn(50,100),2);x.fillStyle='#a22';x.font='bold 14px sans-serif';x.fillText(l1,12,16);return ctex(c,1,1)}
const TIN=(n)=>M({map:paperTex(n),roughness:.9});
function buildStory(){
PKI.forEach(m=>m.visible=true);
drw=bx(.26,.06,.3,solid(0x3a3f44,'pla'),2.2,1.03,-3.5);mkIt(drw,'',()=>{});
bagP=bx(.2,.26,.12,M({map:pack(0xd8c7a6,'便利')}),2.05,1.1,-2.35);bagP.visible=false;
mkIt(bagP,'拿起纸袋',()=>{bagP.visible=false;bagP.userData.it.on=false;carry='bag';hold('纸袋');tdone(0);setObj('去后巷，下到地下室（走廊尽头的后门，楼梯在右边）');waitFor(()=>PY<-2).then(()=>{tdone(1);logM.userData.it.on=true;setObj('读桌上的夜班日志（地下室最里面）')})});
flashM=add(new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.2,10),MT('metal',{color:0x333a3f})),3.8,1.05,-1.25);flashM.rotation.z=1.4;
mkIt(flashM,'拿起手电筒',()=>{flashM.visible=false;flashM.userData.it.on=false;FLON=true;tdone(0);toast('手电筒亮了。');setObj('去走廊检查配电箱（后墙右边的员工门）');fuseBox.userData.it.on=true});
schNote=bx(.02,.3,.22,TIN('便条'),-2.9,1.4,9.4);mkIt(schNote,'读便条',async()=>{readNote=true;await showNote('便条（夹在排班表后面）','停电的时候别慌。\n配电箱在走廊右手边。\n开关的顺序不能错：\n先拉 B，再拉 A，最后推 C。\n拉错了就会跳闸，一切重来。\n\n手电筒放在收银台后面。\n——前任夜班')});
fuseBox.userData.it.fn=()=>{fuseBox.userData.it.on=false;tdone(1);toast('配电箱里有三个开关：A、B、C。顺序，似乎很重要……');brkS.forEach(m=>m.userData.it.on=true);setObj(readNote?'按便条上的顺序拉开关':'恢复电力（休息室里也许有人留了提示）')};
fuseBox.userData.it.label='打开配电箱';
['A','B','C'].forEach((n,i)=>{const m=bx(.05,.11,.06,solid(i==1?0x2a6a2a:0x8a2020),3.82,1.5,4.17+i*.13);brkS.push(m);mkIt(m,'拉动开关 '+n,()=>{m.rotation.x=.7;m.userData.it.on=false;fuseSeq.push(i);beep(900,.05);if(fuseSeq.length==3){const ok=fuseSeq.join()=='1,0,2';fuseSeq=[];if(ok){brkS.forEach(b=>b.userData.it.on=false);powerBack()}else{beep(120,.5,.5);toast('啪——跳闸了。顺序不对，开关全弹了回来。');setTimeout(()=>brkS.forEach(b=>{b.rotation.x=0;b.userData.it.on=true}),700)}}})});
logM=bx(.16,.03,.22,TIN('夜班日志'),6.7,-2.8+.715,20.5);mkIt(logM,'翻开夜班日志',async()=>{logM.userData.it.on=false;await showNote('夜班日志','三年前，十月的一个雨夜，整条街停电。\n一个穿校服的女生走进来躲雨，\n买了蜡烛和打火机，说要点给一个人。\n\n后门被风吹开了，我下去关地下室的门。\n等我回来，她已经不见了，柜台上只剩一个纸袋。\n\n后来每年的今天，凌晨三点，她都会来买同样的东西。\n不要拦她，不要多问，收完钱就好。\n如果有一天，你在这间店里待到天亮——\n替她在地下室点一支蜡烛。\n——前任夜班');tdone(2);candleM.userData.it.on=true;setObj('把蜡烛摆上，点燃')});
const tbl=bx(.9,.7,.5,MT('wood'),6.5,-2.8+.35,20.55);
const ptx=T.girl_f.clone();ptx.needsUpdate=true;ptx.repeat.set(.146,.11);ptx.offset.set(.427,.831);const ph=new THREE.Mesh(new THREE.PlaneGeometry(.22,.26),M({map:ptx}));ph.position.set(6.5,-2.8+1.0,20.88);ph.rotation.y=Math.PI;scene.add(ph);bx(.26,.3,.03,MT('wood'),6.5,-2.8+1.0,20.9);
candleM=add(new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.15,10),MTX('cer',0xf2ecd8)),6.35,-2.8+.7+.075,20.5);mkIt(candleM,'点燃蜡烛',()=>{candleM.userData.it.on=false;carry=null;hold('');beep(1800,.05);flameM.visible=true;flameL.intensity=1.2;tdone(3)});
flameM=add(new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),new THREE.MeshBasicMaterial({color:0xffc060})),6.35,-2.8+.7+.17,20.5);flameM.scale.y=1.8;flameM.visible=false;flameL=lamp2(6.35,-2.8+1.0,20.3,0xffb060,0,6);flameL.userData.base=0;
TICK.push(()=>{if(flameM.visible)flameL.intensity=1.0+Math.random()*.4;FLS.intensity=FLON&&!POW?2.4:0;if(FLON){cam.getWorldDirection(_dv);FLS.position.copy(cam.position);FLS.target.position.copy(cam.position).addScaledVector(_dv,6)}if(girl&&girl.holdL&&girl.visible)girl.holdL.forEach((m,i)=>m.position.copy(HPOS(girl,1,girl.U.uReach.value)).add(new THREE.Vector3(0,i*.075,0)));if(girl&&girl.holdR&&girl.visible)girl.holdR.position.copy(HPOS(girl,-1,girl.U.uReachR.value))})}
async function girlScene(){
items.length=0;PKI.forEach(m=>items.push(m));
girl=human('girl');girl.position.set(-2.4,0,-23);girl.holdL=[];cmode='cine';ct.set(-2.4,1.3,-23);follow=girl;await sub('','国道上没有车。一个女生，从夜色里走了过来。',3000);await go(girl,-2.4,-7.2,1.7);await door(1);await go(girl,-2.4,-3.5,1.2);door(0);
await sub('','她在货架间慢慢走着，像是在找什么。',2800);
for(const [x,z,it] of [[-3.8,-3.15,PKI[0]],[-5.4,-3.15,PKI[1]],[-.2,-2.5,PKI[2]]]){await go(girl,x,z,1.0);await faceY(girl,0,.5);await reachA(girl,1,1,.7);const p0=it.position.clone(),p1=HPOS(girl,1,1);await anim(.35,k=>it.position.lerpVectors(p0,p1,k));girl.holdL.push(it);await reachA(girl,1,0,.6)}
await go(girl,1.35,-2.6,1.1);await faceY(girl,Math.PI/2,.5);
for(let i=0;i<3;i++){const it=girl.holdL.shift();await reachA(girl,1,1,.5);const p0=it.position.clone(),p1=new THREE.Vector3(2.05,.97,-2.05-i*.3);await anim(.45,k=>it.position.lerpVectors(p0,p1,k));it.rotation.y=Math.PI/2*.0;await reachA(girl,1,0,.4)}
girl.holdL=null;follow=null;await sub('','她把东西一件一件放在柜台上，没有出声。',2600)}
async function payScene(){
cmode='cine';bars(1);await cut([2.55,1.62,-2.6],[1.35,1.5,-2.6]);
await sub('你','一共三十二块。');await sub('女生','……');
const mny=new THREE.Mesh(new THREE.BoxGeometry(.17,.004,.075),M({map:billTex()}));mny.position.copy(HPOS(girl,-1,0));scene.add(mny);girl.holdR=mny;await reachA(girl,-1,1,.7);
const p0=mny.position.clone(),p1=new THREE.Vector3(2.0,.985,-3.2);await anim(.5,k=>mny.position.lerpVectors(p0,p1,k));girl.holdR=null;await reachA(girl,-1,0,.5);
await sub('','她把钱放在柜台上，没有抬头看你。',2400);
toPlay(Math.PI/2,-.25);cp.set(3.2,1.6,-2.6);setObj('收下顾客的钱');
drw.userData.it.on=false;mkIt(mny,'收下钞票',()=>{mny.visible=false;mny.userData.it.on=false;hold('钞票');setObj('把钞票放进收银机的抽屉');drw.userData.it.label='放进收银机';drw.userData.it.on=true});mny.userData.it.on=true;
let done_;drw.userData.it.fn=async()=>{drw.userData.it.on=false;await anim(.5,k=>drw.position.x=2.2+.26*k);hold('');beep(700,.1);await sleep(300);await anim(.4,k=>drw.position.x=2.46-.26*k);beep(500,.1);done_()};
await new Promise(r=>done_=r);setObj('');await sleep(400);
PKI.forEach(m=>m.visible=false);bagP.visible=true;
cmode='cine';bars(1);await cut([2.55,1.62,-2.6],[1.35,1.5,-2.6]);await sub('女生','……天亮之前，别去地下室。');
await cut([.6,1.7,-1.2],[1.35,1.2,-2.8]);await girlExit();
await sub('','店里又安静下来了。柜台上，她落下了一个纸袋。',3000)}
async function powerBack(){beep(300,.3);for(let i=0;i<6;i++){setPower(i%2==1);await sleep(110+Math.random()*160)}setPower(true);FLON=false;girl.visible=false;beep(900,.12);tdone(2);toast('灯亮了。')}
async function ghostWatch(){await waitFor(()=>cmode=='play'&&!POW&&px<3.4&&pz<2.4&&pz>-4.4);if(POW)return;girl.holdL=null;girl.holdR=null;girl.U.uReach.value=0;girl.U.uReachR.value=0;girl.scale.setScalar(1);girl.position.set(-6.4,0,-5.7);girl.rotation.y=0;girl.visible=true;beep(60,.9,.35);let t=0;await new Promise(r=>{const iv=setInterval(()=>{const dx=girl.position.x-px,dz=girl.position.z-pz,len=Math.hypot(dx,dz),dot=(dx*-Math.sin(yaw)+dz*-Math.cos(yaw))/len;if(dot>.82&&len<16)t+=.1;if(t>1.3||POW){clearInterval(iv);r()}},100)});girl.visible=false;if(!POW){beep(70,.7,.5);toast('……窗外，什么都没有了。')}}
async function chap3(){
setClock('03:48');await sleep(2000);for(let i=0;i<5;i++){setPower(i%2==0?false:true);await sleep(130+Math.random()*200)}setPower(false);beep(55,.9,.5);
await beat('——灯，全灭了。',2400);
tasks=['在柜台后面找到手电筒','去走廊检查配电箱','恢复店里的电'].map(t=>({t,d:0}));tk();flashM.userData.it.on=true;schNote.userData.it.on=true;ghostWatch();
setObj('在柜台后面找到手电筒（收银台旁边）');await new Promise(r=>tR=r);setObj('');await sleep(1500);await chap4()}
async function chap4(){
setClock('04:05');await beat('店里重新亮了起来。空气里，多了一点潮湿的味道。',3000);
tasks=['拿起女孩落下的纸袋','去后巷，下到地下室','读桌上的夜班日志','把蜡烛摆上，点燃'].map(t=>({t,d:0}));tk();bagP.userData.it.on=true;setObj('拿起女孩落下的纸袋（柜台上）');
await new Promise(r=>tR=r);setObj('');await sleep(800);await farewell();await ending()}
async function farewell(){
cmode='cine';bars(1);follow=null;setCam([6.5,-1.3,17.0],[6.5,-1.4,20.4]);girl.holdL=null;girl.holdR=null;girl.position.set(6.5,-2.8,18.8);girl.rotation.y=0;girl.visible=true;
await sub('','烛光里，有人站在那里。',2400);await faceY(girl,Math.PI,1.4);setCam([6.5,-1.4,17.6],[6.5,-1.35,18.8]);
await sub('女生','……你点了蜡烛。');await sub('女生','三年前的今天，我躲进这间店的地下室，再也没有出去。');await sub('女生','每年我都来买蜡烛，可是从来没有人替我点。');await sub('女生','……谢谢你。天，快亮了。');
for(let i=0;i<7;i++){girl.visible=i%2==1;await sleep(120)}girl.visible=false;flameL.intensity=1}
async function ending(){
await fade(1,1400);setClock('06:00');scene.background.set(0x3b5578);scene.fog.color.set(0x3b5578);
cmode='cine';bars(1);setCam([3.2,1.6,-2.6],[-2.4,1.4,-4.6]);clerk.visible=true;clerk.position.set(-2.4,0,-9);clerk.rotation.y=0;
await fade(0,1400);await sub('','窗外，天亮了。',2200);door(1);follow=clerk;await go(clerk,-2.4,-3.4,1.3);door(0);await go(clerk,1.3,-2.6,1.2);await faceY(clerk,Math.PI/2,.5);follow=null;setCam([3.0,1.62,-2.6],[1.3,1.5,-2.6]);
await sub('店员','早。……一夜没睡吧。');await sub('你','店长，地下室——');await sub('店员','你去了啊。');await sub('店员','每年的今天，总得有个人替她点一支蜡烛。');await sub('店员','别问我是谁告诉你的。守这间店的人，都会知道。');await sub('店员','回去睡吧。辛苦了。');
await fade(1,1500);const o=$('ov');o.innerHTML='<h1>第一夜</h1><p>交班、接待、补货、倒垃圾、锁门、停电、配电箱、地下室。<br>你替她点了一支蜡烛。<br>——第一夜，完。</p><button onclick="location.reload()">再来一次</button><button onclick="explore()" style="background:#444;color:#eee">自由走走</button>';o.style.display='flex'}
TXF.grass=(x,w,h)=>{x.fillStyle='#2a3424';x.fillRect(0,0,w,h);for(let i=0;i<1400;i++){x.fillStyle=`hsl(${rn(70,120)|0},${rn(25,45)|0}%,${rn(10,26)|0}%)`;x.fillRect(rn(0,w),rn(0,h),rn(1,3),rn(2,6))}};TIL.grass=5;RO.grass=1;
const CARS=[];let carT=14,scareArmed=false,bagScareArmed=false,parkedCar;
function treeGeo(){const gs=[];const tr=new THREE.CylinderGeometry(.18,.32,2.6,6);tr.translate(0,1.3,0);setUV(tr,(x,y,z,nx,ny,nz,u,v)=>[.06,v]);gs.push(tr);
for(let i=0;i<5;i++){const r=2.7-i*.5,h=3.1,c=new THREE.ConeGeometry(r,h,9,1,true);c.translate(0,1.9+i*1.85+h/2,0);const p=c.attributes.position;for(let k=0;k<p.count;k++){if(p.getY(k)<1.9+i*1.85+h-.1){const a=Math.atan2(p.getZ(k),p.getX(k)),f=1+.12*Math.sin(a*5+i);p.setX(k,p.getX(k)*f);p.setZ(k,p.getZ(k)*f)}}c.computeVertexNormals();setUV(c,(x,y,z,nx,ny,nz,u,v)=>[.2+u*.75,v]);gs.push(c)}
return gMerge(gs)}
function foliageTex(){const c=cvs(64,64),x=c.getContext('2d');x.fillStyle='#4a3524';x.fillRect(0,0,12,64);for(let i=0;i<60;i++){x.fillStyle='rgba(20,10,5,.5)';x.fillRect(rn(0,12),rn(0,64),1,rn(4,14))}x.fillStyle='#10281b';x.fillRect(12,0,52,64);for(let i=0;i<520;i++){x.fillStyle=`hsl(${rn(130,165)|0},${rn(30,50)|0}%,${rn(8,24)|0}%)`;x.fillRect(rn(12,64),rn(0,64),rn(1,2),rn(3,9))}return ctex(c,1,1)}
function buildForest(){const g=treeGeo(),mat=M({map:foliageTex(),roughness:1}),pos=[];
const add_=(x0,x1,z0,z1,sp)=>{for(let x=x0;x<x1;x+=sp)for(let z=z0;z<z1;z+=sp)pos.push([x+rn(-sp*.4,sp*.4),z+rn(-sp*.4,sp*.4)])};
add_(-120,120,-52,-47,5);add_(-120,120,-120,-52,8);add_(-120,-30,-47,60,8);add_(34,120,-47,60,8);add_(-120,120,26,120,8);add_(-30,34,60,120,8);add_(-120,-34,-52,-47,5);
const im=new THREE.InstancedMesh(g,mat,pos.length),m=new THREE.Matrix4(),q=new THREE.Quaternion(),col=new THREE.Color();
pos.forEach((p,i)=>{const s=.8+Math.random()*1.05;m.compose(new THREE.Vector3(p[0],-.05,p[1]),q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*6.28),new THREE.Vector3(s,s*(.9+Math.random()*.3),s));im.setMatrixAt(i,m);col.setHSL(.38+Math.random()*.06,.5,.5+Math.random()*.35);im.setColorAt(i,col)});im.frustumCulled=false;scene.add(im)}
function makeCar(col,truck){const g=new THREE.Group(),L=truck?7.5:4.4,body=MT('metal',{color:col}),dkm=MT('metal',{color:0x15171a});g.userData.length=L;g.userData.width=1.9;
bx(L,truck?1.1:.75,1.9,body,0,truck?1.0:.7,0,g);if(truck){bx(2,1.3,2,body,L/2-1,1.9,0,g);bx(L-2.4,1.7,2,MT('metal',{color:0xc9ccd0}),-1.2,2.0,0,g)}else{bx(L*.52,.6,1.66,GL2(.9,0x10161c),-.2,1.35,0,g)}
const wm=MTX('rub',0x1a1a1a);[[-L*.32,.92],[-L*.32,-.92],[L*.32,.92],[L*.32,-.92]].forEach(p=>{const w=add(new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.24,12),wm),p[0],.36,p[1],g);w.rotation.x=Math.PI/2});
const hl=new THREE.MeshBasicMaterial({color:0xfff4c8}),tl=new THREE.MeshBasicMaterial({color:0xff2a1a});[.6,-.6].forEach(z=>{bx(.06,.16,.36,hl,L/2,.75,z,g);bx(.06,.14,.3,tl,-L/2,.75,z,g)});
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.15,1.5,10,12,1,true),new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.rotation.z=-Math.PI/2;beam.position.set(L/2+5,.8,0);g.add(beam);g.userData.beam=beam;g.userData.truck=truck;scene.add(g);return g}
function whoosh(v){if(!AC||!NB)return;const t=AC.currentTime,s=AC.createBufferSource();s.buffer=NB;s.loop=true;const f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(220,t);f.frequency.linearRampToValueAtTime(900,t+1.6);f.frequency.linearRampToValueAtTime(240,t+3.4);const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.13*v,t+1.6);g.gain.linearRampToValueAtTime(.0001,t+3.4);s.connect(f);f.connect(g);g.connect(AC.destination);s.start(t);s.stop(t+3.5)}
function horn(){if(!AC)return;const t=AC.currentTime,g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.05);g.gain.setValueAtTime(.35,t+.9);g.gain.exponentialRampToValueAtTime(.001,t+1.3);g.connect(AC.destination);[233,277].forEach(f=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(g);o.start(t);o.stop(t+1.4)})}
function spawnCar(dir,o){o=o||{};const sp=o.speed||(18+Math.random()*8),c=makeCar(o.col||pk([0x8a1f1f,0x1f3a6b,0xc9ccd0,0x2b2f33,0x3d5a3a]),o.truck);c.position.set(o.x!=null?o.x:(dir>0?-150:150),0,dir>0?-40:-32);c.rotation.y=dir>0?0:Math.PI;c.userData.v=sp*dir;CARS.push(c);setTimeout(()=>whoosh(o.truck?1.5:1),Math.max(0,(Math.abs(c.position.x)/sp-1.6)*1000));return c}
function carHalfExtents(car,angle=car.rotation.y){const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle)),l=(car.userData.length||4.4)/2,w=(car.userData.width||1.9)/2;return{x:l*c+w*s,z:l*s+w*c}}
function carCanOccupy(car,x,z){const h=carHalfExtents(car),pad=.22;if(VEHICLE_BLOCKERS.some(o=>x+h.x>o[0]-pad&&x-h.x<o[1]+pad&&z+h.z>o[2]-pad&&z-h.z<o[3]+pad))return false;
for(const other of CARS){if(other===car)continue;const oh=carHalfExtents(other),gap=.18;if(x+h.x+gap>other.position.x-oh.x&&x-h.x-gap<other.position.x+oh.x&&z+h.z+gap>other.position.z-oh.z&&z-h.z-gap<other.position.z+oh.z)return false}return true}
async function drive(car,pts,sp){for(const [x,z] of pts){const dx=x-car.position.x,dz=z-car.position.z,L=Math.hypot(dx,dz);if(L<.05)continue;await faceY(car,Math.atan2(-dz,dx),.5);let moved=0,last=performance.now(),blockedSince=0,notified=false;
while(moved<L){await sleep(16);const now=performance.now(),dt=Math.min((now-last)/1000,.05);last=now;const dirX=dx/L,dirZ=dz/L;let pace=sp;
// Follow same-direction highway traffic at a safe gap instead of pushing into it.
if(Math.abs(dirX)>.9&&Math.abs(dirZ)<.25)for(const other of CARS){if(other===car||Math.abs(other.position.z-car.position.z)>2.3||Math.sign(other.userData.v||0)!==Math.sign(dirX))continue;const ahead=(other.position.x-car.position.x)*dirX;if(ahead<=0)continue;const oh=carHalfExtents(other),ch=carHalfExtents(car),gap=ahead-oh.x-ch.x;if(gap<16)pace=Math.min(pace,Math.max(0,Math.abs(other.userData.v||0)+Math.max(0,gap-7)*.7))}
const step=Math.min(L-moved,pace*dt),nx=car.position.x+dirX*step,nz=car.position.z+dirZ*step;if(step>.001&&carCanOccupy(car,nx,nz)){car.position.x=nx;car.position.z=nz;moved+=step;blockedSince=0;notified=false}else{if(!blockedSince)blockedSince=now;if(!notified&&now-blockedSince>3500){toast('车辆正在等待路况安全后并入车道');notified=true}}}}
}
function stinger(){if(!AC||!NB)return;const t=AC.currentTime,g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.7,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+1.8);g.connect(AC.destination);
[[880,90],[932,95],[1250,140]].forEach(([a,b])=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+1.4);o.connect(g);o.start(t);o.stop(t+1.8)});
const n=AC.createBufferSource();n.buffer=NB;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=1800;const ng=AC.createGain();ng.gain.setValueAtTime(.55,t);ng.gain.exponentialRampToValueAtTime(.001,t+.5);n.connect(hp);hp.connect(ng);ng.connect(AC.destination);n.start(t);
const b=AC.createOscillator();b.frequency.setValueAtTime(70,t);b.frequency.exponentialRampToValueAtTime(28,t+.9);const bg=AC.createGain();bg.gain.setValueAtTime(.9,t);bg.gain.exponentialRampToValueAtTime(.001,t+1.1);b.connect(bg);bg.connect(AC.destination);b.start(t);b.stop(t+1.2)}
let hbT;function heart(on){clearInterval(hbT);if(on)hbT=setInterval(()=>{beep(52,.13,.5);setTimeout(()=>beep(48,.12,.4),170)},850)}
function flash(){const f=$('fd');f.style.transition='opacity .03s';f.style.background='#fff';f.style.opacity=.95;setTimeout(()=>{f.style.transition='opacity .5s';f.style.opacity=0;setTimeout(()=>f.style.background='#000',600)},60)}
async function shake(s){const bx_=cp.clone();await anim(s,k=>{cp.set(bx_.x+rn(-.04,.04)*(1-k),bx_.y+rn(-.03,.03)*(1-k),bx_.z+rn(-.04,.04)*(1-k))});cp.copy(bx_)}
function buildOutside(){
const gr=plane(500,500,'grass',0xffffff);add(gr,0,-.06,-20);
const fc=plane(64,22,'sidewalk',0xffffff);add(fc,0,-.02,-15);
add(plane(500,3,'conc',0x5a5d5f),0,-.015,-27.5);add(plane(500,3,'conc',0x5a5d5f),0,-.015,-44.5);
const rd=plane(500,14,'asphalt',0xffffff);add(rd,0,-.01,-36);
(()=>{const c=cvs(256,64),x=c.getContext('2d');x.clearRect(0,0,256,64);x.fillStyle='#d8d8d8';x.fillRect(0,2,256,2);x.fillRect(0,60,256,2);x.fillStyle='#e0b020';x.fillRect(0,30,256,2);x.fillRect(0,34,256,2);x.fillStyle='#d8d8d8';[16,48].forEach(y=>{for(let i=0;i<256;i+=64)x.fillRect(i,y,32,2)});const t=ctex(c,125,1);t.wrapS=t.wrapT=THREE.RepeatWrapping;const m=new THREE.Mesh(new THREE.PlaneGeometry(500,14),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.rotation.x=-Math.PI/2;m.position.set(0,-.005,-36);scene.add(m)})();
// canopy
const red=MT('paint',{color:0xc12a1e}),wht=MT('paint',{color:0xe4e8e8});bx(32,.4,13,wht,0,5.3,-15);bx(32,.7,.25,red,0,5.1,-21.6);bx(32,.7,.25,red,0,5.1,-8.4);bx(.25,.7,13,red,-16,5.1,-15);bx(.25,.7,13,red,16,5.1,-15);
for(const X of[-12,0,12])for(const Z of[-10.5,-19.5]){bx(.55,5.2,.55,wht,X,2.6,Z);bx(.6,.5,.6,red,X,.9,Z);blk(X-.4,X+.4,Z-.4,Z+.4);vblk(X-.43,X+.43,Z-.43,Z+.43)}
const cl=new THREE.MeshBasicMaterial({color:0xf2fbff});for(const X of[-10,-5,0,5,10])for(const Z of[-12.5,-17.5])bx(1.4,.05,.45,cl,X,5.08,Z);
sign('天路石化 24H',0,5.1,-21.74,Math.PI,6.5,.55,'#c12a1e','#fff');
const l1=lamp2(-6,4.7,-15,0xfff4e0,1.3,22),l2=lamp2(7,4.7,-15,0xfff4e0,1.3,22);
// pumps
const pm=MT('metal',{color:0xd6dadb}),pr=MT('metal',{color:0xb8281e}),rub=MTX('rub',0x1c1c1c);
for(const X of[-8,0,8]){bx(1.3,.22,6.2,MT('conc',{color:0xa4a8a8}),X,.11,-15);blk(X-.7,X+.7,-18.2,-11.8);vblk(X-.72,X+.72,-18.25,-11.75);
 for(const Z of[-14.2,-15.8]){bx(.72,1.55,.46,pm,X,.22+.78,Z);bx(.74,.26,.48,pr,X,.22+1.68,Z);const dc=cvs(64,32),dx=dc.getContext('2d');dx.fillStyle='#0a1a10';dx.fillRect(0,0,64,32);dx.fillStyle='#5cff9c';dx.font='bold 18px monospace';dx.fillText('00.00',6,23);
  const dsp=new THREE.Mesh(new THREE.PlaneGeometry(.5,.25),new THREE.MeshBasicMaterial({map:ctex(dc,1,1)}));dsp.position.set(X+.0,.22+1.2,Z+(Z<-15?-.235:.235));dsp.rotation.y=Z<-15?Math.PI:0;scene.add(dsp);
  const sd=Z<-15?-1:1,cv=new THREE.CatmullRomCurve3([new THREE.Vector3(X+.36,.9,Z),new THREE.Vector3(X+.6,.5,Z+sd*.1),new THREE.Vector3(X+.5,.15,Z+sd*.3),new THREE.Vector3(X+.4,.7,Z+sd*.2)]);scene.add(Object.assign(new THREE.Mesh(new THREE.TubeGeometry(cv,12,.025,6),rub),{}))}}
// price pylon
bx(.45,9,.45,MT('metal',{color:0xdadddd}),17,4.5,-25.5);vblk(16.72,17.28,-25.78,-25.22);const pc=cvs(128,160),px_=pc.getContext('2d');px_.fillStyle='#b8281e';px_.fillRect(0,0,128,160);px_.fillStyle='#fff';px_.font='bold 18px sans-serif';px_.textAlign='center';px_.fillText('天路石化',64,26);px_.fillStyle='#111';px_.fillRect(8,36,112,116);px_.fillStyle='#ffd23f';px_.font='bold 17px monospace';px_.textAlign='left';[['92#','7.52'],['95#','8.01'],['0#','7.23']].forEach((r,i)=>{px_.fillText(r[0],16,66+i*34);px_.fillText(r[1],68,66+i*34)});
const pmat=new THREE.MeshBasicMaterial({map:ctex(pc,1,1)});[-.23,.23].forEach(d=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.75),pmat);p.position.set(17,8.2,-25.5+d);p.rotation.y=d<0?Math.PI:0;scene.add(p)});bx(2.3,2.85,.4,MT('metal',{color:0x30353a}),17,8.2,-25.5);
// road signs
const sg=cvs(256,128),sx=sg.getContext('2d');sx.fillStyle='#0b6a3a';sx.fillRect(0,0,256,128);sx.strokeStyle='#fff';sx.lineWidth=4;sx.strokeRect(5,5,246,118);sx.fillStyle='#fff';sx.font='bold 26px sans-serif';sx.fillText('G105 国道',20,40);sx.font='bold 20px sans-serif';sx.fillText('← 临河 18 km',20,78);sx.fillText('白杨镇 42 km →',20,110);
const sm=new THREE.MeshBasicMaterial({map:ctex(sg,1,1),side:THREE.DoubleSide});const sgm=new THREE.Mesh(new THREE.PlaneGeometry(5,2.5),sm);sgm.position.set(-26,3.6,-26.5);scene.add(sgm);[-28,-24].forEach(X=>bx(.15,3.8,.15,MT('metal',{color:0x888d90}),X,1.9,-26.5));
bx(500,.28,.1,MT('metal',{color:0xb0b6ba}),0,.65,-45.4);{const po=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.95,.12),MT('metal',{color:0x6a7075}),125),m4=new THREE.Matrix4();for(let i=0;i<125;i++){m4.setPosition(-250+i*4,.47,-45.4);po.setMatrixAt(i,m4)}po.frustumCulled=false;scene.add(po)}
parkedCar=makeCar(0x2b4d7a);parkedCar.position.set(-7,0,-8.6);parkedCar.rotation.y=Math.PI/2;parkedCar.userData.beam.visible=false;parkedCar.userData.v=0;CARS.push(parkedCar);blk(-8.2,-5.8,-10.8,-6.4);
// Vehicle sized blockers keep departures out of pumps, pillars and the shop walls.
vblk(-10.15,-3.05,-5.18,-4.78);vblk(-1.75,4.15,-5.18,-4.78);vblk(-10.15,-9.78,-5.1,3.15);vblk(3.78,4.15,-5.1,3.15);vblk(-10.1,4.1,2.82,3.18);
buildForest()}
TICK.push(()=>{for(let i=CARS.length-1;i>=0;i--){const c=CARS[i];c.position.x+=c.userData.v*DT;if(Math.abs(c.position.x)>190){scene.remove(c);CARS.splice(i,1)}}
carT-=DT;if(carT<0&&cmode!=null){carT=14+Math.random()*22;spawnCar(Math.random()<.5?1:-1,{truck:Math.random()<.25})}
if(scareArmed&&cmode=='play'&&!NOTEOPEN&&px<2.25&&px>1.0&&Math.abs(pz-4.5)<.6)doorScare();
if(bagScareArmed&&cmode=='play'&&!NOTEOPEN&&px>2.6&&px<3.9&&pz>8.2&&pz<10.2)corridorScare()});
async function girlExit(){follow=girl;await go(girl,-2.4,-3.4,1.1);chime();await door(1);await go(girl,-2.4,-8,1.9);door(0);await go(girl,-2.4,-32,2.2);await faceY(girl,0,.6);
await sub('','她走到国道正中间，停下来，转身，面朝便利店。',3000);const t=spawnCar(-1,{truck:true,x:95,speed:26});await waitFor(()=>t.position.x<24);horn();await waitFor(()=>t.position.x<-1);girl.visible=false;await sleep(1500);follow=null;await sub('','卡车呼啸而过。路中央，什么都没有。',3200)}
async function doorScare(){scareArmed=false;const d=DOORS[0],y0=yaw,p0=pit;d.lock=true;cmode='cine';bars(1);follow=null;cp.set(px,1.6+PY,pz);ct.set(2.4,1.5,4.5);
girl.visible=true;girl.holdL=null;girl.holdR=null;girl.U.uReach.value=0;girl.U.uReachR.value=0;girl.position.set(2.75,0,4.5);girl.rotation.y=-Math.PI/2;
await sleep(700);beep(58,.6,.35);await anim(1.0,k=>{d.g.rotation.y=d.s*1.5*k});
await sleep(550);stinger();flash();heart(true);await go(girl,1.95,4.5,3.8);await shake(.7);
await sub('你','……你来这里做什么？',2800);await sub('','她没有回答。她的脸离你只有一拳远，眼睛一眨不眨。',3400);await sub('女生','……我的东西，不在这里。',2800);
heart(false);await go(girl,2.75,4.5,1.2);await go(girl,3.2,5,1.4);await go(girl,3.2,10.3,1.5);const bd=DOORS[3];bd.lock=true;await anim(.8,k=>{bd.g.rotation.y=bd.s*1.5*k});await go(girl,3.2,12.5,1.5);girl.visible=false;await anim(.8,k=>{bd.g.rotation.y=bd.s*1.5*(1-k)});bd.lock=false;bd.a=0;
await anim(.6,k=>{d.g.rotation.y=d.s*1.5*(1-k)});d.lock=false;d.a=0;toPlay(y0,p0);cp.set(px,1.6+PY,pz);toast('……她去哪儿了？')}
async function corridorScare(){bagScareArmed=false;const y0=yaw,p0=pit;cmode='cine';bars(1);follow=null;cp.set(3.2,1.6,9.3);ct.set(3.2,1.45,4);girl.visible=true;girl.holdL=null;girl.holdR=null;girl.rotation.y=0;
for(const z of[4.4,6.3,8.1]){setPower(false);beep(70,.3,.4);await sleep(320);girl.position.set(3.2,0,z);setPower(true);await sleep(520)}
setPower(false);stinger();await sleep(260);girl.visible=false;setPower(true);await sleep(600);toPlay(y0,p0);cp.set(px,1.6+PY,pz);toast('……什么都没有。')}
const its=[],movers=[],anims=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const anim=(s,f)=>new Promise(r=>anims.push({t:0,s,f,r}));
const go=(ch,x,z,sp)=>new Promise(r=>movers.push({ch,x,z,sp:sp||1.3,r}));
const mkIt=(m,label,fn)=>{m.userData.it={label,fn,on:false};its.push(m);return m.userData.it};
function prod(bottle,seed){const c=cvs(256,256),x=c.getContext('2d');x.fillStyle=bottle?'#d5e8f1':'#30343a';x.fillRect(0,0,256,256);let s=seed;const r=()=>(s=(s*9301+49297)%233280)/233280;
for(let j=0;j<4;j++){const y0=j*64;x.fillStyle='#8a9096';x.fillRect(0,y0+58,256,6);let X=4;while(X<250){const w=bottle?14+r()*6:22+r()*14,ph=bottle?50:34+r()*18;x.fillStyle=`hsl(${r()*360|0},${55+r()*30|0}%,${42+r()*18|0}%)`;x.fillRect(X,y0+58-ph,w,ph);x.fillStyle='rgba(255,255,255,.7)';x.fillRect(X+2,y0+58-ph*.6,w-4,ph*.2);X+=w+3}}return ctex(c,1,1)}
let clerk,girl,dl,dr,items=[],bottles=[],regM,beacon;
function build(){
const W0=-10,W1=4,Z0=-5,Z1=3,CX=(W0+W1)/2,WW=W1-W0,PA='paint',doorL=-3.15,doorR=-1.65;
const fl=add(new THREE.Mesh(new THREE.PlaneGeometry(WW,8),stileMat()),CX,0,-1);fl.rotation.x=-Math.PI/2;
let c=cvs(8,256),x=c.getContext('2d');[['#f2f4f2',0,.14],['#1f9d7a',.14,.2],['#e9ece8',.2,.7],['#7d8e95',.7,1]].forEach(a=>{x.fillStyle=a[0];x.fillRect(0,a[1]*256,8,(a[2]-a[1])*256)});
const wl=M({map:ctex(c,1,1)}),dk=MT('metal',{color:0x353b40}),gm=GL2(.16),gr=MT('paint',{color:0x1f9d7a}),paintW=MT('paint',{color:0xe9ede9});
bx(.1,3,8,wl,W0,1.5,-1);bx(.1,3,8,wl,W1,1.5,-1);wall('x',3,W0,W1,[[2.7,3.7]],wl,3,0);
for(const [a,b] of[[W0,doorL],[doorR,W1]]){const mid=(a+b)/2,w=b-a;bx(w,.78,.1,wl,mid,.39,-5);bx(w,1.82,.04,gm,mid,1.72,-5);bx(w,.12,.12,gr,mid,2.68,-5)}
for(const X of[W0,doorL,doorR,W1])bx(.12,2.85,.12,dk,X,1.42,-5);
bx(WW,.16,.1,gr,CX,2.88,-5);sign('24H 便利店',-2.4,2.34,-4.92,0,2.25,.48,'#14231f','#fff');
// ceiling, beams, lights, vents, columns
wb(W0,Z0,W1,Z1,2.95,3.05,'ceil',0);const lp=new THREE.MeshBasicMaterial({color:0xf6fcff});LPM=lp;
for(const X of[-9,-7.5,-4.5,-3,-1.5,1,2.5])for(const Z of[-3.6,-1.2,1.2])bx(.32,.03,1.1,lp,X,2.94,Z);
for(const X of[-6,-.5]){bx(.32,.28,8,paintW,X,2.8,-1);column(X,-4.62)}
const vt=(()=>{const cc=cvs(64,64),g=cc.getContext('2d');g.fillStyle='#d8dcdc';g.fillRect(0,0,64,64);g.fillStyle='#555';for(let i=4;i<64;i+=6)g.fillRect(4,i,56,2);return ctex(cc,1,1)})();
for(const p of[[-8,-2],[-3,1.5],[-8,1.5],[1,-3.5]])bx(.7,.04,.7,M({map:vt}),p[0],2.93,p[1]);
sign('出口',-2.4,2.62,-4.9,0,.5,.2,'#0a8a4a','#fff');sign('EXIT',3.2,2.3,2.9,Math.PI,.5,.18,'#0a8a4a','#fff');
// baseboards + door glass
bx(.04,.1,8,dk,W0+.07,.05,-1);bx(14,.1,.04,dk,CX,.05,2.93);
const gl=GL2(.22);dl=bx(.5,2.1,.03,gl,-2.65,1.05,-4.95);dr=bx(.5,2.1,.03,gl,-2.15,1.05,-4.95);
// shelving
gondola(-8.6,-2.2,1.9,'chips','biscuit','零食');gondola(-7.0,-2.2,1.9,'noodle','noodle','方便面');gondola(-5.4,-2.2,1.9,'drink','can','饮料');gondola(-3.8,-2.2,1.9,'home','wash','日用品');gondola(-2.2,-2.2,1.9,'candy','bread','糖果面包');gondola(-.2,-1.5,1.5,'stat','tissue','文具纸品');
wallUnit('z',-9.93,-3.6,2.4,[1,0],['chips','biscuit','candy','chips','bread'],LV);
wallUnit('x',2.93,-9.5,2.5,[0,-1],['liquor','home','wash','tissue','home','stat'],LV);
wallUnit('z',3.93,-4.2,-1.4,[-1,0],['cig','cig','cig'],[1.2,1.45,1.7,1.95]);
// fridge bank
fridgeBank();
// counter
bx(.6,.95,3.2,solid(0x7d878c,'lam'),2.2,.475,-2.6);bx(.7,.05,3.3,solid(0xe8eeef,'cer'),2.2,.97,-2.6);bx(.62,.12,3.2,dk,2.2,.06,-2.6);bx(.04,.08,3.2,dk,1.88,.92,-2.6);
bx(.35,.3,.4,solid(0x2b2e32,'pla'),2.2,1.14,-3.5);const sc=add(new THREE.Mesh(new THREE.PlaneGeometry(.3,.18),new THREE.MeshBasicMaterial({map:scrTex()})),2.38,1.2,-3.5);sc.rotation.y=Math.PI/2;
[0xdd3333,0x3399dd,0xeeaa66].forEach((cc,i)=>{const b=bx(.16,.22,.12,M({map:pack(cc,['薯片','牛奶','饼干'][i])}),2.05,1.1,-2.05-i*.3);b.visible=false;items.push(b)});
clerk=human('clerk');clerk.position.set(3.2,0,-1.6);clerk.rotation.y=Math.PI;
// fridge door (interactive) handled in fridgeBank; bottles to pick
[[-1.1,1.1],[.9,2.0],[1.6,2.15]].forEach((p,i)=>{const b=add(new THREE.Mesh(GEO.bottle(),M({map:labelTex('bottle','drink',i),roughness:.4})),p[0],.035,p[1]);b.rotation.z=1.55;b.rotation.y=i*1.7;
const it=mkIt(b,'捡起饮料',()=>{b.visible=false;it.on=false;nb++;tasks[0].t='捡起地上的饮料 '+nb+'/3';if(nb==3){done(0);FI.on=true;setObj('把饮料放进冰柜并关好门')}tk()});it.on=true;bottles.push(b)});
// street

beacon=new THREE.Mesh(new THREE.OctahedronGeometry(.1),new THREE.MeshBasicMaterial({color:0xffd23f}));beacon.scale.y=1.5;scene.add(beacon);
[[-10.05,-9.95,-5,3],[3.95,4.05,-5,3],[1.9,2.5,-4.2,-1],[3.35,3.95,-.6,2]].forEach(a=>blk(...a));
blk(W0,doorL,-5.08,-4.84);blk(doorR,W1,-5.08,-4.84);
flushItems();buildBOH()}

let nb=0,nsc=0;let tasks=[{t:'捡起地上的饮料 0/3',d:0},{t:'把饮料放进冰柜并关好门',d:0}];let allR;const allP=new Promise(r=>allR=r);
function tk(){$('tk').style.display='block';$('tk').innerHTML=tasks.map(a=>(a.d?'☑ ':'☐ ')+a.t).join('<br>')}
function done(i){tasks[i].d=1;tk();if(tasks.every(a=>a.d))allR()}
const setObj=t=>$('obj').textContent=t?'目标：'+t:'';
let AC;function beep(f,d,v){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(v||.14,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.start();o.stop(AC.currentTime+d)}
const chime=()=>{beep(1200,.3);setTimeout(()=>beep(900,.5),260)};
let entranceOpen=false,entranceAmount=0;
TICK.push(()=>{if(!dl||!dr||cmode!='play')return;const d=Math.hypot(px+2.4,pz+5);if(!entranceOpen&&d<2.6){entranceOpen=true;chime()}else if(entranceOpen&&d>3.2)entranceOpen=false;const target=entranceOpen?1:0;entranceAmount+=(target-entranceAmount)*Math.min(1,DT*5);dl.position.x=-2.65-.5*entranceAmount;dr.position.x=-2.15+.5*entranceAmount});
const door=o=>anim(.9,k=>{const v=o?k:1-k;dl.position.x=-2.65-.5*v;dr.position.x=-2.15+.5*v});
const bars=o=>document.body.classList.toggle('cine',!!o);
const fade=(o,ms)=>{$('fd').style.transition='opacity '+ms+'ms';$('fd').style.opacity=o;return sleep(ms)};
const setCam=(p,l)=>{cp.set(...p);ct.set(...l)};
function pan(p,l,s){const p0=cp.clone(),l0=ct.clone(),p1=new THREE.Vector3(...p),l1=new THREE.Vector3(...l);return anim(s,k=>{k=k*k*(3-2*k);cp.lerpVectors(p0,p1,k);ct.lerpVectors(l0,l1,k)})}
let skipR=null;const subE=$('sub');
function sub(who,text,ms){subE.innerHTML=(who?'<b>'+who+'</b>':'')+text;subE.style.opacity=1;return new Promise(r=>{const t=setTimeout(fin,ms||Math.max(2000,text.length*190));function fin(){clearTimeout(t);skipR=null;subE.style.opacity=0;setTimeout(r,300)}skipR=fin})}
const cap=async(t,ms)=>{$('cap').textContent=t;$('cap').style.opacity=1;await sleep(ms);$('cap').style.opacity=0;await sleep(900)};
document.addEventListener('pointerdown',()=>{if(cmode=='cine'&&skipR)skipR()});
function toPlay(y,p){px=cp.x;pz=cp.z;yaw=y;pit=p||0;cmode='play';bars(0);follow=null}
const cut=async(p,l)=>{await fade(1,300);setCam(p,l);await fade(0,300)};
async function story(){
setClock('02:47');
cmode='cine';bars(1);setCam([-30,1.6,-47],[2,3,-14]);fade(0,1500);pan([-10,1.7,-31],[-1,2.4,-8],9);spawnCar(-1,{truck:true,x:70,speed:20});await cap('凌晨 2:47 · 国道旁的加油站',3400);await sleep(2000);
await cut([-1.6,1.6,-3.7],[2.6,1.2,-2.4]);await sub('','店里只剩日光灯的嗡嗡声。',2600);
await cut([3.7,1.6,-3.6],[3.2,1.5,-1.6]);
await sub('店员','哟，来了啊。今晚就交给你了。');await sub('店员','收银机你应该会用。凌晨人少，大多数时候安静得很。');
pan([3.7,1.6,-3.6],[-1.1,.4,1.1],1.4);await sub('店员','地上有几瓶饮料掉了，你捡一下。');
pan([3.7,1.6,-3.6],[3.3,1,.6],1.4);await sub('店员','放进冰柜里，门别忘了关。');
pan([3.7,1.6,-3.6],[3.2,1.5,-1.6],1.2);await sub('店员','半夜要是有人进来……别多聊，收完钱就行。');await sub('店员','那我先走了。辛苦。');
await cut([.6,1.8,1.4],[3.2,1.3,-1]);follow=clerk;
for(const p of[[3.2,-.4],[1,-.4],[.4,-2.4],[-2.4,-3.4]])await go(clerk,p[0],p[1],1.4);
chime();await door(1);await go(clerk,-2.4,-7.4,1.5);door(0);await go(clerk,-6.3,-8.6,1.6);clerk.visible=false;beep(70,1.2,.2);follow=parkedCar;parkedCar.userData.beam.visible=true;await sleep(900);
await drive(parkedCar,[[-4.2,-10.1],[-4.2,-29.5]],10);
await waitFor(()=>CARS.every(c=>c===parkedCar||Math.abs(c.position.z+32.2)>2.5||Math.abs(c.position.x+4.2)>24));
await drive(parkedCar,[[-4.2,-32.2],[-80,-32.2]],24);await sleep(5500);follow=null;
setClock('02:58');await sub('','店员走了。现在，这里归你了。',2400);
await fade(1,700);setCam([3.2,1.6,-2.6],[0,1.6,-2.6]);toPlay(Math.PI/2,0);await fade(0,900);
tk();setObj('整理店内：捡起地上的饮料');
await allP;setObj('');await sleep(2500);
setClock('03:12');cmode='cine';bars(1);follow=null;ct.set(px-Math.sin(yaw)*5,1.5,pz-Math.cos(yaw)*5);cp.set(px,1.6,pz);
pan([px,1.6,pz],[-2.4,1.4,-5],1.2);chime();await sub('','——叮咚。',1500);
await girlScene();
toPlay(Math.PI/2,-.2);items.forEach(b=>mkIt(b,'扫码',()=>{b.visible=false;b.userData.it.on=false;beep(1500,.12);nsc++;setObj('为顾客扫码结账 '+nsc+'/3');if(nsc==3)scanR()}).on=true);setObj('为顾客扫码结账 0/3');
await new Promise(r=>scanR=r);setObj('');await sleep(500);
await payScene();
await fade(1,900);setCam([3.2,1.6,-2.6],[0,1.6,-2.6]);toPlay(Math.PI/2,0);await fade(0,900);await chap2()}
let scanR;
const keys={};addEventListener('keydown',e=>{keys[e.code]=1;if(e.code=='KeyE')act()});addEventListener('keyup',e=>keys[e.code]=0);
let sid=null,lid=null,sx=0,sy=0,s2={x:0,y:0},lx=0,ly=0;const STR=$('st'),KN=$('kn');
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);if(e.pointerType=='touch'&&e.clientX<innerWidth*.45){sid=e.pointerId;sx=e.clientX;sy=e.clientY;if(cmode=='play'){STR.style.cssText='display:block;left:'+sx+'px;top:'+sy+'px';KN.style.cssText='display:block;left:'+sx+'px;top:'+sy+'px'}}else{lid=e.pointerId;lx=e.clientX;ly=e.clientY}});
cv.addEventListener('pointermove',e=>{if(e.pointerId==sid){const dx=Math.max(-48,Math.min(48,e.clientX-sx)),dy=Math.max(-48,Math.min(48,e.clientY-sy));s2.x=dx/48;s2.y=-dy/48;KN.style.left=sx+dx+'px';KN.style.top=sy+dy+'px'}else if(e.pointerId==lid&&cmode=='play'){yaw-=(e.clientX-lx)*.0045;pit=Math.max(-1.2,Math.min(1.2,pit-(e.clientY-ly)*.0045));lx=e.clientX;ly=e.clientY}});
const up=e=>{if(e.pointerId==sid){sid=null;s2.x=s2.y=0;STR.style.display=KN.style.display='none'}if(e.pointerId==lid)lid=null};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
const ray=new THREE.Raycaster(),EB=$('E');let cur=null;const act=()=>{if(cur&&cmode=='play'&&!NOTEOPEN)cur.fn()};EB.onclick=act;
const ok=(x,z)=>{if(x<-100||x>100||z<-100||z>40)return false;const L=gY(x,z)<-1.4?1:0;if(OB.some(o=>(o[4]==2||o[4]==L)&&x>o[0]-.18&&x<o[1]+.18&&z>o[2]-.18&&z<o[3]+.18))return false;
if(dl&&dr&&Math.abs(z+4.95)<.3&&[dl,dr].some(p=>x>p.position.x-.43&&x<p.position.x+.43))return false;return true};
function size(){R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}addEventListener('resize',size);
let last=performance.now();
function loop(n){requestAnimationFrame(loop);const dt=Math.min((n-last)/1000,.05);last=n;
for(let i=movers.length-1;i>=0;i--){const m=movers[i],c=m.ch,dx=m.x-c.position.x,dz=m.z-c.position.z,d=Math.hypot(dx,dz);
if(d<.06){swing(c,0);movers.splice(i,1);m.r();continue}c.position.x+=dx/d*m.sp*dt;c.position.z+=dz/d*m.sp*dt;c.rotation.y=Math.atan2(dx,dz);c.t+=dt*7;swing(c,Math.sin(c.t)*.6)}
for(let i=anims.length-1;i>=0;i--){const a=anims[i];a.t+=dt;a.f(Math.min(a.t/a.s,1));if(a.t>=a.s){anims.splice(i,1);a.r()}}
for(const d of DOORS){if(d.lock)continue;d.a+=((Math.hypot(px-d.x,pz-d.z)<1.8?1:0)-d.a)*Math.min(1,dt*5);d.g.rotation.y=d.s*1.5*d.a}DT=dt;TICK.forEach(f=>f());lts.forEach((l,i)=>l.intensity=POW?(i==1&&Math.random()<.01?.15:.55):0);
if(cmode=='play'){const f=(keys.KeyW?1:0)-(keys.KeyS?1:0)+s2.y,r=(keys.KeyD?1:0)-(keys.KeyA?1:0)+s2.x;
const nx=px+(-Math.sin(yaw)*f+Math.cos(yaw)*r)*2.1*dt*(NOTEOPEN?0:1),nz=pz+(-Math.cos(yaw)*f-Math.sin(yaw)*r)*2.1*dt*(NOTEOPEN?0:1);if(ok(nx,pz))px=nx;if(ok(px,nz))pz=nz;
PY+=(gY(px,pz)-PY)*Math.min(1,dt*12);cam.position.set(px,1.6+PY+Math.sin(WB)*.022*WS*ST.bob,pz);cam.rotation.set(pit,yaw,Math.sin(WB*.5)*.004*WS*ST.bob)}
else{if(follow)ct.set(follow.position.x,1.3,follow.position.z);cam.position.copy(cp);cam.lookAt(ct)}
let best=null,bd=99;for(const m of its){if(m.userData.it.on&&m.visible){const d=Math.hypot(m.getWorldPosition(new THREE.Vector3()).x-px,m.getWorldPosition(new THREE.Vector3()).z-pz);if(d<bd){bd=d;best=m}}}
beacon.visible=cmode=='play'&&!!best;if(best){const w=best.getWorldPosition(new THREE.Vector3());beacon.position.set(w.x,w.y+.45+Math.sin(n/300)*.05,w.z);beacon.rotation.y=n/400}
ray.setFromCamera({x:0,y:0},cam);const hit=cmode=='play'?ray.intersectObjects(its.filter(m=>m.userData.it.on&&m.visible),false)[0]:null;
cur=hit&&hit.distance<2.6?hit.object.userData.it:null;$('hint').textContent=cur?cur.label:'';EB.style.display=cur?'block':'none';
R.render(scene,cam)}
loadAll().then(()=>{build();size();applySet();requestAnimationFrame(loop);const b=$('go');b.disabled=false;b.textContent='开始';
b.onclick=()=>{AC=new(window.AudioContext||window.webkitAudioContext)();startAmb();applySet();$('ov').style.display='none';const e=document.documentElement;try{e.requestFullscreen().then(()=>screen.orientation.lock('landscape')).catch(()=>{})}catch(_){}story()}});
