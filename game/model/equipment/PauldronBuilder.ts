
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class PauldronBuilder {
    static build(isLeft: boolean, config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();
        
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0xb0bec5, 
            metalness: 0.8, 
            roughness: 0.2 
        });
        
        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x78909c,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.2
        });

        // Main shoulder plate - larger dome
        const plateGeo = new THREE.SphereGeometry(0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        plateGeo.scale(1.3, 0.7, 1.2);
        const plate = new THREE.Mesh(plateGeo, metalMat);
        plate.rotation.x = Math.PI;
        plate.rotation.z = isLeft ? 0.3 : -0.3;
        plate.position.y = 0.02;
        plate.castShadow = true;
        group.add(plate);

        // Secondary layered plate
        const plate2Geo = new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.4);
        plate2Geo.scale(1.2, 0.6, 1.1);
        const plate2 = new THREE.Mesh(plate2Geo, darkMetalMat);
        plate2.rotation.x = Math.PI;
        plate2.rotation.z = isLeft ? 0.4 : -0.4;
        plate2.position.y = -0.04;
        plate2.position.x = isLeft ? 0.02 : -0.02;
        plate2.castShadow = true;
        group.add(plate2);

        // Edge trim ring
        const trimGeo = new THREE.TorusGeometry(0.11, 0.012, 6, 16, Math.PI);
        const trim = new THREE.Mesh(trimGeo, goldMat);
        trim.rotation.x = Math.PI / 2;
        trim.rotation.z = isLeft ? -Math.PI / 2 : Math.PI / 2;
        trim.position.y = -0.02;
        trim.position.x = isLeft ? 0.06 : -0.06;
        group.add(trim);

        // Decorative rivets
        const rivetGeo = new THREE.SphereGeometry(0.015, 6, 6);
        const rivetPositions = [
            { x: 0, y: 0.04, z: 0.08 },
            { x: isLeft ? 0.06 : -0.06, y: 0.02, z: 0.05 },
            { x: isLeft ? -0.04 : 0.04, y: 0.02, z: 0.06 },
        ];
        
        rivetPositions.forEach(pos => {
            const rivet = new THREE.Mesh(rivetGeo, goldMat);
            rivet.position.set(pos.x, pos.y, pos.z);
            group.add(rivet);
        });

        return group;
    }
}
