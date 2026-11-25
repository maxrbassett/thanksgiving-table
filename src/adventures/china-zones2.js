// Scenery for "The China Plates", zones 3–6 (clay works, machine hall, design studio, kiln hall).
import { THREE, C, mat, glow, box, cyl, cone, sphere, ball, torus, plane, disc, lathe, tube, group, bake, sign, picture, person, seeded } from '../core/kit.js';
import * as P from '../core/props.js';
import { dyn, own, vase, bowl, mineCart, clayLump, grained } from './china-zones.js';
import { drawOps, classic, surprise } from './china-plate.js';

const PI = Math.PI;
const whitePlate = (r = 0.3, color = 0xfafafa) => lathe([[0, 0.02], [r * 0.6, 0.02], [r, 0.07]], color, null, 12);
/** steel shelving with piles of plates (stands against a side wall, long axis = Z) */
const plateRack = (len, n, col) => { const g = new THREE.Group(); for (const s of [-1, 1]) for (const x of [-0.27, 0.27]) g.add(box(0.07, 2.75, 0.07, 0x6d7a86, [x, 1.375, s * (len / 2 - 0.04)]));
  for (let s = 0; s < 3; s++) { g.add(box(0.64, 0.05, len, 0x8c959c, [0, 0.5 + s * 0.8, 0])); for (let i = 0; i < n; i++) { const hh = 0.1 + ((i * 2 + s) % 3) * 0.07, z = -len / 2 + 0.45 + i * (len - 0.9) / (n - 1); g.add(cyl(0.25, 0.15, hh, col, [0, 0.53 + s * 0.8 + hh / 2, z], null, 10)); const pl = whitePlate(0.27, col); pl.position.set(0, 0.52 + s * 0.8 + hh, z); g.add(pl); } } return g; };
/** a person frozen in a pose and merged into one mesh (cheap background worker) */
export function statue(opts, anim = 'work', phase = 1.3) { const p = person(Object.assign({ shadow: false }, opts)); p.userData.anim = anim; for (let i = 0; i < 40; i++) p.userData.tick(0.05, phase); const g = group([p]); bake(g); return g; }
const room = (g, w, d, h, floor, back, side, cz = -4) => { g.add(grained(plane(w + 1, d + 6, floor, [0, 0.03, cz + 3]), floor, 5)); g.add(box(w + 0.8, h, 0.5, back, [0, h / 2, cz - d / 2 - 0.25])); g.add(box(0.5, h, d, side, [-w / 2 - 0.25, h / 2, cz])); g.add(box(0.5, h, d, side, [w / 2 + 0.25, h / 2, cz])); };
/** a free-standing doorway of warm light: "walk through here to go on" */
export const exitArch = (ctx, g, X, x, zz, frame = 0x6e4a28, ry = -0.85) => { const a = group([box(0.32, 3.1, 0.32, frame, [-1.25, 1.55, 0]), box(0.32, 3.1, 0.32, frame, [1.25, 1.55, 0]), box(3.1, 0.36, 0.4, frame, [0, 3.25, 0]), box(2.2, 2.95, 0.06, glow(0xfff0c2), [0, 1.5, -0.05]), box(2.6, 0.08, 1.0, 0xd9b98a, [0, 0.04, 0.4])], [x, 0, zz], [0, ry, 0]); g.add(a); for (const s of [-1, 1]) ctx.collideCircle(X + x + s * 1.25 * Math.cos(ry), zz - s * 1.25 * Math.sin(ry), 0.3); };
const archWindow = (g, x, y, z, w = 2.4, h = 2.8, frame = 0xffffff) => { g.add(box(w + 0.3, h + 0.3, 0.1, frame, [x, y, z])); g.add(box(w, h, 0.12, glow(0xbfe6f5), [x, y, z + 0.02])); g.add(cyl(w / 2 + 0.15, w / 2 + 0.15, 0.1, frame, [x, y + h / 2, z], [PI / 2, 0, 0], 14)); g.add(cyl(w / 2, w / 2, 0.12, glow(0xbfe6f5), [x, y + h / 2, z + 0.02], [PI / 2, 0, 0], 14)); g.add(box(0.08, h + w / 2, 0.16, frame, [x, y + w / 4, z + 0.02])); g.add(box(w, 0.08, 0.16, frame, [x, y, z + 0.02])); g.add(box(w + 0.5, 0.12, 0.3, frame, [x, y - h / 2 - 0.1, z + 0.1])); };

// ============================================================ 3 — the clay works: wash, settle, blend
export function zoneClay(ctx, X) {
  const g = new THREE.Group(), r = seeded(31), out = {};
  g.add(grained(plane(38, 17.5, 0xd9cba6, [0.5, 0.02, -4]), 0xe4d6b2, 6));
  for (let i = 0; i < 26; i++) g.add(plane(1.2 + r() * 1.6, 1 + r() * 1.2, r() < 0.5 ? 0xcbbc95 : 0xe3d7b6, [-17 + r() * 35, 0.03, -11 + r() * 14]));
  // half-timbered works building
  const bx = -6, bz = -14.6, fz = bz + 2.5 + 0.04, T = 0x5a3a22;
  const b = P.building({ w: 15, h: 4.6, d: 5, color: 0xf3ead6, roof: 'gable', roofColor: 0xa8452f, windows: 0, door: false }); b.position.set(bx, 0, bz); g.add(b);
  for (const y of [0.14, 2.35, 4.5]) g.add(box(15.1, 0.24, 0.1, T, [bx, y, fz])); for (let i = 0; i <= 6; i++) g.add(box(0.22, 4.6, 0.1, T, [bx - 7.45 + i * 2.483, 2.3, fz]));
  for (const i of [0, 2, 3, 5]) g.add(box(0.18, 3.2, 0.09, T, [bx - 6.2 + i * 2.483, 3.4, fz], [0, 0, i % 2 ? 0.85 : -0.85]));
  for (const i of [0, 1, 4, 5]) { const x = bx - 6.2 + i * 2.483; g.add(box(1.3, 1.25, 0.08, 0x8fc6e0, [x, 1.3, fz])); g.add(box(1.4, 0.1, 0.12, 0xffffff, [x, 1.3, fz])); g.add(box(0.1, 1.25, 0.12, 0xffffff, [x, 1.3, fz])); g.add(box(1.5, 0.14, 0.3, 0x7a4a2a, [x, 0.62, fz + 0.1])); for (let k = 0; k < 4; k++) g.add(sphere(0.13, [C.red, C.pink, C.yellow][k % 3], [x - 0.5 + k * 0.33, 0.78, fz + 0.14], 5)); }
  g.add(box(4.4, 3.1, 0.1, 0x7a4a2a, [bx, 1.55, fz + 0.02])); g.add(box(0.08, 3.1, 0.12, 0x4a2c17, [bx, 1.55, fz + 0.03])); g.add(box(4.7, 0.25, 0.14, T, [bx, 3.2, fz + 0.02]));
  g.add(sign('CLAY WORKS', 1.25, { bg: '#f3ead6', fg: '#5a3a22', border: '#5a3a22', pad: 14 }, [bx, 3.92, fz + 0.12]));
  ctx.collideBox(X + bx, bz, 15, 5);
  // far hill with a castle (Meissen's skyline)
  g.add(ball(30, 9, 12, 0x79a95c, [26, -1, -56], null, 14)); g.add(ball(34, 7, 12, 0x86b566, [-34, -1, -54], null, 14));
  const cas = group([], [26, 7.7, -56]); cas.add(box(12, 4.6, 4, 0xeadfc8, [0, 2.3, 0])); cas.add(box(12.4, 1.6, 3.2, 0x4f5d6e, [0, 5.3, 0])); for (const x of [-6, 1.5]) { cas.add(cyl(1.2, 1.2, 7.5, 0xeadfc8, [x, 3.75, 1.2], null, 8)); cas.add(cone(1.6, 3.4, 0x4f5d6e, [x, 9.2, 1.2], null, 8)); }
  cas.add(box(3.4, 8, 3.4, 0xd9cdb5, [6.5, 4, -0.5])); cas.add(cone(1.0, 8, 0x4f5d6e, [5.6, 12, -0.5], null, 6)); cas.add(cone(1.0, 8, 0x4f5d6e, [7.4, 12, -0.5], null, 6)); g.add(cas);
  g.add(P.scatter(20, 100, 44, (rr) => P.tree({ h: 4 + rr() * 3, kind: rr() < 0.3 ? 'pine' : 'round' }), { seed: 12, keep: (x, z) => (Math.abs(x) > 21 || z < -20) && z < 3 && !(x > -15 && x < 3 && z > -19) }));
  g.add(P.scatter(10, 60, 30, () => P.bush(), { seed: 5, keep: (x, z) => Math.abs(x) > 20 && z < 4 }));
  g.add(P.scatter(16, 44, 5, () => P.flower(), { seed: 3 }).translateZ(7.4));
  const f1 = P.fence(12); f1.position.set(-13.5, 0, -12.2); g.add(f1); 
  const f2 = P.fence(16); f2.rotation.y = PI / 2; f2.position.set(-19, 0, -4.2); g.add(f2);
  const f3 = P.fence(9); f3.rotation.y = PI / 2; f3.position.set(19.2, 0, -7); g.add(f3);
  // rails in from the left + buffer stop
  for (const z of [-1.05, -1.95]) g.add(box(17, 0.1, 0.1, 0x8c959c, [-17.6, 0.17, z])); for (let x = -25.8; x < -9.4; x += 1.25) g.add(box(0.28, 0.1, 1.5, C.woodDark, [x, 0.07, -1.5]));
  g.add(box(0.35, 0.9, 1.6, 0xb5382c, [-8.9, 0.45, -1.5])); g.add(box(0.4, 0.25, 1.7, 0xf2c43d, [-8.9, 0.75, -1.5])); ctx.collideBox(X - 8.9, -1.5, 0.5, 1.7);
  // wash trough with paddle wheel, standpipe and valve
  const TX = -6.4, TZ = -5.7, PZc0 = -5.55; out.trough = [X + TX, TZ];
  g.add(box(4.6, 0.12, 1.8, C.wood, [TX, 0.55, TZ])); for (const s of [-1, 1]) { g.add(box(4.6, 0.62, 0.12, C.wood, [TX, 0.86, TZ + s * 0.9])); g.add(box(0.12, 0.62, 1.8, C.wood, [TX + s * 2.3, 0.86, TZ])); g.add(box(0.2, 2.0, 0.2, C.woodDark, [TX + 0.6, 1.0, TZ + s * 1.05])); for (const e of [-1, 1]) g.add(box(0.2, 0.55, 0.2, C.woodDark, [TX + e * 2.0, 0.27, TZ + s * 0.75])); }
  for (const x of [-1.5, 0, 1.5]) g.add(box(0.08, 0.64, 1.84, 0x4a4038, [TX + x, 0.86, TZ]));
  out.troughWater = own(box(4.4, 0.1, 1.66), 0x8a6a48); out.troughWater.position.set(X + TX, 0.98, TZ); ctx.add(out.troughWater);
  const pad = group([cyl(0.09, 0.09, 2.3, 0x4a4038, [0, 0, 0], [PI / 2, 0, 0], 6)]); for (let i = 0; i < 6; i++) { const a = i * PI / 3; pad.add(box(0.07, 0.8, 1.3, C.woodLight, [Math.sin(a) * 0.45, Math.cos(a) * 0.45, 0], [0, 0, -a])); } out.paddle = dyn(pad); out.paddle.position.set(X + TX + 0.6, 1.85, TZ); ctx.add(out.paddle);
  const PX = TX - 2.9, PZ = TZ + 1.5;
  g.add(tube([[PX, 0, PZ], [PX, 2.5, PZ], [PX + 0.5, 2.95, PZ - 0.6], [PX + 1.3, 2.9, PZ - 1.3], [PX + 1.7, 2.45, PZ - 1.5]], 0.1, 0x6d7a86)); g.add(cyl(0.16, 0.16, 0.3, 0x55606a, [PX, 1.25, PZ], null, 8)); g.add(cyl(0.035, 0.035, 0.3, 0x333333, [PX, 1.25, PZ + 0.2], [PI / 2, 0, 0], 5));
  out.valve = dyn(group([torus(0.3, 0.055, C.red, null, null, 12), box(0.56, 0.06, 0.05, C.red), box(0.06, 0.56, 0.05, C.red)])); out.valve.position.set(X + PX, 1.25, PZ + 0.36); ctx.add(out.valve); ctx.collideCircle(X + PX, PZ, 0.3);
  out.spout = [X + PX + 1.7, 2.3, PZ - 1.5];
  g.add(box(1.9, 0.08, 0.6, C.wood, [TX + 3.05, 0.72, TZ - 0.2], [0, 0, -0.2])); for (const s of [-1, 1]) g.add(box(1.9, 0.22, 0.06, C.woodDark, [TX + 3.05, 0.8, TZ - 0.2 + s * 0.3], [0, 0, -0.2]));
  out.sluice = [[X + TX + 2.2, 1.1, TZ - 0.2], [X + TX + 4.0, 0.7, TZ - 0.2]];
  /* trough + ponds share one collider (below) so there is no seam to snag on */
  // three settling ponds: fresh slurry → settling → firm white clay
  const PZc = -6.7; out.ponds = [];
  [-1.2, 3.3, 7.8].forEach((cx, i) => { out.ponds.push([X + cx, PZc]); for (const s of [-1, 1]) { g.add(box(4.1, 0.5, 0.28, 0xa7a39a, [cx, 0.25, PZc + s * 2.2])); g.add(box(0.28, 0.5, 4.4, 0xa7a39a, [cx + s * 1.95, 0.25, PZc])); } g.add(plane(3.7, 4.2, 0x7d776c, [cx, 0.05, PZc])); });
  g.add(box(3.62, 0.3, 4.12, 0xdfe9ea, [3.3, 0.2, PZc])); g.add(box(3.62, 0.24, 4.12, 0xf6f3ea, [7.8, 0.17, PZc])); for (let k = 1; k < 4; k++) { g.add(box(3.62, 0.02, 0.05, 0xd2ccbc, [7.8, 0.3, PZc - 2.06 + k * 1.03])); g.add(box(0.05, 0.02, 4.12, 0xd2ccbc, [7.8 - 1.81 + k * 0.905, 0.3, PZc])); }
  out.pondFill = own(box(3.62, 0.3, 4.12), 0xbfb199); out.pondFill.position.set(X - 1.2, -0.1, PZc); ctx.add(out.pondFill);
  ctx.collideBox(X + 0.525, PZc, 18.75, 4.7);
  // the blunger (mixing vat)
  const MX = 13.6, MZ = -4.6; out.mixer = [X + MX, MZ];
  g.add(lathe([[0, 0.25], [1.4, 0.25], [1.55, 0.4], [1.55, 1.4], [1.63, 1.45]], 0x8a6a48, [MX, 0, MZ], 20)); for (const y of [0.55, 1.2]) g.add(torus(1.58, 0.05, 0x3a3a3a, [MX, y, MZ], [PI / 2, 0, 0], 24)); g.add(cyl(1.45, 1.5, 0.26, 0x4a4038, [MX, 0.13, MZ], null, 12));
  for (const s of [-1, 1]) g.add(box(0.24, 3.0, 0.24, C.woodDark, [MX + s * 1.85, 1.5, MZ])); g.add(box(4.1, 0.26, 0.3, C.woodDark, [MX, 3.0, MZ])); g.add(box(0.6, 0.5, 0.6, 0x55606a, [MX, 3.05, MZ]));
  out.mixPaddle = dyn(group([cyl(0.07, 0.07, 2.3, 0x55606a, [0, 1.85, 0], null, 6), box(2.5, 0.5, 0.08, C.woodLight, [0, 1.0, 0]), box(0.08, 0.5, 2.5, C.woodLight, [0, 1.0, 0])])); ctx.add(out.mixPaddle, X + MX, MZ);
  out.mixFill = own(cyl(1.45, 1.45, 0.1, 0, null, null, 14), 0xcfc6b4); out.mixFill.position.set(X + MX, 0.5, MZ); ctx.add(out.mixFill);
  ctx.collideCircle(X + MX, MZ, 1.95);
  // ingredient bays under a lean-to
  const BZ = -10.9; out.bins = [[X + 11.6, BZ + 0.3], [X + 15.2, BZ + 0.3]];
  [11.6, 15.2].forEach((cx, i) => { g.add(box(3.3, 1.5, 0.16, C.wood, [cx, 0.75, BZ - 1.1])); for (const s of [-1, 1]) g.add(box(0.16, 1.5, 2.3, C.wood, [cx + s * 1.65, 0.75, BZ])); g.add(box(3.3, 0.5, 0.14, C.woodDark, [cx, 0.25, BZ + 1.1]));
    for (let k = 0; k < 12; k++) { const px = cx - 1.1 + r() * 2.2, pz = BZ - 0.8 + r() * 1.6, py = r() * 0.5; if (i === 0) { const m = P.rock({ s: 0.7 + r() * 0.5, color: k % 2 ? 0xe3a98f : 0xd98f78, ry: r() * 6 }); m.position.set(px, py, pz); g.add(m); } else g.add(cone(0.22 + r() * 0.12, 0.7 + r() * 0.5, k % 3 ? 0xeaf4fb : 0xd9ccf2, [px, py + 0.4, pz], [(r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7], 6)); } });
  for (const x of [9.8, 13.4, 17]) g.add(box(0.2, 3.3, 0.2, C.woodDark, [x, 1.65, BZ + 1.15])); g.add(box(8, 0.16, 3.4, 0xa8452f, [13.4, 3.45, BZ - 0.1], [0.16, 0, 0]));
  g.add(sign('FELDSPAR', 0.95, { bg: '#fff8e8', fg: '#a04a2e', border: '#a04a2e', pad: 10 }, [11.6, 2.55, BZ + 1.3])); g.add(sign('QUARTZ', 0.95, { bg: '#fff8e8', fg: '#4a5fa8', border: '#4a5fa8', pad: 10 }, [15.2, 2.55, BZ + 1.3]));
  ctx.collideBox(X + 13.4, BZ, 7.6, 2.5);
  // bits and pieces
  for (const [x, z] of [[-15.5, -10.8], [-16.4, -10.2], [1.8, -10.9]]) { const k = P.barrel(); k.position.set(x, 0, z); g.add(k); ctx.collideCircle(X + x, z, 0.45); }
  const wb = group([box(1.1, 0.35, 0.7, 0x4f7d5a, [0, 0.55, 0]), cyl(0.25, 0.25, 0.1, 0x2c2c2c, [0.75, 0.25, 0], [PI / 2, 0, 0], 8), box(1.2, 0.06, 0.06, C.wood, [-0.9, 0.6, 0.3]), box(1.2, 0.06, 0.06, C.wood, [-0.9, 0.6, -0.3]), box(0.06, 0.5, 0.06, C.wood, [-0.4, 0.25, 0.3]), box(0.06, 0.5, 0.06, C.wood, [-0.4, 0.25, -0.3]), ball(0.45, 0.22, 0.3, 0xf6f3ea, [0, 0.75, 0])], [-13.6, 0, -6.6], [0, 0.6, 0]); g.add(wb); ctx.collideCircle(X - 13.6, -6.6, 0.8);
  const st = statue({ hat: 'cap', hatColor: 0x5a6a7a, shirt: 0x6a8f5a, pants: 0x4a4a55, apron: 0xd9cba6, skin: C.skin[3], hair: C.hair[1] }, 'dig', 2.2); st.position.set(7.6, 0, -9.6); g.add(st);
  g.add(P.signpost('⚙️ ➜', { h: 2.3, size: 0.8 }).translateX(15.2).translateZ(2.6)); exitArch(ctx, g, X, 17.3, 0, 0x6e4a28);
  ctx.addStatic(g, X, 0);
  out.exit = [X + 17.3, 0];
  out.cart = mineCart(); for (let i = 0; i < 9; i++) { const l = clayLump(1.25); l.position.set((i % 3 - 1) * 0.27, 0.72 + Math.floor(i / 3) * 0.2, -0.45 + (i % 2) * 0.4 + Math.floor(i / 3) * 0.1); l.rotation.y = i; out.cart.userData.load.add(l); }
  ctx.add(out.cart, X - 24, -1.5, PI / 2); out.cartCol = ctx.collideBox(X - 10.2, -1.5, 1.9, 1.2);
  return out;
}

// ============================================================ 4 — new machines: steam (1802) and the press (today)
export function zoneMachines(ctx, X) {
  const g = new THREE.Group(), r = seeded(41), out = {};
  const BR = 0xa8573f, BR2 = 0x96492f;
  g.add(grained(plane(19.2, 23, 0x8f7a62, [-9.6, 0.03, -1]), 0x9a846b, 4)); g.add(grained(plane(19.2, 23, 0xd5dadd, [9.6, 0.03, -1]), 0xdde1e3, 4));
  for (let i = 0; i < 12; i++) g.add(plane(19.2, 0.08, 0x7a6650, [-9.6, 0.035, -12 + i * 1.9]));
  for (let i = 0; i < 5; i++) { g.add(plane(0.08, 23, 0xc2c8cc, [2 + i * 4, 0.035, -1])); } for (let i = 0; i < 7; i++) g.add(plane(19.2, 0.08, 0xc2c8cc, [9.6, 0.035, -11 + i * 3.6]));
  g.add(plane(0.5, 16, 0xf2c43d, [0.4, 0.04, 2.5]));
  g.add(sign('1802', 2.6, { bg: null, fg: '#ffd98a', pad: 8, size: 128 }, [-3.4, 0.06, 1.6], [-PI / 2, 0, 0])); g.add(sign('TODAY', 2.6, { bg: null, fg: '#2f6d9c', pad: 8, size: 128 }, [5.4, 0.06, 1.6], [-PI / 2, 0, 0]));
  g.add(box(19.4, 7.5, 0.5, BR, [-9.7, 3.75, -12.75])); g.add(box(19.4, 7.5, 0.5, 0xeef1f3, [9.7, 3.75, -12.75])); g.add(box(19.4, 1.1, 0.54, 0x2f6d9c, [9.7, 0.55, -12.74]));
  g.add(box(0.5, 7.5, 17, BR2, [-19.45, 3.75, -4])); g.add(box(0.5, 7.5, 17, 0xe3e7ea, [19.45, 3.75, -4]));
  for (let i = 0; i < 7; i++) g.add(box(19.4, 0.06, 0.52, 0x8a4632, [-9.7, 0.9 + i * 1.0, -12.74]));
  g.add(box(0.7, 7.5, 6.2, BR2, [0, 3.75, -9.7])); g.add(box(0.9, 0.4, 6.4, 0x6e3a26, [0, 7.3, -9.7]));
  archWindow(g, -17.2, 3.7, -12.45, 1.8, 2.0, 0x6e3a26); archWindow(g, -1.9, 3.7, -12.45, 1.8, 2.0, 0x6e3a26); archWindow(g, -9.4, 3.7, -12.45, 1.8, 2.0, 0x6e3a26);
  for (const x of [2.6, 12.2, 17.2]) { g.add(box(2.6, 1.5, 0.1, 0xffffff, [x, 3.6, -12.46])); g.add(box(2.4, 1.3, 0.12, glow(0xcfeeff), [x, 3.6, -12.45])); g.add(box(0.08, 1.3, 0.14, 0xffffff, [x, 3.6, -12.44])); }
  // --- steam engine: boiler, cylinder, flywheel, line shaft, belt to the potter's wheel
  const BX = -13, BZ = -10.2;
  g.add(box(5.6, 1.5, 2.5, 0x7d3f2c, [BX, 0.75, BZ])); g.add(cyl(1.2, 1.2, 5.2, 0x3d4a4f, [BX, 2.65, BZ], [0, 0, PI / 2], 18)); for (const x of [-2.2, 0, 2.2]) g.add(cyl(1.25, 1.25, 0.16, 0xb08d3c, [BX + x, 2.65, BZ], [0, 0, PI / 2], 18));
  for (const s of [-1, 1]) g.add(ball(0.42, 1.2, 1.2, 0x3d4a4f, [BX + s * 2.6, 2.65, BZ], null, 14));
  for (const y of [0.5, 1.0]) g.add(box(5.64, 0.04, 2.54, 0x64301f, [BX, y, BZ]));
  g.add(cyl(0.24, 0.24, 0.09, 0xf4f1e6, [BX + 1.4, 2.65, BZ + 1.21], [PI / 2, 0, 0], 10)); g.add(box(0.03, 0.18, 0.02, 0xb5382c, [BX + 1.44, 2.7, BZ + 1.27], [0, 0, -0.6]));
  g.add(cyl(0.04, 0.04, 0.7, glow(0xbfe6f5), [BX + 0.4, 2.5, BZ + 1.22], null, 5)); for (const y of [2.12, 2.88]) g.add(box(0.14, 0.07, 0.12, 0xb08d3c, [BX + 0.4, y, BZ + 1.2]));
  g.add(cyl(0.07, 0.07, 0.5, 0xb08d3c, [BX + 1, 4.85, BZ], null, 6)); g.add(box(0.7, 0.05, 0.06, 0xb08d3c, [BX + 1.25, 5.0, BZ])); g.add(sphere(0.1, 0x3d4a4f, [BX + 1.6, 5.0, BZ], 6));
  for (const s of [-1, 1]) g.add(cyl(0.05, 0.05, 0.14, 0xb08d3c, [BX - 1.2 + s * 0.5, 0.8, BZ + 1.38], [PI / 2, 0, 0], 5));
  g.add(cyl(0.45, 0.45, 0.5, 0xb08d3c, [BX + 1, 4.0, BZ], null, 8)); g.add(sphere(0.45, 0xb08d3c, [BX + 1, 4.25, BZ], 8)); g.add(cyl(0.42, 0.5, 4.4, 0x2f2f2f, [BX - 2.0, 5.6, BZ - 0.4], null, 8));
  g.add(box(1.3, 1.1, 0.14, 0x24242a, [BX - 1.2, 0.8, BZ + 1.3])); g.add(box(1.5, 0.14, 0.2, 0x3d4a4f, [BX - 1.2, 1.42, BZ + 1.32])); g.add(cyl(0.3, 0.3, 0.08, 0xb08d3c, [BX + 1.4, 2.65, BZ + 1.2], [PI / 2, 0, 0], 10));
  out.boilerFire = box(1.05, 0.85, 0.05, glow(0xff8a20)); out.boilerFire.position.set(X + BX - 1.2, 0.8, BZ + 1.39); out.boilerFire.visible = false; ctx.add(out.boilerFire);
  out.firebox = [X + BX - 1.2, BZ + 1.4]; out.steamAt = [X + BX + 1, 4.8, BZ];
  ctx.collideBox(X + BX, BZ, 5.8, 2.7);
  const FX = -7.2, FY = 2.3, FZ = -10.0; out.fly = [X + FX, FY, FZ];
  g.add(box(1.8, 0.9, 0.9, 0x3d4a4f, [FX - 2.2, 1.5, FZ])); g.add(box(2.0, 1.05, 1.2, 0x7d3f2c, [FX - 2.2, 0.52, FZ])); g.add(tube([[BX + 2.6, 3.2, BZ], [FX - 2.6, 3.3, FZ], [FX - 2.4, 2.0, FZ]], 0.1, 0xb08d3c));
  for (const s of [-1, 1]) g.add(box(0.25, 2.5, 0.25, 0x3d4a4f, [FX + s * 0.55, 1.15, FZ - 0.35], [0, 0, s * 0.22])); g.add(box(1.8, 0.3, 1.1, 0x7d3f2c, [FX, 0.15, FZ - 0.2]));
  const fw = group([torus(1.45, 0.14, 0x8a2f2a, null, null, 20), cyl(0.22, 0.22, 0.3, 0x333333, null, [PI / 2, 0, 0], 8), cyl(0.09, 0.09, 0.3, 0xb08d3c, [0.7, 0, 0.15], [PI / 2, 0, 0], 6)]); for (let i = 0; i < 6; i++) fw.add(box(0.1, 1.4, 0.08, 0x8a2f2a, [Math.sin(i * PI / 3) * 0.72, Math.cos(i * PI / 3) * 0.72, 0], [0, 0, -i * PI / 3]));
  out.flywheel = dyn(fw); out.flywheel.position.set(X + FX, FY, FZ); ctx.add(out.flywheel);
  out.rod = dyn(group([box(1, 0.09, 0.07, 0xc9d2d8, [0.5, 0, 0])])); out.rod.position.set(X + FX - 1.4, FY - 0.8, FZ + 0.2); ctx.add(out.rod);
  g.add(cyl(0.07, 0.07, 5.6, 0x55606a, [FX + 2.3, 5.6, FZ - 0.2], [0, 0, PI / 2], 6)); for (const x of [0, 2.3, 4.6]) { g.add(box(0.12, 0.5, 2.4, 0x3d4a4f, [FX + x + 0.3, 5.75, FZ - 1.35])); }
  g.add(cyl(0.32, 0.32, 0.22, 0x6e4a28, [FX, 5.6, FZ - 0.2], [0, 0, PI / 2], 10)); g.add(cyl(0.32, 0.32, 0.22, 0x6e4a28, [FX + 4.2, 5.6, FZ - 0.2], [0, 0, PI / 2], 10));
  for (const s of [-1, 1]) g.add(box(0.05, 3.3, 0.14, 0x4a3020, [FX, 3.95, FZ - 0.2 + s * 0.24])); 
  const WX = -3, WZ = -6.6; out.wheelAt = [X + WX, WZ];
  for (const s of [-1, 1]) g.add(box(0.14, 5.1, 0.05, 0x4a3020, [WX + s * 0.24, 3.05, WZ - 1.8 - 0.0], [0.33, 0, 0]));
  g.add(box(1.9, 0.75, 1.5, C.wood, [WX, 0.375, WZ])); g.add(box(2.1, 0.1, 1.7, C.woodDark, [WX, 0.8, WZ])); g.add(cyl(0.3, 0.3, 0.16, 0x6e4a28, [WX, 0.55, WZ - 0.95], [0, 0, PI / 2], 8)); g.add(lathe([[0, 0], [0.2, 0], [0.26, 0.2]], 0x9a8f80, [WX + 0.7, 0.85, WZ + 0.5], 8));
  out.wheelHead = dyn(group([cyl(0.52, 0.52, 0.1, 0x8c8478, null, null, 14), box(0.16, 0.04, 0.16, 0x6f6a60, [0.36, 0.06, 0])])); out.wheelHead.position.set(X + WX, 0.92, WZ); ctx.add(out.wheelHead);
  ctx.collideBox(X + WX, WZ, 2.1, 1.7); ctx.collideBox(X + FX - 0.9, FZ, 4.6, 1.4);
  // coal bunker
  const CX = -16.6, CZ = -3.6; out.coal = [X + CX, CZ];
  g.add(box(2.6, 1.0, 0.16, 0x7d3f2c, [CX, 0.5, CZ - 1.1])); for (const s of [-1, 1]) g.add(box(0.16, 1.0, 2.2, 0x7d3f2c, [CX + s * 1.3, 0.5, CZ])); for (let k = 0; k < 16; k++) { const m = P.rock({ s: 0.5 + r() * 0.4, color: k % 3 ? 0x26262b : 0x34343a, ry: r() * 6 }); m.position.set(CX - 0.9 + r() * 1.8, r() * 0.45, CZ - 0.8 + r() * 1.7); g.add(m); }
  g.add(box(0.06, 1.3, 0.06, C.wood, [CX + 1.55, 0.7, CZ + 0.9], [0.2, 0, -0.25])); g.add(box(0.3, 0.36, 0.05, 0x55606a, [CX + 1.72, 0.2, CZ + 0.78], [0.2, 0, -0.25]));
  ctx.collideBox(X + CX, CZ, 2.8, 2.4);
  // shelves of thrown ware on the left wall, odds and ends
  for (let s = 0; s < 3; s++) { g.add(box(0.6, 0.08, 5, C.woodDark, [-18.85, 1.1 + s * 1.1, -8.6])); for (let i = 0; i < 6; i++) { const v = (i + s) % 2 ? bowl(1.1, 0xe9e2d2) : vase(0.75, 0xe9e2d2); v.position.set(-18.85, 1.14 + s * 1.1, -10.7 + i * 0.85); g.add(v); } }
  for (const [x, z] of [[-18.2, 1.8], [-17.3, 2.6], [-1.4, -11.6]]) { const k = P.barrel(); k.position.set(x, 0, z); g.add(k); ctx.collideCircle(X + x, z, 0.45); }
  const cr = P.crate({ s: 1.1 }); cr.position.set(-9.6, 0, -7.3); g.add(cr); ctx.collideCircle(X - 9.6, -7.3, 0.7);
  // --- the press hall (today)
  const PX = 8.2, PZ = -9.0; out.press = [X + PX, PZ];
  g.add(box(3.4, 1.0, 2.6, 0x2f6d9c, [PX, 0.5, PZ])); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.17, 0.17, 4.3, 0xd5dbe0, [PX + sx * 1.35, 3.1, PZ + sz * 0.95], null, 8));
  g.add(box(3.4, 1.1, 2.6, 0x2f6d9c, [PX, 5.6, PZ])); g.add(cyl(0.55, 0.55, 0.9, 0xd5dbe0, [PX, 6.5, PZ], null, 10)); g.add(box(3.42, 0.16, 2.62, 0xf2c43d, [PX, 5.0, PZ]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.add(cyl(0.27, 0.27, 0.2, 0x8c959c, [PX + sx * 1.35, 1.1, PZ + sz * 0.95], null, 6)); g.add(cyl(0.27, 0.27, 0.2, 0x8c959c, [PX + sx * 1.35, 4.82, PZ + sz * 0.95], null, 6)); }
  g.add(box(1.0, 1.5, 0.9, 0x24507a, [PX + 2.3, 0.75, PZ - 0.5])); g.add(cyl(0.22, 0.22, 0.5, 0x8c959c, [PX + 2.3, 1.75, PZ - 0.5], null, 8)); g.add(cyl(0.16, 0.16, 0.06, 0xf4f1e6, [PX + 2.3, 1.1, PZ - 0.04], [PI / 2, 0, 0], 8));
  g.add(tube([[PX + 2.3, 1.9, PZ - 0.5], [PX + 2.2, 3.6, PZ - 0.6], [PX + 1.2, 6.3, PZ - 0.3], [PX + 0.5, 6.75, PZ]], 0.06, 0x1f1f24)); g.add(tube([[PX + 2.5, 1.9, PZ - 0.6], [PX + 2.5, 3.8, PZ - 0.8], [PX + 1.3, 6.5, PZ - 0.6], [PX + 0.4, 6.8, PZ - 0.3]], 0.06, 0x1f1f24));
  g.add(box(1.3, 0.5, 0.04, 0xe3e7ea, [PX, 5.65, PZ + 1.31])); g.add(box(1.1, 0.1, 0.05, 0x24507a, [PX, 5.72, PZ + 1.32])); g.add(box(0.7, 0.07, 0.05, 0x24507a, [PX, 5.55, PZ + 1.32])); g.add(cyl(0.8, 0.86, 0.28, 0x8c959c, [PX, 1.14, PZ], null, 14)); g.add(cyl(0.62, 0.62, 0.04, 0x55606a, [PX, 1.29, PZ], null, 14));
  out.ram = dyn(group([cyl(0.3, 0.3, 2.4, 0xe3e7ea, [0, 1.45, 0], null, 10), cyl(0.8, 0.8, 0.3, 0x8c959c, [0, 0.15, 0], null, 14), cyl(0.62, 0.66, 0.08, 0x55606a, [0, -0.03, 0], null, 14)])); out.ram.position.set(X + PX, 3.5, PZ); ctx.add(out.ram); out.ramUp = 3.5; out.ramDown = 1.42;
  const HX = PX - 3.3; g.add(cone(1.05, 1.5, 0xd5dbe0, [HX, 3.4, PZ], [PI, 0, 0], 10)); g.add(cyl(1.05, 1.05, 0.7, 0xd5dbe0, [HX, 4.5, PZ], null, 10)); g.add(cyl(0.98, 0.98, 0.06, 0xf6f3ea, [HX, 4.84, PZ], null, 10)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.12, 3.9, 0.12, 0x6d7a86, [HX + sx * 0.8, 1.95, PZ + sz * 0.8]));
  g.add(box(2.3, 0.1, 0.5, 0x8c959c, [PX - 1.75, 1.95, PZ], [0, 0, -0.5])); out.chute = [[X + HX + 0.2, 2.55, PZ], [X + PX - 0.3, 1.45, PZ]];
  const SX = 15.4, SZ = -10.4; g.add(cyl(1.7, 1.7, 3.4, 0xdfe4e8, [SX, 4.6, SZ], null, 12)); g.add(cone(1.7, 2.1, 0xdfe4e8, [SX, 1.85, SZ], [PI, 0, 0], 12)); g.add(cone(1.7, 0.8, 0xc2c8cc, [SX, 6.7, SZ], null, 12)); for (let i = 0; i < 3; i++) g.add(box(0.16, 3.2, 0.16, 0x6d7a86, [SX + Math.cos(i * 2.1 + 0.5) * 1.6, 1.6, SZ + Math.sin(i * 2.1 + 0.5) * 1.2]));
  g.add(tube([[SX - 0.2, 0.9, SZ + 0.3], [SX - 2.5, 0.5, SZ + 1.6], [PX - 1.5, 0.4, PZ + 1.9], [HX - 1.3, 0.6, PZ + 0.6], [HX - 1.35, 4.6, PZ + 0.2], [HX - 0.6, 5.3, PZ]], 0.13, 0x8c959c)); g.add(cyl(1.75, 1.75, 0.14, 0x2f6d9c, [SX, 4.6, SZ], null, 12));
  ctx.collideBox(X + PX, PZ, 3.6, 2.8); ctx.collideBox(X + PX + 2.3, PZ - 0.5, 1.0, 0.9); ctx.collideBox(X + HX, PZ, 2.0, 2.0); ctx.collideCircle(X + SX, SZ, 1.9);
  g.add(cone(0.75, 0.8, 0x2f6d9c, [SX - 0.2, 1.35, SZ + 2.15], [PI, 0, 0], 10)); g.add(cyl(0.78, 0.78, 0.1, 0xf2c43d, [SX - 0.2, 1.78, SZ + 2.15], null, 10)); g.add(cyl(0.12, 0.12, 1.0, 0x8c959c, [SX - 0.2, 0.5, SZ + 2.15], null, 6)); g.add(box(0.9, 0.1, 0.9, 0x6d7a86, [SX - 0.2, 0.05, SZ + 2.15]));
  for (const s of [-1, 1]) g.add(box(0.06, 6.2, 0.06, 0x6d7a86, [SX + 1.55 + s * 0.25, 3.1, SZ + 1.05])); for (let i = 0; i < 12; i++) g.add(box(0.5, 0.04, 0.04, 0x6d7a86, [SX + 1.55, 0.5 + i * 0.5, SZ + 1.05]));
  g.add(tube([[SX, 7.0, SZ], [SX + 0.3, 7.9, SZ - 0.6], [SX + 0.6, 8.0, SZ - 2.2]], 0.3, 0xc2c8cc, 8)); for (const y of [3.0, 6.2]) g.add(torus(1.72, 0.06, 0x8c959c, [SX, y, SZ], [PI / 2, 0, 0], 16));
  g.add(sign('SPRAY DRYER', 0.9, { bg: '#2f6d9c', fg: '#ffffff', pad: 10 }, [SX, 4.6, SZ + 1.72]));
  ctx.collideCircle(X + SX - 0.2, SZ + 2.15, 0.6);
  out.dryerAt = [X + SX - 0.2, SZ + 3.2]; out.dryerIn = [X + SX - 0.2, 1.7, SZ + 2.15]; out.dryerTop = [X + SX, 7.3, SZ];
  // big pressure gauge
  const GX = 12.1, GY = 3.6, GZ = -8.4; out.gaugeAt = [X + GX, GY, GZ];
  g.add(cyl(0.12, 0.16, 2.4, 0x6d7a86, [GX, 1.2, GZ - 0.15], null, 8)); g.add(cyl(1.32, 1.32, 0.2, 0x2b3a4a, [GX, GY, GZ - 0.12], [PI / 2, 0, 0], 20)); ctx.collideCircle(X + GX, GZ - 0.15, 0.3);
  const A = (v) => (-210 + v / 400 * 240) * PI / 180;
  g.add(picture(2.45, 2.45, (c, W) => { const m = W / 2; c.fillStyle = '#fdfdf8'; c.beginPath(); c.arc(m, m, m * 0.97, 0, 7); c.fill();
    c.strokeStyle = '#e2574c'; c.lineWidth = W * 0.1; c.beginPath(); c.arc(m, m, m * 0.74, A(330), A(400)); c.stroke();
    c.strokeStyle = '#4caf50'; c.beginPath(); c.arc(m, m, m * 0.74, A(240), A(320)); c.stroke();
    c.strokeStyle = '#2b3a4a'; c.fillStyle = '#2b3a4a'; c.font = '800 ' + (W * 0.105) + 'px Fredoka,"Baloo 2","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let v = 0; v <= 400; v += 20) { const a = A(v), big = v % 100 === 0; c.lineWidth = W * (big ? 0.022 : 0.01); c.beginPath(); c.moveTo(m + Math.cos(a) * m * (big ? 0.64 : 0.7), m + Math.sin(a) * m * (big ? 0.64 : 0.7)); c.lineTo(m + Math.cos(a) * m * 0.84, m + Math.sin(a) * m * 0.84); c.stroke(); if (big && v !== 300) c.fillText(String(v), m + Math.cos(a) * m * 0.47, m + Math.sin(a) * m * 0.47); }
    { const a = A(280); c.fillStyle = '#2e7d32'; c.font = '800 ' + (W * 0.15) + 'px Fredoka,"Baloo 2","Trebuchet MS",sans-serif'; c.fillText('280', m + Math.cos(a) * m * 0.4, m + Math.sin(a) * m * 0.4 + W * 0.02); c.beginPath(); c.moveTo(m + Math.cos(a) * m * 0.98, m + Math.sin(a) * m * 0.98); c.lineTo(m + Math.cos(a - 0.09) * m * 0.86, m + Math.sin(a - 0.09) * m * 0.86); c.lineTo(m + Math.cos(a + 0.09) * m * 0.86, m + Math.sin(a + 0.09) * m * 0.86); c.fill(); c.fillStyle = '#2b3a4a'; }
    c.font = '800 ' + (W * 0.13) + 'px Fredoka,"Baloo 2","Trebuchet MS",sans-serif'; c.fillText('bar', m, m * 1.55);
  }, 512, [GX, GY, GZ]));
  out.needle = dyn(group([box(0.08, 0.95, 0.04, 0xd9483b, [0, 0.36, 0]), cyl(0.13, 0.13, 0.08, 0x2b3a4a, null, [PI / 2, 0, 0], 10)])); out.needle.position.set(X + GX, GY, GZ + 0.06); ctx.add(out.needle);
  out.setBar = (v) => { out.needle.rotation.z = (120 - v / 400 * 240) * PI / 180; };
  out.setBar(0);
  // console with the big button, and a table where the new plate lands
  const KX = 8.2, KZ = -5.2; out.console = [X + KX, KZ];
  g.add(box(1.5, 0.95, 0.8, 0x55606a, [KX, 0.475, KZ])); g.add(box(1.6, 0.12, 0.9, 0x2b3a4a, [KX, 1.0, KZ], [-0.25, 0, 0])); g.add(box(0.3, 0.1, 0.2, glow(0x7be08a), [KX - 0.45, 1.08, KZ], [-0.25, 0, 0])); g.add(box(0.3, 0.1, 0.2, glow(0xffd84a), [KX + 0.45, 1.08, KZ], [-0.25, 0, 0]));
  out.button = dyn(group([cyl(0.2, 0.22, 0.14, 0xd9483b, null, null, 12)])); out.button.position.set(X + KX, 1.13, KZ); ctx.add(out.button);
  ctx.collideBox(X + KX, KZ, 1.6, 0.9);
  const t = P.tableProp(1.5, 1.1, 0.85, 0x8c959c); t.position.set(12.2, 0, -5.2); g.add(t); ctx.collideBox(X + 12.2, -5.2, 1.5, 1.1); out.outTable = [X + 12.2, 0.9, -5.2];
  for (const [x, z] of [[17.6, -7.5], [17.7, -6.3]]) { const c2 = P.crate({ s: 1.0, color: 0xc9d2d8 }); c2.position.set(x, 0, z); g.add(c2); ctx.collideCircle(X + x, z, 0.6); }
  g.add(P.signpost('🎨 ➜', { h: 2.3, size: 0.8 }).translateX(15.0).translateZ(2.4)); exitArch(ctx, g, X, 17.3, -0.4, 0x2f6d9c);
  { const pal = group([box(1.6, 0.14, 1.2, C.woodLight, [0, 0.07, 0]), box(0.7, 0.6, 0.5, 0xd9c9a8, [-0.35, 0.44, 0.2]), box(0.7, 0.6, 0.5, 0xd9c9a8, [0.38, 0.44, -0.15]), box(0.7, 0.5, 0.5, 0xcdbb95, [0, 0.99, 0])], [9.5, 0, 3.3], [0, 0.3, 0]); g.add(pal); ctx.collideCircle(X + 9.5, 3.3, 0.9);
    for (const [x, zq, s] of [[-12.6, 3.2, 1.2], [-11.3, 3.6, 0.9]]) { const c3 = P.crate({ s }); c3.position.set(x, 0, zq); c3.rotation.y = x; g.add(c3); ctx.collideCircle(X + x, zq, 0.6 * s); } const bq = P.barrel(); bq.position.set(-13.9, 0, 3.5); g.add(bq); ctx.collideCircle(X - 13.9, 3.5, 0.45); }
  ctx.addStatic(g, X, 0);
  out.today = [X + 2.2, -1]; out.exit = [X + 17.3, -0.4];
  return out;
}

// ============================================================ 5 — the design studio
export function zoneStudio(ctx, X) {
  const g = new THREE.Group(), r = seeded(51), out = {};
  room(g, 27, 15, 6.5, 0xc9a877, 0xf4ead4, 0xeadfc6, -4);
  for (let i = 0; i < 12; i++) g.add(plane(27, 0.07, 0xa07f52, [0, 0.035, -11 + i * 1.7]));
  g.add(box(27, 1.2, 0.54, 0x7fa88f, [0, 0.6, -11.74])); g.add(box(27, 0.1, 0.6, 0xffffff, [0, 1.22, -11.72]));
  for (const x of [-9.5, 0, 9.5]) archWindow(g, x, 3.1, -11.45, 2.2, 2.0, 0xffffff);
  const seedOps = [classic(), surprise(seeded(5)), surprise(seeded(18)), surprise(seeded(27)), surprise(seeded(33)), surprise(seeded(46))];
  [-4.75, 4.75].forEach((x, k) => g.add(picture(5.4, 1.8, (c, W, H) => { for (let i = 0; i < 3; i++) { c.save(); c.translate(i * W / 3, 0); c.fillStyle = 'rgba(74,44,23,.25)'; c.beginPath(); c.arc(H / 2 + 3, H / 2 + 5, H * 0.47, 0, 7); c.fill(); c.fillStyle = '#fdfdf8'; c.beginPath(); c.arc(H / 2, H / 2, H * 0.47, 0, 7); c.fill(); c.save(); c.beginPath(); c.arc(H / 2, H / 2, H * 0.465, 0, 7); c.clip(); drawOps(c, H, seedOps[k * 3 + i]); c.restore(); c.strokeStyle = '#d9d4c6'; c.lineWidth = 2; c.beginPath(); c.arc(H / 2, H / 2, H * 0.47, 0, 7); c.stroke(); c.restore(); } }, 768, [x, 3.25, -11.45])));
  g.add(disc(3.4, 0xb5553f, [0, 0.04, -3], 24)); g.add(disc(2.9, 0xe9d9b0, [0, 0.045, -3], 24)); g.add(disc(2.2, 0x3f6e8c, [0, 0.05, -3], 24));
  // design desk
  const DX = -6, DZ = -7.2; out.desk = [X + DX, DZ];
  g.add(P.tableProp(3.6, 1.7, 0.9, 0xb98552).translateX(DX).translateZ(DZ)); g.add(box(1.7, 1.25, 0.08, 0xe9dcc0, [DX - 0.7, 1.5, DZ - 0.5], [-0.5, 0, 0])); g.add(box(1.8, 0.08, 0.12, C.woodDark, [DX - 0.7, 0.99, DZ - 0.18]));
  g.add(cyl(0.1, 0.1, 0.22, 0x3f7fd1, [DX + 1.45, 1.05, DZ - 0.55], null, 8)); for (let i = 0; i < 4; i++) g.add(cyl(0.018, 0.018, 0.36, [C.red, C.yellow, C.green, C.purple][i], [DX + 1.42 + i * 0.03, 1.25, DZ - 0.56 + (i % 2) * 0.04], [0.15 * (i - 1.5), 0, 0.1 * (i - 1.5)], 4));
  g.add(cyl(0.16, 0.2, 0.05, 0x333333, [DX - 1.55, 0.97, DZ - 0.5], null, 8)); g.add(cyl(0.025, 0.025, 0.8, 0x333333, [DX - 1.55, 1.35, DZ - 0.5], [0, 0, -0.25], 5)); g.add(cone(0.22, 0.26, 0xf2c43d, [DX - 1.4, 1.78, DZ - 0.5], [0, 0, -0.6], 8));
  ctx.collideBox(X + DX, DZ, 3.7, 1.8);
  out.sheetAt = [X + DX - 0.7, 1.52, DZ - 0.45]; out.plateAt = [X + DX + 0.55, 0.95, DZ + 0.2];
  // mould makers' bench (left wall)
  const MX = -11.4, MZ = -3.2; g.add(box(1.5, 0.9, 4.4, 0xa8743f, [MX, 0.45, MZ])); g.add(box(1.6, 0.08, 4.5, 0xe9dcc0, [MX, 0.94, MZ]));
  for (let i = 0; i < 4; i++) { const z = MZ - 1.6 + i * 1.05; g.add(cyl(0.38, 0.4, 0.3, 0xf4f1ea, [MX - 0.1, 1.13, z], null, 12)); g.add(cyl(0.28, 0.22, 0.06, 0xd9d4c6, [MX - 0.1, 1.27, z], null, 12)); if (i % 2) g.add(cyl(0.38, 0.4, 0.3, 0xf4f1ea, [MX + 0.2, 1.43, z + 0.05], [0, 0, 0.25], 12)); }
  ctx.collideBox(X + MX, MZ, 1.7, 4.6);
  const ms = statue({ skin: C.skin[2], hair: C.hair[4], hairStyle: 'short', shirt: 0x5a7f9c, pants: 0x4a4a55, apron: 0xf4f1ea, glasses: true }, 'work', 0.7); ms.position.set(MX + 1.15, 0, MZ - 0.6); ms.rotation.y = -PI / 2; g.add(ms); ctx.collideCircle(X + MX + 1.25, MZ - 0.6, 0.4);
  // printing press (roller press with a big star wheel)
  const RX = 3.2, RZ = -7.6; out.pressAt = [X + RX, RZ];
  g.add(box(3.6, 0.8, 1.3, 0x6e4a28, [RX, 0.4, RZ])); g.add(box(3.9, 0.1, 1.2, 0x3a3a3a, [RX, 0.88, RZ])); for (const s of [-1, 1]) { g.add(box(0.34, 1.3, 0.14, 0x2f5d50, [RX, 1.5, RZ + s * 0.68])); g.add(box(0.7, 0.14, 0.14, 0x2f5d50, [RX, 2.2, RZ + s * 0.68])); }
  g.add(cyl(0.2, 0.2, 1.24, 0xc9d2d8, [RX, 1.15, RZ], [PI / 2, 0, 0], 10)); g.add(cyl(0.2, 0.2, 1.24, 0x8c959c, [RX, 1.62, RZ], [PI / 2, 0, 0], 10)); g.add(box(0.2, 0.14, 1.5, 0x2f5d50, [RX, 2.2, RZ]));
  const sw = group([cyl(0.12, 0.12, 0.16, 0x333333, null, [PI / 2, 0, 0], 8)]); for (let i = 0; i < 6; i++) { const a = i * PI / 3; sw.add(box(0.07, 0.85, 0.07, 0x2f5d50, [Math.sin(a) * 0.42, Math.cos(a) * 0.42, 0], [0, 0, -a])); sw.add(sphere(0.09, 0xd9483b, [Math.sin(a) * 0.86, Math.cos(a) * 0.86, 0], 6)); }
  out.starWheel = dyn(sw); out.starWheel.position.set(X + RX, 1.62, RZ + 0.86); ctx.add(out.starWheel);
  ctx.collideBox(X + RX, RZ, 4.0, 1.6);
  out.sheetOut = [[X + RX - 0.5, 0.95, RZ], [X + RX + 1.3, 0.95, RZ]];
  g.add(box(1.0, 0.7, 0.7, C.wood, [RX - 2.6, 0.35, RZ - 0.4])); for (let i = 0; i < 3; i++) g.add(cyl(0.12, 0.12, 0.25, [0x1f4fa8, 0xc0392b, 0x2e8b57][i], [RX - 2.9 + i * 0.3, 0.83, RZ - 0.4], null, 8)); ctx.collideCircle(X + RX - 2.6, RZ - 0.4, 0.6);
  // hand painter's table (right)
  const HX = 9.4, HZ = -8.2; g.add(P.tableProp(2.6, 1.3, 0.9, 0xb98552).translateX(HX).translateZ(HZ)); for (let i = 0; i < 3; i++) { const pz = HZ - 0.25; /* within the painter's reach */ const pl = whitePlate(0.3); pl.position.set(HX - 0.8 + i * 0.8, 0.95, pz); g.add(pl); g.add(torus(0.2, 0.02, 0x1f4fa8, [HX - 0.8 + i * 0.8, 0.985, pz], [PI / 2, 0, 0], 12)); if (i < 2) for (let k = 0; k < 6; k++) g.add(sphere(0.035, 0x1f4fa8, [HX - 0.8 + i * 0.8 + Math.cos(k) * 0.25, 1.0, pz + Math.sin(k) * 0.25], 4)); }
  g.add(cyl(0.09, 0.09, 0.16, 0x1f4fa8, [HX + 1.1, 1.02, HZ - 0.4], null, 8)); ctx.collideBox(X + HX, HZ, 2.7, 1.4);
  // bone-china stand with a lamp
  const CX = 10.2, CZ = -2.6; out.bone = [X + CX, CZ];
  g.add(box(1.1, 1.0, 1.1, 0x6e4a28, [CX, 0.5, CZ])); g.add(box(1.25, 0.08, 1.25, 0x4a2c17, [CX, 1.04, CZ])); g.add(cyl(0.25, 0.3, 0.06, 0x333333, [CX, 1.11, CZ - 0.38], null, 8)); g.add(cyl(0.03, 0.03, 0.5, 0x333333, [CX, 1.36, CZ - 0.38], null, 5));
  g.add(cyl(0.05, 0.05, 2.2, 0x4a2c17, [CX, 2.1, CZ - 0.62], null, 5)); g.add(sign('BONE CHINA\nSpode · late 1700s', 1.5, { bg: '#fff8e8', fg: '#4a2c17', border: '#4a2c17', pad: 12, size: 48 }, [CX, 3.3, CZ - 0.56]));
  ctx.collideBox(X + CX, CZ, 1.2, 1.2);
  out.bulb = own(sphere(0.13, 0, null, 8), 0x777766, { basic: true }); out.bulb.position.set(X + CX, 1.66, CZ - 0.38); ctx.add(out.bulb);
  out.cup = own(lathe([[0, 0.02], [0.13, 0], [0.2, 0.12], [0.24, 0.34], [0.25, 0.36]], 0, null, 12), 0xfbfaf5, { double: true, emissive: 0x000000 }); out.cup.position.set(X + CX, 1.09, CZ + 0.08); ctx.add(out.cup);
  g.add(torus(0.1, 0.025, 0xfbfaf5, [CX + 0.3, 1.27, CZ + 0.08], null, 8)); g.add(lathe([[0, 0.01], [0.2, 0.01], [0.36, 0.05]], 0xfbfaf5, [CX, 1.08, CZ + 0.08], 12));
  // plants, shelves, stools
  for (const [x, z] of [[-12.4, -10.6], [12.4, -10.6], [-12.3, 2.2]]) { g.add(cyl(0.4, 0.3, 0.6, 0xb5553f, [x, 0.3, z], null, 8)); const bsh = P.bush({ s: 1.2, color: 0x4f9d4a }); bsh.position.set(x, 0.5, z); g.add(bsh); g.add(sphere(0.5, 0x5aa845, [x, 1.5, z], 6)); ctx.collideCircle(X + x, z, 0.5); }
  for (let s = 0; s < 2; s++) { g.add(box(0.5, 0.08, 3.6, C.woodDark, [12.95, 1.5 + s * 1.1, -6.6])); for (let i = 0; i < 4; i++) { const v = (i + s) % 2 ? vase(0.8, [0xfafafa, 0xdce8f6][i % 2]) : bowl(1.1); v.position.set(12.95, 1.54 + s * 1.1, -8 + i * 0.95); g.add(v); } }
  g.add(P.signpost('🔥 ➜', { h: 2.3, size: 0.8 }).translateX(9.9).translateZ(2.7)); exitArch(ctx, g, X, 12.0, 0.8, 0x7fa88f);
  g.add(plane(9, 2.2, 0x3f6e8c, [-3, 0.04, 2.2])); g.add(plane(8.5, 1.7, 0xe9d9b0, [-3, 0.045, 2.2])); g.add(plane(8, 1.2, 0xb5553f, [-3, 0.05, 2.2]));
  { const easel = group([box(0.08, 2.0, 0.08, C.wood, [-0.45, 1.0, 0], [0.18, 0, 0.12]), box(0.08, 2.0, 0.08, C.wood, [0.45, 1.0, 0], [0.18, 0, -0.12]), box(0.08, 1.9, 0.08, C.wood, [0, 0.95, -0.5], [-0.3, 0, 0]), box(1.1, 0.9, 0.05, 0xfdfdf8, [0, 1.25, 0.12], [0.18, 0, 0]), torus(0.3, 0.03, 0x1f4fa8, [0, 1.27, 0.17], [0.18, 0, 0], 14), sphere(0.09, 0xc0392b, [0, 1.27, 0.18], 6)], [5.4, 0, 2.4], [0, 2.7, 0]); g.add(easel); ctx.collideCircle(X + 5.4, 2.4, 0.6); }
  ctx.addStatic(g, X, 0);
  out.exit = [X + 12.1, 0.8];
  return out;
}

// ============================================================ 6 — glaze and the kiln
export function zoneKiln(ctx, X) {
  const g = new THREE.Group(), r = seeded(61), out = {};
  room(g, 31, 15, 7.5, 0xa39d90, 0x8d9aa3, 0x7f8c95, -4);
  for (let i = 0; i < 7; i++) { g.add(plane(0.08, 21, 0x8f897c, [-13.5 + i * 4.5, 0.035, -1])); } for (let i = 0; i < 5; i++) g.add(plane(31, 0.08, 0x8f897c, [0, 0.035, -10 + i * 4]));
  g.add(box(31, 2.2, 0.54, 0xa8573f, [0, 1.1, -11.74])); for (let i = 0; i < 16; i++) g.add(box(0.08, 5.3, 0.52, 0x7d8a93, [-15 + i * 2, 4.85, -11.73]));
  for (const x of [-13.6, -3.6, 12.6]) { g.add(box(3.0, 1.4, 0.1, 0x55606a, [x, 4.6, -11.46])); g.add(box(2.8, 1.2, 0.12, glow(0xcfeeff), [x, 4.6, -11.45])); g.add(box(0.08, 1.2, 0.14, 0x55606a, [x, 4.6, -11.44])); }
  g.add(plane(19, 0.2, 0xf2c43d, [4.6, 0.04, -6.05])); g.add(plane(0.2, 3.6, 0xf2c43d, [-4.9, 0.04, -7.8])); g.add(plane(0.2, 3.6, 0xf2c43d, [14.1, 0.04, -7.8]));
  for (let i = 0; i < 4; i++) g.add(plane(1.1, 1.1, 0xf2c43d, [-6 + i * 6, 0.04, 2.6], PI / 4));
  // glaze vat + drying rack
  const VX = -9.4, VZ = -7; out.vat = [X + VX, VZ];
  g.add(lathe([[0, 0.2], [1.25, 0.2], [1.4, 0.35], [1.4, 1.0], [1.48, 1.05]], 0x6d7a86, [VX, 0, VZ], 14)); g.add(cyl(1.3, 1.35, 0.22, 0x55606a, [VX, 0.11, VZ], null, 12)); g.add(cyl(1.36, 1.36, 0.05, 0xf3dce0, [VX, 0.88, VZ], null, 14)); ctx.collideCircle(X + VX, VZ, 1.6);
  g.add(sign('💧 GLAZE', 1.2, { bg: '#fff8e8', fg: '#2f6d9c', border: '#2f6d9c', pad: 12 }, [VX, 3.3, -11.44]));
  const rk = group([P.tableProp(2.4, 0.9, 0.9, 0x8c959c)], [-13.2, 0, -9.6]); for (let i = 0; i < 5; i++) { const pl = whitePlate(0.3, 0xf3dce0); pl.position.set(-0.9 + i * 0.45, 1.25, 0); pl.rotation.z = PI / 2 - 0.15; rk.add(pl); } rk.add(box(2.2, 0.06, 0.06, 0x55606a, [0, 0.98, 0.2])); rk.add(box(2.2, 0.06, 0.06, 0x55606a, [0, 0.98, -0.2])); g.add(rk); ctx.collideBox(X - 13.2, -9.6, 2.5, 1);
  for (const [x, z, c] of [[-6.9, -9.9, 0x3f7fd1], [-6.1, -10.3, 0xf2c43d]]) { g.add(cyl(0.3, 0.25, 0.55, c, [x, 0.28, z], null, 8)); ctx.collideCircle(X + x, z, 0.35); }
  // the roller kiln: a long glowing tunnel
  const KX = 4.6, KZ = -8, KL = 12; out.kiln = { x0: X + KX - KL / 2, x1: X + KX + KL / 2, z: KZ, y: 1.12 };
  g.add(box(KL, 2.3, 2.7, 0xc9d0d6, [KX, 2.05, KZ])); g.add(box(KL + 0.1, 0.2, 2.8, 0xc9973c, [KX, 3.2, KZ]));
  { const top = cyl(1.36, 1.36, KL - 0.1, 0xb4bcc2, null, [0, 0, PI / 2], 16); g.add(group([top], [KX, 3.22, KZ])).children.at(-1).scale.y = 0.42; }
  g.add(cyl(0.08, 0.08, KL - 0.6, 0xc9973c, [KX, 3.62, KZ + 1.22], [0, 0, PI / 2], 6)); for (let i = 0; i < 5; i++) { const x = KX - 4.4 + i * 2.2; g.add(cyl(0.045, 0.045, 1.0, 0xc9973c, [x + 0.75, 3.12, KZ + 1.4], null, 5)); g.add(box(0.16, 0.16, 0.14, 0xb5382c, [x + 0.75, 2.6, KZ + 1.42])); g.add(box(1.36, 0.78, 0.06, 0x55606a, [x, 2.0, KZ + 1.34])); }
  g.add(box(0.66, 1.3, 0.12, 0x55606a, [KX - 5.6, 2.1, KZ + 1.4])); g.add(box(0.48, 0.32, 0.04, glow(0x9fe0b0), [KX - 5.6, 2.42, KZ + 1.47])); for (let i = 0; i < 3; i++) g.add(cyl(0.05, 0.05, 0.05, [0xd9483b, 0xf2c43d, 0x4caf50][i], [KX - 5.77 + i * 0.17, 1.95, KZ + 1.47], [PI / 2, 0, 0], 6)); g.add(box(KL + 0.1, 0.3, 2.8, 0x55606a, [KX, 0.92, KZ]));
  for (let i = 0; i < 6; i++) { const x = KX - KL / 2 + 0.5 + i * 2.2; g.add(box(0.22, 0.9, 2.6, 0x55606a, [x, 0.45, KZ])); g.add(box(0.14, 2.3, 2.76, 0x8c959c, [x, 2.05, KZ])); }
  for (let i = 0; i < 5; i++) { const x = KX - 4.4 + i * 2.2; g.add(box(1.2, 0.62, 0.1, 0x24242a, [x, 2.0, KZ + 1.36])); }
  for (const x of [KX - 4.9, KX + 4.9]) { g.add(cyl(0.4, 0.4, 4.4, 0x8c959c, [x, 5.6, KZ - 0.3], null, 8)); g.add(cyl(0.5, 0.5, 0.2, 0x55606a, [x, 3.5, KZ - 0.3], null, 8)); }
  for (const s of [-1, 1]) { const x = KX + s * (KL / 2 + 0.02); g.add(box(0.08, 0.8, 1.7, 0x24242a, [x, 1.5, KZ])); }
  out.glowMat = new THREE.MeshBasicMaterial({ color: 0x3a1a10 });
  const gw = new THREE.Group(); for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.46, 0.06), out.glowMat); m.position.set(-4.4 + i * 2.2, 0, 0); gw.add(m); } for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 1.5), out.glowMat); m.position.set(s * (KL / 2 + 0.07), -0.5, -1.4); gw.add(m); }
  gw.position.set(X + KX, 2.0, KZ + 1.4); ctx.add(gw);
  // roller tables at both ends
  for (const s of [-1, 1]) { const c = P.conveyor(3.2, { h: 1.0, w: 1.5 }); c.position.set(KX + s * (KL / 2 + 1.6), 0, KZ); g.add(c); for (let k = 0; k < 7; k++) g.add(cyl(0.07, 0.07, 1.5, 0xc9d2d8, [KX + s * (KL / 2 + 0.3 + k * 0.44), 1.08, KZ], [PI / 2, 0, 0], 6)); }
  ctx.collideBox(X + KX, KZ, KL + 6.5, 2.8);
  out.loadAt = [X + KX - KL / 2 - 1.8, 1.16, KZ]; out.outAt = [X + KX + KL / 2 + 1.8, 1.16, KZ];
  // the heat lever
  const LX = -1.2, LZ = -3.9; out.leverAt = [X + LX, LZ];
  g.add(box(1.2, 1.0, 0.7, 0x55606a, [LX, 0.5, LZ])); g.add(box(1.3, 0.1, 0.8, 0x2b3a4a, [LX, 1.05, LZ])); for (let i = 0; i < 3; i++) g.add(box(0.16, 0.06, 0.16, glow([0xffd84a, 0xff9a3c, 0xff5a3c][i]), [LX - 0.4 + i * 0.4, 1.12, LZ + 0.25]));
  out.lever = dyn(group([cyl(0.045, 0.045, 0.8, 0x333333, [0, 0.4, 0], null, 6), sphere(0.13, 0xd9483b, [0, 0.85, 0], 8)])); out.lever.position.set(X + LX, 1.08, LZ - 0.1); out.lever.rotation.z = 0.7; ctx.add(out.lever);
  ctx.collideBox(X + LX, LZ, 1.3, 0.8);
  // temperature display above the kiln
  const dc = document.createElement('canvas'); dc.width = 512; dc.height = 160; const dg = dc.getContext('2d'); const dt = new THREE.CanvasTexture(dc); dt.colorSpace = THREE.SRGBColorSpace;
  out.setTemp = (deg) => { dg.fillStyle = '#1d2329'; dg.fillRect(0, 0, 512, 160); const f = Math.min(1, deg / 1400); dg.fillStyle = '#39424a'; dg.fillRect(24, 118, 464, 22); const gr = dg.createLinearGradient(24, 0, 488, 0); gr.addColorStop(0, '#ffd84a'); gr.addColorStop(0.6, '#ff8a2a'); gr.addColorStop(1, '#ff3a2a'); dg.fillStyle = gr; dg.fillRect(24, 118, 464 * f, 22);
    dg.font = '800 92px Fredoka,"Baloo 2","Trebuchet MS",sans-serif'; dg.textAlign = 'center'; dg.textBaseline = 'middle'; dg.fillStyle = deg >= 1400 ? '#ff6a4a' : '#ffd84a'; dg.fillText(Math.round(deg).toLocaleString('en-US') + '°C', 256, 62); dt.needsUpdate = true; };
  out.setTemp(20);
  const dm = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.0), new THREE.MeshBasicMaterial({ map: dt })); dm.position.set(X + KX, 4.85, -11.4); ctx.add(dm);
  g.add(box(6.8, 2.4, 0.2, 0x2b3a4a, [KX, 4.85, -11.55]));
  const sl = plateRack(4.2, 5, 0xf4efe2); sl.position.set(-14.95, 0, -5.2); g.add(sl);
  for (const [x, z, c] of [[-14.6, -1.6, 0x4a6f94], [-14.7, -0.6, 0xe9dcd6], [-13.8, -1.1, 0x5f8a62]]) { const k = P.barrel({ color: c }); k.position.set(x, 0, z); g.add(k); ctx.collideCircle(X + x, z, 0.45); }
  for (const [x, zq, ry] of [[-2.5, 3.2, 0.2], [6.5, 3.3, -0.3]]) { const pal = group([box(1.6, 0.14, 1.2, C.woodLight, [0, 0.07, 0]), box(0.7, 0.55, 0.5, 0xd9c9a8, [-0.35, 0.42, 0.2]), box(0.7, 0.55, 0.5, 0xd9c9a8, [0.38, 0.42, -0.15])], [x, 0, zq], [0, ry, 0]); g.add(pal); ctx.collideCircle(X + x, zq, 0.9); }
  // crates of finished plates, pallets
  for (const [x, z, ry] of [[13.4, -3.2, 0.3], [14.1, -1.6, -0.2], [-13.6, -2.2, 0.5]]) { const c = P.crate({ s: 1.1, fill: 0xfafafa }); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); ctx.collideCircle(X + x, z, 0.7); }
  const sh = plateRack(3.4, 4, 0xfafafa); sh.position.set(14.85, 0, -7.5); g.add(sh);
  ctx.addStatic(g, X, 0);
  return out;
}
