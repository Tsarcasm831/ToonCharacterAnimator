export const donaldDuckHeroData = {
    id: 'donald_duck',
    name: 'Donald Duck',
    rarity: 'epic',
    lore: "Donald's famously short temper becomes a powerful weapon against the Disruptions. The glitches' chaotic nature only makes him angrier, and he channels this uncontrollable fury into comical yet destructive tantrums that blast the bugs from the story.",
    tags: ["Damage", "AoE", "Rage"],
    projectile: {
        sound: 'fury',
        color: 0xff0000,
    },
    heroAbility: {
        name: "Uncontrollable Rage",
        description: "Donald throws a massive tantrum, dealing 150 damage to all enemies and granting all Donald Ducks on the field a 100% attack speed boost for 8 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 15, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 40, bonus: 'Hero Ability also stuns all enemies for 1 second.' },
        4: { shards: 80, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 150, bonus: 'Temper Tantrum (Lvl 5) now provides a 5% attack speed boost per stack.' }
    },
    levels: {
        1: { damage: 30, cooldown: 1.1, ability: { type: 'none' }, abilityText: 'An angry quack attack.' },
        2: { damage: 65, cooldown: 1.0, ability: { type: 'none' }, abilityText: 'A furious quack attack.' },
        3: { damage: 130, cooldown: 1.0, ability: { type: 'tantrum_squawk', chance: 0.15, duration: 1000 }, abilityText: '15% chance to squawk loudly, stunning the target for 1s.' },
        4: { damage: 260, cooldown: 1.0, ability: { type: 'splash', radius: 2.5, multiplier: 0.3 }, abilityText: 'Attacks explode in a furious splash, dealing 30% damage to nearby enemies.' },
        5: { damage: 550, cooldown: 0.9, ability: { type: 'temper_tantrum', stacks: 0, max_stacks: 10, speed_per_stack: 0.04 }, abilityText: 'Each attack increases his attack speed by 4%, stacking up to 10 times.' },
    }
};

