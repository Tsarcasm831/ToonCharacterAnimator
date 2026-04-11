import { Affliction, Hero, Virtue } from './types';

const DEFAULT_AFFLICTIONS: Affliction[] = [
    {
        id: 'paranoid',
        name: 'Paranoid',
        description: 'Fearful and suspicious, increasing stress pressure.',
        stressModifier: 10,
        skipTurnChance: 0.2,
    },
    {
        id: 'masochistic',
        name: 'Masochistic',
        description: 'Seeks danger and ignores self-preservation.',
        stressModifier: 15,
        skipTurnChance: 0.1,
    },
    {
        id: 'hopeless',
        name: 'Hopeless',
        description: 'Loses confidence and may refuse commands.',
        stressModifier: 20,
        skipTurnChance: 0.25,
    },
];

const DEFAULT_VIRTUES: Virtue[] = [
    {
        id: 'courageous',
        name: 'Courageous',
        description: 'Keeps morale high when the mission turns grim.',
        stressResistBonus: 0.15,
    },
    {
        id: 'focused',
        name: 'Focused',
        description: 'Maintains discipline under pressure.',
        stressResistBonus: 0.1,
    },
];

export class AfflictionSystem {
    private readonly afflictions: Affliction[];
    private readonly virtues: Virtue[];

    constructor(afflictions: Affliction[] = DEFAULT_AFFLICTIONS, virtues: Virtue[] = DEFAULT_VIRTUES) {
        this.afflictions = afflictions;
        this.virtues = virtues;
    }

    public resolveTest(hero: Hero): { affliction?: Affliction; virtue?: Virtue } {
        const virtueChance = 0.2;
        const rolledVirtue = Math.random() < virtueChance;

        if (rolledVirtue) {
            const virtue = this.virtues[Math.floor(Math.random() * this.virtues.length)];
            hero.virtue = virtue;
            hero.affliction = undefined;
            return { virtue };
        }

        const affliction = this.afflictions[Math.floor(Math.random() * this.afflictions.length)];
        hero.affliction = affliction;
        hero.virtue = undefined;
        return { affliction };
    }

    public getAfflictionById(afflictionId: string): Affliction | undefined {
        return this.afflictions.find((affliction) => affliction.id === afflictionId);
    }
}
