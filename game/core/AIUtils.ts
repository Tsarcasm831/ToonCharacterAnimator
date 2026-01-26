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
     * Uses a multi-ray sensor system to find the best path.
     */
    static getAdvancedAvoidanceSteering(
        currentPos: THREE.Vector3,
        rotationY: number,
        collisionSize: THREE.Vector3,
        obstacles: THREE.Object3D[],
        lookAheadDist: number = 3.0
    ): number {
        // Multi-ray sensor array - wider coverage
        const sensorAngles = [
            0,           // Forward
            Math.PI / 6, // 30° left
            -Math.PI / 6, // 30° right
            Math.PI / 4, // 45° left
            -Math.PI / 4  // 45° right
        ];
        
        const forward = new THREE.Vector3(Math.sin(rotationY), 0, Math.cos(rotationY));
        
        // Check if forward path is clear
        const forwardCheck = currentPos.clone().add(forward.multiplyScalar(lookAheadDist));
        if (!PlayerUtils.checkBoxCollision(forwardCheck, collisionSize, obstacles)) {
            return rotationY;
        }
        
        // Find best alternative direction
        let bestDirection = rotationY;
        let bestScore = Infinity;
        
        for (const angleOffset of sensorAngles) {
            const testRotation = rotationY + angleOffset;
            const testDirection = new THREE.Vector3(Math.sin(testRotation), 0, Math.cos(testRotation));
            const testPos = currentPos.clone().add(testDirection.multiplyScalar(lookAheadDist));
            
            // Score based on collision and direction preference
            const hasCollision = PlayerUtils.checkBoxCollision(testPos, collisionSize, obstacles);
            const directionCost = Math.abs(angleOffset); // Prefer smaller turns
            
            const score = hasCollision ? 1000 : directionCost;
            
            if (score < bestScore) {
                bestScore = score;
                bestDirection = testRotation;
            }
        }
        
        return bestDirection;
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
