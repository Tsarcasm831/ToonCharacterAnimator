export const jimHawkinsHeroData = {
    id: 'jim_hawkins',
    name: 'Jim Hawkins',
    rarity: 'epic',
    lore: "A born adventurer, Jim Hawkins charted his own course to Treasure Planet. The narrative glitch has shattered his map, leaving him stranded in a sea of corrupted data. With his solar surfer, he navigates the broken code, blasting Disruptions to reassemble his path to destiny.",
    tags: ["High DPS", "Single Target", "Finisher"],
    projectile: {
        sound: 'ion',
        color: 0x00ffff,
    },
    heroAbility: {
        name: "Solar Surfer Strafe",
        description: "Jim zips across the battlefield on his solar surfer, dealing 200 damage to 8 random enemies.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 25, bonus: '+15% base damage.', damageMultiplier: 1.15 },
        3: { shards: 60, bonus: 'Hero Ability hits 2 additional targets.' },
        4: { shards: 120, bonus: '+30% base damage.', damageMultiplier: 1.30 },
        5: { shards: 250, bonus: 'Adrenaline Rush (Lvl 5) attack speed buff is now 75%.' }
    },
    levels: {
        1: { damage: 45, cooldown: 0.9, ability: { type: 'none' }, abilityText: 'Fires a standard ion pistol.' },
        2: { damage: 90, cooldown: 0.85, ability: { type: 'none' }, abilityText: 'Fires an upgraded ion pistol.' },
        3: { damage: 180, cooldown: 0.85, ability: { type: 'piercing_shot', chance: 0.3, targets: 2 }, abilityText: '30% chance for shots to pierce, hitting a second target.' },
        4: { damage: 360, cooldown: 0.8, ability: { type: 'cannon_blast', chance: 0.15, duration: 2000 }, abilityText: '15% chance to fire a heavy cannon blast, stunning the target for 2s.' },
        5: { damage: 700, cooldown: 0.8, ability: { type: 'adrenaline_rush', on_kill: true, speed_boost: 0.5, duration: 3000 }, abilityText: 'On stabilization, gain 50% increased attack speed for 3s.' },
    }
};