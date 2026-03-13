import * as THREE from 'three';

export class HairSimulation {
    private hairInertia = new THREE.Vector3();
    private hairTargetInertia = new THREE.Vector3();
    private prevHeadPos = new THREE.Vector3();
    private prevHeadQuat = new THREE.Quaternion();
    private isFirstUpdate = true;
    private smoothedSpeed = 0;

    update(dt: number, _velocity: THREE.Vector3, head: THREE.Object3D) {
        if (dt <= 0) return;

        const hairMesh = head.getObjectByName('HairInstanced');
        if (!hairMesh) return;

        const currentHeadPos = new THREE.Vector3();
        const currentHeadQuat = new THREE.Quaternion();
        head.getWorldPosition(currentHeadPos);
        head.getWorldQuaternion(currentHeadQuat);

        if (this.isFirstUpdate) {
            this.prevHeadPos.copy(currentHeadPos);
            this.prevHeadQuat.copy(currentHeadQuat);
            this.isFirstUpdate = false;
            return;
        }

        const deltaPos = currentHeadPos.clone().sub(this.prevHeadPos).divideScalar(dt);
        if (deltaPos.length() > 20) {
            deltaPos.set(0, 0, 0);
        }

        const invPrevQuat = this.prevHeadQuat.clone().invert();
        const deltaQuat = currentHeadQuat.clone().multiply(invPrevQuat);
        const rotationAxis = new THREE.Vector3(0, 1, 0);
        const angle = 2 * Math.acos(THREE.MathUtils.clamp(deltaQuat.w, -1, 1));
        const angularSpeed = angle / dt;

        this.hairTargetInertia.copy(deltaPos).multiplyScalar(-0.045);

        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(currentHeadQuat);
        const turnSwing = forward.clone().cross(rotationAxis).multiplyScalar(angularSpeed * -0.012);
        this.hairTargetInertia.add(turnSwing);
        this.hairTargetInertia.clampLength(0, 0.18);

        const invHeadRot = currentHeadQuat.clone().invert();
        this.hairTargetInertia.applyQuaternion(invHeadRot);

        const springStrength = 7.0;
        this.hairInertia.lerp(this.hairTargetInertia, Math.min(1.0, springStrength * dt));

        const currentSpeed = deltaPos.length();
        this.smoothedSpeed = THREE.MathUtils.lerp(this.smoothedSpeed, currentSpeed, Math.min(1.0, dt * 5.0));

        if (hairMesh.userData.uInertia) {
            hairMesh.userData.uInertia.value.copy(this.hairInertia);

            if (hairMesh.userData.uGravity) {
                const worldDown = new THREE.Vector3(0, -0.03, 0);
                worldDown.applyQuaternion(invHeadRot);
                hairMesh.userData.uGravity.value.copy(worldDown);
            }

            if (hairMesh.userData.uSpeed) {
                hairMesh.userData.uSpeed.value = this.smoothedSpeed;
            }
        }

        this.prevHeadPos.copy(currentHeadPos);
        this.prevHeadQuat.copy(currentHeadQuat);
    }

    dispose() {
        // Cleanup logic for hair simulation if needed
    }
}
