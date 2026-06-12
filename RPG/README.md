# RPG — Thornwood Vale

A self-contained action-RPG scene: create a character, survive the wilds of
**Thornwood Vale**, walk the road into the walled town of **Briarhollow**,
trade with its residents, and hunt the wolf packs that plague the vale.

Registered as scene id `rpg` (main menu → "RPG Adventure", hash `#game/rpg`).

## Module map

| Path | Responsibility |
|---|---|
| `RPGScene.tsx` | React shell (Defense.tsx pattern): mounts `RPGGame` in one `[]`-deps effect, composes every UI overlay, owns the boot flow (continue / new game / character creation). |
| `game/RPGGame.ts` | The engine orchestrator: RenderManager, InputManager, CameraManager, SoundManager, ParticleManager, Player, world, directors, frame loop, interaction prompts, store sync. |
| `world/RPGWorld.ts` | Terrain mesh from `data/worldLayout.terrainHeightAt`, lake water, trees/rocks/grass scatter, camp & decor, PlayerUtils sampler registration (build) + cleanup (dispose). |
| `world/TownBuilder.ts` | Briarhollow: palisade walls + gate, blueprint buildings, paths, plaza/fountain, props, doors (returns Door instances for the DoorManager). |
| `entities/WolfDirector.ts` | Spawns `WildWolf` packs per `worldLayout.WOLF_DENS`, respawn timers, loot/XP hooks. |
| `entities/NPCDirector.ts` | Spawns town NPCs from `data/npcs.ts`, behaviors, interaction `userData` tagging. |
| `state/rpgStore.ts` | Zustand store — the ONLY gameplay state. Engine uses `useRPGStore.getState()` / `subscribe`; React uses hook selectors. |
| `state/saveSystem.ts` | localStorage quicksave (debounced), save-to-file every 10 min (File System Access API + IndexedDB-persisted handle), export/import. |
| `data/*` | Item catalog (+prices/equip mappings), classes, NPC roster + dialogue, world layout (terrain math source of truth). |
| `ui/*` | Tailwind overlays: HUD, character creation, inventory, profile, trade, dialogue, container, death, pause. |

Reusable pieces added to the shared engine (RPG-import-free):

- `game/entities/animal/aggressive/WildWolf.ts` — territory-parameterized wolf
  (den/leash/aggro options, **deals damage to its target via callback**, death
  drops + skinnable corpse). The original `Wolf.ts` is hard-locked to the
  starter grove; `WildWolf` works on any map.
- `game/environment/objects/Container.ts` — procedural chest/barrel/crate with
  open-lid animation and `userData.interactType = 'container'` tagging. Drives
  both one-time loot containers and persistent stashes.

## Architectural rules

1. **`data/worldLayout.terrainHeightAt` is the terrain.** The ground mesh, the
   `PlayerUtils.setCustomTerrainSamplers` registration, prop placement and
   entity grounding all call it. Never sample the mesh.
2. **The store is the gameplay truth.** HP, gold, XP, inventory, equipment,
   containers, flags. The engine pushes events in (damage, pickups, kills) and
   reacts to revisions out (`configRevision` → re-sync `player.config`,
   `inventoryRevision` → `player.inventory.setItems`). The engine's
   `PlayerInventory` is a mirror, not a source.
3. **Engine ↔ store sync contract** (in `RPGGame`):
   - per frame: if `player.inventory.isDirty` → `setInventoryFromEngine(items)`,
     clear the flag (pickups/skinning flow engine → store).
   - subscribe `inventoryRevision` → `player.inventory.setItems(store.inventory)`.
   - subscribe `configRevision` → `Object.assign(player.config, character.config)`
     (model re-syncs itself per frame).
   - subscribe `phase`: `dead` → `player.status.isDead = true`; back to
     `playing` with a new `playerPosition` → teleport (set BOTH
     `player.locomotion.position` and `player.mesh.position`), `isDead = false`.
   - subscribe `activePanel`: any panel open → `inputManager.setBlocked(true)`
     + `controls.enabled = false`.
4. **Wolf damage scaling**: `WildWolf` is constructed with
   `getIncomingDamageBonus: () => store.getDamageBonus()` so gear/level scale
   player damage without touching `MeleeAction`'s fixed weapon table
   (Sword 5 / Axe 4 / Halberd 4 / other 1).
5. **PlayerUtils globals**: `RPGWorld.build()` sets
   `setCustomLandPolygon(WORLD_POLYGON)` + `setCustomTerrainSamplers(...)`;
   `dispose()` clears both. The terrain mesh is tagged
   `userData.type = 'ground'` and registered in `obstacles`.
6. **Every mesh added to `obstacles` carries a `userData.type`** —
   `'ground' | 'hard' | 'soft' | 'creature' | 'pickup'`. Untagged = solid wall.
7. **Lighting**: one `LightingManager` (env-owned sun/sky/day-night),
   `renderManager.setBaseLightingEnabled(false)`, fog overridden from the
   black default to a daylight gradient that `RPGGame` re-tints by time of day.
8. **StrictMode**: the scene effect runs mount→cleanup→mount in dev. Dispose
   must be complete (rAF, listeners, autosave, RenderManager, PlayerUtils).

## Save format

`RPGSaveData` v1 (see `types.ts`): character (name/class/full appearance
config), progress (level/xp/gold/hp/kills/playtime), inventory, equipment,
container states, dialogue flags, time of day, last position.
Stored at localStorage `tca-rpg-save-v1`; optional linked `.json` file is
rewritten every 10 minutes.
