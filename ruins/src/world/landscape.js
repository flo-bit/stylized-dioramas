import * as THREE from 'three';
import { V, random, rand, pick, block, patch, pebble, polygonSlab, mossColors, stoneColors } from './geometry.js';

export function groundY(x, z) { return .47 + .055 * Math.sin(x * 1.9 + z * .7) + .03 * Math.cos(z * 2.4 - x); }
export function surfaceY(x, z) {
  if (x > -3.25 && x < 3.1 && z > -2.75 && z < 1.62) return 1.57;
  if (x > -1.5 && x < 1.4 && z >= 1.62 && z < 3.65) return .62 + Math.floor((3.65 - z) / .34) * .165;
  return groundY(x, z);
}
export function isPath(x, z) { return Math.abs(x - (.03 + .25 * Math.sin(z * 1.7))) < .9 && z > -.7; }

export function createLandscape(solid) {
  const nx = 32, nz = 28, verts = [], cols = [], indices = [];
  const color = new THREE.Color();
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    let x = (i / nx - .5) * 9.7, z = (j / nz - .5) * 8.45;
    if (Math.abs(x) > 4.18 && Math.abs(z) > 3.56) {
      const a = Math.atan2(Math.abs(z) - 3.56, Math.abs(x) - 4.18);
      x = Math.sign(x) * (4.18 + Math.cos(a) * .67); z = Math.sign(z) * (3.56 + Math.sin(a) * .67);
    }
    if (i > 0 && i < nx && j > 0 && j < nz) { x += rand(-.055, .055); z += rand(-.055, .055); }
    verts.push(x, groundY(x, z), z);
    const path = Math.abs(x + .1 - .21 * Math.sin(z * 2)) < .65 && z > 2.8;
    color.set(path ? pick(['#9a8952', '#a18e58', '#8c7e46']) : pick(['#65792f', '#72833a', '#7d893f', '#79823a', '#6c8032']));
    cols.push(color.r, color.g, color.b);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2); }
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(indices); g.computeVertexNormals();
  const terrain = new THREE.Mesh(g, solid.material); terrain.receiveShadow = true; terrain.castShadow = true; solid.scene.add(terrain);
  const edge = [];
  for (let i = 0; i <= nx; i++) edge.push(i);
  for (let j = 1; j <= nz; j++) edge.push(j * (nx + 1) + nx);
  for (let i = nx - 1; i >= 0; i--) edge.push(nz * (nx + 1) + i);
  for (let j = nz - 1; j > 0; j--) edge.push(j * (nx + 1));
  const sides = [], sideColors = [], sideIndices = [];
  for (let layer = 0; layer < 4; layer++) for (let i = 0; i < edge.length; i++) {
    const id = edge[i], x = verts[id * 3], z = verts[id * 3 + 2];
    const s = layer === 0 ? 1 : layer === 3 ? .979 : rand(.985, 1.01);
    const y = layer === 0 ? verts[id * 3 + 1] : [.0, .11, -.36, -.83][layer] + (layer === 3 ? .018 : rand(-.07, .07));
    sides.push(x * s, y, z * s);
    color.set(pick(layer === 0 ? ['#586337', '#62683b', '#6d7040'] : ['#655039', '#796044', '#71573d', '#574938', '#816648']));
    sideColors.push(color.r, color.g, color.b);
  }
  const n = edge.length;
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < n; i++) { const a = layer * n + i, b = layer * n + (i + 1) % n; sideIndices.push(a, b, a + n, b, b + n, a + n); }
  g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sides, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(sideColors, 3)); g.setIndex(sideIndices); g.computeVertexNormals();
  const earth = new THREE.Mesh(g, solid.material); earth.castShadow = earth.receiveShadow = true; solid.scene.add(earth);

  // The raised courtyard is a small, earth-filled foundation, not a floating floor.
  block(solid, -.1, .95, -.55, 6.2, 1.17, 4.35, '#626844');
  for (let i = 0; i < 145; i++) {
    const x = rand(-3.15, 2.9), z = rand(-2.65, 1.53);
    patch(solid, x, 1.552 + rand(0, .028), z, rand(.16, .5), rand(.15, .4), pick(['#808544', '#899145', '#768039', '#92914e', '#73843c']));
  }
  // An old, uneven flagstone path, with moss in the open joints.
  for (let row = 0; row < 8; row++) for (let col = 0; col < 4; col++) {
    if (random() < .15) continue;
    const x = -.86 + col * .6 + (row % 2) * .12 + rand(-.08, .08), z = 1.32 - row * .52 + rand(-.05, .05);
    polygonSlab(solid, x, 1.57, z, rand(.23, .3), rand(.19, .25), .048, pick(['#999781', '#a09a7a', '#83866c', '#acaa88']), rand(-.12, .12), pick([4, 5, 6]));
    if (random() < .65) patch(solid, x + rand(-.2, .2), 1.65, z + rand(-.12, .12), .14, .09);
  }
  for (let i = 0; i < 50; i++) {
    const x = rand(-1.2, 1.05), z = rand(3.58, 4.02);
    if (random() < .3) polygonSlab(solid, x, groundY(x, z), z, rand(.07, .19), rand(.05, .16), .025, pick(stoneColors));
    else pebble(solid, x, groundY(x, z) + .015, z, V(.035, .025, .025), '#8b8559');
  }
  for (let i = 0; i < 390; i++) {
    const x = rand(-4.72, 4.72), z = rand(-4.05, 4.05);
    if ((Math.abs(x) > 4.35 && Math.abs(z) > 3.75) || (Math.abs(x) < 3.15 && z > -2.75 && z < 1.7)) continue;
    if (isPath(x, z)) continue;
    patch(solid, x, groundY(x, z) + .017, z, rand(.08, .25), rand(.07, .23), pick(mossColors));
  }
  // Exposed stones at the cutaway edge.
  for (let i = 0; i < 29; i++) {
    const side = i % 4, t = rand(-.96, .96);
    const x = side < 2 ? (side === 0 ? -4.75 : 4.75) : t * 4.6;
    const z = side >= 2 ? (side === 2 ? -4.15 : 4.15) : t * 3.8;
    if (random() < .56) {
      block(solid, x, rand(-.48, .23), z, rand(.3, .75), rand(.27, .58), rand(.25, .5), pick(['#6d705e', '#7a7c66', '#8b8d73']), rand(-.18, .18));
      patch(solid, x, groundY(x, z) + .02, z, rand(.13, .33), rand(.13, .29));
    } else pebble(solid, x * 1.01, -.7, z * 1.01, V(rand(.14, .3), rand(.1, .2), rand(.16, .3)), '#74715e');
  }
  // Angular clods and embedded rocks make the exposed soil read as a cutaway.
  for(let i=0;i<105;i++) {
    const side=i%4,t=rand(-.93,.93),s=rand(.22,.48);
    const x=side<2?(side===0?-4.7:4.7):t*4.67;
    const z=side>=2?(side===2?-4.09:4.09):t*3.94;
    pebble(solid,x,rand(-.55,-.08),z,V(side<2?s*.55:s,s*.63,side<2?s:s*.55),pick(['#6a543c','#745d40','#806749','#5e4f3b','#776045']));
  }
  const rocks = [[-3.15,.7,2.95,.62], [2.95,.7,2.4,.57], [1.85,.62,3.65,.5], [-4.18,.65,.3,.48], [3.9,.6,-2.9,.55], [-2.8,1.72,.88,.45], [3.82,.65,3.2,.28],[-1.7,.62,-3.5,.45]];
  for (const [x, y, z, s] of rocks) {
    const geo = new THREE.IcosahedronGeometry(1, 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const yy = p.getY(i); p.setY(i, yy < -.4 ? -.65 : yy); }
    geo.computeVertexNormals(); solid.add(geo, V(x, y, z), '#969883', V(.1, rand(0, 6), .1), V(s, s * .83, s * .87), .12); geo.dispose();
    patch(solid, x - .05, y + s * .73, z, s * .6, s * .5);
  }
}
