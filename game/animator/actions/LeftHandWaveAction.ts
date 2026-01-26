
import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class LeftHandWaveAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const t = player.leftHandWaveTimer;
        const lerp = THREE.MathUtils.lerp;
        const sin = Math.sin;
        
        const waveSpeed = 7;
        
        const poseWaveHand = (isRight: boolean) => {
            const fingers = isRight ? player.model.rightFingers : player.model.leftFingers;
            const thumb = isRight ? player.model.rightThumb : player.model.leftThumb;
            const poseDamp = damp * 10;

            if (fingers) {
                fingers.forEach((f: any) => {
                    const prox = f.children.find((c: any) => c.name === 'proximal');
                    if (prox) {
                        prox.rotation.x = lerp(prox.rotation.x, 0.0, poseDamp); // Flat hand
                    }
                });
            }
            if (thumb) {
                const prox = thumb.children.find((c: any) => c.name === 'proximal');
                if (prox) {
                    prox.rotation.x = lerp(prox.rotation.x, 0.1, poseDamp);
                }
            }
        };

        if (t < 0.5) {
            // === PHASE 1: RAISE FOREARM ===
            const raiseDamp = damp * 6;
            
            // Upper Arm: Down and slightly forward/out
            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -0.3, raiseDamp); 
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.4, raiseDamp); 
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.0, raiseDamp);
            
            // Forearm: Bend up 90-100 degrees
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.8, raiseDamp); 
            parts.leftForeArm.rotation.z = lerp(parts.leftForeArm.rotation.z, 0, raiseDamp);
            
            // Hand: Palm forward
            parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI/2, raiseDamp);

            // Look at hand
            parts.head.rotation.y = lerp(parts.head.rotation.y, 0.3, raiseDamp); 
            poseWaveHand(false);

        } else if (t < 2.0) {
            // === PHASE 2: WIPER WAVE ===
            const waveTime = t - 0.5;
            const wave = sin(waveTime * waveSpeed);
            const activeDamp = damp * 10;

            // Stable Upper Arm & Elbow
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.4, activeDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.8, activeDamp);

            // THE WAVE: Rotate Upper Arm Y (Internal/External rotation)
            // This sweeps the vertical forearm left and right
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, wave * 0.6, activeDamp);
            
            // Keep palm facing forward relative to camera/viewer
            parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI/2, activeDamp);

            // Head tracks center
            parts.head.rotation.y = lerp(parts.head.rotation.y, 0.3, damp);
            parts.head.rotation.z = lerp(parts.head.rotation.z, wave * 0.05, damp);
            poseWaveHand(false);

        } else {
            // === PHASE 3: LOWER ===
            const lowerDamp = damp * 6;
            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0, lowerDamp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.15, lowerDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0, lowerDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.15, lowerDamp);
            parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI/2, lowerDamp);
            
            parts.head.rotation.y = lerp(parts.head.rotation.y, 0, lowerDamp);
            parts.head.rotation.z = lerp(parts.head.rotation.z, 0, lowerDamp);
        }
        
        playerModelResetFeet(parts, damp);
    }
}
