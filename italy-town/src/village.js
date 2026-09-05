import {
  THREE,
  M,
  rand,
  pick,
  material,
  mesh,
  group,
  box,
  cylinder,
  sphere,
  torus,
  beam,
  tube,
  sign,
  extrudePolygon,
} from "./modeling.js";

export function plant(
  parent,
  x,
  y,
  z,
  size = 0.35,
  flowers = -1,
  tall = false,
) {
  const g = group(parent, [x, y, z]);
  cylinder(
    g,
    size * 0.5,
    size * 0.36,
    size * 0.72,
    [0, size * 0.36, 0],
    pick([M.pot, M.potLight]),
    12,
  );
  torus(g, size * 0.49, size * 0.045, [0, size * 0.71, 0], M.potLight);
  cylinder(g, size * 0.44, size * 0.44, 0.018, [0, size * 0.72, 0], M.soil);
  for (let i = 0; i < (tall ? 10 : 16); i++) {
    const a = rand(0, Math.PI * 2),
      r = rand(0.1, tall ? 0.65 : 0.9) * size,
      h = rand(0.7, tall ? 2.7 : 1.7) * size;
    const end = [Math.cos(a) * r, size * 0.55 + h, Math.sin(a) * r];
    beam(g, [0, size * 0.65, 0], end, 0.012, M.foliage[0], 0.007, 4);
    const leaf = sphere(
      g,
      end,
      [size * (tall ? 0.13 : 0.28), size * (tall ? 0.8 : 0.28), size * 0.1],
      pick(M.foliage),
    );
    leaf.rotation.set(Math.sin(a) * 0.7, a, -Math.cos(a) * 0.7);
    if (flowers >= 0 && i % 2 === 0) flower(g, end, flowers, size * 0.19);
  }
  return g;
}
function flower(parent, pos, color, size = 0.06) {
  const [x, y, z] = pos;
  for (let p = 0; p < 5; p++) {
    const a = p * Math.PI * 0.4;
    sphere(
      parent,
      [x + Math.cos(a) * size * 0.53, y + 0.01, z + Math.sin(a) * size * 0.53],
      [size * 0.6, size * 0.35, size * 0.6],
      M.flower[color],
    );
  }
  sphere(
    parent,
    [x, y + 0.022, z],
    [size * 0.3, size * 0.24, size * 0.3],
    M.flower[3],
  );
}
function flowerBox(parent, w, y, z, color = 0) {
  box(parent, [w, 0.19, 0.26], [0, y, z], M.wood, 0.025);
  for (let x = -w / 2 + 0.05; x < w / 2; x += 0.17)
    box(parent, [0.07, 0.22, 0.29], [x, y, z], M.woodLight, 0.008);
  box(parent, [w + 0.05, 0.05, 0.29], [0, y + 0.09, z], M.woodDark, 0.008);
  for (let i = 0; i < w * 26; i++) {
    const px = rand(-w * 0.46, w * 0.46),
      py = y + rand(0.16, 0.42),
      pz = z + rand(-0.1, 0.16);
    sphere(parent, [px, py - 0.07, pz], [0.12, 0.1, 0.09], pick(M.foliage));
    if (i % 2 === 0) flower(parent, [px, py, pz], color, rand(0.04, 0.067));
  }
  for (let i = 0; i < 5; i++) {
    const x = rand(-w / 2, w / 2);
    for (let j = 0; j < rand(3, 7); j++)
      sphere(
        parent,
        [x + Math.sin(j) * 0.03, y - j * 0.07, z + 0.18],
        [0.07, 0.085, 0.035],
        pick(M.foliage),
      );
  }
}
export function vine(parent, points, flowers = false) {
  tube(parent, points, 0.027, M.woodDark);
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  for (let i = 0; i < 85; i++) {
    const p = curve.getPoint(i / 84);
    p.x += rand(-0.2, 0.2);
    p.z += rand(-0.14, 0.16);
    sphere(
      parent,
      p.toArray(),
      [rand(0.09, 0.18), rand(0.09, 0.16), 0.045],
      pick(M.foliage),
    );
    if (flowers && i % 6 === 0)
      flower(parent, [p.x, p.y + 0.06, p.z + 0.04], pick([0, 1, 3]), 0.062);
  }
}
function windowDetail(
  parent,
  x,
  y,
  z,
  shutterMat = M.green,
  w = 0.68,
  h = 1.05,
  flowers = -1,
  balcony = false,
) {
  const g = group(parent, [x, y, z]);
  box(g, [w + 0.15, h + 0.15, 0.065], [0, 0, 0.015], M.woodDark, 0.014);
  box(g, [w, h, 0.035], [0, 0, 0.06], M.window, 0.003);
  for (const side of [-1, 1]) {
    box(
      g,
      [0.075, h + 0.18, 0.16],
      [side * (w / 2 + 0.052), 0, 0.055],
      M.trim,
      0.014,
    );
    box(
      g,
      [0.045, h, 0.055],
      [side * (w / 2 - 0.025), 0, 0.105],
      M.wood,
      0.006,
    );
    const sw = w * 0.46;
    const s = group(
      g,
      [side * (w / 2 + 0.11 + sw / 2), 0, 0.07],
      [0, side * 0.1, 0],
    );
    box(s, [sw, h + 0.035, 0.065], [0, 0, 0], shutterMat, 0.01);
    for (const sx of [-1, 1])
      box(
        s,
        [0.045, h + 0.07, 0.055],
        [sx * (sw / 2 - 0.018), 0, 0.048],
        shutterMat,
        0.004,
      );
    for (let yy = -h / 2 + 0.09; yy < h / 2; yy += 0.125)
      box(
        s,
        [sw - 0.07, 0.09, 0.048],
        [0, yy, 0.056],
        shutterMat,
        0.005,
        [0.24, 0, 0],
      );
    for (const sy of [-1, 0, 1])
      box(s, [sw, 0.045, 0.04], [0, sy * h * 0.46, 0.06], shutterMat, 0.003);
    cylinder(
      s,
      0.018,
      0.018,
      0.07,
      [-side * sw * 0.26, -0.1, 0.105],
      M.iron,
      6,
      [Math.PI / 2, 0, 0],
    );
  }
  box(g, [w + 0.23, 0.105, 0.2], [0, h / 2 + 0.07, 0.06], M.trim, 0.012);
  box(g, [w + 0.24, 0.105, 0.26], [0, -h / 2 - 0.07, 0.095], M.trim, 0.012);
  box(g, [0.037, h, 0.05], [0, 0, 0.114], M.woodLight, 0.003);
  for (const yy of [-h / 6, h / 6])
    box(g, [w, 0.032, 0.05], [0, yy, 0.113], M.woodLight, 0.003);
  // A partly drawn linen curtain, behind the timber frame.
  box(
    g,
    [0.14, h - 0.09, 0.015],
    [-w * 0.29, 0, 0.082],
    material("curtain", "#c9c2a3"),
    0.004,
  );
  if (balcony) {
    const bw = w + 0.56,
      by = -h / 2 - 0.15;
    box(g, [bw + 0.16, 0.15, 0.55], [0, by, 0.27], M.trim, 0.025);
    for (const s of [-1, 1])
      box(
        g,
        [0.12, 0.2, 0.35],
        [s * bw * 0.35, by - 0.14, 0.17],
        M.wood,
        0.012,
        [-0.25, 0, 0],
      );
    for (let i = 0; i <= 8; i++)
      box(
        g,
        [0.035, 0.48, 0.035],
        [-bw / 2 + (i * bw) / 8, by + 0.29, 0.52],
        M.iron,
        0.004,
      );
    box(g, [bw + 0.06, 0.06, 0.07], [0, by + 0.55, 0.52], M.wood, 0.01);
    for (const s of [-1, 1]) {
      box(
        g,
        [0.065, 0.57, 0.065],
        [(s * bw) / 2, by + 0.32, 0.52],
        M.wood,
        0.009,
      );
      box(g, [0.04, 0.05, 0.5], [(s * bw) / 2, by + 0.54, 0.27], M.wood, 0.005);
    }
    if (flowers >= 0) flowerBox(g, bw * 0.82, by + 0.3, 0.39, flowers);
  } else if (flowers >= 0) flowerBox(g, w + 0.16, -h / 2 - 0.03, 0.23, flowers);
}
function door(
  parent,
  x,
  z,
  width = 0.75,
  h = 1.55,
  mat = M.wood,
  arch = false,
  y = 0,
) {
  const g = group(parent, [x, y, z]);
  if (arch) {
    const sh = new THREE.Shape();
    sh.moveTo(-width / 2, 0);
    sh.lineTo(width / 2, 0);
    sh.lineTo(width / 2, h - width / 2);
    sh.absarc(0, h - width / 2, width / 2, 0, Math.PI, false);
    sh.lineTo(-width / 2, 0);
    mesh(
      g,
      new THREE.ExtrudeGeometry(sh, {
        depth: 0.065,
        bevelEnabled: false,
        curveSegments: 12,
      }),
      mat,
    );
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI;
      box(
        g,
        [0.19, 0.2, 0.19],
        [
          Math.cos(a) * (width / 2 + 0.08),
          h - width / 2 + Math.sin(a) * (width / 2 + 0.08),
          0.04,
        ],
        M.trim,
        0.015,
        [0, 0, a - Math.PI / 2],
      );
    }
    for (const s of [-1, 1])
      box(
        g,
        [0.15, h - width / 2, 0.16],
        [s * (width / 2 + 0.09), (h - width / 2) / 2, 0.03],
        M.trim,
        0.015,
      );
  } else {
    box(g, [width, h, 0.07], [0, h / 2, 0], mat, 0.018);
    for (const s of [-1, 1])
      box(
        g,
        [0.13, h + 0.05, 0.15],
        [s * (width / 2 + 0.07), h / 2, 0.03],
        M.trim,
        0.012,
      );
    box(g, [width + 0.27, 0.15, 0.18], [0, h + 0.07, 0.03], M.trim, 0.016);
  }
  for (let i = 1; i < 5; i++)
    box(
      g,
      [0.012, h - 0.2, 0.012],
      [-width / 2 + (i * width) / 5, h / 2 - 0.03, 0.044],
      M.woodDark,
      0.001,
    );
  for (const px of [-width / 4, width / 4])
    for (const yy of [0.34, 0.88]) {
      box(g, [width * 0.37, 0.42, 0.03], [px, yy, 0.065], mat, 0.012);
      box(g, [width * 0.29, 0.33, 0.012], [px, yy, 0.084], mat, 0.005);
    }
  sphere(g, [width * 0.22, h * 0.44, 0.13], [0.035, 0.035, 0.035], M.brass, 1);
  box(g, [width + 0.22, 0.09, 0.32], [0, 0.025, 0.075], pick(M.stone), 0.02);
  return g;
}
export function lantern(parent, pos, street = false) {
  const g = group(parent, pos);
  const size = street ? 1.2 : 0.8;
  g.scale.setScalar(size);
  if (street) {
    cylinder(g, 0.065, 0.095, 1.9, [0, 0.95, 0], M.iron, 8);
    cylinder(g, 0.15, 0.21, 0.12, [0, 0.06, 0], M.iron, 8);
    cylinder(g, 0.08, 0.14, 0.22, [0, 0.2, 0], M.iron, 8);
    for (const y of [0.36, 1.72, 1.9])
      cylinder(g, 0.09, 0.09, 0.04, [0, y, 0], M.iron, 8);
    g.userData.lightHeight = 2.1;
  } else {
    box(g, [0.085, 0.32, 0.08], [0, 0, -0.08], M.iron, 0.01);
    tube(
      g,
      [
        [0, 0.13, -0.03],
        [0, 0.26, 0.14],
        [0, 0.17, 0.32],
      ],
      0.026,
      M.iron,
      12,
    );
  }
  const base = street ? 1.95 : -0.26,
    z = street ? 0 : 0.3;
  // Keep the light attached to its lantern; mesh batching leaves lights intact.
  const glow = new THREE.PointLight("#ffbd70", 0, street ? 5 : 2.8, 2);
  glow.position.set(0, base + 0.15, z + 0.12);
  glow.userData.nightIntensity = street ? 12 : 3;
  g.add(glow);
  cylinder(g, 0.145, 0.105, 0.3, [0, base + 0.15, z], M.lamp, 4, [
    0,
    Math.PI / 4,
    0,
  ]);
  for (const x of [-1, 1])
    for (const s of [-1, 1])
      beam(
        g,
        [x * 0.073, base, z + s * 0.073],
        [x * 0.099, base + 0.3, z + s * 0.099],
        0.016,
        M.iron,
        0.016,
        5,
      );
  cylinder(g, 0.15, 0.13, 0.035, [0, base, z], M.iron, 4, [0, Math.PI / 4, 0]);
  cylinder(g, 0.018, 0.2, 0.15, [0, base + 0.39, z], M.iron, 4, [
    0,
    Math.PI / 4,
    0,
  ]);
  sphere(g, [0, base + 0.5, z], [0.035, 0.05, 0.035], M.iron);
}
const tileGeometry = (() => {
  const verts = [],
    indices = [],
    uv = [];
  const n = 8;
  // Hollow tapered half-round, with visible terracotta thickness at the eaves.
  for (let layer = 0; layer < 2; layer++)
    for (let end = 0; end < 2; end++)
      for (let j = 0; j <= n; j++) {
        const a = (j / n) * Math.PI,
          r = 0.142 + end * 0.013 - layer * 0.028;
        verts.push(Math.cos(a) * r, Math.sin(a) * r, (end - 0.5) * 0.49);
        uv.push(j / n, end);
      }
  for (let layer = 0; layer < 2; layer++)
    for (let j = 0; j < n; j++) {
      const a = layer * (n + 1) * 2 + j,
        b = a + n + 1;
      if (layer === 0) indices.push(a, a + 1, b, b, a + 1, b + 1);
      else indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  for (let end = 0; end < 2; end++)
    for (let j = 0; j < n; j++) {
      const a = end * (n + 1) + j,
        b = a + (n + 1) * 2;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
})();
function roof(parent, w, d, h, wallMat, rise = 0.9) {
  const width = w + 0.34,
    depth = d + 0.4,
    half = depth / 2,
    pitch = Math.atan2(rise, half);
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape();
    sh.moveTo(-d / 2, 0);
    sh.lineTo(d / 2, 0);
    sh.lineTo(0, rise);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth: 0.08,
      bevelEnabled: false,
    });
    mesh(parent, geo, wallMat, [s * (w / 2 - 0.03), h, 0], [0, Math.PI / 2, 0]);
    box(
      parent,
      [width, 0.1, Math.hypot(half, rise)],
      [0, h + rise / 2 - 0.015, (s * half) / 2],
      M.roofUnder,
      0.01,
      [s * pitch, 0, 0],
    );
    box(
      parent,
      [width + 0.03, 0.08, 0.07],
      [0, h - 0.035, s * half],
      M.woodDark,
      0.013,
    );
    const cols = Math.round(width / 0.277),
      rows = Math.ceil(Math.hypot(half, rise) / 0.405);
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const dist =
          0.19 +
          (row * (Math.hypot(half, rise) - 0.25)) / Math.max(1, rows - 1);
        const z = s * dist * Math.cos(pitch),
          y = h + rise - dist * Math.sin(pitch);
        mesh(
          parent,
          tileGeometry,
          pick(M.roof),
          [
            -width / 2 + 0.135 + (col * (width - 0.27)) / (cols - 1),
            y + 0.05 + rand(-0.013, 0.013),
            z,
          ],
          [s * pitch, s < 0 ? Math.PI : 0, 0],
        );
      }
  }
  for (let x = -width / 2 + 0.18; x < width / 2; x += 0.43)
    mesh(
      parent,
      tileGeometry,
      pick(M.roof),
      [x, h + rise + 0.08, 0],
      [0, Math.PI / 2, 0],
      [1.12, 1.12, 1],
    );
}
function facadeWeather(parent, w, h, d, color) {
  const patches = [
    material("plaster pale", "#d9c8a7"),
    material("plaster shade", "#b7aa8d"),
  ];
  for (const sx of [-1, 1])
    for (let i = 0; i < h / 0.31; i++) {
      if (rand() < 0.33) continue;
      const y = 0.14 + i * 0.31,
        width = i % 2 ? 0.23 : 0.34;
      box(
        parent,
        [width, 0.25, 0.085],
        [sx * (w / 2 - width / 2 + 0.016), y, d / 2 + 0.012],
        pick(M.stone),
        0.028,
      );
      if (i % 2)
        box(
          parent,
          [0.07, 0.24, 0.31],
          [sx * (w / 2 + 0.014), y, d / 2 - 0.15],
          pick(M.stone),
          0.023,
        );
    }
  for (let i = 0; i < w * h * 2.7; i++) {
    const x = rand(-w / 2 + 0.17, w / 2 - 0.17),
      y = rand(0.1, h - 0.12);
    if (Math.abs(x) < 0.5 && y > 0.8) continue;
    box(
      parent,
      [rand(0.05, 0.16), rand(0.04, 0.11), 0.014],
      [x, y, d / 2 + 0.008],
      pick(patches),
      0.011,
      [0, 0, rand(-0.2, 0.2)],
    );
  }
}
function house(parent, x, z, w, d, h, wall, base = 1.2, rise = 0.9) {
  const g = group(parent, [x, base, z]);
  box(g, [w, h, d], [0, h / 2, 0], wall, 0.045);
  box(g, [w + 0.055, 0.2, d + 0.06], [0, 0.12, 0], pick(M.stone), 0.025);
  roof(g, w, d, h, wall, rise);
  facadeWeather(g, w, h, d, wall);
  const back = group(g, [0, 0, -d / 2 - 0.028], [0, Math.PI, 0]);
  windowDetail(
    back,
    0,
    h * 0.73,
    0,
    wall === M.pink ? M.teal : M.green,
    Math.min(0.6, w * 0.32),
    0.87,
    0,
  );
  windowDetail(back, 0.12, h * 0.32, 0, M.green, 0.44, 0.7);
  // Tiny iron rain gutter with brackets and an old copper downpipe.
  const gutter = material("weathered gutters", "#647e73");
  cylinder(
    g,
    0.035,
    0.035,
    h - 0.16,
    [w / 2 - 0.08, h / 2, d / 2 + 0.095],
    gutter,
    7,
  );
  for (let y = 0.5; y < h; y += 1.4)
    torus(g, 0.042, 0.009, [w / 2 - 0.08, y, d / 2 + 0.095], M.iron);
  return g;
}
function chimney(parent, x, h, z) {
  box(parent, [0.38, 0.87, 0.4], [x, h + 0.43, z], M.cream, 0.025);
  box(parent, [0.44, 0.065, 0.46], [x, h + 0.67, z], M.trim, 0.012);
  box(parent, [0.29, 0.16, 0.31], [x, h + 0.78, z], M.woodDark, 0.008);
  for (const a of [-1, 1])
    for (const b of [-1, 1])
      box(
        parent,
        [0.085, 0.2, 0.085],
        [x + a * 0.15, h + 0.8, z + b * 0.16],
        M.cream,
        0.008,
      );
  box(parent, [0.51, 0.09, 0.51], [x, h + 0.94, z], M.trim, 0.014);
  cylinder(parent, 0.077, 0.075, 0.2, [x, h + 1.08, z], M.pot, 10);
  torus(parent, 0.077, 0.017, [x, h + 1.18, z], M.potLight);
}
function awning(parent, w, y, z) {
  const count = 7,
    sw = w / count,
    reach = 0.86,
    drop = 0.5;
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + sw * (i + 0.5),
      mat = i % 2 ? M.stripe : M.white;
    box(
      parent,
      [sw + 0.008, 0.024, Math.hypot(reach, drop)],
      [x, y - drop / 2, z + reach / 2],
      mat,
      0.006,
      [Math.atan2(drop, reach), 0, 0],
    );
    const sh = new THREE.Shape();
    sh.moveTo(-sw / 2, 0);
    sh.lineTo(sw / 2, 0);
    sh.lineTo(sw / 2, -0.12);
    sh.quadraticCurveTo(sw * 0.44, -0.27, 0, -0.27);
    sh.quadraticCurveTo(-sw * 0.44, -0.27, -sw / 2, -0.12);
    sh.closePath();
    mesh(
      parent,
      new THREE.ExtrudeGeometry(sh, {
        depth: 0.018,
        bevelEnabled: false,
        curveSegments: 6,
      }),
      mat,
      [x, y - drop, z + reach],
    );
  }
  for (const s of [-1, 1]) {
    beam(
      parent,
      [(s * w) / 2, y - 0.66, z],
      [(s * w) / 2, y - drop, z + reach],
      0.022,
      M.iron,
    );
  }
}
export function buildVillage(root) {
  const yellow = house(
    root,
    -3.53,
    -1.28,
    2.38,
    2.72,
    5.4,
    M.yellow,
    1.2,
    0.86,
  );
  chimney(yellow, -0.67, 5.84, -0.5);
  windowDetail(yellow, 0, 3.87, 1.385, M.green, 0.7, 1.13, 0, true);
  facadeWeather(
    group(yellow, [-1.21, 0, 0], [0, -Math.PI / 2, 0]),
    2.72,
    5.4,
    0,
    M.yellow,
  );
  const side = group(yellow, [-1.21, 0, -0.2], [0, -Math.PI / 2, 0]);
  windowDetail(side, 0, 3.65, 0, M.green, 0.46, 0.85);
  box(yellow, [1.45, 1.68, 0.06], [0, 0.88, 1.39], M.woodDark, 0.012);
  box(yellow, [1.29, 1.48, 0.06], [0, 0.88, 1.425], M.window, 0.004);
  for (const x of [-0.7, 0, 0.7])
    box(yellow, [0.07, 1.64, 0.07], [x, 0.86, 1.48], M.wood, 0.01);
  for (const y of [0.13, 0.57, 1.64])
    box(yellow, [1.45, 0.07, 0.07], [0, y, 1.48], M.wood, 0.01);
  for (let i = 0; i < 7; i++) {
    cylinder(
      yellow,
      0.042,
      0.052,
      rand(0.13, 0.24),
      [-0.57 + i * 0.17, 0.3, 1.48],
      pick([M.green, M.pot, M.brass]),
      8,
    );
  }
  box(yellow, [1.86, 0.46, 0.095], [0, 2.31, 1.425], M.wood, 0.025);
  sign(yellow, "Bottega del Mare", 1.73, 0.34, [0, 2.31, 1.48]);
  awning(yellow, 1.94, 1.98, 1.43);
  const shopSign = group(yellow, [-1.35, 2.06, 1.26]);
  tube(
    shopSign,
    [
      [0.12, 0.35, 0],
      [-0.38, 0.35, 0],
      [-0.41, 0.2, 0],
    ],
    0.026,
    M.iron,
    10,
  );
  cylinder(shopSign, 0.23, 0.23, 0.05, [-0.34, -0.03, 0], M.navy, 24, [
    Math.PI / 2,
    0,
    0,
  ]);
  torus(shopSign, 0.22, 0.014, [-0.34, -0.03, 0.035], M.brass, [0, 0, 0]);
  sign(shopSign, "⚓", 0.3, 0.33, [-0.34, -0.03, 0.031], {
    bg: "#356279",
    border: false,
    font: "Arial",
    color: "#d6c393",
  });
  plant(root, -4.63, 1.21, 0.61, 0.4);
  vine(root, [
    [-4.62, 3.6, 0.13],
    [-4.74, 3.2, 0.3],
    [-4.72, 2.45, 0.3],
    [-4.75, 1.7, 0.3],
  ]);

  const pink = house(root, -1.25, -1.49, 2.13, 2.48, 5.24, M.pink, 1.2, 0.83);
  windowDetail(pink, 0, 3.96, 1.27, M.teal, 0.65, 1.03);
  windowDetail(pink, 0, 2.19, 1.27, M.teal, 0.61, 0.87, 3);
  door(pink, 0.07, 1.31, 0.7, 1.39);
  lantern(pink, [-0.74, 1.59, 1.3]);
  sign(pink, "12", 0.18, 0.13, [0.68, 1.35, 1.27], {
    bg: "#e6dfc6",
    color: "#426271",
    border: "#557382",
  });

  box(root, [1.95, 1.58, 1.98], [0.82, 1.98, -2.61], M.cream, 0.025);
  const white = house(root, 0.82, -2.61, 1.95, 1.98, 4.16, M.cream, 2.77, 0.93);
  windowDetail(white, -0.18, 3.06, 1.02, M.navy, 0.57, 0.91, 0);
  door(white, -0.18, 1.035, 0.66, 1.42, M.navy);
  lantern(white, [0.62, 1.19, 1.055]);
  // A small recessed balcony looking over the staircase.
  box(white, [1.48, 0.16, 0.7], [0.47, 1.99, 1.24], M.trim, 0.018);
  for (const x of [-0.23, 1.17]) {
    box(white, [0.23, 0.51, 0.24], [x, 2.28, 1.56], M.cream, 0.018);
    box(white, [0.3, 0.09, 0.31], [x, 2.56, 1.56], M.trim, 0.018);
  }
  box(white, [1.32, 0.22, 0.16], [0.47, 2.08, 1.57], M.cream, 0.012);
  for (let x = -0.04; x < 1.13; x += 0.18)
    box(white, [0.052, 0.3, 0.052], [x, 2.35, 1.57], M.wood, 0.008);
  box(white, [1.35, 0.065, 0.095], [0.47, 2.53, 1.57], M.wood, 0.01);
  plant(white, 0.82, 2.09, 1.24, 0.3, -1, true);
  box(white, [0.13, 0.22, 0.1], [0.04, 3.93, 1.02], M.trim, 0.015);
  box(white, [0.06, 0.13, 0.015], [0.04, 3.93, 1.08], M.window, 0.005);
  const annex = house(root, 2.44, -2.48, 1.38, 1.93, 4.25, M.cream, 1.2, 0.7);
  chimney(annex, 0.25, 4.57, -0.24);
  const blue = house(root, 2.96, -0.72, 2.32, 2.5, 4.48, M.blue, 1.2, 0.92);
  door(blue, -0.37, 1.285, 0.7, 1.56, M.green, true);
  windowDetail(blue, -0.29, 3.02, 1.29, M.green, 0.65, 1.02, 3, true);
  windowDetail(blue, 0.72, 0.92, 1.29, M.green, 0.27, 0.7);
  facadeWeather(
    group(blue, [1.187, 0, 0], [0, Math.PI / 2, 0]),
    2.5,
    4.48,
    0,
    M.blue,
  );
  sign(blue, "VIA DEL MOLO", 0.48, 0.12, [-0.82, 2.22, 1.287], {
    bg: "#ebe2cc",
    color: "#467184",
    border: "#467184",
  });
  const blueSide = group(blue, [1.187, 0, 0.22], [0, Math.PI / 2, 0]);
  windowDetail(blueSide, 0, 3.03, 0, M.green, 0.63, 1.08, 4);
  windowDetail(blueSide, 0.25, 1.04, 0, M.green, 0.38, 0.75);
  vine(
    blue,
    [
      [1.23, 3.1, 0.3],
      [1.26, 2.66, 0.64],
      [1.23, 2.18, 0.8],
      [1.24, 1.65, 0.87],
    ],
    true,
  );
  box(blue, [0.16, 0.25, 0.12], [0, 4.19, 1.27], M.trim, 0.01);
  box(blue, [0.06, 0.13, 0.016], [0, 4.19, 1.337], M.window, 0.002);
  lantern(blue, [-1.02, 1.88, 1.3]);
  plant(root, 3.22, 1.21, 0.92, 0.34, -1, true);
  plant(root, 3.66, 1.21, 1.02, 0.38, -1, true);
  plant(root, 1.67, 1.21, 1.04, 0.26);
  plant(root, 1.42, 2.79, -1.28, 0.3, -1, true);

  // The stepped passage, with each riser built from separate, worn stones.
  const n = 10,
    front = 1.28,
    tread = 0.275,
    rise = 0.158;
  for (let i = 0; i < n; i++) {
    const z = front - i * tread,
      y = 1.2 + (i + 1) * rise;
    box(
      root,
      [1.78, y - 1.14, tread + 0.02],
      [0.69, (y + 1.14) / 2, z],
      pick(M.stone),
      0.016,
    );
    const widths =
      i % 2 ? [0.23, 0.49, 0.48, 0.36, 0.22] : [0.46, 0.49, 0.4, 0.43];
    let x = -0.2;
    for (const w of widths) {
      box(
        root,
        [w - 0.015, 0.135, tread + 0.015],
        [x + w / 2, y - 0.045, z + 0.007],
        pick(M.stone),
        0.031,
      );
      x += w;
    }
  }
  box(root, [1.84, 0.15, 0.53], [0.69, 2.73, -1.48], pick(M.stone), 0.025);
  for (let i = 0; i < 5; i++) {
    plant(
      root,
      -0.35 - i * 0.12,
      1.21,
      0.82 - i * 0.27,
      0.25 + i * 0.025,
      i % 2 ? 0 : -1,
      i === 4,
    );
  }
  vine(
    root,
    [
      [-0.24, 1.44, -0.21],
      [-0.35, 2.45, -0.39],
      [-0.34, 3.39, -0.42],
      [-0.16, 4.36, -0.53],
    ],
    true,
  );
  vine(root, [
    [-0.13, 2.3, -0.93],
    [-0.24, 3.46, -1.04],
    [0.02, 4.2, -1.14],
    [0.03, 5.1, -1.41],
  ]);

  // A laundry line spanning the alley, with little wooden clothespins.
  const line = [
    [-0.19, 5.67, -0.17],
    [0.39, 5.49, -0.55],
    [1.08, 5.43, -0.82],
    [1.78, 5.57, -1.13],
  ];
  tube(root, line, 0.012, M.rope, 30);
  beam(root, [-0.19, 5.42, -0.17], [-0.19, 5.89, -0.17], 0.018, M.wood);
  const clothes = [];
  const clothColors = ["#b57283", "#e3d9bf", "#d7c7a4", "#eeeadc", "#8fabb0"];
  const curve = new THREE.CatmullRomCurve3(
    line.map((p) => new THREE.Vector3(...p)),
  );
  for (let i = 0; i < 5; i++) {
    const p = curve.getPoint(0.14 + i * 0.155),
      w = i === 1 ? 0.31 : 0.26,
      h = rand(0.41, 0.64);
    const geo = new THREE.PlaneGeometry(w, h, 7, 10);
    const a = geo.attributes.position;
    for (let j = 0; j < a.count; j++) {
      const x = a.getX(j),
        y = a.getY(j);
      a.setZ(
        j,
        Math.sin((x / w) * Math.PI * 5) * 0.028 +
          Math.pow((h / 2 - y) / h, 2) * 0.07,
      );
    }
    geo.computeVertexNormals();
    const mat = material(`linen ${i}`, clothColors[i], {
      side: THREE.DoubleSide,
    });
    const cloth = mesh(
      root,
      geo,
      mat,
      [p.x, p.y - h / 2, p.z],
      [0, 0.47, -0.035 + i * 0.015],
    );
    clothes.push(cloth);
    for (const s of [-1, 1])
      box(
        root,
        [0.028, 0.09, 0.035],
        [p.x + s * w * 0.36, p.y + 0.008, p.z - s * 0.045],
        M.woodLight,
        0.004,
      );
  }
  return { clothes };
}

function chair(parent, x, z, angle) {
  const g = group(parent, [x, 1.22, z], [0, angle, 0]);
  box(g, [0.43, 0.065, 0.42], [0, 0.44, 0], M.green, 0.028);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      beam(
        g,
        [sx * 0.19, 0.025, sz * 0.19],
        [sx * 0.17, 0.47, sz * 0.17],
        0.028,
        M.iron,
      );
  for (const sx of [-1, 1])
    beam(g, [sx * 0.18, 0.44, -0.16], [sx * 0.2, 0.98, -0.24], 0.029, M.iron);
  for (let i = 0; i < 3; i++)
    beam(
      g,
      [-0.12 + i * 0.12, 0.59, -0.19],
      [-0.14 + i * 0.14, 0.93, -0.235],
      0.018,
      M.iron,
    );
  box(g, [0.46, 0.09, 0.055], [0, 0.95, -0.24], M.green, 0.017, [0.12, 0, 0]);
  beam(g, [-0.19, 0.18, -0.18], [0.19, 0.18, -0.18], 0.018, M.iron);
}
export function buildCafe(root) {
  const x = -2.94,
    z = 1.47;
  const table = group(root, [x, 1.2, z]);
  box(table, [0.85, 0.09, 0.74], [0, 0.67, 0], M.woodLight, 0.028);
  for (let i = 0; i < 5; i++)
    box(
      table,
      [0.007, 0.005, 0.69],
      [-0.34 + i * 0.17, 0.718, 0],
      M.wood,
      0.001,
    );
  cylinder(table, 0.045, 0.045, 0.64, [0, 0.32, 0], M.iron, 8);
  for (const s of [-1, 1]) {
    beam(table, [0, 0.13, 0], [s * 0.31, 0.035, 0.25], 0.025, M.iron);
    beam(table, [0, 0.13, 0], [s * 0.31, 0.035, -0.25], 0.025, M.iron);
  }
  chair(root, x - 0.69, z, Math.PI / 2);
  chair(root, x + 0.66, z + 0.05, -Math.PI / 2);
  chair(root, x + 0.03, z + 0.65, Math.PI);
  cylinder(table, 0.046, 0.033, 0.15, [0.23, 0.79, -0.17], M.green, 8);
  beam(table, [0.23, 0.8, -0.17], [0.23, 1.01, -0.17], 0.008, M.foliage[0]);
  flower(table, [0.23, 1.02, -0.17], 2, 0.039);
  for (const px of [-0.2, 0.2]) {
    cylinder(table, 0.085, 0.085, 0.016, [px, 0.729, 0.14], M.white, 18);
    cylinder(table, 0.042, 0.031, 0.068, [px, 0.77, 0.14], M.white, 12);
    torus(table, 0.025, 0.009, [px + 0.045, 0.774, 0.14], M.white, [
      0,
      Math.PI / 2,
      0,
    ]);
    cylinder(table, 0.033, 0.033, 0.004, [px, 0.806, 0.14], M.woodDark, 12);
  }
  // Ten softly scalloped linen panels, not a solid cone.
  const umb = group(root, [x - 0.11, 1.21, z - 0.04]);
  cylinder(umb, 0.028, 0.032, 2.12, [0, 1.06, 0], M.wood, 10);
  cylinder(umb, 0.2, 0.26, 0.055, [0, 0.03, 0], M.iron, 14);
  const n = 10,
    radius = 1.13,
    top = 2.4;
  for (let i = 0; i < n; i++) {
    const points = [],
      indices = [];
    const segs = 6;
    for (let ring = 0; ring < 3; ring++)
      for (let j = 0; j <= segs; j++) {
        const a = ((i + j / segs) / n) * Math.PI * 2,
          r = [0, radius * 0.55, radius][ring];
        const y =
          ring === 0
            ? top
            : ring === 1
              ? top - 0.17
              : top - 0.43 - Math.sin((j / segs) * Math.PI) * 0.065;
        points.push(Math.cos(a) * r, y, Math.sin(a) * r);
      }
    for (let r = 0; r < 2; r++)
      for (let j = 0; j < segs; j++) {
        const a = r * (segs + 1) + j,
          b = a + segs + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    mesh(
      umb,
      geo,
      material(`umbrella ${i % 2}`, i % 2 ? "#e5d4a7" : "#f5e6bf", {
        side: THREE.DoubleSide,
      }),
    );
    const a = (i / n) * Math.PI * 2;
    beam(
      umb,
      [0, top - 0.1, 0],
      [Math.cos(a) * radius, top - 0.44, Math.sin(a) * radius],
      0.009,
      M.woodLight,
    );
  }
  sphere(umb, [0, top + 0.02, 0], [0.073, 0.07, 0.073], M.woodLight, 1);
  const menu = group(root, [-4.13, 1.21, 1.01], [0, 0.12, -0.03]);
  for (const side of [-1, 1])
    for (const x of [-0.26, 0.26])
      box(menu, [0.06, 0.9, 0.065], [x, 0.43, side * 0.17], M.wood, 0.012, [
        side * -0.22,
        0,
        0,
      ]);
  box(
    menu,
    [0.56, 0.72, 0.055],
    [0, 0.51, 0.17],
    M.woodLight,
    0.015,
    [-0.22, 0, 0],
  );
  sign(
    menu,
    "CAFFÈ\n—  —  —\nESPRESSO\n€ 1,50\n♡",
    0.46,
    0.63,
    [0, 0.51, 0.208],
    { bg: "#33473b", color: "#ede4c6", border: false, rot: [-0.22, 0, 0] },
  );
  plant(root, -4.65, 1.23, 1.35, 0.25, 2);
}
