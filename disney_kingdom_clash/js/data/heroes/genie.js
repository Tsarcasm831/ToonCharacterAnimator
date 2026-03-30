export const genieHeroData = {
    id: 'genie',
    name: 'Genie',
    rarity: 'epic',
    lore: "The Genie's phenomenal cosmic power is usually bound by rules, but the Disruptions have scrambled his code. He grants wishes to the player in the form of pure narrative energy (mana), hoping to debug his own story and get back to his vacation.",
    tags: ["Support", "Mana Generation", "Utility"],
    projectile: {
        sound: 'magic',
        color: 0x4169e1,
    },
    heroAbility: {
        name: "A-la-Kazam!",
        description: "Instantly grants 100 mana.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 15, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 40, bonus: 'Hero Ability also grants 20 bonus gold.' },
        4: { shards: 80, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 150, bonus: 'Cosmic Power (Lvl 5) passive only requires 2 attacks to trigger.' }
    },
    levels: {
        1: { damage: 30, cooldown: 1.2, ability: { type: 'none' }, abilityText: 'A basic magical attack.' },
        2: { damage: 60, cooldown: 1.1, ability: { type: 'none' }, abilityText: 'A stronger magical attack.' },
        3: { damage: 120, cooldown: 1.0, ability: { type: 'wishful_thinking', chance: 0.2 }, abilityText: '20% chance to also cast a random spell effect on target.' },
        4: { damage: 240, cooldown: 1.0, ability: { type: 'friend_like_me', chance: 0.5 }, abilityText: 'On stabilization, 50% chance to grant a random ally a 5s, 50% damage boost.' },
        5: { damage: 480, cooldown: 0.9, ability: { type: 'cosmic_power', attacks_needed: 3, attack_count: 0, mana_gain: 1 }, abilityText: 'Passively grants 1 mana every 3 attacks.' },
    }
};