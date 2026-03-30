/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Phase = 'PREP' | 'COMBAT';

export interface Position {
  x: number;
  y: number;
}

export interface Trait {
  name: string;
  description: string;
}

export interface Ability {
  name: string;
  type: 'projectile' | 'aoe' | 'heal' | 'buff';
  damage?: number;
  heal?: number;
  range?: number;
  radius?: number;
}

export interface Projectile {
  id: string;
  sourceId: string;
  targetId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  type: 'attack' | 'ability';
  abilityType?: 'projectile' | 'aoe';
  radius?: number;
  color: string;
}

export interface Unit {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  ad: number;
  armor: number;
  spellPower: number;
  critChance: number;
  evasion: number;
  range: number;
  attackSpeed: number;
  position: Position | null; // null if on bench
  benchIndex: number | null; // null if on board
  owner: 'player' | 'enemy';
  isDead?: boolean;
  starLevel: number;
  ability?: Ability;
  castTimer?: number;
  facing?: 1 | -1;
  damageDealt?: number;
  damageTaken?: number;
  healingDone?: number;
}

export interface TraitEffect {
  name: string;
  description: string;
  thresholds: { 
    count: number; 
    effect: string;
    stats?: Partial<Unit>;
  }[];
}

export interface ActiveSynergy {
  trait: string;
  count: number;
  activeThreshold: number | null;
  nextThreshold: number | null;
}

export interface GameState {
  playerGold: number;
  playerLevel: number;
  playerXP: number;
  playerHealth: number;
  currentPhase: Phase;
  roundNumber: number;
  board: (Unit | null)[][];
  bench: (Unit | null)[];
  shop: (Unit | null)[];
  activeSynergies: ActiveSynergy[];
  gameOver: boolean;
}
