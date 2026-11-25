// hud.js — all on-screen 2D interface (HTML on top of the 3D canvas, so text stays crisp).
import * as THREE from 'three';
import { audio } from './audio.js';
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
/** wrap emoji characters so they render with the colour-emoji font */
export const em = (s) => '<span class="em">' + s + '</span>';
const v = new THREE.Vector3();

export class Hud {
  constructor(game, root) {
    this.game = game; this.root = root;
    this.layer = h('div', 'tt-layer'); root.appendChild(this.layer);          // world-anchored things
    this.tl = h('div'); this.tl.id = 'hud-tl'; root.appendChild(this.tl);
    this.tc = h('div'); this.tc.id = 'hud-tc'; root.appendChild(this.tc);
    this.tr = h('div'); this.tr.id = 'hud-tr'; root.appendChild(this.tr);
    this.homeBtn = h('button', 'chip btn round em hidden', '🏠'); this.homeBtn.title = 'Back to the table'; this.homeBtn.onclick = () => { audio.play('click'); game.leaveAdventure(); }; this.tl.appendChild(this.homeBtn);
    this.titleChip = h('div', 'chip hidden'); this.tl.appendChild(this.titleChip);
    this.goalEl = h('div', 'chip hidden'); this.goalEl.id = 'goal'; this.tc.appendChild(this.goalEl);
    this.dots = h('div'); this.dots.id = 'dots'; this.tc.appendChild(this.dots);
    this.hearts = h('div', 'chip hidden'); this.hearts.id = 'hearts'; this.tr.appendChild(this.hearts);
    this.muteBtn = h('button', 'chip btn round em', audio.muted ? '🔇' : '🔊'); this.muteBtn.onclick = () => { audio.setMuted(!audio.muted); this.muteBtn.textContent = audio.muted ? '🔇' : '🔊'; }; this.tr.appendChild(this.muteBtn);
    if (game.quality.low) { // computers without a graphics card: let the player trade smoothness for a sharper picture
      this.hdBtn = h('button', 'chip btn round', 'HD'); this.hdBtn.style.fontSize = '15px'; this.hdBtn.title = 'Sharper picture (slower on this computer)'; const paint = () => { this.hdBtn.style.background = game.quality.hd ? '#ffc93c' : ''; this.hdBtn.style.opacity = game.quality.hd ? 1 : 0.75; }; paint();
      this.hdBtn.onclick = () => { const Q = game.quality; Q.hd = !Q.hd; Q.scale = Q.hd ? 1 : 0.5; try { localStorage.setItem('tt-hd', Q.hd ? '1' : '0'); } catch (e) {} game.resize(); paint(); audio.play('click'); }; this.tr.appendChild(this.hdBtn); }
    this.arrow = h('div', 'em', '<b></b><span></span>'); this.arrow.id = 'arrow'; root.appendChild(this.arrow);
    this.factEl = h('div'); this.factEl.id = 'fact'; root.appendChild(this.factEl);
    this.thanksEl = h('div'); this.thanksEl.id = 'thanks'; root.appendChild(this.thanksEl); this.thanksEl.onclick = () => this.thanksEl.classList.remove('show');
    this.bannerEl = h('div', 'chip'); this.bannerEl.id = 'banner'; root.appendChild(this.bannerEl);
    this.panelEl = h('div'); this.panelEl.id = 'panel'; root.appendChild(this.panelEl);
    this.joy = h('div', '', '<i></i>'); this.joy.id = 'joy'; root.appendChild(this.joy);
    this.irisEl = h('div'); this.irisEl.id = 'iris'; root.appendChild(this.irisEl);
    this.cardEl = h('div'); this.cardEl.id = 'card'; root.appendChild(this.cardEl);
    this.debugEl = h('div'); this.debugEl.id = 'debug'; root.appendChild(this.debugEl);
    this._timers = {};
  }
  _later(key, ms, fn) { clearTimeout(this._timers[key]); this._timers[key] = setTimeout(fn, this.game.fast ? Math.min(ms, 30) : ms); }

  enterWorld(world) {
    this.homeBtn.classList.toggle('hidden', !this.game.table);
    this.titleChip.classList.remove('hidden'); this.titleChip.innerHTML = em(world.def.emoji || '') + ' ' + esc(world.def.title || '');
    this.hearts.classList.remove('hidden'); this.hearts.innerHTML = em('💛') + ' 0';
    this.setGoal(null); this.setProgress(0, 0);
  }
  leaveWorld() {
    for (const e of [this.homeBtn, this.titleChip, this.hearts, this.goalEl]) e.classList.add('hidden'); this._factUntil = 0; this._thanksUntil = 0;
    this.dots.innerHTML = ''; this.arrow.style.display = 'none'; this.factEl.classList.remove('show'); this.thanksEl.classList.remove('show'); this.bannerEl.classList.remove('show'); this.closePanel();
    this.layer.querySelectorAll('.prompt,.bubble,.emote').forEach(e => e.remove());
  }
  setGoal(icon, text) {
    if (!icon) { this.goalEl.classList.add('hidden'); return; }
    this.goalEl.classList.remove('hidden'); this.goalEl.innerHTML = em(icon) + ' ' + esc(text || '');
    this.goalEl.classList.remove('pulse'); void this.goalEl.offsetWidth; this.goalEl.classList.add('pulse');
    this._goalIcon = icon;
  }
  setProgress(done, total) { let s = ''; for (let i = 0; i < total; i++) s += '<i class="' + (i < done ? 'on' : '') + '"></i>'; this.dots.innerHTML = s; }
  makePrompt(it, onClick, onHold) {
    const e = h('div', 'prompt' + (it.hold ? ' hold' : ''), '<div class="ring"><b></b></div>' + em(it.icon) + '<span>' + esc(it.label || '') + '</span><span class="key">' + (it.hold ? 'hold <i>E</i>' : '<i>E</i>') + '</span>');
    e.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); onHold(true); });
    e.addEventListener('pointerup', (ev) => { ev.stopPropagation(); onHold(false); if (!it.hold) onClick(); });
    e.addEventListener('pointerleave', () => onHold(false));
    e.style.display = 'none'; this.layer.appendChild(e); return e;
  }
  makeBubble(text) { const e = h('div', 'bubble', esc(text)); this.layer.appendChild(e); return e; }
  makeEmote(emoji, size) { const e = h('div', 'emote em', emoji); if (size) e.style.fontSize = size + 'px'; this.layer.appendChild(e); return e; }
  /** fact toasts queue: each stays at least ~3.5 s before the next replaces it */
  showFact(icon, text, sec = 7) {
    // long enough to read: at least 7.5 s, more for longer lines (12 words ≈ 10 s); the next toast waits until this one has had its full time
    const words = String(text).trim().split(/\s+/).length; sec = Math.max(sec, 7.5, 3.2 + words * 0.58);
    const now = performance.now(), wait = this.game.fast ? 0 : Math.max(0, (this._factUntil || 0) - now);
    this._factUntil = now + wait + sec * 1000 + 500; const w = this.game.world;
    const show = () => { if (this.game.world !== w) return; this.factEl.innerHTML = em(icon) + '<div><small>In real life</small>' + esc(text) + '</div>'; this.factEl.classList.add('show'); this._later('fact', sec * 1000, () => this.factEl.classList.remove('show')); };
    if (wait > 0) setTimeout(show, wait); else show();
  }
  showThanks(icon, people, title, total) {
    // cards queue up so that two thank-yous close together are both seen (each at least ~3 s)
    const now = performance.now(), wait = this.game.fast ? 0 : Math.max(0, (this._thanksUntil || 0) - now);
    this._thanksUntil = now + wait + 6000;
    if (wait > 0) { const w = this.game.world; setTimeout(() => { if (this.game.world === w) this._showThanksNow(icon, people, title, total); }, wait); return; }
    this._showThanksNow(icon, people, title, total);
  }
  _showThanksNow(icon, people, title, total) {
    this.thanksEl.innerHTML = '<h3>' + em(icon) + '<div>' + esc(title || 'Thank you!') + '</div></h3><div class="tags">' + people.map(p => '<span>' + esc(p) + '</span>').join('') + '</div>';
    this.thanksEl.classList.add('show'); this._later('thanks', 9500, () => this.thanksEl.classList.remove('show'));
    this.hearts.innerHTML = em('💛') + ' ' + total; this.hearts.classList.remove('bump'); void this.hearts.offsetWidth; this.hearts.classList.add('bump');
  }
  showBanner(icon, text, sec = 2) { this.bannerEl.innerHTML = em(icon) + ' ' + esc(text); this.bannerEl.classList.add('show'); this._later('banner', sec * 1000, () => this.bannerEl.classList.remove('show')); }
  /** full-screen title card (on top of the closed iris). resolves after sec. */
  showCard(emoji, title, n, sec = 1.4) {
    this.cardEl.innerHTML = (n ? '<div class="n">' + esc(n) + '</div>' : '') + '<div class="e em">' + emoji + '</div><div class="t">' + esc(title) + '</div>'; this.cardEl.style.display = 'flex';
    clearTimeout(this._cardT); return new Promise(res => { this._cardT = setTimeout(() => { this.cardEl.style.display = 'none'; res(); }, this.game.fast ? 20 : sec * 1000); });
  }
  /**
   * panel(html) — a centred pop-up box for a 2D mini-game or picture. Returns { el, close() }.
   * The player is locked while it is open. Build your own content inside el (buttons, canvas …).
   */
  panel(html) {
    this.closePanel(); const fitter = h('div', 'fit'); const box = h('div', 'box', html || ''); fitter.appendChild(box); this.panelEl.appendChild(fitter); this.panelEl.style.display = 'flex'; this.root.classList.add('panel-open');
    // a pop-up that is bigger than the screen (phones, small windows) is shrunk as a whole until it fits — never scrolled or cut off
    const fit = () => { const W = this.panelEl.clientWidth, H = this.panelEl.clientHeight, bw = Math.max(box.offsetWidth, box.scrollWidth), bh = Math.max(box.offsetHeight, box.scrollHeight); if (!bw || !bh) return; const s = Math.max(0.45, Math.min(1, (W - 10) / bw, (H - 10) / bh)); fitter.style.transform = s < 0.999 ? 'scale(' + s.toFixed(3) + ')' : ''; };
    // a tap that opened this pop-up is followed by the browser's own "click" at the same spot: ignore real clicks for a moment so it cannot press a button that has just appeared under the finger
    const born = performance.now(); box.addEventListener('click', (e) => { if (e.isTrusted && performance.now() - born < 400) { e.stopPropagation(); e.preventDefault(); } }, true);
    fit(); let ro = null; if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fit); ro.observe(box); ro.observe(this.panelEl); }
    this._panelOff = () => { if (ro) ro.disconnect(); };
    const w = this.game.world; if (w) w.lock(); let open = true;
    const p = { el: box, close: () => { if (!open) return; open = false; if (this.panelEl.firstChild === fitter) this.closePanel(); if (w && !w.disposed) w.unlock(); } };
    this._panel = p; return p;
  }
  closePanel() { if (this._panelOff) { this._panelOff(); this._panelOff = null; } this.panelEl.style.display = 'none'; this.panelEl.innerHTML = ''; this._panel = null; this.root.classList.remove('panel-open'); }
  get panelOpen() { return this.panelEl.style.display === 'flex'; }

  project(pos, camera, out) { v.copy(pos).project(camera); out.x = (v.x * 0.5 + 0.5) * this.game.width; out.y = (-v.y * 0.5 + 0.5) * this.game.height; out.behind = v.z > 1; return out; }
  /** keep a speech bubble on screen and clear of the goal chip, the top-right buttons, the thank-you card, the fact toast, the active walk-up bubble and the player */
  _placeBubble(d, s, W, H, tcR, trR, th, botLim, ap, pl, isPlayer) {
    const bh = d._h || (d._h = d.el.offsetHeight), bw = d._w || (d._w = d.el.offsetWidth / 2);
    s.x = Math.max(bw + 6, Math.min(W - bw - 6, s.x));
    const topAt = () => { const over = tcR && s.x + bw > tcR.left && s.x - bw < tcR.right, overR = trR && s.x + bw > trR.left - 4; return (over ? tcR.bottom + 14 : overR ? trR.bottom + 8 : 6) + bh; };
    let minY = topAt(), y = Math.max(minY, Math.min(botLim, s.y));
    if (th && y - bh < th.bottom && y > th.top && s.x + bw > th.left - 6) {
      if (th.left - 12 >= bw * 2) { s.x = th.left - 6 - bw; minY = topAt(); } else minY = Math.max(minY, th.bottom + 8 + bh);
      y = Math.max(minY, Math.min(botLim, s.y));
    }
    const jr = this._jR; if (jr && s.x + bw > jr.left - 6 && y > jr.top - 6 && y - bh < jr.bottom) { if (jr.left - 12 >= bw * 2) s.x = Math.min(s.x, jr.left - 6 - bw); else y = Math.max(minY, jr.top - 8); }
    if (ap && Math.abs(s.x - ap.x) < bw + ap.hw && y > ap.y - 32 && y - bh < ap.y + 26 && ap.y - 36 >= minY) y = ap.y - 36;
    if (!isPlayer && !pl.bad && Math.abs(s.x - pl.x) < bw + 22 && y > pl.top && y - bh < pl.feet && pl.top - 10 >= minY) y = pl.top - 10;
    s.y = y;
  }
  updateWorld(world, dt, active, holdFrac) {
    const cam = world.camera, s = this._s || (this._s = {}), W = this.game.width, H = this.game.height;
    let ap = null;
    for (const it of world._interacts) {
      const show = it._ok && it._d < (it.far ?? 28) && world._locks === 0;
      if (!show) { if (it._shown) { it.el.style.display = 'none'; it._shown = false; } continue; }
      world._pos(it.at, v); v.y += it.y; this.project(v, cam, s);
      if (s.behind) { it.el.style.display = 'none'; it._shown = false; continue; }
      if (!it._shown) { it.el.style.display = 'flex'; it._shown = true; }
      const on = it === active; if (on !== it._on) { it.el.classList.toggle('on', on); it._on = on; }
      if (on) { const hw = it.el.offsetWidth / 2 + 8; if (W > hw * 2) s.x = Math.max(hw, Math.min(W - hw, s.x)); s.y = Math.max(Math.min(150, H * 0.3), Math.min(H - 70, s.y)); ap = { x: s.x, y: s.y, hw: hw }; }
      it.el.style.transform = 'translate3d(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px,0)';
      if (it.hold) it.el.firstChild.firstChild.style.width = (on ? Math.min(1, holdFrac) * 100 : 0) + '%';
    }
    const pl = this._pl || (this._pl = {}); { const P = world.player; v.copy(P.position); v.y += 2.0 * P.scale.y; this.project(v, cam, pl); pl.top = pl.y; pl.bad = pl.behind; v.copy(P.position); this.project(v, cam, pl); pl.feet = pl.y; }
    this._tcN = (this._tcN || 0) + 1; if (this._tcN % 6 === 1) { const r = this.tc.getBoundingClientRect(); this._tcR = r.height > 4 ? r : null; this._trR = this.tr.getBoundingClientRect(); { const je = this.joy; this._jR = je.offsetWidth > 0 ? { left: je.offsetLeft, top: je.offsetTop, right: je.offsetLeft + je.offsetWidth, bottom: je.offsetTop + je.offsetHeight } : null; const te = this.thanksEl; this._thR = te.classList.contains('show') ? { left: te.offsetLeft, top: te.offsetTop, right: te.offsetLeft + te.offsetWidth, bottom: te.offsetTop + te.offsetHeight } : null; } } const tcR = this._tcR; const botLim = this.factEl.classList.contains('show') ? this.factEl.offsetTop - 10 : H - 16;
    for (let i = world._dom.length - 1; i >= 0; i--) {
      const d = world._dom[i]; d.t -= dt;
      if (d.t <= 0) { d.el.remove(); world._dom.splice(i, 1); if (d.restore && d.restore.userData.anim === 'talk') d.restore.userData.anim = 'idle'; if (d.look) d.look.userData.lookAt = null; continue; }
      world._pos(d.at, v); v.y += d.y; if (d.rise) { d.y += d.rise * dt; d.el.style.opacity = Math.min(1, d.t * 2.5); }
      this.project(v, cam, s); d.el.style.display = s.behind ? 'none' : ''; if (!d.rise) this._placeBubble(d, s, W, H, tcR, this._trR, this._thR, botLim, ap, pl, d.at === world.player); d.el.style.transform = 'translate3d(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px,0)';
    }
    // off-screen goal arrow
    const g = world._goal;
    if (g && g.target && world._locks === 0) {
      world._pos(g.target, v); v.y += 1.5; this.project(v, cam, s);
      const m = 60, off = s.behind || s.x < m || s.x > W - m || s.y < m + 40 || s.y > H - m;
      if (off) { let dx = s.x - W / 2, dy = s.y - H / 2; if (s.behind) { dx = -dx; dy = Math.abs(dy) + H; } const a = Math.atan2(dy, dx), k = Math.min((W / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (H / 2 - m - 20) / Math.abs(Math.sin(a) || 1e-6));
        this.arrow.style.display = 'flex'; this.arrow.style.transform = 'translate3d(' + (W / 2 + Math.cos(a) * k) + 'px,' + (H / 2 + 20 + Math.sin(a) * k) + 'px,0)'; this.arrow.firstChild.style.transform = 'rotate(' + (a + Math.PI / 2) + 'rad)'; this.arrow.lastChild.textContent = g.icon; }
      else this.arrow.style.display = 'none';
    } else this.arrow.style.display = 'none';
  }
  /** iris wipe: a dark screen with a round hole that closes to / opens from a point (fx, fy in 0..1). */
  iris(opening, fx = 0.5, fy = 0.5, dur = 0.6) {
    const el = this.irisEl, W = this.game.width, H = this.game.height, R = Math.hypot(W, H);
    el.style.display = 'block';
    return new Promise(res => {
      const t0 = performance.now(), D = this.game.fast ? 1 : dur * 1000;
      const f = () => { let k = Math.min(1, (performance.now() - t0) / D); const e = opening ? k * k : 1 - (1 - k) * (1 - k); const r = (opening ? e : 1 - e) * R;
        el.style.background = 'radial-gradient(circle at ' + (fx * 100) + '% ' + (fy * 100) + '%, transparent ' + Math.max(0, r - 9) + 'px, #ffc93c ' + Math.max(0, r - 8) + 'px, #fff3c4 ' + Math.max(0, r - 4) + 'px, #ffc93c ' + Math.max(0, r - 1) + 'px, #2b1810 ' + r + 'px)';
        if (k < 1) requestAnimationFrame(f); else { if (opening) el.style.display = 'none'; else el.style.background = '#2b1810'; res(); } };
      f();
    });
  }
  showSummary(world, onDone) {
    const total = world.thanked.reduce((n, t) => n + t.people.length, 0);
    const rows = world.thanked.map((t, i) => '<div class="row" style="animation-delay:' + (i * 0.12) + 's">' + em(t.icon) + '<div class="tags">' + t.people.map(p => '<span>' + esc(p) + '</span>').join('') + '</div></div>').join('');
    const p = this.panel('<div id="summary"><div class="em" style="font-size:64px;line-height:1">' + (world.def.emoji || '🎉') + '</div><h2>Thank you!</h2><div class="sub">' + esc(world.def.thanksLine || ('You met ' + total + ' kinds of helpers behind ' + (world.def.title || 'this').toLowerCase() + '.')) + '</div><div class="rows">' + rows + '</div><button class="btn big" id="sumbtn">' + (this.game.table ? em('🍽️') + ' Back to the table' : em('🔁') + ' Play again') + '</button></div>');
    p.el.querySelector('#sumbtn').onclick = () => { audio.play('click'); p.close(); onDone(); };
  }
  setDebug(text) { this.debugEl.style.display = 'block'; this.debugEl.textContent = text; }
}
