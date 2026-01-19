import * as THREE from 'three';

/**
 * EnemyCache handles the pre-rendering and caching of enemy/ally preview images.
 * This prevents the application from creating a full 3D scene every time a list 
 * or modal is opened, significantly improving UI responsiveness.
 */
export class EnemyCache {
    private static previews: Map<string, string> = new Map();

    /**
     * Preloads and caches all enemy textures.
     * In a production environment, this would perform headless renders.
     * Currently serves as a placeholder for the LoadingScreen to wait for.
     */
    static async preloadAllEnemies(): Promise<void> {
        // Implementation for future headless rendering if needed
        return Promise.resolve();
    }

    /**
     * Retrieves a base64 DataURL for a specific character type preview.
     */
    static getPreview(type: string): string | null {
        return this.previews.get(type) || null;
    }

    /**
     * Stores a preview DataURL in the cache.
     */
    static setPreview(type: string, url: string): void {
        this.previews.set(type, url);
    }

    /**
     * Checks if a preview for the given type already exists.
     */
    static has(type: string): boolean {
        return this.previews.has(type);
    }

    /**
     * Clears the cache to free up memory.
     */
    static clear(): void {
        this.previews.clear();
    }
}
