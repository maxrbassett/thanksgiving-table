// Pumpkin Pie — models used by pie.js. Everything is built from kit primitives; each builder returns
// a baked group (origin on the ground, facing +Z) unless noted. Moving sub-parts are left as their own child.
import { THREE, C, mat, box, cyl, sphere, ball, cone, group, torus, tube, lathe, bake, grain, canvasTex, lowDetail } from '../core/kit.js';

/** a mesh from a hand-made geometry, in a plain (bakeable) colour */
const cm = (geo, color, opts) => { const m = new THREE.Mesh(geo, mat(color, opts)); m.castShadow = true; m.receiveShadow = true; return m; };
/** big flat ground patch with a soft natural grain (not baked: 1 draw) */
export function ground(w, d, color, pos, repeat = 3, round = false) { const geo = round ? new THREE.CircleGeometry(0.5, 28) : new THREE.PlaneGeometry(w, d); if (round) geo.scale(w, d, 1); const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, map: grain(repeat) })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; m.position.set(pos[0], pos[1], pos[2]); return m; }
/** a thin pipe / stalk through points, cheaper than kit.tube */
const pipe = (pts, r, color, segs = 8, sides = 4) => cm(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))), segs, r, sides), color);
const dyn = (g) => { g.userData.dynamic = true; g.userData.keep = true; return g; };

/** ribbed pumpkin, about 0.75·s wide and 0.55·s tall */
const pumpkinGeos = new Map();
/** a squat ribbed ball (radius 1, poles dimpled): the body of a pumpkin */
function pumpkinGeo(ribs, su, sv) {
  const key = ribs + '|' + su + '|' + sv; if (pumpkinGeos.has(key)) return pumpkinGeos.get(key);
  const pos = [], idx = [];
  for (let v = 0; v <= sv; v++) { const ph = v / sv * Math.PI, sp = Math.sin(ph), y = Math.cos(ph) * (1 - 0.2 * Math.exp(-sp * sp / 0.12)), rr = Math.pow(sp, 0.7);
    for (let u = 0; u <= su; u++) { const th = u / su * Math.PI * 2, r = rr * (0.88 + 0.12 * Math.pow(Math.abs(Math.sin(ribs * th / 2)), 0.7)); pos.push(Math.cos(th) * r, y, Math.sin(th) * r); } }
  for (let v = 0; v < sv; v++) for (let u = 0; u < su; u++) { const a = v * (su + 1) + u, b = a + su + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); pumpkinGeos.set(key, g); return g;
}
/** ribbed pumpkin, about 0.75·s wide and 0.55·s tall. far = a simpler one for the background */
export function pumpkin(s = 1, color = 0xdc7320, stem = 0x6f6a35, far = false) {
  const g = new THREE.Group(), lo = far || lowDetail();
  const body = cm(far ? pumpkinGeo(6, 12, 4) : pumpkinGeo(8, lo ? 16 : 24, lo ? 5 : 7), color); body.scale.set(0.375 * s, 0.3 * s, 0.375 * s); body.position.y = 0.275 * s; g.add(body);
  g.add(cyl(0.03 * s, 0.055 * s, 0.17 * s, stem, [0.015 * s, 0.58 * s, 0], [0, 0, 0.28], 5)); if (!far) g.add(cyl(0.055 * s, 0.085 * s, 0.04 * s, stem, [0, 0.5 * s, 0], null, 6));
  return bake(g);
}
export function shade(c, k) { const r = Math.min(255, ((c >> 16) & 255) * k) | 0, g = Math.min(255, ((c >> 8) & 255) * k) | 0, b = Math.min(255, (c & 255) * k) | 0; return (r << 16) | (g << 8) | b; }

/** sprawling pumpkin vine: runners + big leaves, about 2.3 m radius */
let leafG = null;
/** a broad lobed pumpkin leaf, radius 1, slightly cupped (double-sided) */
function leafGeo() {
  if (leafG) return leafG; const pos = [0, 0, 0], idx = [], N = 10;
  for (let i = 0; i < N; i++) { const a = 0.5 + i / (N - 1) * (Math.PI * 2 - 1.0), r = i % 2 ? 0.74 : 1; pos.push(Math.sin(a) * r, 0.16 * r, Math.cos(a) * r); }
  for (let i = 1; i < N; i++) idx.push(0, i, i + 1);
  leafG = new THREE.BufferGeometry(); leafG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); leafG.setIndex(idx); leafG.computeVertexNormals(); return leafG;
}
export function vine(rnd) {
  const g = new THREE.Group(), leaf = (x, y, z, sz, k) => { g.add(cyl(0.012, 0.016, y, 0x4d7d36, [x, y / 2, z], null, 3)); const l = cm(leafGeo(), k % 2 ? 0x4a8a3c : 0x568f3a, { side: 'double' }); l.scale.setScalar(sz * 1.15); l.position.set(x, y, z); l.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6.3, (rnd() - 0.5) * 0.5); g.add(l); };
  for (let k = 0; k < 4; k++) {
    const a0 = k * Math.PI / 2 + rnd() * 0.9, pts = [[0, 0.22, 0]]; let a = a0;
    for (let i = 1; i <= 4; i++) { a += (rnd() - 0.5) * 0.9; const r = i * 0.55; pts.push([Math.cos(a) * r, 0.08, Math.sin(a) * r]); }
    g.add(pipe(pts, 0.035, 0x4d7d36, 10, 4));
    for (let i = 1; i <= 4; i++) { const p = pts[i]; leaf(p[0] + (rnd() - 0.5) * 0.5, 0.26 + rnd() * 0.14, p[2] + (rnd() - 0.5) * 0.5, 0.26 + rnd() * 0.12, i); }
  }
  for (let i = 0; i < 4; i++) leaf((rnd() - 0.5) * 0.9, 0.4, (rnd() - 0.5) * 0.9, 0.3, i);
  return bake(g);
}
/** big yellow pumpkin blossom. tall = male flower on a stalk */
export function blossom(tall) {
  const g = new THREE.Group(), y = tall ? 0.75 : 0.42;
  g.add(cyl(0.03, 0.04, y, 0x4f8f3a, [0, y / 2, 0], null, 5));
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(group([ball(0.12, 0.03, 0.22, 0xf7c325, [0, 0.06, 0.2], [-0.45, 0, 0], 6)], [0, y, 0], [0, a, 0])); }
  g.add(sphere(0.09, tall ? 0xf08a1c : 0xd9a010, [0, y + 0.05, 0], 6));
  return bake(g);
}
/** chunky bee ~0.45 m, wings flap: userData.wings */
export function bee() {
  const g = new THREE.Group();
  g.add(ball(0.17, 0.16, 0.24, 0xf7c325, [0, 0, 0], null, 8));
  for (const z of [-0.08, 0.06]) g.add(cyl(0.163, 0.168, 0.06, 0x2b2118, [0, 0, z], [Math.PI / 2, 0, 0], 8));
  g.add(sphere(0.11, 0x2b2118, [0, 0.02, 0.24], 7)); g.add(sphere(0.03, 0xffffff, [0.06, 0.05, 0.32], 5)); g.add(sphere(0.03, 0xffffff, [-0.06, 0.05, 0.32], 5));
  g.add(cone(0.04, 0.12, 0x2b2118, [0, 0, -0.28], [-Math.PI / 2, 0, 0], 5));
  const w = dyn(group([ball(0.09, 0.012, 0.15, 0xffffff, [0.14, 0.1, -0.02], [0, 0.5, 0.5], 6), ball(0.09, 0.012, 0.15, 0xffffff, [-0.14, 0.1, -0.02], [0, -0.5, -0.5], 6)], [0, 0.1, 0]));
  bake(w); g.add(w); bake(g); g.userData.wings = w; return g;
}
/** bird (crow by default). userData.wings flaps by scale.y */
export function bird(color = 0x24242c, beak = 0xe9a23b, s = 1) {
  const g = new THREE.Group();
  g.add(ball(0.15 * s, 0.14 * s, 0.24 * s, color, [0, 0.16 * s, 0], null, 7)); g.add(sphere(0.1 * s, color, [0, 0.3 * s, 0.17 * s], 6));
  g.add(cone(0.04 * s, 0.14 * s, beak, [0, 0.29 * s, 0.31 * s], [Math.PI / 2, 0, 0], 5)); g.add(box(0.14 * s, 0.03 * s, 0.2 * s, color, [0, 0.17 * s, -0.28 * s], [0.3, 0, 0]));
  g.add(sphere(0.02 * s, 0xffffff, [0.06 * s, 0.33 * s, 0.24 * s], 4)); g.add(sphere(0.02 * s, 0xffffff, [-0.06 * s, 0.33 * s, 0.24 * s], 4));
  const w = dyn(group([box(0.34 * s, 0.03 * s, 0.2 * s, color, [0.26 * s, 0.07 * s, 0], [0, 0, 0.35]), box(0.34 * s, 0.03 * s, 0.2 * s, color, [-0.26 * s, 0.07 * s, 0], [0, 0, -0.35])], [0, 0.2 * s, 0]));
  bake(w); w.scale.y = -0.6; g.add(w); bake(g); g.userData.wings = w; return g;
}
export function scarecrow() {
  const g = new THREE.Group();
  g.add(cyl(0.06, 0.07, 2.3, C.woodDark, [0, 1.15, 0], null, 5)); g.add(cyl(0.05, 0.05, 2.0, C.woodDark, [0, 1.75, 0], [0, 0, Math.PI / 2], 5));
  g.add(box(0.7, 0.75, 0.3, 0xc8553d, [0, 1.5, 0])); g.add(box(0.6, 0.2, 0.22, 0xc8553d, [0.6, 1.75, 0])); g.add(box(0.6, 0.2, 0.22, 0xc8553d, [-0.6, 1.75, 0]));
  g.add(box(0.72, 0.12, 0.32, 0x3b5b8c, [0, 1.1, 0]));
  for (const sx of [-1, 1]) { g.add(cone(0.12, 0.3, 0xe3c15a, [sx * 0.98, 1.75, 0], [0, 0, -sx * Math.PI / 2], 5)); g.add(cone(0.14, 0.3, 0xe3c15a, [sx * 0.2, 0.9, 0], [Math.PI, 0, 0], 5)); }
  g.add(sphere(0.27, 0xe8c98a, [0, 2.2, 0], 8)); g.add(sphere(0.04, 0x222222, [-0.1, 2.25, 0.24], 4)); g.add(sphere(0.04, 0x222222, [0.1, 2.25, 0.24], 4)); g.add(cone(0.05, 0.16, 0xe98a2b, [0, 2.17, 0.3], [Math.PI / 2, 0, 0], 4));
  g.add(cyl(0.45, 0.47, 0.03, 0xe3c878, [0, 2.4, 0], null, 10)); g.add(cone(0.24, 0.3, 0xe3c878, [0, 2.55, 0], null, 8));
  return g;
}
/** wooden hay wagon (bed top y≈0.95, 2.3 × 3.6) */
export function wagon() {
  const g = new THREE.Group();
  g.add(box(2.3, 0.14, 3.6, C.wood, [0, 0.88, 0]));
  for (const sx of [-1, 1]) { g.add(box(0.08, 0.45, 3.6, C.woodLight, [sx * 1.12, 1.18, 0])); for (const z of [-1.2, 1.2]) { g.add(cyl(0.45, 0.45, 0.22, 0x222222, [sx * 1.15, 0.45, z], [0, 0, Math.PI / 2], 10)); g.add(cyl(0.2, 0.2, 0.24, C.red, [sx * 1.15, 0.45, z], [0, 0, Math.PI / 2], 8)); } }
  g.add(box(2.3, 0.45, 0.08, C.woodLight, [0, 1.18, -1.78])); g.add(box(0.12, 0.12, 1.6, 0x444444, [0, 0.7, 2.5]));
  return g;
}
export function beehive() {
  const g = new THREE.Group();
  g.add(box(0.7, 0.12, 0.6, C.woodDark, [0, 0.26, 0])); for (const sx of [-1, 1]) g.add(box(0.08, 0.2, 0.5, C.woodDark, [sx * 0.28, 0.1, 0]));
  g.add(box(0.62, 0.36, 0.52, 0xfdfdf5, [0, 0.5, 0])); g.add(box(0.62, 0.36, 0.52, 0xf5e9a8, [0, 0.88, 0])); g.add(box(0.7, 0.08, 0.6, 0x9fb7c4, [0, 1.1, 0])); g.add(box(0.3, 0.04, 0.04, 0x3a2a1a, [0, 0.36, 0.27]));
  return g;
}
export function hen(color = 0xf4f1ea) {
  const g = new THREE.Group(), dk = shade(color, 0.84), Y = 0xd9a03a, R = 0xc23b2e;
  g.add(ball(0.17, 0.16, 0.23, color, [0, 0.31, 0], null, 9)); g.add(ball(0.13, 0.13, 0.13, color, [0, 0.3, 0.12], null, 7));                       // body, breast
  g.add(ball(0.085, 0.15, 0.085, color, [0, 0.45, 0.16], [0.25, 0, 0], 7)); g.add(sphere(0.082, color, [0, 0.57, 0.19], 8));                      // neck, head
  g.add(ball(0.04, 0.17, 0.12, dk, [0, 0.46, -0.22], [-0.75, 0, 0], 6)); g.add(ball(0.07, 0.1, 0.1, dk, [0, 0.38, -0.2], null, 6));                // tail
  for (const sx of [-1, 1]) { g.add(ball(0.045, 0.11, 0.17, dk, [sx * 0.155, 0.33, -0.02], [0.2, 0, 0], 6)); g.add(sphere(0.016, 0x1c1c1c, [sx * 0.06, 0.595, 0.25], 4));
    g.add(cyl(0.013, 0.013, 0.17, Y, [sx * 0.065, 0.09, 0.01], null, 4)); g.add(box(0.075, 0.016, 0.1, Y, [sx * 0.065, 0.008, 0.04])); }
  g.add(ball(0.018, 0.045, 0.07, R, [0, 0.655, 0.18], null, 5)); g.add(cone(0.032, 0.09, Y, [0, 0.56, 0.3], [Math.PI / 2, 0, 0], 4)); g.add(ball(0.02, 0.04, 0.025, R, [0, 0.5, 0.265], null, 4));
  bake(g); g.scale.setScalar(1.1); return g;
}
/** cow, ~2.2 m long. userData.head nods, userData.tail swishes */
export function cow(spots = 0x2b2420) {
  const g = new THREE.Group(), W = 0xefebe2, H = 0x3a2f28, PK = 0xdba9a0;
  g.add(ball(0.45, 0.43, 0.88, W, [0, 1.07, 0], null, 12)); g.add(ball(0.4, 0.43, 0.42, W, [0, 1.13, 0.5], null, 9)); g.add(ball(0.41, 0.42, 0.4, W, [0, 1.12, -0.52], null, 9));   // barrel, shoulders, rump
  g.add(ball(0.22, 0.3, 0.42, W, [0, 1.3, 0.92], [-0.55, 0, 0], 8));                                                                                   // neck
  for (const [x, y, z, rx, ry, rz] of [[0.3, 1.22, 0.28, 0.2, 0.3, 0.36], [-0.33, 1.12, -0.3, 0.18, 0.32, 0.4], [0.31, 1.08, -0.62, 0.16, 0.24, 0.26], [-0.27, 1.28, 0.5, 0.17, 0.22, 0.24], [0, 1.42, -0.1, 0.26, 0.12, 0.32], [0.1, 1.38, 0.95, 0.14, 0.18, 0.22]]) g.add(ball(rx, ry, rz, spots, [x, y, z], null, 7));
  for (const sx of [-1, 1]) for (const z of [-0.6, 0.58]) { g.add(cyl(0.115, 0.075, 0.52, W, [sx * 0.27, 0.66, z], null, 7)); g.add(cyl(0.07, 0.062, 0.36, W, [sx * 0.27, 0.27, z], null, 6)); g.add(cyl(0.07, 0.082, 0.11, H, [sx * 0.27, 0.055, z], null, 6)); }
  g.add(ball(0.2, 0.15, 0.22, PK, [0, 0.64, -0.36], null, 7)); for (const sx of [-1, 1]) for (const z of [-0.44, -0.28]) g.add(cyl(0.022, 0.018, 0.08, PK, [sx * 0.08, 0.48, z], null, 4));
  const head = dyn(group([ball(0.185, 0.2, 0.27, W, [0, 0, 0.14], null, 9), ball(0.15, 0.13, 0.15, PK, [0, -0.07, 0.37], null, 8), ball(0.11, 0.12, 0.16, spots, [0.09, 0.08, 0.12], null, 6),
    sphere(0.034, 0x1c1c1c, [0.155, 0.05, 0.24], 5), sphere(0.034, 0x1c1c1c, [-0.155, 0.05, 0.24], 5), sphere(0.022, 0x7a4a48, [0.06, -0.07, 0.515], 4), sphere(0.022, 0x7a4a48, [-0.06, -0.07, 0.515], 4),
    ball(0.13, 0.06, 0.045, W, [0.27, 0.1, 0.03], [0, 0, 0.35], 6), ball(0.13, 0.06, 0.045, spots, [-0.27, 0.1, 0.03], [0, 0, -0.35], 6), cone(0.035, 0.15, 0xe4d8bc, [0.13, 0.24, 0.05], [0, 0, -0.35], 5), cone(0.035, 0.15, 0xe4d8bc, [-0.13, 0.24, 0.05], [0, 0, 0.35], 5)], [0, 1.42, 1.08]));
  bake(head); g.add(head);
  const tail = dyn(group([cyl(0.03, 0.018, 0.72, W, [0, -0.36, 0], null, 4), ball(0.05, 0.1, 0.05, spots, [0, -0.76, 0], null, 5)], [0, 1.38, -0.9], [0.25, 0, 0])); bake(tail); g.add(tail);
  bake(g); g.userData.head = head; g.userData.tail = tail; return g;
}
/** combine harvester facing +Z. header 5 m wide at z≈3.5. userData.reel spins. auger sticks out to −X */
export function combine() {
  const g = new THREE.Group(), G1 = 0x3d7f3c, G2 = 0x2c5a2c, Y = 0xe0b437, T = 0x1f1f21, RD = 0xb8402e, ST = 0x8d979f;
  g.add(box(2.4, 1.6, 3.6, G1, [0, 1.8, -0.5])); g.add(box(2.44, 0.1, 3.64, Y, [0, 1.25, -0.5])); g.add(box(2.42, 0.5, 0.9, G2, [0, 1.45, -1.75]));                 // body, stripe, engine bay
  g.add(box(2.0, 0.5, 2.2, G2, [0, 2.85, -0.9])); g.add(ball(0.9, 0.28, 1.0, 0xdcb85a, [0, 3.1, -0.9], null, 8));                                                  // grain tank, heaped grain
  for (let i = 0; i < 4; i++) g.add(box(0.04, 0.5, 0.7, 0x222a22, [1.21, 1.9, -1.6 + i * 0.22 - 0.3]));                                                              // cooling grille
  g.add(box(1.7, 0.5, 1.4, G1, [0, 1.5, 1.6])); g.add(box(1.5, 1.2, 1.25, 0x9cc3d6, [0, 2.35, 1.6])); g.add(box(1.8, 0.12, 1.6, 0x2a2a2a, [0, 3.0, 1.65])); g.add(box(0.5, 0.7, 0.4, 0x2a2a2a, [0, 2.1, 1.35]));   // cab floor, glass, roof, seat
  for (const sx of [-1, 1]) for (const z of [0.98, 2.22]) g.add(box(0.09, 1.2, 0.09, G2, [sx * 0.75, 2.35, z]));
  for (const sx of [-1, 1]) {
    g.add(cyl(0.88, 0.88, 0.55, T, [sx * 1.42, 0.88, 1.0], [0, 0, Math.PI / 2], 16)); g.add(cyl(0.5, 0.5, 0.57, Y, [sx * 1.42, 0.88, 1.0], [0, 0, Math.PI / 2], 10)); g.add(cyl(0.16, 0.16, 0.62, ST, [sx * 1.42, 0.88, 1.0], [0, 0, Math.PI / 2], 6));
    g.add(cyl(0.52, 0.52, 0.4, T, [sx * 1.1, 0.52, -1.8], [0, 0, Math.PI / 2], 12)); g.add(cyl(0.26, 0.26, 0.42, Y, [sx * 1.1, 0.52, -1.8], [0, 0, Math.PI / 2], 8));
    g.add(box(0.06, 0.32, 0.5, 0xfff2a8, [sx * 0.6, 3.12, 2.42])); g.add(cone(0.2, 0.9, RD, [sx * 2.5, 0.45, 4.3], [Math.PI / 2, 0, 0], 5));                         // work lights, crop dividers
  }
  for (let i = 0; i < 3; i++) g.add(box(0.5, 0.04, 0.08, ST, [-1.45, 0.7 + i * 0.32, 1.95])); for (const z of [1.72, 2.18]) g.add(box(0.04, 1.1, 0.04, ST, [-1.68, 1.0, z]));   // ladder to the cab
  g.add(box(1.3, 0.6, 1.5, G2, [0, 0.85, 2.65], [0.35, 0, 0]));                                                                                                      // feeder house
  g.add(box(5, 0.3, 1.0, RD, [0, 0.28, 3.6])); g.add(box(5, 0.9, 0.1, RD, [0, 0.7, 3.12])); for (const sx of [-1, 1]) g.add(box(0.1, 0.9, 1.1, 0x9a3526, [sx * 2.5, 0.65, 3.6]));
  g.add(cyl(0.24, 0.24, 4.8, ST, [0, 0.62, 3.42], [0, 0, Math.PI / 2], 7));                                                                                          // the auger that gathers the cut wheat
  g.add(cyl(0.14, 0.14, 3.4, Y, [-2.6, 3.25, -0.9], [0, 0, Math.PI / 2 - 0.22], 8)); g.add(cyl(0.16, 0.12, 0.4, Y, [-4.25, 3.45, -0.9], null, 6));
  g.add(cyl(0.07, 0.07, 1.0, 0x333333, [0.9, 3.15, 0.4], null, 6)); g.add(cyl(0.1, 0.1, 0.25, 0x444444, [0.9, 3.4, 0.4], null, 6));
  const reel = dyn(new THREE.Group()); reel.position.set(0, 1.0, 4.0);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; reel.add(box(4.7, 0.07, 0.07, Y, [0, Math.cos(a) * 0.55, Math.sin(a) * 0.55])); }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) reel.add(box(0.06, 1.1, 0.06, 0x8a8a8a, [sx * 2.35, 0, 0], [i * Math.PI / 3, 0, 0]));
  bake(reel); g.add(reel); bake(g); g.userData.reel = reel; return g;
}
/** windmill, door faces +Z. userData.sails rotates about z */
export function windmill() {
  const g = new THREE.Group(), WALL = 0xe9dfc6, RF = 0x7d4636;
  g.add(cyl(1.9, 2.8, 8, WALL, [0, 4, 0], null, 12)); g.add(cyl(2.9, 2.95, 0.5, C.stone, [0, 0.25, 0], null, 12)); g.add(cyl(1.98, 1.98, 0.22, C.woodDark, [0, 7.9, 0], null, 12)); g.add(cone(2.3, 2.2, RF, [0, 9.1, 0], null, 12));
  g.add(box(1.3, 2.2, 0.14, 0xc9bea4, [0, 1.1, 2.6], [-0.11, 0, 0])); g.add(box(1.05, 2.0, 0.2, C.woodDark, [0, 1.0, 2.66], [-0.11, 0, 0])); g.add(sphere(0.06, 0xd9b36a, [0.36, 1.0, 2.8], 5));
  for (const [x, y, z, ry] of [[0, 4.6, 2.28, 0], [1.75, 3.4, 1.75, Math.PI / 4], [-1.75, 3.4, 1.75, -Math.PI / 4]]) g.add(group([box(0.9, 1.0, 0.16, 0xc9bea4), box(0.7, 0.8, 0.2, 0x6f8fa6), box(0.06, 0.8, 0.22, 0xc9bea4), box(0.7, 0.06, 0.22, 0xc9bea4)], [x, y, z], [-0.1, ry, 0]));
  g.add(cyl(0.16, 0.16, 1.2, C.woodDark, [0, 7.3, 2.2], [Math.PI / 2, 0, 0], 6));
  const s = dyn(new THREE.Group()); s.position.set(0, 7.3, 2.85);
  for (let i = 0; i < 4; i++) { const blade = group([box(0.2, 5.2, 0.1, C.woodDark, [0, 2.6, 0]), box(1.15, 3.9, 0.04, 0xf3ead2, [0.62, 3.1, 0])], null, [0, 0, i * Math.PI / 2]); for (let k = 0; k < 5; k++) blade.add(box(1.15, 0.05, 0.07, C.woodDark, [0.62, 1.25 + k * 0.92, 0])); blade.add(box(0.05, 3.9, 0.07, C.woodDark, [1.2, 3.1, 0])); s.add(blade); }
  s.add(cyl(0.3, 0.3, 0.3, RF, [0, 0, 0], [Math.PI / 2, 0, 0], 8));
  bake(s); g.add(s); bake(g); g.userData.sails = s; return g;
}
/** one drooping palm frond along +Z: a folded strip, widest in the middle (double-sided) */
function frondGeo(len, wid) {
  const pos = [], idx = [], N = 4;
  for (let i = 0; i <= N; i++) { const t = i / N, z = len * t, y = len * (0.42 * t - 0.62 * t * t), w = wid * Math.sin(Math.PI * (0.12 + 0.88 * t)) ; pos.push(-w, y - w * 0.45, z, 0, y, z, w, y - w * 0.45, z); }
  for (let i = 0; i < N; i++) { const a = i * 3, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
export function palm(h = 5, lean = 0.6, rnd = Math.random) {
  const g = new THREE.Group();
  g.add(pipe([[0, 0, 0], [lean * 0.35, h * 0.35, 0], [lean * 0.8, h * 0.7, 0], [lean, h, 0]], 0.15, 0x9c7f58, 8, 6)); g.add(cyl(0.17, 0.26, 0.5, 0x8a6f4c, [0, 0.22, 0], null, 6));
  const fg = frondGeo(2.3, 0.34);
  for (let i = 0; i < 9; i++) { const f = cm(fg, i % 2 ? 0x3f8a45 : 0x4c9a4c, { side: 'double' }); f.rotation.x = -0.25 + (i % 3) * 0.28 + rnd() * 0.12; const s = 0.85 + rnd() * 0.3; f.scale.set(s, s, s); g.add(group([f], [lean, h, 0], [0, i / 9 * Math.PI * 2 + rnd() * 0.3, 0])); }
  for (let i = 0; i < 3; i++) g.add(sphere(0.15, 0x5f4a32, [lean + Math.cos(i * 2.1) * 0.19, h - 0.22, Math.sin(i * 2.1) * 0.19], 5));
  return g;
}
/** cargo ship, bow toward +X, deck at y=1.3, free deck between x −3.2 … 0.8 */
export function ship() {
  const g = new THREE.Group(), H = 0x27364f, WH = 0xeeeae0, GL = 0x34506a;
  const outline = (k) => { const s = new THREE.Shape(); s.moveTo(-8.3 * k, -1.7 * k); s.lineTo(-7.6 * k, -2.2 * k); s.lineTo(4.4 * k, -2.2 * k); s.quadraticCurveTo(7.6 * k, -2.0 * k, 9.2 * k, 0); s.quadraticCurveTo(7.6 * k, 2.0 * k, 4.4 * k, 2.2 * k); s.lineTo(-7.6 * k, 2.2 * k); s.lineTo(-8.3 * k, 1.7 * k); s.closePath(); return s; };
  const slab = (k, y0, y1, color) => { const geo = new THREE.ExtrudeGeometry(outline(k), { depth: y1 - y0, bevelEnabled: false, curveSegments: 5 }); geo.rotateX(-Math.PI / 2); geo.translate(0, y0, 0); return cm(geo, color); };
  g.add(slab(1, -1.1, 1.3, H)); g.add(slab(1.008, -0.35, 0.2, 0x9c3a2e)); g.add(slab(0.985, 1.24, 1.36, 0xb89a6a));                                           // hull, waterline, deck
  { const s = outline(1.012); s.holes.push(outline(0.965)); const geo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false, curveSegments: 5 }); geo.rotateX(-Math.PI / 2); geo.translate(0, 1.3, 0); g.add(cm(geo, WH)); }   // toe rail round the deck
  const rail = (x0, x1, z) => { g.add(box(x1 - x0, 0.05, 0.05, WH, [(x0 + x1) / 2, 2.2, z])); g.add(box(x1 - x0, 0.03, 0.03, WH, [(x0 + x1) / 2, 1.85, z])); for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 1.4))) g.add(box(0.05, 0.8, 0.05, WH, [x, 1.8, z])); };
  rail(-4.3, -2.15, 2.12); rail(-0.25, 4.3, 2.12); rail(-4.3, 4.3, -2.12);                                                                                      // guard rails, open where the gangplank lands
  g.add(box(3.2, 2.6, 3.6, WH, [-6, 2.65, 0])); g.add(box(2.4, 1.1, 2.6, WH, [-6, 4.5, 0])); g.add(box(2.9, 0.14, 3.1, 0x8a8f94, [-6, 5.12, 0])); g.add(box(3.5, 0.1, 3.9, 0xd8d3c6, [-6, 3.98, 0]));
  for (let i = 0; i < 4; i++) { for (const sz of [-1, 1]) g.add(box(0.42, 0.42, 0.06, GL, [-7.1 + i * 0.72, 3.1, sz * 1.81])); g.add(box(0.06, 0.42, 0.5, GL, [-4.39, 3.1, -1.2 + i * 0.8])); }
  g.add(box(0.06, 0.45, 2.3, GL, [-4.79, 4.6, 0])); for (const sz of [-1, 1]) g.add(box(1.9, 0.45, 0.06, GL, [-6, 4.6, sz * 1.31]));                           // bridge windows
  g.add(cyl(0.5, 0.56, 1.7, 0xb8402e, [-7, 5.95, 0], null, 12)); g.add(cyl(0.52, 0.52, 0.35, 0x222222, [-7, 6.85, 0], null, 12));
  g.add(cyl(0.05, 0.05, 1.6, 0x555555, [-5.4, 5.95, 0], null, 5)); g.add(box(0.9, 0.08, 0.16, 0xdddddd, [-5.4, 6.6, 0]));                                       // radar mast
  g.add(ball(0.75, 0.28, 0.3, 0xd9782b, [-6, 2.0, -2.0], null, 7));                                                                                            // lifeboat
  const cols = [0xb5652b, 0x2f7d72, 0xa83d32, 0xc9a23a, 0x3a6a9c, 0x6a5a8c]; let k = 0;
  for (const x of [2.5, 5.0]) for (const z of [-1.0, 1.0]) for (let y = 0; y < 2; y++) { if (x > 4.9 && y === 1 && z > 0) continue; const c = cols[k++ % 6]; g.add(box(2.35, 1.08, 1.85, c, [x, 1.92 + y * 1.1, z])); for (let r = 0; r < 4; r++) g.add(box(0.05, 1.0, 1.87, shade(c, 0.8), [x - 0.88 + r * 0.58, 1.92 + y * 1.1, z])); }
  g.add(cyl(0.06, 0.06, 3, 0x444444, [7.6, 2.8, 0], null, 5)); g.add(box(0.5, 0.35, 0.04, 0xd9b23a, [7.88, 4.05, 0]));
  for (let i = 0; i < 3; i++) g.add(cyl(0.11, 0.13, 0.4, 0x3a3a3a, [-2.6 + i * 1.7, 1.55, -1.9], null, 6));                                                     // bollards
  return g;
}
/** one clump of ripe wheat for an InstancedMesh: three crossed cards with painted stalks and ears (6 triangles) */
export function wheatClump() {
  const tex = canvasTex(128, 128, (g, W, H) => { g.clearRect(0, 0, W, H); let s = 11; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < 11; i++) { const x0 = 8 + i * 11.2 + (r() - 0.5) * 6, lean = (r() - 0.5) * 16, top = 34 + r() * 14, col = ['#c9a546', '#d6b458', '#b8923c'][i % 3];
      g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, H); g.quadraticCurveTo(x0, H * 0.6, x0 + lean, top); g.stroke();
      g.strokeStyle = '#a98a3a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x0 + 2, H); g.quadraticCurveTo(x0 + 10 * (i % 2 ? 1 : -1), H * 0.7, x0 + 16 * (i % 2 ? 1 : -1), H * 0.52); g.stroke();   // a leaf
      g.save(); g.translate(x0 + lean, top); g.rotate(lean * 0.02); g.fillStyle = ['#e0bf5e', '#d4b04c', '#e8cc74'][i % 3]; for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 3.2, -k * 5.2, 3.6, 4.6, sx * 0.35, 0, 7); g.fill(); }
      g.strokeStyle = '#e6cf86'; g.lineWidth = 1.5; for (const sx of [-1, 0, 1]) { g.beginPath(); g.moveTo(sx * 3, -26); g.lineTo(sx * 8, -40); g.stroke(); } g.restore(); } });
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const parts = []; for (let i = 0; i < 3; i++) { const p = new THREE.PlaneGeometry(1.0, 1.15); p.translate(0, 0.575, 0); p.rotateY(i * Math.PI / 3 + 0.2); parts.push(p); }
  const pos = [], uv = [], idx = []; parts.forEach((p, k) => { pos.push(...p.attributes.position.array); uv.push(...p.attributes.uv.array); for (const i of p.index.array) idx.push(i + k * 4); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return { geo, mat: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide }) };
}
