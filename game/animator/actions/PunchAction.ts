import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class PunchAction {
    static animate(player: any, parts: any, dt: number, damp: number, isMoving: boolean) {
        const combat = player.combat ?? player;
        const t = combat.punchTimer ?? 0;
        const lerp = THREE.MathUtils.lerp;
        
        // Increased damping slightly for snappier hits, but smoother recovery
        const punchDamp = 18 * dt; 
        const baseHeight = 0.89 * (player.config.legScale || 1.0);
        
        const isCombatStance = player.combat?.isCombatStance ?? player.isCombatStance ?? false;
        const isJumping = player.locomotion?.isJumping ?? player.isJumping ?? false;
        // Reduce offset; too much twist breaks the hip-to-leg visual connection
        const torsoOffset = (isCombatStance && !isMoving && !isJumping) ? 0.3 : 0;

        // === FIST HELPER ===
        const applyFist = (isRight: boolean, curlAmount: number) => {
            const fingers = isRight ? player.model.rightFingers : player.model.leftFingers;
            const thumb = isRight ? player.model.rightThumb : player.model.leftThumb;

            if (fingers) {
                fingers.forEach((fGroup: THREE.Group, i: number) => {
                    const prox = fGroup.children.find(c => c.name === 'proximal');
                    if (prox) {
                        prox.rotation.x = lerp(prox.rotation.x, curlAmount + (i * 0.1), damp * 2);
                        const dist = prox.children.find(c => c.name === 'distal');
                        if (dist) dist.rotation.x = lerp(dist.rotation.x, curlAmount * 1.2, damp * 2);
                    }
                });
            }

            if (thumb) {
                const prox = thumb.children.find((c: any) => c.name === 'proximal');
                if (prox) {
                    prox.rotation.x = lerp(prox.rotation.x, curlAmount * 0.6, damp * 2);
                    const sideMult = isRight ? 1 : -1;
                    const oppDir = isRight ? -1 : 1;
                    prox.rotation.z = lerp(prox.rotation.z, 0.3 * oppDir * (curlAmount / 1.8) - (0.2 * oppDir), damp * 2);

                    const dist = prox.children.find((c: any) => c.name === 'distal');
                    if (dist) dist.rotation.x = lerp(dist.rotation.x, curlAmount * 0.8, damp * 2);
                }
            }
        };

        // Reduced forward lunge to prevent leg snapping
        const stepLength1 = 0.2; 
        const stepLength2 = 0.25;
        const stepLength3 = 0.3;

        const dur1 = 0.6;
        const dur2 = 1.2;
        const dur3 = 1.8;

        // === GUARD POSE HELPER ===
        // Keeps the non-punching hand tight to the face
        const applyGuard = (isRight: boolean) => {
            const arm = isRight ? parts.rightArm : parts.leftArm;
            const forearm = isRight ? parts.rightForeArm : parts.leftForeArm;
            const hand = isRight ? parts.rightHand : parts.leftHand;
            const mult = isRight ? 1 : -1;

            arm.rotation.x = lerp(arm.rotation.x, -0.8, punchDamp); // Upper arm down/forward
            arm.rotation.y = lerp(arm.rotation.y, 0.4 * mult, punchDamp); // Elbow in
            arm.rotation.z = lerp(arm.rotation.z, 0, punchDamp);
            
            forearm.rotation.x = lerp(forearm.rotation.x, -2.2, punchDamp); // Forearm vertical
            hand.rotation.y = lerp(hand.rotation.y, isRight ? -Math.PI/2 : Math.PI/2, punchDamp); // Palm in
        };

        // ============================
        // PUNCH 1: RIGHT STRAIGHT (Cross)
        // ============================
        if (t < dur1) {
            const p = t / dur1;
            
            if (p < 0.2) {
                // WINDUP
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.2, punchDamp);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.6, punchDamp); // Elbow back
                
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -2.0, punchDamp);
                
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.6 + torsoOffset, punchDamp);
                parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.05, punchDamp);
                
                applyFist(true, 1.2);
                applyGuard(false); // Left hand guards

            } else if (p < 0.7) {
                // STRIKE
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.5, punchDamp * 1.5); // Shoulder height
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -0.2, punchDamp * 1.5); // Center
                
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.1, punchDamp * 1.5); // Extend
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI, punchDamp * 1.5); // Pronate

                // Torso Twist generates the reach, not hip movement
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.6 + torsoOffset, punchDamp * 1.5);
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.2, punchDamp); // Lean into it

                parts.hips.position.z = lerp(parts.hips.position.z, stepLength1, punchDamp);
                
                applyFist(true, 1.8);
                applyGuard(false);

            } else {
                // RECOVERY
                this.recoverToIdle(parts, punchDamp, baseHeight, lerp, torsoOffset);
                applyFist(true, 0.1);
            }

        // ============================
        // PUNCH 2: LEFT CROSS (Follow up)
        // ============================
        } else if (t < dur2) {
            const p = (t - dur1) / (dur2 - dur1);

            if (p < 0.2) {
                // WINDUP LEFT / RETRACT RIGHT
                applyGuard(true); // Pull right hand back to face immediately

                // Cock Left Arm - Keep elbow tighter (less than -0.8y)
                parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.2, punchDamp);
                parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.4, punchDamp); // Less flare
                parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -2.1, punchDamp);

                // Twist Torso Right to load power
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.7 + torsoOffset, punchDamp);
                
                applyFist(false, 1.2);

            } else if (p < 0.8) {
                // STRIKE LEFT
                applyGuard(true); // Ensure right stays guarding

                parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.5, punchDamp * 1.5);
                parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.2, punchDamp * 1.5); // Angle slightly in
                
                // Full Extension
                parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.1, punchDamp * 1.5);
                parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI, punchDamp * 1.5); // Pronate

                // Drive Torso Left
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.7 + torsoOffset, punchDamp * 1.5);
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.2, punchDamp);

                parts.hips.position.z = lerp(parts.hips.position.z, stepLength2, punchDamp);

                applyFist(false, 1.8);

            } else {
                this.recoverToIdle(parts, punchDamp, baseHeight, lerp, torsoOffset);
                applyFist(false, 0.1);
            }

        // ============================
        // PUNCH 3: RIGHT UPPERCUT (Finisher)
        // ============================
        } else {
            const p = (t - dur2) / (dur3 - dur2);

            if (p < 0.25) {
                // WINDUP (Drop & Load)
                applyGuard(false); // Left hand guards

                // Dip Body
                parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.25, punchDamp); // Deep squat
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.5, punchDamp); // Lean forward
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.5 + torsoOffset, punchDamp); // Twist right

                // Load Right Arm (Low and Tight)
                // PREVIOUS BUG: rotation.x was 0.5 (backward). 
                // FIX: Keep it tucked (-0.5) near ribs.
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -0.5, punchDamp); 
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.6, punchDamp); 
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.8, punchDamp);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2, punchDamp); // Neutral fist

                applyFist(true, 1.5);

            } else {
                // STRIKE UPPERCUT
                applyGuard(false);

                // Body Rise
                parts.hips.position.y = lerp(parts.hips.position.y, baseHeight + 0.1, punchDamp); // Jump slightly
                parts.hips.position.z = lerp(parts.hips.position.z, stepLength3, punchDamp);
                
                // Torso Arch
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, -0.4, punchDamp); // Arch back
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.4 + torsoOffset, punchDamp); // Twist left

                // Arm Skyward
                // PREVIOUS BUG: rotation.x was -2.3 (Overhead). 
                // FIX: -1.9 is high, but keeps it in front of the face/chin.
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.9, punchDamp * 1.5); 
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -0.2, punchDamp * 1.5); // Center line
                parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.2, punchDamp);

                // Keep elbow bent! An uppercut with straight arm is just a lift.
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.0, punchDamp * 1.5); 
                
                // Supinate (Palm to face)
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2 + 2.5, punchDamp * 1.5); 
                
                applyFist(true, 1.8);
            }
        }
        
        playerModelResetFeet(parts, damp);
    }

    private static recoverToIdle(parts: any, damp: number, baseHeight: number, lerp: any, torsoOffset: number) {
        parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0, damp);
        parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0, damp);
        
        parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, damp);
        parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0, damp);
        parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 0, damp);
        parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0, damp);

        parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, 0, damp);
        parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, 0, damp);

        parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI/2, damp);
        parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI/2, damp);
        
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0 + torsoOffset, damp);
        parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0, damp);
        parts.hips.position.z = lerp(parts.hips.position.z, 0, damp);
        parts.hips.position.y = lerp(parts.hips.position.y, baseHeight, damp);
        parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, 0, damp);
        parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, 0, damp);
    }
}