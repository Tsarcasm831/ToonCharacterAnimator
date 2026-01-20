import * as THREE from 'three';
import { Player } from './Player';
import { PlayerInput } from '../../types';
import { PlayerUtils } from './PlayerUtils';

export class PlayerLocomotion {
    private player: Player;

    // Configuration
    moveSpeed: number = 5;
    turnSpeed: number = 10;
    gravity: number = -30;
    jumpPower: number = 11;

    // State
    walkTime: number = 0;
    isJumping: boolean = false;
    jumpVelocity: number = 0;
    jumpTimer: number = 0;
    
    previousPosition = new THREE.Vector3();
    velocity = new THREE.Vector3();
    
    lastStepCount: number = 0;
    didStep: boolean = false;

    // Ledge Climbing State
    isLedgeGrabbing: boolean = false;
    ledgeGrabTime: number = 0;
    ledgeStartPos: THREE.Vector3 = new THREE.Vector3();
    ledgeTargetPos: THREE.Vector3 = new THREE.Vector3();

    constructor(player: Player) {
        this.player = player;
        this.previousPosition.copy(player.mesh.position);
    }

    update(dt: number, input: PlayerInput, cameraAngle: number, obstacles: THREE.Object3D[]) {
        // 1. Handle Ground & Gravity
        const pos = this.player.mesh.position;
        // Use getLandingHeight to avoid snapping to overhead obstacles (lintels)
        let groundHeight = PlayerUtils.getLandingHeight(pos, this.player.config, obstacles);
        const waterDepth = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        const isInWater = waterDepth < -0.05;
        
        // Lift character slightly if wearing shoes to accommodate sole thickness
        if (this.player.config.equipment.shoes) {
            groundHeight += 0.015;
        }

        // Calculate Water Resistance Multiplier (1.0 = normal, 0.3 = very slow)
        let waterResistance = 1.0;
        if (isInWater) {
            // max depth is -1.8. normalize current depth (0 to 1)
            const d = Math.abs(waterDepth);
            // Map depth to speed multiplier: 0.1m depth = 0.8x speed, 1.8m depth = 0.3x speed
            waterResistance = THREE.MathUtils.mapLinear(d, 0, 1.8, 0.8, 0.3);
            waterResistance = THREE.MathUtils.clamp(waterResistance, 0.3, 0.8);
        }

        if (this.isJumping) {
            this.jumpVelocity += this.gravity * dt;
            this.player.mesh.position.y += this.jumpVelocity * dt;
            
            // Ledge Detection
            if (this.jumpVelocity > -8) {
                this.checkLedgeGrab(obstacles);
            }

            if (this.player.mesh.position.y <= groundHeight) {
                this.player.mesh.position.y = groundHeight;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
            this.jumpTimer += dt;

        } else {
            // Gravity if falling
            if (this.player.mesh.position.y > groundHeight) {
                this.jumpVelocity += this.gravity * dt;
                this.player.mesh.position.y += this.jumpVelocity * dt;
                if (this.player.mesh.position.y < groundHeight) {
                    this.player.mesh.position.y = groundHeight;
                    this.jumpVelocity = 0;
                }
            } else if (input.jump && !this.player.isPickingUp && !this.player.isSkinning && !this.player.status.isDead) {
                // Initiate Jump
                this.isJumping = true;
                
                // Reduce jump power if in deep water (harder to push off)
                const jumpPowerMod = isInWater ? Math.max(0.4, 1.0 - (Math.abs(waterDepth) * 0.5)) : 1.0;
                this.jumpVelocity = this.jumpPower * jumpPowerMod;
                this.jumpTimer = 0;
            } else {
                this.player.mesh.position.y = groundHeight;
            }
        }

        // Calculate velocity for animation/state
        if (dt > 0) {
            this.velocity.subVectors(this.player.mesh.position, this.previousPosition).divideScalar(dt);
        }
        this.previousPosition.copy(this.player.mesh.position);

        // Ledge Climbing Update
        if (this.isLedgeGrabbing) {
            this.updateClimb(dt);
            return;
        }

        // 2. Handle Movement (if not dead/climbing)
        if (this.player.status.isDead || this.isLedgeGrabbing) return;

        const isMoving = input.x !== 0 || input.y !== 0;
        
        const baseSpeed = input.isRunning ? this.moveSpeed * 1.8 : this.moveSpeed;
        let speedModifier = 1.0;
        
        // Environment Resistance (Bushes/Soft obstacles)
        const playerBox = PlayerUtils.getHitboxBounds(this.player.mesh.position, this.player.config);
        for (const obs of obstacles) {
            if (obs.userData.type === 'soft') {
                const obsBox = new THREE.Box3().setFromObject(obs);
                if (obsBox.intersectsBox(playerBox)) {
                    speedModifier = 0.4;
                    break;
                }
            }
        }
        
        // Combine soft-obstacle resistance with water resistance (take the harshest)
        const finalSpeedModifier = Math.min(speedModifier, waterResistance);
        const finalSpeed = baseSpeed * finalSpeedModifier;

        if (isMoving && !this.player.isPickingUp && !this.player.isSkinning) {
            const targetRotation = cameraAngle + Math.PI;
            let rotDiff = targetRotation - this.player.mesh.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            this.player.mesh.rotation.y += rotDiff * this.turnSpeed * dt;

            const inputLen = Math.sqrt(input.x * input.x + input.y * input.y);
            const normX = input.x / inputLen;
            const normY = -input.y / inputLen;

            const fX = Math.sin(targetRotation); const fZ = Math.cos(targetRotation);
            const rX = Math.sin(targetRotation - Math.PI / 2); const rZ = Math.cos(targetRotation - Math.PI / 2);

            const dx = (fX * normY + rX * normX) * finalSpeed * dt;
            const dz = (fZ * normY + rZ * normX) * finalSpeed * dt;

            const nextPos = this.player.mesh.position.clone();
            nextPos.x += dx;
            nextPos.z += dz;

            if (!PlayerUtils.checkCollision(nextPos, this.player.config, obstacles) && PlayerUtils.isWithinBounds(nextPos)) {
                this.player.mesh.position.copy(nextPos);
            }
        }
    }

    private checkLedgeGrab(obstacles: THREE.Object3D[]) {
        const worldDir = new THREE.Vector3();
        this.player.mesh.getWorldDirection(worldDir); 
        const forward = worldDir.normalize(); 
        
        const bounds = PlayerUtils.getHitboxBounds(this.player.mesh.position, this.player.config);
        const boundsHeight = bounds.max.y - bounds.min.y;
        const rayY = bounds.min.y + boundsHeight * 0.85; 

        const rayOrigin = this.player.mesh.position.clone();
        rayOrigin.y = rayY;

        const raycaster = new THREE.Raycaster(rayOrigin, forward, 0, 0.8);
        const intersects = raycaster.intersectObjects(obstacles);
        
        const hit = intersects.find(i => i.object.userData.type !== 'soft');
        
        if (hit) {
            const block = hit.object;
            const blockBox = new THREE.Box3().setFromObject(block);
            const ledgeTopY = blockBox.max.y;

            if (Math.abs(rayOrigin.y - ledgeTopY) < 0.5) {
                this.isLedgeGrabbing = true;
                this.isJumping = false;
                this.ledgeGrabTime = 0;
                this.ledgeStartPos.copy(this.player.mesh.position);
                this.ledgeTargetPos.set(
                    this.player.mesh.position.x + forward.x * 0.7, 
                    ledgeTopY, 
                    this.player.mesh.position.z + forward.z * 0.7
                );
                const hangOffset = boundsHeight + 0.05;
                this.player.mesh.position.y = ledgeTopY - hangOffset;
                this.ledgeStartPos.y = this.player.mesh.position.y;
            }
        }
    }

    private updateClimb(dt: number) {
        this.ledgeGrabTime += dt;
        const climbDuration = 1.2; 
        const progress = Math.min(this.ledgeGrabTime / climbDuration, 1.0);
        
        if (progress < 0.15) {
            this.player.mesh.position.copy(this.ledgeStartPos);
        } else if (progress < 0.65) {
            const t = (progress - 0.15) / 0.5; 
            const ease = 1 - Math.pow(1 - t, 3); 
            
            this.player.mesh.position.x = this.ledgeStartPos.x;
            this.player.mesh.position.z = this.ledgeStartPos.z;
            this.player.mesh.position.y = THREE.MathUtils.lerp(this.ledgeStartPos.y, this.ledgeTargetPos.y, ease);
        } else {
            const t = (progress - 0.65) / 0.35; 
            const ease = 1 - Math.pow(1 - t, 2); 
            
            this.player.mesh.position.y = this.ledgeTargetPos.y;
            
            const startVec = new THREE.Vector3(this.ledgeStartPos.x, 0, this.ledgeStartPos.z);
            const targetVec = new THREE.Vector3(this.ledgeTargetPos.x, 0, this.ledgeTargetPos.z);
            const currentVec = new THREE.Vector3().lerpVectors(startVec, targetVec, ease);
            
            this.player.mesh.position.x = currentVec.x;
            this.player.mesh.position.z = currentVec.z;
        }

        if (progress >= 1.0) {
            this.player.mesh.position.copy(this.ledgeTargetPos);
            this.isLedgeGrabbing = false;
            this.ledgeGrabTime = 0;
            this.isJumping = false;
            this.jumpVelocity = 0;
        }
    }

    applyForwardImpulse(dt: number, strength: number, obstacles: THREE.Object3D[]) {
        const worldDir = new THREE.Vector3();
        this.player.mesh.getWorldDirection(worldDir);
        const dist = strength * dt;
        const nextPos = this.player.mesh.position.clone();
        nextPos.x += worldDir.x * dist;
        nextPos.z += worldDir.z * dist;
        
        if (!PlayerUtils.checkCollision(nextPos, this.player.config, obstacles) && PlayerUtils.isWithinBounds(nextPos)) {
            this.player.mesh.position.copy(nextPos);
        }
    }
}
