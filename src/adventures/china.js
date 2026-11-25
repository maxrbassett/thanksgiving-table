// The China Plates — from an ancient Chinese kiln to the plate under your turkey.
// China (long ago) → Meissen's kaolin mine → clay works → steam & the 280-bar press → design studio → glaze & kiln.
import { THREE, C, mat, glow, box, cyl, cone, sphere, ball, torus, group, bake, sign, seeded, lerp } from '../core/kit.js';
import * as P from '../core/props.js';
import * as Z from './china-zones.js';
import * as Z2 from './china-zones2.js';
import { makePlate, openDesigner, drawOps } from './china-plate.js';
import { stokeGame, stonesGame, lineUpGame } from './china-games.js';

const PI = Math.PI;

export default {
  id: 'china', title: 'The China Plates', emoji: '🍽️', music: 'old',
  question: 'How is a china plate made?',
  thanksLine: 'From pale clay to a shining plate — look who helped!',

  create(ctx) {
    const X1 = 0, X2 = 150, X3 = 300, X4 = 450, X5 = 600, X6 = 750;
    const DAWN = { ground: 0x8fb86a };
    ctx.env('dawn', DAWN);
    // Each zone's own things are drawn only while the player is in that zone: the zones are 150 m apart, but a camera turned along X could still see the others.
    // (They are moved to a layer the camera does not draw, so what the story itself shows and hides is left alone.)
    const zoneObjs = [[], [], [], [], [], []], known = new Set(ctx.scene.children);
    const zoneDone = (k) => { for (const c of ctx.scene.children) if (!known.has(c)) { known.add(c); zoneObjs[k].push(c); } };
    const showZone = (n) => zoneObjs.forEach((list, i) => { for (const o of list) o.traverse(c => c.layers.set(i === n ? 0 : 1)); });

    // ---------------- 1 · China, long ago ----------------
    const z1 = Z.zoneChina(ctx, X1);
    const master = ctx.person({ skin: C.skin[0], hair: 0x1c1c1c, hairStyle: 'bun', shirt: 0x3a5f9c, dress: 0x34558c, beard: 0xeeeeee, shoes: 0x222222, expressive: true }, X1 - 7.6, -5.6, 0.75);
    const potter = ctx.person({ skin: C.skin[1], hair: 0x1c1c1c, hairStyle: 'bun', shirt: 0xc9a26b, pants: 0x6b4a2f, apron: 0x8a6a4a }, X1 - 11.8, -7.1, 0); potter.userData.anim = 'work'; potter.position.y = 0.3; // stands on the pavilion floor, hands at the wheel
    ctx.onUpdate((dt) => { z1.wheel.rotation.y += dt * 5; z1.koi.rotation.y += dt * 0.5; });
    const logs = z1.logSpots.map(([x, z], i) => { const l = Z.logBundle(); l.rotation.y = i * 1.3; return ctx.add(l, x, z); });
    const vaseBody = Z.own(Z.fineVase(1.1), 0xfafafa, { double: true });
    const vaseObj = group([vaseBody, Z.dyn(group([cyl(0.337, 0.337, 0.06, 0x2a5cab, [0, 0.42, 0], null, 20), cyl(0.14, 0.14, 0.05, 0x2a5cab, [0, 0.81, 0], null, 20), cyl(0.262, 0.235, 0.05, 0x2a5cab, [0, 0.13, 0], null, 20)]))]);
    zoneDone(0); zoneObjs[0].push(vaseObj);

    // ---------------- 2 · the kaolin mine ----------------
    const z2 = Z.zoneMine(ctx, X2);
    const minerA = ctx.person({ skin: C.skin[2], hair: C.hair[0], beard: C.hair[0], shirt: 0x6a7f94, pants: 0x4a4a55, hat: 'hardhat', hatColor: 0xf2c43d, vest: 0x8a6a4a }, X2 + 13.4, -8.1, PI); minerA.userData.anim = 'dig'; minerA.userData.hand.add(Z.pickaxe());
    const minerB = ctx.person({ skin: C.skin[4], hair: C.hair[2], shirt: 0xb5654a, pants: 0x3b4a5c, hat: 'hardhat', hatColor: 0xf2c43d, expressive: true }, X2 - 9.2, -1.6, 0.9);
    zoneDone(1);

    // ---------------- 3 · the clay works ----------------
    const z3 = Z2.zoneClay(ctx, X3);
    const washer = ctx.person({ hat: 'cap', hatColor: 0x5a6a7a, shirt: 0x4f7d9c, pants: 0x4a4038, apron: 0xd9cba6, skin: C.skin[1], hair: C.hair[2], expressive: true }, X3 - 3.2, -2.4, -0.5);
    const blender = ctx.person({ hairStyle: 'bun', hair: C.hair[3], shirt: 0xb5553f, pants: 0x4a4a55, apron: 0xf3ead6, skin: C.skin[4], expressive: true }, X3 + 16.4, -2.6, -0.9);
    zoneDone(2);

    // ---------------- 4 · steam power (1802) and the press (today) ----------------
    const z4 = Z2.zoneMachines(ctx, X4);
    const thrower = ctx.person({ hat: 'cap', hatColor: 0x4a3a2a, vest: 0x6e4a28, shirt: 0xf3ead6, pants: 0x4a4038, apron: 0xb9a58a, beard: C.hair[2], hair: C.hair[2], skin: C.skin[0], expressive: true }, X4 - 4.4, -6.6, PI / 2);
    const operator = ctx.person({ hairStyle: 'pony', hair: C.hair[0], glasses: true, shirt: 0xffffff, pants: C.navy, hat: 'cap', hatColor: 0x2f6d9c, skin: C.skin[3], expressive: true }, X4 + 5.2, -5.4, 0.5);
    ctx.collideBox(X4, -9.7, 0.8, 6.3);
    zoneDone(3);

    // ---------------- 5 · the design studio ----------------
    const z5 = Z2.zoneStudio(ctx, X5);
    const designer = ctx.person({ glasses: true, hairStyle: 'bun', hair: 0x1c1c1c, shirt: 0x7b4fb0, pants: C.navy, skin: C.skin[1], expressive: true }, X5 - 8.8, -6.3, 0.8);
    const printer = ctx.person({ apron: 0x2f2f3a, shirt: 0xd9483b, pants: 0x4a4a55, hairStyle: 'curly', hair: C.hair[0], skin: C.skin[3], expressive: true }, X5 + 3.2, -8.75, 0);
    const painter = ctx.person({ hairStyle: 'long', hair: C.hair[6], shirt: C.pink, apron: C.white, pants: 0x4a4a55, skin: C.skin[4] }, X5 + 9.4, -9.15, 0); painter.userData.anim = 'sew';
    zoneDone(4);

    // ---------------- 6 · glaze and the kiln ----------------
    const z6 = Z2.zoneKiln(ctx, X6);
    const glazer = ctx.person({ hat: 'hairnet', apron: 0xffffff, shirt: 0x9fd0e8, pants: C.navy, skin: C.skin[5], hair: C.hair[1], expressive: true }, X6 - 11.9, -5.4, 0.8);
    const kilnWorker = ctx.person({ hat: 'hardhat', hatColor: C.orange, vest: 0xff8a1f, shirt: 0x3f7fd1, pants: 0x4a4a55, skin: C.skin[2], hair: C.hair[0], beard: C.hair[0], expressive: true }, X6 + 1.0, -3.2, -0.5);
    zoneDone(5); showZone(0);

    // ---------------- the plate (its picture is painted by the player in chapter 5) ----------------
    const plate = makePlate(0.42), plateRoot = group([plate.obj]); let ops = [];
    // carried things rest on the player's forward-pointing arms, clear of the chest and below the face (the arms' top is ~0.1 above the carry point)
    const hold = (o, y = 0, z = 0) => { ctx.carry(o); o.position.set(0, y, z); return o; };
    // with a wide thing in their arms the player turns their back to the table / machine it came from, so it is not held into the furniture
    const turnFrom = async (p) => { const P = ctx.player, a = Math.atan2(P.position.x - p[0], P.position.z - p[p.length - 1]), d = Math.atan2(Math.sin(a - P.rotation.y), Math.cos(a - P.rotation.y)); ctx.lock(); await ctx.tween(P.rotation, { y: P.rotation.y + d }, 0.35, 'inOut'); ctx.unlock(); };
    const carryPlate = () => { plate.obj.rotation.set(0.6, 0, 0); plate.obj.position.set(0, 0.02, 0.13); ctx.carry(plateRoot); };
    const placePlate = (p) => { ctx.drop(); plate.obj.rotation.set(0, 0, 0); plate.obj.position.set(0, 0, 0); plateRoot.position.set(p[0], p[1], p[2]); plateRoot.rotation.set(0, 0, 0); ctx.add(plateRoot); };
    const paper = (w, tint) => { const c = document.createElement('canvas'); c.width = c.height = 256; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); return { mesh, draw(o) { const g2 = c.getContext('2d'); g2.fillStyle = tint; g2.fillRect(0, 0, 256, 256); g2.strokeStyle = 'rgba(74,44,23,.25)'; g2.lineWidth = 2; g2.beginPath(); g2.arc(128, 128, 122, 0, 7); g2.stroke(); drawOps(g2, 256, o); t.needsUpdate = true; } }; };
    const sketch = paper(1.05, '#fffdf4'), transfer = paper(0.9, '#f3ecd8'); zoneObjs[4].push(sketch.mesh);

    // test hook: each game can be opened on its own (the play script and ad-hoc checks use this)
    ctx.chinaDebug = Object.assign(ctx.chinaDebug || {}, { games: { stoke: (f) => stokeGame(ctx, f), stones: () => stonesGame(ctx), line: (o) => lineUpGame(ctx, o || [{ k: 'ring', c: '#1f4fa8', r: 0.95, a: 0 }, { k: 'flower', c: '#c0392b', r: 0.8, a: 0 }, { k: 'star', c: '#1f4fa8', r: 0, a: 0 }]) } });

    // =================== THE STORY ===================
    ctx.onStart(async () => {
      const TOTAL = 15; let step = 0; const done = () => ctx.progress(++step, TOTAL); ctx.progress(0, TOTAL);
      const use = (o) => new Promise(res => ctx.interact(Object.assign({ onUse: res }, o)));
      const enter = (x, z, r = 1.6) => new Promise(res => ctx.zone({ x, z, r, onEnter: res }));
      const hop = (o, to, h = 1.2, sec = 0.5) => { const y0 = o.position.y; ctx.tween(o.position, { x: to[0], z: to[2] }, sec, 'linear'); return ctx.tween(o.position, { y: Math.max(y0, to[1]) + h }, sec / 2, 'out').then(() => ctx.tween(o.position, { y: to[1] }, sec / 2, 'in')); };

      // ===== 1. China, long ago: gather wood, fire the dragon kiln =====
      ctx.bounds(X1 - 16.5, -11.2, X1 + 14.2, 4.6);
      ctx.banner('🐉', 'China, long ago', 2.4);
      ctx.say(master, 'Our dragon kiln is hungry! 🔥', 3.5);
      const stack = new THREE.Group(); let got = 0; const left = logs.slice();
      const near = () => left.slice().sort((a, b) => a.position.distanceTo(ctx.player.position) - b.position.distanceTo(ctx.player.position))[0];
      ctx.goal('🌲', 'Gather firewood', near());
      await ctx.collect({ items: logs, r: 1.3, color: 0x9a6b3b, onEach: (o, n) => {
        left.splice(left.indexOf(o), 1); got++;
        const [ly, lz] = [[0.13, 0.05], [0.13, -0.12], [0.13, 0.22], [0.277, -0.035], [0.277, 0.135]][got - 1]; // three logs across the arms, two on top
        stack.add(cyl(0.085, 0.085, 0.8, got % 2 ? 0x8a5a2b : 0x9a6b3b, [0, ly, lz], [0, 0, PI / 2], 6));
        if (got === 1) ctx.carry(stack); if (n) ctx.goal('🌲', n + ' more', near());
      } });
      done();
      const mouthAt = [z1.mouthPos[0], z1.mouthPos[2]];
      ctx.say(master, 'Feed the fire! 🔥', 2.5);
      ctx.goal('🔥', 'Feed the dragon kiln', mouthAt);
      await use({ at: mouthAt, icon: '🔥', label: 'Feed', hold: 0.9, r: 2.9, y: 1.7, sfx: 'thud' });
      ctx.lock(); ctx.remove(ctx.drop());
      ctx.fact('🔥', 'Chinese makers found the secret: the right clay and very hot fire.');
      for (let i = 0; i < 4; i++) { const l = cyl(0.1, 0.1, 0.8, 0x8a5a2b, [ctx.player.position.x, 1.2, ctx.player.position.z], [0, 0.5, PI / 2], 6); ctx.add(l); hop(l, z1.mouthPos, 0.6, 0.35).then(() => { ctx.remove(l); ctx.burst(z1.mouthPos, { color: 0xff9a30, n: 8, size: 0.2, speed: 1.5, y: 0 }); ctx.audio.play('fire'); }); await ctx.wait(0.2); }
      await ctx.wait(0.3); z1.mouthFire.visible = true;
      ctx.cam.target = { at: z1.kilnPt(6.5, 1.5), dist: 20, pitch: 0.36, yaw: 0.2 };
      const flick = ctx.onUpdate((dt, t) => { z1.fires.forEach((f, i) => { f.scale.y = 0.8 + 0.25 * Math.sin(t * 13 + i * 2); }); z1.mouthFire.scale.y = 0.85 + 0.15 * Math.sin(t * 15); });
      // game: the stoke holes along the dragon's side are fed one after another as the fire climbs (each one lights its 3D flame behind the panel)
      ctx.say(master, 'Feed each hole as the fire climbs! 🔥', 3.2);
      await stokeGame(ctx, (i) => { z1.fires[i].visible = true; ctx.burst(z1.kilnPt(0.95 + i * 1.85, 1.0), { color: 0xff9a30, n: 7, size: 0.2, speed: 1.4, y: 0 }); });
      ctx.fact('🐉', 'A dragon kiln is fed through side holes, bottom to top.');
      const smoke = ctx.every(0.22, () => ctx.burst(z1.kilnPt(15.3, 3.4), { color: 0xe8e4dc, n: 3, speed: 0.7, size: 0.55, y: 0 }));
      ctx.audio.play('kiln'); master.userData.anim = 'cheer';
      await ctx.wait(0.9); ctx.env('sunset', { ground: 0x86a858 }); await ctx.wait(1.3); ctx.env('night', { ground: 0x3f5a46 }); ctx.audio.play('kiln'); await ctx.wait(1.7); ctx.env('dawn', DAWN); await ctx.wait(0.9);
      flick(); smoke(); z1.fires.forEach(f => { f.visible = false; }); z1.mouthFire.visible = false; master.userData.anim = 'idle';
      ctx.cam.target = null;
      vaseObj.position.set(...z1.pedestal); vaseObj.scale.setScalar(0.01); ctx.add(vaseObj); ctx.audio.play('sparkle'); ctx.burst(z1.pedestal, { color: 0xffffff, n: 14, size: 0.16 });
      await ctx.tween(vaseObj.scale, { x: 1, y: 1, z: 1 }, 0.6, 'outBack');
      ctx.unlock(); done();
      ctx.say(master, 'Look — porcelain! 🏺', 3);
      ctx.goal('☀️', 'Lift to the light', vaseObj);
      await use({ at: vaseObj, icon: '☀️', label: 'Lift', r: 2.7, y: 1.5 });
      // the player holds the vase up in front of the face with both arms and looks up at it (the arms are too short to lift it over the big head)
      ctx.lock(); hold(vaseObj, 0.1, 0.25); ctx.tween(vaseObj.position, { y: 0.36 }, 0.6, 'out');
      const pu = ctx.player.userData, up = { k: 0 }, liftPose = new THREE.Group(); liftPose.userData.tick = () => { for (const [a, s] of [[pu.armL, 1], [pu.armR, -1]]) a.rotation.set(lerp(a.rotation.x, -1.95, up.k), 0, lerp(a.rotation.z, s * 0.29, up.k)); };
      ctx.animate(liftPose); ctx.tween(up, { k: 1 }, 0.6, 'out'); pu.lookAt = new THREE.Vector3(ctx.player.position.x + Math.sin(ctx.player.rotation.y) * 3, 8, ctx.player.position.z + Math.cos(ctx.player.rotation.y) * 3);
      ctx.tween(vaseBody.material.emissive, { r: 0.95, g: 0.7, b: 0.3 }, 0.9); ctx.audio.play('sparkle'); ctx.burst(ctx.player, { color: 0xfff0b0, n: 16, size: 0.14, y: 2.4, speed: 1.5 });
      ctx.fact('🏺', 'Porcelain was born in China, centuries before Europe made it.');
      await ctx.say(master, 'White, strong… light shines through! ✨', 3.4);
      pu.lookAt = null; ctx.tween(up, { k: 0 }, 0.4); await ctx.tween(vaseBody.material.emissive, { r: 0, g: 0, b: 0 }, 0.4);
      ctx.remove(liftPose); ctx.drop(); vaseObj.position.set(...z1.pedestal); ctx.add(vaseObj); ctx.unlock(); done();
      ctx.thank('🏺', ['Chinese potters', 'Kiln teams', 'Generations of inventors']);
      z1.portal.visible = true; z1.gateBlock.remove(); const spin = ctx.onUpdate((dt, t) => { z1.portal.material.opacity = 0.45 + 0.2 * Math.sin(t * 4); z1.portal.scale.setScalar(0.96 + 0.04 * Math.sin(t * 6)); });
      ctx.goal('🌀', 'Step through time', z1.gate);
      await enter(z1.gate[0], z1.gate[1], 1.5);
      ctx.audio.play('whoosh'); spin(); ctx.bounds(null); ctx.goal(null); ctx.goal(null);

      // ===== 2. Meissen's kaolin mine: dig, then ride the cart =====
      await ctx.chapter({ n: 2, title: 'Meissen, Germany', emoji: '⛏️', env: ['indoor', { ground: 0x5a4836, top: '#17110d', bottom: '#3a2b1f', fog: [32, 80] }], at: [X2 - 13, 0.8], face: PI / 2, cam: { yaw: 0, pitch: 0.42, dist: 10 }, setup: () => showZone(1) });
      ctx.bounds(X2 - 19.6, -8.2, X2 + 22.4, 4.2);
      const pick = Z.pickaxe(); ctx.player.userData.hand.add(pick);
      ctx.fact('🏰', '1710: Meissen brings hard-paste porcelain making to Europe.');
      ctx.say(minerB, 'Two of us dig this white clay! ⛏️', 3.6);
      let dug = 0, landed = 0; const seamsLeft = z2.seams.slice(), load = z2.cart.userData.load;
      const nearSeam = () => seamsLeft.slice().sort((a, b) => a.position.distanceTo(ctx.player.position) - b.position.distanceTo(ctx.player.position))[0];
      ctx.goal('⛏️', 'Dig white clay', nearSeam());
      for (const s of z2.seams) ctx.interact({ at: s, icon: '⛏️', label: 'Dig', hold: 0.9, r: 2.8, y: 2.4, sfx: 'dig', onUse: async () => {
        dug++; seamsLeft.splice(seamsLeft.indexOf(s), 1); if (dug < 3) ctx.goal('⛏️', (3 - dug) + ' more', nearSeam());
        ctx.act('dig', 1.0); ctx.tween(s.scale, { x: 0.7, y: 0.45, z: 0.7 }, 1.0);
        for (let k = 0; k < 3; k++) {
          await ctx.wait(0.3); ctx.audio.play('dig'); ctx.burst([s.position.x, 1.2, s.position.z + 0.6], { color: 0xffffff, n: 8, size: 0.16, speed: 2, y: 0 });
          const c = Z.clayLump(1.4); c.position.set(s.position.x, 1.3, s.position.z + 0.8); ctx.add(c); const n = landed + k;
          hop(c, [z2.cart.position.x - 0.5 + (n % 3) * 0.22, 1.0, z2.cart.position.z], 1.6, 0.6).then(() => { ctx.remove(c); const l = Z.clayLump(1.25); l.position.set((landed % 3 - 1) * 0.27, 0.72 + Math.floor(landed / 3) * 0.2, -0.6 + (landed % 2) * 0.25 + Math.floor(landed / 3) * 0.06); l.rotation.y = landed; load.add(l); landed++; ctx.audio.play('thud'); });
        }
      } });
      await ctx.until(() => dug >= 3 && landed >= 9);
      done();
      ctx.fact('⚪', 'Kaolin, this pale clay, is what makes a plate white.');
      ctx.say(minerB, 'Hop in — hold on tight! 🎢', 3);
      ctx.goal('🚃', 'Ride the cart', z2.cart);
      await use({ at: [z2.cart.position.x, z2.cart.position.z + 1.1], icon: '🚃', label: 'Hop in', r: 2.4, y: 2.0 });
      z2.cartCol.remove(); ctx.player.userData.hand.remove(pick); minerB.userData.anim = 'wave';
      const rattle = ctx.every(0.22, () => { ctx.audio.play('clink'); ctx.burst([z2.cart.position.x - 0.7, 0.2, -4.45], { color: 0xffc040, n: 3, size: 0.1, speed: 1.5, y: 0 }); ctx.cam.shake = 0.05; });
      await ctx.ride(z2.cart, [[X2 + 22.6, -4]], { speed: 6.5, hide: false, sfx: 'thud' });
      rattle(); done(); ctx.bounds(null); ctx.goal(null); ctx.goal(null);

      // ===== 3. The clay works: wash, let it settle, blend =====
      await ctx.chapter({ n: 3, title: 'The Clay Works', emoji: '💧', env: 'day', at: [X3 - 13, 1.6], face: PI / 2, cam: { yaw: 0, pitch: 0.46, dist: 10.5 }, setup: () => showZone(2) });
      ctx.bounds(X3 - 17.5, -9.1, X3 + 17.8, 4.2);
      ctx.goal('💧', 'Turn on the water', z3.valve); ctx.lock();
      ctx.audio.play('clink'); await ctx.tween(z3.cart.position, { x: X3 - 10.2 }, 1.6, 'out'); ctx.audio.play('thud');
      const inTrough = [], v3 = new THREE.Vector3(), cl = z3.cart.userData.load;
      for (const [i, l] of cl.children.slice().entries()) { l.getWorldPosition(v3); cl.remove(l); l.position.copy(v3); ctx.add(l); inTrough.push(l); hop(l, [z3.trough[0] - 1.8 + i * 0.45, 1.08, z3.trough[1] + (i % 2 ? 0.35 : -0.35)], 1.6, 0.6).then(() => { ctx.audio.play('splash'); ctx.burst(l.position, { color: 0x8a6a48, n: 5, size: 0.14, speed: 1.2, y: 0 }); }); await ctx.wait(0.12); }
      ctx.unlock(); ctx.say(washer, 'Phew, what muddy clay! 💧', 3.2);
      await use({ at: z3.valve, icon: '💧', label: 'Turn', r: 2.7, y: 1.3 });
      ctx.lock(); ctx.tween(z3.valve.rotation, { z: -6.28 }, 1.2); ctx.fact('💧', 'Workers wash out everything that is not fine clay.');
      const pour = ctx.every(0.08, () => ctx.burst(z3.spout, { color: 0x7fc8ff, n: 3, speed: 0.5, size: 0.16, y: 0 })), wsfx = ctx.every(0.5, () => ctx.audio.play('water'));
      const padSpin = ctx.onUpdate((dt) => { z3.paddle.rotation.z -= dt * 4; });
      const milky = new THREE.Color(0xf1ede0); ctx.tween(z3.troughWater.material.color, { r: milky.r, g: milky.g, b: milky.b }, 2.4);
      await ctx.wait(1.3);
      for (const l of inTrough) ctx.tween(l.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.9).then(() => ctx.remove(l));
      // game: stones are picked out of the flowing clay; the fine white clay floats on to the ponds
      await ctx.wait(0.9); ctx.say(washer, 'Pick out the stones! 👆', 2.5);
      await stonesGame(ctx);
      ctx.fact('⚖️', 'Heavy sand and stones sink first; fine clay floats on.');
      const run = ctx.every(0.1, () => { for (const p of z3.sluice) ctx.burst(p, { color: 0xf6f3ea, n: 2, speed: 0.4, size: 0.16, y: 0 }); });
      ctx.cam.target = { at: [z3.ponds[0][0] - 1.5, 0.6, z3.ponds[0][1]], dist: 11, pitch: 0.55 };
      await ctx.tween(z3.pondFill.position, { y: 0.27 }, 2.6, 'linear');
      pour(); wsfx(); run(); padSpin(); ctx.cam.target = null; ctx.unlock(); done();
      await ctx.wait(0.8);
      await ctx.chapter({ title: '6–8 weeks later…', emoji: '⏳', env: 'autumn', setup: () => { z3.pondFill.material.color.set(0xf6f3ea); z3.pondFill.position.y = 0.16; z3.troughWater.visible = false; } });
      ctx.say(washer, 'Firm and white. Scoop some! 👍', 3);
      const pA = z3.ponds[0], scoopAt = [pA[0], pA[1] + 2.8];
      ctx.goal('⚪', 'Scoop the clay', scoopAt);
      await use({ at: scoopAt, icon: '⚪', label: 'Scoop', hold: 0.8, r: 2.3, y: 1.6, sfx: 'dig' });
      ctx.fact('⏳', 'Clay workers really do wait six to eight weeks for this!');
      const hole = box(0.9, 0.05, 0.7, 0xd2ccbc, [pA[0], 0.32, pA[1] + 1.55]); ctx.add(hole); zoneObjs[2].push(hole);
      const mixAt = [z3.mixer[0], z3.mixer[1] + 2.3];
      const addToMix = async (icon, level, col) => {
        ctx.goal(icon, 'Into the mixer', mixAt);
        await use({ at: mixAt, icon, label: 'Add', r: 2.2, y: 2.2 });
        const o = ctx.drop(); o.position.set(ctx.player.position.x, 1.3, ctx.player.position.z); ctx.add(o);
        await hop(o, [z3.mixer[0], 1.0, z3.mixer[1]], 1.6, 0.5); ctx.remove(o); ctx.audio.play('splash'); ctx.burst([z3.mixer[0], 1.5, z3.mixer[1]], { color: col, n: 10, size: 0.16, speed: 1.6, y: 0 });
        ctx.tween(z3.mixFill.position, { y: level }, 0.5); ctx.tween(z3.mixPaddle.rotation, { y: z3.mixPaddle.rotation.y + 2 }, 0.8, 'out');
      };
      hold(group([box(0.5, 0.3, 0.4, 0xf6f3ea)]), 0.18, 0.07);
      await addToMix('⚪', 0.75, 0xf6f3ea);
      for (const [i, icon, name, col] of [[0, '🔶', 'feldspar', 0xe3a98f], [1, '💎', 'quartz', 0xeaf4fb]]) {
        ctx.say(blender, i ? 'And sparkly quartz! 💎' : 'Now add feldspar! 🔶', 2.8);
        const b = [z3.bins[i][0], z3.bins[i][1] + 1.45]; ctx.goal(icon, 'Get ' + name, b);
        await use({ at: b, icon, label: 'Take', r: 2.2, y: 2.0, sfx: 'pickup' });
        i ? hold(Z.dyn(group([cone(0.16, 0.55, 0xeaf4fb, [0, 0.1, 0], [0.2, 0, 0.1], 6), cone(0.12, 0.42, 0xd9ccf2, [0.17, 0.02, 0.05], [0, 0, -0.5], 6), cone(0.12, 0.4, 0xeaf4fb, [-0.16, 0.02, 0], [0, 0, 0.5], 6)])), 0.07, 0.06) : hold(group([P.rock({ s: 0.65, color: 0xe3a98f })]), 0, 0.1);
        await addToMix(icon, 0.95 + i * 0.2, col);
      }
      done();
      ctx.fact('💎', 'Real porcelain makers blend clay with feldspar, quartz and more.');
      ctx.say(blender, 'Mix it smooth! 🌀', 2.6);
      ctx.goal('🌀', 'Mix it smooth', mixAt);
      await use({ at: mixAt, icon: '🌀', label: 'Mix', hold: 1.3, r: 2.2, y: 2.2, sfx: 'splash' });
      ctx.lock(); const mixSpin = ctx.onUpdate((dt) => { z3.mixPaddle.rotation.y += dt * 7; }), msfx = ctx.every(0.35, () => { ctx.audio.play('bubble'); ctx.burst([z3.mixer[0], 1.4, z3.mixer[1]], { color: 0xffffff, n: 4, size: 0.14, speed: 1.2, y: 0 }); });
      const smooth = new THREE.Color(0xf8f5ec); ctx.tween(z3.mixFill.material.color, { r: smooth.r, g: smooth.g, b: smooth.b }, 2); await ctx.wait(2.2); mixSpin(); msfx();
      const paste = group([ball(0.3, 0.24, 0.3, 0xf4f1e8)]); paste.position.set(z3.mixer[0], 1.4, z3.mixer[1]); ctx.add(paste); ctx.audio.play('pop');
      await hop(paste, [ctx.player.position.x, 1.0, ctx.player.position.z], 1.4, 0.5); hold(paste, 0.13, 0.08); ctx.unlock(); done();
      ctx.thank('⛏️', ['Miners', 'Clay washers', 'Material specialists']);
      ctx.goal('⚙️', 'To the workshop', z3.exit);
      await enter(z3.exit[0], z3.exit[1], 1.5); ctx.bounds(null); ctx.goal(null);

      // ===== 4. New machines: steam power (1802), then today's 280-bar press =====
      await ctx.chapter({ n: 4, title: 'New Machines', emoji: '⚙️', env: ['indoor', { ground: 0x6e5c4a, top: '#241b15', bottom: '#4a382b', fog: false }], at: [X4 - 9, -1.6], face: PI, cam: { yaw: 0, pitch: 0.4, dist: 10.5 }, setup: () => showZone(3) });
      ctx.bounds(X4 - 18.6, -11, X4 + 18.6, 4.2);
      ctx.say(thrower, 'Pop your clay on my wheel! 🏺', 3.2);
      const wheelFront = [z4.wheelAt[0], z4.wheelAt[1] + 1.3];
      ctx.goal('🏺', 'Clay on the wheel', wheelFront);
      await use({ at: wheelFront, icon: '🏺', label: 'Place', r: 2.2, y: 1.9, sfx: 'thud' });
      ctx.drop(); paste.position.set(0, 0.27, 0); z4.wheelHead.add(paste);
      ctx.say(thrower, 'No steam, no spin. Coal, please! 🔥', 3.4);
      const coalFront = [z4.coal[0], z4.coal[1] + 1.6];
      ctx.goal('⚫', 'Grab some coal', coalFront);
      await use({ at: coalFront, icon: '⚫', label: 'Take', r: 2.2, y: 1.7, sfx: 'pickup' });
      const scuttle = Z.dyn(group([cyl(0.3, 0.22, 0.36, 0x6d7a86, [0, 0, 0], null, 8), sphere(0.14, 0x26262b, [0.08, 0.2, 0], 5), sphere(0.13, 0x34343a, [-0.1, 0.2, 0.06], 5), sphere(0.12, 0x26262b, [0, 0.24, -0.1], 5)])); hold(scuttle, 0.13, 0.12);
      const fireFront = [z4.firebox[0], z4.firebox[1] + 0.6];
      ctx.goal('🔥', 'Feed the boiler', fireFront);
      await use({ at: fireFront, icon: '🔥', label: 'Shovel in', hold: 0.9, r: 2.3, y: 2.0, sfx: 'thud' });
      ctx.remove(ctx.drop()); ctx.lock(); ctx.fact('🚂', 'In 1802, Spode used steam power to spin potters’ wheels.'); z4.boilerFire.visible = true; ctx.audio.play('fire'); ctx.burst([z4.firebox[0], 0.9, z4.firebox[1]], { color: 0xff9a30, n: 12, size: 0.18, speed: 1.6, y: 0 });
      let rpm = 0, rpmTo = 5.5; const fw = z4.flywheel, rodLen = 1.0;
      ctx.onUpdate((dt, t) => { rpm += (rpmTo - rpm) * Math.min(1, dt * 0.9); fw.rotation.z -= rpm * dt; z4.wheelHead.rotation.y += rpm * 1.6 * dt; z4.boilerFire.scale.y = 0.85 + 0.15 * Math.sin(t * 14);
        const a = fw.rotation.z, px = z4.fly[0] + Math.cos(a) * 0.7, py = z4.fly[1] + Math.sin(a) * 0.7, ox = z4.fly[0] - 1.5, oy = z4.fly[1] - 0.8; z4.rod.position.set(ox, oy, z4.fly[2] + 0.2); z4.rod.rotation.z = Math.atan2(py - oy, px - ox); z4.rod.scale.x = Math.hypot(px - ox, py - oy) / rodLen; });
      const puff = ctx.every(0.35, () => { ctx.burst(z4.steamAt, { color: 0xffffff, n: 4, size: 0.4, speed: 0.8, y: 0 }); }); ctx.audio.play('steam');
      ctx.cam.target = { at: [X4 - 6.5, 2.2, -8], dist: 12.5, pitch: 0.32 }; thrower.userData.anim = 'work';
      await ctx.wait(1.6); ctx.audio.play('steam');
      await ctx.tween(paste.scale, { x: 1.5, y: 0.35, z: 1.5 }, 1.0); const thrown = Z.dyn(group([Z.bowl(1.5, 0xe9e4d6)])); thrown.position.set(0, 0.06, 0); thrown.scale.setScalar(0.6); z4.wheelHead.remove(paste); z4.wheelHead.add(thrown);
      await ctx.tween(thrown.scale, { x: 1, y: 1, z: 1 }, 1.0, 'out'); ctx.audio.play('sparkle');
      ctx.cam.target = null; thrower.userData.anim = 'cheer'; ctx.after(1.5, () => { thrower.userData.anim = 'work'; });
      const paste2 = group([ball(0.26, 0.2, 0.26, 0xf4f1e8)]); paste2.position.set(z4.wheelAt[0] + 0.7, 1.0, z4.wheelAt[1] + 0.5); ctx.add(paste2); ctx.audio.play('pop');
      await hop(paste2, [ctx.player.position.x, 1.0, ctx.player.position.z], 1.2, 0.5); hold(paste2, 0.1, 0.04); ctx.unlock(); done();
      ctx.say(thrower, 'Take the rest to today! ⏩', 3);
      ctx.goal('⏩', 'Walk to today', z4.today);
      await ctx.until(() => ctx.player.position.x > X4 + 1.2);
      puff(); ctx.audio.music('factory'); ctx.banner('🏭', 'Today', 1.8);
      ctx.say(operator, 'Pour your clay in here! 🌀', 3.2);
      ctx.goal('🌀', 'Fill the spray dryer', z4.dryerAt);
      await use({ at: z4.dryerAt, icon: '🌀', label: 'Pour in', r: 2.6, y: 2.2, sfx: 'pour' });
      ctx.lock(); const p2 = ctx.drop(); p2.position.set(ctx.player.position.x, 1.3, ctx.player.position.z); ctx.add(p2); await hop(p2, z4.dryerIn, 1.6, 0.6); ctx.remove(p2); ctx.audio.play('steam'); ctx.fact('🌀', 'Today some plates start as tiny spray-dried porcelain granules.');
      ctx.cam.target = { at: [X4 + 10.5, 2.6, -9], dist: 13, pitch: 0.3 };
      const dry = ctx.every(0.16, () => { ctx.burst(z4.dryerTop, { color: 0xffffff, n: 4, size: 0.45, speed: 0.7, y: 0 }); }); const hum = ctx.every(0.5, () => ctx.audio.play('machine'));
      await ctx.wait(1.3);
      const heap = cyl(0.45, 0.6, 0.14, 0xf6f3ea, [z4.press[0], 1.38, z4.press[1]], null, 12); heap.scale.setScalar(0.01); ctx.add(heap); ctx.tween(heap.scale, { x: 1, y: 1, z: 1 }, 1.6);
      const grains = ctx.every(0.08, () => { for (const p of z4.chute) ctx.burst(p, { color: 0xf6f3ea, n: 3, size: 0.1, speed: 0.5, y: 0 }); });
      await ctx.wait(1.8); grains(); dry(); hum(); ctx.cam.target = null; ctx.unlock();
      ctx.say(operator, 'Now we press the tiny grains! ⚙️', 3.4);
      let bar = 0, ph = 0, pressed = false, tol = 42, misses = 0; ctx.chinaDebug = Object.assign(ctx.chinaDebug || {}, { bar: () => bar, gauge: z4.gaugeAt });
      const sweep = ctx.onUpdate((dt) => { if (pressed) return; ph = (ph + dt * 0.27) % 1; bar = 400 * (ph < 0.5 ? ph * 2 : 2 - ph * 2); z4.setBar(bar); });
      const consoleFront = [z4.console[0], z4.console[1] + 0.9];
      // on an upright phone the dial stands off to the side of the console, out of the narrow picture: while the player is at the console the camera steps back so that both are in view
      // (and on a phone held sideways the dial would hide behind the goal chip at the top: there the camera looks a little lower)
      const dialCam = { at: [z4.console[0] + 2.2, 2.4, z4.console[1] - 1.2], dist: 12, pitch: 0.35, yaw: 0 }, dialCamShort = { at: [z4.console[0] + 1.6, 2.2, z4.console[1] - 0.8], dist: 10, pitch: 0.3, yaw: 0 };
      const dialView = ctx.onUpdate(() => { const Q = ctx.player.position, a = ctx.camera.aspect, want = Math.hypot(Q.x - consoleFront[0], Q.z - consoleFront[1]) < 3.2 ? (a < 0.8 ? dialCam : a > 1.6 && window.innerHeight < 480 ? dialCamShort : null) : null, T = ctx.cam.target;
        if (want) { if (T !== want) { ctx.cam.target = want; ctx.cam.yaw = 0; } } else if (T === dialCam || T === dialCamShort) ctx.cam.target = null; });
      ctx.goal('🎯', 'Stop at 280!', consoleFront);
      await new Promise(res => ctx.interact({ at: consoleFront, icon: '🎯', label: 'Press!', once: false, r: 2.2, y: 2.0, sfx: 'click', onUse: (it) => {
        if (pressed) return; ctx.tween(z4.button.position, { y: 1.07 }, 0.08).then(() => ctx.tween(z4.button.position, { y: 1.13 }, 0.15));
        if (Math.abs(bar - 280) <= tol) { pressed = true; it.remove(); res(); }
        else { misses++; tol += 22; ctx.audio.play('error'); ctx.say(operator, bar < 280 ? 'Too soft — try again! 🙂' : 'Too hard — try again! 🙂', 1.6); }
      } }));
      sweep(); dialView(); ctx.lock(); bar = 280; z4.setBar(280); ctx.audio.play('machine');
      await ctx.tween(z4.ram.position, { y: z4.ramDown }, 0.35, 'in'); ctx.audio.play('thud'); ctx.cam.shake = 0.25; ctx.burst([z4.press[0], 1.4, z4.press[1]], { color: 0xffffff, n: 14, size: 0.12, speed: 2.4, y: 0 });
      ctx.remove(heap); placePlate([z4.press[0], 1.31, z4.press[1]]); await ctx.wait(0.6); ctx.audio.play('steam');
      await ctx.tween(z4.ram.position, { y: z4.ramUp }, 0.7, 'out'); ctx.audio.play('sparkle');
      await hop(plateRoot, z4.outTable, 1.0, 0.7); ctx.audio.play('clink'); if (ctx.cam.target === dialCam || ctx.cam.target === dialCamShort) ctx.cam.target = null; ctx.unlock(); done();
      ctx.say(operator, '280 bar — about 4,060 psi! 💪', 3.6);
      ctx.goal('🍽️', 'Take your plate', plateRoot);
      await use({ at: plateRoot, icon: '🍽️', label: 'Take', r: 2.7, y: 1.0 });
      carryPlate(); turnFrom(z4.outTable); ctx.thank('⚙️', ['Machine operators', 'Maintenance crews', 'Toolmakers']);
      ctx.goal('🎨', 'To the design studio', z4.exit);
      await enter(z4.exit[0], z4.exit[1], 1.7); ctx.bounds(null); ctx.goal(null);

      // ===== 5. The design studio: decorate YOUR plate, print the transfer, apply it =====
      await ctx.chapter({ n: 5, title: 'Making It Beautiful', emoji: '🎨', env: ['indoor', { ground: 0xb08a5e, top: '#e9dcc0', bottom: '#f4ead4', fog: false }], at: [X5 - 1, -1.4], face: PI, cam: { yaw: 0, pitch: 0.38, dist: 10 }, music: 'calm', setup: () => showZone(4) });
      ctx.bounds(X5 - 13, -10.9, X5 + 13, 3.4);
      ctx.say(designer, 'Every plate starts as an idea! 🎨', 3.2);
      const deskAt = [z5.desk[0] + 0.4, z5.desk[1] + 1.3];
      ctx.goal('🎨', 'Design your plate', deskAt);
      await use({ at: deskAt, icon: '🎨', label: 'Design', r: 2.2, y: 2.0 });
      placePlate(z5.plateAt);
      ops = await openDesigner(ctx, []);
      sketch.draw(ops); sketch.mesh.position.set(z5.sheetAt[0], z5.sheetAt[1] + 0.03, z5.sheetAt[2] + 0.06); sketch.mesh.rotation.x = -0.5; sketch.mesh.scale.setScalar(0.01); ctx.add(sketch.mesh); ctx.tween(sketch.mesh.scale, { x: 1, y: 1, z: 1 }, 0.4, 'outBack');
      ctx.act('clap', 1.6, designer); done();
      ctx.thank('🎨', ['Designers', 'Model makers', 'Mold makers']);
      ctx.say(printer, 'Now we print it! 🖨️', 3);
      const pressAt = [z5.pressAt[0] + 0.6, z5.pressAt[1] + 1.3];
      ctx.goal('🖨️', 'Print your pattern', pressAt);
      await use({ at: pressAt, icon: '🖨️', label: 'Print', hold: 1.1, r: 2.3, y: 2.4, sfx: 'machine' });
      ctx.lock(); transfer.draw(ops); transfer.mesh.rotation.x = -PI / 2; transfer.mesh.position.set(...z5.sheetOut[0]); ctx.add(transfer.mesh); printer.userData.anim = 'work';
      ctx.audio.play('machine'); ctx.tween(z5.starWheel.rotation, { z: -9.4 }, 2.0, 'inOut'); await ctx.tween(transfer.mesh.position, { x: z5.sheetOut[1][0] }, 2.0, 'inOut'); printer.userData.anim = 'idle'; ctx.audio.play('ding');
      ctx.unlock(); ctx.fact('🖨️', 'Transfer printing, around 1750, made decorated plates cost much less.');
      ctx.goal('📄', 'Take the print', transfer.mesh);
      await use({ at: transfer.mesh, icon: '📄', label: 'Take', r: 2.9, y: 1.0, sfx: 'pickup' });
      const sheetHold = group([transfer.mesh]); transfer.mesh.position.set(0, -0.04, 0.2); transfer.mesh.rotation.x = -PI / 2 + 0.6; ctx.carry(sheetHold); turnFrom(z5.pressAt);
      ctx.goal('✨', 'Press it on', deskAt);
      await use({ at: deskAt, icon: '✨', label: 'Apply', r: 2.2, y: 2.0 });
      ctx.lock(); ctx.drop(); transfer.mesh.rotation.x = -PI / 2; transfer.mesh.position.set(z5.plateAt[0], 1.6, z5.plateAt[2]); ctx.add(transfer.mesh);
      ctx.cam.target = { at: [z5.plateAt[0], 1.0, z5.plateAt[2]], dist: 4.6, pitch: 0.85 };
      // game: the transfer decorator slides the wet print until it sits square on the plate, then presses it on
      ctx.say(printer, 'Line it up just right! 📄', 2.6);
      await lineUpGame(ctx, ops);
      await ctx.tween(transfer.mesh.position, { y: z5.plateAt[1] + 0.07 }, 0.7, 'in'); ctx.audio.play('pop'); await ctx.wait(0.5);
      plate.paint(ops); ctx.tween(transfer.mesh.position, { y: 2.4, x: z5.plateAt[0] + 1.2 }, 0.6, 'in').then(() => ctx.remove(transfer.mesh));
      ctx.audio.play('sparkle'); ctx.burst([z5.plateAt[0], 1.1, z5.plateAt[2]], { color: 0xffe08a, n: 16, size: 0.1, speed: 1.6, y: 0 });
      await ctx.wait(2.2); ctx.cam.target = null; carryPlate(); turnFrom(z5.plateAt); ctx.unlock(); done();
      ctx.thank('🖨️', ['Engravers', 'Printers', 'Transfer decorators', 'Painters']);
      ctx.say(painter, 'I still paint by hand! 🖌️', 3);
      designer.userData.anim = 'walk'; ctx.moveAlong(designer, [[X5 - 8.2, -4.6], [X5 + 8.4, -1.4]], 4.5).then(() => { designer.userData.anim = 'idle'; designer.rotation.y = 0.9; });
      const boneFront = [z5.bone[0] - 0.2, z5.bone[1] + 1.1];
      ctx.goal('💡', 'Light the lamp', boneFront);
      await use({ at: boneFront, icon: '💡', label: 'Switch on', r: 2.2, y: 2.1, sfx: 'click' });
      z5.bulb.material.color.set(0xfff2b0); ctx.tween(z5.cup.material.emissive, { r: 0.95, g: 0.62, b: 0.25 }, 0.8); ctx.audio.play('sparkle'); ctx.burst([z5.bone[0], 1.4, z5.bone[1]], { color: 0xfff0b0, n: 12, size: 0.1, speed: 1.2, y: 0 });
      ctx.fact('☕', 'Bone china has real animal bone ash mixed in!');
      await ctx.say(designer, 'Light, strong — and it glows! ✨', 3.4); done();
      ctx.goal('🔥', 'To the kiln', z5.exit);
      await enter(z5.exit[0], z5.exit[1], 1.7); ctx.bounds(null); ctx.goal(null);

      // ===== 6. Glaze and fire =====
      await ctx.chapter({ n: 6, title: 'Glaze & Fire', emoji: '🔥', env: ['factory', { ground: 0x8f897c, fog: false }], at: [X6 - 10.5, -1.6], face: PI / 2, cam: { yaw: 0, pitch: 0.38, dist: 10.5 }, music: 'factory', setup: () => showZone(5) });
      ctx.bounds(X6 - 15.2, -10.9, X6 + 15.2, 4);
      ctx.say(glazer, 'Give it a glassy coat! 💧', 3);
      const vatFront = [z6.vat[0], z6.vat[1] + 2.0];
      ctx.goal('💧', 'Dip in glaze', vatFront);
      await use({ at: vatFront, icon: '💧', label: 'Dip', hold: 0.8, r: 2.3, y: 2.1, sfx: 'splash' });
      ctx.lock(); ctx.fact('🛡️', 'Some decorations are fired into the glaze to protect them.'); ctx.drop(); plate.obj.position.set(0, 0, 0); plate.obj.rotation.set(PI / 2 - 0.2, 0, 0); plateRoot.position.set(z6.vat[0], 2.0, z6.vat[1]); ctx.add(plateRoot);
      await ctx.tween(plateRoot.position, { y: 0.5 }, 0.6, 'in'); ctx.audio.play('splash'); ctx.burst([z6.vat[0], 1.0, z6.vat[1]], { color: 0xf3dce0, n: 14, size: 0.16, speed: 1.8, y: 0 });
      plate.paint([], '#f2d9de'); plate.mat.shininess = 2; await ctx.wait(0.5);
      await ctx.tween(plateRoot.position, { y: 2.0 }, 0.7, 'out'); const drip = ctx.every(0.15, () => ctx.burst([z6.vat[0], 1.6, z6.vat[1]], { color: 0xf3dce0, n: 2, size: 0.1, speed: 0.3, y: 0 })); await ctx.wait(0.9); drip();
      carryPlate(); turnFrom(z6.vat); ctx.unlock(); done();
      ctx.say(glazer, 'Fire makes it smooth like glass! ✨', 3);
      const loadSpot = [z6.loadAt[0], z6.loadAt[2] + 1.9];
      ctx.goal('🍽️', 'Load the kiln', loadSpot);
      await use({ at: loadSpot, icon: '🍽️', label: 'Load', r: 2.3, y: 2.0, sfx: 'clink' });
      // the camera shows the whole kiln; on an upright phone it looks along the kiln from the left instead, so that the lever, the player and the temperature board all fit in the narrow picture
      // (the walking direction follows cam.yaw, so that is turned too, and turned back afterwards)
      placePlate(z6.loadAt); const yaw0 = ctx.cam.yaw, sideways = ctx.camera.aspect < 0.8;
      if (sideways) { ctx.cam.yaw = -0.6; ctx.cam.target = { at: [X6 + 1.5, 2.4, -6.5], dist: 13, pitch: 0.28, yaw: -0.6 }; } else ctx.cam.target = { at: [X6 + 3.6, window.innerHeight < 480 ? 3.0 : 2.4, -7], dist: 15.5, pitch: 0.3 };   // (a phone held sideways: aim a little higher, so the temperature board is not hidden behind the goal chip)
      ctx.say(kilnWorker, 'Push the lever — more heat! 🔥', 3);
      let heat = 0, temp = 20, tempTo = 20; const hot = [0x3a1a10, 0x9a3a14, 0xe0641e, 0xffb347].map(h => new THREE.Color(h));
      const tick = ctx.onUpdate((dt, t) => { if (Math.abs(temp - tempTo) > 1) { temp += Math.sign(tempTo - temp) * Math.min(Math.abs(tempTo - temp), dt * 520); z6.setTemp(temp); } const k = Math.min(1, temp / 1400) * 3, i = Math.min(2, Math.floor(k)); z6.glowMat.color.copy(hot[i]).lerp(hot[i + 1], k - i).multiplyScalar(0.92 + 0.08 * Math.sin(t * 11)); });
      const leverFront = [z6.leverAt[0], z6.leverAt[1] + 0.9];
      ctx.goal('🌡️', 'Heat it up!', leverFront);
      ctx.interact({ at: leverFront, icon: '🌡️', label: 'Hotter!', once: false, r: 2.2, y: 2.1, sfx: 'click', when: () => Math.abs(temp - tempTo) < 2, onUse: (it) => { heat++; tempTo = [500, 1000, 1400][heat - 1]; ctx.tween(z6.lever.rotation, { z: 0.7 - heat * 0.47 }, 0.3, 'outBack'); ctx.audio.play('fire'); ctx.cam.shake = 0.06; if (heat >= 3) it.remove(); } });
      await ctx.until(() => heat >= 3 && temp >= 1399);
      ctx.fact('🌡️', 'Meissen fires its glaze at about 1,400°C — 2,550°F!');
      ctx.lock(); kilnWorker.userData.anim = 'cheer'; const roar = ctx.every(0.7, () => ctx.audio.play('kiln'));
      const K = z6.kiln; await ctx.tween(plateRoot.position, { x: K.x0 + 0.3 }, 1.0, 'linear'); plateRoot.visible = false;
      for (let i = 0; i < 5; i++) ctx.after(0.3 + i * 0.68, () => { ctx.burst([K.x0 + 1.6 + i * 2.2, 2.0, K.z + 1.5], { color: 0xffc040, n: 7, size: 0.14, speed: 1.6, y: 0 }); ctx.audio.play('fire'); });
      await ctx.tween(plateRoot.position, { x: K.x1 - 0.3 }, 3.4, 'linear'); plate.paint(ops); plate.mat.shininess = 120; plate.mat.specular.set(0x999999); plateRoot.visible = true;
      ctx.thank('🔥', ['Glazers', 'Kiln workers', 'Production artisans']);
      await ctx.tween(plateRoot.position, { x: z6.outAt[0] }, 1.0, 'out'); roar(); ctx.audio.play('sparkle'); ctx.burst(plateRoot, { color: 0xfff0b0, n: 18, size: 0.12, speed: 1.8, y: 0.2 });
      tempTo = 60; kilnWorker.userData.anim = 'idle'; await ctx.wait(0.8); ctx.cam.target = null; if (sideways) ctx.cam.yaw = yaw0; ctx.unlock(); done();
      const outFront = [z6.outAt[0], z6.outAt[2] + 1.9];
      ctx.goal('🍽️', 'Take your plate', outFront);
      await use({ at: outFront, icon: '🍽️', label: 'Take', r: 2.3, y: 2.0 });
      carryPlate(); tick(); ctx.lock(); ctx.goal('🦃', 'To the table!'); plate.obj.rotation.x = 1.05; plate.obj.position.y = -0.08; ctx.player.rotation.y = 0;
      ctx.cam.target = { at: [ctx.player.position.x, 1.15, ctx.player.position.z], dist: 4.4, pitch: 0.28, yaw: 0 }; ctx.audio.play('sparkle');
      ctx.say(kilnWorker, 'Ready for Thanksgiving dinner! 🦃', 2.8);
      await ctx.wait(4.2); ctx.cam.target = null; ctx.unlock();
      ctx.finish();
    });
  },
};
