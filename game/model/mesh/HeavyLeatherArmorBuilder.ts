
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const LEATHER_MAIN = '#6d4c41'; // Medium Brown
const LEATHER_DARK = '#4e342e'; // Dark Brown
const GOLD_STUD = '#ffd700';

export class HeavyLeatherArmorBuilder {
    static build(parts: any, config: PlayerConfig) {
        // --- TEXTURE GENERATION ---
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Base Leather
        ctx.fillStyle = LEATHER_MAIN;
        ctx.fillRect(0, 0, 512, 512);
        
        // Noise for texture
        ctx.globalAlpha = 0.15;
        for(let i=0; i<8000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
            ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
        }
        ctx.globalAlpha = 1.0;

        const tex = new THREE.CanvasTexture(canvas);
        const leatherMat = new THREE.MeshStandardMaterial({ 
            map: tex, 
            roughness: 0.7,
            bumpMap: tex,
            bumpScale: 0.02,
            color: LEATHER_MAIN
        });
        
        const darkLeatherMat = new THREE.MeshStandardMaterial({
            color: LEATHER_DARK,
            roughness: 0.8,
            map: tex,
            bumpMap: tex,
            bumpScale: 0.02
        });

        const studMat = new THREE.MeshStandardMaterial({
            color: GOLD_STUD,
            metalness: 0.8,
            roughness: 0.3
        });

        const createdMeshes: THREE.Object3D[] = [];
        const refs: any = { torso: null, sleeves: [], details: [] };

        // 1. BASE TORSO
        const torsoRadiusTop = 0.33; 
        const torsoRadiusBottom = 0.28; 
        const torsoLen = 0.54; 
        const torsoDepthScale = 0.7;

        const torsoGeo = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, torsoLen, 16);
        torsoGeo.scale(1, 1, torsoDepthScale);
        
        // Apply Breast Deformation for Females
        if (config.bodyType === 'female') {
            const pos = torsoGeo.attributes.position;
            const v = new THREE.Vector3();
            const breastY = 0.15;
            const breastX = 0.11;
            const radius = 0.16; 
            const amount = 0.09; 

            for(let i=0; i<pos.count; i++){
                v.fromBufferAttribute(pos, i);
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
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            torsoGeo.computeVertexNormals();
        }

        const torso = new THREE.Mesh(torsoGeo, leatherMat);
        torso.position.y = parts.torso?.position?.y ?? 0.38; 
        torso.castShadow = true;
        parts.torsoContainer.add(torso);
        createdMeshes.push(torso);
        refs.torso = torso;

        // 2. CHEST PLATE (Bib / Yoke)
        // Covers top half of torso, V-shape bottom
        const chestH = 0.28;
        const chestGeo = new THREE.CylinderGeometry(torsoRadiusTop * 1.03, torsoRadiusTop * 1.03, chestH, 32, 4, true);
        
        const pos = chestGeo.attributes.position;
        const v = new THREE.Vector3();
        
        // Sculpt V-Shape into bottom edge
        for(let i=0; i<pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            
            // Front V-Neck
            if (v.z > 0 && v.y < -chestH/2 + 0.05) {
                // v.x ranges approx -0.3 to 0.3
                // We want V point at x=0
                const xFactor = Math.abs(v.x) / (torsoRadiusTop); // 0 to 1
                // Push y down at center
                const dip = (1.0 - xFactor) * 0.15;
                v.y -= dip;
            }
            
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        chestGeo.computeVertexNormals();
        chestGeo.scale(1, 1, torsoDepthScale * 1.03); // Slightly larger than torso

        const chestPlate = new THREE.Mesh(chestGeo, darkLeatherMat);
        chestPlate.position.y = 0.12; // Upper chest
        chestPlate.castShadow = true;
        torso.add(chestPlate);
        createdMeshes.push(chestPlate);

        // 3. STUDS (Gold spheres)
        const studGeo = new THREE.SphereGeometry(0.015, 8, 8);
        
        // Helper to place studs along a path
        const addStuds = (parent: THREE.Object3D, yPos: number, radiusX: number, radiusZ: number, count: number, isV: boolean) => {
            for(let i=0; i<count; i++) {
                // Half circle for front? Or full? Let's do front mainly.
                // Angle -PI/2 to PI/2 is front.
                const angle = (i / (count-1)) * Math.PI - Math.PI; // Full circle
                
                const x = Math.sin(angle) * radiusX;
                const z = Math.cos(angle) * radiusZ;
                
                // If V-shape, modulate Y based on X
                let y = yPos;
                if (isV && z > 0) { // Front
                     const xFactor = Math.abs(x) / radiusX; 
                     y -= (1.0 - xFactor) * 0.15;
                }

                const stud = new THREE.Mesh(studGeo, studMat);
                stud.position.set(x, y, z);
                parent.add(stud);
            }
        };

        // Studs on bottom edge of Chest Plate
        addStuds(chestPlate, -chestH/2 + 0.02, torsoRadiusTop * 1.03, torsoRadiusTop * torsoDepthScale * 1.03, 24, true);
        
        // Studs on Neckline/Collar
        // Simple ring around neck
        const collarR = 0.14;
        addStuds(chestPlate, chestH/2 - 0.02, collarR, collarR * torsoDepthScale + 0.05, 12, false);

        // 4. PAULDRONS (Leather Shoulder Guards)
        const createLeatherPauldron = (isLeft: boolean) => {
            const pGroup = new THREE.Group();
            
            // Main leather dome
            const domeGeo = new THREE.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
            domeGeo.scale(1.1, 0.65, 1.0);
            const dome = new THREE.Mesh(domeGeo, darkLeatherMat);
            dome.castShadow = true;
            pGroup.add(dome);
            
            // Layered leather strips
            for (let i = 0; i < 3; i++) {
                const stripGeo = new THREE.BoxGeometry(0.18 - i * 0.03, 0.025, 0.12 - i * 0.02);
                const strip = new THREE.Mesh(stripGeo, leatherMat);
                strip.position.y = -0.03 - i * 0.035;
                strip.position.x = isLeft ? 0.02 : -0.02;
                strip.rotation.z = isLeft ? 0.15 : -0.15;
                strip.castShadow = true;
                pGroup.add(strip);
                
                // Gold studs on each strip
                [-1, 1].forEach(side => {
                    const stud = new THREE.Mesh(studGeo, studMat);
                    stud.position.set(side * (0.06 - i * 0.01), 0.015, 0);
                    strip.add(stud);
                });
            }
            
            // Edge binding
            const bindingGeo = new THREE.TorusGeometry(0.12, 0.015, 6, 20, Math.PI);
            const binding = new THREE.Mesh(bindingGeo, darkLeatherMat);
            binding.rotation.x = Math.PI / 2;
            binding.rotation.z = isLeft ? -Math.PI / 2 : Math.PI / 2;
            binding.position.y = 0.01;
            binding.position.x = isLeft ? 0.05 : -0.05;
            pGroup.add(binding);
            
            return pGroup;
        };

        const leftPauldron = createLeatherPauldron(true);
        leftPauldron.position.set(0.02, 0.06, 0); 
        leftPauldron.rotation.z = -0.15;
        parts.leftShoulderMount.add(leftPauldron);
        createdMeshes.push(leftPauldron);
        refs.details.push(leftPauldron);

        const rightPauldron = createLeatherPauldron(false);
        rightPauldron.position.set(-0.02, 0.06, 0);
        rightPauldron.rotation.z = 0.15;
        parts.rightShoulderMount.add(rightPauldron);
        createdMeshes.push(rightPauldron);
        refs.details.push(rightPauldron);

        // 5. Sleeves (Under the armor, basic shirt sleeves)
        [parts.rightArm, parts.leftArm].forEach(arm => {
            if (!arm) return;
            const sRad = 0.09;
            const sLen = 0.16;
            const sleeveGeo = new THREE.CapsuleGeometry(sRad, sLen, 4, 12);
            sleeveGeo.translate(0, -sLen / 2, 0);
            const sleeve = new THREE.Mesh(sleeveGeo, leatherMat);
            sleeve.castShadow = true;
            arm.add(sleeve);
            createdMeshes.push(sleeve);
            refs.sleeves.push(sleeve);
        });

        return { meshes: createdMeshes, refs };
    }
}
