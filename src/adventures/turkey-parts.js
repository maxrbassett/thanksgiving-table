// Models and little helpers for the Turkey adventure (birds, packaged turkeys, machines, the flock brain).
import { THREE, C, box, cyl, cone, sphere, ball, torus, group, bake, mat, glow, lathe, angleTo } from '../core/kit.js';
import * as P from '../core/props.js';

/** wrap a baked model in a root so the root can walk/turn while the inside waddles. 1 draw call. */
function wrap(g) { bake(g); const root = new THREE.Group(); root.add(g); root.userData.inner = g; return root; }

/** a white farm turkey (broad-breasted, as raised in barns), ~1.15 m tall, facing +Z. */
export function turkeyBird(o = {}) {
  const body = o.color ?? 0xf4f1ea, tail = o.tail ?? 0xddd5c4, leg = 0xd9a98f, bare = 0xe29aa6, g = new THREE.Group();
  g.add(ball(0.33, 0.3, 0.44, body, [0, 0.62, -0.02]));                                   // body
  g.add(ball(0.27, 0.27, 0.24, body, [0, 0.6, 0.27]));                                    // deep breast
  g.add(ball(0.2, 0.16, 0.2, tail, [0, 0.74, -0.36]));                                    // rump under the fan
  // tail fan: two thin rounded sectors (outer feathers, darker inner band)
  const fan = (r, c, z, y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.035, 11, 1, false, -1.15, 2.3), mat(c)); m.rotation.set(Math.PI / 2 - 0.28, Math.PI, 0); m.position.set(0, y, z); m.castShadow = true; return m; };
  g.add(fan(0.56, body, -0.42, 0.78)); g.add(fan(0.4, tail, -0.4, 0.77));
  for (const s of [-1, 1]) {
    g.add(ball(0.1, 0.21, 0.33, body, [s * 0.31, 0.63, -0.03], [0.3, 0, s * 0.12])); g.add(ball(0.06, 0.12, 0.2, tail, [s * 0.35, 0.54, -0.16], [0.5, 0, 0], 6)); // wing + flight feathers
    g.add(ball(0.08, 0.13, 0.1, body, [s * 0.13, 0.36, 0.02], null, 6)); g.add(cyl(0.026, 0.03, 0.3, leg, [s * 0.13, 0.16, 0.02], null, 5));                      // thigh + shank
    g.add(box(0.035, 0.025, 0.2, leg, [s * 0.13, 0.014, 0.1])); for (const a of [-0.5, 0.5]) g.add(box(0.03, 0.022, 0.15, leg, [s * 0.13 + a * 0.09, 0.014, 0.08], [0, a, 0]));
  }
  g.add(cyl(0.065, 0.1, 0.3, body, [0, 0.9, 0.36], [0.42, 0, 0], 7)); g.add(cyl(0.05, 0.062, 0.2, bare, [0, 1.09, 0.43], [0.12, 0, 0], 7)); // neck: feathered, then bare skin
  g.add(ball(0.085, 0.095, 0.105, bare, [0, 1.22, 0.46], null, 8));                       // small bare head
  g.add(cone(0.04, 0.14, 0xd8c08c, [0, 1.2, 0.59], [Math.PI / 2, 0, 0], 5));              // beak
  g.add(ball(0.022, 0.07, 0.03, 0xc93a30, [0.02, 1.19, 0.58], [0, 0, 0.25], 6));          // snood hanging over the beak
  g.add(ball(0.04, 0.09, 0.05, 0xc93a30, [0, 1.07, 0.52], null, 6));                      // wattle
  for (const s of [-1, 1]) g.add(sphere(0.02, 0x1c1c1c, [s * 0.066, 1.245, 0.52], 5));
  const r = wrap(g); if (o.s) r.scale.setScalar(o.s); return r;
}
/** a fluffy yellow poult (baby turkey). */
export function poult(o = {}) {
  const c = o.color ?? 0xf3dc86, down = 0xdcbf63, leg = 0xdc9a5e, g = new THREE.Group();
  g.add(ball(0.15, 0.14, 0.18, c, [0, 0.2, 0])); g.add(ball(0.1, 0.1, 0.105, c, [0, 0.37, 0.12], null, 8)); g.add(ball(0.09, 0.07, 0.09, c, [0, 0.22, -0.14], null, 6));
  g.add(ball(0.05, 0.035, 0.15, down, [0, 0.325, -0.03], [-0.25, 0, 0], 6));                 // darker down along the back
  g.add(cone(0.03, 0.08, 0xd9a25e, [0, 0.355, 0.24], [Math.PI / 2, 0, 0], 5));
  for (const s of [-1, 1]) { g.add(ball(0.045, 0.07, 0.1, down, [s * 0.14, 0.22, -0.02], null, 6)); g.add(sphere(0.02, 0x1c1c1c, [s * 0.062, 0.4, 0.19], 5)); g.add(cyl(0.013, 0.015, 0.1, leg, [s * 0.06, 0.05, 0], null, 4)); g.add(box(0.05, 0.012, 0.08, leg, [s * 0.06, 0.006, 0.03])); }
  const r = wrap(g); if (o.s) r.scale.setScalar(o.s); return r;
}
/** an egg (cream, speckled look from two tones). */
export const egg = (s = 1, color = 0xf3e6cf) => ball(0.1 * s, 0.135 * s, 0.1 * s, color, [0, 0.135 * s, 0], null, 7);

/** a shop turkey in its wrapper. kind: 'plain' | 'ok' (inspection tag) | 'frozen' | 'label'. Always 1 draw. */
export function packTurkey(kind = 'plain') {
  const frozen = kind === 'frozen' || kind === 'label', skin = frozen ? 0xe9f1f6 : 0xf4dcc6, g = new THREE.Group();
  g.add(ball(0.3, 0.2, 0.24, skin, [0, 0.2, 0]));
  for (const s of [-1, 1]) g.add(ball(0.1, 0.09, 0.13, skin, [s * 0.17, 0.24, 0.16]));
  g.add(cyl(0.05, 0.08, 0.08, 0xffffff, [0.33, 0.2, 0], [0, 0, -Math.PI / 2], 6));
  if (kind === 'ok') { g.add(cyl(0.09, 0.09, 0.02, 0x3fae5a, [0, 0.405, -0.02], null, 10)); g.add(box(0.1, 0.022, 0.03, 0xffffff, [0.005, 0.41, -0.02], [0, 0.7, 0])); }
  if (frozen) { g.add(ball(0.16, 0.05, 0.12, 0xffffff, [-0.08, 0.37, -0.03])); }
  if (kind === 'label') { g.add(box(0.3, 0.02, 0.2, 0xe8b63a, [0, 0.4, 0], [0, 0, 0])); g.add(box(0.22, 0.025, 0.06, 0xd9483b, [0, 0.402, 0.04])); g.add(box(0.16, 0.025, 0.03, 0x333333, [0, 0.402, -0.05])); }
  return bake(g);
}
/** the roast (or raw) turkey in a pan / on a platter. kind: 'raw' | 'herb' | 'gold'. */
export function roastTurkey(kind = 'gold', dish = 'pan') {
  const c = kind === 'gold' ? 0xc1762a : 0xf0cdb4, g = new THREE.Group();
  if (dish === 'pan') { g.add(box(1.0, 0.14, 0.7, 0x4a4f57, [0, 0.07, 0])); g.add(box(0.9, 0.04, 0.6, 0x2c3036, [0, 0.13, 0])); for (const s of [-1, 1]) g.add(box(0.08, 0.05, 0.3, 0x4a4f57, [s * 0.54, 0.13, 0])); }
  else { g.add(lathe([[0, 0.02], [0.46, 0.02], [0.62, 0.09], [0.64, 0.11]], 0xfafafa)); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; g.add(ball(0.1, 0.05, 0.07, i % 2 ? 0x4f9d4a : 0x6fb24f, [Math.cos(a) * 0.49, 0.08, Math.sin(a) * 0.49], [0, -a, 0])); if (i % 3 === 0) g.add(sphere(0.05, 0xb0122e, [Math.cos(a + 0.3) * 0.52, 0.1, Math.sin(a + 0.3) * 0.52], 5)); } }
  g.add(ball(0.36, 0.26, 0.3, c, [0, 0.38, 0])); g.add(ball(0.2, 0.1, 0.18, kind === 'gold' ? 0xd58a35 : c, [0, 0.58, -0.02]));
  for (const s of [-1, 1]) { g.add(ball(0.1, 0.1, 0.17, c, [s * 0.27, 0.36, 0.2], [0.4, s * 0.4, 0])); g.add(cyl(0.03, 0.035, 0.12, 0xfff6e6, [s * 0.33, 0.42, 0.36], [1.2, 0, -s * 0.3], 5)); g.add(ball(0.07, 0.06, 0.14, c, [s * 0.33, 0.33, -0.12])); }
  if (kind === 'herb') for (let i = 0; i < 9; i++) g.add(box(0.05, 0.02, 0.03, i % 3 ? 0x3f8f3a : 0x7a4a2a, [Math.cos(i * 2.4) * 0.2, 0.62 - Math.abs(Math.cos(i * 2.4)) * 0.06, Math.sin(i * 2.4) * 0.16 - 0.02], [0, i, 0]));
  return bake(g);
}
/** 3 fan blades spinning round Z (facing +Z). */
export function fanBlades(r = 0.5, color = 0xdfe6ea) { const g = new THREE.Group(); for (let i = 0; i < 3; i++) g.add(box(r * 0.42, r * 1.9, 0.04, color, [0, 0, 0], [0, 0, i * Math.PI / 3])); g.add(cyl(r * 0.2, r * 0.2, 0.1, 0x555555, [0, 0, 0], [Math.PI / 2, 0, 0], 8)); return bake(g); }
/** a long roof: triangle profile (w wide, h tall), len long, ridge along X. */
export function prism(w, h, len, color) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2); geo.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(geo, mat(color)); m.castShadow = true; return m;
}
// a leaf is a paper-thin box of which only the top and bottom faces are kept (4 triangles instead of 12: over 500 leaves stand in the field)
const leaf = (g, w, l, c, pos, rot) => { const m = box(w, 0.012, l, c, pos); m.geometry.setIndex(Array.from(m.geometry.index.array).slice(12, 24)); m.geometry.clearGroups(); m.rotation.order = 'YXZ'; m.rotation.set(rot[0], rot[1], rot[2]); g.add(m); };
/** a clump of corn stalks: tall canes, long drooping leaves, an ear in its husk, a tassel on top (kept light: ~100 triangles a stalk). */
export function cornClump(rnd) {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.5, 0.3], [0.45, -0.35], [0, 0.75], [0.1, -1.0]]) {
    const h = 2.0 + rnd() * 0.4; g.add(cyl(0.025, 0.045, h, 0x86a24a, [x, h / 2, z], null, 4));
    for (let i = 0; i < 4; i++) { const a = i * 2.4 + x * 5, y = h * (0.27 + i * 0.17), c = i % 2 ? 0x6f9a3e : 0x8fae4e;
      leaf(g, 0.1, 0.5, c, [x + Math.sin(a) * 0.22, y + 0.1, z + Math.cos(a) * 0.22], [-0.45, a, 0]); leaf(g, 0.07, 0.34, c, [x + Math.sin(a) * 0.56, y + 0.1, z + Math.cos(a) * 0.56], [0.5, a, 0]); }
    g.add(cyl(0.045, 0.07, 0.34, 0xc9c27a, [x + 0.08, h * 0.52, z + 0.04], [0, 0, -0.3], 5)); g.add(cone(0.05, 0.12, 0xe3b93a, [x + 0.14, h * 0.52 + 0.2, z + 0.04], [0, 0, -0.3], 5)); // ear in its husk, kernels peeping out
    g.add(cone(0.06, 0.3, 0xcdb56a, [x, h + 0.12, z], null, 4));                                                                        // tassel
  }
  bake(g); g.traverse(m => { m.castShadow = false; }); return g; // 16 clumps stand in view at once: no shadow pass for them
}
/** a wheel lying on the X axis: dark tyre, coloured hub. */
function wheel(r, w, hub, pos, seg = 14) { const g = new THREE.Group(); g.add(cyl(r, r, w, 0x26282b, [0, 0, 0], [0, 0, Math.PI / 2], seg)); g.add(cyl(r * 0.55, r * 0.55, w + 0.04, hub, [0, 0, 0], [0, 0, Math.PI / 2], 10)); g.add(cyl(r * 0.16, r * 0.16, w + 0.1, 0x3a3d42, [0, 0, 0], [0, 0, Math.PI / 2], 6)); g.position.set(pos[0], pos[1], pos[2]); return g; }
/** combine harvester with a corn head (a row of pointed snouts), facing +Z. 1 draw. */
export function combine() {
  const g = new THREE.Group(), GR = 0x3d7a45, GD = 0x2f5f37, YL = 0xd8b23a, GLASS = 0x8fb3c4;
  g.add(box(2.1, 1.5, 3.3, GR, [0, 1.75, -0.75]));                                           // threshing body
  g.add(box(2.1, 0.5, 0.9, GR, [0, 1.5, -2.6], [0.45, 0, 0])); g.add(box(1.7, 0.5, 0.5, GD, [0, 0.95, -2.5])); // sloped tail + straw spreader
  g.add(box(2.3, 0.5, 2.0, GD, [0, 2.72, -1.0])); g.add(ball(0.95, 0.3, 0.8, 0xd9b44a, [0, 2.95, -1.0]));   // grain tank heaped with corn
  g.add(box(1.5, 1.25, 1.25, GLASS, [0, 2.3, 1.2])); g.add(box(1.62, 0.12, 1.4, GR, [0, 2.98, 1.22])); g.add(box(1.56, 0.3, 1.3, GR, [0, 1.62, 1.2])); // glass cab, roof, sill
  for (const s of [-1, 1]) { g.add(box(0.08, 1.25, 0.08, GD, [s * 0.74, 2.3, 1.8])); g.add(box(0.08, 1.25, 0.08, GD, [s * 0.74, 2.3, 0.6])); }
  g.add(box(0.5, 0.06, 0.9, 0x55595e, [1.3, 1.45, 1.0])); for (let i = 0; i < 3; i++) g.add(box(0.45, 0.05, 0.1, 0x55595e, [1.3, 0.5 + i * 0.32, 1.35])); g.add(box(0.05, 1.0, 0.05, 0x55595e, [1.52, 0.95, 1.35])); // platform + ladder
  g.add(box(1.2, 0.7, 1.6, GD, [0, 1.0, 1.75], [0.42, 0, 0]));                               // feeder house down to the head
  g.add(box(3.7, 0.6, 0.55, YL, [0, 0.6, 2.3])); g.add(cyl(0.2, 0.2, 3.5, 0x8a8f96, [0, 0.62, 2.62], [0, 0, Math.PI / 2], 8)); // head frame + auger
  for (let i = 0; i < 5; i++) { const x = -1.48 + i * 0.74; g.add(cone(0.3, 1.15, i % 2 ? GR : GD, [x, 0.38, 3.15], [Math.PI / 2 - 0.12, 0, 0], 8)); g.add(box(0.5, 0.3, 0.5, GR, [x, 0.5, 2.65])); }
  g.add(wheel(0.88, 0.62, YL, [-1.28, 0.88, 0.55])); g.add(wheel(0.88, 0.62, YL, [1.28, 0.88, 0.55])); g.add(wheel(0.52, 0.4, YL, [-1.0, 0.52, -2.0], 12)); g.add(wheel(0.52, 0.4, YL, [1.0, 0.52, -2.0], 12));
  g.add(cyl(0.15, 0.15, 2.9, YL, [-1.22, 2.85, -1.2], [Math.PI / 2, 0, 0], 8)); g.add(cyl(0.15, 0.15, 0.5, YL, [-1.22, 2.68, -2.6], [0.9, 0, 0], 8)); // unloading auger, folded back
  g.add(cyl(0.06, 0.06, 0.9, 0x3a3d42, [0.8, 3.2, 0.3], null, 6)); g.add(box(0.5, 0.12, 0.04, 0xf2c43d, [0, 2.75, 1.84]));            // exhaust, cab lights
  bake(g); g.userData.seat = [0, 1.0, -0.75]; return g;
}
/** a tracked bulldozer with a curved blade, facing +Z. 1 draw. */
export function bulldozer() {
  const g = new THREE.Group(), YL = 0xd6a429, DK = 0x2b2d30, ST = 0x777f88;
  for (const s of [-1, 1]) { g.add(box(0.55, 0.5, 2.5, DK, [s * 0.95, 0.42, -0.1])); for (const z of [-1.35, 1.15]) g.add(cyl(0.42, 0.42, 0.55, DK, [s * 0.95, 0.42, z], [0, 0, Math.PI / 2], 10)); g.add(cyl(0.2, 0.2, 0.6, ST, [s * 0.95, 0.42, -1.35], [0, 0, Math.PI / 2], 8)); g.add(box(0.6, 0.06, 2.4, YL, [s * 0.95, 0.9, -0.1])); }
  g.add(box(1.35, 0.75, 2.9, YL, [0, 0.85, -0.1])); g.add(box(1.2, 0.6, 1.25, YL, [0, 1.5, 0.7])); g.add(box(1.0, 0.5, 0.06, DK, [0, 1.48, 1.34]));   // frame, engine hood, grille
  g.add(box(1.3, 1.15, 1.2, 0x8fb3c4, [0, 1.8, -0.75])); g.add(box(1.45, 0.1, 1.35, YL, [0, 2.42, -0.75])); for (const s of [-1, 1]) for (const z of [-1.33, -0.17]) g.add(box(0.09, 1.15, 0.09, YL, [s * 0.63, 1.8, z])); // glass cab
  g.add(cyl(0.06, 0.06, 0.7, DK, [0.4, 2.1, 0.9], null, 6));
  for (let i = 0; i < 3; i++) { const a = -0.45 + i * 0.45; g.add(box(2.9, 0.36, 0.08, i === 1 ? 0x6d7680 : ST, [0, 0.2 + i * 0.32, 2.02 + Math.abs(a) * 0.16], [-a, 0, 0])); } // curved blade, ~1 m tall
  g.add(box(2.9, 0.06, 0.12, 0xc9ced3, [0, 0.04, 2.12]));                                                                              // cutting edge
  for (const s of [-1, 1]) { g.add(box(0.08, 0.95, 0.3, ST, [s * 1.46, 0.5, 1.98])); g.add(box(0.14, 0.16, 1.5, ST, [s * 1.32, 0.45, 1.2])); g.add(cyl(0.05, 0.05, 0.9, 0xc9ced3, [s * 0.5, 0.95, 1.62], [1.15, 0, 0], 6)); }
  return bake(g);
}
/** forklift facing +Z; userData.fork is a Group that can be raised and hold a pallet. */
export function forklift() {
  const g = new THREE.Group(), b = new THREE.Group(), OR = 0xe2952f, DK = 0x2d2f33;
  b.add(box(1.15, 0.55, 1.5, OR, [0, 0.55, -0.05])); b.add(ball(0.6, 0.42, 0.45, DK, [0, 0.72, -0.95])); b.add(box(1.15, 0.5, 0.5, DK, [0, 0.55, -0.85])); // body + rounded counterweight
  b.add(box(0.52, 0.24, 0.48, 0x3a3d42, [0, 0.95, -0.32])); b.add(box(0.52, 0.55, 0.1, 0x3a3d42, [0, 1.36, -0.6], [-0.12, 0, 0]));                            // seat
  b.add(cyl(0.022, 0.022, 0.56, DK, [0, 1.134, 0.334], [-0.5, 0, 0], 5)); b.add(torus(0.15, 0.025, DK, [0, 1.38, 0.2], [Math.PI / 2 - 0.5, 0, 0], 10)); b.add(box(0.9, 0.54, 0.1, OR, [0, 1.03, 0.48])); // steering column (between the driver's straight legs) + wheel above them, tall front cowl that hides the feet
  b.add(wheel(0.32, 0.26, 0xc9ced3, [-0.6, 0.32, 0.42], 12)); b.add(wheel(0.32, 0.26, 0xc9ced3, [0.6, 0.32, 0.42], 12)); b.add(wheel(0.26, 0.22, 0xc9ced3, [-0.58, 0.26, -0.72], 10)); b.add(wheel(0.26, 0.22, 0xc9ced3, [0.58, 0.26, -0.72], 10));
  for (const sx of [-1, 1]) { b.add(box(0.1, 2.5, 0.12, 0x4a4e54, [sx * 0.4, 1.35, 0.74])); b.add(box(0.06, 1.48, 0.06, DK, [sx * 0.55, 1.58, 0.43], [0.1, 0, 0])); b.add(box(0.06, 1.42, 0.06, DK, [sx * 0.55, 1.6, -0.72])); }
  b.add(box(0.9, 0.08, 0.1, 0x4a4e54, [0, 2.58, 0.74])); b.add(box(0.9, 0.08, 0.1, 0x4a4e54, [0, 1.4, 0.74])); b.add(cyl(0.05, 0.05, 1.6, 0xc9ced3, [0, 1.0, 0.72], null, 6));  // mast cross-bars + lift ram
  b.add(box(1.25, 0.07, 1.35, OR, [0, 2.32, -0.15])); for (let k = 0; k < 3; k++) b.add(box(1.2, 0.04, 0.05, DK, [0, 2.36, -0.55 + k * 0.4]));               // overhead guard (clear of the seated driver's big head)
  b.add(sphere(0.07, 0xf2c43d, [0.5, 2.42, -0.7], 6)); bake(b); g.add(b);
  const fork = new THREE.Group(); fork.userData.dynamic = true; fork.userData.keep = true; const fm = group([box(0.12, 0.05, 1.2, 0x5a5f66, [-0.3, 0, 0.6]), box(0.12, 0.05, 1.2, 0x5a5f66, [0.3, 0, 0.6]), box(0.12, 0.5, 0.06, 0x5a5f66, [-0.3, 0.24, 0.02]), box(0.12, 0.5, 0.06, 0x5a5f66, [0.3, 0.24, 0.02]), box(0.95, 0.08, 0.06, 0x3a3d42, [0, 0.45, 0]), box(0.95, 0.08, 0.06, 0x3a3d42, [0, 0.12, 0])]); fm.userData.dynamic = true; bake(fm); fork.add(fm);
  fork.position.set(0, 0.2, 0.8); g.add(fork); g.userData.fork = fork; g.userData.seat = [0, 0.75, -0.3]; return g; // the player (0.82 size) sits with hips 0.39 above this point; the straight legs reach 0.57 forward and stay behind the cowl
}
/** a cardboard box with a turkey sticker colour band. */
export function carton(s = 1) { const g = new THREE.Group(); g.add(box(0.8 * s, 0.5 * s, 0.6 * s, 0xc9a06a, [0, 0.25 * s, 0])); g.add(box(0.82 * s, 0.1 * s, 0.1 * s, 0xe9dcc0, [0, 0.47 * s, 0])); g.add(box(0.3 * s, 0.22 * s, 0.02, 0xd9483b, [0, 0.25 * s, 0.305 * s])); return bake(g); }

/**
 * The flock brain: one update loop moving many birds. add(bird, {mode, rect:[x1,z1,x2,z2], speed}) → b.
 * modes: 'wander' (stroll + peck in rect), 'follow' (b.leader object, b.gap), 'goto' (b.tx,b.tz then b.onArrive), 'herd' (run from the player), 'still'.
 */
export function makeFlock(ctx, rnd) {
  const birds = [], P = ctx.player.position;
  const add = (obj, o = {}) => { const b = Object.assign({ obj, inner: obj.userData.inner, mode: 'wander', speed: 1.3, rect: [-1, -1, 1, 1], tx: obj.position.x, tz: obj.position.z, wait: rnd() * 2, ph: rnd() * 10, peck: false, hop: 0, size: 0.5, scare: 3.6, bias: [0, 0], gap: 1 }, o); birds.push(b); return b; };
  const remove = (b) => { const i = birds.indexOf(b); if (i >= 0) birds.splice(i, 1); };
  const stop = ctx.onUpdate((dt, t) => {
    for (const b of birds) {
      const p = b.obj.position; let vx = 0, vz = 0, sp = b.speed, roam = b.mode === 'wander';
      if (b.mode === 'herd') { const dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz) || 1; if (d < b.scare) { vx = dx / d + b.bias[0]; vz = dz / d * 0.7 + b.bias[1]; const l = Math.hypot(vx, vz) || 1; vx /= l; vz /= l; sp = b.speed * 2.4; b.wait = 0.4; b.tx = p.x; b.tz = p.z; b.ran = true; } else roam = true; }
      if (roam) {
        if (b.wait > 0) { b.wait -= dt; if (b.wait <= 0) { b.tx = b.rect[0] + rnd() * (b.rect[2] - b.rect[0]); b.tz = b.rect[1] + rnd() * (b.rect[3] - b.rect[1]); } }
        else { const dx = b.tx - p.x, dz = b.tz - p.z, d = Math.hypot(dx, dz); if (d < 0.15) { b.wait = 0.6 + rnd() * 2.6; b.peck = rnd() < 0.65; } else { vx = dx / d; vz = dz / d; } }
      } else if (b.mode === 'follow') { const L = b.leader.position, dx = L.x - p.x, dz = L.z - p.z, d = Math.hypot(dx, dz) || 1; if (d > b.gap) { vx = dx / d; vz = dz / d; sp = Math.min(7.5, 1 + (d - b.gap) * 4); } else { b.face = Math.atan2(dx, dz); } }
      else if (b.mode === 'goto') { const dx = b.tx - p.x, dz = b.tz - p.z, d = Math.hypot(dx, dz); if (d < 0.2) { const f = b.onArrive; b.onArrive = null; b.mode = b.then || 'still'; b.then = null; b.wait = 0.5 + rnd(); if (f) f(b); } else { vx = dx / d; vz = dz / d; } }
      if (b.mode !== 'goto' && b.mode !== 'still') for (const o of birds) if (o !== b) { const dx = p.x - o.obj.position.x, dz = p.z - o.obj.position.z, d = Math.hypot(dx, dz); if (d < b.size && d > 0.001) { p.x += dx / d * dt * 1.2; p.z += dz / d * dt * 1.2; } }
      const moving = vx !== 0 || vz !== 0;
      if (moving) { p.x += vx * sp * dt; p.z += vz * sp * dt; b.obj.rotation.y += angleTo(b.obj.rotation.y, Math.atan2(vx, vz)) * Math.min(1, dt * 9); b.ph += dt * (5 + sp * 4); }
      else if (b.face !== undefined && b.mode === 'follow') b.obj.rotation.y += angleTo(b.obj.rotation.y, b.face) * Math.min(1, dt * 5);
      if (b.mode === 'wander' || b.mode === 'herd') { p.x = Math.max(b.rect[0], Math.min(b.rect[2], p.x)); p.z = Math.max(b.rect[1], Math.min(b.rect[3], p.z)); }
      if (b.inner) {
        b.inner.rotation.z = moving ? Math.sin(b.ph) * 0.13 : b.inner.rotation.z * 0.8;
        const peck = !moving && b.peck && (b.mode === 'wander' || b.mode === 'herd' || b.mode === 'still') ? Math.max(0, Math.sin(t * 6 + b.ph)) * 0.55 : 0;
        b.inner.rotation.x += (peck - b.inner.rotation.x) * Math.min(1, dt * 14);
        if (b.hop > 0) b.hop = Math.max(0, b.hop - dt * 2.2);
        b.inner.position.y = (moving ? Math.abs(Math.sin(b.ph)) * 0.05 : 0) + Math.sin(b.hop * Math.PI) * 0.5;
      }
    }
  });
  return { birds, add, remove, stop };
}
