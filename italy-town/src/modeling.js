import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

let seed = 89123;
export function rand(a = 0, b = 1) {
  seed = (Math.imul(1664525, seed) + 1013904223) | 0;
  return a + ((seed >>> 0) / 4294967296) * (b - a);
}
export const pick = (a) => a[Math.floor(rand(0, a.length))];
export const mats = {};
export function material(name, color, options = {}) {
  if (!mats[name])
    mats[name] = new THREE.MeshStandardMaterial({
      name,
      color,
      roughness: 0.86,
      ...options,
    });
  return mats[name];
}
export const M = {
  cream: material("ivory plaster", "#e8ddbf"),
  yellow: material("butter plaster", "#e4bf75"),
  pink: material("rose plaster", "#d9937c"),
  blue: material("sea blue plaster", "#83b0bc"),
  trim: material("limestone trim", "#efe3c9"),
  stone: Array.from({ length: 9 }, (_, i) =>
    material(
      `stone ${i}`,
      [
        "#bcb39a",
        "#c3bba6",
        "#cfc5ac",
        "#d2c7ae",
        "#aea994",
        "#ddd0b7",
        "#b9b099",
        "#cbbda2",
        "#d9cfb9",
      ][i],
    ),
  ),
  paver: Array.from({ length: 8 }, (_, i) =>
    material(
      `paver ${i}`,
      [
        "#c9bfa7",
        "#c6b9a0",
        "#ddd1b7",
        "#cfc6b0",
        "#d7cbb1",
        "#bcb49f",
        "#ded5be",
        "#c9bda4",
      ][i],
    ),
  ),
  roof: Array.from({ length: 7 }, (_, i) =>
    material(
      `terracotta ${i}`,
      [
        "#bd572d",
        "#d27135",
        "#ca6430",
        "#df8241",
        "#c06130",
        "#d77a3a",
        "#ba562b",
      ][i],
    ),
  ),
  roofUnder: material("roof shadows", "#8b482e"),
  green: material("sage green shutters", "#527849"),
  teal: material("lagoon shutters", "#388d8d"),
  navy: material("blue shutters", "#356279"),
  window: material("dark glass", "#233e3b", {
    roughness: 0.3,
    metalness: 0.1,
    emissive: "#ffc178",
    emissiveIntensity: 0,
  }),
  wood: material("aged chestnut", "#815832"),
  woodLight: material("honey oak", "#b68b50"),
  woodDark: material("wood shadows", "#514332"),
  iron: material("wrought iron", "#354d43", {
    roughness: 0.65,
    metalness: 0.3,
  }),
  pot: material("clay pots", "#bc7547"),
  potLight: material("pale clay pots", "#d18c56"),
  soil: material("pot soil", "#544535"),
  foliage: ["#547938", "#6e903b", "#819c42", "#3d682f", "#92a548"].map((c, i) =>
    material(`leaf ${i}`, c),
  ),
  flower: ["#d9588b", "#e17da5", "#eed8bc", "#edb52b", "#fff0b7"].map((c, i) =>
    material(`petal ${i}`, c),
  ),
  brass: material("old brass", "#b8954c", { metalness: 0.45, roughness: 0.5 }),
  rope: material("hemp rope", "#b89c66"),
  white: material("painted ivory", "#ede4cb"),
  stripe: material("awning blue", "#508d9c"),
  lamp: material("lantern glass", "#edddac", {
    emissive: "#ffb947",
    emissiveIntensity: 0.13,
    roughness: 0.4,
  }),
};
const geoCache = new Map();
function cache(key, create) {
  if (!geoCache.has(key)) geoCache.set(key, create());
  return geoCache.get(key);
}
export function mesh(
  parent,
  geometry,
  mat,
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  scale,
) {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  if (scale) m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function group(parent, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.set(...rot);
  parent.add(g);
  return g;
}
export function box(parent, dim, pos, mat, bevel = 0.015, rot = [0, 0, 0]) {
  const [w, h, d] = dim;
  const r = Math.min(bevel, Math.min(w, h, d) * 0.22);
  const key = `box:${dim.join(",")}:${r}`;
  return mesh(
    parent,
    cache(key, () =>
      r > 0.005
        ? new RoundedBoxGeometry(w, h, d, 1, r)
        : new THREE.BoxGeometry(w, h, d),
    ),
    mat,
    pos,
    rot,
  );
}
export function cylinder(
  parent,
  rt,
  rb,
  h,
  pos,
  mat,
  sides = 12,
  rot = [0, 0, 0],
) {
  return mesh(
    parent,
    cache(
      `c:${rt}:${rb}:${h}:${sides}`,
      () => new THREE.CylinderGeometry(rt, rb, h, sides),
    ),
    mat,
    pos,
    rot,
  );
}
export function sphere(parent, pos, scale, mat, detail = 0) {
  return mesh(
    parent,
    cache(`ico:${detail}`, () => new THREE.IcosahedronGeometry(1, detail)),
    mat,
    pos,
    [rand(0, 3), rand(0, 3), rand(0, 3)],
    scale,
  );
}
export function torus(
  parent,
  r,
  tube,
  pos,
  mat,
  rot = [Math.PI / 2, 0, 0],
  arc = Math.PI * 2,
) {
  return mesh(
    parent,
    cache(
      `t:${r}:${tube}:${arc}`,
      () => new THREE.TorusGeometry(r, tube, 5, 24, arc),
    ),
    mat,
    pos,
    rot,
  );
}
export function beam(parent, a, b, radius, mat, radius2 = radius, sides = 7) {
  const va = new THREE.Vector3(...a),
    vb = new THREE.Vector3(...b),
    delta = vb.clone().sub(va);
  const m = cylinder(
    parent,
    radius2,
    radius,
    delta.length(),
    va.clone().add(vb).multiplyScalar(0.5).toArray(),
    mat,
    sides,
  );
  m.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.normalize(),
  );
  return m;
}
export function tube(
  parent,
  points,
  radius,
  mat,
  segments = 32,
  closed = false,
) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    closed,
  );
  return mesh(
    parent,
    new THREE.TubeGeometry(curve, segments, radius, 5, closed),
    mat,
  );
}
export function extrudePolygon(parent, points, depth, y, mat, bevel = 0) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], i) =>
    i ? shape.lineTo(x, -z) : shape.moveTo(x, -z),
  );
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSegments: 1,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  return mesh(parent, geo, mat, [0, y, 0]);
}
export function sign(parent, text, w, h, pos, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = Math.round((768 * h) / w);
  const c = canvas.getContext("2d");
  c.fillStyle = options.bg || "#785630";
  c.fillRect(0, 0, canvas.width, canvas.height);
  if (options.border !== false) {
    c.strokeStyle = options.border || "#d3b97c";
    c.lineWidth = 7;
    c.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  }
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = options.color || "#f4ead1";
  const lines = text.split("\n");
  const lineHeight = canvas.height / (lines.length + 0.6);
  lines.forEach((line, i) => {
    c.font = `${options.italic ? "italic" : ""} ${Math.min(lineHeight * 0.65, canvas.width / (line.length * 0.56))}px ${options.font || "Georgia"}`;
    c.fillText(
      line,
      canvas.width / 2,
      canvas.height / 2 + (i - (lines.length - 1) / 2) * lineHeight,
    );
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  return mesh(
    parent,
    new THREE.PlaneGeometry(w, h),
    mat,
    pos,
    options.rot || [0, 0, 0],
  );
}
export function bake(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const batches = new Map();
  const source = [];
  root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    const keys = Object.keys(o.geometry.attributes).sort().join(",");
    const key = `${o.material.uuid}:${keys}:${!!o.geometry.index}`;
    if (!batches.has(key)) batches.set(key, { mat: o.material, geos: [] });
    const g = o.geometry.clone();
    g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    batches.get(key).geos.push(g);
    source.push(o);
  });
  source.forEach((o) => o.removeFromParent());
  for (const { mat, geos } of batches.values()) {
    const geo = mergeGeometries(geos, false);
    if (geo) {
      mesh(root, geo, mat);
    }
    geos.forEach((g) => g.dispose());
  }
}
export { THREE };
