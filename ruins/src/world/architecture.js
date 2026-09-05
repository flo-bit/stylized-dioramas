import * as THREE from 'three';
import { V, random, rand, pick, block, chippedBox, branch, patch, stoneColors, mossColors, pebble } from './geometry.js';

export function createArchitecture(solid) {
  const ivy = [], planting = [], mossSites = [];
  function mossTop(x, y, z, w, d, coverage = .75) {
    mossSites.push({x,y,z,w,d});
    for (let i = 0; i < 8; i++) {
      if (random() > coverage) continue;
      patch(solid, x + rand(-w * .43, w * .43), y + .012, z + rand(-d * .4, d * .4), rand(.09, w * .28), rand(.07, d * .38));
    }
    if (random() < .5) ivy.push({ x: x + rand(-w * .4, w * .4), y, z: z + d / 2 + .035, length: rand(.3, .9) });
  }
  function ruinBlock(x, y, z, w, h, d, moss = true, angle = 0) {
    block(solid, x, y, z, w, h, d, pick(stoneColors), angle);
    if (moss) mossTop(x, y + h / 2, z, w, d);
    // Small, irregular mineral and lichen stains on the stone face.
    if (random() < .48) {
      const g = new THREE.CircleGeometry(1, 6);
      solid.add(g, V(x + rand(-w * .3, w * .3), y + rand(-h * .25, h * .3), z + d / 2 + .006), pick(['#737e4a', '#74824b', '#8b9361']), V(0, 0, rand(0, 6)), V(rand(.04, .11), rand(.09, .19), 1)); g.dispose();
    }
  }

  // Six shallow steps, each assembled from individual, chipped limestone blocks.
  for (let step = 0; step < 6; step++) {
    const z = 3.47 - step * .34, top = .64 + step * .165;
    block(solid, -.06, (top + .42) / 2, z, 2.85, top - .42, .42, '#626b4c');
    for (let i = 0; i < 4; i++) {
      const w = .69, x = -1.13 + i * .715 + (step % 2 ? .024 : -.018);
      ruinBlock(x, top - .075, z, w, .16, .385, false);
      if (random() < .9) mossTop(x + rand(-.15, .15), top + .018, z - .11, w * .85, .12, .58);
    }
    for (let i = 0; i < 3; i++) patch(solid, rand(-1.3, 1.2), top + .019, z + rand(-.11, .13), rand(.06, .15), rand(.04, .09));
  }
  // Retaining masonry at the sides of the raised sanctuary.
  for (const side of [-1, 1]) {
    const x = side === -1 ? -3.14 : 2.98;
    for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) {
      ruinBlock(x, .6 + row * .36, -2.26 + k * .68, .52, .34, .65, row === 2);
    }
  }
  // Foreground broken parapets. Deliberately asymmetric silhouettes.
  for (let col = 0; col < 3; col++) {
    const x = -3.02 + col * .63, rows = [4, 5, 3][col];
    for (let row = 0; row < rows; row++) ruinBlock(x + (row % 2) * .04, .69 + row * .4, 1.68, .61, .38, .66, row === rows - 1);
    mossTop(x, .69 + (rows - 1) * .4 + .2, 1.68, .62, .7);
  }
  for (let row = 0; row < 4; row++) ruinBlock(-1.81, .69 + row * .43, 1.78, .68, .41, .75, row === 3);
  ruinBlock(-1.81, 2.29, 1.78, .82, .17, .88);
  for (let k = 0; k < 4; k++) {
    const z = 1.72 - k * .65, height = [3, 2, 2, 3][k];
    for (let row = 0; row < height; row++) ruinBlock(1.76, .72 + row * .4, z, .7, .38, .62, row === height - 1);
  }
  ruinBlock(1.76, 1.89, 1.72, .86, .18, .83);
  for (let i = 0; i < 9; i++) {
    const x = pick([-1, 1]) * rand(1.5, 2), z = rand(2.3, 3.5);
    block(solid, x, .6 + rand(0, .12), z, rand(.25, .45), rand(.2, .33), rand(.26, .46), pick(stoneColors), rand(-.4, .4));
  }
  // Back wall: irregular courses, missing stones and a broken, stepped crown.
  const backZ = -1.66;
  const wallCols = [
    [-3.25, 4], [-2.63, 5], [-2.01, 4], [-1.39, 6],
    [2.58, 6], [3.2, 5], [3.82, 4]
  ];
  for (const [x, rows] of wallCols) {
    for (let row = 0; row < rows; row++) {
      const offset = row % 2 ? .025 : -.02;
      ruinBlock(x + offset, 1.78 + row * .45, backZ, .6, .426, .66, row === rows - 1);
      if (random() < .27) ivy.push({ x: x + rand(-.25, .25), y: 1.98 + row * .45, z: backZ + .36, length: rand(.35, .8) });
    }
    planting.push(V(x, 1.98 + (rows - 1) * .45, backZ));
  }
  // Fallen wall at the far right, partially buried by the forest floor.
  for (let row = 0; row < 2; row++) for (let k = 0; k < 3; k++) ruinBlock(3.18 + .4 * (k % 2), .76 + row * .4, -.62 + k * .58, .75, .38, .59, row === 1);

  const centerX = .65, spring = 4.93, z = -1.39, inner = 1.13, outer = 1.77;
  const pillarXs = [centerX - 1.45, centerX + 1.45];
  for (const x of pillarXs) {
    ruinBlock(x, 1.75, z, 1.0, .28, 1.01);
    ruinBlock(x, 1.99, z, .85, .22, .86);
    for (let row = 0; row < 4; row++) ruinBlock(x, 2.41 + row * .6, z, .64, .58, .73, false);
    // Carved pilaster faces, with the deep, dark seam around the recessed panel.
    block(solid, x, 3.28, z + .379, .46, 2.25, .035, '#626f53');
    block(solid, x, 3.28, z + .407, .28, 2.09, .048, '#90967b');
    for (const dx of [-.26, .26]) block(solid, x + dx, 3.29, z + .422, .072, 2.3, .092, '#a0a18a');
    ruinBlock(x, 4.58, z, .81, .2, .88);
    ruinBlock(x, 4.77, z, .94, .18, .96);
    ivy.push({ x: x - .27, y: 4.84, z: z + .5, length: rand(1.6, 2.5) });
    ivy.push({ x: x + .27, y: 3.44, z: z + .49, length: .9 });
    mossTop(x, 4.875, z, .97, .92);
  }
  // True wedge-shaped voussoirs: a free-standing, open arch all the way through.
  const count = 13;
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI + .012, b = (i + 1) / count * Math.PI - .012;
    const shape = new THREE.Shape();
    shape.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    shape.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    shape.lineTo(Math.cos(b) * outer, Math.sin(b) * outer);
    shape.lineTo(Math.cos(b) * inner, Math.sin(b) * inner); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: .68, bevelEnabled: true, bevelSegments: 1, bevelSize: .026, bevelThickness: .026, steps: 1, curveSegments: 1 });
    solid.add(g, V(centerX, spring, z - .34), pick(stoneColors)); g.dispose();
    const mid = (a + b) / 2, x = centerX + Math.cos(mid) * outer, y = spring + Math.sin(mid) * outer;
    if (i > 1 && i < 12) {
      for (let j = 0; j < 4; j++) patch(solid, x + rand(-.12, .12), y + .015, z + rand(-.3, .3), .16, .16);
      if (random() < .75) ivy.push({ x, y: y + .05, z: z + .39, length: rand(.4, 1.15) });
    }
    // Narrow raised archivolt following the curve across the front face.
    const trim = new THREE.Shape(); const r1 = inner + .065, r2 = inner + .155;
    trim.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); trim.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); trim.lineTo(Math.cos(b) * r2, Math.sin(b) * r2); trim.lineTo(Math.cos(b) * r1, Math.sin(b) * r1); trim.closePath();
    const tg = new THREE.ExtrudeGeometry(trim, { depth: .039, bevelEnabled: true, bevelSegments: 1, bevelSize: .012, bevelThickness: .01, steps: 1 });
    solid.add(tg, V(centerX, spring, z + .357), '#a5a58c'); tg.dispose();
  }
  // The keystone's little labyrinth is physically modelled, not a texture.
  block(solid, centerX, 6.30, z + .44, .65, .92, .19, '#747c60');
  block(solid, centerX, 6.31, z + .551, .5, .75, .038, '#adb08f');
  block(solid, centerX, 6.31, z + .577, .395, .65, .021, '#596844');
  const glyph = [[-.105, .04, .058, .41], [.025, -.14, .25, .055], [.13, -.025, .055, .29], [.048, .09, .18, .055], [-.008, .195, .055, .24], [.069, .294, .21, .05]];
  for (const [x, y, w, h] of glyph) block(solid, centerX + x, 6.29 + y, z + .606, w, h, .028, '#959b6c');
  mossTop(centerX, 6.78, z, .74, .8);
  ivy.push({ x: centerX + .27, y: 6.72, z: z + .58, length: .66 });

  // Hairline fractures and the occasional loose fragment.
  for (const [x, y, zz] of [[-1.78, 1.75, 2.17], [3.22, 3.8, -1.31], [2.1, 3.5, -.966],[-.8,2.85,-.964]]) {
    branch(solid, [[x - .12, y + .2, zz], [x -.015, y + .07, zz + .006], [x -.07, y, zz + .008], [x + .04, y -.14, zz + .007]], [.008, .007, .005, .002], '#515b40', 4, 5);
  }
  for (let i = 0; i < 28; i++) {
    const x = rand(-3.2, 3.0), zz = rand(-2.5, 1.5);
    pebble(solid, x, 1.64, zz, V(rand(.035, .12), rand(.035, .08), rand(.03, .1)), pick(stoneColors));
  }
  return { ivy, planting, mossSites };
}
