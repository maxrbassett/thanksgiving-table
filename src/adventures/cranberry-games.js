// Cranberry Sauce — the two little "game mode" puzzles added to the story (each is a pop-up panel drawn on a canvas).
//   frostGame(ctx)  — Frost Night: watch the thermometer fall and start the sprinklers at just the right moment (a timing tap).
//   simmerGame(ctx) — Home Kitchen: hold the heat so the pot simmers (not boils over) until the berries pop (a hold-and-release gauge).
// Both use game time only (ctx.onUpdate), work with E / Space, mouse and touch, never get stuck, and resolve when done.

const FONT = 'Fredoka,Trebuchet MS,sans-serif';   // (no quotes: it is used inside style="…" attributes too)
const BTN = 'font:800 28px ' + FONT + ';border:0;border-radius:18px;padding:10px 26px;color:#4a2c17;cursor:pointer;box-shadow:0 4px 0 rgba(74,44,23,.3);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none';
// The look of a pop-up game. On a computer: title, picture, hint, buttons, one under the other (as it always was).
// On an upright phone the picture takes the full width of the pop-up; on a phone held sideways the picture sits on the left and
// the title, hint and buttons in a column on the right, so nothing has to be shrunk to fit the short screen.
const CSS = '<style>' +
  '.cg{display:grid;grid-template-areas:"t" "c" "h" "b"}' +
  '.cg-t{grid-area:t;font:800 26px ' + FONT + ';color:#4a2c17;margin-bottom:6px}' +
  '.cg canvas{grid-area:c;width:min(80vw,560px);border-radius:18px;display:block;margin:0 auto;touch-action:none}' +
  '.cg-h{grid-area:h;font:700 22px ' + FONT + ';color:#4a2c17;margin:10px 0 8px;min-height:28px}' +
  '.cg-b{grid-area:b;display:flex;gap:22px;justify-content:center}.cg-nohint .cg-b{margin-top:12px}' +
  '.cg button{' + BTN + '}.cg-big button{font-size:30px}' +
  '.touch .cg-key{display:none}' +
  '@media (max-width:480px){.cg{margin:-10px}.cg canvas{width:calc(94vw - 24px)}.cg-t{font-size:24px}.cg-h{font-size:20px}.cg button,.cg-big button{font-size:24px;padding:11px 18px}.cg-b{gap:12px}}' +
  '@media (max-height:480px) and (orientation:landscape){.cg{margin:-8px;grid-template-areas:"c t" "c h" "c b";grid-template-columns:auto 215px;grid-template-rows:auto 1fr auto;column-gap:14px}' +
  '.cg canvas{width:min(523px,94vw - 257px,(100vh - 50px)*1.8667)}.cg-t{margin:8px 0 0;font-size:24px}.cg-h{margin:0;align-self:center}.cg-b,.cg-nohint .cg-b{flex-direction:column;gap:12px;margin:0 0 6px}.cg button,.cg-big button{font-size:22px;padding:13px 6px;width:100%}}' +
  '</style>';
/**
 * The shared frame of the pop-up games: shell(ctx, title, hint | null, [[label, colour, name?], …], background, {big}).
 * " (E)" at the end of a button label is the keyboard hint: it is hidden on touch screens.
 * ts() is how much bigger the words drawn inside the picture must be so that they stay readable when the picture is shown small.
 */
export const shell = (ctx, title, hint, buttons, bg, o = {}) => {
  if (typeof buttons[0] === 'string') buttons = [buttons];
  const p = ctx.ui.panel(CSS + '<div class="cg' + (hint == null ? ' cg-nohint' : '') + (o.big ? ' cg-big' : '') + '"><div class="cg-t">' + title + '</div>' +
    '<canvas width="560" height="300" style="background:' + bg + '"></canvas>' +
    (hint == null ? '' : '<div class="cg-h" data-hint>' + hint + '</div>') +
    '<div class="cg-b">' + buttons.map(b => '<button data-b="' + (b[2] || '') + '" style="background:' + b[1] + '">' + b[0].replace(/ \(E\)$/, '<span class="cg-key"> (E)</span>') + '</button>').join('') + '</div></div>');
  p.el.addEventListener('contextmenu', (e) => e.preventDefault());   // a long press of a finger must not open a menu
  const cv = p.el.querySelector('canvas'), hintEl = p.el.querySelector('[data-hint]'), btn = p.el.querySelector('button');
  let tsN = 0, tsV = 1;
  const ts = () => { if (tsN-- <= 0) { tsN = 15; const w = cv.getBoundingClientRect().width; tsV = w > 1 ? Math.max(1, Math.min(1.5, 12 / (15 * w / 560))) : 1; } return tsV; };
  return { p, cv, g: cv.getContext('2d'), btn, ts, hint: (t) => { if (hintEl) hintEl.textContent = t; } };
};
/** words inside the picture: size px (made bigger on small screens), squeezed to maxW if they would not fit */
const word = (g, k, s, x, y, px, maxW) => { let f = px * k; g.font = '800 ' + f.toFixed(1) + 'px ' + FONT; if (maxW) { const w = g.measureText(s).width; if (w > maxW) g.font = '800 ' + (f * maxW / w).toFixed(1) + 'px ' + FONT; } g.fillText(s, x, y); };
// is E / Space / Enter held right now? (the keyboard side of "hold" and "tap"; buttons and the canvas cover mouse and touch)
const keyHeld = (ctx) => { const k = ctx.game && ctx.game.keys; return !!k && (k.has('e') || k.has(' ') || k.has('Enter')); };

/**
 * Frost watch. The night gets colder and colder: a thermometer falls. Tap (button, canvas, or E/Space) while the
 * column is in the blue band to start the sprinklers in time — too soon is a nudge, too late means frost and another try
 * (slower, with a wider band, so it always ends well). About 6–20 s.
 */
export function frostGame(ctx) {
  return new Promise((done) => {
    const { p, cv, g, btn, hint, ts } = shell(ctx, '🌡️ Frost watch', 'Tap when it hits blue!', ['💧 Sprinklers on! (E)', '#9fd6f2'], '#1b2742');
    p.el.dataset.game = 'frost';
    const W = 560, H = 300, TX = 96, T0 = 36, T1 = 236;              // thermometer x, top and bottom of the tube
    let lvl = 0, speed = 1 / 5.2, band = [0.6, 0.76], frostAt = 0.86, phase = 'fall', t = 0, shake = 0, misses = 0, wasDown = keyHeld(ctx), ended = false, sprayT = 0;   // (a key still held from opening the valve does not count as a tap)
    const zone = () => lvl < band[0] ? 'warm' : lvl < band[1] ? 'blue' : 'late';
    const setZone = (z) => { p.el.dataset.zone = z; };
    const tap = () => {
      if (ended || phase !== 'fall') return;
      if (zone() === 'blue') { phase = 'win'; t = 0; setZone('win'); ctx.audio.play('success'); hint('Just right! 💧'); return; }
      if (zone() === 'warm') { shake = 1; ctx.audio.play('error'); hint('Too soon! Keep watching 👀'); }
      else lvl = frostAt;   // tapped after the band: the frost has already come
    };
    // the button answers the moment a finger or the mouse goes down (a timing game must not wait for the finger to lift); a click without a press (keyboard) counts too
    let downAt = -1e9; btn.addEventListener('pointerdown', (e) => { downAt = e.timeStamp; tap(); }); btn.addEventListener('click', (e) => { if (e.timeStamp - downAt > 800) tap(); });
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
    const stop = ctx.onUpdate((dt) => {
      if (ended) return; dt = Math.min(dt, 0.05); t += dt; shake = Math.max(0, shake - dt * 2.5);
      const down = keyHeld(ctx); if (down && !wasDown) tap(); wasDown = down;
      if (phase === 'fall') {
        lvl += speed * dt; setZone(zone());
        if (lvl >= frostAt) { phase = 'frost'; setZone('frost'); t = 0; misses++; ctx.audio.play('thud'); hint('Brr, frost! Try again ❄️'); }
      } else if (phase === 'frost') {
        if (t > 1.5) { phase = 'fall'; lvl = 0; speed *= 0.78; band[0] = Math.max(0.5, band[0] - 0.03); hint('Tap when it hits blue!'); setZone('warm'); }
      } else if (phase === 'win') {
        sprayT += dt; if (t > 0.3 && Math.floor(t * 5) !== Math.floor((t - dt) * 5)) ctx.audio.play('water');
        if (t > 1.8) { ended = true; stop(); p.close(); done(misses); return; }
      }
      draw();
    });
    const berries = [[300, 205], [345, 188], [395, 210], [440, 192], [485, 208], [330, 235], [415, 240], [465, 232]];
    function draw() {
      g.clearRect(0, 0, W, H); g.fillStyle = '#1b2742'; g.fillRect(0, 0, W, H);
      // night: moon, stars, the bog
      g.fillStyle = '#fff5c2'; g.beginPath(); g.arc(470, 52, 22, 0, 6.3); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 14; i++) { const sx = 230 + ((i * 97) % 300), sy = 18 + ((i * 61) % 90); g.fillRect(sx, sy, 3, 3); }
      g.fillStyle = '#3b5a3a'; g.fillRect(230, 150, 330, 150); g.fillStyle = '#4d7346'; g.fillRect(230, 150, 330, 10);
      const frozen = phase === 'frost';
      g.strokeStyle = frozen ? '#9fb7a9' : '#6f9a4e'; g.lineWidth = 4; g.beginPath(); g.moveTo(240, 215); g.quadraticCurveTo(340, 160, 400, 215); g.quadraticCurveTo(470, 270, 550, 200); g.stroke();
      for (const [bx, by] of berries) { g.fillStyle = frozen ? '#d9d3e3' : '#c2182f'; g.beginPath(); g.arc(bx, by, 11, 0, 6.3); g.fill(); g.fillStyle = frozen ? '#ffffff' : 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(bx - 4, by - 4, 4, 2.6, -0.6, 0, 6.3); g.fill(); }
      if (frozen) { g.strokeStyle = '#e6f7ff'; g.lineWidth = 2; for (let i = 0; i < 10; i++) { const sx = 250 + ((i * 131) % 300), sy = 160 + ((i * 53) % 120); g.beginPath(); g.moveTo(sx - 6, sy); g.lineTo(sx + 6, sy); g.moveTo(sx, sy - 6); g.lineTo(sx, sy + 6); g.moveTo(sx - 4, sy - 4); g.lineTo(sx + 4, sy + 4); g.moveTo(sx + 4, sy - 4); g.lineTo(sx - 4, sy + 4); g.stroke(); } }
      if (phase === 'win') { // sprinklers spray over the vines
        for (const sx of [300, 400, 500]) { g.fillStyle = '#8a949e'; g.fillRect(sx - 3, 120, 6, 32); g.fillStyle = '#cfeeff'; for (let j = 0; j < 14; j++) { const u = (sprayT * 0.9 + j * 0.41) % 1, a = j * 0.9 + sprayT * 2; const px = sx + Math.cos(a) * u * 52, py = 118 - u * (1 - u) * 60 + u * u * 34; g.beginPath(); g.arc(px, py, 3, 0, 6.3); g.fill(); } } }
      // the thermometer
      const sx = shake > 0 ? Math.sin(t * 60) * 7 * shake : 0;
      g.save(); g.translate(sx, 0);
      g.fillStyle = '#f4efe4'; g.beginPath(); g.roundRect(TX - 28, T0 - 18, 56, T1 - T0 + 36, 26); g.fill();
      const yb = T0 + band[0] * (T1 - T0), ye = T0 + band[1] * (T1 - T0), yf = T0 + frostAt * (T1 - T0);
      g.fillStyle = '#5ab4f0'; g.fillRect(TX - 28, yb, 56, ye - yb);                                     // the blue band: just right
      g.fillStyle = '#d9e6f2'; g.fillRect(TX - 28, yf, 56, T1 + 18 - yf);                                 // below it: frost
      g.fillStyle = '#c9c2b5'; g.fillRect(TX - 8, T0, 16, T1 - T0);
      g.fillStyle = '#d3193a'; const y = T0 + Math.min(lvl, 1) * (T1 - T0); g.fillRect(TX - 8, y, 16, T1 - y + 6); g.beginPath(); g.arc(TX, T1 + 8, 18, 0, 6.3); g.fill();
      g.fillStyle = '#4a2c17'; for (let i = 0; i <= 8; i++) { g.fillRect(TX + 14, T0 + i * (T1 - T0) / 8, i % 2 ? 6 : 10, 2); }
      const k = ts(); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#8fd3ff'; word(g, k, 'NOW!', TX + 34, (yb + ye) / 2, 17, 92); g.fillStyle = '#e6f0f8'; word(g, k, 'FROST', TX + 34, yf + 12, 17, 92);
      g.fillStyle = '#f2c43d'; word(g, k, 'WARM', TX + 34, T0 + 10, 17, 92);
      g.restore();
      // tries
      if (misses) { g.textAlign = 'right'; g.fillStyle = '#fff'; word(g, ts(), 'try ' + (misses + 1), W - 14, H - 16, 16); }
    }
    setZone('warm'); draw();
  });
}

/**
 * Simmer the sauce. Hold the heat (button, canvas, or E/Space) to warm the pot; let go to cool it. In the green "simmer" band the
 * berries pop one by one (8 to win); in the red band the pot boils over and nothing pops until it cools. After 35 s Grandpa
 * turns the dial for you so it always ends. About 15–35 s.
 */
export function simmerGame(ctx) {
  return new Promise((done) => {
    const { p, cv, g, btn, hint, ts } = shell(ctx, '🔥 Simmer the berries', 'Hold for heat. Keep it green!', ['🔥 Hold for heat (E)', '#ffb347'], '#fff3d6');
    p.el.dataset.game = 'simmer';
    const W = 560, H = 300, NEED = 8, GX = 436, G0 = 30, G1 = 250;   // gauge x, top and bottom
    const GREEN = [0.42, 0.72];
    let heat = 0, held = false, popT = 0, pops = 0, t = 0, foam = 0, phase = 'play', helped = false, ended = false, coldT = 0, hot = false, lastHint = '';
    const say = (s) => { if (s !== lastHint) { lastHint = s; hint(s); } };
    const berries = Array.from({ length: NEED }, (_, i) => ({ x: 160 + (i % 4) * 40 + (i > 3 ? 20 : 0), y: 176 + (i > 3 ? -22 : 0), r: 15, pop: 0 }));
    const press = (on) => { held = on; };
    for (const el of [btn, cv]) { el.addEventListener('pointerdown', (e) => { e.preventDefault(); press(true); }); }
    const up = () => press(false); for (const ev of ['pointerup', 'pointercancel']) window.addEventListener(ev, up);
    btn.addEventListener('pointerleave', () => press(false)); cv.addEventListener('pointerleave', () => press(false));
    const zone = () => heat < GREEN[0] ? 'cold' : heat < GREEN[1] ? 'green' : 'hot';
    const stop = ctx.onUpdate((dt) => {
      if (ended) return; dt = Math.min(dt, 0.05); t += dt;
      const on = held || keyHeld(ctx);
      if (phase === 'play') {
        if (!helped && t > 35) { helped = true; say('Grandpa helps! 👴'); ctx.audio.play('ding'); }
        if (helped) heat += ((GREEN[0] + GREEN[1]) / 2 - heat) * Math.min(1, dt * 2);
        else heat = Math.max(0, Math.min(1, heat + (on ? 0.3 : -0.22) * dt));
        const z = zone(); p.el.dataset.zone = z; p.el.dataset.heat = heat.toFixed(2);
        if (z === 'hot') { foam = Math.min(1, foam + dt * 2); if (!hot) { hot = true; ctx.audio.play('fizz'); } say('Too hot! Let go! 🔥'); popT = 0; }
        else { foam = Math.max(0, foam - dt * 1.2); hot = false; }
        if (z === 'green') { coldT = 0; say(pops ? (NEED - pops) + ' more to pop' : 'Nice and gentle…'); popT += dt; if (Math.floor(t * 3) !== Math.floor((t - dt) * 3)) ctx.audio.play('bubble');
          if (popT >= 0.9) { popT = 0; const b = berries.find(x => !x.pop); if (b) { b.pop = 0.001; pops++; p.el.dataset.pops = pops; ctx.audio.play(pops % 3 ? 'pop' : 'cork'); } if (pops >= NEED) { phase = 'win'; t = 0; ctx.audio.play('success'); say('All popped! 😋'); p.el.dataset.zone = 'win'; } } }
        else if (z === 'cold') { coldT += dt; if (coldT > 1.2) say(on ? 'Warming up…' : 'Hold for heat 🔥'); }
      } else if (phase === 'win' && t > 1.6) { ended = true; stop(); for (const ev of ['pointerup', 'pointercancel']) window.removeEventListener(ev, up); p.close(); done(helped); return; }
      for (const b of berries) if (b.pop) b.pop = Math.min(1, b.pop + dt * 2);
      draw();
    });
    function draw() {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff3d6'; g.fillRect(0, 0, W, H);
      const z = zone(), wob = z === 'green' ? 1.5 : z === 'hot' ? 4 : 0;
      // stove
      g.fillStyle = '#3a3f45'; g.beginPath(); g.roundRect(90, 244, 260, 46, 10); g.fill(); g.fillStyle = '#23272b'; g.fillRect(110, 240, 220, 10);
      const flame = heat * 30; if (heat > 0.05) { g.fillStyle = z === 'hot' ? '#ff6a2b' : '#ffae3a'; for (let i = 0; i < 7; i++) { const fx = 150 + i * 23, fh = flame * (0.7 + 0.3 * Math.sin(t * 17 + i)); g.beginPath(); g.moveTo(fx - 8, 242); g.quadraticCurveTo(fx, 242 - fh * 2, fx + 8, 242); g.fill(); } }
      // pot
      g.save(); g.translate(Math.sin(t * 37) * wob * 0.4, 0);
      g.fillStyle = '#8a949e'; g.beginPath(); g.roundRect(120, 130, 200, 84, 12); g.fill(); g.fillStyle = '#6d747c'; g.fillRect(112, 124, 216, 12); g.fillRect(320, 138, 60, 10);
      // the sauce with berries: pink water turns into deep red sauce as the berries pop
      const k = pops / NEED; g.fillStyle = 'rgb(' + Math.round(217 - 60 * k) + ',' + Math.round(96 - 80 * k) + ',' + Math.round(122 - 70 * k) + ')'; g.beginPath(); g.roundRect(128, 140, 184, 66, 8); g.fill();
      for (const b of berries) { const by = b.y + (wob ? Math.sin(t * 23 + b.x) * wob : 0);
        if (!b.pop) { g.fillStyle = '#c2182f'; g.beginPath(); g.arc(b.x, by, b.r, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(b.x - 5, by - 5, 5, 3, -0.6, 0, 6.3); g.fill(); }
        else { const k = b.pop; g.fillStyle = '#7d1020'; g.beginPath(); g.ellipse(b.x, by + 4, b.r * (1 + k * 0.6), b.r * (1 - k * 0.6), 0, 0, 6.3); g.fill();
          if (k < 1) { g.fillStyle = '#ff6a7a'; for (let i = 0; i < 6; i++) { const a = i * 1.05, d = 12 + k * 26; g.beginPath(); g.arc(b.x + Math.cos(a) * d, by + Math.sin(a) * d - k * 10, 4 * (1 - k), 0, 6.3); g.fill(); } } } }
      // bubbles on a simmer, foam when too hot
      if (z !== 'cold') { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < (z === 'hot' ? 10 : 4); i++) { const u = (t * (z === 'hot' ? 1.6 : 0.7) + i * 0.37) % 1; g.beginPath(); g.arc(140 + ((i * 53) % 170), 146 - u * 12, 3 + u * 3, 0, 6.3); g.fill(); } }
      if (foam > 0) { g.fillStyle = '#f8d6dc'; g.beginPath(); g.roundRect(112, 124 - foam * 26, 216, foam * 26 + 4, 10); g.fill(); g.fillStyle = '#f2b8c2'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(120 + i * 50, 248 + Math.sin(i * 3) * 6, 14, 6 * foam, 0, 0, 6.3); g.fill(); } }
      g.restore();
      // the heat gauge
      const gy = (v) => G1 - v * (G1 - G0);
      g.fillStyle = '#f4efe4'; g.beginPath(); g.roundRect(GX - 24, G0 - 14, 48, G1 - G0 + 28, 20); g.fill();
      g.fillStyle = '#bcd4e6'; g.fillRect(GX - 16, gy(GREEN[0]), 32, G1 - gy(GREEN[0]));
      g.fillStyle = '#6fcf6a'; g.fillRect(GX - 16, gy(GREEN[1]), 32, gy(GREEN[0]) - gy(GREEN[1]));
      g.fillStyle = '#e8503a'; g.fillRect(GX - 16, G0, 32, gy(GREEN[1]) - G0);
      g.fillStyle = '#4a2c17'; g.beginPath(); g.moveTo(GX - 28, gy(heat)); g.lineTo(GX - 44, gy(heat) - 9); g.lineTo(GX - 44, gy(heat) + 9); g.closePath(); g.fill(); g.fillRect(GX - 18, gy(heat) - 2, 36, 4);
      const big = ts(); g.textAlign = 'left'; g.textBaseline = 'middle'; word(g, big, 'TOO HOT', GX + 30, gy(0.86), 15, 90); word(g, big, 'SIMMER', GX + 30, gy(0.57), 15, 90); word(g, big, 'COLD', GX + 30, gy(0.2), 15, 90);
      // progress pips
      for (let i = 0; i < NEED; i++) { g.fillStyle = i < pops ? '#d3193a' : 'rgba(74,44,23,.2)'; g.beginPath(); g.arc(24 + i * 20, 22, 6.5, 0, 6.3); g.fill(); }
    }
    p.el.dataset.zone = 'cold'; draw();
  });
}
