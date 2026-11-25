// Mini-games for the Mashed Potatoes adventure — small 2D pop-ups (ctx.ui.panel) that sit inside existing steps.
// Each one: 15–40 s, forgiving (a miss only nudges, success always comes), playable with the game's own keys
// (A/D or arrows, E / Space / Enter) and by mouse or touch (big buttons). All timing runs on game time (ctx.onUpdate / ctx.after).
import { seeded } from '../core/kit.js';

const FONT = 'Fredoka,sans-serif';
const head = (emoji, text) => '<div style="font:800 26px ' + FONT + ';color:#4a2c17;margin-bottom:8px"><span class="em">' + emoji + '</span> ' + text + '</div>';
const MSG = 'font:700 22px ' + FONT + ';color:#4a2c17;margin-top:10px;min-height:30px';
const BTN = 'font:700 26px ' + FONT + ';color:#4a2c17;border:0;border-radius:24px;padding:14px 34px;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 5px 0 rgba(74,44,23,.3);';
const CAN = 'display:block;margin:0 auto;border-radius:18px;';
/** a phone held sideways: too short for picture-above-button, so the pop-ups put the picture on the left and the words and button on the right */
const isShort = () => window.innerHeight < 480;
/** a long press inside a pop-up must never bring up the browser's own menu (hold-to-pour!) */
const noMenu = (el) => { el.style.webkitTouchCallout = 'none'; el.addEventListener('contextmenu', (e) => e.preventDefault()); };
const noFocus = (el) => { el.tabIndex = -1; el.addEventListener('pointerdown', (e) => e.preventDefault()); };   // a button that never takes keyboard focus (so Space / Enter reach the game, not the button)

/** the game's raw input while a panel is open: which keys are down, and the "use" key (E / Space / Enter) */
const keys = (ctx) => ctx.game.keys, input = (ctx) => ctx.game.input;

// ---------------------------------------------------------------------------------------------
// 1 · "Tap the sprouted one" — choosing seed potatoes. Farmers plant potatoes whose eyes have sprouted
//     (chitting). Three rounds: three potatoes, one has sprouts — tap it (or A/D + E). Wrong: a wobble and try again.
// ---------------------------------------------------------------------------------------------
export function sproutGame(ctx, o = {}) {
  const ROUNDS = o.rounds || 3;
  return new Promise((res) => {
    const p = ctx.ui.panel(head('🌱', 'Tap the sprouted one') + '<div id="spCards" style="display:flex;gap:min(14px,2.4vw);justify-content:center"></div><div id="spMsg" style="' + MSG + '"></div>');
    const $ = (id) => p.el.querySelector('#' + id), cards = $('spCards'), msg = $('spMsg');
    let round = 0, sel = 1, busy = false, wrong = 0, arm = 0.3, hintT = 0, done = false; const prev = new Set(); let items = []; noMenu(p.el);
    const drawSpud = (cv, sprouted, seed) => {
      const g = cv.getContext('2d'), W = cv.width, H = cv.height, r = seeded(seed); g.clearRect(0, 0, W, H);
      g.save(); g.translate(W / 2, H / 2); g.rotate((r() - 0.5) * 0.8);
      const rx = W * (0.3 + r() * 0.06), ry = H * (0.22 + r() * 0.05);
      g.fillStyle = '#c9a26b'; g.strokeStyle = '#9a7b4f'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#d8b77f'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse((r() - 0.5) * rx * 1.2, (r() - 0.5) * ry * 1.2, rx * 0.16, ry * 0.12, r() * 3, 0, Math.PI * 2); g.fill(); }
      const eyes = []; for (let i = 0; i < 4; i++) { const a = i * 1.6 + r() * 0.8, d = 0.55 + r() * 0.3; eyes.push([Math.cos(a) * rx * d, Math.sin(a) * ry * d, a]); }
      g.fillStyle = '#8a6538'; for (const [x, y] of eyes) { g.beginPath(); g.ellipse(x, y, rx * 0.09, ry * 0.1, 0, 0, Math.PI * 2); g.fill(); }
      if (sprouted) for (let i = 0; i < 3; i++) { const [x, y, a] = eyes[i]; const L = W * (0.16 + r() * 0.08), ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, cx = x + Math.cos(a + 0.9) * L * 0.5, cy = y + Math.sin(a + 0.9) * L * 0.5;
        g.strokeStyle = '#9fd37a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
        g.fillStyle = '#5fae4f'; g.beginPath(); g.ellipse(ex, ey, W * 0.05, W * 0.035, a, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c86fb0'; g.beginPath(); g.arc(ex + Math.cos(a) * W * 0.03, ey + Math.sin(a) * W * 0.03, W * 0.018, 0, Math.PI * 2); g.fill(); }
      g.restore();
    };
    const show = () => { const b = items.map(it => it.el); b.forEach((el, i) => { el.style.borderColor = i === sel ? '#f0a23c' : 'transparent'; el.style.transform = i === sel ? 'scale(1.06)' : ''; }); };
    const next = () => {
      cards.innerHTML = ''; items = []; const r = seeded(101 + round * 7 + (o.seed || 0)); const ok = Math.floor(r() * 3); wrong = 0; hintT = 0;
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('button'); el.dataset.i = i; el.dataset.ok = i === ok ? '1' : '0'; noFocus(el);
        el.style.cssText = 'border:5px solid transparent;border-radius:22px;background:#f3e6cc;padding:6px;cursor:pointer;touch-action:manipulation;transition:transform .12s;box-shadow:0 4px 0 rgba(74,44,23,.25)';
        const cv = document.createElement('canvas'); cv.width = cv.height = 200; cv.style.cssText = 'width:min(20vw,136px);height:min(20vw,136px);display:block'; el.appendChild(cv);
        drawSpud(cv, i === ok, 11 + round * 5 + i); el.addEventListener('click', () => choose(i)); cards.appendChild(el); items.push({ el, ok: i === ok });
      }
      msg.textContent = '🥔 ' + round + ' / ' + ROUNDS; show();
    };
    const choose = async (i) => {
      if (busy || done) return; const it = items[i]; if (!it) return; sel = i; show();
      if (it.ok) { busy = true; round++; it.el.style.background = '#bfe8b0'; it.el.style.borderColor = '#5fae4f'; ctx.audio.play('pop'); msg.textContent = round >= ROUNDS ? 'Well done!' : '🥔 ' + round + ' / ' + ROUNDS;
        await ctx.wait(0.55); busy = false; if (round >= ROUNDS) finish(); else next(); }
      else { wrong++; ctx.audio.play('error'); it.el.style.background = '#f2c9c2'; it.el.style.transform = 'rotate(-6deg)'; msg.textContent = 'Not that one'; const el = it.el;
        ctx.after(0.12, () => { el.style.transform = 'rotate(6deg)'; }); ctx.after(0.24, () => { el.style.transform = ''; el.style.background = '#f3e6cc'; show(); }); }
    };
    const finish = () => { done = true; stop(); ctx.audio.play('success'); ctx.after(0.5, () => { p.close(); res(); }); };
    const stop = ctx.onUpdate((dt) => {
      arm -= dt; const K = keys(ctx), I = input(ctx);
      const down = (k) => K.has(k); const edge = (name, on) => { const was = prev.has(name); if (on) prev.add(name); else prev.delete(name); return on && !was; };
      const L = edge('L', down('a') || down('ArrowLeft')), R = edge('R', down('d') || down('ArrowRight'));
      if (!busy && (L || R)) { sel = Math.max(0, Math.min(2, sel + (R ? 1 : -1))); show(); ctx.audio.play('click'); }
      if (arm <= 0 && I.usePressed && !busy) choose(sel);
      // a hint after two wrong tries: the sprouted one wiggles
      if (wrong >= 2 && !busy) { hintT += dt; const it = items.find(x => x.ok); if (it) it.el.style.transform = 'rotate(' + Math.sin(hintT * 12) * 5 + 'deg)' + (items.indexOf(it) === sel ? ' scale(1.06)' : ''); }
      p.el.dataset.round = round;
    });
    next();
  });
}

// ---------------------------------------------------------------------------------------------
// 2 · "Stitch on the dot" — closing the sack. The needle glides along the sack's top; press Stitch (button, E / Space)
//     when it is over the glowing dot. Five stitches close the sack. A miss just goes "oops" and the needle comes back.
// ---------------------------------------------------------------------------------------------
export function stitchGame(ctx, o = {}) {
  const NEED = o.need || 5;
  return new Promise((res) => {
    const p = ctx.ui.panel(head('➰', 'Stitch on the dot!') + '<canvas id="stC" width="960" height="400" style="' + CAN + 'width:min(84vw,480px);height:auto;background:#e9dcc0"></canvas><div id="stMsg" style="' + MSG + '">➰ 0 / ' + NEED + '</div><button id="stBtn" style="' + BTN + 'background:#ffd9a8;margin-top:6px"><span class="em">✋</span> Stitch</button>');
    const $ = (id) => p.el.querySelector('#' + id), cv = $('stC'), g = cv.getContext('2d'), W = cv.width, H = cv.height, msg = $('stMsg'), btn = $('stBtn'); noFocus(btn);
    const holes = []; for (let i = 0; i < NEED; i++) holes.push(W * (0.18 + 0.64 * i / (NEED - 1)));
    let n = 0, t = 0, period = 3.2, tol = 0.065, misses = 0, arm = 0.3, lastHit = -9, flash = [], oops = 0, done = false, needleX = holes[0], dir = 1;
    const pos = () => { const k = (t % period) / period; return k < 0.5 ? k * 2 : 2 - k * 2; };   // 0→1→0
    const draw = () => {
      g.clearRect(0, 0, W, H);
      // the sack: a tan body, its folded top edge, and the seam line
      g.fillStyle = '#d9b98a'; g.fillRect(0, H * 0.42, W, H * 0.58); g.fillStyle = '#c9a26b'; g.fillRect(0, H * 0.42, W, H * 0.2);
      g.strokeStyle = '#b08a55'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(W * (0.05 + i * 0.115), H * 0.66); g.lineTo(W * (0.02 + i * 0.115), H); g.stroke(); }
      g.setLineDash([12, 12]); g.strokeStyle = '#8a6538'; g.lineWidth = 3; g.beginPath(); g.moveTo(W * 0.06, H * 0.52); g.lineTo(W * 0.94, H * 0.52); g.stroke(); g.setLineDash([]);
      // stitch holes: done ones have a thread cross, the next one glows
      const pulse = 0.5 + 0.5 * Math.sin(t * 7);
      holes.forEach((x, i) => { const y = H * 0.52;
        if (i < n) { g.strokeStyle = '#fff8e8'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 18, y - 22); g.lineTo(x + 18, y + 22); g.moveTo(x + 18, y - 22); g.lineTo(x - 18, y + 22); g.stroke(); if (i > 0) { g.lineWidth = 6; g.beginPath(); g.moveTo(holes[i - 1] + 18, y + 22); g.lineTo(x - 18, y - 22); g.stroke(); } }
        else { if (i === n && !done) { g.fillStyle = 'rgba(255,216,74,' + (0.35 + pulse * 0.45) + ')'; g.beginPath(); g.arc(x, y, 34 + pulse * 10, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = i === n ? '#f0a23c' : '#8a6538'; g.beginPath(); g.arc(x, y, 11, 0, Math.PI * 2); g.fill(); } });
      // the needle (from the sewing head above) and its thread
      const x = needleX, ny = H * 0.52 - 4 + (t - lastHit < 0.18 ? 22 : 0);
      g.fillStyle = '#6b7580'; g.fillRect(x - 44, 0, 88, H * 0.18); g.fillStyle = '#8f9aa5'; g.fillRect(x - 30, H * 0.18, 60, H * 0.07);
      g.strokeStyle = '#e3e8ec'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, H * 0.25); g.lineTo(x, ny); g.stroke(); g.strokeStyle = '#fff8e8'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 3, ny - 14); g.lineTo(x - 30, H * 0.2); g.lineTo(x - 44, H * 0.1); g.stroke();
      // "oops" puff on a miss, sparkle on a hit
      if (oops > 0) { g.fillStyle = 'rgba(232,65,47,' + Math.min(1, oops * 3) + ')'; g.font = 'bold 44px ' + FONT; g.textAlign = 'center'; g.fillText('oops', x, H * 0.9); }
      for (const f of flash) { const k = 1 - f.t / 0.35; g.strokeStyle = 'rgba(255,255,255,' + k + ')'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(f.x + Math.cos(a) * 20, f.y + Math.sin(a) * 20); g.lineTo(f.x + Math.cos(a) * (30 + 30 * (1 - k)), f.y + Math.sin(a) * (30 + 30 * (1 - k))); g.stroke(); } }
    };
    const press = () => {
      if (done || t - lastHit < 0.15) return; lastHit = t; const hx = holes[n];
      if (Math.abs(needleX - hx) <= tol * W) { n++; ctx.audio.play('stitch'); flash.push({ x: hx, y: H * 0.52, t: 0 }); msg.textContent = n >= NEED ? 'All sewn up!' : '➰ ' + n + ' / ' + NEED; if (n >= NEED) finish(); }
      else { misses++; oops = 0.5; ctx.audio.play('error'); msg.textContent = 'Oops — wait for the dot'; if (misses === 3) { tol = 0.1; period = 4.0; } }   // after three misses the game gets easier
    };
    const finish = () => { done = true; ctx.audio.play('success'); ctx.after(0.6, () => { stop(); p.close(); res(); }); };
    // react the moment the finger (or mouse) goes down — on a touch screen a "click" only comes when the finger lifts, too late for a timing game; the picture itself can be tapped too
    noMenu(p.el); cv.style.touchAction = 'none'; cv.style.cursor = 'pointer';
    for (const el of [btn, cv]) el.addEventListener('pointerdown', (e) => { if (e.button > 0) return; press(); });
    btn.addEventListener('click', (e) => { if (e.detail === 0) press(); });   // only a click that did not come from a pointer (its press was already counted above)
    const stop = ctx.onUpdate((dt) => {
      t += dt; arm -= dt; oops = Math.max(0, oops - dt); for (let i = flash.length - 1; i >= 0; i--) { flash[i].t += dt; if (flash[i].t > 0.35) flash.splice(i, 1); }
      if (!done) needleX = W * 0.08 + pos() * W * 0.84;
      if (arm <= 0 && input(ctx).usePressed) press();
      draw(); p.el.dataset.dx = ((needleX - (holes[n] || holes[NEED - 1])) / W).toFixed(3); p.el.dataset.n = n; p.el.dataset.tol = tol;
    });
    draw();
  });
}

// ---------------------------------------------------------------------------------------------
// 3 · "Hold to pour, stop in green" — adding milk to the mash. Hold the button (or E / Space) to pour milk into the
//     measuring cup; let go while the milk is in the green band. Too much? The cup is tipped out and you try again
//     (and the band grows a little). Too little? Just pour a bit more.
// ---------------------------------------------------------------------------------------------
export function pourGame(ctx, o = {}) {
  return new Promise((res) => {
    const short = isShort(), pic = (w) => '<canvas id="poC" width="560" height="600" style="' + CAN + 'width:' + w + ';height:auto;background:#fff8e8;touch-action:none;flex:none"></canvas>', msgB = '<div id="poMsg" style="' + MSG + '"></div><button id="poBtn" style="' + BTN + 'background:#bfe0f5;margin-top:6px;white-space:nowrap">' + '<span class="em">🥛</span> Hold to pour</button>';
    const p = ctx.ui.panel(short   // sideways phone: the cup on the left, the words and the button on the right — everything stays big
      ? '<div style="display:flex;align-items:center;gap:22px">' + pic('min(280px,calc((100vh - 64px) * .93))') + '<div style="width:270px">' + head('🥛', 'Hold to pour, stop in green') + msgB + '</div></div>'
      : head('🥛', 'Hold to pour, stop in green') + pic('min(60vw,280px)') + msgB);
    const $ = (id) => p.el.querySelector('#' + id), cv = $('poC'), g = cv.getContext('2d'), W = cv.width, H = cv.height, msg = $('poMsg'), btn = $('poBtn'); noFocus(btn);
    const S = { level: 0 }; let lo = 0.58, hi = 0.70, rate = 0.26, held = false, btnDown = false, armed = false, fails = 0, done = false, t = 0, draining = false, wasHeld = false;
    // the cup: a slightly flared glass; y of a fill fraction f
    const cupX1 = W * 0.2, cupX2 = W * 0.72, cupTop = H * 0.26, cupBot = H * 0.93, yOf = (f) => cupBot - (cupBot - cupTop) * f;
    const draw = () => {
      g.clearRect(0, 0, W, H);
      // milk
      if (S.level > 0) { const y = yOf(S.level); g.fillStyle = '#fdfbf4'; g.fillRect(cupX1, y, cupX2 - cupX1, cupBot - y); g.fillStyle = '#f1ecdc'; g.beginPath(); g.ellipse((cupX1 + cupX2) / 2, y, (cupX2 - cupX1) / 2, 9, 0, 0, Math.PI * 2); g.fill(); }
      // green band + fill line (drawn over the milk, so it stays visible when the cup is too full)
      g.fillStyle = 'rgba(95,174,79,.35)'; g.fillRect(cupX1 - 6, yOf(hi), cupX2 - cupX1 + 12, yOf(lo) - yOf(hi));
      g.strokeStyle = '#3f8a3a'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(cupX1 - 14, yOf((lo + hi) / 2)); g.lineTo(cupX2 + 14, yOf((lo + hi) / 2)); g.stroke(); g.setLineDash([]);
      // glass
      g.strokeStyle = '#7fb0d0'; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); g.moveTo(cupX1 - 8, cupTop - 10); g.lineTo(cupX1, cupBot); g.lineTo(cupX2, cupBot); g.lineTo(cupX2 + 8, cupTop - 10); g.stroke();
      g.beginPath(); g.moveTo(cupX2 + 6, cupTop + 40); g.bezierCurveTo(cupX2 + 90, cupTop + 40, cupX2 + 90, cupTop + 190, cupX2 + 4, cupTop + 190); g.stroke();   // handle
      g.fillStyle = 'rgba(191,224,245,.25)'; g.beginPath(); g.moveTo(cupX1 - 8, cupTop - 10); g.lineTo(cupX1, cupBot); g.lineTo(cupX2, cupBot); g.lineTo(cupX2 + 8, cupTop - 10); g.fill();
      g.strokeStyle = '#9fc3da'; g.lineWidth = 3; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(cupX1 + 6, yOf(i * 0.2)); g.lineTo(cupX1 + 36, yOf(i * 0.2)); g.stroke(); }
      // the jug, tipping while pouring, and the stream
      const pouring = held && !draining && !done, tip = pouring ? -0.75 : -0.15;
      g.save(); g.translate(W * 0.42, H * 0.1); g.rotate(tip); g.fillStyle = '#fafafa'; g.strokeStyle = '#c9c4b8'; g.lineWidth = 4; g.fillRect(-40, -48, 80, 96); g.strokeRect(-40, -48, 80, 96); g.fillStyle = '#5b8fc7'; g.fillRect(-40, -20, 80, 22); g.fillStyle = '#fafafa'; g.beginPath(); g.moveTo(-40, -48); g.lineTo(-58, -62); g.lineTo(-26, -56); g.fill(); g.restore();
      if (pouring) { g.fillStyle = '#fdfbf4'; g.fillRect(W * 0.42 - 10, H * 0.12, 14, yOf(S.level) - H * 0.12); }
      if (done) { g.fillStyle = '#3f8a3a'; g.font = 'bold 56px ' + FONT; g.textAlign = 'center'; g.fillText('✓', (cupX1 + cupX2) / 2, yOf(0.45)); }
    };
    const setHeld = (v) => { btnDown = v; };
    noMenu(p.el);   // a finger held on the button — or on the cup itself — pours
    for (const el of [btn, cv]) { el.addEventListener('pointerdown', (e) => { if (e.button > 0) return; setHeld(true); }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, () => setHeld(false)); }
    const finish = () => { done = true; held = false; msg.textContent = 'Just right!'; ctx.audio.play('success'); draw(); ctx.after(0.6, () => { stop(); p.close(); res(); }); };
    const tooMuch = () => { draining = true; held = false; fails++; ctx.audio.play('error'); msg.textContent = 'Too much! Try again'; lo = Math.max(0.3, lo - 0.06); hi = Math.min(0.92, hi + 0.06); rate *= 0.85;   // each retry is a little easier
      ctx.after(0.35, () => { ctx.tween(S, { level: 0 }, 0.5, 'in').then(() => { draining = false; msg.textContent = 'Hold to pour'; }); }); };
    msg.textContent = 'Hold to pour';
    const stop = ctx.onUpdate((dt) => {
      t += dt; const I = input(ctx), keyHeld = I.useHeld; if (!armed) { if (!keyHeld && !btnDown) armed = true; }   // a fresh press starts the pour (not the one that opened the box)
      held = armed && !draining && !done && (keyHeld || btnDown);
      if (held) { S.level = Math.min(1, S.level + dt * rate); if (S.level > hi + 0.04) tooMuch(); else if (S.level >= lo) msg.textContent = 'Let go!'; }
      else if (wasHeld && !draining && !done) { if (S.level >= lo && S.level <= hi + 0.04) finish(); else { ctx.audio.play('pop'); msg.textContent = 'A bit more!'; } }
      wasHeld = held; btn.style.transform = held ? 'scale(.94)' : ''; draw(); p.el.dataset.level = S.level.toFixed(3); p.el.dataset.lo = lo.toFixed(2); p.el.dataset.hi = hi.toFixed(2); p.el.dataset.fails = fails;
    });
    draw();
  });
}
