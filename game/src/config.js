// Wilwatikta 3D — world data: districts, crew, weapons, missions, radio.
// All names, places and story are original fiction set in the city of Wilwatikta, 1998.

const CFG = {
  seed: 1998,
  cols: 6, rows: 6, pitch: 96, road: 16, block: 80,
  dayLength: 480, // real seconds per game day
  gravity: 22, walkSpeed: 9, runSpeed: 14,
  carAccel: 26, carMax: 46, carBrake: 40, carTurn: 2.4,
  renderScale: 2, // internal supersampling: scene renders at 2x, downsampled to the page
};

const DISTRICTS = [
  { id: 'SEGARA', name: 'PELABUHAN SEGARA', short: 'Segara', color: '#3f7fd0', tint: [0.62, 0.72, 0.85] },
  { id: 'BATIK', name: 'KAMPUNG BATIK', short: 'Batik', color: '#7a5fd0', tint: [0.72, 0.66, 0.86] },
  { id: 'EMAS', name: 'LORONG EMAS', short: 'Emas', color: '#e0b83c', tint: [0.88, 0.80, 0.58] },
  { id: 'ALUN', name: 'ALUN-ALUN', short: 'Alun-Alun', color: '#2f6fc0', tint: [0.58, 0.68, 0.84] },
  { id: 'KIDUL', name: 'PANTAI KIDUL', short: 'Kidul', color: '#3fae9a', tint: [0.60, 0.82, 0.76] },
  { id: 'SENJA', name: 'PASAR SENJA', short: 'Senja', color: '#e07a3c', tint: [0.88, 0.66, 0.50] },
];

// District per map cell [row][col], 6x6. West of the grid is the Java Sea.
// District id per 6x6 cell (row-major). Ids: 0 Pelabuhan Segara, 1 Kampung
// Batik, 2 Lorong Emas, 3 Alun-Alun, 4 Pantai Kidul, 5 Pasar Senja.
const DISTRICT_GRID = [
  [0, 0, 1, 1, 2, 2],
  [0, 0, 1, 1, 2, 2],
  [0, 1, 3, 3, 2, 2],
  [4, 4, 3, 3, 5, 5],
  [4, 4, 4, 5, 5, 5],
  [4, 4, 4, 5, 5, 5],
];

const STREETS_H = ['Jl. Pantai Utara', 'Jl. Pelabuhan', 'Jl. Merdeka', 'Jl. Alun-Alun', 'Jl. Pasar Senja', 'Jl. Pantai Kidul'];
const STREETS_V = ['Jl. Segara', 'Jl. Dermaga', 'Jl. Kampung Batik', 'Jl. Gajah Mada', 'Jl. Lorong Emas', 'Jl. Senja Timur'];

const POIS = [
  { letter: 'W', name: 'Warehouse', col: 1, row: 0, kind: 'job' },
  { letter: 'D', name: 'Docks', col: 1, row: 1, kind: 'job' },
  { letter: 'H', name: 'Hotel', col: 2, row: 2, kind: 'safe' },
  { letter: 'M', name: 'Mansion', col: 2, row: 2, kind: 'crew' },
  { letter: 'G', name: 'Bengkel Bambang', col: 3, row: 2, kind: 'garage' },
  { letter: 'C', name: 'Casino', col: 4, row: 1, kind: 'job' },
  { letter: 'M', name: 'Market', col: 2, row: 4, kind: 'job' },
  { letter: 'S', name: 'Safehouse', col: 2, row: 4, kind: 'safe' },
  { letter: 'S', name: 'Showroom', col: 4, row: 3, kind: 'garage' },
];

// Crew: flat-vector portrait parameters (hair, accessory, shirt, backdrop).
const CREW = [
  { id: 'sugeng', name: 'SUGENG WIBOWO', short: 'SUGENG', role: 'HERO', hire: 0, skin: '#c98d5e', hair: '#1c1410', hairStyle: 'short', shirt: '#2e8b4f', bg1: '#ff9a3d', bg2: '#e2573a', key: '' },
  { id: 'agus', name: 'AGUS PRASETYO', short: 'AGUS', role: 'DRIVER · GETAWAY', hire: 200, skin: '#d9a06b', hair: '#14100c', hairStyle: 'flat', shirt: '#23232e', bg1: '#f0569e', bg2: '#a02a7a', key: 'Z', acc: 'shades' },
  { id: 'wanto', name: 'KOMISARIS WANTO', short: 'WANTO', role: 'POLICE · INSIDE MAN', hire: 500, skin: '#c98d5e', hair: '#241a12', hairStyle: 'cap', shirt: '#2b5cb8', bg1: '#4f9be0', bg2: '#2456a8', key: '', acc: 'badge' },
  { id: 'bambang', name: 'BAMBANG', short: 'BAMBANG', role: 'MECHANIC · BENGKEL', hire: 350, skin: '#b97f52', hair: '#100c08', hairStyle: 'topknot', shirt: '#e8a83a', bg1: '#f0c44e', bg2: '#c07f1e', key: 'X', acc: 'band' },
  { id: 'ratna', name: 'RATNA', short: 'RATNA', role: 'FIXER · CONTACTS', hire: 300, skin: '#e0ac74', hair: '#2a1a10', hairStyle: 'bob', shirt: '#1f8f86', bg1: '#5ec8e8', bg2: '#2a7fb8', key: 'C', acc: 'earrings' },
  { id: 'slamet', name: 'SLAMET', short: 'SLAMET', role: 'VETERAN · MUSCLE', hire: 400, skin: '#d9a06b', hair: '#e8e4da', hairStyle: 'white', shirt: '#efe6d0', bg1: '#e05a4e', bg2: '#a02a30', key: 'V', acc: 'scar' },
];

const WEAPONS = [
  { id: 'fists', name: 'PUKULAN', ammo: '∞', mag: Infinity, reserve: Infinity, dmg: 8, locked: false, color: '#e8e4da' },
  { id: 'pistol', name: 'PISTOL GARUDA', ammo: '12/60', mag: 12, reserve: 60, dmg: 18, locked: false, color: '#f2f2f2' },
  { id: 'smg', name: 'SMG TAWON', ammo: '32/160', mag: 32, reserve: 160, dmg: 12, locked: false, color: '#ffd23d' },
  { id: 'shotgun', name: 'SENAPAN ARJUNA', ammo: '6/30', mag: 6, reserve: 30, dmg: 45, locked: true, color: '#9aa4b0' },
  { id: 'rifle', name: 'BEDIL SRIKANDI', ammo: '24/120', mag: 24, reserve: 120, dmg: 30, locked: true, color: '#9aa4b0' },
];

const CARS = [
  { id: 'garuda', name: 'GARUDA GT', color: [0.85, 0.10, 0.12], top: 46, kind: 'sport' },
  { id: 'kencana', name: 'KENCANA S', color: [0.92, 0.75, 0.15], top: 40, kind: 'sport' },
  { id: 'arjuna', name: 'ARJUNA', color: [0.15, 0.35, 0.85], top: 36, kind: 'sedan' },
  { id: 'srikandi', name: 'SRIKANDI', color: [0.75, 0.25, 0.55], top: 38, kind: 'coupe' },
  { id: 'gatot', name: 'GATOTKACA', color: [0.30, 0.55, 0.25], top: 34, kind: 'van' },
  { id: 'bima', name: 'BIMA', color: [0.85, 0.85, 0.88], top: 33, kind: 'sedan' },
];

const MISSIONS = [
  { name: 'Selamat Datang', pay: 300, brief: 'Temui Ratna di Pasar Senja.', stages: [['drive', 4, 4], ['talk', 4, 4]] },
  { name: 'Hot Wheels', pay: 450, brief: 'Curi Kencana S dari showroom.', stages: [['drive', 4, 3], ['steal', 4, 3], ['drive', 2, 4]] },
  { name: 'Antar Paket', pay: 400, brief: 'Antar paket ke gudang Segara.', stages: [['drive', 1, 0], ['deliver', 1, 0]] },
  { name: 'Tagihan Pasar', pay: 550, brief: 'Tagih utang di Pasar Senja.', stages: [['drive', 4, 4], ['clear', 4, 4], ['drive', 2, 4]] },
  { name: 'Mata-Mata', pay: 500, brief: 'Awasi pertemuan di Kampung Batik.', stages: [['drive', 2, 1], ['watch', 2, 1]] },
  { name: 'Balapan Senja', pay: 700, brief: 'Checkpoint 1 of 4: Pantai Kidul.', stages: [['race', 1, 5], ['race', 0, 3], ['race', 2, 2], ['race', 3, 4]], timer: 194 },
  { name: 'Gudang Segara', pay: 650, brief: 'Bersihkan area: Gudang Segara.', stages: [['drive', 1, 0], ['clear', 1, 0], ['drive', 2, 4]], timer: 237 },
  { name: 'Kabur dari WPD', pay: 600, brief: 'Lepaskan kejaran 3 bintang.', stages: [['evade', 0, 0]], timer: 150 },
  { name: 'Heat Wave', pay: 750, brief: 'Antar Agus melewati blokade.', stages: [['drive', 3, 2], ['evade', 3, 2], ['drive', 2, 4]] },
  { name: 'Kencana Hilang', pay: 700, brief: 'Temukan Kencana S yang dicuri.', stages: [['drive', 5, 1], ['steal', 5, 1], ['drive', 4, 3]] },
  { name: 'Double Cross', pay: 900, brief: 'Hadapi pengkhianat di kasino.', stages: [['drive', 4, 1], ['clear', 4, 1], ['evade', 4, 1]] },
  { name: 'The Last Ride', pay: 1200, brief: 'Pelarian terakhir melintasi kota.', stages: [['race', 0, 5], ['race', 5, 0], ['race', 2, 2], ['evade', 2, 4]], timer: 260 },
];

const RADIO = [
  { name: 'GAMELAN FM 101.1', songs: ['Bonang Malam — Gamelan Wilwatikta', 'Saron Senja — Larasati', 'Gong Kidul — Mbah Wiryo'] },
  { name: 'RADIO WILWATIKTA', songs: ['Lampu Kota — Dian Purnama', 'Jalan Pulang — The Segara Boys', 'Senja di Alun-Alun — Ratna Dewi'] },
];

const BARKS = {
  sugeng: ['Setiap jalan punya harga.', 'Kita selesaikan ini malam ini.'],
  agus: ['Naik, saya yang nyetir. WPD tidak akan mengejar.', 'Jalannya kosong, gas!'],
  wanto: ['Hati-hati. Komisaris mengawasi.', 'Saya tahan laporan malam ini. Cepat.'],
  bambang: ['Your Garuda needs new brakes. Come by the bengkel.', 'Mesin ini masih bisa lari, Sugeng.'],
  ratna: ['Kontak saya menunggu di pasar.', 'Uangnya di muka, ceritanya belakangan.'],
  slamet: ['Saya sudah lihat kota ini jatuh dua kali.', 'Jangan tembak kalau bisa pukul.'],
};

// Mutable run state. Reset by newGame(); poses override fields after boot.
const S = {
  mode: 'title', // title | play | map | pause | passed
  time: 18.62, day: 1, money: 12480, respect: 1320, respectLevel: 4,
  wanted: 3, mission: 5, stage: 0, done: [true, true, true, true, true, false, false, false, false, false, false, false],
  missionTimer: 194, stageDone: 0, takedowns: 14, carsStolen: 6, stunts: 2150,
  weapon: 2, ammo: [Infinity, 60, 160, 30, 120], mags: [Infinity, 12, 32, 6, 24],
  health: 100, armor: 0, crew: ['agus'], hired: {},
  radio: 0, song: 0, radioOn: true, muted: false,
  combo: 0, comboTimer: 0, driftScore: 0,
  frozen: false, pose: '', seed: CFG.seed,
  saveKey: 'wilwatikta12',
};

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist2(ax, az, bx, bz) { const dx = ax - bx, dz = az - bz; return Math.sqrt(dx * dx + dz * dz); }
function fmtMoney(n) { return '$' + n.toLocaleString('en-US'); }
function fmtClock(t) { const h = Math.floor(t), m = Math.floor((t - h) * 60); return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
function cellCenter(col, row) { return { x: (col - 2.5) * CFG.pitch, z: (row - 2.5) * CFG.pitch }; }
function districtAt(x, z) {
  const col = clamp(Math.floor(x / CFG.pitch + 3), 0, 5), row = clamp(Math.floor(z / CFG.pitch + 3), 0, 5);
  return DISTRICTS[DISTRICT_GRID[row][col]];
}
