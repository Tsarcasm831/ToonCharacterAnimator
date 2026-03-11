import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class HeartBuilder {
    static build(materials: PlayerMaterials): THREE.Group {
        const heartGroup = new THREE.Group();
        heartGroup.name = 'Heart';
        
        // --- BASE HEART (Ventricles) ---
        const heartGeo = new THREE.SphereGeometry(0.06, 32, 32);
        const pos = heartGeo.attributes.position;
        const v = new THREE.Vector3();
        
        for(let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            
            // Taper to form the apex (points down and left)
            if (v.y < 0) {
                const taper = 1.0 + (v.y * 5.0); // y is negative, so this reduces size
                v.x *= Math.max(0.1, taper);
                v.z *= Math.max(0.2, taper);
                
                // Shift the apex to the left (positive X) and forward (positive Z)
                v.x += Math.pow(-v.y * 2, 2) * 0.03;
                v.z += Math.pow(-v.y * 2, 2) * 0.01;
            } else {
                // Broaden the base (top)
                v.x *= 1.2;
                v.z *= 0.9; // Slightly flattened front-to-back
            }
            
            // Interventricular sulcus (groove on the front)
            if (v.z > 0.02 && v.x > -0.02 && v.x < 0.04) {
                const grooveDepth = Math.sin((v.x - 0.01) * 50) * 0.005;
                if (grooveDepth > 0) v.z -= grooveDepth;
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        heartGeo.computeVertexNormals();
        const mainHeart = new THREE.Mesh(heartGeo, materials.heart);
        heartGroup.add(mainHeart);

        // --- ATRIA (Top bulges) ---
        const atriaGeo = new THREE.SphereGeometry(0.03, 16, 16);
        atriaGeo.scale(1.5, 0.6, 1.0);
        const atria = new THREE.Mesh(atriaGeo, materials.heart);
        atria.position.set(0, 0.04, -0.01);
        heartGroup.add(atria);

        // --- AORTA (Vessel coming out top) ---
        // Simulating the aortic arch
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.01, 0.04, 0),
            new THREE.Vector3(0.01, 0.08, 0.01),
            new THREE.Vector3(0.02, 0.1, 0),
            new THREE.Vector3(0.03, 0.09, -0.02),
            new THREE.Vector3(0.03, 0.05, -0.04)
        ]);
        const aortaGeo = new THREE.TubeGeometry(curve, 20, 0.015, 8, false);
        // Slightly different red for vessels
        const vesselMat = new THREE.MeshPhysicalMaterial({ color: 0x992222, roughness: 0.4, clearcoat: 0.8 });
        const aorta = new THREE.Mesh(aortaGeo, vesselMat);
        heartGroup.add(aorta);

        // Position the entire heart in the chest
        heartGroup.position.set(0.02, 0.08, 0.02); // Slightly left of center (positive X)
        heartGroup.rotation.z = 0.2; // Tilted
        heartGroup.rotation.y = -0.2;

        return heartGroup;
    }
}
