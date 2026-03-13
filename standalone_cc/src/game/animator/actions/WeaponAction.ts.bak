import * as THREE from 'three';

export class WeaponAction {
    static animate(player: any, parts: any, dt: number, _damp: number, isMoving: boolean) {
        const item = player.config.selectedItem;
        const isSword = item === 'Sword';
        const isKnife = item === 'Knife';
        const isStaff = item === 'Staff';

        let duration = 0.9;
        if (isSword) duration = 0.6;
        if (isKnife) duration = 0.4;
        if (isStaff) duration = 0.7;

        const combat = player.combat ?? player;
        const isCombatStance = player.combat?.isCombatStance ?? player.isCombatStance ?? false;
        const isJumping = player.locomotion?.isJumping ?? player.isJumping ?? false;
        const p = (combat.axeSwingTimer ?? 0) / duration;
        const lerp = THREE.MathUtils.lerp;
        const actionDamp = 15 * dt;
        const torsoOffset = (isCombatStance && !isMoving && !isJumping) ? 0.7 : 0;

        if (isSword || isKnife) {
            if (p < 0.35) {
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -1.2 + torsoOffset, actionDamp);
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 1.5, actionDamp);
                parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -2.2, actionDamp);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 2.2, actionDamp);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.0, actionDamp);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, actionDamp);
                parts.neck.rotation.y = lerp(parts.neck.rotation.y, 0.6, actionDamp);
            } else if (p < 0.8) {
                const swingDamp = actionDamp * 2.5;
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 1.0 + torsoOffset, swingDamp);
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -1.5, swingDamp);
                parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.5, swingDamp);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.1, swingDamp * 1.5);
                parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, -1.0, swingDamp);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, swingDamp);
                parts.neck.rotation.y = lerp(parts.neck.rotation.y, -0.5, swingDamp);
            } else {
                parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, torsoOffset, actionDamp);
                parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0, actionDamp);
                parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.2, actionDamp);
                parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.4, actionDamp);
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, actionDamp);
            }
            return;
        }

        if (p < 0.45) {
            const windupDamp = actionDamp * 0.8;
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -2.5, windupDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.2, windupDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -2.1, windupDamp);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, windupDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -0.2 + torsoOffset, windupDamp);
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, -0.2, windupDamp);
        } else if (p < 0.75) {
            const strikeDamp = actionDamp * 1.8;
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0.4, strikeDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 0.1, strikeDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.4, strikeDamp);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, strikeDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0.5 + torsoOffset, strikeDamp);
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0.7, strikeDamp);
        } else {
            const recoverDamp = actionDamp * 0.5;
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0, recoverDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.5, recoverDamp);
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, recoverDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, torsoOffset, recoverDamp);
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0, recoverDamp);
        }
    }
}
