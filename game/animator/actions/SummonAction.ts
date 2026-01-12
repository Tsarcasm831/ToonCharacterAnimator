
import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class SummonAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const t = player.summonTimer;
        const lerp = THREE.MathUtils.lerp;
        const sin = Math.sin;
        const cos = Math.cos;

        // Total Duration: 3.0s
        // 0.0 - 1.3: Gathering Energy
        // 1.3 - 1.6: Windup
        // 1.6 - 1.9: Slam (Impact)
        // 1.9 - 3.0: Recovery

        // Safe damping helper to prevent overshoots (teleporting)
        const safeDamp = (val: number) => Math.min(val, 1.0);

        if (t < 1.3) {
            // === PHASE 1: GATHERING ENERGY ===
            const p = t / 1.3;
            const circleSpeed = 8.0; 
            const radius = 0.2;
            
            const handX = sin(t * circleSpeed) * radius;
            const handY = cos(t * circleSpeed) * radius;

            const gatherDamp = safeDamp(damp * 5);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -0.8 + handY, gatherDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.5 + handX, gatherDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.5, gatherDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.8, gatherDamp);

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -0.8 - handY, gatherDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.5 + handX, gatherDamp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.5, gatherDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.8, gatherDamp);

            parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, 0, gatherDamp);
            parts.leftHand.rotation.z = lerp(parts.leftHand.rotation.z, 0, gatherDamp);

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.3, damp * 3);
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0.2, damp * 3);

        } else if (t < 1.6) {
            // === PHASE 2: WINDUP ===
            const windupDamp = safeDamp(damp * 12);

            const baseHeight = 0.89 * player.config.legScale;
            parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.2, windupDamp);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -2.8, windupDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 0.2, windupDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.0, windupDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.5, windupDamp);

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -0.5, windupDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.5, windupDamp);

            parts.head.rotation.x = lerp(parts.head.rotation.x, -0.5, windupDamp);

        } else if (t < 1.9) {
            // === PHASE 3: IMPACT ===
            // Use safeDamp to clamp value to 1.0 max to prevent teleporting below ground
            const slamDamp = safeDamp(damp * 20); 

            const baseHeight = 0.89 * player.config.legScale;
            const crouchHeight = baseHeight * 0.4;
            
            parts.hips.position.y = lerp(parts.hips.position.y, crouchHeight, slamDamp);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0.4, slamDamp);

            parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, -2.0, slamDamp);
            parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, -2.0, slamDamp);
            parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, 2.3, slamDamp);
            parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, 2.3, slamDamp);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0.8, slamDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.5, slamDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.2, slamDamp);
            
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, slamDamp);
            parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, -0.2, slamDamp);

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0.5, slamDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.5, slamDamp);

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.5, slamDamp);

        } else {
            // === PHASE 4: RECOVERY ===
            const recoverDamp = safeDamp(damp * 4);
            const baseHeight = 0.89 * player.config.legScale;

            parts.hips.position.y = lerp(parts.hips.position.y, baseHeight, recoverDamp);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0, recoverDamp);
            
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0, recoverDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0, recoverDamp);

            parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, 0, recoverDamp);
            parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, 0, recoverDamp);
            parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, 0, recoverDamp);
            parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, 0, recoverDamp);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0, recoverDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.1, recoverDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, recoverDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.1, recoverDamp);
            
            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0, recoverDamp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.1, recoverDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0, recoverDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.1, recoverDamp);

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0, recoverDamp);
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0, recoverDamp);
        }

        playerModelResetFeet(parts, damp);
    }
}
