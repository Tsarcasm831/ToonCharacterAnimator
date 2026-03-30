import * as UI from './ui.js';

let mana = 100;
let playerHP = 10;
const INITIAL_MANA = 100;
export const INITIAL_HP = 10;
let summonCount = 0;
let purifiedEnemyCounts = {};
let totalPurified = 0;
let selectedStageData = null;
let selectedRealmData = null;
let gameSpeed = 1.0;
let isPaused = false;
let gameEnded = false;

export function init() {
    mana = INITIAL_MANA;
    playerHP = INITIAL_HP;
    summonCount = 0;
    purifiedEnemyCounts = {};
    totalPurified = 0;
    gameSpeed = 1.0;
    isPaused = false;
    gameEnded = false;
}

export function getMana() { 
    return mana;
}

export function addMana(amount) {
    mana += amount;
}

export function getHP() {
    return playerHP;
}

export function decreaseHP(amount) {
    playerHP -= amount;
}

export function getSummonCost() {
    return 10 + (summonCount * 10);
}

export function incrementSummonCount() {
    summonCount++;
}

export function trackPurifiedEnemy(enemyId) {
    if (!purifiedEnemyCounts[enemyId]) {
        purifiedEnemyCounts[enemyId] = 0;
    }
    purifiedEnemyCounts[enemyId]++;
    totalPurified++;
}

export function getTotalPurifiedCount() {
    return totalPurified;
}

export function getPurifiedEnemyCounts() {
    return purifiedEnemyCounts;
}

export function setSelectedLevel(stageData, realmData) {
    selectedStageData = stageData;
    selectedRealmData = realmData;
}

export function getSelectedLevel() {
    return selectedStageData;
}

export function getSelectedRealm() {
    return selectedRealmData;
}

export function setGameSpeed(speed) {
    gameSpeed = speed;
}

export function getGameSpeed() {
    return gameSpeed;
}

export function togglePause() {
    isPaused = !isPaused;
    return isPaused;
}

export function isGamePaused() {
    return isPaused;
}

export function isGameEnded() {
    return gameEnded;
}

export function setGameEnded(hasEnded) {
    gameEnded = hasEnded;
}