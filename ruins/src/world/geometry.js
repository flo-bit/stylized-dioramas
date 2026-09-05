import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
let seed = 81793;
export function random() {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
export const rand = (a, b) => a + (b - a) * random();
export const pick = a => a[Math.floor(random() * a.length)];
export const clamp = THREE.MathUtils.clamp;
export const stoneColors = ['#939581', '#858973', '#a1a18b', '#949680', '#7f856f', '#aaab91'];
export const mossColors = ['#738a32', '#839737', '#647d2f', '#91a73c', '#557331'];
const dummy = new THREE.Object3D();

export class SolidBatch {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];
    this.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
  }
  add(geometry, position, color, rotation = null, scale = null, variation = .04) {
    let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    dummy.position.copy(position || V());
    dummy.rotation.set(rotation?.x || 0, rotation?.y || 0, rotation?.z || 0);
    dummy.scale.copy(scale || V(1, 1, 1)); dummy.updateMatrix();
    g.applyMatrix4(dummy.matrix);
    g.deleteAttribute('uv'); g.deleteAttribute('uv1');
    if (!g.attributes.normal) g.computeVertexNormals();
    const colors = new Float32Array(g.attributes.position.count * 3);
    const base = new THREE.Color(color);
    for (let i = 0; i < colors.length; i += 9) {
      const c = base.clone().multiplyScalar(rand(1 - variation, 1 + variation));
      for (let k = 0; k < 3; k++) { colors[i + k * 3] = c.r; colors[i + k * 3 + 1] = c.g; colors[i + k * 3 + 2] = c.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.parts.push(g);
    return g;
  }
  finish() {
    if (!this.parts.length) return;
    const mesh = new THREE.Mesh(mergeGeometries(this.parts, false), this.material);
    mesh.castShadow = mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.parts.forEach(g => g.dispose());
    this.parts = [];
    return mesh;
  }
}

export class InstanceBatch {
  constructor(geometry, material) { this.geometry = geometry; this.material = material; this.items = []; }
  add(position, scale, rotation, color) {
    dummy.position.copy(position); dummy.scale.copy(scale);
    if (rotation?.isQuaternion) dummy.quaternion.copy(rotation);
    else dummy.rotation.set(rotation?.x || 0, rotation?.y || 0, rotation?.z || 0);
    dummy.updateMatrix();
    this.items.push({ matrix: dummy.matrix.clone(), color: new THREE.Color(color) });
  }
  finish(scene, castShadow = true) {
    const mesh = new THREE.InstancedMesh(this.geometry, this.material, this.items.length);
    this.items.forEach((item, i) => { mesh.setMatrixAt(i, item.matrix); mesh.setColorAt(i, item.color); });
    mesh.castShadow = castShadow; mesh.receiveShadow = true;
    mesh.computeBoundingSphere(); scene.add(mesh); this.items = [];
    return mesh;
  }
}

const boxes = [];
export function chippedBox(w, h, d, bevel = .055) {
  const shape = new THREE.Shape();
  const x = Math.max(.01, w / 2 - bevel), y = Math.max(.01, h / 2 - bevel);
  shape.moveTo(-x, -y); shape.lineTo(x, -y); shape.lineTo(x, y); shape.lineTo(-x, y); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(.015, d - bevel * 2), bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 1 });
  geo.translate(0, 0, -d / 2 + bevel);
  const p = geo.attributes.position;
  const offsets = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
    if (!offsets.has(key)) offsets.set(key, V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(bevel * .32));
    const o = offsets.get(key); p.setXYZ(i, p.getX(i) + o.x, p.getY(i) + o.y, p.getZ(i) + o.z);
  }
  geo.computeVertexNormals(); return geo;
}
for (let i = 0; i < 9; i++) boxes.push(chippedBox(1, 1, 1, .075));
export function block(batch, x, y, z, w, h, d, color = pick(stoneColors), angle = 0) {
  batch.add(pick(boxes), V(x, y, z), color, V(rand(-.014, .014), angle, rand(-.015, .015)), V(w, h, d));
}

export function tubeGeometry(points, radii, sides = 9, segments = 16) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => p.isVector3 ? p : V(...p)));
  const frames = curve.computeFrenetFrames(segments, false);
  const positions = [], indices = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, p = curve.getPointAt(t);
    const ri = t * (radii.length - 1), a = Math.floor(ri), b = Math.min(a + 1, radii.length - 1);
    const radius = THREE.MathUtils.lerp(radii[a], radii[b], ri - a);
    for (let j = 0; j < sides; j++) {
      const angle = j / sides * Math.PI * 2 + .09 * Math.sin(i * .7);
      const r = radius * (1 + .085 * Math.sin(j * 7.43 + i * .55));
      const v = p.clone().addScaledVector(frames.normals[i], Math.cos(angle) * r).addScaledVector(frames.binormals[i], Math.sin(angle) * r);
      positions.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
    const a = i * sides + j, b = i * sides + (j + 1) % sides, c = (i + 1) * sides + j, d = (i + 1) * sides + (j + 1) % sides;
    indices.push(a, b, c, b, d, c);
  }
  for (let j = 1; j < sides - 1; j++) indices.push(0, j + 1, j, segments * sides, segments * sides + j, segments * sides + j + 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
}
export function branch(batch, points, radii, color = '#635039', sides = 9, segments = 14) {
  const geo = tubeGeometry(points, radii, sides, segments);
  batch.add(geo, V(), color, null, null, .1); geo.dispose();
}

export function pebble(batch, x, y, z, scale, color = '#858674') {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  batch.add(geo, V(x, y, z), color, V(rand(0, 2), rand(0, 6), rand(0, 2)), scale);
  geo.dispose();
}

export function polygonSlab(batch, x, y, z, rx, rz, thickness, color, angle = 0, count = 7) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2; const r = rand(.85, 1.05);
    points.push(new THREE.Vector2(Math.cos(a) * rx * r, Math.sin(a) * rz * r));
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(points), { depth: thickness, bevelEnabled: true, bevelSize: .025, bevelThickness: .02, bevelSegments: 1, steps: 1 });
  g.rotateX(-Math.PI / 2);
  batch.add(g, V(x, y, z), color, V(0, angle, 0)); g.dispose();
}

export function patch(batch, x, y, z, rx, rz, color = pick(mossColors)) {
  const positions = [0, rand(.014, .055), 0], indices = [];
  const n = 9;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = rand(.65, 1.1); positions.push(Math.cos(a) * rx * r, rand(-.009, .012), Math.sin(a) * rz * r); }
  for (let i = 0; i < n; i++) indices.push(0, 1 + (i + 1) % n, 1 + i);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals();
  batch.add(geo, V(x, y, z), color, null, null, .09); geo.dispose();
}
