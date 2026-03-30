export const grootHeroData = {
    id: 'groot',
    name: 'Groot',
    rarity: 'common',
    lore: "A Flora Colossus from Planet X, Groot's vocabulary is limited, but his heart is immeasurable. The Disruptions appear as a technological blight, corrupting the natural worlds within the stories. Groot uses his control over plant life to root out the glitches, allowing life to flourish anew.",
    tags: ["Support", "Crowd Control", "Tank"],
    projectile: {
        sound: 'leaf',
        color: 0x90ee90,
    },
    heroAbility: {
        name: "I am Groot!",
        description: "Roots all enemies on screen for 4 seconds and slows them by 50% for 10 seconds afterwards.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 10, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 25, bonus: 'Hero Ability root duration increased to 5 seconds.' },
        4: { shards: 50, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 100, bonus: 'Mana Sapling (Lvl 5) passive now generates mana every 4 seconds instead of 5.' }
    },
    levels: {
        1: { damage: 20, cooldown: 1.8, ability: { type: 'none' }, abilityText: 'A basic branch attack.' },
        2: { damage: 40, cooldown: 1.7, ability: { type: 'none' }, abilityText: 'A stronger branch attack.' },
        3: { damage: 80, cooldown: 1.6, ability: { type: 'root', chance: 0.2, duration: 2000 }, abilityText: '20% chance to root target for 2s.' },
        4: { damage: 160, cooldown: 1.6, ability: { type: 'chain_root', chance: 0.25, duration: 2000, targets: 3 }, abilityText: '25% chance to root target and 2 others for 2s.' },
        5: { damage: 320, cooldown: 1.5, ability: { type: 'mana_sapling', mana_per_tick: 1, tick_rate: 5 }, abilityText: 'Passively generates 1 mana every 5 seconds.' },
    }
};

