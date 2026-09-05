import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { between, random, canvasTexture, plasterTexture, asphaltTexture, puddleTexture, textTexture, posterTexture, graffitiTexture } from './textures.js';

const geometryCache = new Map();
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const materials = {};
const mat = (color, roughness = .8, metalness = 0, extras = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extras });
const pick = (arr) => arr[Math.floor(random() * arr.length)];

function box(parent, w, h, d, x, y, z, material, radius = .025) {
  radius = Math.min(radius, w / 3, h / 3, d / 3);
  const key = [w, h, d, radius].join(',');
  if (!geometryCache.has(key)) geometryCache.set(key, radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new THREE.BoxGeometry(w, h, d));
  const mesh = new THREE.Mesh(geometryCache.get(key), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function cylinder(parent, a, b, radius, material, segments = 10, radiusTop = radius) {
  const av = Array.isArray(a) ? V(...a) : a, bv = Array.isArray(b) ? V(...b) : b;
  const delta = bv.clone().sub(av), mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radius, delta.length(), segments), material);
  mesh.position.copy(av).add(bv).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(V(0, 1, 0), delta.normalize()); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function pipe(parent, points, radius, material, segments = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => V(...p)), false, 'centripetal');
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), material); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function plane(parent, w, h, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function ring(parent, radius, thickness, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 6, 28), material); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function bolt(parent, x, y, z) { return cylinder(parent, [x, y, z], [x, y, z + .023], .018, materials.bolt, 6); }
function group(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }

function makeMaterials() {
  materials.leftWall = mat('#b2c5c3', .92, 0, { map: plasterTexture([103, 123, 129], 28), bumpScale: .055 });
  materials.rightWall = mat('#c2bfba', .95, 0, { map: plasterTexture([119, 123, 124], 4), bumpScale: .06 });
  materials.backWall = mat('#a1b1b4', .92, 0, { map: plasterTexture([82, 101, 111], 93), bumpScale: .05 });
  for (const name of ['leftWall', 'rightWall', 'backWall']) materials[name].bumpMap = materials[name].map;
  materials.stone = [0x737e85, 0x7f898c, 0x626f77, 0x849095, 0x748389].map(c => mat(c, .92, 0, { map: plasterTexture([166, 173, 173], c % 71), bumpScale: .025 }));
  materials.paving = [0x746e66, 0x676865, 0x767977, 0x686c6e, 0x777569].map(c => mat(c, .82, .05, { map: plasterTexture([172, 169, 153], c % 71), bumpScale: .018 }));
  materials.dark = mat('#142127', .82, .18);
  materials.iron = mat('#35434a', .53, .66);
  materials.edge = mat('#58646a', .47, .68);
  materials.bolt = mat('#84928f', .45, .7);
  materials.pipe = mat('#616c6e', .58, .55);
  materials.rust = mat('#765142', .96, .1);
  materials.wood = mat('#4d5947', .93);
  materials.woodEdge = mat('#77806a', .88);
  materials.awning = [0x294b5a, 0x345968, 0x385767, 0x2d4656, 0x3e5b65].map(c => mat(c, .57, .3));
  materials.green = mat('#3e674b', .79, .18);
  materials.greenEdge = mat('#617d55', .68, .3);
  materials.soil = mat('#292b23', 1);
  materials.leaf = [0x4d6733, 0x667c38, 0x789444, 0x394f30, 0x838b45].map(c => mat(c, .9));
  materials.brick = [0x80594d, 0x806457, 0x755b51].map(c => mat(c, .97));
}

function buildGround(root) {
  const roadTex = asphaltTexture();
  const road = mat('#cad4dc', .25, .15, { map: roadTex, bumpMap: roadTex, bumpScale: .036 });
  box(root, 10, .48, 8.2, 0, -.3, .1, mat('#34434e', .97), .17);
  box(root, 9.57, .13, 7.75, 0, -.04, .1, road, .1);
  // Individually set edging stones give the base a miniature, tactile silhouette.
  for (const z of [-3.91, 4.11]) {
    for (let i = 0; i < 12; i++) {
      const b = box(root, .807, .43 + between(-.025, .025), .39, -4.55 + i * .826, -.15, z + between(-.015, .015), pick(materials.stone), .055);
      b.rotation.y = between(-.012, .012); b.rotation.z = between(-.007, .007);
    }
  }
  for (const x of [-4.81, 4.81]) {
    for (let i = 0; i < 10; i++) box(root, .4, .44, .774, x, -.15, -3.52 + i * .798, pick(materials.stone), .052);
  }
  const leftPaving = group(root, -2.91, 0, -4.4); leftPaving.rotation.y = Math.PI / 2; leftPaving.scale.x = 1.25;
  for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 4; iz++) {
    box(leftPaving, .68, .15, .51, -4.24 + ix * .704, .13, -.99 + iz * .53, pick(materials.paving), .035);
  }
  for (let i = 0; i < 6; i++) box(leftPaving, .595, .25, .3, -4.25 + i * .616, .09, 1.0, pick(materials.stone), .03);
  for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 6; iz++) {
    box(root, .59, .11, .54, -1.89 + ix * .61, .07, -3.29 + iz * .56, pick(materials.paving), .025);
  }
  for (let ix = 0; ix < 6; ix++) for (let iz = 0; iz < 2; iz++) box(root, .59, .12, .54, 1.23 + ix * .61, .065, -2.77 + iz * .56, pick(materials.paving), .028);
  // A real planar reflection, broken into irregular puddles with small rain distortions.
  const shader = {
    name: 'RainPuddleReflection',
    uniforms: { color: { value: new THREE.Color('#526471') }, tDiffuse: { value: null }, textureMatrix: { value: new THREE.Matrix4() }, maskMap: { value: puddleTexture() }, time: { value: 0 } },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vReflection; varying vec2 vUv; void main(){vUv=uv; vReflection=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D maskMap; uniform vec3 color; uniform float time; varying vec4 vReflection; varying vec2 vUv;
      void main(){float mask=texture2D(maskMap,vUv).r;vec4 coords=vReflection;float wave=sin(vUv.y*410.+sin(vUv.x*57.)*3.+time*.5)*.0011+sin(vUv.y*177.+time*.25)*.0009;coords.x+=wave*coords.w;coords.y+=sin(vUv.x*240.+vUv.y*180.)*.0007*coords.w;vec3 reflected=texture2DProj(tDiffuse,coords).rgb;gl_FragColor=vec4(reflected*vec3(.77,.85,.91),mask*.68);}`
  };
  const reflection = new Reflector(new THREE.PlaneGeometry(9.55, 7.74), { textureWidth: 1024, textureHeight: 1024, clipBias: .003, multisample: 0, shader });
  reflection.rotation.x = -Math.PI / 2; reflection.position.set(0, .032, .1); reflection.material.transparent = true; reflection.material.depthWrite = false; reflection.renderOrder = 1;
  const renderReflection = reflection.onBeforeRender;
  reflection.onBeforeRender = function (renderer, scene, camera) {
    if (!scene.overrideMaterial) renderReflection.call(this, renderer, scene, camera);
  };
  root.add(reflection);
  // Recessed street drain.
  const drain = group(root, -.1, .052, 1.85); drain.rotation.y = -.07;
  box(drain, .96, .055, .72, 0, 0, 0, materials.rust, .025); box(drain, .83, .06, .61, 0, .005, 0, materials.dark, .014);
  for (let i = 0; i < 7; i++) box(drain, .034, .04, .61, -.36 + i * .12, .053, 0, materials.iron, .006);
  box(drain, .84, .042, .035, 0, .054, 0, materials.iron, .006);
  const cover = cylinder(root, [2.28, .03, 2.95], [2.28, .055, 2.95], .25, materials.iron, 32);
  const rr = ring(root, .208, .009, 2.28, .071, 2.95, materials.edge); rr.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 4; i++) box(root, .2, .008, .013, 2.28, .073, 2.85 + i * .065, materials.dark, .003);
  return reflection;
}

function capstones(root, x, front, back, width, y) {
  const n = Math.round(width / .67), sw = width / n;
  for (let i = 0; i < n; i++) {
    box(root, sw - .019, .25, .46, x - width / 2 + sw * (i + .5), y, front, pick(materials.stone), .045);
    box(root, sw - .019, .23, .42, x - width / 2 + sw * (i + .5), y, back, pick(materials.stone), .04);
  }
  const depth = front - back;
  for (const side of [-1, 1]) for (let i = 0; i < Math.floor(depth / .58); i++) box(root, .38, .23, .54, x + side * (width / 2 - .17), y, back + .43 + i * .58, pick(materials.stone), .04);
  box(root, width - .35, .08, depth - .3, x, y - .17, (front + back) / 2, mat('#3c4a4e', .99), .01);
}

function exposedBricks(parent, x, y, z, rows = 3) {
  for (let j = 0; j < rows; j++) for (let i = 0; i < 3; i++) {
    if ((i === 0 || i === 2) && random() > .65) continue;
    box(parent, .235 + between(-.025, .025), .115, .035, x + i * .254 + (j % 2) * .12, y + j * .136, z, pick(materials.brick), .012);
  }
}

function buildings(root) {
  const leftRoot = group(root, 0, 0, 0), rightRoot = group(root, 0, 0, 0), backRoot = group(root, 0, 0, 0);
  leftRoot.userData.zone = 'left'; rightRoot.userData.zone = 'right'; backRoot.userData.zone = 'back';
  box(leftRoot, 3.5, 6.05, .6, -2.8, 3.145, -1.29, materials.leftWall, .065);
  box(rightRoot, 3.62, 6.26, .62, 2.62, 3.25, -2.38, materials.rightWall, .075);
  box(backRoot, 4.45, 4.95, .65, -.925, 2.59, -3.035, materials.backWall, .035);
  capstones(leftRoot, -2.8, -.99, -1.59, 3.66, 6.23);
  capstones(rightRoot, 2.62, -2.07, -2.69, 3.78, 6.47);
  capstones(backRoot, -.925, -2.7, -3.36, 4.53, 5.1);
  // Shallow pilasters, patched lower plaster, visible chipped corners.
  box(leftRoot, .21, 5.91, .13, -4.43, 3.1, -.92, materials.backWall, .025);
  box(leftRoot, .21, 5.9, .16, -1.15, 3.1, -.92, materials.leftWall, .028);
  box(rightRoot, .37, 6.29, .67, 4.31, 3.26, -2.38, materials.rightWall, .06);
  for (let i = 0; i < 9; i++) box(rightRoot, .405, .025, .07, 4.31, .48 + i * .69, -2.024, pick(materials.stone), .008);
  box(leftRoot, 3.5, .15, .12, -2.8, .39, -.92, materials.backWall, .015);
  exposedBricks(leftRoot, -4.15, 3.48, -.976, 3); exposedBricks(leftRoot, -1.91, 5.63, -.973, 2);
  exposedBricks(rightRoot, 2.19, .48, -2.058, 3); exposedBricks(rightRoot, 3.74, 3.1, -2.058, 3); exposedBricks(backRoot, -.78, 3.15, -2.697, 3);
  for (let i = 0; i < 29; i++) {
    const left = i % 2 === 0, x = left ? -4.44 + between(-.05, .1) : 4.29 + between(-.1, .1), y = between(.65, 6.05), z = left ? -.909 : -2.028;
    const chip = box(left ? leftRoot : rightRoot, between(.03, .12), between(.015, .04), .012, x, y, z, pick(materials.stone), .003); chip.rotation.z = between(-.4, .4);
  }
}

function addWindow(root, x, y, z, width = .68, height = 1.03) {
  box(root, width + .23, height + .22, .1, x, y, z, materials.dark, .02);
  const glow = mat('#ffb74f', .35, .05, { emissive: '#ff9f32', emissiveIntensity: .85 });
  box(root, width, height, .06, x, y, z + .065, glow, .015);
  for (const s of [-1, 1]) box(root, .095, height + .15, .15, x + s * (width / 2 + .035), y, z + .1, materials.woodEdge, .012);
  for (const s of [-1, 1]) box(root, width + .16, .105, .18, x, y + s * (height / 2 + .04), z + .12, materials.woodEdge, .014);
  box(root, .055, height, .11, x, y, z + .12, materials.wood, .008);
  box(root, width, .055, .11, x, y + .06, z + .12, materials.wood, .008);
  box(root, width + .28, .105, .3, x, y - height / 2 - .09, z + .15, materials.stone[0], .018);
  // A folded curtain behind the bars.
  box(root, .08, height - .02, .012, x - width * .3, y, z + .103, mat('#fbb85d', .9, 0, { emissive: '#f48c31', emissiveIntensity: .4 }), .002);
  return glow;
}

function addLamp(root, x, y, z, power = 40) {
  box(root, .2, .28, .09, x, y + .2, z, materials.iron, .06);
  pipe(root, [[x, y + .28, z], [x, y + .34, z + .2], [x, y + .22, z + .32]], .041, materials.iron, 16);
  cylinder(root, [x, y + .1, z + .32], [x, y + .17, z + .32], .145, materials.iron, 12, .09);
  const bulb = mat('#ffe9ad', .25, 0, { emissive: '#ffbd50', emissiveIntensity: 2.5 });
  cylinder(root, [x, y - .13, z + .32], [x, y + .09, z + .32], .086, bulb, 10);
  cylinder(root, [x, y - .15, z + .32], [x, y - .115, z + .32], .102, materials.iron, 12);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; cylinder(root, [x + Math.cos(a) * .087, y - .12, z + .32 + Math.sin(a) * .087], [x + Math.cos(a) * .087, y + .09, z + .32 + Math.sin(a) * .087], .006, materials.iron, 5); }
  const light = new THREE.PointLight('#ffc15b', power * .19, 4, 2); light.position.set(x, y -.05, z + .5); root.add(light);
  return light;
}

function doorAndAwning(root) {
  const x = -2.29, z = -.79;
  box(root, 1.12, 2.15, .13, x, 1.26, z, materials.dark, .025);
  box(root, .9, 1.99, .14, x, 1.25, z + .05, materials.wood, .022);
  for (const s of [-1, 1]) box(root, .12, 2.19, .21, x + s * .51, 1.27, z + .1, materials.woodEdge, .022);
  box(root, 1.1, .12, .22, x, 2.33, z + .1, materials.woodEdge, .023);
  addWindow(root, x, 1.77, z + .145, .52, .64);
  for (let i = 0; i < 4; i++) box(root, .16, .67, .045, x - .3 + i * .2, .79, z + .145, i % 2 ? materials.wood : mat('#53604a'), .009);
  box(root, .74, .075, .07, x, 1.15, z + .16, materials.woodEdge, .014);
  box(root, .74, .065, .07, x, .43, z + .16, materials.woodEdge, .012);
  cylinder(root, [x - .36, 1.12, z + .19], [x - .36, 1.12, z + .25], .048, materials.rust, 12);
  box(root, .065, .13, .04, x - .36, 1.1, z + .27, materials.bolt, .025);
  box(root, 1.18, .13, .44, x, .22, -.54, materials.paving[0], .03);
  box(root, 1.39, .11, .42, x, .135, -.22, materials.stone[1], .033);
  // Standing-seam sheet metal canopy, each strip shaped with a folded edge.
  const awning = group(root, -2.82, 2.93, -1.0);
  for (let i = 0; i < 12; i++) {
    const xx = -1.47 + i * .267;
    const shape = new THREE.Shape(); shape.moveTo(-.129, 0); shape.lineTo(.129, 0); shape.lineTo(.129, .048); shape.lineTo(.107, .06); shape.lineTo(.095, .021); shape.lineTo(-.11, .021); shape.lineTo(-.129, .048); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: .99, bevelEnabled: true, bevelSize: .009, bevelThickness: .009, bevelSegments: 1, steps: 1 });
    const panel = new THREE.Mesh(geo, materials.awning[i % 5]); panel.position.set(xx, 0, 0); panel.rotation.x = .37; panel.castShadow = true; panel.receiveShadow = true; awning.add(panel);
    box(awning, .255, .075, .05, xx, -.37, .925, materials.awning[i % 5], .013);
    if (i % 3 === 0) box(awning, .024, .013, .18, xx + .1, -.32, .78, materials.rust, .003).rotation.x = .37;
  }
  box(root, 3.33, .11, .12, -2.82, 2.97, -.96, materials.edge, .018);
  for (const xx of [-4.22, -1.37]) pipe(root, [[xx, 2.78, -.94], [xx, 2.37, -.84], [xx, 2.48, -.2]], .035, materials.iron, 16);
  addLamp(root, x, 2.48, -.65, 48);
  // Framed travel poster.
  box(root, .65, 1.12, .08, -3.49, 1.27, -.866, materials.edge, .025);
  plane(root, .56, 1.02, -3.49, 1.27, -.82, new THREE.MeshStandardMaterial({ map: posterTexture('mountain'), roughness: .86 }));
  for (const yy of [.8, 1.74]) bolt(root, -3.72, yy, -.811);
}

function airConditioner(root, x, y, z, scale = 1) {
  const g = group(root, x, y, z); g.scale.setScalar(scale);
  const casing = mat('#9ba5a3', .79, .2, { map: plasterTexture([179, 181, 173], 8), bumpScale: .018 });
  box(g, 1.09, .83, .46, 0, 0, 0, casing, .055);
  box(g, 1.15, .07, .49, 0, .42, .01, materials.stone[1], .014);
  for (const xx of [-.37, .37]) { box(g, .1, .19, .5, xx, -.46, -.05, materials.iron, .012); box(g, .1, .13, .09, xx, -.57, -.16, materials.rust, .008); }
  cylinder(g, [-.16, 0, .224], [-.16, 0, .239], .307, materials.dark, 32);
  const fan = group(g, -.16, 0, .246);
  for (let i = 0; i < 5; i++) { const blade = box(fan, .13, .245, .014, 0, .12, 0, materials.edge, .04); blade.geometry = blade.geometry.clone(); blade.geometry.translate(0, .0, 0); const bg = group(fan, 0, 0, 0); bg.add(blade); bg.rotation.z = i * Math.PI * 2 / 5; blade.rotation.z = -.4; }
  for (const r of [.1, .18, .255, .304]) ring(g, r, .008, -.16, 0, .27, materials.bolt);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; cylinder(g, [-.16, 0, .28], [-.16 + Math.cos(a) * .3, Math.sin(a) * .3, .28], .007, materials.bolt, 5); }
  cylinder(g, [-.16, 0, .28], [-.16, 0, .303], .048, materials.edge, 16);
  box(g, .18, .15, .022, .377, .21, .24, materials.rust, .01);
  plane(g, .13, .09, .377, .21, .257, new THREE.MeshStandardMaterial({ map: textTexture('AC', { w: 128, h: 64, fontSize: 40, color: '#b3b1a2', bg: '#36434b' }) }));
  for (let i = 0; i < 5; i++) box(g, .025, .34, .18, .546, -.1, -.1 + i * .054, materials.dark, .003);
  for (const xx of [-.48, .48]) for (const yy of [-.33, .33]) bolt(g, xx, yy, .24);
  pipe(g, [[.48, -.34, -.1], [.66, -.43, -.13], [.72, -.79, -.15], [.84, -.85, -.15]], .043, materials.pipe, 24);
  return fan;
}

function neonBorder(parent, w, h, radius, z, material, tubeRadius = .014) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + radius, -h / 2); shape.lineTo(w / 2 - radius, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius); shape.lineTo(w / 2, h / 2 - radius); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2); shape.lineTo(-w / 2 + radius, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius); shape.lineTo(-w / 2, -h / 2 + radius); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2);
  const points = shape.getPoints(12).map(p => V(p.x, p.y, z));
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, tubeRadius, 6, true), material); parent.add(mesh);
}

function neonSign(root, x, y, z, type, neonState) {
  const hotel = type === 'hotel', w = hotel ? .73 : .69, h = hotel ? 2.24 : 2.62;
  const g = group(root, x, y, z);
  const frame = mat(hotel ? '#62516e' : '#754a42', .5, .45);
  box(g, w + .19, h + .17, .21, 0, 0, 0, frame, .11);
  box(g, w + .07, h + .06, .035, 0, 0, .121, mat(hotel ? '#281d3b' : '#331f23', .44, .3), .085);
  for (const yy of [-h * .38, h * .38]) { box(g, .19, .1, .4, -.14, yy, -.23, materials.iron, .013); bolt(g, -w / 2 -.04, yy, .12); }
  const color = hotel ? '#d95dff' : '#ff4934';
  const tube = mat(color, .35, .1, { emissive: color, emissiveIntensity: 3.0 }); neonState.materials.push([tube, 3.0]);
  neonBorder(g, w -.02, h -.02, .085, .153, tube, .016);
  const text = textTexture(hotel ? 'ホテル' : 'ラーメン', { w: 256, h: hotel ? 768 : 800, fontSize: hotel ? 194 : 185, vertical: true, weight: '500' });
  const textMat = new THREE.MeshStandardMaterial({ map: text, transparent: true, color, emissive: color, emissiveMap: text, emissiveIntensity: 3.5, roughness: .5, depthWrite: false }); neonState.materials.push([textMat, 3.5]);
  plane(g, w * .82, hotel ? h * .87 : h * .76, 0, hotel ? 0 : .245, .16, textMat);
  if (!hotel) {
    const bowl = canvasTexture(256, 160, (ctx) => {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(128, 65, 76, 21, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(52, 65); ctx.quadraticCurveTo(65, 137, 127, 139); ctx.quadraticCurveTo(190, 138, 204, 65); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(96 + i * 27, 55); ctx.bezierCurveTo(75 + i * 27, 28, 126 + i * 27, 34, 111 + i * 27, 5); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(111, 68); ctx.lineTo(189, 9); ctx.moveTo(121, 73); ctx.lineTo(205, 18); ctx.stroke();
    });
    const bm = new THREE.MeshStandardMaterial({ map: bowl, transparent: true, color: '#ffb45e', emissive: '#ff8d33', emissiveMap: bowl, emissiveIntensity: 3.5, depthWrite: false }); neonState.materials.push([bm, 3.5]);
    plane(g, .53, .36, 0, -.99, .162, bm);
  }
  const light = new THREE.PointLight(color, hotel ? 9 : 12, 4.9, 2); light.position.set(x, y, z + .6); root.add(light); neonState.lights.push([light, light.intensity]);
  const bounce = new THREE.PointLight(color, hotel ? .35 : 1.2, 3.6, 2); bounce.position.set(x, 1, z + 1.2); root.add(bounce); neonState.lights.push([bounce, bounce.intensity]);
  return g;
}

function utilities(root) {
  // Hotel conduit follows the old masonry, wrapping over the parapet.
  pipe(root, [[-4.33, .75, -.79], [-4.43, 1.02, -.8], [-4.43, 5.85, -.8], [-4.4, 6.12, -.8], [-3.89, 6.12, -.8], [-3.66, 5.98, -.66], [-3.66, 5.8, -.59]], .051, materials.pipe, 80);
  pipe(root, [[-3.09, 6.25, -1.11], [-2.98, 6.19, -.87], [-2.98, 5.94, -.81], [-2.98, 3.54, -.79], [-2.89, 3.39, -.77], [-1.43, 3.39, -.77]], .047, materials.pipe, 64);
  pipe(root, [[-4.41, 2.55, -.76], [-4.31, 2.29, -.75], [-3.8, 2.29, -.75], [-3.76, 2.49, -.75]], .033, materials.pipe, 36);
  for (let j = 0; j < 3; j++) pipe(root, [[-2.76 + j * .1, 3.39 + j * .2, -.77], [-1.48, 3.39 + j * .2, -.77], [-1.34 + j * .055, 3.49 + j * .2, -.77], [-1.34 + j * .055, 4.48 + j * .16, -.77], [-2.22, 4.48 + j * .16, -.77]], .024, j === 1 ? materials.rust : materials.pipe, 42);
  for (const y of [1.2, 2.0, 3.4, 4.5, 5.6]) { box(root, .14, .06, .105, -4.43, y, -.8, materials.edge, .006); box(root, .11, .055, .11, -2.98, y + .23, -.8, materials.edge, .006); }
  box(root, .53, .63, .24, -3.97, 2.65, -.75, mat('#6c7979', .83, .3), .033);
  box(root, .39, .39, .027, -3.97, 2.67, -.618, materials.dark, .018);
  const gauge = canvasTexture(128, 128, ctx => { ctx.fillStyle = '#9da59b'; ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#303e3d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(64, 64, 40, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(64, 68); ctx.lineTo(83, 40); ctx.stroke(); ctx.fillStyle = '#464e45'; ctx.fillRect(40, 83, 47, 13); });
  plane(root, .31, .31, -3.97, 2.69, -.601, new THREE.MeshStandardMaterial({ map: gauge }));
  bolt(root, -4.16, 2.88, -.611); bolt(root, -3.78, 2.41, -.611);
  // Large right-hand drain pipe with coupling collars.
  pipe(root, [[3.17, 6.56, -2.68], [3.17, 6.61, -2.13], [3.1, 6.49, -1.88], [3.05, 6.26, -1.84], [3.05, 2.06, -1.84], [2.98, 1.81, -1.74], [2.79, 1.7, -1.59], [2.77, 1.4, -1.57]], .088, materials.pipe, 90);
  for (const yy of [2.16, 2.59, 3.36, 4.15, 5.32, 6.05]) { cylinder(root, [3.05, yy -.045, -1.84], [3.05, yy + .045, -1.84], .109, yy < 3 ? materials.rust : materials.edge, 12); box(root, .3, .065, .22, 3.05, yy, -1.99, materials.iron, .01); }
  pipe(root, [[4.43, .25, -1.95], [4.44, .64, -1.94], [4.44, 2.1, -1.94]], .033, materials.pipe, 20);
  pipe(root, [[1.07, .3, -1.94], [1.07, 3.02, -1.94], [1.04, 3.29, -1.94], [1.04, 5.81, -1.94], [1.0, 6.37, -1.94]], .035, materials.rust, 36);
  for (let i = 0; i < 2; i++) {
    pipe(root, [[-.65 + i * .12, .5, -2.64], [-.65 + i * .12, 3.43, -2.64], [-.45 + i * .12, 3.59, -2.64], [.34 + i * .12, 3.59, -2.64], [.34 + i * .12, 4.66, -2.64]], .027, i ? materials.pipe : materials.rust, 40);
  }
  // Junction boxes and the olive-green street cabinet.
  const cabinet = group(root, -1.22, .23, -.4);
  box(cabinet, .58, 1.06, .47, 0, .53, 0, materials.green, .04); box(cabinet, .63, .08, .51, 0, 1.08, .01, materials.greenEdge, .025);
  box(cabinet, .45, .83, .022, 0, .55, .247, materials.greenEdge, .017);
  box(cabinet, .035, .14, .04, .14, .65, .272, materials.iron, .008);
  plane(cabinet, .23, .14, -.06, .85, .262, new THREE.MeshStandardMaterial({ map: textTexture('高圧', { w: 128, h: 64, fontSize: 38, color: '#85908a', bg: '#43594c' }) }));
  for (let i = 0; i < 3; i++) box(cabinet, .19, .018, .03, -.05, .28 + i * .055, .266, materials.dark, .003);
  box(root, .48, 1.47, .43, 1.34, .82, -1.64, materials.backWall, .027);
  const top = box(root, .51, .09, .53, 1.34, 1.58, -1.66, materials.rust, .018); top.rotation.x = -.2;
  // Unlit fuse box on the back facade.
  box(root, .43, .54, .17, -.07, 4.12, -2.6, materials.pipe, .023);
  for (let i = 0; i < 4; i++) box(root, .22, .019, .012, -.07, 4.12 + i * .07, -2.507, materials.dark, .002);
}

function shutter(root) {
  const x = .02, z = -2.58;
  box(root, 1.39, 2.17, .11, x, 1.21, z, materials.dark, .02);
  for (let i = 0; i < 24; i++) box(root, 1.19, .071, .11, x, .22 + i * .081, z + .07, i % 3 ? materials.iron : materials.edge, .011);
  for (const s of [-1, 1]) box(root, .1, 2.21, .2, x + s * .65, 1.22, z + .1, materials.edge, .012);
  box(root, 1.59, .28, .36, x, 2.4, z + .09, materials.rightWall, .032);
  box(root, .28, .055, .035, x, .49, z + .15, materials.dark, .014);
  addLamp(root, -.85, 2.53, -2.49, 32);
  box(root, .46, .85, .055, -.91, 1.78, -2.65, materials.woodEdge, .014);
  plane(root, .4, .77, -.91, 1.78, -2.612, new THREE.MeshStandardMaterial({ map: posterTexture('hours'), roughness: .98 }));
  // Shop's little planter shelf.
  box(root, .82, .085, .35, .26, 3.03, -2.53, materials.edge, .01);
  for (let i = 0; i < 3; i++) plant(root, -.04 + i * .29, 3.08, -2.5, .16, .3, i);
}

function fireEscape(root) {
  const g = group(root, 3.59, 3.83, -1.57), steel = materials.iron;
  // Open slatted landing, not a solid slab.
  box(g, 1.4, .11, .08, 0, 0, .59, steel, .014); box(g, 1.4, .11, .08, 0, 0, -.42, steel, .014);
  for (const xx of [-.67, .67]) box(g, .08, .11, 1.08, xx, 0, .08, steel, .012);
  for (let i = 0; i < 14; i++) box(g, .045, .055, .98, -.61 + i * .094, .01, .08, materials.edge, .007);
  for (const xx of [-.67, .67]) {
    for (const zz of [-.41, .59]) cylinder(g, [xx, .03, zz], [xx, .83, zz], .029, steel, 8);
    cylinder(g, [xx, .83, -.41], [xx, .83, .59], .03, steel, 8);
    cylinder(g, [xx, .45, -.41], [xx, .45, .59], .022, steel, 8);
    pipe(g, [[xx, -.78, -.44], [xx, -.68, -.33], [xx, -.04, .48]], .039, steel, 16);
    box(g, .17, .28, .06, xx, -.67, -.46, steel, .01);
  }
  cylinder(g, [-.67, .83, .59], [.67, .83, .59], .032, steel, 8);
  cylinder(g, [-.67, .43, .59], [.67, .43, .59], .023, steel, 8);
  for (let i = 1; i <= 5; i++) cylinder(g, [-.67 + i * .224, .04, .59], [-.67 + i * .224, .83, .59], .02, steel, 6);
  // Wall ladder continues over the roof edge, curved at the top.
  for (const xx of [3.31, 4.01]) {
    pipe(root, [[xx, 3.89, -1.84], [xx, 6.35, -1.84], [xx, 6.64, -1.91], [xx, 6.68, -2.13], [xx, 6.57, -2.29]], .036, materials.iron, 48);
    for (const yy of [4.15, 5.42, 6.22]) cylinder(root, [xx, yy, -2.06], [xx, yy, -1.84], .025, materials.edge, 8);
  }
  for (let i = 0; i < 10; i++) cylinder(root, [3.3, 3.96 + i * .264, -1.84], [4.02, 3.96 + i * .264, -1.84], .029, materials.edge, 8);
  // Diagonal metal stairs lead down along the wall to the right.
  for (let i = 0; i < 11; i++) {
    const t = i / 10, x = 3.11 + t * 1.0, y = 3.65 - t * 1.96;
    box(root, .25, .057, .64, x, y, -1.46, materials.iron, .01);
    box(root, .026, .061, .63, x + .109, y + .005, -1.46, materials.edge, .004);
  }
  for (const z of [-1.79, -1.13]) {
    cylinder(root, [3.0, 3.68, z], [4.21, 1.55, z], .051, steel, 6);
    cylinder(root, [3.03, 4.33, z], [4.17, 2.24, z], .027, steel, 8);
    for (let i = 0; i < 4; i++) { const t = i / 3; cylinder(root, [3.08 + t * 1.03, 3.53 - t * 1.84, z], [3.08 + t * 1.03, 4.25 - t * 1.84, z], .022, steel, 6); }
  }
  box(root, .7, 1.5, .075, 3.66, 4.57, -2.017, materials.dark, .023);
  for (let i = 0; i < 4; i++) box(root, .57, .025, .04, 3.66, 4.31 + i * .16, -1.967, materials.edge, .004);
}

function dumpster(root) {
  const g = group(root, 3.48, .13, -.51); g.rotation.y = -.06;
  box(g, 1.91, .95, .98, 0, .65, 0, materials.green, .075);
  box(g, 2.01, .12, 1.05, 0, 1.07, 0, materials.greenEdge, .03);
  box(g, 1.76, .095, .88, 0, .17, 0, materials.iron, .025);
  for (const xx of [-.72, .72]) for (const zz of [-.35, .35]) {
    box(g, .11, .16, .11, xx, .105, zz, materials.edge, .02);
    cylinder(g, [xx -.055, .055, zz], [xx + .055, .055, zz], .088, materials.dark, 12);
    cylinder(g, [xx + .056, .055, zz], [xx + .065, .055, zz], .034, materials.bolt, 10);
  }
  for (const yy of [.38, .75]) box(g, 1.96, .075, .055, 0, yy, .5, materials.greenEdge, .011);
  for (const xx of [-.75, .75]) box(g, .08, .69, .046, xx, .64, .495, materials.greenEdge, .012);
  for (const xx of [-1.01, 1.01]) { box(g, .04, .12, .46, xx, .79, 0, materials.greenEdge, .014); cylinder(g, [xx, .85, -.16], [xx, .85, .16], .025, materials.edge, 8); }
  const lid = group(g, 0, 1.14, 0); lid.rotation.x = -.13;
  box(lid, 2.04, .1, 1.1, 0, 0, 0, materials.dark, .035);
  for (let i = 0; i < 8; i++) box(lid, .055, .048, .99, -.88 + i * .25, .069, 0, i % 3 ? materials.iron : materials.rust, .014);
  for (const xx of [-.71, .71]) cylinder(g, [xx -.1, 1.19, -.51], [xx + .1, 1.19, -.51], .052, materials.rust, 10);
  plane(g, .39, .24, -.2, .77, .533, new THREE.MeshStandardMaterial({ map: textTexture('♻', { w: 256, h: 160, fontSize: 126, color: '#657c61', bg: '#a6b4a0' }), roughness: .95 }));
  // Small scratches in the paint.
  for (let i = 0; i < 24; i++) box(g, between(.025, .12), .008, .006, between(-.85, .86), between(.26, .99), .515, i % 2 ? materials.rust : materials.greenEdge, .002);
}

function crate(root, x, y, z, color, rotation = 0) {
  const g = group(root, x, y, z); g.rotation.y = rotation; const m = mat(color, .81, .06);
  box(g, .66, .06, .49, 0, .03, 0, m, .014);
  for (const xx of [-.295, .295]) for (const zz of [-.21, .21]) box(g, .065, .51, .065, xx, .27, zz, m, .009);
  for (const yy of [.12, .32, .51]) {
    for (const zz of [-.223, .223]) box(g, .65, .082, .042, 0, yy, zz, m, .011);
    for (const xx of [-.31, .31]) box(g, .045, .082, .46, xx, yy, 0, m, .008);
  }
  for (const xx of [-.15, 0, .15]) for (const zz of [-.225, .225]) box(g, .031, .38, .041, xx, .27, zz, m, .006);
  for (const xx of [-.31, .31]) for (const zz of [-.07, .07]) box(g, .04, .37, .031, xx, .27, zz, m, .006);
  for (const xx of [-.16, .14]) {
    cylinder(g, [xx, .04, 0], [xx, .27, 0], .055, materials.green, 8);
    cylinder(g, [xx, .27, 0], [xx, .37, 0], .025, materials.green, 8);
  }
  return g;
}

function cardboard(root, x, y, z) {
  const g = group(root, x, y, z); g.rotation.y = -.17;
  const m = mat('#9b7953', 1), dark = mat('#5e4c39', 1);
  box(g, .66, .5, .53, 0, .25, 0, m, .014);
  box(g, .65, .011, .5, 0, .507, 0, dark, .003);
  const f1 = box(g, .319, .018, .54, -.174, .53, 0, m, .008); f1.rotation.z = -.09;
  const f2 = box(g, .319, .018, .54, .174, .53, 0, m, .008); f2.rotation.z = .08;
  box(g, .13, .51, .005, .05, .25, .269, mat('#b3976e', .9), .001);
  plane(g, .19, .1, -.17, .34, .273, new THREE.MeshStandardMaterial({ map: textTexture('↑↑', { w: 128, h: 64, fontSize: 47, color: '#514832', bg: '#9b7953' }) }));
  plane(g, .12, .075, .2, .12, .273, new THREE.MeshStandardMaterial({ map: textTexture('FRAGILE', { w: 192, h: 80, fontSize: 32, color: '#464336', bg: '#b8a588' }) }));
}

function garbageBag(root, x, y, z, scale = 1, rotation = 0) {
  const g = group(root, x, y, z); g.scale.setScalar(scale); g.rotation.y = rotation;
  const geo = new THREE.IcosahedronGeometry(.3, 2), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const yy = pos.getY(i), f = 1 + between(-.12, .12); pos.setXYZ(i, pos.getX(i) * f * (yy > .12 ? .85 : 1), yy * 1.04, pos.getZ(i) * f * .85); } geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat('#29353a', .43, .08, { flatShading: true })); mesh.position.y = .28; mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh);
  cylinder(g, [0, .48, 0], [.025, .62, -.01], .05, materials.dark, 7, .014);
  const tie = ring(g, .047, .013, .018, .54, 0, materials.rust); tie.rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; pipe(g, [[Math.cos(a) * .225, .19, Math.sin(a) * .2], [Math.cos(a) * .23, .33, Math.sin(a) * .18], [Math.cos(a) * .05, .51, Math.sin(a) * .045]], .007, materials.iron, 14); }
}

function leaf(root, x, y, z, size, angle, material) {
  const geo = new THREE.SphereGeometry(1, 5, 3);
  const mesh = new THREE.Mesh(geo, material); mesh.scale.set(size * .3, size, size * .1); mesh.position.set(x, y, z); mesh.rotation.set(between(-.7, .7), between(0, 6), angle); mesh.castShadow = true; root.add(mesh);
}
function weeds(root, x, y, z, size = .35) {
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; leaf(root, x + Math.cos(a) * size * .25, y + size * .36, z + Math.sin(a) * size * .25, size * between(.35, .65), a + .6, pick(materials.leaf)); }
}
function plant(root, x, y, z, radius = .24, height = .45, kind = 0) {
  const pot = mat(kind % 2 ? '#647060' : '#a79e7e', .96);
  cylinder(root, [x, y, z], [x, y + height, z], radius * .73, pot, 8, radius);
  const rim = ring(root, radius, .025, x, y + height, z, pot); rim.rotation.x = Math.PI / 2;
  cylinder(root, [x, y + height -.025, z], [x, y + height -.01, z], radius * .87, materials.soil, 12);
  weeds(root, x, y + height -.01, z, radius * 1.75);
  return y + height;
}

function greenery(root) {
  for (const [x, z, s] of [[-3.43, .57, .38], [-1.11, .75, .23], [1.89, -1.21, .31], [4.37, .13, .27], [-.55, -1.8, .23], [-4.44, 2.05, .2], [1.1, -.51, .16]]) weeds(root, x, .12, z, s);
  const tree = group(root, 0, 0, 0); tree.userData.zone = 'back';
  const x = -1.02, z = -2.18, y = plant(tree, x, .13, z, .28, .48);
  pipe(tree, [[x, y, z], [x -.03, 1.2, z], [x -.14, 2.1, z + .01], [x -.11, 2.74, z]], .03, materials.wood, 24);
  for (let i = 0; i < 13; i++) {
    const yy = 1.1 + i * .13, a = i * 2.4, reach = between(.22, .43), xx = x + Math.cos(a) * reach, zz = z + Math.sin(a) * reach;
    cylinder(tree, [x -.08, yy -.11, z], [xx, yy + .13, zz], .012, materials.wood, 6);
    for (let j = 0; j < 10; j++) leaf(tree, xx + between(-.2, .2), yy + between(.0, .28), zz + between(-.2, .2), between(.1, .19), between(-2, 2), pick(materials.leaf));
  }
  plant(root, -3.1, .22, .85, .11, .15, 1);
}

function scatteredDetails(root) {
  crate(root, -4.11, .21, .27, '#254d99', .02);
  crate(root, -4.12, .74, .27, '#a33858', -.08);
  cardboard(root, -3.72, .22, .75);
  garbageBag(root, 2.2, .12, -.73, 1, -.2); garbageBag(root, 2.55, .12, -.4, .78, .3); garbageBag(root, 4.43, .04, -.01, .93, .7);
  plane(root, 1.05, .88, 2.13, 1.65, -2.047, new THREE.MeshStandardMaterial({ map: graffitiTexture(), transparent: true, depthWrite: false, roughness: 1 }));
  // Lost receipts, a crushed can, fallen leaves.
  const paper = mat('#b5b7a6', .94, 0, { side: THREE.DoubleSide });
  for (const [x, z, a] of [[1.45, 1.29, .8], [-2.15, 2.76, -.3], [3.89, 1.2, .3]]) { const p = plane(root, .13, .21, x, .05, z, paper); p.rotation.set(-Math.PI / 2, 0, a); }
  cylinder(root, [-2.52, .1, 1.32], [-2.39, .1, 1.35], .051, materials.bolt, 10);
  const canLabel = cylinder(root, [-2.48, .1, 1.33], [-2.42, .1, 1.344], .052, mat('#986549', .5, .3), 10);
  for (let i = 0; i < 24; i++) {
    const l = new THREE.Mesh(new THREE.CircleGeometry(between(.016, .038), 5), pick(materials.leaf)); l.rotation.x = -Math.PI / 2; l.scale.x = 1.8; l.position.set(between(-4.4, 4.4), .047, between(1.13, 3.85)); root.add(l);
  }
  // Tiny address plaque.
  box(root, .29, .16, .035, -1.28, 2.34, -.894, materials.dark, .007);
  plane(root, .26, .13, -1.28, 2.34, -.87, new THREE.MeshStandardMaterial({ map: textTexture('3–17', { w: 192, h: 96, fontSize: 57, color: '#c2c8b9', bg: '#344c57' }) }));
  // A forgotten red umbrella leaning beside the noodle shop.
  const umbrella = group(root, .78, .15, -1.82); umbrella.rotation.z = -.17;
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(.09, .79, 7), mat('#774340', .74)); canopy.position.y = .43; canopy.castShadow = true; umbrella.add(canopy);
  cylinder(umbrella, [0, .1, 0], [0, 1.1, 0], .013, materials.iron, 8);
  pipe(umbrella, [[0, 1.08, 0], [.045, 1.15, 0], [.105, 1.1, 0], [.094, 1.04, 0]], .022, materials.wood, 20);
}

function overheadWires(root) {
  const cables = mat('#171d24', .61, .2);
  pipe(root, [[-3.86, 6.24, -2.87], [-2.64, 5.95, -2.69], [-1.14, 5.77, -2.72], [.25, 5.98, -2.89], [1.51, 6.4, -2.94]], .016, cables, 72);
  pipe(root, [[-3.98, 6.16, -2.74], [-2.46, 5.53, -2.38], [-.8, 5.43, -2.41], [1.12, 5.87, -2.87], [2.78, 6.58, -3.27]], .02, cables, 72);
  pipe(root, [[-3.66, 5.94, 1.21], [-3.67, 5.69, -.31], [-3.68, 5.94, -1.83], [-3.85, 6.23, -2.875]], .012, cables, 60);
  for (const [x, y, z] of [[-3.86, 6.24, -2.87], [1.51, 6.4, -2.94], [2.78, 6.58, -3.27]]) cylinder(root, [x, y -.12, z], [x, y + .03, z], .043, materials.rust, 8);
}

// Broken light trails complement the sharp planar reflection: the painted
// streaks stand in for the many tiny, differently tilted water surfaces.
function wetLightTrails(root, neonState) {
  const trail = (text, color, x, z, w, h, angle, intensity, neon = false) => {
    const source = document.createElement('canvas'); source.width = 384; source.height = 1024;
    const s = source.getContext('2d'); s.fillStyle = '#fff'; s.textAlign = 'center'; s.textBaseline = 'middle'; s.font = '500 220px "Hiragino Kaku Gothic ProN", sans-serif';
    [...text].forEach((c, i, a) => s.fillText(c, 192, 1024 / a.length * (i + .5)));
    const texture = canvasTexture(384, 1024, (ctx) => {
      ctx.filter = 'blur(16px)'; ctx.globalAlpha = .16;
      ctx.drawImage(source, 0, 0); ctx.filter = 'none';
      for (let y = 0; y < 1024; y += 3) {
        if (random() < .24) continue;
        const fade = Math.sin(y / 1024 * Math.PI);
        ctx.globalAlpha = fade * between(.12, .67);
        const shift = Math.sin(y * .094) * 19 + Math.sin(y * .032) * 29 + between(-16, 16);
        ctx.drawImage(source, 0, y, 384, 2 + random() * 4, shift, y, 384, 2 + random() * 4);
      }
    });
    const material = new THREE.MeshStandardMaterial({ color: '#000000', map: texture, emissive: color, emissiveMap: texture, emissiveIntensity: intensity, transparent: true, opacity: .72, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = plane(root, w, h, x, .048, z, material); mesh.rotation.set(-Math.PI / 2, 0, angle); mesh.renderOrder = 2;
    if (neon) neonState.materials.push([material, intensity]);
  };
  trail('ンメーラ', '#ff5432', 1.3, 1.55, 1.35, 3.7, -.2, 2.6, true);
  trail('ルテホ', '#d458ff', -.9, 2.34, .65, 1.75, .43, .62, true);
  trail('▰▰▰▰', '#ffc36a', -1.63, .67, .42, 2.06, .74, 1.05);
  trail('▰▰▰', '#ffc77a', 3.64, .12, .39, 1.72, -.19, .9);
}

export function buildDiorama(scene) {
  makeMaterials();
  const root = new THREE.Group(); root.name = 'Ame Yokocho — handcrafted miniature'; scene.add(root);
  const neonState = { materials: [], lights: [] };
  const reflection = buildGround(root);
  const parts = new THREE.Group();
  buildings(parts); doorAndAwning(parts); utilities(parts); shutter(parts);
  const fans = [airConditioner(parts, -2.02, 4.46, -.64, .94), airConditioner(parts, -.57, 4.18, -2.35, .78)];
  neonSign(parts, -3.78, 4.69, -.59, 'hotel', neonState);
  neonSign(parts, 1.3, 4.99, -1.72, 'ramen', neonState);
  addWindow(parts, 2.35, 4.73, -2.04, .59, .99);
  fireEscape(parts); dumpster(parts); greenery(parts); scatteredDetails(parts);
  addLamp(parts, 4.05, 2.29, -1.96, 49);
  const backLight = new THREE.PointLight('#edc184', 3, 3.3, 2); backLight.position.set(-.15, 3.05, -1.86); parts.add(backLight);
  for (let i = 0; i < 9; i++) box(parts, .015, between(.06, .2), .011, -4.1 + i * .36, 6.07, -.744, materials.rust, .002);
  // The façades are modeled in local, front-facing coordinates, then assembled
  // into a cutaway L. Explicit zones keep wide masonry and plants together.
  const zones = { left: group(root, -2.91, 0, -4.4), right: group(root, 0, 0, -.9), back: group(root, -.8, 0, -.6) };
  zones.left.rotation.y = Math.PI / 2; zones.left.scale.x = 1.25;
  parts.updateMatrixWorld(true);
  for (const part of [...parts.children]) {
    const center = new THREE.Box3().setFromObject(part).getCenter(new THREE.Vector3());
    if (part.isLight) center.copy(part.position);
    const zone = part.userData.zone || (center.x < -1.03 ? 'left' : center.x > .78 ? 'right' : 'back');
    zones[zone].add(part);
  }
  overheadWires(root); wetLightTrails(root, neonState);
  return { root, reflection, fans, neonState };
}
