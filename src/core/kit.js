// kit.js — shared low-poly building blocks. Everything visual in the game is made from these,
// so all scenes share one look. Units are metres. Objects face +Z. Y is up.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export { THREE };

// ---------- palette ----------
export const C = {
  skin: [0xf2c9a0, 0xe0a878, 0xc68650, 0x8d5a35, 0xffdcb8, 0x6b4226],
  hair: [0x3a2a1a, 0x1c1c1c, 0x8a5a2b, 0xd9a441, 0xb5b5b5, 0xeeeeee, 0xa33d1e],
  grass: 0x7dbb55, grassDark: 0x5e9e44, dirt: 0x9a6b43, soil: 0x6b4a2f, sand: 0xe6cf9a,
  wood: 0xa8743f, woodDark: 0x6e4a28, woodLight: 0xd2a567, stone: 0x9a9a94, stoneDark: 0x6f6f6a,
  red: 0xd9483b, barn: 0xb5382c, orange: 0xe98a2b, yellow: 0xf2c43d, green: 0x4f9d4a, leaf: 0x5aa845,
  blue: 0x3f7fd1, sky: 0x8fd0ff, navy: 0x2b3f66, purple: 0x7b4fb0, pink: 0xe88fb0, cream: 0xf6ecd6,
  white: 0xfafafa, black: 0x222222, gray: 0x8c8c8c, grayLight: 0xc9c9c9, metal: 0xaab4bd, steel: 0x6d7a86,
  water: 0x4aa3df, glass: 0xbfe6f5, brick: 0xb4563c, concrete: 0xb8b4aa, gold: 0xe8b63a, cranberry: 0xb0122e,
  autumn: [0xd9622b, 0xe9a23b, 0xc23b22, 0xe0c040],
};

// ---------- materials (cached) ----------
const matCache = new Map();
/** Plain flat-shaded coloured material. Cached per colour. opts: {emissive, opacity, side, basic, rough} */
export function mat(color, opts) {
  if (color && color.isMaterial) return color;
  const key = color + '|' + (opts ? JSON.stringify(opts) : '');
  let m = matCache.get(key);
  if (m) return m;
  const o = opts || {};
  if (o.basic) m = new THREE.MeshBasicMaterial({ color });
  else m = new THREE.MeshLambertMaterial({ color, flatShading: !!o.flat });
  if (o.emissive !== undefined) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.emissiveIntensity ?? 1; }
  if (o.opacity !== undefined && o.opacity < 1) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
  if (o.side === 'double') m.side = THREE.DoubleSide;
  m.userData.shared = true;
  // "plain" materials can be merged into one vertex-coloured mesh by bake()
  if (!m.transparent && o.emissive === undefined) m.userData.bakeKind = o.basic ? 'basic' : (o.side === 'double' ? 'lambert2' : 'lambert');
  matCache.set(key, m);
  return m;
}
/** Unlit, always-bright colour (lamps, screens, glowing windows). */
export const glow = (color) => mat(color, { basic: true });

const vcLambert = new THREE.MeshLambertMaterial({ vertexColors: true }); vcLambert.userData.shared = true;
const vcLambert2 = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); vcLambert2.userData.shared = true;
const vcFlat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }); vcFlat.userData.shared = true;   // faceted look (used for people)
const vcFlat2 = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }); vcFlat2.userData.shared = true;
const vcBasic = new THREE.MeshBasicMaterial({ vertexColors: true }); vcBasic.userData.shared = true;

// ---------- level of detail ----------
// On computers without a graphics card the cost is mostly the number of triangles, so the game lowers the
// roundness of curved shapes a little there (setDetail(0.7)); shapes that are already coarse (≤ 6 sides) are kept.
let DETAIL = 1;
export function setDetail(d) { DETAIL = d; }
/** true on computers without a graphics card — scenes may leave out tiny decorations then */
export const lowDetail = () => DETAIL < 1;
const sg = (n) => (DETAIL === 1 || n <= 6) ? n : Math.max(6, Math.round(n * DETAIL));

// ---------- primitives ----------
function place(m, pos, rot) {
  if (pos) m.position.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
  if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  return m;
}
function mesh(geo, color) { const m = new THREE.Mesh(geo, mat(color)); m.castShadow = true; m.receiveShadow = true; return m; }
/** box(w,h,d,color,[x,y,z],[rx,ry,rz]) — centred on its position. */
export const box = (w, h, d, color, pos, rot) => place(mesh(new THREE.BoxGeometry(w, h, d), color), pos, rot);
/** cyl(radiusTop, radiusBottom, height, color, pos, rot, segments=10) — axis is Y. */
export const cyl = (rt, rb, h, color, pos, rot, seg = 10) => place(mesh(new THREE.CylinderGeometry(rt, rb, h, sg(seg)), color), pos, rot);
export const cone = (r, h, color, pos, rot, seg = 10) => place(mesh(new THREE.ConeGeometry(r, h, sg(seg)), color), pos, rot);
export const sphere = (r, color, pos, seg = 10) => place(mesh(new THREE.SphereGeometry(r, sg(seg), Math.max(DETAIL < 1 ? 5 : 6, Math.round(sg(seg) * 0.7))), color), pos);
/** squashed / stretched sphere: ball(rx,ry,rz,color,pos) */
export const ball = (rx, ry, rz, color, pos, rot, seg = 10) => { const m = sphere(1, color, pos, seg); m.scale.set(rx, ry, rz); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); return m; };
export const torus = (r, tube, color, pos, rot, seg = 14) => place(mesh(new THREE.TorusGeometry(r, tube, DETAIL < 1 ? 5 : 6, sg(seg)), color), pos, rot);
/** flat horizontal rectangle lying on the ground (y is its height above ground, default .02). */
export const plane = (w, d, color, pos, rot) => { const m = mesh(new THREE.PlaneGeometry(w, d), color); m.rotation.x = -Math.PI / 2; m.castShadow = false; if (pos) m.position.set(pos[0] || 0, pos[1] ?? 0.02, pos[2] || 0); if (rot) m.rotation.z = rot; return m; };
/** flat horizontal disc. */
export const disc = (r, color, pos, seg = 20) => { const m = mesh(new THREE.CircleGeometry(r, sg(seg)), color); m.rotation.x = -Math.PI / 2; m.castShadow = false; if (pos) m.position.set(pos[0] || 0, pos[1] ?? 0.02, pos[2] || 0); return m; };
/** lathe([[r,y],[r,y]...], color) — spin a profile round the Y axis (bowls, bottles, plates, vases). */
export const lathe = (pts, color, pos, seg = 14) => { const m = mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), sg(seg)), color); m.material = mat(color, { side: 'double' }); return place(m, pos); };
/** tube([[x,y,z]...], radius, color) — a smooth pipe / rope / vine through points. */
export const tube = (pts, r, color, seg = 5) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))), Math.max(8, pts.length * 6), r, seg), color);
/** group(...children) with optional position. */
export function group(children = [], pos, rot) { const g = new THREE.Group(); for (const c of children) if (c) g.add(c); return place(g, pos, rot); }

export const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
/** deterministic random generator so a scene looks the same every visit: const r = seeded(7); r() -> 0..1 */
export function seeded(seed = 1) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export function angleTo(cur, target) { let d = (target - cur) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

// ---------- baking: merge many static meshes into one draw call ----------
/**
 * bake(root) — merges every plain-coloured mesh under root into ONE vertex-coloured mesh
 * (big performance win: draw calls are the main cost here). Meshes under a node with
 * userData.dynamic = true, textured / transparent / emissive meshes and sprites are left alone.
 * Call it on scenery that never moves relative to root. root itself can still be moved afterwards.
 */
/** bake with a faceted (flat-shaded) result — the people are made this way */
export const bakeFlat = (root) => bake(root, { flat: true });
export function bake(root, opts = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = { lambert: [], lambert2: [], basic: [], flat: [], flat2: [] };
  const remove = [];
  const walk = (o, dyn) => {
    if (o !== root && o.userData.dynamic) return;
    if (o.isMesh && o.userData.baked && o !== root && !o.userData.noBake && o.visible && o.parent !== root) {
      // an already-baked mesh nested deeper (e.g. a prop inside a scenery group): fold it in, keeping its colours
      const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      buckets[o.material === vcBasic ? 'basic' : o.material === vcFlat ? 'flat' : o.material === vcFlat2 ? 'flat2' : o.material === vcLambert2 ? (opts.flat ? 'flat2' : 'lambert2') : (opts.flat ? 'flat' : 'lambert')].push(g); remove.push(o);
    } else if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.material && o.material.userData && o.material.userData.bakeKind && !o.userData.noBake && !o.userData.baked && o.visible) {
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      const n = g.attributes.position.count, col = new Float32Array(n * 3), c = o.material.color;
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      { const kind = o.material.userData.bakeKind; buckets[opts.flat && kind === 'lambert' ? 'flat' : opts.flat && kind === 'lambert2' ? 'flat2' : kind].push(g); }
      remove.push(o);
    }
    for (const ch of o.children.slice()) walk(ch);
  };
  walk(root);
  for (const o of remove) { if (o === root) continue; o.parent && o.parent.remove(o); o.geometry.dispose(); }
  for (const kind of ['lambert', 'lambert2', 'basic', 'flat', 'flat2']) {
    const list = buckets[kind];
    if (!list.length) continue;
    const merged = mergeGeometries(list, false);
    list.forEach(g => g.dispose());
    const m = new THREE.Mesh(merged, kind === 'lambert' ? vcLambert : kind === 'lambert2' ? vcLambert2 : kind === 'flat' ? vcFlat : kind === 'flat2' ? vcFlat2 : vcBasic);
    m.castShadow = kind !== 'basic'; m.receiveShadow = kind !== 'basic';
    m.userData.baked = true;
    root.add(m);
  }
  // prune empty groups
  const prune = (o) => { for (const ch of o.children.slice()) { prune(ch); if (ch.isGroup && !ch.children.length && !ch.userData.keep && !ch.userData.dynamic) o.remove(ch); } };
  prune(root);
  return root;
}

/** dispose geometries / non-shared materials / textures under an object. */
export function dispose(root) {
  root.traverse(o => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) { if (m.userData && m.userData.shared) continue; if (m.map && !m.map.userData.shared) m.map.dispose(); m.dispose(); }
  });
}

// ---------- canvas textures: emoji, text, drawings ----------
const texCache = new Map();
/** canvasTex(w,h,(ctx,w,h)=>{...}) — draw your own texture with the 2D canvas API. */
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = DETAIL < 1 ? 1 : 2;
  return t;
}
export function emojiTex(emoji, size = 128) {
  const key = 'e' + emoji + size; let t = texCache.get(key); if (t) return t;
  t = canvasTex(size, size, (g) => { g.font = (size * 0.78) + 'px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, size / 2, size / 2 + size * 0.04); });
  t.userData.shared = true; texCache.set(key, t); return t;
}
/** An emoji that always faces the camera. size in metres. */
export function emojiSprite(emoji, size = 1, pos) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(emoji), transparent: true, depthWrite: false }));
  s.scale.set(size, size, 1); return place(s, pos);
}
/** Text (or emoji+text) texture on a rounded board. opts: {bg, fg, size(px), pad, font, radius, border} */
export function textTex(text, opts = {}) {
  const size = opts.size || 64, pad = opts.pad ?? size * 0.4, font = (opts.weight || '600') + ' ' + size + 'px ' + (opts.font || 'Fredoka,"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji","DejaVu Sans",Arial,sans-serif');
  const m = document.createElement('canvas').getContext('2d'); m.font = font;
  const lines = String(text).split('\n');
  const w = Math.ceil(Math.max(...lines.map(l => m.measureText(l).width)) + pad * 2), h = Math.ceil(size * 1.25 * lines.length + pad * 2);
  const t = canvasTex(w, h, (g) => {
    if (opts.bg !== null) { g.fillStyle = opts.bg || '#fff8e8'; const r = opts.radius ?? size * 0.35; g.beginPath(); g.roundRect(0, 0, w, h, r); g.fill(); if (opts.border) { g.strokeStyle = opts.border; g.lineWidth = size * 0.12; g.stroke(); } }
    g.font = font; g.fillStyle = opts.fg || '#4a2c17'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => g.fillText(l, w / 2, pad + size * 1.25 * (i + 0.5) + size * 0.05));
  });
  t.userData.aspect = w / h; return t;
}
/** A flat sign board (a plane facing +Z) with text/emoji. height in metres. */
export function sign(text, height = 0.6, opts = {}, pos, rot) {
  const t = textTex(text, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(height * t.userData.aspect, height), new THREE.MeshBasicMaterial({ map: t, transparent: opts.bg === null, side: THREE.DoubleSide }));
  m.userData.width = height * t.userData.aspect;
  return place(m, pos, rot);
}
/** Text that always faces the camera. */
export function label(text, height = 0.5, opts = {}, pos) {
  const t = textTex(text, opts);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(height * t.userData.aspect, height, 1); return place(s, pos);
}
/** A flat picture (plane facing +Z) from your own canvas drawing. */
export function picture(w, h, draw, res = 256, pos, rot) {
  const t = canvasTex(res, Math.round(res * h / w), draw);
  return place(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, transparent: true })), pos, rot);
}

let grainTex = null;
/** a soft blotchy light-grey texture that makes big flat surfaces (grass, earth, floors) look natural; it multiplies the material colour. */
export function grain(repeat = 40) {
  if (!grainTex) { grainTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e9e9e9'; g.fillRect(0, 0, w, h); const r = seeded(77);
    for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, rad = 14 + r() * 38, v = r() < 0.5 ? 255 : 200; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(' + v + ',' + v + ',' + v + ',0.22)'); gr.addColorStop(1, 'rgba(' + v + ',' + v + ',' + v + ',0)'); g.fillStyle = gr; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { g.beginPath(); g.arc(x + ox, y + oy, rad, 0, 7); g.fill(); } }
    for (let i = 0; i < 1400; i++) { const v = r() < 0.5 ? 255 : 150; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.16)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 2 + r() * 3); } });
    grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping; grainTex.userData.shared = true; }
  const t = grainTex.clone(); t.needsUpdate = true; t.repeat.set(repeat, repeat); return t;
}
let blobTex = null;
/** soft round fake shadow lying on the ground. */
export function blob(r = 0.45, opacity = 0.3) {
  if (!blobTex) { blobTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }); blobTex.userData.shared = true; }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.renderOrder = 1; m.userData.blob = true;
  return m;
}

// ---------- people ----------
/**
 * person(opts) — a friendly, chunky low-poly person (faceted on purpose), ~1.85 m tall (scale for kids), facing +Z.
 * Arms bend at the elbow; legs are rigid (no knees).
 * opts: { skin, hair (colour), hairStyle: 'short'|'long'|'bun'|'bald'|'pony'|'curly', shirt, pants, shoes,
 *         hat: 'straw'|'cap'|'hardhat'|'chef'|'bonnet'|'hairnet'|'beanie'|'tophat'|'sailor'|'cowboy'|null, hatColor,
 *         apron (colour), dress (colour: long skirt), vest (colour), beard (colour), glasses: bool,
 *         scale (1 adult, .68 child), expressive: bool (animated mouth; costs a draw call), shadow: bool,
 *         seated: true (built permanently sitting: legs are static, 3 fewer draw calls — put root.y so hips (root.y + 0.7*scale) sit on the seat) }
 * Animate by setting p.userData.anim = 'idle'|'walk'|'run'|'wave'|'work'|'dig'|'carry'|'cheer'|'clap'|'laugh'|'talk'|'eat'|'point'|'sew'
 * ('cheer' = both arms up in a V with a little hop; 'clap' = hands clapping in front of the chest)
 * and p.userData.sitting = true to sit. The world calls p.userData.tick(dt, t) for you if you create people with ctx.person().
 * p.userData.hand = Group at right hand (attach tools; it follows the forearm), p.userData.carryAnchor = Group in front of chest.
 * p.userData.lookAt = THREE.Vector3 (world) to make the head turn toward something, or null.
 */
export function person(opts = {}) {
  const o = Object.assign({ skin: C.skin[0], hair: C.hair[0], hairStyle: 'short', shirt: C.blue, pants: C.navy, shoes: 0x3b2b20, scale: 1, shadow: true }, opts);
  const root = new THREE.Group(); root.userData.isPerson = true;
  const hips = new THREE.Group(); hips.position.y = 0.7; root.add(hips);
  // torso
  const torso = new THREE.Group(); hips.add(torso);
  torso.add(cyl(0.21, 0.26, 0.52, o.shirt, [0, 0.26, 0], null, 8));
  torso.add(cyl(0.07, 0.08, 0.1, o.skin, [0, 0.55, 0], null, 6)); // neck
  if (o.apron) { // a bib apron that curves round the front of the body (a flat board let the tummy poke through)
    const am = new THREE.Mesh(new THREE.CylinderGeometry(0.222, 0.274, 0.5, 6, 1, true, -0.95, 1.9), mat(o.apron, { side: 'double' })); am.position.y = 0.25; torso.add(am);
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.274, o.dress ? 0.36 : 0.29, 0.26, 6, 1, true, -0.95, 1.9), mat(o.apron, { side: 'double' })); fl.position.y = -0.13; torso.add(fl); }
  if (o.vest) { torso.add(cyl(0.215, 0.262, 0.5, o.vest, [0, 0.27, -0.012], null, 8)); torso.add(box(0.1, 0.5, 0.05, o.shirt, [0, 0.27, 0.23])); }
  if (o.dress) { torso.add(cyl(0.26, 0.42, 0.66, o.dress, [0, -0.3, 0], null, 10)); }
  else torso.add(cyl(0.25, 0.22, 0.14, o.pants, [0, -0.04, 0], null, 8));
  if (o.seated) for (const sx of [-1, 1]) { // legs bent as on a chair, part of the (static) torso
    const lc = o.dress ? o.dress : o.pants;
    torso.add(cyl(0.1, 0.09, 0.44, lc, [sx * 0.12, -0.03, 0.2], [Math.PI / 2, 0, 0], 6)); torso.add(cyl(0.085, 0.08, 0.42, o.dress ? o.skin : o.pants, [sx * 0.12, -0.25, 0.42], null, 6)); torso.add(box(0.16, 0.1, 0.28, o.shoes, [sx * 0.12, -0.5, 0.47]));
  }
  bakeFlat(torso);
  // head
  const head = new THREE.Group(); head.position.y = 0.84; head.scale.setScalar(1.18); hips.add(head);
  const hs = o.scale < 0.85 ? 1.12 : 1;
  const lo = DETAIL < 1; // low detail: the head stays round, tiny features become very simple shapes
  { const sk = new THREE.Mesh(new THREE.SphereGeometry(0.25 * hs, lo ? 8 : 10, lo ? 6 : 7), mat(o.skin)); sk.castShadow = true; head.add(sk); }
  for (const sx of [-1, 1]) {
    if (lo) { head.add(box(0.055, 0.075, 0.03, 0x222222, [sx * 0.09 * hs, 0.02, 0.232 * hs])); head.add(box(0.075, 0.04, 0.02, 0xf29a8a, [sx * 0.15 * hs, -0.05, 0.2 * hs], [0, sx * 0.5, 0])); }
    else { head.add(ball(0.034, 0.042, 0.03, 0x222222, [sx * 0.09 * hs, 0.02, 0.228 * hs], null, 6)); head.add(ball(0.045, 0.03, 0.03, 0xf29a8a, [sx * 0.15 * hs, -0.05, 0.19 * hs])); }
  }
  const H = o.hair;
  if (o.hairStyle !== 'bald') {
    const hatted = ['cap', 'hardhat', 'beanie', 'hairnet', 'bonnet'].includes(o.hat); // keep hair from poking through close-fitting hats
    const cap = new THREE.Mesh(new THREE.SphereGeometry((hatted ? 0.256 : 0.268) * hs, 10, 7, 0, Math.PI * 2, 0, Math.PI * (hatted ? 0.6 : 0.52)), mat(H)); cap.rotation.x = hatted ? -0.62 : -0.35; head.add(cap);
    if (o.hairStyle === 'long') { head.add(box(0.5 * hs, 0.42, 0.16, H, [0, -0.14, -0.17])); }
    if (o.hairStyle === 'bun') head.add(sphere(0.11, H, [0, 0.2, -0.2], 7));
    if (o.hairStyle === 'pony') { head.add(ball(0.07, 0.2, 0.07, H, [0, -0.05, -0.3], [0.5, 0, 0])); }
    if (o.hairStyle === 'curly' && !hatted) { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; head.add(sphere(0.1, H, [Math.cos(a) * 0.2 * hs, 0.14, Math.sin(a) * 0.2 * hs - 0.03], 6)); } head.add(sphere(0.12, H, [0, 0.24, 0], 6)); }
  }
  if (o.beard) { head.add(ball(0.17, 0.14, 0.1, o.beard, [0, -0.16, 0.14])); }
  if (o.glasses) { for (const sx of [-1, 1]) { const gm = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.007, lo ? 3 : 6, lo ? 7 : 12), mat(0x4a3a2a)); gm.position.set(sx * 0.09, 0.025, 0.245); head.add(gm); } head.add(box(0.06, 0.012, 0.012, 0x4a3a2a, [0, 0.035, 0.25])); }
  const hc = o.hatColor;
  switch (o.hat) {
    case 'straw': head.add(cyl(0.42, 0.44, 0.03, hc ?? 0xe3c878, [0, 0.16, 0], null, 12)); head.add(cyl(0.2, 0.24, 0.16, hc ?? 0xe3c878, [0, 0.25, 0], null, 10)); head.add(cyl(0.245, 0.245, 0.04, 0x8a4b2a, [0, 0.2, 0], null, 10)); break;
    case 'cowboy': head.add(cyl(0.44, 0.46, 0.03, hc ?? 0x8a5a2b, [0, 0.16, 0], null, 12)); head.add(cyl(0.17, 0.24, 0.2, hc ?? 0x8a5a2b, [0, 0.27, 0], null, 10)); break;
    case 'cap': head.add(new THREE.Mesh(new THREE.SphereGeometry(0.275 * hs, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.45), mat(hc ?? C.red))); head.add(box(0.26, 0.03, 0.2, hc ?? C.red, [0, 0.1, 0.3], [0.15, 0, 0])); break;
    case 'hardhat': head.add(new THREE.Mesh(new THREE.SphereGeometry(0.285 * hs, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.47), mat(hc ?? C.yellow))); head.add(cyl(0.33, 0.33, 0.03, hc ?? C.yellow, [0, 0.09, 0.03], null, 12)); break;
    case 'chef': head.add(cyl(0.2, 0.19, 0.22, hc ?? C.white, [0, 0.3, 0], null, 10)); head.add(sphere(0.24, hc ?? C.white, [0, 0.45, 0], 8)); break;
    case 'bonnet': { const b = new THREE.Mesh(new THREE.SphereGeometry(0.29 * hs, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.62), mat(hc ?? C.white)); b.rotation.x = -0.5; head.add(b); } head.add(cyl(0.3, 0.33, 0.08, hc ?? C.white, [0, 0.08, 0.1], [1.2, 0, 0], 10)); break;
    case 'hairnet': { const b = new THREE.Mesh(new THREE.SphereGeometry(0.282 * hs, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(hc ?? 0xdfeaf2)); b.rotation.x = -0.3; head.add(b); break; }
    case 'beanie': { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28 * hs, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.45), mat(hc ?? C.green)); b.rotation.x = -0.15; head.add(b); } head.add(sphere(0.06, C.white, [0, 0.29, -0.04], 6)); break;
    case 'tophat': head.add(cyl(0.3, 0.3, 0.03, hc ?? 0x222222, [0, 0.2, 0], null, 12)); head.add(cyl(0.19, 0.19, 0.3, hc ?? 0x222222, [0, 0.35, 0], null, 10)); break;
    case 'sailor': head.add(cyl(0.24, 0.2, 0.1, hc ?? C.white, [0, 0.24, 0], null, 10)); break;
  }
  let mouth = null;
  if (o.expressive) { mouth = ball(0.06, 0.022, 0.02, 0x6a2420, [0, -0.125, 0.225 * hs]); mouth.userData.noBake = true; mouth.castShadow = false; }
  else head.add(ball(0.055, 0.014, 0.02, 0x7a2a22, [0, -0.1, 0.232 * hs]));
  bakeFlat(head); if (mouth) { mouth.material = mat(0x6a2420, { flat: true }); head.add(mouth); }
  // arms
  // arms: upper arm (shoulder pivot) + forearm (elbow pivot) — the elbow bends forward with a negative x rotation
  const mkArm = (sx) => { const a = new THREE.Group(); a.position.set(sx * 0.28, 0.47, 0); a.add(cyl(0.076, 0.07, 0.26, o.shirt, [0, -0.12, 0], null, 6)); a.add(sphere(0.072, o.shirt, [0, -0.25, 0], 6)); bakeFlat(a); hips.add(a);
    const fa = new THREE.Group(); fa.position.set(0, -0.25, 0); fa.userData.keep = true; fa.add(cyl(0.068, 0.06, 0.22, o.shirt, [0, -0.1, 0], null, 6)); fa.add(sphere(0.08, o.skin, [0, -0.22, 0], 6)); bakeFlat(fa); a.add(fa); a.userData.fore = fa; return a; };
  const armL = mkArm(-1), armR = mkArm(1), foreL = armL.userData.fore, foreR = armR.userData.fore;
  const hand = new THREE.Group(); hand.position.set(0, -0.24, 0); hand.userData.keep = true; foreR.add(hand);
  // legs
  const mkLeg = (sx) => { if (o.seated) return null; const l = new THREE.Group(); l.position.set(sx * 0.11, 0, 0); if (o.dress) { l.add(cyl(0.095, 0.09, 0.36, o.dress, [0, -0.19, 0], null, 6)); l.add(cyl(0.088, 0.085, 0.26, o.skin, [0, -0.48, 0], null, 6)); } // thighs in the dress colour, so a seated lap looks like a skirt
    else l.add(cyl(0.095, 0.085, 0.6, o.pants, [0, -0.31, 0], null, 6));
    l.add(box(0.16, 0.1, 0.28, o.shoes, [0, -0.65, 0.045])); bakeFlat(l); hips.add(l); return l; };
  const legL = mkLeg(-1), legR = mkLeg(1);
  const carryAnchor = new THREE.Group(); carryAnchor.position.set(0, 1.0, 0.45); carryAnchor.userData.keep = true; root.add(carryAnchor);
  if (o.shadow && !o.seated) root.add(blob(0.42));
  root.scale.setScalar(o.scale);
  const st = { phase: Math.random() * 10, aLx: 0, aRx: 0, aLz: 0, aRz: 0, eL: 0, eR: 0, ezL: 0, ezR: 0, lL: 0, lR: 0, by: 0, bx: 0, hx: 0, hy: 0, mo: 0, sit: 0 };
  const dummy = () => { const g = new THREE.Group(); g.userData.keep = true; return g; }; // (shins do not exist on these rigid-legged people; harmless stand-ins)
  Object.assign(root.userData, { anim: 'idle', sitting: false, speed: 1, hips, torso, head, armL, armR, legL, legR, foreL, foreR, shinL: dummy(), shinR: dummy(), hand, carryAnchor, mouth, lookAt: null, opts: o });
  const tmp = new THREE.Vector3();
  root.userData.tick = (dt, t) => {
    const u = root.userData, a = u.forceAnim || u.anim; st.phase += dt * (a === 'run' ? 13 : a === 'walk' ? 9 : 1) * (u.speed || 1);
    const s = Math.sin(st.phase), s2 = Math.sin(t * 6 + st.phase);
    // aLx/aRx: upper arm forward swing (negative = forward), aLz/aRz: out to the side; eL/eR: elbow bend (negative = forearm forward/up); ezL/ezR: forearm side swing
    let aLx = 0, aRx = 0, aLz = -0.04, aRz = 0.04, eL = -0.15, eR = -0.15, ezL = 0, ezR = 0, lL = 0, lR = 0, by = Math.sin(t * 2 + st.phase) * 0.008, bx = 0, hx = 0, hy = 0, mo = 0;
    switch (a) {
      case 'walk': case 'run': { const k = a === 'run' ? 1 : 0.65; aLx = s * k * 0.8; aRx = -s * k * 0.8; eL = -0.25 * k - Math.max(0, s) * 0.55 * k - (a === 'run' ? 0.5 : 0); eR = -0.25 * k - Math.max(0, -s) * 0.55 * k - (a === 'run' ? 0.5 : 0); lL = -s * k; lR = s * k; by = Math.abs(Math.cos(st.phase)) * 0.05 * k; bx = a === 'run' ? 0.12 : 0.03; break; }
      case 'wave': aRz = 2.6; aRx = 0; eR = -0.35; ezR = -0.35 + Math.sin(t * 9) * 0.55; break; // right arm up and OUT to the side, the forearm waving from the elbow
      case 'point': aRx = -1.45; eR = -0.08; break;
      case 'work': { const w = Math.sin(t * 7 + st.phase), w2 = Math.sin(t * 7 + st.phase + 1.3); aLx = -0.65 + w * 0.3; eL = -0.85 + w * 0.4; aRx = -0.65 + w2 * 0.3; eR = -0.85 + w2 * 0.4; bx = 0.12; break; }
      case 'dig': { const d = Math.sin(t * 5 + st.phase); aLx = aRx = -0.6 + d * 0.45; eL = eR = -0.75 - d * 0.35; bx = 0.25 + d * 0.15; break; }
      case 'sew': { const w = Math.sin(t * 5 + st.phase); aLx = -0.75; eL = -0.95; aRx = -0.7 + w * 0.2; eR = -1.05 - Math.max(0, w) * 0.3; aRz = -0.1 - Math.max(0, w) * 0.4; hx = 0.3; break; }
      case 'carry': aLx = aRx = -0.9; eL = eR = -0.7; aLz = 0.1; aRz = -0.1; break;
      case 'cheer': aLz = -2.45 - s2 * 0.22; aRz = 2.45 + s2 * 0.22; eL = eR = -0.12; by = Math.abs(Math.sin(t * 7 + st.phase)) * 0.12; mo = 1; break; // both arms up in a V, away from the head
      case 'clap': { const c = Math.abs(Math.sin(t * 8 + st.phase)); aLx = aRx = -0.55; eL = eR = -1.15; aLz = 0.5 - c * 0.3; aRz = -0.5 + c * 0.3; ezL = 0.4 - c * 0.25; ezR = -0.4 + c * 0.25; by = (1 - c) * 0.015; mo = 0.7; break; } // hands meet in front of the chest
      case 'laugh': by = Math.abs(Math.sin(t * 13 + st.phase)) * 0.035; hx = -0.28; bx = -0.08; mo = 1.3; aLx = aRx = -0.35; eL = eR = -0.75; aLz = 0.26; aRz = -0.26; ezL = 0.35; ezR = -0.35; break; // hands in front of the belly
      case 'talk': { const w = Math.sin(t * 3.1 + st.phase); mo = 0.35 + Math.abs(Math.sin(t * 11 + st.phase)) * 0.9; aRx = -0.45 + w * 0.15; eR = -1.0 + w * 0.35; aRz = -0.12; ezR = -0.3 + Math.sin(t * 2.7 + st.phase) * 0.25; hx = Math.sin(t * 2.3 + st.phase) * 0.06; break; }
      case 'eat': { const e = (Math.sin(t * 2.2 + st.phase) + 1) / 2; aRx = -0.3 - e * 1.0; eR = -0.3 - e * 1.3; aRz = 0.3 * e; ezR = 0.35 * e; hx = 0.12 * e; mo = e > 0.8 ? 1 : 0.2; break; }
    }
    if (u.carrying) { aLx = aRx = -0.9; eL = eR = -0.7; aLz = 0.1; aRz = -0.1; ezL = ezR = 0; }
    const sitT = u.sitting ? 1 : 0; st.sit = damp(st.sit, sitT, 10, dt);
    if (st.sit > 0.01) { lL = lerp(lL, -1.5, st.sit); lR = lerp(lR, -1.5, st.sit); }
    const L = 14;
    st.aLx = damp(st.aLx, aLx, L, dt); st.aRx = damp(st.aRx, aRx, L, dt); st.aLz = damp(st.aLz, aLz, L, dt); st.aRz = damp(st.aRz, aRz, L, dt);
    st.eL = damp(st.eL, eL, L, dt); st.eR = damp(st.eR, eR, L, dt); st.ezL = damp(st.ezL, ezL, L, dt); st.ezR = damp(st.ezR, ezR, L, dt);
    st.lL = damp(st.lL, lL, L, dt); st.lR = damp(st.lR, lR, L, dt); st.by = damp(st.by, by, 18, dt); st.bx = damp(st.bx, bx, L, dt);
    if (u.lookAt) { root.worldToLocal(tmp.copy(u.lookAt)); hy = clamp(Math.atan2(tmp.x, tmp.z), -1.1, 1.1); hx += clamp(-Math.atan2(tmp.y - 1.55, Math.hypot(tmp.x, tmp.z)), -0.5, 0.5); }
    st.hx = damp(st.hx, hx, 8, dt); st.hy = damp(st.hy, hy, 8, dt); st.mo = damp(st.mo, mo, 20, dt);
    armL.rotation.set(st.aLx, 0, st.aLz); armR.rotation.set(st.aRx, 0, st.aRz); foreL.rotation.set(st.eL, 0, st.ezL); foreR.rotation.set(st.eR, 0, st.ezR);
    if (legL) { legL.rotation.x = st.lL; legR.rotation.x = st.lR; }
    hips.position.y = 0.7 + st.by - (legL ? st.sit * 0.22 : 0); torso.rotation.x = st.bx; head.rotation.set(st.hx, st.hy, 0);
    head.position.z = Math.sin(st.bx) * 0.84; armL.position.z = armR.position.z = Math.sin(st.bx) * 0.47;
    if (mouth) mouth.scale.set(0.066 * (1 + st.mo * 0.12), 0.014 + st.mo * 0.027, 0.02); // an open mouth stays wider than tall (it used to swell into a red ball)
  };
  return root;
}
/** Quick varied person: crowd('farmer'|'worker'|'chef'|'shopper'|'driver', seedNumber) */
export function randomPerson(kind = 'shopper', seed = Math.floor(Math.random() * 1e6), extra = {}) {
  const r = seeded(seed * 7 + 3), p = (a) => a[Math.floor(r() * a.length)];
  const base = { skin: p(C.skin), hair: p(C.hair), hairStyle: p(['short', 'short', 'long', 'bun', 'pony', 'curly']), shirt: p([C.blue, C.red, C.green, C.purple, C.orange, C.pink, 0x3aa6a0, C.yellow]), pants: p([C.navy, 0x4a4a55, 0x6b4a2f, 0x2f5d50]) };
  const kinds = {
    farmer: { hat: 'straw', shirt: p([C.red, 0x3f7fd1, 0xe9a23b, 0x5aa845]), pants: 0x3b5b8c },
    worker: { hat: 'hardhat', vest: 0xff8a1f },
    factory: { hat: 'hairnet', apron: C.white, shirt: 0x9fd0e8 },
    chef: { hat: 'chef', apron: C.white, shirt: C.white },
    driver: { hat: 'cap' },
    shopper: {},
  };
  return person(Object.assign(base, kinds[kind] || {}, extra));
}
