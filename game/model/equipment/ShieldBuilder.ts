
import * as THREE from 'three';

export class ShieldBuilder {
    static build(): THREE.Group {
        const group = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.7, roughness: 0.3 });

        // Shield Shape (Heater Shield)
        const shape = new THREE.Shape();
        shape.moveTo(-0.4, 0.5);
        shape.lineTo(0.4, 0.5);
        shape.lineTo(0.4, 0);
        shape.quadraticCurveTo(0.4, -0.4, 0, -0.6);
        shape.quadraticCurveTo(-0.4, -0.4, -0.4, 0);
        shape.lineTo(-0.4, 0.5);

        const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 };
        const shieldGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const shield = new THREE.Mesh(shieldGeo, woodMat);
        shield.castShadow = true;
        group.add(shield);

        // Metal Rim
        const rimGeo = new THREE.ExtrudeGeometry(shape, { ...extrudeSettings, depth: 0.05, bevelSize: 0.03 });
        const rim = new THREE.Mesh(rimGeo, metalMat);
        rim.position.z = -0.005;
        group.add(rim);

        return group;
    }
}
