import * as THREE from 'three';
import { rng } from './textures.js';

export function createWeather(scene) {
  const random = rng(77), count = 600;
  const positions = new Float32Array(count * 6), velocity = new Float32Array(count), lengths = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const n = i * 6; positions[n] = (random() -.5) * 10.1; positions[n + 1] = random() * 9.5; positions[n + 2] = (random() -.5) * 8.2;
    lengths[i] = .055 + random() * .15; velocity[i] = 3.9 + random() * 2.8;
    positions[n + 3] = positions[n] -.015; positions[n + 4] = positions[n + 1] + lengths[i]; positions[n + 5] = positions[n + 2];
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.LineBasicMaterial({ color: '#9cb2c5', transparent: true, opacity: .065, depthWrite: false });
  const rain = new THREE.LineSegments(geo, material); rain.frustumCulled = false; scene.add(rain);

  const rippleGeo = new THREE.InstancedBufferGeometry().copy(new THREE.RingGeometry(.84, 1, 32));
  const offsets = [], phases = [];
  for (let i = 0; i < 70; i++) { offsets.push((random() -.5) * 8.8, .042, 1.2 + random() * 2.55); phases.push(random()); }
  rippleGeo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
  rippleGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array(phases), 1)); rippleGeo.instanceCount = 70;
  const rippleMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `attribute vec3 aOffset;attribute float aPhase;uniform float time;varying float vFade;void main(){float age=fract(time*.55+aPhase);float size=.014+age*.15;vFade=pow(1.-age,2.)*.085;vec3 p=vec3(position.x*size,0.,position.y*size)+aOffset;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `varying float vFade;void main(){gl_FragColor=vec4(.45,.6,.7,vFade);}`
  });
  const ripples = new THREE.Mesh(rippleGeo, rippleMaterial); ripples.frustumCulled = false; scene.add(ripples);
  let enabled = true;
  return {
    set enabled(value) { enabled = value; rain.visible = value; ripples.visible = value; },
    get enabled() { return enabled; },
    update(dt, elapsed) {
      if (!enabled) return;
      for (let i = 0; i < count; i++) {
        const n = i * 6; positions[n + 1] -= velocity[i] * dt; positions[n] += dt * .13;
        if (positions[n + 1] < .13) { positions[n + 1] = 8 + random() * 1.5; positions[n] = (random() -.5) * 10; }
        positions[n + 3] = positions[n] -.015; positions[n + 4] = positions[n + 1] + lengths[i];
      }
      geo.attributes.position.needsUpdate = true; rippleMaterial.uniforms.time.value = elapsed;
    }
  };
}
