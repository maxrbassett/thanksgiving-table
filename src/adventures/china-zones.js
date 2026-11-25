// Scenery for "The China Plates": six little dioramas, ~150 m apart along X.
// Each builder adds the static scenery (baked) + colliders and returns handles to the moving parts.
import { THREE, C, mat, glow, box, cyl, cone, sphere, ball, torus, plane, disc, lathe, tube, group, bake, sign, picture, seeded, grain } from '../core/kit.js';
import * as P from '../core/props.js';

const PI = Math.PI;
export const dyn = (g) => { bake(g); g.userData.dynamic = true; return g; };
const at = (o, x, y, z, ry) => { o.position.set(x, y, z); if (ry !== undefined) o.rotation.y = ry; return o; };
/** a mesh with its own (animatable) material */
export const own = (geoMesh, color, opts = {}) => { geoMesh.material = opts.basic ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color, emissive: opts.emissive ?? 0x000000, side: opts.double ? THREE.DoubleSide : THREE.FrontSide, transparent: !!opts.opacity, opacity: opts.opacity ?? 1 }); geoMesh.userData.noBake = true; return geoMesh; };
/** give a big flat surface (a floor, a yard) the soft natural grain instead of one flat colour (costs 1 draw) */
export const grained = (m, color, rep = 4) => { m.material = new THREE.MeshLambertMaterial({ color, map: grain(rep) }); return m; };
const vaseFine = [[0, 0], [0.15, 0], [0.17, 0.02], [0.24, 0.14], [0.29, 0.27], [0.3, 0.4], [0.27, 0.52], [0.19, 0.63], [0.12, 0.71], [0.1, 0.78], [0.11, 0.84], [0.15, 0.9]];
export const fineVase = (s = 1, color = 0xfafafa) => lathe(vaseFine.map(p => [p[0] * s, p[1] * s]), color, null, 20);
const vaseProfile = [[0.0, 0], [0.16, 0], [0.26, 0.18], [0.3, 0.38], [0.22, 0.6], [0.11, 0.72], [0.1, 0.82], [0.15, 0.9]];
const bowlProfile = [[0, 0.02], [0.12, 0], [0.26, 0.12], [0.3, 0.22]];
export const vase = (s = 1, color = 0xfafafa) => lathe(vaseProfile.map(p => [p[0] * s, p[1] * s]), color, null, 10);
export const bowl = (s = 1, color = 0xfafafa) => lathe(bowlProfile.map(p => [p[0] * s, p[1] * s]), color, null, 10);
const blueVase = (s = 1) => group([vase(s), cyl(0.305 * s, 0.305 * s, 0.05 * s, 0x2a5cab, [0, 0.38 * s, 0], null, 10), cyl(0.125 * s, 0.125 * s, 0.04 * s, 0x2a5cab, [0, 0.74 * s, 0], null, 10), cyl(0.23 * s, 0.2 * s, 0.04 * s, 0x2a5cab, [0, 0.12 * s, 0], null, 10)]);
const whitePlate = (r = 0.3, color = 0xfafafa) => lathe([[0, 0.02], [r * 0.6, 0.02], [r, 0.07]], color, null, 12);
function bamboo(rnd, n = 6) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const h = 4 + rnd() * 2.5, x = (rnd() - 0.5) * 1.4, z = (rnd() - 0.5) * 1.4, lean = (rnd() - 0.5) * 0.12; const s = cyl(0.055, 0.07, h, 0x7fb24a, [x, h / 2, z], [lean, 0, lean], 5); g.add(s); for (let k = 1; k < 3; k++) g.add(cyl(0.075, 0.075, 0.05, 0x5e9438, [x, h * k / 3, z], null, 5)); g.add(ball(0.55, 0.28, 0.55, 0x5aa845, [x + lean * 3, h, z], null, 6)); g.add(ball(0.4, 0.2, 0.4, 0x6fbb4f, [x + 0.3, h * 0.78, z - 0.2], null, 6)); } return g; }
function lantern(s = 1) { return group([sphere(0.3 * s, 0xd2342a, [0, 0, 0], 8), cyl(0.14 * s, 0.14 * s, 0.08 * s, C.gold, [0, 0.28 * s, 0], null, 6), cyl(0.14 * s, 0.14 * s, 0.08 * s, C.gold, [0, -0.28 * s, 0], null, 6), cyl(0.02 * s, 0.02 * s, 0.3 * s, C.gold, [0, -0.45 * s, 0], null, 4)]); }
export function logBundle() { return dyn(group([cyl(0.11, 0.11, 0.8, 0x8a5a2b, [0, 0.12, 0.1], [0, 0, PI / 2], 6), cyl(0.1, 0.1, 0.75, 0x9a6b3b, [0, 0.12, -0.12], [0, 0, PI / 2], 6), cyl(0.1, 0.1, 0.7, 0x7a4a22, [0, 0.3, 0], [0, 0, PI / 2], 6), cyl(0.105, 0.105, 0.02, 0xe3c89a, [0.4, 0.12, 0.1], [0, 0, PI / 2], 6), cyl(0.1, 0.1, 0.02, 0xe3c89a, [0.36, 0.3, 0], [0, 0, PI / 2], 6)])); }
export function pickaxe() { return dyn(group([cyl(0.03, 0.035, 0.9, C.wood, [0, 0, 0.3], [PI / 2, 0, 0], 5), box(0.08, 0.62, 0.09, 0x555c63, [0, 0, 0.72]), cone(0.05, 0.2, 0x555c63, [0, 0.4, 0.72], null, 5), cone(0.05, 0.2, 0x555c63, [0, -0.4, 0.72], [PI, 0, 0], 5)])); }
/** mine cart, long axis = Z (it "faces" +Z so rides turn it correctly) */
export function mineCart(fill = 0) {
  const g = group([box(1.0, 0.1, 1.7, 0x4a4038, [0, 0.5, 0]), box(0.08, 0.7, 1.7, 0x7a6248, [0.5, 0.85, 0], [0, 0, -0.12]), box(0.08, 0.7, 1.7, 0x7a6248, [-0.5, 0.85, 0], [0, 0, 0.12]), box(1.05, 0.7, 0.08, 0x6b5540, [0, 0.85, 0.85]), box(1.05, 0.7, 0.08, 0x6b5540, [0, 0.85, -0.85]),
    box(1.2, 0.08, 0.1, 0x3a3a3a, [0, 1.2, 0.86]), box(1.2, 0.08, 0.1, 0x3a3a3a, [0, 1.2, -0.86]), box(0.9, 0.12, 0.12, 0x333333, [0, 0.28, 0.55]), box(0.9, 0.12, 0.12, 0x333333, [0, 0.28, -0.55])]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.add(cyl(0.25, 0.25, 0.09, 0x2c2c2c, [sx * 0.45, 0.25, sz * 0.55], [0, 0, PI / 2], 12)); g.add(cyl(0.29, 0.29, 0.03, 0x3a3a3a, [sx * 0.39, 0.25, sz * 0.55], [0, 0, PI / 2], 12)); g.add(cyl(0.09, 0.09, 0.13, 0x8c959c, [sx * 0.47, 0.25, sz * 0.55], [0, 0, PI / 2], 6)); g.add(box(0.07, 0.74, 0.1, 0x3a3a3a, [sx * 0.53, 0.85, sz * 0.8], [0, 0, -sx * 0.12])); }
  for (const sz of [-1, 1]) { g.add(cyl(0.045, 0.045, 1.0, 0x55606a, [0, 0.25, sz * 0.55], [0, 0, PI / 2], 5)); g.add(box(0.16, 0.1, 0.22, 0x3a3a3a, [0, 0.5, sz * 0.95])); g.add(box(0.05, 0.7, 0.1, 0x3a3a3a, [0, 0.85, sz * 0.9])); }
  bake(g); g.userData.dynamic = true; g.userData.seat = [0, 0.55, 0.2]; // the rider sits on the load: head and shoulders above the rim, the straight legs stay inside the front wall
  const load = new THREE.Group(); load.userData.dynamic = true; g.add(load); g.userData.load = load;
  return g;
}
export const clayLump = (s = 1, color = 0xf1eee4) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22 * s, 0), mat(color)); m.scale.y = 0.75; m.castShadow = true; return m; };

// ============================================================ 1 — a kiln courtyard in China, long ago
export function zoneChina(ctx, X) {
  const g = new THREE.Group(), r = seeded(11), out = {};
  g.add(grained(plane(25, 15.5, 0xd8cfb8, [-3.5, 0.02, -3.6]), 0xe6ddc6, 5));
  for (let i = 0; i < 30; i++) g.add(plane(1 + r() * 0.9, 1 + r() * 0.9, r() < 0.5 ? 0xc9bfa6 : 0xe4dcc8, [-15 + r() * 23, 0.03, -10.5 + r() * 13.5]));
  g.add(ball(18, 6.5, 8, 0x7fae5e, [10, -0.9, -20.5], null, 14));
  g.add(ball(14, 4.5, 7, 0x8ab868, [-22, -0.9, -22], null, 12));
  for (const [x, z, h, c] of [[-42, -70, 30, 0x86a596], [-16, -84, 40, 0x7b9c8e], [10, -76, 28, 0x8fae9e], [34, -70, 36, 0x80a090], [60, -82, 30, 0x8aa898], [-66, -78, 26, 0x8aa898]]) { const peak = (hh, px, pz) => lathe([[hh * 0.3, 0], [hh * 0.25, hh * 0.38], [hh * 0.18, hh * 0.68], [hh * 0.1, hh * 0.9], [0.01, hh]], c, [px, -1, pz], 8); g.add(peak(h, x, z)); g.add(peak(h * 0.62, x + h * 0.26, z + 3)); }
  // --- the dragon kiln climbing the hill
  const RY = 0.51, RZ = 0.33, KX = -3.5, KZ = -8.6; out.kiln = { RY, RZ, KX, KZ };
  const kiln = new THREE.Group(); kiln.position.set(KX, 0, KZ); kiln.rotation.set(0, RY, RZ);
  kiln.add(box(16.4, 3, 2.1, 0x86b262, [7.6, -1.6, 0])); kiln.add(cyl(2.6, 2.6, 17.2, 0x86b262, [7.9, -2.66, 0], [0, 0, PI / 2], 14));
  for (let i = 0; i < 8; i++) { const x = 0.95 + i * 1.85, col = i % 2 ? 0xb8683e : 0xa55a36; kiln.add(box(1.85, 0.9, 1.8, col, [x, 0.45, 0])); kiln.add(cyl(0.9, 0.9, 1.85, col, [x, 0.9, 0], [0, 0, PI / 2], 14)); kiln.add(box(0.46, 0.5, 0.12, 0x24150e, [x, 0.6, 0.9])); kiln.add(cyl(0.23, 0.23, 0.12, 0x24150e, [x, 0.85, 0.9], [PI / 2, 0, 0], 8)); kiln.add(box(0.62, 0.08, 0.16, 0x7a4a32, [x, 0.33, 0.93])); kiln.add(box(0.1, 1.5, 1.9, 0x8a4a30, [x + 0.92, 0.75, 0])); }
  kiln.add(cyl(0.46, 0.64, 2.6, 0x8a4a30, [15.4, 1.4, 0], [0, 0, -RZ], 8)); kiln.add(cyl(0.56, 0.56, 0.22, 0x6e3a26, [15.05, 2.75, 0], [0, 0, -RZ], 8));
  g.add(kiln);
  const fb = new THREE.Group(); fb.position.set(KX, 0, KZ); fb.rotation.y = RY;
  fb.add(box(1.9, 1.5, 2.3, 0x8a4a30, [-0.85, 0.75, 0])); fb.add(cyl(1.15, 1.15, 1.9, 0x8a4a30, [-0.85, 1.5, 0], [0, 0, PI / 2], 14)); fb.add(box(0.14, 0.95, 1.05, 0x1a0f0a, [-1.76, 0.62, 0])); fb.add(cyl(0.52, 0.52, 0.14, 0x1a0f0a, [-1.76, 1.08, 0], [0, 0, PI / 2], 10));
  fb.add(box(0.5, 0.12, 1.5, 0x9a9a94, [-2.0, 0.1, 0]));
  g.add(fb);
  // fires: one small glowing mesh per stoke hole, lit one after another
  const fires = new THREE.Group(); fires.position.copy(kiln.position); fires.rotation.copy(kiln.rotation); fires.userData.dynamic = true; out.fires = [];
  for (let i = 0; i < 8; i++) { const f = box(0.36, 0.4, 0.08, glow(0xffa030), [0.95 + i * 1.85, 0.6, 0.95]); f.visible = false; fires.add(f); out.fires.push(f); }
  ctx.add(fires, X + KX, KZ);
  const mouth = new THREE.Group(); mouth.position.set(KX, 0, KZ); mouth.rotation.y = RY; mouth.userData.dynamic = true;
  out.mouthFire = box(0.08, 0.8, 0.9, glow(0xff8a20), [-1.82, 0.62, 0]); out.mouthFire.visible = false; mouth.add(out.mouthFire); ctx.add(mouth, X + KX, KZ);
  const cs = Math.cos(RY), sn = Math.sin(RY), cz = Math.cos(RZ);
  out.kilnPt = (t, y = 0) => [X + KX + t * cz * cs, y + t * Math.sin(RZ), KZ - t * cz * sn]; // a point t metres up the kiln
  out.mouthPos = [X + KX - 2.0 * cs, 0.7, KZ + 2.0 * sn];
  for (let t = -0.9; t < 16; t += 1.9) { const p = out.kilnPt(t); ctx.collideCircle(p[0], p[2], 1.55); }
  // wood pile beside the fire mouth
  const pile = group([], [-7.3, 0, -10.7], [0, 0.5, 0]); for (let i = 0; i < 9; i++) pile.add(cyl(0.13, 0.13, 1.3, i % 2 ? 0x8a5a2b : 0x9a6b3b, [0, 0.14 + Math.floor(i / 4) * 0.25, -0.45 + (i % 4) * 0.3 + (i > 3 ? 0.15 : 0)], [0, 0, PI / 2], 6)); g.add(pile); ctx.collideCircle(X - 7.3, -10.7, 0.9);
  // --- potter's pavilion
  const pav = group([], [-12.2, 0, -7.6]);
  pav.add(box(7.2, 0.3, 6, 0xb9b2a2, [0, 0.15, 0])); pav.add(box(2.4, 0.15, 0.8, 0xb9b2a2, [0, 0.08, 3.3]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { pav.add(cyl(0.19, 0.19, 3.3, 0xb5382c, [sx * 3.1, 1.95, sz * 2.5], null, 8)); pav.add(box(0.5, 0.25, 0.5, 0x8c8478, [sx * 3.1, 0.42, sz * 2.5])); }
  pav.add(box(8.6, 0.2, 7.4, 0x2f5650, [0, 3.7, 0])); pav.add(box(6.6, 0.35, 0.2, 0xb5382c, [0, 3.4, 2.5])); 
  const roof = lathe([[5.95, 0], [4.6, 0.3], [3.3, 0.74], [2.0, 1.3], [0.9, 1.86], [0.12, 2.2]], 0x3f6e6a, [0, 3.8, 0], 4); roof.geometry = roof.geometry.toNonIndexed(); roof.geometry.computeVertexNormals(); roof.rotation.y = PI / 4; roof.scale.set(1, 1, 0.86); pav.add(roof);
  pav.add(sphere(0.28, C.gold, [0, 5.95, 0], 7));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pav.add(cone(0.28, 1.0, 0x2f5650, [sx * 4.35, 4.05, sz * 3.75], [sz * 0.5, 0, -sx * 0.6], 5));
  pav.add(box(6.4, 2.9, 0.2, 0xf0e6d0, [0, 1.75, -2.6]));
  for (let s = 0; s < 2; s++) { pav.add(box(5.6, 0.08, 0.5, C.woodDark, [0, 1.2 + s * 1.0, -2.3])); for (let i = 0; i < 7; i++) { const v = (i + s) % 3 === 0 ? blueVase(0.75) : (i + s) % 3 === 1 ? vase(0.7, 0xf4efe2) : bowl(1, 0xf4efe2); v.position.set(-2.4 + i * 0.8, 1.24 + s * 1.0, -2.3); pav.add(v); } }
  pav.add(cyl(0.3, 0.42, 0.6, C.woodDark, [0.4, 0.6, 1.3], null, 8));
  g.add(pav); ctx.collideBox(X - 12.2, -7.6, 7.4, 6.2);
  out.wheel = dyn(group([cyl(0.55, 0.55, 0.1, 0x8c8478, [0, 0, 0], null, 12), box(0.2, 0.06, 0.2, 0x6f6a60, [0.35, 0.07, 0]), vase(0.8, 0xd9cbb0)]));
  ctx.add(out.wheel, X - 11.8, -6.3); out.wheel.position.y = 0.95;
  // --- garden wall with a moon gate (the way onward)
  const GX = 12.6, GZ = -3.2, GR = -0.95; out.gate = [X + GX, GZ];
  const wall = group([], [GX, 0, GZ], [0, GR, 0]);
  for (const sx of [-1, 1]) { wall.add(box(3.4, 3.3, 0.5, 0xf0e6d0, [sx * 3.2, 1.65, 0])); wall.add(box(0.75, 0.75, 0.46, 0xf0e6d0, [sx * 1.42, 2.9, 0], [0, 0, PI / 4])); wall.add(box(0.75, 0.75, 0.46, 0xf0e6d0, [sx * 1.42, 0.1, 0], [0, 0, PI / 4])); }
  wall.add(box(9.8, 0.55, 0.5, 0xf0e6d0, [0, 3.3, 0])); wall.add(box(10.2, 0.22, 1.1, 0x3f6e6a, [0, 3.68, 0])); wall.add(box(10.2, 0.2, 0.5, 0x2f5650, [0, 3.88, 0]));
  wall.add(torus(1.55, 0.24, 0x6f6a60, [0, 1.5, 0], null, 30));
  g.add(wall);
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { const d = sx * (1.9 + k * 1.0); ctx.collideCircle(X + GX + d * Math.cos(GR), GZ - d * Math.sin(GR), 0.55); }
  out.portal = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); out.portal.position.set(X + GX, 1.5, GZ); out.portal.rotation.y = GR; out.portal.visible = false; ctx.add(out.portal); out.gateBlock = ctx.collideCircle(X + GX, GZ, 1.3);
  // --- drying rack, jars, lanterns, pond, plants
  const rack = group([P.tableProp(3.6, 1.1, 0.85, C.woodLight)], [5.2, 0, -3.2], [0, -0.25, 0]); for (let i = 0; i < 8; i++) { const v = i % 3 === 1 ? vase(0.62, 0xeee8da) : bowl(1.05, 0xeee8da); v.position.set(-1.4 + (i % 4) * 0.93, 0.9, -0.25 + Math.floor(i / 4) * 0.5); rack.add(v); } g.add(rack); ctx.collideBox(X + 5.2, -3.2, 3.6, 1.5);
  for (const [x, z, s] of [[-16.2, -2.5, 1.5], [-15.3, -3.6, 1.1], [9.6, -7.8, 1.3]]) { const j = lathe([[0, 0], [0.3, 0], [0.5, 0.45], [0.42, 0.85], [0.28, 0.95], [0.33, 1.02]].map(p => [p[0] * s, p[1] * s]), 0x7a4a2a, [x, 0, z], 9); g.add(j); ctx.collideCircle(X + x, z, 0.5 * s); }
  for (const x of [-14.6, -12.2, -9.8]) { const l = lantern(0.85); l.position.set(x, 3.15, -4.85); g.add(l); g.add(cyl(0.015, 0.015, 0.35, 0x3a2a1a, [x, 3.5, -4.85], null, 4)); }
  for (const sx of [-1, 1]) { const l = lantern(0.85); l.position.set(GX + sx * 2.6 * Math.cos(GR) - 0.45, 2.6, GZ - sx * 2.6 * Math.sin(GR) + 0.35); g.add(l); }
  g.add(disc(2.3, 0x5aa9c9, [7.2, 0.04, 2.3])); g.add(torus(2.3, 0.22, 0x9a9a94, [7.2, 0.08, 2.3], [PI / 2, 0, 0], 20)); for (const [x, z] of [[6.4, 2.0], [7.9, 3.0], [7.6, 1.4]]) { g.add(disc(0.32, 0x4f9d4a, [x, 0.06, z], 8)); g.add(sphere(0.1, C.pink, [x + 0.1, 0.14, z], 5)); } ctx.collideCircle(X + 7.2, 2.3, 2.4);
  out.koi = dyn(group([0, 2.2, 4.1].map((a, i) => group([ball(0.26, 0.06, 0.1, i === 1 ? 0xfafafa : 0xf08a24, [0, 0, 0]), cone(0.1, 0.2, i === 1 ? 0xf08a24 : 0xfafafa, [-0.3, 0, 0], [0, 0, -PI / 2], 4)], [Math.cos(a) * (1.0 + i * 0.35), 0, Math.sin(a) * (1.0 + i * 0.35)], [0, -a - PI / 2, 0])))); out.koi.position.set(X + 7.2, 0.075, 2.3); ctx.add(out.koi);
  const sl = group([cyl(0.22, 0.3, 0.9, 0x9a9a94, [0, 0.45, 0], null, 6), box(0.6, 0.12, 0.6, 0x8c8478, [0, 0.95, 0]), box(0.4, 0.4, 0.4, 0x9a9a94, [0, 1.2, 0]), box(0.26, 0.26, 0.42, glow(0xffd98a), [0, 1.2, 0]), cone(0.5, 0.4, 0x6f6a60, [0, 1.6, 0], [0, PI / 4, 0], 4)], [-3.6, 0, 2.8]); g.add(sl); ctx.collideCircle(X - 3.6, 2.8, 0.4);
  for (const [x, z] of [[-17.5, -6.5], [14.5, -8.5], [-17.6, 3.4], [18.5, 1.6], [2.5, -13.5]]) { const b = bamboo(r, 6); b.position.set(x, 0, z); g.add(b); }
  g.add(P.scatter(16, 90, 50, (rr) => P.tree({ h: 4 + rr() * 3, kind: rr() < 0.65 ? 'pine' : 'round' }), { seed: 6, keep: (x, z) => (Math.abs(x + 2) > 21 || z < -26) && z < 4 && !(x > -6 && x < 30 && z > -30 && z < -10) }));
  g.add(P.scatter(12, 44, 8, () => P.flower(), { seed: 9, keep: (x) => Math.abs(x - 7.2) > 3 }).translateZ(7.5));
  g.add(P.scatter(8, 50, 30, () => P.bush(), { seed: 4, keep: (x, z) => Math.abs(x + 2) > 19 && z < 4 }));
  // pedestal where the finished vase will stand
  g.add(lathe([[0, 0], [0.56, 0], [0.56, 0.1], [0.44, 0.18], [0.38, 0.58], [0.47, 0.68], [0.5, 0.8], [0, 0.8]], 0xa5a198, [-1.6, 0, -4.6], 14)); ctx.collideCircle(X - 1.6, -4.6, 0.55); out.pedestal = [X - 1.6, 0.82, -4.6];
  ctx.addStatic(g, X, 0);
  out.logSpots = [[-9, -0.6], [-3.2, 0.6], [2.2, -5.2], [8.4, -5.6], [2.6, 2.2]].map(p => [X + p[0], p[1]]);
  return out;
}

// ============================================================ 2 — the kaolin mine
export function zoneMine(ctx, X) {
  const g = new THREE.Group(), r = seeded(23), out = {};
  const rockCols = [0x5a4a3c, 0x66543f, 0x4a3b2e, 0x705c46];
  g.add(grained(plane(48, 19, 0x6a5642, [2, 0.02, -3]), 0x75604a, 6));
  for (let i = 0; i < 26; i++) g.add(plane(1.5 + r() * 2, 1 + r() * 1.5, r() < 0.5 ? 0x5f4c3a : 0x76614b, [-19 + r() * 42, 0.03, -9 + r() * 13]));
  g.add(box(48, 9, 2, 0x4e3f32, [2, 4.5, -11.2]));
  g.add(box(70, 16, 1, glow(0x17110d), [2, 17, -12]));   // darkness above the rock wall: an upright phone's tall picture looks over the wall, and the bright horizon would show as a white line
  for (let i = 0; i < 46; i++) { const s = 2.2 + r() * 2.6, k = P.rock({ s, color: rockCols[i % 4], ry: r() * 6 }); k.position.set(-21 + (i / 46) * 46 + r() * 1.2, r() * 6.5 - 0.5, -10.4 + r() * 0.5); g.add(k); }
  for (let i = 0; i < 22; i++) { const s = 0.7 + r() * 1.1, k = P.rock({ s, color: i % 3 ? 0xefeadc : 0xdcd5c4, ry: r() * 6 }); const cx = [-16, -13.5, 0.5, 6.5, 13, 17.5][i % 6]; k.position.set(cx + (r() - 0.5) * 2.2, 2.4 + r() * 3.6, -9.55 + r() * 0.3); g.add(k); }
  g.add(box(2, 9, 19, 0x4a3b2e, [-21.6, 4.5, -3])); for (let i = 0; i < 8; i++) { const k = P.rock({ s: 3 + r() * 2, color: rockCols[i % 4], ry: r() * 6 }); k.position.set(-20.6, r() * 5, -9 + i * 1.9); g.add(k); }
  // right end: the tunnel mouth, daylight beyond
  g.add(box(2, 9, 5.6, 0x4a3b2e, [25, 4.5, -9.6])); g.add(box(2, 9, 8, 0x4a3b2e, [25, 4.5, 2.2])); g.add(box(2, 4.6, 5, 0x4a3b2e, [25, 6.7, -4.3]));
  g.add(box(0.2, 4.4, 5, glow(0xd9f1ff), [25.6, 2.2, -4.3])); g.add(box(0.22, 1.3, 5, glow(0x9fd07a), [25.55, 0.65, -4.3]));
  g.add(box(0.5, 4.6, 0.5, C.wood, [23.9, 2.3, -6.9])); g.add(box(0.5, 4.6, 0.5, C.wood, [23.9, 2.3, -1.7])); g.add(box(0.6, 0.5, 6.2, C.wood, [23.9, 4.7, -4.3]));
  for (let i = 0; i < 6; i++) { const k = P.rock({ s: 2.5 + r() * 2, color: rockCols[i % 4], ry: r() * 6 }); k.position.set(24.2, r() * 4 + (i % 2 ? 4.5 : 0), i % 2 ? -4 + r() * 3 : (i < 3 ? -9 : 1.5)); g.add(k); }
  // timber frames + lanterns
  for (let x = -17; x <= 20; x += 6.1) {
    g.add(box(0.4, 5.6, 0.4, C.wood, [x, 2.8, -9.3])); g.add(box(0.45, 0.45, 5.2, C.woodDark, [x, 5.7, -7.0])); g.add(box(0.28, 2.2, 0.28, C.wood, [x, 4.8, -8.4], [0.75, 0, 0]));
    g.add(cyl(0.015, 0.015, 0.9, 0x222222, [x, 5.05, -5.0], null, 4)); g.add(box(0.26, 0.34, 0.26, 0x2c2c2c, [x, 4.5, -5.0])); g.add(box(0.2, 0.24, 0.28, glow(0xffd070), [x, 4.5, -5.0])); g.add(box(0.3, 0.05, 0.3, 0x2c2c2c, [x, 4.7, -5.0]));
    ctx.collideCircle(X + x, -9.3, 0.35);
  }
  // rails
  for (const z of [-3.55, -4.45]) g.add(box(46, 0.1, 0.1, 0x8c959c, [2, 0.17, z])); for (let x = -20.5; x < 25; x += 1.25) g.add(box(0.28, 0.1, 1.5, C.woodDark, [x, 0.07, -4]));
  // odds and ends
  for (const [x, z, ry] of [[-18.6, -7.4, 0.3], [-17.6, -8.2, 0.9], [16.5, -8.6, 0.2]]) { const c = P.crate({ fill: 0xefeadc }); c.position.set(x, 0, z); c.rotation.y = ry; c.scale.setScalar(1.4); g.add(c); ctx.collideCircle(X + x, z, 0.75); }
  for (const [x, z] of [[-19.2, -5.6], [21.5, -8.8], [22.2, -8]]) { const b = P.barrel(); b.position.set(x, 0, z); g.add(b); ctx.collideCircle(X + x, z, 0.45); }
  g.add(group([box(0.1, 4.4, 0.1, C.woodLight, [-0.3, 2.2, 0]), box(0.1, 4.4, 0.1, C.woodLight, [0.3, 2.2, 0]), ...[0, 1, 2, 3, 4, 5, 6].map(i => box(0.6, 0.07, 0.07, C.woodLight, [0, 0.5 + i * 0.6, 0]))], [-11.5, 0, -9.3], [-0.22, 0, 0]));
  for (let i = 0; i < 10; i++) { const k = P.rock({ s: 0.5 + r() * 0.6, color: rockCols[i % 4], ry: r() * 6 }); k.position.set(-19 + r() * 40, 0, -8.6 + r() * 1.2); g.add(k); }
  for (let i = 0; i < 7; i++) { const k = P.rock({ s: 0.4 + r() * 0.5, color: rockCols[i % 4], ry: r() * 6 }); k.position.set(-19 + r() * 40, 0, 2.6 + r() * 2); g.add(k); }
  g.add(sign('SEILITZ MINE', 1.2, { bg: '#5a3a22', fg: '#ffe9b8', border: '#2c1a0e', pad: 16 }, [4.35, 4.75, -6.6]));
  g.add(box(6.6, 1.5, 0.12, 0x3a2616, [4.35, 4.75, -6.68])); for (const x of [1.9, 6.8]) g.add(cyl(0.02, 0.02, 0.6, 0x222222, [x, 5.6, -6.66], null, 4));
  g.add(box(7.2, 0.3, 0.3, C.woodDark, [4.35, 5.95, -6.66]));
  // foreground: a siding with a parked cart, planks, puddle
  for (const z of [1.75, 2.65]) g.add(box(13, 0.1, 0.1, 0x8c959c, [12.5, 0.17, z])); for (let x = 6.3; x < 19; x += 1.25) g.add(box(0.28, 0.1, 1.5, C.woodDark, [x, 0.07, 2.2]));
  { const c2 = mineCart(); c2.position.set(15.5, 0, 2.2); c2.rotation.y = PI / 2; for (let i = 0; i < 6; i++) { const l = clayLump(1.3, i % 2 ? 0x5a4a3c : 0x66543f); l.position.set((i % 3 - 1) * 0.27, 0.75 + Math.floor(i / 3) * 0.2, -0.4 + (i % 2) * 0.6); c2.add(l); } g.add(c2); ctx.collideBox(X + 15.5, 2.2, 1.9, 1.2); }
  for (let i = 0; i < 4; i++) g.add(box(2.6, 0.07, 0.3, i % 2 ? C.woodLight : C.wood, [-14.5 + (i % 2) * 0.2, 0.06 + i * 0.07, 1.6 + i * 0.34], [0, 0.15 - i * 0.07, 0]));
  g.add(disc(1.5, 0x4f5f6a, [-4.5, 0.035, 2.2], 10)); g.add(disc(0.9, 0x4f5f6a, [-3.3, 0.035, 2.9], 8));
  ctx.addStatic(g, X, 0);
  // kaolin seams to dig (dynamic mounds against the back wall)
  out.seams = [-9, -3.4, 2.4].map((x, i) => { const s = new THREE.Group(); for (let k = 0; k < 8; k++) { const m = P.rock({ s: 1.0 + r() * 0.9, color: k % 3 ? 0xf4f1e6 : 0xe2dccb, ry: r() * 6 }); m.position.set((r() - 0.5) * 1.9, Math.floor(k / 3) * 0.62, (r() - 0.5) * 0.5 + Math.floor(k / 3) * -0.2); s.add(m); } dyn(s); ctx.add(s, X + x, -9.0); s.userData.col = ctx.collideCircle(X + x, -9.1, 1.2); return s; });
  out.cart = ctx.add(mineCart(), X - 6.5, -4, PI / 2); out.cartCol = ctx.collideBox(X - 6.5, -4, 1.9, 1.2);
  return out;
}
