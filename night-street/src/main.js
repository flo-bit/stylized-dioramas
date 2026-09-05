import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildDiorama } from './diorama.js';
import { createWeather } from './weather.js';
import { canvasTexture } from './textures.js';

const container = document.querySelector('#scene');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
} catch (error) {
  document.querySelector('#error').hidden = false;
  document.querySelector('#loading').remove();
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.13;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'Night alley diorama. Drag to orbit; scroll or pinch to zoom.');
renderer.domElement.setAttribute('tabindex', '0');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#17222e');
scene.fog = new THREE.FogExp2('#17222e', .019);
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, .1, 90);
const homePosition = new THREE.Vector3(13.8, 14, 11.8);
const homeTarget = new THREE.Vector3(0, 2.4, 0);
camera.position.copy(homePosition);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(homeTarget);
controls.enableDamping = true; controls.dampingFactor = .065;
controls.enablePan = false; controls.minZoom = .7; controls.maxZoom = 1.9;
controls.minPolarAngle = .45; controls.maxPolarAngle = Math.PI / 2 -.09;
controls.autoRotateSpeed = .45;
controls.rotateSpeed = .65;
controls.update();

const sky = new THREE.HemisphereLight('#a5c3df', '#25332d', 2.2); scene.add(sky);
const moon = new THREE.DirectionalLight('#b5c9df', 3.1); moon.position.set(-3.5, 10, 6);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -9; moon.shadow.camera.right = 9; moon.shadow.camera.top = 10; moon.shadow.camera.bottom = -8;
moon.shadow.camera.near = .5; moon.shadow.camera.far = 28; moon.shadow.normalBias = .035; moon.shadow.bias = -.00015; moon.shadow.radius = 4;
moon.target.position.set(0, 1.7, 0); scene.add(moon, moon.target);
const rim = new THREE.DirectionalLight('#6d94b8', 1.2); rim.position.set(3, 7, -6); scene.add(rim);
const fill = new THREE.DirectionalLight('#a3b7c6', .55); fill.position.set(8, 3, 6); scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#182531', roughness: 1, metalness: 0 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -.55; floor.receiveShadow = false; scene.add(floor);
const contactMap = canvasTexture(256, 256, ctx => {
  const gradient = ctx.createRadialGradient(128, 128, 45, 128, 128, 124);
  gradient.addColorStop(0, '#000000bb'); gradient.addColorStop(.45, '#00000088'); gradient.addColorStop(.75, '#0000003d'); gradient.addColorStop(1, '#00000000');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
});
const contact = new THREE.Mesh(new THREE.PlaneGeometry(15.6, 13.1), new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false }));
contact.rotation.x = -Math.PI / 2; contact.position.set(0, -.543, .25); scene.add(contact);

const diorama = buildDiorama(scene);
const weather = createWeather(scene);
if (reducedMotion) { weather.enabled = false; document.querySelector('#rain').classList.remove('active'); document.querySelector('#rain').setAttribute('aria-pressed', 'false'); }

const target = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, target);
composer.addPass(new RenderPass(scene, camera));
const ssao = new SSAOPass(scene, camera, innerWidth, innerHeight);
ssao.kernelRadius = 12; ssao.minDistance = .003; ssao.maxDistance = .13;
composer.addPass(ssao);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .28, .35, 1.25);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = innerWidth, h = innerHeight, aspect = w / h;
  // Keep the entire miniature visible on both a desktop and a narrow phone.
  const viewHeight = aspect < .8 ? 14.4 / aspect : aspect < 1.15 ? 14.5 : 14.2;
  camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h);
}
window.addEventListener('resize', resize); resize();

let toastTimer;
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2200);
}
function toggleButton(id, enabled) { const button = document.getElementById(id); button.classList.toggle('active', enabled); button.setAttribute('aria-pressed', String(enabled)); }
let neonOn = true, resetting = false;
const resetStart = new THREE.Vector3(); const resetTarget = new THREE.Vector3(); let resetZoom = 1, resetTime = 0;
const actions = {
  rain() { weather.enabled = !weather.enabled; toggleButton('rain', weather.enabled); toast(weather.enabled ? 'A little rain, a little quiet.' : 'The rain has passed.'); },
  lights() {
    neonOn = !neonOn;
    for (const [material, intensity] of diorama.neonState.materials) material.emissiveIntensity = neonOn ? intensity : 0;
    for (const [light, intensity] of diorama.neonState.lights) light.intensity = neonOn ? intensity : 0;
    toggleButton('lights', neonOn); toast(neonOn ? 'One more bowl before closing.' : 'Even the neon needs a rest.');
  },
  orbit() { resetting = false; controls.enableDamping = true; controls.autoRotate = !controls.autoRotate; toggleButton('orbit', controls.autoRotate); toast(controls.autoRotate ? 'Take the long way around.' : 'Stay a little while.'); },
  reset() {
    controls.autoRotate = false; toggleButton('orbit', false);
    // Flush residual drag/auto-orbit momentum before interpolating home.
    controls.enableDamping = false; controls.update(); controls.enableDamping = true;
    if (reducedMotion) { camera.position.copy(homePosition); controls.target.copy(homeTarget); camera.zoom = 1; camera.updateProjectionMatrix(); controls.update(); }
    else { resetStart.copy(camera.position); resetTarget.copy(controls.target); resetZoom = camera.zoom; resetTime = 0; resetting = true; }
    toast('Back to our quiet corner.');
  },
  capture() {
    composer.render();
    renderer.domElement.toBlob((blob) => {
      if (!blob) { toast('The postcard could not be saved.'); return; }
      const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'ame-yokocho-postcard.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('A little piece of the night, saved.');
    }, 'image/png');
  },
  async fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast('Fullscreen is unavailable in this browser.'); }
    catch { toast('Fullscreen is unavailable in this browser.'); }
  }
};
for (const [id, action] of Object.entries(actions)) document.getElementById(id).addEventListener('click', action);
document.addEventListener('fullscreenchange', () => { const button = document.querySelector('#fullscreen'); button.setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'); button.classList.toggle('active', !!document.fullscreenElement); });
window.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  const shortcuts = { r: 'rain', l: 'lights', o: 'orbit', '0': 'reset', s: 'capture', f: 'fullscreen' };
  const action = shortcuts[event.key.toLowerCase()]; if (action) { event.preventDefault(); actions[action](); }
});
controls.addEventListener('start', () => { resetting = false; controls.enableDamping = true; });

const clock = new THREE.Clock(); let elapsed = 0, frame = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  if (document.hidden) return;
  elapsed += dt;
  if (resetting) {
    resetTime += dt; const t = Math.min(resetTime / .9, 1), ease = 1 - Math.pow(1 - t, 3);
    controls.enableDamping = false;
    camera.position.lerpVectors(resetStart, homePosition, ease); controls.target.lerpVectors(resetTarget, homeTarget, ease); camera.zoom = THREE.MathUtils.lerp(resetZoom, 1, ease); camera.updateProjectionMatrix();
    if (t === 1) { resetting = false; controls.enableDamping = true; }
  }
  controls.update();
  weather.update(dt, elapsed);
  if (!reducedMotion) {
    diorama.reflection.material.uniforms.time.value = elapsed;
    for (const fan of diorama.fans) fan.rotation.z -= dt * .7;
    // Almost imperceptible transformer flutter, not a strobe.
    if (neonOn) { const [tube, intensity] = diorama.neonState.materials[0]; tube.emissiveIntensity = intensity * (.98 + .02 * Math.sin(elapsed * 9) * Math.sin(elapsed * 3.7)); }
  }
  composer.render();
  if (++frame === 3) { document.querySelector('#loading').classList.add('ready'); window.__DIORAMA_READY__ = true; }
}
animate();

// Small inspection surface for smoke tests and GPU diagnostics.
window.__diorama = { scene, camera, renderer, controls, get rainEnabled() { return weather.enabled; }, get neonEnabled() { return neonOn; }, get meshCount() { let n = 0; diorama.root.traverse(o => { if (o.isMesh) n++; }); return n; } };
