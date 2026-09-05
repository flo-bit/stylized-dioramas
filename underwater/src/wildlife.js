import * as THREE from 'three';
import { random, mesh, flatShape, batchLocal } from './geometry.js';

export function createWildlife(scene, materials) {
  const { plain } = materials;
  const fishes = [];
  const animals = new THREE.Group();
  scene.add(animals);

  function littleFish(color, size = 1) {
    const fish = new THREE.Group();
    const body = mesh(fish, new THREE.IcosahedronGeometry(1, 1), plain, [0, 0, 0], color, .07);
    body.scale.set(.285, .155, .09);
    const tail = new THREE.Group();
    tail.position.x = -.235;
    fish.add(tail);
    mesh(tail, flatShape([[0, .012], [-.18, .145], [-.15, 0], [-.18, -.14], [0, -.015]], .027), plain, [0, 0, -.014], color);
    const finColor = new THREE.Color(color).multiplyScalar(.89);
    mesh(fish, flatShape([[-.17, .08], [-.065, .218], [.088, .118]], .016), plain, [0, 0, -.008], finColor);
    mesh(fish, flatShape([[-.11, -.11], [-.028, -.208], [.075, -.103]], .014), plain, [0, 0, -.007], finColor);
    for (const side of [-1, 1]) {
      mesh(fish, flatShape([[-.09, .01], [-.14, -.087], [.042, -.027]], .01), plain, [0, 0, side * .086], new THREE.Color(color).multiplyScalar(1.1));
      const eyeWhite = mesh(fish, new THREE.SphereGeometry(.022, 6, 4), plain, [.19, .043, side * .065], '#e9e6c2');
      eyeWhite.scale.z = .45;
      const pupil = mesh(fish, new THREE.SphereGeometry(.013, 6, 4), plain, [.198, .043, side * .075], '#253f3c');
      pupil.scale.z = .4;
    }
    batchLocal(fish, [tail]);
    fish.scale.setScalar(size);
    return { fish, tail };
  }

  function angelfish(size = 1) {
    const fish = new THREE.Group();
    const x = [-.29, -.22, -.16, -.1, -.02, .055, .13, .18, .235, .29];
    const ry = [.04, .15, .23, .26, .28, .26, .21, .16, .1, .025];
    const rz = [.025, .055, .078, .086, .088, .082, .071, .056, .037, .011];
    const positions = [], colors = [];
    for (let i = 0; i < x.length - 1; i++) for (let j = 0; j < 10; j++) {
      const a = j / 10 * Math.PI * 2, b = (j + 1) / 10 * Math.PI * 2;
      const p = [x[i], Math.cos(a) * ry[i], Math.sin(a) * rz[i]];
      const q = [x[i], Math.cos(b) * ry[i], Math.sin(b) * rz[i]];
      const r = [x[i + 1], Math.cos(a) * ry[i + 1], Math.sin(a) * rz[i + 1]];
      const s = [x[i + 1], Math.cos(b) * ry[i + 1], Math.sin(b) * rz[i + 1]];
      const stripe = i === 1 || i === 4 || i === 7;
      const c = new THREE.Color(stripe ? '#243b49' : '#eee6b1').multiplyScalar(random(.94, 1.07));
      for (const v of [p, q, r, q, s, r]) { positions.push(...v); colors.push(c.r, c.g, c.b); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    mesh(fish, geo, plain);
    const tail = new THREE.Group(); tail.position.x = -.275; fish.add(tail);
    mesh(tail, flatShape([[0, 0], [-.19, .16], [-.14, 0], [-.19, -.15]], .02), plain, [0, 0, -.01], '#d9c66b');
    mesh(fish, flatShape([[-.18, .18], [-.16, .44], [-.39, .52], [-.085, .43], [.07, .21]], .012), plain, [0, 0, -.006], '#e8e6b6');
    mesh(fish, flatShape([[-.18, .17], [-.13, .34], [-.055, .37], [.08, .2]], .018), plain, [0, 0, -.009], '#334b50');
    mesh(fish, flatShape([[-.19, -.16], [-.18, -.37], [-.05, -.32], [.14, -.15]], .016), plain, [0, 0, -.008], '#ddcf83');
    mesh(fish, flatShape([[.1, -.15], [.19, -.35], [.15, -.18]], .01), plain, [0, 0, -.005], '#f3e6af');
    for (const side of [-1, 1]) {
      const eye = mesh(fish, new THREE.SphereGeometry(.017, 7, 5), plain, [.205, .046, side * .051], '#182d33');
      eye.scale.z = .5;
      mesh(fish, flatShape([[-.015, .012], [-.14, -.09], [.055, -.038]], .008), plain, [0, 0, side * .082], '#e8d694');
    }
    batchLocal(fish, [tail]);
    fish.scale.setScalar(size);
    return { fish, tail };
  }

  function addFish(type, color, size, center, phase, radius = .75, speed = .16) {
    const { fish, tail } = type === 'angel' ? angelfish(size) : littleFish(color, size);
    animals.add(fish);
    fishes.push({ fish, tail, center: new THREE.Vector3(...center), phase, radius, speed, type });
  }
  // Three distinct schools, with an unhurried rhythm.
  addFish('little', '#deb950', .87, [-.2, 2.7, -.4], .2, .64, .2);
  addFish('little', '#e5c354', .72, [-.5, 2.38, -.2], .52, .64, .2);
  addFish('little', '#d7b648', .62, [-.05, 2.08, -.23], .84, .64, .2);
  addFish('little', '#edcc64', .58, [-.37, 2.97, -.32], -.12, .64, .2);
  for (let i = 0; i < 5; i++) addFish('little', i % 2 === 0 ? '#df8f59' : '#d6814f', .63 + i * .047, [2.05 + i * .24, 3.5 + (i % 3) * .28, -2.73 + (i % 2) * .18], -.8 + i * .12, .6, .13);
  addFish('angel', null, 1.32, [2.52, 2.35, .65], 2.9, .64, .15);
  addFish('angel', null, 1.02, [2.28, 1.39, 1.94], 3.05, .55, .17);
  addFish('angel', null, .76, [1.6, 1.08, 2.25], 2.8, .55, .17);
  addFish('little', '#8889c9', .91, [-5.1, 4.55, -.5], .8, .4, .18);
  addFish('little', '#5cabbc', .56, [-4.97, 4.24, -.83], 1.15, .43, .18);

  // Faceted, translucent bubbles, with a tiny milky highlight on each.
  const bubbleGeometry = new THREE.IcosahedronGeometry(1, 1);
  const bubbleMaterial = new THREE.MeshPhysicalMaterial({ color: '#9fe7df', roughness: .08, metalness: .1, transparent: true, opacity: .37, flatShading: true, depthWrite: false, side: THREE.FrontSide });
  const bubbles = new THREE.InstancedMesh(bubbleGeometry, bubbleMaterial, 67);
  const highlights = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: '#e0f7e8', transparent: true, opacity: .65, depthWrite: false }), 67);
  bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  highlights.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bubbles.frustumCulled = highlights.frustumCulled = false;
  scene.add(bubbles, highlights);
  const bubbleData = [];
  const sources = [[-5.32, -.18, 5.0], [3.35, -2.52, 5.1], [4.68, 1.13, 3.7], [-.7, -.81, 3.8], [-3.48, 3.14, 2.4]];
  for (let i = 0; i < 67; i++) {
    const source = sources[i % sources.length];
    bubbleData.push({ x: source[0], z: source[1], height: source[2], phase: random(0, 1), radius: random(.025, .087), speed: random(.035, .065), drift: random(0, Math.PI * 2) });
  }
  const dummy = new THREE.Object3D();
  // Nearly invisible suspended flecks lend depth without becoming snow.
  const particlePositions = new Float32Array(100 * 3);
  for (let i = 0; i < 100; i++) {
    particlePositions[i * 3] = random(-5.6, 5.6);
    particlePositions[i * 3 + 1] = random(.5, 4.8);
    particlePositions[i * 3 + 2] = random(-4.1, 4.1);
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(particlesGeo, new THREE.PointsMaterial({ color: '#d4edcf', size: .024, transparent: true, opacity: .5, depthWrite: false }));
  scene.add(particles);

  function update(time) {
    for (const { fish, tail, center, phase, radius, speed } of fishes) {
      const t = time * speed + phase;
      fish.position.copy(center);
      fish.position.x += Math.sin(t) * radius;
      fish.position.z += Math.cos(t) * radius * .42;
      fish.position.y += Math.sin(time * 1.25 + phase * 4) * .047;
      fish.rotation.y = Math.atan2(Math.sin(t) * .42, Math.cos(t));
      fish.rotation.z = Math.sin(time * 1.25 + phase * 4) * .035;
      tail.rotation.y = Math.sin(time * 7.8 + phase * 5) * .32;
    }
    bubbleData.forEach((b, i) => {
      const progress = (b.phase + time * b.speed) % 1;
      const scale = b.radius * Math.min(1, progress * 10, (1 - progress) * 8);
      dummy.position.set(b.x + Math.sin(progress * 9 + b.drift) * .11, .3 + progress * b.height, b.z + Math.cos(progress * 7 + b.drift) * .07);
      dummy.rotation.set(time * .15 + i, i * .5, time * .1);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      bubbles.setMatrixAt(i, dummy.matrix);
      dummy.position.add(new THREE.Vector3(-scale * .3, scale * .42, scale * .66));
      dummy.scale.set(scale * .27, scale * .21, scale * .13);
      dummy.updateMatrix();
      highlights.setMatrixAt(i, dummy.matrix);
    });
    bubbles.instanceMatrix.needsUpdate = true;
    highlights.instanceMatrix.needsUpdate = true;
    particles.rotation.y = Math.sin(time * .035) * .04;
    particles.position.y = Math.sin(time * .3) * .04;
  }
  update(0);
  return { update, fishes, bubbles };
}
