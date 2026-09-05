import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { SolidBatch, V, rand, random } from './world/geometry.js';
import { createLandscape } from './world/landscape.js';
import { createArchitecture } from './world/architecture.js';
import { Foliage } from './world/foliage.js';
import { createTree } from './world/tree.js';

const container = document.querySelector('#scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
const daylightBackground = new THREE.Color('#e9e8df');
const duskBackground = new THREE.Color('#293d40');
scene.background = daylightBackground.clone();
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'The Forgotten Gate. Drag to rotate the diorama; scroll or pinch to zoom.');
renderer.domElement.setAttribute('role', 'img');
renderer.domElement.tabIndex = 0;

const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, .1, 100);
const initialPosition = V(11, 15.5, 17);
const initialTarget = V(0, 2.85, 0);
camera.position.copy(initialPosition);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(initialTarget);
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.enablePan = false;
controls.minZoom = .72; controls.maxZoom = 1.9;
controls.minPolarAngle = Math.PI * .17; controls.maxPolarAngle = Math.PI * .46;
controls.autoRotate = false; controls.autoRotateSpeed = .32;
controls.rotateSpeed = .65;
controls.zoomSpeed = .7;
controls.update();

const hemi = new THREE.HemisphereLight('#f5f1d7', '#6c7861', 1.35);scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0cc', 2.65);sun.position.set(-3, 14, 6);sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -10;sun.shadow.camera.right = 10;sun.shadow.camera.top = 12;sun.shadow.camera.bottom = -9;
sun.shadow.camera.near = .5;sun.shadow.camera.far = 35;
sun.shadow.normalBias = .035;sun.shadow.bias = -.00015;
sun.shadow.radius = 4;sun.shadow.blurSamples = 8;sun.target.position.set(0, 2, 0);scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight('#cddde0', .7);fill.position.set(6, 6, -7);scene.add(fill);
const bounce = new THREE.DirectionalLight('#d5d9a2', .25);bounce.position.set(1, 2, 10);scene.add(bounce);
const groundMaterial = new THREE.MeshStandardMaterial({ color: '#e9e8df', roughness: 1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMaterial);ground.rotation.x = -Math.PI / 2;ground.position.y = -.865;ground.receiveShadow = true;scene.add(ground);

// A soft, layered contact shadow anchors the cutaway without an abrupt edge.
const shadowCanvas = document.createElement('canvas');shadowCanvas.width = shadowCanvas.height = 128;
const ctx = shadowCanvas.getContext('2d');
const gradient = ctx.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'rgba(24,34,22,0.33)');gradient.addColorStop(.55,'rgba(24,34,22,0.18)');gradient.addColorStop(1,'rgba(24,34,22,0)');ctx.fillStyle = gradient;ctx.fillRect(0,0,128,128);
const contact = new THREE.Mesh(new THREE.PlaneGeometry(14,12),new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false }));contact.rotation.x=-Math.PI/2;contact.position.set(.4,-.849,.3);scene.add(contact);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const ao = new SSAOPass(scene,camera,innerWidth,innerHeight,16);
ao.kernelRadius = .38;ao.minDistance = .002;ao.maxDistance = .16;
composer.addPass(ao);
composer.addPass(new OutputPass());
composer.addPass(new SMAAPass());

const solid = new SolidBatch(scene);
const foliage = new Foliage(scene,solid);
createLandscape(solid);
const architecture = createArchitecture(solid);
createTree(solid,foliage);
foliage.populate(architecture);
solid.finish();foliage.finish();

// Slowly drifting pollen. At dusk these become the gate's fireflies.
const particleCount=64, particlePositions=new Float32Array(particleCount*3),particleSeeds=[];
for(let i=0;i<particleCount;i++) {
  particleSeeds.push({x:rand(-4.5,4.5),y:rand(.8,6.5),z:rand(-3,3.7),phase:rand(0,6.28),speed:rand(.07,.18)});
}
const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
const particleCanvas=document.createElement('canvas');particleCanvas.width=particleCanvas.height=32;const pc=particleCanvas.getContext('2d');const pg=pc.createRadialGradient(16,16,0,16,16,16);pg.addColorStop(0,'#ffffff');pg.addColorStop(.15,'#fffed6');pg.addColorStop(.5,'rgba(255,247,178,.2)');pg.addColorStop(1,'rgba(255,247,178,0)');pc.fillStyle=pg;pc.fillRect(0,0,32,32);
const particleMat=new THREE.PointsMaterial({color:'#ffffcd',size:.055,map:new THREE.CanvasTexture(particleCanvas),transparent:true,opacity:.58,depthWrite:false,blending:THREE.AdditiveBlending});
const particles=new THREE.Points(particleGeo,particleMat);scene.add(particles);
const glow=new THREE.PointLight('#d9ee87',0,5,2);glow.position.set(.5,2.6,-.8);scene.add(glow);

// Two small butterflies orbit the fern beds, each with hinged, flapping wings.
const butterflies=[];
for(let i=0;i<2;i++) {
  const root=new THREE.Group(), wings=[];
  for(const sign of [-1,1]) {
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(sign*.13,.16,sign*.25,.06,sign*.14,-.02);shape.bezierCurveTo(sign*.22,-.13,sign*.05,-.18,0,-.035);
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape,6),new THREE.MeshStandardMaterial({color:i?'#d4ba65':'#c0cb8b',side:THREE.DoubleSide,roughness:1}));mesh.rotation.x=-Math.PI/2;root.add(mesh);wings.push(mesh);
  }
  scene.add(root);butterflies.push({root,wings,phase:i*3.4});
}

function resize() {
  const width=container.clientWidth,height=container.clientHeight,aspect=width/height;
  let frustum=15.1;
  if(aspect<.8)frustum=13.4/aspect;
  else if(aspect<1.15)frustum=15.8;
  camera.left=-frustum*aspect/2;camera.right=frustum*aspect/2;camera.top=frustum/2;camera.bottom=-frustum/2;
  const offsetX=width>1050?-.12*width:width>650?-.075*width:0;
  const offsetY=width<=650?-.055*height:.025*height;
  camera.setViewOffset(width,height,offsetX,offsetY,width,height);
  camera.updateProjectionMatrix();renderer.setSize(width,height);composer.setSize(width,height);
  ao.enabled=width>650;
  ao.setSize(Math.round(width*.7),Math.round(height*.7));
}
window.addEventListener('resize',resize);resize();

let dusk=false,lightMix=0,resetting=false,resetStart=0,fromPosition=V(),fromTarget=V(),fromZoom=1;
const rotateButton=document.querySelector('#rotate-toggle');
const lightButton=document.querySelector('#light-toggle');
rotateButton.addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;rotateButton.setAttribute('aria-pressed',String(controls.autoRotate));});
lightButton.addEventListener('click',()=>{
  dusk=!dusk;lightButton.setAttribute('aria-pressed',String(dusk));lightButton.setAttribute('aria-label',dusk?'Switch to daylight':'Switch to dusk');document.querySelector('#light-label').textContent=dusk?'Dusk':'Daylight';document.body.classList.toggle('dusk',dusk);
});
function resetView() {
  controls.autoRotate=false;rotateButton.setAttribute('aria-pressed','false');
  if(reducedMotion){camera.position.copy(initialPosition);controls.target.copy(initialTarget);camera.zoom=1;camera.updateProjectionMatrix();controls.update();return;}
  fromPosition.copy(camera.position);fromTarget.copy(controls.target);fromZoom=camera.zoom;resetStart=performance.now();resetting=true;
}
document.querySelector('#reset-view').addEventListener('click',resetView);
controls.addEventListener('start',()=>{resetting=false;});
const notesButton=document.querySelector('#story-toggle');
notesButton.addEventListener('click',()=>{const open=notesButton.getAttribute('aria-expanded')==='true';notesButton.setAttribute('aria-expanded',String(!open));document.querySelector('#story').hidden=open;});
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'){document.querySelector('#story').hidden=true;notesButton.setAttribute('aria-expanded','false');}
  if(event.target!==renderer.domElement)return;
  if(event.key==='Home'){event.preventDefault();resetView();}
  if(event.key==='+'||event.key==='='){camera.zoom=Math.min(controls.maxZoom,camera.zoom*1.12);camera.updateProjectionMatrix();}
  if(event.key==='-'){camera.zoom=Math.max(controls.minZoom,camera.zoom/1.12);camera.updateProjectionMatrix();}
  if(event.key==='ArrowLeft'||event.key==='ArrowRight') {
    event.preventDefault();const relative=camera.position.clone().sub(controls.target);relative.applyAxisAngle(V(0,1,0),event.key==='ArrowLeft'?.12:-.12);camera.position.copy(relative.add(controls.target));controls.update();
  }
});
let toastTimer;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2600);}
document.querySelector('#capture').addEventListener('click',()=>{
  composer.render();renderer.domElement.toBlob(blob=>{if(!blob){toast('The postcard could not be saved. Please try again.');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`the-forgotten-gate-${dusk?'dusk':'daylight'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('A little piece of quiet, saved.');},'image/png');
});

let previous=performance.now(),elapsed=0,ready=false;
const daySun=new THREE.Color('#fff0cc'),nightSun=new THREE.Color('#a9c3e4');
const dayHemi=new THREE.Color('#f5f1d7'),nightHemi=new THREE.Color('#95b9cc');
function animate(now) {
  requestAnimationFrame(animate);
  const realDt=Math.min((now-previous)/1000,1);
  const dt=Math.min(realDt,.05);previous=now;if(!reducedMotion)elapsed+=dt;
  foliage.time.value=elapsed;
  if(resetting) {
    const t=Math.min((now-resetStart)/1000,1),ease=1-Math.pow(1-t,3);
    camera.position.lerpVectors(fromPosition,initialPosition,ease);controls.target.lerpVectors(fromTarget,initialTarget,ease);camera.zoom=THREE.MathUtils.lerp(fromZoom,1,ease);camera.updateProjectionMatrix();if(t===1)resetting=false;
  }
  controls.update(dt);
  lightMix=THREE.MathUtils.damp(lightMix,dusk?1:0,3,realDt);
  scene.background.lerpColors(daylightBackground,duskBackground,lightMix);
  groundMaterial.color.copy(scene.background);
  sun.color.lerpColors(daySun,nightSun,lightMix);sun.intensity=THREE.MathUtils.lerp(2.65,1.1,lightMix);
  hemi.color.lerpColors(dayHemi,nightHemi,lightMix);hemi.intensity=THREE.MathUtils.lerp(1.35,.85,lightMix);
  fill.intensity=THREE.MathUtils.lerp(.7,.7,lightMix);bounce.intensity=THREE.MathUtils.lerp(.25,.08,lightMix);
  glow.intensity=lightMix*2.2;particleMat.size=.055+lightMix*.055;particleMat.opacity=.48+lightMix*.5;
  for(let i=0;i<particleCount;i++) {
    const p=particleSeeds[i];particlePositions[i*3]=p.x+Math.sin(elapsed*p.speed+p.phase)*.35;particlePositions[i*3+1]=p.y+Math.sin(elapsed*.23+p.phase)*.24;particlePositions[i*3+2]=p.z+Math.cos(elapsed*p.speed+p.phase)*.24;
  }
  particleGeo.attributes.position.needsUpdate=true;
  for(const b of butterflies) {
    const t=elapsed*.42+b.phase;b.root.position.set(Math.sin(t)*1.8+1.1,1.45+Math.sin(t*1.9)*.28,2.8+Math.cos(t)*.8);b.root.rotation.y=-t;b.root.visible=lightMix<.65;
    b.wings[0].rotation.y=Math.sin(elapsed*10+b.phase)*.75;b.wings[1].rotation.y=-Math.sin(elapsed*10+b.phase)*.75;
  }
  composer.render();
  if(!ready){ready=true;document.querySelector('#loading').classList.add('loaded');window.setTimeout(()=>document.querySelector('#loading').remove(),900);window.__DIORAMA_READY__=true;}
}
requestAnimationFrame(animate);
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();toast('Graphics paused. Reload the page to return to the forest.');});
// Read-only diagnostics for the local smoke tests.
window.__diorama={renderer,scene,camera,controls,get dusk(){return dusk;}};
