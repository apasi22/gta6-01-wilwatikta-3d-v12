// Mesh builder + procedural models. Every model is assembled from boxes,
// prisms and quads in code — no imported geometry. Forward is +Z.

function MeshBuilder() {
  this.p = []; this.n = []; this.c = []; this.u = []; this.e = []; this.s = []; this.i = [];
}
MeshBuilder.prototype.vert = function (x, y, z, nx, ny, nz, col, u, v, emi, spc) {
  this.p.push(x, y, z); this.n.push(nx, ny, nz);
  this.c.push(col[0], col[1], col[2]); this.u.push(u, v);
  this.e.push(emi || 0); this.s.push(spc || 0);
  return this.p.length / 3 - 1;
};
MeshBuilder.prototype.quad = function (a, b, c, d, n, col, uv, emi, spc) {
  const i0 = this.vert(a[0], a[1], a[2], n[0], n[1], n[2], col, uv[0], uv[1], emi, spc);
  const i1 = this.vert(b[0], b[1], b[2], n[0], n[1], n[2], col, uv[2], uv[1], emi, spc);
  const i2 = this.vert(c[0], c[1], c[2], n[0], n[1], n[2], col, uv[2], uv[3], emi, spc);
  const i3 = this.vert(d[0], d[1], d[2], n[0], n[1], n[2], col, uv[0], uv[3], emi, spc);
  this.i.push(i0, i1, i2, i0, i2, i3);
};
MeshBuilder.prototype.tri = function (a, b, c, n, col, uv, emi, spc) {
  const i0 = this.vert(a[0], a[1], a[2], n[0], n[1], n[2], col, uv[0], uv[1], emi, spc);
  const i1 = this.vert(b[0], b[1], b[2], n[0], n[1], n[2], col, uv[2], uv[1], emi, spc);
  const i2 = this.vert(c[0], c[1], c[2], n[0], n[1], n[2], col, uv[2], uv[3], emi, spc);
  this.i.push(i0, i1, i2);
};
MeshBuilder.prototype.box = function (cx, cy, cz, sx, sy, sz, o) {
  o = o || {};
  const col = o.c || [1, 1, 1], emi = o.emi || 0, spc = o.spc || 0;
  const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
  const side = tileUV(o.side || o.tile || 'glow'), top = tileUV(o.top || o.tile || 'glow'), bot = tileUV(o.bottom || o.tile || 'glow');
  // +X, -X, +Y, -Y, +Z, -Z
  this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], col, side, emi, spc);
  this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], col, side, emi, spc);
  this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], col, top, emi, spc);
  this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], col, bot, emi, spc);
  this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], col, side, emi, spc);
  this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], col, side, emi, spc);
  return this;
};
MeshBuilder.prototype.prism = function (cx, cy, cz, r, h, seg, axis, col, tile, emi, spc) {
  const uv = tileUV(tile || 'glow');
  const pts = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  for (let i = 0; i < seg; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % seg];
    let a, b, c, d, n;
    if (axis === 'x') {
      a = [cx - h / 2, cy + p0[1] * r, cz + p0[0] * r]; b = [cx + h / 2, cy + p0[1] * r, cz + p0[0] * r];
      c = [cx + h / 2, cy + p1[1] * r, cz + p1[0] * r]; d = [cx - h / 2, cy + p1[1] * r, cz + p1[0] * r];
      n = [0, (p0[1] + p1[1]) / 2, (p0[0] + p1[0]) / 2];
    } else {
      a = [cx + p0[0] * r, cy - h / 2, cz + p0[1] * r]; b = [cx + p1[0] * r, cy - h / 2, cz + p1[1] * r];
      c = [cx + p1[0] * r, cy + h / 2, cz + p1[1] * r]; d = [cx + p0[0] * r, cy + h / 2, cz + p0[1] * r];
      n = [(p0[0] + p1[0]) / 2, 0, (p0[1] + p1[1]) / 2];
    }
    const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / nl, n[1] / nl, n[2] / nl];
    this.quad(a, b, c, d, n, col, uv, emi, spc);
  }
  // End caps (fans) so wheels, trunks and barrels read as solids, not rings.
  for (let i = 0; i < seg; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % seg];
    if (axis === 'x') {
      this.tri([cx + h / 2, cy, cz], [cx + h / 2, cy + p1[1] * r, cz + p1[0] * r], [cx + h / 2, cy + p0[1] * r, cz + p0[0] * r], [1, 0, 0], col, uv, emi, spc);
      this.tri([cx - h / 2, cy, cz], [cx - h / 2, cy + p0[1] * r, cz + p0[0] * r], [cx - h / 2, cy + p1[1] * r, cz + p1[0] * r], [-1, 0, 0], col, uv, emi, spc);
    } else {
      this.tri([cx, cy + h / 2, cz], [cx + p0[0] * r, cy + h / 2, cz + p0[1] * r], [cx + p1[0] * r, cy + h / 2, cz + p1[1] * r], [0, 1, 0], col, uv, emi, spc);
      this.tri([cx, cy - h / 2, cz], [cx + p1[0] * r, cy - h / 2, cz + p1[1] * r], [cx + p0[0] * r, cy - h / 2, cz + p0[1] * r], [0, -1, 0], col, uv, emi, spc);
    }
  }
  return this;
};
MeshBuilder.prototype.flatQuad = function (x0, z0, x1, z1, y, col, tile, emi, spc, repX, repZ) {
  // Subdivide into one quad per tile repeat: atlas UVs must never run past a
  // tile's rect (texture wrap repeats the whole atlas, not the tile).
  const uv = tileUV(tile || 'glow');
  const nx = Math.max(1, Math.round(repX || 1)), nz = Math.max(1, Math.round(repZ || 1));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const ax = x0 + (x1 - x0) * i / nx, bx = x0 + (x1 - x0) * (i + 1) / nx;
    const az = z0 + (z1 - z0) * j / nz, bz = z0 + (z1 - z0) * (j + 1) / nz;
    this.quad([ax, y, az], [bx, y, az], [bx, y, bz], [ax, y, bz], [0, 1, 0], col, uv, emi, spc);
  }
  return this;
};
MeshBuilder.prototype.finish = function () {
  return {
    pos: new Float32Array(this.p), nor: new Float32Array(this.n), col: new Float32Array(this.c),
    uv: new Float32Array(this.u), emi: new Float32Array(this.e), spc: new Float32Array(this.s),
    idx: new Uint32Array(this.i), count: this.i.length,
  };
};

const WHITE = [1, 1, 1], DARK = [0.12, 0.12, 0.14], GLASS = [0.16, 0.20, 0.28];

function buildCarMesh(kind, color, police) {
  const m = new MeshBuilder();
  const body = police ? [0.92, 0.93, 0.95] : color;
  m.box(0, 0.62, 0, 2.0, 0.62, 4.4, { c: body, tile: 'glow', spc: 0.75 });
  m.box(0, 1.22, -0.35, 1.7, 0.55, 2.1, { c: GLASS, tile: 'glow', spc: 0.9 });
  m.box(0, 0.95, 1.55, 1.9, 0.28, 1.1, { c: body, tile: 'glow', spc: 0.75 }); // hood
  m.box(0, 0.42, 2.22, 2.02, 0.22, 0.14, { c: DARK, tile: 'glow' });
  m.box(0, 0.42, -2.22, 2.02, 0.22, 0.14, { c: DARK, tile: 'glow' });
  // Headlights + taillights: emissive, so the car reads at dusk and night.
  m.box(-0.7, 0.62, 2.22, 0.5, 0.18, 0.06, { c: [1, 0.95, 0.8], tile: 'glow', emi: 1.2 });
  m.box(0.7, 0.62, 2.22, 0.5, 0.18, 0.06, { c: [1, 0.95, 0.8], tile: 'glow', emi: 1.2 });
  m.box(-0.7, 0.62, -2.22, 0.5, 0.18, 0.06, { c: [1, 0.12, 0.1], tile: 'glow', emi: 1.4 });
  m.box(0.7, 0.62, -2.22, 0.5, 0.18, 0.06, { c: [1, 0.12, 0.1], tile: 'glow', emi: 1.4 });
  if (kind === 'sport') {
    m.box(0, 1.08, -2.05, 1.9, 0.10, 0.5, { c: DARK, tile: 'glow', spc: 0.6 });
    m.box(-0.7, 0.88, -2.05, 0.12, 0.3, 0.12, { c: DARK, tile: 'glow' });
    m.box(0.7, 0.88, -2.05, 0.12, 0.3, 0.12, { c: DARK, tile: 'glow' });
  }
  if (police) {
    m.box(0, 0.66, 0, 2.04, 0.30, 3.2, { c: [0.10, 0.25, 0.75], tile: 'glow' }); // blue band
    m.box(-0.4, 1.56, -0.35, 0.55, 0.18, 0.5, { c: [1, 0.15, 0.1], tile: 'glow', emi: 1.6 });
    m.box(0.4, 1.56, -0.35, 0.55, 0.18, 0.5, { c: [0.15, 0.4, 1], tile: 'glow', emi: 1.6 });
  }
  const wheelC = [0.08, 0.08, 0.09];
  [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]].forEach(function (w) {
    m.prism(w[0], 0.38, w[1], 0.38, 0.3, 8, 'x', wheelC, 'glow');
    m.box(w[0], 0.38, w[1], 0.32, 0.2, 0.2, { c: [0.6, 0.6, 0.62], tile: 'glow', spc: 0.5 });
  });
  // Headlights + tail lights (emissive quads via thin boxes).
  m.box(-0.62, 0.72, 2.24, 0.5, 0.18, 0.06, { c: [1, 0.95, 0.75], tile: 'glow', emi: 1.5 });
  m.box(0.62, 0.72, 2.24, 0.5, 0.18, 0.06, { c: [1, 0.95, 0.75], tile: 'glow', emi: 1.5 });
  m.box(-0.62, 0.72, -2.24, 0.5, 0.18, 0.06, { c: [1, 0.12, 0.1], tile: 'glow', emi: 1.5 });
  m.box(0.62, 0.72, -2.24, 0.5, 0.18, 0.06, { c: [1, 0.12, 0.1], tile: 'glow', emi: 1.5 });
  return m.finish();
}

function buildHeliMesh() {
  const m = new MeshBuilder();
  m.box(0, 0, 0, 2.2, 1.5, 3.6, { c: [0.92, 0.93, 0.95], tile: 'glow', spc: 0.7 });
  m.box(0, 0.1, 1.9, 1.7, 1.0, 0.9, { c: GLASS, tile: 'glow', spc: 0.9 });
  m.box(0, 0.1, -3.4, 0.5, 0.5, 3.6, { c: [0.85, 0.86, 0.88], tile: 'glow' });
  m.box(0, 0.7, -5.0, 0.16, 1.1, 0.7, { c: [0.10, 0.25, 0.75], tile: 'glow' });
  m.box(0, -0.05, 0.2, 2.24, 0.34, 3.0, { c: [0.10, 0.25, 0.75], tile: 'glow' }); // WPD band
  m.box(-1.05, -1.05, 0.6, 0.14, 0.14, 2.6, { c: DARK, tile: 'glow' });
  m.box(1.05, -1.05, 0.6, 0.14, 0.14, 2.6, { c: DARK, tile: 'glow' });
  m.box(-0.9, -0.8, 0.9, 0.12, 0.5, 0.12, { c: DARK, tile: 'glow' });
  m.box(0.9, -0.8, 0.9, 0.12, 0.5, 0.12, { c: DARK, tile: 'glow' });
  m.box(0, -0.75, 1.6, 0.3, 0.2, 0.3, { c: [1, 0.95, 0.75], tile: 'glow', emi: 1.8 }); // searchlight
  return m.finish();
}
function buildRotorMesh() {
  const m = new MeshBuilder();
  m.box(0, 0, 0, 8.4, 0.08, 0.34, { c: [0.15, 0.15, 0.17], tile: 'glow' });
  m.box(0, 0, 0, 0.34, 0.08, 8.4, { c: [0.15, 0.15, 0.17], tile: 'glow' });
  m.box(0, -0.3, 0, 0.3, 0.6, 0.3, { c: DARK, tile: 'glow' });
  return m.finish();
}

// Person: body mesh (legs, torso, head, hair) + separate arm meshes for swing.
function buildPersonBody(o) {
  const m = new MeshBuilder();
  const skin = o.skin, shirt = o.shirt, pants = o.pants, hair = o.hair;
  m.box(-0.17, 0.42, 0, 0.28, 0.84, 0.3, { c: pants, tile: 'glow' });
  m.box(0.17, 0.42, 0, 0.28, 0.84, 0.3, { c: pants, tile: 'glow' });
  m.box(-0.17, 0.05, 0.04, 0.3, 0.1, 0.42, { c: DARK, tile: 'glow' });
  m.box(0.17, 0.05, 0.04, 0.3, 0.1, 0.42, { c: DARK, tile: 'glow' });
  m.box(0, 1.12, 0, 0.62, 0.6, 0.34, { c: shirt, tile: 'glow' });
  if (o.vest) m.box(0, 1.12, 0.06, 0.24, 0.5, 0.26, { c: o.vest, tile: 'glow' });
  m.box(0, 1.62, 0, 0.42, 0.44, 0.4, { c: skin, tile: 'glow' });
  m.box(0, 1.86, -0.02, 0.46, 0.16, 0.44, { c: hair, tile: 'glow' });
  m.box(0, 1.72, -0.2, 0.46, 0.3, 0.08, { c: hair, tile: 'glow' });
  if (o.cap) m.box(0, 1.9, 0, 0.5, 0.12, 0.46, { c: o.cap, tile: 'glow' });
  if (o.cap) m.box(0, 1.86, 0.28, 0.4, 0.05, 0.2, { c: o.cap, tile: 'glow' });
  return m.finish();
}
function buildArmMesh(o, side, gun) {
  const m = new MeshBuilder();
  const x = side * 0.42;
  // Built in body space (shoulder at y 1.38) so matPivot swings about the
  // shoulder; hanging boxes below the origin would double-count the pivot.
  m.box(x, 1.08, 0, 0.24, 0.6, 0.26, { c: o.shirt, tile: 'glow' });
  m.box(x, 0.76, 0, 0.22, 0.14, 0.24, { c: o.skin, tile: 'glow' });
  if (gun) m.box(x, 0.76, 0.22, 0.1, 0.12, 0.42, { c: DARK, tile: 'glow' });
  return m.finish();
}

function buildPalmMesh() {
  const m = new MeshBuilder();
  m.prism(0, 2.2, 0, 0.22, 4.4, 7, 'y', [0.45, 0.32, 0.2], 'glow');
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
    const x0 = dx * 0.2, z0 = dz * 0.2, x1 = dx * 2.4, z1 = dz * 2.4;
    const px = -dz * 0.45, pz = dx * 0.45;
    m.quad([x0 - px, 4.5, z0 - pz], [x0 + px, 4.5, z0 + pz], [x1 + px * 0.4, 3.3, z1 + pz * 0.4], [x1 - px * 0.4, 3.3, z1 - pz * 0.4],
      [0, 1, 0], [0.2, 0.5, 0.2], tileUV('grass'), 0, 0);
  }
  return m.finish();
}
function buildLampMesh() {
  const m = new MeshBuilder();
  m.prism(0, 2.6, 0, 0.09, 5.2, 6, 'y', [0.2, 0.2, 0.22], 'glow');
  m.box(0.4, 5.1, 0, 0.9, 0.1, 0.1, { c: [0.2, 0.2, 0.22], tile: 'glow' });
  m.box(0.8, 4.95, 0, 0.34, 0.18, 0.24, { c: [1, 0.9, 0.6], tile: 'glow', emi: 1.5 });
  return m.finish();
}
function buildCrateMesh() {
  const m = new MeshBuilder();
  m.box(0, 0.5, 0, 1.0, 1.0, 1.0, { c: [0.6, 0.45, 0.28], tile: 'glow' });
  m.box(0, 0.5, 0, 1.04, 0.12, 1.04, { c: [0.45, 0.33, 0.2], tile: 'glow' });
  return m.finish();
}
function buildBarrelMesh() {
  const m = new MeshBuilder();
  m.prism(0, 0.55, 0, 0.42, 1.1, 9, 'y', [0.75, 0.3, 0.12], 'glow');
  m.prism(0, 0.55, 0, 0.44, 0.12, 9, 'y', [0.5, 0.2, 0.08], 'glow');
  return m.finish();
}
function buildBillboardMesh() {
  const m = new MeshBuilder();
  m.box(-1.6, 2.0, 0, 0.24, 4.0, 0.24, { c: [0.25, 0.25, 0.28], tile: 'glow' });
  m.box(1.6, 2.0, 0, 0.24, 4.0, 0.24, { c: [0.25, 0.25, 0.28], tile: 'glow' });
  m.box(0, 4.6, 0, 4.6, 2.6, 0.2, { c: WHITE, tile: 'board', emi: 0.9 });
  return m.finish();
}
// Spotlight cone: apex at origin, opening downward (-Y), radius r, height h.
function buildConeMesh(r, h, seg) {
  const m = new MeshBuilder();
  const uv = tileUV('glow');
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    m.quad([0, 0, 0], [Math.cos(a0) * r, -h, Math.sin(a0) * r], [Math.cos(a1) * r, -h, Math.sin(a1) * r], [0, 0, 0],
      [Math.cos((a0 + a1) / 2), 0.3, Math.sin((a0 + a1) / 2)], [1, 0.95, 0.7], uv, 0, 0);
  }
  return m.finish();
}
// Flat ground ring for checkpoints.
function buildRingMesh(rIn, rOut, seg) {
  const m = new MeshBuilder();
  const uv = tileUV('glow');
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    m.quad([Math.cos(a0) * rIn, 0, Math.sin(a0) * rIn], [Math.cos(a0) * rOut, 0, Math.sin(a0) * rOut],
      [Math.cos(a1) * rOut, 0, Math.sin(a1) * rOut], [Math.cos(a1) * rIn, 0, Math.sin(a1) * rIn],
      [0, 1, 0], [1, 0.85, 0.2], uv, 1.4, 0);
  }
  return m.finish();
}
