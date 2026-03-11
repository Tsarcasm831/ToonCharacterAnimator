import { PlayerConfig } from '../types';

const MAX_HISTORY_SIZE = 50;

export class UndoRedoManager {
  private history: PlayerConfig[] = [];
  private currentIndex: number = -1;

  /**
   * Push a new state to the history
   * This clears any future states if we're not at the end
   */
  pushState(config: PlayerConfig): void {
    // If we're not at the end of history, remove all future states
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add the new state
    this.history.push(JSON.parse(JSON.stringify(config))); // Deep clone

    // Limit history size
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Undo to the previous state
   * Returns the previous config or null if at the beginning
   */
  undo(): PlayerConfig | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  /**
   * Redo to the next state
   * Returns the next config or null if at the end
   */
  redo(): PlayerConfig | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get the current history size
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get the current position in history
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Initialize with a starting state
   */
  initialize(config: PlayerConfig): void {
    this.clear();
    this.pushState(config);
  }

  /**
   * Get history info for debugging
   */
  getHistoryInfo(): { size: number; index: number; canUndo: boolean; canRedo: boolean } {
    return {
      size: this.history.length,
      index: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
}

export default UndoRedoManager;
