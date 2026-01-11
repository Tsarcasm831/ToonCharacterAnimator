
import * as THREE from 'three';

export class FireArrowAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        // State comes from player
        // We expect player.bowState to be 'draw', 'hold', or 'release'
        // or we use player.bowTimer to drive it if it's a fixed animation.
        // Based on typical game logic, it's likely state-driven by input hold.

        const lerp = THREE.MathUtils.lerp;
        const actionDamp = 15 * dt;

        // Default: Draw/Aim pose
        // If we are just entering the state, we might want to blend in.
        
        // --- BODY ALIGNMENT ---
        // Turn torso to the right so left shoulder faces target
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -1.4, actionDamp);
        
        // Head looks forward (relative to world) -> which is Right relative to torso
        parts.neck.rotation.y = lerp(parts.neck.rotation.y, 1.4, actionDamp);
        parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.0, actionDamp);

        // --- LEFT ARM (Holding Bow) ---
        // Extend straight out to the left of the torso (which corresponds to World Forward)
        // Arm raised to shoulder height
        parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.57, actionDamp); // Horizontal
        parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0, actionDamp); // Straight out
        
        // "Forward and In"
        // Y rotation handles the horizontal sweep. 
        // 0.0 is straight left (relative to torso).
        // Positive Y sweeps it "In" (Forward/Right relative to torso facing).
        parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.5, actionDamp);

        // Straighten elbow
        parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, 0, actionDamp);
        
        // Wrist adjust
        // Maintain consistent grip with Idle (y = Math.PI/2)
        // Correct tilt: The bow tips forward slightly with 0 Z. 
        // We add a small offset to Z to pull it back to vertical.
        parts.leftHand.rotation.x = lerp(parts.leftHand.rotation.x, 0, actionDamp);
        parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI/2, actionDamp);
        parts.leftHand.rotation.z = lerp(parts.leftHand.rotation.z, -0.3, actionDamp); // Tilt back to vertical


        // --- RIGHT ARM (Drawing String) ---
        // High elbow, hand near cheek
        
        // If we are in 'release' phase (just fired), the arm flies back
        if (player.bowState === 'release') {
            const recoilDamp = 25 * dt;
            
            // Arm flies back (Extension)
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.4, recoilDamp); // Still horizontal-ish
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.5, recoilDamp); // Open up
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 0.5, recoilDamp); // Fly back
            
            // Forearm extends
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.5, recoilDamp);

        } else {
            // DRAW / HOLD
            
            // Calculate draw progress (0.0 to 1.0)
            // We use bowCharge which is already updated in PlayerCombat
            const drawProgress = Math.min(1.0, player.bowCharge);
            
            // RIGHT ARM ANIMATION (Reach -> Draw)
            // 0.0 (Reach): Hand forward near bow string
            // 1.0 (Draw): Hand back at cheek
            
            // Define Keyframes
            const startArmX = -1.4; // Slightly down from horizontal
            const endArmX = -1.5;   // Horizontal
            
            const startArmY = 0.8;  // Reaching across to left
            const endArmY = 0.2;    // Pulled back
            
            const startArmZ = 0;    // Neutral
            const endArmZ = 0.5;    // Elbow up/out
            
            const startElbow = -0.4; // Extended
            const endElbow = -2.6;   // Deep bend
            
            // Blend Targets
            const targetArmX = lerp(startArmX, endArmX, drawProgress);
            const targetArmY = lerp(startArmY, endArmY, drawProgress);
            const targetArmZ = lerp(startArmZ, endArmZ, drawProgress);
            const targetElbow = lerp(startElbow, endElbow, drawProgress);

            // Apply with damping for smoothness
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, targetArmX, actionDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, targetArmY, actionDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, targetArmZ, actionDamp);
            
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, targetElbow, actionDamp);
            
            // Hand: Grip string
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, Math.PI/2, actionDamp);
        }
    }
}
