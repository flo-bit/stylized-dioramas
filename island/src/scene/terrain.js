import * as THREE from 'three';
import Delaunator from 'delaunator';
import { V, random, mat, mesh, smooth, clamp, addColor, contactShadow } from './utils.js';

export const WATER_Y = .245;
export const shore = x => .05 + .49 * x + .48 * Math.sin(x * .86 + .2) - .2 * Math.cos(x * 1.5);
export const heightAt = (x, z) => {
  const d = z - shore(x);
  return .59 - smooth(-.36, 1.35, d) * .76 + (Math.sin(x * 2.2 + z) * Math.cos(z * 2.7) * .019) * (1 - smooth(-.25, .7, d));
};
export const inside = (x, z, pad = 0) => Math.pow(Math.abs(x / (7.4 - pad)), 3.5) + Math.pow(Math.abs(z / (5.65 - pad)), 3.5) < 1;
export function outlinePoint(t, scale = 1) {
  const c = Math.cos(t), s = Math.sin(t), wobble = 1 + .011 * Math.sin(t * 7) + .008 * Math.cos(t * 11);
  return [7.4 * Math.sign(c) * Math.pow(Math.abs(c), 2 / 3.5) * scale * wobble, 5.65 * Math.sign(s) * Math.pow(Math.abs(s), 2 / 3.5) * scale * wobble];
}
export function createTerrain(parent) {
  const outline = Array.from({ length: 160 }, (_, i) => outlinePoint(i / 160 * Math.PI * 2));
  const points = [...outline];
  for (let x = -7.2; x < 7.3; x += .37) for (let z = -5.6; z < 5.6; z += .37) { const xx = x + random(-.14, .14), zz = z + random(-.14, .14); if (inside(xx, zz, .13)) points.push([xx, zz]); }
  for (let x = -7.2; x < 7.3; x += .15) for (const offset of [-.4, 0, .42, .7, 1.2]) { const z = shore(x) + offset; if (inside(x, z, .07)) points.push([x, z]); }
  const tri = Delaunator.from(points).triangles, pos = [], colors = [], uvs = [];
  for (let i = 0; i < tri.length; i += 3) {
    const shade = random(.975, 1.025);
    // Delaunator's clockwise 2D winding faces upward in the x/z plane.
    for (const index of [tri[i], tri[i + 1], tri[i + 2]]) {
      const [x, z] = points[index], d = z - shore(x), y = heightAt(x, z);
      pos.push(x, y, z); uvs.push((x + 7.5) / 15, (z + 5.8) / 11.6);
      const c = new THREE.Color('#edc88a').lerp(new THREE.Color('#d7c38e'), smooth(-.2, .65, d));
      c.lerp(new THREE.Color('#50b7a9'), smooth(.55, 2.8, d)); c.multiplyScalar(shade); colors.push(c.r, c.g, c.b);
    }
  }
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 70000; i++) { ctx.fillStyle = `rgba(151,110,58,${random(.035, .18)})`; ctx.fillRect(random(0, 1024), random(0, 1024), random(.4, 1.8), random(.4, 1.6)); }
  for (let i = 0; i < 9000; i++) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(random(0, 1024), random(0, 1024), 1.3, 1.3); }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.computeVertexNormals();
  mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 1, side: THREE.DoubleSide }), parent);
  // A hand-cut, layered slab rather than a floating plane.
  const sidePos = [], sideColors = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    const layers = [-.77, -.59, -.21, null];
    for (let j = 0; j < 3; j++) {
      const bottomA = layers[j] + .035 * Math.sin(i * .87 + j), bottomB = layers[j] + .035 * Math.sin((i + 1) * .87 + j);
      const topA = j === 2 ? heightAt(...a) : layers[j + 1] + .035 * Math.sin(i * .87 + j + 1);
      const topB = j === 2 ? heightAt(...b) : layers[j + 1] + .035 * Math.sin((i + 1) * .87 + j + 1);
      const scaleA = j === 0 ? .977 : 1, scaleB = j === 0 ? 1 : 1;
      const A = [a[0] * scaleA, bottomA, a[1] * scaleA], B = [b[0] * scaleA, bottomB, b[1] * scaleA], C = [b[0] * scaleB, topB, b[1] * scaleB], D = [a[0] * scaleB, topA, a[1] * scaleB];
      sidePos.push(...A, ...B, ...D, ...B, ...C, ...D);
      const c = new THREE.Color(j === 0 ? '#97744e' : j === 1 ? '#b3915f' : '#dcbc7f').multiplyScalar(random(.9, 1.1));
      for (let k = 0; k < 6; k++) { const shade = k < 3 ? .97 : 1.02; sideColors.push(c.r * shade, c.g * shade, c.b * shade); }
    }
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sidePos, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sideColors, 3)); sg.computeVertexNormals();
  mesh(sg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: THREE.DoubleSide }), parent);
  return outline;
}
export function rock(parent, x, z, sx, sy, sz, submerged = false) {
  const g = new THREE.DodecahedronGeometry(1, 1), p = g.attributes.position;
  const unique = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
    if (!unique.has(key)) unique.set(key, random(.86, 1.12)); const r = unique.get(key);
    const y = p.getY(i); p.setXYZ(i, p.getX(i) * r, (y > .55 ? .55 + (y - .55) * .52 : y) * r, p.getZ(i) * r);
  }
  g.computeVertexNormals(); const colors = [], base = new THREE.Color(submerged ? '#548e7d' : '#a69d7c');
  for (let i = 0; i < p.count; i += 3) {
    const up = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const c = base.clone().lerp(new THREE.Color(submerged ? '#9fc5a0' : '#d9c89e'), clamp(up * .4 + .18, 0, .65)).multiplyScalar(random(.86, 1.12));
    for (let j = 0; j < 3; j++) colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const m = mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }), parent, V(x, heightAt(x, z) + sy * .47, z));
  m.scale.set(sx, sy, sz); m.rotation.y = random(0, Math.PI); m.rotation.z = random(-.13, .13);
  if (!submerged) contactShadow(parent, x, z, sx * 3, sz * 3, heightAt(x, z) + .014, .25);
  return m;
}
export function createRocks(parent) {
  rock(parent, -5.25, -2.75, .86, 1.62, .88);
  rock(parent, -5.8, -1.66, .69, .81, .68);
  rock(parent, -4.8, -1.88, .61, .66, .57);
  rock(parent, -6.62, -1.6, .36, .31, .3);
  rock(parent, -4.05, -1.78, .43, .31, .39);
  rock(parent, -3.55, -1.54, .18, .16, .17);
  rock(parent, 5.7, .83, .65, .79, .66);
  rock(parent, 4.86, .81, .5, .5, .49);
  rock(parent, 5.26, 1.67, .26, .23, .25);
  rock(parent, 5.93, 2.1, .29, .25, .27);
  rock(parent, .05, .6, .36, .3, .33);
  rock(parent, 3.72, 3.12, .35, .28, .3);
  rock(parent, 4.07, 3.4, .18, .17, .16);
  rock(parent, 5.6, 4.25, .5, .42, .43);
  rock(parent, -3.76, .13, .42, .31, .41);
  for (const [x, z, s] of [[-5.3,.05,.25],[-.4,4.9,.4],[2.9,4.8,.47],[4.1,5,.32],[4.48,4.3,.17],[-5.5,3.8,.21],[1.6,4.6,.18]]) rock(parent, x, z, s, s * .65, s * .8, true);
  for (let i = 0; i < 34; i++) { const x = random(2.1, 4.8), z = random(3.8, 5.25); if (inside(x, z, .3)) { const r = random(.045, .13); rock(parent, x, z, r * 1.4, r * .7, r, true); } }
  for (let i = 0; i < 22; i++) {
    const x = random(-6.3, 6.3), z = random(-3.5, 3.5);
    if (z < shore(x) - .35 && inside(x, z, .8)) { const r = random(.025, .07); rock(parent, x, z, r * 1.4, r * .7, r); }
  }
}
