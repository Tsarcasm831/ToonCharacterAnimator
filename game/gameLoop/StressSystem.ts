import { Hero, StressResult } from './types';

const RESOLVE_THRESHOLD = 100;
const HEART_ATTACK_THRESHOLD = 200;

export class StressSystem {
    public applyStress(hero: Hero, amount: number): StressResult {
        const previousStress = hero.stress;
        hero.stress = Math.max(0, hero.stress + amount);

        return {
            reachedResolveCheck: previousStress < RESOLVE_THRESHOLD && hero.stress >= RESOLVE_THRESHOLD,
            reachedHeartAttack: previousStress < HEART_ATTACK_THRESHOLD && hero.stress >= HEART_ATTACK_THRESHOLD,
        };
    }

    public healStress(hero: Hero, amount: number): void {
        hero.stress = Math.max(0, hero.stress - Math.max(0, amount));
    }
}
