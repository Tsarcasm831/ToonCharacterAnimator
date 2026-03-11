import * as THREE from 'three';
import type { PlayerConfig } from '../../../../types';

export class CapeBuilder {
    static build(parts: any, config: PlayerConfig): { meshes: THREE.Object3D[] } | null {
        if (!config.equipment.cape) return null;

        const createdMeshes: THREE.Object3D[] = [];
        
        // --- 1. CONFIGURATION & COLORS ---
        const capeColor = config.robeColor || '#1a1a1a'; 
        const metalColor = '#d4af37'; // Antique Gold
        
        const capeMat = new THREE.MeshStandardMaterial({
            color: capeColor,
            roughness: 0.95, // Cloth is rough
            metalness: 0.1,
            side: THREE.DoubleSide,
            flatShading: false
        });
        
        const metalMat = new THREE.MeshStandardMaterial({
            color: metalColor,
            metalness: 0.9,
            roughness: 0.4
        });

        // --- 2. CALCULATE FIT (Based on TorsoBuilder/ShirtBuilder) ---
        // Torso dimensions from TorsoBuilder
        const torsoRadiusTop = 0.28;
        const torsoDepthScale = 0.65;
        
        // Detect armor bulk to prevent clipping
        let armorBulkOffset = 0.0;
        if (config.equipment.plateMail) armorBulkOffset = 0.06;
        else if (config.equipment.heavyLeatherArmor) armorBulkOffset = 0.05;
        else if (config.equipment.leatherArmor) armorBulkOffset = 0.035;
        else if (config.equipment.shirt) armorBulkOffset = 0.015;

        // Coordinates relative to TorsoContainer
        // TorsoBuilder places shoulders roughly at y=0.66
        const shoulderLevelY = 0.66; 
        
        // The Z positions for front (chain) and back (cape)
        // We multiply by depthScale because the body is an oval
        const chestSurfaceZ = (torsoRadiusTop * torsoDepthScale) + armorBulkOffset;
        const backSurfaceZ = -(torsoRadiusTop * torsoDepthScale) - armorBulkOffset;

        // --- 3. THE CAPE MESH ---
        const capeWidthTop = 0.26;
        const capeWidthBottom = 0.9;
        const capeLength = 1.18;
        const segW = 14;
        const segH = 26;

        const capeGeo = new THREE.PlaneGeometry(capeWidthBottom, capeLength, segW, segH);
        const pos = capeGeo.attributes.position;
        const v = new THREE.Vector3();

        // Manipulate vertices to create "Drape" and "Fold"
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            
            // Normalized coordinates: u (0=left, 1=right), t (0=top, 1=bottom)
            // Note: PlaneGeometry default center is 0,0. Let's remap logic.
            const t = 0.5 - (v.y / capeLength); // 0 at top, 1 at bottom
            
            // 1. Trapezoid taper (narrow at neck, wider at bottom)
            const widthScale = THREE.MathUtils.lerp(capeWidthTop / capeWidthBottom, 1.0, t);
            v.x *= widthScale;

            const absX = Math.abs(v.x);
            const maxX = Math.max(0.0001, (capeWidthBottom * widthScale) * 0.5);
            const edgeN = THREE.MathUtils.clamp(absX / maxX, 0, 1);

            // 2. Keep entire cape behind the torso.
            let zPos = backSurfaceZ - 0.06;

            // At the very top, pull center in toward neck while keeping edges back.
            if (t < 0.14) {
                const neckT = (0.14 - t) / 0.14;
                zPos += (1.0 - edgeN) * neckT * 0.016;
                zPos -= edgeN * neckT * 0.012;
                v.y += (1.0 - edgeN) * neckT * 0.02;
            } else {
                // Lower cloth falls away from body.
                zPos -= Math.pow(t - 0.14, 1.35) * 0.12;
            }

            // 3. Mild folds that grow toward the bottom.
            const fold = Math.sin((v.x / maxX) * Math.PI * 3.5 + t * 4.2) * (0.006 + t * 0.016);
            const centerDip = (1.0 - edgeN) * Math.sin(t * Math.PI) * 0.008;
            v.z = zPos + fold - centerDip;

            pos.setXYZ(i, v.x, v.y, v.z);
        }

        capeGeo.computeVertexNormals();
        
        const capeMesh = new THREE.Mesh(capeGeo, capeMat);
        // Position relative to torso container:
        // Plane center is (0,0,0). Top of plane needs to be at shoulderLevel
        capeMesh.position.set(0, shoulderLevelY - (capeLength / 2) + 0.01, -0.03);
        capeMesh.castShadow = true;
        parts.torsoContainer.add(capeMesh);
        createdMeshes.push(capeMesh);


        // --- 4. THE COLLAR (Folded cloth around neck) ---
        // Hides the transition between cape and neck
        const collarLeft = new THREE.Vector3(-0.115, shoulderLevelY + 0.018, backSurfaceZ + 0.012);
        const collarMid = new THREE.Vector3(0, shoulderLevelY + 0.038, backSurfaceZ + 0.002);
        const collarRight = new THREE.Vector3(0.115, shoulderLevelY + 0.018, backSurfaceZ + 0.012);
        const collarCurve = new THREE.CatmullRomCurve3([collarLeft, collarMid, collarRight]);
        
        const collarGeo = new THREE.TubeGeometry(collarCurve, 12, 0.032, 8, false);
        const collar = new THREE.Mesh(collarGeo, capeMat);
        parts.torsoContainer.add(collar);
        createdMeshes.push(collar);

        const collarCapGeo = new THREE.SphereGeometry(0.032, 10, 8);
        const leftCollarCap = new THREE.Mesh(collarCapGeo, capeMat);
        leftCollarCap.position.copy(collarLeft);
        parts.torsoContainer.add(leftCollarCap);
        createdMeshes.push(leftCollarCap);

        const rightCollarCap = new THREE.Mesh(collarCapGeo, capeMat);
        rightCollarCap.position.copy(collarRight);
        parts.torsoContainer.add(rightCollarCap);
        createdMeshes.push(rightCollarCap);


        // --- 5. ATTACHMENT CHAINS (Front) ---
        // Clasps (Buttons on the chest/clavicle)
        const claspSpread = 0.115;
        const claspY = shoulderLevelY + 0.003;
        const claspZ = chestSurfaceZ + 0.008;

        const claspGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
        claspGeo.rotateX(Math.PI / 2);

        [-1, 1].forEach(side => {
            const clasp = new THREE.Mesh(claspGeo, metalMat);
            clasp.position.set(side * claspSpread, claspY, claspZ);
            clasp.castShadow = true;
            parts.torsoContainer.add(clasp);
            createdMeshes.push(clasp);

            // Connect Clasp to Cape (Over the shoulder straps)
            const collarAnchor = side < 0 ? collarLeft : collarRight;
            const strapGeo = new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3([
                    new THREE.Vector3(side * claspSpread, claspY, claspZ), // Front
                    new THREE.Vector3(side * 0.13, shoulderLevelY + 0.045, chestSurfaceZ + 0.012),
                    new THREE.Vector3(collarAnchor.x, collarAnchor.y, collarAnchor.z + 0.001)
                ]), 
                8, 0.01, 6, false
            );
            const strap = new THREE.Mesh(strapGeo, capeMat);
            parts.torsoContainer.add(strap);
            createdMeshes.push(strap);
        });

        // The Chain Hanging between clasps
        const chainCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-claspSpread, claspY, claspZ + 0.01),
            new THREE.Vector3(0, claspY - 0.045, claspZ + 0.015), // Keep the chain close to the shirt cap instead of floating
            new THREE.Vector3(claspSpread, claspY, claspZ + 0.01)
        ]);
        const chainGeo = new THREE.TubeGeometry(chainCurve, 16, 0.008, 6, false);
        const chain = new THREE.Mesh(chainGeo, metalMat);
        parts.torsoContainer.add(chain);
        createdMeshes.push(chain);

        return { meshes: createdMeshes };
    }
}
