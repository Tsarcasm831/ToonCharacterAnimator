import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class EarBuilder {
    static build(materials: PlayerMaterials) {
        const earsGroup = new THREE.Group();
        earsGroup.name = 'Ears';

        const earRadius = 0.045;
        const earGeo = new THREE.SphereGeometry(earRadius, 32, 32);
        const posAttribute = earGeo.attributes.position;
        const vertex = new THREE.Vector3();

        // Sculpt an ear shape
        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            
            const nx = vertex.x / earRadius;
            const ny = vertex.y / earRadius;
            const nz = vertex.z / earRadius;
            
            // Base flattening and stretching
            let x = vertex.x * 0.25; // Thin profile
            let y = vertex.y * 1.3;  // Taller
            let z = vertex.z * 0.85; // Slightly narrower front-to-back
            
            // Taper bottom lobe
            if (ny < 0) {
                z *= (1.0 + ny * 0.3); // Pinched at the bottom
            }
            
            // Flare top and back (Helix)
            if (ny > 0) {
                z *= (1.0 + ny * 0.15);
                if (nz < 0) x *= 1.2; // Thicker back rim
            }
            
            // Inner hollow (Concha) on the positive X side
            if (nx > 0) {
                const distToHollow = Math.sqrt(Math.pow(ny - 0.1, 2) + Math.pow(nz - 0.2, 2));
                if (distToHollow < 0.6) {
                    const depth = Math.pow(1.0 - (distToHollow / 0.6), 2) * 0.015;
                    x -= depth;
                }
                
                // Outer Rim ridge
                if (distToHollow > 0.5 && ny > -0.3) {
                    x += 0.003;
                }
            }

            posAttribute.setXYZ(i, x, y, z);
        }
        
        earGeo.computeVertexNormals();

        // Left Ear
        const leftEar = new THREE.Mesh(earGeo, materials.skin);
        leftEar.name = 'LeftEar';
        // Positioned appropriately on the sides of the head
        leftEar.position.set(0.168, -0.038, -0.03); 
        leftEar.rotation.y = -Math.PI / 10; // angled backwards
        leftEar.rotation.z = -Math.PI / 16; // tilted
        leftEar.rotation.x = -Math.PI / 16; // leaning back
        leftEar.castShadow = true;
        earsGroup.add(leftEar);

        // Right Ear - mirror the geometry
        const rightEarGeo = earGeo.clone();
        const rPos = rightEarGeo.attributes.position;
        for (let i = 0; i < rPos.count; i++) {
            // Invert X axis to flip the sculpted features
            rPos.setX(i, -rPos.getX(i));
        }
        
        // Fix inside-out appearance by reversing the face winding order
        const index = rightEarGeo.index;
        if (index) {
            for (let i = 0; i < index.count; i += 3) {
                const temp = index.getX(i + 1);
                index.setX(i + 1, index.getX(i + 2));
                index.setX(i + 2, temp);
            }
        }
        
        rightEarGeo.computeVertexNormals();
        
        const rightEar = new THREE.Mesh(rightEarGeo, materials.skin);
        rightEar.name = 'RightEar';
        rightEar.position.set(-0.168, -0.038, -0.03);
        rightEar.rotation.y = Math.PI / 10; // angled backwards
        rightEar.rotation.z = Math.PI / 16; // tilted
        rightEar.rotation.x = -Math.PI / 16; // leaning back
        rightEar.castShadow = true;
        earsGroup.add(rightEar);

        return earsGroup;
    }
}
