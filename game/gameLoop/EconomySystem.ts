import { Resources } from './types';

export class EconomySystem {
    private resources: Resources;

    constructor(initialResources: Resources) {
        this.resources = { ...initialResources };
    }

    public getResources(): Resources {
        return this.resources;
    }

    public canAfford(cost: Partial<Resources>): boolean {
        return (
            (this.resources.gold ?? 0) >= (cost.gold ?? 0) &&
            (this.resources.heirlooms ?? 0) >= (cost.heirlooms ?? 0) &&
            (this.resources.supplyChests ?? 0) >= (cost.supplyChests ?? 0)
        );
    }

    public spend(cost: Partial<Resources>): boolean {
        if (!this.canAfford(cost)) return false;
        this.resources.gold -= cost.gold ?? 0;
        this.resources.heirlooms -= cost.heirlooms ?? 0;
        this.resources.supplyChests -= cost.supplyChests ?? 0;
        return true;
    }

    public add(reward: Partial<Resources>): void {
        this.resources.gold += reward.gold ?? 0;
        this.resources.heirlooms += reward.heirlooms ?? 0;
        this.resources.supplyChests += reward.supplyChests ?? 0;
    }
}
