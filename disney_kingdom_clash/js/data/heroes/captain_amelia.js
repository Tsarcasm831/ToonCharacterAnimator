export const captainAmeliaHeroData = {
    id: 'captain_amelia',
    name: 'Captain Amelia',
    rarity: 'epic',
    lore: "Captain Amelia's star charts and navigational tools have been scrambled by the Disruptions, threatening to maroon her entire fleet in a sea of corrupted data. A brilliant tactician and commander, she uses her ship's advanced weaponry and her own combat prowess to blast a clear path through the glitches, determined to restore her story's course.",
    tags: ["High DPS", "AoE Damage", "Debuff"],
    projectile: {
        sound: 'phaser',
        color: 0x00ffff,
    },
    heroAbility: {
        name: "Broadside Barrage",
        description: "Calls in an orbital strike from her ship, dealing 250 damage to all enemies and briefly stunning them for 1.5 seconds.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 25, bonus: '+15% base damage.', damageMultiplier: 1.15 },
        3: { shards: 60, bonus: 'Hero Ability stun duration increased to 2.5 seconds.' },
        4: { shards: 120, bonus: '+30% base damage.', damageMultiplier: 1.30 },
        5: { shards: 250, bonus: 'Mark Target (Lvl 3) curse effect increased to 30% more damage.' }
    },
    levels: {
        1: { damage: 50, cooldown: 1.0, ability: { type: 'none' }, abilityText: 'Fires a standard issue naval sidearm.' },
        2: { damage: 100, cooldown: 0.9, ability: { type: 'none' }, abilityText: 'Fires an upgraded naval sidearm.' },
        3: { damage: 200, cooldown: 0.9, ability: { type: 'curse', multiplier: 1.2, duration: 4000 }, abilityText: 'Marks target, causing them to take 20% more damage for 4s.' },
        4: { damage: 400, cooldown: 0.8, ability: { type: 'splash', radius: 2.0, multiplier: 0.25 }, abilityText: 'Shots explode, dealing 25% splash damage to nearby enemies.' },
        5: { damage: 800, cooldown: 0.8, ability: { type: 'adrenaline_rush', on_kill: true, speed_boost: 0.5, duration: 3000 }, abilityText: 'On stabilization, gain 50% increased attack speed for 3s.' },
    }
};