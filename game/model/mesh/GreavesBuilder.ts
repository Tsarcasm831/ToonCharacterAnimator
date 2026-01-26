import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const GLOBAL_PATTERN_SCALE = 3.5;

export class GreavesBuilder {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.greaves) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Reuse pants color scheme for consistency with legwear
        const baseColor = config.pantsColor || '#2d3748';
        let detailColor = '#1a202c';

        if (config.outfit === 'peasant') { detailColor = '#3e2723'; }
        else if (config.outfit === 'warrior') { detailColor = '#000000'; }
        else if (config.outfit === 'noble') { detailColor = '#d1c4e9'; }
        else if (config.outfit === 'naked') { detailColor = '#2c5282'; }

        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);

        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 3000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = detailColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(12, 0); ctx.lineTo(12, 512);
        ctx.moveTo(500, 0); ctx.lineTo(500, 512);
        ctx.moveTo(0, 32); ctx.lineTo(512, 32);
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        const mat = new THREE.MeshToonMaterial({ map: tex });

        const meshes: THREE.Object3D[] = [];
        const s = 1.04;

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

        // Greaves focus on shins; optionally wrap knees slightly for coverage
        const legs = [
            { parent: parts.leftShin, len: 0.42, topR: 0.10, botR: 0.07 },
            { parent: parts.rightShin, len: 0.42, topR: 0.10, botR: 0.07 },
        ];

        legs.forEach(leg => {
            if (!leg.parent) return;
            const geo = new THREE.CylinderGeometry(leg.topR, leg.botR, leg.len, 14, 1, true);
            geo.translate(0, -leg.len / 2, 0);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(s, 1.0, s);
            mesh.castShadow = true;
            leg.parent.add(mesh);
            meshes.push(mesh);
            scaleUVs(mesh, (leg.topR + leg.botR) / 2, leg.len);

            // Knee cap/guard for extra shape
            const jointGeo = new THREE.SphereGeometry(leg.topR * 1.05, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.8);
            const joint = new THREE.Mesh(jointGeo, mat);
            joint.scale.setScalar(s);
            joint.position.y = -0.02; // Slight drop to sit over knee
            joint.castShadow = true;
            leg.parent.add(joint);
            meshes.push(joint);
        });

        return meshes;
    }
}
