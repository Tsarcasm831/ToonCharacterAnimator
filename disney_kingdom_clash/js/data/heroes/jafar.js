export const jafarHeroData = {
    id: 'jafar',
    name: 'Jafar',
    rarity: 'legendary',
    lore: "Jafar's ambition knows no bounds, and even a narrative fracture is an opportunity. He sees the Disruptions as a source of chaotic power to be controlled. He wields dark, forbidden code to curse the glitches, bending them to his will before erasing them.",
    tags: ["Debuff", "Damage Amp", "Boss Killer"],
    projectile: {
        sound: 'shadow',
        color: 0x8A2BE2,
    },
    heroAbility: {
        name: "Serpent's Gaze",
        description: "Curses all enemies to take 50% more damage for 8s and stuns them for 2s.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 25, bonus: '+15% base damage.', damageMultiplier: 1.15 },
        3: { shards: 60, bonus: 'Curse abilities last 1 second longer.' },
        4: { shards: 120, bonus: '+30% base damage.', damageMultiplier: 1.30 },
        5: { shards: 250, bonus: 'Hero Ability also applies a damage over time effect for its duration.' }
    },
    levels: {
        1: { damage: 45, cooldown: 1.3, ability: { type: 'none' }, abilityText: 'A basic shadow attack.' },
        2: { damage: 90, cooldown: 1.3, ability: { type: 'none' }, abilityText: 'A stronger shadow attack.' },
        3: { damage: 180, cooldown: 1.2, ability: { type: 'chain_curse', multiplier: 1.20, duration: 4000, targets: 2 }, abilityText: 'Curses target and one other, making them take 20% more damage for 4s.' },
        4: { damage: 360, cooldown: 1.2, ability: { type: 'spreading_curse', multiplier: 1.25, duration: 4000, radius: 2.0 }, abilityText: 'Curses target and nearby enemies, making them take 25% more damage for 4s.' },
        5: { damage: 720, cooldown: 1.1, ability: { type: 'doom', chance: 0.15 }, abilityText: '15% chance to instantly destroy a non-boss enemy.' },
    }
};