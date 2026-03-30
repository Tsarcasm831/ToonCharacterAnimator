export const snowWhiteHeroData = {
    id: 'snow_white',
    name: 'Snow White',
    rarity: 'epic',
    lore: "Snow White's tale is one of kindness overcoming jealousy. The Disruptions manifest as poisoned code and deceitful sprites. She uses her innate charm and connection with nature's creatures to pacify the glitches, reminding them of the story's true, kind-hearted song.",
    tags: ["Crowd Control", "Charm", "Debuff"],
    projectile: {
        sound: 'song',
        color: 0xFFFFE0,
    },
    heroAbility: {
        name: "Animal Friends",
        description: "Charms all enemies for 2s, making them take 15% increased damage for 5s.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 15, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 40, bonus: 'Charm abilities last 0.5 seconds longer.' },
        4: { shards: 80, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 150, bonus: 'Poison Apple (Lvl 5) has a 25% chance to trigger.' }
    },
    levels: {
        1: { damage: 19, cooldown: 1.4, ability: { type: 'none' }, abilityText: 'A gentle, melodic attack.' },
        2: { damage: 38, cooldown: 1.3, ability: { type: 'none' }, abilityText: 'A stronger melodic attack.' },
        3: { damage: 80, cooldown: 1.3, ability: { type: 'charm', chance: 0.20, duration: 1800 }, abilityText: '20% chance to Charm an enemy for 1.8s.' },
        4: { damage: 160, cooldown: 1.2, ability: { type: 'area_charm', chance: 0.20, duration: 2000, radius: 2.5 }, abilityText: '20% chance to Charm the target and nearby enemies for 2s.' },
        5: { damage: 340, cooldown: 1.2, ability: { type: 'poison_apple', chance: 0.15, duration: 5000, dps: 50 }, abilityText: '15% chance to use a Poison Apple, putting the target to sleep for 5s and poisoning them for 50 dps.' },
    }
};