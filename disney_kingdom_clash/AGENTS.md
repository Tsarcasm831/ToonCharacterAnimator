# Disney Kingdom Clash Agent Guide

This repository contains a browser-based prototype game built with JavaScript and the Three.js library. The codebase is organized into several directories that handle assets, data definitions, gameplay logic, UI screens and game state management. This document provides an overview so future agents can quickly find relevant files.

## Repository Structure

- `index.html` – Entry point that loads the main JavaScript bundle and CSS assets.
- `css/` – Stylesheets for the menus, modals and in-game HUD.
- `html/` – Static pages such as `lobby.html` used for multiplayer mockups.
- `assets/` – Images and sounds referenced by the game. Textures for heroes, UI elements, backgrounds and particle effects live here.
- `glitches/` – PNG artwork for enemy "glitch" models and their purified versions.
- `particles/` – Particle textures used by projectile effects.
- `instructions/` – JSON guides describing how to extend the project. `createhero.json` outlines steps to add a new hero.
- `js/` – Main application code. Subdirectories include:
  - `abilities/` – Logic for hero abilities and status effects.
  - `data/` – Static data files describing heroes, levels, waves and enemy glitches.
  - `managers/` – Runtime systems such as grid management, enemy spawning, hero management and scene setup.
  - `screens/` – HTML snippets for each UI overlay.
  - `ui/` – DOM utilities to inject HTML into the page.
  - `utils/` – Helper modules for particles, settings and user persistence.

## Key Entry Points

`js/game.js` is the central orchestrator. It preloads assets, initializes managers, hooks up UI events and starts the render loop. Gameplay happens inside an animation loop that calls update methods on managers and renders the Three.js scene.

Hero information is stored in `js/data/heroes/*.js`. Each file exports an object containing star level bonuses, level stats and ability definitions. All heroes are aggregated in `js/data/heroData.js`.

Enemy and wave configurations live in `js/data/glitchData.js` and `js/data/waveData.js`. Level backgrounds and trophy requirements are defined in `js/data/levelData.js`.

The `js/utils/user.js` module manages persistent user data such as owned heroes, decks and unlocked levels using `localStorage`.

## Extending the Game

A step-by-step guide for adding new heroes can be found at `instructions/createhero.json`. Abilities are implemented in `js/abilities/abilityHandlers.js` and `js/abilities/heroAbilities.js`.

Asset preloading occurs in `js/assets.js`. Models and textures are identified by keys; the asset loader creates placeholder geometry since real 3D models are not included.

## Agents Directory

Detailed documentation is provided in the `agents/` folder. Each file describes a subsystem or concept in depth so agents can work on specific tasks without reading the entire codebase. Start with `agents/index.md` for a directory of available guides.

