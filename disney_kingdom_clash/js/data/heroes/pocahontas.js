export const pocahontasHeroData = {
    id: 'pocahontas',
    name: 'Pocahontas',
    rarity: 'epic',
    lore: "Pocahontas has always listened to the spirits of the earth and the colors of the wind. When the Disruptions appeared as unnatural, clashing patterns in her world, she called upon nature to paint over the glitches with the wind, restoring harmony to her land's story.",
    tags: ["AoE Damage", "Slow", "Damage Over Time"],
    projectile: {
        sound: 'wind',
        color: 0x9acd32,
    },
    heroAbility: {
        name: "Colors of the Wind",
        description: "All enemies are caught in a gust of wind, taking 50 damage over 5 seconds and are slowed by 40% for the duration.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 15, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 40, bonus: 'Hero Ability slow effect increased to 60%.' },
        4: { shards: 80, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 150, bonus: 'Hero Ability also briefly disarms enemies, preventing attacks for 2 seconds.' }
    },
    levels: {
        1: { damage: 25, cooldown: 1.4, ability: { type: 'none' }, abilityText: 'Calls upon the spirits of the earth.' },
        2: { damage: 50, cooldown: 1.3, ability: { type: 'none' }, abilityText: 'A stronger spirit attack.' },
        3: { damage: 110, cooldown: 1.3, ability: { type: 'splash_slow', radius: 2.0, amount: 0.25, duration: 2500 }, abilityText: 'Swirling leaves slow target and nearby enemies by 25% for 2.5s.' },
        4: { damage: 230, cooldown: 1.2, ability: { type: 'splash', radius: 3.0, multiplier: 0.5 }, abilityText: 'Attacks deal 50% splash damage in a wide area.' },
        5: { damage: 450, cooldown: 1.2, ability: { type: 'spirit_of_the_eagle', chance: 0.2, duration: 4000 }, abilityText: '20% chance to gain increased attack speed for 4s.' },
    }
};