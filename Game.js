'use strict';
/* LEGENDS OF AETHERIA — modules: Audio, World, Player, Enemies, FX, Quests, UI, Loop */
const $=i=>document.getElementById(i),R=Math.random,TAU=Math.PI*2,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const mobile=/Android|iPhone|iPad/i.test(navigator.userAgent)||('ontouchstart' in window&&innerWidth<1000);
if(mobile)document.body.classList.add('mob');
const S={vol:.5,sens:1,shadow:!mobile};

/* ===== Audio ===== */
const Sfx={c:null,t(f,d=.12,ty='square',v=.12,s=0){try{this.c=this.c||new(window.AudioContext||window.webkitAudioContext)();const c=this.c,o=c.createOscillator(),g=c.createGain(),n=c.currentTime;o.type=ty;o.frequency.setValueAtTime(f,n);if(s)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+s),n+d);g.gain.setValueAtTime(v*S.vol,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(c.destination);o.start();o.stop(n+d)}catch(e){}},
 hit(){this.t(220,.1,'sawtooth',.12,-120)},swing(){this.t(500,.1,'triangle',.08,-300)},coin(){this.t(880,.1,'sine');setTimeout(()=>this.t(1320,.15,'sine'),80)},
 skill(){this.t(300,.35,'sawtooth',.14,500)},ult(){this.t(120,.8,'sawtooth',.2,600)},lvl(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.t(f,.2,'sine',.15),i*110))},hurt(){this.t(150,.2,'square',.15,-80)}};

/* ===== Renderer ===== */
const ren=new THREE.WebGLRenderer({canvas:$('c'),antialias:!mobile});
ren.setPixelRatio(Math.min(devicePixelRatio,2));ren.shadowMap.enabled=S.shadow;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(60,1,.1,500);
scene.fog=new THREE.Fog(0x7ec8ff,70,230);
const sun=new THREE.DirectionalLight(0xffffff,1);sun.castShadow=S.shadow;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,far:220});scene.add(sun,sun.target);
const hemi=new THREE.HemisphereLight(0xbfe0ff,0x4a6a3a,.6);scene.add(hemi);
function resize(){ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

/* ===== World ===== */
const hgt=(x,z)=>{const d=Math.hypot(x,z),m=clamp((d-22)/25,0,1);let h=m*(Math.sin(x*.04)*3+Math.cos(z*.05)*3+Math.sin((x+z)*.11)*1.2);
 const r=Math.abs(x-(45+Math.sin(z*.03)*14));if(r<9){const k=clamp((9-r)/6,0,1);h=h*(1-k)+(-3)*k}
 return h+Math.pow(Math.max(0,d-100),2)*.02};
let seed=7;const SR=()=>(seed=seed*16807%2147483647)/2147483647;
const M=(c,e=0,o={})=>new THREE.MeshLambertMaterial(Object.assign({color:c,emissive:e},o));
const obst=[],land=(d0,d1,a=-.4,b=11)=>{for(let i=0;i<80;i++){const an=SR()*TAU,d=d0+SR()*(d1-d0),x=Math.cos(an)*d,z=Math.sin(an)*d,h=hgt(x,z);if(h>a&&h<b)return{x,z}}return{x:d0,z:0}};
const put=(o,x,z,y=0)=>{o.position.set(x,hgt(x,z)+y,z);scene.add(o);return o};
const Wd={windows:[],clouds:[],chests:[],npcs:[]};
(function buildWorld(){
 const g=new THREE.PlaneGeometry(300,300,130,130);g.rotateX(-Math.PI/2);const p=g.attributes.position,cl=[];
 for(let i=0;i<p.count;i++){const h=hgt(p.getX(i),p.getZ(i)),n=SR()*.07;p.setY(i,h);cl.push(...(h<-.8?[.8,.72,.45]:h<7?[.25+n,.55+n,.2]:h<16?[.45,.43,.4]:[.95,.95,1]))}
 g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();
 const gr=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));gr.receiveShadow=true;scene.add(gr);
 const w=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshPhongMaterial({color:0x2a8fe0,transparent:true,opacity:.7,shininess:100,specular:0x88ccff}));w.rotation.x=-Math.PI/2;w.position.y=-1.2;scene.add(w);
 // trees
 const trunk=new THREE.CylinderGeometry(.25,.35,2,6),cone=new THREE.ConeGeometry(1.6,3.2,7),tm=M(0x6b4a2b),lm=[0x2f8f4a,0x3aa655,0x277a45].map(c=>M(c));
 for(let i=0;i<190;i++){const q=land(24,125,-.3,12),t=new THREE.Group(),a=new THREE.Mesh(trunk,tm),b=new THREE.Mesh(cone,lm[i%3]),c=new THREE.Mesh(cone,lm[i%3]);
  b.position.y=2.6;c.position.y=3.9;c.scale.setScalar(.7);a.position.y=1;b.castShadow=c.castShadow=true;t.add(a,b,c);t.scale.setScalar(.8+SR()*.9);put(t,q.x,q.z);obst.push({x:q.x,z:q.z,r:.7})}
 // rocks
 for(let i=0;i<50;i++){const q=land(20,130,-.4,18),s=.6+SR()*1.6,r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),M(0x8a8f98));r.castShadow=true;r.rotation.set(SR()*3,SR()*3,0);put(r,q.x,q.z,s*.4);obst.push({x:q.x,z:q.z,r:s*.9})}
 // flowers
 const fl=new THREE.InstancedMesh(new THREE.SphereGeometry(.14,5,4),M(0xffffff,0x222222),350),m4=new THREE.Matrix4(),col=new THREE.Color();
 for(let i=0;i<350;i++){const q=land(8,110,0,6);m4.setPosition(q.x,hgt(q.x,q.z)+.2,q.z);fl.setMatrixAt(i,m4);fl.setColorAt(i,col.setHSL(SR(),.8,.65))}scene.add(fl);
 // village
 const wallM=M(0xf3e6c8),roofM=M(0x2a62c9),winM=M(0xffe9a0,0xffcc55);
 for(let i=0;i<6;i++){const a=i/6*TAU+.3,x=Math.cos(a)*15,z=Math.sin(a)*15,h=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(5,3.4,5),wallM),r=new THREE.Mesh(new THREE.ConeGeometry(4.4,2.6,4),roofM),wn=new THREE.Mesh(new THREE.PlaneGeometry(1,1),winM);
  r.position.y=3.4+1.3;r.rotation.y=Math.PI/4;b.position.y=1.7;wn.position.set(0,1.8,2.51);b.castShadow=r.castShadow=true;h.add(b,r,wn);h.rotation.y=-a+Math.PI/2+Math.PI;put(h,x,z);obst.push({x,z,r:3.6});Wd.windows.push(winM)}
 const f=new THREE.Group(),cry=new THREE.Mesh(new THREE.OctahedronGeometry(1.1),M(0x66ccff,0x3399ff));cry.position.y=3;f.add(new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.4,.8,12),M(0xbbbbcc)),cry);
 const pl=new THREE.PointLight(0x66ccff,1.5,25);pl.position.y=3;f.add(pl);put(f,0,0);obst.push({x:0,z:0,r:2.6});Wd.crystal=cry;
 // chests
 for(let i=0;i<9;i++){const q=land(30,118),c=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(1.2,.7,.8),M(0x7a4a22)),l=new THREE.Mesh(new THREE.BoxGeometry(1.25,.35,.85),M(0xf2c14e,0x553300)),bm=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,12,6),new THREE.MeshBasicMaterial({color:0xffe38a,transparent:true,opacity:.35,fog:false}));
  b.position.y=.35;l.position.y=.85;bm.position.y=6;b.castShadow=true;c.add(b,l,bm);put(c,q.x,q.z);Wd.chests.push({id:i,g:c,x:q.x,z:q.z,open:false,beam:bm})}
 // sky
 for(let i=0;i<16;i++){const c=new THREE.Group();for(let j=0;j<5;j++){const s=new THREE.Mesh(new THREE.SphereGeometry(5+SR()*5,8,6),M(0xffffff,0x555555,{transparent:true,opacity:.9}));s.position.set(j*7,SR()*3,SR()*5);s.scale.y=.5;c.add(s)}
  c.position.set(SR()*400-200,50+SR()*30,SR()*400-200);scene.add(c);Wd.clouds.push(c)}
 const sp=[];for(let i=0;i<500;i++){const a=SR()*TAU,b=SR()*1.4,r=300;sp.push(Math.cos(a)*Math.cos(b)*r,Math.sin(b)*r,Math.sin(a)*Math.cos(b)*r)}
 Wd.stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(sp,3)),new THREE.PointsMaterial({size:1.5,color:0xffffff,transparent:true,fog:false}));scene.add(Wd.stars);
 Wd.sun=new THREE.Mesh(new THREE.SphereGeometry(10,12,8),new THREE.MeshBasicMaterial({color:0xfff2b0,fog:false}));Wd.moon=new THREE.Mesh(new THREE.SphereGeometry(7,12,8),new THREE.MeshBasicMaterial({color:0xdde8ff,fog:false}));scene.add(Wd.sun,Wd.moon);
})();
let tod=.28;const skyC=new THREE.Color(),DAY=new THREE.Color(0x7ec8ff),DUSK=new THREE.Color(0xff8f5a),NIGHT=new THREE.Color(0x0a1030);
function updateSky(dt){tod=(tod+dt/300)%1;const a=tod*TAU,sy=Math.sin(a),sx=Math.cos(a),day=clamp((sy+.1)/.5,0,1),dusk=Math.max(0,1-Math.abs(sy)*4);
 skyC.copy(NIGHT).lerp(DAY,day).lerp(DUSK,dusk*.7);scene.background=skyC;scene.fog.color.copy(skyC);
 const c=P.pos;sun.target.position.copy(c);sun.position.set(c.x+sx*80,Math.abs(sy)*80+10,c.z+30);sun.intensity=clamp(sy*1.4,.08,1.1);sun.color.setHSL(.1,dusk*.6,.9);
 hemi.intensity=.18+.5*day;Wd.stars.material.opacity=1-day;Wd.stars.position.copy(cam.position);
 Wd.sun.position.set(cam.position.x+sx*350,sy*350,cam.position.z+60);Wd.moon.position.set(cam.position.x-sx*350,-sy*350,cam.position.z+60);
 Wd.windows[0]&&(Wd.windows[0].emissiveIntensity=1.2-day);Wd.crystal.rotation.y+=dt;Wd.crystal.position.y=3+Math.sin(performance.now()/600)*.3;
 for(const k of Wd.clouds){k.position.x+=dt*1.5;if(k.position.x>220)k.position.x=-220}}

/* ===== Characters ===== */
function buildChar(coat,hair){const g=new THREE.Group(),sk=M(0xffd9c2),cm=M(coat),gold=M(0xf2c14e,0x3a2a00),hm=M(hair),dk=M(0x223355),add=(m,x,y,z,p=g)=>{m.position.set(x,y,z);m.castShadow=true;p.add(m);return m},B=(w,h,d,mat)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 add(new THREE.Mesh(new THREE.CylinderGeometry(.36,.3,.85,8),cm),0,1.2,0);add(new THREE.Mesh(new THREE.CylinderGeometry(.34,.62,.5,8),M(0xffffff)),0,.78,0);add(new THREE.Mesh(new THREE.TorusGeometry(.46,.05,6,12),gold),0,.95,0).rotation.x=Math.PI/2;
 add(new THREE.Mesh(new THREE.SphereGeometry(.38,12,10),sk),0,1.95,0);add(new THREE.Mesh(new THREE.SphereGeometry(.42,12,10),hm),0,2.03,-.06).scale.y=.9;
 for(let i=-1;i<=1;i++)add(new THREE.Mesh(new THREE.ConeGeometry(.12,.45,5),hm),i*.18,2.45,.05).rotation.z=-i*.4;
 for(const s of[-1,1])add(new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),M(0x4488ff,0x2255ff)),s*.14,1.95,.34);
 const mk=(x,y,h,w)=>{const p=new THREE.Group();p.position.set(x,y,0);g.add(p);const l=B(w,h,w,w>.19?cm:dk);l.position.y=-h/2;l.castShadow=true;p.add(l);return p};
 const armL=mk(-.5,1.5,.7,.18),armR=mk(.5,1.5,.7,.18),legL=mk(-.18,.6,.6,.2),legR=mk(.18,.6,.6,.2);
 const cape=new THREE.Group();cape.position.set(0,1.55,-.3);g.add(cape);add(B(.7,.95,.05,M(0x1e48a8,0x081a44)),0,-.5,0,cape);
 const blade=B(.07,1.1,.14,M(0xffffff,0x66aaff));blade.position.set(0,-.9,.3);armR.add(blade);g.userData={armL,armR,legL,legR,cape,blade};return g}
const P={pos:new THREE.Vector3(0,0,8),vy:0,face:0,hp:100,maxhp:100,st:100,en:0,lvl:1,exp:0,coins:0,el:0,cd:{a:0,e:0},atkT:0,ground:true,inv:{potion:2},dead:0,run:false,atk:13};
const hero=buildChar(0x2a62c9,0xe8f2ff);scene.add(hero);
const ELEM=[{n:'Api',c:0xff5522,s:'Ledakan Ember'},{n:'Air',c:0x33aaff,s:'Gelombang Mirae'},{n:'Angin',c:0x9dffd0,s:'Pusaran Zephyra'},{n:'Petir',c:0xffe844,s:'Sambaran Voltra'}];
const need=l=>50*l,maxHpOf=l=>100+20*(l-1);
function setEl(i){P.el=i;hero.userData.blade.material.emissive.setHex(ELEM[i].c)}setEl(0);

/* ===== Particles & FX ===== */
const NP=900,pP=new Float32Array(NP*3),pC=new Float32Array(NP*3),pB=new Float32Array(NP*3),pV=new Float32Array(NP*3),pL=new Float32Array(NP),pM=new Float32Array(NP).fill(1);let pi=0;
pP.fill(-999);const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pP,3));pg.setAttribute('color',new THREE.BufferAttribute(pC,3));
scene.add(Object.assign(new THREE.Points(pg,new THREE.PointsMaterial({size:.45,vertexColors:true,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})),{frustumCulled:false}));
const _c=new THREE.Color();
function spark(x,y,z,col,n=10,sp=4,life=.7,up=1){_c.setHex(col);for(let k=0;k<n;k++){const i=pi=(pi+1)%NP;pP.set([x,y,z],i*3);pV.set([(R()-.5)*sp,R()*sp*.8*up+up,(R()-.5)*sp],i*3);pB.set([_c.r,_c.g,_c.b],i*3);pL[i]=pM[i]=life*(.5+R()*.5)}}
function updParticles(dt){for(let i=0;i<NP;i++){if(pL[i]<=0)continue;pL[i]-=dt;const f=Math.max(0,pL[i]/pM[i]);pP[i*3]+=pV[i*3]*dt;pP[i*3+1]+=pV[i*3+1]*dt;pP[i*3+2]+=pV[i*3+2]*dt;pV[i*3+1]-=6*dt;
 pC[i*3]=pB[i*3]*f;pC[i*3+1]=pB[i*3+1]*f;pC[i*3+2]=pB[i*3+2]*f;if(pL[i]<=0)pP[i*3+1]=-999}pg.attributes.position.needsUpdate=pg.attributes.color.needsUpdate=true}
const fx=[];
function addFx(m,life,upd,end){if(m)scene.add(m);fx.push({m,life,t:0,upd,end})}
function updFx(dt){for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t+=dt;f.upd&&f.upd(f.t/f.life,dt,f);if(f.t>=f.life){f.m&&scene.remove(f.m);f.end&&f.end();fx.splice(i,1)}}}
function ring(x,z,col,r,life,cb){const m=new THREE.Mesh(new THREE.RingGeometry(.85,1,32),new THREE.MeshBasicMaterial({color:col,transparent:true,side:2,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,hgt(x,z)+.3,z);
 addFx(m,life,k=>{m.scale.setScalar(Math.max(.1,r*k));m.material.opacity=1-k*.8},cb)}
function pillar(x,z,col,h=30,r=.5,life=.4){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8,side:2,blending:THREE.AdditiveBlending}));m.position.set(x,hgt(x,z)+h/2,z);addFx(m,life,k=>m.material.opacity=.8*(1-k))}
function floatTxt(pos,txt,col='#fff'){const v=pos.clone().project(cam);if(v.z>1)return;const d=document.createElement('div');d.className='dn';d.textContent=txt;d.style.color=col;d.style.left=(v.x*.5+.5)*innerWidth+'px';d.style.top=(-v.y*.5+.5)*innerHeight+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),900)}
const hex=c=>'#'+c.toString(16).padStart(6,'0');

/* ===== Enemies ===== */
const ET={slime:{name:'Slime Embun',hp:40,spd:3,dmg:6,exp:20,range:1.8,cdn:1.4,col:0x55e0a0},stalker:{name:'Penguntit Hutan',hp:90,spd:5,dmg:12,exp:45,range:2.2,cdn:1.1,col:0x7a5a2a},boss:{name:'Gloomroot Colossus',hp:800,spd:3.2,dmg:26,exp:400,range:5,cdn:1.6,col:0x9a44ff}};
const enemies=[];
function mkBar(w){const g=new THREE.Group(),a=new THREE.Mesh(new THREE.PlaneGeometry(w,.16),new THREE.MeshBasicMaterial({color:0x111111,depthTest:false,transparent:true})),b=new THREE.Mesh(new THREE.PlaneGeometry(w,.16),new THREE.MeshBasicMaterial({color:0xff4455,depthTest:false}));b.position.z=.01;a.renderOrder=998;b.renderOrder=999;g.add(a,b);g.fg=b;g.w=w;return g}
function spawnEnemy(t,x,z){const d=ET[t],g=new THREE.Group();
 if(t==='slime'){const b=new THREE.Mesh(new THREE.SphereGeometry(.9,12,10),M(d.col,0x118855,{transparent:true,opacity:.85}));b.scale.y=.75;b.position.y=.65;g.add(b);for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.1,6,6),M(0x113322));e.position.set(s*.3,.85,.78);g.add(e)}}
 else if(t==='stalker'){const b=new THREE.Mesh(new THREE.OctahedronGeometry(.9),M(d.col));b.position.y=1.1;b.scale.y=1.2;g.add(b);for(const s of[-1,1]){const a=new THREE.Mesh(new THREE.ConeGeometry(.1,.8,5),M(0x4a3a1a));a.position.set(s*.4,2.2,0);a.rotation.z=-s*.4;g.add(a);const e=new THREE.Mesh(new THREE.SphereGeometry(.1,6,6),M(0xff2222,0xff0000));e.position.set(s*.3,1.3,.65);g.add(e)}}
 else{const b=new THREE.Mesh(new THREE.CylinderGeometry(1.4,2,5,8),M(0x4a3320));b.position.y=2.5;g.add(b);const c=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),M(0xbb66ff,0xaa44ff));c.position.set(0,3,1.5);g.add(c);for(let i=0;i<5;i++){const a=new THREE.Mesh(new THREE.CylinderGeometry(.2,.4,4,5),M(0x3a2814));a.position.set(Math.cos(i*1.26)*2,4.5,Math.sin(i*1.26)*2);a.rotation.set(Math.sin(i*1.26)*.7,0,-Math.cos(i*1.26)*.7);g.add(a)}}
 g.traverse(o=>o.castShadow=true);const bar=mkBar(t==='boss'?4:1.4);scene.add(g,bar);
 const e={t,def:d,g,bar,x,z,hx:x,hz:z,hp:d.hp,max:d.hp,cd:1,stun:0,burn:0,bt:0,wt:0,wa:0,wm:false,sl:5,dead:false};enemies.push(e);return e}
function respawn(e){e.dead=false;e.hp=e.max;e.x=e.hx;e.z=e.hz;e.g.visible=true;e.bar.visible=true}
function dmgEnemy(e,dmg,col,silent){if(e.dead)return;dmg=Math.round(dmg);e.hp-=dmg;floatTxt(e.g.position.clone().add(new THREE.Vector3(0,2.5,0)),dmg,hex(col));spark(e.x,e.g.position.y+1,e.z,col,6,3,.5);if(!silent){Sfx.hit();P.en=Math.min(100,P.en+(e.t==='boss'?3:6))}
 if(e.hp<=0){e.dead=true;e.g.visible=false;e.bar.visible=false;spark(e.x,e.g.position.y+1,e.z,ET[e.t].col,30,8,1);gainExp(e.def.exp);const c=5+(R()*10|0);P.coins+=c;Sfx.coin();toast('+'+c+' koin');progress('kill',e.t);if(e.t!=='boss')e.rt=25}}
function updEnemies(dt,time){for(const e of enemies){if(e.dead){if(e.rt!==undefined){e.rt-=dt;if(e.rt<=0){e.rt=undefined;respawn(e)}}continue}
 const dx=P.pos.x-e.x,dz=P.pos.z-e.z,d=Math.hypot(dx,dz)||1;e.stun-=dt;e.cd-=dt;
 if(e.burn>0){e.burn-=dt;e.bt-=dt;if(e.bt<=0){e.bt=.5;dmgEnemy(e,P.atk*.2,0xff5522,true)}if(e.dead)continue;spark(e.x,e.g.position.y+1,e.z,0xff6622,1,1,.4)}
 if(e.stun<=0){let mx=0,mz=0;if(d<22&&d>e.def.range*.8&&!P.dead){mx=dx/d;mz=dz/d}else if(d>=22){e.wt-=dt;if(e.wt<=0){e.wt=2+R()*3;e.wa=R()*TAU;e.wm=R()<.5}if(e.wm){mx=Math.cos(e.wa)*.4;mz=Math.sin(e.wa)*.4}}
  const nx=e.x+mx*e.def.spd*dt,nz=e.z+mz*e.def.spd*dt;if(hgt(nx,nz)>-1.1){e.x=nx;e.z=nz}if(mx||mz)e.g.rotation.y=Math.atan2(mx,mz);
  if(d<e.def.range&&e.cd<=0&&!P.dead){e.cd=e.def.cdn;hurtP(e.def.dmg)}
  if(e.t==='boss'){e.sl-=dt;if(e.sl<=0&&d<28){e.sl=7;const bx=e.x,bz=e.z;ring(bx,bz,0xff2222,8,1.1,()=>{if(Math.hypot(P.pos.x-bx,P.pos.z-bz)<8)hurtP(e.def.dmg*1.6);spark(bx,1,bz,0xaa44ff,40,12,1)});toast('⚠ Hentakan Akar!')}}}
 e.g.position.set(e.x,hgt(e.x,e.z)+(e.t==='slime'?Math.abs(Math.sin(time*6+e.x))*.3:0),e.z);
 const r=e.hp/e.max;e.bar.position.set(e.x,e.g.position.y+(e.t==='boss'?6.2:e.t==='stalker'?2.8:1.8),e.z);e.bar.quaternion.copy(cam.quaternion);e.bar.fg.scale.x=Math.max(.001,r);e.bar.fg.position.x=-(1-r)*e.bar.w/2}}
const nearest=(x,z,r)=>{let b=null,bd=r;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.z-z);if(d<bd){bd=d;b=e}}return b};
const inR=(x,z,r)=>enemies.filter(e=>!e.dead&&Math.hypot(e.x-x,e.z-z)<r+(e.t==='boss'?2:0));

/* ===== Combat ===== */
function hurtP(d){if(P.dead)return;P.hp-=d;Sfx.hurt();floatTxt(P.pos.clone().add(new THREE.Vector3(0,3,0)),d,'#ff7788');spark(P.pos.x,P.pos.y+1.2,P.pos.z,0xff3355,8,3,.5);
 if(P.hp<=0){P.hp=P.maxhp;const l=Math.floor(P.coins*.1);P.coins-=l;P.pos.set(0,0,8);toast('Kamu pingsan… dibawa kembali ke desa'+(l?` (−${l} koin)`:''))}}
const fwd=()=>({x:Math.sin(P.face),z:Math.cos(P.face)});
function attack(){if(P.cd.a>0||state!=='play')return;P.cd.a=.45;P.atkT=.3;Sfx.swing();const t=nearest(P.pos.x,P.pos.z,7);if(t)P.face=Math.atan2(t.x-P.pos.x,t.z-P.pos.z);
 const col=ELEM[P.el].c,pv=new THREE.Group(),m=new THREE.Mesh(new THREE.RingGeometry(1.2,2,16,1,-Math.PI/2-1.1,2.2),new THREE.MeshBasicMaterial({color:col,transparent:true,side:2,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;pv.add(m);pv.position.set(P.pos.x,P.pos.y+.9,P.pos.z);pv.rotation.y=P.face;
 addFx(pv,.25,k=>{m.material.opacity=1-k;pv.scale.setScalar(1+k*.3)});const f=fwd();
 for(const e of inR(P.pos.x+f.x*1.5,P.pos.z+f.z*1.5,3)){dmgEnemy(e,P.atk*(.8+R()*.4),col);e.x+=f.x*.5;e.z+=f.z*.5;spark(e.x,1.2,e.z,col,8,5)}}
function skill(){if(P.cd.e>0||state!=='play')return;P.cd.e=6;Sfx.skill();const el=P.el,col=ELEM[el].c,f=fwd(),px=P.pos.x,pz=P.pos.z;P.atkT=.4;
 if(el===0){const m=new THREE.Mesh(new THREE.SphereGeometry(.6,10,8),new THREE.MeshBasicMaterial({color:col}));m.position.set(px,P.pos.y+1.3,pz);let done=false;
  const boom=x=>{if(done)return;done=true;ring(x.position.x,x.position.z,col,6,.5);spark(x.position.x,x.position.y,x.position.z,col,50,10,.9);for(const e of inR(x.position.x,x.position.z,5)){dmgEnemy(e,P.atk*2.2,col);e.burn=3}};
  addFx(m,.9,(k,dt)=>{m.position.x+=f.x*24*dt;m.position.z+=f.z*24*dt;spark(m.position.x,m.position.y,m.position.z,0xff8833,2,1,.4);if(inR(m.position.x,m.position.z,1.4).length)boom(m)},()=>boom(m))}
 else if(el===1){ring(px,pz,col,8,.7);ring(px,pz,0xffffff,5,.5);spark(px,.5,pz,col,60,10,.9);for(const e of inR(px,pz,8)){dmgEnemy(e,P.atk*1.6,col);const d=Math.hypot(e.x-px,e.z-pz)||1;e.x+=(e.x-px)/d*3;e.z+=(e.z-pz)/d*3}P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.12);floatTxt(P.pos.clone().add(new THREE.Vector3(0,3,0)),'+HP','#7fffa0')}
 else if(el===2){const cx=px+f.x*6,cz=pz+f.z*6,m=new THREE.Mesh(new THREE.ConeGeometry(3,7,12,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.45,side:2,blending:THREE.AdditiveBlending}));m.rotation.x=Math.PI;m.position.set(cx,hgt(cx,cz)+3.5,cz);let tk=0;
  addFx(m,3,(k,dt)=>{m.rotation.y+=dt*12;tk+=dt;spark(cx+(R()-.5)*5,hgt(cx,cz)+R()*6,cz+(R()-.5)*5,col,2,2,.5);for(const e of inR(cx,cz,7)){const d=Math.hypot(cx-e.x,cz-e.z)||1;e.x+=(cx-e.x)/d*7*dt;e.z+=(cz-e.z)/d*7*dt}if(tk>.5){tk=0;for(const e of inR(cx,cz,4))dmgEnemy(e,P.atk*.7,col)}})}
 else{let ts=inR(px,pz,22).sort((a,b)=>Math.hypot(a.x-px,a.z-pz)-Math.hypot(b.x-px,b.z-pz)).slice(0,3);if(!ts.length){const x=px+f.x*8,z=pz+f.z*8;pillar(x,z,col,30,.3);spark(x,1,z,col,20,6)}ts.forEach((e,i)=>setTimeout(()=>{if(e.dead)return;pillar(e.x,e.z,col,35,.5);ring(e.x,e.z,col,4,.4);spark(e.x,1,e.z,col,30,8);dmgEnemy(e,P.atk*2.4,col);e.stun=1},i*150))}}
function ult(){if(P.en<100||state!=='play')return;P.en=0;Sfx.ult();const el=P.el,col=ELEM[el].c,px=P.pos.x,pz=P.pos.z;P.atkT=.6;
 pillar(px,pz,col,40,2,.9);ring(px,pz,col,14,.9);ring(px,pz,0xffffff,9,.7);spark(px,1,pz,col,150,16,1.4);
 for(const e of inR(px,pz,14)){dmgEnemy(e,P.atk*5,col);if(el===0)e.burn=5;if(el===3)e.stun=2;if(el===2){const d=Math.hypot(e.x-px,e.z-pz)||1;e.x-=(e.x-px)/d*4;e.z-=(e.z-pz)/d*4}}
 if(el===1)P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.4);if(el===3)for(let i=0;i<6;i++)setTimeout(()=>{const a=R()*TAU,r=R()*12;pillar(px+Math.cos(a)*r,pz+Math.sin(a)*r,col,35,.4);spark(px+Math.cos(a)*r,1,pz+Math.sin(a)*r,col,15,6)},i*100)}
function gainExp(n){P.exp+=n;floatTxt(P.pos.clone().add(new THREE.Vector3(0,3.5,0)),'+'+n+' EXP','#9fd4ff');while(P.exp>=need(P.lvl)){P.exp-=need(P.lvl);P.lvl++;P.maxhp=maxHpOf(P.lvl);P.hp=P.maxhp;P.atk=10+3*P.lvl;Sfx.lvl();toast('★ LEVEL '+P.lvl+'!');pillar(P.pos.x,P.pos.z,0xffe38a,25,1,.8);spark(P.pos.x,1,P.pos.z,0xffe38a,60,8,1.2)}}

/* ===== Items, NPCs, Quests ===== */
const ITEMS={potion:{n:'Ramuan Aether',i:'🧪',d:'Pulihkan 60 HP',use:()=>{P.hp=Math.min(P.maxhp,P.hp+60)}},crystal:{n:'Kristal Cahaya',i:'💎',d:'+60 EXP',use:()=>gainExp(60)},feather:{n:'Bulu Zephyr',i:'🪶',d:'Isi penuh stamina & energi 50',use:()=>{P.st=100;P.en=Math.min(100,P.en+50)}}};
const addItem=(k,n=1)=>{P.inv[k]=(P.inv[k]||0)+n};
const NPCS=[{name:'Lira',x:7,z:4,col:0xc43a8c,hair:0xffb0d8,idle:'Kristal itu tak boleh padam, Pengelana. Aku percaya padamu.'},{name:'Toma',x:-8,z:5,col:0x2e9a5a,hair:0x4a2a1a,idle:'Hutan makin gelap tiap malam. Hati-hati, ya!'}];
for(const n of NPCS){n.g=buildChar(n.col,n.hair);put(n.g,n.x,n.z);n.g.rotation.y=Math.atan2(-n.x,-n.z);n.mk=new THREE.Mesh(new THREE.OctahedronGeometry(.25),M(0xffd24a,0xffaa00));n.mk.position.set(n.x,hgt(n.x,n.z)+3.4,n.z);scene.add(n.mk);obst.push({x:n.x,z:n.z,r:.8})}
const QD=[
 {id:'q1',main:1,title:'Embun yang Resah',giver:'Lira',type:'kill',tar:'slime',need:5,rw:{exp:90,coin:60,items:{potion:2}},talk:'Slime Embun menyerbu padang rumput karena Kristal Aether retak. Kalahkan 5 slime!',done:'Terima kasih! Padang kembali tenang. Ambil ini.'},
 {id:'q2',main:1,req:'q1',title:'Peti Para Leluhur',giver:'Lira',type:'chest',need:3,rw:{exp:120,coin:100,items:{crystal:1}},talk:'Leluhur menyimpan serpihan kekuatan di peti-peti kuno. Buka 3 peti (tanda ✦ emas di peta).',done:'Serpihan itu hangat… kamu makin kuat!'},
 {id:'q3',main:1,req:'q2',title:'Sang Raksasa Akar',giver:'Lira',type:'kill',tar:'boss',need:1,rw:{exp:500,coin:500,items:{potion:3,crystal:2}},talk:'Gloomroot Colossus, penyebab retaknya Kristal, bersarang di barat laut. Kalahkan dia!',done:'Kristal Aether bersinar kembali! Kamu pahlawan Aetheria! Teruslah menjelajah.'},
 {id:'s1',title:'Bulu Penguntit',giver:'Toma',type:'kill',tar:'stalker',need:3,rw:{exp:100,coin:80,items:{feather:2}},talk:'Penguntit Hutan mengganggu pemburu. Kalahkan 3 ekor di hutan.',done:'Hebat! Bulu ini bawa keberuntungan.'},
 {id:'s2',title:'Rasa Penasaran Toma',giver:'Toma',type:'chest',need:2,rw:{exp:60,coin:40,items:{potion:1}},talk:'Aku penasaran isi peti-peti itu. Buka 2 untukku?',done:'Wah, ceritakan isinya nanti!'}];
const qs={};QD.forEach(q=>qs[q.id]={s:'new',p:0});
const avail=q=>qs[q.id].s==='new'&&(!q.req||qs[q.req].s==='done');
const ready=q=>qs[q.id].s==='active'&&qs[q.id].p>=q.need;
function progress(type,id){for(const q of QD)if(qs[q.id].s==='active'&&q.type===type&&(type==='chest'||q.tar===id)&&qs[q.id].p<q.need){qs[q.id].p++;toast(`${q.title}: ${qs[q.id].p}/${q.need}`);if(ready(q))toast('Quest selesai! Temui '+q.giver)}}
function talk(n){let q=QD.find(q=>q.giver===n.name&&ready(q));if(q){qs[q.id].s='done';gainExp(q.rw.exp);P.coins+=q.rw.coin;for(const k in q.rw.items)addItem(k,q.rw.items[k]);Sfx.coin();return panel('dlg',{n,t:q.done+`\n\nHadiah: ${q.rw.exp} EXP, ${q.rw.coin} koin`+Object.keys(q.rw.items).map(k=>`, ${q.rw.items[k]}× ${ITEMS[k].n}`).join('')})}
 q=QD.find(q=>q.giver===n.name&&avail(q));if(q){qs[q.id].s='active';toast('Quest diterima: '+q.title);return panel('dlg',{n,t:q.talk})}
 q=QD.find(q=>q.giver===n.name&&qs[q.id].s==='active');panel('dlg',{n,t:q?`Kuharap kamu berhasil: ${q.title} (${qs[q.id].p}/${q.need}).`:n.idle})}
function openChest(c){c.open=true;c.g.children[1].rotation.x=-1.1;c.g.children[1].position.set(0,1.1,-.4);c.beam.visible=false;const co=20+(R()*40|0),ks=Object.keys(ITEMS),k=ks[R()*ks.length|0];P.coins+=co;addItem(k);Sfx.coin();spark(c.x,1.2,c.z,0xffe38a,40,6,1);toast(`Peti: +${co} koin, ${ITEMS[k].i} ${ITEMS[k].n}`);gainExp(15);progress('chest')}
function targets(){const t=[];for(const n of NPCS)if(QD.some(q=>q.giver===n.name&&(avail(q)||ready(q))))t.push({x:n.x,z:n.z});
 for(const q of QD)if(qs[q.id].s==='active'&&!ready(q)){if(q.type==='chest')Wd.chests.filter(c=>!c.open).forEach(c=>t.push(c));else enemies.filter(e=>!e.dead&&e.t===q.tar).forEach(e=>t.push(e))}return t}

/* ===== Save / Load ===== */
function save(){localStorage.setItem('aetheria',JSON.stringify({lvl:P.lvl,exp:P.exp,coins:P.coins,hp:P.hp,inv:P.inv,qs,ch:Wd.chests.filter(c=>c.open).map(c=>c.id),x:P.pos.x,z:P.pos.z,tod,el:P.el,S}))}
function load(){const d=JSON.parse(localStorage.getItem('aetheria')||'null');if(!d)return false;Object.assign(P,{lvl:d.lvl,exp:d.exp,coins:d.coins,inv:d.inv,maxhp:maxHpOf(d.lvl),atk:10+3*d.lvl});P.hp=d.hp;Object.assign(qs,d.qs);tod=d.tod;P.pos.set(d.x,0,d.z);setEl(d.el);Object.assign(S,d.S||{});
 d.ch.forEach(i=>{const c=Wd.chests[i];c.open=true;c.g.children[1].rotation.x=-1.1;c.g.children[1].position.set(0,1.1,-.4);c.beam.visible=false});if(qs.q3.s==='done'||qs.q3.p>=1){const b=enemies.find(e=>e.t==='boss');b.dead=true;b.g.visible=b.bar.visible=false}return true}

/* ===== UI ===== */
let state='menu',cy=0,cp=.45;const toastEl=$('toast');let tt;
function toast(m){toastEl.textContent=m;toastEl.style.opacity=1;clearTimeout(tt);tt=setTimeout(()=>toastEl.style.opacity=0,2600)}
function panel(k,o={}){const b=$('pbody');$('panel').classList.remove('hidden');if(state==='play')state='paused';document.exitPointerLock&&document.exitPointerLock();$('pclose').textContent='Tutup';let h='';
 if(k==='dlg'){$('ptitle').textContent=o.n.name;h=`<p style="text-align:left;white-space:pre-line">${o.t}</p>`;$('pclose').textContent='Lanjut'}
 else if(k==='inv'){$('ptitle').textContent='Inventaris — 🪙 '+P.coins;const ks=Object.keys(P.inv).filter(k=>P.inv[k]>0);h=ks.length?ks.map(k=>`<div class="row"><span>${ITEMS[k].i} ${ITEMS[k].n} ×${P.inv[k]}<br><span class="tag">${ITEMS[k].d}</span></span><button data-use="${k}">Pakai</button></div>`).join(''):'<p>Tas kosong. Buka peti untuk mendapat item!</p>'}
 else if(k==='quest'){$('ptitle').textContent='Jurnal Quest';h=QD.map(q=>{const s=qs[q.id],lock=s.s==='new'&&!avail(q);return lock?'':`<div class="row ${s.s==='done'?'done':''}"><span><span class="tag">${q.main?'UTAMA':'SAMPINGAN'} · ${q.giver}</span><br>${q.title}<br><small style="padding:0;text-align:left">${q.talk}</small></span><span class="tag">${s.s==='done'?'✔ Selesai':s.s==='new'?'Baru!':ready(q)?'Lapor!':s.p+'/'+q.need}</span></div>`}).join('')}
 else if(k==='map'){$('ptitle').textContent='Peta Aetheria';h='<canvas id="bigmap" width="500" height="500"></canvas><small style="padding:0">🔴 musuh · 🟣 boss · 🟨 peti · 🔵 NPC · ◆ tujuan quest</small>'}
 else if(k==='set'){$('ptitle').textContent='Pengaturan';h=`<div class="row">Volume <input type="range" id="sv" min="0" max="1" step=".05" value="${S.vol}"></div><div class="row">Sensitivitas kamera <input type="range" id="ss" min=".3" max="2.5" step=".1" value="${S.sens}"></div><div class="row">Bayangan <input type="checkbox" id="sh" ${S.shadow?'checked':''}></div>`+(state!=='menu'&&o.in!==0?`<div class="row"><button data-act="save">💾 Simpan</button><button data-act="menu">Menu Utama</button></div>`:'')}
 b.innerHTML=h;if(k==='map')drawMap($('bigmap'),150,0,0)}
$('pclose').onclick=()=>{$('panel').classList.add('hidden');if(state==='paused')state='play'};
$('pbody').addEventListener('click',e=>{const u=e.target.dataset.use;if(u&&P.inv[u]>0){P.inv[u]--;ITEMS[u].use();Sfx.coin();panel('inv')}
 if(e.target.dataset.act==='save'){save();toast('Game tersimpan 💾')}if(e.target.dataset.act==='menu'){save();state='menu';$('panel').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden')}});
$('pbody').addEventListener('input',e=>{if(e.target.id==='sv')S.vol=+e.target.value;if(e.target.id==='ss')S.sens=+e.target.value;if(e.target.id==='sh'){S.shadow=e.target.checked;ren.shadowMap.enabled=sun.castShadow=S.shadow;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true})}});
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>panel(b.dataset.p));
document.querySelectorAll('#menu button').forEach(b=>b.onclick=()=>{const a=b.dataset.a;Sfx.coin();
 if(a==='new'){localStorage.removeItem('aetheria');sessionStorage.setItem('autostart','1');location.reload()}
 if(a==='cont'){if(!localStorage.getItem('aetheria'))return toast('Belum ada data tersimpan');start(true)}
 if(a==='set')panel('set',{in:0});
 if(a==='exit'){window.close();$('menu').innerHTML='<h1>TERIMA KASIH<br><span>TELAH BERMAIN</span></h1><p>Sampai jumpa di Aetheria, Pengelana.</p><button onclick="location.reload()">Kembali ke Menu</button>'}});
function start(cont){if(cont&&!load())return;if(!cont){toast('Temui Lira di desa untuk memulai petualangan!')}$('menu').classList.add('hidden');$('hud').classList.remove('hidden');state='play';if(sessionStorage.getItem('autostart'))sessionStorage.removeItem('autostart');setInterval(()=>state==='play'&&save(),20000)}
if(sessionStorage.getItem('autostart')){}
// minimap
const terr=document.createElement('canvas');terr.width=terr.height=150;{const x=terr.getContext('2d');for(let i=0;i<150;i++)for(let j=0;j<150;j++){const h=hgt(i*2-150,j*2-150);x.fillStyle=h<-1.2?'#2a6fc0':h<-.8?'#d8c88a':h<7?'#4d9a3a':h<16?'#8a8a88':'#f2f2f8';x.fillRect(i,j,1,1)}}
function drawMap(cv,half,cx,cz){const x=cv.getContext('2d'),w=cv.width,k=w/(2*half),px=(a,b)=>[(a-cx+half)*k,(b-cz+half)*k];x.fillStyle='#0a1030';x.fillRect(0,0,w,w);x.imageSmoothingEnabled=false;
 const s=(cx-half+150)/2,l=half;x.drawImage(terr,s,(cz-half+150)/2,half,half,0,0,w,w);
 for(const c of Wd.chests)if(!c.open){const[a,b]=px(c.x,c.z);x.fillStyle='#ffd24a';x.fillRect(a-3,b-3,6,6)}
 for(const n of NPCS){const[a,b]=px(n.x,n.z);x.fillStyle='#55aaff';x.beginPath();x.arc(a,b,4,0,TAU);x.fill()}
 for(const e of enemies)if(!e.dead){const[a,b]=px(e.x,e.z);x.fillStyle=e.t==='boss'?'#b44cff':'#ff4455';x.beginPath();x.arc(a,b,e.t==='boss'?6:2.5,0,TAU);x.fill()}
 x.strokeStyle='#ffd24a';x.lineWidth=2;for(const t of targets().slice(0,12)){let[a,b]=px(t.x,t.z);if(w<200){a=clamp(a,8,w-8);b=clamp(b,8,w-8)}x.beginPath();x.moveTo(a,b-7);x.lineTo(a+6,b);x.lineTo(a,b+7);x.lineTo(a-6,b);x.closePath();x.stroke()}
 const[a,b]=px(P.pos.x,P.pos.z);x.save();x.translate(a,b);x.rotate(-P.face+Math.PI);x.fillStyle='#fff';x.beginPath();x.moveTo(0,-8);x.lineTo(6,6);x.lineTo(-6,6);x.fill();x.restore()}
function hud(){$('lv').textContent='Lv '+P.lvl+'  ·  '+Math.round(tod*24+6)%24+':00';$('hp').style.width=P.hp/P.maxhp*100+'%';$('hpt').textContent=Math.ceil(P.hp)+' / '+P.maxhp;$('st').style.width=P.st+'%';$('xp').style.width=P.exp/need(P.lvl)*100+'%';$('en').style.width=P.en+'%';$('coins').textContent='🪙 '+P.coins;
 const e=$('elem'),el=ELEM[P.el];e.style.borderColor=hex(el.c);e.style.color=hex(el.c);e.innerHTML=`${el.n} — ${el.s}<br><span style="color:#fff">E: ${P.cd.e>0?P.cd.e.toFixed(1)+'s':'siap'} · Q: ${P.en>=100?'SIAP':Math.floor(P.en)+'%'}</span>`;
 const q=QD.find(q=>qs[q.id].s==='active'&&q.main)||QD.find(q=>qs[q.id].s==='active');$('track').innerHTML=q?`<b style="color:#f2c14e">${q.title}</b><br>${ready(q)?'Temui '+q.giver:q.talk.split('.')[0]+' ('+qs[q.id].p+'/'+q.need+')'}`:'Temui NPC bertanda ◆ di desa';
 let pr='';const n=NPCS.find(n=>Math.hypot(n.x-P.pos.x,n.z-P.pos.z)<4);if(n)pr=(mobile?'':'[F] ')+'Bicara dengan '+n.name;const c=Wd.chests.find(c=>!c.open&&Math.hypot(c.x-P.pos.x,c.z-P.pos.z)<3);if(c)pr=(mobile?'':'[F] ')+'Buka peti';$('prompt').textContent=pr;$('hint').style.display=document.pointerLockElement||mobile?'none':'block'}
function interact(){if(state!=='play')return;const n=NPCS.find(n=>Math.hypot(n.x-P.pos.x,n.z-P.pos.z)<4);if(n)return talk(n);const c=Wd.chests.find(c=>!c.open&&Math.hypot(c.x-P.pos.x,c.z-P.pos.z)<3);if(c)openChest(c)}

/* ===== Input ===== */
const K={};let joy={x:0,y:0};
addEventListener('keydown',e=>{if(e.repeat)return;K[e.code]=1;if(state==='play'){if(e.code==='KeyE')skill();if(e.code==='KeyQ')ult();if(e.code==='KeyF')interact();if(e.code==='Space')jump();if(/Digit[1-4]/.test(e.code))setEl(+e.code[5]-1)}
 if(state!=='menu'){const m={KeyI:'inv',KeyJ:'quest',KeyM:'map'}[e.code];if(m){if(!$('panel').classList.contains('hidden')&&state==='paused')$('pclose').click();else if(state==='play')panel(m)}
  if(e.code==='Escape'&&state==='play')panel('set')}});
addEventListener('keyup',e=>K[e.code]=0);
const cv=$('c');addEventListener('mousemove',e=>{if(state!=='play')return;if(document.pointerLockElement||e.buttons&2){cy-=e.movementX*.003*S.sens;cp=clamp(cp+e.movementY*.003*S.sens,-.2,1.2)}});
cv.addEventListener('mousedown',e=>{if(state!=='play'||mobile)return;if(e.button===0){if(!document.pointerLockElement)cv.requestPointerLock&&cv.requestPointerLock();attack()}});
cv.addEventListener('contextmenu',e=>e.preventDefault());
let heldA=false;
function jump(){if(P.ground&&P.st>=10){P.vy=10;P.ground=false;P.st-=10;Sfx.t(400,.15,'sine',.1,300);spark(P.pos.x,P.pos.y,P.pos.z,0xffffff,6,2,.4)}}
const bind=(id,fn,hold)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();fn();if(hold)heldA=true});if(hold)['pointerup','pointerleave'].forEach(t=>b.addEventListener(t,()=>heldA=false))};
bind('bA',attack,1);bind('bE',skill);bind('bQ',ult);bind('bJ',jump);bind('bF',interact);bind('bR',()=>{P.run=!P.run;$('bR').style.background=P.run?'#f2c14e':''});
$('elem').onclick=()=>setEl((P.el+1)%4);
const joyEl=$('joy'),knob=$('knob');let jId=null,cId=null,lx=0,ly=0;
joyEl.addEventListener('touchstart',e=>{e.preventDefault();jId=e.changedTouches[0].identifier;mj(e.changedTouches[0])},{passive:false});
function mj(t){const r=joyEl.getBoundingClientRect(),dx=t.clientX-(r.left+60),dy=t.clientY-(r.top+60),d=Math.min(50,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);joy.x=Math.cos(a)*d/50;joy.y=Math.sin(a)*d/50;knob.style.transform=`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`}
cv.addEventListener('touchstart',e=>{const t=e.changedTouches[0];if(cId===null){cId=t.identifier;lx=t.clientX;ly=t.clientY}},{passive:true});
addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===jId)mj(t);if(t.identifier===cId){cy-=(t.clientX-lx)*.006*S.sens;cp=clamp(cp+(t.clientY-ly)*.005*S.sens,-.2,1.2);lx=t.clientX;ly=t.clientY}}},{passive:true});
addEventListener('touchend',e=>{for(const t of e.changedTouches){if(t.identifier===jId){jId=null;joy.x=joy.y=0;knob.style.transform=''}if(t.identifier===cId)cId=null}});

/* ===== Spawn ===== */
for(let i=0;i<14;i++){const q=land(26,75,0,6);spawnEnemy('slime',q.x,q.z)}
for(let i=0;i<9;i++){const q=land(70,118,-.3,10);spawnEnemy('stalker',q.x,q.z)}
spawnEnemy('boss',-72,-68);

/* ===== Main loop ===== */
const clock=new THREE.Clock();let walk=0;
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;
 if(state==='menu'){cy+=dt*.15;cp=.35;P.pos.set(0,hgt(0,8),8)}
 if(state==='play'){P.cd.a-=dt;P.cd.e-=dt;P.atkT-=dt;if(heldA)attack();
  let ix=(K.KeyD?1:0)-(K.KeyA?1:0)+joy.x,iz=(K.KeyS?1:0)-(K.KeyW?1:0)+joy.y;const il=Math.hypot(ix,iz);
  const gh=hgt(P.pos.x,P.pos.z),sw=gh<-1.2;let moving=false;
  if(il>.1){ix/=Math.max(1,il);iz/=Math.max(1,il);const sc=Math.cos(cy),ss=Math.sin(cy),wx=ix*sc+iz*ss,wz=-ix*ss+iz*sc;const run=(K.ShiftLeft||P.run)&&P.st>1;
   const sp=(run?9:5)*(sw?.5:1);if(run)P.st=Math.max(0,P.st-18*dt);P.pos.x+=wx*sp*dt;P.pos.z+=wz*sp*dt;P.face=Math.atan2(wx,wz);moving=true;walk+=dt*(run?14:9)}
  else walk=0;
  if(!K.ShiftLeft&&!(P.run&&moving))P.st=Math.min(100,P.st+(moving?8:20)*dt);
  for(const o of obst){const dx=P.pos.x-o.x,dz=P.pos.z-o.z,d=Math.hypot(dx,dz),m=o.r+.5;if(d<m&&d>0){P.pos.x=o.x+dx/d*m;P.pos.z=o.z+dz/d*m}}
  const dd=Math.hypot(P.pos.x,P.pos.z);if(dd>138){P.pos.x*=138/dd;P.pos.z*=138/dd}
  const g=hgt(P.pos.x,P.pos.z);P.vy-=26*dt;P.pos.y+=P.vy*dt;if(P.pos.y<=g){P.pos.y=g;P.vy=0;P.ground=true}else if(P.pos.y>g+.2)P.ground=false;
  P.hp=Math.min(P.maxhp,P.hp+dt*.3);if(P.ground&&moving&&(walk%1)<dt*10)spark(P.pos.x,P.pos.y+.1,P.pos.z,0xd8d0b0,1,1.5,.4,.3)}
 else if(state==='paused'){}
 // hero pose
 hero.position.copy(P.pos);hero.rotation.y+=(((P.face-hero.rotation.y+Math.PI*3)%TAU)-Math.PI)*Math.min(1,dt*14);const u=hero.userData,sw2=Math.sin(walk)*.8;
 u.legL.rotation.x=sw2;u.legR.rotation.x=-sw2;u.armL.rotation.x=-sw2*.8;u.armR.rotation.x=P.atkT>0?-2+(.3-P.atkT)*10:sw2*.8;u.cape.rotation.x=.2+Math.abs(sw2)*.4+(P.ground?0:.5);hero.position.y+=Math.sin(time*2)*.02;
 for(const n of NPCS){n.mk.visible=QD.some(q=>q.giver===n.name&&(avail(q)||ready(q)));n.mk.rotation.y=time*2;n.mk.position.y=hgt(n.x,n.z)+3.4+Math.sin(time*3)*.15;n.mk.material.color.setHex(QD.some(q=>q.giver===n.name&&ready(q))?0x66ff99:0xffd24a)}
 for(const c of Wd.chests)if(!c.open)c.beam.rotation.y=time;
 if(state==='play'||state==='menu'){updEnemies(state==='play'?dt:0,time);updSkyAndFx(dt)}
 const cd=state==='menu'?16:8,tx=P.pos.x,ty=P.pos.y+1.8,tz=P.pos.z;cam.position.set(tx+Math.sin(cy)*Math.cos(cp)*cd,ty+Math.sin(cp)*cd,tz+Math.cos(cy)*Math.cos(cp)*cd);
 const cg=hgt(cam.position.x,cam.position.z)+.8;if(cam.position.y<cg)cam.position.y=cg;cam.lookAt(tx,ty,tz);
 if(state!=='menu'){hud();drawMap($('mini'),60,P.pos.x,P.pos.z)}
 ren.render(scene,cam)}
function updSkyAndFx(dt){updateSky(dt);updFx(dt);updParticles(dt)}
loop();
if(sessionStorage.getItem('autostart'))start(false);
