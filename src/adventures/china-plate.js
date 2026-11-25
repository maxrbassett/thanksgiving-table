// The plate itself: a 2D "decorate your plate" mini-game whose drawing becomes the texture of the 3D plate.
import { THREE } from '../core/kit.js';

export const INKS = ['#1f4fa8', '#c0392b', '#2e8b57', '#d49a17', '#7b4fb0'];
export const STAMPS = ['flower', 'leaf', 'dot', 'heart', 'star', 'ring'];
const TAU = Math.PI * 2;

/** draw one motif at the origin, "up" (−y) pointing to the plate's edge. s = size in px. */
export function motif(g, k, s, col) {
  g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  if (k === 'flower') {
    for (let i = 0; i < 5; i++) { g.save(); g.rotate(i * TAU / 5); g.beginPath(); g.ellipse(0, -s * 0.56, s * 0.3, s * 0.5, 0, 0, TAU); g.fill(); g.restore(); }
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, s * 0.27, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(0, 0, s * 0.13, 0, TAU); g.fill();
  } else if (k === 'leaf') {
    g.beginPath(); g.moveTo(0, s); g.quadraticCurveTo(s * 0.75, 0, 0, -s); g.quadraticCurveTo(-s * 0.75, 0, 0, s); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = s * 0.1; g.beginPath(); g.moveTo(0, s * 0.6); g.lineTo(0, -s * 0.55); g.stroke();
  } else if (k === 'dot') {
    g.beginPath(); g.arc(0, 0, s * 0.42, 0, TAU); g.fill();
  } else if (k === 'heart') {
    const h = s * 0.95; g.beginPath(); g.moveTo(0, h * 0.85); g.bezierCurveTo(-h * 1.5, -h * 0.2, -h * 0.55, -h * 1.15, 0, -h * 0.4); g.bezierCurveTo(h * 0.55, -h * 1.15, h * 1.5, -h * 0.2, 0, h * 0.85); g.fill();
  } else if (k === 'star') {
    g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.45 : s, a = i * TAU / 10 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
  } else if (k === 'ring') {
    g.lineWidth = s * 0.22; g.beginPath(); g.arc(0, s * 0.1, s * 0.7, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  }
}
/** how many times a stamp repeats round the plate at radius r (0..1) */
export const repeats = (k, r) => r < 0.13 ? 1 : k === 'dot' ? (r < 0.5 ? 8 : 16) : (r < 0.5 ? 6 : 8);

/** draw all the decoration (ops) on a W×W canvas; the plate edge is at 0.96·W/2 from the centre. */
export function drawOps(g, W, ops) {
  const c = W / 2, R = c * 0.96, s0 = W * 0.052;
  for (const o of ops) {
    if (o.k === 'ring') { g.strokeStyle = o.c; g.lineWidth = W * 0.016; g.beginPath(); g.arc(c, c, Math.max(0.05, o.r) * R, 0, TAU); g.stroke(); continue; }
    const n = repeats(o.k, o.r), s = n === 1 ? s0 * 1.9 : s0 * (o.r < 0.5 ? 0.8 : 1);
    for (let i = 0; i < n; i++) { const a = o.a + i * TAU / n; g.save(); g.translate(c + Math.cos(a) * o.r * R, c + Math.sin(a) * o.r * R); g.rotate(n === 1 ? 0 : a + Math.PI / 2); motif(g, o.k, s, o.c); g.restore(); }
  }
}
/** the plate as seen from above, for the mini-game */
export function drawPlate2D(g, W, ops, ghost) {
  const c = W / 2, R = c * 0.96; g.clearRect(0, 0, W, W);
  g.save(); g.shadowColor = 'rgba(74,44,23,.35)'; g.shadowBlur = W * 0.03; g.shadowOffsetY = W * 0.012; g.fillStyle = '#fdfdf8'; g.beginPath(); g.arc(c, c, R * 0.985, 0, TAU); g.fill(); g.restore();
  const gr = g.createRadialGradient(c, c, R * 0.55, c, c, R * 0.68); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(90,80,60,.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(c, c, R * 0.985, 0, TAU); g.clip(); drawOps(g, W, ops); if (ghost) { g.globalAlpha = 0.4; drawOps(g, W, [ghost]); } g.restore();
  g.strokeStyle = '#d9d4c6'; g.lineWidth = W * 0.006; g.beginPath(); g.arc(c, c, R * 0.985, 0, TAU); g.stroke();
}
/** the texture that wraps the 3D plate (white porcelain + the decoration) */
export function drawPlateTex(g, W, ops, tint = '#fdfdf8') {
  g.fillStyle = tint; g.fillRect(0, 0, W, W);
  const c = W / 2, R = c * 0.96; g.save(); g.beginPath(); g.arc(c, c, R * 0.99, 0, TAU); g.clip(); drawOps(g, W, ops); g.restore();
}
/** a ready-made pretty design (also used when the player presses the dice) */
export function surprise(rnd = Math.random) {
  const p = (a) => a[Math.floor(rnd() * a.length)], c1 = p(INKS), c2 = p(INKS.filter(c => c !== c1)), a = rnd() * TAU;
  const rim = p(['flower', 'heart', 'star', 'leaf']), mid = p(['leaf', 'dot', 'dot']);
  return [{ k: 'ring', c: c1, r: 0.95, a: 0 }, { k: 'ring', c: c1, r: 0.63, a: 0 }, { k: rim, c: c1, r: 0.8, a }, { k: mid === rim ? 'dot' : mid, c: c2, r: 0.8, a: a + TAU / 16 }, { k: 'dot', c: c2, r: 0.3, a }, { k: p(['flower', 'star', 'heart']), c: c1, r: 0, a: 0 }];
}
export const classic = () => [{ k: 'ring', c: INKS[0], r: 0.95, a: 0 }, { k: 'ring', c: INKS[0], r: 0.63, a: 0 }, { k: 'flower', c: INKS[0], r: 0.8, a: 0 }, { k: 'leaf', c: INKS[0], r: 0.8, a: TAU / 16 }, { k: 'flower', c: INKS[0], r: 0, a: 0 }];

/** 3D plate whose top is wrapped with a canvas texture. Returns { obj (Group), mesh, mat, tex, canvas, paint(ops, tint) } */
export function makePlate(R = 0.42, res = 512) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = res;
  const g2 = canvas.getContext('2d'); drawPlateTex(g2, res, []);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const prof = [[0, 0.034], [0.56, 0.034], [0.67, 0.052], [0.98, 0.112], [1, 0.104], [0.67, 0.03], [0.5, 0], [0.4, 0], [0.38, 0.02], [0, 0.02]];
  const TOP = 4; // profile points 0..3 are the decorated top
  const geo = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(Math.max(0.0001, p[0] * R), p[1] * R / 0.42)), 28);
  const pos = geo.attributes.position, uv = geo.attributes.uv, n = prof.length;
  for (let i = 0; i < pos.count; i++) { const j = i % n; if (j < TOP) uv.setXY(i, 0.5 + pos.getX(i) / R * 0.48, 0.5 - pos.getZ(i) / R * 0.48); else uv.setXY(i, 0.008, 0.008); }
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhongMaterial({ map: tex, side: THREE.DoubleSide, shininess: 8, specular: 0x222222 });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true;
  const obj = new THREE.Group(); obj.add(mesh);
  return { obj, mesh, mat, tex, canvas, R, paint(ops, tint) { drawPlateTex(g2, res, ops, tint); tex.needsUpdate = true; } };
}

/** open the decorating mini-game. Resolves with the list of stamps (never empty). */
export function openDesigner(ctx, start = []) {
  return new Promise((resolve) => {
    const E = (s) => '<span class="em">' + s + '</span>';
    const short = window.innerHeight < 480 && window.innerWidth > window.innerHeight, wide = short && window.innerWidth >= 800;   // a phone held sideways: short and wide
    // an upright phone whose browser bars leave little height: the six stamps go in one row of smaller buttons and "Done" joins the undo row, so nothing has to be shrunk
    const compact = !short && window.innerWidth < 520 && window.innerHeight < 800, B = Math.max(40, Math.min(58, Math.floor((Math.min(window.innerWidth * 0.94, 820) - 44 - 30) / 6)));
    const css = '<style>.cpw{display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap}' +
      '.cpw canvas.pl{width:min(400px,58vh,78vw);aspect-ratio:1;cursor:pointer;touch-action:none;border-radius:50%}' +
      '.cpt{display:flex;flex-direction:column;gap:14px;align-items:center}.cpg{display:grid;grid-template-columns:repeat(3,58px);gap:9px}' +
      '.cpb{width:58px;height:58px;border-radius:16px;background:#fff;box-shadow:0 3px 0 rgba(74,44,23,.25);display:flex;align-items:center;justify-content:center;font-size:26px;padding:0}' +
      '.cpb canvas{width:44px;height:44px}.cpb.on{outline:4px solid #ffc93c}.cpr{display:flex;gap:9px;align-items:center}' +
      '.cpc{width:40px;height:40px;border-radius:50%;box-shadow:0 3px 0 rgba(74,44,23,.25);padding:0}.cpc.on{outline:4px solid #ffc93c;outline-offset:2px}' +
      // sideways phone: the plate takes the full height on the left; the title, the stamps (in one row when there is room), the colours and the buttons stand in a column on the right
      (short ? '.cpw{flex-wrap:nowrap}.cpw canvas.pl{width:' + Math.max(200, Math.min(400, window.innerHeight - 64)) + 'px;flex:none}.cpt{gap:' + (wide ? 12 : 8) + 'px}' + (wide ? '.cpg{grid-template-columns:repeat(6,58px)}' : '') : '') +
      (compact ? '.cpg{grid-template-columns:repeat(6,' + B + 'px);gap:6px}.cpb{width:' + B + 'px;height:' + B + 'px;border-radius:13px}.cpb canvas{width:' + (B - 12) + 'px;height:' + (B - 12) + 'px}.cpt{gap:12px}' : '') + '</style>';
    const title = (fs, mb) => '<div style="font-size:' + fs + 'px;font-weight:700;margin-bottom:' + mb + 'px">' + E('🎨') + ' Decorate your plate!</div>';
    const hintLine = (fs, mt) => '<div style="opacity:.75;margin-top:' + mt + 'px;font-size:' + fs + 'px">' + E('👆') + ' Tap the plate — your stamp repeats all around</div>';
    const actions = '<button class="btn cpb" id="cp-undo" title="Undo">' + E('↩️') + '</button><button class="btn cpb" id="cp-dice" title="Surprise me">' + E('🎲') + '</button><button class="btn cpb" id="cp-clear" title="Start again">' + E('🧽') + '</button>';
    const doneBtn = '<button class="btn big" id="cp-done"' + (short || compact ? ' style="white-space:nowrap;padding:10px ' + (compact ? 16 : 24) + 'px' + (compact ? ';font-size:21px' : '') + (wide || compact ? ';margin-left:' + (compact ? 4 : 12) + 'px' : '') + '"' : '') + '>' + E('✅') + ' Done</button>';
    const panel = ctx.ui.panel(css + (short ? '' : title(27, 10)) +
      '<div class="cpw"><canvas class="pl" id="cp-plate" width="560" height="560"></canvas><div class="cpt">' + (short ? title(wide ? 25 : 22, 0) : '') +
      '<div class="cpg" id="cp-tools"></div><div class="cpr" id="cp-inks"></div>' +
      '<div class="cpr">' + actions + (wide || compact ? doneBtn : '') + '</div>' + (wide ? hintLine(16, 0) : compact ? '' : doneBtn) + '</div></div>' +
      (short || (compact && window.innerHeight < 700) ? '' : hintLine(compact ? 15 : 17, 10)));
    // on a touch screen the tap that opened this pop-up is followed by a "click" at the same spot, which would press whatever button has just appeared under the finger: clicks are ignored for the first moment
    const born = performance.now(); panel.el.addEventListener('click', (e) => { if (performance.now() - born < 450) { e.stopPropagation(); e.preventDefault(); } }, true);
    const el = panel.el, cv = el.querySelector('#cp-plate'), g = cv.getContext('2d'), W = cv.width;
    let ops = start.slice(), tool = 'flower', ink = INKS[0], ghost = null;
    const redraw = () => drawPlate2D(g, W, ops, ghost);
    const tools = el.querySelector('#cp-tools'), inks = el.querySelector('#cp-inks');
    const paintTools = () => { tools.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.k === tool); const c = b.firstChild, cg = c.getContext('2d'); cg.clearRect(0, 0, 88, 88); cg.save(); cg.translate(44, 44); if (b.dataset.k === 'ring') { cg.strokeStyle = ink; cg.lineWidth = 7; cg.beginPath(); cg.arc(0, 0, 30, 0, TAU); cg.stroke(); } else motif(cg, b.dataset.k, 30, ink); cg.restore(); }); inks.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c === ink)); };
    for (const k of STAMPS) { const b = document.createElement('button'); b.className = 'btn cpb'; b.dataset.k = k; b.id = 'cp-tool-' + k; const c = document.createElement('canvas'); c.width = c.height = 88; b.appendChild(c); b.onclick = () => { tool = k; ctx.audio.play('click'); paintTools(); }; tools.appendChild(b); }
    for (const c of INKS) { const b = document.createElement('button'); b.className = 'btn cpc'; b.dataset.c = c; b.style.background = c; b.onclick = () => { ink = c; ctx.audio.play('click'); paintTools(); }; inks.appendChild(b); }
    const at = (ev) => { const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 2 - 1, y = (ev.clientY - r.top) / r.height * 2 - 1; let rr = Math.hypot(x, y) / 0.96; if (rr > 1.02) return null; rr = Math.min(0.95, rr); if (tool !== 'ring' && rr > 0.88) rr = 0.88; return { k: tool, c: ink, r: rr < 0.13 && tool !== 'ring' ? 0 : rr, a: Math.atan2(y, x) }; };
    cv.addEventListener('pointermove', (ev) => { ghost = at(ev); redraw(); });
    cv.addEventListener('pointerleave', () => { ghost = null; redraw(); });
    cv.addEventListener('pointerdown', (ev) => { ev.preventDefault(); const o = at(ev); if (!o) return; if (ops.length < 60) ops.push(o); ghost = null; ctx.audio.play('pop'); redraw(); });
    el.querySelector('#cp-undo').onclick = () => { ops.pop(); ctx.audio.play('click'); redraw(); };
    el.querySelector('#cp-clear').onclick = () => { ops = []; ctx.audio.play('whoosh'); redraw(); };
    el.querySelector('#cp-dice').onclick = () => { ops = surprise(); ctx.audio.play('sparkle'); redraw(); };
    el.querySelector('#cp-done').onclick = () => { if (!ops.length) ops = classic(); ctx.audio.play('success'); panel.close(); resolve(ops); };
    ctx.chinaDebug = Object.assign(ctx.chinaDebug || {}, { design: { count: () => ops.length, ops: () => ops.map(o => [o.k, +o.r.toFixed(3)]) } });   // for the scripted play-through
    paintTools(); redraw();
  });
}
