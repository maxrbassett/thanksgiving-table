// The Turkey — "Many hands, one Thanksgiving table".
// Build the barn → hatchery → feeding & caring → processing plant → cold chain & store → home kitchen.
import { THREE, C, box, cyl, sphere, ball, cone, group, mat, glow, sign, emojiSprite, seeded, plane, lathe, torus, tube, bake, picture, grain } from '../core/kit.js';
import * as P from '../core/props.js';
import { turkeyBird, poult, egg, packTurkey, roastTurkey, fanBlades, prism, cornClump, combine, bulldozer, forklift, carton, makeFlock } from './turkey-parts.js';
import { feedMixGame, thermometerGame, labelMatchGame } from './turkey-games.js';

export default {
  id: 'turkey', title: 'The Turkey', emoji: '🦃', music: 'farm',
  question: 'How does the turkey end up on your table?',
  thanksLine: 'Many hands, one golden turkey — thank you, every one!',

  create(ctx) {
    const rnd = seeded(7), PI = Math.PI, DEV = new URLSearchParams(location.search);
    const use = (o) => new Promise(res => ctx.interact(Object.assign({}, o, { onUse: res })));
    const dyn = (g) => { bake(g); g.userData.dynamic = true; return g; };
    const flock = makeFlock(ctx, seeded(21)); ctx._tk = { flock };
    const spin = []; ctx.onUpdate((dt) => { for (const s of spin) if (s.visible && s.userData.on) s.rotation.z += dt * 9; });
    let held = 0; const leave = () => { ctx.lock(); held++; }, arrive = () => { while (held > 0) { ctx.unlock(); held--; } };
    // a big flat surface with the kit's soft grain on it (not baked: 1 draw) — used for the largest floor of a zone
    const grained = (w, d, color, rep, pos, repY) => { const t = grain(rep); if (repY) t.repeat.set(rep, repY); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color, map: t })); m.rotation.x = -PI / 2; m.position.set(pos[0], pos[1], pos[2]); m.receiveShadow = true; return m; };
    // carried things rest on the player's straight, forward-pointing arms: shrunk (s) to stay below the chin, pushed forward (z) clear of the chest
    const hold = (obj, s = 1, y = 0, z = 0) => { ctx.carry(obj); ctx.stopTweens(obj.scale); ctx.tween(obj.scale, { x: s, y: s, z: s }, 0.15, 'out'); obj.position.set(0, y, z); return obj; };
    const holdPack = (t) => hold(t, 0.85, 0, 0.07), holdSack = (s) => hold(s, 0.9, -0.44, 0.05); // a wrapped turkey on the hands; a feed sack hugged between the arms
    // Every zone's own things are registered here, and only the zone the player is in is drawn: the camera can be turned to look
    // along X, straight at the other zones (indoors there is no fog to hide them). Layers are used, so the story's own .visible flags stay untouched.
    const zones = {}; let zb = 1; const zAlso = (o, z) => { (zones[z] || (zones[z] = [])).push(o); return o; }, zreg = (o) => zAlso(o, zb);
    const zAdd = (...a) => zreg(ctx['add'](...a)), zPerson = (...a) => zreg(ctx['person'](...a)), zStatic = (...a) => zreg(ctx['addStatic'](...a));
    const zFree = (o) => { for (const z in zones) { const i = zones[z].indexOf(o); if (i >= 0) zones[z].splice(i, 1); } o.traverse(c => c.layers.set(0)); return o; }; // (something the player carries away with them)
    const showZone = (n) => { for (const z in zones) if (+z !== n) for (const o of zones[z]) o.traverse(c => c.layers.set(1)); for (const o of zones[n] || []) o.traverse(c => c.layers.set(0)); };
    // cut-scene camera shots: an upright phone sees only about half as wide as a computer screen, so there the camera stands further back
    const shot = (d) => (window.innerWidth < window.innerHeight ? d * 1.5 : d), upright = () => window.innerWidth < window.innerHeight;
    const hop = (o, h = 0.5, d = 0.35) => ctx.tween(o.position, { y: o.position.y + h }, d / 2, 'out').then(() => ctx.tween(o.position, { y: o.position.y - h }, d / 2, 'in'));

    // ================= ZONE 1 — the farm: building site, feed mill, corn field (around 0,0) =================
    ctx.env('day');
    const z1 = new THREE.Group();
    z1.add(plane(130, 3.4, C.dirt, [0, 0.03, 11]));                         // farm road
    z1.add(grained(19, 11, 0xb89468, 5, [-2, 0.025, -8], 3));                        // cleared ground for the barn
    for (let i = 0; i < 3; i++) { const m = P.mountain({ h: 20 + i * 7 }); m.position.set(-60 + i * 55, 0, -100); z1.add(m); }
    z1.add(P.scatter(22, 120, 60, (r) => P.tree({ h: 3.5 + r() * 3, kind: r() < 0.3 ? 'pine' : 'round' }), { seed: 4, keep: (x, z) => (z < -12 || x < -24 || x > 34) && z < -3 }).translateX(6).translateZ(-8));
    z1.add(P.scatter(14, 90, 40, () => P.bush(), { seed: 6, keep: (x, z) => (z < -9 || x < -22) && z < 8 }).translateX(6).translateZ(-8));
    z1.add(P.scatter(28, 70, 7, () => P.flower(), { seed: 9 }).translateX(6).translateZ(2.2));
    z1.add(P.scatter(9, 60, 5, () => P.bush({ s: 0.6 }), { seed: 12 }).translateX(8).translateZ(8.2)); z1.add(P.scatter(8, 50, 3, (r) => P.rock({ s: 0.4 + r() * 0.3, ry: r() * 6 }), { seed: 14, keep: (x, z) => Math.abs(x - 10) > 3 }).translateX(4).translateZ(5.6));
    { const f = P.fence(64); f.position.set(8, 0, 13.6); z1.add(f); const h = P.house(); h.position.set(-27, 0, -14); h.rotation.y = 0.5; z1.add(h); }
    for (const [x, z] of [[-19, -1], [-21, -6], [38, -2]]) { const hb = P.haybale(); hb.position.set(x, 0, z); hb.rotation.y = x; z1.add(hb); }
    // water tank + pipe (a piece is missing until the player fits it)
    z1.add(cyl(1.1, 1.1, 1.7, 0x4a8fd0, [-15.6, 2.4, -2.8], null, 12)); z1.add(cone(1.2, 0.5, 0x3a6fa8, [-15.6, 3.5, -2.8], null, 12));
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) z1.add(cyl(0.07, 0.07, 1.6, C.steel, [-15.6 + a * 0.7, 0.8, -2.8 + b * 0.7], null, 5));
    z1.add(cyl(0.09, 0.09, 1.5, C.steel, [-15.6, 0.9, -2.8], null, 6)); z1.add(cyl(0.09, 0.09, 1.7, C.steel, [-14.75, 0.15, -2.8], [0, 0, PI / 2], 6)); z1.add(cyl(0.09, 0.09, 1.5, C.steel, [-11.15, 0.15, -2.8], [0, 0, PI / 2], 6)); z1.add(cyl(0.09, 0.09, 1.3, C.steel, [-10.4, 0.15, -3.4], [PI / 2, 0, 0], 6));
    // power pole
    z1.add(cyl(0.12, 0.15, 5.6, C.woodDark, [8.6, 2.8, -4.8], null, 6)); z1.add(box(1.8, 0.14, 0.14, C.woodDark, [8.6, 5.1, -4.8])); z1.add(cyl(0.28, 0.28, 0.7, 0x8c8c8c, [8.95, 4.4, -4.8], null, 8)); z1.add(box(0.5, 0.7, 0.3, 0x5c6670, [8.6, 1.35, -4.55]));
    z1.add(sign('⚡', 0.34, { bg: '#ffd84a' }, [8.6, 1.5, -4.39]));
    // surveyor's tripod
    const tripod = dyn(group([...[0, 2.1, 4.2].map(a => group([cyl(0.025, 0.025, 1.5, 0xe9a23b, [0.22, 0.7, 0], [0, 0, 0.3], 4)], null, [0, a, 0])), box(0.3, 0.2, 0.22, 0x3a3a3a, [0, 1.48, 0]), cyl(0.06, 0.06, 0.3, 0xf2c43d, [0, 1.5, 0.1], [PI / 2, 0, 0], 6)], [3.8, 0, 0.3], [0, -0.6, 0])); zAdd(tripod);
    // feed mill: silo + mill house + pipe
    { const s = P.silo({ h: 7, r: 1.5 }); s.position.set(11.2, 0, -12); z1.add(s); const b = P.building({ w: 6, h: 5.2, d: 4, color: 0xeadfc6, roof: 'gable', roofColor: 0x4f7d5a, doorColor: 0x4f7d5a, windows: 0, sign: '🌽 FEED MILL', signH: 0.85, trim: 0x4f7d5a }); b.position.set(16.4, 0, -11.6); z1.add(b);
      z1.add(tube([[11.2, 8.4, -12], [12.6, 9.2, -11.8], [14.6, 7.6, -11.6], [15.4, 6.4, -11.4]], 0.14, C.steel)); }
    z1.add(P.fieldRows(12, 11, 4).translateX(26.5).translateZ(-8));
    { const f = P.fence(13); f.position.set(26.5, 0, -14.2); z1.add(f); const f2 = P.fence(11.6); f2.rotation.y = PI / 2; f2.position.set(33.3, 0, -8.2); z1.add(f2); const sp = P.signpost('🌽', { h: 1.8 }); sp.position.set(20.2, 0, -1.6); z1.add(sp); }
    zStatic(z1);
    ctx.collideCircle(-15.6, -2.8, 1.3); ctx.collideCircle(8.6, -4.8, 0.35); const tripodC = ctx.collideCircle(3.8, 0.3, 0.5); ctx.collideCircle(11.2, -12, 1.7); ctx.collideBox(16.4, -11.6, 6.2, 4.2); ctx.collideBox(33.3, -8.2, 0.4, 11.6); ctx.collideBox(26.5, -14.2, 13, 0.4);
    for (const [x, z] of [[-19, -1], [-21, -6]]) ctx.collideCircle(x, z, 0.9);
    for (let i = 0; i < 4; i++) { const c = P.cloud({ s: 2.5 + i * 0.4 }); zAdd(c, -50 + i * 36, -70 - i * 6); c.position.y = 24 + (i % 2) * 5; c.userData.dynamic = true; }
    const surveyor = zPerson({ hat: 'hardhat', hatColor: 0xfafafa, vest: 0xe6f03c, shirt: 0x3f7fd1, pants: 0x4a4a55, skin: C.skin[3], hair: C.hair[1], expressive: true }, 2.6, 1.4, -0.4);
    const builder = zPerson({ hat: 'hardhat', vest: 0xff8a1f, shirt: 0xd9483b, pants: 0x3b5b8c, skin: C.skin[1], hair: C.hair[2], beard: C.hair[2], expressive: true }, -5.5, 1.2, 0.3);
    // the barn, in pieces
    const BX = -2, BZ = -8, SW = 16 / 3, WH = 3.4, RED = 0xb5382c;
    const slab = group([box(16, 0.16, 8, C.concrete, [8, 0.08, 0])], [BX - 8, 0, BZ]); slab.scale.x = 0.001; slab.visible = false; zAdd(slab);
    const mounds = dyn(group([ball(1.4, 0.5, 1.1, 0x9a7448, [-7, 0.1, -10]), ball(1.1, 0.4, 1.3, 0x9a7448, [-3, 0.1, -6.5]), ball(1.5, 0.55, 1.0, 0x9a7448, [2.5, 0.1, -9.5]), ball(1.0, 0.4, 1.0, 0x8a6a40, [-1, 0.1, -10.6]), ball(1.2, 0.45, 1.2, 0x8a6a40, [3.5, 0.1, -6])])); zAdd(mounds);
    const frame = new THREE.Group(); for (let i = 0; i <= 3; i++) for (const z of [-3.85, 3.85]) frame.add(box(0.18, WH, 0.18, C.woodLight, [BX - 8 + i * SW + (i === 0 ? 0.1 : i === 3 ? -0.1 : 0), 0.16 + WH / 2, BZ + z]));
    for (const z of [-3.85, 3.85]) frame.add(box(16, 0.18, 0.18, C.woodLight, [BX, 0.16 + WH, BZ + z])); for (let i = 0; i <= 3; i++) frame.add(box(0.18, 0.18, 7.7, C.woodLight, [BX - 8 + i * SW + (i === 0 ? 0.1 : i === 3 ? -0.1 : 0), 0.16 + WH, BZ]));
    dyn(frame); frame.visible = false; zAdd(frame);
    const walls = [0, 1, 2].map(i => {
      const g = new THREE.Group(), zf = 3.85;
      g.add(box(SW, WH, 0.3, RED, [0, WH / 2, zf])); g.add(box(SW, WH, 0.3, RED, [0, WH / 2, -zf])); g.add(box(SW, 0.22, 0.36, C.white, [0, 0.11, zf])); g.add(box(SW, 0.16, 0.36, C.white, [0, WH - 0.08, zf]));
      if (i !== 1) { const s = i === 0 ? -1 : 1; g.add(box(0.3, WH, 8, RED, [s * (SW / 2 - 0.15), WH / 2, 0])); g.add(box(0.36, WH, 0.36, C.white, [s * (SW / 2 - 0.15), WH / 2, zf]));
        for (const x of [-1.55, 1.55]) { g.add(box(1.1, 0.95, 0.06, C.white, [x, 1.55, zf + 0.16])); g.add(box(0.9, 0.75, 0.08, 0x7fb6d9, [x, 1.55, zf + 0.17])); }
        g.add(cyl(0.66, 0.66, 0.14, 0x4a525a, [0, 2.1, zf + 0.16], [PI / 2, 0, 0], 12)); g.add(cyl(0.56, 0.56, 0.16, 0x23282d, [0, 2.1, zf + 0.16], [PI / 2, 0, 0], 12));
      } else { g.add(box(3.0, 2.7, 0.08, C.white, [0, 1.35, zf + 0.16])); for (const s of [-1, 1]) { g.add(box(0.1, 2.5, 0.1, RED, [s * 0.75, 1.3, zf + 0.2], [0, 0, s * 0.5])); } g.add(box(0.08, 2.7, 0.1, 0xc9c9c9, [0, 1.35, zf + 0.2])); }
      dyn(g); g.position.set(BX - 8 + SW * (i + 0.5), 0.16, BZ); g.scale.y = 0.02; g.visible = false; zAdd(g); return g;
    });
    const roof = new THREE.Group(); roof.add(prism(9.4, 2.3, 16.9, 0x78848f)); for (const x of [-5, 0, 5]) roof.add(box(1.2, 0.5, 0.8, 0x5c6670, [x, 2.2, 0]));
    roof.add(box(17, 0.14, 0.3, C.white, [0, 0.05, 4.7])); bake(roof); roof.add(sign('🦃 TURKEY BARN', 1.05, { border: '#b5382c' }, [0, 1.05, 3.05], [-0.25, 0, 0]));
    roof.position.set(BX, 15, BZ); roof.visible = false; roof.userData.dynamic = true; zAdd(roof);
    const doorOpen = dyn(group([box(3.0, 2.7, 0.04, 0x2a1a12, [BX, 0.16 + 1.35, BZ + 4.1]), box(2.9, 0.3, 0.03, 0xe9d48e, [BX, 0.16 + 0.15, BZ + 4.13]), box(1.5, 2.7, 0.06, C.white, [BX - 2.3, 0.16 + 1.35, BZ + 4.14]), box(1.5, 2.7, 0.06, C.white, [BX + 2.3, 0.16 + 1.35, BZ + 4.14])])); doorOpen.visible = false; zAdd(doorOpen);
    const lit = dyn(group([-1.55, 1.55].flatMap(x => [0, 2].map(i => box(0.9, 0.75, 0.02, glow(0xffe9a0), [BX - 8 + SW * (i + 0.5) + x, 0.16 + 1.55, BZ + 4.08]))))); lit.visible = false; zAdd(lit);
    const fans1 = [0, 2].map(i => { const f = fanBlades(0.5); f.position.set(BX - 8 + SW * (i + 0.5), 0.16 + 2.1, BZ + 4.12); f.visible = false; zAdd(f); spin.push(f); return f; });
    const wire = tube([[8.6, 5.1, -4.8], [7.4, 4.2, -4.9], [6.3, 3.7, -5.0]], 0.035, 0x222222); wire.visible = false; zAdd(wire);
    const sw1 = group([cyl(0.035, 0.035, 0.5, 0x333333, [0, 0.25, 0]), sphere(0.09, C.red, [0, 0.5, 0])], [8.6, 1.15, -4.38], [0, 0, 0.7]); zAdd(sw1);
    const pipe = dyn(group([cyl(0.09, 0.09, 2.1, C.steel, [0, 0.12, 0], [0, 0, PI / 2], 6), torus(0.12, 0.04, 0x3f7fd1, [-0.95, 0.12, 0], [0, PI / 2, 0]), torus(0.12, 0.04, 0x3f7fd1, [0.95, 0.12, 0], [0, PI / 2, 0])])); zAdd(pipe, -12.9, -2.8, 0); pipe.position.y = 0.03;
    const mixer = dyn(group([P.truck({ kind: 'tanker', color: 0xf2c43d, cargoColor: 0xdcdcdc }), box(2.0, 0.12, 0.5, C.steel, [-1.9, 1.0, -2.0], [0, 0, 0.35]), box(0.5, 0.5, 0.5, C.steel, [-0.9, 1.2, -2.0])])); zAdd(mixer, -60, 11, PI / 2);
    const dozer = bulldozer(); dozer.userData.dynamic = true; zAdd(dozer, -40, -22, 0); dozer.visible = false;
    // mill machine + corn + combine (used in chapter 3)
    const mill = dyn(group([box(2.2, 1.1, 1.6, 0x4f7d5a, [0, 0.55, 0]), cyl(1.0, 0.35, 0.9, 0xd8b23a, [0, 1.55, 0], null, 10), cyl(1.04, 1.04, 0.07, 0xb8962e, [0, 2.0, 0], null, 10),
      cyl(0.3, 0.3, 0.75, 0x4a6f9a, [-0.5, 0.42, -1.2], [PI / 2, 0, 0], 8), box(0.9, 0.12, 0.9, 0x6d7a86, [-0.5, 0.06, -1.2]), box(0.1, 0.75, 1.0, 0xd8b23a, [-1.16, 0.6, -0.7]), box(0.4, 0.5, 0.08, 0xc9ced3, [0.65, 0.7, 0.82]), sphere(0.05, glow(0x7fe08a), [0.65, 0.85, 0.87], 5), /* motor, belt guard, control box */ box(1.6, 0.12, 0.6, C.steel, [1.7, 0.6, 0], [0, 0, -0.35]), box(1.0, 0.1, 1.0, C.wood, [2.6, 0.06, 0]), cyl(0.3, 0.3, 0.2, 0x333333, [0, 0.75, 0.82], [PI / 2, 0, 0], 10)])); zAdd(mill, 13.4, -5.8, -PI / 2);
    ctx.collideBox(13.4, -5.8, 1.8, 2.4);
    const millLever = group([box(0.3, 0.9, 0.3, C.steel, [0, 0.45, 0])], [15.6, 0, -3.6]); const millStick = group([cyl(0.04, 0.04, 0.7, 0x333333, [0, 0.35, 0]), sphere(0.11, C.red, [0, 0.72, 0])], [0, 0.85, 0], [0, 0, 0.6]); millLever.add(millStick); zAdd(millLever);
    const corn = []; for (const x of [22, 25, 28, 31]) for (const z of [-12, -9.4, -6.8, -4.2]) { const c = cornClump(rnd); c.position.set(x, 0.12, z); c.rotation.y = rnd() * 6; c.scale.setScalar(0.3); zAdd(c); corn.push(c); }
    const harvester = zAdd(combine(), 18.5, 2.4, PI); harvester.visible = false;
    const poultTruck = zAlso(zAdd(P.truck({ kind: 'box', color: 0xf2c43d, logo: '🐥' }), -70, 11, PI / 2), 2); // (it also drives into the hatchery, zone 2)
    const farmer = zPerson({ hat: 'straw', shirt: 0x3f8f6a, pants: 0x3b5b8c, skin: C.skin[2], hair: C.hair[0], hairStyle: 'pony', expressive: true }, 17, 2, -0.4); farmer.visible = false;

    const barnDone = () => { // the finished barn (used when a test jumps ahead, and as the end state of chapter 1)
      slab.visible = true; slab.scale.x = 1; mounds.visible = false; frame.visible = false; walls.forEach(w => { w.visible = true; w.scale.y = 1; }); roof.visible = true; roof.position.y = 0.16 + WH;
      lit.visible = true; wire.visible = true; fans1.forEach(f => { f.visible = true; f.userData.on = true; }); sw1.rotation.z = -0.7;
      mixer.visible = false; dozer.visible = false; surveyor.visible = false; builder.visible = false; tripod.visible = false; tripodC.remove(); if (!barnDone.c) barnDone.c = ctx.collideBox(BX, BZ, 16.4, 8.4);
    };

    // ================= ZONE 2 — the hatchery (x≈100, indoors) =================
    zb = 2;
    const X2 = 100, z2 = new THREE.Group();
    z2.add(plane(24, 22, 0xd7e3da, [0, 0.03, -0.5])); for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) z2.add(plane(4, 3.75, 0xcbdad0, [-10 + i * 4, 0.035, -9.6 + j * 3.75]));
    z2.add(box(24, 5.6, 0.4, 0xfff1d8, [0, 2.8, -11.5])); z2.add(box(0.4, 5.6, 15, 0xf8e6c4, [-12, 2.8, -4])); z2.add(box(0.4, 5.6, 6.5, 0xf8e6c4, [12, 2.8, -8.25])); z2.add(box(0.4, 1.4, 8.5, 0xf8e6c4, [12, 4.9, -0.75]));
    z2.add(box(24, 0.8, 0.46, 0xe98a2b, [0, 0.4, -11.5])); z2.add(box(0.46, 0.8, 15, 0xe98a2b, [-12, 0.4, -4])); z2.add(box(24, 0.3, 0.46, 0xe98a2b, [0, 3.75, -11.5]));
    z2.add(sign('🥚 HATCHERY', 1.15, { border: '#e98a2b' }, [-2.5, 4.7, -11.25]));
    z2.add(plane(22, 0.25, 0xf2c43d, [0, 0.04, -8.2]));
    const INC = [-7, 0, 7];
    for (const x of INC) { // incubator cabinets (open fronts so the eggs show)
      z2.add(box(3.7, 3.0, 0.2, 0xb9c4cc, [x, 1.7, -11.0])); z2.add(box(3.3, 2.5, 0.05, 0xffc98a, [x, 1.75, -10.88])); for (const s of [-1, 1]) z2.add(box(0.2, 3.0, 1.5, 0xdfe6ea, [x + s * 1.75, 1.7, -10.35]));
      z2.add(box(3.7, 0.3, 1.5, 0xdfe6ea, [x, 3.25, -10.35])); z2.add(box(3.7, 0.4, 1.5, 0x8a949e, [x, 0.2, -10.35])); z2.add(box(3.2, 0.08, 0.5, glow(0xffb45a), [x, 3.07, -10.2]));
      z2.add(box(0.7, 0.2, 0.05, glow(0x7fe08a), [x - 1.1, 3.27, -9.58])); z2.add(sphere(0.07, glow(0xff5a4a), [x + 1.3, 3.27, -9.6], 6));
    }
    for (const x of [-10.6, -3.5, 10.4]) { z2.add(cyl(0.02, 0.02, 1.2, 0x333333, [x, 5.0, -10.3], null, 4)); z2.add(cone(0.5, 0.45, 0xd9483b, [x, 4.3, -10.3], null, 10)); z2.add(sphere(0.2, glow(0xffd27a), [x, 4.12, -10.3], 8)); }
    // trolleys of hatching baskets, a floor mat, a loading bay
    for (const [x, z, ry] of [[-10.2, -8.6, 0.3], [10.2, -6.6, -0.2]]) { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { g.add(box(1.1, 0.22, 0.8, [0x4aa3df, 0xf2c43d, 0x4aa3df, 0xe98a2b][i], [0, 0.42 + i * 0.3, 0])); } for (const a of [-1, 1]) for (const b of [-1, 1]) { g.add(cyl(0.03, 0.03, 1.7, C.steel, [a * 0.6, 0.95, b * 0.42], null, 4)); g.add(sphere(0.08, 0x333333, [a * 0.6, 0.08, b * 0.42], 5)); } g.position.set(x, 0, z); g.rotation.y = ry; z2.add(g); }
    z2.add(plane(9, 4.2, 0xf6d9a8, [-1, 0.04, -5])); z2.add(plane(8.4, 3.6, 0xf9e6c2, [-1, 0.045, -5]));
    for (let i = 0; i < 7; i++) z2.add(plane(0.5, 3.4, i % 2 ? 0x333333 : 0xf2c43d, [4.2 + i * 0.5, 0.045, 1.1]));
    // candling table (checking eggs against a light) + shelves of trays
    { const t = P.tableProp(2.6, 1.1, 0.95, 0xdfe6ea); t.position.set(-10.3, 0, -5.5); t.rotation.y = PI / 2; z2.add(t); z2.add(box(0.5, 0.5, 0.5, 0x333333, [-10.5, 1.25, -5.6])); z2.add(sphere(0.16, glow(0xfff2a8), [-10.2, 1.3, -5.6], 8));
      for (let i = 0; i < 5; i++) z2.add(ball(0.09, 0.12, 0.09, 0xf3e6cf, [-10.3 + (i % 2) * 0.2, 1.1, -6.4 + i * 0.17 + (i > 2 ? 1.2 : 0)]));
      for (let i = 0; i < 3; i++) { const c = P.crate({ fill: 0xf3e6cf }); c.position.set(-10.8, i * 0.45, -1.6 - (i === 2 ? 0 : 0)); if (i === 2) c.position.set(-10.8, 0, -2.6); z2.add(c); } }
    // control stand (warmth & humidity)
    z2.add(box(0.9, 1.0, 0.6, 0x5c6670, [3.5, 0.5, -9.9])); z2.add(box(1.0, 0.7, 0.12, 0x39424b, [3.5, 1.4, -10.0], [-0.3, 0, 0])); z2.add(box(0.8, 0.5, 0.02, glow(0x9fe8a0), [3.5, 1.42, -9.92], [-0.3, 0, 0]));
    z2.add(sign('🌡️💧', 0.42, { bg: null }, [3.5, 1.43, -9.89], [-0.3, 0, 0]));
    zStatic(z2, X2, 0);
    ctx.collideBox(X2, -10.4, 24, 1.9); ctx.collideBox(X2 - 10.2, -8.6, 1.5, 1.2); ctx.collideBox(X2 + 10.2, -6.6, 1.5, 1.2); ctx.collideBox(X2 - 10.4, -5.5, 1.3, 2.8); ctx.collideBox(X2 - 10.8, -2.1, 0.9, 1.9);
    const eggGeo = new THREE.SphereGeometry(1, 5, 3); // 132 small eggs stand in the trays: keep each one very light
    const mkTray = (full) => { const g = new THREE.Group(); g.add(box(3.1, 0.06, 0.95, 0x8a949e, [0, 0, 0])); g.add(box(3.1, 0.12, 0.05, 0x6d7a86, [0, 0.06, 0.47])); if (full) for (let i = 0; i < 11; i++) for (const z of [-0.2, 0.22]) { const e = new THREE.Mesh(eggGeo, mat((i * 7 + (z > 0 ? 3 : 0)) % 4 ? 0xf1e4cc : 0xe3cfae)); e.scale.set(0.085, 0.115, 0.085); e.position.set(-1.35 + i * 0.27, 0.14, z); g.add(e); } dyn(g); g.traverse(m => { m.castShadow = false; }); return g; }; // (inside the cabinets: no shadows needed)
    const trays = INC.map((x, i) => [1.05, 2.05].map(y => { const f = mkTray(true), e = mkTray(false); for (const t of [f, e]) { t.position.set(X2 + x, y, -10.3); t.rotation.z = -0.3; zAdd(t); } f.visible = i !== 1; e.visible = i === 1; return { f, e }; }));
    const cal = (crossed) => picture(2.6, 2.0, (g, W, H) => { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8412f'; g.fillRect(0, 0, W, H * 0.2); g.fillStyle = '#4a2c17'; g.lineWidth = 3; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { const x = W * (0.06 + c * 0.128), y = H * (0.27 + r * 0.175), s = W * 0.1; g.strokeStyle = '#c9bfae'; g.strokeRect(x, y, s, s * 0.95); if (crossed) { g.strokeStyle = '#e8412f'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 4, y + 4); g.lineTo(x + s - 4, y + s * 0.95 - 4); g.moveTo(x + s - 4, y + 4); g.lineTo(x + 4, y + s * 0.95 - 4); g.stroke(); g.lineWidth = 3; } } }, 256, [X2 + 7.5, 4.55, -11.27]);
    const cal0 = zAdd(cal(false)), cal1 = zAdd(cal(true)); cal1.visible = false;
    const tech = zPerson({ hat: 'hairnet', apron: C.white, shirt: 0x9fd0e8, pants: 0x4a4a55, skin: C.skin[4], hair: C.hair[6], hairStyle: 'bun', glasses: true, expressive: true }, X2 - 3.4, -7.4, 0.2);
    const collector = zPerson({ hat: 'cap', hatColor: 0x4f9d4a, shirt: 0xe9a23b, pants: 0x3b5b8c, skin: C.skin[3], hair: C.hair[1], expressive: true }, X2 - 8.2, 0.6, 1.2);
    const eggCrate = zAdd(P.crate({ fill: 0xf3e6cf, s: 0.6 }), X2 - 6.8, 0.9);
    const driver2 = zPerson({ hat: 'cap', hatColor: 0xf2c43d, shirt: 0x3f7fd1, pants: 0x4a4a55, skin: C.skin[0], hair: C.hair[3], hairStyle: 'short', expressive: true }, X2 + 4.6, 2.4, -0.6);

    // ================= ZONE 3 — inside the turkey barn (x≈200) =================
    zb = 3;
    const X3 = 200, z3 = new THREE.Group();
    z3.add(grained(30, 13, 0xe6d08a, 9, [0, 0.03, -4], 4)); { const r = seeded(31); for (let i = 0; i < 26; i++) z3.add(plane(1 + r() * 2.4, 0.6 + r() * 1.4, i % 2 ? 0xdfc678 : 0xf1dfa2, [-14 + r() * 28, 0.035 + i * 0.0004, -10 + r() * 12], r() * 3)); }
    z3.add(box(30, 1.3, 0.4, 0xc9ad7c, [0, 0.65, -10.5])); z3.add(box(30, 1.7, 0.1, 0xcfeeff, [0, 2.15, -10.62])); z3.add(box(30, 0.55, 0.06, 0x8cc862, [0, 1.55, -10.54])); z3.add(box(30, 1.6, 0.4, 0xdcc9a2, [0, 3.8, -10.5]));
    for (let i = 0; i <= 6; i++) z3.add(box(0.3, 4.6, 0.5, C.wood, [-15 + i * 5, 2.3, -10.45])); for (const [x, h] of [[-11, 1.1], [-4, 0.8], [6, 1.2], [11.5, 0.9]]) z3.add(ball(2.2, h, 0.05, 0x6fae52, [x, 1.5, -10.56]));
    z3.add(box(0.4, 4.6, 13, 0xdcc9a2, [-15, 2.3, -4])); z3.add(box(0.4, 4.6, 3.5, 0xdcc9a2, [15, 2.3, -8.75])); z3.add(box(0.4, 1.3, 2.6, 0xc9ad7c, [15, 0.65, 1.2])); z3.add(box(0.4, 1.1, 7.2, 0xdcc9a2, [15, 4.05, -3.4])); z3.add(box(0.5, 0.3, 7.4, C.wood, [15, 3.45, -3.4]));
    for (const z of [-7, -1.5]) { z3.add(cyl(1.0, 1.0, 0.3, 0x4a525a, [-14.75, 2.5, z], [0, 0, PI / 2], 14)); z3.add(cyl(0.88, 0.88, 0.32, 0x23282d, [-14.74, 2.5, z], [0, 0, PI / 2], 14)); }
    // feed line: hopper → pipe → 4 pan feeders
    const FEED = [-7.5, -2.5, 2.5, 7.5], DRINK = [-9.5, -4.5, 0.5, 5.5, 10], FZ = -7.4, WZ = -4.6;
    z3.add(cyl(1.0, 1.0, 1.3, 0xc9c9c9, [-12.4, 3.0, FZ], null, 12)); z3.add(cyl(1.0, 0.25, 1.0, 0xb5b5b5, [-12.4, 1.85, FZ], null, 12)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) z3.add(cyl(0.06, 0.06, 2.4, C.steel, [-12.4 + a * 0.8, 1.2, FZ + b * 0.8], null, 5));
    z3.add(box(1.1, 0.7, 0.9, 0x6d7a86, [-12.4, 0.35, FZ + 1.5])); z3.add(box(0.9, 0.1, 0.7, 0x2c3036, [-12.4, 0.71, FZ + 1.5])); z3.add(cyl(0.1, 0.1, 1.7, C.steel, [-12.4, 1.0, FZ + 0.9], [0.9, 0, 0], 6));
    z3.add(cyl(0.09, 0.09, 20.6, 0xd9d9d9, [-2.1, 2.5, FZ], [0, 0, PI / 2], 6));
    for (const x of FEED) { z3.add(cyl(0.06, 0.06, 2.1, 0xd9d9d9, [x, 1.45, FZ], null, 5)); z3.add(cyl(0.6, 0.5, 0.2, 0xd9483b, [x, 0.12, FZ], null, 12)); z3.add(cone(0.34, 0.55, 0xf2c43d, [x, 0.5, FZ], null, 10)); }
    z3.add(cyl(0.035, 0.035, 22.6, 0x4a8fd0, [-1.2, 2.2, WZ], [0, 0, PI / 2], 5)); z3.add(cyl(0.035, 0.035, 2.0, 0x4a8fd0, [-12.5, 1.2, WZ], null, 5));
    for (const x of DRINK) { z3.add(cyl(0.02, 0.02, 1.8, 0x4a8fd0, [x, 1.3, WZ], null, 4)); z3.add(cone(0.3, 0.36, 0xe8412f, [x, 0.42, WZ], null, 10)); z3.add(cyl(0.4, 0.36, 0.1, 0xe8412f, [x, 0.2, WZ], null, 12)); }
    z3.add(box(0.35, 1.0, 0.35, C.steel, [-12.5, 0.5, WZ]));
    // straw bales, sacks, thermostat, heat lamps
    for (const [x, y, z] of [[-13.6, 0, -9.4], [-12.3, 0, -9.5], [-13, 0.7, -9.45], [12.6, 0, -9.5], [13.6, 0, -9.3]]) z3.add(box(1.2, 0.7, 0.8, 0xe3c15a, [x, y + 0.35, z], [0, x * 0.1, 0]));
    for (let i = 0; i < 3; i++) { const s = P.sack({ color: 0xe3c98a }); s.position.set(-10.4 + i * 0.75, 0, -9.6); z3.add(s); }
    z3.add(box(0.6, 0.8, 0.12, 0xfafafa, [9, 1.9, -10.2])); z3.add(cyl(0.2, 0.2, 0.06, 0x333333, [9, 2.0, -10.12], [PI / 2, 0, 0], 12)); z3.add(box(0.36, 0.12, 0.04, glow(0xff8a4a), [9, 1.66, -10.12]));
    for (const x of [-6, 0, 6]) { z3.add(cyl(0.02, 0.02, 0.9, 0x333333, [x, 4.2, -9.7], null, 4)); z3.add(cone(0.45, 0.4, 0x8c8c8c, [x, 3.6, -9.7], null, 10)); z3.add(sphere(0.18, glow(0xffb45a), [x, 3.44, -9.7], 8)); }
    zStatic(z3, X3, 0);
    const board = picture(6.2, 1.5, (g, W, H) => { g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#a8743f'; g.lineWidth = 10; g.strokeRect(0, 0, W, H); g.font = (H * 0.42) + 'px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; ['🌾', '🌽', '💧', '🌡️', '💚'].forEach((e, i) => { g.fillText(e, W * (0.1 + i * 0.2), H * 0.33); g.strokeStyle = '#e9e4d6'; g.lineWidth = 4; g.strokeRect(W * (0.1 + i * 0.2) - H * 0.13, H * 0.62, H * 0.26, H * 0.26); }); }, 512, [X3 - 1, 3.8, -10.28]); zAdd(board);
    const ticks = [0, 1, 2, 3, 4].map(i => { const s = sign('✅', 0.42, { bg: null }, [X3 - 1 + 6.2 * (-0.4 + i * 0.2), 3.44, -10.25]); s.visible = i === 0; zAdd(s); return s; });
    const tick = (i) => { ticks[i].visible = true; ticks[i].scale.setScalar(0.1); ctx.tween(ticks[i].scale, { x: 1, y: 1, z: 1 }, 0.4, 'outBack'); ctx.audio.play('ding'); };
    ctx.collideBox(X3 - 12.4, FZ, 2.2, 2.2); ctx.collideBox(X3 - 12.4, FZ + 1.5, 1.2, 1.0); ctx.collideBox(X3 - 12.5, WZ, 0.5, 0.5); ctx.collideBox(X3 - 13, -9.5, 3, 1.2); ctx.collideBox(X3 + 13.1, -9.4, 2.4, 1.2); ctx.collideBox(X3 - 9.6, -9.6, 2.4, 0.8);
    for (const x of FEED) ctx.collideCircle(X3 + x, FZ, 0.5); for (const x of DRINK) ctx.collideCircle(X3 + x, WZ, 0.3);
    const fans3 = [-7, -1.5].map(z => { const h = new THREE.Group(); h.position.set(X3 - 14.5, 2.5, z); h.rotation.y = PI / 2; const f = fanBlades(0.8); h.add(f); zAdd(h); spin.push(f); return f; });
    const fills = FEED.map(x => { const f = cyl(0.5, 0.46, 0.1, 0xe9c46a, [X3 + x, 0.24, FZ], null, 12); f.scale.setScalar(0.01); f.visible = false; zAdd(f); return f; });
    const drinkW = dyn(group(DRINK.map(x => torus(0.34, 0.05, 0x5fb8f0, [x, 0.27, WZ], [PI / 2, 0, 0])))); drinkW.visible = false; zAdd(drinkW, X3, 0);
    const valve3 = torus(0.24, 0.055, C.red, [X3 - 12.5, 1.1, WZ + 0.22]); zAdd(valve3);
    const grower = zPerson({ hat: 'straw', shirt: 0x3f8f6a, pants: 0x3b5b8c, skin: C.skin[2], hair: C.hair[0], hairStyle: 'pony', expressive: true }, X3 + 8.5, -0.2, -0.6);
    const vet = zPerson({ shirt: 0xfafafa, pants: 0x3f7fd1, apron: 0xfafafa, skin: C.skin[5], hair: C.hair[1], hairStyle: 'curly', glasses: true, expressive: true }, X3 + 17, -4, -PI / 2); vet.visible = false;
    const vetBag = dyn(group([box(0.4, 0.28, 0.2, 0x8a4b2a, [0, -0.12, 0]), box(0.14, 0.04, 0.205, 0xfafafa, [0, -0.1, 0]), box(0.04, 0.14, 0.205, 0xfafafa, [0, -0.1, 0])])); vetBag.rotation.y = PI / 2; vet.userData.hand.add(zreg(vetBag)); // (held flat against the side, clear of the leg)
    const haul = new THREE.Group(); { haul.add(P.truck({ kind: 'flatbed', color: 0x3f7fd1 })); const cg = new THREE.Group();
      for (let l = 0; l < 2; l++) { cg.add(box(2.2, 0.06, 4.3, 0x9aa5ad, [0, l * 0.85, 0])); for (let i = 0; i <= 4; i++) for (const s of [-1, 1]) cg.add(box(0.06, 0.85, 0.06, 0xb9c4cc, [s * 1.07, l * 0.85 + 0.42, -2.1 + i * 1.05])); for (const s of [-1, 1]) for (const y of [0.28, 0.56]) cg.add(box(0.04, 0.05, 4.3, 0xb9c4cc, [s * 1.08, l * 0.85 + y, 0])); }
      cg.add(box(2.2, 0.06, 4.3, 0x9aa5ad, [0, 1.7, 0])); cg.add(box(2.2, 1.7, 0.06, 0x9aa5ad, [0, 0.85, 2.15])); cg.position.set(0, 1.0, -1.05); haul.add(cg);
      haul.add(box(2.0, 0.1, 2.4, 0x8a949e, [0, 0.5, -4.3], [0.42, 0, 0])); bake(haul);
      haul.userData.birds = [0, 1].map(l => { const hb = new THREE.Group(); for (let i = 0; i < 4; i++) { hb.add(ball(0.3, 0.28, 0.36, 0xf8f5ee, [(i % 2 ? 0.5 : -0.5), 1.35 + l * 0.85, -2.6 + i * 1.0])); hb.add(sphere(0.1, 0xf0a6b0, [(i % 2 ? 0.95 : -0.95), 1.62 + l * 0.85, -2.5 + i * 1.0], 6)); } dyn(hb); hb.visible = false; haul.add(hb); return hb; }); }
    haul.userData.dynamic = true; zAdd(haul, X3 + 40, -4, PI / 2);
    const barnBirds = []; ctx._tk.barnBirds = barnBirds; // filled in chapter 3

    // ================= ZONE 4 — the processing & packing plant (x≈300) =================
    zb = 4;
    const X4 = 300, z4 = new THREE.Group();
    z4.add(plane(38, 21, 0xdfe5e8, [0, 0.03, -0.5])); for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) z4.add(plane(3.8, 3.5, 0xd3dce1, [-17.1 + i * 3.8, 0.035, -9.25 + j * 3.5]));
    z4.add(plane(36, 0.3, 0xf2c43d, [0, 0.04, -3.4])); z4.add(plane(36, 0.3, 0xf2c43d, [0, 0.04, 1.6]));
    z4.add(box(38, 5.6, 0.4, 0xf4f6f7, [0, 2.8, -11])); z4.add(box(38, 0.5, 0.46, 0x3f7fd1, [0, 3.7, -11])); z4.add(box(38, 1.0, 0.46, 0xcfdbe3, [0, 0.5, -11]));
    z4.add(box(0.4, 5.6, 3.6, 0xe9edf0, [-19, 2.8, -9.2])); z4.add(box(0.4, 5.6, 7.7, 0xe9edf0, [-19, 2.8, -0.85])); z4.add(box(0.4, 3.4, 2.7, 0xe9edf0, [-19, 3.9, -6.05]));
    for (let i = 0; i < 6; i++) z4.add(box(0.06, 2.1, 0.36, i % 2 ? 0xf2d94a : 0xf7e37a, [-18.85, 1.15, -7.05 + i * 0.4]));
    z4.add(box(0.4, 5.6, 4.6, 0xe9edf0, [19, 2.8, -8.7])); z4.add(box(0.4, 1.6, 6.8, 0xe9edf0, [19, 4.8, -3])); z4.add(box(0.4, 1.3, 2.6, 0xcfdbe3, [19, 0.65, 1.7])); z4.add(box(0.5, 0.3, 7, 0xf2c43d, [19, 3.9, -3]));
    z4.add(sign('🏭 TURKEY PLANT', 1.1, { border: '#3f7fd1' }, [-9.5, 4.75, -10.75])); z4.add(sign('❄️ COLD ROOM', 1.0, { border: '#3f7fd1', bg: '#e9f6ff' }, [5.5, 4.75, -10.75]));
    z4.add(P.conveyor(20).translateX(-8).translateZ(-6));
    // hand-wash corner
    z4.add(box(2.6, 0.9, 1.0, 0xcfd6dc, [-15.5, 0.45, -4.3])); z4.add(box(1.3, 0.12, 0.7, 0x8a949e, [-15.5, 0.92, -4.25])); z4.add(box(2.6, 1.5, 0.12, 0xcfd6dc, [-15.5, 1.65, -4.76])); z4.add(cyl(0.04, 0.04, 0.5, C.steel, [-15.5, 1.2, -4.6], null, 5)); z4.add(cyl(0.04, 0.04, 0.3, C.steel, [-15.5, 1.42, -4.45], [PI / 2, 0, 0], 5)); z4.add(box(0.18, 0.3, 0.14, 0xe98a2b, [-14.5, 1.08, -4.4]));
    z4.add(sign('👐💧', 0.8, {}, [-15.5, 1.9, -4.68])); z4.add(box(2.2, 1.3, 1.0, 0xcfd6dc, [-15.5, 0.65, -10.3])); z4.add(box(2.4, 0.1, 1.1, 0x8a949e, [-15.5, 1.35, -10.3]));
    z4.add(box(3.6, 0.08, 0.08, C.steel, [-11, 2.25, -10.6])); for (let i = 0; i < 4; i++) { const x = -12.3 + i * 0.87; z4.add(box(0.6, 1.15, 0.06, i % 2 ? 0xfafafa : 0xcfe6f5, [x, 1.5, -10.62])); z4.add(box(0.22, 0.3, 0.06, i % 2 ? 0xfafafa : 0xcfe6f5, [x, 2.1, -10.62])); z4.add(torus(0.06, 0.015, 0x333333, [x, 2.3, -10.6])); z4.add(box(0.5, 0.22, 0.3, 0xf2c43d, [x, 0.11, -10.5])); }
    z4.add(cyl(0.3, 0.25, 0.5, 0xf2c43d, [-17.6, 0.25, -9.6], null, 8)); z4.add(cyl(0.025, 0.025, 1.5, C.wood, [-17.5, 0.95, -9.7], [0.15, 0, 0.1], 4));
    // inspection gantry
    for (const z of [-6.75, -5.25]) z4.add(box(0.14, 2.6, 0.14, 0x6d7a86, [-9, 1.3, z])); z4.add(box(0.9, 0.3, 1.8, 0x3f7fd1, [-9, 2.7, -6])); z4.add(plane(1.6, 1.2, 0xf2c43d, [-9, 0.045, -4.3]));
    // blast-freezer tunnel over the belt
    z4.add(box(4.6, 0.35, 1.9, 0xcfe6f5, [-1.2, 2.35, -6])); z4.add(box(4.6, 1.5, 0.15, 0xcfe6f5, [-1.2, 1.5, -6.9])); z4.add(box(4.6, 0.75, 0.15, 0xcfe6f5, [-1.2, 1.85, -5.1])); for (const x of [-3.45, 1.05]) z4.add(box(0.15, 0.9, 0.15, 0x9fc4dc, [x, 0.45, -5.1]));
    z4.add(box(1.6, 0.7, 1.2, 0x9fb4c4, [-1.2, 2.85, -6.2])); z4.add(cyl(0.5, 0.5, 0.14, 0x4a525a, [-1.2, 2.9, -5.55], [PI / 2, 0, 0], 12)); z4.add(sign('❄️', 0.6, { bg: null }, [-2.8, 1.85, -5.0])); z4.add(sign('❄️', 0.6, { bg: null }, [0.4, 1.85, -5.0]));
    // scale + label printer table
    z4.add(box(3.8, 0.9, 1.2, 0x9aa5ad, [4.3, 0.45, -6])); z4.add(box(1.0, 0.1, 1.0, 0x333333, [4.5, 0.95, -6])); z4.add(box(0.1, 1.2, 0.1, 0x6d7a86, [4.5, 1.5, -6.5])); z4.add(cyl(0.55, 0.55, 0.1, 0xfafafa, [4.5, 2.3, -6.5], [PI / 2, 0, 0], 16)); z4.add(torus(0.55, 0.05, 0x3f7fd1, [4.5, 2.3, -6.45]));
    for (let i = -3; i <= 3; i++) z4.add(box(0.03, 0.1, 0.02, 0x333333, [4.5 + Math.sin(i * 0.4) * 0.44, 2.3 + Math.cos(i * 0.4) * 0.44, -6.44], [0, 0, -i * 0.4]));
    z4.add(box(0.8, 0.55, 0.7, 0x39424b, [5.75, 1.18, -6.1])); z4.add(box(0.5, 0.06, 0.1, 0xfafafa, [5.75, 1.1, -5.72])); z4.add(box(0.3, 0.14, 0.02, glow(0x7fe08a), [5.75, 1.33, -5.74]));
    // cartons, pallets, cones
    for (const [x, z, n] of [[13.5, -9.6, 3], [15, -9.4, 2], [16.6, -9.7, 3], [-4.5, -9.9, 2], [-3, -9.8, 1]]) for (let i = 0; i < n; i++) { const c = carton(1.1); c.position.set(x, i * 0.55, z); c.rotation.y = i * 0.2; z4.add(c); }
    for (const [x, z] of [[12.2, 1.2], [7, 1.2], [-13, 1.9]]) { z4.add(cone(0.22, 0.6, 0xe98a2b, [x, 0.3, z], null, 8)); z4.add(box(0.5, 0.04, 0.5, 0xe98a2b, [x, 0.02, z])); }
    for (const x of [-12, -5, 2]) for (let k = 0; k < 3; k++) z4.add(plane(0.9, 0.22, 0xf2c43d, [x + k * 0.5, 0.045, -0.9], 0)); for (const x of [-12, -5, 2]) z4.add(cone(0.35, 0.7, 0xf2c43d, [x + 1.9, 0.05, -0.9], [0, 0, -PI / 2], 3));
    { const g = group([box(1.3, 0.12, 1.1, C.woodLight, [0, 0.1, 0]), box(1.1, 0.8, 0.9, 0x9fd0e8, [0, 0.56, 0]), box(1.12, 0.1, 0.92, 0xfafafa, [0, 0.7, 0])], [-7.5, 0, 1.4], [0, 0.3, 0]); z4.add(g); const g2 = group([box(1.3, 0.12, 1.1, C.woodLight, [0, 0.1, 0])], [-9.2, 0, 1.7], [0, -0.2, 0]); z4.add(g2); z4.add(cyl(0.32, 0.32, 0.9, 0x3f7fd1, [3.6, 0.45, 1.6], null, 10)); z4.add(cyl(0.32, 0.32, 0.9, 0x3f7fd1, [4.4, 0.45, 1.9], null, 10)); }
    z4.add(box(3.2, 2.6, 0.1, 0xbfe6f5, [11.5, 2.4, -10.77])); z4.add(box(3.4, 0.14, 0.16, C.white, [11.5, 1.05, -10.75])); z4.add(box(0.1, 2.6, 0.14, C.white, [11.5, 2.4, -10.75]));
    zStatic(z4, X4, 0);
    ctx.collideBox(X4 - 8, -6, 20.4, 1.4); ctx.collideBox(X4 + 4.3, -6, 4, 1.4); ctx.collideBox(X4 - 15.5, -4.4, 2.8, 1.2);  ctx.collideBox(X4 + 15, -9.6, 4.6, 1.2); ctx.collideBox(X4 - 3.8, -9.9, 2.6, 1.0); ctx.collideBox(X4 - 1.2, -5.6, 4.7, 1.2); ctx.collideBox(X4 - 8.2, 1.5, 3.2, 1.3); ctx.collideBox(X4 + 4, 1.75, 1.6, 1.0);
    const stamper = dyn(group([cyl(0.06, 0.06, 0.9, 0x9aa5ad, [0, 0.55, 0], null, 6), box(0.5, 0.2, 0.5, 0x3fae5a, [0, 0.1, 0])])); zAdd(stamper, X4 - 9, -6); stamper.position.y = 1.75;
    const lampR = sphere(0.14, glow(0xff5a4a), [X4 - 9, 3.0, -5.2], 8), lampG = sphere(0.16, glow(0x5aff7a), [X4 - 9, 3.0, -5.2], 8); zAdd(lampR); zAdd(lampG); lampG.visible = false;
    const frFan = fanBlades(0.42); frFan.position.set(X4 - 1.2, 2.9, -5.46); zAdd(frFan); spin.push(frFan);
    const frLever = group([box(0.3, 0.9, 0.3, C.steel, [0, 0.45, 0])], [X4 - 4.4, 0, -4.5]); const frStick = group([cyl(0.04, 0.04, 0.7, 0x333333, [0, 0.35, 0]), sphere(0.11, 0x3f7fd1, [0, 0.72, 0])], [0, 0.85, 0], [0, 0, 0.6]); frLever.add(frStick); zAdd(frLever);
    const needle = group([box(0.05, 0.46, 0.03, 0xe8412f, [0, 0.2, 0])], [X4 + 4.5, 2.3, -6.42], [0, 0, 1.2]); zAdd(needle);
    const beltItems = []; for (let i = 0; i < 5; i++) { const g = new THREE.Group(), a = packTurkey('plain'), b = packTurkey('ok'); b.visible = false; g.add(a); g.add(b); g.position.set(X4 - 17.5 + i * 3.2, 0.97, -6); g.rotation.y = (i % 2 ? 0.3 : -0.2); zAdd(g); beltItems.push({ g, a, b, ok: false }); }
    let beltOn = true; ctx.onUpdate((dt) => { if (!beltOn) return; for (const it of beltItems) { it.g.position.x += dt * 1.25; if (it.g.position.x > X4 - 1.4) { it.g.position.x -= 16; it.ok = false; it.a.visible = true; it.b.visible = false; } } });
    const pallet = new THREE.Group(); { const g = new THREE.Group(); g.add(box(1.3, 0.12, 1.1, C.woodLight, [0, 0.1, 0])); for (const x of [-0.5, 0, 0.5]) g.add(box(0.14, 0.1, 1.1, C.wood, [x, 0.02, 0])); for (const [x, y, z] of [[-0.3, 0.16, 0.22], [0.3, 0.16, 0.22], [-0.3, 0.16, -0.25], [0.3, 0.16, -0.25], [-0.3, 0.56, 0]]) { const c = carton(0.72); c.position.set(x, y, z); g.add(c); } bake(g); pallet.add(g); }
    pallet.userData.dynamic = true; zAdd(pallet, X4 + 9.5, -5.4); const palletC = ctx.collideCircle(X4 + 9.5, -5.4, 0.85);
    const lift = forklift(); zAdd(lift, X4 + 9.5, 0.3, PI); const liftC = ctx.collideBox(X4 + 9.5, 0.3, 1.6, 2.6);
    const reefer = zAlso(zAdd(P.truck({ kind: 'reefer', color: 0x3f7fd1, logo: '🦃' }), X4 + 22.7, -3, PI / 2), 5); // (and it drives the road, zone 5)
    const inspector = zPerson({ hat: 'hardhat', hatColor: 0xfafafa, shirt: 0xfafafa, apron: 0xfafafa, pants: 0x4a4a55, skin: C.skin[1], hair: C.hair[0], glasses: true, expressive: true }, X4 - 6.6, -7.6, 0);
    const clip = dyn(group([box(0.26, 0.34, 0.03, 0x8a5a2b, [0, 0, 0.06]), box(0.2, 0.26, 0.02, 0xfafafa, [0, -0.01, 0.08])])); clip.position.y = -0.48; inspector.userData.armL.add(clip); // clipboard in the left hand: the right one is free to point
    const packer = zPerson({ hat: 'hairnet', apron: C.white, shirt: 0x9fd0e8, pants: 0x4a4a55, skin: C.skin[3], hair: C.hair[1], hairStyle: 'bun', expressive: true }, X4 + 6.6, -7.5, 0);
    const driver4 = zPerson({ hat: 'cap', hatColor: 0x3f7fd1, shirt: 0x3f7fd1, vest: 0xe6f03c, pants: 0x4a4a55, skin: C.skin[2], hair: C.hair[2], beard: C.hair[2], expressive: true }, X4 + 16.5, 0.6, -0.8);
    const hairnet = new THREE.Mesh(new THREE.SphereGeometry(((ctx.player.userData.opts || {}).scale < 0.85 ? 1.12 : 1) * 0.292, 10, 6, 0, PI * 2, 0, PI * 0.5), mat(0xdfeaf2, { opacity: 0.85 })); hairnet.rotation.x = -0.3; hairnet.visible = false; ctx.player.userData.head.add(hairnet); // sits just over the player's cap (small people have a bigger head)

    // ================= ZONE 5 — the road to town (x 440…570) =================
    zb = 5;
    const X5 = 440, ZR = 500, z5 = new THREE.Group();
    z5.add(grained(150, 5.4, 0x666b72, 40, [62, 0.03, 0], 1.5)); for (let i = 0; i < 24; i++) z5.add(plane(2.4, 0.22, 0xf4f1e6, [-8 + i * 6, 0.04, 0])); z5.add(plane(150, 0.5, 0xcfc7a8, [62, 0.035, 2.95])); z5.add(plane(150, 0.5, 0xcfc7a8, [62, 0.035, -2.95]));
    { const tr = P.scatter(46, 150, 70, (r) => P.tree({ h: 3.5 + r() * 3.5, kind: r() < 0.25 ? 'pine' : r() < 0.6 ? 'autumn' : 'round' }), { seed: 17, keep: (x, z) => Math.abs(z) > 6.5 && !(x > 38 && Math.abs(z) < 22) && !(x > -40 && x < -10 && z < -6 && z > -30) });
      for (const c of [...tr.children]) if (c.position.z > 6.5 && c.position.z < 14) tr.remove(c); // the ride camera travels along this strip: a tree here would sweep right across the picture and hide the truck (worst on a phone)
      z5.add(tr.translateX(62)); }
    z5.add(P.scatter(20, 140, 30, () => P.bush(), { seed: 19, keep: (x, z) => Math.abs(z) > 4.5 && x < 40 }).translateX(62)); z5.add(P.scatter(40, 120, 14, () => P.flower(), { seed: 23, keep: (x, z) => Math.abs(z) > 3.6 }).translateX(50));
    { const b = P.barn(); b.position.set(34, 0, -17); b.rotation.y = 0.5; z5.add(b); const s = P.silo(); s.position.set(41, 0, -20); z5.add(s); z5.add(P.fieldRows(14, 12, 5, { color: 0x8a9a3a }).translateX(48).translateZ(-13)); const f = P.fence(30); f.position.set(40, 0, -5.2); z5.add(f);
      for (const [x, z] of [[58, 16.5], [72, -10], [84, 16.5]]) { /* the two on the camera's side stand back from the road, clear of the ride camera */ const h = P.house({ color: [0xf1e2c4, 0xd9e6ee, 0xf6d9c2][x % 3], roofColor: [0x9c4a3a, 0x4f6d8a, 0x6b7a4a][x % 3] }); h.position.set(x, 0, z); h.rotation.y = z > 0 ? PI : 0; z5.add(h); }
      for (let i = 0; i < 5; i++) { const l = P.lampPost(); l.position.set(66 + i * 11, 0, i % 2 ? 3.6 : -3.6); z5.add(l); }
      const st = P.store({ sign: '🛒 MARKET', w: 16, h: 5.5, d: 9 }); st.position.set(127, 0, 0); st.rotation.y = -PI / 2; z5.add(st); z5.add(plane(16, 24, 0x767c84, [114, 0.028, 0]));
      for (let i = 0; i < 4; i++) { const m = P.mountain({ h: 24 + (i % 2) * 10 }); m.position.set(215, 0, -90 + i * 60); z5.add(m); }
      for (const [x, z, c] of [[20, 9, 0xfafafa], [26, 11, 0x6b4a2f], [23, 13, 0xfafafa]]) z5.add(group([ball(0.5, 0.42, 0.85, c, [0, 0.85, 0]), sphere(0.3, c, [0, 1.1, 0.85], 7), ...[[-0.3, 0.5], [0.3, 0.5], [-0.3, -0.5], [0.3, -0.5]].map(([a, b]) => cyl(0.08, 0.08, 0.55, 0x333333, [a, 0.28, b], null, 5)), ball(0.25, 0.2, 0.3, 0x333333, [0.2, 1.0, -0.2])], [x, 0, z], [0, x, 0]));
      const sp = P.signpost('🛒', { h: 2.6, size: 1.0 }); sp.position.set(92, 0, -3.8); sp.rotation.y = -PI / 2; z5.add(sp);
      for (const z of [-5.2, -9.0]) z5.add(cyl(0.12, 0.12, 4.4, C.woodDark, [52, 2.2, z], null, 6)); z5.add(box(0.2, 2.6, 5.2, 0x6e4a28, [52.05, 4.4, -7.1])); z5.add(sign('🦃 ➜ 🛒', 1.9, { border: '#d9483b' }, [51.9, 4.4, -7.1], [0, -PI / 2, 0])); }
    zStatic(z5, X5, ZR);

    // ================= ZONE 6 — the grocery store (x≈700, indoors) =================
    zb = 6;
    const X6 = 700, z6 = new THREE.Group();
    z6.add(plane(34, 22, 0xece6d6, [0, 0.03, -1])); for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) z6.add(plane(3.78, 4, 0xe2dac6, [-15.1 + i * 3.78, 0.035, -10 + j * 4]));
    z6.add(box(34, 5.4, 0.4, 0xf6f1e4, [0, 2.7, -12])); z6.add(box(0.4, 5.4, 16, 0xece6d6, [-17, 2.7, -4])); z6.add(box(0.4, 5.4, 16, 0xece6d6, [17, 2.7, -4])); z6.add(box(34, 0.5, 0.46, C.green, [0, 4.0, -12]));
    for (const x of [-14.6, 14.8]) { const s = P.shelf({ w: 3.6, seed: x > 0 ? 15 : 17 }); s.position.set(x, 0, -11.4); z6.add(s); }
    z6.add(sign('🛒 MARKET', 1.0, { border: '#2f6d3a' }, [-8.6, 4.75, -11.75])); z6.add(sign('❄️ FROZEN 🦃', 1.0, { border: '#3f7fd1', bg: '#e9f6ff' }, [1, 4.75, -11.75]));
    const FRZ = [-2.2, 1, 4.2];
    for (const x of FRZ) { z6.add(box(3.0, 3.2, 0.15, 0xd9eef9, [x, 1.75, -11.7])); for (const s of [-1, 1]) z6.add(box(0.14, 3.2, 1.1, 0xf4f6f7, [x + s * 1.5, 1.75, -11.2])); z6.add(box(3.14, 0.3, 1.1, 0x3f7fd1, [x, 3.5, -11.2])); z6.add(box(3.14, 0.3, 1.1, 0xcfd6dc, [x, 0.15, -11.2])); z6.add(box(2.8, 0.06, 0.3, glow(0xeaf8ff), [x, 3.3, -11.0]));
      for (let s = 0; s < 3; s++) { z6.add(box(2.86, 0.06, 0.95, 0xfafafa, [x, 0.55 + s * 0.9, -11.2])); for (let k = 0; k < 3; k++) if (!(x === 1 && s === 1 && k === 1)) { const t = packTurkey('label'); t.position.set(x - 0.9 + k * 0.9, 0.58 + s * 0.9, -11.2); t.rotation.y = (k + s) * 0.4 - 0.4; z6.add(t); } } }
    for (const x of [-9.6, 9.8]) { const s = P.shelf({ w: 5, seed: x > 0 ? 4 : 7 }); s.position.set(x, 0, -11.4); z6.add(s); }
    { const s2 = P.shelf({ w: 6, seed: 9 }); s2.position.set(-7, 0, -6); z6.add(s2); const s3 = P.shelf({ w: 5, seed: 12 }); s3.position.set(8.5, 0, -6); z6.add(s3);
      const st = group([box(3, 0.8, 1.6, C.woodLight, [0, 0.4, 0]), box(3.1, 0.12, 1.7, C.wood, [0, 0.85, 0])], [1.5, 0, -2.2]); for (let i = 0; i < 8; i++) { st.add(ball(0.28, 0.22, 0.28, i % 3 ? 0xe98a2b : 0xf2c43d, [-1.15 + (i % 4) * 0.75, 1.1, -0.35 + (i > 3 ? 0.7 : 0)])); st.add(cyl(0.03, 0.04, 0.1, 0x4f7d3a, [-1.15 + (i % 4) * 0.75, 1.34, -0.35 + (i > 3 ? 0.7 : 0)], null, 5)); } z6.add(st);
      z6.add(box(1.1, 0.82, 3.4, 0x8a6a4a, [-8.6, 0.41, -1])); z6.add(box(1.2, 0.08, 3.5, 0x333333, [-8.6, 0.86, -1])); z6.add(box(0.5, 0.45, 0.6, 0x444444, [-8.6, 1.12, -0.1])); z6.add(box(0.05, 0.3, 0.5, glow(0x9fe8a0), [-8.34, 1.24, -0.1])); z6.add(sign('💵', 0.5, { bg: null }, [-8.03, 0.45, -1.4], [0, PI / 2, 0])); z6.add(box(0.9, 0.02, 1.4, 0x222222, [-8.6, 0.91, -1.7])); // check-out, waist-high (0.9 m)
      for (const z of [3.2, 2.2]) { z6.add(cyl(0.05, 0.05, 1.0, 0xd9483b, [-5.6, 0.5, z], null, 6)); z6.add(sphere(0.09, 0xd9483b, [-5.6, 1.02, z], 6)); } z6.add(box(0.04, 0.06, 1.0, 0xd9483b, [-5.6, 0.9, 2.7]));
      const cart = group([box(0.9, 0.5, 0.6, 0xb9c4cc, [0, 0.75, 0]), box(0.8, 0.04, 0.5, 0x8a949e, [0, 0.3, 0]), cyl(0.03, 0.03, 0.5, 0x8a949e, [-0.5, 1.0, 0], [0, 0, 0.3], 4), ...[[-0.35, 0.25], [0.35, 0.25], [-0.35, -0.25], [0.35, -0.25]].map(([a, b]) => sphere(0.07, 0x333333, [a, 0.07, b], 5)), ball(0.22, 0.18, 0.22, 0xe98a2b, [0.15, 1.05, 0]), box(0.3, 0.4, 0.2, 0x5ad17a, [-0.2, 1.1, 0.1])], [7.4, 0, -2.6], [0, 0.5, 0]); z6.add(cart); }
    zStatic(z6, X6, 0);
    ctx.collideBox(X6, -11.4, 34, 1.7); ctx.collideBox(X6 - 7, -6, 6.2, 1); ctx.collideBox(X6 + 8.5, -6, 5.2, 1); ctx.collideBox(X6 + 1.5, -2.2, 3.2, 1.8); ctx.collideBox(X6 - 8.6, -1, 1.3, 3.6); ctx.collideCircle(X6 + 7.4, -2.6, 0.6);
    const glassM = mat(0xbfe6f5, { opacity: 0.32 });
    const doors6 = FRZ.map(x => { const h = new THREE.Group(); h.position.set(X6 + x - 1.42, 0.3, -10.63); const d = group([box(2.84, 3.0, 0.05, glassM, [1.42, 1.5, 0])]); const hd = box(0.07, 0.9, 0.09, 0x6d7a86, [2.6, 1.5, 0.06]); h.add(d); h.add(hd); zAdd(h); return h; });
    const myTurkey = packTurkey('label'); myTurkey.position.set(X6 + 1, 1.48, -11.1); zAdd(myTurkey);
    const cashier = zPerson({ shirt: C.green, apron: 0xffffff, hairStyle: 'pony', hair: C.hair[6], skin: C.skin[0], expressive: true }, X6 - 9.9, -1, PI / 2);
    const stocker = zPerson({ shirt: C.green, apron: 0xffffff, hat: 'cap', hatColor: C.green, hair: C.hair[1], skin: C.skin[5], expressive: true }, X6 + 5.4, -9.4, 2.6); stocker.userData.anim = 'work';
    const shopper6 = zPerson('shopper', X6 + 8.2, -3.4, -1.2, 11);

    // ================= ZONE 7 — home kitchen + dining corner (x≈800, indoors) =================
    zb = 7;
    const X7 = 800, z7 = new THREE.Group();
    z7.add(grained(30, 19, 0xc99a6b, 8, [0, 0.03, 1.5], 5)); for (let i = 0; i < 15; i++) z7.add(plane(0.06, 19, 0xb58658, [-14 + i * 2, 0.035, 1.5]));
    z7.add(box(30, 5, 0.4, 0xf3dfb8, [0, 2.5, -8])); z7.add(box(0.4, 5, 12, 0xeed6a8, [-15, 2.5, -2])); z7.add(box(0.4, 5, 12, 0xeed6a8, [15, 2.5, -2])); z7.add(box(30, 1.0, 0.46, 0xe2b97a, [0, 0.5, -8]));
    { const c = P.shelf({ w: 2.6, seed: 21, colors: [0xd9483b, 0xf2c43d, 0x5aa845, 0xe98a2b, 0x7b4fb0, 0xf6ecd6] }); c.position.set(-12.4, 0, -7.5); z7.add(c); z7.add(box(1.6, 2.0, 0.1, 0x7a3b2a, [12.6, 1.0, -7.75])); z7.add(sphere(0.07, C.gold, [12.1, 1.0, -7.66], 6)); z7.add(box(1.4, 0.9, 0.9, 0x8a5a2b, [13.2, 0.45, -3])); z7.add(ball(0.34, 0.27, 0.34, 0xe98a2b, [13.2, 1.15, -3])); }
    z7.add(box(9.4, 1, 1.3, 0x7fa88f, [-3.4, 0.5, -7.1])); z7.add(box(9.6, 0.1, 1.4, 0xf5f0e6, [-3.4, 1.05, -7.1]));
    z7.add(box(1.7, 2.4, 1.3, 0xe4e7ea, [-9.4, 1.2, -7.1])); z7.add(box(0.06, 0.8, 0.08, 0x8a949e, [-8.75, 1.5, -6.42])); z7.add(box(1.7, 0.04, 0.02, 0xb9c4cc, [-9.4, 1.55, -6.44]));
    z7.add(box(1.9, 1.05, 1.3, 0x4a4f57, [0, 0.525, -7.1])); z7.add(box(1.9, 0.06, 1.3, 0x2c3036, [0, 1.1, -7.1])); z7.add(box(1.5, 0.7, 0.02, 0x17191c, [0, 0.52, -6.44])); for (const x of [-0.5, 0.5]) z7.add(cyl(0.22, 0.22, 0.03, 0x555555, [x, 1.14, -7.1], null, 10)); for (let i = 0; i < 4; i++) z7.add(cyl(0.06, 0.06, 0.05, 0xd9d9d9, [-0.6 + i * 0.4, 0.98, -6.42], [PI / 2, 0, 0], 8));
    z7.add(box(1.0, 0.05, 0.7, C.woodLight, [-4, 1.13, -7.0])); z7.add(box(2.6, 1.7, 0.1, 0xbfe6f5, [-4.6, 3.1, -7.78])); z7.add(box(2.8, 0.12, 0.2, C.white, [-4.6, 2.2, -7.7])); z7.add(box(0.08, 1.7, 0.12, C.white, [-4.6, 3.1, -7.74])); for (const s of [-1, 1]) z7.add(box(0.5, 1.9, 0.08, 0xe98a2b, [-4.6 + s * 1.45, 3.1, -7.7]));
    z7.add(box(0.9, 0.12, 0.9, 0x8a949e, [-6.6, 1.08, -7.1])); z7.add(cyl(0.03, 0.03, 0.4, C.steel, [-6.6, 1.3, -7.5], null, 5)); 
    z7.add(box(3.0, 0.08, 0.4, C.wood, [2.6, 2.7, -7.7])); for (let i = 0; i < 5; i++) z7.add(cyl(0.13, 0.13, 0.34, [0xd9483b, 0xf2c43d, 0x5aa845, 0xe98a2b, 0x7b4fb0][i], [1.5 + i * 0.55, 2.92, -7.7], null, 8));
    z7.add(lathe([[0, 0], [0.3, 0.02], [0.34, 0.08]], 0xb5763a, [-1.9, 1.1, -7.1])); z7.add(cyl(0.3, 0.3, 0.05, 0xe9a23b, [-1.9, 1.17, -7.1], null, 12)); z7.add(ball(0.3, 0.24, 0.3, 0xe98a2b, [-7.7, 1.34, -7.2])); z7.add(cyl(0.03, 0.04, 0.12, 0x4f7d3a, [-7.7, 1.6, -7.2], null, 5));
    for (let i = 0; i < 16; i++) z7.add(box(0.32, 0.4, 0.03, C.autumn[i % 4], [-13.2 + i * 1.75, 4.2 - Math.abs(Math.sin(i * 1.1)) * 0.3, -7.76], [0, 0, PI / 4 + i]));
    z7.add(plane(5, 3, 0xb5523a, [-3.5, 0.04, -3.6])); z7.add(plane(4.4, 2.4, 0xd98a5a, [-3.5, 0.045, -3.6]));
    z7.add(box(9.6, 0.55, 0.05, 0xefe8da, [-3.4, 1.38, -7.78]));                                                        // tiled backsplash
    for (let i = 0; i < 9; i++) { const x = -7.9 + i * 0.92; if (Math.abs(x) < 1.1) continue; z7.add(box(0.025, 0.8, 0.02, 0x5f8a72, [x, 0.52, -6.44])); z7.add(sphere(0.035, 0xd9d2c0, [x + 0.12, 0.78, -6.42], 5)); } // cupboard doors + knobs
    z7.add(box(2.1, 1.15, 0.65, 0x7fa88f, [-7.35, 3.05, -7.48])); z7.add(box(0.025, 1.05, 0.02, 0x5f8a72, [-7.35, 3.05, -7.14])); for (const s of [-1, 1]) z7.add(sphere(0.035, 0xd9d2c0, [-7.35 + s * 0.12, 2.7, -7.13], 5)); // wall cupboard
    z7.add(box(1.9, 0.3, 1.0, 0xb9c0c6, [0, 2.5, -7.3])); z7.add(box(0.7, 2.2, 0.55, 0xc9ced3, [0, 3.75, -7.52])); z7.add(box(1.9, 0.05, 0.04, 0x8a949e, [0, 2.38, -6.8]));       // range hood + flue
    z7.add(box(1.72, 0.03, 0.02, 0xb9c4cc, [-9.4, 0.85, -6.44])); z7.add(box(0.06, 0.5, 0.08, 0x8a949e, [-8.75, 0.5, -6.42]));                                        // fridge: freezer drawer line + handle
    // dining corner
    const TH = 0.8; // table-top height: waist-high for the grown-ups standing round it, shoulder-high for the children
    z7.add(plane(8, 7, 0x9a5f3a, [6.2, 0.04, -3])); z7.add(box(4.6, 0.1, 2.2, 0xf6ecd6, [6.2, TH - 0.05, -3.4])); z7.add(box(4.7, 0.4, 2.3, 0xe98a2b, [6.2, TH - 0.27, -3.4])); z7.add(box(4.72, 0.1, 2.32, 0xf6ecd6, [6.2, TH - 0.47, -3.4])); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) z7.add(box(0.14, TH - 0.1, 0.14, C.woodDark, [6.2 + a * 2, (TH - 0.1) / 2, -3.4 + b * 0.8]));
    for (const [x, z] of [[4.8, -4.0], [6.2, -4.0], [7.6, -4.0], [4.8, -2.8], [7.6, -2.8]]) { z7.add(cyl(0.26, 0.2, 0.03, 0xfafafa, [x, TH + 0.02, z], null, 12)); }
    for (const x of [5.5, 6.9]) { z7.add(cyl(0.04, 0.05, 0.3, 0xfafafa, [x, TH + 0.15, -3.4], null, 6)); z7.add(sphere(0.06, glow(0xffd27a), [x, TH + 0.36, -3.4], 6)); }
    z7.add(ball(0.3, 0.14, 0.3, 0xb0122e, [4.5, TH + 0.08, -3.4])); z7.add(ball(0.3, 0.16, 0.3, 0xfbefb8, [7.9, TH + 0.1, -3.4])); z7.add(box(2.2, 1.5, 0.08, 0x6e4a28, [6.2, 3.2, -7.76])); z7.add(box(2.0, 1.3, 0.1, 0xf2c43d, [6.2, 3.2, -7.75])); z7.add(sign('🍂🦃🍂', 0.8, { bg: null }, [6.2, 3.2, -7.68]));
    zStatic(z7, X7, 0);
    ctx.collideBox(X7 - 3.4, -7.1, 9.6, 1.6); ctx.collideBox(X7 - 9.4, -7.1, 1.9, 1.6); ctx.collideBox(X7 + 6.2, -3.4, 4.8, 2.4); ctx.collideBox(X7 + 8, -7.5, 14, 0.8); ctx.collideBox(X7 - 12.4, -7.5, 2.8, 0.9);
    const ovenDoor = new THREE.Group(); ovenDoor.position.set(X7, 0.16, -6.42); ovenDoor.add(dyn(group([box(1.56, 0.76, 0.07, 0x5c6670, [0, 0.38, 0]), box(1.0, 0.36, 0.08, 0x22262b, [0, 0.4, 0]), box(1.2, 0.06, 0.12, 0xd9d9d9, [0, 0.7, 0.06])]))); zAdd(ovenDoor);
    const ovenGlow = box(1.0, 0.36, 0.02, glow(0xff9a3c), [X7, 0.56, -6.36]); ovenGlow.visible = false; zAdd(ovenGlow);
    const cook = zPerson({ hair: C.hair[2], hairStyle: 'bun', shirt: 0xd9483b, apron: C.cream, skin: C.skin[1], expressive: true }, X7 - 6.2, -5.2, 0.7);
    const carver = zPerson({ hair: C.hair[4], hairStyle: 'short', beard: C.hair[4], shirt: 0x4f7d5a, vest: 0x6e4a28, pants: 0x4a4a55, glasses: true, skin: C.skin[0], expressive: true }, X7 + 6.2, -5.3, 0);
    { const knife = dyn(group([box(0.04, 0.34, 0.02, 0xdfe6ea, [0, -0.22, 0.03]), box(0.05, 0.12, 0.04, 0x4a2c17, [0, 0, 0.03])])); knife.position.y = -0.48; carver.userData.armL.add(knife); } // carving knife in the lowered left hand, point down: the right hand is free to wave
    const statue = (o, x, z, ry, anim, sit) => { const p = ctx.kit.person(Object.assign({ shadow: false }, o)); p.userData.anim = anim; p.userData.sitting = !!sit; for (let i = 0; i < 40; i++) p.userData.tick(0.05, 0.8 + i * 0.05); p.position.set(x, sit ? -0.18 : 0, z); p.rotation.y = ry; p.updateMatrixWorld(true); bake(p); zAdd(p); return p; };
    statue({ hair: C.hair[5], hairStyle: 'bun', shirt: C.purple, glasses: true, skin: C.skin[4] }, X7 + 4.7, -5.2, 0.2, 'laugh');
    statue({ hair: C.hair[1], hairStyle: 'curly', shirt: 0x3f7fd1, skin: C.skin[3], scale: 0.7 }, X7 + 7.8, -5.1, -0.2, 'talk');
    statue({ hair: C.hair[3], hairStyle: 'pony', shirt: C.pink, skin: C.skin[0], scale: 0.66 }, X7 + 9.2, -3.3, -PI / 2, 'wave');
    statue({ hair: C.hair[0], hairStyle: 'short', shirt: 0xe9a23b, skin: C.skin[2] }, X7 + 3.2, -3.3, PI / 2, 'laugh');

    showZone(1);
    // =================== THE STORY ===================
    Object.assign(ctx._tk, { dozer, harvester, lift, haul, mixer, stockBarn: (k, n) => stockBarn(k, n), vet, make: { roastTurkey, packTurkey, turkeyBird, poult, egg }, hairnet,
      people: { surveyor, builder, farmer, tech, collector, driver2, grower, vet, inspector, packer, driver4, cashier, stocker, shopper6, cook, carver } }); // handles for the test scripts
    const TOTAL = 13; let step = 0; const done = () => {}, big = () => ctx.progress(++step, TOTAL);
    const guide = new THREE.Object3D(); ctx.scene.add(guide); let guideFn = null; ctx.onUpdate(() => { if (guideFn) { const p = guideFn(); if (p) guide.position.set(p[0], 0, p[1]); } });
    const goalTo = (icon, text, fn) => { guideFn = fn; const p = fn(); if (p) guide.position.set(p[0], 0, p[1]); ctx.goal(icon, text, guide); };
    const near = (list) => { let b = null, bd = 1e9; for (const p of list) { const d = Math.hypot(p[0] - ctx.player.position.x, p[1] - ctx.player.position.z); if (d < bd) { bd = d; b = p; } } return b; };

    // ---------- 1. Building a place to grow ----------
    async function ch1() {
      ctx.tp(-1.5, 1.2, PI); ctx.bounds(-19, -15.5, 10.5, 5.4); ctx.progress(0, TOTAL);
      ctx.say(surveyor, 'Turkeys need a home first! 📐');
      // survey: mark the four corners by walking to them
      const corners = [[-10, -4], [6, -4], [6, -12], [-10, -12]], flags = [];
      const marks = corners.map(([x, z]) => { const m = group([cyl(0.5, 0.5, 0.04, mat(0xffd84a, { opacity: 0.6 }), [0, 0.08, 0], null, 14), cyl(0.04, 0.04, 0.8, 0xffffff, [0, 0.4, 0], null, 5)], [x, 0, z]); ctx.add(m); return m; });
      const leftC = () => near(marks.filter(m => m.parent).map(m => [m.position.x, m.position.z])); goalTo('📐', 'Mark 4 corners', leftC);
      await ctx.collect({ items: marks, r: 1.3, spin: false, sfx: 'plant', onEach: (o, left) => {
        const f = dyn(group([cyl(0.035, 0.035, 1.5, 0xfafafa, [0, 0.75, 0], null, 5), box(0.5, 0.32, 0.03, 0xe8412f, [0.27, 1.32, 0])])); f.position.copy(o.position); ctx.add(f); flags.push(f); hop(f, 0.3, 0.25);
        if (left) ctx.goal('📐', 'Mark ' + left + ' more', guide); else { guideFn = null; ctx.goal('📐', 'All marked!'); }
      } });
      const strings = dyn(group([box(16, 0.03, 0.03, 0xffffff, [BX, 0.9, -4]), box(16, 0.03, 0.03, 0xffffff, [BX, 0.9, -12]), box(0.03, 0.03, 8, 0xffffff, [-10, 0.9, BZ]), box(0.03, 0.03, 8, 0xffffff, [6, 0.9, BZ])])); ctx.add(strings); ctx.audio.play('success'); done();
      // the bulldozer levels the ground
      ctx.say(builder, 'Flat ground first! 🚜', 2.4); ctx.fact('📐', 'Engineers plan where rain will drain before crews move earth.'); dozer.visible = true; dozer.position.set(-24, 0, -10.4); dozer.rotation.y = PI / 2;
      const eng = ctx.every(0.4, () => ctx.audio.play('engine')); const dust = ctx.onUpdate(() => { if (rnd() < 0.5) ctx.burst([dozer.position.x + 1.5, 0.2, dozer.position.z], { color: 0x9a7448, n: 3, size: 0.25, speed: 1.5, y: 0 }); });
      ctx.focus([BX, 0.5, BZ], 3.4, { dist: shot(17), pitch: 0.6 });
      await ctx.moveAlong(dozer, [[-9, -10.4]], 16); ctx.tween(mounds.scale, { y: 0.01 }, 1.6); ctx.tween(mounds.position, { y: -0.1 }, 1.6);
      await ctx.moveAlong(dozer, [[6.5, -10.4], [6.5, -6.2], [-11, -6.2], [-26, -8]], 16); eng(); dust(); dozer.visible = false; mounds.visible = false;
      // concrete
      ctx.audio.play('honk'); ctx.say(builder, 'Here comes the concrete! 🚛', 2.6);
      await ctx.moveAlong(mixer, [[-19, 11], [-12.6, 4], [-12.6, -7]], 15); const mixC = ctx.collideBox(-12.6, -7, 2.6, 6.8);
      ctx.goal('🚛', 'Pour the concrete', [-10.6, -3.2]);
      await use({ at: [-10.6, -3.2], icon: '🚛', label: 'Pour', hold: 1.4, sfx: 'pour', r: 2.8, y: 1.6 });
      slab.visible = true; ctx.lock(); const pourS = ctx.every(0.3, () => { ctx.audio.play('pour'); ctx.burst([-10, 0.4, -8.6], { color: 0xb8b4aa, n: 5, size: 0.3, speed: 1.6, y: 0 }); });
      ctx.cam.shake = 0.06; await ctx.tween(slab.scale, { x: 1 }, 2.0, 'inOut'); pourS(); flags.forEach(f => ctx.remove(f)); ctx.remove(strings);
      const slabC = ctx.collideBox(BX, BZ, 16.4, 8.4); if (ctx.player.position.x > -10.6 && ctx.player.position.x < 6.6 && ctx.player.position.z < -3.4 && ctx.player.position.z > -12.6) ctx.tp(ctx.player.position.x, -3.2);
      barnDone.c = slabC; ctx.unlock(); done(); mixC.remove(); ctx.moveAlong(mixer, [[-12.6, 4], [-19, 11], [-70, 11]], 10).then(() => { mixer.visible = false; });
      // walls: hammer three sections
      frame.visible = true; let up = 0; builder.userData.anim = 'work'; ctx.say(builder, 'Hammer time! 🔨', 2.4);
      ctx.goal('🔨', 'Raise 3 walls', [BX, -3.3]);
      walls.forEach((w, i) => ctx.interact({ at: [w.position.x, -3.1], face: [w.position.x, -4], icon: '🔨', label: 'Hammer', hold: 0.6, sfx: 'hammer', r: 2.3, y: 1.8, onUse: async () => {
        ctx.act('work', 0.7); for (let k = 0; k < 3; k++) ctx.after(k * 0.2, () => ctx.audio.play('hammer')); w.visible = true; ctx.burst([w.position.x, 1, -3.9], { color: 0xd2a567, n: 14, size: 0.2 });
        await ctx.tween(w.scale, { y: 1 }, 0.7, 'outBack'); up++; if (up < 3) ctx.goal('🔨', 'Raise ' + (3 - up) + ' more', [walls.find(x => !x.visible).position.x, -3.3]);
      } }));
      await ctx.until(() => up >= 3); builder.userData.anim = 'idle';
      // roof
      ctx.goal('🏠', 'Watch the roof'); ctx.lock(); roof.visible = true; ctx.focus([BX, 3, BZ], 2.8, { dist: shot(19), pitch: 0.35 }); await ctx.wait(0.5);
      await ctx.tween(roof.position, { y: 0.16 + WH }, 1.3, 'outBounce'); ctx.audio.play('thud'); ctx.cam.shake = 0.25; frame.visible = false; ctx.burst([BX, 4, -4], { color: 0xffffff, n: 20, size: 0.3, speed: 5 });
      builder.userData.anim = 'cheer'; await ctx.wait(0.9); builder.userData.anim = 'idle'; ctx.unlock(); big();
      // water + power: one switch brings the barn to life
      ctx.say(builder, 'Now water and power! 💧⚡', 2.6); ctx.fact('🌬️', 'Installers fit barns with heating, ventilation, feeders and controls.');
      ctx.goal('⚡', 'Water and power on', sw1); await use({ at: sw1, icon: '⚡', label: 'Switch on', r: 2.6, y: 1.0, sfx: 'click' });
      ctx.tween(sw1.rotation, { z: -0.7 }, 0.25); wire.visible = true; ctx.audio.play('sparkle'); ctx.audio.play('water');
      for (let i = 0; i < 8; i++) ctx.after(i * 0.14, () => { ctx.burst([-14.6 + i * 0.6, 0.3, -2.8 - (i > 6 ? 0.5 : 0)], { color: 0x7fc8ff, n: 5, size: 0.18, speed: 1.2, y: 0 }); if (i % 3 === 0) ctx.audio.play('splash'); });
      ctx.emote([-12.9, 0.6, -2.8], '💧', { y: 0 }); await ctx.wait(0.3);
      lit.visible = true; fans1.forEach(f => { f.visible = true; f.userData.on = true; }); ctx.audio.play('machine'); ctx.burst([8.6, 5, -4.8], { color: 0xffe066, n: 14, size: 0.22 });
      builder.userData.anim = 'cheer'; surveyor.userData.anim = 'cheer'; big();
      ctx.thank('🏗️', ['Surveyors', 'Concrete workers', 'Carpenters', 'Electricians', 'Plumbers']);
      await ctx.wait(3.0); builder.userData.anim = surveyor.userData.anim = 'idle';
    }

    // ---------- 2. Beginning a new life ----------
    function cozyGame() { // warmth + humidity: tap to keep both bars in the green while the eggs warm up
      return new Promise(res => {
        const bar = (id, top, col) => '<div style="display:flex;flex-direction:column;align-items:center;gap:8px"><div style="font-size:40px">' + top + '</div><div style="position:relative;width:64px;height:210px;border-radius:18px;background:#e9dcc0;overflow:hidden;box-shadow:inset 0 2px 6px rgba(0,0,0,.2)"><div style="position:absolute;left:0;right:0;bottom:50%;height:35%;background:#bfe8b0"></div><div id="' + id + '" style="position:absolute;left:10px;right:10px;bottom:0;height:10%;border-radius:12px 12px 0 0;background:' + col + '"></div></div></div>';
        const p = ctx.ui.panel('<style>@media (max-width:480px){#panel .box{padding:18px 12px!important}.tkRow{gap:18px!important;padding:4px 0!important}.tkBtns{gap:110px!important}}@media (max-height:480px){#panel .box{padding:10px 22px!important}.tkBtns{margin-top:8px!important}}#tkBW,#tkBH{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}</style><div class="tkRow" style="display:flex;gap:34px;align-items:flex-end;justify-content:center;padding:4px 14px">' + bar('tkW', '🌡️', '#f08a3c') + '<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><div id="tkE" style="font-size:86px;line-height:1">🥚</div><div style="width:150px;height:16px;border-radius:8px;background:#e9dcc0;overflow:hidden"><div id="tkP" style="height:100%;width:0;background:#5ad17a"></div></div><div style="font-size:17px;font-weight:700;color:#4a2c17">Keep both green!</div></div>' + bar('tkH', '💧', '#4aa3df') + '</div><div class="tkBtns" style="display:flex;gap:150px;justify-content:center;margin-top:14px"><button id="tkBW" style="font-size:44px;width:96px;height:96px;border-radius:50%;border:0;background:#ffd9a8;box-shadow:0 5px 0 #d9a066;cursor:pointer">🔥</button><button id="tkBH" style="font-size:44px;width:96px;height:96px;border-radius:50%;border:0;background:#bfe0f5;box-shadow:0 5px 0 #7fb0d0;cursor:pointer">💦</button></div>');
        const $ = (id) => p.el.querySelector('#' + id), s = { w: 0.12, h: 0.12, t: 0 }, NEED = 3.2;
        $('tkBW').onclick = () => { s.w = Math.min(1, s.w + 0.13); ctx.audio.play('fire'); }; $('tkBH').onclick = () => { s.h = Math.min(1, s.h + 0.13); ctx.audio.play('splash'); };
        const stop = ctx.onUpdate((dt) => {
          s.w = Math.max(0.03, s.w - dt * 0.055); s.h = Math.max(0.03, s.h - dt * 0.055);
          const okW = s.w >= 0.5 && s.w <= 0.85, okH = s.h >= 0.5 && s.h <= 0.85; if (okW && okH) s.t += dt;
          $('tkW').style.height = (s.w * 100) + '%'; $('tkH').style.height = (s.h * 100) + '%'; $('tkW').style.background = s.w > 0.85 ? '#e8412f' : '#f08a3c'; $('tkH').style.background = s.h > 0.85 ? '#3f5fd1' : '#4aa3df';
          $('tkP').style.width = Math.min(100, s.t / NEED * 100) + '%'; $('tkE').style.transform = okW && okH ? 'rotate(' + (Math.sin(ctx.time * 14) * 6) + 'deg) scale(1.08)' : ''; $('tkE').textContent = s.w > 0.85 ? '🔥' : okW && okH ? '🥚' : '❄️';
          const pulse = 1 + Math.max(0, Math.sin(ctx.time * 9)) * 0.14; for (const [id, v, glowC] of [['tkBW', s.w, '#ff9a3c'], ['tkBH', s.h, '#4aa3df']]) { const b = $(id); b.style.transform = v < 0.5 ? 'scale(' + pulse + ')' : ''; b.style.outline = v < 0.5 ? '5px solid ' + glowC : 'none'; }
          p.el.dataset.w = s.w.toFixed(2); p.el.dataset.h = s.h.toFixed(2);
          if (s.t >= NEED) { stop(); $('tkE').textContent = '🥚'; ctx.audio.play('success'); ctx.after(0.5, () => { p.close(); res(); }); }
        });
      });
    }
    async function ch2() {
      ctx.bounds(null);
      await ctx.chapter({ n: 2, title: 'The Hatchery', emoji: '🥚', env: ['indoor', { ground: 0xbfae96, top: '#f3d3a0', bottom: '#fff1d8', fog: false }], at: [X2 - 5, 2.2], face: PI, music: 'calm', cam: { yaw: 0, pitch: 0.5, dist: 10 },
        setup: () => { showZone(2); poultTruck.position.set(X2 + 9.6, 0, 0.9); poultTruck.rotation.y = PI / 2; } });
      const truckC = ctx.collideBox(X2 + 9.6, 0.9, 6.8, 2.6); ctx.bounds(X2 - 11.3, -8.9, X2 + 11.4, 2.9);
      // eggs arrive
      ctx.say(collector, 'Fresh eggs for you! 🥚'); ctx.goal('🥚', 'Carry the eggs', eggCrate);
      await use({ at: eggCrate, icon: '🥚', label: 'Pick up', r: 2.2, y: 1.1 }); hold(eggCrate, 0.8, 0, 0.1); collector.userData.anim = 'wave'; ctx.after(1.5, () => { collector.userData.anim = 'idle'; });
      ctx.goal('🥚', 'Fill the incubator', [X2, -8.9]); await use({ at: [X2, -8.7], face: [X2, -10.3], icon: '🥚', label: 'Load', r: 2.2, y: 1.7 }); ctx.fact('🐦', 'Long before hatching, breeding specialists select the parent birds.');
      ctx.remove(ctx.drop()); for (const t of trays[1]) { t.f.visible = true; t.e.visible = false; hop(t.f, 0.12, 0.3); } ctx.audio.play('clink'); ctx.burst([X2, 1.6, -9.6], { color: 0xfff2a8, n: 10, size: 0.18 }); done();
      // turn the eggs
      ctx.say(tech, 'Turn them, like a mama bird! 🔄'); let turned = 0; ctx.goal('🔄', 'Turn the eggs', [X2 + INC[0], -9.2]);
      INC.forEach((x, i) => ctx.interact({ at: [X2 + x, -8.7], face: [X2 + x, -10.3], icon: '🔄', label: 'Turn', r: 2.2, y: 1.7, sfx: 'click', onUse: async () => {
        for (const t of trays[i]) ctx.tween(t.f.rotation, { z: 0.3 }, 0.6, 'inOut'); ctx.audio.play('machine'); ctx.emote([X2 + x, 2.6, -9.6], '🔄', { y: 0 }); turned++;
        const nxt = INC.findIndex((_, k) => trays[k][0].f.rotation.z < 0 && k !== i); ctx.goal('🔄', turned < 3 ? 'Turn ' + (3 - turned) + ' more' : 'Nicely turned!', turned < 3 && nxt >= 0 ? [X2 + INC[nxt], -9.2] : null);
      } }));
      await ctx.until(() => turned >= 3); done(); await ctx.wait(0.5);
      // warmth + humidity
      ctx.say(tech, 'Now keep them cozy! 🌡️'); ctx.goal('🌡️', 'Keep eggs cozy', [X2 + 3.5, -8.9]);
      await use({ at: [X2 + 3.5, -8.8], face: [X2 + 3.5, -9.9], icon: '🌡️', label: 'Controls', r: 2.2, y: 1.9 }); await cozyGame(); big();
      ctx.fact('🥚', 'Eggs need warmth, humidity and turning for about four weeks.');
      await ctx.wait(3.6);
      // four weeks later: hatching
      ctx.goal('🐣', 'Watch them hatch');
      await ctx.chapter({ title: 'About 4 weeks later…', emoji: '🗓️', at: [X2 + 0.5, -3.2], face: PI, setup: () => { cal0.visible = false; cal1.visible = true; tech.position.set(X2 - 9.2, 0, -8.3); tech.rotation.y = 0.8; collector.visible = false; } });
      ctx.lock(); const wob = ctx.onUpdate((dt, t) => { for (const c of trays) for (const tr of c) tr.f.rotation.z = 0.3 + Math.sin(t * 34 + tr.f.position.y * 5) * 0.045; }); const crk = ctx.every(0.22, () => ctx.audio.play('pop'));
      await ctx.wait(1.3); wob(); crk();
      const chicks = [];
      for (let i = 0; i < 6; i++) {
        const x = X2 + INC[i % 3] + (i < 3 ? -0.8 : 0.8), c = poult({ s: 1.0 }); c.position.set(x, 1.25, -9.7); c.scale.setScalar(0.01); ctx.add(c); ctx.tween(c.scale, { x: 1, y: 1, z: 1 }, 0.25, 'outBack');
        ctx.burst([x, 1.4, -9.7], { color: 0xfff6e0, n: 8, size: 0.16, speed: 2 }); ctx.audio.play('peep'); if (i === 2) for (const col of trays) for (const tr of col) { tr.f.visible = false; tr.e.visible = true; tr.e.rotation.z = 0; }
        const tz = -7.6 + (i % 2) * 0.9; ctx.tween(c.position, { z: tz }, 0.45, 'linear'); ctx.tween(c.position, { y: 1.9 }, 0.2, 'out').then(() => ctx.tween(c.position, { y: 0 }, 0.25, 'in')).then(() => { chicks.push(flock.add(c, { rect: [X2 - 8.5, -7.8, X2 + 8, -1], speed: 1.5, size: 0.45 })); });
        await ctx.wait(0.3);
      }
      await ctx.wait(0.6); ctx.unlock(); ctx.say(tech, 'Hello, little poults! 🐥', 2.5);
      // gather: walk up to each poult and it follows you in a line
      const line = []; const freeOnes = () => chicks.filter(b => b.mode !== 'follow');
      const nearest = () => { let best = null, bd = 1e9; for (const b of freeOnes()) { const d = Math.hypot(b.obj.position.x - ctx.player.position.x, b.obj.position.z - ctx.player.position.z); if (d < bd) { bd = d; best = b; } } return best; };
      let tgt = nearest(); ctx.goal('🐥', 'Gather 6 poults', tgt.obj);
      const stopG = ctx.onUpdate(() => { for (const b of freeOnes()) if (!ctx.locked && Math.hypot(b.obj.position.x - ctx.player.position.x, b.obj.position.z - ctx.player.position.z) < 1.5) {
        b.mode = 'follow'; b.leader = line.length ? line[line.length - 1].obj : ctx.player; b.gap = line.length ? 0.75 : 1.1; line.push(b); b.hop = 1; ctx.audio.play('peep'); ctx.emote(b.obj, '💛', { y: 0.7 });
        tgt = nearest(); if (tgt) ctx.goal('🐥', 'Gather ' + (6 - line.length) + ' more', tgt.obj); } else if (tgt && tgt.mode === 'follow') { tgt = nearest(); } });
      await ctx.until(() => line.length >= 6); stopG(); done(); ctx.fact('🐣', 'Baby turkeys are called poults.');
      // lead them to the truck
      ctx.say(driver2, 'All aboard for the farm! 🚚', 3); ctx.goal('🚚', 'Lead them to truck', [X2 + 5.6, 0.9]);
      await use({ at: [X2 + 5.4, 0.9], icon: '🐥', label: 'Load', r: 2.4, y: 1.6 });
      ctx.lock(); for (const b of line) { b.mode = 'goto'; b.tx = X2 + 5.6; b.tz = 0.9; b.speed = 3.5; b.onArrive = (bb) => { flock.remove(bb); ctx.audio.play('peep'); ctx.tween(bb.obj.position, { x: X2 + 7.2 }, 0.4, 'linear'); ctx.tween(bb.obj.position, { y: 1.6 }, 0.2, 'out').then(() => ctx.tween(bb.obj.position, { y: 1.1 }, 0.2, 'in')).then(() => { ctx.remove(bb.obj); bb.gone = true; }); }; await ctx.wait(0.28); }
      await ctx.until(() => line.every(b => b.gone)); ctx.unlock(); big();
      ctx.thank('🥚', ['Breeding specialists', 'Egg collectors', 'Incubator technicians', 'Poult-delivery drivers']);
      driver2.userData.anim = 'wave'; ctx.goal('🚚', 'Hop in the truck', poultTruck); await use({ at: [X2 + 6.4, 1.2], icon: '🚚', label: 'Hop in', r: 3.2, y: 2.4 });
      leave(); ctx.player.visible = false; driver2.visible = false; ctx.audio.play('honk'); truckC.remove(); ctx.bounds(null); ctx.moveAlong(poultTruck, [[X2 + 21, 0.9]], 9); await ctx.wait(1.5);
    }

    // ---------- 3. Feeding and caring every day ----------
    async function ch3() {
      if (DEV.get('tksub') === 'barn') return ch3barn();
      ctx.bounds(null);
      await ctx.chapter({ n: 3, title: 'Feeding & Caring', emoji: '🌽', env: 'autumn', at: [4.6, 2.8], face: -PI / 2, music: 'farm', cam: { yaw: 0, pitch: 0.45, dist: 10 },
        setup: () => { showZone(1); barnDone(); corn.forEach(c => c.scale.setScalar(1)); harvester.visible = true; farmer.visible = true; farmer.position.set(7.5, 0, 2.6); farmer.rotation.y = -1; poultTruck.position.set(44, 0, 11); poultTruck.rotation.y = -PI / 2; poultTruck.visible = true; doorOpen.visible = true; ctx.player.visible = true; } });
      arrive(); ctx.bounds(-9, -15.5, 32.6, 5.4); const harvC = ctx.collideBox(18.5, 1.75, 3.4, 6.4);
      // the poults arrive at the barn you built
      ctx.lock(); ctx.goal('🐥', 'Poults arrive!'); ctx.audio.play('honk'); ctx.focus([upright() ? -5.8 : -3.4, 0.6, -2.4], 7.4, { dist: shot(9.5), pitch: 0.55 }); // (upright: a little to the left, to keep the truck in the picture)
      await ctx.moveAlong(poultTruck, [[30, 11], [15, 1.5], [7, -0.9], [-8.7, -0.9]], 13);
      const babies = []; for (let i = 0; i < 8; i++) { const c = poult({ s: 1.0 }); c.position.set(-5.0, 1.0, -0.6 - (i % 2) * 0.6); ctx.add(c); ctx.audio.play('peep'); ctx.tween(c.position, { y: 0 }, 0.25, 'in'); c.scale.setScalar(1.1); babies.push(flock.add(c, { mode: 'goto', tx: -2 + (i % 3 - 1) * 0.6, tz: -3.9, speed: 2.3 + (i % 3) * 0.3, onArrive: (b) => { flock.remove(b); ctx.burst(b.obj.position, { color: 0xf8dc6e, n: 5, size: 0.16 }); ctx.remove(b.obj); b.gone = true; } })); await ctx.wait(0.22); }
      await ctx.until(() => babies.every(b => b.gone)); doorOpen.visible = false; ctx.audio.play('thud'); ctx.moveAlong(poultTruck, [[-16, -0.9], [-24, 11], [-70, 11]], 12).then(() => { poultTruck.visible = false; }); ctx.unlock();
      // corn harvest with the combine
      ctx.say(farmer, 'Hungry poults! Let\'s make feed 🌽'); ctx.fact('🌽', 'Farmers grow corn and soybeans for turkey feed.'); ctx.goal('🚜', 'Drive the combine', harvester);
      await use({ at: harvester, icon: '🚜', label: 'Drive', y: 2.8, r: 3.4 }); harvC.remove(); ctx.goal('🌽', 'Harvest the corn!');
      let cut = 0; const reap = ctx.onUpdate(() => { for (const c of corn) if (c.parent && Math.hypot(c.position.x - harvester.position.x, c.position.z - harvester.position.z) < 2.0) { ctx.burst([c.position.x, 0.8, c.position.z], { color: 0xf2c43d, n: 8, size: 0.25 }); ctx.remove(c); cut++; ctx.audio.play('snip'); } });
      await ctx.ride(harvester, [[22, -0.5], [22, -12.4], [25, -12.4], [25, -3.4], [28, -3.4], [28, -12.4], [31, -12.4], [31, -2.4], [26.5, 0.6], [21.5, -3], [21.5, -9.0]], { speed: 8.5 });
      reap(); corn.forEach(c => { if (c.parent) ctx.remove(c); }); ctx.collideBox(21.5, -9.3, 3.8, 6.8); ctx.tp(14.8, -0.8, PI);
      for (let i = 0; i < 12; i++) ctx.after(i * 0.1, () => { ctx.burst([19.4 - i * 0.5, 3.6 - Math.abs(i - 5) * 0.16, -8.8 + i * 0.27], { color: 0xf2c43d, n: 4, size: 0.2, speed: 0.8, y: 0 }); if (i % 3 === 0) ctx.audio.play('pour'); });
      // the feed mill
      ctx.goal('⚙️', 'Make the feed', millLever);
      await use({ at: millLever, icon: '⚙️', label: 'Mix', hold: 1.1, sfx: 'machine', y: 1.9, r: 2.4 });
      await feedMixGame(ctx); ctx.goal('⚙️', 'Grinding…'); ctx.fact('⚖️', 'Nutritionists plan a balanced diet, and feed-mill workers prepare it.'); // mini-game: follow the nutritionist's recipe (corn, soy, vitamins) scoop by scoop
      ctx.tween(millStick.rotation, { z: -0.6 }, 0.3); const shake = ctx.onUpdate((dt, t) => { mill.position.x = 13.4 + Math.sin(t * 50) * 0.03; mill.rotation.x = Math.sin(t * 37) * 0.012; }); const ms = ctx.every(0.4, () => { ctx.audio.play('machine'); ctx.burst([13.4, 2.1, -5.8], { color: 0xf2c43d, n: 4, size: 0.18, speed: 1.5 }); });
      await ctx.wait(1.6); shake(); ms(); mill.position.x = 13.4; mill.rotation.x = 0;
      const feedSack = group([P.sack({ color: 0xe3c98a }), sign('🌽', 0.36, { bg: null }, [0, 0.42, 0.27])], [13.4, 0.1, -3.2]); feedSack.scale.setScalar(0.01); ctx.add(feedSack); ctx.audio.play('pop'); await ctx.tween(feedSack.scale, { x: 1, y: 1, z: 1 }, 0.4, 'outBack'); big();
      ctx.thank('🌽', ['Corn and soybean farmers', 'Grain haulers', 'Animal nutritionists', 'Feed-mill operators']);
      ctx.goal('💪', 'Take the feed', feedSack); await use({ at: feedSack, icon: '💪', label: 'Lift', y: 1.3, r: 2.4 }); holdSack(feedSack);
      ctx.goal('🦃', 'Carry it to barn', [-2, -2.8]); await use({ at: [-2, -2.6], icon: '🚪', label: 'Go in', y: 2.2, r: 2.6 });
      await ch3barn();
    }
    function stockBarn(kind, n) { // put n poults or turkeys in the barn
      for (const b of barnBirds.splice(0)) { flock.remove(b); ctx.remove(b.obj); }
      const r = seeded(kind === 'poult' ? 5 : 9);
      for (let i = 0; i < n; i++) { const o = kind === 'poult' ? poult({ s: 1.0 }) : turkeyBird(); o.position.set(X3 - 9 + r() * 19, 0, -8.4 + r() * 9); o.rotation.y = r() * 6; ctx.add(o); barnBirds.push(flock.add(o, { rect: [X3 - 11, -8.8, X3 + 11.5, 1.3], speed: kind === 'poult' ? 1.6 : 1.1, size: kind === 'poult' ? 0.5 : 0.95 })); }
    }
    async function ch3barn() {
      ctx.bounds(null);
      await ctx.chapter({ title: 'Inside the Barn', emoji: '🐥', env: ['indoor', { ground: 0x8fbf63, top: '#9fd0f5', bottom: '#e6f5ff', fog: false }], at: [X3 + 12, -3.6], face: -PI / 2, cam: { yaw: 0, pitch: 0.5, dist: 10.5 }, setup: () => { showZone(3); stockBarn('poult', 8); } });
      ctx.bounds(X3 - 14.2, -9.2, X3 + 13.8, 1.9);
      ctx.say(grower, 'Every day: feed, water, comfort! 📋', 3.2);
      if (!ctx.carrying) { const s = group([P.sack({ color: 0xe3c98a }), sign('🌽', 0.36, { bg: null }, [0, 0.42, 0.27])]); ctx.add(s); holdSack(s); }
      // feed
      ctx.goal('🌽', 'Fill the feeder', [X3 - 12.4, FZ + 2.3]);
      await use({ at: [X3 - 12.4, FZ + 2.5], face: [X3 - 12.4, FZ + 1.5], icon: '🌽', label: 'Pour', hold: 1.0, sfx: 'pour', y: 1.6, r: 2.4 });
      ctx.remove(ctx.drop()); const ps = ctx.every(0.2, () => { ctx.burst([X3 - 12.4, 1.1, FZ + 1.5], { color: 0xe9c46a, n: 4, size: 0.18, speed: 0.8, y: 0 }); ctx.audio.play('pour'); });
      for (let i = 0; i < 4; i++) { await ctx.wait(0.45); const f = fills[i]; f.visible = true; ctx.tween(f.scale, { x: 1, y: 1, z: 1 }, 0.35, 'outBack'); ctx.audio.play('pop'); ctx.burst([X3 + FEED[i], 0.5, FZ], { color: 0xe9c46a, n: 6, size: 0.16 }); }
      ps(); barnBirds.forEach((b, i) => { const fx = X3 + FEED[i % 4]; b.rect = [fx - 1.1, FZ - 1.0, fx + 1.1, FZ + 1.1]; b.wait = 0.05 + i * 0.08; b.speed = 3; b.peck = true; }); ctx.after(3, () => barnBirds.forEach(b => { b.speed = 1.6; }));
      tick(1); await ctx.wait(0.8);
      // water
      ctx.goal('💧', 'Water and fans on', valve3); await use({ at: valve3, icon: '💧', label: 'Turn', y: 1.0, r: 2.3, sfx: 'water' });
      ctx.tween(valve3.rotation, { z: 6.3 }, 1.0); drinkW.visible = true; for (const x of DRINK) ctx.burst([X3 + x, 0.5, WZ], { color: 0x7fc8ff, n: 6, size: 0.16, speed: 1.2 }); ctx.audio.play('splash');
      barnBirds.forEach((b, i) => { if (i % 2) { const dx = X3 + DRINK[(i >> 1) % 5]; b.rect = [dx - 1, WZ - 1, dx + 1, WZ + 1]; b.wait = 0.05; b.speed = 3; } }); tick(2); await ctx.wait(0.7); ctx.goal('🌡️', 'Fresh air too');
      fans3.forEach(f => { f.userData.on = true; }); ctx.audio.play('wind'); for (let i = 0; i < 6; i++) ctx.after(i * 0.15, () => ctx.burst([X3 - 13 + i * 3, 2.2, -4 + (i % 2) * 2 - 1], { color: 0xffffff, n: 4, size: 0.14, speed: 1.5, y: 0 })); tick(3); big();
      grower.userData.anim = 'cheer'; ctx.say(grower, 'Happy, healthy birds! 💛', 2.4); await ctx.wait(2.4); grower.userData.anim = 'idle';
      // months pass
      await ctx.chapter({ title: 'Months of daily care later…', emoji: '🗓️', at: [X3 + 4, -0.5], face: PI, setup: () => { stockBarn('turkey', 8); } });
      ctx.fact('🦃', 'Turkeys need daily care for months before Thanksgiving.'); ctx.audio.play('gobble');
      const gob = ctx.every(3.4, () => { const b = barnBirds[Math.floor(rnd() * barnBirds.length)]; if (b && b.obj.parent) { b.hop = 1; ctx.audio.play('gobble'); } });
      // the vet
      const sick = barnBirds[3]; sick.mode = 'still'; sick.peck = false; sick.obj.position.set(X3 - 3, 0, -1.6); sick.obj.rotation.y = 0.6; sick.inner.rotation.x = 0.35;
      const sneeze = ctx.every(1.5, () => ctx.emote(sick.obj, '🤒', { y: 1.3 }));
      ctx.say(grower, 'Uh-oh, one feels poorly 🤒', 3); ctx.goal('🤒', 'Help the sick turkey', sick.obj);
      await use({ at: sick.obj, icon: '💚', label: 'Call the vet', y: 1.7, r: 2.4 });
      ctx.lock(); vet.visible = true; vet.position.set(X3 + 14.5, 0, -4); vet.userData.anim = 'walk'; ctx.focus(sick.obj, 6.2, { dist: shot(8), pitch: 0.45 });
      { const sp = sick.obj.position, pp = ctx.player.position; let dx = sp.x - pp.x, dz = sp.z - pp.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; const vx = Math.max(X3 - 12, Math.min(X3 + 12, sp.x + dx * 1.3)), vz = Math.max(-8.6, Math.min(1.4, sp.z + dz * 1.3));
        await ctx.moveAlong(vet, [[X3 + 8, -2.2], [vx, vz]], 6.5); vet.rotation.y = Math.atan2(sp.x - vx, sp.z - vz); }
      ctx.scene.attach(vetBag); vetBag.rotation.set(0, vet.rotation.y + PI / 2, 0); vetBag.position.set(vet.position.x + Math.cos(vet.rotation.y) * 0.6, 0.27, vet.position.z - Math.sin(vet.rotation.y) * 0.6); // the bag is put down: both hands free for the check-up
      vet.userData.anim = 'work'; sneeze(); ctx.say(vet, 'Let me take a look… 💊', 1.8);
      await ctx.wait(1.8); vet.userData.anim = 'cheer'; sick.inner.rotation.x = 0; sick.hop = 1; ctx.emote(sick.obj, '💚', { y: 1.3 }); ctx.audio.play('gobble'); ctx.audio.play('success'); tick(4);
      await ctx.wait(1.1); sick.mode = 'wander'; sick.wait = 0.1; vet.userData.anim = 'idle'; ctx.unlock(); big(); gob();
      ctx.thank('🦃', ['Turkey growers', 'Barn workers', 'Veterinarians']);
      await ctx.wait(2.2);
    }

    // ---------- 4. Preparing the turkey for our table ----------
    async function ch4() {
      if (DEV.get('tksub') === 'plant') return ch4plant();
      if (!barnBirds.length || ctx.player.position.x < X3 - 20) { // (only when a test jumps straight here)
        await ctx.chapter({ env: ['indoor', { ground: 0x8fbf63, top: '#9fd0f5', bottom: '#e6f5ff', fog: false }], at: [X3 + 4, -0.5], face: PI, cam: { yaw: 0, pitch: 0.5, dist: 10.5 }, setup: () => { showZone(3); stockBarn('turkey', 8); fills.forEach(f => { f.visible = true; f.scale.setScalar(1); }); drinkW.visible = true; ticks.forEach(t => { t.visible = true; }); fans3.forEach(f => { f.userData.on = true; }); } });
        ctx.bounds(X3 - 14.2, -9.2, X3 + 13.8, 1.9);
      }
      // the live-haul truck backs up to the door
      ctx.say(grower, 'They\'re all grown! Truck\'s here 🚚', 2.4); ctx.goal('🚚', 'Truck is coming');
      vet.visible = false; vetBag.visible = false; const beep = ctx.every(0.5, () => ctx.audio.play('beep')); haul.position.set(X3 + 34, 0, -4); await ctx.tween(haul.position, { x: X3 + 18.9 }, 2.2, 'out'); beep();
      let loaded = 0; const N = barnBirds.length; const RAMP = [X3 + 13.4, -4];
      const herdSpot = () => { let b = null; for (const q of barnBirds) if (q.mode === 'herd' && (!b || q.obj.position.x < b.obj.position.x)) b = q; return b ? [Math.max(X3 - 14, b.obj.position.x - 1.7), b.obj.position.z] : RAMP; };
      goalTo('🦃', 'Herd ' + N + ' turkeys', herdSpot); ctx.say(grower, 'Walk behind them — shoo! 👐', 4); ctx.fact('🚚', 'Loading crews and drivers bring ready birds to the processing plant.');
      const rampMark = new THREE.Group(); { const ring = torus(0.9, 0.09, glow(0xffd84a), [0, 0.12, 0], [PI / 2, 0, 0], 18); rampMark.add(ring); const ar = emojiSprite('⬇️', 1.1, [0.6, 3.0, 0]); rampMark.add(ar); rampMark.userData.ar = ar; } ctx.add(rampMark, RAMP[0] - 0.6, RAMP[1]); const rampBob = ctx.onUpdate((dt, t) => { rampMark.userData.ar.position.y = 3.0 + Math.sin(t * 5) * 0.25; rampMark.children[0].scale.setScalar(1 + Math.sin(t * 5) * 0.08); });
      for (const b of barnBirds) { b.mode = 'herd'; b.rect = [X3 - 13.5, -9, X3 + 13.2, 1.6]; b.speed = 1.2; b.scare = 4; }
      let ht = 0; const herd = ctx.onUpdate((dt) => { ht += dt; for (const b of barnBirds) { if (b.mode !== 'herd') continue; const p = b.obj.position;
        b.bias = [0.9, p.x > X3 + 7 ? Math.max(-1, Math.min(1, (-4 - p.z) * 0.6)) : 0];
        if (ht > 22 && !ctx.locked) { b.mode = 'goto'; b.tx = X3 + 12; b.tz = -4; b.speed = 3; b.then = 'herd'; }
        if (p.x > X3 + 11.2 && p.z > -6.6 && p.z < -1.4) { b.mode = 'goto'; b.tx = X3 + 13.3; b.tz = -4 + (loaded % 2 ? 0.5 : -0.5); b.speed = 3.2; b.onArrive = (bb) => { flock.remove(bb); ctx.audio.play('gobble'); ctx.tween(bb.obj.position, { x: X3 + 16.2, y: 1.3 }, 0.55, 'linear').then(() => { ctx.remove(bb.obj); loaded++; haul.userData.birds[0].visible = true; if (loaded > N / 2) haul.userData.birds[1].visible = true; ctx.emote([X3 + 14.5, 2.4, -4], '🦃', { y: 0 }); if (loaded < N) ctx.goal('🦃', (N - loaded) + ' to go', guide); }); }; } } });
      await ctx.until(() => loaded >= N); herd(); guideFn = null; rampBob(); ctx.remove(rampMark); barnBirds.length = 0; big();
      grower.userData.anim = 'wave'; ctx.say(grower, 'Goodbye! Thank you, turkeys 👋', 2.6);
      ctx.goal('🚚', 'Hop in the truck', RAMP); await use({ at: RAMP, icon: '🚚', label: 'Hop in', y: 2.2, r: 3 });
      leave(); ctx.player.visible = false; ctx.audio.play('honk'); ctx.bounds(null); ctx.tween(haul.position, { x: X3 + 34 }, 1.5, 'in'); await ctx.wait(1.6);
      await ch4plant();
    }

    async function ch4plant() {
      ctx.bounds(null);
      await ctx.chapter({ n: 4, title: 'The Processing Plant', emoji: '🏭', env: ['factory', { ground: 0x9aa3a8, top: '#dfe8ee', bottom: '#f4f6f7', fog: false }], at: [X4 - 12, 0.2], face: PI, music: 'factory', cam: { yaw: 0, pitch: 0.5, dist: 10 }, setup: () => { showZone(4); ctx.player.visible = true; } });
      arrive(); ctx.bounds(X4 - 18.2, -9.6, X4 + 18.2, 2.6);
      // clean hands
      ctx.say(inspector, 'Clean hands first, please! 👐'); ctx.goal('💧', 'Wash your hands', [X4 - 15.5, -3.3]);
      await use({ at: [X4 - 15.5, -3.2], face: [X4 - 15.5, -4.3], icon: '💧', label: 'Wash', hold: 1.2, sfx: 'water', y: 1.9, r: 2.3 });
      ctx.act('work', 1.0); for (let i = 0; i < 6; i++) ctx.after(i * 0.15, () => { ctx.burst([X4 - 15.5, 1.2, -4.2], { color: i % 2 ? 0xffffff : 0xbfe6ff, n: 6, size: 0.2, speed: 1.2 }); ctx.audio.play('bubble'); });
      await ctx.wait(1.0); hairnet.visible = true; ctx.emote(ctx.player, '✨', { y: 2.1 }); ctx.audio.play('sparkle'); ctx.goal('✨', 'All clean!');
      // inspection stamp: time the press
      inspector.userData.anim = 'point'; await ctx.say(inspector, 'Crews in there do the hardest job 💪', 3); inspector.userData.anim = 'idle';
      ctx.say(inspector, 'We check every turkey. You try! ✅', 3.2);
      let ok = 0; const PADX = X4 - 9, under = () => beltItems.find(it => Math.abs(it.g.position.x - PADX) < 0.62 && !it.ok);
      const lamp = ctx.onUpdate(() => { const u = !!under(); lampG.visible = u; lampR.visible = !u; });
      ctx.goal('✅', 'Stamp 3 turkeys', [PADX, -4.3]); ctx._tk.under = under;
      // (the bubble sits beside the player, so that it never hides the belt under the stamper — on a phone held sideways it used to)
      const st = ctx.interact({ at: [PADX + 1.7, -4.2], face: [PADX, -6], icon: '✅', label: 'Stamp', r: 2.6, y: 1.0, once: false, sfx: 'click', onUse: () => {
        if (stamper.userData.busy) return; stamper.userData.busy = true; const it = under();
        ctx.tween(stamper.position, { y: 1.42 }, 0.09, 'in').then(() => { ctx.audio.play('thud'); if (it) { it.ok = true; it.a.visible = false; it.b.visible = true; ok++; if (ok === 1) ctx.fact('🔍', 'Inspectors and food-safety teams check the turkeys and the plant.'); ctx.emote(it.g, '✅', { y: 0.7 }); ctx.audio.play('ding'); if (ok < 3) ctx.goal('✅', 'Stamp ' + (3 - ok) + ' more', [PADX, -4.3]); } else { ctx.audio.play('error'); ctx.emote([PADX, 2.2, -6], '💨', { y: 0 }); } return ctx.tween(stamper.position, { y: 1.75 }, 0.18, 'out'); }).then(() => { stamper.userData.busy = false; });
      } });
      await ctx.until(() => ok >= 3); st.remove(); lamp(); lampG.visible = true; lampR.visible = false; ctx.goal('✅', 'All checked!'); big();
      inspector.userData.anim = 'cheer'; ctx.say(inspector, 'Safe and clean! 👍', 2.4);
      ctx.thank('🔍', ['Loading crews', 'Live-haul drivers', 'Processing crews', 'USDA inspectors', 'Sanitation crews']);
      await ctx.wait(2.2); inspector.userData.anim = 'idle';
    }

    // ---------- 5. Bringing it within our reach ----------
    async function ch5() {
      if (DEV.get('tksub') === 'road') return ch5road();
      if (ctx.player.position.x < X4 - 30) { await ctx.chapter({ env: ['factory', { ground: 0x9aa3a8, top: '#dfe8ee', bottom: '#f4f6f7', fog: false }], at: [X4 - 6, -2], face: PI, cam: { yaw: 0, pitch: 0.5, dist: 10 }, setup: () => showZone(4) }); hairnet.visible = true; }
      await ctx.chapter({ n: 5, title: 'Chill, Pack & Ship', emoji: '❄️', music: 'factory' }); ctx.bounds(X4 - 18.2, -9.6, X4 + 18.2, 2.6);
      // freeze
      ctx.say(packer, 'Brr! Start the freezer ❄️'); ctx.goal('❄️', 'Start the freezer', frLever);
      await use({ at: frLever, icon: '❄️', label: 'Pull', y: 1.9, r: 2.3 });
      ctx.tween(frStick.rotation, { z: -0.6 }, 0.3); frFan.userData.on = true; ctx.audio.play('machine'); const frost = ctx.every(0.25, () => { ctx.burst([X4 - 3.2 + rnd() * 4, 1.5, -5.4], { color: 0xdff3ff, n: 4, size: 0.2, speed: 0.9, y: 0 }); }); const wind = ctx.every(1.2, () => ctx.audio.play('wind'));
      await ctx.wait(1.2); const frozen = packTurkey('frozen'); frozen.position.set(X4 - 0.4, 0.97, -6); ctx.add(frozen); await ctx.tween(frozen.position, { x: X4 + 1.75 }, 1.4, 'linear'); ctx.audio.play('ding'); ctx.fact('🌡️', 'Workers chill or freeze each turkey so it travels safely.');
      // weigh, label, pack
      ctx.goal('🦃', 'Take a frozen turkey', frozen); await use({ at: [X4 + 1.75, -4.7], face: [X4 + 1.75, -6], icon: '❄️', label: 'Take', y: 1.7, r: 2.2 }); holdPack(frozen);
      ctx.say(packer, 'Pop it on the scale! ⚖️'); ctx.goal('⚖️', 'Weigh and label', [X4 + 4.5, -4.8]); await use({ at: [X4 + 4.5, -4.7], face: [X4 + 4.5, -6], icon: '⚖️', label: 'Weigh', y: 1.9, r: 2.2 });
      ctx.remove(ctx.drop()); const onScale = new THREE.Group(), f1 = packTurkey('frozen'), f2 = packTurkey('label'); f2.visible = false; onScale.add(f1); onScale.add(f2); onScale.position.set(X4 + 4.5, 1.6, -6); ctx.add(onScale);
      await ctx.tween(onScale.position, { y: 1.0 }, 0.25, 'in'); ctx.audio.play('thud'); await ctx.tween(needle.rotation, { z: -0.75 }, 0.7, 'outElastic'); ctx.audio.play('beep');
      await labelMatchGame(ctx, 14); // mini-game: read the scale, tap the label with the same weight
      ctx.goal('🏷️', 'Label printing…'); ctx.audio.play('machine'); await ctx.wait(0.3);
      const tag = box(0.3, 0.02, 0.2, 0xe8b63a, [X4 + 5.75, 1.12, -5.7]); ctx.add(tag); ctx.audio.play('beep'); await ctx.tween(tag.position, { z: -5.45 }, 0.35, 'linear'); ctx.tween(tag.position, { x: X4 + 4.5, z: -6 }, 0.4); await ctx.tween(tag.position, { y: 1.9 }, 0.2, 'out'); await ctx.tween(tag.position, { y: 1.4 }, 0.2, 'in');
      ctx.remove(tag); f1.visible = false; f2.visible = true; ctx.audio.play('pop'); ctx.burst([X4 + 4.5, 1.5, -6], { color: 0xe8b63a, n: 8, size: 0.16 }); await ctx.wait(0.6);
      const myBox = carton(0.72); myBox.position.set(X4 + 4.5, 1.0, -6); myBox.scale.setScalar(0.01); ctx.add(myBox); packer.userData.anim = 'work'; await ctx.tween(myBox.scale, { x: 1, y: 1, z: 1 }, 0.35, 'outBack'); ctx.remove(onScale); ctx.tween(needle.rotation, { z: 1.2 }, 0.4);
      ctx.tween(myBox.position, { x: X4 + 9.8, z: -5.4 }, 0.8, 'inOut'); await ctx.tween(myBox.position, { y: 2.6 }, 0.4, 'out'); await ctx.tween(myBox.position, { y: 0.56 }, 0.4, 'in'); ctx.audio.play('thud'); pallet.add(myBox); myBox.position.set(0.3, 0.56, 0); packer.userData.anim = 'idle'; big();
      ctx.thank('❄️', ['Refrigeration technicians', 'Scale operators', 'Packaging workers', 'Label printers']);
      // forklift → truck
      ctx.say(driver4, 'Load my truck, please! 🚚'); ctx.goal('🚜', 'Drive the forklift', lift);
      await use({ at: lift, icon: '🚜', label: 'Drive', y: 2.6, r: 2.8 }); liftC.remove(); palletC.remove(); ctx.goal('📦', 'Load the truck');
      const fork = lift.userData.fork; let picked = false; const pick = ctx.onUpdate(() => { if (!picked && lift.position.z < -3.55) { picked = true; fork.add(pallet); pallet.position.set(0, 0.05, 0.62); pallet.rotation.y = 0; ctx.audio.play('clink'); ctx.tween(fork.position, { y: 0.9 }, 0.7); } });
      await ctx.ride(lift, [[X4 + 9.5, -3.6], [X4 + 9.5, -3.62], [X4 + 12.5, -2.9], [X4 + 16.1, -3]], { speed: 3.2, hide: false, sfx: 'beep' }); pick();
      ctx.lock(); await ctx.tween(fork.position, { y: 0.75 }, 0.3); ctx.scene.attach(pallet); await ctx.tween(pallet.position, { x: X4 + 20.2 }, 0.7, 'inOut'); ctx.audio.play('thud'); ctx.remove(pallet); ctx.tween(fork.position, { y: 0.2 }, 0.4); ctx.unlock(); ctx.collideBox(X4 + 16.1, -3, 2.6, 1.6); ctx.tp(X4 + 15, -0.6, PI / 2);
      frost(); wind(); driver4.userData.anim = 'wave'; ctx.say(driver4, 'Next stop: your store! 🛒', 2.6);
      ctx.goal('🚚', 'Hop in the truck', [X4 + 17.6, -0.6]); await use({ at: [X4 + 17.4, -0.6], icon: '🚚', label: 'Hop in', y: 2.4, r: 3 });
      leave(); ctx.player.visible = false; driver4.visible = false; hairnet.visible = false; ctx.audio.play('honk'); ctx.bounds(null); ctx.tween(reefer.position, { x: X4 + 38 }, 1.5, 'in'); await ctx.wait(1.6);
      await ch5road();
    }

    async function ch5road() {
      await ctx.chapter({ env: ['autumn', { fog: [130, 390] }], at: [X5, ZR + 8], music: 'travel', cam: { yaw: -PI / 2 + 0.62, pitch: 0.34, dist: 9 }, setup: () => { showZone(5); reefer.position.set(X5, 0, ZR + 1.35); reefer.rotation.y = PI / 2; reefer.visible = true; ctx.player.visible = false; } });
      arrive(); ctx.goal('🛒', 'Ride to the store'); ctx.after(0.4, () => ctx.fact('📋', 'Dispatchers coordinate the deliveries; refrigerated-truck drivers carry them.')); ctx.after(1.2, () => ctx.say(reefer, 'Frozen all the way! ❄️', 3, { y: 3.6 })); ctx.after(4.2, () => ctx.audio.play('honk')); ctx.after(5.2, () => ctx.say(reefer, 'Almost there! 🛒', 2.6, { y: 3.6 }));
      await ctx.ride(reefer, [[X5 + 96, ZR + 1.35], [X5 + 107, ZR + 1.35], [X5 + 114, ZR - 3.5]], { speed: 13.5 });
      ctx.player.visible = false; leave(); await ctx.wait(0.5);
      // the store
      await ctx.chapter({ title: 'The Grocery Store', emoji: '🛒', env: ['indoor', { ground: 0xd9d4c6, top: '#e9e4d6', bottom: '#f6f2e8', fog: false }], at: [X6 + 7.5, 1.5], face: -PI / 2, music: 'town', cam: { yaw: 0, pitch: 0.5, dist: 10 }, setup: () => { showZone(6); ctx.player.visible = true; } });
      arrive(); ctx.bounds(X6 - 12.2, -10.2, X6 + 12.2, 3.4);
      ctx.say(stocker, 'Fresh from the truck! ❄️', 3); ctx.goal('❄️', 'Open the freezer', [X6 + 1, -9.9]);
      await use({ at: [X6 + 1, -9.8], face: [X6 + 1, -11.2], icon: '❄️', label: 'Open', y: 2.0, r: 2.4, sfx: 'cork' });
      ctx.tween(doors6[1].rotation, { y: -1.75 }, 0.6, 'out'); for (let i = 0; i < 5; i++) ctx.after(i * 0.12, () => ctx.burst([X6 + 1, 1.2 + i * 0.3, -10.6], { color: 0xeaf8ff, n: 6, size: 0.22, speed: 1.0, y: 0 })); ctx.audio.play('wind');
      ctx.goal('🦃', 'Pick your turkey', myTurkey); await use({ at: [X6 + 1, -9.8], face: [X6 + 1, -11.2], icon: '🦃', label: 'Take', y: 2.0, r: 2.4 });
      holdPack(zFree(myTurkey)); ctx.tween(doors6[1].rotation, { y: 0 }, 0.5); ctx.fact('❄️', 'One turkey in a freezer took many coordinated efforts.');
      ctx.goal('💵', 'Pay the cashier', [X6 - 7.3, -1]); await use({ at: [X6 - 7.2, -1], face: cashier, icon: '💵', label: 'Pay', r: 2.4, y: 2.0 });
      ctx.audio.play('register'); ctx.emote(cashier, '💵'); cashier.userData.anim = 'wave'; await ctx.say(cashier, 'Happy Thanksgiving! 🧡', 2.2); cashier.userData.anim = 'idle'; big();
      ctx.thank('🚚', ['Forklift operators', 'Dispatchers', 'Refrigerated-truck drivers', 'Stockers', 'Cashiers']);
      await ctx.wait(2.4);
    }

    // ---------- 6. Turning food into a family gathering ----------
    async function ch6() {
      ctx.bounds(null);
      await ctx.chapter({ n: 6, title: 'Home Kitchen', emoji: '🏡', env: ['indoor', { ground: 0xb98a5e, top: '#f3dfb8', bottom: '#f8ead0', fog: false }], at: [X7 - 5, 0.6], face: PI, music: 'table', cam: { yaw: 0, pitch: 0.47, dist: 9.5 }, setup: () => { showZone(7); ctx.player.visible = true; if (!ctx.carrying) { const t = packTurkey('label'); ctx.add(t); holdPack(t); } } });
      ctx.bounds(X7 - 11.5, -6.0, X7 + 11.5, 3.4);
      // thaw
      ctx.say(cook, 'Into the fridge to thaw! ❄️'); ctx.goal('❄️', 'Thaw in the fridge', [X7 - 9.4, -6.2]);
      await use({ at: [X7 - 9.4, -6.0], face: [X7 - 9.4, -7.1], icon: '❄️', label: 'Put in', y: 2.2, r: 2.4, sfx: 'cork' });
      const ft = ctx.drop(); ctx.add(ft, X7 - 9.4, -6.0); ft.position.y = 1.3; await ctx.tween(ft.position, { z: -7 }, 0.4, 'in'); ctx.remove(ft); ctx.audio.play('thud');
      let pan = null;
      await ctx.chapter({ title: 'After thawing…', emoji: '❄️', at: [X7 - 5.6, -3.6], face: PI, setup: () => { pan = roastTurkey('raw'); pan.position.set(X7 - 4, 1.16, -7.0); ctx.add(pan); cook.position.set(X7 + 2.3, 0, -5.6); cook.rotation.y = -0.9; } });
      // season
      ctx.say(cook, 'Thawed! Now the yummy part 🌿'); ctx.fact('🗓️', 'Someone planned this meal and allowed time for thawing.'); ctx.goal('🌿', 'Season the turkey', [X7 - 4, -6.1]);
      await use({ at: [X7 - 4, -5.9], face: [X7 - 4, -7], icon: '🌿', label: 'Season', hold: 1.3, sfx: 'pour', y: 2.0, r: 2.3 });
      ctx.act('work', 1.2); const seas = ['🌿', '🍋', '✨']; for (let i = 0; i < 3; i++) { ctx.emote([X7 - 4.4 + i * 0.4, 1.8, -7], seas[i], { y: 0 }); ctx.burst([X7 - 4, 2, -7], { color: [0xffffff, 0x4f9d4a, 0xf2c43d][i], n: 8, size: 0.12, speed: 0.8, y: 0 }); ctx.audio.play('pour'); await ctx.wait(0.4); }
      ctx.remove(pan); pan = roastTurkey('herb'); pan.position.set(X7 - 4, 1.16, -7.0); ctx.add(pan); hop(pan, 0.15, 0.25);
      // roast
      ctx.goal('💪', 'Pick up the pan', pan); await use({ at: [X7 - 4, -5.9], face: [X7 - 4, -7], icon: '💪', label: 'Lift', y: 2.0, r: 2.3 }); hold(pan, 0.62, 0.04, 0.07);
      ctx.goal('🔥', 'Into the oven', [X7, -6.2]); await use({ at: [X7, -5.9], face: [X7, -7], icon: '🔥', label: 'Roast', y: 1.9, r: 2.3 });
      ctx.lock(); ctx.drop(); ctx.add(pan, X7, -5.6); pan.position.y = 0.5; pan.scale.setScalar(0.9); await ctx.tween(ovenDoor.rotation, { x: 1.45 }, 0.35, 'out'); ctx.audio.play('knock'); await ctx.tween(pan.position, { z: -6.9 }, 0.5, 'inOut'); await ctx.tween(ovenDoor.rotation, { x: 0 }, 0.3, 'in'); ctx.audio.play('thud'); ctx.remove(pan);
      ovenGlow.visible = true; ctx.audio.play('fire'); ctx.unlock(); ctx.goal('⏲️', 'Roasting…', [X7, -6.2]);
      const clocks = ['🕐', '🕒', '🕔'], sm = ctx.every(0.35, () => ctx.burst([X7 + (rnd() - 0.5), 1.3, -6.9], { color: 0xffffff, n: 2, size: 0.22, speed: 0.3, y: 0 })), fs = ctx.every(0.9, () => ctx.audio.play('fire'));
      for (let i = 0; i < 3; i++) { ctx.emote([X7, 2.0, -6.6], clocks[i], { y: 0 }); cook.userData.anim = i === 1 ? 'work' : 'idle'; await ctx.wait(1.0); }
      sm(); fs(); ctx.audio.play('bell'); ctx.say(cook, 'Ding! Is it done? Check! 🌡️', 2.6); ctx.goal('🌡️', 'Check the temperature', [X7, -6.2]);
      await use({ at: [X7, -5.9], face: [X7, -7], icon: '🌡️', label: 'Check', y: 1.9, r: 2.3 });
      await thermometerGame(ctx); // mini-game: hold, let go at 165 °F — the temperature at which turkey is safely done
      ctx.say(cook, '165 degrees! Smells amazing 😋', 2.4);
      ctx.goal('🦃', 'Take it out', [X7, -6.2]); await use({ at: [X7, -5.9], face: [X7, -7], icon: '🦃', label: 'Take out', y: 1.9, r: 2.3 });
      ctx.lock(); await ctx.tween(ovenDoor.rotation, { x: 1.45 }, 0.35, 'out'); ovenGlow.visible = false; const roast = roastTurkey('gold', 'platter'); roast.position.set(X7, 0.5, -6.9); roast.scale.setScalar(0.8); ctx.add(roast);
      for (let i = 0; i < 4; i++) ctx.after(i * 0.1, () => ctx.burst([X7, 1.2, -6.2], { color: 0xffffff, n: 5, size: 0.25, speed: 0.6, y: 0 })); await ctx.tween(roast.position, { z: -5.8, y: 1.0 }, 0.5, 'out'); ctx.tween(ovenDoor.rotation, { x: 0 }, 0.3); ctx.audio.play('sparkle');
      ctx.unlock(); hold(roast, 0.62, 0.07, 0.19); big();
      ctx.thank('🍽️', ['Shoppers', 'Cooks', 'Carvers', 'Platter carriers', 'Dish washers']); // early enough to be read before the finale
      // to the table
      cook.userData.anim = 'cheer'; ctx.say(cook, 'Golden! To the table! 🦃', 2.6); ctx.goal('🍽️', 'Carry it to table', [X7 + 6.2, -1.4]);
      await new Promise(res => ctx.zone({ x: X7 + 6.2, z: -1.4, r: 2.2, onEnter: res }));
      carver.userData.anim = 'wave'; ctx.say(carver, 'Happy Thanksgiving! 🧡', 3); ctx.audio.play('success'); big();
      await ctx.wait(5.0);
    }

    ctx.tp(-1.5, 1.2, PI);
    ctx.onStart(async () => {
      const q = new URLSearchParams(location.search), from = Math.max(1, +(q.get('tkch') || 1));
      const chapters = [ch1, ch2, ch3, ch4, ch5, ch6];
      if (from > 1) barnDone();
      for (let i = from - 1; i < chapters.length; i++) await chapters[i]();
      ctx.finish();
    });
  },
};
