import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class HairBuilder {
    static build(parts: any, config: PlayerConfig, material: THREE.Material) {
        // Clean up old hair
        const head = parts.head;
        const existing = head.children.find((c: any) => c.name === 'HairGroup');
        if (existing) head.remove(existing);

        if (config.hairStyle === 'bald') return;

        const hairGroup = new THREE.Group();
        hairGroup.name = 'HairGroup';
        head.add(hairGroup);

        const headRadius = 0.21; // Match HeadBuilder base radius

        if (config.hairStyle === 'crew') {
            // === CREW CUT ===
            
            // 1. Main Top Volume (Sphere Segment)
            // Starts slightly above mid-ear
            const capGeo = new THREE.SphereGeometry(headRadius * 1.05, 32, 16, 0, Math.PI*2, 0, Math.PI * 0.48);
            const pos = capGeo.attributes.position;
            const vec = new THREE.Vector3();
            
            for(let i=0; i<pos.count; i++) {
                vec.fromBufferAttribute(pos, i);
                
                // === FACE CUT-OUT & HAIRLINE SCULPTING ===
                // If vertex is in the front (z > 0)
                if (vec.z > 0) {
                    // 1. Create a "U" shaped cut-out for the face
                    // vertices near the center (x=0) and front (z>0) are pushed UP more
                    const centerFactor = Math.max(0, 1.0 - (Math.abs(vec.x) / 0.15));
                    const frontFactor = vec.z / headRadius;
                    
                    // Pull up the front-center vertices significantly to clear face
                    if (vec.z > 0.05) {
                        vec.y += centerFactor * frontFactor * 0.15;
                        vec.z -= centerFactor * frontFactor * 0.05;
                    }
                }

                // Strong forehead clearance to prevent eye coverage
                if (vec.z > 0.075) {
                    const sideFactor = 1.0 - Math.min(1.0, Math.abs(vec.x) / 0.14);
                    const targetY = 0.055 + sideFactor * 0.03;
                    if (vec.y < targetY) {
                        vec.y = targetY + (vec.y - targetY) * 0.15;
                    }
                    const pullBack = Math.max(0, (vec.z - 0.075) / (headRadius - 0.075));
                    vec.z -= pullBack * (0.055 + sideFactor * 0.02);
                }

                // 2. Sculpt back (z < 0) to cover more
                if (vec.z < 0) {
                    const backFactor = Math.abs(vec.z) / headRadius;
                    vec.y -= backFactor * 0.02; // Pull down slightly in back
                }

                // Flatten Top for the "Cut" look
                if (vec.y > 0.18) {
                    vec.y = 0.18 + (vec.y - 0.18) * 0.3; // Less flattening to close top gap
                }
                
                // Square off sides slightly
                if (Math.abs(vec.x) > 0.13) {
                    vec.x *= 0.98;
                }
                
                // Noise for texture
                const noise = (Math.random() - 0.5) * 0.003;
                vec.multiplyScalar(1.0 + noise);

                pos.setXYZ(i, vec.x, vec.y, vec.z);
            }
            capGeo.computeVertexNormals();
            
            const cap = new THREE.Mesh(capGeo, material);
            // Tilt back significantly to clear face but not too much to leave a gap
            cap.rotation.x = -0.6;
            cap.position.y = 0.04;
            cap.position.z = -0.035;
            cap.castShadow = true;
            hairGroup.add(cap);

            // 2. Side Fades / Back (Band)
            // Adjusted to be lower and more tilted to cover back while front is high
            const fadeGeo = new THREE.SphereGeometry(headRadius * 1.03, 32, 8, 0, Math.PI*2, Math.PI * 0.35, Math.PI * 0.4);
            const fade = new THREE.Mesh(fadeGeo, material);
            fade.rotation.x = -0.25;
            fade.position.y = 0.02;
            fade.position.z = -0.015;
            hairGroup.add(fade);

            // 3. Sideburns
            const sbGeo = new THREE.BoxGeometry(0.02, 0.08, 0.035);
            // Sculpt sideburns to conform to head curvature
            sbGeo.translate(0, -0.04, 0); // Pivot top

            const createSideburn = (isLeft: boolean) => {
                const sb = new THREE.Mesh(sbGeo, material);
                const side = isLeft ? 1 : -1;
                // Position in front of where ears would be
                sb.position.set(side * 0.185, 0.02, 0.08); 
                sb.rotation.y = side * 0.1; // Face forward
                sb.rotation.z = side * -0.15; // Hug head
                sb.rotation.x = -0.1;
                return sb;
            };

            hairGroup.add(createSideburn(true));
            hairGroup.add(createSideburn(false));
            
            // 4. Front Hairline Detail (Tiny jagged edge)
            // Optional: Adds a little bit of noise mesh at the front hairline
        }
    }
}
