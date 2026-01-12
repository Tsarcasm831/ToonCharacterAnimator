
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class MaskBuilder {
    static build(config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();
        const clothMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });

        // Simple face cover
        const maskGeo = new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI, 0.4, 1.2);
        maskGeo.scale(1, 0.8, 1.1);
        const mask = new THREE.Mesh(maskGeo, clothMat);
        mask.rotation.x = -0.2;
        mask.position.z = 0.02;
        mask.castShadow = true;
        group.add(mask);

        return group;
    }
}
