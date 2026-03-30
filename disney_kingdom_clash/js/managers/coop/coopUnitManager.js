import * as THREE from 'three';
import * as CoopGridManager from './coopGridManager.js';
import * as CoopEnemyManager from './coopEnemyManager.js';
import * as CoopUiManager from './coopUiManager.js';
import { coopGameState } from './coopGameState.js';
import { getAsset } from '../../assets.js';
import { HERO_DATA } from '../../data/heroData.js';
import { getCurrentUser } from '../../utils/user.js';
import { createProjectile } from '../../utils/projectile.js';

let scene, camera;
let p1_deck = [];
let ai_deck = [];
let mixers = [];

export function init(mainScene, mainCamera, player1Deck, player2Deck) {
    scene = mainScene;
    camera = mainCamera;
    p1_deck = player1Deck || []; // Ensure p1_deck is an array
    ai_deck = player2Deck || [];
    mixers = [];
}

function spawnUnit(player, key, i, j) {
    const grid = player === 'p1' ? CoopGridManager.P1_GRID : CoopGridManager.P2_GRID;
    const origin = player === 'p1' ? CoopGridManager.P1_ORIGIN : CoopGridManager.P2_ORIGIN;
    const modelData = getAsset(key);
    if(!modelData) return;

    const model = modelData.scene.clone();
    const mixer = new THREE.AnimationMixer(model);
    const idleClip = THREE.AnimationClip.findByName(modelData.animations, 'idle');
    if (idleClip) mixer.clipAction(idleClip).play();
    
    const pos = CoopGridManager.gridToWorld(i, j, origin);
    model.position.copy(pos);
    scene.add(model);
    
    const [name, levelStr] = key.split('_lvl');
    const level = parseInt(levelStr);
    let stats = HERO_DATA[name]?.levels[level];
    if (!stats) return;

    stats = JSON.parse(JSON.stringify(stats)); 
    const user = getCurrentUser();
    const heroCollectionData = user.heroCollection[name];
    if (heroCollectionData && heroCollectionData.starLevel > 1) {
        const starLevelData = HERO_DATA[name].starLevels[heroCollectionData.starLevel];
        if (starLevelData?.damageMultiplier) {
            stats.damage = Math.round(stats.damage * starLevelData.damageMultiplier);
        }
    }

    grid[i][j] = { key, name, model, mixer, isSprite: modelData.isSprite, level: level, stats: stats, attackTimer: Math.random() * stats.cooldown };
    grid[i][j].stats.ability = JSON.parse(JSON.stringify(stats.ability)); 
    mixers.push(mixer);
}

function doAttack(cell, enemy) {
    if (!enemy) return;
    createProjectile(scene, cell, enemy);
    CoopEnemyManager.dealDamage(enemy, cell.stats.damage);
}

export function update(delta) {
    mixers.forEach(mixer => mixer.update(delta));
    [CoopGridManager.P1_GRID, CoopGridManager.P2_GRID].forEach(grid => {
        grid.flat().forEach(cell => {
            if (cell) {
                if (cell.model && camera && cell.isSprite) {
                    cell.model.quaternion.copy(camera.quaternion);
                }
                cell.attackTimer -= delta;
                if (cell.attackTimer <= 0) {
                    const target = CoopEnemyManager.findNearestEnemy(cell.model.position);
                    if (target) {
                        doAttack(cell, target);
                        cell.attackTimer = cell.stats.cooldown;
                    }
                }
            }
        });
    });
}

export function trySummon(player) {
    const deck = player === 'p1' ? p1_deck : ai_deck;
    if(deck.length === 0) return false;
    const grid = player === 'p1' ? CoopGridManager.P1_GRID : CoopGridManager.P2_GRID;
    let summonCount, mana;

    if (player === 'p1') {
        summonCount = coopGameState.p1_summonCount;
        mana = coopGameState.p1_mana;
    } else {
        summonCount = coopGameState.p2_summonCount;
        mana = coopGameState.p2_mana;
    }
    
    const summonCost = 10 + (summonCount * 10);

    if (mana < summonCost) {
        if (player === 'p1') alert("Not enough mana!");
        return false;
    }

    const emptyCells = [];
    for (let i = 0; i < CoopGridManager.GRID_COLS; i++) {
        for (let j = 0; j < CoopGridManager.GRID_ROWS; j++) {
            if (!grid[i][j]) emptyCells.push({ i, j });
        }
    }
    if (emptyCells.length === 0) {
        if (player === 'p1') alert("Board is full!");
        return false;
    }

    if (player === 'p1') {
        coopGameState.p1_mana -= summonCost;
        coopGameState.p1_summonCount++;
    } else {
        coopGameState.p2_mana -= summonCost;
        coopGameState.p2_summonCount++;
    }

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const unitKey = deck[Math.floor(Math.random() * deck.length)];
    spawnUnit(player, unitKey, randomCell.i, randomCell.j);
    CoopUiManager.update();
    return true;
}

export function findMergeablePairs(player) {
    const grid = player === 'p1' ? CoopGridManager.P1_GRID : CoopGridManager.P2_GRID;
    const units = [];
    for (let i = 0; i < CoopGridManager.GRID_COLS; i++) {
        for (let j = 0; j < CoopGridManager.GRID_ROWS; j++) {
            if (grid[i][j]) units.push({ ...grid[i][j], i, j });
        }
    }

    const pairs = [];
    const usedIndices = new Set();
    for(let i=0; i < units.length; i++) {
        if(usedIndices.has(i)) continue;
        for (let j = i + 1; j < units.length; j++) {
            if (usedIndices.has(j)) continue;
            if (units[i].key === units[j].key && units[i].level < 5) {
                pairs.push(units[i]);
                usedIndices.add(i);
                usedIndices.add(j);
                break;
            }
        }
    }
    return pairs;
}

export function tryMerge(player, i, j) {
    const grid = player === 'p1' ? CoopGridManager.P1_GRID : CoopGridManager.P2_GRID;
    const deck = player === 'p1' ? p1_deck : ai_deck;
    const sourceCell = grid[i][j];
    if (!sourceCell || sourceCell.level >= 5) return;

    let twinPos = null;
    for (let col = 0; col < CoopGridManager.GRID_COLS; col++) {
        for (let row = 0; row < CoopGridManager.GRID_ROWS; row++) {
            if (col === i && row === j) continue;
            const targetCell = grid[col][row];
            if (targetCell && targetCell.key === sourceCell.key) {
                twinPos = { i: col, j: row }; break;
            }
        }
        if (twinPos) break;
    }
    if (!twinPos) return;

    const twinCell = grid[twinPos.i][twinPos.j];
    scene.remove(sourceCell.model);
    scene.remove(twinCell.model);
    mixers = mixers.filter(m => m !== sourceCell.mixer && m !== twinCell.mixer);

    grid[i][j] = null;
    grid[twinPos.i][twinPos.j] = null;
    
    const heroIdsInDeck = [...new Set(deck.map(unitKey => unitKey.split('_lvl')[0]))];
    const randomHeroId = heroIdsInDeck[Math.floor(Math.random() * heroIdsInDeck.length)];
    const newKey = `${randomHeroId}_lvl${sourceCell.level + 1}`;
    
    spawnUnit(player, newKey, i, j);
    CoopUiManager.update();
}