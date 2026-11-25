// Shared builders for "Grandma's Tablecloth": flax, linen textures, the embroidery mini-game, wagon, oxen.
import { THREE, C, box, cyl, sphere, ball, cone, torus, group, mat, glow, bake, canvasTex, seeded, lathe, tube, grain } from '../core/kit.js';

export const FLAX_GREEN = 0x86b356, FLAX_BLUE = 0x5b8fe8, STRAW = 0xd8c27a, FIBRE = 0xf0dfa6, LINEN_RAW = 0xcdbb94, LINEN = 0xf7f3e8;

/** one bake-able mesh from raw triangles (flat lists of xyz positions and normals) */
function rawMesh(pos, nor, color, double = false) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const m = new THREE.Mesh(g, mat(color, double ? { side: 'double' } : undefined)); m.castShadow = false; m.receiveShadow = true; return m;
}
/**
 * Flax plants drawn as real flax looks: slender, slightly leaning stems with a few narrow leaves and small sky-blue flowers on top.
 * spots = [[x, z, height], ...]. Cheap: about 12 triangles a stem, and the whole patch bakes into one mesh.
 */
export function flaxPlants(rnd, spots, color = FLAX_GREEN, flowers = true) {
  const sp = [], sn = [], lp = [], ln = [], f1p = [], f1n = [], f2p = [], f2n = [];
  for (const [x, z, h] of spots) {
    const tx = (rnd() - 0.5) * 0.28, tz = (rnd() - 0.5) * 0.28, X = x + tx * h, Z = z + tz * h, r0 = 0.024, r1 = 0.011, a0 = rnd() * 6.28;
    for (let i = 0; i < 3; i++) { // a thin three-sided stem
      const a = a0 + i * 2.094, b = a0 + (i + 1) * 2.094, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      sp.push(x + ca * r0, 0, z + sa * r0, X + ca * r1, h, Z + sa * r1, x + cb * r0, 0, z + sb * r0, x + cb * r0, 0, z + sb * r0, X + ca * r1, h, Z + sa * r1, X + cb * r1, h, Z + sb * r1);
      sn.push(ca, 0.2, sa, ca, 0.2, sa, cb, 0.2, sb, cb, 0.2, sb, ca, 0.2, sa, cb, 0.2, sb);
    }
    for (let i = 0; i < 1; i++) { // a narrow leaf pointing up and out
      const t = 0.35 + rnd() * 0.4, a = rnd() * 6.28, bx = x + tx * h * t, by = h * t, bz = z + tz * h * t, L = 0.16, dx = Math.cos(a), dz = Math.sin(a);
      lp.push(bx - dz * 0.012, by, bz + dx * 0.012, bx + dz * 0.012, by, bz - dx * 0.012, bx + dx * L * 0.6, by + L, bz + dz * L * 0.6); for (let j = 0; j < 3; j++) ln.push(-dx * 0.5, 0.8, -dz * 0.5);
    }
    if (flowers) for (let i = 0, nf = rnd() < 0.5 ? 2 : 1; i < nf; i++) { // small open flowers (flat, tilted toward the light)
      const s = i ? 0.05 : 0.07, fx = X + (i ? (rnd() - 0.5) * 0.14 : 0), fy = h + (i ? -0.08 - rnd() * 0.08 : 0.01), fz = Z + (i ? (rnd() - 0.5) * 0.14 : 0), tiltX = (rnd() - 0.5) * 0.6, tiltZ = 0.15 + rnd() * 0.5;
      const P = rnd() < 0.55 ? f1p : f2p, N = P === f1p ? f1n : f2n;
      const v = [[-s, 0, 0], [0, 0, s], [s, 0, 0], [0, 0, -s]].map(([px, , pz]) => [fx + px, fy + px * tiltX - pz * tiltZ, fz + pz]);
      P.push(...v[0], ...v[1], ...v[2], ...v[0], ...v[2], ...v[3]); for (let j = 0; j < 6; j++) N.push(-tiltX, 1, tiltZ);
    }
  }
  const g = new THREE.Group(); g.add(rawMesh(sp, sn, color)); g.add(rawMesh(lp, ln, color === FLAX_GREEN ? 0x79a64c : color, true));
  if (flowers) { if (f1p.length) g.add(rawMesh(f1p, f1n, FLAX_BLUE, true)); if (f2p.length) g.add(rawMesh(f2p, f2n, 0x8fb4f2, true)); }
  return g;
}
/** a clump of flax: n stems, about h metres tall. */
export function flaxClump(rnd, n = 3, h = 1, color = FLAX_GREEN) {
  const spots = []; for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = 0.03 + rnd() * 0.17; spots.push([Math.cos(a) * r, Math.sin(a) * r, h * (0.8 + rnd() * 0.3)]); }
  return flaxPlants(rnd, spots, color);
}
/** a tied sheaf of flax stalks (lying along X): pinched where the straw band holds it, fanning out at both ends. */
export function sheaf(color = FLAX_GREEN, flowers = true, len = 1.1) {
  const g = new THREE.Group(), h = len / 2, dark = new THREE.Color(color).multiplyScalar(0.82).getHex();
  const body = lathe([[0.001, -h], [0.19, -h], [0.15, -h * 0.45], [0.115, -0.03], [0.115, 0.05], [0.15, h * 0.5], [0.21, h], [0.001, h]], color, null, 9); body.rotation.z = -Math.PI / 2; g.add(body);
  const band = cyl(0.125, 0.125, 0.09, 0x8a6a3a, [0.01, 0, 0], [0, 0, Math.PI / 2], 9); g.add(band);
  for (let i = 0; i < 5; i++) { const a = i * 1.26, r = 0.05 + (i % 3) * 0.05; g.add(cyl(0.012, 0.012, 0.16, dark, [h + 0.05, Math.sin(a) * r, Math.cos(a) * r], [0, 0, Math.PI / 2 + (i % 2 ? 0.25 : -0.2)], 3)); } // loose stalk ends
  if (flowers) for (let i = 0; i < 6; i++) g.add(cone(0.05, 0.07, i % 2 ? FLAX_BLUE : 0x8fb4f2, [h + 0.06 + (i % 3) * 0.03, Math.sin(i * 1.1) * 0.15, Math.cos(i * 1.1) * 0.15], [0, 0, Math.PI / 2], 4));
  return g;
}
/** a "strick" of combed golden flax fibre (like a blond pony-tail). */
export function strick() {
  const g = new THREE.Group();
  const t1 = tube([[-0.32, 0, 0], [-0.1, 0.03, 0.02], [0.15, 0.0, -0.02], [0.42, -0.06, 0.03], [0.55, -0.12, 0.0]], 0.085, FIBRE, 6); t1.scale.set(1, 0.8, 1.25); g.add(t1);
  const t2 = tube([[-0.3, 0.04, 0.03], [0.0, 0.08, 0.05], [0.3, 0.04, 0.06], [0.5, -0.05, 0.08]], 0.05, 0xfff0c0, 5); g.add(t2);
  const t3 = tube([[-0.3, 0.02, -0.04], [0.0, 0.05, -0.07], [0.3, 0.0, -0.08], [0.48, -0.1, -0.07]], 0.045, 0xe6d08e, 5); g.add(t3);
  g.add(cyl(0.1, 0.1, 0.07, 0x8a5a2b, [-0.3, 0.01, 0], [0, 0, Math.PI / 2], 8));
  return g;
}

// ---------- embroidery drawing (2D canvas) ----------
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
function satin(g, cx, cy, rx, ry, rot, c1, c2) {
  g.save(); g.translate(cx, cy); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 6.3); g.fillStyle = c1; g.fill(); g.clip();
  g.lineWidth = Math.max(1, rx * 0.11); g.strokeStyle = c2; for (let x = -rx; x <= rx; x += Math.max(2, rx * 0.24)) { g.beginPath(); g.moveTo(x, -ry); g.lineTo(x + rx * 0.1, ry); g.stroke(); }
  g.restore(); g.save(); g.translate(cx, cy); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 6.3); g.lineWidth = Math.max(1, rx * 0.06); g.strokeStyle = 'rgba(40,60,120,.35)'; g.stroke(); g.restore();
}
/** points along the vine of a flower of size s whose centre is at 0,0 (vine hangs down and curls). */
export function vinePts(s, n = 7) { const out = []; for (let i = 0; i < n; i++) { const t = i / (n - 1); out.push([Math.sin(t * 2.6) * s * 0.55 + t * s * 0.5, s * 0.55 + t * s * 1.5]); } return out; }
export function petalPos(s, i) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; return [Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, a]; }
export function knotPos(s, i) { const a = i * Math.PI * 2 / 3 + 0.5; return [Math.cos(a) * s * 0.13, Math.sin(a) * s * 0.13]; }
/** draw an embroidered flax-blue flower. st = { petals: 0..5, vine: 0..6 segments, knots: 0..3 } */
export function drawFlower(g, cx, cy, s, st = { petals: 5, vine: 6, knots: 3 }) {
  g.save(); g.translate(cx, cy); g.lineCap = 'round';
  const v = vinePts(s);
  for (let i = 0; i < Math.min(st.vine, v.length - 1); i++) { // stem stitch: short slanted overlapping stitches
    const [x1, y1] = v[i], [x2, y2] = v[i + 1];
    for (let k = 0; k < 4; k++) { const a = k / 4, b = (k + 1.35) / 4; g.strokeStyle = k % 2 ? '#4f8f45' : '#6fb05a'; g.lineWidth = Math.max(1.2, s * 0.075); g.beginPath(); g.moveTo(x1 + (x2 - x1) * a - s * 0.02, y1 + (y2 - y1) * a); g.lineTo(x1 + (x2 - x1) * b + s * 0.02, y1 + (y2 - y1) * b); g.stroke(); }
    if (i === 1 || i === 3) { const sd = i === 1 ? -1 : 1; satin(g, x2 + sd * s * 0.3, y2 - s * 0.05, s * 0.26, s * 0.11, sd * 0.5, '#6fb05a', '#8fcf75'); }
  }
  for (let i = 0; i < st.petals; i++) { const [x, y, a] = petalPos(s, i); satin(g, x, y, s * 0.36, s * 0.21, a, hex(FLAX_BLUE), '#9cc0ff'); }
  for (let i = 0; i < st.knots; i++) { const [x, y] = knotPos(s, i); g.beginPath(); g.arc(x, y, s * 0.095, 0, 6.3); g.fillStyle = '#e8b63a'; g.fill(); g.lineWidth = Math.max(1, s * 0.02); g.strokeStyle = '#a87a1a'; g.stroke(); g.beginPath(); g.arc(x - s * 0.03, y - s * 0.03, s * 0.035, 0, 6.3); g.fillStyle = '#fff3c0'; g.fill(); }
  g.restore();
}
export function drawLinen(g, W, H, border = true) {
  g.fillStyle = '#f7f3e8'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(190,175,140,.22)'; g.lineWidth = 1; for (let x = 0; x < W; x += 4) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); } for (let y = 0; y < H; y += 4) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
  if (border) { const m = Math.round(Math.min(W, H) * 0.055); // hemstitched openwork border: little bundles with gaps
    g.fillStyle = 'rgba(150,135,105,.55)'; for (let x = m; x < W - m; x += 7) { g.fillRect(x, m, 3, 6); g.fillRect(x, H - m - 6, 3, 6); } for (let y = m; y < H - m; y += 7) { g.fillRect(m, y, 6, 3); g.fillRect(W - m - 6, y, 6, 3); }
    g.strokeStyle = 'rgba(150,135,105,.5)'; g.lineWidth = 1.5; g.strokeRect(m - 3, m - 3, W - 2 * m + 6, H - 2 * m + 6); g.strokeRect(m + 9, m + 9, W - 2 * m - 18, H - 2 * m - 18); }
}
/** the tablecloth texture: returns { tex, set(nFlowers) } — flowers appear one by one as Anna works. */
export function clothTexture() {
  const W = 512, H = 288, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 2;
  const spots = [[256, 118, 30], [84, 66, 19], [428, 66, 19], [84, 196, 19], [428, 196, 19], [170, 120, 17], [342, 120, 17], [256, 44, 14]];
  const api = { tex, n: 0, max: spots.length, set(n) { api.n = n; drawLinen(g, W, H, true); for (let i = 0; i < Math.min(n, spots.length); i++) { const [x, y, s] = spots[i]; drawFlower(g, x, y, s); } tex.needsUpdate = true; } };
  api.set(0); return api;
}
/** a cloth lying on a table: w x d, with a little overhang. The top shows the cloth texture. */
export function tableCloth(w, d, tex, drop = 0.28) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tex })); top.rotation.x = -Math.PI / 2; top.position.y = 0.012; top.receiveShadow = true; g.add(top);
  const skirt = new THREE.Group(); for (const s of [-1, 1]) { skirt.add(box(w, drop, 0.02, LINEN, [0, -drop / 2, s * d / 2])); skirt.add(box(0.02, drop, d, LINEN, [s * w / 2, -drop / 2, 0])); } g.add(bake(skirt));
  return g;
}
/** the folded tablecloth (a neat white parcel with a flower showing). */
export function foldedCloth(flower = true) {
  const g = new THREE.Group(), b = new THREE.Group();
  b.add(box(0.62, 0.06, 0.44, LINEN, [0, 0.03, 0])); b.add(box(0.6, 0.06, 0.42, 0xefe9d8, [0, 0.09, 0])); b.add(box(0.61, 0.06, 0.43, LINEN, [0, 0.15, 0])); g.add(bake(b));
  if (flower) { const t = canvasTex(128, 96, (c, W, H) => { drawLinen(c, W, H, true); drawFlower(c, 50, 34, 20); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.42), new THREE.MeshLambertMaterial({ map: t })); m.rotation.x = -Math.PI / 2; m.position.y = 0.185; g.add(m); }
  return g;
}

/**
 * The embroidery mini-game. Opens a panel; the player taps the glowing dots:
 * satin-stitch petals → stem-stitch vine → French knots. Resolves when finished.
 * Purely click-driven (no timers); ctx.onUpdate only animates the pulsing hints.
 */
export function embroideryGame(ctx) {
  return new Promise((resolve) => {
    const W = 560, H = 400, S = 104, CX = 215, CY = 138;
    // on a phone held sideways (short, wide screen) the picture sits at nearly full height with the heading in a column beside it, instead of the whole pop-up being shrunk
    const vw = window.innerWidth, vh = window.innerHeight, wide = vh < 480 && vw > vh * 1.3, ch = Math.min(H, vh - 58);
    const headHtml = '<span class="em" id="tcIcon" style="font-size:' + (wide ? 44 : 34) + 'px">🧵</span><span id="tcName"></span><span id="tcDots" style="letter-spacing:4px;font-size:18px"></span>';
    const frame = (css) => '<div style="position:relative;' + css + ';aspect-ratio:' + W + '/' + H + ';border-radius:16px;overflow:hidden;box-shadow:0 0 0 4px #c9a26b,0 5px 0 rgba(74,44,23,.25);margin:4px"><canvas id="tcCanvas" width="' + W + '" height="' + H + '" style="cursor:pointer;touch-action:none;width:100%;height:100%;display:block"></canvas></div>';
    const p = ctx.ui.panel(wide
      ? '<div style="display:flex;gap:14px;align-items:center;margin:-2px">' + frame('flex:none;width:' + Math.round(ch * W / H) + 'px') + '<div style="width:190px;flex:none;font-size:25px;font-weight:800;display:flex;flex-direction:column;gap:10px;justify-content:center;align-items:center">' + headHtml + '</div></div>'
      : '<div style="font-size:26px;font-weight:800;margin:-4px 0 8px;display:flex;gap:10px;justify-content:center;align-items:center">' + headHtml + '</div>' + frame('width:min(78vw,560px)'));
    const cv = p.el.querySelector('#tcCanvas'), g = cv.getContext('2d'), nameEl = p.el.querySelector('#tcName'), dotsEl = p.el.querySelector('#tcDots'), iconEl = p.el.querySelector('#tcIcon');
    const st = { petals: 0, vine: 0, knots: 0 }; const petalDone = [0, 0, 0, 0, 0]; let stage = 0, t = 0, done = false;
    const STAGES = [['🌸', 'Satin stitch', 5], ['🌿', 'Stem stitch', 6], ['✨', 'French knots', 3]];
    const v = vinePts(S).map(([x, y]) => [CX + x, CY + y]);
    const targets = () => {
      if (stage === 0) return petalDone.map((d, i) => d ? null : petalPos(S, i)).filter(Boolean).map(([x, y]) => [CX + x, CY + y]);
      if (stage === 1) return [v[st.vine + 1]];
      if (stage === 2) { const [x, y] = knotPos(S, st.knots); return [[CX + x, CY + y]]; }
      return [];
    };
    const draw = () => {
      drawLinen(g, W, H, true);
      // pattern guide (pencil dots), like a transfer pattern
      g.save(); g.setLineDash([3, 6]); g.strokeStyle = 'rgba(120,110,90,.55)'; g.lineWidth = 2;
      for (let i = 0; i < 5; i++) { const [x, y, a] = petalPos(S, i); g.beginPath(); g.ellipse(CX + x, CY + y, S * 0.36, S * 0.21, a, 0, 6.3); g.stroke(); }
      g.beginPath(); v.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.beginPath(); g.arc(CX, CY, S * 0.24, 0, 6.3); g.stroke(); g.restore();
      // petals stitched so far (in the order the player chose)
      for (let i = 0; i < 5; i++) if (petalDone[i]) drawPetal(i);
      drawFlower(g, CX, CY, S, { petals: 0, vine: st.vine, knots: st.knots });
      // finished sample flowers appear at the end
      if (done) { drawFlower(g, 440, 80, 30); drawFlower(g, 80, 300, 24); }
      // pulsing hints
      const pulse = 1 + Math.sin(t * 6) * 0.18; const tg = targets();
      tg.forEach(([x, y], i) => { g.beginPath(); g.arc(x, y, (stage === 2 ? 9 : 13) * pulse, 0, 6.3); g.fillStyle = 'rgba(255,196,40,.9)'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); });
      if (tg.length) { const [x, y] = tg[0]; g.font = '34px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.fillText('👆', x + 6, y + 44 + Math.sin(t * 6) * 4); }
      // needle & thread decoration
      g.save(); g.translate(468, 330); g.rotate(-0.6); g.fillStyle = '#9aa3ad'; g.fillRect(-46, -2, 92, 4); g.beginPath(); g.moveTo(46, -2); g.lineTo(58, 0); g.lineTo(46, 2); g.fill(); g.fillStyle = '#f7f3e8'; g.fillRect(-40, -1, 9, 2); g.restore();
      cv.dataset.targets = JSON.stringify(tg.map(([x, y]) => [x / W, y / H])); cv.dataset.stage = String(stage);
    };
    const drawPetal = (i) => { const [x, y, a] = petalPos(S, i); const s2 = S; g.save(); g.translate(CX + x, CY + y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, s2 * 0.36, s2 * 0.21, 0, 0, 6.3); g.fillStyle = '#5b8fe8'; g.fill(); g.clip(); g.lineWidth = 3; g.strokeStyle = '#9cc0ff'; for (let q = -s2 * 0.36; q <= s2 * 0.36; q += 7) { g.beginPath(); g.moveTo(q, -s2 * 0.21); g.lineTo(q + 3, s2 * 0.21); g.stroke(); } g.restore(); };
    const head = () => { const s = STAGES[Math.min(stage, 2)]; iconEl.textContent = done ? '💛' : s[0]; nameEl.textContent = done ? 'Beautiful!' : s[1]; const n = stage === 0 ? st.petals : stage === 1 ? st.vine : st.knots; dotsEl.textContent = done ? '' : '●'.repeat(n) + '○'.repeat(Math.max(0, s[2] - n)); };
    const stopAnim = ctx.onUpdate((dt) => { t += dt; draw(); });
    const finish = () => { done = true; stage = 3; head(); draw(); ctx.audio.play('success'); ctx.after(1.3, () => { stopAnim(); p.close(); resolve(); }); };
    const hit = (mx, my) => {
      if (done) return; let ok = false;
      if (stage === 0) { let best = -1, bd = 70; for (let i = 0; i < 5; i++) if (!petalDone[i]) { const [x, y] = petalPos(S, i); const d = Math.hypot(mx - CX - x, my - CY - y); if (d < bd) { bd = d; best = i; } } if (best >= 0) { petalDone[best] = 1; st.petals++; ok = true; if (st.petals >= 5) stage = 1; } }
      else if (stage === 1) { const [x, y] = v[st.vine + 1]; if (Math.hypot(mx - x, my - y) < 60) { st.vine++; ok = true; if (st.vine >= 6) stage = 2; } }
      else if (stage === 2) { if (Math.hypot(mx - CX, my - CY) < 70) { st.knots++; ok = true; } }
      if (ok) { ctx.audio.play('stitch'); head(); draw(); if (stage === 2 && st.knots >= 3) finish(); }
    };
    const onPtr = (e) => { const r = cv.getBoundingClientRect(); hit((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H); e.preventDefault(); };
    cv.addEventListener('pointerdown', onPtr);
    cv.addEventListener('pointermove', (e) => { if (e.buttons && stage === 1) onPtr(e); });
    head(); draw();
  });
}

/** a text plaque (plane facing +Z) drawn with an ordinary text font, so digits and spaces keep their normal width. */
export function plaque(text, height = 1, o = {}) {
  const size = 72, pad = 26, font = '700 ' + size + 'px Fredoka,"Trebuchet MS","DejaVu Sans","Verdana","Arial",sans-serif';
  const m = document.createElement('canvas').getContext('2d'); m.font = font; const w = Math.ceil(m.measureText(text).width + pad * 2), h = size + pad * 2;
  const t = canvasTex(w, h, (g) => { g.fillStyle = o.bg || '#fff8e8'; g.beginPath(); g.roundRect(3, 3, w - 6, h - 6, 22); g.fill(); g.strokeStyle = o.border || '#c9a26b'; g.lineWidth = 7; g.stroke(); g.font = font; g.fillStyle = o.fg || '#4a2c17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4); });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * w / h, height), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); mesh.userData.width = height * w / h; return mesh;
}

// ---------- wagon & oxen ----------
export function wheel(r = 0.6, color = 0x6e4a28, lo = false) {
  const g = new THREE.Group(); g.add(torus(r, r * 0.075, color, [0, 0, 0], [0, Math.PI / 2, 0], lo ? 12 : 20)); // wooden rim
  for (let i = 0; i < (lo ? 4 : 6); i++) g.add(box(0.05, r * 2, 0.045, 0x8a5a2b, [0, 0, 0], [i * Math.PI / 6, 0, 0])); // 12 spokes
  g.add(cyl(0.11, 0.11, 0.2, color, [0, 0, 0], [0, 0, Math.PI / 2], 8)); if (!lo) g.add(cyl(0.05, 0.05, 0.26, 0x3a3a3a, [0, 0, 0], [0, 0, Math.PI / 2], 6));
  return g;
}
/** covered wagon, facing +X (travels toward +X). userData.axles = [front, back] groups to spin (rotation.x… see tick). */
export function coveredWagon(lo = false) {
  const g = new THREE.Group(), body = new THREE.Group();
  body.add(box(3.4, 0.16, 1.5, 0x8a5a2b, [0, 1.0, 0])); for (const s of [-1, 1]) body.add(box(3.4, 0.55, 0.08, 0x3f6a8a, [0, 1.33, s * 0.75])); body.add(box(0.08, 0.55, 1.5, 0x3f6a8a, [-1.7, 1.33, 0])); body.add(box(0.08, 0.55, 1.5, 0x3f6a8a, [1.7, 1.33, 0]));
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.5, 10, 1, true, 0, Math.PI), mat(0xf3ecd8, { side: 'double' })); cover.rotation.z = Math.PI / 2; cover.position.set(0, 1.55, 0); cover.scale.set(1.2, 1, 0.82); body.add(cover);
  for (const x of [-1.6, -0.55, 0.55, 1.6]) body.add(torus(0.8, 0.035, 0xa8743f, [x, 1.58, 0], [0, Math.PI / 2, 0], 10));
  body.add(box(1.9, 0.08, 0.08, 0x6e4a28, [2.6, 0.8, 0])); // tongue
  body.add(box(0.5, 0.12, 1.3, 0x6e4a28, [1.95, 1.25, 0])); // seat
  if (!lo) { body.add(cyl(0.2, 0.2, 0.5, 0x8a5a2b, [-0.35, 1.18, 0.95], null, 9)); for (const y of [1.02, 1.34]) body.add(cyl(0.208, 0.208, 0.04, 0x3a3a3a, [-0.35, y, 0.95], null, 9)); // water barrel lashed to the side
    body.add(cyl(0.11, 0.09, 0.2, 0x9a7a52, [-1.78, 0.82, 0.4], null, 7)); body.add(box(0.02, 0.2, 0.02, 0x3a3026, [-1.78, 0.97, 0.4])); } // grease bucket under the tailgate
  g.add(bake(body));
  const axles = []; for (const x of [-1.15, 1.15]) { const a = new THREE.Group(); a.position.set(x, x < 0 ? 0.68 : 0.55, 0); const r = x < 0 ? 0.68 : 0.55; const w1 = wheel(r, 0x6e4a28, lo); w1.position.z = 0.86; const w2 = wheel(r, 0x6e4a28, lo); w2.position.z = -0.86; w1.rotation.y = w2.rotation.y = Math.PI / 2; a.add(w1, w2); a.add(cyl(0.05, 0.05, 1.7, 0x4a3520, [0, 0, 0], [Math.PI / 2, 0, 0], 6)); bake(a); a.userData.dynamic = true; a.userData.r = r; g.add(a); axles.push(a); }
  g.userData.axles = axles; return g;
}
/** an ox facing +X, baked (1 draw): deep chest, shoulder hump, dewlap, curved horns. About 1.5 m at the shoulder. */
export function ox(color = 0xb5793f) {
  const g = new THREE.Group(), c = new THREE.Color(color), dark = c.clone().multiplyScalar(0.8).getHex(), light = c.clone().lerp(new THREE.Color(0xf3e6cc), 0.55).getHex(), HOOF = 0x3a2c20;
  g.add(ball(0.92, 0.47, 0.4, color, [-0.05, 1.03, 0], null, 10)); // barrel
  g.add(ball(0.5, 0.5, 0.41, color, [0.48, 1.08, 0], null, 9)); // chest
  g.add(ball(0.36, 0.25, 0.3, color, [0.42, 1.43, 0], null, 9)); // shoulder hump
  g.add(ball(0.45, 0.44, 0.4, color, [-0.62, 1.06, 0], null, 9)); // hindquarters
  g.add(ball(0.3, 0.12, 0.24, light, [0.0, 0.66, 0], null, 6)); // pale belly
  const neck = cyl(0.2, 0.27, 0.55, color, [0.92, 1.22, 0], [0, 0, -1.15], 9); g.add(neck);
  g.add(ball(0.16, 0.26, 0.12, light, [0.85, 0.86, 0], [0, 0, 0.35], 8)); // dewlap
  g.add(ball(0.27, 0.22, 0.2, color, [1.25, 1.22, 0], [0, 0, -0.35], 10)); // head
  g.add(ball(0.16, 0.14, 0.16, light, [1.46, 1.08, 0], null, 8)); // muzzle
  g.add(box(0.1, 0.26, 0.14, 0xf3ecd8, [1.37, 1.3, 0], [0, 0, -0.45])); // white blaze
  for (const s of [-1, 1]) {
    g.add(sphere(0.035, 0x2a1c14, [1.58, 1.1, s * 0.07], 5)); g.add(sphere(0.04, 0x1c1410, [1.36, 1.28, s * 0.17], 6));
    g.add(ball(0.05, 0.09, 0.13, dark, [1.08, 1.36, s * 0.27], [s * 0.5, 0, 0], 6)); // ear
    g.add(tube([[1.12, 1.4, s * 0.13], [1.14, 1.47, s * 0.3], [1.22, 1.6, s * 0.42], [1.33, 1.7, s * 0.44]], 0.034, 0xf2ead6, 5)); // horn
    for (const [x, top] of [[0.52, 0.78], [-0.62, 0.8]]) { g.add(cyl(0.125, 0.085, top, color, [x, top / 2 + 0.1, s * 0.23], [0, 0, x > 0 ? 0.04 : -0.06], 8)); g.add(cyl(0.075, 0.07, 0.22, dark, [x + (x > 0 ? 0.01 : -0.02), 0.2, s * 0.23], null, 7)); g.add(cyl(0.085, 0.095, 0.1, HOOF, [x + (x > 0 ? 0.01 : -0.02), 0.05, s * 0.23], null, 7)); }
  }
  g.add(tube([[-1.02, 1.3, 0], [-1.12, 1.1, 0], [-1.13, 0.8, 0], [-1.1, 0.55, 0]], 0.028, color, 4)); g.add(ball(0.055, 0.12, 0.055, 0x3a2c20, [-1.1, 0.47, 0], null, 6)); // tail with a tuft
  return bake(g);
}

// ---------- drawn surfaces (one draw call each; they make floors and walls look like real materials) ----------
const shade = (hexCol, f) => { const c = new THREE.Color(hexCol); c.multiplyScalar(f); return '#' + c.getHexString(); };
/** a flat textured rectangle lying on the ground (w along X, d along Z), not baked */
export function floorMesh(w, d, tex, y = 0.03) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tex })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m; }
/** a textured upright rectangle facing +Z */
export function wallMesh(w, h, tex) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex })); m.receiveShadow = true; return m; }
/** floor boards running "up" the picture (along Z once laid down): boards of slightly different browns, grain lines, butt joints with nails. */
export function plankTex(boards, color, o = {}) {
  const W = 512, H = 512, r = seeded(o.seed || 7), bw = W / boards;
  return canvasTex(W, H, (g) => {
    for (let b = 0; b < boards; b++) {
      const x = b * bw, f = 0.9 + r() * 0.2; g.fillStyle = shade(color, f); g.fillRect(x, 0, bw + 1, H);
      for (let i = 0; i < Math.max(6, Math.round(260 / boards)); i++) { const gx = x + 2 + r() * (bw - 4), y0 = r() * H, len = 60 + r() * 220; g.strokeStyle = r() < 0.5 ? 'rgba(60,35,15,' + (0.05 + r() * 0.09) + ')' : 'rgba(255,235,200,' + (0.04 + r() * 0.06) + ')'; g.lineWidth = 1 + r() * 1.5; g.beginPath(); g.moveTo(gx, y0); g.bezierCurveTo(gx + (r() - 0.5) * 5, y0 + len * 0.3, gx + (r() - 0.5) * 5, y0 + len * 0.7, gx + (r() - 0.5) * 3, y0 + len); g.stroke(); }
      if (r() < 0.45) { const kx = x + bw * (0.25 + r() * 0.5), ky = r() * H; g.fillStyle = 'rgba(60,35,15,.35)'; g.beginPath(); g.ellipse(kx, ky, 3 + r() * 3, 5 + r() * 5, 0, 0, 6.3); g.fill(); } // a knot
      for (let j = 0; j < 2; j++) { const jy = Math.floor(r() * H); g.fillStyle = 'rgba(40,22,8,.5)'; g.fillRect(x, jy, bw, 2); g.fillStyle = 'rgba(30,20,12,.55)'; for (const dy of [-7, 8]) for (const fx of [0.2, 0.8]) { g.beginPath(); g.arc(x + bw * fx, jy + dy, 1.6, 0, 6.3); g.fill(); } }
      g.fillStyle = 'rgba(35,20,8,.6)'; g.fillRect(x, 0, 2, H); g.fillStyle = 'rgba(255,240,210,.1)'; g.fillRect(x + 2, 0, 1.5, H);
    }
  });
}
/** a dry-laid fieldstone wall: uneven courses of grey-brown stones with darker joints. */
export function stoneTex(wM, hM, o = {}) {
  const W = 512, H = Math.max(64, Math.round(512 * hM / wM / 32) * 32), r = seeded(o.seed || 5), pal = o.colors || [0x9a948a, 0xa8a094, 0x8c867c, 0xb0a898, 0x97907f];
  return canvasTex(W, H, (g) => {
    g.fillStyle = o.mortar || '#6e685e'; g.fillRect(0, 0, W, H);
    const ppm = W / wM; let y = 0;
    while (y < H) { const rh = (0.26 + r() * 0.2) * ppm; let x = -r() * 30;
      while (x < W) { const sw = (0.35 + r() * 0.55) * ppm, col = pal[Math.floor(r() * pal.length)], f = 0.92 + r() * 0.16;
        g.fillStyle = shade(col, f); g.beginPath(); g.roundRect(x + 1.5, y + 1.5, sw - 3, rh - 3, 5 + r() * 5); g.fill();
        g.fillStyle = 'rgba(255,255,255,.09)'; g.beginPath(); g.roundRect(x + 3, y + 3, sw - 8, rh * 0.35, 4); g.fill(); g.fillStyle = 'rgba(0,0,0,.1)'; g.beginPath(); g.roundRect(x + 4, y + rh * 0.68, sw - 8, rh * 0.26, 4); g.fill();
        x += sw; }
      y += rh; }
  });
}
/** a log-cabin wall: round logs with dark chinking between them. */
export function logTex(wM, hM, o = {}) {
  const W = 512, H = 256, r = seeded(o.seed || 9), n = Math.round(hM / 0.44);
  return canvasTex(W, H, (g) => {
    const lh = H / n;
    for (let i = 0; i < n; i++) { const y = i * lh, gr = g.createLinearGradient(0, y, 0, y + lh), c = i % 2 ? 0x9a6b43 : 0x8f633d; gr.addColorStop(0, shade(c, 0.62)); gr.addColorStop(0.18, shade(c, 1.0)); gr.addColorStop(0.45, shade(c, 1.12)); gr.addColorStop(0.85, shade(c, 0.8)); gr.addColorStop(1, shade(c, 0.5)); g.fillStyle = gr; g.fillRect(0, y, W, lh + 1);
      for (let j = 0; j < 14; j++) { const x0 = r() * W, yy = y + lh * (0.2 + r() * 0.6); g.strokeStyle = 'rgba(50,28,10,' + (0.08 + r() * 0.1) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + 30 + r() * 90, yy + (r() - 0.5) * 3); g.stroke(); }
      g.fillStyle = 'rgba(226,214,190,.5)'; g.fillRect(0, y + lh - 2, W, 2.5); }
  });
}
/** rippled sea surface (tiles; tinted by the material colour, so the storm can darken it) */
export function seaTex() {
  const t = canvasTex(256, 256, (g, W, H) => { const r = seeded(31); g.fillStyle = '#dfe9f2'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, len = 24 + r() * 60, light = r() < 0.45; g.strokeStyle = light ? 'rgba(255,255,255,' + (0.35 + r() * 0.4) + ')' : 'rgba(90,125,165,' + (0.25 + r() * 0.3) + ')'; g.lineWidth = light ? 1.5 + r() * 2 : 3 + r() * 5; g.lineCap = 'round';
      for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + len / 2, y + oy - 5 - r() * 4, x + ox + len, y + oy); g.stroke(); } } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/** a smooth ocean swell: returns [body, foam] meshes — a long low mound of water and a thin foam line on its crest */
export function swell(w) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffffff)); m.scale.set(w / 2, 0.62, 2.3);
  const f = new THREE.Mesh(new THREE.SphereGeometry(1, 5, 2, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf2f8fc)); f.scale.set(w * 0.22, 0.1, 0.22); f.position.set(w * 0.04, 0.56, -0.2);
  return [m, f];
}
export { grain };
