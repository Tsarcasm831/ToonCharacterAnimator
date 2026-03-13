import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class SpleenBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const spleenGroup = new THREE.Group();
        spleenGroup.name = 'Spleen';

        const spleenGeo = new THREE.SphereGeometry(0.015, 24, 24);
        
        const pos = spleenGeo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            // Shape: Coffee bean / curved wedge
            v.y *= 1.8; // Elongated vertically
            v.z *= 0.6; // Flattened
            v.x *= 1.2;

            // Concave on the medial surface (hilum)
            if (v.x < 0) { // Assuming it sits on the left side (positive X in world, but locally let's say negative X faces inward)
                v.x *= 0.5;
                if (v.y > -0.01 && v.y < 0.01 && v.z > -0.01 && v.z < 0.01) {
                    // Indentation for vessels
                    v.x += 0.005;
                }
            } else {
                // Convex laterally
                v.x *= 1.1;
            }

            // Curve it to fit the diaphragm
            if (v.y > 0) {
                v.x -= v.y * 0.2;
            } else {
                v.x += v.y * 0.2;
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        
        spleenGeo.computeVertexNormals();

        const spleen = new THREE.Mesh(spleenGeo, materials.spleen);
        // Position far left, back, high up
        spleen.position.set(0.06, 0.02, -0.03);
        spleen.rotation.z = -0.3; // Tilt to fit against ribs
        spleenGroup.add(spleen);

        return spleenGroup;
    }
}
