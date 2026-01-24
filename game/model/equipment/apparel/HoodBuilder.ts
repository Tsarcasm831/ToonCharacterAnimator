
import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

export class HoodBuilder {
    static build(parts: any, config: PlayerConfig): THREE.Mesh {
        const { mask } = config.equipment;
        // High resolution for clean cuts
        const hoodGeo = new THREE.SphereGeometry(0.25, 64, 64);
        const pos = hoodGeo.attributes.position;
        const v = new THREE.Vector3();
        
        // 1. SCULPT VERTICES
        for(let i=0; i<pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            if (v.y > 0.05 && v.z > 0) {
                const xFactor = Math.max(0, 1.0 - Math.abs(v.x)/0.18); 
                const yFactor = Math.max(0, 1.0 - Math.abs(v.y - 0.22)/0.25);
                const displacement = xFactor * yFactor;
                v.z += displacement * 0.18; 
                v.y -= displacement * 0.06; 
                if (Math.abs(v.x) < 0.05) v.z += 0.01; 
            }
            
            // Push the lower hood forward more if the mask is equipped to avoid clipping
            const maskZPush = (mask && v.y < 0.1 && v.y > -0.2 && v.z > 0) ? 0.02 : 0;
            
            if (v.y < 0.1 && v.y > -0.2 && v.z > -0.1) {
                if (Math.abs(v.x) > 0.15) {
                    v.x *= 1.05;
                    v.z *= 1.02;
                }
            }
            if (v.y < -0.1) {
                const t = (-0.1 - v.y) / 0.15; 
                v.x *= 1.0 + (t * 0.7);
                v.z *= 1.0 + (t * 0.35);
                if (v.z > 0.1) {
                    const centerBias = Math.max(0, 1.0 - Math.abs(v.x)/0.35);
                    v.y -= centerBias * 0.22; 
                    v.z += (centerBias * 0.08) + maskZPush;
                }
                if (v.z < -0.1) {
                    v.y -= 0.05; 
                }
            }
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        
        // 2. CUT OUT FACE
        if (hoodGeo.index) {
            const indices = hoodGeo.index.array;
            const newIndices: number[] = [];
            const vA = new THREE.Vector3();
            const vB = new THREE.Vector3();
            const vC = new THREE.Vector3();
            
            // Hood logic with eye-slit cover (Assassin Style)
            // Always use the smaller cutout to keep the face covered below the eyes.
            const cutMinY = -0.04; 
            const cutMaxY = 0.04;  
            const cutWidth = 0.13; 
            const cutMinZ = 0.1;   

            for(let i=0; i<indices.length; i+=3) {
                const a = indices[i];
                const b = indices[i+1];
                const c = indices[i+2];
                vA.fromBufferAttribute(pos, a);
                vB.fromBufferAttribute(pos, b);
                vC.fromBufferAttribute(pos, c);
                
                // Logic: Keep triangle only if NO vertex is inside the cutout zone.
                const isInsideA = vA.z > cutMinZ && Math.abs(vA.x) < cutWidth && vA.y > cutMinY && vA.y < cutMaxY;
                const isInsideB = vB.z > cutMinZ && Math.abs(vB.x) < cutWidth && vB.y > cutMinY && vB.y < cutMaxY;
                const isInsideC = vC.z > cutMinZ && Math.abs(vC.x) < cutWidth && vC.y > cutMinY && vC.y < cutMaxY;
                
                if (!isInsideA && !isInsideB && !isInsideC) {
                    newIndices.push(a, b, c);
                }
            }
            hoodGeo.setIndex(newIndices);
        }

        hoodGeo.computeVertexNormals();
        
        const hoodMat = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(config.hoodColor || '#111111'), 
            roughness: 0.95, 
            metalness: 0.05,
            side: THREE.DoubleSide,
            flatShading: false
        });
        
        const h = new THREE.Mesh(hoodGeo, hoodMat);
        h.position.set(0, 0.04, 0); 
        h.castShadow = true;
        return h;
    }
}
