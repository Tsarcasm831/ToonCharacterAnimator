import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../types';
import { PlayerModel } from './PlayerModel';
import { PlayerAnimator } from './PlayerAnimator';
import { Environment } from './Environment';
import { PlayerUtils } from './player/PlayerUtils';

export class Blacksmith {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    
    // State
    private walkTime: number = 0;
    private lastStepCount: number = 0;
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

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        // Calculate initial rotation to face room center
        // Room Center approx: -32.66, 51.33
        const roomCenter = new THREE.Vector3(-32.66, 0, 51.33);
        const toCenter = new THREE.Vector3().subVectors(roomCenter, this.position).normalize();
        this.rotationY = Math.atan2(toCenter.x, toCenter.z);

        // Define Blacksmith appearance
        this.config = {
            ...DEFAULT_CONFIG,
            bodyType: 'male',
            bodyVariant: 'muscular', // Blacksmiths are usually strong
            skinColor: '#ffdbac',
            hairStyle: 'bald', // Or crew, let's go with bald or short hair for a blacksmith
            shirtColor: '#000000', // Black Shirt
            pantsColor: '#808080', // Grey Pants
            bootsColor: '#000000', // Black Shoes
            
            // Apron Configuration
            apronColor: '#4e342e', // Dark Leather Brown
            apronDetailColor: '#3e2723',
            
            equipment: {
                helm: false, 
                shoulders: false, 
                shield: false, 
                shirt: true, 
                pants: true, 
                shoes: true, 
                mask: false, 
                hood: false, 
                quiltedArmor: false, 
                leatherArmor: false, 
                heavyLeatherArmor: false, 
                ringMail: false, 
                plateMail: false, 
                robe: false, 
                blacksmithApron: true 
            },
            selectedItem: null, // Maybe a hammer later?
            weaponStance: 'side'
        };

        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        
        // Initial sync
        this.model.sync(this.config, false);
    }

    update(dt: number, targetEyePosition: THREE.Vector3, environment: Environment) {
        // 1. Grounding
        // Add a small offset to ensure we don't clip through the floor
        const groundHeight = PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles);
        // Ensure we are at least on the foundation (y=0.4) if ground check fails or is too low
        this.position.y = Math.max(groundHeight, 0.4); 
        this.model.group.position.copy(this.position);

        // 2. Look at player logic
        const distToPlayer = this.position.distanceTo(targetEyePosition);
        
        // Face player if close
        if (distToPlayer < 5.0) {
            const dir = new THREE.Vector3().subVectors(targetEyePosition, this.position);
            const targetRot = Math.atan2(dir.x, dir.z);
            let diff = targetRot - this.rotationY;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.rotationY += diff * dt * 5.0; // Faster turn
        } else {
             // Return to facing room center
             const roomCenter = new THREE.Vector3(-32.66, 0, 51.33);
             const toCenter = new THREE.Vector3().subVectors(roomCenter, this.position).normalize();
             const targetRot = Math.atan2(toCenter.x, toCenter.z);
             let diff = targetRot - this.rotationY;
             while (diff < -Math.PI) diff += Math.PI * 2;
             while (diff > Math.PI) diff -= Math.PI * 2;
             this.rotationY += diff * dt * 2.0;
        }
        
        this.model.group.rotation.y = this.rotationY;

        // Head tracking
        const lookWeightTarget = distToPlayer < 6.0 ? 1.0 : 0.0;
        this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, lookWeightTarget, dt * 2.0);
        this.cameraHandler.cameraWorldPosition.copy(targetEyePosition);

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

        // Idle animation
        this.animator.animate(animContext, dt, false, {
            x: 0, y: 0, isRunning: false, isPickingUp: false, isDead: false, jump: false
        } as any);
        
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;

        // 4. Update Model
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, false);
    }
}
