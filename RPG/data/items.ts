import { ITEM_IMAGES, ITEM_ICONS } from '../../data/constants';
import type { RPGItemDef, ItemRarity } from '../types';
import { SELL_RATIO } from '../types';

// The RPG item catalog. Names deliberately match data/constants.ts entries so
// existing icon art is reused; icons not present there get explicit paths.

const DEFS: RPGItemDef[] = [
  // -- Weapons ---------------------------------------------------------------
  {
    name: 'Wooden Sword',
    kind: 'weapon',
    rarity: 'common',
    description: 'A militia training blade. Better than fists, barely.',
    value: 12,
    equip: { slot: 'weapon', heldItem: 'Sword', bonus: { damage: 0 } },
  },
  {
    name: 'Sword',
    kind: 'weapon',
    rarity: 'uncommon',
    description: 'Borin’s honest steel. Holds an edge through a long hunt.',
    value: 90,
    equip: { slot: 'weapon', heldItem: 'Sword', bonus: { damage: 3 } },
  },
  {
    name: 'Axe',
    kind: 'weapon',
    rarity: 'common',
    description: 'A woodsman’s axe. Splits logs and lupine skulls alike.',
    value: 55,
    equip: { slot: 'weapon', heldItem: 'Axe', bonus: { damage: 2 } },
  },
  {
    name: 'Halberd',
    kind: 'weapon',
    rarity: 'rare',
    description: 'Reach enough to keep teeth away from your throat.',
    value: 160,
    equip: { slot: 'weapon', heldItem: 'Halberd', bonus: { damage: 4, defense: 1 } },
  },
  {
    name: 'Staff',
    kind: 'weapon',
    rarity: 'uncommon',
    description: 'A focus-staff humming faintly with hearth-magic.',
    value: 70,
    equip: { slot: 'weapon', heldItem: 'Staff', bonus: { damage: 0 } },
  },

  // -- Tools -------------------------------------------------------------------
  {
    name: 'Knife',
    kind: 'tool',
    rarity: 'common',
    description: 'A skinning knife. Equip it to harvest pelts from fresh kills.',
    value: 25,
    equip: { slot: 'weapon', heldItem: 'Knife' },
  },

  // -- Armor -------------------------------------------------------------------
  {
    name: 'Leather Shirt',
    kind: 'armor',
    rarity: 'common',
    description: 'Treated hide over the ribs. Wolves notice the difference.',
    value: 45,
    equip: { slot: 'torso', equipmentFlags: ['leatherArmor'], bonus: { defense: 2 } },
  },
  {
    name: 'Plate Mail',
    kind: 'armor',
    rarity: 'rare',
    description: 'Riveted plates from the old garrison. Heavy, glorious.',
    value: 220,
    equip: { slot: 'torso', equipmentFlags: ['plateMail'], bonus: { defense: 4, maxHp: 10 } },
  },
  {
    name: 'Leather Pants',
    kind: 'armor',
    rarity: 'common',
    description: 'Stiff hide leggings, scarred by old briars.',
    value: 35,
    equip: { slot: 'legs', equipmentFlags: ['leatherPants'], bonus: { defense: 1 } },
  },
  {
    name: 'Helm',
    kind: 'armor',
    rarity: 'uncommon',
    description: 'A dented half-helm. The dent is someone else’s story.',
    value: 70,
    equip: { slot: 'head', equipmentFlags: ['helm'], bonus: { defense: 2 } },
  },
  {
    name: 'Hood',
    kind: 'armor',
    rarity: 'common',
    description: 'A traveler’s hood against rain and watchful eyes.',
    value: 20,
    equip: { slot: 'head', equipmentFlags: ['hood'], bonus: { defense: 1 } },
  },
  {
    name: 'Shield',
    kind: 'armor',
    rarity: 'uncommon',
    description: 'A round shield of banded oak.',
    value: 85,
    equip: { slot: 'offhand', equipmentFlags: ['shield'], bonus: { defense: 2 } },
  },
  {
    name: 'Wooden Shoes',
    kind: 'armor',
    rarity: 'common',
    description: 'Clogs carved from vale-wood. Loud, but sturdy.',
    value: 15,
    equip: { slot: 'feet', equipmentFlags: ['shoes'], bonus: { defense: 1 } },
  },

  // -- Consumables --------------------------------------------------------------
  {
    name: 'Potion of Healing',
    kind: 'consumable',
    rarity: 'uncommon',
    description: 'Bitter red draught. Knits flesh in moments.',
    value: 18,
    consume: { heal: 40, effectLabel: '+40 HP' },
  },
  {
    name: 'Porkchop',
    kind: 'consumable',
    rarity: 'common',
    description: 'Smoked over a Briarhollow hearth.',
    value: 6,
    consume: { heal: 12, effectLabel: '+12 HP' },
  },
  {
    name: 'Red Berries',
    kind: 'consumable',
    rarity: 'common',
    description: 'Sweet vale berries. A small mercy on the road.',
    value: 3,
    icon: '/assets/images/items/red_berries.png',
    consume: { heal: 6, effectLabel: '+6 HP' },
  },

  // -- Materials & treasure ------------------------------------------------------
  {
    name: 'Wolf Pelt',
    kind: 'material',
    rarity: 'uncommon',
    description: 'Thick grey winter fur. Hale pays double for these.',
    value: 14,
    icon: '/assets/images/items/new/treated_leather.png',
  },
  {
    name: 'Raw Meat',
    kind: 'material',
    rarity: 'common',
    description: 'Fresh game meat. The innkeeper buys it by the basket.',
    value: 5,
    icon: '/assets/images/items/new/porkchop.png',
  },
  {
    name: 'Bone Fragments',
    kind: 'material',
    rarity: 'common',
    description: 'Splintered bone. Grinders and charm-makers want it.',
    value: 4,
  },
  {
    name: 'Leather',
    kind: 'material',
    rarity: 'common',
    description: 'Cured hide, ready for the workbench.',
    value: 8,
  },
  {
    name: 'Rope',
    kind: 'material',
    rarity: 'common',
    description: 'Tightly braided grass rope.',
    value: 7,
  },
  {
    name: 'Wood',
    kind: 'material',
    rarity: 'common',
    description: 'Split vale-pine, smelling of resin.',
    value: 3,
  },
  {
    name: 'Gold Ring',
    kind: 'treasure',
    rarity: 'rare',
    description: 'An old signet, initials worn smooth. Worth a purse on its own.',
    value: 120,
    emoji: '💍',
  },
];

export const RPG_ITEMS: Record<string, RPGItemDef> = Object.fromEntries(
  DEFS.map((d) => [d.name, d]),
);

export function getItemDef(name: string): RPGItemDef | undefined {
  return RPG_ITEMS[name];
}

export function getMaxStack(name: string): number {
  const def = RPG_ITEMS[name];
  if (!def) return 99;
  if (def.stack) return def.stack;
  return def.equip || def.kind === 'tool' ? 1 : 99;
}

export function getBuyPrice(name: string): number {
  return RPG_ITEMS[name]?.value ?? 5;
}

export function getSellPrice(name: string, vendorMultiplier = 1): number {
  const base = RPG_ITEMS[name]?.value ?? 2;
  return Math.max(1, Math.round(base * SELL_RATIO * vendorMultiplier));
}

/** Resolve an icon: explicit path > shared ITEM_IMAGES art > emoji > default. */
export function getItemIcon(name: string): { image?: string; emoji: string } {
  const def = RPG_ITEMS[name];
  const image = def?.icon ?? (ITEM_IMAGES as Record<string, string>)[name];
  const emoji = def?.emoji ?? (ITEM_ICONS as Record<string, string>)[name] ?? '🎒';
  return { image, emoji };
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'text-stone-300',
  uncommon: 'text-emerald-400',
  rare: 'text-sky-400',
  epic: 'text-purple-400',
};

export const RARITY_BORDERS: Record<ItemRarity, string> = {
  common: 'border-white/10',
  uncommon: 'border-emerald-500/40',
  rare: 'border-sky-500/40',
  epic: 'border-purple-500/40',
};
