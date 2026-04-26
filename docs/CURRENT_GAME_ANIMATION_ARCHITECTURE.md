# Current Game Animation Architecture
> Discovery report — read-only, no files modified.  
> Generated: 2026-04-25

---

## 1. Project Basics

### Engine / Framework
- **Renderer:** Three.js (`three@^0.182.0`). No Unity, Unreal, Godot, or Phaser.
- **UI Layer:** React 19 + ReactDOM, rendered over the Three.js canvas.
- **Styling:** TailwindCSS v4, PostCSS.
- **State:** Zustand v5, React hooks.
- **Build tool:** Vite 6 with `@vitejs/plugin-react`.
- **Language:** TypeScript (`~5.8.2`) throughout — both game logic and UI.

### Main Runtime Language
TypeScript compiled to ES2020 via Vite/Rollup. No Python, Rust, or C++ in the main game bundle.

### How the App Starts
1. `index.html` → mounts `<div id="root">`.
2. `index.tsx` → `ReactDOM.createRoot(...).render(<GlobalProvider><App/></GlobalProvider>)`.
3. `App.tsx` → reads `useGameState()` hook (hash-based routing).
4. When the user navigates to `#game/<scene>`, the `Game` page renders a scene component (`Town2Scene`, `CombatScene`, etc.).
5. Each scene component instantiates `game/core/Game.ts` and calls `game.start()`.
6. `Game.ts` starts a `requestAnimationFrame` loop (`animate()`), which calls `Player.update()` → `PlayerAnimator.animate()` each frame.

### Important Package / Config Files
| File | Purpose |
|---|---|
| `package.json` | Dependencies, `dev`/`build`/`lint` scripts |
| `vite.config.ts` | Build config, chunk splitting, static asset handling |
| `tsconfig.json` | TypeScript config |
| `postcss.config.mjs` | TailwindCSS pipeline |
| `types.ts` | Shared TypeScript types (`PlayerConfig`, `PlayerInput`, `ActiveScene`, etc.) |

### Current Folder Structure (relevant parts)
```
/
├── game/
│   ├── core/           Game.ts, RenderManager.ts, EnemyCache.ts
│   ├── player/         Player.ts, PlayerLocomotion.ts, PlayerCombat.ts, PlayerInteraction.ts,
│   │                   PlayerAnimator-adjacent input handlers, actions/
│   ├── animator/       PlayerAnimator.ts, ActionAnimator.ts, LocomotionAnimator.ts,
│   │                   StatusAnimator.ts, SkirtPhysics.ts, AnimationUtils.ts,
│   │                   actions/  (16 action modules)
│   │                   stateMachine/  StateMachine.ts + states/
│   ├── model/          PlayerModel.ts, PlayerMeshBuilder.ts, BodyMorpher.ts,
│   │                   PlayerMaterials.ts, mesh/ (builders), equipment/
│   ├── entities/       BaseEntity.ts, HumanoidEntity.ts, NPC subtypes, animals
│   ├── managers/       InputManager, SoundManager, ParticleManager, SceneManager, etc.
│   ├── environment/    Environment classes, DoorManager, buildings
│   ├── gameLoop/       GameLoopManager + campaign sub-systems
│   ├── builder/        LevelGenerator, BuilderManager
│   └── vfx/            ChakraNetwork
├── components/
│   ├── CombatScene.tsx, Town2Scene.tsx, etc.
│   └── ui/             React UI panels, pages, menus
├── hooks/              useGameState, useCombatState, etc.
├── contexts/           GlobalContext
├── data/               constants.ts, stats.ts, JSON/TS data files
├── public/assets/      Audio (opus), video, images
├── ai4animationpy.pinokio.git/  AI4AnimationPy Pinokio launcher (separate git subtree)
└── standalone_cc/      Separate sub-project (own package.json, built separately)
```

---

## 2. Current Player System

### Where Player Code Lives
`game/player/` contains the full player subsystem:
- `Player.ts` — root class, owns all sub-systems
- `PlayerLocomotion.ts` — physics, movement, jumping, ledge-grab
- `PlayerCombat.ts` — combat state machine, delegates to `actions/`
- `PlayerInteraction.ts` — NPC/object interaction (static update method)
- `PlayerInventory.ts` — item management
- `PlayerStatusHandler.ts` — death/ragdoll/recovery timer
- `PlayerCameraHandler.ts` — blink timer, gaze, head-look weight
- `PlayerDebug.ts` — hitbox/skeleton debug overlays
- `PlayerUtils.ts` — raycasting helpers (ground height, terrain)
- `actions/` — combat input actions: `BaseAction.ts`, `MeleeAction.ts`, `BowAction.ts`, `FireballAction.ts`

### How the Player Is Created / Spawned
In `game/core/Game.ts` constructor:
```ts
this.player = new Player(scene, soundManager);
```
`Player` constructor:
1. Calls `new PlayerModel(config)` → builds Three.js geometry from scratch (no GLB/FBX load).
2. Adds `model.group` to the scene at position `(-24, 0, 50)`.
3. Creates all sub-system instances and wires them together.

### How Movement Is Handled
`PlayerLocomotion.update(dt, input, cameraAngle, obstacles, isInCombat)` — called from `Player.update()`:
- Reads `PlayerInput.x`, `PlayerInput.y` (analog stick / WASD mapping, range -1 to 1).
- Applies gravity, jump arc, water resistance.
- Handles ledge-grab detection and climb interpolation.
- Outputs `this.position`, `this.velocity`, `this.rotationY`.
- `Player.update()` copies these to `model.group.position` / `model.group.rotation.y`.

### How Input Is Handled
`game/managers/InputManager.ts` produces a `PlayerInput` object each frame, consumed by:
- `Player.update()` directly (wave, death toggle, waveTimer).
- `PlayerLocomotion.update()` (movement, jump, crouch, run).
- `PlayerCombat.update()` (attack1/2, aim, fireball, etc.).
- `PlayerInteraction.update()` (interact key).

`PlayerInput` is defined in `types.ts` and includes: `x, y, jump, wave, leftHandWave, attack1, attack2, isRunning, isDead`, etc.

### How the Player Visual Body Is Represented
Fully **procedural Three.js geometry** — no loaded mesh files. `PlayerMeshBuilder.build()` assembles:
- `THREE.CylinderGeometry`, `THREE.SphereGeometry`, `THREE.BoxGeometry` primitives.
- Organized into a hierarchy of named `THREE.Group` objects.
- Key named parts stored in `player.model.parts` (a plain object with keys like `hips`, `torsoContainer`, `neck`, `head`, `leftArm`, `rightArm`, `leftForeArm`, `rightForeArm`, `leftHand`, `rightHand`, `leftThigh`, `rightThigh`, `leftShin`, `rightShin`, `mouth`, etc.).
- Additional arrays on `PlayerModel`: `rightFingers`, `leftFingers`, `rightThumb`, `leftThumb`, `eyes`, `eyelids`, `irises`, `pupils`, `forefootGroups`, `heelGroups`.
- Materials: `MeshToonMaterial` (toon shading) via `PlayerMaterials`.
- `BodyMorpher` applies body-shape morphing (average/muscular/slim/heavy) by scaling bone groups.
- Equipment (`helmet`, `shield`, `quiver`, `heldItem`, pauldrons) is attached to joints at runtime by `PlayerEquipment`.

---

## 3. Current Animation System

### Where Animation Code Lives
All animation logic lives in `game/animator/`:
| File | Role |
|---|---|
| `PlayerAnimator.ts` | Top-level orchestrator — priority stack, calls sub-animators |
| `ActionAnimator.ts` | Delegates to action modules for non-locomotion actions |
| `LocomotionAnimator.ts` | Delegates to IdleAction, MovementAction, JumpAction |
| `StatusAnimator.ts` | Death and ragdoll animations |
| `SkirtPhysics.ts` | Per-vertex cloth simulation on skirt geometry |
| `AnimationUtils.ts` | Shared helpers: `playerModelResetFeet`, `applyFootRot`, `animateBreathing` |
| `actions/` | 16 individual action modules (see Section 4) |
| `stateMachine/StateMachine.ts` | Generic FSM interface + `changeState` / `update` |
| `stateMachine/states/LocomotionStates.ts` | `IdleState`, `MoveState`, `JumpState` — wrap LocomotionAnimator |

### Animation Type
**100% procedural, real-time keyframe-less animation.**  
- There are no animation clips, BVH files, FBX skeletal rigs, sprite sheets, or pre-baked pose data anywhere in the pipeline.  
- Every pose value is computed per-frame using `THREE.MathUtils.lerp`, `Math.sin`, `Math.cos`, timers, and normalized progress values (`p = timer / duration`).  
- This is the defining architectural characteristic of the codebase.

### How Actions Are Triggered
- Boolean state flags on `Player` (e.g., `player.isWaving`, `player.isPickingUp`) and on `PlayerCombat` (e.g., `combat.isPunch`, `combat.isAxeSwing`, `combat.isFiringBow`).
- `Player.update()` sets/clears flags based on `PlayerInput` and timers.
- `PlayerAnimator.animate()` checks flags in a **priority cascade** (ragdoll > death > ledge > fireball > bow > pickup > skinning > summon > fishing > wave > leftHandWave → locomotion → punch/axe/interact overlay).

### How Actions Update Over Time
Each action module is a static class with a single `static animate(player, parts, dt, damp, ...)` method.  
- Actions use a normalized timer (e.g., `p = combat.punchTimer / duration`) to drive `lerp`-based bone rotations through 2–4 hand-authored phases (windup, strike, recovery).
- Timers are owned by the sub-system (e.g., `PlayerCombat.punchTimer`) and advanced in `PlayerCombat.update()`.

### How Visual Pose Values Are Applied
Directly mutating `THREE.Object3D.rotation.x/y/z` (Euler) and `position.x/y/z` and `scale.x/y/z` on named parts from `player.model.parts`.  
Pattern:
```ts
parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, targetX, damp);
```
No quaternion blending, no skeleton/SkinnedMesh, no AnimationMixer.

### Existing AnimationController / StateMachine
- `StateMachine.ts` + `LocomotionStates.ts` — exist but are **not currently wired** into the live `PlayerAnimator` path. `PlayerAnimator` uses direct priority checks instead. The state machine is scaffolded for future use.
- `PlayerAnimator` itself acts as an informal controller via priority-ordered `if`/`else` chains.

---

## 4. Existing Action Modules

All files live in `game/animator/actions/` unless noted.

| Action | File | Class | Trigger Condition |
|---|---|---|---|
| **Idle** | `IdleAction.ts` | `IdleAction` | Default; no movement, no action flags |
| **Combat Stance Idle** | `IdleAction.ts` | `IdleAction.animateCombatStance` | `player.combat.isCombatStance === true` |
| **Movement (Walk/Run/Strafe)** | `MovementAction.ts` | `MovementAction` | `isMoving && !isJumping` |
| **Jump** | `JumpAction.ts` | `JumpAction` | `player.locomotion.isJumping === true` |
| **Punch (Unarmed, multi-combo)** | `PunchAction.ts` | `PunchAction` | `player.combat.isPunch === true` |
| **Weapon Swing (Sword/Knife/Axe/Staff/Halberd)** | `WeaponAction.ts` | `WeaponAction` | `player.combat.isAxeSwing === true` |
| **Fire Arrow (Bow Draw/Hold/Release)** | `FireArrowAction.ts` | `FireArrowAction` | `player.combat.isFiringBow === true` |
| **Fireball Cast** | `FireballAction.ts` | `FireballAction` | `player.combat.isFireballCasting === true` |
| **Climb (Ledge Grab)** | `ClimbAction.ts` | `ClimbAction` | `player.locomotion.isLedgeGrabbing === true` |
| **Interact** | `InteractAction.ts` | `InteractAction` | `player.isInteracting === true` |
| **Pick Up** | `PickupAction.ts` | `PickupAction` | `player.isPickingUp === true` |
| **Wave (Right Hand)** | `WaveAction.ts` | `WaveAction` | `player.isWaving === true` |
| **Left Hand Wave** | `LeftHandWaveAction.ts` | `LeftHandWaveAction` | `player.isLeftHandWaving === true` |
| **Fishing** | `FishingAction.ts` | `FishingAction` | `player.combat.isFishing === true` |
| **Skinning** | `SkinningAction.ts` | `SkinningAction` | `player.isSkinning === true` |
| **Summon** | `SummonAction.ts` | `SummonAction` | `player.combat.isSummoning === true` |
| **Creepy Smile / Camera Look** | `CreepySmileAction.ts` | `CreepySmileAction` | Timer-based; triggers after ~117s of player-camera contact |
| **Death** | `StatusAnimator.ts` | `StatusAnimator.animateDeath` | `player.status.isDead === true` |
| **Ragdoll** | `StatusAnimator.ts` | `StatusAnimator.animateRagdoll` | `player.isDragged || recoverTimer > 0` |
| **Breathing** | `AnimationUtils.ts` | `animateBreathing()` | Called from Idle, Jump, and others |
| **Skirt Physics** | `SkirtPhysics.ts` | `SkirtPhysics.animate` | Called after every base-layer pass |
| **Face / Blinking / Gaze** | `PlayerAnimator.animateFace()` | private | Called at end of every non-dead frame |

**Note:** There is no explicit `GetHit` animation module. Hit reactions are handled through the `StatusAnimator` (ragdoll/recover path) and combat knockback in `PlayerLocomotion`.

**Player-layer action logic** (physics/hitboxes, not animation) also lives in:
- `game/player/actions/MeleeAction.ts` — combo state machine, hit detection, punchTimer/axeSwingTimer management.
- `game/player/actions/BowAction.ts` — bow charge, draw state, arrow spawn.
- `game/player/actions/FireballAction.ts` — fireball cast state, projectile spawn.
- `game/player/actions/BaseAction.ts` — shared interface/base for player actions.

---

## 5. Asset / Data Pipeline

### Where Game Assets Live
- `public/assets/musicshrunk/` — 70 `.opus` audio files.
- `public/assets/videos/` — 20 video files.
- `public/assets/images/` — currently empty.
- `data/` — TypeScript/JSON data files (constants, land shapes, stats, timeline JSON).
- `data/sairon_timeline_data.json` — narrative timeline data.
- `data/lands/` — 40 land-definition files.

### Asset Formats Present
| Format | Location | Used For |
|---|---|---|
| `.opus` | `public/assets/musicshrunk/` | Background music / SFX |
| `.json` | `data/sairon_timeline_data.json` | Narrative data |
| `.ts` data | `data/constants.ts`, `data/stats.ts`, `data/landShape.ts` | Game balance / map data |
| `.ts` data | `data/lands/*.ts` | Per-land definitions |

**There are no GLB, GLTF, FBX, BVH, or sprite sheet assets in the current game pipeline.** The player and all humanoid entities are built entirely from Three.js primitives at runtime.

### Whether There Is Already a Data Folder for Runtime Content
- `data/` exists but currently holds **game balance data and map definitions**, not animation data.
- There is no `animations/` or `poses/` subfolder.

### How Assets Are Loaded at Runtime
- Audio: `SoundManager` loads `.opus` files via the Web Audio API or `<audio>` elements.
- Data: TypeScript `import` statements (tree-shaken at build time) — no dynamic JSON `fetch` for game logic.
- `vite.config.ts` includes `assetsInclude: ['**/*.glb', '**/*.gltf', ...]` — meaning the build system is **prepared** to bundle 3D assets, but none currently exist in the project.

### Build Process
- `npm run build` → `tsc --noEmit && vite build`.
- `predev`/`prebuild` also compile `standalone_cc/` (sub-project) and `darkest_clone/` (separate Vite config).
- `scripts/sync-external-apps.mjs` — copies compiled sub-apps into `public/`.
- Manual chunk splitting in `vite.config.ts`: `vendor-three`, `vendor-react`, `vendor-ui`, `game-runtime`, `game-systems`.

---

## 6. Repo Constraints

### Naming Conventions
- **Classes:** PascalCase (`PlayerAnimator`, `IdleAction`, `WeaponAction`).
- **Files:** PascalCase matching the exported class (`IdleAction.ts`).
- **Methods:** camelCase (`animateIdle`, `animatePickup`).
- **Parts dictionary keys:** camelCase body-part names (`leftArm`, `rightForeArm`, `torsoContainer`, `hips`).
- **Flags:** boolean prefix (`is*`, `was*`, `can*`): `isJumping`, `isCombatStance`, `wasPunchPressed`.
- **Timers:** `*Timer` suffix: `punchTimer`, `fishingTimer`, `waveTimer`.

### Code Style
- All animation code is written as **static utility classes** with a single `static animate(...)` entry point — no instances, no state stored inside action classes (state lives on the player/combat objects).
- `player: any` is used uniformly in animator functions — duck-typed against the player/entity shape, enabling NPC reuse without a formal interface.
- Damping is always computed as `N * dt` (e.g., `10 * dt`, `damp * 2`) and passed into `lerp`.
- Animation phases use `p = timer / duration` (normalized 0→1 progress), not time-absolute keyframes.

### Module / Import Style
- ES modules (`"type": "module"` in `package.json`).
- `import * as THREE from 'three'` at the top of every animation file.
- Named exports only (no default exports on class files).
- Path alias `@` → repo root, defined in `vite.config.ts`.
- Barrel file: `game/gameLoop/index.ts` re-exports from the gameLoop subsystem.

### Architectural Patterns Already in Use
- **Priority cascade** in `PlayerAnimator.animate()` — highest-priority state wins and returns early, lower states only run if no override is active.
- **Layered overlay** — base locomotion runs first, then combat/interaction overlays write only the arms (via `skipRightArm` flag propagation).
- **Static action modules** — each action is a self-contained static class; the animator just calls `XxxAction.animate(player, parts, dt, damp)`.
- **Sub-system decomposition** — `Player` owns `PlayerLocomotion`, `PlayerCombat`, `PlayerStatus`, `PlayerCameraHandler`, `PlayerInventory`, each with its own `update()`.
- **Duck-typed player context** — `player: any` lets `HumanoidEntity` NPCs reuse the same animator without extending `Player`.
- **Backup-before-edit rule** — `AGENTS.md` enforces `.bak` files before complex edits (many `.bak` and `.bak2` files exist).

### Obvious Risks / Fragile Areas
- **`player: any` everywhere** — no type safety in animator files; rename or restructure of `parts` keys would silently break animations.
- **Shared `walkTime` mutation** — `MovementAction` directly mutates `locomotion.walkTime`. If two animators run on the same entity concurrently, this would corrupt.
- **`StateMachine` is scaffolded but unused** — `PlayerAnimator` bypasses it with direct flag checks. The two mechanisms can diverge.
- **No animation data files** — all motion is hardcoded constants; changing a single pose requires a code edit and redeploy.
- **No GetHit animation module** — hit reactions fall through to ragdoll/recover, which may feel abrupt for lighter hits.
- **`parts` is a plain `any` object** — no registry or schema enforces which keys must exist; adding/removing a body part requires manually auditing all 16 action files.

---

## 7. AI4AnimationPy Readiness

Based only on the current repo state:

### Where AI4AnimationPy Should Be Added
The launcher is **already present** at `ai4animationpy.pinokio.git/` — this is a Pinokio launcher wrapping the upstream AI4AnimationPy project. It is a separate git subtree/submodule, not integrated into the game build.

For source reference and offline tooling, the canonical location should remain:
- **`/ai4animationpy.pinokio.git/`** — the existing Pinokio launcher (do not modify).
- **`/external/ai4animationpy/`** — if a clean Python toolchain clone is needed independently of Pinokio (no build pipeline conflict with the main Vite project).

### What Format the Game Should Consume
The game currently has **no animation loader**. The safest integration path is:
- **JSON files** — the game already loads JSON (`data/sairon_timeline_data.json`), `vite.config.ts` already `assetsInclude`s glb/gltf, and `fetch`-based runtime loading is straightforward in the existing architecture.
- Each exported file should represent **one action** as a flat array of per-frame bone rotation values (Euler XYZ per named part, matching the existing `parts` key names).
- GLB/GLTF with `AnimationMixer` is also viable once Three.js `SkinnedMesh` is introduced, but that would require replacing the current procedural mesh — a much larger change.

### Where Offline Conversion Tools Should Live
- **`/tools/`** — a new top-level folder, excluded from the Vite build (`vite.config.ts` does not glob `tools/`).
- Inside: Python scripts that read AI4AnimationPy output (BVH, bone rotations, etc.) and export to the game's JSON format.
- This folder should never be imported by any game source file.

### Where Exported Animation Data Should Live
- **`/public/animations/`** — served statically by Vite's dev server and copied to `dist/` at build time.
- Or **`/data/animations/`** if bundling into the JS chunk is preferred (less likely for large datasets).
- Suggested naming: `public/animations/<action_name>.json` (e.g., `public/animations/idle.json`, `public/animations/punch.json`).

### What Existing Game Files Would Eventually Need to Read That Data
1. **`game/animator/PlayerAnimator.ts`** — top-level orchestrator; would need a new branch to dispatch to a clip-based path instead of calling the procedural action module.
2. **Individual action modules** (e.g., `IdleAction.ts`, `PunchAction.ts`) — would either be replaced by or augmented with a clip playback call.
3. **A new `AnimationClipLoader.ts`** (to be created in `game/animator/`) — responsible for `fetch`-ing JSON, caching clips, and providing frame-sample lookup.
4. **`game/model/PlayerModel.ts` / `PlayerPartsRegistry.ts`** — would need a stable parts key→bone mapping registry to map JSON bone names to `parts.*` references.

### What Should Not Be Touched Yet
- `game/player/PlayerLocomotion.ts` — physics is independent of animation; do not couple.
- `game/model/PlayerMeshBuilder.ts` and all `mesh/` builders — geometry construction is separate.
- `game/player/PlayerCombat.ts` and `actions/` — combat logic and hit detection are separate from visual animation.
- `standalone_cc/` and `darkest_clone/` — entirely separate sub-projects.
- `ai4animationpy.pinokio.git/` — Pinokio launcher, has its own rules (`AGENTS.md` inside it).

---

## 8. Recommended Integration Strategy

### Stage 0 — Repo Documentation / Discovery
- ✅ **This document** — factual architecture baseline.
- Create `/tools/` folder (empty, gitignored for Python venvs).
- Create `/public/animations/` folder (empty, with a `.gitkeep`).
- Confirm the `parts` key registry — list every key that all 16 action modules reference and document it as a schema.

### Stage 1 — Add AI4AnimationPy as Isolated External Reference
- No game code changes.
- Verify the existing Pinokio launcher at `ai4animationpy.pinokio.git/` installs and starts cleanly.
- If a standalone Python clone is needed: `git clone` into `/external/ai4animationpy/`, add to `.gitignore`.
- Run the upstream Actor Viewer demo to confirm BVH/motion data can be read.
- Do not import anything into the Vite build.

### Stage 2 — Create Offline Exporter / Converter
- Write `/tools/export_animation.py` (Python).
- Input: BVH file or AI4AnimationPy motion output.
- Processing: Remap bone names to the game's `parts` key names (e.g., `"LeftArm"` → `"leftArm"`), resample to target FPS (30 or 60), normalize rotations to Euler XYZ in radians.
- Output: `/public/animations/<action_name>.json` with schema:
  ```json
  {
    "action": "idle",
    "fps": 30,
    "frameCount": 90,
    "bones": ["hips", "torsoContainer", "leftArm", ...],
    "frames": [[...rotations...], ...]
  }
  ```
- Validate output against the `parts` key registry from Stage 0.
- No game code changes in this stage.

### Stage 3 — Create Runtime Animation Loader
- New file: `game/animator/AnimationClipLoader.ts`.
- Responsibilities: `fetch` JSON from `/animations/`, parse frames, cache by action name, provide `sampleFrame(action, normalizedTime)` returning a `Record<string, {rx, ry, rz}>`.
- New file: `game/animator/ClipAction.ts` — a single static `animate(player, parts, dt, clipData)` that applies sampled rotations via `lerp` (same pattern as existing action modules).
- Wire into `PlayerAnimator` behind a feature flag (e.g., `player.config.useClipAnimation`).
- No existing action modules modified yet.

### Stage 4 — Wire One Test Animation into One Action
- Replace **one** procedural action module call in `PlayerAnimator` with the clip path (see Stage 5 for which action to pick).
- A/B test visually against the procedural version.
- Validate `tsc --noEmit` (lint) passes.
- Validate all other actions are unaffected.

### Stage 5 — Expand Only After Proof of Concept Works
- Progressively replace remaining action modules.
- Consider whether to keep procedural modules as fallback (graceful degradation if JSON not loaded).
- Only then evaluate replacing the procedural mesh with `SkinnedMesh` + GLTF if skeletal animation quality justifies the migration cost.

---

## 9. First Proof-of-Concept Recommendation

### Recommended First Action: **Idle**

**File:** `game/animator/actions/IdleAction.ts`  
**Class:** `IdleAction`  
**Trigger:** Default state — no flags active, no movement.

### Why Idle Is the Safest Choice

1. **No state dependencies.** `IdleAction` reads only `player.locomotion.walkTime` and `player.config.bodyType`/`isCombatStance`. It has no timers to track, no multi-phase progress variable, and no side effects (does not spawn projectiles, does not modify hitboxes).

2. **Lowest interrupt risk.** Idle is the terminal fallback in `PlayerAnimator`'s priority cascade — it only runs when everything else is false. Replacing it does not affect any other action.

3. **Visually obvious but forgiving.** A broken idle is immediately visible (T-pose or wrong pose), making debugging easy, but a slightly imperfect idle does not break gameplay.

4. **Covers the most bones.** Idle sets nearly every part in `model.parts` (hips, torso, neck, head, all arm/leg segments). A successful idle clip proves the loader, the parts registry mapping, and the JSON schema all work end-to-end.

5. **No combat coupling.** Unlike `PunchAction` or `WeaponAction`, idle has no dependency on `PlayerCombat` state, so it can be tested in any scene without initiating combat.

6. **Loops cleanly.** An idle animation is expected to loop, making frame-wraparound in the clip sampler easy to test.

**Do not implement yet.** This recommendation is for planning purposes only.

---

## Appendix: Parts Key Registry (Documented from Source)

The following `parts.*` keys are actively referenced across the 16 action modules and `PlayerAnimator`. Any new animation loader must map to these exact names:

```
hips
torsoContainer
torso
chest
neck
head
mouth
pelvis
leftArm       rightArm
leftForeArm   rightForeArm
leftHand      rightHand
leftThigh     rightThigh
leftShin      rightShin
shirt         (object with .torso, .shoulders[])
```

Special arrays on `PlayerModel` (not in `parts` dict):
```
player.model.rightFingers[]   player.model.leftFingers[]
player.model.rightThumb       player.model.leftThumb
player.model.eyes[]           player.model.eyelids[]
player.model.irises[]         player.model.pupils[]
player.model.forefootGroups[] player.model.heelGroups[]
```

Foot sub-children accessed by name string:
```
foot_anchor   (child of leftShin/rightShin)
heel          (child of leftShin/rightShin)
forefoot      (child of leftShin/rightShin)
proximal      (child of finger group)
distal        (child of proximal)
```
