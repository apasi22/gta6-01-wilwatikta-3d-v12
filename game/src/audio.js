// Procedural audio: gamelan-flavoured radio sequencer, engine hum, siren and
// effects — all synthesized with WebAudio, no sound files.

const AudioSys = {
  ctx: null, master: null, engineOsc: null, engineGain: null, engineFilter: null,
  sirenOsc: null, sirenGain: null, sirenOn: false, sirenStep: 0, sirenTimer: 0,
  step: 0, stepTimer: 0, noiseBuf: null, started: false,

  unlock: function () {
    if (this.started) { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      // Engine: sawtooth through a lowpass, gain follows speed.
      this.engineOsc = this.ctx.createOscillator(); this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 55;
      this.engineFilter = this.ctx.createBiquadFilter(); this.engineFilter.type = 'lowpass'; this.engineFilter.frequency.value = 320;
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineFilter); this.engineFilter.connect(this.engineGain); this.engineGain.connect(this.master);
      this.engineOsc.start();
      // Siren: square wave, two-tone.
      this.sirenOsc = this.ctx.createOscillator(); this.sirenOsc.type = 'square';
      this.sirenOsc.frequency.value = 700;
      this.sirenGain = this.ctx.createGain(); this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain); this.sirenGain.connect(this.master);
      this.sirenOsc.start();
      this.started = true;
    } catch (err) { /* audio unavailable: game stays silent */ }
  },
  setEngine: function (speed01, driving) {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(driving ? 0.05 + speed01 * 0.10 : 0, t, 0.1);
    this.engineOsc.frequency.setTargetAtTime(50 + speed01 * 130, t, 0.1);
  },
  setSiren: function (on) {
    if (!this.started) return;
    this.sirenOn = on;
    this.sirenGain.gain.setTargetAtTime(on ? 0.045 : 0, this.ctx.currentTime, 0.2);
  },
  pluck: function (freq, when, dur, vol, type) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g); g.connect(this.master);
    o.start(when); o.stop(when + dur + 0.05);
  },
  noise: function (when, dur, vol, freq) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(when); s.stop(when + dur + 0.05);
  },
  update: function (dt) {
    if (!this.started) return;
    // Mute must silence everything, including the engine hum and siren,
    // which are driven from elsewhere — so ride the master gain.
    this.master.gain.setTargetAtTime(S.muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    if (S.muted) return;
    // Radio sequencer: pentatonic patterns, one per station.
    if (S.radioOn && S.mode === 'play') {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.24;
        const t = this.ctx.currentTime;
        const scales = [[220, 261.6, 293.7, 329.6, 392, 440], [196, 220, 246.9, 293.7, 329.6, 392]];
        const scale = scales[S.radio];
        const pat = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 4, 5, 2, 1, 2, 4];
        const note = pat[this.step % 16];
        if (this.step % 2 === 0) this.pluck(scale[note], t, 0.5, 0.10, 'triangle');
        if (this.step % 8 === 0) this.pluck(scale[0] / 2, t, 0.9, 0.12, 'sine');
        if (this.step % 16 === 8) this.pluck(scale[3], t, 0.4, 0.05, 'sine');
        this.step++;
        if (this.step % 128 === 0) { S.song = (S.song + 1) % 3; HUD.refreshRadio(); }
      }
    }
    if (this.sirenOn) {
      this.sirenTimer -= dt;
      if (this.sirenTimer <= 0) {
        this.sirenTimer = 0.4; this.sirenStep = 1 - this.sirenStep;
        this.sirenOsc.frequency.setTargetAtTime(this.sirenStep ? 660 : 880, this.ctx.currentTime, 0.05);
      }
    }
  },
  shot: function () { if (this.started) this.noise(this.ctx.currentTime, 0.14, 0.30, 2600); },
  hit: function () { if (this.started) this.pluck(140, this.ctx.currentTime, 0.12, 0.22, 'square'); },
  pickup: function () { if (this.started) { const t = this.ctx.currentTime; this.pluck(660, t, 0.12, 0.14); this.pluck(990, t + 0.08, 0.18, 0.14); } },
  pass: function () {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach(function (f, i) { AudioSys.pluck(f, t + i * 0.11, 0.3, 0.14); });
  },
  click: function () { if (this.started) this.pluck(880, this.ctx.currentTime, 0.06, 0.08); },
};
