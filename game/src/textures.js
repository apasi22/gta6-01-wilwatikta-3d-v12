// Procedural textures: one diffuse atlas + one emissive atlas, both painted on
// canvases at boot. No image files, no network. Windows glow through the
// emissive atlas as night falls.

const ATLAS = 512, TILE = 128;
const TILES = {
  facadeA: [0, 0], facadeB: [1, 0], shops: [2, 0], roof: [3, 0],
  road: [0, 1], walk: [1, 1], grass: [2, 1], neon: [3, 1],
  sand: [0, 2], water: [1, 2], wall: [2, 2], board: [3, 2],
  glow: [0, 3],
};

function tileUV(name, rx, ry, rw, rh) {
  const t = TILES[name];
  const x = (t[0] * TILE + (rx || 0)) / ATLAS, y = (t[1] * TILE + (ry || 0)) / ATLAS;
  const w = (rw === undefined ? TILE : rw) / ATLAS, h = (rh === undefined ? TILE : rh) / ATLAS;
  return [x, 1 - y - h, x + w, 1 - y]; // v flipped for UNPACK_FLIP_Y
}

function paintAtlas(seed) {
  const rng = makeRng(seed);
  const dc = document.createElement('canvas'); dc.width = dc.height = ATLAS;
  const ec = document.createElement('canvas'); ec.width = ec.height = ATLAS;
  const d = dc.getContext('2d'), e = ec.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, ATLAS, ATLAS);

  function facade(tx, ty, wall, floors, cols, litRatio) {
    const x0 = tx * TILE, y0 = ty * TILE;
    d.fillStyle = wall; d.fillRect(x0, y0, TILE, TILE);
    d.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 260; i++) d.fillRect(x0 + rng() * TILE, y0 + rng() * TILE, 2, 2);
    const ww = TILE / cols, wh = TILE / floors;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const wx = x0 + c * ww + ww * 0.22, wy = y0 + f * wh + wh * 0.24;
      const w = ww * 0.56, h = wh * 0.52, lit = rng() < litRatio;
      d.fillStyle = lit ? '#ffd98a' : '#232c3a';
      d.fillRect(wx, wy, w, h);
      d.fillStyle = 'rgba(255,255,255,0.25)'; d.fillRect(wx, wy, w, 2);
      if (lit) { e.fillStyle = '#ffca6a'; e.fillRect(wx, wy, w, h); }
    }
  }
  facade(0, 0, '#8a7a62', 6, 4, 0.45);
  facade(1, 0, '#7d7468', 8, 5, 0.38);
  // Shopfronts: awnings + glass.
  (function () {
    const x0 = 2 * TILE, y0 = 0;
    d.fillStyle = '#9a8a70'; d.fillRect(x0, y0, TILE, TILE);
    facade(2, 0, '#9a8a70', 5, 4, 0.3);
    const cols = ['#d84a3a', '#2a8a6a', '#d8a83a', '#3a6ad8'];
    for (let c = 0; c < 4; c++) {
      d.fillStyle = cols[c]; d.fillRect(x0 + c * 32 + 2, y0 + 84, 28, 12);
      d.fillStyle = '#2c3442'; d.fillRect(x0 + c * 32 + 4, y0 + 98, 24, 30);
      d.fillStyle = 'rgba(255,220,140,0.85)'; d.fillRect(x0 + c * 32 + 6, y0 + 100, 20, 10);
      e.fillStyle = '#ffca6a'; e.fillRect(x0 + c * 32 + 6, y0 + 100, 20, 10);
    }
  })();
  // Roof.
  (function () {
    const x0 = 3 * TILE, y0 = 0;
    d.fillStyle = '#5c564c'; d.fillRect(x0, y0, TILE, TILE);
    d.fillStyle = '#4a443c';
    for (let i = 0; i < 5; i++) d.fillRect(x0 + 8 + rng() * 96, y0 + 8 + rng() * 96, 16, 12);
    d.strokeStyle = 'rgba(0,0,0,0.3)';
    for (let i = 1; i < 4; i++) { d.beginPath(); d.moveTo(x0 + i * 32, y0); d.lineTo(x0 + i * 32, y0 + TILE); d.stroke(); }
  })();
  // Road: asphalt, edge lines, dashed centre.
  (function () {
    const x0 = 0, y0 = TILE;
    d.fillStyle = '#33363d'; d.fillRect(x0, y0, TILE, TILE);
    for (let i = 0; i < 500; i++) { d.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.16)'; d.fillRect(x0 + rng() * TILE, y0 + rng() * TILE, 2, 2); }
    d.fillStyle = '#e8d24a'; d.fillRect(x0 + 60, y0, 3, TILE); d.fillRect(x0 + 66, y0, 3, TILE);
    d.fillStyle = '#c8c8c8';
    for (let y = 0; y < TILE; y += 32) { d.fillRect(x0 + 8, y0 + y, 3, 18); d.fillRect(x0 + 117, y0 + y, 3, 18); }
  })();
  // Sidewalk slabs.
  (function () {
    const x0 = TILE, y0 = TILE;
    d.fillStyle = '#8d8a80'; d.fillRect(x0, y0, TILE, TILE);
    d.strokeStyle = 'rgba(0,0,0,0.25)'; d.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      d.beginPath(); d.moveTo(x0 + i * 32, y0); d.lineTo(x0 + i * 32, y0 + TILE); d.stroke();
      d.beginPath(); d.moveTo(x0, y0 + i * 32); d.lineTo(x0 + TILE, y0 + i * 32); d.stroke();
    }
  })();
  // Grass.
  (function () {
    const x0 = 2 * TILE, y0 = TILE;
    d.fillStyle = '#5d8a3e'; d.fillRect(x0, y0, TILE, TILE);
    for (let i = 0; i < 420; i++) { d.fillStyle = rng() < 0.5 ? '#6d9a4a' : '#4e7a34'; d.fillRect(x0 + rng() * TILE, y0 + rng() * TILE, 3, 3); }
  })();
  // Neon strip.
  (function () {
    const x0 = 3 * TILE, y0 = TILE;
    d.fillStyle = '#14101e'; d.fillRect(x0, y0, TILE, TILE);
    const cols = ['#ff4a8a', '#3ae0ff', '#ffd23d', '#7aff5a'];
    for (let i = 0; i < 4; i++) {
      d.fillStyle = cols[i]; d.fillRect(x0 + 8, y0 + 10 + i * 30, 112, 14);
      d.fillStyle = 'rgba(255,255,255,0.85)'; d.fillRect(x0 + 14, y0 + 14 + i * 30, 60 - i * 8, 6);
      e.fillStyle = cols[i]; e.fillRect(x0 + 8, y0 + 10 + i * 30, 112, 14);
    }
  })();
  // Sand.
  (function () {
    const x0 = 0, y0 = 2 * TILE;
    d.fillStyle = '#d8c08a'; d.fillRect(x0, y0, TILE, TILE);
    for (let i = 0; i < 300; i++) { d.fillStyle = rng() < 0.5 ? '#c8ae74' : '#e8d09a'; d.fillRect(x0 + rng() * TILE, y0 + rng() * TILE, 3, 2); }
  })();
  // Water.
  (function () {
    const x0 = TILE, y0 = 2 * TILE;
    d.fillStyle = '#2a6a9a'; d.fillRect(x0, y0, TILE, TILE);
    d.strokeStyle = 'rgba(255,255,255,0.25)'; d.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      d.beginPath();
      const yy = y0 + 10 + i * 15;
      d.moveTo(x0 + 6, yy); d.bezierCurveTo(x0 + 40, yy - 5, x0 + 80, yy + 5, x0 + 122, yy);
      d.stroke();
    }
  })();
  // Plain wall.
  (function () {
    const x0 = 2 * TILE, y0 = 2 * TILE;
    d.fillStyle = '#96887a'; d.fillRect(x0, y0, TILE, TILE);
    d.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 120; i++) d.fillRect(x0 + rng() * TILE, y0 + rng() * TILE, 3, 3);
  })();
  // Billboard face.
  (function () {
    const x0 = 3 * TILE, y0 = 2 * TILE;
    const g = d.createLinearGradient(x0, y0, x0 + TILE, y0 + TILE);
    g.addColorStop(0, '#ff7a3d'); g.addColorStop(1, '#c02a6a');
    d.fillStyle = g; d.fillRect(x0, y0, TILE, TILE);
    d.fillStyle = '#fff'; d.font = 'bold 26px sans-serif'; d.textAlign = 'center';
    d.fillText('WILWATIKTA', x0 + 64, y0 + 52);
    d.font = 'bold 13px sans-serif'; d.fillText('KOTA · 1998', x0 + 64, y0 + 78);
    e.fillStyle = '#3a1a2a'; e.fillRect(x0, y0, TILE, TILE);
    e.fillStyle = '#ffb0d0'; e.font = 'bold 26px sans-serif'; e.textAlign = 'center';
    e.fillText('WILWATIKTA', x0 + 64, y0 + 52);
  })();
  // Glow tile: plain white in both atlases, so emissive quads glow with
  // their own vertex colour (headlights, lamps, light bars, rings).
  d.fillStyle = '#fff'; d.fillRect(0, 3 * TILE, TILE, TILE);
  e.fillStyle = '#fff'; e.fillRect(0, 3 * TILE, TILE, TILE);
  return { diffuse: dc, emissive: ec };
}

// Soft radial glow sprite for lamps, headlights, neon bloom.
function makeGlowSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  return c;
}
