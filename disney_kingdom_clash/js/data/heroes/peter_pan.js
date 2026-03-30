export const peterPanHeroData = {
    id: 'peter_pan',
    name: 'Peter Pan',
    rarity: 'epic',
    lore: "The boy who wouldn't grow up, Peter Pan guards the threshold between childhood dreams and the mundane world. The Disruptions threaten to age Neverland, turning it into a place of rules and responsibility. Peter Pan uses his eternal youth and the magic of belief (and a little pixie dust) to fight back, ensuring his story never ends.",
    tags: ["Crowd Control", "Agility", "Buff"],
    projectile: {
        sound: 'wind',
        color: 0x228b22, // Forest Green
    },
    heroAbility: {
        name: "Crow's Call",
        description: "Peter Pan lets out a mighty crow, briefly stunning all enemies for 2 seconds and increasing the attack speed of all allies by 50% for 6 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 15, bonus: '+15% base damage.', damageMultiplier: 1.15 },
        3: { shards: 40, bonus: "Hero Ability's stun duration is increased to 3 seconds." },
        4: { shards: 80, bonus: '+30% base damage.', damageMultiplier: 1.30 },
        5: { shards: 150, bonus: "Neverland's Blessing (Lvl 5) has a higher chance to evade and returns the enemy to spawn." }
    },
    levels: {
        1: { damage: 28, cooldown: 1.2, ability: { type: 'none' }, abilityText: 'A quick dagger strike.' },
        2: { damage: 55, cooldown: 1.1, ability: { type: 'none' }, abilityText: 'A faster dagger strike.' },
        3: { damage: 120, cooldown: 1.1, ability: { type: 'knockback', chance: 0.25, distance: 1.5 }, abilityText: '25% chance to knock the target back with a gust of wind.' },
        4: { damage: 240, cooldown: 1.0, ability: { type: 'multi_attack', targets: 2 }, abilityText: 'Attacks can hit a second target.' },
        5: { damage: 480, cooldown: 1.0, ability: { type: 'neverland_blessing', on_end_of_path: true, chance: 0.1 }, abilityText: 'Has a 10% chance to evade an enemy that reaches the end, returning it to the start.' },
    }
};