
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const QUILTED_COLOR = '#4a3728'; 
const QUILTED_STITCH = '#2a1f16';
const LEATHER_TRIM = '#3d2b1f';
const METAL_COLOR = '#cccccc';
const GLOBAL_PATTERN_SCALE = 3.5;

export class QuiltedArmorBuilder {
    static build(parts: any, config: PlayerConfig) {
        // --- TEXTURE GENERATION ---
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Base Fabric
        ctx.fillStyle = QUILTED_COLOR;
        ctx.fillRect(0, 0, 512, 512);

        // Rough weave noise
        ctx.globalAlpha = 0.1;
        for(let i=0; i<5000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
            ctx.fillRect(Math.random()*512, Math.random()*512, 1, 1);
        }
        ctx.globalAlpha = 1.0;

        // Diamond pattern
        const step = 64;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        for (let i = -512; i < 1024; i += step) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 512, 512); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i, 512); ctx.lineTo(i + 512, 0); ctx.stroke();
        }

        // Stitching
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = QUILTED_STITCH;
        ctx.lineWidth = 1;
        for (let i = -512; i < 1024; i += step) {
            ctx.beginPath(); ctx.moveTo(i+2, 0); ctx.lineTo(i + 514, 512); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i+2, 512); ctx.lineTo(i + 514, 0); ctx.stroke();
        }
        ctx.setLineDash([]);

        // Highlights on the "puff"
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for (let x = 0; x < 512; x += step) {
            for (let y = 0; y < 512; y += step) {
                ctx.beginPath();
                ctx.arc(x + step/2, y + step/2, 12, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const shirtTex = new THREE.CanvasTexture(canvas);
        shirtTex.wrapS = THREE.RepeatWrapping;
        shirtTex.wrapT = THREE.RepeatWrapping;

        const shirtMat = new THREE.MeshToonMaterial({ map: shirtTex });
        const trimMat = new THREE.MeshStandardMaterial({ color: LEATHER_TRIM, roughness: 0.9 });
        const metalMat = new THREE.MeshStandardMaterial({ color: METAL_COLOR, metalness: 0.8, roughness: 0.3 });

        const scaleUVs = (mesh: THREE.Mesh, radius: number, height: number) => {
            const uvAttribute = mesh.geometry.attributes.uv;
            if (!uvAttribute) return;
            const uScale = (2 * Math.PI * radius) * GLOBAL_PATTERN_SCALE;
            const vScale = height * GLOBAL_PATTERN_SCALE;
            for (let i = 0; i < uvAttribute.count; i++) {
                uvAttribute.setXY(i, uvAttribute.getX(i) * uScale, uvAttribute.getY(i) * vScale);
            }
            uvAttribute.needsUpdate = true;
        };

        const createdMeshes: THREE.Object3D[] = [];
        const refs: any = { torso: null, sleeves: [], details: [] };

        // 1. Torso
        const rTop = 0.33, rBot = 0.29, depthScale = 0.68, shirtLen = 0.54;
        const torsoGeo = new THREE.CylinderGeometry(rTop, rBot, shirtLen, 32, 8);
        torsoGeo.scale(1, 1, depthScale);

        // Apply Breast Deformation for Females
        if (config.bodyType === 'female') {
            const pos = torsoGeo.attributes.position;
            const v = new THREE.Vector3();
            const breastY = 0.15;
            const breastX = 0.11;
            const radius = 0.16; 
            const amount = 0.09; // Slightly more push for quilted thickness

            for(let i=0; i<pos.count; i++){
                v.fromBufferAttribute(pos, i);
                
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
                        v.z += push * amount; 
                        v.y -= push * 0.01;
                    }
                }
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            torsoGeo.computeVertexNormals();
        }

        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = parts.torso?.position?.y ?? 0.38;
        torso.castShadow = true;
        parts.torsoContainer.add(torso);
        createdMeshes.push(torso);
        refs.torso = torso;
        scaleUVs(torso, (rTop + rBot) / 2, shirtLen);

        // 2. Shoulder Caps
        const capGeo = new THREE.SphereGeometry(rTop * 1.02, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        capGeo.scale(1, 0.55, depthScale);
        const cap = new THREE.Mesh(capGeo, shirtMat);
        cap.position.y = shirtLen / 2;
        torso.add(cap);
        createdMeshes.push(cap);

        // 3. Collar
        const collarGeo = new THREE.TorusGeometry(0.12, 0.02, 8, 24);
        collarGeo.scale(1, 0.8, 1.2);
        const collar = new THREE.Mesh(collarGeo, trimMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = shirtLen / 2 + 0.05;
        torso.add(collar);
        createdMeshes.push(collar);

        // 4. Belt
        const beltGeo = new THREE.CylinderGeometry(rBot * 1.02, rBot * 1.02, 0.07, 24);
        beltGeo.scale(1, 1, depthScale * 1.02);
        const belt = new THREE.Mesh(beltGeo, trimMat);
        belt.position.y = -shirtLen / 2 + 0.08;
        torso.add(belt);
        createdMeshes.push(belt);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.04), metalMat);
        buckle.position.z = (rBot * depthScale) + 0.02;
        belt.add(buckle);

        // 5. Volumetric Tassets (Flaps)
        const tH = 0.38;
        const tW = 0.32; // Wider for better coverage
        const tD = 0.025; // Slightly thicker
        const curveDepth = 0.06; // Amount to bend the panels

        // Helper to create curved box geometry
        const createCurvedGeo = (width: number, height: number, depth: number, curve: number, pivotTop: boolean) => {
            const geo = new THREE.BoxGeometry(width, height, depth, 8, 1);
            if (pivotTop) geo.translate(0, -height/2, 0);
            
            const pos = geo.attributes.position;
            const v = new THREE.Vector3();
            for(let i=0; i<pos.count; i++){
                v.fromBufferAttribute(pos, i);
                const xNorm = v.x / (width * 0.5);
                // Bend Z backwards based on X squared (Parabolic arch)
                v.z -= Math.pow(xNorm, 2) * curve;
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            geo.computeVertexNormals();
            return geo;
        };

        const tGeo = createCurvedGeo(tW, tH, tD, curveDepth, true);
        const trimGeo = createCurvedGeo(tW + 0.01, 0.02, tD + 0.005, curveDepth, false);

        const panels = [
            { pos: [0, 0, 1], rot: [0.12, 0, 0] },     // Front (Less rotation, rely on curve)
            { pos: [0, 0, -1], rot: [-0.20, Math.PI, 0] }, // Back
            { pos: [1, 0, 0], rot: [0, Math.PI / 2, -0.12] }, // Left
            { pos: [-1, 0, 0], rot: [0, -Math.PI / 2, 0.12] } // Right
        ];

        panels.forEach(cfg => {
            const panel = new THREE.Mesh(tGeo, shirtMat);
            panel.castShadow = true;
            
            // Fixed position math based on torso radius and depth
            const x = rBot * cfg.pos[0];
            const z = rBot * depthScale * cfg.pos[2];
            panel.position.set(x, -shirtLen / 2 + 0.1, z);
            
            panel.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
            torso.add(panel);
            createdMeshes.push(panel);
            
            // Apply scaleUVs to panel so quilt pattern matches torso scale roughly
            // panel is effectively tW x tH
            scaleUVs(panel, tW/2, tH);

            // Edge trim (Curved match)
            const trim = new THREE.Mesh(trimGeo, trimMat);
            trim.position.y = -tH; // Centered trim placed at bottom of top-pivoted panel
            panel.add(trim);
        });

        // 6. Sleeves
        [parts.rightArm, parts.leftArm].forEach(arm => {
            if (!arm) return;
            const sRad = 0.10, sLen = 0.14;
            const sleeveGeo = new THREE.CapsuleGeometry(sRad, sLen, 4, 12);
            sleeveGeo.translate(0, -sLen / 2, 0);
            const sleeve = new THREE.Mesh(sleeveGeo, shirtMat);
            sleeve.castShadow = true;
            arm.add(sleeve);
            createdMeshes.push(sleeve);
            refs.sleeves.push(sleeve);

            const cuff = new THREE.Mesh(new THREE.TorusGeometry(sRad, 0.01, 6, 12), trimMat);
            cuff.rotation.x = Math.PI / 2;
            cuff.position.y = -sLen;
            sleeve.add(cuff);
        });

        return { meshes: createdMeshes, refs };
    }
}
