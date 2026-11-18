// Boot, world assembly, game loop, screenshot poses, save/load, screens.

const World = { city: null, solids: [], parked: [], traffic: [], peds: [], enemies: [], tracers: [] };

function rgb(hex) {
  return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
}

function buildMeshes() {
  CARS.forEach(function (c, i) {
    Meshes.cars = Meshes.cars || [];
    Meshes.cars[i] = R.upload(buildCarMesh(c.kind, c.color, false));
  });
  Meshes.police = R.upload(buildCarMesh('sedan', [0.9, 0.9, 0.92], true));
  Meshes.heli = R.upload(buildHeliMesh());
  Meshes.rotor = R.upload(buildRotorMesh());
  Meshes.cone = R.upload(buildConeMesh(7, 27, 12));
  Meshes.ring = R.upload(buildRingMesh(2.2, 3.0, 24));
  const beam = new MeshBuilder();
  beam.box(0, 0, 0, 1.0, 30, 1.0, { c: [1, 0.85, 0.2], tile: 'glow', emi: 1.2 });
  Meshes.beam = R.upload(beam.finish());
  // Hero: green shirt, white stripe, khaki, black hair, pistol in right hand.
  const hero = { skin: rgb('#d9a06b'), shirt: rgb('#2e8b4f'), pants: rgb('#b8a67a'), hair: rgb('#1c1410'), vest: rgb('#e8e8e8') };
  Meshes.heroBody = R.upload(buildPersonBody(hero));
  Meshes.heroArmL = R.upload(buildArmMesh(hero, -1, false));
  Meshes.heroArmR = R.upload(buildArmMesh(hero, 1, true));
  // Pedestrians: 4 shirt variants.
  const pedDefs = [
    { skin: rgb('#d9a06b'), shirt: rgb('#c04a3a'), pants: rgb('#2a2a34'), hair: rgb('#14100c') },
    { skin: rgb('#b97f52'), shirt: rgb('#3a6ad8'), pants: rgb('#3a3a44'), hair: rgb('#241a12') },
    { skin: rgb('#e0ac74'), shirt: rgb('#d8a83a'), pants: rgb('#4a3a2a'), hair: rgb('#2a1a10') },
    { skin: rgb('#c98d5e'), shirt: rgb('#7a5fd0'), pants: rgb('#22222c'), hair: rgb('#100c08') },
  ];
  Meshes.pedBody = []; Meshes.pedArmL = []; Meshes.pedArmR = [];
  pedDefs.forEach(function (d, i) {
    Meshes.pedBody[i] = R.upload(buildPersonBody(d));
    Meshes.pedArmL[i] = R.upload(buildArmMesh(d, -1, false));
    Meshes.pedArmR[i] = R.upload(buildArmMesh(d, 1, false));
  });
  // Enemies: red + purple shirts, armed.
  const enDefs = [
    { skin: rgb('#c98d5e'), shirt: rgb('#a02a30'), pants: rgb('#22222c'), hair: rgb('#100c08') },
    { skin: rgb('#d9a06b'), shirt: rgb('#5a3a8a'), pants: rgb('#2c2c36'), hair: rgb('#241a12') },
  ];
  Meshes.enemyBody = []; Meshes.enemyArmL = []; Meshes.enemyArmR = [];
  enDefs.forEach(function (d, i) {
    Meshes.enemyBody[i] = R.upload(buildPersonBody(d));
    Meshes.enemyArmL[i] = R.upload(buildArmMesh(d, -1, false));
    Meshes.enemyArmR[i] = R.upload(buildArmMesh(d, 1, true));
  });
}

function applyPose() {
  const pose = S.pose;
  S.frozen = true;
  S.crew = ['agus', 'bambang', 'ratna'];
  ['agus', 'bambang', 'ratna'].forEach(function (id) {
    const el = document.getElementById('crew-' + id);
    if (el) el.classList.add('hired');
  });
  if (pose === 'chase') {
    S.time = 18.62; S.day = 1; S.wanted = 3; S.mission = 5; S.stage = 0; S.missionTimer = 194;
    S.money = 12480; S.health = 100;
    // Eastbound on Jl. Senja Timur: the setting sun is behind the camera,
    // so the Garuda's rear is fully sunlit and reads bright red.
    Player.reset(-100, 96, Math.PI / 2);
    const car = { x: -100, z: 96, hd: Math.PI / 2, speed: 0, carIdx: 0, kind: 'player' };
    Player.onFoot = false; Player.car = car; Player.speed = 16; Player.condition = 92;
    Input.keys.KeyW = true; // auto-drive: the chase shot shows the car at speed
    Police.syncForce(true);
    // Pursuit flanking ahead; Police.update holds formation in a staged pose.
    if (Police.cars[0]) { Police.cars[0].x = -72; Police.cars[0].z = 90; Police.cars[0].hd = Math.PI / 2 + 0.15; Police.cars[0].speed = 0; }
    if (Police.cars[1]) { Police.cars[1].x = -64; Police.cars[1].z = 102; Police.cars[1].hd = Math.PI / 2 - 0.1; Police.cars[1].speed = 0; }
    if (Police.heli) { Police.heli.x = -50; Police.heli.z = 112; Police.heli.y = 27; Police.heli.angle = 0.6; }
    Missions.beginStage();
    HUD.say('bambang', 'Your Garuda needs new brakes. Come by the bengkel.');
    Cam.yaw = Math.PI / 2 + Math.PI;
    Cam.eye = [-111, 6, 96]; Cam.at = [-100, 1.6, 96];
    setMode('play');
  } else if (pose === 'map') {
    S.time = 18.62; S.day = 1; S.wanted = 3; S.mission = 5; S.stage = 0; S.missionTimer = 194;
    S.money = 12480; S.health = 100;
    Player.reset(0, 100, 0);
    const car = { x: 0, z: 100, hd: 0, speed: 0, carIdx: 0, kind: 'player' };
    Player.onFoot = false; Player.car = car; Player.speed = 16; Player.condition = 92;
    Input.keys.KeyW = true;
    Police.syncForce(true);
    if (Police.cars[0]) { Police.cars[0].x = -6; Police.cars[0].z = 118; Police.cars[0].hd = 0.15; Police.cars[0].speed = 0; }
    if (Police.cars[1]) { Police.cars[1].x = 6; Police.cars[1].z = 126; Police.cars[1].hd = -0.1; Police.cars[1].speed = 0; }
    if (Police.heli) { Police.heli.x = 22; Police.heli.z = 138; Police.heli.y = 27; Police.heli.angle = 0.6; }
    Missions.beginStage();
    HUD.say('bambang', 'Your Garuda needs new brakes. Come by the bengkel.');
    Cam.yaw = Math.PI;
    Cam.eye = [0, 7, 88]; Cam.at = [0, 1.6, 100];
    setMode('map');
  } else if (pose === 'night') {
    S.time = 19.83; S.day = 1; S.wanted = 2; S.mission = 6; S.stage = 1; S.missionTimer = 237;
    S.money = 13230; S.health = 100; S.weapon = 2;
    Player.reset(-192, -260, Math.PI); // on road x=-192, facing the warehouse fight
    Police.syncForce(true);
    Missions.beginStage();
    HUD.say('agus', 'WPD datang dari utara. Bersihkan gudang, cepat!');
    Cam.yaw = 0;
    Cam.eye = [-192, 6, -249]; Cam.at = [-192, 1.6, -260];
    setMode('play');
    PoseScript.armed = true; PoseScript.t = 0;
  } else {
    setMode('title');
  }
  HUD.refreshAll();
}

const PoseScript = {
  armed: false, t: 0,
  update: function (dt) {
    if (!this.armed) return;
    this.t += dt;
    if (this.t > 1.1) {
      this.armed = false;
      // Scripted shot: aim at the nearest enemy and fire once, so the night
      // shot shows the tracer + hit marker from real combat code. The camera
      // snaps behind the new heading at once — no swing through buildings.
      const e = nearestEnemy(Player.x, Player.z, 42);
      if (e) {
        Player.hd = Math.atan2(e.x - Player.x, e.z - Player.z);
        Cam.yaw = Player.hd + Math.PI;
        Cam.eye = [Player.x + Math.sin(Cam.yaw) * 11, 6, Player.z + Math.cos(Cam.yaw) * 11];
        Cam.at = [Player.x, 1.6, Player.z];
        Player.shoot();
      }
    }
  },
};

function saveGame() {
  try {
    localStorage.setItem(S.saveKey, JSON.stringify({
      money: S.money, mission: S.mission, stage: S.stage, done: S.done,
      x: Player.x, z: Player.z, hd: Player.hd, time: S.time, day: S.day,
      wanted: S.wanted, respect: S.respect, health: S.health, weapon: S.weapon,
      ammo: S.ammo, mags: S.mags, crew: S.crew, takedowns: S.takedowns,
      carsStolen: S.carsStolen, stunts: S.stunts,
    }));
    HUD.toast('GAME SAVED', 'good');
  } catch (err) { HUD.toast('SAVE GAGAL', 'bad'); }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(S.saveKey);
    if (!raw) { HUD.toast('TIDAK ADA SAVE', 'bad'); return false; }
    const d = JSON.parse(raw);
    S.money = d.money; S.mission = d.mission; S.stage = d.stage; S.done = d.done;
    S.time = d.time; S.day = d.day; S.wanted = d.wanted; S.respect = d.respect;
    S.health = d.health; S.weapon = d.weapon; S.ammo = d.ammo; S.mags = d.mags;
    S.crew = d.crew; S.takedowns = d.takedowns; S.carsStolen = d.carsStolen; S.stunts = d.stunts;
    Player.reset(d.x, d.z, d.hd);
    Police.syncForce(true);
    Missions.beginStage();
    setMode('play');
    HUD.refreshAll();
    HUD.toast('GAME LOADED', 'good');
    return true;
  } catch (err) { HUD.toast('LOAD GAGAL', 'bad'); return false; }
}
function newGame() {
  S.money = 500; S.mission = 0; S.stage = 0;
  S.done = MISSIONS.map(function () { return false; });
  S.time = 9.0; S.day = 1; S.wanted = 0; S.respect = 0; S.respectLevel = 1;
  S.health = 100; S.weapon = 1; S.crew = [];
  S.ammo = [Infinity, 60, 160, 30, 120]; S.mags = [Infinity, 12, 32, 6, 24];
  S.takedowns = 0; S.carsStolen = 0; S.stunts = 0;
  Player.reset(0, 150, 0);
  Police.syncForce(true);
  Missions.beginStage();
  setMode('play');
  HUD.say('ratna', 'Kontak saya menunggu di pasar.');
  HUD.refreshAll();
}
function setMode(mode) {
  S.mode = mode;
  document.getElementById('titleScreen').classList.toggle('show', mode === 'title');
  document.getElementById('pauseScreen').classList.toggle('show', mode === 'pause');
  document.getElementById('hud').classList.toggle('show', mode === 'play' || mode === 'map');
  HUD.showMap(mode === 'map');
  if (mode === 'title') S.time = 20.5;
}

function renderFrame() {
  let cam;
  if (S.mode === 'title') {
    // Cinematic title camera: slow dolly, hero front-facing at right of frame.
    const t = performance.now() / 1000;
    const hx = 4, hz = 30;
    const ex = hx + 2.5 + Math.sin(t * 0.11) * 0.5, ez = hz - 3.8;
    cam = { eye: [ex, 1.75, ez], at: [hx + 1.5, 1.25, hz], fov: 0.92 };
    R.begin(cam, S.time);
    R.drawMesh(Meshes.static, matIdent());
    // Hero standing, facing the camera, pistol raised and visible.
    R.drawMesh(Meshes.heroBody, matModel(hx, 0, hz, 2.62, 1));
    R.drawMesh(Meshes.heroArmL, matPivot(hx, 0, hz, 2.62, -0.42, 1.38, 0, 0.15));
    R.drawMesh(Meshes.heroArmR, matPivot(hx, 0, hz, 2.62, 0.42, 1.38, 0, -0.9));
    R.flat(hx, 0.06, hz, 1.1, 0, 0, 0, 0.32);
    // Warm halo behind the hero: a streetlight key light for the portrait.
    R.glow(hx + 0.5, 2.0, hz + 2.0, 3.5, 1, 0.75, 0.45, 0.10);
    // Hero car parked behind.
    R.drawMesh(Meshes.cars[0], matModel(2, 0, 46, 0.25, 1));
    R.flat(2, 0.06, 46, 3.4, 0, 0, 0, 0.3);
    ambientGlows();
    R.end();
    return;
  }
  cam = { eye: Cam.eye, at: Cam.at, fov: Player.onFoot ? 1.05 : 1.12 };
  R.begin(cam, S.time);
  R.drawMesh(Meshes.static, matIdent());
  Traffic.draw();
  Police.draw();
  Player.draw();
  Missions.draw();
  ambientGlows();
  R.end();
}

function ambientGlows() {
  const night = R.sky ? R.sky.night : 0;
  if (night < 0.2) return;
  const city = World.city;
  const cx = Cam.eye[0], cz = Cam.eye[2];
  for (let i = 0; i < city.lamps.length; i++) {
    const l = city.lamps[i];
    const d2 = (l.x - cx) * (l.x - cx) + (l.z - cz) * (l.z - cz);
    if (d2 > 150 * 150) continue;
    R.glow(l.x, l.y, l.z, 3.0, 1, 0.85, 0.55, 0.4 * night);
    R.flat(l.x, 0.08, l.z, 4.5, 1, 0.85, 0.55, 0.10 * night);
  }
  for (let i = 0; i < city.neons.length; i++) {
    const n = city.neons[i];
    const d2 = (n.x - cx) * (n.x - cx) + (n.z - cz) * (n.z - cz);
    if (d2 > 150 * 150) continue;
    R.glow(n.x, n.y, n.z, 2.6, n.color[0], n.color[1], n.color[2], 0.5 * night);
  }
}

let lastT = 0;
function loop(t) {
  requestAnimationFrame(loop);
  window.__frames = (window.__frames || 0) + 1;
  const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0.016);
  lastT = t;
  if (S.mode === 'play') {
    if (!S.frozen) {
      S.time += dt * 24 / CFG.dayLength;
      if (S.time >= 24) { S.time -= 24; S.day++; }
    }
    Player.update(dt);
    Traffic.update(dt);
    Police.update(dt);
    Missions.update(dt);
    PoseScript.update(dt);
    AudioSys.update(dt);
    for (let i = World.tracers.length - 1; i >= 0; i--) {
      World.tracers[i].t -= dt;
      if (World.tracers[i].t <= 0) World.tracers.splice(i, 1);
    }
    Cam.update(dt, Player.x, 0, Player.z, Player.hd);
    if (Input.was('KeyM')) setMode('map');
    if (Input.was('KeyP') || Input.was('Escape')) setMode('pause');
    if (Input.was('KeyR')) { S.radio = (S.radio + 1) % RADIO.length; HUD.refreshRadio(); }
    if (Input.was('KeyZ')) HUD.hire('agus');
    if (Input.was('KeyX')) HUD.hire('bambang');
    if (Input.was('KeyC')) HUD.hire('ratna');
    if (Input.was('KeyV')) HUD.hire('slamet');
    HUD.update(dt);
  } else if (S.mode === 'map') {
    if (Input.was('KeyM') || Input.was('Escape')) setMode('play');
    HUD.refreshMapRoute();
  } else if (S.mode === 'pause') {
    if (Input.was('KeyP') || Input.was('Escape') || Input.was('Enter')) setMode('play');
  }
  renderFrame();
  Input.clearEdges();
}

function wireButtons() {
  function on(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', function () { AudioSys.unlock(); AudioSys.click(); fn(); });
  }
  on('btnMulai', newGame);
  on('btnSave', function () { if (S.mode === 'play' || S.mode === 'pause' || S.mode === 'map') saveGame(); else HUD.toast('MULAI DULU', 'bad'); });
  on('btnLoad', function () { loadGame(); });
  on('btnEnd', function () { setMode('title'); });
  on('btnResume', function () { setMode('play'); });
  on('btnPauseSave', saveGame);
  on('btnPauseTitle', function () { setMode('title'); });
  on('btnMapClose', function () { setMode('play'); });
  on('btnMapTitle', function () { setMode('title'); });
  on('btnPauseHelp', function () { HUD.toast('WASD GERAK · E MASUK MOBIL · KLIK TEMBAK · Q SENJATA · M PETA', ''); });
}

function boot() {
  const q = new URLSearchParams(location.search);
  S.pose = q.get('pose') || '';
  if (q.get('seed')) S.seed = parseInt(q.get('seed'), 10);
  if (q.get('ss')) CFG.renderScale = clamp(parseInt(q.get('ss'), 10) || 2, 1, 3);
  const canvas = document.getElementById('gl');
  R.init(canvas);
  const city = buildCity(S.seed);
  World.city = city;
  World.solids = city.solids;
  World.parked = city.parked.slice();
  World.enemies = [];
  buildMeshes();
  Meshes.static = R.upload(city.mesh);
  Input.init(canvas);
  HUD.init();
  Traffic.init(makeRng(S.seed + 7));
  Police.init();
  wireButtons();
  // Default run state: mid-story, matching the mission board.
  Player.reset(0, 150, 0);
  if (S.pose) applyPose();
  else { S.time = 20.5; setMode('title'); }
  HUD.refreshAll();
  requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', boot);
