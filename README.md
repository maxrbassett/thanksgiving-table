# The Thanksgiving Adventure

*Your meal has a story – and thousands of people to thank.*

A 3D learning game that runs in a web browser. You sit at a Thanksgiving table with a chatting, laughing family.
Eight glowing orange push-buttons sit on the table next to things (the family tells you about them). Push one and you dive into a short walk-around
adventure that shows how that thing reached the table — and thanks the people who made it possible.

| Button on the table | Adventure | Where its facts come from |
|---|---|---|
| by the roast turkey | 🦃 The Turkey | your document “Thanksgiving Dinner – The Turkey” |
| by the cranberry dish | 🥫 Cranberry Sauce | your document “Thanksgiving Dinner – Cranberry Sauce” |
| by a plate | 🍽️ The China Plates | your document “Thanksgiving Dinner – China” |
| on a corner of the cloth | 🧵 Grandma's Tablecloth | your document “Grandma's Tablecloth” |
| by the bottle | 🥂 Sparkling Grape Juice | your document “Sparkling Celebratory Drinks” |
| by the bowl of mash | 🥔 Mashed Potatoes | no document — simple, well-known facts only |
| on a table leg | 🌳 The Wooden Table | no document — simple, well-known facts only |
| by the pie | 🥧 Pumpkin Pie | an extra story; no document — simple, well-known facts only |

`STORIES.md` lists, for every adventure, what the player does, each “In real life” one-liner and everyone thanked.

## Open it
- On this desktop: menu **Shortcuts → Open the Thanksgiving Adventure** (or open `index.html` in this folder with the browser).
- On another computer: copy `Thanksgiving-Adventure-single-file.html` and double-click it. It needs no internet and no installation.

## Controls
| | |
|---|---|
| Look around the table | drag with the mouse; scroll to zoom |
| Start an adventure | push a glowing orange button on the table (hover to see its name) |
| Choose who you are | “You are … · change”, bottom left at the table — any of the eight family members |
| Walk | W A S D or the arrow keys |
| Do something | walk up to a bubble and press **E** (or Space, or click the bubble); some need the key held down |
| Little games | some steps open a small game about what you are doing right then (sort, tap in time, hold and let go, steer, remember an order…); use the keys above, the mouse, or the big buttons on a touch screen — a wrong try only nudges you |
| Turn the camera | drag with the mouse |
| Sound on/off | the speaker button, or **M** |
| Sharper picture | the **HD** button (only shown on computers without a graphics card; sharper but slower) |
| Back to the table | the house button, top left |

On a touch screen (phones and tablets, held upright or sideways): a round walking pad sits in the bottom-right corner during an adventure — put a thumb on it and push in the direction to walk; drag anywhere else to look around; tap the bubbles (keep a finger on the ones that say “hold”), and play the little games with their big buttons. Pop-ups rearrange themselves to fit the screen. Pictures of the phone view are in `mobile-screenshots/`.

Each adventure takes about 5 to 9 minutes and has four to six little games along the way (all listed in `STORIES.md`). A finished adventure turns its button green, and the table keeps count of the
kinds of helpers you have thanked. Progress and your chosen character are remembered by the browser.

## Putting it online for many players
Upload **everything inside the `website` folder** (including the hidden `.htaccess` file) to any ordinary web host — for example Netlify (drag the folder onto app.netlify.com/drop), GitHub Pages, Cloudflare Pages, or a school web server. No server program, database or accounts are needed.
`Thanksgiving-Adventure-website.zip` is that same folder as one zip file, for hosts that take a zip (itch.io, Netlify) or for sending to whoever runs your website. The game works from any address or sub-folder (checked from `/thanksgiving/` on a test server).

The folder and the zip are made fresh by every rebuild (menu **Shortcuts → Rebuild game + website folder and zip**, or the command at the end of this page), so deploying an update is: rebuild, upload the folder again.

- **Why many players at once is easy:** each player's own computer or tablet runs the whole game. The web host only hands out two files, once: about 0.5 MB per player after the host's normal compression (about as much as one photo). Thirty players starting together download about 15 MB in total.
- **Repeat visits** load the game from the browser's cache. The game file's name changes with every rebuild (for example `app.155fd5c718.js`), so after an update everyone gets the new version on their next visit and nobody is stuck with an old copy. The `_headers` (Netlify, Cloudflare) and `.htaccess` (Apache) files tell the host to do exactly this.
- **Nothing leaves the player's device:** progress and the chosen character are kept in that browser only; the game asks for nothing from the internet once loaded.
- **Slow connections** see "Setting the table…" with a bobbing turkey until the game is ready.
- The single file `Thanksgiving-Adventure-single-file.html` is the other way to share it: email it, put it on a shared drive or a USB stick; it works without internet.

## Good to know
- **Speed.** This desktop has no graphics card, so here the game runs at roughly 10–20 pictures a second and a little blurry
  (it lowers its own picture quality to cope). On an ordinary laptop or desktop it runs smoothly, sharp, and with shadows.
- **Look.** Everything is drawn by the program itself from shapes — there are no downloaded 3D models or photos. The people are chunky low-poly figures on purpose (arms bend at the elbow; legs stay stiff).
- **Emoji.** Icons are emoji drawn by the computer's own emoji font, so they look a little different from one computer to another.
- **Sound.** All sound and music is made by the program; there are no voices — the family "talks" in speech bubbles and cartoon babble. The sound pauses while the game's tab is hidden or the tablet is locked, and carries on when the player comes back.

## What is in this folder
- `index.html` + `app.js` — the game (open index.html).
- `Thanksgiving-Adventure-single-file.html` — the same game in one file, for sharing.
- `website/` — the game ready to upload to a web host (see "Putting it online"), and `Thanksgiving-Adventure-website.zip` — the same as one zip.
- `mobile-screenshots/` — what the game looks like on a phone, upright and sideways.
- `STORIES.md` — the content of every adventure in plain words.
- `src/` — the source. `src/adventures/` has the adventures (one main file each); `src/table/table.js` is the dining room;
  `src/core/` is the shared engine. `src/API.md` explains how an adventure is written.

After changing anything in `src/`, rebuild with (in a terminal):

    node ~/.local/share/thanksgiving-dev/tools/build.mjs

(This also refreshes the `website` folder and the zip.)
