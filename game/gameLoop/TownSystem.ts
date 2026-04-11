import { Hero, Resources } from './types';
import { EconomySystem } from './EconomySystem';
import { RosterManager } from './RosterManager';
import { StressSystem } from './StressSystem';

export class TownSystem {
    constructor(
        private readonly rosterManager: RosterManager,
        private readonly economySystem: EconomySystem,
        private readonly stressSystem: StressSystem,
    ) {}

    public recruitHero(hero: Hero, costGold: number): boolean {
        const paid = this.economySystem.spend({ gold: costGold });
        if (!paid) return false;

        this.rosterManager.recruit(hero);
        return true;
    }

    public treatStress(heroId: string, stressHealing: number, costGold: number): boolean {
        const hero = this.rosterManager.getHero(heroId);
        if (!hero) return false;

        const paid = this.economySystem.spend({ gold: costGold });
        if (!paid) return false;

        this.stressSystem.healStress(hero, stressHealing);
        return true;
    }

    public getResources(): Resources {
        return this.economySystem.getResources();
    }
}
