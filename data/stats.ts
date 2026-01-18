
import { EntityStats } from '../types';

export const CLASS_STATS: Record<string, EntityStats> = {
  hero: {
    health: 120, maxHealth: 120, chakra: 60, maxChakra: 60,
    strength: 12, dexterity: 12, defense: 10, evasion: 8, damage: 15, soak: 2
  },
  archer: {
    health: 90, maxHealth: 90, chakra: 40, maxChakra: 40,
    strength: 8, dexterity: 16, defense: 8, evasion: 14, damage: 18, soak: 1
  },
  assassin: {
    health: 80, maxHealth: 80, chakra: 50, maxChakra: 50,
    strength: 7, dexterity: 18, defense: 6, evasion: 20, damage: 22, soak: 0
  },
  bandit: {
    health: 100, maxHealth: 100, chakra: 30, maxChakra: 30,
    strength: 10, dexterity: 10, defense: 8, evasion: 8, damage: 12, soak: 2
  },
  berserker: {
    health: 160, maxHealth: 160, chakra: 40, maxChakra: 40,
    strength: 18, dexterity: 8, defense: 6, evasion: 4, damage: 25, soak: 4
  },
  mage: {
    health: 85, maxHealth: 85, chakra: 100, maxChakra: 100,
    strength: 6, dexterity: 10, defense: 5, evasion: 10, damage: 20, soak: 0
  },
  rogue: {
    health: 95, maxHealth: 95, chakra: 60, maxChakra: 60,
    strength: 9, dexterity: 15, defense: 7, evasion: 16, damage: 16, soak: 1
  },
  warlock: {
    health: 100, maxHealth: 100, chakra: 80, maxChakra: 80,
    strength: 8, dexterity: 12, defense: 6, evasion: 12, damage: 22, soak: 1
  },
  cleric: {
    health: 110, maxHealth: 110, chakra: 70, maxChakra: 70,
    strength: 10, dexterity: 10, defense: 12, evasion: 6, damage: 14, soak: 3
  },
  knight: {
    health: 150, maxHealth: 150, chakra: 40, maxChakra: 40,
    strength: 16, dexterity: 8, defense: 18, evasion: 2, damage: 16, soak: 6
  },
  monk: {
    health: 115, maxHealth: 115, chakra: 90, maxChakra: 90,
    strength: 11, dexterity: 17, defense: 8, evasion: 18, damage: 20, soak: 1
  },
  paladin: {
    health: 140, maxHealth: 140, chakra: 60, maxChakra: 60,
    strength: 14, dexterity: 9, defense: 16, evasion: 4, damage: 18, soak: 5
  },
  ranger: {
    health: 105, maxHealth: 105, chakra: 50, maxChakra: 50,
    strength: 11, dexterity: 14, defense: 10, evasion: 12, damage: 16, soak: 2
  },
  sentinel: {
    health: 130, maxHealth: 130, chakra: 40, maxChakra: 40,
    strength: 13, dexterity: 7, defense: 22, evasion: 1, damage: 12, soak: 8
  }
};
