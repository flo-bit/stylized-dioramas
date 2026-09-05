import * as THREE from 'three';
import Delaunator from 'delaunator';
import { shore, WATER_Y, inside } from './terrain.js';
import { random, V, tube, mat } from './utils.js';

const glsl = `
  uniform float uTime;
  varying vec3 vWaterPosition;
  float hash21(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  vec2 hash22(vec2 p) { return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453); }
  float seaNoise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
  }
  float cells(vec2 p) {
    vec2 n=floor(p),f=fract(p); float a=8.,b=8.;
    for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++) {
      vec2 g=vec2(float(i),float(j)); vec2 o=hash22(n+g);
      o=.5+.36*sin(uTime*.28+6.2831*o);
      float d=length(g+o-f);
      if(d<a){b=a;a=d;} else if(d<b){b=d;}
    }
    return b-a;
  }
  float shoreline(float x) {return .05+.49*x+.48*sin(x*.86+.2)-.2*cos(x*1.5);}
`;
export function createWater(parent, outline) {
  const d = ([x, z]) => z - shore(x) - .412;
  const boundary = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    if (d(a) >= 0) boundary.push(a);
    if ((d(a) >= 0) !== (d(b) >= 0)) {
      let lo = 0, hi = 1;
      for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2, p = [THREE.MathUtils.lerp(a[0], b[0], m), THREE.MathUtils.lerp(a[1], b[1], m)]; if ((d(p) >= 0) === (d(a) >= 0)) lo = m; else hi = m; }
      const t = (lo + hi) / 2; boundary.push([THREE.MathUtils.lerp(a[0], b[0], t), THREE.MathUtils.lerp(a[1], b[1], t)]);
    }
  }
  const edgeBoundary = [...boundary];
  const last = boundary.at(-1), first = boundary[0];
  for (let x = last[0] + .07; x < first[0]; x += .07) boundary.push([x, shore(x) + .412]);
  const points = [...boundary];
  for (let x = -7.3; x < 7.4; x += .22) for (let z = -5.5; z < 5.6; z += .22) { const p = [x + random(-.04, .04), z + random(-.04, .04)]; if (d(p) > .06 && inside(...p, .08)) points.push(p); }
  const triangles = Delaunator.from(points).triangles, positions = [], indices = [];
  for (const p of points) positions.push(p[0], WATER_Y, p[1]);
  for (let i = 0; i < triangles.length; i += 3) {
    const a = points[triangles[i]], b = points[triangles[i + 1]], c = points[triangles[i + 2]], x = (a[0] + b[0] + c[0]) / 3, z = (a[1] + b[1] + c[1]) / 3;
    if (z - shore(x) >= .402) indices.push(triangles[i], triangles[i + 1], triangles[i + 2]);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .32, metalness: .06, transparent: true, opacity: .88, side: THREE.DoubleSide, depthWrite: false });
  const time = { value: 0 };
  material.onBeforeCompile = shader => {
    shader.uniforms.uTime = time;
    shader.vertexShader = 'uniform float uTime; varying vec3 vWaterPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vWaterPosition=position;
      transformed.y += .009*sin(position.x*2.8+position.z*2.1+uTime*.75)+.005*sin(position.z*4.2-position.x*1.8-uTime*.9);`);
    shader.fragmentShader = glsl + shader.fragmentShader;
    const c = hex => { const v = new THREE.Color(hex); return `vec3(${v.r.toFixed(5)},${v.g.toFixed(5)},${v.b.toFixed(5)})`; };
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 p=vWaterPosition.xz;
      float depth=p.y-shoreline(p.x)-.412;
      vec2 warp=vec2(seaNoise(p*2.8+uTime*.09),seaNoise(p*2.5-uTime*.07));
      float field=seaNoise(p*1.25+warp*1.2);
      vec3 ocean=mix(${c('#10aaa7')},${c('#087e91')},smoothstep(.9,4.8,depth)*.64+field*.22);
      ocean=mix(${c('#a9dcb4')},ocean,smoothstep(-.1,1.12,depth));
      vec2 ripple=warp*1.8+vec2(sin(p.y*9.+uTime*.5),cos(p.x*8.-uTime*.4))*.055;
      float caustic=1.-smoothstep(.028,.12,cells(p*2.1+ripple));
      ocean=mix(ocean,${c('#75d7c8')},caustic*(.085+.055*field));
      ocean+=.007*seaNoise(p*8.+warp);
      float breakUp=seaNoise(p*7.+warp+uTime*.08);
      float tide=depth + (seaNoise(p*3.4+uTime*.05)-.5)*.20;
      float foam1=1.-smoothstep(.019,.059,abs(tide-.045-.022*sin(uTime*.7+p.x*2.)));
      float foam2=pow(max(0.,sin(tide*24.+seaNoise(p*4.)*4.-uTime*.7)),14.)*exp(-depth*2.6)*smoothstep(.12,.28,depth);
      float lace=(1.-smoothstep(.025,.082,cells(p*5.7+warp)))*(1.-smoothstep(.22,.75,depth))*.48;
      float foam=clamp(foam1*.88+foam2*.72+lace,0.,.92);
      diffuseColor.rgb*=mix(ocean,${c('#fffce5')},foam);
      diffuseColor.a = mix(.93,.99,foam);
    `);
  };
  const water = new THREE.Mesh(geo, material); water.userData.aoSurface = true; water.receiveShadow = true; water.renderOrder = 2; parent.add(water);
  // Translucent cutaway lip on the exposed ocean edge.
  const sidePos = [], sideColors = [];
  for (let i = 0; i < edgeBoundary.length - 1; i++) {
    const a = edgeBoundary[i], b = edgeBoundary[i + 1];
    sidePos.push(a[0], -.18, a[1], b[0], -.18, b[1], a[0], WATER_Y, a[1], b[0], -.18, b[1], b[0], WATER_Y, b[1], a[0], WATER_Y, a[1]);
    for (let j = 0; j < 6; j++) { const c = new THREE.Color(j === 0 || j === 1 || j === 3 ? '#319f99' : '#6ed9c5'); sideColors.push(c.r, c.g, c.b); }
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sidePos, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sideColors, 3)); sg.computeVertexNormals();
  const side = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .35, transparent: true, opacity: .76, side: THREE.DoubleSide })); parent.add(side);
  const rim = edgeBoundary.map(([x, z]) => V(x * .995, WATER_Y + .006, z * .994));
  tube(parent, rim, .016, mat('#c5f3dd', { transparent: true, opacity: .66, depthWrite: false }), 190, 3).renderOrder = 3;
  for (let start = 3; start < edgeBoundary.length - 9; start += 12) {
    const pts = edgeBoundary.slice(start, start + 8).map(([x, z], i) => V(x * (.98 + .003 * Math.sin(i)), WATER_Y + .011, z * .98));
    tube(parent, pts, .01, mat('#d2f4df', { transparent: true, opacity: .4, depthWrite: false }), 20, 3).renderOrder = 3;
  }
  // A broken, creamy surf crest gives the shallow shader a tactile edge.
  for (let band = 0; band < 3; band++) {
    const fp = [], fi = [];
    for (let x = last[0] + .1; x < first[0] - .1; x += .035) {
      const offset = .49 + band * .245 + .037 * Math.sin(x * 10.2 + band) + .025 * Math.sin(x * 22.3);
      const z = shore(x) + offset, width = (.019 + .012 * Math.sin(x * 14.1) + .008 * Math.cos(x * 30)) * (band ? .68 : 1);
      if (!inside(x, z, .04) || (band && Math.sin(x * 6.8 + band * 2) < -.13)) continue;
      const xx = x + .035, zz = shore(xx) + .49 + band * .245 + .037 * Math.sin(xx * 10.2 + band) + .025 * Math.sin(xx * 22.3), k = fp.length / 3;
      fp.push(x, WATER_Y + .018, z - width, x, WATER_Y + .018, z + width, xx, WATER_Y + .018, zz - width, xx, WATER_Y + .018, zz + width);
      fi.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setIndex(fi); fg.computeVertexNormals();
    const foam = new THREE.Mesh(fg, mat('#fffbe0', { transparent: true, opacity: band ? .53 : .9, side: THREE.DoubleSide, depthWrite: false }));
    foam.receiveShadow = true; foam.renderOrder = 4; parent.add(foam);
  }
  return { update(t) { time.value = t; }, mesh: water };
}
