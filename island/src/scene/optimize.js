import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Batch static geometry by material while leaving animated subtrees intact. */
export function batch(root) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert(), buckets = new Map(), old = [];
  function visit(object) {
    if (object !== root && object.userData.animated) return;
    if (object.isMesh && !Array.isArray(object.material) && !object.material.transparent) {
      let geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      if (!object.material.map) geometry.deleteAttribute('uv');
      if (!object.material.vertexColors) geometry.deleteAttribute('color');
      geometry.clearGroups();
      const key = object.material.uuid + Object.keys(geometry.attributes).sort().join() + object.castShadow + object.receiveShadow;
      if (!buckets.has(key)) buckets.set(key, { geometries: [], material: object.material, cast: object.castShadow, receive: object.receiveShadow });
      buckets.get(key).geometries.push(geometry); old.push(object);
    }
    for (const child of object.children) visit(child);
  }
  visit(root);
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geometries, false);
    if (!merged) throw new Error('Could not batch scene geometry.');
    const mesh = new THREE.Mesh(merged, b.material); mesh.castShadow = b.cast; mesh.receiveShadow = b.receive; root.add(mesh);
    b.geometries.forEach(g => g.dispose());
  }
  for (const m of old) m.removeFromParent();
}
