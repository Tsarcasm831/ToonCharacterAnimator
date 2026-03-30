# Agent 1 – Gameplay Overview

This guide explains the overall flow of the game and how the major pieces interact.

1. **Initialization** – `js/game.js` loads. It preloads textures and sounds through `js/assets.js` then initializes managers like Grid, Unit, Enemy and Hero.
2. **Scene Setup** – `managers/sceneManager.js` creates a Three.js scene, camera and lights based on level data. The grid is laid out via `gridManager.js`.
3. **UI Screens** – HTML snippets from `js/screens/` are injected by `js/ui/domManager.js`. Buttons in the menu call functions exported from various modules.
4. **Game Loop** – `game.js` starts an `animate()` loop using `requestAnimationFrame`. Each frame updates the managers and renders the scene.
5. **Units and Enemies** – `unitManager.js` handles player units on the grid. `enemyManager.js` spawns and updates enemy glitches defined in `data/waveData.js`.
6. **Victory/Defeat** – When the final wave is cleared or enemies reach the goal, `endGame()` in `game.js` displays the game over modal and updates user stats.
