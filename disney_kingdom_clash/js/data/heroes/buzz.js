export const buzzHeroData = {
    id: 'buzz',
    name: 'Buzz',
    rarity: 'epic',
    lore: "Buzz Lightyear's prime directive as a Space Ranger is to uphold order. The narrative fracture has twisted his world into a chaotic asteroid field of bugs and glitches. He now uses his advanced Star Command tech to systematically vaporize the Disruptions and secure the story's perimeter.",
    tags: ["AoE Damage", "High DPS", "Burst"],
    projectile: {
        sound: 'laser',
        color: 0xffff00,
    },
    heroAbility: {
        name: "Air Strike",
        description: "Deals 150 damage to all enemies on screen.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 10, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 25, bonus: 'Splash damage radius increased by 20%.' },
        4: { shards: 50, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 100, bonus: 'Hero Ability also stuns enemies for 1 second.' }
    },
    levels: {
        1: { damage: 25, cooldown: 1.0, ability: { type: 'none' }, abilityText: 'A basic laser attack.' },
        2: { damage: 55, cooldown: 0.8, ability: { type: 'none' }, abilityText: 'A stronger laser attack.' },
        3: { damage: 120, cooldown: 0.7, ability: { type: 'laser', chance: 0.15, multiplier: 2.5 }, abilityText: '15% chance for a powerful laser, dealing 250% damage.' },
        4: { damage: 250, cooldown: 0.6, ability: { type: 'orbital_strike', chance: 0.2, radius: 4.0, multiplier: 5.0 }, abilityText: '20% chance for an orbital strike, dealing 500% damage in a large area.' },
        5: { damage: 500, cooldown: 0.5, ability: { type: 'glassing_beam', chance: 0.25, multiplier: 10.0 }, abilityText: '25% chance to call down a sustained glassing beam, dealing 1000% damage over time.' },
    }
};