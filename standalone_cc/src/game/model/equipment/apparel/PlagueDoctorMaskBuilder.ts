import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

export class PlagueDoctorMaskBuilder {
    static build(config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();
        group.name = 'PlagueDoctorMask';

        const leatherMat = new THREE.MeshStandardMaterial({
            color: config.plagueMaskColor,
            roughness: 0.85,
            metalness: 0.06,
            side: THREE.DoubleSide
        });
        leatherMat.userData.plagueMaskPart = 'leather';

        const trimMat = new THREE.MeshStandardMaterial({
            color: config.plagueMaskTrimColor,
            roughness: 0.3,
            metalness: 0.86
        });
        trimMat.userData.plagueMaskPart = 'trim';

        const lensMat = new THREE.MeshStandardMaterial({
            color: config.plagueMaskLensColor,
            roughness: 0.08,
            metalness: 0.1,
            transparent: true,
            opacity: 0.5
        });
        lensMat.userData.plagueMaskPart = 'lens';

        const shellGeo = new THREE.SphereGeometry(0.225, 52, 38, 0, Math.PI * 2, 0, Math.PI * 0.63);
        const shellPos = shellGeo.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < shellPos.count; i++) {
            v.fromBufferAttribute(shellPos, i);
            if (v.z < -0.03) v.z *= 0.78;
            if (v.y < -0.045 && v.z > 0.05) {
                v.y -= 0.016;
                v.z += 0.015;
            }
            shellPos.setXYZ(i, v.x, v.y, v.z);
        }
        shellGeo.computeVertexNormals();

        const shell = new THREE.Mesh(shellGeo, leatherMat);
        shell.position.set(0, -0.02, 0.02);
        shell.scale.set(1.04, 0.95, 1.07);
        shell.castShadow = true;
        group.add(shell);

        const beakBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.022, 0.48, 42, 1, true), leatherMat);
        beakBody.rotation.x = Math.PI / 2;
        beakBody.position.set(0, -0.085, 0.255);
        beakBody.scale.set(0.94, 0.92, 1.06);
        beakBody.castShadow = true;
        group.add(beakBody);

        const beakCap = new THREE.Mesh(new THREE.SphereGeometry(0.095, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.52), leatherMat);
        beakCap.position.set(0, -0.06, 0.05);
        beakCap.scale.set(1.0, 0.68, 1.02);
        beakCap.rotation.x = 0.06;
        group.add(beakCap);

        const beakTip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.06, 24), trimMat);
        beakTip.rotation.x = Math.PI / 2;
        beakTip.position.set(0, -0.085, 0.5);
        group.add(beakTip);

        const eyeY = 0.012;
        const eyeZ = 0.165;
        const eyeX = 0.112;
        [-1, 1].forEach((side) => {
            const eyeHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.073, 0.066, 0.036, 34), leatherMat);
            eyeHousing.rotation.x = Math.PI / 2;
            eyeHousing.position.set(side * eyeX, eyeY, eyeZ);
            eyeHousing.rotation.z = side * 0.08;
            eyeHousing.castShadow = true;
            group.add(eyeHousing);

            const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.057, 0.008, 14, 38), trimMat);
            eyeRing.position.set(side * eyeX, eyeY, eyeZ + 0.021);
            eyeRing.rotation.y = side * 0.09;
            group.add(eyeRing);

            const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.012, 30), lensMat);
            lens.position.set(side * eyeX, eyeY, eyeZ + 0.022);
            lens.rotation.y = side * 0.09;
            group.add(lens);
        });

        const cheekBand = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.008, 10, 44, Math.PI * 0.92), trimMat);
        cheekBand.rotation.set(Math.PI / 2, 0, Math.PI);
        cheekBand.position.set(0, -0.01, -0.01);
        group.add(cheekBand);

        const sideStrapGeo = new THREE.BoxGeometry(0.24, 0.02, 0.036);
        [-1, 1].forEach((side) => {
            const sideStrap = new THREE.Mesh(sideStrapGeo, leatherMat);
            sideStrap.position.set(side * 0.22, 0.015, -0.07);
            sideStrap.rotation.y = side * 0.06;
            group.add(sideStrap);

            const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.03, 0.04), trimMat);
            buckle.position.set(side * 0.32, 0.015, -0.07);
            group.add(buckle);
        });

        const topStrap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.36), leatherMat);
        topStrap.position.set(0, 0.165, -0.01);
        topStrap.rotation.x = -0.16;
        group.add(topStrap);

        for (let i = 0; i < 8; i++) {
            const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 10, 8), trimMat);
            const t = i / 7;
            rivet.position.set(0, 0.03 - t * 0.21, 0.16 + t * 0.3);
            group.add(rivet);
        }

        group.position.set(0, -0.018, 0.038);
        group.rotation.x = 0.045;
        return group;
    }
}
