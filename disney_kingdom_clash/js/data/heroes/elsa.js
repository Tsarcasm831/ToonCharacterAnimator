export const elsaHeroData = {
    id: 'elsa',
    name: 'Elsa',
    rarity: 'epic',
    lore: "As the Snow Queen of Arendelle, Elsa's story was one of mastering her fear. When the Disruption fractured her tale, it manifested her anxieties as uncontrolled blizzards. Now, she wields her ice magic with precision to freeze the glitches and restore her narrative's hard-won peace.",
    tags: ["AoE Control", "Freeze", "Crowd Control"],
    projectile: {
        sound: 'ice',
        color: 0xadd8e6,
    },
    heroAbility: {
        name: "Absolute Zero",
        description: "Freezes all enemies on screen for 5 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 10, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 25, bonus: 'Hero Ability also slows enemies by 30% for 8s after the freeze ends.' },
        4: { shards: 50, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 100, bonus: 'Hero Ability freeze duration increased to 7 seconds.' }
    },
    levels: {
        1: { damage: 15, cooldown: 2.0, ability: { type: 'none' }, abilityText: 'A basic ice shard attack.' },
        2: { damage: 35, cooldown: 1.8, ability: { type: 'none' }, abilityText: 'A stronger ice shard attack.' },
        3: { damage: 80, cooldown: 1.5, ability: { type: 'freeze', chance: 0.2, duration: 2500 }, abilityText: '20% chance to freeze target for 2.5s.' },
        4: { damage: 150, cooldown: 1.5, ability: { type: 'blizzard', radius: 3.0, duration: 3000 }, abilityText: 'Attacks create a blizzard, freezing the target and nearby enemies for 3s.' },
        5: { damage: 350, cooldown: 1.2, ability: { type: 'absolute_zero', radius: 5.0, duration: 5000 }, abilityText: 'High chance to freeze target. On stabilization, creates a flash freeze in a large area for 5s.' },
    }
};