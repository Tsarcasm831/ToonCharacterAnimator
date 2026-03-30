import * as EnemyManager from '../managers/enemyManager.js';
import * as GameState from '../gameState.js';
import * as UI from '../ui.js';
import * as UnitManager from '../managers/unitManager.js';
import { HERO_DATA } from '../data/heroData.js';
import { applyFreeze, applySlow, applyBurn, applyCurse } from './statusEffects.js';
import * as THREE from 'three';
import * as HeroAbilityVfx from '../utils/heroAbilityVfx.js';

export const HERO_ABILITY_EFFECTS = {
    'elsa': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => applyFreeze(e, 5000));
        HeroAbilityVfx.triggerEffect('elsa', enemies.map(e => e.model.position));
    },
    'moana': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => EnemyManager.applyKnockback(e, 5.0));
        HeroAbilityVfx.triggerEffect('moana', enemies.map(e => e.model.position));
    },
    'buzz': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            EnemyManager.dealDamage(e, 150, null); // Hero abilities don't have a source cell
        });
        HeroAbilityVfx.triggerEffect('buzz', enemies.map(e => e.model.position));
    },
    'stitch': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            applyFreeze(e, 1000); // a short stun
            const chaosOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2
            );
            e.model.position.add(chaosOffset);
        });
        HeroAbilityVfx.triggerEffect('stitch', enemies.map(e => e.model.position));
    },
    'groot': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            applyFreeze(e, 4000);
            applySlow(e, 0.5, 10000); // 50% slow for 10s
        });
        HeroAbilityVfx.triggerEffect('groot', enemies.map(e => e.model.position));
    },
    'lumiere': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            EnemyManager.dealDamage(e, 80, null); // Initial burst damage
            applyBurn(e, 25, 5000); // 25 dps for 5s
        });
        HeroAbilityVfx.triggerEffect('lumiere', enemies.map(e => e.model.position));
    },
    'genie': () => {
        GameState.addMana(100);
        UI.updateMana();
        HeroAbilityVfx.triggerEffect('genie');
    },
    'jafar': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            applyCurse(e, 1.5, 8000); // 50% more damage for 8s
            applyFreeze(e, 2000); // 2s stun
        });
        HeroAbilityVfx.triggerEffect('jafar', enemies.map(e => e.model.position));
    },
    'minnie': () => {
        const allUnits = UnitManager.getAllUnits();
        allUnits.forEach(unit => {
            if (!unit.buffs) unit.buffs = {};
            unit.buffs.attackSpeedBoost = {
                multiplier: 0.5, // Cooldown is multiplied by this
                endTime: performance.now() + 10000
            };
        });
        HeroAbilityVfx.triggerEffect('minnie', allUnits.map(u => u.model.position));
    },
    'snow_white': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            applyFreeze(e, 2000); // Charm reuses freeze logic
            applyCurse(e, 1.15, 5000);
        });
        HeroAbilityVfx.triggerEffect('snow_white', enemies.map(e => e.model.position));
    },
    'winnie_the_pooh': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            applySlow(e, 0.7, 8000);
        });
        HeroAbilityVfx.triggerEffect('winnie_the_pooh', enemies.map(e => e.model.position));
    },
    'tigger': () => {
        const enemies = EnemyManager.getAllEnemies();
        // Shuffle and pick 5 random ones
        const randomEnemies = enemies.sort(() => 0.5 - Math.random()).slice(0, 5);
        randomEnemies.forEach(e => {
            EnemyManager.dealDamage(e, 120, null);
        });
        HeroAbilityVfx.triggerEffect('tigger', randomEnemies.map(e => e.model.position));
    },
    'pocahontas': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            applySlow(e, 0.4, 5000); // 40% slow for 5s
            applyBurn(e, 10, 5000); // 10 dps for 5s (reusing burn for DoT)
        });
        HeroAbilityVfx.triggerEffect('pocahontas', enemies.map(e => e.model.position));
    },
    'mickey_mouse': () => {
        const allUnits = UnitManager.getAllUnits();
        allUnits.forEach(unit => {
            if (!unit.buffs) unit.buffs = {};
            // Damage Buff
            unit.buffs.damageBoost = {
                multiplier: 2.0, // 100% increased damage
                endTime: performance.now() + 7000
            };
            // Attack Speed Buff
            unit.buffs.attackSpeedBoost = {
                multiplier: 0.5, // Cooldown is halved
                endTime: performance.now() + 7000
            };
            // TODO: Add immunity to stuns/slows based on star level
        });
        HeroAbilityVfx.triggerEffect('mickey_mouse', allUnits.map(u => u.model.position));
    },
    'jim_hawkins': () => {
        const enemies = EnemyManager.getAllEnemies();
        // Star level 3 bonus
        const user = UnitManager.getCurrentUser();
        let targets = 8;
        if(user.heroCollection['jim_hawkins']?.starLevel >= 3) {
            targets = 10;
        }

        const randomEnemies = enemies.sort(() => 0.5 - Math.random()).slice(0, targets);
        randomEnemies.forEach(e => {
            EnemyManager.dealDamage(e, 200, null);
        });
        HeroAbilityVfx.triggerEffect('jim_hawkins', randomEnemies.map(e => e.model.position));
    },
    'captain_amelia': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            EnemyManager.dealDamage(e, 250, null);
            applyFreeze(e, 1500); // 1.5s stun
        });
        HeroAbilityVfx.triggerEffect('captain_amelia', enemies.map(e => e.model.position));
    },
    'donald_duck': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            EnemyManager.dealDamage(e, 150, null);
        });

        const allDonalds = UnitManager.getAllUnits().filter(unit => unit.name === 'donald_duck');
        allDonalds.forEach(donald => {
            if (!donald.buffs) donald.buffs = {};
            donald.buffs.attackSpeedBoost = {
                multiplier: 0.5, // 100% attack speed boost (halves cooldown)
                endTime: performance.now() + 8000
            };
        });
        HeroAbilityVfx.triggerEffect('donald_duck', [...enemies, ...allDonalds].map(o => o.model.position));
    },
    'peter_pan': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            applyFreeze(e, 2000); // Stun for 2s
        });

        const allUnits = UnitManager.getAllUnits();
        allUnits.forEach(unit => {
            if (!unit.buffs) unit.buffs = {};
            unit.buffs.attackSpeedBoost = {
                multiplier: 0.5, // 50% attack speed boost
                endTime: performance.now() + 6000 // for 6s
            };
        });
        HeroAbilityVfx.triggerEffect('peter_pan', [...enemies, ...allUnits].map(o => o.model.position));
    },
    'cogsworth': () => {
        const enemies = EnemyManager.getAllEnemies();
        enemies.forEach(e => {
            applySlow(e, 0.8, 8000); // 80% slow for 8s
            applyFreeze(e, 2000); // Stun for 2s
        });
        HeroAbilityVfx.triggerEffect('cogsworth', enemies.map(e => e.model.position));
    },
};

export function getHeroAbility(heroId) {
    return HERO_DATA[heroId]?.heroAbility;}