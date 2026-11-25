// table.js — the home scene: a cosy dining room, the Thanksgiving table, the family, and the little
// glowing dots (hotspots) that start each adventure.
import { THREE, C, mat, glow, box, cyl, cone, sphere, ball, torus, lathe, group, bake, sign, picture, canvasTex, person, seeded, damp, clamp, lerp, lowDetail } from '../core/kit.js';
import { audio } from '../core/audio.js';
import { em } from '../core/hud.js';

const TOP = 0.815;           // height of the tablecloth surface
const TL = 4.3, TW = 1.65;   // table length (x) and width (z)

// ---------- food & tableware (each returns a Group sitting on y = 0) ----------
function turkey() {
  const g = new THREE.Group(), skin = 0xb9692b, skin2 = 0xcf8238;
  const pl = lathe([[0, 0], [0.46, 0.012], [0.6, 0.05], [0.62, 0.062]], 0xfaf6ee); pl.scale.set(0.82, 1, 1.2); g.add(pl);
  g.add(ball(0.32, 0.23, 0.4, skin, [0, 0.27, 0])); g.add(ball(0.25, 0.17, 0.3, skin2, [0, 0.35, 0.04]));
  for (const sx of [-1, 1]) {
    g.add(ball(0.12, 0.11, 0.17, skin, [sx * 0.27, 0.24, -0.25], [0.5, sx * 0.5, 0]));
    g.add(cyl(0.045, 0.09, 0.24, skin2, [sx * 0.37, 0.33, -0.38], [-0.9, 0, -sx * 0.6], 7));
    g.add(cyl(0.022, 0.022, 0.12, 0xfff4e0, [sx * 0.44, 0.42, -0.49], [-0.9, 0, -sx * 0.6], 5)); g.add(sphere(0.04, 0xffffff, [sx * 0.475, 0.455, -0.535], 6));
    g.add(ball(0.08, 0.07, 0.17, skin, [sx * 0.33, 0.22, 0.1], [0, sx * 0.3, 0]));
  }
  const r = seeded(4);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + r() * 0.2, rx = 0.43, rz = 0.66; const c = i % 4 === 0 ? 0xe98a2b : i % 4 === 2 ? 0xb0122e : 0x4f9d4a; g.add(i % 4 === 0 ? cyl(0.06, 0.06, 0.02, c, [Math.cos(a) * rx, 0.06, Math.sin(a) * rz], [0.3, a, 0], 8) : sphere(i % 4 === 2 ? 0.03 : 0.055, c, [Math.cos(a) * rx, 0.075, Math.sin(a) * rz], 6)); }
  return g;
}
function potatoes() {
  const g = new THREE.Group(); g.add(lathe([[0, 0], [0.12, 0.01], [0.24, 0.12], [0.27, 0.17]], 0xf3f6fb));
  g.add(ball(0.23, 0.1, 0.23, 0xfbf0c4, [0, 0.15, 0])); g.add(ball(0.13, 0.07, 0.13, 0xfdf6d8, [0.03, 0.21, 0.02])); g.add(box(0.07, 0.025, 0.07, 0xffd84a, [0.02, 0.275, 0.0], [0, 0.5, 0.1]));
  g.add(cyl(0.012, 0.012, 0.3, C.metal, [0.17, 0.24, -0.1], [0.5, 0, -0.9], 5));
  return g;
}
function gravy() { const g = new THREE.Group(); g.add(lathe([[0, 0], [0.06, 0.005], [0.05, 0.02], [0.1, 0.07], [0.11, 0.12]], 0xf3f6fb)); g.children[0].scale.set(1.5, 1, 1); g.add(ball(0.14, 0.02, 0.09, 0x8a5a2b, [0, 0.1, 0])); g.add(torus(0.04, 0.012, 0xf3f6fb, [-0.2, 0.08, 0], [0, 0, 0], 8)); return g; }
function cranberry() {
  const g = new THREE.Group(), red = 0xa3122c; g.add(lathe([[0, 0], [0.15, 0.008], [0.19, 0.03]], 0xeaf4f7));
  g.add(cyl(0.075, 0.075, 0.17, red, [-0.02, 0.1, 0], [0, 0.4, Math.PI / 2], 14));
  for (let i = 0; i < 4; i++) g.add(torus(0.076, 0.006, 0x8a0f25, [-0.02 + Math.sin(0.4 + Math.PI / 2) * 0 + (i - 1.5) * 0.04 * Math.cos(0.4), 0.1, -(i - 1.5) * 0.04 * Math.sin(0.4)], [0, 0.4 + Math.PI / 2, 0], 12));
  g.add(cyl(0.075, 0.075, 0.018, red, [0.1, 0.04, 0.07], [0.25, 0, 0], 14)); g.add(cyl(0.075, 0.075, 0.018, red, [0.07, 0.05, -0.06], [-0.3, 0.4, 0.2], 14));
  return g;
}
function pie() {
  const g = new THREE.Group(); g.add(lathe([[0, 0], [0.17, 0.005], [0.22, 0.05]], 0xb9c0c6));
  g.add(cyl(0.2, 0.17, 0.04, 0xd9822b, [0, 0.045, 0], null, 16)); g.add(torus(0.205, 0.022, 0xe0b070, [0, 0.06, 0], [Math.PI / 2, 0, 0], 16));
  g.add(sphere(0.05, 0xffffff, [0, 0.09, 0], 7)); g.add(sphere(0.03, 0xffffff, [0, 0.13, 0], 6));
  return g;
}
function rolls() { const g = new THREE.Group(); g.add(lathe([[0, 0], [0.14, 0.01], [0.2, 0.1]], 0xa8743f)); g.add(torus(0.2, 0.015, 0x8a5a2b, [0, 0.1, 0], [Math.PI / 2, 0, 0], 12)); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; g.add(ball(0.075, 0.06, 0.075, 0xe2a860, [Math.cos(a) * 0.09, 0.12, Math.sin(a) * 0.09])); } g.add(ball(0.075, 0.06, 0.075, 0xe9b873, [0, 0.17, 0])); return g; }
function greenBeans() { const g = new THREE.Group(), r = seeded(9); g.add(box(0.42, 0.07, 0.28, 0xf3f6fb, [0, 0.035, 0])); g.add(box(0.38, 0.03, 0.24, 0x3f8a3a, [0, 0.075, 0])); for (let i = 0; i < 14; i++) g.add(box(0.12, 0.015, 0.018, i % 3 ? 0x4f9d4a : 0x6bb85a, [(r() - 0.5) * 0.24, 0.095, (r() - 0.5) * 0.18], [0, r() * 3, 0])); for (let i = 0; i < 8; i++) g.add(sphere(0.015, 0xd9a441, [(r() - 0.5) * 0.3, 0.1, (r() - 0.5) * 0.2], 5)); return g; }
function corn() { const g = new THREE.Group(); g.add(lathe([[0, 0], [0.15, 0.008], [0.19, 0.025]], 0xf3f6fb)); g.children[0].scale.set(1.3, 1, 1); for (let i = 0; i < 3; i++) g.add(cyl(0.035, 0.03, 0.24, 0xf2c43d, [0, 0.05 + (i === 2 ? 0.05 : 0), (i - 1) * 0.08 * (i === 2 ? 0 : 1)], [0, 0, Math.PI / 2], 8)); return g; }
function stuffing() { const g = new THREE.Group(), r = seeded(3); g.add(lathe([[0, 0], [0.1, 0.01], [0.19, 0.1], [0.2, 0.13]], 0xc9d9e8)); g.add(ball(0.17, 0.07, 0.17, 0xb98a4a, [0, 0.12, 0])); for (let i = 0; i < 10; i++) g.add(box(0.04, 0.03, 0.04, i % 3 ? 0xd2a567 : 0x6bb85a, [(r() - 0.5) * 0.22, 0.17, (r() - 0.5) * 0.22], [r(), r(), r()])); return g; }
function candle() { const g = new THREE.Group(); g.add(cyl(0.05, 0.07, 0.03, C.gold, [0, 0.015, 0])); g.add(cyl(0.018, 0.018, 0.1, C.gold, [0, 0.07, 0], null, 6)); g.add(cyl(0.022, 0.022, 0.24, 0xfff4e0, [0, 0.24, 0], null, 8)); return g; }
function pumpkin(s = 1, c = 0xe98a2b) { const g = new THREE.Group(); if (lowDetail()) { g.add(ball(0.115 * s, 0.085 * s, 0.115 * s, c, [0, 0.085 * s, 0], null, 8)); g.add(cyl(0.012 * s, 0.018 * s, 0.05 * s, 0x5e7a3a, [0, 0.18 * s, 0], [0.2, 0, 0], 5)); return g; } for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(ball(0.07 * s, 0.085 * s, 0.07 * s, c, [Math.cos(a) * 0.045 * s, 0.085 * s, Math.sin(a) * 0.045 * s])); } g.add(cyl(0.012 * s, 0.018 * s, 0.05 * s, 0x5e7a3a, [0, 0.18 * s, 0], [0.2, 0, 0], 5)); return g; }
function bottle() { const g = new THREE.Group(); g.add(lathe([[0, 0], [0.045, 0], [0.047, 0.17], [0.02, 0.27], [0.018, 0.36], [0, 0.36]], 0x2f5a3a)); g.add(cyl(0.021, 0.022, 0.08, C.gold, [0, 0.33, 0], null, 8)); g.add(cyl(0.0485, 0.0485, 0.09, 0xf6ecd6, [0, 0.1, 0], null, 12)); g.add(cyl(0.049, 0.049, 0.03, 0x7b4fb0, [0, 0.1, 0], null, 12)); return g; }
function glass() { const g = new THREE.Group(); g.add(lathe([[0, 0], [0.035, 0.004], [0.006, 0.015], [0.006, 0.085], [0.034, 0.12], [0.036, 0.2]], 0xe6f3f8)); g.add(cyl(0.031, 0.02, 0.055, 0x7a3fa0, [0, 0.15, 0], null, 8)); return g; }
function setting(rim = 0x3b6ea8) {
  const g = new THREE.Group(); g.add(lathe([[0, 0], [0.085, 0.004], [0.125, 0.02], [0.13, 0.022]], 0xfbfbf8));
  if (lowDetail()) { const rg2 = new THREE.Mesh(new THREE.RingGeometry(0.108, 0.122, 10), mat(rim)); rg2.rotation.x = -Math.PI / 2; rg2.position.y = 0.0215; g.add(rg2); }
  else { g.add(torus(0.118, 0.005, rim, [0, 0.021, 0], [Math.PI / 2, 0, 0], 18)); g.add(torus(0.085, 0.003, C.gold, [0, 0.008, 0], [Math.PI / 2, 0, 0], 14)); }
  g.add(box(0.018, 0.006, 0.17, C.metal, [-0.17, 0.004, 0])); g.add(box(0.018, 0.006, 0.17, C.metal, [0.17, 0.004, 0])); g.add(box(0.012, 0.006, 0.15, C.metal, [0.2, 0.004, 0]));
  g.add(box(0.1, 0.012, 0.14, 0xd9622b, [-0.26, 0.006, 0], [0, 0.15, 0]));
  const gl = glass(); gl.position.set(0.17, 0, -0.17); g.add(gl);
  return g;
}
function chair(c = 0x8a5a33) { const g = new THREE.Group(); g.add(box(0.48, 0.05, 0.46, c, [0, 0.47, 0])); for (const sx of [-1, 1]) { g.add(box(0.05, 0.47, 0.05, c, [sx * 0.2, 0.235, 0.19])); g.add(box(0.05, 1.08, 0.05, c, [sx * 0.2, 0.54, -0.2])); } for (let i = 0; i < 3; i++) g.add(box(0.36, 0.08, 0.03, c, [0, 0.66 + i * 0.16, -0.2])); g.add(box(0.42, 0.03, 0.4, 0xb5382c, [0, 0.505, 0.01])); return g; }

// embroidered linen textures
function clothSideTex() { return canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h);
  // hemstitch openwork band + scalloped hem
  g.fillStyle = '#e4dccb'; for (let x = 6; x < w; x += 16) g.fillRect(x, h - 44, 6, 12);
  g.strokeStyle = '#d9cfba'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h - 48); g.lineTo(w, h - 48); g.moveTo(0, h - 28); g.lineTo(w, h - 28); g.stroke();
  for (let x = 0; x < w; x += 32) { g.beginPath(); g.arc(x + 16, h - 6, 14, Math.PI, 0); g.strokeStyle = '#cfc3a8'; g.stroke(); }
  // vine with satin-stitch flowers and french knots
  g.strokeStyle = '#7fa37a'; g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = h - 110 + Math.sin(x / w * Math.PI * 4) * 22; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  for (let i = 0; i < 4; i++) { const x = (i + 0.25) * w / 4 + 0, y = h - 110 + Math.sin((x) / w * Math.PI * 4) * 22 - 4; const col = i % 2 ? '#7fa8d6' : '#e8a3b5';
    for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2; g.fillStyle = col; g.beginPath(); g.ellipse(x + Math.cos(a) * 17, y + Math.sin(a) * 17, 12, 7, a, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#e8c04a'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8fb58a'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 44, y + 16 * s, 15, 6, s * 0.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#e8c04a'; for (const d of [[64, -34], [-60, 30], [80, 10]]) { g.beginPath(); g.arc(x + d[0], y + d[1], 3.5, 0, Math.PI * 2); g.fill(); } }
}); }
function clothTopTex() { return canvasTex(1024, 400, (g, w, h) => {
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#8fb58a'; g.lineWidth = 5; g.setLineDash([14, 8]); g.strokeRect(34, 34, w - 68, h - 68); g.setLineDash([]);
  g.strokeStyle = '#e4dccb'; g.lineWidth = 3; g.strokeRect(18, 18, w - 36, h - 36);
  const flower = (x, y, s, col) => { for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2; g.fillStyle = col; g.beginPath(); g.ellipse(x + Math.cos(a) * 13 * s, y + Math.sin(a) * 13 * s, 9 * s, 5.5 * s, a, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#e8c04a'; g.beginPath(); g.arc(x, y, 5.5 * s, 0, Math.PI * 2); g.fill(); };
  for (const [x, y] of [[70, 70], [w - 70, 70], [70, h - 70], [w - 70, h - 70]]) { flower(x, y, 1.5, '#7fa8d6'); g.fillStyle = '#8fb58a'; for (const [dx, dy, a] of [[46, 6, 0.2], [6, 46, 1.4]]) { g.beginPath(); g.ellipse(x + (x < w / 2 ? dx : -dx), y + (y < h / 2 ? dy : -dy), 16, 6, a * (x < w / 2 ? 1 : -1) * (y < h / 2 ? 1 : -1), 0, Math.PI * 2); g.fill(); } }
  for (let i = 1; i < 8; i++) { flower(i * w / 8, 36, 0.8, i % 2 ? '#e8a3b5' : '#7fa8d6'); flower(i * w / 8, h - 36, 0.8, i % 2 ? '#7fa8d6' : '#e8a3b5'); }
  for (let i = 1; i < 3; i++) { flower(36, i * h / 3, 0.8, '#e8a3b5'); flower(w - 36, i * h / 3, 0.8, '#e8a3b5'); }
}); }

export function createTable(game) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xcdb489);
  const camera = new THREE.PerspectiveCamera(42, game.aspect, 0.1, 60);
  const hemi = new THREE.HemisphereLight(0xfff0dc, 0x8a6a4a, 1.65); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2b8, 1.9); sun.position.set(3.5, 8, 4.5); scene.add(sun);
  if (game.quality.shadows) { sun.castShadow = true; const s = sun.shadow; s.mapSize.set(2048, 2048); s.camera.left = -7; s.camera.right = 7; s.camera.top = 7; s.camera.bottom = -7; s.camera.near = 1; s.camera.far = 25; s.bias = -0.0005; s.normalBias = 0.03; }

  // ================= the room =================
  const RX = 7, RZ = 6, RH = 3.3, room = new THREE.Group();
  const wall = (w, hgt, color, pos, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), mat(color)); m.position.set(pos[0], pos[1], pos[2]); m.rotation.y = ry; m.receiveShadow = true; return m; };
  const wallC = 0xe8d2a6, wain = 0x8a5e3c;
  room.add(wall(RX * 2, RH, wallC, [0, RH / 2, -RZ], 0)); room.add(wall(RX * 2, RH, wallC, [0, RH / 2, RZ], Math.PI)); room.add(wall(RZ * 2, RH, 0xe2caa0, [-RX, RH / 2, 0], Math.PI / 2)); room.add(wall(RZ * 2, RH, 0xe2caa0, [RX, RH / 2, 0], -Math.PI / 2));
  // wainscot + rail
  room.add(wall(RX * 2, 1.0, wain, [0, 0.5, -RZ + 0.01], 0)); room.add(wall(RX * 2, 1.0, wain, [0, 0.5, RZ - 0.01], Math.PI)); room.add(wall(RZ * 2, 1.0, wain, [-RX + 0.01, 0.5, 0], Math.PI / 2)); room.add(wall(RZ * 2, 1.0, wain, [RX - 0.01, 0.5, 0], -Math.PI / 2));
  room.add(box(RX * 2, 0.08, 0.08, 0x6e4a28, [0, 1.02, -RZ + 0.04])); room.add(box(0.08, 0.08, RZ * 2, 0x6e4a28, [-RX + 0.04, 1.02, 0]));
  // rug
  room.add(box(6.6, 0.02, 4.2, 0x9c3b2e, [0, 0.012, 0])); room.add(box(6.2, 0.022, 3.8, 0xc9743f, [0, 0.014, 0])); room.add(box(5.8, 0.024, 3.4, 0x9c3b2e, [0, 0.016, 0]));
  // fireplace (back wall, left)
  const fp = new THREE.Group(); fp.position.set(-3.6, 0, -RZ + 0.35);
  fp.add(box(2.6, 1.7, 0.7, C.brick, [0, 0.85, 0])); fp.add(box(1.3, 1.0, 0.5, 0x2a1a14, [0, 0.5, 0.14])); fp.add(box(3.0, 0.14, 0.95, 0x6e4a28, [0, 1.77, 0.05])); fp.add(box(1.8, 1.55, 0.5, C.brick, [0, 2.6, -0.1]));
  fp.add(box(2.8, 0.1, 1.1, 0x77716a, [0, 0.05, 0.2]));
  for (let i = 0; i < 3; i++) fp.add(cyl(0.08, 0.08, 0.9, 0x5a3a22, [0, 0.2 + (i === 2 ? 0.13 : 0), 0.5 + (i - 1) * 0.12 * (i === 2 ? 0 : 1)], [0, 0, Math.PI / 2], 7));
  for (let i = 0; i < 3; i++) { const p = pumpkin(i === 1 ? 1.7 : 1.2, i === 2 ? 0xf2c43d : 0xe98a2b); p.position.set(-1.0 + i * 0.32, 1.84, 0.12); fp.add(p); }
  fp.add(box(0.5, 0.62, 0.05, 0x6e4a28, [0.75, 2.18, 0.32])); fp.add(box(0.4, 0.52, 0.06, 0xf6ecd6, [0.75, 2.18, 0.33]));
  room.add(fp);
  for (let i = 0; i < 3; i++) { const p = pumpkin(2.4 + i * 0.9, [0xe98a2b, 0xd9622b, 0xf2c43d][i]); p.position.set(-5.6 + i * 0.55, 0, -RZ + 0.9 + (i % 2) * 0.4); room.add(p); }
  // window (back wall, right) — frame + curtains (the view itself is a picture, added below)
  const wx = 2.6; for (const sy of [-1, 1]) room.add(box(3.0, 0.1, 0.12, 0xf6ecd6, [wx, 2.0 + sy * 0.95, -RZ + 0.06])); for (const sx of [-1, 1]) room.add(box(0.1, 2.0, 0.12, 0xf6ecd6, [wx + sx * 1.45, 2.0, -RZ + 0.06])); room.add(box(0.08, 1.8, 0.13, 0xf6ecd6, [wx, 2.0, -RZ + 0.06])); room.add(box(2.8, 0.08, 0.13, 0xf6ecd6, [wx, 2.0, -RZ + 0.06])); room.add(box(3.3, 0.1, 0.3, 0xf6ecd6, [wx, 0.98, -RZ + 0.12]));
  for (const sx of [-1, 1]) { room.add(box(0.55, 2.4, 0.1, 0xb5382c, [wx + sx * 1.72, 2.0, -RZ + 0.14])); room.add(box(0.62, 0.14, 0.14, C.gold, [wx + sx * 1.72, 1.5, -RZ + 0.15])); }
  room.add(cyl(0.03, 0.03, 4.2, 0x6e4a28, [wx, 3.2, -RZ + 0.14], [0, 0, Math.PI / 2], 6));
  // sideboard (left wall) with extra dishes
  const sb = new THREE.Group(); sb.position.set(-RX + 0.45, 0, 1.6); sb.add(box(0.7, 0.95, 2.8, 0x7a4f2d, [0, 0.475, 0])); sb.add(box(0.8, 0.06, 2.95, 0x5a3a22, [0, 0.98, 0])); for (let i = 0; i < 3; i++) { sb.add(box(0.03, 0.6, 0.8, 0x8a5e3c, [0.36, 0.5, -0.92 + i * 0.92])); sb.add(sphere(0.035, C.gold, [0.39, 0.55, -0.7 + i * 0.92], 5)); }
  const p2 = pie(); p2.position.set(0, 1.01, -0.8); sb.add(p2); const st2 = group([lathe([[0, 0], [0.13, 0.005], [0.13, 0.3], [0.1, 0.34]], 0xc9d9e8)], [0, 1.01, 0.1]); sb.add(st2);
  for (let i = 0; i < 4; i++) sb.add(cyl(0.13, 0.13, 0.012, 0xfbfbf8, [0.02, 1.02 + i * 0.014, 0.9], null, 14));
  room.add(sb);
  // door (right wall) + coat rack, potted plant
  room.add(box(0.06, 2.2, 1.1, 0x7a4f2d, [RX - 0.04, 1.1, -2.8])); room.add(sphere(0.05, C.gold, [RX - 0.1, 1.05, -2.4], 6));
  const plant = new THREE.Group(); plant.add(cyl(0.22, 0.16, 0.4, 0xc9743f, [0, 0.2, 0])); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; plant.add(ball(0.08, 0.4, 0.14, 0x4f9d4a, [Math.cos(a) * 0.16, 0.72, Math.sin(a) * 0.16], [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5])); } plant.position.set(RX - 0.7, 0, 4.9); room.add(plant);
  // chandelier
  // ceiling (seen only from below) and things on the front (+Z) wall — all flat, the camera can be close to that wall
  { const c = new THREE.Mesh(new THREE.PlaneGeometry(RX * 2, RZ * 2), mat(0xf3e6cc)); c.rotation.x = Math.PI / 2; c.position.y = RH; room.add(c); }
  room.add(box(RX * 2, 0.16, 0.06, 0xf6ecd6, [0, RH - 0.08, -RZ + 0.03])); room.add(box(RX * 2, 0.16, 0.06, 0xf6ecd6, [0, RH - 0.08, RZ - 0.03])); room.add(box(0.06, 0.16, RZ * 2, 0xf6ecd6, [-RX + 0.03, RH - 0.08, 0])); room.add(box(0.06, 0.16, RZ * 2, 0xf6ecd6, [RX - 0.03, RH - 0.08, 0]));
  for (let i = 0; i < 13; i++) { const x = -5.4 + i * 0.9; const fl = new THREE.Mesh(new THREE.CircleGeometry(0.26, 3), mat([0xd9622b, 0xe9a23b, 0xc23b22, 0xe0c040, 0x6b7a3a][i % 5])); fl.position.set(x, 2.78 - Math.abs(Math.sin(i / 12 * Math.PI * 3)) * 0.2, RZ - 0.04); fl.rotation.set(0, Math.PI, Math.PI / 2 * 3); room.add(fl); }
  // framed pictures, wall lamps, a grandfather clock
  const frame = (w, hh, col, pos, ry) => { const f = group([box(w + 0.12, hh + 0.12, 0.04, 0x5a3a22, [0, 0, 0]), box(w, hh, 0.05, col, [0, 0, 0.005]), box(w * 0.5, hh * 0.35, 0.055, 0xfff4dc, [0, -hh * 0.1, 0.006])], pos, [0, ry, 0]); room.add(f); };
  frame(0.7, 0.9, 0x7fa8d6, [-RX + 0.03, 2.2, -2.6], Math.PI / 2); frame(1.1, 0.7, 0x8fb58a, [-RX + 0.03, 2.3, -0.9], Math.PI / 2); frame(0.6, 0.6, 0xe8a3b5, [-RX + 0.03, 2.1, 3.9], Math.PI / 2);
  frame(1.5, 1.0, 0xd9a86a, [-3.2, 2.0, RZ - 0.03], Math.PI); frame(0.8, 1.0, 0x8fb58a, [-1.2, 2.1, RZ - 0.03], Math.PI); frame(0.8, 0.8, 0x7fa8d6, [0.4, 2.2, RZ - 0.03], Math.PI); frame(1.3, 0.9, 0xe8a3b5, [2.6, 2.05, RZ - 0.03], Math.PI); frame(0.7, 0.9, 0xe9a23b, [4.6, 2.2, RZ - 0.03], Math.PI);
  frame(0.9, 0.7, 0xe9a23b, [-0.6, 2.3, -RZ + 0.03], 0); frame(0.6, 0.8, 0x7b9fd0, [0.45, 2.15, -RZ + 0.03], 0); frame(0.8, 0.6, 0xd98a6a, [5.6, 2.3, -RZ + 0.03], 0);
  for (const [x, z, ry] of [[-1.6, -RZ + 0.1, 0], [5.0, -RZ + 0.1, 0], [-RX + 0.1, 0.2, Math.PI / 2]]) { const l = group([box(0.1, 0.22, 0.1, C.gold, [0, 0, 0]), sphere(0.12, glow(0xfff0b8), [0, 0.2, 0.06], 7)], [x, 2.35, z], [0, ry, 0]); room.add(l); }
  const clock = group([box(0.6, 2.1, 0.4, 0x5a3a22, [0, 1.05, 0]), box(0.7, 0.12, 0.46, 0x4a2c17, [0, 2.15, 0]), cyl(0.2, 0.2, 0.03, 0xfff4dc, [0, 1.7, 0.21], [Math.PI / 2, 0, 0], 14), box(0.02, 0.15, 0.02, 0x222222, [0, 1.76, 0.23]), box(0.1, 0.02, 0.02, 0x222222, [0.04, 1.7, 0.23]), box(0.3, 0.8, 0.02, 0x3a2418, [0, 0.85, 0.205]), sphere(0.07, C.gold, [0, 0.62, 0.22], 7)], [RX - 0.35, 0, 1.2], [0, -Math.PI / 2, 0]); room.add(clock);
  // leaf garland along the back wall
  const rg = seeded(12); for (let i = 0; i < 34; i++) { const x = -6.2 + i * 0.37, y = 3.02 - Math.abs(Math.sin(i / 34 * Math.PI * 5)) * 0.28; const lf = new THREE.Mesh(new THREE.CircleGeometry(0.11, 5), mat(C.autumn[Math.floor(rg() * 4)])); lf.position.set(x, y, -RZ + 0.05); lf.rotation.z = rg() * 3; lf.scale.y = 0.6; room.add(lf); }
  // a sleepy dog by the fire
  const dog = new THREE.Group(); dog.position.set(-3.4, 0, -3.9); dog.rotation.y = 0.5; const dc = 0xc98d4e;
  dog.add(ball(0.42, 0.2, 0.24, dc, [0, 0.2, 0])); dog.add(ball(0.17, 0.15, 0.16, dc, [0.45, 0.2, 0.08])); dog.add(ball(0.1, 0.07, 0.08, 0xa8743f, [0.6, 0.16, 0.1])); dog.add(sphere(0.03, 0x222222, [0.68, 0.17, 0.11], 5)); dog.add(ball(0.05, 0.1, 0.03, 0x8a5a2b, [0.4, 0.24, 0.22], [0.5, 0, 0])); dog.add(ball(0.05, 0.1, 0.03, 0x8a5a2b, [0.42, 0.26, -0.06], [-0.5, 0, 0]));
  dog.add(ball(0.12, 0.05, 0.06, dc, [0.3, 0.06, 0.22])); dog.add(ball(0.12, 0.05, 0.06, dc, [0.32, 0.06, -0.1]));
  room.add(dog);
  const tail = group([ball(0.16, 0.035, 0.035, dc, [-0.16, 0, 0])], [-3.4 - 0.38 * Math.cos(0.5), 0.24, -3.9 + 0.38 * Math.sin(0.5)]); bake(tail); scene.add(tail);

  // ================= table, chairs, everything on it =================
  const woodC = 0x7a4a28;
  room.add(box(TL - 0.25, 0.07, TW - 0.2, woodC, [0, 0.745, 0]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { room.add(box(0.13, 0.72, 0.13, woodC, [sx * (TL / 2 - 0.32), 0.36, sz * (TW / 2 - 0.27)])); room.add(box(0.17, 0.08, 0.17, 0x5a3a22, [sx * (TL / 2 - 0.32), 0.04, sz * (TW / 2 - 0.27)])); }
  room.add(box(TL - 0.6, 0.12, 0.05, woodC, [0, 0.66, TW / 2 - 0.27])); room.add(box(TL - 0.6, 0.12, 0.05, woodC, [0, 0.66, -TW / 2 + 0.27]));
  const seats = [
    { x: -1.25, z: -1.32, ry: 0 }, { x: 0, z: -1.32, ry: 0 }, { x: 1.25, z: -1.32, ry: 0 },
    { x: -1.25, z: 1.32, ry: Math.PI }, { x: 0, z: 1.32, ry: Math.PI }, { x: 1.25, z: 1.32, ry: Math.PI },
    { x: -2.62, z: 0, ry: Math.PI / 2 }, { x: 2.62, z: 0, ry: -Math.PI / 2 },
  ];
  const onTable = (obj, x, z, ry = 0) => { obj.position.set(x, TOP, z); obj.rotation.y = ry; room.add(obj); return obj; };
  const rims = [0x3b6ea8, 0x3b6ea8, 0x3b6ea8, 0x3b6ea8, 0x3b6ea8, 0x3b6ea8, 0x3b6ea8, 0x3b6ea8];
  seats.forEach((s, i) => { const c = chair(); c.position.set(s.x, 0, s.z); c.rotation.y = s.ry; room.add(c); const f = new THREE.Vector3(Math.sin(s.ry), 0, Math.cos(s.ry)); const off = i < 6 ? 0.64 : 0.78; onTable(setting(rims[i]), s.x + f.x * off, s.z + f.z * off, s.ry + Math.PI); });
  const tk = onTable(turkey(), 0, 0, Math.PI / 2);
  const pot = onTable(potatoes(), -1.04, 0.06); onTable(gravy(), -0.62, -0.22, 0.4);
  const cran = onTable(cranberry(), 0.74, -0.16, 0.3); const rl = onTable(rolls(), 1.08, 0.2);
  onTable(greenBeans(), -1.62, -0.12, 0.1); onTable(corn(), 1.3, -0.2, 0.2); onTable(stuffing(), -1.56, 0.22);
  const pi = onTable(pie(), 1.66, 0.12);
  const bot = onTable(bottle(), 0.62, 0.24); onTable(bottle(), -0.66, 0.26, 1);
  const candles = [onTable(candle(), -0.55, -0.02), onTable(candle(), 0.56, -0.0)];
  for (const [x, z, s, c] of [[-0.78, 0.0, 0.9, 0xe98a2b], [0.8, 0.06, 0.75, 0xf2c43d], [-0.4, 0.36, 0.6, 0xd9622b]]) onTable(pumpkin(s, c), x, z);
  for (let i = 0; i < 10; i++) { const lf = new THREE.Mesh(new THREE.CircleGeometry(0.05, 5), mat(C.autumn[i % 4])); lf.rotation.x = -Math.PI / 2; lf.scale.y = 0.6; const h = new THREE.Group(); h.add(lf); onTable(h, -0.9 + rg() * 1.8, -0.45 + rg() * 0.9, rg() * 6); h.position.y += 0.004; }
  bake(room); scene.add(room);

  // floor (wood planks), window view, cloth, framed pictures, banner — textured things (1 draw each)
  const floorTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#a8703f'; g.fillRect(0, 0, w, h); const r = seeded(5); for (let y = 0; y < 8; y++) { for (let x = 0; x < 3; x++) { const sh = 150 + Math.floor(r() * 30); g.fillStyle = 'rgb(' + sh + ',' + Math.floor(sh * 0.66) + ',' + Math.floor(sh * 0.38) + ')'; const off = (y % 2) * 85; g.fillRect(x * 171 + off - 171, y * 64 + 1, 169, 62); g.fillRect(x * 171 + off, y * 64 + 1, 169, 62); } } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(5, 5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RX * 2, RZ * 2), new THREE.MeshLambertMaterial({ map: floorTex })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  scene.add(picture(2.8, 1.8, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#40509a'); gr.addColorStop(0.55, '#ff9d5c'); gr.addColorStop(0.75, '#ffd08a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(w * 0.68, h * 0.66, 16, 0, 7); g.fill(); g.fillStyle = '#7a8a4a'; g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * 0.3, h * 0.62, w * 0.6, h * 0.8); g.quadraticCurveTo(w * 0.8, h * 0.7, w, h * 0.78); g.lineTo(w, h); g.fill(); const r = seeded(2); for (let i = 0; i < 7; i++) { const x = 14 + i * 36 + r() * 10, y = h * (0.72 + r() * 0.12); g.fillStyle = '#5a3a22'; g.fillRect(x - 2, y, 4, 26); g.fillStyle = ['#d9622b', '#e9a23b', '#c23b22', '#e0c040'][i % 4]; g.beginPath(); g.arc(x, y - 4, 15, 0, 7); g.fill(); } }, 256, [wx, 2.0, -RZ + 0.02]));
  const famPic = picture(0.38, 0.5, (g, w, h) => { g.fillStyle = '#cfe3ea'; g.fillRect(0, 0, w, h); const cols = ['#d9483b', '#3f7fd1', '#7b4fb0', '#4f9d4a']; for (let i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.fillRect(12 + i * 28, h * 0.55, 22, h * 0.5); g.fillStyle = ['#f2c9a0', '#c68650', '#ffdcb8', '#e0a878'][i]; g.beginPath(); g.arc(23 + i * 28, h * 0.45, 12, 0, 7); g.fill(); } }, 128, [-3.6 + 0.75, 2.18, -RZ + 0.72]); scene.add(famPic);
  const banner = sign('🍂 Give Thanks 🍂', 0.42, { bg: '#fff4dc', fg: '#8a3b1e', border: '#d9822b' }, [-3.6, 3.02, -RZ + 0.2]); banner.material.side = THREE.FrontSide; scene.add(banner);
  // tablecloth: top + hanging sides with an embroidered border
  const sideTex = clothSideTex(); sideTex.wrapS = THREE.RepeatWrapping;
  { const L = TL, Wd = TW, drop = 0.3, y1 = TOP - 0.008, y0 = y1 - drop, pos = [], uv = [], rep = 0.62;
    const quad = (ax, az, bx, bz) => { const len = Math.hypot(bx - ax, bz - az) / rep; pos.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az); uv.push(0, 0, len, 0, len, 1, 0, 0, len, 1, 0, 1); };
    quad(-L / 2, Wd / 2, L / 2, Wd / 2); quad(L / 2, Wd / 2, L / 2, -Wd / 2); quad(L / 2, -Wd / 2, -L / 2, -Wd / 2); quad(-L / 2, -Wd / 2, -L / 2, Wd / 2);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: sideTex, side: THREE.DoubleSide })); m.receiveShadow = true; scene.add(m);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(L, Wd), new THREE.MeshLambertMaterial({ map: clothTopTex() })); top.rotation.x = -Math.PI / 2; top.position.y = y1; top.receiveShadow = true; scene.add(top); }
  // candle flames + fire (one mesh each, flickering)
  const flames = new THREE.Group(); for (const c of candles) { flames.add(cone(0.022, 0.07, glow(0xffc23d), [c.position.x, TOP + 0.4, c.position.z], null, 6)); flames.add(sphere(0.012, glow(0xfff6c8), [c.position.x, TOP + 0.385, c.position.z], 5)); } bake(flames); scene.add(flames);
  const fire = new THREE.Group(); for (let i = 0; i < 5; i++) fire.add(cone(0.13 - Math.abs(i - 2) * 0.025, 0.5 - Math.abs(i - 2) * 0.1, glow(i % 2 ? 0xffb02e : 0xff7a1a), [(i - 2) * 0.16, 0.25 - Math.abs(i - 2) * 0.05, 0], null, 6)); for (let i = 0; i < 3; i++) fire.add(cone(0.06, 0.22, glow(0xffe27a), [(i - 1) * 0.2, 0.12, 0.05], null, 5)); bake(fire); fire.position.set(-3.6, 0.3, -RZ + 0.86); scene.add(fire);
  // steam above the turkey
  const steamTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const steam = []; for (let i = 0; i < 3; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0.5 })); s.userData.o = i / 3; scene.add(s); steam.push(s); }

  // ================= the family =================
  const fam = [
    { name: 'Mom', seat: 0, pitch: 1.25, o: { skin: C.skin[0], hair: 0x6b3f22, hairStyle: 'long', shirt: 0xa8443a, pants: 0x4a4a55 } },
    { name: 'Lily', seat: 1, pitch: 1.75, o: { skin: C.skin[0], hair: 0xd9a441, hairStyle: 'pony', shirt: 0xe6bb45, pants: 0x7b4fb0, scale: 0.76 } },
    { name: 'Uncle Ray', seat: 2, pitch: 0.85, o: { skin: C.skin[3], hair: 0x1c1c1c, hairStyle: 'short', shirt: 0x2f7f66, pants: 0x3a3a44, beard: 0x1c1c1c } },
    { name: 'Dad', seat: 3, pitch: 0.8, o: { skin: C.skin[1], hair: 0x3a2a1a, hairStyle: 'short', shirt: 0x3f6fb5, pants: 0x4a4a55, glasses: true } },
    { name: 'Sam', seat: 4, pitch: 1.6, o: { skin: C.skin[0], hair: 0x5a3a22, shirt: 0xf08a24, pants: 0x3b5b8c, hat: 'cap', hatColor: 0x2f8f6f, shoes: 0xd84a3a, scale: 0.8 } },
    { name: 'Aunt Mia', seat: 5, pitch: 1.3, o: { skin: C.skin[2], hair: 0x2a1a12, hairStyle: 'curly', shirt: 0xd98aa6, pants: 0x2b3f66 } },
    { name: 'Grandpa', seat: 6, pitch: 0.65, o: { skin: C.skin[4], hair: 0xe6e6e6, hairStyle: 'short', shirt: 0x6b7a3a, vest: 0x8a5a33, pants: 0x5a4a3a, beard: 0xeeeeee, glasses: true } },
    { name: 'Grandma', seat: 7, pitch: 1.1, o: { skin: C.skin[4], hair: 0xd8d8d8, hairStyle: 'bun', shirt: 0x7b4fb0, pants: 0x4a3a55, glasses: true } },
  ];
  const byName = {}; const DEFAULT_YOU = 4;
  for (const f of fam) {
    const s = seats[f.seat]; const p = person(Object.assign({ expressive: true, seated: true, shadow: false }, f.o)); const sc = p.scale.x; p.traverse(o => { o.castShadow = true; });
    p.scale.setScalar(sc * 0.92); p.position.set(s.x, 0.5 + 0.09 - 0.7 * sc * 0.92, s.z); p.rotation.y = s.ry; p.userData.anim = 'idle'; scene.add(p); f.p = p; byName[f.name] = f;
    f.head = new THREE.Vector3(s.x, 0.5 + 0.09 + 0.84 * sc * 0.92, s.z); f.fwd = new THREE.Vector3(Math.sin(s.ry), 0, Math.cos(s.ry));
  }
  // who is "you"? (any family member; the default is Sam)
  const avatarOf = (f) => Object.assign({ hat: null, hatColor: undefined, beard: undefined, glasses: false, vest: undefined, apron: undefined, dress: undefined, hairStyle: 'short', shoes: 0x3b2b20 }, f.o, { scale: (f.o.scale || 1) < 0.85 ? 0.82 : 1 });
  let youI = Number.isInteger(game.save.you) && fam[game.save.you] ? game.save.you : DEFAULT_YOU; if (game.query.get('you')) youI = clamp(+game.query.get('you') || 0, 0, fam.length - 1);
  game.avatar = avatarOf(fam[youI]);
  const youTag = document.createElement('div'); youTag.className = 'you-tag'; youTag.textContent = 'You'; game.hud.root.appendChild(youTag);
  const youBtn = document.createElement('button'); youBtn.className = 'chip btn tbl-you'; game.hud.root.appendChild(youBtn);
  const setYou = (i) => { youI = i; game.save.you = i; game.persist(); game.avatar = avatarOf(fam[i]); youBtn.innerHTML = em('🙂') + ' You are ' + fam[i].name + ' · change'; };
  // portraits for the chooser: a quick head shot of everyone, taken with the game's own camera
  let portraits = null;
  function takePortraits() {
    const N = 144, rt = new THREE.WebGLRenderTarget(N, N); rt.texture.colorSpace = THREE.SRGBColorSpace; const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 30), buf = new Uint8Array(N * N * 4), out = [];
    for (const f of fam) { f.p.userData.lookAt = null; f.p.userData.anim = 'idle'; f.p.userData.tick(1, 0); }
    // each person is photographed alone in a little studio scene with a plain warm backdrop
    const studio = new THREE.Scene(); studio.background = new THREE.Color(0xe8d2a6); studio.add(new THREE.HemisphereLight(0xfff0dc, 0x8a6a4a, 1.7)); const sl = new THREE.DirectionalLight(0xffe2b8, 1.6); sl.position.set(2, 5, 4); studio.add(sl);
    for (const f of fam) {
      cam.position.copy(f.head).addScaledVector(f.fwd, 2.05).add(new THREE.Vector3(0, 0.1, 0)); cam.lookAt(f.head.x, f.head.y - 0.04, f.head.z);
      studio.add(f.p); game.renderer.setRenderTarget(rt); game.renderer.render(studio, cam); scene.add(f.p); game.renderer.readRenderTargetPixels(rt, 0, 0, N, N, buf); game.renderer.setRenderTarget(null);
      const cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'), img = g.createImageData(N, N);
      for (let y = 0; y < N; y++) img.data.set(buf.subarray((N - 1 - y) * N * 4, (N - y) * N * 4), y * N * 4); g.putImageData(img, 0, 0); out.push(cv.toDataURL('image/png'));
    }
    rt.dispose(); return out;
  }
  youBtn.onclick = () => {
    audio.play('click'); if (!portraits) portraits = takePortraits();
    const p = game.hud.panel('<div style="font-size:28px;font-weight:700;margin-bottom:4px">Who are you today?</div><div style="opacity:.75;margin-bottom:14px">You go on every adventure as this person.</div><div class="who-grid">' + fam.map((f, i) => '<button class="btn who' + (i === youI ? ' sel' : '') + '" data-i="' + i + '"><img src="' + portraits[i] + '" width="96" height="96"><div>' + f.name + '</div></button>').join('') + '</div>');
    p.el.querySelectorAll('.who').forEach(b => b.onclick = () => { setYou(+b.dataset.i); audio.play('success'); p.close(); setAnim(fam[youI], 'wave', 2); });
  };
  setYou(youI);

  // ---- the conversation: short exchanges, many of them leading into an adventure ----
  const talks = [
    { welcome: true, lines: [['Grandma', 'Welcome to our Thanksgiving dinner! 🧡'], ['Grandpa', 'See the glowing orange buttons? They are magic! ✨'], ['Lily', 'Push one — it takes you to where that thing came from! 👆']] },
    { id: 'turkey', lines: [['Lily', 'Where did this turkey come from? 🦃'], ['Grandpa', "More people helped than you'd guess!"], ['Dad', 'Push the orange button to find out! 👆']] },
    { id: 'potatoes', lines: [['Uncle Ray', 'Who mashed these potatoes? So fluffy! 🥔'], ['Mom', 'I did! But who grew them?'], ['Sam', 'Push the button by the bowl and see! 👆']] },
    { id: 'cranberry', lines: [['Aunt Mia', 'How do cranberries become sauce? 🥫'], ['Grandma', 'First they float on a red lake!'], ['Lily', 'No way! Push its button — I want to see! 😲', 'laugh']] },
    { id: 'pie', lines: [['Dad', "Who made the pumpkin pie? It's delicious! 🥧"], ['Grandma', 'I did — with help from a bee. 🐝'], ['Uncle Ray', 'A bee?! The orange button will explain! 😂', 'laugh']] },
    { id: 'sparkling', lines: [['Lily', 'Why is my juice so fizzy? 🥂'], ['Dad', 'Press the button by the bottle and find out!'], ['Mom', 'Cheers, everyone! 🥂', 'cheer']] },
    { id: 'china', lines: [['Mom', 'These plates are so pretty. 🍽️'], ['Grandma', 'Their story starts in China, long ago.'], ['Grandpa', 'Push the button by the plate! 👆']] },
    { id: 'tablecloth', lines: [['Lily', 'Grandma, where did this tablecloth come from? 🧵'], ['Grandma', 'Anna stitched it, long, long ago.'], ['Grandpa', 'It crossed a whole ocean! ⛵'], ['Dad', 'Press the button on its corner to follow it!']] },
    { id: 'woodtable', lines: [['Uncle Ray', 'This table is solid as a rock. 🌳'], ['Grandpa', 'It was an oak tree once!'], ['Sam', 'The button on the table leg shows how! 👆']] },
    { lines: [['Aunt Mia', 'Pass the pumpkin pie, please! 🥧'], ['Uncle Ray', 'Only if you pass the rolls! 😄', 'laugh']] },
    { lines: [['Grandpa', 'Remember when the dog ate the pie? 🐶', 'laugh'], ['Mom', 'Best Thanksgiving ever! 😂']] },
    { lines: [['Mom', 'What is everyone thankful for? 💛'], ['Lily', 'Everybody who made this dinner!'], ['Grandma', 'Thousands of people, sweetheart. 💛']] },
    { lines: [['Dad', 'More gravy, anyone? 😋'], ['Uncle Ray', 'Yes, please! 🙋'], ['Aunt Mia', 'Save some for me! 😄', 'laugh']] },
    { lines: [['Sam', 'What do the orange buttons do? 🤔'], ['Grandpa', 'Each one takes you on an adventure! ✨'], ['Grandma', 'Push any one you like, dear. 👆']] },
    { lines: [['Grandma', 'Who wants seconds? 🍽️'], ['Lily', 'Me! Me! 🙋', 'laugh'], ['Dad', 'Save room for pie! 🥧']] },
  ];
  const bubbles = [], timers = []; let queue = [], cur = null, lineI = 0, talkT = 2.2, firstTalk = true;
  const after = (t, fn) => timers.push({ t, fn });
  const setAnim = (f, a, dur) => { f.p.userData.anim = a; f.animUntil = time + dur; };
  function say(f, text, react) {
    const dur = 2.6 + text.split(' ').length * 0.24; f.sayDur = dur; setAnim(f, 'talk', dur - 0.5);
    if (active && !quiet) { audio.babble(f.pitch, 5); const el = game.hud.makeBubble(text); el.style.fontSize = '15px'; el.style.padding = '5px 11px'; el.style.opacity = '.96'; bubbles.push({ el, pos: f.head.clone().add(new THREE.Vector3(0, 0.42 * f.p.scale.x, 0)), t: 2.6 + text.split(' ').length * 0.24 }); }
    for (const g of fam) g.p.userData.lookAt = g === f ? null : f.head;
    if (react) after(1.3, () => { const pool = fam.filter(g => g !== f).sort(() => Math.random() - 0.5).slice(0, react === 'cheer' ? 7 : 2 + Math.floor(Math.random() * 3));
      pool.forEach((g, i) => after(i * 0.12, () => { setAnim(g, react === 'cheer' ? (i % 2 ? 'clap' : 'cheer') : 'laugh', 1.5 + Math.random() * 0.7); if (active && !quiet && react === 'laugh') audio.laugh(g.pitch); })); if (react === 'cheer' && active && !quiet) audio.play('clink'); });
  }
  function converse() {
    if (!cur) {
      if (!queue.length) { // a new round: adventures not finished yet come up more (mixed with small talk); the welcome opens the very first round
        const open = talks.map((x, i) => i).filter(i => talks[i].id && !game.save.done[talks[i].id]), rest = talks.map((x, i) => i).filter(i => !talks[i].welcome && !open.includes(i) && (!talks[i].id || open.length === 0)).sort(() => Math.random() - 0.5).slice(0, open.length ? 4 : 99);
        queue = open.concat(rest).sort(() => Math.random() - 0.5); if (firstTalk) { queue.push(0); firstTalk = false; } }
      cur = talks[queue.pop()]; lineI = 0;
    }
    const [who, text, react] = cur.lines[lineI++]; say(byName[who], text, react);
    if (lineI >= cur.lines.length) { cur = null; talkT = (byName[who].sayDur || 3) + 1.6 + Math.random() * 2.2; after(3.4, () => { const e = fam[Math.floor(Math.random() * fam.length)]; if (time > (e.animUntil || 0)) setAnim(e, 'eat', 3); const e2 = fam[Math.floor(Math.random() * fam.length)]; if (time > (e2.animUntil || 0)) setAnim(e2, 'eat', 2.5); }); }
    else talkT = (byName[who].sayDur || 3) + 0.15 + Math.random() * 0.3;
  }

  // ================= the buttons on the table =================
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = { // where the camera dives to
    turkey: V(0, TOP + 0.35, 0), potatoes: V(pot.position.x, TOP + 0.2, pot.position.z), cranberry: V(cran.position.x, TOP + 0.12, cran.position.z),
    pie: V(pi.position.x, TOP + 0.1, pi.position.z), sparkling: V(bot.position.x, TOP + 0.25, bot.position.z),
    china: V(seats[0].x, TOP + 0.03, seats[0].z + 0.64), tablecloth: V(TL / 2 - 0.3, TOP, TW / 2 - 0.25), woodtable: V(TL / 2 - 0.32, 0.4, TW / 2 - 0.2),
  };
  const LX = TL / 2 - 0.32, LZ = TW / 2 - 0.27;
  const spots = { // where each push-button sits: [x, y, z, facing] (facing 0 = lying on the table, 1 = on a table leg looking +Z, -1 = looking −Z)
    turkey: [[0.3, TOP, 0.6, 0]], potatoes: [[-1.04, TOP, 0.45, 0]], cranberry: [[0.74, TOP, -0.45, 0]], pie: [[1.68, TOP, 0.47, 0]], sparkling: [[0.8, TOP, 0.4, 0]],
    china: [[-1.0, TOP, -0.5, 0]], tablecloth: [[TL / 2 - 0.16, TOP, TW / 2 - 0.14, 0]], woodtable: [[LX, 0.36, LZ + 0.066, 1], [-LX, 0.36, -LZ - 0.066, -1]],
  };
  const btns = []; const baseG = new THREE.Group();
  for (const def of game.adventures) for (const sp of (spots[def.id] || [])) {
    const g = new THREE.Group(); g.position.set(sp[0], sp[1], sp[2]); if (sp[3]) g.rotation.x = sp[3] * Math.PI / 2;
    g.add(cyl(0.086, 0.095, 0.02, 0x8a6a2a, [0, 0.01, 0], null, 14)); g.add(cyl(0.07, 0.07, 0.027, 0x3a2c18, [0, 0.016, 0], null, 12)); baseG.add(g);
    const n = sp[3] ? V(0, 0, sp[3]) : V(0, 1, 0);
    btns.push({ id: def.id, def, g, pos: V(sp[0], sp[1], sp[2]).addScaledVector(n, 0.035), n, hidden: false });
  }
  bake(baseG); scene.add(baseG);
  // domes (orange = not done yet, green = done), a soft pool of orange light under each waiting button, and a ring that ripples out from it
  let domes = null, glowM = null, ringM = null;
  const glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,150,20,.95)'); gr.addColorStop(0.3, 'rgba(255,140,20,.6)'); gr.addColorStop(0.65, 'rgba(255,130,10,.18)'); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const ringTex = canvasTex(128, 128, (g) => { g.strokeStyle = 'rgba(255,120,0,.95)'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,200,120,.7)'; g.lineWidth = 2; g.beginPath(); g.arc(64, 64, 49, 0, 7); g.stroke(); });
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), ringMat = new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const domeMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const decals = (list, size, lift, material) => { const pos = [], uv = [], h = size / 2;
    for (const b of list) { const c = b.g.position.clone().addScaledVector(b.n, lift), ax = V(1, 0, 0), ay = b.n.y > 0.5 ? V(0, 0, -1) : V(0, 1, 0);
      const q = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]; for (const [i, j] of q) { pos.push(c.x + ax.x * i * h + ay.x * j * h, c.y + ax.y * i * h + ay.y * j * h, c.z + ax.z * i * h + ay.z * j * h); uv.push((i + 1) / 2, (j + 1) / 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); const m = new THREE.Mesh(g, material); m.renderOrder = 2; m.frustumCulled = false; return m; };
  function rebuildButtons() {
    for (const o of [domes, glowM, ringM]) if (o) { scene.remove(o); o.traverse(x => x.geometry && x.geometry.dispose()); }
    domes = new THREE.Group(); const wait = new THREE.Group(), fin = new THREE.Group();
    for (const b of btns) { const done = !!game.save.done[b.id]; const d = new THREE.Group(); d.position.copy(b.g.position); d.rotation.copy(b.g.rotation);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glow(done ? 0x58c46a : 0xff8a12)); m.position.y = 0.022; m.scale.y = 0.72; d.add(m);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.017, 6, 5), glow(done ? 0xd6ffd9 : 0xffe2b0)); hl.position.set(-0.018, 0.056, 0.018); d.add(hl); (done ? fin : wait).add(d); }
    bake(wait); bake(fin); wait.traverse(o => { if (o.isMesh) o.material = domeMat; }); domes.add(wait, fin); scene.add(domes);
    const waiting = btns.filter(b => !game.save.done[b.id]);
    glowM = decals(waiting, 0.62, 0.004, glowMat); ringM = decals(waiting, 0.8, 0.006, ringMat); scene.add(glowM, ringM);
  }
  // is a button hidden behind the table, the food or a person?
  const ray = new THREE.Raycaster(), rd = new THREE.Vector3(), bakedMeshes = room.children.filter(c => c.isMesh);
  const blockers = []; for (const f of fam) { blockers.push({ c: f.head, r: 0.32 * f.p.scale.x }); blockers.push({ c: f.head.clone().add(new THREE.Vector3(0, -0.5 * f.p.scale.x, 0)), r: 0.3 * f.p.scale.x }); }
  function occluded(pos) {
    rd.copy(pos).sub(camera.position); const dist = rd.length(); rd.divideScalar(dist);
    for (const b of blockers) { const oc = b.c.clone().sub(camera.position), t = oc.dot(rd); if (t > 0 && t < dist - 0.05 && oc.lengthSq() - t * t < b.r * b.r) return true; }
    ray.set(camera.position, rd); ray.far = dist - 0.06; return ray.intersectObjects(bakedMeshes, false).length > 0;
  }
  const tip = document.createElement('div'); tip.className = 'chip tip3d'; game.hud.root.appendChild(tip); let hover = null;
  const pv = new THREE.Vector3(), pr = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function pick(px, py) { // which visible button is under the pointer?
    v2.set(px / game.width * 2 - 1, -(py / game.height) * 2 + 1); pr.setFromCamera(v2, camera); let best = null, bd = 1e9;
    for (const b of btns) { const d = pr.ray.distanceToPoint(b.pos), along = b.pos.clone().sub(pr.ray.origin).dot(pr.ray.direction); if (d < 0.11 + along * 0.006 && along < bd && b.n.dot(pr.ray.direction) < 0.15 && !occluded(b.pos)) { best = b; bd = along; } }
    return best;
  }
  const chip = document.createElement('div'); chip.className = 'chip tbl-hint'; game.hud.root.appendChild(chip);
  const hots = game.adventures.filter(a => spots[a.id]);
  function refreshChip() { const done = hots.filter(a => game.save.done[a.id]).length, total = hots.length, n = game.totalThanked;
    chip.innerHTML = done === 0 ? em('👆') + ' Push a glowing orange button to discover its story' : done < total ? em('💛') + ' ' + n + ' kinds of helpers thanked · ' + done + ' of ' + total + ' adventures' : em('💛') + ' Thank you, thousands! All ' + total + ' adventures · ' + n + ' kinds of helpers';
    rebuildButtons(); }

  // ================= camera =================
  const tallK = () => clamp((1.35 / game.aspect - 1) / 0.9, 0, 1);
  const orbit = { yaw: 0.55, pitch: 0.5, dist: 6.3, auto: true, idle: 0 }; const look = new THREE.Vector3(0, 0.95, 0), lookT = new THREE.Vector3(0, 0.95, 0); let flight = null;
  const camPos = (o, out) => out.set(look.x + Math.sin(o.yaw) * Math.cos(o.pitch) * o.dist, look.y + Math.sin(o.pitch) * o.dist, look.z + Math.cos(o.yaw) * Math.cos(o.pitch) * o.dist);
  let time = 0, active = true, quiet = true;
  const press = (b) => { if (game.busy || !active || flight) return; pv.copy(b.pos).project(camera); audio.play('click'); tip.classList.remove('show'); game.startAdventure(b.id, pv.x * 0.5 + 0.5, -pv.y * 0.5 + 0.5); };

  const api = {
    scene, camera, sun, hots, btns, fam, orbit, pick, press,
    /** screen position of an adventure's button if it can be seen and pressed right now (for tests) */
    buttonAt(id) { for (const b of btns) if (b.id === id && !occluded(b.pos)) { pv.copy(b.pos).project(camera); if (pv.z < 1 && Math.abs(pv.x) < 0.98 && Math.abs(pv.y) < 0.98) return { x: (pv.x * 0.5 + 0.5) * game.width, y: (-pv.y * 0.5 + 0.5) * game.height }; } return null; },
    setActive(a) { active = a; for (const e of [chip, youBtn]) e.style.display = a ? '' : 'none'; if (!a) { youTag.style.display = 'none'; tip.classList.remove('show'); game.renderer.domElement.style.cursor = ''; for (const b of bubbles) b.el.remove(); bubbles.length = 0; } },
    /** called when the table is shown: at start (fromId null) or when coming back from an adventure */
    enter(fromId, completed) {
      quiet = false; audio.music('table'); refreshChip(); flight = null; lookT.set(0, 0.95, 0);
      if (fromId && anchors[fromId]) { const a = anchors[fromId]; look.copy(a); orbit.dist = 1.9; orbit.pitch = 0.95; orbit.yaw = Math.atan2(a.x * 0.2, 1) + (a.z < 0 ? 0.5 : 0); orbit.auto = false; orbit.idle = 3; flight = { t0: performance.now(), dur: 1.6, back: true, d0: 1.9, p0: 0.95, l0: a.clone() }; }
      else { orbit.dist = 9.5; orbit.pitch = 0.75; orbit.yaw = 1.4; flight = { t0: performance.now(), dur: 2.6, back: true, d0: 9.5, p0: 0.75, l0: look.clone(), y0: 1.4, y1: 0.55 }; }
      cur = null; talkT = fromId ? 2.6 : 1.8; if (!fromId) { queue = []; firstTalk = true; for (const b of bubbles) b.el.remove(); bubbles.length = 0; } // coming to the table: the talk starts with the welcome
      if (completed) { after(0.9, () => { audio.play('success'); fam.forEach((f, i) => setAnim(f, i % 3 === 0 ? 'cheer' : 'clap', 2.4)); }); after(3.2, () => say(byName[youI === 1 ? 'Sam' : 'Lily'], 'Now I know its whole story! 💛')); talkT = 7; }
    },
    /** camera dives toward an item (used by the transition into an adventure) */
    focus(id) { const a = anchors[id]; if (!a) return Promise.resolve(); return new Promise(res => { flight = { t0: performance.now(), dur: 0.7, back: false, d0: orbit.dist, p0: orbit.pitch, l0: look.clone(), target: a, res }; }); },
    update(dt, input) {
      time += dt;
      for (let i = timers.length - 1; i >= 0; i--) { const h = timers[i]; h.t -= dt; if (h.t <= 0) { timers.splice(i, 1); h.fn(); } }
      talkT -= dt; if (talkT <= 0) converse();
      for (const f of fam) { if (f.animUntil && time > f.animUntil) { f.p.userData.anim = 'idle'; f.animUntil = 0; } f.p.userData.tick(dt, time); }
      // flames, fire, steam, tail, button glow
      flames.scale.y = 1 + Math.sin(time * 17) * 0.06 + Math.sin(time * 29) * 0.04; flames.position.y = -(flames.scale.y - 1) * (TOP + 0.37);
      fire.scale.set(1 + Math.sin(time * 9) * 0.08, 1 + Math.sin(time * 13) * 0.15 + Math.sin(time * 23) * 0.08, 1);
      for (const s of steam) { const k = (time * 0.22 + s.userData.o) % 1; s.position.set(Math.sin(k * 5 + s.userData.o * 9) * 0.1, TOP + 0.55 + k * 0.7, Math.cos(k * 4 + s.userData.o * 5) * 0.06); const sc = 0.25 + k * 0.35; s.scale.set(sc, sc, 1); s.material.opacity = 0.5 * Math.sin(k * Math.PI); }
      tail.rotation.y = 0.5 + Math.sin(time * 9) * 0.5 * (Math.sin(time * 0.7) > 0 ? 1 : 0.15);
      { const pu = 0.5 + 0.5 * Math.sin(time * 3.4); glowMat.opacity = 0.62 + pu * 0.38; domeMat.color.setScalar(0.8 + pu * 0.2);
        const k = (time * 0.55) % 1, s = 0.25 + k * 0.75, rp = 1 / s; ringTex.repeat.set(rp, rp); ringTex.offset.set((1 - rp) / 2, (1 - rp) / 2); ringMat.opacity = (1 - k) * 0.9; }
      // camera
      if (flight) { const k = Math.min(1, (performance.now() - flight.t0) / 1000 / (game.fast ? 0.05 : flight.dur)), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        if (flight.back) { orbit.dist = lerp(flight.d0, 6.3, e); orbit.pitch = lerp(flight.p0, 0.5 + tallK() * 0.3, e); look.lerpVectors(flight.l0, lookT, e); if (flight.y0 !== undefined) orbit.yaw = lerp(flight.y0, flight.y1, e); }
        else { orbit.dist = lerp(flight.d0, 0.9, e); look.lerpVectors(flight.l0, flight.target, e); }
        if (k >= 1) { const r = flight.res; const wasBack = flight.back; flight = null; if (wasBack) { orbit.auto = true; orbit.idle = 0; } r && r(); } }
      else if (input && active) {
        if (input.dragX || input.dragY || input.wheel) { orbit.auto = false; orbit.idle = 0; }
        orbit.yaw -= input.dragX * 0.006; orbit.pitch = clamp(orbit.pitch + input.dragY * 0.004, 0.14 + tallK() * 0.42, 1.25); orbit.dist = clamp(orbit.dist * (1 + input.wheel * 0.001), 3.0, 7.2);
        orbit.idle += dt; if (orbit.idle > 7) orbit.auto = true; if (orbit.auto && !hover) orbit.yaw += dt * 0.08;
        orbit.pitch = Math.max(orbit.pitch, 0.14 + clamp((4.6 - orbit.dist) / 1.6, 0, 1) * 0.38);
      }
      orbit.pitch = Math.max(orbit.pitch, 0.14 + tallK() * 0.6);
      camPos(orbit, camera.position); camera.position.x = clamp(camera.position.x, -RX + 0.9, RX - 0.9); camera.position.z = clamp(camera.position.z, -RZ + 0.9, RZ - 0.5);
      const wantFov = 42 * clamp(1.35 / game.aspect, 1, 1.9); if (Math.abs(camera.fov - wantFov) > 0.5) { camera.fov = wantFov; camera.updateProjectionMatrix(); } camera.lookAt(look);
      camera.updateMatrixWorld();
      // pointer: hovering or pressing a button; labels that follow 3D points
      if (active) { const W = game.width, H = game.height;
        if (input && !flight && !game.busy && !game.hud.panelOpen) {
          const isTouch = document.body.classList.contains('touch');
          if (input.click) { const b = pick(input.click.x, input.click.y); if (b) press(b); }
          const h = isTouch ? null : pick(input.pointer.x, input.pointer.y);
          if (h !== hover) { hover = h; game.renderer.domElement.style.cursor = h ? 'pointer' : ''; if (h) { tip.innerHTML = em(h.def.emoji || '') + ' ' + (h.def.title || h.id) + (game.save.done[h.id] ? ' ' + em('✅') : ''); } tip.classList.toggle('show', !!h); }
          if (hover) { pv.copy(hover.pos).project(camera); tip.style.transform = 'translate3d(' + ((pv.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-pv.y * 0.5 + 0.5) * H - 26).toFixed(1) + 'px,0) translate(-50%,-100%)'; }
        } else if (hover) { hover = null; tip.classList.remove('show'); game.renderer.domElement.style.cursor = ''; }
        pv.copy(fam[youI].head).add(V(0, 0.4 * fam[youI].p.scale.x, 0)).project(camera); const showYou = pv.z < 1 && !flight; youTag.style.display = showYou ? '' : 'none'; if (showYou) youTag.style.transform = 'translate3d(' + ((pv.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-pv.y * 0.5 + 0.5) * H).toFixed(1) + 'px,0) translate(-50%,-100%)';
        for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.t -= dt; if (b.t <= 0) { b.el.remove(); bubbles.splice(i, 1); continue; } pv.copy(b.pos).project(camera); b.el.style.display = pv.z < 1 ? '' : 'none'; b.el.style.transform = 'translate3d(' + clamp((pv.x * 0.5 + 0.5) * W, 130, W - 130).toFixed(1) + 'px,' + Math.max(70, (-pv.y * 0.5 + 0.5) * H).toFixed(1) + 'px,0)'; } }
    },
  };
  refreshChip(); camPos(orbit, camera.position); camera.lookAt(look);
  return api;
}
