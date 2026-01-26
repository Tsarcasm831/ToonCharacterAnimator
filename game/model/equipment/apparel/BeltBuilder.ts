import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

const LEATHER_COLOR = '#3e2723';
const BUCKLE_COLOR = '#ffd700';

export class BeltBuilder {
    static build(parts: any, config: PlayerConfig): { meshes: THREE.Object3D[] } | null {
        if (!config.equipment.belt) return null;
        
        const createdMeshes: THREE.Object3D[] = [];
        
        const leatherMat = new THREE.MeshStandardMaterial({
            color: LEATHER_COLOR,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const buckleMat = new THREE.MeshStandardMaterial({
            color: BUCKLE_COLOR,
            metalness: 0.9,
            roughness: 0.2
        });

        // Main belt band
        const beltRadius = 0.24;
        const beltWidth = 0.06;
        const beltGeo = new THREE.CylinderGeometry(beltRadius, beltRadius, beltWidth, 24, 1, true);
        beltGeo.scale(1, 1, 0.7); // Flatten for body shape
        
        const belt = new THREE.Mesh(beltGeo, leatherMat);
        belt.position.set(0, 0.08, 0);
        belt.castShadow = true;
        
        if (parts.torsoContainer) {
            parts.torsoContainer.add(belt);
            createdMeshes.push(belt);
        }

        // Belt buckle - rectangular frame
        const buckleGroup = new THREE.Group();
        
        // Outer frame
        const frameGeo = new THREE.BoxGeometry(0.08, 0.07, 0.015);
        const frame = new THREE.Mesh(frameGeo, buckleMat);
        buckleGroup.add(frame);
        
        // Inner cutout (darker)
        const innerMat = new THREE.MeshStandardMaterial({
            color: '#1a1a1a',
            roughness: 0.9
        });
        const innerGeo = new THREE.BoxGeometry(0.05, 0.04, 0.016);
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.position.z = 0.001;
        buckleGroup.add(inner);
        
        // Prong
        const prongGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.05, 6);
        const prong = new THREE.Mesh(prongGeo, buckleMat);
        prong.rotation.z = Math.PI / 2;
        prong.position.set(0.01, 0, 0.008);
        buckleGroup.add(prong);
        
        buckleGroup.position.set(0, 0.08, beltRadius * 0.7 + 0.01);
        
        if (parts.torsoContainer) {
            parts.torsoContainer.add(buckleGroup);
            createdMeshes.push(buckleGroup);
        }

        // Belt loops/studs
        const studGeo = new THREE.SphereGeometry(0.012, 6, 6);
        const numStuds = 8;
        
        for (let i = 0; i < numStuds; i++) {
            const angle = (i / numStuds) * Math.PI * 2;
            // Skip front where buckle is
            if (Math.abs(angle - Math.PI / 2) < 0.5) continue;
            
            const stud = new THREE.Mesh(studGeo, buckleMat);
            const x = Math.sin(angle) * beltRadius;
            const z = Math.cos(angle) * beltRadius * 0.7;
            stud.position.set(x, 0.08, z);
            stud.scale.set(1, 1, 0.5);
            
            if (parts.torsoContainer) {
                parts.torsoContainer.add(stud);
                createdMeshes.push(stud);
            }
        }

        // Belt pouch on side
        const pouchGeo = new THREE.BoxGeometry(0.06, 0.08, 0.04);
        const pouch = new THREE.Mesh(pouchGeo, leatherMat);
        pouch.position.set(-beltRadius * 0.9, 0.04, 0.05);
        pouch.rotation.y = 0.3;
        pouch.castShadow = true;
        
        if (parts.torsoContainer) {
            parts.torsoContainer.add(pouch);
            createdMeshes.push(pouch);
        }
        
        // Pouch flap
        const flapGeo = new THREE.BoxGeometry(0.065, 0.02, 0.045);
        const flap = new THREE.Mesh(flapGeo, leatherMat);
        flap.position.set(0, 0.04, 0);
        flap.rotation.x = -0.2;
        pouch.add(flap);

        return { meshes: createdMeshes };
    }
}
