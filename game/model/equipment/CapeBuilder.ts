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
        const torsoRadiusTop = 0.28, torsoRadiusBottom = 0.22;
        const torsoDepthScale = 0.65;
        const torsoLen = 0.56;
        
        const capeWidth = 0.6;
        const capeLength = 0.9;
        const capeGeo = new THREE.PlaneGeometry(capeWidth, capeLength, 14, 18);
        
        // Sculpt the cape shape - curve it away from the body
        const pos = capeGeo.attributes.position;
        const v = new THREE.Vector3();
        
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            // Taper at bottom for elegant flow
            const t = (v.y + capeLength / 2) / capeLength; // 0 at bottom, 1 at top
            v.x *= 0.5 + t * 0.5;

            // Shirt logic reference (TorsoBuilder.ts)
            // Torso is at y = torsoLen / 2 + 0.1
            // Torso radius top is 0.28, depth scale 0.65
            const surfaceZ = torsoRadiusTop * torsoDepthScale;
            const spineZ = -surfaceZ - 0.04; // hug upper back

            // Curve away from body with slight flare at bottom
            const flare = (1 - t) * 0.28;
            v.z = spineZ - flare;

            // Gentle folds that relax toward the hem
            const fold = Math.sin((v.x + 0.2) * 6 + t * 2) * 0.02 * (1 - t * 0.6);
            v.z += fold;

            // Wrap toward shoulders near the top so it follows traps
            if (t > 0.6) {
                const wrapFactor = (t - 0.6) / 0.4;
                v.x *= 0.9 - wrapFactor * 0.25;
                v.z -= Math.abs(v.x) * wrapFactor * 0.08;
            }

            // Subtle forward tuck near the neck to avoid floating behind
            if (t > 0.85) {
                const tuck = (t - 0.85) / 0.15;
                v.z += tuck * 0.04;
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        capeGeo.computeVertexNormals();

        const cape = new THREE.Mesh(capeGeo, capeMat);
        // Position relative to torso origin
        // TorsoBuilder: torso.position.y = torsoLen / 2 + 0.1;
        cape.position.set(0, torsoLen / 2 + 0.08, -0.02);
        cape.rotation.x = -0.05; // hang along spine with slight back lean
        cape.castShadow = true;
        cape.receiveShadow = true;
        
        // Add to torso container
        if (parts.torsoContainer) {
            parts.torsoContainer.add(cape);
            createdMeshes.push(cape);
        }

        // Shoulder drape - softer collar that hugs the traps
        const drapeGeo = new THREE.TorusGeometry(0.32, 0.02, 10, 28, Math.PI);
        const drape = new THREE.Mesh(drapeGeo, capeMat);
        drape.position.set(0, torsoLen + 0.09, 0.02);
        drape.rotation.set(Math.PI / 2.2, 0, Math.PI);
        drape.castShadow = true;

        if (parts.torsoContainer) {
            parts.torsoContainer.add(drape);
            createdMeshes.push(drape);
        }

        // Collar fold for extra thickness at the anchor point
        const collarGeo = new THREE.BoxGeometry(0.5, 0.05, 0.08);
        const collar = new THREE.Mesh(collarGeo, liningMat);
        collar.position.set(0, torsoLen + 0.08, -0.02);
        collar.rotation.x = -0.2;
        collar.castShadow = true;
        if (parts.torsoContainer) {
            parts.torsoContainer.add(collar);
            createdMeshes.push(collar);
        }

        // Clasps at front
        const claspGeo = new THREE.SphereGeometry(0.025, 8, 8);
        
        [-1, 1].forEach(side => {
            const clasp = new THREE.Mesh(claspGeo, claspMat);
            // Positioned on the front of the shoulders
            clasp.position.set(side * 0.2, torsoLen + 0.1, 0.18);
            clasp.scale.set(1, 1, 0.5);
            
            if (parts.torsoContainer) {
                parts.torsoContainer.add(clasp);
                createdMeshes.push(clasp);
            }
            
            // Chain link between clasps
            if (side === 1) {
                const chainGeo = new THREE.TorusGeometry(0.18, 0.008, 4, 16, Math.PI);
                const chain = new THREE.Mesh(chainGeo, claspMat);
                chain.position.set(0, torsoLen + 0.08, 0.22);
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
