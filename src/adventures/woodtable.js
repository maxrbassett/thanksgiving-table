// The Wooden Table — forest → log landing → sawmill & kiln → furniture workshop → delivery → dining room.
// Same pattern as potatoes.js: every zone is built up-front (static scenery baked), then the story is one async function.
import { THREE, C, box, cyl, sphere, ball, cone, group, mat, glow, sign, emojiSprite, seeded, plane, disc, torus, picture, bake, canvasTex, grain, lowDetail, person } from '../core/kit.js';
import * as P from '../core/props.js';
import { craneGame, sandGame } from './woodtable-games.js';

const PI = Math.PI;
const W = { bark: 0x6b4a2f, heart: 0xe3c48e, wet: 0xcf9f5c, dry: 0xefdcae, rough: 0xc0935a, planed: 0xf2dba6, sanded: 0xf8e6ba, finished: 0xb8752f };

// ---------- small builders ----------
/** a log lying along X */
// round things: a few more sides on the objects the story is about (fewer on computers without a graphics card)
const SEG = (n) => lowDetail() ? Math.max(6, Math.round(n * 0.6)) : n;
const shared = (o) => { o.userData.shared = true; return o; };
const tex = (w, h, draw, rx = 1, ry = 1) => { const t = canvasTex(w, h, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return shared(t); };
const _mats = {}; const M = (k, make) => _mats[k] || (_mats[k] = shared(make()));
/** oak bark: dark and pale streaks running up the trunk */
const barkMat = () => M('bark', () => new THREE.MeshLambertMaterial({ map: tex(64, 128, (g, w, h) => { g.fillStyle = '#76553a'; g.fillRect(0, 0, w, h); const r = seeded(5);
  for (let i = 0; i < 110; i++) { const x = r() * w, y = r() * h, l = 14 + r() * 44, t = 1.5 + r() * 3; g.fillStyle = r() < 0.6 ? 'rgba(42,26,13,.42)' : 'rgba(176,138,98,.3)'; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) g.fillRect(x + ox, y + oy, t, l); } }, 3, 1) }));
/** the cut end of a log: pale wood, yearly rings, a dark heart and a rim of bark */
const ringMat = () => M('ring', () => new THREE.MeshLambertMaterial({ map: tex(128, 128, (g, w) => { const c = w / 2; g.fillStyle = '#6b4a2f'; g.fillRect(0, 0, w, w); g.fillStyle = '#e2c28c'; g.beginPath(); g.arc(c, c, c * 0.9, 0, 7); g.fill(); g.fillStyle = '#cfa56c'; g.beginPath(); g.arc(c, c, c * 0.42, 0, 7); g.fill();
  g.strokeStyle = 'rgba(120,78,40,.55)'; for (let i = 1; i <= 9; i++) { g.lineWidth = i % 3 ? 1.2 : 2.2; g.beginPath(); g.arc(c + Math.sin(i * 1.7) * 1.5, c, c * 0.9 * i / 9.6, 0, 7); g.stroke(); }
  g.strokeStyle = 'rgba(90,58,30,.6)'; g.lineWidth = 1.5; for (const a of [0.4, 2.3, 4.4]) { g.beginPath(); g.moveTo(c + Math.cos(a) * 4, c + Math.sin(a) * 4); g.lineTo(c + Math.cos(a) * c * 0.5, c + Math.sin(a) * c * 0.5); g.stroke(); } }) }));
/** floorboards running along u (8 boards across one tile), light grey so it multiplies the floor colour */
const planks = (rx, ry) => { const t = M('plankTex', () => tex(256, 256, (g, w, h) => { const r = seeded(3); for (let i = 0; i < 8; i++) { const y = i * 32, off = r() * w; for (const [x0, x1] of [[0, off], [off, w]]) { const v = 226 + Math.floor(r() * 24); g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x0, y, x1 - x0, 32); }
    g.fillStyle = 'rgba(60,35,15,.55)'; g.fillRect(0, y, w, 1.5); g.fillRect(off, y, 1.5, 32); for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(70,40,15,' + (0.06 + r() * 0.1) + ')'; g.fillRect(r() * w, y + 4 + r() * 24, 30 + r() * 90, 1); } } })).clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; };
/** wood grain running along u; it multiplies the colour of the part (rough, planed, sanded, oiled) */
const grainMat = (color) => new THREE.MeshLambertMaterial({ color, vertexColors: true, map: M('grainTex', () => tex(256, 64, (g, w, h) => { g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h); const r = seeded(8);
  for (let i = 0; i < 46; i++) { const y = r() * h, a = 0.05 + r() * 0.13; g.strokeStyle = r() < 0.75 ? 'rgba(90,50,15,' + a + ')' : 'rgba(255,255,255,' + (a + 0.1) + ')'; g.lineWidth = 0.6 + r() * 1.6; g.beginPath(); g.moveTo(0, y); const k = r() * 3, p = r() * 6; for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / w * 6.283 * Math.round(1 + k) + p) * (1 + r() * 0.5)); g.stroke(); }
  for (const [x, y] of [[60, 20], [190, 44]]) { g.strokeStyle = 'rgba(90,50,15,.22)'; for (let k = 1; k <= 3; k++) { g.beginPath(); g.ellipse(x, y, k * 5, k * 2, 0, 0, 7); g.stroke(); } } })) });
/** a lathe-turned shape with ordinary (one-sided, bakeable) material: pts = [[radius, y], ...] from the bottom up */
const turn = (pts, color, pos, seg = 10) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), color && color.isMaterial ? color : mat(color)); m.castShadow = true; if (pos) m.position.set(pos[0], pos[1], pos[2]); return m; };
/** a log lying along X. hero = true: real bark and ringed ends (3 draws); otherwise bark + plain ends that bake into the scenery */
const makeLog = (len, r, hero = false, wood = null) => { const g = new THREE.Group(), s = SEG(14);
  if (hero === 'plain') return group([cyl(r * 0.95, r * 1.04, len, W.bark, [0, 0, 0], [0, 0, PI / 2], s), cyl(r * 0.84, r * 0.9, len + 0.02, W.heart, [0, 0, 0], [0, 0, PI / 2], s), cyl(r * 0.4, r * 0.42, len + 0.04, 0xcfa872, [0, 0, 0], [0, 0, PI / 2], 7)]);
  if (hero) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 1.04, len, s), [wood ? mat(wood) : barkMat(), ringMat(), ringMat()]); m.rotation.z = PI / 2; m.castShadow = true; g.add(m); return g; }
  const b = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 1.04, len, s, 1, true), barkMat()); b.rotation.z = PI / 2; b.castShadow = true; g.add(b);
  g.add(bake(group([cyl(r * 0.93, r * 1.02, len - 0.01, W.bark, [0, 0, 0], [0, 0, PI / 2], s), cyl(r * 0.84, r * 0.9, len + 0.02, W.heart, [0, 0, 0], [0, 0, PI / 2], s), cyl(r * 0.4, r * 0.42, len + 0.04, 0xcfa872, [0, 0, 0], [0, 0, PI / 2], 7)]))); return g; };
/** bake a group of WHITE-ish parts into one mesh whose colour can be changed later (1 draw) */
/** fuse a group of WHITE-ish parts into one wood-grained mesh whose colour can be changed later (1 draw). A part with userData.upright has its grain running up. */
const tintable = (g, color) => { g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), P = [], N = [], U = [], Cc = [];
  for (const o of g.children.slice()) { if (!o.isMesh) continue; const q = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); q.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); const c = o.material.color, uv = q.attributes.uv, n = q.attributes.position.count;
    if (o.userData.flat) q.computeVertexNormals(); const [su, sv, ou, ov] = o.userData.uv || [1, 1, 0, 0];
    P.push(...q.attributes.position.array); N.push(...q.attributes.normal.array); for (let i = 0; i < n; i++) { const a = o.userData.upright ? uv.getY(i) : uv.getX(i), b = o.userData.upright ? uv.getX(i) : uv.getY(i); U.push(a * su + ou, b * sv + ov); Cc.push(c.r, c.g, c.b); } g.remove(o); o.geometry.dispose(); q.dispose(); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  const m = new THREE.Mesh(geo, grainMat(color)); m.castShadow = true; m.receiveShadow = true; m.userData.noBake = true; g.add(m); g.userData.tint = m.material; return g; };
const stump = (r = 0.6, h = 0.5) => { const s = SEG(12), g = group([turn([[r * 1.42, 0], [r * 1.2, h * 0.28], [r * 1.04, h * 0.7], [r, h]], W.bark, null, s), cyl(r, r, 0.02, W.bark, [0, h - 0.012, 0], null, s), cyl(r * 0.88, r * 0.88, 0.03, W.heart, [0, h, 0], null, s)]);
  for (const a of [0.5, 2.4, 4.3]) g.add(ball(r * 0.62, h * 0.26, r * 0.26, W.bark, [Math.cos(a) * r * 1.25, h * 0.1, Math.sin(a) * r * 1.25], [0, -a, 0], 6)); return g; };
const LEAF = [0x4c7d3e, 0x5a8a40, 0x437337, 0x6a9445, 0x55863c, 0xb08c3a, 0x789a48];
/** the marked oak: a real trunk (bark, widening to the roots), heavy limbs and a broad crown */
const bigOak = () => {
  const g = new THREE.Group(), rest = new THREE.Group();
  g.add(turn([[0.6, 0], [0.54, 0.45], [0.5, 1.4], [0.46, 3.2], [0.4, 4.8], [0.3, 5.7]], barkMat(), null, SEG(12)));
  for (const [x, y, z, len, r, rx, rz] of [[0.85, 4.7, 0, 2.5, 0.17, 0, -0.95], [-0.75, 5.0, 0.2, 2.3, 0.15, 0.2, 0.85], [0.1, 5.3, -0.8, 2.2, 0.14, -0.8, 0.1], [0.1, 5.6, 0.7, 2.0, 0.13, 0.75, -0.1], [0, 6.3, 0, 1.8, 0.16, 0, 0.05]]) rest.add(cyl(r * 0.6, r, len, 0x6b4c33, [x, y, z], [rx, 0, rz], 6));
  rest.add(cyl(0.535, 0.545, 0.28, 0xe8731f, [0, 1.25, 0], null, SEG(12))); // the forester's paint mark
  for (const [x, y, z, r, c] of [[0, 7.3, 0, 2.2, 0], [1.9, 6.2, 0.3, 1.5, 1], [-1.8, 6.4, -0.3, 1.6, 4], [0.3, 6.1, 1.6, 1.4, 3], [-0.2, 8.6, -0.4, 1.35, 1], [0.4, 6.3, -1.7, 1.35, 2], [1.2, 7.7, -0.9, 1.2, 3], [-1.1, 7.6, 0.9, 1.25, 0], [0, 5.4, 0, 1.5, 2]]) rest.add(ball(r, r * 0.78, r, LEAF[c], [x, y, z], [0, x * 2, 0], 9));
  g.add(bake(rest)); return g;
};
/** forest trees: near ones with a fuller crown, far ones as cheap as possible */
const forestTree = (h, pine, color, near) => { const g = new THREE.Group(), dark = new THREE.Color(color).multiplyScalar(0.86).getHex();
  if (pine) { g.add(cyl(h * 0.02, h * 0.05, h * 0.5, 0x5d4430, [0, h * 0.25, 0], null, 5)); const n = near ? 4 : 2; for (let i = 0; i < n; i++) g.add(cone(h * (0.27 - i * (near ? 0.055 : 0.1)), h * (near ? 0.3 : 0.5), i % 2 ? 0x35663c : 0x2f5c38, [0, h * (near ? 0.36 + i * 0.17 : 0.45 + i * 0.3), 0], null, near ? 7 : 6)); return g; }
  g.add(cyl(h * 0.035, h * 0.06, h * 0.56, W.bark, [0, h * 0.28, 0], null, near ? 6 : 5));
  g.add(ball(h * 0.3, h * 0.25, h * 0.3, color, [0, h * 0.7, 0], null, near ? 8 : 6));
  if (near) { g.add(ball(h * 0.2, h * 0.17, h * 0.2, dark, [h * 0.2, h * 0.58, h * 0.06], null, 6)); g.add(ball(h * 0.19, h * 0.16, h * 0.19, color, [-h * 0.17, h * 0.62, -h * 0.1], null, 6)); }
  return g; };
const shrub = (s, color) => group([ball(0.5 * s, 0.36 * s, 0.5 * s, color, [0, 0.3 * s, 0], null, 6), ball(0.34 * s, 0.26 * s, 0.34 * s, color, [0.4 * s, 0.22 * s, 0.1 * s], null, 6)]);
/** a square leg that tapers toward the floor (+y is the end that meets the table top) */
const legBlank = (c = 0xffffff) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(TB.leg * 0.7071, TB.leg * 0.46, TB.h - TB.t, 4, 1), mat(c)); m.rotation.y = PI / 4; m.userData.upright = true; m.userData.flat = true; return m; };
/** table parts (upright table, origin on the floor at its centre): top 3.0 x 1.5, 0.8 high */
const TB = { w: 3.0, d: 1.5, h: 0.8, t: 0.09, leg: 0.14, lx: 1.3, lz: 0.56 };
const makeLeg = () => group([legBlank(), box(TB.leg * 0.45, 0.1, 0.1, 0xdddddd, [0, (TB.h - TB.t) / 2 - 0.09, -TB.leg / 2 - 0.04]), box(0.1, 0.1, TB.leg * 0.45, 0xdddddd, [-TB.leg / 2 - 0.04, (TB.h - TB.t) / 2 - 0.09, 0])]);
const makeApron = () => group([box(TB.lx * 2, 0.13, 0.05, 0xf4f4f4, [0, 0, TB.lz]), box(TB.lx * 2, 0.13, 0.05, 0xf4f4f4, [0, 0, -TB.lz]), box(0.05, 0.13, TB.lz * 2, 0xf4f4f4, [TB.lx, 0, 0]), box(0.05, 0.13, TB.lz * 2, 0xf4f4f4, [-TB.lx, 0, 0])]);
/** a finished table as ONE mesh */
const finishedTable = (color = W.finished) => {
  const g = new THREE.Group(), top = box(TB.w, TB.t, TB.d, 0xffffff, [0, TB.h - TB.t / 2, 0]); top.userData.uv = [1, 3, 0, 0]; g.add(top);
  for (const sx of [-1, 1]) { g.add(box(0.05, 0.13, TB.lz * 2, 0xdcdcdc, [sx * TB.lx, TB.h - TB.t - 0.065, 0])); g.add(box(TB.lx * 2, 0.13, 0.05, 0xdcdcdc, [0, TB.h - TB.t - 0.065, sx * TB.lz])); for (const sz of [-1, 1]) { const l = legBlank(); l.position.set(sx * TB.lx, (TB.h - TB.t) / 2, sz * TB.lz); g.add(l); } }
  return tintable(g, color);
};
/** a dining chair: turned legs, raked back posts, rails and spindles (seat faces +z) */
const chair = (color = 0xa8672f) => { const g = new THREE.Group(), dk = new THREE.Color(color).multiplyScalar(0.86).getHex();
  g.add(box(0.46, 0.05, 0.44, color, [0, 0.46, 0])); g.add(box(0.4, 0.06, 0.035, dk, [0, 0.4, 0.19])); g.add(box(0.4, 0.06, 0.035, dk, [0, 0.4, -0.19]));
  for (const sx of [-1, 1]) { g.add(box(0.035, 0.06, 0.38, dk, [sx * 0.2, 0.4, 0])); g.add(cyl(0.026, 0.019, 0.46, color, [sx * 0.2, 0.23, 0.19], null, 6)); g.add(cyl(0.02, 0.027, 1.02, color, [sx * 0.2, 0.51, -0.215], [-0.05, 0, 0], 6)); }
  g.add(box(0.46, 0.1, 0.035, color, [0, 0.95, -0.238])); g.add(box(0.4, 0.045, 0.03, color, [0, 0.62, -0.222])); for (const x of [-0.11, 0, 0.11]) g.add(cyl(0.012, 0.012, 0.3, dk, [x, 0.79, -0.23], null, 5));
  return g; };
/** a pumpkin with ribs */
const pumpkin = (s, pos, color = 0xd9782a) => { const g = group([], pos); for (let i = 0; i < 3; i++) g.add(ball(s, s * 0.78, s * 0.66, i === 1 ? 0xcf6e24 : color, [0, s * 0.78, 0], [0, i * PI / 3, 0], 8)); g.add(cyl(s * 0.07, s * 0.11, s * 0.42, 0x6f7a3a, [s * 0.03, s * 1.66, 0], [0, 0, -0.25], 5)); return g; };
const boardStack = (n, len = 3.2, w = 1.2, color = W.dry) => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { g.add(box(len, 0.09, w, i % 2 ? color : 0xe6cf9c, [0, 0.12 + i * 0.17, 0])); for (const x of [-len * 0.36, 0, len * 0.36]) g.add(box(0.09, 0.08, w + 0.06, 0x9a7446, [x, 0.035 + i * 0.17, 0])); } return g; };

export default {
  id: 'woodtable', title: 'The Wooden Table', emoji: '🌳', music: 'farm', question: 'How does a tree become a table?',
  thanksLine: 'From an acorn to your elbows — a whole forest of helpers!',

  create(ctx) {
    const fadeTint = async (list, hex, sec = 0.8) => { const to = new THREE.Color(hex), from = list.map(g => g.userData.tint.color.clone()), k = { f: 0 }; const stop = ctx.onUpdate(() => list.forEach((g, i) => g.userData.tint.color.copy(from[i]).lerp(to, k.f))); await ctx.tween(k, { f: 1 }, sec); stop(); list.forEach(g => g.userData.tint.color.copy(to)); };
    /** a hold-E job that shows its progress in the world: tick(fraction 0..1, dt, working) */
    const holdJob = (o, tick) => new Promise(res => {
      let stop = () => {}, last = 0, sT = 0;
      const it = ctx.interact(Object.assign({ r: 2.6, y: 1.6 }, o, { onUse: () => { stop(); ctx.player.userData.forceAnim = null; tick && tick(1, 0, false); res(); } }));
      stop = ctx.onUpdate((dt) => {
        const f = ctx._active === it ? Math.min(1, (ctx._holdT || 0) / it.hold) : 0, working = f > last + 1e-5; last = f;
        ctx.player.userData.forceAnim = working ? (o.anim || 'work') : null;
        if (working && o.face) ctx.player.rotation.y = Math.atan2(o.face[0] - ctx.player.position.x, o.face[1] - ctx.player.position.z);
        if (working && o.loop) { sT -= dt; if (sT <= 0) { sT = 0.3; ctx.audio.play(o.loop); } }
        tick && tick(f, dt, working);
      });
    });
    /** only the zone the player is in is drawn: its scenery and its people (the others are switched off at each chapter change) */
    const ZS = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    const showZone = (n) => { for (const k in ZS) for (const o of ZS[k]) o.visible = +k === n; };
    /** things that move or change belong to a zone too: one group per zone, switched on and off with it (otherwise a player who turns the camera along the row of zones has them all drawn) */
    const DZ = {}; for (const k in ZS) { DZ[k] = new THREE.Group(); ctx.scene.add(DZ[k]); ZS[k].push(DZ[k]); }
    const addZ = (n, obj, x, z, ry) => { ctx.add(obj, x, z, ry); DZ[n].add(obj); return obj; };
    ctx.wtZone = showZone; // used by the test tour
    const glowStrip = () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.0), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(8, 32, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,140,50,.55)'); gr.addColorStop(1, 'rgba(255,140,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); m.position.set(12.6, 0.55, -8.3); return m; }; // warm light at the foot of the kiln doorway
    /** a big flat surface with a texture (not baked: 1 draw); turned = the texture runs along z instead of x */
    const texPlane = (w, d, color, map, pos, turned) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(turned ? d : w, turned ? w : d), new THREE.MeshLambertMaterial({ color, map })); m.rotation.x = -PI / 2; if (turned) m.rotation.z = PI / 2; m.position.set(pos[0], pos[1], pos[2]); m.receiveShadow = true; return m; };
    const useAt = (o) => new Promise(res => ctx.interact(Object.assign({}, o, { onUse: res })));
    /** real-world one-liner; a quick player never gets two within 12 s — the later one waits its turn */
    let factAt = -99;
    const fact = (icon, text) => { const d = Math.max(0, factAt + 12 - ctx.time); factAt = ctx.time + d; const fire = () => { if (ctx.ui.panelOpen) { factAt = ctx.time + 0.5; ctx.after(0.5, fire); } else ctx.fact(icon, text); }; if (d > 0) ctx.after(d, fire); else fire(); }; // (a one-liner never pops up over a mini-game: it waits for the panel to close)
    /** resolves once the latest one-liner has been on screen for sec (used before a chapter change) */
    const factSeen = (sec = 5) => ctx.until(() => ctx.time >= factAt + sec);

    // =====================================================================================
    // ZONE 1 — the oak forest: a clearing (x −11…8), the log landing (x 27…41) and the road north.
    // =====================================================================================
    ctx.env('day', { ground: 0x6fae50, fog: [55, 170] });
    ctx.tp(0, 3.8, PI);
    const ROAD = [[37.5, 5], [37.5, -14], [33, -26], [39, -37], [39, -47], [33, -58], [38, -72], [38, -92]];
    const distSeg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); };
    const distRoad = (x, z) => { let m = 1e9; for (let i = 0; i < ROAD.length - 1; i++) m = Math.min(m, distSeg(x, z, ROAD[i], ROAD[i + 1])); return m; };
    const z1 = new THREE.Group();
    for (const [r, c, x, y, z] of [[11, 0x7fb458, -1.5, 0.02, -2.5], [4.5, 0x88ba5e, 2, 0.03, -11]]) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, SEG(28)), new THREE.MeshLambertMaterial({ color: c, map: grain(r / 2.5) })); m.rotation.x = -PI / 2; m.position.set(x, y, z); m.receiveShadow = true; z1.add(m); }
    z1.add(plane(22, 2.6, 0xb08a5a, [19.5, 0.03, -2])); { const yard = new THREE.Mesh(new THREE.PlaneGeometry(14, 15), new THREE.MeshLambertMaterial({ color: 0xb08a5c, map: grain(3) })); yard.rotation.x = -PI / 2; yard.position.set(34, 0.035, -3); yard.receiveShadow = true; z1.add(yard); }
    for (let i = 0; i < ROAD.length - 1; i++) { const a = ROAD[i], b = ROAD[i + 1], dx = b[0] - a[0], dz = b[1] - a[1]; z1.add(plane(4.2, Math.hypot(dx, dz), 0x9a7850, [(a[0] + b[0]) / 2, 0.04, (a[1] + b[1]) / 2], Math.atan2(dx, dz))); z1.add(disc(2.1, 0x9a7850, [b[0], 0.04, b[1]], 10)); }
    // the forest all around
    const GREENS = LEAF;
    // the forest all around (the engine cuts this scenery into tiles and skips the ones lost in the fog)
    const part = () => z1;
    const rectDist = (x, z, x0, z0, x1, z1) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
    { const r = seeded(21); let n = 0, tries = 0; while (n < 104 && tries++ < 4000) { const x = 15 + (r() - 0.5) * 130, z = -38 + (r() - 0.5) * 120;
      if (!(z < 8 && !(z > 2 && x > -20 && x < 48) && !(x > -13.5 && x < 10.5 && z > -18.5 && z < 9) && !(x > 25.5 && x < 43 && z > -11.5 && z < 7) && !(x > 8 && x < 27 && z > -4.5 && z < 0.5) && distRoad(x, z) > 5.6 && !(Math.abs(z + 42) < 3.4))) continue; n++;
      const near = rectDist(x, z, -11.5, -16, 8.5, 7) < 11 || rectDist(x, z, 26, -11, 42.5, 6) < 9 || distRoad(x, z) < 11, t = forestTree(5 + r() * 4.5, r() < 0.3, LEAF[Math.floor(r() * LEAF.length)], near); t.position.set(x, 0, z); t.rotation.y = r() * 6.28; part(x, z).add(t); } }
    { const r = seeded(9); let n = 0, tries = 0; while (n < 30 && tries++ < 2000) { const x = 15 + (r() - 0.5) * 120, z = -35 + (r() - 0.5) * 100;
      if (!(z < 7 && !(x > -11.5 && x < 8.5 && z > -16 && z < 7) && !(x > 26 && x < 42.5 && z > -11 && z < 6) && !(x > 8 && x < 27 && z > -4 && z < 0) && distRoad(x, z) > 3.2 && !(Math.abs(z + 42) < 2.6))) continue; n++;
      const o = r() < 0.5 ? shrub(0.8 + r() * 0.7, r() < 0.3 ? 0x71863a : 0x4f7f3c) : P.rock({ s: 0.6 + r() * 0.8, ry: r() * 6 }); o.position.set(x, 0, z); part(x, z).add(o); } }
    z1.add(P.scatter(18, 19, 15, (r) => r() < 0.75 ? P.flower() : group([cyl(0.05, 0.06, 0.18, C.cream, [0, 0.09, 0], null, 6), ball(0.16, 0.1, 0.16, C.red, [0, 0.22, 0])]), { seed: 14, keep: (x, z) => { x -= 1.5; z -= 2; return Math.hypot(x - 2, z + 6) > 2.2 && Math.hypot(x + 5, z + 2) > 1.6 && !(Math.abs(x - 2) < 2.6 && z < -6); } }).translateX(-1.5).translateZ(-2));
    const inTrees = [[-10.4, -2.2, 7], [7.8, -8.6, 8], [-9.6, -10.2, 6.5], [-3, -12, 7.5], [7.9, 4.9, 6], [-10.8, 5.2, 7.5], [7.2, -12.6, 7]];
    inTrees.forEach(([x, z, h], i) => { const t = forestTree(h, i % 3 === 2, LEAF[i % 5], true); t.position.set(x, 0, z); t.rotation.y = i * 1.3; part(x, z).add(t); });
    const stumps = [[-5, -2, 0.8], [-8.0, -5.0, 0.5], [-4.6, -7.7, 0.55], [-7.6, -9.0, 0.5]];
    stumps.forEach(([x, z, r]) => { const s = stump(r, r > 0.7 ? 0.6 : 0.45); s.position.set(x, 0, z); z1.add(s); });
    const oakStump = stump(0.6, 0.5); oakStump.position.set(2, 0, -6); z1.add(oakStump);
    const sp1 = P.signpost('🌳 OAK FOREST', { h: 2.1, size: 0.7 }); sp1.position.set(-8.6, 0, 1.6); sp1.rotation.y = 0.35; z1.add(sp1);
    // landing: spare log piles, fuel drums
    for (const [x, y, z] of [[28.6, 0.36, -9.2], [28.6, 0.36, -8.45], [28.6, 1.0, -8.82]]) { const l = makeLog(3.6, 0.36, 'plain'); l.position.set(x + 1, y, z); z1.add(l); }
    for (const [x, z] of [[28.3, 1.6], [29.1, 2.3]]) { const b = P.barrel({ color: 0x9c4034 }); b.position.set(x, 0, z); z1.add(b); }
    for (const x of [36.4, 38.6]) z1.add(plane(0.5, 15, 0x8f6f48, [x, 0.045, -3.5])); z1.add(P.scatter(30, 12, 13, (r) => box(0.25 + r() * 0.3, 0.05, 0.12, r() < 0.5 ? W.bark : 0xe3c48e, [0, 0.06, 0]), { seed: 4, keep: (x, z) => Math.hypot(x, z + 3) > 2.2 }).translateX(32).translateZ(-3));
    { const st = stump(0.55, 0.4); st.position.set(28.4, 0, -3.6); z1.add(st); const ax = group([box(0.07, 0.9, 0.07, C.woodLight, [0, 0.45, 0]), box(0.3, 0.2, 0.06, C.steel, [0.12, 0.85, 0])], [28.4, 0.38, -3.6], [0, 0.4, 0.5]); z1.add(ax); }
    const sp2 = P.signpost('🏭 SAWMILL ⬆', { h: 2.8, size: 0.8 }); sp2.position.set(40.6, 0, -11.5); z1.add(sp2);
    // the stream and its bridge
    z1.add(plane(130, 5.4, 0x8a7a58, [15, 0.025, -42])); z1.add(box(5, 0.3, 5.6, C.wood, [39, 0.16, -42]));
    for (const sx of [-1, 1]) { z1.add(box(0.14, 0.14, 5.6, C.woodDark, [39 + sx * 2.4, 1.0, -42])); for (const z of [-44.6, -42, -39.4]) z1.add(box(0.16, 1.0, 0.16, C.woodDark, [39 + sx * 2.4, 0.5, z])); }
    const FUR = 0xa9744a, deer = group([ball(0.26, 0.29, 0.58, FUR, [0, 0.98, 0]), ball(0.24, 0.28, 0.3, FUR, [0, 1.02, 0.36]), ball(0.19, 0.12, 0.44, 0xd6b48a, [0, 0.8, 0]), cyl(0.085, 0.14, 0.56, FUR, [0, 1.36, 0.56], [0.5, 0, 0], 7), ball(0.1, 0.11, 0.16, FUR, [0, 1.64, 0.72], [0.25, 0, 0]), ball(0.06, 0.06, 0.11, 0xc49a6e, [0, 1.59, 0.86], [0.25, 0, 0]), sphere(0.028, 0x222222, [0, 1.58, 0.96], 5), ball(0.09, 0.1, 0.07, C.white, [0, 1.08, -0.58])]);
    for (const sx of [-1, 1]) { deer.add(sphere(0.02, 0x1a1a1a, [sx * 0.085, 1.67, 0.78], 4)); deer.add(ball(0.04, 0.1, 0.025, FUR, [sx * 0.12, 1.77, 0.64], [0, 0, -sx * 0.55], 5)); for (const z of [-0.4, 0.4]) { deer.add(cyl(0.075, 0.045, 0.46, FUR, [sx * 0.14, 0.7, z], [z > 0 ? 0.06 : -0.1, 0, 0], 6)); deer.add(cyl(0.035, 0.03, 0.5, 0x94643d, [sx * 0.14, 0.27, z + (z > 0 ? -0.015 : 0.02)], null, 5)); deer.add(cyl(0.034, 0.04, 0.07, 0x3a2a1a, [sx * 0.14, 0.035, z + (z > 0 ? -0.015 : 0.02)], null, 5)); } }
    deer.position.set(33.6, 0, -33); deer.rotation.y = 1.9; z1.add(deer);
    for (let i = 0; i < 3; i++) { const m = P.mountain({ h: 30 + i * 9 }); m.position.set(-30 + i * 52, 0, -150); z1.add(m); }
    ctx.addStatic(z1); ZS[1].push(z1);
    addZ(1, P.water(130, 3.6), 15, -42);
    inTrees.forEach(([x, z, h]) => ctx.collideCircle(x, z, 0.5)); stumps.forEach(([x, z, r]) => ctx.collideCircle(x, z, r)); ctx.collideCircle(-8.6, 1.6, 0.3);
    // ring picture on the old stump
    addZ(1, picture(1.36, 1.36, (g, w, h) => { g.translate(w / 2, h / 2); g.fillStyle = '#e3c48e'; g.beginPath(); g.arc(0, 0, w * 0.49, 0, 7); g.fill(); g.strokeStyle = 'rgba(122,78,40,.8)'; for (let i = 1; i <= 8; i++) { g.lineWidth = w * 0.018; g.beginPath(); g.arc(w * 0.01 * Math.sin(i), 0, w * 0.49 * i / 8.3, 0, 7); g.stroke(); } }, 128, [0, 0.625, 0], [-PI / 2, 0, 0]), -5, -2);
    const oak = bigOak(); oak.position.set(2, 0.5, -6); addZ(1, oak); const oakCol = ctx.collideCircle(2, -6, 0.7);
    const saw = bake(group([box(2.7, 0.15, 0.02, C.metal, [0, 0.02, 0]), ...Array.from({ length: 19 }, (_, i) => box(0.085, 0.085, 0.02, C.metal, [-1.26 + i * 0.14, -0.055, 0], [0, 0, PI / 4])), cyl(0.035, 0.04, 0.5, C.woodDark, [1.38, 0.14, 0], null, 6), cyl(0.035, 0.04, 0.5, C.woodDark, [-1.38, 0.14, 0], null, 6)])); saw.position.set(2, 0.78, -6); addZ(1, saw);
    const forester = ctx.person({ hat: 'cap', hatColor: 0x2f6d3a, vest: 0xff8a1f, shirt: 0x6f8f4a, pants: 0x5a4a32, skin: C.skin[3], beard: C.hair[1], hair: C.hair[1], expressive: true }, -2.8, 0.6, 0.5);
    const logger = ctx.person({ hat: 'hardhat', shirt: 0xc23b22, pants: 0x3b5b8c, skin: C.skin[1], hair: C.hair[6], hairStyle: 'pony', expressive: true }, 0.1, -6, PI / 2);
    const seedCrate = group([P.crate({ color: 0x8a5a2b })], [-4.6, 0, 0.4]); for (let i = 0; i < 4; i++) { seedCrate.add(cyl(0.02, 0.02, 0.3, W.bark, [(i % 2 - 0.5) * 0.3, 0.55, (i > 1 ? 0.15 : -0.15)], null, 4)); seedCrate.add(sphere(0.12, 0x5aa845, [(i % 2 - 0.5) * 0.3, 0.75, (i > 1 ? 0.15 : -0.15)], 5)); } bake(seedCrate); seedCrate.scale.setScalar(0.66); addZ(1, seedCrate); // small enough to sit between the two straight arms
    const squirrel = bake(group([ball(0.13, 0.16, 0.18, 0xb5652a, [0, 0.17, 0]), sphere(0.1, 0xb5652a, [0, 0.36, 0.12], 6), ball(0.09, 0.22, 0.1, 0xd98a3a, [0, 0.32, -0.2], [-0.5, 0, 0]), cone(0.03, 0.08, 0xb5652a, [0.05, 0.47, 0.1], null, 4), cone(0.03, 0.08, 0xb5652a, [-0.05, 0.47, 0.1], null, 4), sphere(0.022, 0x111111, [0.05, 0.38, 0.2], 4), sphere(0.022, 0x111111, [-0.05, 0.38, 0.2], 4)])); squirrel.position.set(-5, 0.62, -2); squirrel.rotation.y = 0.6; addZ(1, squirrel);
    const birds = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = group([box(0.5, 0.04, 0.16, 0x333333, [0.24, 0, 0], [0, 0, 0.35]), box(0.5, 0.04, 0.16, 0x333333, [-0.24, 0, 0], [0, 0, -0.35])], [Math.cos(i * 2.1) * 1.6, i * 0.4, Math.sin(i * 2.1) * 1.6]); birds.add(b); } bake(birds); birds.position.set(0, 12, -14); addZ(1, birds);
    ctx.onUpdate((dt, t) => { birds.position.set(2 + Math.cos(t * 0.35) * 12, 12 + Math.sin(t * 0.8), -16 + Math.sin(t * 0.35) * 7); birds.rotation.y = -t * 0.35; });
    // --- landing machines ---
    const LX = 34, LZ = -6;
    const pile = []; for (const [x, y] of [[-0.4, 0.36], [0.4, 0.36]]) { const l = makeLog(3.6, 0.36, true); l.rotation.y = PI / 2; l.position.set(LX - 3.5 + x, y, LZ); l.visible = false; addZ(1, l); pile.push(l); }
    const YEL = 0xdba21c, DK = 0x2e2e2e;
    const crane = new THREE.Group(); crane.add(bake(group([box(1.5, 0.36, 1.9, 0x3a3a3a, [0, 0.38, 0]), cyl(0.62, 0.72, 0.28, 0x4a4a4a, [0, 0.7, 0], null, SEG(14)),
      ...[-1, 1].flatMap(sx => [box(0.5, 0.36, 2.5, DK, [sx * 0.95, 0.3, 0]), box(0.5, 0.08, 2.5, 0x3c3c3c, [sx * 0.95, 0.52, 0]), ...[-1.25, 1.25].flatMap(z => [cyl(0.3, 0.3, 0.5, DK, [sx * 0.95, 0.3, z], [0, 0, PI / 2], SEG(12)), cyl(0.17, 0.17, 0.56, 0x77797c, [sx * 0.95, 0.3, z], [0, 0, PI / 2], 8)]), ...[-0.75, -0.25, 0.25, 0.75].map(z => cyl(0.12, 0.12, 0.56, 0x5a5c5e, [sx * 0.95, 0.17, z], [0, 0, PI / 2], 6))])])));
    const turret = new THREE.Group(); turret.position.y = 0.85; turret.userData.dynamic = true; crane.add(turret);
    const tBody = bake(group([box(2.1, 0.16, 2.0, 0x3a3a3a, [-0.35, 0.08, 0]),
      box(1.05, 0.85, 1.8, YEL, [-0.95, 0.58, 0]), box(0.32, 0.75, 1.9, 0x3a3a3a, [-1.6, 0.53, 0]), ...[0, 1, 2].map(i => box(0.7, 0.05, 0.02, DK, [-0.95, 0.45 + i * 0.15, 0.91])), cyl(0.05, 0.05, 0.75, 0x4a4a4a, [-1.15, 1.36, -0.6], null, 6), cyl(0.07, 0.07, 0.12, DK, [-1.15, 1.76, -0.6], null, 6),
      box(1.0, 0.62, 1.0, YEL, [0.12, 0.47, 0.45]), box(0.9, 0.82, 0.9, 0x86a9b8, [0.12, 1.19, 0.45]), ...[-1, 1].flatMap(sx => [-1, 1].map(sz => box(0.07, 0.84, 0.07, DK, [0.12 + sx * 0.465, 1.19, 0.45 + sz * 0.465]))), box(1.08, 0.08, 1.08, DK, [0.12, 1.64, 0.45]), box(1.0, 0.06, 1.0, YEL, [0.12, 0.8, 0.45]), sphere(0.07, glow(0xfff2a8), [0.55, 1.72, 0.85], 5),
      box(0.3, 3.9, 0.3, 0x3a3a3a, [0.3, 2.15, -0.3]), box(4.4, 0.26, 0.26, YEL, [1.6, 3.4, -0.3]), box(0.5, 0.36, 0.34, 0x3a3a3a, [0.3, 3.4, -0.3]),
      cyl(0.2, 0.2, 0.1, DK, [3.62, 3.36, -0.3], [PI / 2, 0, 0], SEG(12)), box(3.36, 0.05, 0.05, DK, [1.95, 3.83, -0.3], [0, 0, -0.165]), box(1.04, 0.05, 0.05, DK, [-0.125, 3.8, -0.3], [0, 0, 0.615]),
      cyl(0.09, 0.09, 1.7, DK, [1.137, 1.039, -0.3], [0, 0, -0.162], 8), cyl(0.05, 0.05, 1.42, C.metal, [1.386, 2.569, -0.3], [0, 0, -0.162], 6)])); turret.add(tBody);
    const cable = cyl(0.03, 0.03, 1, 0x222222, [3.5, 3, -0.3], null, 5); turret.add(cable);
    const tine = (a0, z) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.045, 5, 7, 2.1), mat(DK)); m.position.set(0, -0.45, z); m.rotation.z = a0; return m; };
    const hook = bake(group([box(0.46, 0.14, 0.56, 0x3a3a3a, [0, 0, 0]), cyl(0.09, 0.09, 0.24, YEL, [0, 0.18, 0], null, 8), tine(-1.1, 0.2), tine(-1.1, -0.2), tine(PI - 1.0, 0.2), tine(PI - 1.0, -0.2)])); hook.position.set(3.5, 2.4, -0.3); turret.add(hook);
    ctx.onUpdate(() => { const top = 3.3, len = Math.max(0.05, top - hook.position.y); cable.scale.y = len; cable.position.y = top - len / 2; });
    addZ(1, crane, LX, LZ); ctx.collideBox(LX, LZ, 2.4, 3.0); ctx.collideCircle(LX - 3.5, LZ, 1.5); ctx.collideBox(29.6, -8.8, 3.8, 1.8); ctx.collideCircle(28.4, -3.6, 0.6); ctx.collideCircle(28.7, 1.95, 0.9);
    const lever1 = group([box(0.5, 1.0, 0.4, 0x555555, [0, 0.5, 0]), box(0.52, 0.3, 0.42, C.yellow, [0, 0.8, 0])], [LX - 1.5, 0, -2.2]); bake(lever1); const stick1 = group([cyl(0.04, 0.04, 0.6, 0x333333, [0, 0.3, 0]), sphere(0.11, C.red, [0, 0.62, 0])], [0, 1.0, 0], [0, 0, 0.5]); bake(stick1); lever1.add(stick1); addZ(1, lever1); ctx.collideCircle(LX - 1.5, -2.2, 0.4);
    const truck1 = addZ(1, P.truck({ kind: 'flatbed', color: 0x2f8f6f }), 37.5, -7, PI); const truck1Col = ctx.collideBox(37.5, -7, 2.6, 6.8);

    // =====================================================================================
    // ZONE 2 — the sawmill (x≈100). A line along z=−6: log deck → debarker → carriage and blade. Kiln on the right.
    // =====================================================================================
    const X2 = 100, z2 = new THREE.Group();
    z2.add(texPlane(38, 23, 0xb9ae98, grain(5), [0, 0.03, -3.5]));
    z2.add(box(38, 7.5, 0.4, 0xc7a56d, [0, 3.75, -15])); z2.add(box(0.4, 7.5, 23, 0xbb9a62, [-19, 3.75, -3.5])); z2.add(box(0.4, 7.5, 23, 0xbb9a62, [19, 3.75, -3.5]));
    for (let x = -17; x <= 17; x += 2) z2.add(box(0.08, 7.5, 0.06, 0xa8874f, [x, 3.75, -14.77]));
    z2.add(box(38, 0.5, 0.5, 0x7a3b2a, [0, 7.0, -14.8])); z2.add(box(38, 0.3, 0.46, 0x7a3b2a, [0, 0.15, -14.8]));
    for (const x of [-5.5, 1, 7]) { z2.add(box(2.6, 1.8, 0.1, C.white, [x, 4.6, -14.76])); z2.add(box(2.3, 1.5, 0.12, 0xa9dcf2, [x, 4.6, -14.75])); z2.add(box(0.08, 1.5, 0.14, C.white, [x, 4.6, -14.74])); }
    z2.add(sign('🌲 SAWMILL', 1.3, { border: '#7a3b2a' }, [-12.6, 3.3, -14.7]));
    // painted floor: safety line, walkway to the kiln, hazard box by the blade
    z2.add(plane(27, 0.22, C.yellow, [-3.7, 0.04, -4.35])); z2.add(plane(3.4, 0.22, C.yellow, [0.5, 0.04, -3.2])); for (const x of [-1.1, 2.1]) z2.add(plane(0.22, 1.2, C.yellow, [x, 0.04, -3.75]));
    for (let i = 0; i < 7; i++) z2.add(plane(0.9, 0.5, 0x6fae8a, [-6 + i * 2.6, 0.04, 1.2]));
    for (const [x, z, n, ry] of [[-3.5, 4.9, 4, 0.1], [1.2, 5.3, 6, -0.05], [15.6, 4.6, 3, 1.5]]) { const st = boardStack(n, 3.0, 1.1, 0xe8cd92); st.position.set(x, 0, z); st.rotation.y = ry; z2.add(st); }
    for (const [x, z, r] of [[-7.5, 4.6, 0.8], [-6.6, 5.2, 0.5], [9.6, 1.6, 0.45]]) z2.add(cone(r, r * 0.7, 0xe6c98a, [x, r * 0.35, z], null, 8));
    // infeed: log deck + rollers
    z2.add(P.conveyor(7, { h: 0.72, w: 1.0 }).translateX(-13.4).translateZ(-6));
    for (const [x, y, z] of [[-14, 0.4, -9.2], [-14, 0.4, -10.05], [-14, 1.08, -9.62], [-14, 0.4, -10.9]]) { const l = makeLog(3.6, 0.4); l.position.set(x, y, z); z2.add(l); }
    z2.add(box(4.4, 0.14, 0.14, C.steel, [-14, 0.07, -8.6])); z2.add(box(0.14, 0.6, 0.14, C.steel, [-16.1, 0.3, -8.6])); z2.add(box(0.14, 0.6, 0.14, C.steel, [-11.9, 0.3, -8.6]));
    // debarker housing
    { const DB = 0xb9622c; // ring debarker: a steel frame, the shroud round the spinning ring, its motor and belt guard, and the bark that falls out
      for (const z of [-7.1, -4.9]) { z2.add(box(0.8, 2.45, 0.28, DB, [-9.2, 1.225, z])); z2.add(box(1.1, 0.12, 0.5, 0x4a4a4a, [-9.2, 0.06, z])); }
      z2.add(box(0.8, 0.32, 2.5, DB, [-9.2, 2.5, -6])); z2.add(box(1.0, 0.3, 2.4, 0x4a4a4a, [-9.2, 0.15, -6]));
      for (const x of [-9.58, -8.82]) z2.add(torus(0.8, 0.13, 0x55595e, [x, 1.2, -6], [0, PI / 2, 0], 16));
      z2.add(cyl(0.26, 0.26, 0.7, 0x3b6ea0, [-9.2, 2.95, -6.3], [PI / 2, 0, 0], 10)); z2.add(cyl(0.28, 0.28, 0.06, 0x2f5680, [-9.2, 2.95, -6.5], [PI / 2, 0, 0], 10)); z2.add(box(0.2, 0.5, 0.9, C.yellow, [-9.2, 2.85, -5.5])); z2.add(box(0.3, 0.3, 0.22, 0x3a3a3a, [-9.2, 2.78, -6.3]));
      for (let i = 0; i < 4; i++) z2.add(box(0.82, 0.06, 0.3, i % 2 ? 0x2b2b2b : C.yellow, [-9.2, 0.5 + i * 0.12, -4.9]));
      z2.add(box(0.7, 0.06, 1.3, 0x6a7078, [-9.2, 0.55, -7.45], [0.6, 0, 0])); z2.add(cone(0.85, 0.6, 0x5d4430, [-9.2, 0.3, -8.1], null, 8)); for (const [x, z] of [[-8.3, -7.9], [-10.0, -8.3], [-9.5, -7.5], [-8.7, -8.6]]) z2.add(box(0.3, 0.05, 0.12, W.bark, [x, 0.06, z], [0, x * 3, 0])); }
    // carriage rails and blade housing
    for (const z of [-6.45, -5.55]) z2.add(box(17, 0.12, 0.1, 0x555555, [0.6, 0.1, z])); for (let x = -7.5; x <= 8.8; x += 1.3) z2.add(box(0.22, 0.06, 1.3, C.woodDark, [x, 0.03, -6]));
    { const MB = 0x3b6ea0, GD = 0xd9ac2b; // head saw: base, motor with cooling fins, arbor, a yellow arched guard and the sawdust duct to the wall
      z2.add(box(1.9, 0.5, 0.5, C.steel, [0.5, 0.25, -5.0])); z2.add(box(1.3, 0.5, 1.2, 0x4a4f55, [0.5, 0.25, -7.7]));
      z2.add(cyl(0.48, 0.48, 1.0, MB, [0.5, 1.0, -7.7], [PI / 2, 0, 0], SEG(14))); for (let i = 0; i < 5; i++) z2.add(cyl(0.53, 0.53, 0.05, 0x2f5680, [0.5, 1.0, -8.05 + i * 0.17], [PI / 2, 0, 0], SEG(14))); z2.add(box(0.3, 0.24, 0.3, 0x2f5680, [0.5, 1.58, -7.7]));
      z2.add(cyl(0.1, 0.1, 2.3, 0x444444, [0.5, 1.1, -6.35], [PI / 2, 0, 0], 8)); z2.add(cyl(0.2, 0.2, 0.2, 0x333333, [0.5, 1.1, -7.1], [PI / 2, 0, 0], 8));
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.07, 6, SEG(16), PI), mat(GD)); arch.position.set(0.5, 1.15, -4.8); z2.add(arch); for (const x of [-0.75, 1.75]) { z2.add(box(0.14, 1.15, 0.14, GD, [x, 0.575, -4.8])); z2.add(box(0.3, 0.06, 0.3, 0x444444, [x, 0.03, -4.8])); }
      z2.add(box(0.9, 0.5, 0.5, 0x8f979e, [1.4, 0.45, -7.5], [0, 0, 0.3])); z2.add(cyl(0.17, 0.17, 5.0, 0x9aa3ab, [1.9, 3.0, -7.6], null, 8)); z2.add(cyl(0.17, 0.17, 7.2, 0x9aa3ab, [1.9, 5.5, -11.2], [PI / 2, 0, 0], 8)); z2.add(sphere(0.2, 0x9aa3ab, [1.9, 5.5, -7.6], 6)); for (const y of [1.6, 3.2, 4.6]) z2.add(cyl(0.19, 0.19, 0.06, 0x6d7a86, [1.9, y, -7.6], null, 8)); }
    // outfeed pallet, sawdust, barrels, air-drying stacks
    z2.add(group([box(3.5, 0.12, 1.3, C.woodLight, [0, 0.2, 0]), box(0.14, 0.14, 1.3, C.wood, [-1.5, 0.07, 0]), box(0.14, 0.14, 1.3, C.wood, [0, 0.07, 0]), box(0.14, 0.14, 1.3, C.wood, [1.5, 0.07, 0])], [6.6, 0, -2.4]));
    for (const [x, z, r] of [[2.6, -8.2, 1.1], [3.6, -8.9, 0.7], [-2.4, -8.4, 0.6]]) z2.add(cone(r, r * 0.75, 0xe6c98a, [x, r * 0.37, z], null, 8));
    for (const [x, z, n] of [[-5.5, -12.6, 5], [-1.2, -12.6, 7], [3.1, -12.6, 4]]) { const s = boardStack(n, 3.4, 1.3, 0xe8cd92); s.position.set(x, 0, z); z2.add(s); }
    z2.add(box(13.4, 0.16, 2.6, 0x7a3b2a, [-1.2, 2.35, -12.6], [0.12, 0, 0])); for (const x of [-7.7, -3.35, 0.95, 5.3]) z2.add(box(0.14, 2.3, 0.14, C.woodDark, [x, 1.15, -11.5]));
    z2.add(sign('🌬️ AIR-DRY', 0.9, { border: '#7a3b2a' }, [-1.2, 3.15, -11.3]));
    // kiln
    z2.add(box(7.4, 4.8, 6.4, 0xa8553d, [12.6, 2.4, -11.6])); z2.add(box(7.8, 0.3, 6.8, 0x6e3a2a, [12.6, 4.95, -11.6])); z2.add(box(3.7, 3.4, 0.1, 0x2a1a14, [12.6, 1.7, -8.36])); z2.add(box(4.1, 0.25, 0.2, C.steel, [12.6, 3.5, -8.3]));
    for (let y = 0.4; y < 4.8; y += 0.4) { z2.add(box(7.42, 0.03, 0.02, 0x8a4331, [12.6, y, -8.39])); z2.add(box(0.02, 0.03, 6.42, 0x8a4331, [8.89, y, -11.6])); } // brick courses
    for (const sx of [-1, 1]) z2.add(box(0.18, 3.5, 0.18, C.steel, [12.6 + sx * 1.94, 1.75, -8.32])); for (const x of [10.6, 12.6, 14.0]) { z2.add(cyl(0.22, 0.22, 0.5, 0x7d868e, [x, 5.35, -10.6], null, 8)); z2.add(cone(0.34, 0.2, 0x5d656d, [x, 5.7, -10.6], null, 8)); }
    z2.add(box(0.5, 0.7, 0.16, 0x6d7a86, [15.4, 1.35, -8.32])); z2.add(sphere(0.05, glow(0x6fdc6a), [15.28, 1.5, -8.22], 5)); z2.add(sphere(0.05, glow(0xff5a3c), [15.5, 1.5, -8.22], 5)); z2.add(glowStrip());
    z2.add(cyl(0.35, 0.35, 2.2, C.steel, [15, 6.1, -12.5], null, 8)); z2.add(cyl(0.45, 0.45, 0.15, 0x444444, [15, 7.25, -12.5], null, 8));
    z2.add(sign('🔥 KILN', 0.9, { bg: '#fff2d6', border: '#7a3b2a' }, [9.3, 2.6, -8.3])); z2.add(box(0.08, 2.2, 0.08, C.woodDark, [9.3, 1.1, -8.34]));
    z2.add(cyl(0.32, 0.32, 0.08, C.white, [15.4, 2.2, -8.36], [PI / 2, 0, 0], 12)); z2.add(box(0.04, 0.24, 0.03, C.red, [15.46, 2.28, -8.3], [0, 0, -0.5]));
    for (const x of [11.85, 13.35]) z2.add(box(0.1, 0.1, 8.4, 0x555555, [x, 0.08, -5.4]));
    // the log truck that brought us, parked
    const tk2 = P.truck({ kind: 'flatbed', color: 0x2f8f6f }); tk2.position.set(-13.2, 0, 3.4); tk2.rotation.y = -PI / 2; z2.add(tk2);
    for (const [y, z] of [[1.32, -0.4], [1.32, 0.4]]) { const l = makeLog(3.6, 0.36); l.position.set(-12.2, y, 3.4 + z); z2.add(l); }
    for (const [x, z] of [[16.8, 2.5], [17.4, 3.3], [-17.4, -2.2]]) { const b = P.barrel(); b.position.set(x, 0, z); z2.add(b); }
    z2.add(box(1.2, 2.0, 0.5, 0x5f7688, [17.6, 1.0, -6.5])); z2.add(box(0.02, 1.9, 0.02, 0x3f5262, [17.6, 1.0, -6.24])); for (const sx of [-1, 1]) { z2.add(box(0.04, 0.22, 0.04, 0xd0d4d8, [17.6 + sx * 0.1, 1.05, -6.23])); for (let i = 0; i < 3; i++) z2.add(box(0.3, 0.03, 0.02, 0x3f5262, [17.6 + sx * 0.3, 1.62 + i * 0.08, -6.24])); } z2.add(box(0.5, 0.4, 0.3, 0xb8453a, [17.6, 2.2, -6.5])); z2.add(box(0.3, 0.06, 0.08, C.white, [17.6, 2.2, -6.34])); z2.add(box(0.08, 0.24, 0.08, C.white, [17.6, 2.2, -6.34]));
    ctx.addStatic(z2, X2, 0); ZS[2].push(z2);
    ctx.collideBox(X2 - 3.7, -6, 26.5, 2.4); const palletCol = ctx.collideBox(X2 + 6.6, -2.4, 3.6, 1.4); ctx.collideBox(X2 - 13.2, 3.4, 6.8, 2.6); ctx.collideBox(X2 + 12.6, -11.6, 7.6, 6.6); ctx.collideCircle(X2 + 17.1, 2.9, 0.9); ctx.collideBox(X2 - 3.5, 4.9, 3.2, 1.3); ctx.collideBox(X2 + 1.2, 5.3, 3.2, 1.3); ctx.collideBox(X2 + 15.6, 4.6, 1.3, 3.2); ctx.collideCircle(X2 - 7.3, 4.8, 0.9);
    const mlog = new THREE.Group(); const mlogCore = makeLog(3.4, 0.41, true, 0xe9cf98); mlog.add(mlogCore); const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.445, 0.445, 3.4, SEG(14), 1, true), barkMat()); sleeve.rotation.z = PI / 2; sleeve.castShadow = true; mlog.add(sleeve); mlog.position.set(X2 - 13.2, 1.2, -6); addZ(2, mlog);
    const debark = new THREE.Group(); const dring = group([torus(0.62, 0.13, 0x444444, [0, 0, 0], [0, PI / 2, 0], 12)]); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; dring.add(box(0.2, 0.24, 0.12, C.metal, [0, Math.cos(a) * 0.5, Math.sin(a) * 0.5], [a, 0, 0])); } bake(dring); debark.add(dring); debark.position.set(X2 - 9.2, 1.2, -6); addZ(2, debark);
    const carriage = bake(group([box(3.9, 0.18, 1.15, C.steel, [0, 0.62, 0]), box(0.16, 0.9, 0.16, C.red, [-1.5, 1.1, -0.5]), box(0.16, 0.9, 0.16, C.red, [1.5, 1.1, -0.5]), box(3.3, 0.12, 0.12, C.red, [0, 1.5, -0.5]), ...[-1.5, 1.5].flatMap(x => [-0.45, 0.45].map(z => cyl(0.22, 0.22, 0.1, 0x333333, [x, 0.3, z], [PI / 2, 0, 0], 8)))])); carriage.position.set(X2 - 5.6, 0, -6); addZ(2, carriage);
    const blade = new THREE.Group(); blade.add(cyl(1.05, 1.05, 0.04, C.metal, [0, 0, 0], [PI / 2, 0, 0], 18)); blade.add(cyl(0.25, 0.25, 0.08, C.red, [0, 0, 0], [PI / 2, 0, 0], 8)); for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; blade.add(box(0.16, 0.16, 0.04, C.grayLight, [Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0], [0, 0, a + 0.5])); } bake(blade); blade.position.set(X2 + 0.5, 1.15, -5.52); addZ(2, blade);
    const lever2 = group([box(0.5, 0.9, 0.4, 0x555555, [0, 0.45, 0]), box(0.52, 0.25, 0.42, C.yellow, [0, 0.72, 0])], [X2 - 2.6, 0, -3.6]); bake(lever2); const stick2 = group([cyl(0.04, 0.04, 0.65, 0x333333, [0, 0.32, 0]), sphere(0.12, C.red, [0, 0.68, 0])], [0, 0.9, 0], [0, 0, 0.55]); bake(stick2); lever2.add(stick2); addZ(2, lever2); ctx.collideCircle(X2 - 2.6, -3.6, 0.4);
    const cart = bake(group([box(3.5, 0.2, 1.3, C.steel, [0, 0.42, 0]), ...[-1.3, 1.3].flatMap(x => [-0.75, 0.75].map(z => cyl(0.2, 0.2, 0.12, 0x333333, [z, 0.22, x * 0.42], [0, 0, PI / 2], 8))), boardStack(2, 3.3, 1.15, 0xd9b77e).translateY(0.5)])); cart.rotation.y = PI / 2; cart.position.set(X2 + 12.6, 0, -3.2); addZ(2, cart); const cartCol = ctx.collideBox(X2 + 12.6, -3.2, 1.6, 3.7);
    const kdoor = bake(group([box(3.9, 3.5, 0.14, C.steel, [0, 0, 0]), box(3.9, 0.16, 0.18, 0x555555, [0, 1.2, 0]), box(3.9, 0.16, 0.18, 0x555555, [0, -1.2, 0]), box(0.9, 0.5, 0.18, C.yellow, [0, 0, 0])])); kdoor.position.set(X2 + 12.6, 5.4, -8.22); kdoor.visible = false; addZ(2, kdoor);
    const sawyer = ctx.person({ hat: 'hardhat', hatColor: 0xf2c43d, shirt: 0x3f7fd1, vest: 0xff8a1f, pants: 0x4a4a55, skin: C.skin[5], hair: C.hair[1], glasses: true, expressive: true }, X2 - 5.2, -3.2, 0.5);
    const kilnOp = ctx.person({ hat: 'cap', hatColor: 0xd9483b, shirt: 0xe9a23b, pants: 0x2f5d50, skin: C.skin[0], hair: C.hair[3], hairStyle: 'long', apron: 0x555555, expressive: true }, X2 + 15.6, -4.6, -0.7);
    const FK = 0xcf7426, fkDriver = person({ hat: 'hardhat', hatColor: 0xf2c43d, shirt: 0x5b7f9c, vest: 0xd8e04a, pants: 0x3a3f4a, skin: C.skin[2], hair: C.hair[0], seated: true }); fkDriver.userData.anim = 'carry'; for (let i = 0; i < 40; i++) fkDriver.userData.tick && fkDriver.userData.tick(0.1, i * 0.1);
    fkDriver.userData.armL.rotation.set(-1.25, 0, 0.27); fkDriver.userData.armR.rotation.set(-1.25, 0, -0.27); fkDriver.position.set(0, 0.36, -0.2); fkDriver.userData.dynamic = false; // sits on the seat, knees bent, shins down in the footwell, both hands on the wheel
    const forklift = bake(group([fkDriver, box(1.15, 0.5, 1.75, FK, [0, 0.62, -0.05]), box(1.15, 0.72, 0.5, 0x3a3a3a, [0, 0.74, -1.0]), cyl(0.575, 0.575, 0.72, 0x3a3a3a, [0, 0.74, -1.1], null, SEG(14)), box(0.8, 0.1, 0.55, 0x2b2b2b, [0, 0.93, -0.22]), box(0.8, 0.5, 0.1, 0x2b2b2b, [0, 1.2, -0.52]),
      cyl(0.025, 0.025, 0.55, 0x333333, [0, 1.12, 0.42], [-0.5, 0, 0], 5), torus(0.15, 0.022, 0x222222, [0, 1.36, 0.29], [1.07, 0, 0], 10), box(0.5, 0.3, 0.12, 0x2b2b2b, [0, 0.98, 0.55]),
      ...[-1, 1].flatMap(sx => [box(0.07, 1.5, 0.07, 0x333333, [sx * 0.52, 1.62, 0.62]), box(0.07, 1.5, 0.07, 0x333333, [sx * 0.52, 1.62, -0.72]), box(0.07, 0.06, 1.4, 0x333333, [sx * 0.52, 2.38, -0.05]), box(0.1, 2.5, 0.12, 0x333333, [sx * 0.4, 1.35, 0.95]), box(0.12, 0.05, 1.15, C.steel, [sx * 0.32, 0.4, 1.62]), box(0.12, 0.45, 0.05, C.steel, [sx * 0.32, 0.6, 1.07]),
        cyl(0.31, 0.31, 0.24, 0x1f1f1f, [sx * 0.56, 0.31, 0.55], [0, 0, PI / 2], SEG(14)), cyl(0.13, 0.13, 0.26, 0xb9b9b9, [sx * 0.56, 0.31, 0.55], [0, 0, PI / 2], 8), cyl(0.25, 0.25, 0.22, 0x1f1f1f, [sx * 0.52, 0.25, -0.75], [0, 0, PI / 2], SEG(14)), cyl(0.1, 0.1, 0.24, 0xb9b9b9, [sx * 0.52, 0.25, -0.75], [0, 0, PI / 2], 8)]),
      ...[-0.5, 0, 0.5].map(z => box(1.1, 0.05, 0.05, 0x333333, [0, 2.38, -0.05 + z * 1.3])), ...[0.4, 1.4, 2.55].map(y => box(0.9, 0.08, 0.08, 0x333333, [0, y, 0.95])), box(0.95, 0.5, 0.06, 0x444444, [0, 0.62, 1.04]), sphere(0.07, glow(0xffc93c), [0, 2.48, -0.6], 5),
      ...[0, 1, 2].flatMap(i => [box(1.25, 0.08, 1.0, i % 2 ? 0xe8cd92 : 0xdcc188, [0, 0.49 + i * 0.14, 1.65]), box(0.08, 0.06, 1.0, 0x9a7446, [-0.45, 0.42 + i * 0.14, 1.65]), box(0.08, 0.06, 1.0, 0x9a7446, [0.45, 0.42 + i * 0.14, 1.65])])])); forklift.position.set(X2 - 9, 0, -10.2); forklift.rotation.y = PI / 2; addZ(2, forklift);
    ctx.onUpdate((dt, t) => { const u = (t * 0.12) % 2, k = u < 1 ? u : 2 - u; forklift.position.x = X2 - 9.5 + k * 16; forklift.rotation.y = u < 1 ? PI / 2 : -PI / 2; blade.rotation.z -= dt * (blade.userData.fast ? 26 : 5); debark.rotation.x += dt * (debark.userData.fast ? 14 : 1.5); });

    // =====================================================================================
    // ZONE 3 — the furniture workshop (x≈200, indoors)
    // =====================================================================================
    const X3 = 200, z3 = new THREE.Group();
    z3.add(texPlane(25, 15, 0xd2b081, planks(15 / 2.4, 25 / 1.6), [0, 0.03, -3], true));
    z3.add(box(25, 6, 0.4, 0xe9dcc0, [0, 3, -10.5])); z3.add(box(0.4, 6, 15, 0xdfd0b0, [-12.5, 3, -3])); z3.add(box(0.4, 6, 15, 0xdfd0b0, [12.5, 3, -3])); z3.add(box(25, 1.1, 0.46, 0x6f8f6a, [0, 0.55, -10.4])); z3.add(box(25, 0.4, 0.46, 0x7a4a2a, [0, 5.6, -10.4]));
    z3.add(sign('🔨 WORKSHOP', 0.85, { border: '#7a4a2a' }, [1.2, 3.35, -10.25]));
    // window, tool board, shelves, poster
    z3.add(box(3.4, 2.2, 0.1, C.white, [-7.5, 3.3, -10.28])); z3.add(box(3.1, 1.9, 0.12, 0xa9dcf2, [-7.5, 3.3, -10.27])); z3.add(box(0.1, 1.9, 0.14, C.white, [-7.5, 3.3, -10.26])); z3.add(box(3.1, 0.1, 0.14, C.white, [-7.5, 3.3, -10.26])); z3.add(sphere(0.9, 0x5aa845, [-8.2, 2.6, -10.3], 6)); z3.add(sphere(0.7, 0xe9a23b, [-6.8, 2.55, -10.3], 6));
    z3.add(box(4.2, 2.2, 0.1, 0x9a7446, [6.8, 3.1, -10.26]));
    for (let i = 0; i < 5; i++) { const x = 5.2 + i * 0.8; z3.add(box(0.08, 0.7, 0.06, C.woodDark, [x, 3.0, -10.18])); z3.add(i % 2 ? box(0.34, 0.22, 0.1, C.steel, [x, 3.42, -10.18]) : box(0.12, 0.5, 0.06, C.metal, [x, 3.5, -10.18])); } z3.add(box(1.5, 0.34, 0.05, C.metal, [6.2, 2.35, -10.18])); z3.add(box(0.3, 0.3, 0.08, C.woodDark, [7.1, 2.35, -10.18])); z3.add(torus(0.28, 0.05, C.red, [8.2, 2.4, -10.18], null, 10));
    z3.add(box(3.2, 0.1, 0.5, C.wood, [1.2, 2.0, -10.1])); for (let i = 0; i < 6; i++) z3.add(cyl(0.16, 0.16, 0.36, [0xd9483b, 0x3f7fd1, 0xe9a23b, 0xf6ecd6, 0x4f9d4a, 0x7b4fb0][i], [-0.1 + i * 0.52, 2.23, -10.1], null, 8));
    // front corners: offcut crate, a half-made chair, toolbox, broom, board pallet
    { const cr = P.crate({ s: 1.0, color: 0xb98a55 }); cr.position.set(-4.3, 0, 1.7); z3.add(cr); for (let i = 0; i < 5; i++) z3.add(box(0.14, 0.9 + (i % 3) * 0.25, 0.1, [0xe8cd92, 0xd9b77e, 0xc9a26b][i % 3], [-4.6 + i * 0.15, 0.9, 1.7 + (i % 2) * 0.2 - 0.1], [0.1 * (i - 2), 0, 0.12 * (i - 2)]));
      const st = boardStack(3, 2.6, 1.0, 0xe8cd92); st.position.set(-9.2, 0, 0.9); st.rotation.y = 0.2; z3.add(st);
      z3.add(group([box(0.7, 0.3, 0.34, C.red, [0, 0.15, 0]), box(0.5, 0.05, 0.06, 0x333333, [0, 0.38, 0]), box(0.04, 0.1, 0.04, 0x333333, [-0.22, 0.33, 0]), box(0.04, 0.1, 0.04, 0x333333, [0.22, 0.33, 0])], [3.9, 0, 1.5], [0, -0.4, 0]));
      z3.add(cyl(0.03, 0.03, 2.0, C.woodLight, [11.9, 1.0, 0.2], [0, 0, 0.12], 5)); z3.add(box(0.5, 0.3, 0.12, 0xd9a441, [11.75, 0.15, 0.2]));
      const ch = chair(0xf2dba6); ch.position.set(6.6, 0, 0.2); ch.rotation.y = -2.5; z3.add(ch); z3.add(plane(2.6, 2.0, 0x8fa9b5, [6.8, 0.04, 0.2], 0.3)); }
    // lumber rack (left), machines (right back), finished chairs, sawdust
    for (let i = 0; i < 3; i++) { z3.add(box(0.14, 3.2, 0.14, C.steel, [-11.2 + i * 1.6, 1.6, -9.6])); } for (let k = 0; k < 3; k++) { z3.add(box(3.6, 0.1, 0.9, C.steel, [-9.6, 0.6 + k * 1.0, -9.6])); for (let j = 0; j < 3; j++) z3.add(box(3.4, 0.1, 0.26, [0xe8cd92, 0xd9b77e, 0xc9a26b][(j + k) % 3], [-9.6 + (j - 1) * 0.06, 0.72 + k * 1.0 + j * 0.11, -9.6 + (j - 1) * 0.27])); }
    z3.add(group([box(1.6, 0.9, 1.2, 0x3a6ea5, [0, 0.45, 0]), box(1.9, 0.1, 1.5, C.metal, [0, 0.95, 0]), box(0.3, 1.7, 0.4, 0x3a6ea5, [-0.6, 1.85, -0.4]), box(1.0, 0.4, 0.4, 0x3a6ea5, [-0.1, 2.6, -0.4]), cyl(0.46, 0.46, 0.34, 0x3a6ea5, [0.3, 2.6, -0.4], [PI / 2, 0, 0], SEG(14)), cyl(0.12, 0.12, 0.36, 0x2b5580, [0.3, 2.6, -0.4], [PI / 2, 0, 0], 8), box(0.04, 1.3, 0.12, C.grayLight, [0.3, 1.7, -0.4]), box(0.9, 0.1, 0.06, 0x777777, [0.3, 1.05, 0.3]), box(0.16, 0.22, 0.1, 0x333333, [-0.6, 1.5, -0.15]), sphere(0.035, glow(0x6fdc6a), [-0.6, 1.55, -0.08], 5)], [9.4, 0, -8.6]));
    z3.add(group([box(1.7, 0.85, 1.3, 0x587f6a, [0, 0.43, 0]), box(2.0, 0.08, 1.6, C.metal, [0, 0.9, 0]), cyl(0.4, 0.4, 0.03, C.grayLight, [0, 0.98, 0], [0, 0, PI / 2], SEG(16)), box(0.08, 0.12, 1.6, 0xb9b9b9, [0.55, 1.0, 0]), box(0.06, 0.3, 0.5, C.yellow, [0, 1.28, -0.1], [0.2, 0, 0]), box(0.16, 0.22, 0.06, 0x333333, [-0.5, 0.6, 0.66]), sphere(0.035, glow(0xff5a3c), [-0.5, 0.62, 0.7], 5)], [5.6, 0, -8.8]));
    for (const [x, z, ry] of [[10.8, -3.6, -1.4], [10.9, -2.4, -1.7], [10.6, -4.9, -1.2]]) { const c = chair(W.finished); c.position.set(x, 0, z); c.rotation.y = ry; z3.add(c); }
    for (const [x, z, r] of [[-11, -5.6, 0.7], [3.6, -9.4, 0.5], [-3.8, -9.6, 0.45]]) z3.add(cone(r, r * 0.7, 0xe6c98a, [x, r * 0.35, z], null, 7));
    const barrelG = P.barrel(); barrelG.position.set(-11.3, 0, -3.4); z3.add(barrelG); z3.add(box(0.1, 1.5, 0.1, C.woodDark, [-11.3, 1.3, -3.4])); z3.add(box(0.5, 0.12, 0.2, C.yellow, [-11.3, 2.0, -3.4]));
    // workbench
    z3.add(group([box(4.4, 0.16, 2.2, 0xb98a55, [0, 0.77, 0]), box(4.0, 0.1, 1.8, 0x8a6236, [0, 0.25, 0]), ...[-1, 1].flatMap(sx => [-1, 1].map(sz => box(0.22, 0.7, 0.22, 0x8a6236, [sx * 1.95, 0.35, sz * 0.9]))), box(0.09, 0.3, 0.42, C.steel, [2.25, 0.72, 0.7]), box(0.09, 0.3, 0.42, C.steel, [2.45, 0.72, 0.7]), cyl(0.03, 0.03, 0.5, 0x444444, [2.5, 0.66, 0.7], [0, 0, PI / 2], 6), cyl(0.014, 0.014, 0.34, 0x333333, [2.74, 0.66, 0.7], [0.3, 0, 0], 5), box(0.5, 0.05, 0.04, C.yellow, [-1.6, 0.875, -0.9], [0, 0.2, 0]), box(0.34, 0.02, 0.24, 0xf6f1e4, [-1.5, 0.86, 0.75], [0, -0.3, 0])], [0, 0, -4]));
    z3.add(box(0.34, 0.02, 0.24, 0xd9b77e, [-1.42, 0.885, -3.2], [0, 0.15, 0])); z3.add(box(0.34, 0.02, 0.24, 0xc9a26b, [-1.56, 0.905, -3.32], [0, -0.2, 0])); // sandpaper sheets on the bench
    { const r = seeded(12); for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.05 + r() * 0.03, 0.012, 4, 6, 4.6), mat(i % 3 ? 0xf0dca8 : 0xe2c88e)); c.position.set((r() - 0.5) * 6.4, 0.07, -4 + (r() < 0.5 ? 1 : -1) * (1.3 + r() * 0.9)); c.rotation.set(r() * 1.2, r() * 6, 0); z3.add(c); } } // plane shavings on the floor
    // sawhorses for the legs
    z3.add(group([box(2.0, 0.1, 0.16, C.wood, [0, 0.8, -0.35]), box(2.0, 0.1, 0.16, C.wood, [0, 0.8, 0.35]), ...[-0.9, 0.9].flatMap(x => [-0.35, 0.35].map(z => box(0.1, 0.8, 0.1, C.wood, [x, 0.4, z])))], [-6.2, 0, -1.6]));
    // rug for the cat
    z3.add(cyl(0.8, 0.8, 0.05, 0xb0122e, [9.6, 0.05, 1.6], null, 14)); z3.add(cyl(0.55, 0.55, 0.06, 0xe9a23b, [9.6, 0.06, 1.6], null, 14));
    ctx.addStatic(z3, X3, 0); ZS[3].push(z3);
    addZ(3, picture(2.7, 1.8, (g, w, h) => { // mortise & tenon poster
      g.fillStyle = '#fff8e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a4a2a'; g.lineWidth = w * 0.03; g.strokeRect(0, 0, w, h);
      g.fillStyle = '#d9a860'; g.fillRect(w * 0.1, h * 0.2, w * 0.3, h * 0.28); g.fillRect(w * 0.4, h * 0.27, w * 0.13, h * 0.14);
      g.fillStyle = '#b8752f'; g.fillRect(w * 0.68, h * 0.1, w * 0.2, h * 0.8); g.fillStyle = '#4a2c17'; g.fillRect(w * 0.68, h * 0.27, w * 0.13, h * 0.14);
      g.fillStyle = '#d9483b'; g.beginPath(); g.moveTo(w * 0.56, h * 0.3); g.lineTo(w * 0.64, h * 0.34); g.lineTo(w * 0.56, h * 0.38); g.fill();
      g.fillStyle = '#4a2c17'; g.font = '800 ' + (h * 0.13) + 'px "Baloo 2","Fredoka","Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText('tenon', w * 0.3, h * 0.68); g.fillText('mortise', w * 0.42, h * 0.9);
      g.strokeStyle = '#4a2c17'; g.lineWidth = w * 0.012; g.beginPath(); g.moveTo(w * 0.4, h * 0.58); g.lineTo(w * 0.46, h * 0.43); g.moveTo(w * 0.58, h * 0.84); g.lineTo(w * 0.72, h * 0.42); g.stroke();
    }, 384, [X3 - 3.4, 3.0, -10.26]));
    ctx.collideBox(X3, -4, 4.5, 2.3); ctx.collideBox(X3 - 9.6, -9.6, 4, 1.4); ctx.collideBox(X3 + 7.5, -8.7, 6, 1.8); ctx.collideBox(X3 - 6.2, -1.6, 2.2, 1.0); ctx.collideBox(X3 + 10.8, -3.6, 1.0, 3.4); ctx.collideCircle(X3 - 11.3, -3.4, 0.5); ctx.collideCircle(X3 + 9.6, 1.6, 0.5); ctx.collideCircle(X3 - 4.3, 1.7, 0.75); ctx.collideBox(X3 - 9.2, 0.9, 2.8, 1.2); ctx.collideCircle(X3 + 3.9, 1.5, 0.45); ctx.collideCircle(X3 + 6.6, 0.2, 0.4);
    const maker = ctx.person({ shirt: 0x4a7a8c, apron: 0x8a5a2b, pants: 0x4a4a55, skin: C.skin[2], hair: C.hair[4], hairStyle: 'bun', glasses: true, expressive: true }, X3 + 3.4, -5.6, -0.9);
    const cat = bake(group([ball(0.3, 0.2, 0.42, 0xe9a23b, [0, 0.2, 0]), sphere(0.17, 0xe9a23b, [0.1, 0.3, 0.36], 7), cone(0.06, 0.12, 0xe9a23b, [0.19, 0.47, 0.36], null, 4), cone(0.06, 0.12, 0xe9a23b, [0.02, 0.47, 0.38], null, 4), ball(0.05, 0.05, 0.3, 0xd98a2b, [-0.22, 0.1, -0.28], [0, 0.9, 0])])); cat.position.set(X3 + 9.6, 0.08, 1.6); cat.rotation.y = -0.8; addZ(3, cat);
    // the table being built, upside-down on the bench (origin = bench top)
    const tbl = new THREE.Group(); tbl.position.set(X3, 0.86, -4); addZ(3, tbl);
    const GAP = 0.16, boards = [-1, 0, 1].map(i => { const bb = box(TB.w, TB.t, TB.d / 3 + 0.002, 0xffffff, [0, 0, 0]); bb.userData.uv = [1, 1, i * 0.37, i * 0.41]; const b = tintable(group([bb]), W.rough); const rough = bake(group([box(TB.w * 0.3, 0.03, 0.07, 0x9a7446, [0.4 * i, 0.05, 0.1]), box(TB.w * 0.2, 0.03, 0.06, 0x8a6236, [-0.8, 0.05, -0.12]), box(TB.w * 0.16, 0.03, 0.05, 0x9a7446, [0.9, 0.05, -0.05 * i]), box(0.1, 0.035, 0.1, 0x7a5536, [-0.2 + i * 0.5, 0.05, 0.02])])); b.add(rough); b.userData.rough = rough; b.position.set(0, TB.t / 2, i * (TB.d / 3 + GAP)); tbl.add(b); return b; });
    const apron = tintable(makeApron(), W.planed); apron.position.set(0, 3.2, 0); apron.visible = false; tbl.add(apron);
    const legs = [[-0.35, 0.93], [0.35, 0.93], [0, 0.93], [0.18, 1.08]].map(([z, y]) => { const l = tintable(makeLeg(), W.planed); l.rotation.z = PI / 2; l.position.set(X3 - 6.2, y, -1.6 + z); return addZ(3, l); });
    const planeTool = bake(group([box(0.5, 0.12, 0.16, 0x8a5a2b, [0, 0.06, 0]), box(0.1, 0.16, 0.1, 0x6e4a28, [-0.15, 0.2, 0]), sphere(0.07, 0x6e4a28, [0.17, 0.17, 0], 6), box(0.02, 0.1, 0.14, C.metal, [0.02, 0.14, 0], [0, 0, 0.5])])); planeTool.position.set(X3 + 1.2, 0.86 + TB.t, -4 + 0.6); addZ(3, planeTool);
    const clamps = [-0.9, 0.9].map(x => { const c = bake(group([box(0.08, 0.08, TB.d + 0.5, C.steel, [0, 0.12, 0]), box(0.1, 0.34, 0.08, C.red, [0, 0, TB.d / 2 + 0.12]), box(0.1, 0.34, 0.08, C.red, [0, 0, -TB.d / 2 - 0.12]), cyl(0.03, 0.03, 0.3, C.woodDark, [0, 0.0, TB.d / 2 + 0.3], [PI / 2, 0, 0], 5)])); c.position.set(x, 3.4, 0); c.visible = false; tbl.add(c); return c; });
    const sander = bake(group([box(0.42, 0.1, 0.24, 0x555555, [0, 0.05, 0]), box(0.3, 0.1, 0.12, C.cream, [0, 0.15, 0])])); sander.visible = false; addZ(3, sander);
    const oilCan = bake(group([cyl(0.17, 0.17, 0.3, 0xd9a23b, [0, 0.15, 0], null, 10), cyl(0.18, 0.18, 0.03, C.metal, [0, 0.3, 0], null, 10), box(0.05, 0.3, 0.03, C.woodLight, [0.13, 0.42, 0], [0, 0, -0.55]), box(0.1, 0.12, 0.04, 0x3a2a1a, [0.23, 0.58, 0], [0, 0, -0.55])])); oilCan.position.set(X3 + 2.5, 0.86, -3.4); oilCan.visible = false; addZ(3, oilCan);

    // =====================================================================================
    // ZONE 4 — delivery day: the street from the workshop (left) to the family's home (right)  (x≈300)
    // =====================================================================================
    const X4 = 300, z4 = new THREE.Group();
    z4.add(texPlane(96, 6, 0x676a70, grain(6), [0, 0.03, 4.5])); for (let x = -46; x <= 46; x += 4) z4.add(plane(1.8, 0.2, 0xf2e6b0, [x, 0.04, 4.5]));
    z4.add(plane(96, 2.2, 0xcfc8b8, [0, 0.035, 0.4])); z4.add(plane(96, 1.6, 0xcfc8b8, [0, 0.035, 8.3]));
    for (const x of [-19.5, 23.2]) z4.add(plane(3.8, 7.2, 0x8d9097, [x, 0.04, -2.1]));
    const shop = P.building({ w: 11, h: 4.6, d: 7, color: 0xc98a4a, roof: 'gable', roofColor: 0x6e3a2a, doorW: 2.6, doorH: 3, doorColor: 0x7a4a2a, windows: 2, sign: '🔨 WORKSHOP', signH: 0.9, trim: 0x7a4a2a }); shop.position.set(-27.5, 0, -6.5); z4.add(shop); z4.add(plane(4, 2.6, 0xcfc8b8, [-27.5, 0.035, -1.8]));
    for (const [x, z, n] of [[-32.2, -2.2, 4], [-23.4, -2.4, 2]]) { const st = boardStack(n, 2.4, 1.0, 0xe8cd92); st.position.set(x, 0, z); st.rotation.y = PI / 2; z4.add(st); }
    const houses = [[-9, 0xf1e2c4, 0x9c4a3a], [2.5, 0xdfe9f2, 0x4a5a7a], [14, 0xf2d9c4, 0x6e4a3a]];
    houses.forEach(([x, col, rc]) => { const h = P.house({ color: col, roofColor: rc }); h.position.set(x, 0, -8); z4.add(h); z4.add(plane(1.4, 5.6, 0xcfc8b8, [x, 0.035, -2.2])); for (const sx of [-1, 1]) { const f = P.fence(3.2, { color: C.white, h: 0.8 }); f.position.set(x + sx * 2.7, 0, -0.95); z4.add(f); } });
    const home = P.house({ w: 9, h: 3.8, d: 7, color: 0xf6e0a8, roofColor: 0xb0452e, doorColor: 0xb0122e, windows: 4 }); home.position.set(29.5, 0, -8); z4.add(home); z4.add(plane(2.4, 5.4, 0xd9c9a8, [29.5, 0.035, -2.1]));
    z4.add(torus(0.3, 0.09, 0xd9622b, [29.5, 1.7, -4.38], null, 10)); for (const [x, z, s] of [[27.6, -3.9, 0.36], [28.1, -3.6, 0.24], [31.4, -3.9, 0.3]]) z4.add(pumpkin(s, [x, 0, z]));
    z4.add(P.scatter(22, 92, 5, (r) => P.tree({ h: 4 + r() * 2.5, kind: 'autumn' }), { seed: 31 }).translateZ(-15.5));
    const streetTrees = [-14.6, -3.2, 8.3, 18.6, 35.2]; streetTrees.forEach((x, i) => { const t = P.tree({ h: 4.4, kind: 'autumn', color: C.autumn[i % 4] }); t.position.set(x, 0, -3.2); z4.add(t); });
    for (const x of [-36, -15.4, 5.6, 19.8, 38]) { const l = P.lampPost(); l.position.set(x, 0, 1.25); z4.add(l); }
    z4.add(P.scatter(16, 90, 3, (r) => r() < 0.7 ? P.bush({ color: r() < 0.5 ? 0xc9622b : C.grassDark }) : P.flower(), { seed: 77 }).translateZ(11));
    z4.add(P.scatter(60, 90, 9, (r) => box(0.2, 0.012, 0.13, [0xc9622b, 0xd99a3b, 0xb5472a, 0xcfae45][Math.floor(r() * 4)], [0, 0.05, 0], [0, r() * 6, 0]), { seed: 5 }).translateZ(-0.5));
    z4.add(group([box(0.09, 1.0, 0.09, C.woodDark, [0, 0.5, 0]), box(0.26, 0.14, 0.46, 0xb8453a, [0, 1.07, 0]), cyl(0.13, 0.13, 0.46, 0xb8453a, [0, 1.14, 0], [PI / 2, 0, 0], 10), box(0.02, 0.16, 0.08, C.yellow, [0.14, 1.22, 0.1])], [33.2, 0, -0.4]));
    for (let i = 0; i < 2; i++) { const m = P.mountain({ h: 24 + i * 8, color: 0x8a93a3 }); m.position.set(-30 + i * 60, 0, -100); z4.add(m); }
    ctx.addStatic(z4, X4, 0); ZS[4].push(z4);
    ctx.collideBox(X4 - 27.5, -6.5, 11.2, 7.2); ctx.collideBox(X4 - 32.2, -2.2, 1.2, 2.6); ctx.collideBox(X4 - 23.4, -2.4, 1.2, 2.6); houses.forEach(([x]) => ctx.collideBox(X4 + x, -8, 7.2, 6.2)); ctx.collideBox(X4 + 29.5, -8, 9.2, 7.2); streetTrees.forEach(x => ctx.collideCircle(X4 + x, -3.2, 0.45)); ctx.collideCircle(X4 + 33.2, -0.4, 0.3);
    const van = addZ(4, P.truck({ kind: 'box', color: 0xe98a2b, cargoColor: 0xfff8e8, logo: '🌳' }), X4 - 19.5, -1.8, 0); let vanCol = ctx.collideBox(X4 - 19.5, -1.8, 2.6, 6.8);
    const tableOut = finishedTable(); tableOut.position.set(X4 - 27.5, 0, -1.3); addZ(4, tableOut); const tableOutCol = ctx.collideBox(X4 - 27.5, -1.3, 3.1, 1.6);
    const driver = ctx.person({ hat: 'cap', hatColor: 0xe98a2b, shirt: 0xe98a2b, pants: 0x3b5b8c, skin: C.skin[4], hair: C.hair[0], expressive: true }, X4 - 21.6, 1.5, -1.2);
    const DG = 0xefe9dc, DBR = 0x8a5a2b, dog = bake(group([ball(0.17, 0.17, 0.3, DG, [0, 0.37, 0]), ball(0.16, 0.18, 0.17, DG, [0, 0.41, 0.2]), ball(0.11, 0.07, 0.13, DBR, [0.06, 0.5, -0.08]), ball(0.13, 0.13, 0.14, DG, [0, 0.62, 0.33]), ball(0.075, 0.065, 0.1, DG, [0, 0.58, 0.46]), sphere(0.03, 0x222222, [0, 0.59, 0.56], 5), cyl(0.025, 0.012, 0.26, DG, [0, 0.54, -0.34], [-0.7, 0, 0], 5),
      ...[-1, 1].flatMap(sx => [sphere(0.018, 0x1a1a1a, [sx * 0.06, 0.66, 0.43], 4), ball(0.04, 0.1, 0.06, DBR, [sx * 0.13, 0.6, 0.3], [0, 0, sx * 0.25], 6), ...[-0.2, 0.2].flatMap(z => [cyl(0.042, 0.032, 0.3, DG, [sx * 0.1, 0.15, z], null, 6), ball(0.045, 0.03, 0.065, DG, [sx * 0.1, 0.03, z + 0.025], null, 6)])])])); dog.position.set(X4 + 32, 0, -2.2); dog.rotation.y = -1.2; addZ(4, dog);
    const neighbour = ctx.person('shopper', X4 + 4.6, -0.3, 0.3, 12); neighbour.userData.anim = 'wave';

    // =====================================================================================
    // ZONE 5 — the dining room (x≈400, indoors)
    // =====================================================================================
    const X5 = 400, z5 = new THREE.Group();
    z5.add(texPlane(17, 13, 0xc2915f, planks(17 / 2.4, 13 / 1.6), [0, 0.03, -2.5]));
    z5.add(box(17, 5.4, 0.4, 0xf3dfb8, [0, 2.7, -9])); z5.add(box(0.4, 5.4, 13, 0xeed6a8, [-8.5, 2.7, -2.5])); z5.add(box(0.4, 5.4, 13, 0xeed6a8, [8.5, 2.7, -2.5])); z5.add(box(17, 1.0, 0.46, 0xd98a5a, [0, 0.5, -8.95])); z5.add(box(17, 0.12, 0.5, C.white, [0, 1.05, -8.93]));
    z5.add(box(5.4, 0.04, 3.4, 0x8c2f2c, [0, 0.05, -2.4])); z5.add(box(4.8, 0.045, 2.8, 0xd9bd8c, [0, 0.052, -2.4])); z5.add(box(4.5, 0.05, 2.5, 0xa3402f, [0, 0.054, -2.4])); z5.add(box(2.6, 0.055, 1.0, 0x8c2f2c, [0, 0.056, -2.4])); z5.add(box(2.4, 0.06, 0.8, 0xd9bd8c, [0, 0.058, -2.4])); for (let i = 0; i < 28; i++) for (const sx of [-1, 1]) z5.add(box(0.1, 0.02, 0.03, 0xe6d6b0, [sx * 2.74, 0.045, -4.02 + i * 0.12]));
    // window with autumn trees, fireplace, sideboard, pictures
    z5.add(box(3.6, 2.4, 0.1, C.white, [-4.6, 3.0, -8.78])); z5.add(box(3.3, 2.1, 0.12, 0x9fd6f2, [-4.6, 3.0, -8.77])); z5.add(sphere(0.8, 0xd9622b, [-5.4, 2.4, -8.8], 6)); z5.add(sphere(0.7, 0xe9a23b, [-4.0, 2.3, -8.8], 6)); z5.add(box(0.1, 2.1, 0.14, C.white, [-4.6, 3.0, -8.76])); z5.add(box(3.3, 0.1, 0.14, C.white, [-4.6, 3.0, -8.76]));
    for (const sx of [-1, 1]) { z5.add(box(0.7, 2.9, 0.1, 0xa8483a, [-4.6 + sx * 2.1, 3.0, -8.72])); for (let i = 0; i < 4; i++) z5.add(cyl(0.06, 0.06, 2.9, 0x96402f, [-4.6 + sx * 2.1 - 0.27 + i * 0.18, 3.0, -8.68], null, 5)); } z5.add(cyl(0.03, 0.03, 5.4, 0x5a3c20, [-4.6, 4.5, -8.66], [0, 0, PI / 2], 6)); z5.add(box(3.8, 0.08, 0.24, C.white, [-4.6, 1.84, -8.72]));
    z5.add(box(3.0, 2.2, 0.9, C.brick, [3.6, 1.1, -8.5])); z5.add(box(1.5, 1.2, 0.1, 0x2a1a14, [3.6, 0.6, -8.03])); z5.add(box(3.4, 0.16, 1.1, C.woodDark, [3.6, 2.28, -8.45])); z5.add(box(1.6, 3.2, 0.7, C.brick, [3.6, 3.8, -8.6]));
    z5.add(cone(0.3, 0.8, glow(0xffa53c), [3.6, 0.72, -7.84], null, 6)); z5.add(cone(0.19, 0.5, glow(0xffe08a), [3.78, 0.56, -7.78], null, 5));
    for (const [x, s] of [[2.5, 0.17], [4.7, 0.2]]) z5.add(pumpkin(s, [x, 2.36, -8.4]));
    for (let y = 0.28; y < 2.2; y += 0.28) z5.add(box(3.02, 0.025, 0.02, 0x8a4331, [3.6, y, -8.04])); for (let y = 2.6; y < 5.4; y += 0.28) z5.add(box(1.62, 0.025, 0.02, 0x8a4331, [3.6, y, -8.24])); // brick courses
    z5.add(box(3.6, 0.08, 1.5, 0x8d8a82, [3.6, 0.07, -7.7])); for (const [x, rz] of [[3.35, 0.1], [3.85, -0.12]]) z5.add(cyl(0.09, 0.09, 0.9, 0x5d4430, [x, 0.2, -7.82], [0, 0.3 * rz * 10, PI / 2], 6)); z5.add(cyl(0.08, 0.08, 0.8, 0x4a3626, [3.6, 0.34, -7.86], [0, 0, PI / 2], 6)); z5.add(cone(0.19, 0.55, glow(0xff8a2c), [3.36, 0.6, -7.82], null, 5));
    z5.add(box(0.34, 0.42, 0.16, 0x6e4a28, [3.6, 2.57, -8.08])); z5.add(cyl(0.13, 0.13, 0.02, 0xf6ecd6, [3.6, 2.62, -7.99], [PI / 2, 0, 0], 10)); for (const x of [3.05, 4.15]) { z5.add(cyl(0.03, 0.03, 0.3, C.cream, [x, 2.51, -8.1], null, 6)); z5.add(sphere(0.04, glow(0xffc93c), [x, 2.7, -8.1], 5)); }
    z5.add(group([box(0.7, 0.36, 0.44, 0x8a6a48, [0, 0.2, 0]), ...[0, 1, 2].map(i => cyl(0.09, 0.09, 0.5, i % 2 ? 0x6b4a2f : 0x7a5a3c, [-0.2 + i * 0.2, 0.46, 0], [PI / 2, 0, 0], 6))], [5.7, 0, -8.2]));
    z5.add(box(2.6, 0.86, 0.7, C.woodDark, [-7.8, 0.57, -2.5], [0, PI / 2, 0])); z5.add(box(2.7, 0.06, 0.78, 0x7d5530, [-7.8, 1.01, -2.5], [0, PI / 2, 0])); for (const z of [-3.7, -1.3]) for (const x of [-8.08, -7.52]) z5.add(box(0.08, 0.16, 0.08, 0x5a3c20, [x, 0.08, z])); for (const z of [-3.1, -2.5, -1.9]) { z5.add(box(0.02, 0.62, 0.54, 0x7d5530, [-7.44, 0.57, z])); z5.add(sphere(0.03, C.gold, [-7.41, 0.62, z + 0.2], 5)); } z5.add(cyl(0.2, 0.14, 0.4, 0x3f7fd1, [-7.8, 1.2, -2.0], null, 8)); z5.add(sphere(0.22, C.yellow, [-7.8, 1.55, -2.0], 6)); z5.add(box(0.5, 0.06, 0.7, C.cream, [-7.8, 1.03, -3.1]));
    for (const [x, z, ry] of [[-1.0, -4.3, 0], [1.0, -4.3, 0], [-3.0, -2.4, PI / 2], [3.0, -2.4, -PI / 2], [6.9, -6.6, -0.7], [7.0, -0.4, -1.9]]) { const c = chair(); c.position.set(x, 0, z); c.rotation.y = ry; z5.add(c); }
    for (const [x, z, sc] of [[-6.6, 2.4, 0.42], [-5.8, 2.9, 0.28], [-7.1, 3.1, 0.22]]) z5.add(pumpkin(sc, [x, 0, z]));
    z5.add(group([box(1.5, 0.5, 0.7, 0x8a5a2b, [0, 0.25, 0]), box(1.56, 0.08, 0.76, 0xa8743f, [0, 0.54, 0]), box(0.5, 0.3, 0.4, C.red, [-0.3, 0.73, 0]), sphere(0.17, C.blue, [0.35, 0.75, 0.05], 7)], [5.6, 0, 2.8], [0, -0.3, 0])); z5.add(cyl(1.0, 1.0, 0.05, 0x7fa88f, [5.4, 0.05, 1.0], null, 16));
    z5.add(cyl(0.3, 0.24, 0.5, 0xb4563c, [7.4, 0.25, -8], null, 8)); z5.add(sphere(0.5, 0x4f9d4a, [7.4, 1.0, -8], 6)); z5.add(sphere(0.35, 0x5aa845, [7.2, 1.5, -7.9], 6));
    ctx.addStatic(z5, X5, 0); ZS[5].push(z5);
    addZ(5, sign('🍂 🦃 🍂', 0.75, { bg: '#fff8e8', border: '#b0452e' }, [X5 + 0.1, 2.7, -8.78]));
    addZ(5, picture(1.5, 1.15, (g, w, h) => { g.fillStyle = '#6e4a28'; g.fillRect(0, 0, w, h); g.fillStyle = '#bfe6f5'; g.fillRect(w * 0.07, h * 0.09, w * 0.86, h * 0.82); g.fillStyle = '#8fc46a'; g.fillRect(w * 0.07, h * 0.66, w * 0.86, h * 0.25);
      for (const [x, r, skin, hair, shirt] of [[0.3, 0.13, '#c68650', '#1c1c1c', '#4f9d4a'], [0.52, 0.1, '#f2c9a0', '#d9a441', '#d9483b'], [0.72, 0.13, '#e0a878', '#8a5a2b', '#e98a2b']]) { g.fillStyle = shirt; g.beginPath(); g.ellipse(w * x, h * 0.9, w * r * 1.1, h * 0.3, 0, Math.PI, 0); g.fill(); g.fillStyle = hair; g.beginPath(); g.arc(w * x, h * (0.5 - r * 0.25), w * r * 1.08, 0, 7); g.fill(); g.fillStyle = skin; g.beginPath(); g.arc(w * x, h * 0.52, w * r, 0, 7); g.fill(); g.fillStyle = '#222'; g.fillRect(w * (x - r * 0.45), h * 0.5, w * 0.02, h * 0.035); g.fillRect(w * (x + r * 0.3), h * 0.5, w * 0.02, h * 0.035); }
    }, 192, [X5 + 6.6, 2.9, -8.78]));
    ctx.collideBox(X5 + 3.6, -8.5, 3.2, 1.2); ctx.collideCircle(X5 - 6.5, 2.7, 0.8); ctx.collideBox(X5 + 5.6, 2.8, 1.7, 0.9); ctx.collideBox(X5 - 7.8, -2.5, 0.9, 2.8); for (const [x, z] of [[-1.0, -4.3], [1.0, -4.3], [-3.0, -2.4], [3.0, -2.4], [6.9, -6.6], [7.0, -0.4]]) ctx.collideCircle(X5 + x, z, 0.32);
    const grandma = ctx.person({ hair: C.hair[5], hairStyle: 'bun', shirt: C.purple, dress: 0x6a3f9a, glasses: true, skin: C.skin[4], expressive: true }, X5 - 5.2, -5.8, 0.7);
    const dad = ctx.person({ hair: C.hair[0], shirt: 0x4f9d4a, pants: 0x6b4a2f, skin: C.skin[2], beard: C.hair[0], expressive: true }, X5 + 5.4, -4.6, -0.9);
    const mom = ctx.person({ hair: C.hair[2], hairStyle: 'long', shirt: 0xe98a2b, pants: C.navy, skin: C.skin[1], expressive: true }, X5 + 1.8, -6.6, -0.2);
    const kid = ctx.person({ hair: C.hair[3], hairStyle: 'curly', shirt: C.red, pants: 0x3b5b8c, skin: C.skin[0], scale: 0.66, expressive: true }, X5 - 5.6, 0.6, 1.1);
    const cloth = bake(group([box(0.7, 0.14, 0.5, 0xfdf6e6, [0, 0.07, 0]), box(0.72, 0.03, 0.08, 0xd9622b, [0, 0.15, 0.1]), box(0.72, 0.03, 0.08, 0xd9622b, [0, 0.15, -0.1])])); cloth.position.set(0, 0.1, 0.05); grandma.userData.carryAnchor.add(cloth); grandma.userData.anim = 'carry'; // lies on her forearms
    const family = [grandma, dad, mom, kid];
    ZS[1].push(forester, logger); ZS[2].push(sawyer, kilnOp); ZS[3].push(maker); ZS[4].push(driver, neighbour); ZS[5].push(...family);
    showZone(1);

    // =====================================================================================
    //                                   THE STORY
    // =====================================================================================
    ctx.onStart(async () => {
      const TOTAL = 16; let step = 0; const done = () => ctx.progress(++step, TOTAL); ctx.progress(0, TOTAL);
      ctx.bounds(-11.5, -10.6, 8.5, 6);

      // ---------- 1. how old is a tree? count the rings ----------
      ctx.say(forester, 'How old was this oak? 🌳');
      ctx.goal('🔎', 'Look at the stump', [-5, -2]);
      ctx.zone({ x: -5, z: -2, r: 3.6, onEnter: async () => { ctx.emote(squirrel, '🌰', { y: 0.8 }); ctx.audio.play('boing'); await ctx.moveAlong(squirrel, [[-5.9, 0.3, -2.9], [-8.4, 0.02, -3.4], [-10.0, 0.02, -2.5]], 5); await ctx.tween(squirrel.position, { y: 2.6 }, 0.5); squirrel.visible = false; } });
      await useAt({ at: [-5, -2], icon: '🔎', label: 'Count rings', r: 2.6, y: 1.5 });
      await ringGame();
      done(); fact('🌳', 'One ring for every year the tree grew.');
      await ctx.wait(0.6);

      // ---------- 2. fell the marked oak with a two-person saw ----------
      ctx.say(forester, 'Orange mark = ready to cut! 🌳'); forester.userData.anim = 'point'; forester.userData.lookAt = null; ctx.tween(forester.rotation, { y: 2.2 }, 0.4);
      ctx.goal('🌳', 'Saw the marked oak', [2, -6]);
      ctx.after(1.6, () => ctx.say(logger, 'Grab the other handle! 👋', 2.6));
      let dustT = 0;
      await holdJob({ at: [2, -6], icon: '🌳', label: 'Saw', hold: 2.6, r: 3.0, y: 2.2, loop: 'saw', face: [2, -6] }, (f, dt, working) => {
        logger.userData.anim = working ? 'work' : 'idle';
        if (working) { saw.position.x = 2 + Math.sin(ctx.time * 11) * 0.32; dustT -= dt; if (dustT <= 0) { dustT = 0.16; ctx.burst([2, 0.7, -5.5], { color: 0xe6c98a, n: 4, speed: 1.6, size: 0.16, y: 0 }); } }
      });
      forester.userData.anim = 'idle'; logger.userData.anim = 'idle';
      ctx.lock(); ctx.banner('🌳', 'TIMBER!', 1.6); ctx.say(logger, 'Timber! 📣', 1.6);
      const pp = ctx.player.position; if (pp.z < -5.2 && Math.abs(pp.x - 2) < 3) await ctx.tween(pp, { x: 4.6, z: -4.4 }, 0.4);
      ctx.audio.play('wind'); ctx.remove(saw);
      await ctx.tween(oak.rotation, { x: -0.12 }, 0.7, 'inOut'); await ctx.tween(oak.rotation, { x: -PI / 2 }, 1.3, 'in');
      ctx.audio.play('thud'); ctx.audio.noise && ctx.audio.noise(0.5, { freq: 300, to: 80, vol: 0.5 }); ctx.cam.shake = 0.7;
      ctx.burst([2, 1, -13], { color: 0x5aa845, n: 26, speed: 5, size: 0.3 }); ctx.burst([2, 0.4, -9], { color: 0xb08a5a, n: 12, speed: 3 });
      oak.rotation.x = -PI / 2 + 0.05; await ctx.tween(oak.rotation, { x: -PI / 2 }, 0.25, 'outBounce');
      oakCol.remove(); const fallCol = ctx.collideBox(2, -10.2, 2.6, 8.6);
      ctx.emote(logger, '💪', { y: 2.2 }); logger.userData.anim = 'cheer'; await ctx.wait(0.9); logger.userData.anim = 'idle'; ctx.unlock(); done();
      fact('⚙️', 'Today, loggers mostly use chainsaws and big machines.');

      // ---------- 3. plant new oaks where the old ones stood ----------
      ctx.say(forester, 'Now we plant new ones! 🌱');
      ctx.goal('🌱', 'Take the seedlings', seedCrate);
      await useAt({ at: seedCrate, icon: '🌱', label: 'Pick up', y: 1.3 });
      const CRATE = [0, -0.08, 0.1]; ctx.carry(seedCrate, { y: CRATE[1] }); seedCrate.position.z = CRATE[2]; // between the hands, its rim below the chin
      const axe = bake(group([box(0.05, 0.7, 0.05, C.woodLight, [0, -0.1, 0.25], [1.2, 0, 0]), box(0.06, 0.26, 0.2, C.steel, [0, 0.0, 0.56], [1.2, 0, 0])])); logger.userData.hand.add(axe);
      logger.rotation.y = PI; ctx.moveAlong(logger, [[0.4, -8.6]], 2.5).then(() => { logger.rotation.y = PI / 2; logger.userData.anim = 'work'; }); logger.userData.anim = 'walk';
      const chop = ctx.every(0.7, () => { if (logger.userData.anim === 'work') ctx.burst([1.5, 0.9, -8.6], { color: 0xe6c98a, n: 3, speed: 1.2, size: 0.14, y: 0 }); });
      const SPOTS = [[-6.6, -4.2], [-3.2, -6.4], [-6.0, -7.8]]; let planted = 0;
      const left = SPOTS.map(p => p.slice()); const nextSpot = () => left.slice().sort((a, b) => Math.hypot(a[0] - ctx.player.position.x, a[1] - ctx.player.position.z) - Math.hypot(b[0] - ctx.player.position.x, b[1] - ctx.player.position.z))[0];
      ctx.goal('🌱', 'Plant 3 oaks', nextSpot());
      for (const [x, z] of SPOTS) {
        const mk = cyl(0.34, 0.34, 0.03, 0xffd84a, [x, 0.06, z], null, 12); mk.material = mat(0xffd84a, { opacity: 0.55 }); ctx.add(mk);
        ctx.interact({ at: [x, z], r: 1.6, y: 1.2, icon: '🌱', label: 'Plant', sfx: 'plant', onUse: async () => {
          ctx.remove(mk);
          // the crate waits on the ground (on the side away from the hole) while both hands dig, then it is picked up again
          const pu = ctx.player.userData, pp = ctx.player.position, pa = ctx.player.rotation.y, side = (x - pp.x) * Math.cos(pa) - (z - pp.z) * Math.sin(pa) > 0 ? -1 : 1;
          pu.carrying = false; ctx.stopTweens(seedCrate.position); ctx.tween(seedCrate.position, { x: side * 0.6, y: -1, z: 0.1 }, 0.12, 'in');
          await ctx.act('dig', 0.6); ctx.audio.play('dig'); ctx.burst([x, 0.2, z], { color: 0x7a5536, n: 8 });
          if (ctx.carrying === seedCrate) { pu.carrying = true; ctx.stopTweens(seedCrate.position); ctx.tween(seedCrate.position, { x: CRATE[0], y: CRATE[1], z: CRATE[2] }, 0.15, 'out'); }
          const t = P.tree({ h: 1.1, kind: 'round', color: 0x67b04c, trunk: W.bark }); t.position.set(x, 0, z); t.scale.setScalar(0.01); addZ(1, t); ctx.tween(t.scale, { x: 1, y: 1, z: 1 }, 0.6, 'outBack'); ctx.emote([x, 0, z], '🌱', { y: 1.4 });
          planted++; left.splice(left.findIndex(p => p[0] === x && p[1] === z), 1); if (planted < 3) ctx.goal('🌱', 'Plant ' + (3 - planted) + ' more', nextSpot());
        } });
      }
      await ctx.until(() => planted >= 3);
      ctx.remove(ctx.drop()); done(); ctx.goal('🌱', 'Grow well, little oaks!');
      fact('🌰', 'An oak needs many decades to grow this big.');
      ctx.thank('🌱', ['Foresters', 'Tree planters', 'Seedling growers']);
      forester.userData.anim = 'clap'; await ctx.wait(2.2); await factSeen(); forester.userData.anim = 'idle'; chop();

      // ---------- chapter 2: the log landing ----------
      ctx.bounds(null);
      await ctx.chapter({ n: 2, title: 'The Log Landing', emoji: '🚚', at: [31.5, -1], face: PI * 0.75, setup: () => {
        ctx.remove(oak); fallCol.remove(); pile.forEach(l => { l.visible = true; }); logger.userData.hand.remove(axe); logger.position.set(31.2, 0, -3.4); logger.rotation.y = 1.0; logger.userData.anim = 'idle';
      } });
      ctx.bounds(27.4, -10.4, 35.9, 4.6);
      ctx.say(logger, 'You run the loader! 🏗️');
      let loaded = 0, busy = false; const SLOTS = [[-0.42, 0.4], [0.42, 0.4], [0, 1.02]];
      ctx.goal('🏗️', 'Load 2 logs', lever1);
      const craneIt = ctx.interact({ at: lever1, icon: '🏗️', label: 'Grab a log', once: false, y: 1.9, r: 2.4, when: () => !busy && loaded < 2, onUse: async () => {
        busy = true; const log = pile[1 - loaded], slot = SLOTS[loaded]; ctx.tween(stick1.rotation, { z: -0.5 }, 0.2);
        await craneGame(ctx, loaded); // mini-game: swing the grapple along the boom and drop it on the log
        if (!loaded) fact('🏗️', 'A big oak log can weigh as much as a car!'); ctx.audio.play('machine');
        await ctx.tween(turret.rotation, { y: PI }, Math.abs(turret.rotation.y - PI) / 2.6 + 0.05, 'inOut');
        await ctx.tween(hook.position, { y: log.position.y + 0.45 - 0.85 }, 0.5); ctx.audio.play('clink'); hook.attach(log); ctx.tween(log.position, { x: 0, z: 0, y: -0.45 }, 0.15);
        await ctx.tween(hook.position, { y: 2.6 }, 0.5); ctx.audio.play('machine');
        await ctx.tween(turret.rotation, { y: 0 }, 1.25, 'inOut');
        await ctx.tween(hook.position, { y: 0.95 + slot[1] + 0.45 - 0.85 }, 0.45);
        truck1.userData.bed.attach(log); log.rotation.set(0, PI / 2, 0); ctx.tween(log.position, { x: slot[0], y: slot[1], z: 0 }, 0.15); ctx.audio.play('thud'); ctx.burst(log, { color: 0xb08a5a, n: 6, speed: 1.5, y: 0 }); ctx.cam.shake = 0.15;
        await ctx.tween(hook.position, { y: 2.4 }, 0.4); ctx.tween(stick1.rotation, { z: 0.5 }, 0.2);
        loaded++; busy = false; if (loaded < 2) ctx.goal('🏗️', 'Load 1 more', lever1);
      } });
      await ctx.until(() => loaded >= 2); craneIt.remove(); done();
      logger.userData.anim = 'clap'; ctx.thank('🌲', ['Loggers', 'Loader operators', 'Log-truck drivers']);
      ctx.bounds(27.4, -10.4, 36, 4.6);
      ctx.goal('🚚', 'Ride to the sawmill', truck1);
      await useAt({ at: truck1, icon: '🚚', label: 'Hop in', y: 2.9, r: 4.8 });
      logger.userData.anim = 'wave'; ctx.audio.play('honk'); ctx.goal('🚚', 'Off to the sawmill!'); ctx.bounds(null); truck1Col.remove();
      const bump = ctx.onUpdate((dt, t) => { truck1.position.y = Math.abs(Math.sin(t * 9)) * 0.04; });
      ctx.after(1, () => fact('🏭', 'Sawmills are built near forests because logs are heavy to haul.'));
      await ctx.ride(truck1, ROAD.slice(1).map(p => [p[0], p[1]]), { speed: 10.5 });
      bump(); ctx.lock(); ctx.player.visible = false; done();

      // ---------- chapter 3: the sawmill ----------
      await ctx.chapter({ n: 3, title: 'The Sawmill', emoji: '🏭', env: ['factory', { ground: 0x9a927f, fog: [45, 110], groundSize: 1400 }], at: [X2 - 8, -1.6], face: PI, music: 'factory', cam: { yaw: 0, pitch: 0.43, dist: 10.5 }, setup: () => showZone(2) });
      ctx.unlock(); ctx.player.visible = true; ctx.bounds(X2 - 18, -4.5, X2 + 18, 6.2);
      ctx.say(sawyer, 'First, the bark comes off! 🌲');
      ctx.goal('💪', 'Push the log in', [X2 - 12.6, -4.6]);
      debark.userData.fast = true; let chipT = 0, barkFact = false; const x0 = X2 - 13.2, x1 = X2 - 5.6;
      await holdJob({ at: [X2 - 12.6, -4.6], icon: '💪', label: 'Push', hold: 2.2, r: 3.0, y: 2.0, loop: 'machine', face: [X2 - 9, -6] }, (f, dt, working) => {
        if (working && !barkFact) { barkFact = true; fact('🌲', 'Bark can hide sand and stones that would blunt the saw.'); }
        const e = f * f * (3 - 2 * f); mlog.position.x = x0 + (x1 - x0) * e;
        const pass = Math.max(0, Math.min(1, (mlog.position.x + 1.7 - (X2 - 9.2)) / 3.4)); sleeve.scale.y = Math.max(0.001, 1 - pass); sleeve.position.x = -1.7 * pass; sleeve.visible = pass < 0.999;
        if (working && pass > 0 && pass < 1) { chipT -= dt; if (chipT <= 0) { chipT = 0.12; ctx.burst([X2 - 9.2, 1.3, -5.4], { color: W.bark, n: 4, speed: 2, size: 0.2, y: 0 }); } }
      });
      debark.userData.fast = false; sleeve.visible = false; mlog.position.x = x1; done();
      ctx.say(sawyer, 'Now slice it into boards! ⚙️');
      ctx.goal('⚙️', 'Pull the lever', lever2);
      let cuts = 0, sawing = false; const boardsCut = [];
      const sawIt = ctx.interact({ at: lever2, icon: '⚙️', label: 'Saw', once: false, y: 1.9, r: 2.4, when: () => !sawing && cuts < 3, onUse: async () => {
        sawing = true; if (!cuts) fact('💡', 'In big mills, lasers scan each log to plan the cuts.'); ctx.tween(stick2.rotation, { z: -0.55 }, 0.2); blade.userData.fast = true; ctx.audio.play('machine');
        const dust = ctx.every(0.09, () => { const lx = carriage.position.x - (X2 + 0.5); if (Math.abs(lx) < 1.9) { ctx.burst([X2 + 0.5, 1.4, -5.3], { color: 0xf2d9a0, n: 5, speed: 2.6, size: 0.17, y: 0 }); } });
        const sfx = ctx.every(0.3, () => { if (Math.abs(carriage.position.x - (X2 + 0.5)) < 2) ctx.audio.play('saw'); });
        const mv = ctx.onUpdate(() => { mlog.position.x = carriage.position.x; });
        const fastK = cuts ? 0.58 : 1; await ctx.tween(carriage.position, { x: X2 + 6.2 }, 2.3 * fastK, 'inOut');
        dust(); sfx();
        const b = tintable(group([box(3.4, 0.62 - cuts * 0.06, 0.09, 0xffffff, [0, 0, 0])]), W.wet); b.position.set(X2 + 6.2, 1.2, -5.5); ctx.add(b); boardsCut.push(b);
        mlog.scale.z = 1 - (cuts + 1) * 0.2; mlog.position.z = -6 - (cuts + 1) * 0.08;
        ctx.tween(b.rotation, { x: PI / 2 }, 0.4 * fastK); ctx.tween(b.position, { x: X2 + 6.6, z: -2.4 }, 0.5 * fastK, 'out'); await ctx.tween(b.position, { y: 2.0 }, 0.22 * fastK, 'out'); await ctx.tween(b.position, { y: 0.32 + cuts * 0.1 }, 0.28 * fastK, 'in'); ctx.audio.play('thud'); ctx.emote(b, '👍', { y: 0.6 });
        blade.userData.fast = false; await ctx.tween(carriage.position, { x: X2 - 5.6 }, 1.1 * fastK, 'inOut'); mv(); mlog.position.x = carriage.position.x;
        ctx.tween(stick2.rotation, { z: 0.55 }, 0.2); cuts++; sawing = false; if (cuts < 3) ctx.goal('⚙️', cuts === 2 ? '1 more board' : '2 more boards', lever2);
      } });
      await ctx.until(() => cuts >= 3); sawIt.remove(); done();
      // carry the fresh boards to the kiln cart
      ctx.say(kilnOp, 'Wet wood warps. Bring it here! 🔥', 3.4);
      const bundle = new THREE.Group(); bundle.position.set(X2 + 6.6, 0.3, -2.4); ctx.add(bundle); boardsCut.forEach((b, i) => { bundle.attach(b); });
      ctx.goal('💪', 'Lift the boards', bundle);
      await useAt({ at: bundle, icon: '💪', label: 'Lift', y: 1.3, r: 2.8 });
      palletCol.remove(); ctx.carry(bundle, { y: 0.07 }); bundle.position.z = 0.17; /* the stack rests on the two straight arms, clear of chest and chin */ ctx.goal('🔥', 'Stack on the cart', cart);
      await useAt({ at: cart, icon: '🔥', label: 'Stack', y: 2.0, r: 3.0 });
      ctx.drop(); cart.add(bundle); bundle.rotation.set(0, 0, 0); bundle.position.set(0, 0.92, 0); boardsCut.forEach((b, i) => { b.position.set(0, i * 0.17, (i - 1) * 0.0); b.rotation.set(PI / 2, 0, 0); b.scale.set(0.96, 1, 1); });
      const stickers = bake(group([0, 1, 2].flatMap(i => [-1.2, 0, 1.2].map(x => box(0.09, 0.08, 0.7, 0x9a7446, [x, i * 0.17 - 0.085, 0]))))); bundle.add(stickers);
      ctx.audio.play('thud'); ctx.lock(); kdoor.visible = true; cartCol.remove();
      await ctx.wait(0.5); ctx.audio.play('machine'); await ctx.tween(cart.position, { z: -11.4 }, 1.6, 'inOut');
      await ctx.tween(kdoor.position, { y: 1.75 }, 0.7, 'in'); ctx.audio.play('thud'); ctx.audio.play('kiln'); ctx.unlock();
      const steam = ctx.every(0.3, () => ctx.burst([X2 + 15, 7.4, -12.5], { color: 0xffffff, n: 3, speed: 0.6, size: 0.5, y: 0 }));
      ctx.goal('🔥', 'Dry the wood');
      await kilnGame();
      ctx.lock(); await ctx.tween(kdoor.position, { y: 5.4 }, 0.7); ctx.audio.play('steam'); for (let i = 0; i < 5; i++) ctx.burst([X2 + 12.6, 1.6 + i * 0.4, -8.2], { color: 0xffffff, n: 8, speed: 2, size: 0.5 });
      boardsCut.forEach(b => b.userData.tint.color.setHex(W.dry)); await ctx.tween(cart.position, { z: -4.4 }, 1.4, 'inOut'); ctx.collideBox(X2 + 12.6, -4.4, 1.6, 3.7); steam(); ctx.unlock(); done(); ctx.goal('✨', 'Dry and ready!');
      fact('💧', 'Fresh-cut wood is nearly half water, so drying takes weeks.');
      ctx.thank('🏭', ['Sawyers', 'Mill workers', 'Kiln operators']);
      kilnOp.userData.anim = 'clap'; await ctx.wait(3.2); await factSeen();

      // ---------- chapter 4: the workshop ----------
      ctx.bounds(null);
      await ctx.chapter({ n: 4, title: 'The Workshop', emoji: '🔨', env: ['indoor', { ground: 0xb08f5e, top: '#d9c9a8', bottom: '#efe2c4', fog: false, groundSize: 1400 }], at: [X3 - 3.4, -1.4], face: PI * 0.8, music: 'calm', cam: { yaw: 0, pitch: 0.45, dist: 9.5 }, setup: () => showZone(3) });
      ctx.bounds(X3 - 11.7, -9.6, X3 + 11.7, 3.6);
      ctx.every(6, () => { if (Math.hypot(ctx.player.position.x - cat.position.x, ctx.player.position.z - cat.position.z) < 9) ctx.emote(cat, '💤', { y: 0.6 }); });
      ctx.say(maker, 'Rough boards! Plane them flat 😊');
      ctx.goal('📏', 'Plane the boards', [X3, -4]);
      let pl = 0, curlT = 0;
      await holdJob({ at: [X3, -4], icon: '📏', label: 'Plane', hold: 2.6, r: 2.9, y: 1.9, loop: 'saw', face: [X3, -4] }, (f, dt, working) => {
        pl = Math.max(pl, f); const bi = Math.min(2, Math.floor(pl * 3)), u = pl * 3 - bi;
        boards.forEach((b, i) => { if (i < bi || pl >= 1) { b.userData.tint.color.setHex(W.planed); b.userData.rough.visible = false; } });
        planeTool.position.set(X3 + (pl >= 1 ? 2.0 : 1.3 - u * 2.6), 0.86 + TB.t, -4 + (pl >= 1 ? 0.95 : (1 - bi) * (TB.d / 3 + GAP)));
        if (working) { curlT -= dt; if (curlT <= 0) { curlT = 0.12; ctx.burst([planeTool.position.x, 1.0, planeTool.position.z], { color: 0xf6e3b4, n: 4, speed: 1.4, size: 0.2, y: 0 }); } }
      });
      done();
      // glue and clamp
      ctx.say(maker, 'Glue them edge to edge! 💧');
      ctx.goal('💧', 'Glue the top', [X3, -4]);
      await useAt({ at: [X3, -4], icon: '💧', label: 'Glue', r: 2.9, y: 1.9, sfx: 'pour' });
      ctx.lock(); ctx.player.userData.forceAnim = 'work'; fact('💪', 'Dried wood glue holds even tighter than the wood itself!');
      for (const z of [-1, 1]) for (let i = 0; i < 5; i++) ctx.burst([X3 - 1.2 + i * 0.6, 0.98, -4 + z * (TB.d / 6 + GAP / 2)], { color: 0xfff2a8, n: 2, speed: 0.5, size: 0.14, y: 0 });
      await ctx.wait(0.5); boards.forEach((b, i) => ctx.tween(b.position, { z: (i - 1) * TB.d / 3 }, 0.5, 'inOut')); await ctx.wait(0.5); ctx.audio.play('knock');
      clamps.forEach(c => { c.visible = true; }); await Promise.all(clamps.map((c, i) => ctx.tween(c.position, { y: TB.t * 0.5 }, 0.45 + i * 0.12, 'outBounce'))); ctx.audio.play('clink'); ctx.player.userData.forceAnim = null;
      ctx.emote([X3, 1, -4], '⏳', { y: 1.2 }); await ctx.wait(1.3);
      await Promise.all(clamps.map(c => ctx.tween(c.position, { y: 3.4 }, 0.4, 'in'))); clamps.forEach(c => ctx.remove(c));
      apron.visible = true; await ctx.tween(apron.position, { y: TB.t + 0.065 }, 0.6, 'outBounce'); ctx.audio.play('knock'); ctx.unlock(); done();
      // legs: mortise and tenon
      ctx.say(maker, 'Legs slot into the corners! 🔨');
      const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]]; let taken = 0, fitted = 0;
      ctx.goal('🔨', 'Fit 4 legs', [X3 - 6.2, -1.6]);
      const rackIt = ctx.interact({ at: [X3 - 6.2, -1.6], icon: '✋', label: 'Take a leg', once: false, r: 2.3, y: 1.7, when: () => !ctx.carrying && taken < 4, onUse: () => { const l = legs[3 - taken]; taken++; ctx.carry(l, { y: 0.18 }); l.rotation.z = PI / 2; l.position.z = -0.05; ctx.goal('🔨', 'Slot it in', [X3, -4]); } });
      const marks = corners.map(([sx, sz]) => { const m = box(0.26, 0.05, 0.26, 0xffd84a, [sx * TB.lx, TB.t + 0.16, sz * TB.lz]); m.material = mat(0xffd84a, { opacity: 0.6 }); tbl.add(m); return m; });
      corners.forEach(([sx, sz], ci) => ctx.interact({ at: [X3 + sx * (TB.lx + 0.5), -4 + sz * (TB.lz + 0.5)], icon: '🔨', label: 'Fit', r: sz < 0 ? 3.6 : 2.1, y: 1.9, sfx: 'hammer', when: () => !!ctx.carrying, onUse: async () => {
        const l = ctx.drop(); tbl.add(l); tbl.remove(marks[ci]); marks[ci].geometry.dispose(); l.rotation.set(0, sx > 0 ? (sz > 0 ? -PI / 2 : PI) : (sz > 0 ? 0 : PI / 2), PI); const y = TB.t + (TB.h - TB.t) / 2; l.position.set(sx * TB.lx, y + 0.7, sz * TB.lz);
        fitted++; if (fitted === 1) fact('🔨', 'A tenon on the leg locks into a slot: the mortise.');
        await ctx.tween(l.position, { y: y + 0.12 }, 0.3, 'in'); ctx.audio.play('hammer'); await ctx.wait(0.16); l.position.y = y + 0.05; ctx.audio.play('hammer'); await ctx.wait(0.16); l.position.y = y; ctx.audio.play('knock'); ctx.burst([X3 + sx * TB.lx, 1.05, -4 + sz * TB.lz], { color: 0xf6e3b4, n: 6, speed: 1.2, size: 0.14, y: 0 });
        if (fitted < 4) ctx.goal('🔨', fitted === 3 ? '1 more leg' : (4 - fitted) + ' more legs', [X3 - 6.2, -1.6]);
      } }));
      await ctx.until(() => fitted >= 4); rackIt.remove(); await ctx.wait(0.5); done();
      // flip it over
      ctx.say(maker, 'Ready? Flip it over! 🙌'); ctx.goal('🙌', 'Flip the table', [X3, -4]);
      await useAt({ at: [X3, -4], icon: '🙌', label: 'Flip', r: 3.0, y: 2.2, sfx: 'whoosh' });
      ctx.lock(); const q = ctx.player.position; if (q.z < -2.7) { ctx.tp(X3 + (q.x < X3 ? -3.0 : 3.0), -1.2, q.x < X3 ? PI / 2 : -PI / 2); } else if (Math.abs(q.x - X3) < 2.4 && q.z < 1.9) await ctx.tween(q, { x: X3 + (q.x < X3 ? -2.9 : 2.9), z: -1.6 }, 0.35);
      ctx.cam.target = { at: [X3, 1, -1.6], dist: 9.5, pitch: 0.55, yaw: 0 }; await ctx.wait(0.5);
      ctx.tween(tbl.rotation, { x: PI }, 1.0, 'inOut'); ctx.tween(tbl.position, { z: -0.4 }, 1.0, 'inOut'); await ctx.tween(tbl.position, { y: 2.7 }, 0.5, 'out'); await ctx.tween(tbl.position, { y: TB.h }, 0.5, 'in');
      ctx.audio.play('thud'); ctx.cam.shake = 0.25; ctx.burst([X3, 0.1, -0.4], { color: 0xe6c98a, n: 14, speed: 2.5 }); ctx.collideBox(X3, -0.4, TB.w + 0.1, TB.d + 0.1);
      maker.userData.anim = 'cheer'; ctx.goal('🙌', 'Ta-da!'); await ctx.wait(0.8); ctx.cam.target = null; ctx.unlock(); ctx.thank('🔨', ['Furniture makers', 'Carpenters', 'Toolmakers']); await ctx.wait(1.4); maker.userData.anim = 'idle';
      // sand
      const parts = [...boards, apron, ...legs];
      ctx.say(maker, 'Sandpaper: rough, then smooth! ✋'); ctx.goal('✋', 'Get the sandpaper', [X3 - 1.5, -3.25]);
      await useAt({ at: [X3 - 1.5, -3.25], icon: '✋', label: 'Sandpaper', r: 2.4, y: 1.6, face: [X3 - 1.5, -4] });
      await sandGame(ctx); // mini-game: rough sheet first, smooth sheet last
      fact('✋', 'Sanders start with rough paper and end with fine.');
      ctx.goal('✋', 'Sand it smooth', [X3, -0.4]); sander.visible = true; sander.position.set(X3 + 1, TB.h + 0.01, -0.4);
      let sd = 0, sdT = 0;
      await holdJob({ at: [X3, -0.4], icon: '✋', label: 'Sand', hold: 2.4, r: 2.7, y: 1.7, loop: 'saw', face: [X3, -0.4] }, (f, dt, working) => {
        sd = Math.max(sd, f); sander.position.set(X3 + Math.sin(sd * 14) * 1.2, TB.h + 0.01, -0.4 + Math.cos(sd * 9) * 0.5);
        if (working) { sdT -= dt; if (sdT <= 0) { sdT = 0.14; ctx.burst([sander.position.x, TB.h + 0.1, sander.position.z], { color: 0xfff2d6, n: 5, speed: 1.2, size: 0.22, y: 0 }); } }
      });
      sander.visible = false; fadeTint(parts, W.sanded, 0.5); ctx.emote([X3, TB.h, -0.4], '✨', { y: 0.6 }); ctx.audio.play('sparkle'); done();
      // finish: brush on oil, walking round the table
      ctx.say(maker, 'Brush oil all around! 🖌️'); oilCan.visible = true; ctx.carry(oilCan, { y: -0.2 }); // held between the hands, the brush below the face
      const spots = [[-1.1, 1.25], [1.1, 1.25], [1.1, -2.05], [-1.1, -2.05]].map(([x, z]) => { const g = group([emojiSprite('🖌️', 0.7, [0, 1.25, 0])], [X3 + x, 0, z]); const d = cyl(0.4, 0.4, 0.03, 0xffd84a, [0, 0.06, 0], null, 12); d.material = mat(0xffd84a, { opacity: 0.55 }); g.add(d); return ctx.add(g); });
      const nearSpot = () => spots.filter(o => o.parent).sort((a, b) => a.position.distanceTo(ctx.player.position) - b.position.distanceTo(ctx.player.position))[0];
      ctx.goal('🖌️', 'Brush all 4 sides', nearSpot());
      let coats = 0; const c0 = new THREE.Color(W.sanded), c1 = new THREE.Color(W.finished);
      await ctx.collect({ items: spots, r: 0.95, spin: false, sfx: 'pour', color: W.finished, onEach: (o, left) => { coats++; if (coats === 1) fact('🖌️', 'Oil or varnish protects the wood from spills.'); const to = c0.clone().lerp(c1, coats / 4).getHex(); fadeTint(parts, to, 0.6); ctx.emote(ctx.player, '🖌️'); if (left) ctx.after(0.05, () => ctx.goal('🖌️', left === 1 ? '1 more side' : left + ' more sides', nearSpot())); } });
      ctx.goal('✨', 'All done!'); await ctx.wait(0.7); ctx.remove(ctx.drop()); ctx.audio.play('sparkle'); for (let i = 0; i < 4; i++) ctx.emote([X3 - 1.2 + i * 0.8, TB.h, -0.4], '✨', { y: 0.5 }); done();
      ctx.thank('🖌️', ['Sanders', 'Finishers', 'Oil and varnish makers']);
      ctx.say(maker, 'Beautiful! Off it goes 🚚', 2.6); maker.userData.anim = 'clap'; await ctx.wait(3); await factSeen();

      // ---------- chapter 5: delivery day ----------
      ctx.bounds(null);
      await ctx.chapter({ n: 5, title: 'Delivery Day', emoji: '🚚', env: ['autumn', { fog: [50, 150], groundSize: 1400 }], at: [X4 - 24, 1.0], face: PI * 1.2, music: 'town', cam: { yaw: 0, pitch: 0.42, dist: 10 }, setup: () => showZone(4) });
      ctx.bounds(X4 - 33.5, -2.9, X4 - 16, 3.6);
      ctx.say(driver, 'Help me load it! 💪');
      ctx.goal('💪', 'Lift the table', tableOut);
      await useAt({ at: tableOut, icon: '💪', label: 'Lift', y: 1.6, r: 3.0 });
      // carried end-on between two people: our end rests on our hands, the far end (a little higher) on the taller driver's, who walks backwards
      tableOutCol.remove(); ctx.carry(tableOut); tableOut.scale.setScalar(0.65); tableOut.rotation.set(-0.12, PI / 2, 0); tableOut.position.set(0, -0.24, 0.98);
      driver.userData.collider && driver.userData.collider.remove(); ctx.say(driver, 'Got the other end! 👍', 2);
      const DV = new THREE.Vector3(); let grip = false, facing = ctx.player.rotation.y;
      const along = ctx.onUpdate((dt) => { const p = ctx.player, a = facing = p.rotation.y, D = 2.336 * p.scale.x + 0.42, du = driver.userData;
        DV.set(p.position.x + Math.sin(a) * D, 0, p.position.z + Math.cos(a) * D);
        if (!grip) { // he hurries round to the far end
          const dx = DV.x - driver.position.x, dz = DV.z - driver.position.z, d = Math.hypot(dx, dz), s = 8 * dt;
          if (d <= s) grip = true; else { driver.position.x += dx / d * s; driver.position.z += dz / d * s; driver.rotation.y = Math.atan2(dx, dz); du.anim = 'run'; return; } }
        // the pair moves as one: where the driver cannot step back (the van, the workshop wall), we cannot push on
        for (const [bx, bz, bw, bd] of [[X4 - 19.5, -1.8, 2.6, 6.8], [X4 - 27.5, -6.5, 11.2, 7.2]]) { const l = DV.x - (bx - bw / 2 - 0.4), r = bx + bw / 2 + 0.4 - DV.x, n = DV.z - (bz - bd / 2 - 0.4), f = bz + bd / 2 + 0.4 - DV.z, m = Math.min(l, r, n, f); if (m <= 0) continue;
          const cx = m === l ? -m : m === r ? m : 0, cz = cx ? 0 : m === n ? -m : m; DV.x += cx; DV.z += cz; p.position.x += cx; p.position.z += cz; }
        const bb = ctx._bounds; if (bb) { const cx = Math.max(bb.x1, Math.min(bb.x2, p.position.x)) - p.position.x, cz = Math.max(bb.z1, Math.min(bb.z2, p.position.z)) - p.position.z; p.position.x += cx; p.position.z += cz; DV.x += cx; DV.z += cz; } // ...but never out of the play area (so the Load prompt stays in reach from every side)
        du.anim = Math.hypot(DV.x - driver.position.x, DV.z - driver.position.z) > dt * 0.6 ? 'walk' : 'idle'; du.carrying = true;
        driver.position.x = DV.x; driver.position.z = DV.z; driver.rotation.y = a + PI; });
      ctx.goal('🚚', 'Load the van', van);
      // (the pair is 2.3 m longer than one person, so the van is reached that much sooner; and with a table between two people we do not spin round to face the van when E is pressed)
      await new Promise(res => ctx.interact({ at: van, icon: '🚚', label: 'Load', y: 3.3, r: 5.6, onUse: () => { ctx.player.rotation.y = facing; along(); res(); } }));
      driver.userData.carrying = false; driver.userData.anim = 'work'; ctx.lock(); { const wp = tableOut.getWorldPosition(new THREE.Vector3()), tb = ctx.drop(); tb.position.copy(wp); tb.rotation.set(0, ctx.player.rotation.y + PI / 2, 0); tb.scale.setScalar(0.65 * ctx.player.scale.x); ctx.add(tb); ctx.tween(tb.scale, { x: 0.4, y: 0.4, z: 0.4 }, 0.7); ctx.tween(tb.position, { x: X4 - 19.5, z: -2.6 }, 0.7, 'inOut'); await ctx.tween(tb.position, { y: 3.6 }, 0.35, 'out'); await ctx.tween(tb.position, { y: 2.2 }, 0.35, 'in'); tb.visible = false; tb.scale.setScalar(0.65); }
      ctx.audio.play('thud'); ctx.burst([X4 - 19.5, 3.2, -2.6], { color: 0xfff2a8, n: 10, size: 0.2 }); ctx.emote(van, '📦', { y: 3.4 }); ctx.unlock(); done(); fact('📦', 'Movers wrap furniture in thick blankets so it won’t scratch.');
      ctx.say(driver, 'Buckle up! 🚚', 1.4); await ctx.wait(1.0); driver.visible = false; ctx.audio.play('honk'); ctx.goal('🏡', 'To the family!'); ctx.bounds(null); vanCol.remove();
      ctx.after(2.8, () => { ctx.emote(neighbour, '👋', { y: 2.2 }); ctx.say(neighbour, 'Lovely table! 👋', 2); });
      await ctx.ride(van, [[X4 - 19.5, 4.4], [X4 + 23.2, 4.4], [X4 + 23.2, -1.2]], { speed: 8.5 });
      van.rotation.y = PI; vanCol = ctx.collideBox(X4 + 23.2, -1.2, 2.6, 6.8); ctx.tp(X4 + 26.4, 0.9, PI); ctx.bounds(X4 + 20, -3.9, X4 + 34.5, 3.6);
      driver.position.set(X4 + 25.2, 0, -1.6); driver.rotation.y = 0.9; driver.visible = true; driver.userData.anim = 'wave'; driver.userData.collider = ctx.collideObj(driver, 0.4); ctx.audio.play('bell'); ctx.emote(dog, '💛', { y: 1 });
      const wag = ctx.onUpdate((dt, t) => { dog.position.y = Math.abs(Math.sin(t * 8)) * 0.16; dog.rotation.y = Math.atan2(ctx.player.position.x - dog.position.x, ctx.player.position.z - dog.position.z); });
      tableOut.visible = true; ctx.carry(tableOut); tableOut.position.set(0, -0.36, 0.44); ctx.thank('🚚', ['Delivery crews', 'Truck drivers', 'Movers']);
      ctx.goal('🏡', 'Carry it home', [X4 + 29.5, -3.8]);
      await useAt({ at: [X4 + 29.5, -4.3], icon: '🔔', label: 'Knock', y: 2.4, r: 2.4, sfx: 'knock' });
      ctx.audio.play('knock'); wag(); ctx.goal('🏡', 'Knock, knock!'); await ctx.wait(0.6);

      // ---------- chapter 6: the dining room ----------
      ctx.bounds(null);
      await ctx.chapter({ n: 6, title: 'Home', emoji: '🏡', env: ['indoor', { ground: 0xa5774c, top: '#f3dfb8', bottom: '#f8ead0', fog: false, groundSize: 1400 }], at: [X5, 0.9], face: PI, music: 'table', cam: { yaw: 0, pitch: 0.43, dist: 9.5 }, setup: () => showZone(5) });
      ctx.bounds(X5 - 7.6, -7.6, X5 + 7.6, 3.4);
      ctx.say(kid, 'Our new table! 😍', 2.4); kid.userData.anim = 'cheer'; ctx.after(2.4, () => { kid.userData.anim = 'idle'; });
      ctx.goal('🍽️', 'Set it down', [X5, -2.4]);
      await useAt({ at: [X5, -2.4], icon: '🍽️', label: 'Set down', r: 3.0, y: 1.4 });
      ctx.lock(); const tt = ctx.drop(); tt.visible = true; tt.scale.setScalar(1); tt.rotation.set(0, 0, 0); tt.position.set(X5, 1.6, -2.4); ctx.add(tt);
      const pq = ctx.player.position; if (Math.abs(pq.x - X5) < 2.2 && Math.abs(pq.z + 2.4) < 1.5) ctx.tween(pq, { z: -0.2 }, 0.3);
      await ctx.tween(tt.position, { y: 0.05 }, 0.5, 'outBounce'); ctx.audio.play('thud'); ctx.collideBox(X5, -2.4, TB.w + 0.1, TB.d + 0.1); ctx.unlock(); done(); fact('🍽️', 'A sturdy oak table can last a hundred years or more.');
      family.forEach(p => { if (p !== grandma) p.userData.anim = p === kid ? 'cheer' : 'clap'; }); ctx.after(1.6, () => family.forEach(p => { if (p !== grandma) p.userData.anim = 'idle'; }));
      ctx.say(grandma, 'Now my tablecloth! 🧡');
      ctx.goal('🧡', 'Take the tablecloth', grandma);
      await useAt({ at: grandma, icon: '🧡', label: 'Take', r: 2.6 });
      grandma.userData.anim = 'idle'; ctx.carry(cloth, { y: 0.1 }); cloth.position.z = 0.05;
      ctx.goal('🍽️', 'Spread the cloth', [X5, -2.4]);
      await useAt({ at: [X5, -2.4], icon: '🍽️', label: 'Spread', r: 3.2, y: 1.8, sfx: 'whoosh' });
      ctx.remove(ctx.drop()); ctx.lock();
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.0, 10, 6), new THREE.MeshLambertMaterial({ color: 0xfdf6e6, side: THREE.DoubleSide, flatShading: true })); sheet.rotation.x = -PI / 2; sheet.position.set(X5, 3.6, -2.4); ctx.add(sheet);
      const base = sheet.geometry.attributes.position.array.slice(); const wave = ctx.onUpdate((dt, t) => { const a = sheet.geometry.attributes.position; const k = Math.min(1, (sheet.position.y - TB.h - 0.1) / 1.2); for (let i = 0; i < a.count; i++) a.array[i * 3 + 2] = (Math.sin(base[i * 3] * 2.2 + t * 5) * 0.14 + Math.cos(base[i * 3 + 1] * 3 + t * 4) * 0.09) * k; a.needsUpdate = true; sheet.geometry.computeVertexNormals(); });
      ctx.focus([X5, 1, -2.4], 3.4, { dist: 8.5, pitch: 0.5 });
      await ctx.tween(sheet.position, { y: TB.h + 0.1 }, 2.0, 'inOut'); wave(); ctx.remove(sheet);
      const draped = bake(group([box(TB.w + 0.3, 0.03, TB.d + 0.3, 0xfdf6e6, [0, TB.h + 0.02, 0]), box(TB.w + 0.3, 0.3, 0.02, 0xfdf6e6, [0, TB.h - 0.13, TB.d / 2 + 0.15]), box(TB.w + 0.3, 0.3, 0.02, 0xfdf6e6, [0, TB.h - 0.13, -TB.d / 2 - 0.15]), box(0.02, 0.3, TB.d + 0.3, 0xfdf6e6, [TB.w / 2 + 0.15, TB.h - 0.13, 0]), box(0.02, 0.3, TB.d + 0.3, 0xfdf6e6, [-TB.w / 2 - 0.15, TB.h - 0.13, 0]), box(TB.w + 0.32, 0.05, 0.025, 0xd9622b, [0, TB.h - 0.24, TB.d / 2 + 0.15]), box(0.8, 0.012, TB.d + 0.32, 0xe9a23b, [0, TB.h + 0.04, 0])])); draped.position.set(X5, 0.05, -2.4); ctx.add(draped); ctx.audio.play('whoosh');
      const settings = new THREE.Group(); for (const [x, z] of [[-1.0, -0.45], [0, -0.45], [1.0, -0.45], [-1.0, 0.45], [0, 0.45], [1.0, 0.45]]) { settings.add(cyl(0.19, 0.13, 0.03, C.white, [x, 0, z], null, 12)); settings.add(cyl(0.06, 0.05, 0.13, 0x9fd6f2, [x + 0.27, 0.06, z - 0.1 * Math.sign(z)], null, 7)); }
      settings.add(pumpkin(0.2, [-0.2, 0, 0])); settings.add(cyl(0.035, 0.035, 0.3, C.cream, [0.3, 0.15, 0], null, 6)); settings.add(sphere(0.05, glow(0xffc93c), [0.3, 0.34, 0], 5));
      bake(settings); settings.position.set(X5, TB.h + 0.12, -2.4); settings.scale.setScalar(0.01); ctx.add(settings); await ctx.wait(0.3); ctx.audio.play('clink'); await ctx.tween(settings.scale, { x: 1, y: 1, z: 1 }, 0.5, 'outBack'); ctx.audio.play('sparkle');
      family.forEach((p, i) => { p.userData.anim = i % 2 ? 'laugh' : 'cheer'; }); ctx.say(grandma, 'Happy Thanksgiving! 🧡', 3); ctx.goal('🧡', 'Happy Thanksgiving!'); ctx.unlock(); done();
      ctx.thank('🏡', ['Grandparents', 'Table setters', 'Everyone who gathers round']);
      await ctx.wait(6.5);
      ctx.finish();
    });

    // ---------- mini-game 1: tap the rings (each bold ring = 10 thin yearly rings) ----------
    function ringGame() {
      return new Promise(res => {
        const p = ctx.ui.panel('<div style="font-size:clamp(19px,5.6vw,26px);font-weight:700;margin-bottom:8px"><span class="em">👆</span> Tap the rings!</div><canvas width="360" height="360" style="width:300px;height:300px;cursor:pointer;touch-action:none;display:block;margin:0 auto"></canvas><div class="wt-age" style="font-size:32px;font-weight:700;margin-top:8px;min-width:330px"></div>');
        const cv = p.el.querySelector('canvas'), g = cv.getContext('2d'), out = p.el.querySelector('.wt-age'), N = 8; let n = 0; p.el.addEventListener('contextmenu', (e) => e.preventDefault()); // (a long press on a phone must not open a menu)
        const draw = () => {
          g.clearRect(0, 0, 360, 360); g.save(); g.translate(180, 180);
          g.fillStyle = '#6b4a2f'; g.beginPath(); g.arc(0, 0, 176, 0, 7); g.fill(); g.fillStyle = '#ecd3a0'; g.beginPath(); g.arc(0, 0, 164, 0, 7); g.fill();
          if (n) { g.fillStyle = '#ffc93c'; g.beginPath(); g.arc(0, 0, 160 * n / N, 0, 7); g.fill(); }
          for (let k = 1; k <= 80; k++) { const bold = k % 10 === 0; g.strokeStyle = bold ? 'rgba(110,70,35,.95)' : 'rgba(140,95,50,.45)'; g.lineWidth = bold ? 3 : 1; g.beginPath(); g.ellipse(Math.sin(k * 0.7) * 1.5, 0, 2 * k, 2 * k * 0.985, 0, 0, 7); g.stroke(); }
          g.fillStyle = '#4a2c17'; g.font = '700 16px Fredoka,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 1; i <= n; i++) g.fillText(String(i * 10), 20 * i - 10, 0);
          g.restore();
          out.innerHTML = '<span class="em">' + (n >= N ? '🎂' : '🌳') + '</span> ' + (n * 10) + (n >= N ? ' years old!' : ' years');
        };
        const tap = async (e) => { if (ctx.disposed) { window.removeEventListener('keydown', tap); return; } if (e.type === 'keydown' && (e.repeat || !(e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter'))) return; e.preventDefault(); if (n >= N) return; n++; ctx.audio.tone(300 + n * 60, 0.16, { type: 'triangle', vol: 0.3 }); draw(); if (n === N) { window.removeEventListener('keydown', tap); ctx.audio.play('success'); await ctx.wait(1.7); p.close(); res(); } };
        cv.addEventListener('pointerdown', tap); window.addEventListener('keydown', tap);
        draw();
      });
    }

    // ---------- mini-game 2: the kiln — tap to keep the heat in the green while the water leaves the wood ----------
    function kilnGame() {
      return new Promise(res => {
        const p = ctx.ui.panel('<div style="font-size:clamp(19px,5.6vw,26px);font-weight:700;margin-bottom:6px"><span class="em">🌡️</span> Keep it in the green!</div><canvas width="460" height="210" style="width:460px;max-width:80vw;display:block;margin:0 auto"></canvas><button class="btn big wt-heat" style="margin-top:10px;touch-action:none"><span class="em">🔥</span> Heat</button>');
        const cv = p.el.querySelector('canvas'), g = cv.getContext('2d'), btn = p.el.querySelector('.wt-heat'); let heat = 0.18, prog = 0, week = 0, over = false, flip = 0;
        const LO = 0.42, HI = 0.8; p.el.addEventListener('contextmenu', (e) => e.preventDefault()); // (a long press on a phone must not open a menu)
        const add = (e) => { if (ctx.disposed) { window.removeEventListener('keydown', add); return; } if (e.type === 'keydown' && (e.repeat || !(e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter'))) return; e.preventDefault(); if (over) return; heat = Math.min(1, heat + 0.13); ctx.audio.play('fire'); };
        btn.addEventListener('pointerdown', add); btn.addEventListener('click', (e) => e.preventDefault()); window.addEventListener('keydown', add);
        const draw = () => {
          g.clearRect(0, 0, 460, 210);
          // gauge
          g.fillStyle = '#e6d9c0'; g.beginPath(); g.roundRect(20, 150, 420, 34, 17); g.fill(); g.fillStyle = '#7fc8ff'; g.beginPath(); g.roundRect(20, 150, 420 * LO, 34, [17, 0, 0, 17]); g.fill(); g.fillStyle = '#6fcf6a'; g.fillRect(20 + 420 * LO, 150, 420 * (HI - LO), 34); g.fillStyle = '#f07a5a'; g.beginPath(); g.roundRect(20 + 420 * HI, 150, 420 * (1 - HI), 34, [0, 17, 17, 0]); g.fill();
          const nx = 20 + 420 * heat; g.fillStyle = '#4a2c17'; g.beginPath(); g.moveTo(nx, 158); g.lineTo(nx - 12, 136); g.lineTo(nx + 12, 136); g.fill(); g.fillRect(nx - 2.5, 150, 5, 34);
          // boards with water drops that leave as the wood dries
          const dryC = (a, b) => Math.round(a + (b - a) * prog);
          for (let i = 0; i < 3; i++) { g.fillStyle = 'rgb(' + dryC(207, 239) + ',' + dryC(159, 220) + ',' + dryC(92, 174) + ')'; g.beginPath(); g.roundRect(30, 30 + i * 30, 250, 20, 5); g.fill(); g.fillStyle = '#9a7446'; for (const x of [60, 150, 240]) g.fillRect(x, 50 + i * 30, 12, 10); }
          g.font = '26px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          const drops = Math.ceil((1 - prog) * 5); for (let i = 0; i < drops; i++) g.fillText('💧', 60 + i * 48, 22 - ((ctx.time * 30 + i * 9) % 12));
          // calendar: the weeks go by
          g.save(); g.translate(370, 66); g.scale(1, 1 - flip * 0.8); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-52, -50, 104, 100, 12); g.fill(); g.fillStyle = '#d9483b'; g.beginPath(); g.roundRect(-52, -50, 104, 30, [12, 12, 0, 0]); g.fill();
          g.fillStyle = '#fff'; g.font = '700 20px Fredoka,sans-serif'; g.fillText('WEEK', 0, -34); g.fillStyle = '#4a2c17'; g.font = '700 50px Fredoka,sans-serif'; g.fillText(String(week + 1), 0, 18); g.restore();
        };
        const stop = ctx.onUpdate((dt) => {
          if (over) return; heat = Math.max(0, heat - dt * 0.17); flip = Math.max(0, flip - dt * 4);
          if (heat >= LO && heat <= HI) { prog = Math.min(1, prog + dt / 6.5); const w = Math.min(4, Math.floor(prog * 5)); if (w !== week) { week = w; flip = 1; ctx.audio.play('click'); } }
          p.el.dataset.heat = heat.toFixed(2); draw();
          if (prog >= 1) { over = true; stop(); window.removeEventListener('keydown', add); btn.innerHTML = '<span class="em">✅</span> Dry!'; ctx.audio.play('success'); ctx.after(1.3, () => { p.close(); res(); }); }
        });
        draw();
      });
    }
  },
};
