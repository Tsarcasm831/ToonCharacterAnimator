
import * as THREE from 'three';

export class FireArrowAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const lerp = THREE.MathUtils.lerp;
        const actionDamp = 15 * dt;

        // --- BODY ALIGNMENT ---
        // Moderate the torso twist. -1.1 (approx 63 deg) instead of -1.4
        // This keeps the character's chest more open towards the target direction.
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -1.1, actionDamp);
        
        // Head looks forward (relative to world)
        parts.neck.rotation.y = lerp(parts.neck.rotation.y, 1.1, actionDamp);
        parts.neck.rotation.x = lerp(parts.neck.rotation.x, -0.05, actionDamp);

        // --- LEFT ARM (Holding Bow) ---
        // Point arm straight forward from the shoulder
        parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.57, actionDamp); 
        // Reduce Y rotation (inward sweep) to 0.1 to push the bow further "out" and forward
        parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.1, actionDamp);
        parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0, actionDamp);

        // Straighten elbow
        parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, 0, actionDamp);
        
        // --- WRIST ROTATION (Vertical Bow Fix) ---
        // Reset X to 0. Keep Y at PI/2 for standard grip.
        // Rotation Z at 0 aligns the bow vertically because BowBuilder rotates it -PI/2 on Z initially.
        parts.leftHand.rotation.x = lerp(parts.leftHand.rotation.x, 0.0, actionDamp);
        parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI / 2, actionDamp);
        parts.leftHand.rotation.z = lerp(parts.leftHand.rotation.z, 0, actionDamp); 

        // --- RIGHT ARM (Drawing String) ---
        if (player.bowState === 'release') {
            const recoilDamp = 20 * dt;
            
            // Quickly pull hand back and slightly out away from the face
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.3, recoilDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.6, recoilDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 0.4, recoilDamp);
            
            // Snap forearm open
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.2, recoilDamp);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, recoilDamp);

        } else {
            // DRAW / HOLD
            const drawProgress = Math.min(1.0, player.bowCharge);
            
            // RIGHT ARM TARGETS
            const startArmX = -1.4;
            const endArmX = -1.57; 
            
            const startArmY = 0.8; 
            const endArmY = 0.1;   
            
            const startArmZ = 0;    
            const endArmZ = 0.6;    // Elbow High
            
            const startElbow = -0.4;
            const endElbow = -2.5; 
            
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, lerp(startArmX, endArmX, drawProgress), actionDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, lerp(startArmY, endArmY, drawProgress), actionDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, lerp(startArmZ, endArmZ, drawProgress), actionDamp);
            
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, lerp(startElbow, endElbow, drawProgress), actionDamp);
            
            // Hand: Grip string
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2, actionDamp);
        }
    }
}
