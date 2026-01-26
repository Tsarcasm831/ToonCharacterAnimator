
import * as THREE from 'three';

export class FireArrowAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const lerp = THREE.MathUtils.lerp;
        const actionDamp = 15 * dt;
        const combat = player.combat ?? player;
        const bowState = combat.bowState ?? 'draw';
        const bowCharge = combat.bowCharge ?? 0;

        // --- BODY ALIGNMENT ---
        // Torso Twist: Turn sideways (-1.2 rad approx 70 deg) to present profile to target
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -1.2, actionDamp);
        
        // Head looks forward (relative to world)
        // Counter-rotate neck to face the original forward direction (1.2 cancels -1.2)
        parts.neck.rotation.y = lerp(parts.neck.rotation.y, 1.2, actionDamp);
        // Tilt head slightly down and into the arrow for aiming
        parts.neck.rotation.x = lerp(parts.neck.rotation.x, -0.1, actionDamp);
        parts.head.rotation.z = lerp(parts.head.rotation.z, -0.1, actionDamp); // Tilt ear towards shoulder

        // --- LEFT ARM (Holding Bow) ---
        // Point arm straight forward from the shoulder
        parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.57, actionDamp); 
        // Adjust Y to account for shoulder socket position so bow aligns with center line
        parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.15, actionDamp);
        parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0, actionDamp);

        // Straighten elbow (locked out for stability)
        parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, 0, actionDamp);
        
        // --- WRIST ROTATION (Vertical Bow Fix) ---
        parts.leftHand.rotation.x = lerp(parts.leftHand.rotation.x, 0.0, actionDamp);
        parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI / 2, actionDamp);
        parts.leftHand.rotation.z = lerp(parts.leftHand.rotation.z, 0, actionDamp); 

        // --- RIGHT ARM (Drawing String) ---
        if (bowState === 'release') {
            const recoilDamp = 25 * dt;
            
            // RECOIL: Hand flies back past the ear
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.5, recoilDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -0.3, recoilDamp); // Open chest further
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 1.4, recoilDamp); // Keep elbow high
            
            // Forearm snaps open slightly
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.5, recoilDamp);
            
            // Hand relaxes
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, recoilDamp);

        } else {
            // DRAW / HOLD
            const drawProgress = Math.min(1.0, bowCharge);
            
            // START POSE (Grabbing String):
            // Arm must reach across chest towards left hand.
            const startArmX = -1.45; 
            const startArmY = 1.0;  // Reach Left (Across chest)
            const startArmZ = 0.0;  // Neutral elevation
            const startElbow = -0.5; // Slight bend
            
            // END POSE (Full Draw Anchor):
            // Hand at cheek, Elbow high and back.
            const endArmX = -1.57; // Shoulder height
            const endArmY = -0.2;  // Pulled back (Right) relative to twisted torso
            const endArmZ = 1.35;  // High Elbow (Abducted)
            const endElbow = -2.65; // Deep flexion to bring hand to face
            
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, lerp(startArmX, endArmX, drawProgress), actionDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, lerp(startArmY, endArmY, drawProgress), actionDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, lerp(startArmZ, endArmZ, drawProgress), actionDamp);
            
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, lerp(startElbow, endElbow, drawProgress), actionDamp);
            
            // Hand: Grip string (Pronated/Neutral)
            // Adjust rotation to align fingers with string
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2 - 0.2, actionDamp);
            parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, 0.2, actionDamp);
        }
    }
}
