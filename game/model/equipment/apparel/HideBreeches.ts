import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

const GLOBAL_PATTERN_SCALE = 3.5;

export class HideBreeches {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.hideBreeches) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Colors extracted from the image
        const fabricGreen = '#2d3319'; // Main olive/dark green fabric
        const strapBrown = '#5d3a24';  // Leather belt and thigh straps
        const metalSilver = '#a0a0a0'; // Metallic thigh guards/buckles
        const stitchDark = '#1a1d0e';  // Darker green for shadows/stitching

        // 1. Base Fabric Layer
        ctx.fillStyle = fabricGreen;
        ctx.fillRect(0, 0, 512, 512);

        // Add subtle fabric grain
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 3000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 2);
        }

        // 2. Vertical Stitching / Center Seam
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = stitchDark;
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(256, 0); ctx.lineTo(256, 512); // Center seam
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Thigh Guards & Straps (UV mapping for legs)
        ctx.globalAlpha = 1.0;
        
        // Metallic thigh reinforcements (sides)
        ctx.fillStyle = metalSilver;
        ctx.fillRect(20, 100, 60, 300); 
        ctx.fillRect(432, 100, 60, 300);

        // Horizontal Thigh Straps
        ctx.fillStyle = strapBrown;
        ctx.fillRect(0, 350, 512, 40); 

        // Metallic buckles on straps
        ctx.fillStyle = metalSilver;
        ctx.beginPath();
        ctx.arc(50, 370, 15, 0, Math.PI * 2);
        ctx.arc(462, 370, 15, 0, Math.PI * 2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        const mat = new THREE.MeshToonMaterial({ map: tex });
        
        const meshes: THREE.Object3D[] = [];
        const s = 1.07; // Slight offset from skin

        const scaleUVs = (mesh: THREE.Mesh, radius: number, height: number, isSphere: boolean = false) => {
            const geo = mesh.geometry;
            const uvAttribute = geo.attributes.uv;
            if (!uvAttribute) return;
            const uScale = (2 * Math.PI * radius) * GLOBAL_PATTERN_SCALE;
            let vScale = height * GLOBAL_PATTERN_SCALE;
            if (isSphere) vScale = (Math.PI * radius) * GLOBAL_PATTERN_SCALE;
            for (let i = 0; i < uvAttribute.count; i++) {
                uvAttribute.setXY(i, uvAttribute.getX(i) * uScale, uvAttribute.getY(i) * vScale);
            }
            uvAttribute.needsUpdate = true;
        };

        // --- Pelvis & Slanted Belt ---
        if (parts.pelvis) {
            const pHeight = 0.14;
            const pGeo = new THREE.CylinderGeometry(0.22, 0.16, pHeight, 16);
            const pMesh = new THREE.Mesh(pGeo, mat);
            pMesh.scale.multiplyScalar(s);
            pMesh.position.y = -pHeight / 2;
            parts.pelvis.add(pMesh);
            meshes.push(pMesh);

            // Iconic Slanted Belt
            const beltGeo = new THREE.TorusGeometry(0.235, 0.022, 8, 32);
            const beltMat = new THREE.MeshToonMaterial({ color: strapBrown });
            const belt = new THREE.Mesh(beltGeo, beltMat);
            
            // Apply the slant seen in the image (downward toward the right hip)
            belt.rotation.x = Math.PI / 2;
            belt.rotation.y = 0.15; 
            belt.position.set(0, -0.05, 0);
            
            parts.pelvis.add(belt);
            meshes.push(belt);

            // Small silver pouch/buckle on the side of the belt
            const pouchGeo = new THREE.BoxGeometry(0.06, 0.08, 0.04);
            const pouchMat = new THREE.MeshToonMaterial({ color: metalSilver });
            const pouch = new THREE.Mesh(pouchGeo, pouchMat);
            pouch.position.set(0.2, -0.05, 0.05);
            parts.pelvis.add(pouch);
            meshes.push(pouch);
        }

        // --- Legs ---
        const legConfigs = [
            { parent: parts.leftThigh, len: 0.4, r: 0.11 },
            { parent: parts.rightThigh, len: 0.4, r: 0.11 },
            { parent: parts.leftShin, len: 0.42, r: 0.09 },
            { parent: parts.rightShin, len: 0.42, r: 0.09 }
        ];

        legConfigs.forEach(leg => {
            if (!leg.parent) return;
            const geo = new THREE.CylinderGeometry(leg.r, leg.r * 0.8, leg.len, 12);
            geo.translate(0, -leg.len / 2, 0);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(s, 1.0, s);
            leg.parent.add(mesh);
            meshes.push(mesh);
            scaleUVs(mesh, leg.r, leg.len);
        });

        return meshes;
    }
}
