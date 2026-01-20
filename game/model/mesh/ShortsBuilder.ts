
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const GLOBAL_PATTERN_SCALE = 3.5;

export class ShortsBuilder {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.shorts) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        let baseColor = config.pantsColor || '#2d3748';
        let detailColor = '#1a202c';

        if (config.outfit === 'peasant') { detailColor = '#3e2723'; }
        else if (config.outfit === 'warrior') { detailColor = '#000000'; }
        else if (config.outfit === 'noble') { detailColor = '#d1c4e9'; }
        else if (config.outfit === 'naked') { detailColor = '#2c5282'; }

        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);

        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 4000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = detailColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(10, 512); 
        ctx.moveTo(502, 0); ctx.lineTo(502, 512); 
        ctx.moveTo(0, 20); ctx.lineTo(512, 20);
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        const mat = new THREE.MeshToonMaterial({ map: tex });
        
        const meshes: THREE.Object3D[] = [];
        const s = 1.06; 

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

        // 1. Pelvis / Hips Coverage
        if (parts.pelvis) {
            const pelvisHeight = 0.14;
            const torsoRadiusBottom = 0.22; 
            
            const pGeo = new THREE.CylinderGeometry(torsoRadiusBottom * 0.95, torsoRadiusBottom * 0.55, pelvisHeight, 16);
            pGeo.scale(1, 1, 0.72);
            
            const pMesh = new THREE.Mesh(pGeo, mat);
            pMesh.scale.multiplyScalar(s);
            pMesh.position.y = -pelvisHeight / 2;
            pMesh.castShadow = true;
            parts.pelvis.add(pMesh);
            meshes.push(pMesh);
            scaleUVs(pMesh, torsoRadiusBottom * 0.8, pelvisHeight);

            // Crotch - extended lower and scaled larger to fully cover underwear
            const cGeo = new THREE.SphereGeometry(torsoRadiusBottom * 0.58, 16, 12, 0, Math.PI*2, Math.PI/2, Math.PI/2);
            cGeo.scale(1, 0.75, 0.75);
            const cMesh = new THREE.Mesh(cGeo, mat);
            cMesh.scale.multiplyScalar(s);
            // Lowered position to better cover underwear crotch
            cMesh.position.y = -pelvisHeight - 0.01;
            parts.pelvis.add(cMesh);
            meshes.push(cMesh);

            // Butt Overlays
            const buttRadius = 0.125;
            const buttGeo = new THREE.SphereGeometry(buttRadius, 16, 16);
            const cheekGroups = parts.buttocks ? parts.buttocks.children : [];

            [-1, 1].forEach((side, i) => {
                const buttCover = new THREE.Mesh(buttGeo, mat);
                buttCover.name = 'shortsButtCover';
                buttCover.castShadow = true;
                buttCover.scale.set(1.08, 1.02, 0.95);
                
                if (cheekGroups[i]) {
                    cheekGroups[i].add(buttCover);
                    buttCover.position.set(0, 0, 0);
                } else {
                    parts.pelvis.add(buttCover);
                }
                
                meshes.push(buttCover);
                scaleUVs(buttCover, buttRadius, buttRadius, true);
            });

            if (config.bodyType === 'male') {
                const bGeo = new THREE.CapsuleGeometry(0.046, 0.042, 4, 8);
                const bMesh = new THREE.Mesh(bGeo, mat);
                bMesh.name = 'shortsBulge';
                bMesh.castShadow = true;
                bMesh.position.set(0, -0.075, 0.13);
                parts.pelvis.add(bMesh);
                meshes.push(bMesh);
            }
        }

        // 2. Legs (Shorts only cover thigh, and only partially)
        const legs = [
            { parent: parts.leftThigh, len: 0.22, topR: 0.11, botR: 0.10 },
            { parent: parts.rightThigh, len: 0.22, topR: 0.11, botR: 0.10 },
        ];

        legs.forEach(leg => {
            if (!leg.parent) return;
            const geo = new THREE.CylinderGeometry(leg.topR, leg.botR, leg.len, 12);
            geo.translate(0, -leg.len/2, 0);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(s, 1.0, s);
            mesh.castShadow = true;
            leg.parent.add(mesh);
            meshes.push(mesh);
            scaleUVs(mesh, (leg.topR + leg.botR)/2, leg.len);
            
            const jointGeo = new THREE.SphereGeometry(leg.topR, 12, 12);
            const joint = new THREE.Mesh(jointGeo, mat);
            joint.scale.setScalar(s);
            leg.parent.add(joint);
            meshes.push(joint);
        });

        return meshes;
    }
}
