import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

// Visual constants based on the reference image
const COLOR_MAIN = '#1a1a1a';       // Deep black/charcoal
const COLOR_HIGHLIGHT = '#2a2a2a';  // Slightly lighter for edges
const COLOR_STRAP = '#111111';      // Darker straps
const COLOR_METAL = '#b0c4de';      // Bluish silver for the central piece/studs
const COLOR_TRIM = '#2F4F4F';       // Dark Slate Blue/Grey for the collar/shoulder trim

const GLOBAL_SCALE = 1.0;

export class BlackDoubletBuilder {
    static build(parts: any, config: PlayerConfig) {
        
        // --- TEXTURE GENERATION ---
        // Generates a dark, pebbled leather texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Base fill
        ctx.fillStyle = COLOR_MAIN;
        ctx.fillRect(0, 0, 512, 512);

        // Noise/Grain for leather look
        for(let i=0; i<8000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.05)';
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }

        // Horizontal ribbing lines (burned into texture for depth)
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 4;
        for (let y = 100; y < 512; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }

        const armorTex = new THREE.CanvasTexture(canvas);
        armorTex.wrapS = THREE.RepeatWrapping;
        armorTex.wrapT = THREE.RepeatWrapping;

        // --- MATERIALS ---
        const armorMat = new THREE.MeshStandardMaterial({ 
            map: armorTex, 
            roughness: 0.7,
            metalness: 0.1 
        });

        const metalMat = new THREE.MeshStandardMaterial({ 
            color: COLOR_METAL, 
            metalness: 0.9, 
            roughness: 0.2 
        });

        const trimMat = new THREE.MeshStandardMaterial({ 
            color: COLOR_TRIM, 
            roughness: 0.8 
        });

        const createdMeshes: THREE.Object3D[] = [];
        const armorRefs: any = { torso: null, details: [] };

        // --- TORSO BASE ---
        // Using dimensions similar to ShirtBuilder but slightly bulkier for armor
        const torsoRadiusTop = 0.34; 
        const torsoRadiusBottom = 0.28; 
        const torsoDepthScale = 0.75; 
        const armorLen = 0.55; 

        const torsoGeo = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, armorLen, 32, 8);
        torsoGeo.scale(1, 1, torsoDepthScale);

        // Female Adjustments (Armor is stiff, so less deformation than a shirt, but still needed to fit)
        if (config.bodyType === 'female') {
            const pos = torsoGeo.attributes.position;
            const v = new THREE.Vector3();
            const breastY = 0.15;
            const breastX = 0.11;
            const radius = 0.16; 
            const amount = 0.05; // Less push than cloth

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
                    }
                }
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            torsoGeo.computeVertexNormals();
        }

        const mainTorso = new THREE.Mesh(torsoGeo, armorMat);
        mainTorso.position.y = parts.torso?.position?.y ?? 0.38;
        mainTorso.castShadow = true;
        parts.torsoContainer.add(mainTorso);
        createdMeshes.push(mainTorso);
        armorRefs.torso = mainTorso;

        // --- DECORATIVE RIBBING (The horizontal segments) ---
        // Instead of simple texture, we add physical rings for the segmented look
        const numRibs = 4;
        const ribStart = -0.05;
        const ribSpacing = 0.09;

        for (let i = 0; i < numRibs; i++) {
            const ribGeo = new THREE.CylinderGeometry(torsoRadiusTop * 1.02, torsoRadiusTop * 1.01, 0.04, 32, 1, true);
            // Only render front half approximately by scaling z
            ribGeo.scale(0.95, 1, torsoDepthScale * 1.05);
            
            const rib = new THREE.Mesh(ribGeo, armorMat);
            rib.position.y = ribStart - (i * ribSpacing);
            rib.position.z = 0.01; // Slight push forward
            mainTorso.add(rib);
            createdMeshes.push(rib);
        }

        // --- CENTRAL VERTICAL STRIP & METAL DECORATION ---
        // The vertical leather strap down the center
        const stripGeo = new THREE.BoxGeometry(0.12, armorLen * 0.9, 0.04);
        const strip = new THREE.Mesh(stripGeo, armorMat);
        strip.position.set(0, -0.02, torsoRadiusTop * torsoDepthScale);
        mainTorso.add(strip);
        createdMeshes.push(strip);

        // The "V" Shape / Gorget at the neck
        const gorgetGeo = new THREE.CylinderGeometry(0.16, 0.05, 0.15, 4); // Triangle/Trapazoid shape
        gorgetGeo.scale(1, 1, 0.5);
        const gorget = new THREE.Mesh(gorgetGeo, trimMat);
        gorget.rotation.y = Math.PI / 4; // Rotate to make it point down like a shield
        gorget.position.set(0, 0.18, torsoRadiusTop * torsoDepthScale + 0.02);
        gorget.rotation.x = -0.1; // Tilt back slightly to sit on chest
        mainTorso.add(gorget);
        createdMeshes.push(gorget);

        // The Metal Emblem on top of the Gorget
        const emblemGeo = new THREE.BoxGeometry(0.04, 0.08, 0.02);
        const emblem = new THREE.Mesh(emblemGeo, metalMat);
        emblem.position.z = 0.04; // Sit on top of gorget
        gorget.add(emblem);

        // --- PAULDRONS (Shoulder Armor) ---
        // Large rectangular pads as seen in image
        const pauldronWidth = 0.28;
        const pauldronHeight = 0.18;
        const pauldronDepth = 0.22;
        
        const pauldronGeo = new THREE.BoxGeometry(pauldronWidth, pauldronHeight, pauldronDepth);
        // Curve the top slightly? Box is fine for this specific rigid style
        
        [-1, 1].forEach(side => {
            const pauldron = new THREE.Mesh(pauldronGeo, armorMat);
            // Positioned at shoulder height, pushed out
            pauldron.position.set(side * 0.28, 0.22, 0);
            pauldron.rotation.z = side * -0.2; // Droop slightly
            mainTorso.add(pauldron);
            createdMeshes.push(pauldron);

            // Add Trim to Pauldron (The lighter border)
            const pTrimGeo = new THREE.BoxGeometry(pauldronWidth + 0.02, pauldronHeight + 0.02, pauldronDepth - 0.1);
            const pTrim = new THREE.Mesh(pTrimGeo, trimMat);
            pauldron.add(pTrim);

            // Add Studs (The grid of silver dots)
            const studGeo = new THREE.SphereGeometry(0.015, 8, 8);
            const rows = 2;
            const cols = 3;
            const startX = -pauldronWidth/3;
            const startY = pauldronHeight/3;
            
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    const stud = new THREE.Mesh(studGeo, metalMat);
                    stud.position.set(
                        startX + (c * (pauldronWidth/3)), 
                        startY - (r * (pauldronHeight/2)), 
                        pauldronDepth/2 + 0.01
                    );
                    pauldron.add(stud);
                }
            }
        });

        // --- SKIRT / TASSETS (Lower Armor) ---
        // Front Flap
        const frontFlapGeo = new THREE.BoxGeometry(0.18, 0.25, 0.03);
        const frontFlap = new THREE.Mesh(frontFlapGeo, armorMat);
        frontFlap.position.set(0, -armorLen/2 - 0.08, torsoRadiusBottom * torsoDepthScale - 0.02);
        frontFlap.rotation.x = -0.1; // Flare out
        mainTorso.add(frontFlap);
        createdMeshes.push(frontFlap);

        // Decorative "V" stitching on front flap
        const flapDecoGeo = new THREE.ConeGeometry(0.06, 0.08, 3); // Upside down triangle
        const flapDeco = new THREE.Mesh(flapDecoGeo, trimMat);
        flapDeco.rotation.z = Math.PI;
        flapDeco.scale.z = 0.2;
        flapDeco.position.set(0, -0.05, 0.02);
        frontFlap.add(flapDeco);

        // Side Flaps
        const sideFlapGeo = new THREE.BoxGeometry(0.15, 0.22, 0.03);
        [-1, 1].forEach(side => {
            const sideFlap = new THREE.Mesh(sideFlapGeo, armorMat);
            const angle = side * 1.8; // Roughly 100 degrees
            const radius = torsoRadiusBottom + 0.02;
            
            sideFlap.position.set(Math.sin(angle) * radius, -armorLen/2 - 0.06, Math.cos(angle) * radius * torsoDepthScale);
            sideFlap.rotation.y = angle;
            sideFlap.rotation.x = -0.1;
            mainTorso.add(sideFlap);
            createdMeshes.push(sideFlap);
        });

        // --- BELT ---
        const beltGeo = new THREE.CylinderGeometry(torsoRadiusBottom * 1.05, torsoRadiusBottom * 1.05, 0.06, 32);
        beltGeo.scale(1, 1, torsoDepthScale);
        const belt = new THREE.Mesh(beltGeo, new THREE.MeshStandardMaterial({ color: COLOR_STRAP, roughness: 0.9 }));
        belt.position.y = -armorLen/2 + 0.05;
        mainTorso.add(belt);
        createdMeshes.push(belt);

        // Belt Buckle (Silver studs)
        for(let i=-1; i<=1; i+=2) {
            const buckleStud = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), metalMat);
            buckleStud.position.set(i * 0.05, 0, torsoRadiusBottom * torsoDepthScale * 1.05);
            belt.add(buckleStud);
        }

        // --- ARMS (Under-suit sleeves) ---
        // Simple dark sleeves to cover the arms, as the doublet seems sleeveless/short sleeved on top
        const armPairs = [{ arm: parts.rightArm }, { arm: parts.leftArm }];
        const sleeveMat = new THREE.MeshStandardMaterial({ color: '#0f0f0f', roughness: 0.9 }); // Darker cloth

        armPairs.forEach(({ arm }) => {
            if (!arm) return;
            const sRad = 0.075;
            const sLen = 0.25; // Upper arm only
            const sleeveGeo = new THREE.CapsuleGeometry(sRad, sLen, 4, 12);
            sleeveGeo.translate(0, -sLen / 2 + 0.05, 0);
            const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
            arm.add(sleeve);
            createdMeshes.push(sleeve);
        });

        return { meshes: createdMeshes, refs: armorRefs };
    }
}