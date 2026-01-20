
import * as THREE from 'three';
import { PlayerInput } from '../../types';
import { LocomotionAnimator } from './LocomotionAnimator';
import { ActionAnimator } from './ActionAnimator';
import { StatusAnimator } from './StatusAnimator';
import { FishingAction } from './actions/FishingAction';
import { SkirtPhysics } from './SkirtPhysics';

export class PlayerAnimator {
    private locomotion = new LocomotionAnimator();
    private action = new ActionAnimator();
    private status = new StatusAnimator();
    private _tempObj = new THREE.Object3D();

    animate(player: any, dt: number, isMoving: boolean, input: PlayerInput, obstacles?: THREE.Object3D[]) {
        const parts = player.model.parts;
        const damp = 10 * dt;

        // 1. Core Status Overrides (Ragdoll, Death, Ledge)
        if (player.isDragged || player.status.recoverTimer > 0) {
            this.status.animateRagdoll(player, parts, dt);
            this.animateFace(player, dt);
            return;
        } 
        if (player.status.isDead) {
            this.status.animateDeath(player, parts, dt, damp);
            return;
        } 
        if (player.locomotion.isLedgeGrabbing) {
            this.action.animateClimb(player, parts, dt, damp);
            this.animateFace(player, dt);
            return;
        }

        // 2. Action Overrides (Priority Over Movement)
        if (player.combat.isFireballCasting) {
            this.action.animateFireball(player, parts, dt, damp);
            this.animateFace(player, dt);
            return; // Full body override
        } 
        
        if (player.combat.isFiringBow) {
            this.action.animateFireArrow(player, parts, dt, damp);
            // Bow allows moving, so we don't return here yet, 
            // but we MUST ensure base layer doesn't overwrite arms.
        }

        if (player.isPickingUp) {
            this.action.animatePickup(player, parts, dt, damp);
            this.animateFace(player, dt);
            return;
        } 
        if (player.isSkinning) {
            this.action.animateSkinning(player, parts, dt, damp);
            this.animateFace(player, dt);
            return;
        } 
        if (player.combat.isSummoning) {
            this.action.animateSummon(player, parts, dt, damp);
            this.animateFace(player, dt);
            return;
        } 
        if (player.combat.isFishing) {
            this.action.animateFishing(player, parts, dt, damp, obstacles);
            this.animateFace(player, dt);
            return;
        } 
        if (player.isWaving) {
            this.action.animateWave(player, parts, dt, damp);
            this.animateFace(player, dt);
            return;
        } 
        if (player.isLeftHandWaving) {
            this.action.animateLeftHandWave(player, parts, dt, damp);
            this.animateFace(player, dt);
            return;
        }

        // 3. Base Locomotion Layer
        // If holding pole but not fishing, ensure it stays in hand correctly
        if (player.config.selectedItem === 'Fishing Pole') {
            FishingAction.reset(player, dt);
        }

        // State Machine Transitions
        if (player.locomotion.isJumping) {
            this.stateMachine.changeState(this.jumpState);
        } else if (isMoving) {
            this.stateMachine.changeState(this.moveState);
        } else {
            this.stateMachine.changeState(this.idleState);
        }

        // Update State Machine
        this.stateMachine.update(dt, input, obstacles);

        // 4. Combat / Interaction Overlay Layer
        if (player.combat.isAxeSwing) {
            this.action.animateAxeSwing(player, parts, dt, damp, isMoving);
        } else if (player.combat.isPunch) {
            this.action.animatePunch(player, parts, dt, damp, isMoving);
        } else if (player.isInteracting) {
            this.action.animateInteract(player, parts, dt, damp);
        }
        
        // 5. Head Tracking & Expressions
        this.animateFace(player, dt);

        // 6. Cloth Physics
        SkirtPhysics.animate(player, parts, dt);
    }

    private animateFace(player: any, dt: number) {
        const cam = player.cameraHandler;
        const lerp = THREE.MathUtils.lerp;
        
        // === BLINKING ===
        cam.blinkTimer += dt;
        const blinkInterval = 6.0;
        const blinkDur = 0.15;

        if (cam.blinkTimer > blinkInterval) cam.isBlinking = true;

        if (cam.isBlinking) {
            if (cam.blinkTimer - blinkInterval > blinkDur) {
                cam.isBlinking = false;
                cam.blinkTimer = 0;
            }
        }

        let blinkAlpha = 0;
        if (cam.isBlinking) {
            const timeInBlink = cam.blinkTimer - blinkInterval;
            blinkAlpha = Math.sin((timeInBlink / blinkDur) * Math.PI); 
        }

        if (player.isDragged || player.status.recoverTimer > 0.5) {
            blinkAlpha = 1.0;
        }

        const openTop = -0.7;
        const openBot = 0.61; 
        const closedTop = -0.1;
        const closedBot = 0.1;

        const eyelids = player.model.eyelids as THREE.Group[]; 
        if (eyelids && eyelids.length === 4) {
            eyelids[0].rotation.x = lerp(openTop, closedTop, blinkAlpha);
            eyelids[1].rotation.x = lerp(openBot, closedBot, blinkAlpha);
            eyelids[2].rotation.x = lerp(openTop, closedTop, blinkAlpha);
            eyelids[3].rotation.x = lerp(openBot, closedBot, blinkAlpha);
        }

        // === GAZE & HEAD TRACKING ===
        if (player.isDragged || player.status.recoverTimer > 0.5) {
            const eyes = player.model.eyes as THREE.Mesh[];
            if (eyes && eyes.length === 2) {
                eyes[0].rotation.set(0,0,0);
                eyes[1].rotation.set(0,0,0);
            }
            return;
        }
        
        const gazeDamp = dt * 8;
        cam.eyeMoveTimer -= dt;
        if (cam.eyeMoveTimer <= 0) {
            cam.eyeMoveTimer = 0.5 + Math.random() * 3.5; 
            if (Math.random() < 0.4) {
                cam.eyeLookTarget.set(0, 0); 
            } else {
                const rYaw = (Math.random() - 0.5) * 1.2; 
                const rPitch = (Math.random() - 0.5) * 0.6;
                cam.eyeLookTarget.set(rYaw, rPitch);
            }
        }
        cam.eyeLookCurrent.x = lerp(cam.eyeLookCurrent.x, cam.eyeLookTarget.x, gazeDamp);
        cam.eyeLookCurrent.y = lerp(cam.eyeLookCurrent.y, cam.eyeLookTarget.y, gazeDamp);
        
        const weight = cam.headLookWeight;
        
        let finalEyeYaw = cam.eyeLookCurrent.x;
        let finalEyePitch = cam.eyeLookCurrent.y;
        
        const head = player.model.parts.head;
        const neck = player.model.parts.neck;
        const mouth = player.model.parts.mouth;

        if (weight > 0 && head && neck) {
            this._tempObj.position.copy(cam.cameraWorldPosition);
            neck.worldToLocal(this._tempObj.position);
            const localCam = this._tempObj.position;
            
            const camYaw = Math.atan2(localCam.x, localCam.z);
            const camPitch = -Math.atan2(localCam.y, Math.sqrt(localCam.x*localCam.x + localCam.z*localCam.z));
            
            const limitYaw = 1.0; 
            const limitPitch = 0.6;
            const clampedYaw = THREE.MathUtils.clamp(camYaw, -limitYaw, limitYaw);
            const clampedPitch = THREE.MathUtils.clamp(camPitch, -limitPitch, limitPitch);
            
            head.rotation.y = lerp(head.rotation.y, clampedYaw, weight);
            head.rotation.x = lerp(head.rotation.x, clampedPitch, weight);
            
            if (mouth) {
                const currentScaleX = mouth.scale.x;
                const currentScaleY = mouth.scale.y;
                const currentRotX = mouth.rotation.x;

                mouth.scale.x = lerp(currentScaleX, 1.2, weight);
                mouth.scale.y = lerp(currentScaleY, 0.8, weight);
                mouth.rotation.x = lerp(currentRotX, -0.2, weight);
            }
            
            finalEyeYaw = lerp(finalEyeYaw, 0, weight);
            finalEyePitch = lerp(finalEyePitch, 0, weight);
        }

        const eyes = player.model.eyes as THREE.Mesh[];
        if (eyes && eyes.length === 2) {
             eyes[0].rotation.x = finalEyePitch;
             eyes[0].rotation.y = finalEyeYaw;
             eyes[1].rotation.x = finalEyePitch;
             eyes[1].rotation.y = finalEyeYaw;
        }
    }
}
