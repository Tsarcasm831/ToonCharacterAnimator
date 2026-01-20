import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { HumanoidEntity } from '../../HumanoidEntity';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { AIUtils } from '../../../core/AIUtils';
import { OUTFIT_PRESETS, BODY_PRESETS } from '../../../../data/constants';

export class NPC extends HumanoidEntity {
    constructor(scene: THREE.Scene, partialConfig: Partial<PlayerConfig>, initialPos: THREE.Vector3) {
        let resolvedConfig = { ...DEFAULT_CONFIG };
        const variant = partialConfig.bodyVariant || resolvedConfig.bodyVariant;
        if (BODY_PRESETS[variant]) resolvedConfig = { ...resolvedConfig, ...BODY_PRESETS[variant] };
        const outfit = partialConfig.outfit || resolvedConfig.outfit;
        if (OUTFIT_PRESETS[outfit]) resolvedConfig = { ...resolvedConfig, ...OUTFIT_PRESETS[outfit] };
        
        const finalConfig = { ...resolvedConfig, ...partialConfig };
        if (!partialConfig.hairStyle) finalConfig.hairStyle = 'crew';

        super(scene, initialPos, finalConfig);
    }

    update(dt: number, targetEyePosition: THREE.Vector3, environment: Environment, skipAnimation: boolean = false) {
        this.updateGroundHeight(environment);
        
        if (!PlayerUtils.isWithinBounds(this.position)) {
            const limit = PlayerUtils.WORLD_LIMIT - 1.0;
            this.position.x = THREE.MathUtils.clamp(this.position.x, -limit, limit);
            this.position.z = THREE.MathUtils.clamp(this.position.z, -limit, limit);
        }
        
        this.group.position.copy(this.position);

        const distToPlayer = this.position.distanceTo(targetEyePosition);
        if (distToPlayer < 4.0) {
            this.rotationY = AIUtils.smoothLookAt(this.rotationY, targetEyePosition, this.position, dt, 2.0);
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
        
        this.updateModel(dt);
        this.model.sync(this.config, false);
    }
}
