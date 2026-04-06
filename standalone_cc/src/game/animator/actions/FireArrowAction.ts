import * as THREE from 'three';

export class FireArrowAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const lerp = THREE.MathUtils.lerp;
        const actionDamp = 15 * dt;
        const combat = player.combat ?? player;
        const bowState = combat.bowState ?? 'draw';
        const bowCharge = combat.bowCharge ?? 0;

        // Body alignment for left-hand bow hold.
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -1.2, actionDamp);
        parts.neck.rotation.y = lerp(parts.neck.rotation.y, 1.2, actionDamp);
        parts.neck.rotation.x = lerp(parts.neck.rotation.x, -0.1, actionDamp);
        parts.head.rotation.z = lerp(parts.head.rotation.z, -0.1, actionDamp);

        // Left arm: bow hand (stabilized forward).
        parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -1.57, actionDamp);
        parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0.15, actionDamp);
        parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0, actionDamp);
        parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, 0, actionDamp);
        parts.leftHand.rotation.x = lerp(parts.leftHand.rotation.x, 0.0, actionDamp);
        parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI / 2, actionDamp);
        parts.leftHand.rotation.z = lerp(parts.leftHand.rotation.z, 0, actionDamp);

        // Right arm: draw and release.
        if (bowState === 'release') {
            const recoilDamp = 25 * dt;
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.5, recoilDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -0.3, recoilDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 1.4, recoilDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.5, recoilDamp);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, recoilDamp);
        } else {
            const drawProgress = Math.min(1.0, bowCharge);

            const startArmX = -1.45;
            const startArmY = 1.0;
            const startArmZ = 0.0;
            const startElbow = -0.5;

            const endArmX = -1.57;
            const endArmY = -0.2;
            const endArmZ = 1.35;
            const endElbow = -2.65;

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, lerp(startArmX, endArmX, drawProgress), actionDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, lerp(startArmY, endArmY, drawProgress), actionDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, lerp(startArmZ, endArmZ, drawProgress), actionDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, lerp(startElbow, endElbow, drawProgress), actionDamp);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2 - 0.2, actionDamp);
            parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, 0.2, actionDamp);
        }
    }
}
