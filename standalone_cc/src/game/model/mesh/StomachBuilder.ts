import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class StomachBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const stomachGroup = new THREE.Group();
        stomachGroup.name = 'Stomach';

        const stomachGeo = new THREE.SphereGeometry(0.06, 32, 32);
        // Base shape is stretched
        stomachGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.0, 1.4, 0.7));

        const pos = stomachGeo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            // J-Shape sculpting
            // 1. Fundus (Top bulge, leans left)
            if (v.y > 0.02) {
                if (v.x > 0) { // Bulge left (positive X)
                    v.x *= 1.3;
                    v.y += 0.01;
                } else {
                    v.x *= 0.5; // Flatter on right side (medial)
                }
            }

            // 2. Body (Middle curve)
            if (v.y > -0.04 && v.y <= 0.02) {
                const curveProgression = (v.y + 0.04) / 0.06; // 0 at bottom, 1 at top
                // Shift entire body rightwards (negative X) as we go down
                v.x -= (1.0 - curveProgression) * 0.04;
                
                // Concave lesser curvature (medial/right side)
                if (v.x < 0) {
                    v.x += 0.01;
                }
            }

            // 3. Pylorus (Bottom taper, pointing right and slightly back)
            if (v.y <= -0.04) {
                const taper = 1.0 + (v.y * 10); // taper to point
                v.x *= Math.max(0.2, taper);
                v.z *= Math.max(0.3, taper);
                
                // Curve drastically to the right (negative X)
                v.x -= 0.05;
                v.y += 0.02; // curl upwards
                v.z -= 0.01; // point backwards
            }

            // Add slight organic noise
            const noise = Math.sin(v.x * 40) * Math.cos(v.y * 30) * 0.001;
            v.addScalar(noise);

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        
        stomachGeo.computeVertexNormals();

        const stomach = new THREE.Mesh(stomachGeo, materials.stomach);
        stomach.position.set(0.04, 0.01, 0.01); // Left side of abdomen
        stomach.rotation.z = -0.2; // Tilt it
        
        stomachGroup.add(stomach);

        return stomachGroup;
    }
}
