import * as THREE from 'three';
import { V, random, pick, mat, mesh, box, cylinderBetween, beam, tube, vertexMesh, woodTexture, contactShadow } from './utils.js';
import { heightAt } from './terrain.js';

const woodMap = woodTexture();
const wood = color => mat(color, { map: woodMap });
const ropeMat = mat('#d5c192');
const nailMat = mat('#675843', { metalness: .35 });
export function createDock(parent) {
  const dock = new THREE.Group(); dock.position.set(-4.05, 0, .95); dock.rotation.y = -.08; parent.add(dock); dock.userData.label = 'THE DEPARTURE LOUNGE';
  const width = 2.45, length = 2.94;
  for (let i = 0; i < 12; i++) {
    const z = (i - 5.5) * .246;
    const plank = box(dock, [width + random(-.06, .07), .14, .231], [random(-.028,.028), .68 + random(-.008,.008), z], wood(pick(['#b9844d','#bb8953','#b27b45','#c08d54','#b98047'])), .025);
    plank.rotation.y = random(-.007,.007);
    for (const x of [-.94,.94]) mesh(new THREE.CylinderGeometry(.023,.019,.008,6), nailMat,dock,V(x,.759,z + .052));
    for (let k = 0; k < 2; k++) { const x = random(-1,.2), zz = z + random(-.075,.075); tube(dock,[V(x,.755,zz),V(x+.3,.755,zz+.008),V(x+random(.5,.9),.755,zz)],.004,mat('#8d6239',{transparent:true,opacity:.38}),5,3); }
  }
  for (const x of [-.91,.91]) box(dock,[.13,.22,3.16],[x,.48,0],wood('#8a6038'));
  for (const x of [-1.11,1.11]) for (const z of [-1.36,1.36]) {
    mesh(new THREE.CylinderGeometry(.14,.16,1.63,9),wood('#926b40'),dock,V(x,.435,z));
    mesh(new THREE.CylinderGeometry(.145,.145,.045,9),mat('#c69a60'),dock,V(x,1.273,z));
    for (let i = 0; i < 4; i++) { const ring = mesh(new THREE.TorusGeometry(.147,.018,5,18),ropeMat,dock,V(x,.965+i*.041,z)); ring.rotation.x = Math.PI/2; }
    tube(dock,[V(x+.15,1.01,z),V(x+.2,.82,z+.06),V(x+.17,.56,z+.08)],.016,ropeMat,9,4);
    const wet = mesh(new THREE.CylinderGeometry(.163,.164,.27,9),mat('#567c66',{transparent:true,opacity:.6}),dock,V(x,.03,z)); wet.castShadow=false;
  }
  contactShadow(parent,-4.05,.95,3.5,4,.24,.18);
  return dock;
}
function hullPoint(theta, scaleX, scaleZ, y) {
  const s=Math.sin(theta), c=Math.cos(theta), taper=c<0?1+c*.19:1;
  return V(Math.sign(s)*Math.pow(Math.abs(s),.85)*.71*scaleX*taper,y,c*1.64*scaleZ);
}
export function createBoat(parent) {
  const boat = new THREE.Group(); boat.position.set(-1.8,.08,3.22); boat.rotation.y = -1.08; boat.scale.setScalar(1.1); parent.add(boat); boat.userData.label='ABSOLUTELY NOWHERE TO BE';
  const n=32;
  const rings=[[.54,.76,.025],[.74,.88,.17],[.91,.96,.37],[1,1,.62]];
  const outerMaterials=['#865631','#a06a39','#b17a44'];
  for(let r=0;r<3;r++) {
    const p=[],c=[];
    for(let i=0;i<n;i++) {
      const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,lo=rings[r],hi=rings[r+1];
      const A=hullPoint(a,...lo),B=hullPoint(b,...lo),C=hullPoint(b,...hi),D=hullPoint(a,...hi);
      p.push(...A.toArray(),...B.toArray(),...D.toArray(),...B.toArray(),...C.toArray(),...D.toArray());
      const col=new THREE.Color(outerMaterials[r]).multiplyScalar(random(.92,1.09));for(let k=0;k<6;k++)c.push(col.r,col.g,col.b);
    }
    vertexMesh(boat,p,null,c);
  }
  // Dark seams trace the curved, stacked hull planks.
  for(const ring of rings.slice(1)) tube(boat,Array.from({length:n+1},(_,i)=>hullPoint(i/n*Math.PI*2,...ring)),.012,mat('#755030'),48,3);
  const ip=[],ic=[];
  for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;
    const A=hullPoint(a,.51,.74,.12),B=hullPoint(b,.51,.74,.12),C=hullPoint(b,.88,.945,.607),D=hullPoint(a,.88,.945,.607);
    ip.push(...A.toArray(),...B.toArray(),...D.toArray(),...B.toArray(),...C.toArray(),...D.toArray());
    const col=new THREE.Color(pick(['#946034','#a16c3c','#a67341']));for(let k=0;k<6;k++)ic.push(col.r,col.g,col.b);
  }
  vertexMesh(boat,ip,null,ic);
  // Broad gunwale: the hull is truly hollow, not a solid ellipsoid.
  const rimPos=[],rimIndices=[];
  for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;rimPos.push(...hullPoint(a,1.025,1.006,.64).toArray(),...hullPoint(a,.87,.936,.64).toArray());if(i<n){const k=i*2;rimIndices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  vertexMesh(boat,rimPos,rimIndices,null,{color:'#bd8850'});
  for(let i=0;i<5;i++)box(boat,[.128,.06,2.38-Math.abs(i-2)*.18],[(i-2)*.14,.13,.06],wood(i%2?'#956337':'#a36e3e'),.012);
  for(const z of [-1.04,-.47,.15,.74,1.1]){
    const width=.6*Math.pow(1-(z/1.64)**2,.44);
    tube(boat,[V(-width*.94,.59,z),V(-width*.77,.31,z),V(-width*.45,.18,z),V(0,.17,z),V(width*.45,.18,z),V(width*.77,.31,z),V(width*.94,.59,z)],.028,wood('#bd8650'),12,4);
  }
  for(const z of [-.89,.2,.94]){
    const width=1.23*Math.sqrt(1-(z/1.72)**2);
    box(boat,[width,.105,.255],[0,.475,z],wood('#b47c44'),.02);
    for(const x of [-width*.39,width*.39])mesh(new THREE.CylinderGeometry(.018,.018,.008,5),nailMat,boat,V(x,.531,z));
  }
  // A small triangular bow cap.
  vertexMesh(boat,[-.33,.615,-1.3,.33,.615,-1.3,0,.65,-1.64],[0,1,2],null,{color:'#ba8148'});
  for(const [x,z]of[[-.64,-.2],[.64,-.2]])mesh(new THREE.TorusGeometry(.038,.009,4,9),mat('#786348',{metalness:.35}),boat,V(x,.666,z));
  function oar(a,b){cylinderBetween(boat,a,b,.023,wood('#ba8a50'),.032,7);const dir=b.clone().sub(a).normalize(),end=b.clone().addScaledVector(dir,.39);const paddle=box(boat,[.16,.043,.58],b.clone().lerp(end,.35).toArray(),wood('#b98446'),.045);paddle.quaternion.setFromUnitVectors(V(0,0,1),dir);}
  oar(V(-.52,.66,-.83),V(.84,.67,1.14));oar(V(.5,.64,-1.07),V(-.78,.65,.92));
  const buoy=new THREE.Group();buoy.position.set(.70,.47,.57);buoy.rotation.y=Math.PI/2;buoy.rotation.x=.18;boat.add(buoy);
  for(let i=0;i<4;i++){const ring=mesh(new THREE.TorusGeometry(.235,.065,7,10,Math.PI/2),mat(i%2?'#f2e9d2':'#d97152'),buoy);ring.rotation.z=i*Math.PI/2;}
  const safety=mesh(new THREE.TorusGeometry(.318,.012,4,32),ropeMat,buoy);safety.position.z=-.012;
  tube(boat,[V(.67,.62,.5),V(.72,.79,.55),V(.73,.67,.64),V(.72,.46,.61)],.015,ropeMat,12,4);
  mesh(new THREE.TorusGeometry(.065,.014,4,10),mat('#67583c'),boat,V(0,.675,-1.53)).rotation.x=Math.PI/2;
  mesh(new THREE.TorusGeometry(.05,.012,4,10),mat('#67583c'),boat,V(0,.675,1.48)).rotation.x=Math.PI/2;
  contactShadow(parent,-1.8,3.22,2.7,3.7,.239,.21);
  tube(parent,[V(-3.05,1.04,2.4),V(-3.11,.65,2.94),V(-3.18,.52,3.43),V(-3.24,.8,3.99)],.018,ropeMat,24,5);
  const restY=boat.position.y;
  return {object:boat,update(t){boat.position.y=restY+Math.sin(t*.95)*.026;boat.rotation.z=Math.sin(t*.7)*.018;boat.rotation.x=Math.sin(t*.6+1)*.015;}};
}
export function createChair(parent) {
  const chair=new THREE.Group();chair.position.set(2.55,heightAt(2.55,.67)+.015,.67);chair.rotation.y=-.14;parent.add(chair);chair.userData.label='YOUR PLANS FOR THE AFTERNOON';
  const frame=wood('#967048');
  for(const x of[-.61,.61]){
    beam(chair,V(x,.1,.9),V(x,1.7,-.79),.077,.075,frame);
    beam(chair,V(x,.09,-.68),V(x,.79,.54),.077,.075,frame);
    beam(chair,V(x,.44,.81),V(x,.57,-.1),.065,.065,wood('#b08552'));
    beam(chair,V(x,.76,.47),V(x,.82,-.47),.084,.064,wood('#b38655'));
    beam(chair,V(x,.39,.49),V(x,.77,.34),.047,.047,frame);
    const bolt=mesh(new THREE.CylinderGeometry(.032,.032,.014,8),mat('#c1b58f',{metalness:.5}),chair,V(x*1.065,.62,.03));bolt.rotation.z=Math.PI/2;
  }
  for(const [y,z]of[[.43,.83],[1.67,-.77],[.16,-.59]])cylinderBetween(chair,V(-.64,y,z),V(.64,y,z),.038,frame,.038,7);
  const path=new THREE.CatmullRomCurve3([V(0,.45,.82),V(0,.44,.49),V(0,.51,.04),V(0,.72,-.21),V(0,1.18,-.5),V(0,1.66,-.76)]);
  const stripeCount=9,width=1.105;
  for(let s=0;s<stripeCount;s++){
    const p=[],indices=[],cols=[];
    for(let i=0;i<=30;i++){
      const t=i/30,pt=path.getPoint(t);
      for(let side=0;side<2;side++){const x=-width/2+(s+side)*width/stripeCount;const sag=Math.sin((x/width+.5)*Math.PI)*.026*Math.sin(Math.PI*t);p.push(x,pt.y-sag,pt.z);}
      if(i<30){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    vertexMesh(chair,p,indices,null,{color:s%2?'#4d7ca9':'#f4ebd7',roughness:1,side:THREE.DoubleSide});
  }
  for(const x of[-.557,.557])tube(chair,Array.from({length:25},(_,i)=>{const p=path.getPoint(i/24);p.x=x;return p;}),.012,mat('#e5dac0'),24,4);
  contactShadow(parent,2.55,.75,2.2,2.7,heightAt(2.55,.75)+.01,.2);
  return chair;
}
export function createUmbrella(parent){
  const group=new THREE.Group();group.position.set(2.75,heightAt(2.75,-.17),-.17);parent.add(group);group.userData.label='PERMANENT OUT-OF-OFFICE';
  const top=3.02,radius=1.44,n=12;
  cylinderBetween(group,V(0,0,0),V(0,top+.07,0),.038,wood('#a17f4e'),.031,9);
  for(let s=0;s<n;s++){
    const pos=[],indices=[],colors=[];const base=new THREE.Color(s%2?'#f5eddb':'#de725d');
    for(let r=0;r<=5;r++)for(let j=0;j<=5;j++){
      const t=r/5,a=(s+j/5)/n*Math.PI*2,R=radius*t;
      const y=top-.49*Math.pow(t,1.35)-.025*Math.sin(j/5*Math.PI)*t;
      pos.push(Math.cos(a)*R,y,Math.sin(a)*R);
      const c=base.clone().multiplyScalar(1-.07*Math.sin(j/5*Math.PI));colors.push(c.r,c.g,c.b);
      if(r<5&&j<5){const k=r*6+j;indices.push(k,k+1,k+6,k+1,k+7,k+6);}
    }
    vertexMesh(group,pos,indices,colors,{side:THREE.DoubleSide,roughness:.95});
    const vp=[],vi=[];
    for(let j=0;j<=8;j++){
      const a=(s+j/8)/n*Math.PI*2,y=top-.49-.025*Math.sin(j/8*Math.PI);const drop=.115+.025*Math.sin(j/8*Math.PI);
      vp.push(Math.cos(a)*radius,y,Math.sin(a)*radius,Math.cos(a)*radius,y-drop,Math.sin(a)*radius);
      if(j<8){const k=j*2;vi.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    vertexMesh(group,vp,vi,null,{color:s%2?'#ede3cd':'#cf6853',side:THREE.DoubleSide});
    const angle=s/n*Math.PI*2;
    tube(group,Array.from({length:9},(_,i)=>{const t=i/8;return V(Math.cos(angle)*radius*t,top-.49*Math.pow(t,1.35)+.008,Math.sin(angle)*radius*t);}),.009,mat(s%2?'#f6edda':'#edac89'),12,4);
    cylinderBetween(group,V(0,2.32,0),V(Math.cos(angle)*radius*.68,top-.49*Math.pow(.68,1.35)-.024,Math.sin(angle)*radius*.68),.01,mat('#b19b75'),.008,4);
  }
  mesh(new THREE.SphereGeometry(.065,8,6),wood('#a77d49'),group,V(0,top+.037,0));
  mesh(new THREE.CylinderGeometry(.069,.069,.12,8),mat('#b9a37f'),group,V(0,2.32,0));
  return group;
}
export function createCrate(parent){
  const group=new THREE.Group();group.position.set(3.82,heightAt(3.82,1.08),1.08);group.rotation.y=.11;parent.add(group);group.userData.label='ONE COCONUT. ZERO RESPONSIBILITIES.';
  box(group,[.67,.52,.62],[0,.28,0],wood('#966633'));
  for(let i=0;i<4;i++)box(group,[.156,.046,.65],[(i-1.5)*.166,.556,0],wood(pick(['#b1854c','#b88951','#aa7e47'])),.009);
  for(const z of[-.324,.324]){
    for(let i=0;i<4;i++)box(group,[.153,.44,.035],[(i-1.5)*.163,.28,z],wood(i%2?'#ac7a43':'#a6743e'),.006);
    for(const x of[-.285,.285])box(group,[.07,.54,.052],[x,.28,z],wood('#805a30'),.008);
    for(const y of[.065,.48])box(group,[.67,.065,.049],[0,y,z],wood('#9a6c36'),.007);
    for(const x of[-.285,.285])for(const y of[.075,.48]){const nail=mesh(new THREE.SphereGeometry(.012,5,4),nailMat,group,V(x,y,z*1.1));nail.scale.z=.25;}
  }
  for(const x of[-.344,.344]){for(let i=0;i<3;i++)box(group,[.035,.145,.61],[x,.12+i*.155,0],wood('#a7773e'),.007);beam(group,V(x*1.02,.06,-.24),V(x*1.02,.5,.24),.075,.055,wood('#89612f'));}
  const drink=new THREE.Group();drink.position.set(.025,.594,0);drink.rotation.z=-.08;group.add(drink);
  const coconut=mesh(new THREE.IcosahedronGeometry(.185,2),mat('#8b9e3e'),drink,V(0,.165,0));coconut.scale.set(1,1.13,.95);
  mesh(new THREE.CylinderGeometry(.141,.155,.051,14),mat('#8d773f'),drink,V(0,.314,0));
  mesh(new THREE.CylinderGeometry(.128,.129,.014,18),mat('#f1e5ba'),drink,V(0,.344,0));
  mesh(new THREE.CylinderGeometry(.086,.086,.004,16),mat('#b6ba77'),drink,V(0,.353,0));
  tube(drink,[V(.035,.3,0),V(.05,.56,.01),V(.15,.64,.02)],.013,mat('#e9a28c'),8,6);
  const lime=mesh(new THREE.CircleGeometry(.081,12,0,Math.PI),mat('#c3cf64',{side:THREE.DoubleSide}),drink,V(-.088,.39,0));lime.rotation.z=.5;
  contactShadow(parent,3.82,1.08,1.1,1.1,heightAt(3.82,1.08)+.016,.22);
  return group;
}
function starfish(parent,x,z,r,rotation){
  const group=new THREE.Group();group.position.set(x,heightAt(x,z)+.025,z);group.rotation.y=rotation;parent.add(group);
  const points=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2,rad=i%2?r*.39:r;points.push(V(Math.cos(a)*rad,.032,Math.sin(a)*rad));}
  const p=[],c=[];for(let i=0;i<10;i++){p.push(0,.10,0,...points[i].toArray(),...points[(i+1)%10].toArray());const col=new THREE.Color(i%2?'#d37147':'#e88658');for(let j=0;j<3;j++)c.push(col.r,col.g,col.b);}
  vertexMesh(group,p,null,c);
  const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p.x,p.z):shape.moveTo(p.x,p.z));shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,steps:1});const m=mesh(g,mat('#cd7048'),group);m.rotation.x=Math.PI/2;m.position.y=.031;
  for(let a=0;a<5;a++)for(let j=1;j<5;j++){const angle=a/5*Math.PI*2,d=r*j/5;mesh(new THREE.IcosahedronGeometry(.01,0),mat('#efaa75'),group,V(Math.cos(angle)*d,.10*(1-d/r)+.039,Math.sin(angle)*d));}
}
export function createBeachDetails(parent){
  starfish(parent,.9,.55,.29,.2);starfish(parent,5.78,3.09,.31,-.35);
  for(const [x,z]of[[4.67,2.16],[1.07,.67],[-1.22,-.02]]){
    const shell=new THREE.Group();shell.position.set(x,heightAt(x,z)+.025,z);shell.rotation.y=random(0,6.28);parent.add(shell);
    for(let i=0;i<7;i++){const angle=(i/6-.5)*1.5;const petal=mesh(new THREE.SphereGeometry(.05,5,4),mat(i%2?'#eee2bf':'#e4cda7'),shell,V(Math.sin(angle)*.05,.015,Math.cos(angle)*.02));petal.scale.set(.43,.32,1.4);petal.rotation.y=angle;}
  }
  // Tiny, almost-erased footprints lead away from the chair.
  for(let i=0;i<10;i++){
    const x=1.5-i*.22,z=.37-i*.1+(i%2?.07:-.07);if(z>heightAt(x,z)+.7)continue;
    const print=mesh(new THREE.CircleGeometry(.042,10),mat('#c5a66f',{transparent:true,opacity:.16,depthWrite:false}),parent,V(x,heightAt(x,z)+.006,z));print.rotation.x=-Math.PI/2;print.rotation.z=.6;print.scale.y=1.8;print.castShadow=false;
  }
}
