import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMaterials } from './materials.js';
import { buildWorld } from './world.js';
import { createWildlife } from './wildlife.js';
import './style.css';

const $ = selector => document.querySelector(selector);
const mount = $('#scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { paused: reducedMotion, orbit: false, details: true, feature: 'treasure', ready: false, time: 0, chestTarget: 0 };
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (error) {
  $('#loading').classList.add('loaded');
  const message = document.createElement('div');
  message.className = 'no-webgl';
  message.textContent = 'This little world needs WebGL. Please try a browser with hardware acceleration enabled.';
  mount.append(message);
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'Drag to orbit the underwater garden. Scroll or pinch to zoom.');

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, .1, 100);
const home = { position: new THREE.Vector3(10, 13.1, 17), target: new THREE.Vector3(0, 1.35, 0) };
camera.position.copy(home.position);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(home.target);
controls.enableDamping = true;
controls.dampingFactor = .065;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 5.2;
controls.maxPolarAngle = Math.PI / 2.7;
controls.minZoom = .76;
controls.maxZoom = 1.85;
controls.rotateSpeed = .55;
controls.zoomSpeed = .65;
controls.autoRotateSpeed = .42;
controls.update();
controls.saveState();

scene.add(new THREE.HemisphereLight('#e9f3d8', '#4b8989', 1.55));
const sun = new THREE.DirectionalLight('#fff1cb', 3.3);
sun.position.set(-3.5, 13.5, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 11, bottom: -10, near: .1, far: 32 });
sun.shadow.bias = -.00015;
sun.shadow.normalBias = .025;
sun.shadow.radius = 4;
sun.target.position.set(0, 1, 0);
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight('#b7e2de', .9);
fill.position.set(6, 6, -6);
scene.add(fill);
const bounce = new THREE.DirectionalLight('#8bc7b7', .28);
bounce.position.set(0, 3, 8);
scene.add(bounce);

const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#406b65', opacity: .085 }));
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = -1.055;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = shadowCanvas.height = 128;
const context = shadowCanvas.getContext('2d');
const gradient = context.createRadialGradient(64, 64, 12, 64, 64, 64);
gradient.addColorStop(0, 'rgba(35, 68, 61, .32)');
gradient.addColorStop(.62, 'rgba(35, 68, 61, .22)');
gradient.addColorStop(1, 'rgba(35, 68, 61, 0)');
context.fillStyle = gradient;
context.fillRect(0, 0, 128, 128);
const softShadow = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 14.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false, toneMapped: false }));
softShadow.rotation.x = -Math.PI / 2;
softShadow.position.set(.4, -1.046, .3);
scene.add(softShadow);

const materials = createMaterials();
const { chest, interactive, landmarks } = buildWorld(scene, materials);
const wildlife = createWildlife(scene, materials);

function resize() {
  const width = window.innerWidth, height = window.innerHeight;
  const aspect = width / height;
  let viewHeight, shiftX, shiftY;
  if (width <= 700) {
    viewHeight = (height < 740 ? 16.3 : 15.2) / aspect;
    shiftX = 0;
    shiftY = 2.2;
  } else {
    viewHeight = aspect < 1.3 ? 17.7 : 15.35;
    shiftX = aspect < 1.3 ? .65 : 1.55;
    shiftY = -.05;
  }
  camera.left = -viewHeight * aspect / 2 - shiftX;
  camera.right = viewHeight * aspect / 2 - shiftX;
  camera.top = viewHeight / 2 + shiftY;
  camera.bottom = -viewHeight / 2 + shiftY;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, width <= 700 ? 1.75 : 2));
  sun.shadow.mapSize.set(width <= 700 ? 1024 : 2048, width <= 700 ? 1024 : 2048);
}
window.addEventListener('resize', resize);
resize();

let toastTimeout;
function toast(text) {
  $('#toast').textContent = text;
  $('#toast').classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('show'), 2800);
}

function updateMotionUI() {
  $('#motion-toggle').setAttribute('aria-pressed', String(state.paused));
  $('#motion-toggle').setAttribute('aria-label', state.paused ? 'Resume animation' : 'Pause animation');
  $('#motion-toggle').title = state.paused ? 'Resume animation' : 'Pause animation';
  $('#pause-icon').toggleAttribute('hidden', state.paused);
  $('#play-icon').toggleAttribute('hidden', !state.paused);
  $('#status-text').textContent = state.paused ? 'A MOMENT OF STILLNESS' : 'A LITTLE WORLD, ALIVE';
  document.body.classList.toggle('is-paused', state.paused);
}
$('#motion-toggle').addEventListener('click', () => { state.paused = !state.paused; updateMotionUI(); });
updateMotionUI();

function setOrbit(value) {
  state.orbit = value;
  controls.autoRotate = value && !state.paused;
  $('#rotate-toggle').classList.toggle('active', value);
  $('#rotate-toggle').setAttribute('aria-pressed', String(value));
}
$('#rotate-toggle').addEventListener('click', () => setOrbit(!state.orbit));
controls.addEventListener('start', () => { setOrbit(false); resetTransition = null; });
let resetTransition = null;
$('#reset-view').addEventListener('click', () => {
  setOrbit(false);
  resetTransition = { position: camera.position.clone(), target: controls.target.clone(), zoom: camera.zoom, started: performance.now() };
  // Consume residual drag velocity before returning to the saved composition.
  controls.enableDamping = false;
  controls.update(0);
  controls.reset();
  controls.enableDamping = true;
  camera.position.copy(resetTransition.position);
  controls.target.copy(resetTransition.target);
  camera.zoom = resetTransition.zoom;
  camera.updateProjectionMatrix();
  toast('Back to our little corner of the sea.');
});

$('#details-toggle').addEventListener('click', () => {
  state.details = !state.details;
  $('#details-toggle').classList.toggle('active', state.details);
  $('#details-toggle').setAttribute('aria-pressed', String(state.details));
  $('#hotspots').hidden = !state.details;
});

const entries = {
  treasure: {
    index: '01 / 03', title: 'A forgotten treasure',
    copy: 'Tucked between the rocks, an old wooden chest keeps its quiet watch. Some things are worth looking a little closer for.',
    action: 'Open the chest',
  },
  ruins: {
    index: '02 / 03', title: 'Echoes of a city',
    copy: 'An arch with nowhere to lead. Columns holding up only water. An imagined sanctuary, softened by the sea, where the garden has outlived its gardeners.',
    action: 'Wander around the ruins',
  },
  reef: {
    index: '03 / 03', title: 'Life finds a way',
    copy: 'Ribbons of kelp follow a current you cannot see. Coral settles into the cracks. Above it all, tiny schools of fish make a home of what we left behind.',
    action: 'Take a quiet moment',
  },
};
let guideOpener = null;
function showGuide(feature, opener) {
  if (opener) guideOpener = opener;
  state.feature = feature;
  const entry = entries[feature];
  $('#guide-index').textContent = entry.index;
  $('#guide-title').textContent = entry.title;
  $('#guide-copy').textContent = entry.copy;
  $('#guide-action').innerHTML = `${feature === 'treasure' && chest.open ? 'Close the chest' : entry.action} <span>↗</span>`;
  $('[data-page].active')?.classList.remove('active');
  document.querySelectorAll('[data-page]').forEach(button => {
    button.classList.toggle('active', button.dataset.page === feature);
    button.setAttribute('aria-pressed', String(button.dataset.page === feature));
  });
  $('#field-guide').hidden = false;
  $('#guide-toggle').setAttribute('aria-expanded', 'true');
  $('.button-plus').textContent = '−';
}
function closeGuide() {
  $('#field-guide').hidden = true;
  $('#guide-toggle').setAttribute('aria-expanded', 'false');
  $('.button-plus').textContent = '+';
  guideOpener?.focus({ preventScroll: true });
}
$('#guide-toggle').addEventListener('click', event => {
  if ($('#field-guide').hidden) { showGuide(state.feature, event.currentTarget); $('#guide-close').focus({ preventScroll: true }); }
  else closeGuide();
});
$('#guide-close').addEventListener('click', closeGuide);
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#field-guide').hidden) closeGuide(); });
document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => showGuide(button.dataset.page)));
const hotspotElements = [...document.querySelectorAll('.hotspot')];
hotspotElements.forEach(button => button.addEventListener('click', () => { showGuide(button.dataset.feature, button); $('#guide-close').focus({ preventScroll: true }); }));
function toggleChest() {
  chest.open = !chest.open;
  state.chestTarget = chest.open ? 1 : 0;
  if (state.feature === 'treasure' && !$('#field-guide').hidden) showGuide('treasure');
  if (chest.open) toast('A little glimmer, waiting all this time.');
}
$('#guide-action').addEventListener('click', () => {
  if (state.feature === 'treasure') toggleChest();
  if (state.feature === 'ruins') { setOrbit(true); closeGuide(); toast('Every side has a story.'); }
  if (state.feature === 'reef') { state.paused = false; updateMotionUI(); setOrbit(false); closeGuide(); toast('Stay a while. The sea has nowhere to be.'); }
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;
function pickChest(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(interactive, false).length > 0;
}
renderer.domElement.addEventListener('pointerdown', event => { pointerDown = { x: event.clientX, y: event.clientY }; });
renderer.domElement.addEventListener('pointerup', event => {
  if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) < 6 && pickChest(event)) toggleChest();
  pointerDown = null;
});
renderer.domElement.addEventListener('pointermove', event => {
  if (!pointerDown) renderer.domElement.style.cursor = pickChest(event) ? 'pointer' : 'grab';
  else renderer.domElement.style.cursor = 'grabbing';
});
renderer.domElement.addEventListener('pointerleave', () => { pointerDown = null; renderer.domElement.style.cursor = 'grab'; });
renderer.domElement.addEventListener('pointercancel', () => { pointerDown = null; });

const projected = new THREE.Vector3();
function updateHotspots() {
  if (!state.details) return;
  const frontView = Math.cos(controls.getAzimuthalAngle() - .53) > .15;
  for (const element of hotspotElements) {
    projected.copy(landmarks[element.dataset.feature]).project(camera);
    const x = (projected.x * .5 + .5) * window.innerWidth;
    const y = (-projected.y * .5 + .5) * window.innerHeight;
    const visible = state.ready && frontView && x > 24 && x < window.innerWidth - 35 && y > 100 && y < window.innerHeight - 155;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.classList.toggle('visible', visible);
    element.style.pointerEvents = visible ? 'auto' : 'none';
    element.tabIndex = visible ? 0 : -1;
    element.setAttribute('aria-hidden', String(!visible));
  }
}

let last = performance.now();
let running = true;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, .05);
  last = now;
  if (!running) return;
  if (!state.paused) state.time += dt;
  materials.time.value = state.time;
  wildlife.update(state.time);
  chest.amount = THREE.MathUtils.damp(chest.amount, state.chestTarget, 5, dt);
  chest.lid.rotation.x = -chest.amount * 1.28;
  controls.autoRotate = state.orbit && !state.paused;
  if (resetTransition) {
    const t = Math.min(1, (now - resetTransition.started) / 700);
    const ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(resetTransition.position, home.position, ease);
    controls.target.lerpVectors(resetTransition.target, home.target, ease);
    camera.zoom = THREE.MathUtils.lerp(resetTransition.zoom, 1, ease);
    camera.updateProjectionMatrix();
    if (t === 1) resetTransition = null;
  }
  controls.update(dt);
  renderer.render(scene, camera);
  updateHotspots();
}
document.addEventListener('visibilitychange', () => { running = !document.hidden; last = performance.now(); });
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  running = false;
  toast('The sea is resting. Reload the page to return.');
});
// Do not render competing frames while the driver is compiling the first shaders.
const compile = renderer.extensions.has('KHR_parallel_shader_compile')
  ? renderer.compileAsync(scene, camera)
  : Promise.resolve().then(() => renderer.compile(scene, camera));
compile.then(() => {
  renderer.render(scene, camera);
  state.ready = true;
  last = performance.now();
  $('#loading').classList.add('loaded');
  requestAnimationFrame(frame);
}).catch(error => {
  console.error('Scene initialization failed:', error);
  $('#loading').classList.add('loaded');
  toast('The garden could not finish loading. Please reload.');
});

// A small read-only diagnostics surface for the standalone smoke tests.
window.__diorama = {
  get ready() { return state.ready; },
  get paused() { return state.paused; },
  get time() { return state.time; },
  get chestOpen() { return chest.open; },
  get orbit() { return state.orbit; },
  get zoom() { return camera.zoom; },
  get camera() { return camera.position.toArray(); },
  get stats() { return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, fish: wildlife.fishes.length }; },
};
