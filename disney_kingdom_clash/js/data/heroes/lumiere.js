export const lumiereHeroData = {
    id: 'lumiere',
    name: 'Lumière',
    rarity: 'common',
    lore: "As the maître d' of a cursed castle, Lumière knows a thing or two about enchantments. When the Disruption threatened to snuff out the tale as old as time, he brought his fiery personality to the forefront, illuminating the dark code and burning away the glitches with a grand flourish.",
    tags: ["AoE Damage", "Damage Over Time", "Burn"],
    projectile: {
        sound: 'fire',
        color: 0xffa500,
    },
    heroAbility: {
        name: "Grand Finale",
        description: "Deals 80 damage to all enemies and burns them for 25 damage per second for 5 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 20, bonus: 'Burn damage from abilities increased by 25%.' },
        3: { shards: 50, bonus: 'Hero Ability initial burst damage increased to 120.' },
        4: { shards: 100, bonus: 'Burn damage from abilities increased by 50% (total).' },
        5: { shards: 200, bonus: 'Lumière gains a permanent aura that slightly damages nearby enemies.' }
    },
    levels: {
        1: { damage: 15, cooldown: 1.4, ability: { type: 'none' }, abilityText: 'A basic fire attack.' },
        2: { damage: 30, cooldown: 1.3, ability: { type: 'none' }, abilityText: 'A stronger fire attack.' },
        3: { damage: 60, cooldown: 1.3, ability: { type: 'spread_burn', damage: 20, duration: 4000, radius: 2.0 }, abilityText: 'Burns target and nearby enemies for 20 dps for 4s.' },
        4: { damage: 120, cooldown: 1.1, ability: { type: 'conflagrate', damage: 35, duration: 5000, chance: 0.2, multiplier: 3 }, abilityText: 'Applies a powerful burn. 20% chance to Conflagrate, dealing 3x instant damage to burning enemies.' },
        5: { damage: 250, cooldown: 1.1, ability: { type: 'living_flame', radius: 3.0, dps: 50 }, abilityText: 'Passively burns nearby enemies for 50 damage per second.' },
    }
};