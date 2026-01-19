import * as THREE from 'three';
import { PlayerUtils } from '../player/PlayerUtils';

export class AIUtils {
    /**
     * Smoothly interpolates rotation towards a target direction.
     * Prevents rapid snapping and jitter.
     */
    static smoothLookAt(currentRotation: number, targetPos: THREE.Vector3, currentPos: THREE.Vector3, dt: number, lerpSpeed: number = 5.0): number {
        const toTarget = new THREE.Vector3().subVectors(targetPos, currentPos);
        toTarget.y = 0;
        if (toTarget.length() < 0.01) return currentRotation;

        const targetRotation = Math.atan2(toTarget.x, toTarget.z);
        let diff = targetRotation - currentRotation;
        
        // Normalize angle difference to [-PI, PI]
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        return currentRotation + diff * Math.min(1.0, lerpSpeed * dt);
    }

    /**
     * Checks for collisions in front of the entity and suggests a steering direction if blocked.
     * Simple ray-casting approach to "peek" ahead.
     */
    static getAvoidanceSteering(
        currentPos: THREE.Vector3,
        rotationY: number,
        collisionSize: THREE.Vector3,
        obstacles: THREE.Object3D[],
        lookAheadDist: number = 2.0
    ): number {
        const forward = new THREE.Vector3(Math.sin(rotationY), 0, Math.cos(rotationY));
        const checkPos = currentPos.clone().add(forward.multiplyScalar(lookAheadDist));

        if (PlayerUtils.checkBoxCollision(checkPos, collisionSize, obstacles)) {
            // Collision ahead! Try to steer left or right
            const leftRot = rotationY + Math.PI / 4;
            const rightRot = rotationY - Math.PI / 4;
            
            const leftPos = currentPos.clone().add(new THREE.Vector3(Math.sin(leftRot), 0, Math.cos(leftRot)).multiplyScalar(lookAheadDist));
            const rightPos = currentPos.clone().add(new THREE.Vector3(Math.sin(rightRot), 0, Math.cos(rightRot)).multiplyScalar(lookAheadDist));

            const leftBlocked = PlayerUtils.checkBoxCollision(leftPos, collisionSize, obstacles);
            const rightBlocked = PlayerUtils.checkBoxCollision(rightPos, collisionSize, obstacles);

            if (!leftBlocked) return leftRot;
            if (!rightBlocked) return rightRot;
            
            // Both blocked? Try a wider turn
            return rotationY + Math.PI / 2;
        }

        return rotationY;
    }

    /**
     * Calculates the next position with collision detection and basic sliding.
     */
    static getNextPosition(
        currentPos: THREE.Vector3,
        rotationY: number,
        speed: number,
        dt: number,
        collisionSize: THREE.Vector3,
        obstacles: THREE.Object3D[]
    ): THREE.Vector3 {
        const moveStep = speed * dt;
        const velocity = new THREE.Vector3(Math.sin(rotationY), 0, Math.cos(rotationY)).multiplyScalar(moveStep);
        
        // Try full movement
        let nextPos = currentPos.clone().add(velocity);
        if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, collisionSize, obstacles)) {
            return nextPos;
        }

        // Try sliding on X
        const nextPosX = currentPos.clone().add(new THREE.Vector3(velocity.x, 0, 0));
        if (PlayerUtils.isWithinBounds(nextPosX) && !PlayerUtils.checkBoxCollision(nextPosX, collisionSize, obstacles)) {
            return nextPosX;
        }

        // Try sliding on Z
        const nextPosZ = currentPos.clone().add(new THREE.Vector3(0, 0, velocity.z));
        if (PlayerUtils.isWithinBounds(nextPosZ) && !PlayerUtils.checkBoxCollision(nextPosZ, collisionSize, obstacles)) {
            return nextPosZ;
        }

        // Stuck
        return currentPos.clone();
    }
}
