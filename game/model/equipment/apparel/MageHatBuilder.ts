
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class MageHatBuilder {
    static build(config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();
        group.name = 'MageHat';

        const hatMat = new THREE.MeshStandardMaterial({
            color: config.mageHatColor,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        const bandMat = new THREE.MeshStandardMaterial({
            color: config.mageHatBandColor,
            roughness: 0.8,
            metalness: 0.2
        });

        const buckleMat = new THREE.MeshStandardMaterial({
            color: 0xffd700, // Gold
            metalness: 0.9,
            roughness: 0.1
        });

        // 1. BRIM
        // A wide, slightly thick disk
        const brimRadius = 0.5;
        const brimThickness = 0.02;
        const brimGeo = new THREE.CylinderGeometry(brimRadius, brimRadius, brimThickness, 32);
        
        // Add waviness to brim
        const bPos = brimGeo.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < bPos.count; i++) {
            v.fromBufferAttribute(bPos, i);
            const dist = Math.sqrt(v.x * v.x + v.z * v.z);
            if (dist > 0.25) {
                const angle = Math.atan2(v.z, v.x);
                const wave = Math.sin(angle * 5) * 0.02 * (dist / brimRadius);
                v.y += wave;
            }
            bPos.setXYZ(i, v.x, v.y, v.z);
        }
        brimGeo.computeVertexNormals();

        const brim = new THREE.Mesh(brimGeo, hatMat);
        brim.castShadow = true;
        group.add(brim);

        // 2. CROWN (CONE)
        const crownBaseRadius = 0.22;
        const crownHeight = 0.6;
        const segments = 32;
        const radialSegments = 16;
        
        const crownGeo = new THREE.CylinderGeometry(0.01, crownBaseRadius, crownHeight, radialSegments, segments, true);
        crownGeo.translate(0, crownHeight / 2, 0);

        // Sculpt the "Crooked" Tip
        const cPos = crownGeo.attributes.position;
        for (let i = 0; i < cPos.count; i++) {
            v.fromBufferAttribute(cPos, i);
            const h = v.y / crownHeight; // 0 to 1
            
            // Apply curve/bend starting halfway up
            if (h > 0.4) {
                const t = (h - 0.4) / 0.6;
                const bendAmount = Math.pow(t, 2) * 0.25;
                // Bend towards the back (+Z) and slightly to the side
                v.z += bendAmount;
                v.x += bendAmount * 0.3;
            }
            
            // Add some organic lumps
            const angle = Math.atan2(v.z, v.x);
            const noise = Math.sin(h * 15 + angle * 3) * 0.005;
            const dirX = Math.cos(angle);
            const dirZ = Math.sin(angle);
            v.x += dirX * noise;
            v.z += dirZ * noise;

            cPos.setXYZ(i, v.x, v.y, v.z);
        }
        crownGeo.computeVertexNormals();

        const crown = new THREE.Mesh(crownGeo, hatMat);
        crown.castShadow = true;
        group.add(crown);

        // 3. BAND
        const bandHeight = 0.08;
        const bandRad = crownBaseRadius + 0.01;
        const bandGeo = new THREE.CylinderGeometry(bandRad * 0.95, bandRad, bandHeight, 32, 1, false);
        bandGeo.translate(0, bandHeight / 2, 0);
        
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.y = 0.01; // Just above brim
        band.castShadow = true;
        group.add(band);

        // 4. BUCKLE
        const buckleSize = 0.06;
        const buckleThickness = 0.01;
        const buckleFrameWidth = 0.01;

        const buckleGroup = new THREE.Group();
        
        // Frame pieces
        const hBar = new THREE.BoxGeometry(buckleSize, buckleFrameWidth, buckleThickness);
        const vBar = new THREE.BoxGeometry(buckleFrameWidth, buckleSize, buckleThickness);

        const bT = new THREE.Mesh(hBar, buckleMat); bT.position.y = buckleSize / 2; buckleGroup.add(bT);
        const bB = new THREE.Mesh(hBar, buckleMat); bB.position.y = -buckleSize / 2; buckleGroup.add(bB);
        const bL = new THREE.Mesh(vBar, buckleMat); bL.position.x = -buckleSize / 2; buckleGroup.add(bL);
        const bR = new THREE.Mesh(vBar, buckleMat); bR.position.x = buckleSize / 2; buckleGroup.add(bR);

        // Center prong
        const prong = new THREE.Mesh(new THREE.BoxGeometry(buckleFrameWidth, buckleSize * 1.1, buckleThickness * 1.5), buckleMat);
        buckleGroup.add(prong);

        buckleGroup.position.set(0, bandHeight / 2 + 0.01, bandRad + 0.005);
        buckleGroup.rotation.x = -0.1; // Lean against crown
        group.add(buckleGroup);

        return group;
    }
}
