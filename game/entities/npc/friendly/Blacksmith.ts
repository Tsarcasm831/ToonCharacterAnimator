
import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { PlayerModel } from '../../../PlayerModel';
import { PlayerAnimator } from '../../../PlayerAnimator';
import { Environment } from '../../../Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';

export class Blacksmith {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    
    private walkTime: number = 0;
    private lastStepCount: number = 0;
    private status = { isDead: false, recoverTimer: 0 };
    
    private cameraHandler = {
        blinkTimer: 0, isBlinking: false, eyeLookTarget: new THREE.Vector2(), eyeLookCurrent: new THREE.Vector2(),
        eyeMoveTimer: 0, lookAtCameraTimer: 0, cameraGazeTimer: 0, isLookingAtCamera: false,
        headLookWeight: 0, cameraWorldPosition: new THREE.Vector3()
    };

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.rotationY = Math.PI / 2;
        this.config = {
            ...DEFAULT_CONFIG,
            bodyType: 'male', bodyVariant: 'muscular', skinColor: '#ffdbac', hairStyle: 'bald', 
            shirtColor: '#000000', pantsColor: '#808080', bootsColor: '#000000', apronColor: '#4e342e', apronDetailColor: '#3e2723',
            equipment: {
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, mask: false, hood: false,
                quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, blacksmithApron: true 
            },
            selectedItem: null, weaponStance: 'side'
        };
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;
        this.scene.add(this.model.group);
        this.model.sync(this.config, false);
    }

    update(dt: number, targetEyePosition: THREE.Vector3, environment: Environment, skipAnimation: boolean = false) {
        // Use getLandingHeight to avoid roof snapping
        const groundHeight = PlayerUtils.getLandingHeight(this.position, this.config, environment.obstacles);
        this.position.y = groundHeight; 
        this.model.group.position.copy(this.position);

        const distToPlayer = this.position.distanceTo(targetEyePosition);
        const targetRot = distToPlayer < 5.0 ? Math.atan2(targetEyePosition.x - this.position.x, targetEyePosition.z - this.position.z) : Math.PI / 2;
        let diff = targetRot - this.rotationY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotationY += diff * dt * (distToPlayer < 5.0 ? 5.0 : 2.0); 
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, distToPlayer < 6.0 ? 1.0 : 0.0, dt * 2.0);
        this.cameraHandler.cameraWorldPosition.copy(targetEyePosition);

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: false, isJumping: false, isAxeSwing: false, isPunch: false, isPickingUp: false,
            isInteracting: false, isWaving: false, isSkinning: false, isFishing: false, isDragged: false,
            walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };

        this.animator.animate(animContext, dt, false, { x: 0, y: 0, isRunning: false, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, false);
    }
}
