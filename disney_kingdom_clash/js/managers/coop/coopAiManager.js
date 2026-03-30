import * as CoopUnitManager from './coopUnitManager.js';
import * as CoopGridManager from './coopGridManager.js';
import { coopGameState } from './coopGameState.js';

const aiState = {
    decisionTimer: 2.0,
    mode: 'summoning', // 'summoning' or 'merging'
};

function aiTrySummon() {
    const summonCost = 25;
    const hasSpace = CoopGridManager.P2_GRID.flat().some(cell => cell === null);
    if (coopGameState.p2_mana >= summonCost && hasSpace) {
        return CoopUnitManager.trySummon('p2');
    }
    return false;
}

function aiTryMerge() {
    const mergeablePairs = CoopUnitManager.findMergeablePairs('p2');
    if (mergeablePairs.length > 0) {
        const { i, j } = mergeablePairs[0];
        CoopUnitManager.tryMerge('p2', i, j);
        return true;
    }
    return false;
}

export function init() {
    aiState.decisionTimer = 2.0;
    aiState.mode = 'summoning';
}

export function update(delta) {
    aiState.decisionTimer -= delta;
    if (aiState.decisionTimer <= 0) {
        aiState.decisionTimer = 2.0;

        const p2_grid_flat = CoopGridManager.P2_GRID.flat().filter(Boolean);
        aiState.mode = p2_grid_flat.length >= (CoopGridManager.GRID_COLS * CoopGridManager.GRID_ROWS) - 2 ? 'merging' : 'summoning';

        if(aiState.mode === 'merging') {
            if(!aiTryMerge()) aiTrySummon();
        } else {
            if(!aiTrySummon()) aiTryMerge();
        }
    }
}