
import * as THREE_LIB from 'three';
import { ENV_CONSTANTS, BIOME_DATA } from './EnvironmentTypes';
import { SceneBuilder } from './SceneBuilder';
import { DebrisSystem } from './DebrisSystem';
import { ObstacleManager } from './ObstacleManager';
import { GrassManager } from './GrassManager';
import { SnowSystem } from './SnowSystem';
import { WorldGridManager } from './WorldGridManager';
import { PlayerConfig } from '../../types';
import { PlayerUtils } from '../player/PlayerUtils';
import { TerrainTextureFactory } from './TerrainTextureFactory';

export class Environment {
    private scene: THREE_LIB.Scene;
    public group: THREE_LIB.Group; // Root group for this environment
    public obstacleManager: ObstacleManager;
    private debrisSystem: DebrisSystem;
    private grassManager: GrassManager | null = null;
    private snowSystem: SnowSystem | null = null;
    private worldGrid: WorldGridManager;
    private sunLight: THREE_LIB.DirectionalLight;
    private hemiLight: THREE_LIB.HemisphereLight;
    private isBuilt = false;
    private isBuilding = false;
    
    private cycleTimer: number = 0;
    private readonly CYCLE_DURATION = 600; 
    private readonly DAY_RATIO = 0.6;      
    
    static POND_X = ENV_CONSTANTS.POND_X;
    static POND_Z = ENV_CONSTANTS.POND_Z;
    static POND_RADIUS = ENV_CONSTANTS.POND_RADIUS;
    static POND_DEPTH = ENV_CONSTANTS.POND_DEPTH;

    constructor(scene: THREE_LIB.Scene) {
        this.scene = scene;
        this.group = new THREE_LIB.Group();
        this.scene.add(this.group);
        
        this.hemiLight = scene.children.find(c => c instanceof THREE_LIB.HemisphereLight) as THREE_LIB.HemisphereLight;
        this.sunLight = scene.children.find(c => c instanceof THREE_LIB.DirectionalLight) as THREE_LIB.DirectionalLight;

        this.debrisSystem = new DebrisSystem(this.group, (logs) => {
            this.obstacleManager.addLogs(logs);
        });
        
        this.obstacleManager = new ObstacleManager(this.group, this.debrisSystem);
        this.worldGrid = new WorldGridManager(this.group);
    }

    setVisible(visible: boolean) {
        this.group.visible = visible;
    }

    get obstacles(): THREE_LIB.Object3D[] {
        return this.obstacleManager.obstacles;
    }

    addObstacle(obj: THREE_LIB.Object3D) {
        this.obstacleManager.addObstacle(obj);
    }

    toggleWorldGrid() {
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
        this.updateDayNight(dt, config);
    }

    private updateDayNight(dt: number, config: PlayerConfig) {
        if (config.isAutoTime) {
            this.cycleTimer = (this.cycleTimer + dt * config.timeSpeed) % this.CYCLE_DURATION;
            config.timeOfDay = (this.cycleTimer / this.CYCLE_DURATION) * 24.0;
        } else {
            this.cycleTimer = (config.timeOfDay / 24.0) * this.CYCLE_DURATION;
        }

        const cyclePercent = this.cycleTimer / this.CYCLE_DURATION;

        let sunAltitude = 0;
        if (cyclePercent < this.DAY_RATIO) {
            const dayP = cyclePercent / this.DAY_RATIO;
            sunAltitude = Math.sin(dayP * Math.PI);
        } else {
            const nightP = (cyclePercent - this.DAY_RATIO) / (1.0 - this.DAY_RATIO);
            sunAltitude = -Math.sin(nightP * Math.PI);
        }

        const angle = (cyclePercent * Math.PI * 2) - Math.PI / 2;
        const sunX = Math.cos(angle) * 40;
        const sunY = sunAltitude * 40;
        const sunZ = 20;

        if (this.sunLight) {
            this.sunLight.position.set(sunX, sunY, sunZ);
            const lightIntensity = Math.max(0, sunAltitude * 0.8 + 0.1);
            this.sunLight.intensity = lightIntensity;
            
            if (sunAltitude > 0 && sunAltitude < 0.2) {
                this.sunLight.color.setHSL(0.08, 0.8, 0.7);
            } else if (sunAltitude <= 0) {
                this.sunLight.color.setHSL(0.6, 0.4, 0.3);
                this.sunLight.intensity = 0.1;
            } else {
                this.sunLight.color.set(0xffffff);
            }
        }

        const skysphere = this.group.getObjectByName('skysphere') as THREE_LIB.Mesh;
        if (skysphere && skysphere.material instanceof THREE_LIB.ShaderMaterial) {
            const uniforms = skysphere.material.uniforms;
            uniforms.sunPos.value.set(sunX, sunY, sunZ);
            
            let topColor = new THREE_LIB.Color();
            let bottomColor = new THREE_LIB.Color();
            let sunColor = new THREE_LIB.Color();

            // Calculate atmospheric colors based on sun position
            if (sunAltitude > 0.2) {
                topColor.setHex(0x0077ff);
                bottomColor.setHex(0xa0cfff);
                sunColor.setHex(0xffffff);
            } else if (sunAltitude > -0.1) {
                const mix = THREE_LIB.MathUtils.clamp((sunAltitude + 0.1) / 0.3, 0, 1);
                topColor.lerpColors(new THREE_LIB.Color(0x1a237e), new THREE_LIB.Color(0x0077ff), mix);
                bottomColor.lerpColors(new THREE_LIB.Color(0xff7043), new THREE_LIB.Color(0xa0cfff), mix);
                sunColor.setHex(0xffa726);
            } else {
                topColor.setHex(0x020205);
                bottomColor.setHex(0x050510);
                sunColor.setHex(0x90caf9);
            }

            // Darken bottom for blend, but let post-process fog handle the rest
            bottomColor.setHex(0x000000); 

            uniforms.topColor.value.copy(topColor);
            uniforms.bottomColor.value.copy(bottomColor);
            uniforms.sunColor.value.copy(sunColor);
        }

        if (this.hemiLight) {
            const hemiIntensity = Math.max(0.1, sunAltitude * 0.5 + 0.3);
            this.hemiLight.intensity = hemiIntensity;
        }
    }

    damageObstacle(object: THREE_LIB.Object3D, amount: number): string | null {
        return this.obstacleManager.damageObstacle(object, amount);
    }

    async buildAsync() {
        if (this.isBuilt || this.isBuilding) return;
        this.isBuilding = true;

        const buildStart = performance.now();

        try {
            // Build basic scene geometry in controllable batches
            await SceneBuilder.buildAsync(this.group, 10);

            // Kick off downstream systems in parallel
            const textureStatusPromise = this.waitForTextures(5000);
            const obstaclesPromise = this.obstacleManager.initAsync(20);

            const textureStatus = await textureStatusPromise;
            await obstaclesPromise;

            if (!this.grassManager) this.grassManager = new GrassManager(this.group);
            if (!this.snowSystem) this.snowSystem = new SnowSystem(this.group);

            this.isBuilt = true;

            const totalMs = Math.round(performance.now() - buildStart);
            console.debug(`[Environment] buildAsync completed in ${totalMs}ms (textures: ${textureStatus}).`);
        } finally {
            this.isBuilding = false;
        }
    }

    private async waitForTextures(timeoutMs: number = 5000): Promise<'ready' | 'timeout'> {
        const texturesPromise = TerrainTextureFactory.allLoaded();
        let timeoutId: number | null = null;

        const timeoutPromise = new Promise<'timeout'>(resolve => {
            timeoutId = window.setTimeout(() => resolve('timeout'), timeoutMs);
        });

        const result = await Promise.race([
            texturesPromise.then(() => 'ready' as const),
            timeoutPromise
        ]);

        if (timeoutId !== null) {
            window.clearTimeout(timeoutId);
        }

        if (result === 'timeout') {
            texturesPromise
                .then(() => console.debug('[Environment] Deferred texture generation finished.'))
                .catch((err) => console.warn('[Environment] Texture generation failed after timeout.', err));
        }

        return result;
    }
}
