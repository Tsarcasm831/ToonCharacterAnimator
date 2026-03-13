import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class PunchAction {
    static animate(player: any, parts: any, dt: number, damp: number, isMoving: boolean) {
        const combat = player.combat ?? player;
        const t = combat.punchTimer ?? 0;
        const lerp = THREE.MathUtils.lerp;
        const punchDamp = 18 * dt;
        const baseHeight = 0.89 * (player.config.legScale || 1.0);

        const isCombatStance = player.combat?.isCombatStance ?? player.isCombatStance ?? false;
        const isJumping = player.locomotion?.isJumping ?? player.isJumping ?? false;
        const torsoOffset = (isCombatStance && !isMoving && !isJumping) ? 0.3 : 0;

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
                    const oppDir = isRight ? -1 : 1;
                    prox.rotation.x = lerp(prox.rotation.x, curlAmount * 0.6, damp * 2);
                    prox.rotation.z = lerp(prox.rotation.z, 0.3 * oppDir * (curlAmount / 1.8) - (0.2 * oppDir), damp * 2);

                    const dist = prox.children.find((c: any) => c.name === 'distal');
                    if (dist) dist.rotation.x = lerp(dist.rotation.x, curlAmount * 0.8, damp * 2);
                }
            }
        };

        const stepLength1 = 0.2;
        const stepLength2 = 0.25;
        const stepLength3 = 0.3;

        const dur1 = 0.6;
        const dur2 = 1.2;
        const dur3 = 1.8;

        const applyGuard = (isRight: boolean) => {
            const arm = isRight ? parts.rightArm : parts.leftArm;
            const forearm = isRight ? parts.rightForeArm : parts.leftForeArm;
            const hand = isRight ? parts.rightHand : parts.leftHand;
            const mult = isRight ? 1 : -1;

            arm.rotation.x = lerp(arm.rotation.x, -0.8, punchDamp);
            arm.rotation.y = lerp(arm.rotation.y, 0.4 * mult, punchDamp);
            arm.rotation.z = lerp(arm.rotation.z, 0, punchDamp);
            forearm.rotation.x = lerp(forearm.rotation.x, -2.2, punchDamp);
            hand.rotation.y = lerp(hand.rotation.y, isRight ? -Math.PI / 2 : Math.PI / 2, punchDamp);
        };

        if (t < dur1) {
            const p = t / dur1;

            if (p < 0.2) {
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.2, punchDamp);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.6, punchDamp);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -2.0, punchDamp);
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.6 + torsoOffset, punchDamp);
                parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.05, punchDamp);
                applyFist(true, 1.2);
                applyGuard(false);
            } else if (p < 0.7) {
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.5, punchDamp * 1.5);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -0.2, punchDamp * 1.5);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.1, punchDamp * 1.5);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI, punchDamp * 1.5);
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.6 + torsoOffset, punchDamp * 1.5);
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.2, punchDamp);
                parts.hips.position.z = lerp(parts.hips.position.z, stepLength1, punchDamp);
                applyFist(true, 1.8);
                applyGuard(false);
            } else {
                this.recoverToIdle(parts, punchDamp, baseHeight, lerp, torsoOffset);
                applyFist(true, 0.1);
            }
        } else if (t < dur2) {
            const p = (t - dur1) / (dur2 - dur1);

            if (p < 0.2) {
                applyGuard(true);
                parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.2, punchDamp);
                parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.4, punchDamp);
                parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -2.1, punchDamp);
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.7 + torsoOffset, punchDamp);
                applyFist(false, 1.2);
            } else if (p < 0.8) {
                applyGuard(true);
                parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.5, punchDamp * 1.5);
                parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.2, punchDamp * 1.5);
                parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.1, punchDamp * 1.5);
                parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI, punchDamp * 1.5);
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.7 + torsoOffset, punchDamp * 1.5);
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.2, punchDamp);
                parts.hips.position.z = lerp(parts.hips.position.z, stepLength2, punchDamp);
                applyFist(false, 1.8);
            } else {
                this.recoverToIdle(parts, punchDamp, baseHeight, lerp, torsoOffset);
                applyFist(false, 0.1);
            }
        } else {
            const p = (t - dur2) / (dur3 - dur2);

            if (p < 0.25) {
                applyGuard(false);
                parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.25, punchDamp);
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.5, punchDamp);
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.5 + torsoOffset, punchDamp);
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -0.5, punchDamp);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.6, punchDamp);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.8, punchDamp);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, punchDamp);
                applyFist(true, 1.5);
            } else {
                applyGuard(false);
                parts.hips.position.y = lerp(parts.hips.position.y, baseHeight + 0.1, punchDamp);
                parts.hips.position.z = lerp(parts.hips.position.z, stepLength3, punchDamp);
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, -0.4, punchDamp);
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.4 + torsoOffset, punchDamp);
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.9, punchDamp * 1.5);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -0.2, punchDamp * 1.5);
                parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.2, punchDamp);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.0, punchDamp * 1.5);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2 + 2.5, punchDamp * 1.5);
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
        parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, damp);
        parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI / 2, damp);
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, torsoOffset, damp);
        parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0, damp);
        parts.hips.position.z = lerp(parts.hips.position.z, 0, damp);
        parts.hips.position.y = lerp(parts.hips.position.y, baseHeight, damp);
        parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, 0, damp);
        parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, 0, damp);
    }
}
