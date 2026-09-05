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
import { plant, lantern } from "./village.js";

const footprint = [
  [-5.55, -3.5],
  [-5.08, -3.97],
  [4.95, -3.97],
  [5.52, -3.4],
  [5.52, 4.73],
  [4.86, 5.42],
  [3.3, 5.7],
  [-3.68, 5.7],
  [-5.15, 5.23],
  [-5.55, 4.55],
];
const land = [
  [-5.25, -3.48],
  [-4.96, -3.75],
  [4.93, -3.75],
  [5.25, -3.43],
  [5.25, 3.04],
  [3.91, 3.04],
  [3.73, 2.28],
  [1.25, 2.62],
  [-1.95, 2.63],
  [-2.11, 2.89],
  [-4.85, 2.62],
  [-5.25, 2.29],
];
function inside(x, z, poly = land) {
  let result = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i],
      [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi)
      result = !result;
  }
  return result;
}
function clip(poly, nx, nz, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length],
      da = a[0] * nx + a[1] * nz - c,
      db = b[0] * nx + b[1] * nz - c;
    if (da <= 0) out.push(a);
    if (da < 0 !== db < 0) {
      const t = da / (da - db);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}
function paving(root) {
  const pts = [];
  for (let row = 0; row < 22; row++)
    for (let col = 0; col < 29; col++)
      pts.push([
        -5.4 + col * 0.38 + (row % 2) * 0.19 + rand(-0.12, 0.12),
        -3.8 + row * 0.33 + rand(-0.1, 0.1),
      ]);
  for (const p of pts) {
    if (!inside(...p)) continue;
    // No hidden paving beneath the buildings.
    if (p[0] > -4.73 && p[0] < -0.19 && p[1] < -0.15) continue;
    if (p[0] > 1.8 && p[0] < 4.14 && p[1] < 0.48) continue;
    if (p[0] > -0.19 && p[0] < 1.8 && p[1] < -1.63) continue;
    let poly = [
      [p[0] - 0.6, p[1] - 0.6],
      [p[0] + 0.6, p[1] - 0.6],
      [p[0] + 0.6, p[1] + 0.6],
      [p[0] - 0.6, p[1] + 0.6],
    ];
    for (const q of pts) {
      const dx = q[0] - p[0],
        dz = q[1] - p[1];
      if ((!dx && !dz) || dx * dx + dz * dz > 1.44) continue;
      poly = clip(
        poly,
        dx,
        dz,
        (q[0] * q[0] + q[1] * q[1] - p[0] * p[0] - p[1] * p[1]) * 0.5,
      );
      if (!poly.length) break;
    }
    if (poly.length < 3) continue;
    poly = poly.map((v) => [
      p[0] + (v[0] - p[0]) * 0.9,
      p[1] + (v[1] - p[1]) * 0.9,
    ]);
    if (!poly.every((v) => inside(...v))) continue;
    extrudePolygon(
      root,
      poly,
      0.035,
      1.155 + rand(-0.009, 0.009),
      pick(M.paver),
      0.013,
    );
  }
}
export function buildGround(root) {
  extrudePolygon(
    root,
    footprint,
    0.19,
    -0.19,
    material("sandstone foundation", "#a9997c"),
    0.065,
  );
  extrudePolygon(
    root,
    footprint.map(([x, z]) => [x * 0.997, z * 0.997]),
    0.18,
    0.01,
    material("sea edge", "#329a91"),
    0.018,
  );
  extrudePolygon(root, land, 0.88, 0.28, material("mortar", "#9b9982"), 0.025);
  for (let edge = 0; edge < land.length; edge++) {
    const a = land[edge],
      b = land[(edge + 1) % land.length],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz),
      angle = -Math.atan2(dz, dx);
    for (let row = 0; row < 3; row++) {
      const count = Math.max(1, Math.round(len / 0.64)),
        step = len / count;
      for (let i = -1; i < count; i++) {
        const start = Math.max(0, (i + (row % 2) * 0.5) * step),
          end = Math.min(len, (i + 1 + (row % 2) * 0.5) * step);
        if (end - start < 0.04) continue;
        const t = ((start + end) * 0.5) / len;
        const h = 0.26 + rand(-0.02, 0.02);
        box(
          root,
          [end - start - 0.027, h, 0.31],
          [a[0] + dx * t, 0.43 + row * 0.275, a[1] + dz * t],
          pick(M.stone),
          0.041,
          [rand(-0.01, 0.01), angle, rand(-0.018, 0.018)],
        );
        if (row === 0 && rand() < 0.13)
          sphere(
            root,
            [a[0] + dx * t, 0.43, a[1] + dz * t + 0.17],
            [0.07, 0.07, 0.055],
            M.foliage[0],
          );
      }
    }
    const count = Math.max(1, Math.round(len / 0.69));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      box(
        root,
        [len / count - 0.028, 0.19, 0.43],
        [a[0] + dx * t, 1.12, a[1] + dz * t],
        pick([M.trim, ...M.stone.slice(2, 6)]),
        0.045,
        [0, angle, rand(-0.014, 0.014)],
      );
    }
  }
  paving(root);
  // Moss in the odd paving joint; a tiny volunteer plant at the seawall.
  for (let i = 0; i < 19; i++) {
    const x = rand(-4.8, 4.9),
      z = rand(1.3, 2.3);
    if (inside(x, z))
      sphere(root, [x, 1.187, z], [0.065, 0.012, 0.03], pick(M.foliage));
  }
  plant(root, -2.04, 1.22, 2.53, 0.26);
  lantern(root, [4.84, 1.22, 2.62], true);
  for (const [x, z] of [
    [-1.22, 2.68],
    [1.35, 2.57],
    [3.78, 2.43],
  ]) {
    cylinder(root, 0.11, 0.155, 0.09, [x, 1.25, z], M.iron, 10);
    cylinder(root, 0.069, 0.09, 0.27, [x, 1.43, z], M.iron, 10);
    cylinder(root, 0.105, 0.105, 0.075, [x, 1.58, z], M.iron, 10);
    torus(root, 0.12, 0.019, [x, 1.36, z], M.rope);
    tube(
      root,
      [
        [x - 0.1, 1.35, z],
        [x - 0.22, 1.24, z + 0.16],
        [x - 0.2, 0.91, z + 0.3],
        [x - 0.12, 0.69, z + 0.32],
        [x - 0.04, 0.92, z + 0.33],
        [x - 0.02, 1.19, z + 0.2],
        [x + 0.07, 1.37, z],
      ],
      0.024,
      M.rope,
      24,
    );
  }
  for (const [x, z, s] of [
    [-4.2, 3.37, 0.31],
    [-2.65, 4.61, 0.46],
    [-3.17, 4.56, 0.24],
    [4.55, 4.14, 0.29],
    [3.69, 5.02, 0.16],
    [-4.63, 4.7, 0.2],
  ]) {
    sphere(
      root,
      [x, 0.19, z],
      [s, s * 0.48, s * 0.73],
      material("sea rocks", "#598e77"),
      1,
    );
    sphere(
      root,
      [x - 0.04, 0.25, z - 0.03],
      [s * 0.72, s * 0.38, s * 0.54],
      material("rock light", "#78a48a"),
    );
  }
}
export function barrel(parent, x, y, z, size = 0.45) {
  const g = group(parent, [x, y, z]);
  const h = size * 1.35;
  const profile = [
    new THREE.Vector2(size * 0.39, 0),
    new THREE.Vector2(size * 0.47, h * 0.08),
    new THREE.Vector2(size * 0.53, h * 0.4),
    new THREE.Vector2(size * 0.53, h * 0.6),
    new THREE.Vector2(size * 0.47, h * 0.93),
    new THREE.Vector2(size * 0.4, h),
  ];
  mesh(g, new THREE.LatheGeometry(profile, 14), M.woodLight);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    tube(
      g,
      [
        [Math.cos(a) * size * 0.41, 0.03, Math.sin(a) * size * 0.41],
        [Math.cos(a) * size * 0.535, h * 0.5, Math.sin(a) * size * 0.535],
        [Math.cos(a) * size * 0.42, h - 0.03, Math.sin(a) * size * 0.42],
      ],
      0.008,
      M.wood,
      8,
    );
  }
  for (const yy of [0.14, 0.72, 0.94])
    torus(
      g,
      size * (yy === 0.72 ? 0.515 : 0.47),
      0.022,
      [0, h * yy, 0],
      M.iron,
    );
  cylinder(g, size * 0.39, size * 0.39, 0.024, [0, h, 0], M.wood, 14);
  for (let i = -2; i <= 2; i++)
    box(
      g,
      [size * 0.63, 0.016, 0.013],
      [0, h + 0.014, i * size * 0.13],
      M.woodLight,
      0.002,
    );
  return g;
}
export function crate(parent, x, y, z, size = 0.4, angle = 0) {
  const g = group(parent, [x, y, z], [0, angle, 0]);
  box(
    g,
    [size * 0.91, size * 0.85, size * 0.91],
    [0, size * 0.44, 0],
    M.wood,
    0.012,
  );
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      box(
        g,
        [size, 0.072, size * 0.065],
        [0, 0.06 + i * size * 0.245, s * size * 0.47],
        M.woodLight,
        0.007,
      );
      box(
        g,
        [size * 0.065, 0.072, size],
        [s * size * 0.47, 0.06 + i * size * 0.245, 0],
        M.woodLight,
        0.007,
      );
    }
    for (const x of [-1, 1])
      box(
        g,
        [0.047, size, 0.047],
        [x * size * 0.45, size * 0.5, s * size * 0.49],
        M.woodLight,
        0.008,
      );
    box(
      g,
      [size * 1.15, 0.048, 0.035],
      [0, size * 0.49, s * size * 0.51],
      M.woodLight,
      0.007,
      [0, 0, s * 0.7],
    );
  }
  for (let i = 0; i < 4; i++)
    box(
      g,
      [size * 0.23, 0.04, size],
      [(-0.375 + i * 0.25) * size, size, 0],
      M.woodLight,
      0.005,
    );
}
export function buildHarborProps(root) {
  barrel(root, -4.96, 1.22, 0.74, 0.4);
  barrel(root, 4.66, 1.21, 0.92, 0.48);
  crate(root, 4.03, 1.21, 1.12, 0.38, 0.14);
  crate(root, 4.4, 1.21, 1.52, 0.36, -0.1);
  crate(root, 4.1, 1.6, 1.18, 0.32, -0.08);
  // A loosely draped fishing net, modeled as individual hemp strands.
  const net = group(root, [4.57, 1.22, 1.79], [0, 0.32, 0]);
  const netY = (x, z) =>
    0.1 +
    0.44 * Math.exp(-((x + 0.14) ** 2 + (z + 0.05) ** 2) * 9) +
    0.12 * Math.sin(z * 7 + x * 4);
  for (let i = 0; i < 12; i++) {
    const v = -0.54 + i * 0.095,
      ptsA = [],
      ptsB = [];
    for (let j = 0; j < 15; j++) {
      const t = -0.61 + j * 0.086;
      ptsA.push([v, Math.max(0.02, netY(v, t)), t]);
      ptsB.push([t, Math.max(0.02, netY(t, v)), v]);
    }
    tube(net, ptsA, 0.009, M.rope, 18);
    tube(net, ptsB, 0.009, M.rope, 18);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    sphere(
      net,
      [Math.cos(a) * 0.58, 0.09, Math.sin(a) * 0.54],
      [0.045, 0.03, 0.03],
      M.woodLight,
    );
  }
  for (let i = 0; i < 3; i++)
    torus(root, 0.14 + i * 0.015, 0.018, [4.92, 1.24 + i * 0.021, 1.8], M.rope);
}

export function buildBoat(parent) {
  const g = group(parent, [1.4, 0.29, 4.06], [0, -0.12, 0]);
  const outline = [
    [-1.52, 0],
    [-1.25, -0.32],
    [-0.7, -0.49],
    [0.65, -0.5],
    [1.15, -0.4],
    [1.32, -0.24],
    [1.32, 0.24],
    [1.15, 0.4],
    [0.65, 0.5],
    [-0.7, 0.49],
    [-1.25, 0.32],
  ];
  function hullBand(y0, y1, scale0, scale1, mat) {
    const vertices = [],
      indices = [];
    for (const [y, s] of [
      [y0, scale0],
      [y1, scale1],
    ])
      for (const [x, z] of outline)
        vertices.push(x * (0.8 + s * 0.2), y, z * s);
    const n = outline.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(i, n + i, j, j, n + i, n + j);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    mesh(g, geo, mat);
  }
  const boatBlue = material("boat cornflower blue", "#397697"),
    red = material("red antifoul", "#964d35");
  hullBand(0.015, 0.19, 0.25, 0.69, red);
  hullBand(0.19, 0.57, 0.69, 1, M.white);
  hullBand(0.57, 0.67, 1, 1.04, boatBlue);
  extrudePolygon(
    g,
    outline.map(([x, z]) => [x * 0.955, z * 0.91]),
    0.055,
    0.49,
    M.woodLight,
    0.008,
  );
  const boardLines = [
    [-1.12, 1.2, -0.24],
    [-1.4, 1.26, 0],
    [-1.12, 1.2, 0.24],
  ];
  for (const [a, b, z] of boardLines)
    box(g, [b - a, 0.008, 0.012], [(a + b) / 2, 0.552, z], M.wood, 0.001);
  tube(
    g,
    outline.map(([x, z]) => [x * 1.005, 0.672, z * 1.05]),
    0.047,
    boatBlue,
    50,
    true,
  );
  tube(
    g,
    outline.map(([x, z]) => [x * 0.98, 0.48, z * 0.95]),
    0.017,
    M.woodLight,
    50,
    true,
  );
  tube(
    g,
    outline.map(([x, z]) => [x * 0.987, 0.52, z * 0.962]),
    0.018,
    M.rope,
    50,
    true,
  );
  // Working cabin and all four glazed sides.
  box(g, [0.87, 0.82, 0.77], [0.48, 0.96, 0], M.white, 0.035);
  for (const s of [-1, 1]) {
    box(g, [0.63, 0.42, 0.018], [0.48, 1.1, s * 0.394], M.window, 0.012);
    for (const x of [0.14, 0.48, 0.82])
      box(g, [0.047, 0.48, 0.037], [x, 1.1, s * 0.414], M.trim, 0.005);
    for (const yy of [0.86, 1.33])
      box(g, [0.76, 0.048, 0.041], [0.48, yy, s * 0.415], M.trim, 0.005);
    box(g, [0.027, 0.32, 0.22], [0.031, 1.12, s * 0.21], M.window, 0.009);
    for (const zz of [s * 0.06, s * 0.36])
      box(g, [0.042, 0.4, 0.035], [0.009, 1.12, zz], M.trim, 0.005);
  }
  box(g, [0.025, 0.43, 0.61], [0.93, 1.1, 0], M.window, 0.01);
  for (const z of [-0.32, 0, 0.32])
    box(g, [0.037, 0.46, 0.041], [0.95, 1.1, z], M.trim, 0.005);
  box(g, [1.04, 0.12, 0.95], [0.49, 1.43, 0], boatBlue, 0.032);
  box(
    g,
    [0.91, 0.035, 0.82],
    [0.49, 1.509, 0],
    material("roof faded blue", "#568ba2"),
    0.01,
  );
  cylinder(g, 0.079, 0.094, 0.22, [0.69, 1.63, -0.13], M.white, 12);
  cylinder(g, 0.112, 0.112, 0.045, [0.69, 1.745, -0.13], M.trim, 12);
  cylinder(g, 0.054, 0.054, 0.017, [0.69, 1.776, -0.13], M.iron, 12);
  // Little exhaust, navigation light, and roof-top lifebuoy.
  cylinder(g, 0.035, 0.035, 0.25, [0.82, 1.62, 0.24], M.iron, 8);
  sphere(g, [0.91, 1.53, 0], [0.045, 0.04, 0.05], M.lamp);
  lifebuoy(g, [0.22, 1.55, 0.01], 0.13, [Math.PI / 2, 0, 0]);
  box(g, [0.47, 0.1, 0.67], [-0.87, 0.65, 0], M.woodLight, 0.012);
  box(g, [0.3, 0.1, 0.7], [1.06, 0.65, 0], M.woodLight, 0.012);
  // Mast, boom, blocks, and taut rigging.
  cylinder(g, 0.033, 0.055, 1.88, [-0.56, 1.5, -0.05], M.wood, 10);
  cylinder(g, 0.075, 0.075, 0.075, [-0.56, 0.66, -0.05], M.brass, 10);
  beam(g, [-0.59, 1.96, -0.05], [1.2, 1.92, -0.05], 0.026, M.woodLight);
  sphere(g, [-0.56, 2.46, -0.05], [0.046, 0.055, 0.046], M.woodLight, 1);
  tube(
    g,
    [
      [-1.34, 0.69, 0],
      [-0.57, 2.37, -0.05],
      [1.17, 0.7, 0],
    ],
    0.009,
    M.rope,
    3,
  );
  beam(g, [-0.57, 2.37, -0.05], [-0.57, 0.67, 0.37], 0.008, M.rope);
  beam(g, [1.13, 1.92, -0.05], [1.14, 0.73, -0.04], 0.01, M.rope);
  box(g, [0.15, 0.065, 0.24], [-0.58, 0.65, -0.05], M.wood, 0.01);
  // French/Italian fishing pennant.
  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [-0.55, 2.35, -0.05, -0.23, 2.28, -0.05, -0.54, 2.18, -0.05],
      3,
    ),
  );
  flagGeo.computeVertexNormals();
  mesh(
    g,
    flagGeo,
    material("ochre pennant", "#ddaa49", { side: THREE.DoubleSide }),
  );
  lifebuoy(g, [-0.3, 0.48, 0.516], 0.16, [0.03, 0, 0]);
  for (const x of [-1.01, 0.91]) {
    cylinder(g, 0.058, 0.058, 0.28, [x, 0.48, 0.51], M.white, 10, [0, 0, 0.12]);
    tube(
      g,
      [
        [x, 0.68, 0.47],
        [x + 0.03, 0.68, 0.52],
        [x + 0.03, 0.56, 0.54],
      ],
      0.011,
      M.rope,
      8,
    );
  }
  torus(g, 0.124, 0.045, [0.49, 0.68, 0.465], M.iron, [0, 0, 0]);
  sign(g, "STELLA", 0.48, 0.13, [-0.91, 0.35, 0.396], {
    bg: "#e5ddc5",
    color: "#3f6c78",
    border: false,
    font: "Georgia",
    rot: [0, -0.2, 0],
  });
  for (let i = 0; i < 4; i++)
    torus(g, 0.095 + i * 0.013, 0.013, [-1.04, 0.58 + i * 0.014, 0.06], M.rope);
  cylinder(g, 0.1, 0.077, 0.18, [-0.91, 0.67, -0.24], M.navy, 12);
  torus(g, 0.102, 0.013, [-0.91, 0.77, -0.24], M.iron);
  crate(g, 0.99, 0.7, -0.03, 0.23);
  // A folded red tea towel visible inside the cabin.
  box(
    g,
    [0.17, 0.22, 0.035],
    [0.31, 0.86, 0.425],
    M.roof[0],
    0.009,
    [0, 0, -0.13],
  );
  return g;
}
function lifebuoy(parent, pos, r, rot) {
  const g = group(parent, pos, rot);
  torus(g, r, r * 0.26, [0, 0, 0], M.white, [0, 0, 0]);
  for (let i = 0; i < 4; i++)
    torus(
      g,
      r,
      r * 0.28,
      [0, 0, 0],
      material("lifebuoy orange", "#d96736"),
      [0, 0, (i * Math.PI) / 2],
      0.36,
    );
  torus(g, r * 1.34, 0.009, [0, 0, 0], M.rope, [0, 0, 0]);
}
export function mooring(root) {
  tube(
    root,
    [
      [-1.22, 1.45, 2.7],
      [-1.04, 0.49, 3.34],
      [-0.48, 0.33, 3.91],
      [0.01, 0.88, 4.23],
    ],
    0.018,
    M.rope,
    36,
  );
  tube(
    root,
    [
      [3.78, 1.4, 2.43],
      [3.3, 0.45, 3.04],
      [2.7, 0.94, 3.91],
    ],
    0.014,
    M.rope,
    30,
  );
}
export function createWater(parent) {
  const shape = new THREE.Shape();
  footprint.forEach(([x, z], i) =>
    i ? shape.lineTo(x, -z) : shape.moveTo(x, -z),
  );
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 12);
  geo.rotateX(-Math.PI / 2);
  const uniforms = {
    time: { value: 0 },
    warmth: { value: 0 },
    night: { value: 0 },
  };
  const mat = new THREE.MeshPhysicalMaterial({
    color: "#37b7ac",
    roughness: 0.28,
    metalness: 0.08,
    clearcoat: 0.32,
    clearcoatRoughness: 0.25,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.time;
    shader.uniforms.uWarmth = uniforms.warmth;
    shader.uniforms.uNight = uniforms.night;
    shader.vertexShader =
      "varying vec3 vWaterPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvWaterPosition=position;",
    );
    shader.fragmentShader =
      `uniform float uTime;uniform float uWarmth;uniform float uNight;varying vec3 vWaterPosition;
      vec2 hash2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
      float cells(vec2 p){vec2 n=floor(p),f=fract(p);float d1=8.,d2=8.;for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j));vec2 o=hash2(n+g);o=.5+.34*sin(uTime*.32+6.2831*o);float d=length(g+o-f);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}}return d2-d1;}
      float wave(vec2 p){return sin(p.x*4.+p.y*2.7+uTime*.65)*.34+sin(p.x*7.-p.y*4.5-uTime*.48)*.19+sin(p.x*12.+p.y*8.+uTime*.7)*.06;}
      ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      vec2 wp=vWaterPosition.xz;
      vec2 drift=wp*3.4+vec2(sin(wp.y*3.1+uTime*.3),cos(wp.x*2.7+uTime*.2))*.38;
      drift+=vec2(sin(wp.y*13.+wp.x*3.+uTime*.6),cos(wp.x*12.-wp.y*4.+uTime*.5))*.18;
      float caustic=pow(1.-smoothstep(.012,.115,cells(drift)),2.);
      float swell=wave(wp);float depthTone=sin(wp.x*.9+wp.y*.6)*.5+.5;
      diffuseColor.rgb=mix(vec3(.012,.22,.195),vec3(.035,.44,.36),depthTone*.55+.2);
      diffuseColor.rgb+=caustic*vec3(.09,.24,.19)*.45+swell*.023;
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.12,.97,.88),uWarmth*.5);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.012,.11,.16)+caustic*vec3(.025,.06,.085),uNight);
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      // Broken, warm streaks from the quay lantern and the fishing cabin.
      vec2 reflectionPos=vWaterPosition.xz;
      float shimmer=pow(.5+.5*sin(reflectionPos.y*33.+sin(reflectionPos.x*17.+uTime)*1.8-uTime*1.1),5.);
      float bend=sin(reflectionPos.y*12.-uTime*.8)*.09;
      float pierReflection=exp(-pow((reflectionPos.x-4.84+bend)/.34,2.))*smoothstep(2.95,3.2,reflectionPos.y)*(1.-smoothstep(3.4,5.45,reflectionPos.y));
      float cabinReflection=exp(-pow((reflectionPos.x-1.9+bend)/.32,2.))*smoothstep(4.3,4.6,reflectionPos.y)*(1.-smoothstep(4.6,5.65,reflectionPos.y));
      totalEmissiveRadiance+=uNight*vec3(1.,.44,.105)*shimmer*(pierReflection*.3+cabinReflection*.2);
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_begin>",
      `#include <normal_fragment_begin>
      float wx=wave(vWaterPosition.xz+vec2(.025,0.))-wave(vWaterPosition.xz-vec2(.025,0.));
      float wz=wave(vWaterPosition.xz+vec2(0.,.025))-wave(vWaterPosition.xz-vec2(0.,.025));
      vec3 wn=normalize(vec3(-wx*1.1,1.,-wz*1.1));
      normal=normalize(mat3(viewMatrix)*wn);
    `,
    );
  };
  const water = mesh(parent, geo, mat, [0, 0.255, 0]);
  water.castShadow = false;
  return { ...uniforms, material: mat };
}
export function createSeagulls(parent) {
  const gulls = [];
  const white = material("gull feathers", "#f7f0de"),
    tip = material("gull wingtips", "#686f65");
  for (let i = 0; i < 3; i++) {
    const g = group(parent);
    sphere(g, [0, 0, 0], [0.13, 0.045, 0.045], white, 1);
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape();
      sh.moveTo(-0.06, 0);
      sh.lineTo(-0.03, s * 0.19);
      sh.lineTo(-0.19, s * 0.43);
      sh.lineTo(0.04, s * 0.25);
      sh.lineTo(0.07, 0);
      sh.closePath();
      const geo = new THREE.ShapeGeometry(sh);
      geo.rotateX(-Math.PI / 2);
      mesh(g, geo, white, [0, 0.007, 0], [s * 0.13, 0, 0]);
      beam(g, [-0.18, 0, s * 0.43], [-0.12, 0.02, s * 0.36], 0.017, tip);
    }
    sphere(g, [0.12, 0.023, 0], [0.037, 0.035, 0.033], white);
    beam(g, [0.14, 0.02, 0], [0.2, 0.014, 0], 0.015, M.brass, 0.004, 5);
    gulls.push(g);
  }
  return gulls;
}
