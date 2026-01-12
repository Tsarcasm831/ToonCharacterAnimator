import * as THREE from 'three';

export class HairSimulation {
    private hairInertia = new THREE.Vector3();
    private hairTargetInertia = new THREE.Vector3();

    update(dt: number, velocity: THREE.Vector3, head: THREE.Object3D) {
        // 1. Inertia Calculation
        this.hairTargetInertia.copy(velocity).multiplyScalar(-0.06);
        this.hairTargetInertia.clampLength(0, 0.12);

        const invHeadRot = new THREE.Quaternion();
        head.getWorldQuaternion(invHeadRot).invert();
        this.hairTargetInertia.applyQuaternion(invHeadRot);

        const spring = 8.0 * dt;
        this.hairInertia.lerp(this.hairTargetInertia, spring);

        // 2. Uniform Updates
        const hairMesh = head.getObjectByName('HairInstanced');
        if (hairMesh && hairMesh.userData.uInertia) {
            hairMesh.userData.uInertia.value.copy(this.hairInertia);

            // Also update Gravity in head-local space
            if (hairMesh.userData.uGravity) {
                const worldGravity = new THREE.Vector3(0, -0.015, 0);
                worldGravity.applyQuaternion(invHeadRot);
                hairMesh.userData.uGravity.value.copy(worldGravity);
            }
        }
    }
}
