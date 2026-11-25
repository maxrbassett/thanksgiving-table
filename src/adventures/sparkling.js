// Sparkling Grape Juice — vineyard → four seasons → harvest → juice plant → bottling line → store → home (+ optional wine cellar).
// Source: "Sparkling Celebratory Drinks" (parts 1–7 and the aside on aging wines).
import { THREE, C, box, cyl, cone, sphere, ball, torus, group, bake, mat, glow, sign, picture, plane, disc, seeded, clamp, lerp, grain, lowDetail } from '../core/kit.js';
import * as P from '../core/props.js';
import { sortGame, pourGame, payGame } from './sparkling-games.js';
import { COL, berry, leaf, lat, bunch, youngVine, addTrunk, addCanopy, caneTuft, shoot, starling, lug, harvester, pipe, bottle, bottleLook, carton, flute, clockSprite, mound } from './sparkling-parts.js';

const ROWS = [-3, -7, -11], VX = [-6, -2, 2, 6], POSTS = [-8, -4, 0, 4, 8];
const X2 = 100, X3 = 200, X4 = 300, X5 = 400, X6 = 500;
const GROUND = {};

export default {
  id: 'sparkling', title: 'Sparkling Grape Juice', emoji: '🥂', music: 'farm',
  question: 'Who puts the sparkle in the bottle?',
  thanksLine: 'From a tiny vine to dancing bubbles — cheers to everyone who helped!',

  create(ctx) {
    const rnd = seeded(77);
    // every zone keeps its moving things under one root, so only the zone you are in is drawn
    const zr = [0, 1, 2, 3, 4, 5].map(() => { const g = new THREE.Group(); g.userData.dynamic = true; g.visible = false; ctx.add(g); return g; });
    const D = (n, o, x, z, ry) => { if (x !== undefined) o.position.x = x; if (z !== undefined) o.position.z = z; if (ry !== undefined) o.rotation.y = ry; zr[n].add(o); if (o.userData.tick) ctx.animate(o); return o; };
    const who = (n, opts, x, z, ry, seed) => { const p = ctx.person(opts, x, z, ry, seed); zr[n].add(p); return p; };
    // …and the same for each zone's baked scenery (a camera turned along the row of zones would otherwise draw the neighbours too)
    const zs = [], fixed = (g, x, z) => { ctx.addStatic(g, x, z); g.visible = zs.length === 0; zs.push(g); };
    const zone = (n) => { zr.forEach((g, i) => { g.visible = i === n; }); zs.forEach((g, i) => { g.visible = i === n; }); };
    const faceTo = (p, x, z) => { p.rotation.y = Math.atan2(x - p.position.x, z - p.position.z); };
    // (many prompts sit on the floor spot where the player stands; `toward: [x, z]` names the thing itself, so the player turns to that when they press)
    const use = (o) => new Promise(res => ctx.interact(Object.assign({}, o, { onUse: () => { if (o.toward) faceTo(ctx.player, o.toward[0], o.toward[1]); res(); } })));
    // carried things rest on the player's forward-pointing arms, clear of the chest and below the face: lift, forward, (scale)
    const hold = (o, dy = 0.04, dz = 0.09, s) => { ctx.carry(o); o.position.set(0, dy, dz); if (s) o.scale.set(s[0] || s, s[1] || s, s[2] || s); return o; };
    const hop = async (o, to, h = 1.2, t = 0.5) => { ctx.tween(o.position, { x: to[0], z: to[2] }, t, 'linear'); const top = Math.max(o.position.y, to[1]) + h; await ctx.tween(o.position, { y: top }, t / 2, 'out'); await ctx.tween(o.position, { y: to[1] }, t / 2, 'in'); };
    zone(0);
    // big flat surfaces get a soft grain so they are not one flat colour (1 draw each)
    const gfloor = (w, d, color, pos, rx = 4, rz = 4) => { const m = plane(w, d, color, pos); const t = grain(1); t.repeat.set(rx, rz); m.material = new THREE.MeshLambertMaterial({ color, map: t }); return m; };
    // thin joint lines across a floor
    const joints = (g, w, d, cz, step, color, y = 0.036) => { for (let x = -w / 2 + step; x < w / 2 - 0.1; x += step) g.add(plane(0.05, d, color, [x, y, cz])); for (let z = cz - d / 2 + step; z < cz + d / 2 - 0.1; z += step) g.add(plane(w, 0.05, color, [0, y, z])); };
    // a closed steel vessel standing on legs: body from y0 to y1, domed top, dished bottom
    const vessel = (g, x, z, r, y0, y1, color, { legs = 4, bands = [], seg = 18, dome = 0.42 } = {}) => { const h = y1 - y0; g.add(cyl(r, r, h, color, [x, y0 + h / 2, z], null, seg)); { const d = ball(r, r * dome, r, color, [x, y1, z], null, seg); g.add(d); } g.add(cone(r, r * 0.4, color, [x, y0 - r * 0.2, z], [Math.PI, 0, 0], seg));
      for (const y of bands) g.add(cyl(r + 0.025, r + 0.025, 0.07, COL.steelD, [x, y, z], null, seg)); for (let i = 0; i < legs; i++) { const a = 0.8 + i / legs * Math.PI * 2; g.add(box(0.14, y0 + 0.1, 0.14, COL.steelD, [x + Math.cos(a) * r * 0.82, (y0 + 0.1) / 2, z + Math.sin(a) * r * 0.82])); g.add(box(0.26, 0.04, 0.26, 0x5b646c, [x + Math.cos(a) * r * 0.82, 0.05, z + Math.sin(a) * r * 0.82])); } };
    const ladder = (g, x, z, y0, y1, ry = 0) => { const l = new THREE.Group(); for (const s of [-1, 1]) l.add(box(0.04, y1 - y0, 0.04, COL.steelD, [s * 0.2, (y0 + y1) / 2, 0])); for (let y = y0 + 0.25; y < y1; y += 0.32) l.add(box(0.4, 0.035, 0.035, COL.steelD, [0, y, 0])); l.position.set(x, 0, z); l.rotation.y = ry; g.add(l); };
    // side walls of the indoor zones get a stripe and windows so they are never a blank slab
    const sideWalls = (g, W, color, zs = [-10.5, -5, 0.5], y = 3.6, d = 21, cz = -4.5) => { for (const s of [-1, 1]) { g.add(box(0.1, 0.5, d, color, [s * (W - 0.26), 0.25, cz])); for (const z of zs) { g.add(box(0.1, 1.5, 2.6, 0xbfe6f5, [s * (W - 0.26), y, z])); g.add(box(0.16, 0.14, 2.9, C.white, [s * (W - 0.3), y - 0.82, z])); g.add(box(0.12, 1.5, 0.1, C.white, [s * (W - 0.3), y, z])); } } };

    // ================= ZONE 1 — the vineyard (around 0,0). Rows run left–right. =================
    ctx.env('day', GROUND);
    const z1 = new THREE.Group(), rowCols = [];
    for (const z of ROWS) {
      z1.add(plane(17.6, 1.5, C.soil, [0, 0.03, z])); z1.add(box(17, 0.12, 0.8, 0x7a5536, [0, 0.06, z]));
      for (const x of POSTS) z1.add(box(0.15, 2.05, 0.15, C.woodLight, [x, 1.02, z]));
      for (const s of [-1, 1]) z1.add(box(0.1, 1.7, 0.1, C.wood, [s * 8.6, 0.75, z], [0, 0, s * 0.7]));
      if (z !== ROWS[0]) for (const y of [1.13, 1.78]) z1.add(box(16, 0.035, 0.035, COL.wire, [0, y, z]));
      rowCols.push([...POSTS.map(x => ctx.collideCircle(x, z, 0.12)), ...VX.map(x => ctx.collideCircle(x, z, 0.16))]);
    }
    const barn = P.barn({ sign: '🍇' }); barn.position.set(-20, 0, -9); barn.rotation.y = 0.55; z1.add(barn); ctx.collideBox(-20, -9, 10, 9);
    const silo = P.silo({ h: 6, r: 1.3, color: 0xd8d2c4 }); silo.position.set(-14.2, 0, -14.5); z1.add(silo); ctx.collideCircle(-14.2, -14.5, 1.6);
        z1.add(gfloor(3.2, 60, C.dirt, [11.5, 0.03, -12], 1, 14)); for (const s of [-1, 1]) z1.add(plane(0.42, 60, 0x8f6a48, [11.5 + s * 0.85, 0.034, -12]));
    z1.add(P.fence(22).translateZ(5.9).translateX(-2)); { const f = P.fence(22); f.rotation.y = Math.PI / 2; f.position.set(-13.9, 0, -5.1); z1.add(f); }
    z1.add(P.scatter(22, 90, 60, (r) => P.tree({ h: 3.6 + r() * 3, kind: r() < 0.45 ? 'pine' : 'round' }), { seed: 4, keep: (x, z) => (Math.abs(x) > 15.5 || z < -17) && z < 4 && !(x < -12 && x > -28 && z > -16 && z < -2) }));
    z1.add(P.scatter(10, 46, 30, () => P.bush(), { seed: 6, keep: (x, z) => Math.abs(x) > 15 && z < 6 }));
    z1.add(P.scatter(16, 22, 2.4, () => P.flower(), { seed: 9 }).translateZ(7.4).translateX(-2));
    z1.add(ball(46, 7, 18, 0x8cc25e, [14, -1.5, -60])); z1.add(ball(40, 9, 16, 0x74ad50, [-40, -2, -72]));
    for (let i = 0; i < 10; i++) z1.add(box(60 - i * 3, 0.5, 0.7, 0x5e9e44, [14, 1.0 + i * 0.42, -45.5 - i * 1.6]));  // far vineyard rows on the hill
    for (let i = 0; i < 3; i++) { const m = P.mountain({ h: 24 + i * 7 }); m.position.set(-60 + i * 52, 0, -110); z1.add(m); }
    for (const [x, y, z, s] of [[-16, 17, -50, 2], [10, 21, -70, 2.6], [30, 15, -40, 1.6]]) { const c = P.cloud({ s }); c.position.set(x, y, z); z1.add(c); }
    const hb = P.haybale(); hb.position.set(7.5, 0, 3.9); z1.add(hb); ctx.collideCircle(7.5, 3.9, 0.9);
    const wb = P.barrel(); wb.position.set(9.2, 0, 3.6); z1.add(wb); ctx.collideCircle(9.2, 3.6, 0.5);
    fixed(z1);
    ctx.collideBox(-2, 5.9, 22, 0.3); ctx.collideBox(-13.9, -5.1, 0.3, 22);

    const pick = P.truck({ kind: 'pickup', color: 0x3aa6a0 }); for (let i = 0; i < 6; i++) { const v = youngVine(); v.scale.setScalar(0.7); v.position.set(-0.4 + Math.floor(i / 3) * 0.7, 0.95, -1.7 + (i % 3) * 0.6); pick.add(v); } bake(pick); D(0, pick, -10.5, 3.2, Math.PI / 2); const pickCol = ctx.collideBox(-10.5, 3.2, 4.8, 2.4);
    const grower = who(0, { hat: 'straw', shirt: 0x8a4fc0, pants: 0x3b5b8c, skin: C.skin[3], hair: C.hair[1], hairStyle: 'pony', expressive: true }, -2.6, 2.6, 0.5);
    const nurse = who(0, { hat: 'cap', hatColor: 0x3aa6a0, shirt: 0x9ad0a0, apron: 0x4f9d4a, pants: 0x6b4a2f, skin: C.skin[1], hair: C.hair[2], expressive: true }, -7.4, 4.2, 0.4);
    const tray = group([P.crate({ s: 0.75, color: 0x8a6a4a })]); for (let i = 0; i < 4; i++) { const v = youngVine(); v.scale.setScalar(0.55); v.position.set(-0.2 + (i % 2) * 0.4, 0.3, -0.18 + Math.floor(i / 2) * 0.36); tray.add(v); } bake(tray); D(0, tray, -7.6, 2.6);
    const soilSpot = [3, 1.2];
    const probe = group([cyl(0.03, 0.03, 0.9, C.steel, [0, 0.45, 0], null, 5), box(0.34, 0.22, 0.08, 0xf2f2f2, [0, 0.95, 0]), box(0.26, 0.08, 0.09, 0x6cc04a, [0, 0.95, 0.005])]); bake(probe); probe.visible = false; D(0, probe, soilSpot[0], soilSpot[1]);
    const soilPatch = D(0, bake(group([cyl(0.72, 0.78, 0.05, 0x7a5536, [soilSpot[0], 0.04, soilSpot[1]], null, 18), cyl(0.3, 0.34, 0.03, 0x5f4029, [soilSpot[0] + 0.1, 0.075, soilSpot[1] - 0.05], null, 10), berry(0.07, 0x8a8378, [soilSpot[0] - 0.4, 0.08, soilSpot[1] + 0.25]), berry(0.05, 0x9a9388, [soilSpot[0] + 0.45, 0.08, soilSpot[1] + 0.3])])));
    // young vines the planting crews already put in the back rows (one baked group)
    const youngBack = new THREE.Group(); for (const z of ROWS.slice(1)) for (const x of VX) { const v = youngVine(); v.position.set(x, 0.1, z); youngBack.add(v); } bake(youngBack); D(0, youngBack);
    const frontYoung = [];
    const spool = group([cyl(0.3, 0.3, 0.06, C.wood, [0, 0.15, 0.2], [Math.PI / 2, 0, 0], 10), cyl(0.3, 0.3, 0.06, C.wood, [0, 0.15, -0.2], [Math.PI / 2, 0, 0], 10), cyl(0.2, 0.2, 0.36, COL.wire, [0, 0.15, 0], [Math.PI / 2, 0, 0], 10)]); bake(spool); spool.visible = false; D(0, spool, -8.8, -1.7);
    const wires = [1.13, 1.78].map(y => { const w = box(1, 0.035, 0.035, COL.wire, [-8, y, ROWS[0]]); w.visible = false; return D(0, w); });
    const loose = box(0.03, 0.03, 1, COL.wire); loose.visible = false; D(0, loose);
    // grown-up vines (hidden until "years later")
    const mature = new THREE.Group(); for (const z of ROWS) for (const x of VX) addTrunk(mature, x, z); bake(mature); mature.visible = false; D(0, mature);
    const tufts = VX.map(x => { const t = caneTuft(); t.position.set(x, 1.15, ROWS[0]); t.visible = false; return D(0, t); });
    const snowG = new THREE.Group(); for (const z of ROWS) { for (const x of POSTS) snowG.add(box(0.26, 0.1, 0.26, 0xffffff, [x, 2.1, z])); for (const x of VX) for (const s of [-1, 1]) snowG.add(ball(0.5, 0.07, 0.1, 0xffffff, [x + s * 0.95, 1.22, z])); snowG.add(box(17, 0.1, 1.2, 0xf4f8fb, [0, 0.1, z])); }
    for (let i = 0; i < 14; i++) { const d = disc(1, 0xffffff, [-12 + rnd() * 24, 0.05, -13 + rnd() * 17], 18); d.scale.set(0.8 + rnd() * 0.9, 0.5 + rnd() * 0.5, 1); d.rotation.z = rnd() * 3; snowG.add(d); }
    bake(snowG); snowG.visible = false; D(0, snowG);
    const flakes = (() => { const n = 160, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = -18 + rnd() * 36; pos[i * 3 + 1] = rnd() * 10; pos[i * 3 + 2] = -18 + rnd() * 24; } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.16 })); m.frustumCulled = false; m.visible = false; m.userData.pos = pos; return D(0, m); })();
    ctx.onUpdate((dt, t) => { if (!flakes.visible || !zr[0].visible) return; const p = flakes.userData.pos; for (let i = 0; i < p.length; i += 3) { p[i + 1] -= dt * (1.2 + (i % 5) * 0.15); p[i] += Math.sin(t + i) * dt * 0.3; if (p[i + 1] < 0) p[i + 1] = 10; } flakes.geometry.attributes.position.needsUpdate = true; });
    const mkCanopy = (cols, seed, core) => { const g = new THREE.Group(), r = seeded(seed); for (const z of ROWS) for (const x of VX) addCanopy(g, x, z, cols, r, core); bake(g); g.visible = false; return D(0, g); };
    const canopy = mkCanopy([COL.leaf, COL.leaf2, 0x5aa845], 5), canopyA = mkCanopy([COL.leaf2, 0x8aa845, COL.leafA, 0xb9a03a, 0x8aa845, COL.leafB], 8, 0x5f6a2c);
    const shoots = [-7, -4.4, -1.4, 1.4, 4.4, 7].map(x => { const s = shoot(); s.position.set(x, 1.7, ROWS[1] + 0.3); s.rotation.x = 1.95; s.visible = false; s.userData.x = x; return D(0, s); });
    const greens = new THREE.Group(); for (const z of ROWS) for (const x of VX) for (const dx of (z === ROWS[0] ? [-1.2, 0, 1.2] : [-0.9, 0.9])) { const b = bunch(COL.unripe, 1.25, z === ROWS[0] ? 10 : 6); b.position.set(x + dx, 1.1, z + 0.26); greens.add(b); } bake(greens); greens.visible = false; D(0, greens);
    const birds = [[-5, 2.0, -3], [3.2, 2.0, -3], [-1.2, 0, -0.6], [6.2, 0, 0.4]].map(([x, y, z], i) => { const b = starling(); b.position.set(x, y, z); b.rotation.y = i * 1.3; b.visible = false; b.userData.state = 'sit'; b.userData.scares = 0; return D(0, b); });
    const frontBunches = []; for (const x of VX) for (const dx of [-1.0, 1.0]) { const b = bunch(COL.grape, 1.4); b.position.set(x + dx, 1.12, ROWS[0] + 0.28); b.visible = false; b.userData.vx = x; frontBunches.push(D(0, b)); }
    const backBunches = []; for (const z of ROWS.slice(1)) for (const x of VX) { const g = new THREE.Group(); for (const dx of [-1.0, 0.9]) { const b = bunch(COL.grape, 1.45, 6); b.position.set(dx, 1.11, 0.27); g.add(b); } bake(g); g.position.set(x, 0, z); g.visible = false; backBunches.push(D(0, g)); }
    const myLug = lug(); myLug.visible = false; D(0, myLug, -5.6, -0.7);
    const harv = harvester(); harv.visible = false; D(0, harv, 11.5, 2.6, Math.PI);
    const gTruck = P.truck({ kind: 'flatbed', color: 0x3aa6a0 }); gTruck.visible = false; D(0, gTruck, 11.5, -13.2, Math.PI);
    const gHeap = mound(0.95, 0.6, 1.9, COL.grape, 9, 44, 0.13); gHeap.position.y = 0.1; gHeap.scale.y = 0.01; gHeap.visible = false; gTruck.userData.bed.add(gHeap);
    const clock = clockSprite(1.5); clock.visible = false; ctx.add(clock); let hours = 0, hoursCap = 0, clockOk = false, driving = false;
    ctx.onUpdate((dt) => { if (!clock.visible) return; hours = Math.min(hoursCap, hours + dt * 0.12); clock.userData.set(hours, clockOk); const p = ctx._riding ? ctx._riding.position : ctx.player.position, veh = ctx._riding || driving;
      // the clock floats above the player — but never up under the goal chip and progress dots (short phone screens, or high on a vehicle): there it is held just below them, and beside the vehicle
      const W = window.innerWidth, H = window.innerHeight, top = (W <= 560 ? 134 : 92) + 40;
      clockV.set(p.x, veh ? 6.4 : 3.4, p.z).project(ctx.camera);
      if (clockV.z < 1 && clockV.y > 1 - 2 * top / H) { clockV.y = 1 - 2 * top / H; clockV.x -= 2 * (veh ? Math.min(150, W * 0.2) : 66) / W; /* … and a little to the side, clear of the vehicle or of the bunch held overhead */ clockV.unproject(ctx.camera); clock.position.copy(clockV); }
      else clock.position.set(p.x, veh ? 6.4 : 3.4, p.z); });
    const clockV = new THREE.Vector3();

    // ================= ZONE 2 — the juice plant (x≈100, indoors) =================
    const z2 = new THREE.Group(), A2 = (x) => X2 + x;
    z2.add(gfloor(34, 21, 0xb3b0a8, [0, 0.03, -4.5], 7, 4)); joints(z2, 34, 21, -4.5, 4.25, 0x9a978f); z2.add(box(34, 7, 0.4, 0xe9e3d5, [0, 3.5, -15])); for (const s of [-1, 1]) z2.add(box(0.4, 7, 21, 0xdcd6c8, [s * 17, 3.5, -4.5]));
    z2.add(box(34, 0.5, 0.45, COL.juice, [0, 5.6, -14.9])); z2.add(box(34, 0.5, 0.45, COL.juice, [0, 0.25, -14.9])); sideWalls(z2, 17, COL.juice, [-11.5, -7.4, 1.6]);
    z2.add(sign('🍇 JUICE PLANT', 1.1, { border: '#4a2c17' }, [8.3, 3.3, -14.75]));
    for (let i = 0; i < 4; i++) { z2.add(box(2.3, 1.3, 0.1, 0xbfe6f5, [-3.4 + i * 2.9, 4.3, -14.78])); z2.add(box(2.5, 0.12, 0.2, C.white, [-3.4 + i * 2.9, 3.6, -14.75])); }
    for (const x of [-14, -6, 2, 10]) z2.add(plane(5, 0.18, 0xd9b23a, [x, 0.04, 1.6])); // floor line
    z2.add(plane(14, 0.26, 0x8a877f, [1, 0.037, -10.4])); for (let i = 0; i < 28; i++) z2.add(plane(0.06, 0.2, 0x55524c, [-5.75 + i * 0.5, 0.04, -10.4])); // drain
    for (const x of [-8, 0, 8]) { z2.add(cyl(0.03, 0.03, 1.2, 0x333333, [x, 6.4, -4], null, 4)); z2.add(cone(0.5, 0.35, 0x444c55, [x, 5.75, -4], null, 8)); z2.add(sphere(0.2, glow(0xfff2b0), [x, 5.6, -4], 6)); }
    { const t = P.truck({ kind: 'flatbed', color: 0x3aa6a0 }); t.position.set(-12.5, 0, -6.5); t.rotation.y = Math.PI; z2.add(t); }
    z2.add(cyl(1.72, 1.05, 0.72, COL.steel, [-12.5, 0.74, -1.7], [0, Math.PI / 4, 0], 4)); z2.add(box(2.1, 0.04, 2.1, 0x2a2a30, [-12.5, 1.105, -1.7])); z2.add(box(1.3, 0.42, 1.3, COL.steelD, [-12.5, 0.21, -1.7])); // receiving hopper: grapes fall between the crusher rollers
    for (const sx of [-1, 1]) { for (const sz of [-1, 1]) z2.add(box(0.12, 1.0, 0.12, COL.steelD, [-12.5 + sx * 1.12, 0.5, -1.7 + sz * 1.12])); z2.add(box(0.1, 0.14, 2.5, C.metal, [-12.5 + sx * 1.22, 1.1, -1.7])); z2.add(box(2.5, 0.14, 0.1, C.metal, [-12.5, 1.1, -1.7 + sx * 1.22])); }
    z2.add(cyl(0.3, 0.3, 0.55, 0x3f5f8a, [-10.9, 0.42, -1.7], [0, 0, Math.PI / 2], 10)); z2.add(box(0.5, 0.14, 0.5, 0x4a525a, [-10.9, 0.07, -1.7])); z2.add(cyl(0.13, 0.13, 0.9, COL.steelD, [-11.6, 0.3, -1.7], [0, 0, Math.PI / 2], 6)); // must pump
    const pipeA = pipe([[A2(-10.9), 0.8, -1.7], [A2(-10.9), 3.0, -1.7], [A2(-10.9), 3.0, -10.2], [A2(-5.6), 3.0, -10.2], [A2(-5.6), 2.1, -9.55]]);
    const pipeB = pipe([[A2(-2.9), 0.4, -8.5], [A2(-2.1), 0.4, -8.5], [A2(-2.1), 3.5, -8.5], [A2(4.5), 3.5, -8.5], [A2(4.5), 2.85, -8.5]]);
    const pipeC = pipe([[A2(5.7), 2.7, -9.1], [A2(5.7), 4.1, -9.1], [A2(12), 4.1, -9.1], [A2(12), 4.1, -10.2]]);
    // press
    z2.add(box(3.0, 0.3, 3.0, COL.steelD, [-5, 0.15, -8.5])); z2.add(cyl(1.4, 1.4, 0.12, COL.steel, [-5, 0.36, -8.5], null, 18)); z2.add(cyl(1.15, 1.15, 1.5, 0xc49a62, [-5, 1.15, -8.5], null, 18)); for (const y of [0.6, 1.15, 1.7]) z2.add(cyl(1.185, 1.185, 0.08, 0x3a3a3a, [-5, y, -8.5], null, 18));
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; z2.add(box(0.035, 1.5, 0.035, 0x8a6638, [-5 + Math.cos(a) * 1.16, 1.15, -8.5 + Math.sin(a) * 1.16], [0, -a, 0])); }
    for (const s of [-1, 1]) { z2.add(box(0.26, 3.8, 0.26, 0x4d5a66, [-5 + s * 1.55, 1.9, -8.5])); z2.add(box(0.5, 0.1, 0.7, 0x3c464f, [-5 + s * 1.55, 0.35, -8.5])); z2.add(box(0.5, 0.08, 0.2, 0x4d5a66, [-5 + s * 1.3, 3.45, -8.5], [0, 0, s * 0.8])); } z2.add(box(3.6, 0.36, 0.5, 0x4d5a66, [-5, 3.8, -8.5])); z2.add(cyl(0.22, 0.22, 0.5, 0x3c464f, [-5, 3.8, -8.5], null, 8));
    z2.add(box(1.2, 0.3, 1.0, C.steel, [-3.3, 0.15, -8.5])); z2.add(box(0.5, 0.12, 0.2, C.steel, [-3.9, 0.5, -8.5]));
    z2.add(box(1.3, 0.62, 1.3, COL.steelD, [-7.7, 0.47, -6.6])); z2.add(box(1.4, 0.06, 1.4, COL.steel, [-7.7, 0.79, -6.6])); z2.add(box(1.16, 0.02, 1.16, 0x3a2a36, [-7.7, 0.825, -6.6])); for (const sx of [-1, 1]) for (const sz of [-1, 1]) z2.add(cyl(0.08, 0.08, 0.06, 0x222222, [-7.7 + sx * 0.5, 0.08, -6.6 + sz * 0.5], [0, 0, Math.PI / 2], 6)); z2.add(box(1.1, 0.12, 0.45, C.metal, [-6.85, 1.2, -7.5], [0, 0.8, -0.5]));
    // evaporator (concentrating: some water steams off)
    vessel(z2, 1, -12.6, 1.0, 0.8, 3.6, COL.steel, { bands: [1.2, 2.4, 3.5] }); z2.add(cyl(0.26, 0.26, 0.06, 0x2c3a44, [1, 2.95, -11.6], [Math.PI / 2, 0, 0], 10)); z2.add(torus(0.27, 0.04, COL.steelD, [1, 2.95, -11.58], null, 12)); ladder(z2, -0.05, -12.3, 0, 3.7, -1.0);
    z2.add(cyl(0.14, 0.14, 0.7, COL.steelD, [1, 4.35, -12.6], null, 8)); z2.add(cyl(0.2, 0.2, 0.06, COL.steelD, [1, 4.7, -12.6], null, 8));
    z2.add(sign('💧', 0.8, { bg: null }, [1, 2.2, -11.56]));
    // pasteurizer
    vessel(z2, 4.5, -8.5, 1.3, 0.55, 2.75, COL.steel, { seg: 20, dome: 0.36 }); z2.add(cyl(0.36, 0.36, 0.14, COL.steelD, [4.1, 3.16, -8.1], null, 10)); z2.add(box(0.3, 0.05, 0.05, 0x3c464f, [4.1, 3.27, -8.1])); z2.add(box(0.5, 0.3, 0.03, 0x2f4f7a, [4.5, 2.35, -7.19]));
    z2.add(box(0.55, 2.5, 0.12, 0xf2f0ea, [6.7, 1.75, -7.3])); z2.add(box(0.63, 2.58, 0.08, 0x4a525a, [6.7, 1.75, -7.33])); z2.add(box(0.7, 0.5, 0.5, COL.steelD, [6.7, 0.25, -7.3])); for (let i = 0; i < 8; i++) z2.add(box(i % 2 ? 0.1 : 0.16, 0.025, 0.02, 0x4a525a, [6.55, 0.95 + i * 0.25, -7.235])); z2.add(box(0.45, 0.5, 0.13, 0x8fdc7a, [6.7, 2.45, -7.29])); z2.add(sphere(0.17, C.red, [6.7, 0.72, -7.22], 7));
    z2.add(box(0.9, 0.9, 0.5, 0x59636d, [6.6, 0.45, -5.3])); z2.add(box(1.04, 0.1, 0.7, 0x333a44, [6.6, 1.0, -5.3], [0.25, 0, 0])); z2.add(box(0.5, 0.32, 0.04, glow(0x9fd8e8), [6.6, 1.25, -5.62], [-0.2, 0, 0])); z2.add(box(0.58, 0.4, 0.05, 0x2a2f36, [6.6, 1.25, -5.65], [-0.2, 0, 0])); z2.add(box(0.08, 0.3, 0.08, 0x2a2f36, [6.6, 1.02, -5.6])); for (let i = 0; i < 3; i++) z2.add(sphere(0.07, glow([0xff5a5a, 0xffd84a, 0x5ad17a][i]), [6.3 + i * 0.3, 1.09, -5.25], 5));
    // storage tank + lab bench + way out
    z2.add(cyl(1.7, 1.7, 4.3, 0xbfc7ce, [12, 2.25, -11.6], null, 20)); z2.add(ball(1.7, 0.6, 1.7, 0xbfc7ce, [12, 4.4, -11.6], null, 20)); z2.add(cyl(1.76, 1.76, 0.22, 0x59636d, [12, 0.11, -11.6], null, 20)); for (const y of [1.5, 3.0, 4.35]) z2.add(cyl(1.725, 1.725, 0.07, COL.steelD, [12, y, -11.6], null, 20));
    z2.add(cyl(0.42, 0.42, 0.12, COL.steelD, [12, 1.0, -9.9], [Math.PI / 2, 0, 0], 12)); z2.add(box(0.5, 0.06, 0.06, 0x3c464f, [12, 1.0, -9.82])); z2.add(box(0.07, 3.2, 0.07, 0x7a4a9a, [13.25, 2.3, -10.42])); z2.add(box(0.11, 3.3, 0.05, COL.steelD, [13.25, 2.3, -10.45])); ladder(z2, 10.6, -10.55, 0, 4.6, -0.65); z2.add(sign('🍇', 1.3, { bg: null }, [12, 2.4, -9.86]));
    z2.add(cyl(0.11, 0.11, 3.4, COL.hose, [15.3, 1.6, -11.6], [0, 0, Math.PI / 2], 6));
    z2.add(P.tableProp(2.6, 0.9, 0.95, 0xf0f0f0).translateX(6.6).translateZ(-13.9)); for (let i = 0; i < 5; i++) z2.add(cyl(0.07, 0.1, 0.32, [0x7d46b0, 0x5ad17a, 0xffd84a, 0x7d46b0, 0xff7a9a][i], [5.7 + i * 0.42, 1.16, -13.9], null, 6)); z2.add(box(0.3, 0.45, 0.3, 0x333a44, [7.7, 1.22, -13.9]));
    z2.add(box(0.2, 3.2, 2.6, 0x4a3a30, [16.78, 1.6, -3])); z2.add(box(0.3, 0.3, 3.0, COL.juice, [16.75, 3.35, -3])); z2.add(sign('BOTTLING ➡', 0.75, { bg: '#6a2c91', fg: '#ffffff' }, [14.3, 4.1, -4.6]));
    z2.add(box(0.1, 0.5, 0.1, 0x444444, [14.3, 4.7, -4.6])); 
    for (const [x, z] of [[-15.6, 2.8], [-15.6, 4.0], [-14.5, 3.4]]) { const c = P.crate({ fill: COL.grape }); c.position.set(x, 0, z); z2.add(c); }
    z2.add(cyl(0.28, 0.22, 0.4, 0xf2c43d, [2.2, 0.2, 4.1], null, 8)); z2.add(box(0.5, 0.75, 0.06, 0xf2c43d, [-1.2, 0.36, 4.3], [0.3, 0, 0])); z2.add(box(0.5, 0.75, 0.06, 0xf2c43d, [-1.2, 0.36, 4.0], [-0.3, 0, 0]));
    z2.add(plane(2.6, 1.6, 0xa7cbe0, [0.6, 0.04, 3.4])); for (const x of [-10, -2, 6, 13]) { z2.add(plane(3.4, 2.2, 0xaaa69c, [x, 0.035, 4.1])); z2.add(plane(3.0, 1.8, 0xc4c0b6, [x, 0.04, 4.1])); } for (const [x, z] of [[8.5, 4.2], [9.6, 4.4], [9.0, 3.3]]) { const b = P.barrel({ color: 0x7d46b0 }); b.position.set(x, 0, z); z2.add(b); }
    z2.add(pipeA.stat, pipeB.stat, pipeC.stat); pipeA.stat.position.x = pipeB.stat.position.x = pipeC.stat.position.x = -X2;
    fixed(z2, X2, 0);
    ctx.collideBox(A2(-12.5), -6.5, 2.6, 6.6); ctx.collideBox(A2(-12.5), -1.7, 3.0, 2.4); ctx.collideBox(A2(-5), -8.5, 3.8, 3.2); ctx.collideBox(A2(-3.3), -8.5, 1.4, 1.2); ctx.collideBox(A2(-7.7), -6.6, 1.4, 1.4);
    ctx.collideCircle(A2(1), -12.6, 1.3); ctx.collideCircle(A2(4.5), -8.5, 1.5); ctx.collideBox(A2(6.7), -7.3, 0.9, 0.7); ctx.collideBox(A2(6.6), -5.3, 1.1, 0.8); ctx.collideCircle(A2(12), -11.6, 1.9); ctx.collideBox(A2(6.6), -13.9, 2.8, 1.1); ctx.collideBox(A2(-15.2), 3.4, 2, 2.2); ctx.collideBox(A2(9), 3.9, 2, 1.8);
    D(1, pipeA.juice); D(1, pipeB.juice); D(1, pipeC.juice);
    const heap2 = mound(0.95, 0.6, 1.9, COL.grape, 9, 44, 0.13); heap2.position.set(A2(-12.5), 1.05, -5.5); D(1, heap2);
    const rollers = [-0.34, 0.34].map(dz => { const r = group([cyl(0.3, 0.3, 2.4, 0xb8c0c8, null, [0, 0, Math.PI / 2], 8)]); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; r.add(box(2.4, 0.08, 0.08, 0x7a8590, [0, Math.cos(a) * 0.3, Math.sin(a) * 0.3])); } bake(r); r.position.set(A2(-12.5), 1.12, -1.7 + dz); return D(1, r); });
    const lever2 = group([box(0.3, 0.9, 0.3, C.steel, [0, 0.45, 0])]); const stick2 = group([cyl(0.04, 0.04, 0.7, 0x333333, [0, 0.35, 0]), sphere(0.12, C.red, [0, 0.72, 0])], [0, 0.85, 0], [0, 0, 0.6]); bake(stick2); stick2.userData.dynamic = true; lever2.add(stick2); bake(lever2); D(1, lever2, A2(-9.9), -0.5);
    const ram = group([cyl(0.1, 0.1, 2.2, C.metal, [0, 1.2, 0], null, 7), cyl(1.05, 1.05, 0.2, 0x444c55, [0, 0.1, 0], null, 14)]); bake(ram); ram.position.set(A2(-5), 2.55, -8.5); D(1, ram);
    const capstan = group([box(2.6, 0.12, 0.12, C.wood, [0, 0, 0]), box(0.12, 0.12, 2.6, C.wood, [0, 0, 0]), cyl(0.2, 0.2, 0.3, 0x444c55, null, null, 8)]); bake(capstan); capstan.position.set(A2(-5), 4.15, -8.5); D(1, capstan);
    const pressHeap = mound(1.05, 0.55, 1.05, COL.grape, 9, 34, 0.12); pressHeap.position.set(A2(-5), 1.95, -8.5); pressHeap.visible = false; D(1, pressHeap);
    const stream = cyl(0.06, 0.06, 0.4, COL.juice, [A2(-3.7), 0.42, -8.5], null, 6); stream.visible = false; D(1, stream);
    const trayJ = box(1.05, 0.06, 0.85, COL.juice, [A2(-3.3), 0.2, -8.5]); trayJ.visible = false; D(1, trayJ);
    const pomace = mound(0.55, 0.4, 0.55, 0x54344a, 7, 14, 0.07, 0x6e5a4a); pomace.position.set(A2(-7.7), 0.75, -6.6); pomace.scale.y = 0.01; pomace.visible = false; D(1, pomace);
    const coil = (c) => { const g = new THREE.Group(); for (const y of [0.8, 1.25, 1.7]) g.add(torus(1.34, 0.07, c, [0, y, 0], [Math.PI / 2, 0, 0], 16)); bake(g); g.position.set(A2(4.5), 0, -8.5); return D(1, g); };
    const coilOff = coil(0x8a949e), coilOn = coil(glow(0xff8a2a)); coilOn.visible = false;
    const mercury = box(0.16, 1, 0.1, C.red, [A2(6.7), 0.75, -7.22]); mercury.geometry.translate(0, 0.5, 0); mercury.scale.y = 0.25; D(1, mercury);
    const operator = who(1, { hat: 'hardhat', shirt: 0x8a4fc0, vest: 0xffb020, pants: C.navy, skin: C.skin[2], hair: C.hair[0], beard: C.hair[0], expressive: true }, A2(-7.6), -3.6, 0.5);
    const lab = who(1, { shirt: 0xffffff, apron: 0xffffff, pants: 0x4a4a55, glasses: true, hair: C.hair[6], hairStyle: 'bun', skin: C.skin[0], expressive: true }, A2(3.6), -12.7, 0.2);
    const mopper = who(1, { hat: 'cap', hatColor: C.blue, shirt: 0x5ab0e0, pants: C.navy, skin: C.skin[5], hair: C.hair[1], expressive: true }, A2(0.6), 4.2, Math.PI + 0.4); mopper.userData.anim = 'dig';
    // the mop: its head stays flat on the floor in front of the mopper and the handle runs up through the right hand (arms are rigid, so it cannot simply be fixed to the hand)
    { const stick = group([cyl(0.025, 0.025, 1.5, C.woodLight, [0, 0.75, 0], null, 5)]); bake(stick); stick.userData.dynamic = true; const mop = group([box(0.5, 0.08, 0.22, 0xf0f0f0, [0, 0.05, 0]), stick]); mop.userData.dynamic = true; mopper.add(mop);
      const h = new THREE.Vector3(); ctx.onUpdate(() => { if (!zr[1].visible) return; mopper.userData.hand.getWorldPosition(h); mopper.worldToLocal(h); mop.position.set(h.x, 0, h.z + 0.75); stick.rotation.x = Math.atan2(-0.75, h.y - 0.05); }); }
    ctx.collideCircle(A2(-9.9), -0.5, 0.25);
    const door2 = [A2(15.6), -3];

    // ================= ZONE 3 — the bottling line (x≈200, indoors) =================
    const z3 = new THREE.Group(), A3 = (x) => X3 + x;
    z3.add(gfloor(34, 21, 0xbcc3c7, [0, 0.03, -4.5], 7, 4)); joints(z3, 34, 21, -4.5, 4.25, 0xa3abb0); z3.add(box(34, 7, 0.4, 0xeef2f3, [0, 3.5, -15])); z3.add(box(0.4, 7, 21, 0xe2e8ea, [-17, 3.5, -4.5])); z3.add(box(0.4, 7, 21, 0xe2e8ea, [17, 3.5, -4.5]));
    z3.add(box(34, 0.5, 0.45, 0x3aa6a0, [0, 5.3, -14.9])); z3.add(box(34, 0.5, 0.45, 0x3aa6a0, [0, 0.25, -14.9])); sideWalls(z3, 17, 0x3aa6a0);
    z3.add(sign('🍾 BOTTLING LINE', 1.1, { border: '#1f6d68' }, [-3.5, 2.7, -14.75]));
    for (const x of [-8, 0, 8]) { z3.add(cyl(0.03, 0.03, 1.2, 0x333333, [x, 6.4, -4], null, 4)); z3.add(cone(0.5, 0.35, 0x444c55, [x, 5.75, -4], null, 8)); z3.add(sphere(0.2, glow(0xfff2b0), [x, 5.6, -4], 6)); }
    for (const x of [-13, -5, 3]) z3.add(plane(5, 0.18, 0xf2c43d, [x, 0.04, -2.2])); for (const x of [-8, 0, 8]) { z3.add(plane(3.4, 2.2, 0xb4bcc0, [x, 0.035, 2.6])); z3.add(plane(3.0, 1.8, 0xd3dadd, [x, 0.04, 2.6])); } for (const [x, z, n] of [[-4.5, 3.2, 2], [3.5, 3.4, 1]]) { z3.add(box(1.5, 0.15, 1.3, C.wood, [x, 0.08, z])); for (let k = 0; k < n; k++) for (const dx of [-0.4, 0.4]) z3.add(box(0.72, 0.52, 1.1, k % 2 ? 0xbf9860 : COL.card, [x + dx, 0.42 + k * 0.54, z])); }
    const pipeIn = pipe([[A3(-16.8), 3.6, -9], [A3(-11), 3.6, -9], [A3(-11), 3.25, -9]]);
    const pipeD = pipe([[A3(-9.65), 2.6, -9], [A3(-4), 2.6, -9], [A3(-4), 2.6, -5.9]]);
    vessel(z3, -11, -9, 1.4, 0.6, 2.75, COL.steel, { seg: 20, dome: 0.4, bands: [0.75, 2.65] }); z3.add(cyl(0.1, 0.1, 0.3, COL.steelD, [-10.4, 3.3, -8.6], null, 6)); z3.add(cyl(0.16, 0.16, 0.1, 0xb8473c, [-10.4, 3.48, -8.6], null, 8));
    z3.add(cyl(0.55, 0.55, 0.08, 0x3a1f4a, [-11, 1.5, -7.6], [Math.PI / 2, 0, 0], 14)); z3.add(torus(0.56, 0.06, C.steel, [-11, 1.5, -7.56], null, 16));
    z3.add(box(0.12, 1.9, 0.12, C.steel, [-12.5, 0.95, -1.45])); z3.add(cyl(0.5, 0.5, 0.08, 0xfafafa, [-12.5, 2.1, -1.4], [Math.PI / 2, 0, 0], 14)); z3.add(torus(0.51, 0.06, 0x333a44, [-12.5, 2.1, -1.36], null, 16)); z3.add(box(0.2, 0.12, 0.05, 0x6cc04a, [-12.17, 2.28, -1.34], [0, 0, -0.75]));
    for (let i = 0; i < 3; i++) { const x = -14.6 + i * 0.62; z3.add(cyl(0.25, 0.25, 1.6, 0x7d8a92, [x, 0.8, -10.2], null, 10)); z3.add(ball(0.25, 0.2, 0.25, 0x5f6b73, [x, 1.6, -10.2], null, 10)); z3.add(cyl(0.07, 0.07, 0.22, 0x2e3338, [x, 1.88, -10.2], null, 6)); z3.add(cyl(0.11, 0.11, 0.05, 0x2e3338, [x, 2.0, -10.2], null, 6)); } z3.add(box(2.1, 0.06, 0.04, 0x2e3338, [-14, 1.15, -9.94])); z3.add(box(2.2, 0.08, 0.7, 0x59636d, [-14, 0.04, -10.2]));
    z3.add(sign('CO2', 0.8, { bg: '#ffffff', fg: '#2b3f66', border: '#2b3f66' }, [-14, 2.9, -10.1])); z3.add(cyl(0.05, 0.05, 2.2, 0x333333, [-12.9, 2.0, -9.9], [0, 0.2, Math.PI / 2], 5));
    z3.add(box(0.36, 0.9, 0.36, C.steel, [-12.5, 0.45, -1.0])); z3.add(cyl(0.06, 0.06, 6.6, C.steel, [-12.5, 0.08, -4.4], [Math.PI / 2, 0, 0], 5)); z3.add(cyl(0.06, 0.06, 1.0, C.steel, [-12.1, 0.08, -7.7], [0, 0, Math.PI / 2], 5));
    z3.add(P.conveyor(16).translateX(1).translateZ(-5));
    z3.add(box(1.6, 1.0, 1.3, COL.steel, [-7.9, 1.45, -5])); z3.add(cyl(0.65, 0.65, 1.6, COL.steel, [-7.9, 1.95, -5], [0, 0, Math.PI / 2], 12)); z3.add(box(1.2, 0.7, 1.32, 0x2a2a30, [-7.6, 1.35, -5])); z3.add(box(0.9, 0.5, 0.04, 0x35506a, [-8.05, 1.75, -4.34])); z3.add(box(1.0, 0.6, 0.03, COL.steelD, [-8.05, 1.75, -4.35])); // bottle rinser: clean empty bottles come out
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) z3.add(box(0.1, 0.95, 0.1, COL.steelD, [-7.9 + sx * 0.7, 0.48, -5 + sz * 0.55])); z3.add(cyl(0.04, 0.04, 0.5, 0x2e3338, [-8.5, 2.85, -5], null, 5)); z3.add(sphere(0.09, glow(0x5ad17a), [-8.5, 3.14, -5], 6));
    for (const z of [-5.75, -4.25]) { z3.add(box(0.14, 2.7, 0.14, COL.steelD, [-4, 1.35, z])); z3.add(box(0.16, 2.9, 0.16, 0x4a525a, [1, 1.45, z])); z3.add(box(0.3, 0.06, 0.3, 0x3c464f, [1, 0.03, z])); }
    z3.add(box(0.16, 0.12, 1.66, COL.steelD, [-4, 2.64, -5])); z3.add(cyl(0.62, 0.62, 0.55, COL.steel, [-4, 2.98, -5], null, 16)); z3.add(ball(0.62, 0.22, 0.62, COL.steel, [-4, 3.25, -5], null, 16)); z3.add(cyl(0.635, 0.635, 0.16, COL.juice, [-4, 2.95, -5], null, 16)); z3.add(cyl(0.6, 0.1, 0.36, COL.steel, [-4, 2.52, -5], null, 12)); z3.add(cyl(0.04, 0.06, 0.72, COL.steelD, [-4, 2.0, -5], null, 6)); z3.add(box(0.9, 0.9, 0.5, COL.steelD, [-4, 0.45, -5.95])); z3.add(box(0.5, 1.7, 0.12, COL.steel, [-4, 1.75, -6.0])); z3.add(box(0.3, 0.2, 0.03, glow(0x9fd8e8), [-4, 2.0, -5.93])); // filler bowl + nozzle + its cabinet
    z3.add(box(0.6, 0.45, 1.9, 0xb8473c, [1, 2.95, -5])); z3.add(box(0.62, 0.06, 1.92, 0x8a3229, [1, 2.75, -5])); z3.add(cyl(0.14, 0.14, 0.5, COL.steel, [1, 3.4, -5], null, 8)); z3.add(cyl(0.32, 0.2, 0.3, COL.steel, [1, 3.5, -5.6], [0, Math.PI / 4, 0], 4)); z3.add(ball(0.2, 0.07, 0.2, COL.foil, [1, 3.66, -5.6], null, 6)); z3.add(box(0.1, 0.04, 0.5, COL.steelD, [1, 3.3, -5.32], [0.5, 0, 0])); // capper: head, air cylinder, cap hopper
    z3.add(box(1.2, 1.5, 0.6, COL.steel, [5.5, 1.7, -5.95])); z3.add(box(1.1, 0.95, 0.6, COL.steelD, [5.5, 0.475, -5.95])); z3.add(box(1.0, 0.9, 0.03, 0xece4cf, [5.5, 1.9, -5.64])); for (const [x, r] of [[5.1, 0.26], [5.9, 0.17]]) { z3.add(cyl(r, r, 0.07, COL.label, [x, 2.72, -5.9], [Math.PI / 2, 0, 0], 12)); z3.add(cyl(0.05, 0.05, 0.12, 0x3c464f, [x, 2.72, -5.88], [Math.PI / 2, 0, 0], 6)); z3.add(box(0.05, 0.32, 0.05, COL.steelD, [x, 2.55, -5.95])); } // labeller with its reel of labels z3.add(sign('🍇', 0.6, { bg: '#fff8e8', border: '#6a2c91' }, [5.5, 2.0, -5.63]));
    z3.add(P.tableProp(1.7, 1.3, 0.7, C.woodLight).translateX(10.4).translateZ(-5));
    { const pal = new THREE.Group(); pal.add(box(1.4, 0.15, 1.2, C.wood, [0, 0.08, 0])); for (let i = 0; i < 12; i++) { const b = bottleLook(0); b.position.set(-0.45 + (i % 4) * 0.3, 0.15, -0.3 + Math.floor(i / 4) * 0.3); pal.add(b); } pal.position.set(-14.6, 0, 2.6); z3.add(pal); }
    for (const [x, z, n] of [[13.6, -12.4, 3], [11.4, -12.6, 2], [15.2, -10.2, 2], [8.9, -12.8, 1]]) { z3.add(box(1.5, 0.15, 1.3, C.wood, [x, 0.08, z])); for (let k = 0; k < n; k++) for (const dx of [-0.4, 0.4]) z3.add(box(0.72, 0.52, 1.1, k % 2 ? 0xbf9860 : COL.card, [x + dx, 0.42 + k * 0.54, z])); }
    { const f = new THREE.Group(); f.add(box(1.2, 0.7, 1.9, 0xf2c43d, [0, 0.65, 0])); f.add(box(1.1, 0.9, 0.1, 0x333a44, [0, 1.5, -0.6])); f.add(box(1.2, 0.08, 1.1, 0x333a44, [0, 1.95, -0.1])); for (const s of [-1, 1]) { f.add(box(0.08, 2.3, 0.08, 0x333a44, [s * 0.4, 1.2, 1.0])); f.add(box(0.12, 0.06, 1.0, C.metal, [s * 0.35, 0.25, 1.5])); for (const z of [-0.6, 0.6]) f.add(cyl(0.3, 0.3, 0.25, 0x222222, [s * 0.62, 0.3, z], [0, 0, Math.PI / 2], 9)); } f.position.set(8.3, 0, -9.6); f.rotation.y = 0.7; z3.add(f); }
    z3.add(pipeIn.stat, pipeD.stat); pipeIn.stat.position.x = pipeD.stat.position.x = -X3;
    fixed(z3, X3, 0);
    ctx.collideCircle(A3(-11), -9, 1.6); ctx.collideBox(A3(-14), -10.2, 2.2, 1.0); ctx.collideBox(A3(-12.5), -1.2, 0.5, 0.8); ctx.collideBox(A3(0.4), -5, 17.4, 1.5); ctx.collideBox(A3(10.4), -5, 1.8, 1.4); ctx.collideBox(A3(-14.6), 2.6, 1.5, 1.3); ctx.collideBox(A3(-4.5), 3.2, 1.7, 1.5); ctx.collideBox(A3(3.5), 3.4, 1.7, 1.5);
    ctx.collideBox(A3(5.5), -6, 1.3, 0.8); ctx.collideBox(A3(12.5), -12.3, 5, 2); ctx.collideBox(A3(15.2), -10.2, 1.6, 1.4); ctx.collideBox(A3(8.3), -9.8, 2.4, 2.6);
    D(2, pipeIn.juice); D(2, pipeD.juice);
    const needle = group([box(0.06, 0.42, 0.03, C.red, [0, 0.18, 0])]); bake(needle); needle.position.set(A3(-12.5), 2.1, -1.33); needle.rotation.z = 2.1; D(2, needle);
    const wheel3 = group([torus(0.3, 0.06, C.red, null, [Math.PI / 2, 0, 0], 12), box(0.6, 0.05, 0.06, C.red), box(0.06, 0.05, 0.6, C.red)]); bake(wheel3); wheel3.position.set(A3(-12.5), 1.0, -1.0); D(2, wheel3);
    const fizz = [0, 1, 2].map(i => { const s = sphere(0.07, 0xf0e6ff, [A3(-11.25 + i * 0.25), 1.2, -7.5], 5); s.visible = false; return D(2, s); });
    const capHead = group([cyl(0.07, 0.07, 1.3, C.metal, [0, 0.75, 0], null, 7), cyl(0.16, 0.13, 0.16, 0x444c55, [0, 0.08, 0], null, 8)]); bake(capHead); capHead.position.set(A3(1), 1.9, -5); D(2, capHead);
    const lampR = sphere(0.17, glow(0xff5a5a), [A3(1), 3.0, -4.0], 7), lampG = sphere(0.2, glow(0x5aff7a), [A3(1), 3.0, -4.0], 7); lampG.visible = false; D(2, lampR); D(2, lampG);
    const drum = group([cyl(0.3, 0.3, 0.5, 0xf6ecd6, null, null, 10), box(0.1, 0.3, 0.62, COL.grape)]); bake(drum); drum.position.set(A3(5.5), 1.3, -5.5); D(2, drum);
    const line = [0, 1, 2, 3, 4, 5].map(() => { const b = bottle(0, 0.82); b.position.set(A3(-7), 0.97, -5); b.visible = false; D(2, b); return { o: b, x: -7, st: 0, on: false }; });
    const box3 = carton(sign('🍇', 0.34, { bg: null })); box3.position.set(A3(10.4), 0.75, -5); D(2, box3);
    const truck3 = P.truck({ kind: 'box', color: 0x7b4fb0, logo: '🍇' }); D(2, truck3, A3(14), -0.6, 0); ctx.collideBox(A3(14), -0.6, 2.6, 6.8);
    const scientist = who(2, { shirt: 0xffffff, apron: 0xffffff, pants: C.navy, glasses: true, hair: C.hair[1], hairStyle: 'curly', skin: C.skin[3], expressive: true }, A3(-9.5), -6.3, 0.35);
    { const cb = group([box(0.04, 0.4, 0.3, 0xc9a26b, [-0.08, -0.62, 0.02]), box(0.045, 0.3, 0.24, 0xffffff, [-0.085, -0.63, 0.02])]); bake(cb); scientist.userData.armL.add(cb); }   // clipboard hangs from the left hand, at her side (the right arm is the one that gestures)
    const lineW = who(2, { hat: 'hairnet', shirt: 0x9fd0e8, apron: 0xffffff, pants: C.navy, skin: C.skin[1], hair: C.hair[0], expressive: true }, A3(3.4), -6.15, 0); lineW.userData.anim = 'work';   // close enough for straight arms to reach the line
    const loader = who(2, { hat: 'hardhat', vest: 0xff8a1f, shirt: C.blue, pants: 0x4a4a55, skin: C.skin[4], hair: C.hair[3], expressive: true }, A3(11.6), 0.6, -0.5);

    // ================= ZONE 4 — the store (x≈300, indoors) =================
    const z4 = new THREE.Group(), A4 = (x) => X4 + x;
    z4.add(gfloor(26, 18, 0xe4dfd0, [0, 0.03, -4], 6, 4)); joints(z4, 26, 18, -4, 2, 0xcfc9b8); z4.add(box(26, 5, 0.4, 0xf2efe6, [0, 2.5, -13])); for (const s of [-1, 1]) z4.add(box(0.4, 5, 18, 0xe6e2d6, [s * 13, 2.5, -4]));
    z4.add(box(26, 0.7, 0.45, C.green, [0, 4.1, -12.9])); sideWalls(z4, 13, C.green, [-9, -3.5], 3.0, 18, -4); z4.add(sign('🛒 MARKET', 1.0, { border: '#2f6d3a' }, [0, 3.0, -12.75]));
    for (let i = 0; i < 3; i++) { const s = P.shelf({ w: 5, seed: i + 3 }); s.position.set(-8 + i * 8, 0, -12.2); z4.add(s); }
    { const s = P.shelf({ w: 6, seed: 12 }); s.position.set(-6, 0, -6.5); z4.add(s); }
    for (let i = 0; i < 10; i++) z4.add(plane(1.2, 1.2, i % 2 ? 0xd9d2c0 : 0xf4f0e4, [-5.4 + i * 1.2, 0.04, 2.2]));
    z4.add(box(3.6, 0.9, 1.6, 0xb88d5a, [4.5, 0.45, -6.5])); z4.add(box(3.6, 0.5, 0.6, 0x9a6f40, [4.5, 1.15, -6.95])); z4.add(box(3.7, 0.06, 1.7, 0x8a6238, [4.5, 0.9, -6.5])); z4.add(box(3.7, 0.1, 1.7, 0x6e4e2c, [4.5, 0.05, -6.5])); for (let i = 0; i < 9; i++) z4.add(box(0.03, 0.74, 0.02, 0x8a6238, [2.9 + i * 0.4, 0.48, -5.69])); z4.add(box(0.5, 0.3, 0.02, 0xfff8e8, [3.2, 0.6, -5.67])); z4.add(box(0.3, 0.06, 0.025, COL.grape, [3.2, 0.62, -5.66])); for (const s of [-1, 1]) z4.add(box(0.1, 1.6, 0.1, C.woodDark, [4.5 + s * 1.7, 1.7, -7.2]));
    for (let i = 0; i < 7; i++) { const b = bottleLook(3); b.scale.setScalar(0.9); b.position.set(3.15 + i * 0.45, 1.4, -6.95); z4.add(b); }
    z4.add(sign('🥂 SPARKLING', 0.62, { border: '#6a2c91' }, [4.5, 2.75, -7.2]));
    z4.add(box(1, 1, 3.2, 0x8f7a5c, [-7.4, 0.5, -0.6])); z4.add(box(1.1, 0.08, 3.3, 0xd8d2c4, [-7.4, 1.04, -0.6])); z4.add(box(0.7, 0.02, 1.9, 0x2b2b2e, [-7.4, 1.09, 0.0])); z4.add(box(0.06, 0.06, 1.9, COL.steelD, [-7.02, 1.1, 0.0])); z4.add(box(0.5, 0.4, 0.55, 0x3a3d42, [-7.4, 1.28, -1.5])); z4.add(box(0.14, 0.2, 0.1, 0x2b2b2e, [-7.05, 1.18, -0.95], [0, 0, 0.4])); z4.add(box(0.05, 0.5, 0.05, COL.steelD, [-7.8, 1.3, 0.9])); z4.add(box(0.3, 0.22, 0.04, 0x3f8f4f, [-7.8, 1.65, 0.9], [0, Math.PI / 2, 0])); z4.add(box(0.05, 0.3, 0.5, glow(0x9fe8a0), [-7.13, 1.42, -1.4])); z4.add(sign('💵', 0.6, { bg: null }, [-6.88, 0.55, -0.6], [0, Math.PI / 2, 0]));
    { const c = new THREE.Group(); c.add(box(0.9, 0.5, 0.6, C.metal, [0, 0.75, 0])); for (const s of [-1, 1]) for (const z of [-1, 1]) c.add(box(0.05, 0.45, 0.05, C.steel, [s * 0.35, 0.3, z * 0.22])); c.add(box(0.06, 0.5, 0.06, C.steel, [0, 1.05, -0.33])); c.add(box(0.9, 0.05, 0.05, C.red, [0, 1.3, -0.33])); for (const s of [-1, 1]) for (const z of [-1, 1]) c.add(cyl(0.08, 0.08, 0.05, 0x222222, [s * 0.35, 0.08, z * 0.22], [0, 0, Math.PI / 2], 6)); c.add(box(0.8, 0.42, 0.5, 0xd9a441, [0, 0.8, 0])); c.position.set(1.5, 0, -9.4); c.rotation.y = 0.4; z4.add(c); }
    { const t = new THREE.Group(); t.add(box(1.2, 0.1, 0.8, C.steel, [0, 0.3, 0])); t.add(box(0.06, 1.0, 0.8, C.steel, [-0.6, 0.8, 0])); for (let k = 0; k < 2; k++) t.add(box(0.9, 0.5, 0.62, COL.card, [0.05, 0.6 + k * 0.52, 0])); t.position.set(8.2, 0, -7.2); z4.add(t); }
    for (const [x, z] of [[-11, -2], [11.3, -9]]) { z4.add(cyl(0.35, 0.28, 0.5, 0xb4563c, [x, 0.25, z], null, 8)); z4.add(sphere(0.5, C.leaf, [x, 0.9, z], 6)); }
    fixed(z4, X4, 0);
    ctx.collideBox(A4(-6), -6.5, 6.2, 1); ctx.collideBox(A4(4.5), -6.6, 3.8, 1.9); ctx.collideBox(A4(-7.4), -0.6, 1.2, 3.4); ctx.collideBox(A4(0), -12.4, 26, 1.2); ctx.collideBox(A4(1.5), -9.4, 1.1, 0.9); ctx.collideBox(A4(8.2), -7.2, 1.4, 1);
    const cashier = who(3, { shirt: C.green, apron: 0xffffff, hairStyle: 'curly', hair: C.hair[0], skin: C.skin[3], expressive: true }, A4(-8.7), -0.6, Math.PI / 2);
    const stocker = who(3, { shirt: 0x3aa6a0, apron: C.green, hat: 'cap', hatColor: C.green, pants: 0x4a4a55, skin: C.skin[0], hair: C.hair[2], expressive: true }, A4(7.2), -5.3, -0.7);
    const momOpts = { shirt: 0xe88fb0, pants: C.navy, hair: C.hair[2], hairStyle: 'long', skin: C.skin[0], expressive: true };
    const mom4 = who(3, momOpts, A4(0.4), -9.0, 0.6);
    const slots = [-1.05, -0.35, 0.35, 1.05].map(dx => { const b = bottle(3, 0.9); b.position.set(A4(4.5 + dx), 0.9, -6.1); b.visible = false; return D(3, b); });
    const shelfSpot = [A4(4.5), -5.2];

    // ================= ZONE 5 — home (x≈400, indoors) =================
    const z5 = new THREE.Group(), A5 = (x) => X5 + x;
    z5.add(gfloor(16, 12, 0xc2946a, [0, 0.03, -2], 1.2, 5)); for (let i = 0; i < 8; i++) z5.add(plane(0.06, 12, 0xb5855a, [-7 + i * 2, 0.04, -2]));
    z5.add(box(16, 5, 0.4, 0xf3dfb8, [0, 2.5, -8])); for (const s of [-1, 1]) z5.add(box(0.4, 5, 12, 0xeed6a8, [s * 8, 2.5, -2])); z5.add(box(16, 0.3, 0.45, 0xd9622b, [0, 0.15, -7.9]));
    z5.add(box(1.5, 2.5, 0.12, C.woodDark, [-6.4, 1.25, -7.76])); z5.add(box(1.8, 0.16, 0.2, C.wood, [-6.4, 2.6, -7.72])); z5.add(sphere(0.07, C.gold, [-5.85, 1.2, -7.66], 5)); z5.add(sign('🍷 CELLAR', 0.62, { bg: '#3a2418', fg: '#f6ecd6' }, [-6.3, 3.15, -7.75]));
    z5.add(box(6.4, 1, 1.3, 0x7d9c88, [-2.1, 0.5, -7.1])); z5.add(box(6.6, 0.1, 1.4, 0xf0eadd, [-2.1, 1.05, -7.1])); for (let i = 0; i < 6; i++) { z5.add(box(0.94, 0.7, 0.03, 0x8aab96, [-4.75 + i * 1.06, 0.52, -6.44])); z5.add(box(0.2, 0.03, 0.03, 0xd9d2c0, [-4.75 + i * 1.06, 0.8, -6.41])); }
    z5.add(box(0.9, 0.03, 0.6, 0xaab2b8, [-2.6, 1.105, -7.0])); z5.add(cyl(0.025, 0.025, 0.3, 0xaab2b8, [-2.6, 1.25, -7.4], null, 5)); z5.add(cyl(0.025, 0.025, 0.22, 0xaab2b8, [-2.6, 1.4, -7.3], [Math.PI / 2, 0, 0], 5));
    z5.add(box(2.4, 1.5, 0.1, 0xbfe6f5, [-2.4, 3.0, -7.78])); z5.add(box(2.6, 0.1, 0.2, C.white, [-2.4, 2.2, -7.7])); z5.add(box(0.08, 1.5, 0.12, C.white, [-2.4, 3.0, -7.76])); z5.add(sphere(0.45, C.autumn[0], [-1.7, 2.9, -7.9], 6)); z5.add(sphere(0.35, C.autumn[1], [-3.0, 2.7, -7.9], 6));
    for (const [x, s, c] of [[-4.5, 0.3, 0xe98a2b], [-4.0, 0.2, 0xf2c43d], [0.3, 0.26, 0xe98a2b]]) { z5.add(ball(s, s * 0.75, s, c, [x, 1.1 + s * 0.7, -7.1])); z5.add(cyl(0.03, 0.04, 0.12, 0x4f7a3a, [x, 1.1 + s * 1.5, -7.1], null, 5)); }
    z5.add(cyl(0.34, 0.3, 0.08, 0xd9a441, [-1.2, 1.14, -7.0], null, 12)); z5.add(cyl(0.29, 0.29, 0.04, 0xb4622b, [-1.2, 1.19, -7.0], null, 12)); // pie
    z5.add(box(1.2, 1.95, 1.7, 0xd9dbdc, [7.15, 1.0, -1.2])); z5.add(box(1.1, 0.06, 1.6, 0x2e3338, [7.15, 0.03, -1.2])); z5.add(box(0.05, 1.75, 1.5, 0x3b4a55, [6.54, 1.0, -1.2])); for (const y of [0.78, 1.35]) z5.add(box(0.4, 0.04, 1.45, 0xdff3ff, [6.7, y, -1.2])); z5.add(box(1.25, 0.6, 1.8, C.wood, [7.15, 2.5, -1.2])); for (const z of [-1.65, -0.75]) z5.add(box(0.03, 0.5, 0.8, C.woodLight, [6.52, 2.5, z])); // fridge with a cupboard above
    z5.add(box(2.0, 2.7, 0.6, C.wood, [3.0, 1.35, -7.5])); z5.add(box(1.8, 1.3, 0.1, 0x3a2418, [3.0, 1.95, -7.22])); for (let i = 0; i < 6; i++) z5.add(cyl(0.22, 0.22, 0.04, i % 2 ? 0xfafafa : 0xdbe9f5, [2.4 + (i % 3) * 0.6, 1.62 + Math.floor(i / 3) * 0.6, -7.14], [Math.PI / 2, 0, 0], 10)); for (const s of [-1, 1]) z5.add(sphere(0.05, C.gold, [3.0 + s * 0.12, 0.7, -7.18], 5)); // china cabinet
    for (const x of [-5.6, -4.4]) { const c = group([box(0.55, 0.08, 0.55, C.wood, [0, 0.5, 0]), box(0.55, 0.6, 0.07, C.wood, [0, 0.85, -0.24])]); for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.add(box(0.06, 0.5, 0.06, C.woodDark, [sx * 0.22, 0.25, sz * 0.22])); c.position.set(x, 0, 2.6); c.rotation.y = Math.PI + (x + 5) * 0.5; z5.add(c); }
    z5.add(cyl(0.3, 0.24, 0.5, 0xb4563c, [-7.1, 0.25, 1.6], null, 8)); z5.add(sphere(0.55, C.leaf, [-7.1, 1.0, 1.6], 6)); z5.add(sphere(0.4, 0x6bb54a, [-6.9, 1.5, 1.5], 6));
    z5.add(box(2.0, 2.8, 0.1, glow(0xffd9a0), [6.2, 1.4, -7.77])); z5.add(box(2.3, 0.2, 0.2, C.wood, [6.2, 2.9, -7.72])); for (const s of [-1, 1]) z5.add(box(0.18, 2.9, 0.2, C.wood, [6.2 + s * 1.08, 1.45, -7.72])); z5.add(sign('🦃 TABLE', 0.62, { border: '#d9622b' }, [6.2, 3.5, -7.75]));
    z5.add(P.tableProp(3.9, 1.6, 0.9, C.wood).translateZ(-2.4)); z5.add(box(4.1, 0.05, 1.8, 0xf6ecd6, [0, 0.96, -2.4])); z5.add(box(4.1, 0.06, 0.5, 0xd9622b, [0, 0.97, -2.55]));
    for (const [x, s, c] of [[-0.5, 0.2, 0xe98a2b], [0.1, 0.15, 0xf6ecd6], [0.55, 0.17, 0xe9a23b]]) z5.add(ball(s, s * 0.75, s, c, [x, 1.0 + s * 0.7, -2.85]));
    z5.add(disc(2.6, 0xb5523a, [0, 0.045, -2.2])); z5.add(disc(2.2, 0xd98a4a, [0, 0.05, -2.2]));
    z5.add(sign('🍂 GIVE THANKS 🍂', 0.48, { border: '#d9622b' }, [0.4, 2.62, -7.75])); sideWalls(z5, 8, 0xd9622b, [-5.2, 1.6], 2.9, 12, -2);
        fixed(z5, X5, 0);
    ctx.collideBox(A5(-2.1), -7.1, 6.6, 1.6); ctx.collideBox(A5(3.0), -7.4, 2.1, 0.9); ctx.collideBox(A5(7.15), -1.2, 1.3, 1.8); ctx.collideCircle(A5(-7.1), 1.6, 0.5); ctx.collideBox(A5(-5), 2.6, 2, 0.7); ctx.collideBox(A5(0), -2.4, 4.1, 1.8);
    const fDoor = group([box(0.1, 1.88, 1.7, 0xe3e5e6, [0, 1.0, 0.85]), box(0.04, 0.9, 0.05, 0x8c9196, [-0.11, 1.2, 1.5]), box(0.07, 0.05, 0.05, 0x8c9196, [-0.08, 1.62, 1.5]), box(0.07, 0.05, 0.05, 0x8c9196, [-0.08, 0.78, 1.5])]); bake(fDoor); fDoor.position.set(A5(6.5), 0, -2.05); D(4, fDoor);
    const grandpa = who(4, { shirt: 0x8a5a3a, vest: 0x4f6d4a, pants: 0x4a4a55, hair: C.hair[4], beard: C.hair[5], glasses: true, skin: C.skin[1], expressive: true }, A5(-1.9), -4.0, 0.15);
    const mom5 = who(4, momOpts, A5(0.1), -4.2, 0);
    const sis = who(4, { shirt: C.yellow, dress: 0xd9483b, hair: C.hair[2], hairStyle: 'pony', skin: C.skin[0], scale: 0.68, expressive: true }, A5(2.0), -3.9, -0.2);
    const family = [grandpa, mom5, sis];
    const GX = [-1.2, -0.4, 0.4, 1.2];
    const glasses = GX.map(x => { const f = flute(); f.scale.setScalar(1.5); f.position.set(A5(x), 0.99, -1.95); return D(4, f); });
    const fridgeSpot = [A5(5.5), -1.2], arch = [A5(6.2), -6.9], cellarDoor = [A5(-6.4), -6.9];

    // ================= ZONE 6 — the wine cellar (x≈500, optional) =================
    const z6 = new THREE.Group(), A6 = (x) => X6 + x, sr = seeded(31);
    z6.add(gfloor(18, 11, 0x6f6a62, [0, 0.03, -3], 5, 3)); z6.add(box(18, 4.8, 0.4, 0x857d72, [0, 2.4, -8.5])); for (const s of [-1, 1]) z6.add(box(0.4, 4.8, 11, 0x7a7268, [s * 9, 2.4, -3]));
    for (let i = 0; i < 46; i++) z6.add(box(0.7 + sr() * 0.5, 0.4, 0.06, [0x93897c, 0x786f64, 0x8c8376][i % 3], [-8.4 + sr() * 16.8, 0.3 + Math.floor(sr() * 9) * 0.5, -8.28]));
    for (let i = 0; i < 16; i++) z6.add(plane(1.2 + sr(), 0.9 + sr() * 0.6, i % 2 ? 0x7a746b : 0x645f58, [-8 + sr() * 16, 0.04, -7.5 + sr() * 9]));
    for (const x of [-5.4, 0.2, 5.6]) { z6.add(cyl(0.02, 0.02, 1.0, 0x222222, [x, 4.3, -5], null, 4)); z6.add(sphere(0.24, glow(0xffd88a), [x, 3.7, -5], 7)); }
    z6.add(sign('📅 VINTAGE = HARVEST YEAR', 0.55, { bg: '#3a2418', fg: '#f6ecd6' }, [-4.4, 0.45, -8.22])); z6.add(cone(0.2, 0.4, C.red, [-4.4, 3.72, -8.1], [Math.PI, 0, 0], 4));
    z6.add(picture(1.15, 3.1, (g, W, H) => { g.fillStyle = '#f6ecd6'; g.beginPath(); g.roundRect(0, 0, W, H, 18); g.fill(); g.strokeStyle = '#4a2c17'; g.lineWidth = 8; g.stroke();
      g.fillStyle = '#ffffff'; g.strokeStyle = '#4a2c17'; g.lineWidth = 6; g.beginPath(); g.roundRect(W * 0.2, H * 0.22, W * 0.2, H * 0.6, W * 0.1); g.fill(); g.stroke(); g.fillStyle = '#3f7fd1'; g.beginPath(); g.arc(W * 0.3, H * 0.86, W * 0.17, 0, 7); g.fill(); g.fillRect(W * 0.25, H * 0.5, W * 0.1, H * 0.32);
      g.strokeStyle = '#4a2c17'; g.lineWidth = 4; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(W * 0.44, H * (0.28 + i * 0.075)); g.lineTo(W * 0.56, H * (0.28 + i * 0.075)); g.stroke(); }
      g.fillStyle = '#3f7fd1'; g.beginPath(); g.moveTo(W * 0.46, H * 0.5); g.lineTo(W * 0.6, H * 0.47); g.lineTo(W * 0.6, H * 0.53); g.fill();
      g.fillStyle = '#4a2c17'; g.font = '700 ' + (W * 0.34) + 'px Fredoka,"Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText('55°F', W * 0.5, H * 0.15); }, 160, [-0.7, 1.9, -8.19]));
    { const r = new THREE.Group(); r.add(box(3.2, 2.5, 0.7, 0x5a3d26, [0, 1.25, -0.05])); r.add(box(3.0, 2.3, 0.1, 0x2e2018, [0, 1.25, 0.3]));
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { if ((i + j * 2) % 7 === 6) continue; const x = -1.25 + i * 0.5, y = 0.4 + j * 0.56; r.add(cyl(0.13, 0.13, 0.5, j === 3 && i % 2 ? 0x3a2a22 : 0x24452c, [x, y, 0.25], [Math.PI / 2, 0, 0], 8)); r.add(cyl(0.05, 0.09, 0.22, 0x24452c, [x, y, 0.6], [Math.PI / 2, 0, 0], 6)); r.add(cyl(0.045, 0.045, 0.06, 0xd9b98a, [x, y, 0.73], [Math.PI / 2, 0, 0], 6)); }
      for (let j = 0; j < 5; j++) r.add(box(3.1, 0.06, 0.8, 0x6e4a28, [0, 0.12 + j * 0.56, 0.1])); r.position.set(2.6, 0, -8.0); z6.add(r); }
    z6.add(box(0.9, 1.0, 0.9, 0x9a9288, [6.4, 0.5, -6.4])); z6.add(box(1.1, 0.12, 1.1, 0xa8a096, [6.4, 1.04, -6.4])); z6.add(ball(0.32, 0.06, 0.32, 0x7a1f2e, [6.4, 1.13, -6.4]));
    { const b = bottleLook(2); b.traverse(o => { if (o.isMesh) o.material = mat(o.material.color.getHex() === COL.foil ? 0x8a7a4a : 0x4a5a48); }); b.scale.setScalar(1.5); b.position.set(6.4, 1.15, -6.4); z6.add(b); for (let i = 0; i < 5; i++) z6.add(ball(0.1, 0.03, 0.08, 0xc9c2b4, [6.4 + Math.cos(i * 1.7) * 0.14, 1.5 + i * 0.09, -6.4 + Math.sin(i * 1.7) * 0.14 + 0.08])); }
    z6.add(sign('$2,000', 0.5, { bg: '#fff8e8', fg: '#4a2c17', border: '#e8b63a' }, [7.35, 1.75, -6.1], [0, 0, -0.12])); z6.add(cyl(0.01, 0.01, 0.7, 0x4a2c17, [6.85, 1.85, -6.25], [0, 0, 1.2], 3));
    for (const [x, y, z] of [[-8.1, 0.62, -7.4], [-8.1, 0.62, -6.1], [-8.1, 1.7, -6.75], [7.9, 0.62, -3.6], [7.9, 0.62, -2.3], [7.9, 1.7, -2.95]]) { const b = P.barrel(); b.scale.setScalar(1.5); b.rotation.z = Math.PI / 2; b.position.set(x + 0.75, y, z); z6.add(b); }
    { const c = new THREE.Group(); c.add(ball(0.3, 0.16, 0.2, 0xe9a23b, [0, 0.14, 0])); c.add(sphere(0.13, 0xe9a23b, [0.26, 0.2, 0.08], 6)); for (const s of [-1, 1]) c.add(cone(0.05, 0.1, 0xe9a23b, [0.26 + s * 0.07, 0.34, 0.08], null, 4)); c.add(cyl(0.03, 0.03, 0.4, 0xd98a2b, [-0.3, 0.1, 0.12], [1.2, 0, 0.6], 5)); c.position.set(7.7, 2.27, -3.0); z6.add(c); }
    { const c = P.crate({ s: 1.1, color: 0x8a6a4a }); c.position.set(-2.6, 0, 0.9); z6.add(c); for (let i = 0; i < 4; i++) { const b = bottleLook(3); b.scale.setScalar(1.1); b.position.set(-2.85 + (i % 2) * 0.5, 0.3, 0.65 + Math.floor(i / 2) * 0.5); z6.add(b); } z6.add(sign('MOST WINE IS BEST YOUNG', 0.3, { border: '#6a2c91' }, [-2.6, 1.55, 0.9])); z6.add(box(0.06, 1.4, 0.06, C.woodDark, [-2.6, 0.7, 0.86])); }
    for (let i = 0; i < 5; i++) z6.add(box(1.5 - i * 0.3, 0.3 + i * 0.3, 1.8, 0x8c8478, [-8.05 + i * 0.15 - (1.5 - i * 0.3) / 2 + 0.75, (0.3 + i * 0.3) / 2, -1.2]));
    z6.add(sign('⬆️ HOME', 0.45, { border: '#4a2c17' }, [-7.9, 3.0, -1.2], [0, 0.6, 0]));
    fixed(z6, X6, 0);
    ctx.collideBox(A6(2.6), -8, 3.4, 1.2); ctx.collideBox(A6(6.4), -6.4, 1.2, 1.2); ctx.collideBox(A6(-7.6), -6.8, 2.2, 2.8); ctx.collideBox(A6(8.2), -3, 2.2, 2.8); ctx.collideBox(A6(-2.6), 0.9, 1.3, 1.3); ctx.collideBox(A6(-8), -1.2, 1.8, 2);
    const ICONS = ['⭐', '🌧️', '🔥', '❄️', '☁️'], WCOL = ['#f2c43d', '#6fa8dc', '#e9762b', '#bfe6f5', '#aab4bd'];
    const wheel6 = picture(2.9, 2.9, (g, W) => { const c = W / 2; for (let i = 0; i < 5; i++) { const a0 = -Math.PI / 2 + (i - 0.5) * Math.PI * 2 / 5; g.fillStyle = WCOL[i]; g.beginPath(); g.moveTo(c, c); g.arc(c, c, c - 6, a0, a0 + Math.PI * 2 / 5); g.closePath(); g.fill(); g.strokeStyle = '#4a2c17'; g.lineWidth = 5; g.stroke();
      g.save(); g.translate(c, c); g.rotate(i * Math.PI * 2 / 5); g.font = (W * 0.2) + 'px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ICONS[i], 0, -c * 0.6); g.restore(); }
      g.fillStyle = '#4a2c17'; g.beginPath(); g.arc(c, c, W * 0.06, 0, 7); g.fill(); }, 256);
    wheel6.position.set(A6(-4.4), 2.15, -8.2); D(5, wheel6);
    const dome = cyl(0.42, 0.42, 1.15, 0xffffff, [A6(6.4), 1.7, -6.4], null, 10); dome.material = mat(0xdff3ff, { opacity: 0.25 }); dome.castShadow = false; D(5, dome);
    const stairs6 = [A6(-6.6), -1.2];

    // =================== THE STORY ===================
    ctx.onStart(async () => {
      const TOTAL = 22; let step = 0; const done = () => ctx.progress(++step, TOTAL); ctx.progress(0, TOTAL);

      // (?ch=N starts at chapter N — handy when testing)
      const START = +(new URLSearchParams(location.search).get('ch') || 1), myBottle = slots[1];
      if (START <= 3) ctx.bounds(-13.2, -14.2, 13.4, 5.2);
      if (START <= 1) {
      // ---------- 1. Planting for the years ahead ----------
      ctx.say(grower, 'Will grapes like it here? 🤔');
      ctx.goal('🔍', 'Test the soil', soilSpot);
      await use({ at: soilSpot, icon: '🔍', label: 'Dig', hold: 0.9, sfx: 'dig', y: 2.1, r: 2 });
      await ctx.act('dig', 0.8); ctx.burst([soilSpot[0], 0.2, soilSpot[1]], { color: 0x7a5536, n: 10 }); probe.visible = true; probe.position.y = -0.8; ctx.tween(probe.position, { y: 0 }, 0.4, 'outBack'); ctx.audio.play('ding'); ctx.emote(probe, '✅', { y: 1.6 });
      ctx.fact('🌍', 'Growers choose grape varieties that suit their climate and soil.');
      await ctx.say(grower, 'Perfect spot for purple grapes! 🍇', 2.6); done();
      ctx.say(nurse, 'Young vines from our nursery! 🌱', 2.2);   // short: she stands right at the tray, and her bubble must be gone when the "Pick up" bubble is needed
      ctx.goal('🌱', 'Get young vines', tray);
      await use({ at: tray, icon: '🌱', label: 'Pick up', y: 1.5 });
      hold(tray, 0.03, 0.09, [0.82, 0.66, 0.66]); done();
      let planted = 0;
      ctx.goal('🌱', 'Plant 4 vines', [VX[0], -2.2]);
      for (const x of VX) {
        const mk = cyl(0.32, 0.32, 0.03, 0xffd84a, [x, 0.2, ROWS[0]], null, 12); mk.material = mat(0xffd84a, { opacity: 0.6 }); D(0, mk);
        ctx.interact({ at: [x, -2.2], r: 1.6, y: 2.1, icon: '🌱', label: 'Plant', sfx: 'plant', onUse: async () => {
          faceTo(ctx.player, x, ROWS[0]); ctx.remove(mk); const v = youngVine(); v.position.set(x, 1.0, ROWS[0]); D(0, v); frontYoung.push(v);
          await ctx.tween(v.position, { y: 0.1 }, 0.3, 'in'); ctx.burst([x, 0.2, ROWS[0]], { color: 0x7a5536, n: 8 }); v.scale.setScalar(0.6); ctx.tween(v.scale, { x: 1, y: 1, z: 1 }, 0.5, 'outBack');
          planted++; const next = VX.find(q => !frontYoung.some(f => f.position.x === q)); ctx.goal('🌱', planted < 4 ? 'Plant ' + (4 - planted) + ' more' : 'Planted!', next !== undefined ? [next, -2.2] : null);
        } });
      }
      await ctx.until(() => planted >= 4);
      ctx.remove(ctx.drop()); done();
      ctx.fact('🌱', 'Young vines need strong roots before they can carry much fruit.');
      // the trellis: pull the wire from the first post to the last
      spool.visible = true; spool.scale.setScalar(0.01); ctx.tween(spool.scale, { x: 1, y: 1, z: 1 }, 0.4, 'outBack');
      ctx.say(grower, 'Vines need wires to climb! 🌿');
      ctx.goal('🔗', 'Grab the wire', spool);
      await use({ at: spool, icon: '🔗', label: 'Take', y: 1.3 });
      hold(spool, -0.09, 0.08); wires.forEach(w => { w.visible = true; w.scale.x = 0.01; }); loose.visible = true;
      let reach = -8, tied = false; const hand = new THREE.Vector3();
      const stopWire = ctx.onUpdate(() => {
        const px = clamp(ctx.player.position.x, -8, 8);
        for (const p of POSTS) if (p > reach && px >= p - 0.4) { reach = p; ctx.audio.play('hammer'); ctx.burst([p, 1.5, ROWS[0]], { color: 0xffffff, n: 5, size: 0.14, speed: 1.5 }); }
        wires.forEach(w => { const L = Math.max(0.01, reach + 8); w.scale.x = L; w.position.x = -8 + L / 2; });
        spool.getWorldPosition(hand); const ax = reach, ay = 1.45, az = ROWS[0]; const dx = hand.x - ax, dy = hand.y + 0.15 - ay, dz = hand.z - az, L = Math.hypot(dx, dy, dz);
        loose.position.set(ax + dx / 2, ay + dy / 2, az + dz / 2); loose.scale.z = L; loose.lookAt(hand.x, hand.y + 0.15, hand.z);
      });
      ctx.goal('🔗', 'Pull to last post', [8, -2.1]);
      await ctx.until(() => reach >= 8);
      ctx.goal('🔨', 'Tie it tight', [8, -2.1]);
      await use({ at: [8, -2.1], icon: '🔨', label: 'Tie', sfx: 'hammer', y: 2.2, r: 2.2, toward: [8, ROWS[0]] });
      stopWire(); ctx.remove(loose); ctx.remove(ctx.drop()); ctx.audio.play('success'); done();
      for (const v of frontYoung) ctx.tween(v.scale, { x: 1.25, y: 1.5, z: 1.25 }, 1.2, 'out');
      ctx.thank('🌱', ['Nursery workers', 'Growers', 'Planting crews', 'Trellis builders']);
      await ctx.say(grower, 'Now we wait… for years! ⏳', 2.8);

      }
      if (START <= 2) {
      // ---------- 2. Caring through the seasons ----------
      await ctx.chapter({ n: 2, title: 'Seasons of Care', emoji: '❄️', env: ['snow', GROUND], at: [-9, 0.6], face: Math.PI / 2, setup: () => {
        ctx.remove(youngBack); frontYoung.forEach(v => ctx.remove(v)); ctx.remove(probe); ctx.remove(soilPatch); nurse.visible = false; nurse.position.set(-40, 0, 30); tray.visible = spool.visible = false; wires.forEach(w => { w.visible = true; w.scale.x = 16; w.position.x = 0; }); pick.visible = false; pickCol.remove();
        mature.visible = true; tufts.forEach(t => { t.visible = true; }); snowG.visible = true; flakes.visible = true;
        grower.position.set(-5, 0, 1.6); grower.rotation.y = -1.2;
      } });
      ctx.say(grower, 'Winter: snip the old canes! ✂️');
      let pruned = 0; ctx.goal('✂️', 'Prune 4 vines', [VX[0], -2.2]);
      VX.forEach((x, i) => ctx.interact({ at: [x, -2.2], r: 1.6, y: 2.1, icon: '✂️', label: 'Snip', hold: 0.8, sfx: 'snip', onUse: async () => {
        faceTo(ctx.player, x, ROWS[0]); const t = tufts[i]; ctx.act('work', 0.5); ctx.audio.play('snip'); ctx.after(0.2, () => ctx.audio.play('snip'));
        ctx.tween(t.rotation, { x: 1.5 }, 0.5, 'in'); await ctx.tween(t.position, { y: 0.15, z: ROWS[0] + 0.9 }, 0.5, 'in'); ctx.burst([x, 0.3, ROWS[0] + 0.8], { color: 0xffffff, n: 8, size: 0.16 }); ctx.remove(t); tufts[i] = null;
        pruned++; if (pruned === 1) ctx.fact('✂️', "Pruning sleeping vines guides next season's growth."); const nx = VX.find((q, k) => tufts[k]); ctx.goal('✂️', pruned < 4 ? 'Prune ' + (4 - pruned) + ' more' : 'All pruned!', nx !== undefined ? [nx, -2.2] : null);
      } }));
      await ctx.until(() => pruned >= 4); done();
      await ctx.wait(0.8);
      // spring: leaves pop out, tuck the floppy shoots into the wires
      await ctx.chapter({ env: ['day', GROUND], setup: () => { snowG.visible = false; flakes.visible = false; canopy.visible = true; canopy.scale.set(1, 0.3, 1); canopy.position.y = 1.0; shoots.forEach(s => { s.visible = true; }); } });
      ctx.banner('🌸', 'Spring', 1.6); ctx.audio.play('bird'); ctx.tween(canopy.scale, { y: 1 }, 1.2, 'outBack'); ctx.tween(canopy.position, { y: 0 }, 1.2, 'outBack');
      ctx.say(grower, 'Tuck shoots up — let sunshine in! ☀️');
      let tucked = 0; const TZ = ROWS[1] + 1.0, nextShoot = () => { const p = ctx.player.position; let b = null, bd = 1e9; for (const s of shoots) if (!s.userData.up) { const d = Math.hypot(p.x - s.userData.x, p.z - TZ); if (d < bd) { bd = d; b = s; } } return b ? [b.userData.x, TZ] : null; };
      ctx.goal('🌿', 'Tuck 6 shoots', nextShoot());
      const stopTuck = ctx.onUpdate(() => { if (ctx.locked) return; const p = ctx.player.position; for (const s of shoots) if (!s.userData.up && Math.hypot(p.x - s.userData.x, p.z - TZ) < 1.3) {
        s.userData.up = true; tucked++; ctx.audio.play('pop'); ctx.tween(s.rotation, { x: -0.1 }, 0.45, 'outBack'); ctx.tween(s.position, { z: ROWS[1], y: 1.55 }, 0.45); ctx.emote(s, '☀️', { y: 1.2 });
        ctx.goal('🌿', tucked < 6 ? 'Tuck ' + (6 - tucked) + ' more' : 'Sunny and airy!', nextShoot()); } });
      await ctx.until(() => tucked >= 6); stopTuck(); done();
      ctx.fact('☀️', 'Leaves capture sunlight, and the grapes slowly turn sweeter.');
      await ctx.wait(0.9);
      // summer: green grapes… and hungry starlings
      shoots.forEach(s => ctx.remove(s)); greens.visible = true; greens.scale.setScalar(1); ctx.banner('☀️', 'Summer', 1.6);
      birds.forEach((b, i) => { b.visible = true; const y = b.position.y; b.position.y = y + 9; ctx.tween(b.position, { y }, 0.9 + i * 0.25, 'out'); });
      ctx.audio.play('bird'); ctx.say(grower, 'Starlings love grapes. Shoo! 🐦');
      let shooed = 0; const perches = [[-8, 2.12, -3], [8, 2.12, -3], [0, 2.12, -3], [-4, 0, 1.5], [4.5, 0, 2.2], [-10.5, 0, -1]];
      const nearestBird = () => { const p = ctx.player.position; let best = null, bd = 1e9; for (const b of birds) if (b.userData.state === 'sit') { const d = Math.hypot(b.position.x - p.x, b.position.z - p.z); if (d < bd) { bd = d; best = b; } } return best; };
      ctx.goal('🐦', 'Shoo 4 starlings', nearestBird());
      const stopBirds = ctx.onUpdate((dt, t) => {
        const p = ctx.player.position;
        birds.forEach((b, i) => { const u = b.userData;
          if (u.state === 'fly') { u.wings[0].rotation.z = Math.sin(t * 30) * 0.9; u.wings[1].rotation.z = -Math.sin(t * 30) * 0.9; return; }
          if (u.state !== 'sit') return;
          u.wings[0].rotation.z = u.wings[1].rotation.z = 0; b.rotation.x = Math.max(0, Math.sin(t * 5 + i * 2)) * 0.5; if (Math.sin(t * 0.7 + i * 1.9) > 0.97) b.rotation.y += dt * 6;
          if (ctx.locked || Math.hypot(p.x - b.position.x, p.z - b.position.z) > 2.3) return;
          u.state = 'fly'; u.scares++; b.rotation.x = 0; ctx.audio.play('bird'); ctx.emote(b, '💨', { y: 0.8 });
          if (u.scares >= 2) { shooed++; const to = [b.position.x + (i % 2 ? 14 : -14), 13, -30]; b.rotation.y = Math.atan2(to[0] - b.position.x, to[2] - b.position.z); ctx.tween(b.position, { x: to[0], y: to[1], z: to[2] }, 2.2, 'in').then(() => { b.visible = false; u.state = 'gone'; }); ctx.goal('🐦', shooed < 4 ? 'Shoo ' + (4 - shooed) + ' more' : 'All gone!', null); }
          else { let best = null, bd = -1; for (const q of perches) { if (q.used) continue; const d = Math.hypot(q[0] - p.x, q[2] - p.z); if (d > bd) { bd = d; best = q; } } best.used = true; b.rotation.y = Math.atan2(best[0] - b.position.x, best[2] - b.position.z); hop(b, best, 2.2, 1.1).then(() => { u.state = 'sit'; }); }
        });
        if (shooed < 4) { const nb = nearestBird(); if (nb && ctx._goal && ctx._goal.target !== nb) ctx._goal.target = nb; }
      });
      await ctx.until(() => shooed >= 4); done(); await ctx.wait(1.2); stopBirds();
      ctx.thank('✂️', ['Pruning crews', 'Vineyard workers', 'Agricultural specialists', 'Equipment mechanics']);
      await ctx.wait(1.6);

      }
      if (START <= 3) {
      // ---------- 3. Gathering the harvest ----------
      await ctx.chapter({ n: 3, title: 'Harvest Rush', emoji: '🍇', env: ['autumn', GROUND], at: [-9, 1.2], face: Math.PI / 2, setup: () => {
        ctx.remove(greens); ctx.remove(canopy); canopyA.visible = true; if (START === 3) { pick.visible = false; pickCol.remove(); ctx.remove(youngBack); ctx.remove(probe); ctx.remove(soilPatch); nurse.visible = false; nurse.position.set(-40, 0, 30); tray.visible = spool.visible = false; wires.forEach(w => { w.visible = true; w.scale.x = 16; w.position.x = 0; }); mature.visible = true; } frontBunches.forEach(b => { b.visible = true; }); backBunches.forEach(b => { b.visible = true; });
        myLug.visible = true; harv.visible = true; gTruck.visible = true; ctx.collideBox(11.5, -13.2, 2.6, 6.8); harvCol = ctx.collideBox(11.5, 2.6, 3, 3.2);
        grower.position.set(-7.4, 0, -1.2); grower.rotation.y = 0.3;
      } });
      ctx.say(grower, 'Mmm, sweet! Harvest today! 😋');
      ctx.goal('📦', 'Grab a crate', myLug);
      await use({ at: myLug, icon: '📦', label: 'Take', y: 1.2 });
      hold(myLug, 0.04, 0.09, 0.8); clock.visible = true; hours = 0; hoursCap = 0.6; ctx.fact('⏱️', "Welch's: from vine to press within 8 hours of picking!", 6);
      let picked = 0; const heap = myLug.userData.heap; heap.visible = true;
      const nextBunch = () => { const p = ctx.player.position; let b = null, bd = 1e9; for (const q of frontBunches) if (!q.userData.got) { const d = Math.hypot(p.x - q.position.x, p.z + 2.2); if (d < bd) { bd = d; b = q; } } return b ? [b.position.x, -2.2] : null; };
      ctx.goal('🍇', 'Pick 8 bunches', nextBunch());
      const stopPick = ctx.onUpdate(() => { if (ctx.locked) return; const p = ctx.player.position; for (const b of frontBunches) if (!b.userData.got && Math.hypot(p.x - b.position.x, p.z + 2.2) < 1.35) {
        b.userData.got = true; picked++; hoursCap += 0.25; ctx.audio.play('snip'); const tgt = nextBunch(); ctx.goal('🍇', picked < 8 ? 'Pick ' + (8 - picked) + ' more' : 'Crate is full!', tgt);
        (async () => { const w = new THREE.Vector3(); for (let k = 0; k < 6; k++) { myLug.getWorldPosition(w); b.position.lerp(w.setY(w.y + 0.3), 0.35); b.position.y += 0.25 * (1 - k / 5); await ctx.wait(0.05); } ctx.remove(b); ctx.audio.play('pop'); heap.scale.y = Math.min(1, heap.scale.y + 0.125); ctx.emote(ctx.player, '🍇'); })(); } });
      await ctx.until(() => picked >= 8); stopPick(); await ctx.wait(0.5); done();
      ctx.goal('🚚', 'Tip into the truck', [10.4, -9.4]);
      await use({ at: [10.4, -9.4], icon: '🍇', label: 'Tip in', y: 2.2, r: 2.6, toward: [11.5, -12] });
      ctx.remove(ctx.drop()); ctx.audio.play('thud'); gHeap.visible = true; ctx.tween(gHeap.scale, { y: 0.3 }, 0.5, 'outBack'); ctx.burst([11.5, 1.6, -12], { color: COL.grape, n: 12, size: 0.3 }); hoursCap = 3; done();
      ctx.say(grower, 'The machine picks faster! 🚜');
      ctx.goal('🚜', 'Drive the harvester', harv);
      await use({ at: harv, icon: '🚜', label: 'Drive', y: 4.2, r: 3.6 });
      harvCol.remove(); rowCols[1].concat(rowCols[2]).forEach(c => c.remove()); hoursCap = 5.2;
      ctx.fact('🚜', 'Some vineyards pick by hand; others use mechanical harvesters.');
      ctx.player.userData.forceAnim = 'carry';   // both hands forward, on the steering wheel
      await ctx.ride(harv, [[11.5, -4.6], [9.8, -7]], { speed: 5.2, hide: false, seat: harv.userData.seat });
      // now the player steers: the harvester follows the (seated) player around the two back rows
      const P0 = ctx.player, oldSpeed = ctx.speed, oldDist = ctx.cam.dist; P0.position.set(harv.position.x, 2.95, harv.position.z); P0.rotation.y = harv.rotation.y; P0.userData.sitting = true; P0.userData.forceAnim = 'carry';
      ctx.speed = 4.6; ctx.cam.dist = 14; driving = true; ctx.bounds(-11.8, -13.2, 12.2, -5); let left = backBunches.length, eng = 0;
      const nearBack = () => { let b = null, bd = 1e9; for (const q of backBunches) if (q.parent) { const d = Math.hypot(q.position.x - P0.position.x, q.position.z - P0.position.z); if (d < bd) { bd = d; b = q; } } return b; };
      ctx.goal('🍇', 'Shake them off!', nearBack()); ctx.say(grower, 'Steer along the rows! 🚜', 3);
      const stopShake = ctx.onUpdate((dt, t) => { harv.position.set(P0.position.x, Math.abs(Math.sin(t * 22)) * 0.04, P0.position.z); harv.rotation.y = P0.rotation.y; P0.position.y = 2.95;
        if (Math.hypot(ctx.vel.x, ctx.vel.z) > 1 && (eng -= dt) <= 0) { eng = 0.45; ctx.audio.play('engine'); }
        for (const b of backBunches) if (b.parent && Math.abs(b.position.x - harv.position.x) < 1.4 && Math.abs(b.position.z - harv.position.z) < 1.3) { ctx.burst([b.position.x, 1.0, b.position.z], { color: COL.grape, n: 7, size: 0.3, speed: 2 }); ctx.burst([b.position.x, 1.8, b.position.z], { color: COL.leafA, n: 4, size: 0.2, speed: 2 }); ctx.remove(b); ctx.audio.play('pop'); ctx.cam.shake = 0.05; left--; const nb = nearBack(); ctx.goal('🍇', left ? left + (left === 1 ? ' more vine' : ' more vines') : 'All shaken!', nb); }
        const nb = nearBack(); if (nb && ctx._goal && ctx._goal.target !== nb) ctx._goal.target = nb; });
      await ctx.until(() => left <= 0); stopShake(); driving = false; harv.position.y = 0; ctx.speed = oldSpeed; ctx.cam.dist = oldDist; P0.position.y = 0; P0.userData.sitting = false; ctx.bounds(-13.2, -14.2, 13.4, 5.2);
      ctx.goal('🚚', 'Unload the grapes');
      await ctx.ride(harv, [[harv.position.x, -9], [9.8, -9], [11.5, -8.4], [11.5, -7.2]], { speed: 6, hide: false, seat: harv.userData.seat });
      P0.userData.forceAnim = null; ctx.lock();
      for (let i = 0; i < 12; i++) { const b = sphere(0.2, COL.grape, [11.5 + (i % 3 - 1) * 0.3, 3.6, -8.8], 6); ctx.add(b); hop(b, [11.5 + (i % 3 - 1) * 0.5, 1.5, -11 - (i % 4) * 0.6], 0.8, 0.5).then(() => ctx.remove(b)); ctx.audio.play('pop'); await ctx.wait(0.09); }
      ctx.tween(gHeap.scale, { y: 1 }, 0.6, 'outBack'); done();
      { const beep = ctx.every(0.5, () => ctx.audio.play('beep')); await ctx.moveAlong(harv, [[11.5, 2.6]], 6, { face: false }); beep(); ctx.collideBox(11.5, 2.6, 3, 3.2); ctx.unlock(); }  // the harvester backs out of the way before you get control back
      ctx.thank('🍇', ['Growers', 'Picking crews', 'Harvester operators', 'Truck drivers']);
      ctx.say(grower, 'Quick — to the press! ⏱️');
      ctx.goal('🚚', 'Ride to the press', gTruck);
      await use({ at: gTruck, icon: '🚚', label: 'Hop in', y: 3, r: 4.4 });
      ctx.lock(); ctx.player.visible = false; clock.visible = false; ctx.audio.play('honk'); ctx.bounds(null); ctx.moveAlong(gTruck, [[11.5, -50]], 9); hoursCap = 6; done();
      await ctx.wait(1.6);
      }
      if (START <= 4) {
      // ---------- 4. From grapes to juice ----------
      await ctx.chapter({ n: 4, title: 'The Juice Plant', emoji: '🏭', env: ['factory', { ground: 0x8f8c86, fog: [50, 130] }], at: [A2(-8.4), 0.6], face: -Math.PI / 2, music: 'factory', cam: { yaw: 0, pitch: 0.42, dist: 10.5 }, setup: () => zone(1) });
      ctx.player.visible = true; ctx.unlock(); ctx.bounds(A2(-15.6), -13.9, A2(16.2), 5);
      clock.visible = true; hoursCap = 6.6;
      ctx.say(operator, 'Just in time! Tip them in! ⏱️');
      ctx.goal('🍇', 'Tip the grapes', lever2);
      await use({ at: lever2, icon: '🍇', label: 'Pull', y: 1.9 });
      ctx.lock(); ctx.tween(stick2.rotation, { z: -0.6 }, 0.3); ctx.audio.play('machine'); clockOk = true; ctx.audio.play('success');
      let rolling = true; const stopRoll = ctx.onUpdate((dt) => { if (!rolling) return; rollers[0].rotation.x += dt * 5; rollers[1].rotation.x -= dt * 5; });
      // mini-game: the load is checked on the way in — grapes go to the crusher, leaves and stems go out (each right answer moves one in the scene)
      const grapeIn = (i) => { const b = sphere(0.2, i % 3 ? COL.grape : COL.grapeL, [A2(-12.5 + (i % 3 - 1) * 0.5), 1.4, -3.9], 6); ctx.add(b); hop(b, [A2(-12.5 + (i % 4 - 1.5) * 0.5), 1.1, -1.7 + (i % 2 - 0.5) * 0.5], 0.9, 0.5).then(() => { ctx.burst([b.position.x, 1.2, b.position.z], { color: COL.juice, n: 4, size: 0.2, speed: 1.5 }); ctx.remove(b); ctx.audio.play('splash'); }); };
      let gi = 0; ctx.say(operator, 'Grapes in, leaves out! 🍂', 3);
      await sortGame(ctx, { onIn: () => grapeIn(gi++), onOut: () => { ctx.emote([A2(-12.5), 1.6, -5.5], '🍂', { y: 1.2 }); ctx.burst([A2(-12.5), 1.5, -5.5], { color: 0x8a6a3a, n: 6, size: 0.18, speed: 1.6 }); } });
      ctx.fact('🍂', 'Leaves and stems come out before the grapes are crushed.');
      ctx.tween(heap2.scale, { y: 0.05 }, 1.6, 'linear').then(() => { heap2.visible = false; });
      for (let i = 0; i < 12; i++) { const b = sphere(0.2, i % 3 ? COL.grape : COL.grapeL, [A2(-12.5 + (i % 3 - 1) * 0.5), 1.4, -3.9], 6); ctx.add(b); hop(b, [A2(-12.5 + (i % 4 - 1.5) * 0.5), 1.1, -1.7 + (i % 2 - 0.5) * 0.5], 0.9, 0.5).then(() => { ctx.burst([b.position.x, 1.2, b.position.z], { color: COL.juice, n: 4, size: 0.2, speed: 1.5 }); ctx.remove(b); ctx.audio.play('splash'); }); await ctx.wait(0.1); }
      await pipeA.flow(ctx, 9); pressHeap.visible = true; pressHeap.scale.y = 0.2; ctx.tween(pressHeap.scale, { y: 1 }, 0.6, 'outBack'); ctx.audio.play('pour');
      ctx.after(1.5, () => { clock.visible = false; }); ctx.unlock(); done();
      let pushes = 0, pressing = false; const pressSpot = [A2(-5), -6.2];
      ctx.say(operator, 'Now squeeze! Push the press! 💪');
      ctx.goal('💪', 'Press 3 times', pressSpot);
      const pr = ctx.interact({ at: pressSpot, icon: '💪', label: 'Push', once: false, r: 2.4, y: 2.4, sfx: 'thud', when: () => pushes < 3 && !pressing, onUse: async () => {
        faceTo(ctx.player, A2(-5), -8.5); pressing = true; pushes++; ctx.act('work', 0.7); ctx.tween(capstan.rotation, { y: capstan.rotation.y + 1.6 }, 0.7); ctx.tween(ram.position, { y: 2.55 - pushes * 0.38 }, 0.7); ctx.tween(pressHeap.scale, { y: 1 - pushes * 0.3 }, 0.7); ctx.tween(pressHeap.position, { y: 1.95 - pushes * 0.2 }, 0.7);
        stream.visible = trayJ.visible = true; ctx.audio.play('splash'); ctx.tween(trayJ.position, { y: 0.2 + pushes * 0.035 }, 0.7); ctx.cam.shake = 0.06;
        const squirt = ctx.every(0.12, () => ctx.burst([A2(-3.6), 0.5, -8.5], { color: COL.juice, n: 3, size: 0.16, speed: 1, y: 0 }));
        await ctx.wait(0.75); squirt(); stream.visible = false;
        pomace.visible = true; ctx.tween(pomace.scale, { y: pushes / 3 }, 0.4, 'outBack'); ctx.burst([A2(-7.2), 1.3, -7.2], { color: 0x5a3450, n: 8, size: 0.2, speed: 1.5 }); ctx.audio.play('pop');
        pressing = false; if (pushes < 3) ctx.goal('💪', 'Press ' + (3 - pushes) + ' more', pressSpot);
      } });
      await ctx.until(() => pushes >= 3 && !pressing); pr.remove(); ctx.goal('🍇', 'Juice!', null);
      ctx.say(operator, 'Skins and seeds stay behind! 👍'); ctx.emote(pomace, '🍂', { y: 1 });
      await pipeB.flow(ctx, 8); done();
      const stopSteam = ctx.every(0.5, () => { if (zr[1].visible) ctx.burst([A2(1), 4.8, -12.6], { color: 0xffffff, n: 3, speed: 0.5, size: 0.3, y: 0 }); });
      ctx.goal('💨', 'Watch the steam'); ctx.say(lab, 'Whoosh! Off goes some water! 💨', 3.2); ctx.fact('💧', 'Removing some water makes juice easier to store and transport.'); ctx.audio.play('steam');
      { const puff = ctx.every(0.15, () => ctx.burst([A2(1), 4.7, -12.6], { color: 0xffffff, n: 4, speed: 0.8, size: 0.34, y: 0 })); await ctx.focus([A2(1.6), 2.6, -12.4], 3.2, { dist: 9, pitch: 0.28 }); puff(); }
      const console2 = [A2(6.6), -4.4];
      ctx.goal('🌡️', 'Heat it gently', console2);
      await use({ at: console2, icon: '🌡️', label: 'Heat', y: 2.2, r: 2.2, toward: [A2(6.6), -5.3] });
      coilOn.visible = true; coilOff.visible = false;
      await heatGame((t) => { mercury.scale.y = 0.25 + t / 100 * 1.75; });
      mercury.scale.y = 1.75; ctx.audio.play('steam'); ctx.burst([A2(4.5), 3.2, -8.5], { color: 0xffffff, n: 14, speed: 1.5, size: 0.3 }); coilOn.visible = false; coilOff.visible = true;
      ctx.banner('🌡️', 'Pasteurized!', 1.8); ctx.say(lab, 'Perfect! Not too hot! ✅'); ctx.fact('🌡️', 'Pasteurizing: controlled heat reduces germs that could spoil the juice.');
      await pipeC.flow(ctx, 8); done(); stopRoll();
      ctx.thank('🏭', ['Press operators', 'Processing crews', 'Laboratory technicians', 'Sanitation workers']);
      ctx.goal('➡️', 'Follow the juice', door2);
      await use({ at: door2, icon: '🚪', label: 'Go', y: 2.2, r: 2.6 });
      stopSteam(); ctx.bounds(null);

      }
      if (START <= 5) {
      // ---------- 5. Putting the sparkle in the bottle ----------
      await ctx.chapter({ n: 5, title: 'The Bottling Line', emoji: '🍾', env: ['factory', { ground: 0x8f9498, fog: [50, 130] }], at: [A3(-10.6), -3.4], face: Math.PI / 2, cam: { yaw: 0, pitch: 0.42, dist: 10.5 }, setup: () => zone(2) });
      ctx.bounds(A3(-13.6), -13.9, A3(12.2), 4.6);
      pipeIn.flow(ctx, 9);
      // water that was steamed off at the juice plant goes back in when the drink is made
      ctx.goal('💧', 'Water goes back'); ctx.lock(); await ctx.wait(0.5);
      { const drip = ctx.every(0.12, () => { ctx.burst([A3(-11), 4.3, -9], { color: 0x7fc8ff, n: 4, speed: 0.7, size: 0.2, y: 0 }); }); const wS = ctx.every(0.45, () => ctx.audio.play('water')); ctx.emote([A3(-11), 3.6, -8.2], '💧'); await ctx.say(scientist, 'Water back in. Recipe checked! ✅', 2.6); drip(); wS(); } ctx.unlock();
      ctx.say(scientist, 'Now add the sparkle! ✨');
      ctx.goal('✨', 'Add the bubbles', wheel3);
      const HOLD = 2.4; let gas = 0, fz = 0;
      const carb = new Promise(res => { const it = ctx.interact({ at: wheel3, icon: '✨', label: 'Hold', hold: HOLD, sfx: 'fizz', y: 1.4, r: 2.3, onUse: res });
        const stop = ctx.onUpdate((dt) => { if (it.removed) { stop(); return; } const f = ctx._active === it ? clamp((ctx._holdT || 0) / HOLD, 0, 1) : 0; const rising = f > gas + 1e-4; gas = f; needle.rotation.z = lerp(2.1, -1.0, f);
          if (rising) { wheel3.rotation.y += dt * 5; if ((fz -= dt) <= 0) { fz = 0.18; ctx.audio.play('fizz'); ctx.burst([A3(-11), 1.4, -7.4], { color: 0xf0e6ff, n: 3, size: 0.14, speed: 0.6, y: 0 }); } } }); });
      await carb; needle.rotation.z = -1.0; ctx.audio.play('ding'); fizz.forEach(s => { s.visible = true; });
      const stopFizz = ctx.onUpdate((dt, t) => { if (!zr[2].visible) return; fizz.forEach((s, i) => { s.position.y = 1.1 + ((t * 0.7 + i * 0.37) % 1) * 0.8; }); });
      ctx.fact('🍾', 'The fizz is carbon dioxide gas, squeezed in under pressure.', 6); done();
      await pipeD.flow(ctx, 9);
      // the line: fill → cap (you!) → label → carton
      let packed = 0, lineOn = true, lineT = 0, pourT = 0, jam = 0; const CAPX = 1, SPEED = 1.7;
      ctx.say(lineW, 'Press when the light is green! 💡');
      const capSpot = [A3(CAPX), -3.6]; ctx.goal('🍾', 'Cap 6 bottles', capSpot);
      const under = () => line.find(b => b.on && b.st === 1 && Math.abs(b.x - CAPX) < 0.6);
      const stopLine = ctx.onUpdate((dt) => {
        if (!lineOn) return; lineT += dt; pourT -= dt; drum.rotation.y += dt * 3;
        line.forEach((b, i) => {
          if (!b.on) { if (!b.started && lineT > i * 1.35) { b.started = true; b.on = true; b.o.visible = true; b.x = -7; } return; }
          b.x += SPEED * dt; b.o.position.x = A3(b.x);
          if (b.st === 0 && b.x > -4) { b.st = 1; b.o.userData.set(1); if (pourT <= 0) { pourT = 0.3; ctx.audio.play('pour'); } ctx.burst([A3(-4), 1.8, -5], { color: COL.juice, n: 3, size: 0.14, speed: 0.5, y: 0 }); }
          if (b.st === 1 && b.x > 3.3) { b.on = false; ctx.audio.play('boing'); let re = -3.4; while (re > -6.6 && line.some(q => q !== b && q.on && Math.abs(q.x - re) < 1.25)) re -= 0.65; hop(b.o, [A3(re), 0.97, -5], 1.6, 0.7).then(() => { b.x = re; b.on = true; }); }
          if (b.st === 2 && b.x > 5.5) { b.st = 3; b.o.userData.set(3); ctx.audio.play('pop'); }
          if (b.st === 3 && b.x > 8.7) { b.on = false; b.st = 4; hop(b.o, [A3(10.4), 1.0, -5], 0.8, 0.4).then(() => { b.o.visible = false; packed++; if (packed === 1) ctx.fact('🔒', 'Bottles are sealed tight so the drink keeps its fizz.'); ctx.audio.play('pickup'); ctx.tween(box3.scale, { y: 1.15 }, 0.1).then(() => ctx.tween(box3.scale, { y: 1 }, 0.15)); if (packed < 6) ctx.goal('🍾', 'Cap ' + (6 - packed) + ' more', capSpot); }); }
        });
        jam = Math.max(0, jam - dt); const u = !!under() && jam <= 0; lampG.visible = u; lampR.visible = !u; capper.ready = u;
        if (capper.el && capper._green !== u) { capper._green = u; capper.el.style.background = u ? '#a9ee8f' : ''; }   // the "Cap!" bubble itself turns green with the lamp (on a phone the bubble can hide the lamp)
      });
      const capper = ctx.interact({ at: capSpot, icon: '👇', label: 'Cap!', once: false, r: 2.2, y: 2.6, sfx: 'click', when: () => lineOn && jam <= 0, onUse: () => {
        faceTo(ctx.player, A3(CAPX), -5); const b = under(); ctx.tween(capHead.position, { y: 1.48 }, 0.07, 'in').then(() => ctx.wait(b ? 0 : 0.5)).then(() => ctx.tween(capHead.position, { y: 1.9 }, 0.18, 'out'));
        if (b) { b.st = 2; b.o.userData.set(2); ctx.audio.play('ding'); ctx.burst([A3(b.x), 1.7, -5], { color: COL.foil, n: 8, size: 0.14, speed: 1.6 }); ctx.emote(b.o, '✨', { y: 1 }); } else { jam = 0.8; ctx.audio.play('error'); ctx.cam.shake = 0.04; }
      } });
      await ctx.until(() => packed >= 6); lineOn = false; capper.remove(); stopLine(); lampG.visible = false; lampR.visible = true; ctx.audio.play('success'); done();
      ctx.thank('🍾', ['Food scientists', 'Bottling crews', 'Bottle makers', 'Label printers', 'Packaging workers']);
      ctx.goal('📦', 'Carry the carton', box3);
      await use({ at: box3, icon: '📦', label: 'Lift', y: 1.0, r: 2.6 });
      hold(box3, 0.04, 0.09, 0.72); ctx.say(loader, 'Off to the stores! 🚚'); ctx.goal('🚚', 'Load the truck', truck3);
      await use({ at: truck3, icon: '🚚', label: 'Load & go', y: 3.2, r: 4.2 });
      ctx.remove(ctx.drop()); ctx.audio.play('thud'); done();
      ctx.lock(); ctx.player.visible = false; ctx.audio.play('honk'); ctx.bounds(null); ctx.moveAlong(truck3, [[A3(14), 30]], 9); await ctx.wait(1.5); stopFizz();

      }
      if (START <= 6) {
      // ---------- 6. The store ----------
      const box4 = carton(sign('🍇', 0.34, { bg: null }));
      await ctx.chapter({ n: 6, title: 'The Store', emoji: '🛒', env: ['indoor', { ground: 0xd9d4c6, top: '#e9e4d6', bottom: '#f6f2e8', fog: false }], at: [A4(5.5), 1.6], face: -Math.PI / 2, music: 'town', cam: { yaw: 0, pitch: 0.5, dist: 10 }, setup: () => { zone(3); hold(box4, 0.04, 0.09, 0.72); } });
      ctx.player.visible = true; ctx.unlock(); ctx.bounds(A4(-11.5), -11.4, A4(10.5), 4.4);
      ctx.say(stocker, 'Right on time! Fill the shelf! 📦'); ctx.fact('🚚', 'Bottles travel through warehouses and delivery trucks to reach stores.');
      ctx.goal('📦', 'Stock the shelf', shelfSpot);
      await use({ at: shelfSpot, icon: '📦', label: 'Stock', y: 2.2, r: 2.4, toward: [A4(4.5), -6.5] });
      ctx.remove(ctx.drop());
      for (const b of slots) { b.visible = true; const y = b.position.y; b.position.y = y + 1.2; b.scale.setScalar(0.3); ctx.tween(b.scale, { x: 1.15, y: 1.15, z: 1.15 }, 0.25, 'outBack'); ctx.tween(b.position, { y }, 0.3, 'outBounce'); ctx.audio.play('pop'); await ctx.wait(0.22); }
      ctx.act('cheer', 1.2, stocker); ctx.emote(stocker, '🙌'); done();
      faceTo(mom4, A4(4.5), -5); await ctx.say(mom4, 'Juice for our toast, please! 🥂', 2.2);
      ctx.goal('🥂', 'Take a bottle', shelfSpot);
      await use({ at: shelfSpot, icon: '🥂', label: 'Take', y: 2.2, r: 2.4, toward: [A4(4.5), -6.5] });
      hold(myBottle, -0.02, 0.06, 0.8);
      const paySpot = [A4(-5.7), -0.6]; ctx.goal('💵', 'Pay the cashier', paySpot);
      await use({ at: paySpot, icon: '💵', label: 'Pay', r: 1.7, y: 2.1, toward: [A4(-8.7), -0.6] });
      // mini-game: count out the right number of bills (the cashier only hints when the count is off)
      ctx.say(cashier, 'That is 4 dollars, please! 💵', 3); await payGame(ctx, { price: 4 });
      await ctx.say(cashier, 'Happy Thanksgiving! 🧡', 2); done();
      ctx.thank('🛒', ['Warehouse crews', 'Truck drivers', 'Stockers', 'Cashiers']);
      await ctx.wait(1.3); ctx.bounds(null);

      }
      // ---------- 7. Home: chill, pop, pour, toast ----------
      const HOME = ['indoor', { ground: 0xb98a5e, top: '#f3dfb8', bottom: '#f8ead0', fog: false }], HCAM = { yaw: 0, pitch: 0.48, dist: 9 };
      await ctx.chapter({ n: 7, title: 'Home for Thanksgiving', emoji: '🏡', env: HOME, at: [A5(-5.4), -0.5], face: Math.PI / 2, music: 'table', cam: HCAM, setup: () => zone(4) });
      ctx.bounds(A5(-7.3), -6.3, A5(7.3), 3.4);
      if (!ctx.carrying) { myBottle.visible = true; hold(myBottle, -0.02, 0.06, 0.8); }
      ctx.say(mom5, 'Chill it first! ❄️');
      ctx.goal('❄️', 'Chill the bottle', fridgeSpot);
      await use({ at: fridgeSpot, icon: '❄️', label: 'Chill', y: 2.2, r: 2, toward: [A5(7.15), -1.2] });
      ctx.lock(); await ctx.tween(fDoor.rotation, { y: -1.7 }, 0.4); { const w = new THREE.Vector3(); myBottle.getWorldPosition(w); ctx.drop(); myBottle.position.copy(w); } D(4, myBottle); await hop(myBottle, [A5(6.8), 0.84, -1.2], 0.5, 0.4);
      await ctx.tween(fDoor.rotation, { y: 0 }, 0.35); ctx.audio.play('thud');
      for (let i = 0; i < 3; i++) { ctx.emote(fDoor, '❄️', { y: 1.4 + i * 0.3 }); ctx.audio.play('sparkle'); await ctx.wait(0.5); }
      await ctx.tween(fDoor.rotation, { y: -1.7 }, 0.4); hold(myBottle, -0.02, 0.06, 0.8); ctx.burst(ctx.player.userData.carryAnchor, { color: 0xdff3ff, n: 10, size: 0.14, speed: 1 }); ctx.tween(fDoor.rotation, { y: 0 }, 0.35); ctx.unlock(); done();
      const tableSpot = [A5(0), -1.0];
      ctx.say(grandpa, 'Nice and cold. Open it up! 🍾');
      ctx.goal('🍾', 'Pop it open', tableSpot);
      await use({ at: tableSpot, icon: '🍾', label: 'Twist', hold: 1.0, y: 2.2, r: 2.6 });
      ctx.player.rotation.y = Math.PI;   // face the table
      { const w = new THREE.Vector3(); myBottle.getWorldPosition(w); const cap = cyl(0.08, 0.08, 0.06, COL.foil, [w.x, w.y + 0.8, w.z], null, 7); ctx.add(cap); ctx.audio.play('cork'); ctx.cam.shake = 0.12; ctx.burst([w.x, w.y + 0.8, w.z], { color: 0xffffff, n: 18, size: 0.14, speed: 2 }); hop(cap, [w.x - 3, 0.05, w.z + 1.5], 3.2, 1.0); ctx.after(3, () => ctx.remove(cap)); ctx.audio.play('fizz'); }
      family.forEach(p => ctx.act('cheer', 1.0, p)); ctx.fact('✨', 'Opening the bottle drops the pressure; the gas escapes as bubbles.');
      await ctx.say(grandpa, 'Pop! Hear that fizz! ✨', 2.2);
      let poured = 0; ctx.goal('🥂', 'Pour 4 glasses', [A5(GX[0]), -1.0]);
      GX.forEach((x, i) => ctx.interact({ at: [A5(x), -1.0], icon: '🥂', label: 'Pour', sfx: 'pour', r: 1.0, y: 2.2, onUse: async () => {
        // mini-game: hold to pour, let go at the line before the fizz spills (the real glass fills as you pour)
        const j = glasses[i].userData.juice; j.visible = true; ctx.player.rotation.y = Math.PI; glasses[i].userData.full = true; ctx.player.userData.forceAnim = 'work';   // (the player turns to the table, so the bottle is over the glasses)
        await pourGame(ctx, { onLevel: (f) => { j.scale.y = Math.max(0.01, f); } }); ctx.player.userData.forceAnim = null; ctx.tween(j.scale, { y: 1 }, 0.4, 'out'); ctx.audio.play('fizz');
        if (poured === 1) ctx.fact('🥂', 'Pour slowly: less foam, and more fizz stays in the glass.');
        const bub = ctx.every(0.16, () => ctx.burst([A5(x), 1.38, -1.95], { color: 0xffffff, n: 2, size: 0.07, speed: 0.25, y: 0 })); ctx.after(1.6, bub);
        poured++; const nx = GX.find((q, k) => !glasses[k].userData.full); ctx.goal('🥂', poured < 4 ? 'Pour ' + (4 - poured) + ' more' : 'Cheers!', nx !== undefined ? [A5(nx), -1.0] : null);
      } }));
      await ctx.until(() => poured >= 4); await ctx.wait(0.9); done();
      family.forEach(p => { p.userData.anim = 'cheer'; }); ctx.audio.play('clink'); ctx.after(0.35, () => ctx.audio.play('clink')); family.forEach((p, i) => ctx.after(i * 0.2, () => ctx.emote(p, '🥂', { y: 2.3 * p.scale.y })));
      ctx.thank('🥂', ['Whoever remembered the juice', 'Those serving at home', 'Many people we may never know']);   // at the toast itself, so the card is read before the walk to the table
      await ctx.say(sis, 'Bubbles for everyone! Cheers! 🥂', 2.4);
      family.forEach((p, i) => { p.userData.anim = i === 1 ? 'laugh' : 'talk'; });
      await ctx.wait(3);
      // everything onto a tray for the big table
      const trayT = group([box(0.9, 0.04, 0.46, 0xb9bec4, [0, 0.02, 0])]); for (let i = 0; i < 4; i++) { trayT.add(cyl(0.05, 0.03, 0.2, COL.grapeL, [-0.36 + i * 0.18, 0.25, 0.08], null, 7)); trayT.add(cyl(0.012, 0.012, 0.14, 0xe8f4fa, [-0.36 + i * 0.18, 0.09, 0.08], null, 5)); trayT.add(cyl(0.06, 0.06, 0.015, 0xe8f4fa, [-0.36 + i * 0.18, 0.03, 0.08], null, 7)); } { const b = bottleLook(3); b.scale.setScalar(0.62); b.position.set(0.3, 0.04, -0.08); trayT.add(b); } bake(trayT);
      glasses.forEach(g => ctx.remove(g)); ctx.remove(ctx.drop()); hold(trayT, 0.13, 0.06); ctx.audio.play('sparkle'); done();   // the tray lies on top of both arms
      // optional epilogue: the wine cellar
      ctx.say(grandpa, 'Curious how wine ages? Peek downstairs! 🍷', 4);
      const toTable = () => ctx.goal('🦃', 'To the table!', arch); toTable();
      let inCellar = false;
      ctx.interact({ at: cellarDoor, icon: '🍷', label: 'Cellar (extra)', y: 2.1, r: 2.2, when: () => !inCellar && !ctx.finished, onUse: async () => {
        inCellar = true; ctx.bounds(null);
        await ctx.chapter({ title: 'The Wine Cellar', emoji: '🍷', env: ['night', { top: '#1c1512', bottom: '#3a2f27', sun: 0xffc890, sunI: 1.7, amb: 1.5, ground: 0x3a332c, fog: false }], at: [A6(-3.6), -2.4], face: Math.PI / 2, music: 'calm', cam: { yaw: 0, pitch: 0.45, dist: window.innerHeight < 480 ? 10.8 : 9 }, setup: () => zone(5) });   // sideways phone: a step further back, so the wheel and the thermometer on the wall stay clear of the goal chip
        ctx.bounds(A6(-8.2), -7.6, A6(8.2), 2);
        const spots = { wheel: [A6(-4.4), -7.3], temp: [A6(-0.7), -7.4], rack: [A6(2.6), -6.9], rare: [A6(6.4), -5.2] }, seen = new Set();
        const next = () => { const k = Object.keys(spots).find(q => !seen.has(q)); if (k) ctx.goal('🔍', 'Look around', spots[k]); else ctx.goal('⬆️', 'Back upstairs', stairs6); };
        const see = (k) => { seen.add(k); next(); }; next();
        let spin = 0, spinning = false, lookT = 0; const free = () => !spinning && ctx.time >= lookT, looked = () => { lookT = ctx.time + 5.2; };
        const its = [
          ctx.interact({ at: spots.wheel, icon: '🎡', label: 'Spin', once: false, y: 2.4, r: 2.2, when: free, onUse: async () => { faceTo(ctx.player, spots.wheel[0], -8.2); spinning = true; spin++; const k = [1, 0, 2, 3, 4][(spin - 1) % 5]; const turns = Math.ceil(wheel6.rotation.z / (Math.PI * 2)) + 2; ctx.audio.play('whoosh');
            await ctx.tween(wheel6.rotation, { z: turns * Math.PI * 2 + k * Math.PI * 2 / 5 }, 1.6, 'out'); ctx.audio.play(k === 0 ? 'success' : 'boing'); ctx.emote(wheel6, k === 0 ? '⭐' : '😕', { y: 0.2 }); ctx.emote(wheel6, ICONS[k], { y: 1.2 });
            if (spin === 1) ctx.fact('📅', "Same vines, new weather — each harvest year's grapes differ.", 6); see('wheel'); looked(); spinning = false; } }),
          ctx.interact({ at: spots.temp, icon: '🌡️', label: 'Look', y: 2.4, r: 2, when: free, onUse: () => { faceTo(ctx.player, spots.temp[0], -8.2); ctx.fact('🌡️', 'Cellars stay cool, dark and steady — about 55°F.', 6); see('temp'); looked(); } }),
          ctx.interact({ at: spots.rack, icon: '🍾', label: 'Look', y: 2.4, r: 2, when: free, onUse: () => { faceTo(ctx.player, A6(2.6), -8); ctx.fact('🍾', 'Cork-sealed bottles usually rest on their sides.', 6); see('rack'); looked(); } }),
          ctx.interact({ at: spots.rare, icon: '💰', label: 'Look', y: 2.6, r: 2.2, when: free, onUse: () => { faceTo(ctx.player, A6(6.4), -6.4); ctx.fact('💰', 'Rare bottles can cost thousands — like rare paintings.', 6); see('rare'); looked(); } }),
        ];
        await use({ at: stairs6, icon: '⬆️', label: 'Upstairs', y: 2.2, r: 2.2, when: () => !spinning });
        its.forEach(i => i.remove()); ctx.bounds(null);
        await ctx.chapter({ env: HOME, at: [A5(-6.2), -5.6], face: 0.6, music: 'table', cam: HCAM, setup: () => zone(4) });
        ctx.bounds(A5(-7.3), -6.3, A5(7.3), 3.4); inCellar = false; toTable();
      } });
      await use({ at: arch, icon: '🦃', label: 'To the table', y: 2.3, r: 2.4, when: () => !inCellar });
      ctx.say(grandpa, 'Thank you, everyone! 💛', 2);
      ctx.finish();
    });
    // pasteurizer mini-game: hold to heat, keep the juice in the green band for 3 seconds. Cannot fail.
    const heatGame = (onTemp) => new Promise(res => {
      const NW = window.innerWidth < 480;   // upright phone: tighter spacing, so the thermometer keeps its full width
      const p = ctx.ui.panel('<div style="display:flex;gap:' + (NW ? 12 : 30) + 'px;align-items:center;padding:8px ' + (NW ? 2 : 20) + 'px">' +
        '<div style="position:relative;flex:none;width:74px;height:290px;border-radius:37px;background:#fff;border:5px solid #4a2c17;overflow:hidden">' +
        '<div style="position:absolute;left:0;right:0;bottom:58%;height:24%;background:#9be08a"></div>' +
        '<div data-m style="position:absolute;left:34%;right:34%;bottom:0;height:8%;background:#e0483b;border-radius:15px 15px 0 0"></div></div>' +
        '<div style="position:relative;flex:none;width:44px;height:290px;margin-left:' + (NW ? -6 : -18) + 'px"><div class="em" style="position:absolute;bottom:58%;height:24%;left:0;display:flex;align-items:center;font-size:34px">😊</div></div>' +
        '<div style="width:240px;flex:0 1 240px;min-width:0"><div data-f class="em" style="font-size:76px;line-height:96px">❄️</div>' +
        '<div style="height:26px;border-radius:13px;background:#e6dcc8;overflow:hidden;margin:10px 0 20px"><div data-b style="height:100%;width:0%;background:#6cc04a"></div></div>' +
        '<button class="btn big" data-h style="touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;min-width:0"><span class="em">🔥</span> Hold</button></div></div>');
      const q = (s) => p.el.querySelector('[data-' + s + ']'), m = q('m'), f = q('f'), b = q('b'), btn = q('h');
      let held = false, temp = 8, good = 0, over = false, sfx = 0, face = '';
      const isKey = (e) => e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter';
      let pid = null; p.el.addEventListener('contextmenu', (e) => e.preventDefault());   // phones: a long press must not open the browser's menu; only the finger that pressed the button can let go of it
      const down = (e) => { held = true; pid = e.pointerId; e.preventDefault(); }, up = (e) => { if (e && pid !== null && e.pointerId !== undefined && e.pointerId !== pid) return; held = false; }, kd = (e) => { if (ctx.disposed) return clean(); if (isKey(e)) { held = true; e.preventDefault(); } }, ku = (e) => { if (isKey(e)) held = false; };
      const clean = () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
      btn.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      const stop = ctx.onUpdate((dt) => {
        if (over) return; temp = clamp(temp + (held ? 40 : -28) * dt, 4, 100); const ok = temp >= 58 && temp <= 82; if (ok) good += dt;
        m.style.height = temp + '%'; m.style.background = temp > 82 ? '#ff8a2a' : '#e0483b'; const fc = temp > 82 ? '🔥' : ok ? '😊' : '❄️'; if (fc !== face) { face = fc; f.textContent = fc; }
        b.style.width = Math.min(100, good / 3 * 100) + '%'; onTemp && onTemp(temp);
        if (held && (sfx -= dt) <= 0) { sfx = 0.4; ctx.audio.play(ok ? 'bubble' : 'fire'); }
        if (good >= 3) { over = true; stop(); clean(); ctx.audio.play('success'); p.close(); res(); }
      });
    });
    let harvCol = null;
  },
};
