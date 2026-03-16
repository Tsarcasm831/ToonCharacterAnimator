import * as THREE from 'three';

export class InteractAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const timer = Number.isFinite(player?.interactTimer)
            ? player.interactTimer
            : performance.now() / 1000;
        const p = Math.sin((timer / 0.4) * Math.PI);
        const lerp = THREE.MathUtils.lerp;

        const safeHeadX = Number.isFinite(parts?.head?.rotation?.x) ? parts.head.rotation.x : 0;
        const safeRightArmX = Number.isFinite(parts?.rightArm?.rotation?.x) ? parts.rightArm.rotation.x : 0;

        parts.head.rotation.x = lerp(safeHeadX, p * 0.5, damp * 3);
        parts.rightArm.rotation.x = lerp(safeRightArmX, -p * 1.2, damp * 2);
    }
}
