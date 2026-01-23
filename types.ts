
export type ActiveScene = 'dev' | 'land' | 'combat' | 'world' | 'mp' | 'singleBiome';

export type BodyVariant = 'average' | 'muscular' | 'slim' | 'heavy';
export type OutfitType = 'nude' | 'naked' | 'peasant' | 'warrior' | 'noble';
export type WeaponStance = 'side' | 'shoulder';
export type HairStyle = 'bald' | 'crew';

export type QuestStatus = 'active' | 'completed' | 'failed';

export type UnitState = 'IDLE' | 'MOVING' | 'ATTACKING' | 'CASTING' | 'STUNNED' | 'DEAD';

export interface InventoryItem {
  name: string;
  count: number;
}

export interface EntityStats {
  health: number;
  maxHealth: number;
  chakra: number;
  maxChakra: number;
  mana: number;
  maxMana: number;
  xp: number;
  maxXp: number;
  strength: number;
  dexterity: number;
  defense: number;
  evasion: number;
  damage: number;
  soak: number;
  attackSpeed: number;
  range: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  objectives: {
    label: string;
    current: number;
    target: number;
  }[];
  reward: string;
  rewardClaimed?: boolean;
}

export interface EquipmentState {
  helm: boolean;
  shoulders: boolean;
  shield: boolean;
  shirt: boolean;
  pants: boolean;
  greaves: boolean;
  blacksmithApron: boolean;
  shoes: boolean;
  mask: boolean;
  hood: boolean;
  quiltedArmor: boolean;
  leatherArmor: boolean;
  heavyLeatherArmor: boolean;
  ringMail: boolean;
  plateMail: boolean;
  robe: boolean;
  mageHat: boolean;
  bracers: boolean;
  cape: boolean;
  belt: boolean;
  skirt: boolean;
  skullcap: boolean;
  shorts: boolean;
}

export interface PlayerInput {
  x: number;
  y: number;
  isRunning: boolean;
  jump: boolean;
  isDead: boolean;
  isPickingUp: boolean;
  attack1: boolean;
  attack2: boolean;
  interact: boolean;
  combat: boolean;
  toggleFirstPerson: boolean;
  wave: boolean;
  leftHandWave: boolean;
  summon: boolean; 
  toggleBuilder: boolean; 
  rotateGhost: boolean;
  fireball: boolean;
  crouch: boolean;
}

// --- Configuration Interfaces ---

export interface BaseAppearanceConfig {
  bodyType: 'male' | 'female';
  bodyVariant: BodyVariant;
  outfit: OutfitType;
  weaponStance: WeaponStance;
  hairStyle: HairStyle;
}

export interface GameSettingsConfig {
  globalVolume: number;
  showNPC: boolean;
  showAssassin: boolean;
  showGuard: boolean;
  isAssassinHostile: boolean;
}

export interface EnvironmentConfig {
  timeOfDay: number; 
  timeSpeed: number; 
  isAutoTime: boolean;
}

export interface ColorConfig {
  skinColor: string;
  eyeColor: string;
  scleraColor: string;
  pupilColor: string;
  lipColor: string;
  shirtColor: string;
  shirtColor2: string; 
  pantsColor: string;
  bootsColor: string;
  hairColor: string;
  robeColor: string;
  robeTrimColor: string;
  hoodColor: string;
  tintColor?: string;
}

export interface ApronRiggingConfig {
  apronColor: string;
  apronDetailColor: string;
  apronX: number;
  apronY: number;
  apronZ: number;
  apronScale: number;
  apronWidth: number;
  apronHeight: number;
  apronBibX: number;
  apronBibY: number;
  apronBibZ: number;
  apronBibScale: number;
  apronSkirtX: number;
  apronSkirtY: number;
  apronSkirtZ: number;
  apronSkirtScaleX: number;
  apronSkirtScaleY: number;
  apronSkirtScaleZ: number;
  apronStrapX: number;
  apronStrapY: number;
  apronStrapZ: number;
  apronStrapRotX: number;
  apronStrapRotY: number;
  apronStrapRotZ: number;
  apronStrapRotZOffset?: number; 
}

export interface MageHatRiggingConfig {
  mageHatColor: string;
  mageHatBandColor: string;
  mageHatX: number;
  mageHatY: number;
  mageHatZ: number;
  mageHatRotX: number;
  mageHatScale: number;
}

export interface BodyProportionsConfig {
  headScale: number;
  neckHeight: number;
  neckThickness: number;
  torsoWidth: number;
  torsoHeight: number;
  armScale: number;
  legScale: number;
  buttScale: number;
  buttX: number;
  buttY: number;
  buttZ: number;
  
  // Feet
  heelScale: number;
  heelHeight: number;
  toeScale: number;
  footLength: number;
  footWidth: number;
  toeSpread: number;
  
  // Toe Rigging
  toeLengthScale: number;
  toeX: number;
  toeZ: number;
  toeY: number;
  toeAngle: number;

  // Thumb Rigging
  thumbX: number;
  thumbY: number;
  thumbZ: number;
  thumbRotX: number;
  thumbRotY: number;
  thumbRotZ: number;
  thumbScale: number;

  // Thenar
  thenarScale: number;
  thenarX: number;
  thenarY: number;
  thenarZ: number;
}

export interface FaceProportionsConfig {
  chinSize: number;
  chinLength: number;
  chinForward: number;
  chinHeight: number;
  noseHeight: number;
  noseForward: number;
  irisScale: number;
  pupilScale: number;
  
  // Maxilla
  maxillaScaleX: number;
  maxillaScaleY: number;
  maxillaScaleZ: number;
  maxillaOffsetY: number;
  maxillaOffsetZ: number;

  // Lips
  upperLipWidth: number;
  upperLipHeight: number;
  upperLipThick: number;
  upperLipOffsetY: number;
  upperLipOffsetZ: number;
  
  lowerLipWidth: number;
  lowerLipHeight: number;
  lowerLipThick: number;
  lowerLipOffsetY: number;
  lowerLipOffsetZ: number;

  // Brain/Debug
  showBrain: boolean;
  brainSize: number;
  debugHead: boolean;
}

export interface AccessoryRiggingConfig {
  // Mask
  maskX: number;
  maskY: number;
  maskZ: number;
  maskRotX: number;
  maskScale: number;
  maskStretchX: number;
  maskStretchY: number;
  maskStretchZ: number;

  // Helm
  helmX: number;
  helmY: number;
  helmZ: number;
  helmRotX: number;
  helmScale: number;

  // Hood
  hoodX: number;
  hoodY: number;
  hoodZ: number;
  hoodScale: number;

  // Shoulder
  shoulderX: number;
  shoulderY: number;
  shoulderZ: number;
  shoulderScale: number;

  // Shield
  shieldX: number;
  shieldY: number;
  shieldZ: number;
  shieldRotZ: number;
  shieldScale: number;
}

export interface ClothingRiggingConfig {
  // Shirt
  shirtX: number;
  shirtY: number;
  shirtZ: number;
  shirtRotX: number;
  shirtRotY: number;
  shirtRotZ: number;
  shirtScale: number;
  shirtStretchX: number;
  shirtStretchY: number;
  shirtStretchZ: number;

  // Shirt Abs
  shirtAbsX: number;
  shirtAbsY: number;
  shirtAbsZ: number;
  shirtAbsScale: number;
  shirtAbsSpacing: number;

  // Abs (Body/Skin)
  absX: number;
  absY: number;
  absZ: number;
  absScale: number;
  absSpacing: number;

  // Groin/Bulge
  bulgeX: number;
  bulgeY: number;
  bulgeZ: number;
  bulgeRotX: number;
  bulgeRotY: number;
  bulgeRotZ: number;
  bulgeRotZOffset?: number;
  bulgeScale: number;
}

export interface PlayerConfig extends 
  BaseAppearanceConfig,
  GameSettingsConfig,
  EnvironmentConfig,
  ColorConfig,
  ApronRiggingConfig,
  MageHatRiggingConfig,
  BodyProportionsConfig,
  FaceProportionsConfig,
  AccessoryRiggingConfig,
  ClothingRiggingConfig
{
  equipment: EquipmentState;
  selectedItem: string | null;
  stats: EntityStats;
}

export const DEFAULT_CONFIG: PlayerConfig = {
  // Base
  bodyType: 'male',
  bodyVariant: 'average',
  outfit: 'naked',
  equipment: {
    helm: false,
    shoulders: false,
    shield: false,
    shirt: false,
    pants: false,
    greaves: false,
    shoes: false,
    mask: false,
    hood: false,
    quiltedArmor: false,
    leatherArmor: false,
    heavyLeatherArmor: false,
    ringMail: false,
    plateMail: false,
    robe: false,
    blacksmithApron: false,
    mageHat: false,
    bracers: false,
    cape: false,
    belt: false,
    skirt: false,
    skullcap: false,
    shorts: false,
  },
  selectedItem: null,
  weaponStance: 'side',

  stats: {
    health: 100,
    maxHealth: 100,
    chakra: 50,
    maxChakra: 50,
    mana: 0,
    maxMana: 100,
    xp: 0,
    maxXp: 1000,
    strength: 10,
    dexterity: 10,
    defense: 10,
    evasion: 10,
    damage: 10,
    soak: 2,
    attackSpeed: 1.0,
    range: 1.5
  },
  
  // Settings
  globalVolume: 0.5,
  showNPC: true,
  showAssassin: true,
  showGuard: true,
  isAssassinHostile: false,
  timeOfDay: 12.0, 
  timeSpeed: 1.0,
  isAutoTime: true,

  // Colors
  skinColor: '#ffdbac',
  eyeColor: '#333333',
  scleraColor: '#ffffff',
  pupilColor: '#000000',
  lipColor: '#e0b094', 
  shirtColor: '#cc0000',
  shirtColor2: '#ffeb3b', 
  pantsColor: '#2d3748',
  bootsColor: '#3e2723',
  hairColor: '#3e2723',
  hairStyle: 'bald',
  robeColor: '#2c2c2c',
  robeTrimColor: '#d4af37',
  hoodColor: '#111111',
  
  // Apron
  apronColor: '#4e342e',
  apronDetailColor: '#212121',
  apronX: 0,
  apronY: 0,
  apronZ: 0,
  apronScale: 1.0,
  apronWidth: 1.0,
  apronHeight: 1.0,
  apronBibX: 0,
  apronBibY: 0.18,
  apronBibZ: 0.126,
  apronBibScale: 1.0,
  apronSkirtX: 0,
  apronSkirtY: -0.01,
  apronSkirtZ: 0,
  apronSkirtScaleX: 1.0,
  apronSkirtScaleY: 1.0,
  apronSkirtScaleZ: 1.0,
  apronStrapX: 0,
  apronStrapY: 0.356,
  apronStrapZ: 0.21,
  apronStrapRotX: -1.7,
  apronStrapRotY: 0,
  apronStrapRotZ: 0,

  // Mage Hat
  mageHatColor: '#1a1a1a',
  mageHatBandColor: '#6a1b9a',
  mageHatX: 0,
  mageHatY: 0.12,
  mageHatZ: -0.02,
  mageHatRotX: -0.15,
  mageHatScale: 1.0,

  // Body Proportions
  headScale: 1.0,
  neckHeight: 0.75,
  neckThickness: 0.7,
  torsoWidth: 1.0,
  torsoHeight: 1.0,
  armScale: 1.0,
  legScale: 1.0,
  buttScale: 0.75,
  buttX: 0,
  buttY: -0.05,
  buttZ: -0.004,
  heelScale: 1.218,
  heelHeight: 1.0,
  toeScale: 1.0,
  footLength: 1.0,
  footWidth: 1.0,
  toeSpread: 1.0,
  
  toeLengthScale: 1.0,
  toeX: -0.01,
  toeZ: 0.14,
  toeY: -0.054,
  toeAngle: 0.05,

  thumbX: 0.042,
  thumbY: -0.035, 
  thumbZ: 0.03,
  thumbRotX: 0.1, 
  thumbRotY: -0.4, 
  thumbRotZ: 0.8, 
  thumbScale: 1.0,

  thenarScale: 1.0,
  thenarX: 0.035,
  thenarY: -0.05,
  thenarZ: 0.025,
  
  // Face
  chinSize: 0.65,
  chinLength: 0.95,
  chinForward: 0.01,
  chinHeight: -0.03,
  noseHeight: 0.0,
  noseForward: -0.02,
  irisScale: 0.50,
  pupilScale: 0.40,
  
  // Accessories
  maskX: 0,
  maskY: -0.098,
  maskZ: 0.025,
  maskRotX: -0.1,
  maskScale: 0.81,
  maskStretchX: 0.89,
  maskStretchY: 1.0,
  maskStretchZ: 1.0,

  helmX: 0,
  helmY: 0.064,
  helmZ: 0,
  helmRotX: -0.24,
  helmScale: 1.0,

  hoodX: 0,
  hoodY: 0.008,
  hoodZ: 0,
  hoodScale: 1.0,

  shoulderX: 0,
  shoulderY: 0.05,
  shoulderZ: 0,
  shoulderScale: 1.0,

  shieldX: 0.06,
  shieldY: -0.09,
  shieldZ: 0,
  shieldRotZ: 1.57,
  shieldScale: 1.0,

  // Clothing
  shirtX: 0,
  shirtY: 0,
  shirtZ: 0,
  shirtRotX: 0,
  shirtRotY: 0,
  shirtRotZ: 0,
  shirtScale: 1.0,
  shirtStretchX: 1.0,
  shirtStretchY: 1.0,
  shirtStretchZ: 1.0,

  shirtAbsX: 0,
  shirtAbsY: 0,
  shirtAbsZ: 0,
  shirtAbsScale: 1.0,
  shirtAbsSpacing: 1.0,

  maxillaScaleX: 0.95,
  maxillaScaleY: 1.25,
  maxillaScaleZ: 1.5,
  maxillaOffsetY: -0.03,
  maxillaOffsetZ: -0.05,

  upperLipWidth: 0.75,
  upperLipHeight: 0.75,
  upperLipThick: 1.0,
  upperLipOffsetY: 0.023,
  upperLipOffsetZ: 0.006,
  
  lowerLipWidth: 1.0,
  lowerLipHeight: 1.0,
  lowerLipThick: 1.0,
  lowerLipOffsetY: -0.1,
  lowerLipOffsetZ: 0.112,

  absX: 0,
  absY: 0,
  absZ: -0.024,
  absScale: 1.0,
  absSpacing: 1.0,

  bulgeX: 0,
  bulgeY: -0.135,
  bulgeZ: 0.075,
  bulgeRotX: 0.45,
  bulgeRotY: 0,
  bulgeRotZ: 0,
  bulgeScale: 1.0,

  showBrain: false,
  brainSize: 1.0,
  debugHead: false,
};
