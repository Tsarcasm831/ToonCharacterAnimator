import { BodyVariant, PlayerConfig, OutfitType, ItemData } from '../types';

export const BODY_PRESETS: Record<BodyVariant, Partial<PlayerConfig>> = {
  average: {
    torsoWidth: 1.0, torsoHeight: 1.0, 
    armScale: 1.0, legScale: 1.0, 
    headScale: 1.0, footWidth: 1.0, 
    neckHeight: 0.6, neckThickness: 0.7,
    chinSize: 0.7, chinLength: 1.0,
    buttScale: 0.75,
    shirtColor: '#cc0000',
    hairStyle: 'crew',
    hairColor: '#3e2723'
  },
  muscular: {
    torsoWidth: 1.2, torsoHeight: 1.1, 
    armScale: 1.1, legScale: 1.1, 
    headScale: 0.9, footWidth: 1.1, 
    neckHeight: 0.6, neckThickness: 0.7,
    chinSize: 0.7, chinLength: 1.1,
    irisScale: 0.5, pupilScale: 0.4,
    noseHeight: 0, noseForward: -0.02,
    buttScale: 1.1,
    shirtColor: '#2d3748',
    hairStyle: 'bald',
    hairColor: '#000000'
  },
  slim: {
    torsoWidth: 0.85, torsoHeight: 0.98, 
    armScale: 0.9, legScale: 1.05, 
    headScale: 1.02, footWidth: 0.9, 
    neckHeight: 0.75, neckThickness: 0.65,
    chinSize: 0.6, chinLength: 0.9,
    buttScale: 0.9,
    shirtColor: '#38a169',
    hairStyle: 'crew',
    hairColor: '#d7ccc8'
  },
  heavy: {
    torsoWidth: 1.4, torsoHeight: 1.0, 
    armScale: 1.1, legScale: 0.9, 
    headScale: 1.1, footWidth: 1.25, 
    neckHeight: 0.6, neckThickness: 0.7,
    chinSize: 0.65, chinLength: 0.9,
    irisScale: 0.5, pupilScale: 0.4,
    noseHeight: 0, noseForward: -0.02,
    buttScale: 1.3,
    shirtColor: '#d69e2e',
    hairStyle: 'crew',
    hairColor: '#212121'
  }
};

export const OUTFIT_PRESETS: Record<OutfitType, Partial<PlayerConfig>> = {
  nude: {
    outfit: 'nude',
    equipment: { helm: false, shoulders: false, shield: false, shirt: false, leatherDoublet: false, pants: false, hideBreeches: false, leatherPants: false, chainLeggings: false, plateLeggings: false, warlordLegPlates: false, greaves: false, shoes: false, mask: false, hood: false, quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, blacksmithApron: false, mageHat: false, bracers: false, gloves: false, cape: false, belt: false, skirt: false, skullcap: false, shorts: false },
    shirtColor: '#d6b198',
    pantsColor: '#9c6644'
  },
  naked: {
    outfit: 'naked',
    equipment: { helm: false, shoulders: false, shield: false, shirt: false, leatherDoublet: false, pants: false, hideBreeches: false, leatherPants: false, chainLeggings: false, plateLeggings: false, warlordLegPlates: false, greaves: false, shoes: false, mask: false, hood: false, quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, blacksmithApron: false, mageHat: false, bracers: false, gloves: false, cape: false, belt: false, skirt: false, skullcap: false, shorts: false },
    shirtColor: '#d6b198',
    pantsColor: '#9c6644'
  },
  peasant: {
    outfit: 'peasant',
    equipment: { helm: false, shoulders: false, shield: false, shirt: true, leatherDoublet: false, pants: true, hideBreeches: false, leatherPants: false, chainLeggings: false, plateLeggings: false, warlordLegPlates: false, greaves: false, shoes: true, mask: false, hood: false, quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, blacksmithApron: false, mageHat: false, bracers: false, gloves: false, cape: false, belt: false, skirt: false, skullcap: false, shorts: false },
    shirtColor: '#8d6e63',
    pantsColor: '#5d4037'
  },
  warrior: {
    outfit: 'warrior',
    equipment: { helm: true, shoulders: true, shield: true, shirt: true, leatherDoublet: false, pants: true, hideBreeches: false, leatherPants: false, chainLeggings: false, plateLeggings: false, warlordLegPlates: false, greaves: true, shoes: true, mask: true, hood: true, quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, blacksmithApron: false, mageHat: false, bracers: true, gloves: false, cape: false, belt: true, skirt: false, skullcap: false, shorts: false },
    shirtColor: '#607d8b',
    pantsColor: '#37474f'
  },
  noble: {
    outfit: 'noble',
    equipment: { helm: false, shoulders: false, shield: false, shirt: true, leatherDoublet: false, pants: true, hideBreeches: false, leatherPants: false, chainLeggings: false, plateLeggings: false, warlordLegPlates: false, greaves: false, shoes: true, mask: false, hood: false, quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: true, blacksmithApron: false, mageHat: false, bracers: false, gloves: false, cape: true, belt: true, skirt: false, skullcap: false, shorts: false },
    shirtColor: '#3f51b5',
    pantsColor: '#1a237e'
  }
};

export const ITEM_ICONS: Record<string, string> = {
  'Axe': '🪓',
  'Sword': '⚔️',
  'Staff': '✨',
  'Pickaxe': '⛏️',
  'Knife': '🔪',
  'Halberd': '🔱',
  'Fishing Pole': '🎣',
  'Bow': '🏹',
  'Shirt': '👕',
  'Quilted Armor': '🧥',
  'Leather Armor': '🥋',
  'Hide Breeches': '🩳',
  'Leather Pants': '👖',
  'Chain Leggings': '⛓️',
  'Plate Leggings': '🛡️',
  'Warlord Leg Plates': '🛡️',
  'Leather Doublet': '🦺',
  'Heavy Leather Armor': '🛡️',
  'RingMail': '⛓️',
  'Plate Mail': '🎖️',
  'Pants': '👖',
  'Shoes': '👢',
  'Mask': '😷',
  'Hood': '🧥',
  'Robe': '🥋',
  'Helm': '🪖',
  'Shield': '🛡️',
  'Gold Ring': '💍',
  'Bone Dust': '☠️',
  'Scrap Metal': '🔩',
  'Wood': '🪵',
  'Coal': '🌑',
  'Potion of Healing': '🧪',
  'Mana Potion': '🧪'
};

export const ITEM_DATA: Record<string, ItemData> = {
  'Axe': { name: 'Axe', description: 'A heavy woodcutting axe that can also serve as a weapon.', type: 'weapon', rarity: 'common', stats: { damage: 12 } },
  'Sword': { name: 'Sword', description: 'A simple stone sword.', type: 'weapon', rarity: 'common', stats: { damage: 15 } },
  'Staff': { name: 'Staff', description: 'A wooden staff imbued with minor magical properties.', type: 'weapon', rarity: 'common', stats: { damage: 8, manaBonus: 10 } },
  'Pickaxe': { name: 'Pickaxe', description: 'Useful for mining ores.', type: 'weapon', rarity: 'common', stats: { damage: 10 } },
  'Knife': { name: 'Knife', description: 'A small, quick blade.', type: 'weapon', rarity: 'common', stats: { damage: 6, speedBonus: 0.2 } },
  'Halberd': { name: 'Halberd', description: 'A long-reaching polearm.', type: 'weapon', rarity: 'uncommon', stats: { damage: 18 } },
  'Fishing Pole': { name: 'Fishing Pole', description: 'Used for catching fish in lakes and rivers.', type: 'weapon', rarity: 'common' },
  'Bow': { name: 'Bow', description: 'A simple wooden bow for ranged combat.', type: 'weapon', rarity: 'common', stats: { damage: 10 } },
  'Shirt': { name: 'Shirt', description: 'A simple linen shirt.', type: 'armor', rarity: 'common', stats: { defense: 2 } },
  'Quilted Armor': { name: 'Quilted Armor', description: 'Lightweight armor made of quilted fabric.', type: 'armor', rarity: 'common', stats: { defense: 5 } },
  'Leather Armor': { name: 'Leather Armor', description: 'Sturdy armor made of cured leather.', type: 'armor', rarity: 'common', stats: { defense: 10 } },
  'Heavy Leather Armor': { name: 'Heavy Leather Armor', description: 'Reinforced leather armor for better protection.', type: 'armor', rarity: 'uncommon', stats: { defense: 15 } },
  'RingMail': { name: 'RingMail', description: 'Metal rings sewn onto a leather backing.', type: 'armor', rarity: 'uncommon', stats: { defense: 20 } },
  'Plate Mail': { name: 'Plate Mail', description: 'Heavy steel plates providing excellent protection.', type: 'armor', rarity: 'rare', stats: { defense: 35 } },
  'Pants': { name: 'Pants', description: 'Common trousers.', type: 'armor', rarity: 'common', stats: { defense: 2 } },
  'Shoes': { name: 'Shoes', description: 'Simple leather shoes.', type: 'armor', rarity: 'common', stats: { defense: 1 } },
  'Mask': { name: 'Mask', description: 'A decorative or protective mask.', type: 'armor', rarity: 'common' },
  'Hood': { name: 'Hood', description: 'A simple cloth hood.', type: 'armor', rarity: 'common', stats: { defense: 1 } },
  'Potion of Healing': { name: 'Potion of Healing', description: 'Restores a moderate amount of health.', type: 'consumable', rarity: 'common', stats: { healthBonus: 50 } },
  'Mana Potion': { name: 'Mana Potion', description: 'Restores a moderate amount of mana.', type: 'consumable', rarity: 'common', stats: { manaBonus: 30 } },
  'Wood': { name: 'Wood', description: 'Basic crafting material.', type: 'material', rarity: 'common' },
  'Coal': { name: 'Coal', description: 'A common fuel source.', type: 'material', rarity: 'common' },
  'Shield': { name: 'Shield', description: 'A simple stone shield.', type: 'armor', rarity: 'common', stats: { defense: 8 } },
  'Helm': { name: 'Helm', description: 'A basic head protection.', type: 'armor', rarity: 'common', stats: { defense: 4 } },
  'Gold Ring': { name: 'Gold Ring', description: 'A simple band of gold.', type: 'accessory', rarity: 'uncommon' },
  'Bone Dust': { name: 'Bone Dust', description: 'Fine white powder from old bones.', type: 'material', rarity: 'common' },
  'Scrap Metal': { name: 'Scrap Metal', description: 'Rusted bits of iron and steel.', type: 'material', rarity: 'common' }
};

export const ITEM_IMAGES: Record<string, string> = {
  'Potion of Healing': '/assets/images/items/consumable/health_pot.jpg',
  'Mana Potion': '/assets/images/items/consumable/mana_pot.jpg',
  'Sword': '/assets/images/items/stone_sword.png',
  'Shield': '/assets/images/items/stone_shield.png',
  'Helm': '/assets/images/items/helm.png',
  'Plate Mail': '/assets/images/items/plate_armor.png',
  'Gold Ring': '/assets/images/items/gold_ring.png',
  'Bone Dust': '/assets/images/items/bone_dust.png',
  'Scrap Metal': '/assets/images/items/scrap_metal.png',
  'Wood': '/assets/images/items/wood_logs.png'
};
