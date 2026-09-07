# AGENTS.md

Vanilla HTML5 Canvas reimplementation of the arcade game Asteroids. No frameworks, no bundler, no dependencies, no package.json, no tests.

## Run / verify

- Open `index.html` directly in a browser (double-click), or `npx serve .` then visit `http://localhost:3000`.
- There is no build, lint, typecheck, or test step. To verify changes, reload the page and play manually; check the browser console for JS errors.

## Code layout

- `game.js` — all game logic in a single file, top-to-bottom: input handling → entity classes (`Bullet`, `Asteroid`, `Ship`, `Particle`) → global game state → `update`/`draw` → main `requestAnimationFrame` loop.
- `index.html` — defines the canvas (800×600, also hardcoded as `W`/`H` in `game.js`; change both together if resizing) and loads `game.js`.

## Gotchas

- **README.md is stale.** It claims power-ups and a "estrella fugaz" (shooting star) asteroid type, but neither exists in `game.js`. Trust the code, not the README.
- Tuning constants for gameplay are inline in `game.js` (e.g. `Ship` ROT/THRUST/DRAG, `RADII`/`SPEEDS`/`POINTS` arrays for asteroids) rather than centralized in a config object.
- Input is edge-triggered: `justPressed` records a key the first frame it's down, and `pressed(code)` consumes that single-shot trigger (used for firing, restart-on-game-over). Don't read `keys[...]` when you need a one-shot event.
- The coordinate space is toroidal: entities wrap around edges via the `wrap(v, max)` util; `W`=800 and `H`=600 are module-level constants.

## Language / notes

- Code and HUD strings are in Spanish (e.g. `NIVEL`, `PUNTAJE`, `GAME OVER`); keep new UI text in Spanish for consistency.
