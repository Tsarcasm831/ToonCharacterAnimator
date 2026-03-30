export const woodyHeroData = {
    id: 'woody',
    name: 'Woody',
    rarity: 'epic',
    franchise: 'toy_story',
    lore: "As Andy's favorite toy, Sheriff Woody is a natural leader. When the Disruptions threaten to unravel the very fabric of playtime, he takes charge, rounding up his fellow toys and wrangling the glitches to restore the story to its rightful order.",
    tags: ["Support", "Crowd Control", "Leader"],
    projectile: {
        sound: 'whip',
        color: 0xDAA520, // Goldenrod
    },
    heroAbility: {
        name: "Roundup",
        description: "Woody throws his lasso, pulling all enemies towards the strongest enemy and stunning them for 2.5 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 15, bonus: '+15% base damage.', damageMultiplier: 1.15 },
        3: { shards: 40, bonus: "Hero Ability stun duration increased to 3.5 seconds." },
        4: { shards: 80, bonus: '+30% base damage.', damageMultiplier: 1.30 },
        5: { shards: 150, bonus: "'Snake in my Boot!' stun has a 30% chance to trigger." }
    },
    levels: {
        1: { damage: 25, cooldown: 1.1, ability: { type: 'none' }, abilityText: 'A quick whip crack.' },
        2: { damage: 50, cooldown: 1.0, ability: { type: 'none' }, abilityText: 'A faster whip crack.' },
        3: { damage: 110, cooldown: 1.0, ability: { type: 'snake_in_boot', chance: 0.2, duration: 2000 }, abilityText: "20% chance to yell 'Snake in my boot!', stunning the target for 2s." },
        4: { damage: 220, cooldown: 0.9, ability: { type: 'splash', radius: 2.0, multiplier: 0.3 }, abilityText: 'Whip crack creates a shockwave, dealing 30% splash damage.' },
        5: { damage: 450, cooldown: 0.9, ability: { type: 'deputy_aura', radius: 4.0, damage_boost: 1.10 }, abilityText: 'Passively inspires nearby allies, granting them a 10% damage boost.' },
    }
};