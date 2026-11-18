// Story missions: 12 jobs in stages — drive, race, clear, steal, deliver,
// watch, evade — with timers, checkpoints, dialogue and pay. Enemies live here.

const Missions = {
  watchTimer: 0, clearLeft: 0, ringPulse: 0,

  mission: function () { return MISSIONS[S.mission]; },
  stage: function () { return this.mission().stages[S.stage]; },
  stageTarget: function () {
    const st = this.stage();
    if (!st || st[0] === 'evade') return null;
    const c = cellCenter(st[1], st[2]);
    // Snap onto the nearest road so rings, enemies and parked marks sit in
    // the open street, never inside a building; pull 12m toward the block.
    function nearLine(v) {
      let best = ROAD_LINES[0];
      ROAD_LINES.forEach(function (l) { if (Math.abs(l - v) < Math.abs(best - v)) best = l; });
      return best;
    }
    const nx = nearLine(c.x), nz = nearLine(c.z);
    return { x: nx + Math.sign(c.x - nx) * 12, z: nz + Math.sign(c.z - nz) * 12, type: st[0] };
  },
  stageText: function () {
    const m = this.mission(), st = this.stage();
    const names = { drive: 'Pergi ke', race: 'Checkpoint', clear: 'Bersihkan area', steal: 'Curi kendaraan', deliver: 'Antar ke', watch: 'Awasi dari dekat', talk: 'Temui kontak', evade: 'Lepaskan kejaran WPD' };
    if (st[0] === 'race') return 'Checkpoint ' + (S.stage + 1) + ' of ' + m.stages.length + ': ' + districtAt(this.stageTarget().x, this.stageTarget().z).name;
    if (st[0] === 'clear') return 'Bersihkan area: ' + (this.clearLeft > 0 ? this.clearLeft + ' musuh tersisa' : 'selesai');
    return (names[st[0]] || 'Lanjut') + ': ' + m.brief;
  },
  beginStage: function () {
    const st = this.stage();
    if (!st) return;
    this.watchTimer = 0;
    if (st[0] === 'clear') {
      const t = this.stageTarget();
      this.spawnEnemies(t.x, t.z, 4);
      this.clearLeft = 4;
    }
    if (st[0] === 'steal') {
      const t = this.stageTarget();
      World.parked.push({ x: t.x + 6, z: t.z + 6, hd: 0.6, speed: 0, carIdx: 1, kind: 'parked', mark: true });
    }
    HUD.refreshMission();
  },
  spawnEnemies: function (x, z, n) {
    World.enemies = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.5;
      const ex = x + Math.sin(a) * 11, ez = z + Math.cos(a) * 11;
      const fixed = collideCircle(ex, ez, 0.6);
      World.enemies.push({
        x: fixed.x, z: fixed.z, hd: a + Math.PI, hp: 40, alert: false, down: 0,
        walkPhase: i * 1.7, variant: i % 2, shootTimer: 1 + i * 0.4,
      });
    }
  },
  onTakedown: function () {
    const st = this.stage();
    if (st && st[0] === 'clear') {
      this.clearLeft = Math.max(0, this.clearLeft - 1);
      if (this.clearLeft === 0) this.advance();
      HUD.refreshMission();
    }
  },
  advance: function () {
    AudioSys.pickup();
    S.stage++;
    if (S.stage >= this.mission().stages.length) { this.complete(); return; }
    this.beginStage();
    const barks = ['agus', 'ratna', 'bambang', 'slamet'];
    HUD.say(barks[S.stage % 4]);
  },
  complete: function () {
    const m = this.mission();
    S.done[S.mission] = true;
    S.money += m.pay;
    S.respect += 120;
    S.respectLevel = Math.min(9, 1 + Math.floor(S.respect / 400));
    S.mission = Math.min(S.mission + 1, MISSIONS.length - 1);
    S.stage = 0;
    if (this.mission().timer) S.missionTimer = this.mission().timer;
    AudioSys.pass();
    HUD.toast('MISSION PASSED — ' + m.name.toUpperCase() + '  +$' + m.pay, 'good');
    HUD.say('ratna', 'Uangnya di muka, ceritanya belakangan.');
    this.beginStage();
    saveGame();
    HUD.refreshAll();
  },
  fail: function () {
    HUD.toast('MISSION FAILED — COBA LAGI', 'bad');
    S.stage = 0;
    if (this.mission().timer) S.missionTimer = this.mission().timer;
    this.beginStage();
    HUD.refreshMission();
  },
  update: function (dt) {
    this.ringPulse += dt;
    const m = this.mission();
    if (m.timer) {
      S.missionTimer -= dt;
      if (S.missionTimer <= 0) { this.fail(); return; }
    }
    const st = this.stage(), t = this.stageTarget();
    if (!st) return;
    const d = t ? dist2(Player.x, Player.z, t.x, t.z) : 999;
    if (st[0] === 'drive' || st[0] === 'talk' || st[0] === 'deliver') {
      if (d < 9) this.advance();
    } else if (st[0] === 'race') {
      if (d < 11) {
        HUD.floater(t.x, 3, t.z, 'CHECKPOINT!', 'good');
        this.advance();
      }
    } else if (st[0] === 'steal') {
      if (!Player.onFoot && Player.car && Player.car.mark) { Player.car.mark = false; this.advance(); }
    } else if (st[0] === 'watch') {
      if (d < 14) {
        this.watchTimer += dt;
        if (this.watchTimer > 8) this.advance();
      } else this.watchTimer = Math.max(0, this.watchTimer - dt);
    } else if (st[0] === 'evade') {
      if (S.wanted === 0) this.advance();
    }
    // Enemies.
    for (let i = 0; i < World.enemies.length; i++) {
      const e = World.enemies[i];
      if (e.hp <= 0) { e.down += dt; continue; }
      const pd = dist2(e.x, e.z, Player.x, Player.z);
      if (pd < 30) e.alert = true;
      if (!e.alert) { e.hd += Math.sin(this.ringPulse * 0.6 + i) * 0.2 * dt; continue; }
      const want = Math.atan2(Player.x - e.x, Player.z - e.z);
      let dd = want - e.hd;
      while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2;
      e.hd += clamp(dd, -3.5 * dt, 3.5 * dt);
      if (pd > 9) {
        const nx = e.x + Math.sin(e.hd) * 4.2 * dt, nz = e.z + Math.cos(e.hd) * 4.2 * dt;
        const fixed = collideCircle(nx, nz, 0.6);
        e.x = fixed.x; e.z = fixed.z;
        e.walkPhase += 6 * dt;
      }
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && pd < 26) {
        e.shootTimer = 1.7;
        const dmg = 3 + Math.floor(Math.random() * 3);
        S.health -= dmg;
        World.tracers.push({ x0: e.x, y0: 1.45, z0: e.z, x1: Player.x, y1: 1.3, z1: Player.z, t: 0.09 });
        HUD.floater(Player.x, 2.4, Player.z, 'HIT! -' + dmg + ' HP', 'bad');
        AudioSys.shot();
        Cam.shake = Math.min(1, Cam.shake + 0.5);
        if (S.health <= 0) Police.wasted();
        HUD.refreshHealth();
      }
    }
  },
  draw: function () {
    const t = this.stageTarget();
    if (t && S.mode === 'play') {
      const pulse = 1 + Math.sin(this.ringPulse * 3) * 0.12;
      R.drawMesh(Meshes.ring, matModel(t.x, 0.1, t.z, this.ringPulse * 0.5, pulse), { blend: true, alpha: 0.85 });
      R.drawMesh(Meshes.beam, matModel(t.x, 15, t.z, 0, 1), { blend: true, alpha: 0.14 });
      R.glow(t.x, 3.2, t.z, 2.2, 1, 0.85, 0.2, 0.5);
    }
    for (let i = 0; i < World.enemies.length; i++) {
      const e = World.enemies[i];
      const body = Meshes.enemyBody[e.variant];
      if (e.hp <= 0) {
        R.drawMesh(body, matPivot(e.x, 0.35, e.z, e.hd, 0, 0.9, 0, Math.PI / 2 - 0.15));
        continue;
      }
      const bob = Math.abs(Math.sin(e.walkPhase)) * 0.05;
      R.drawMesh(body, matModel(e.x, bob, e.z, e.hd, 1));
      const aiming = e.alert ? -1.35 : Math.sin(e.walkPhase) * 0.5;
      R.drawMesh(Meshes.enemyArmL[e.variant], matPivot(e.x, bob, e.z, e.hd, -0.42, 1.38, 0, e.alert ? 0.2 : -aiming));
      R.drawMesh(Meshes.enemyArmR[e.variant], matPivot(e.x, bob, e.z, e.hd, 0.42, 1.38, 0, aiming));
      R.flat(e.x, 0.06, e.z, 1.0, 0, 0, 0, 0.3);
    }
    // Tracers: streaks of glow sprites.
    for (let i = 0; i < World.tracers.length; i++) {
      const tr = World.tracers[i], a = clamp(tr.t / 0.09, 0, 1);
      for (let k = 1; k <= 4; k++) {
        const f = k / 5;
        R.glow(lerp(tr.x0, tr.x1, f), lerp(tr.y0, tr.y1, f), lerp(tr.z0, tr.z1, f), 0.5, 1, 0.9, 0.5, 0.8 * a);
      }
    }
  },
};
