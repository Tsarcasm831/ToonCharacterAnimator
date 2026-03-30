export const tiggerHeroData = {
    id: 'tigger',
    name: 'Tigger',
    rarity: 'rare',
    lore: "The wonderful thing about Tiggers is that he's the only one. But the Disruptions have created broken, bouncing copies that threaten to overwrite his unique story. Tigger reasserts his individuality by bouncing circles around the glitches, tangling up their code.",
    tags: ["Multi-Target", "Bounce", "Damage"],
    projectile: {
        sound: 'boing',
        color: 0xffa500,
    },
    heroAbility: {
        name: "Bouncy Flounce",
        description: "Bounces rapidly, dealing 120 damage to 5 random enemies.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 10, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 25, bonus: 'Hero Ability now hits 2 additional targets (7 total).' },
        4: { shards: 50, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 100, bonus: 'Pounce stun chance increased to 35%.' }
    },
    levels: {
        1: { damage: 22, cooldown: 1.2, ability: { type: 'none' }, abilityText: 'A basic bouncy attack.' },
        2: { damage: 45, cooldown: 1.1, ability: { type: 'none' }, abilityText: 'A stronger bouncy attack.' },
        3: { damage: 90, cooldown: 1.1, ability: { type: 'bounce', chance: 0.5, targets: 3 }, abilityText: '50% chance to bounce to 2 other targets.' },
        4: { damage: 180, cooldown: 1.0, ability: { type: 'pounce', chance: 0.2, duration: 1500 }, abilityText: '20% chance to Pounce, stunning the target for 1.5s.' },
        5: { damage: 360, cooldown: 1.0, ability: { type: 'splash', radius: 2.0, multiplier: 0.5 }, abilityText: 'Attacks create a shockwave, dealing 50% splash damage.' },
    }
};