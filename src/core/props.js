// props.js — ready-made scenery built from kit primitives. Each returns a THREE.Group whose origin is
// on the ground at its centre, facing +Z. Add them to a scenery group and bake it (ctx.addStatic).
const shade = (c, f) => new THREE.Color(c).multiplyScalar(f).getHex();
import { THREE, C, mat, glow, box, cyl, cone, sphere, ball, torus, plane, disc, lathe, group, sign, emojiSprite, seeded, pick, rand, bake, lowDetail } from './kit.js';
// Every builder below returns an already-baked group (1–2 draw calls). Put them inside a scenery group and
// ctx.addStatic() it to merge everything into one; or ctx.add() them on their own if they need to move.

/** tree({h=4, kind:'round'|'pine'|'autumn'|'fruit', color, fruit:colour}) */
function tree_(o = {}) {
  const h = o.h || 4, g = new THREE.Group(), kind = o.kind || 'round', tc = o.trunk ?? 0x6a4a30;
  const r = seeded(Math.round(h * 977) + (kind.length * 31));
  if (kind === 'pine') {
    g.add(cyl(h * 0.02, h * 0.05, h * 0.95, tc, [0, h * 0.47, 0], null, 6));
    const c = o.color ?? 0x355f3c; for (let i = 0; i < 4; i++) { const k = i / 3; g.add(cone(h * (0.3 - k * 0.2), h * 0.34, i % 2 ? c : 0x3f6e45, [0, h * (0.36 + k * 0.5), 0], [0, i, 0], 8)); }
  } else {
    // a tapering trunk with two boughs, and a crown of several soft clumps in slightly different greens
    g.add(cyl(h * 0.035, h * 0.065, h * 0.52, tc, [0, h * 0.26, 0], null, 7));
    if (!lowDetail()) { g.add(cyl(h * 0.02, h * 0.032, h * 0.26, tc, [h * 0.07, h * 0.54, 0], [0, 0, -0.6], 5)); g.add(cyl(h * 0.018, h * 0.03, h * 0.24, tc, [-h * 0.06, h * 0.55, h * 0.02], [0.2, 0, 0.55], 5)); }
    const base = new THREE.Color(o.color ?? (kind === 'autumn' ? pick(C.autumn) : 0x4f9440));
    const clumps = [[0, 0.74, 0, 0.25], [0.18, 0.64, 0.05, 0.18], [-0.17, 0.66, -0.06, 0.19], [0.04, 0.62, -0.17, 0.17], [-0.03, 0.6, 0.17, 0.17], [0.08, 0.84, 0.02, 0.15]];
    for (const [x, y, z, rad] of (lowDetail() ? clumps.slice(0, 4) : clumps)) { const c = base.clone().multiplyScalar(0.86 + r() * 0.28).getHex(); g.add(ball(h * rad * (0.95 + r() * 0.15), h * rad * 0.85, h * rad * (0.95 + r() * 0.15), c, [h * x, h * y, h * z], null, 8)); }
    if (o.fruit !== undefined) for (let i = 0; i < 8; i++) { const a = i * 2.4, rr = h * 0.27; g.add(sphere(h * 0.028, o.fruit, [Math.cos(a) * rr, h * (0.62 + 0.1 * Math.sin(i * 1.7)), Math.sin(a) * rr], 5)); }
  }
  return g;
}
function bush_(o = {}) { const s = o.s || 1, c = o.color ?? C.grassDark, g = new THREE.Group(); g.add(sphere(0.5 * s, c, [0, 0.35 * s, 0], 6)); g.add(sphere(0.35 * s, c, [0.4 * s, 0.28 * s, 0.1 * s], 6)); g.add(sphere(0.3 * s, c, [-0.38 * s, 0.25 * s, -0.1 * s], 6)); return g; }
function rock_(o = {}) { const s = o.s || 1; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 * s, 0), mat(o.color ?? C.stone)); m.position.y = 0.3 * s; m.scale.y = 0.7; m.rotation.y = o.ry ?? Math.random() * 6; m.castShadow = true; return group([m]); }
function flower_(o = {}) { const g = new THREE.Group(); g.add(cyl(0.015, 0.015, 0.3, C.green, [0, 0.15, 0], null, 4)); g.add(sphere(0.07, o.color ?? pick([C.pink, C.yellow, C.white, C.red, C.purple]), [0, 0.32, 0], 5)); return g; }
function cloud_(o = {}) { const s = o.s || 1, g = new THREE.Group(), c = glow(0xffffff); for (const [x, y, z, r] of [[0, 0, 0, 1.2], [1.2, -0.1, 0.2, 0.9], [-1.2, -0.15, 0, 0.85], [0.4, 0.5, -0.2, 0.8]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(r * s, 7, 5), c); m.position.set(x * s, y * s, z * s); m.scale.y = 0.7; g.add(m); } return g; }
function mountain_(o = {}) { const h = o.h || 20, g = new THREE.Group(); g.add(cone(h * 0.9, h, o.color ?? 0x7d8fa3, [0, h / 2, 0], null, 6)); if (o.snow !== false) g.add(cone(h * 0.3, h * 0.34, C.white, [0, h * 0.835, 0], null, 6)); return g; }

/** fence(length, {h=1, color, rails=2}) along X, centred. */
function fence_(len, o = {}) {
  const h = o.h || 1, c = o.color ?? C.woodLight, g = new THREE.Group(), n = Math.max(2, Math.round(len / 2) + 1);
  for (let i = 0; i < n; i++) g.add(box(0.12, h, 0.12, c, [-len / 2 + i * len / (n - 1), h / 2, 0]));
  for (let r = 0; r < (o.rails || 2); r++) g.add(box(len, 0.08, 0.06, c, [0, h * (0.35 + r * 0.4), 0]));
  return g;
}
/**
 * building({w=8,h=4,d=6,color,roof:'gable'|'flat'|'barn'|'shed',roofColor,door:true|false,doorColor,windows:n,sign:'text',trim})
 * Front (door, sign) faces +Z. Solid: add a collider yourself (ctx.collideBox).
 */
function building_(o = {}) {
  const w = o.w || 8, h = o.h || 4, d = o.d || 6, col = o.color ?? C.cream, rc = o.roofColor ?? 0x8a4b3a, g = new THREE.Group();
  g.add(box(w, h, d, col, [0, h / 2, 0]));
  const roof = o.roof || 'gable';
  if (roof === 'flat') g.add(box(w + 0.4, 0.3, d + 0.4, rc, [0, h + 0.15, 0]));
  else if (roof === 'shed') g.add(box(w + 0.6, 0.25, d + 0.8, rc, [0, h + 0.45, 0], [0.14, 0, 0]));
  else {
    const rh = roof === 'barn' ? w * 0.32 : w * 0.26;
    const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.3, 0);
    if (roof === 'barn') { shape.lineTo(-w * 0.32, rh * 0.62); shape.lineTo(0, rh); shape.lineTo(w * 0.32, rh * 0.62); } else shape.lineTo(0, rh);
    shape.lineTo(w / 2 + 0.3, 0); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false }); geo.translate(0, h, -d / 2 - 0.3);
    const m = new THREE.Mesh(geo, mat(rc)); m.castShadow = true; g.add(m);
    const gable = new THREE.ExtrudeGeometry(shape, { depth: d - 0.02, bevelEnabled: false }); gable.scale(0.94, 0.9, 1); gable.translate(0, h, -d / 2 + 0.01);
    g.add(new THREE.Mesh(gable, mat(col)));
  }
  const z = d / 2 + 0.03;
  if (o.door !== false) { const dw = o.doorW || 1.2, dh = Math.min(o.doorH || 2.2, h - 0.3); g.add(box(dw, dh, 0.08, o.doorColor ?? C.woodDark, [o.doorX || 0, dh / 2, z])); g.add(sphere(0.06, C.gold, [(o.doorX || 0) + dw * 0.32, dh * 0.48, z + 0.06], 5)); }
  const nw = o.windows ?? 2;
  for (let i = 0; i < nw; i++) { const x = (i - (nw - 1) / 2) * (w / (nw + 0.6)); if (o.door !== false && Math.abs(x - (o.doorX || 0)) < 1.2) continue; g.add(box(1, 1, 0.06, C.white, [x, h * 0.58, z])); g.add(box(0.84, 0.84, 0.08, o.windowColor ?? 0x9fd6f2, [x, h * 0.58, z])); }
  if (o.trim !== undefined) g.add(box(w + 0.06, 0.25, d + 0.06, o.trim, [0, 0.125, 0]));
  if (o.sign) { const s = sign(o.sign, o.signH || 0.8, { bg: o.signBg || '#fff8e8', fg: o.signFg || '#4a2c17', border: o.signBorder || '#4a2c17' }, [0, Math.min(h - 0.55, (o.doorH || 2.2) + 0.75), z + 0.06]); g.add(s); }
  return g;
}
export const barn = (o = {}) => bake(building_(Object.assign({ w: 9, h: 4.5, d: 8, color: C.barn, roof: 'barn', roofColor: 0x6b3a2a, doorColor: C.white, doorW: 2.4, doorH: 3, windows: 0, trim: C.white }, o)));
function silo_(o = {}) { const h = o.h || 8, r = o.r || 1.6, g = new THREE.Group(); g.add(cyl(r, r, h, o.color ?? C.grayLight, [0, h / 2, 0], null, 12)); g.add(sphere(r, o.cap ?? C.metal, [0, h, 0], 10)); return g; }
/** truck({color, kind:'box'|'flatbed'|'reefer'|'tanker'|'pickup', cargoColor, logo:'🦃'}) — ~6.5 m long, facing +Z. userData.bed = Group where cargo goes; userData.seat = [x,y,z]. */
function truck_(o = {}) {
  const col = o.color ?? C.red, kind = o.kind || 'box', g = new THREE.Group(), L = kind === 'pickup' ? 4.6 : 6.4;
  g.add(box(2.1, 0.3, L, 0x3a3a3a, [0, 0.65, 0]));
  const cz = L / 2 - 0.9;
  g.add(box(2.1, 1.5, 1.7, col, [0, 1.5, cz])); g.add(box(1.9, 0.65, 0.06, 0x9fd6f2, [0, 1.85, cz + 0.86])); g.add(box(0.06, 0.55, 0.9, 0x9fd6f2, [1.06, 1.85, cz])); g.add(box(0.06, 0.55, 0.9, 0x9fd6f2, [-1.06, 1.85, cz]));
  g.add(box(2.15, 0.25, 0.2, C.grayLight, [0, 0.62, L / 2 + 0.05])); g.add(sphere(0.13, glow(0xfff2a8), [0.75, 1.0, L / 2 - 0.04], 6)); g.add(sphere(0.13, glow(0xfff2a8), [-0.75, 1.0, L / 2 - 0.04], 6));
  const bl = L - 2.0, bz = -L / 2 + bl / 2;
  const bed = new THREE.Group(); bed.position.set(0, 0.82, bz); bed.userData.keep = true; bed.userData.dynamic = true; g.add(bed);
  if (kind === 'box' || kind === 'reefer') {
    g.add(box(2.3, 2.3, bl, o.cargoColor ?? C.white, [0, 1.97, bz]));
    if (kind === 'reefer') g.add(box(1.2, 0.7, 0.4, C.grayLight, [0, 2.6, bz + bl / 2 + 0.1]));
    if (o.logo) { for (const sx of [-1, 1]) { const s = sign(o.logo, 1.2, { bg: null }, [sx * 1.16, 2.0, bz], [0, sx * Math.PI / 2, 0]); g.add(s); } }
  } else if (kind === 'tanker') { g.add(cyl(1.1, 1.1, bl, o.cargoColor ?? C.metal, [0, 1.95, bz], [Math.PI / 2, 0, 0], 12)); }
  else { g.add(box(2.3, 0.14, bl, C.wood, [0, 0.86, bz])); for (const sx of [-1, 1]) g.add(box(0.08, 0.5, bl, col, [sx * 1.12, 1.15, bz])); g.add(box(2.3, 0.5, 0.08, col, [0, 1.15, bz - bl / 2])); bed.position.y = 0.95; }
  for (const z of [L / 2 - 1.0, -L / 2 + 1.0]) for (const sx of [-1, 1]) { g.add(cyl(0.45, 0.45, 0.35, 0x222222, [sx * 1.0, 0.45, z], [0, 0, Math.PI / 2], 10)); g.add(cyl(0.2, 0.2, 0.37, C.grayLight, [sx * 1.0, 0.45, z], [0, 0, Math.PI / 2], 8)); }
  g.add(box(1.5, 0.55, 0.06, 0x2b2b2b, [0, 1.12, L / 2 - 0.03])); for (let i = 0; i < 4; i++) g.add(box(1.4, 0.04, 0.07, C.grayLight, [0, 0.93 + i * 0.13, L / 2 - 0.02]));
  for (const sx of [-1, 1]) { g.add(box(0.08, 0.3, 0.18, 0x2b2b2b, [sx * 1.2, 1.95, cz + 0.75])); g.add(box(0.3, 0.12, 1.1, 0x2b2b2b, [sx * 1.0, 0.98, L / 2 - 1.0])); g.add(box(0.3, 0.1, 1.1, 0x2b2b2b, [sx * 1.0, 0.98, -L / 2 + 1.0])); g.add(box(0.5, 0.5, 0.04, 0x222222, [sx * 0.95, 0.55, -L / 2 + 0.38])); }
  g.add(box(2.0, 0.06, 1.6, shade(col, 0.8), [0, 2.27, cz])); g.add(cyl(0.05, 0.05, 0.9, 0x555555, [0.9, 2.3, cz - 0.95], null, 6));
  g.userData.bed = bed; g.userData.seat = [0, 0.75, cz]; g.userData.length = L;
  return g;
}
function tractor_(o = {}) {
  const col = o.color ?? C.green, g = new THREE.Group();
  g.add(box(1.1, 0.8, 2.2, col, [0, 1.05, 0.3])); g.add(box(1.3, 1.1, 1.1, col, [0, 1.5, -0.75])); g.add(box(1.2, 0.6, 0.9, 0x9fd6f2, [0, 1.95, -0.75])); g.add(box(1.4, 0.1, 1.2, 0x333333, [0, 2.3, -0.75]));
  g.add(cyl(0.06, 0.06, 0.7, 0x333333, [0.3, 1.8, 0.9], null, 5));
  for (const sx of [-1, 1]) { g.add(cyl(0.8, 0.8, 0.4, 0x222222, [sx * 0.8, 0.8, -0.7], [0, 0, Math.PI / 2], 12)); g.add(cyl(0.35, 0.35, 0.42, C.yellow, [sx * 0.8, 0.8, -0.7], [0, 0, Math.PI / 2], 8)); g.add(cyl(0.45, 0.45, 0.3, 0x222222, [sx * 0.7, 0.45, 1.0], [0, 0, Math.PI / 2], 10)); g.add(cyl(0.2, 0.2, 0.32, C.yellow, [sx * 0.7, 0.45, 1.0], [0, 0, Math.PI / 2], 8)); }
  for (const sx of [-1, 1]) { g.add(box(0.45, 0.08, 1.3, col, [sx * 0.8, 1.66, -0.7])); g.add(sphere(0.08, glow(0xfff2a8), [sx * 0.35, 1.25, 1.42], 6)); }
  g.add(box(0.9, 0.6, 0.06, 0x2b2b2b, [0, 1.05, 1.41])); g.add(torus(0.16, 0.025, 0x222222, [0, 1.75, -0.35], [1.0, 0, 0], 10)); g.add(box(0.5, 0.12, 0.45, 0x2b2b2b, [0, 1.2, -0.9]));
  g.userData.seat = [0, 1.0, -0.75];
  return g;
}
function crate_(o = {}) { const s = o.s || 0.7, g = new THREE.Group(); g.add(box(s, s * 0.6, s, o.color ?? C.woodLight, [0, s * 0.3, 0])); g.add(box(s * 1.04, s * 0.1, s * 1.04, C.wood, [0, s * 0.56, 0])); g.add(box(s * 1.04, s * 0.1, s * 1.04, C.wood, [0, s * 0.08, 0])); if (o.fill !== undefined) for (let i = 0; i < 5; i++) g.add(sphere(s * 0.16, o.fill, [(i % 3 - 1) * s * 0.25, s * 0.62, ((i * 7) % 3 - 1) * s * 0.25], 5)); return g; }
function sack_(o = {}) { const g = new THREE.Group(); g.add(ball(0.32, 0.42, 0.25, o.color ?? 0xd8c39a, [0, 0.4, 0])); g.add(cyl(0.1, 0.14, 0.12, o.color ?? 0xd8c39a, [0, 0.84, 0], null, 6)); return g; }
function barrel_(o = {}) { const g = new THREE.Group(); g.add(lathe([[0.3, 0], [0.38, 0.3], [0.4, 0.5], [0.38, 0.7], [0.3, 1], [0, 1]], o.color ?? C.wood, null, 10)); g.add(cyl(0.39, 0.39, 0.05, 0x444444, [0, 0.25, 0])); g.add(cyl(0.39, 0.39, 0.05, 0x444444, [0, 0.75, 0])); return g; }
function haybale_() { const g = new THREE.Group(); g.add(cyl(0.6, 0.6, 1.1, 0xe3c15a, [0, 0.6, 0], [0, 0, Math.PI / 2], 10)); return g; }
/** signpost('🥔' or 'Farm') — a wooden post with a board. */
function signpost_(text, o = {}) { const g = new THREE.Group(), h = o.h || 2; g.add(cyl(0.07, 0.07, h, C.woodDark, [0, h / 2, 0], null, 5)); const s = sign(text, o.size || 0.7, { border: '#6e4a28' }, [0, h - 0.1, 0.09]); g.add(s); g.add(box((s.userData.width || 1) + 0.12, (o.size || 0.7) + 0.12, 0.08, C.wood, [0, h - 0.1, 0.03])); return g; }
function lampPost_(o = {}) { const g = new THREE.Group(), h = o.h || 3.2; g.add(cyl(0.06, 0.09, h, 0x333333, [0, h / 2, 0], null, 6)); g.add(sphere(0.22, glow(0xfff2b0), [0, h + 0.15, 0], 7)); return g; }
/** simple table: tableProp(w,d,h,color) */
function tableProp_(w = 2, d = 1, h = 0.9, color = C.wood) { const g = new THREE.Group(); g.add(box(w, 0.08, d, color, [0, h, 0])); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.09, h, 0.09, color, [sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1)])); return g; }
/** conveyor belt along X: conveyor(length, {h=0.9, w=0.9}) */
function conveyor_(len = 6, o = {}) { const h = o.h || 0.9, w = o.w || 0.9, g = new THREE.Group(); g.add(box(len, 0.12, w, 0x3b3b3b, [0, h, 0])); g.add(box(len, 0.2, 0.08, C.steel, [0, h, w / 2 + 0.04])); g.add(box(len, 0.2, 0.08, C.steel, [0, h, -w / 2 - 0.04])); const n = Math.max(2, Math.round(len / 2)); for (let i = 0; i <= n; i++) for (const sz of [-1, 1]) g.add(box(0.1, h, 0.1, C.steel, [-len / 2 + 0.1 + i * (len - 0.2) / n, h / 2, sz * w * 0.4])); for (const x of [-len / 2, len / 2]) g.add(cyl(0.1, 0.1, w, 0x555555, [x, h, 0], [Math.PI / 2, 0, 0], 8)); return g; }
/** ploughed field: rows of soil ridges. fieldRows(w, d, rows, {color}) rows run along Z. */
function fieldRows_(w = 12, d = 12, rows = 6, o = {}) { const g = new THREE.Group(); g.add(plane(w + 1, d + 1, o.base ?? C.soil, [0, 0.02, 0])); for (let i = 0; i < rows; i++) { const x = -w / 2 + (i + 0.5) * w / rows; g.add(box(w / rows * 0.55, 0.16, d, o.color ?? 0x7a5536, [x, 0.08, 0])); } return g; }
/** leafy crop plant. */
function cropPlant_(o = {}) { const s = o.s || 1, c = o.color ?? C.leaf, g = new THREE.Group(); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(ball(0.08 * s, 0.03 * s, 0.2 * s, c, [Math.cos(a) * 0.14 * s, 0.2 * s + 0.06, Math.sin(a) * 0.14 * s], [0.5, -a + Math.PI / 2, 0], 5)); } g.add(cyl(0.02 * s, 0.03 * s, 0.3 * s, C.green, [0, 0.15 * s, 0], null, 4)); return g; }
/** a pond / pool of water (flat, slightly transparent). Not baked. */
export function water(w, d, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(o.color ?? C.water, { opacity: o.opacity ?? 0.8 })); m.rotation.x = -Math.PI / 2; m.position.y = o.y ?? 0.05; return m; }
/** supermarket shelf unit with colourful goods. */
function shelf_(o = {}) { const w = o.w || 3, g = new THREE.Group(), r = seeded(o.seed || 5); g.add(box(w, 1.9, 0.5, C.grayLight, [0, 0.95, 0])); for (let s = 0; s < 3; s++) { g.add(box(w + 0.04, 0.05, 0.62, C.white, [0, 0.35 + s * 0.6, 0.03])); for (let i = 0; i < w / 0.32 - 1; i++) g.add(box(0.22, 0.3 + r() * 0.12, 0.2, (o.colors || [C.red, C.yellow, C.blue, C.green, C.orange, C.purple])[Math.floor(r() * 6) % (o.colors ? o.colors.length : 6)], [-w / 2 + 0.25 + i * 0.32, 0.55 + s * 0.6, 0.18])); } return g; }
/** house: cosy home with chimney. */
function house_(o = {}) { const g = building_(Object.assign({ w: 7, h: 3.4, d: 6, color: 0xf1e2c4, roofColor: 0x9c4a3a, doorColor: 0x7a3b2a, windows: 3 }, o)); g.add(box(0.7, 2, 0.7, C.brick, [(o.w || 7) * 0.28, (o.h || 3.4) + 1.2, -0.8])); return g; }
/** store front: supermarket. */
function store_(o = {}) { const w = o.w || 14, h = o.h || 5, d = o.d || 9; const g = building_(Object.assign({ w, h, d, color: 0xf2efe6, roof: 'flat', roofColor: o.accent ?? C.green, door: false, windows: 0, sign: o.sign || '🛒 MARKET', signH: 1.1 }, o)); g.add(box(w, 0.9, 0.3, o.accent ?? C.green, [0, h - 1.45, d / 2 + 0.2])); g.add(box(3, 2.5, 0.08, 0x9fd6f2, [0, 1.25, d / 2 + 0.04])); g.add(box(0.08, 2.5, 0.1, C.white, [0, 1.25, d / 2 + 0.06])); for (const sx of [-1, 1]) g.add(box(w * 0.25, 1.6, 0.08, 0x9fd6f2, [sx * w * 0.32, 1.6, d / 2 + 0.04])); return g; }
/** scatter(n, areaW, areaD, makeFn, {seed, avoid:[[x,z,r]...]}) → Group of n props placed randomly (deterministic). */
export function scatter(n, w, d, make, o = {}) { const r = seeded(o.seed || 11), g = new THREE.Group(); let tries = 0; for (let i = 0; i < n && tries < n * 20; tries++) { const x = (r() - 0.5) * w, z = (r() - 0.5) * d; if (o.avoid && o.avoid.some(a => Math.hypot(x - a[0], z - a[1]) < a[2])) continue; if (o.keep && !o.keep(x, z)) continue; const p = make(r, i); p.position.x += x; p.position.z += z; if (o.spin !== false) p.rotation.y = r() * Math.PI * 2; g.add(p); i++; } return g; }

export const tree = (...a) => bake(tree_(...a));
export const bush = (...a) => bake(bush_(...a));
export const rock = (...a) => bake(rock_(...a));
export const flower = (...a) => bake(flower_(...a));
export const cloud = (...a) => bake(cloud_(...a));
export const mountain = (...a) => bake(mountain_(...a));
export const fence = (...a) => bake(fence_(...a));
export const building = (...a) => bake(building_(...a));
export const silo = (...a) => bake(silo_(...a));
export const truck = (...a) => bake(truck_(...a));
export const tractor = (...a) => bake(tractor_(...a));
export const crate = (...a) => bake(crate_(...a));
export const sack = (...a) => bake(sack_(...a));
export const barrel = (...a) => bake(barrel_(...a));
export const haybale = (...a) => bake(haybale_(...a));
export const signpost = (...a) => bake(signpost_(...a));
export const lampPost = (...a) => bake(lampPost_(...a));
export const tableProp = (...a) => bake(tableProp_(...a));
export const conveyor = (...a) => bake(conveyor_(...a));
export const fieldRows = (...a) => bake(fieldRows_(...a));
export const cropPlant = (...a) => bake(cropPlant_(...a));
export const shelf = (...a) => bake(shelf_(...a));
export const house = (...a) => bake(house_(...a));
export const store = (...a) => bake(store_(...a));
