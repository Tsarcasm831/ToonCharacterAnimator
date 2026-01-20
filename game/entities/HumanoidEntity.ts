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

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, config: PlayerConfig) {
        super(scene, initialPos);
        this.config = config;
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        
        // Add model group to entity group instead of scene directly
        this.group.add(this.model.group);
        
        // Initial sync
        this.model.sync(this.config, false);
        this.lastFramePos.copy(initialPos);
    }

    protected updateGroundHeight(environment: any) {
        // Assuming environment has obstacles
        const obstacles = environment.obstacles || [];
        const groundHeight = PlayerUtils.getGroundHeight(this.position, this.config, obstacles);
        this.position.y = groundHeight;
        this.group.position.y = groundHeight;
    }

    protected updateModel(dt: number) {
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
