import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../types';
import { PlayerModel } from './PlayerModel';
import { PlayerAnimator } from './PlayerAnimator';
import { Environment } from './Environment';
import { PlayerUtils } from './player/PlayerUtils';
import { OUTFIT_PRESETS, BODY_PRESETS } from '../data/constants';

export class NPC {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    
    // NPC state
    private lastStepCount: number = 0;
    private walkTime: number = 0;
    private status = { isDead: false, recoverTimer: 0 };
    private cameraHandler = {
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

    constructor(scene: THREE.Scene, partialConfig: Partial<PlayerConfig>, initialPos: THREE.Vector3) {
        this.scene = scene;
        
        // Start with default
        let resolvedConfig = { ...DEFAULT_CONFIG };

        // 1. Apply Body Preset if variant is specified
        const variant = partialConfig.bodyVariant || resolvedConfig.bodyVariant;
        if (BODY_PRESETS[variant]) {
            resolvedConfig = { ...resolvedConfig, ...BODY_PRESETS[variant] };
        }

        // 2. Apply Outfit Preset if outfit is specified
        const outfit = partialConfig.outfit || resolvedConfig.outfit;
        if (OUTFIT_PRESETS[outfit]) {
            resolvedConfig = { ...resolvedConfig, ...OUTFIT_PRESETS[outfit] };
        }

        // 3. Final override with provided partial config
        this.config = { ...resolvedConfig, ...partialConfig };
        
        // Default NPCs to have hair unless explicitly bald
        if (!partialConfig.hairStyle) {
            this.config.hairStyle = 'crew';
        }
        
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.position.copy(initialPos);
        
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        
        // Initial sync
        this.model.sync(this.config, false);
    }

    update(dt: number, targetEyePosition: THREE.Vector3, environment: Environment) {
        // 1. Grounding & Bounds Safety
        const groundHeight = PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles);
        this.position.y = groundHeight;
        
        // Clamp to bounds in case of entity collision pushes
        if (!PlayerUtils.isWithinBounds(this.position)) {
            const limit = PlayerUtils.WORLD_LIMIT - 1.0;
            this.position.x = THREE.MathUtils.clamp(this.position.x, -limit, limit);
            this.position.z = THREE.MathUtils.clamp(this.position.z, -limit, limit);
        }

        this.model.group.position.copy(this.position);

        // 2. Simple AI: Look at target's eyes
        const distToPlayer = this.position.distanceTo(targetEyePosition);
        const lookWeightTarget = distToPlayer < 5.0 ? 1.0 : 0.0;
        this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, lookWeightTarget, dt * 2.0);
        this.cameraHandler.cameraWorldPosition.copy(targetEyePosition);
        
        // Face player if close
        if (distToPlayer < 4.0) {
            const dir = new THREE.Vector3().subVectors(targetEyePosition, this.position);
            // We only care about horizontal rotation for the body
            const targetRot = Math.atan2(dir.x, dir.z);
            let diff = targetRot - this.rotationY;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.rotationY += diff * dt * 2.0;
            this.model.group.rotation.y = this.rotationY;
        }

        // 3. Animation
        const animContext = {
            config: this.config,
            model: this.model,
            status: this.status,
            cameraHandler: this.cameraHandler,
            isCombatStance: false,
            isJumping: false,
            isAxeSwing: false,
            isPunch: false,
            isPickingUp: false,
            isInteracting: false,
            isWaving: false,
            isSkinning: false,
            isFishing: false,
            isDragged: false,
            walkTime: this.walkTime,
            lastStepCount: this.lastStepCount,
            didStep: false
        };

        this.animator.animate(animContext, dt, false, {
            x: 0, y: 0, isRunning: false, isPickingUp: false, isDead: false, jump: false
        } as any);
        
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;

        // 4. Update Model (Hair physics etc)
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        
        // Sync visual state
        this.model.sync(this.config, false);
    }
}
