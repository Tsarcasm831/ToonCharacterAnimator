import { Hero } from './types';

export class RosterManager {
    private heroes: Hero[] = [];

    public setRoster(heroes: Hero[]): void {
        this.heroes = heroes;
    }

    public getRoster(): Hero[] {
        return this.heroes;
    }

    public recruit(hero: Hero): void {
        this.heroes.push(hero);
    }

    public dismiss(heroId: string): void {
        this.heroes = this.heroes.filter((hero) => hero.id !== heroId);
    }

    public getHero(heroId: string): Hero | undefined {
        return this.heroes.find((hero) => hero.id === heroId);
    }

    public assignAvailability(heroId: string, available: boolean): void {
        const hero = this.getHero(heroId);
        if (!hero) return;
        hero.available = available;
    }

    public getAvailableHeroes(): Hero[] {
        return this.heroes.filter((hero) => hero.available && !hero.isDead);
    }

    public getParty(partyHeroIds: string[]): Hero[] {
        const partyIdSet = new Set(partyHeroIds);
        return this.heroes.filter((hero) => partyIdSet.has(hero.id));
    }
}
