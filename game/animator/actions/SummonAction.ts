
import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class SummonAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const t = player.summonTimer;
        const lerp = THREE.MathUtils.lerp;
        const sin = Math.sin;
        const cos = Math.cos;

        // Phases:
        // 0.0 - 1.2: Handsigns (Bringing hands together and performing signs)
        // 1.2 - 1.5: Crouch down quickly
        // 1.5 - 1.8: Slam palm to ground
        // 1.8 - 2.5: Recover to idle

        if (t < 1.2) {
            // === PHASE 1: HANDSIGNS ===
            const p = t / 1.2;
            const signSpeed = 25;
            const signWave = sin(t * signSpeed);

            // Bring hands together in front of chest
            const targetArmX = -0.5;
            const targetArmZ = 0.5; // Arms inward

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, targetArmX, damp * 5);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -targetArmZ, damp * 5);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.4, damp * 5);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.8 + signWave * 0.1, damp * 10);

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, targetArmX, damp * 5);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, targetArmZ, damp * 5);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.4, damp * 5);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.8 - signWave * 0.1, damp * 10);

            // Head slight bow
            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.2, damp * 5);
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0.3, damp * 5);

        } else if (t < 1.5) {
            // === PHASE 2: QUICK CROUCH ===
            const p = (t - 1.2) / 0.3;
            const baseHeight = 0.89 * player.config.legScale;
            const crouchHeight = baseHeight * 0.4;
            
            parts.hips.position.y = lerp(parts.hips.position.y, crouchHeight, damp * 15);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0.6, damp * 15);

            // Legs buckling
            parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, -2.0, damp * 15);
            parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, -2.0, damp * 15);
            parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, 2.2, damp * 15);
            parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, 2.2, damp * 15);

            // Right arm ready to strike
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -0.2, damp * 15);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.2, damp * 15);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.2, damp * 15);

        } else if (t < 1.8) {
            // === PHASE 3: GROUND SLAM ===
            const p = (t - 1.5) / 0.3;
            const slamDamp = damp * 20;

            // Slam right arm down
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 1.2, slamDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.4, slamDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.1, slamDamp);
            
            // Hand rotation to flat palm
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, slamDamp);
            parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, -0.5, slamDamp);

            // Torso lean into slam
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.4, slamDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.3, slamDamp);

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.4, slamDamp); // Look at ground

        } else {
            // === PHASE 4: RECOVERY ===
            const p = (t - 1.8) / 0.7;
            const recoverDamp = damp * 5;
            const baseHeight = 0.89 * player.config.legScale;

            parts.hips.position.y = lerp(parts.hips.position.y, baseHeight, recoverDamp);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0, recoverDamp);
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0, recoverDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0, recoverDamp);

            parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, 0, recoverDamp);
            parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, 0, recoverDamp);
            parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, 0, recoverDamp);
            parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, 0, recoverDamp);

            parts.rightArm.rotation.set(0, 0, -0.15);
            parts.rightForeArm.rotation.x = -0.15;
            parts.rightHand.rotation.set(0, -Math.PI / 2, 0);

            parts.leftArm.rotation.set(0, 0, 0.15);
            parts.leftForeArm.rotation.x = -0.15;
        }

        playerModelResetFeet(parts, damp);
    }
}
