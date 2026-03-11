import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class BladderBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const bladderGroup = new THREE.Group();
        bladderGroup.name = 'Bladder';

        // Bladder is roughly tetrahedral when empty, spherical when full.
        // We'll make a slightly inflated tetrahedral/balloon shape.
        const bladderGeo = new THREE.SphereGeometry(0.025, 32, 32);
        
        const pos = bladderGeo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            // Flatten the top slightly (superior surface)
            if (v.y > 0) {
                v.y *= 0.7;
            }
            
            // Flatten the back slightly (posterior surface)
            if (v.z < 0) {
                v.z *= 0.6;
            }
            
            // Taper down to the urethra (inferiorly)
            if (v.y < 0) {
                const taper = 1.0 + (v.y * 15); // sharp taper
                v.x *= Math.max(0.1, taper);
                v.z *= Math.max(0.1, taper);
                
                // Pull the neck slightly forward
                v.z += Math.abs(v.y) * 0.2;
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        
        bladderGeo.computeVertexNormals();

        const bladder = new THREE.Mesh(bladderGeo, materials.bladder);
        // Positioned low in the pelvis, midline
        bladder.position.set(0, -0.12, 0.01);
        bladderGroup.add(bladder);

        return bladderGroup;
    }
}
