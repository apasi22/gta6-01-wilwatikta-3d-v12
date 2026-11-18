// Traffic cars + pedestrians: grid drivers that turn at intersections,
// sidewalk walkers that flee gunfire, and enterable parked cars.

const Traffic = {
  init: function (rng) {
    World.traffic = [];
    for (let i = 0; i < 13; i++) {
      const vertical = rngChance(rng, 0.5);
      const line = rngPick(rng, ROAD_LINES);
      const dir = rngChance(rng, 0.5) ? 1 : -1;
      const along = rngRange(rng, -270, 270);
      World.traffic.push({
        x: vertical ? line + dir * 4 : along, z: vertical ? along : line + dir * 4,
        hd: vertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2),
        speed: rngRange(rng, 8, 13), carIdx: rngInt(rng, 0, 5), kind: 'traffic',
        cruise: rngRange(rng, 10, 12), vertical: vertical, dir: dir, driver: true, wait: 0,
      });
    }
    World.peds = [];
    const shirts = [[0.75, 0.3, 0.3], [0.3, 0.45, 0.75], [0.85, 0.7, 0.3], [0.55, 0.35, 0.6]];
    for (let i = 0; i < 14; i++) {
      const x = rngRange(rng, -260, 260), z = rngRange(rng, -260, 260);
      World.peds.push({
        x: x, z: z, hd: rngRange(rng, 0, Math.PI * 2), speed: rngRange(rng, 1.6, 2.6),
        tx: rngRange(rng, -260, 260), tz: rngRange(rng, -260, 260),
        variant: rngInt(rng, 0, 3), walkPhase: rngRange(rng, 0, 6), flee: 0, down: 0,
        shirt: shirts[i % 4],
      });
    }
  },
  update: function (dt) {
    const list = World.traffic;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.wait > 0) { c.wait -= dt; continue; }
      // Slow for the car ahead.
      let ahead = 999;
      for (let j = 0; j < list.length; j++) {
        if (j === i) continue;
        const o = list[j];
        const dx = o.x - c.x, dz = o.z - c.z;
        const fwd = dx * Math.sin(c.hd) + dz * Math.cos(c.hd);
        const side = Math.abs(dx * Math.cos(c.hd) - dz * Math.sin(c.hd));
        if (fwd > 0 && fwd < ahead && side < 3) ahead = fwd;
      }
      const pd = dist2(c.x, c.z, Player.x, Player.z);
      const target = (ahead < 12 || pd < 9) ? 0 : c.cruise;
      c.speed = lerp(c.speed, target, 1 - Math.exp(-2 * dt));
      c.x += Math.sin(c.hd) * c.speed * dt;
      c.z += Math.cos(c.hd) * c.speed * dt;
      // Turn at intersections sometimes; bounce at the world edge.
      const nearLine = ROAD_LINES.some(function (l) { return Math.abs((c.vertical ? c.z : c.x) - l) < 1.2; });
      if (nearLine && Math.random() < dt * 0.5) {
        c.vertical = !c.vertical;
        c.dir = Math.random() < 0.5 ? 1 : -1;
        c.hd = c.vertical ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        const line = ROAD_LINES.reduce(function (a, b) { return Math.abs(b - (c.vertical ? c.x : c.z)) < Math.abs(a - (c.vertical ? c.x : c.z)) ? b : a; });
        if (c.vertical) c.x = line + c.dir * 4; else c.z = line + c.dir * 4;
      }
      if (c.x < WORLD_MIN + 6 || c.x > WORLD_MAX - 6 || c.z < WORLD_MIN + 6 || c.z > WORLD_MAX - 6) {
        c.hd += Math.PI; c.dir *= -1;
        c.x = clamp(c.x, WORLD_MIN + 8, WORLD_MAX - 8); c.z = clamp(c.z, WORLD_MIN + 8, WORLD_MAX - 8);
      }
      // Nudge out of buildings (parked-car rows sit on roads, so this is rare).
      const fixed = collideCircle(c.x, c.z, 1.7);
      c.x = fixed.x; c.z = fixed.z;
    }
    // Pedestrians.
    for (let i = 0; i < World.peds.length; i++) {
      const p = World.peds[i];
      if (p.down > 0) { p.down -= dt; continue; }
      if (p.flee > 0) {
        p.flee -= dt;
        const a = Math.atan2(p.x - p.fx, p.z - p.fz);
        p.hd = a;
        const nx = p.x + Math.sin(a) * 5.5 * dt, nz = p.z + Math.cos(a) * 5.5 * dt;
        const fixed = collideCircle(nx, nz, 0.6);
        p.x = fixed.x; p.z = fixed.z;
        p.walkPhase += 9 * dt;
        continue;
      }
      const d = dist2(p.x, p.z, p.tx, p.tz);
      if (d < 4) {
        p.tx = rngRange(Math.random, -260, 260); p.tz = rngRange(Math.random, -260, 260);
      } else {
        const want = Math.atan2(p.tx - p.x, p.tz - p.z);
        let dd = want - p.hd;
        while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2;
        p.hd += clamp(dd, -3 * dt, 3 * dt);
        const nx = p.x + Math.sin(p.hd) * p.speed * dt, nz = p.z + Math.cos(p.hd) * p.speed * dt;
        const fixed = collideCircle(nx, nz, 0.6);
        p.x = fixed.x; p.z = fixed.z;
        p.walkPhase += p.speed * dt * 1.4;
      }
    }
  },
  fleeFrom: function (x, z, radius) {
    for (let i = 0; i < World.peds.length; i++) {
      const p = World.peds[i];
      if (dist2(x, z, p.x, p.z) < radius) { p.flee = 4; p.fx = x; p.fz = z; }
    }
  },
  draw: function () {
    for (let i = 0; i < World.traffic.length; i++) {
      const c = World.traffic[i];
      R.drawMesh(Meshes.cars[c.carIdx], matModel(c.x, 0, c.z, c.hd, 1));
      R.flat(c.x, 0.06, c.z, 3.4, 0, 0, 0, 0.28);
      if (R.sky && R.sky.night > 0.3) {
        const fx = Math.sin(c.hd), fz = Math.cos(c.hd);
        R.glow(c.x + fx * 2.3, 0.75, c.z + fz * 2.3, 1.4, 1, 0.95, 0.7, 0.45);
        R.glow(c.x - fx * 2.3, 0.75, c.z - fz * 2.3, 1.0, 1, 0.15, 0.1, 0.4);
      }
    }
    for (let i = 0; i < World.parked.length; i++) {
      const c = World.parked[i];
      R.drawMesh(Meshes.cars[c.carIdx], matModel(c.x, 0, c.z, c.hd, 1));
      R.flat(c.x, 0.06, c.z, 3.4, 0, 0, 0, 0.28);
    }
    for (let i = 0; i < World.peds.length; i++) {
      const p = World.peds[i];
      if (p.down > 0) {
        R.drawMesh(Meshes.pedBody[p.variant], matPivot(p.x, 0.35, p.z, p.hd, 0, 0.9, 0, Math.PI / 2 - 0.15));
        continue;
      }
      const bob = Math.abs(Math.sin(p.walkPhase)) * 0.05;
      R.drawMesh(Meshes.pedBody[p.variant], matModel(p.x, bob, p.z, p.hd, 1));
      const swing = Math.sin(p.walkPhase) * 0.55;
      R.drawMesh(Meshes.pedArmL[p.variant], matPivot(p.x, bob, p.z, p.hd, -0.42, 1.38, 0, -swing));
      R.drawMesh(Meshes.pedArmR[p.variant], matPivot(p.x, bob, p.z, p.hd, 0.42, 1.38, 0, swing));
      R.flat(p.x, 0.06, p.z, 1.0, 0, 0, 0, 0.3);
    }
  },
};
