// Wanted level + WPD response: pursuit cars, the police helicopter with its
// searchlight, evasion, busted/wasted. WPD blue is the force's colour.

const Police = {
  cars: [], heli: null, evadeTimer: 0, bustTimer: 0, flash: 0,

  init: function () {
    this.cars = []; this.heli = null;
    this.syncForce(true);
  },
  addWanted: function (n) {
    const before = S.wanted;
    S.wanted = clamp(S.wanted + n, 0, 5);
    if (S.wanted !== before) { this.syncForce(false); HUD.refreshWanted(); }
  },
  syncForce: function (initial) {
    const want = S.wanted === 0 ? 0 : Math.min(3, 1 + Math.floor(S.wanted / 2));
    while (this.cars.length < want) {
      const a = Math.random() * Math.PI * 2, d = initial ? 40 : 90;
      this.cars.push({
        x: clamp(Player.x + Math.sin(a) * d, -280, 280), z: clamp(Player.z + Math.cos(a) * d, -280, 280),
        hd: 0, speed: 0, kind: 'police', carIdx: -1,
      });
    }
    while (this.cars.length > want) this.cars.pop();
    if (S.wanted >= 3 && !this.heli) {
      this.heli = { x: Player.x + 30, z: Player.z - 30, y: 30, hd: 0, angle: 0 };
    } else if (S.wanted < 3) this.heli = null;
    AudioSys.setSiren(S.wanted > 0);
  },
  update: function (dt) {
    this.flash += dt;
    if (S.pose) {
      // Staged screenshot pose: hold formation, rotor keeps spinning.
      if (this.heli) this.heli.rotor = (this.heli.rotor || 0) + dt * 22;
      return;
    }
    if (S.wanted === 0) { this.bustTimer = 0; return; }
    let nearest = 999;
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];
      const want = Math.atan2(Player.x - c.x, Player.z - c.z);
      let d = want - c.hd;
      while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      c.hd += clamp(d, -2.6 * dt, 2.6 * dt);
      const dist = dist2(c.x, c.z, Player.x, Player.z);
      nearest = Math.min(nearest, dist);
      const top = 30 + S.wanted * 3;
      c.speed = lerp(c.speed, dist > 8 ? top : 6, 1 - Math.exp(-1.5 * dt));
      const nx = c.x + Math.sin(c.hd) * c.speed * dt, nz = c.z + Math.cos(c.hd) * c.speed * dt;
      const fixed = collideCircle(nx, nz, 1.7);
      if (fixed.hit) { c.speed *= 0.5; c.hd += 0.7 * dt; }
      c.x = fixed.x; c.z = fixed.z;
      if (dist < 4.5 && !Player.onFoot) {
        // Ram: damage + push.
        Player.condition = Math.max(0, Player.condition - 3 * dt);
        Player.speed *= 1 - 0.8 * dt;
        Cam.shake = Math.min(1, Cam.shake + 0.3 * dt);
      }
      if (dist < 3.5 && Player.onFoot) {
        this.bustTimer += dt;
        if (this.bustTimer > 2.2) this.busted();
      }
    }
    if (nearest > 120) {
      this.evadeTimer += dt;
      if (this.evadeTimer > 7) {
        this.evadeTimer = 0;
        this.addWanted(-1);
        HUD.say('wanto', 'Saya tahan laporan malam ini. Cepat.');
      }
    } else this.evadeTimer = 0;
    if (this.heli) {
      const h = this.heli;
      h.angle += dt * 0.35;
      const tx = Player.x + Math.sin(h.angle) * 26, tz = Player.z + Math.cos(h.angle) * 26;
      h.x = lerp(h.x, tx, 1 - Math.exp(-1.2 * dt));
      h.z = lerp(h.z, tz, 1 - Math.exp(-1.2 * dt));
      h.y = lerp(h.y, 27, 1 - Math.exp(-dt));
      h.hd = Math.atan2(Player.x - h.x, Player.z - h.z);
      h.rotor = (h.rotor || 0) + dt * 22;
    }
    if (this.bustTimer > 0 && nearest > 3.5) this.bustTimer = 0;
  },
  busted: function () {
    this.bustTimer = 0;
    S.money = Math.max(0, S.money - 300);
    S.wanted = 0;
    this.syncForce(false);
    Player.reset(0, 48, 0);
    HUD.say('wanto', 'Hati-hati. Komisaris mengawasi.');
    HUD.toast('BUSTED — DENDA $300', 'bad');
    HUD.refreshAll();
  },
  wasted: function () {
    S.money = Math.max(0, S.money - 200);
    S.wanted = 0; S.health = 100;
    this.syncForce(false);
    Player.reset(0, 150, 0);
    HUD.toast('WASTED — BANGUN DI SAFEHOUSE', 'bad');
    HUD.refreshAll();
  },
  draw: function () {
    const flashOn = Math.floor(this.flash * 4) % 2 === 0;
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];
      R.drawMesh(Meshes.police, matModel(c.x, 0, c.z, c.hd, 1));
      R.flat(c.x, 0.06, c.z, 3.4, 0, 0, 0, 0.3);
      const fx = Math.sin(c.hd), fz = Math.cos(c.hd);
      R.glow(c.x + fx * 2.3, 0.75, c.z + fz * 2.3, 1.4, 1, 0.95, 0.7, 0.45);
      // Flashing light bar.
      if (flashOn) R.glow(c.x, 1.8, c.z, 2.6, 1, 0.15, 0.1, 0.75);
      else R.glow(c.x, 1.8, c.z, 2.6, 0.15, 0.4, 1, 0.75);
    }
    const h = this.heli;
    if (h) {
      R.drawMesh(Meshes.heli, matModel(h.x, h.y, h.z, h.hd, 1));
      R.drawMesh(Meshes.rotor, matModel(h.x, h.y + 0.95, h.z, h.rotor || 0, 1));
      R.flat(h.x, 0.06, h.z, 4.5, 0, 0, 0, 0.18);
      // Searchlight cone + ground pool aimed at the player.
      const dx = Player.x - h.x, dz = Player.z - h.z;
      const tilt = Math.atan2(Math.hypot(dx, dz), h.y) * 0.55;
      const coneMat = matMul(matModel(h.x, h.y - 0.8, h.z, Math.atan2(dx, dz), 1), matPivot(0, 0, 0, 0, 0, 0, 0, -tilt));
      R.drawMesh(Meshes.cone, coneMat, { blend: true, alpha: 0.16 });
      R.flat(Player.x, 0.08, Player.z, 7, 1, 0.95, 0.7, 0.35);
      R.glow(h.x, h.y - 0.8, h.z, 1.6, 1, 0.95, 0.7, 0.6);
    }
  },
};
