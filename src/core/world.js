// world.js — the adventure runtime. One World per adventure: scene, third-person player + camera,
// colliders, interactions, goals, speech, thank-you cards, chapters, rides, timers/tweens.
// An adventure's create(ctx) receives the World as ctx. See src/API.md for the guide.
import * as kit from './kit.js';
import * as props from './props.js';
import { audio } from './audio.js';
const { THREE, damp, clamp, angleTo } = kit;

const EASE = {
  linear: t => t, in: t => t * t, out: t => 1 - (1 - t) * (1 - t), inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outBack: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
  outElastic: t => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
};
const SKIES = {
  day: { top: '#4aa8ff', bottom: '#cfeeff', fog: 0xcfeeff, sun: 0xfff4e0, sunI: 2.2, amb: 1.25, ground: kit.C.grass },
  autumn: { top: '#5aa6e8', bottom: '#ffe9c4', fog: 0xffe9c4, sun: 0xffe2b0, sunI: 2.2, amb: 1.2, ground: 0x9db85a },
  sunset: { top: '#3a4a8c', bottom: '#ffb36b', fog: 0xffb36b, sun: 0xffa860, sunI: 2.0, amb: 1.0, ground: 0x8aa855 },
  dawn: { top: '#7ab0e0', bottom: '#ffd9c0', fog: 0xffd9c0, sun: 0xffd0b0, sunI: 1.8, amb: 1.1, ground: 0x86b060 },
  night: { top: '#0b1030', bottom: '#2a3566', fog: 0x1a2248, sun: 0x8fa8ff, sunI: 0.9, amb: 0.75, ground: 0x3f5a46 },
  overcast: { top: '#8e9aa8', bottom: '#d5dbe0', fog: 0xd5dbe0, sun: 0xffffff, sunI: 1.3, amb: 1.4, ground: 0x7aa05a },
  snow: { top: '#9cc4e8', bottom: '#eef6ff', fog: 0xeef6ff, sun: 0xffffff, sunI: 1.8, amb: 1.4, ground: 0xf2f6fa },
  indoor: { top: '#3b2a20', bottom: '#5a4030', fog: 0x3b2a20, sun: 0xffe0b0, sunI: 1.6, amb: 1.5, ground: 0xb08a5e },
  factory: { top: '#5c6670', bottom: '#8a949e', fog: 0x7a848e, sun: 0xffffff, sunI: 1.5, amb: 1.6, ground: 0xa9adb0 },
  sea: { top: '#3f8fe0', bottom: '#bfe6ff', fog: 0xbfe6ff, sun: 0xfff4e0, sunI: 2.2, amb: 1.2, ground: 0x2f7fc0 },
};

export class World {
  constructor(game, def) {
    this.game = game; this.def = def; this.THREE = THREE; this.kit = kit; this.props = props; this.audio = audio;
    this.time = 0; this.disposed = false; this.finished = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(game.worldFov || 50, game.aspect, 0.3, 400);
    this.cam = { yaw: 0, pitch: 0.45, dist: 9, height: 1.3, target: null, _pos: new THREE.Vector3(0, 8, 12), _look: new THREE.Vector3(), shake: 0, minDist: 5, maxDist: 22 };
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x889977, 1.2); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff4e0, 2.2); this.sunDir = new THREE.Vector3(8, 16, 6); this.sun.position.copy(this.sunDir); this.scene.add(this.sun); this.scene.add(this.sun.target);
    if (game.quality.shadows) { this.sun.castShadow = true; const s = this.sun.shadow; s.mapSize.set(2048, 2048); s.camera.left = -26; s.camera.right = 26; s.camera.top = 26; s.camera.bottom = -26; s.camera.near = 1; s.camera.far = 80; s.bias = -0.0006; s.normalBias = 0.04; }
    this.groundMesh = null;
    this._tickers = new Set(); this._updates = new Set(); this._tweens = []; this._timers = []; this._untils = [];
    this._colliders = []; this._bounds = null; this._interacts = []; this._zones = []; this._dom = []; this._collects = [];
    this._tiles = []; this._tileT = 0; this._goal = null; this._locks = 0; this._moveTarget = null; this._riding = null; this._carry = null;
    this.thanked = []; this.ui = game.hud; this._useHeld = false; this._heldIt = null; this._holdT = 0; this._stepT = 0;
    // player
    this.player = kit.person(Object.assign({ scale: 0.82, shirt: 0xf08a24, pants: 0x3b5b8c, hair: 0x5a3a22, hairStyle: 'short', skin: kit.C.skin[0], hat: 'cap', hatColor: 0x2f8f6f, shoes: 0xd84a3a }, game.avatar || {}));
    this.player.userData.dynamic = true; this.scene.add(this.player); this._tickers.add(this.player);
    this.vel = new THREE.Vector3(); this.playerRadius = 0.4; this.speed = 6.2;
    // goal beacon
    const bm = new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
    this._beacon = new THREE.Group(); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 7, 14, 1, true), bm); col.position.y = 3.5; this._beacon.add(col);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 20), new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; this._beacon.add(ring); this._beaconRing = ring;
    this._beacon.visible = false; this.scene.add(this._beacon);
    // click marker
    this._marker = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.36, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })); this._marker.rotation.x = -Math.PI / 2; this._marker.position.y = 0.07; this._marker.visible = false; this.scene.add(this._marker);
    this.env('day');
    this.ui.enterWorld(this);
  }

  /** onStart(async () => { ...the story... }) — runs once the intro transition has finished and the player can move. */
  onStart(fn) { this._onStart = fn; }

  // ================= scene =================
  /** env('day'|'autumn'|'sunset'|'dawn'|'night'|'overcast'|'snow'|'indoor'|'factory'|'sea' , {ground: colour|false, groundSize, fog:[near,far]|false, top, bottom, sunI, amb}) */
  env(preset = 'day', o = {}) {
    const p = Object.assign({}, SKIES[preset] || SKIES.day, o);
    if (this.scene.background && this.scene.background.isTexture) this.scene.background.dispose();
    this.scene.background = kit.canvasTex(4, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, p.top); gr.addColorStop(0.34, p.bottom); gr.addColorStop(1, p.bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const fog = o.fog === false ? null : (o.fog || [45, 140]);
    this.scene.fog = fog ? new THREE.Fog(p.fog, fog[0], fog[1]) : null;
    this.sun.color.set(p.sun); this.sun.intensity = p.sunI; this.hemi.intensity = p.amb; this.hemi.groundColor.set(p.ground === false ? 0x888888 : p.ground).lerp(new THREE.Color(0xffffff), 0.3);
    if (this.groundMesh) { this.scene.remove(this.groundMesh); this.groundMesh.geometry.dispose(); this.groundMesh = null; }
    if (p.ground !== false) { const s = p.groundSize || 600; this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshLambertMaterial({ color: p.ground, map: kit.grain(s / 12) })); this.groundMesh.rotation.x = -Math.PI / 2; this.groundMesh.receiveShadow = true; this.groundMesh.position.set(Math.round(this.player ? this.player.position.x / 48 : 0) * 48, 0, Math.round(this.player ? this.player.position.z / 48 : 0) * 48); this.scene.add(this.groundMesh); }
    return this;
  }
  /** add an object to the scene (dynamic things: anything that moves or animates). Returns it. */
  add(obj, x, z, ry) { if (x !== undefined) obj.position.x = x; if (z !== undefined) obj.position.z = z; if (ry !== undefined) obj.rotation.y = ry; this.scene.add(obj); if (obj.userData.tick) this._tickers.add(obj); return obj; }
  /** add scenery that never changes: it is merged into one mesh (fast). Returns the group. */
  addStatic(group, x, z, ry) { if (x !== undefined) group.position.x = x; if (z !== undefined) group.position.z = z; if (ry !== undefined) group.rotation.y = ry; kit.bake(group); this._splitStatic(group); this.scene.add(group); return group; }
  // Big baked scenery is cut into ~24 m tiles so that tiles behind the camera or lost in the fog are not drawn at all.
  _splitStatic(group, cell = 24) {
    for (const m of group.children.slice()) {
      if (!m.isMesh || !m.userData.baked) continue; const g = m.geometry, pos = g.attributes.position, n = pos.count / 3; if (g.index || n < 1500) { this._tiles.push(m); continue; }
      const keys = new Map(), nor = g.attributes.normal, col = g.attributes.color;
      for (let i = 0; i < n; i++) { const cx = (pos.getX(i * 3) + pos.getX(i * 3 + 1) + pos.getX(i * 3 + 2)) / 3, cz = (pos.getZ(i * 3) + pos.getZ(i * 3 + 1) + pos.getZ(i * 3 + 2)) / 3; const k = Math.floor(cx / cell) + ',' + Math.floor(cz / cell); let a = keys.get(k); if (!a) keys.set(k, a = []); a.push(i); }
      if (keys.size < 2) { this._tiles.push(m); continue; }
      for (const tris of keys.values()) { const P = new Float32Array(tris.length * 9), N = new Float32Array(tris.length * 9), C = new Float32Array(tris.length * 9);
        tris.forEach((t, j) => { for (let v = 0; v < 9; v++) { P[j * 9 + v] = pos.array[t * 9 + v]; N[j * 9 + v] = nor.array[t * 9 + v]; C[j * 9 + v] = col.array[t * 9 + v]; } });
        const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(P, 3)); ng.setAttribute('normal', new THREE.BufferAttribute(N, 3)); ng.setAttribute('color', new THREE.BufferAttribute(C, 3)); ng.computeBoundingSphere();
        const nm = new THREE.Mesh(ng, m.material); nm.castShadow = m.castShadow; nm.receiveShadow = m.receiveShadow; nm.userData.baked = true; nm.userData.tile = true; group.add(nm); this._tiles.push(nm); }
      group.remove(m); g.dispose();
    }
  }
  /** remove an object from the scene and free it. */
  remove(obj) { if (!obj) return; this._tickers.delete(obj); obj.parent && obj.parent.remove(obj); kit.dispose(obj); }
  /** create a person, add to scene at (x,z) facing ry, and animate them automatically. opts as kit.person, or a string kind for kit.randomPerson ('farmer','worker','factory','chef','driver','shopper'). */
  person(opts = {}, x = 0, z = 0, ry = 0, seed) {
    const p = typeof opts === 'string' ? kit.randomPerson(opts, seed ?? Math.floor(x * 13 + z * 7 + 99)) : kit.person(opts);
    p.position.set(x, 0, z); p.rotation.y = ry; p.userData.dynamic = true; this.scene.add(p); this._tickers.add(p); if (!(opts && opts.solid === false)) p.userData.collider = this.collideObj(p, 0.4 * p.scale.x); return p;
  }
  /** register anything with userData.tick(dt,t) (e.g. a person you created with kit.person and parented elsewhere). */
  animate(obj) { this._tickers.add(obj); return obj; }
  /** run fn(dt, t) every frame. Returns a function that stops it. */
  onUpdate(fn) { this._updates.add(fn); return () => this._updates.delete(fn); }

  // ================= time =================
  /** await ctx.wait(1.5) — game-time pause (never use setTimeout). */
  wait(sec) { return new Promise(res => this._timers.push({ t: sec, fn: res })); }
  after(sec, fn) { const h = { t: sec, fn }; this._timers.push(h); return () => { h.dead = true; }; }
  every(sec, fn) { const h = { t: sec, fn, every: sec }; this._timers.push(h); return () => { h.dead = true; }; }
  /** await ctx.until(() => count >= 5) */
  until(cond) { return new Promise(res => this._untils.push({ cond, res })); }
  /** await ctx.tween(obj.position, {y: 2}, 0.6, 'outBack') — animate numeric properties. ease: linear|in|out|inOut|outBack|outBounce|outElastic */
  tween(target, to, dur = 0.5, ease = 'inOut') {
    return new Promise(res => { const from = {}; for (const k in to) from[k] = target[k]; this._tweens.push({ target, from, to, t: 0, dur: Math.max(0.0001, dur), ease: EASE[ease] || EASE.inOut, res }); });
  }
  /** stop any running tweens on a target (e.g. before you reposition something that was still animating). */
  stopTweens(target) { for (let i = this._tweens.length - 1; i >= 0; i--) if (this._tweens[i].target === target) { const w = this._tweens[i]; this._tweens.splice(i, 1); w.res(); } }
  /** move an object along [[x,y,z],...] points at a speed (m/s), turning to face its heading. await it. */
  async moveAlong(obj, pts, speed = 4, o = {}) {
    for (const p of pts) {
      const tx = p[0], ty = p.length > 2 ? p[1] : obj.position.y, tz = p.length > 2 ? p[2] : p[1];
      const d = Math.hypot(tx - obj.position.x, tz - obj.position.z, ty - obj.position.y); if (d < 0.01) continue;
      if (o.face !== false) { const a = Math.atan2(tx - obj.position.x, tz - obj.position.z); if (o.turn === false) obj.rotation.y = a; else this.tween(obj.rotation, { y: obj.rotation.y + angleTo(obj.rotation.y, a) }, Math.min(0.4, d / speed)); }
      await this.tween(obj.position, { x: tx, y: ty, z: tz }, d / speed, o.ease || 'linear');
    }
  }

  // ================= collisions =================
  /** solid circle at (x,z) radius r. Returns {remove()}. */
  collideCircle(x, z, r) { const c = { type: 'c', x, z, r }; this._colliders.push(c); return { remove: () => this._rm(this._colliders, c), c }; }
  /** solid box by centre & size: collideBox(cx, cz, width(x), depth(z)). Returns {remove()}. */
  collideBox(cx, cz, w, d) { const c = { type: 'b', x1: cx - w / 2, x2: cx + w / 2, z1: cz - d / 2, z2: cz + d / 2 }; this._colliders.push(c); return { remove: () => this._rm(this._colliders, c), c }; }
  /** solid circle that follows a moving object (people from ctx.person get one automatically). */
  collideObj(obj, r = 0.45) { const c = { type: 'c', x: 0, z: 0, r, obj }; this._colliders.push(c); return { remove: () => this._rm(this._colliders, c), c }; }
  /** keep the player inside a rectangle: bounds(minX, minZ, maxX, maxZ) (or null to clear). */
  bounds(x1, z1, x2, z2) { this._bounds = x1 === null || x1 === undefined ? null : { x1, z1, x2, z2 }; }
  _rm(list, x) { const i = list.indexOf(x); if (i >= 0) list.splice(i, 1); }

  // ================= interaction =================
  /**
   * interact({ at: Object3D | [x,z] | [x,y,z], r: 2.4, icon: '🌱', label: 'Plant', hold: 0 (seconds to hold), once: true,
   *            when: () => bool, onUse: (it) => {...}, y: height of the bubble above 'at' (default 2) })
   * Player walks near → bubble appears → press E / Space / click the bubble. Returns handle {remove(), enabled}.
   */
  interact(o) {
    const it = Object.assign({ r: 2.4, icon: '✨', label: '', hold: 0, once: true, enabled: true, y: 2 }, o);
    it.el = this.ui.makePrompt(it, () => this._tryUse(it), (down) => { if (it.hold) { this._heldIt = down ? it : null; } });
    it.remove = () => { this._rm(this._interacts, it); it.el.remove(); it.removed = true; };
    this._interacts.push(it); return it;
  }
  _pos(at, out) { if (!at) return null; if (at.isObject3D) return at.getWorldPosition(out); if (at.isVector3) return out.copy(at); if (at.length === 2) return out.set(at[0], 0, at[1]); return out.set(at[0], at[1], at[2]); }
  _tryUse(it) {
    if (!it || it.removed || !it.enabled || this._locks > 0 || (it.when && !it.when())) return false;
    if (it.hold && this._holdT < it.hold) return false;
    this._holdT = 0; audio.play(it.sfx || 'pop');
    const faceAt = it.face === false ? null : (it.face || (it.at && it.at.isObject3D ? it.at : null)); // turn to what you use: the object itself, or the optional `face` target
    if (faceAt && !this._riding && this.player.visible) { const q = this._pos(faceAt, this._tmpU || (this._tmpU = new THREE.Vector3())), dx = q.x - this.player.position.x, dz = q.z - this.player.position.z; if (dx * dx + dz * dz > 0.04) this.player.rotation.y = Math.atan2(dx, dz); } // turn to face what you use
    if (it.once) it.remove();
    try { const r = it.onUse && it.onUse(it); if (r && r.catch) r.catch(e => console.error(e)); } catch (e) { console.error(e); }
    return true;
  }
  /** invisible trigger area: zone({x, z, r, onEnter, onExit, once: true}) */
  zone(o) { const z = Object.assign({ r: 2, once: true, inside: false }, o); z.remove = () => this._rm(this._zones, z); this._zones.push(z); return z; }
  /**
   * collect({ items: [Object3D...], r: 1.2, sfx: 'pickup', spin: true, onEach: (obj, nLeft) => {}, onAll: () => {} })
   * Things the player picks up just by walking over them (they pop and vanish). Returns a promise that resolves when all are collected.
   */
  collect(o) {
    const c = Object.assign({ r: 1.2, sfx: 'pickup', spin: true, left: o.items.slice() }, o);
    c.promise = new Promise(res => { c.res = res; }); this._collects.push(c); return c.promise;
  }

  // ================= guidance & talk =================
  /** goal('🥔', 'Dig potatoes', target?) — sets the objective chip (keep text ≤ 4 words) and puts a glowing beacon on target (Object3D or [x,z]). goal(null) clears. */
  goal(icon, text, target) {
    if (!icon) { this._goal = null; this.ui.setGoal(null); this._beacon.visible = false; return; }
    this._goal = { icon, text, target: target || null }; this.ui.setGoal(icon, text); this._beacon.visible = !!target; audio.play('click');
  }
  /** progress dots under the goal chip: progress(done, total) */
  progress(done, total) { this.ui.setProgress(done, total); }
  /** speech bubble above an object (a person): say(obj, 'Hi! 👋', seconds). Keep it to a few words. */
  say(obj, text, sec = 3.2, o = {}) {
    let carry = null; for (let i = this._dom.length - 1; i >= 0; i--) { const q = this._dom[i]; if (q.say && q.at === obj) { q.el.remove(); this._dom.splice(i, 1); if (q.restore) carry = q.restore; } }
    const el = this.ui.makeBubble(text);
    const d = { el, say: true, restore: carry, at: obj, y: o.y ?? (obj && obj.userData && obj.userData.isPerson ? 2.2 * (obj.scale ? obj.scale.y : 1) : 2), t: sec }; this._dom.push(d);
    if (obj && obj.userData && obj.userData.isPerson && obj !== this.player) { if (obj.userData.anim === 'idle') { obj.userData.anim = 'talk'; d.restore = obj; } obj.userData.lookAt = this.player.position.clone().setY(1.3); d.look = obj; }
    audio.babble(o.pitch ?? (0.8 + ((text.length * 7) % 10) / 12), Math.min(7, 2 + Math.floor(text.length / 5)));
    return this.wait(Math.min(sec, o.block === false ? 0 : sec));
  }
  /** a rising emoji at an object/position — cheap, crisp feedback: emote(obj, '💛') */
  emote(at, emoji, o = {}) { const el = this.ui.makeEmote(emoji, o.size); this._dom.push({ el, at, y: o.y ?? 1.8, t: 1.2, rise: 1.6 }); }
  /** thank-you card: thank('🚜', ['Farmers', 'Truck drivers']) — the heart of the game: the people behind each step. */
  thank(icon, people, title) { this.thanked.push({ icon, people }); this.ui.showThanks(icon, people, title, this.thanked.reduce((n, t) => n + t.people.length, 0)); audio.play('thanks'); this.emote(this.player, '💛', { y: 2.2 }); }
  /** small fact toast at the bottom: fact('🐝', '20 million blossoms per acre!') — one short line. */
  fact(icon, text, sec = 7) { this.ui.showFact(icon, text, sec); audio.play('ding'); }
  /** big short banner in the middle (e.g. 'Harvest time!'): banner('🍂', 'Autumn', 2) */
  banner(icon, text, sec = 2) { this.ui.showBanner(icon, text, sec); return this.wait(sec); }

  // ================= player control =================
  /** stop the player moving (cutscenes). Call unlock() after. */
  lock() { this._locks++; this._moveTarget = null; this.vel.set(0, 0, 0); }
  unlock() { this._locks = Math.max(0, this._locks - 1); }
  get locked() { return this._locks > 0; }
  /** teleport player: tp(x, z, facingAngle) */
  tp(x, z, ry) { this.player.position.set(x, 0, z); if (ry !== undefined) this.player.rotation.y = ry; this._moveTarget = null; this.vel.set(0, 0, 0); this._snapCam = true; }
  /** carry something in the player's hands: carry(obj) ; drop() returns it (detached, not in scene). */
  carry(obj, o = {}) { this.drop(); this._carry = obj; obj.position.set(0, o.y || 0, 0); obj.rotation.set(0, 0, 0); this.player.userData.carryAnchor.add(obj); this.player.userData.carrying = true; audio.play('pickup'); return obj; }
  drop() { const o = this._carry; if (o) { o.parent && o.parent.remove(o); this._carry = null; this.player.userData.carrying = false; } return o; }
  get carrying() { return this._carry; }
  /** make the player (or anyone) do an animation for a while: await act('dig', 1.2) */
  async act(anim, sec = 1, who) { const p = who || this.player; const was = p === this.player; if (was) this.lock(); p.userData.forceAnim = anim; await this.wait(sec); p.userData.forceAnim = null; if (was) this.unlock(); }
  /**
   * ride(vehicle, [[x,z],...], {speed: 9, seat: [x,y,z], sfx: 'engine', hide: true}) — player hops in, vehicle drives the path,
   * camera follows. await it; player is left beside the vehicle at the end.
   */
  async ride(vehicle, pts, o = {}) {
    this.lock(); const seat = o.seat || vehicle.userData.seat || [0, 1, 0];
    this._riding = vehicle; this.player.visible = o.hide === false; if (o.hide === false) { vehicle.add(this.player); this.player.position.set(seat[0], seat[1], seat[2]); this.player.rotation.y = 0; this.player.userData.sitting = true; }
    const stop = this.every(0.45, () => audio.play(o.sfx || 'engine'));
    await this.moveAlong(vehicle, pts, o.speed || 9, { ease: 'linear' });
    stop(); this._riding = null;
    const side = new THREE.Vector3(2.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.rotation.y);
    if (o.hide === false) { this.scene.add(this.player); this.player.userData.sitting = false; }
    this.player.visible = true; this.player.position.set(vehicle.position.x + side.x, 0, vehicle.position.z + side.z); this._collide(this.player.position);
    this.unlock();
  }
  /** look at something for a moment (camera glides there and back): await focus(obj, 2.5, {dist: 8}) */
  async focus(at, sec = 2.5, o = {}) { this.lock(); this.cam.target = { at, dist: o.dist, pitch: o.pitch, yaw: o.yaw }; await this.wait(sec); this.cam.target = null; this.unlock(); }
  /** chapter change: fade out, show a title card, move the player, fade in.
   *  await chapter({ n: 2, title: 'The Hatchery', emoji: '🥚', at: [x, z], face: angle, env: 'indoor' | ['day', {...}], cam: {yaw, pitch, dist}, music: 'farm', setup: () => {} }) */
  async chapter(o) {
    this.lock();
    await this.game.iris.close(0.5, 0.5, 0.55);
    if (this.disposed) return;
    if (o.env) Array.isArray(o.env) ? this.env(o.env[0], o.env[1]) : this.env(o.env);
    if (o.at) this.tp(o.at[0], o.at[1], o.face ?? this.player.rotation.y);
    if (o.cam) Object.assign(this.cam, o.cam);
    if (o.music) audio.music(o.music);
    if (o.setup) await o.setup();
    this._snapCam = true;
    if (o.title) await this.ui.showCard(o.emoji || '', o.title, o.n ? String(o.n) : '', 1.5);
    if (this.disposed) return;
    audio.play('whooshDown');
    await this.game.iris.open(0.5, 0.5, 0.6);
    this.unlock();
  }
  /** the adventure is complete: celebration + summary of everyone thanked + back to the table. */
  async finish() {
    if (this.finished) return; this.finished = true; this.lock(); this.goal(null);
    this.player.userData.forceAnim = 'cheer'; audio.play('fanfare'); this.confetti();
    await this.wait(1.6);
    this.game.onAdventureFinished(this);
  }
  /** burst of little coloured bits at a position: burst([x,y,z] | obj, {color, n, speed, emoji}) */
  burst(at, o = {}) {
    const p = this._pos(at, new THREE.Vector3()); const n = o.n || 12, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y + (o.y ?? 0.3); pos[i * 3 + 2] = p.z; const a = Math.random() * 6.28, s = (o.speed || 3) * (0.4 + Math.random() * 0.6); vel.push(Math.cos(a) * s, 2 + Math.random() * 3, Math.sin(a) * s); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: o.color ?? 0xffd84a, size: o.size || 0.22, transparent: true, depthWrite: false })); m.frustumCulled = false; this.scene.add(m);
    let t = 0; const stop = this.onUpdate((dt) => { t += dt; for (let i = 0; i < n; i++) { vel[i * 3 + 1] -= 9 * dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] = Math.max(0.05, pos[i * 3 + 1] + vel[i * 3 + 1] * dt); pos[i * 3 + 2] += vel[i * 3 + 2] * dt; } geo.attributes.position.needsUpdate = true; m.material.opacity = 1 - t / 1.1; if (t > 1.1) { stop(); this.scene.remove(m); geo.dispose(); m.material.dispose(); } });
  }
  confetti() { const cols = [0xff5a5a, 0xffd84a, 0x5ad17a, 0x5aa8ff, 0xc77dff, 0xff9a3c]; for (let i = 0; i < 6; i++) this.after(i * 0.12, () => this.burst([this.player.position.x + (Math.random() - 0.5) * 3, 2.4, this.player.position.z + (Math.random() - 0.5) * 3], { color: cols[i], n: 16, speed: 4, size: 0.28 })); }

  // ================= per-frame =================
  update(dt, input) {
    if (this.disposed) return;
    this.time += dt; const t = this.time, P = this.player.position;
    // --- timers / tweens ---
    for (let i = this._timers.length - 1; i >= 0; i--) { const h = this._timers[i]; if (h.dead) { this._timers.splice(i, 1); continue; } h.t -= dt; if (h.t <= 0) { if (h.every) h.t += h.every; else this._timers.splice(i, 1); try { h.fn(); } catch (e) { console.error(e); } } }
    for (let i = this._tweens.length - 1; i >= 0; i--) { const w = this._tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur), e = w.ease(k); for (const key in w.to) w.target[key] = w.from[key] + (w.to[key] - w.from[key]) * e; if (k >= 1) { this._tweens.splice(i, 1); w.res(); } }
    for (let i = this._untils.length - 1; i >= 0; i--) { const u = this._untils[i]; let ok = false; try { ok = u.cond(); } catch (e) { console.error(e); ok = true; } if (ok) { this._untils.splice(i, 1); u.res(); } }
    // --- player movement ---
    const pu = this.player.userData; let moving = false;
    if (!this._riding) {
      let ix = 0, iz = 0;
      if (this._locks === 0 && input) {
        ix = input.moveX; iz = input.moveZ;
        if (ix || iz) this._moveTarget = null;
        if (input.clickGround) { this._moveTarget = input.clickGround.clone(); this._marker.position.set(this._moveTarget.x, 0.07, this._moveTarget.z); this._marker.visible = true; this._stuckT = 0; }
      }
      let wx = 0, wz = 0;
      if (ix || iz) { const l = Math.hypot(ix, iz), c = Math.cos(this.cam.yaw), s = Math.sin(this.cam.yaw); const nx = ix / Math.max(1, l), nz = iz / Math.max(1, l); wx = nx * c + nz * s; wz = -nx * s + nz * c; }
      else if (this._moveTarget && this._locks === 0) { const dx = this._moveTarget.x - P.x, dz = this._moveTarget.z - P.z, d = Math.hypot(dx, dz); if (d < 0.25) { this._moveTarget = null; } else { wx = dx / d; wz = dz / d; if (d < 1) { wx *= Math.max(0.35, d); wz *= Math.max(0.35, d); }
          // walking round an obstacle met head-on: steer sideways for a moment
          const dt_ = this._detour; if (dt_ && dt_.t > 0) { dt_.t -= dt; const c = Math.cos(dt_.ang), s = Math.sin(dt_.ang), ox2 = wx; wx = ox2 * c + wz * s; wz = -ox2 * s + wz * c; } } }
      if (!this._moveTarget) this._marker.visible = false; else this._marker.scale.setScalar(1 + Math.sin(t * 8) * 0.15);
      const sp = this.speed * (this._carry ? 0.85 : 1);
      this.vel.x = damp(this.vel.x, wx * sp, 12, dt); this.vel.z = damp(this.vel.z, wz * sp, 12, dt);
      const ox = P.x, oz = P.z; P.x += this.vel.x * dt; P.z += this.vel.z * dt;
      this._collide(P);
      const v = Math.hypot(this.vel.x, this.vel.z); moving = v > 0.6;
      if (moving) { const a = Math.atan2(this.vel.x, this.vel.z); this.player.rotation.y += angleTo(this.player.rotation.y, a) * Math.min(1, dt * 12); this._stepT -= dt * v; if (this._stepT <= 0) { this._stepT = 2.6; if (this.player.visible && !this.player.userData.quiet) audio.play('step'); } }
      if (this._moveTarget) { const moved = Math.hypot(P.x - ox, P.z - oz); this._stuckT = moved < sp * dt * 0.2 ? (this._stuckT || 0) + dt : 0;
        if (this._stuckT > 0.22 && (Math.hypot(this._moveTarget.x - P.x, this._moveTarget.z - P.z) < 2.6 || this._blocked(this._moveTarget.x, this._moveTarget.z))) { this._moveTarget = null; } // target is on/inside something solid: just stop at its edge
        else if (this._stuckT > 0.22) { const d0 = this._detour || (this._detour = { ang: 0, t: 0, n: 0, for: null }); if (d0.for !== this._moveTarget) { d0.for = this._moveTarget; d0.n = 0; d0.ang = 1.35; } else d0.ang = -d0.ang; d0.n++; d0.t = 0.7 + d0.n * 0.25; this._stuckT = 0; if (d0.n > 3) this._moveTarget = null; } }
      pu.anim = pu.forceAnim || (moving ? (v > 4.5 ? 'run' : 'walk') : 'idle');
    }
    // --- zones & collectibles ---
    for (const z of this._zones.slice()) { const inside = Math.hypot(P.x - z.x, P.z - z.z) < z.r; if (inside && !z.inside) { z.inside = true; if (z.once) z.remove(); z.onEnter && z.onEnter(z); } else if (!inside && z.inside) { z.inside = false; z.onExit && z.onExit(z); } }
    const tmp = this._tmp || (this._tmp = new THREE.Vector3());
    for (let ci = this._collects.length - 1; ci >= 0; ci--) { const c = this._collects[ci];
      for (let i = c.left.length - 1; i >= 0; i--) { const o = c.left[i]; if (c.spin) o.rotation.y += dt * 2; o.getWorldPosition(tmp); if (this._locks === 0 && Math.hypot(P.x - tmp.x, P.z - tmp.z) < c.r) { c.left.splice(i, 1); audio.play(c.sfx); this.burst(tmp, { n: 6, color: c.color ?? 0xffd84a, y: 0 }); if (c.keep) o.visible = false; else this.remove(o); c.onEach && c.onEach(o, c.left.length); } }
      if (!c.left.length) { this._collects.splice(ci, 1); c.onAll && c.onAll(); c.res(); } }
    // --- interactions ---
    let best = null, bd = 1e9;
    for (const it of this._interacts) { this._pos(it.at, tmp); it._d = Math.hypot(P.x - tmp.x, P.z - tmp.z); it._ok = it.enabled && (!it.when || it.when()); if (it._ok && it._d < it.r && it._d < bd && this._locks === 0) { bd = it._d; best = it; } }
    this._active = best;
    const useDown = input && (input.useHeld || (this._heldIt && this._heldIt === best));
    if (best && best.hold) { if (useDown) { this._holdT += dt; if (this._holdT >= best.hold) this._tryUse(best); } else this._holdT = Math.max(0, this._holdT - dt * 2); }
    else { this._holdT = 0; if (best && input && input.usePressed) this._tryUse(best); }
    // --- custom updates & animations ---
    for (const fn of this._updates) { try { fn(dt, t); } catch (e) { console.error(e); this._updates.delete(fn); } }
    for (const o of this._tickers) o.userData.tick(dt, t);
    // --- beacon ---
    if (this._goal && this._goal.target) { this._pos(this._goal.target, tmp); this._beacon.position.set(tmp.x, 0, tmp.z); this._beacon.visible = true; this._beaconRing.scale.setScalar(1 + (t % 1) * 1.2); this._beaconRing.material.opacity = 0.8 * (1 - (t % 1)); this._beacon.children[0].material.opacity = 0.2 + Math.sin(t * 4) * 0.08; }
    // the ground plane follows the player (so every zone has ground, and triangles stay small)
    if (this.groundMesh) { const F = this._riding ? this._riding.position : P; this.groundMesh.position.x = Math.round(F.x / 48) * 48; this.groundMesh.position.z = Math.round(F.z / 48) * 48; }
    // --- camera ---
    this._updateCamera(dt, input);
    // scenery tiles that are completely beyond the fog are switched off (checked a few times a second)
    this._tileT -= dt; if (this._tileT <= 0) { this._tileT = 0.3; const far = this.scene.fog ? this.scene.fog.far + 6 : 75, cp = this.camera.position, c = this._tmpT || (this._tmpT = new THREE.Vector3());
      for (const m of this._tiles) { if (!m.parent) continue; const bs = m.geometry.boundingSphere || (m.geometry.computeBoundingSphere(), m.geometry.boundingSphere); c.copy(bs.center); m.localToWorld(c); const show = c.distanceTo(cp) - bs.radius < far; if (show !== m.userData.tileOn) { m.userData.tileOn = show; m.visible = show; } } }
    // --- DOM overlays ---
    this.ui.updateWorld(this, dt, best, best && best.hold ? this._holdT / best.hold : 0);
  }
  /** is the point inside a solid collider (with the player's radius)? */
  _blocked(x, z) { const r = this.playerRadius * 0.9; for (const c of this._colliders) { if (c.type === 'c') { if (Math.hypot(x - c.x, z - c.z) < c.r + r) return true; } else if (x > c.x1 - r && x < c.x2 + r && z > c.z1 - r && z < c.z2 + r) return true; } return false; }
  _collide(P) {
    const r = this.playerRadius;
    for (let pass = 0; pass < 2; pass++) for (const c of this._colliders) {
      if (c.obj) { if (!c.obj.parent || !c.obj.visible) continue; c.obj.getWorldPosition(this._tmpO || (this._tmpO = new THREE.Vector3())); c.x = this._tmpO.x; c.z = this._tmpO.z; }
      if (c.type === 'c') { const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m) { if (d < 1e-4) { P.x += m; } else { P.x = c.x + dx / d * m; P.z = c.z + dz / d * m; } } }
      else { const x1 = c.x1 - r, x2 = c.x2 + r, z1 = c.z1 - r, z2 = c.z2 + r; if (P.x > x1 && P.x < x2 && P.z > z1 && P.z < z2) { const dl = P.x - x1, dr = x2 - P.x, dt_ = P.z - z1, db = z2 - P.z, m = Math.min(dl, dr, dt_, db); if (m === dl) P.x = x1; else if (m === dr) P.x = x2; else if (m === dt_) P.z = z1; else P.z = z2; } }
    }
    if (this._bounds) { const b = this._bounds; P.x = clamp(P.x, b.x1, b.x2); P.z = clamp(P.z, b.z1, b.z2); }
  }
  _updateCamera(dt, input) {
    const cam = this.cam, P = this._riding ? this._riding.position : this.player.position;
    if (input) { cam.yaw -= input.dragX * 0.006; cam.pitch = clamp(cam.pitch + input.dragY * 0.004, 0.12, 1.35); cam.dist = clamp(cam.dist * (1 + input.wheel * 0.001), cam.minDist, cam.maxDist); }
    let look = this._tmpL || (this._tmpL = new THREE.Vector3()), dist = cam.dist + (this._riding ? 5 : 0), pitch = cam.pitch, yaw = cam.yaw;
    look.set(P.x, cam.height + (this._riding ? 0.8 : 0), P.z);
    if (!cam.target) { const a = this.game.aspect; if (a < 1) look.y += Math.min(1, (1 / a - 1) / 1.1) * 1.2; if (this.game.height < 480) dist *= 0.86; }
    if (cam.target) { const tp = this._pos(cam.target.at, new THREE.Vector3()); look.copy(tp); if (!cam.target.at.isObject3D && cam.target.at.length === 2) look.y = 1; dist = cam.target.dist ?? dist; pitch = cam.target.pitch ?? pitch; yaw = cam.target.yaw ?? yaw; }
    const want = this._tmpC || (this._tmpC = new THREE.Vector3());
    want.set(look.x + Math.sin(yaw) * Math.cos(pitch) * dist, look.y + Math.sin(pitch) * dist, look.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    if (this._snapCam) { cam._pos.copy(want); cam._look.copy(look); this._snapCam = false; }
    const k = cam.target ? 3 : 7; cam._pos.x = damp(cam._pos.x, want.x, k, dt); cam._pos.y = damp(cam._pos.y, want.y, k, dt); cam._pos.z = damp(cam._pos.z, want.z, k, dt);
    cam._look.x = damp(cam._look.x, look.x, k + 2, dt); cam._look.y = damp(cam._look.y, look.y, k + 2, dt); cam._look.z = damp(cam._look.z, look.z, k + 2, dt);
    this.camera.position.copy(cam._pos); if (cam.shake > 0) { this.camera.position.x += (Math.random() - 0.5) * cam.shake; this.camera.position.y += (Math.random() - 0.5) * cam.shake; cam.shake = Math.max(0, cam.shake - dt * 1.5); }
    this.camera.lookAt(cam._look);
    if (this.sun.castShadow) { this.sun.target.position.set(P.x, 0, P.z); this.sun.position.set(P.x + this.sunDir.x * 2, this.sunDir.y * 2, P.z + this.sunDir.z * 2); }
  }
  /** start the camera high above and swoop down to the player (used at adventure start). */
  swoop() { const c = this.cam; this._updateCamera(0, null); c._pos.set(this.player.position.x, 38, this.player.position.z + 30); c._look.copy(this.player.position); }

  dispose() {
    this.disposed = true; this.ui.leaveWorld(this);
    for (const it of this._interacts.slice()) it.el.remove(); for (const d of this._dom) d.el.remove();
    if (this.scene.background && this.scene.background.isTexture) this.scene.background.dispose();
    kit.dispose(this.scene); this._tweens.length = 0; this._timers.length = 0; this._updates.clear(); this._tickers.clear();
  }
}
