// HUD: DOM panels, SVG crew portraits, weapon slots, round minimap, the full
// map overlay, dialogue, floating combat text and toasts.

function portraitSVG(c, size) {
  const uid = c.id + size;
  let hair = '', acc = '';
  const skin = c.skin, hr = c.hair;
  if (c.hairStyle === 'short') hair = '<path d="M28 38 Q28 18 50 18 Q72 18 72 38 L68 30 Q50 22 32 30 Z" fill="' + hr + '"/>';
  if (c.hairStyle === 'flat') hair = '<rect x="29" y="16" width="42" height="14" rx="6" fill="' + hr + '"/>';
  if (c.hairStyle === 'bob') hair = '<path d="M26 44 Q24 16 50 16 Q76 16 74 44 L70 52 L66 34 Q50 26 34 34 L30 52 Z" fill="' + hr + '"/>';
  if (c.hairStyle === 'white') hair = '<path d="M28 36 Q28 18 50 18 Q72 18 72 36 L67 28 Q50 21 33 28 Z" fill="' + hr + '"/>';
  if (c.hairStyle === 'topknot') hair = '<circle cx="50" cy="14" r="7" fill="' + hr + '"/><path d="M28 38 Q28 20 50 20 Q72 20 72 38 L68 30 Q50 24 32 30 Z" fill="' + hr + '"/>';
  if (c.hairStyle === 'cap') hair = '<path d="M26 34 Q26 16 50 16 Q74 16 74 34 L74 30 L26 30 Z" fill="#1d2f55"/><rect x="24" y="30" width="52" height="6" rx="3" fill="#16223f"/><circle cx="50" cy="23" r="4" fill="#ffd23d"/>';
  if (c.acc === 'shades') acc = '<rect x="31" y="40" width="16" height="10" rx="4" fill="#14141c"/><rect x="53" y="40" width="16" height="10" rx="4" fill="#14141c"/><rect x="46" y="43" width="8" height="3" fill="#14141c"/>';
  if (c.acc === 'band') acc = '<rect x="28" y="30" width="44" height="7" rx="3.5" fill="#d83a2e"/>';
  if (c.acc === 'earrings') acc = '<circle cx="27" cy="52" r="3" fill="#ffd23d"/><circle cx="73" cy="52" r="3" fill="#ffd23d"/>';
  if (c.acc === 'scar') acc = '<path d="M62 44 L68 54" stroke="#b06a4a" stroke-width="2.5" stroke-linecap="round"/>';
  if (c.acc === 'badge') acc = '<circle cx="50" cy="86" r="5" fill="#ffd23d"/><circle cx="50" cy="86" r="2" fill="#b8860b"/>';
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rays += '<path d="M50 50 L' + (50 + Math.cos(a) * 70).toFixed(1) + ' ' + (50 + Math.sin(a) * 70).toFixed(1) +
      ' L' + (50 + Math.cos(a + 0.13) * 70).toFixed(1) + ' ' + (50 + Math.sin(a + 0.13) * 70).toFixed(1) + ' Z" fill="rgba(255,255,255,0.10)"/>';
  }
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100">' +
    '<defs><radialGradient id="bg' + uid + '" cx="0.5" cy="0.38" r="0.85">' +
    '<stop offset="0" stop-color="' + c.bg1 + '"/><stop offset="1" stop-color="' + c.bg2 + '"/></radialGradient>' +
    '<clipPath id="cl' + uid + '"><rect x="2" y="2" width="96" height="96" rx="18"/></clipPath></defs>' +
    '<g clip-path="url(#cl' + uid + ')"><rect x="2" y="2" width="96" height="96" fill="url(#bg' + uid + ')"/>' + rays +
    '<path d="M14 100 Q18 74 50 72 Q82 74 86 100 Z" fill="' + c.shirt + '"/>' +
    '<rect x="42" y="58" width="16" height="18" rx="6" fill="' + skin + '"/>' +
    '<rect x="28" y="24" width="44" height="46" rx="20" fill="' + skin + '"/>' + hair +
    '<circle cx="40" cy="45" r="2.6" fill="#1c1410"/><circle cx="60" cy="45" r="2.6" fill="#1c1410"/>' +
    '<path d="M36 36 Q40 34 44 36 M56 36 Q60 34 64 36" stroke="#1c1410" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<path d="M42 58 Q50 64 58 58" stroke="#7a4a30" stroke-width="2.5" fill="none" stroke-linecap="round"/>' + acc + '</g>' +
    '<rect x="2" y="2" width="96" height="96" rx="18" fill="none" stroke="#fff" stroke-width="3.5"/></svg>';
}

const WEAPON_ART = {
  fists: '<svg viewBox="0 0 48 32"><g fill="CUR"><rect x="8" y="12" width="16" height="14" rx="4"/><rect x="24" y="8" width="16" height="18" rx="4"/><rect x="11" y="8" width="4" height="6" rx="2"/><rect x="17" y="8" width="4" height="6" rx="2"/><rect x="27" y="4" width="4" height="6" rx="2"/><rect x="33" y="4" width="4" height="6" rx="2"/></g></svg>',
  pistol: '<svg viewBox="0 0 48 32"><g fill="CUR"><path d="M8 8 h28 v7 h-14 v11 h-7 V15 H8 Z"/><rect x="30" y="10" width="10" height="4"/></g></svg>',
  smg: '<svg viewBox="0 0 48 32"><g fill="CUR"><rect x="6" y="10" width="26" height="8" rx="2"/><rect x="30" y="12" width="14" height="4"/><rect x="14" y="18" width="5" height="10"/><rect x="24" y="18" width="4" height="7"/><rect x="10" y="6" width="8" height="4" rx="2"/></g></svg>',
  shotgun: '<svg viewBox="0 0 48 32"><g fill="CUR"><rect x="4" y="12" width="34" height="5" rx="2"/><rect x="30" y="15" width="12" height="6" rx="2"/><rect x="10" y="17" width="9" height="5" rx="2"/></g></svg>',
  rifle: '<svg viewBox="0 0 48 32"><g fill="CUR"><rect x="6" y="11" width="30" height="7" rx="2"/><rect x="34" y="13" width="10" height="3"/><rect x="16" y="18" width="5" height="9"/><rect x="24" y="7" width="8" height="4" rx="2"/><rect x="8" y="14" width="6" height="8" rx="2"/></g></svg>',
};

const HUD = {
  floaters: [], dlgTimer: 0, toastTimer: 0, comboTimer: 0,
  el: function (id) { return document.getElementById(id); },

  init: function () {
    // Crew strip: 6 portrait cards.
    const strip = this.el('crewStrip');
    CREW.forEach(function (c) {
      const card = document.createElement('div');
      card.className = 'crew-card'; card.id = 'crew-' + c.id;
      card.innerHTML = portraitSVG(c, 54) +
        '<div class="crew-meta"><b>' + c.short + '</b><span>' + c.role + '</span>' +
        (c.hire ? '<span class="hire">$' + c.hire + ' HIRE' + (c.key ? ' [' + c.key + ']' : '') + '</span>' : '<span class="hire you">YOU</span>') + '</div>';
      card.addEventListener('click', function () { HUD.hire(c.id); });
      strip.appendChild(card);
    });
    // Weapon slots 0-4.
    const row = this.el('weaponRow');
    WEAPONS.forEach(function (w, i) {
      const slot = document.createElement('div');
      slot.className = 'wslot' + (w.locked ? ' locked' : ''); slot.id = 'wslot-' + i;
      slot.innerHTML = '<span class="wnum">' + i + '</span>' +
        '<span class="wicon">' + WEAPON_ART[w.id].replace(/CUR/g, w.locked ? '#5a6270' : '#fff') + '</span>' +
        (w.locked ? '<span class="wammo">LOCKED</span>' : '<span class="wammo">' + w.ammo + '</span>');
      slot.addEventListener('click', function () {
        if (!w.locked) { S.weapon = i; HUD.refreshWeapons(); AudioSys.click(); }
      });
      row.appendChild(slot);
    });
    this.buildMap();
    this.refreshAll();
  },
  hire: function (id) {
    const c = CREW.find(function (x) { return x.id === id; });
    if (!c || !c.hire || S.crew.indexOf(id) >= 0) return;
    if (S.money < c.hire) { this.toast('UANG KURANG — $' + c.hire, 'bad'); return; }
    S.money -= c.hire; S.crew.push(id);
    this.el('crew-' + id).classList.add('hired');
    this.say(id);
    AudioSys.pickup();
    this.refreshMoney();
  },
  say: function (id, line) {
    const c = CREW.find(function (x) { return x.id === id; }) || CREW[0];
    const text = line || BARKS[id][Math.floor(Math.random() * BARKS[id].length)];
    this.el('dlgPortrait').innerHTML = portraitSVG(c, 52);
    this.el('dlgName').textContent = c.short;
    this.el('dlgRole').textContent = c.role;
    this.el('dlgText').textContent = text;
    this.el('dialogue').classList.add('show');
    this.dlgTimer = 5;
  },
  floater: function (x, y, z, text, cls) {
    const div = document.createElement('div');
    div.className = 'floater ' + (cls || 'info');
    div.textContent = text;
    this.el('floaters').appendChild(div);
    this.floaters.push({ el: div, x: x, y: y, z: z, t: 1.4 });
  },
  toast: function (text, cls) {
    const t = this.el('toast');
    t.textContent = text; t.className = 'show ' + (cls || '');
    this.toastTimer = 2.8;
  },
  showCombo: function () {
    const c = this.el('comboText');
    c.innerHTML = '+' + (150 * S.combo) + ' DRIFT &middot; COMBO x' + S.combo +
      '<small>STUNT COMBO x' + S.combo + ' &middot; $' + (150 * S.combo) + '</small>';
    c.classList.add('show');
    this.comboTimer = 1.6;
  },
  refreshMoney: function () { this.el('moneyText').textContent = fmtMoney(S.money); },
  refreshWanted: function () {
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < S.wanted ? '★' : '☆';
    this.el('starsText').textContent = stars;
    this.el('wpdLine').textContent = S.wanted > 0
      ? 'WPD DISPATCH: ' + Math.min(3, 1 + Math.floor(S.wanted / 2)) + ' unit mengejar' + (S.wanted >= 3 ? ' · HELI 2 SPOTLIGHT' : '') + ' — ' + districtAt(Player.x, Player.z).name
      : 'WPD DISPATCH: tidak ada pengejaran aktif.';
  },
  refreshHealth: function () {
    this.el('healthFill').style.width = clamp(S.health, 0, 100) + '%';
  },
  refreshWeapons: function () {
    WEAPONS.forEach(function (w, i) {
      const slot = document.getElementById('wslot-' + i);
      slot.classList.toggle('active', i === S.weapon);
      if (!w.locked) slot.querySelector('.wammo').textContent = S.mags[i] === Infinity ? '∞' : S.mags[i] + '/' + S.ammo[i];
    });
    this.el('weaponName').textContent = WEAPONS[S.weapon].name + (S.weapon > 0 ? '  ·  ' + S.mags[S.weapon] + '/' + S.ammo[S.weapon] + ' ROUNDS' : '');
  },
  refreshRadio: function () {
    this.el('radioStation').textContent = '♪ ' + RADIO[S.radio].name;
    this.el('radioSong').textContent = RADIO[S.radio].songs[S.song];
  },
  refreshMission: function () {
    const m = Missions.mission();
    this.el('missionTitle').textContent = 'MISSION ' + (S.mission + 1) + '/12 — ' + m.name.toUpperCase();
    this.el('missionBrief').textContent = Missions.stageText();
    const next = MISSIONS[Math.min(S.mission + 1, 11)];
    this.el('missionNext').textContent = 'NEXT: ' + next.name.toUpperCase();
    const t = Missions.stageTarget();
    this.el('missionDist').textContent = t ? '▲ ' + Math.round(dist2(Player.x, Player.z, t.x, t.z)) + 'm' : '—';
  },
  refreshVehicle: function () {
    if (Player.onFoot) {
      this.el('vehName').textContent = 'SUGENG WIBOWO — ON FOOT';
      this.el('vehSpeed').textContent = Math.round(Player.speed * 3.6);
      this.el('vehGear').textContent = 'JALAN';
      this.el('vehCondFill').style.width = clamp(S.health, 0, 100) + '%';
      this.el('vehCondPct').textContent = Math.round(S.health) + '%';
      this.el('vehCondLabel').textContent = 'HEALTH';
    } else {
      const def = CARS[Player.car.carIdx];
      this.el('vehName').textContent = def.name;
      this.el('vehSpeed').textContent = Math.abs(Math.round(Player.speed * 3.6));
      const gear = Player.speed < 1 ? 'N' : Player.speed < 12 ? 'G1' : Player.speed < 22 ? 'G2' : Player.speed < 32 ? 'G3' : 'G4';
      this.el('vehGear').textContent = gear;
      this.el('vehCondFill').style.width = clamp(Player.condition, 0, 100) + '%';
      this.el('vehCondPct').textContent = Math.round(Player.condition) + '%';
      this.el('vehCondLabel').textContent = 'CONDITION';
    }
  },
  refreshAll: function () {
    this.refreshMoney(); this.refreshWanted(); this.refreshWeapons();
    this.refreshRadio(); this.refreshMission(); this.refreshHealth(); this.refreshVehicle();
    this.el('clockText').textContent = fmtClock(S.time) + ' · DAY ' + S.day;
  },

  // Round minimap: whole-city district grid, roads, POIs, GPS route, player arrow.
  drawMinimap: function () {
    const cv = this.el('minimap'), ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height, sc = W / 640;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(12,16,26,0.55)'; ctx.fillRect(0, 0, W, H);
    // Sea.
    ctx.fillStyle = 'rgba(42,106,154,0.8)'; ctx.fillRect(0, 0, 16, H);
    for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) {
      const d = DISTRICTS[DISTRICT_GRID[row][col]];
      ctx.fillStyle = d.color; ctx.globalAlpha = 0.72;
      ctx.fillRect((col * 96 + 8) * sc, (row * 96 + 8) * sc, 80 * sc, 80 * sc);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
    ROAD_LINES.forEach(function (l) {
      const p = (l + 320) * sc;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
    });
    // POIs.
    ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    POIS.forEach(function (p) {
      const c = cellCenter(p.col, p.row);
      const x = (c.x + 320) * sc, y = (c.z + 320) * sc;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillText(p.letter, x, y + 2.5);
    });
    // GPS route: Manhattan path from player to target.
    const t = Missions.stageTarget();
    const px = (Player.x + 320) * sc, py = (Player.z + 320) * sc;
    if (t) {
      const tx = (t.x + 320) * sc, ty = (t.z + 320) * sc;
      ctx.strokeStyle = '#ffd23d'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, py); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff4a3a';
      ctx.beginPath(); ctx.arc(tx, ty, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.fillText('★', tx, ty + 2.5);
    }
    // Police dots.
    ctx.fillStyle = '#3a7ae0';
    Police.cars.forEach(function (c) {
      ctx.beginPath(); ctx.arc((c.x + 320) * sc, (c.z + 320) * sc, 3, 0, Math.PI * 2); ctx.fill();
    });
    // Player arrow.
    ctx.save();
    ctx.translate(px, py); ctx.rotate(Math.PI - Player.hd);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    // North marker.
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('N', W / 2, 11);
    ctx.restore();
    // District pill + respect.
    const d = districtAt(Player.x, Player.z);
    this.el('districtPill').textContent = d.name;
    const col = clamp(Math.floor(Player.x / CFG.pitch + 3), 0, 5), row = clamp(Math.floor(Player.z / CFG.pitch + 3), 0, 5);
    this.el('streetText').textContent = Math.abs(Player.x % CFG.pitch) < Math.abs(Player.z % CFG.pitch) ? STREETS_V[col] : STREETS_H[row];
    const pct = clamp((S.respect % 400) / 400 * 100, 0, 100);
    this.el('respectFill').style.width = pct + '%';
    this.el('respectText').textContent = 'REP FIXER · ' + S.respect + '  ·  LV ' + S.respectLevel;
  },

  buildMap: function () {
    // Left: mission list.
    const list = this.el('mapMissions');
    MISSIONS.forEach(function (m, i) {
      const row = document.createElement('div');
      row.className = 'map-mission' + (S.done[i] ? ' done' : i === S.mission ? ' active' : '');
      row.innerHTML = '<span class="mm-num">' + (i + 1) + '.</span><span class="mm-name">' + m.name + '</span>' +
        '<span class="mm-pay">$' + m.pay + '</span><span class="mm-state">' + (S.done[i] ? 'DONE ✓' : i === S.mission ? 'ACTIVE' : '—') + '</span>';
      list.appendChild(row);
    });
    // Centre: district grid + POIs + route.
    const grid = this.el('mapGrid');
    for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) {
      const cell = document.createElement('div');
      cell.className = 'map-cell';
      cell.style.background = DISTRICTS[DISTRICT_GRID[row][col]].color;
      cell.style.left = (col * 100 / 6) + '%'; cell.style.top = (row * 100 / 6) + '%';
      grid.appendChild(cell);
    }
    const labels = [[0, 0, 'PELABUHAN SEGARA', 2], [2, 0, 'KAMPUNG BATIK', 2], [4, 0, 'LORONG EMAS', 2], [2, 2, 'ALUN-ALUN', 2], [0, 4, 'PANTAI KIDUL', 2], [3, 4, 'PASAR SENJA', 3]];
    labels.forEach(function (L) {
      const el = document.createElement('div');
      el.className = 'map-district';
      el.textContent = L[2];
      el.style.left = (L[0] * 100 / 6 + 2) + '%'; el.style.top = (L[1] * 100 / 6 + 4) + '%';
      el.style.width = (L[3] * 100 / 6 - 4) + '%';
      grid.appendChild(el);
    });
    POIS.forEach(function (p) {
      const el = document.createElement('div');
      el.className = 'map-poi';
      el.style.left = ((p.col + 0.5) * 100 / 6) + '%'; el.style.top = ((p.row + 0.5) * 100 / 6) + '%';
      el.innerHTML = '<b>' + p.letter + '</b><span>' + p.name + '</span>';
      grid.appendChild(el);
    });
    // GPS route SVG.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'map-route');
    svg.setAttribute('viewBox', '0 0 600 600');
    grid.appendChild(svg);
    this.mapSvg = svg;
    // Right: stats + ring + legend are static HTML; refresh dynamic bits.
    this.el('statStory').textContent = Math.round(S.done.filter(Boolean).length / 12 * 100) + '%';
    this.el('statRep').textContent = 'FIXER · ' + S.respect;
    this.el('statCash').textContent = fmtMoney(S.money);
    const ring = this.el('ringFill'), C = 2 * Math.PI * 34;
    const prog = S.done.filter(Boolean).length / 12;
    ring.style.strokeDasharray = C;
    ring.style.strokeDashoffset = C * (1 - prog);
    this.el('ringPct').textContent = Math.round(prog * 100) + '%';
  },
  refreshMapRoute: function () {
    if (!this.mapSvg) return;
    const t = Missions.stageTarget();
    const px = (Player.x + 320) / 640 * 600, py = (Player.z + 320) / 640 * 600;
    let html = '';
    if (t) {
      const tx = (t.x + 320) / 640 * 600, ty = (t.z + 320) / 640 * 600;
      html = '<polyline points="' + px + ',' + py + ' ' + tx + ',' + py + ' ' + tx + ',' + ty + '" fill="none" stroke="#ffd23d" stroke-width="3" stroke-dasharray="8 6"/>' +
        '<circle cx="' + tx + '" cy="' + ty + '" r="26" fill="none" stroke="#ffd23d" stroke-width="2" stroke-dasharray="5 5"/>' +
        '<text x="' + tx + '" y="' + (ty + 44) + '" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle">OBJECTIVE</text>' +
        '<path d="M' + tx + ' ' + (ty - 10) + ' l3 6 6 1 -5 5 1 6 -5 -3 -5 3 1 -6 -5 -5 6 -1 Z" fill="#ff4a3a"/>';
    }
    html += '<g transform="translate(' + px + ',' + py + ') rotate(' + (180 - Player.hd * 180 / Math.PI) + ')"><path d="M0 -9 L6 7 L0 3 L-6 7 Z" fill="#fff" stroke="#111"/></g>';
    this.mapSvg.innerHTML = html;
    this.el('mapJob').textContent = Missions.mission().name;
    this.el('mapJobStage').textContent = Missions.stageText();
    this.el('mapJobDist').textContent = t ? 'GPS ' + Math.round(dist2(Player.x, Player.z, t.x, t.z)) + ' m' : '';
    this.el('statTime').textContent = fmtClock(S.time) + ' · DAY ' + S.day;
    this.el('statWanted').textContent = '★'.repeat(S.wanted) + '☆'.repeat(5 - S.wanted);
    this.el('statTakedowns').textContent = S.takedowns;
    this.el('statCars').textContent = S.carsStolen;
    this.el('statStunts').textContent = fmtMoney(S.stunts);
  },
  showMap: function (show) {
    this.el('mapScreen').classList.toggle('show', show);
    this.el('hud').classList.toggle('map-open', show);
    if (show) this.refreshMapRoute();
  },

  project: function (x, y, z) {
    const vp = matMul(R.proj, R.view);
    const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
    const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
    const cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (cw <= 0.01) return null;
    return { x: (cx / cw * 0.5 + 0.5) * window.innerWidth, y: (-cy / cw * 0.5 + 0.5) * window.innerHeight };
  },
  update: function (dt) {
    if (S.mode !== 'play' && S.mode !== 'map') return;
    this.el('clockText').textContent = fmtClock(S.time) + ' · DAY ' + S.day;
    const m = Missions.mission();
    if (m.timer) {
      const t = Math.max(0, S.missionTimer);
      this.el('missionTimer').textContent = '◷ ' + Math.floor(t / 60) + ':' + (Math.floor(t % 60) < 10 ? '0' : '') + Math.floor(t % 60);
    } else this.el('missionTimer').textContent = '';
    const tg = Missions.stageTarget();
    this.el('missionDist').textContent = tg ? '▲ ' + Math.round(dist2(Player.x, Player.z, tg.x, tg.z)) + 'm' : '—';
    this.el('missionBarFill').style.width = clamp((S.stage + 1) / m.stages.length * 100, 0, 100) + '%';
    this.refreshVehicle();
    this.drawMinimap();
    if (this.dlgTimer > 0) { this.dlgTimer -= dt; if (this.dlgTimer <= 0) this.el('dialogue').classList.remove('show'); }
    if (this.toastTimer > 0) { this.toastTimer -= dt; if (this.toastTimer <= 0) this.el('toast').className = ''; }
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.el('comboText').classList.remove('show'); }
    // Floaters: project + fade.
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t -= dt; f.y += dt * 1.1;
      if (f.t <= 0) { f.el.remove(); this.floaters.splice(i, 1); continue; }
      const p = this.project(f.x, f.y, f.z);
      if (!p) { f.el.style.display = 'none'; continue; }
      f.el.style.display = 'block';
      f.el.style.left = (p.x - 60) + 'px'; f.el.style.top = (p.y - 14) + 'px';
      f.el.style.opacity = clamp(f.t, 0, 1);
    }
  },
};
