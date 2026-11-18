// Player: on-foot + driving controller, camera, combat, stealing cars.
// Meshes shared by every living system live in Meshes (filled at boot).

const Meshes = {};

const Player = {
  x: 0, z: 150, hd: 0, speed: 0, onFoot: true, car: null,
  walkPhase: 0, vy: 0, aimTimer: 0, punchTimer: 0, fireCooldown: 0,
  condition: 100, drift: 0, steerVisual: 0,

  reset: function (x, z, hd) {
    this.x = x; this.z = z; this.hd = hd; this.speed = 0; this.onFoot = true; this.car = null;
    this.condition = 100; this.vy = 0;
  },
  update: function (dt) {
    const ax = Input.axis();
    this.aimTimer = Math.max(0, this.aimTimer - dt);
    this.punchTimer = Math.max(0, this.punchTimer - dt);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (this.onFoot) this.updateFoot(dt, ax);
    else this.updateCar(dt, ax);
    if (Input.was('KeyE')) this.toggleCar();
    if (Input.was('KeyF') && this.onFoot) this.punch();
    if (Input.fired && this.onFoot) this.shoot();
    if (Input.was('KeyQ')) { S.weapon = (S.weapon + 1) % WEAPONS.length; if (WEAPONS[S.weapon].locked) S.weapon = (S.weapon + 1) % WEAPONS.length; HUD.refreshWeapons(); AudioSys.click(); }
    for (let i = 0; i < 5; i++) {
      if (Input.was('Digit' + i) && !WEAPONS[i].locked) { S.weapon = i; HUD.refreshWeapons(); AudioSys.click(); }
    }
  },
  updateFoot: function (dt, ax) {
    const camYaw = Cam.yaw;
    let mx = 0, mz = 0;
    if (ax.y !== 0 || ax.x !== 0) {
      // Camera-relative movement.
      const f = [Math.sin(camYaw + Math.PI), Math.cos(camYaw + Math.PI)];
      const r = [f[1], -f[0]];
      mx = f[0] * ax.y + r[0] * ax.x; mz = f[1] * ax.y + r[1] * ax.x;
      const l = Math.hypot(mx, mz); mx /= l; mz /= l;
      const want = Math.atan2(mx, mz);
      let d = want - this.hd;
      while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      this.hd += clamp(d, -9 * dt, 9 * dt);
    }
    const run = Input.keys.ShiftLeft || Input.keys.ShiftRight;
    const sp = (ax.x || ax.y) ? (run ? CFG.runSpeed : CFG.walkSpeed) : 0;
    const nx = this.x + mx * sp * dt, nz = this.z + mz * sp * dt;
    const fixed = collideCircle(nx, nz, 0.6);
    this.x = fixed.x; this.z = fixed.z;
    this.walkPhase += sp * dt * 1.35;
    this.speed = sp;
    if (Input.was('Space') && this.vy === 0) this.vy = 8;
    if (this.vy !== 0 || this.y > 0) {
      this.y = (this.y || 0) + this.vy * dt; this.vy -= CFG.gravity * dt;
      if (this.y <= 0) { this.y = 0; this.vy = 0; }
    }
  },
  updateCar: function (dt, ax) {
    const car = this.car, def = CARS[car.carIdx];
    const top = def.top * (this.condition > 0 ? 1 : 0.25);
    if (ax.y > 0) this.speed += CFG.carAccel * dt * (1 - this.speed / top);
    else if (ax.y < 0) this.speed -= (this.speed > 0.5 ? CFG.carBrake : CFG.carAccel * 0.6) * dt;
    else this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), 6 * dt);
    this.speed = clamp(this.speed, -10, top);
    const drifting = Input.keys.Space && Math.abs(this.speed) > 12;
    const grip = drifting ? 0.45 : 1;
    const turn = ax.x * CFG.carTurn * clamp(Math.abs(this.speed) / 14, 0, 1) * (this.speed < 0 ? -1 : 1);
    this.hd += turn * dt * (drifting ? 1.6 : 1);
    this.steerVisual = lerp(this.steerVisual, ax.x, 1 - Math.exp(-8 * dt));
    const fx = Math.sin(this.hd), fz = Math.cos(this.hd);
    let nx = this.x + fx * this.speed * dt, nz = this.z + fz * this.speed * dt;
    if (drifting) {
      // Slide sideways a little; score the drift.
      nx += -fz * this.speed * 0.18 * dt * ax.x; nz += fx * this.speed * 0.18 * dt * ax.x;
      S.comboTimer = 2.5;
      S.driftScore += Math.abs(this.speed) * dt * 6;
      if (S.driftScore > 150 && S.combo < 5) { S.combo++; S.driftScore = 0; S.money += 150; HUD.showCombo(); }
    }
    const fixed = collideCircle(nx, nz, 1.7);
    if (fixed.hit) {
      if (Math.abs(this.speed) > 16) {
        this.condition = Math.max(0, this.condition - 6);
        HUD.floater(this.x, 2.4, this.z, 'CRASH! -6', 'bad');
        AudioSys.hit();
      }
      this.speed *= 0.35;
    }
    this.x = fixed.x; this.z = fixed.z;
    car.x = this.x; car.z = this.z; car.hd = this.hd; car.speed = this.speed;
    S.comboTimer = Math.max(0, S.comboTimer - dt);
    if (S.comboTimer === 0) S.combo = 0;
    AudioSys.setEngine(Math.abs(this.speed) / top, true);
  },
  toggleCar: function () {
    if (this.onFoot) {
      const car = nearestCar(this.x, this.z, 4.5);
      if (car) {
        this.onFoot = false; this.car = car; this.speed = 0;
        this.x = car.x; this.z = car.z; this.hd = car.hd;
        car.kind = 'player';
        removeFromLists(car);
        S.carsStolen++;
        if (car.driver) { car.driver = null; Police.addWanted(1); }
        HUD.say('agus', 'Naik, saya yang nyetir. WPD tidak akan mengejar.');
        AudioSys.pickup();
      }
    } else {
      const car = this.car;
      this.onFoot = true; this.car = null; this.speed = 0;
      this.x = car.x - Math.cos(this.hd) * 2.4; this.z = car.z + Math.sin(this.hd) * 2.4;
      car.kind = 'parked'; car.speed = 0;
      World.parked.push(car);
      AudioSys.setEngine(0, false);
    }
  },
  punch: function () {
    this.punchTimer = 0.35;
    const target = nearestEnemy(this.x, this.z, 2.4);
    if (target) {
      damageEnemy(target, WEAPONS[0].dmg, this.x, this.z);
      AudioSys.hit();
    }
  },
  shoot: function () {
    if (this.fireCooldown > 0) return;
    const w = WEAPONS[S.weapon];
    if (S.weapon === 0) { this.punch(); return; }
    if (S.mags[S.weapon] <= 0) {
      if (S.ammo[S.weapon] > 0) {
        const take = Math.min(w.mag, S.ammo[S.weapon]);
        S.ammo[S.weapon] -= take; S.mags[S.weapon] = take;
        HUD.floater(this.x, 2.2, this.z, 'RELOAD', 'info');
      }
      this.fireCooldown = 0.5; HUD.refreshWeapons();
      return;
    }
    S.mags[S.weapon]--;
    this.fireCooldown = S.weapon === 2 ? 0.11 : 0.3;
    this.aimTimer = 0.4;
    AudioSys.shot();
    const fx = Math.sin(this.hd), fz = Math.cos(this.hd);
    const mx = this.x + fx * 0.8, mz = this.z + fz * 0.8;
    World.tracers.push({ x0: mx, y0: 1.45, z0: mz, x1: mx + fx * 30, y1: 1.45, z1: mz + fz * 30, t: 0.09 });
    const target = nearestEnemyInCone(this.x, this.z, this.hd, 42, 0.35);
    if (target) {
      damageEnemy(target, w.dmg, this.x, this.z);
      World.tracers[World.tracers.length - 1].x1 = target.x;
      World.tracers[World.tracers.length - 1].z1 = target.z;
    }
    Traffic.fleeFrom(this.x, this.z, 34);
    if (S.wanted < 2) Police.addWanted(1);
    HUD.refreshWeapons();
  },
  draw: function () {
    if (this.onFoot) {
      const bob = Math.abs(Math.sin(this.walkPhase)) * 0.06 * (this.speed > 0 ? 1 : 0);
      const y = (this.y || 0) + bob;
      R.drawMesh(Meshes.heroBody, matModel(this.x, y, this.z, this.hd, 1));
      const swing = Math.sin(this.walkPhase) * 0.7 * (this.speed > 0 ? 1 : 0);
      const aiming = this.aimTimer > 0 || this.punchTimer > 0;
      const armRx = aiming ? -1.35 : swing;
      R.drawMesh(Meshes.heroArmL, matPivot(this.x, y, this.z, this.hd, -0.42, 1.38, 0, aiming ? 0.2 : -swing));
      R.drawMesh(Meshes.heroArmR, matPivot(this.x, y, this.z, this.hd, 0.42, 1.38, 0, armRx));
      R.flat(this.x, 0.06, this.z, 1.1, 0, 0, 0, 0.32);
    } else if (this.car) {
      const car = this.car;
      R.drawMesh(Meshes.cars[car.carIdx], matModel(car.x, 0, car.z, car.hd, 1));
      R.flat(car.x, 0.06, car.z, 3.4, 0, 0, 0, 0.3);
      // Headlight glows at night.
      if (R.sky && R.sky.night > 0.3) {
        const fx = Math.sin(car.hd), fz = Math.cos(car.hd);
        R.glow(car.x + fx * 2.3, 0.75, car.z + fz * 2.3, 1.6, 1, 0.95, 0.7, 0.55);
        R.glow(car.x - fx * 2.3, 0.75, car.z - fz * 2.3, 1.1, 1, 0.15, 0.1, 0.5);
      }
    }
  },
};

// Camera rig: chase cam with mouse orbit offsets.
const Cam = {
  yaw: 0, eye: [0, 8, -14], at: [0, 1.5, 0], shake: 0,
  update: function (dt, tx, ty, tz, heading) {
    const want = heading + Math.PI + Input.orbitYaw;
    let d = want - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += d * Math.min(1, dt * (Input.dragging ? 10 : 2.2));
    const dist = Input.zoom, pitch = Input.orbitPitch;
    const cx = tx + Math.sin(this.yaw) * Math.cos(pitch) * dist;
    const cz = tz + Math.cos(this.yaw) * Math.cos(pitch) * dist;
    const cy = ty + Math.sin(pitch) * dist + 1.2;
    const k = 1 - Math.exp(-7 * dt);
    this.eye[0] = lerp(this.eye[0], cx, k);
    this.eye[1] = lerp(this.eye[1], Math.max(1.1, cy), k);
    this.eye[2] = lerp(this.eye[2], cz, k);
    this.at[0] = tx; this.at[1] = ty + 1.6; this.at[2] = tz;
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 3);
      this.eye[0] += (Math.random() - 0.5) * this.shake * 0.5;
      this.eye[1] += (Math.random() - 0.5) * this.shake * 0.5;
    }
  },
};

// Circle vs building AABBs + world bounds.
function collideCircle(x, z, r) {
  let hit = false;
  x = clamp(x, WORLD_MIN + 4, WORLD_MAX + 4); z = clamp(z, WORLD_MIN + 4, WORLD_MAX + 4);
  const solids = World.solids;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    const cx = clamp(x, s[0], s[2]), cz = clamp(z, s[1], s[3]);
    const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      hit = true;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = cx + dx / d * r; z = cz + dz / d * r;
      } else {
        // Centre inside: push out along the smallest penetration.
        const pl = x - s[0], pr = s[2] - x, pn = z - s[1], pf = s[3] - z;
        const m = Math.min(pl, pr, pn, pf);
        if (m === pl) x = s[0] - r; else if (m === pr) x = s[2] + r;
        else if (m === pn) z = s[1] - r; else z = s[3] + r;
      }
    }
  }
  return { x: x, z: z, hit: hit };
}
function nearestCar(x, z, range) {
  let best = null, bd = range;
  const lists = [World.parked, World.traffic];
  for (let l = 0; l < lists.length; l++) for (let i = 0; i < lists[l].length; i++) {
    const c = lists[l][i], d = dist2(x, z, c.x, c.z);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function removeFromLists(car) {
  let i = World.parked.indexOf(car); if (i >= 0) World.parked.splice(i, 1);
  i = World.traffic.indexOf(car); if (i >= 0) World.traffic.splice(i, 1);
}
function nearestEnemy(x, z, range) {
  let best = null, bd = range;
  for (let i = 0; i < World.enemies.length; i++) {
    const e = World.enemies[i];
    if (e.hp <= 0) continue;
    const d = dist2(x, z, e.x, e.z);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function nearestEnemyInCone(x, z, hd, range, halfAngle) {
  let best = null, bd = range;
  for (let i = 0; i < World.enemies.length; i++) {
    const e = World.enemies[i];
    if (e.hp <= 0) continue;
    const d = dist2(x, z, e.x, e.z);
    if (d > range) continue;
    let a = Math.atan2(e.x - x, e.z - z) - hd;
    while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2;
    if (Math.abs(a) < halfAngle && d < bd) { bd = d; best = e; }
  }
  return best;
}
function damageEnemy(e, dmg, fromX, fromZ) {
  e.hp -= dmg;
  e.alert = true;
  HUD.floater(e.x, 2.3, e.z, 'HIT! -' + dmg + ' HP', 'hit');
  AudioSys.hit();
  if (e.hp <= 0) {
    e.down = 8;
    S.takedowns++;
    S.money += 120;
    Police.addWanted(1);
    HUD.floater(e.x, 2.6, e.z, '+$120 TAKEDOWN', 'good');
    Missions.onTakedown();
  }
  Cam.shake = Math.min(1, Cam.shake + 0.4);
}
