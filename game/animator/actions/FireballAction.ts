
import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class FireballAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const t = player.fireballTimer;
        const lerp = THREE.MathUtils.lerp;
        const sin = Math.sin;
        const cos = Math.cos;
        
        // Total duration: 0.8s
        // 0.0 - 0.4: Gathering (Summon-like swirl)
        // 0.4 - 0.6: Blast (Forward Thrust)
        // 0.6 - 0.8: Recovery

        // Safe damping to prevent snapping
        const safeDamp = (val: number) => Math.min(val, 1.0);

        if (t < 0.4) {
            // === PHASE 1: GATHERING (Summon-style hands) ===
            const swirlSpeed = 20.0; 
            const radius = 0.15; 
            
            const handX = sin(t * swirlSpeed) * radius;
            const handY = cos(t * swirlSpeed) * radius;

            const gatherDamp = safeDamp(damp * 10);

            const baseHeight = 0.89 * player.config.legScale;
            parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.1, gatherDamp);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0.1, gatherDamp); 
            
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.0, gatherDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.0, gatherDamp);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -0.8 + handY, gatherDamp); 
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.6 + handX, gatherDamp);  
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.8, gatherDamp);         
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.8, gatherDamp); 

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -0.8 - handY, gatherDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.6 + handX, gatherDamp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.8, gatherDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.8, gatherDamp);

            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2 + 0.3, gatherDamp);
            parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI / 2 - 0.3, gatherDamp);
            
            const jitter = sin(t * 50) * 0.005;
            parts.rightHand.position.x = jitter;
            parts.leftHand.position.x = -jitter;

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.1, gatherDamp); 
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0, gatherDamp);

        } else if (t < 0.6) {
            // === PHASE 2: BLAST (Double Palm Thrust) ===
            const thrustDamp = safeDamp(damp * 20);

            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0.2, thrustDamp);
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.2, thrustDamp); 

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.57, thrustDamp); 
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -0.3, thrustDamp); 
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.1, thrustDamp); 
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, 0.0, thrustDamp); 

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.57, thrustDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.3, thrustDamp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.1, thrustDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, 0.0, thrustDamp);

            parts.rightHand.rotation.x = lerp(parts.rightHand.rotation.x, -Math.PI/2, thrustDamp);
            parts.leftHand.rotation.x = lerp(parts.leftHand.rotation.x, -Math.PI/2, thrustDamp);
            
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, 0, thrustDamp); 
            parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, 0, thrustDamp);
            
            parts.rightHand.position.x = 0;
            parts.leftHand.position.x = 0;

        } else {
            // === PHASE 3: RECOVERY ===
            const rDamp = safeDamp(damp * 5);
            
            const baseHeight = 0.89 * player.config.legScale;
            parts.hips.position.y = lerp(parts.hips.position.y, baseHeight, rDamp);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0, rDamp);
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0, rDamp);
            
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0, rDamp);
            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0, rDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, rDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0, rDamp);
            
            parts.rightHand.rotation.x = lerp(parts.rightHand.rotation.x, 0, rDamp);
            parts.leftHand.rotation.x = lerp(parts.leftHand.rotation.x, 0, rDamp);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2, rDamp);
            parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI/2, rDamp);
            
            parts.rightHand.position.x = 0;
            parts.leftHand.position.x = 0;
        }

        playerModelResetFeet(parts, damp);
    }
}
