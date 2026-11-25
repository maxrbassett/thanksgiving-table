// Cranberry Sauce — sandy bog → blossoms & bees → frost night & winter sanding → the red floating harvest
// → bounce test → market → kitchen. Source: the family's "Cranberry Journey" document (10 stages).
import { THREE, C, box, cyl, sphere, ball, cone, group, mat, glow, sign, label, emojiSprite, picture, seeded, plane, disc, lathe, torus, bake, damp, clamp, grain } from '../core/kit.js';
import * as P from '../core/props.js';
import { frostGame, simmerGame } from './cranberry-games.js';
import { RED, RED2, RED3, BERRY_REDS, carpetTex, berryCarpetTex, berryPatchTex, swarm, berryGeo, roundBerryGeo, berryMat, bee, blossom, sprig, waterReel, sandBuggy, pickerCart, helicopter, drawCutBerry, product, jelly, bounceGame, M, rc, rs, dome, wheel } from './cranberry-parts.js';

export default {
  id: 'cranberry', title: 'Cranberry Sauce', emoji: '🥫', music: 'farm',
  question: 'How do cranberries become sauce?',
  thanksLine: 'From a sandy bog to a ruby-red spoonful — look who helped!',

  create(ctx) {
    const rnd = seeded(19);
    // a big flat surface with the soft natural grain (one draw each — only for the largest floors)
    const gplane = (w, d, color, pos, rep = 6) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color, map: grain(rep) })); m.rotation.x = -Math.PI / 2; m.position.set(pos[0], pos[1], pos[2]); m.receiveShadow = true; return m; };
    const use = (at, icon, lbl, o = {}) => new Promise(res => ctx.interact(Object.assign({ at, icon, label: lbl, onUse: res }, o)));

    // ============ ZONE 1 — the bog (one bed, seen through the seasons). Camera looks toward -Z. ============
    ctx.env('day');
    // each zone's own things (scenery and movers) are gathered in one holder, so a whole zone is switched off while the player is in another one
    let inScene = new Set(ctx.scene.children);
    const zoneOf = () => { const h = new THREE.Group(); for (const o of ctx.scene.children.slice()) if (!inScene.has(o)) h.add(o); ctx.scene.add(h); inScene = new Set(ctx.scene.children); return h; };
    const BX = 9, BZ1 = -15, BZ2 = -3, BZC = -9;          // bed interior: x -9..9, z -15..-3
    const z1 = new THREE.Group();
    z1.add(gplane(18.6, 12.6, 0xdcc48e, [0, 0.025, BZC], 5));   // the sandy growing layer
    for (let i = 0; i < 9; i++) z1.add(box(17.4, 0.02, 0.07, 0xcbb079, [0, 0.035, -3.8 - i * 1.3]));
    const berm = (cx, cz, len, alongX) => { z1.add(box(alongX ? len : 1.5, 0.28, alongX ? 1.5 : len, 0x8c7a50, [cx, 0.14, cz])); z1.add(box(alongX ? len - 0.3 : 0.9, 0.45, alongX ? 0.9 : len - 0.3, 0x6fae4e, [cx, 0.225, cz])); };
    berm(0, BZ2 + 0.7, 20.8, true); berm(0, BZ1 - 0.7, 20.8, true); berm(-BX - 0.7, BZC, 13.4, false); berm(BX + 0.7, BZC, 13.4, false);
    // reservoir pond + flume on the west
    z1.add(plane(15, 11, 0xcdb98a, [-19, 0.02, BZC])); z1.add(box(2.6, 0.36, 1.3, C.wood, [-11.3, 0.18, BZC])); z1.add(box(2.6, 0.1, 0.9, 0x4aa3df, [-11.3, 0.34, BZC]));
    for (const sz of [-1, 1]) z1.add(box(0.22, 1.9, 0.22, C.woodDark, [-9.7, 0.95, BZC + sz * 0.75])); z1.add(box(0.3, 0.22, 1.9, C.woodDark, [-9.7, 1.9, BZC]));
    for (let i = 0; i < 14; i++) { const a = i * 0.47, x = -19 + Math.cos(a) * (6.6 + (i % 3) * 0.5), z = BZC + Math.sin(a) * (4.8 + (i % 2) * 0.5); if (x > -13.2) continue; if (i % 3 === 0) { const r = P.rock({ s: 0.8 + (i % 4) * 0.2, ry: i }); r.position.set(x, 0, z); z1.add(r); } else for (let k = 0; k < 3; k++) z1.add(cone(0.07, 1.1 + k * 0.25, 0x5e9e44, [x + k * 0.18, 0.55 + k * 0.12, z + (k % 2) * 0.15], null, 4)); }
    // sprinkler line + risers
    z1.add(cyl(0.06, 0.06, 12, C.steel, [0, 0.1, -1.0], [0, 0, Math.PI / 2], 6));
    const SPR = [-5.5, 0, 5.5];
    for (const x of SPR) { z1.add(cyl(0.045, 0.045, 1.0, C.steel, [x, 0.5, BZC], null, 5)); z1.add(sphere(0.1, 0xe8b63a, [x, 1.02, BZC], 6)); z1.add(cyl(0.1, 0.1, 0.5, C.steel, [x, 0.25, -1.0], null, 6)); }
    // pump, berry elevator and farm track on the east
    z1.add(plane(3.8, 70, C.dirt, [14.2, 0.03, -12]));
    const elev = group([box(4.6, 0.14, 1.1, 0x3b3b3b), box(4.6, 0.3, 0.08, 0xe98a2b, [0, 0.12, 0.55]), box(4.6, 0.3, 0.08, 0xe98a2b, [0, 0.12, -0.55])], [11.0, 1.55, -8.3], [0, 0, 0.62]); z1.add(elev);
    for (const [x, h] of [[10.6, 1.2], [12.4, 2.5]]) for (const sz of [-1, 1]) z1.add(box(0.12, h, 0.12, C.steel, [x, h / 2, -8.3 + sz * 0.5]));
    z1.add(box(1.2, 0.16, 1.1, 0x4a4f55, [10.9, 0.38, -6.6])); z1.add(box(0.9, 0.62, 0.8, 0x3f6f8f, [11.0, 0.77, -6.6])); z1.add(rc(0.33, 0.33, 0.7, 0x3f6f8f, [10.75, 0.8, -6.6], [0, 0, Math.PI / 2], 12)); z1.add(rc(0.36, 0.36, 0.08, 0x2f5670, [10.38, 0.8, -6.6], [0, 0, Math.PI / 2], 12));
    z1.add(rc(0.12, 0.12, 1.1, 0x444a52, [9.85, 0.62, -6.6], [0, 0, Math.PI / 2], 8)); z1.add(rc(0.15, 0.15, 0.1, 0x33373c, [9.32, 0.62, -6.6], [0, 0, Math.PI / 2], 8)); z1.add(rc(0.1, 0.1, 1.6, 0x444a52, [10.75, 1.0, -7.5], [Math.PI / 2 - 0.5, 0, 0], 8));
    z1.add(box(0.3, 0.4, 0.24, 0x8a949e, [11.2, 1.28, -6.35])); z1.add(sphere(0.05, 0x3fa34d, [11.2, 1.4, -6.22], 5)); z1.add(sphere(0.05, C.red, [11.2, 1.27, -6.22], 5));
    // farm buildings, hives, background
    const barn = P.barn({ sign: 'CRANBERRY FARM', signH: 0.95 }); barn.position.set(23.5, 0, -22); barn.rotation.y = -0.35; z1.add(barn);
    const silo = P.silo(); silo.position.set(30, 0, -18); z1.add(silo);
    for (const [x, z, c] of [[6.4, 1.3, 0xfafafa], [7.5, 1.7, 0xf2c43d], [8.5, 1.2, 0x9fd6f2]]) { z1.add(box(0.8, 0.5, 0.7, c, [x, 0.37, z])); z1.add(box(0.8, 0.45, 0.7, 0xfafafa, [x, 0.86, z])); z1.add(box(0.95, 0.1, 0.85, 0x8a949e, [x, 1.14, z])); z1.add(box(0.7, 0.12, 0.6, C.woodDark, [x, 0.06, z])); z1.add(box(0.3, 0.06, 0.04, 0x222222, [x, 0.2, z + 0.36])); }
    const keepOut = (x, z) => !(Math.abs(x) < 12.5 && z > -18.5 && z < 8) && !(x < -11 && x > -27.5 && z > -15.5 && z < -2.5) && !(x > 11.5 && x < 17) && !(x > 17 && x < 33 && z > -28 && z < -12) && z < 7;
    z1.add(P.scatter(22, 90, 60, (r) => P.tree({ h: 4 + r() * 3, kind: 'pine' }), { seed: 4, keep: (x, z) => keepOut(x, z) && (Math.abs(x) > 16 || z < -22) }).translateZ(-8));
    z1.add(P.scatter(12, 56, 34, (r) => P.bush({ s: 0.8 + r() * 0.6 }), { seed: 6, keep: keepOut }).translateZ(-6));
    for (let i = 0; i < 5; i++) { const m = P.mountain({ h: 13 + (i % 2) * 5, color: i % 2 ? 0x6f9a6a : 0x7fa878, snow: false }); m.scale.set(2.6, 1, 1); m.position.set(-90 + i * 45, 0, -100 - (i % 2) * 12); z1.add(m); }
    for (let i = 0; i < 4; i++) { const c = P.cloud({ s: 2.2 + (i % 2) }); c.position.set(-40 + i * 27, 20 + (i % 2) * 4, -60 - (i % 3) * 8); z1.add(c); }
    z1.add(plane(3.2, 9, 0xb98a5e, [0, 0.03, 3.2])); for (let i = 0; i < 7; i++) z1.add(plane(0.9 + (i % 3) * 0.3, 0.5, 0xa87a4e, [(i % 2 ? 0.7 : -0.7), 0.035, 6.6 - i * 1.2]));
    const wb = group([box(1.0, 0.4, 0.7, 0x5d7a63, [0, 0.55, 0]), box(1.06, 0.05, 0.76, 0x4c6652, [0, 0.76, 0]), dome(0.45, 0.2, 0.3, 0xdcc48e, [0, 0.78, 0], 0, 8), rc(0.22, 0.22, 0.1, 0x25262a, [0.6, 0.22, 0], [Math.PI / 2, 0, 0], 12), rc(0.09, 0.09, 0.12, 0x8a949e, [0.6, 0.22, 0], [Math.PI / 2, 0, 0], 8), box(0.9, 0.05, 0.05, C.woodDark, [-0.8, 0.62, 0.3]), box(0.9, 0.05, 0.05, C.woodDark, [-0.8, 0.62, -0.3]), box(0.06, 0.45, 0.06, 0x555555, [-0.35, 0.2, 0.25]), box(0.06, 0.45, 0.06, 0x555555, [-0.35, 0.2, -0.25])], [-7.6, 0, 3.4], [0, 0.5, 0]); z1.add(wb);
    for (const [x, z, s] of [[-9.5, 5.2, 1.3], [-11, 3.6, 1], [10.5, 5.4, 1.2], [4.2, 5.6, 0.9], [-3.8, 5.9, 0.8]]) { const b = P.bush({ s }); b.position.set(x, 0, z); z1.add(b); }
    const flowersG = P.scatter(30, 24, 6, (r) => P.flower({ color: [0xffffff, 0xf2c43d, 0xe88fb0][Math.floor(r() * 3)] }), { seed: 21, keep: (x) => Math.abs(x) > 2.2 }); flowersG.position.z = 4.6;
    const f1 = P.fence(10); f1.position.set(-17.5, 0, 1.5); z1.add(f1); const f2 = P.fence(8); f2.position.set(19.5, 0, 1.5); z1.add(f2);
    ctx.addStatic(z1); ctx.addStatic(flowersG);
    // leafy trees come in two coats: summer green and autumn
    const leafy = (kind) => { const g = P.scatter(12, 80, 46, (r) => { const h = 4 + r() * 2.5; r(); return P.tree({ h, kind, color: kind === 'autumn' ? C.autumn[Math.floor(r() * 4)] : (r() < 0.5 ? C.leaf : 0x6fb85a) }); }, { seed: 12, keep: (x, z) => keepOut(x, z) && (Math.abs(x) > 15 || z < -20) }); g.position.z = -8; return ctx.addStatic(g); };
    const treesGreen = leafy('round'), treesAutumn = leafy('autumn'); treesAutumn.visible = false;
    const pond = P.water(12.4, 9, { y: 0.06 }); pond.position.x = -19; pond.position.z = BZC; ctx.add(pond);
    const diagram = picture(2.3, 2.3, drawCutBerry, 256, [11.6, 1.95, -0.4]); diagram.rotation.y = -0.25; ctx.add(diagram);
    ctx.addStatic(group([cyl(0.08, 0.08, 1.0, C.woodDark, [-0.8, 0.5, -0.06], null, 5), cyl(0.08, 0.08, 1.0, C.woodDark, [0.8, 0.5, -0.06], null, 5), box(2.5, 2.5, 0.08, C.wood, [0, 1.95, -0.06])]), 11.6, -0.4, -0.25);
    ctx.collideCircle(11.6, -0.4, 1.0); ctx.collideCircle(-7.6, 3.4, 0.8); ctx.collideBox(7.45, 1.4, 3.2, 1.3); ctx.collideBox(23.5, -22, 10, 9); ctx.collideCircle(30, -18, 1.9);
    ctx.collideBox(11.7, -7.6, 2.8, 3.0); ctx.collideBox(-11.6, BZC, 2.2, 1.5); for (const sz of [-1, 1]) ctx.collideCircle(-9.7, BZC + sz * 0.75, 0.2);
    ctx.collideBox(-19, BZC, 11.6, 8.2); for (const x of SPR) { ctx.collideCircle(x, BZC, 0.12); ctx.collideCircle(x, -1.0, 0.2); }

    // the ground rises over the berms, and the bed floor rises when it is frozen
    let bedFloor = 0;
    const heightAt = (x, z) => { const ax = Math.abs(x), dzc = Math.abs(z - BZC); if (ax < BX && dzc < 6) return bedFloor; const out = Math.min(BX + 1.4 - ax, 7.4 - dzc); if (out <= 0) return 0; const inn = Math.max(ax - BX, dzc - 6); return Math.max(0.45 * clamp(Math.min(out, inn + 0.25) / 0.35, 0, 1), 0); };
    let waterY = 0; // current flood level in the bed
    ctx.onUpdate((dt) => { const p = ctx.player.position; if (p.x > 60 || ctx.player.parent !== ctx.scene) { ctx.speed = 6.2; return; } p.y = damp(p.y, heightAt(p.x, p.z), 14, dt); ctx.speed = (waterY > 0.15 && Math.abs(p.x) < BX && Math.abs(p.z - BZC) < 6) ? 4.4 : 6.2; });

    // --- things in the bed that change ---
    const carpetMat = new THREE.MeshLambertMaterial({ map: carpetTex(), transparent: true, opacity: 0 });
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(18.2, 12.2), carpetMat); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.06, BZC); carpet.visible = false; ctx.add(carpet);
    const tuftG = new THREE.Group(); for (let i = 0; i < 170; i++) { const s = 0.26 + rnd() * 0.26; tuftG.add(dome(s, 0.13 + rnd() * 0.09, s * 0.8, 0xffffff, [(rnd() - 0.5) * 17.3, 0.05, BZC + (rnd() - 0.5) * 11.3], rnd() * 3, 5)); }
    bake(tuftG); const tufts = tuftG.children[0]; tufts.material = new THREE.MeshLambertMaterial({ color: 0x6aa850 }); tuftG.visible = false; ctx.add(tuftG);
    const dots = (n, r, y, seed, flat = 1) => { const g = new THREE.Group(), rr = seeded(seed); for (let i = 0; i < n; i++) { const q = r * (0.8 + rr() * 0.5); g.add(dome(q, q * flat, q, 0xffffff, [(rr() - 0.5) * 17.2, y - q * 0.4 * flat, BZC + (rr() - 0.5) * 11.2], rr() * 3, 4)); } bake(g); g.children[0].material = new THREE.MeshLambertMaterial({ color: 0xffffff }); g.visible = false; ctx.add(g); return g; };
    const blooms = dots(160, 0.13, 0.2, 31, 0.6); blooms.children[0].material.color.set(0xf6c9d6);
    const vineBerries = dots(170, 0.1, 0.2, 47); vineBerries.children[0].material.color.set(0x9ccc55);
    const waterMat = new THREE.MeshLambertMaterial({ color: C.water, transparent: true, opacity: 0.72, depthWrite: false });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(18.3, 12.3), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.03, BZC); water.visible = false; ctx.add(water);

    // people & props of the bog
    const grower = ctx.person({ hat: 'straw', shirt: 0x3f7fd1, pants: 0x5b6b3c, skin: C.skin[1], hair: C.hair[6], hairStyle: 'pony', shoes: 0x2f5d50, expressive: true }, -3.2, 2.4, 0.5);
    const keeper = ctx.person({ hat: 'straw', hatColor: 0xfafafa, shirt: 0xf4f1e6, pants: 0xf4f1e6, skin: C.skin[3], hair: C.hair[1], beard: 0x3a2a1a, shoes: 0x8a8a8a, expressive: true }, 5.0, 2.3, -0.4); keeper.visible = false;
    const bundle = group([P.crate({ color: C.woodLight }), ...[0, 1, 2, 3, 4, 5].map(i => cone(0.07, 0.5, i % 2 ? 0x5aa845 : 0x4f8a3e, [-0.2 + (i % 3) * 0.2, 0.62, -0.1 + Math.floor(i / 3) * 0.2], [0.2 - (i % 2) * 0.4, 0, (i % 3 - 1) * 0.3], 5))]); bake(bundle); ctx.add(bundle, -5.0, 1.4);
    const valves = SPR.map(x => { const v = group([torus(0.24, 0.055, C.red, [0, 0, 0], [Math.PI / 2, 0, 0]), box(0.44, 0.05, 0.06, C.red), box(0.06, 0.05, 0.44, C.red)], [x, 0.58, -1.0]); bake(v); ctx.add(v); v.userData.on = false; return v; });
    const gateBoard = ctx.add(box(0.14, 1.3, 1.2, 0xb98a5e, [-9.7, 0.7, BZC]));
    const gateWheel = group([torus(0.34, 0.06, C.red, null, [0, Math.PI / 2, 0]), box(0.06, 0.62, 0.06, C.red), box(0.06, 0.06, 0.62, C.red), cyl(0.04, 0.04, 0.4, 0x333333, [-0.15, 0, 0], [0, 0, Math.PI / 2], 5)], [-9.35, 1.55, BZC]); bake(gateWheel); ctx.add(gateWheel);
    const truck1 = ctx.add(P.truck({ kind: 'flatbed', color: 0x2f8f6f }), 14.2, -7.3, 0); truck1.visible = false;
    const truckCol = ctx.collideBox(14.2, -7.3, 2.6, 6.8);
    const heapGeo = roundBerryGeo(0.11), heap = group([dome(0.95, 0.36, 1.85, 0x9d1027, [0, 0.08, 0], 0, 8), ...Array.from({ length: 70 }, (_, i) => { const a = rnd() * 6.28, r = Math.sqrt(rnd()); return M(heapGeo, BERRY_REDS[i % 6], [Math.cos(a) * r * 0.85, 0.1 + 0.34 * Math.sqrt(Math.max(0, 1 - r * r)), Math.sin(a) * r * 1.7]); })]); bake(heap); heap.scale.setScalar(0.01); heap.userData.dynamic = true; truck1.userData.bed.add(heap); heap.visible = false;


    // night sky, sprinklers, ice
    const moon = emojiSprite('🌕', 11, [-50, 15, -105]); moon.material.fog = false; moon.visible = false; ctx.add(moon);
    const starGeo = new THREE.BufferGeometry(); { const a = new Float32Array(140 * 3); for (let i = 0; i < 140; i++) { const th = rnd() * Math.PI - Math.PI / 2, ph = 0.2 + rnd() * 0.9; a[i * 3] = Math.sin(th) * Math.cos(ph) * 180; a[i * 3 + 1] = Math.sin(ph) * 180; a[i * 3 + 2] = -Math.cos(th) * Math.cos(ph) * 180; } starGeo.setAttribute('position', new THREE.BufferAttribute(a, 3)); }
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, fog: false, sizeAttenuation: true })); stars.frustumCulled = false; stars.visible = false; ctx.add(stars);
    const NS = 60, sprayGeo = new THREE.BufferGeometry(), sprayPos = new Float32Array(3 * NS * 3); sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
    const spray = new THREE.Points(sprayGeo, new THREE.PointsMaterial({ color: 0xcfeeff, size: 0.2, transparent: true, opacity: 0.9, depthWrite: false })); spray.frustumCulled = false; spray.visible = false; ctx.add(spray);
    const NI = 170, ice = swarm(new THREE.OctahedronGeometry(0.13, 0), new THREE.MeshBasicMaterial({ color: 0xe6f7ff }), NI, [0, 0, BZC], 13); ice.mesh.visible = false; ctx.add(ice.mesh);
    const iceP = []; for (let i = 0; i < NI; i++) { const x = (rnd() - 0.5) * 17.4, z = BZC + (rnd() - 0.5) * 11.4; iceP.push({ x, z, k: x < -2.75 ? 0 : x < 2.75 ? 1 : 2, d: 0.4 + Math.hypot(x - SPR[x < -2.75 ? 0 : x < 2.75 ? 1 : 2], z - BZC) * 0.55 + rnd() * 0.6, s: 0.7 + rnd() * 0.9, ph: rnd() * 6 }); }
    // winter: snow caps + the sanding buggy + sand stripes
    const snowG = new THREE.Group(); for (const [cx, cz, w, d] of [[0, BZ2 + 0.7, 20.6, 1.0], [0, BZ1 - 0.7, 20.6, 1.0], [-BX - 0.7, BZC, 1.0, 13.2], [BX + 0.7, BZC, 1.0, 13.2]]) snowG.add(box(w, 0.12, d, 0xffffff, [cx, 0.5, cz]));
    for (let i = 0; i < 16; i++) snowG.add(dome(0.8 + rnd() * 1.0, 0.3 + rnd() * 0.22, 0.7 + rnd() * 0.8, 0xffffff, [(rnd() - 0.5) * 36, 0, i % 2 ? 1 + rnd() * 5 : -18.5 - rnd() * 5], rnd() * 3, 8));
    for (const x of [6.4, 7.5, 8.5]) snowG.add(box(1.0, 0.14, 0.9, 0xffffff, [x, 1.24, x === 7.5 ? 1.7 : x > 8 ? 1.2 : 1.3])); snowG.add(dome(3, 0.3, 2.2, 0xffffff, [-19, 0.1, BZC], 0, 8)); snowG.add(plane(3.6, 9.4, 0xf2f6fa, [0, 0.05, 3.2])); snowG.add(box(12.4, 0.1, 9, 0xdff1fa, [-19, 0.08, BZC]));
    ctx.addStatic(snowG); snowG.visible = false;
    const sander = sandBuggy(); sander.position.set(-7, 0.3, -4.6); sander.rotation.y = Math.PI; sander.visible = false; ctx.add(sander);
    const LANES = [-7, -3.5, 0, 3.5, 7], stripeMat = new THREE.MeshLambertMaterial({ color: 0xdcc48e, transparent: true, opacity: 1 });
    const stripes = LANES.map(x => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1), stripeMat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.33, BZC); m.visible = false; m.userData.lo = 1e9; m.userData.hi = -1e9; ctx.add(m); return m; });
    // harvest: floating berries, water reel, boom, the stream up the elevator
    const COLS = 6, ROWS = 4, PER = 24, NB = COLS * ROWS * PER;
    const berries = swarm(berryGeo(), berryMat(), NB, [0, 0, BZC], 13); berries.mesh.visible = false; ctx.add(berries.mesh);
    // the red mosaic itself: a carpet of small berries per patch of the bed (one draw), then one raft that the boom gathers
    const raftTex = berryCarpetTex();
    const flatGeo = (w) => new THREE.PlaneGeometry(w, w).rotateX(-Math.PI / 2);
    const mosaic = swarm(flatGeo(4.4), new THREE.MeshLambertMaterial({ map: berryPatchTex(), alphaTest: 0.5 }), COLS * ROWS, [0, 0, BZC], 13); mosaic.mesh.visible = false; ctx.add(mosaic.mesh);
    const raft = new THREE.Mesh(flatGeo(1), new THREE.MeshLambertMaterial({ map: raftTex, alphaTest: 0.5 })); raft.visible = false; raft.userData.noBake = true; ctx.add(raft);
    const cells = [], bp = []; { const col = new THREE.Color(), pal = BERRY_REDS;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const cell = { x: -7.5 + c * 3, z: -4.5 - r * 3, done: false, t0: 0 }; cells.push(cell);
        for (let k = 0; k < PER; k++) { const i = bp.length; bp.push({ x: cell.x + (rnd() - 0.5) * 3, z: cell.z + (rnd() - 0.5) * 3, cell, d: rnd() * 0.9, s: 0.8 + rnd() * 0.55, ph: rnd() * 6.3 }); berries.mesh.setColorAt(i, col.set(pal[Math.floor(rnd() * pal.length)])); } }
      const px = 9, pz = -8.3; bp.map((b, i) => [Math.hypot(b.x - px, (b.z - pz) * 0.6), i]).sort((a, b) => b[0] - a[0]).forEach(([d, i], rank) => { bp[i].rank = rank / NB; }); }
    const reelM = waterReel(); reelM.position.set(-6.5, 0, -4.6); reelM.rotation.y = Math.PI / 2; reelM.visible = false; ctx.add(reelM);
    const boomG = new THREE.Group(); for (let i = 0; i < 12; i++) { boomG.add(rc(0.17, 0.17, 0.9, 0xe3b23a, [0, 0, -5.5 + i], [Math.PI / 2, 0, 0], 8)); boomG.add(rc(0.1, 0.1, 0.12, 0x8a6a2a, [0, 0, -5.0 + i], [Math.PI / 2, 0, 0], 6)); } for (const z of [-6.15, 6.15]) boomG.add(rs(0xd9622b, [0, 0.05, z], [0.3, 0.3, 0.3], 8)); bake(boomG); boomG.position.set(-8.7, 0.36, BZC); boomG.visible = false; ctx.add(boomG);
    const NST = 48, stream = swarm(roundBerryGeo(0.11), new THREE.MeshLambertMaterial({ color: 0xb5152b }), NST, [11.5, 1.5, -8.3], 6); stream.mesh.visible = false; ctx.add(stream.mesh);
    const bogZone = zoneOf();

    // ============ ZONE 2 — fresh-berry receiving station (x≈200) ============
    const XF = 200, zf = new THREE.Group();
    zf.add(gplane(25, 16, 0xb9b4a8, [3, 0.03, -4.6], 5));
    zf.add(box(17, 5, 0.4, 0xeadfc6, [5, 2.5, -12])); zf.add(box(0.4, 5, 6.6, 0xdccfb2, [-3.5, 2.5, -8.9])); zf.add(box(0.4, 5, 6.6, 0xdccfb2, [13.5, 2.5, -8.9]));
    zf.add(box(18, 0.3, 7.6, 0x8a4b3a, [5, 5.15, -8.6])); zf.add(box(17, 0.5, 0.45, RED2, [5, 1.0, -11.75])); zf.add(plane(16.6, 6.4, 0xcfc9bb, [5, 0.04, -8.6]));
    zf.add(sign('FRESH CRANBERRIES', 1.0, { border: '#8c1024' }, [9.4, 3.4, -11.75]));
    for (const x of [-1.4, 1.9]) { zf.add(box(1.7, 1.3, 0.1, 0xbfe6f5, [x, 3.3, -11.78])); zf.add(box(1.9, 0.12, 0.2, C.white, [x, 2.6, -11.72])); }
    // the bounce machine
    const BMX = 5, BMZ = -8.6;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) zf.add(box(0.14, 3.2, 0.14, C.steel, [BMX + sx * 1.1, 1.6, BMZ + sz * 0.6]));
    zf.add(cone(0.9, 0.9, 0x6d7a86, [BMX - 0.4, 3.3, BMZ], [Math.PI, Math.PI / 4, 0], 4)); zf.add(box(2.3, 0.1, 1.3, 0x6d7a86, [BMX, 3.2, BMZ]));
    zf.add(box(1.3, 0.08, 1.1, C.woodLight, [BMX - 0.35, 2.45, BMZ], [0, 0, -0.35])); zf.add(box(1.3, 0.08, 1.1, C.woodLight, [BMX + 0.35, 1.75, BMZ], [0, 0, 0.35])); zf.add(box(1.3, 0.08, 1.1, C.woodLight, [BMX - 0.35, 1.05, BMZ], [0, 0, -0.35]));
    zf.add(box(0.08, 0.5, 1.1, C.wood, [BMX + 0.25, 0.75, BMZ]));
    { const c1 = P.crate({ s: 1.0, fill: RED }); c1.position.set(BMX + 0.85, 0, BMZ); zf.add(c1); const c2 = P.crate({ s: 0.9, fill: 0x6d2a3a, color: 0x9a9a94 }); c2.position.set(BMX - 0.7, 0, BMZ); zf.add(c2); }
    zf.add(P.conveyor(5.4).translateX(-0.2).translateZ(BMZ)); for (let i = 0; i < 9; i++) zf.add(sphere(0.13, i % 3 ? RED : RED3, [-2.4 + i * 0.55, 1.1, BMZ + (i % 2 ? 0.15 : -0.12)], 5));
    zf.add(P.tableProp(1.8, 1.0, 0.85, C.woodLight).translateX(8.4).translateZ(-7.4));
    for (let i = 0; i < 6; i++) { const c = P.crate({ s: 0.9, fill: RED }); c.position.set(10.6 + (i % 3) * 0.95, i > 2 ? 0.54 : 0, -10.6); zf.add(c); }
    for (let i = 0; i < 3; i++) { const s = product('fresh'); s.scale.setScalar(1.3); s.position.set(-2.2 + i * 0.7, 0, -10.9); zf.add(s); }
    // helipad, dry bed, surroundings
    zf.add(M(new THREE.CircleGeometry(3.1, 28), 0x7d8288, [-8.5, 0.045, -1.5], [-Math.PI / 2, 0, 0])); zf.add(M(new THREE.RingGeometry(2.6, 2.8, 28), 0xf1efe8, [-8.5, 0.06, -1.5], [-Math.PI / 2, 0, 0])); zf.add(box(0.3, 0.03, 1.8, 0xfafafa, [-9.1, 0.07, -1.5])); zf.add(box(0.3, 0.03, 1.8, 0xfafafa, [-7.9, 0.07, -1.5])); zf.add(box(1.2, 0.03, 0.3, 0xfafafa, [-8.5, 0.07, -1.5]));
    zf.add(plane(13, 9, 0x7f9a52, [-14, 0.03, -13])); { const r2 = seeded(9); for (let i = 0; i < 90; i++) { const s = 0.28 + r2() * 0.24; zf.add(dome(s, 0.14 + r2() * 0.08, s * 0.85, [0x6a8f45, 0x7d7a4e, 0x8a5a4a, 0x77a052][i % 4], [-14 + (r2() - 0.5) * 12.4, 0.03, -13 + (r2() - 0.5) * 8.4], r2() * 3)); } for (let i = 0; i < 60; i++) zf.add(dome(0.09, 0.09, 0.09, BERRY_REDS[i % 5], [-14 + (r2() - 0.5) * 12.2, 0.15, -13 + (r2() - 0.5) * 8.2], 0, 5)); }
    zf.add(box(13.6, 0.3, 0.6, 0x6fae4e, [-14, 0.15, -8.2])); zf.add(box(13.6, 0.3, 0.6, 0x6fae4e, [-14, 0.15, -17.8]));
    zf.add(plane(30, 4, C.dirt, [10, 0.025, 2.4]));
    zf.add(P.scatter(20, 90, 50, (r) => P.tree({ h: 4 + r() * 3, kind: r() < 0.45 ? 'pine' : 'autumn', color: C.autumn[Math.floor(r() * 4)] }), { seed: 14, keep: (x, z) => (z < -14 && (x > -6 || z < -20)) || x > 17 || x < -23 }).translateZ(-8));
    zf.add(P.scatter(10, 50, 30, (r) => P.bush({ s: 0.8 + r() * 0.5 }), { seed: 15, keep: (x, z) => (x > 16 || x < -20 || z < -16) }).translateZ(-6));
    for (let i = 0; i < 4; i++) { const m = P.mountain({ h: 13 + (i % 2) * 5, color: i % 2 ? 0x8fa05a : 0xb08a4a, snow: false }); m.scale.set(2.6, 1, 1); m.position.set(-70 + i * 48, 0, -100); zf.add(m); }
    for (const [x, z] of [[-2.4, -5.2], [-1.5, -4.7]]) { const b = P.barrel({ color: x > -2 ? 0x3f7fd1 : C.wood }); b.position.set(x, 0, z); zf.add(b); }
    for (let i = 0; i < 5; i++) zf.add(box(1.6, 0.02, 0.18, 0xf2c43d, [-3 + i * 3.2, 0.05, 0.35]));
    for (const [x, z, n] of [[-2.6, -2.2, 3], [0.2, 4.6, 2]]) { zf.add(box(1.3, 0.14, 1.1, C.wood, [x, 0.07, z])); for (let i = 0; i < n; i++) { const c = P.crate({ s: 0.85, fill: RED }); c.position.set(x - 0.25 + (i % 2) * 0.5, 0.14 + Math.floor(i / 2) * 0.52, z); zf.add(c); } }
    for (const [x, z, h] of [[-12.5, 4.8, 4.5], [-15.5, 1.5, 5.2], [15.5, 5.2, 4.6], [-4.5, -14.5, 5]]) { const t = P.tree({ h, kind: 'autumn', color: C.autumn[Math.floor(h * 10) % 4] }); t.position.set(x, 0, z); zf.add(t); }
    { const f = P.fence(12); f.position.set(-14, 0, 4.2); zf.add(f); const h = P.haybale(); h.position.set(-3.5, 0, 4.5); zf.add(h); }
    ctx.addStatic(zf, XF, 0);
    ctx.collideBox(XF + 5, -12, 17, 1); ctx.collideBox(XF - 3.5, -8.9, 0.6, 6.6); ctx.collideBox(XF + 13.5, -8.9, 0.6, 6.6); ctx.collideBox(XF + BMX, BMZ, 2.8, 1.5); ctx.collideBox(XF - 0.2, BMZ, 5.4, 1.2);
    ctx.collideBox(XF + 8.4, -7.4, 1.8, 1.0); ctx.collideBox(XF - 1.95, -4.95, 1.8, 1.3); ctx.collideBox(XF - 2.6, -2.2, 1.4, 1.2); ctx.collideBox(XF + 0.2, 4.6, 1.4, 1.2); ctx.collideBox(XF + 11.5, -10.6, 3, 1.2); ctx.collideBox(XF - 1.5, -10.9, 2.4, 0.8);
    const heli = helicopter(); heli.position.set(XF - 21, 12.5, -9); heli.visible = false; ctx.add(heli);
    const rope = cyl(0.035, 0.035, 3.6, 0x333333, [0, -3.0, 0], null, 4); rope.userData.noBake = true; heli.add(rope);
    const binF = P.crate({ s: 1.25, fill: RED }); binF.position.set(0, -5.5, 0); heli.add(binF);
    const truck2 = ctx.add(P.truck({ kind: 'box', color: RED2, logo: '🔴' }), XF + 9.6, -2.2, Math.PI / 2); ctx.collideBox(XF + 9.6, -2.2, 6.8, 2.6);
    const grader = ctx.person({ hat: 'hairnet', apron: C.white, shirt: 0x9fd0e8, pants: 0x4a4a55, skin: C.skin[2], hair: C.hair[0], hairStyle: 'bun', expressive: true }, XF + 2.6, -6.9, 0.3);
    const picker = ctx.person('farmer', XF - 19, -11.5, Math.PI / 2, 8); picker.userData.anim = 'walk';
    picker.add(pickerCart()); picker.userData.carrying = true;   // arms forward: the hands are on the machine's two handles while the legs walk
    const fresh = product('fresh'); fresh.scale.setScalar(0.01); fresh.position.set(XF + 8.4, 0.9, -7.4); fresh.visible = false; ctx.add(fresh);
    const stationZone = zoneOf(); stationZone.visible = false;

    // ============ ZONE 3 — the market (x≈300, indoors) ============
    const XM = 300, zm = new THREE.Group();
    zm.add(plane(26, 18, 0xefe9dc, [0, 0.03, -4])); for (let i = 0; i < 13; i++) for (let j = 0; j < 9; j++) if ((i + j) % 2) zm.add(plane(2, 2, 0xddd3c0, [-12 + i * 2, 0.035, -12 + j * 2]));
    for (let i = 0; i < 21; i++) zm.add(box(0.5, 0.5, 0.04, [RED, 0xf2c43d, 0x4f9d4a, 0xfafafa, 0xe98a2b][i % 5], [-12 + i * 1.2, 4.75, -12.76], [0, 0, Math.PI / 4]));
    for (const [x, c, r] of [[5.2, 0xe98a2b, 0.3], [1.4, 0xc23b22, 0.2]]) { zm.add(box(2.2, 0.7, 1.2, C.woodLight, [x, 0.35, 3.6])); zm.add(box(2.3, 0.1, 1.3, C.wood, [x, 0.72, 3.6])); for (let i = 0; i < 10; i++) zm.add(sphere(r, i % 4 ? c : 0xe9a23b, [x - 0.8 + (i % 5) * 0.4, 0.78 + r * 0.8, 3.35 + Math.floor(i / 5) * 0.5], 6)); }
    zm.add(box(26, 5, 0.4, 0xf4efe4, [0, 2.5, -13])); zm.add(box(0.4, 5, 18, 0xe8e2d4, [-13, 2.5, -4])); zm.add(box(0.4, 5, 18, 0xe8e2d4, [13, 2.5, -4]));
    zm.add(box(26, 0.5, 0.45, RED2, [0, 4.2, -12.9])); for (const sx of [-1, 1]) { zm.add(box(0.1, 0.5, 18, RED2, [sx * 12.78, 4.2, -4])); for (let i = 0; i < 3; i++) { zm.add(box(0.08, 1.5, 1.5, 0xfff3d6, [sx * 12.76, 2.9, -9 + i * 4 + (sx < 0 ? 6.2 : 0)])); zm.add(sphere(0.45, [0xe98a2b, 0x5aa845, RED][i], [sx * 12.7, 2.9, -9 + i * 4 + (sx < 0 ? 6.2 : 0)], 7)); } } zm.add(sign('🛒 MARKET', 1.0, { border: '#8c1024' }, [0, 3.15, -12.75]));
    const reds = [RED, RED2, RED3, 0xfafafa, 0x7b2d8a, C.yellow];
    for (let i = 0; i < 4; i++) { const s = P.shelf({ w: 5, seed: i + 3, colors: i % 2 ? undefined : reds }); s.position.set(-9.6 + i * 6.4, 0, -12.3); zm.add(s); }
    const PED = [[7.5, -3.6, 'juice', 'Juice'], [2.6, -7.8, 'dried', 'Dried'], [-2.4, -3.6, 'jam', 'Jam'], [-7.2, -7.8, 'can', 'Sauce']];
    for (const [x, z] of PED) { zm.add(rc(0.5, 0.58, 0.8, 0xf1efe8, [x, 0.4, z], null, 14)); zm.add(rc(0.62, 0.62, 0.08, C.wood, [x, 0.04, z], null, 14)); zm.add(rc(0.56, 0.56, 0.06, C.woodLight, [x, 0.82, z], null, 14)); }
    const stand = group([box(2.6, 0.8, 1.4, C.woodLight, [0, 0.4, 0]), box(2.7, 0.1, 1.5, C.wood, [0, 0.85, 0]), box(2.7, 0.5, 0.08, C.wood, [0, 1.15, -0.72])], [-10.2, 0, -3.2], [0, Math.PI / 2, 0]);
    for (let i = 0; i < 6; i++) { const b = product('fresh'); b.position.set(-0.9 + (i % 3) * 0.9, 0.9, -0.3 + Math.floor(i / 3) * 0.5); if (i !== 4) stand.add(b); } zm.add(stand);
    zm.add(group([box(3.2, 1, 1, 0x8a6a4a, [0, 0.5, 0]), box(3.3, 0.08, 1.1, 0x333333, [0, 1.04, 0]), box(0.6, 0.45, 0.5, 0x444444, [0.8, 1.3, 0]), box(0.5, 0.3, 0.05, glow(0x9fe8a0), [0.8, 1.42, 0.26])], [-5.5, 0, 1.8]));
    for (const [x, z] of [[11.6, -8], [11.6, -2.5]]) { const s = P.shelf({ w: 4, seed: x + z + 40 }); s.rotation.y = -Math.PI / 2; s.position.set(x + 0.6, 0, z); zm.add(s); }
    zm.add(picture(2.8, 2.0, (g, w, h) => { g.fillStyle = '#fff3d6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8c1024'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      g.strokeStyle = '#6e4a28'; g.lineWidth = 5; g.beginPath(); g.moveTo(0.12 * w, 0.2 * h); g.quadraticCurveTo(0.5 * w, 0.05 * h, 0.9 * w, 0.3 * h); g.stroke();
      for (const [x, y, a] of [[0.2, 0.2, -0.5], [0.36, 0.13, 0.2], [0.55, 0.12, -0.3], [0.72, 0.18, 0.5], [0.85, 0.27, 0.1]]) { g.fillStyle = '#4f8a3e'; g.beginPath(); g.ellipse(x * w, y * h, 0.06 * w, 0.028 * h * 1.4, a, 0, 6.3); g.fill(); }
      for (const [x, y] of [[0.22, 0.42], [0.34, 0.36], [0.46, 0.44], [0.58, 0.35], [0.7, 0.43], [0.8, 0.5], [0.4, 0.58], [0.55, 0.6]]) { g.strokeStyle = '#6e4a28'; g.lineWidth = 3; g.beginPath(); g.moveTo(x * w, y * h - 0.07 * h); g.lineTo(x * w + 4, y * h - 0.2 * h); g.stroke(); g.fillStyle = '#c2182f'; g.beginPath(); g.arc(x * w, y * h, 0.075 * h, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x * w - 0.025 * h, y * h - 0.03 * h, 0.022 * h, 0.013 * h, -0.6, 0, 6.3); g.fill(); }
      g.fillStyle = '#8c1024'; g.font = '800 ' + (h * 0.17) + 'px Fredoka,"Baloo 2","Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CRANBERRIES', w / 2, h * 0.84); }, 256, [-12.75, 3.0, -6], [0, Math.PI / 2, 0]));
    ctx.addStatic(zm, XM, 0);
    ctx.collideBox(XM, -12.5, 26, 1.2); ctx.collideBox(XM - 10.2, -3.2, 1.6, 2.8); ctx.collideBox(XM - 5.5, 1.8, 3.4, 1.2); ctx.collideBox(XM + 3.3, 3.6, 6.2, 1.3); ctx.collideBox(XM + 12.2, -5.2, 1, 10); for (const [x, z] of PED) ctx.collideCircle(XM + x, z, 0.6);
    const goods = PED.map(([x, z, kind, name]) => { const o = product(kind); o.scale.setScalar(1.7); o.position.set(XM + x, 0.86, z); ctx.add(o); const l = label(name, 0.7, { border: '#8c1024' }, [XM + x, 2.85, z]); ctx.add(l); o.userData.kind = kind; o.userData.label = l; return o; });
    const cashier = ctx.person({ shirt: RED2, apron: 0xffffff, hairStyle: 'curly', hair: C.hair[1], skin: C.skin[5], glasses: true, expressive: true }, XM - 5.5, 0.6, 0);
    const shopper = ctx.person('shopper', XM + 4, -10.4, 1.2, 6); shopper.userData.anim = 'walk';
    const basket = group([box(0.7, 0.06, 0.5, 0x3f7fd1, [0, 0, 0]), box(0.7, 0.32, 0.05, 0x3f7fd1, [0, 0.16, 0.25]), box(0.7, 0.32, 0.05, 0x3f7fd1, [0, 0.16, -0.25]), box(0.05, 0.32, 0.5, 0x3f7fd1, [0.35, 0.16, 0]), box(0.05, 0.32, 0.5, 0x3f7fd1, [-0.35, 0.16, 0])]); bake(basket);
    const freshBag = product('fresh'); freshBag.position.set(XM - 10.2 + 0.2, 0.9, -3.2); freshBag.rotation.y = Math.PI / 2; ctx.add(freshBag);
    const marketZone = zoneOf(); marketZone.visible = false;

    // ============ ZONE 4 — home kitchen (x≈400, indoors) ============
    const XK = 400, zk = new THREE.Group();
    zk.add(gplane(16, 12, 0xd9b98c, [0, 0.03, -2], 4)); for (let i = 0; i < 8; i++) zk.add(plane(0.06, 12, 0xc6a273, [-7 + i * 2, 0.035, -2]));
    zk.add(box(16, 5, 0.4, 0xf7e9cf, [0, 2.5, -8])); zk.add(box(0.4, 5, 12, 0xf0dfc0, [-8, 2.5, -2])); zk.add(box(0.4, 5, 12, 0xf0dfc0, [8, 2.5, -2]));
    zk.add(box(16, 1.1, 0.42, 0xb86a58, [0, 0.55, -7.98]));
    // tiled splash-back, the view from the window, a sink and a proper cooker
    zk.add(picture(11.6, 1.16, (g, w, h) => { g.fillStyle = '#c4b9a2'; g.fillRect(0, 0, w, h); const n = 44, tw = w / n, th = h / 4; for (let j = 0; j < 4; j++) for (let i = 0; i <= n; i++) { g.fillStyle = ['#e6dcc6', '#ddd2ba', '#e2d8c1', '#d8cdb4'][(i * 7 + j * 3) % 4]; g.fillRect((i - (j % 2) * 0.5) * tw + 1, j * th + 1, tw - 2, th - 2); } }, 512, [-1.3, 1.69, -7.785]));
    zk.add(picture(2.2, 1.5, (g, w, h) => { const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#9cc9e6'); sky.addColorStop(0.7, '#dcecf2'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#9fb08a'; g.beginPath(); g.moveTo(0, h * 0.72); g.quadraticCurveTo(w * 0.3, h * 0.52, w * 0.62, h * 0.7); g.quadraticCurveTo(w * 0.85, h * 0.6, w, h * 0.68); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#8fae62'; g.fillRect(0, h * 0.8, w, h * 0.2);
      for (const [x, y, r, c] of [[0.16, 0.6, 0.16, '#c9702a'], [0.3, 0.66, 0.11, '#d9a13a'], [0.8, 0.58, 0.17, '#b5482a'], [0.66, 0.68, 0.1, '#7a9a4a']]) { g.fillStyle = '#6e4a28'; g.fillRect(x * w - 3, y * h, 6, h * 0.24); g.fillStyle = c; g.beginPath(); g.arc(x * w, y * h, r * h, 0, 6.3); g.fill(); } }, 256, [-3.8, 3.2, -7.735]));
    zk.add(box(1.3, 0.05, 0.82, 0xb9c0c4, [-5.6, 1.125, -7.08])); zk.add(box(1.02, 0.02, 0.52, 0x6f787e, [-5.6, 1.155, -7.02])); zk.add(rc(0.05, 0.05, 0.02, 0x3a3f44, [-5.6, 1.17, -7.02], null, 8));
    zk.add(rc(0.035, 0.04, 0.42, 0xaab2b8, [-5.6, 1.36, -7.4], null, 8)); zk.add(rc(0.03, 0.03, 0.3, 0xaab2b8, [-5.6, 1.55, -7.27], [Math.PI / 2, 0, 0], 8)); for (const sx of [-1, 1]) zk.add(rc(0.04, 0.04, 0.07, 0xaab2b8, [-5.6 + sx * 0.17, 1.19, -7.4], null, 6));
    for (const [dx, r] of [[0, 0.3], [-0.62, 0.15], [0.62, 0.15]]) { zk.add(rc(r, r, 0.02, 0x111214, [1.5 + dx, 1.17, -7.1 + (dx ? 0.3 : 0)], null, 14)); zk.add(rc(r * 0.55, r * 0.55, 0.025, 0x4a4d52, [1.5 + dx, 1.172, -7.1 + (dx ? 0.3 : 0)], null, 10)); }
    for (let i = 0; i < 4; i++) zk.add(rc(0.05, 0.05, 0.05, 0xd9d2c0, [0.96 + i * 0.36, 0.99, -6.39], [Math.PI / 2, 0, 0], 8)); zk.add(box(1.15, 0.34, 0.02, 0x15181b, [1.5, 0.5, -6.395])); zk.add(rc(0.022, 0.022, 1.25, 0xb8c0c4, [1.5, 0.8, -6.35], [0, 0, Math.PI / 2], 6));
    
    zk.add(box(11.4, 1, 1.3, 0x4f8a86, [-1.3, 0.5, -7.1])); zk.add(box(11.6, 0.1, 1.4, 0xf5f0e6, [-1.3, 1.05, -7.1])); for (let i = 0; i < 5; i++) zk.add(box(0.5, 0.06, 0.05, 0xe8b63a, [-5.8 + i * 2.2, 0.75, -6.43]));
    zk.add(box(1.7, 2.4, 1.3, 0xe4e8ea, [6.2, 1.2, -7.1])); zk.add(box(0.08, 0.7, 0.08, 0x8a949e, [5.55, 1.5, -6.42])); zk.add(box(1.7, 0.04, 0.04, 0xb8c0c4, [6.2, 1.75, -6.44]));
    zk.add(box(2.4, 0.12, 0.22, C.white, [-3.8, 2.4, -7.7])); zk.add(box(0.08, 1.5, 0.12, C.white, [-3.8, 3.2, -7.76])); zk.add(cyl(0.14, 0.1, 0.22, 0xc96a5a, [-4.4, 2.57, -7.65], null, 8)); zk.add(sphere(0.2, 0x5aa845, [-4.4, 2.82, -7.65], 6));
    zk.add(box(1.7, 0.08, 1.2, 0x2e2e2e, [1.5, 1.12, -7.1])); zk.add(box(1.7, 0.7, 0.06, 0x3a3a3a, [1.5, 0.55, -6.43])); zk.add(box(1.9, 0.5, 0.9, 0x8a949e, [1.5, 3.6, -7.45])); zk.add(box(0.5, 1.0, 0.5, 0x8a949e, [1.5, 4.3, -7.6]));
    zk.add(box(3, 0.08, 0.35, C.wood, [4.2, 2.7, -7.7])); for (let i = 0; i < 5; i++) zk.add(cyl(0.13, 0.13, 0.32, [RED, 0xe8b63a, 0x7b4fb0, RED3, 0x5aa845][i], [3.2 + i * 0.5, 2.92, -7.7], null, 8));
    { const t = P.tableProp(3.6, 1.9, 0.9, C.wood); t.position.set(-2, 0, -1.4); zk.add(t); zk.add(box(3.8, 0.05, 2.1, 0xf2e3c0, [-2, 0.97, -1.4])); zk.add(box(3.8, 0.02, 0.5, 0xd9622b, [-2, 1.0, -1.4])); for (const [x, z] of [[-3.1, -0.9], [-0.9, -0.9], [-3.1, -1.9], [-0.9, -1.9]]) zk.add(rc(0.26, 0.18, 0.04, 0xf4f1ea, [x, 1.02, z], null, 14)); zk.add(rs(0xd9772b, [-2, 1.19, -1.4], [0.25, 0.2, 0.25], 10)); zk.add(cyl(0.03, 0.03, 0.12, 0x5a8f3c, [-2, 1.43, -1.4], null, 4)); }
    zk.add(plane(5.2, 3.4, 0xc96a5a, [-2, 0.04, -1.4])); zk.add(plane(4.6, 2.8, 0xe9b48a, [-2, 0.045, -1.4]));
    zk.add(picture(1.6, 1.2, (g, w, h) => { g.fillStyle = '#fff8e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6e4a28'; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12); g.font = (h * 0.55) + 'px "Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🦃', w / 2, h / 2 + 6); }, 256, [7.75, 3.1, -3], [0, -Math.PI / 2, 0]));
    for (const [x, w] of [[-0.9, 2.7], [-6.45, 2.3]]) { zk.add(box(w, 1.1, 0.5, 0x4f8a86, [x, 3.45, -7.55])); zk.add(box(0.04, 1.0, 0.04, 0x3b6e6a, [x, 3.45, -7.29])); for (const s of [-1, 1]) zk.add(sphere(0.05, 0xe8b63a, [x + s * 0.14, 3.2, -7.28], 5)); }
    zk.add(box(0.1, 2.7, 1.4, 0x8a5a3a, [-7.76, 1.35, -0.6])); zk.add(box(0.12, 2.9, 0.12, 0xf5f0e6, [-7.74, 1.45, -1.38])); zk.add(box(0.12, 2.9, 0.12, 0xf5f0e6, [-7.74, 1.45, 0.18])); zk.add(sphere(0.07, 0xe8b63a, [-7.66, 1.3, -0.05], 5));
    for (const [z, c] of [[-3.2, 0xe9a23b], [-4.7, RED], [-6.2, 0x5aa845]]) { zk.add(box(0.06, 1.0, 0.9, 0x6e4a28, [-7.77, 3.1, z])); zk.add(box(0.08, 0.8, 0.7, 0xfff3d6, [-7.75, 3.1, z])); zk.add(sphere(0.2, c, [-7.72, 3.1, z], 6)); }
    zk.add(cyl(0.3, 0.22, 0.5, 0xc96a5a, [-7.1, 0.25, -5.7], null, 8)); for (const [dx, dy, r] of [[0, 1.0, 0.45], [0.2, 1.5, 0.35], [-0.15, 1.8, 0.28]]) zk.add(sphere(r, 0x5aa845, [-7.1 + dx, dy, -5.7], 6));
    zk.add(cyl(0.38, 0.38, 0.06, 0xfafafa, [7.76, 3.3, -6.2], [0, 0, Math.PI / 2], 14)); zk.add(box(0.03, 0.3, 0.04, 0x333333, [7.7, 3.4, -6.2])); zk.add(box(0.03, 0.04, 0.22, 0x333333, [7.7, 3.3, -6.1]));
    for (let i = 0; i < 3; i++) { zk.add(cyl(0.2 - i * 0.03, 0.2 - i * 0.03, 0.05, [0x444444, 0xb4563c, 0x6d7a86][i], [-2.2 + i * 0.55, 2.35, -7.72], [Math.PI / 2, 0, 0], 10)); zk.add(box(0.04, 0.3, 0.03, 0x333333, [-2.2 + i * 0.55, 2.62, -7.74])); }
    // sieve station: bowl + sieve on the counter
    const SVX = -1.0;
    zk.add(lathe([[0, 0], [0.28, 0.02], [0.46, 0.28], [0.48, 0.32]], 0xfafafa, [SVX, 1.1, -7.1])); zk.add(box(1.2, 0.08, 0.9, C.woodLight, [-3.0, 1.12, -7.05]));
    ctx.addStatic(zk, XK, 0);
    ctx.collideBox(XK - 1.3, -7.1, 11.6, 1.6); ctx.collideBox(XK + 6.2, -7.1, 1.9, 1.6); ctx.collideBox(XK - 2, -1.4, 3.8, 2.1);
    const grandpa = ctx.person({ hair: C.hair[4], hairStyle: 'short', beard: 0xb5b5b5, shirt: 0x2f6d5a, apron: 0xf6ecd6, glasses: true, skin: C.skin[2], pants: 0x4a4a55, expressive: true }, XK + 3.8, -3.7, -0.9);
    const pot = group([M(new THREE.CylinderGeometry(0.44, 0.41, 0.5, 16, 1, true), mat(0x9aa3a8, { side: 'double' }), [0, 0.25, 0]), rc(0.41, 0.41, 0.03, 0x7d868c, [0, 0.015, 0], null, 16), M(new THREE.CylinderGeometry(0.46, 0.46, 0.045, 16, 1, true), mat(0x6d757b, { side: 'double' }), [0, 0.49, 0]), box(0.5, 0.05, 0.09, 0x2b2b2e, [0.68, 0.42, 0]), box(0.1, 0.05, 0.2, 0x2b2b2e, [-0.5, 0.42, 0])], [XK + 1.5, 1.16, -7.1]); bake(pot); ctx.add(pot);
    const potFill = rc(0.4, 0.4, 0.04, 0x9fd6f2, [0, 0.3, 0], null, 16); potFill.material = new THREE.MeshLambertMaterial({ color: 0x9fd6f2 }); potFill.userData.noBake = true; pot.add(potFill);
    const sieve = group([torus(0.44, 0.04, 0x8a949e, [0, 0, 0], [Math.PI / 2, 0, 0]), box(0.5, 0.05, 0.08, 0x8a949e, [-0.68, 0, 0])], [XK + SVX, 1.52, -7.1]); const mesh_ = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xb8c0c4, { side: 'double' })); mesh_.scale.y = 0.45; sieve.add(mesh_); bake(sieve); ctx.add(sieve);
    const bowlFill = cyl(0.4, 0.24, 0.22, RED, [XK + SVX, 1.22, -7.1], null, 12); bowlFill.scale.setScalar(0.01); bowlFill.visible = false; ctx.add(bowlFill);
    const kitchenZone = zoneOf(); kitchenZone.visible = false;

    // ============ THE STORY ============
    ctx.onStart(async () => {
      const TOTAL = 17; let step = 0; const done = () => ctx.progress(++step, TOTAL); ctx.progress(0, TOTAL);
      ctx.bounds(-11.5, -17.6, 12.3, 6.5);
      const fact = (icon, text) => ctx.fact(icon, text);   // the "In real life" one-liners

      // ---------- 1. plant vine cuttings on the sandy bed ----------
      ctx.say(grower, 'We plant cuttings, not seeds! 🌿', 3.5, { block: false });
      ctx.goal('🌿', 'Grab the cuttings', bundle);
      await use(bundle, '🌿', 'Pick up', { y: 1.3 });
      bundle.scale.setScalar(0.75); ctx.carry(bundle, { y: -0.21 }); bundle.position.z = 0.06; done();   // held by its sides, in front of the chest
      fact('🌿', 'Cranberries grow on vines in sandy soil — not under water!');
      const spots = []; for (const z of [-6, -12]) for (const x of [-6, -2, 2, 6]) spots.push({ x, z });
      let planted = 0; const sprigs = [];
      const nearest = new THREE.Object3D(); ctx.scene.add(nearest);
      const aim = (list) => { let b = null, bd = 1e9; const p = ctx.player.position; for (const s of list) { if (s.done) continue; const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < bd) { bd = d; b = s; } } if (b) nearest.position.set(b.x, 0, b.z); return b; };
      let stopAim = ctx.onUpdate(() => aim(spots)); aim(spots);
      ctx.goal('🌱', 'Plant 8 cuttings', nearest);
      for (const s of spots) {
        s.mk = group([cyl(0.45, 0.45, 0.03, 0xffd84a, [0, 0.08, 0], null, 14)], [s.x, 0, s.z]); s.mk.children[0].material = mat(0xffd84a, { opacity: 0.6 }); ctx.add(s.mk);
        ctx.zone({ x: s.x, z: s.z, r: 1.0, onEnter: () => {
          s.done = true; ctx.remove(s.mk); ctx.audio.play('plant'); ctx.burst([s.x, 0.1, s.z], { color: 0xdcc48e, n: 8, size: 0.18 });
          const sp = sprig(); sp.position.set(s.x, 0.03, s.z); sp.rotation.y = rnd() * 6; sp.scale.setScalar(0.01); ctx.add(sp); sprigs.push(sp); ctx.tween(sp.scale, { x: 0.6, y: 1, z: 0.6 }, 0.5, 'outBack');
          planted++; if (planted < 8) ctx.goal('🌱', 'Plant ' + (8 - planted) + ' more', nearest);
        } });
      }
      await ctx.until(() => planted >= 8);
      stopAim(); ctx.remove(ctx.drop()); done();
      ctx.goal('🌿', 'Watch them spread');
      fact('🕰️', 'Some beds still grow vines planted over 100 years ago!');
      ctx.say(grower, 'Runners weave a living carpet! 💚', 3.2, { block: false });
      carpet.visible = true; ctx.tween(carpetMat, { opacity: 1 }, 2.5); for (const sp of sprigs) ctx.tween(sp.scale, { x: 2.6, y: 1.2, z: 2.6 }, 2.4, 'inOut');
      await ctx.focus([0, 0, BZC], 2.7, { dist: 19, pitch: 0.75 });
      ctx.thank('🌱', ['Soil specialists', 'Drainage crews', 'Vine suppliers', 'Planting crews']);
      await ctx.wait(1.0);

      // ---------- 2. blossoms & bumblebees ----------
      const flowers = [[-5.5, -5.5], [4.5, -6.5], [-2, -11.5], [6, -12]].map(([x, z]) => ({ x, z }));
      const bees = [];
      await ctx.chapter({ title: 'Four patient years later…', emoji: '🌸', at: [0, 3.2], face: Math.PI, setup: () => {
        sprigs.forEach(s => ctx.remove(s)); carpetMat.transparent = false; carpetMat.needsUpdate = true; tuftG.visible = true; blooms.visible = true;
        grower.position.set(-6.5, 0, 1.2); keeper.visible = true;
        for (const f of flowers) { f.obj = blossom(); f.obj.position.set(f.x, 0.05, f.z); f.obj.scale.setScalar(1.5); ctx.add(f.obj); }
        for (let i = 0; i < 4; i++) { const b = bee(); b.position.set(7.5, 1.4, 1.7); b.visible = false; ctx.add(b); bees.push({ m: b, ph: i * 1.7, r: 0.7 + (i % 2) * 0.35, sp: 2.2 + i * 0.4 }); }
      } });
      ctx.say(grower, 'Blossom time at last! 🌸', 3, { block: false }); const keeperLine = ctx.after(3.1, () => ctx.say(keeper, 'The flowers need my bees! 🐝', 3.2, { block: false }));   // (one speaker at a time: on a phone two bubbles end up on top of each other)
      const hive = [7.5, 1.4];
      ctx.goal('🐝', 'Open the hive', [7.4, 2.9]);
      await use(hive, '🐝', 'Open', { y: 1.7, r: 2.8 });
      keeperLine();   // a quick player has the hive open before the beekeeper asks: skip that line
      ctx.audio.play('buzz'); bees.forEach(b => { b.m.visible = true; }); done();
      const swarmAt = new THREE.Vector3(), tmpV = new THREE.Vector3(); let buzzing = null;
      const stopBees = ctx.onUpdate((dt, t) => {
        const p = ctx.player.position; let f = buzzing; if (!f) for (const fl of flowers) if (!fl.done && Math.hypot(fl.x - p.x, fl.z - p.z) < 2.6) f = fl;
        if (f) swarmAt.set(f.x, 1.25, f.z); else swarmAt.set(p.x, 2.5, p.z);
        for (const b of bees) { const r = f ? 0.45 : b.r, a = t * b.sp + b.ph; tmpV.set(swarmAt.x + Math.cos(a) * r, swarmAt.y + Math.sin(t * 3.1 + b.ph) * 0.22, swarmAt.z + Math.sin(a) * r);
          const ox = b.m.position.x, oz = b.m.position.z; b.m.position.lerp(tmpV, 1 - Math.exp(-5 * dt)); const dx = b.m.position.x - ox, dz = b.m.position.z - oz; if (dx * dx + dz * dz > 1e-6) b.m.rotation.y = Math.atan2(dx, dz);
          if (buzzing) { b.m.position.x += (Math.random() - 0.5) * 0.09; b.m.position.y += (Math.random() - 0.5) * 0.09; } b.m.rotation.z = Math.sin(t * 40 + b.ph) * 0.15; }
      });
      let buzzed = 0; stopAim = ctx.onUpdate(() => aim(flowers)); aim(flowers);
      ctx.say(keeper, 'Bumblebees shake the pollen out! 🐝', 3.4, { block: false });
      ctx.goal('🌸', 'Lead bees to flowers', nearest);
      for (const f of flowers) ctx.interact({ at: [f.x, f.z], icon: '🐝', label: 'Buzz!', hold: 0.8, r: 2.2, y: 1.9, sfx: 'buzz', onUse: async () => {
        if (!buzzed && !buzzing) fact('🌸', 'One acre can hold about 20 million blossoms!');
        buzzing = f; ctx.lock(); const shake = ctx.every(0.05, () => { f.obj.rotation.z = (Math.random() - 0.5) * 0.2; f.obj.rotation.x = (Math.random() - 0.5) * 0.2; }); const bz = ctx.every(0.3, () => { ctx.audio.play('buzz'); ctx.burst([f.x, 1.0, f.z], { color: 0xffe27a, n: 6, size: 0.14, speed: 1.2 }); });
        await ctx.wait(1.1); shake(); bz(); f.obj.rotation.set(0, 0, 0); f.obj.userData.fl.visible = false; f.obj.userData.be.visible = true; ctx.audio.play('ding'); ctx.emote([f.x, 0.6, f.z], '✨');
        f.done = true; buzzing = null; buzzed++; ctx.unlock(); if (buzzed === 4) fact('🥁', 'Some bees drum on the flower with their legs!'); if (buzzed < 4) ctx.goal('🌸', buzzed === 3 ? '1 more flower' : (4 - buzzed) + ' more flowers', nearest);
      } });
      await ctx.until(() => buzzed >= 4);
      stopAim(); done(); ctx.goal('☀️', 'Watch berries grow');
      ctx.thank('🐝', ['Beekeepers', 'Pollination researchers', 'Growers']);
      // every blossom becomes a berry, green then red
      blooms.visible = false; vineBerries.visible = true; const vb = vineBerries.children[0].material.color;
      ctx.tween(vb, { r: 0.76, g: 0.05, b: 0.1 }, 2.3); for (const f of flowers) { const m = f.obj.userData.be.children[0]; m.material = vineBerries.children[0].material; }
      await ctx.wait(2.5);
      stopBees(); bees.forEach(b => ctx.remove(b.m)); flowers.forEach(f => ctx.remove(f.obj));

      // ---------- 3. frost night: sprinklers & ice ----------
      const sprOn = [0, 0, 0]; let iceT0 = [1e9, 1e9, 1e9];
      await ctx.chapter({ n: 2, title: 'Frost Night', emoji: '🌙', env: ['night', { fog: [40, 150], amb: 0.9, sunI: 1.1 }], at: [0, 3.4], face: Math.PI, setup: () => {
        keeper.visible = false; moon.visible = stars.visible = true; spray.visible = true; ice.mesh.visible = true; grower.position.set(-4.4, 0, 4.6); grower.rotation.y = 0.9;
      } });
      const stopNight = ctx.onUpdate((dt, t) => {
        for (let k = 0; k < 3; k++) for (let j = 0; j < NS; j++) { const o = (k * NS + j) * 3; if (!sprOn[k]) { sprayPos[o + 1] = -9; continue; } const u = (t * 0.85 + j * 0.377) % 1, a = t * 2.2 + (j % 2) * Math.PI + k * 1.3 - u * 0.9, r = 0.2 + u * 5.2; sprayPos[o] = SPR[k] + Math.cos(a) * r; sprayPos[o + 1] = 1.05 + u * (1 - u) * 5.2; sprayPos[o + 2] = BZC + Math.sin(a) * r; }
        sprayGeo.attributes.position.needsUpdate = true;
        for (let i = 0; i < NI; i++) { const c = iceP[i], age = t - iceT0[c.k] - c.d; const s = age <= 0 ? 0 : Math.min(1, age * 2.5) * c.s * (0.8 + 0.35 * Math.sin(t * 5 + c.ph)); ice.set(i, c.x, 0.24, c.z, s); } ice.flush();
      });
      ctx.say(grower, 'Brrr! Frost is coming! ❄️', 3, { block: false }); ctx.audio.play('wind');
      ctx.after(7, () => fact('⏰', 'Frost alarms wake growers at night to start the sprinklers!'));
      const vList = valves.map((v, k) => ({ x: v.position.x, z: v.position.z, done: false, v, k }));
      stopAim = ctx.onUpdate(() => aim(vList)); aim(vList); let vOn = 0;
      ctx.goal('💧', 'Turn on 3 sprinklers', nearest);
      for (const s of vList) ctx.interact({ at: s.v, icon: '💧', label: 'Turn on', y: 0.9, r: 2.3, sfx: 'water', onUse: async () => {
        if (!vOn) { await frostGame(ctx); ctx.say(grower, 'Just in time! 💧', 2.4, { block: false }); }   // the first valve: watch the thermometer and start the water at the right moment (a timing game)
        s.done = true; sprOn[s.k] = 1; iceT0[s.k] = ctx.time; vOn++; ctx.tween(s.v.rotation, { y: s.v.rotation.y + 7 }, 0.9, 'out'); ctx.emote(s.v, '💦', { y: 0.8 });
        if (vOn < 3) ctx.goal('💧', vOn === 2 ? '1 more sprinkler' : '2 more sprinklers', nearest);
      } });
      const stopHiss = ctx.every(0.7, () => { if (vOn) ctx.audio.play('water'); });
      await ctx.until(() => vOn >= 3);
      stopAim(); done(); ctx.goal('❄️', 'Watch the ice sparkle');
      ctx.tween(tufts.material.color, { r: 0.72, g: 0.86, b: 0.88 }, 3); ctx.tween(carpetMat.color, { r: 0.82, g: 0.93, b: 1 }, 3);
      const twinkle = ctx.every(0.45, () => ctx.audio.play('sparkle'));
      fact('❄️', 'As water freezes, it gives off heat. That protects the berries!');
      await ctx.focus([0, 0.5, BZC], 3.4, { dist: 21, pitch: 0.3 });
      twinkle(); ctx.say(grower, 'Safe until morning! ⭐', 2.2, { block: false }); await ctx.act('cheer', 1.8, grower);
      stopHiss();

      // ---------- 4. winter: sanding on the ice ----------
      await ctx.chapter({ title: 'Winter', emoji: '⛄', env: ['snow', { fog: [45, 150] }], at: [-2.5, 2.6], face: Math.PI, setup: () => {
        stopNight(); moon.visible = stars.visible = spray.visible = ice.mesh.visible = false; treesGreen.visible = false; flowersG.visible = false; snowG.visible = true; pond.visible = false; vineBerries.visible = false;
        tufts.material.color.set(0x7f9a6a); carpetMat.color.set(0xffffff);
        waterMat.color.set(0xdff1fa); waterMat.opacity = 0.94; water.position.y = 0.3; water.visible = true; bedFloor = 0.3;
        sander.visible = true; grower.position.set(-5.2, 0, 0.6); grower.rotation.y = 0.9;
      } });
      ctx.say(grower, 'Now we spread sand on the ice! ⛄', 3.2, { block: false });
      ctx.goal('🚜', 'Drive the sander', sander);
      await use(sander, '🚜', 'Hop on', { y: 2.5, r: 3.4 });
      ctx.goal('⏳', 'Sand the ice');
      fact('⛄', 'When the ice melts, the sand settles onto the vines.');
      stripes.forEach(s => { s.visible = true; s.scale.y = 0.01; });
      let sandT = 0; const stopSand = ctx.onUpdate(() => {
        const hz = sander.position.z - Math.cos(sander.rotation.y) * 2.85, hx = sander.position.x - Math.sin(sander.rotation.y) * 2.85;
        LANES.forEach((lx, i) => { if (Math.abs(sander.position.x - lx) > 0.25) return; const s = stripes[i], z = clamp(hz, BZ1 + 0.4, BZ2 - 0.4); s.userData.lo = Math.min(s.userData.lo, z); s.userData.hi = Math.max(s.userData.hi, z); const len = Math.max(0.01, s.userData.hi - s.userData.lo); s.scale.y = len; s.position.z = (s.userData.hi + s.userData.lo) / 2; });
        sandT += 1; if (sandT % 5 === 0) ctx.burst([hx, 0.5, hz], { color: 0xdcc48e, n: 5, size: 0.16, speed: 1.6, y: 0 });
      });
      ctx.player.userData.forceAnim = 'carry';   // arms forward, hands on the steering wheel
      await ctx.ride(sander, [[-7, -13.4], [-3.5, -13.4], [-3.5, -4.6], [0, -4.6], [0, -13.4], [3.5, -13.4], [3.5, -4.6], [7, -4.6], [7, -13.4], [7, -11]], { speed: 9, hide: false });
      ctx.player.userData.forceAnim = null; stopSand(); done(); ctx.player.position.set(5.2, 0.3, -9.5);
      for (const s of stripes) { ctx.tween(s.scale, { y: 9.3 }, 0.5); ctx.tween(s.position, { z: BZC }, 0.5); }
      // the melt: sand settles onto the vines
      ctx.goal('☀️', 'Watch the ice melt'); ctx.say(grower, 'The sand helps new vines grow! 🌱', 3.4, { block: false });
      ctx.tween(waterMat, { opacity: 0 }, 2.3); ctx.tween(stripeMat, { opacity: 0.4 }, 2.4); for (const s of stripes) ctx.tween(s.position, { y: 0.1 }, 2.4, 'in'); ctx.tween(water.position, { y: 0.04 }, 2.4, 'in');
      const sink = ctx.onUpdate(() => { bedFloor = Math.max(0, water.position.y - 0.04); });
      await ctx.focus([0, 0.3, BZC], 2.8, { dist: 17, pitch: 0.65 });
      sink(); bedFloor = 0; water.visible = false;
      ctx.thank('❄️', ['Growers on cold nights', 'Irrigation technicians', 'Mechanics', 'Weather specialists', 'Winter crews']);
      await ctx.wait(1.2);

      // ---------- 5. autumn: the red lake ----------
      let mode = 'rise', boomX = -9, pumpF = 0;
      await ctx.chapter({ n: 3, title: 'Next Autumn: The Red Lake', emoji: '🍂', env: ['autumn', { ground: 0x9db85a }], at: [-4, 2.6], face: Math.PI, setup: () => {
        snowG.visible = false; flowersG.visible = true; sander.visible = false; stripes.forEach(s => { s.visible = false; }); treesAutumn.visible = true; pond.visible = true; vineBerries.visible = true; truck1.visible = true;
        tufts.material.color.set(0x7d8a4c); carpetMat.color.set(0xe8b8a8); waterMat.color.set(C.water); waterMat.opacity = 0.7; water.position.y = 0.03;
        reelM.visible = true; grower.position.set(-7.4, 0, 0.4); grower.rotation.y = 0.9;
      } });
      ctx.bounds(-11.5, -17.6, 12.6, 6.5);
      ctx.say(grower, 'Harvest day! Flood the bed! 🌊', 3.2, { block: false });
      ctx.goal('🌊', 'Open the water gate', gateWheel);
      await use([-9.0, BZC], '🌊', 'Open', { y: 1.9, r: 2.8, sfx: 'water' });
      fact('🌊', 'Growers build each bed so water can flow in and drain out.');
      water.visible = true; const stopLevel = ctx.onUpdate(() => { waterY = water.visible ? water.position.y : 0; });
      ctx.tween(gateWheel.rotation, { x: 9 }, 2.5, 'out'); ctx.tween(gateBoard.position, { y: 1.55 }, 1.2, 'out'); ctx.tween(water.position, { y: 0.33 }, 2.9, 'inOut');
      ctx.tween(tuftG.scale, { y: 0.05 }, 2.9, 'inOut').then(() => { tuftG.visible = false; });   // the vine mounds go under; the leafy carpet still shows through the water
      const gush = ctx.every(0.12, () => ctx.burst([-8.8, 0.5, BZC + (Math.random() - 0.5)], { color: 0xbfe6ff, n: 4, size: 0.2, speed: 2.2, y: 0 })); const gushS = ctx.every(0.5, () => ctx.audio.play('water'));
      await ctx.focus([0, 0.3, BZC], 3.1, { dist: 18, pitch: 0.7 });
      gush(); gushS(); done();

      // the water reel knocks the berries loose; they float up
      berries.mesh.visible = mosaic.mesh.visible = true; let pushing = false, reelSpin = 0, splT = 0; const fwd = new THREE.Vector3();
      const stopBerries = ctx.onUpdate((dt, t) => {
        const p = ctx.player.position, wy = water.position.y;
        if (pushing) { const ry = ctx.player.rotation.y; reelM.position.set(p.x + Math.sin(ry) * 1.15, 0, p.z + Math.cos(ry) * 1.15); reelM.rotation.y = ry; const v = Math.hypot(ctx.vel.x, ctx.vel.z); reelSpin += dt * (2 + v * 2); reelM.userData.reel.rotation.x = reelSpin;
          const rx = p.x + Math.sin(ry) * 1.7, rz = p.z + Math.cos(ry) * 1.7;
          splT += dt; if (v > 1 && splT > 0.14) { splT = 0; ctx.burst([rx + (Math.random() - 0.5) * 2, 0.35, rz + (Math.random() - 0.5)], { color: 0xd8f0ff, n: 5, size: 0.18, speed: 1.6, y: 0 }); }
          for (const c of cells) if (!c.done && Math.hypot(c.x - rx, c.z - rz) < 2.6) { c.done = true; c.t0 = t; ctx.audio.play('splash'); ctx.burst([c.x, 0.4, c.z], { color: 0xe03a4a, n: 10, size: 0.22, speed: 2.5, y: 0 }); } }
        const span = BX - boomX;
        // the carpet: each patch spreads out as its berries come up; once the boom is out it becomes one raft that the boom squeezes and the pump drains
        let allUp = boomX > -BX; const ups = cells.map(c => { const k = c.done ? clamp((t - c.t0) / 1.1, 0, 1) : 0; if (k < 1) allUp = false; return k; });
        cells.forEach((c, i) => mosaic.set(i, c.x, wy + 0.01 + i * 0.0012, c.z, allUp ? 0 : ups[i] * (2 - ups[i]))); mosaic.flush();
        raft.visible = allUp && pumpF < 0.97;
        if (raft.visible) { const m = Math.min(1, pumpF * 1.03), x0 = boomX + 0.3 + (8.5 - boomX - 0.3) * m, x1 = 8.95, zc = BZC + (-8.3 - BZC) * m, d = 11.7 * (1 - 0.9 * m), w = Math.max(0.05, x1 - x0);
          raft.position.set((x0 + x1) / 2, wy + 0.02, zc); raft.scale.set(w, 1, d); raftTex.repeat.set(w / 3, d / 3); raftTex.offset.set(0, -d / 6); }
        for (let i = 0; i < NB; i++) { const b = bp[i], c = b.cell; if (!c.done) { berries.set(i, b.x, -1, b.z, 0); continue; }
          const age = t - c.t0 - b.d; if (age <= 0 || b.rank < pumpF) { berries.set(i, b.x, -1, b.z, 0); continue; }
          const k = Math.min(1, age / 0.7), e = 1 - (1 - k) * (1 - k); let x = boomX > -BX ? boomX + 0.25 + (b.x + BX) / 18 * (span - 0.4) : b.x, z = b.z;
          if (pumpF > 0) { const m = Math.min(0.85, pumpF * 0.9); x += (9 - x) * m * 0.6; z += (-8.3 - z) * m; }
          const dx = x - p.x, dz = z - p.z, d2 = dx * dx + dz * dz; if (d2 < 0.5 && d2 > 1e-4) { const d = Math.sqrt(d2), q = (0.71 - d) / d; x += dx * q; z += dz * q; }
          berries.set(i, x, wy - 0.36 + 0.4 * e + Math.sin(t * 2.1 + b.ph) * 0.018, z, b.s * (0.3 + 0.7 * e)); }
        berries.flush();
      });
      ctx.say(grower, 'Push the egg beater! 🥚', 3, { block: false });
      ctx.goal('🥚', 'Grab the egg beater', reelM);
      await use(reelM, '🥚', 'Push', { y: 2.2, r: 2.8 });
      ctx.tp(reelM.position.x - 1.15, reelM.position.z, Math.PI / 2); ctx.player.position.y = 0; pushing = true; vineBerries.visible = false; ctx.bounds(-8.4, -14.5, 8.4, -3.5); ctx.player.userData.forceAnim = 'carry';
      const hum = ctx.every(0.5, () => ctx.audio.play('engine'));
      stopAim = ctx.onUpdate(() => aim(cells)); aim(cells);
      ctx.goal('🔴', 'Shake the berries loose', nearest);
      await ctx.until(() => cells.filter(c => c.done).length >= 11);
      fact('🔴', "Each berry has four air pockets. That's why it floats!");
      await ctx.until(() => cells.filter(c => c.done).length >= 22);
      { let k = 0; for (const c of cells) if (!c.done) { c.done = true; c.t0 = ctx.time + 0.3 * k++; } }
      stopAim(); hum(); pushing = false; ctx.player.userData.forceAnim = null; vineBerries.visible = false; done();
      ctx.moveAlong(reelM, [[-7.6, -13.7]], 5).then(() => ctx.tween(reelM.rotation, { y: Math.PI / 2 }, 0.5)); const spinOff = ctx.onUpdate((dt) => { reelM.userData.reel.rotation.x += dt * 5; }); ctx.after(5, spinOff);
      ctx.audio.play('success'); ctx.say(grower, 'A red lake! 😍', 2.4, { block: false });
      // corral them with the boom
      boomG.visible = true; boomX = -8.7;
      ctx.goal('💪', 'Grab the boom', boomG);
      await use(boomG, '💪', 'Grab', { y: 1.6, r: 3.2 });
      ctx.goal('💪', 'Pull the boom', [6.6, BZC]);
      const stopBoom = ctx.onUpdate(() => { boomX = clamp(Math.max(boomX, ctx.player.position.x - 0.8), -8.7, 4.8); boomG.position.x = boomX; boomG.position.y = water.position.y + 0.03; });
      const slosh = ctx.every(0.6, () => { if (Math.hypot(ctx.vel.x, ctx.vel.z) > 1) ctx.audio.play('splash'); });
      await ctx.until(() => boomX >= 4.75);
      stopBoom(); slosh(); done(); ctx.bounds(-11.5, -17.6, 12.6, 6.5);
      // pump them up the elevator into the truck
      ctx.goal('🚚', 'Start the pump', [9.6, -6.6]);
      await use([9.9, -6.6], '⚡', 'Start', { y: 1.9, r: 3.0, sfx: 'machine' });
      ctx.goal('🚚', 'Fill the truck'); stream.mesh.visible = true; heap.visible = true;
      const stopStream = ctx.onUpdate((dt, t) => { for (let i = 0; i < NST; i++) { const u = (t * 0.55 + i / NST) % 1; let x, y; if (u < 0.78) { const k = u / 0.78; x = 9.2 + k * 3.7; y = 0.45 + k * 2.55; } else { const k = (u - 0.78) / 0.22; x = 12.9 + k * 0.9; y = 3.0 - k * k * 1.5; } stream.set(i, x, y + 0.12, -8.3 + ((i * 7) % 5 - 2) * 0.16, 1.15); } stream.flush(); });
      const mach = ctx.every(0.5, () => ctx.audio.play('machine'));
      ctx.tween(heap.scale, { x: 1, y: 1, z: 1 }, 4.0, 'linear'); const pf = { f: 0 }; const stopPf = ctx.onUpdate(() => { pumpF = pf.f; }); ctx.tween(pf, { f: 1 }, 4.0, 'linear');
      await ctx.focus([11.5, 1.2, -8.3], 4.2, { dist: 15, pitch: 0.45, yaw: -0.5 });
      stopStream(); stopPf(); mach(); stream.mesh.visible = false; berries.mesh.visible = mosaic.mesh.visible = raft.visible = false; stopBerries(); boomG.visible = false; done();
      ctx.thank('🌊', ['Water crews', 'Reel drivers', 'Boom crews', 'Pump operators', 'Truck drivers']);
      ctx.audio.play('honk'); truckCol.remove(); ctx.moveAlong(truck1, [[14.2, 34]], 8, { ease: 'in' });
      ctx.goal('🚚', 'Off it goes!'); await ctx.wait(1.8); stopLevel(); waterY = 0;

      // ---------- 6. fresh berries: helicopter, bounce test ----------
      ctx.bounds(null);
      await ctx.chapter({ n: 4, title: 'The Bounce Test', emoji: '🚁', env: ['autumn', { ground: 0x9db85a }], at: [XF - 1.5, 3.2], face: Math.PI, music: 'factory', cam: { yaw: 0, pitch: 0.45, dist: 10 }, setup: () => { bogZone.visible = false; stationZone.visible = true; heli.visible = true; } });
      ctx.bounds(XF - 12.5, -11, XF + 13, 6);
      (async () => { for (;;) { await ctx.moveAlong(picker, [[XF - 9.5, -11.5]], 1.5); await ctx.moveAlong(picker, [[XF - 19, -11.5]], 1.5); } })();
      const spin = ctx.onUpdate((dt) => { heli.userData.rotor.rotation.y += dt * 22; heli.userData.tail.rotation.x += dt * 30; });
      const chop = ctx.every(0.16, () => ctx.audio.play('step'));
      ctx.goal('🚁', 'Look up!'); ctx.lock(); ctx.cam.target = { at: heli, dist: 19, pitch: 0.25, yaw: 0.35 };
      await ctx.moveAlong(heli, [[XF - 8.5, 9.5, -1.5]], 11, { ease: 'out' });
      await ctx.tween(heli.position, { y: 5.5 }, 1.2, 'inOut');
      heli.remove(binF); binF.position.set(XF - 8.5, 0, -1.5); ctx.add(binF); ctx.audio.play('thud'); ctx.burst([XF - 8.5, 0.2, -1.5], { color: 0xd9d4c6, n: 14, speed: 3, size: 0.3 }); rope.visible = false;
      fact('🚁', 'Some Massachusetts growers fly berry bins by helicopter!');
      await ctx.tween(heli.position, { y: 10 }, 1.0, 'in'); ctx.cam.target = null; ctx.unlock();
      ctx.moveAlong(heli, [[XF + 40, 24, -40]], 13).then(() => { spin(); chop(); heli.visible = false; });
      ctx.say(grader, 'Fresh ones! Bring them here 👋', 3, { block: false }); grader.userData.anim = 'wave';
      ctx.goal('📦', 'Grab the bin', binF);
      await use(binF, '📦', 'Lift', { y: 1.6, r: 2.8 });
      binF.scale.setScalar(0.65); ctx.carry(binF, { y: -0.44 }); binF.position.z = 0.23; grader.userData.anim = 'idle';   // in front of the body, hands on its near rim
      ctx.goal('🔴', 'Do the bounce test', [XF + BMX, BMZ + 1.6]);
      await use([XF + BMX, BMZ + 1.2], '🔴', 'Test', { y: 2, r: 2.8 });
      ctx.remove(ctx.drop()); ctx.say(grader, 'Firm berries bounce! 🏀', 2.5, { block: false });
      await ctx.wait(0.5);
      await bounceGame(ctx);
      done(); fresh.visible = true; ctx.tween(fresh.scale, { x: 1.5, y: 1.5, z: 1.5 }, 0.5, 'outBack'); ctx.audio.play('pop');
      ctx.thank('🚁', ['Dry-harvest crews', 'Grading workers', 'Helicopter pilots', 'Fresh-fruit packers']);
      ctx.say(grader, 'Packed! Off to the shops 🚚', 2.6, { block: false });
      fact('📦', 'Berries sold fresh are combed from dry vines — no flooding!'); const dryT = ctx.time;
      ctx.goal('🚚', 'Hop in the truck', [XF + 8.6, 0.1]);
      await ctx.wait(0.5); await ctx.tween(fresh.position, { y: 2.6 }, 0.25, 'out'); ctx.tween(fresh.position, { x: XF + 8.2, z: -2.2 }, 0.45); await ctx.tween(fresh.position, { y: 3.2 }, 0.22, 'out'); await ctx.tween(fresh.position, { y: 1.6 }, 0.23, 'in'); ctx.audio.play('thud'); ctx.remove(fresh);
      await use(truck2, '🚚', 'Hop in', { y: 3, r: 4.2 });
      done();
      ctx.lock(); ctx.player.visible = false; ctx.audio.play('honk'); ctx.bounds(null); ctx.moveAlong(truck2, [[XF + 45, -2.2]], 9); await ctx.wait(1.5);

      // ---------- 7. the market: one berry, many foods ----------
      await ctx.chapter({ n: 5, title: 'The Market', emoji: '🛒', env: ['indoor', { ground: 0xd9d4c6, top: '#e9e4d6', bottom: '#f6f2e8', fog: false }], at: [XM + 9.5, 1.5], face: -Math.PI / 2, music: 'town', cam: { yaw: 0, pitch: 0.5, dist: 10.5 }, setup: () => { stationZone.visible = false; marketZone.visible = true; } });
      ctx.player.visible = true; ctx.unlock(); ctx.bounds(XM - 12, -11.3, XM + 11.2, 4.6);
      (async () => { for (;;) { await ctx.moveAlong(shopper, [[XM - 10, -10.4]], 1.4); await ctx.wait(1.5); await ctx.moveAlong(shopper, [[XM + 4, -10.4]], 1.4); await ctx.wait(1.5); } })();
      ctx.carry(basket, { y: -0.3 }); basket.position.z = 0.25; let found = 0;   // held by its near rim
      const gList = goods.map(o => ({ x: o.position.x, z: o.position.z, done: false, o })); stopAim = ctx.onUpdate(() => aim(gList)); aim(gList);
      ctx.goal('🔎', 'Find 4 cranberry foods', nearest); let juiceSaid = false; const juiceFact = () => { if (juiceSaid) return; juiceSaid = true; fact('🍹', 'Juice makers can take the water out, then add it back later!'); };
      await ctx.collect({ items: goods, r: 1.45, color: RED, onEach: (o) => {
        gList.find(g => g.o === o).done = true; ctx.remove(o.userData.label); const mini = product(o.userData.kind); mini.scale.setScalar(0.55); mini.position.set(-0.24 + (found % 4) * 0.16, 0.03, found % 2 ? 0.1 : -0.1); basket.add(mini); found++; ctx.emote(ctx.player, '✨'); if (o.userData.kind === 'juice' && ctx.time - dryT > 8) juiceFact();
        if (found < 4) ctx.goal('🔎', (4 - found) + ' more to find', nearest);
      } });
      stopAim(); done(); juiceFact();
      ctx.thank('🏭', ['Juice makers', 'Jam makers', 'Drying crews', 'Can makers']);
      ctx.goal('🔴', 'Pick fresh berries', [XM - 8.7, -3.2]);
      await use(freshBag, '🔴', 'Take', { y: 0.9, r: 2.6 });
      ctx.scene.remove(freshBag); freshBag.scale.setScalar(0.6); freshBag.rotation.set(0, 0, 0); freshBag.position.set(0.2, 0.25, 0); basket.add(freshBag); ctx.audio.play('pickup');
      ctx.goal('💵', 'Pay the cashier', [XM - 5.5, 3.2]);
      await use(cashier, '💵', 'Pay', { r: 3.1, y: 2.35 });
      ctx.audio.play('register'); await ctx.say(cashier, 'Happy Thanksgiving! ❤️', 2.4); done(); await ctx.wait(0.8);
      ctx.thank('🛒', ['Forklift operators', 'Truck drivers', 'Stockers', 'Cashiers']);
      await ctx.wait(1.0);

      // ---------- 8. the kitchen: burst, thicken, sieve, chill ----------
      ctx.bounds(null);
      const bag = product('fresh');
      await ctx.chapter({ n: 6, title: 'Home Kitchen', emoji: '🏡', env: ['indoor', { ground: 0xb98a5e, top: '#f3dfb8', bottom: '#f8ead0', fog: false }], at: [XK - 5, -3.6], face: Math.PI / 2, music: 'table', cam: { yaw: 0, pitch: 0.45, dist: 8.5 }, setup: () => { marketZone.visible = false; kitchenZone.visible = true; ctx.remove(ctx.drop()); ctx.carry(bag, { y: -0.3 }); } });
      ctx.bounds(XK - 7.3, -6.2, XK + 7.3, 3.4);
      ctx.say(grandpa, "Let's make the sauce! 😊", 3, { block: false });
      ctx.goal('🔴', 'Pour in the berries', [XK + 1.5, -5.6]);
      await use(pot, '🔴', 'Pour', { y: 1.0, r: 2.5 });
      ctx.remove(ctx.drop()); const PX = XK + 1.5, PZ = -7.1;
      for (let i = 0; i < 9; i++) { const b = sphere(0.09, i % 3 ? RED : RED3, [ctx.player.position.x, 1.5, ctx.player.position.z - 0.4], 5); ctx.add(b); ctx.tween(b.position, { x: PX + (i % 3 - 1) * 0.15, z: PZ + (i % 2) * 0.1 }, 0.45); ctx.tween(b.position, { y: 2.3 }, 0.22, 'out').then(() => ctx.tween(b.position, { y: 1.5 }, 0.23, 'in')).then(() => { ctx.audio.play('splash'); ctx.remove(b); }); await ctx.wait(0.09); }
      potFill.material.color.set(0xd9607a); ctx.emote(pot, '💧', { y: 1.2 }); await ctx.wait(0.5); ctx.burst([PX, 2.1, PZ], { color: 0xffffff, n: 10, size: 0.12, speed: 0.6, y: 0 }); ctx.audio.play('pour'); ctx.say(grandpa, 'Water and sugar go in too! 💧', 2.6, { block: false });
      const steam = ctx.every(0.3, () => { ctx.burst([PX, 1.75, PZ], { color: 0xffffff, n: 2, speed: 0.3, size: 0.25, y: 0 }); ctx.audio.play('bubble'); });
      ctx.goal('🥄', 'Stir till they pop', [XK + 1.5, -5.6]);
      await use(pot, '🥄', 'Stir', { hold: 1.5, sfx: 'bubble', y: 1.0, r: 2.5 });
      await simmerGame(ctx);   // keep the heat in the simmer band until the berries pop (a hold-and-release game)
      ctx.lock(); ctx.player.userData.forceAnim = 'work'; fact('🥄', 'Bursting berries let out pectin. It makes the sauce thick!'); ctx.tween(potFill.material.color, { r: 0.62, g: 0.03, b: 0.1 }, 2.2); ctx.tween(potFill.position, { y: 0.4 }, 2.2);
      for (let i = 0; i < 9; i++) { ctx.audio.play(i % 3 ? 'pop' : 'cork'); ctx.burst([PX + (Math.random() - 0.5) * 0.5, 1.7, PZ + (Math.random() - 0.5) * 0.3], { color: i % 2 ? RED : RED3, n: 5, size: 0.16, speed: 1.4, y: 0 }); ctx.cam.shake = 0.04; await ctx.wait(0.19); }
      ctx.player.userData.forceAnim = null; ctx.unlock(); done();
      ctx.thank('🥄', ['Recipe developers', 'Food scientists', 'Quality checkers', 'Home cooks']);
      ctx.say(grandpa, 'Pop, pop! Now sieve it smooth 😋', 3, { block: false });
      ctx.goal('🍲', 'Sieve out the skins', [XK + SVX, -5.6]);
      await use(sieve, '🍲', 'Press', { hold: 1.2, sfx: 'pour', y: 0.9, r: 2.5 });
      steam(); ctx.lock(); const SX = XK + SVX;
      await ctx.tween(pot.position, { x: SX + 0.75, y: 2.0 }, 0.6); await ctx.tween(pot.rotation, { z: 1.1 }, 0.4);
      const pourS = cyl(0.09, 0.06, 0.6, RED, [SX + 0.1, 1.85, PZ], null, 6); ctx.add(pourS); bowlFill.visible = true; ctx.tween(bowlFill.scale, { x: 1, y: 1, z: 1 }, 1.6); ctx.tween(potFill.scale, { x: 0.5, z: 0.5 }, 1.6);
      const drip = ctx.every(0.2, () => { ctx.audio.play('pour'); ctx.burst([SX, 1.45, PZ], { color: RED2, n: 3, size: 0.1, speed: 0.4, y: 0 }); });
      await ctx.wait(1.7); drip(); ctx.remove(pourS); potFill.visible = false;
      const skins = group([0, 1, 2, 3, 4, 5].map(i => ball(0.07, 0.03, 0.05, 0x6d1020, [Math.cos(i) * 0.2, 0.02 + (i % 2) * 0.03, Math.sin(i * 2) * 0.18], [0, i, 0], 5)), [SX, 1.42, PZ]); bake(skins); ctx.add(skins);
      ctx.tween(pot.rotation, { z: 0 }, 0.3); await ctx.tween(pot.position, { x: PX, y: 1.16 }, 0.5); ctx.unlock(); done();
      // chill → it sets into a wobbly jelly
      const mold = group([lathe([[0, 0], [0.3, 0.02], [0.38, 0.36], [0.4, 0.4]], 0xc9a26b), cyl(0.36, 0.28, 0.3, RED, [0, 0.2, 0], null, 12)]); bake(mold); ctx.remove(bowlFill); mold.scale.setScalar(0.01); ctx.carry(mold, { y: -0.2 }); mold.position.z = 0.02; ctx.tween(mold.scale, { x: 0.7, y: 0.7, z: 0.7 }, 0.4, 'outBack');   // a bowl that fits between the two hands, held by its rim
      const fridge = [XK + 6.2, -6.3], fridgeAt = [XK + 6.2, -5.5];
      ctx.say(grandpa, 'It sets as it cools ❄️', 3, { block: false });
      ctx.goal('❄️', 'Chill it', fridgeAt);
      await use(fridge, '❄️', 'Chill', { y: 2.2, r: 2.6 });
      ctx.remove(ctx.drop()); ctx.lock(); ctx.audio.play('thud');
      for (let i = 0; i < 3; i++) { ctx.emote([XK + 6.2, 1.6, -6.3], i === 2 ? '⏰' : '❄️', { y: 0.6 }); ctx.audio.play('sparkle'); await ctx.wait(0.45); }
      const dish = group([cyl(0.5, 0.36, 0.06, 0xfafafa, [0, 0.03, 0], null, 14), cyl(0.52, 0.52, 0.02, 0xe8b63a, [0, 0.065, 0], null, 14)]); bake(dish); const jel = jelly(); jel.position.y = 0.07; jel.userData.noBake = true; dish.add(jel);
      dish.scale.setScalar(0.01); ctx.carry(dish, { y: -0.05 }); dish.position.z = 0.3; ctx.audio.play('boing');   // the plate is held by its near rim, the jelly out in front below the chin
      await ctx.tween(dish.scale, { x: 0.85, y: 0.85, z: 0.85 }, 0.5, 'outBack'); ctx.unlock();
      const wob = ctx.onUpdate((dt, t) => { const v = Math.min(1, Math.hypot(ctx.vel.x, ctx.vel.z) / 4); jel.scale.set(1 + Math.sin(t * 11) * 0.035 * (0.4 + v), 1 - Math.sin(t * 11) * 0.05 * (0.4 + v), 1 + Math.cos(t * 11) * 0.035 * (0.4 + v)); jel.rotation.z = Math.sin(t * 9) * 0.04 * (0.3 + v); });
      done(); ctx.goal('🦃', 'To the table!'); ctx.lock();
      grandpa.position.set(XK + 6.7, 0, -3.4); grandpa.rotation.y = -2.4; grandpa.userData.anim = 'cheer'; ctx.say(grandpa, 'To the table! 🦃', 2.6, { block: false });
      const hy = -Math.PI / 2 - 0.15; ctx.player.rotation.y = hy; ctx.audio.play('sparkle'); ctx.cam.target = { at: [ctx.player.position.x, 1.0, ctx.player.position.z], dist: 4.8, pitch: 0.24, yaw: hy };
      await ctx.wait(2.6); ctx.cam.target = null; ctx.unlock();
      ctx.finish();
    });
  },
};
