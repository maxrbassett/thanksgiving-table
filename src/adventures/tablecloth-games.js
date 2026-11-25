// Three small mini-games for "Grandma's Tablecloth", each a pop-up panel (ctx.ui.panel) with a 2D canvas:
//   treadleGame(ctx) — keep the spinning wheel's treadle in rhythm (a timing tap)
//   geeHawGame(ctx)  — steer the oxen by the teamster's calls: "gee" = right, "haw" = left (a quick left/right choice)
//   hackleGame(ctx)  — comb the flax and sort long fibre (for linen) from short tow (for rope) (a sorting choice)
// Both use only game time (ctx.onUpdate / ctx.after), work with the keyboard (E / Space, A / D, arrows) and with big buttons for touch,
// and always end in success: a wrong try just nudges, and the game gets more forgiving the longer it goes on.
const EMOJI = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const BTN = 'class="btn big" style="font-size:26px;padding:12px 26px;min-width:150px;touch-action:manipulation"';

/** the shared pop-up: a heading (icon · name · progress dots), a canvas, one short hint line and a row of big buttons.
 *  On a phone held sideways (a short, wide screen) the picture sits on the left at nearly full height and the heading, hint and buttons
 *  in a column on its right; on a phone held upright the picture uses the full width and the buttons share one row. */
function shell(ctx, { icon, name, W, H, hint, buttons, id }) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const wide = vh < 480 && vw > vh * 1.3, narrow = !wide && vw < 480;
  const headHtml = '<span class="em" id="' + id + 'Icon" style="font-size:34px">' + icon + '</span><span id="' + id + 'Name"' + (wide || narrow ? ' style="white-space:nowrap"' : '') + '>' + esc(name) + '</span><span id="' + id + 'Dots" style="letter-spacing:4px;font-size:18px;white-space:nowrap"></span>';
  const frame = (css) => '<div style="position:relative;' + css + ';aspect-ratio:' + W + '/' + H + ';border-radius:16px;overflow:hidden;box-shadow:0 0 0 4px #c9a26b,0 5px 0 rgba(74,44,23,.25)"><canvas id="' + id + 'Canvas" width="' + W + '" height="' + H + '" style="cursor:pointer;touch-action:none;width:100%;height:100%;display:block"></canvas></div>';
  const small = 'class="btn big" style="font-size:22px;padding:14px 6px;min-width:0;flex:1 1 0;white-space:nowrap;touch-action:manipulation"';
  const btns = (attr) => buttons.map(([bid, label]) => '<button ' + attr + ' id="' + bid + '">' + label + '</button>').join('');
  let html;
  if (wide) {
    const ch = Math.min(H, vh - 58), cw = Math.round(ch * W / H), col = Math.max(200, Math.min(270, Math.floor(Math.min(vw * 0.94, 820) - 44 - cw - 16)));
    html = '<div style="display:flex;gap:16px;align-items:stretch;margin:-2px">' + frame('flex:none;width:' + cw + 'px;margin:4px')
      + '<div style="width:' + col + 'px;flex:none;display:flex;flex-direction:column;justify-content:space-evenly;align-items:center">'
      + '<div style="font-size:25px;font-weight:800;display:flex;flex-wrap:wrap;gap:2px 8px;justify-content:center;align-items:center">' + headHtml + '</div>'
      + '<div id="' + id + 'Hint" style="font-size:20px;font-weight:700;color:#6a4a2a;line-height:1.25">' + esc(hint) + '</div>'
      + '<div style="display:flex;gap:10px;justify-content:center;align-self:stretch">' + btns(small) + '</div></div></div>';
  } else if (narrow) {
    html = '<div style="font-size:25px;font-weight:800;margin:-4px 0 8px;display:flex;flex-wrap:wrap;gap:0 10px;justify-content:center;align-items:center">' + headHtml + '</div>'
      + frame('width:min(100vw - 70px,' + W + 'px);margin:4px auto')
      + '<div id="' + id + 'Hint" style="font-size:20px;font-weight:700;margin:10px 0 8px;color:#6a4a2a">' + esc(hint) + '</div>'
      + '<div style="display:flex;gap:10px;justify-content:center">' + btns(buttons.length > 1 ? small : BTN) + '</div>';
  } else {
    html = '<div style="font-size:26px;font-weight:800;margin:-4px 0 8px;display:flex;gap:10px;justify-content:center;align-items:center">' + headHtml + '</div>'
      + frame('width:min(78vw,' + W + 'px);margin:4px auto')
      + '<div id="' + id + 'Hint" style="font-size:21px;font-weight:700;margin:10px 0 8px;color:#6a4a2a">' + esc(hint) + '</div>'
      + '<div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap">' + btns(BTN) + '</div>';
  }
  const p = ctx.ui.panel(html);
  const q = (s) => p.el.querySelector(s);
  const cv = q('#' + id + 'Canvas');
  return { p, cv, g: cv.getContext('2d'), iconEl: q('#' + id + 'Icon'), nameEl: q('#' + id + 'Name'), dotsEl: q('#' + id + 'Dots'), hintEl: q('#' + id + 'Hint'), btn: (bid) => q('#' + bid) };
}
const dots = (n, total) => '●'.repeat(Math.min(n, total)) + '○'.repeat(Math.max(0, total - n));
const rounded = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
/** keys pressed since the last call (edge detection on ctx.game.keys) */
function keyEdges(ctx, names, prev) { const K = ctx.game.keys, out = []; for (const k of names) { const down = K.has(k); if (down && !prev.has(k)) out.push(k); if (down) prev.add(k); else prev.delete(k); } return out; }

// ---------------------------------------------------------------------------------------------------------------
/** Treadle the spinning wheel: a dot rides round the wheel; tap (E / Space / the button / the picture) each time it passes the star at the top.
 *  A steady foot on the treadle is what keeps the thread even. 6 good taps wind the bobbin. Early or late taps only make the thread wobble. */
export function treadleGame(ctx, o = {}) {
  return new Promise((resolve) => {
    const W = 560, H = 380, CX = 190, CY = 168, R = 118, NEED = 6;
    const s = shell(ctx, { icon: '🌀', name: 'Treadle', W, H, hint: 'Tap when the dot glows', buttons: [['tgTap', '<span class="em">👟</span> Tap!']], id: 'tg' });
    const { cv, g } = s;
    let ang = Math.PI, t = 0, good = 0, misses = 0, wobble = 0, treadle = 0, msg = '', msgT = 0, tappedThisPass = false, done = false, bob = 0;
    const period = 2.2; let zone = 0.85; // radians each side of the top; widens after misses
    const wrap = (a) => { a = a % (Math.PI * 2); if (a > Math.PI) a -= Math.PI * 2; if (a < -Math.PI) a += Math.PI * 2; return a; };
    const inZone = () => Math.abs(wrap(ang)) < zone;
    const head = () => { s.dotsEl.textContent = done ? '' : dots(good, NEED); if (done) { s.iconEl.textContent = '💛'; s.nameEl.textContent = 'Even thread!'; s.hintEl.textContent = 'Steady feet, fine thread'; } };
    const tap = () => {
      if (done) return;
      const late = t > 40; // after a long while every tap counts, so nobody is ever stuck
      if (inZone() || late) {
        if (tappedThisPass && !late) return; // a second tap in the same pass is just ignored
        tappedThisPass = true; good++; treadle = 1; msg = ['Good!', 'Nice!', 'Steady!'][good % 3]; msgT = 0.9; ctx.audio.play('click'); if (o.onGood) o.onGood(good, NEED);
        head(); if (good >= NEED) finish();
      } else {
        misses++; wobble = 1; treadle = 0.5; msg = wrap(ang) < 0 ? 'Not yet…' : 'Too late…'; msgT = 1.0; ctx.audio.play('error');
        if (misses % 2 === 0) zone = Math.min(1.6, zone + 0.25); // every second miss the window gets wider
      }
    };
    const finish = () => { done = true; head(); ctx.audio.play('success'); ctx.after(1.3, () => { stop(); s.p.close(); resolve(); }); };
    const draw = () => {
      // workshop wall
      g.fillStyle = '#e9d9b8'; g.fillRect(0, 0, W, H); g.fillStyle = '#c9a878'; g.fillRect(0, H - 62, W, 62); g.fillStyle = '#b89262'; for (let x = 0; x < W; x += 70) g.fillRect(x, H - 62, 2, 62);
      // the wheel: rim, spokes, hub
      g.save(); g.translate(CX, CY);
      g.lineWidth = 14; g.strokeStyle = '#6e4a28'; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 6; g.strokeStyle = '#8a6a45'; for (let i = 0; i < 10; i++) { const a = ang + i * Math.PI / 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a) * (R - 6), -Math.cos(a) * (R - 6)); g.stroke(); }
      g.fillStyle = '#5a3d24'; g.beginPath(); g.arc(0, 0, 16, 0, Math.PI * 2); g.fill();
      // the sweet spot on the rim, and the star above it
      g.lineWidth = 20; g.strokeStyle = 'rgba(255,200,60,' + (inZone() ? 0.85 : 0.45) + ')'; g.beginPath(); g.arc(0, 0, R, -Math.PI / 2 - zone, -Math.PI / 2 + zone); g.stroke();
      g.font = '30px ' + EMOJI; g.textAlign = 'center'; g.fillText('⭐', 0, -R - 30 + Math.sin(t * 6) * 3);
      // the riding dot
      const dx = Math.sin(ang) * R, dy = -Math.cos(ang) * R, hot = inZone();
      if (hot) { g.fillStyle = 'rgba(255,230,120,.55)'; g.beginPath(); g.arc(dx, dy, 26, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = hot ? '#ffe066' : '#d9622b'; g.beginPath(); g.arc(dx, dy, hot ? 15 : 11, 0, Math.PI * 2); g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
      g.restore();
      // the treadle board under the wheel, pushed down on every tap
      g.save(); g.translate(CX - 70, H - 70); g.rotate(-0.25 + treadle * 0.35); g.fillStyle = '#8a6a45'; rounded(g, 0, -8, 150, 16, 6); g.fill(); g.restore();
      g.fillStyle = '#6e4a28'; g.fillRect(CX - 8, CY + R + 4, 16, H - 70 - CY - R); // the footman from wheel to treadle
      // thread from the wheel to the bobbin on the right; it wobbles after a bad tap
      const BX = 440, BY = 150;
      g.lineWidth = 3; g.strokeStyle = '#f7f3e8'; g.beginPath(); g.moveTo(CX + R - 4, CY - 40);
      for (let i = 1; i <= 12; i++) { const k = i / 12, x = CX + R - 4 + (BX - 30 - CX - R + 4) * k, y = CY - 40 + (BY - CY + 40) * k + Math.sin(i * 2.1 + t * 30) * 9 * wobble; g.lineTo(x, y); } g.stroke();
      // bobbin: a spool that fills up with each good tap
      g.save(); g.translate(BX, BY);
      g.fillStyle = '#8a6a45'; rounded(g, -36, -16, 72, 32, 6); g.fill(); g.fillStyle = '#6e4a28'; rounded(g, -44, -24, 12, 48, 4); g.fill(); rounded(g, 32, -24, 12, 48, 4); g.fill();
      const fill = good / NEED; g.fillStyle = '#f7f3e8'; rounded(g, -32, -16 - fill * 7, 64, 32 + fill * 14, 6); g.fill();
      g.strokeStyle = 'rgba(180,160,130,.6)'; g.lineWidth = 1.5; for (let x = -28; x <= 28; x += 5) { const sx = x + ((bob * 40) % 5); g.beginPath(); g.moveTo(sx, -16 - fill * 7); g.lineTo(sx, 16 + fill * 7); g.stroke(); }
      g.restore();
      // the flyer arm turning above the bobbin
      g.save(); g.translate(BX, BY - 44); g.rotate(bob * 6); g.fillStyle = '#5a3d24'; rounded(g, -30, -5, 60, 10, 4); g.fill(); g.restore();
      // feedback word
      if (msgT > 0) { g.font = '800 30px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillStyle = msg.endsWith('…') ? '#b34a2a' : '#2f8f4f'; g.fillText(msg, BX, BY + 78); }
      if (done) { g.font = '44px ' + EMOJI; g.textAlign = 'center'; g.fillText('✨', BX - 70, BY - 70); g.fillText('✨', BX + 70, BY - 90); }
      cv.dataset.inzone = inZone() ? '1' : '0'; cv.dataset.good = String(good); cv.dataset.done = done ? '1' : '0';
    };
    const stop = ctx.onUpdate((dt) => {
      t += dt; ang += dt * Math.PI * 2 / period; if (tappedThisPass && wrap(ang) > zone) tappedThisPass = false; // a tap counts again once the dot has left the star
      bob += dt * (0.3 + good * 0.15); wobble = Math.max(0, wobble - dt * 1.6); treadle = Math.max(0, treadle - dt * 3); msgT -= dt;
      if (ctx.game.input.usePressed) tap();
      draw();
    });
    const onTap = (e) => { e.preventDefault(); tap(); };
    cv.addEventListener('pointerdown', onTap); s.btn('tgTap').addEventListener('pointerdown', onTap);
    head(); draw();
  });
}

// ---------------------------------------------------------------------------------------------------------------
/** Gee and haw: the trail bends; at every bend the teamster calls "Gee!" (turn right) or "Haw!" (turn left) and the player
 *  answers with the matching button or key (A / ← = haw, D / → = gee). A wrong call just stops the oxen for a moment ("Whoa!");
 *  after two wrong tries an arrow shows the way, so the game always reaches the camp. */
export function geeHawGame(ctx) {
  return new Promise((resolve) => {
    const W = 560, H = 380, OX = W / 2, OY = 262, BENDS = 6, SPEED = 78, LEG = 150;
    const s = shell(ctx, { icon: '🐂', name: 'Gee & Haw', W, H, hint: 'Gee = right · Haw = left', buttons: [['ghHaw', '<span class="em">⬅️</span> Haw'], ['ghGee', 'Gee <span class="em">➡️</span>']], id: 'gh' });
    const { cv, g } = s;
    // the trail: straight legs joined by bends of ±55°, with the camp at the far end
    const pts = [[0, 0]], calls = []; let dir = -Math.PI / 2, x = 0, y = 0, last = 0;
    for (let i = 0; i < BENDS; i++) { x += Math.cos(dir) * LEG; y += Math.sin(dir) * LEG; pts.push([x, y]); const right = i === 0 ? Math.random() < 0.5 : (last === 1 ? Math.random() < 0.7 : Math.random() < 0.3) /* mostly alternating */; last = right ? -1 : 1; calls.push(right ? 'gee' : 'haw'); dir += right ? 0.96 : -0.96; }
    x += Math.cos(dir) * (LEG + 90); y += Math.sin(dir) * (LEG + 90); pts.push([x, y]); // the camp sits at the far end of the last leg
    const legLen = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    const total = legLen.reduce((a, b) => a + b, 0), END = total - 120; // the oxen stop a little short of the camp, so it stays in view
    const at = (d) => { let i = 0; while (i < legLen.length - 1 && d > legLen[i]) { d -= legLen[i]; i++; } const k = Math.min(1, d / legLen[i]), [ax, ay] = pts[i], [bx, by] = pts[i + 1]; return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, a: Math.atan2(by - ay, bx - ax), leg: i }; };
    let dist = 0, bend = 0, t = 0, head = -Math.PI / 2, waiting = false, wrong = 0, wrongHere = 0, whoa = 0, msg = '', msgT = 0, done = false, callT = 0, bob = 0;
    const prev = new Set();
    const headUI = () => { s.dotsEl.textContent = done ? '' : dots(bend, BENDS); if (done) { s.iconEl.textContent = '🏕️'; s.nameEl.textContent = 'Camp ahead!'; s.hintEl.textContent = 'Well driven!'; } };
    const answer = (side) => {
      if (done || !waiting || whoa > 0) return;
      const want = calls[bend];
      if (side === want || wrong >= 5) { bend++; waiting = false; wrongHere = 0; msg = side === 'gee' ? 'Gee! ➡️' : 'Haw! ⬅️'; msgT = 1.2; ctx.audio.play('moo'); headUI(); }
      else { wrong++; wrongHere++; whoa = 0.7; msg = 'Whoa!'; msgT = 0.9; ctx.audio.play('error'); }
    };
    const finish = () => { done = true; headUI(); ctx.audio.play('success'); ctx.after(1.4, () => { stop(); s.p.close(); resolve(); }); };
    const sage = []; { let h = 7; for (let i = 0; i < 90; i++) { h = (h * 16807) % 2147483647; const r1 = h / 2147483647; h = (h * 16807) % 2147483647; const r2 = h / 2147483647; sage.push([(r1 - 0.5) * 1700, -r2 * 1500 + 250, 8 + (i % 3) * 4]); } } // scattered sagebrush (fixed pattern)
    const ox = (x0, col) => { g.fillStyle = col; rounded(g, x0 - 16, -34, 32, 62, 12); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x0, -40, 13, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#f3e6c8'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 - 10, -46); g.quadraticCurveTo(x0 - 22, -58, x0 - 18, -66); g.moveTo(x0 + 10, -46); g.quadraticCurveTo(x0 + 22, -58, x0 + 18, -66); g.stroke(); g.fillStyle = '#3a2a20'; g.beginPath(); g.arc(x0 - 5, -43, 2, 0, 7); g.arc(x0 + 5, -43, 2, 0, 7); g.fill(); };
    const draw = () => {
      g.fillStyle = '#bdb96e'; g.fillRect(0, 0, W, H);
      const p = at(dist);
      g.save(); g.translate(OX, OY); g.rotate(-Math.PI / 2 - head); g.translate(-p.x, -p.y);
      for (const [sx, sy, r] of sage) { g.fillStyle = '#8a9a6a'; g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.fill(); }
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = '#c9a878'; g.lineWidth = 54; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke();
      g.strokeStyle = '#b08e62'; g.lineWidth = 6; g.setLineDash([14, 18]); g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); g.setLineDash([]);
      // bend markers: a little post at each bend still to come
      for (let i = 1; i <= BENDS; i++) { const [bx, by] = pts[i]; g.fillStyle = i - 1 < bend ? '#6f8f4a' : '#d9622b'; g.beginPath(); g.arc(bx, by, 9, 0, Math.PI * 2); g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); }
      const [ex, ey] = pts[pts.length - 1]; g.save(); g.translate(ex, ey); g.rotate(Math.PI / 2 + head); g.font = '54px ' + EMOJI; g.textAlign = 'center'; g.fillText('🏕️', 0, 20); g.restore();
      g.restore();
      // the team, seen from above, always pointing up the screen
      g.save(); g.translate(OX, OY + (whoa > 0 ? Math.sin(t * 40) * 2 : 0));
      g.fillStyle = '#f3ead6'; rounded(g, -38, 30, 76, 100, 16); g.fill(); g.fillStyle = '#6e4a28'; g.fillRect(-46, 44, 8, 26); g.fillRect(38, 44, 8, 26); g.fillRect(-46, 100, 8, 26); g.fillRect(38, 100, 8, 26); g.fillRect(-5, 6, 10, 26); // wagon with its wheels and tongue
      g.strokeStyle = '#d9c9a8'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-38, 48 + k * 20); g.lineTo(38, 48 + k * 20); g.stroke(); }
      g.save(); g.translate(0, Math.abs(Math.sin(bob)) * -3); ox(-22, '#b5793f'); ox(22, '#e3d3b4'); g.fillStyle = '#d2a567'; rounded(g, -46, -30, 92, 10, 4); g.fill(); g.restore();
      g.restore();
      // the teamster's call
      if (waiting && !done) { const word = calls[bend] === 'gee' ? 'Gee!' : 'Haw!'; const pulse = 1 + Math.sin(t * 7) * 0.05;
        g.save(); g.translate(OX, 58); g.scale(pulse, pulse); g.fillStyle = '#fff8e8'; rounded(g, -120, -38, 240, 76, 22); g.fill(); g.lineWidth = 4; g.strokeStyle = '#6e4a28'; g.stroke();
        g.fillStyle = '#4a2c17'; g.font = '800 44px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, wrongHere >= 2 ? -26 : 0, 2);
        if (wrongHere >= 2) { g.font = '40px ' + EMOJI; g.fillText(calls[bend] === 'gee' ? '➡️' : '⬅️', 66, 2); } g.restore(); g.textBaseline = 'alphabetic'; }
      if (msgT > 0) { g.font = '800 32px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillStyle = msg === 'Whoa!' ? '#b34a2a' : '#2f6f3f'; g.fillText(msg, OX, 150); }
      cv.dataset.call = waiting && !done ? calls[bend] : ''; cv.dataset.bend = String(bend); cv.dataset.done = done ? '1' : '0';
    };
    const stop = ctx.onUpdate((dt) => {
      t += dt; msgT -= dt; whoa = Math.max(0, whoa - dt);
      const nextBend = bend < BENDS ? legLen.slice(0, bend + 1).reduce((a, b) => a + b, 0) : END;
      if (!waiting && !done) { dist = Math.min(nextBend, dist + dt * SPEED); bob += dt * 9; if (dist >= nextBend - 0.01) { if (bend < BENDS) { waiting = true; callT = t; ctx.audio.play('pop'); } else finish(); } }
      const want = at(Math.max(0, dist - 1)).a; // the leg just travelled: at a bend the road ahead is seen turning left or right let da = want - head; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; head += da * Math.min(1, dt * 4);
      for (const k of keyEdges(ctx, ['a', 'ArrowLeft', 'd', 'ArrowRight'], prev)) answer(k === 'a' || k === 'ArrowLeft' ? 'haw' : 'gee');
      draw();
    });
    s.btn('ghHaw').addEventListener('pointerdown', (e) => { e.preventDefault(); answer('haw'); });
    s.btn('ghGee').addEventListener('pointerdown', (e) => { e.preventDefault(); answer('gee'); });
    headUI(); draw();
  });
}

// ---------------------------------------------------------------------------------------------------------------
/** Comb and sort: the hackle (a board of iron spikes) combs the flax; long, straight fibre goes to the linen basket, the short
 *  tangled "tow" to the rope basket. One bundle at a time; the player answers Long (A / ← / button) or Short (D / → / button).
 *  A wrong answer only shakes the bundle; after two wrong tries on one bundle an arrow points to the right basket. */
export function hackleGame(ctx) {
  return new Promise((resolve) => {
    const W = 560, H = 380, NEED = 6, MX = W / 2, MY = 152, BASK = [[92, 312], [468, 312]];
    const LBL = window.innerWidth < 480 ? 30 : 24; // the basket names are drawn larger on an upright phone, where the picture is shown at about half size
    const s = shell(ctx, { icon: '✨', name: 'Comb & Sort', W, H, hint: 'Long = linen · Short = rope', buttons: [['hkLong', '<span class="em">⬅️</span> Long'], ['hkShort', 'Short <span class="em">➡️</span>']], id: 'hk' });
    const { cv, g } = s;
    // 3 long and 3 short bundles, shuffled (never the same kind three times running)
    let order; do { order = [1, 1, 1, 0, 0, 0].sort(() => Math.random() - 0.5); } while (order.some((v, i) => i >= 2 && v === order[i - 1] && v === order[i - 2]));
    let i = 0, t = 0, sorted = 0, wrong = 0, wrongHere = 0, shake = 0, fly = null, drop = 1, msg = '', msgT = 0, done = false, count = [0, 0];
    const prev = new Set();
    const headUI = () => { s.dotsEl.textContent = done ? '' : dots(sorted, NEED); if (done) { s.iconEl.textContent = '💛'; s.nameEl.textContent = 'Sorted!'; s.hintEl.textContent = 'Fine fibre for linen'; } };
    const answer = (side) => { // side: 0 = long / linen (left), 1 = short / rope (right)
      if (done || fly || drop < 1) return;
      const want = order[i] ? 0 : 1;
      if (side === want || wrong >= 5) { fly = { from: [MX, MY], to: BASK[want], k: 0, long: order[i] }; count[want]++; msg = want === 0 ? 'Linen!' : 'Rope!'; msgT = 1.0; ctx.audio.play('pickup'); }
      else { wrong++; wrongHere++; shake = 1; msg = 'Look again…'; msgT = 1.0; ctx.audio.play('error'); }
    };
    const next = () => { i++; sorted++; wrongHere = 0; drop = 0; headUI(); if (sorted >= NEED) finish(); };
    const finish = () => { done = true; headUI(); ctx.audio.play('success'); ctx.after(1.3, () => { stop(); s.p.close(); resolve(); }); };
    const bundle = (x, y, long, k = 1) => { // a tied bunch of fibre: long and straight, or short and curly
      g.save(); g.translate(x, y); g.scale(k, k); g.lineCap = 'round';
      if (long) { for (let j = 0; j < 11; j++) { const off = (j - 5) * 4.2, w = 3 + (j % 3) * 0.6; g.strokeStyle = j % 2 ? '#e8cf88' : '#c9a85a'; g.lineWidth = w; g.beginPath(); g.moveTo(off, -70); g.quadraticCurveTo(off + (j % 2 ? 6 : -6), 0, off * 1.4, 70); g.stroke(); } }
      else { for (let j = 0; j < 12; j++) { const a = j * 2.4, r = 18 + (j % 4) * 6; g.strokeStyle = j % 2 ? '#c9a85a' : '#a98a45'; g.lineWidth = 4; g.beginPath(); g.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.6); g.bezierCurveTo(Math.cos(a + 1.2) * r * 1.3, Math.sin(a + 1.2) * r, Math.cos(a + 2.8) * r * 0.9, Math.sin(a + 2.8) * r * 0.8, Math.cos(a + 3.6) * r * 0.5, Math.sin(a + 3.6) * r * 0.6); g.stroke(); } }
      g.fillStyle = '#b5793f'; rounded(g, -26, -8, 52, 16, 6); g.fill(); g.restore();
    };
    const draw = () => {
      g.fillStyle = '#e9d9b8'; g.fillRect(0, 0, W, H); g.fillStyle = '#b08e62'; g.fillRect(0, 228, W, H - 228); g.fillStyle = '#8a6a45'; g.fillRect(0, 228, W, 8); // the bench top
      // the hackle: a board with iron spikes, at the top
      g.fillStyle = '#6e4a28'; rounded(g, MX - 90, 18, 180, 44, 8); g.fill(); g.fillStyle = '#666'; for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) { g.beginPath(); g.moveTo(MX - 76 + c * 19, 30 + r * 12); g.lineTo(MX - 72 + c * 19, 30 + r * 12 + 8); g.lineTo(MX - 80 + c * 19, 30 + r * 12 + 8); g.fill(); }
      // baskets with their names
      for (let b = 0; b < 2; b++) { const [bx, by] = BASK[b]; g.fillStyle = '#c9a26b'; rounded(g, bx - 64, by - 40, 128, 72, 14); g.fill(); g.strokeStyle = '#a07d4a'; g.lineWidth = 3; for (let k = -48; k <= 48; k += 16) { g.beginPath(); g.moveTo(bx + k, by - 40); g.lineTo(bx + k, by + 32); g.stroke(); } g.fillStyle = '#8a6a45'; rounded(g, bx - 70, by - 48, 140, 14, 6); g.fill();
        g.fillStyle = '#4a2c17'; g.font = '800 ' + LBL + 'px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText(b === 0 ? 'Linen' : 'Rope', bx, by + 66); g.font = LBL + 'px ' + EMOJI; g.fillText(b === 0 ? '✨' : '⚓', bx + (b === 0 ? 48 : 44) * LBL / 24, by + 66);
        for (let k = 0; k < count[b]; k++) bundle(bx - 28 + k * 28, by - 30, b === 0, 0.28); }
      // the bundle being sorted: it drops from the comb, shakes when wrong, flies to a basket when right
      if (!done && i < NEED) { const d = 1 - Math.pow(1 - drop, 2), bx = MX + Math.sin(t * 50) * 10 * shake, by = 70 + (MY - 70) * d; if (!fly) bundle(bx, by, order[i]);
        if (wrongHere >= 2 && !fly) { const want = order[i] ? 0 : 1, ax = want === 0 ? MX - 120 - Math.sin(t * 8) * 8 : MX + 120 + Math.sin(t * 8) * 8; g.font = '44px ' + EMOJI; g.textAlign = 'center'; g.fillText(want === 0 ? '⬅️' : '➡️', ax, MY + 16); } }
      if (fly) { const k = 1 - Math.pow(1 - fly.k, 2), x = fly.from[0] + (fly.to[0] - fly.from[0]) * k, y = fly.from[1] + (fly.to[1] - 30 - fly.from[1]) * k - Math.sin(k * Math.PI) * 70; bundle(x, y, fly.long, 1 - 0.7 * k); }
      if (msgT > 0) { g.font = '800 30px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillStyle = msg.endsWith('…') ? '#b34a2a' : '#2f6f3f'; g.fillText(msg, MX, 306); }
      if (done) { g.font = '44px ' + EMOJI; g.textAlign = 'center'; g.fillText('✨', MX - 90, MY); g.fillText('✨', MX + 90, MY - 20); }
      cv.dataset.kind = !done && i < NEED && !fly && drop >= 1 ? (order[i] ? 'long' : 'short') : ''; cv.dataset.sorted = String(sorted); cv.dataset.done = done ? '1' : '0';
    };
    const stop = ctx.onUpdate((dt) => {
      t += dt; msgT -= dt; shake = Math.max(0, shake - dt * 3); drop = Math.min(1, drop + dt * 2.2);
      if (fly) { fly.k += dt * 1.8; if (fly.k >= 1) { fly = null; next(); } }
      for (const k of keyEdges(ctx, ['a', 'ArrowLeft', 'd', 'ArrowRight'], prev)) answer(k === 'a' || k === 'ArrowLeft' ? 0 : 1);
      draw();
    });
    s.btn('hkLong').addEventListener('pointerdown', (e) => { e.preventDefault(); answer(0); });
    s.btn('hkShort').addEventListener('pointerdown', (e) => { e.preventDefault(); answer(1); });
    headUI(); draw();
  });
}
