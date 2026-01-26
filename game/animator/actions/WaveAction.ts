
import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class WaveAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const t = player.waveTimer;
        const lerp = THREE.MathUtils.lerp;
        const sin = Math.sin;
        
        const waveSpeed = 6; 
        
        // --- POSE HELPER ---
        const poseWaveHand = (isRight: boolean) => {
            const fingers = isRight ? player.model.rightFingers : player.model.leftFingers;
            const thumb = isRight ? player.model.rightThumb : player.model.leftThumb;
            const poseDamp = damp * 10;

            if (fingers) {
                fingers.forEach((f: any, i: number) => {
                    const prox = f.children.find((c: any) => c.name === 'proximal');
                    if (prox) {
                        prox.rotation.x = lerp(prox.rotation.x, 0.05, poseDamp); // Open hand
                        // Spread fingers
                        prox.rotation.z = lerp(prox.rotation.z, (i - 1.5) * 0.15, poseDamp);
                    }
                });
            }
            if (thumb) {
                const prox = thumb.children.find((c: any) => c.name === 'proximal');
                if (prox) {
                    const side = isRight ? 1 : -1;
                    prox.rotation.x = lerp(prox.rotation.x, 0.2, poseDamp);
                    prox.rotation.z = lerp(prox.rotation.z, 0.6 * side, poseDamp);
                }
            }
        };

        // SEQUENCED ANIMATION: Raise -> Wave -> Lower
        
        if (t < 0.8) {
            // === PHASE 1: SLOW RAISE (0.8s) ===
            const raiseDamp = damp * 4; // Slow damp

            // Raise Arm High above head
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -0.2, raiseDamp); 
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -2.8, raiseDamp); 
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.0, raiseDamp);
            
            // Forearm Straightens then bends slightly at peak
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.5, raiseDamp); 
            parts.rightForeArm.rotation.z = lerp(parts.rightForeArm.rotation.z, 0, raiseDamp);
            
            // Hand neutral
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2, raiseDamp);
            
            // Look up at hand
            parts.head.rotation.y = lerp(parts.head.rotation.y, -0.4, raiseDamp); 
            parts.head.rotation.x = lerp(parts.head.rotation.x, -0.3, raiseDamp); 
            
            poseWaveHand(true);

        } else if (t < 2.3) {
            // === PHASE 2: WAVE (1.5s) ===
            const waveTime = t - 0.8;
            
            // SHOULDER TWIST WAVE ("Hey over here!")
            // Since arm is vertical, rotating Upper Arm Y spins the forearm/hand face
            const wave = sin(waveTime * waveSpeed);
            const waveDamp = damp * 8;

            // Keep Arm Up
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -2.8, waveDamp);
            
            // The Wave: Rotate shoulder Y
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, wave * 0.5, waveDamp);
            
            // Elbow slightly bent
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.8, waveDamp);
            
            // Wrist stable relative to forearm
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2, waveDamp);

            // Head tracks slight movement
            parts.head.rotation.y = lerp(parts.head.rotation.y, -0.4 + wave * 0.05, waveDamp);
            poseWaveHand(true);

        } else {
            // === PHASE 3: LOWER (0.7s) ===
            const lowerDamp = damp * 5;
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0, lowerDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.2, lowerDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, lowerDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.1, lowerDamp);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2, lowerDamp);
            
            parts.head.rotation.y = lerp(parts.head.rotation.y, 0, lowerDamp);
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0, lowerDamp);
        }
        
        playerModelResetFeet(parts, damp);
    }
}
