import * as THREE from 'three';
import { AnimationClip, sampleAnimationClip } from '../AnimationClipLoader';

export class ClipAction {
    static animate(
        player: any,
        parts: any,
        dt: number,
        damp: number,
        clip: AnimationClip,
        normalizedTime: number
    ): void {
        void player;
        void dt;

        const frame = sampleAnimationClip(clip, normalizedTime);
        const lerp = THREE.MathUtils.lerp;

        for (const [boneName, rotation] of Object.entries(frame.rotations)) {
            const part = parts?.[boneName];
            if (!part?.rotation) continue;

            part.rotation.x = lerp(part.rotation.x, rotation[0], damp);
            part.rotation.y = lerp(part.rotation.y, rotation[1], damp);
            part.rotation.z = lerp(part.rotation.z, rotation[2], damp);
        }
    }
}
