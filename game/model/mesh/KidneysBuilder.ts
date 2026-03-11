import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class KidneysBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const kidneysGroup = new THREE.Group();
        kidneysGroup.name = 'Kidneys';

        const buildKidney = (isLeft: boolean) => {
            const kidneyGeo = new THREE.SphereGeometry(0.02, 32, 24);
            
            const pos = kidneyGeo.attributes.position;
            const v = new THREE.Vector3();

            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);

                // Bean shape
                v.y *= 1.5; // Elongated
                v.z *= 0.6; // Flattened back-to-front

                // Medial Hilum (indentation)
                // Left kidney medial is negative X, Right kidney medial is positive X
                const isMedialSide = isLeft ? (v.x < 0) : (v.x > 0);
                
                if (isMedialSide) {
                    // Deep indent in the center
                    const distFromCenterY = Math.abs(v.y);
                    if (distFromCenterY < 0.015) {
                        const indent = Math.pow(1.0 - (distFromCenterY / 0.015), 2) * 0.008;
                        v.x += isLeft ? indent : -indent;
                    }
                } else {
                    // Smooth convex curve on the outside
                    v.x *= 1.1;
                }

                pos.setXYZ(i, v.x, v.y, v.z);
            }
            
            kidneyGeo.computeVertexNormals();

            const kidney = new THREE.Mesh(kidneyGeo, materials.kidneys);
            
            // Left kidney is typically slightly higher than the right
            const yPos = isLeft ? -0.01 : -0.02;
            const xPos = isLeft ? 0.04 : -0.04;
            
            kidney.position.set(xPos, yPos, -0.04);
            // Tilt the top poles slightly inwards towards the spine
            kidney.rotation.z = isLeft ? -0.1 : 0.1;
            // Tilt slightly back
            kidney.rotation.x = -0.1;

            return kidney;
        };

        kidneysGroup.add(buildKidney(true));
        kidneysGroup.add(buildKidney(false));

        return kidneysGroup;
    }
}
