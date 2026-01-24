
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

        const baseColor = config.robeColor || '#2d3c50'; 
        const trimColor = config.robeTrimColor || '#d4af37'; 
        
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

        const trimMat = new THREE.MeshStandardMaterial({
            color: trimColor,
            roughness: 0.6,
            metalness: 0.3
        });
        
        const sashMat = new THREE.MeshStandardMaterial({ 
            color: baseColor, 
            roughness: 1.0
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
        const torsoRadiusTop = 0.31; 
        const torsoRadiusBottom = 0.32; 
        const robeLen = 0.62; // Increased slightly for better coverage
        const torsoDepthScale = 0.75;

        const robeTorsoGeo = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, robeLen, 32, 8, false); // Closed top for better blending
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

            // Taper neck in to ensure it goes under hood/mantle
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

        // --- SHOULDER CAP (Like ShirtBuilder) ---
        // Simple hemisphere cap that covers the shoulders smoothly
        const capGeo = new THREE.SphereGeometry(torsoRadiusTop * layerScale, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        capGeo.scale(1, 0.5, torsoDepthScale);
        const shoulderCap = new THREE.Mesh(capGeo, robeMat);
        shoulderCap.position.y = robeLen / 2;
        robeTorso.add(shoulderCap);
        createdMeshes.push(shoulderCap);
        scaleUVs(shoulderCap, torsoRadiusTop * layerScale, torsoRadiusTop * layerScale);

        // Collar/Neck Trim - decorative ring around the neckline
        const collarRadius = torsoRadiusTop * layerScale * 0.45;
        const collarGeo = new THREE.TorusGeometry(collarRadius, 0.035, 8, 32);
        collarGeo.scale(1, 1, torsoDepthScale * 0.9);
        
        const collar = new THREE.Mesh(collarGeo, trimMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = robeLen / 2 + 0.12;
        robeTorso.add(collar);
        createdMeshes.push(collar);

        // --- SASH (BELT) ---
        // Thick cloth belt to hide the seam between upper/lower and cinch the waist
        const sashGeo = new THREE.TorusGeometry(torsoRadiusBottom * layerScale * 0.95, 0.06, 8, 32);
        sashGeo.scale(1, 1, torsoDepthScale);
        
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
            
            scaleUVs(sleeve, (sRadTop+sRadBot)/2, sLen);
            arm.add(sleeve);
            createdMeshes.push(sleeve);
        });


        // --- LOWER ROBE (SKIRT) ---
        // Attached to Pelvis. 
        // Improved design with better coverage and flow
        if (parts.pelvis) {
            const skirtLen = 0.70; // Longer for better coverage
            const skirtTopRad = torsoRadiusBottom * layerScale * 1.0;
            const skirtBotRad = skirtTopRad * 1.6; // More flare for flowing look

            // Full cylinder skirt with front slit for leg movement
            const skirtGeo = new THREE.CylinderGeometry(
                skirtTopRad, 
                skirtBotRad, 
                skirtLen, 
                32, 
                6, 
                true, // open ended
                0.4, // thetaStart (smaller gap)
                Math.PI * 2 - 0.8 // thetaLength (larger coverage)
            );
            skirtGeo.scale(1, 1, torsoDepthScale);

            // Add slight wave to bottom edge for natural fabric look
            const skirtPos = skirtGeo.attributes.position;
            const sv = new THREE.Vector3();
            for (let i = 0; i < skirtPos.count; i++) {
                sv.fromBufferAttribute(skirtPos, i);
                // Only affect bottom half
                if (sv.y < 0) {
                    const t = Math.abs(sv.y) / (skirtLen / 2);
                    // Add wave based on angle
                    const angle = Math.atan2(sv.z, sv.x);
                    sv.y -= Math.sin(angle * 4) * 0.02 * t;
                }
                skirtPos.setXYZ(i, sv.x, sv.y, sv.z);
            }
            skirtGeo.computeVertexNormals();

            const skirt = new THREE.Mesh(skirtGeo, robeMat);
            skirt.name = 'RobeSkirt';
            skirt.position.y = -skirtLen/2 + 0.04; 
            skirt.castShadow = true;

            scaleUVs(skirt, skirtBotRad, skirtLen);
            parts.pelvis.add(skirt);
            createdMeshes.push(skirt);

            // Front panel/tabard - wider and with trim
            const tabardWidth = 0.30;
            const tabardLen = skirtLen * 0.95;
            const tabardGeo = new THREE.PlaneGeometry(tabardWidth, tabardLen, 4, 8);
            
            // Add slight curve to tabard
            const tabPos = tabardGeo.attributes.position;
            const tv = new THREE.Vector3();
            for (let i = 0; i < tabPos.count; i++) {
                tv.fromBufferAttribute(tabPos, i);
                // Curve outward at bottom
                const t = (tv.y + tabardLen/2) / tabardLen;
                tv.z = (1 - t) * 0.08;
                // Slight taper at bottom
                tv.x *= 0.85 + t * 0.15;
                tabPos.setXYZ(i, tv.x, tv.y, tv.z);
            }
            tabardGeo.computeVertexNormals();
            
            const tabard = new THREE.Mesh(tabardGeo, robeMat);
            tabard.position.set(0, -tabardLen/2 + 0.04, skirtTopRad * torsoDepthScale + 0.02);
            tabard.rotation.x = -0.08;
            parts.pelvis.add(tabard);
            createdMeshes.push(tabard);

            // Trim on tabard edges
            const trimGeo = new THREE.BoxGeometry(0.02, tabardLen, 0.01);
            const leftTrim = new THREE.Mesh(trimGeo, trimMat);
            leftTrim.position.set(-tabardWidth/2, 0, 0.01);
            tabard.add(leftTrim);
            createdMeshes.push(leftTrim);
            
            const rightTrim = new THREE.Mesh(trimGeo, trimMat);
            rightTrim.position.set(tabardWidth/2, 0, 0.01);
            tabard.add(rightTrim);
            createdMeshes.push(rightTrim);
        }

        return { meshes: createdMeshes };
    }
}
