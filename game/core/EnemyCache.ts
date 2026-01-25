import * as THREE from 'three';
import { Archer } from '../entities/npc/enemy/Archer';
import { Assassin } from '../entities/npc/enemy/Assassin';
import { Bandit } from '../entities/npc/enemy/Bandit';
import { Berserker } from '../entities/npc/enemy/Berserker';
import { Knight } from '../entities/npc/friendly/Knight';
import { Mage } from '../entities/npc/enemy/Mage';
import { Rogue } from '../entities/npc/enemy/Rogue';
import { Warlock } from '../entities/npc/enemy/Warlock';
import { Paladin } from '../entities/npc/friendly/Paladin';
import { Ranger } from '../entities/npc/friendly/Ranger';
import { Monk } from '../entities/npc/friendly/Monk';
import { Cleric } from '../entities/npc/friendly/Cleric';
import { Sentinel } from '../entities/npc/friendly/Sentinel';
import { Wolf } from '../entities/animal/aggressive/Wolf';
import { Bear } from '../entities/animal/aggressive/Bear';
import { Spider } from '../entities/animal/aggressive/Spider';
import { Yeti } from '../entities/animal/aggressive/Yeti';
import { Deer } from '../entities/animal/neutral/Deer';
import { Chicken } from '../entities/animal/neutral/Chicken';
import { Lizard } from '../entities/animal/neutral/Lizard';
import { Owl } from '../entities/animal/neutral/Owl';
import { Pig } from '../entities/animal/neutral/Pig';
import { Sheep } from '../entities/animal/neutral/Sheep';

/**
 * EnemyCache handles the pre-rendering and caching of enemy/ally preview images.
 * This prevents the application from creating a full 3D scene every time a list 
 * or modal is opened, significantly improving UI responsiveness.
 */
export class EnemyCache {
    private static previews: Map<string, string> = new Map();
    
    // List of all entity types for preloading
    private static entityTypes = [
        'archer', 'assassin', 'bandit', 'berserker', 'knight', 'mage', 'rogue', 'warlock',
        'paladin', 'ranger', 'monk', 'cleric', 'sentinel',
        'wolf', 'bear', 'spider', 'deer', 'chicken', 'lizard', 'owl', 'pig', 'sheep', 'yeti'
    ];

    /**
     * Renders a single entity preview
     */
    private static async renderPreview(type: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const width = 200;
            const height = 200;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
            camera.position.set(0, 1.0, 3.5);
            camera.lookAt(0, 1.1, 0);

            const renderer = new THREE.WebGLRenderer({ 
                canvas,
                alpha: true, 
                antialias: false,
                preserveDrawingBuffer: true,
                powerPreference: "low-power"
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(1);

            const light = new THREE.DirectionalLight(0xffffff, 2.5);
            light.position.set(5, 10, 7);
            scene.add(light);
            scene.add(new THREE.AmbientLight(0xffffff, 1.2));

            let model: THREE.Group | null = null;
            let enemyInstance: any = null;
            
            try {
                const dummyScene = new THREE.Scene();
                const dummyPos = new THREE.Vector3();

                switch (type) {
                    case 'archer': enemyInstance = new Archer(dummyScene, dummyPos); break;
                    case 'assassin': enemyInstance = new Assassin(dummyScene, dummyPos); break;
                    case 'bandit': enemyInstance = new Bandit(dummyScene, dummyPos); break;
                    case 'berserker': enemyInstance = new Berserker(dummyScene, dummyPos); break;
                    case 'knight': enemyInstance = new Knight(dummyScene, dummyPos); break;
                    case 'mage': enemyInstance = new Mage(dummyScene, dummyPos); break;
                    case 'rogue': enemyInstance = new Rogue(dummyScene, dummyPos); break;
                    case 'warlock': enemyInstance = new Warlock(dummyScene, dummyPos); break;
                    case 'paladin': enemyInstance = new Paladin(dummyScene, dummyPos); break;
                    case 'ranger': enemyInstance = new Ranger(dummyScene, dummyPos); break;
                    case 'monk': enemyInstance = new Monk(dummyScene, dummyPos); break;
                    case 'cleric': enemyInstance = new Cleric(dummyScene, dummyPos); break;
                    case 'sentinel': enemyInstance = new Sentinel(dummyScene, dummyPos); break;
                    case 'wolf': enemyInstance = new Wolf(dummyScene, dummyPos); break;
                    case 'bear': enemyInstance = new Bear(dummyScene, dummyPos); break;
                    case 'spider': enemyInstance = new Spider(dummyScene, dummyPos); break;
                    case 'deer': enemyInstance = new Deer(dummyScene, dummyPos); break;
                    case 'chicken': enemyInstance = new Chicken(dummyScene, dummyPos); break;
                    case 'lizard': enemyInstance = new Lizard(dummyScene, dummyPos); break;
                    case 'owl': enemyInstance = new Owl(dummyScene, dummyPos); break;
                    case 'pig': enemyInstance = new Pig(dummyScene, dummyPos); break;
                    case 'sheep': enemyInstance = new Sheep(dummyScene, dummyPos); break;
                    case 'yeti': enemyInstance = new Yeti(dummyScene, dummyPos); break;
                }

                if (enemyInstance && enemyInstance.model && enemyInstance.model.group) {
                    model = enemyInstance.model.group;
                    model.position.set(0, 0, 0);
                    model.rotation.set(0, 0, 0);
                    
                    if (enemyInstance.model.sync && enemyInstance.config) {
                        enemyInstance.model.sync(enemyInstance.config, true);
                    }
                    
                    scene.add(model);
                }

                renderer.render(scene, camera);
                const dataUrl = canvas.toDataURL('image/png');
                
                // Cleanup
                if (model) {
                    scene.remove(model);
                }
                
                if (enemyInstance && typeof enemyInstance.dispose === 'function') {
                    enemyInstance.dispose();
                }
                
                scene.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        if (object.geometry) object.geometry.dispose();
                        if (object.material) {
                            const materials = Array.isArray(object.material) ? object.material : [object.material];
                            materials.forEach(m => {
                                for (const key in m) {
                                    if (m[key] && m[key].isTexture) {
                                        m[key].dispose();
                                    }
                                }
                                m.dispose();
                            });
                        }
                    }
                });
                
                renderer.dispose();
                renderer.forceContextLoss();
                
                resolve(dataUrl);
                
            } catch (err) {
                console.error(`Failed to render preview for ${type}:`, err);
                reject(err);
            }
        });
    }

    /**
     * Preloads and caches all enemy textures.
     * Renders previews in batches to prevent blocking the main thread.
     * @param gentle - If true, uses smaller batches and longer delays for less resource contention
     */
    static async preloadAllEnemies(gentle: boolean = false): Promise<void> {
        const batchSize = gentle ? 1 : 2; // Even smaller batches for gentle mode
        const delayBetweenBatches = gentle ? 100 : 16; // Longer delays for gentle mode
        
        for (let i = 0; i < this.entityTypes.length; i += batchSize) {
            const batch = this.entityTypes.slice(i, i + batchSize);
            
            // Render batch in parallel
            const promises = batch.map(async (type) => {
                if (!this.has(type)) {
                    try {
                        const preview = await this.renderPreview(type);
                        this.setPreview(type, preview);
                    } catch (err) {
                        console.error(`Failed to preload ${type}:`, err);
                    }
                }
            });
            
            await Promise.all(promises);
            
            // Small delay between batches to allow UI to remain responsive
            if (i + batchSize < this.entityTypes.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
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
