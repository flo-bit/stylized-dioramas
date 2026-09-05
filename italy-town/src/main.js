import "./style.css";
import referenceImage from "../italy.png?url";
document.querySelector("#reference").href = referenceImage;
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { installSoftShadows } from "./soft-shadows.js";
installSoftShadows();
import { M, bake, material } from "./modeling.js";
import { buildVillage, buildCafe } from "./village.js";
import {
  buildGround,
  buildBoat,
  buildHarborProps,
  createWater,
  mooring,
  createSeagulls,
} from "./harbor.js";

const host = document.querySelector("#scene");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
} catch {
  document.querySelector("#loading").innerHTML =
    "<span>This little world needs WebGL. Please try a browser with hardware acceleration enabled.</span>";
  throw new Error("WebGL is unavailable");
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.info.autoReset = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);
renderer.domElement.setAttribute(
  "aria-label",
  "Porto piccolo. Drag to orbit the village; use the mouse wheel or pinch to zoom.",
);
renderer.domElement.setAttribute("role", "img");
renderer.domElement.tabIndex = 0;

const scene = new THREE.Scene();
const dayBackground = new THREE.Color("#eeeae2"),
  goldenBackground = new THREE.Color("#e9dfd0"),
  nightBackground = new THREE.Color("#142238");
scene.background = dayBackground.clone();
scene.fog = new THREE.Fog("#eeeae2", 45, 100);
const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 100);
const homeTarget = new THREE.Vector3(0, 3.05, 0.65);
const homeOffset = new THREE.Vector3(-10, 14, 21);
camera.position.copy(homeTarget).add(homeOffset);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(homeTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minPolarAngle = 0.42;
controls.maxPolarAngle = Math.PI * 0.465;
controls.minZoom = 0.65;
controls.maxZoom = 2.6;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.8;
controls.autoRotateSpeed = 0.34;
controls.update();

const ambient = new THREE.HemisphereLight("#fff1d7", "#819894", 1.45);
scene.add(ambient);
const sun = new THREE.DirectionalLight("#fff0d1", 3.1);
sun.position.set(-6, 14, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -11;
sun.shadow.camera.right = 11;
sun.shadow.camera.top = 13;
sun.shadow.camera.bottom = -11;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 45;
sun.shadow.normalBias = 0.035;
sun.shadow.bias = -0.00008;
sun.shadow.radius = 3;
sun.target.position.set(0, 2, 0);
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight("#cfebeb", 0.65);
fill.position.set(8, 8, -5);
scene.add(fill);
const floorMat = new THREE.ShadowMaterial({
  color: "#53635b",
  opacity: 0.17,
  depthWrite: false,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.31;
floor.receiveShadow = true;
scene.add(floor);

// Small-scale material grain preserves the toy-like shapes without sterile surfaces.
const grainCanvas = document.createElement("canvas");
grainCanvas.width = grainCanvas.height = 128;
const grainContext = grainCanvas.getContext("2d");
const grain = grainContext.createImageData(128, 128);
let noiseSeed = 123;
for (let i = 0; i < grain.data.length; i += 4) {
  noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) | 0;
  const v = 110 + (noiseSeed >>> 26);
  grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = v;
  grain.data[i + 3] = 255;
}
grainContext.putImageData(grain, 0, 0);
const grainTexture = new THREE.CanvasTexture(grainCanvas);
grainTexture.wrapS = grainTexture.wrapT = THREE.RepeatWrapping;
grainTexture.repeat.set(3, 3);
for (const m of [M.yellow, M.pink, M.cream, M.blue, ...M.stone, ...M.roof]) {
  m.bumpMap = grainTexture;
  m.bumpScale = 0.012;
}

const village = new THREE.Group();
scene.add(village);
buildGround(village);
buildVillage(village);
buildCafe(village);
buildHarborProps(village);
mooring(village);
bake(village);
const boat = buildBoat(scene);
bake(boat);
boat.scale.setScalar(1.1);
const water = createWater(scene);
const pmrem = new THREE.PMREMGenerator(renderer);
const environmentScene = new RoomEnvironment();
const environment = pmrem.fromScene(environmentScene, 0.04).texture;
water.material.envMap = environment;
water.material.envMapIntensity = 0.22;
environmentScene.dispose();
pmrem.dispose();
const gulls = createSeagulls(scene);
gulls.forEach((g) => {
  bake(g);
  g.scale.setScalar(0.72);
});

// Warm light pools are subtle at sunset, and illuminate the village at night.
const cafeGlow = new THREE.PointLight("#ffc272", 0, 3.8, 2);
cafeGlow.position.set(-3.5, 2.7, 0.5);
scene.add(cafeGlow);
const alleyGlow = new THREE.PointLight("#ffba66", 0, 3.2, 2);
alleyGlow.position.set(0.8, 4, -0.75);
scene.add(alleyGlow);

// Small local lights let the glowing glass illuminate nearby shutters and flowers.
for (const position of [
  [-3.53, 5.07, 0.5],
  [-1.25, 5.16, 0.2],
  [2.67, 4.22, 1.0],
  [0.64, 5.83, -1.15],
]) {
  const light = new THREE.PointLight("#ffc27c", 0, 1.9, 2);
  light.position.set(...position);
  light.userData.nightIntensity = 2.2;
  scene.add(light);
}
const cabinGlow = new THREE.PointLight("#ffc27c", 0, 2, 2);
cabinGlow.position.set(0.48, 1.1, 0.6);
cabinGlow.userData.nightIntensity = 1.8;
boat.add(cabinGlow);
const nightLights = [];
scene.traverse((object) => {
  if (object.isPointLight && object.userData.nightIntensity)
    nightLights.push(object);
});

const renderTarget = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {
  samples: 4,
  type: THREE.HalfFloatType,
});
const composer = new EffectComposer(renderer, renderTarget);
composer.addPass(new RenderPass(scene, camera));
const ao = new SSAOPass(scene, camera, innerWidth, innerHeight);
ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA = 0;
ao.depthRenderMaterial.defines.PERSPECTIVE_CAMERA = 0;
ao.ssaoMaterial.fragmentShader = ao.ssaoMaterial.fragmentShader.replace(
  "vec3( 1.0 - occlusion )",
  "vec3( pow(1.0 - occlusion * smoothstep(0.0, 0.012, min(min(vUv.x, vUv.y), min(1.0 - vUv.x, 1.0 - vUv.y))), 1.65) )",
);
ao.kernelRadius = 0.52;
ao.minDistance = 0.00015;
ao.maxDistance = 0.012;
ao.output = SSAOPass.OUTPUT.Default;
composer.addPass(ao);
const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0,
  0.45,
  0.9,
);
bloom.enabled = false;
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.addPass(new SMAAPass());

function resize() {
  const width = host.clientWidth,
    height = host.clientHeight,
    aspect = width / height;
  // Frame the full miniature on a portrait screen as well as a desktop.
  const viewHeight = aspect < 1 ? 15.2 / aspect : Math.max(15.7, 20.6 / aspect);
  camera.left = (-viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
}
addEventListener("resize", resize);
resize();

let golden = 0,
  night = 0,
  targetGolden = 0,
  targetNight = 0,
  lightingMode = "day",
  resetting = false;
const lightingModes = ["day", "golden", "night"];
const setPressed = (id, state) =>
  document.getElementById(id).setAttribute("aria-pressed", String(state));
function setLighting(mode) {
  lightingMode = mode;
  renderer.shadowMap.needsUpdate = true;
  targetGolden = mode === "golden" ? 1 : 0;
  targetNight = mode === "night" ? 1 : 0;
  for (const id of lightingModes) {
    setPressed(id, id === mode);
    document.getElementById(id).classList.toggle("active", id === mode);
  }
  document.documentElement.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]').content =
    mode === "night" ? "#142238" : mode === "golden" ? "#e9dfd0" : "#eeeae2";
}
for (const mode of lightingModes) {
  document
    .getElementById(mode)
    .addEventListener("click", () => setLighting(mode));
}
document.querySelector("#rotate").addEventListener("click", () => {
  resetting = false;
  controls.autoRotate = !controls.autoRotate;
  setPressed("rotate", controls.autoRotate);
});
function beginReset() {
  controls.autoRotate = false;
  setPressed("rotate", false);
  resetting = true;
}
document.querySelector("#reset").addEventListener("click", beginReset);
controls.addEventListener("start", () => {
  resetting = false;
  controls.autoRotate = false;
  setPressed("rotate", false);
});
renderer.domElement.addEventListener("keydown", (e) => {
  if (e.key === "Home" || e.key === "r") {
    beginReset();
    e.preventDefault();
  }
  if (e.key === "+" || e.key === "=") {
    camera.zoom = Math.min(2.6, camera.zoom * 1.1);
    camera.updateProjectionMatrix();
    e.preventDefault();
  }
  if (e.key === "-") {
    camera.zoom = Math.max(0.65, camera.zoom / 1.1);
    camera.updateProjectionMatrix();
    e.preventDefault();
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    camera.position
      .sub(controls.target)
      .applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        e.key === "ArrowLeft" ? -0.12 : 0.12,
      )
      .add(controls.target);
    controls.update();
    e.preventDefault();
  }
});
const about = document.querySelector("#about-dialog");
document
  .querySelector("#about")
  .addEventListener("click", () => about.showModal());
document
  .querySelector("#close-about")
  .addEventListener("click", () => about.close());
about.addEventListener("click", (e) => {
  if (e.target === about) {
    const r = about.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      about.close();
  }
});

// Optional, locally synthesized surf: no autoplay and no external audio assets.
let audioContext,
  audioGain,
  soundOn = false;
async function toggleAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 12,
      buffer = audioContext.createBuffer(
        2,
        audioContext.sampleRate * duration,
        audioContext.sampleRate,
      );
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let brown = 0;
      for (let i = 0; i < data.length; i++) {
        brown = (brown + Math.random() * 0.035 - 0.0175) / 1.015;
        const swell =
          0.45 +
          0.3 *
            Math.sin(((i / audioContext.sampleRate) * Math.PI) / 3 + ch * 0.4);
        data[i] = brown * swell * 3;
      }
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1700;
    audioGain = audioContext.createGain();
    audioGain.gain.value = 0;
    source.connect(filter);
    filter.connect(audioGain);
    audioGain.connect(audioContext.destination);
    source.start();
  }
  await audioContext.resume();
  soundOn = !soundOn;
  audioGain.gain.setTargetAtTime(
    soundOn ? 0.5 : 0,
    audioContext.currentTime,
    0.4,
  );
  setPressed("sound", soundOn);
  document.querySelector("#sound").title = soundOn
    ? "Mute harbor ambience"
    : "Listen to the harbor";
}
document.querySelector("#sound").addEventListener("click", () =>
  toggleAudio().catch(() => {
    document.querySelector("#sound").title =
      "Audio is not supported by this browser";
  }),
);
document.addEventListener("visibilitychange", () => {
  if (audioContext) {
    if (document.hidden) audioContext.suspend();
    else if (soundOn) audioContext.resume();
  }
});

const daySun = new THREE.Color("#fff0d1"),
  sunsetSun = new THREE.Color("#ffbd7a"),
  moonlight = new THREE.Color("#a3c4ff");
const daySky = new THREE.Color("#fff1d7"),
  sunsetSky = new THREE.Color("#ecdbca"),
  nightSky = new THREE.Color("#789ace");
const dayBounce = new THREE.Color("#819894"),
  nightBounce = new THREE.Color("#233c65"),
  dayFill = new THREE.Color("#cfebeb"),
  nightFill = new THREE.Color("#7d9de1"),
  dayShadow = new THREE.Color("#53635b"),
  nightShadow = new THREE.Color("#020711");
const clock = new THREE.Clock();
let elapsed = 0,
  firstFrame = true,
  frame = 0;
const homeSpherical = new THREE.Spherical().setFromVector3(homeOffset);
const resetSpherical = new THREE.Spherical();
function animate() {
  requestAnimationFrame(animate);
  if (document.hidden) {
    clock.getDelta();
    return;
  }
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  const t = reducedMotion ? 0 : elapsed;
  golden = reducedMotion
    ? targetGolden
    : THREE.MathUtils.damp(golden, targetGolden, 3.2, dt);
  night = reducedMotion
    ? targetNight
    : THREE.MathUtils.damp(night, targetNight, 3.2, dt);
  sun.color.copy(daySun).lerp(sunsetSun, golden).lerp(moonlight, night);
  sun.position.set(
    -6 - golden * 2 + night * 10,
    14 - golden * 3.5 + night * 2,
    8 + golden * 2 + night * 4,
  );
  sun.intensity = THREE.MathUtils.lerp(3.1 + golden * 0.4, 0.8, night);
  ambient.color.copy(daySky).lerp(sunsetSky, golden).lerp(nightSky, night);
  ambient.groundColor.copy(dayBounce).lerp(nightBounce, night);
  ambient.intensity = THREE.MathUtils.lerp(1.45 - golden * 0.4, 0.5, night);
  fill.color.copy(dayFill).lerp(nightFill, night);
  fill.intensity = THREE.MathUtils.lerp(0.65 - golden * 0.1, 0.35, night);
  floorMat.opacity = 0.17 + night * 0.15;
  floorMat.color.copy(dayShadow).lerp(nightShadow, night);
  scene.background
    .copy(dayBackground)
    .lerp(goldenBackground, golden)
    .lerp(nightBackground, night);
  scene.fog.color.copy(scene.background);
  water.time.value = t;
  water.warmth.value = golden;
  water.night.value = night;
  water.material.envMapIntensity = THREE.MathUtils.lerp(0.22, 0.025, night);
  M.window.emissiveIntensity = night * 1.15;
  M.lamp.emissiveIntensity = 0.13 + golden * 2 + night * 2.6;
  cafeGlow.intensity = golden * 2.4 + night * 7.5;
  alleyGlow.intensity = golden * 1.3 + night * 3.8;
  for (const light of nightLights)
    light.intensity = night * light.userData.nightIntensity;
  bloom.enabled = night > 0.001;
  bloom.strength = night * 0.22;
  boat.position.y = 0.29 + Math.sin(t * 1.3) * 0.027;
  boat.rotation.z = Math.sin(t * 1.1) * 0.017;
  boat.rotation.x = Math.sin(t * 0.82) * 0.012;
  for (let i = 0; i < gulls.length; i++) {
    gulls[i].visible = night < 0.98;
    const a = t * 0.065 + i * 2.1;
    gulls[i].position.set(
      Math.cos(a) * (4.6 + i * 0.35),
      8.35 + Math.sin(a * 2) * 0.2 + i * 0.25,
      -1.8 + Math.sin(a) * 2.25,
    );
    gulls[i].rotation.set(Math.sin(a) * 0.13, -a - Math.PI / 2, -0.1);
  }
  if (resetting) {
    const k = 1 - Math.exp(-5 * dt);
    resetSpherical.setFromVector3(camera.position.clone().sub(controls.target));
    const angle = homeSpherical.theta - resetSpherical.theta;
    resetSpherical.theta += Math.atan2(Math.sin(angle), Math.cos(angle)) * k;
    resetSpherical.phi = THREE.MathUtils.lerp(
      resetSpherical.phi,
      homeSpherical.phi,
      k,
    );
    resetSpherical.radius = THREE.MathUtils.lerp(
      resetSpherical.radius,
      homeSpherical.radius,
      k,
    );
    controls.target.lerp(homeTarget, k);
    camera.position.setFromSpherical(resetSpherical).add(controls.target);
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, 1, k);
    camera.updateProjectionMatrix();
    if (
      camera.position.distanceTo(homeTarget.clone().add(homeOffset)) < 0.01 &&
      Math.abs(camera.zoom - 1) < 0.001
    )
      resetting = false;
  }
  controls.update(dt);
  ao.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(
    camera.projectionMatrix,
  );
  ao.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(
    camera.projectionMatrixInverse,
  );
  if (
    firstFrame ||
    Math.abs(golden - targetGolden) > 0.001 ||
    Math.abs(night - targetNight) > 0.001 ||
    (!reducedMotion && frame++ % 3 === 0)
  )
    renderer.shadowMap.needsUpdate = true;
  renderer.info.reset();
  composer.render();
  if (firstFrame) {
    firstFrame = false;
    document.querySelector("#loading").classList.add("loaded");
  }
}
animate();
// Small, read-only diagnostics for the automated visual smoke check.
window.__porto = {
  renderer,
  scene,
  camera,
  controls,
  get lighting() {
    return golden;
  },
  get night() {
    return night;
  },
  get lightingMode() {
    return lightingMode;
  },
  get ready() {
    return !firstFrame;
  },
};
