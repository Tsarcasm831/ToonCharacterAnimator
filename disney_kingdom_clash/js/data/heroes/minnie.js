export const minnieHeroData = {
    id: 'minnie',
    name: 'Minnie',
    rarity: 'common',
    lore: "Minnie's story is one of love, friendship, and cheer. The Disruptions manifest as discord and sadness, trying to drain the color from her world. With a charming smile and a supportive song, she boosts the morale of her allies, speeding up their efforts to correct the narrative.",
    tags: ["Support", "Attack Speed", "Buff"],
    projectile: {
        sound: 'charm',
        color: 0xFF69B4,
    },
    heroAbility: {
        name: "Minnie's Cheer",
        description: "Boosts attack speed of all allied units by 50% for 10 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 20, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 50, bonus: 'Hero Ability also grants a small temporary damage buff.' },
        4: { shards: 100, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 200, bonus: 'Sweet Victory (Lvl 5) mana gain increased to 25.' }
    },
    levels: {
        1: { damage: 18, cooldown: 1.3, ability: { type: 'none' }, abilityText: 'A basic charming attack.' },
        2: { damage: 36, cooldown: 1.2, ability: { type: 'none' }, abilityText: 'A stronger charming attack.' },
        3: { damage: 75, cooldown: 1.1, ability: { type: 'charm', chance: 0.20, duration: 1500 }, abilityText: '20% chance to Charm an enemy for 1.5s.' },
        4: { damage: 150, cooldown: 1.1, ability: { type: 'area_charm', chance: 0.25, duration: 2000, radius: 2.5 }, abilityText: '25% chance to Charm the target and nearby enemies for 2s.' },
        5: { damage: 300, cooldown: 1.0, ability: { type: 'sweet_victory', chance: 0.25, mana: 15 }, abilityText: 'On stabilization, 25% chance to gain 15 mana.' },
    }
};