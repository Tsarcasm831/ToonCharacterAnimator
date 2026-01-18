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
        const capeWidth = 0.7;
        const capeLength = 0.9;
        const capeGeo = new THREE.PlaneGeometry(capeWidth, capeLength, 8, 12);
        
        // Sculpt the cape shape
        const pos = capeGeo.attributes.position;
        const v = new THREE.Vector3();
        
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            
            // Taper at bottom
            const t = (v.y + capeLength / 2) / capeLength; // 0 at bottom, 1 at top
            v.x *= 0.6 + t * 0.4;
            
            // Curve outward at bottom
            v.z = (1 - t) * 0.15;
            
            // Add slight wave
            v.z += Math.sin(v.x * 4) * 0.02 * (1 - t);
            
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        capeGeo.computeVertexNormals();

        const cape = new THREE.Mesh(capeGeo, capeMat);
        cape.position.set(0, -0.1, -0.22);
        cape.rotation.x = 0.1;
        cape.castShadow = true;
        cape.receiveShadow = true;
        
        // Add to torso container
        if (parts.torsoContainer) {
            parts.torsoContainer.add(cape);
            createdMeshes.push(cape);
        }

        // Shoulder drape - connects cape to shoulders
        const drapeGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.08, 16, 1, true, Math.PI * 0.3, Math.PI * 1.4);
        const drape = new THREE.Mesh(drapeGeo, capeMat);
        drape.position.set(0, 0.32, -0.05);
        drape.rotation.x = -0.2;
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
