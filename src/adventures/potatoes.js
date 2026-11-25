// Mashed Potatoes — "you're brought to a potato farm where you get to farm potatoes".
// The field (plant, water, shoo beetles, dig, drive the harvester) → packing shed → market → home kitchen.
import { THREE, C, box, cyl, sphere, ball, cone, group, mat, glow, sign, plane, disc, lathe, torus, tube, seeded, bake, picture, grain } from '../core/kit.js';
import * as P from '../core/props.js';
import * as M from './potatoes-parts.js';
import * as G from './potatoes-games.js';   // the little 2D games inside some steps (sprouted seed potatoes, stitching the sack, pouring the milk)

const EMOJI_FONT = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
const poster = (w, h, emoji, bg = '#fff8e8', frame = '#8a5a2b') => picture(w, h, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = frame; g.lineWidth = 12; g.strokeRect(0, 0, W, H); g.font = (H * 0.5) + 'px ' + EMOJI_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, W / 2, H / 2 + H * 0.03); }, 256);

export default {
  id: 'potatoes', title: 'Mashed Potatoes', emoji: '🥔', music: 'farm',
  question: 'Where do mashed potatoes begin?',
  thanksLine: 'From a seed potato to a fluffy spoonful — look who helped!',

  create(ctx) {
    const rnd = seeded(42), PL = ctx.player, PP = PL.position;
    const dist = (x, z) => Math.hypot(PP.x - x, PP.z - z);
    const at = (g, x, y, z, ry) => { g.position.set(x, y, z); if (ry !== undefined) g.rotation.y = ry; return g; };
    const use = (o) => new Promise(res => ctx.interact(Object.assign({}, o, { onUse: res })));
    const hop = async (o, to, h = 1, dur = 0.5) => { ctx.tween(o.position, { x: to[0], z: to[2] }, dur, 'linear'); const top = Math.max(o.position.y, to[1]) + h; await ctx.tween(o.position, { y: top }, dur / 2, 'out'); await ctx.tween(o.position, { y: to[1] }, dur / 2, 'in'); };
    // let go of what is carried and leave it in the world exactly where the hands held it
    const release = () => { const o = ctx.carrying, v = o.getWorldPosition(new THREE.Vector3()); ctx.drop(); ctx.scene.add(o); o.position.copy(v); return o; };
    const pop = (o, s = 1, dur = 0.4) => { o.visible = true; o.scale.setScalar(0.01); return ctx.tween(o.scale, { x: s, y: s, z: s }, dur, 'outBack'); };
    // the beacon can follow "the nearest thing still to do"
    const guide = new THREE.Object3D(); ctx.scene.add(guide); let guideFn = null;
    const nearest = (list) => { let b = null, bd = 1e9; for (const p of list) { const d = dist(p[0], p[1]); if (d < bd) { bd = d; b = p; } } return b; };
    const goalTo = (icon, text, fn) => { guideFn = fn; const p = fn(); if (p) guide.position.set(p[0], 0, p[1]); ctx.goal(icon, text, guide); };
    const goal = (icon, text, target) => { guideFn = null; ctx.goal(icon, text, target); };
    ctx.onUpdate(() => { if (guideFn) { const p = guideFn(); if (p) guide.position.set(p[0], 0, p[1]); } });
    // a second line from the same person waits for the first, so bubbles never overlap
    const say = (who, text, sec = 3.2, o) => { const wait = Math.max(0, (who.userData.sayEnd || 0) - ctx.time); who.userData.sayEnd = ctx.time + wait + sec + 0.2; if (wait > 0) ctx.after(wait + 0.15, () => ctx.say(who, text, sec, o)); else ctx.say(who, text, sec, o); };
    let zone = 1;

    // =====================================================================================
    // ZONE 1 — the potato field (around 0,0). Camera looks toward −Z.
    // =====================================================================================
    ctx.env('day');
    const z1 = new THREE.Group(), NR = 8, NC = 7, rowX = (i) => -5.25 + i * 1.5, colZ = (j) => -1.7 - j * 1.5;
    { const soil = plane(13.4, 12.4, 0x6a4a31, [0, 0.03, -6.2]); soil.material = new THREE.MeshLambertMaterial({ color: 0x77553a, map: grain(3) }); z1.add(soil); }
    for (let i = 0; i < NR; i++) { const r = cyl(0.46, 0.46, 11.6, i % 2 ? 0x7d5a3c : 0x755337, [rowX(i), 0.0, -6.2], [Math.PI / 2, 0, 0], 8); r.scale.z = 0.42; z1.add(r); }   // rounded ridges
    z1.add(at(P.barn({ sign: '🥔' }), -17, 0, -9, 0.5)); z1.add(at(P.silo(), -23.5, 0, -5));
    z1.add(at(P.fence(16), -0.6, 0, -15.2)); z1.add(at(P.fence(15.2), -8.6, 0, -7.6, Math.PI / 2));
    z1.add(plane(3.6, 70, C.dirt, [11.5, 0.03, -14])); z1.add(plane(6, 3.2, C.dirt, [8.4, 0.028, 1.2]));
    // water: tower + wind pump, pipe along the field, three sprinkler posts
    const tower = M.waterTower(); z1.add(at(tower, -14.2, 0, -0.6, 0.3));
    z1.add(cyl(0.07, 0.07, 12.6, C.steel, [-6.9, 0.1, -5.1], [Math.PI / 2, 0, 0], 6)); z1.add(cyl(0.07, 0.07, 6.6, C.steel, [-10.2, 0.1, 1.2], [0, 0, Math.PI / 2], 6)); z1.add(cyl(0.07, 0.07, 1.8, C.steel, [-13.5, 0.1, 0.3], [Math.PI / 2, 0, 0], 6));
    const SPR = [-2.6, -6.2, -9.8]; for (const z of SPR) z1.add(cyl(0.05, 0.05, 1.1, C.steel, [-6.9, 0.55, z], null, 5));
    z1.add(at(P.haybale(), -10.2, 0, -2.4)); z1.add(at(P.haybale(), -11.4, 0, -3.2, 0.5)); z1.add(at(P.haybale(), -10.8, 0.95, -2.8, 0.2));
    z1.add(at(P.signpost('🥔', { h: 2.4, size: 1.0 }), 6.6, 0, 3.6, -0.15));
    z1.add(at(P.house({ w: 7 }), 26, 0, -24, -0.5));
    z1.add(P.scatter(20, 90, 60, (r) => P.tree({ h: 3.5 + r() * 3, kind: r() < 0.3 ? 'pine' : 'round' }), { seed: 3, keep: (x, z) => (x < -10 || x > 15 || z < -18) && z < 5 && !(x < -10 && x > -29 && z > -16 && z < 7) && !(x > 20 && x < 32 && z > -30 && z < -18) }));
    z1.add(P.scatter(10, 50, 34, () => P.bush(), { seed: 5, keep: (x, z) => (x < -10 || x > 14.5 || z < -17) && z < 5 && !(x < -10 && x > -29 && z > -16 && z < 7) }));
    z1.add(P.scatter(16, 30, 7, () => P.flower(), { seed: 8 }).translateZ(8.5));
    for (let i = 0; i < 4; i++) z1.add(at(P.mountain({ h: 22 + (i % 2) * 8 }), -72 + i * 48, 0, -100));
    for (let i = 0; i < 5; i++) z1.add(at(P.cloud({ s: 2 + (i % 3) }), -50 + i * 26, 24 + (i % 2) * 5, -70 - (i % 3) * 8));
    { const wb = group([box(1.1, 0.35, 0.7, 0x5c7d6c, [0, 0.55, 0]), box(0.9, 0.06, 0.55, 0x4a6657, [0, 0.74, 0]), cyl(0.24, 0.24, 0.1, 0x333333, [0, 0.24, 0.55], [Math.PI / 2, 0, 0], 8), box(0.06, 0.06, 0.9, C.woodLight, [0.4, 0.62, -0.7]), box(0.06, 0.06, 0.9, C.woodLight, [-0.4, 0.62, -0.7]), box(0.06, 0.4, 0.06, 0x333333, [0.4, 0.2, -0.3]), box(0.06, 0.4, 0.06, 0x333333, [-0.4, 0.2, -0.3])]); for (let i = 0; i < 6; i++) wb.add(at(M.potato(1.3, 0xc9a26b, i), (i % 3 - 1) * 0.28, 0.74, (i > 2 ? 0.14 : -0.14))); z1.add(at(wb, 3.4, 0, 6.6, 2.5)); }
    z1.add(at(P.crate({ fill: 0xc9a26b }), 5.0, 0, 6.2, 0.3)); z1.add(at(P.crate(), 5.2, 0.45, 6.3, 0.6)); z1.add(at(P.bush(), -5.6, 0, 6.8)); z1.add(at(P.rock({ s: 0.9 }), -4.2, 0, 7.3)); z1.add(at(P.bush({ s: 0.8 }), 8.2, 0, 7.0));
    const fan = tower.userData.fan; ctx.addStatic(z1);
    ctx.collideBox(-17, -9, 10.5, 9); ctx.collideCircle(-23.5, -5, 1.9); ctx.collideBox(-0.6, -15.2, 16, 0.4); ctx.collideBox(-8.6, -7.6, 0.4, 15.2); ctx.collideCircle(6.6, 3.6, 0.3); ctx.collideCircle(-10.8, -2.8, 1.3); ctx.collideCircle(-14.2, -0.6, 1.6); ctx.collideCircle(3.4, 6.6, 0.8); ctx.collideCircle(5.1, 6.2, 0.6);
    for (const z of SPR) ctx.collideCircle(-6.9, z, 0.2);
    const sprHeads = SPR.map(z => { const h = group([box(0.7, 0.06, 0.06, C.red, [0, 0, 0]), box(0.06, 0.06, 0.3, C.red, [0, 0, 0]), cyl(0.08, 0.08, 0.1, C.steel, [0, 0, 0])]); bake(h); ctx.add(h, -6.9, z); h.position.y = 1.14; return h; });
    const valve = group([cyl(0.1, 0.1, 0.9, C.steel, [0, 0.45, 0]), torus(0.24, 0.05, C.red, [0, 0.95, 0], [Math.PI / 2, 0, 0])], [-6.9, 0, 1.2]); ctx.add(valve); ctx.collideCircle(-6.9, 1.2, 0.3);
    const farmer = ctx.person({ hat: 'straw', shirt: 0xd9483b, pants: 0x3b5b8c, skin: C.skin[2], hair: C.hair[1], hairStyle: 'bun', expressive: true }, -2.6, 3.4, 0.5);
    const seedCrate = ctx.add(P.crate({ fill: 0xc9a26b, s: 0.55 }), -4.6, 2.6);
    const dog = ctx.add(M.dog(), -1.0, 4.6, 2.4); const dg = { tx: -1.0, tz: 4.6, mode: 'follow', wag: 1 };
    // the whole field of plants is one instanced mesh (+ one for the blossoms); each plant can grow, be dug up or harvested
    const plantGeo = M.plantModel(rnd).children[0], flowerGeo = M.flowerModel().children[0];
    const plants = []; for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const own = (i === 3 || i === 4) && (j === 1 || j === 3 || j === 5); plants.push({ x: rowX(i) + (own ? 0 : (rnd() - 0.5) * 0.2), z: colZ(j) + (own ? 0 : (rnd() - 0.5) * 0.3), ry: rnd() * 6, v: 0.9 + rnd() * 0.25, own, planted: !own, alive: true, s: own ? 0 : 0.3, f: 0 }); }
    const NP = plants.length, plantIM = new THREE.InstancedMesh(plantGeo.geometry, plantGeo.material, NP), flowerIM = new THREE.InstancedMesh(flowerGeo.geometry, flowerGeo.material, NP);
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0), white = new THREE.Color(1, 1, 1);
    const refresh = () => { for (let k = 0; k < NP; k++) { const p = plants[k], s = p.alive && p.planted ? p.s * p.v : 0; q4.setFromAxisAngle(yAxis, p.ry); m4.compose(v4.set(p.x, 0.14, p.z), q4, s4.set(s, s, s)); plantIM.setMatrixAt(k, m4); const f = s * p.f; m4.compose(v4.set(p.x, 0.14, p.z), q4, s4.set(f, f, f)); flowerIM.setMatrixAt(k, m4); } plantIM.instanceMatrix.needsUpdate = true; flowerIM.instanceMatrix.needsUpdate = true; };
    for (let k = 0; k < NP; k++) plantIM.setColorAt(k, white); plantIM.instanceColor.needsUpdate = true; plantIM.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, -6.2), 10); flowerIM.boundingSphere = plantIM.boundingSphere; refresh(); ctx.add(plantIM); ctx.add(flowerIM); flowerIM.visible = false;
    let growUntil = 0; const growTo = (s, dur, f) => { growUntil = ctx.time + dur + 0.1; for (const p of plants) if (p.alive && p.planted) { ctx.tween(p, { s }, dur, 'inOut'); if (f !== undefined) ctx.tween(p, { f }, dur, 'inOut'); } };
    const own = plants.filter(p => p.own);
    const rig = ctx.add(M.harvesterRig(), 11.5, 5.5, Math.PI), heap = rig.userData.heap;
    const truck1 = ctx.add(P.truck({ kind: 'flatbed', color: C.blue }), 11.5, -6.5, Math.PI);
    const beetles = [[1, 1], [6, 2], [2, 4], [5, 5], [0, 6]].map(([i, j], n) => { const p = plants[i * NC + j], o = ctx.add(M.beetle(), p.x, p.z); o.visible = false; o.scale.setScalar(1.3); return { o, p, st: 0, t: 0, ph: n * 1.7 }; });
    let sprinkling = false, fanSpeed = 0.6, driving = false; const looseSpuds = [];
    ctx.onUpdate((dt, t) => {
      if (zone !== 1) return;
      if (t < growUntil) refresh();
      fan.rotation.z -= dt * fanSpeed; if (sprinkling) for (const h of sprHeads) h.rotation.y += dt * 5;
      for (let i = looseSpuds.length - 1; i >= 0; i--) { const o = looseSpuds[i]; if (!o.parent) { looseSpuds.splice(i, 1); continue; } if (o.userData.landed) o.position.y = 0.2 + Math.abs(Math.sin(t * 4.5 + i * 1.3)) * 0.55; }
      // the dog trots after you, sits when you stop
      const d = dog.position; let tx = dg.tx, tz = dg.tz; if (dg.mode === 'follow') { const a = PL.rotation.y; tx = PP.x - Math.sin(a) * 1.5 + Math.cos(a) * (driving ? 3.2 : 0.9); tz = PP.z - Math.cos(a) * 1.5 - Math.sin(a) * (driving ? 3.2 : 0.9); }
      const dx = tx - d.x, dz = tz - d.z, dd = Math.hypot(dx, dz);
      if (dd > 0.5) { const sp = Math.min(7.5, 1.5 + dd * 2.2) * dt; d.x += dx / dd * Math.min(sp, dd); d.z += dz / dd * Math.min(sp, dd); dog.rotation.y = Math.atan2(dx, dz); d.y = Math.abs(Math.sin(t * 13)) * 0.1; dog.rotation.x = 0; } else { d.y = 0; dog.rotation.x = -0.25; }
      dog.userData.tail.rotation.y = Math.sin(t * 14) * 0.7;
      // beetles: sit and wiggle on a plant; fly off when you come close
      for (const b of beetles) { if (!b.o.visible) continue;
        if (b.st === 1) { b.o.position.y = 0.14 + 0.62 * b.p.s * b.p.v + Math.abs(Math.sin(t * 5 + b.ph)) * 0.04; b.o.rotation.y = Math.sin(t * 1.3 + b.ph) * 1.2; }
        else if (b.st === 2) { b.t += dt; const k = b.t / 1.8, a = b.ph + b.t * 7; b.o.position.set(b.p.x + Math.cos(a) * (0.4 + k * 3), 0.8 + k * 6, b.p.z + Math.sin(a) * (0.4 + k * 3) - k * 5); b.o.rotation.y = a + Math.PI / 2; b.o.userData.wings.scale.y = Math.sin(t * 50) > 0 ? 1 : -0.6; if (k >= 1) { b.o.visible = false; b.st = 3; } }
      }
    });

    // =====================================================================================
    // ZONE 2 — the packing shed (x≈100, indoors)
    // =====================================================================================
    const X2 = 100, z2 = new THREE.Group(), BZ = -6, BY = 1.0;
    { const fl = plane(30, 19, 0xbdb7a9, [0, 0.03, -4]); fl.material = new THREE.MeshLambertMaterial({ color: 0xc4beb0, map: grain(5) }); z2.add(fl); } for (let i = 0; i < 5; i++) z2.add(plane(0.25, 19, 0xaca698, [-12 + i * 6, 0.04, -4]));
    z2.add(box(30, 7, 0.4, 0xe6dfcc, [0, 3.5, -13.5])); z2.add(box(0.4, 7, 19, 0xd9d2bf, [-15, 3.5, -4]));
    z2.add(box(0.4, 7, 12.9, 0xd9d2bf, [15, 3.5, -7.05])); z2.add(box(0.4, 7, 1.9, 0xd9d2bf, [15, 3.5, 4.55])); z2.add(box(0.4, 2.6, 4.2, 0xd9d2bf, [15, 5.7, 1.5])); z2.add(box(0.1, 4.4, 4.2, glow(0xd8efff), [15.7, 2.2, 1.5])); z2.add(box(0.5, 0.3, 4.6, C.yellow, [15, 4.4, 1.5]));
    z2.add(box(30, 0.5, 0.45, C.green, [0, 4.7, -13.4])); z2.add(box(30, 1.0, 0.45, 0x8f9a8a, [0, 0.5, -13.4]));
    z2.add(sign('🥔 PACKING SHED', 1.1, { border: '#2f6d3a' }, [7.4, 3.2, -13.25]));
    for (const x of [-10.5, -2.5]) { z2.add(box(3.2, 1.7, 0.1, 0xbfe6f5, [x, 3.1, -13.28])); z2.add(box(3.4, 0.12, 0.2, C.white, [x, 2.2, -13.2])); z2.add(box(0.1, 1.7, 0.14, C.white, [x, 3.1, -13.24])); z2.add(box(3.2, 0.1, 0.14, C.white, [x, 3.1, -13.24])); }
    z2.add(P.conveyor(16, { h: 0.9, w: 1.0 }).translateX(-1).translateZ(BZ));
    // tipping bin (left), wash arch, rock bin, scale for the sack (right end)
    z2.add(box(2.6, 0.15, 2.2, C.wood, [-11.2, 2.0, BZ], [0, 0, -0.25])); for (const sz of [-1, 1]) z2.add(box(2.6, 0.6, 0.1, C.woodLight, [-11.2, 2.3, BZ + sz * 1.1], [0, 0, -0.25])); z2.add(box(0.1, 0.6, 2.2, C.woodLight, [-12.45, 2.62, BZ], [0, 0, -0.25]));
    for (const [x, z] of [[-12.2, -7], [-12.2, -5], [-10.4, -7], [-10.4, -5]]) z2.add(box(0.14, 1.9, 0.14, 0x555f68, [x, 0.95, z]));
    for (let i = 0; i < 9; i++) z2.add(at(M.potato(1.5, 0x7a5a3c, i), -11.9 + (i % 3) * 0.5, 2.25 - (i % 3) * 0.12, BZ - 0.6 + Math.floor(i / 3) * 0.55));
    z2.add(at(M.washStation(), -5, 0, BZ));
    z2.add(box(1.2, 0.8, 1.2, 0x4f9d4a, [0.8, 0.4, -2.2])); z2.add(box(1.3, 0.1, 1.3, 0x3f8a3a, [0.8, 0.82, -2.2])); z2.add(box(1.0, 0.04, 1.0, 0x2a2a2a, [0.8, 0.86, -2.2])); z2.add(sign('🗑️', 0.6, { bg: '#fff8e8' }, [0.8, 0.42, -1.58]));
    z2.add(box(1.3, 0.3, 1.3, 0x6b7580, [8.3, 0.15, BZ])); z2.add(box(1.1, 0.06, 1.1, C.metal, [8.3, 0.33, BZ])); z2.add(box(0.14, 2.2, 0.14, 0x6b7580, [8.3, 1.1, BZ - 0.85])); z2.add(at(M.dialFace(0.5), 8.3, 2.4, BZ - 0.76)); z2.add(cyl(0.52, 0.52, 0.08, 0x6b7580, [8.3, 2.4, BZ - 0.82], [Math.PI / 2, 0, 0], 14));
    z2.add(at(M.leverPost(), -9.2, 0, -3.7));
    // stock: crates, pallets of sacks, forklift, floor markings
    for (let i = 0; i < 7; i++) z2.add(at(P.crate({ fill: 0xc9a26b }), -13.3 + (i % 3) * 0.85, i > 5 ? 0.9 : i > 2 ? 0.45 : 0, -11.6 + (i > 2 ? 0.1 : 0)));
    for (const [x, z] of [[11.6, -11.6], [12.6, -8.2]]) { z2.add(box(1.7, 0.16, 1.4, C.woodLight, [x, 0.08, z])); for (let i = 0; i < 5; i++) z2.add(at(P.sack(), x - 0.5 + (i % 3) * 0.5, i > 2 ? 0.62 : 0.16, z + (i > 2 ? 0 : (i % 2) * 0.3 - 0.15))); }
    z2.add(at(M.forklift(), -10.4, 0, 2.2, 2.4));
    for (let i = 0; i < 11; i++) z2.add(plane(1.1, 0.3, i % 2 ? 0x333333 : C.yellow, [-8.3 + i * 1.5, 0.045, -4.85]));
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) z2.add(plane(0.9, 0.22, C.yellow, [-6 + i * 4.4, 0.045, -2.6 + s * 0.28], s * 0.6));   // floor arrows: the way the potatoes travel
    z2.add(box(1.6, 0.16, 1.3, C.woodLight, [-3.6, 0.08, 3.5])); for (let i = 0; i < 5; i++) z2.add(at(P.crate({ fill: 0xe0b878 }), -4.0 + (i % 2) * 0.8 + (i > 3 ? 0.4 : 0), 0.16 + Math.floor(i / 2) * 0.45, 3.5));
    z2.add(at(group([box(0.5, 0.06, 0.4, C.steel, [0, 0.1, 0.2]), box(0.06, 1.2, 0.06, C.red, [0.22, 0.6, 0]), box(0.06, 1.2, 0.06, C.red, [-0.22, 0.6, 0]), box(0.5, 0.06, 0.06, C.red, [0, 1.2, 0]), cyl(0.12, 0.12, 0.06, 0x222222, [0.28, 0.12, 0], [0, 0, Math.PI / 2], 8), cyl(0.12, 0.12, 0.06, 0x222222, [-0.28, 0.12, 0], [0, 0, Math.PI / 2], 8), at(P.sack(), 0, 0.13, 0.22)]), 1.2, 0, 3.9, 0.5));
    for (let i = 0; i < 6; i++) z2.add(plane(0.5, 2.6, 0xeeeae0, [3.6 + i * 1.0, 0.045, 1.5]));
    for (const x of [-8, 0, 8]) { z2.add(cyl(0.02, 0.02, 1.6, 0x444444, [x, 6.2, -3], null, 4)); z2.add(cone(0.5, 0.35, C.green, [x, 5.4, -3], null, 8)); z2.add(sphere(0.16, glow(0xfff2b0), [x, 5.22, -3], 6)); }
    ctx.addStatic(z2, X2, 0);
    ctx.collideBox(X2 - 1, BZ, 16.6, 1.4); ctx.collideBox(X2 - 11.3, BZ, 2.6, 2.6); ctx.collideBox(X2 + 0.8, -2.2, 1.4, 1.4); ctx.collideBox(X2 + 8.3, BZ + 0.05, 1.7, 2.5); ctx.collideCircle(X2 - 9.2, -3.7, 0.35); ctx.collideCircle(X2 - 10.4, 2.2, 1.6); ctx.collideBox(X2 - 3.6, 3.5, 1.8, 1.5); ctx.collideCircle(X2 + 1.2, 3.9, 0.5); ctx.collideBox(X2 - 12.6, -11.6, 3.2, 1.4); ctx.collideBox(X2 + 12.1, -10, 3, 5);
    const stick2 = group([cyl(0.04, 0.04, 0.75, 0x333333, [0, 0.37, 0]), sphere(0.12, C.red, [0, 0.78, 0])], [X2 - 9.2, 0.85, -3.7], [0, 0, 0.6]); ctx.add(stick2);
    const brushes = [-5.45, -4.55].map(x => { const b = group([cyl(0.2, 0.2, 1.0, 0x4f9d4a, [0, 0, 0], [Math.PI / 2, 0, 0], 8), box(0.46, 0.06, 0.9, 0x8fd07a, [0, 0, 0]), box(0.06, 0.46, 0.9, 0x8fd07a, [0, 0, 0])]); bake(b); ctx.add(b, X2 + x, BZ); b.position.y = 1.52; return b; });
    const needle2 = group([box(0.05, 0.4, 0.03, 0x222222, [0, 0.18, 0])], [X2 + 8.3, 2.4, BZ - 0.72], [0, 0, 2.2]); ctx.add(needle2);
    const truck2 = ctx.add(P.truck({ kind: 'flatbed', color: C.blue }), X2 + 11.8, 1.5, Math.PI / 2); ctx.collideBox(X2 + 11.8, 1.5, 6.9, 2.7);
    for (const [x, z] of [[-0.6, 1.2], [0.1, 1.5], [0.6, 0.9], [-0.2, 0.5]]) truck2.userData.bed.add(at(P.sack(), x, 0, z));
    const w1 = ctx.person('factory', X2 - 2.6, -7.05, 0.1, 2), w2 = ctx.person('factory', X2 + 3.4, -7.05, -0.1, 5); w2.userData.anim = 'work';   // close enough for their straight arms to reach the belt
    let brushSpin = 0; ctx.onUpdate((dt) => { if (zone !== 2 || !brushSpin) return; for (const b of brushes) b.rotation.z += dt * brushSpin; });

    // =====================================================================================
    // ZONE 3 — the market (x≈200, indoors)
    // =====================================================================================
    const X3 = 200, z3 = new THREE.Group();
    z3.add(plane(28, 19, 0xefe9da, [0, 0.03, -4])); for (let i = 0; i < 8; i++) z3.add(plane(28, 0.06, 0xdcd5c2, [0, 0.035, -12.5 + i * 2.4])); for (let i = 0; i < 11; i++) z3.add(plane(0.06, 19, 0xdcd5c2, [-12 + i * 2.4, 0.035, -4]));
    z3.add(box(28, 6, 0.4, 0xf4f0e4, [0, 3, -13.5])); z3.add(box(0.4, 6, 19, 0xe9e4d6, [-14, 3, -4])); z3.add(box(0.4, 6, 19, 0xe9e4d6, [14, 3, -4]));
    z3.add(box(28, 0.5, 0.45, C.green, [0, 4.5, -13.4])); z3.add(sign('🛒 MARKET', 1.1, { border: '#2f6d3a' }, [-7.6, 3.2, -13.25]));
    for (const [x, e] of [[0.6, '🍎'], [3.2, '🥕'], [5.8, '🧀'], [8.4, '🍞']]) z3.add(at(poster(1.9, 1.5, e, '#fff8e8', '#2f6d3a'), x + 1.4, 3.1, -13.27));
    for (let i = 0; i < 4; i++) z3.add(at(P.shelf({ w: 6, seed: i + 2 }), -10.4 + i * 6.9, 0, -12.9));
    // cold cabinets (right wall), glass entrance (left wall)
    for (let i = 0; i < 3; i++) { z3.add(box(0.9, 2.4, 2.6, 0xdfe8ec, [13.35, 1.2, -9.6 + i * 2.8])); z3.add(box(0.06, 1.9, 2.2, 0x9fd6f2, [12.88, 1.25, -9.6 + i * 2.8])); z3.add(box(0.1, 0.3, 2.6, 0x3d4a52, [12.9, 2.25, -9.6 + i * 2.8])); z3.add(box(0.1, 0.14, 2.6, 0x3d4a52, [12.9, 0.07, -9.6 + i * 2.8])); z3.add(box(0.08, 1.9, 0.07, 0xf2f4f5, [12.86, 1.25, -9.6 + i * 2.8])); for (const s of [-1, 1]) z3.add(box(0.05, 0.7, 0.05, C.metal, [12.8, 1.3, -9.6 + i * 2.8 + s * 0.14])); for (let k = 0; k < 3; k++) z3.add(box(0.5, 0.3, 2.0, [0xfafafa, 0xf2c43d, 0x9fd0e8][k], [13.2, 0.55 + k * 0.6, -9.6 + i * 2.8])); }
    z3.add(box(0.1, 3.0, 3.4, 0xbfe6f5, [-13.76, 1.5, 2.4])); z3.add(box(0.14, 3.0, 0.1, C.white, [-13.74, 1.5, 2.4])); z3.add(box(0.14, 0.12, 3.6, C.white, [-13.74, 3.05, 2.4])); z3.add(at(poster(1.6, 1.2, '🍂🦃', '#fff8e8', '#d9622b'), -13.77, 2.6, -3.2, Math.PI / 2));
    // produce stands
    const fruitGeo = new THREE.SphereGeometry(1, 6, 4); const stand = (x, z, col, n, emo, r = 0.2) => { const g = group([box(3, 0.8, 1.6, C.woodLight, [0, 0.4, 0]), box(3.1, 0.12, 1.7, C.wood, [0, 0.85, 0]), box(3.1, 0.5, 0.08, C.green, [0, 0.5, 0.85])], [x, 0, z]); for (let i = 0; i < n; i++) { const f = new THREE.Mesh(fruitGeo, mat(Array.isArray(col) ? col[i % col.length] : col)); f.scale.set(r, r * 0.8, r * 0.85); f.position.set(...[-1.25 + (i % 7) * 0.42, 1.02 + (i > 6 ? 0.13 : 0) + (i > 13 ? 0.13 : 0), -0.35 + (i > 6 ? 0.4 : 0) + (i % 2) * 0.2 - (i > 13 ? 0.2 : 0)]); g.add(f); } g.add(sign(emo, 0.62, { bg: '#fff8e8', border: '#2f6d3a' }, [0, 0.5, 0.9])); return g; };
    z3.add(stand(1, -6.5, 0xc9a26b, 16, '🥔', 0.2)); z3.add(stand(-3.6, -6.5, [0xd9483b, 0xc23b22, 0x8fbf4a], 20, '🍎')); z3.add(stand(5.6, -6.5, 0xf2a23d, 20, '🍊')); z3.add(stand(-8.2, -6.5, [0xe98a2b, 0xe98a2b, 0x5aa845], 14, '🎃', 0.26));
    // scale table, checkout lane, carts
    z3.add(at(P.tableProp(1.5, 1.0, 0.85, 0x8a949e), 6.2, 0, -1.8)); z3.add(box(0.9, 0.12, 0.7, 0x5c6670, [6.2, 0.95, -1.8])); z3.add(box(0.8, 0.04, 0.6, C.metal, [6.2, 1.04, -1.8])); z3.add(box(0.12, 1.0, 0.12, 0x5c6670, [6.2, 1.5, -2.2])); z3.add(at(M.dialFace(0.42, '#2f6d3a'), 6.2, 2.2, -2.1)); z3.add(cyl(0.44, 0.44, 0.08, 0x5c6670, [6.2, 2.2, -2.16], [Math.PI / 2, 0, 0], 14));
    z3.add(at(M.checkout(), -8.6, 0, -0.6));
    for (let i = 0; i < 3; i++) z3.add(at(group([M.cart()]), 11.6, 0, 1.2 + i * 0.55, 0)); z3.add(at(group([M.cart()]), -3.2, 0, -10.6, 1.2));
    // a seasonal display near the front: pumpkins on hay, baskets by the wall
    z3.add(at(P.haybale(), -2.6, 0, 2.9, 0.3)); for (const [x, y, z, s, c] of [[-2.6, 1.15, 2.9, 0.42, 0xd9822b], [-1.6, 0, 3.3, 0.5, 0xd47a26], [-3.5, 0, 3.5, 0.36, 0xe2b64a], [-2.2, 0, 4.0, 0.3, 0xc9652b]]) z3.add(at(M.pumpkin(s, c), x, y, z, x * 3));
    for (let i = 0; i < 4; i++) z3.add(box(0.6, 0.16, 0.42, [C.red, C.green, C.blue, C.yellow][i], [12.9, 0.1 + i * 0.17, 3.6]));
    ctx.addStatic(z3, X3, 0);
    for (const x of [1, -3.6, 5.6, -8.2]) ctx.collideBox(X3 + x, -6.5, 3.2, 1.9); ctx.collideBox(X3, -12.9, 28, 1.0); ctx.collideBox(X3 + 13.3, -6.8, 1.2, 8.6); ctx.collideBox(X3 + 6.2, -1.9, 1.6, 1.3); ctx.collideBox(X3 - 8.6, -0.6, 1.3, 3.8); ctx.collideBox(X3 + 11.6, 1.75, 0.8, 2.1); ctx.collideCircle(X3 - 3.2, -10.6, 0.6); ctx.collideCircle(X3 - 2.5, 3.2, 1.5);
    const needle3 = group([box(0.045, 0.34, 0.03, 0x222222, [0, 0.15, 0])], [X3 + 6.2, 2.2, -2.06], [0, 0, 2.2]); ctx.add(needle3);
    const paperBag = bake(group([box(0.46, 0.5, 0.3, 0xc9a574, [0, 0.25, 0]), box(0.5, 0.05, 0.34, 0xb58f5e, [0, 0.5, 0]), sign('🥔', 0.24, { bg: null }, [0, 0.26, 0.16])])); ctx.add(paperBag, X3 + 2.2, -5.55); paperBag.position.y = 0.92;
    const standSpuds = [0, 1, 2, 3, 4].map(i => { const p = ctx.add(M.potato(1.25, 0xc9a26b, i), X3 + 0.2 + i * 0.34, -5.9); p.position.y = 1.16; return p; });
    const cashier = ctx.person({ shirt: C.green, apron: 0xffffff, hairStyle: 'pony', hair: C.hair[3], skin: C.skin[1], expressive: true }, X3 - 9.9, -0.4, Math.PI / 2);
    const shopper = ctx.person('shopper', X3 - 6, -9.6, 0, 4), shopper2 = ctx.person('shopper', X3 + 8.4, -9.2, -2.4, 11);
    const shCart = ctx.add(bake(group([M.cart()])), X3 - 5, -9.6); let shT = 0;
    ctx.onUpdate((dt, t) => { if (zone !== 3) return; // one shopper strolls along the back aisle with a cart
      shT += dt; const L = 11, k = (shT * 1.1) % (2 * L), x = k < L ? -6 + k : -6 + 2 * L - k, dir = k < L ? 1 : -1; shopper.position.set(X3 + x, 0, -9.6); shopper.rotation.y = dir * Math.PI / 2; shopper.userData.anim = 'walk'; shopper.userData.carrying = true; shCart.position.set(X3 + x + dir * 1.0, 0, -9.6); /* both hands on the cart's handle */ shCart.rotation.y = dir * Math.PI / 2; });

    // =====================================================================================
    // ZONE 4 — the home kitchen (x≈300, indoors)
    // =====================================================================================
    const X4 = 300, z4 = new THREE.Group(), KZ = -7.1, KY = 1.1;
    z4.add(plane(16, 12, 0xf3ead8, [0, 0.03, -2])); for (let i = 0; i < 16; i++) for (let j = 0; j < 12; j++) if ((i + j) % 2) z4.add(plane(0.98, 0.98, 0xcf9680, [-7.5 + i, 0.035, -7.5 + j]));
    z4.add(box(16, 5.4, 0.4, 0xf7e3a1, [0, 2.7, -8])); z4.add(box(0.4, 5.4, 12, 0xf2d98f, [-8, 2.7, -2])); z4.add(box(0.4, 5.4, 12, 0xf2d98f, [8, 2.7, -2])); z4.add(box(16, 0.25, 0.44, C.white, [0, 4.6, -7.97]));
    z4.add(box(10.6, 1.0, 1.3, 0x5b8fc7, [-1.9, 0.5, KZ])); z4.add(box(10.8, 0.1, 1.4, 0xe9d9b8, [-1.9, 1.05, KZ])); for (let i = 0; i < 5; i++) { z4.add(box(1.7, 0.7, 0.05, 0x7aa8d9, [-6.1 + i * 2.1, 0.5, KZ + 0.66])); z4.add(sphere(0.05, C.white, [-6.1 + i * 2.1, 0.78, KZ + 0.7], 5)); }
    // sink under the window
    z4.add(box(1.5, 0.14, 0.9, C.metal, [-5.3, 1.08, KZ])); z4.add(box(1.2, 0.04, 0.6, 0x6d7a86, [-5.3, 1.13, KZ])); z4.add(cyl(0.04, 0.04, 0.4, C.metal, [-5.3, 1.35, KZ - 0.45], null, 6)); z4.add(cyl(0.035, 0.035, 0.3, C.metal, [-5.3, 1.53, KZ - 0.32], [Math.PI / 2, 0, 0], 6));
    z4.add(box(3.3, 2.0, 0.12, C.white, [-4.9, 2.7, -7.76])); z4.add(at(picture(3.0, 1.7, (g, W, H) => { const s = g.createLinearGradient(0, 0, 0, H); s.addColorStop(0, '#8fd0ff'); s.addColorStop(1, '#e8f6ff'); g.fillStyle = s; g.fillRect(0, 0, W, H); g.fillStyle = '#7dbb55'; g.fillRect(0, H * 0.62, W, H); g.fillStyle = '#6b4a2f'; g.fillRect(0, H * 0.8, W, H); g.fillStyle = '#4f9d4a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(W * (0.06 + i * 0.11), H * 0.8, H * 0.07, 0, 7); g.fill(); } g.fillStyle = '#b5382c'; g.fillRect(W * 0.62, H * 0.3, W * 0.22, H * 0.32); g.fillStyle = '#6b3a2a'; g.beginPath(); g.moveTo(W * 0.6, H * 0.3); g.lineTo(W * 0.73, H * 0.14); g.lineTo(W * 0.86, H * 0.3); g.fill(); g.fillStyle = '#fff'; for (const [x, y] of [[0.2, 0.2], [0.45, 0.12]]) { g.beginPath(); g.ellipse(W * x, H * y, W * 0.08, H * 0.05, 0, 0, 7); g.fill(); } }, 256), -4.9, 2.7, -7.68));
    z4.add(box(0.08, 1.7, 0.06, C.white, [-4.9, 2.7, -7.66])); z4.add(box(3.0, 0.08, 0.06, C.white, [-4.9, 2.7, -7.66])); z4.add(box(3.4, 0.1, 0.3, C.white, [-4.9, 1.72, -7.62])); for (const sx of [-1, 1]) z4.add(box(0.5, 2.1, 0.1, 0xb5523f, [-4.9 + sx * 1.9, 2.7, -7.7]));
    for (let i = 0; i < 3; i++) { z4.add(cyl(0.1, 0.08, 0.16, 0xc9743f, [-5.7 + i * 0.8, 1.85, -7.6], null, 7)); z4.add(sphere(0.13, [0x4f9d4a, 0x6bb85a, 0x3f8a3a][i], [-5.7 + i * 0.8, 2.02, -7.6], 6)); }
    // stove, fridge, shelf, clock, pictures
    z4.add(box(1.9, 1.1, 1.3, 0xf2f2f2, [4.5, 0.55, KZ])); z4.add(box(1.9, 0.06, 1.3, 0x333333, [4.5, 1.13, KZ])); z4.add(box(1.9, 0.5, 0.1, 0xe0e0e0, [4.5, 1.4, KZ - 0.6])); z4.add(box(1.3, 0.5, 0.05, 0x2a2a2a, [4.5, 0.45, KZ + 0.66])); z4.add(box(1.4, 0.05, 0.06, 0x999999, [4.5, 0.82, KZ + 0.7])); for (let i = 0; i < 4; i++) z4.add(cyl(0.06, 0.06, 0.06, C.red, [3.85 + i * 0.43, 1.0, KZ + 0.66], [Math.PI / 2, 0, 0], 8)); for (const [bx, bz] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.32], [0.5, 0.32]]) z4.add(cyl(0.2, 0.2, 0.03, 0x1c1c1c, [4.5 + bx, 1.165, KZ + bz], null, 10));
    z4.add(box(1.9, 0.3, 1.0, 0xcdd2d4, [4.5, 2.75, KZ - 0.1])); z4.add(box(1.7, 0.12, 0.8, 0xb9bfc2, [4.5, 2.95, KZ - 0.2])); z4.add(box(0.6, 1.7, 0.45, 0xcdd2d4, [4.5, 3.85, KZ - 0.4]));   // range hood
    z4.add(at(picture(12.6, 0.56, (g, W, H) => { g.fillStyle = '#f3efe4'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d3cbb8'; g.lineWidth = 2; const n = 45, tw = W / n; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * tw, 0); g.lineTo(i * tw, H); g.stroke(); } for (const y of [0, H / 2, H]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }, 1024), -0.9, 1.39, -7.78));   // tiled backsplash
    z4.add(at(M.fridge(), 6.9, 0, KZ));
    z4.add(box(3.4, 0.1, 0.5, C.wood, [0.4, 2.5, -7.6])); for (let i = 0; i < 6; i++) { z4.add(cyl(0.13, 0.13, 0.3, [0xf6ecd6, 0xe98a2b, 0x8fbf4a, 0xf2c43d, 0xd9483b, 0xf6ecd6][i], [-1.0 + i * 0.55, 2.7, -7.6], null, 8)); z4.add(cyl(0.14, 0.14, 0.05, 0x8a5a2b, [-1.0 + i * 0.55, 2.88, -7.6], null, 8)); }
    z4.add(cyl(0.4, 0.4, 0.06, C.white, [3.1, 3.0, -7.76], [Math.PI / 2, 0, 0], 14)); z4.add(cyl(0.44, 0.44, 0.04, 0x5b8fc7, [3.1, 3.0, -7.78], [Math.PI / 2, 0, 0], 14)); z4.add(box(0.04, 0.26, 0.03, 0x222222, [3.1, 3.1, -7.72])); z4.add(box(0.2, 0.04, 0.03, 0x222222, [3.18, 3.0, -7.72]));
    z4.add(at(poster(1.5, 1.2, '🥔💛'), -7.78, 2.7, -3.2, Math.PI / 2)); z4.add(at(poster(1.3, 1.3, '🌻'), 7.78, 2.7, -2.6, -Math.PI / 2)); z4.add(sign('🥔', 1.0, { bg: '#fff8e8', border: '#d9483b' }, [6.9, 3.0, -7.75]));
    // table, chairs, rug
    z4.add(disc(2.5, 0x4f7397, [-2.6, 0.04, -1.2], 40)); z4.add(disc(2.1, 0xeadfc8, [-2.6, 0.045, -1.2], 40)); z4.add(disc(1.7, 0x4f7397, [-2.6, 0.05, -1.2], 40));
    z4.add(at(P.tableProp(3.0, 1.6, 0.9, C.wood), -2.6, 0, -1.2)); for (const sx of [-1, 1]) { z4.add(box(0.7, 0.02, 0.5, 0xd9483b, [-2.6 + sx * 0.8, 0.95, -1.2])); z4.add(at(M.chair(), -2.6 + sx * 1.95, 0, -1.2, -sx * Math.PI / 2)); }
    z4.add(cyl(0.12, 0.09, 0.22, 0x5b8fc7, [-2.6, 1.05, -1.2], null, 8)); for (let i = 0; i < 3; i++) z4.add(sphere(0.09, [C.yellow, C.red, C.orange][i], [-2.6 + Math.cos(i * 2.1) * 0.1, 1.3, -1.2 + Math.sin(i * 2.1) * 0.1], 5));
    z4.add(box(1.3, 0.06, 0.9, C.woodLight, [-2.2, 1.13, KZ + 0.05]));   // chopping board
    ctx.addStatic(z4, X4, 0);
    ctx.collideBox(X4 - 2.6, -1.2, 4.9, 1.9); ctx.collideBox(X4, KZ, 16, 1.7);
    const grandma = ctx.person({ hair: C.hair[5], hairStyle: 'bun', shirt: C.purple, apron: C.cream, glasses: true, skin: C.skin[4], expressive: true }, X4 + 1.4, -3.4, -0.3);
    const pot = group([cyl(0.46, 0.42, 0.52, C.steel, [0, 0.26, 0], null, 12), torus(0.47, 0.035, 0x555555, [0, 0.52, 0], [Math.PI / 2, 0, 0]), box(0.2, 0.05, 0.08, 0x333333, [0.56, 0.42, 0]), box(0.2, 0.05, 0.08, 0x333333, [-0.56, 0.42, 0])], [X4 + 4.5, 1.16, KZ]); bake(pot); ctx.add(pot);
    const potFill = cyl(0.41, 0.41, 0.04, 0x9fd6f2, [0, 0.42, 0], null, 12); pot.add(potFill);
    const scrapBowl = ctx.add(bake(group([lathe([[0, 0], [0.2, 0.02], [0.3, 0.2]], 0x8fbf4a, null, 10)])), X4 - 3.6, KZ + 0.1); scrapBowl.position.y = KY;
    const knife = ctx.add(bake(group([box(0.05, 0.12, 0.5, C.metal, [0, 0.08, 0.1]), box(0.05, 0.07, 0.24, 0x333333, [0, 0.08, -0.27])])), X4 - 1.3, KZ + 0.2); knife.position.y = KY + 0.05;
    const butterK = ctx.add(bake(group([cyl(0.24, 0.2, 0.04, 0xfafafa, [0, 0.02, 0], null, 10), box(0.28, 0.14, 0.17, 0xffdf5a, [0, 0.11, 0])])), X4 + 2.4, KZ + 0.15); butterK.position.y = KY;
    const milkK = ctx.add(bake(group([cyl(0.11, 0.12, 0.34, 0xfafafa, [0, 0.17, 0], null, 8), cyl(0.05, 0.1, 0.12, 0xfafafa, [0, 0.4, 0], null, 8), cyl(0.055, 0.055, 0.04, C.blue, [0, 0.47, 0], null, 8)])), X4 + 3.0, KZ - 0.1); milkK.position.y = KY;
    const BOARD = [X4 - 2.2, KY + 0.06, KZ + 0.05], POT = [X4 + 4.5, KY, KZ];
    // only the zone the player is in is drawn: the others are 100 m away, but a camera turned their way would still draw all their people and props
    const zoneObjs = [[], [z1, ...sprHeads, valve, farmer, seedCrate, dog, plantIM, flowerIM, rig, truck1, ...beetles.map(b => b.o)], [z2, stick2, ...brushes, needle2, truck2, w1, w2], [z3, needle3, paperBag, ...standSpuds, cashier, shopper, shopper2, shCart], [z4, grandma, pot, scrapBowl, knife, butterK, milkK]];
    const showZone = (n) => { for (let k = 1; k <= 4; k++) for (const o of zoneObjs[k]) { if (k !== n) o.visible = false; else if (k > 1) o.visible = true; } };   // (zone 1 is only ever left, so its own hidden things stay as they are)
    for (let k = 2; k <= 4; k++) for (const o of zoneObjs[k]) o.visible = false;

    // =====================================================================================
    // THE STORY
    // =====================================================================================
    const TOTAL = 15; let step = 0; const done = () => ctx.progress(++step, TOTAL);

    // ---------- 1 · the potato field ----------
    async function chField() {
      zone = 1; ctx.bounds(-8.0, -14.4, 9.6, 8);
      say(farmer, 'Potatoes grow from… potatoes! 🥔');
      goal('🥔', 'Grab seed potatoes', seedCrate);
      await use({ at: seedCrate, icon: '🥔', label: 'Pick up' });
      await G.sproutGame(ctx);   // mini-game: pick out the seed potatoes whose eyes have sprouted
      ctx.carry(seedCrate, { y: -0.14 }); done();   // held between the hands, below the chin
      ctx.fact('👀', 'The “eyes” on a seed potato sprout into new plants.'); ctx.fact('🌱', 'Farmers let seed potatoes sprout first — it is called chitting.');
      // plant six seed potatoes
      let planted = 0;
      goalTo('🌱', 'Plant 6 potatoes', () => nearest(own.filter(p => !p.planted).map(p => [p.x, p.z])));
      for (const p of own) {
        const mk = ctx.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 12), mat(0xffd84a, { opacity: 0.6 })), p.x, p.z); mk.position.y = 0.2;
        ctx.interact({ at: [p.x, p.z], face: [p.x, p.z], r: 1.45, y: 1.2, icon: '🌱', label: 'Plant', sfx: 'plant', onUse: async () => {
          ctx.remove(mk); const sp = ctx.add(M.potato(1)); sp.position.set(p.x, 1.0, p.z); await ctx.tween(sp.position, { y: 0.1 }, 0.3, 'in'); ctx.remove(sp); ctx.burst([p.x, 0.2, p.z], { color: 0x7a5536, n: 8 });
          p.planted = true; p.s = 0.02; ctx.tween(p, { s: 0.3 }, 0.5, 'outBack'); growUntil = ctx.time + 0.7; planted++; if (planted < 6) ctx.goal('🌱', 'Plant ' + (6 - planted) + ' more', guide);
        } });
      }
      await ctx.until(() => planted >= 6);
      ctx.drop(); ctx.remove(seedCrate); done(); ctx.emote(dog, '💛', { y: 1.1 });
      ctx.thank('🌱', ['Seed-potato growers', 'Farmers', 'Soil scientists']);
      // water
      say(farmer, 'Now they need a drink! 💧');
      goal('💧', 'Turn on the water', valve);
      await use({ at: valve, icon: '💧', label: 'Turn', y: 1.6 });
      ctx.tween(valve.children[1].rotation, { z: 6 }, 1.2); sprinkling = true; fanSpeed = 5; ctx.fact('💦', 'A potato is mostly water, so the plants drink a lot.');
      const f = ctx.focus([-1, -6.2], 4.4, { dist: 17, pitch: 0.75 });
      let sprI = 0; const spray = ctx.every(0.16, () => { const z = SPR[sprI++ % 3]; ctx.burst([-6.9 + Math.random() * 1.5, 1.3, z + (Math.random() - 0.5)], { color: 0x7fc8ff, n: 5, speed: 2.8, size: 0.16 }); ctx.burst([-5.5 + Math.random() * 11.5, 1.4, -1 - Math.random() * 10.5], { color: 0x7fc8ff, n: 6, speed: 1.4, size: 0.16 }); });
      const ws = ctx.every(0.5, () => ctx.audio.play('water'));
      await ctx.wait(0.8); growTo(0.55, 2.8); await f; spray(); ws(); sprinkling = false; fanSpeed = 0.6; done();
      ctx.thank('💧', ['Irrigation crews', 'Well drillers', 'Weather forecasters']);
      // sunshine: the plants get bushy and bloom
      await ctx.wait(1.0); goal('☀️', 'Watch them grow');
      const f2 = ctx.focus([0, -6.2], 4.0, { dist: 15, pitch: 0.7 }); ctx.audio.play('sparkle'); growTo(1.0, 2.2, 0); await ctx.wait(2.2); flowerIM.visible = true; growTo(1.0, 1.0, 1); ctx.audio.play('pop'); await f2;
      ctx.fact('🌸', 'Potato plants bloom on top — the potatoes hide below.');
      // beetles!
      await ctx.wait(1.2);
      for (const b of beetles) { b.o.visible = true; b.st = 1; b.o.position.set(b.p.x, 5, b.p.z); ctx.tween(b.o.position, { y: 0.8 }, 0.7, 'in'); ctx.audio.play('buzz'); await ctx.wait(0.18); }
      say(farmer, 'Beetles munch the leaves. Shoo! 🐞'); let shooed = 0;
      goalTo('🐞', 'Shoo 5 beetles', () => nearest(beetles.filter(b => b.st === 1).map(b => [b.p.x, b.p.z])));
      const stopShoo = ctx.onUpdate(() => { if (ctx.locked) return; for (const b of beetles) if (b.st === 1 && dist(b.p.x, b.p.z) < 1.45) { b.st = 2; b.t = 0; b.o.userData.wings.visible = true; shooed++; ctx.audio.play('buzz'); ctx.emote(b.o, '💨', { y: 0.6 }); ctx.burst([b.p.x, 0.9, b.p.z], { color: 0x5fae4f, n: 6, speed: 1.5 }); if (shooed < 5) ctx.goal('🐞', 'Shoo ' + (5 - shooed) + ' more', guide); } });
      await ctx.until(() => shooed >= 5); stopShoo(); done(); goal('👍', 'Well done!'); farmer.userData.forceAnim = 'clap'; ctx.after(1.6, () => { farmer.userData.forceAnim = null; }); await ctx.wait(1.8);
      // time passes
      await ctx.chapter({ title: 'About 3 months later…', emoji: '🍂', env: 'autumn', setup: () => {
        const tint = new THREE.Color(7.5, 1.3, 1.6); for (let k = 0; k < NP; k++) { plants[k].f = 0; plantIM.setColorAt(k, tint); } plantIM.instanceColor.needsUpdate = true; refresh(); flowerIM.visible = false;
        farmer.position.set(-7.2, 0, 3.6); farmer.rotation.y = 1.2;
      } });
      // dig three plants by hand
      say(farmer, 'The tops are dry. Time to dig! ⛏️');
      let dug = 0, got = 0; const NEED = 3, loose = [];
      goalTo('⛏️', 'Dig up 3 plants', () => loose.length && dug >= NEED ? nearest(loose.filter(o => o.parent).map(o => [o.position.x, o.position.z])) : nearest(own.filter(p => p.alive).map(p => [p.x, p.z])));
      const digs = own.map(p => ctx.interact({ at: [p.x, p.z], face: [p.x, p.z], r: 1.45, y: 1.5, icon: '⛏️', label: 'Dig', hold: 0.7, sfx: 'dig', when: () => dug < NEED, onUse: async () => {
        dug++; if (dug === 1) ctx.fact('🍂', 'Dry tops mean the potatoes below have finished growing.'); await ctx.act('dig', 0.7); ctx.audio.play('dig'); ctx.burst([p.x, 0.2, p.z], { color: 0x7a5536, n: 10 }); p.alive = false; refresh();
        const items = []; for (let i = 0; i < 4; i++) { const o = ctx.add(M.potato(1.5, i % 2 ? 0xd9b27a : 0xe0bc86, i)); o.position.set(p.x, 0.1, p.z); items.push(o); loose.push(o); looseSpuds.push(o); ctx.after(0.5, () => { o.userData.landed = true; }); const a = i * 1.57 + dug, d = 1.0 + (i % 2) * 0.5; ctx.tween(o.position, { x: p.x + Math.cos(a) * d, z: p.z + Math.sin(a) * d }, 0.45, 'out'); ctx.tween(o.position, { y: 0.9 }, 0.22, 'out').then(() => ctx.tween(o.position, { y: 0.12 }, 0.23, 'in')); }
        await ctx.wait(0.5); ctx.collect({ items, spin: false, r: 1.1, onEach: () => { got++; ctx.emote(PL, '🥔'); } });
        if (dug < NEED) ctx.goal('⛏️', 'Dig ' + (NEED - dug) + ' more', guide); else ctx.goal('🥔', 'Pick them all up', guide);
      } }));
      await ctx.until(() => got >= NEED * 4); digs.forEach(d => d.remove()); done();
      ctx.fact('🥔', 'One seed potato grew a whole bunch of new ones!');
      // the harvester: you drive, the digger lifts the rest
      say(farmer, 'Phew! The harvester is faster 🚜');
      goal('🚜', 'Drive the harvester', [9.6, 5.0]);
      await use({ at: [10.2, 5.0], icon: '🚜', label: 'Drive', y: 2.8, r: 3.0 });
      ctx.lock(); PL.visible = false; ctx.cam.target = { at: rig, dist: 17, pitch: 0.62 }; const eng0 = ctx.every(0.45, () => ctx.audio.play('engine'));
      await ctx.moveAlong(rig, [[11.5, 3.2], [8.0, 0.6]], 5); eng0();
      ctx.tp(rig.position.x, rig.position.z, rig.rotation.y); ctx.cam.target = null; const sp0 = ctx.speed; ctx.speed = 5.2; ctx.cam.dist = 15; ctx.cam.pitch = 0.62; ctx.bounds(-5.5, -12.5, 8.6, 2.0); driving = true; heap.visible = true; ctx.unlock();
      const alive = () => plants.filter(p => p.alive && p.planted); const total = alive().length; let lifted = 0, flying = 0, lx = PP.x, lz = PP.z, engT = 0;
      goalTo('🥔', 'Harvest every row', () => nearest(alive().map(p => [p.x, p.z])));
      const lift = (p) => { p.alive = false; lifted++; if (lifted === 16) ctx.fact('🚜', 'A harvester lifts potatoes and shakes off the soil.'); ctx.burst([p.x, 0.3, p.z], { color: 0x7a5536, n: 5, size: 0.22 }); heap.scale.y = 0.05 + 0.95 * lifted / total;
        if (flying < 7) { flying++; const o = ctx.add(M.potato(1.5, 0xc9a26b, lifted)); o.position.set(p.x, 0.3, p.z); const to = rig.localToWorld(new THREE.Vector3(0, 2.3, -4.7)); hop(o, [to.x, to.y, to.z], 1.2, 0.45).then(() => { ctx.remove(o); flying--; ctx.audio.play('pop'); }); } };
      const stopDrive = ctx.onUpdate((dt) => {
        rig.position.x = PP.x; rig.position.z = PP.z; rig.rotation.y = PL.rotation.y; const mv = Math.hypot(PP.x - lx, PP.z - lz); lx = PP.x; lz = PP.z;
        const s = Math.sin(rig.rotation.y), c = Math.cos(rig.rotation.y); let any = false;
        for (const p of plants) { if (!p.alive || !p.planted) continue; const dx = p.x - PP.x, dz = p.z - PP.z, al = dx * s + dz * c, la = dx * c - dz * s; if (al > -2.2 && al < 1.3 && Math.abs(la) < 1.3) { lift(p); any = true; } }
        if (any) refresh(); engT -= dt; if (mv > 0.01 && engT <= 0) { engT = 0.45; ctx.audio.play('engine'); }
      });
      await ctx.until(() => lifted >= total - 4);
      ctx.lock(); stopDrive(); driving = false; for (const p of alive()) lift(p); refresh(); goal('🚚', 'Fill the truck'); ctx.audio.play('success'); dg.mode = 'stay'; dg.tx = 8.6; dg.tz = 1.6;
      ctx.cam.target = { at: rig, dist: 18, pitch: 0.6 }; const eng = ctx.every(0.45, () => ctx.audio.play('engine'));
      await ctx.moveAlong(rig, [[8.4, -0.5], [8.4, -9.6]], 6.5); eng();
      ctx.cam.target = { at: [10, 1.5, -5.5], dist: 12, pitch: 0.5 };
      const bed = truck1.userData.bed; for (let i = 0; i < 16; i++) { const o = ctx.add(M.potato(1.7, i % 2 ? 0xc9a26b : 0xd2ac74, i)); const from = rig.localToWorld(new THREE.Vector3(0, 2.2, -4.7)); o.position.copy(from); const to = [11.5 + (i % 4 - 1.5) * 0.45, 1.08 + Math.floor(i / 8) * 0.2, -5.5 + (Math.floor(i / 4) % 2 ? 0.5 : -0.4) + (i % 3) * 0.2 - 1 + (i % 5) * 0.45];
        hop(o, to, 1.6, 0.5).then(() => { truck1.attach(o); }); ctx.audio.play('pop'); heap.scale.y = Math.max(0.05, 1 - (i + 1) / 16); await ctx.wait(0.11); }
      await ctx.wait(0.6); heap.visible = false; done();
      ctx.cam.target = null; ctx.cam.dist = 9; ctx.cam.pitch = 0.45; ctx.speed = sp0; ctx.tp(9.2, -1.6, Math.PI); PL.visible = true; ctx.collideBox(8.4, -8.2, 2.9, 7.6); ctx.bounds(-8.0, -14.4, 9.6, 8); ctx.unlock(); dg.mode = 'follow';
      ctx.thank('🚜', ['Farm workers', 'Harvester drivers', 'Tractor mechanics']);
      goal('🚚', 'Ride to the shed', [10.2, -4.2]);
      await use({ at: truck1, icon: '🚚', label: 'Hop in', y: 2.8, r: 4.9 });
      ctx.lock(); PL.visible = false; ctx.audio.play('honk'); ctx.bounds(null); dg.mode = 'stay'; dg.tx = 9.4; dg.tz = -1.0; const eng2 = ctx.every(0.45, () => ctx.audio.play('engine')); ctx.moveAlong(truck1, [[11.5, -50]], 9); await ctx.wait(1.7); eng2();
    }

    // ---------- 2 · the packing shed ----------
    async function chShed() {
      await ctx.chapter({ n: 2, title: 'The Packing Shed', emoji: '🏭', env: ['factory', { ground: 0x9a958a, fog: [40, 90] }], at: [X2 - 6, 0.5], face: Math.PI, music: 'factory', cam: { yaw: 0, pitch: 0.35, dist: 10.5 }, setup: () => showZone(2) });
      zone = 2; plantIM.visible = false; flowerIM.visible = false; PL.visible = true; ctx.unlock(); ctx.bounds(X2 - 14, -12.4, X2 + 14, 4.8);
      const dirty = 0x7a5a3c, clean = 0xe0b878, belt = [];
      for (let i = 0; i < 9; i++) { const isRock = i === 2 || i === 5 || i === 7; const o = isRock ? group([P.rock({ s: 0.5, color: 0x777777 })]) : group([M.potato(1.6, dirty, i)]); o.position.set(X2 - 8.7 + i * 0.42, BY, BZ + (i % 2 ? 0.17 : -0.17)); o.userData.rock = isRock; ctx.add(o); belt.push(o); }
      say(w1, 'Muddy! Give them a wash 🚿');
      goal('🚿', 'Pull the lever', [X2 - 9.2, -3.7]);
      await use({ at: [X2 - 9.2, -3.7], face: [X2 - 9.2, -3.7], icon: '🚿', label: 'Pull', y: 1.9 });
      ctx.lock(); ctx.tween(stick2.rotation, { z: -0.6 }, 0.3); ctx.audio.play('machine'); brushSpin = 14; ctx.fact('🌙', 'Potatoes can wait months in cool, dark sheds before washing.');
      const f = ctx.focus([X2 - 5, 1.6, BZ], 3.6, { dist: 9, pitch: 0.32 });
      const spray = ctx.every(0.08, () => ctx.burst([X2 - 5 + (Math.random() - 0.5), 2.3, BZ], { color: 0x7fc8ff, n: 4, speed: 0.8, size: 0.15, y: 0 })); const sfxW = ctx.every(0.5, () => ctx.audio.play('water'));
      const stopBelt = ctx.onUpdate((dt) => { for (const o of belt) { o.position.x += dt * 2.4; if (!o.userData.washed && o.position.x > X2 - 5) { o.userData.washed = true; if (!o.userData.rock) { o.children[0].material = mat(clean); ctx.burst(o.position, { color: 0x7a5a3c, n: 3, size: 0.12, y: 0.2 }); } } } });
      await ctx.until(() => belt[0].position.x > X2 - 1.6); stopBelt(); spray(); sfxW(); brushSpin = 0; await f; ctx.unlock(); done();
      // sort: toss out the rocks
      let tossed = 0; const rocks = belt.filter(b => b.userData.rock); say(w2, 'Rocks sneak in. Toss them! ✋');
      goalTo('🗑️', 'Toss out 3 rocks', () => nearest(rocks.filter(o => !o.userData.out).map(o => [o.position.x, -4.9])));
      for (const o of rocks) ctx.interact({ at: o, r: 2.1, y: 0.9, icon: '✋', label: 'Toss', onUse: async () => { o.userData.out = true; tossed++; if (tossed < 3) ctx.goal('🗑️', 'Toss ' + (3 - tossed) + ' more', guide); await hop(o, [X2 + 0.8, 0.9, -2.2], 1.4, 0.5); ctx.audio.play('thud'); ctx.remove(o); } });
      await ctx.until(() => tossed >= 3); done(); goal('🥔', 'Fill the sack');
      // belt runs: clean potatoes drop into the sack on the scale
      const sackObj = group([P.sack()], [X2 + 8.3, 0.36, BZ]); sackObj.scale.set(1, 0.3, 1); ctx.add(sackObj);
      const spuds = belt.filter(b => !b.userData.rock); ctx.audio.play('machine'); let inSack = 0;
      await Promise.all(spuds.map(async (o, i) => { await ctx.wait(i * 0.22); await ctx.tween(o.position, { x: X2 + 7.1 }, (X2 + 7.1 - o.position.x) / 5, 'linear'); await hop(o, [X2 + 8.3, 1.0, BZ], 0.5, 0.3); ctx.audio.play('pop'); ctx.remove(o); inSack++; sackObj.scale.y = 0.3 + 0.7 * inSack / spuds.length; needle2.rotation.z = 2.2 - 3.3 * inSack / spuds.length; }));
      ctx.audio.play('ding'); ctx.emote(sackObj, '✅', { y: 1.3 });
      goal('🥔', 'Sew the sack shut', [X2 + 8.3, -3.9]);
      await use({ at: [X2 + 8.3, -3.9], face: [X2 + 8.3, BZ], icon: '✋', label: 'Sew', sfx: 'click', y: 1.9, r: 2.3 });
      await G.stitchGame(ctx);   // mini-game: stitch the sack shut on the dots
      ctx.lock(); ctx.fact('🕶️', 'Sacks keep out light — sunlight turns potatoes green.'); PL.userData.forceAnim = 'sew'; for (let i = 0; i < 4; i++) { ctx.audio.play('stitch'); ctx.burst([X2 + 8.3, 1.25, BZ + 0.2], { color: 0xffffff, n: 2, speed: 0.5, size: 0.1, y: 0 }); await ctx.wait(0.22); } PL.userData.forceAnim = null;
      sackObj.add(at(sign('🥔', 0.32, { bg: null }), 0, 0.42, 0.27)); sackObj.add(box(0.22, 0.03, 0.03, 0x8a3b1e, [0, 0.8, 0.13])); ctx.unlock(); done();
      ctx.thank('🏭', ['Washers', 'Sorters', 'Packers', 'Machine builders']);
      goal('💪', 'Lift the sack', [X2 + 8.3, -3.9]);
      await use({ at: [X2 + 8.3, -3.9], face: [X2 + 8.3, BZ], icon: '💪', label: 'Lift', y: 1.9, r: 2.3 });
      needle2.rotation.z = 2.2; ctx.carry(sackObj, { y: -0.55 }); sackObj.rotation.x = -0.15; /* hugged against the chest, its top below the chin */ goal('🚚', 'Load the truck', [X2 + 7.6, 1.5]);
      await use({ at: [X2 + 8.2, 1.5], face: [X2 + 11.8, 1.5], icon: '🚚', label: 'Load & go', y: 2.6, r: 2.6 });
      const sk = ctx.drop(); truck2.userData.bed.add(sk); sk.position.set(0.3, 1.4, -1.2); sk.rotation.set(0, 0, 0); ctx.lock(); await hop(sk, [0.2, 0, -0.9], 0.5, 0.35); ctx.audio.play('thud'); await ctx.wait(0.3);
      PL.visible = false; ctx.audio.play('honk'); ctx.bounds(null); ctx.moveAlong(truck2, [[X2 + 45, 1.5]], 9); await ctx.wait(1.5);
    }

    // ---------- 3 · the market ----------
    async function chMarket() {
      await ctx.chapter({ n: 3, title: 'The Market', emoji: '🛒', env: ['indoor', { ground: 0xd9d4c6, top: '#e9e4d6', bottom: '#f6f2e8', fog: false }], at: [X3 + 3.6, 2.4], face: Math.PI, music: 'town', cam: { yaw: 0, pitch: 0.4, dist: 10.5 }, setup: () => showZone(3) });
      zone = 3; PL.visible = true; ctx.unlock(); ctx.bounds(X3 - 12.6, -11.8, X3 + 12.4, 4.8);
      ctx.thank('🚚', ['Truck drivers', 'Warehouse crews', 'Stockers']);
      // fill a bag
      let n = 0, busy = false; const SPOT = [X3 + 1.4, -5.3], BAG_Y = -0.32;   // the bag is held between the hands with its top below the chin
      goal('🥔', 'Fill your bag', SPOT);
      const fill = ctx.interact({ at: SPOT, face: [X3 + 1, -6.5], r: 2.3, y: 1.9, icon: '🥔', label: 'Pick', once: false, when: () => !busy && n < 5, onUse: async () => { busy = true; const o = standSpuds[n]; await hop(o, [paperBag.position.x, 1.5, paperBag.position.z], 0.5, 0.3); ctx.audio.play('pop'); ctx.remove(o); paperBag.scale.y = 1 + (n + 1) * 0.03; n++; if (n === 1) ctx.fact('🌈', 'There are thousands of kinds of potatoes — even purple ones!'); if (n < 5) ctx.goal('🥔', (5 - n) + ' more', SPOT); busy = false; } });
      await ctx.until(() => n >= 5 && !busy); fill.remove(); paperBag.add(ball(0.2, 0.1, 0.13, 0xc9a26b, [0, 0.52, 0])); done();
      await ctx.wait(0.25); ctx.carry(paperBag, { y: BAG_Y });
      // weigh it
      goal('⚖️', 'Weigh the bag', [X3 + 6.2, -0.9]);
      await use({ at: [X3 + 6.2, -0.9], face: [X3 + 6.2, -1.8], icon: '⚖️', label: 'Weigh', y: 2.0, r: 2.2 });
      ctx.lock(); const bg = release(); await hop(bg, [X3 + 6.2, 1.06, -1.8], 0.4, 0.35); ctx.audio.play('thud');
      await ctx.tween(needle3.rotation, { z: -0.9 }, 0.5, 'outBack'); await ctx.tween(needle3.rotation, { z: -0.5 }, 0.25); ctx.audio.play('ding'); ctx.emote(bg, '✅', { y: 0.9 }); await ctx.wait(0.9); ctx.carry(bg, { y: BAG_Y }); ctx.tween(needle3.rotation, { z: 2.2 }, 0.4); ctx.unlock(); done();
      // pay
      goal('💵', 'Pay the cashier', [X3 - 7.5, -0.6]);
      await use({ at: [X3 - 7.5, -0.6], face: [X3 - 9.9, -0.4], icon: '💵', label: 'Pay', y: 2.0, r: 2.3 });
      ctx.lock(); const b2 = release(); await hop(b2, [X3 - 8.6, 1.07, -1.6], 0.4, 0.35); await ctx.tween(b2.position, { z: 0.0 }, 0.7, 'linear'); ctx.audio.play('beep'); cashier.userData.forceAnim = 'work'; await ctx.wait(0.5); ctx.audio.play('register'); cashier.userData.forceAnim = null;
      say(cashier, 'Happy Thanksgiving! ❤️', 2.2); await ctx.wait(0.8); ctx.unlock(); ctx.carry(b2, { y: BAG_Y }); done();
      ctx.thank('🛒', ['Cashiers', 'Grocers', 'The shopper in your family']);
      goal('🏡', 'Head home', [X3 - 12, 2.4]);
      await new Promise(res => ctx.zone({ x: X3 - 11.6, z: 2.4, r: 2.2, onEnter: res }));
      ctx.lock(); ctx.audio.play('bell'); await ctx.wait(0.3);
    }

    // ---------- 4 · the home kitchen ----------
    async function chKitchen() {
      ctx.bounds(null); const bag = ctx.drop(); if (bag) ctx.remove(bag);
      await ctx.chapter({ n: 4, title: 'Home Kitchen', emoji: '🏡', env: ['indoor', { ground: 0xb98a5e, top: '#f7e3a1', bottom: '#fbf0cf', fog: false }], at: [X4 + 0.5, -1.6], face: Math.PI, music: 'table', cam: { yaw: 0, pitch: 0.45, dist: 9 }, setup: () => showZone(4) });
      zone = 4; PL.visible = true; ctx.unlock(); ctx.bounds(X4 - 7.3, -6.0, X4 + 7.3, 3.5);
      say(grandma, "Let's make them fluffy! 😊");
      const spot = (x) => [X4 + x, KY, KZ + 0.1];
      // peel: one press per potato
      const raw = [0, 1, 2, 3].map(i => { const o = ctx.add(M.potato(1.5, 0x9a6b43, i * 0.8)); o.position.set(BOARD[0] - 0.42 + i * 0.28, BOARD[1], BOARD[2]); return o; });
      let peeled = 0; goal('🔪', 'Peel 4 potatoes', spot(-2.2));
      const peelIt = ctx.interact({ at: spot(-2.2), face: [BOARD[0], BOARD[2]], r: 2.3, y: 0.9, icon: '🔪', label: 'Peel', once: false, sfx: 'snip', when: () => peeled < 4, onUse: () => { const o = raw[peeled]; o.material = mat(0xf3e2a0); o.scale.multiplyScalar(0.92);
        const curl = ctx.add(torus(0.09, 0.025, 0x9a6b43, [o.position.x, o.position.y + 0.15, o.position.z], [1.2, 0, 0], 8)); hop(curl, [X4 - 3.6, KY + 0.12, KZ + 0.1], 0.6, 0.4).then(() => ctx.remove(curl)); ctx.burst(o.position, { color: 0x9a6b43, n: 4, size: 0.1, y: 0.1 }); peeled++; if (peeled < 4) ctx.goal('🔪', 'Peel ' + (4 - peeled) + ' more', spot(-2.2)); } });
      await ctx.until(() => peeled >= 4); peelIt.remove(); ctx.fact('⏱️', 'Small pieces cook faster than whole potatoes.');
      // chop
      goal('🔪', 'Chop them up', spot(-2.2));
      await use({ at: spot(-2.2), face: [BOARD[0], BOARD[2]], icon: '🔪', label: 'Chop', hold: 1.0, sfx: 'knock', y: 0.9, r: 2.3 });
      ctx.lock(); PL.userData.forceAnim = 'work'; const cubes = [];
      for (let i = 0; i < 4; i++) { knife.position.set(raw[i].position.x, KY + 0.5, KZ + 0.0); await ctx.tween(knife.position, { y: KY + 0.12 }, 0.12, 'in'); ctx.audio.play('knock'); const p = raw[i].position; ctx.remove(raw[i]);
        const c = bake(group([0, 1, 2].map(k => box(0.14, 0.14, 0.14, 0xf3e2a0, [(k - 1) * 0.09, 0.07 + (k === 1 ? 0.12 : 0), (k % 2) * 0.1 - 0.05], [0, k, 0])))); ctx.add(c, p.x, p.z); c.position.y = BOARD[1]; cubes.push(c); await ctx.tween(knife.position, { y: KY + 0.45 }, 0.1); }
      PL.userData.forceAnim = null; knife.position.set(X4 - 1.3, KY + 0.05, KZ + 0.2); await ctx.wait(0.3); ctx.unlock(); done();
      // boil
      const tray = group([]); cubes.forEach((c, i) => { c.position.set((i - 1.5) * 0.2, 0, 0); tray.add(c); }); ctx.add(tray); ctx.carry(tray, { y: 0.06 }); goal('🍲', 'Boil them', spot(4.5));
      await use({ at: spot(4.5), face: [POT[0], POT[2]], icon: '🍲', label: 'Boil', y: 0.9, r: 2.4 });
      ctx.lock(); const tr = release(); await hop(tr, [POT[0], POT[1] + 0.5, POT[2]], 0.6, 0.4); ctx.audio.play('splash'); ctx.burst([POT[0], 1.7, POT[2]], { color: 0x9fd6f2, n: 10, speed: 1.5 }); ctx.remove(tr);
      const steam = ctx.every(0.22, () => { ctx.burst([POT[0] + (Math.random() - 0.5) * 0.4, 1.75, POT[2]], { color: 0xffffff, n: 2, speed: 0.3, size: 0.28, y: 0 }); }); const bub = ctx.every(0.4, () => ctx.audio.play('bubble'));
      goal('⏲️', 'Bubble, bubble…'); const f = ctx.focus([POT[0], 1.6, POT[2]], 4.0, { dist: 6.0, pitch: 0.3 }); await ctx.wait(1.3);
      const fork = ctx.add(bake(group([box(0.05, 0.5, 0.03, C.metal, [0, 0.45, 0]), box(0.16, 0.04, 0.03, C.metal, [0, 0.2, 0]), box(0.03, 0.2, 0.03, C.metal, [-0.06, 0.1, 0]), box(0.03, 0.2, 0.03, C.metal, [0, 0.1, 0]), box(0.03, 0.2, 0.03, C.metal, [0.06, 0.1, 0])])), POT[0], POT[2]); fork.position.y = 2.6; const chunk = box(0.14, 0.14, 0.14, 0xf3e2a0, [0, 0.02, 0]); chunk.visible = false; fork.add(chunk);
      await ctx.tween(fork.position, { y: 1.62 }, 0.45, 'in'); ctx.audio.play('pop'); chunk.visible = true; ctx.fact('🍴', 'They are ready when a fork slides in easily.'); await ctx.tween(fork.position, { y: 2.3 }, 0.5, 'out'); ctx.emote(fork, '✅', { y: 0.4 }); await ctx.wait(0.9); ctx.remove(fork);
      await f; bub(); ctx.unlock(); done();
      // mash: tap, tap, tap
      potFill.material = mat(0xf0dc9a); potFill.scale.y = 5; potFill.position.y = 0.36;
      const masher = ctx.add(bake(group([cyl(0.025, 0.025, 0.6, 0x8a5a2b, [0, 0.4, 0], null, 5), cyl(0.16, 0.16, 0.04, C.metal, [0, 0.08, 0], null, 8)])), POT[0], POT[2]); masher.position.y = 1.75;
      let mash = 0; const NM = 5; say(grandma, 'Mash, mash, mash! 💪'); goal('🥄', 'Mash, mash, mash!', spot(4.5));
      const mashIt = ctx.interact({ at: spot(4.5), face: [POT[0], POT[2]], r: 2.4, y: 1.0, icon: '🥄', label: 'Mash!', once: false, sfx: 'thud', when: () => mash < NM, onUse: () => { mash++; ctx.stopTweens && ctx.stopTweens(masher.position); masher.position.y = 1.75; ctx.tween(masher.position, { y: 1.5 }, 0.08).then(() => ctx.tween(masher.position, { y: 1.75 }, 0.14)); ctx.burst([POT[0], 1.72, POT[2]], { color: 0xfbefb8, n: 3, speed: 0.9, size: 0.14 }); ctx.act('work', 0.15); const k = mash / NM; potFill.material = mat(k < 0.5 ? 0xf2e0a2 : k < 1 ? 0xf6e8b0 : 0xfbf0c0); if (mash < NM) ctx.goal('🥄', (NM - mash) + ' more!', spot(4.5)); } });
      await ctx.until(() => mash >= NM); mashIt.remove(); steam();
      ctx.thank('🥛', ['Dairy farmers', 'Home cooks', 'Dish washers']);
      goal('🥛', 'Butter and milk', spot(4.5));
      await use({ at: spot(4.5), face: [POT[0], POT[2]], icon: '🥛', label: 'Add', y: 1.0, r: 2.4 });
      ctx.lock(); const pat = ctx.add(box(0.28, 0.14, 0.17, 0xffdf5a, [butterK.position.x, KY + 0.11, butterK.position.z])); await hop(pat, [POT[0], 1.72, POT[2]], 0.7, 0.45); ctx.audio.play('pop'); ctx.tween(pat.scale, { x: 1.6, y: 0.1, z: 1.6 }, 0.8).then(() => ctx.remove(pat));
      await G.pourGame(ctx); ctx.fact('🥛', 'Add milk a little at a time — too much makes soup!');   // mini-game: hold to pour, stop in the green
      await hop(milkK, [POT[0] - 0.55, KY + 0.8, POT[2]], 0.4, 0.4); await ctx.tween(milkK.rotation, { z: -1.5 }, 0.25); ctx.audio.play('pour'); const pr = ctx.every(0.06, () => ctx.burst([POT[0] - 0.15, 2.0, POT[2]], { color: 0xffffff, n: 2, speed: 0.2, size: 0.16, y: 0 })); await ctx.wait(0.7); pr(); await ctx.tween(milkK.rotation, { z: 0 }, 0.2); hop(milkK, [X4 + 3.0, KY, KZ - 0.1], 0.4, 0.4);
      ctx.remove(masher); await ctx.wait(0.3); done();
      const bowl = group([lathe([[0.0, 0], [0.3, 0.02], [0.5, 0.3], [0.52, 0.34]], 0xfafafa), ball(0.44, 0.22, 0.44, 0xfbefb8, [0, 0.3, 0]), ball(0.2, 0.12, 0.2, 0xfdf6d8, [0.05, 0.46, 0.02]), box(0.14, 0.04, 0.14, 0xffd84a, [0.05, 0.57, 0])], [POT[0], 1.7, POT[2]]); bake(bowl); ctx.add(bowl);
      pop(bowl, 1, 0.5); potFill.visible = false; await hop(bowl, [X4 + 1.2, KY, KZ + 0.15], 0.6, 0.5); ctx.audio.play('success'); ctx.unlock(); grandma.userData.forceAnim = 'clap'; const stopClap = ctx.after(1.5, () => { grandma.userData.forceAnim = null; });
      goal('🥔', 'Take the bowl', bowl);
      await use({ at: bowl, icon: '🥔', label: 'Pick up', y: 0.8, r: 2.4 });
      ctx.carry(bowl, { y: -0.1 }); bowl.position.z = 0.08; ctx.tween(bowl.scale, { x: 0.64, y: 0.64, z: 0.64 }, 0.2); /* now it fits between the hands, below the chin and clear of the chest */ goal('🦃', 'To the table!'); ctx.lock(); await ctx.tween(PL.rotation, { y: 0 }, 0.3); ctx.unlock();   // turn to the camera and show it off
      ctx.tween(grandma.position, { x: PP.x - 1.35, z: PP.z - 0.1 }, 0.35); grandma.rotation.y = 0.3; stopClap(); grandma.userData.forceAnim = 'cheer';   // beside the player, out of the camera's way
      const fin = ctx.focus(PL, 2.6, { dist: window.innerHeight < 480 ? 7.8 : 5.0, pitch: 0.5 });   // a sideways phone is short: stand back a little so the faces are not under the goal chip ctx.audio.play('sparkle'); ctx.emote(grandma, '❤️', { y: 2.0 });
      const puff = ctx.every(0.2, () => ctx.burst([PP.x + (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.1), 1.2, PP.z + 0.53], { color: 0xffffff, n: 1, speed: 0.2, size: 0.1, y: 0 })); ctx.after(0.6, () => ctx.emote(bowl, '✨', { y: 0.6 }));
      await fin; puff();
      ctx.finish();
    }

    const chapters = [chField, chShed, chMarket, chKitchen];
    ctx.tp(0, 4.6, Math.PI);
    ctx.onStart(async () => {
      // (for testing: ?potch=3 starts at chapter 3)
      let from = 0; try { from = Math.max(0, Math.min(3, (+new URLSearchParams(location.search).get('potch') || 1) - 1)); } catch (e) {}
      if (from > 0) plantIM.visible = false; if (from > 0) step = [0, 6, 9, 12][from];
      ctx.progress(step, TOTAL);
      for (let i = from; i < chapters.length; i++) await chapters[i]();
    });
  },
};
