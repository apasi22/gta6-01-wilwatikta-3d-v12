// Seeded random numbers: the whole city is generated from one seed so the
// world is identical on every load. Mulberry32 + small helpers.

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngRange(rng, lo, hi) { return lo + rng() * (hi - lo); }
// Inclusive on both ends: rngInt(rng, 0, 5) can return 5.
function rngInt(rng, lo, hi) { return Math.floor(rngRange(rng, lo, hi + 1)); }
function rngPick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function rngChance(rng, p) { return rng() < p; }

// Cheap value noise in 2D for ground tint variation.
function hashNoise(x, z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
