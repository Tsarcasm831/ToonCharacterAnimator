import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class CapeBuilder {
    static build(parts: any, config: PlayerConfig): { meshes: THREE.Object3D[] } | null {
        if (!config.equipment.cape) return null;
        
        const createdMeshes: THREE.Object3D[] = [];
        
        // Cape color - use robe color or default to dark red
        const capeColor = config.robeColor || '#8b0000';
        const liningColor = '#1a1a1a';
        
        const capeMat = new THREE.MeshStandardMaterial({
            color: capeColor,
            roughness: 0.7,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        const liningMat = new THREE.MeshStandardMaterial({
            color: liningColor,
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        const claspMat = new THREE.MeshStandardMaterial({
            color: '#ffd700',
            metalness: 0.9,
            roughness: 0.2
        });

        // Cape body - flowing shape using a curved plane
        // Increased width and length for better coverage
        const capeWidth = 0.65;
        const capeLength = 0.85;
        const capeGeo = new THREE.PlaneGeometry(capeWidth, capeLength, 12, 16);
        
        // Sculpt the cape shape - curve it away from the body
        const pos = capeGeo.attributes.position;
        const v = new THREE.Vector3();
        
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            
            // Taper at bottom for elegant flow
            const t = (v.y + capeLength / 2) / capeLength; // 0 at bottom, 1 at top
            v.x *= 0.5 + t * 0.5;
            
            // Curve AWAY from body (negative Z) - more pronounced curve
            // Top stays close to body, bottom flows outward
            const curveAmount = (1 - t) * 0.25;
            v.z = -curveAmount;
            
            // Add gentle wave for natural fabric look
            v.z -= Math.sin(v.x * 5) * 0.015 * (1 - t);
            
            // Slight wrap around sides at top
            if (t > 0.7) {
                const wrapFactor = (t - 0.7) / 0.3;
                v.z -= Math.abs(v.x) * wrapFactor * 0.15;
            }
            
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        capeGeo.computeVertexNormals();

        const cape = new THREE.Mesh(capeGeo, capeMat);
        // Position further back to avoid clipping with body
        cape.position.set(0, 0.05, -0.28);
        cape.rotation.x = 0.15; // Slight forward tilt
        cape.castShadow = true;
        cape.receiveShadow = true;
        
        // Add to torso container
        if (parts.torsoContainer) {
            parts.torsoContainer.add(cape);
            createdMeshes.push(cape);
        }

        // Shoulder drape - connects cape to shoulders, wraps around back
        const drapeGeo = new THREE.CylinderGeometry(0.30, 0.26, 0.06, 16, 1, true, Math.PI * 0.25, Math.PI * 1.5);
        const drape = new THREE.Mesh(drapeGeo, capeMat);
        drape.position.set(0, 0.34, -0.08);
        drape.rotation.x = -0.15;
        drape.castShadow = true;
        
        if (parts.torsoContainer) {
            parts.torsoContainer.add(drape);
            createdMeshes.push(drape);
        }

        // Clasps at front
        const claspGeo = new THREE.SphereGeometry(0.025, 8, 8);
        
        [-1, 1].forEach(side => {
            const clasp = new THREE.Mesh(claspGeo, claspMat);
            clasp.position.set(side * 0.18, 0.32, 0.15);
            clasp.scale.set(1, 1, 0.5);
            
            if (parts.torsoContainer) {
                parts.torsoContainer.add(clasp);
                createdMeshes.push(clasp);
            }
            
            // Chain link between clasps
            if (side === 1) {
                const chainGeo = new THREE.TorusGeometry(0.15, 0.008, 4, 16, Math.PI);
                const chain = new THREE.Mesh(chainGeo, claspMat);
                chain.position.set(0, 0.28, 0.18);
                chain.rotation.x = Math.PI / 2;
                chain.rotation.z = Math.PI;
                
                if (parts.torsoContainer) {
                    parts.torsoContainer.add(chain);
                    createdMeshes.push(chain);
                }
            }
        });

        return { meshes: createdMeshes };
    }
}
