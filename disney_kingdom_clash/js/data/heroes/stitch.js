export const stitchHeroData = {
    id: 'stitch',
    name: 'Stitch',
    rarity: 'epic',
    lore: "Designed for chaos, Experiment 626 found his 'ohana'. The Disruptions threaten his found family, glitching them in and out of the story. Stitch embraces his chaotic origins, using his unpredictable nature to scramble the glitches and protect his place in the narrative.",
    tags: ["High DPS", "Attack Speed", "Chaos"],
    projectile: {
        sound: 'plasma',
        color: 0xff00ff,
    },
    heroAbility: {
        name: "Chaos Theory",
        description: "Scrambles enemy positions and stuns them for 1 second.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 10, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 25, bonus: 'Maximum Frenzy stacks increased by 2 at all levels.' },
        4: { shards: 50, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 100, bonus: 'Hero Ability stun duration increased to 2 seconds.' }
    },
    levels: {
        1: { damage: 20, cooldown: 0.8, ability: { type: 'none' }, abilityText: 'A basic plasma attack.' },
        2: { damage: 40, cooldown: 0.7, ability: { type: 'none' }, abilityText: 'A stronger plasma attack.' },
        3: { damage: 80, cooldown: 0.6, ability: { type: 'frenzy', stacks: 0, max_stacks: 10, speed_per_stack: 0.04 }, abilityText: 'Attacks grant a stacking 4% attack speed buff.' },
        4: { damage: 160, cooldown: 0.8, ability: { type: 'multi_attack', targets: 2 }, abilityText: 'Attacks hit a second random target in range.' },
        5: { damage: 320, cooldown: 0.7, ability: { type: 'overload', chance: 0.2 }, abilityText: '20% chance on attack to overload, attacking all enemies in range at once.' },
    }
};