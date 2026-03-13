import { BODY_PRESETS } from '../data/constants';
import type { BodyVariant, OutfitType, PlayerConfig } from '../types';

export type PresetTheme = 'random' | 'heroic' | 'mystical' | 'rugged' | 'elegant' | 'warrior' | 'mage';

interface RandomizationOptions {
  includeBody?: boolean;
  includeFace?: boolean;
  includeColors?: boolean;
  includeOutfit?: boolean;
}

// Color palettes for different themes
const COLOR_PALETTES = {
  heroic: {
    skin: ['#f5d0c5', '#e8b59a', '#d4a07a', '#c89664'],
    hair: ['#2c1810', '#4a2c1a', '#8b5a3c', '#d4a574', '#f0e68c'],
    eyes: ['#4169e1', '#32cd32', '#87ceeb']
  },
  mystical: {
    skin: ['#e6d5f0', '#c8b5d9', '#b89cc7', '#a87db5'],
    hair: ['#4b0082', '#6a0dad', '#8b00ff', '#9370db', '#ba55d3'],
    eyes: ['#9370db', '#8a2be2', '#9400d3', '#ff1493']
  },
  rugged: {
    skin: ['#d4a07a', '#c89664', '#b08050', '#9a6f47'],
    hair: ['#2c1810', '#3d2817', '#4a2c1a', '#6b4423'],
    eyes: ['#8b4513', '#a0522d', '#654321']
  },
  elegant: {
    skin: ['#fef5e7', '#f8e8d8', '#f0dcc8', '#e8d0b8'],
    hair: ['#ffd700', '#f0e68c', '#daa520', '#b8860b', '#8b7355'],
    eyes: ['#87ceeb', '#4682b4', '#5f9ea0']
  },
  warrior: {
    skin: ['#d4a07a', '#c89664', '#b08050', '#a87550'],
    hair: ['#2c1810', '#4a2c1a', '#654321', '#8b4513'],
    eyes: ['#8b4513', '#a0522d', '#cd853f']
  },
  mage: {
    skin: ['#f5d0c5', '#e8c5b5', '#d8b5a5', '#c8a595'],
    hair: ['#4b0082', '#6a5acd', '#7b68ee', '#9370db', '#d8bfd8'],
    eyes: ['#4169e1', '#6495ed', '#00bfff', '#9370db']
  }
};

export class RandomizationPresets {
  /**
   * Generate a random number within a range
   */
  private static randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /**
   * Pick a random item from an array
   */
  private static randomPick<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate random skin color based on theme
   */
  private static generateSkinColor(theme: PresetTheme): string {
    if (theme === 'random') {
      const allSkinColors = Object.values(COLOR_PALETTES).flatMap(p => p.skin);
      return this.randomPick(allSkinColors);
    }
    const palette = COLOR_PALETTES[theme as keyof typeof COLOR_PALETTES];
    return this.randomPick(palette?.skin || COLOR_PALETTES.heroic.skin);
  }

  /**
   * Generate random hair color based on theme
   */
  private static generateHairColor(theme: PresetTheme): string {
    if (theme === 'random') {
      const allHairColors = Object.values(COLOR_PALETTES).flatMap(p => p.hair);
      return this.randomPick(allHairColors);
    }
    const palette = COLOR_PALETTES[theme as keyof typeof COLOR_PALETTES];
    return this.randomPick(palette?.hair || COLOR_PALETTES.heroic.hair);
  }

  /**
   * Generate random eye color based on theme
   */
  private static generateEyeColor(theme: PresetTheme): string {
    if (theme === 'random') {
      const allEyeColors = Object.values(COLOR_PALETTES).flatMap(p => p.eyes);
      return this.randomPick(allEyeColors);
    }
    const palette = COLOR_PALETTES[theme as keyof typeof COLOR_PALETTES];
    return this.randomPick(palette?.eyes || COLOR_PALETTES.heroic.eyes);
  }

  /**
   * Generate random body proportions
   */
  private static generateBodyProportions(): Partial<PlayerConfig> {
    return {
      headScale: this.randomInRange(0.9, 1.1),
      neckHeight: this.randomInRange(0.6, 0.8),
      neckThickness: this.randomInRange(0.6, 0.8),
      torsoWidth: this.randomInRange(0.85, 1.2),
      torsoHeight: this.randomInRange(0.9, 1.1),
      armScale: this.randomInRange(0.9, 1.15),
      legScale: this.randomInRange(0.9, 1.15),
      buttScale: this.randomInRange(0.7, 1.2),
      footWidth: this.randomInRange(0.9, 1.2),
      footLength: this.randomInRange(0.9, 1.15)
    };
  }

  /**
   * Generate random facial features
   */
  private static generateFacialFeatures(): {
    chinSize: number;
    chinLength: number;
    chinForward: number;
    chinHeight: number;
    noseHeight: number;
    noseForward: number;
    irisScale: number;
    pupilScale: number;
  } {
    return {
      chinSize: this.randomInRange(0.55, 0.9),
      chinLength: this.randomInRange(0.85, 1.15),
      chinForward: this.randomInRange(-0.02, 0.03),
      chinHeight: this.randomInRange(-0.05, 0.03),
      noseHeight: this.randomInRange(-0.03, 0.03),
      noseForward: this.randomInRange(-0.04, 0.02),
      irisScale: this.randomInRange(0.35, 0.65),
      pupilScale: this.randomInRange(0.3, 0.6)
    };
  }

  /**
   * Generate random outfit based on theme
   */
  private static generateOutfit(theme: PresetTheme): OutfitType {
    const outfits: Record<PresetTheme, OutfitType[]> = {
      heroic: ['warrior', 'knight', 'noble'],
      mystical: ['mage', 'noble'],
      rugged: ['peasant', 'ranger', 'naked'],
      elegant: ['noble', 'mage'],
      warrior: ['warrior', 'knight', 'ranger'],
      mage: ['mage', 'noble'],
      random: ['nude', 'naked', 'peasant', 'warrior', 'ranger', 'knight', 'noble', 'mage']
    };

    return this.randomPick(outfits[theme] ?? outfits.random);
  }

  /**
   * Generate a completely random character configuration
   */
  static generateRandomCharacter(
    baseConfig: PlayerConfig,
    theme: PresetTheme = 'random',
    options: RandomizationOptions = {}
  ): PlayerConfig {
    const {
      includeBody = true,
      includeFace = true,
      includeColors = true,
      includeOutfit = true
    } = options;

    const newConfig = { ...baseConfig };

    // Randomize colors
    if (includeColors) {
      newConfig.skinColor = this.generateSkinColor(theme);
      newConfig.hairColor = this.generateHairColor(theme);
      newConfig.eyeColor = this.generateEyeColor(theme);
    }

    // Randomize body proportions
    if (includeBody) {
      const bodyProps = this.generateBodyProportions();
      Object.assign(newConfig, bodyProps);

      const variants: BodyVariant[] = ['average', 'muscular', 'slim', 'heavy'];
      const selectedVariant = this.randomPick(variants);
      newConfig.bodyVariant = selectedVariant;
      Object.assign(newConfig, BODY_PRESETS[selectedVariant]);
      newConfig.bodyType = Math.random() > 0.5 ? 'male' : 'female';
    }

    // Randomize facial features
    if (includeFace) {
      const faceFeatures = this.generateFacialFeatures();
      newConfig.chinSize = faceFeatures.chinSize;
      newConfig.chinLength = faceFeatures.chinLength;
      newConfig.chinForward = faceFeatures.chinForward;
      newConfig.chinHeight = faceFeatures.chinHeight;
      newConfig.noseHeight = faceFeatures.noseHeight;
      newConfig.noseForward = faceFeatures.noseForward;
      newConfig.irisScale = faceFeatures.irisScale;
      newConfig.pupilScale = faceFeatures.pupilScale;
    }

    // Randomize outfit
    if (includeOutfit) {
      newConfig.outfit = this.generateOutfit(theme);
    }

    return newConfig;
  }

  /**
   * Generate a themed preset character
   */
  static generateThemedPreset(theme: PresetTheme, baseConfig: PlayerConfig): PlayerConfig {
    return this.generateRandomCharacter(baseConfig, theme, {
      includeBody: true,
      includeFace: true,
      includeColors: true,
      includeOutfit: true
    });
  }

  /**
   * Randomize only body proportions
   */
  static randomizeBody(baseConfig: PlayerConfig): PlayerConfig {
    return this.generateRandomCharacter(baseConfig, 'random', {
      includeBody: true,
      includeFace: false,
      includeColors: false,
      includeOutfit: false
    });
  }

  /**
   * Randomize only facial features
   */
  static randomizeFace(baseConfig: PlayerConfig): PlayerConfig {
    return this.generateRandomCharacter(baseConfig, 'random', {
      includeBody: false,
      includeFace: true,
      includeColors: false,
      includeOutfit: false
    });
  }

  /**
   * Randomize only colors
   */
  static randomizeColors(baseConfig: PlayerConfig, theme: PresetTheme = 'random'): PlayerConfig {
    return this.generateRandomCharacter(baseConfig, theme, {
      includeBody: false,
      includeFace: false,
      includeColors: true,
      includeOutfit: false
    });
  }

  /**
   * Get all available themes
   */
  static getAvailableThemes(): Array<{ id: PresetTheme; name: string; description: string; icon: string }> {
    return [
      { id: 'random', name: 'Random', description: 'Completely random character', icon: '🎲' },
      { id: 'heroic', name: 'Heroic', description: 'Noble and brave appearance', icon: '⚔️' },
      { id: 'mystical', name: 'Mystical', description: 'Magical and arcane look', icon: '✨' },
      { id: 'rugged', name: 'Rugged', description: 'Weathered and tough', icon: '🏔️' },
      { id: 'elegant', name: 'Elegant', description: 'Refined and graceful', icon: '👑' },
      { id: 'warrior', name: 'Warrior', description: 'Battle-hardened fighter', icon: '🛡️' },
      { id: 'mage', name: 'Mage', description: 'Scholarly spellcaster', icon: '🔮' }
    ];
  }
}

export default RandomizationPresets;
