# Project Overhaul: TFT-Style Auto-Battler Transformation

This document outlines the step-by-step implementation plan to convert the current Turn-Based Strategy engine into a Real-Time Auto-Battler (Teamfight Tactics style).

## Phase 1: Core Engine Refactor (Real-Time Logic)

*Target File: `CombatSystem.ts*`

The goal is to shift from `processTurn()` to a `delta-time` based update loop where all units act simultaneously based on their stats.

* [ ] **Remove Turn-Based Logic**
* Strip out `currentTurn`, `turnIndex`, and the `processTurn()` function completely.
* Remove the "Move -> Attack" strict sequence.


* [ ] **Implement the Update Loop**
* Create a public `update(deltaTime: number)` method.
* Connect this method to your main `Game.ts` render loop.


* [ ] **Add Attack Timers (Attack Speed)**
* Add `attackCooldown` (number) to the `CombatUnit` interface.
* **Logic:** In `update()`, increment a timer by `deltaTime`. When `timer >= 1 / stats.attackSpeed`, trigger an attack and reset the timer to 0.


* [ ] **Implement Mana & Abilities**
* Add `mana` and `maxMana` to `EntityStats`.
* **Logic:**
* Units gain `+10 mana` per auto-attack.
* Units gain `+X mana` based on pre-mitigation damage taken.


* When `mana >= maxMana`:
1. Pause the unit's attack timer (`isCasting = true`).
2. Play cast animation.
3. Execute Ability logic (Damage/Heal/Stun).
4. Reset mana to 0.




* [ ] **State Machine Implementation**
* Refactor `CombatUnit` to have a state property: `'IDLE' | 'MOVING' | 'ATTACKING' | 'CASTING' | 'STUNNED'`.



## Phase 2: AI & Movement

*Target Files: `CombatSystem.ts`, `CombatEnvironment.ts*`

Units must automatically find targets and move into range without player input during the combat phase.

* [ ] **Dynamic Targeting**
* In `update()`, if a unit has no target or the target is dead, scan `enemyUnits` for the closest entity.
* **Optimization:** Only scan for targets every 0.5s, not every frame.


* [ ] **Auto-Movement Logic**
* If `distanceToTarget > range`:
* Calculate path to the nearest hex *adjacent* to the target.
* Move the unit towards that hex.


* If `distanceToTarget <= range`:
* Switch state to `'ATTACKING'`.




* [ ] **Grid Modification**
* Reduce `CombatEnvironment` grid size.
* **Current:** 22x22 (Too large).
* **Target:** 7x8 (Standard auto-battler size).


* Hard-code rows 0 and 7 as "Bench" slots (non-combat zones).



## Phase 3: The Economy & Game Loop

*Target Files: `Game.ts`, `GameHUD.tsx*`

Implement the macro-game: buying units, earning gold, and managing phases.

* [ ] **Game Phases Manager**
* Implement a state manager for the flow:
1. **Planning (30s):** Shop open, units movable, interest calculated.
2. **Combat (Variable):** Units locked, AI runs, HP bars deplete.
3. **Resolution:** Loser takes damage, gold distributed, round counter `++`.




* [ ] **Player Stats**
* Add a `PlayerState` object containing:
* `Gold` (Start with ~50 for testing).
* `XP` / `Level` (Determines shop tier odds).
* `Health` (Start at 100).
* `WinStreak` / `LossStreak`.




* [ ] **Shop System**
* Create a `ShopManager` class.
* **Reroll:** Generate 5 units based on player level probabilities.
* **Buy:** Click card -> Deduct Gold -> Spawn unit on Bench.
* **Sell:** Drag unit to "Sell Zone" -> Destroy unit -> Refund Gold.



## Phase 4: Unit Mechanics (Stars & Traits)

*New Files: `SynergyManager.ts`, `UnitDatabase.ts*`

* [ ] **Star Rating (Merging)**
* Implement a listener on "Unit Buy":
* Scan Bench and Board.
* If 3 copies of the same Unit (e.g., 3x 1-Star Archer) exist:
* Delete all 3.
* Spawn 1x 2-Star Archer (Stats x1.8).






* [ ] **Trait System**
* Define traits (e.g., *Infernal, Ranger, Knight*).
* **Synergy Check:**
* At the start of Combat Phase, count unique units per trait.
* Example: If `Knights >= 2`, apply `+15 Damage Reduction` to all Knight units.





## Phase 5: Interaction Overhaul

*Target File: `CombatInteractionManager.ts*`

* [ ] **Swap Logic**
* If dragging Unit A onto an occupied hex (Unit B) of the same team:
* Swap their positions instead of blocking the move.




* [ ] **Bench <-> Board Interaction**
* Allow dragging units freely between the active board grid and the bench slots.
* **Constraint:** Prevent dropping units on the board if `UnitCount >= PlayerLevel`.


* [ ] **Item Equipping**
* Add `inventory` array to units (Max 3 items).
* Allow dragging Item entities onto Unit meshes to equip stats.



## Phase 6: UI & Visuals

*Target File: `GameHUD.tsx*`

* [ ] **World-Space Health Bars**
* Remove the top-left generic stats box.
* Attach an HTML/Canvas overlay to every unit position in 3D space.
* Show: Health (Green), Mana (Blue), and Star Level.


* [ ] **Shop UI**
* Create a bottom-center HUD panel.
* Display 5 Unit Cards, Reroll Button, and Buy XP Button.


* [ ] **Synergy Tracker**
* Create a left-side panel listing active traits (e.g., "3/6 Mages").



---

## Appendix: Data Structure Example

Create a centralized `UnitData.ts` to drive the Shop and Stats:

```typescript
export const UNIT_DATABASE = {
  "Ranger_T1": {
    name: "Forest Archer",
    cost: 1,
    traits: ["Wild", "Sniper"],
    stats: { 
      health: 450, 
      mana: 0, 
      maxMana: 60, 
      damage: 45, 
      attackSpeed: 0.7, 
      range: 4 
    },
    ability: {
      id: "quick_shot",
      description: "Next attack deals double damage."
    }
  },
  "Paladin_T4": {
    name: "Sun Keeper",
    cost: 4,
    traits: ["Divine", "Guardian"],
    stats: { 
      health: 900, 
      mana: 50, 
      maxMana: 120, 
      damage: 80, 
      attackSpeed: 0.6, 
      range: 1 
    },
    ability: {
      id: "holy_nova",
      description: "Heals allies for 300 and stuns enemies."
    }
  }
};

```