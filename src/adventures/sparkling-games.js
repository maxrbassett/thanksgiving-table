// Three small panel games for the Sparkling Grape Juice adventure (DOM inside ctx.ui.panel, animated on game time only).
//  sortGame — at the juice plant: grapes go in to the crusher, leaves and stems go out (left/right choice).
//  payGame  — at the store: count out the right number of dollar bills for the cashier.
//  pourGame — at home: hold to pour a glass of sparkling juice, let go at the line before the fizz spills over.
import { clamp } from '../core/kit.js';

const USE = (e) => e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter';
const LEFT = (e) => e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A';
const RIGHT = (e) => e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D';
const BAR = '<div style="height:22px;border-radius:11px;background:#e6dcc8;overflow:hidden;margin:12px auto 0;max-width:360px"><div data-bar style="height:100%;width:0%;background:#6cc04a;transition:width .15s"></div></div>';
const q = (el, s) => el.querySelector('[data-' + s + ']');
// phones: a long press on a hold-button must not open the browser's own menu; and a narrow (upright phone) screen gets a tighter layout
const noMenu = (el) => el.addEventListener('contextmenu', (e) => e.preventDefault());
const narrow = () => window.innerWidth < 480;
// a small key badge for keyboard players (hidden on touch screens, where the buttons are tapped)
const key = (k) => document.body.classList.contains('touch') ? '' : '<span style="display:inline-block;background:#4a2c17;color:#fff8e8;border-radius:7px;padding:0 8px;font-size:14px;margin-left:8px;vertical-align:middle">' + k + '</span>';

/** Grapes in, leaves out. Eight things roll up on the belt one by one; the player sends each the right way.
 *  opts.onIn / opts.onOut are called for every correct choice (to animate the 3D scene). Resolves when all eight are sorted. */
export const sortGame = (ctx, opts = {}) => new Promise((res) => {
  const ITEMS = ['🍇', '🍂', '🍇', '🌿', '🍇', '🍃', '🍇', '🍇'];
  const p = ctx.ui.panel('<div data-game="sort" style="width:min(600px,calc(94vw - 46px))">' +
    '<div style="font-size:24px;font-weight:700;margin-bottom:10px">Grapes in, leaves out!</div>' +
    '<div data-belt style="position:relative;height:130px;border-radius:18px;background:#4d535c;border:5px solid #2f343b;overflow:hidden">' +
    '<div data-stripes style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 34px,rgba(255,255,255,.12) 34px 40px)"></div>' +
    '<div style="position:absolute;left:10px;top:8px;font-size:15px;font-weight:700;color:#fff;opacity:.85;text-align:left">🍂 OUT<br>⬅</div>' +
    '<div style="position:absolute;right:10px;top:8px;font-size:15px;font-weight:700;color:#fff;opacity:.85;text-align:right">IN 🍇<br>➡</div>' +
    '<div data-item class="em" style="position:absolute;left:50%;top:50%;width:90px;margin:-45px 0 0 -45px;font-size:72px;line-height:90px;text-align:center;will-change:transform"></div></div>' +
    '<div style="display:flex;justify-content:space-between;gap:16px;margin-top:16px"><button class="btn big" data-out style="touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;min-width:0;flex:1;padding-left:6px;padding-right:6px;white-space:nowrap">' + key('←') + ' <span class="em">🍂</span> Out</button>' +
    '<button class="btn big" data-in style="touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;min-width:0;flex:1;padding-left:6px;padding-right:6px;white-space:nowrap"><span class="em">🍇</span> In ' + key('→') + '</button></div>' +
    '<div data-msg style="height:32px;line-height:32px;font-size:21px;font-weight:600;margin-top:10px">Which way?</div>' + BAR + '</div>');
  noMenu(p.el); const el = p.el, item = q(el, 'item'), msg = q(el, 'msg'), bar = q(el, 'bar'), stripes = q(el, 'stripes'), W = () => q(el, 'belt').clientWidth || 560;
  let k = 0, state = 'in', x = -1, t = 0, dir = 0, wob = 0, sorted = 0, over = false, bx = 0;
  const isGrape = () => ITEMS[k] === '🍇';
  const show = () => { item.textContent = ITEMS[k]; state = 'in'; x = -W() / 2 - 60; t = 0; msg.textContent = 'Which way?'; };
  const choose = (toIn) => {
    if (over || state !== 'wait') return;
    if (toIn === isGrape()) { state = 'fly'; dir = toIn ? 1 : -1; t = 0; sorted++; bar.style.width = sorted / ITEMS.length * 100 + '%'; msg.textContent = toIn ? 'Into the crusher! ✅' : 'Out it goes! ✅'; ctx.audio.play(toIn ? 'ding' : 'whoosh'); (toIn ? opts.onIn : opts.onOut) && (toIn ? opts.onIn : opts.onOut)(); }
    else { wob = 0.6; msg.textContent = isGrape() ? 'Grapes go in! 🍇' : 'Leaves go out! 🍂'; ctx.audio.play('error'); }
  };
  const kd = (e) => { if (ctx.disposed) return clean(); if (e.repeat) return; if (LEFT(e)) { choose(false); e.preventDefault(); } else if (RIGHT(e)) { choose(true); e.preventDefault(); } };
  const pd = (v) => (e) => { e.preventDefault(); choose(v); };
  const onOut = pd(false), onIn = pd(true);
  q(el, 'out').addEventListener('pointerdown', onOut); q(el, 'in').addEventListener('pointerdown', onIn); window.addEventListener('keydown', kd);
  const clean = () => { window.removeEventListener('keydown', kd); };
  show();
  const stop = ctx.onUpdate((dt) => {
    if (over) return; t += dt; bx += dt * 60; stripes.style.backgroundPosition = bx.toFixed(0) + 'px 0';
    if (state === 'in') { x = Math.min(0, x + dt * 520); if (x >= 0) { x = 0; state = 'wait'; } }
    else if (state === 'fly') { x += dir * dt * 640; if (Math.abs(x) > W() / 2 + 70) { if (++k >= ITEMS.length) { over = true; stop(); clean(); ctx.audio.play('success'); ctx.after(0.35, () => { p.close(); res(); }); return; } show(); } }
    let rot = 0; if (wob > 0) { wob -= dt; rot = Math.sin(wob * 40) * 14; }
    item.style.transform = 'translate(' + x.toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg)';
  });
});

/** Pour a glass: hold to pour, let go at the line. Too long and the fizz spills over (wipe, try again — never stuck).
 *  opts.onLevel(fraction 0..1) follows the juice while pouring (to fill the real glass behind the panel). Resolves on a good pour. */
export const pourGame = (ctx, opts = {}) => new Promise((res) => {
  const LO = 58, HI = 78, LINE = 68;
  const p = ctx.ui.panel('<div data-game="pour" style="display:flex;gap:30px;align-items:center;padding:6px 16px">' +
    '<div style="position:relative;width:150px;height:270px">' +
    '<div style="position:absolute;left:12px;right:12px;top:10px;bottom:0;border:6px solid #9fb7c4;border-top:0;border-radius:0 0 34px 34px;background:rgba(225,242,255,.55);overflow:hidden">' +
    '<div data-j style="position:absolute;left:0;right:0;bottom:0;height:0%;background:#7a3a9a"></div>' +
    '<div data-fm style="position:absolute;left:0;right:0;bottom:0;height:0%;background:#f4e8ff;border-radius:6px 6px 0 0"></div>' +
    '<div style="position:absolute;left:0;right:0;bottom:' + LO + '%;height:' + (HI - LO) + '%;background:rgba(108,192,74,.35)"></div>' +
    '<div style="position:absolute;left:0;right:0;bottom:' + LINE + '%;height:0;border-top:4px dashed #2f8f3a"></div></div>' +
    '<div style="position:absolute;left:0;right:0;top:4px;height:6px;border-radius:3px;background:#9fb7c4"></div>' +
    '<div data-drop style="position:absolute;left:50%;top:-14px;width:10px;height:34px;margin-left:-5px;border-radius:0 0 5px 5px;background:#7a3a9a;opacity:0"></div></div>' +
    '<div style="width:240px"><div data-f class="em" style="font-size:74px;line-height:90px">🍾</div>' +
    '<div style="font-size:22px;font-weight:700">Stop at the line!</div>' +
    '<div data-msg style="height:30px;line-height:30px;font-size:19px;font-weight:600;margin:4px 0 12px;color:#6a4a2a">Hold to pour</div>' +
    '<button class="btn big" data-h style="touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;min-width:0"><span class="em">🍾</span> Hold' + key('E') + '</button></div></div>');
  const el = p.el, J = q(el, 'j'), FM = q(el, 'fm'), F = q(el, 'f'), M = q(el, 'msg'), drop = q(el, 'drop'), btn = q(el, 'h');
  let held = false, was = false, juice = 0, foam = 0, over = false, spill = 0, sfx = 0, lockT = 0;
  let pid = null; noMenu(el);   // the finger (or mouse) that went down on the button is the one that must lift: a second finger elsewhere does not stop the pour
  const down = (e) => { held = true; pid = e.pointerId; e.preventDefault(); }, up = (e) => { if (e && pid !== null && e.pointerId !== undefined && e.pointerId !== pid) return; held = false; };
  const kd = (e) => { if (ctx.disposed) return clean(); if (USE(e)) { held = true; e.preventDefault(); } }, ku = (e) => { if (USE(e)) held = false; };
  const clean = () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  btn.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const paint = () => { J.style.height = juice + '%'; FM.style.bottom = juice + '%'; FM.style.height = foam + '%'; opts.onLevel && opts.onLevel(clamp(juice / LINE, 0, 1.1)); };
  const finish = () => { over = true; stop(); clean(); F.textContent = '🥂'; M.textContent = 'Perfect! 🥂'; ctx.audio.play('ding'); ctx.after(0.7, () => { p.close(); res(); }); };
  const stop = ctx.onUpdate((dt) => {
    if (over) return;
    if (lockT > 0) { lockT -= dt; if (spill > 0) { juice = Math.max(0, juice - dt * 150); foam = Math.max(0, foam - dt * 60); paint(); } if (lockT <= 0) { spill = 0; F.textContent = '🍾'; M.textContent = 'Try again!'; drop.style.opacity = 0; } was = held; return; }
    const pouring = held && juice < 100;
    if (pouring) { juice = Math.min(100, juice + dt * 28); foam = Math.min(24, foam + dt * 16); if ((sfx -= dt) <= 0) { sfx = 0.35; ctx.audio.play('pour'); } drop.style.opacity = 1; }
    else { foam = juice > 0 ? Math.max(4, foam - dt * 6) : 0; drop.style.opacity = 0; }
    if (juice + foam >= 100) { spill = 1; lockT = 1.1; F.textContent = '💦'; M.textContent = 'Whoa, fizzy! 😄'; ctx.audio.play('splash'); ctx.audio.play('fizz'); paint(); was = held; return; }
    if (was && !held) {   // let go: where is the juice?
      if (juice >= LO && juice <= HI) { paint(); finish(); return; }
      if (juice < LO) { M.textContent = 'A bit more! ⬆️'; ctx.audio.play('bubble'); }
      else { spill = 1; lockT = 1.0; F.textContent = '😅'; M.textContent = 'Too full! Oops'; ctx.audio.play('boing'); }
    }
    F.textContent = pouring ? '🍾' : juice >= LO && juice <= HI ? '😊' : '🍾';
    paint(); was = held;
  });
});

/** Pay the cashier: count out the right number of bills (give / take back), then pay. Wrong totals only get a hint. */
export const payGame = (ctx, opts = {}) => new Promise((res) => {
  const PRICE = opts.price || 4, WALLET = PRICE + 2;
  const NW = narrow();   // upright phone: smaller bills (two tidy rows), the price tag in the bottom corner, slimmer buttons — so nothing covers anything or pokes out
  const SLIM = NW ? ';padding-left:4px;padding-right:4px;white-space:nowrap;font-size:19px' : '';
  const bills = (n, big) => { let s = ''; for (let i = 0; i < n; i++) s += '<span class="em" style="display:inline-block;font-size:' + (NW ? (big ? 32 : 30) : big ? 44 : 40) + 'px;line-height:1.1;margin:0 ' + (NW ? -4 : -6) + 'px;transform:rotate(' + ((i % 2) * 10 - 5) + 'deg)">💵</span>'; return s || '<span style="opacity:.35;font-size:20px">—</span>'; };
  const p = ctx.ui.panel('<div data-game="pay" data-price="' + PRICE + '" style="width:min(600px,calc(94vw - 46px))">' +
    '<div style="font-size:24px;font-weight:700;margin-bottom:10px">Count out ' + PRICE + ' dollars!</div>' +
    '<div style="display:flex;gap:14px;align-items:stretch">' +
    '<div style="flex:1;background:#fff;border-radius:18px;padding:10px;box-shadow:0 3px 0 rgba(74,44,23,.2)"><div style="font-size:' + (NW ? 13 : 15) + 'px;font-weight:700;opacity:.7">MY WALLET 👛</div><div data-wallet style="min-height:' + (NW ? 80 : 56) + 'px;padding:6px 0"></div></div>' +
    '<div style="flex:1.2;background:#e8f4ff;border-radius:18px;padding:10px;box-shadow:0 3px 0 rgba(74,44,23,.2);position:relative"><div style="font-size:' + (NW ? 13 : 15) + 'px;font-weight:700;opacity:.7">ON THE COUNTER</div><div data-counter style="min-height:' + (NW ? 80 : 56) + 'px;padding:6px 0"></div>' +
    '<div style="position:absolute;' + (NW ? 'right:7px;bottom:8px;padding:1px 7px;font-size:17px' : 'right:10px;top:8px;padding:2px 10px;font-size:22px') + ';background:#ffc93c;border-radius:10px;font-weight:700;box-shadow:0 2px 0 #c98f1a">🏷️ $' + PRICE + '</div>' +
    '<div data-n style="font-size:30px;font-weight:700;line-height:1">0</div></div></div>' +
    '<div style="display:flex;gap:' + (NW ? 8 : 12) + 'px;margin-top:16px"><button class="btn big" data-back style="touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;min-width:0;flex:1;font-size:20px' + SLIM + '">' + key('←') + ' Back</button>' +
    '<button class="btn big" data-give style="touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;min-width:0;flex:1.4' + SLIM + '"><span class="em">💵</span> Give' + key('→') + '</button>' +
    '<button class="btn big" data-pay style="touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;min-width:0;flex:1' + SLIM + ';background:#8fdc7a;box-shadow:0 4px 0 #4f9d4a,0 8px 20px rgba(0,0,0,.2)">✅ Pay' + key('E') + '</button></div>' +
    '<div data-msg style="height:32px;line-height:32px;font-size:21px;font-weight:600;margin-top:10px">How many bills?</div></div>');
  noMenu(p.el); const el = p.el, wallet = q(el, 'wallet'), counter = q(el, 'counter'), N = q(el, 'n'), msg = q(el, 'msg');
  let n = 0, over = false, lockT = 0;
  const paint = () => { wallet.innerHTML = bills(WALLET - n); counter.innerHTML = bills(n, true); N.textContent = n; };
  const give = () => { if (over || lockT > 0 || n >= WALLET) return; n++; ctx.audio.play('pop'); msg.textContent = n === 1 ? 'One…' : n + '…'; paint(); };
  const back = () => { if (over || lockT > 0 || n <= 0) return; n--; ctx.audio.play('drop'); msg.textContent = n ? n + '…' : 'How many bills?'; paint(); };
  const pay = () => { if (over || lockT > 0) return;
    if (n === PRICE) { over = true; clean(); stop(); ctx.audio.play('register'); msg.textContent = 'Exactly right! ✅'; ctx.after(0.9, () => { p.close(); res(); }); return; }
    lockT = 0.9; ctx.audio.play('error'); msg.textContent = n < PRICE ? 'That is ' + n + ' — need ' + PRICE + '!' : 'Too many! Take some back'; };
  const kd = (e) => { if (ctx.disposed) return clean(); if (e.repeat) return; if (RIGHT(e)) { give(); e.preventDefault(); } else if (LEFT(e)) { back(); e.preventDefault(); } else if (USE(e)) { pay(); e.preventDefault(); } };
  const pd = (fn) => (e) => { e.preventDefault(); fn(); };
  q(el, 'give').addEventListener('pointerdown', pd(give)); q(el, 'back').addEventListener('pointerdown', pd(back)); q(el, 'pay').addEventListener('pointerdown', pd(pay)); window.addEventListener('keydown', kd);
  const clean = () => { window.removeEventListener('keydown', kd); };
  paint();
  const stop = ctx.onUpdate((dt) => { if (lockT > 0) lockT -= dt; });
});
