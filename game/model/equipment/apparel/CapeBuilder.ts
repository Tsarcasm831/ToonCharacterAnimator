import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

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
        const capeWidthTop = 0.35; // Neck width
        const capeWidthBottom = 1.0; // Flared bottom
        const capeLength = 1.25;
        const segW = 12;
        const segH = 24;

        const capeGeo = new THREE.PlaneGeometry(capeWidthBottom, capeLength, segW, segH);
        const pos = capeGeo.attributes.position;
        const v = new THREE.Vector3();

        // Manipulate vertices to create "Drape" and "Fold"
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            
            // Normalized coordinates: u (0=left, 1=right), t (0=top, 1=bottom)
            // Note: PlaneGeometry default center is 0,0. Let's remap logic.
            const t = 0.5 - (v.y / capeLength); // 0 at top, 1 at bottom
            
            // 1. Tapering (Trapezoid shape)
            // Interpolate width from top to bottom
            const currentWidthScale = THREE.MathUtils.lerp(capeWidthTop / capeWidthBottom, 1.0, t);
            v.x *= currentWidthScale;

            // 2. The "Over the Shoulder" Curve
            // We want the top to curve forward (Z+) to rest on traps, then fall back (Z-)
            
            // Base Z is the back of the armor
            let zPos = backSurfaceZ - 0.02; // Slight air gap

            if (t < 0.15) {
                // Top 15% curves forward to meet the neck/shoulders
                // 0.0 = Neck, 0.15 = Shoulder Blade drop off
                const neckFactor = (0.15 - t) / 0.15; // 1 at top, 0 at shoulder
                zPos += Math.sin(neckFactor * Math.PI * 0.5) * 0.12; 
                
                // Lift Y slightly at the neck for "bunching"
                v.y += neckFactor * 0.05;
            } else {
                // Gravity takes over below the shoulders
                // Add a slight curve outward at the bottom for dramatic effect
                zPos -= Math.pow(t - 0.15, 2) * 0.2; 
            }

            // 3. Folds and Ripples
            // Sine wave based on X creates vertical folds
            // We dampen the folds at the top (tight against neck) and amplify at bottom
            const foldAmp = 0.04 * t; 
            const foldFreq = 12.0;
            const fold = Math.sin(v.x * foldFreq) * foldAmp;
            
            // 4. Wind/Motion Sway (Static for now, but lively)
            const sway = Math.sin(t * 3) * 0.05;

            v.z = zPos + fold - sway;

            pos.setXYZ(i, v.x, v.y, v.z);
        }

        capeGeo.computeVertexNormals();
        
        const capeMesh = new THREE.Mesh(capeGeo, capeMat);
        // Position relative to torso container:
        // Plane center is (0,0,0). Top of plane needs to be at shoulderLevel
        capeMesh.position.set(0, shoulderLevelY - (capeLength/2) + 0.05, 0);
        capeMesh.castShadow = true;
        parts.torsoContainer.add(capeMesh);
        createdMeshes.push(capeMesh);


        // --- 4. THE COLLAR (Folded cloth around neck) ---
        // Hides the transition between cape and neck
        const collarCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.16, shoulderLevelY + 0.04, backSurfaceZ + 0.06), // Left Shoulder
            new THREE.Vector3(0, shoulderLevelY + 0.06, backSurfaceZ + 0.04),     // Back Neck (High)
            new THREE.Vector3(0.16, shoulderLevelY + 0.04, backSurfaceZ + 0.06),  // Right Shoulder
        ]);
        
        const collarGeo = new THREE.TubeGeometry(collarCurve, 12, 0.04, 8, false);
        const collar = new THREE.Mesh(collarGeo, capeMat);
        parts.torsoContainer.add(collar);
        createdMeshes.push(collar);


        // --- 5. ATTACHMENT CHAINS (Front) ---
        // Clasps (Buttons on the chest/clavicle)
        const claspSpread = 0.14;
        const claspY = shoulderLevelY - 0.06;
        const claspZ = chestSurfaceZ + 0.01;

        const claspGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
        claspGeo.rotateX(Math.PI / 2);

        [-1, 1].forEach(side => {
            const clasp = new THREE.Mesh(claspGeo, metalMat);
            clasp.position.set(side * claspSpread, claspY, claspZ);
            clasp.castShadow = true;
            parts.torsoContainer.add(clasp);
            createdMeshes.push(clasp);

            // Connect Clasp to Cape (Over the shoulder straps)
            const strapGeo = new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3([
                    new THREE.Vector3(side * claspSpread, claspY, claspZ), // Front
                    new THREE.Vector3(side * 0.18, shoulderLevelY + 0.05, 0), // Top Shoulder (Peak)
                    new THREE.Vector3(side * 0.12, shoulderLevelY, backSurfaceZ + 0.05) // Back connect
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
            new THREE.Vector3(0, claspY - 0.1, claspZ + 0.025), // Hangs down with gravity
            new THREE.Vector3(claspSpread, claspY, claspZ + 0.01)
        ]);
        const chainGeo = new THREE.TubeGeometry(chainCurve, 16, 0.008, 6, false);
        const chain = new THREE.Mesh(chainGeo, metalMat);
        parts.torsoContainer.add(chain);
        createdMeshes.push(chain);

        return { meshes: createdMeshes };
    }
}