// Mashed Potatoes — models used by potatoes.js. Built from kit primitives; origin on the ground, facing +Z.
import { THREE, C, box, cyl, sphere, ball, cone, group, torus, lathe, tube, bake, picture, glow } from '../core/kit.js';
import * as P from '../core/props.js';

const dyn = (g) => { g.userData.dynamic = true; g.userData.keep = true; return g; };

export const potato = (s = 1, color = 0xc9a26b, ry = 0) => ball(0.17 * s, 0.12 * s, 0.13 * s, color, [0, 0.12 * s, 0], [0, ry, 0], 7);

// ---- hand-built leaf geometry: a few folded triangles per leaflet keep a whole field cheap ----
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
function triMesh(tris) {   // tris: [[p0, p1, p2], colour, colour1?, colour2?]
  const n = tris.length, pos = new Float32Array(n * 9), col = new Float32Array(n * 9);
  tris.forEach((t, i) => { for (let k = 0; k < 3; k++) { pos.set(t[0][k], i * 9 + k * 3); col.set(lin(t[1 + k] ?? t[1]), i * 9 + k * 3); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.castShadow = true; return m;
}
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
/** potato plant: arching stems with pointed leaflets in pairs, ~0.9 m wide and 0.65 m tall at scale 1 (~100 triangles; the geometry is reused for an instanced field) */
export function plantModel(rnd) {
  const T = [], G = [0x3f7a36, 0x4c8a3c, 0x376d31, 0x467f38], ST = 0x5c8746; let ci = 0;
  const leaf = (b, az, droop, len, wid) => {
    const d = [Math.sin(az), -droop, Math.cos(az)], side = [Math.cos(az), 0, -Math.sin(az)];
    const tip = add3(b, d, len), mid = add3(add3(b, d, len * 0.42), [0, wid * 0.45, 0]), l = add3(mid, side, wid), r = add3(mid, side, -wid);
    T.push([[b, r, tip], G[ci++ % 4]], [[b, tip, l], G[ci++ % 4]]);
  };
  const ribbon = (p, q, az, w) => { const s = [Math.cos(az) * w, 0, -Math.sin(az) * w]; T.push([[add3(p, s, -1), add3(p, s), add3(q, s)], ST], [[add3(p, s, -1), add3(q, s), add3(q, s, -1)], ST]); };
  const stem = (az, reach, h) => {
    const d = [Math.sin(az), 0, Math.cos(az)], p0 = [0, 0, 0], p1 = add3([0, h * 0.55, 0], d, reach * 0.35), p2 = add3([0, h, 0], d, reach);
    ribbon(p0, p1, az, 0.02); ribbon(p1, p2, az, 0.014);
    for (const t of [0.3, 0.68]) { const b = [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t, p1[2] + (p2[2] - p1[2]) * t]; for (const sd of [-1, 1]) leaf(b, az + sd * (1.15 + rnd() * 0.3), 0.12 + rnd() * 0.2, 0.21 + t * 0.06, 0.085); }
    leaf(p2, az + (rnd() - 0.5) * 0.4, 0.2, 0.3, 0.105);
  };
  for (let i = 0; i < 5; i++) stem(i / 5 * Math.PI * 2 + rnd() * 0.5, 0.24 + rnd() * 0.1, 0.4 + rnd() * 0.1);
  stem(rnd() * 6, 0.05, 0.6);
  for (let i = 0; i < 5; i++) leaf([0, 0.16 + (i % 2) * 0.08, 0], i / 5 * Math.PI * 2 + 0.6, 0.05, 0.34, 0.1);
  return group([triMesh(T)]);
}
/** the little star-shaped blossoms that sit on a plant (same origin as plantModel) */
export function flowerModel() {
  const T = [], W = 0xf6f1fb, Y = 0xf0c030, ST = 0x5c8746;
  [[0.12, 0.7, 0.05], [-0.14, 0.66, 0.1], [0.02, 0.74, -0.15]].forEach(([x, y, z], n) => {
    T.push([[[x - 0.012, y - 0.14, z], [x + 0.012, y - 0.14, z], [x, y, z]], ST]);
    const c = [x, y + 0.025, z], tx = (n - 1) * 0.03;
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 + n, b = a + 1.2566; T.push([[c, [x + Math.cos(a) * 0.085, y + Math.cos(a) * tx, z + Math.sin(a) * 0.085], [x + Math.cos(b) * 0.085, y + Math.cos(b) * tx, z + Math.sin(b) * 0.085]], Y, W, W]); }
  });
  return group([triMesh(T)]);
}
/** striped potato beetle, ~0.4 m (cartoon size). userData.wings flap by scale.y */
export function beetle() {
  const g = new THREE.Group();
  g.add(ball(0.15, 0.11, 0.2, 0xf2c43d, [0, 0.12, 0], null, 8));
  for (const x of [-0.09, -0.03, 0.03, 0.09]) g.add(box(0.022, 0.05, 0.3, 0x2b2118, [x, 0.2 - Math.abs(x) * 0.35, -0.01]));
  g.add(sphere(0.085, 0xd9622b, [0, 0.12, 0.2], 6)); g.add(sphere(0.022, 0x222222, [0.04, 0.16, 0.27], 4)); g.add(sphere(0.022, 0x222222, [-0.04, 0.16, 0.27], 4));
  for (const sx of [-1, 1]) { g.add(cyl(0.008, 0.008, 0.12, 0x222222, [sx * 0.04, 0.2, 0.29], [0.9, 0, sx * 0.4], 3)); for (const z of [-0.1, 0.02, 0.13]) g.add(box(0.12, 0.015, 0.02, 0x2b2118, [sx * 0.18, 0.05, z], [0, 0, sx * 0.5])); }
  const w = dyn(group([box(0.22, 0.012, 0.14, 0xffffff, [0.16, 0.05, -0.02], [0, 0, 0.4]), box(0.22, 0.012, 0.14, 0xffffff, [-0.16, 0.05, -0.02], [0, 0, -0.4])], [0, 0.2, 0])); bake(w); w.visible = false; g.add(w);
  bake(g); g.userData.wings = w; return g;
}
/** friendly farm dog, ~0.9 m long. userData.tail wags */
export function dog(c = 0xc98d4e, c2 = 0x8a5a2b) {
  const g = new THREE.Group();
  g.add(ball(0.2, 0.19, 0.36, c, [0, 0.42, 0], null, 7)); g.add(sphere(0.17, c, [0, 0.62, 0.36], 7)); g.add(ball(0.09, 0.07, 0.1, 0xe8c9a0, [0, 0.57, 0.51], null, 6)); g.add(sphere(0.035, 0x222222, [0, 0.6, 0.6], 5));
  g.add(sphere(0.025, 0x222222, [0.07, 0.67, 0.49], 4)); g.add(sphere(0.025, 0x222222, [-0.07, 0.67, 0.49], 4));
  for (const sx of [-1, 1]) { g.add(ball(0.05, 0.11, 0.04, c2, [sx * 0.15, 0.66, 0.33], [0, 0, sx * 0.5], 5)); for (const z of [-0.22, 0.24]) g.add(cyl(0.05, 0.045, 0.3, c, [sx * 0.11, 0.15, z], null, 5)); }
  g.add(box(0.3, 0.04, 0.12, 0xd9483b, [0, 0.53, 0.27]));
  const tail = dyn(group([ball(0.035, 0.035, 0.16, c2, [0, 0.06, -0.14], [0.6, 0, 0], 5)], [0, 0.5, -0.34])); bake(tail); g.add(tail);
  bake(g); g.userData.tail = tail; return g;
}
/** tractor pulling a potato harvester. Origin = tractor centre; the digger trails toward −Z; hopper at z≈−4.6. userData.heap grows. */
export function harvesterRig() {
  const g = new THREE.Group(), B = 0x355f86, S = 0xaeb6bb, K = 0x23262a, D = 0x3a3d40, X = Math.PI / 2;
  g.add(P.tractor({ color: C.red }));
  g.add(box(0.12, 0.12, 1.7, D, [0, 0.6, -1.9])); g.add(cyl(0.1, 0.1, 0.18, D, [0, 0.6, -1.08], null, 6));                    // drawbar + hitch pin
  g.add(tube([[0.25, 1.25, -0.95], [0.3, 0.95, -1.5], [0.45, 1.0, -2.3]], 0.025, K, 4));                                       // hydraulic hose
  g.add(box(2.3, 0.06, 0.9, S, [0, 0.2, -2.0], [0.3, 0, 0]));                                                                 // digging share
  for (const sx of [-1, 1]) {
    g.add(cyl(0.4, 0.4, 0.05, S, [sx * 1.22, 0.4, -1.85], [0, 0, X], 10));                                                    // cutting discs
    g.add(box(0.1, 0.55, 3.7, B, [sx * 1.15, 0.95, -3.3], [-0.42, 0, 0])); g.add(cyl(0.04, 0.04, 3.7, D, [sx * 1.15, 1.22, -3.42], [X - 0.42, 0, 0], 5));   // web sides + rail
    g.add(cyl(0.58, 0.58, 0.32, K, [sx * 1.4, 0.58, -3.9], [0, 0, X], 12)); g.add(cyl(0.3, 0.3, 0.34, 0xd6d1c2, [sx * 1.4, 0.58, -3.9], [0, 0, X], 8)); g.add(cyl(0.09, 0.09, 0.38, 0x7a7f84, [sx * 1.4, 0.58, -3.9], [0, 0, X], 6));
    g.add(box(0.1, 0.55, 0.1, D, [sx * 1.15, 0.78, -3.9])); g.add(box(0.12, 1.0, 2.0, S, [sx * 1.19, 1.6, -4.7])); g.add(box(0.2, 0.1, 2.2, B, [sx * 1.19, 2.13, -4.7]));
    g.add(box(0.14, 0.1, 0.05, sx > 0 ? 0xc8372d : 0xc8372d, [sx * 0.95, 0.98, -5.74])); g.add(box(0.14, 0.1, 0.05, 0xe89b2a, [sx * 0.78, 0.98, -5.74]));   // tail lamps
  }
  g.add(cyl(0.06, 0.06, 2.8, D, [0, 0.58, -3.9], [0, 0, X], 6));                                                              // axle
  g.add(box(2.2, 0.06, 3.6, 0x3c3f42, [0, 0.9, -3.3], [-0.42, 0, 0]));                                                        // the web (conveyor)
  for (let i = 0; i < 9; i++) g.add(box(2.2, 0.05, 0.06, 0x9aa1a6, [0, 0.2 + i * 0.18, -1.7 - i * 0.4]));
  g.add(cyl(0.1, 0.1, 2.3, 0x7a7f84, [0, 1.68, -5.0], [0, 0, X], 6));                                                        // top roller
  g.add(box(2.5, 0.2, 2.0, B, [0, 1.0, -4.7])); for (const z of [-5.65, -3.75]) { g.add(box(2.5, 1.0, 0.12, S, [0, 1.6, z])); g.add(box(2.62, 0.1, 0.2, B, [0, 2.13, z])); }
  for (const x of [-0.8, 0, 0.8]) g.add(box(0.08, 1.0, 0.05, B, [x, 1.6, -5.73]));                                            // ribs on the back wall
  g.add(box(1.9, 0.1, 0.06, K, [0, 0.98, -5.72])); g.add(cyl(0.07, 0.07, 0.14, 0xf08a24, [1.1, 2.25, -5.6], null, 6));        // light bar, beacon
  const heap = dyn(group([ball(1.05, 0.5, 0.8, 0xc9a26b, [0, 0, 0], null, 8)], [0, 1.15, -4.7])); for (let i = 0; i < 10; i++) heap.add(ball(0.2, 0.14, 0.16, i % 2 ? 0xd2ac74 : 0xb8935f, [Math.cos(i * 1.9) * 0.6, 0.42 + (i % 3) * 0.04, Math.sin(i * 1.9) * 0.45], [0, i, 0], 6));
  bake(heap); heap.scale.set(1, 0.05, 1); heap.visible = false; g.add(heap);
  bake(g); g.userData.heap = heap; return g;
}
/** water tower on stilts with a wind pump beside it. userData.fan spins about z */
export function waterTower() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) g.add(box(0.14, 3.2, 0.14, C.woodDark, [x, 1.6, z]));
  g.add(cyl(1.3, 1.3, 1.8, 0x9fb7c4, [0, 4.1, 0], null, 10)); g.add(cone(1.45, 0.8, 0x8a4b3a, [0, 5.4, 0], null, 10)); for (const y of [3.5, 4.6]) g.add(cyl(1.33, 1.33, 0.08, 0x5c6670, [0, y, 0], null, 10));
  g.add(cyl(0.06, 0.06, 3.2, 0x5c6670, [0.3, 1.6, 0.3], null, 5));
  g.add(cyl(0.05, 0.08, 5.6, 0x6e6e6e, [2.4, 2.8, 0], null, 5)); for (const sx of [-1, 1]) g.add(cyl(0.03, 0.03, 5.6, 0x6e6e6e, [2.4 + sx * 0.5, 2.7, 0.0], [0, 0, sx * 0.09], 4));
  g.add(box(0.7, 0.04, 0.5, 0xd9483b, [2.4, 5.6, -0.5], [0, 0, 0]));
  const fan = dyn(new THREE.Group()); fan.position.set(2.4, 5.6, 0.22); for (let i = 0; i < 8; i++) fan.add(group([box(0.22, 0.75, 0.03, C.grayLight, [0, 0.5, 0], [0, 0.3, 0])], null, [0, 0, i * Math.PI / 4])); fan.add(cyl(0.12, 0.12, 0.1, 0x444444, [0, 0, 0], [Math.PI / 2, 0, 0], 8)); bake(fan); g.add(fan);
  bake(g); g.userData.fan = fan; return g;
}
export function forklift() {
  const Y = 0xdba42a, K = 0x26282b, G = 0x555f68, X = Math.PI / 2, f = new THREE.Group();
  f.add(box(1.2, 0.55, 1.5, Y, [0, 0.72, -0.2])); f.add(cyl(0.6, 0.6, 0.8, Y, [0, 0.85, -0.92], null, 12)); f.add(box(1.0, 0.2, 0.75, K, [0, 1.1, -0.4]));   // body, rounded counterweight, hood
  f.add(box(0.5, 0.1, 0.5, K, [0, 1.26, -0.35])); f.add(box(0.5, 0.55, 0.1, K, [0, 1.55, -0.63], [-0.15, 0, 0]));                                          // seat
  f.add(box(1.0, 0.45, 0.14, Y, [0, 1.2, 0.45])); f.add(cyl(0.03, 0.03, 0.45, K, [0, 1.5, 0.3], [0.5, 0, 0], 5)); f.add(torus(0.16, 0.025, K, [0, 1.7, 0.2], [-1.07, 0, 0], 10));   // dash, steering wheel
  for (const sx of [-1, 1]) {
    f.add(box(0.07, 1.3, 0.07, K, [sx * 0.55, 1.85, 0.45])); f.add(box(0.07, 1.3, 0.07, K, [sx * 0.55, 1.85, -0.8])); f.add(box(0.07, 0.07, 1.35, K, [sx * 0.55, 2.5, -0.17]));   // overhead guard
    f.add(box(0.1, 2.5, 0.12, G, [sx * 0.38, 1.3, 0.74])); f.add(box(0.12, 0.05, 1.1, 0x8a949e, [sx * 0.3, 0.48, 1.4])); f.add(box(0.12, 0.5, 0.05, 0x8a949e, [sx * 0.3, 0.72, 0.86]));   // mast, forks
    f.add(cyl(0.36, 0.36, 0.28, K, [sx * 0.6, 0.36, 0.45], [0, 0, X], 12)); f.add(cyl(0.17, 0.17, 0.3, 0xcfd2d4, [sx * 0.6, 0.36, 0.45], [0, 0, X], 8));
    f.add(cyl(0.3, 0.3, 0.26, K, [sx * 0.58, 0.3, -0.9], [0, 0, X], 12)); f.add(cyl(0.14, 0.14, 0.28, 0xcfd2d4, [sx * 0.58, 0.3, -0.9], [0, 0, X], 8));
  }
  for (const z of [-0.6, -0.17, 0.26]) f.add(box(1.1, 0.05, 0.06, K, [0, 2.5, z]));
  for (const y of [0.5, 1.5, 2.5]) f.add(box(0.86, 0.08, 0.08, G, [0, y, 0.74])); f.add(box(0.9, 0.5, 0.06, K, [0, 0.75, 0.82])); f.add(cyl(0.05, 0.05, 1.9, 0xc9ced2, [0, 1.2, 0.7], null, 6));   // mast bars, carriage, lift ram
  f.add(cyl(0.07, 0.07, 0.12, 0xf08a24, [0.45, 2.6, -0.7], null, 6));
  f.add(box(1.0, 0.14, 1.0, C.woodLight, [0, 0.58, 1.5])); f.add(at(P.sack(), 0, 0.65, 1.5));
  return f;
}
/** wash tunnel that stands over the belt (origin: belt centre, on the floor). The brushes and the spray are added by the story. */
export function washStation() {
  const S = 0xb9c1c6, D = 0x6c757c, W = 0x3f78b5, X = Math.PI / 2, g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.08, 2.7, 0.08, D, [sx * 0.86, 1.35, sz * 0.7]));
  g.add(box(1.86, 0.08, 1.54, S, [0, 2.72, 0])); g.add(box(1.78, 1.5, 0.05, S, [0, 1.95, -0.7])); g.add(box(1.78, 0.42, 0.05, S, [0, 2.49, 0.7])); g.add(box(0.7, 0.2, 0.02, W, [0, 2.5, 0.73])); g.add(box(0.5, 0.04, 0.025, 0xf4f6f7, [0, 2.5, 0.735]));
  for (const z of [-0.25, 0.25]) { g.add(cyl(0.035, 0.035, 1.7, D, [0, 2.52, z], [0, 0, X], 6)); for (const x of [-0.6, -0.2, 0.2, 0.6]) g.add(cone(0.06, 0.14, D, [x, 2.43, z], [Math.PI, 0, 0], 6)); }
  g.add(cyl(0.06, 0.06, 2.4, W, [0.6, 3.95, -0.5], null, 6)); g.add(sphere(0.08, W, [0.6, 5.15, -0.5], 6)); g.add(cyl(0.06, 0.06, 7.0, W, [0.6, 5.15, -4.0], [X, 0, 0], 6)); g.add(torus(0.13, 0.03, 0xc8372d, [0.6, 3.4, -0.42], null, 8));   // water pipe from the wall, with a valve
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) g.add(box(0.02, 0.6, 0.15, 0x39434a, [sx * 0.9, 2.06, -0.45 + i * 0.18]));   // rubber curtain strips
  g.add(box(1.9, 0.08, 1.5, S, [0, 0.4, 0])); g.add(cyl(0.05, 0.05, 0.4, D, [0.7, 0.2, 0.55], null, 6));                          // drip tray + drain
  return g;
}
/** control post for the wash lever (the lever itself is separate, pivot at y = 0.85) */
export function leverPost() {
  return group([box(0.44, 0.04, 0.44, 0xd9a92b, [0, 0.02, 0]), box(0.14, 0.62, 0.14, 0x5d666d, [0, 0.33, 0]), box(0.38, 0.3, 0.3, 0x8d969c, [0, 0.75, 0]), box(0.08, 0.02, 0.24, 0x222222, [0, 0.905, 0]),
    cyl(0.045, 0.045, 0.03, 0x3fa34d, [-0.09, 0.8, 0.16], [Math.PI / 2, 0, 0], 8), cyl(0.045, 0.045, 0.03, 0xc8372d, [0.09, 0.8, 0.16], [Math.PI / 2, 0, 0], 8), box(0.22, 0.05, 0.01, 0xf2f2f2, [0, 0.67, 0.155])]);
}
/** ribbed pumpkin, radius ≈ s, sitting on the ground */
export function pumpkin(s = 0.45, color = 0xd9822b) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(ball(s * 0.52, s * 0.7, s * 0.52, color, [Math.cos(a) * s * 0.5, s * 0.7, Math.sin(a) * s * 0.5], [0, -a, 0], 6)); }
  g.add(cyl(s * 0.06, s * 0.11, s * 0.32, 0x6e6a3a, [s * 0.03, s * 1.45, 0], [0, 0, -0.25], 5));
  return g;
}
/** supermarket checkout lane: origin at the counter centre, the belt runs along Z, the cashier stands on the −X side */
export function checkout() {
  const S = 0x8f979c, K = 0x2d3136, g = new THREE.Group();
  g.add(box(1.1, 0.96, 3.6, 0xd8d0bf, [0, 0.48, 0])); g.add(box(1.14, 0.12, 3.64, 0x4a4f54, [0, 0.06, 0])); g.add(box(0.03, 0.22, 3.6, 0x2f6d3a, [0.56, 0.78, 0])); g.add(box(1.16, 0.06, 3.7, S, [0, 0.99, 0]));
  g.add(box(0.72, 0.03, 2.1, 0x1d2023, [0.05, 1.03, -0.65])); for (const z of [-1.7, 0.4]) g.add(cyl(0.03, 0.03, 0.72, 0x555c61, [0.05, 1.03, z], [0, 0, Math.PI / 2], 6));            // belt
  g.add(box(0.5, 0.02, 0.45, 0x16242c, [0.05, 1.03, 0.85])); g.add(box(0.3, 0.006, 0.02, glow(0xff5a4a), [0.05, 1.042, 0.85])); g.add(box(0.12, 0.42, 0.42, K, [-0.42, 1.23, 0.85]));      // scanner
  g.add(cyl(0.03, 0.03, 0.34, K, [-0.3, 1.18, 1.45], null, 5)); g.add(box(0.07, 0.34, 0.46, K, [-0.3, 1.5, 1.45])); g.add(box(0.012, 0.28, 0.4, glow(0x9fe8a0), [-0.34, 1.5, 1.45]));   // cashier's screen
  g.add(cyl(0.02, 0.02, 0.2, K, [0.38, 1.1, 1.4], null, 5)); g.add(box(0.12, 0.04, 0.18, K, [0.38, 1.21, 1.4], [0.5, 0, 0])); g.add(box(0.08, 0.012, 0.06, glow(0x9fd6f2), [0.38, 1.245, 1.37], [0.5, 0, 0]));   // card reader
  g.add(cyl(0.035, 0.035, 1.1, S, [0.35, 1.55, -1.65], null, 6)); g.add(cyl(0.13, 0.13, 0.2, glow(0x7fe08a), [0.35, 2.2, -1.65], null, 8));                                          // lane light
  return g;
}
/** fridge-freezer, 2.1 m tall, doors face +Z */
export function fridge() {
  const A = 0xdfe2e3, Dr = 0xeceeee, g = new THREE.Group();
  g.add(box(1.4, 0.06, 1.2, 0x333333, [0, 0.03, 0])); g.add(box(1.5, 2.06, 1.22, A, [0, 1.08, -0.03])); g.add(box(1.46, 1.26, 0.06, Dr, [0, 0.72, 0.61])); g.add(box(1.46, 0.66, 0.06, Dr, [0, 1.74, 0.61]));
  g.add(cyl(0.025, 0.025, 0.55, C.metal, [-0.58, 1.02, 0.69], null, 6)); g.add(cyl(0.025, 0.025, 0.36, C.metal, [-0.58, 1.68, 0.69], null, 6));
  g.add(box(0.16, 0.2, 0.012, 0xfff1a8, [0.3, 1.78, 0.645], [0, 0, 0.08])); g.add(box(0.05, 0.05, 0.02, 0xc8372d, [0.3, 1.86, 0.65])); g.add(box(0.2, 0.15, 0.012, 0xcfe6f5, [0.1, 1.1, 0.645], [0, 0, -0.06])); g.add(box(0.05, 0.05, 0.02, 0xe89b2a, [0.1, 1.16, 0.65]));
  return g;
}
/** wooden kitchen chair with a cushion; the sitter faces +Z */
export function chair(W = C.woodLight) {
  const g = new THREE.Group();
  g.add(box(0.5, 0.05, 0.5, W, [0, 0.48, 0])); g.add(box(0.44, 0.04, 0.44, 0xb5523f, [0, 0.525, 0.01]));
  for (const sx of [-1, 1]) { g.add(box(0.05, 0.46, 0.05, W, [sx * 0.21, 0.23, 0.21])); g.add(box(0.05, 1.08, 0.05, W, [sx * 0.21, 0.54, -0.22])); }
  g.add(box(0.47, 0.1, 0.035, W, [0, 1.02, -0.22])); g.add(box(0.44, 0.07, 0.03, W, [0, 0.8, -0.22])); g.add(box(0.44, 0.04, 0.03, W, [0, 0.3, -0.22]));
  return g;
}
function at(o, x, y, z) { o.position.set(x, y, z); return o; }
/** a round dial face (flat, facing +Z) with tick marks; the needle is separate */
export function dialFace(r = 0.4, col = '#d9483b') {
  return picture(r * 2, r * 2, (g, W, H) => { g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, 7); g.fill(); g.strokeStyle = col; g.lineWidth = W * 0.07; g.stroke(); g.strokeStyle = '#4a2c17'; g.lineWidth = W * 0.025; for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.75 + i * 1.5 / 8); g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * W * 0.3, H / 2 + Math.sin(a) * W * 0.3); g.lineTo(W / 2 + Math.cos(a) * W * 0.4, H / 2 + Math.sin(a) * W * 0.4); g.stroke(); } }, 128);
}
/** shopping cart */
export function cart(col = 0x9aa4ad) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) { g.add(box(0.04, 0.45, 0.9, col, [sx * 0.28, 0.75, 0])); g.add(cyl(0.07, 0.07, 0.05, 0x333333, [sx * 0.26, 0.07, 0.38], [0, 0, Math.PI / 2], 6)); g.add(cyl(0.07, 0.07, 0.05, 0x333333, [sx * 0.26, 0.07, -0.38], [0, 0, Math.PI / 2], 6)); g.add(box(0.03, 0.45, 0.03, col, [sx * 0.27, 0.3, -0.42])); }
  g.add(box(0.6, 0.04, 0.9, col, [0, 0.54, 0])); g.add(box(0.6, 0.45, 0.04, col, [0, 0.75, 0.45])); g.add(box(0.6, 0.45, 0.04, col, [0, 0.75, -0.45])); g.add(box(0.66, 0.05, 0.05, C.red, [0, 1.02, -0.55])); g.add(box(0.6, 0.04, 0.8, col, [0, 0.16, 0]));
  return g;
}
