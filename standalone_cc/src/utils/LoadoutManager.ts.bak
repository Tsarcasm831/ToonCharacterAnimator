import type { PlayerConfig } from '../types';

const STORAGE_KEY = 'tca_character_loadouts';
const MAX_LOADOUTS = 20;

export interface CharacterLoadout {
  id: string;
  name: string;
  config: PlayerConfig;
  timestamp: number;
  thumbnail?: string; // Optional base64 image for preview
}

export class LoadoutManager {
  /**
   * Get all saved loadouts
   */
  static getAllLoadouts(): CharacterLoadout[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loadouts = JSON.parse(stored) as CharacterLoadout[];
        // Sort by timestamp, most recent first
        return loadouts.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (error) {
      console.warn('Failed to load loadouts:', error);
    }
    return [];
  }

  /**
   * Save a new loadout
   */
  static saveLoadout(name: string, config: PlayerConfig, thumbnail?: string): CharacterLoadout {
    try {
      const loadouts = this.getAllLoadouts();

      const newLoadout: CharacterLoadout = {
        id: `loadout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim() || `Loadout ${loadouts.length + 1}`,
        config: JSON.parse(JSON.stringify(config)), // Deep clone
        timestamp: Date.now(),
        thumbnail
      };

      // Add to beginning of array
      loadouts.unshift(newLoadout);

      // Limit number of loadouts
      if (loadouts.length > MAX_LOADOUTS) {
        loadouts.splice(MAX_LOADOUTS);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(loadouts));
      return newLoadout;
    } catch (error) {
      console.error('Failed to save loadout:', error);
      throw new Error('Failed to save loadout');
    }
  }

  /**
   * Load a loadout by ID
   */
  static loadLoadout(id: string): PlayerConfig | null {
    try {
      const loadouts = this.getAllLoadouts();
      const loadout = loadouts.find(l => l.id === id);
      if (loadout) {
        return JSON.parse(JSON.stringify(loadout.config)); // Deep clone
      }
    } catch (error) {
      console.warn('Failed to load loadout:', error);
    }
    return null;
  }

  /**
   * Delete a loadout by ID
   */
  static deleteLoadout(id: string): boolean {
    try {
      const loadouts = this.getAllLoadouts();
      const filtered = loadouts.filter(l => l.id !== id);

      if (filtered.length === loadouts.length) {
        return false; // Loadout not found
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete loadout:', error);
      return false;
    }
  }

  /**
   * Update an existing loadout
   */
  static updateLoadout(id: string, name: string, config: PlayerConfig, thumbnail?: string): boolean {
    try {
      const loadouts = this.getAllLoadouts();
      const index = loadouts.findIndex(l => l.id === id);

      if (index === -1) {
        return false; // Loadout not found
      }

      loadouts[index] = {
        ...loadouts[index],
        name: name.trim() || loadouts[index].name,
        config: JSON.parse(JSON.stringify(config)),
        timestamp: Date.now(),
        thumbnail: thumbnail !== undefined ? thumbnail : loadouts[index].thumbnail
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(loadouts));
      return true;
    } catch (error) {
      console.error('Failed to update loadout:', error);
      return false;
    }
  }

  /**
   * Get a single loadout by ID
   */
  static getLoadout(id: string): CharacterLoadout | null {
    const loadouts = this.getAllLoadouts();
    return loadouts.find(l => l.id === id) || null;
  }

  /**
   * Clear all loadouts
   */
  static clearAllLoadouts(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear loadouts:', error);
    }
  }

  /**
   * Export loadouts as JSON string
   */
  static exportLoadouts(): string {
    const loadouts = this.getAllLoadouts();
    return JSON.stringify(loadouts, null, 2);
  }

  /**
   * Import loadouts from JSON string
   */
  static importLoadouts(jsonString: string, merge: boolean = false): boolean {
    try {
      const imported = JSON.parse(jsonString) as CharacterLoadout[];

      if (!Array.isArray(imported)) {
        throw new Error('Invalid loadout data format');
      }

      let loadouts: CharacterLoadout[];

      if (merge) {
        // Merge with existing loadouts
        const existing = this.getAllLoadouts();
        const existingIds = new Set(existing.map(l => l.id));

        // Add imported loadouts that don't already exist
        const newLoadouts = imported.filter(l => !existingIds.has(l.id));
        loadouts = [...existing, ...newLoadouts];
      } else {
        // Replace all loadouts
        loadouts = imported;
      }

      // Limit number of loadouts
      if (loadouts.length > MAX_LOADOUTS) {
        loadouts = loadouts.slice(0, MAX_LOADOUTS);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(loadouts));
      return true;
    } catch (error) {
      console.error('Failed to import loadouts:', error);
      return false;
    }
  }

  /**
   * Get loadout count
   */
  static getLoadoutCount(): number {
    return this.getAllLoadouts().length;
  }

  /**
   * Check if storage is available
   */
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

export default LoadoutManager;

