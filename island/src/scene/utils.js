import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let seed = 718923;
export function random(a = 0, b = 1) { seed = (Math.imul(1664525, seed) + 1013904223) | 0; return a + ((seed >>> 0) / 4294967296) * (b - a); }
export const pick = a => a[Math.floor(random(0, a.length))];
export const clamp = THREE.MathUtils.clamp;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const materialCache = new Map();
export function mat(color, options = {}) {
  const key = color + JSON.stringify(options);
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: .86, ...options }));
  return materialCache.get(key);
}
export function mesh(geometry, material, parent, position) {
  const object = new THREE.Mesh(geometry, material);
  if (position) object.position.copy(position);
  object.castShadow = true; object.receiveShadow = true;
  parent?.add(object); return object;
}
export function box(parent, size, position, material, bevel = .025) {
  return mesh(new RoundedBoxGeometry(...size, 1, bevel), material, parent, V(...position));
}
export function cylinderBetween(parent, a, b, radius, material, topRadius = radius, segments = 7) {
  const dir = b.clone().sub(a);
  const m = mesh(new THREE.CylinderGeometry(topRadius, radius, dir.length(), segments), material, parent, a.clone().add(b).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); return m;
}
export function beam(parent, a, b, width, depth, material) {
  const dir = b.clone().sub(a);
  const m = box(parent, [width, dir.length(), depth], a.clone().add(b).multiplyScalar(.5).toArray(), material, .012);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); return m;
}
export function tube(parent, points, radius, material, segments = 24, radial = 5) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, radial, false), material, parent);
}
export function vertexMesh(parent, positions, indices, colors, options = {}) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (indices) g.setIndex(indices);
  if (colors) g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return mesh(g, mat('#ffffff', { vertexColors: !!colors, roughness: .9, side: THREE.DoubleSide, ...options }), parent);
}
export function addColor(array, color, count = 1) { const c = new THREE.Color(color); for (let i = 0; i < count; i++) array.push(c.r, c.g, c.b); }
export function leaf(parent, root, tip, width, color, bend = .06) {
  const d = tip.clone().sub(root); const side = V(-d.z, 0, d.x).normalize().multiplyScalar(width);
  const mid = root.clone().lerp(tip, .48); mid.y += bend;
  const ridge = mid.clone(); ridge.y += width * .22;
  const p = [...root.toArray(), ...mid.clone().add(side).toArray(), ...tip.toArray(), ...mid.clone().sub(side).toArray(), ...ridge.toArray()];
  const c = new THREE.Color(color), colors = [];
  for (let i = 0; i < 5; i++) { const s = c.clone().multiplyScalar(i === 1 ? 1.1 : i === 3 ? .85 : 1); colors.push(s.r, s.g, s.b); }
  return vertexMesh(parent, p, [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4], colors);
}
let shadowTexture;
export function contactShadow(parent, x, z, sx, sz, y = .575, opacity = .17) {
  if (!shadowTexture) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d'), g = ctx.createRadialGradient(64, 64, 3, 64, 64, 62);
    g.addColorStop(0, 'rgba(56,46,25,0.7)'); g.addColorStop(.45, 'rgba(56,46,25,0.25)'); g.addColorStop(1, 'rgba(56,46,25,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); shadowTexture = new THREE.CanvasTexture(canvas);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); parent.add(m); return m;
}
export function woodTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 125; i++) {
    const y = random(0, 128), start = random(-100, 450); ctx.strokeStyle = `rgba(68,35,13,${random(.03, .16)})`; ctx.lineWidth = random(.4, 1.3);
    ctx.beginPath(); ctx.moveTo(start, y); ctx.bezierCurveTo(start + 90, y + random(-5, 5), start + 180, y + random(-5, 5), start + random(130, 600), y); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
