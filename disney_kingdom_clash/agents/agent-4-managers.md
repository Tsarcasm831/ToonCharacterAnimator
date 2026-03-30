# Agent 4 – Runtime Managers

Several manager modules coordinate gameplay. Their responsibilities are:

- `gridManager.js` – Creates the 2D grid, handles selection indicators and converts grid coordinates to Three.js world positions.
- `unitManager.js` – Spawns hero units, controls attack timers and merging logic. Applies passive abilities and deals damage to enemies.
- `enemyManager.js` – Spawns glitches based on wave data, moves them along the path and checks for end conditions. Applies status effects from abilities.
- `heroManager.js` – Tracks hero ability buttons and triggers effects defined in `abilities/heroAbilities.js`.
- `sceneManager.js` – Sets up lighting, camera controls and loads background textures for the chosen level.

Each manager exposes `init(scene, camera)` and `update(delta)` methods called from the main loop.
