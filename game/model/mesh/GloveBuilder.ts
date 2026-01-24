import * as THREE from 'three';
export class GloveBuilder {
    static create(isLeft: boolean, arrays: any) {
        const glove = new THREE.Group();

        // --- MATERIALS ---
        // Dark leather texture
        const leatherMat = new THREE.MeshStandardMaterial({
            color: 0x3b2618, // Dark brown from image
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        // Metal for the ring/buckles
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        });

        const sideMult = isLeft ? -1 : 1;
        
        // INFLATION FACTOR: How thick the glove is
        const fitOffset = 0.005; 
        const fingerFitOffset = 1.15; // Scale multiplier for cylinders

        // 1. GAUNTLET / BRACER (The arm covering)
        // Extends upwards (Y+) from the wrist
        const bracerHeight = 0.14;
        const bracerGeo = new THREE.CylinderGeometry(0.055, 0.045, bracerHeight, 16);
        // Shift up so bottom is at wrist
        bracerGeo.translate(0, bracerHeight / 2 - 0.02, 0); 
        
        const bracer = new THREE.Mesh(bracerGeo, leatherMat);
        bracer.castShadow = true;
        glove.add(bracer);

        // Bracer Rim (Top detail)
        const rimGeo = new THREE.TorusGeometry(0.055, 0.004, 8, 24);
        rimGeo.rotateX(Math.PI / 2);
        rimGeo.translate(0, bracerHeight - 0.02, 0);
        const rim = new THREE.Mesh(rimGeo, leatherMat);
        glove.add(rim);

        // Metal Ring Detail (from image, usually on the outside/back of wrist)
        const ringGeo = new THREE.TorusGeometry(0.015, 0.003, 8, 16);
        const ringMesh = new THREE.Mesh(ringGeo, metalMat);
        // Position on the "back" of the wrist (Z-)
        ringMesh.position.set(0, 0.02, -0.048);
        ringMesh.rotation.y = Math.PI / 4;
        glove.add(ringMesh);

        // 2. PALM (Glove Body)
        // We match HandBuilder dims but add the fitOffset
        const palmW = 0.08 + (fitOffset * 2);
        const palmH = 0.09 + (fitOffset * 2);
        const palmD = 0.03 + (fitOffset * 2);

        const palmGeo = new THREE.BoxGeometry(palmW, palmH, palmD, 4, 4, 2);
        const pPos = palmGeo.attributes.position;
        const v = new THREE.Vector3();
        const safeSqrt = (val: number) => Math.sqrt(Math.max(0, val));

        // --- COPYING HANDBUILDER DEFORMATION LOGIC ---
        // We run the exact same math so the glove mimics the skin shape
        for (let i = 0; i < pPos.count; i++) {
            v.fromBufferAttribute(pPos, i);

            const nx = v.x / (palmW / 2);
            const ny = v.y / (palmH / 2);
            const nz = v.z / (palmD / 2);

            // 1. Spherize
            const sphereFactor = 0.5;
            const ex = v.x * safeSqrt(1 - (ny * ny) / 2 - (nz * nz) / 2);
            const ey = v.y * safeSqrt(1 - (nz * nz) / 2 - (nx * nx) / 2);
            const ez = v.z * safeSqrt(1 - (nx * nx) / 2 - (ny * ny) / 2);

            v.x = v.x * (1 - sphereFactor) + ex * sphereFactor;
            v.y = v.y * (1 - sphereFactor) + ey * sphereFactor;
            v.z = v.z * (1 - sphereFactor) + ez * sphereFactor;

            // 2. Taper
            if (ny > 0) {
                v.x *= 0.85 + (1 - ny) * 0.15;
            } else {
                v.x *= 1.05;
            }

            // 3. Hollows (We reduce the intensity slightly so it bridges the gap)
            const distFromCenter = Math.sqrt(nx * nx + ny * ny);
            if (distFromCenter < 0.8) {
                if (nz > 0) v.z -= 0.006 * (1 - distFromCenter);
                else v.z += 0.003 * (1 - distFromCenter);
            }

            pPos.setXYZ(i, v.x, v.y, v.z);
        }

        palmGeo.computeVertexNormals();
        // Same pivot shift as hand
        palmGeo.translate(0, -palmH / 2 + 0.01, 0);

        const palm = new THREE.Mesh(palmGeo, leatherMat);
        palm.castShadow = true;
        glove.add(palm);

        // 3. FINGERLESS GLOVES (Proximal Only)
        // HandBuilder Ref: const fLengths = [0.085, 0.095, 0.088, 0.07]; 
        const fWidth = 0.019;
        const fDepth = 0.021;
        const depthScale = fDepth / fWidth;
        const knuckleY = -0.075;
        const startX = 0.032 * sideMult;
        const spacing = 0.022 * sideMult;

        // We only cover the proximal phalanx, and cut it short (fingerless)
        const fLengths = [0.085, 0.095, 0.088, 0.07];

        for (let i = 0; i < 4; i++) {
            const fGroup = new THREE.Group();
            const xPos = startX - (i * spacing);
            const yOffset = Math.abs(i - 1.5) * -0.002;

            fGroup.position.set(xPos, knuckleY + yOffset, 0);

            // Glove Proximal Phalanx
            // Logic: Wider (fingerFitOffset) but only 40% length of full finger
            const pLen = fLengths[i] * 0.45; 
            const pRadius = (fWidth * 0.5) * fingerFitOffset;
            
            // Open-ended cylinder (openEnded: true) to look like cut leather
            const pGeo = new THREE.CylinderGeometry(pRadius, pRadius * 0.9, pLen, 8, 1, true);
            pGeo.scale(1, 1, depthScale);
            pGeo.translate(0, -pLen / 2, 0); // Pivot at knuckle
            
            // Add thickness to the "cut" using a Ring or just double siding the material
            // Simple approach: A slightly smaller inner cylinder for thickness?
            // For optimization, we rely on DoubleSide material.

            const prox = new THREE.Mesh(pGeo, leatherMat);
            prox.castShadow = true;
            prox.name = 'proximal';

            // Knuckle Pad (Leather bulge on knuckle)
            const knuckGeo = new THREE.SphereGeometry(pRadius * 1.1, 8, 8, 0, Math.PI * 2, 0, Math.PI/2);
            const knuckle = new THREE.Mesh(knuckGeo, leatherMat);
            prox.add(knuckle);

            fGroup.add(prox);
            glove.add(fGroup);

            // Add to animation arrays so they move with the real fingers
            if (!isLeft) arrays.rightFingers.push(fGroup);
            else arrays.leftFingers.push(fGroup);
        }

        // 4. THUMB (Fingerless)
        const thumbGroup = new THREE.Group();
        thumbGroup.position.set(0.042 * sideMult, -0.035, 0.03);
        thumbGroup.rotation.set(0.1, -0.4 * sideMult, 0.8 * sideMult);

        // Thumb Proximal Glove
        const tLen1 = 0.05 * 0.7; // Cut short
        const tGeo1 = new THREE.CylinderGeometry(0.012 * fingerFitOffset, 0.011 * fingerFitOffset, tLen1, 8, 1, true);
        tGeo1.translate(0, -tLen1 / 2, 0);
        
        const tProx = new THREE.Mesh(tGeo1, leatherMat);
        tProx.castShadow = true;
        tProx.name = 'proximal';
        thumbGroup.add(tProx);
        glove.add(thumbGroup);

        if (!isLeft) arrays.rightThumb = thumbGroup;
        else arrays.leftThumb = thumbGroup;

        // 5. THENAR EMINENCE (Muscle pad cover)
        // Slightly larger sphere
        const muscle = new THREE.Mesh(new THREE.SphereGeometry(0.028 * 1.05, 8, 8), leatherMat);
        muscle.position.set(0.035 * sideMult, -0.05, 0.025);
        muscle.scale.set(0.8, 1.3, 0.7);
        muscle.rotation.z = 0.4 * sideMult;
        glove.add(muscle);

        if (arrays.thenars) arrays.thenars.push(muscle);

        return glove;
    }
}
