// Grandma's Tablecloth — a family story across 170 years.
// Flax field → spinner & weaver → Anna's cottage (embroidery) → the Atlantic → the plains → a Utah home through the generations → 2026.
// Pattern: every zone is built up-front (static scenery baked), then the story is told as one async function.
import { THREE, C, box, cyl, sphere, ball, cone, torus, plane, disc, group, mat, glow, bake, emojiSprite, picture, person, seeded, lathe } from '../core/kit.js';
import * as P from '../core/props.js';
import { FLAX_GREEN, FLAX_BLUE, STRAW, FIBRE, LINEN_RAW, LINEN, flaxClump, flaxPlants, sheaf, strick, clothTexture, tableCloth, foldedCloth, embroideryGame, coveredWagon, ox, plaque, floorMesh, wallMesh, plankTex, stoneTex, seaTex, swell, grain } from './tablecloth-kit.js';
import { treadleGame, geeHawGame, hackleGame } from './tablecloth-games.js';

const STONE = 0xa39d90, THATCH = 0xc9a64a, PLASTER = 0xefe4cc, TIMBER = 0x5a3d24;
const put = (o, x, y, z, ry) => { o.position.set(x, y, z); if (ry !== undefined) o.rotation.y = ry; return o; };
// people of 1853
const ANNA = { dress: 0x3f6a8a, shirt: 0x3f6a8a, apron: C.cream, hairStyle: 'bun', hair: C.hair[2], skin: C.skin[0], expressive: true }; // Anna looks the same in every scene
const woman = (o = {}) => Object.assign({ dress: 0x6b7fa8, shirt: 0x6b7fa8, apron: C.cream, hairStyle: 'bun', hair: C.hair[2], skin: C.skin[0], expressive: true }, o);
const man = (o = {}) => Object.assign({ shirt: 0xe8dcc0, vest: 0x6e4a28, pants: 0x4a4038, hat: 'straw', hair: C.hair[0], skin: C.skin[1], expressive: true }, o);

export default {
  id: 'tablecloth', title: "Grandma's Tablecloth", emoji: '🧵', music: 'old',
  thanksLine: 'Made by one woman — made possible by thousands.',
  question: "Where did Grandma's tablecloth come from?",

  create(ctx) {
    const rnd = seeded(1853);
    const use = (o) => new Promise(res => ctx.interact(Object.assign({}, o, { onUse: res }))); // (where 'at' is only the spot to stand on, the interaction names the thing itself with face: [x, z], so the player turns to it when pressing)
    const sayLast = new Map(); // one bubble at a time per speaker: a new line waits until that person's previous bubble is gone
    const sayQ = (who, text, sec = 3.2) => { const z = curZone; const key = (window.innerWidth < 560 || window.innerHeight < 480) ? sayLast : who; /* on a phone-sized screen bubbles of different speakers would land on top of each other: there, one bubble at a time for everybody */ const n = (sayLast.get(key) || Promise.resolve()).then(() => (z === curZone && who.visible) ? ctx.say(who, text, sec) : null); sayLast.set(key, n); return n; }; // (a line that is still waiting when the scene changes is dropped)
    // "In real life" one-liners: never two within 12 s of each other (a line that comes too soon waits a little; it is dropped if it would be more than 8 s late, or if the scene has changed or a mini-game is open by then)
    let factAt = -99;
    const fact = (icon, text) => { const z = curZone, at = Math.max(ctx.time, factAt + 12); if (at > ctx.time + 8) return; factAt = at; const go = () => { if (z === curZone && !ctx.ui.panelOpen && !ctx.finished) ctx.fact(icon, text); }; if (at > ctx.time + 0.05) ctx.after(at - ctx.time, go); else go(); };
    const holding = (it) => ctx._active === it && ctx._holdT > 0.02; // true while the player is holding E on it
    // The people are the chunky rigid ones: a carried thing sits at the hands of the two straight, forward-pointing arms (about 1.0 m up, 0.45 m in front).
    // hold() carries it and nudges it up / forward so that it rests on the arms, clear of the chest and below the chin.
    const hold = (o, y = 0, z = 0, x = 0) => { ctx.carry(o); o.position.set(x, y, z); return o; };
    // A seated person's hips are 0.48 m up and the straight legs (underside 0.39 m up) point forward: seatY() lifts or lowers the person so the thighs rest on a seat whose top is 'top' metres high.
    const seatY = (p, top) => { p.position.y = top - 0.39 * p.scale.y; return p; };
    // things that move are registered per zone, so only the current zone's are drawn
    const dyn = [[], [], [], [], [], []]; let curZone = 0;
    const D = (zi, o) => { dyn[zi].push(o); o.visible = zi === curZone && !o.userData.hidden; return o; };
    const hide = (o) => { o.userData.hidden = true; o.visible = false; return o; };
    const show = (o) => { o.userData.hidden = false; o.visible = true; return o; };
    const statics = [[], [], [], [], [], []]; // each zone's baked scenery: only the current zone's is drawn (a zone's backdrop is big enough to be "in view" from its neighbours)
    const S = (zi, g) => { statics[zi].push(g); g.visible = zi === curZone; return g; };
    const showZone = (zi) => { curZone = zi; dyn.forEach((list, i) => list.forEach(o => { o.visible = i === zi && !o.userData.hidden; })); statics.forEach((list, i) => list.forEach(g => { g.visible = i === zi; })); };
    const grainFloor = (w, d, color, rep, y = 0.03) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color, map: grain(rep) })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m; };
    const cloth = clothTexture();

    // ============ ZONE 1 — flax field by a European village, 1853 (around 0,0) ============
    ctx.env('day');
    const z1 = new THREE.Group();
    for (let z = -3.25; z >= -15; z -= 0.7) z1.add(plane(17.3, 0.16, 0x735638, [0, 0.045, z])); // furrows between the sown rows
    { const spots = []; for (let z = -3.6; z >= -14.7; z -= 0.7) for (let x = -8.4; x <= 8.4; x += 0.58) spots.push([x + (rnd() - 0.5) * 0.32, z + (rnd() - 0.5) * 0.3, 0.85 + rnd() * 0.3]); z1.add(flaxPlants(rnd, spots)); } // the flax field: ~500 slender stems sown in rows
    z1.add(plane(46, 2.2, 0xc9b07a, [2, 0.03, 1.4])); z1.add(plane(2.4, 7, 0xc9b07a, [-17.6, 0.03, 4.6], 0.5)); // lane to the spinner's
    // Anna's stone cottage + village
    const cottage = P.building({ w: 8, h: 3, d: 6, color: STONE, roofColor: THATCH, doorColor: TIMBER, windows: 2 }); cottage.add(box(0.9, 2.2, 0.9, 0x8a847a, [2.6, 4.2, -1])); put(cottage, -15, 0, -17, 0.45); z1.add(cottage);
    for (const [x, z, ry, col, w] of [[20, -20, -0.5, PLASTER, 7], [31, -12, -0.9, 0xe6d5b0, 6], [-27, -8, 0.9, STONE, 6]]) { const h = P.building({ w, h: 3, d: 5.5, color: col, roofColor: x > 25 ? 0x9c5a3a : THATCH, doorColor: TIMBER, windows: 2 }); put(h, x, 0, z, ry); z1.add(h); }
    const church = group([box(5, 5, 8, STONE, [0, 2.5, 0]), box(2.6, 9, 2.6, STONE, [0, 4.5, 4.5]), cone(2.1, 4.5, 0x5f6f7f, [0, 11.2, 4.5], [0, Math.PI / 4, 0], 4), box(1, 1.8, 0.1, TIMBER, [0, 0.9, 5.82]), box(0.7, 1.2, 0.1, 0x9fd6f2, [0, 5.5, 5.82])]); put(church, 3, 0, -34, 0.1); z1.add(church);
    const mill = group([cyl(1.6, 2.4, 8, PLASTER, [0, 4, 0], null, 8), cone(2, 1.8, 0x7a4a2a, [0, 8.9, 0], null, 8), box(1, 1.8, 0.1, TIMBER, [0, 0.9, 2.32])]); put(mill, 14, 0, -27); z1.add(mill);
    z1.add(P.scatter(12, 110, 50, (r) => P.tree({ h: 4 + r() * 3, kind: r() < 0.25 ? 'pine' : 'round' }), { seed: 4, keep: (x, lz) => { const z = lz - 40; return z < -19 && Math.hypot(x - 3, z + 34) > 8 && Math.hypot(x - 14, z + 27) > 5 && Math.hypot(x + 15, z + 17) > 7 && Math.hypot(x - 20, z + 20) > 6; } }).translateZ(-40));
    z1.add(P.scatter(6, 30, 12, (r) => P.tree({ h: 3.5 + r() * 2 }), { seed: 9, keep: (x, z) => Math.abs(x) > 6 }).translateX(-37).translateZ(-2));
    z1.add(P.scatter(3, 16, 24, (r) => P.tree({ h: 3.5 + r() * 2, kind: 'fruit', fruit: C.red }), { seed: 12 }).translateX(36).translateZ(-2));
    z1.add(P.scatter(16, 44, 5, () => P.flower(), { seed: 8 }).translateZ(4.6));
    z1.add(P.scatter(6, 40, 4, () => P.bush({ s: 0.8 }), { seed: 15, keep: (x) => Math.abs(x) > 10 }).translateZ(-16.5));
    for (let i = 0; i < 4; i++) { const m = P.mountain({ h: 14 + (i % 2) * 6, color: 0x86b070, snow: false }); m.scale.set(2.2, 1, 1); m.position.set(-75 + i * 50, -1, -92); z1.add(m); }
    for (let x = -9.5; x <= 9.5; x += 1.02) z1.add(box(0.98, 0.55 + rnd() * 0.15, 0.5, rnd() < 0.5 ? 0x9a958a : 0x8a857a, [x, 0.3, -15.6])); // dry-stone wall
    // retting pond (right)
    const PX = 12.5, PZ = -7;
    z1.add(disc(3.4, 0x6f6250, [PX, 0.03, PZ])); for (let i = 0; i < 13; i++) { const a = i / 13 * 6.28; const r = P.rock({ s: 0.7 + rnd() * 0.5, ry: i }); r.position.set(PX + Math.cos(a) * 3.3, 0, PZ + Math.sin(a) * 3.1); z1.add(r); }
    for (let i = 0; i < 5; i++) z1.add(cyl(0.03, 0.03, 1.4, 0x5e9e44, [PX + 2.4 + (i % 2) * 0.3, 0.7, PZ - 2.2 + i * 0.25], [0.1 * i, 0, 0.1], 4)); // reeds
    // drying rack behind the pond
    const rack = group([box(0.12, 1.6, 0.12, C.wood, [-1.6, 0.8, 0]), box(0.12, 1.6, 0.12, C.wood, [1.6, 0.8, 0]), box(3.4, 0.1, 0.1, C.wood, [0, 1.55, 0])]); for (let i = 0; i < 5; i++) rack.add(cone(0.28, 1.3, STRAW, [-1.2 + i * 0.6, 0.85, 0], null, 6)); put(rack, 17.8, 0, -9.5, -0.5); z1.add(rack);
    // flax brake + combing bench (left)
    const BX = -12.5, BZ = -1.6;
    z1.add(group([box(0.14, 0.85, 0.5, C.wood, [-0.8, 0.43, 0]), box(0.14, 0.85, 0.5, C.wood, [0.8, 0.43, 0]), box(1.9, 0.1, 0.12, C.woodDark, [0, 0.88, -0.14]), box(1.9, 0.1, 0.12, C.woodDark, [0, 0.88, 0.14]), box(1.9, 0.06, 0.5, C.wood, [0, 0.2, 0])], [BX, 0, BZ]));
    const bench = group([box(1.6, 0.1, 0.5, C.wood, [0, 0.7, 0]), box(0.1, 0.7, 0.4, C.wood, [-0.7, 0.35, 0]), box(0.1, 0.7, 0.4, C.wood, [0.7, 0.35, 0]), box(0.5, 0.06, 0.3, C.woodDark, [0.3, 0.78, 0])]); for (let i = 0; i < 12; i++) bench.add(cone(0.02, 0.22, 0x555555, [0.12 + (i % 4) * 0.12, 0.9, -0.1 + Math.floor(i / 4) * 0.1], null, 4)); bench.add(ball(0.3, 0.1, 0.14, FIBRE, [-0.35, 0.82, 0])); put(bench, BX - 2.6, 0, BZ - 1.2, 0.4); z1.add(bench);
    const shed = P.building({ w: 5, h: 2.6, d: 3.5, color: 0x9a7a52, roof: 'shed', roofColor: THATCH, door: false, windows: 0 }); put(shed, -16.5, 0, -7.5, 0.5); z1.add(shed);
    for (let i = 0; i < 3; i++) { const s = sheaf(STRAW, false); put(s, -13.6 + i * 0.45, 0.2 + (i % 2) * 0.3, -5.6, 0.3 + i * 0.2); z1.add(s); }
    // lane-side details: a handcart of sheaves, a well, bushes
    const hc = group([box(1.8, 0.12, 1.0, C.wood, [0, 0.6, 0]), box(1.8, 0.3, 0.06, C.woodDark, [0, 0.8, 0.5]), box(1.8, 0.3, 0.06, C.woodDark, [0, 0.8, -0.5]), box(1.2, 0.06, 0.06, C.woodDark, [1.5, 0.66, 0.45]), box(1.2, 0.06, 0.06, C.woodDark, [1.5, 0.66, -0.45]), torus(0.45, 0.05, C.woodDark, [-0.2, 0.45, 0.58], null, 20), torus(0.45, 0.05, C.woodDark, [-0.2, 0.45, -0.58], null, 20)].concat([0.58, -0.58].flatMap(z => [0, 1, 2].map(i => box(0.04, 0.88, 0.03, C.wood, [-0.2, 0.45, z], [0, 0, i * Math.PI / 3]))))); for (let i = 0; i < 3; i++) { const s = sheaf(FLAX_GREEN); put(s, -0.3 + i * 0.3, 0.85 + (i % 2) * 0.2, -0.2 + i * 0.2, 0.3 * i); hc.add(s); } put(hc, -3.2, 0, 4.3, 0.4); z1.add(hc);
    z1.add(group([cyl(0.8, 0.84, 0.8, 0x9a958a, [0, 0.4, 0], null, 16), cyl(0.62, 0.62, 0.82, 0x3a4a5a, [0, 0.41, 0], null, 16), torus(0.72, 0.09, 0x8a857a, [0, 0.8, 0], [Math.PI / 2, 0, 0], 16), cyl(0.13, 0.11, 0.22, C.wood, [0.3, 1.5, 0], null, 8), box(0.1, 1.5, 0.1, C.wood, [-0.75, 1.4, 0]), box(0.1, 1.5, 0.1, C.wood, [0.75, 1.4, 0]), box(2.0, 0.1, 1.2, THATCH, [0, 2.3, 0.3], [0.5, 0, 0]), box(2.0, 0.1, 1.2, THATCH, [0, 2.3, -0.3], [-0.5, 0, 0]), cyl(0.06, 0.06, 1.5, C.woodDark, [0, 1.7, 0], [0, 0, Math.PI / 2], 5)], [7.5, 0, 4.6]));
    z1.add(P.scatter(6, 44, 2, (r) => P.bush({ s: 0.7 + r() * 0.5 }), { seed: 17, keep: (x) => Math.abs(x + 3.2) > 2.5 && Math.abs(x - 7.5) > 2 }).translateZ(7.6));
    const sp1 = P.signpost('🧵', { h: 2.4, size: 0.9 }); put(sp1, -19.3, 0, 3.2, 0.5); z1.add(sp1);
    S(0, ctx.addStatic(z1));
    ctx.collideBox(0, -9.5, 17.6, 12); ctx.collideCircle(PX, PZ, 3.5); ctx.collideBox(BX, BZ, 2.1, 0.7); ctx.collideCircle(BX - 2.6, BZ - 1.2, 0.9); ctx.collideCircle(17.8, -9.5, 1.7); ctx.collideCircle(-16.5, -7.5, 3.2); ctx.collideCircle(-3.2, 4.3, 1.2); ctx.collideCircle(7.5, 4.6, 1.1);
    D(0, ctx.add(grainFloor(17.5, 12.5, 0x8a6a45, 5, 0.02), 0, -9)); // tilled soil
    const pond = D(0, ctx.add(new THREE.Mesh(new THREE.CircleGeometry(3.1, 18), mat(0x4f93b8, { opacity: 0.85 })))); pond.rotation.x = -Math.PI / 2; pond.position.set(PX, 0.07, PZ);
    const sails = group([]); for (let i = 0; i < 4; i++) { const b = group([box(0.16, 5.2, 0.1, TIMBER, [0, 2.6, 0]), box(1.1, 3.6, 0.05, 0xf3ecd8, [0.6, 3.2, 0])], null, [0, 0, i * Math.PI / 2]); sails.add(b); } bake(sails); sails.position.set(14, 7.6, -24.4); D(0, ctx.add(sails));
    const brakeArm = group([box(1.9, 0.12, 0.1, C.woodLight, [0.95, 0, 0]), box(0.12, 0.3, 0.12, C.woodDark, [1.95, -0.05, 0])]); bake(brakeArm); brakeArm.position.set(BX - 0.9, 0.98, BZ); brakeArm.rotation.z = 0.45; D(0, ctx.add(brakeArm));
    const farmer = D(0, ctx.person(man({ shirt: 0xd9c8a0, vest: 0x7a5536 }), -9.6, 2.9, 1.2));
    const harvester = D(0, ctx.person(woman({ dress: 0xb5563c, shirt: 0xb5563c, hair: C.hair[3], skin: C.skin[4], hat: 'straw' }), 16.2, -3.4, -1.3)); harvester.userData.anim = 'work';
    const processor = D(0, ctx.person(woman({ dress: 0x4f7a5a, shirt: 0x4f7a5a, hair: C.hair[0], skin: C.skin[2] }), BX - 1.7, BZ - 2.3, 0.5));
    const spinner1 = D(0, ctx.person(woman({ dress: 0x8a5a8c, shirt: 0x8a5a8c, hair: C.hair[4], skin: C.skin[0] }), -18.2, 4.9, 1.9));
    const clumps = []; for (let i = 0; i < 3; i++) { const c = bake(flaxClump(seeded(i + 3), 14, 1.05)); c.scale.setScalar(1.15); c.position.set(-3.5 + i * 3.5, 0, -2.2); D(0, ctx.add(c)); clumps.push(c); }
    const goose = () => group([ball(0.2, 0.17, 0.3, 0xfafafa, [0, 0.36, 0]), cyl(0.05, 0.06, 0.34, 0xfafafa, [0, 0.62, 0.2], [0.3, 0, 0], 5), sphere(0.08, 0xfafafa, [0, 0.8, 0.27], 6), cone(0.04, 0.12, 0xe98a2b, [0, 0.79, 0.38], [Math.PI / 2, 0, 0], 4), box(0.04, 0.2, 0.04, 0xe98a2b, [-0.07, 0.1, 0]), box(0.04, 0.2, 0.04, 0xe98a2b, [0.07, 0.1, 0])]);
    const geese = group([goose(), put(goose(), -0.15, 0, -0.6), put(goose(), 0.2, 0, -1.15)]); geese.children[2].scale.setScalar(0.75); bake(geese); D(0, ctx.add(geese, 2, 5.4, Math.PI / 2)); let gooseDir = 1;
    const pile = [-8.6, 0.6]; // where pulled flax is laid
    ctx.onUpdate((dt, t) => { if (curZone !== 0) return; sails.rotation.z -= dt * 0.5;
      geese.position.x += gooseDir * dt * 0.8; geese.position.y = Math.abs(Math.sin(t * 7)) * 0.04; geese.rotation.z = Math.sin(t * 7) * 0.06; if (geese.position.x > 5.5 || geese.position.x < -1) { gooseDir = geese.position.x > 5.5 ? -1 : 1; geese.rotation.y = gooseDir * Math.PI / 2; } });
    ctx.tp(1.5, 3.2, Math.PI);

    // ============ ZONE 2 — the spinner's & weaver's workshop, with a bleaching green (x≈100) ============
    const X2 = 100, z2 = new THREE.Group();
    z2.add(plane(18, 16, 0xa87c54, [-4, 0.02, -3]));
    z2.add(box(18, 5, 0.4, PLASTER, [-4, 2.5, -11])); z2.add(box(0.4, 5, 16, 0xe6d9bd, [-13, 2.5, -3])); z2.add(box(0.4, 5, 5, 0xe6d9bd, [5, 2.5, -8.5]));
    for (const x of [-12.7, -8.5, -4, 0.5, 4.7]) z2.add(box(0.35, 5, 0.12, TIMBER, [x, 2.5, -10.76])); z2.add(box(18, 0.35, 0.12, TIMBER, [-4, 4.8, -10.76])); z2.add(box(18, 0.3, 0.12, TIMBER, [-4, 1.3, -10.76]));
    z2.add(box(4.3, 0.3, 0.12, TIMBER, [-6.25, 3.0, -10.76], [0, 0, 0.72])); z2.add(box(4.3, 0.3, 0.12, TIMBER, [-1.75, 3.0, -10.76], [0, 0, -0.72]));
    const roof2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 3.4, 18.6, 3, 1), mat(THATCH)); roof2.rotation.z = Math.PI / 2; roof2.rotation.x = Math.PI; roof2.position.set(-4, 6.1, -12.6); roof2.scale.set(1, 1, 1); z2.add(roof2);
    for (const x of [-10.6, 2.6]) { z2.add(box(2.4, 1.9, 0.1, 0xbfe6f5, [x, 3.0, -10.75])); z2.add(box(2.6, 0.14, 0.16, TIMBER, [x, 3.0, -10.7])); z2.add(box(0.14, 2.0, 0.16, TIMBER, [x, 3.0, -10.7])); z2.add(box(2.8, 0.16, 0.3, TIMBER, [x, 1.98, -10.65])); }
    // shelves with yarn + bolts of cloth
    const sh = group([box(3.6, 0.1, 0.6, C.wood, [0, 1.0, 0]), box(3.6, 0.1, 0.6, C.wood, [0, 1.9, 0]), box(0.1, 2.2, 0.6, C.wood, [-1.8, 1.1, 0]), box(0.1, 2.2, 0.6, C.wood, [1.8, 1.1, 0])]);
    [0xf0dfa6, 0xe8dcc0, 0xd9c27a, 0xf7f3e8, 0xcdbb94, 0xf0dfa6].forEach((c, i) => sh.add(sphere(0.24, c, [-1.4 + i * 0.56, 1.28, 0], 7))); [0xf7f3e8, 0xcdbb94, 0xe8dcc0, 0xf7f3e8].forEach((c, i) => sh.add(cyl(0.17, 0.17, 0.55, c, [-1.2 + i * 0.8, 2.12, 0], [Math.PI / 2, 0, 0], 8)));
    put(sh, -6.2, 0, -10.4); z2.add(sh); const sh2 = sh.clone(); put(sh2, -12.4, 0, -1, Math.PI / 2); z2.add(sh2);
    for (const [x, z] of [[-11.6, -9.6], [-10.4, -9.9], [3.9, -9.8]]) { z2.add(cyl(0.45, 0.35, 0.5, 0xb58a4a, [x, 0.25, z], null, 9)); z2.add(ball(0.42, 0.2, 0.42, FIBRE, [x, 0.52, z])); }
    // spinning wheel (static frame)
    const WX = -7, WZ = -5;
    z2.add(cyl(0.26, 0.26, 0.45, C.wood, [WX + 1.72, 0.23, WZ - 0.64], null, 8)); z2.add(group([box(1.9, 0.12, 0.5, C.wood, [0, 0.55, 0], [0, 0, 0.12]), box(0.1, 0.7, 0.1, C.wood, [-0.8, 0.3, 0.15]), box(0.1, 0.7, 0.1, C.wood, [-0.8, 0.3, -0.15]), box(0.1, 0.55, 0.1, C.wood, [0.85, 0.25, 0]), box(0.1, 1.0, 0.1, C.woodDark, [0.45, 1.0, -0.2]), box(0.1, 1.0, 0.1, C.woodDark, [0.45, 1.0, 0.2]), box(0.08, 0.75, 0.08, C.woodDark, [-0.7, 0.95, 0]), box(0.5, 0.06, 0.06, C.woodDark, [-0.7, 1.3, 0]), box(1.2, 0.025, 0.025, LINEN, [-0.15, 1.35, 0.0], [0, 0, -0.04]), cyl(0.03, 0.03, 1.5, C.woodDark, [-1.25, 0.75, 0.1], null, 5), ball(0.2, 0.32, 0.2, FIBRE, [-1.25, 1.45, 0.1]), cyl(0.28, 0.28, 0.45, C.wood, [-1.75, 0.23, 0.5], null, 12), box(0.75, 0.035, 0.24, C.wood, [0.8, 0.13, 0.34], [0, 0, 0.14]), box(0.035, 1.02, 0.035, C.woodDark, [0.6, 0.66, 0.3], [0, 0, 0.1]), box(0.06, 0.06, 0.5, C.woodDark, [1.1, 0.08, 0.2])], [X2 * 0 + WX, 0, WZ])); // …with a treadle and its rod
    // loom (static frame), facing +Z
    const LX = -0.5, LZ = -6.8, LS = 1.35;
    const loomS = group([]); for (const sx of [-1, 1]) { for (const sz of [-1, 1]) loomS.add(box(0.14, 2.3, 0.14, C.wood, [sx * 1.4, 1.15, sz * 1.0])); loomS.add(box(0.12, 0.12, 2.1, C.wood, [sx * 1.4, 2.25, 0])); loomS.add(box(0.12, 0.12, 2.1, C.wood, [sx * 1.4, 0.5, 0])); }
    loomS.add(box(2.9, 0.12, 0.12, C.wood, [0, 2.25, -1])); loomS.add(box(2.9, 0.12, 0.12, C.wood, [0, 2.25, 1])); loomS.add(cyl(0.16, 0.16, 2.7, 0xe8dcc0, [0, 1.0, -1], [0, 0, Math.PI / 2], 8)); loomS.add(cyl(0.13, 0.13, 2.7, C.woodDark, [0, 0.95, 1], [0, 0, Math.PI / 2], 8));
    for (let i = 0; i < 18; i++) loomS.add(box(0.03, 0.02, 2.0, i % 2 ? 0xf0e6cc : 0xdccfae, [-1.1 + i * 0.13, 1.06, 0], [0.02, 0, 0]));
    loomS.add(box(2.5, 0.7, 0.05, C.woodDark, [0, 1.62, -0.35])); for (let i = 0; i < 12; i++) loomS.add(box(0.02, 0.62, 0.06, 0xf0e6cc, [-1.1 + i * 0.2, 1.62, -0.35]));
    for (let i = 0; i < 4; i++) loomS.add(box(0.12, 0.04, 1.5, C.woodDark, [-0.36 + i * 0.24, 0.12 + (i % 2) * 0.06, 0.35], [0.06, 0, 0])); loomS.add(cyl(0.05, 0.05, 2.7, C.woodDark, [0, 2.32, -0.35], [0, 0, Math.PI / 2], 6)); for (const sx of [-1, 1]) loomS.add(box(0.02, 0.7, 0.02, 0xd9c27a, [sx * 0.9, 1.98, -0.35])); // treadles, and the cords that lift the heddles
    loomS.add(box(1.6, 0.1, 0.4, C.wood, [0, 0.5, 1.7])); loomS.add(box(0.1, 0.5, 0.3, C.wood, [-0.7, 0.25, 1.7])); loomS.add(box(0.1, 0.5, 0.3, C.wood, [0.7, 0.25, 1.7])); // weaver's bench
    put(loomS, LX, 0, LZ); loomS.scale.setScalar(LS); z2.add(loomS);
    // bleaching green (right): stream, linen strips lying in the sun, hedge, merchant's cart
    z2.add(plane(22, 3.2, 0x4f93b8, [16, 0.04, -13.5])); z2.add(box(3, 0.2, 4, C.wood, [20, 0.25, -13.5])); for (const s of [-1, 1]) z2.add(box(3, 0.7, 0.1, C.wood, [20, 0.6, -13.5 + s * 2]));
    for (const [x, z, c] of [[8.3, -7.5, 0xf7f3e8], [8.3, -3.9, 0xe6dcc0], [16.2, -7.9, 0xede5cf], [16.2, -9.8, 0xf7f3e8], [8.3, -9.6, 0xdccfae], [12, -9.6, 0xede5cf]]) { z2.add(plane(2.6, 1.5, c, [x, 0.05, z])); for (const sx of [-1, 1]) for (const sz of [-1, 1]) z2.add(box(0.06, 0.16, 0.06, C.woodDark, [x + sx * 1.25, 0.08, z + sz * 0.7])); }
    for (const [x, z] of [[10.2, -2.6], [13.9, -8.3]]) { z2.add(cyl(0.24, 0.2, 0.36, C.wood, [x, 0.18, z], null, 8)); z2.add(cyl(0.21, 0.21, 0.02, 0x6fb2d8, [x, 0.35, z], null, 8)); z2.add(torus(0.2, 0.02, 0x444444, [x, 0.42, z], null, 8)); }
    for (let i = 0; i < 9; i++) { const b = P.bush({ s: 1.5 }); put(b, 6.5 + i * 2.3, 0, -16.2); z2.add(b); }
    z2.add(P.scatter(12, 50, 16, (r) => P.tree({ h: 4 + r() * 3 }), { seed: 21 }).translateX(12).translateZ(-27));
    z2.add(P.scatter(7, 12, 30, (r) => P.tree({ h: 4 + r() * 3, kind: r() < 0.4 ? 'pine' : 'round' }), { seed: 23 }).translateX(31).translateZ(-4));
    z2.add(P.scatter(18, 14, 7, () => P.flower(), { seed: 28 }).translateX(14).translateZ(3.5));
    for (let i = 0; i < 3; i++) { const m = P.mountain({ h: 15 + (i % 2) * 5, color: 0x86b070, snow: false }); m.scale.set(2.2, 1, 1); m.position.set(-20 + i * 45, -1, -90); z2.add(m); }
    const cart = group([box(2.6, 0.14, 1.4, C.wood, [0, 0.8, 0]), box(2.6, 0.4, 0.08, C.woodDark, [0, 1.05, -0.7]), box(2.6, 0.4, 0.08, C.woodDark, [0, 1.05, 0.7]), box(0.08, 0.4, 1.4, C.woodDark, [-1.3, 1.05, 0]), box(1.6, 0.08, 0.08, C.woodDark, [2.0, 0.75, 0.5]), box(1.6, 0.08, 0.08, C.woodDark, [2.0, 0.75, -0.5])]);
    for (const s of [-1, 1]) { cart.add(torus(0.6, 0.06, C.woodDark, [0, 0.6, s * 0.8], null, 22)); cart.add(cyl(0.1, 0.1, 0.16, C.woodDark, [0, 0.6, s * 0.8], [Math.PI / 2, 0, 0], 8)); for (let i = 0; i < 4; i++) cart.add(box(0.06, 1.2, 0.05, C.wood, [0, 0.6, s * 0.8], [0, 0, i * Math.PI / 4])); }
    [0xf7f3e8, 0xcdbb94, 0xe8dcc0, 0xf7f3e8, 0x7a9fc9].forEach((c, i) => cart.add(cyl(0.18, 0.18, 1.2, c, [-0.9 + i * 0.42, 1.06 + (i % 2) * 0.05, 0], [Math.PI / 2, 0, 0], 8)));
    put(cart, 17.6, 0, -4.6, 0.35); z2.add(cart);
    S(1, ctx.addStatic(z2, X2, 0));
    ctx.collideBox(X2 - 4, -11, 18, 0.8); ctx.collideBox(X2 + 5, -8.5, 0.6, 5); ctx.collideBox(X2 - 6.2, -10.4, 3.8, 1); ctx.collideBox(X2 - 12.4, -1, 1, 3.8); ctx.collideBox(X2 + WX - 0.2, WZ, 2.6, 0.9); ctx.collideBox(X2 + LX, LZ + 0.4, 4.2, 4.0); ctx.collideBox(X2 + 17.6, -4.6, 3, 2);
    D(1, ctx.add(floorMesh(18, 16, plankTex(28, 0xb98a5e, { seed: 3 })), X2 - 4, -3)); // workshop floor boards
    const wheel2 = group([torus(0.62, 0.05, C.woodDark, [0, 0, 0], null, 24), torus(0.2, 0.02, C.wood, [0, 0, 0], null, 10)]); for (let i = 0; i < 4; i++) wheel2.add(box(0.05, 1.24, 0.05, C.wood, [0, 0, 0], [0, 0, i * Math.PI / 4])); wheel2.add(cyl(0.09, 0.09, 0.5, C.woodDark, [0, 0, 0], [Math.PI / 2, 0, 0], 7)); bake(wheel2); wheel2.position.set(X2 + WX + 0.45, 1.25, WZ); D(1, ctx.add(wheel2));
    const bobbin = group([cyl(0.07, 0.07, 0.3, LINEN, [0, 0, 0], [0, 0, Math.PI / 2], 8)]); bake(bobbin); bobbin.position.set(X2 + WX - 0.7, 1.3, WZ + 0.06); D(1, ctx.add(bobbin));
    const beater = group([box(2.6, 0.5, 0.08, C.woodLight, [0, 0, 0]), box(2.6, 0.08, 0.14, C.woodDark, [0, 0.26, 0])]); bake(beater); beater.position.set(0, 1.32, 0.25);
    const shuttle = group([ball(0.2, 0.05, 0.07, 0x7a4a2a, [0, 0, 0]), box(0.16, 0.04, 0.05, LINEN, [0, 0.03, 0])]); bake(shuttle); shuttle.position.set(-1.25, 1.13, 0.5);
    const weave = box(2.36, 0.03, 1, LINEN_RAW, [0, 0, 0]); weave.geometry.translate(0, 0, -0.5); weave.position.set(0, 1.1, 0.95); weave.scale.z = 0.02;
    const loomD = group([beater, shuttle, weave], [X2 + LX, 0, LZ]); loomD.scale.setScalar(LS); D(1, ctx.add(loomD));
    const spinner = D(1, ctx.person(woman({ dress: 0x8a5a8c, shirt: 0x8a5a8c, hair: C.hair[4], skin: C.skin[0] }), X2 + WX + 1.72, WZ - 0.64, -0.9)); spinner.userData.anim = 'sew'; spinner.userData.sitting = true; seatY(spinner, 0.455); // on her stool, far enough from the wheel that her straight legs end in front of it
    const weaver = D(1, ctx.person(man({ hat: null, hair: C.hair[6], beard: C.hair[6], vest: 0x4f6a5a, apron: 0x8a6a4a }), X2 + LX + 3.0, LZ + 1.6, -0.8));
    const merchant = D(1, ctx.person(man({ hat: 'tophat', vest: 0x7a2f3a, shirt: 0xf3ecd8, hair: C.hair[1], skin: C.skin[4], beard: C.hair[1] }), X2 + 15.3, -3.4, -0.9));
    const duck = (c) => group([ball(0.18, 0.13, 0.26, c, [0, 0.1, 0]), sphere(0.09, c === 0xfafafa ? c : 0x2f6d3a, [0, 0.28, 0.18], 6), cone(0.035, 0.1, 0xe9a23b, [0, 0.27, 0.29], [Math.PI / 2, 0, 0], 4)]);
    const ducks = group([duck(0x8a6a45), put(duck(0xfafafa), 0.1, 0, -0.7), put(duck(0x8a6a45), -0.1, 0, -1.3)]); bake(ducks); D(1, ctx.add(ducks, X2 + 9, -13.4, Math.PI / 2)); ducks.position.y = 0.05; let duckDir = 1;
    ctx.onUpdate((dt, t) => { if (curZone !== 1) return; ducks.position.x += duckDir * dt * 0.7; ducks.position.y = 0.05 + Math.sin(t * 3) * 0.02; if (ducks.position.x > X2 + 17.5 || ducks.position.x < X2 + 7.5) { duckDir = ducks.position.x > X2 + 12 ? -1 : 1; ducks.rotation.y = duckDir * Math.PI / 2; } });
    const GX = X2 + 12, GZ = -5.6; // where our linen is bleached
    const greenCloth = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), new THREE.MeshLambertMaterial({ color: LINEN_RAW })); greenCloth.rotation.x = -Math.PI / 2; greenCloth.position.set(GX, 0.09, GZ); hide(D(1, ctx.add(greenCloth)));

    // ============ ZONE 3 — Anna's stone cottage, inside (x≈200) ============
    const X3 = 200, z3 = new THREE.Group(), r3 = seeded(33);
    z3.add(plane(14, 12, 0x8f6f4c, [0, 0.02, -3]));
    z3.add(box(14, 4.4, 0.5, STONE, [0, 2.2, -9.2])); z3.add(box(0.5, 4.4, 12, 0x9a9488, [-7.2, 2.2, -3])); z3.add(box(0.5, 4.4, 12, 0x9a9488, [7.2, 2.2, -3]));

    // fireplace (back-left)
    const FX = -3.9, FZ = -8.4;
    z3.add(box(3.0, 3.2, 1.2, 0x7f7a70, [FX, 1.6, FZ])); z3.add(box(3.3, 0.25, 1.5, 0x6e4a28, [FX, 2.35, FZ + 0.1])); z3.add(box(1.9, 1.5, 0.5, 0x2a2420, [FX, 0.75, FZ + 0.4])); z3.add(box(1.6, 4.4, 1.0, 0x7f7a70, [FX, 2.2, FZ - 0.1]));
    z3.add(cyl(0.1, 0.1, 1.2, 0x5a3d24, [FX, 0.14, FZ + 0.6], [0, 0.3, Math.PI / 2], 6)); z3.add(cyl(0.1, 0.1, 1.1, 0x4a3018, [FX + 0.1, 0.3, FZ + 0.55], [0, -0.4, Math.PI / 2], 6));
    z3.add(cyl(0.32, 0.26, 0.42, 0x2b2b2b, [FX, 0.95, FZ + 0.55], null, 9)); z3.add(box(0.04, 0.5, 0.04, 0x2b2b2b, [FX, 1.3, FZ + 0.55]));
    for (let i = 0; i < 3; i++) { z3.add(lathe([[0, 0], [0.13, 0.02], [0.16, 0.2], [0.1, 0.3]], [0xb5563c, 0x7a9fc9, 0xd9c27a][i], [FX - 1 + i, 2.48, FZ + 0.3])); }
    // window (back-right) frame + shutters
    const WNX = 3.2; z3.add(box(2.2, 0.16, 0.3, TIMBER, [WNX, 1.75, -8.9])); z3.add(box(2.2, 0.16, 0.3, TIMBER, [WNX, 3.45, -8.9])); for (const s of [-1, 1]) { z3.add(box(0.16, 1.86, 0.3, TIMBER, [WNX + s * 1.02, 2.6, -8.9])); z3.add(box(0.7, 1.7, 0.08, 0x6b7f5a, [WNX + s * 1.5, 2.6, -8.9])); } z3.add(box(0.08, 1.7, 0.12, TIMBER, [WNX, 2.6, -8.86]));
    // shelf with crockery, hanging herbs
    z3.add(box(2.2, 0.08, 0.4, C.wood, [-0.3, 2.5, -8.8])); for (let i = 0; i < 4; i++) z3.add(cyl(0.12, 0.1, 0.2 + (i % 2) * 0.1, [0xe8dcc0, 0x9a6b43, 0xd9d2c2, 0x7a5536][i], [-1.1 + i * 0.5, 2.66, -8.8], null, 7));
    for (let i = 0; i < 3; i++) z3.add(cone(0.12, 0.45, [0x6b8f4a, 0x8a7a4a, 0x9a6a8a][i], [5.4 + i * 0.4, 3.5, -8.85], [Math.PI, 0, 0], 5));
    // table + stools (handmade)
    const TX = 0, TZ = -3.6, TH = 0.86;
    z3.add(P.tableProp(2.9, 1.5, TH, 0x8a5a2b).translateX(TX).translateZ(TZ));
    for (const [x, z] of [[2.1, TZ], [-0.8, TZ - 1.4]]) { z3.add(cyl(0.24, 0.24, 0.08, C.wood, [x, 0.5, z], null, 8)); for (let i = 0; i < 3; i++) z3.add(cyl(0.04, 0.04, 0.5, C.woodDark, [x + Math.cos(i * 2.1) * 0.18, 0.25, z + Math.sin(i * 2.1) * 0.18], null, 4)); }
    z3.add(cyl(0.1, 0.12, 0.05, 0x8a7a4a, [TX + 1.0, TH + 0.07, TZ - 0.45], null, 8)); z3.add(cyl(0.04, 0.045, 0.3, 0xf3ecd8, [TX + 1.0, TH + 0.24, TZ - 0.45], null, 6)); // candle
    // bed with a sleeping child, cradle, sewing basket
    z3.add(box(2.2, 0.5, 3.2, C.wood, [-5.7, 0.3, -0.2])); z3.add(box(2.0, 0.25, 3.0, 0xe8dcc0, [-5.7, 0.62, -0.2])); z3.add(box(2.05, 0.14, 2.0, 0x9a4a3a, [-5.7, 0.78, 0.25])); for (let i = 0; i < 6; i++) z3.add(box(0.5, 0.02, 0.5, [0xd9c27a, 0x4f7a5a, 0x6b7fa8][i % 3], [-6.2 + (i % 2) * 1.0, 0.86, -0.4 + Math.floor(i / 2) * 0.7]));
    z3.add(box(2.2, 1.2, 0.15, C.woodDark, [-5.7, 0.7, -1.85])); z3.add(ball(0.5, 0.12, 0.3, 0xf3ecd8, [-5.7, 0.8, -1.35])); z3.add(sphere(0.2, C.skin[0], [-5.7, 0.95, -1.3], 8)); z3.add(ball(0.21, 0.12, 0.2, C.hair[3], [-5.7, 1.04, -1.36]));
    z3.add(group([box(0.9, 0.35, 0.5, C.wood, [0, 0.4, 0]), box(0.8, 0.1, 0.42, 0xf3ecd8, [0, 0.56, 0]), cyl(0.25, 0.25, 0.06, C.woodDark, [0, 0.12, 0.2], [Math.PI / 2, 0, 0], 8), cyl(0.25, 0.25, 0.06, C.woodDark, [0, 0.12, -0.2], [Math.PI / 2, 0, 0], 8)], [4.7, 0, -7.6], [0, -0.3, 0]));
    z3.add(group([cyl(0.34, 0.26, 0.3, 0xb58a4a, [0, 0.15, 0], null, 9), sphere(0.13, 0xf7f3e8, [0.1, 0.34, 0.05], 6), sphere(0.12, FLAX_BLUE, [-0.12, 0.33, 0], 6), sphere(0.11, 0x6fb05a, [0, 0.34, -0.13], 6), sphere(0.1, C.gold, [0.02, 0.4, 0.02], 6)], [3.3, 0, -2.6]));
    // Anna's trunk (base) by the right wall, a bench, a broom
    const KX = 5.6, KZ = -1.2;
    z3.add(group([box(1.5, 0.6, 0.9, 0x7a4a2a, [0, 0.3, 0]), box(1.54, 0.08, 0.94, 0x3a3a3a, [0, 0.1, 0]), box(1.54, 0.08, 0.94, 0x3a3a3a, [0, 0.5, 0]), box(0.16, 0.2, 0.04, C.gold, [0, 0.45, 0.47])], [KX, 0, KZ], [0, -Math.PI / 2, 0]));
    z3.add(box(0.5, 0.5, 2.2, C.wood, [6.5, 0.25, -5.5])); z3.add(cyl(0.03, 0.03, 1.8, C.wood, [6.6, 0.9, -7.6], [0.15, 0, 0.1], 5)); z3.add(cone(0.2, 0.5, STRAW, [6.5, 0.25, -7.75], null, 6));
    S(2, ctx.addStatic(z3, X3, 0));
    ctx.collideBox(X3 + TX, TZ, 3.0, 1.6); ctx.collideBox(X3 + FX, FZ, 3.2, 1.8); ctx.collideBox(X3 - 5.7, -0.2, 2.3, 3.4); ctx.collideBox(X3 + KX, KZ, 1.0, 1.6); ctx.collideCircle(X3 + 4.7, -7.6, 0.6); ctx.collideCircle(X3 + 3.3, -2.6, 0.4); ctx.collideCircle(X3 + 2.1, TZ, 0.3); ctx.collideCircle(X3 - 0.8, TZ - 1.4, 0.3); ctx.collideBox(X3 + 6.5, -5.5, 0.7, 2.3);
    D(2, ctx.add(grainFloor(14, 12, 0x94724e, 3), X3, -3)); // packed-earth floor
    { const back = wallMesh(14, 4.4, stoneTex(14, 4.4, { seed: 5 })); back.position.set(X3, 2.2, -8.94); D(2, ctx.add(back));
      for (const s of [-1, 1]) { const side = wallMesh(12, 4.4, stoneTex(12, 4.4, { seed: 6 + s })); side.position.set(X3 + s * 6.94, 2.2, -3); side.rotation.y = -s * Math.PI / 2; D(2, ctx.add(side)); } } // fieldstone walls
    const fire3 = group([cone(0.34, 0.8, glow(0xff8a2a), [0, 0.4, 0], null, 6), cone(0.2, 0.5, glow(0xffd84a), [0.05, 0.3, 0.08], null, 5), cone(0.18, 0.45, glow(0xff5a2a), [-0.25, 0.25, 0], null, 5)]); bake(fire3); fire3.position.set(X3 + FX, 0.3, FZ + 0.62); D(2, ctx.add(fire3));
    const pane3 = box(1.9, 1.6, 0.06, glow(0x2a3566), [X3 + WNX, 2.6, -8.93]); D(2, ctx.add(pane3));
    const moon = emojiSprite('🌙', 0.5, [X3 + WNX - 0.55, 2.3, -8.7]); D(2, ctx.add(moon));
    const flame3 = group([cone(0.06, 0.2, glow(0xffd84a), [0, 0.1, 0], null, 5)]); bake(flame3); flame3.position.set(X3 + TX + 1.0, TH + 0.4, TZ - 0.45); hide(D(2, ctx.add(flame3)));
    const lid3 = group([box(1.5, 0.22, 0.9, 0x8a5a2b, [0, 0.11, -0.45]), box(1.54, 0.06, 0.94, 0x3a3a3a, [0, 0.05, -0.45]), box(0.5, 0.04, 0.2, 0x6e4a28, [0, 0.24, -0.45])]); bake(lid3); lid3.position.set(X3 + KX + 0.45, 0.6, KZ); lid3.rotation.order = 'YXZ'; lid3.rotation.y = Math.PI / 2; D(2, ctx.add(lid3));
    const cloth3 = tableCloth(3.1, 1.7, cloth.tex); cloth3.position.set(X3 + TX, TH + 0.05, TZ); hide(D(2, ctx.add(cloth3)));
    const anna = D(2, ctx.person(ANNA, X3 + 2.1, TZ, -Math.PI / 2)); anna.userData.sitting = true; seatY(anna, 0.54); // on her stool, hands at the edge of the cloth, legs under the table
    ctx.onUpdate((dt, t) => { if (curZone !== 2) return; fire3.scale.set(1 + Math.sin(t * 13) * 0.12, 1 + Math.sin(t * 17) * 0.2, 1); flame3.scale.y = 1 + Math.sin(t * 19) * 0.2; });

    // ============ ZONE 4 — the emigrant sailing ship on the Atlantic (x≈300). The deck is at y=0; the sea lies below. ============
    const X4 = 300, z4 = new THREE.Group(), DECKW = 9, HULL = 0x4a3524;
    z4.add(box(DECKW, 0.5, 27, 0xb88a55, [0, -0.26, -2]));
    z4.add(box(DECKW + 0.3, 3.2, 27, HULL, [0, -2.1, -2])); z4.add(box(DECKW + 0.4, 0.3, 27.1, 0xe8dcc0, [0, -0.65, -2]));
    const tri = (w, l, h, color, y) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, l); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat(color)); m.position.set(0, y, -15.5); return m; };
    z4.add(tri(DECKW, 7, 0.5, 0xb88a55, -0.5)); z4.add(tri(DECKW + 0.3, 7.3, 3.2, HULL, -3.7));
    for (const s of [-1, 1]) { z4.add(box(0.22, 1.0, 27, 0x6e4a28, [s * 4.45, 0.5, -2])); z4.add(box(0.34, 0.12, 27, 0xd2a567, [s * 4.45, 1.05, -2])); z4.add(box(0.22, 1.0, 8.4, 0x6e4a28, [s * 2.28, 0.5, -19], [0, s * -0.57, 0])); z4.add(box(0.34, 0.12, 8.4, 0xd2a567, [s * 2.28, 1.05, -19], [0, s * -0.57, 0])); }
    z4.add(box(DECKW, 1.0, 0.22, 0x6e4a28, [0, 0.5, 11.4])); z4.add(box(DECKW, 0.12, 0.34, 0xd2a567, [0, 1.05, 11.4]));
    z4.add(cyl(0.14, 0.2, 9, 0x8a5a2b, [0, 2.2, -25], [-1.25, 0, 0], 6)); // bowsprit
    for (const mz of [-8, 4]) { z4.add(cyl(0.24, 0.34, 17, 0x8a5a2b, [0, 8.5, mz], null, 8)); for (const [y, w] of [[7.4, 8.6], [12.4, 7], [16.4, 5]]) z4.add(cyl(0.1, 0.1, w, 0x6e4a28, [0, y, mz], [0, 0, Math.PI / 2], 6));
      z4.add(box(8, 4.6, 0.14, 0xf3ecd8, [0, 9.9, mz - 0.25], [0.06, 0, 0])); z4.add(box(6.2, 3.6, 0.14, 0xece3cc, [0, 14.4, mz - 0.22], [0.06, 0, 0]));
      for (const s of [-1, 1]) for (const k of [0, 1]) z4.add(cyl(0.03, 0.03, 13.6, 0x3a3026, [s * 2.2, 6.6, mz + 0.4 + k * 0.9], [k * 0.07, 0, s * 0.335], 4)); }
    // cabin with a hatch, lifeboat, coils, lantern post
    z4.add(box(3.4, 1.5, 2.6, 0x9a6f48, [0, 0.75, -2])); z4.add(box(3.7, 0.14, 2.9, 0x8a6a45, [0, 1.56, -2])); z4.add(box(1.6, 0.1, 1.2, 0x5a3d24, [-0.6, 1.66, -2])); for (let i = 0; i < 5; i++) z4.add(box(1.5, 0.04, 0.08, 0xd2a567, [-0.6, 1.72, -2.45 + i * 0.22])); z4.add(torus(0.32, 0.09, 0xd9c27a, [1.1, 1.68, -1.6], [Math.PI / 2, 0, 0], 16)); z4.add(cyl(0.12, 0.16, 0.7, 0x3a3a3a, [1.2, 1.95, -2.7], null, 7)); z4.add(box(0.9, 1.1, 0.08, 0x4a3524, [0, 0.55, -0.68])); for (const s of [-1, 1]) z4.add(cyl(0.2, 0.2, 0.06, 0xbfe6f5, [s * 1.1, 1.0, -0.68], [Math.PI / 2, 0, 0], 8));
    z4.add(group([ball(0.7, 0.4, 1.7, 0xe8dcc0, [0, 0.45, 0]), box(1.0, 0.06, 0.2, C.wood, [0, 0.62, 0.5]), box(1.0, 0.06, 0.2, C.wood, [0, 0.62, -0.5])], [-3.3, 0, -10.5]));
    for (const [x, z] of [[-3.5, -13.4], [-3.4, 9.6], [3.4, 9.8]]) { z4.add(torus(0.4, 0.11, 0xd9c27a, [x, 0.12, z], [Math.PI / 2, 0, 0], 18)); z4.add(torus(0.3, 0.1, 0xcdb56a, [x, 0.3, z], [Math.PI / 2, 0, 0], 16)); }
    for (const [x, z] of [[3.7, -12.6], [3.1, -13.3], [-3.7, 2.2]]) { const b = P.barrel(); put(b, x, 0, z); z4.add(b); }
    z4.add(group([box(0.16, 1.0, 0.5, C.woodDark, [0, 0.5, 0])], [0, 0, 8.6])); // helm post
    z4.add(group([box(1.9, 0.07, 0.4, 0x9a6f48, [0, 0.355, 0]), box(0.08, 0.32, 0.36, 0x6e4a28, [-0.8, 0.16, 0]), box(0.08, 0.32, 0.36, 0x6e4a28, [0.8, 0.16, 0])], [2.8, 0, -0.47])); // a plain bench beside the cabin for the resting family
    S(3, ctx.addStatic(z4, X4, 0));
    ctx.collideBox(X4, -2, 3.6, 2.8); ctx.collideCircle(X4, -8, 0.5); ctx.collideCircle(X4, 4, 0.5); ctx.collideBox(X4 - 3.3, -10.5, 1.5, 3.4); ctx.collideCircle(X4 + 3.4, -12.9, 0.9); ctx.collideCircle(X4 - 3.7, 2.2, 0.5); ctx.collideCircle(X4, 8.6, 0.5);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), mat(0x2f7fc0)); sea.rotation.x = -Math.PI / 2; sea.position.set(X4, -2.5, -60); D(3, ctx.add(sea)); const seaMap = seaTex(); seaMap.repeat.set(70, 70); sea.material = new THREE.MeshLambertMaterial({ color: 0x2f7fc0, map: seaMap });
    D(3, ctx.add(floorMesh(DECKW, 27, plankTex(16, 0xb88a55, { seed: 4 }), 0.012), X4, -2)); // deck planking
    const waves = group([]), swells = group([]), foams = group([]), swellMat = new THREE.MeshLambertMaterial({ color: 0x2f7fc0, vertexColors: true }); { const rw = seeded(44); const pat = [0, 1].map(() => Array.from({ length: 6 }, (_, j) => [-72 + j * 28 + rw() * 14, 6 + rw() * 7])); for (let k = 0; k < 20; k++) for (const [x, w] of pat[k % 2]) { const z = -108 + k * 6; const [b, f] = swell(w); b.position.set(x, -0.25, z); f.position.x += x; f.position.y -= 0.25; f.position.z += z; swells.add(b); foams.add(f); } } /* smooth rolling swells (the pattern repeats every 12 m, so it can scroll for ever) */ bake(swells); bake(foams); swells.traverse(o => { if (o.isMesh) o.material = swellMat; }); waves.add(swells, foams); /* the swells take the colour of the sea, so the storm darkens them too */ waves.position.set(X4, -2.45, 0); D(3, ctx.add(waves));
    const helm = group([torus(0.5, 0.05, C.woodDark, [0, 0, 0], null, 22), cyl(0.09, 0.09, 0.12, C.woodDark, [0, 0, 0], [Math.PI / 2, 0, 0], 8)]); for (let i = 0; i < 4; i++) helm.add(box(0.06, 1.3, 0.06, C.wood, [0, 0, 0], [0, 0, i * Math.PI / 4])); bake(helm); helm.position.set(X4, 1.15, 8.92); /* on the helmsman's side of its post, within reach of his straight arms */ D(3, ctx.add(helm));
    const land = group([]); { const rl = seeded(46); for (let i = 0; i < 9; i++) land.add(ball(14 + rl() * 10, 3 + rl() * 4, 8, [0x6fae5a, 0x86b070, 0x5e9e44][i % 3], [-70 + i * 17, 0, rl() * 6])); for (let i = 0; i < 7; i++) land.add(box(3, 2.4 + rl() * 2, 3, [0xb4563c, 0xe8dcc0, 0x9a6b43][i % 3], [-24 + i * 8, 3.6, 7])); land.add(plane(150, 10, 0xd9c89a, [0, 1.6, 9])); } bake(land); land.position.set(X4, -3, -125); hide(D(3, ctx.add(land)));
    const RAIN = 260, rainPos = new Float32Array(RAIN * 3); for (let i = 0; i < RAIN; i++) { rainPos[i * 3] = X4 - 14 + Math.random() * 28; rainPos[i * 3 + 1] = Math.random() * 12; rainPos[i * 3 + 2] = -22 + Math.random() * 36; }
    const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3)); const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xcfe6ff, size: 0.16, transparent: true, opacity: 0.8, depthWrite: false })); rain.frustumCulled = false; hide(D(3, ctx.add(rain)));
    const mkCargo = (obj, z, ph) => { bake(obj); obj.position.set(X4, 0, z); obj.userData.ph = ph; obj.userData.z0 = z; D(3, ctx.add(obj)); return obj; };
    const trunk4 = mkCargo(group([box(1.3, 0.6, 0.8, 0x7a4a2a, [0, 0.3, 0]), box(1.34, 0.24, 0.84, 0x8a5a2b, [0, 0.72, 0]), box(1.36, 0.07, 0.86, 0x3a3a3a, [0, 0.1, 0]), box(1.36, 0.07, 0.86, 0x3a3a3a, [0, 0.58, 0]), box(0.16, 0.2, 0.04, C.gold, [0, 0.55, 0.42])]), 6.0, 0); trunk4.position.x = X4 + 2.2;
    const cargo = [trunk4, mkCargo(group([P.barrel({ color: 0x9a6b43 })]), 1.2, 2.1), mkCargo(group([P.crate({ s: 1.1 })]), -5.4, 4.2)];
    const helmsman = D(3, ctx.person({ hat: 'sailor', shirt: 0x2b3f66, pants: 0xe8dcc0, beard: C.hair[4], hair: C.hair[4], skin: C.skin[1], expressive: true }, X4 + 0.1, 9.5, Math.PI)); helmsman.userData.anim = 'work';
    const lookout = D(3, ctx.person({ hat: 'sailor', shirt: 0xe8dcc0, vest: 0x2b3f66, pants: 0x2b3f66, hair: C.hair[0], skin: C.skin[3], expressive: true }, X4 - 0.6, -13.2, 0.2));
    const anna4 = D(3, ctx.person(ANNA, X4 + 3.3, 4.3, -0.5));
    const statue = (opts, x, z, ry, zi, anim = 'idle', sit = false) => { const p = person(Object.assign({ shadow: false }, opts)), u = p.userData; u.anim = anim; u.sitting = sit; for (let i = 0; i < 40; i++) u.tick(0.05, 1.3 + i * 0.01);
      u.hips.position.y = sit ? 0.48 : 0.7; if (anim === 'cheer') { u.armL.rotation.set(0, 0, -2.45); u.armR.rotation.set(0, 0, 2.45); } // a still figure: no hop frozen in mid-air, and both arms in a clean V well clear of the head
      bake(p); p.position.set(x, 0, z); p.rotation.y = ry; return D(zi, ctx.add(p)); };
    seatY(statue(woman({ dress: 0x8a5a8c, shirt: 0x8a5a8c, hair: C.hair[1], skin: C.skin[2] }), X4 + 2.15, -0.45, 0.06, 3, 'idle', true), 0.39); seatY(statue(man({ hat: 'cap', hatColor: 0x4a4038, vest: 0x4f6a5a }), X4 + 3.35, -0.45, -0.06, 3, 'idle', true), 0.39); // a family resting on the bench beside the cabin
    seatY(statue({ scale: 0.68, shirt: 0xb5563c, pants: 0x4a4038, hair: C.hair[3], hat: 'cap', hatColor: 0x6e4a28 }, X4 + 2.75, -0.45, 0, 3, 'idle', true), 0.39); statue(man({ hat: 'tophat', vest: 0x3a3a3a, beard: C.hair[0] }), X4 - 3.4, -1.2, 1.2, 3, 'idle');
    let storm = 0, rollAmp = 0.02, waveZ = 0; // 0 calm … 1 full storm
    ctx.onUpdate((dt, t) => {
      if (curZone !== 3) return;
      const roll = Math.sin(t * 1.15) * rollAmp; ctx.camera.up.set(Math.sin(roll), Math.cos(roll), 0);
      waveZ = (waveZ + dt * (1.2 + storm * 3.5)) % 12; waves.position.z = waveZ; seaMap.offset.y = (seaMap.offset.y + dt * (1.2 + storm * 3.5) / 10) % 1; swellMat.color.copy(sea.material.color).multiplyScalar(0.97); waves.position.y = -2.45 + Math.sin(t * 1.15) * (0.15 + storm * 0.35); helm.rotation.z = Math.sin(t * 0.8) * 0.5;
      for (const c of cargo) if (c.userData.loose) { c.position.x = X4 + Math.sin(t * 1.15 + c.userData.ph) * 2.7; c.rotation.y = Math.sin(t * 1.15 + c.userData.ph) * 0.25; }
      if (rain.visible) { for (let i = 0; i < RAIN; i++) { rainPos[i * 3 + 1] -= dt * 16; rainPos[i * 3] -= dt * 4; if (rainPos[i * 3 + 1] < -1) { rainPos[i * 3 + 1] = 11 + Math.random() * 2; rainPos[i * 3] = X4 - 12 + Math.random() * 28; } } rainGeo.attributes.position.needsUpdate = true; }
    });
    for (const c of cargo) ctx.collideObj(c, 0.75);

    // ============ ZONE 5 — across the plains with a wagon company (x≈400 … 480, travelling toward +X) ============
    const X5 = 400, z5 = new THREE.Group(), z5far = new THREE.Group() /* the far backdrop is its own small mesh, so the near scenery splits into fewer pieces */, r5 = seeded(55), TRZ = -3, CAMPX = X5 + 70;
    z5.add(plane(130, 3.8, 0xc9a878, [40, 0.03, TRZ])); for (const s of [-1, 1]) z5.add(plane(130, 0.3, 0xb08e62, [40, 0.035, TRZ + s * 0.85]));
    z5.add(P.scatter(130, 130, 34, (r) => group([cone(0.1, 0.45, 0x9aa858, [0, 0.22, 0], [0.2, 0, 0.15], 3), cone(0.09, 0.38, 0xc2b865, [0.12, 0.19, 0.05], [-0.1, 0, -0.3], 3), cone(0.08, 0.34, 0xa8b060, [-0.1, 0.17, -0.06], [0.1, 0, 0.35], 3)]), { seed: 51, keep: (x, z) => Math.abs(z - 2 - TRZ) > 2.6 }).translateX(40).translateZ(2));
    z5.add(P.scatter(26, 130, 40, (r) => { const s = 0.6 + r() * 0.5, c = r() < 0.5 ? 0x8a9a6a : 0x9aa870; return group([ball(0.62 * s, 0.42 * s, 0.55 * s, c, [0, 0.3 * s, 0], null, 6), ball(0.4 * s, 0.3 * s, 0.4 * s, c === 0x8a9a6a ? 0x97a674 : 0x8a9a6a, [0.35 * s, 0.26 * s, 0.2 * s], null, 5)]); } /* low sagebrush */, { seed: 52, keep: (x, z) => z < -4 || z > 14.5 }).translateX(40).translateZ(-4));
    z5.add(P.scatter(16, 130, 30, (r) => P.rock({ s: 0.6 + r() * 0.8, ry: r() * 6 }), { seed: 53, keep: (x, z) => z < -10.5 || z > 6.5 }).translateX(40).translateZ(4));
    z5.add(P.scatter(46, 120, 12, (r) => { const f = P.flower({ color: r() < 0.7 ? 0xe6c84a : 0xd98a3a }); f.scale.setScalar(0.8 + r() * 0.5); return f; }, { seed: 54 }).translateX(40).translateZ(9));
    for (let i = 0; i < 20; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(1.5 + r5() * 2.5, 22), mat([0xbcb86f, 0xb5b168, 0xbbb56d][i % 3])); m.rotation.x = -Math.PI / 2; m.scale.set(0.75, 0.4 + r5() * 0.25, 1); m.position.set(-18 + r5() * 118, 0.022 + i * 0.0004, r5() < 0.5 ? 2 + r5() * 12 : -7 - r5() * 16); z5.add(m); } // soft patches of drier grass
    for (let i = 0; i < 7; i++) { const h = 7 + r5() * 7, w = 9 + r5() * 10; z5far.add(cyl(w * 0.42, w * 0.6, h, [0xc48a5a, 0xb87a50, 0xd09a68][i % 3], [-22 + i * 19 + r5() * 6, h / 2, -46 - r5() * 26], null, 9)); }
    for (let i = 0; i < 5; i++) { const m = P.mountain({ h: 26 + (i % 2) * 9, color: 0x7d8fa3 }); m.position.set(88 + i * 17, 0, -62 - (i % 2) * 14); z5far.add(m); } // the mountains above the Salt Lake Valley
    for (let i = 0; i < 3; i++) { const m = P.mountain({ h: 30 + i * 4, color: 0x8a9ab0 }); m.position.set(118, 0, -30 + i * 22); z5far.add(m); }
    // camp: two parked wagons, fire ring, logs to sit on
    for (const [x, z, ry] of [[CAMPX + 6.5, -3.2, 0.5], [CAMPX - 6.5, -9.5, -0.35]]) { const w = coveredWagon(true); bake(w); put(w, x - X5, 0, z, ry); z5.add(w); }
    const FPX = CAMPX + 0.5, FPZ = 3.2;
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; const r = P.rock({ s: 0.45, ry: i }); put(r, FPX - X5 + Math.cos(a) * 0.8, 0, FPZ + Math.sin(a) * 0.8); z5.add(r); } z5.add(disc(0.75, 0x4a4038, [FPX - X5, 0.04, FPZ]));
    for (const [x, z, ry] of [[-2.4, 0.3, 1.4], [2.4, 0.5, 1.7], [0.2, -2.3, 0.1]]) { z5.add(cyl(0.25, 0.27, 1.9, 0x7a5536, [FPX - X5 + x, 0.25, FPZ + z], [Math.PI / 2, 0, ry], 12)); z5.add(cyl(0.2, 0.2, 1.92, 0xc9a878, [FPX - X5 + x, 0.25, FPZ + z], [Math.PI / 2, 0, ry], 10)); }
    const sp5 = group([cyl(0.08, 0.08, 2.6, C.woodDark, [0, 1.3, 0], null, 5), box(4.6, 1.0, 0.08, C.wood, [0, 2.5, 0.03])]); const pl5 = plaque('Salt Lake Valley', 0.85); pl5.position.set(0, 2.5, 0.09); sp5.add(pl5); put(sp5, CAMPX - X5 + 7.5, 0, 2.2, -0.3); z5.add(sp5);
    S(4, ctx.addStatic(z5, X5, 0)); S(4, ctx.addStatic(z5far, X5, 0));
    ctx.collideCircle(FPX, FPZ, 1.0); ctx.collideCircle(CAMPX + 7.5, 2.2, 0.3);
    const train = new THREE.Group(); train.position.set(X5 - 6, 0, TRZ); D(4, ctx.add(train));
    const wagon5 = coveredWagon(); train.add(wagon5);
    const oxen = [ox(0xb5793f), ox(0xe3d3b4)]; oxen[0].position.set(4.3, 0, 0.8); oxen[1].position.set(4.3, 0, -0.8); train.add(oxen[0], oxen[1]);
    const yoke = group([box(0.16, 0.16, 2.5, 0xd2a567, [5.05, 1.62, 0]), torus(0.3, 0.04, 0xd2a567, [5.05, 1.32, 0.8], null, 8), torus(0.3, 0.04, 0xd2a567, [5.05, 1.32, -0.8], null, 8), box(0.08, 0.08, 0.08, 0x6e4a28, [2.6, 0.8, 0])]); bake(yoke); train.add(yoke);
    const walker = (opts, x, z) => { const p = person(opts); p.position.set(x, 0, z); p.rotation.y = Math.PI / 2; p.userData.dynamic = true; ctx.animate(p); train.add(p); return p; };
    const teamster = walker(man({ hat: 'cowboy', shirt: 0xb5563c, vest: 0x6e4a28, beard: C.hair[2], hair: C.hair[2] }), 6.9, 1.3);
    const anna5 = walker(ANNA, -3.0, 0.9);
    const child5 = walker({ scale: 0.68, shirt: 0xd9c27a, pants: 0x6e4a28, hair: C.hair[3], hat: 'straw', expressive: true }, -4.1, 0.1);
    const guide = D(4, ctx.person(man({ hat: 'cowboy', hatColor: 0x4a4038, shirt: 0x4f6a5a, vest: 0x8a6a4a, skin: C.skin[3], hair: C.hair[1] }), CAMPX + 6.2, 3.4, -1.2));
    const teamsterSit = hide(statue(man({ hat: 'cowboy', shirt: 0xb5563c, vest: 0x6e4a28, beard: C.hair[2], hair: C.hair[2] }), FPX + 2.3, FPZ + 0.45, -Math.PI / 2, 4, 'idle', true)); seatY(teamsterSit, 0.51); // (the logs are 0.51 m thick)
    const woodSpots = [[8, 3.2], [19, 6.2], [30, 2.2], [41, 6.4], [52, 3.0], [61, 6.0]];
    const mkWood = () => { const g = group([cyl(0.07, 0.07, 0.9, 0x7a5536, [0, 0.12, 0], [Math.PI / 2, 0, 0.3], 5), cyl(0.06, 0.06, 0.8, 0x8a6a45, [0.05, 0.2, 0], [Math.PI / 2, 0, -0.5], 5), cyl(0.06, 0.06, 0.85, 0x6e4a28, [-0.05, 0.28, 0], [Math.PI / 2, 0, 1.2], 5), disc(0.55, glow(0xffe27a), [0, 0.04, 0], 10)]); return bake(g); };
    const woods = woodSpots.map(([x, z]) => { const w = mkWood(); w.position.set(X5 + x, 0, z); return D(4, ctx.add(w)); });
    const fire5 = group([cone(0.45, 1.2, glow(0xff8a2a), [0, 0.6, 0], null, 6), cone(0.28, 0.8, glow(0xffd84a), [0.08, 0.45, 0.1], null, 5), cone(0.24, 0.7, glow(0xff5a2a), [-0.3, 0.35, -0.05], null, 5)]); bake(fire5); fire5.position.set(FPX, 0.1, FPZ); hide(D(4, ctx.add(fire5)));
    const stack5 = group([]); for (let i = 0; i < 5; i++) stack5.add(cyl(0.07, 0.07, 1.0, [0x7a5536, 0x6e4a28][i % 2], [Math.cos(i * 1.26) * 0.22, 0.4, Math.sin(i * 1.26) * 0.22], [Math.sin(i * 1.26) * 0.5, 0, -Math.cos(i * 1.26) * 0.5], 5)); bake(stack5); stack5.position.set(FPX, 0, FPZ); hide(D(4, ctx.add(stack5)));
    let trainGo = false, trainV = 0;
    ctx.onUpdate((dt, t) => {
      if (curZone !== 4) return;
      const px = ctx.player.position.x, end = CAMPX - 9; let v = 0;
      if (trainGo && train.position.x < end && px > train.position.x - 9) v = Math.max(2.5, Math.min(5.6, 2.5 + (px - train.position.x - 4) * 0.4));
      trainV += (v - trainV) * Math.min(1, dt * 3); train.position.x = Math.min(end, train.position.x + trainV * dt);
      for (const a of wagon5.userData.axles) a.rotation.z -= trainV * dt / a.userData.r;
      const mv = trainV > 0.5; oxen[0].position.y = mv ? Math.abs(Math.sin(t * 5)) * 0.05 : 0; oxen[1].position.y = mv ? Math.abs(Math.sin(t * 5 + 1.2)) * 0.05 : 0; oxen[0].rotation.z = mv ? Math.sin(t * 5) * 0.02 : 0; oxen[1].rotation.z = mv ? Math.sin(t * 5 + 1.2) * 0.02 : 0;
      if (trainGo) for (const p of [teamster, anna5, child5]) if (p.parent === train) p.userData.anim = mv ? 'walk' : 'idle';
      fire5.scale.set(1 + Math.sin(t * 13) * 0.12, 1 + Math.sin(t * 17) * 0.2, 1);
    });

    // ============ ZONE 6 — one room of the family's Utah home, seen through the generations (x≈700) ============
    const X6 = 700, HT = 0.86, HTX = 0, HTZ = -3.6, r6 = seeded(66);
    const era = {}; // name → static group, toggled as time passes
    const mkEra = (name, build) => { const g = new THREE.Group(); build(g); ctx.addStatic(g, X6, 0); g.visible = false; era[name] = g; return g; };
    const wallPaper = (g, c1, c2, stripes = 0) => { g.add(box(16, 4.4, 0.06, c1, [0, 2.2, -8.72])); for (const s of [-1, 1]) g.add(box(0.06, SWH, 12.4, c1, [s * 7.72, SWH / 2, -2.8])); if (stripes) for (let x = -7.6; x < 7.7; x += stripes) g.add(box(stripes * 0.36, 4.4, 0.03, c2, [x, 2.2, -8.68])); };
    const z6 = new THREE.Group();
    z6.add(plane(16, 12.6, 0xa06e42, [0, 0.02, -2.7]));
    z6.add(box(16, 4.4, 0.5, 0xd9c7a4, [0, 2.2, -9])); const SWH = 1.3; // side walls are cut low, doll's-house style, so they never fill the view
    z6.add(box(0.5, SWH, 12.6, 0xcdbb98, [-8, SWH / 2, -2.7])); z6.add(box(0.5, SWH, 12.6, 0xcdbb98, [8, SWH / 2, -2.7])); for (const s of [-1, 1]) z6.add(box(0.6, 0.08, 12.7, 0x8f5f38, [s * 8, SWH + 0.04, -2.7]));
    z6.add(P.tableProp(3.4, 1.7, HT, 0x9a6b3f).translateX(HTX).translateZ(HTZ)); // the plain wooden table
    const WX6 = 4.3; for (const s of [-1, 1]) { z6.add(box(0.16, 2.0, 0.2, 0x6e4a28, [WX6 + s * 1.1, 2.7, -8.66])); z6.add(box(2.36, 0.16, 0.2, 0x6e4a28, [WX6, 2.7 + s * 1.0, -8.66])); } z6.add(box(2.1, 1.9, 0.05, glow(0xbfe6f5), [WX6, 2.7, -8.7])); z6.add(box(0.08, 1.9, 0.1, 0x6e4a28, [WX6, 2.7, -8.64])); z6.add(box(2.1, 0.08, 0.1, 0x6e4a28, [WX6, 2.7, -8.64]));
    z6.add(box(1.3, 2.5, 0.12, 0x7a4a2a, [-5.6, 1.25, -8.68])); z6.add(sphere(0.07, C.gold, [-5.15, 1.2, -8.58], 6)); // door
    S(5, ctx.addStatic(z6, X6, 0));
    ctx.collideBox(X6 + HTX, HTZ - 0.45, 3.5, 2.7);
    const eraCols = [['cdfg', -2.3, HTZ, 0.35], ['cdfg', 2.3, HTZ, 0.35], ['b', -2.3, HTZ, 0.35], ['a', -5.2, -6.3, 0.7], ['a', 6.5, -5.7, 1.0], ['a', -1.6, -7.6, 1.3], ['cd', -6.6, -5.5, 0.9], ['e', -6.3, -6.6, 0.9], ['fg', -3.2, -7.7, 1.5], ['fg', -4.3, -7.7, 1.0], ['fg', -2.1, -7.7, 1.0]].map(([e, x, z, r]) => ({ e, x: X6 + x, c: ctx.collideCircle(X6 + x, z, r).c }));
    const chair = (x, z, ry, color = 0x8a5a2b) => group([box(0.5, 0.06, 0.5, color, [0, 0.5, 0]), box(0.5, 0.6, 0.06, color, [0, 0.83, -0.22]), box(0.06, 0.5, 0.06, color, [-0.2, 0.25, -0.2]), box(0.06, 0.5, 0.06, color, [0.2, 0.25, -0.2]), box(0.06, 0.5, 0.06, color, [-0.2, 0.25, 0.2]), box(0.06, 0.5, 0.06, color, [0.2, 0.25, 0.2])], [x, 0, z], [0, ry, 0]);
    const SBX = 6.9, SBZ = -3.2; // sideboard by the right wall (from 1900s on)
    const sideboard = (g, color) => { g.add(box(0.9, 1.0, 3.0, color, [SBX, 0.5, SBZ])); g.add(box(1.0, 0.08, 3.1, 0x4a3018, [SBX, 1.04, SBZ])); for (let i = 0; i < 3; i++) g.add(sphere(0.05, C.gold, [SBX - 0.47, 0.6, SBZ - 1 + i], 5)); };
    // --- 1860s: a pioneer log home ---
    mkEra('a', (g) => {
      for (let y = 0.25; y < 4.4; y += 0.5) { g.add(box(16, 0.44, 0.1, y % 1 < 0.5 ? 0x9a6b43 : 0x8a5f3a, [0, y, -8.72])); if (y < SWH) for (const s of [-1, 1]) g.add(box(0.1, 0.44, 12.4, y % 1 < 0.5 ? 0x8f623c : 0x80572f, [s * 7.72, y, -2.8])); }
      g.add(box(2.8, 3.0, 1.0, 0x8f8a80, [-1.6, 1.5, -8.3])); g.add(box(1.7, 1.3, 0.4, 0x2a2420, [-1.6, 0.65, -7.95])); g.add(box(3.1, 0.2, 1.2, 0x6e4a28, [-1.6, 2.2, -8.2])); g.add(cone(0.3, 0.7, glow(0xff8a2a), [-1.6, 0.45, -7.85], null, 6)); g.add(cone(0.18, 0.45, glow(0xffd84a), [-1.45, 0.35, -7.8], null, 5));
      g.add(lathe([[0.1, 0], [0.14, 0.1], [0.05, 0.2], [0.09, 0.36], [0.05, 0.5]], 0xd9b04a, [-0.8, 2.3, -8.1])); g.add(box(0.5, 0.36, 0.1, 0x4a3018, [-2.3, 2.5, -8.3]));
      g.add(disc(1.5, 0x9a4a3a, [-4.6, 0.045, -3], 30)); g.add(disc(1.05, 0xd9c27a, [-4.6, 0.05, -3], 26)); g.add(disc(0.55, 0x4f7a5a, [-4.6, 0.055, -3], 20));
      g.add(group([box(0.6, 0.07, 0.55, C.wood, [0, 0.5, 0]), box(0.6, 0.8, 0.07, C.wood, [0, 0.92, -0.26], [-0.15, 0, 0]), torus(0.5, 0.04, C.woodDark, [-0.28, 0.42, 0], [0, Math.PI / 2, 0], 10), torus(0.5, 0.04, C.woodDark, [0.28, 0.42, 0], [0, Math.PI / 2, 0], 10)], [-5.2, 0, -6.3], [0, 0.7, 0]));
      g.add(group([box(1.3, 0.6, 0.8, 0x7a4a2a, [0, 0.3, 0]), box(1.34, 0.24, 0.84, 0x8a5a2b, [0, 0.72, 0]), box(1.36, 0.07, 0.86, 0x3a3a3a, [0, 0.1, 0]), box(1.36, 0.07, 0.86, 0x3a3a3a, [0, 0.58, 0]), box(0.16, 0.2, 0.04, C.gold, [0, 0.55, 0.42])], [5.8, 0, -0.3], [0, -0.5, 0]));
      g.add(chair(-1, HTZ - 1.3, 0)); g.add(chair(1, HTZ - 1.3, 0)); g.add(box(1.6, 0.45, 0.5, C.wood, [5.5, 0.23, -7.9])); for (let i = 0; i < 3; i++) g.add(P.sack().translateX(6.6 - i * 0.1).translateZ(-6.4 + i * 0.7));
    });
    // --- early 1900s: wedding breakfast ---
    mkEra('b', (g) => {
      wallPaper(g, 0xe6d3b0, 0xd4b98c, 0.8); sideboard(g, 0x6e3f24);
      for (const x of [-1.2, 1.2]) { g.add(lathe([[0.08, 0], [0.13, 0.12], [0.06, 0.3], [0.1, 0.36]], 0x7a9fc9, [x, HT + 0.06, HTZ - 0.35])); for (let i = 0; i < 4; i++) g.add(sphere(0.09, [C.pink, C.white, 0xf2a0c0, C.white][i], [x + Math.cos(i * 1.6) * 0.1, HT + 0.5 + (i % 2) * 0.08, HTZ - 0.35 + Math.sin(i * 1.6) * 0.1], 6)); }
      for (const [x, z] of [[-1.1, 0.45], [0, 0.45], [1.1, 0.45], [-0.6, -0.45], [0.6, -0.45]]) g.add(cyl(0.17, 0.12, 0.03, 0xfafafa, [x, HT + 0.08, HTZ + z], null, 10));
      for (const [x, c] of [[-3.6, 0x5a4030], [0.4, 0x5a4030], [-1.6, 0x7a5a3a]]) { g.add(box(0.9, 1.2, 0.08, c, [x, 2.9, -8.62])); g.add(box(0.7, 1.0, 0.09, 0xe8dcc0, [x, 2.9, -8.61])); g.add(sphere(0.16, 0xc9a98a, [x, 3.0, -8.58], 7)); g.add(box(0.36, 0.3, 0.06, 0x4a4a5a, [x, 2.68, -8.58])); }
      g.add(group([box(0.5, 0.3, 0.5, 0x6e3f24, [0, 0.15, 0]), cone(0.45, 0.8, 0xd9b04a, [0.1, 0.75, 0], [0, 0, -2.5], 8)], [SBX, 1.08, SBZ + 1.0])); // gramophone
      g.add(chair(-1, HTZ - 1.3, 0, 0x6e3f24)); g.add(chair(1, HTZ - 1.3, 0, 0x6e3f24)); g.add(chair(-2.3, HTZ, Math.PI / 2, 0x6e3f24));
      for (let i = 0; i < 7; i++) { g.add(box(0.4, 0.3, 0.02, [C.pink, C.white, 0xf2c43d][i % 3], [-2.4 + i * 0.8, 4.0 - Math.abs(i - 3) * -0.06, -8.6], [0, 0, Math.PI / 4])); }
    });
    // --- 1930s & 1940s share a room ---
    mkEra('c', (g) => {
      wallPaper(g, 0xb9c4aa, 0xaab59a, 1.6); sideboard(g, 0x7a5a3a);
      g.add(group([box(0.6, 0.6, 0.4, 0x6e4a28, [0, 0.3, 0]), cyl(0.3, 0.3, 0.4, 0x6e4a28, [0, 0.6, 0], [Math.PI / 2, 0, 0], 10), cyl(0.17, 0.17, 0.42, 0xd9c27a, [0, 0.52, 0.01], [Math.PI / 2, 0, 0], 10), sphere(0.04, 0x222222, [-0.15, 0.14, 0.2], 5), sphere(0.04, 0x222222, [0.15, 0.14, 0.2], 5)], [SBX, 1.08, SBZ - 0.8], [0, -Math.PI / 2, 0])); // radio
      g.add(box(0.9, 1.1, 0.05, 0xf3ecd8, [-1.5, 2.9, -8.64])); g.add(box(0.9, 0.3, 0.06, 0xb5382c, [-1.5, 3.3, -8.63])); // calendar
      for (const s of [-1, 1]) { g.add(box(0.6, 2.2, 0.08, 0xc9b48a, [WX6 + s * 1.5, 2.7, -8.55])); g.add(box(0.25, 0.25, 0.09, 0x8a9a6a, [WX6 + s * 1.5, 2.2 + s * 0.3, -8.54])); }
      g.add(chair(-1, HTZ - 1.42, 0)); g.add(chair(1, HTZ - 1.42, 0)); g.add(chair(-2.3, HTZ, Math.PI / 2)); g.add(chair(2.3, HTZ, -Math.PI / 2)); // (the children's chairs stand a little back, so a spoon hand clears the table edge)
      g.add(disc(1.6, 0x8a7a6a, [-4.8, 0.045, -1.5], 30)); g.add(disc(1.3, 0x9a8a78, [-4.8, 0.05, -1.5], 28)); g.add(box(1.0, 0.9, 0.9, 0x6a5a4a, [-6.6, 0.45, -5.5])); g.add(box(1.0, 0.7, 0.25, 0x6a5a4a, [-7.0, 1.2, -5.5]));
    });
    mkEra('c2', (g) => { // 1930s table: soup pot and bread
      g.add(cyl(0.3, 0.26, 0.32, 0x3a3a3a, [0, HT + 0.22, HTZ], null, 10)); g.add(cyl(0.27, 0.27, 0.02, 0xd9a05a, [0, HT + 0.37, HTZ], null, 10)); g.add(ball(0.28, 0.13, 0.16, 0xc98a4a, [-0.9, HT + 0.18, HTZ + 0.1]));
      for (const [x, z] of [[-1.0, -0.5], [1.0, -0.5], [-1.3, 0.3], [1.3, 0.3]]) g.add(lathe([[0, 0], [0.1, 0.01], [0.16, 0.09]], 0xe8dcc0, [x, HT + 0.07, HTZ + z]));
    });
    mkEra('d', (g) => { // 1940s: a blue-star flag in the window, a photo, places set — one chair stays empty
      g.add(picture(0.66, 0.96, (c, W, H) => { c.fillStyle = '#b5382c'; c.fillRect(0, 0, W, H); c.fillStyle = '#fbf8ee'; c.fillRect(W * 0.12, H * 0.09, W * 0.76, H * 0.82); c.fillStyle = '#2b4f9a'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? 0.13 : 0.3) * W; c.lineTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); } c.closePath(); c.fill(); }, 128, [WX6 - 0.52, 2.9, -8.56]));
      g.add(box(0.5, 0.62, 0.06, 0x4a3018, [SBX - 0.1, 1.4, SBZ + 0.9], [0, -Math.PI / 2, 0.0])); g.add(box(0.05, 0.5, 0.38, 0xd9d2c2, [SBX - 0.14, 1.4, SBZ + 0.9])); g.add(sphere(0.1, 0xc9a98a, [SBX - 0.17, 1.45, SBZ + 0.9], 6)); g.add(box(0.06, 0.07, 0.26, 0x6b7a4a, [SBX - 0.19, 1.56, SBZ + 0.9]));
      for (const [x, z] of [[-1.0, -0.5], [1.0, -0.5], [-1.35, 0.0]]) g.add(cyl(0.17, 0.12, 0.03, 0xfafafa, [x, HT + 0.08, HTZ + z], null, 10));
      g.add(cyl(0.05, 0.06, 0.26, 0xf3ecd8, [0, HT + 0.2, HTZ], null, 6)); g.add(cone(0.04, 0.12, glow(0xffd84a), [0, HT + 0.4, HTZ], null, 5));
    });
    // --- 1960s ---
    mkEra('e', (g) => {
      wallPaper(g, 0xe8b86a, 0xd99a4a, 1.0); sideboard(g, 0xb5793f);
      for (let i = 0; i < 12; i++) g.add(cyl(0.22, 0.22, 0.03, [0x3aa6a0, 0xd9622b, 0xf3ecd8][i % 3], [-7 + i * 1.0 + (i % 2) * 0.3, 1.2 + (i * 37 % 7) * 0.4, -8.66], [Math.PI / 2, 0, 0], 8));
      g.add(group([box(1.2, 0.8, 0.7, 0x7a5536, [0, 0.95, 0]), box(0.8, 0.56, 0.04, glow(0x9fd8e8), [-0.12, 0.97, 0.36]), box(0.06, 0.55, 0.06, 0x4a3018, [-0.5, 0.28, 0.25], [0, 0, 0.15]), box(0.06, 0.55, 0.06, 0x4a3018, [0.5, 0.28, 0.25], [0, 0, -0.15]), box(0.06, 0.55, 0.06, 0x4a3018, [-0.5, 0.28, -0.25], [0, 0, 0.15]), box(0.06, 0.55, 0.06, 0x4a3018, [0.5, 0.28, -0.25], [0, 0, -0.15]), cyl(0.015, 0.015, 0.7, 0x888888, [-0.15, 1.65, 0], [0, 0, 0.5], 4), cyl(0.015, 0.015, 0.7, 0x888888, [0.15, 1.65, 0], [0, 0, -0.5], 4), sphere(0.05, 0x333333, [0.44, 1.1, 0.36], 5), sphere(0.05, 0x333333, [0.44, 0.9, 0.36], 5)], [-6.3, 0, -6.6], [0, 0.8, 0])); // television
      g.add(group([cyl(0.3, 0.3, 0.04, 0xd9b04a, [0, 0, 0], [Math.PI / 2, 0, 0], 12)].concat(Array.from({ length: 8 }, (_, i) => box(0.04, 1.1, 0.03, 0xd9b04a, [0, 0, 0], [0, 0, i * Math.PI / 8]))), [-1.5, 3.1, -8.6])); // starburst clock
      g.add(group([cyl(0.04, 0.06, 1.5, 0x888888, [0, 0.75, 0], null, 6), cone(0.4, 0.5, 0xd9622b, [0, 1.6, 0], null, 10)], [6.6, 0, -7.6]));
      g.add(disc(1.9, 0x3a9a94, [-4.5, 0.045, -2], 32)); g.add(disc(1.2, 0xd9822b, [-4.5, 0.05, -2], 28));
      g.add(chair(-1, HTZ - 1.3, 0, 0x3aa6a0)); g.add(chair(1, HTZ - 1.3, 0, 0x3aa6a0));
    });
    // --- today ---
    const CBX = -7.1, CBZ = -2.6; // the linen cupboard on the left wall, far from the sunny window
    mkEra('f', (g) => {
      wallPaper(g, 0xe9eee8, 0xe9eee8, 0); sideboard(g, 0xf3ecd8);
      g.add(box(1.0, 2.6, 2.2, 0xd9d2c2, [CBX, 1.3, CBZ])); g.add(box(0.9, 2.4, 2.0, 0x3a3330, [CBX + 0.08, 1.3, CBZ])); for (const y of [0.7, 1.4, 2.0]) g.add(box(0.9, 0.06, 2.0, 0xbfb8a8, [CBX + 0.1, y, CBZ])); for (let i = 0; i < 4; i++) g.add(box(0.6, 0.18, 0.7, [0xf7f3e8, 0xcfd9e6, 0xe8dcc0, 0xd9c7d9][i], [CBX + 0.15, 0.82 + Math.floor(i / 2) * 1.3, CBZ - 0.5 + (i % 2) * 1.0]));
      g.add(box(3.2, 0.5, 1.1, 0x7a8fa8, [-3.2, 0.35, -7.8])); g.add(box(3.2, 0.8, 0.3, 0x7a8fa8, [-3.2, 0.9, -8.35])); for (const s of [-1, 1]) g.add(box(0.3, 0.75, 1.1, 0x6a7f98, [-3.2 + s * 1.6, 0.5, -7.8])); g.add(box(0.6, 0.4, 0.2, 0xe98a2b, [-4.0, 0.8, -8.0], [0.3, 0, 0.2]));
      for (const [x, y, w, c] of [[-0.6, 3.0, 0.9, 0x3a3a3a], [0.5, 3.2, 0.6, 0x8a6a45], [0.5, 2.5, 0.6, 0x3a3a3a], [1.3, 2.9, 0.7, 0xd9b04a]]) { g.add(box(w, w * 0.8, 0.06, c, [x, y, -8.64])); g.add(box(w - 0.14, w * 0.8 - 0.14, 0.07, [0xd9c7a4, 0xbfd6e6, 0xe6d3c0][Math.round(x + 2) % 3], [x, y, -8.63])); }
      for (const x of [-1.3, 1.3]) { g.add(cyl(0.01, 0.01, 1.1, 0x333333, [x, 3.85, HTZ], null, 4)); g.add(cone(0.32, 0.3, 0xf2c43d, [x, 3.2, HTZ], null, 10)); }
      g.add(group([cyl(0.2, 0.14, 0.4, 0xd9622b, [0, 0.2, 0], null, 8), sphere(0.35, 0x4f9d4a, [0, 0.7, 0], 6), sphere(0.25, 0x5aa845, [0.2, 0.95, 0.1], 6)], [6.9, 0, -7.8]));
      g.add(disc(2.6, 0xc9b8a0, [0, 0.045, HTZ], 36)); g.add(chair(-1, HTZ - 1.6, 0, 0xf3ecd8)); g.add(chair(1, HTZ - 1.6, 0, 0xf3ecd8)); /* (a little back from the table: room for the diners' straight arms and legs) */ g.add(chair(-2.3, HTZ, Math.PI / 2, 0xf3ecd8)); g.add(chair(2.3, HTZ, -Math.PI / 2, 0xf3ecd8));
    });
    mkEra('g', (g) => { // Thanksgiving 2026: autumn bunting; the feast itself pops onto the table at the very end
      g.add(lathe([[0.1, 0], [0.16, 0.14], [0.08, 0.34], [0.12, 0.4]], 0xd9622b, [SBX, 1.08, SBZ + 0.9])); for (let i = 0; i < 5; i++) g.add(sphere(0.09, [0xe9a23b, 0xc23b22, 0xf2c43d][i % 3], [SBX + Math.cos(i * 1.3) * 0.12, 1.6 + (i % 2) * 0.1, SBZ + 0.9 + Math.sin(i * 1.3) * 0.12], 6));
      for (let i = 0; i < 9; i++) g.add(box(0.3, 0.24, 0.02, [0xd9622b, 0xe9a23b, 0xc23b22][i % 3], [-3.2 + i * 0.8, 3.95 + (i % 2) * 0.1, -8.62], [0, 0, Math.PI / 4]));
    });
    const sbCol = ctx.collideBox(X6 + SBX, SBZ, 1.0, 3.1).c, trCol = ctx.collideCircle(X6 + 5.8, -0.3, 0.8).c, cbCol = ctx.collideBox(X6 + CBX, CBZ, 1.0, 2.2).c; // solid only in the eras where they exist (see setEra)
    D(5, ctx.add(floorMesh(16, 12.6, plankTex(26, 0xb07a4a, { seed: 8 })), X6, -2.7)); // floor boards
    const cloth6 = tableCloth(3.7, 2.0, cloth.tex); cloth6.position.set(X6 + HTX, HT + 0.05, HTZ); hide(D(5, ctx.add(cloth6)));
    let yearSign = null; const setYear = (txt) => { if (yearSign) ctx.remove(yearSign); yearSign = plaque(txt, 0.8); yearSign.position.set(X6 - 3.85, 1.75, -8.5); D(5, ctx.add(yearSign)); };
    const sunbeam = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 7), mat(0xfff0a0, { opacity: 0.22, side: 'double' })); sunbeam.position.set(X6 + WX6, 1.5, -6.0); sunbeam.rotation.x = -0.95; hide(D(5, ctx.add(sunbeam)));
    const P6 = (opts, x, z, ry) => { const p = ctx.person(opts, X6 + x, z, ry); hide(D(5, p)); return p; };
    const folk = {
      a: [P6(ANNA, 2.6, -1.6, -0.8), P6({ dress: 0x4f7a5a, shirt: 0x4f7a5a, hairStyle: 'long', hair: C.hair[2], skin: C.skin[0], expressive: true }, -2.9, -2.2, 1.0), P6({ scale: 0.68, shirt: 0xd9c27a, pants: 0x6e4a28, hair: C.hair[3], expressive: true }, -2.0, -5.6, 0.5)],
      b: [P6({ dress: 0xfafafa, shirt: 0xfafafa, hairStyle: 'bun', hair: C.hair[2], skin: C.skin[0], expressive: true }, -0.7, -5.8, 0.2), P6({ shirt: 0xfafafa, vest: 0x2a2a2a, pants: 0x2a2a2a, hat: 'tophat', hair: C.hair[0], skin: C.skin[1], expressive: true }, 0.7, -5.8, -0.2), P6({ dress: 0x4f7a5a, shirt: 0x4f7a5a, hairStyle: 'bun', hair: C.hair[4], skin: C.skin[0], glasses: true, expressive: true }, -3.0, -2.6, 1.1)],
      c: [P6({ dress: 0x8a7a9a, shirt: 0x8a7a9a, apron: 0xd9d2c2, hairStyle: 'curly', hair: C.hair[0], skin: C.skin[0], expressive: true }, 2.9, -2.0, -0.9), P6({ scale: 0.68, shirt: 0x7a8a6a, pants: 0x5a4a3a, hair: C.hair[2], expressive: true }, -1, HTZ - 1.37, 0), P6({ scale: 0.68, dress: 0x9a6a5a, shirt: 0x9a6a5a, hairStyle: 'pony', hair: C.hair[3], expressive: true }, 1, HTZ - 1.37, 0)],
      d: [P6({ dress: 0x5a6a8a, shirt: 0x5a6a8a, hairStyle: 'curly', hair: C.hair[2], skin: C.skin[0], expressive: true }, -2.9, -2.0, 0.9), P6({ scale: 0.68, shirt: 0xb5563c, pants: 0x3b5b8c, hair: C.hair[2], expressive: true }, -1, HTZ - 1.37, 0)],
      e: [P6({ dress: 0xe98a2b, shirt: 0xe98a2b, hairStyle: 'curly', hair: C.hair[3], skin: C.skin[0], glasses: true, expressive: true }, -2.8, -2.0, 0.9), P6({ scale: 0.85, shirt: 0x3aa6a0, pants: 0x2b3f66, hairStyle: 'pony', hair: C.hair[2], skin: C.skin[0], expressive: true }, 4.8, -1.6, -1.2)],
      f: [P6({ hair: C.hair[5], hairStyle: 'bun', shirt: C.purple, dress: 0x5a4a7a, glasses: true, skin: C.skin[0], expressive: true }, -2.6, -1.4, 0.9)],
    };
    folk.b[0].userData.anim = folk.b[1].userData.anim = 'idle'; folk.c[1].userData.sitting = folk.c[2].userData.sitting = true; folk.c[1].userData.anim = folk.c[2].userData.anim = 'eat'; folk.d[1].userData.sitting = true; folk.d[1].userData.anim = 'eat'; for (const p of [folk.c[1], folk.c[2], folk.d[1]]) seatY(p, 0.53); // on the chairs (seat 0.53 m up)
    const family26 = [P6({ shirt: 0x3f7fd1, hair: C.hair[0], beard: C.hair[0], skin: C.skin[0], expressive: true }, -1, HTZ - 1.55, 0), P6({ shirt: 0xd9483b, hairStyle: 'long', hair: C.hair[3], skin: C.skin[0], expressive: true }, 1, HTZ - 1.55, 0), statue({ scale: 0.68, shirt: 0xf2c43d, hairStyle: 'pony', hair: C.hair[2] }, X6 - 2.25, HTZ, Math.PI / 2, 5, 'cheer', true), statue({ shirt: 0x4f9d4a, hair: C.hair[4], glasses: true, skin: C.skin[1] }, X6 + 2.25, HTZ, -Math.PI / 2, 5, 'laugh', true)]; family26.forEach(hide); family26.forEach(p => seatY(p, 0.53)); family26[0].userData.sitting = family26[1].userData.sitting = true; family26[0].userData.anim = 'laugh'; family26[1].userData.anim = 'talk';
    const dish = (parts, x, z) => { const g = group(parts); bake(g); g.position.set(X6 + HTX + x, HT + 0.07, HTZ + z); return hide(D(5, ctx.add(g))); };
    const feast = [
      dish([cyl(0.48, 0.42, 0.04, 0xfafafa, [0, 0.02, 0], null, 12), ball(0.36, 0.25, 0.28, 0xb5692a, [0, 0.27, 0]), sphere(0.11, 0xb5692a, [0.32, 0.3, 0.15], 6), sphere(0.11, 0xb5692a, [0.32, 0.3, -0.15], 6), sphere(0.07, 0x4f9d4a, [-0.3, 0.08, 0.25], 5), sphere(0.07, 0xd9483b, [-0.36, 0.08, -0.1], 5)], 0, 0),
      dish([lathe([[0, 0], [0.2, 0.02], [0.28, 0.18]], 0xfafafa), ball(0.24, 0.13, 0.24, 0xfbefb8, [0, 0.17, 0]), box(0.1, 0.03, 0.1, 0xffd84a, [0.03, 0.3, 0])], -0.95, -0.3),
      dish([cyl(0.24, 0.2, 0.08, 0xc98a4a, [0, 0.04, 0], null, 12), cyl(0.2, 0.2, 0.03, 0xd9622b, [0, 0.09, 0], null, 12), sphere(0.05, 0xfafafa, [0, 0.12, 0], 5)], 0.95, 0.3),
      dish([lathe([[0, 0], [0.14, 0.02], [0.18, 0.12]], 0xe8eef2), ball(0.15, 0.08, 0.15, 0xb0122e, [0, 0.12, 0])], 0.9, -0.4),
      dish([cyl(0.05, 0.06, 0.3, 0x2f5a3a, [0, 0.15, 0], null, 8), cyl(0.02, 0.025, 0.14, 0x2f5a3a, [0, 0.36, 0], null, 6), cyl(0.026, 0.026, 0.05, C.gold, [0, 0.42, 0], null, 6)], -0.75, 0.4),
      dish([-1.3, -0.45, 0.45, 1.3].flatMap((x) => [cyl(0.17, 0.12, 0.03, 0xfafafa, [x, 0.015, 0.62], null, 10), cyl(0.17, 0.12, 0.03, 0xfafafa, [x * 0.75, 0.015, -0.62], null, 10)]), 0, 0),
    ];
    const ERA = { a: ['a'], b: ['b'], c: ['c', 'c2'], d: ['c', 'd'], e: ['e'], f: ['f'], g: ['f', 'g'] }, YEAR = { a: 'Utah', b: '1900s', c: '1930s', d: '1940s', e: '1960s', f: 'Today', g: '2026' };
    const setEra = (k) => { for (const n in era) era[n].visible = ERA[k].includes(n); for (const n in folk) folk[n].forEach(p => (n === k || (k === 'g' && n === 'f')) ? show(p) : hide(p)); family26.forEach(p => k === 'g' ? show(p) : hide(p)); setYear(YEAR[k]); (k === 'f' || k === 'g') ? show(sunbeam) : hide(sunbeam); sbCol.x1 = k === 'a' ? 9999 : X6 + SBX - 0.5; sbCol.x2 = k === 'a' ? 9999 : X6 + SBX + 0.5; trCol.x = k === 'a' ? X6 + 5.8 : 9999; for (const ec of eraCols) ec.c.x = ec.e.includes(k) ? ec.x : 9999; cbCol.x1 = (k === 'f' || k === 'g') ? X6 + CBX - 0.5 : 9999; cbCol.x2 = (k === 'f' || k === 'g') ? X6 + CBX + 0.5 : 9999; };

    // =================== THE STORY ===================
    ctx.onStart(async () => {
      const TOTAL = 30, DOTS = 13; let step = 0; const done = () => ctx.progress(Math.round(++step * DOTS / TOTAL), DOTS); ctx.progress(0, DOTS); // 27 small steps shown as 13 dots
      const skip = +(new URLSearchParams(location.search).get('tc') || 0); // developer shortcut: ?tc=3 starts at chapter 3

      // ---------------- 1. 1853 · the flax field ----------------
      const ch1 = async () => {
        showZone(0); ctx.bounds(-19, -12.5, 22, 6.5);
        ctx.banner('🌾', '1853', 2.2);
        sayQ(farmer, 'Linen starts as flax! 🌾');
        let pulled = 0; const left = () => clumps.find(c => !c.userData.pulled);
        ctx.goal('🌾', 'Pull the flax', left());
        for (const c of clumps) ctx.interact({ at: c, icon: '💪', label: 'Pull', hold: 0.6, r: 1.9, y: 1.8, sfx: 'dig', onUse: async () => {
          c.userData.pulled = true; pulled++; ctx.burst([c.position.x, 0.1, c.position.z], { color: 0x7a5536, n: 10 });
          ctx.goal('🌾', pulled < 3 ? 'Pull ' + (3 - pulled) + ' more' : 'Pull the flax', left());
          ctx.tween(c.rotation, { z: 1.45, y: 0.4 }, 0.5); await ctx.tween(c.position, { y: 1.6 }, 0.25, 'out');
          ctx.tween(c.position, { x: pile[0] + (pulled % 2) * 0.3, z: pile[1] + pulled * 0.12 }, 0.5); await ctx.wait(0.25); await ctx.tween(c.position, { y: 0.12 + pulled * 0.1 }, 0.3, 'in'); ctx.audio.play('thud');
        } });
        await ctx.until(() => pulled >= 3); done();
        fact('🌾', 'Flax is pulled, not cut — that keeps the fibres long.');
        await ctx.wait(0.9);
        for (const c of clumps) ctx.remove(c);
        const sh1 = bake(sheaf(FLAX_GREEN)); D(0, ctx.add(sh1, pile[0], pile[1])); sh1.position.y = 0.25; ctx.burst(sh1.position, { color: FLAX_GREEN, n: 8 });
        sayQ(farmer, 'Now soak it in the pond 💧');
        ctx.goal('🌾', 'Pick up the flax', sh1);
        await use({ at: sh1, icon: '🌾', label: 'Pick up', y: 1.2 }); hold(sh1, 0.1, 0.08);
        // retting
        ctx.goal('💧', 'Soak the flax', pond);
        await use({ at: [PX - 1.4, PZ + 4.5], face: [PX, PZ], icon: '💧', label: 'Soak', r: 2.4, y: 1.4, sfx: 'splash' });
        ctx.drop(); ctx.add(sh1, PX - 0.4, PZ + 0.6); sh1.position.y = 1.2; ctx.lock();
        await ctx.tween(sh1.position, { y: 0.12 }, 0.35, 'in'); ctx.burst([PX - 0.4, 0.2, PZ + 0.6], { color: 0x9fd6f2, n: 14 });
        sayQ(harvester, 'Let it soak a while 💧', 2.6); fact('💧', 'This soaking is called retting: tiny living things loosen the fibres.');
        const bub = ctx.every(0.3, () => { ctx.burst([PX - 1 + Math.random() * 1.6, 0.1, PZ + Math.random() * 1.2], { color: 0xdff3ff, n: 2, speed: 0.4, size: 0.16, y: 0 }); ctx.audio.play('bubble'); });
        await ctx.wait(2.4); bub(); ctx.remove(sh1);
        const sh2 = bake(sheaf(STRAW, false)); D(0, ctx.add(sh2, PX - 0.4, PZ + 0.6)); sh2.position.y = 0.12;
        ctx.tween(sh2.position, { x: PX - 3.2, z: PZ + 5.6 }, 0.6); await ctx.tween(sh2.position, { y: 1.6 }, 0.3, 'out'); await ctx.tween(sh2.position, { y: 0.25 }, 0.3, 'in'); ctx.emote(sh2, '☀️', { y: 1 }); ctx.unlock(); done();
        ctx.goal('🌾', 'Take the dry flax', sh2);
        await use({ at: sh2, icon: '🌾', label: 'Pick up', y: 1.2 }); hold(sh2, 0.1, 0.08);
        // breaking
        sayQ(processor, 'Break the woody stems! 🔨');
        ctx.goal('🔨', 'Break the stalks', [BX, BZ + 1.2]);
        let chop = 0; const stopArm = ctx.onUpdate((dt, t) => { const target = chop > 0 ? 0.05 + Math.abs(Math.sin(t * 11)) * 0.6 : 0.45; brakeArm.rotation.z += (target - brakeArm.rotation.z) * Math.min(1, dt * 20); });
        const brakeIt = ctx.interact({ at: [BX, BZ + 1.0], face: [BX, BZ], icon: '🔨', label: 'Break', hold: 1.5, r: 2.2, y: 1.7, sfx: 'thud', onUse: () => { chop = 2; } });
        const stopChips = ctx.every(0.16, () => { if (holding(brakeIt)) { chop = 1; ctx.burst([BX, 1.0, BZ], { color: 0xb59a5a, n: 3, speed: 1.5, size: 0.12 }); ctx.audio.play('knock'); } else if (chop === 1) chop = 0; });
        await ctx.until(() => chop === 2); stopChips(); ctx.lock();
        ctx.remove(ctx.drop()); ctx.burst([BX, 1.0, BZ], { color: 0xb59a5a, n: 16, speed: 2.5, size: 0.14 }); await ctx.wait(0.5); chop = 0;
        // scutching by the fibre worker…
        processor.userData.anim = 'work'; sayQ(processor, 'Scrape… then comb! ✨', 2);
        for (let i = 0; i < 5; i++) { ctx.burst([BX - 2.3, 1.0, BZ - 1.1], { color: FIBRE, n: 4, speed: 1, size: 0.1 }); ctx.audio.play('snip'); await ctx.wait(0.3); }
        processor.userData.anim = 'idle'; stopArm(); ctx.unlock(); done();
        // …then combing (hackling) with the player — mini-game: the comb sorts long fibre (for linen) from short tow (for rope)
        sayQ(processor, 'Long fibre for linen! ✨', 2.6);
        ctx.goal('✨', 'Comb the fibre', [BX - 2.6, BZ - 1.2]);
        await use({ at: [BX - 2.6, BZ + 0.1], face: [BX - 2.6, BZ - 1.2], icon: '✨', label: 'Comb', r: 2.2, y: 1.6, sfx: 'snip' });
        ctx.goal('✨', 'Long or short?'); processor.userData.anim = 'work';
        await hackleGame(ctx);
        processor.userData.anim = 'idle';
        const st = bake(strick()); D(0, ctx.add(st, BX - 2.3, BZ - 1.1)); st.position.y = 1.0; st.scale.setScalar(0.01); ctx.tween(st.scale, { x: 1, y: 1, z: 1 }, 0.6, 'outBack'); ctx.burst([BX - 2.3, 1.0, BZ - 1.1], { color: FIBRE, n: 10, speed: 1.2, size: 0.12 }); done();
        fact('✨', 'Combing sorts the fibre: long for linen, short "tow" for rope.');
        ctx.thank('🌾', ['Flax farmers', 'Harvesters', 'Fibre processors']);
        ctx.goal('✨', 'Take the fibre', st);
        await use({ at: st, icon: '✨', label: 'Take', y: 0.9, r: 2.6 }); hold(st, 0.07, 0.03);
        spinner1.userData.anim = 'wave'; sayQ(spinner1, 'Over here! I will spin it 🧵');
        ctx.goal('🧵', 'To the spinner', spinner1);
        await new Promise(res => ctx.zone({ x: -16.9, z: 3.9, r: 1.9, onEnter: res }));
        ctx.remove(ctx.drop());
      };

      // ---------------- 2. spinning & weaving ----------------
      const ch2 = async () => {
        ctx.bounds(null);
        await ctx.chapter({ n: 2, title: 'Spin & Weave', emoji: '🧵', env: ['day', { fog: [50, 150] }], at: [X2 - 9, 1.5], face: Math.PI * 0.6, cam: { yaw: 0, pitch: 0.5, dist: 10 }, setup: () => showZone(1) });
        ctx.bounds(X2 - 12.2, -9.9, X2 + 20, 4.6);
        const fib = bake(strick()); hold(fib, 0.07, 0.03);
        sayQ(spinner, 'Twist the fibre into thread 🌀');
        ctx.goal('🌀', 'Spin the thread', [X2 + WX + 0.4, WZ + 1.2]);
        let spin = 0.6; const stopWheel = ctx.onUpdate((dt) => { wheel2.rotation.z -= dt * spin; });
        await use({ at: [X2 + WX + 0.4, WZ + 1.0], face: [X2 + WX + 0.45, WZ], icon: '🌀', label: 'Spin', r: 2.3, y: 1.9, sfx: 'ding' });
        // mini-game: treadle the wheel in rhythm (tap when the dot reaches the star); every good push winds more thread onto the bobbin behind the pop-up
        ctx.goal('🌀', 'Keep the rhythm'); spin = 7;
        await treadleGame(ctx, { onGood: (n, need) => { bobbin.scale.y = bobbin.scale.z = 1 + 2 * n / need; } });
        spin = 0.6; bobbin.scale.set(1, 3, 3); ctx.remove(ctx.drop()); done(); sayQ(spinner, 'Steady feet make even thread! 🌀', 2.6);
        const spool = group([cyl(0.13, 0.13, 0.34, LINEN, [0, 0, 0], null, 8), cyl(0.17, 0.17, 0.04, C.wood, [0, 0.18, 0], null, 8), cyl(0.17, 0.17, 0.04, C.wood, [0, -0.18, 0], null, 8)]); bake(spool); ctx.carry(spool); ctx.emote(ctx.player, '🧵');
        sayQ(weaver, 'Over, under, over, under! 🧵');
        ctx.goal('🧵', 'Weave the cloth', [X2 + LX, LZ + 3.2]);
        let rows = 0, busy = false; const ROWS = 4;
        const weaveIt = ctx.interact({ at: [X2 + LX, LZ + 3.2], face: [X2 + LX, LZ], icon: '🧵', label: 'Weave', once: false, r: 2.3, y: 1.9, sfx: 'whoosh', when: () => !busy && rows < ROWS, onUse: async () => {
          busy = true; if (rows === 0) { ctx.remove(ctx.drop()); fact('🧵', 'Weavers cross thousands of threads on a loom to make linen.'); }
          const side = rows % 2 ? -1 : 1; weaver.userData.anim = 'work'; await ctx.tween(shuttle.position, { x: side * 1.25 }, 0.28, 'inOut');
          await ctx.tween(beater.position, { z: 0.95 - (rows + 1) * 0.2 + 0.12 }, 0.1, 'in'); ctx.audio.play('thud'); ctx.cam.shake = 0.05; rows++;
          weave.scale.z = rows * 0.22; ctx.tween(beater.position, { z: 0.25 }, 0.2); ctx.goal('🧵', rows < ROWS ? 'Weave ' + (ROWS - rows) + ' more' : 'Weave the cloth', [X2 + LX, LZ + 3.2]); busy = false;
        } });
        await ctx.until(() => rows >= ROWS); weaveIt.remove(); weaver.userData.anim = 'idle'; done();
        ctx.act('cheer', 1, weaver); sayQ(weaver, 'Look — real linen cloth! 🧵', 2.4);
        await ctx.wait(0.8);
        const roll = group([cyl(0.2, 0.2, 0.9, LINEN_RAW, [0, 0, 0], [0, 0, Math.PI / 2], 9)]); bake(roll); weave.scale.z = 0.02; hold(roll, 0.1, 0.1);
        // bleaching
        ctx.goal('☀️', 'Lay in the sun', [GX, GZ]);
        await use({ at: [GX, GZ + 1.7], face: [GX, GZ], icon: '☀️', label: 'Lay out', r: 2.2, y: 2.3 });
        ctx.remove(ctx.drop()); show(greenCloth); ctx.audio.play('whoosh'); greenCloth.scale.set(0.1, 0.1, 1); await ctx.tween(greenCloth.scale, { x: 1, y: 1 }, 0.5, 'outBack');
        ctx.goal('💧', 'Sprinkle with water', [GX, GZ]);
        const wet = ctx.interact({ at: [GX, GZ + 1.7], face: [GX, GZ], icon: '💧', label: 'Sprinkle', hold: 1.4, r: 2.2, y: 2.3, sfx: 'water', onUse: () => { wet.doneIt = true; } });
        const stopWet = ctx.every(0.12, () => { if (holding(wet)) { ctx.burst([GX - 1.2 + Math.random() * 2.4, 1.3, GZ - 0.7 + Math.random() * 1.4], { color: 0x7fc8ff, n: 3, speed: 0.8, size: 0.15 }); if (Math.random() < 0.3) ctx.audio.play('water'); } });
        await ctx.until(() => wet.doneIt); stopWet(); ctx.lock();
        const c0 = new THREE.Color(LINEN_RAW), c1 = new THREE.Color(0xffffff), k = { v: 0 }; const stopCol = ctx.onUpdate(() => greenCloth.material.color.copy(c0).lerp(c1, k.v));
        const spark = ctx.every(0.25, () => { ctx.burst([GX - 1.3 + Math.random() * 2.6, 0.2, GZ - 0.8 + Math.random() * 1.6], { color: 0xfff6c0, n: 3, speed: 0.6, size: 0.14 }); });
        ctx.emote(greenCloth, '☀️', { y: 1.5 }); fact('☀️', 'Water, sunlight and air bleach linen white, again and again.');
        await ctx.tween(k, { v: 1 }, 2.8, 'linear'); spark(); stopCol(); ctx.audio.play('sparkle'); ctx.unlock(); done();
        // the merchant
        sayQ(merchant, 'Fine linen! I will sell it 💰');
        ctx.goal('🧺', 'Fold the linen', [GX, GZ]);
        await use({ at: [GX, GZ + 1.7], face: [GX, GZ], icon: '🧺', label: 'Fold', r: 2.2, y: 2.3 });
        hide(greenCloth); const bolt = foldedCloth(false); hold(bolt, 0.06, 0.1); ctx.goal('💰', 'To the merchant', merchant);
        await use({ at: merchant, icon: '💰', label: 'Trade', r: 3 });
        ctx.audio.play('coin'); ctx.act('wave', 1.4, merchant); done();
        ctx.thank('🧵', ['Spinners', 'Weavers', 'Merchants']);
        await sayQ(merchant, 'Anna will love this! 💛', 2);
        await ctx.wait(1.6); stopWheel();
      };

      // ---------------- 3. Anna's cottage: thousands of tiny stitches ----------------
      const ch3 = async () => {
        ctx.bounds(null);
        await ctx.chapter({ n: 3, title: "Anna's Cottage", emoji: '🕯️', env: ['indoor', { ground: 0x6f563c, top: '#15110e', bottom: '#2a211a', fog: false, amb: 0.85, sunI: 0.8 }], at: [X3 - 3.5, 0.8], face: Math.PI * 0.75, cam: { yaw: 0, pitch: 0.55, dist: 9 }, music: 'calm', setup: () => { showZone(2); cloth.set(0); } });
        ctx.bounds(X3 - 6.4, -8.2, X3 + 6.4, 2.4);
        if (!ctx.carrying) hold(foldedCloth(false), 0.06, 0.1);
        sayQ(anna, 'Linen! For my tablecloth 💛');
        ctx.goal('🧵', 'Bring Anna the linen', [X3 + TX, TZ]);
        await use({ at: [X3 + TX, TZ + 1.5], face: [X3 + TX, TZ], icon: '🧵', label: 'Spread', r: 2.4, y: 1.7, sfx: 'whoosh' });
        ctx.remove(ctx.drop()); show(cloth3); cloth3.scale.set(0.1, 1, 0.1); await ctx.tween(cloth3.scale, { x: 1, z: 1 }, 0.5, 'outBack'); done();
        // no electric light: fetch a flame from the fireplace
        sayQ(anna, 'Too dark to sew… 🕯️');
        ctx.goal('🔥', 'Fetch a flame', [X3 + FX, FZ + 0.9]);
        await use({ at: [X3 + FX + 0.8, FZ + 2.6], face: [X3 + FX, FZ + 0.6], icon: '🔥', label: 'Light a stick', r: 2.4, y: 1.5, sfx: 'fire' });
        fact('🕯️', 'No electric light, no sewing machine — just needle and thread.');
        const taper = group([cyl(0.025, 0.025, 0.6, 0xd2a567, [0, 0.1, 0], [0.5, 0, 0], 5), cone(0.07, 0.2, glow(0xffb43a), [0, 0.45, 0.2], null, 5)]); bake(taper); hold(taper, 0.04, 0, 0.23); // the lit stick is in the right hand
        ctx.goal('🕯️', 'Light the candle', flame3);
        await use({ at: [X3 + TX + 0.8, TZ + 1.5], face: [X3 + TX + 1.0, TZ - 0.45], icon: '🕯️', label: 'Light', r: 2.4, y: 1.7, sfx: 'fire' });
        ctx.remove(ctx.drop()); show(flame3); ctx.tween(ctx.hemi, { intensity: 1.55 }, 1.2); ctx.tween(ctx.sun, { intensity: 1.5 }, 1.2); ctx.burst(flame3.position, { color: 0xffd84a, n: 10, speed: 1, size: 0.12 }); done();
        anna.userData.anim = 'sew'; sayQ(anna, 'Help me stitch a flower? 🌸');
        // the embroidery mini-game
        ctx.goal('🌸', 'Embroider a flower', [X3 + TX, TZ]);
        await use({ at: [X3 + TX, TZ + 1.5], face: [X3 + TX, TZ], icon: '🌸', label: 'Stitch', r: 2.4, y: 1.7, sfx: 'stitch' });
        ctx.goal('🌸', 'Tap the glowing dots');
        await embroideryGame(ctx);
        cloth.set(1); ctx.burst([X3 + TX, TH + 0.3, TZ], { color: FLAX_BLUE, n: 14, speed: 2, size: 0.14 }); ctx.act('clap', 1.2, anna); sayQ(anna, 'Beautiful! Now… many more 😊', 2.2); done();
        await ctx.wait(1.6);
        // months of evenings
        ctx.goal('🌙', 'Months of evenings…'); ctx.banner('🌙', 'Months of evenings…', 3.2); fact('🌙', 'Some evenings Anna finished only a few inches.');
        const foc = ctx.focus([X3 + TX, TH, TZ], 4.6, { dist: 5.2, pitch: 0.95 });
        ctx.tween(moon.position, { x: X3 + WNX + 0.55, y: 3.0 }, 4.4, 'linear');
        for (let n = 2; n <= cloth.max; n++) { await ctx.wait(0.5); cloth.set(n); ctx.audio.play('stitch'); ctx.emote([X3 + TX - 1 + Math.random() * 2, TH, TZ], n % 2 ? '🌸' : '🧵', { y: 0.4 }); }
        await foc; anna.userData.anim = 'idle'; done();
        ctx.thank('🌸', ['Anna', 'Her skilled hands', 'Her patience']);
        await ctx.wait(3.4);
      };

      // ---------------- 4. the trunk and the Atlantic ----------------
      const ch4 = async () => {
        ctx.bounds(null);
        await ctx.chapter({ n: 4, title: 'Across the Atlantic', emoji: '⛵', env: ['indoor', { ground: 0x6f563c, top: '#2a211a', bottom: '#4a3a2c', fog: false, amb: 1.5, sunI: 1.5 }], at: [X3 - 2.5, 0.6], face: Math.PI * 0.8, cam: { yaw: 0, pitch: 0.55, dist: 9 }, music: 'travel', setup: () => {
          showZone(2); cloth.set(cloth.max); show(cloth3); cloth3.scale.set(1, 1, 1); hide(flame3); hide(moon); pane3.material = glow(0x9fd6f2);
          anna.userData.sitting = false; anna.userData.anim = 'idle'; anna.position.set(X3 + 4.2, 0, -2.6); anna.rotation.y = -0.9;
        } });
        ctx.bounds(X3 - 6.4, -8.2, X3 + 6.4, 2.4);
        sayQ(anna, 'To Utah — among the Latter-day Saints! ⛵'); fact('🧳', 'Emigrants took only what they could carry — heavy furniture stayed behind.');
        ctx.goal('🧺', 'Fold the tablecloth', [X3 + TX, TZ]);
        await use({ at: [X3 + TX, TZ + 1.5], face: [X3 + TX, TZ], icon: '🧺', label: 'Fold', hold: 0.8, r: 2.4, y: 1.7, sfx: 'whoosh' });
        await ctx.tween(cloth3.scale, { x: 0.2, z: 0.25 }, 0.45, 'in'); hide(cloth3); const folded = foldedCloth(true); hold(folded, 0.06, 0.1); done();
        ctx.tween(lid3.rotation, { x: 1.9 }, 0.6, 'outBack'); ctx.audio.play('knock');
        sayQ(anna, 'My tablecloth is coming along! 💛');
        ctx.goal('🧳', 'Pack the trunk', [X3 + KX, KZ]);
        await use({ at: [X3 + KX - 1.3, KZ], face: [X3 + KX, KZ], icon: '🧳', label: 'Pack', r: 2.2, y: 1.5, sfx: 'drop' });
        ctx.drop(); ctx.add(folded, X3 + KX - 1.0, KZ); folded.position.y = 1.3; folded.rotation.y = Math.PI / 2; ctx.lock();
        ctx.tween(folded.position, { x: X3 + KX }, 0.4); await ctx.tween(folded.position, { y: 0.62 }, 0.4, 'in'); await ctx.tween(lid3.rotation, { x: 0 }, 0.4, 'in'); ctx.audio.play('thud'); ctx.remove(folded); ctx.unlock(); done();
        await ctx.wait(1.6);
        // ---- the ship ----
        ctx.bounds(null);
        await ctx.chapter({ env: ['sea', { ground: false, fog: [60, 190] }], at: [X4 + 2.6, 10.1], face: Math.PI, cam: { yaw: 0, pitch: 0.5, dist: 10 }, setup: () => { showZone(3); } });
        ctx.bounds(X4 - 3.9, -14.2, X4 + 3.9, 10.7);
        sayQ(helmsman, 'A long voyage ahead! ⛵');
        ctx.goal('🧳', "Find Anna's trunk", trunk4);
        await new Promise(res => ctx.zone({ x: X4 + 2.2, z: 6.0, r: 2.2, onEnter: res }));
        sayQ(anna4, 'Our trunk is safe here 💛', 2); await ctx.wait(1.6);
        // storm!
        ctx.banner('⛈️', 'Storm!', 2); ctx.audio.play('wind'); ctx.env('overcast', { ground: false, top: '#2f3946', bottom: '#7f8c99', fog: [30, 120], amb: 1.0, sunI: 0.9 }); sea.material.color.set(0x2a5a7a); show(rain);
        ctx.tween({ get v() { return storm; }, set v(x) { storm = x; rollAmp = 0.02 + x * 0.075; } }, { v: 1 }, 1.5);
        const thunder = ctx.every(3.4, () => { ctx.hemi.intensity = 3.2; ctx.after(0.12, () => { ctx.hemi.intensity = 1.0; }); ctx.audio.noise(1.2, { freq: 160, to: 50, q: 0.6, vol: 0.5 }); ctx.cam.shake = 0.25; });
        const windy = ctx.every(1.3, () => ctx.audio.play(Math.random() < 0.5 ? 'wind' : 'wave'));
        helmsman.userData.lookAt = null; sayQ(helmsman, 'Tie everything down! 🌊');
        let tied = 0; for (const c of cargo) { c.userData.ph = Math.asin(Math.max(-1, Math.min(1, (c.position.x - X4) / 2.7))) - ctx.time * 1.15; c.userData.loose = true; } // start sliding from where each thing stands
        const nearest = () => cargo.filter(c => c.userData.loose).sort((a, b) => a.position.distanceTo(ctx.player.position) - b.position.distanceTo(ctx.player.position))[0];
        ctx.goal('🌊', 'Tie down 3 things', nearest());
        for (const c of cargo) ctx.interact({ at: c, icon: '✊', label: 'Tie down', hold: 0.45, r: 2.6, y: 1.7, sfx: 'knock', onUse: () => {
          c.userData.loose = false; tied++; if (tied === 1) fact('⛈️', 'Storms made the long crossing frightening, and seasickness was common.'); const rope = torus(0.62, 0.05, 0xd9c27a, [c.position.x, 0.45, c.position.z], [Math.PI / 2, 0, 0], 10); D(3, ctx.add(rope)); ctx.burst(c.position, { color: 0xd9c27a, n: 8 }); ctx.emote(c, '💪');
          if (tied < 3) ctx.goal('🌊', 'Tie down ' + (3 - tied) + ' more', nearest());
        } });
        const regoal = ctx.every(0.5, () => { if (tied < 3 && ctx._goal) ctx._goal.target = nearest(); });
        await ctx.until(() => tied >= 3); regoal(); done();
        ctx.goal('☀️', 'The storm passes…');
        await ctx.wait(1.2); thunder(); windy();
        await ctx.tween({ get v() { return storm; }, set v(x) { storm = x; rollAmp = 0.02 + x * 0.075; } }, { v: 0 }, 2.2);
        hide(rain); ctx.env('sea', { ground: false, fog: [60, 190] }); sea.material.color.set(0x2f7fc0); show(land); ctx.audio.play('bird');
        ctx.act('point', 2.5, lookout); sayQ(lookout, 'Land ho! America! 🌊', 2.6); ctx.act('cheer', 2.4, anna4);
        await ctx.focus([X4, 2, -45], 3, { dist: 30, pitch: 0.16, yaw: 0.12 }); done();
        ctx.thank('⛵', ['Sailors', 'Fellow emigrants', "Anna's brave family"]);
        await ctx.wait(3.4);
      };

      // ---------------- 5. across the plains ----------------
      const ch5 = async () => {
        ctx.bounds(null); ctx.camera.up.set(0, 1, 0);
        await ctx.chapter({ n: 5, title: 'Across the Plains', emoji: '🐂', env: ['day', { ground: 0xb9b56c, fog: [55, 170] }], at: [X5 - 2, 2.5], face: Math.PI / 2, cam: { yaw: 0, pitch: 0.36, dist: 12 }, music: 'travel', setup: () => { showZone(4); ctx.camera.up.set(0, 1, 0); } });
        ctx.bounds(X5 - 14, -0.6, CAMPX + 9, 9);
        // mini-game: the teamster steers the oxen by voice — "gee" turns them right, "haw" left — and asks the player to call the turns
        sayQ(teamster, 'Help me turn the oxen! 🐂');
        ctx.goal('🐂', 'Help the teamster', teamster);
        await use({ at: teamster, icon: '🐂', label: 'Drive', r: 2.8, y: 2.2 });
        ctx.goal('🐂', 'Gee or haw?'); teamster.userData.anim = 'point';
        await geeHawGame(ctx);
        teamster.userData.anim = 'idle'; ctx.act('cheer', 1.4, teamster); done();
        fact('🐂', 'Teamsters walked beside the oxen, calling "gee" and "haw".');
        sayQ(teamster, 'Wagons, ho! We walk! 🐂'); trainGo = true;
        const moo = ctx.every(5.5, () => { if (trainV > 1) ctx.audio.play('moo'); });
        let got = 0; const nextWood = () => woods.filter(w => w.parent).sort((a, b) => a.position.x - b.position.x)[0];
        ctx.goal('🔥', 'Gather firewood', nextWood());
        ctx.after(9, () => { if (got < 6) sayQ(anna5, 'So much walking! 👣', 2.6); });
        await ctx.collect({ items: woods, r: 1.3, spin: false, onEach: () => { got++; if (got === 3) fact('🔥', 'Pioneer families gathered fuel every day to cook over open fires.'); const n = nextWood(); ctx.goal('🔥', got < 5 ? (6 - got) + ' more sticks' : got < 6 ? '1 more stick' : 'Follow the wagon', n || train); } });
        done();
        ctx.goal('🏕️', 'Walk to camp', [FPX - 2.2, FPZ + 0.4]);
        await ctx.until(() => train.position.x >= CAMPX - 9.2 && ctx.player.position.x > CAMPX - 8);
        moo(); trainGo = false; for (const p of [teamster, anna5, child5]) p.userData.anim = 'idle';
        sayQ(guide, 'We camp here tonight! 🏕️');
        ctx.goal('🔥', 'Stack the firewood', [FPX, FPZ]);
        await use({ at: [FPX - 1.5, FPZ + 0.5], face: [FPX, FPZ], icon: '🔥', label: 'Stack', r: 2.4, y: 1.3, sfx: 'drop' });
        show(stack5); ctx.burst([FPX, 0.3, FPZ], { color: 0x7a5536, n: 8 }); done();
        // evening
        await ctx.chapter({ title: 'Evening camp', emoji: '🌙', env: ['sunset', { ground: 0x8a8752, fog: [45, 150], top: '#2a2f66', bottom: '#f0925a', amb: 0.95 }], setup: () => {
          const seat = (p, x, z, ry) => { ctx.scene.add(p); p.position.set(FPX + x, 0, z + FPZ); p.rotation.y = ry; p.userData.sitting = true; p.userData.anim = 'idle'; };
          seat(anna5, -2.3, 0.2, Math.PI / 2); seat(child5, 0.25, -2.2, 0); teamster.visible = false; show(teamsterSit); seatY(anna5, 0.51); seatY(child5, 0.51); // (the teamster resting by the fire is a still figure: fewer things to draw in the busiest view)
          ctx.tp(FPX - 1.2, FPZ + 2.6, Math.PI * 0.9);
        } });
        ctx.goal('🔥', 'Light the campfire', [FPX, FPZ]);
        await use({ at: [FPX - 0.3, FPZ + 1.5], face: [FPX, FPZ], icon: '🔥', label: 'Light', hold: 1.0, r: 2.4, y: 1.4, sfx: 'fire' });
        show(fire5); ctx.burst([FPX, 0.6, FPZ], { color: 0xffb43a, n: 18, speed: 2, size: 0.14 });
        const crackle = ctx.every(0.5, () => { ctx.audio.play('fire'); ctx.burst([FPX, 1.1, FPZ], { color: 0xffc04a, n: 2, speed: 0.8, size: 0.1 }); });
        child5.userData.anim = 'cheer'; ctx.after(1.6, () => { child5.userData.anim = 'idle'; }); done(); ctx.goal('🔥', 'Rest by the fire');
        [392, 440, 494, 440, 392, 330, 392].forEach((f, i) => ctx.after(0.6 + i * 0.32, () => ctx.audio.tone(f, 0.3, { type: 'triangle', vol: 0.25 })));
        fact('🐂', 'Every pound mattered — yet the tablecloth came along.');
        await sayQ(anna5, 'My tablecloth is still safe 💛', 2.6);
        ctx.thank('🐂', ['Wagon builders', 'Teamsters', 'Trail guides', 'Fellow pioneers']);
        ctx.act('point', 2.4, guide); await sayQ(guide, 'Tomorrow: the Salt Lake Valley! 🏔️', 2.8);
        await ctx.wait(2.6); crackle();
      };

      // ---------------- 6. a Utah home, through the generations ----------------
      const ch6 = async () => {
        ctx.bounds(null);
        const homeEnv = ['indoor', { ground: 0x5a4030, top: '#241a14', bottom: '#3a2a20', fog: false }];
        await ctx.chapter({ n: 6, title: 'A Home in Utah', emoji: '🏡', env: homeEnv, at: [X6 + 3.6, 1.2], face: Math.PI * 1.1, cam: { yaw: 0, pitch: 0.55, dist: 9.5 }, music: 'calm', setup: () => { showZone(5); cloth.set(cloth.max); setEra('a'); ctx.camera.up.set(0, 1, 0); } });
        ctx.bounds(X6 - 7.2, -7.9, X6 + 7.2, 2.8);
        const [annaOld, daughter, boy] = folk.a;
        const whoosh = async (k, icon, extra) => { ctx.lock(); ctx.goal(icon, YEAR[k]); ctx.audio.play('whoosh'); await ctx.tween(ctx.hemi, { intensity: 5 }, 0.35, 'in'); setEra(k); if (extra) extra(); ctx.banner(icon, YEAR[k], 1.8); ctx.audio.play('sparkle'); await ctx.tween(ctx.hemi, { intensity: 1.5 }, 0.5, 'out'); ctx.unlock(); };
        // 1860s — a place of honour
        sayQ(annaOld, 'Home at last! 🏡');
        ctx.goal('🧳', 'Open the trunk', [X6 + 5.8, -0.3]);
        await use({ at: [X6 + 4.6, 0.2], face: [X6 + 5.8, -0.3], icon: '🧳', label: 'Open', r: 2.2, y: 1.5, sfx: 'knock' });
        ctx.burst([X6 + 5.8, 0.9, -0.3], { color: 0xffffff, n: 8 }); hold(foldedCloth(true), 0.06, 0.1);
        sayQ(annaOld, 'For our special days 💛');
        ctx.goal('✨', 'Lay the tablecloth', [X6 + HTX, HTZ]);
        await use({ at: [X6 + HTX, HTZ + 1.5], face: [X6 + HTX, HTZ], icon: '✨', label: 'Shake & lay', hold: 0.9, r: 2.4, y: 1.7, sfx: 'whoosh' });
        ctx.remove(ctx.drop()); show(cloth6); cloth6.scale.set(0.15, 1, 0.15); cloth6.position.y = HT + 0.9; ctx.tween(cloth6.position, { y: HT + 0.05 }, 0.6, 'outBounce'); await ctx.tween(cloth6.scale, { x: 1, z: 1 }, 0.5, 'outBack');
        ctx.act('cheer', 1.6, boy); ctx.act('clap', 1.6, daughter); ctx.emote(boy, '⭐'); done();
        await sayQ(annaOld, 'One day it will be yours 💛', 2.4);
        ctx.goal('💛', 'Pass it on', daughter);
        await use({ at: daughter, icon: '💛', label: 'Pass it on', r: 2.6 });
        ctx.emote(daughter, '💛'); await whoosh('b', '💒'); done();
        // early 1900s — a wedding breakfast
        const [bride, groom, mother] = folk.b;
        sayQ(bride, 'Our wedding breakfast! 💒');
        const cake = group([cyl(0.36, 0.36, 0.22, 0xfafafa, [0, 0.11, 0], null, 12), cyl(0.26, 0.26, 0.2, 0xfff0f4, [0, 0.32, 0], null, 12), cyl(0.16, 0.16, 0.18, 0xfafafa, [0, 0.51, 0], null, 12), sphere(0.07, C.pink, [0, 0.64, 0], 6)].concat(Array.from({ length: 6 }, (_, i) => sphere(0.045, C.pink, [Math.cos(i) * 0.36, 0.22, Math.sin(i) * 0.36], 5)))); bake(cake); D(5, ctx.add(cake, X6 + SBX - 0.05, SBZ - 0.6)); cake.position.y = 1.08;
        ctx.goal('🎂', 'Bring the cake', cake);
        await use({ at: [X6 + SBX - 1.3, SBZ - 0.6], face: [X6 + SBX, SBZ - 0.6], icon: '🎂', label: 'Carry', r: 2.2, y: 1.6 }); hold(cake, 0.04, 0.2); // the wide cake is held out in front, its bottom tier clear of the chest
        ctx.goal('🎂', 'Set it down', [X6 + HTX, HTZ]);
        await use({ at: [X6 + HTX, HTZ + 1.5], face: [X6 + HTX, HTZ], icon: '🎂', label: 'Put down', r: 2.4, y: 1.7, sfx: 'drop' });
        ctx.drop(); ctx.add(cake, X6 + HTX, HTZ); cake.position.y = HT + 0.07; ctx.act('clap', 1.8, bride); ctx.act('clap', 1.8, groom); ctx.audio.play('bell'); ctx.burst([X6 + HTX, 2.2, HTZ], { color: 0xffc0d8, n: 20, speed: 3 }); done();
        await ctx.wait(1.8); await whoosh('c', '🍲'); ctx.remove(cake);
        // 1930s — hard times
        const [mum30] = folk.c;
        fact('🍲', 'In the Great Depression, the cloth showed beauty needs no money.');
        await sayQ(mum30, 'Money is short this year 🍲', 2.6);
        ctx.goal('💛', 'Pass it on', mum30);
        await use({ at: mum30, icon: '💛', label: 'Pass it on', r: 2.6 });
        ctx.emote(mum30, '💛'); await whoosh('d', '⭐'); done();
        // 1940s — an empty chair
        const [mum40] = folk.d;
        sayQ(mum40, 'He is serving far away ⭐');
        const plate = group([cyl(0.2, 0.13, 0.035, 0xfafafa, [0, 0.02, 0], null, 10), cyl(0.12, 0.12, 0.01, 0xe8eef2, [0, 0.04, 0], null, 10)]); bake(plate); hold(plate, 0.1, 0.02);
        ctx.goal('⭐', 'Set his place', [X6 + 1.35, HTZ]);
        await use({ at: [X6 + 2.0, HTZ + 1.4], face: [X6 + 1.35, HTZ], icon: '⭐', label: 'Set his place', r: 2.4, y: 1.7, sfx: 'clink' });
        ctx.drop(); D(5, ctx.add(plate, X6 + 1.35, HTZ)); plate.position.y = HT + 0.07; ctx.emote([X6 + 2.3, 1, HTZ], '⭐', { y: 1 }); ctx.emote(mum40, '💛'); done();
        await sayQ(mum40, 'We keep his chair ready 💛', 2.6);
        await whoosh('e', '📺', () => { hide(cloth6); }); ctx.remove(plate);
        // 1960s — machine-made cloths are cheap… but the family keeps Anna's. Both lie on the table: which one stays?
        const [mum60, teen] = folk.e;
        const marker = (x) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.5, 18), mat(0xffd84a, { opacity: 0.6 })); m.rotation.x = -Math.PI / 2; m.position.set(X6 + x, HT + 0.05, HTZ + 0.35); return D(5, ctx.add(m)); };
        const pack = group([box(0.7, 0.1, 0.5, 0xd9622b, [0, 0.05, 0]), box(0.72, 0.02, 0.12, 0xfafafa, [0, 0.11, 0]), box(0.2, 0.025, 0.2, 0xf2c43d, [0.2, 0.115, 0.12])]); bake(pack); D(5, ctx.add(pack, X6 + 0.85, HTZ + 0.35)); pack.position.y = HT + 0.07;
        const annas = foldedCloth(true); D(5, ctx.add(annas, X6 - 0.85, HTZ + 0.35)); annas.position.y = HT + 0.07;
        const mk1 = marker(-0.85), mk2 = marker(0.85);
        fact('🛍️', 'By the 1960s, machine-made tablecloths were cheap and easy to find.');
        sayQ(teen, 'Why keep that old one? 🛍️');
        ctx.goal('💛', 'Which one stays?', [X6 + HTX, HTZ + 1.3]);
        let kept = false;
        const askNew = () => ctx.interact({ at: [X6 + 0.85, HTZ + 1.35], face: [X6 + 0.85, HTZ + 0.35], icon: '🛍️', label: 'The new one', r: 0.85, y: 1.7, sfx: 'error', onUse: async () => { ctx.emote(mum60, '🤔'); await sayQ(mum60, "Anna's holds our story 💛", 2.4); if (!kept) newIt = askNew(); } });
        let newIt = askNew();
        await use({ at: [X6 - 0.85, HTZ + 1.35], face: [X6 - 0.85, HTZ + 0.35], icon: '💛', label: "Anna's", r: 0.85, y: (window.innerWidth < 560 || window.innerHeight < 480) ? 2.5 : 1.7 /* on a phone the two choices are close together on the screen: this one's bubble floats higher, so the other's cannot cover it */, sfx: 'success' });
        kept = true; newIt.remove(); ctx.remove(mk1); ctx.remove(mk2); ctx.remove(pack); ctx.remove(annas); ctx.act('clap', 1.6, mum60); ctx.act('cheer', 1.6, teen); ctx.burst([X6 + HTX, 1.4, HTZ], { color: 0xffd84a, n: 18 });
        show(cloth6); cloth6.scale.set(0.15, 1, 0.15); await ctx.tween(cloth6.scale, { x: 1, z: 1 }, 0.5, 'outBack'); done();
        ctx.thank('💛', ["Anna's daughter", 'Her granddaughter', 'Every generation since']);
        await ctx.wait(3.4); await whoosh('f', '📦');
        // today — the quiet work of preservation (two beats: wrap & box it, then store it in the dark)
        const [grandma] = folk.f;
        sayQ(grandma, 'Old linen needs gentle care 📦');
        ctx.goal('📦', 'Wrap in soft tissue', [X6 + HTX, HTZ]);
        await use({ at: [X6 + HTX, HTZ + 1.5], face: [X6 + HTX, HTZ], icon: '📦', label: 'Wrap', hold: 1.2, r: 2.4, y: 1.7, sfx: 'whoosh' });
        ctx.lock(); const tissue = group([box(0.9, 0.03, 0.7, 0xffffff, [0, 0.015, 0])]); bake(tissue); D(5, ctx.add(tissue, X6 + HTX, HTZ)); tissue.position.y = HT + 1.0; ctx.tween(tissue.position, { y: HT + 0.1 }, 0.4, 'in');
        await ctx.tween(cloth6.scale, { x: 0.2, z: 0.25 }, 0.45, 'in'); hide(cloth6); ctx.remove(tissue);
        const abox = group([box(0.8, 0.22, 0.6, 0xb8c2cc, [0, 0.11, 0]), box(0.84, 0.08, 0.64, 0x8a9aa8, [0, 0.25, 0]), box(0.3, 0.1, 0.01, 0xfafafa, [0, 0.12, 0.305])]); bake(abox); D(5, ctx.add(abox, X6 + HTX, HTZ)); abox.position.y = HT + 0.06; abox.scale.setScalar(0.01); await ctx.tween(abox.scale, { x: 1, y: 1, z: 1 }, 0.45, 'outBack'); done();
        fact('📦', 'Acid-free tissue and an archival box protect old linen.');
        await ctx.wait(0.5); ctx.unlock(); hold(abox, 0, 0.16);
        sayQ(grandma, 'Away from sun and damp! 🌞');
        ctx.goal('🚪', 'Store in the dark', [X6 + CBX, CBZ]);
        await use({ at: [X6 + CBX + 1.3, CBZ], face: [X6 + CBX, CBZ], icon: '🚪', label: 'Store', r: 2.3, y: 1.7, sfx: 'drop' });
        ctx.drop(); D(5, ctx.add(abox, X6 + CBX + 0.25, CBZ)); abox.position.y = 1.44; abox.rotation.y = Math.PI / 2; ctx.burst(abox.position, { color: 0xffffff, n: 8 }); done();
        ctx.thank('📦', ['Family caretakers', 'Family storytellers', 'The next generation']);
        ctx.goal('📦', 'Safe and sound');
        await ctx.wait(3.4);
        // Thanksgiving Day, 2026
        ctx.bounds(null);
        await ctx.chapter({ title: 'Thanksgiving Day, 2026', emoji: '🦃', env: homeEnv, at: [X6 + 3.2, 1.0], face: Math.PI * 1.2, music: 'table', setup: () => { setEra('g'); grandma.position.set(X6 - 2.9, 0, -1.2); grandma.rotation.y = 1.0; } });
        ctx.bounds(X6 - 7.2, -7.9, X6 + 7.2, 2.8);
        sayQ(grandma, 'Time for the special cloth! 🦃');
        ctx.goal('📦', 'Get the tablecloth', abox);
        await use({ at: [X6 + CBX + 1.3, CBZ], face: [X6 + CBX, CBZ], icon: '📦', label: 'Open', r: 2.3, y: 1.7 });
        ctx.remove(abox); hold(foldedCloth(true), 0.06, 0.1); ctx.burst(ctx.player.position, { color: 0xffffff, n: 10, y: 1.2 }); done();
        ctx.goal('✨', 'Lay the tablecloth', [X6 + HTX, HTZ]);
        await use({ at: [X6 + HTX, HTZ + 1.5], face: [X6 + HTX, HTZ], icon: '✨', label: 'Shake & lay', hold: 0.9, r: 2.4, y: 1.7, sfx: 'whoosh' });
        ctx.lock(); ctx.goal('🦃', 'Thanksgiving 2026');
        ctx.remove(ctx.drop()); show(cloth6); cloth6.scale.set(0.15, 1, 0.15); cloth6.position.y = HT + 0.9; ctx.tween(cloth6.position, { y: HT + 0.05 }, 0.6, 'outBounce'); await ctx.tween(cloth6.scale, { x: 1, z: 1 }, 0.5, 'outBack');
        for (const d of feast) { show(d); d.scale.setScalar(0.01); ctx.tween(d.scale, { x: 1, y: 1, z: 1 }, 0.35, 'outBack'); ctx.audio.play('pop'); await ctx.wait(0.22); }
        ctx.audio.play('success'); for (const p of family26.slice(0, 2)) ctx.act('cheer', 1.8, p); ctx.act('clap', 1.8, grandma); ctx.burst([X6 + HTX, 2.2, HTZ], { color: 0xffd84a, n: 22, speed: 3 }); done();
        await ctx.wait(1.9); family26[0].userData.anim = family26[1].userData.anim = 'laugh';
        await sayQ(ctx.player, 'Where did this come from? 🤔', 2.4);
        grandma.userData.lookAt = ctx.player.position.clone().setY(1.2); await sayQ(grandma, 'Anna made it. Thousands helped. 💛', 3); ctx.unlock();
        ctx.progress(DOTS, DOTS);
      };

      const chapters = [ch1, ch2, ch3, ch4, ch5, ch6];
      for (let i = Math.max(0, skip - 1); i < chapters.length; i++) await chapters[i]();
      ctx.finish();
    });
  },
};
