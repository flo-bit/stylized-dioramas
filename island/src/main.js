import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createTerrain, createRocks } from './scene/terrain.js';
import { createWater } from './scene/water.js';
import { createFoliage } from './scene/foliage.js';
import { createDock, createBoat, createChair, createUmbrella, createCrate, createBeachDetails } from './scene/props.js';
import { batch } from './scene/optimize.js';
import { createPostprocessing } from './scene/postprocessing.js';
import './style.css';

const canvas = document.querySelector('#scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
} catch (error) {
  document.querySelector('#error').hidden = false;
  document.querySelector('#loading').style.display = 'none';
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .94;
const scene = new THREE.Scene();
const dayBackground = new THREE.Color('#cbd6d5'), goldenBackground = new THREE.Color('#e0cfb7');
scene.background = dayBackground.clone();
scene.fog = new THREE.Fog(dayBackground, 36, 86);
const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, .1, 120);
const defaultPosition = new THREE.Vector3(10, 17.5, 18.5), defaultTarget = new THREE.Vector3(0, 1.25, 0);
camera.position.copy(defaultPosition);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(defaultTarget);
controls.enableDamping = true; controls.dampingFactor = .065;
controls.minPolarAngle = .3; controls.maxPolarAngle = Math.PI / 2.35;
controls.minZoom = .65; controls.maxZoom = 2.2;
controls.enablePan = false; controls.rotateSpeed = .55; controls.zoomSpeed = .75;
controls.autoRotateSpeed = .45;
controls.update();

const hemi = new THREE.HemisphereLight('#ecf7f3', '#a99d7c', 1.35); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1d5', 2.65); sun.position.set(-6, 12, -5); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -12; sun.shadow.camera.right = 12; sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
sun.shadow.camera.near = .5; sun.shadow.camera.far = 35; sun.shadow.normalBias = .025; sun.shadow.bias = -.00012; sun.shadow.radius = 4; sun.shadow.blurSamples = 8;
scene.add(sun);
const fill = new THREE.DirectionalLight('#d6eff3', .55); fill.position.set(7, 5, -8); scene.add(fill);
const pmrem = new THREE.PMREMGenerator(renderer);
const environment = new RoomEnvironment(); const envMap = pmrem.fromScene(environment, .04);
scene.environment = envMap.texture; scene.environmentIntensity = .16;
environment.dispose(); pmrem.dispose();
const floorMaterial = new THREE.MeshStandardMaterial({ color: '#d5dfdc', roughness: 1 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMaterial); floor.rotation.x = -Math.PI / 2; floor.position.y = -.81; floor.receiveShadow = true; scene.add(floor);

const island = new THREE.Group(); scene.add(island);
const terrain = new THREE.Group(); island.add(terrain); const outline = createTerrain(terrain); batch(terrain);
const rocks = new THREE.Group(); island.add(rocks); createRocks(rocks); batch(rocks);
const water = createWater(island, outline);
const foliage = createFoliage(island); batch(foliage.ground); foliage.palms.forEach(batch);
const dock = createDock(island), boat = createBoat(island), chair = createChair(island), umbrella = createUmbrella(island), crate = createCrate(island);
[dock, boat.object, chair, umbrella, crate].forEach(batch);
const beach = new THREE.Group(); island.add(beach); createBeachDetails(beach); batch(beach);
const interactiveObjects = [dock, boat.object, chair, umbrella, crate, ...foliage.palms];
const post = createPostprocessing(renderer, scene, camera);

let playing = !reducedMotion, golden = false, lightMix = 0, sceneTime = 0, resetAnimation = null, needsRender = true;
const motionButton = document.querySelector('#motion-toggle'), rotateButton = document.querySelector('#rotate-toggle'), lightButton = document.querySelector('#light-toggle');
function setPressed(button, pressed) { button.classList.toggle('active', pressed); button.setAttribute('aria-pressed', String(pressed)); }
setPressed(motionButton, playing);
function toggleMotion() { playing = !playing; setPressed(motionButton, playing); toast(playing ? 'A little movement. A little life.' : 'A moment, held still.'); }
function toggleRotate() { controls.autoRotate = !controls.autoRotate; setPressed(rotateButton, controls.autoRotate); }
function toggleLight() {
  golden = !golden; setPressed(lightButton, golden); document.body.classList.toggle('golden', golden);
  document.querySelector('#light-label').textContent = golden ? 'Golden hour' : 'Daylight';
  lightButton.title = golden ? 'Switch to daylight (L)' : 'Switch to golden hour (L)';
  toast(golden ? 'The best hour has no appointments.' : 'Another perfect, ordinary day.');
}
function resetView() {
  controls.autoRotate = false; setPressed(rotateButton, false);
  resetAnimation = { from: camera.position.clone(), target: controls.target.clone(), zoom: camera.zoom, start: performance.now() };
  if (reducedMotion) { camera.position.copy(defaultPosition); controls.target.copy(defaultTarget); camera.zoom = 1; camera.updateProjectionMatrix(); controls.update(); resetAnimation = null; }
  toast('Back to your little corner of the world.');
}
motionButton.addEventListener('click', toggleMotion); rotateButton.addEventListener('click', toggleRotate); lightButton.addEventListener('click', toggleLight); document.querySelector('#reset').addEventListener('click', resetView);
controls.addEventListener('start', () => { resetAnimation = null; hideTag(); });
let toastTimer;
function toast(text) { const t = document.querySelector('#toast'); t.textContent = text; t.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('visible'), 2800); }

async function capture() {
  post.render();
  const postcard = document.createElement('canvas'); postcard.width = canvas.width; postcard.height = canvas.height;
  const ctx = postcard.getContext('2d'); ctx.drawImage(canvas, 0, 0);
  const pad = postcard.width * .035;
  ctx.fillStyle = golden ? '#655445' : '#344d49'; ctx.font = `500 ${Math.round(postcard.width * .021)}px Georgia`; ctx.fillText('offshore', pad, pad * 1.2);
  ctx.font = `${Math.round(postcard.width * .007)}px sans-serif`; ctx.fillText('THE LITTLE ESCAPE  /  001', pad, postcard.height - pad);
  const blob = await new Promise(resolve => postcard.toBlob(resolve, 'image/png'));
  if (!blob) { toast('Could not save this moment. Please try again.'); return; }
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `offshore-${golden ? 'golden-hour' : 'daylight'}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('A little paradise, to keep.');
}
document.querySelector('#capture').addEventListener('click', capture);
const aboutButton = document.querySelector('#info-toggle'), about = document.querySelector('#about');
function closeAbout() { about.hidden = true; aboutButton.setAttribute('aria-expanded', 'false'); }
aboutButton.addEventListener('click', () => { about.hidden = !about.hidden; aboutButton.setAttribute('aria-expanded', String(!about.hidden)); });
canvas.addEventListener('pointerdown', closeAbout);
window.addEventListener('keydown', event => {
  if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'Space') { event.preventDefault(); toggleMotion(); }
  if (event.key.toLowerCase() === 'r') toggleRotate();
  if (event.key.toLowerCase() === 'l') toggleLight();
  if (event.key === '0') resetView();
  if (event.key.toLowerCase() === 'p') capture();
  if (event.key === 'Escape') closeAbout();
});

const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), tag = document.querySelector('#scene-tag');
let pointerX = 0, pointerY = 0, hoverPending = false, dragging = false;
function hideTag() { tag.classList.remove('visible'); }
canvas.addEventListener('pointermove', event => { pointerX = event.clientX; pointerY = event.clientY; pointer.set(pointerX / window.innerWidth * 2 - 1, -pointerY / window.innerHeight * 2 + 1); hoverPending = true; });
canvas.addEventListener('pointerdown', () => { dragging = true; canvas.style.cursor = 'grabbing'; });
window.addEventListener('pointerup', () => { dragging = false; canvas.style.cursor = 'grab'; });
canvas.addEventListener('pointerleave', () => { hoverPending = false; hideTag(); });
canvas.style.cursor = 'grab';
function hover() {
  hoverPending = false; if (dragging || window.innerWidth < 761) { hideTag(); return; }
  raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(interactiveObjects, true);
  if (hits.length) {
    let o = hits[0].object; while (o && !o.userData.label) o = o.parent;
    if (o) { tag.textContent = o.userData.label; tag.style.left = `${Math.min(pointerX + 17, innerWidth - 290)}px`; tag.style.top = `${pointerY - 37}px`; tag.classList.add('visible'); }
  } else hideTag();
}
function resize() {
  const width = window.innerWidth, height = window.innerHeight, aspect = width / height;
  const viewHeight = aspect < .8 ? 19.2 / aspect : aspect < 1.2 ? 19.7 / aspect : 16.1;
  camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2; camera.updateProjectionMatrix();
  renderer.setSize(width, height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); post.resize(width, height); needsRender = true;
}
window.addEventListener('resize', resize); resize();

let previous = performance.now(), frames = 0;
const daySun = new THREE.Color('#fff1d5'), goldSun = new THREE.Color('#ffca86');
const dayHemi = new THREE.Color('#ecf7f3'), goldHemi = new THREE.Color('#f8e7d3');
let running = true;
document.addEventListener('visibilitychange', () => { running = !document.hidden; previous = performance.now(); });
function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min((now - previous) / 1000, .5), delta = Math.min(elapsed, .1); previous = now;
  if (!running) return;
  if (playing) sceneTime += delta;
  water.update(sceneTime); boat.update(sceneTime); foliage.update(sceneTime);
  const desired = golden ? 1 : 0, lightChanging = Math.abs(desired - lightMix) > .001;
  lightMix = reducedMotion ? desired : lightMix + (desired - lightMix) * (1 - Math.exp(-elapsed * 2.6));
  sun.color.copy(daySun).lerp(goldSun, lightMix); sun.position.set(-8 - lightMix * 3, 16 - lightMix * 7, 5 - lightMix * 3);
  sun.intensity = 2.65 - lightMix * .1; hemi.color.copy(dayHemi).lerp(goldHemi, lightMix); hemi.intensity = 1.35 - lightMix * .2;
  scene.background.copy(dayBackground).lerp(goldenBackground, lightMix); scene.fog.color.copy(scene.background); floorMaterial.color.copy(scene.background).multiplyScalar(.88);
  if (resetAnimation) {
    const t = Math.min((now - resetAnimation.start) / 850, 1), eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(resetAnimation.from, defaultPosition, eased); controls.target.lerpVectors(resetAnimation.target, defaultTarget, eased); camera.zoom = THREE.MathUtils.lerp(resetAnimation.zoom, 1, eased); camera.updateProjectionMatrix();
    if (t === 1) resetAnimation = null;
  }
  const cameraChanged = controls.update(delta); if (hoverPending) hover();
  if (playing || controls.autoRotate || cameraChanged || lightChanging || resetAnimation || needsRender || frames < 3) {
    post.render(); frames++; needsRender = false;
    if (frames === 3) { document.querySelector('#loading').classList.add('loaded'); setTimeout(() => document.querySelector('#loading')?.remove(), 900); }
  }
}
requestAnimationFrame(frame);
// Diagnostics for smoke tests and performance checks.
window.__island = { scene, camera, renderer, controls, get time() { return sceneTime; }, get playing() { return playing; } };
