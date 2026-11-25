// The Wooden Table — two short mini-games that sit inside the story (see woodtable.js):
//   craneGame: at the log landing, the loader's grapple swings along the boom; drop it when it hangs over the log (timing).
//   sandGame:  in the workshop, pick the three sandpapers in the order a finisher uses them: rough first, smooth last (sequence).
// Both use game time only (ctx.onUpdate / ctx.after), keys the game already uses (E / Space / arrows / A / D) and buttons for touch,
// and neither can be lost: a miss or a wrong pick just nudges and lets the player try again.

const KEYUSE = (e) => e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter';
const EMOJI = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
const TITLE = (icon, text) => '<div style="font-size:clamp(19px,5.6vw,26px);font-weight:700;margin-bottom:6px"><span class="em">' + icon + '</span> ' + text + '</div>';

/** the loader: stop the swinging grapple over the log and drop it. round = 0 or 1 (the log lies on a different side each time) */
export function craneGame(ctx, round) {
  return new Promise(res => {
    const p = ctx.ui.panel(TITLE('🏗️', 'Drop the hook on the log!') + '<canvas width="460" height="250" style="width:460px;max-width:80vw;display:block;margin:0 auto;cursor:pointer;touch-action:none"></canvas><button class="btn big wt-drop" style="margin-top:10px;touch-action:none"><span class="em">⬇️</span> Drop</button>');
    const cv = p.el.querySelector('canvas'), g = cv.getContext('2d'), btn = p.el.querySelector('.wt-drop'); p.el.addEventListener('contextmenu', (e) => e.preventDefault()); // (a long press on a phone must not open a menu)
    const W = 460, H = 250, BOOM = 40, GROUND = 206, LOGX = round ? 330 : 130, LOGW = 150, LOGH = 44, HIT = 72;
    let hx = round ? 80 : 380, dir = round ? 1 : -1, speed = 170, drop = 0, state = 'swing', msg = '', msgT = 0, liftY = 0;
    const drawLog = (x, y) => { // a log seen from the side: bark, a pale cut end with rings
      g.fillStyle = '#6b4a2f'; g.beginPath(); g.roundRect(x - LOGW / 2, y - LOGH / 2, LOGW, LOGH, LOGH / 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.roundRect(x - LOGW / 2, y + LOGH * 0.18, LOGW, LOGH * 0.32, [0, 0, LOGH / 2, LOGH / 2]); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)'; for (const k of [-40, 0, 40]) g.fillRect(x + k - 26, y - 14, 30, 3);
      g.fillStyle = '#e2c28c'; g.beginPath(); g.ellipse(x + LOGW / 2 - 4, y, 14, LOGH / 2 - 2, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(120,78,40,.6)'; g.lineWidth = 1.5; for (const r of [0.35, 0.65]) { g.beginPath(); g.ellipse(x + LOGW / 2 - 4, y, 14 * r, (LOGH / 2 - 2) * r, 0, 0, 7); g.stroke(); }
    };
    const draw = () => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#dff1fb'; g.fillRect(0, 0, W, H); g.fillStyle = '#b7cf8e'; g.fillRect(0, GROUND, W, H - GROUND); g.fillStyle = '#a78a5e'; g.fillRect(0, GROUND + 12, W, H);
      g.fillStyle = '#8c7248'; for (const [x, w] of [[40, 50], [250, 70], [400, 40]]) { g.beginPath(); g.ellipse(x, GROUND + 10, w, 5, 0, 0, 7); g.fill(); }
      // the crane: a post at the left, the yellow boom and the trolley that runs along it
      g.fillStyle = '#3a3a3a'; g.fillRect(8, BOOM - 10, 22, GROUND - BOOM + 10); g.fillStyle = '#dba21c'; g.fillRect(8, BOOM - 10, W - 16, 18); g.fillStyle = '#b8871a'; g.fillRect(8, BOOM + 2, W - 16, 6);
      g.fillStyle = '#3a3a3a'; g.beginPath(); g.roundRect(hx - 20, BOOM - 16, 40, 30, 6); g.fill();
      // the log on the ground (or hanging from the grapple)
      const hy = BOOM + 14 + drop * (GROUND - BOOM - LOGH - 30), held = state === 'lift' || state === 'done';
      const ly = held ? hy + 40 : GROUND - LOGH / 2 + 2, lx = held ? hx : LOGX;
      if (!held) { g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(LOGX, GROUND + 2, LOGW / 2 + 6, 8, 0, 0, 7); g.fill(); }
      if (state === 'swing' && Math.abs(hx - LOGX) <= HIT) { g.fillStyle = 'rgba(255,201,60,.35)'; g.beginPath(); g.roundRect(LOGX - LOGW / 2 - 10, ly - LOGH / 2 - 10, LOGW + 20, LOGH + 20, 30); g.fill(); }
      drawLog(lx, ly);
      // cable and grapple (the tines close on the log once it is held)
      g.strokeStyle = '#222'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, BOOM + 14); g.lineTo(hx, hy); g.stroke();
      g.fillStyle = '#dba21c'; g.beginPath(); g.roundRect(hx - 16, hy, 32, 22, 5); g.fill();
      const open = held ? 0.15 : 0.6; g.strokeStyle = '#2e2e2e'; g.lineWidth = 7; g.lineCap = 'round';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(hx + s * 10, hy + 20); g.quadraticCurveTo(hx + s * (26 + open * 22), hy + 40, hx + s * (12 + open * 10), hy + 46 + (held ? 6 : 0)); g.stroke(); }
      g.lineCap = 'butt';
      if (msg) { g.font = '700 30px Fredoka,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 6; g.strokeStyle = '#fff8e8'; g.strokeText(msg, W / 2, 229); g.fillStyle = '#4a2c17'; g.fillText(msg, W / 2, 229); }
      p.el.dataset.hook = hx.toFixed(0); p.el.dataset.log = LOGX; p.el.dataset.state = state;
    };
    let dropT = 0;
    const go = (e) => { if (ctx.disposed) { window.removeEventListener('keydown', go); return; } if (e.type === 'keydown' && (e.repeat || !KEYUSE(e))) return; e.preventDefault(); if (state !== 'swing') return; state = 'drop'; dropT = 0; msg = ''; ctx.audio.play('whoosh'); };
    cv.addEventListener('pointerdown', go); btn.addEventListener('pointerdown', go); btn.addEventListener('click', (e) => e.preventDefault()); window.addEventListener('keydown', go);
    const stop = ctx.onUpdate((dt) => {
      if (state === 'swing') { hx += dir * speed * dt; if (hx > 410) { hx = 410; dir = -1; } if (hx < 50) { hx = 50; dir = 1; } }
      else if (state === 'drop') { dropT += dt; drop = Math.min(1, dropT / 0.45) ** 2; if (drop >= 1) { if (Math.abs(hx - LOGX) <= HIT) { state = 'lift'; msg = 'Got it!'; ctx.audio.play('clink'); } else { state = 'miss'; msg = 'Missed! Try again'; ctx.audio.play('error'); speed = Math.max(70, speed * 0.72); } dropT = 0; } }
      else if (state === 'miss') { dropT += dt; drop = 1 - Math.min(1, dropT / 0.5); if (drop <= 0) { state = 'swing'; } }
      else if (state === 'lift') { dropT += dt; drop = 1 - Math.min(1, dropT / 0.6); if (drop <= 0) { state = 'done'; stop(); window.removeEventListener('keydown', go); ctx.audio.play('success'); btn.innerHTML = '<span class="em">✅</span> Got it!'; ctx.after(1.0, () => { p.close(); res(); }); } }
      draw();
    });
    draw();
  });
}

/** sandpaper: pick the three sheets in the order they are used — rough (60) first, then medium (120), then smooth (240) */
export function sandGame(ctx) {
  return new Promise(res => {
    const GRITS = [60, 120, 240], order = [[120, 60, 240], [240, 120, 60], [60, 240, 120]][Math.floor(ctx.time * 7) % 3];
    const p = ctx.ui.panel(TITLE('✋', 'Rough first, smooth last!') + '<div class="wt-sheets" style="display:flex;gap:min(16px,2vw);justify-content:center;margin:4px 0 10px">' + order.map(gr => '<button class="btn wt-grit" data-grit="' + gr + '" style="padding:8px 8px 6px;border-radius:18px;background:#fff;box-shadow:0 4px 0 rgba(74,44,23,.3);border:4px solid transparent;touch-action:none"><canvas width="104" height="104" style="display:block;width:min(104px,20vw);height:min(104px,20vw);border-radius:10px"></canvas><div style="font-weight:700;font-size:20px;margin-top:4px;color:#4a2c17">' + gr + '</div></button>').join('') + '</div><canvas class="wt-board" width="460" height="110" style="width:460px;max-width:80vw;display:block;margin:0 auto"></canvas><div class="wt-hint" style="font-size:22px;font-weight:700;min-height:30px;margin-top:4px;color:#4a2c17">&nbsp;</div>');
    const btns = [...p.el.querySelectorAll('.wt-grit')], board = p.el.querySelector('.wt-board'), bg = board.getContext('2d'), hint = p.el.querySelector('.wt-hint'); p.el.addEventListener('contextmenu', (e) => e.preventDefault()); // (a long press on a phone must not open a menu)
    // each sheet: sand-coloured paper with grains — big and few on the rough sheet, tiny and many on the smooth one
    btns.forEach(b => { const gr = +b.dataset.grit, c = b.querySelector('canvas'), g = c.getContext('2d'), n = gr === 60 ? 38 : gr === 120 ? 120 : 420, r = gr === 60 ? 5.5 : gr === 120 ? 3 : 1.4; let s = gr * 7;
      const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      g.fillStyle = gr === 60 ? '#c9a26b' : gr === 120 ? '#d9b77e' : '#e8d3a2'; g.fillRect(0, 0, 104, 104);
      for (let i = 0; i < n; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(80,50,20,.7)' : 'rgba(120,80,40,.5)'; g.beginPath(); g.arc(4 + rnd() * 96, 4 + rnd() * 96, r * (0.7 + rnd() * 0.6), 0, 7); g.fill(); } });
    let next = 0, sel = 0, anim = 0, animT = 0, over = false, stage = 0;
    const drawBoard = () => {
      const W = 460, H = 110; bg.clearRect(0, 0, W, H);
      // the table top seen from the side: its top edge is bumpy and gets flatter with every sheet
      const amp = [12, 6, 2.5, 0][stage], ampPrev = stage ? [12, 6, 2.5, 0][stage - 1] : 12, a = anim ? ampPrev + (amp - ampPrev) * anim : amp;
      bg.fillStyle = stage >= 3 ? '#f8e6ba' : '#f2dba6'; bg.beginPath(); bg.moveTo(30, 100); bg.lineTo(30, 50);
      for (let x = 30; x <= 430; x += 10) bg.lineTo(x, 50 - Math.abs(Math.sin(x * 0.37) * a) - (x % 30 === 0 ? a * 0.4 : 0)); bg.lineTo(430, 100); bg.closePath(); bg.fill();
      bg.strokeStyle = 'rgba(90,50,15,.25)'; bg.lineWidth = 1.5; for (const y of [64, 76, 90]) { bg.beginPath(); bg.moveTo(40, y); bg.lineTo(420, y + Math.sin(y) * 3); bg.stroke(); }
      if (anim) { // the sanding block slides across, leaving dust
        const x = 60 + anim * 340; bg.fillStyle = '#555'; bg.beginPath(); bg.roundRect(x - 34, 14, 68, 30, 6); bg.fill(); bg.fillStyle = '#d9b77e'; bg.fillRect(x - 34, 40, 68, 8);
        bg.fillStyle = 'rgba(255,240,210,.9)'; for (let i = 0; i < 8; i++) { bg.beginPath(); bg.arc(x - 40 - i * 9, 34 + Math.sin(i * 2 + anim * 20) * 10, 3, 0, 7); bg.fill(); } }
      if (stage >= 3 && !anim) { bg.font = '28px ' + EMOJI; bg.textAlign = 'center'; bg.textBaseline = 'middle'; bg.fillText('✨', 60, 30); bg.fillText('✨', 400, 28); bg.fillText('✨', 240, 22); }
      p.el.dataset.sel = sel; p.el.dataset.next = GRITS[next] || 0;
    };
    const mark = () => btns.forEach((b, i) => { b.style.borderColor = i === sel && !over ? '#ffc93c' : 'transparent'; });
    const remaining = () => btns.map((b, i) => i).filter(i => !btns[i].disabled);
    const pick = (i) => {
      if (over || anim || btns[i].disabled) return; const gr = +btns[i].dataset.grit;
      if (gr !== GRITS[next]) { ctx.audio.play('error'); hint.textContent = 'Rougher first!'; btns[i].animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 260 }); return; }
      next++; stage = next; anim = 0.001; animT = 0; btns[i].disabled = true; btns[i].style.opacity = 0.45; btns[i].querySelector('div').innerHTML = '<span class="em">✅</span>';
      ctx.audio.play('saw'); hint.textContent = next === 1 ? 'Rough…' : next === 2 ? 'Medium…' : 'Smooth!';
      const rem = remaining(); sel = rem.length ? rem[0] : sel; mark();
    };
    const key = (e) => { if (ctx.disposed) { window.removeEventListener('keydown', key); return; } if (e.repeat) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; const rem = remaining(); if (!rem.length) return;
      if (k === 'ArrowLeft' || k === 'a' || k === 'ArrowRight' || k === 'd') { e.preventDefault(); const j = rem.indexOf(sel), step = (k === 'ArrowLeft' || k === 'a') ? -1 : 1; sel = rem[(j + step + rem.length) % rem.length]; mark(); ctx.audio.play('click'); }
      else if (KEYUSE(e)) { e.preventDefault(); pick(sel); } };
    btns.forEach((b, i) => { b.addEventListener('pointerdown', (e) => { e.preventDefault(); sel = i; mark(); pick(i); }); b.addEventListener('click', (e) => e.preventDefault()); });
    window.addEventListener('keydown', key);
    const stop = ctx.onUpdate((dt) => {
      if (anim) { animT += dt; anim = Math.min(1, animT / 0.8); if (anim >= 1) { anim = 0; if (next >= 3 && !over) { over = true; mark(); ctx.audio.play('success'); hint.innerHTML = '<span class="em">✨</span> Smooth!'; ctx.after(1.3, () => { stop(); window.removeEventListener('keydown', key); p.close(); res(); }); } } }
      drawBoard();
    });
    mark(); drawBoard();
  });
}
