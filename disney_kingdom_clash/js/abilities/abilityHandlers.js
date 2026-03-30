import * as EnemyManager from '../managers/enemyManager.js';
import * as GameState from '../gameState.js';
import * as UI from '../ui.js';
import { createProjectile } from '../utils/projectile.js';
import * as UnitManager from '../managers/unitManager.js';
import { applyFreeze, applySlow, applyBurn, applyCurse } from './statusEffects.js';

export function applyOnHit(cell, enemy) {
    const ability = cell.stats.ability;
    if (!ability || ability.type === 'none') return;

    // A small helper for chance-based abilities
    const didProc = (chance) => !chance || Math.random() < chance;

    switch (ability.type) {
        case 'curse':
            applyCurse(enemy, ability.multiplier, ability.duration);
            break;
        case 'piercing_shot':
             if (didProc(ability.chance)) {
                const otherTargets = EnemyManager.findEnemiesInRadius(enemy.model.position, 100)
                    .filter(e => e !== enemy)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, ability.targets - 1);
                
                otherTargets.forEach(target => {
                    EnemyManager.dealDamage(target, cell.stats.damage, cell);
                    createProjectile(cell.model.parent, cell, target);
                });
            }
            break;
        case 'cannon_blast':
             if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration); // stun
            }
            break;
        case 'magic_boost':
            if (didProc(ability.chance)) {
                const allAllies = UnitManager.getAllUnits().filter(u => u !== cell);
                if (allAllies.length > 0) {
                    const randomAlly = allAllies[Math.floor(Math.random() * allAllies.length)];
                    if (!randomAlly.buffs) randomAlly.buffs = {};
                    randomAlly.buffs.damageBoost = {
                        multiplier: ability.multiplier,
                        endTime: performance.now() + ability.duration
                    };
                    // TODO: Add visual effect for buff
                }
            }
            break;
        case 'area_magic_boost':
             const alliesInRadius = UnitManager.findUnitsInRadius(cell.model.position, ability.radius);
             alliesInRadius.forEach(ally => {
                if (!ally.buffs) ally.buffs = {};
                ally.buffs.damageBoost = {
                    multiplier: ability.multiplier,
                    endTime: performance.now() + ability.duration
                };
                // TODO: Add visual effect for buff
            });
            break;
        case 'chain_curse':
            applyCurse(enemy, ability.multiplier, ability.duration);
            const otherCursed = EnemyManager.findEnemiesInRadius(enemy.model.position, 10)
                .filter(e => e !== enemy)
                .slice(0, ability.targets - 1);
            otherCursed.forEach(e => applyCurse(e, ability.multiplier, ability.duration));
            break;
        case 'spreading_curse':
            const cursedEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
            cursedEnemies.forEach(e => applyCurse(e, ability.multiplier, ability.duration));
            break;
        case 'doom':
            if (didProc(ability.chance)) {
                // For now, "destroy" just means setting HP to 0.
                // Could add special logic for bosses here later.
                enemy.hp = 0;
            }
            break;
        case 'burn':
            applyBurn(enemy, ability.damage, ability.duration);
            break;
        case 'spread_burn':
            const burnedEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
            burnedEnemies.forEach(e => applyBurn(e, ability.damage, ability.duration));
            break;
        case 'conflagrate':
            applyBurn(enemy, ability.damage, ability.duration);
            if (didProc(ability.chance)) {
                const allEnemies = EnemyManager.getAllEnemies();
                allEnemies.forEach(e => {
                    if (e.burnUntil > performance.now() && e.burnDamage > 0) {
                        EnemyManager.dealDamage(e, cell.stats.damage * ability.multiplier, cell);
                        //TODO: Add visual effect for conflagrate
                    }
                });
            }
            break;
        case 'frenzy':
            if (ability.stacks < ability.max_stacks) {
                ability.stacks++;
            }
            break;
        case 'temper_tantrum':
            if (ability.stacks < ability.max_stacks) {
                ability.stacks++;
            }
            break;
        case 'root':
            if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration);
            }
            break;
        case 'slow':
            applySlow(enemy, ability.amount, ability.duration);
            break;
        case 'splash_slow':
            const slowedEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
            slowedEnemies.forEach(e => applySlow(e, ability.amount, ability.duration));
            break;
        case 'freeze':
            if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration);
            }
            break;
        case 'blizzard':
            const frozenEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
            frozenEnemies.forEach(e => applyFreeze(e, ability.duration));
            break;
        case 'knockback':
            if (didProc(ability.chance)) {
                EnemyManager.applyKnockback(enemy, ability.distance);
            }
            break;
        case 'chain_root':
            if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration);
                const otherEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, 10)
                    .filter(e => e !== enemy)
                    .slice(0, ability.targets - 1);
                otherEnemies.forEach(e => applyFreeze(e, ability.duration));
            }
            break;
        case 'wave':
            if (didProc(ability.chance)) {
                const waveEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
                waveEnemies.forEach(other => {
                    EnemyManager.applyKnockback(other, ability.distance);
                });
            }
            break;
        case 'overgrowth':
            if (didProc(ability.chance)) {
                const areaEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
                areaEnemies.forEach(e => applyFreeze(e, ability.duration));
            }
            break;
        case 'tsunami':
             if (didProc(ability.chance)) {
                const allEnemies = EnemyManager.getAllEnemies();
                allEnemies.forEach(e => {
                    EnemyManager.applyKnockback(e, ability.distance);
                });
            }
            break;
        case 'splash':
            const splashEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
            splashEnemies.forEach(other => {
                if (other !== enemy) {
                    EnemyManager.dealDamage(other, cell.stats.damage * ability.multiplier, cell);
                }
            });
            break;
        case 'laser':
            if (didProc(ability.chance)) {
                EnemyManager.dealDamage(enemy, cell.stats.damage * (ability.multiplier - 1), cell);
            }
            break;
        case 'orbital_strike':
            if (didProc(ability.chance)) {
                const strikeEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
                 strikeEnemies.forEach(e => {
                    EnemyManager.dealDamage(e, cell.stats.damage * (ability.multiplier - 1), cell);
                });
            }
            break;
        case 'multi_attack':
            const otherTargets = EnemyManager.findEnemiesInRadius(cell.model.position, 100)
                .filter(e => e !== enemy)
                .sort(() => 0.5 - Math.random())
                .slice(0, ability.targets - 1);
            
            otherTargets.forEach(target => {
                EnemyManager.dealDamage(target, cell.stats.damage, cell);
                createProjectile(cell.model.parent, cell, target);
            });
            break;
        case 'overload':
            if (didProc(ability.chance)) {
                const allTargets = EnemyManager.findEnemiesInRadius(cell.model.position, 100);
                allTargets.forEach(target => {
                     if (target !== enemy) EnemyManager.dealDamage(target, cell.stats.damage, cell);
                     createProjectile(cell.model.parent, cell, target);
                });
            }
            break;
        case 'wishful_thinking':
            if(didProc(ability.chance)) {
                const effects = [
                    () => applyFreeze(enemy, 1500), // 1.5s freeze
                    () => applyBurn(enemy, 20, 3000), // 20dps burn for 3s
                    () => applySlow(enemy, 0.5, 2000), // 50% slow for 2s
                    () => EnemyManager.applyKnockback(enemy, 1.0)
                ];
                const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                randomEffect();
                //TODO: Add a visual indicator for which effect was chosen
            }
            break;
        case 'charm':
            if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration); // Charm reuses freeze logic
            }
            break;
        case 'area_charm':
             if (didProc(ability.chance)) {
                const charmedEnemies = EnemyManager.findEnemiesInRadius(enemy.model.position, ability.radius);
                charmedEnemies.forEach(e => applyFreeze(e, ability.duration));
            }
            break;
        case 'poison_apple':
            if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration); // "sleep"
                applyBurn(enemy, ability.dps, ability.duration); // "poison"
            }
            break;
        case 'hungry_smack':
            if (didProc(ability.chance)) {
                EnemyManager.dealDamage(enemy, cell.stats.damage * (ability.multiplier - 1), cell);
            }
            break;
        case 'bounce':
            if (didProc(ability.chance)) {
                const otherTargets = EnemyManager.findEnemiesInRadius(cell.model.position, 100)
                    .filter(e => e !== enemy)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, ability.targets - 1);
                
                otherTargets.forEach(target => {
                    EnemyManager.dealDamage(target, cell.stats.damage, cell);
                    createProjectile(cell.model.parent, cell, target);
                });
            }
            break;
        case 'pounce':
            if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration); // pounce re-uses stun logic
            }
            break;
        case 'spirit_of_the_eagle':
            if (didProc(ability.chance)) {
                if (!cell.buffs) cell.buffs = {};
                cell.buffs.attackSpeedBoost = {
                    multiplier: 0.5, // 50% faster attacks
                    endTime: performance.now() + ability.duration,
                };
                // Range boost is not supported yet, so this is a no-op for now.
                // TODO: Implement range buff
            }
            break;
        case 'tantrum_squawk':
            if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration); // Stun
            }
            break;
        case 'snake_in_boot':
            if (didProc(ability.chance)) {
                applyFreeze(enemy, ability.duration); // Stun
            }
            break;
    }
}

export function applyPassive(cell, delta) {
    const ability = cell.stats.ability;
    if (!ability) return;
    
    switch (ability.type) {
        case 'mana_sapling':
            cell.passiveTimer = (cell.passiveTimer || 0) + delta;
            if (cell.passiveTimer >= ability.tick_rate) {
                cell.passiveTimer = 0;
                GameState.addMana(ability.mana_per_tick);
                UI.updateMana();
            }
            break;
        case 'living_flame':
            const enemiesInAura = EnemyManager.findEnemiesInRadius(cell.model.position, ability.radius);
            enemiesInAura.forEach(e => {
                EnemyManager.dealDamage(e, ability.dps * delta, cell);
            });
            break;
        case 'deputy_aura':
            const alliesInAura = UnitManager.findUnitsInRadius(cell.model.position, ability.radius);
            alliesInAura.forEach(ally => {
                if (ally !== cell) { // Don't buff self
                    if (!ally.buffs) ally.buffs = {};
                    // This creates a constant buff that will be overwritten each frame, which is fine for a passive aura.
                    ally.buffs.damageBoost = {
                        multiplier: ability.damage_boost,
                        endTime: performance.now() + delta + 0.1 // a short duration just to make it work with existing logic
                    };
                }
            });
            break;
        case 'cosmic_power':
            // This is handled inside doAttack to count attacks
            break;
        case 'clockwork_precision':
            const alliesToBuff = UnitManager.findUnitsInRadius(cell.model.position, ability.radius);
            alliesToBuff.forEach(ally => {
                if (!ally.buffs) ally.buffs = {};
                // This is an aura, so it's always active. The check in unitManager will handle it.
                ally.buffs.attackSpeedBoost = {
                    multiplier: ability.speed_boost, // e.g., 0.9 for 10% faster
                    endTime: performance.now() + delta + 0.1 // Just needs to be in the future
                };
            });
            break;
    }
}

export function applyOnKill(killerCell, killedEnemy) {
    const ability = killerCell.stats.ability;
    if (!ability || !ability.on_kill) return;

    switch(ability.type) {
        case 'adrenaline_rush':
            if (!killerCell.buffs) killerCell.buffs = {};
            // Star level 5 bonus
            const user = UnitManager.getCurrentUser();
            let speedBoost = ability.speed_boost;
            if(user.heroCollection['jim_hawkins']?.starLevel >= 5) {
                speedBoost = 0.25; // 75% speed boost
            }
            killerCell.buffs.attackSpeedBoost = {
                multiplier: speedBoost,
                endTime: performance.now() + ability.duration
            };
            // TODO: Add visual effect for buff
            break;
        case 'friend_like_me':
            if (!ability.chance || Math.random() < ability.chance) {
                const allAllies = UnitManager.getAllUnits();
                if (allAllies.length > 0) {
                    const randomAlly = allAllies[Math.floor(Math.random() * allAllies.length)];
                    if (!randomAlly.buffs) randomAlly.buffs = {};
                    randomAlly.buffs.damageBoost = {
                        multiplier: 1.5, // 50% damage boost
                        endTime: performance.now() + 5000 // for 5s
                    };
                    // TODO: Add visual effect for buff
                }
            }
            break;
        case 'sweet_victory':
             if (!ability.chance || Math.random() < ability.chance) {
                GameState.addMana(ability.mana);
                UI.updateMana();
                // TODO: Add visual for mana gain
            }
            break;
    }
}