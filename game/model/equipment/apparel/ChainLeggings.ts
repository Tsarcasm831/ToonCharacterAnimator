import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

const GLOBAL_PATTERN_SCALE = 4.0;

export class ChainLeggings {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.chainLeggings) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Colors for Chainmail and Black Padded Leather
        const leatherBlack = '#0a0a0a';
        const chainSilver = '#d1d5db';
        const chainDark = '#4a5568';
        const trimBlue = '#1a365d'; // Deep blue highlights seen in image seams

        // 1. Base Padded Leather
        ctx.fillStyle = leatherBlack;
        ctx.fillRect(0, 0, 512, 512);

        // 2. Procedural Chainmail Pattern (Diamond Grid)
        ctx.strokeStyle = chainDark;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        const spacing = 16;
        for (let i = -512; i < 512; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0); ctx.lineTo(i + 512, 512);
            ctx.moveTo(i + 512, 0); ctx.lineTo(i, 512);
            ctx.stroke();
        }

        // Add "Glitter" to chain links
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = chainSilver;
        for (let i = 0; i < 1000; i++) {
            if (Math.random() > 0.7) {
                ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
            }
        }

        // 3. Horizontal Leather Straps (Knee/Shin area)
        ctx.fillStyle = '#111111';
        for (let y = 200; y < 400; y += 60) {
            ctx.fillRect(0, y, 512, 25);
            // Rivets on straps
            ctx.fillStyle = chainSilver;
            ctx.fillRect(50, y + 8, 4, 4);
            ctx.fillRect(450, y + 8, 4, 4);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        const mat = new THREE.MeshToonMaterial({ 
            map: tex,
            bumpMap: tex,
            bumpScale: 0.02
        });
        
        const meshes: THREE.Object3D[] = [];
        const s = 1.09; // Thickest scale for metal armor

        const scaleUVs = (mesh: THREE.Mesh, radius: number, height: number) => {
            const uvAttribute = mesh.geometry.attributes.uv;
            const uScale = (2 * Math.PI * radius) * GLOBAL_PATTERN_SCALE;
            const vScale = height * GLOBAL_PATTERN_SCALE;
            for (let i = 0; i < uvAttribute.count; i++) {
                uvAttribute.setXY(i, uvAttribute.getX(i) * uScale, uvAttribute.getY(i) * vScale);
            }
            uvAttribute.needsUpdate = true;
        };

        // --- Hips & Ornate Buckle ---
        if (parts.pelvis) {
            const pGeo = new THREE.CylinderGeometry(0.23, 0.17, 0.16, 16);
            const pMesh = new THREE.Mesh(pGeo, mat);
            pMesh.scale.multiplyScalar(s);
            pMesh.position.y = -0.08;
            parts.pelvis.add(pMesh);
            meshes.push(pMesh);

            // The Large Diamond Buckle
            const bGeo = new THREE.OctahedronGeometry(0.06, 0);
            const bMat = new THREE.MeshStandardMaterial({ 
                color: chainSilver, 
                metalness: 0.9, 
                roughness: 0.1 
            });
            const buckle = new THREE.Mesh(bGeo, bMat);
            buckle.scale.set(1, 1.2, 0.4);
            buckle.position.set(0, -0.02, 0.22);
            parts.pelvis.add(buckle);
            meshes.push(buckle);
        }

        // --- Armored Legs ---
        const legSections = [
            { parent: parts.leftThigh, len: 0.42, r: 0.125 },
            { parent: parts.rightThigh, len: 0.42, r: 0.125 },
            { parent: parts.leftShin, len: 0.45, r: 0.10 },
            { parent: parts.rightShin, len: 0.45, r: 0.10 }
        ];

        legSections.forEach(leg => {
            if (!leg.parent) return;
            // Slightly tapered cylinder for plate-mail look
            const geo = new THREE.CylinderGeometry(leg.r, leg.r * 0.85, leg.len, 12);
            geo.translate(0, -leg.len/2, 0);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(s, 1.0, s);
            leg.parent.add(mesh);
            meshes.push(mesh);
            scaleUVs(mesh, leg.r, leg.len);
        });

        return meshes;
    }
}
