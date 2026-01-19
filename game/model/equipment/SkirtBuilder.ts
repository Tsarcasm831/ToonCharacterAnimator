
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const GLOBAL_PATTERN_SCALE = 3.5;

export class SkirtBuilder {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.skirt) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const baseColor = config.robeColor || '#2d3c50'; 
        const trimColor = config.robeTrimColor || '#d4af37'; 
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);

        ctx.globalAlpha = 0.08;
        for(let i=0; i<8000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 4);
        }

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = trimColor;
        ctx.fillRect(0, 512 - 40, 512, 40);

        const skirtTex = new THREE.CanvasTexture(canvas);
        skirtTex.wrapS = THREE.RepeatWrapping;
        skirtTex.wrapT = THREE.RepeatWrapping;

        const skirtMat = new THREE.MeshToonMaterial({ 
            map: skirtTex,
            side: THREE.DoubleSide
        });

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
        const beltRadius = 0.24; // Matching BeltBuilder.ts
        const torsoDepthScale = 0.7; // Matching BeltBuilder.ts
        const skirtLen = 0.45;

        if (parts.pelvis) {
            const skirtTopRad = beltRadius;
            const skirtBotRad = skirtTopRad * 1.3;

            const skirtGeo = new THREE.CylinderGeometry(
                skirtTopRad, 
                skirtBotRad, 
                skirtLen, 
                32, 
                4, 
                true
            );
            skirtGeo.scale(1, 1, torsoDepthScale);

            const skirt = new THREE.Mesh(skirtGeo, skirtMat);
            skirt.position.y = -skirtLen/2 + 0.05; // Adjusted to meet belt position (0.08 in torso)
            skirt.castShadow = true;

            scaleUVs(skirt, skirtBotRad, skirtLen);
            parts.pelvis.add(skirt);
            createdMeshes.push(skirt);
        }

        return { meshes: createdMeshes };
    }
}
