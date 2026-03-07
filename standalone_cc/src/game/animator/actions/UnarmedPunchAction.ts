import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class UnarmedPunchAction {
    static animate(player: any, parts: any, dt: number, damp: number, isMoving: boolean) {
        const combat = player.combat ?? player;
        const t = combat.punchTimer ?? 0;
        const variant = combat.punchVariant ?? 'cross';
        const lerp = THREE.MathUtils.lerp;
        const actionDamp = Math.max(damp, 16 * dt);
        const baseHeight = 0.89 * (player.config.legScale || 1.0);
        const guardOffset = isMoving ? 0 : 0.12;

        const setFist = (isRight: boolean, curl: number) => {
            const fingers = isRight ? player.model.rightFingers : player.model.leftFingers;
            const thumb = isRight ? player.model.rightThumb : player.model.leftThumb;
            if (fingers) {
                fingers.forEach((fGroup: THREE.Group, i: number) => {
                    const prox = fGroup.children.find(c => c.name === 'proximal');
                    if (prox) {
                        prox.rotation.x = lerp(prox.rotation.x, curl + (i * 0.08), actionDamp);
                        const dist = prox.children.find(c => c.name === 'distal');
                        if (dist) dist.rotation.x = lerp(dist.rotation.x, curl * 1.05, actionDamp);
                    }
                });
            }
            if (thumb) {
                const prox = thumb.children.find((c: any) => c.name === 'proximal');
                if (prox) {
                    const dir = isRight ? -1 : 1;
                    prox.rotation.x = lerp(prox.rotation.x, curl * 0.45, actionDamp);
                    prox.rotation.z = lerp(prox.rotation.z, dir * (0.14 + curl * 0.08), actionDamp);
                }
            }
        };

        const guardHand = (isRight: boolean) => {
            const arm = isRight ? parts.rightArm : parts.leftArm;
            const foreArm = isRight ? parts.rightForeArm : parts.leftForeArm;
            const hand = isRight ? parts.rightHand : parts.leftHand;
            const dir = isRight ? 1 : -1;
            arm.rotation.x = lerp(arm.rotation.x, -0.75, actionDamp);
            arm.rotation.y = lerp(arm.rotation.y, 0.28 * dir, actionDamp);
            arm.rotation.z = lerp(arm.rotation.z, 0.08 * dir, actionDamp);
            foreArm.rotation.x = lerp(foreArm.rotation.x, -1.95, actionDamp);
            hand.rotation.y = lerp(hand.rotation.y, isRight ? -Math.PI / 2 : Math.PI / 2, actionDamp);
        };

        if (variant === 'hook') {
            const p = Math.min(1, t / 0.72);
            if (p < 0.28) {
                parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.0, actionDamp);
                parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.95, actionDamp);
                parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.45, actionDamp);
                parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -2.0, actionDamp);
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.55 + guardOffset, actionDamp);
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.08, actionDamp);
                parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.04, actionDamp);
                guardHand(true);
                setFist(false, 1.35);
            } else if (p < 0.62) {
                parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.15, actionDamp * 1.2);
                parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.55, actionDamp * 1.2);
                parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.9, actionDamp * 1.2);
                parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.55, actionDamp * 1.2);
                parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI * 0.7, actionDamp * 1.2);
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.45 + guardOffset, actionDamp * 1.2);
                parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.14, actionDamp);
                parts.hips.position.z = lerp(parts.hips.position.z, 0.12, actionDamp);
                guardHand(true);
                setFist(false, 1.75);
            } else {
                this.recover(parts, baseHeight, actionDamp, lerp, guardOffset);
                setFist(false, 0.2);
            }

            playerModelResetFeet(parts, damp);
            return;
        }

        const p = Math.min(1, t / 0.68);
        if (p < 0.25) {
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.05, actionDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.52, actionDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -2.05, actionDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.42 + guardOffset, actionDamp);
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.05, actionDamp);
            parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.03, actionDamp);
            guardHand(false);
            setFist(true, 1.3);
        } else if (p < 0.58) {
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.3, actionDamp * 1.35);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -0.08, actionDamp * 1.35);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.08, actionDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.28, actionDamp * 1.35);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI, actionDamp * 1.35);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.48 + guardOffset, actionDamp * 1.35);
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.12, actionDamp);
            parts.hips.position.z = lerp(parts.hips.position.z, 0.16, actionDamp);
            guardHand(false);
            setFist(true, 1.8);
        } else {
            this.recover(parts, baseHeight, actionDamp, lerp, guardOffset);
            setFist(true, 0.2);
        }

        playerModelResetFeet(parts, damp);
    }

    private static recover(parts: any, baseHeight: number, actionDamp: number, lerp: any, guardOffset: number) {
        parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0, actionDamp);
        parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0, actionDamp);
        parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, actionDamp);
        parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0, actionDamp);
        parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 0, actionDamp);
        parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0, actionDamp);
        parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.2, actionDamp);
        parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.2, actionDamp);
        parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, actionDamp);
        parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI / 2, actionDamp);
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, guardOffset, actionDamp);
        parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0, actionDamp);
        parts.hips.position.z = lerp(parts.hips.position.z, 0, actionDamp);
        parts.hips.position.y = lerp(parts.hips.position.y, baseHeight, actionDamp);
    }
}
