
import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

export class MaskBuilder {
    static build(config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();
        const clothMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 1.0,
            side: THREE.DoubleSide
        });

        // Use a cylinder segment for wrap-around cloth effect
        // Slightly larger than head radius (0.21)
        const maskRad = 0.228;
        const maskHeight = 0.22;
        
        // A cylinder covering about 200 degrees of the front
        const maskGeo = new THREE.CylinderGeometry(maskRad, maskRad * 0.85, maskHeight, 32, 4, true, -Math.PI * 0.55, Math.PI * 1.1);
        
        // Sculpt the geometry for a more organic fabric look
        const pos = maskGeo.attributes.position;
        const v = new THREE.Vector3();
        for(let i=0; i<pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            const yNorm = (v.y + maskHeight/2) / maskHeight; // 0 to 1
            
            // Nose Pinch (Front center, top edge)
            if (yNorm > 0.7 && Math.abs(v.x) < 0.08) {
                const pinch = (yNorm - 0.7) / 0.3;
                v.z += pinch * 0.015;
                v.x *= (1.0 - pinch * 0.3);
            }
            
            // Chin Taper
            if (yNorm < 0.3) {
                const taper = (0.3 - yNorm) / 0.3;
                v.x *= (1.0 - taper * 0.2);
                v.z -= taper * 0.02;
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        maskGeo.computeVertexNormals();

        const mask = new THREE.Mesh(maskGeo, clothMat);
        // Positioned over mouth and nose
        mask.position.set(0, -0.06, 0.01);
        mask.rotation.x = 0.05;
        mask.castShadow = true;
        group.add(mask);

        // Add a leather-like strap at the top
        const strapGeo = new THREE.TorusGeometry(maskRad * 1.01, 0.008, 8, 32, Math.PI * 1.1);
        const strapMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
        const strap = new THREE.Mesh(strapGeo, strapMat);
        strap.rotation.set(Math.PI / 2, 0, Math.PI * 0.45);
        strap.position.y = maskHeight / 2 - 0.02;
        mask.add(strap);

        return group;
    }
}
