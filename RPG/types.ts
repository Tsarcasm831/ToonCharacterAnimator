import type { InventoryItem, PlayerConfig } from '../types';

// ============================================================================
// RPG shared contracts. Every module under RPG/ (and the reusable pieces added
// to game/) codes against the shapes in this file. Item identity is the
// display-name string, matching the convention used across the main app.
// ============================================================================

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export type RPGClassId = 'warrior' | 'hunter' | 'adept';

export interface RPGClassDef {
  id: RPGClassId;
  name: string;
  tagline: string;
  description: string;
  /** Base pools before equipment/level bonuses. */
  baseMaxHp: number;
  /** Flat damage added to every melee hit (class passive). */
  classDamageBonus: number;
  startingGold: number;
  startingItems: { name: string; count: number }[];
  /** Item names auto-equipped at creation (must exist in startingItems). */
  startingEquipped: string[];
  /** Appearance seed applied on top of the player's customization. */
  configOverrides: Partial<PlayerConfig>;
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export type ItemKind = 'weapon' | 'armor' | 'consumable' | 'material' | 'treasure' | 'tool';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type EquipSlotId = 'weapon' | 'offhand' | 'head' | 'torso' | 'legs' | 'feet';

export const EQUIP_SLOTS: { id: EquipSlotId; label: string }[] = [
  { id: 'weapon', label: 'Weapon' },
  { id: 'offhand', label: 'Off-hand' },
  { id: 'head', label: 'Head' },
  { id: 'torso', label: 'Torso' },
  { id: 'legs', label: 'Legs' },
  { id: 'feet', label: 'Feet' },
];

export interface RPGItemDef {
  name: string;
  kind: ItemKind;
  rarity: ItemRarity;
  description: string;
  /** Base gold value. Buy price = value; sell price = round(value * SELL_RATIO). */
  value: number;
  /** Explicit icon path under /public. Falls back to data/constants ITEM_IMAGES, then emoji. */
  icon?: string;
  emoji?: string;
  /** Max stack size. Defaults: equipment/tools 1, everything else 99. */
  stack?: number;
  equip?: {
    slot: EquipSlotId;
    /** PlayerConfig.selectedItem value, e.g. 'Sword' | 'Axe' | 'Staff' | 'Knife'. */
    heldItem?: string;
    /** PlayerConfig.equipment boolean keys switched on while equipped. */
    equipmentFlags?: string[];
    bonus?: { maxHp?: number; defense?: number; damage?: number };
  };
  consume?: { heal?: number; effectLabel: string };
}

export const SELL_RATIO = 0.5;
export const INVENTORY_SIZE = 40; // 8x5 grid; slots 0-7 double as the hotbar
export const HOTBAR_SIZE = 8;

// ---------------------------------------------------------------------------
// Dialogue
// ---------------------------------------------------------------------------

export type DialogueAction =
  | { type: 'openTrade' }
  | { type: 'close' }
  | { type: 'rest'; cost: number }
  | { type: 'giveItem'; item: string; count: number; onceFlag: string }
  | { type: 'giveGold'; amount: number; onceFlag: string }
  | { type: 'setFlag'; flag: string };

export interface DialogueChoice {
  label: string;
  /** Node id within the same NPC's dialogue map. Omit to close after action. */
  next?: string;
  action?: DialogueAction;
  /** Hide the choice when this flag is set (e.g. one-time rewards). */
  hideIfFlag?: string;
}

export interface DialogueNode {
  id: string;
  /** '{name}' is replaced with the character name. */
  text: string;
  choices: DialogueChoice[];
}

// ---------------------------------------------------------------------------
// NPCs & shops
// ---------------------------------------------------------------------------

export interface RPGShopDef {
  title: string;
  /** Items offered for sale. Unlimited stock. */
  stock: { name: string }[];
  /**
   * Multiplier applied to the player's sell price for specific items at this
   * vendor (e.g. the hunter pays double for Wolf Pelts).
   */
  buyMultipliers?: Record<string, number>;
}

export interface RPGNpcDef {
  id: string;
  name: string;
  /** Short role line shown under the name, e.g. 'General Goods'. */
  role: string;
  appearance: Partial<PlayerConfig>;
  /** World-space [x, z]; y comes from the terrain sampler. */
  position: [number, number];
  rotationY?: number;
  behavior: {
    mode: 'idle' | 'roam';
    /** World-space [x, z] waypoints for roam mode. */
    waypoints?: [number, number][];
    speed?: number;
  };
  /** Entry node must be 'start'. NPCs without dialogue are ambient. */
  dialogue?: Record<string, DialogueNode>;
  shop?: RPGShopDef;
  /** Model scale (children ~0.78). */
  scale?: number;
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

export type ContainerKind = 'chest' | 'barrel' | 'crate';

export interface RPGContainerDef {
  id: string;
  kind: ContainerKind;
  /** 'loot' = one-time use, despawns interaction after looting. 'storage' = persistent stash. */
  mode: 'loot' | 'storage';
  position: [number, number];
  rotationY?: number;
  label: string;
  /** Loot-mode contents. */
  loot?: { name: string; count: number }[];
  lootGold?: number;
  /** Storage-mode slot count (default 24). */
  capacity?: number;
}

export interface ContainerState {
  /** Loot mode: true once emptied. */
  looted: boolean;
  /** Storage mode: persistent contents. Loot mode: remaining items. */
  items: (InventoryItem | null)[];
  gold: number;
}

// ---------------------------------------------------------------------------
// Progress / save
// ---------------------------------------------------------------------------

export interface RPGCharacter {
  name: string;
  classId: RPGClassId;
  /** Full appearance config (normalized over DEFAULT_CONFIG). */
  config: PlayerConfig;
}

export interface RPGProgress {
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  hp: number;
  maxHp: number;
  kills: number;
  deaths: number;
  playTimeSec: number;
}

export interface RPGSaveData {
  version: 1;
  savedAt: number;
  character: RPGCharacter;
  progress: RPGProgress;
  inventory: (InventoryItem | null)[];
  equipment: Record<EquipSlotId, string | null>;
  containers: Record<string, ContainerState>;
  flags: Record<string, boolean>;
  world: { timeOfDay: number };
  position: [number, number, number] | null;
}

export const RPG_SAVE_VERSION = 1 as const;
export const RPG_SAVE_KEY = 'tca-rpg-save-v1';
/** "every 10 minutes or so" — full save (localStorage + linked file). */
export const AUTOSAVE_FILE_INTERVAL_MS = 10 * 60 * 1000;
/** Cheap localStorage quicksave debounce after any state change. */
export const QUICKSAVE_DEBOUNCE_MS = 4000;

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------

export type RPGPhase = 'boot' | 'creation' | 'playing' | 'dead';
export type RPGUIPanel =
  | 'none'
  | 'inventory'
  | 'profile'
  | 'trade'
  | 'dialogue'
  | 'container'
  | 'pause';

export interface RPGToast {
  id: number;
  text: string;
  icon?: string;
  tone: 'info' | 'gold' | 'loot' | 'danger' | 'success';
}

export interface InteractionPrompt {
  label: string | null;
  progress: number | null;
}

// ---------------------------------------------------------------------------
// Engine option contracts (implemented by reusable game/ classes)
// ---------------------------------------------------------------------------

/** Options for game/entities/animal/aggressive/WildWolf.ts — kept free of RPG imports. */
export interface WildWolfOptions {
  /** Leash anchor; wolf wanders within wanderRadius and gives up chase beyond leashRadius. */
  den: { x: number; z: number };
  wanderRadius?: number; // default 18
  leashRadius?: number; // default 38
  aggroRange?: number; // default 14
  attackRange?: number; // default 2.1
  attackCooldown?: number; // default 1.6
  maxHealth?: number; // default 20
  attackDamage?: number; // default 9
  moveSpeed?: number; // default 3.4
  chaseSpeed?: number; // default 6.2
  /** Called when an attack lands on the target (player). */
  onAttackTarget?: (damage: number) => void;
  /** Extra damage added to every hit the wolf RECEIVES (player gear/level scaling). */
  getIncomingDamageBonus?: () => number;
  /** Ground height sampler; defaults to PlayerUtils.getTerrainHeight. */
  terrainHeightAt?: (x: number, z: number) => number;
}

export interface WolfDenDef {
  id: string;
  center: [number, number];
  packSize: number;
  wanderRadius: number;
}
