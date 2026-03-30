export const cogsworthHeroData = {
    id: 'cogsworth',
    name: 'Cogsworth',
    rarity: 'rare',
    franchise: 'beauty_and_the_beast',
    lore: "As the majordomo of a cursed castle, Cogsworth values order and punctuality above all. The Disruptions represent pure chaos, throwing every schedule into disarray. He takes it upon himself to restore temporal order, winding back the glitches and ensuring the story proceeds exactly as it should.",
    tags: ["Support", "Slow", "Utility"],
    projectile: {
        sound: 'gear',
        color: 0xB8860B, // Dark Goldenrod
    },
    heroAbility: {
        name: "It's Time To Go!",
        description: "Slows all enemies by 80% for 8 seconds and stuns them for the first 2 seconds of the duration.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 10, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 25, bonus: 'Hero Ability slow effect increased to 90%.' },
        4: { shards: 50, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 100, bonus: 'Clockwork Precision (Lvl 5) passive cooldown reduction increased to 20%.' }
    },
    levels: {
        1: { damage: 20, cooldown: 1.5, ability: { type: 'none' }, abilityText: 'A basic gear attack.' },
        2: { damage: 42, cooldown: 1.4, ability: { type: 'none' }, abilityText: 'A more precise gear attack.' },
        3: { damage: 90, cooldown: 1.4, ability: { type: 'slow', chance: 0.3, amount: 0.3, duration: 2000 }, abilityText: '30% chance to slow target by 30% for 2s.' },
        4: { damage: 180, cooldown: 1.3, ability: { type: 'splash_slow', amount: 0.4, duration: 2500, radius: 2.5 }, abilityText: 'Gears splash, slowing nearby enemies by 40% for 2.5s.' },
        5: { damage: 350, cooldown: 1.3, ability: { type: 'clockwork_precision', radius: 4.0, speed_boost: 0.9 }, abilityText: 'Passively reduces the cooldown of nearby allies by 10%.' },
    }
};

