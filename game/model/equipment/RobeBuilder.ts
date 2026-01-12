import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const GLOBAL_PATTERN_SCALE = 3.5;

export class RobeBuilder {
    static build(parts: any, config: PlayerConfig) {
        // Only build if a robe is equipped
        if (!config.equipment.robe) return null;

        // --- TEXTURE GENERATION ---
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const baseColor = config.robeColor || '#2c2c2c'; // Dark grey default
        const trimColor = config.robeTrimColor || '#d4af37'; // Gold default
        
        // Base Fabric
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);

        // Fabric Weave Noise
        ctx.globalAlpha = 0.08;
        for(let i=0; i<8000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 4); // Vertical weave
        }

        // Center Trim (The opening of the robe)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = trimColor;
        const trimWidth = 40;
        // Front opening trim
        ctx.fillRect(256 - trimWidth/2, 0, trimWidth, 512); 
        // Bottom hem
        ctx.fillRect(0, 512 - 40, 512, 40);

        const robeTex = new THREE.CanvasTexture(canvas);
        robeTex.wrapS = THREE.RepeatWrapping;
        robeTex.wrapT = THREE.RepeatWrapping;

        const robeMat = new THREE.MeshToonMaterial({ 
            map: robeTex,
            side: THREE.DoubleSide // Important for open sleeves/skirt
        });

        const scaleUVs = (mesh: THREE.Mesh, radius: number, height: number) => {
            const geo = mesh.geometry;
            const uvAttribute = geo.attributes.uv;
            if (!uvAttribute) return;
            const uScale = (2 * Math.PI * radius) * GLOBAL_PATTERN_SCALE;
            const vScale = height * GLOBAL_PATTERN_SCALE;
            for (let i = 0; i < uvAttribute.count; i++) {
                uvAttribute.setXY(i, uvAttribute.getX(i) * uScale, uvAttribute.getY(i) * vScale);
            }
            uvAttribute.needsUpdate = true;
        };

        const createdMeshes: THREE.Object3D[] = [];
        const layerScale = 1.15; // Fits over Shirt (1.0) and Pants (1.06)

        // --- UPPER BODY (Torso) ---
        const torsoRadiusTop = 0.31; // Slightly narrower at top to tuck under hood
        const torsoRadiusBottom = 0.32; 
        const robeLen = 0.60; // Slightly longer than shirt
        const torsoDepthScale = 0.75;

        const robeTorsoGeo = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, robeLen, 32, 8, true); // Open ended
        robeTorsoGeo.scale(layerScale, 1, torsoDepthScale * layerScale);
        
        // Vertices Manipulation: Open the front slightly (V-Shape)
        const pos = robeTorsoGeo.attributes.position;
        const v = new THREE.Vector3();
        
        for(let i=0; i<pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            
            // Adjust breast area for females (Must be larger than ShirtBuilder deformation)
            if (config.bodyType === 'female') {
                const breastY = 0.15;
                const breastX = 0.11;
                const radius = 0.18; // Wider radius than shirt
                const amount = 0.095; // Push out more than shirt

                if (v.z > 0) {
                    const distL = Math.sqrt(Math.pow(v.x - breastX, 2) + Math.pow(v.y - breastY, 2));
                    const distR = Math.sqrt(Math.pow(v.x + breastX, 2) + Math.pow(v.y - breastY, 2));
                    
                    let push = 0;
                    if (distL < radius) push = Math.cos((distL/radius) * (Math.PI/2));
                    else if (distR < radius) push = Math.cos((distR/radius) * (Math.PI/2));
                    
                    if (push > 0) {
                        v.z += push * amount; 
                        v.y -= push * 0.01;
                    }
                }
            }

            // Taper neck in to ensure it goes under hood
            if (v.y > robeLen/2 - 0.1) {
                const t = (v.y - (robeLen/2 - 0.1)) / 0.1;
                v.x *= (1.0 - t * 0.1);
                v.z *= (1.0 - t * 0.1);
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }
        robeTorsoGeo.computeVertexNormals();

        const robeTorso = new THREE.Mesh(robeTorsoGeo, robeMat);
        robeTorso.position.y = parts.torso?.position?.y ?? 0.38;
        robeTorso.castShadow = true;
        
        scaleUVs(robeTorso, torsoRadiusBottom * layerScale, robeLen);
        parts.torsoContainer.add(robeTorso);
        createdMeshes.push(robeTorso);

        // --- SASH (BELT) ---
        // Thick cloth belt to hide the seam between upper/lower and cinch the waist
        const sashGeo = new THREE.TorusGeometry(torsoRadiusBottom * layerScale * 0.95, 0.06, 8, 32);
        sashGeo.scale(1, 1, torsoDepthScale);
        const sashMat = new THREE.MeshStandardMaterial({ 
            color: baseColor, // Same as robe but darker/standard mat for contrast
            roughness: 1.0
        });
        const sash = new THREE.Mesh(sashGeo, sashMat);
        sash.position.y = -robeLen/2 + 0.05;
        sash.rotation.x = Math.PI/2;
        robeTorso.add(sash);
        createdMeshes.push(sash);


        // --- WIDE SLEEVES ---
        const armPairs = [{ arm: parts.rightArm }, { arm: parts.leftArm }];
        armPairs.forEach(({ arm }) => {
            if (!arm) return;
            // Wizard sleeve: Narrow at shoulder, wide at wrist
            const sLen = 0.35; // Longer than arm to hang over hand slightly
            const sRadTop = 0.14;
            const sRadBot = 0.22; // Bell shape

            const sleeveGeo = new THREE.CylinderGeometry(sRadTop, sRadBot, sLen, 16, 1, true);
            sleeveGeo.translate(0, -sLen * 0.4, 0); // Offset so it starts at shoulder

            const sleeve = new THREE.Mesh(sleeveGeo, robeMat);
            sleeve.castShadow = true;
            
            // Rotate sleeve slightly back to simulate gravity if arms are T-pose
            // If arms animate, this moves with them.
            
            scaleUVs(sleeve, (sRadTop+sRadBot)/2, sLen);
            arm.add(sleeve);
            createdMeshes.push(sleeve);
        });


        // --- LOWER ROBE (SKIRT) ---
        // Attached to Pelvis. 
        // Designed as a split skirt (Front open) to prevent clipping when running.
        if (parts.pelvis) {
            const skirtLen = 0.65; // Down to shins
            const skirtTopRad = torsoRadiusBottom * layerScale * 0.92;
            const skirtBotRad = skirtTopRad * 1.4; // Flared bottom

            // We create a C-shape (cylinder with a slice missing for the front)
            const skirtGeo = new THREE.CylinderGeometry(
                skirtTopRad, 
                skirtBotRad, 
                skirtLen, 
                32, 
                4, 
                true, // open ended
                0.6, // thetaStart (leaves front gap)
                Math.PI * 2 - 1.2 // thetaLength
            );
            skirtGeo.scale(1, 1, torsoDepthScale);

            const skirt = new THREE.Mesh(skirtGeo, robeMat);
            skirt.position.y = -skirtLen/2 - 0.1; // Hangs from hips
            skirt.castShadow = true;

            scaleUVs(skirt, skirtBotRad, skirtLen);
            parts.pelvis.add(skirt);
            createdMeshes.push(skirt);

            // Optional: Front Tabard/Loincloth part to cover the groin but allow leg movement
            const tabardWidth = 0.25;
            const tabardGeo = new THREE.PlaneGeometry(tabardWidth, skirtLen);
            const tabard = new THREE.Mesh(tabardGeo, robeMat);
            tabard.position.set(0, -skirtLen/2 - 0.1, skirtTopRad * torsoDepthScale - 0.02);
            tabard.rotation.x = -0.05; // Slight angle out
            parts.pelvis.add(tabard);
            createdMeshes.push(tabard);
        }

        return { meshes: createdMeshes };
    }
}