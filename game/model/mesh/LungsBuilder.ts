import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class LungsBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const lungsGroup = new THREE.Group();
        lungsGroup.name = 'Lungs';
        
        // --- TRACHEA & BRONCHI ---
        const airwayMat = new THREE.MeshPhysicalMaterial({ color: 0xdddddd, roughness: 0.7, clearcoat: 0.2 });
        
        // Trachea
        const tracheaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 16);
        // Add cartilage rings
        const tPos = tracheaGeo.attributes.position;
        for (let i = 0; i < tPos.count; i++) {
            const y = tPos.getY(i);
            const r = Math.sin(y * 200) * 0.002; // rings
            if (tPos.getZ(i) > 0) { // mostly on the front
                tPos.setX(i, tPos.getX(i) * (1 + r));
                tPos.setZ(i, tPos.getZ(i) * (1 + r));
            }
        }
        tracheaGeo.computeVertexNormals();
        const trachea = new THREE.Mesh(tracheaGeo, airwayMat);
        trachea.position.set(0, 0.25, -0.02);
        lungsGroup.add(trachea);

        // --- LUNGS ---
        const buildLung = (isLeft: boolean) => {
            const lungGeo = new THREE.SphereGeometry(0.1, 32, 32);
            // Elongate and shape
            lungGeo.applyMatrix4(new THREE.Matrix4().makeScale(0.85, 1.6, 1.1));
            
            const pos = lungGeo.attributes.position;
            const v = new THREE.Vector3();
            
            for(let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                
                // Base concavity (Diaphragmatic surface)
                if (v.y < -0.05) {
                    const distFromCenter = Math.sqrt(v.x*v.x + v.z*v.z);
                    v.y += (0.1 - distFromCenter) * 0.4;
                }
                
                // Medial surface flattening
                if ((isLeft && v.x > 0) || (!isLeft && v.x < 0)) {
                    v.x *= 0.3; // Flatten the inside facing the heart
                    
                    // Hilum indentation
                    if (v.y > -0.05 && v.y < 0.05 && v.z > -0.05 && v.z < 0.05) {
                        v.x += (isLeft ? -0.02 : 0.02);
                    }
                }
                
                // Cardiac Notch (Left Lung only)
                if (isLeft && v.x > 0 && v.y < -0.02 && v.z > 0) {
                    v.x -= 0.03;
                    v.z -= 0.02;
                }
                
                // Apex tapering
                if (v.y > 0.05) {
                    const taper = 1.0 - ((v.y - 0.05) * 4.0);
                    v.x *= Math.max(0.2, taper);
                    v.z *= Math.max(0.2, taper);
                }

                pos.setXYZ(i, v.x, v.y, v.z);
            }
            lungGeo.computeVertexNormals();
            
            const lung = new THREE.Mesh(lungGeo, materials.lungs);
            lung.position.set(isLeft ? 0.09 : -0.09, 0.08, -0.02);
            // Angle slightly
            lung.rotation.z = isLeft ? -0.1 : 0.1;
            
            return lung;
        };

        const leftLung = buildLung(true);
        const rightLung = buildLung(false);
        
        lungsGroup.add(leftLung);
        lungsGroup.add(rightLung);

        return lungsGroup;
    }
}
