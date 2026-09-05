import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

class IslandAO extends GTAOPass {
  _overrideVisibility() {
    super._overrideVisibility();
    this.scene.traverse(object => {
      if (object.isMesh && object.visible && object.material.transparent && !object.userData.aoSurface) {
        object.visible = false; this._visibilityCache.push(object);
      }
    });
  }
}
export function createPostprocessing(renderer, scene, camera) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new IslandAO(scene, camera, 1, 1);
  ao.normalMaterial.side = THREE.DoubleSide;
  ao.updateGtaoMaterial({ radius: .43, distanceExponent: 1.5, thickness: 1.2, distanceFallOff: 1, samples: 16 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5 });
  ao.blendIntensity = .76;
  composer.addPass(ao); composer.addPass(new OutputPass());
  return {
    render() { renderer.shadowMap.needsUpdate = true; composer.render(); },
    resize(width, height) { const dpr = renderer.getPixelRatio(); composer.setPixelRatio(dpr); composer.setSize(width, height); ao.setSize(Math.round(width * dpr * .8), Math.round(height * dpr * .8)); }
  };
}
