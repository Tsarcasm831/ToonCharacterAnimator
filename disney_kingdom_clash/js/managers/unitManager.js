import * as THREE from 'three';
import { getAsset } from '../assets.js';
import { GRID, gridToWorld, updateSelectionIndicator } from './gridManager.js';
import * as UI from '../ui.js';
import * as EnemyManager from './enemyManager.js';
import * as GameState from '../gameState.js';
import { UNIT_STATS } from '../data/unitStats.js';
import { applyPassive, applyOnHit } from '../abilities/abilityHandlers.js';
import { createProjectile } from '../utils/projectile.js';
import { HERO_DATA } from '../data/heroData.js';
import { getCurrentUser } from '../utils/user.js';

let scene;
let camera;
let lastClickedCell = { i: null, j: null };
let deck = [];
const mixers = [];

export function init(mainScene, mainCamera) {
    scene = mainScene;
    camera = mainCamera;
    document.getElementById('summon-button').addEventListener('click', () => trySummon());
    document.getElementById('merge-button').addEventListener('click', () => tryMerge(lastClickedCell.i, lastClickedCell.j));
}

export function destroy() {
    // Remove listeners by cloning to avoid listener leaks
    const summonButton = document.getElementById('summon-button');
    if (summonButton) {
        const newButton = summonButton.cloneNode(true);
        summonButton.parentNode.replaceChild(newButton, summonButton);
    }
    const mergeButton = document.getElementById('merge-button');
    if (mergeButton) {
        const newButton = mergeButton.cloneNode(true);
        mergeButton.parentNode.replaceChild(newButton, mergeButton);
    }

    // Clear units from scene
    GRID.flat().forEach(cell => {
        if (cell && cell.model && cell.model.parent) {
            scene.remove(cell.model);
        }
    });

    // Clear state
    deck = [];
    mixers.length = 0;
    lastClickedCell = { i: null, j: null };
}

export function setDeck(selectedHeroes) {
    deck = selectedHeroes.map(hero => `${hero.id}_lvl1`);
}

export function getDeck() {
    return deck;
}

export function getAllUnits() {
    return GRID.flat().filter(cell => cell !== null);
}

export function findUnitsInRadius(position, radius) {
    const unitsInRadius = [];
    GRID.flat().forEach(unit => {
        if (unit) {
            const distance = position.distanceTo(unit.model.position);
            if (distance <= radius) {
                unitsInRadius.push(unit);
            }
        }
    });
    return unitsInRadius;
}

export function update(delta) {
    mixers.forEach(mixer => mixer.update(delta));
    
    GRID.flat().forEach(cell => {
        if (cell) {
            if (cell.model && camera && cell.isSprite) {
                cell.model.quaternion.copy(camera.quaternion);
            }
            
            cell.attackTimer -= delta;
            if (cell.attackTimer <= 0) {
                const target = EnemyManager.findNearestEnemy(cell.model.position);
                if (target && !target.isPurified) {
                    doAttack(cell, target);
                    let currentCooldown = cell.stats.cooldown;
                    
                    // Apply frenzy buff
                    if(cell.stats.ability.type === 'frenzy') {
                        const speedBoost = 1.0 - (cell.stats.ability.stacks * cell.stats.ability.speed_per_stack);
                        currentCooldown *= speedBoost;
                    }

                    // Apply temper tantrum buff
                    if(cell.stats.ability.type === 'temper_tantrum') {
                        const user = getCurrentUser();
                        let speedPerStack = cell.stats.ability.speed_per_stack;
                        // Star level 5 bonus
                        if (user.heroCollection['donald_duck']?.starLevel >= 5) {
                            speedPerStack = 0.05;
                        }
                        const speedBoost = 1.0 - (cell.stats.ability.stacks * speedPerStack);
                        currentCooldown *= speedBoost;
                    }

                    // Apply hero ability buff
                    if (cell.buffs && cell.buffs.attackSpeedBoost && cell.buffs.attackSpeedBoost.endTime > performance.now()) {
                        currentCooldown *= cell.buffs.attackSpeedBoost.multiplier;
                    } else if (cell.buffs && cell.buffs.attackSpeedBoost) {
                        delete cell.buffs.attackSpeedBoost; // Clean up expired buff
                    }

                    cell.attackTimer = currentCooldown;
                }
            }

            // Passive abilities
            applyPassive(cell, delta);
        }
    });
}

export function isBoardFull() {
    return GRID.flat().every(cell => cell !== null);
}

export function setSelectedCell(i, j) {
    lastClickedCell = { i, j };
}

function spawnUnit(key, i, j) {
    const modelData = getAsset(key);
    const model = modelData.scene.clone();
    const mixer = new THREE.AnimationMixer(model);
    const idleClip = THREE.AnimationClip.findByName(modelData.animations, 'idle');
    if (idleClip) mixer.clipAction(idleClip).play();
    
    const pos = gridToWorld(i, j);
    model.position.copy(pos);
    scene.add(model);
    
    const [name, levelStr] = key.split('_lvl');
    const level = parseInt(levelStr);
    let stats = HERO_DATA[name]?.levels[level];

    if (!stats) {
        console.error(`Stats not found for ${key}`);
        scene.remove(model);
        return;
    }
    
    // Create a copy of stats to modify for star levels, etc.
    stats = JSON.parse(JSON.stringify(stats)); 

    // Apply star level bonuses
    const user = getCurrentUser();
    const heroCollectionData = user.heroCollection[name];
    if (heroCollectionData && heroCollectionData.starLevel > 1) {
        const starLevelData = HERO_DATA[name].starLevels[heroCollectionData.starLevel];
        if (starLevelData) {
            // Example: apply a damage bonus
            if (starLevelData.damageMultiplier) {
                stats.damage = Math.round(stats.damage * starLevelData.damageMultiplier);
            }
        }
    }

    GRID[i][j] = {
        key,
        name,
        model,
        mixer,
        isSprite: modelData.isSprite,
        level: level,
        stats: stats,
        attackTimer: Math.random() * stats.cooldown, // Stagger initial attacks
    };
    // Deep copy ability object to store instance-specific data like stacks
    GRID[i][j].stats.ability = JSON.parse(JSON.stringify(stats.ability)); 
    mixers.push(mixer);
}

export function trySummon() {
    const summonCost = GameState.getSummonCost();
    if (GameState.getMana() < summonCost) { alert("Not enough mana!"); return; }

    const emptyCells = [];
    for (let i = 0; i < GRID.length; i++) {
        for (let j = 0; j < GRID[0].length; j++) {
            if (!GRID[i][j]) {
                emptyCells.push({ i, j });
            }
        }
    }

    if (emptyCells.length === 0) {
        alert("Board is full! Merge units to make space.");
        return;
    }

    GameState.addMana(-summonCost);
    GameState.incrementSummonCount();
    UI.updateMana(); // Update UI after mana change
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const unitKey = deck[Math.floor(Math.random() * deck.length)];
    spawnUnit(unitKey, randomCell.i, randomCell.j);
    
    // After summon, selection is cleared to avoid accidental merges
    setSelectedCell(null, null);
    UI.updateSelectionInfo(null, null);
    updateSelectionIndicator(null, null);
}

export function tryMerge(i, j) {
    if (i === null || j === null) { alert("Please select a unit to merge from."); return; }
    
    const sourceCell = GRID[i][j];
    if (!sourceCell) { alert("No unit to merge!"); return; }
    if (sourceCell.level >= 5) { alert("Unit is at max level!"); return; }

    let twinPos = null;
    for (let col = 0; col < GRID.length; col++) {
        for (let row = 0; row < GRID[0].length; row++) {
            if (col === i && row === j) continue;
            const targetCell = GRID[col][row];
            if (targetCell && targetCell.key === sourceCell.key) {
                twinPos = { i: col, j: row };
                break;
            }
        }
        if (twinPos) break;
    }

    if (!twinPos) {
        alert("No identical unit found to merge with!");
        return;
    }
    
    const twinCell = GRID[twinPos.i][twinPos.j];

    // Remove old models and mixers
    const sourceMixerIndex = mixers.indexOf(sourceCell.mixer);
    if(sourceMixerIndex > -1) mixers.splice(sourceMixerIndex, 1);
    const twinMixerIndex = mixers.indexOf(twinCell.mixer);
    if(twinMixerIndex > -1) mixers.splice(twinMixerIndex, 1);

    scene.remove(sourceCell.model);
    scene.remove(twinCell.model);
    
    GRID[i][j] = null;
    GRID[twinPos.i][twinPos.j] = null;

    // Get unique hero IDs from the current deck
    const heroIdsInDeck = [...new Set(deck.map(unitKey => unitKey.split('_lvl')[0]))];
    // Pick a random hero ID
    const randomHeroId = heroIdsInDeck[Math.floor(Math.random() * heroIdsInDeck.length)];
    // Create the new key with the incremented level
    const newKey = `${randomHeroId}_lvl${sourceCell.level + 1}`;

    spawnUnit(newKey, i, j); // Spawn merged unit at original location
    
    // Update UI state since a space has been freed and selection is now the new unit
    setSelectedCell(i, j);
    UI.updateSelectionInfo(i, j);
    updateSelectionIndicator(i, j);
    UI.updateMana();
}

function doAttack(cell, enemy) {
    if (!enemy || enemy.isPurified) return;

    const attackClip = THREE.AnimationClip.findByName(getAsset(cell.key).animations, 'attack');
    if (attackClip) {
        const action = cell.mixer.clipAction(attackClip);
        action.reset().play();
    }

    let damage = cell.stats.damage;
    // Apply damage buffs
    if (cell.buffs && cell.buffs.damageBoost && cell.buffs.damageBoost.endTime > performance.now()) {
        damage *= cell.buffs.damageBoost.multiplier;
    } else if (cell.buffs && cell.buffs.damageBoost) {
        delete cell.buffs.damageBoost; // Clean up expired buff
    }

    EnemyManager.dealDamage(enemy, damage, cell);

    applyOnHit(cell, enemy);
    
    createProjectile(scene, cell, enemy);

    const ability = cell.stats.ability;
    if (ability) {
        if (ability.type === 'cosmic_power' || ability.type === 'imagination_mana') {
            ability.attack_count = (ability.attack_count || 0) + 1;
            if (ability.attack_count >= ability.attacks_needed) {
                ability.attack_count = 0;
                const manaGain = ability.mana_gain || 1;
                GameState.addMana(manaGain);
                UI.updateMana();
                 // TODO: Add visual for mana gain
            }
        }
    }
}