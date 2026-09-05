import * as THREE from 'three';
import { V, random, pick, mat, mesh, cylinderBetween, tube, leaf, vertexMesh, contactShadow } from './utils.js';
import { heightAt } from './terrain.js';

const greens = ['#557e28', '#6c952e', '#7da135', '#4d7629', '#8aab3b', '#658d2d'];
const animated = [];
function palmFrond(parent, angle, length, rise, droop, color, width = .5) {
  const group = new THREE.Group(); group.rotation.y = angle; group.userData.animated = true; parent.add(group);
  const center = t => V(t * length, Math.sin(t * Math.PI * .87) * rise - t * t * droop, .07 * Math.sin(t * 3));
  tube(group, Array.from({ length: 13 }, (_, i) => center(i / 12)), .017, mat('#78993a'), 18, 4);
  const positions = [], colors = [], indices = [];
  // Individually folded pinnae, broad at the spine with slightly hooked tips.
  for (let j = 0; j < 14; j++) {
    const t = .075 + j * .061, w = Math.pow(Math.sin(t * Math.PI), .67) * width;
    for (const side of [-1, 1]) {
      const a = center(t - .028), b = center(t + .077), tip = center(Math.min(1.04, t + .09)); tip.z += side * w; tip.y -= w * .27;
      const shoulder = center(t + .012); shoulder.z += side * w * .93; shoulder.y -= w * .1;
      const baseEnd = center(t + .075); baseEnd.z += side * w * .81; baseEnd.y -= w * .09;
      const ridge = a.clone().lerp(tip, .48); ridge.y += .035;
      const verts = [a, shoulder, tip, baseEnd, b, ridge], offset = positions.length / 3;
      for (let k = 0; k < verts.length; k++) { positions.push(...verts[k].toArray()); const c = new THREE.Color(color).multiplyScalar(k === 1 || k === 2 ? random(.93, 1.05) : k === 4 ? .8 : 1.02); colors.push(c.r, c.g, c.b); }
      for (let k = 0; k < 5; k++) indices.push(offset + k, offset + (k + 1) % 5, offset + 5);
    }
  }
  vertexMesh(group, positions, indices, colors, { side: THREE.DoubleSide });
  leaf(group, center(.88), center(1.05), .06, color, 0);
  animated.push({ object: group, phase: random(0, 7), amplitude: random(.013, .026), rest: group.rotation.z });
  return group;
}
export function palm(parent, x, z, height, leanX, leanZ, scale = 1) {
  const palm = new THREE.Group(); palm.position.set(x, heightAt(x, z) - .03, z); parent.add(palm); palm.userData.label = 'A LITTLE SHADE';
  const point = t => V(leanX * t * t + .065 * Math.sin(t * Math.PI), t * height, leanZ * t * t);
  const n = Math.round(height / .29);
  for (let i = 0; i < n; i++) {
    const t = i / n, a = point(t), b = point((i + 1) / n), radius = (.265 * (1 - t) + .125 * t) * scale;
    const seg = cylinderBetween(palm, a, b, radius * 1.06, mat(pick(['#8d5e36', '#96663e', '#9f6d3f', '#a57243', '#89603b'])), radius * .94, 9);
    seg.rotation.y += .11 * i;
    const ringA = point(t + .001), ringB = point(t + .006);
    cylinderBetween(palm, ringA, ringB, radius * 1.076, mat('#755039'), radius * 1.055, 9);
    if (i < n - 2) cylinderBetween(palm, point((i + .86) / n), point((i + 1) / n), radius * .97, mat('#9d7145'), radius * .94, 9);
  }
  const crown = new THREE.Group(); crown.position.copy(point(1)); palm.add(crown);
  for (let i = 0; i < 5; i++) palmFrond(crown, i / 5 * Math.PI * 2 + .3, random(1.9, 2.4) * scale, .42, random(1.15, 1.5), pick(['#48762e', '#527d2e', '#5a8731']), .44 * scale);
  for (let i = 0; i < 7; i++) palmFrond(crown, i / 7 * Math.PI * 2 + .05, random(2.05, 2.6) * scale, random(.6, .86), random(.5, .88), pick(greens), .5 * scale);
  for (let i = 0; i < 3; i++) palmFrond(crown, i / 3 * Math.PI * 2 + .4, random(1.3, 1.7) * scale, 1.17, .26, pick(['#8aad3e', '#9cbb48', '#7c9c38']), .32 * scale);
  for (let i = 0; i < 4; i++) { const a = i * 2.4; const coconut = mesh(new THREE.IcosahedronGeometry(.17 * scale, 1), mat('#69512b'), crown, V(Math.cos(a) * .21, -.13, Math.sin(a) * .21)); coconut.scale.y = 1.14; }
  contactShadow(parent, x, z, 2, 1.6, heightAt(x, z) + .025, .36);
  return palm;
}
export function grass(parent, x, z, size = 1, color) {
  const group = new THREE.Group(); group.position.set(x, heightAt(x, z) + .012, z); parent.add(group);
  const positions = [], indices = [], colors = [];
  for (let i = 0; i < 10; i++) {
    const a = random(0, Math.PI * 2), h = random(.18, .49) * size, lean = random(.12, .34) * size, width = random(.018, .036) * size;
    const root = V(random(-.09, .09) * size, 0, random(-.09, .09) * size), dir = V(Math.cos(a), 0, Math.sin(a)), side = V(-dir.z, 0, dir.x).multiplyScalar(width);
    const mid = root.clone().addScaledVector(dir, lean * .28); mid.y = h * .63;
    const tip = root.clone().addScaledVector(dir, lean); tip.y = h;
    const ridge = mid.clone(); ridge.y += .016;
    const verts = [root.clone().add(side), root.clone().sub(side), mid.clone().addScaledVector(side, .52), mid.clone().addScaledVector(side, -.52), ridge, tip], offset = positions.length / 3;
    for (let j = 0; j < verts.length; j++) { positions.push(...verts[j].toArray()); const c = new THREE.Color(color || pick(['#7e923d', '#909c45', '#677c31', '#a5ab4e'])).multiplyScalar(j % 2 ? .87 : 1.06); colors.push(c.r, c.g, c.b); }
    for (const v of [0,1,4,0,4,2,1,3,4,2,4,5,3,5,4]) indices.push(offset + v);
  }
  vertexMesh(group, positions, indices, colors); return group;
}
export function fern(parent, x, z, size = 1, rotation = 0) {
  const group = new THREE.Group(); group.position.set(x, heightAt(x, z), z); group.rotation.y = rotation; parent.add(group);
  for (let f = 0; f < 6; f++) {
    const angle = f * Math.PI / 3 + random(-.2, .2), length = random(.5, .84) * size, dir = V(Math.cos(angle), 0, Math.sin(angle));
    const point = t => dir.clone().multiplyScalar(t * length).add(V(0, Math.sin(t * Math.PI * .77) * length * .7 + t * .12, 0));
    tube(group, Array.from({ length: 7 }, (_, i) => point(i / 6)), .009 * size, mat('#6a8236'), 8, 3);
    for (let i = 1; i < 8; i++) {
      const t = i / 9, p = point(t), width = Math.sin(t * Math.PI) * .23 * size;
      for (const side of [-1, 1]) { const tip = p.clone().addScaledVector(V(-dir.z, 0, dir.x), side * width).addScaledVector(dir, .1 * size); tip.y += .035; leaf(group, p, tip, .065 * size * Math.sin(t * Math.PI), pick(greens), .018); }
    }
    leaf(group, point(.81), point(1.07), .035 * size, '#94ac3c', .015);
  }
  return group;
}
function broadPlant(parent, x, z, size) {
  const group = new THREE.Group(); group.position.set(x, heightAt(x, z), z); parent.add(group);
  for (let i = 0; i < 7; i++) { const a = i * 2.4, l = random(.35, .68) * size; leaf(group, V(0,.02,0), V(Math.cos(a) * l * .75, l * random(.6,1.2), Math.sin(a) * l * .75), .1 * size, pick(['#5f8a32','#769b38','#a7b647']), .12); }
}
function flowers(parent, x, z, size, color) {
  const group = new THREE.Group(); group.position.set(x, heightAt(x, z), z); parent.add(group);
  const petalGeo = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < 7; i++) {
    const a = random(0, 6.28), radius = random(.03, .2) * size, h = random(.25, .65) * size, top = V(Math.cos(a) * radius, h, Math.sin(a) * radius);
    cylinderBetween(group, V(top.x * .4, 0, top.z * .4), top, .007 * size, mat('#6d8838'), .004 * size, 4);
    for (let k = 1; k < 4; k++) { const p = top.clone().multiplyScalar(k / 4), side = k % 2 ? 1 : -1; leaf(group, p, p.clone().add(V(.1 * side * size, .08 * size, .055 * size)), .024 * size, '#708d39'); }
    for (let f = 0; f < 2; f++) { const center = top.clone().add(V(f * .03, -.08 * f, 0));
      for (let p = 0; p < 5; p++) { const angle = p * Math.PI * 2 / 5; const petal = mesh(petalGeo, mat(color), group, center.clone().add(V(Math.cos(angle) * .036 * size, Math.sin(angle) * .035 * size, 0))); petal.scale.set(.04 * size, .04 * size, .021 * size); }
      mesh(new THREE.IcosahedronGeometry(.018 * size, 0), mat('#efc463'), group, center.clone().add(V(0,0,.018)));
    }
  }
}
export function createFoliage(parent) {
  const palms = [palm(parent, -2.2, -2.8, 4.95, -.7, -.2, 1.05), palm(parent, 1.6, -2.55, 3.72, .5, -.12, .86), palm(parent, 5.08, -.05, 4.02, .54, -.23, .89)];
  const ground = new THREE.Group(); parent.add(ground); parent = ground;
  const beds = [[-2.2,-2.8,1], [1.6,-2.55,.85], [5.08,-.05,.9], [-4,-2.7,.87], [5.4,.7,.85]];
  for (const [x,z,s] of beds) {
    for (let i = 0; i < 5; i++) { const a = i * 2.4, r = random(.3,.7); fern(parent, x + Math.cos(a) * r, z + Math.sin(a) * r, random(.5,.8) * s, a); }
    for (let i = 0; i < 9; i++) { const a = random(0,6.28), r = random(.3,.95); grass(parent,x+Math.cos(a)*r,z+Math.sin(a)*r,random(.6,1.2)*s); }
    broadPlant(parent,x+.27,z+.2,s);
  }
  fern(parent,-4.3,-2.7,1.2,.6); broadPlant(parent,-4.15,-3.04,1.05);
  flowers(parent,-3.67,-2.16,.86,'#d786ac'); flowers(parent,-3.3,-2.32,.65,'#e2a3bd');
  flowers(parent,4.34,.1,.95,'#c77faa'); flowers(parent,5.71,-.08,1.04,'#df8953');
  fern(parent,5.4,1.28,.8,.7); fern(parent,6.2,.65,.8,.2); flowers(parent,5.98,.65,.85,'#df8953');
  for (const [x,z,s] of [[-3.5,-1.9,.7],[-.02,.12,.8],[.42,.35,.65],[4.8,1.45,.65],[6,1.5,.8],[-4.9,-1.38,.6],[.4,-1.85,.9]]) grass(parent,x,z,s);
  for (let i = 0; i < 7; i++) grass(parent,random(2.5,4.3),random(4.1,5.1),random(.7,1.2),'#3c9f77');
  return { palms, ground, update(time) { for (const a of animated) a.object.rotation.z = a.rest + Math.sin(time * .7 + a.phase) * a.amplitude; } };
}
