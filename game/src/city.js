// City generation: one seeded pass builds the whole static world — roads,
// blocks, buildings, park, docks, props — into a single mesh, plus the
// lists the living systems need (lamps, neon, parked cars, road lines).

const ROAD_LINES = [-288, -192, -96, 0, 96, 192, 288];
const WORLD_MIN = -296, WORLD_MAX = 296;

function buildCity(seed) {
  const rng = makeRng(seed);
  const m = new MeshBuilder();
  const lamps = [], neons = [], parked = [], palms = [], solids = [];

  // Ground base + sea + beach.
  m.flatQuad(-460, -460, 460, 460, -0.15, [0.55, 0.62, 0.45], 'grass', 0, 0, 24, 24);
  m.flatQuad(-460, -460, -296, 460, -0.35, [0.85, 0.9, 0.95], 'water', 0, 0.9, 5, 28);
  m.flatQuad(-312, -460, -296, 460, -0.1, [1, 1, 1], 'sand', 0, 0, 1, 28);

  // Roads: vertical + horizontal strips, wet sheen at dusk via spec.
  ROAD_LINES.forEach(function (c) {
    m.flatQuad(c - 8, WORLD_MIN, c + 8, WORLD_MAX, 0.02, [1, 1, 1], 'road', 0, 0.55, 1, 37);
    m.flatQuad(WORLD_MIN, c - 8, WORLD_MAX, c + 8, 0.02, [1, 1, 1], 'road', 0, 0.55, 37, 1);
  });
  // Crosswalks at intersections.
  ROAD_LINES.forEach(function (cx) {
    ROAD_LINES.forEach(function (cz) {
      for (let i = -2; i <= 2; i++) {
        m.flatQuad(cx - 7, cz + i * 3 - 0.8, cx - 1, cz + i * 3 + 0.8, 0.05, [0.9, 0.9, 0.9], 'glow', 0, 0, 1);
        m.flatQuad(cx + 1, cz + i * 3 - 0.8, cx + 7, cz + i * 3 + 0.8, 0.05, [0.9, 0.9, 0.9], 'glow', 0, 0, 1);
      }
    });
  });

  // Blocks.
  for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) {
    const cx = (col - 2.5) * CFG.pitch, cz = (row - 2.5) * CFG.pitch;
    const d = DISTRICTS[DISTRICT_GRID[row][col]];
    const tint = d.tint;
    m.flatQuad(cx - 40, cz - 40, cx + 40, cz + 40, 0.0, tint, 'walk', 0, 0.08, 5, 5);
    const isPark = (col === 2 && row === 3) || (col === 3 && row === 3);
    if (isPark) {
      m.flatQuad(cx - 38, cz - 38, cx + 38, cz + 38, 0.06, [0.8, 0.9, 0.7], 'grass', 0, 0, 5, 5);
      // Monument: stepped base + gold obelisk.
      m.box(cx, 1.0, cz, 8, 2, 8, { c: [0.75, 0.72, 0.68], tile: 'wall' });
      solids.push([cx - 4, cz - 4, cx + 4, cz + 4]);
      m.box(cx, 3.2, cz, 4.5, 2.6, 4.5, { c: [0.8, 0.77, 0.72], tile: 'wall' });
      m.box(cx, 7.5, cz, 1.6, 6.5, 1.6, { c: [0.9, 0.75, 0.3], tile: 'wall', spc: 0.8 });
      m.box(cx, 11.2, cz, 0.9, 0.9, 0.9, { c: [1, 0.85, 0.3], tile: 'glow', emi: 1.2 });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2, px = cx + Math.cos(a) * 28, pz = cz + Math.sin(a) * 28;
        addPalm(m, px, pz, rng, palms);
      }
      continue;
    }
    // Buildings: split the block into plots.
    const n = rngInt(rng, 2, 4), horizontal = rngChance(rng, 0.5);
    for (let b = 0; b < n; b++) {
      const t0 = -40 + (b / n) * 80 + 3, t1 = -40 + ((b + 1) / n) * 80 - 3;
      const w = horizontal ? (t1 - t0) : rngRange(rng, 22, 34);
      const dd = horizontal ? rngRange(rng, 22, 34) : (t1 - t0);
      const bx = horizontal ? (t0 + t1) / 2 + cx : cx + rngRange(rng, -8, 8);
      const bz = horizontal ? cz + rngRange(rng, -8, 8) : (t0 + t1) / 2 + cz;
      const centreBoost = 1 - (Math.abs(col - 2.5) + Math.abs(row - 2.5)) / 5;
      const h = rngRange(rng, 10, 22) + centreBoost * rngRange(rng, 6, 26);
      const shopFront = (d.id === 'SENJA' || d.id === 'BATIK') && rngChance(rng, 0.55);
      const tile = shopFront ? 'shops' : rngPick(rng, ['facadeA', 'facadeB', 'facadeA']);
      const shade = rngRange(rng, 0.82, 1.02);
      const colr = [tint[0] * shade + 0.12, tint[1] * shade + 0.12, tint[2] * shade + 0.12];
      towerBox(m, bx, bz, w, h, dd, colr, tile);
      solids.push([bx - w / 2, bz - dd / 2, bx + w / 2, bz + dd / 2]);
      m.box(bx + rngRange(rng, -4, 4), h + 0.8, bz + rngRange(rng, -4, 4), rngRange(rng, 3, 6), 1.6, rngRange(rng, 3, 6), { c: [0.4, 0.38, 0.36], tile: 'roof' });
      if (shopFront) {
        // Neon sign quad on the street face + glow point.
        const facing = bz > cz ? 1 : -1;
        const nx = bx, nz = bz + facing * (dd / 2 + 0.3);
        m.quad([nx - 4, 4.6, nz], [nx + 4, 4.6, nz], [nx + 4, 6.2, nz], [nx - 4, 6.2, nz],
          [0, 0, facing], [1, 1, 1], tileUV('neon'), 1.1, 0);
        neons.push({ x: nx, y: 5.4, z: nz + facing * 0.8, color: [1, 0.35, 0.6] });
      }
    }
    // Street trees + lamps around the block.
    if (rngChance(rng, 0.8)) addPalm(m, cx - 34, cz - 34, rng, palms);
    if (rngChance(rng, 0.7)) addPalm(m, cx + 34, cz + 30, rng, palms);
    if (rngChance(rng, 0.5)) addPalm(m, cx + 30, cz - 34, rng, palms);
  }

  // Lamps at every other intersection.
  ROAD_LINES.forEach(function (cx, ix) {
    ROAD_LINES.forEach(function (cz, iz) {
      if ((ix + iz) % 2 === 0) {
        addLamp(m, cx + 9.5, cz + 9.5);
        lamps.push({ x: cx + 10.3, y: 5.0, z: cz + 9.5 });
      }
    });
  });

  // Docks: wooden pier over the sea + crates.
  for (let i = 0; i < 3; i++) {
    const pz = -110 + i * 55;
    m.box(-318, 0.4, pz, 44, 0.7, 7, { c: [0.5, 0.38, 0.24], tile: 'wall' });
    m.box(-336, 0.9, pz, 2, 1.2, 2, { c: [0.45, 0.34, 0.22], tile: 'wall' });
  }
  addCrate(m, -300, -100); addCrate(m, -302, -97); addBarrel(m, -299, -104);
  addCrate(m, -250, -240); addBarrel(m, -246, -238);

  // Billboards.
  addBillboard(m, -80, 190, 0.4); addBillboard(m, 150, -70, -0.3);
  addBillboard(m, 40, -250, 0.1); addBillboard(m, -230, 60, 0.9);

  // Distant skyline silhouettes beyond the grid.
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const bx = side * rngRange(rng, 330, 400), bz = rngRange(rng, -320, 320);
    const h = rngRange(rng, 30, 70);
    towerBox(m, bx, bz, rngRange(rng, 24, 40), h, rngRange(rng, 24, 40), [0.42, 0.45, 0.55], 'facadeB', -2);
  }

  // Parked cars along roads.
  for (let i = 0; i < 16; i++) {
    const vertical = rngChance(rng, 0.5);
    const line = rngPick(rng, ROAD_LINES), off = rngPick(rng, [-5.2, 5.2]);
    const along = rngRange(rng, -270, 270);
    parked.push({
      x: vertical ? line + off : along, z: vertical ? along : line + off,
      hd: vertical ? (off > 0 ? 0 : Math.PI) : (off > 0 ? Math.PI / 2 : -Math.PI / 2),
      carIdx: rngInt(rng, 0, 5), speed: 0, kind: 'parked',
    });
  }

  return { mesh: m.finish(), lamps: lamps, neons: neons, parked: parked, palms: palms, solids: solids };
}

// A tall building as stacked <=14m segments so facade windows stay square
// (one tile per segment; atlas UVs never stretch past a tile's rect).
function towerBox(m, bx, bz, w, h, dd, colr, tile, yBase) {
  const segs = Math.max(1, Math.round(h / 14)), sh = h / segs, y0 = yBase || 0;
  for (let s = 0; s < segs; s++) {
    m.box(bx, y0 + sh * (s + 0.5), bz, w, sh, dd, { c: colr, side: tile, top: 'roof', emi: 0.55, spc: 0.12 });
  }
}

function addPalm(m, x, z, rng, list) {
  const lean = rngRange(rng, -0.06, 0.06);
  m.prism(x, 2.2, z, 0.22, 4.4, 7, 'y', [0.45, 0.32, 0.2], 'wall');
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rng() * 0.3, dx = Math.cos(a), dz = Math.sin(a);
    const x0 = x + dx * 0.2 + lean * 20, z0 = z + dz * 0.2;
    const x1 = x + dx * 2.4 + lean * 30, z1 = z + dz * 2.4;
    const px = -dz * 0.45, pz = dx * 0.45;
    m.quad([x0 - px, 4.5, z0 - pz], [x0 + px, 4.5, z0 + pz], [x1 + px * 0.4, 3.3, z1 + pz * 0.4], [x1 - px * 0.4, 3.3, z1 - pz * 0.4],
      [0, 1, 0], [0.2 + rng() * 0.06, 0.5, 0.2], tileUV('grass'), 0, 0);
  }
  list.push({ x: x, z: z });
}
function addLamp(m, x, z) {
  m.prism(x, 2.6, z, 0.09, 5.2, 6, 'y', [0.2, 0.2, 0.22], 'wall');
  m.box(x + 0.4, 5.1, z, 0.9, 0.1, 0.1, { c: [0.2, 0.2, 0.22], tile: 'wall' });
  m.box(x + 0.8, 4.95, z, 0.34, 0.18, 0.24, { c: [1, 0.9, 0.6], tile: 'glow', emi: 1.5 });
}
function addCrate(m, x, z) {
  m.box(x, 0.5, z, 1.0, 1.0, 1.0, { c: [0.6, 0.45, 0.28], tile: 'wall' });
  m.box(x, 0.5, z, 1.04, 0.12, 1.04, { c: [0.45, 0.33, 0.2], tile: 'wall' });
}
function addBarrel(m, x, z) {
  m.prism(x, 0.55, z, 0.42, 1.1, 9, 'y', [0.75, 0.3, 0.12], 'wall');
}
function addBillboard(m, x, z, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  function R(px, pz) { return [x + px * c - pz * s, z + px * s + pz * c]; }
  const p1 = R(-1.6, 0), p2 = R(1.6, 0);
  m.box(p1[0], 2.0, p1[1], 0.24, 4.0, 0.24, { c: [0.25, 0.25, 0.28], tile: 'wall' });
  m.box(p2[0], 2.0, p2[1], 0.24, 4.0, 0.24, { c: [0.25, 0.25, 0.28], tile: 'wall' });
  const a = R(-2.3, 0.15), b = R(2.3, 0.15), n = [s, 0, c];
  m.quad([a[0], 3.3, a[1]], [b[0], 3.3, b[1]], [b[0], 5.9, b[1]], [a[0], 5.9, a[1]], n, WHITE, tileUV('board'), 0.9, 0);
}
