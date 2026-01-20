import * as THREE from 'three';
import { Environment } from '../environment/Environment';
import { WorldEnvironment } from '../environment/WorldEnvironment';
import { CombatEnvironment } from '../environment/CombatEnvironment';
import { RenderManager } from '../core/RenderManager';
import { EntityManager } from './EntityManager';
import { Player } from '../player/Player';

export type SceneType = 'dev' | 'world' | 'combat';

export class SceneManager {
    public activeScene: SceneType;
    public environment: Environment;
    public worldEnvironment: WorldEnvironment;
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
        this.worldEnvironment = new WorldEnvironment(scene);
        this.combatEnvironment = new CombatEnvironment(scene);
    }

    public setEntityManager(entityManager: EntityManager) {
        this.entityManager = entityManager;
    }

    public get currentEnvironment() {
        if (this.activeScene === 'dev') return this.environment;
        if (this.activeScene === 'world') return this.worldEnvironment;
        if (this.activeScene === 'combat') return this.combatEnvironment;
        return null;
    }

    public switchScene(sceneName: SceneType, isInit: boolean = false) {
        this.activeScene = sceneName;
        const GRID_CELL_SIZE = 1.3333;

        // Visibility
        this.environment.setVisible(sceneName === 'dev');
        this.worldEnvironment.setVisible(sceneName === 'world');
        this.combatEnvironment.setVisible(sceneName === 'combat');
        
        // Reset dynamic entities
        this.entityManager.clearDynamicEntities();
        this.entityManager.clearStaticEntities(); // Clear static entities too when switching to combat

        // Scene specific setup
        if (sceneName === 'dev') {
            const startX = -17 * GRID_CELL_SIZE;
            const startZ = 30 * GRID_CELL_SIZE;
            this.player.mesh.position.set(startX, 0, startZ);
            this.renderManager.controls.target.set(startX, 1.7, startZ);
            this.renderManager.camera.position.set(startX, 3.2, startZ + 5.0);
            this.renderManager.controls.enableRotate = true;
            this.renderManager.controls.enableZoom = true;
            this.renderManager.controls.enablePan = true;
        } else if (sceneName === 'world') {
            this.player.mesh.position.set(0, 5, 0);
            this.renderManager.controls.target.set(0, 6.7, 0);
            this.renderManager.camera.position.set(0, 8.2, 5.0);
            this.renderManager.controls.enableRotate = true;
            this.renderManager.controls.enableZoom = true;
            this.renderManager.controls.enablePan = true;
        } else if (sceneName === 'combat') {
            // Player on the green side (rows 5-7)
            this.player.mesh.position.set(0, 0, 10);
            const snap = this.combatEnvironment.snapToGrid(this.player.mesh.position);
            this.player.mesh.position.copy(snap);
            const playerGrid = this.combatEnvironment.getGridPosition(this.player.mesh.position);
            const reservedCells = playerGrid ? [playerGrid] : [];

            // Spawn custom encounter: 1 Cleric on green side, 2 Bandits on red side
            this.entityManager.spawnCombatEncounter('cleric', 1, this.combatEnvironment, reservedCells);
            this.entityManager.spawnCombatEncounter('bandit', 2, this.combatEnvironment, [...reservedCells, ...this.entityManager.clerics.map(c => this.combatEnvironment.getGridPosition(c.position)).filter((p): p is {r: number, c: number} => p !== null)]);
            
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
                setTimeout(() => this.onEnvironmentReady?.(), 100);
            }
        }
    }
    
    public update(delta: number, config: any) {
        if (this.activeScene === 'dev') {
            this.environment.update(delta, config, this.player.mesh.position);
        } else if (this.activeScene === 'world') {
            this.worldEnvironment.update(delta, config, this.player.mesh.position);
        } else if (this.activeScene === 'combat') {
            this.combatEnvironment.update(delta, config, this.player.mesh.position);
        }
    }
}
