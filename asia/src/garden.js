import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
let seed = 190417;
function rand(a = 0, b = 1) { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return a + ((t ^ t >>> 14) >>> 0) / 4294967296 * (b - a); }
const pick = a => a[Math.floor(rand(0, a.length))];
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const dummy = new THREE.Object3D();
const up = v(0, 1, 0);
const materials = new Map();
function mat(color, roughness = .85) {
  const key = `${color}-${roughness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, flatShading: true }));
  return materials.get(key);
}
const cube = new THREE.BoxGeometry(1, 1, 1);
const ico = new THREE.IcosahedronGeometry(1, 1);
const lowIco = new THREE.IcosahedronGeometry(1, 0);
const barkMaterial = new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true});

function batchStaticGeometry(root) {
  root.updateMatrixWorld(true);
  const groups = new Map(), originals = [];
  root.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || object.material.isShaderMaterial || object.material.transparent) return;
    const key = object.material.uuid + '-' + object.castShadow;
    if (!groups.has(key)) groups.set(key, { material: object.material, shadow: object.castShadow, geometries: [] });
    let geometry = object.geometry.clone();
    if (geometry.index) { const expanded = geometry.toNonIndexed(); geometry.dispose(); geometry = expanded; }
    for (const name of Object.keys(geometry.attributes)) if (!['position','normal','color'].includes(name)) geometry.deleteAttribute(name);
    geometry.applyMatrix4(object.matrixWorld);
    groups.get(key).geometries.push(geometry); originals.push(object);
  });
  for (const object of originals) object.removeFromParent();
  for (const {material,shadow,geometries} of groups.values()) {
    const geometry = mergeGeometries(geometries);
    if (!geometry) throw new Error('Static geometry batching failed');
    mesh(root,geometry,material,[0,0,0],[1,1,1],shadow);
    geometries.forEach(g=>g.dispose());
  }
}
function mesh(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1], shadow = true) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position); m.scale.set(...scale); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
function box(parent, color, pos, scale) { return mesh(parent, cube, mat(color), pos, scale); }
function beam(parent, a, b, width, color, depth = width) {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b);
  const m = mesh(parent, cube, mat(color), p.clone().add(q).multiplyScalar(.5).toArray(), [width, p.distanceTo(q), depth]);
  m.quaternion.setFromUnitVectors(up, q.sub(p).normalize()); return m;
}
function cylinder(parent, a, b, r1, r2, color, sides = 7) {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b);
  const m = mesh(parent, new THREE.CylinderGeometry(r2, r1, p.distanceTo(q), sides), mat(color), p.clone().add(q).multiplyScalar(.5).toArray());
  m.quaternion.setFromUnitVectors(up, q.sub(p).normalize()); return m;
}
function tube(parent, points, radius, color, segments = 20, sides = 6) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => v(...p))), segments, radius, sides, false), mat(color));
}

// Geometry is batched by species: thousands of individually colored leaves,
// grass blades and petals, with only a handful of draw calls.
class Batches {
  constructor(parent) { this.parent = parent; this.groups = new Map(); }
  add(name, geometry, position, scale, rotation, color, shadow = true) {
    if (!this.groups.has(name)) this.groups.set(name, { geometry, items: [], shadow });
    this.groups.get(name).items.push({ position, scale, rotation, color });
  }
  flush() {
    for (const [name, { geometry, items, shadow }] of this.groups) {
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, flatShading: true, side: THREE.DoubleSide });
      const inst = new THREE.InstancedMesh(geometry, material, items.length); inst.name = name;
      for (let i = 0; i < items.length; i++) {
        const p = items[i]; dummy.position.set(...p.position); dummy.scale.set(...p.scale); dummy.rotation.set(...p.rotation); dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix); inst.setColorAt(i, new THREE.Color(p.color));
      }
      inst.castShadow = shadow; inst.receiveShadow = true; inst.computeBoundingSphere(); this.parent.add(inst);
    }
  }
}

function flowerGeometry() {
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.CircleGeometry(1, 6); p.scale(.45, .67, 1); p.translate(0, .59, 0); p.rotateZ(i * TAU / 5); parts.push(p);
  }
  const center = new THREE.CircleGeometry(.22, 5); center.translate(0, 0, .018); parts.push(center);
  return mergeGeometries(parts);
}
const flowerGeo = flowerGeometry();
const leafGeo = new THREE.IcosahedronGeometry(1, 0);
leafGeo.scale(1, .38, .57);
function grassGeometry() {
  const positions = [], colors = [];
  for (let i = 0; i < 4; i++) {
    const a = i * 2.4, h = .7 + (i % 3) * .19, dx = Math.cos(a), dz = Math.sin(a), w = .065;
    const pts = [[-dz*w,0,dx*w],[dz*w,0,-dx*w],[dx*.15+dz*w*.4,h*.6,dz*.15-dx*w*.4],[-dz*w,0,dx*w],[dx*.15+dz*w*.4,h*.6,dz*.15-dx*w*.4],[dx*.15-dz*w*.4,h*.6,dz*.15+dx*w*.4],[dx*.15-dz*w*.4,h*.6,dz*.15+dx*w*.4],[dx*.15+dz*w*.4,h*.6,dz*.15-dx*w*.4],[dx*.39,h,dz*.39]];
    for (const p of pts) { positions.push(...p); const c = new THREE.Color(p[1] < .1 ? '#78882c' : '#bfd267'); colors.push(c.r,c.g,c.b); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geo.computeVertexNormals(); return geo;
}
const grassGeo = grassGeometry();

function rockGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 1); const p = geo.attributes.position;
  // A coordinate-derived distortion keeps duplicated face vertices watertight.
  for (let i = 0; i < p.count; i++) {
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i), n=1+.12*Math.sin(x*19+z*8+y*13)+.07*Math.sin(z*23-x*7);
    p.setXYZ(i,x*n,Math.max(-.66,y*n),z*n);
  }
  const colors=[];
  for(let i=0;i<p.count;i+=3){ const c=new THREE.Color(pick(['#929783','#a1a38c','#a5a892','#8c927e','#b0b19b','#969c88'])); for(let j=0;j<3;j++) colors.push(c.r,c.g,c.b); }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geo.computeVertexNormals(); return geo;
}

export function createGarden(scene) {
  const root = new THREE.Group(); root.name = 'Komorebi garden'; scene.add(root);
  const batches = new Batches(root);
  const rockGeos = Array.from({length:5},rockGeometry);
  const rockMat = new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true});
  const koi = [], petals = [], lanternLights = [], lanternMaterials = [], ripples = [], fireflies = [];
  const waterLevel=.48, groundLevel=.67;
  const pondControl=[[-1,-2.05],[.3,-2.6],[1.8,-2.65],[2.9,-1.9],[3.45,-.45],[3.55,1.2],[3.18,2.85],[2.35,3.95],[.85,4.5],[-.5,4.25],[-1.35,3.2],[-1.45,1.8],[-1.15,.3]];
  const pondCurve = new THREE.CatmullRomCurve3(pondControl.map(p=>v(p[0],0,p[1])),true,'catmullrom',.5);
  const pondPoints = pondCurve.getPoints(110).slice(0,-1).map(p=>new THREE.Vector2(p.x,p.z));
  function inPond(x,z,margin=0) {
    if(margin) { const cx=.95,cz=.95; x=cx+(x-cx)/(1+margin);z=cz+(z-cz)/(1+margin); }
    let c=false; for(let i=0,j=pondPoints.length-1;i<pondPoints.length;j=i++) {const a=pondPoints[i],b=pondPoints[j];if(((a.y>z)!==(b.y>z))&&(x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x))c=!c;} return c;
  }
  function islandRadius(a) {return 6.02+.13*Math.sin(a*5)+.11*Math.cos(a*9)+.04*Math.sin(a*17);}
  function onLand(x,z,padding=.15) {return Math.hypot(x,z/ .93)<islandRadius(Math.atan2(z/.93,x))-padding&&!inPond(x,z,.11);}
  const outer=[];for(let i=0;i<100;i++){const a=i/100*TAU,r=islandRadius(a);outer.push(new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r*.93));}
  // Solid, hand-hewn earth pedestal, not a floating plane.
  const soilPos=[],soilCols=[];
  const soilPalette=['#655340','#705a43','#785f46','#7b654b','#6e5841','#81674b'];
  const soilRings=[[-.64,.975],[-.49,1.003],[.08,1.005],[.57,1],[.68,.99]];
  const soilVertex=(i,j)=>{const a=(i%100)/100*TAU,r=islandRadius(a)*soilRings[j][1];return [Math.cos(a)*r,soilRings[j][0]+(j===4?0:.08*Math.sin(a*23+j*12)),Math.sin(a)*r*.93];};
  for(let j=0;j<4;j++)for(let i=0;i<100;i++){
    const a=soilVertex(i,j),b=soilVertex(i+1,j),c=soilVertex(i+1,j+1),d=soilVertex(i,j+1);
    for(const tri of [[a,d,b],[b,d,c]]) {soilPos.push(...tri.flat());const col=new THREE.Color(pick(soilPalette));if(j===3)col.lerp(new THREE.Color('#738137'),.25);for(let n=0;n<3;n++)soilCols.push(col.r,col.g,col.b);}
  }
  const soilGeo=new THREE.BufferGeometry();soilGeo.setAttribute('position',new THREE.Float32BufferAttribute(soilPos,3));soilGeo.setAttribute('color',new THREE.Float32BufferAttribute(soilCols,3));soilGeo.computeVertexNormals();
  mesh(root,soilGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));
  // A ragged, overhanging turf edge softens the cut-earth silhouette.
  const turfPositions=[],turfColors=[];
  for(let i=0;i<100;i++){
    const edge=(k,top)=>{const a=(k%100)/100*TAU,r=islandRadius(a)*(top?1.001:1.004);return [Math.cos(a)*r,top?.677:.53+.032*Math.sin(a*37),Math.sin(a)*r*.93];};
    const a=edge(i,true),b=edge(i,false),c=edge(i+1,false),d=edge(i+1,true);
    for(const tri of [[a,d,b],[b,d,c]]){turfPositions.push(...tri.flat());const color=new THREE.Color(pick(['#7c9136','#81983b','#8a9e3f','#758b34']));for(let j=0;j<3;j++)turfColors.push(color.r,color.g,color.b);}
  }
  const turfGeo=new THREE.BufferGeometry();turfGeo.setAttribute('position',new THREE.Float32BufferAttribute(turfPositions,3));turfGeo.setAttribute('color',new THREE.Float32BufferAttribute(turfColors,3));turfGeo.computeVertexNormals();mesh(root,turfGeo,barkMaterial);
  const landShape=new THREE.Shape(outer);landShape.holes.push(new THREE.Path([...pondPoints].reverse()));
  const landGeo=new THREE.ShapeGeometry(landShape);landGeo.rotateX(Math.PI/2); // Shape XY -> world XZ, with the front face turned up below.
  const landMat=new THREE.MeshStandardMaterial({color:'#829b3d',roughness:1,side:THREE.DoubleSide});
  mesh(root,landGeo,landMat,[0,groundLevel,0]);
  const pondShape=new THREE.Shape(pondPoints);
  const pondGeo=new THREE.ShapeGeometry(pondShape,48);pondGeo.rotateX(Math.PI/2);
  const bottomMat = new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uTime:{value:0},uNight:{value:0}},vertexShader:`varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vPos; uniform float uTime; uniform float uNight;
    float cell(vec2 p){vec2 g=floor(p),f=fract(p);float d=1.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 n=g+o;vec2 h=fract(sin(vec2(dot(n,vec2(127.1,311.7)),dot(n,vec2(269.5,183.3))))*43758.5453);h=.5+.38*sin(uTime*.35+6.283*h);d=min(d,length(o+h-f));}return d;}
    void main(){vec2 p=vPos.xz;float c=cell(p*3.2+vec2(sin(p.y*2.+uTime*.3),cos(p.x*1.6+uTime*.2))*.13);float light=pow(smoothstep(.35,.66,c),3.);vec3 col=mix(vec3(.013,.085,.083),vec3(.028,.16,.145),.5+.5*sin(p.x*2.+p.y*3.));col+=vec3(.10,.22,.15)*light*.55;col*=mix(1.,.4,uNight);gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
  mesh(root,pondGeo,bottomMat,[0,.035,0],[1,1,1],false);
  const waterMat = new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:{value:0},uNight:{value:0}},vertexShader:`varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vPos;uniform float uTime;uniform float uNight;void main(){vec2 p=vPos.xz;float a=sin(p.x*12.+p.y*7.+uTime*.6)*sin(p.y*14.-p.x*3.-uTime*.4);float b=sin(p.x*31.+p.y*18.+sin(p.y*5.+uTime)*2.);float glint=pow(max(0.,a*b),16.);vec3 col=mix(vec3(.023,.24,.25),vec3(.018,.09,.16),uNight);col+=glint*.3;gl_FragColor=vec4(col,.39+glint*.2);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
  const water=mesh(root,pondGeo,waterMat,[0,waterLevel,0],[1,1,1],false);water.name='pond';water.renderOrder=3;
  // Pebbles visible through the water, in a range of mineral greens.
  for(let i=0;i<280;i++){const x=rand(-1.6,3.6),z=rand(-2.7,4.55);if(!inPond(x,z,-.055))continue;const s=rand(.065,.22);batches.add('river pebbles',ico,[x,.038,z],[s,rand(.025,.058),s*rand(.7,1.4)],[rand(0,2),rand(0,TAU),0],pick(['#577e70','#6c8c78','#879b78','#426c63','#5b8b83']),false);}
  function rock(x,z,size=.5,y=.7,scaleZ=1) {const m=mesh(root,pick(rockGeos),rockMat,[x,y,z],[size,size*rand(.68,.98),size*scaleZ]);m.rotation.y=rand(0,TAU);return m;}
  for(let i=0;i<45;i++){
    const p=pondCurve.getPointAt(i/45),s=rand(.28,.52);
    // Two open landings let the bridge meet the bank naturally.
    if(Math.abs(p.z-.05)<.6)continue;
    const r=rock(p.x,p.z,s,.54,rand(.7,1.3));
    if(i%3===0) {const moss=mesh(root,ico,mat('#73833f'),[p.x-.05,.54+s*.67,p.z],[s*.65,.10,s*.52]);moss.rotation.y=r.rotation.y;}
    if(i%2===0){const a=mesh(root,new THREE.TorusGeometry(s*.86,.01,3,24,Math.PI*1.3),new THREE.MeshBasicMaterial({color:'#a5d2b5',transparent:true,opacity:.3}),[p.x,.492,p.z],[1,1,1],false);a.rotation.x=-Math.PI/2;a.rotation.z=rand(0,TAU);}
  }
  rock(3.95,2.5,.88,.92,.8);rock(3.75,2.0,.4,.73);rock(-1.7,3.45,.6,.7,.85);rock(3.15,-2.25,.77,.8);rock(2.5,-2.7,.44,.8);rock(-.7,-3.55,.4,.8);

  function shrub(x,z,r=.55,flowers=false,y=groundLevel) {
    mesh(root,ico,mat('#3c641f'),[x,y+r*.43,z],[r*.93,r*.7,r*.84]);
    for(let i=0;i<Math.floor(r*200);i++){
      const a=rand(0,TAU),h=rand(-.1,1),rr=Math.sqrt(1-h*h)*r*rand(.7,1.06),s=rand(.09,.17);
      const p=[x+Math.cos(a)*rr,y+r*.25+h*r*.78,z+Math.sin(a)*rr*.87];
      batches.add('shrub leaves',leafGeo,p,[s,s*rand(.8,1.1),s],[rand(-1,1),rand(0,TAU),rand(-1,1)],pick(['#5d882c','#6d9635','#80a63c','#91b746','#4b792b','#a0ba4c']));
      if(flowers&&i%8===0)batches.add('garden flowers',flowerGeo,[p[0],p[1]+.065,p[2]],[.061,.061,.061],[-Math.PI/2+rand(-.7,.7),rand(-1,1),rand(0,TAU)],pick(['#e6a9b0','#f2b8c0','#eecaad','#f3e8c9']));
    }
  }
  [[-4.8,2.7,.6],[-4.7,1.45,.47],[-3.9,.55,.65],[-4.7,-.7,.45],[-2.0,-.95,.47],[-.9,-3.65,.62],[3.25,-3.6,.62],[4.8,-.1,.56],[4.85,1.3,.45],[3.95,3.45,.68],[-.35,5,.64],[-1.35,4.85,.47],[-2.15,.9,.43],[1.9,-4.6,.45]].forEach((p,i)=>shrub(...p,i%3===0));
  // Hand-cut stepping stones, with beveled, irregular edges.
  function steppingStone(x,z,r,angle) {
    const n=8,verts=[],indices=[];const radii=Array.from({length:n},()=>r*rand(.8,1.15));
    for(let j=0;j<3;j++)for(let i=0;i<n;i++){const a=i/n*TAU;const s=j===2?.85:1;verts.push(Math.cos(a)*radii[i]*s, j===0?0:j===1?.065:.12, Math.sin(a)*radii[i]*s*.73);}
    verts.push(0,.12,0);
    for(let j=0;j<2;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=(j+1)*n+(i+1)%n,d=(j+1)*n+i;indices.push(a,c,b,a,d,c);}
    for(let i=0;i<n;i++)indices.push(24,16+(i+1)%n,16+i);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const m=mesh(root,geo,mat(pick(['#b0ae92','#acac90','#b8b499','#a1a58b'])),[x,.67,z]);m.rotation.y=angle;
  }
  [[-2.7,4.65,.48],[-3.03,4.0,.48],[-3.35,3.32,.49],[-3.4,2.58,.5],[-3.2,1.87,.49],[-2.98,1.15,.46],[-2.8,.47,.47],[-2.7,-.18,.45],[-2.02,-.12,.35],[-1.43,-.02,.35]].forEach(p=>steppingStone(...p,rand(-.35,.35)));

  buildPavilion(root,lanternLights,lanternMaterials);
  buildBridge(root);
  buildLantern(root,lanternLights,lanternMaterials);

  // The cherry has a twisted, tapered trunk and a visible branching skeleton.
  const cherry = new THREE.Group();cherry.position.set(.15,.67,-3.48);root.add(cherry);
  function branch(parent,points,radii,color='#644532') {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>v(...p))),steps=points.length*5,sides=7,frames=curve.computeFrenetFrames(steps,false),positions=[],colors=[],idx=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,pt=curve.getPoint(t),k=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(k)),r=THREE.MathUtils.lerp(radii[j],radii[j+1],k-j);
      for(let s=0;s<sides;s++){const a=s/sides*TAU,cr=r*(1+.11*Math.sin(a*3+i*.7));const off=frames.normals[i].clone().multiplyScalar(Math.cos(a)*cr).addScaledVector(frames.binormals[i],Math.sin(a)*cr);positions.push(...pt.clone().add(off).toArray());const c=new THREE.Color(color).multiplyScalar(.78+.3*(s/sides)+.1*Math.sin(i*.8+s));colors.push(c.r,c.g,c.b);}
      if(i<steps)for(let s=0;s<sides;s++){const a=i*sides+s,b=i*sides+(s+1)%sides;idx.push(a,b,b+sides,a,b+sides,a+sides);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(parent,geo,barkMaterial);
  }
  branch(cherry,[[0,0,0],[-.16,.55,.03],[.05,1.12,.02],[.47,1.65,-.04],[.43,2.15,.04],[.22,2.65,0],[.52,3.3,-.12],[.72,3.85,-.2]],[.34,.27,.25,.25,.2,.16,.10,.025]);
  for(let i=0;i<7;i++){const a=i/7*TAU;branch(cherry,[[0,.27,0],[Math.cos(a)*.39,.13,Math.sin(a)*.35],[Math.cos(a)*.67,.02,Math.sin(a)*.58]],[.18,.11,.018]);}
  const branches=[
    {p:[[.42,1.7,0],[.9,2.1,.14],[1.35,2.2,.2],[1.73,2.68,.17],[1.8,3.05,.22]],r:[.19,.14,.1,.07,.015]},
    {p:[[.3,2.25,0],[-.25,2.67,.02],[-.78,2.75,.1],[-1.2,3.16,.12],[-1.45,3.49,.07]],r:[.17,.13,.09,.055,.012]},
    {p:[[-.6,2.72,.08],[-1.05,2.76,.35],[-1.55,2.96,.48],[-1.9,3.05,.56]],r:[.095,.075,.045,.009]},
    {p:[[.28,2.6,0],[.05,3.07,-.43],[-.18,3.58,-.54],[-.55,3.88,-.5]],r:[.13,.1,.06,.009]},
    {p:[[.48,3.15,-.1],[.93,3.49,-.22],[1.25,3.99,-.18],[1.45,4.3,-.2]],r:[.09,.07,.04,.008]},
    {p:[[.7,3.66,-.2],[.35,3.99,-.25],[.28,4.37,-.23]],r:[.055,.04,.009]},
    {p:[[1.23,2.19,.2],[1.47,2.6,.62],[1.35,2.9,.87]],r:[.08,.047,.008]},
    {p:[[-.1,2.73,-.13],[-.64,3.2,-.45],[-1.0,3.58,-.7]],r:[.07,.04,.009]}
  ];branches.forEach(b=>branch(cherry,b.p,b.r));
  // Raised bark ribbons accentuate the old tree's gentle spiral.
  branch(cherry,[[.13,.05,.25],[.03,.58,.24],[.26,1.16,.19],[.58,1.68,.1],[.54,2.04,.12]],[.045,.052,.045,.028,.006],'#805638');
  branch(cherry,[[-.22,.08,.15],[-.25,.63,.1],[-.04,1.05,.18],[.28,1.4,.15]],[.04,.038,.026,.006],'#4c382d');
  const canopies=[[-1.78,3.15,.49,.63],[-1.27,3.55,.14,.75],[-.9,3.08,.27,.65],[-.8,3.91,-.52,.62],[-.22,3.73,-.55,.63],[.25,4.26,-.24,.73],[.89,4.25,-.2,.65],[1.42,4.35,-.18,.6],[1.84,3.32,.13,.7],[1.41,3.04,.73,.64],[.86,3.52,-.11,.53],[-1.56,3.72,.06,.48]];
  const pinks=['#ed91ae','#f6adc6','#f3a0bd','#e381a7','#e594b4','#f8b9cf','#d16c95','#ffc1cf'];
  for(const [cx,cy,cz,r] of canopies){
    for(let i=0;i<440;i++){
      const a=rand(0,TAU),h=rand(-1,1),rr=r*Math.cbrt(rand(.03,1)),s=rand(.055,.097);
      const p=[.15+cx+Math.cos(a)*Math.sqrt(1-h*h)*rr,.67+cy+h*rr*.92,-3.48+cz+Math.sin(a)*Math.sqrt(1-h*h)*rr*.77];
      batches.add('sakura blossoms',flowerGeo,p,[s,s,s],[rand(-Math.PI,Math.PI),rand(0,TAU),rand(0,TAU)],pick(pinks));
    }
    // Fine twigs continue out to the tips, instead of ending in floating foliage.
    for(let i=0;i<4;i++){const end=[cx+rand(-r*.8,r*.8),cy+rand(-.2,r*.7),cz+rand(-r*.5,r*.5)];branch(cherry,[[cx,cy-.3,cz],[(cx+end[0])*.5,cy,cz],end],[.026,.013,.002],'#714b43');}
  }
  // Petal carpet, concentrated beneath the crown and scattered across the path.
  for(let i=0;i<400;i++){const x=rand(-2.1,2.5),z=rand(-4.9,-.6);if(!onLand(x,z))continue;const s=rand(.015,.039);batches.add('fallen petals',flowerGeo,[x,.689+rand(0,.014),z],[s,s,s],[-Math.PI/2,0,rand(0,TAU)],pick(pinks),false);}

  function bonsai(x,z,height=2.9,flip=1) {
    const g=new THREE.Group();g.position.set(x,.67,z);g.scale.setScalar(height/3);root.add(g);
    branch(g,[[0,0,0],[.03,.55,.08],[.3*flip,1.05,0],[.38*flip,1.55,-.05],[.16*flip,2.05,0],[.24*flip,2.58,0]],[.18,.16,.12,.10,.07,.012],'#675137');
    const crowns=[[-.42,1.14,.15,.66],[.74,1.6,.06,.61],[-.39,2.0,0,.56],[.31,2.58,-.05,.7],[.91,2.17,-.1,.48]];
    for(const [cx,cy,cz,r] of crowns){branch(g,[[.27*flip,Math.max(.65,cy-.7),0],[cx*flip*.6,cy-.22,cz],[cx*flip,cy,cz]],[.08,.045,.01],'#675137');
      mesh(g,ico,mat('#416923'),[cx*flip,cy,cz],[r,r*.4,r*.71]);
      for(let i=0;i<240;i++){const a=rand(0,TAU),h=rand(-.45,1),rr=r*Math.sqrt(1-h*h)*rand(.7,1.05),s=rand(.09,.16),sc=height/3;const p=[x+(cx*flip+Math.cos(a)*rr)*sc,.67+(cy+h*r*.5)*sc,z+(cz+Math.sin(a)*rr*.77)*sc];batches.add('pine foliage',leafGeo,p,[s*sc,s*sc,s*sc],[rand(-.7,.7),rand(0,TAU),rand(-.5,.5)],pick(['#4e782a','#638d2d','#7a9b32','#8dac3b','#a1b745','#5b8426']));}
    }
  }
  bonsai(-3.35,-4.0,3.65,-1);bonsai(4.42,-1.23,2.94,1);

  // Hollow-jointed bamboo with pale collars and delicate lance-shaped leaves.
  const bambooLeaf=new THREE.Shape();bambooLeaf.moveTo(0,0);bambooLeaf.quadraticCurveTo(.1,.27,0,.7);bambooLeaf.quadraticCurveTo(-.1,.27,0,0);
  const bambooLeafGeo=new THREE.ShapeGeometry(bambooLeaf);
  for(let i=0;i<9;i++){
    const x=2.88+rand(-.35,.4),z=-2.78+rand(-.32,.35),height=rand(1.55,3.0),lean=rand(-.24,.28),segments=Math.floor(height/.38);
    for(let j=0;j<segments;j++){
      const y=.7+j*.38,xx=x+lean*j/segments;
      cylinder(root,[xx,y,z],[x+lean*(j+1)/segments,y+.37,z-.03],.052-j*.002,.05-j*.002,pick(['#829a36','#91a742','#6b8b30']),7);
      cylinder(root,[xx,y+.025,z],[xx,y+.065,z],.061-j*.002,.061-j*.002,'#bdc779',7);
      if(j>1&&j%2===0){const side=i%2?1:-1;const end=[xx+side*.38,y+.24,z+rand(-.2,.2)];cylinder(root,[xx,y+.07,z],end,.017,.004,'#7b913c',5);for(let k=0;k<3;k++){batches.add('bamboo leaves',bambooLeafGeo,[end[0]-side*k*.08,end[1]-.02,end[2]],[.6,.65,.6],[rand(-.7,.7),rand(-1,1),-side*rand(.6,1.5)],pick(['#7b9d38','#66862e','#a2b44b']));}}
    }
    const top=mesh(root,new THREE.CircleGeometry(.043,7),mat('#d6d38b'),[x+lean,.7+segments*.38-.008,z-.03]);top.rotation.x=-Math.PI/2;
  }
  // Long sculptural blades around the stones.
  function fern(x,z,size=.6) {
    for(let i=0;i<9;i++){
      const a=i/9*TAU,reach=rand(.35,.65)*size,h=rand(.45,.95)*size,w=.035*size;
      const p=[],idx=[];
      for(let j=0;j<6;j++){const t=j/5,r=reach*t*t,y=.68+Math.sin(t*Math.PI*.7)*h,ww=w*Math.sin(Math.PI*t)*1.4;const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;p.push(px-Math.sin(a)*ww,y,pz+Math.cos(a)*ww,px+Math.sin(a)*ww,y,pz-Math.cos(a)*ww);if(j<5){const n=j*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();const material=mat(pick(['#87a837','#a6b84b','#628e32']));material.side=THREE.DoubleSide;mesh(root,geo,material);
    }
  }
  [[-4.6,2,.85],[-4.7,.4,.7],[-2.2,2.65,.6],[4.0,1.0,1],[3.8,-.5,.8],[2.7,-2.35,1.1],[-1.8,-3.2,.65],[2.8,4.0,.7],[-.8,4.9,.7],[4.8,2.4,.7],[-3.9,3.7,.65]].forEach(p=>fern(...p));
  // Ground vegetation leaves the walking stones and pavilion floor clear.
  function occupied(x,z){if(x>-4.55&&x<-1.45&&z>-3.63&&z<-.46)return true;if(x<-2.5&&x>-3.9&&z>-.5&&z<4.9){const pathX=-3.1-.3*Math.sin(z);if(Math.abs(x-pathX)<.5)return true;}if(x>-.95&&x<3.0&&Math.abs(z-.05)<.8)return true;return false;}
  for(let i=0;i<11000;i++){
    const x=rand(-6.2,6.2),z=rand(-5.7,5.7);if(!onLand(x,z,.02)||occupied(x,z))continue;
    const s=rand(.08,.22);batches.add('meadow grass',grassGeo,[x,.66,z],[s*rand(.7,1.2),s,s],[0,rand(0,TAU),0],pick(['#92aa43','#a0b64e','#7f9e35','#b2c25d','#769632']),false);
    if(i%31===0){const h=rand(.1,.2),fs=rand(.026,.05);batches.add('wildflower stems',cube,[x,.68+h/2,z],[.008,h,.008],[0,0,rand(-.15,.15)],'#718e3d',false);batches.add('wildflowers',flowerGeo,[x,.68+h,z],[fs,fs,fs],[-Math.PI/2+rand(-.45,.45),rand(-.3,.3),rand(0,TAU)],pick(['#f9edcf','#f6e5c8','#eed5cc','#edb8c1']),false);}
  }
  // Softly varying moss freckles break up the broad grass surface.
  for(let i=0;i<1600;i++){
    const x=rand(-6,6),z=rand(-5.6,5.6);if(!onLand(x,z,.04)||occupied(x,z))continue;const s=rand(.025,.095);batches.add('moss',lowIco,[x,.674,z],[s,.008,s],[0,rand(0,TAU),0],pick(['#8ea53f','#92aa43','#a0af48','#79953a','#a8b950']),false);
  }
  // Lily pads, notched and slightly cupped, with a few little lotus blossoms.
  function lily(x,z,r,flower=false){
    const shape=new THREE.Shape();shape.moveTo(0,0);for(let i=0;i<=30;i++){const a=.18+(TAU-.36)*i/30;shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);const m=mesh(root,geo,mat(pick(['#91ad42','#9eb74b','#7caa46'])),[x,.5+rand(0,.008),z],[1,1,1],false);m.rotation.y=rand(0,TAU);m.material.side=THREE.DoubleSide;m.renderOrder=4;
    for(let i=0;i<4;i++){const a=i/4*TAU+m.rotation.y;const line=beam(root,[x,.512,z],[x+Math.cos(a)*r*.86,.512,z+Math.sin(a)*r*.86],.005,'#b2c262',.006);line.castShadow=false;line.renderOrder=4;}
    if(flower){const f=new THREE.Group();f.position.set(x,.53,z);root.add(f);for(let j=0;j<2;j++)for(let i=0;i<7;i++){const a=i/7*TAU+j*.45;const petal=mesh(f,ico,mat(j?'#f7bfca':'#f0a1b5'),[Math.cos(a)*(.065-j*.02),.025+j*.035,Math.sin(a)*(.065-j*.02)],[.025,.022,.079-j*.019],false);petal.rotation.set(-.4,Math.PI/2-a,0);petal.renderOrder=5;}mesh(f,ico,mat('#ead084'),[0,.085,0],[.029,.016,.029],false);}
  }
  [[1.7,1.37,.2,true],[1.33,1.68,.19],[1.82,1.89,.16],[2.05,1.59,.15],[-.12,3.22,.17],[.15,3.05,.12],[-.3,3.5,.13,true],[2.8,-.98,.14],[2.56,-.83,.11],[2.86,.96,.15,true],[2.68,1.2,.12]].forEach(p=>lily(...p));
  batchStaticGeometry(root);
  // Six individually built koi; markings are part of their curved body mesh.
  for(let i=0;i<6;i++){const fish=buildKoi(i);root.add(fish.group);fish.phase=i*TAU/6;fish.speed=rand(.10,.15);fish.offset=rand(0,TAU);koi.push(fish);}
  const petalGeo=new THREE.CircleGeometry(1,5);petalGeo.scale(.65,1,1);
  const petalMat=new THREE.MeshStandardMaterial({color:'#f6b5c7',roughness:.9,side:THREE.DoubleSide});
  const falling=new THREE.InstancedMesh(petalGeo,petalMat,52);falling.castShadow=false;falling.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(falling);falling.frustumCulled=false;
  for(let i=0;i<52;i++)petals.push({x:rand(-1.8,2.0),y:rand(.7,5.5),z:rand(-4.2,-1.5),s:rand(.021,.043),speed:rand(.12,.29),phase:rand(0,TAU)});
  const fireflyMat=new THREE.MeshBasicMaterial({color:'#f8f5a0',transparent:true,opacity:0,depthWrite:false});
  const fireflyMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,4),fireflyMat,28);root.add(fireflyMesh);fireflyMesh.frustumCulled=false;
  for(let i=0;i<28;i++)fireflies.push({x:rand(-4.5,4.5),y:rand(.9,2.5),z:rand(-4,3.5),phase:rand(0,TAU)});
  const rippleGeo=new THREE.RingGeometry(.97,1,64);rippleGeo.rotateX(-Math.PI/2);
  function addRipple(x,z,delay=0){const m=mesh(root,rippleGeo,new THREE.MeshBasicMaterial({color:'#c1e3cb',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}),[x,.515,z],[.05,1,.05],false);m.renderOrder=6;ripples.push({mesh:m,age:-delay});}
  const crumbs=[];let feedTarget=null,feedTime=0;
  function feed(x=.65,z=2.55){feedTarget=v(x,.25,z);feedTime=9;for(let i=0;i<4;i++)addRipple(x,z,i*.45);for(let i=0;i<12;i++){const c=mesh(root,lowIco,mat('#d4aa64'),[x+rand(-.3,.3),.53,z+rand(-.3,.3)],[.025,.016,.025],false);c.renderOrder=4;crumbs.push({mesh:c,age:0});}}
  batches.flush();
  let lastRipple=0;
  function update(time,dt,night){
    waterMat.uniforms.uTime.value=time;waterMat.uniforms.uNight.value=night;bottomMat.uniforms.uTime.value=time;bottomMat.uniforms.uNight.value=night;
    for(let i=0;i<koi.length;i++){
      const fish=koi[i],a=time*fish.speed+fish.phase;
      let x=.9+Math.cos(a)*1.32+.19*Math.sin(a*3+fish.offset),z=1.14+Math.sin(a)*2.30;
      if(feedTime>0){const b=time*.30+fish.phase,rr=.30+i*.10;x=feedTarget.x+Math.cos(b)*rr;z=feedTarget.z+Math.sin(b)*rr;if(!inPond(x,z,-.08)){x=feedTarget.x;z=feedTarget.z;}}
      const target=v(x,.245+.035*Math.sin(time*.7+i),z),old=fish.group.position.clone();
      if(!fish.initialized){fish.group.position.copy(target);fish.initialized=true;}else fish.group.position.lerp(target,1-Math.exp(-dt*(feedTime>0?.6:1.8)));
      const dx=fish.group.position.x-old.x,dz=fish.group.position.z-old.z;
      if(Math.abs(dx)+Math.abs(dz)>.00001){const angle=Math.atan2(dx,dz);let diff=angle-fish.group.rotation.y;diff=Math.atan2(Math.sin(diff),Math.cos(diff));fish.group.rotation.y+=diff*Math.min(1,dt*2.5);}
      fish.tail.rotation.y=Math.sin(time*4.4+i*1.7)*.27;fish.fins.forEach((f,j)=>f.rotation.z=Math.sin(time*3+i+j)*.11);fish.group.rotation.z=Math.sin(time*1.3+i)*.025;
    }
    if(feedTime>0)feedTime=Math.max(0,feedTime-dt);
    for(let i=crumbs.length-1;i>=0;i--){const c=crumbs[i];c.age+=dt;c.mesh.position.y=.527+Math.sin(time*2+i)*.005;if(c.age>5){c.mesh.scale.multiplyScalar(Math.exp(-dt));if(c.age>8){root.remove(c.mesh);crumbs.splice(i,1);}}}
    for(let i=0;i<petals.length;i++){
      const p=petals[i];p.y-=dt*p.speed;p.x+=dt*.07;p.z+=dt*.045;if(p.y<.71){p.y=rand(4.0,5.3);p.x=rand(-1.6,1.6);p.z=rand(-4.1,-2.6);}
      dummy.position.set(p.x+Math.sin(time*.55+p.phase)*.28,p.y,p.z+Math.cos(time*.4+p.phase)*.18);dummy.scale.setScalar(p.s);dummy.rotation.set(time*.8+p.phase,time*.35,p.phase+Math.sin(time)*.6);dummy.updateMatrix();falling.setMatrixAt(i,dummy.matrix);
    }falling.instanceMatrix.needsUpdate=true;
    fireflyMat.opacity=night*.9;fireflyMesh.visible=night>.01;
    for(let i=0;i<fireflies.length;i++){const f=fireflies[i];dummy.position.set(f.x+Math.sin(time*.35+f.phase)*.35,f.y+Math.sin(time*.65+f.phase)*.16,f.z+Math.cos(time*.27+f.phase)*.25);dummy.scale.setScalar(.016*(.5+.5*Math.sin(time*2+f.phase)));dummy.rotation.set(0,0,0);dummy.updateMatrix();fireflyMesh.setMatrixAt(i,dummy.matrix);}fireflyMesh.instanceMatrix.needsUpdate=true;
    for(const l of lanternLights)l.intensity=(.12+night*2.9)*(1+Math.sin(time*3.7)*.025);for(const m of lanternMaterials)m.emissiveIntensity=.3+night*2;
    if(time-lastRipple>3.8){lastRipple=time;const f=koi[Math.floor(time)%koi.length];addRipple(f.group.position.x,f.group.position.z);}
    for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.age+=dt;const s=.08+Math.max(0,r.age)*.25;r.mesh.scale.set(s,1,s);r.mesh.material.opacity=r.age<0?0:Math.max(0,(1-r.age/3.3))*.29;if(r.age>3.3){root.remove(r.mesh);r.mesh.material.dispose();ripples.splice(i,1);}}
  }
  update(0,0,0);
  return {root,water,koi,feed,update,inPond,stats:{blossoms:canopies.length*440,koi:koi.length}};
}

function buildBridge(root) {
  const g=new THREE.Group();g.position.set(.88,.66,.05);root.add(g);
  const half=1.95,width=1.37;
  const h=x=>.10+.64*(1-(x/half)**2);
  const wood=['#a95136','#ae573b','#b75f40','#bd6847','#a9553c'];
  const n=22;
  for(let i=0;i<n;i++){
    const x=-half+(i+.5)*half*2/n;const m=box(g,wood[i%wood.length],[x,h(x),0],[half*2/n-.015,.115,width]);m.rotation.z=Math.atan(-1.28*x/(half*half));
    if(i%2===0){const grain=box(g,'#87412e',[x+.027,h(x)+.061,rand(-.15,.15)],[.008,.003,width*.68]);grain.rotation.z=m.rotation.z;}
    for(const z of [-.54,.54]){const nail=mesh(g,new THREE.CylinderGeometry(.016,.016,.005,5),mat('#554536'),[x,h(x)+.063,z]);nail.rotation.z=m.rotation.z;}
  }
  function curvedRail(z,offset,height,depth,color){
    const p=[],idx=[];for(let i=0;i<=40;i++){const x=-half+i/40*half*2,y=h(x)+offset;for(const [dy,dz]of [[-height/2,-depth/2],[height/2,-depth/2],[height/2,depth/2],[-height/2,depth/2]])p.push(x,y+dy,z+dz);if(i<40)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;idx.push(a,b,b+4,a,b+4,a+4);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,mat(color));
  }
  for(const z of [-width*.49,width*.49]){
    curvedRail(z,-.14,.26,.16,'#7d3e2b');curvedRail(z,.89,.14,.13,'#ae563d');curvedRail(z,.44,.105,.09,'#9e4a34');curvedRail(z,.17,.095,.10,'#93442e');
    for(let i=0;i<5;i++){
      const x=-half+i*half*.5,y=h(x);box(g,'#a14d34',[x,y+.48,z],[.15,1.10,.16]);box(g,'#bf7150',[x-.045,y+.49,z+.085],[.035,1.04,.017]);
      box(g,'#4d5145',[x,y+1.075,z],[.205,.065,.21]);mesh(g,new THREE.CylinderGeometry(.055,.136,.12,4),mat('#5b5c4e'),[x,y+1.16,z],[1,1,1]);
      box(g,'#863e2d',[x,y-.06,z],[.23,.17,.22]);
    }
    for(let i=0;i<8;i++){const x=-half+(i+.5)*half/2;box(g,'#a85538',[x,h(x)+.52,z],[.075,.63,.075]);}
  }
  // Broad blue-green landing stones at either end.
  for(const x of [-2.05,2.05]){const s=mesh(g,new THREE.CylinderGeometry(.63,.72,.19,7),mat('#889b80'),[x,-.05,0],[1,1,1.24]);s.rotation.y=.2;}
}

function buildPavilion(root,lights,glowMaterials) {
  const g=new THREE.Group();g.position.set(-3,.69,-2.12);root.add(g);
  const wood='#a8793c',lightWood='#b88b48',darkWood='#76532e';
  for(const x of [-1.21,0,1.21])for(const z of [-1.08,1.08]){mesh(g,new THREE.CylinderGeometry(.21,.26,.19,6),mat('#858a72'),[x,.06,z]);box(g,darkWood,[x,.19,z],[.2,.27,.20]);}
  for(const z of [-1.16,1.16])box(g,darkWood,[0,.26,z],[2.95,.19,.17]);
  for(const x of [-1.35,1.35])box(g,wood,[x,.3,0],[.16,.2,2.57]);
  for(let i=0;i<13;i++){
    const z=-1.21+(i+.5)*2.42/13;box(g,pick(['#ab8147','#b58a4f','#b99054','#a77c43']),[0,.37,z],[2.89,.105,.179]);
    for(let j=0;j<2;j++){const gx=rand(-1.1,1.1),length=rand(.2,.7);box(g,'#997441',[gx,.425,z+rand(-.06,.06)],[length,.0015,.007]);}
  }
  box(g,'#b58b4d',[0,.39,1.32],[3.03,.17,.15]);
  box(g,'#aa7c3d',[.25,.2,1.55],[.98,.13,.40]);box(g,'#ae8647',[.25,.07,1.8],[1.1,.12,.32]);
  for(const x of [-.15,.67])beam(g,[x,0,1.87],[x,.37,1.26],.09,darkWood);
  for(const x of [-1.22,1.22])for(const z of [-1.09,1.09]){
    box(g,wood,[x,1.68,z],[.21,2.61,.21]);box(g,lightWood,[x+.107,1.67,z+.025],[.019,2.56,.125]);
    box(g,darkWood,[x,.51,z],[.255,.17,.255]);
    box(g,'#bd9146',[x,2.83,z],[.37,.22,.35]);box(g,'#a47736',[x,2.99,z],[.49,.11,.40]);
    for(const dx of [-1,1]){beam(g,[x,2.50,z],[x+dx*.35,2.89,z],.115,lightWood);}
    for(const dz of [-1,1]){beam(g,[x,2.49,z],[x,2.87,z+dz*.32],.12,wood);}
  }
  for(const z of [-1.09,1.09]){box(g,'#a77b3d',[0,2.89,z],[2.94,.22,.20]);box(g,'#ca9c4e',[0,2.77,z+.04],[2.55,.065,.16]);}
  for(const x of [-1.22,1.22])box(g,wood,[x,2.88,0],[.22,.24,2.73]);
  function railing(a,b){beam(g,[a[0],.99,a[1]],[b[0],.99,b[1]],.09,'#886635');beam(g,[a[0],.61,a[1]],[b[0],.61,b[1]],.075,'#916c37');for(let i=0;i<=6;i++){const t=i/6;box(g,'#8e6733',[THREE.MathUtils.lerp(a[0],b[0],t),.78,THREE.MathUtils.lerp(a[1],b[1],t)],[.066,.57,.066]);}}
  railing([-1.22,-1.09],[1.22,-1.09]);railing([-1.22,-1.09],[-1.22,1.09]);railing([1.22,-1.09],[1.22,.63]);railing([-1.22,1.09],[-.6,1.09]);
  // Exposed rafters beneath a four-sided, genuinely curved hip roof.
  beam(g,[-1.27,2.93,0],[0,3.83,0],.13,darkWood);beam(g,[1.27,2.93,0],[0,3.83,0],.13,darkWood);
  box(g,darkWood,[0,3.73,0],[1.2,.15,.17]);
  const roofPalette=['#415561','#4b606b','#516771','#3d515c','#586d75','#465c66'];
  function roofPoint(side,u,t,offset=0){const halfW=.58+(1.95-.58)*t;const h=4.03-1.39*t+.35*t**4+.16*Math.abs(u)**5*t*t+offset;
    if(side===0||side===1)return [u*halfW,h,(side===0?1:-1)*1.77*t];
    return [(side===2?1:-1)*(.58+1.37*t),h,u*1.77*t];
  }
  for(let side=0;side<4;side++){
    const cols=side<2?16:13,rows=8;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const u0=-1+c/cols*2,u1=-1+(c+1)/cols*2,t0=r/rows,t1=(r+1)/rows;
      const ps=[roofPoint(side,u0,t0),roofPoint(side,u1,t0),roofPoint(side,u1,t1),roofPoint(side,u0,t1)];
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(ps.flat(),3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();const material=mat(roofPalette[(r*3+c+side)%roofPalette.length]);material.side=THREE.DoubleSide;mesh(g,geo,material);
    }
    for(let c=0;c<=cols;c++){
      const u=-1+c/cols*2;
      for(let r=0;r<rows;r++){
        const t0=r/rows+.008,t1=(r+1)/rows+.005;
        // Half-round overlapping tile channels; eight separate pieces per run.
        const a=roofPoint(side,u,t0,.03),b=roofPoint(side,u,t1,.03),radius=(.035+.036*((t0+t1)/2));
        cylinder(g,a,b,radius*1.06,radius,roofPalette[(c+r+side)%roofPalette.length],7);
        const seamA=roofPoint(side,u,t1-.018,.032),seamB=roofPoint(side,u,t1,.032);cylinder(g,seamA,seamB,radius*1.14,radius*1.14,'#677983',7);
      }
    }
    const edge=Array.from({length:21},(_,i)=>roofPoint(side,-1+i/10,1,-.05));tube(g,edge,.075,'#394b53',30,6);
    for(let i=0;i<8;i++){const u=-.9+i/7*1.8;for(let j=0;j<6;j++){const t0=.15+j*.15,t1=t0+.15;beam(g,roofPoint(side,u,t0,-.17),roofPoint(side,u,t1,-.17),.095,'#846331',.075);}}
  }
  for(const side of [0,1])for(const u of [-1,1]){
    const points=Array.from({length:16},(_,i)=>roofPoint(side,u,i/15,.085));tube(g,points,.092,'#3b4f5a',24,8);
    for(let i=1;i<=7;i++){const t=i/7;cylinder(g,roofPoint(side,u,t-.018,.086),roofPoint(side,u,t+.006,.086),.10,.10,'#667781',8);}
    const end=roofPoint(side,u,1.035,.09);cylinder(g,roofPoint(side,u,.94,.085),end,.11,.125,'#3e535f',8);
  }
  cylinder(g,[-.7,4.14,0],[.7,4.14,0],.105,.105,'#4c606a',8);
  for(let i=0;i<6;i++)cylinder(g,[-.7+i*.28,4.14,0],[-.67+i*.28,4.14,0],.114,.114,'#78858a',8);
  // Small brass lantern suspended from the open eave.
  cylinder(g,[0,2.79,1.1],[0,2.56,1.1],.015,.015,'#6f5936',6);
  const glow=new THREE.MeshStandardMaterial({color:'#edc479',emissive:'#ffb63e',emissiveIntensity:.3,roughness:.55});glowMaterials.push(glow);
  mesh(g,new THREE.SphereGeometry(.105,8,6),glow,[0,2.47,1.1],[.8,1.25,.8]);
  for(const y of [2.38,2.56])mesh(g,new THREE.CylinderGeometry(.085,.085,.025,8),mat('#9b7438'),[0,y,1.1]);
  const light=new THREE.PointLight('#ffbb61',.12,4,2);light.position.set(0,2.4,1.15);g.add(light);lights.push(light);
}

function buildLantern(root,lights,glowMaterials) {
  const g=new THREE.Group();g.position.set(-4.42,.68,.43);g.rotation.y=.1;root.add(g);
  const stone='#9d9f83',edge='#8a9078';
  mesh(g,new THREE.CylinderGeometry(.46,.51,.16,6),mat(edge),[0,.08,0]);
  box(g,stone,[0,.2,0],[.67,.15,.65]);box(g,edge,[0,.68,0],[.39,.87,.39]);
  // Shallow, inset carved cartouches on the stone stem.
  box(g,'#838b71',[0,.68,.200],[.23,.46,.012]);box(g,'#969d80',[0,.68,.209],[.185,.40,.01]);
  const carve=mat('#79836b');mesh(g,new THREE.TorusGeometry(.077,.012,3,8),carve,[0,.78,.218],[1,1.2,1]);
  beam(g,[-.06,.59,.22],[.06,.63,.22],.012,'#79836b');beam(g,[.06,.63,.22],[-.04,.68,.22],.012,'#79836b');
  box(g,stone,[0,1.17,0],[.75,.15,.70]);box(g,'#afb095',[0,1.28,0],[.65,.08,.6]);
  box(g,'#666e58',[0,1.33,0],[.48,.055,.44]);
  for(const x of [-.235,.235])for(const z of [-.22,.22])box(g,'#b2b297',[x,1.58,z],[.12,.51,.12]);
  box(g,edge,[0,1.85,0],[.73,.095,.68]);
  const glow=new THREE.MeshStandardMaterial({color:'#f1d28a',emissive:'#ffb544',emissiveIntensity:.4,roughness:.5});glowMaterials.push(glow);
  mesh(g,new THREE.CylinderGeometry(.11,.125,.25,8),glow,[0,1.49,0]);
  const light=new THREE.PointLight('#ffc16d',.2,4.5,2);light.position.set(0,1.6,.1);g.add(light);lights.push(light);
  // A broad concave cap, with beveled hips and an ornamental finial.
  const verts=[],idx=[],rings=[[.65,1.84],[.63,1.94],[.34,2.07],[.14,2.3]];
  for(const [r,y]of rings)for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;verts.push(Math.cos(a)*r,y,Math.sin(a)*r);}
  for(let j=0;j<3;j++)for(let i=0;i<4;i++){const a=j*4+i,b=j*4+(i+1)%4;idx.push(a,b+4,b,a,a+4,b+4);}idx.push(12,14,13,12,15,14);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,mat('#aaad91'));
  for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;beam(g,[Math.cos(a)*.13,2.30,Math.sin(a)*.13],[Math.cos(a)*.6,1.94,Math.sin(a)*.6],.017,'#c1c2a8');}
  box(g,edge,[0,2.29,0],[.27,.09,.27]);mesh(g,new THREE.CylinderGeometry(.1,.15,.11,7),mat('#b9b99d'),[0,2.39,0]);mesh(g,ico,mat('#b5b89a'),[0,2.53,0],[.13,.16,.13]);mesh(g,new THREE.ConeGeometry(.075,.16,7),mat('#c0c1a4'),[0,2.69,0]);
}

function buildKoi(index) {
  const group=new THREE.Group();group.name=`Koi ${index+1}`;group.scale.setScalar(index===0?1.12:index===4?.78:.96);
  const positions=[],colors=[],indices=[],rings=19,sides=12;
  const white=new THREE.Color('#eee2c3'),orange=new THREE.Color(index%3===0?'#d57132':'#eb873a'),black=new THREE.Color('#36493f');
  for(let j=0;j<=rings;j++){
    const t=j/rings,z=.43-t*.86,w=Math.sin(Math.PI*t)**.62*.135*(1-t*.40)+.009;
    for(let k=0;k<=sides;k++){
      const a=k/sides*TAU;positions.push(Math.cos(a)*w,Math.sin(a)*w*.62,z);
      let c=white;const patch=Math.sin(t*23+index*3+Math.cos(a)*1.4)+Math.cos(a*3+t*17+index);
      if(index===2)c=patch>.15?orange:white;else if(index===4)c=patch>-.7?orange:black;else if(patch>.4)c=orange;else if(patch<-.85&&index!==1)c=black;
      const shade=.86+.14*(Math.sin(a)*.5+.5);colors.push(c.r*shade,c.g*shade,c.b*shade);
      if(j<rings&&k<sides){const n=j*(sides+1)+k;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const body=mesh(group,geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,flatShading:false}),[0,0,0],[1,1,1],false);body.renderOrder=1;
  const tail=new THREE.Group();tail.position.z=-.39;group.add(tail);
  const finMat=new THREE.MeshStandardMaterial({color:index%2?'#d6c99e':'#e8aa6c',roughness:.6,side:THREE.DoubleSide});
  function fin(parent,points){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return mesh(parent,g,finMat,[0,0,0],[1,1,1],false);}
  fin(tail,[[0,.015,0],[-.14,.025,-.2],[0,.01,-.13],[.14,.025,-.2]]);
  const fins=[];
  for(const sign of [-1,1]){
    const f=fin(group,[[sign*.085,.0,.17],[sign*.245,-.035,.04],[sign*.21,-.025,-.055],[sign*.085,0,.02]]);fins.push(f);
    mesh(group,new THREE.SphereGeometry(.017,6,5),mat('#263b30'),[sign*.061,.047,.323],[1,1,1],false);
    tube(group,[[sign*.025,.006,.42],[sign*.055,.01,.46],[sign*.075,.012,.47]],.004,'#ead6af',4,3);
  }
  fin(group,[[0,.08,.1],[0,.15,-.10],[0,.105,-.24],[0,.04,-.28]]);
  return {group,tail,fins,initialized:false};
}
