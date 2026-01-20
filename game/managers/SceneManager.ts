import * as THREE from 'three';
import { Environment } from '../environment/Environment';
import { WorldEnvironment } from '../environment/WorldEnvironment';
import { CombatEnvironment } from '../environment/CombatEnvironment';
import { RenderManager } from '../core/RenderManager';
import { EntityManager } from './EntityManager';
import { Player } from '../player/Player';
import { PlayerUtils } from '../player/PlayerUtils';
import { landCoordsToWorld, getLandHeightAt } from '../environment/landTerrain';

export type SceneType = 'dev' | 'land' | 'combat';

export class SceneManager {
    public activeScene: SceneType;
    public environment: Environment;
    public landEnvironment: WorldEnvironment;
    public combatEnvironment: CombatEnvironment;
    
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
        this.renderManager = renderManager;
        this.entityManager = entityManager;
        this.player = player;
        this.activeScene = initialScene;

        this.environment = new Environment(scene);
        this.landEnvironment = new WorldEnvironment(scene);
        this.combatEnvironment = new CombatEnvironment(scene);
    }

    public setEntityManager(entityManager: EntityManager) {
        this.entityManager = entityManager;
    }

    public get currentEnvironment() {
        if (this.activeScene === 'dev') return this.environment;
        if (this.activeScene === 'land') return this.landEnvironment;
        if (this.activeScene === 'combat') return this.combatEnvironment;
        return null;
    }

    public switchScene(sceneName: SceneType, isInit: boolean = false) {
        this.activeScene = sceneName;
        const GRID_CELL_SIZE = 1.3333;
        PlayerUtils.setUseLandTerrain(sceneName === 'land');

        // Visibility
        this.environment.setVisible(sceneName === 'dev');
        this.landEnvironment.setVisible(sceneName === 'land');
        this.combatEnvironment.setVisible(sceneName === 'combat');
        
        // Reset dynamic entities
        this.entityManager.clearDynamicEntities();
        this.entityManager.clearStaticEntities(); // Clear static entities too when switching to combat

        // Set combat interaction manager activity
        if (this.activeScene === 'combat') {
            this.combatEnvironment.isCombatStarted = false; // Reset combat state for interaction
        }
        if (sceneName === 'dev') {
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
            // Player moved far away and hidden (spectator)
            this.player.mesh.position.set(0, -100, 0);
            this.player.mesh.visible = false;
            if (this.player.model?.group) this.player.model.group.visible = false;
            
            const reservedCells = [];

            // Spawn custom encounter: 1 Archer on green side, 1 Bandit on red side
            this.entityManager.spawnCombatEncounter('archer', 1, this.combatEnvironment, reservedCells);
            this.entityManager.spawnCombatEncounter('bandit', 1, this.combatEnvironment, [...reservedCells, ...this.entityManager.combatArchers.map(a => this.combatEnvironment.getGridPosition(a.position)).filter((p): p is {r: number, c: number} => p !== null)]);
            
            this.player.mesh.rotation.y = Math.PI; 
            this.renderManager.controls.target.set(0, 0, 0);
            this.renderManager.camera.position.set(0, 15, 10);
            this.renderManager.camera.lookAt(0,0,0);
            this.renderManager.controls.enablePan = false; 
        }

        if (!isInit) {
            this.player.velocity.set(0,0,0);
            this.player.jumpVelocity = 0;
            this.player.isJumping = false;
            if (sceneName !== 'dev') {
                this.onEnvironmentReady?.();
            }
        }
    }
    
    public update(delta: number, config: any) {
        if (this.activeScene === 'dev') {
            this.environment.update(delta, config, this.player.mesh.position);
        } else if (this.activeScene === 'land') {
            this.landEnvironment.update(delta, config, this.player.mesh.position);
        } else if (this.activeScene === 'combat') {
            this.combatEnvironment.update(delta, config, this.player.mesh.position);
        }
    }
}
