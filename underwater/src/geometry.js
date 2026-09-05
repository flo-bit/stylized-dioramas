import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let seed = 73918;
export function random(min = 0, max = 1) {
  seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
  return min + ((seed >>> 0) / 4294967296) * (max - min);
}
export const pick = (values) => values[Math.floor(random(0, values.length))];
export const clamp = THREE.MathUtils.clamp;
export const Y = new THREE.Vector3(0, 1, 0);

export function colorize(geometry, color, variation = .07) {
  if (geometry.index) geometry = geometry.toNonIndexed();
  const base = new THREE.Color(color);
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  const tint = new THREE.Color();
  for (let i = 0; i < colors.length; i += 9) {
    tint.copy(base).multiplyScalar(random(1 - variation, 1 + variation));
    for (let k = 0; k < 3; k++) tint.toArray(colors, i + k * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function mesh(parent, geometry, material, position = [0, 0, 0], color, variation) {
  if (color !== undefined) geometry = colorize(geometry, color, variation);
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function chippedBox(width, height, depth, bevel = .06, roughness = .025) {
  const points = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const corner = new THREE.Vector3(x * width / 2, y * height / 2, z * depth / 2);
    corner.x += random(-roughness, roughness);
    corner.y += random(-roughness, roughness);
    corner.z += random(-roughness, roughness);
    points.push(corner.clone().add(new THREE.Vector3(-x * bevel, 0, 0)));
    points.push(corner.clone().add(new THREE.Vector3(0, -y * bevel, 0)));
    points.push(corner.clone().add(new THREE.Vector3(0, 0, -z * bevel)));
  }
  return new ConvexGeometry(points);
}

export function stoneCylinder(radius, height, segments = 12, roughness = .025, fluted = false) {
  const vertices = [], indices = [];
  const rows = 4;
  const n = fluted ? 40 : segments;
  const offset = fluted ? .02 : random(0, Math.PI / n);
  const radii = Array.from({ length: n }, (_, i) => radius + random(-roughness, roughness) - (fluted ? .017 * (1 + Math.cos(i / n * Math.PI * 20)) : 0));
  for (let j = 0; j < rows; j++) {
    const y = [-height / 2, -height / 2 + .04, height / 2 - .04, height / 2][j];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + offset;
      const r = radii[i] * (j === 0 || j === rows - 1 ? .974 : 1);
      vertices.push(Math.cos(a) * r, y + random(-.012, .012), Math.sin(a) * r);
    }
  }
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < n; i++) {
    const a = j * n + i, b = j * n + (i + 1) % n, c = (j + 1) * n + i, d = (j + 1) * n + (i + 1) % n;
    indices.push(a, c, b, b, c, d);
  }
  vertices.push(0, -height / 2, 0, 0, height / 2, 0);
  for (let i = 0; i < n; i++) {
    indices.push(rows * n, i, (i + 1) % n);
    indices.push(rows * n + 1, (rows - 1) * n + (i + 1) % n, (rows - 1) * n + i);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  return geo;
}

export function branch(parent, from, to, radius1, radius2, material, color, segments = 6) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const object = mesh(parent, new THREE.CylinderGeometry(radius2, radius1, direction.length(), segments, 1), material, a.add(b).multiplyScalar(.5).toArray(), color);
  object.quaternion.setFromUnitVectors(Y, direction.normalize());
  return object;
}

export function tubeCurve(parent, points, radius, material, color, radial = 6, tubular = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(parent, new THREE.TubeGeometry(curve, tubular, radius, radial, false), material, [0, 0, 0], color);
}

export function flatShape(points, depth = .03) {
  const shape = new THREE.Shape();
  shape.moveTo(...points[0]);
  points.slice(1).forEach(p => shape.lineTo(...p));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
}

/** Batch within a movable object's own coordinates, retaining its animation pivots. */
export function batchLocal(group, keep = []) {
  const parent = group.parent;
  const position = group.position.clone(), quaternion = group.quaternion.clone(), scale = group.scale.clone();
  group.remove(...keep);
  parent?.remove(group);
  group.position.set(0, 0, 0); group.quaternion.identity(); group.scale.setScalar(1);
  const batched = batchStatic(group);
  group.clear();
  group.add(batched, ...keep);
  group.position.copy(position); group.quaternion.copy(quaternion); group.scale.copy(scale);
  parent?.add(group);
  return group;
}

/** Collapse the static sculpture to a handful of draw calls. Animated objects stay separate. */
export function batchStatic(group) {
  group.updateMatrixWorld(true);
  const batches = new Map();
  group.traverse(child => {
    if (!child.isMesh) return;
    const key = `${child.material.uuid}-${child.castShadow}-${child.receiveShadow}`;
    if (!batches.has(key)) batches.set(key, { material: child.material, cast: child.castShadow, receive: child.receiveShadow, geometries: [] });
    let geometry = child.geometry.clone();
    if (geometry.index) geometry = geometry.toNonIndexed();
    geometry.applyMatrix4(child.matrixWorld);
    // Only common attributes are needed by our untextured, vertex-colored materials.
    for (const name of Object.keys(geometry.attributes)) {
      if (!['position', 'normal', 'color', 'sway', 'uv'].includes(name)) geometry.deleteAttribute(name);
    }
    if (!geometry.attributes.uv) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
    batches.get(key).geometries.push(geometry);
  });
  const result = new THREE.Group();
  for (const { material, cast, receive, geometries } of batches.values()) {
    const geometry = mergeGeometries(geometries, false);
    if (!geometry) throw new Error('Could not merge static geometry.');
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = cast;
    object.receiveShadow = receive;
    result.add(object);
    geometries.forEach(g => g.dispose());
  }
  group.traverse(child => { if (child.isMesh) child.geometry.dispose(); });
  return result;
}
