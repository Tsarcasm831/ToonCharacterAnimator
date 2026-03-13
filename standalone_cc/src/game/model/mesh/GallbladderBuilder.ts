import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class GallbladderBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const gallbladderGroup = new THREE.Group();
        gallbladderGroup.name = 'Gallbladder';

        const gbGeo = new THREE.SphereGeometry(0.012, 16, 16);
        
        const pos = gbGeo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            // Pear shape
            // Fat at the bottom (fundus)
            if (v.y < 0) {
                v.x *= 1.2;
                v.z *= 1.2;
            } 
            // Tapering at the top (neck/cystic duct)
            else {
                const taper = 1.0 - (v.y / 0.015);
                v.x *= Math.max(0.2, taper);
                v.z *= Math.max(0.2, taper);
                
                // Curve the neck slightly
                v.x += v.y * 0.3;
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        
        gbGeo.computeVertexNormals();

        const gallbladder = new THREE.Mesh(gbGeo, materials.gallbladder);
        // Tucked under the right lobe of the liver
        gallbladder.position.set(-0.02, 0.01, -0.01);
        gallbladder.rotation.z = -0.3; // Tilt outwards
        gallbladder.rotation.x = -0.4; // Tilt forwards
        gallbladderGroup.add(gallbladder);

        return gallbladderGroup;
    }
}
