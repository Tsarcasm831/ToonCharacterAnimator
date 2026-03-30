import { coopGameState } from './coopGameState.js';
import * as CoopGridManager from './coopGridManager.js';

export function init() {
    const p1MergeButton = document.getElementById('p1-merge-button');
    if(p1MergeButton) p1MergeButton.disabled = true; // P1 merge not implemented yet
}

export function update() {
    document.getElementById('p1-mana-value').textContent = coopGameState.p1_mana;
    document.getElementById('coop-hp-value').textContent = `${coopGameState.hp}/${coopGameState.initial_hp}`;
    const hpBarFill = document.getElementById('coop-hp-bar-fill');
    if(hpBarFill) hpBarFill.style.width = `${(coopGameState.hp / coopGameState.initial_hp) * 100}%`;

    const p1SummonCost = 10 + (coopGameState.p1_summonCount * 10);
    const p1SummonBtn = document.getElementById('p1-summon-button');
    if (p1SummonBtn) {
        p1SummonBtn.querySelector('span').textContent = `Summon (${p1SummonCost})`;
        p1SummonBtn.disabled = coopGameState.p1_mana < p1SummonCost || CoopGridManager.P1_GRID.flat().every(c => c !== null);
    }

    const waveEl = document.getElementById('wave-value-coop');
    if (waveEl) waveEl.textContent = `Wave ${coopGameState.wave}/${coopGameState.totalWaves}`;
}