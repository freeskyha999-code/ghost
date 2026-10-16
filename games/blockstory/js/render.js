"use strict";
/* ============ 4. 渲染器 / 玩家 / 射线 ============ */
const cv=$("c"),renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(72,1,.05,200);camera.rotation.order="YXZ";
scene.background=new THREE.Color(0x8fc6ff);scene.fog=new THREE.Fog(0x8fc6ff,40,110);
const clouds=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(12+Math.random()*14,1.5,8+Math.random()*10),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,fog:false}));m.position.set(Math.random()*220-46,HT+6,Math.random()*220-46);scene.add(m);clouds.push(m)}
/* 太阳/月亮光源 + 半球天光 + 映射天空穹顶（渐变、日落橙、太阳月亮、星空） */
const LS=new THREE.DirectionalLight(0xffffff,2),HL=new THREE.HemisphereLight(0x88aaff,0x5a4a38,.7),C2=new THREE.Color(),CC=new THREE.Color(),TD={t:.15,run:true,len:480};
LS.castShadow=true;LS.shadow.mapSize.set(2048,2048);{const k=LS.shadow.camera;k.left=k.bottom=-45;k.right=k.top=45;k.near=1;k.far=220}LS.shadow.bias=-.001;LS.shadow.normalBias=.12;scene.add(LS,LS.target,HL);
const SKY=new THREE.Mesh(new THREE.SphereGeometry(150,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color()},bot:{value:new THREE.Color()},sd:{value:new THREE.Vector3()},sc:{value:new THREE.Color()},ns:{value:0}},
 vertexShader:"varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:"varying vec3 p;uniform vec3 top,bot,sd,sc;uniform float ns;float h(vec3 v){return fract(sin(dot(v,vec3(12.9,78.2,37.7)))*43758.5);}void main(){vec3 d=normalize(p);float y=max(d.y,0.);vec3 c=mix(bot,top,pow(y,.55));float s=max(dot(d,normalize(sd)),0.),m=max(dot(d,-normalize(sd)),0.);c+=sc*pow(s,12.)*.35;c+=step(.9975,h(floor(d*180.)))*ns*smoothstep(0.,.3,d.y);gl_FragColor=vec4(c,1.);}"}));
SKY.renderOrder=-1;SKY.frustumCulled=false;scene.add(SKY);
/* 后处理：HDR 多重采样渲染 → 泛光(Bloom) → 体积光(God Rays) + ACES 色调映射 + 调色 + 暗角。不支持 HDR 的设备自动降级 */
const GR={uniforms:{tDiffuse:{value:null},sun:{value:new THREE.Vector2(.5,.5)},ray:{value:0},ex:{value:1}},
 vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 sun;uniform float ray,ex;varying vec2 v;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec3 c=texture2D(tDiffuse,v).rgb;
 if(ray>0.){vec2 d=(sun-v)*.032;vec2 p=v;float w=1.;vec3 a=vec3(0.);for(int i=0;i<28;i++){p+=d;vec3 s=texture2D(tDiffuse,p).rgb;a+=s*smoothstep(.9,2.5,dot(s,vec3(.3,.6,.1)))*w;w*=.95;}c+=a*ray*.06*vec3(1.,.82,.55);}
 c=aces(c*ex);float l=dot(c,vec3(.3,.6,.1));c=mix(vec3(l),c,1.1);
 c*=1.-.4*smoothstep(.35,.95,length(v-.5)*1.25);
 gl_FragColor=vec4(pow(c,vec3(1./2.2)),1.);}`};
const hdr=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float'),RTc=renderer.capabilities.isWebGL2?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget;
COMP=new THREE.EffectComposer(renderer,new RTc(innerWidth,innerHeight,{type:hdr?THREE.HalfFloatType:THREE.UnsignedByteType,format:THREE.RGBAFormat}));
COMP.setPixelRatio&&COMP.setPixelRatio(renderer.getPixelRatio());
const BL=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.55,.8,1),FX=new THREE.ShaderPass(GR);FX.renderToScreen=true;
COMP.addPass(new THREE.RenderPass(scene,camera));COMP.addPass(BL);COMP.addPass(FX);COMP.setSize(innerWidth,innerHeight);
function sky(dt){if(TD.run)TD.t=(TD.t+dt/TD.len)%1;const a=TD.t*6.2832,e=Math.sin(a),dir=new THREE.Vector3(Math.cos(a),e,.35).normalize(),d=clamp((e+.1)/.3,0,1),dk=clamp(1-Math.abs(e)/.3,0,1),u=SKY.material.uniforms;
 u.top.value.set(0x03060f).lerp(C2.set(0x3a78d8),d);u.bot.value.set(0x0b1226).lerp(C2.set(0xb7d6f5),d).lerp(C2.set(0xff8a4a),dk*.75);
 u.sc.value.set(0xfff1d0).lerp(C2.set(0xff7a30),dk);u.sd.value.copy(dir);u.ns.value=1-d;
 const up=e>=0,sdr=up?dir.clone():dir.clone().negate();if(sdr.y<.3){sdr.y=.3;sdr.normalize()}LS.position.copy(P.p).addScaledVector(sdr,90);LS.target.position.copy(P.p);
 LS.intensity=up?2.2*clamp(e*3,0,1):.28*clamp(-e*3,0,1);LS.color.set(up?0xfff0dd:0x8fa8ff);if(up)LS.color.lerp(C2.set(0xff8c4a),dk);
 HL.intensity=.28+.7*d;HL.color.copy(u.top.value);scene.fog.color.copy(u.bot.value).convertSRGBToLinear();
 CC.set(0xffffff).lerp(C2.set(0x2a3566),1-d).lerp(C2.set(0xffa070),dk*.5).convertSRGBToLinear();for(const m of clouds)m.material.color.copy(CC);
 u.top.value.convertSRGBToLinear();u.bot.value.convertSRGBToLinear();u.sc.value.convertSRGBToLinear();
 if(SUNM){SUNM.position.copy(camera.position).addScaledVector(dir,115);SUNM.lookAt(camera.position);SUNM.visible=dir.y>-.15;MOONM.position.copy(camera.position).addScaledVector(dir,-115);MOONM.lookAt(camera.position);MOONM.visible=dir.y<.15}
 camera.updateMatrixWorld();const sp=dir.clone().multiplyScalar(100).add(camera.position).project(camera);FX.uniforms.sun.value.set(sp.x*.5+.5,sp.y*.5+.5);
 FX.uniforms.ray.value=up&&sp.z<1?.5*clamp(e*3,0,1)*clamp(1.6-Math.max(Math.abs(sp.x),Math.abs(sp.y)),0,1):0;FX.uniforms.ex.value=1+(1-d)*.6}
Atlas.init();Atlas.tex.encoding=THREE.sRGBEncoding;const MAT=new THREE.MeshStandardMaterial({map:Atlas.tex,vertexColors:true,alphaTest:.5,roughness:1,metalness:0});
/* 顶点光照通道 lt=(天空光,方块光)：天空光压暗遮蔽处的环境光，方块光(灯笼)作为暖色自发光 */
MAT.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace("#include <common>","#include <common>\nattribute vec2 lt;varying vec2 vLt;").replace("#include <begin_vertex>","#include <begin_vertex>\nvLt=lt;");
 s.fragmentShader=s.fragmentShader.replace("#include <common>","#include <common>\nvarying vec2 vLt;").replace("#include <color_fragment>","#include <color_fragment>\nvec3 alb=diffuseColor.rgb;diffuseColor.rgb*=mix(.2,1.,vLt.x);").replace("#include <emissivemap_fragment>","#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.68,.34)*pow(vLt.y,1.7)*2.6*alb;")};
const hl=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004,1.004,1.004)),new THREE.LineBasicMaterial({color:0}));hl.visible=false;scene.add(hl);
var COMP;function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();COMP&&COMP.setSize(innerWidth,innerHeight)}addEventListener("resize",resize);resize();

const P={p:new THREE.Vector3(64.5,11,70.5),v:new THREE.Vector3(),yaw:0,pitch:0,g:false,sel:3};
const hit=p=>{for(let x=Math.floor(p.x-.3);x<=Math.floor(p.x+.3);x++)for(let y=Math.floor(p.y);y<=Math.floor(p.y+1.79);y++)for(let z=Math.floor(p.z-.3);z<=Math.floor(p.z+.3);z++)if(W.get(x,y,z))return true;return false};
function pick(o,d,max=5.5){let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z),px=x,py=y,pz=z;const sx=d.x>0?1:-1,sy=d.y>0?1:-1,sz=d.z>0?1:-1,
 dx=d.x?Math.abs(1/d.x):Infinity,dy=d.y?Math.abs(1/d.y):Infinity,dz=d.z?Math.abs(1/d.z):Infinity;
 let tx=d.x?(sx>0?x+1-o.x:o.x-x)*dx:Infinity,ty=d.y?(sy>0?y+1-o.y:o.y-y)*dy:Infinity,tz=d.z?(sz>0?z+1-o.z:o.z-z)*dz:Infinity,t=0;
 while(t<=max){if(W.get(x,y,z))return{x,y,z,px,py,pz};px=x;py=y;pz=z;
  if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=dx}else if(ty<tz){y+=sy;t=ty;ty+=dy}else{z+=sz;t=tz;tz+=dz}}return null}
const fwd=()=>({x:-Math.sin(P.yaw),z:-Math.cos(P.yaw)});
let target=null;
const CUBE=new THREE.BoxGeometry(.12,.12,.12);
const PT={a:[],burst(x,y,z,id){const k=Atlas.idx[B[id].t[1]||B[id].t[0]],d=Atlas.ctx.getImageData(k%N*T+4,(k/N|0)*T+8,1,1).data;
 for(let i=0;i<10;i++){const m=new THREE.Mesh(CUBE,new THREE.MeshBasicMaterial({color:(d[0]<<16)|(d[1]<<8)|d[2]}));m.position.set(x+.5+(Math.random()-.5)*.6,y+.5+(Math.random()-.5)*.6,z+.5+(Math.random()-.5)*.6);m.v=new THREE.Vector3((Math.random()-.5)*4,Math.random()*4,(Math.random()-.5)*4);m.life=.7;scene.add(m);this.a.push(m)}},
 update(dt){for(let i=this.a.length-1;i>=0;i--){const m=this.a[i];m.life-=dt;m.v.y-=14*dt;m.position.addScaledVector(m.v,dt);m.scale.setScalar(Math.max(.01,m.life*1.4));if(m.life<=0){scene.remove(m);m.material.dispose();this.a.splice(i,1)}}}};
function breakBlock(){if(!target)return;const id=W.get(target.x,target.y,target.z),n=B[id].n;PT.burst(target.x,target.y,target.z,id);W.set(target.x,target.y,target.z,0);snd.dig(n);S.emit("break:"+n);S.emit("break")}
function placeBlock(){if(!target)return;const id=P.sel+1;W.set(target.px,target.py,target.pz,id);if(hit(P.p)){W.set(target.px,target.py,target.pz,0);return}snd.dig(B[id].n);S.emit("place:"+B[id].n)}
function interact(){if(ED.on)return false;const n=NPC.near();if(n&&!S.busy){S.emit("talk:"+n.id);return true}return false}
