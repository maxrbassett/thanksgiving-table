// Pumpkin Pie — the little games inside the steps: milking (left hand, right hand), catching the spice sacks on deck, and rolling the crust (hold, let go in the green).
// Each opens a ctx.ui.panel, runs on game time (ctx.onUpdate) and resolves once the player has won. A wrong try only nudges — nobody can get stuck.
// Keys and panel buttons both work, so the games play on a touch screen too.

const EM = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
const FONT = "Fredoka,'Nunito','Segoe UI',sans-serif";   // single quotes inside: this string also goes into style="…" attributes
// Layout. Upright / desktop: the picture on top, the buttons in a row below. A phone held sideways (short and wide): the buttons move beside the picture —
// one under each thumb — and the picture is sized by the screen height, so the whole game fits without being shrunk.
const SIDE = '@media (max-height:480px) and (orientation:landscape)';
const CSS = '<style>.pg{display:grid;grid-template-columns:1fr 1fr;grid-template-areas:"cv cv" "l r";row-gap:12px;align-items:center}.pg canvas{grid-area:cv}.pg .pgL{grid-area:l;justify-self:end;margin-right:60px}.pg .pgR{grid-area:r;justify-self:start;margin-left:60px}.pg .pgC{grid-area:l/l/r/r;justify-self:center}' +
  '.pg button{touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}' +
  SIDE + '{.pg{grid-template-columns:auto auto auto;grid-template-areas:"l cv r";column-gap:16px;row-gap:0}.pg .pgL,.pg .pgR{margin:0}.pg.one{grid-template-columns:auto auto;grid-template-areas:"cv r"}.pg .pgC{grid-area:r}.pg canvas{width:min(58vw,var(--mw),calc((100vh - 104px)*var(--ar)))!important}.pgT{margin-bottom:4px!important}}</style>';
const roundBtn = (id, emoji, bg, shadow, flip, side) => '<button id="' + id + '" class="btn ' + side + '" oncontextmenu="return false" style="font-size:44px;width:96px;height:96px;border-radius:50%;border:0;background:' + bg + ';box-shadow:0 5px 0 ' + shadow + ';cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;line-height:1"><span class="em" style="display:inline-block' + (flip ? ';transform:scaleX(-1)' : '') + '">' + emoji + '</span></button>';
const title = (emoji, text) => CSS + '<div class="pgT" style="font:800 clamp(18px,5.2vw,26px) ' + FONT + ';color:#4a2c17;margin:-2px 0 8px;display:flex;gap:8px;justify-content:center;align-items:center;white-space:nowrap"><span class="em" style="font-size:1.3em">' + emoji + '</span><span>' + text + '</span></div>';
const canvasTag = (id, W, H, maxW) => '<canvas id="' + id + '" width="' + W + '" height="' + H + '" style="--mw:' + maxW + 'px;--ar:' + (W / H).toFixed(3) + ';width:min(84vw,' + maxW + 'px);height:auto;display:block;margin:0 auto;border-radius:18px;touch-action:none"></canvas>';
/** key presses while a panel is open: edge (pressed this frame) and held state. Removed with stop(). */
function keyWatch() {
  const held = new Set(), pressed = [];
  const norm = (e) => e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const down = (e) => { if (e.repeat) return; const k = norm(e); held.add(k); pressed.push(k); };
  const up = (e) => held.delete(norm(e)); const blur = () => held.clear();
  window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
  return { held, pressed, take: () => pressed.splice(0), stop: () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); } };
}
const isUse = (k) => k === 'e' || k === ' ' || k === 'Enter';
const seededRnd = (n) => () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
const rr = (g, x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); g.fill(); };

/**
 * Milking: squeeze with the left hand, then the right, then the left … each squeeze squirts milk into the pail.
 * Keys A / ← and D / → (E or Space squeezes with whichever hand is next); or tap the two hand buttons. The hand to use next glows.
 * Resolves when the pail is full (N squirts, ~12–18 s). o.onSquirt(i, n) lets the 3D pail fill up as well.
 */
export function milkGame(ctx, o = {}) {
  const N = o.n || 12;
  return new Promise(res => {
    const W = 440, H = 230;
    const p = ctx.ui.panel(title('🐄', 'Left, right, left, right!') + '<div class="pg">' + canvasTag('mkCanvas', W, H, 440) + roundBtn('mkL', '✋', '#ffd9a8', '#d9a066', true, 'pgL') + roundBtn('mkR', '✋', '#ffd9a8', '#d9a066', false, 'pgR') + '</div>');
    const $ = (id) => p.el.querySelector('#' + id), cv = $('mkCanvas'), g = cv.getContext('2d'), keys = keyWatch();
    const s = { n: 0, next: 0, jets: [], drops: [], wiggle: 0, hintT: 0, t: 0, done: false, last: -9 };   // next: 0 = left hand, 1 = right hand
    const PAIL = { x: W / 2, top: 128, bot: 214, wTop: 150, wBot: 118 }, TEAT = [W / 2 - 34, W / 2 + 34];
    const squeeze = (hand) => {
      if (s.done) return;
      if (hand !== s.next) { s.wiggle = 0.35; s.hintT = 1.1; ctx.audio.play('click'); return; }    // same hand twice: a little wiggle, the other hand glows — no penalty
      s.n++; s.next = 1 - s.next; s.last = s.t; s.jets.push({ x: TEAT[hand], t: 0 }); ctx.audio.play('water');
      for (let i = 0; i < 5; i++) s.drops.push({ x: TEAT[hand] + (Math.random() - 0.5) * 30, y: PAIL.top + 2, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 60, t: 0.45 });
      o.onSquirt && o.onSquirt(s.n, N);
      if (s.n >= N) { s.done = true; ctx.audio.play('success'); ctx.after(0.9, () => { stop(); keys.stop(); p.close(); res(); }); }
    };
    $('mkL').onpointerdown = (e) => { e.preventDefault(); squeeze(0); }; $('mkR').onpointerdown = (e) => { e.preventDefault(); squeeze(1); };   // (preventDefault: the button takes no focus, so Space / Enter stay with the keys)
    const draw = () => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#f6ead0'; g.fillRect(0, 0, W, H);
      // the cow's belly and udder
      g.fillStyle = '#fafafa'; g.beginPath(); g.ellipse(W / 2, -40, 230, 120, 0, 0, 7); g.fill();
      g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(90, 30, 40, 22, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(360, 40, 34, 18, -0.4, 0, 7); g.fill();
      g.fillStyle = '#f5b8c4'; g.beginPath(); g.ellipse(W / 2, 76, 78, 30, 0, 0, 7); g.fill();
      for (let k = 0; k < 2; k++) { const sq = s.jets.some(j => Math.abs(j.x - TEAT[k]) < 1 && j.t < 0.12); g.fillStyle = '#f2a3b3'; rr(g, TEAT[k] - 9, 84, 18, sq ? 26 : 32, 8); }
      // the pail, its milk
      const lvl = Math.min(1, s.n / N), mt = PAIL.bot - (PAIL.bot - PAIL.top - 8) * lvl;
      g.fillStyle = '#9aa3ab'; g.beginPath(); g.moveTo(PAIL.x - PAIL.wTop / 2, PAIL.top); g.lineTo(PAIL.x + PAIL.wTop / 2, PAIL.top); g.lineTo(PAIL.x + PAIL.wBot / 2, PAIL.bot); g.lineTo(PAIL.x - PAIL.wBot / 2, PAIL.bot); g.closePath(); g.fill();
      if (lvl > 0) { const wAt = (y) => PAIL.wBot + (PAIL.wTop - PAIL.wBot) * (PAIL.bot - y) / (PAIL.bot - PAIL.top); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(PAIL.x - wAt(mt) / 2 + 5, mt); g.lineTo(PAIL.x + wAt(mt) / 2 - 5, mt); g.lineTo(PAIL.x + PAIL.wBot / 2 - 5, PAIL.bot - 4); g.lineTo(PAIL.x - PAIL.wBot / 2 + 5, PAIL.bot - 4); g.closePath(); g.fill(); }
      g.strokeStyle = '#555f68'; g.lineWidth = 5; g.beginPath(); g.moveTo(PAIL.x - PAIL.wTop / 2, PAIL.top); g.lineTo(PAIL.x + PAIL.wTop / 2, PAIL.top); g.stroke();
      g.strokeStyle = '#6d7a86'; g.lineWidth = 4; g.beginPath(); g.arc(PAIL.x, PAIL.top + 10, PAIL.wTop / 2 + 4, Math.PI * 1.05, Math.PI * 1.95); g.stroke();   // handle
      // milk jets and drops
      g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.lineCap = 'round';
      for (const j of s.jets) { const f = Math.min(1, j.t / 0.22); g.beginPath(); g.moveTo(j.x, 116); g.quadraticCurveTo(j.x + (PAIL.x - j.x) * 0.3, 116 + (mt - 116) * 0.6 * f, j.x + (PAIL.x - j.x) * 0.5 * f, 116 + (mt - 116) * f); g.stroke(); }
      g.fillStyle = '#ffffff'; for (const d of s.drops) { g.beginPath(); g.arc(d.x, d.y, 3.5, 0, 7); g.fill(); }
      // dots: one per squirt
      for (let i = 0; i < N; i++) { g.fillStyle = i < s.n ? '#5ad17a' : '#e0d2b4'; g.beginPath(); g.arc(W / 2 - (N - 1) * 9 + i * 18, H - 8, 5, 0, 7); g.fill(); }
      const word = s.done ? 'Full!' : s.hintT > 0 ? 'Other hand!' : '';
      if (word) { g.font = '800 36px ' + FONT; g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#4a2c17'; g.lineWidth = 7; g.strokeText(word, W / 2 - (s.done ? 20 : 0), 44); g.fillStyle = '#fff8e8'; g.fillText(word, W / 2 - (s.done ? 20 : 0), 44); if (s.done) { g.font = '36px ' + EM; g.fillText('🥛', W / 2 + 48, 44); } }
    };
    const stop = ctx.onUpdate((dt) => {
      s.t += dt; if (s.wiggle > 0) s.wiggle -= dt; if (s.hintT > 0) s.hintT -= dt;
      for (const k of keys.take()) { if (k === 'a' || k === 'ArrowLeft') squeeze(0); else if (k === 'd' || k === 'ArrowRight') squeeze(1); else if (isUse(k)) squeeze(s.next); }
      for (const j of s.jets) j.t += dt; s.jets = s.jets.filter(j => j.t < 0.3);
      for (const d of s.drops) { d.t -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 400 * dt; } s.drops = s.drops.filter(d => d.t > 0);
      const pulse = 1 + Math.max(0, Math.sin(s.t * 8)) * 0.12;
      for (let k = 0; k < 2; k++) { const b = $(k ? 'mkR' : 'mkL'); if (!b) return; const nxt = !s.done && s.next === k;
        b.style.transform = nxt ? 'scale(' + pulse + ')' : (s.wiggle > 0 ? 'rotate(' + Math.sin(s.wiggle * 40) * 8 + 'deg)' : ''); b.style.outline = nxt ? '6px solid #ffb347' : 'none'; b.style.opacity = nxt || s.done ? '1' : '0.75'; }
      p.el.dataset.next = s.done ? '' : (s.next ? 'R' : 'L'); p.el.dataset.n = s.n;
      draw();
    });
    draw();
  });
}

/**
 * Rolling the crust: hold the button (or E / Space) and the pin rolls the dough wider and thinner; let go when the dough fills the dish ring.
 * Too small → "More!" and you carry on; rolled past the ring → it gets too thin and tears, so it springs back into a ball and you try again.
 * After three torn tries the green band gets wider. Resolves on success (~10–25 s). o.onSize(f) reports dough size 0..1+ for the 3D dough, o.onRoll(holding) the pin.
 */
export function rollGame(ctx, o = {}) {
  return new Promise(res => {
    const W = 440, H = 300, CX = W / 2, CY = 146, R = 98, R0 = 36;
    const p = ctx.ui.panel(title('🥖', 'Hold to roll. Stop in green!') + '<div class="pg one">' + canvasTag('rlCanvas', W, H, 440) +
      '<button id="rlBtn" class="btn big pgC" oncontextmenu="return false" style="font-size:28px;padding:14px 44px;white-space:nowrap"><span class="em">🥖</span> Roll</button></div>');
    const $ = (id) => p.el.querySelector('#' + id), cv = $('rlCanvas'), g = cv.getContext('2d'), keys = keyWatch(), btn = $('rlBtn');
    const s = { r: R0, holding: false, btnDown: false, armed: true, t: 0, msg: '', msgT: 0, fails: 0, done: false, pinY: 0, flour: [], tearT: 0 };
    const band = () => s.fails >= 3 ? [R - 20, R + 20] : [R - 12, R + 12];
    const say = (m) => { s.msg = m; s.msgT = 1.6; };
    const down = (e) => { e.preventDefault(); s.btnDown = true; }, up = () => { s.btnDown = false; };
    btn.onpointerdown = down; btn.onpointerup = up; btn.onpointercancel = up; btn.onpointerleave = up; btn.onclick = (e) => { e.preventDefault(); };
    const finish = () => { s.done = true; ctx.audio.play('success'); say('Just right!'); o.onSize && o.onSize(1); ctx.after(0.9, () => { stop(); keys.stop(); p.close(); res(); }); };
    const release = () => { const [lo, hi] = band(); if (s.r >= lo && s.r <= hi) finish(); else if (s.r < lo) { say('More!'); ctx.audio.play('click'); } else tear(); };
    const tear = () => { s.fails++; s.armed = false; s.tearT = 0.6; say('Too thin! Again'); ctx.audio.play('error'); };   // shown torn for a moment, then it springs back into a ball
    const draw = () => {
      const [lo, hi] = band();
      g.clearRect(0, 0, W, H); g.fillStyle = '#c9a26b'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(110,74,40,.35)'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * H / 4); g.lineTo(W, i * H / 4); g.stroke(); }
      g.fillStyle = '#fff'; for (const f of s.flour) { g.globalAlpha = 0.6; g.beginPath(); g.arc(f[0], f[1], 2, 0, 7); g.fill(); } g.globalAlpha = 1;
      // the dish ring: green where it is just right, a red edge where it gets too thin
      g.fillStyle = 'rgba(70,190,90,.42)'; g.beginPath(); g.arc(CX, CY, hi, 0, 7); g.arc(CX, CY, lo, 0, 7, true); g.fill();
      g.strokeStyle = 'rgba(220,70,50,.55)'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(CX, CY, R + 24, 0, 7); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#6e6e6a'; g.lineWidth = 4; g.beginPath(); g.arc(CX, CY, R, 0, 7); g.stroke();
      // the dough
      const thin = Math.max(0, (s.r - R0) / (R + 24 - R0)); g.fillStyle = s.done ? '#f4e2b6' : 'rgb(' + Math.round(240 - thin * 10) + ',' + Math.round(220 + thin * 8) + ',' + Math.round(174 + thin * 30) + ')';
      g.beginPath(); g.ellipse(CX, CY, s.r, s.r * 0.96, 0, 0, 7); g.fill(); g.strokeStyle = '#d8bf86'; g.lineWidth = 3; g.stroke();
      if (s.tearT > 0) { g.fillStyle = '#c9a26b'; for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.9; g.beginPath(); g.moveTo(CX + Math.cos(a) * s.r * 0.15, CY + Math.sin(a) * s.r * 0.15); g.lineTo(CX + Math.cos(a - 0.13) * (s.r + 4), CY + Math.sin(a - 0.13) * (s.r + 4)); g.lineTo(CX + Math.cos(a + 0.13) * (s.r + 4), CY + Math.sin(a + 0.13) * (s.r + 4)); g.closePath(); g.fill(); } }   // torn open
      else if (s.r > R + 14 && !s.done) { g.strokeStyle = 'rgba(201,162,107,.8)'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; g.beginPath(); g.moveTo(CX + Math.cos(a) * s.r * 0.3, CY + Math.sin(a) * s.r * 0.3); g.lineTo(CX + Math.cos(a + 0.3) * s.r * 0.7, CY + Math.sin(a + 0.3) * s.r * 0.7); g.stroke(); } }   // little cracks: getting too thin
      // the rolling pin
      const on = s.holding && !s.done, py = on ? CY + s.pinY : 30, pw = on ? s.r + 70 : 66, px = on ? CX : W - 110;
      g.fillStyle = '#8a5a2b'; rr(g, px - pw - 28, py - 7, 30, 14, 7); rr(g, px + pw - 2, py - 7, 30, 14, 7);
      g.fillStyle = '#e0b878'; rr(g, px - pw, py - 16, pw * 2, 32, 14); g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, px - pw + 8, py - 11, pw * 2 - 16, 8, 4);
      // words
      if (s.msgT > 0 || s.done) { g.font = '800 30px ' + FONT; g.textAlign = 'center'; g.fillStyle = '#fff8e8'; g.strokeStyle = '#4a2c17'; g.lineWidth = 6; g.lineJoin = 'round'; g.strokeText(s.msg, CX, H - 16); g.fillText(s.msg, CX, H - 16); }
      if (s.done) { g.font = '44px ' + EM; g.fillText('✅', CX, CY + 16); }
    };
    const stop = ctx.onUpdate((dt) => {
      s.t += dt; if (s.msgT > 0) s.msgT -= dt; keys.take();
      const want = (s.btnDown || [...keys.held].some(isUse)) && !s.done;
      if (!want) s.armed = true;   // after a tear you must let go before rolling again (so a held key does not roll straight on)
      const holding = want && s.armed && s.tearT <= 0;
      if (s.tearT > 0) { s.tearT -= dt; if (s.tearT <= 0) { s.r = R0; s.flour = []; o.onSize && o.onSize(0); } }
      else if (holding) { s.r += dt * 19; s.pinY = Math.sin(s.t * 7) * s.r * 0.72; if (s.t % 0.1 < dt && s.flour.length < 40) s.flour.push([CX + (Math.random() - 0.5) * 2.4 * s.r, CY + (Math.random() - 0.5) * 2.2 * s.r]); o.onSize && o.onSize((s.r - R0) / (R - R0)); if (s.r > R + 24) tear(); }
      else if (s.holding && !s.done) release();
      if (holding !== s.holding) { s.holding = holding; o.onRoll && o.onRoll(holding); }
      btn.style.transform = holding ? 'scale(.94)' : ''; btn.style.filter = holding ? 'brightness(1.1)' : '';
      p.el.dataset.r = (s.r / R).toFixed(2); p.el.dataset.band = band().map(v => (v / R).toFixed(2)).join(',');
      draw();
    });
    draw();
  });
}

/**
 * Catching the sacks: the dock crew tosses the spice sacks up to the deck; a shadow shows where each one will land — get there and catch it.
 * Keys A / ← and D / → (or hold the two arrow buttons, or tap the deck where you want to stand). A missed sack bounces and is tossed again.
 * Resolves when N sacks are caught (~12–25 s). o.onCatch(i) lets the 3D sack hop aboard too.
 */
export function catchGame(ctx, o = {}) {
  const N = o.n || 4;
  return new Promise(res => {
    const W = 440, H = 300, DECK = 232, X0 = 130, X1 = 410, SP = 270;
    const p = ctx.ui.panel(title('📦', 'Catch the sacks!') + '<div class="pg">' + canvasTag('ctCanvas', W, H, 440) + roundBtn('ctL', '⬅️', '#bfe0f5', '#7fb0d0', false, 'pgL') + roundBtn('ctR', '➡️', '#bfe0f5', '#7fb0d0', false, 'pgR') + '</div>');
    const $ = (id) => p.el.querySelector('#' + id), cv = $('ctCanvas'), g = cv.getContext('2d'), keys = keyWatch();
    const s = { px: 270, n: 0, sack: null, t: 0, wait: 0.8, msg: '', msgT: 0, done: false, dir: 0, tap: null, rnd: seededRnd(o.seed || 7) };
    const throwOne = () => { const tx = X0 + 30 + s.rnd() * (X1 - X0 - 60); s.sack = { x: 30, y: 190, tx, ty: DECK, t: 0, dur: 1.7 }; ctx.audio.play('whoosh'); };
    const say = (m) => { s.msg = m; s.msgT = 1.2; };
    for (const [id, d] of [['ctL', -1], ['ctR', 1]]) { const b = $(id); b.onpointerdown = (e) => { e.preventDefault(); s.dir = d; }; b.onpointerup = b.onpointercancel = b.onpointerleave = () => { if (s.dir === d) s.dir = 0; }; }
    cv.onpointerdown = (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); s.tap = (e.clientX - r.left) / r.width * W; };
    const sackAt = (x, y, sc = 1) => { g.fillStyle = '#d8c39a'; rr(g, x - 16 * sc, y - 34 * sc, 32 * sc, 34 * sc, 8 * sc); g.fillStyle = '#7a4a2a'; rr(g, x - 16 * sc, y - 22 * sc, 32 * sc, 6 * sc, 2); g.fillStyle = '#c9b088'; rr(g, x - 8 * sc, y - 40 * sc, 16 * sc, 8 * sc, 4 * sc); };
    const draw = () => {
      g.clearRect(0, 0, W, H); const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#9fd4f5'); sky.addColorStop(1, '#dff3ff'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = '#2f8fd0'; g.fillRect(0, 150, W, H - 150); g.fillStyle = '#dff3ff'; for (let i = 0; i < 6; i++) rr(g, 20 + i * 75 + Math.sin(s.t + i) * 6, 160 + (i % 3) * 22, 34, 4, 2);
      g.fillStyle = '#8a5a2b'; g.fillRect(0, 120, 95, 14); for (let i = 0; i < 2; i++) g.fillRect(12 + i * 60, 134, 10, 70); g.fillStyle = '#6e4a28'; g.fillRect(0, 200, 95, 10);   // the pier
      g.fillStyle = '#6e4a28'; g.beginPath(); g.moveTo(X0 - 40, DECK); g.lineTo(W, DECK); g.lineTo(W, H); g.lineTo(X0 - 10, H); g.closePath(); g.fill(); g.fillStyle = '#c9a26b'; g.fillRect(X0 - 40, DECK, W, 12);   // the ship's side and deck
      g.fillStyle = '#555f68'; g.fillRect(X0 - 40, DECK - 22, W, 8); g.fillStyle = '#fafafa'; g.fillRect(X1 + 4, 40, 6, DECK - 62); g.fillStyle = '#d9483b'; g.beginPath(); g.moveTo(X1 + 10, 44); g.lineTo(X1 + 40, 54); g.lineTo(X1 + 10, 64); g.fill();   // rail, mast, flag
      for (let i = 0; i < s.n; i++) sackAt(W - 30 - i * 14, DECK + 2 - (i % 2) * 0, 0.55);   // the caught sacks, stacked by the rail
      // crew on the pier: a dock worker with arms up
      g.fillStyle = '#3f7fd1'; rr(g, 38, 150, 24, 40, 6); g.fillStyle = '#f2c29b'; g.beginPath(); g.arc(50, 138, 13, 0, 7); g.fill(); g.strokeStyle = '#f2c29b'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, 156); g.lineTo(24, 132); g.moveTo(60, 156); g.lineTo(76, 132); g.stroke();
      const sk = s.sack;
      if (sk && !s.done) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(sk.tx, DECK + 4, 26, 7, 0, 0, 7); g.fill(); }   // where it will land
      // the catcher: a child with open arms, feet on the deck
      const px = s.px; g.fillStyle = '#f2c43d'; rr(g, px - 14, DECK - 52, 28, 36, 6); g.fillStyle = '#3f7fd1'; rr(g, px - 13, DECK - 18, 11, 18, 3); rr(g, px + 2, DECK - 18, 11, 18, 3); g.fillStyle = '#e0ac84'; g.beginPath(); g.arc(px, DECK - 66, 15, 0, 7); g.fill(); g.fillStyle = '#3a2418'; g.beginPath(); g.arc(px, DECK - 72, 15, Math.PI, 7); g.fill();
      g.strokeStyle = '#e0ac84'; g.lineWidth = 7; g.beginPath(); g.moveTo(px - 12, DECK - 46); g.lineTo(px - 30, DECK - 70); g.moveTo(px + 12, DECK - 46); g.lineTo(px + 30, DECK - 70); g.stroke();
      if (sk && !s.done) { const f = Math.min(1, sk.t / sk.dur), x = sk.x + (sk.tx - sk.x) * f, y = sk.y + (sk.ty - sk.y) * f - Math.sin(f * Math.PI) * 150; sackAt(x, y + (sk.bounce ? -Math.abs(Math.sin(sk.t * 9)) * 20 * (1 - Math.min(1, (sk.t - sk.dur) / 0.6)) : 0)); }
      for (let i = 0; i < N; i++) { g.fillStyle = i < s.n ? '#5ad17a' : 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(W / 2 - (N - 1) * 11 + i * 22, 18, 6, 0, 7); g.fill(); }
      if (s.msgT > 0 || s.done) { g.font = '800 32px ' + FONT; g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#4a2c17'; g.lineWidth = 7; g.strokeText(s.msg, W / 2, 100); g.fillStyle = '#fff8e8'; g.fillText(s.msg, W / 2, 100); }
    };
    const stop = ctx.onUpdate((dt) => {
      s.t += dt; if (s.msgT > 0) s.msgT -= dt; keys.take();
      if (!s.done) {
        let d = s.dir; if (keys.held.has('a') || keys.held.has('ArrowLeft')) d = -1; if (keys.held.has('d') || keys.held.has('ArrowRight')) d = 1;
        if (s.tap !== null) { const dx = s.tap - s.px; if (Math.abs(dx) < 6) s.tap = null; else d = Math.sign(dx); }
        s.px = Math.max(X0, Math.min(X1, s.px + d * SP * dt));
        const sk = s.sack;
        if (!sk) { s.wait -= dt; if (s.wait <= 0) throwOne(); }
        else if (!sk.bounce && (sk.t += dt) >= sk.dur) {
          if (Math.abs(s.px - sk.tx) < 42) { s.sack = null; s.n++; s.wait = 0.9; ctx.audio.play('thud'); say(s.n >= N ? 'All aboard!' : 'Got it!'); o.onCatch && o.onCatch(s.n - 1); if (s.n >= N) { s.done = true; ctx.audio.play('success'); ctx.after(1.0, () => { stop(); keys.stop(); p.close(); res(); }); } }
          else { sk.bounce = true; ctx.audio.play('boing'); say('Oops! Again'); }
        }
        else if (sk.bounce && (sk.t += dt) >= sk.dur + 0.7) { s.sack = null; s.wait = 0.3; }
      }
      p.el.dataset.px = Math.round(s.px); p.el.dataset.tx = s.sack && !s.sack.bounce ? Math.round(s.sack.tx) : ''; p.el.dataset.n = s.n;
      draw();
    });
    draw();
  });
}
