import * as THREE from 'three';
import { random } from './geometry.js';

function makeCaustics() {
  const size = 512, cells = 9;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const points = Array.from({ length: cells * cells }, (_, i) => ({ x: i % cells + random(.12, .88), y: Math.floor(i / cells) + random(.12, .88) }));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * cells + .3 * Math.sin(y / size * Math.PI * 8) + .12 * Math.sin(x / size * Math.PI * 6);
    const v = y / size * cells + .33 * Math.sin(x / size * Math.PI * 6) + .12 * Math.cos(y / size * Math.PI * 10);
    let first = 20, second = 20;
    const gx = Math.floor(u), gy = Math.floor(v);
    for (let iy = -1; iy <= 1; iy++) for (let ix = -1; ix <= 1; ix++) {
      const px = gx + ix, py = gy + iy;
      const point = points[((py % cells + cells) % cells) * cells + ((px % cells + cells) % cells)];
      const dx = point.x + Math.floor(px / cells) * cells - u;
      const dy = point.y + Math.floor(py / cells) * cells - v;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < first) { second = first; first = distance; }
      else if (distance < second) second = distance;
    }
    const edge = second - first;
    const value = Math.min(255, (Math.exp(-edge * edge * 1500) * .72 + Math.exp(-edge * edge * 160) * .13) * 255);
    const i = (y * size + x) * 4;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

export function createMaterials() {
  const time = { value: 0 };
  const causticTexture = makeCaustics();
  const matte = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .94, metalness: 0 });
  const plain = matte.clone();
  const gold = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .47, metalness: .5 });
  const kelp = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .85, side: THREE.DoubleSide });
  const installCaustics = (material, strength) => {
    material.onBeforeCompile = shader => {
      shader.uniforms.uTime = time;
      shader.uniforms.uCaustics = { value: causticTexture };
      shader.vertexShader = `varying vec3 vDioramaWorld; varying float vDioramaUp;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvDioramaWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvDioramaUp = (modelMatrix * vec4(normal, 0.0)).y;');
      shader.fragmentShader = `uniform float uTime; uniform sampler2D uCaustics; varying vec3 vDioramaWorld; varying float vDioramaUp;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        vec2 causticUV = vDioramaWorld.xz * 0.19;
        causticUV += vec2(sin(vDioramaWorld.z * .8 + uTime * .23), cos(vDioramaWorld.x * .75 + uTime * .18)) * .012;
        float causticA = texture2D(uCaustics, causticUV + vec2(uTime * .005, uTime * .003)).r;
        float causticB = texture2D(uCaustics, causticUV * 1.17 - vec2(uTime * .004, uTime * .002)).r;
        float shallow = (1.0 - smoothstep(0.0, 4.5, vDioramaWorld.y)) * (.12 + .88 * max(vDioramaUp, 0.0));
        float caustic = min(causticA, causticB) * 1.5 + causticA * .3;
        diffuseColor.rgb += vec3(.57, .9, .72) * caustic * ${strength.toFixed(2)} * shallow;
      `);
    };
    material.customProgramCacheKey = () => `caustics-${strength}`;
  };
  installCaustics(matte, .52);
  kelp.onBeforeCompile = shader => {
    shader.uniforms.uTime = time;
    shader.vertexShader = `attribute vec2 sway; uniform float uTime;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      float swayHeight = max(0.0, position.y - sway.x);
      transformed.x += sin(uTime * .65 + sway.y + swayHeight * 1.25) * .055 * swayHeight;
      transformed.z += sin(uTime * .48 + sway.y + swayHeight * .9) * .035 * swayHeight;
    `);
  };
  kelp.customProgramCacheKey = () => 'kelp-sway';
  return { matte, plain, gold, kelp, time, causticTexture };
}
