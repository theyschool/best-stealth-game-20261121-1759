# best-stealth-game-20261121-1759

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/theyschool/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/theyschool/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**MOONSHIFT** — an original top-down stealth game set in a night archive, drawn entirely in code on a canvas. You are a courier in a pale coat slipping a parcel through three floors of shelving, crates, planters and statues while guards in dark red patrol with amber vision cones that are occluded by cover. Each floor offers a bold lamplit route (fast, but you are noticed sooner in the light) and a slow dark route behind the shelves. Per-guard suspicion rises when you are in a cone — faster up close, at full pace, or in lamplight — and drains when you break line of sight, so a glimpse is recoverable; a full meter makes the guard shout, the HUD's ALARM meter gains a chunk, and the guard chases. Fill the alarm or get grabbed and the floor restarts. Creep with Shift to move silently (normal steps shed footstep rings, and guards' steps shed fainter rings so you can feel an approach), lift the 3 glowing intel folders per floor for score, and reach the green exit door unseen. After floor 3 a score panel rates your time, intel and times spotted.

Controls: WASD or arrow keys to move, hold Shift to creep, R to run it again after the final panel. The game auto-starts straight into floor 1.

The source is split one job per file under `game/src/`: `levels.js` (the three floor layouts), `guards.js` (patrols, vision cones, suspicion), `game.js` (state, alarm, level flow), `render.js` (floor, light, cones, actors, HUD), `audio.js` (tiny WebAudio footsteps and stings), `shots.js` (the deterministic `?shot=` scenes the screenshots were taken from) and `main.js` (boot, input, loop).

## Run it

```sh
node serve.ts --port 8931   # then open http://localhost:8931
node main.ts                # hand-in: copies game/ + screenshots/ to /output and writes dossier.json (or set MAKEFUN_OUTPUT_DIR)
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=w0xx5wp9&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
