import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { PlayerModel } from '../model/PlayerModel';
import { PlayerAnimator } from '../animator/PlayerAnimator';
import { PlayerConfig, DEFAULT_CONFIG } from '../../types';
import { Environment } from '../environment/Environment';
import { PlayerUtils } from '../player/PlayerUtils';

export abstract class HumanoidEntity extends BaseEntity {
    public model: PlayerModel;
    public animator: PlayerAnimator;
    public config: PlayerConfig;
    
    // Common State
    protected walkTime: number = 0;
    protected lastStepCount: number = 0;
    public status = { isDead: false, recoverTimer: 0 };
    protected cameraHandler = {
        blinkTimer: 0,
        isBlinking: false,
        eyeLookTarget: new THREE.Vector2(),
        eyeLookCurrent: new THREE.Vector2(),
        eyeMoveTimer: 0,
        lookAtCameraTimer: 0,
        cameraGazeTimer: 0,
        isLookingAtCamera: false,
        headLookWeight: 0,
        cameraWorldPosition: new THREE.Vector3()
    };

    protected lastFramePos: THREE.Vector3 = new THREE.Vector3();
    protected interpolationSpeed: number = 15;

    // Combat / Hitbox
    public hitbox: THREE.Group;
    public barsGroup: THREE.Group | null = null;
    private healthBar: THREE.Mesh | null = null;
    private healthBarBack: THREE.Mesh | null = null;
    private chakraBar: THREE.Mesh | null = null;
    private chakraBarBack: THREE.Mesh | null = null;

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, config: PlayerConfig) {
        super(scene, initialPos);
        this.config = config;
        // Initialize stats from config if present
        if (this.config.stats) {
            this.stats = { ...this.config.stats };
        }
        
        this.model = new PlayerModel(this.config);
        this.model.group.userData.type = 'creature';
        this.animator = new PlayerAnimator();
        
        // Add model group to entity group instead of scene directly
        this.group.add(this.model.group);
        
        // Initial sync
        this.model.sync(this.config, false);
        this.lastFramePos.copy(initialPos);

        // Hitbox group is now unused for collision but kept for compatibility
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this };
        this.group.add(this.hitbox);
        
        // We do not need initHitbox() anymore as we use the model meshes directly
        // this.initHitbox(); 
        this.initStatBars();
    }

    // Return the model meshes for collision detection
    public getHitboxParts(): THREE.Object3D[] {
        const parts: THREE.Object3D[] = [];
        // Collect all meshes from the model group to act as hitboxes
        this.model.group.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                // Filter out overlays or non-physical items if needed
                if (obj.name !== 'HitboxOverlay' && obj.visible) {
                    parts.push(obj);
                }
            }
        });
        return parts;
    }

    protected initHitbox() {
        // Deprecated: We use getHitboxParts now
    }

    protected initStatBars() {
        this.barsGroup = new THREE.Group();
        this.model.group.add(this.barsGroup);

        const barGeo = new THREE.PlaneGeometry(0.8, 0.1);
        const healthMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const chakraMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

        // Health Bar
        const healthBg = new THREE.Mesh(barGeo, bgMat);
        this.healthBar = new THREE.Mesh(barGeo, healthMat);
        this.healthBar.position.z = 0.01;
        
        // Chakra Bar
        const chakraBg = new THREE.Mesh(barGeo, bgMat);
        this.chakraBar = new THREE.Mesh(barGeo, chakraMat);
        this.chakraBar.position.z = 0.01;

        // Back-side meshes
        this.healthBarBack = new THREE.Mesh(barGeo, healthMat);
        this.healthBarBack.position.z = -0.01;
        this.healthBarBack.rotation.y = Math.PI;
        
        this.chakraBarBack = new THREE.Mesh(barGeo, chakraMat);
        this.chakraBarBack.position.z = -0.01;
        this.chakraBarBack.rotation.y = Math.PI;

        // Positioning
        healthBg.position.y = 2.6;
        this.healthBar.position.y = 2.6;
        this.healthBarBack.position.y = 2.6;
        
        chakraBg.position.y = 2.45;
        this.chakraBar.position.y = 2.45;
        this.chakraBarBack.position.y = 2.45;

        this.barsGroup.add(healthBg);
        this.barsGroup.add(this.healthBar);
        this.barsGroup.add(this.healthBarBack);
        this.barsGroup.add(chakraBg);
        this.barsGroup.add(this.chakraBar);
        this.barsGroup.add(this.chakraBarBack);

        this.barsGroup.visible = false;
    }

    public updateStatBars(cameraPos: THREE.Vector3, isCombatActive: boolean) {
        if (!this.barsGroup) return;
        
        // Show bars if damaged or in combat
        const isDamaged = this.stats && this.stats.health < this.stats.maxHealth;
        this.barsGroup.visible = !this.isDead && (isCombatActive || isDamaged);
        
        if (!this.barsGroup.visible) return;

        this.barsGroup.lookAt(cameraPos);
        
        if (this.healthBar && this.healthBarBack && this.stats) {
            const scale = Math.max(0, this.stats.health / this.stats.maxHealth);
            this.healthBar.scale.x = scale;
            this.healthBarBack.scale.x = scale;
            
            const offset = -0.4 * (1 - scale);
            this.healthBar.position.x = offset;
            this.healthBarBack.position.x = -offset;
        }
        if (this.chakraBar && this.chakraBarBack && this.stats) {
            const scale = Math.max(0, (this.stats.chakra || 0) / (this.stats.maxChakra || 100));
            this.chakraBar.scale.x = scale;
            this.chakraBarBack.scale.x = scale;
            
            const offset = -0.4 * (1 - scale);
            this.chakraBar.position.x = offset;
            this.chakraBarBack.position.x = -offset;
        }
    }

    public takeDamage(amount: number) {
        if (this.isDead || !this.stats) return;

        this.stats.health -= amount;
        this.model.flashDamage();

        if (this.stats.health <= 0) {
            this.die();
        } else {
            // Optional: Trigger hit animation or stagger state
        }
    }

    public die() {
        this.isDead = true;
        this.status.isDead = true;
        if (this.barsGroup) this.barsGroup.visible = false;
        
        // Play death animation via Animator state or direct model manipulation
        // For now, let's use the standard "lay down" trick if no animation exists
        // But animator should handle 'isDead' flag
    }

    protected updateGroundHeight(environment: any) {
        // Assuming environment has obstacles
        const obstacles = environment.obstacles || [];
        const groundHeight = PlayerUtils.getGroundHeight(this.targetPosition, this.config, obstacles);
        this.targetPosition.y = groundHeight;
    }

    protected updateModel(dt: number) {
        // 1. Interpolate position and rotation for smoothness
        const lerpFactor = Math.min(dt * this.interpolationSpeed, 1.0);
        this.position.lerp(this.targetPosition, lerpFactor);
        
        // Handle rotation wrapping
        let rotDiff = this.targetRotationY - this.rotationY;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        this.rotationY += rotDiff * lerpFactor;

        this.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;
        
        let moveVelocity = new THREE.Vector3(0, 0, 0);
        
        if (this.externalControl) {
            // Calculate velocity from position delta
            const currentPos = this.group.position.clone();
            const deltaPos = currentPos.clone().sub(this.lastFramePos);
            if (dt > 0) {
                moveVelocity = deltaPos.divideScalar(dt);
            }
            this.lastFramePos.copy(currentPos);
            
            // Map combatState to animation inputs
            const isMoving = this.combatState === 'MOVING';
            const isAttacking = this.combatState === 'ATTACKING';
            const isCasting = this.combatState === 'CASTING';
            
            // We need to pass these to the animator
            // Current animator interface expects a PlayerInput object-like structure or specific flags
            // We'll construct a synthetic input
            const syntheticInput = {
                x: 0, y: isMoving ? 1 : 0, // Fake forward input if moving
                isRunning: moveVelocity.length() > 4.0, // Run if fast
                isPickingUp: false,
                isDead: this.combatState === 'DEAD',
                jump: false,
                attack1: isAttacking,
                summon: isCasting
            };
            
            // Call animator
            // NOTE: The subclasses usually call animator in their update()
            // We should provide a method 'updateVisuals' that subclasses call, 
            // OR subclasses should use this logic in their update.
            // Since subclasses have specific animator calls (e.g. Monk flurry), 
            // we should probably override the animation logic in subclasses or standardise it here.
            // For now, let's just expose helper to calculate 'animContext' values
        }
        
        this.model.update(dt, moveVelocity);
    }
}
