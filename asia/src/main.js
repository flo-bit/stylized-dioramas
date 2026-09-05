import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createGarden } from './garden.js';
import { GardenAudio } from './audio.js';

const $ = id => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
const dayBackground = new THREE.Color('#e8e9e1'), nightBackground = new THREE.Color('#253846');
scene.background = dayBackground.clone();
scene.fog = new THREE.Fog(dayBackground, 34, 75);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  $('loading').innerHTML = '<div class="loading-seal">木</div><span>This little garden needs WebGL.</span><span>Please enable hardware acceleration, then refresh.</span>';
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
// Only static geometry casts shadows; koi, petals and fireflies do not.
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('scene').appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'Komorebi, an interactive Japanese garden');
renderer.domElement.setAttribute('tabindex', '0');

const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, .1, 110);
const homePosition = new THREE.Vector3(10.4, 16, 17.5);
const homeTarget = new THREE.Vector3(0, 1.7, 0);
camera.position.copy(homePosition);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(homeTarget);
controls.enableDamping = true; controls.dampingFactor = .065;
controls.enablePan = false;
controls.minZoom = .72; controls.maxZoom = 2.35;
controls.minPolarAngle = Math.PI * .13; controls.maxPolarAngle = Math.PI * .445;
controls.rotateSpeed = .6; controls.zoomSpeed = .75;
controls.touches.ONE = THREE.TOUCH.ROTATE; controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
controls.update();

const hemi = new THREE.HemisphereLight('#f8f2db', '#879275', 1.65); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d2', 2.65);
sun.position.set(-3.5, 11, 6); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -8;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 30;
sun.shadow.normalBias = .025; sun.shadow.bias = -.00012; sun.shadow.radius = 4;
sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight('#d9e5ed', .7);fill.position.set(6, 5, -7);scene.add(fill);

const floorMaterial = new THREE.MeshStandardMaterial({color:'#e1e3d9',roughness:1});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.77;floor.receiveShadow=true;scene.add(floor);
// A baked radial contact shadow grounds the island without postprocessing blur.
const shadowCanvas = document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(128,128,35,128,128,127);
gradient.addColorStop(0,'rgba(29,42,25,.47)');gradient.addColorStop(.65,'rgba(29,42,25,.30)');gradient.addColorStop(1,'rgba(29,42,25,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
const contact=new THREE.Mesh(new THREE.PlaneGeometry(15,14),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.set(.25,-.754,.15);scene.add(contact);

const garden = createGarden(scene);
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth,window.innerHeight,{type:THREE.HalfFloatType,samples:4});
const composer = new EffectComposer(renderer,renderTarget);
composer.addPass(new RenderPass(scene,camera));
const ao = new SSAOPass(scene,camera,window.innerWidth,window.innerHeight,16);
ao.kernelRadius=.38;ao.minDistance=.0007;ao.maxDistance=.025;
ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA=0;ao.depthRenderMaterial.defines.PERSPECTIVE_CAMERA=0;
composer.addPass(ao);composer.addPass(new OutputPass());
renderer.info.autoReset=false;
const sound = new GardenAudio();
let paused = reducedMotion, simTime = 0, nightAmount = 0, nightTarget = 0, resetTween = null;
let toastTimer;
function toast(message) { $('toast').textContent=message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3400); }
function updatePauseButton(){ $('pause').classList.toggle('paused',paused);$('pause').setAttribute('aria-pressed',String(paused));$('pause').setAttribute('aria-label',paused?'Resume animation':'Pause animation'); }
updatePauseButton();
function setNight(value) {
  nightTarget=value?1:0;
  document.body.classList.toggle('night',value);
  $('day').classList.toggle('active',!value);$('night').classList.toggle('active',value);
  $('day').setAttribute('aria-pressed',String(!value));$('night').setAttribute('aria-pressed',String(value));
}
$('day').addEventListener('click',()=>setNight(false));$('night').addEventListener('click',()=>setNight(true));
$('pause').addEventListener('click',()=>{paused=!paused;updatePauseButton();toast(paused?'A moment, held still.':'Let the little world move.');});
function feed(x,z) { if(paused){paused=false;updatePauseButton();}garden.feed(x,z);toast('A little kindness. The koi are on their way.'); }
$('feed').addEventListener('click',()=>feed(.55,2.5));
function resetView() {
  resetTween={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom,progress:0};
  toast('Back to your quiet corner.');
}
$('reset').addEventListener('click',resetView);
controls.addEventListener('start',()=>{resetTween=null;});
$('sound').addEventListener('click',async()=>{
  try {const enabled=await sound.toggle();$('sound').classList.toggle('sound-on',enabled);$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'Mute garden sounds':'Enable garden sounds');$('sound').querySelector('span').textContent=enabled?'Sound on':'Sound off';}
  catch {toast('Garden sounds are not available in this browser.');}
});
$('capture').addEventListener('click',()=>{
  composer.render();
  renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`komorebi-${nightTarget?'blue-hour':'daylight'}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('A little stillness, saved.');},'image/png');
});
const about=$('about');$('about-open').addEventListener('click',()=>about.showModal());$('about-close').addEventListener('click',()=>about.close());
about.addEventListener('click',event=>{if(event.target===about){const r=about.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)about.close();}});
window.addEventListener('keydown',event=>{
  if(about.open || event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName))return;
  if(event.code==='Space'){event.preventDefault();$('pause').click();}
  if(event.key.toLowerCase()==='f')feed(.55,2.5);
  if(event.key.toLowerCase()==='r')resetView();
});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
renderer.domElement.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY,time:performance.now()};});
renderer.domElement.addEventListener('pointerup',event=>{
  if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6||performance.now()-pointerStart.time>500)return;
  pointer.x=event.clientX/window.innerWidth*2-1;pointer.y=-event.clientY/window.innerHeight*2+1;raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(garden.water)[0];if(hit&&garden.inPond(hit.point.x,hit.point.z,-.15))feed(hit.point.x,hit.point.z);
  pointerStart=null;
});
renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;});

function resize() {
  const width=window.innerWidth,height=window.innerHeight,aspect=width/height;
  renderer.setSize(width,height);composer.setSize(width,height);
  const aoScale=renderer.getPixelRatio()*.75;
  ao.setSize(Math.round(width*aoScale),Math.round(height*aoScale));
  // Leave room for the editorial heading on desktop and above the garden on touch screens.
  let viewHeight,shiftX,shiftY;
  if(aspect<.85){viewHeight=14.8/aspect;shiftX=0;shiftY=1.0;}
  else if(aspect<1.2){viewHeight=17.7;shiftX=-.65;shiftY=.0;}
  else{viewHeight=14.8;shiftX=-1.5;shiftY=-.02;}
  const viewWidth=viewHeight*aspect;
  camera.left=-viewWidth/2+shiftX;camera.right=viewWidth/2+shiftX;camera.top=viewHeight/2+shiftY;camera.bottom=-viewHeight/2+shiftY;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();
const dayHemi=new THREE.Color('#f8f2db'),nightHemi=new THREE.Color('#97b5d2');
const dayGround=new THREE.Color('#879275'),nightGround=new THREE.Color('#455b65');
const daySun=new THREE.Color('#fff0d2'),nightSun=new THREE.Color('#b3cce6');
const dayFloor=new THREE.Color('#e1e3d9'),nightFloor=new THREE.Color('#344957');
let lastTime=performance.now(),frame=0;
function animate(now) {
  requestAnimationFrame(animate);
  const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
  if(document.hidden)return;
  const transition=1-Math.exp(-dt*1.55);nightAmount=THREE.MathUtils.lerp(nightAmount,nightTarget,transition);
  scene.background.copy(dayBackground).lerp(nightBackground,nightAmount);scene.fog.color.copy(scene.background);
  floorMaterial.color.copy(dayFloor).lerp(nightFloor,nightAmount);
  hemi.color.copy(dayHemi).lerp(nightHemi,nightAmount);hemi.groundColor.copy(dayGround).lerp(nightGround,nightAmount);hemi.intensity=THREE.MathUtils.lerp(1.65,1.15,nightAmount);
  sun.color.copy(daySun).lerp(nightSun,nightAmount);sun.intensity=THREE.MathUtils.lerp(2.65,.95,nightAmount);fill.intensity=THREE.MathUtils.lerp(.7,1.0,nightAmount);
  renderer.toneMappingExposure=THREE.MathUtils.lerp(1.08,1.15,nightAmount);
  if(resetTween){const r=resetTween;r.progress=Math.min(1,r.progress+dt*1.4);const t=1-(1-r.progress)**3;camera.position.lerpVectors(r.position,homePosition,t);controls.target.lerpVectors(r.target,homeTarget,t);camera.zoom=THREE.MathUtils.lerp(r.zoom,1,t);camera.updateProjectionMatrix();if(r.progress===1)resetTween=null;}
  controls.update();
  if(!paused)simTime+=dt;
  garden.update(simTime,paused?0:dt,nightAmount);
  renderer.info.reset();composer.render();
  if(++frame===3){$('loading').classList.add('loaded');document.body.dataset.ready='true';}
}
requestAnimationFrame(animate);
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();if(document.hidden)sound.suspend();else sound.resume();});
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();toast('The garden is taking a breath. Restoring the view…');});
renderer.domElement.addEventListener('webglcontextrestored',()=>{renderer.shadowMap.needsUpdate=true;toast('Welcome back.');});
// A read-only diagnostic snapshot, useful for the standalone smoke test.
window.__garden = {get ready(){return frame>2;},get paused(){return paused;},get time(){return simTime;},get night(){return nightAmount;},get fishCount(){return garden.koi.length;},get drawCalls(){return renderer.info.render.calls;},get triangles(){return renderer.info.render.triangles;},get camera(){return {position:camera.position.toArray(),zoom:camera.zoom};}};
