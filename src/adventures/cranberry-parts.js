// Cranberry Sauce — models and the bounce-test mini-game used by cranberry.js
import { THREE, C, box, cyl, sphere, ball, cone, group, mat, glow, torus, bake, canvasTex, seeded } from '../core/kit.js';
import * as P from '../core/props.js';
import { shell } from './cranberry-games.js';

export const RED = 0xc2182f, RED2 = 0x9d1027, RED3 = 0xe03a4a;

/** mottled leafy texture for the vine carpet */
export function carpetTex() {
  return canvasTex(256, 176, (g, w, h) => {
    const r = seeded(77); g.fillStyle = '#5f9a48'; g.fillRect(0, 0, w, h);
    const cols = ['#4f8a3e', '#6aa850', '#79b65a', '#55913f', '#86bd63', '#477f38'];
    for (let i = 0; i < 1500; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 4, 1.5 + r() * 2.5, r() * 3, 0, 6.3); g.fill(); }
  });
}

/** an InstancedMesh of n little things; returns { mesh, set(i,x,y,z,s), flush() } */
export function swarm(geo, material, n, centre, radius) {
  const mesh = new THREE.InstancedMesh(geo, material, n); const a = mesh.instanceMatrix.array;
  for (let i = 0; i < n; i++) { a[i * 16] = a[i * 16 + 5] = a[i * 16 + 10] = 0; a[i * 16 + 15] = 1; }
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const sph = new THREE.Sphere(new THREE.Vector3(centre[0], centre[1], centre[2]), radius); mesh.boundingSphere = sph; geo.boundingSphere = sph.clone();
  mesh.castShadow = false; mesh.userData.noBake = true;
  return { mesh, n, set(i, x, y, z, s) { const o = i * 16; a[o] = a[o + 5] = a[o + 10] = s; a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; }, flush() { mesh.instanceMatrix.needsUpdate = true; } };
}
// ---- round shapes that stay round on every computer (the kit makes its own curves coarser on slow machines;
// these are used only for the things the story is about, with a fixed, modest number of sides) ----
export const M = (geo, color, pos, rot, scl) => { const m = new THREE.Mesh(geo, typeof color === 'number' ? mat(color) : color); if (pos) m.position.set(pos[0], pos[1], pos[2]); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); if (scl) m.scale.set(scl[0], scl[1], scl[2]); return m; };
/** cylinder with a fixed number of sides */
export const rc = (rt, rb, h, color, pos, rot, seg = 14) => M(new THREE.CylinderGeometry(rt, rb, h, seg), color, pos, rot);
/** smooth ball / ellipsoid: rs(colour, [x,y,z], [rx,ry,rz]) */
export const rs = (color, pos, scl, seg = 12) => M(new THREE.SphereGeometry(1, seg, Math.max(5, Math.round(seg * 0.65))), color, pos, null, scl);
/** low rounded mound (open underneath): dome(rx, h, rz, colour, [x,y,z], turn) — 15 to 18 triangles */
const domeGeos = {};
export const domeGeo = (seg = 6, reach = 0.5) => domeGeos[seg + '|' + reach] || (domeGeos[seg + '|' + reach] = new THREE.SphereGeometry(1, seg, 2, 0, Math.PI * 2, 0, Math.PI * reach));
export const dome = (rx, h, rz, color, pos, ry = 0, seg = 6) => M(domeGeo(seg), color, pos, [0, ry, 0], [rx, h, rz]);
/** a wheel lying on the X axis: tyre, rim and hub cap (≈130 triangles) */
export function wheel(r, w, pos, rim = 0xd9d2c0) {
  return group([rc(r, r, w, 0x25262a, null, [0, 0, Math.PI / 2], 14), rc(r * 0.86, r * 0.86, w * 0.9, 0x2f3035, null, [0, 0, Math.PI / 2], 14), rc(r * 0.56, r * 0.56, w + 0.03, rim, null, [0, 0, Math.PI / 2], 10), rc(r * 0.18, r * 0.18, w + 0.07, 0x55585e, null, [0, 0, Math.PI / 2], 6)], pos);
}

/** floating berry: a little rounded cap (12 triangles) — only the top shows above the water */
export const berryGeo = () => { const g = new THREE.SphereGeometry(0.105, 4, 2, 0, Math.PI * 2, 0, Math.PI * 0.6); g.translate(0, -0.02, 0); return g; };
/** whole round berry (20 triangles, shaded smooth) for the few seen from all sides */
export const roundBerryGeo = (r = 0.15) => { const g = new THREE.IcosahedronGeometry(r, 0), a = g.attributes.position.clone(), v = new THREE.Vector3(); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).normalize(); a.setXYZ(i, v.x, v.y, v.z); } g.setAttribute('normal', a); return g; };
export const berryMat = () => new THREE.MeshLambertMaterial({ color: 0xffffff });
/** the natural reds of a cranberry harvest: mostly deep crimson, a few lighter and pale ones */
export const BERRY_REDS = [0xb5152b, 0x9d1027, 0xc2182f, 0xa8122a, 0xcf2a3c, 0x8a0f22, 0xd96a7c];
/** a seamless carpet of small floating berries (transparent between them), 3 m to a tile */
export function berryCarpetTex() {
  const t = canvasTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = seeded(41), cols = ['#b5152b', '#9d1027', '#c2182f', '#a8122a', '#cf2a3c', '#8a0f22', '#d96a7c', '#b5152b', '#c2182f'];
    for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h, rad = 8 + r() * 5.5, c = cols[Math.floor(r() * cols.length)];
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { if (x + ox < -20 || x + ox > w + 20 || y + oy < -20 || y + oy > h + 20) continue;
        g.fillStyle = 'rgba(60,0,10,0.35)'; g.beginPath(); g.arc(x + ox + 1.5, y + oy + 2.5, rad, 0, 6.3); g.fill();
        g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, rad, 0, 6.3); g.fill();
        g.fillStyle = 'rgba(255,235,235,0.42)'; g.beginPath(); g.ellipse(x + ox - rad * 0.3, y + oy - rad * 0.35, rad * 0.3, rad * 0.2, -0.6, 0, 6.3); g.fill(); } }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/** one loose patch of floating berries, thick in the middle and thinning out to nothing at the edge (4.4 m across) */
export function berryPatchTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = seeded(53), cols = ['#b5152b', '#9d1027', '#c2182f', '#a8122a', '#cf2a3c', '#8a0f22', '#d96a7c', '#b5152b', '#c2182f'];
    for (let i = 0; i < 3400; i++) { const x = 12 + r() * (w - 24), y = 12 + r() * (h - 24), rad = 5.2 + r() * 4, c = cols[Math.floor(r() * cols.length)];
      const d = Math.max(Math.abs(x - w / 2), Math.abs(y - h / 2)) / (w / 2), k = Math.min(1, Math.max(0, (d - 0.55) / 0.42)); if (r() < k * k * (3 - 2 * k)) continue;
      g.fillStyle = 'rgba(60,0,10,0.35)'; g.beginPath(); g.arc(x + 1, y + 2, rad, 0, 6.3); g.fill();
      g.fillStyle = c; g.beginPath(); g.arc(x, y, rad, 0, 6.3); g.fill();
      g.fillStyle = 'rgba(255,235,235,0.42)'; g.beginPath(); g.ellipse(x - rad * 0.3, y - rad * 0.35, rad * 0.3, rad * 0.2, -0.6, 0, 6.3); g.fill(); }
  });
}

/** bumblebee (one draw) */
export function bee() {
  const g = group([
    rs(0xe9b21c, [0, 0, 0], [0.15, 0.13, 0.2], 10), rs(0x2a2118, [0, 0.01, 0.2], [0.1, 0.1, 0.1], 8),
    rc(0.139, 0.139, 0.06, 0x2a2118, [0, 0, 0.02], [Math.PI / 2, 0, 0], 10), rc(0.118, 0.118, 0.05, 0x2a2118, [0, 0, -0.11], [Math.PI / 2, 0, 0], 10),
    M(new THREE.SphereGeometry(1, 7, 3), 0xf4f4f0, [0.13, 0.13, 0], [0, 0, 0.5], [0.14, 0.012, 0.08]), M(new THREE.SphereGeometry(1, 7, 3), 0xf4f4f0, [-0.13, 0.13, 0], [0, 0, -0.5], [0.14, 0.012, 0.08]),
  ]);
  g.scale.setScalar(1.5); const w = group([g]); bake(w); return w;
}

/** a big cranberry blossom cluster that turns into green berries: userData.fl / userData.be */
export function blossom() {
  const fl = new THREE.Group(), be = new THREE.Group(), st = new THREE.Group(), leafGeo = new THREE.SphereGeometry(1, 5, 3), petalGeo = new THREE.SphereGeometry(1, 4, 3);   // small parts: few triangles each
  const spots = [[0, 0, 0.75], [0.45, 0.2, 0.6], [-0.4, 0.25, 0.62], [0.2, -0.45, 0.55], [-0.25, -0.4, 0.5]];
  for (const [x, z, h] of spots) {
    st.add(cyl(0.025, 0.03, h, 0x5a8f3c, [x, h / 2, z], null, 5));
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + x; fl.add(M(petalGeo, k % 2 ? 0xffd9e6 : 0xf7a8c4, [x + Math.cos(a) * 0.1, h + 0.1, z + Math.sin(a) * 0.1], [Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7], [0.07, 0.15, 0.05])); }
    fl.add(cone(0.06, 0.22, 0xe9a23b, [x, h - 0.08, z], [Math.PI, 0, 0], 6));
    be.add(M(roundBerryGeo(0.15), 0x9ccc55, [x, h - 0.02, z]));
  }
  for (let i = 0; i < 9; i++) { const a = i * 0.7; st.add(M(leafGeo, i % 2 ? 0x4f8a3e : 0x6aa850, [Math.cos(a) * 0.55, 0.12, Math.sin(a) * 0.55], [0, -a, 0.3], [0.17, 0.035, 0.09])); }
  bake(fl); bake(be); bake(st); fl.userData.dynamic = be.userData.dynamic = true; be.visible = false;
  const g = group([st, fl, be]); g.userData.fl = fl; g.userData.be = be; return g;
}

/** a planted vine cutting with runners (one draw) */
export function sprig() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) g.add(cone(0.07, 0.42, 0x5aa845, [(i - 1) * 0.1, 0.21, (i % 2) * 0.08], [0, 0, (i - 1) * 0.25], 5));
  for (let i = 0; i < 5; i++) { const a = i * 1.257 + 0.3; g.add(box(0.07, 0.04, 1.3, 0x4f8a3e, [Math.sin(a) * 0.65, 0.05, Math.cos(a) * 0.65], [0, a, 0])); for (let k = 1; k < 4; k++) g.add(ball(0.09, 0.03, 0.06, 0x6aa850, [Math.sin(a) * k * 0.4 + Math.cos(a) * 0.08, 0.08, Math.cos(a) * k * 0.4 - Math.sin(a) * 0.08], [0, a, 0], 5)); }
  return bake(g);
}

/** the water reel ("egg beater"): walk-behind machine; userData.reel spins */
export function waterReel() {
  const g = new THREE.Group(), ORG = 0xcf7426, DK = 0x3c4148;
  g.add(box(1.42, 0.26, 1.5, ORG, [0, 0.82, 0.15])); g.add(box(1.46, 0.06, 1.54, 0x8f4f1c, [0, 0.68, 0.15]));                 // deck + its dark underside
  g.add(box(0.78, 0.4, 0.6, DK, [0, 1.15, 0.08])); g.add(box(0.82, 0.05, 0.64, 0x23262b, [0, 1.37, 0.08]));                    // engine block + cover
  g.add(rc(0.16, 0.16, 0.52, 0xa83c2b, [0, 1.52, 0.08], [0, 0, Math.PI / 2], 10));                                            // fuel tank
  g.add(rc(0.035, 0.035, 0.5, 0x2c2c2c, [0.3, 1.62, -0.12], null, 6)); g.add(rc(0.06, 0.06, 0.16, 0x2c2c2c, [0.3, 1.85, -0.12], null, 6)); // exhaust
  g.add(box(0.16, 0.3, 0.9, 0x23262b, [0.62, 0.98, 0.75], [0.1, 0, 0]));                                                     // belt guard to the reel
  for (const sx of [-1, 1]) { g.add(wheel(0.5, 0.24, [sx * 0.86, 0.5, 0], 0xd9b23a));
    g.add(box(0.08, 0.1, 1.55, ORG, [sx * 0.98, 0.72, 1.0], [0.07, 0, 0]));                                                  // arms that carry the reel
    g.add(rc(0.03, 0.03, 0.56, 0x2c2c2c, [sx * 0.19, 0.73, -0.56], [-1.07, 0, 0], 6)); g.add(rc(0.045, 0.045, 0.2, 0x17181a, [sx * 0.19, 0.845, -0.77], [-1.07, 0, 0], 8)); } // handlebars + grips: low, where the pusher's straight arms end
  g.add(rc(0.028, 0.028, 0.38, 0x2c2c2c, [0, 0.78, -0.65], [0, 0, Math.PI / 2], 6));
  bake(g);
  const reel = new THREE.Group(); reel.position.set(0, 0.62, 1.6); reel.userData.dynamic = true;
  reel.add(rc(0.06, 0.06, 2.2, 0x444a52, null, [0, 0, Math.PI / 2], 8));
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; reel.add(box(2.1, 0.05, 0.11, 0xdcae34, [0, Math.cos(a) * 0.5, Math.sin(a) * 0.5], [a, 0, 0])); }
  for (const sx of [-1, 1]) { reel.add(rc(0.53, 0.53, 0.05, 0xb9442f, [sx * 1.07, 0, 0], [0, 0, Math.PI / 2], 14)); reel.add(rc(0.14, 0.14, 0.09, 0x444a52, [sx * 1.07, 0, 0], [0, 0, Math.PI / 2], 8)); }
  bake(reel); g.add(reel); g.userData.reel = reel; return g;
}

/** the ice sander: a small open tractor pulling a sand spreader. The driver sits in the open seat (userData.seat), legs straight out on the deck, arms forward ('carry' pose) to the wheel. */
export function sandBuggy() {
  const g = new THREE.Group(), ORG = 0xc9682a, DK = 0x33363b, ST = 0x76828c;
  g.add(box(0.86, 0.2, 2.5, DK, [0, 0.7, 0.1]));                                                                 // frame
  g.add(box(0.84, 0.5, 1.05, ORG, [0, 1.05, 0.85])); g.add(box(0.8, 0.1, 0.95, 0xb55a22, [0, 1.33, 0.83]));        // hood
  g.add(box(0.7, 0.36, 0.05, 0x23262b, [0, 1.02, 1.39])); for (const sx of [-1, 1]) g.add(rc(0.07, 0.07, 0.05, 0xf4e7b0, [sx * 0.25, 1.17, 1.41], [Math.PI / 2, 0, 0], 8)); // grille + lamps
  g.add(rc(0.035, 0.035, 0.6, 0x2c2c2c, [0.28, 1.65, 0.95], null, 6));                                           // exhaust
  g.add(box(0.9, 0.34, 0.75, DK, [0, 0.99, -0.25]));                                                             // deck in front of the seat: the driver's straight legs rest on it
  g.add(box(0.56, 0.1, 0.5, 0x2b2b2e, [0, 1.16, -0.55])); g.add(box(0.56, 0.5, 0.1, 0x2b2b2e, [0, 1.43, -0.82], [-0.12, 0, 0])); g.add(box(0.12, 0.36, 0.4, DK, [0, 0.95, -0.55])); // seat
  g.add(rc(0.025, 0.025, 0.74, 0x2c2c2c, [0, 1.23, 0.11], [-0.75, 0, 0], 6));                                    // steering column
  { const sw = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 5, 12), mat(0x1d1d1f)); sw.position.set(0, 1.5, -0.14); sw.rotation.x = Math.PI / 2 - 0.75; g.add(sw); }   // the wheel sits where the driver's forward-pointing hands are
  for (const sx of [-1, 1]) { g.add(wheel(0.62, 0.36, [sx * 0.72, 0.62, -0.55], 0xd9b23a)); g.add(wheel(0.38, 0.24, [sx * 0.6, 0.38, 1.0], 0xd9b23a));
    g.add(box(0.44, 0.06, 1.0, ORG, [sx * 0.72, 1.3, -0.55])); g.add(box(0.44, 0.3, 0.06, ORG, [sx * 0.72, 1.16, -1.06])); }   // rear mudguards
  // the spreader behind: a hopper heaped with sand, two small wheels, the spinning plate that flings the sand
  g.add(box(0.08, 0.08, 0.8, DK, [0, 0.62, -1.45]));
  { const hop = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.5, 0.75, 4, 1, true), mat(ST, { side: 'double' })); hop.rotation.y = Math.PI / 4; hop.position.set(0, 1.08, -2.2); g.add(hop); }
  g.add(box(1.46, 0.06, 1.46, 0x5f6a73, [0, 1.46, -2.2])); g.add(dome(0.64, 0.32, 0.64, 0xdcc48e, [0, 1.46, -2.2], 0, 8)); g.add(box(0.7, 0.1, 0.7, 0x5f6a73, [0, 0.68, -2.2]));
  for (const sx of [-1, 1]) g.add(wheel(0.3, 0.2, [sx * 0.62, 0.3, -2.2], 0x8a949e));
  g.add(rc(0.46, 0.46, 0.04, 0x5f6a73, [0, 0.5, -2.85], null, 12)); g.add(rc(0.04, 0.04, 0.3, DK, [0, 0.62, -2.85], null, 6)); g.add(box(0.1, 0.08, 0.5, DK, [0, 0.7, -2.6]));
  bake(g); g.userData.seat = [0, 0.83, -0.52]; return g;
}

/** the walk-behind berry picker of the dry harvest (one draw): add it to a person; its two handles end at that person's hands when the arms point forward */
export function pickerCart() {
  const g = group([box(1.1, 0.5, 0.8, C.red, [0, 0.5, 1.1]), cyl(0.3, 0.3, 1.0, 0x444444, [0, 0.32, 1.55], [0, 0, Math.PI / 2], 8), ball(0.35, 0.2, 0.25, RED, [0, 0.8, 1.1])]);
  for (const sx of [-1, 1]) g.add(box(0.05, 0.05, 0.56, 0x333333, [sx * 0.234, 0.87, 0.65], [0.62, 0, 0]));
  return bake(g);
}

/** helicopter; userData.rotor / userData.tail spin */
export function helicopter() {
  const g = new THREE.Group(), RD = 0xc23a2e, WH = 0xf1efe8, DK = 0x3a3d42;
  g.add(rs(RD, [0, 0, 0], [1.08, 0.95, 1.7], 14));                                                    // cabin
  g.add(rs(0x9fc6d8, [0, 0.14, 0.82], [0.92, 0.7, 1.02], 12));                                        // bubble canopy
  g.add(rs(WH, [0, 0.62, -0.35], [0.62, 0.45, 1.15], 10));                                            // engine cowling
  g.add(box(0.06, 0.5, 1.0, RD, [0, 0.45, 1.05], [0.5, 0, 0]));                                       // canopy centre post
  g.add(rc(0.1, 0.3, 3.3, RD, [0, 0.25, -2.85], [Math.PI / 2, 0, 0], 8));                             // tail boom
  g.add(box(0.08, 1.05, 0.55, WH, [0, 0.72, -4.3], [-0.35, 0, 0])); g.add(box(0.08, 0.45, 0.4, WH, [0, -0.05, -4.25], [0.4, 0, 0])); g.add(box(1.3, 0.05, 0.36, WH, [0, 0.3, -3.85]));  // fins + stabiliser
  g.add(rc(0.08, 0.1, 0.55, DK, [0, 1.15, 0], null, 6));                                              // rotor mast
  for (const sx of [-1, 1]) { g.add(rc(0.05, 0.05, 3.0, DK, [sx * 0.85, -1.25, 0.1], [Math.PI / 2, 0, 0], 6)); g.add(rc(0.05, 0.05, 0.18, DK, [sx * 0.85, -1.2, 1.62], [Math.PI / 2 - 0.6, 0, 0], 6));
    for (const z of [0.75, -0.55]) g.add(rc(0.035, 0.035, 0.62, DK, [sx * 0.74, -0.98, z], [0, 0, sx * 0.36], 5)); }            // skids + struts
  g.add(rc(0.06, 0.06, 0.22, DK, [0, -1.0, 0], null, 6));                                             // cargo hook
  bake(g);
  const rotor = group([box(9, 0.05, 0.3, 0x2c2c2e), box(0.3, 0.05, 9, 0x2c2c2e), rc(0.2, 0.2, 0.14, 0x2c2c2e, null, null, 8)], [0, 1.45, 0]); bake(rotor); rotor.userData.dynamic = true; g.add(rotor);
  const tail = group([box(0.05, 1.3, 0.14, 0x2c2c2e), box(0.05, 0.14, 1.3, 0x2c2c2e)], [0.16, 0.4, -4.3]); bake(tail); tail.userData.dynamic = true; g.add(tail);
  g.userData.rotor = rotor; g.userData.tail = tail; return g;
}

/** cut-open berry diagram: four air pockets */
export function drawCutBerry(g, w, h) {
  g.fillStyle = '#fff8e8'; g.beginPath(); g.roundRect(0, 0, w, h, w * 0.08); g.fill(); g.strokeStyle = '#6e4a28'; g.lineWidth = w * 0.035; g.stroke();
  const cx = w / 2, cy = h * 0.43, R = w * 0.33;
  g.fillStyle = '#b0122e'; g.beginPath(); g.arc(cx, cy, R, 0, 6.3); g.fill();
  g.fillStyle = '#f2b8b0'; g.beginPath(); g.arc(cx, cy, R * 0.86, 0, 6.3); g.fill();
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, x = cx + Math.cos(a) * R * 0.42, y = cy + Math.sin(a) * R * 0.42;
    g.fillStyle = '#fffdf6'; g.strokeStyle = '#c95a60'; g.lineWidth = w * 0.018; g.beginPath(); g.ellipse(x, y, R * 0.3, R * 0.24, a, 0, 6.3); g.fill(); g.stroke();
    g.fillStyle = '#b98a4a'; g.beginPath(); g.ellipse(x - Math.cos(a) * R * 0.1, y - Math.sin(a) * R * 0.1, R * 0.05, R * 0.08, a, 0, 6.3); g.fill(); }
  g.fillStyle = '#4a2c17'; g.font = '800 ' + (h * 0.13) + 'px "Baloo 2","Nunito","Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('4 air pockets', cx, h * 0.88);
}

/** products made from cranberries (each one draw), about 0.6 m tall so they read from afar */
export function product(kind) {
  const g = new THREE.Group(), CR = 0xfff3d6;
  if (kind === 'juice') { const pts = [[0, 0], [0.16, 0], [0.175, 0.03], [0.175, 0.4], [0.15, 0.48], [0.075, 0.58], [0.062, 0.62], [0.062, 0.68]];
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts.map(q => new THREE.Vector2(q[0], q[1])), 12), mat(0xa8122a, { side: 'double' })));
    g.add(rc(0.075, 0.075, 0.07, 0xf4f1ea, [0, 0.71, 0], null, 10)); g.add(rc(0.18, 0.18, 0.2, CR, [0, 0.23, 0], null, 12)); g.add(rs(0xc2182f, [0, 0.23, 0.165], [0.055, 0.055, 0.03], 8)); }
  else if (kind === 'dried') { g.add(box(0.42, 0.5, 0.13, 0x6d3a7a, [0, 0.27, 0])); g.add(box(0.42, 0.07, 0.03, 0x5a2f66, [0, 0.555, 0])); g.add(box(0.3, 0.2, 0.02, CR, [0, 0.3, 0.066])); g.add(box(0.44, 0.06, 0.15, 0x5a2f66, [0, 0.03, 0]));
    for (let i = 0; i < 5; i++) g.add(rs(0x8c1024, [-0.09 + (i % 3) * 0.09, 0.27 + (i > 2 ? 0.07 : 0), 0.078], [0.034, 0.028, 0.014], 6)); }
  else if (kind === 'jam') { g.add(rc(0.19, 0.175, 0.34, 0x8f1026, [0, 0.17, 0], null, 12)); g.add(rc(0.15, 0.19, 0.05, 0x8f1026, [0, 0.365, 0], null, 12)); g.add(rc(0.165, 0.165, 0.07, 0xd9b23a, [0, 0.42, 0], null, 12)); g.add(rc(0.195, 0.182, 0.15, CR, [0, 0.17, 0], null, 12)); g.add(rs(0xc2182f, [0, 0.17, 0.185], [0.05, 0.05, 0.025], 8)); }
  else if (kind === 'can') { g.add(rc(0.185, 0.185, 0.5, 0xbfc3c6, [0, 0.25, 0], null, 14)); g.add(rc(0.19, 0.19, 0.36, 0xa8122a, [0, 0.25, 0], null, 14)); g.add(rc(0.193, 0.193, 0.12, CR, [0, 0.25, 0], null, 14));
    for (const y of [0.012, 0.488]) g.add(rc(0.195, 0.195, 0.024, 0x9aa0a4, [0, y, 0], null, 14)); }
  else { g.add(rs(0xf1f1ee, [0, 0.26, 0], [0.3, 0.26, 0.19], 10)); for (let i = 0; i < 9; i++) g.add(rs(i % 3 ? 0xb5152b : 0xcf2a3c, [-0.16 + (i % 3) * 0.16, 0.14 + Math.floor(i / 3) * 0.13, 0.15 - Math.abs(i % 3 - 1) * 0.05], [0.068, 0.068, 0.068], 7)); g.add(box(0.3, 0.07, 0.1, 0xa8122a, [0, 0.52, 0])); }
  return bake(g);
}

/** the fluted jelly: lathe dome */
export function jelly(color = 0xa8122a) {
  const pts = [[0, 0], [0.34, 0], [0.36, 0.06], [0.33, 0.1], [0.34, 0.2], [0.3, 0.24], [0.3, 0.34], [0.22, 0.4], [0.12, 0.42], [0, 0.42]];
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), 16), new THREE.MeshLambertMaterial({ color, emissive: 0x3a0008 }));
  return m;
}

/**
 * Bounce test: each berry drops on the board. Firm ones bounce high, soft ones flop. The player sorts 6 berries.
 * Resolves when done. Uses ctx game time only.
 */
export function bounceGame(ctx) {
  return new Promise((done) => {
    const { p, cv, g } = shell(ctx, '🔴 Bounce test', null, [['👎 Soft', '#d8c7b4', 'soft'], ['👍 Bouncy!', '#ffd84a', 'firm']], '#e8f3f7', { big: true });
    const W = 560, H = 300;
    const order = [true, false, true, true, false, true]; let idx = 0, t = 0, y = 0, vy = 0, x = 200, squash = 0, bounces = 0, phase = 'drop', fly = null, shake = 0, goodN = 0, softN = 0, wrongT = 0, ended = false;
    const floorY = 222, r = 20;
    const start = () => { t = 0; y = 40; vy = 0; x = 200; bounces = 0; phase = 'drop'; squash = 0; };
    start();
    const firm = () => order[idx];
    const stop = ctx.onUpdate((dt) => {
      if (ended) return; dt = Math.min(dt, 0.05); t += dt; shake = Math.max(0, shake - dt * 3); wrongT = Math.max(0, wrongT - dt);
      if (phase === 'drop') {
        vy += 900 * dt; y += vy * dt; squash = Math.max(0, squash - dt * 6);
        if (y > floorY - r) { y = floorY - r; const e = firm() ? 0.8 : 0.22; if (Math.abs(vy) > 60) { ctx.audio.play(firm() ? 'bounce' : 'thud'); squash = firm() ? 0.25 : 0.6; } vy = -Math.abs(vy) * e; bounces++; if (Math.abs(vy) < 40) { vy = 0; if (t > 2.6) { t = 0; y = 40; } } }
      } else if (phase === 'fly') { fly.t += dt / 0.5; const k = Math.min(1, fly.t); x = fly.x0 + (fly.x1 - fly.x0) * k; y = fly.y0 + (fly.y1 - fly.y0) * k - Math.sin(k * Math.PI) * 90; if (k >= 1) { ctx.audio.play('pop'); if (fly.firm) goodN++; else softN++; idx++; p.el.dataset.sorted = idx; if (idx >= order.length) { phase = 'end'; t = 0; ctx.audio.play('success'); } else start(); } }
      else if (phase === 'end' && t > 1.1) { ended = true; stop(); p.close(); done(); return; }
      draw();
    });
    const berry = (bx, by, f, sq = 0) => { g.save(); g.translate(bx, by + r * sq * 0.5); g.scale(1 + sq * 0.5, 1 - sq * 0.5); g.fillStyle = f ? '#d3193a' : '#7d2238'; g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.fill(); if (f) { g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(-7, -8, 5, 3.4, -0.6, 0, 6.3); g.fill(); } else { g.strokeStyle = '#561526'; g.lineWidth = 2.5; g.beginPath(); g.arc(-5, 2, 7, 0.3, 2.2); g.stroke(); g.beginPath(); g.arc(7, -4, 5, 3.6, 5.4); g.stroke(); } g.restore(); };
    const bin = (bx, col, n, f, icon) => { g.fillStyle = col; g.beginPath(); g.roundRect(bx - 62, 190, 124, 84, 12); g.fill(); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(bx - 62, 190, 124, 10); for (let i = 0; i < n; i++) berry(bx - 36 + (i % 4) * 24, 252 - Math.floor(i / 4) * 22, f); g.fillStyle = '#000'; g.font = '30px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(icon, bx, 180); };
    function draw() {
      g.clearRect(0, 0, W, H); g.fillStyle = '#e8f3f7'; g.fillRect(0, 0, W, H);
      // chute
      g.fillStyle = '#8a949e'; g.beginPath(); g.moveTo(150, 0); g.lineTo(250, 0); g.lineTo(225, 26); g.lineTo(175, 26); g.closePath(); g.fill();
      // board
      g.fillStyle = '#a8743f'; g.beginPath(); g.roundRect(110, floorY, 180, 16, 6); g.fill(); g.fillStyle = '#6e4a28'; g.fillRect(130, floorY + 16, 14, 62); g.fillRect(256, floorY + 16, 14, 62);
      // height marks
      g.strokeStyle = 'rgba(74,44,23,.25)'; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(112, 110); g.lineTo(288, 110); g.stroke(); g.setLineDash([]);
      bin(60, '#d8c7b4', softN, false, '👎'); bin(470, '#ffd84a', goodN, true, '👍');
      g.fillStyle = 'rgba(74,44,23,.18)'; if (phase === 'drop') { const sh = 1 - Math.min(1, (floorY - r - y) / 200) * 0.6; g.beginPath(); g.ellipse(x, floorY + 1, r * sh, 4 * sh, 0, 0, 6.3); g.fill(); }
      if (phase !== 'end') berry(x + (shake > 0 ? Math.sin(t * 70) * 6 * shake : 0), y, phase === 'fly' ? fly.firm : firm(), phase === 'drop' ? squash : 0);
      // progress pips
      for (let i = 0; i < order.length; i++) { g.fillStyle = i < idx ? '#d3193a' : 'rgba(74,44,23,.2)'; g.beginPath(); g.arc(W - 130 + i * 20, 22, 6.5, 0, 6.3); g.fill(); }
    }
    p.el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      if (phase !== 'drop' || bounces < 1) return;
      const say = b.dataset.b === 'firm';
      if (say !== firm()) { shake = 1; ctx.audio.play('error'); p.el.dataset.wrong = 1; return; }
      ctx.audio.play('click'); phase = 'fly'; fly = { t: 0, x0: x, y0: y, x1: say ? 470 : 60, y1: 235, firm: say };
    }));
    draw();
  });
}
