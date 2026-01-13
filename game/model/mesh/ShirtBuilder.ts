
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';
import { QuiltedArmorBuilder } from './QuiltedArmorBuilder';
import { HeavyLeatherArmorBuilder } from './HeavyLeatherArmorBuilder';
import { RingMailBuilder } from './RingMailBuilder';
import { PlateMailBuilder } from './PlateMailBuilder';

const LEATHER_COLOR = '#5d4037';
const LEATHER_DARK = '#3d2b1f';
const LEATHER_DETAIL = '#2a1f16';
const GLOBAL_PATTERN_SCALE = 3.5; 

export class ShirtBuilder {
    static build(parts: any, config: PlayerConfig) {
        if (config.equipment.plateMail) {
            return PlateMailBuilder.build(parts, config);
        }

        if (config.equipment.ringMail) {
            return RingMailBuilder.build(parts, config);
        }

        if (config.equipment.heavyLeatherArmor) {
            return HeavyLeatherArmorBuilder.build(parts, config);
        }

        const isQuilted = config.equipment.quiltedArmor;
        if (isQuilted) {
            return QuiltedArmorBuilder.build(parts, config);
        }

        const isLeatherArmor = config.equipment.leatherArmor;
        if (!config.equipment.shirt && !isLeatherArmor) return null;

        const isLeatherTexture = (config.outfit === 'warrior') || isLeatherArmor;
        
        // --- TEXTURE GENERATION ---
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        const armorBaseColor = isLeatherArmor ? LEATHER_COLOR : (config.shirtColor || '#8B4513');
        ctx.fillStyle = armorBaseColor;
        ctx.fillRect(0, 0, 512, 512);

        if (isLeatherTexture) {
            // Pebbled leather texture
            for(let i=0; i<4000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.05)';
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                ctx.fillRect(x, y, 1.5, 1.5);
            }

            ctx.strokeStyle = LEATHER_DETAIL;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4;
            ctx.setLineDash([10, 8]);
            ctx.strokeRect(10, 10, 492, 492);
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);
        } else {
            const baseColor = config.shirtColor || '#cc0000';
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for (let i = 0; i < 512; i+= 128) {
                ctx.fillRect(i + 40, 0, 40, 512); 
                ctx.fillRect(0, i + 40, 512, 40); 
            }
        }

        const shirtTex = new THREE.CanvasTexture(canvas);
        shirtTex.wrapS = THREE.RepeatWrapping;
        shirtTex.wrapT = THREE.RepeatWrapping;

        const shirtMat = new THREE.MeshToonMaterial({ map: shirtTex });
        const leatherTrimMat = new THREE.MeshStandardMaterial({ color: LEATHER_DARK, roughness: 0.9 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });

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
        const shirtRefs: any = { torso: null, shoulders: [], sleeves: [], details: [] };

        // --- TORSO ---
        const torsoRadiusTop = isLeatherArmor ? 0.335 : 0.305; 
        const torsoRadiusBottom = isLeatherArmor ? 0.29 : 0.245; 
        const torsoDepthScale = 0.68; 
        const shirtLen = 0.54; 

        // Use more segments for better deformation
        const shirtTorsoGeo = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, shirtLen, 32, 8);
        shirtTorsoGeo.scale(1, 1, torsoDepthScale); 

        // Apply Breast Deformation for Females
        if (config.bodyType === 'female') {
            const pos = shirtTorsoGeo.attributes.position;
            const v = new THREE.Vector3();
            // Breast centers relative to shirt origin
            // TorsoBuilder places breasts at y=0.15, x=+/-0.11, z=0.12 (surface)
            const breastY = 0.15;
            const breastX = 0.11;
            // Radius of influence and push amount
            const radius = 0.16; 
            const amount = 0.085; // Push out to cover skin breasts

            for(let i=0; i<pos.count; i++){
                v.fromBufferAttribute(pos, i);
                
                // Only modify front side
                if (v.z > 0) {
                    const distL = Math.sqrt(Math.pow(v.x - breastX, 2) + Math.pow(v.y - breastY, 2));
                    const distR = Math.sqrt(Math.pow(v.x + breastX, 2) + Math.pow(v.y - breastY, 2));
                    
                    let push = 0;
                    if (distL < radius) {
                        push = Math.cos((distL/radius) * (Math.PI/2));
                    } else if (distR < radius) {
                        push = Math.cos((distR/radius) * (Math.PI/2));
                    }
                    
                    if (push > 0) {
                        // Push outward in Z
                        v.z += push * amount; 
                        // Slight sag
                        v.y -= push * 0.01;
                    }
                }
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            shirtTorsoGeo.computeVertexNormals();
        }

        const shirtTorso = new THREE.Mesh(shirtTorsoGeo, shirtMat);
        
        scaleUVs(shirtTorso, (torsoRadiusTop + torsoRadiusBottom)/2, shirtLen); 
        shirtTorso.position.y = parts.torso?.position?.y ?? 0.38; 
        shirtTorso.castShadow = true;
        parts.torsoContainer.add(shirtTorso);
        createdMeshes.push(shirtTorso);
        shirtRefs.torso = shirtTorso;

        // --- ABDOMINAL DEFINITION OVERLAYS (Male Only) ---
        if (config.bodyType === 'male') {
            const abGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const chestSurfaceZ = torsoRadiusTop * torsoDepthScale;
            
            const abRows = [
                { y: 0.02, z: chestSurfaceZ - 0.015 },
                { y: -0.07, z: chestSurfaceZ - 0.022 },
                { y: -0.16, z: chestSurfaceZ - 0.03 }
            ];

            abRows.forEach((row) => {
                for (let side of [-1, 1]) {
                    // Use shirtMat directly so pattern is continuous
                    const ab = new THREE.Mesh(abGeo, shirtMat);
                    ab.scale.set(1.2, 0.8, 0.3);
                    
                    // Add back to shirtTorso to ensure they move and scale with the shirt torso
                    // We use row.z directly because it's already calculated relative to the surface
                    ab.position.set(side * 0.055, row.y, row.z);
                    ab.rotation.y = side * 0.15; 
                    ab.rotation.x = -0.05;

                    // Apply matching UV scale so pattern doesn't look stretched on the "puffs"
                    scaleUVs(ab, 0.05, 0.05);

                    ab.userData.isAbs = true;
                    ab.userData.basePos = ab.position.clone();

                    shirtTorso.add(ab);
                    createdMeshes.push(ab);
                    shirtRefs.details.push(ab);
                }
            });
        }

        // --- SHOULDER STRAPS & NECK (Leather Armor Only) ---
        if (isLeatherArmor) {
            const strapW = 0.12, strapH = 0.35, strapD = 0.03;
            const strapGeo = new THREE.BoxGeometry(strapW, strapH, strapD);
            strapGeo.translate(0, 0, strapD/2);

            [-1, 1].forEach(side => {
                const strap = new THREE.Mesh(strapGeo, leatherTrimMat);
                strap.position.set(side * 0.18, shirtLen/2, 0);
                strap.rotation.x = -Math.PI / 2;
                strap.rotation.z = side * 0.15;
                shirtTorso.add(strap);
                createdMeshes.push(strap);

                // Shoulder Studs
                const stud = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), metalMat);
                stud.position.set(0, 0.05, strapD);
                strap.add(stud);
            });

            // Gorget / Top Trim
            const collarTrimGeo = new THREE.CylinderGeometry(torsoRadiusTop * 1.01, torsoRadiusTop * 1.01, 0.06, 24);
            collarTrimGeo.scale(1, 1, torsoDepthScale * 1.01);
            const collarTrim = new THREE.Mesh(collarTrimGeo, leatherTrimMat);
            collarTrim.position.y = shirtLen/2 - 0.02;
            shirtTorso.add(collarTrim);
            createdMeshes.push(collarTrim);
        }

        // Shoulder Caps (For standard shirts only)
        if (!isLeatherArmor) {
            const capGeo = new THREE.SphereGeometry(torsoRadiusTop, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
            capGeo.scale(1, 0.5, torsoDepthScale);
            const shoulderCap = new THREE.Mesh(capGeo, shirtMat);
            shoulderCap.position.y = shirtLen / 2;
            shoulderCap.userData.isShoulderCap = true;
            shirtTorso.add(shoulderCap);
            createdMeshes.push(shoulderCap);
            scaleUVs(shoulderCap, torsoRadiusTop, torsoRadiusTop);
        }

        // --- LOWER DETAILS (LEATHER ARMOR SPECIFIC) ---
        if (isLeatherArmor) {
            const yokeRadius = 0.18;
            const yokeGeo = new THREE.TorusGeometry(yokeRadius, 0.03, 8, 32);
            yokeGeo.scale(1, 0.6, 1.2);
            const yoke = new THREE.Mesh(yokeGeo, leatherTrimMat);
            yoke.rotation.x = Math.PI / 2;
            yoke.position.y = shirtLen / 2;
            shirtTorso.add(yoke);
            createdMeshes.push(yoke);

            // Volumetric Tassets
            const tabWidth = 0.14, tabHeight = 0.20, tabDepth = 0.02;
            const tabGeo = new THREE.BoxGeometry(tabWidth, tabHeight, tabDepth);
            tabGeo.translate(0, -tabHeight / 2, 0);

            const numTabs = 6;
            for (let i = 0; i < numTabs; i++) {
                const angle = (i / numTabs) * Math.PI * 2 + Math.PI/numTabs;
                const tab = new THREE.Mesh(tabGeo, shirtMat);
                const rx = Math.cos(angle) * torsoRadiusBottom;
                const rz = Math.sin(angle) * torsoRadiusBottom * torsoDepthScale;
                tab.position.set(rx, -shirtLen / 2 + 0.08, rz);
                tab.rotation.y = -angle + Math.PI / 2;
                tab.rotation.x = 0.12; 
                shirtTorso.add(tab);
                createdMeshes.push(tab);

                // Stud on tab
                const tabStud = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), metalMat);
                tabStud.position.set(0, -tabHeight * 0.4, tabDepth/2 + 0.005);
                tab.add(tabStud);

                // Dark border trim for tabs
                const border = new THREE.Mesh(new THREE.BoxGeometry(tabWidth + 0.01, 0.015, tabDepth + 0.005), leatherTrimMat);
                border.position.y = -tabHeight;
                tab.add(border);
            }
        }

        // --- SLEEVES ---
        if (!isLeatherArmor) {
            const armPairs = [{ arm: parts.rightArm }, { arm: parts.leftArm }];
            armPairs.forEach(({ arm }) => {
                if (!arm) return;
                const sRad = 0.08;
                const sLen = 0.18;
                const sleeveGeo = new THREE.CapsuleGeometry(sRad, sLen, 4, 12);
                sleeveGeo.translate(0, -sLen / 2, 0);
                const sleeve = new THREE.Mesh(sleeveGeo, shirtMat);
                sleeve.castShadow = true;
                arm.add(sleeve);
                createdMeshes.push(sleeve);
                shirtRefs.sleeves.push(sleeve);
                scaleUVs(sleeve, sRad, sLen);
            });
        }

        return { meshes: createdMeshes, refs: shirtRefs };
    }
}
