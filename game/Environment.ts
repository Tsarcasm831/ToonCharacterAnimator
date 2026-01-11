import * as THREE_LIB from 'three';
import { ENV_CONSTANTS, BIOME_DATA } from './environment/EnvironmentTypes';
import { SceneBuilder } from './environment/SceneBuilder';
import { DebrisSystem } from './environment/DebrisSystem';
import { ObstacleManager } from './environment/ObstacleManager';
import { GrassManager } from './environment/GrassManager';
import { SnowSystem } from './environment/SnowSystem';
import { PlayerConfig } from '../types';
import { PlayerUtils } from './player/PlayerUtils';

export class Environment {
    private scene: THREE_LIB.Scene;
    private obstacleManager: ObstacleManager;
    private debrisSystem: DebrisSystem;
    private grassManager: GrassManager;
    private snowSystem: SnowSystem;
    private sunLight: THREE_LIB.DirectionalLight;
    private hemiLight: THREE_LIB.HemisphereLight;
    
    private cycleTimer: number = 0;
    private readonly CYCLE_DURATION = 600; 
    private readonly DAY_RATIO = 0.6;      
    
    static POND_X = ENV_CONSTANTS.POND_X;
    static POND_Z = ENV_CONSTANTS.POND_Z;
    static POND_RADIUS = ENV_CONSTANTS.POND_RADIUS;
    static POND_DEPTH = ENV_CONSTANTS.POND_DEPTH;

    constructor(scene: THREE_LIB.Scene) {
        this.scene = scene;
        
        this.hemiLight = scene.children.find(c => c instanceof THREE_LIB.HemisphereLight) as THREE_LIB.HemisphereLight;
        this.sunLight = scene.children.find(c => c instanceof THREE_LIB.DirectionalLight) as THREE_LIB.DirectionalLight;

        this.debrisSystem = new DebrisSystem(scene, (logs) => {
            this.obstacleManager.addLogs(logs);
        });
        
        this.obstacleManager = new ObstacleManager(scene, this.debrisSystem);
        this.grassManager = new GrassManager(scene);
        this.snowSystem = new SnowSystem(scene);
        this.build();
    }

    get obstacles(): THREE_LIB.Object3D[] {
        return this.obstacleManager.obstacles;
    }

    getBiomeAt(pos: THREE_LIB.Vector3): { name: string, color: string } {
        // 1. Check Water (Pond)
        const pondDepth = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        if (pondDepth < -0.1) return BIOME_DATA['water'];

        // 2. Check Grid Tile
        const patchSize = 40;
        const ix = Math.round(pos.x / patchSize);
        const iz = Math.round(pos.z / patchSize);
        const key = `${ix},${iz}`;

        return BIOME_DATA[key] || BIOME_DATA['0,0'];
    }

    update(dt: number, config: PlayerConfig, playerPosition: THREE_LIB.Vector3) {
        this.debrisSystem.update(dt);
        this.obstacleManager.update(dt);
        this.grassManager.update(dt);
        this.snowSystem.update(dt, playerPosition);
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

        const skysphere = this.scene.getObjectByName('skysphere') as THREE_LIB.Mesh;
        if (skysphere && skysphere.material instanceof THREE_LIB.ShaderMaterial) {
            const uniforms = skysphere.material.uniforms;
            uniforms.sunPos.value.set(sunX, sunY, sunZ);
            
            let topColor = new THREE_LIB.Color();
            let bottomColor = new THREE_LIB.Color();
            let sunColor = new THREE_LIB.Color();

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

            uniforms.topColor.value.copy(topColor);
            uniforms.bottomColor.value.copy(bottomColor);
            uniforms.sunColor.value.copy(sunColor);

            if (this.scene.fog instanceof THREE_LIB.Fog) {
                this.scene.fog.color.copy(bottomColor);
            }
        }

        if (this.hemiLight) {
            const hemiIntensity = Math.max(0.1, sunAltitude * 0.5 + 0.3);
            this.hemiLight.intensity = hemiIntensity;
        }
    }

    damageObstacle(object: THREE_LIB.Object3D, amount: number): string | null {
        return this.obstacleManager.damageObstacle(object, amount);
    }

    private build() {
        SceneBuilder.build(this.scene);
        this.obstacleManager.init();
    }
}
