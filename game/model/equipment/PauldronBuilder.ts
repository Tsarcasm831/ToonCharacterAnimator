
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class PauldronBuilder {
    static build(isLeft: boolean, config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8, roughness: 0.2 });

        const plateGeo = new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI, 0, Math.PI * 0.5);
        plateGeo.scale(1.2, 0.6, 1.1);
        const plate = new THREE.Mesh(plateGeo, metalMat);
        plate.rotation.y = isLeft ? -Math.PI / 2 : Math.PI / 2;
        plate.castShadow = true;
        group.add(plate);

        return group;
    }
}
