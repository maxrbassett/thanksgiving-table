// Three little games inside "The China Plates", each one the real job of that moment:
//   stokeGame  — chapter 1: feed the dragon kiln through its side stoke holes, one after another, as the fire climbs the hill
//   stonesGame — chapter 3: pick the stones out of the washed clay as it flows down the sluice; the fine white clay floats on
//   lineUpGame — chapter 5: slide the printed transfer until its cross sits on the plate's cross, then press it on
import { drawPlate2D, drawOps } from './china-plate.js';

const TAU = Math.PI * 2, E = (s) => '<span class="em">' + s + '</span>';
const EMOJI = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
const isUse = (k) => k === ' ' || k === 'e' || k === 'E' || k === 'Enter';
const isLeft = (k) => k === 'ArrowLeft' || k === 'a' || k === 'A', isRight = (k) => k === 'ArrowRight' || k === 'd' || k === 'D';
const isUp = (k) => k === 'ArrowUp' || k === 'w' || k === 'W', isDown = (k) => k === 'ArrowDown' || k === 's' || k === 'S';
/** keydown listener that removes itself when the world is gone; returns the remover */
const onKeys = (ctx, fn) => { const h = (e) => { if (ctx.disposed) { window.removeEventListener('keydown', h); return; } fn(e); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); };
/** a phone held upright: the pop-up is narrow but may be tall, so the wide pictures get a taller layout */
const isTall = () => window.innerWidth < 520 && window.innerHeight > window.innerWidth * 1.25;
/** a phone held sideways: the pop-up is wide but very short */
export const isShort = () => window.innerHeight < 480 && window.innerWidth > window.innerHeight;
/** fingers, not keys (the engine marks the page once the screen has been touched) */
const isTouch = () => document.body.classList.contains('touch') || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const canvasXY = (cv, ev) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * cv.width, (ev.clientY - r.top) / r.height * cv.height]; };
const head = (icon, title) => '<div style="font-size:26px;font-weight:700;margin-bottom:6px">' + E(icon) + ' ' + title + '</div>';
const canvasTag = (id, w, h, css) => '<canvas id="' + id + '" width="' + w + '" height="' + h + '" style="width:' + css + ';max-width:min(86vw,100%);display:block;margin:0 auto;border-radius:18px;touch-action:none;cursor:pointer"></canvas>';
const msgTag = (id, text) => '<div id="' + id + '" style="font-size:21px;font-weight:700;margin-top:8px;min-height:28px;opacity:.85">' + text + '</div>';
const setMsg = (el, text) => { el.innerHTML = text; };
const debug = (ctx, k, v) => { ctx.chinaDebug = Object.assign(ctx.chinaDebug || {}, { [k]: v }); };
const flame = (g, x, y, s, t, col = '#ff9a30', col2 = '#ffe08a') => {
  if (s <= 0.01) return; const w = 14 * s, h = (30 + 7 * Math.sin(t * 13 + x)) * s;
  g.fillStyle = col; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 1.2, y - h * 0.5, x + Math.sin(t * 9 + x) * 3 * s, y - h); g.quadraticCurveTo(x + w * 1.2, y - h * 0.5, x + w, y); g.fill();
  g.fillStyle = col2; g.beginPath(); g.moveTo(x - w * 0.45, y); g.quadraticCurveTo(x - w * 0.5, y - h * 0.3, x, y - h * 0.5); g.quadraticCurveTo(x + w * 0.5, y - h * 0.3, x + w * 0.45, y); g.fill();
};
const logPic = (g, x, y, a, s = 1) => { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.fillStyle = '#8a5a2b'; g.beginPath(); g.roundRect(-22, -7, 44, 14, 6); g.fill(); g.fillStyle = '#d9a86c'; g.beginPath(); g.ellipse(22, 0, 5, 7, 0, 0, TAU); g.fill(); g.restore(); };

/** Chapter 1 — the dragon kiln is fed through its side holes from the bottom up as the fire climbs. onLight(i) is called as each hole catches. */
export function stokeGame(ctx, onLight) {
  return new Promise((resolve) => {
    // the kiln climbs gently on a wide screen; on an upright phone the picture is taller and the kiln steeper, so the holes stay big enough for a finger
    const tall = isTall(), W = tall ? 400 : 600, H = tall ? 470 : 300, N = 8;
    const K = tall ? { a: [46, 408], b: [352, 128], h0: [68, 384], hd: [275, -252], hill: [422, 200, 305, 86], chim: [346, 66], joint: [-15, 14, 17, 18.5] }
                   : { a: [48, 248], b: [538, 110], h0: [75, 236], hd: [450, -128], hill: [262, 300, 215, 95], chim: [532, 48], joint: [-20, 0, 7, 24] };
    const p = ctx.ui.panel(head('🔥', 'Feed the hungry hole!') + canvasTag('cg-stoke', W, H, '560px') + msgTag('cg-msg', E('👆') + (isTouch() ? ' Tap the glowing hole!' : ' Tap it — or ' + E('◀▶') + ' and E')));
    const cv = p.el.querySelector('canvas'), g = cv.getContext('2d'), msg = p.el.querySelector('#cg-msg');
    const holes = []; for (let i = 0; i < N; i++) { const k = (i + 0.5) / N; holes.push({ x: K.h0[0] + K.hd[0] * k, y: K.h0[1] + K.hd[1] * k, lit: 0, hungry: false, wob: 0 }); }
    let cur = -1, sel = 0, hungryT = 0, litN = 0, over = false, t = 0; const flying = [], smoke = [];
    const hungry = (i) => { if (over) return; cur = i; hungryT = 0; holes[i].hungry = true; };
    ctx.after(0.7, () => hungry(0));
    const throwAt = (j) => {
      if (over || j < 0 || j >= N) return; const h = holes[j]; sel = j;
      if (j === cur) { cur = -1; h.hungry = false; flying.push({ x: W / 2 + (Math.random() - 0.5) * 40, y: H + 10, tx: h.x, ty: h.y - 14, k: 0, i: j }); ctx.audio.play('whoosh'); return; }
      h.wob = 1; ctx.audio.play(h.lit ? 'click' : 'thud'); setMsg(msg, h.lit ? E('🔥') + ' That one burns already!' : E('⏳') + ' Not yet — find the hungry one!');
    };
    const finish = () => { over = true; setMsg(msg, E('🐉') + ' The dragon breathes fire!'); ctx.audio.play('success'); ctx.after(1.8, () => { stop(); offKeys(); p.close(); resolve(); }); };
    const offKeys = onKeys(ctx, (e) => { const k = e.key; if (isLeft(k)) { sel = Math.max(0, sel - 1); e.preventDefault(); ctx.audio.play('click'); } else if (isRight(k)) { sel = Math.min(N - 1, sel + 1); e.preventDefault(); ctx.audio.play('click'); } else if (isUse(k) && !e.repeat) { e.preventDefault(); throwAt(sel); } });
    cv.addEventListener('pointerdown', (ev) => { ev.preventDefault(); const [x, y] = canvasXY(cv, ev); let best = -1, bd = 48; holes.forEach((h, i) => { const d = Math.hypot(h.x - x, h.y - 22 - y); if (d < bd) { bd = d; best = i; } }); if (best >= 0) throwAt(best); });
    const draw = () => {
      g.clearRect(0, 0, W, H);
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#f6c9a0'); sky.addColorStop(1, '#fdf0dc'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8fb86a'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, K.hill[0]); g.quadraticCurveTo(K.hill[1], K.hill[2], W, K.hill[3]); g.lineTo(W, H); g.fill();
      // the kiln: a long tube climbing the hill, its chimney at the top
      g.lineCap = 'round'; g.strokeStyle = '#7a4a32'; g.lineWidth = 58; g.beginPath(); g.moveTo(K.a[0], K.a[1]); g.lineTo(K.b[0], K.b[1]); g.stroke();
      g.strokeStyle = '#a55a36'; g.lineWidth = 48; g.beginPath(); g.moveTo(K.a[0], K.a[1]); g.lineTo(K.b[0], K.b[1]); g.stroke();
      g.strokeStyle = 'rgba(120,60,30,.35)'; g.lineWidth = 3; for (let i = 0; i <= N; i++) { const k = i / N, x = K.h0[0] + K.hd[0] * k + K.joint[0], y = K.h0[1] + K.hd[1] * k + K.joint[1]; g.beginPath(); g.moveTo(x - K.joint[2], y - K.joint[3]); g.lineTo(x + K.joint[2], y + K.joint[3]); g.stroke(); }
      g.fillStyle = '#6e3a26'; g.beginPath(); g.roundRect(K.chim[0], K.chim[1], 30, 70, 6); g.fill(); g.fillRect(K.chim[0] - 6, K.chim[1] - 4, 42, 10);
      for (const s of smoke) { g.fillStyle = 'rgba(240,236,228,' + (0.7 * (1 - s.k)).toFixed(2) + ')'; g.beginPath(); g.arc(s.x, s.y, 8 + 22 * s.k, 0, TAU); g.fill(); }
      // the fire mouth at the bottom, already burning
      g.fillStyle = '#1a0f0a'; g.beginPath(); g.ellipse(K.a[0] - 8, K.a[1] + 4, 16, 22, 0, 0, TAU); g.fill(); flame(g, K.a[0] - 8, K.a[1] + 14, 0.9, t);
      holes.forEach((h, i) => {
        const wob = Math.sin(h.wob * 20) * 4 * h.wob; h.wob = Math.max(0, h.wob - 0.05);
        if (h.hungry) { const pulse = 0.5 + 0.5 * Math.sin(t * 6); g.strokeStyle = 'rgba(255,220,80,' + (0.45 + 0.5 * pulse).toFixed(2) + ')'; g.lineWidth = 5 + 3 * pulse; g.beginPath(); g.arc(h.x, h.y - 2, 26 + 6 * pulse, 0, TAU); g.stroke(); }
        g.fillStyle = '#24150e'; g.beginPath(); g.roundRect(h.x - 13 + wob, h.y - 20, 26, 30, 8); g.fill();
        if (h.lit > 0) flame(g, h.x + wob, h.y + 8, h.lit, t + i); else if (h.hungry) flame(g, h.x + wob, h.y + 8, 0.3 + 0.12 * Math.sin(t * 10), t + i, '#c65a1e', '#ff9a30');
        if (h.hungry) { g.font = '700 22px Fredoka,sans-serif'; g.fillStyle = '#c0392b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', h.x, h.y - 46 - 4 * Math.sin(t * 6)); }
      });
      // the log the player is holding, above the chosen hole
      const s = holes[sel]; if (!over) { g.fillStyle = '#ffc93c'; g.beginPath(); g.moveTo(s.x, s.y - 30); g.lineTo(s.x - 9, s.y - 44); g.lineTo(s.x + 9, s.y - 44); g.fill(); logPic(g, s.x, s.y - 64, -0.25, 0.8); }
      for (const f of flying) { const k = f.k, x = f.x + (f.tx - f.x) * k, y = f.y + (f.ty - f.y) * k - Math.sin(k * Math.PI) * 70; logPic(g, x, y, k * 7, 0.9); }
      g.font = '700 22px Fredoka,sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#4a2c17'; g.fillText(litN + ' / ' + N, 58, 28); g.font = '22px ' + EMOJI; g.fillText('🔥', 22, 28);
    };
    const stop = ctx.onUpdate((dt) => {
      t += dt;
      for (const h of holes) if (h.lit > 0 && h.lit < 1) h.lit = Math.min(1, h.lit + dt * 1.6);
      for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i]; f.k += dt / 0.4; if (f.k >= 1) { flying.splice(i, 1); const h = holes[f.i]; h.lit = 0.05; litN++; ctx.audio.play('fire'); setMsg(msg, litN < N ? E('🔥') + ' ' + (N - litN) + ' to go!' : ''); if (onLight) onLight(f.i); if (litN >= N) finish(); else ctx.after(0.5, () => hungry(litN)); } }
      if (cur >= 0) { hungryT += dt; if (hungryT > 8) { setMsg(msg, E('👴') + ' The master lends a hand!'); throwAt(cur); } }
      if (over || litN >= 6) { if (Math.random() < dt * 6) smoke.push({ x: K.chim[0] + 15 + (Math.random() - 0.5) * 10, y: K.chim[1] - 8, k: 0 }); }
      for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i]; s.k += dt * 0.6; s.y -= dt * 40; s.x += dt * 12; if (s.k >= 1) smoke.splice(i, 1); }
      draw();
    });
    debug(ctx, 'stoke', { hungry: () => cur, lit: () => litN, holes: () => holes.map(h => [h.x, h.y - 22]), over: () => over, size: () => [W, H] });
    draw();
  });
}

/** Chapter 3 — the washed clay runs down a sluice; stones are picked out, the fine white clay floats on to the settling ponds. */
export function stonesGame(ctx) {
  return new Promise((resolve) => {
    // on an upright phone the sluice is squarer (and the water a little slower), so the stones are big enough for a finger
    const tall = isTall(), W = tall ? 420 : 600, H = tall ? 440 : 320, D = H - 320, NEED = 8;
    const p = ctx.ui.panel(head('👆', 'Tap the stones!') + canvasTag('cg-stones', W, H, '560px') + msgTag('cg-msg', 'Let the white clay float by'));
    const cv = p.el.querySelector('canvas'), g = cv.getContext('2d'), msg = p.el.querySelector('#cg-msg');
    const items = [], drops = []; let got = 0, spawnT = 0.4, nSpawn = 0, over = false, t = 0, sel = null, kb = false;
    const shape = (n, r, rnd, jit) => { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (1 - jit + rnd() * jit); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return pts; };
    const spawn = () => { const stone = nSpawn % 2 === 0 ? Math.random() < 0.85 : Math.random() < 0.25; nSpawn++;
      const r = stone ? 17 + Math.random() * 9 : 20 + Math.random() * 9, rnd = Math.random;
      items.push({ stone, x: -30, y: 105 + Math.random() * (120 + D), r, vx: (85 + Math.random() * 45) * (tall ? 0.75 : 1), ph: Math.random() * TAU, rot: Math.random() * TAU, pts: shape(stone ? 6 : 14, r, rnd, stone ? 0.4 : 0.18), col: stone ? ['#6f6a60', '#8a7d6a', '#7a6452', '#5d5a55'][Math.floor(Math.random() * 4)] : ['#f6f1e6', '#fbf7ee', '#efe9da'][Math.floor(Math.random() * 3)], wob: 0, out: 0 }); };
    const live = () => items.filter(i => !i.out).sort((a, b) => a.x - b.x);
    const pick = (it) => {
      if (over || !it || it.out) return;
      if (it.stone) { it.out = 0.001; got++; ctx.audio.play('pop'); for (let k = 0; k < 8; k++) drops.push({ x: it.x, y: it.y, vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 120, k: 0 }); setMsg(msg, got < NEED ? E('👍') + ' ' + (NEED - got) + ' more' : ''); if (got >= NEED) finish(); }
      else { it.wob = 1; ctx.audio.play('error'); setMsg(msg, E('⚪') + ' That is clay — let it float!'); }
    };
    const finish = () => { over = true; setMsg(msg, E('💧') + ' Clean white clay!'); ctx.audio.play('success'); ctx.after(1.5, () => { stop(); offKeys(); p.close(); resolve(); }); };
    const offKeys = onKeys(ctx, (e) => { const k = e.key, L = live(); if (isLeft(k) || isRight(k)) { e.preventDefault(); kb = true; if (!L.length) return; let i = L.indexOf(sel); i = i < 0 ? (isLeft(k) ? L.length - 1 : 0) : (i + (isLeft(k) ? -1 : 1) + L.length) % L.length; sel = L[i]; ctx.audio.play('click'); } else if (isUse(k) && !e.repeat) { e.preventDefault(); kb = true; if (!sel || sel.out || !items.includes(sel)) { const n = L.filter(o => o.x > 20 && o.x < W - 20); sel = n.length ? n[0] : null; } pick(sel); } });
    cv.addEventListener('pointerdown', (ev) => { ev.preventDefault(); kb = false; const [x, y] = canvasXY(cv, ev); let best = null, bd = 1e9;
      const slack = ev.pointerType === 'touch' ? Math.max(14, 22 * cv.width / (cv.getBoundingClientRect().width || cv.width)) : 14;   // a finger is blunter than a mouse pointer: about 22 px on the glass, however small the picture is shown
      for (const it of items) { if (it.out) continue; const d = Math.hypot(it.x - x, it.y - y) - it.r; if (d < slack && d < bd) { bd = d; best = it; } } if (best) pick(best); });
    const blob = (it, x, y, sc = 1) => { g.save(); g.translate(x, y); g.rotate(it.rot); g.scale(sc, sc); g.fillStyle = it.col; g.beginPath(); it.pts.forEach((q, i) => g[i ? 'lineTo' : 'moveTo'](q[0], q[1])); g.closePath(); g.fill(); g.strokeStyle = it.stone ? 'rgba(40,30,20,.5)' : 'rgba(120,110,90,.35)'; g.lineWidth = 2; g.stroke(); g.fillStyle = it.stone ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(-it.r * 0.3, -it.r * 0.3, it.r * 0.28, 0, TAU); g.fill(); g.restore(); };
    const draw = () => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#8fb86a'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8a6a4a'; g.fillRect(0, 58, W, 212 + D); g.fillStyle = '#6f5238'; g.fillRect(0, 58, W, 12); g.fillRect(0, 258 + D, W, 12);
      g.fillStyle = '#bfd8e8'; g.fillRect(0, 70, W, 188 + D);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; for (let i = 0; i < 9 + Math.floor(D / 21); i++) { const y = 86 + i * 21, off = (t * 110 + i * 83) % 160; for (let x = -160 + off; x < W; x += 160) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 70, y + Math.sin(i) * 3); g.stroke(); } }
      g.font = '700 20px Fredoka,sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('clay in', 14, 30); g.textAlign = 'right'; g.fillText('to the settling ponds ▶', W - 14, 30);
      g.textAlign = 'left'; g.fillStyle = '#4a2c17'; g.fillText('stones out: ' + got + ' / ' + NEED, 14, 294 + D);
      for (const it of items) { const wob = Math.sin(it.wob * 22) * 5 * it.wob; it.wob = Math.max(0, it.wob - 0.05); if (it.out) blob(it, it.x + wob, it.y - 260 * it.out, 1 - it.out * 0.6); else blob(it, it.x + wob, it.y + Math.sin(t * 2 + it.ph) * 3); }
      for (const d of drops) { g.fillStyle = 'rgba(180,215,235,' + (1 - d.k).toFixed(2) + ')'; g.beginPath(); g.arc(d.x, d.y, 4, 0, TAU); g.fill(); }
      if (kb && sel && !sel.out && items.includes(sel)) { const it = sel; g.strokeStyle = '#ffc93c'; g.lineWidth = 4; g.beginPath(); g.arc(it.x, it.y + Math.sin(t * 2 + it.ph) * 3, it.r + 8, 0, TAU); g.stroke(); }
    };
    const stop = ctx.onUpdate((dt) => {
      t += dt; if (!over) { spawnT -= dt; if (spawnT <= 0 && items.filter(i => !i.out).length < 7) { spawn(); spawnT = 0.7; } }
      for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if (it.out) { it.out += dt * 1.6; if (it.out >= 1) items.splice(i, 1); continue; } it.x += it.vx * dt; it.rot += dt * 0.3; if (it.x > W + 30) items.splice(i, 1); }
      for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.k += dt * 1.8; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 400 * dt; if (d.k >= 1) drops.splice(i, 1); }
      draw();
    });
    debug(ctx, 'stones', { items: () => items.filter(i => !i.out).map(i => [i.x, i.y, i.stone ? 1 : 0]), got: () => got, over: () => over, size: () => [W, H] });
    draw();
  });
}

/** Chapter 5 — the decorator slides the wet transfer until it sits square on the plate (cross on cross), then presses it on. */
export function lineUpGame(ctx, ops) {
  return new Promise((resolve) => {
    const W = 520;
    const btn = (id, e) => '<button class="btn big" id="' + id + '" style="padding:6px 18px;font-size:24px;touch-action:none">' + E(e) + '</button>';
    const arrows = '<div style="display:grid;grid-template-columns:repeat(3,60px);gap:8px;justify-items:center"><span></span>' + btn('cg-up', '▲') + '<span></span>' + btn('cg-left', '◀') + '<span></span>' + btn('cg-right', '▶') + '<span></span>' + btn('cg-down', '▼') + '<span></span></div>';
    const pressBtn = '<button class="btn big" id="cg-press">' + E('✅') + ' Press on</button>', hint = E('✋') + ' Slide it onto the plate';
    // a phone held sideways is short and wide: the plate takes the full height on the left, and the title, arrows and button stand in a column on the right
    const p = ctx.ui.panel(isShort()
      ? '<div style="display:flex;gap:20px;align-items:center;justify-content:center">' + canvasTag('cg-line', W, W, Math.max(200, Math.min(380, window.innerHeight - 64)) + 'px').replace('margin:0 auto', 'margin:0;flex:none') +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:250px">' + head('📄', 'Line up the print!').replace('font-size:26px', 'font-size:23px').replace('margin-bottom:6px', 'margin:0') + arrows + pressBtn +
        msgTag('cg-msg', hint).replace('font-size:21px', 'font-size:18px').replace('min-height:28px', 'min-height:44px').replace('margin-top:8px', 'margin-top:4px') + '</div></div>'
      : head('📄', 'Line up the print!') +
      '<div style="display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap">' + canvasTag('cg-line', W, W, 'min(380px,52vh,70vw)').replace('margin:0 auto', 'margin:0') + arrows + '</div>' +
      '<div style="display:flex;gap:14px;justify-content:center;align-items:center;margin-top:10px;flex-wrap:wrap">' + pressBtn + '</div>' + msgTag('cg-msg', hint));
    const cv = p.el.querySelector('canvas'), g = cv.getContext('2d'), msg = p.el.querySelector('#cg-msg');
    // the transfer paper, drawn once: a cream sheet with the player's own design printed on it and a small registration cross in the middle
    const sheet = document.createElement('canvas'); sheet.width = sheet.height = W; const gs = sheet.getContext('2d');
    gs.fillStyle = 'rgba(243,236,216,.62)'; gs.beginPath(); gs.roundRect(W * 0.04, W * 0.04, W * 0.92, W * 0.92, 14); gs.fill(); drawOps(gs, W, ops);
    gs.strokeStyle = 'rgba(60,60,60,.55)'; gs.lineWidth = 3; gs.setLineDash([10, 8]); gs.beginPath(); gs.arc(W / 2, W / 2, W / 2 * 0.96 * 0.985, 0, TAU); gs.stroke(); gs.setLineDash([]);
    gs.strokeStyle = '#1f4fa8'; gs.lineWidth = 3; gs.beginPath(); gs.moveTo(W / 2 - 16, W / 2); gs.lineTo(W / 2 + 16, W / 2); gs.moveTo(W / 2, W / 2 - 16); gs.lineTo(W / 2, W / 2 + 16); gs.stroke();
    const a0 = Math.random() * TAU, d0 = W * (0.2 + Math.random() * 0.08); const off = { x: Math.cos(a0) * d0, y: Math.sin(a0) * d0 }; let tol = W * 0.05, tries = 0, over = false, t = 0, drag = null, helped = false, wasOk = false;
    const clampO = () => { off.x = Math.max(-W * 0.45, Math.min(W * 0.45, off.x)); off.y = Math.max(-W * 0.45, Math.min(W * 0.45, off.y)); };
    const inPlace = () => Math.hypot(off.x, off.y) <= tol;
    const nudge = (dx, dy) => { if (over) return; off.x += dx; off.y += dy; clampO(); };
    const press = () => {
      if (over) return;
      if (inPlace()) { over = true; ctx.audio.play('pop'); setMsg(msg, E('✨') + ' Perfect fit!'); ctx.tween(off, { x: 0, y: 0 }, 0.3, 'out'); ctx.audio.play('success'); ctx.after(1.3, () => { stop(); offKeys(); p.close(); resolve(); }); return; }
      tries++; tol += W * 0.02; ctx.audio.play('error'); const dir = Math.abs(off.x) > Math.abs(off.y) ? (off.x > 0 ? 'left' : 'right') : (off.y > 0 ? 'up' : 'down');
      setMsg(msg, E('🤔') + ' Not yet — a bit more ' + dir + '!'); off.x *= 0.5; off.y *= 0.5;
    };
    const offKeys = onKeys(ctx, (e) => { const k = e.key, s = 12; if (isLeft(k)) nudge(-s, 0); else if (isRight(k)) nudge(s, 0); else if (isUp(k)) nudge(0, -s); else if (isDown(k)) nudge(0, s); else if (isUse(k) && !e.repeat) press(); else return; e.preventDefault(); });
    for (const [id, dx, dy] of [['cg-up', 0, -1], ['cg-down', 0, 1], ['cg-left', -1, 0], ['cg-right', 1, 0]]) { const b = p.el.querySelector('#' + id); b.addEventListener('pointerdown', (e) => { e.preventDefault(); nudge(dx * 14, dy * 14); ctx.audio.play('click'); }); b.addEventListener('click', (e) => e.preventDefault()); }
    // (on a touch screen the tap that opened the pop-up is followed by a "click" at the same spot: it must not press the button that has just appeared under the finger)
    const born = performance.now(); p.el.querySelector('#cg-press').onclick = () => { if (performance.now() - born > 450) press(); };
    cv.addEventListener('pointerdown', (ev) => { ev.preventDefault(); if (over) return; drag = canvasXY(cv, ev); try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* fine */ } });
    cv.addEventListener('pointermove', (ev) => { if (!drag || over) return; const q = canvasXY(cv, ev); nudge(q[0] - drag[0], q[1] - drag[1]); drag = q; });
    const endDrag = () => { drag = null; }; cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag); cv.addEventListener('pointerleave', endDrag);
    const draw = () => {
      g.clearRect(0, 0, W, W); g.fillStyle = '#caa470'; g.fillRect(0, 0, W, W); g.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < 8; i++) g.fillRect(0, i * 65, W, 4);
      drawPlate2D(g, W, [], null);
      const ok = !over && inPlace(); if (ok || over) { g.strokeStyle = over ? '#ffc93c' : '#6fcf6a'; g.lineWidth = 10; g.beginPath(); g.arc(W / 2, W / 2, W / 2 * 0.96 * 0.985, 0, TAU); g.stroke(); }
      g.strokeStyle = '#7a7a7a'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(W / 2 - 22, W / 2); g.lineTo(W / 2 + 22, W / 2); g.moveTo(W / 2, W / 2 - 22); g.lineTo(W / 2, W / 2 + 22); g.stroke(); g.setLineDash([]);
      g.save(); g.shadowColor = 'rgba(74,44,23,.35)'; g.shadowBlur = 14; g.shadowOffsetY = 6 + 3 * Math.sin(t * 3); g.drawImage(sheet, off.x, off.y); g.restore();
      if (ok !== wasOk && !over) { wasOk = ok; setMsg(msg, ok ? E('✅') + ' Now press!' : E('✋') + ' Slide it onto the plate'); }
    };
    const stop = ctx.onUpdate((dt) => { t += dt; if (!over && !helped && t > 40) { helped = true; setMsg(msg, E('👍') + ' The decorator slides it straight!'); ctx.tween(off, { x: 0, y: 0 }, 1.0, 'inOut'); } draw(); });
    debug(ctx, 'line', { off: () => [off.x, off.y], tol: () => tol, over: () => over, tries: () => tries });
    draw();
  });
}
