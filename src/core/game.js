// game.js — the shell: renderer, main loop, input, quality, switching between the table and adventures.
import * as THREE from 'three';
import cssText from './style.css';
import f5 from '@fontsource/fredoka/files/fredoka-latin-500-normal.woff2';
import f7 from '@fontsource/fredoka/files/fredoka-latin-700-normal.woff2';
import { Hud, em } from './hud.js';
import { World } from './world.js';
import { audio } from './audio.js';
import * as kit from './kit.js';
import * as props from './props.js';

const SAVE_KEY = 'thanksgiving-table-v1';

export class Game {
  constructor(config) {
    this.config = config; this.adventures = config.adventures || []; this.query = new URLSearchParams(location.search);
    this.fast = this.query.get('fast') === '1'; this.paused = this.query.get('paused') === '1'; this.debug = this.query.get('debug') === '1';
    const st = document.createElement('style');
    st.textContent = "@font-face{font-family:Fredoka;font-weight:400 599;src:url(" + f5 + ") format('woff2');font-display:block}@font-face{font-family:Fredoka;font-weight:600 900;src:url(" + f7 + ") format('woff2');font-display:block}" + cssText;
    document.head.appendChild(st);
    this.el = document.getElementById('app') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'app' }));
    // --- renderer & quality ---
    const probe = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    let gpu = ''; try { const e = probe.getExtension('WEBGL_debug_renderer_info'); gpu = e ? probe.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) {}
    const soft = /swiftshader|llvmpipe|software|basic render/i.test(gpu); const q = this.query.get('q');
    const low = q ? q === 'low' : soft;
    this.quality = { low, shadows: !low, scale: low ? 0.6 : Math.min(window.devicePixelRatio || 1, 2), gpu };
    kit.setDetail(low ? (+this.query.get('detail') || 0.5) : 1.3);
    try { this.quality.hd = low && localStorage.getItem('tt-hd') === '1'; } catch (e) {} if (this.quality.hd) this.quality.scale = 1;
    this.renderer = new THREE.WebGLRenderer({ antialias: !low, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = this.quality.shadows; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.el.appendChild(this.renderer.domElement);
    const ui = document.createElement('div'); ui.id = 'ui'; this.el.appendChild(ui);
    this.hud = new Hud(this, ui);
    this.iris = { close: (fx, fy, d) => this.hud.iris(false, fx, fy, d), open: (fx, fy, d) => this.hud.iris(true, fx, fy, d) };
    this.resize(); window.addEventListener('resize', () => this.resize());
    // --- save ---
    this.save = { done: {}, thanked: {} }; try { Object.assign(this.save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) {}
    // --- input ---
    this.keys = new Set(); this.input = { moveX: 0, moveZ: 0, dragX: 0, dragY: 0, wheel: 0, usePressed: false, useHeld: false, clickGround: null, click: null, pointer: { x: 0, y: 0 } };
    this._setupInput();
    this.mode = null; this.world = null; this.table = null; this.busy = false;
    this._last = performance.now(); this._fpsT = 0; this._fpsN = 0; this.fps = 60; this._stepping = false;
    this._frame = this._frame.bind(this); requestAnimationFrame(this._frame);
    window.__game = this._testApi();
  }
  get aspect() { return this.width / this.height; }
  /** vertical field of view for an adventure: 50° on wide screens; on an upright phone it opens up (to 80° at most) so the view across does not become a narrow slit */
  get worldFov() { const a = this.aspect; return a >= 1 ? 50 : Math.min(80, 2 * Math.atan(Math.tan(25 * Math.PI / 180) / a) * 180 / Math.PI); }
  resize() {
    this.width = this.el.clientWidth || window.innerWidth; this.height = this.el.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(this.quality.scale); this.renderer.setSize(this.width, this.height, false);
    for (const m of [this.world, this.table]) if (m && m.camera) { m.camera.aspect = this.aspect; if (m === this.world) m.camera.fov = this.worldFov; m.camera.updateProjectionMatrix(); }
  }
  persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) {} }
  /** total number of helper roles thanked across all completed adventures */
  get totalThanked() { let n = 0; for (const k in this.save.thanked) n += this.save.thanked[k]; return n; }

  _setupInput() {
    const c = this.renderer.domElement, I = this.input; let down = null, joyId = null, joyO = null;
    window.addEventListener('keydown', (e) => { if (e.repeat) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; this.keys.add(k); if (k === 'e' || k === ' ' || k === 'Enter') { I.usePressed = true; if (k === ' ') e.preventDefault(); } if (k === 'm') this.hud.muteBtn.click(); if (k.startsWith('Arrow')) e.preventDefault(); audio.unlock(); });
    window.addEventListener('keyup', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; this.keys.delete(k); });
    window.addEventListener('blur', () => this.keys.clear());
    c.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('pointerdown', (e) => { document.body.classList.toggle('touch', e.pointerType === 'touch'); }, true);
    c.addEventListener('pointerdown', (e) => {
      audio.unlock(); c.setPointerCapture(e.pointerId);
      // the walking stick: a fixed pad in the bottom-right corner (shown on touch screens while in an adventure); a touch on or near it steers from the pad's centre
      if (e.pointerType === 'touch' && this.world && joyId === null) { const jr = this.hud.joy.getBoundingClientRect(); const cx = jr.left + jr.width / 2, cy = jr.top + jr.height / 2; if (jr.width > 0 && Math.hypot(e.clientX - cx, e.clientY - cy) < jr.width / 2 + 34) { joyId = e.pointerId; joyO = { x: cx, y: cy, t: performance.now(), moved: false }; this.hud.joy.classList.add('held'); moveJoy(e); return; } }
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: 0 };
    });
    const moveJoy = (e) => { let dx = e.clientX - joyO.x, dy = e.clientY - joyO.y; const l = Math.hypot(dx, dy), m = 44; if (l > 8) joyO.moved = true; if (l > m) { dx *= m / l; dy *= m / l; } this._joy = { x: dx / m, y: dy / m }; this.hud.joy.firstChild.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)'; };
    c.addEventListener('pointermove', (e) => {
      I.pointer.x = e.clientX; I.pointer.y = e.clientY;
      if (e.pointerId === joyId) { moveJoy(e); return; }
      if (down && e.pointerId === down.id) { const dx = e.clientX - down.lx, dy = e.clientY - down.ly; down.moved += Math.abs(dx) + Math.abs(dy); down.lx = e.clientX; down.ly = e.clientY; if (down.moved > 6) { I.dragX += dx; I.dragY += dy; } }
    });
    const up = (e) => {
      if (e.pointerId === joyId) { const tap = !joyO.moved && performance.now() - joyO.t < 300; joyId = null; this._joy = null; this.hud.joy.classList.remove('held'); this.hud.joy.firstChild.style.transform = ''; if (tap) I.click = { x: e.clientX, y: e.clientY }; return; }
      if (down && e.pointerId === down.id) { if (down.moved <= 6) I.click = { x: e.clientX, y: e.clientY }; down = null; }
    };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', (e) => { I.wheel += e.deltaY; e.preventDefault(); }, { passive: false });
  }
  _readInput() {
    const I = this.input, K = this.keys; let x = 0, z = 0;
    if (K.has('a') || K.has('ArrowLeft')) x -= 1; if (K.has('d') || K.has('ArrowRight')) x += 1; if (K.has('w') || K.has('ArrowUp')) z -= 1; if (K.has('s') || K.has('ArrowDown')) z += 1;
    if (this._joy) { x += this._joy.x; z += this._joy.y; }
    I.moveX = x; I.moveZ = z; I.useHeld = K.has('e') || K.has(' ') || K.has('Enter');
    I.clickGround = null;
    if (false && I.click && this.mode && this.mode.camera && this.mode === this.world) { // click-to-walk was removed at the person's request (walking is keys / touch stick only)
      const ray = this._ray || (this._ray = new THREE.Raycaster()); ray.setFromCamera(new THREE.Vector2(I.click.x / this.width * 2 - 1, -(I.click.y / this.height) * 2 + 1), this.mode.camera);
      const o = ray.ray.origin, d = ray.ray.direction; if (d.y < -0.01) { const t = -o.y / d.y; if (t < 200) I.clickGround = new THREE.Vector3(o.x + d.x * t, 0, o.z + d.z * t); }
    }
    return I;
  }
  _clearInput() { const I = this.input; I.dragX = I.dragY = I.wheel = 0; I.usePressed = false; I.click = null; I.clickGround = null; }

  _frame(now) {
    requestAnimationFrame(this._frame);
    const dt = Math.min(0.1, (now - this._last) / 1000); this._last = now;
    if (this.mode) {
      this.hud.root.classList.toggle('in-world', this.mode === this.world && !!this.world);
      if (!this._stepping && !this.paused) { this.mode.update(dt, this._readInput()); this._clearInput(); }
      this.renderer.render(this.mode.scene, this.mode.camera);
    }
    // fps & adaptive quality
    this._fpsT += dt; this._fpsN++;
    if (this._fpsT >= 2) { this.fps = this._fpsN / this._fpsT; this._fpsT = 0; this._fpsN = 0; if (!document.hidden && !this._stepping && !this.query.get('q') && !this.paused) this._adapt(); if (this.debug) this.hud.setDebug(this.fps.toFixed(0) + ' fps · ' + this.renderer.info.render.calls + ' draws · ' + (this.renderer.info.render.triangles / 1000).toFixed(0) + 'k tris · scale ' + this.quality.scale.toFixed(2) + (this.quality.shadows ? ' · shadows' : '')); }
  }
  _adapt() {
    const Q = this.quality;
    if (this.fps < 24 && !Q.hd) {
      if (Q.shadows) { Q.shadows = false; this.renderer.shadowMap.enabled = false; for (const m of [this.world, this.table]) if (m && m.sun) m.sun.castShadow = false; if (this.mode) this.mode.scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(mm => mm.needsUpdate = true); }); }
      else if (Q.scale > 0.5) { Q.scale = Math.max(0.5, Q.scale * 0.8); this.resize(); }
    }
  }

  // ---------- flow ----------
  async boot() {
    try { await Promise.all([document.fonts.load('500 20px Fredoka'), document.fonts.load('700 20px Fredoka'), document.fonts.load('20px "Noto Color Emoji"', '🦃')]); } catch (e) {}
    const adv = this.query.get('adv');
    if (this.config.table && !adv) {
      this.table = this.config.table(this); this.mode = this.table; this.resize();
      if (this.query.get('auto') === '1') { this.table.enter && this.table.enter(null); } else this._showTitle();
    } else {
      const id = adv || (this.adventures[0] && this.adventures[0].id);
      if (this.config.table && this.query.get('table') !== '0') { try { this.table = this.config.table(this); this.table.setActive && this.table.setActive(false); } catch (e) { console.error(e); this.table = null; } }
      await this.startAdventure(id, 0.5, 0.5, true);
    }
    const bootMsg = document.getElementById('boot'); if (bootMsg) bootMsg.remove();
  }
  _showTitle() {
    const t = document.createElement('div'); t.id = 'title';
    t.innerHTML = '<h1>The Thanksgiving<br>Adventure</h1><h2>Your meal has a story – and thousands of people to thank.</h2><button class="btn big" id="startbtn">' + em('🦃') + ' Come to the table</button><div class="keys"><span>' + em('🖱️') + ' Drag to look around</span><span>' + em('👆') + ' Push a glowing orange button on the table</span></div>';
    this.hud.root.appendChild(t); this.table.setActive && this.table.setActive(false);
    t.querySelector('#startbtn').onclick = () => { audio.unlock(); audio.play('success'); t.style.opacity = 0; t.style.pointerEvents = 'none'; setTimeout(() => t.remove(), 800); this.table.setActive && this.table.setActive(true); this.table.enter && this.table.enter(null); };
  }
  adventure(id) { return this.adventures.find(a => a.id === id); }
  /** fx, fy: screen point (0..1) the iris closes on */
  async startAdventure(id, fx = 0.5, fy = 0.5, immediate = false) {
    const def = this.adventure(id); if (!def || this.busy) return false; this.busy = true;
    audio.unlock();
    const cv = this.renderer.domElement;
    if (!immediate) { audio.play('whoosh'); const dive = this.table && this.table.focus ? this.table.focus(id) : null; cv.style.transformOrigin = (fx * 100) + '% ' + (fy * 100) + '%'; if (!this.quality.low) cv.classList.add('warp'); await Promise.all([this.iris.close(fx, fy, 0.7), dive]); cv.classList.remove('warp'); }
    else { this.hud.irisEl.style.display = 'block'; this.hud.irisEl.style.background = '#2b1810'; }
    if (this.table && this.table.setActive) this.table.setActive(false);
    audio.music(null);
    // the title card goes up first, so the moment of building the world is not a blank screen
    const cardUp = performance.now(); const card = this.hud.showCard(def.emoji || '', def.question || ('How did ' + (def.title || 'this').toLowerCase() + ' reach your table?'), 'ADVENTURE', 600);
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
    let world;
    try {
      world = new World(this, def); this.world = world; audio.music(def.music || 'farm');
      await def.create(world);
    } catch (e) { console.error('adventure failed to start', e); this._lastError = String(e && e.stack || e); }
    this.mode = world; this.resize(); world.swoop(); world.lock();
    this.renderer.render(world.scene, world.camera); // warm up (compile shaders) behind the card
    const minCard = this.fast ? 0 : (immediate ? 1200 : 2300); await new Promise(r => setTimeout(r, Math.max(0, minCard - (performance.now() - cardUp))));
    clearTimeout(this.hud._cardT); this.hud.cardEl.style.display = 'none';
    audio.play('whooshDown');
    this.busy = false;
    await this.iris.open(0.5, 0.5, 0.55);
    world.unlock();
    if (world._onStart) { try { const r = world._onStart(world); if (r && r.catch) r.catch(e => { console.error(e); this._lastError = String(e && e.stack || e); }); } catch (e) { console.error(e); this._lastError = String(e && e.stack || e); } }
    return true;
  }
  onAdventureFinished(world) {
    const id = world.def.id; this.save.done[id] = true; this.save.thanked[id] = world.thanked.reduce((n, t) => n + t.people.length, 0); this.persist();
    this.hud.showSummary(world, () => this.leaveAdventure(true));
  }
  async leaveAdventure(completed = false) {
    if (this.busy || !this.world) return; this.busy = true; const id = this.world.def.id;
    audio.play('whoosh'); await this.iris.close(0.5, 0.5, 0.6);
    this.world.dispose(); this.world = null; audio.music(null);
    if (this.table) { this.mode = this.table; this.table.setActive && this.table.setActive(true); this.table.enter && this.table.enter(id, completed); audio.play('whooshDown'); await this.iris.open(0.5, 0.5, 0.7); this.busy = false; }
    else { this.busy = false; await this.startAdventure(id, 0.5, 0.5, true); }
  }

  // ---------- automation / testing (window.__game) ----------
  _testApi() {
    const G = this; const tick = () => new Promise(r => queueMicrotask(r));
    const api = {
      game: G, kit, props, audio, THREE,
      get world() { return G.world; },
      /** simulate sec seconds of game time quickly (no waiting). */
      async step(sec = 1, dt = 1 / 30) { G._stepping = true; const n = Math.ceil(sec / dt); for (let i = 0; i < n; i++) { if (G.mode) G.mode.update(dt, G._readInput()); G._clearInput(); await tick(); await tick(); await tick(); } G._stepping = false; },
      tp(x, z) { G.world.tp(x, z); },
      /** walk (with collisions) toward x,z for up to maxSec game seconds. resolves {reached, x, z} */
      async walkTo(x, z, maxSec = 25, near = 0.6) { const w = G.world, P = w.player.position; let t = 0; w._moveTarget = null; while (t < maxSec) { if (Math.hypot(P.x - x, P.z - z) < near) return { reached: true, x: P.x, z: P.z }; if (!w._moveTarget && w._locks === 0) { w._moveTarget = new THREE.Vector3(x, 0, z); w._stuckT = 0; } await api.step(0.2); t += 0.2; if (!w._moveTarget && w._locks === 0 && Math.hypot(P.x - x, P.z - z) >= near) { const d = Math.hypot(P.x - x, P.z - z); return { reached: d < near + 1.2, stuck: true, x: P.x, z: P.z, d }; } } return { reached: false, timeout: true, x: P.x, z: P.z }; },
      /** use the interaction the player is standing at (like pressing E; holds are completed instantly). */
      use() { const w = G.world, it = w._active; if (!it) return false; w._holdT = it.hold || 0; return w._tryUse(it); },
      interacts() { const w = G.world, v = new THREE.Vector3(); return w._interacts.map(it => { w._pos(it.at, v); return { icon: it.icon, label: it.label, x: +v.x.toFixed(2), z: +v.z.toFixed(2), r: it.r, ok: !!(it.enabled && (!it.when || it.when())) }; }); },
      info() { const w = G.world; if (!w) return { mode: G.mode === G.table ? 'table' : 'none', busy: G.busy, save: G.save, error: G._lastError }; const v = new THREE.Vector3(); const g = w._goal; let gt = null; if (g && g.target) { w._pos(g.target, v); gt = [+v.x.toFixed(2), +v.z.toFixed(2)]; }
        return { mode: 'adventure', id: w.def.id, time: +w.time.toFixed(1), player: [+w.player.position.x.toFixed(2), +w.player.position.z.toFixed(2)], goal: g ? { icon: g.icon, text: g.text, target: gt } : null, locked: w._locks, thanked: w.thanked.length, finished: w.finished, panel: G.hud.panelOpen, collects: w._collects.reduce((n, c) => n + c.left.length, 0), zones: w._zones.length, calls: G.renderer.info.render.calls, tris: G.renderer.info.render.triangles, fps: +G.fps.toFixed(1), busy: G.busy, error: G._lastError }; },
      /** try to play automatically: walk to the goal beacon and press E, over and over. Returns info(). Works for adventures whose every step has a goal target. */
      async auto(maxLoops = 200, log = []) {
        for (let i = 0; i < maxLoops; i++) { const w = G.world; if (!w || w.finished) break; await api.step(0.5);
          if (G.hud.panelOpen || w._locks > 0) { await new Promise(r => setTimeout(r, 30)); continue; }
          const g = w._goal; const v = new THREE.Vector3();
          let targets = []; if (w._collects.length) { for (const c of w._collects) for (const o of c.left) { o.getWorldPosition(v); targets.push([v.x, v.z]); } }
          else { for (const it of w._interacts) if (it.enabled && (!it.when || it.when())) { w._pos(it.at, v); targets.push([v.x, v.z]); }
            if (!targets.length && g && g.target) { w._pos(g.target, v); targets.push([v.x, v.z]); }
            if (!targets.length) for (const z of w._zones) targets.push([z.x, z.z]); }
          if (!targets.length) continue;
          const P = w.player.position; targets.sort((a, b) => Math.hypot(a[0] - P.x, a[1] - P.z) - Math.hypot(b[0] - P.x, b[1] - P.z)); const [x, z] = targets[0];
          const r = await api.walkTo(x, z, 30, 1.0); if (!r.reached) { log.push('tp to ' + x.toFixed(1) + ',' + z.toFixed(1) + ' (walk blocked at ' + r.x.toFixed(1) + ',' + r.z.toFixed(1) + ')'); const d = Math.hypot(P.x - x, P.z - z) || 1; w.tp(x + (P.x - x) / d * 1.0, z + (P.z - z) / d * 1.0); await api.step(0.1); }
          await api.step(0.1); if (api.use()) log.push('use @' + x.toFixed(1) + ',' + z.toFixed(1) + ' goal=' + (g ? g.text : ''));
        }
        return Object.assign(api.info(), { log });
      },
      start(id) { return G.startAdventure(id, 0.5, 0.5, true); },
      home() { return G.leaveAdventure(false); },
    };
    return api;
  }
}

export async function boot(config) { const g = new Game(config); await g.boot(); return g; }
