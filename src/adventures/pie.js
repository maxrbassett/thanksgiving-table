// Pumpkin Pie — many journeys meet in one dish.
// Pumpkin patch → cannery → wheat field & mill → barnyard → spice island & port → home kitchen.
import { THREE, C, box, cyl, sphere, ball, cone, group, mat, glow, sign, plane, disc, lathe, torus, tube, seeded, bake, picture, canvasTex } from '../core/kit.js';
import * as P from '../core/props.js';
import * as M from './pie-parts.js';
import { milkGame, rollGame, catchGame } from './pie-games.js';

export default {
  id: 'pie', title: 'Pumpkin Pie', emoji: '🥧', music: 'farm',
  thanksLine: 'One pie, many journeys — thank you to every hand that helped!',
  question: 'What goes into a pumpkin pie?',

  create(ctx) {
    const rnd = seeded(77), PL = ctx.player, PP = PL.position, engineObjs = new Set(ctx.scene.children);
    const dist = (x, z) => Math.hypot(PP.x - x, PP.z - z);
    const at = (g, x, y, z, ry) => { g.position.set(x, y, z); if (ry !== undefined) g.rotation.y = ry; return g; };
    const use = (o) => new Promise(res => ctx.interact(Object.assign({}, o, { onUse: res })));
    const hop = async (o, to, h = 1, dur = 0.5) => { ctx.tween(o.position, { x: to[0], z: to[2] }, dur, 'linear'); const top = Math.max(o.position.y, to[1]) + h; await ctx.tween(o.position, { y: top }, dur / 2, 'out'); await ctx.tween(o.position, { y: to[1] }, dur / 2, 'in'); };
    // carrying: the thing is held in front of the chest between the two straight arms, its top below the chin and its back at the belly
    // (y and z are offsets from the hands' height / reach, in the carrier's own scale)
    const carry = (o, y = 0, z = 0) => { ctx.carry(o, { y }); o.position.z = z; return o; };
    const pop = (o, s = 1, dur = 0.4) => { o.visible = true; o.scale.setScalar(0.01); return ctx.tween(o.scale, { x: s, y: s, z: s }, dur, 'outBack'); };
    // a beacon target that can follow "the nearest thing still to do"
    const guide = new THREE.Object3D(); ctx.scene.add(guide); let guideFn = null;
    const nearest = (list) => { let b = null, bd = 1e9; for (const p of list) { const d = dist(p[0], p[1]); if (d < bd) { bd = d; b = p; } } return b; };
    const goalTo = (icon, text, fn) => { guideFn = fn; const p = fn(); if (p) guide.position.set(p[0], 0, p[1]); ctx.goal(icon, text, guide); };
    const goal = (icon, text, target) => { guideFn = null; ctx.goal(icon, text, target); };
    ctx.onUpdate(() => { if (guideFn) { const p = guideFn(); if (p) guide.position.set(p[0], 0, p[1]); } });
    // speech that never overlaps: a second line from the same person waits for the first to finish
    const say = (who, text, sec = 3.2, o) => { const wait = Math.max(0, (who.userData.sayEnd || 0) - ctx.time); who.userData.sayEnd = ctx.time + wait + sec + 0.2; if (wait > 0) ctx.after(wait + 0.15, () => ctx.say(who, text, sec, o)); else ctx.say(who, text, sec, o); };
    // real-world one-liners: never two within ~12 s of each other (a second one waits its turn)
    let factAt = -99;
    const factOK = () => ctx.time - factAt >= 12;
    const fact = (icon, text) => { const wait = Math.max(0, factAt + 12 - ctx.time), z = zone; factAt = ctx.time + wait; if (wait > 0) ctx.after(wait, () => { if (zone === z) ctx.fact(icon, text); }); else ctx.fact(icon, text); };
    let zone = 1;

    // =====================================================================================
    // ZONE 1 — the pumpkin patch (around 0,0)
    // =====================================================================================
    ctx.env('day');
    const z1 = new THREE.Group();
    z1.add(M.ground(17, 12, 0x6b4a30, [0, 0.03, -5.6], 3));
    const hills = [{ x: -4.4, z: -3.4, s: 1.0 }, { x: -1.5, z: -8.0, s: 1.25 }, { x: 1.6, z: -3.4, s: 1.1 }, { x: 4.4, z: -8.0, s: 2.3 }];
    for (const h of hills) { z1.add(ball(1.25, 0.26, 1.25, 0x6f4c31, [h.x, 0.02, h.z], null, 14)); h.mx = h.x + 1.1; h.mz = h.z - 0.8; h.fx = h.x - 0.9; h.fz = h.z + 0.9; }
    for (let i = 0; i < 7; i++) z1.add(box(16.4, 0.1, 0.5, 0x5f4029, [0, 0.04, -0.6 - i * 1.7]));
    const barn = P.barn({ sign: '🎃' }); at(barn, -16, 0, -9, 0.45); z1.add(barn);
    z1.add(at(P.silo(), -22.5, 0, -5));
    z1.add(at(P.fence(18), 0, 0, -12.2)); z1.add(at(P.fence(12), -9.2, 0, -6.2, Math.PI / 2)); z1.add(at(P.fence(5), -6.7, 0, 0.4)); z1.add(at(P.fence(4.5), 6.6, 0, 0.4));
    z1.add(M.ground(3.6, 60, C.dirt, [11, 0.03, -14], 6));
    for (let i = 0; i < 3; i++) z1.add(at(group([M.beehive()]), -11.5 + i * 1.1, 0, -1.6 - i * 0.5, 0.5));
    z1.add(P.scatter(18, 12, 9, () => P.flower(), { seed: 4 }).translateX(-12).translateZ(3.5));
    z1.add(P.scatter(12, 26, 5, () => P.flower(), { seed: 9 }).translateZ(6));
    z1.add(at(group([M.scarecrow()]), 0, 0, -5.7));
    z1.add(at(P.haybale(), 7.6, 0, 2.4)); z1.add(at(P.haybale(), 8.9, 0, 2.9, 0.5));
    z1.add(at(P.signpost('🎃', { h: 2.4, size: 1.0 }), 6.0, 0, 1.6, -0.2));
    for (let i = 0; i < 4; i++) z1.add(at(P.mountain({ h: 20 + (i % 2) * 9, color: 0x86a07a, snow: false }), -70 + i * 48, 0, -100));
    for (let i = 0; i < 5; i++) z1.add(at(P.cloud({ s: 2 + (i % 3) }), -50 + i * 26, 24 + (i % 2) * 5, -70 - (i % 3) * 8));
    z1.add(P.scatter(10, 44, 36, () => P.bush(), { seed: 5, keep: (x, z) => (Math.abs(x) > 13.5 || z < -14) && z < 4 && !(x < -10 && x > -27 && z > -15 && z < -1) }));
    ctx.addStatic(z1);
    const treeKeep = (x, z) => (x < -11 || x > 14 || z < -15) && z < 5 && !(x < -9 && x > -28 && z > -16 && z < 0) && !(x > 8.5 && x < 13.5);
    const treesSpring = bake(P.scatter(20, 80, 56, (r) => P.tree({ h: 3.5 + r() * 3, kind: r() < 0.25 ? 'pine' : 'round' }), { seed: 3, keep: treeKeep })); ctx.add(treesSpring);
    const autumnG = P.scatter(20, 80, 56, (r) => r() < 0.25 ? P.tree({ h: 3.5 + r() * 3, kind: 'pine' }) : P.tree({ h: 3.5 + r() * 3, kind: 'autumn', color: C.autumn[Math.floor(r() * 4)] }), { seed: 3, keep: treeKeep });
    for (let i = 0; i < 16; i++) autumnG.add(at(M.pumpkin(0.8 + rnd() * 0.7, undefined, undefined, true), 14.2 + (i % 4) * 1.7 + rnd() * 0.5, 0, -2 - Math.floor(i / 4) * 2.2 + rnd()));   // the neighbours' patch
    for (let i = 0; i < 5; i++) autumnG.add(at(M.pumpkin(0.9 + rnd() * 0.5, undefined, undefined, true), -12.6 + i * 0.9, 0, -5.0 + (i % 2) * 0.7));
    bake(autumnG); autumnG.visible = false; ctx.add(autumnG);
    ctx.collideBox(-16, -9, 10.5, 9); ctx.collideCircle(-22.5, -5, 1.9); ctx.collideBox(0, -12.2, 18, 0.4); ctx.collideBox(-9.2, -6.2, 0.4, 12); ctx.collideCircle(0, -5.7, 0.45);
    ctx.collideBox(-10.4, -2.1, 3.4, 1.6); ctx.collideBox(-6.7, 0.4, 5, 0.4); ctx.collideBox(6.6, 0.4, 4.5, 0.4); ctx.collideCircle(7.6, 2.4, 0.8); ctx.collideCircle(8.9, 2.9, 0.8); ctx.collideCircle(6.0, 1.6, 0.3);
    const farmer = ctx.person({ hat: 'straw', shirt: 0x3f8f5a, pants: 0x6b4a2f, skin: C.skin[3], hair: C.hair[1], hairStyle: 'short', beard: 0x2a2a2a, expressive: true }, 2.9, 3.0, -0.5);
    for (const h of hills) {
      h.vine = ctx.add(M.vine(rnd), h.x, h.z); h.vine.visible = false;
      h.male = ctx.add(M.blossom(true), h.mx, h.mz); h.male.visible = false; h.fem = ctx.add(M.blossom(false), h.fx, h.fz); h.fem.visible = false;
      h.baby = ctx.add(M.pumpkin(0.42, 0x7fa843, 0x4f8f3a), h.fx + 0.05, h.fz + 0.42); h.baby.visible = false;
    }
    const beeObj = ctx.add(M.bee(), -10.4, -2.1); beeObj.position.y = 1.5; beeObj.scale.setScalar(1.25);
    const bee = { mode: 'hive', dive: null, pollen: false };
    const hiveBees = new THREE.Group(); for (let i = 0; i < 6; i++) hiveBees.add(sphere(0.06, 0xf7c325, [Math.cos(i * 1.05) * (0.7 + (i % 3) * 0.35), 0.2 * Math.sin(i * 2.2), Math.sin(i * 1.05) * (0.7 + (i % 3) * 0.35)], 4)); bake(hiveBees); hiveBees.position.set(-10.4, 1.5, -2.1); ctx.add(hiveBees);
    const rig = new THREE.Group(); rig.add(at(P.tractor({ color: 0x3f7fd1 }), 0, 0, 2.7)); rig.add(at(group([M.wagon()]), 0, 0, -1.6)); bake(rig); ctx.add(rig, 11, -3, Math.PI);
    ctx.collideBox(11, -3.3, 2.7, 8.4);
    const crows = [[-0.75, 1.78, -5.7], [0.8, 1.78, -5.7], [5, 1.0, -12.2]].map((p, i) => { const o = ctx.add(M.bird()); o.position.set(p[0], p[1], p[2]); o.rotation.y = i; o.visible = false; return { o, home: p, t: -1, ph: i * 2 }; });

    ctx.onUpdate((dt, t) => {
      if (zone !== 1) return;
      hiveBees.rotation.y = t * 2.2; hiveBees.position.y = 1.4 + Math.sin(t * 3) * 0.15;
      // the bee
      beeObj.userData.wings.scale.y = Math.sin(t * 60) > 0 ? 1 : 0.3;
      let tx = -10.4, ty = 1.5, tz = -2.1;
      if (bee.mode === 'follow') { tx = PP.x + Math.cos(t * 1.7) * 0.9; tz = PP.z + Math.sin(t * 1.7) * 0.9; ty = 1.9 + Math.sin(t * 5) * 0.12; }
      if (bee.dive) { bee.dive.t -= dt; tx = bee.dive.x; tz = bee.dive.z; ty = 0.85; if (bee.dive.t <= 0) bee.dive = null; }
      const k = 1 - Math.exp(-dt * (bee.dive ? 9 : 4)), ox = beeObj.position.x, oz = beeObj.position.z;
      beeObj.position.x += (tx - ox) * k; beeObj.position.z += (tz - oz) * k; beeObj.position.y += (ty - beeObj.position.y) * k;
      if (Math.hypot(beeObj.position.x - ox, beeObj.position.z - oz) > 0.002) beeObj.rotation.y = Math.atan2(beeObj.position.x - ox, beeObj.position.z - oz);
      beeObj.visible = bee.mode !== 'hive' || Math.hypot(beeObj.position.x - tx, beeObj.position.z - tz) > 0.5;
      // crows: fly off when you come close, circle, come back
      for (const c of crows) { if (!c.o.visible) continue;
        if (c.t < 0) { c.o.rotation.x = Math.sin(t * 2 + c.ph) > 0.8 ? 0.5 : 0; if (dist(c.home[0], c.home[2]) < 3.2 && !ctx.locked) { c.t = 0; ctx.audio.play('bird'); c.o.rotation.x = 0; } }
        else { c.t += dt / 7; const e = Math.sin(Math.min(1, c.t) * Math.PI), a = c.t * 9 + c.ph; const x = c.home[0] + Math.cos(a) * 5 * e, z = c.home[2] + Math.sin(a) * 4 * e - 2 * e, y = c.home[1] + e * 3.2;
          c.o.rotation.y = Math.atan2(x - c.o.position.x, z - c.o.position.z); c.o.position.set(x, y, z); c.o.userData.wings.scale.y = Math.sin(t * 16 + c.ph); if (c.t >= 1) { c.t = -1; c.o.position.set(c.home[0], c.home[1], c.home[2]); c.o.userData.wings.scale.y = -0.6; } }
      }
    });

    // =====================================================================================
    // ZONE 2 — the cannery (x≈100, indoors)
    // =====================================================================================
    const X2 = 100, z2 = new THREE.Group(), BZ = -6, BY = 1.02;
    z2.add(M.ground(30, 19, 0xb3aea2, [0, 0.03, -4], 5));
    for (let i = 0; i < 5; i++) z2.add(plane(0.25, 19, 0xa8a397, [-12 + i * 6, 0.04, -4]));
    z2.add(box(30, 7, 0.4, 0xdcd5c4, [0, 3.5, -13.5])); z2.add(box(0.4, 7, 19, 0xd0c9b8, [-15, 3.5, -4])); z2.add(box(0.4, 7, 19, 0xd0c9b8, [15, 3.5, -4]));
    z2.add(box(30, 0.5, 0.45, C.orange, [0, 4.6, -13.4])); z2.add(box(30, 1.0, 0.45, 0x8a949e, [0, 0.5, -13.4]));
    z2.add(sign('🎃 CANNERY 🥫', 1.2, { border: '#b5561c' }, [8.6, 3.3, -13.25]));
    for (const x of [-11.5, 0.5]) { z2.add(box(3.2, 1.7, 0.1, 0xbfe6f5, [x, 3.1, -13.28])); z2.add(box(3.4, 0.12, 0.2, C.white, [x, 2.2, -13.2])); z2.add(box(0.1, 1.7, 0.14, C.white, [x, 3.1, -13.24])); }
    for (let i = 0; i < 12; i++) z2.add(plane(1.1, 0.3, i % 2 ? 0x333333 : C.yellow, [-8.3 + i * 1.5, 0.045, -4.85]));
    z2.add(box(1.6, 0.16, 1.3, C.woodLight, [-11.6, 0.08, 3.2])); for (let i = 0; i < 3; i++) z2.add(box(0.7, 0.5, 0.6, 0xc9a26b, [-11.95 + (i % 2) * 0.72 - (i > 1 ? -0.36 : 0), 0.41 + (i > 1 ? 0.52 : 0), 3.2]));
    z2.add(P.conveyor(18, { h: 0.9, w: 1.0 }).translateZ(BZ));
    // tipping bin + chute (left), chopper box on the belt start
    z2.add(box(2.6, 0.15, 2.2, C.steel, [-12.6, 2.7, BZ], [0, 0, -0.3])); for (const sz of [-1, 1]) z2.add(box(2.6, 0.6, 0.1, C.steel, [-12.6, 3.0, BZ + sz * 1.1], [0, 0, -0.3]));
    for (const [x, z] of [[-13.6, -7], [-13.6, -5], [-11.8, -7], [-11.8, -5]]) z2.add(box(0.14, 2.5, 0.14, 0x555f68, [x, 1.25, z]));
    z2.add(box(2.0, 1.7, 1.7, 0x5c6670, [-10.0, 1.75, BZ])); z2.add(box(2.3, 0.3, 2.0, C.orange, [-10.0, 2.75, BZ])); z2.add(box(1.2, 0.5, 0.08, glow(0xffd84a), [-10.0, 1.9, BZ + 0.88]));
    z2.add(box(1.2, 0.7, 1.2, 0x5c6670, [-7.4, 1.5, BZ])); z2.add(box(0.7, 0.35, 0.08, glow(0x9fe8a0), [-7.4, 1.6, BZ + 0.62]));   // can dispenser
    for (let i = 0; i < 4; i++) { z2.add(cyl(0.2, 0.2, 0.34, C.metal, [-7.4, 2.04 + i * 0.38, BZ], null, 9)); } for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) z2.add(box(0.04, 1.6, 0.04, 0x555f68, [-7.4 + sx * 0.24, 2.65, BZ + sz * 0.24]));   // its stack of empty cans in a cage
    for (const sz of [-1, 1]) z2.add(box(2.3, 0.5, 0.08, 0x8a949e, [-10.0, 3.1, BZ + sz * 1.05], [sz * 0.35, 0, 0])); z2.add(box(0.08, 0.5, 2.0, 0x8a949e, [-8.8, 3.1, BZ], [0, 0, -0.35]));                                       // hopper walls on the chopper
    for (let i = 0; i < 3; i++) z2.add(cyl(0.07, 0.07, 0.05, [C.red, C.green, 0xf2c43d][i], [-10.35 + i * 0.35, 1.45, BZ + 0.88], [Math.PI / 2, 0, 0], 8)); for (let i = 0; i < 6; i++) z2.add(box(0.17, 0.12, 0.03, i % 2 ? 0x222222 : C.yellow, [-10.85 + i * 0.34, 1.0, BZ + 0.87]));   // buttons, warning stripe
    z2.add(cyl(0.3, 0.3, 0.4, 0x6d7a86, [4.5, 3.5, BZ], null, 10)); for (let i = 0; i < 5; i++) z2.add(box(0.2, 0.12, 0.03, i % 2 ? 0x222222 : C.yellow, [4.1 + i * 0.2, 2.92, BZ + 0.96]));                                     // piston housing on the lid press
    // cooking kettle behind the belt, pipe to the filler nozzle
    z2.add(cyl(1.6, 1.6, 2.6, C.metal, [-5.5, 1.9, -10], null, 18)); z2.add(sphere(1.6, C.metal, [-5.5, 3.2, -10], 16)); z2.add(cyl(1.66, 1.66, 0.16, 0x7d8790, [-5.5, 2.2, -10], null, 18)); z2.add(cyl(1.66, 1.66, 0.16, 0x7d8790, [-5.5, 0.9, -10], null, 18));
    z2.add(cyl(0.45, 0.45, 0.14, 0x7d8790, [-5.5, 4.82, -10], null, 10)); z2.add(cyl(0.24, 0.24, 0.08, 0xf5f3ea, [-5.5, 2.9, -8.4], [Math.PI / 2, 0, 0], 10)); z2.add(box(0.03, 0.17, 0.03, C.red, [-5.45, 2.95, -8.35], [0, 0, -0.6]));   // lid, pressure gauge
    for (const sx of [-0.28, 0.28]) z2.add(box(0.06, 3.4, 0.06, 0x555f68, [-3.75 + sx, 1.7, -9.5])); for (let i = 0; i < 7; i++) z2.add(box(0.56, 0.05, 0.05, 0x555f68, [-3.75, 0.4 + i * 0.45, -9.5]));                                  // ladder
    for (let i = 0; i < 3; i++) z2.add(box(0.2, 0.7, 0.2, 0x555f68, [-5.5 + Math.cos(i * 2.1 + 0.5) * 1.3, 0.35, -10 + Math.sin(i * 2.1 + 0.5) * 1.3]));
    z2.add(tube([[-10, 2.9, BZ], [-10, 4.4, BZ - 0.6], [-8, 5.0, -8.8], [-5.5, 4.9, -10]], 0.16, 0x8a949e)); z2.add(tube([[-5.5, 4.8, -10], [-3.4, 5.0, -9], [-1, 4.2, -6.6], [-1, 2.55, BZ]], 0.16, 0x8a949e)); z2.add(cone(0.26, 0.5, C.orange, [-1, 2.35, BZ], [Math.PI, 0, 0], 8));
    z2.add(box(0.16, 3.0, 0.16, 0x555f68, [-1, 1.5, BZ - 0.85])); z2.add(box(0.16, 0.16, 1.0, 0x555f68, [-1, 2.9, BZ - 0.4]));
    // sealer / labeller frame
    for (const sz of [-1, 1]) z2.add(box(0.2, 3.0, 0.2, 0x555f68, [4.5, 1.5, BZ + sz * 0.8])); z2.add(box(1.1, 0.5, 1.9, C.blue, [4.5, 3.1, BZ])); z2.add(box(0.6, 0.3, 0.06, glow(0xfff2a8), [4.5, 3.1, BZ + 0.97]));
    // finished goods: pallets and shelves of cans
    const canStack = (n, rows) => { const g = new THREE.Group(); for (let r = 0; r < rows; r++) for (let i = 0; i < n - r; i++) { g.add(cyl(0.17, 0.17, 0.36, C.orange, [(i - (n - r - 1) / 2) * 0.37, 0.18 + r * 0.37, 0], null, 8)); g.add(cyl(0.172, 0.172, 0.05, C.metal, [(i - (n - r - 1) / 2) * 0.37, 0.34 + r * 0.37, 0], null, 8)); } return g; };
    z2.add(at(P.shelf({ w: 5, seed: 3, colors: [C.orange, 0xf2a23d, 0xd9622b] }), 5.5, 0, -12.9)); z2.add(at(P.shelf({ w: 5, seed: 6, colors: [C.orange, 0xf2a23d, 0xd9622b] }), 11, 0, -12.9));
    z2.add(box(1.6, 0.16, 1.3, C.woodLight, [11.5, 0.08, -1])); z2.add(at(canStack(4, 3), 11.5, 0.16, -1)); z2.add(at(canStack(4, 2), 11.5, 0.16, -0.55));
    z2.add(box(1.6, 0.16, 1.3, C.woodLight, [12.4, 0.08, 2])); for (let i = 0; i < 4; i++) z2.add(box(0.7, 0.5, 0.6, 0xc9a26b, [12.05 + (i % 2) * 0.72, 0.41 + Math.floor(i / 2) * 0.52, 2]));
    z2.add(at(P.barrel({ color: C.blue }), -13, 0, 1.5)); z2.add(at(P.barrel({ color: C.blue }), -13.2, 0, 2.6));
    z2.add(box(1.5, 0.16, 1.2, C.woodLight, [10.4, 0.08, BZ])); z2.add(box(1.1, 0.5, 0.9, 0xc9a26b, [10.4, 0.41, BZ])); // the crate the cans land in
    z2.add(cyl(0.28, 0.34, 0.9, 0x555f68, [-1, 0.45, -3.9], null, 8)); z2.add(cyl(0.34, 0.34, 0.08, C.yellow, [-1, 0.92, -3.9], null, 10));
    z2.add(cyl(0.28, 0.34, 0.9, 0x555f68, [4.5, 0.45, -3.9], null, 8)); z2.add(cyl(0.34, 0.34, 0.08, C.yellow, [4.5, 0.92, -3.9], null, 10));   // pedestal of the lid button
    z2.add(box(1.6, 0.16, 1.3, C.woodLight, [-4.6, 0.08, 3.3])); for (let i = 0; i < 5; i++) z2.add(box(0.7, 0.46, 0.58, i % 2 ? 0xc9a26b : 0xd9b27a, [-4.95 + (i % 2) * 0.72 + (i > 3 ? 0.36 : 0), 0.39 + Math.floor(i / 2) * 0.48, 3.3]));
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) z2.add(plane(0.9, 0.22, C.yellow, [-5.6 + i * 4.2, 0.045, -2.3 + s * 0.28], s * 0.6));   // arrows on the floor: the way the cans travel
    z2.add(at(picture(3.4, 2.2, (g, W, H) => { g.fillStyle = '#fff8e8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#b5561c'; g.lineWidth = 14; g.strokeRect(0, 0, W, H); g.font = (H * 0.42) + 'px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🎃➡️🥫', W / 2, H / 2 + H * 0.03); }, 256), -14.77, 3.1, -3.2, Math.PI / 2));
    for (const z of [-9.5, 1.8]) { z2.add(box(0.1, 1.7, 2.6, 0xbfe6f5, [-14.76, 3.2, z])); z2.add(box(0.16, 0.12, 2.8, C.white, [-14.72, 2.3, z])); z2.add(box(0.14, 1.7, 0.1, C.white, [-14.74, 3.2, z])); }
    // a parked forklift and a painted walkway in the foreground
    const fork = group([box(1.3, 0.7, 2.0, C.yellow, [0, 0.75, -0.2]), box(1.3, 0.5, 0.8, 0x333333, [0, 1.2, -0.8]), box(0.9, 0.1, 0.7, 0x333333, [0, 1.15, 0.1]), box(1.25, 0.08, 1.1, C.yellow, [0, 2.25, -0.1])]);
    for (const sx of [-1, 1]) { fork.add(box(0.08, 1.2, 0.08, 0x333333, [sx * 0.58, 1.65, 0.4])); fork.add(box(0.08, 1.2, 0.08, 0x333333, [sx * 0.58, 1.65, -0.6])); fork.add(box(0.1, 2.3, 0.1, 0x555f68, [sx * 0.4, 1.2, 0.95])); fork.add(box(0.14, 0.06, 1.1, 0x8a949e, [sx * 0.35, 0.5, 1.5])); fork.add(cyl(0.35, 0.35, 0.25, 0x222222, [sx * 0.62, 0.35, 0.5], [0, 0, Math.PI / 2], 10)); fork.add(cyl(0.3, 0.3, 0.25, 0x222222, [sx * 0.6, 0.3, -0.9], [0, 0, Math.PI / 2], 10)); }
    fork.add(box(1.0, 0.14, 1.0, C.woodLight, [0, 0.6, 1.5])); fork.add(box(0.8, 0.55, 0.8, 0xc9a26b, [0, 0.95, 1.5]));
    z2.add(at(fork, 6.2, 0, 1.6, -2.2));
    for (let i = 0; i < 7; i++) z2.add(plane(0.5, 2.4, 0xe9e4d6, [-5.5 + i * 1.0, 0.045, 2.4]));
    ctx.addStatic(z2, X2, 0);
    ctx.collideBox(X2, BZ, 18.6, 1.4); ctx.collideBox(X2 - 12, BZ, 4, 2.6); ctx.collideCircle(X2 - 1, -3.9, 0.4); ctx.collideCircle(X2 + 4.5, -3.9, 0.4); ctx.collideBox(X2 - 4.6, 3.3, 1.8, 1.5); ctx.collideBox(X2 + 11.5, -0.8, 1.8, 1.6); ctx.collideBox(X2 + 12.4, 2, 1.8, 1.5); ctx.collideCircle(X2 - 13.1, 2, 1.0); ctx.collideBox(X2 - 11.6, 3.2, 1.8, 1.5); ctx.collideCircle(X2 + 6.2, 1.6, 1.5); ctx.collideBox(X2 + 10.4, BZ, 1.6, 1.4);
    const button = ctx.add(cyl(0.24, 0.26, 0.14, C.red, [X2 - 1, 1.0, -3.9], null, 10)), button2 = ctx.add(cyl(0.24, 0.26, 0.14, C.blue, [X2 + 4.5, 1.0, -3.9], null, 10));
    const lever2 = group([box(0.34, 0.9, 0.34, C.steel, [0, 0.45, 0])], [X2 - 9.6, 0, -3.9]); const stick2 = group([cyl(0.04, 0.04, 0.75, 0x333333, [0, 0.37, 0]), sphere(0.12, C.red, [0, 0.78, 0])], [0, 0.85, 0], [0, 0, 0.6]); stick2.userData.dynamic = true; lever2.add(stick2); ctx.add(lever2);
    ctx.collideCircle(X2 - 9.6, -3.9, 0.35);
    const press = ctx.add(group([box(0.7, 0.5, 0.7, 0x8a949e, [0, 0.25, 0]), cyl(0.1, 0.1, 0.9, 0x555f68, [0, 0.9, 0])]), X2 + 4.5, BZ); bake(press); press.position.y = 2.0;
    const binPumpkins = []; for (let i = 0; i < 5; i++) { const p = ctx.add(M.pumpkin(0.85 + (i % 3) * 0.12), X2 - 13.3 + (i % 3) * 0.55, BZ - 0.5 + Math.floor(i / 3) * 0.8 + (i % 2) * 0.2); p.position.y = 3.05 - (i % 3) * 0.17; binPumpkins.push(p); }
    const wk1 = ctx.person('factory', X2 - 3.4, -7.6, 0.2, 3), wk2 = ctx.person('factory', X2 + 7, -7.05, -0.1, 8); wk2.userData.anim = 'work';   // close enough for the hands to reach the belt
    const canModel = (kind) => { const g = new THREE.Group(); if (kind === 2) { g.add(cyl(0.2, 0.2, 0.4, C.orange, [0, 0.2, 0], null, 9)); g.add(cyl(0.205, 0.205, 0.06, C.metal, [0, 0.4, 0], null, 9)); g.add(cyl(0.205, 0.205, 0.05, C.metal, [0, 0.02, 0], null, 9)); g.add(box(0.16, 0.16, 0.02, 0xfff2c0, [0, 0.2, 0.2])); } else { g.add(cyl(0.2, 0.2, 0.4, C.metal, [0, 0.2, 0], null, 9)); g.add(cyl(0.17, 0.17, 0.02, kind === 1 ? 0xe8781e : 0x555f68, [0, 0.405, 0], null, 9)); } bake(g); g.scale.setScalar(1.25); return g; };

    // =====================================================================================
    // ZONE 3 — the wheat field and the mill (x≈200)
    // =====================================================================================
    const X3 = 200, z3 = new THREE.Group();
    z3.add(M.ground(25.5, 15.5, 0xc4a14c, [0, 0.03, -9], 4)); z3.add(plane(4, 70, C.dirt, [15.2, 0.025, -8])); z3.add(M.ground(34, 4.2, C.dirt, [0, 0.025, 1.4], 5));
    for (let i = 0; i < 9; i++) z3.add(box(25, 0.06, 0.35, 0xb8923c, [0, 0.04, -2.2 - i * 1.7]));
    z3.add(at(P.fence(26), 0, 0, -17.2)); z3.add(at(P.fence(8), -13.2, 0, -13, Math.PI / 2));
    // milling porch: hopper over the stones, chute to the sack
    z3.add(box(3.4, 0.3, 2.6, C.stone, [19.5, 0.15, -1.6])); z3.add(cyl(0.95, 0.95, 0.35, 0x8c8c86, [19.5, 0.72, -1.6], null, 12)); z3.add(cyl(0.5, 0.5, 0.3, C.woodDark, [19.5, 0.42, -1.6], null, 8));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) z3.add(box(0.14, 2.9, 0.14, C.woodDark, [19.5 + sx * 1.15, 1.75, -1.6 + sz * 0.95]));
    z3.add(cone(0.9, 0.9, C.woodLight, [19.5, 2.55, -1.6], [Math.PI, 0, 0], 4)); z3.add(box(2.6, 0.12, 2.2, C.woodDark, [19.5, 3.2, -1.6])); z3.add(box(3.0, 0.14, 2.8, 0x8a4b3a, [19.5, 3.35, -1.6], [0.12, 0, 0]));
    z3.add(box(1.9, 0.1, 0.4, C.woodLight, [20.9, 0.6, -0.75], [0, -0.75, -0.32]));
    z3.add(at(P.sack({ color: 0xf3ede0 }), 22.6, 0, -3.6)); z3.add(at(P.sack({ color: 0xf3ede0 }), 23.2, 0, -3.0)); z3.add(at(P.sack({ color: 0xf3ede0 }), 22.9, 0.55, -3.3));
    z3.add(sign('🌾 MILL', 1.0, { border: '#6e4a28' }, [19.5, 3.95, -0.3]));
    // grain cart
    z3.add(box(2.4, 1.0, 3.2, 0xb5382c, [15.6, 1.15, -3.3])); z3.add(box(2.6, 0.14, 3.4, 0x8a2a20, [15.6, 1.7, -3.3])); for (const sx of [-1, 1]) for (const sz of [-1, 1]) z3.add(cyl(0.5, 0.5, 0.3, 0x222222, [15.6 + sx * 1.25, 0.5, -3.3 + sz * 1.0], [0, 0, Math.PI / 2], 10));
    z3.add(at(P.house({ w: 7 }), -25, 0, -8, 0.6)); z3.add(at(P.silo(), -30.5, 0, -12)); z3.add(at(P.haybale(), -19.5, 0, -1.4)); z3.add(at(P.haybale(), -20.6, 0, -2.6, 0.4)); z3.add(at(P.haybale(), -20, 0.95, -2.0, 0.2));
    z3.add(at(P.signpost('🌾', { h: 2.4, size: 1.0 }), -5.6, 0, 4.2, 0.1));
    z3.add(P.scatter(20, 90, 50, (r) => P.tree({ h: 3.5 + r() * 3, kind: r() < 0.3 ? 'pine' : 'round' }), { seed: 13, keep: (x, z) => (x < -18 || x > 25.5 || z < -20) && z < 3 && !(x < -18 && x > -34 && z > -16 && z < 1) && !(x > 12 && x < 26 && z > -16) }));
    z3.add(P.scatter(12, 60, 8, () => P.flower({ color: [0xd9483b, 0x3f7fd1, C.white][Math.floor(rnd() * 3)] }), { seed: 21 }).translateZ(7));
    z3.add(P.scatter(9, 60, 30, () => P.bush(), { seed: 15, keep: (x, z) => (x < -18 || x > 26) && z < 5 && !(x < -18 && x > -34 && z > -16 && z < 1) }));
    for (let i = 0; i < 4; i++) z3.add(at(P.mountain({ h: 18 + (i % 2) * 8, color: 0xb7b06a, snow: false }), -75 + i * 50, 0, -105));
    for (let i = 0; i < 5; i++) z3.add(at(P.cloud({ s: 2 + (i % 3) }), -50 + i * 26, 24 + (i % 2) * 5, -70 - (i % 3) * 8));
    ctx.addStatic(z3, X3, 0);
    const mill = ctx.add(M.windmill(), X3 + 20, -9.2); ctx.collideCircle(X3 + 20, -9.2, 3.1);
    ctx.collideBox(X3 + 19.5, -1.6, 3.6, 2.8); ctx.collideBox(X3 + 15.6, -3.3, 2.9, 3.6); ctx.collideBox(X3, -17.2, 26, 0.4); ctx.collideBox(X3 - 25, -8, 9, 8); ctx.collideCircle(X3 - 20, -2.0, 1.3); ctx.collideCircle(X3 + 22.9, -3.3, 0.9); ctx.collideCircle(X3 - 5.6, 4.2, 0.3);
    const topStone = group([cyl(0.9, 0.9, 0.32, 0xa9a9a2, [0, 0, 0], null, 12), box(1.7, 0.06, 0.12, 0x6f6f6a, [0, 0.17, 0]), box(0.12, 0.06, 1.7, 0x6f6f6a, [0, 0.17, 0]), cyl(0.05, 0.05, 0.5, C.woodDark, [0.7, 0.4, 0], null, 5)]); bake(topStone); ctx.add(topStone, X3 + 19.5, -1.6); topStone.position.y = 1.08;
    const cartGrain = ctx.add(ball(1.05, 0.4, 1.45, 0xe8c25a, [X3 + 15.6, 1.3, -3.3], null, 8)); cartGrain.visible = false;
    const flourSack = ctx.add(group([P.sack({ color: 0xf3ede0 }), sign('🌾', 0.32, { bg: null }, [0, 0.42, 0.27])]), X3 + 21.9, 0.3); flourSack.visible = false;
    const comb = ctx.add(M.combine(), X3 - 13.6, 1.2, Math.PI / 2); const combCol = ctx.collideBox(X3 - 13.2, 1.2, 6.4, 3.4);
    const miller = ctx.person({ hat: 'cap', hatColor: 0xf3ede0, shirt: 0xf3ede0, apron: 0xc9a26b, pants: 0x6b4a2f, skin: C.skin[1], hair: C.hair[6], beard: C.hair[6], expressive: true }, X3 + 23.3, 0.9, -1.0);
    const wFarmer = ctx.person({ hat: 'straw', shirt: 0xd9622b, pants: 0x3b5b8c, skin: C.skin[0], hair: C.hair[3], hairStyle: 'pony', expressive: true }, X3 - 7.6, 4.4, -0.5);
    // the wheat: one instanced mesh, each tuft can be cut on its own
    const clump = M.wheatClump();
    const WX = 31, WZ = 19, WS = 0.8, wheat = new THREE.InstancedMesh(clump.geo, clump.mat, WX * WZ), cells = [], m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3();
    for (let i = 0; i < WX; i++) for (let j = 0; j < WZ; j++) { const c = { x: X3 - 12 + i * WS + (rnd() - 0.5) * 0.25, z: -2.0 - j * WS + (rnd() - 0.5) * 0.25, cut: false, ry: rnd() * 6, s: 0.9 + rnd() * 0.3 }; cells.push(c); q4.setFromAxisAngle(v4.set(0, 1, 0), c.ry); m4.compose(v4.set(c.x, 0, c.z), q4, s4.set(1, c.s, 1)); wheat.setMatrixAt(cells.length - 1, m4); wheat.setColorAt(cells.length - 1, new THREE.Color().setScalar(0.86 + rnd() * 0.14)); }
    wheat.instanceMatrix.needsUpdate = true; wheat.computeBoundingSphere && wheat.computeBoundingSphere(); ctx.add(wheat);
    let cutN = 0; const stubble = new THREE.Color(0xb8a070);
    const cutCell = (k) => { const c = cells[k]; if (c.cut) return; c.cut = true; cutN++; q4.setFromAxisAngle(v4.set(0, 1, 0), c.ry); m4.compose(v4.set(c.x, 0, c.z), q4, s4.set(0.8, 0.12, 0.8)); wheat.setMatrixAt(k, m4); wheat.instanceMatrix.needsUpdate = true; wheat.setColorAt(k, stubble); wheat.instanceColor.needsUpdate = true; };
    let millSpin = 0.25, stoneSpin = 0;
    ctx.onUpdate((dt) => { if (zone !== 3) return; mill.userData.sails.rotation.z -= dt * millSpin; topStone.rotation.y += dt * stoneSpin; });

    // =====================================================================================
    // ZONE 4 — the barnyard: hens and a cow (x≈300)
    // =====================================================================================
    const X4 = 300, z4 = new THREE.Group();
    z4.add(M.ground(11, 10, 0xbfa972, [-8, 0.03, -5.6], 3)); z4.add(M.ground(7, 5, 0xa8905e, [7.4, 0.03, -4.6], 2)); z4.add(plane(3.5, 30, C.dirt, [1.4, 0.025, 8]));
    z4.add(at(P.building({ w: 5, h: 2.6, d: 3.6, color: 0xc8553d, roof: 'gable', roofColor: 0x6b3a2a, windows: 2, doorW: 0.9, doorH: 1.2, trim: C.white, sign: '🐔', signH: 1.2 }), -8.5, 0, -13.4));
    z4.add(box(0.9, 0.08, 2.0, C.woodLight, [-8.5, 0.3, -10.8], [0.28, 0, 0]));
    z4.add(at(P.fence(11), -8, 0, -10.9)); z4.add(at(P.fence(10), -13.6, 0, -5.8, Math.PI / 2)); z4.add(at(P.fence(4), -11.5, 0, -0.6)); z4.add(at(P.fence(7), 7.4, 0, -7.3)); z4.add(at(P.fence(5), 11, 0, -4.8, Math.PI / 2));
    const nests = [[-11.6, -8.6], [-9.0, -5.2], [-5.2, -9.0], [-4.4, -3.4], [-7.4, -2.4], [-11.8, -3.6]];
    for (const [x, z] of nests) { z4.add(cyl(0.42, 0.5, 0.16, 0xe3c15a, [x, 0.08, z], null, 8)); z4.add(torus(0.36, 0.1, 0xd9b04a, [x, 0.17, z], [Math.PI / 2, 0, 0], 8)); }
    z4.add(at(P.barn({ sign: '🐄', signH: 1.5 }), 10.5, 0, -13.5)); z4.add(at(P.silo(), 17, 0, -12));
    z4.add(box(2.2, 0.5, 0.8, C.wood, [9.7, 0.3, -6.4])); z4.add(box(2.0, 0.1, 0.6, 0x4aa3df, [9.7, 0.52, -6.4]));   // water trough
    z4.add(at(P.haybale(), 4.6, 0, -8.4)); z4.add(at(P.haybale(), 13.2, 0, -7.6, 0.6));
    z4.add(cyl(0.28, 0.3, 0.06, C.wood, [8.9, 0.5, -3.7], null, 8)); for (let i = 0; i < 3; i++) z4.add(cyl(0.03, 0.03, 0.5, C.woodDark, [8.9 + Math.cos(i * 2.1) * 0.2, 0.25, -3.7 + Math.sin(i * 2.1) * 0.2], null, 4)); // milking stool
    z4.add(at(P.tableProp(2.0, 1.0, 0.66, C.wood), -0.6, 0, -5.2)); z4.add(box(1.7, 0.03, 0.8, 0xd9483b, [-0.6, 0.71, -5.2]));
    const farCow = M.cow(0x8a5a2b); farCow.userData.head.userData.dynamic = false; z4.add(at(group([farCow]), 17, 0, -2.5, -2.3));
    z4.add(at(group([cyl(0.07, 0.07, 2.2, C.woodDark, [0, 1.1, 0], null, 5), box(1.25, 1.2, 0.08, C.wood, [0, 2.1, 0.03]), sign('🥛', 1.0, { bg: '#8fc4ea', border: '#6e4a28' }, [0, 2.1, 0.09])]), 4.0, 0, 2.0, -0.15)); z4.add(at(P.signpost('🥚', { h: 2.2, size: 0.9 }), -3.0, 0, 2.0, 0.15));
    z4.add(P.scatter(13, 90, 50, (r) => P.tree({ h: 3.5 + r() * 3, kind: r() < 0.2 ? 'pine' : r() < 0.5 ? 'fruit' : 'round', fruit: C.red }), { seed: 23, keep: (x, z) => (x < -15 || x > 19 || z < -19) && z < 4 }));
    z4.add(P.scatter(14, 40, 6, () => P.flower(), { seed: 29 }).translateZ(6)); z4.add(P.scatter(8, 60, 30, () => P.bush(), { seed: 25, keep: (x, z) => (x < -15 || x > 19) && z < 5 }));
    for (let i = 0; i < 4; i++) z4.add(at(P.mountain({ h: 20 + (i % 2) * 8 }), -70 + i * 48, 0, -100));
    for (let i = 0; i < 4; i++) z4.add(at(P.cloud({ s: 2 + (i % 3) }), -40 + i * 28, 24 + (i % 2) * 5, -70 - (i % 3) * 8));
    ctx.addStatic(z4, X4, 0);
    ctx.collideBox(X4 - 8.5, -13.4, 5.4, 4); ctx.collideBox(X4 - 8, -10.9, 11, 0.4); ctx.collideBox(X4 - 13.6, -5.8, 0.4, 10); ctx.collideBox(X4 + 10.5, -13.5, 10, 9); ctx.collideBox(X4 + 7.4, -7.3, 7, 0.4); ctx.collideBox(X4 + 11, -4.8, 0.4, 5);
    ctx.collideBox(X4 + 9.7, -6.4, 2.3, 0.9); ctx.collideBox(X4 - 0.6, -5.2, 2.2, 1.2); ctx.collideCircle(X4 + 4.6, -8.4, 0.8); ctx.collideCircle(X4 + 4, 2, 0.3); ctx.collideCircle(X4 - 3, 2, 0.3); ctx.collideBox(X4 - 11.5, -0.6, 4, 0.4);
    const cowObj = ctx.add(M.cow(), X4 + 7.3, -5.2, -Math.PI / 2); ctx.collideBox(X4 + 7.0, -5.2, 2.9, 1.1);
    const pail = group([lathe([[0, 0], [0.2, 0], [0.26, 0.4]], C.metal), torus(0.26, 0.02, 0x555f68, [0, 0.4, 0], [Math.PI / 2, 0, 0])]); bake(pail); const pailMilk = cyl(0.2, 0.2, 0.02, 0xffffff, [0, 0.05, 0], null, 10); pailMilk.visible = false; pailMilk.userData.noBake = true; pail.add(pailMilk); ctx.add(pail, X4 + 7.75, -4.35);
    const churn = ctx.add(bake(group([lathe([[0, 0], [0.36, 0], [0.3, 0.5], [0.24, 1.0], [0, 1.0]], C.woodLight, null, 10), cyl(0.37, 0.37, 0.06, 0x555f68, [0, 0.12, 0]), cyl(0.29, 0.29, 0.06, 0x555f68, [0, 0.7, 0])])), X4 + 1.6, -4.6); churn.scale.setScalar(0.8);   // its top at the child's chest, the dasher handle at the hands
    const dasher = ctx.add(group([cyl(0.035, 0.035, 1.1, C.woodDark, [0, 0.55, 0], null, 5), cyl(0.09, 0.09, 0.05, C.woodDark, [0, 1.1, 0], null, 6)]), X4 + 1.6, -4.6); dasher.scale.setScalar(0.8); dasher.position.y = 0.25;
    ctx.collideCircle(X4 + 1.6, -4.6, 0.4);
    const butter = ctx.add(bake(group([cyl(0.3, 0.26, 0.04, 0xfafafa, [0, 0.02, 0], null, 10), box(0.32, 0.16, 0.2, 0xffdf5a, [0, 0.12, 0])])), X4 - 0.1, -5.2); butter.position.y = 0.73; butter.visible = false;
    const basket = bake(group([lathe([[0, 0], [0.22, 0], [0.32, 0.26]], 0xb98a4a, null, 8), torus(0.3, 0.025, 0x8a5a2b, [0, 0.3, 0], [0, 0, 0], 8)])); ctx.add(basket, X4 - 1.8, 1.2);
    const dFarmer = ctx.person({ hat: 'straw', shirt: 0x3f7fd1, pants: 0x6b4a2f, skin: C.skin[4], hair: C.hair[6], hairStyle: 'pony', apron: 0xf6ecd6, expressive: true }, X4 - 0.2, 0.6, 0.3);
    const HEN = { x1: X4 - 12.6, x2: X4 - 3.6, z1: -9.9, z2: -1.6 };
    const hens = [0xfafafa, 0xc9793a, 0xfafafa, 0x8a5a2b, 0xe8d8b0].map((c, i) => { const o = ctx.add(M.hen(c), HEN.x1 + 1.5 + i * 1.6, -3 - (i * 2.3) % 5.5, i * 1.3); return { o, tx: o.position.x, tz: o.position.z, wait: i * 0.7, ph: i * 1.9, cl: 0 }; });
    let cowMoo = 0;
    ctx.onUpdate((dt, t) => {
      if (zone !== 4) return;
      for (const h of hens) { const p = h.o.position, dp = dist(p.x, p.z); let sp = 1.1; h.cl -= dt;
        if (dp < 2.3) { const a = Math.atan2(p.x - PP.x, p.z - PP.z); h.tx = Math.min(HEN.x2, Math.max(HEN.x1, p.x + Math.sin(a) * 3)); h.tz = Math.min(HEN.z2, Math.max(HEN.z1, p.z + Math.cos(a) * 3)); h.wait = 0; sp = 4.2; if (h.cl <= 0) { h.cl = 1.2; ctx.audio.play('cluck'); ctx.emote(h.o, '❗', { y: 1.0, size: 22 }); } }
        const dx = h.tx - p.x, dz = h.tz - p.z, d = Math.hypot(dx, dz);
        if (d > 0.15) { p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; h.o.rotation.y = Math.atan2(dx, dz); p.y = Math.abs(Math.sin(t * (sp > 2 ? 16 : 9) + h.ph)) * 0.07; h.o.rotation.x = 0; }
        else { p.y = 0; h.wait -= dt; h.o.rotation.x = Math.sin(t * 3 + h.ph) > 0.6 ? 0.45 : 0; if (h.wait <= 0) { h.wait = 1.5 + ((h.ph * 7 + t) % 2.5); h.tx = HEN.x1 + ((t * 37 + h.ph * 11) % 1) * (HEN.x2 - HEN.x1); h.tz = HEN.z1 + ((t * 53 + h.ph * 17) % 1) * (HEN.z2 - HEN.z1); } }
      }
      cowObj.userData.tail.rotation.z = Math.sin(t * 2.4) * 0.5; cowObj.userData.head.rotation.x = cowMoo > 0 ? -0.45 : Math.sin(t * 0.9) * 0.12; cowObj.userData.head.rotation.y = Math.sin(t * 0.5) * 0.25; if (cowMoo > 0) cowMoo -= dt;
    });

    // =====================================================================================
    // ZONE 5 — the spice island and its little port (x≈400). Sea lies behind (z < −13).
    // =====================================================================================
    const X5 = 400, z5 = new THREE.Group(), PIER = 9, SHIPZ = -24, DECK = 1.36;
    z5.add(M.ground(80, 44, 0xe3cf9c, [0, 0.03, 9], 9)); z5.add(M.ground(33, 14.5, 0x78b866, [-3.5, 0.04, -5.2], 4, true)); z5.add(plane(3.2, 7.5, 0xd9c08a, [PIER, 0.045, -9.4]));
    for (let i = 0; i < 9; i++) z5.add(box(80, 0.1, 0.5, i % 2 ? 0xf6ead0 : 0xe9dcb0, [0, -0.01, -13.1 - i * 0.05]));
    z5.add(box(3.0, 0.3, 7.2, C.wood, [PIER, 0.0, -16.4])); for (let i = 0; i < 7; i++) z5.add(box(3.05, 0.05, 0.08, C.woodDark, [PIER, 0.16, -13.2 - i * 1.05]));
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) z5.add(cyl(0.16, 0.16, 1.5, C.woodDark, [PIER + sx * 1.5, 0.2, -13.4 - i * 2.1], null, 6));
    // cinnamon tree (reddish bark), nutmeg tree (yellow fruit), clove tree (pink buds), ginger bed, sugar-cane bed
    const cinX = -10, cinZ = -7.6; z5.add(cyl(0.3, 0.38, 2.6, 0x9a5a34, [cinX, 1.3, cinZ], null, 8)); for (const [x, y, z, r] of [[0, 3.4, 0, 1.5], [1.0, 2.9, 0.3, 1.0], [-0.9, 3.0, -0.3, 1.05], [0.2, 4.3, -0.2, 0.95]]) z5.add(sphere(r, 0x3f8f4a, [cinX + x, y, cinZ + z], 7));
    const nutX = -4.6, nutZ = -9.4; z5.add(at(P.tree({ h: 5, kind: 'fruit', color: 0x4f9d4a, fruit: 0xf2d04a }), nutX, 0, nutZ));
    const cloX = 1.2, cloZ = -8.2; z5.add(cyl(0.12, 0.16, 1.2, C.woodDark, [cloX, 0.6, cloZ], null, 6)); z5.add(cone(1.15, 2.8, 0x3f9d5a, [cloX, 2.4, cloZ], null, 8));
    for (let i = 0; i < 12; i++) { const a = i * 2.4, y = 1.3 + (i % 4) * 0.5, r = 1.0 * (1 - (y - 1.0) / 2.9) + 0.06; z5.add(sphere(0.085, 0xf28aa8, [cloX + Math.cos(a) * r, y, cloZ + Math.sin(a) * r], 5)); }
    const ginX = -6.6, ginZ = -3.0; z5.add(box(3.0, 0.16, 1.8, C.soil, [ginX, 0.08, ginZ])); for (let i = 0; i < 8; i++) { const x = ginX - 1.15 + (i % 4) * 0.77, z = ginZ - 0.4 + Math.floor(i / 4) * 0.8; if (i === 5) continue; for (let k = 0; k < 3; k++) z5.add(ball(0.05, 0.4, 0.12, 0x5aa845, [x + (k - 1) * 0.1, 0.5, z], [0, k * 2, (k - 1) * 0.35], 5)); }
    const canX = 5.0, canZ = -8.6; z5.add(box(3.0, 0.16, 1.8, C.soil, [canX + 0.2, 0.08, canZ - 0.1]));
    const caneStalk = (h) => { const g = new THREE.Group(); for (let k = 0; k < 5; k++) g.add(cyl(0.055, 0.06, h / 5 - 0.03, k % 2 ? 0xaab758 : 0x98a94a, [0, h / 5 * (k + 0.5), 0], null, 5)); for (let k = 0; k < 5; k++) g.add(group([box(0.1, 0.012, 0.62, 0x5f9f48, [0, -0.06, 0.33], [0.45, 0, 0]), box(0.07, 0.012, 0.5, 0x6aa850, [0, -0.36, 0.78], [0.95, 0, 0])], [0, h - (k % 2) * 0.35, 0], [0, k * 1.3, 0])); return g; };
    for (let i = 0; i < 7; i++) z5.add(at(caneStalk(2.4 + (i % 3) * 0.3), canX + 0.7 + (i % 4) * 0.32 + (i > 3 ? 0.16 : 0), 0, canZ - 0.45 + Math.floor(i / 4) * 0.6));
    // hut, drying mats, dock things, palms, rocks, lighthouse
    z5.add(at(P.building({ w: 4.6, h: 2.5, d: 3.6, color: 0xe8c98a, roof: 'gable', roofColor: 0xc9a24a, windows: 1, doorX: -1, trim: 0xb98a4a }), -15.5, 0, -8, 0.5));
    for (const [x, z, c] of [[-1.8, -1.2, 0x9a5a34], [-0.2, -1.0, 0x5a3a2a], [-1.0, 0.1, 0xd9b36a]]) { z5.add(box(1.2, 0.05, 0.9, 0xe6cf9a, [x, 0.08, z], [0, 0.2, 0])); for (let i = 0; i < 9; i++) z5.add(sphere(0.07, c, [x - 0.35 + (i % 3) * 0.35, 0.14, z - 0.25 + Math.floor(i / 3) * 0.25], 4)); }
    z5.add(at(P.crate(), 12.2, 0, -10.8)); z5.add(at(P.crate(), 13.0, 0, -10.6, 0.4)); z5.add(at(P.crate(), 12.6, 0.45, -10.7, 0.2)); z5.add(at(P.barrel(), 11.8, 0, -9.6)); z5.add(at(P.barrel(), 13.9, 0, -11.4));
    z5.add(at(P.signpost('⚓', { h: 2.4, size: 1.0 }), 11.3, 0, -12.2));
    const prnd = seeded(5); for (const [x, z, h, l] of [[-19, -10, 6, 0.9], [-13.5, -3, 5, -0.7], [15.5, -7, 6, 0.8], [18, -1, 5, -0.6], [-17, 4, 5.5, 0.5], [8.5, 4.8, 5, 0.9], [-6, 6, 5, -0.5], [22, -11, 6.5, 0.4]]) z5.add(at(palm(h, l, prnd), x, 0, z, prnd() * 6));
    function palm(h, l, r) { return group([M.palm(h, l, r)]); }
    z5.add(P.scatter(8, 50, 14, () => P.rock({ s: 0.6 + prnd() * 0.8, color: 0xb5a88a }), { seed: 33, keep: (x, z) => Math.abs(x) > 15 }).translateZ(-4)); z5.add(P.scatter(10, 44, 6, () => P.bush({ color: 0x4fae5a }), { seed: 35, keep: (x) => Math.abs(x - 9) > 4 }).translateZ(-12));
    z5.add(P.scatter(12, 30, 6, () => P.flower({ color: [0xf28aa8, 0xf2c43d, 0xffffff][Math.floor(prnd() * 3)] }), { seed: 39 }).translateZ(3).translateX(-4));
    z5.add(at(P.rock({ s: 9, color: 0x8a8f86 }), -22, -1.5, -36)); z5.add(cyl(1.2, 1.6, 6, C.white, [-22, 5.5, -36], null, 10)); z5.add(cyl(1.42, 1.5, 1.2, C.red, [-22, 4.4, -36], null, 10)); z5.add(cyl(1.25, 1.32, 1.2, C.red, [-22, 7, -36], null, 10)); z5.add(cyl(1.0, 1.0, 1.0, glow(0xfff2a8), [-22, 9, -36], null, 8)); z5.add(cone(1.3, 1.2, C.red, [-22, 10.1, -36], null, 8));
    z5.add(at(P.rock({ s: 14, color: 0x6fae62 }), 42, -3, -70)); z5.add(at(P.rock({ s: 10, color: 0x6fae62 }), -50, -2.5, -80));
    for (let i = 0; i < 5; i++) z5.add(at(P.cloud({ s: 2 + (i % 3) }), -50 + i * 26, 24 + (i % 2) * 5, -75 - (i % 3) * 8));
    const boat = group([box(1.2, 0.4, 2.4, 0x3f7fd1, [0, 0.28, 0]), box(0.86, 0.4, 0.86, 0x3f7fd1, [0, 0.28, 1.2], [0, Math.PI / 4, 0]), box(1.0, 0.3, 2.2, 0x2b5fa0, [0, 0.36, 0]), box(1.1, 0.06, 0.3, C.woodLight, [0, 0.5, -0.3]), box(1.1, 0.06, 0.3, C.woodLight, [0, 0.5, 0.5]), box(1.3, 0.1, 0.1, C.white, [0, 0.5, -1.2]), cyl(0.03, 0.03, 2.2, C.woodLight, [0.75, 0.3, 0.2], [Math.PI / 2 - 0.1, 0, 0.2], 5), box(0.16, 0.03, 0.5, C.woodLight, [0.9, 0.22, 1.3])]);
    z5.add(at(boat, 4.2, 0, 5.2, 2.3));
    z5.add(cyl(0.04, 0.04, 2.4, C.white, [-9.5, 1.2, 4.4], null, 5)); z5.add(cone(1.5, 0.6, 0xd9483b, [-9.5, 2.5, 4.4], null, 8)); z5.add(cone(1.0, 0.42, C.white, [-9.5, 2.62, 4.4], null, 8)); z5.add(box(1.0, 0.04, 1.9, 0x3f9d8a, [-8.3, 0.06, 4.8], [0, 0.3, 0])); z5.add(box(1.0, 0.05, 0.3, C.white, [-8.3, 0.065, 4.8], [0, 0.3, 0]));
    z5.add(P.scatter(14, 34, 6, (r) => r() < 0.5 ? cone(0.13, 0.1, [0xf28aa8, 0xf6ead0, 0xe98a2b][Math.floor(r() * 3)], [0, 0.06, 0], null, 5) : sphere(0.09, 0xf6ead0, [0, 0.05, 0], 5), { seed: 41 }).translateZ(3.6));
    // hand cart for the spice sacks
    z5.add(box(1.9, 0.1, 1.2, C.wood, [5.6, 0.5, -2.6])); for (const sx of [-1, 1]) { for (const wz of [-1.95, -3.25]) { z5.add(torus(0.36, 0.05, C.woodDark, [5.6 + sx * 0.6, 0.41, wz], null, 16)); z5.add(cyl(0.07, 0.07, 0.14, C.woodDark, [5.6 + sx * 0.6, 0.41, wz], [Math.PI / 2, 0, 0], 6)); for (let k = 0; k < 3; k++) z5.add(box(0.7, 0.05, 0.04, C.woodLight, [5.6 + sx * 0.6, 0.41, wz], [0, 0, k * Math.PI / 3])); } } z5.add(box(0.9, 0.06, 0.06, C.woodDark, [4.3, 0.62, -2.6], [0, 0, 0.35]));
    ctx.addStatic(z5, X5, 0);
    ctx.collideCircle(X5 + cinX, cinZ, 0.6); ctx.collideCircle(X5 + nutX, nutZ, 0.45); ctx.collideCircle(X5 + cloX, cloZ, 0.8); ctx.collideCircle(X5 + canX + 1.25, canZ - 0.15, 0.8); ctx.collideBox(X5 - 15.5, -8, 5.6, 4.6); ctx.collideBox(X5 + 5.6, -2.6, 2.1, 1.5); ctx.collideBox(X5 + 12.7, -10.6, 2.6, 1.6); ctx.collideCircle(X5 + 11.3, -12.2, 0.3); ctx.collideCircle(X5 + 4.2, 5.2, 1.3); ctx.collideCircle(X5 - 9.5, 4.4, 0.3); ctx.collideCircle(X5 + 8.5, 4.8, 0.35); ctx.collideCircle(X5 - 6, 6, 0.35); ctx.collideCircle(X5 - 13.5, -3, 0.35);
    const waves = new THREE.Group(); for (let i = 0; i < 14; i++) waves.add(box(2 + (i % 3), 0.04, 0.22, 0xdff3ff, [-42 + i * 6.3 + (i % 2) * 2, 0.03, -17 - (i * 7) % 26])); bake(waves); ctx.add(waves, X5, 0);
    const shipG = group([M.ship()]); bake(shipG); ctx.add(shipG, X5 + PIER + 1.2, SHIPZ);
    const plank = ctx.add(bake(group([box(1.5, 0.1, 3.2, C.woodLight, [0, 0, 0]), box(0.06, 0.5, 3.2, C.woodDark, [0.72, 0.25, 0]), box(0.06, 0.5, 3.2, C.woodDark, [-0.72, 0.25, 0])])), X5 + PIER, -20.9); plank.position.y = 0.74; plank.rotation.x = Math.atan2(DECK - 0.15, 2.8);
    const rope = ctx.add(bake(group([box(3.0, 0.07, 0.07, 0xd9483b, [0, 0, 0]), box(0.5, 0.34, 0.04, 0xfff8e8, [0, -0.2, 0.03]), box(0.3, 0.06, 0.05, 0xd9483b, [0, -0.2, 0.06])])), X5 + PIER, -13.35); rope.position.y = 0.85;
    const gulls = [0, 1].map(i => { const o = ctx.add(M.bird(0xfafafa, 0xf2c43d, 1.1), X5, -22); o.position.y = 8; return { o, ph: i * 3.1 }; });
    const bark = ctx.add(box(0.34, 1.1, 0.06, 0xd98a4a, [X5 + cinX, 1.3, cinZ + 0.36]));   // the patch of bark you peel
    const nutFruit = ctx.add(sphere(0.2, 0xf2d04a, [X5 + nutX + 0.9, 2.6, nutZ + 1.3], 7));
    const gingerTop = ctx.add(bake(group([ball(0.05, 0.4, 0.12, 0x5aa845, [-0.1, 0.5, 0], [0, 0, -0.35], 5), ball(0.05, 0.45, 0.12, 0x5aa845, [0, 0.55, 0], [0, 2, 0], 5), ball(0.05, 0.4, 0.12, 0x5aa845, [0.1, 0.5, 0], [0, 4, 0.35], 5)])), X5 + ginX - 1.15 + 0.77, ginZ + 0.4);
    const cane = group([caneStalk(2.7), at(caneStalk(2.4), 0.3, 0, 0.2), at(caneStalk(2.9), -0.3, 0, 0.15), at(caneStalk(2.5), 0.1, 0, -0.25)]); bake(cane); ctx.add(cane, X5 + canX - 0.6, canZ + 0.2);
    const SACKS = [['cin', 0x9a5a34], ['nut', 0x7a4a2a], ['gin', 0xd9b36a], ['clo', 0x4a2a22], ['sug', 0xfafafa]].map(([id, c], i) => { const o = group([P.sack({ color: 0xd8c39a }), cyl(0.12, 0.12, 0.06, c, [0, 0.9, 0], null, 6), box(0.22, 0.22, 0.02, c, [0, 0.42, 0.25])]); bake(o); o.scale.setScalar(0.8); ctx.add(o, X5 + 4.95 + (i % 3) * 0.6 + (i > 2 ? 0.3 : 0), -2.85 + (i > 2 ? 0.55 : 0)); o.position.y = 0.55; o.visible = false; return { id, o }; });
    const grower = ctx.person({ hat: 'straw', shirt: 0xf2c43d, pants: 0x3f9d8a, skin: C.skin[5], hair: C.hair[1], hairStyle: 'bun', expressive: true }, X5 + 2.4, -1.6, -0.5);
    const sailor = ctx.person({ hat: 'sailor', shirt: 0xfafafa, pants: C.navy, skin: C.skin[2], hair: C.hair[0], beard: C.hair[0], expressive: true }, X5 + PIER + 1.6, SHIPZ - 0.9, 0); sailor.position.y = DECK; if (sailor.userData.collider) sailor.userData.collider.remove();
    let pierOpen = false, shipGone = false, pierPrevZ = 0;
    ctx.onUpdate((dt, t) => {
      if (zone !== 5) return;
      for (const g of gulls) { const a = t * 0.5 + g.ph; g.o.position.set(X5 + 6 + Math.cos(a) * 13, 8 + Math.sin(t + g.ph) * 0.8, -22 + Math.sin(a) * 7); g.o.rotation.y = -a; g.o.userData.wings.scale.y = Math.sin(t * 7 + g.ph); }
      waves.position.x = X5 + Math.sin(t * 0.4) * 1.5; if (!shipGone) shipG.position.y = Math.sin(t * 1.3) * 0.05;
      // walking on the pier, up the gangplank and on the deck
      const px = X5 + PIER, SHORE = -12.8;
      if (PP.z < SHORE) {
        if (!pierOpen || (pierPrevZ >= SHORE && Math.abs(PP.x - px) > 1.1)) PP.z = SHORE;          // the sea: only the pier leads out
        else { const onDeck = PP.z < -22.3, wasDeck = pierPrevZ < -22.3;
          if (shipGone) PP.z = Math.max(PP.z, -19.3);
          if (onDeck && !wasDeck && Math.abs(PP.x - px) > 0.8) PP.z = -22.3;
          else if (!onDeck && wasDeck && Math.abs(PP.x - px) > 0.8) PP.z = -22.31;
          const deck = PP.z < -22.3; PP.x = Math.min(px + (deck ? 0.6 : 0.5) + (PP.z > -19 ? 0.6 : 0), Math.max(px - (deck ? 2.7 : 0.5) - (PP.z > -19 ? 0.6 : 0), PP.x)); PP.z = Math.max(PP.z, -25.3); }
      }
      pierPrevZ = PP.z;
      PL.position.y = PP.z > -13 ? 0 : PP.z > -19.5 ? 0.15 : PP.z > -22.3 ? 0.15 + (DECK - 0.15) * (-19.5 - PP.z) / 2.8 : DECK;
    });

    // =====================================================================================
    // ZONE 6 — the home kitchen (x≈500, indoors)
    // =====================================================================================
    const X6 = 500, z6 = new THREE.Group(), CZ = -7.1, CY = 0.78, TH = 0.68;   // worktop and table-top heights: hip height of the grown-ups, chest height of the child
    { // wooden floorboards
      const tex = canvasTex(256, 256, (g, W, H) => { const r = seeded(9); for (let i = 0; i < 8; i++) { const v = 215 + Math.floor(r() * 40); g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(0, i * 32, W, 32); g.fillStyle = 'rgba(90,60,30,0.5)'; g.fillRect(0, i * 32, W, 2); const j = Math.floor(r() * W); g.fillRect(j, i * 32, 2, 32); g.fillRect((j + 140) % W, i * 32, 2, 32);
        g.strokeStyle = 'rgba(120,80,40,0.16)'; g.lineWidth = 1; for (let k = 0; k < 5; k++) { const y = i * 32 + 5 + r() * 24; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 8, W * 0.6, y + (r() - 0.5) * 8, W, y); g.stroke(); } } });
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshLambertMaterial({ color: 0xc4946a, map: tex })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.03, -2); fl.receiveShadow = true; z6.add(fl); }
    z6.add(box(16, 5.4, 0.4, 0xf6e3b4, [0, 2.7, -8])); z6.add(box(0.4, 5.4, 12, 0xf0d9a4, [-8, 2.7, -2])); z6.add(box(0.4, 5.4, 12, 0xf0d9a4, [8, 2.7, -2]));
    z6.add(box(16, 1.2, 0.42, 0x7fb08f, [0, 0.6, -7.98])); z6.add(box(16, 0.3, 0.44, 0xd9622b, [0, 4.9, -7.97]));
    z6.add(box(10.4, CY - 0.1, 1.3, 0x6fa88f, [-1.6, (CY - 0.1) / 2, CZ])); z6.add(box(10.6, 0.1, 1.4, 0xf5f0e6, [-1.6, CY - 0.05, CZ])); for (let i = 0; i < 5; i++) { z6.add(box(1.7, CY - 0.32, 0.05, 0x86bda4, [-5.8 + i * 2.1, (CY - 0.1) / 2, CZ + 0.66])); z6.add(sphere(0.05, C.gold, [-5.8 + i * 2.1, CY - 0.24, CZ + 0.7], 5)); }
    // oven + fridge
    z6.add(box(1.9, CY, 1.3, 0xe6e6e6, [4.75, CY / 2, CZ])); z6.add(box(1.9, 0.06, 1.3, 0x333333, [4.75, CY + 0.03, CZ])); z6.add(box(1.9, 0.5, 0.1, 0xd0d0d0, [4.75, CY + 0.3, CZ - 0.6])); for (let i = 0; i < 4; i++) z6.add(cyl(0.06, 0.06, 0.06, 0x333333, [4.1 + i * 0.43, CY - 0.1, CZ + 0.66], [Math.PI / 2, 0, 0], 8)); z6.add(box(1.4, 0.05, 0.06, 0x999999, [4.75, CY - 0.24, CZ + 0.7]));
    for (const [x, z] of [[4.35, -0.25], [5.15, -0.25], [4.35, 0.3], [5.15, 0.3]]) z6.add(cyl(0.16, 0.16, 0.02, 0x111111, [x, CY + 0.07, CZ + z], null, 10));
    z6.add(box(1.7, 2.5, 1.3, 0xdfe8ec, [6.9, 1.25, CZ])); z6.add(box(1.6, 0.04, 0.04, 0x999999, [6.9, 1.65, CZ + 0.66])); z6.add(box(0.06, 0.55, 0.06, 0x999999, [6.25, 2.05, CZ + 0.68])); z6.add(box(0.06, 0.7, 0.06, 0x999999, [6.25, 1.1, CZ + 0.68]));
    // window with autumn outside, shelf with plates, hanging pans, pictures
    z6.add(box(3.5, 2.1, 0.12, C.white, [-2.2, 3.2, -7.76])); z6.add(picture(3.2, 1.8, (g, W, H) => { const s = g.createLinearGradient(0, 0, 0, H); s.addColorStop(0, '#7fc4f5'); s.addColorStop(1, '#ffe9c4'); g.fillStyle = s; g.fillRect(0, 0, W, H); g.fillStyle = '#9db85a'; g.fillRect(0, H * 0.72, W, H); for (const [x, r, c] of [[0.15, 0.2, '#d9622b'], [0.4, 0.26, '#e9a23b'], [0.68, 0.2, '#c23b22'], [0.9, 0.24, '#e0c040']]) { g.fillStyle = '#6e4a28'; g.fillRect(W * x - 4, H * 0.5, 8, H * 0.3); g.fillStyle = c; g.beginPath(); g.arc(W * x, H * 0.45, H * r, 0, 7); g.fill(); } }, 256, [-2.2, 3.2, -7.68]));
    z6.add(box(0.08, 1.8, 0.06, C.white, [-2.2, 3.2, -7.66])); z6.add(box(3.2, 0.08, 0.06, C.white, [-2.2, 3.2, -7.66])); for (const sx of [-1, 1]) z6.add(box(0.5, 2.2, 0.1, 0xd9622b, [-2.2 + sx * 2.0, 3.2, -7.7]));
    z6.add(box(3.2, 0.1, 0.5, C.wood, [2.6, 2.9, -7.6])); for (let i = 0; i < 4; i++) z6.add(cyl(0.3, 0.3, 0.04, i % 2 ? 0xf6f3ea : 0xb9d4de, [1.5 + i * 0.72, 3.25, -7.62], [Math.PI / 2 - 0.15, 0, 0], 18)); for (let i = 0; i < 3; i++) z6.add(cyl(0.1, 0.08, 0.22, [C.red, C.yellow, C.blue][i], [1.6 + i * 0.3, 2.5, -7.5], null, 7));
    z6.add(box(3.0, 0.06, 0.06, 0x555555, [-5.8, 3.6, -7.7])); for (let i = 0; i < 3; i++) { z6.add(cyl(0.26 - i * 0.03, 0.26 - i * 0.03, 0.05, [0x444444, 0xb5651d, 0x555f68][i], [-6.7 + i * 0.9, 3.05, -7.7], [Math.PI / 2, 0, 0], 10)); z6.add(box(0.05, 0.4, 0.04, 0x333333, [-6.7 + i * 0.9, 3.42, -7.7])); }
    z6.add(sign('🥧', 1.3, { bg: '#fff8e8', border: '#d9622b' }, [5.2, 3.5, -7.75]));
    z6.add(picture(1.6, 1.2, (g, W, H) => { g.fillStyle = '#fff8e8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a5a2b'; g.lineWidth = 12; g.strokeRect(0, 0, W, H); g.font = (H * 0.5) + 'px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🍂🦃', W / 2, H / 2); }, 256, [-7.78, 3.0, -3], [0, Math.PI / 2, 0]));
    z6.add(picture(1.4, 1.4, (g, W, H) => { g.fillStyle = '#fff8e8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a5a2b'; g.lineWidth = 12; g.strokeRect(0, 0, W, H); g.font = (H * 0.55) + 'px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🌻', W / 2, H / 2); }, 256, [7.78, 3.0, -2.5], [0, -Math.PI / 2, 0]));
    // table with a cooling rack, chairs, rug
    z6.add(disc(2.6, 0xd9622b, [-2.4, 0.04, -1.3])); z6.add(disc(2.2, 0xf2c43d, [-2.4, 0.045, -1.3])); z6.add(disc(1.8, 0xd9622b, [-2.4, 0.05, -1.3]));
    z6.add(at(P.tableProp(3.0, 1.6, TH, C.wood), -2.4, 0, -1.3)); z6.add(box(1.1, 0.04, 0.9, 0xf6ecd6, [-2.4, TH + 0.06, -1.3]));
    for (let i = 0; i < 5; i++) z6.add(box(0.7, 0.03, 0.03, 0x777777, [-2.4, TH + 0.12, -1.6 + i * 0.15])); for (const sz of [-1, 1]) z6.add(box(0.03, 0.06, 0.7, 0x777777, [-2.4 + sz * 0.34, TH + 0.1, -1.3]));
    for (const sx of [-1, 1]) { const cx = -2.4 + sx * 2.1; z6.add(box(0.6, 0.06, 0.6, C.woodLight, [cx, 0.45, -1.3])); z6.add(box(0.08, 1.0, 0.6, C.woodLight, [cx + sx * 0.28, 0.5, -1.3])); for (const a of [-1, 1]) z6.add(box(0.07, 0.45, 0.07, C.woodLight, [cx - sx * 0.24, 0.22, -1.3 + a * 0.24])); }
    // things on the counter that never move
    z6.add(box(1.3, 0.06, 0.9, C.woodLight, [-3.6, CY + 0.03, CZ + 0.05]));   // pastry board
    z6.add(box(0.9, 0.5, 0.3, 0x8a5a2b, [3.0, CY + 0.25, CZ - 0.35])); z6.add(box(0.95, 0.05, 0.34, C.woodDark, [3.0, CY, CZ - 0.35]));   // spice rack
    ctx.addStatic(z6, X6, 0);
    ctx.collideBox(X6 - 2.4, -1.3, 4.9, 1.9); ctx.collideBox(X6, CZ, 16, 1.7);
    const ovenGlass = new THREE.Mesh(new THREE.BoxGeometry(1.3, CY - 0.4, 0.05), new THREE.MeshBasicMaterial({ color: 0x2a1a12 })); ovenGlass.position.set(X6 + 4.75, CY / 2 - 0.12, CZ + 0.66); ctx.add(ovenGlass);
    const timer = ctx.add(group([cyl(0.32, 0.32, 0.06, 0xfafafa, [0, 0, 0], [Math.PI / 2, 0, 0], 20), cyl(0.36, 0.36, 0.04, 0xc23b2e, [0, 0, -0.02], [Math.PI / 2, 0, 0], 20)]), X6 + 4.75, -7.6); timer.position.y = 2.45; bake(timer);
    const timerHand = box(0.05, 0.27, 0.03, 0x222222, [0, 0.12, 0]); const handG = group([timerHand], [0, 0, 0.05]); handG.userData.dynamic = true; timer.add(handG);
    const cook = ctx.person({ hair: C.hair[4], hairStyle: 'short', beard: C.hair[4], shirt: 0xc8553d, apron: C.cream, glasses: true, skin: C.skin[2], pants: 0x4a4a55, expressive: true }, X6 + 2.6, -5.2, -0.5);
    const kid = ctx.person({ scale: 0.66, hair: C.hair[0], hairStyle: 'curly', shirt: 0xf2c43d, pants: 0x3f7fd1, skin: C.skin[2], expressive: true }, X6 - 5.6, -3.2, 1.0);
    const cat = ctx.add(bake(group([ball(0.3, 0.18, 0.22, 0xe98a2b, [0, 0.18, 0]), sphere(0.15, 0xe98a2b, [0.26, 0.2, 0.1], 7), cone(0.05, 0.1, 0xe98a2b, [0.2, 0.36, 0.12], null, 4), cone(0.05, 0.1, 0xe98a2b, [0.33, 0.36, 0.12], null, 4), torus(0.2, 0.04, 0xd9722b, [-0.12, 0.06, 0.12], [Math.PI / 2, 0, 0], 8)])), X6 + 5.4, 1.4, -0.6);
    ctx.collideCircle(X6 + 5.4, 1.4, 0.4);
    // ingredients on the counter (each its own small object so it can hop into the bowl)
    const K = (g, x, z = 0) => { bake(g); ctx.add(g, X6 + x, CZ + z); g.position.y = CY; return g; };
    const flour = K(group([P.sack({ color: 0xf3ede0 }), sign('🌾', 0.3, { bg: null }, [0, 0.42, 0.27])]), -5.9, -0.1); flour.scale.setScalar(0.75);
    const butterK = K(group([cyl(0.26, 0.22, 0.04, 0xfafafa, [0, 0.02, 0], null, 10), box(0.3, 0.15, 0.18, 0xffdf5a, [0, 0.11, 0])]), -5.0, 0.2);
    const rollPin = K(group([cyl(0.07, 0.07, 0.7, C.woodLight, [0, 0.07, 0], [0, 0, Math.PI / 2], 8), cyl(0.03, 0.03, 1.0, C.woodDark, [0, 0.07, 0], [0, 0, Math.PI / 2], 5)]), -3.6, 0.42);
    const bowl = K(group([lathe([[0, 0], [0.3, 0.02], [0.52, 0.36], [0.55, 0.4]], 0x9fd6f2)]), -0.4, 0.05); const bowlFill = cyl(0.3, 0.3, 0.03, 0xe8781e, [0, 0.06, 0], null, 12); bowlFill.visible = false; bowl.add(bowlFill);
    const INGR = [
      ['🎃', K(group([cyl(0.17, 0.17, 0.36, C.orange, [0, 0.18, 0], null, 9), cyl(0.175, 0.175, 0.05, C.metal, [0, 0.36, 0], null, 9), box(0.14, 0.14, 0.02, 0xfff2c0, [0, 0.18, 0.17])]), 0.55, 0.2), 0xe8781e],
      ['🥚', K(group([lathe([[0, 0], [0.14, 0], [0.22, 0.14]], 0xb98a4a, null, 8), ball(0.08, 0.1, 0.08, 0xf6ead8, [-0.07, 0.16, 0]), ball(0.08, 0.1, 0.08, 0xe8c9a0, [0.08, 0.16, 0.03]), ball(0.08, 0.1, 0.08, 0xf6ead8, [0, 0.18, -0.08])]), 1.1, 0.25), 0xf2a83a],
      ['🥛', K(group([cyl(0.11, 0.12, 0.34, 0xfafafa, [0, 0.17, 0], null, 8), cyl(0.05, 0.1, 0.12, 0xfafafa, [0, 0.4, 0], null, 8), cyl(0.055, 0.055, 0.04, C.blue, [0, 0.47, 0], null, 8)]), 1.6, 0.1), 0xf2b868],
      ['🍬', K(group([box(0.3, 0.4, 0.2, 0xfafafa, [0, 0.2, 0]), box(0.31, 0.12, 0.21, 0xe88fb0, [0, 0.2, 0]), box(0.26, 0.06, 0.16, 0xfafafa, [0, 0.42, 0])]), 2.15, 0.2), 0xe8983a],
      ['✨', K(group([0x9a5a34, 0x7a4a2a, 0xd9b36a, 0x4a2a22].map((c, i) => group([cyl(0.07, 0.07, 0.2, c, [0, 0.1, 0], null, 7), cyl(0.075, 0.075, 0.05, C.red, [0, 0.22, 0], null, 7)], [(i - 1.5) * 0.19, 0, 0]))), 3.0, 0.1), 0xd9701e],
    ];
    const mkPie = (stage) => { // 0 empty dish · 1 with crust · 2 filled, raw · 3 baked · 4 with whipped cream
      const g = group([lathe([[0, 0], [0.3, 0], [0.44, 0.13], [0.48, 0.135]], 0xc3cdd3, null, 20)]);
      if (stage >= 1) { const cc = stage >= 3 ? 0xcf9a52 : 0xeedaae, edge = stage >= 3 ? 0xb9803c : 0xe8d2a2; g.add(lathe([[0, 0.02], [0.29, 0.02], [0.42, 0.14]], cc, null, 20));
        for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; g.add(ball(0.05, 0.04, 0.068, i % 2 ? cc : edge, [Math.cos(a) * 0.44, 0.15, Math.sin(a) * 0.44], [0, -a + 0.5, 0], 5)); } }   // crimped rim
      if (stage >= 2) { g.add(cyl(0.4, 0.36, 0.06, stage >= 3 ? 0xb86428 : 0xe8943a, [0, 0.12, 0], null, 20)); if (stage >= 3) g.add(ball(0.34, 0.03, 0.34, 0xc06c2c, [0, 0.145, 0], null, 12)); }   // baked filling domes a little
      if (stage >= 4) { g.add(ball(0.16, 0.07, 0.16, 0xfffdf4, [0, 0.2, 0], null, 9)); g.add(ball(0.115, 0.06, 0.115, 0xfffdf4, [0.01, 0.27, 0], null, 8)); g.add(ball(0.07, 0.05, 0.07, 0xfffdf4, [0, 0.33, 0.01], null, 7)); g.add(cone(0.035, 0.09, 0xfffdf4, [0.01, 0.4, 0], [0, 0, -0.25], 6)); }
      return bake(g);
    };
    const PIE_AT = [X6 - 2.0, CY, CZ + 0.1]; let pie = ctx.add(mkPie(0)); pie.position.set(...PIE_AT);
    const carryPie = () => carry(pie, 0.09, 0.28);   // the wide dish rests on the hands, its rim clear of the chest
    const setPie = (stage) => { const p = mkPie(stage); p.position.copy(pie.position); p.rotation.copy(pie.rotation); const par = pie.parent; ctx.remove(pie); par.add(p); pie = p; return p; };
    ctx.onUpdate((dt, t) => { if (zone !== 6) return; cat.scale.y = 1 + Math.sin(t * 1.6) * 0.05; });

    // =====================================================================================
    // THE STORY
    // =====================================================================================
    // only the zone we are in is drawn (the six zones lie side by side; each one hidden saves thousands of triangles)
    const zoneObjs = [[], [], [], [], [], []];
    for (const o of ctx.scene.children) { if (engineObjs.has(o) || o === PL || o === guide) continue; zoneObjs[o === wheat ? 2 : Math.max(0, Math.min(5, Math.round(o.position.x / 100)))].push(o); }
    const showZone = (n) => zoneObjs.forEach((list, i) => { for (const o of list) o.traverse(c => c.layers.set(i === n - 1 ? 0 : 1)); });
    showZone(1);
    const TOTAL = 16; let step = 0; const done = () => ctx.progress(++step, TOTAL);

    // ---------- 1 · the pumpkin patch ----------
    async function chPatch() {
      zone = 1; ctx.bounds(-8.6, -11.6, 9.2, 7.5);
      say(farmer, 'Frost is gone. Planting time! 🌱');
      let planted = 0;
      goalTo('🌱', 'Plant 4 seeds', () => nearest(hills.filter(h => !h.planted).map(h => [h.x, h.z])));
      for (const h of hills) {
        const mk = ctx.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 12), mat(0xffd84a, { opacity: 0.6 })), h.x, h.z); mk.position.y = 0.3;
        ctx.interact({ at: [h.x, h.z], face: [h.x, h.z], r: 1.7, y: 1.3, icon: '🌱', label: 'Plant', sfx: 'plant', onUse: async () => {
          h.planted = true; ctx.remove(mk); const sd = ctx.add(ball(0.1, 0.03, 0.16, 0xf6ecd6, [h.x, 1.1, h.z])); await ctx.tween(sd.position, { y: 0.25 }, 0.3, 'in'); ctx.remove(sd); ctx.burst([h.x, 0.3, h.z], { color: 0x7a5536, n: 8 });
          h.sprout = ctx.add(P.cropPlant({ s: 1.2 }), h.x, h.z); h.sprout.position.y = 0.22; pop(h.sprout, 0.5); planted++; if (planted < 4) ctx.goal('🌱', 'Plant ' + (4 - planted) + ' more', guide);
        } });
      }
      await ctx.until(() => planted >= 4); done();
      // time-lapse: rain, sun, vines sprawl and blossoms open
      await ctx.wait(0.5);
      goal('☀️', 'Watch them grow');
      fact('🌱', 'A pumpkin needs about 100 days to grow from a seed.');
      const f = ctx.focus([0, -5.6], 5.2, { dist: 15, pitch: 0.8 });
      const rain = ctx.every(0.1, () => ctx.burst([(Math.random() - 0.5) * 14, 2.6, -5.6 + (Math.random() - 0.5) * 9], { color: 0x7fc8ff, n: 3, speed: 0.6, size: 0.16, y: 0 })); const rs = ctx.every(0.5, () => ctx.audio.play('water'));
      await ctx.wait(1.2); rain(); rs();
      for (const h of hills) { ctx.remove(h.sprout); h.vine.visible = true; h.vine.scale.setScalar(0.05); ctx.tween(h.vine.scale, { x: 1, y: 1, z: 1 }, 2.2, 'out'); }
      ctx.audio.play('sparkle'); await ctx.wait(2.3);
      for (const h of hills) { pop(h.male, 1.25); ctx.audio.play('pop'); await ctx.wait(0.15); pop(h.fem, 0.95); pop(h.baby, 0.9); ctx.audio.play('pop'); await ctx.wait(0.15); }
      await f;
      // pollination: lead the bee from a tall blossom to a baby-pumpkin blossom
      bee.mode = 'follow'; ctx.audio.play('buzz'); say(farmer, 'Bees, please help! 🐝');
      let poll = 0;
      const askPollen = () => goalTo('🐝', 'Fetch yellow pollen', () => nearest(hills.filter(h => !h.used).map(h => [h.mx, h.mz])));
      askPollen();
      const sparkle = ctx.every(0.45, () => { for (const h of hills) if (!h.used && !bee.pollen) ctx.burst([h.mx, 1.1, h.mz], { color: 0xffe066, n: 2, speed: 0.5, size: 0.15, y: 0 }); if (bee.pollen) ctx.burst(beeObj.position, { color: 0xffe066, n: 2, speed: 0.4, size: 0.14, y: 0 }); });
      const stopPoll = ctx.onUpdate(() => {
        if (ctx.locked) return;
        if (!bee.pollen) { for (const h of hills) if (!h.used && dist(h.mx, h.mz) < 1.05) { h.used = true; bee.pollen = true; bee.dive = { x: h.mx, z: h.mz, t: 0.7 }; ctx.audio.play('buzz'); ctx.burst([h.mx, 1.0, h.mz], { color: 0xffe066, n: 12, speed: 1.5 }); goalTo('🌼', 'Dust a baby pumpkin', () => nearest(hills.filter(q => !q.done).map(q => [q.fx, q.fz]))); break; } }
        else { for (const h of hills) if (!h.done && dist(h.fx, h.fz) < 1.05) { h.done = true; bee.pollen = false; bee.dive = { x: h.fx, z: h.fz, t: 0.7 }; ctx.audio.play('buzz'); poll++; if (poll === 1) fact('🐝', 'Bees carry pollen from blossom to blossom. No bees, no pumpkins!');
          ctx.after(0.5, () => { ctx.audio.play('sparkle'); ctx.burst([h.fx, 0.6, h.fz], { color: 0xffe066, n: 10, speed: 1.5 }); ctx.emote(h.baby, '💚', { y: 0.9 }); ctx.tween(h.fem.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.6).then(() => { h.fem.visible = false; }); ctx.tween(h.baby.scale, { x: 1.3, y: 1.3, z: 1.3 }, 0.8, 'outBack'); });
          if (poll < 4) askPollen(); break; } }
      });
      await ctx.until(() => poll >= 4); stopPoll(); sparkle(); goal('🎃', 'Watch them swell'); done();
      await ctx.wait(0.9); bee.mode = 'hive';
      const f2 = ctx.focus([0, -5.6], 3.4, { dist: 14, pitch: 0.75 });
      for (const h of hills) { ctx.tween(h.male.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.8).then(() => { h.male.visible = false; }); ctx.tween(h.baby.scale, { x: 2.4 * h.s, y: 2.4 * h.s, z: 2.4 * h.s }, 2.6, 'inOut'); }
      ctx.audio.play('boing'); await f2;
      await ctx.chapter({ title: 'Autumn', emoji: '🍂', env: 'autumn', setup: () => {
        treesSpring.visible = false; autumnG.visible = true; crows.forEach(c => { c.o.visible = true; });
        for (const h of hills) { ctx.remove(h.baby); ctx.remove(h.male); ctx.remove(h.fem); const giant = h.s > 2; h.giant = giant;
          if (giant) { const R = 0.27 * h.s; const inner = M.pumpkin(h.s); inner.position.y = -R; const roll = group([inner], [0, R, 0]); h.roll = roll; h.R = R; h.pump = ctx.add(group([roll]), h.fx - 0.3, h.fz + 0.2); h.col = ctx.collideObj(h.pump, 0.75); }
          else h.pump = ctx.add(M.pumpkin(h.s), h.fx, h.fz); }
        farmer.position.set(7.2, 0, 1.9); farmer.rotation.y = -1.9;
      } });
      // harvest: snip and carry three, roll the giant one
      say(farmer, 'Harvest time! Fill the wagon 🎃');
      let loaded = 0, cur = null; const WAG = [11, -1.4], slots = [[-0.6, 0.95, -0.4], [0.6, 0.95, -0.4], [0, 0.95, -1.2]];
      const askPick = () => goalTo('🎃', loaded ? 'Load ' + (4 - loaded) + ' more' : 'Load 4 pumpkins', () => cur ? WAG : nearest(hills.filter(h => !h.loaded).map(h => [h.pump.position.x, h.pump.position.z])));
      askPick();
      for (const h of hills) {
        if (!h.giant) ctx.interact({ at: h.pump, r: 1.9, y: 1.3, icon: '✂️', label: 'Snip', hold: 0.5, sfx: 'snip', when: () => !cur, onUse: () => { cur = h; ctx.burst(h.pump.position, { color: 0x4f8f3a, n: 6, y: 0.5 }); carry(h.pump, 0.22 - 0.575 * h.s, 0.375 * h.s - 0.26); } });
        else ctx.interact({ at: h.pump, r: 2.3, y: 2.0, icon: '💪', label: 'Push', when: () => !cur, onUse: () => { cur = h; h.col.remove(); PL.userData.carrying = true; say(farmer, 'Whoa, a giant! Roll it! 😄', 2.5); } });   // both arms forward: hands on the pumpkin while pushing
      }
      let lastX = PP.x, lastZ = PP.z;
      const stopRoll = ctx.onUpdate(() => { const mv = Math.hypot(PP.x - lastX, PP.z - lastZ); lastX = PP.x; lastZ = PP.z; if (cur && cur.giant && !cur.loaded) { const a = PL.rotation.y; cur.pump.position.set(PP.x + Math.sin(a) * 1.15, 0, PP.z + Math.cos(a) * 1.15); cur.pump.rotation.y = a; cur.roll.rotation.x += mv / cur.R; } });
      const loadIt = ctx.interact({ at: WAG, r: 3.5, y: 2.3, icon: '🎃', label: 'Load', once: false, when: () => !!cur && !cur.loaded, onUse: async () => {
        const h = cur; const o = h.giant ? h.pump : ctx.drop(); if (h.giant) PL.userData.carrying = false; if (!h.giant) { ctx.scene.add(o); o.position.set(PP.x, 1.2, PP.z); }
        const to = h.giant ? [0, 0.95, -2.55] : slots[hills.filter(q => q.loaded && !q.giant).length] || slots[2];
        h.loaded = true; rig.attach(o); o.rotation.set(0, 0, 0); if (h.giant) h.roll.rotation.x = 0;
        await hop(o, to, h.giant ? 1.2 : 0.7, 0.5); ctx.audio.play(h.giant ? 'boing' : 'thud'); if (h.giant) ctx.cam.shake = 0.25; ctx.burst([WAG[0], 1.4, WAG[1]], { color: 0xe8781e, n: 6 });
        loaded++; cur = null; if (loaded < 4) askPick();
      } });
      await ctx.until(() => loaded >= 4); stopRoll(); loadIt.remove(); done();
      ctx.thank('🎃', ['Pumpkin growers', 'Beekeepers', 'Pickers']);
      say(farmer, 'Off to the cannery! 🚜');
      goal('🚜', 'Hop on', [11, -5.4]);
      await use({ at: [11, -5.4], icon: '🚜', label: 'Hop on', y: 2.9, r: 3.4 });
      ctx.lock(); PL.visible = false; ctx.audio.play('honk'); ctx.bounds(null); const eng = ctx.every(0.45, () => ctx.audio.play('engine')); ctx.moveAlong(rig, [[11, -48]], 8); await ctx.wait(1.7); eng();
    }

    // ---------- 2 · the cannery ----------
    async function chCannery() {
      await ctx.chapter({ n: 2, title: 'The Cannery', emoji: '🥫', env: ['factory', { ground: 0x9a958a, fog: [40, 90] }], at: [X2 - 6, 0.5], face: Math.PI, music: 'factory', cam: { yaw: 0, pitch: 0.38, dist: 10.5 }, setup: () => showZone(2) });
      zone = 2; PL.visible = true; ctx.unlock(); ctx.bounds(X2 - 14, -12, X2 + 14, 4.6);
      say(wk1, 'Pie pumpkins! Tip them in 🎃');
      goal('🎃', 'Tip the pumpkins', lever2);
      await use({ at: lever2, icon: '🎃', label: 'Pull', y: 1.9 });
      ctx.lock(); ctx.tween(stick2.rotation, { z: -0.6 }, 0.3); ctx.audio.play('machine');
      fact('🍂', 'Pumpkins are canned at harvest time — enough for the whole year.');
      const f = ctx.focus([X2 - 8.5, 2, BZ], 4.6, { dist: 11, pitch: 0.4 });
      for (const p of binPumpkins) { ctx.moveAlong(p, [[X2 - 11.3, 2.5, BZ], [X2 - 10, 3.6, BZ], [X2 - 10, 2.8, BZ]], 5, { face: false }).then(() => { ctx.burst([X2 - 10, 2.9, BZ], { color: 0xe8781e, n: 12, speed: 2.5, size: 0.26 }); ctx.audio.play('thud'); ctx.remove(p); }); await ctx.wait(0.45); }
      const steam = ctx.every(0.3, () => { if (zone === 2) ctx.burst([X2 - 5.5 + (Math.random() - 0.5), 4.9, -10], { color: 0xffffff, n: 2, speed: 0.4, size: 0.4, y: 0 }); }); const bub = ctx.every(0.6, () => ctx.audio.play('bubble'));
      await f; ctx.unlock(); bub();
      say(wk1, 'Cooked soft and smooth. Fill the cans! 🥫');
      // fill 3 cans: press the red button when a can is under the spout (a miss jams the button for a moment) …
      let filled = 0, packed = 0, belt = 1.5, spawnT = 0, coolUntil = 0, sealing = false; const cans = [], queue = [], GATE = X2 + 3.3;
      goal('🥫', 'Fill 3 cans', button);
      const kick = (c) => { c.gone = true; const o = c.o; ctx.audio.play('clink'); hop(o, [o.position.x + 0.4, 0.1, BZ + 1.5], 0.4, 0.4).then(() => ctx.remove(o)); };
      const stopBelt = ctx.onUpdate((dt) => {
        spawnT -= dt * belt; if (spawnT <= 0 && filled < 3) { spawnT = 2.1; const o = ctx.add(canModel(0), X2 - 7.4, BZ); o.position.y = BY; cans.push({ o, st: 0 }); ctx.audio.play('clink'); }
        for (let i = cans.length - 1; i >= 0; i--) { const c = cans[i]; if (c.gone || c.held) continue; c.o.position.x += dt * belt;
          const stopX = GATE - queue.indexOf(c) * 0.6;
          if (c.st === 1 && c.o.position.x >= stopX) { c.held = true; c.o.position.x = stopX; }                              // filled cans queue up at the lid press
          else if (c.st === 0 && c.o.position.x > GATE - queue.length * 0.6 - 0.7 && (queue.length || filled >= 3)) kick(c);   // empties are kicked off the belt
          else if (c.o.position.x > X2 + 9.1) { if (c.st === 2) { c.gone = true; hop(c.o, [X2 + 10.05 + packed * 0.33, 0.66, BZ + 0.1], 0.5, 0.4).then(() => { ctx.audio.play('clink'); }); packed++; } else kick(c); }
        }
      });
      const fillIt = ctx.interact({ at: [X2 - 1, -3.9], face: button, r: 2.2, y: 1.9, icon: '🔴', label: 'Fill!', once: false, sfx: 'click', when: () => filled < 3 && ctx.time >= coolUntil, onUse: () => {
        const c = cans.find(q => q.st === 0 && !q.gone && Math.abs(q.o.position.x - (X2 - 1)) < 0.6);
        const jet = ctx.add(cyl(0.09, 0.07, 0.75, 0xe8781e, [X2 - 1, 1.75, BZ], null, 6)); ctx.after(0.22, () => ctx.remove(jet)); ctx.audio.play('pour');
        if (c) { ctx.tween(button.position, { y: 0.93 }, 0.06).then(() => ctx.tween(button.position, { y: 1.0 }, 0.15)); c.st = 1; queue.push(c); const p = c.o.position.clone(); ctx.remove(c.o); c.o = ctx.add(canModel(1)); c.o.position.copy(p); filled++; ctx.emote(c.o, '🎃', { y: 0.8 }); ctx.audio.play('ding'); if (filled < 3) ctx.goal('🥫', 'Fill ' + (3 - filled) + ' more', button); else { goal('🔨', 'Lids on!', button2); belt = 3.2; fact('🔥', 'Sealed cans are heated to kill germs, so the food keeps.'); } }
        else { coolUntil = ctx.time + 0.9; button.position.y = 0.9; ctx.after(0.9, () => { ctx.tween(button.position, { y: 1.0 }, 0.12); ctx.audio.play('click'); }); ctx.burst([X2 - 1, BY + 0.1, BZ], { color: 0xe8781e, n: 10, speed: 2 }); ctx.audio.play('splash'); ctx.emote(button, '💦', { y: 1.0 }); wk1.userData.forceAnim = 'laugh'; ctx.after(0.9, () => { wk1.userData.forceAnim = null; }); }
      } });
      // … then stamp a lid on each one at the blue button
      const sealIt = ctx.interact({ at: [X2 + 4.5, -3.9], face: button2, r: 2.2, y: 1.9, icon: '🔵', label: 'Stamp!', once: false, sfx: 'click', when: () => filled >= 3 && !sealing && queue.length > 0 && queue[0].held, onUse: async () => {
        sealing = true; ctx.tween(button2.position, { y: 0.93 }, 0.06).then(() => ctx.tween(button2.position, { y: 1.0 }, 0.15)); const c = queue.shift();
        await ctx.tween(c.o.position, { x: X2 + 4.5 }, 0.25); ctx.tween(press.position, { y: 1.5 }, 0.08).then(() => ctx.tween(press.position, { y: 2.0 }, 0.25)); await ctx.wait(0.08);
        const p = c.o.position.clone(); ctx.remove(c.o); c.o = ctx.add(canModel(2)); c.o.position.copy(p); c.st = 2; c.held = false; ctx.audio.play('thud'); ctx.cam.shake = 0.05; ctx.burst(p, { color: 0xffd84a, n: 8, y: 0.5 });
        queue.forEach((q, i) => { if (q.held) ctx.tween(q.o.position, { x: GATE - i * 0.6 }, 0.25); });
        if (queue.length) ctx.goal('🔨', queue.length + ' more', button2); else goal('🥫', 'Into the crate!');
        await ctx.wait(0.3); sealing = false;
      } });
      await ctx.until(() => packed >= 3); await ctx.wait(0.6); stopBelt(); fillIt.remove(); sealIt.remove(); done(); wk1.userData.forceAnim = 'clap'; ctx.after(1.8, () => { wk1.userData.forceAnim = null; });
      ctx.thank('🥫', ['Cannery workers', 'Can makers', 'Machine mechanics']);
      await ctx.wait(2.2); steam(); for (const c of cans) if (!c.gone || c.st === 2) ctx.remove(c.o);
    }

    // ---------- 3 · wheat and flour ----------
    async function chWheat() {
      ctx.bounds(null);
      await ctx.chapter({ n: 3, title: 'Wheat for the Crust', emoji: '🌾', env: 'day', at: [X3 - 9.5, 6.2], face: Math.PI, music: 'farm', cam: { yaw: 0, pitch: 0.5, dist: 10 }, setup: () => showZone(3) });
      zone = 3; ctx.bounds(X3 - 18, -1.2, X3 + 12, 7.5);
      say(wFarmer, 'Golden and ready. You drive! 🌾');
      goal('🚜', 'Drive the combine', comb);
      await use({ at: comb, icon: '🚜', label: 'Drive', y: 3.6, r: 4.2 });
      fact('🚜', 'A combine cuts wheat and shakes out the grain, all at once.');
      combCol.remove(); PL.visible = false; ctx.tp(comb.position.x, comb.position.z, Math.PI / 2); const sp0 = ctx.speed; ctx.speed = 5.4; ctx.cam.dist = 15; ctx.cam.pitch = 0.62; ctx.bounds(X3 - 13.8, -15.6, X3 + 10.4, 3);
      const total = cells.length, NEED = Math.floor(total * 0.86);
      goalTo('🌾', 'Cut the wheat', () => { let b = null, bd = 1e9; for (let k = 0; k < total; k++) { const c = cells[k]; if (c.cut) continue; let d = dist(c.x, c.z); if (d < 3.2) d += 40; if (d < bd) { bd = d; b = c; } } return b ? [b.x, b.z] : null; });
      let chaffT = 0, engT = 0, lx = PP.x, lz = PP.z;
      const stopDrive = ctx.onUpdate((dt) => {
        ctx._stepT = 9;   // no footstep sounds while we are the combine (engine field; harmless if it is renamed)
        comb.position.x = PP.x; comb.position.z = PP.z; comb.rotation.y = PL.rotation.y; const mv = Math.hypot(PP.x - lx, PP.z - lz); lx = PP.x; lz = PP.z;
        comb.userData.reel.rotation.x += dt * (2 + mv / Math.max(dt, 0.001) * 1.2);
        const s = Math.sin(comb.rotation.y), c = Math.cos(comb.rotation.y), hx = PP.x + s * 3.5, hz = PP.z + c * 3.5; let any = false;
        for (let k = 0; k < total; k++) { const q = cells[k]; if (q.cut) continue; const dx = q.x - hx, dz = q.z - hz, al = dx * s + dz * c, la = dx * c - dz * s; if ((Math.abs(al) < 0.8 && Math.abs(la) < 2.6) || dx * dx + dz * dz < 7.3) { cutCell(k); any = true; } }
        chaffT -= dt; if (any && chaffT <= 0) { chaffT = 0.12; ctx.burst([PP.x - s * 2.6, 1.6, PP.z - c * 2.6], { color: 0xf2d060, n: 5, speed: 1.6, size: 0.2 }); }
        engT -= dt; if (mv > 0.01 && engT <= 0) { engT = 0.45; ctx.audio.play('engine'); }
      });
      await ctx.until(() => cutN >= NEED);
      ctx.lock(); stopDrive(); goal('🌾', 'Unload the grain'); ctx.audio.play('success');
      for (let k = 0; k < total; k++) if (!cells[k].cut) { if (k % 23 === 0) ctx.burst([cells[k].x, 0.5, cells[k].z], { color: 0xf2d060, n: 6, size: 0.2 }); cutCell(k); }
      ctx.cam.target = { at: comb, dist: 17, pitch: 0.6 };
      const eng = ctx.every(0.45, () => ctx.audio.play('engine'));
      await ctx.moveAlong(comb, [[X3 + 10.2, 1.2], [X3 + 10.95, -2.4]], 7); await ctx.tween(comb.rotation, { y: Math.PI }, 0.4); eng();
      // grain pours from the auger into the cart
      cartGrain.visible = true; cartGrain.scale.y = 0.05; ctx.tween(cartGrain.scale, { y: 0.4 }, 2.4, 'linear');
      const pour = ctx.every(0.07, () => ctx.burst([X3 + 15.3, 3.3, -1.6 - 0.0], { color: 0xe8c25a, n: 3, speed: 0.5, size: 0.2, y: 0 })); const ps = ctx.every(0.4, () => ctx.audio.play('pour'));
      ctx.cam.target = { at: [X3 + 14, 1.5, -2], dist: 13, pitch: 0.45 };
      await ctx.wait(2.6); pour(); ps(); done();
      ctx.cam.target = null; ctx.cam.dist = 10; ctx.cam.pitch = 0.5; ctx.speed = sp0; ctx.tp(X3 + 13.2, 1.6, Math.PI / 2); PL.visible = true; ctx.collideBox(X3 + 10.95, -2.4, 5.5, 6.5); ctx.bounds(X3 - 18, -1.0, X3 + 24.5, 7.5); ctx.unlock();
      // carry a sack of grain to the mill, pour it into the hopper
      say(miller, 'Bring the grain to my mill! 👋');
      goal('🌾', 'Fill a grain sack', [X3 + 15.6, -1.5]);
      await use({ at: [X3 + 15.6, -1.5], face: [X3 + 15.6, -3.3], icon: '🌾', label: 'Scoop', hold: 0.8, sfx: 'pour', y: 2.2, r: 2.4 });
      const gs = group([P.sack({ color: 0xd9b36a }), sign('🌾', 0.32, { bg: null }, [0, 0.42, 0.27])]); gs.scale.setScalar(0.8); ctx.add(gs); carry(gs, -0.52, -0.04);
      goal('🌾', 'Pour into the mill', [X3 + 19.5, 0.7]);
      await use({ at: [X3 + 19.5, 0.7], face: [X3 + 19.5, -1.6], icon: '🌾', label: 'Pour', hold: 1.0, sfx: 'pour', y: 2.6, r: 2.4 });
      ctx.remove(ctx.drop()); goal('🌾', 'Grind the grain'); ctx.lock();
      fact('🌾', 'Flour is simply wheat seeds, crushed into a fine powder.');
      const f = ctx.focus([X3 + 19.6, 2.2, -3], 4.4, { dist: 12, pitch: 0.35 });
      const grainIn = ctx.every(0.08, () => ctx.burst([X3 + 19.5, 2.9, -1.6], { color: 0xe8c25a, n: 2, speed: 0.4, size: 0.18, y: 0 }));
      ctx.tween({ get v() { return millSpin; }, set v(x) { millSpin = x; stoneSpin = x * 2.2; } }, { v: 2.4 }, 1.2); const ms = ctx.every(0.5, () => ctx.audio.play('machine'));
      await ctx.wait(1.3); grainIn();
      const dust = ctx.every(0.12, () => ctx.burst([X3 + 21.5, 0.8, -0.1], { color: 0xffffff, n: 3, speed: 0.7, size: 0.22, y: 0 }));
      flourSack.visible = true; flourSack.scale.set(0.8, 0.08, 0.8); ctx.tween(flourSack.scale, { y: 0.8 }, 2.2, 'out');
      say(miller, 'Round go the stones. Flour! 🌾', 2.6);
      await f; dust(); ms(); ctx.tween({ get v() { return millSpin; }, set v(x) { millSpin = x; stoneSpin = Math.max(0, x - 0.25) * 2.2; } }, { v: 0.25 }, 1.5); ctx.unlock(); ctx.emote(flourSack, '✨', { y: 1.2 }); done();
      ctx.thank('🌾', ['Wheat farmers', 'Combine drivers', 'Millers']);
      goal('🌾', 'Take the flour', flourSack);
      await use({ at: flourSack, icon: '💪', label: 'Lift', y: 1.3, r: 2.4 });
      carry(flourSack, -0.52, -0.04); goal('🌾', 'Take the flour'); say(miller, 'Perfect for pie crust! 🥧', 2);   // (the beacon leaves the sack once it is in your arms)
      await ctx.wait(2.1);   // let the miller finish before the scene changes (his bubble used to hang over the barnyard)
    }

    // ---------- 4 · eggs, milk and butter ----------
    async function chBarnyard() {
      ctx.bounds(null); const fs = ctx.drop(); if (fs) ctx.remove(fs);
      await ctx.chapter({ n: 4, title: 'The Barnyard', emoji: '🐔', env: ['dawn', { ground: 0x8fc46a }], at: [X4 + 1, 3.6], face: Math.PI, music: 'farm', cam: { yaw: 0, pitch: 0.5, dist: 10 }, setup: () => showZone(4) });
      zone = 4; ctx.bounds(X4 - 13, -10.3, X4 + 13.5, 7);
      say(dFarmer, 'The hens hid six eggs! 🥚');
      goal('🥚', 'Take the basket', basket);
      await use({ at: basket, icon: '🥚', label: 'Take', y: 1.0, r: 2.2 });
      carry(basket, -0.47, 0.1);   // held by its handle
      const eggs = nests.map(([x, z]) => { const e = ctx.add(ball(0.15, 0.2, 0.15, 0xfff6e0, [X4 + x, 0.34, z], null, 7)); return e; });
      let got = 0; goalTo('🥚', 'Find 6 eggs', () => nearest(eggs.filter(e => e.parent).map(e => [e.position.x, e.position.z])));
      ctx.audio.play('cluck');
      await ctx.collect({ items: eggs, r: 1.15, spin: false, color: 0xfff6e0, onEach: (o, left) => { got++; if (got === 1) fact('🐔', 'A good laying hen lays an egg almost every day.'); ctx.emote(PL, '🥚', { y: 2.0 }); basket.add(ball(0.1, 0.13, 0.1, got % 2 ? 0xfff6e0 : 0xe8c9a0, [Math.cos(got * 1.05) * 0.13, 0.16 + (got > 3 ? 0.07 : 0), Math.sin(got * 1.05) * 0.13], null, 6)); if (left) ctx.goal('🥚', left === 1 ? '1 more egg' : left + ' more eggs', guide); } });
      done(); goal('🥚', 'Set them down', [X4 - 0.6, -4.3]);
      await use({ at: [X4 - 0.6, -4.3], face: [X4 - 0.6, -5.2], icon: '🥚', label: 'Set down', y: 1.9, r: 2.3 });
      const b = ctx.drop(); bake(b); ctx.add(b, X4 - 1.1, -5.2); b.position.y = 0.73; ctx.audio.play('drop');
      // milk the cow
      say(dFarmer, 'Now Daisy needs milking 🐄'); cowMoo = 1.2; ctx.audio.play('moo');
      goal('🥛', 'Milk the cow', pail);
      await use({ at: pail, icon: '🥛', label: 'Milk', sfx: 'water', y: 1.5, r: 2.2 });
      // the milking game: squeeze with one hand, then the other — every squirt fills the real pail a little more
      PL.userData.forceAnim = 'work'; pailMilk.visible = true; say(dFarmer, 'One hand, then the other! 👐', 2.6);
      await milkGame(ctx, { n: 12, onSquirt: (i, n) => { ctx.burst([X4 + 7.65, 0.6, -4.75], { color: 0xffffff, n: 4, speed: 0.6, size: 0.14, y: 0 }); pailMilk.position.y = 0.05 + 0.33 * i / n; pailMilk.scale.set(1 + 0.22 * i / n, 1, 1 + 0.22 * i / n); } });
      PL.userData.forceAnim = null; cowMoo = 1.4; say(dFarmer, 'Left, right — a steady rhythm! 🐄', 2.6); ctx.audio.play('moo'); ctx.emote(cowObj, '💛', { y: 2.0 }); done();
      carry(pail, -0.18, 0.06);
      goal('🥛', 'Pour into the churn', churn);
      await use({ at: churn, icon: '🥛', label: 'Pour', y: 1.9, r: 2.3 });
      const pl = ctx.drop(); pailMilk.visible = false; const pAt = [[X4 + 2.5, -4.9], [X4 + 1.6, -5.65], [X4 + 0.85, -3.85]].sort((a, b) => dist(b[0], b[1]) - dist(a[0], a[1]))[0];   // the empty pail goes down beside the churn, away from your feet
      ctx.add(pl, pAt[0], pAt[1]); pl.position.y = 0; ctx.collideCircle(pAt[0], pAt[1], 0.3); ctx.audio.play('pour'); ctx.burst([X4 + 1.6, 1.0, -4.6], { color: 0xffffff, n: 8, speed: 1 });
      goal('🥛', 'Cream rises…'); say(dFarmer, 'Cream floats up. We churn that! 🥛', 2.4); for (let i = 0; i < 3; i++) { ctx.emote(churn, '⬆️', { y: 1.3 }); ctx.audio.play('bubble'); await ctx.wait(0.6); }
      say(dFarmer, 'Up and down! Churn, churn! 💪');
      let ch = 0; const N = 6; goal('💪', 'Churn the cream', churn);
      const chIt = ctx.interact({ at: churn, r: 2.3, y: 2.1, icon: '💪', label: 'Churn!', once: false, sfx: 'thud', onUse: () => { ch++; ctx.tween(dasher.position, { y: 0.03 }, 0.09).then(() => ctx.tween(dasher.position, { y: 0.25 }, 0.16)); ctx.burst([X4 + 1.6, 0.85, -4.6], { color: 0xfff2b0, n: 3, speed: 0.8, size: 0.14 }); ctx.act('work', 0.2); if (ch < N) ctx.goal('💪', (N - ch) + ' more!', churn); } });
      await ctx.until(() => ch >= N); chIt.remove(); goal('✨', 'Butter!');
      butter.position.set(X4 + 1.6, 1.0, -4.6); pop(butter, 1); await hop(butter, [X4 - 0.1, 0.73, -5.2], 0.9, 0.6); ctx.audio.play('success'); ctx.emote(butter, '✨', { y: 0.7 }); done();
      fact('🥛', 'Churn cream long enough and it turns into butter!');
      await ctx.wait(1.2);
      ctx.thank('🥛', ['Dairy farmers', 'Egg farmers', 'Butter makers']);
      await ctx.wait(3.4);
    }

    // ---------- 5 · the spice island ----------
    async function chSpice() {
      ctx.bounds(null);
      await ctx.chapter({ n: 5, title: 'Spice Island', emoji: '🌴', env: ['sea', { ground: 0x2f8fd0, fog: [60, 170] }], at: [X5 - 1, 1.4], face: Math.PI, music: 'travel', cam: { yaw: 0, pitch: 0.42, dist: 10.5 }, setup: () => showZone(5) });
      zone = 5; ctx.bounds(X5 - 13.5, -26, X5 + 15, 6.5);
      say(grower, 'Spices grow where it is warm! 🌴');
      let got = 0; const left = new Map();
      const sackIn = async (id, from) => { const s = SACKS.find(q => q.id === id).o; const to = [s.position.x, s.position.y, s.position.z]; s.position.set(from[0], from[1], from[2]); s.visible = true; s.scale.setScalar(0.3); ctx.tween(s.scale, { x: 0.8, y: 0.8, z: 0.8 }, 0.7); await hop(s, to, 2.2, 0.8); ctx.audio.play('thud'); got++; spiceBusy = false; if (got < 5) ctx.goal('🌴', 'Gather ' + (5 - got) + ' more', guide); };
      // each spice has its real-world line: a toast when there is room for one, otherwise the grower says it
      const tell = (icon, text, short) => { if (factOK()) fact(icon, text); else say(grower, short + ' ' + icon, 2.6); };
      let spiceBusy = false, lastSpot = [X5 + 5.6, -1.0];
      const ask = (id, o, fn) => { left.set(id, [o.at[0], o.at.length > 2 ? o.at[2] : o.at[1]]); ctx.interact(Object.assign(o, { when: () => !spiceBusy, onUse: () => { spiceBusy = true; lastSpot = left.get(id); left.delete(id); return fn(); } })); };
      goalTo('🌴', 'Gather 5 spices', () => left.size ? nearest([...left.values()]) : lastSpot);
      // cinnamon: peel a strip of bark
      ask('cin', { at: [X5 + cinX, cinZ + 1.0], face: [X5 + cinX, cinZ], r: 2.0, y: 2.2, icon: '🌳', label: 'Peel', hold: 1.0, sfx: 'saw' }, async () => {
        ctx.tween(bark.scale, { x: 0.5, z: 3 }, 0.4); await hop(bark, [X5 + cinX + 0.2, 0.9, cinZ + 1.3], 0.6, 0.5); ctx.remove(bark);
        const quill = ctx.add(bake(group([cyl(0.09, 0.09, 0.9, 0xb5651d, [0, 0, 0], [0, 0, Math.PI / 2], 7), cyl(0.09, 0.09, 0.9, 0xc9752a, [0, 0.02, 0.15], [0, 0, Math.PI / 2], 7)])), X5 + cinX + 0.2, cinZ + 1.3); quill.position.y = 0.9; pop(quill, 1.2);
        tell('🌳', 'Cinnamon is the dried inner bark of a tree!', 'Cinnamon is dried tree bark!'); await ctx.wait(1.2); ctx.remove(quill); sackIn('cin', [X5 + cinX + 0.2, 0.9, cinZ + 1.3]);
      });
      // nutmeg: a fruit drops and splits, the seed is inside
      ask('nut', { at: [X5 + nutX + 0.9, nutZ + 1.5], face: nutFruit, r: 2.0, y: 2.2, icon: '🌰', label: 'Pick' }, async () => {
        await ctx.tween(nutFruit.position, { y: 0.5 }, 0.45, 'in'); ctx.audio.play('thud'); const p = nutFruit.position; ctx.burst(p, { color: 0xf2d04a, n: 8, y: 0 });
        const halfA = ctx.add(ball(0.2, 0.2, 0.1, 0xf2d04a, [p.x - 0.05, 0.5, p.z])), halfB = ctx.add(ball(0.2, 0.2, 0.1, 0xf2d04a, [p.x + 0.05, 0.5, p.z])); ctx.remove(nutFruit);
        const seed = ctx.add(bake(group([ball(0.1, 0.13, 0.1, 0x7a4a2a, [0, 0, 0]), torus(0.1, 0.02, 0xd9483b, [0, 0, 0], [0.4, 0, 0], 8)])), p.x, p.z); seed.position.y = 0.5;
        ctx.tween(halfA.position, { x: p.x - 0.45 }, 0.4); ctx.tween(halfB.position, { x: p.x + 0.45 }, 0.4); ctx.tween(seed.scale, { x: 1.8, y: 1.8, z: 1.8 }, 0.4); await ctx.tween(seed.position, { y: 1.3 }, 0.5, 'out');
        tell('🌰', 'Nutmeg is a seed hiding inside a fruit.', 'Nutmeg: a seed inside a fruit!'); await ctx.wait(1.2); ctx.remove(halfA); ctx.remove(halfB); const sp = [seed.position.x, 1.3, seed.position.z]; ctx.remove(seed); sackIn('nut', sp);
      });
      // ginger: dig up the knobbly root
      ask('gin', { at: [X5 + ginX - 0.38, ginZ + 1.35], face: [X5 + ginX - 0.38, ginZ + 0.4], r: 1.9, y: 1.6, icon: '⛏️', label: 'Dig', hold: 0.9, sfx: 'dig' }, async () => {
        await ctx.act('dig', 0.7); ctx.audio.play('dig'); const gx = X5 + ginX - 0.38, gz = ginZ + 0.4; ctx.burst([gx, 0.3, gz], { color: 0x6b4a2f, n: 12 }); ctx.remove(gingerTop);
        const root = ctx.add(bake(group([ball(0.2, 0.1, 0.11, 0xd9b36a, [0, 0, 0]), ball(0.12, 0.08, 0.09, 0xd9b36a, [0.2, 0.06, 0.02], [0, 0, 0.6]), ball(0.1, 0.07, 0.08, 0xcfa55a, [-0.18, 0.07, 0], [0, 0, -0.7]), ball(0.08, 0.06, 0.07, 0xd9b36a, [0.05, 0.1, 0.06])])), gx, gz); root.position.y = 0.3; root.scale.setScalar(1.6);
        await ctx.tween(root.position, { y: 1.3 }, 0.5, 'outBack'); tell('🌱', 'Ginger is a knobbly root that grows underground.', 'Ginger is a knobbly root!'); await ctx.wait(1.2); ctx.remove(root); sackIn('gin', [gx, 1.3, gz]);
      });
      // cloves: pink flower buds, dried until brown
      ask('clo', { at: [X5 + cloX, cloZ + 1.5], face: [X5 + cloX, cloZ], r: 2.0, y: 2.2, icon: '🌸', label: 'Pick buds' }, async () => {
        const buds = []; for (let i = 0; i < 5; i++) { const bm = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), new THREE.MeshLambertMaterial({ color: 0xf28aa8, flatShading: true })); bm.position.set(X5 + cloX + Math.cos(i * 1.3) * 0.8, 1.5 + (i % 3) * 0.4, cloZ + 0.7); ctx.add(bm); buds.push(bm); hop(bm, [X5 + cloX - 0.4 + i * 0.2, 0.25, cloZ + 1.9], 0.5, 0.5); ctx.audio.play('pop'); await ctx.wait(0.1); }
        await ctx.wait(0.5); const brown = new THREE.Color(0x4a2a22); ctx.emote(buds[2], '☀️', { y: 0.8 }); for (const bm of buds) ctx.tween(bm.material.color, { r: brown.r, g: brown.g, b: brown.b }, 0.9);
        tell('🌸', 'Cloves are flower buds, dried in the sun.', 'Cloves are dried flower buds!'); await ctx.wait(1.4); buds.forEach(bm => ctx.remove(bm)); sackIn('clo', [X5 + cloX, 0.3, cloZ + 1.9]);
      });
      // sugar cane
      ask('sug', { at: [X5 + canX - 0.6, canZ + 1.2], face: cane, r: 2.0, y: 2.4, icon: '🔪', label: 'Cut cane', hold: 0.8, sfx: 'snip' }, async () => {
        ctx.audio.play('snip'); await ctx.tween(cane.rotation, { z: 1.45 }, 0.6, 'in'); ctx.audio.play('thud'); ctx.burst([X5 + canX - 1.8, 0.3, canZ + 0.2], { color: 0xb7c45a, n: 8 }); say(grower, 'Sweet cane juice becomes sugar! 🍬', 2.6);
        await ctx.wait(0.9); ctx.remove(cane); sackIn('sug', [X5 + canX - 1.6, 0.4, canZ + 0.2]);
      });
      await ctx.until(() => got >= 5); done();
      ctx.thank('🌴', ['Spice growers', 'Sugar-cane cutters', 'Spice dryers']);
      // carry a sack aboard
      say(grower, 'The ship is waiting! ⚓', 3); ctx.audio.play('horn'); sailor.userData.anim = 'wave';
      goal('💪', 'Lift a sack', [X5 + 5.6, -2.6]);
      await use({ at: [X5 + 5.6, -2.6], face: [X5 + 5.6, -2.6], icon: '💪', label: 'Lift', y: 1.9, r: 2.7 });
      const mine = SACKS[1].o; mine.scale.setScalar(0.8); carry(mine, -0.52, -0.04); pierOpen = true; ctx.audio.play('drop'); ctx.tween(rope.position, { y: 0.12 }, 0.4, 'outBounce'); ctx.tween(rope.rotation, { z: 0.0 }, 0.4);
      goalTo('🚢', 'Carry it aboard', () => PP.z > -13.5 && Math.abs(PP.x - X5 - PIER) > 0.9 ? [X5 + PIER, -12.4] : [X5 + PIER - 1.6, SHIPZ]);
      await use({ at: [X5 + PIER - 1.6, SHIPZ], icon: '📦', label: 'Stow', y: 2.6, r: 1.6 });
      const stow = (o, i) => { shipG.attach(o); o.rotation.set(0, 0, 0); return [-2.6 + (i % 3) * 0.55, DECK, -1.3 + Math.floor(i / 3) * 0.55]; };
      const sk = ctx.drop(); ctx.scene.add(sk); sk.position.set(PP.x, DECK + 1, PP.z - 0.5); await hop(sk, stow(sk, 0), 0.3, 0.3); ctx.audio.play('thud');
      // the catching game: the dock crew tosses the other four sacks up to you on the deck — each one you catch lands on the real deck
      sailor.userData.anim = 'idle'; say(sailor, 'Catch the rest, mate! 📦', 2.5, { y: 2.2 }); goal('📦', 'Catch the sacks');
      const rest = SACKS.filter(s => s.o !== mine);
      await catchGame(ctx, { n: 4, onCatch: (i) => { const s = rest[i].o; s.position.set(X5 + PIER, 1.2, -13.4); hop(s, stow(s, i + 1), 1.8, 0.7); } });
      fact('🚢', 'Most spices cross an ocean by ship — a trip of many days.');
      say(sailor, 'Thanks, mate! Back to shore 👋', 2.5, { y: 2.2 });
      goal('🏝️', 'Back to shore', [X5 + PIER, -11.5]);
      await ctx.until(() => PP.z > -13); done();
      // the ship sails
      ctx.lock(); shipGone = true; goal('🚢', 'Bon voyage!'); ctx.tween(plank.position, { y: -1.2 }, 0.6); ctx.audio.play('horn'); shipG.attach(sailor); sailor.userData.anim = 'wave';
      ctx.cam.target = { at: shipG, dist: 24, pitch: 0.3 };
      const smoke = ctx.every(0.25, () => ctx.burst([shipG.position.x - 7, 7.2, SHIPZ], { color: 0xdddddd, n: 2, speed: 0.4, size: 0.6, y: 0 })); const ws = ctx.every(0.8, () => ctx.audio.play('wave'));
      PL.userData.forceAnim = 'wave';
      ctx.tween(shipG.position, { x: X5 + 55 }, 7, 'in'); await ctx.wait(1.4);
      ctx.thank('🚢', ['Sailors', 'Dock workers', 'Ship captains']);
      await ctx.wait(3.2); smoke(); ws(); PL.userData.forceAnim = null; ctx.cam.target = null; ctx.unlock();
    }

    // ---------- 6 · the home kitchen ----------
    async function chKitchen() {
      ctx.bounds(null); PL.position.y = 0;
      await ctx.chapter({ n: 6, title: 'Home Kitchen', emoji: '🏡', env: ['indoor', { ground: 0xb98a5e, top: '#f3dfb8', bottom: '#f8ead0', fog: false }], at: [X6 + 1, -1.5], face: Math.PI, music: 'table', cam: { yaw: 0, pitch: 0.45, dist: 9 }, setup: () => showZone(6) });
      zone = 6; ctx.bounds(X6 - 7.3, -6.0, X6 + 7.3, 3.5);
      say(cook, 'Everything is here. Let us bake! 🥧');
      const spot = (x) => [X6 + x, CY, CZ + 0.1];
      // crust: flour + butter, roll it flat
      goal('🥧', 'Roll the crust', spot(-3.6)); await ctx.wait(0.8);
      ctx.lock(); await hop(flour, [X6 - 4.1, CY + 0.3, CZ - 0.1], 0.5, 0.4); ctx.tween(flour.rotation, { z: -1.2 }, 0.3); ctx.burst([X6 - 3.6, CY + 0.2, CZ], { color: 0xffffff, n: 14, speed: 1.2 }); ctx.audio.play('pour'); await ctx.wait(0.4);
      const b2 = ctx.add(box(0.3, 0.15, 0.18, 0xffdf5a, [X6 - 5.0, CY + 0.11, CZ + 0.2])); await hop(b2, [X6 - 3.6, CY + 0.1, CZ + 0.05], 0.6, 0.4); ctx.remove(b2); ctx.audio.play('pop'); ctx.tween(flour.rotation, { z: 0 }, 0.3); hop(flour, [X6 - 5.9, CY, CZ - 0.1], 0.4, 0.4);
      const dough = ctx.add(ball(0.3, 0.24, 0.3, 0xf0dcae, [X6 - 3.6, CY + 0.28, CZ + 0.05], null, 10)); ctx.unlock();
      const doughSize = (f) => { f = Math.max(0, Math.min(1.3, f)); dough.scale.set(0.85 + f * 0.95, Math.max(0.12, 1 - f * 0.85), 0.85 + f * 0.85); dough.position.y = CY + 0.06 + 0.24 * dough.scale.y; };   // rolled wider and thinner, its bottom on the pastry board
      doughSize(0);
      await use({ at: spot(-3.6), face: spot(-3.6), icon: '🥖', label: 'Roll', sfx: 'pop', y: 2 - CY, r: 2.3 });
      // the rolling game: hold to roll, let go when the dough fits the dish — the real dough and pin follow along on the counter
      rollPin.position.y = CY + 0.2; say(cook, 'Roll it as wide as the dish! 🥖', 2.8);
      let rolling = false, pinT = 0; const pinAnim = ctx.onUpdate((dt) => { if (rolling) { pinT += dt; rollPin.position.z = CZ + 0.05 + Math.sin(pinT * 7) * 0.3; } });
      await rollGame(ctx, { onSize: doughSize, onRoll: (on) => { rolling = on; PL.userData.forceAnim = on ? 'work' : null; if (on) ctx.audio.play('step'); } });
      pinAnim(); PL.userData.forceAnim = null; ctx.lock(); ctx.tween(rollPin.position, { y: CY, z: CZ + 0.42 }, 0.2);
      fact('🥧', 'Little bits of cold butter make a pie crust flaky.');
      await hop(dough, [PIE_AT[0], CY + 0.12, PIE_AT[2]], 0.7, 0.5); ctx.remove(dough); setPie(1); ctx.audio.play('pop'); ctx.burst(PIE_AT, { color: 0xffffff, n: 6, y: 0.2 }); ctx.unlock(); done();
      // filling: the things you gathered hop into the bowl one by one
      const GROUPS = [[0], [1, 2], [3, 4]]; let n = 0, busy = false; goal('🥣', 'Fill the bowl', spot(-0.4));
      const addIt = ctx.interact({ at: spot(-0.4), face: spot(-0.4), r: 2.3, y: 2 - CY, icon: '🥣', label: 'Add', once: false, when: () => !busy && n < 3, onUse: async () => {
        busy = true;
        await Promise.all(GROUPS[n].map(async (gi, k) => { const [emo, o, col] = INGR[gi]; const home = [o.position.x, o.position.y, o.position.z]; await ctx.wait(k * 0.45);
          await hop(o, [X6 - 0.4 + (k ? 0.14 : -0.06), CY + 0.75, CZ + 0.05], 0.5, 0.4); ctx.tween(o.rotation, { z: 1.9 }, 0.25); await ctx.wait(0.3);
          ctx.audio.play(gi === 1 ? 'pop' : gi === 4 ? 'sparkle' : 'pour'); ctx.emote(bowl, emo, { y: 1.0 + k * 0.35 }); ctx.burst([X6 - 0.4, CY + 0.4, CZ + 0.05], { color: col, n: 8, speed: 1 });
          bowlFill.visible = true; bowlFill.position.y = 0.08 + gi * 0.055; const r = 0.33 + gi * 0.04; bowlFill.scale.set(r / 0.3, 1, r / 0.3); bowlFill.material = mat(col);
          await ctx.wait(0.3); ctx.tween(o.rotation, { z: 0 }, 0.2); await hop(o, home, 0.4, 0.4); }));
        n++; if (n < 3) ctx.goal('🥣', 'Add ' + (3 - n) + ' more', spot(-0.4)); busy = false;
      } });
      await ctx.until(() => n >= 3 && !busy); addIt.remove();
      goal('🥣', 'Whisk it smooth', spot(-0.4));
      await use({ at: spot(-0.4), face: spot(-0.4), icon: '🥄', label: 'Whisk', hold: 1.4, sfx: 'bubble', y: 2 - CY, r: 2.3 });
      ctx.lock(); const whisk = ctx.add(bake(group([cyl(0.02, 0.02, 0.5, 0x999999, [0, 0.45, 0], null, 5), ball(0.09, 0.16, 0.09, 0xbbbbbb, [0, 0.14, 0], null, 6)])), X6 - 0.4, CZ + 0.05); whisk.position.y = CY + 0.25; whisk.rotation.z = 0.3;
      PL.userData.forceAnim = 'work'; const wsp = ctx.onUpdate((dt, t) => { whisk.position.x = X6 - 0.4 + Math.cos(t * 14) * 0.16; whisk.position.z = CZ + 0.05 + Math.sin(t * 14) * 0.16; }); const wsf = ctx.every(0.25, () => ctx.audio.play('bubble'));
      await ctx.wait(1.4); wsp(); wsf(); ctx.remove(whisk); PL.userData.forceAnim = null; bowlFill.material = mat(0xf09a3a);
      // pour into the crust
      await hop(bowl, [PIE_AT[0] + 0.5, CY + 0.7, PIE_AT[2]], 0.3, 0.4); await ctx.tween(bowl.rotation, { z: 1.3 }, 0.3); ctx.audio.play('pour');
      const pr = ctx.every(0.06, () => ctx.burst([PIE_AT[0] + 0.1, CY + 0.55, PIE_AT[2]], { color: 0xf09a3a, n: 2, speed: 0.3, size: 0.2, y: 0 })); await ctx.wait(0.8); pr(); setPie(2); bowlFill.visible = false;
      await ctx.tween(bowl.rotation, { z: 0 }, 0.2); await hop(bowl, [X6 - 0.4, CY, CZ + 0.05], 0.3, 0.4); ctx.unlock(); done();
      // bake
      goal('🔥', 'Carry to the oven', pie);
      await use({ at: pie, icon: '🥧', label: 'Pick up', y: 2 - CY, r: 2.3 });
      carryPie(); goal('🔥', 'Into the oven', [X6 + 4.75, CZ + 0.8]);
      await use({ at: [X6 + 4.75, CY, CZ + 0.6], face: [X6 + 4.75, CZ], icon: '🔥', label: 'Bake', y: 2 - CY, r: 2.4 });
      ctx.lock(); const raw = ctx.drop(); ctx.scene.add(raw); raw.position.set(X6 + 4.75, CY / 2, CZ + 1.2); pie = raw; await ctx.tween(raw.position, { z: CZ + 0.2, y: CY / 2 - 0.15 }, 0.4); raw.visible = false; ctx.audio.play('thud');
      goal('⏲️', 'Bake until set'); fact('🥚', 'Oven heat makes the eggs set — runny filling turns firm.'); const glowC = ovenGlass.material.color; const hot = new THREE.Color(0xff9a2a); ctx.tween(glowC, { r: hot.r, g: hot.g, b: hot.b }, 0.8);
      const fl = ctx.every(0.5, () => ctx.audio.play('fire')); const tick = ctx.every(0.5, () => ctx.audio.play('click')); const heat = ctx.every(0.3, () => ctx.burst([X6 + 4.75, CY + 0.2, CZ + 0.3], { color: 0xffffff, n: 1, speed: 0.2, size: 0.3, y: 0 }));
      const f = ctx.focus([X6 + 4.4, 1.4, CZ], 4.2, { dist: 6.5, pitch: 0.25 }); await ctx.tween(handG.rotation, { z: -Math.PI * 2 }, 3.8, 'linear'); fl(); tick(); heat(); ctx.audio.play('bell'); await f; ctx.emote(timer, '🔔', { y: 0.4 });
      const dark = new THREE.Color(0x6a3a1a); ctx.tween(glowC, { r: dark.r, g: dark.g, b: dark.b }, 0.8); setPie(3); pie.visible = false; ctx.unlock();
      goal('🥧', 'Take it out', [X6 + 4.75, CZ + 0.8]);
      await use({ at: [X6 + 4.75, CY, CZ + 0.6], face: [X6 + 4.75, CZ], icon: '🥧', label: 'Take out', y: 2 - CY, r: 2.4 });
      pie.visible = true; carryPie(); ctx.burst(PP, { color: 0xffffff, n: 8, speed: 0.6, size: 0.3, y: 1.4 }); say(kid, 'Mmm, that smells SO good! 😋', 2.5); done();
      // cool, then whipped cream
      goal('💨', 'Let it cool', [X6 - 2.4, -0.1]);
      await use({ at: [X6 - 2.4, TH, -0.3], face: [X6 - 2.4, -1.3], icon: '💨', label: 'Set down', y: 1.85 - TH, r: 2.2 });
      const bk = ctx.drop(); ctx.scene.add(bk); bk.position.set(X6 - 2.4, TH + 0.14, -1.3); pie = bk; ctx.audio.play('drop');
      const st = ctx.every(0.22, () => ctx.burst([X6 - 2.4 + (Math.random() - 0.5) * 0.5, TH + 0.4, -1.3], { color: 0xffffff, n: 1, speed: 0.15, size: 0.32, y: 0 })); ctx.lock(); ctx.audio.play('steam'); await ctx.wait(2.0); st(); ctx.unlock();
      goal('🍦', 'Add whipped cream', [X6 - 2.4, -0.1]);
      await use({ at: [X6 - 2.4, TH, -0.3], face: [X6 - 2.4, -1.3], icon: '🍦', label: 'Dollop', y: 1.95 - TH, r: 2.2 });
      const dl = ctx.add(ball(0.15, 0.12, 0.15, 0xffffff, [X6 - 2.4, TH + 1.3, -1.3], null, 8)); await ctx.tween(dl.position, { y: TH + 0.35 }, 0.35, 'in'); ctx.remove(dl); setPie(4); ctx.audio.play('boing'); pie.scale.set(1.15, 0.8, 1.15); ctx.tween(pie.scale, { x: 1, y: 1, z: 1 }, 0.5, 'outElastic'); ctx.burst(pie.position, { color: 0xffffff, n: 10, speed: 1.2, y: 0.3 }); done();
      cook.userData.forceAnim = 'clap'; kid.userData.forceAnim = 'cheer';   // applause from the cook, a hurray from the child
      ctx.thank('🥧', ['Truck drivers', 'Grocers', 'Bakers', 'Home cooks', 'Dish washers']); const thankT = ctx.time;
      await ctx.wait(1.4);
      goal('🥧', 'Pick up the pie', pie);
      await use({ at: pie, icon: '🥧', label: 'Pick up', y: 0.92, r: 2.4 });
      carryPie(); goal('🥧', 'Pick up the pie'); say(cook, 'To the table! 🦃', 2); await ctx.wait(1.3);
      await ctx.until(() => ctx.time >= thankT + 6.5);   // the thank-you card is read before the celebration
      ctx.finish();
    }

    const chapters = [chPatch, chCannery, chWheat, chBarnyard, chSpice, chKitchen];
    ctx.tp(0, 4.2, Math.PI);
    ctx.onStart(async () => {
      // (for testing: ?piech=3 starts at chapter 3)
      let from = 0; try { from = Math.max(0, Math.min(5, (+new URLSearchParams(location.search).get('piech') || 1) - 1)); } catch (e) {}
      if (from > 0) step = [0, 3, 5, 7, 10, 12][from];
      ctx.progress(step, TOTAL);
      for (let i = from; i < chapters.length; i++) await chapters[i]();
    });
  },
};
