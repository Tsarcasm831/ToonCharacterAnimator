import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const GLOBAL_PATTERN_SCALE = 3.0;

export class WarlordLegPlates {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.warlordLegPlates) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Colors for Warlord Aesthetic
        const warlordCrimson = '#4a0e0e'; // Deep dark red fabric
        const ornateGold = '#b08d57';    // Etched gold trim
        const shadowBlack = '#121212';   // Recessed armor areas
        const highlightGold = '#e6c281'; // Bright metal edges

        // 1. Base Fabric Layer
        ctx.fillStyle = warlordCrimson;
        ctx.fillRect(0, 0, 512, 512);

        // Add subtle velvet/cloth texture grain
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 2000; i++) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 1);
        }

        // 2. Draw Gold Filigree Patterns (mapped to thighs)
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = ornateGold;
        ctx.lineWidth = 10;
        
        // Ornate "V" shapes and swirls for the upper thigh plates
        ctx.beginPath();
        ctx.moveTo(50, 50); ctx.quadraticCurveTo(256, 150, 462, 50);
        ctx.stroke();

        // Spiked trim details on canvas
        ctx.fillStyle = highlightGold;
        for (let x = 0; x < 512; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, 400);
            ctx.lineTo(x + 32, 450);
            ctx.lineTo(x + 64, 400);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshToonMaterial({ map: tex });
        const goldMat = new THREE.MeshStandardMaterial({ 
            color: ornateGold, 
            metalness: 0.9, 
            roughness: 0.2 
        });
        
        const meshes: THREE.Object3D[] = [];
        const s = 1.1; 

        const scaleUVs = (mesh: THREE.Mesh, radius: number, height: number) => {
            const uvAttribute = mesh.geometry.attributes.uv;
            const uScale = (2 * Math.PI * radius) * GLOBAL_PATTERN_SCALE;
            const vScale = height * GLOBAL_PATTERN_SCALE;
            for (let i = 0; i < uvAttribute.count; i++) {
                uvAttribute.setXY(i, uvAttribute.getX(i) * uScale, uvAttribute.getY(i) * vScale);
            }
            uvAttribute.needsUpdate = true;
        };

        // --- Hips & Heavy Belt ---
        if (parts.pelvis) {
            const pGeo = new THREE.CylinderGeometry(0.23, 0.18, 0.15, 16);
            const pMesh = new THREE.Mesh(pGeo, mat);
            pMesh.scale.multiplyScalar(s);
            pMesh.position.y = -0.07;
            parts.pelvis.add(pMesh);
            meshes.push(pMesh);

            // Large Central Gold Crest
            const crestGeo = new THREE.TorusKnotGeometry(0.04, 0.015, 32, 8);
            const crest = new THREE.Mesh(crestGeo, goldMat);
            crest.position.set(0, -0.05, 0.22);
            crest.rotation.x = Math.PI / 2;
            parts.pelvis.add(crest);
            meshes.push(crest);
        }

        // --- Thighs & Ornate Knee Guards ---
        const legSets = [
            { parent: parts.leftThigh, side: -1 },
            { parent: parts.rightThigh, side: 1 }
        ];

        legSets.forEach(leg => {
            if (!leg.parent) return;

            // Crimson Base Cylinder
            const cGeo = new THREE.CylinderGeometry(0.13, 0.10, 0.42, 12);
            cGeo.translate(0, -0.21, 0);
            const cMesh = new THREE.Mesh(cGeo, mat);
            cMesh.scale.set(s, 1.0, s);
            leg.parent.add(cMesh);
            meshes.push(cMesh);
            scaleUVs(cMesh, 0.12, 0.42);

            // Physical Ornate Knee Guard (The Gold "Winged" piece)
            const guardGeo = new THREE.SphereGeometry(0.135, 12, 8, 0, Math.PI);
            const guard = new THREE.Mesh(guardGeo, goldMat);
            guard.position.set(0, -0.25, 0.05);
            guard.rotation.set(-0.2, 0, 0);
            guard.scale.set(1, 1.3, 0.6);
            leg.parent.add(guard);
            meshes.push(guard);
            
            // Decorative Gold Spikes on knee
            const spikeGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
            const spike = new THREE.Mesh(spikeGeo, goldMat);
            spike.position.set(0, -0.15, 0.15);
            spike.rotation.x = 0.5;
            leg.parent.add(spike);
            meshes.push(spike);
        });

        // --- Shins ---
        [parts.leftShin, parts.rightShin].forEach(shin => {
            if (!shin) return;
            const sGeo = new THREE.CylinderGeometry(0.10, 0.07, 0.45, 12);
            sGeo.translate(0, -0.225, 0);
            const sMesh = new THREE.Mesh(sGeo, mat);
            sMesh.scale.set(s, 1.0, s);
            shin.add(sMesh);
            meshes.push(sMesh);
        });

        return meshes;
    }
}
