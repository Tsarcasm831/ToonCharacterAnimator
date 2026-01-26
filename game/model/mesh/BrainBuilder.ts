import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class BrainBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        // === BRAIN ===
        const brain = new THREE.Group();
        brain.position.set(0.35, 0.06, 0); 
        brain.visible = false;

        // 1. CEREBRUM (Hemispheres)
        const hemiGeo = new THREE.SphereGeometry(0.08, 64, 64);
        hemiGeo.applyMatrix4(new THREE.Matrix4().makeScale(0.85, 1.0, 1.25)); // Elongate front-back
        
        const hemiPos = hemiGeo.attributes.position;
        const v = new THREE.Vector3();

        // Sculpt Medial Flatness & General Shape
        for(let i=0; i<hemiPos.count; i++) {
            v.fromBufferAttribute(hemiPos, i);
            
            // Medial surface (facing center): Flatten x
            if (v.x < 0) { 
                v.x *= 0.1; // Flatten inner side
            }
            
            // 2. Temporal Lobe (Side-bottom bulge) ("The Thumb")
            if (v.x > 0.03 && v.y < -0.01 && v.z > -0.02 && v.z < 0.06) {
                v.x += 0.012; // Bulge out
                v.y -= 0.01;  // Bulge down
            }

            // Sylvian Fissure Indentation (Separate Temporal from Frontal/Parietal)
            if (v.x > 0.04 && v.y > -0.01 && v.y < 0.02 && v.z > 0.0 && v.z < 0.05) {
                v.x -= 0.005; 
            }
            
            // 3. Frontal Lobe (Fuller front)
            if (v.z > 0.05 && v.y > 0) {
                 v.x *= 1.05;
            }

            // General waviness for base shape (large lobes)
            // Increased frequency for more defined gyri bumps on the mesh itself
            const d = 0.002;
            const noise = Math.sin(v.x*30) + Math.cos(v.y*25) + Math.sin(v.z*30);
            
            // Only apply noise to outer surface
            if (v.x > 0.01) {
                v.addScalar(noise * d);
            }

            hemiPos.setXYZ(i, v.x, v.y, v.z);
        }
        hemiGeo.computeVertexNormals();

        // Left Hemisphere
        const leftHemi = new THREE.Mesh(hemiGeo, materials.brain);
        leftHemi.scale.set(-1, 1, 1); // Mirror for Left
        leftHemi.position.set(0.002, 0, 0); // Slight gap
        brain.add(leftHemi);

        // Right Hemisphere
        const rightHemi = new THREE.Mesh(hemiGeo, materials.brain);
        rightHemi.position.set(-0.002, 0, 0); 
        brain.add(rightHemi);

        // 2. CEREBELLUM (Little Brain at back)
        const cerebGeo = new THREE.SphereGeometry(0.045, 48, 32);
        cerebGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.5, 0.8, 0.9));
        // Add ridged texture via geometry noise for different look
        const cPos = cerebGeo.attributes.position;
        for(let i=0; i<cPos.count; i++) {
            v.fromBufferAttribute(cPos, i);
            // Horizontal ridges typical of cerebellum (Folia)
            // Sharper, more frequent ridges
            const ridges = Math.sin(v.y * 100) * 0.002;
            v.x += ridges * (v.x > 0 ? 1 : -1);
            v.z += ridges;
            
            // Flatten bottom slightly
            if (v.y < -0.02) v.y *= 0.85;

            cPos.setXYZ(i, v.x, v.y, v.z);
        }
        cerebGeo.computeVertexNormals();
        
        const cerebellum = new THREE.Mesh(cerebGeo, materials.brain);
        cerebellum.position.set(0, -0.06, -0.075);
        cerebellum.rotation.x = -0.2;
        brain.add(cerebellum);

        // 3. BRAINSTEM
        const stemGeo = new THREE.CylinderGeometry(0.018, 0.014, 0.11, 24);
        // Curve the stem slightly forward
        const stemPos = stemGeo.attributes.position;
        for(let i=0; i<stemPos.count; i++) {
            const y = stemPos.getY(i);
            const z = stemPos.getZ(i);
            const bend = Math.pow((y + 0.06), 2) * 2.0; 
            stemPos.setZ(i, z + bend * 0.5);
        }
        stemGeo.computeVertexNormals();
        
        const brainStem = new THREE.Mesh(stemGeo, materials.brain);
        brainStem.position.set(0, -0.09, -0.02);
        brainStem.rotation.x = 0.15;
        brain.add(brainStem);

        return brain;
    }
}
