# How an adventure is built

Each adventure is one file in `src/adventures/` that exports `{ id, title, emoji, question, music, thanksLine, create(ctx) }`
(`question` is the line shown under “ADVENTURE” on the transition card, e.g. “How does the turkey end up on your table?”).
`create(ctx)` builds the whole world up-front, then registers the story with `ctx.onStart(async () => { ... })`.
`src/adventures/potatoes.js` is the reference — read it first; copy its pattern.

Units are metres, Y is up, things face +Z. The camera starts on the +Z side looking toward −Z
(so "forward / W" walks toward −Z, "right / D" toward +X). Lay each zone out so the next thing to do is in view.
Zones (chapters) live in the same scene ~100 m apart along X; `ctx.chapter()` fades and teleports between them.

## Imports
```js
import { THREE, C, mat, glow, box, cyl, cone, sphere, ball, torus, plane, disc, lathe, tube, group, bake,
         sign, label, emojiSprite, picture, canvasTex, person, randomPerson, seeded, rand, pick, lerp, clamp, damp } from '../core/kit.js';
import * as P from '../core/props.js';
```

### kit.js — primitives (all return a Mesh, colour is a hex number; positions are [x,y,z], rotations [rx,ry,rz])
- `box(w,h,d,color,pos,rot)`, `cyl(rTop,rBottom,h,color,pos,rot,segments)`, `cone(r,h,color,pos,rot,seg)`, `sphere(r,color,pos,seg)`,
  `ball(rx,ry,rz,color,pos,rot)` (squashed sphere), `torus(r,tube,color,pos,rot)`, `plane(w,d,color,[x,y,z])` (flat on ground),
  `disc(r,color,pos)`, `lathe([[r,y],...],color,pos)` (bowls, bottles, plates), `tube([[x,y,z],...],radius,color)` (ropes, vines, pipes)
- `group([children], pos, rot)` → THREE.Group.  `mat(color,{opacity,emissive,side:'double'})` cached material, `glow(color)` unlit.
- `C` — palette (C.grass, C.wood, C.red, C.skin[0..5], C.hair[0..6], C.autumn[] …).
- `bake(group)` — merges all plain-coloured meshes under a group into ONE mesh. Essential for speed (see Performance).
  Children under a node with `userData.dynamic = true` are left alone, as are textured/transparent things.
- Text & pictures: `sign('🥔 FARM', heightMetres, {bg,fg,border}, pos, rot)` flat board facing +Z; `label(text, h)` always faces camera;
  `emojiSprite('🦃', sizeMetres, pos)`; `picture(w,h,(g,W,H)=>{…2D canvas drawing…}, res, pos, rot)`; `canvasTex(w,h,draw)`.
- `grain(repeat)` → a soft blotchy texture for big flat surfaces: `new THREE.MeshLambertMaterial({ color, map: grain(8) })` (not baked; use for the 1–3 largest surfaces of a zone).
- People (chunky, faceted low-poly on purpose; ~1.85 m with a big head; arms bend at the elbow, legs are rigid; ~10 draws each): `person({skin, hair, hairStyle:'short'|'long'|'bun'|'bald'|'pony'|'curly', shirt, pants, shoes, hat:'straw'|'cap'|'hardhat'|'chef'|'bonnet'|'hairnet'|'beanie'|'tophat'|'sailor'|'cowboy', hatColor, apron, dress, vest, beard, glasses, scale, expressive})`.
  Animate with `p.userData.anim = 'idle'|'walk'|'run'|'wave'|'work'|'dig'|'sew'|'carry'|'cheer'|'clap'|'laugh'|'talk'|'eat'|'point'`, `p.userData.sitting = true`,
  `p.userData.lookAt = Vector3|null`. `p.userData.hand` (right hand) and `p.userData.carryAnchor` are Groups you can attach things to.
  Normally create people with `ctx.person(...)` (below) so they are animated and solid automatically.
- `seeded(n)` → deterministic random function; use it (not Math.random) for scenery layout.

### props.js — ready-made scenery (each returns an already-baked Group, origin on the ground)
`tree({h,kind:'round'|'pine'|'autumn'|'fruit',color,fruit})`, `bush`, `rock`, `flower`, `cloud`, `mountain({h})`, `fence(length)`,
`building({w,h,d,color,roof:'gable'|'flat'|'barn'|'shed',roofColor,door,windows,sign})`, `barn`, `house`, `store({sign})`, `silo`,
`truck({color,kind:'box'|'flatbed'|'reefer'|'tanker'|'pickup',logo:'🦃'})` (`.userData.bed` is a Group for cargo), `tractor`,
`crate({fill:color})`, `sack`, `barrel`, `haybale`, `signpost('🥔')`, `lampPost`, `tableProp(w,d,h,color)`, `conveyor(length)` (along X),
`fieldRows(w,d,rows)`, `cropPlant({s,color})`, `shelf({w})`, `water(w,d)` (not baked), `scatter(n, areaW, areaD, (rnd,i)=>prop, {seed, keep:(x,z)=>bool})`.
Anything more specific (animals, machines, ships, looms…) you build yourself from the primitives — that is expected.

## ctx — the world you get in create(ctx)
**Scene**
- `ctx.env(preset, {ground: colour|false, fog:[near,far]|false, top, bottom})` — presets: day, autumn, sunset, dawn, night, overcast, snow, indoor, factory, sea.
- `ctx.addStatic(group, x, z, ry)` — scenery that never changes (it is baked into one mesh).  `ctx.add(obj, x, z, ry)` — things that move/animate.  `ctx.remove(obj)`.
- `ctx.person(opts | 'farmer'|'worker'|'factory'|'chef'|'driver'|'shopper', x, z, ry, seed)` → person, animated + solid.
- `ctx.onUpdate((dt, t) => {...})` → returns a stop function.  `ctx.player` (Group), `ctx.scene`, `ctx.camera`, `ctx.time`.
**Time (game time — never use setTimeout/setInterval)**
- `await ctx.wait(sec)`, `ctx.after(sec, fn)`, `ctx.every(sec, fn)` → stop fn, `await ctx.until(() => condition)`
- `await ctx.tween(obj.position, {y: 2}, seconds, 'linear'|'in'|'out'|'inOut'|'outBack'|'outBounce'|'outElastic')`
- `await ctx.moveAlong(obj, [[x,z],...] | [[x,y,z],...], speed)`, `ctx.stopTweens(target)` (cancel what is still animating on an object)
**Solid things**: `ctx.collideBox(cx, cz, width, depth)`, `ctx.collideCircle(x, z, r)`, `ctx.collideObj(obj, r)` → each returns `{remove()}`; `ctx.bounds(minX, minZ, maxX, maxZ)` / `ctx.bounds(null)`.
**Doing things**
- `ctx.interact({ at: obj | [x,z], icon: '🌱', label: 'Plant', r: 2.4, y: 2, hold: 0, once: true, sfx: 'pop', when: () => bool, onUse: () => {} })` → handle with `remove()`.
  The player walks up (keys or touch stick — there is no click-to-walk), a bubble appears, they press E / Space / click it. `hold: 1.2` makes them hold the key (good for digging, stirring, sawing).
  When used, the player turns to face `at` if it is an object (not when `at` is a plain [x,z] spot); pass `face: obj | [x,z]` to choose what to face, or `face: false` to keep the facing.
  A handy pattern: `await new Promise(res => ctx.interact({ at, icon, label, onUse: res }))`.
- `ctx.collect({ items: [objects], r: 1.2, onEach: (obj, nLeft) => {}, onAll: () => {} })` → promise; things picked up by walking over them.
- `ctx.zone({ x, z, r, onEnter, onExit, once })` — invisible trigger.
- `ctx.carry(obj)` / `ctx.drop()` / `ctx.carrying` — hold something in the player's arms.
- `await ctx.ride(vehicle, [[x,z],...], {speed})` — player drives/rides along a path, camera follows.
- `await ctx.act('dig', 1.0)` — play an animation on the player (or `ctx.act('wave', 1, someone)`).
- `ctx.lock()` / `ctx.unlock()` — freeze the player during a cutscene.  `ctx.tp(x, z, facing)`.
- `await ctx.focus(obj, seconds, {dist, pitch, yaw})` — camera glides to look at something, then returns.
- `ctx.cam` = { yaw, pitch, dist } — you may set these per zone (e.g. `ctx.cam.yaw = Math.PI/2` to look toward −X).
- `ctx.ui.panel(html)` → `{ el, close() }` — a centred pop-up for a small 2D mini-game you build with DOM/canvas (player is locked while open).
**Guiding and telling (keep words to a minimum — show, don't tell)**
- `ctx.goal('🥔', 'Dig potatoes', targetObjOr[x,z])` — objective chip (≤ 4 words) + glowing beacon on the target. `ctx.goal(null)` clears.
- `ctx.progress(done, total)` — progress dots.
- `ctx.say(person, 'A few words 🥔', seconds)` — speech bubble (≤ 8 words). Returns a promise if you want to wait for it.
- `ctx.emote(obj, '💛')` — rising emoji.  `ctx.burst(pos, {color, n, size, speed})` — puff of particles.  `ctx.confetti()`.
- `ctx.fact('🐝', 'One short surprising line.')` — the “IN REAL LIFE” toast at the bottom (≤ 12 words, ~7 s, queued). Aim for 10–14 per adventure, each tied to what the player is doing at that moment.
- `ctx.banner('🍂', 'Autumn', 2)` — big momentary banner.
- `ctx.thank('🚜', ['Farmers', 'Truck drivers', 'Mechanics'])` — the thank-you card: the heart of the game. 3–5 roles per card.
- `await ctx.chapter({ n: 2, title: 'The Hatchery', emoji: '🥚', at: [x, z], face: angle, env: 'indoor' | ['day', {...}], cam: {yaw, pitch, dist}, music, setup: () => {} })`
- `ctx.finish()` — celebration, summary of everyone thanked, back to the table. Call it exactly once at the end.
**Sound**: `ctx.audio.play(name)` — pop click ding coin success fanfare thanks whoosh step dig plant splash water fizz pour cork clink thud knock hammer saw snip stitch machine steam fire engine honk beep register gobble cluck peep buzz moo neigh bird wave wind bubble boing bounce error sparkle pickup drop horn bell kiln.
`ctx.audio.music('farm'|'factory'|'old'|'travel'|'town'|'calm'|'table')`. Custom: `ctx.audio.tone(freq, sec, {type, to, vol})`, `ctx.audio.noise(sec, {freq, to, q, vol})`.

## Performance (important)
Many computers that will run this have no graphics card. The cost is almost entirely the **number of separate objects drawn**.
- Put all scenery of a zone in one Group and `ctx.addStatic()` it → 1–3 draws for the whole zone.
- Only things that move or change are added with `ctx.add()`. If such a thing is built from several primitives, `bake()` it first so it is 1 draw.
- A person costs ~8 draws. Keep ≤ ~6 people visible at once. For a crowd in the distance, pose a person then `bake(person)` (a statue: 1 draw).
- Budget: **≤ 90 draws** in any view (`?debug=1` shows the number; `__game.info().calls` in tests). Signs/emoji sprites/transparent things cost 1 draw each.
- `ctx.addStatic()` cuts big baked scenery into ~24 m tiles; tiles outside the camera's view or wholly beyond the fog are not drawn. Things you `ctx.add()` yourself are only skipped when outside the view, so hide a zone's own moving objects when the player is in another zone.

- On computers without a graphics card the game also makes round shapes a little coarser by itself (kit `lowDetail()` is true there; a scene may skip tiny decorations when it is). Triangles cost too: keep a zone under roughly 15–20 thousand where you can.

## Build & test
```
node ~/.local/share/thanksgiving-dev/tools/build.mjs --only <id>     # → /tmp/tt/<id>/index.html (just that adventure, no table)
node ~/.local/share/thanksgiving-dev/tools/build.mjs                 # → the whole game in ~/thanksgiving-table/
```
URL options: `?adv=<id>` start in an adventure · `debug=1` fps/draw counter · `fast=1` instant transitions · `paused=1` only test steps advance time · `q=low|high` force quality.
In the browser console / tests, `__game` offers: `info()`, `await step(seconds)`, `await walkTo(x,z)`, `tp(x,z)`, `use()`, `interacts()`, `await auto(loops, log)` (walks to the nearest thing to do and presses E, repeatedly).
`tools/lib.mjs` opens the game in headless Chrome for scripted play-throughs and screenshots (see the top of that file).
Each story has a scripted play-through, `tools/play-<id>.mjs`, that plays it from start to finish and fails if it cannot; run it after changing a story or the engine.
