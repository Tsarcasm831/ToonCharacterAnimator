
import * as THREE_LIB from 'three';
import { ENV_CONSTANTS, BIOME_DATA } from './EnvironmentTypes';
import { DebrisSystem } from './DebrisSystem';
import { ObstacleManager } from './ObstacleManager';
import { GrassManager } from './GrassManager';
import { SnowSystem } from './SnowSystem';
import { WorldGridManager } from './WorldGridManager';
import { PlayerConfig } from '../../types';
import { PlayerUtils } from '../player/PlayerUtils';
import { LightingManager } from './LightingManager';
import { TerrainManager } from './TerrainManager';

export class Environment {
    private scene: THREE_LIB.Scene;
    public group: THREE_LIB.Group; // Root group for this environment
    public obstacleManager: ObstacleManager;
    private debrisSystem: DebrisSystem;
    private grassManager: GrassManager | null = null;
    private snowSystem: SnowSystem | null = null;
    private worldGrid: WorldGridManager;
    
    private lightingManager: LightingManager;
    private terrainManager: TerrainManager;

    private isBuilt = false;
    private isBuilding = false;
    
    static POND_X = ENV_CONSTANTS.POND_X;
    static POND_Z = ENV_CONSTANTS.POND_Z;
    static POND_RADIUS = ENV_CONSTANTS.POND_RADIUS;
    static POND_DEPTH = ENV_CONSTANTS.POND_DEPTH;

    constructor(scene: THREE_LIB.Scene) {
        this.scene = scene;
        this.group = new THREE_LIB.Group();
        this.scene.add(this.group);
        
        // Initialize Sub-Managers
        this.lightingManager = new LightingManager(scene);
        this.terrainManager = new TerrainManager(this.group);

        this.debrisSystem = new DebrisSystem(this.group, (logs) => {
            this.obstacleManager.addLogs(logs);
        });
        
        this.obstacleManager = new ObstacleManager(this.group, this.debrisSystem);
        this.worldGrid = new WorldGridManager(this.group);
    }

    setVisible(visible: boolean) {
        this.group.visible = visible;
        // LightingManager adds lights to scene, not group. 
        if (!visible) {
            this.lightingManager.dispose();
        } else {
            // Re-init lights if we become visible again? 
            // Actually, with the new scene management, we'll re-create the whole Environment.
        }
    }

    dispose() {
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }

        this.group.traverse((child) => {
            if (child instanceof THREE_LIB.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        this.lightingManager.dispose();
        this.terrainManager.dispose();
        this.debrisSystem.dispose();
        this.obstacleManager.dispose();
        if (this.grassManager) this.grassManager.dispose();
        if (this.snowSystem) this.snowSystem.dispose();
        this.worldGrid.dispose();
    }

    get obstacles(): THREE_LIB.Object3D[] {
        return this.obstacleManager.obstacles;
    }

    addObstacle(obj: THREE_LIB.Object3D) {
        this.obstacleManager.addObstacle(obj);
    }

    toggleWorldGrid(visible?: boolean) {
        if (typeof visible === 'boolean') {
            this.worldGrid.setVisible(visible);
            return;
        }
        this.worldGrid.toggle();
    }

    getBiomeAt(pos: THREE_LIB.Vector3): { name: string, color: string } {
        // 1. Check Water (Pond)
        const pondDepth = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        if (pondDepth < -0.1) return BIOME_DATA['water'];

        // 2. Check Grid Tile using BIOME_SIZE
        const biomeSize = ENV_CONSTANTS.BIOME_SIZE;
        const ix = Math.round(pos.x / biomeSize);
        const iz = Math.round(pos.z / biomeSize);
        const key = `${ix},${iz}`;

        return BIOME_DATA[key] || BIOME_DATA['0,0'];
    }

    update(dt: number, config: PlayerConfig, playerPosition: THREE_LIB.Vector3) {
        if (!this.group.visible) return; // Don't update if not visible

        this.debrisSystem.update(dt);
        this.obstacleManager.update(dt);
        this.grassManager?.update(dt);
        this.snowSystem?.update(dt, playerPosition);
        this.worldGrid.update(playerPosition);
        
        this.lightingManager.update(dt, config);
        this.terrainManager.update(dt);
    }

    damageObstacle(object: THREE_LIB.Object3D, amount: number): string | null {
        return this.obstacleManager.damageObstacle(object, amount);
    }

    async buildAsync() {
        if (this.isBuilt || this.isBuilding) return;
        this.isBuilding = true;

        const buildStart = performance.now();

        try {
            // Build terrain
            await this.terrainManager.buildAsync(10);
            
            // Register terrain meshes as obstacles for raycasting
            const terrainMeshes = this.terrainManager.getTerrainMeshes();
            terrainMeshes.forEach(mesh => this.obstacleManager.addObstacle(mesh));

            // Kick off downstream systems in parallel
            // Note: waitForTextures logic was in Environment, but TerrainTextureFactory is static.
            // We can keep it here or move it. 
            // Since we imported TerrainTextureFactory, we can use it.
            // However, TerrainManager uses TerrainTextureFactory internally to get textures.
            // So we might not need to explicitly wait unless we want to ensure readiness before showing something specific.
            // Original code waited for obstacles.
            
            const obstaclesPromise = this.obstacleManager.initAsync(5); // Reduced from 20
            await obstaclesPromise;

            if (!this.grassManager) this.grassManager = new GrassManager(this.group);
            if (!this.snowSystem) this.snowSystem = new SnowSystem(this.group);

            this.isBuilt = true;

            const totalMs = Math.round(performance.now() - buildStart);
            console.debug(`[Environment] buildAsync completed in ${totalMs}ms.`);
        } finally {
            this.isBuilding = false;
        }
    }
}
