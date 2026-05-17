import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class PickupAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const duration = 0.9;
        const progress = THREE.MathUtils.clamp(player.pickUpTime / duration, 0, 1);
        const bend = Math.sin(progress * Math.PI);
        const reach = Math.sin(THREE.MathUtils.clamp(progress / 0.72, 0, 1) * Math.PI);
        const lerp = THREE.MathUtils.lerp;
        const pickupDamp = damp * 3;
        const baseHeight = 0.89 * player.config.legScale;

        parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - bend * 0.22, pickupDamp);
        parts.hips.rotation.x = lerp(parts.hips.rotation.x, bend * 0.28, pickupDamp);

        parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, -bend * 0.82, pickupDamp);
        parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, -bend * 0.92, pickupDamp);

        parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, bend * 1.45, pickupDamp);
        parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, bend * 1.55, pickupDamp);

        parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, bend * 0.78, pickupDamp);
        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -bend * 0.18, pickupDamp);

        parts.neck.rotation.x = lerp(parts.neck.rotation.x, -bend * 0.42, pickupDamp);

        parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -reach * 1.25, pickupDamp);
        parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -reach * 0.42, pickupDamp);
        parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -reach * 0.52, pickupDamp);

        parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -bend * 0.32, pickupDamp);
        parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, bend * 0.26, pickupDamp);

        playerModelResetFeet(parts, damp);
    }
}
