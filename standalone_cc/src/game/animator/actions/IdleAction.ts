
import * as THREE from 'three';
import { playerModelResetFeet, animateBreathing, applyFootRot } from '../AnimationUtils';

export class IdleAction {
    static animate(player: any, parts: any, damp: number, skipRightArm: boolean = false) {
        const t = player.locomotion?.walkTime ?? (Date.now() * 0.002);
        const isMale = player.config.bodyType === 'male';
        const isCombatStance = player.combat?.isCombatStance ?? player.isCombatStance ?? false;
        const isCrouching = player.locomotion?.isCrouching ?? false;
        
        // 1. Update walkTime if in locomotion (for seamless transitions)
        if (player.locomotion) {
            // Smoothly decay walkTime or keep it for breathing sync
        }

        // Breathing Effect
        animateBreathing(player, parts, t, 1.0);

        if (isCombatStance) {
            this.animateCombatStance(player, parts, damp, t, skipRightArm);
            return;
        }

        const lerp = THREE.MathUtils.lerp;
        const baseHeight = 0.89 * player.config.legScale;
        let targetHeight = baseHeight;
        
        let thighBend = 0;
        let shinBend = 0;
        let torsoBend = 0;
        let headBend = 0;

        if (isCrouching) {
             targetHeight -= 0.35;
             thighBend = -1.2; // Legs forward/up
             shinBend = 2.2;   // Knees bent back
             torsoBend = 0.5;  // Lean forward
             headBend = -0.4;  // Look up slightly to compensate for lean
        }
        
        parts.hips.position.x = lerp(parts.hips.position.x, 0, damp);
        parts.hips.position.z = lerp(parts.hips.position.z, 0, damp);
        parts.hips.rotation.set(0, 0, 0);
        
        parts.hips.position.y = lerp(parts.hips.position.y, targetHeight, damp);
        
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0, damp);
        parts.torsoContainer.rotation.z = lerp(parts.torsoContainer.rotation.z, 0, damp);
        parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, Math.sin(t) * 0.02 + torsoBend, damp);

        parts.neck.rotation.y = lerp(parts.neck.rotation.y, 0, damp);
        parts.neck.rotation.x = -Math.sin(t) * 0.02 + (isCrouching ? 0.2 : 0);
        parts.head.rotation.x = 0.1 + Math.sin(t - 1) * 0.02 + headBend;
        
        // Leg Splay
        const spread = isMale ? 0.15 : 0.12;
        parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, thighBend, damp);
        parts.leftThigh.rotation.y = 0;
        parts.leftThigh.rotation.z = spread;

        parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, thighBend, damp);
        parts.rightThigh.rotation.y = 0;
        parts.rightThigh.rotation.z = -spread;
        
        parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, shinBend, damp);
        parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, shinBend, damp);
        
        // Feet Compensation
        applyFootRot(parts.leftShin, isCrouching ? -0.5 : 0, -spread);
        applyFootRot(parts.rightShin, isCrouching ? -0.5 : 0, spread);
        
        this.animateArmsIdle(player, parts, damp, t, skipRightArm);
    }

    private static animateCombatStance(player: any, parts: any, damp: number, t: number, skipRightArm: boolean) {
        const lerp = THREE.MathUtils.lerp;
        const baseHeight = 0.89 * player.config.legScale;
        
        parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.12, damp);
        parts.hips.position.x = lerp(parts.hips.position.x, 0, damp);
        parts.hips.position.z = lerp(parts.hips.position.z, -0.05, damp);
        
        parts.hips.rotation.y = lerp(parts.hips.rotation.y, -0.7, damp);
        parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0.1, damp); 
        parts.hips.rotation.z = lerp(parts.hips.rotation.z, 0, damp);
        
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.7, damp);
        parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.05, damp);
        parts.torsoContainer.rotation.z = lerp(parts.torsoContainer.rotation.z, 0, damp);

        parts.neck.rotation.y = lerp(parts.neck.rotation.y, 0.2, damp);
        parts.head.rotation.y = lerp(parts.head.rotation.y, 0, damp);

        // LEFT LEG (Forward Leg)
        parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, -0.7, damp);
        const lThighZ = 0.45; 
        parts.leftThigh.rotation.z = lerp(parts.leftThigh.rotation.z, lThighZ, damp); 
        parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, 0.8, damp);
        
        // RIGHT LEG (Rear Leg)
        parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, 0.35, damp);
        const rThighZ = -0.3;
        parts.rightThigh.rotation.z = lerp(parts.rightThigh.rotation.z, rThighZ, damp); 
        parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, 0.15, damp); 

        // Compensate feet tilt for combat stance spread
        applyFootRot(parts.leftShin, -0.6, -lThighZ); 
        applyFootRot(parts.rightShin, -0.15, -rThighZ); 

        const breathing = Math.sin(t * 3) * 0.05; 
        
        parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -0.9 + breathing, damp);
        parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.4, damp);
        parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0, damp);
        parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.8, damp); 
        parts.leftHand.rotation.z = lerp(parts.leftHand.rotation.z, -0.2, damp);

        if (!skipRightArm) {
             parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.2 + breathing, damp);
             parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.4, damp);
             parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 0, damp);
             parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -2.1, damp); 
        }
    }

    private static animateArmsIdle(player: any, parts: any, damp: number, t: number, skipRightArm: boolean) {
        const lerp = THREE.MathUtils.lerp;
        const holdingItem = player.config.selectedItem;
        const isBow = holdingItem === 'Bow';
        const stance = player.config.weaponStance;

        // LEFT ARM LOGIC
        if (isBow) {
            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -0.3, damp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.5, damp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.2, damp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.4, damp);
            parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI/2, damp);
        } else {
            // Default and Staff relaxed pose
            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, Math.sin(t)*0.03, damp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0, damp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.15, damp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.15, damp);
            parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI / 2, damp);
            parts.leftHand.rotation.z = lerp(parts.leftHand.rotation.z, 0, damp);
        }

        if (skipRightArm) return;

        // RIGHT ARM LOGIC
        if (holdingItem) {
             if (isBow) {
                 parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, Math.sin(t+1)*0.03, damp);
                 parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, damp);
                 parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.15, damp);
                 parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.15, damp);
                 parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, damp);
                 parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, 0, damp);
             } else if (stance === 'shoulder') {
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -0.5 + Math.sin(t)*0.03, damp);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, damp);
                parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.1, damp);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -2.2, damp);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, damp);
                parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, 0, damp);
            } else {
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0.2, damp);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, damp);
                parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.2, damp);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.3, damp);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -1.2, damp);
                parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, -0.3, damp);
            }
        } else {
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, damp);
            parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, 0, damp);
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, Math.sin(t + 1)*0.03, damp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, damp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.15, damp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.15, damp);
        }
    }
}
