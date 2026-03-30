export const mickeyMouseHeroData = {
    id: 'mickey_mouse',
    name: 'Mickey Mouse',
    rarity: 'legendary',
    lore: "As the original anchor of countless stories, Mickey Mouse is the keystone of the narrative. The Disruptions target him most of all, seeking to unravel the very fabric of imagination. Mickey conducts the magic of story itself, buffing his friends to fight back and repaint the world.",
    tags: ["Support", "Buff", "Leader"],
    projectile: {
        sound: 'magic_sparkle',
        color: 0xffd700,
    },
    heroAbility: {
        name: "Oh, Boy!",
        description: "Inspires all allies, granting them 100% increased damage and attack speed for 7 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 25, bonus: '+15% base damage.', damageMultiplier: 1.15 },
        3: { shards: 60, bonus: 'Hero Ability also makes allies immune to stuns and slows.' },
        4: { shards: 120, bonus: '+30% base damage.', damageMultiplier: 1.30 },
        5: { shards: 250, bonus: 'Hero Ability duration increased to 10 seconds.' }
    },
    levels: {
        1: { damage: 40, cooldown: 1.0, ability: { type: 'none' }, abilityText: 'A basic magical attack.' },
        2: { damage: 80, cooldown: 0.9, ability: { type: 'none' }, abilityText: 'A stronger magical attack.' },
        3: { damage: 160, cooldown: 0.9, ability: { type: 'magic_boost', chance: 0.2, multiplier: 1.5, duration: 5000 }, abilityText: "20% chance to boost a random ally's damage by 50% for 5s." },
        4: { damage: 320, cooldown: 0.8, ability: { type: 'area_magic_boost', radius: 4.0, multiplier: 1.3, duration: 5000 }, abilityText: 'Boosts damage of all allies in a large radius by 30% for 5s.' },
        5: { damage: 640, cooldown: 0.8, ability: { type: 'imagination_mana', attacks_needed: 5, attack_count: 0, mana_gain: 25 }, abilityText: 'Every 5 attacks, grants 25 mana.' },
    }
};