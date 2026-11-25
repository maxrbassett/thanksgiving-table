// Sparkling Grape Juice — builders for the things this adventure needs (vines, birds, machines, bottles…).
import { THREE, C, box, cyl, cone, sphere, ball, torus, group, bake, mat, glow, canvasTex, lowDetail } from '../core/kit.js';

export const COL = {
  grape: 0x4a2a72, grapeL: 0x6b4a9a, unripe: 0x9dbf5a, juice: 0x5e2a7c, leaf: 0x4a8a38, leaf2: 0x63a148, leafD: 0x37682c, leafA: 0xc9a53a, leafB: 0xb8682e,
  bark: 0x5c4632, cane: 0x94683f, wire: 0xb9c0c6, hose: 0xd3dce2, glassG: 0x8fbf8a, bottle: 0x1f472a, foil: 0xd9aa3a, label: 0xf3e9d2, card: 0xc29b66,
  steel: 0xc5ccd2, steelD: 0x8d979f,
};
const PI = Math.PI;
/** a small smooth berry: 20 triangles, shaded round. */
export function berry(r, color, pos) {
  const g = new THREE.IcosahedronGeometry(r, 0); g.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from(g.attributes.position.array, v => v / r), 3));
  const m = new THREE.Mesh(g, mat(color)); m.castShadow = true; if (pos) m.position.set(pos[0], pos[1], pos[2]); return m;
}
/** a flat five-cornered leaf (5 triangles, seen from both sides). */
export function leaf(r, color, pos, rot) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 5), mat(color, { side: 'double' })); m.castShadow = true; if (pos) m.position.set(pos[0], pos[1], pos[2]); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); return m;
}
/** a shape turned on a lathe from [radius, height] points (bottom to top). */
export function lat(pts, color, pos, seg = 12) {
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), lowDetail() ? Math.max(7, Math.round(seg * 0.7)) : seg), mat(color)); m.castShadow = true; if (pos) m.position.set(pos[0], pos[1], pos[2]); return m;
}

/** a bunch of grapes hanging from its origin: wide shoulders tapering to a tip. n = 14 (close up) or fewer (far rows). */
export function bunch(color = COL.grape, s = 1, n = 14) {
  const g = new THREE.Group(), r = 0.07 * s, c2 = color === COL.grape ? COL.grapeL : color === COL.unripe ? 0xb4cf6a : color;
  const rings = n >= 14 ? [[5, 1.2], [4, 1.0], [3, 0.72], [1, 0]] : n >= 10 ? [[4, 1.05], [3, 0.85], [2, 0.55], [1, 0]] : [[3, 0.9], [2, 0.6], [1, 0]];
  let k = 0;
  rings.forEach(([m, rad], j) => { for (let i = 0; i < m; i++) { const a = i / m * PI * 2 + j * 0.9; g.add(berry(r, (k++ % 3 === 1) ? c2 : color, [Math.cos(a) * rad * r, -(j * 1.15 + 1) * r, Math.sin(a) * rad * r * 0.85])); } });
  if (n >= 14) g.add(berry(r, c2, [0, -0.75 * r, 0]));
  g.add(cyl(0.012 * s, 0.012 * s, 0.1 * s, COL.bark, [0, 0.02 * s, 0], null, 4));
  return bake(g);
}
/** young vine in the ground (with its stake). */
export function youngVine() {
  const g = new THREE.Group();
  g.add(cyl(0.022, 0.022, 1.3, 0xcbb384, [0.1, 0.65, 0], null, 5));
  g.add(cyl(0.03, 0.045, 0.5, COL.bark, [0.01, 0.25, 0], [0, 0, 0.08], 5)); g.add(cyl(0.02, 0.03, 0.55, 0x6f8a3c, [0.04, 0.74, 0], [0, 0, -0.1], 5));
  for (const [x, y, z, a] of [[-0.17, 0.55, 0.05, 0.7], [0.2, 0.7, -0.04, -0.7], [-0.12, 0.88, -0.05, 0.5], [0.17, 0.98, 0.06, -0.4], [0.04, 1.08, 0, 0.1]]) g.add(leaf(0.15, a > 0 ? COL.leaf2 : COL.leaf, [x, y, z], [-1.1, 0, a]));
  return bake(g);
}
/** mature trunk + two arms (cordons) along the wire, for the vine at x,z (added into a parent group). */
export function addTrunk(g, x, z) {
  g.add(cyl(0.075, 0.12, 0.62, COL.bark, [x + 0.03, 0.3, z], [0, 0, -0.1], 5)); g.add(cyl(0.06, 0.08, 0.6, COL.bark, [x + 0.03, 0.86, z], [0, 0, 0.12], 5));
  g.add(berry(0.1, COL.bark, [x + 0.06, 0.58, z])); g.add(berry(0.11, COL.bark, [x, 1.13, z]));
  for (const s of [-1, 1]) { g.add(cyl(0.03, 0.06, 1.9, COL.bark, [x + s * 0.95, 1.12, z], [0, 0, s * (PI / 2 + 0.02)], 5));
    for (let i = 0; i < 2; i++) g.add(cyl(0.02, 0.028, 0.16, COL.cane, [x + s * (0.6 + i * 0.7), 1.21, z], [0, 0, (i - 0.5) * 0.5], 3)); }
}
/** leafy canopy above one vine: a thin leafy wall held up between the wires (dark inside, single leaves outside). */
export function addCanopy(g, x, z, cols, rnd, core = COL.leafD) {
  for (let k = -1; k <= 1; k++) g.add(ball(0.8, 0.4 + rnd() * 0.08, 0.19, core, [x + k * 1.28, 1.62 + rnd() * 0.08, z], [0, 0, (rnd() - 0.5) * 0.2], 7));
  const c = () => cols[Math.floor(rnd() * cols.length)];
  for (let i = 0; i < 24; i++) { const s = i % 3 === 2 ? -1 : 1; g.add(leaf(0.14 + rnd() * 0.06, c(), [x + (rnd() - 0.5) * 4.0, 1.22 + rnd() * 0.85, z + s * (0.17 + rnd() * 0.07)], [(rnd() - 0.5) * 0.9, (s < 0 ? PI : 0) + (rnd() - 0.5) * 0.9, rnd() * 6.3])); }
  for (let i = 0; i < 8; i++) g.add(leaf(0.14 + rnd() * 0.05, c(), [x + (rnd() - 0.5) * 3.9, 2.02 + rnd() * 0.12, z + (rnd() - 0.5) * 0.2], [-PI / 2 + (rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.6, rnd() * 6.3]));
}
/** long winter canes sticking up from one vine (pivot at the cordon). */
export function caneTuft() {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) g.add(cyl(0.018, 0.035, 1.2 + (i % 3) * 0.18, 0xa5683a, [-1.5 + i * 0.5, 0.62, 0], [(i % 2 ? 0.12 : -0.1), 0, (i % 2 ? 0.14 : -0.12)], 5));
  return bake(g);
}
/** a floppy green shoot (pivot at its base). */
export function shoot() {
  const g = new THREE.Group();
  g.add(cyl(0.015, 0.025, 0.9, 0x7aa548, [0, 0.45, 0], null, 5));
  for (const [y, a] of [[0.3, 0.7], [0.52, -0.7], [0.72, 0.5], [0.9, -0.2]]) g.add(leaf(0.15, a > 0 ? COL.leaf : COL.leaf2, [a * 0.17, y, 0.02], [-0.5, 0, a]));
  return bake(g);
}
/** a starling. userData.wings = [L, R] pivots. faces +Z. */
export function starling() {
  const g = new THREE.Group(), body = new THREE.Group();
  body.add(ball(0.15, 0.14, 0.23, 0x2a2b45, [0, 0.2, 0])); body.add(sphere(0.1, 0x333658, [0, 0.33, 0.17], 7));
  body.add(cone(0.035, 0.14, 0xf2c43d, [0, 0.32, 0.31], [Math.PI / 2, 0, 0], 5)); body.add(box(0.12, 0.03, 0.2, 0x22233a, [0, 0.2, -0.28], [0.3, 0, 0]));
  for (const s of [-1, 1]) { body.add(cyl(0.012, 0.012, 0.12, 0xe98a2b, [s * 0.05, 0.05, 0], null, 4)); body.add(sphere(0.022, 0xffffff, [s * 0.05, 0.36, 0.245], 4)); }
  for (const [x, y, z] of [[0.1, 0.27, 0.05], [-0.09, 0.24, -0.08], [0.03, 0.31, -0.05], [-0.11, 0.2, 0.1]]) body.add(sphere(0.018, 0xd8e0ff, [x, y, z], 4));
  bake(body); g.add(body);
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.12, 0.25, 0); const m = box(0.3, 0.03, 0.2, 0x22233a, [s * 0.15, 0, -0.02]); w.add(m); w.userData.dynamic = true; g.add(w); return w; });
  g.userData.wings = wings; g.scale.setScalar(1.1);
  return g;
}
/** a heap that can grow: a Group (scale it) holding a rounded pile, its middle at the group's origin; lumps = how many single grapes show on top. */
export function mound(rx, ry, rz, color, seg = 8, lumps = 0, lr = 0.1, color2 = COL.grapeL) {
  const g = new THREE.Group(); g.add(ball(rx, ry, rz, color, null, null, seg));
  for (let i = 0; i < lumps; i++) { const u = i * 2.399963, v = 0.12 + Math.sqrt((i + 0.5) / lumps) * 1.2; g.add(berry(lr, i % 3 ? color : color2, [rx * Math.sin(v) * Math.cos(u) * 0.97, ry * Math.cos(v) * 0.97, rz * Math.sin(v) * Math.sin(u) * 0.97])); }
  g.userData.dynamic = true; return bake(g);
}
/** yellow picking lug with a heap that grows: userData.heap */
export function lug() {
  const g = new THREE.Group(), b = new THREE.Group(), y = 0xe3b23a, y2 = 0xd29f2c;
  b.add(box(0.74, 0.05, 0.5, y2, [0, 0.025, 0])); for (const s of [-1, 1]) { b.add(box(0.8, 0.32, 0.04, y, [0, 0.19, s * 0.26], [s * -0.06, 0, 0])); b.add(box(0.04, 0.32, 0.55, y, [s * 0.39, 0.19, 0], [0, 0, s * 0.06])); b.add(box(0.86, 0.04, 0.06, y2, [0, 0.35, s * 0.275])); b.add(box(0.06, 0.04, 0.6, y2, [s * 0.41, 0.35, 0])); b.add(box(0.05, 0.05, 0.2, 0x5a4a1c, [s * 0.395, 0.26, 0])); for (const x of [-0.2, 0.2]) b.add(box(0.03, 0.26, 0.05, y2, [x, 0.18, s * 0.275])); }
  bake(b); g.add(b);
  const heap = mound(0.33, 0.2, 0.21, COL.grape, 7, 14, 0.06); heap.position.y = 0.22; heap.scale.y = 0.01; heap.visible = false; g.add(heap); g.userData.heap = heap;
  return g;
}
/** over-the-row grape harvester: two legs on tall wheels straddle the row, shaker rods inside, hoppers and engine on top; faces +Z; open driver's platform in front. */
export function harvester() {
  const g = new THREE.Group(), b = 0x2c5f9c, b2 = 0x1f4676, y = 0xe2b431, dk = 0x24282d, st = COL.steel, X = 1.2;
  for (const s of [-1, 1]) {
    for (const z of [-1.05, 1.05]) {
      g.add(cyl(0.62, 0.62, 0.42, 0x1a1a1a, [s * X, 0.62, z], [0, 0, PI / 2], 14)); g.add(cyl(0.36, 0.36, 0.45, y, [s * X, 0.62, z], [0, 0, PI / 2], 10)); g.add(cyl(0.12, 0.12, 0.5, dk, [s * X, 0.62, z], [0, 0, PI / 2], 6));
      g.add(box(0.26, 0.9, 0.3, b2, [s * (X - 0.02), 1.4, z]));
    }
    g.add(box(0.5, 1.0, 3.4, b, [s * X, 2.05, 0])); g.add(box(0.52, 0.09, 3.42, y, [s * X, 1.6, 0])); g.add(box(0.3, 0.5, 1.1, b2, [s * X, 1.3, 0]));
    for (let i = 0; i < 4; i++) g.add(box(0.03, 0.5, 0.1, b2, [s * (X + 0.26), 2.15, -1.2 + i * 0.22]));   // cooling slots
    for (let i = 0; i < 5; i++) g.add(box(0.5, 0.04, 0.06, 0xe4e4e4, [s * 0.66, 1.0 + i * 0.22, 0.6 - i * 0.3], [0, s * 0.25, 0])); // shaker rods
    g.add(cyl(0.5, 0.34, 0.62, st, [s * 0.92, 3.22, -0.55], [0, PI / 4, 0], 4)); g.add(ball(0.3, 0.12, 0.3, COL.grape, [s * 0.92, 3.5, -0.55], null, 6));   // hoppers, full
  }
  g.add(box(2.95, 0.4, 3.5, b, [0, 2.72, 0])); g.add(box(3.0, 0.08, 3.55, y, [0, 2.5, 0]));
  g.add(box(1.9, 0.04, 1.5, 0x596068, [0, 2.94, 0.95]));   // platform
  g.add(box(0.3, 0.4, 0.3, 0x3c434b, [0, 3.12, -0.02])); g.add(box(0.56, 0.12, 0.5, dk, [0, 3.36, -0.02])); g.add(box(0.56, 0.62, 0.1, dk, [0, 3.72, -0.35], [-0.08, 0, 0])); // seat: the driver sits at z = 0, hips 0.48 above the driver's origin, back clear of the backrest
  g.add(box(0.5, 0.55, 0.22, b2, [0, 3.2, 1.1])); g.add(cyl(0.02, 0.02, 0.57, dk, [0, 3.615, 0.77], [-0.949, 0, 0], 5)); g.add(torus(0.19, 0.025, dk, [0, 3.78, 0.54], [0.622, 0, 0], 10));   // console + wheel: the wheel is within reach of straight arms, and straight legs end short of the console
  for (const s of [-1, 1]) { for (const z of [0.25, 1.66]) g.add(cyl(0.03, 0.03, 0.9, dk, [s * 0.92, 3.38, z], null, 5)); g.add(cyl(0.03, 0.03, 1.45, dk, [s * 0.92, 3.83, 0.95], [PI / 2, 0, 0], 5)); g.add(sphere(0.09, glow(0xfff2c0), [s * 0.7, 3.83, 1.7], 6)); }
  g.add(cyl(0.03, 0.03, 1.84, dk, [0, 3.83, 1.66], [0, 0, PI / 2], 5));
  g.add(box(1.15, 0.8, 1.05, b, [0, 3.3, -1.2])); g.add(cyl(0.4, 0.4, 1.15, b, [0, 3.7, -1.2], [0, 0, PI / 2], 10)); g.add(box(0.95, 0.55, 0.04, dk, [0, 3.35, -1.74])); // engine
  g.add(cyl(0.045, 0.045, 0.75, dk, [0.42, 4.3, -0.95], null, 6)); g.add(cyl(0.06, 0.06, 0.1, 0x777777, [0.42, 4.7, -0.95], null, 6));
  g.add(box(0.6, 0.06, 1.7, st, [0, 3.85, -2.3], [0.32, 0, 0])); for (const s of [-1, 1]) g.add(box(0.04, 0.16, 1.7, COL.steelD, [s * 0.31, 3.92, -2.3], [0.32, 0, 0])); g.add(box(0.08, 0.7, 0.08, COL.steelD, [0, 3.35, -1.95], [0.5, 0, 0])); // unloading conveyor
  for (const r of [-1, 1]) g.add(box(0.04, 1.7, 0.04, dk, [-1.52, 2.1, 1.25 + r * 0.18])); for (let i = 0; i < 5; i++) g.add(box(0.05, 0.04, 0.4, dk, [-1.52, 1.4 + i * 0.36, 1.25]));   // ladder
  g.add(sphere(0.11, glow(0xffb020), [-0.42, 4.16, -1.2], 6)); g.add(cyl(0.06, 0.06, 0.1, dk, [-0.42, 4.05, -1.2], null, 5));
  g.userData.seat = [0, 2.95, 0];
  return bake(g);
}
/** a pipe through 3D points: .stat (empty hose, static) and .juice (segments revealed by flow()). */
export function pipe(pts, r = 0.11) {
  const stat = new THREE.Group(), juice = new THREE.Group(), segs = []; juice.userData.dynamic = true;
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]), d = b.clone().sub(a), L = d.length(); d.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, d);
    const m = cyl(r, r, L, COL.hose, null, null, 7); m.position.copy(a).addScaledVector(d, L / 2); m.quaternion.copy(q); stat.add(m);
    stat.add(sphere(r * 1.35, 0x9aa6b0, pts[i + 1], 6)); if (i === 0) stat.add(sphere(r * 1.35, 0x9aa6b0, pts[0], 6));
    const pv = new THREE.Group(); pv.position.copy(a); pv.quaternion.copy(q); const j = cyl(r * 1.22, r * 1.22, L, COL.juice, [0, L / 2, 0], null, 7); pv.add(j); pv.scale.y = 0.001; pv.visible = false; juice.add(pv); segs.push({ pv, L });
  }
  return { stat, juice, segs, full: false,
    async flow(ctx, speed = 7) { for (const s of segs) { s.pv.visible = true; await ctx.tween(s.pv.scale, { y: 1 }, s.L / speed, 'linear'); } this.full = true; bake(juice); } };
}
/** sparkling-juice bottle with 4 looks: 0 empty glass, 1 filled, 2 capped with foil, 3 labelled. userData.set(n) */
const GLASS = [[0, 0], [0.1, 0], [0.12, 0.025], [0.12, 0.25], [0.113, 0.31], [0.088, 0.375], [0.058, 0.425], [0.045, 0.47], [0.042, 0.57], [0.05, 0.575], [0.05, 0.6], [0, 0.6]];
export function bottleLook(i = 3) {
    const b = new THREE.Group(), c = i === 0 ? COL.glassG : COL.bottle;
    b.add(lat(GLASS, c, null, 12));
    if (i === 1) b.add(cyl(0.036, 0.036, 0.012, COL.juice, [0, 0.6, 0], null, 7));
    if (i >= 2) { b.add(lat([[0.066, 0.415], [0.052, 0.47], [0.048, 0.57], [0.058, 0.575], [0.058, 0.615], [0, 0.62]], COL.foil, null, 10)); }
    if (i === 3) { b.add(cyl(0.1235, 0.1235, 0.15, COL.label, [0, 0.15, 0], null, 12)); b.add(cyl(0.1255, 0.1255, 0.04, COL.grape, [0, 0.115, 0], null, 12)); b.add(cyl(0.125, 0.125, 0.012, COL.foil, [0, 0.215, 0], null, 12)); }
    return b;
}
export function bottle(state = 3, s = 1) {
  const g = new THREE.Group(), looks = [];
  for (let i = 0; i < 4; i++) { const b = bake(bottleLook(i)); b.userData.dynamic = true; b.visible = i === state; g.add(b); looks.push(b); }
  g.userData.set = (n) => looks.forEach((b, i) => { b.visible = i === n; }); g.userData.state = state; g.scale.setScalar(s);
  return g;
}
/** shipping carton: taped flaps, hand holes */
export function carton(sign) {
  const g = new THREE.Group(); g.add(box(0.9, 0.5, 0.62, COL.card, [0, 0.25, 0])); g.add(box(0.905, 0.012, 0.01, 0x8f6f44, [0, 0.503, 0])); g.add(box(0.92, 0.012, 0.09, 0xdcc79a, [0, 0.505, 0])); for (const s of [-1, 1]) { g.add(box(0.012, 0.2, 0.09, 0xdcc79a, [s * 0.452, 0.41, 0])); g.add(box(0.012, 0.05, 0.16, 0x6b4f2e, [s * 0.452, 0.27, 0])); }
  bake(g);
  if (sign) { sign.position.set(0, 0.26, 0.32); g.add(sign); }
  return g;
}
/** champagne-style flute: userData.juice (scale.y 0..1) */
export function flute() {
  const g = new THREE.Group(), st = new THREE.Group();
  st.add(cyl(0.012, 0.075, 0.018, 0xe8f4fa, [0, 0.009, 0], null, 10)); st.add(cyl(0.01, 0.01, 0.14, 0xe8f4fa, [0, 0.08, 0], null, 5)); bake(st); g.add(st);
  const bowl = lat([[0.01, 0.15], [0.036, 0.17], [0.056, 0.24], [0.058, 0.3], [0.05, 0.36]], 0xffffff, null, 10); bowl.material = mat(0xdff3ff, { opacity: 0.42, side: 'double' }); bowl.castShadow = false; g.add(bowl);
  const pv = new THREE.Group(); pv.position.y = 0.155; const j = cyl(0.05, 0.026, 0.15, COL.grapeL, [0, 0.075, 0], null, 8); j.userData.noBake = true; pv.add(j); pv.scale.y = 0.01; pv.visible = false; g.add(pv); g.userData.juice = pv;
  return g;
}
/** a clock sprite (0..8 hours). returns sprite with userData.set(hours, ok) */
export function clockSprite(size = 1.4) {
  const tex = canvasTex(128, 128, () => {}), g = tex.image.getContext('2d');
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(size, size, 1); s.renderOrder = 5;
  let last = -1;
  s.userData.set = (h, ok) => {
    const k = Math.round(h * 16) + (ok ? 1000 : 0); if (k === last) return; last = k;
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = '#4a2c17'; g.beginPath(); g.arc(64, 66, 56, 0, 7); g.fill(); g.fillRect(54, 0, 20, 14);
    g.fillStyle = '#fff8e8'; g.beginPath(); g.arc(64, 66, 47, 0, 7); g.fill();
    g.fillStyle = ok ? '#6cc04a' : (h > 6.5 ? '#e0483b' : '#8a4fc0'); g.beginPath(); g.moveTo(64, 66); g.arc(64, 66, 47, -Math.PI / 2, -Math.PI / 2 + (h / 8) * Math.PI * 2); g.closePath(); g.fill();
    g.strokeStyle = '#4a2c17'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.moveTo(64 + Math.cos(a) * 38, 66 + Math.sin(a) * 38); g.lineTo(64 + Math.cos(a) * 47, 66 + Math.sin(a) * 47); g.stroke(); }
    g.fillStyle = '#fff8e8'; g.beginPath(); g.arc(64, 66, 22, 0, 7); g.fill();
    g.fillStyle = '#4a2c17'; g.font = '800 26px Fredoka,"Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ok ? '✓' : '8h', 64, 68);
    tex.needsUpdate = true;
  };
  s.userData.set(0, false);
  return s;
}
