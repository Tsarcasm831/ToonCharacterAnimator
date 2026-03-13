import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class LiverBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const liverGroup = new THREE.Group();
        liverGroup.name = 'Liver';

        const liverGeo = new THREE.SphereGeometry(0.08, 32, 32);
        
        const pos = liverGeo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            // 1. Right lobe (Massive, bulging to the right - negative X)
            if (v.x < 0) {
                v.x *= 1.4;
                if (v.y < 0) {
                    v.y *= 1.3; // Drops lower on the right
                }
            } 
            // 2. Left lobe (Tapers to a thin edge on the left - positive X)
            else {
                const taper = 1.0 - (v.x / 0.08); // 0.08 is original radius
                v.y *= taper * 0.8;
                v.z *= Math.max(0.2, taper * 0.9);
                v.x *= 0.7; // Doesn't cross midline as far
            }

            // 3. Diaphragmatic surface (Top - Smooth and convex)
            if (v.y > 0) {
                v.y *= 0.6; // Flatten the dome
                
                // Curve backwards to fit under ribs
                if (v.z < 0) {
                    v.y -= v.z * 0.3;
                }
            }
            
            // 4. Visceral surface (Bottom - Concave, irregular)
            if (v.y <= 0) {
                // Gallbladder fossa / porta hepatis indentation
                if (v.x > -0.04 && v.x < 0.02 && v.z > -0.02 && v.z < 0.04) {
                    v.y += 0.02; // Push inwards
                }
                
                // Renal impression (right side, back)
                if (v.x < -0.03 && v.z < -0.01) {
                    v.y += 0.015;
                    v.z += 0.01;
                }
                
                // Gastric impression (left side, front)
                if (v.x > 0 && v.z > 0) {
                    v.y += 0.01;
                }
            }

            // General organic shaping
            v.z *= 0.8; // Generally flatter front-to-back than left-to-right

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        
        liverGeo.computeVertexNormals();

        const liver = new THREE.Mesh(liverGeo, materials.liver);
        // Positioned mostly on the right side (negative X), high in the abdomen
        liver.position.set(-0.03, 0.03, -0.01);
        liverGroup.add(liver);

        return liverGroup;
    }
}
