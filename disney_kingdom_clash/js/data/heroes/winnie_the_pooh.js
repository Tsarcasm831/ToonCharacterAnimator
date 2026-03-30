export const winnieThePoohHeroData = {
    id: 'winnie_the_pooh',
    name: 'Winnie the Pooh',
    rarity: 'common',
    lore: "Pooh's simple, gentle story of friendship and honey is being threatened by sticky, buggy code. To protect his friends and his next smackerel, Pooh uses what he knows best: honey. He slows the Disruptions to a crawl, making them easy to correct.",
    tags: ["Slow", "AoE Control", "Defense"],
    projectile: {
        sound: 'honey',
        color: 0xFFB90F,
    },
    heroAbility: {
        name: "A Smackerel of Honey",
        description: "All enemies are covered in honey, slowing them by 70% for 8 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 20, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 50, bonus: 'Honey slows also reduce enemy attack speed by 15%.' },
        4: { shards: 100, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 200, bonus: 'Hungry Smack (Lvl 5) now has a 30% chance to trigger.' }
    },
    levels: {
        1: { damage: 15, cooldown: 1.7, ability: { type: 'none' }, abilityText: 'Throws a small pot of honey.' },
        2: { damage: 32, cooldown: 1.6, ability: { type: 'none' }, abilityText: 'Throws a bigger pot of honey.' },
        3: { damage: 70, cooldown: 1.5, ability: { type: 'splash_slow', amount: 0.4, duration: 2500, radius: 2.0 }, abilityText: 'Honey pot splashes, slowing target and nearby enemies by 40% for 2.5s.' },
        4: { damage: 140, cooldown: 1.5, ability: { type: 'splash_slow', amount: 0.6, duration: 3000, radius: 2.5 }, abilityText: 'A bigger honey pot splashes, heavily slowing enemies by 60% for 3s.' },
        5: { damage: 280, cooldown: 1.4, ability: { type: 'hungry_smack', chance: 0.2, multiplier: 3.0 }, abilityText: '20% chance to get really hungry and smack for 300% damage.' },
    }
};