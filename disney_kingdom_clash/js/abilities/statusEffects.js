import * as EnemyManager from '../managers/enemyManager.js';

export function applyFreeze(enemy, duration) {
    enemy.frozenUntil = Math.max(enemy.frozenUntil || 0, performance.now() + duration);
}

export function applySlow(enemy, amount, duration) {
    const newSlowEndTime = performance.now() + duration;
    // Only apply if the new slow is stronger or lasts longer than the current one
    if (newSlowEndTime > (enemy.slowUntil || 0) || amount > (enemy.slowAmount || 0)) {
        enemy.slowUntil = newSlowEndTime;
        enemy.slowAmount = Math.max(enemy.slowAmount || 0, amount);
    }
}

export function applyBurn(enemy, damagePerSecond, duration) {
    const newBurnEndTime = performance.now() + duration;
    // Strongest burn applies
    if (newBurnEndTime > (enemy.burnUntil || 0) || damagePerSecond > (enemy.burnDamage || 0)) {
        enemy.burnUntil = newBurnEndTime;
        enemy.burnDamage = Math.max(enemy.burnDamage || 0, damagePerSecond);
    }
}

export function applyCurse(enemy, multiplier, duration) {
    const newCurseEndTime = performance.now() + duration;
    // Strongest curse applies
    if (newCurseEndTime > (enemy.curseUntil || 0) || multiplier > (enemy.curseMultiplier || 1)) {
        enemy.curseUntil = newCurseEndTime;
        enemy.curseMultiplier = Math.max(enemy.curseMultiplier || 1, multiplier);
    }
}