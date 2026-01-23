import * as THREE from 'three';
import { Environment } from '../environment/Environment';
import { WorldEnvironment } from '../environment/WorldEnvironment';
import { CombatEnvironment } from '../environment/CombatEnvironment';
import { RenderManager } from '../core/RenderManager';
import { EntityManager } from './EntityManager';
import { Player } from '../player/Player';
import { PlayerUtils } from '../player/PlayerUtils';
import { landCoordsToWorld, getLandHeightAt } from '../environment/landTerrain';

export type SceneType = 'dev' | 'land' | 'combat' | 'mp' | 'singleBiome';

export class SceneManager {
    public activeScene: SceneType;
    private scene: THREE.Scene;
    public environment: Environment | null = null;
    public landEnvironment: WorldEnvironment | null = null;
    public combatEnvironment: CombatEnvironment | null = null;
    
    private renderManager: RenderManager;
    private entityManager: EntityManager;
    private player: Player;
    
    public onEnvironmentReady?: () => void;

    constructor(
        scene: THREE.Scene, 
        renderManager: RenderManager, 
        entityManager: EntityManager, 
        player: Player,
        initialScene: SceneType
    ) {
        this.scene = scene;
        this.renderManager = renderManager;
        this.entityManager = entityManager;
        this.player = player;
        this.activeScene = initialScene;

        this.initEnvironment(initialScene);
    }

    private initEnvironment(sceneName: SceneType) {
        if (sceneName === 'dev' || sceneName === 'singleBiome') {
            if (!this.environment) {
                this.environment = new Environment(this.scene);
                this.environment.buildAsync();
            }
        } else if (sceneName === 'land') {
            if (!this.landEnvironment) {
                this.landEnvironment = new WorldEnvironment(this.scene);
            }
        } else if (sceneName === 'combat' || sceneName === 'mp') {
            if (!this.combatEnvironment) {
                this.combatEnvironment = new CombatEnvironment(this.scene);
            }
        }
    }

    private unloadEnvironments(except: SceneType) {
        if (except !== 'dev' && except !== 'singleBiome' && this.environment) {
            this.environment.dispose();
            this.environment = null;
        }
        if (except !== 'land' && this.landEnvironment) {
            this.landEnvironment.dispose();
            this.landEnvironment = null;
        }
        if (except !== 'combat' && except !== 'mp' && this.combatEnvironment) {
            this.combatEnvironment.dispose();
            this.combatEnvironment = null;
        }
    }

    public setEntityManager(entityManager: EntityManager) {
        this.entityManager = entityManager;
    }

    public get currentEnvironment() {
        if (this.activeScene === 'dev' || this.activeScene === 'singleBiome') return this.environment;
        if (this.activeScene === 'land') return this.landEnvironment;
        if (this.activeScene === 'combat' || this.activeScene === 'mp') return this.combatEnvironment;
        return null;
    }

    public switchScene(sceneName: SceneType, isInit: boolean = false) {
        const previousScene = this.activeScene;
        this.activeScene = sceneName;
        const GRID_CELL_SIZE = 1.3333;
        PlayerUtils.setUseLandTerrain(sceneName === 'land');

        // Unload old environments and load the new one
        this.unloadEnvironments(sceneName);
        this.initEnvironment(sceneName);

        if (sceneName === 'mp' && this.combatEnvironment) {
             this.combatEnvironment.isCombatStarted = false;
        }

        // Reset dynamic entities
        this.entityManager.clearDynamicEntities();

        this.entityManager.clearStaticEntities(); // Clear static entities too when switching to combat

        // Set combat interaction manager activity
        if (this.activeScene === 'combat' && this.combatEnvironment) {
            this.combatEnvironment.isCombatStarted = false; // Reset combat state for interaction
        }
        if (sceneName === 'dev' || sceneName === 'singleBiome') {
            const startX = -17 * GRID_CELL_SIZE;
            const startZ = 30 * GRID_CELL_SIZE;
            this.player.mesh.position.set(startX, 0, startZ);
            this.renderManager.controls.target.set(startX, 1.7, startZ);
            this.renderManager.camera.position.set(startX, 3.2, startZ + 5.0);

            this.renderManager.controls.enableRotate = true;
            this.renderManager.controls.enableZoom = true;
            this.renderManager.controls.enablePan = true;
        } else if (sceneName === 'land') {
            const spawnLandX = 48.64361716159903;
            const spawnLandZ = 7.903447931463069;
            const { x: startX, z: startZ } = landCoordsToWorld(spawnLandX, spawnLandZ);
            const startY = getLandHeightAt(startX, startZ) + 5.0; // Increased buffer to 5m to ensure player starts above terrain

            this.player.mesh.position.set(startX, startY, startZ);
            this.renderManager.controls.target.set(startX, startY + 1.7, startZ);
            this.renderManager.camera.position.set(startX, startY + 3.2, startZ + 5.0);
            this.renderManager.controls.enableRotate = true;
            this.renderManager.controls.enableZoom = true;
            this.renderManager.controls.enablePan = true;
        } else if (sceneName === 'combat') {
            this.player.mesh.position.set(0, 0, 0);

            const reservedCells: any[] = [];

            if (this.combatEnvironment) {
                // Spawn custom encounter: 1 Ranger on green side, 1 Bandit on red side
                this.entityManager.spawnCombatEncounter('ranger', 1, this.combatEnvironment, reservedCells);
                this.entityManager.spawnCombatEncounter('bandit', 1, this.combatEnvironment, [...reservedCells, ...this.entityManager.rangers.map(a => this.combatEnvironment!.getGridPosition(a.position)).filter((p): p is {r: number, c: number} => p !== null)]);
            }
            
            this.player.mesh.rotation.y = Math.PI; 
            this.renderManager.controls.target.set(0, 0, 0);
            this.renderManager.camera.position.set(0, 15, 10);
            this.renderManager.camera.lookAt(0,0,0);
            this.renderManager.controls.enablePan = false; 
        } else if (sceneName === 'mp') {
            this.player.mesh.position.set(0, 0, 0);
            this.renderManager.controls.target.set(0, 0, 0);
            this.renderManager.camera.position.set(0, 5, 10);
            this.renderManager.controls.enableRotate = true;
            this.renderManager.controls.enableZoom = true;
            this.renderManager.controls.enablePan = true;
        }

        this.player.locomotion.position.copy(this.player.mesh.position);
        this.player.locomotion.previousPosition.copy(this.player.mesh.position);
        this.player.locomotion.rotationY = this.player.mesh.rotation.y;

        if (!isInit) {
            this.player.locomotion.velocity.set(0,0,0);
            this.player.locomotion.jumpVelocity = 0;
            this.player.locomotion.isJumping = false;
            if (sceneName !== 'dev') {
                this.onEnvironmentReady?.();
            }
        }
    }
    
    public update(delta: number, config: any) {
        if ((this.activeScene === 'dev' || this.activeScene === 'singleBiome') && this.environment) {
            this.environment.update(delta, config, this.player.mesh.position);
        } else if (this.activeScene === 'land' && this.landEnvironment) {
            this.landEnvironment.update(delta, config, this.player.mesh.position);
        } else if (this.activeScene === 'combat' && this.combatEnvironment) {
            this.combatEnvironment.update(delta, config, this.player.mesh.position);
        } else if (this.activeScene === 'mp' && this.combatEnvironment) {
            this.combatEnvironment.update(delta, config, this.player.mesh.position);
        }
    }
}
