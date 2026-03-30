export const moanaHeroData = {
    id: 'moana',
    name: 'Moana',
    rarity: 'epic',
    lore: "The ocean chose Moana to restore the heart of Te Fiti, and now it calls her again to mend the fractured storyline. The Disruptions appear as unnatural, static-filled storms. She commands the tides to push back the glitches, clearing the way for her story to find its way.",
    tags: ["Crowd Control", "Push", "Displacement"],
    projectile: {
        sound: 'water',
        color: 0x87cefa,
    },
    heroAbility: {
        name: "Tidal Wave",
        description: "Pushes all enemies back a long distance.",
    },
    starLevels: {
        1: { bonus: 'No bonus at 1 star.' },
        2: { shards: 10, bonus: '+10% base damage.', damageMultiplier: 1.10 },
        3: { shards: 25, bonus: 'Hero Ability also slows enemies by 30% for 3 seconds.' },
        4: { shards: 50, bonus: '+25% base damage.', damageMultiplier: 1.25 },
        5: { shards: 100, bonus: 'Maelstrom (Lvl 5) ability has a 20% larger pull radius.' }
    },
    levels: {
        1: { damage: 20, cooldown: 1.5, ability: { type: 'none' }, abilityText: 'A basic water attack.' },
        2: { damage: 45, cooldown: 1.2, ability: { type: 'none' }, abilityText: 'A stronger water attack.' },
        3: { damage: 100, cooldown: 1.0, ability: { type: 'wave', chance: 0.3, distance: 3.0, radius: 2.5 }, abilityText: '30% chance to create a wave, knocking back the target and nearby enemies.' },
        4: { damage: 200, cooldown: 1.0, ability: { type: 'tsunami', chance: 0.4, distance: 5.0 }, abilityText: '40% chance to summon a tsunami, knocking back ALL enemies.' },
        5: { damage: 400, cooldown: 1.0, ability: { type: 'maelstrom', chance: 0.5, distance: 2.0, pull: true }, abilityText: '50% chance to summon a maelstrom that pulls all enemies toward it and damages them.' },
    }
};