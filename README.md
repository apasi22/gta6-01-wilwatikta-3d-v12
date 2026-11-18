# WILWATIKTA 3D — Cerita Jalanan · 1998

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/apasi22/gta6-01-wilwatikta-3d-v12/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard)
[![reward](https://make.fun/badge/gta6-01/apasi22/gta6-01-wilwatikta-3d-v12/reward.svg)](https://make.fun/bounty/gta6-01)

An original open-world crime game set in the fictional Javanese city of
Wilwatikta, 1998. Play as Sugeng Wibowo: drive the Garuda GT through six
districts, outrun the WPD, hire a crew, and run 12 story missions — all in
raw WebGL with procedural models, textures and music. No libraries, no
network requests, nothing from Rockstar Games.

## Play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static
server). Staged views for screenshots: `?pose=chase`, `?pose=title`,
`?pose=night`, `?pose=map` (each freezes the clock and stages the scene;
`?ss=1` renders without supersampling on slow machines). Keyboard + mouse:

| Key | Action |
| --- | --- |
| WASD / arrows | Move / drive |
| Mouse drag / wheel | Camera orbit / zoom |
| Click | Shoot (on foot) |
| E | Enter / exit car |
| F | Punch |
| Q / 0–4 | Cycle / pick weapon |
| Space | Jump / drift handbrake |
| Shift | Run |
| M | Map |
| P / Esc | Pause |
| R | Radio station |
| Z / X / C / V | Hire crew |

## What is in the game

- A 6×6-district city: harbour, batik quarter, gold lane, alun-alun park,
  south beach, night market — plus the Java Sea, docks and skyline.
- On foot and by car: 6 stealable cars, traffic, pedestrians, day/night cycle.
- Wanted level 0–5: WPD pursuit cars and a police helicopter with searchlight.
- 12 story missions with checkpoints, timers, dialogue and pay; crew of 6
  with flat-vector portraits; 5-weapon loadout with numbered slots.
- HUD: round minimap with GPS route, respect bar, radio + vehicle panels,
  mission tracker, full map screen with stats and legend.
- Procedural WebAudio: gamelan-flavoured radio, engine hum, sirens, effects.
- Save / load via the title screen (localStorage).

## Layout

- `main.ts` — entry program: copies `game/` + `screenshots/` and writes the dossier.
- `game/index.html` — page, HUD, title and map screens.
- `game/src/` — one job per file: config, random, textures, mesh, city,
  render, input, audio, player, traffic, police, missions, hud, main.
- `screenshots/` — 4 real renders of the game's own code.

## License

MIT — see [LICENSE](LICENSE).
