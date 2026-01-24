import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

const GLOBAL_PATTERN_SCALE = 3.5;

export class LeatherPants {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.leatherPants) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Colors based on the provided image
        const leatherDark = '#231b15';
        const leatherMedium = '#3d2b1f';
        const strapBrown = '#8b4513';
        const metalLight = '#d1d5db';
        const metalDark = '#4a5568';

        // 1. Base Leather Texture
        ctx.fillStyle = leatherDark;
        ctx.fillRect(0, 0, 512, 512);

        // Add "grain" noise for leather feel
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 5000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000000' : leatherMedium;
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 3);
        }

        // 2. Draw Decorative Straps/Plating (UV mapped to legs)
        ctx.globalAlpha = 1.0;
        
        // Vertical "Tech/Leather" side plating (the light grey borders)
        ctx.strokeStyle = metalLight;
        ctx.lineWidth = 12;
        ctx.strokeRect(40, 50, 120, 400); // Representing the outer thigh plate
        
        // Horizontal brown straps
        ctx.fillStyle = strapBrown;
        ctx.fillRect(0, 200, 512, 30); // Mid-thigh strap
        
        // Metal Buckle details (dots)
        ctx.fillStyle = metalLight;
        for(let y = 180; y < 450; y += 80) {
            ctx.beginPath();
            ctx.arc(100, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        const mat = new THREE.MeshToonMaterial({ map: tex });
        
        const meshes: THREE.Object3D[] = [];
        const s = 1.08; // Slightly thicker for "heavy" leather

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

        // --- Hips & Pelvis ---
        if (parts.pelvis) {
            const pHeight = 0.15;
            const pGeo = new THREE.CylinderGeometry(0.21, 0.14, pHeight, 16);
            const pMesh = new THREE.Mesh(pGeo, mat);
            pMesh.scale.multiplyScalar(s);
            pMesh.position.y = -pHeight / 2;
            parts.pelvis.add(pMesh);
            meshes.push(pMesh);

            // The Slanted Belt (Visualized as a tilted torus or ring)
            const beltGeo = new THREE.TorusGeometry(0.23, 0.02, 8, 24);
            const beltMat = new THREE.MeshToonMaterial({ color: strapBrown });
            const belt = new THREE.Mesh(beltGeo, beltMat);
            belt.rotation.x = Math.PI / 2 + 0.2; // Slant it like the image
            belt.position.y = -0.02;
            parts.pelvis.add(belt);
            meshes.push(belt);
        }

        // --- Legs (Thighs and Shins) ---
        const legParts = [
            { parent: parts.leftThigh, len: 0.42, topR: 0.12, botR: 0.10 },
            { parent: parts.rightThigh, len: 0.42, topR: 0.12, botR: 0.10 },
            { parent: parts.leftShin, len: 0.45, topR: 0.10, botR: 0.07 },
            { parent: parts.rightShin, len: 0.45, topR: 0.10, botR: 0.07 }
        ];

        legParts.forEach((leg, index) => {
            if (!leg.parent) return;

            // Main Leg Geometry
            const geo = new THREE.CylinderGeometry(leg.topR, leg.botR, leg.len, 12);
            geo.translate(0, -leg.len / 2, 0);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(s, 1.01, s);
            leg.parent.add(mesh);
            meshes.push(mesh);
            scaleUVs(mesh, (leg.topR + leg.botR) / 2, leg.len);

            // Knee Joint Protector (Leather patches)
            if (index < 2) { // Thighs only
                const jointGeo = new THREE.SphereGeometry(leg.topR * 1.1, 12, 12);
                const joint = new THREE.Mesh(jointGeo, mat);
                leg.parent.add(joint);
                meshes.push(joint);
            }
        });

        return meshes;
    }
}
