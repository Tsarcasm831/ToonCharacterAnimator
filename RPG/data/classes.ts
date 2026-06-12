import type { RPGClassDef, RPGClassId } from '../types';

// Starting classes. Held-item damage is fixed by the engine (Sword 5, Axe 4,
// Halberd 4, anything else 1), so class identity comes from HP pools, the
// class damage passive, starting gear and gold.

export const RPG_CLASSES: Record<RPGClassId, RPGClassDef> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    tagline: 'Steel and stubbornness.',
    description:
      'A wall of muscle raised on militia drills. Hits hard with a blade and shrugs off bites that would drop lesser folk.',
    baseMaxHp: 120,
    classDamageBonus: 0,
    startingGold: 20,
    startingItems: [
      { name: 'Wooden Sword', count: 1 },
      { name: 'Leather Shirt', count: 1 },
      { name: 'Potion of Healing', count: 1 },
    ],
    startingEquipped: ['Wooden Sword', 'Leather Shirt'],
    configOverrides: {
      bodyVariant: 'muscular',
      weaponStance: 'side',
    },
  },
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    tagline: 'The forest keeps no secrets.',
    description:
      'A tracker who knows every wolf trail in the vale. Starts with an axe, a skinning knife, and food for the road.',
    baseMaxHp: 100,
    classDamageBonus: 1,
    startingGold: 30,
    startingItems: [
      { name: 'Axe', count: 1 },
      { name: 'Knife', count: 1 },
      { name: 'Porkchop', count: 2 },
      { name: 'Potion of Healing', count: 1 },
    ],
    startingEquipped: ['Axe'],
    configOverrides: {
      bodyVariant: 'average',
      weaponStance: 'shoulder',
    },
  },
  adept: {
    id: 'adept',
    name: 'Adept',
    tagline: 'The staff remembers older roads.',
    description:
      'A scholar of the hearth-arts. Frail, but every strike of the focus-staff lands with arcane weight, and the purse is heavier.',
    baseMaxHp: 88,
    classDamageBonus: 4,
    startingGold: 45,
    startingItems: [
      { name: 'Staff', count: 1 },
      { name: 'Potion of Healing', count: 2 },
      { name: 'Red Berries', count: 3 },
    ],
    startingEquipped: ['Staff'],
    configOverrides: {
      bodyVariant: 'slim',
      weaponStance: 'side',
    },
  },
};

export const CLASS_LIST: RPGClassDef[] = [
  RPG_CLASSES.warrior,
  RPG_CLASSES.hunter,
  RPG_CLASSES.adept,
];

// Leveling -------------------------------------------------------------------

export const XP_PER_WOLF = 12;

export function xpToNext(level: number): number {
  return 30 + (level - 1) * 30;
}

/** Flat damage bonus from level (stacks with class passive + weapon bonus). */
export function levelDamageBonus(level: number): number {
  return Math.floor((level - 1) / 2);
}

/** Max HP gained per level-up. */
export const HP_PER_LEVEL = 12;
