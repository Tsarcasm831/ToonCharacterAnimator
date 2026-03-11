
import * as THREE from 'three';
import { PlayerConfig, PlayerInput, OutfitType, DEFAULT_CONFIG } from '../../types';
import { PlayerModel } from '../model/PlayerModel';
import { PlayerAnimator } from '../animator/PlayerAnimator';
import { PlayerLocomotion } from './PlayerLocomotion';
import { PlayerCombat } from './PlayerCombat';
import { PlayerInteraction } from './PlayerInteraction';
import { PlayerDebug } from './PlayerDebug';
import { ParticleManager } from '../managers/ParticleManager';
import { ChakraNetwork } from '../vfx/ChakraNetwork';
import { PlayerInventory } from './PlayerInventory';
import { PlayerStatusHandler } from './PlayerStatusHandler';
import { PlayerCameraHandler } from './PlayerCameraHandler';

export class Player {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    soundManager: any; // SoundManager instance

    // Sub-Systems
    inventory: PlayerInventory;
    status: PlayerStatusHandler;
    cameraHandler: PlayerCameraHandler;
    locomotion: PlayerLocomotion;
    combat: PlayerCombat;
    chakra: ChakraNetwork;

    // Interactions (To be moved to PlayerInteraction subsystem later)
    isPickingUp: boolean = false;
    pickUpTime: number = 0;
    isInteracting: boolean = false;
    interactTimer: number = 0;
    
    // Skinning
    isSkinning: boolean = false;
    canSkin: boolean = false;
    skinningTimer: number = 0;
    maxSkinningTime: number = 3.0;
    skinningProgress: number = 0;

    // Dialogue
    canTalk: boolean = false;
    talkingTarget: any = null;
    isTalking: boolean = false;
    
    // Generic Interaction
    interactableTarget: THREE.Object3D | null = null;

    // Emotes
    isWaving: boolean = false;
    waveTimer: number = 0;
    isLeftHandWaving: boolean = false;
    leftHandWaveTimer: number = 0;

    // Ragdoll
    isDragged: boolean = false;
    draggedPartName: string = 'hips';
    dragVelocity: THREE.Vector3 = new THREE.Vector3();
    
    // Debug
    isDebugHitbox: boolean = false;
    isDebugHands: boolean = false;
    isSkeletonMode: boolean = false;

    private lastOutfit: OutfitType | null = null;
    private wasDeadKeyPressed: boolean = false;

    constructor(scene: THREE.Scene, soundManager?: any) {
        this.scene = scene;
        this.soundManager = soundManager;
        this.config = { ...DEFAULT_CONFIG };
        this.model = new PlayerModel(this.config);
        this.model.group.userData.entityType = 'Player';
        this.animator = new PlayerAnimator();
        this.scene.add(this.model.group);
        this.model.group.position.set(-24, 0, 50);
        this.model.group.rotation.y = Math.PI;

        // Initialize Handlers
        this.inventory = new PlayerInventory();
        this.status = new PlayerStatusHandler();
        this.cameraHandler = new PlayerCameraHandler();
        this.locomotion = new PlayerLocomotion(this);
        this.combat = new PlayerCombat(this, soundManager);
        this.chakra = new ChakraNetwork(scene);
    }

    get mesh() { return this.model.group; }
    get position() { return this.locomotion.position; }
    get velocity() { return this.locomotion.velocity; }
    get rotationY() { return this.locomotion.rotationY; }

    // Helpers exposed for Interaction/Game
    addItem(itemName: string, count: number = 1, skipHotbar: boolean = false) { 
        return this.inventory.addItem(itemName, count, skipHotbar); 
    }
    
    toggleHitbox() {
        this.isDebugHitbox = !this.isDebugHitbox;
        PlayerDebug.updateHitboxVisuals(this);
        // Also update the obstacle-style visuals for the player to ensure color consistency
        PlayerDebug.updateObstacleHitboxVisuals([this.mesh], this.isDebugHitbox);
    }

    toggleSkeletonMode() {
        this.isSkeletonMode = !this.isSkeletonMode;
        this.model.group.visible = !this.isSkeletonMode;
        if (this.isSkeletonMode) {
            this.isDebugHitbox = true;
        }
        PlayerDebug.updateHitboxVisuals(this);
    }

    toggleHandsDebug() {
        this.isDebugHands = !this.isDebugHands;
        PlayerDebug.toggleHandDebugMode(this);
    }

    setVisible(visible: boolean) {
        this.model.group.visible = visible;
    }

    hide() {
        this.setVisible(false);
    }

    show() {
        this.setVisible(true);
    }

    update(dt: number, input: PlayerInput, cameraPosition: THREE.Vector3, cameraAngle: number, environment: any, particleManager: ParticleManager, entities: any[] = [], isInCombat: boolean = false, additionalObstacles: THREE.Object3D[] = []) {
        this.syncConfig();
        
        // 1. Physics & Model Update
        this.locomotion.update(dt, input, cameraAngle, environment.obstacles, isInCombat);
        
        // Grid snapping in combat
        if (isInCombat && environment && environment.constructor.name === 'CombatEnvironment') {
            this.locomotion.snapToCombatGrid(environment);
        }
        
        // Interpolate player visual mesh to physics position
        // Using a higher lerp factor or direct copy to avoid visual lag behind physics
        this.model.group.position.copy(this.locomotion.position);
        
        // Directly copy rotation from locomotion to avoid double-smoothing lag
        // Locomotion already handles turn speed interpolation
        this.model.group.rotation.y = this.locomotion.rotationY;

        this.model.update(dt, this.locomotion.velocity);
        
        // 2. State Logic
        this.status.update(dt);
        this.cameraHandler.update(this, dt, cameraPosition);

        // 3. Input Handlers
        if (input.isDead && !this.wasDeadKeyPressed) {
            this.status.toggleDeath(this.mesh);
            this.clearActionStates();
        }
        this.wasDeadKeyPressed = !!input.isDead;
        
        // Wave Handler
        if (input.wave && !this.isWaving && !this.combat.isCombatStance && !this.locomotion.isJumping) {
            this.isWaving = true;
            this.waveTimer = 0;
        }
        
        if (this.isWaving) {
            if (input.x !== 0 || input.y !== 0 || input.jump || this.isPickingUp || input.attack1) {
                this.isWaving = false;
                this.waveTimer = 0;
            } else {
                this.waveTimer += dt;
                if (this.waveTimer > 3.0) {
                    this.isWaving = false;
                    this.waveTimer = 0;
                }
            }
        }

        // Left Hand Wave Handler
        if (input.leftHandWave && !this.isLeftHandWaving && !this.combat.isCombatStance && !this.locomotion.isJumping) {
            this.isLeftHandWaving = true;
            this.leftHandWaveTimer = 0;
        }

        if (this.isLeftHandWaving) {
            if (input.x !== 0 || input.y !== 0 || input.jump || this.isPickingUp || input.attack1) {
                this.isLeftHandWaving = false;
                this.leftHandWaveTimer = 0;
            } else {
                this.leftHandWaveTimer += dt;
                if (this.leftHandWaveTimer > 2.5) {
                    this.isLeftHandWaving = false;
                    this.leftHandWaveTimer = 0;
                }
            }
        }

        // 4. Sub-Systems
        if (this.status.isDead) {
            // No physics or actions when dead
        } else {
            if (this.status.recoverTimer <= 0) {
                // Combine environment obstacles with additional obstacles for interaction
                const allObstacles = [...environment.obstacles, ...additionalObstacles];
                PlayerInteraction.update(this, dt, input, allObstacles, entities);
                this.combat.update(dt, input, environment, particleManager, entities);
            } else {
                // Interrupted - clear channelings but allow timer cleanup if needed
                this.clearActionStates();
            }
        }

        // 5. Animation
        const isMoving = (input.x !== 0 || input.y !== 0) && !this.status.isDead;
        this.animator.animate(this, dt, isMoving, input, environment.obstacles);

        // 6. Visual Effects
        this.chakra.setVisible(this.isSkeletonMode);
        if (this.isSkeletonMode) {
            this.chakra.update(dt, this.model);
        }

        // 7. Debug Visuals
        if (this.isDebugHitbox) {
            if (this.isSkeletonMode) {
                this.model.group.updateMatrixWorld(true);
            }
            PlayerDebug.updateHitboxVisuals(this);
        }
    }

    private clearActionStates() {
        this.combat.clearActionStates();
        this.isPickingUp = false;
        this.pickUpTime = 0;
        this.isSkinning = false;
        this.skinningTimer = 0;
    }

    private syncConfig() {
        if (this.lastOutfit !== this.config.outfit) {
            this.lastOutfit = this.config.outfit;
        }
        
        if (this.config.selectedItem === 'Fishing Pole' && this.config.weaponStance !== 'shoulder') {
            this.config.weaponStance = 'shoulder';
        }

        if (this.config.selectedItem !== 'Bow' && this.combat.isFiringBow) {
            this.combat.clearBowState();
        }

        this.model.sync(this.config, this.combat.isCombatStance);
    }
}

