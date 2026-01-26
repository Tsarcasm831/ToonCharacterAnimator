import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const RING_COLOR_LIGHT = '#606060';
const RING_COLOR_DARK = '#202020';
const GLOBAL_PATTERN_SCALE = 4.0;

export class RingMailBuilder {
    static build(parts: any, config: PlayerConfig) {
        // --- TEXTURE GENERATION ---
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Background (Tunic underneath)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 512, 512);

        // Draw Interlocking Rings
        const step = 32;
        ctx.lineWidth = 3;
        ctx.strokeStyle = RING_COLOR_LIGHT;
        
        for (let y = -step; y < 512 + step; y += step) {
            for (let x = -step; x < 512 + step; x += step) {
                const offsetX = (y / step) % 2 === 0 ? 0 : step / 2;
                
                // Ring Outline
                ctx.beginPath();
                ctx.arc(x + offsetX, y, step * 0.6, 0, Math.PI * 2);
                ctx.strokeStyle = RING_COLOR_LIGHT;
                ctx.stroke();
                
                // Dark Inner Shade
                ctx.beginPath();
                ctx.arc(x + offsetX, y, step * 0.5, 0, Math.PI * 2);
                ctx.strokeStyle = RING_COLOR_DARK;
                ctx.stroke();
            }
        }

        // Add some metallic noise
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 10000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
        }
        ctx.globalAlpha = 1.0;

        const ringTex = new THREE.CanvasTexture(canvas);
        ringTex.wrapS = THREE.RepeatWrapping;
        ringTex.wrapT = THREE.RepeatWrapping;

        const ringMat = new THREE.MeshToonMaterial({ 
            map: ringTex,
            color: new THREE.Color(0.9, 0.9, 1.0) // Slight cool tint
        });

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
        const rTop = 0.32, rBot = 0.26, depthScale = 0.68, shirtLen = 0.54;
        const torsoGeo = new THREE.CylinderGeometry(rTop, rBot, shirtLen, 32, 8);
        torsoGeo.scale(1, 1, depthScale);

        // Female Breast Support
        if (config.bodyType === 'female') {
            const pos = torsoGeo.attributes.position;
            const v = new THREE.Vector3();
            const breastY = 0.15, breastX = 0.11, radius = 0.16, amount = 0.08;
            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                if (v.z > 0) {
                    const distL = Math.sqrt(Math.pow(v.x - breastX, 2) + Math.pow(v.y - breastY, 2));
                    const distR = Math.sqrt(Math.pow(v.x + breastX, 2) + Math.pow(v.y - breastY, 2));
                    let push = 0;
                    if (distL < radius) push = Math.cos((distL / radius) * (Math.PI / 2));
                    else if (distR < radius) push = Math.cos((distR / radius) * (Math.PI / 2));
                    if (push > 0) {
                        v.z += push * amount;
                        v.y -= push * 0.01;
                    }
                }
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            torsoGeo.computeVertexNormals();
        }

        const torso = new THREE.Mesh(torsoGeo, ringMat);
        torso.position.y = parts.torso?.position?.y ?? 0.38;
        torso.castShadow = true;
        parts.torsoContainer.add(torso);
        createdMeshes.push(torso);
        refs.torso = torso;
        scaleUVs(torso, (rTop + rBot) / 2, shirtLen);

        // 2. Shoulder Caps (Rounding top of torso)
        const capGeo = new THREE.SphereGeometry(rTop * 1.01, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        capGeo.scale(1, 0.5, depthScale);
        const cap = new THREE.Mesh(capGeo, ringMat);
        cap.position.y = shirtLen / 2;
        torso.add(cap);
        createdMeshes.push(cap);
        scaleUVs(cap, rTop, rTop);

        // 3. Sleeves (Full length with articulated joints)
        const armConfigs = [
            { arm: parts.rightArm, fore: parts.rightForeArm },
            { arm: parts.leftArm, fore: parts.leftForeArm }
        ];

        armConfigs.forEach(({ arm, fore }) => {
            if (!arm || !fore) return;
            
            // Shoulder Joint Sphere
            const jointRad = 0.08;
            const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(jointRad, 12, 12), ringMat);
            arm.add(shoulderJoint);
            createdMeshes.push(shoulderJoint);

            // Upper Sleeve
            const upperLen = 0.28, upperRad = 0.075;
            const uSleeveGeo = new THREE.CylinderGeometry(upperRad, upperRad * 0.95, upperLen, 12);
            uSleeveGeo.translate(0, -upperLen / 2, 0);
            const uSleeve = new THREE.Mesh(uSleeveGeo, ringMat);
            uSleeve.castShadow = true;
            uSleeve.position.y = 0.02; // Minor offset to clear shoulder joint
            arm.add(uSleeve);
            createdMeshes.push(uSleeve);
            refs.sleeves.push(uSleeve);
            scaleUVs(uSleeve, upperRad, upperLen);

            // Elbow Joint Sphere
            const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(upperRad * 0.95, 12, 12), ringMat);
            fore.add(elbowJoint); // Attached to forearm so it moves with it
            createdMeshes.push(elbowJoint);

            // Forearm Sleeve
            const lowerLen = 0.24, lowerRad = upperRad * 0.9;
            const lSleeveGeo = new THREE.CylinderGeometry(lowerRad, lowerRad * 0.75, lowerLen, 12);
            lSleeveGeo.translate(0, -lowerLen / 2, 0);
            const lSleeve = new THREE.Mesh(lSleeveGeo, ringMat);
            lSleeve.castShadow = true;
            fore.add(lSleeve);
            createdMeshes.push(lSleeve);
            refs.sleeves.push(lSleeve);
            scaleUVs(lSleeve, lowerRad, lowerLen);
        });

        return { meshes: createdMeshes, refs };
    }
}
