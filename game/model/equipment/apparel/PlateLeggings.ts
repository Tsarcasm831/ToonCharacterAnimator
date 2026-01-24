import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

const GLOBAL_PATTERN_SCALE = 2.0;

export class PlateLeggings {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.plateLeggings) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Colors for Heavy Plate Armor
        const metalDark = '#1a1a1a';    // Deep recessed metal
        const metalMedium = '#33332d';  // Main weathered plate
        const metalHighlight = '#71716a'; // Scratched edges
        const trimGold = '#4a3f28';     // Dark bronze/gold trim highlights

        // 1. Base Metal Texture
        ctx.fillStyle = metalMedium;
        ctx.fillRect(0, 0, 512, 512);

        // Add metallic weathering and vertical "brush" strokes
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? metalHighlight : '#000000';
            ctx.fillRect(Math.random() * 512, 0, 2, 512);
        }

        // 2. Draw Plate Segments (Horizontal banding)
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        for (let y = 100; y < 512; y += 120) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
            
            // Highlight top edge of each plate
            ctx.strokeStyle = metalHighlight;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, y + 8, 512, 2);
        }

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshStandardMaterial({ 
            map: tex,
            metalness: 0.8,
            roughness: 0.3,
            color: new THREE.Color(0.8, 0.8, 0.8) // Slight tint
        });
        
        const meshes: THREE.Object3D[] = [];
        const s = 1.12; // Thickest scale for heavy plate coverage

        const scaleUVs = (mesh: THREE.Mesh, radius: number, height: number) => {
            const uvAttribute = mesh.geometry.attributes.uv;
            const uScale = (2 * Math.PI * radius) * GLOBAL_PATTERN_SCALE;
            const vScale = height * GLOBAL_PATTERN_SCALE;
            for (let i = 0; i < uvAttribute.count; i++) {
                uvAttribute.setXY(i, uvAttribute.getX(i) * uScale, uvAttribute.getY(i) * vScale);
            }
            uvAttribute.needsUpdate = true;
        };

        // --- Hips & Faulds (Plate Waist) ---
        if (parts.pelvis) {
            // Main pelvis coverage
            const pGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.18, 12);
            const pMesh = new THREE.Mesh(pGeo, mat);
            pMesh.scale.multiplyScalar(s);
            pMesh.position.y = -0.09;
            parts.pelvis.add(pMesh);
            meshes.push(pMesh);

            // The V-Shaped Crotch Plate (Front Center)
            const vGeo = new THREE.ConeGeometry(0.1, 0.2, 4);
            vGeo.rotateX(Math.PI);
            const vPlate = new THREE.Mesh(vGeo, mat);
            vPlate.position.set(0, -0.12, 0.18);
            vPlate.scale.set(1.2, 1, 0.5);
            parts.pelvis.add(vPlate);
            meshes.push(vPlate);
        }

        // --- Armored Legs (Greaves & Cuisses) ---
        const legSections = [
            { parent: parts.leftThigh, len: 0.42, r: 0.13 },
            { parent: parts.rightThigh, len: 0.42, r: 0.13 },
            { parent: parts.leftShin, len: 0.45, r: 0.11 },
            { parent: parts.rightShin, len: 0.45, r: 0.11 }
        ];

        legSections.forEach((leg, index) => {
            if (!leg.parent) return;
            
            // Hexagonal look for plates instead of smooth cylinders
            const geo = new THREE.CylinderGeometry(leg.r, leg.r * 0.9, leg.len, 6);
            geo.translate(0, -leg.len/2, 0);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(s, 1.0, s);
            leg.parent.add(mesh);
            meshes.push(mesh);
            scaleUVs(mesh, leg.r, leg.len);

            // Poleyns (Knee Caps) - Only for thigh parents
            if (index < 2) {
                const kneeGeo = new THREE.SphereGeometry(leg.r * 1.1, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
                const knee = new THREE.Mesh(kneeGeo, mat);
                knee.rotation.x = -Math.PI / 2;
                knee.position.set(0, -leg.len, 0.05); // Position at the knee joint
                leg.parent.add(knee);
                meshes.push(knee);
            }
        });

        return meshes;
    }
}
