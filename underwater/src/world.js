import * as THREE from 'three';
import Delaunator from 'delaunator';
import { random, pick, clamp, mesh, colorize, chippedBox, stoneCylinder, branch, tubeCurve, flatShape, batchStatic, batchLocal, Y } from './geometry.js';

const TAU = Math.PI * 2;
const STONE = ['#9aaa8e', '#a7b395', '#b3bc9e', '#8fA88f', '#a4b59a', '#98ac96'];
const ROCK = ['#688f89', '#72998d', '#76998d', '#628c88', '#839e8f'];
export const groundY = (x, z) => .22 + .065 * Math.sin(x * 1.7 + z) + .035 * Math.cos(z * 2.3 - x * .7) + Math.max(0, -z - 2.1) * .085;
function boundary(a) {
  const p = 3.3;
  return Math.pow(Math.pow(Math.abs(Math.cos(a)) / 6.1, p) + Math.pow(Math.abs(Math.sin(a)) / 5.1, p), -1 / p) * (1 + .022 * Math.sin(a * 11) + .019 * Math.cos(a * 17));
}

export function buildWorld(scene, materials) {
  const { matte, plain, gold, kelp } = materials;
  const world = new THREE.Group();
  const staticGroup = new THREE.Group();
  const kelpGroup = new THREE.Group();
  scene.add(world);
  const interactive = [];

  function island() {
    const n = 76, points = [], colors = [], positions = [];
    for (const fraction of [1, .95, .85]) for (let i = 0; i < n; i++) {
      const a = i / n * TAU;
      const r = boundary(a) * fraction;
      points.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    for (let i = 0; i < 900; i++) {
      const x = random(-6.15, 6.15), z = random(-5.2, 5.2);
      const a = Math.atan2(z, x);
      if (Math.hypot(x, z) < boundary(a) * .92) points.push([x, z]);
    }
    const { triangles } = Delaunator.from(points);
    const turquoise = new THREE.Color('#21bbb4'), sand = new THREE.Color('#b4d2b1'), moss = new THREE.Color('#86bba6');
    for (let i = 0; i < triangles.length; i += 3) {
      const tint = random(.95, 1.05);
      for (const j of [0, 1, 2]) {
        const [x, z] = points[triangles[i + j]];
        const f = Math.hypot(x, z) / boundary(Math.atan2(z, x));
        const h = f > .92 ? .15 + Math.sin(x * 3 + z * 2) * .045 : groundY(x, z);
        positions.push(x, h, z);
        const patch = clamp(.4 + .3 * Math.sin(x * 1.4 + z * .8) * Math.cos(z * 1.9) + .17 * Math.cos(x * 3.5 - z), 0, 1);
        const color = sand.clone().lerp(moss, patch * .53).lerp(turquoise, THREE.MathUtils.smoothstep(f, .82, 1)).multiplyScalar(tint);
        colors.push(color.r, color.g, color.b);
      }
    }
    const top = new THREE.BufferGeometry();
    top.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    top.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    top.computeVertexNormals();
    mesh(staticGroup, top, matte);

    const verts = [], cols = [];
    const wallColors = ['#28b7b5', '#139cA3', '#128b96', '#107989'];
    const rows = [.15, -.12, -.55, -1.03];
    const ring = (i, row) => {
      const a = (i % n) / n * TAU;
      const r = boundary(a) * [1, 1.006, 1.005, .993][row];
      return [Math.cos(a) * r, rows[row] + (row === 3 ? 0 : .035 * Math.sin(a * 15)), Math.sin(a) * r];
    };
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < n; i++) {
      const a = ring(i, j), b = ring(i + 1, j), c = ring(i, j + 1), d = ring(i + 1, j + 1);
      const color = new THREE.Color(wallColors[j]).multiplyScalar(random(.82, 1.13));
      for (const p of [a, b, c, b, d, c]) { verts.push(...p); cols.push(color.r, color.g, color.b); }
    }
    const sides = new THREE.BufferGeometry();
    sides.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    sides.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    sides.computeVertexNormals();
    mesh(staticGroup, sides, matte);
  }

  function rock(x, z, scale, height = scale, color = pick(ROCK), yOffset = 0) {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const factor = 1 + .12 * Math.sin(x * 12 + y * 7 + z * 8) + .06 * Math.cos(x * 6 - z * 10);
      p.setXYZ(i, x * factor, y * factor, z * factor);
    }
    const object = mesh(staticGroup, geo, matte, [x, groundY(x, z) + height * .42 + yOffset, z], color, .1);
    object.scale.set(scale, height, scale * random(.72, 1.05));
    object.rotation.set(random(-.15, .15), random(0, TAU), random(-.12, .12));
    return object;
  }

  function block(parent, w, h, d, x, y, z, color = pick(STONE), bevel = .045) {
    const object = mesh(parent, chippedBox(w, h, d, bevel, Math.min(.04, h * .06)), matte, [x, y, z], color, .055);
    return object;
  }

  function column(x, z, height, radius = .43, broken = false) {
    const group = new THREE.Group();
    group.position.set(x, groundY(x, z) + .02, z);
    staticGroup.add(group);
    mesh(group, stoneCylinder(radius * 1.6, .17, 10), matte, [0, .085, 0], '#8da88e');
    mesh(group, stoneCylinder(radius * 1.37, .14, 12), matte, [0, .235, 0], '#adb89a');
    mesh(group, stoneCylinder(radius * 1.16, .15, 12), matte, [0, .36, 0], '#9eaf91');
    const shaftHeight = height - (broken ? .55 : 1.05);
    const count = Math.max(2, Math.round(shaftHeight / .63));
    for (let i = 0; i < count; i++) {
      const h = shaftHeight / count;
      const object = mesh(group, stoneCylinder(radius * (1 - i / count * .065), h - .021, 12, .018, true), matte, [random(-.023, .023), .43 + h * (i + .5), random(-.017, .017)], pick(STONE), .045);
      object.rotation.y = .035 * Math.sin(i * 3);
    }
    const y = .43 + shaftHeight;
    mesh(group, stoneCylinder(radius * 1.12, .13, 12), matte, [0, y + .065, 0], '#92aa90');
    if (!broken) {
      mesh(group, stoneCylinder(radius * 1.4, .18, 10), matte, [0, y + .215, 0], '#a9b597');
      mesh(group, stoneCylinder(radius * 1.57, .24, 9), matte, [0, y + .42, 0], '#b1bda1');
    }
    return group;
  }

  function ruins() {
    const arch = new THREE.Group();
    arch.position.set(-2.8, groundY(-2.8, -1.5), -1.65);
    arch.rotation.y = .08;
    staticGroup.add(arch);
    for (const side of [-1, 1]) {
      const x = side * 1.45;
      block(arch, 1.03, .2, 1.05, x, .1, 0, '#8ca88f');
      block(arch, .9, .26, .93, x, .33, 0);
      for (let i = 0; i < 5; i++) {
        const stone = block(arch, .73 + random(-.045, .035), .555, .79, x + random(-.022, .022), .74 + i * .566, random(-.025, .025));
        stone.rotation.z = random(-.025, .025);
        if (i === 1 || i === 3) {
          // A hairline split and a small flake give each pier its own age.
          block(arch, .2, .07, .035, x + side * .22, .76 + i * .566, .409, '#657f72', .012);
        }
      }
      block(arch, .93, .25, .99, x, 3.47, -.01, '#acb99c');
    }
    const count = 11;
    for (let i = 0; i < count; i++) {
      const inner = 1.075 + random(-.035, .025), outer = 1.835 + random(-.035, .045);
      const a = i / count * Math.PI + .012, b = (i + 1) / count * Math.PI - .012;
      const shape = new THREE.Shape();
      shape.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      shape.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      shape.lineTo(Math.cos((a + b) / 2) * (outer + random(-.015, .025)), Math.sin((a + b) / 2) * (outer + .015));
      shape.lineTo(Math.cos(b) * outer, Math.sin(b) * outer);
      shape.lineTo(Math.cos(b) * inner, Math.sin(b) * inner);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: .77 + random(-.05, .035), bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .035, bevelThickness: .035, curveSegments: 1 });
      mesh(arch, geo, matte, [random(-.016, .016), 3.48 + random(-.012, .02), -.39 + random(-.045, .025)], pick(STONE), .075);
    }
    // A little rubble at the crown, not a perfectly new arch.
    rock(-3.15, -1.65, .3, .2, '#9dad93', 4.86);
    const tall = column(.85, -3.05, 5.45, .44);
    tall.rotation.z = -.018;
    column(4.2, -.3, 3.9, .49);
    const cap = block(staticGroup, 1.05, .48, .71, 4.21, 4.48, -.35, '#a9b89a', .075);
    cap.rotation.set(-.12, .28, -.13);
    column(-3.0, .7, 2.3, .44, true);
    column(.15, -1.3, 1.64, .46, true);
    // Weathered sanctuary steps and the remnants of a stone path.
    const steps = [
      [-2.4, -.65, 2.65, .27, .66], [-2.25, .05, 2.6, .19, .62],
      [-1.75, .68, 1.95, .12, .58], [-.12, -1.12, 1.63, .2, 1.4],
    ];
    steps.forEach(([x, z, w, h, d], i) => {
      const y = groundY(x, z) + h / 2 + (i === 0 ? .23 : i === 1 ? .1 : 0);
      const object = block(staticGroup, w, h, d, x, y, z, pick(STONE), .055);
      object.rotation.y = random(-.1, .1);
    });
    for (const [x, z, w, d, angle] of [[-1.4, 1.28, .88, .61, -.1], [-.65, 1.53, .62, .61, .14], [-.9, 2.18, .95, .58, .1], [.25, 2.6, .77, .68, -.15], [-2.0, 1.55, .48, .51, .22], [-1.64, 2.45, .48, .42, -.3], [.45, -.14, .65, .48, .24]]) {
      const stone = block(staticGroup, w, .085, d, x, groundY(x, z) + .055, z, '#a9c1a4', .045);
      stone.rotation.y = angle;
      stone.rotation.z = random(-.05, .05);
    }
    const fallen = new THREE.Group();
    fallen.position.set(.25, .77, 1.32);
    fallen.quaternion.setFromUnitVectors(Y, new THREE.Vector3(.72, .04, -.7).normalize());
    staticGroup.add(fallen);
    for (let i = 0; i < 3; i++) mesh(fallen, stoneCylinder(.47, .57, 12, .035, true), matte, [0, (i - 1) * .586, 0], pick(STONE), .07);
    mesh(fallen, stoneCylinder(.58, .2, 10), matte, [0, 1.0, 0], '#aebd9e');
    // Chunks broken away from the column.
    for (let i = 0; i < 5; i++) rock(random(-.2, 1.4), random(.7, 2.0), random(.1, .22), random(.1, .2), '#90ab94');
  }

  function makeKelp(x, z, height, width = .36, phase = random(0, TAU), angle = random(-.6, .6)) {
    const vertices = [], colors = [], sways = [];
    const steps = Math.ceil(height * 3.5);
    const base = groundY(x, z);
    const dark = new THREE.Color('#326f36'), bright = new THREE.Color('#81a948');
    const point = (j, k) => {
      const t = j / steps;
      const ribbonWidth = width * .62 * (.78 + .22 * Math.sin(t * Math.PI)) * Math.min(1, .45 + t * 4) * (t > .89 ? (1 - t) / .11 : 1);
      const twist = angle + Math.sin(t * 7 + phase) * .7;
      const cx = x + Math.sin(t * 9 + phase) * height * .043 + Math.sin(phase) * t * .15;
      const cz = z + Math.cos(t * 8 + phase) * height * .024;
      return [cx + Math.cos(twist) * k * ribbonWidth, base + height * t, cz + Math.sin(twist) * k * ribbonWidth + (k === 0 ? .055 : 0)];
    };
    for (let j = 0; j < steps; j++) for (const side of [-1, 1]) {
      const a = point(j, 0), b = point(j, side), c = point(j + 1, 0), d = point(j + 1, side);
      const color = dark.clone().lerp(bright, .22 + j / steps * .56).multiplyScalar(side === 1 ? .86 : 1.13);
      for (const p of [a, b, c, b, d, c]) { vertices.push(...p); colors.push(color.r, color.g, color.b); sways.push(base, phase); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('sway', new THREE.Float32BufferAttribute(sways, 2));
    geometry.computeVertexNormals();
    const blade = mesh(kelpGroup, geometry, kelp);
    blade.castShadow = false;
  }

  function seaweed(x, z, height = .65, color = '#7baf3d') {
    const base = groundY(x, z);
    const group = new THREE.Group();
    group.position.set(x, base, z);
    group.rotation.y = random(0, TAU);
    staticGroup.add(group);
    for (let stem = 0; stem < 4; stem++) {
      const sx = random(-.15, .15), sz = random(-.15, .15), h = height * random(.6, 1.12);
      const direction = random(-.24, .24);
      branch(group, [sx, 0, sz], [sx + direction, h, sz], .025, .012, plain, color, 5);
      for (let j = 1; j < 6; j++) for (const side of [-1, 1]) {
        const y = h * j / 6;
        const center = sx + direction * j / 6;
        const leaf = mesh(group, flatShape([[0, 0], [side * h * .2, .06], [side * h * .25, h * .18], [side * h * .08, h * .16]], .012), plain, [center, y, sz], color, .09);
        leaf.rotation.y = random(-.4, .4);
      }
    }
  }

  function coral(x, z, height = 1, color = '#d47f94', arms = 5) {
    const root = new THREE.Group();
    root.position.set(x, groundY(x, z), z);
    root.rotation.y = random(0, TAU);
    staticGroup.add(root);
    const tipColor = new THREE.Color(color).lerp(new THREE.Color('#f5bfab'), .26);
    const node = (p, r, c = color) => mesh(root, new THREE.IcosahedronGeometry(r, 0), plain, p, c, .05);
    for (let i = 0; i < arms; i++) {
      const angle = i / arms * TAU + random(-.2, .2);
      const h = height * random(.58, 1.1);
      const r = h * random(.24, .44);
      const p0 = [0, .03, 0];
      const p1 = [Math.cos(angle) * r * .45, h * .38, Math.sin(angle) * r * .45];
      const p2 = [Math.cos(angle) * r, h * .72, Math.sin(angle) * r];
      const p3 = [p2[0] + random(-.09, .09), h, p2[2] + random(-.07, .07)];
      branch(root, p0, p1, .105 * height, .081 * height, plain, color);
      branch(root, p1, p2, .084 * height, .062 * height, plain, color);
      branch(root, p2, p3, .065 * height, .052 * height, plain, tipColor);
      node(p1, .085 * height); node(p2, .068 * height); node(p3, .055 * height, tipColor);
      for (const [j, parent] of [p1, p2].entries()) {
        const dir = angle + (j === 0 ? 1 : -1) * random(.6, 1.3);
        const p = [parent[0] + Math.cos(dir) * height * .23, parent[1] + height * .13, parent[2] + Math.sin(dir) * height * .23];
        const end = [p[0] + Math.cos(dir) * .045, p[1] + height * random(.14, .23), p[2] + Math.sin(dir) * .045];
        branch(root, parent, p, .056 * height, .046 * height, plain, color);
        branch(root, p, end, .047 * height, .032 * height, plain, tipColor);
        node(p, .048 * height); node(end, .034 * height, tipColor);
      }
    }
  }

  function sponges(x, z, scale = 1, color = '#9c72c6', count = 6) {
    const group = new THREE.Group();
    group.position.set(x, groundY(x, z), z);
    staticGroup.add(group);
    for (let i = 0; i < count; i++) {
      const a = i / count * TAU;
      const radius = random(.09, .14) * scale, h = random(.33, .77) * scale;
      const profile = [[radius * .66, 0], [radius * .95, h * .45], [radius * 1.07, h * .94], [radius, h], [radius * .68, h], [radius * .61, h * .72], [radius * .37, h * .58]];
      const geometry = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 7);
      const sponge = mesh(group, geometry, plain, [Math.cos(a) * scale * .2, 0, Math.sin(a) * scale * .18], color, .08);
      sponge.rotation.z = -Math.cos(a) * .27;
      sponge.rotation.x = Math.sin(a) * .27;
      const hole = mesh(sponge, new THREE.CircleGeometry(radius * .6, 7), plain, [0, h * .71, 0], new THREE.Color(color).multiplyScalar(.4));
      hole.rotation.x = -Math.PI / 2;
      for (let j = 0; j < 3; j++) {
        const spot = mesh(sponge, new THREE.CircleGeometry(radius * .16, 5), plain, [radius * Math.sin(j * 2.1), h * (.23 + .2 * j), radius * Math.cos(j * 2.1) + .008], new THREE.Color(color).multiplyScalar(.7));
        spot.rotation.y = j * 2.1;
      }
    }
  }

  function starfish(x, z, size = .35, color = '#d79a70', rotation = 0) {
    const positions = [], colors = [];
    const c = new THREE.Color(color);
    const points = [];
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU + rotation;
      const r = i % 2 === 0 ? size : size * .39;
      points.push([Math.cos(a) * r, .018, Math.sin(a) * r]);
    }
    for (let i = 0; i < 10; i++) {
      const p = points[i], q = points[(i + 1) % 10];
      const tint = c.clone().multiplyScalar(i % 2 === 0 ? 1.09 : .9);
      for (const v of [[0, size * .25, 0], q, p]) { positions.push(...v); colors.push(tint.r, tint.g, tint.b); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const star = mesh(staticGroup, geo, plain, [x, groundY(x, z) + .035, z]);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU + rotation;
      for (let j = 1; j <= 3; j++) mesh(star, new THREE.IcosahedronGeometry(size * .023, 0), plain, [Math.cos(a) * size * j * .2, size * (.26 - j * .05), Math.sin(a) * size * j * .2], '#ebbd8d');
    }
  }

  function pottery() {
    function pot(x, z, scale, tilt, rotation, color) {
      const group = new THREE.Group();
      group.position.set(x, groundY(x, z) + scale * .16, z);
      group.rotation.set(tilt, rotation, -.18);
      group.scale.setScalar(scale);
      staticGroup.add(group);
      const profile = [[.15, 0], [.23, .04], [.28, .12], [.44, .33], [.47, .52], [.37, .75], [.2, .87], [.18, 1.04], [.23, 1.07], [.24, 1.13], [.17, 1.13], [.14, 1.05], [.145, .92], [.22, .84], [.31, .71], [.35, .52], [.27, .28], [.14, .17], [0, .17]];
      mesh(group, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 11), plain, [0, 0, 0], color, .085);
      const interior = mesh(group, new THREE.CircleGeometry(.155, 11), plain, [0, .89, 0], '#624532');
      interior.rotation.x = -Math.PI / 2;
      for (const side of [-1, 1]) tubeCurve(group, [[side * .2, .92, 0], [side * .4, .92, 0], [side * .49, .75, 0], [side * .37, .6, 0]], .046, plain, color, 5, 6);
      return group;
    }
    pot(2.65, 2.85, .95, -.51, -.3, '#b37b50');
    pot(3.38, 3.02, .65, 1.12, .55, '#c08b60');
    // A shattered amphora neck and a scatter of terracotta sherds.
    const shard = mesh(staticGroup, new THREE.LatheGeometry([new THREE.Vector2(.24, 0), new THREE.Vector2(.28, .11), new THREE.Vector2(.22, .28), new THREE.Vector2(.17, .33)], 7, .4, Math.PI * 1.58), plain, [2.03, groundY(2.03, 2.98) + .13, 2.98], '#bf8a5e');
    shard.rotation.set(.6, -.7, .5);
    for (let i = 0; i < 5; i++) {
      const x = random(2.1, 3.2), z = random(3.15, 3.65);
      const object = mesh(staticGroup, chippedBox(random(.13, .25), .045, random(.1, .22), .025, .025), plain, [x, groundY(x, z) + .04, z], '#c89869');
      object.rotation.set(random(-.2, .2), random(0, TAU), random(-.1, .1));
    }
  }

  function treasureChest() {
    const group = new THREE.Group();
    group.position.set(-2.4, groundY(-2.4, 2.88) + .025, 2.88);
    group.rotation.y = -.16;
    world.add(group);
    const wood = ['#655537', '#77633e', '#8b7045', '#79603c', '#857347'];
    // Dark open interior, with real planks on all four sides.
    mesh(group, new THREE.BoxGeometry(1.34, .1, .83), plain, [0, .08, 0], '#4a4730');
    for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
      mesh(group, chippedBox(.197, .6, .075, .01, .003), plain, [(i - 3) * .2, .39, side * .407], pick(wood), .03);
    }
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) mesh(group, chippedBox(.09, .6, .19, .01, .003), plain, [side * .697, .39, (i - 1.5) * .2], pick(wood), .035);
    const metalColor = '#d4b955', metalDark = '#a78d3d';
    for (const side of [-1, 1]) {
      mesh(group, new THREE.BoxGeometry(1.46, .1, .045), gold, [0, .14, side * .458], metalDark, .04);
      mesh(group, new THREE.BoxGeometry(1.48, .09, .055), gold, [0, .694, side * .456], metalColor, .04);
      for (const x of [-.53, .53]) {
        mesh(group, new THREE.BoxGeometry(.115, .61, .048), gold, [x, .4, side * .456], metalColor, .03);
        for (const y of [.17, .49, .66]) {
          const rivet = mesh(group, new THREE.IcosahedronGeometry(.027, 1), gold, [x, y, side * .486], '#e6ce75');
          rivet.scale.z = .45;
        }
      }
    }
    for (const x of [-.739, .739]) for (const y of [.14, .694]) mesh(group, new THREE.BoxGeometry(.04, .09, .9), gold, [x, y, 0], metalDark);

    const lid = new THREE.Group();
    lid.position.set(0, .73, -.445);
    group.add(lid);
    const arcPanel = (a, b, length, radius) => {
      const shape = new THREE.Shape();
      shape.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
      shape.lineTo(Math.cos((a + b) / 2) * radius, Math.sin((a + b) / 2) * radius);
      shape.lineTo(Math.cos(b) * radius, Math.sin(b) * radius);
      shape.lineTo(Math.cos(b) * (radius - .05), Math.sin(b) * (radius - .05));
      shape.lineTo(Math.cos(a) * (radius - .05), Math.sin(a) * (radius - .05));
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 1 });
      geo.rotateY(-Math.PI / 2);
      geo.translate(length / 2, 0, .445);
      return geo;
    };
    for (let i = 0; i < 9; i++) mesh(lid, arcPanel(i / 9 * Math.PI + .009, (i + 1) / 9 * Math.PI - .009, 1.44, .454), plain, [0, 0, 0], wood[i % wood.length], .025);
    for (const x of [-.53, .53]) for (let i = 0; i < 9; i++) {
      mesh(lid, arcPanel(i / 9 * Math.PI, (i + 1) / 9 * Math.PI, .12, .477), gold, [x, 0, 0], metalColor, .04);
      if (i % 2 === 0) mesh(lid, new THREE.IcosahedronGeometry(.024, 0), gold, [x, Math.sin((i + .5) / 9 * Math.PI) * .488, .445 + Math.cos((i + .5) / 9 * Math.PI) * .488], '#e5ce79');
    }
    const capShape = new THREE.Shape();
    capShape.moveTo(-.445, 0);
    for (let i = 0; i <= 9; i++) { const a = Math.PI - i / 9 * Math.PI; capShape.lineTo(Math.cos(a) * .445, Math.sin(a) * .445); }
    capShape.closePath();
    const capGeo = new THREE.ExtrudeGeometry(capShape, { depth: .04, bevelEnabled: false });
    capGeo.rotateY(-Math.PI / 2);
    for (const x of [-.7, .74]) mesh(lid, capGeo.clone(), plain, [x, 0, .445], '#72613c');
    mesh(lid, chippedBox(.23, .29, .065, .02, .002), gold, [0, -.045, .926], '#d9bc5a');
    const lock = mesh(lid, new THREE.CircleGeometry(.041, 8), plain, [0, -.016, .964], '#414632');
    mesh(lid, new THREE.BoxGeometry(.033, .06, .003), plain, [0, -.06, .965], '#414632');

    for (let i = 0; i < 65; i++) {
      const coin = mesh(group, new THREE.CylinderGeometry(.068, .068, .024, 9), gold, [random(-.57, .57), random(.23, .48), random(-.31, .32)], pick(['#d5b44d', '#e2c768', '#bba048']), .04);
      coin.rotation.set(random(-.22, .22), random(0, TAU), random(-.22, .22));
    }
    for (let i = 0; i < 26; i++) {
      const x = -2.4 + random(-.7, 1.15), z = 2.88 + random(.6, 1.4);
      const coin = mesh(staticGroup, new THREE.CylinderGeometry(random(.045, .064), .058, .025, 8), gold, [x, groundY(x, z) + .026, z], pick(['#d9bd64', '#c7af55', '#bba65b']), .045);
      coin.rotation.z = random(-.18, .18);
    }
    batchLocal(lid);
    batchLocal(group, [lid]);
    group.traverse(child => { if (child.isMesh) { child.userData.feature = 'treasure'; interactive.push(child); } });
    return { group, lid, open: false, amount: 0 };
  }

  island();
  // Geological silhouette: high in the back, open sand at the heart of the garden.
  [
    [-4.7, -2.75, .94, 1.16], [-4.8, -1.45, .57, .63], [-3.3, -3.35, .8, .8],
    [-.45, -3.85, 1.08, 1.48], [1.8, -3.62, 1.26, 1.87], [3.25, -3.23, 1.0, 1.39],
    [4.42, -2.05, 1.02, 1.2], [4.86, -.95, .7, .8], [4.87, 1.16, .92, 1.16],
    [4.73, 1.82, .49, .51], [3.63, 1.33, .37, .38], [-5.0, .3, .64, .56],
    [-4.98, 1.12, .73, .69], [-4.02, 2.68, .71, .88], [-4.32, 3.21, .32, .38],
    [-3.38, 1.8, .32, .37], [.1, 4.13, .83, .7], [-.67, 4.46, .42, .41],
    [1.04, 4.3, .45, .38], [2.05, -1.47, .64, .73], [-1.5, -3.81, .44, .57],
  ].forEach(args => rock(...args));
  ruins();

  // Tall sea ribbons frame the architecture rather than hiding it.
  [[-5.0, -.45, 3.6, .26], [-5.23, -.93, 3.8, .3], [-4.65, -.53, 2.5, .23],
    [-.97, -3.23, 6.15, .36], [-.35, -3.4, 5.72, .38], [-1.65, -3.0, 4.63, .25],
    [3.36, -1.25, 3.82, .29], [3.72, -1.3, 3.3, .24], [3.2, -.89, 2.5, .28],
    [-4.12, -2.9, 2.1, .2], [2.81, -3.85, 2.88, .26],
  ].forEach(args => makeKelp(...args));

  coral(-4.84, 1.93, 1.25, '#d77994', 5);
  coral(4.12, 2.05, 1.2, '#d878a0', 5);
  coral(-.55, 3.78, .72, '#e18d73', 4);
  coral(.07, -2.92, 1.4, '#d89759', 5);
  coral(4.89, -.24, 1.13, '#e0a057', 4);
  coral(-4.83, -.18, .83, '#d99a63', 4);
  sponges(-1.8, -.03, 1.02, '#9875c4', 5);
  sponges(-3.55, 2.43, 1.02, '#9869c4', 6);
  sponges(-.4, 4.76, 1.17, '#a376cb', 7);
  sponges(5.02, 2.05, 1.13, '#9970ca', 7);
  sponges(4.25, 2.64, .92, '#d8cc73', 5);
  sponges(-.25, -2.24, .71, '#d6ca72', 5);
  [[-2.65, 4.15, .78], [-1.08, -.52, .75], [1.19, -2.23, .91], [1.04, 1.4, .7],
    [3.88, 3.1, .65], [-3.63, -.4, .48], [-4.89, 2.32, .4], [1.0, -.57, .6],
    [-2.22, -2.7, 1.05], [2.57, -.94, .63], [-1.65, 3.9, .34], [3.63, 2.28, .42],
  ].forEach(args => seaweed(...args));
  starfish(-1.92, 4.45, .36, '#d89b70', .3);
  starfish(2.64, 4.05, .36, '#d99b71', .12);
  starfish(-1.72, 1.58, .31, '#d39a6e', .8);
  starfish(-.96, 3.22, .29, '#cc8c83', -.2);
  starfish(4.66, -1.78, .23, '#d6a77a', .4);
  pottery();
  const chest = treasureChest();

  // Pebbles, tiny shells, and patches of low encrusting reef make the sand feel lived in.
  for (let i = 0; i < 175; i++) {
    const x = random(-5.9, 5.9), z = random(-4.9, 4.9);
    if (Math.hypot(x, z) > boundary(Math.atan2(z, x)) * .9) continue;
    const r = random(.027, .105);
    const stone = mesh(staticGroup, new THREE.IcosahedronGeometry(r, 0), matte, [x, groundY(x, z) + r * .35, z], pick(['#81b7a3', '#9ac5ad', '#7eab9c', '#b3cbaa']), .1);
    stone.scale.set(1.2, random(.5, .9), 1);
    stone.rotation.y = random(0, TAU);
  }
  for (let i = 0; i < 20; i++) {
    const x = random(-4.3, 4.8), z = random(1, 4.6);
    const shell = mesh(staticGroup, new THREE.SphereGeometry(.08, 7, 4, 0, Math.PI * 1.5, 0, Math.PI / 2), plain, [x, groundY(x, z) + .025, z], pick(['#dbd3a1', '#ded8b3', '#b9bb8b']), .1);
    shell.scale.set(1, .6, 1.25); shell.rotation.y = random(0, TAU);
  }
  for (const [x, z] of [[-4, 1.33], [3.52, 1.19], [-.58, 3.75], [-1.57, -.09], [4.67, 2.0]]) {
    for (let i = 0; i < 12; i++) {
      const a = random(0, TAU), r = random(.18, .65);
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      const encrust = mesh(staticGroup, new THREE.IcosahedronGeometry(random(.05, .11), 0), plain, [px, groundY(px, pz) + .05, pz], pick(['#699c96', '#64928e', '#818dB2', '#84b5a1']), .1);
      encrust.scale.y = .7;
    }
  }
  world.add(batchStatic(staticGroup));
  world.add(batchStatic(kelpGroup));

  const landmarks = {
    treasure: new THREE.Vector3(-2.3, 1.63, 3.08),
    ruins: new THREE.Vector3(-3.25, 4.96, -1.34),
    reef: new THREE.Vector3(4.38, 1.76, 1.5),
  };
  return { world, chest, interactive, landmarks };
}
