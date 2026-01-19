
import * as THREE from 'three';
import { PlayerConfig, PlayerInput, OutfitType, DEFAULT_CONFIG } from '../../types';
import { PlayerModel } from '../model/PlayerModel';
import { PlayerAnimator } from '../animator/PlayerAnimator';
import { PlayerPhysics } from './PlayerPhysics';
import { PlayerCombat } from './PlayerCombat';
import { PlayerInteraction } from './PlayerInteraction';
import { PlayerDebug } from './PlayerDebug';
import { ParticleManager } from '../managers/ParticleManager';
import { Environment } from '../environment/Environment';
import { ChakraNetwork } from '../vfx/ChakraNetwork';
import { PlayerInventory } from './PlayerInventory';
import { PlayerStatusHandler } from './PlayerStatusHandler';
import { PlayerCameraHandler } from './PlayerCameraHandler';

export class Player {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;

    // Sub-Systems
    inventory: PlayerInventory;
    status: PlayerStatusHandler;
    cameraHandler: PlayerCameraHandler;
    chakra: ChakraNetwork;

    // --- Core Locomotion State ---
    moveSpeed: number = 5;
    turnSpeed: number = 10;
    walkTime: number = 0;
    isJumping: boolean = false;
    jumpVelocity: number = 0;
    jumpTimer: number = 0;
    gravity: number = -30;
    jumpPower: number = 11;
    
    previousPosition = new THREE.Vector3();
    velocity = new THREE.Vector3();
    
    lastStepCount: number = 0;
    didStep: boolean = false;

    // --- Action State ---
    // Combat
    isCombatStance: boolean = false;
    wasCombatKeyPressed: boolean = false;
    wasAttack1Pressed: boolean = false;
    wasAttack2Pressed: boolean = false;
    wasFireballKeyPressed: boolean = false;
    
    // Attacks
    isAxeSwing: boolean = false;
    axeSwingTimer: number = 0;
    hasHit: boolean = false;
    isPunch: boolean = false;
    punchTimer: number = 0;
    comboChain: number = 0; 

    // Fireball
    isFireballCasting: boolean = false;
    fireballTimer: number = 0;
    hasSpawnedFireball: boolean = false;

    // Climbing
    isLedgeGrabbing: boolean = false;
    ledgeGrabTime: number = 0;
    ledgeStartPos: THREE.Vector3 = new THREE.Vector3();
    ledgeTargetPos: THREE.Vector3 = new THREE.Vector3();
    
    // Interactions
    isPickingUp: boolean = false;
    pickUpTime: number = 0;
    isInteracting: boolean = false;
    interactTimer: number = 0;
    
    // Emotes
    isWaving: boolean = false;
    waveTimer: number = 0;
    isLeftHandWaving: boolean = false;
    leftHandWaveTimer: number = 0;

    // Summoning
    isSummoning: boolean = false;
    summonTimer: number = 0;
    
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
    
    // Fishing
    isFishing: boolean = false;
    isReeling: boolean = false;
    fishingTimer: number = 0;
    isChargingFishing: boolean = false;
    fishingCharge: number = 0;
    fishingChargeTime: number = 0;
    needsReclick: boolean = false;

    // Bow
    isFiringBow: boolean = false;
    bowState: 'draw' | 'hold' | 'release' = 'draw';
    bowCharge: number = 0;
    bowTimer: number = 0;

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

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG };
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.scene.add(this.model.group);
        this.model.group.position.set(-24, 0, 50);
        this.model.group.rotation.y = Math.PI;

        // Initialize Handlers
        this.inventory = new PlayerInventory();
        this.status = new PlayerStatusHandler();
        this.cameraHandler = new PlayerCameraHandler();
        this.chakra = new ChakraNetwork(scene);
    }

    get mesh() { return this.model.group; }

    // Helpers exposed for Interaction/Game
    addItem(itemName: string, count: number = 1, skipHotbar: boolean = false) { 
        return this.inventory.addItem(itemName, count, skipHotbar); 
    }
    
    toggleHitbox() {
        this.isDebugHitbox = !this.isDebugHitbox;
        PlayerDebug.updateHitboxVisuals(this);
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

    update(dt: number, input: PlayerInput, cameraPosition: THREE.Vector3, cameraAngle: number, environment: any, particleManager: ParticleManager, entities: any[] = []) {
        this.syncConfig();
        
        // 1. Physics & Model Update
        if (dt > 0) {
            this.velocity.subVectors(this.mesh.position, this.previousPosition).divideScalar(dt);
        }
        this.previousPosition.copy(this.mesh.position);
        this.model.update(dt, this.velocity);
        
        // 2. State Logic
        this.status.update(dt);
        this.cameraHandler.update(this, dt, cameraPosition);

        // 3. Input Handlers
        if (input.isDead && !this.wasDeadKeyPressed) {
            this.status.toggleDeath(this.mesh);
            this.clearActionStates();
        }
        this.wasDeadKeyPressed = !!input.isDead;
        
        if (input.combat && !this.wasCombatKeyPressed) {
            this.isCombatStance = !this.isCombatStance;
        }
        this.wasCombatKeyPressed = !!input.combat;
        
        // Wave Handler
        if (input.wave && !this.isWaving && !this.isCombatStance && !this.isJumping) {
            this.isWaving = true;
            this.waveTimer = 0;
        }
        
        if (this.isWaving) {
            if (input.x !== 0 || input.y !== 0 || input.jump || input.isPickingUp || input.attack1) {
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
        if (input.leftHandWave && !this.isLeftHandWaving && !this.isCombatStance && !this.isJumping) {
            this.isLeftHandWaving = true;
            this.leftHandWaveTimer = 0;
        }

        if (this.isLeftHandWaving) {
            if (input.x !== 0 || input.y !== 0 || input.jump || input.isPickingUp || input.attack1) {
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

        // Summoning Handler
        if (input.summon && !this.isSummoning && !this.config.selectedItem && !this.isJumping) {
            this.isSummoning = true;
            this.summonTimer = 0;
        }

        if (this.isSummoning) {
            if (input.x !== 0 || input.y !== 0 || input.jump) {
                this.isSummoning = false;
                this.summonTimer = 0;
            } else {
                this.summonTimer += dt;
                if (this.summonTimer > 3.0) {
                    this.isSummoning = false;
                    this.summonTimer = 0;
                }
            }
        }

        // 4. Sub-Systems
        if (this.status.isDead) {
            // No physics or actions when dead
        } else {
            if (this.status.recoverTimer <= 0) {
                PlayerInteraction.update(this, dt, input, environment.obstacles, entities);
                PlayerCombat.update(this, dt, input, environment, particleManager, entities);
                PlayerPhysics.update(this, dt, input, cameraAngle, environment.obstacles);
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
        this.isFireballCasting = false;
        this.fireballTimer = 0;
        this.isSummoning = false;
        this.summonTimer = 0;
        this.isPickingUp = false;
        this.pickUpTime = 0;
        this.isSkinning = false;
        this.skinningTimer = 0;
        this.isFishing = false;
        this.isChargingFishing = false;
    }

    private syncConfig() {
        if (this.lastOutfit !== this.config.outfit) {
            this.lastOutfit = this.config.outfit;
        }
        
        if (this.config.selectedItem === 'Fishing Pole' && this.config.weaponStance !== 'shoulder') {
            this.config.weaponStance = 'shoulder';
        }

        if (this.config.selectedItem !== 'Bow' && this.isFiringBow) {
            this.isFiringBow = false;
            this.bowCharge = 0;
            this.bowTimer = 0;
            this.bowState = 'draw';
        }

        this.model.sync(this.config, this.isCombatStance);
    }
}
