import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class PancreasBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const pancreasGroup = new THREE.Group();
        pancreasGroup.name = 'Pancreas';

        const pancreasGeo = new THREE.SphereGeometry(0.02, 32, 16);
        
        const pos = pancreasGeo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            // Shape: Head (right), Body (middle), Tail (left)
            // Stretched horizontally
            v.x *= 2.5; 
            // Flattened front-to-back
            v.z *= 0.4;
            
            // Tapering tail (towards positive X - left side of body)
            if (v.x > 0) {
                const taper = 1.0 - (v.x / 0.05); // max X is ~0.05
                v.y *= Math.max(0.3, taper);
                v.z *= Math.max(0.3, taper);
                
                // Curve slightly upwards and backwards
                v.y += v.x * 0.2;
                v.z -= v.x * 0.1;
            } 
            // Thicker head (towards negative X - right side of body, curving down)
            else {
                v.y *= 1.2;
                if (v.x < -0.02 && v.y < 0) {
                    // Uncinate process (hooks downwards)
                    v.y -= 0.01;
                    v.x += 0.005;
                }
            }

            // Glandular/lobular bumpy texture
            const bumps = Math.sin(v.x * 200) * Math.cos(v.y * 200) * Math.sin(v.z * 200);
            v.addScalar(bumps * 0.0015);

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        
        pancreasGeo.computeVertexNormals();

        const pancreas = new THREE.Mesh(pancreasGeo, materials.pancreas);
        // Tucked behind the stomach
        pancreas.position.set(0.01, 0.0, -0.01);
        pancreas.rotation.z = 0.1;
        pancreasGroup.add(pancreas);

        return pancreasGroup;
    }
}
