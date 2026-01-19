
import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { PlayerModel } from '../../../model/PlayerModel';
import { PlayerAnimator } from '../../../animator/PlayerAnimator';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { OUTFIT_PRESETS, BODY_PRESETS } from '../../../../data/constants';

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
        let resolvedConfig = { ...DEFAULT_CONFIG };
        const variant = partialConfig.bodyVariant || resolvedConfig.bodyVariant;
        if (BODY_PRESETS[variant]) resolvedConfig = { ...resolvedConfig, ...BODY_PRESETS[variant] };
        const outfit = partialConfig.outfit || resolvedConfig.outfit;
        if (OUTFIT_PRESETS[outfit]) resolvedConfig = { ...resolvedConfig, ...OUTFIT_PRESETS[outfit] };
        this.config = { ...resolvedConfig, ...partialConfig };
        if (!partialConfig.hairStyle) this.config.hairStyle = 'crew';
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.position.copy(initialPos);
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        this.model.sync(this.config, false);
    }

    update(dt: number, targetEyePosition: THREE.Vector3, environment: Environment, skipAnimation: boolean = false) {
        const groundHeight = PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles);
        this.position.y = groundHeight;
        if (!PlayerUtils.isWithinBounds(this.position)) {
            const limit = PlayerUtils.WORLD_LIMIT - 1.0;
            this.position.x = THREE.MathUtils.clamp(this.position.x, -limit, limit);
            this.position.z = THREE.MathUtils.clamp(this.position.z, -limit, limit);
        }
        this.model.group.position.copy(this.position);

        const distToPlayer = this.position.distanceTo(targetEyePosition);
        if (distToPlayer < 4.0) {
            const dir = new THREE.Vector3().subVectors(targetEyePosition, this.position);
            const targetRot = Math.atan2(dir.x, dir.z);
            let diff = targetRot - this.rotationY;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.rotationY += diff * dt * 2.0;
            this.model.group.rotation.y = this.rotationY;
        }

        if (skipAnimation) return;

        this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, distToPlayer < 5.0 ? 1.0 : 0.0, dt * 2.0);
        this.cameraHandler.cameraWorldPosition.copy(targetEyePosition);

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: false, isJumping: false, isAxeSwing: false, isPunch: false, isPickingUp: false,
            isInteracting: false, isWaving: false, isSkinning: false, isFishing: false, isDragged: false,
            walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };

        this.animator.animate(animContext, dt, false, {
            x: 0, y: 0, isRunning: false, isPickingUp: false, isDead: false, jump: false
        } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, false);
    }
}
