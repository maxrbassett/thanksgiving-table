// Mini-games for "The Turkey" — small 2D puzzles in a ctx.ui.panel, each tied to the real step it sits in.
// All of them run on game time (ctx.onUpdate / ctx.wait), end in success, and work with buttons (touch) or the keys the game already uses.
import { seeded } from '../core/kit.js';

const F = 'font-family:Fredoka,sans-serif;color:#4a2c17;';
const EMO = 'font-family:"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif;';
// Phones: the pop-ups re-arrange themselves on a narrow (upright phone) or short (phone on its side) screen; the rules live in a <style> inside the pop-up, so they go away with it.
const NARROW = '@media (max-width:480px)', SHORT = '@media (max-height:480px)';
const TOUCH = '-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;'; // a long press must not select text or pop up a menu
const btnS = (bg, shadow, extra = '') => TOUCH + 'font-size:40px;width:92px;height:92px;border-radius:50%;border:0;background:' + bg + ';box-shadow:0 5px 0 ' + shadow + ';cursor:pointer;transition:transform .12s;' + EMO + extra;
const useHeld = (ctx) => { const k = ctx.game && ctx.game.keys; return !!k && (k.has('e') || k.has(' ') || k.has('Enter')); };

/**
 * Mix the feed (feed mill): the nutritionist's recipe shows a few scoops; remember it, then tap the scoops into the mixer
 * in the same order. Two small batches. A wrong tap just buzzes and shows the recipe again — it always ends in success.
 * Real life: turkey feed is mostly ground corn and soybean meal, with vitamins and minerals, mixed to a planned recipe.
 */
export function feedMixGame(ctx) {
  return new Promise((done) => {
    const rnd = seeded(33), ING = [['🌽', 'corn'], ['🌱', 'soy'], ['💊', 'vitamins'], ['🍭', 'candy']];
    const p = ctx.ui.panel('<style>' + NARROW + '{#panel .box{padding:16px 10px!important}.fmRow{flex-direction:column!important;gap:10px!important}.fmBtns{gap:10px!important}.fmBtns button{width:74px!important;height:74px!important;font-size:34px!important}#fmCard{gap:6px!important;padding:8px 10px!important}}' + SHORT + '{#panel .box{padding:12px 22px!important}#fmCard{margin:4px 0 6px!important;min-height:52px!important;padding:6px 16px!important}}</style>' +
      '<div style="' + F + 'font-size:26px;font-weight:800;margin-bottom:4px">🌽 Mix the feed</div>' +
      '<div id="fmMsg" style="' + F + 'font-size:20px;font-weight:700;height:28px">Remember the recipe!</div>' +
      '<div id="fmCard" style="display:inline-flex;gap:10px;padding:10px 16px;margin:6px 0 10px;border-radius:18px;background:#fff;border:3px dashed #d9a066;min-height:64px;align-items:center;transition:transform .15s">' +
      '<span style="' + F + 'font-size:18px;font-weight:700;margin-right:4px">Recipe:</span></div>' +
      '<div class="fmRow" style="display:flex;align-items:center;justify-content:center;gap:26px">' +
      '<div style="position:relative;width:150px;height:130px;flex:none">' +
      '<div style="position:absolute;left:15px;right:15px;top:0;height:24px;background:#4f7d5a;border-radius:6px 6px 0 0"></div>' +
      '<div style="position:absolute;left:0;right:0;top:22px;bottom:0;border-radius:0 0 40px 40px;background:#e9dcc0;overflow:hidden;box-shadow:inset 0 3px 8px rgba(0,0,0,.25)">' +
      '<div id="fmFill" style="position:absolute;left:0;right:0;bottom:0;height:0%;background:#e9c46a;transition:height .35s"></div></div>' +
      '<div id="fmFly" style="position:absolute;left:55px;top:-40px;font-size:40px;' + EMO + 'opacity:0;pointer-events:none"></div>' +
      '<div id="fmBatch" style="position:absolute;left:0;right:0;top:50px;' + F + 'font-size:17px;font-weight:700;opacity:.8">Batch 1 of 2</div></div>' +
      '<div class="fmBtns" style="display:flex;gap:16px">' + ING.map(([e, n], i) => '<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><button data-fm="' + i + '" style="' + btnS('#ffe9b8', '#d9a066') + '">' + e + '</button><span style="' + F + 'font-size:15px;font-weight:700">' + n + '</span></div>').join('') + '</div></div>');
    const $ = (id) => p.el.querySelector('#' + id), card = $('fmCard'), msg = $('fmMsg'), fill = $('fmFill'), fly = $('fmFly'), batch = $('fmBatch');
    let recipe = [], at = 0, round = 0, phase = 'show', peek = 0, busy = false, slots = [];
    const show = (on) => { slots.forEach((s, i) => { s.textContent = on || i < at ? recipe[i] : '❓'; s.style.opacity = i < at ? '.45' : '1'; s.style.outline = on && i === at && phase === 'tap' ? '4px solid #ffb84a' : 'none'; }); };
    const setRecipe = (n) => { recipe = []; for (let i = 0; i < n; i++) recipe.push(ING[Math.floor(rnd() * 3)][0]); at = 0; card.querySelectorAll('span.fs').forEach(s => s.remove());
      slots = recipe.map(() => { const s = document.createElement('span'); s.className = 'fs'; s.style.cssText = 'font-size:40px;width:48px;text-align:center;border-radius:10px;' + EMO; card.appendChild(s); return s; });
      p.el.dataset.recipe = recipe.join(','); p.el.dataset.at = '0'; phase = 'show'; p.el.dataset.phase = phase; msg.textContent = 'Remember the recipe!'; show(true); fill.style.height = '0%'; batch.textContent = 'Batch ' + (round + 1) + ' of 2';
      ctx.after(n === 3 ? 3.0 : 3.4, () => { if (phase === 'show') { phase = 'tap'; p.el.dataset.phase = phase; msg.textContent = 'Tap them in order!'; show(false); ctx.audio.play('click'); } }); };
    setRecipe(3);
    const stop = ctx.onUpdate((dt) => { if (peek > 0) { peek -= dt; if (peek <= 0) show(false); } });
    p.el.querySelectorAll('button[data-fm]').forEach((b) => { b.onclick = () => {
      if (phase !== 'tap' || busy) { if (phase === 'show') { b.style.transform = 'scale(.9)'; ctx.after(0.12, () => { b.style.transform = ''; }); } return; }
      const e = b.textContent;
      if (e === recipe[at]) {
        busy = true; at++; p.el.dataset.at = String(at); ctx.audio.play('pour'); fly.textContent = e; fly.style.transition = 'none'; fly.style.opacity = '1'; fly.style.transform = 'translateY(0)';
        ctx.after(0.02, () => { fly.style.transition = 'transform .4s ease-in,opacity .4s'; fly.style.transform = 'translateY(70px)'; fly.style.opacity = '0'; });
        fill.style.height = Math.round(at / recipe.length * 100) + '%'; show(false);
        ctx.after(0.45, () => { busy = false; if (at >= recipe.length) {
          ctx.audio.play('ding'); round++;
          if (round < 2) { msg.textContent = 'Batch done! One more…'; busy = true; ctx.after(1.2, () => { busy = false; setRecipe(4); }); }
          else { phase = 'done'; p.el.dataset.phase = phase; msg.textContent = 'Feed is ready! 🌽'; ctx.audio.play('success'); stop(); ctx.after(0.9, () => { p.close(); done(); }); } } });
      } else {
        ctx.audio.play('error'); msg.textContent = e === '🍭' ? 'Not turkey food! 🙈' : 'Oops — look again!'; card.style.transform = 'rotate(-3deg)'; ctx.after(0.12, () => { card.style.transform = 'rotate(3deg)'; }); ctx.after(0.24, () => { card.style.transform = ''; });
        peek = 1.6; show(true); ctx.after(1.7, () => { if (phase === 'tap') msg.textContent = 'Tap them in order!'; });
      }
    }; });
  });
}

/**
 * Is it done? (home kitchen): hold the button (or E / Space) and the meat thermometer climbs; let go right at 165 °F —
 * the temperature at which turkey is safely cooked. Too early or too late just says "try again", and the green
 * target band grows a little with every miss, so it always ends in success.
 */
export function thermometerGame(ctx) {
  return new Promise((done) => {
    const LO = 100, HI = 212, T = 165; let band = 5, temp = LO, held = false, miss = 0, phase = 'play', resetT = 0;
    const ticks = [120, 140, 165, 180, 200];
    const p = ctx.ui.panel('<style>' + NARROW + '{#panel .box{padding:16px 10px!important}.thRow{flex-wrap:wrap!important;gap:12px 26px!important}.thCtl{flex-direction:row!important;width:100%;justify-content:center;gap:22px!important}.thHint{display:none}}' + SHORT + '{#panel .box{padding:12px 22px!important}}</style>' +
      '<div style="' + F + 'font-size:26px;font-weight:800;margin-bottom:2px">🌡️ Is it done?</div>' +
      '<div id="thMsg" style="' + F + 'font-size:20px;font-weight:700;height:28px">Hold. Let go at 165°!</div>' +
      '<div class="thRow" style="display:flex;align-items:center;justify-content:center;gap:34px;margin-top:6px">' +
      '<div id="thBird" style="font-size:110px;line-height:1;' + EMO + '">🦃</div>' +
      '<div style="display:flex;align-items:center;gap:10px"><div style="position:relative;width:54px;height:250px">' +
      '<div style="position:absolute;left:13px;top:0;width:28px;height:222px;border-radius:14px 14px 0 0;background:#f3ece0;box-shadow:inset 0 2px 6px rgba(0,0,0,.2);overflow:hidden">' +
      '<div id="thBand" style="position:absolute;left:0;right:0;background:#9fe3a8"></div>' +
      '<div id="thCol" style="position:absolute;left:8px;right:8px;bottom:0;height:0%;background:#e8412f;border-radius:6px 6px 0 0"></div></div>' +
      '<div style="position:absolute;left:0;top:196px;width:54px;height:54px;border-radius:50%;background:#e8412f;box-shadow:inset 0 -3px 6px rgba(0,0,0,.2)"></div></div>' +
      '<div style="position:relative;width:56px;height:222px">' + ticks.map(v => '<div style="position:absolute;left:0;top:' + ((1 - (v - LO) / (HI - LO)) * 222 - 9) + 'px;' + F + 'font-size:15px;font-weight:' + (v === T ? '800' : '600') + ';color:' + (v === T ? '#2f8f3a' : '#8a6a4a') + '">' + (v === T ? '▶ ' : '– ') + v + '°</div>').join('') + '</div></div>' +
      '<div class="thCtl" style="display:flex;flex-direction:column;align-items:center;gap:14px"><div id="thRead" style="' + F + 'font-size:44px;font-weight:800;min-width:130px">100°F</div>' +
      '<button id="thBtn" style="' + btnS('#ffd0c4', '#d9766a', 'width:120px;height:120px;font-size:46px;touch-action:none;user-select:none;-webkit-user-select:none') + '">🌡️</button>' +
      '<div class="thHint" style="' + F + 'font-size:15px;font-weight:700;opacity:.75">' + (window.matchMedia && window.matchMedia('(pointer:coarse)').matches ? 'hold this' : 'hold this (or E)') + '</div></div></div>');
    const $ = (id) => p.el.querySelector('#' + id), col = $('thCol'), bandEl = $('thBand'), read = $('thRead'), msg = $('thMsg'), btn = $('thBtn'), bird = $('thBird'); p.el.dataset.phase = phase;
    const frac = (v) => (v - LO) / (HI - LO);
    const drawBand = () => { bandEl.style.bottom = (frac(T - band) * 100) + '%'; bandEl.style.height = (frac(T + band) - frac(T - band)) * 100 + '%'; };
    drawBand();
    let btnDown = false; const dn = (e) => { e.preventDefault(); btnDown = true; }, up = () => { btnDown = false; };
    btn.addEventListener('contextmenu', (e) => e.preventDefault()); btn.addEventListener('pointerdown', dn); btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
    const release = () => { // a reading is taken when the player lets go
      if (temp >= T - band && temp <= T + band) { phase = 'done'; p.el.dataset.phase = phase; msg.textContent = Math.round(temp) + '°F — safe and done! ✅'; bird.textContent = '🦃'; bird.style.transform = 'scale(1.12)'; ctx.audio.play('success'); btn.style.opacity = '.5'; ctx.after(1.3, () => { stop(); p.close(); done(); }); }
      else { miss++; band = Math.min(24, band + 3); drawBand(); ctx.audio.play('error'); msg.textContent = temp < T ? 'Not done yet — try again' : 'Too hot! Try again'; bird.textContent = temp < T ? '❄️' : '🔥'; phase = 'reset'; resetT = 0.9; p.el.dataset.phase = phase; }
    };
    const stop = ctx.onUpdate((dt) => {
      const down = btnDown || useHeld(ctx);
      if (phase === 'reset') { resetT -= dt; temp = Math.max(LO, temp - dt * 120); if (resetT <= 0 && temp <= LO + 0.5 && !down) { phase = 'play'; p.el.dataset.phase = phase; bird.textContent = '🦃'; msg.textContent = 'Hold. Let go at 165°!'; } }
      else if (phase === 'play') {
        if (down) { held = true; temp = Math.min(HI, temp + dt * 20); if (temp >= HI) { held = false; release(); } }
        else if (held) { held = false; release(); }
        else temp = Math.max(LO, temp - dt * 40);
      }
      col.style.height = (frac(temp) * 100) + '%'; read.textContent = Math.round(temp) + '°F'; read.style.color = temp >= T - band && temp <= T + band ? '#2f8f3a' : '#4a2c17';
      btn.style.transform = down && phase === 'play' ? 'scale(.92)' : ''; p.el.dataset.temp = temp.toFixed(1); p.el.dataset.band = String(band);
    });
  });
}

/**
 * Match the label (packing plant): the scale shows the turkey's weight; tap the label that says the same number.
 * A wrong tap only wiggles and points back at the scale. Real life: every packed turkey is weighed and gets a label
 * with its weight, so the store and the cook know what they have.
 */
export function labelMatchGame(ctx, weight = 14) {
  return new Promise((done) => {
    const rnd = seeded(weight * 7 + 1), opts = [weight, weight - 2, weight + 2].sort(() => rnd() - 0.5);
    const p = ctx.ui.panel('<style>' + NARROW + '{.lmRow{flex-direction:column!important;gap:16px!important}}' + SHORT + '{#panel .box{padding:12px 22px!important}}</style>' +
      '<div style="' + F + 'font-size:26px;font-weight:800;margin-bottom:2px">⚖️ Match the label</div>' +
      '<div id="lmMsg" style="' + F + 'font-size:20px;font-weight:700;height:28px">Which label matches?</div>' +
      '<div class="lmRow" style="display:flex;align-items:center;justify-content:center;gap:30px;margin-top:6px">' +
      '<div style="position:relative;width:200px;height:200px;flex:none;border-radius:50%;background:#fafafa;border:6px solid #3f7fd1;box-shadow:0 4px 0 rgba(0,0,0,.15)">' +
      [8, 10, 12, 14, 16, 18, 20].map((v, i) => { const a = -2.2 + i * 4.4 / 6; return '<div style="position:absolute;width:34px;text-align:center;left:' + (83 + Math.sin(a) * 74) + 'px;top:' + (88 - Math.cos(a) * 74) + 'px;' + F + 'font-size:19px;font-weight:800">' + v + '</div>'; }).join('') +
      '<div id="lmNeedle" style="position:absolute;left:97px;top:38px;width:6px;height:70px;background:#e8412f;border-radius:3px;transform-origin:50% 90%;transform:rotate(' + ((-2.2 + (weight - 8) / 12 * 4.4) * 57.3).toFixed(1) + 'deg)"></div>' +
      '<div style="position:absolute;left:88px;top:90px;width:24px;height:24px;border-radius:50%;background:#333"></div>' +
      '<div style="position:absolute;left:0;right:0;top:150px;' + F + 'font-size:16px;font-weight:700;opacity:.7">lb</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' + opts.map(v => '<button data-lm="' + v + '" style="' + TOUCH + F + 'font-size:28px;font-weight:800;border:0;border-radius:14px;padding:10px 22px;background:#fff3c4;border:3px solid #e8b63a;cursor:pointer;box-shadow:0 4px 0 #d9a066;transition:transform .12s">🏷️ ' + v + ' lb</button>').join('') + '</div></div>');
    const msg = p.el.querySelector('#lmMsg'); p.el.dataset.weight = String(weight); p.el.dataset.phase = 'play'; let over = false;
    p.el.querySelectorAll('button[data-lm]').forEach((b) => { b.onclick = () => { if (over) return;
      if (+b.dataset.lm === weight) { over = true; p.el.dataset.phase = 'done'; b.style.background = '#bfe8b0'; msg.textContent = weight + ' lb — it matches! ✅'; ctx.audio.play('success'); ctx.after(1.0, () => { p.close(); done(); }); }
      else { ctx.audio.play('error'); msg.textContent = 'Look at the scale! ⚖️'; b.style.transform = 'rotate(-4deg)'; ctx.after(0.12, () => { b.style.transform = 'rotate(4deg)'; }); ctx.after(0.24, () => { b.style.transform = ''; }); }
    }; });
  });
}
