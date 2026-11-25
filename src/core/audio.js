// audio.js — every sound is synthesised with WebAudio (no audio files). audio.play('pop'), audio.music('farm').
let ac = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem('tt-muted') === '1'; } catch (e) {}

function ensure() {
  if (ac) return ac;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  ac = new AC();
  master = ac.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ac.destination);
  sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
  musicBus = ac.createGain(); musicBus.gain.value = 0.16; musicBus.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ac;
}
function tone(freq, dur, o = {}) {
  if (!ensure()) return;
  const t0 = ac.currentTime + (o.delay || 0), osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + dur);
  const v = o.vol ?? 0.3, a = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(o.bus || sfxBus); osc.start(t0); osc.stop(t0 + dur + 0.05);
}
function noise(dur, o = {}) {
  if (!ensure()) return;
  const t0 = ac.currentTime + (o.delay || 0), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; src.loop = true; f.type = o.filter || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1000, t0); f.Q.value = o.q ?? 1;
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  const v = o.vol ?? 0.25; g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + (o.attack ?? 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(o.bus || sfxBus); src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
}
const N = (semi) => 261.63 * Math.pow(2, semi / 12); // semitones from middle C

const sfx = {
  pop: () => tone(520, 0.12, { to: 900, vol: 0.3 }),
  click: () => tone(700, 0.05, { type: 'triangle', vol: 0.2 }),
  ding: () => { tone(N(16), 0.5, { vol: 0.25 }); tone(N(21), 0.6, { vol: 0.2, delay: 0.08 }); },
  coin: () => { tone(N(19), 0.08, { type: 'square', vol: 0.12 }); tone(N(24), 0.3, { type: 'square', vol: 0.12, delay: 0.07 }); },
  success: () => [0, 4, 7, 12].forEach((s, i) => tone(N(s + 7), 0.35, { type: 'triangle', vol: 0.25, delay: i * 0.09 })),
  fanfare: () => [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => tone(N(s + 5), i === 6 ? 0.9 : 0.22, { type: 'triangle', vol: 0.28, delay: i * 0.13 })),
  thanks: () => [12, 16, 19].forEach((s, i) => tone(N(s), 0.6, { vol: 0.2, delay: i * 0.06 })),
  whoosh: () => noise(0.7, { freq: 300, to: 3000, q: 0.8, vol: 0.35, attack: 0.25 }),
  whooshDown: () => noise(0.6, { freq: 2500, to: 250, q: 0.8, vol: 0.3, attack: 0.1 }),
  step: () => noise(0.07, { freq: 350 + Math.random() * 200, q: 0.7, vol: 0.07 }),
  dig: () => { noise(0.18, { freq: 500, to: 200, q: 1, vol: 0.3 }); tone(110, 0.1, { to: 60, vol: 0.2 }); },
  plant: () => { tone(300, 0.1, { to: 520, type: 'triangle', vol: 0.22 }); noise(0.08, { freq: 1800, vol: 0.08 }); },
  splash: () => { noise(0.45, { freq: 1800, to: 500, q: 0.6, vol: 0.3 }); tone(500, 0.15, { to: 200, vol: 0.1 }); },
  water: () => noise(0.6, { freq: 2600, q: 0.5, vol: 0.15, attack: 0.1 }),
  fizz: () => noise(1.0, { freq: 6000, q: 0.4, vol: 0.14, attack: 0.05 }),
  pour: () => { noise(0.9, { freq: 900, to: 1800, q: 2, vol: 0.18, attack: 0.1 }); },
  cork: () => { tone(200, 0.12, { to: 700, vol: 0.4 }); noise(0.05, { freq: 2000, vol: 0.3 }); },
  clink: () => { tone(2100, 0.5, { vol: 0.16 }); tone(3150, 0.4, { vol: 0.1 }); },
  thud: () => tone(120, 0.18, { to: 50, vol: 0.45 }),
  knock: () => { tone(180, 0.07, { to: 120, type: 'triangle', vol: 0.4 }); },
  hammer: () => { tone(900, 0.05, { type: 'square', vol: 0.12 }); noise(0.06, { freq: 3000, vol: 0.2 }); },
  saw: () => { for (let i = 0; i < 3; i++) noise(0.16, { freq: 1400 + (i % 2) * 500, q: 3, vol: 0.18, delay: i * 0.17 }); },
  snip: () => { noise(0.04, { freq: 4000, vol: 0.25 }); noise(0.04, { freq: 5000, vol: 0.2, delay: 0.07 }); },
  stitch: () => tone(1200 + Math.random() * 300, 0.06, { type: 'triangle', vol: 0.14 }),
  machine: () => { tone(90, 0.3, { type: 'sawtooth', vol: 0.1 }); noise(0.3, { freq: 500, vol: 0.08 }); },
  steam: () => noise(0.9, { freq: 4000, to: 1500, q: 0.5, vol: 0.2, attack: 0.05 }),
  fire: () => noise(0.5, { freq: 700, q: 0.4, vol: 0.12, attack: 0.1 }),
  engine: () => { tone(70, 0.5, { type: 'sawtooth', vol: 0.12 }); tone(105, 0.5, { type: 'square', vol: 0.04 }); },
  honk: () => { tone(330, 0.25, { type: 'square', vol: 0.12 }); tone(415, 0.25, { type: 'square', vol: 0.12 }); },
  beep: () => tone(1000, 0.09, { type: 'square', vol: 0.1 }),
  register: () => { tone(1400, 0.06, { type: 'square', vol: 0.08 }); tone(1800, 0.25, { vol: 0.2, delay: 0.08 }); tone(2400, 0.3, { vol: 0.15, delay: 0.12 }); },
  gobble: () => { for (let i = 0; i < 7; i++) tone(520 + (i % 2) * 180 - i * 20, 0.06, { type: 'sawtooth', vol: 0.12, delay: i * 0.055 }); },
  cluck: () => tone(700, 0.07, { to: 1100, type: 'square', vol: 0.08 }),
  peep: () => tone(2600, 0.08, { to: 3400, vol: 0.1 }),
  buzz: () => tone(210, 0.35, { type: 'sawtooth', vol: 0.07 }),
  moo: () => tone(140, 0.8, { to: 110, type: 'sawtooth', vol: 0.12, attack: 0.1 }),
  neigh: () => tone(900, 0.6, { to: 400, type: 'sawtooth', vol: 0.08 }),
  bird: () => { tone(2400, 0.1, { to: 3200, vol: 0.08 }); tone(2800, 0.12, { to: 2200, vol: 0.08, delay: 0.13 }); },
  wave: () => noise(1.6, { freq: 500, to: 1200, q: 0.3, vol: 0.16, attack: 0.7 }),
  wind: () => noise(1.8, { freq: 400, to: 800, q: 1.5, vol: 0.1, attack: 0.8 }),
  bubble: () => tone(400 + Math.random() * 500, 0.09, { to: 1300, vol: 0.12 }),
  boing: () => tone(200, 0.25, { to: 520, type: 'triangle', vol: 0.3 }),
  bounce: () => tone(320, 0.12, { to: 160, type: 'triangle', vol: 0.3 }),
  error: () => tone(200, 0.18, { type: 'square', vol: 0.1, to: 150 }),
  sparkle: () => [24, 28, 31, 36].forEach((s, i) => tone(N(s), 0.25, { vol: 0.08, delay: i * 0.05 })),
  pickup: () => { tone(N(12), 0.08, { type: 'triangle', vol: 0.2 }); tone(N(19), 0.14, { type: 'triangle', vol: 0.2, delay: 0.06 }); },
  drop: () => { tone(N(12), 0.08, { type: 'triangle', vol: 0.2 }); tone(N(5), 0.14, { type: 'triangle', vol: 0.2, delay: 0.06 }); },
  horn: () => { tone(150, 1.0, { type: 'sawtooth', vol: 0.14, attack: 0.1 }); tone(225, 1.0, { type: 'sawtooth', vol: 0.08, attack: 0.1 }); },
  bell: () => { tone(880, 1.2, { vol: 0.22 }); tone(1760, 0.8, { vol: 0.08 }); tone(2637, 0.5, { vol: 0.05 }); },
  kiln: () => noise(1.2, { freq: 250, q: 0.5, vol: 0.25, attack: 0.3 }),
};

// gibberish speech: a few pitched blips, like cartoon talking. pitch 0.6 (deep) .. 1.8 (child)
function babble(pitch = 1, n = 5) {
  if (!ensure()) return;
  for (let i = 0; i < n; i++) { const f = (160 + Math.random() * 110) * pitch; tone(f, 0.09, { type: 'triangle', to: f * (0.85 + Math.random() * 0.4), vol: 0.11, delay: i * 0.095 }); }
}
function laugh(pitch = 1) {
  if (!ensure()) return;
  const n = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) { const f = (330 - i * 16) * pitch; tone(f, 0.1, { type: 'triangle', to: f * 0.8, vol: 0.12, delay: i * 0.13 }); }
}

// ---- music: tiny generative loops ----
const songs = {
  table: { bpm: 84, chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], scale: [0, 2, 4, 7, 9, 12, 14, 16], wave: 'triangle', density: 0.5 },
  farm: { bpm: 112, chords: [[0, 4, 7], [5, 9, 12], [0, 4, 7], [7, 11, 14]], scale: [0, 2, 4, 7, 9, 12, 14], wave: 'triangle', density: 0.75 },
  factory: { bpm: 120, chords: [[2, 5, 9], [0, 4, 7], [-2, 2, 5], [0, 4, 7]], scale: [0, 2, 5, 7, 9, 12, 14], wave: 'square', density: 0.7 },
  old: { bpm: 76, chords: [[-3, 0, 4], [5, 9, 12], [0, 4, 7], [-5, -1, 2]], scale: [0, 2, 4, 7, 9, 12, 16], wave: 'sine', density: 0.45 },
  travel: { bpm: 100, chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], scale: [0, 2, 4, 7, 9, 12, 14, 16], wave: 'triangle', density: 0.65 },
  town: { bpm: 126, chords: [[5, 9, 12], [7, 11, 14], [4, 7, 11], [9, 12, 16]], scale: [0, 4, 5, 7, 9, 12, 16], wave: 'triangle', density: 0.7 },
  calm: { bpm: 66, chords: [[0, 7, 16], [5, 12, 21], [-3, 4, 12], [7, 14, 19]], scale: [0, 4, 7, 12, 16, 19], wave: 'sine', density: 0.35 },
};
let song = null, songName = null, timer = null, nextT = 0, beat = 0, lastNote = 3;
function schedule() {
  if (!song || !ac) return;
  const spb = 60 / song.bpm / 2; // eighth notes
  while (nextT < ac.currentTime + 0.25) {
    const bar = Math.floor(beat / 8) % song.chords.length, ch = song.chords[bar], b = beat % 8, d = nextT - ac.currentTime;
    if (b === 0) { tone(N(ch[0] - 24), spb * 6, { type: 'sine', vol: 0.5, bus: musicBus, delay: d, attack: 0.02 }); ch.forEach(n => tone(N(n - 12), spb * 7, { type: 'sine', vol: 0.16, bus: musicBus, delay: d, attack: 0.05 })); }
    if (b === 4) tone(N(ch[1] - 12), spb * 3, { type: 'sine', vol: 0.22, bus: musicBus, delay: d, attack: 0.02 });
    if (Math.random() < song.density && (b % 2 === 0 || Math.random() < 0.4)) {
      lastNote = Math.max(0, Math.min(song.scale.length - 1, lastNote + Math.floor(Math.random() * 5) - 2));
      let n = song.scale[lastNote]; if (b === 0) n = ch[Math.floor(Math.random() * 3)] % 12 + 12 * (n > 11 ? 1 : 0);
      tone(N(n + 12), spb * (Math.random() < 0.3 ? 3 : 1.6), { type: song.wave, vol: song.wave === 'square' ? 0.12 : 0.3, bus: musicBus, delay: d, attack: 0.01 });
    }
    nextT += spb; beat++;
  }
}

// when the page is hidden (another tab, a minimised window, a locked tablet) the sound pauses, and it carries on when the page comes back
let pausedByHiding = false;
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) { if (ac.state === 'running') { pausedByHiding = true; ac.suspend(); } }
  else if (pausedByHiding) { pausedByHiding = false; ac.resume(); }
});

export const audio = {
  /** call from a user gesture (click) to enable sound */
  unlock() { if (ensure() && ac.state === 'suspended') ac.resume(); },
  /** play a named sound effect — see the list in audio.js (pop, ding, success, whoosh, dig, plant, splash, engine, gobble …) */
  play(name) { if (muted) return; const f = sfx[name]; if (f) try { f(); } catch (e) {} },
  names: () => Object.keys(sfx),
  /** raw synth access for custom sounds: audio.tone(freq, seconds, {type, to, vol, delay}), audio.noise(seconds, {freq, to, q, vol}) */
  tone(f, d, o) { if (!muted) tone(f, d, o); }, noise(d, o) { if (!muted) noise(d, o); },
  babble(pitch, n) { if (!muted) babble(pitch, n); },
  laugh(pitch) { if (!muted) laugh(pitch); },
  /** background music: 'table' | 'farm' | 'factory' | 'old' | 'travel' | 'town' | 'calm' | null */
  music(name) {
    if (name === songName) return; songName = name; song = name ? songs[name] : null;
    if (timer) { clearInterval(timer); timer = null; }
    if (song && ensure()) { nextT = ac.currentTime + 0.1; beat = 0; timer = setInterval(schedule, 80); }
  },
  get muted() { return muted; },
  setMuted(m) { muted = m; try { localStorage.setItem('tt-muted', m ? '1' : '0'); } catch (e) {} if (master) master.gain.value = m ? 0 : 1; },
};
