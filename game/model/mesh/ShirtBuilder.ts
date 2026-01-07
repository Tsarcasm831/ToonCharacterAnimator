import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const LEATHER_COLOR = '#8B4513';
const LEATHER_DETAIL = '#5D4037';

export class ShirtBuilder {
    static build(parts: any, config: PlayerConfig) {
        // Toggle based on equipment state
        if (!config.equipment.shirt) return null;

        // Use Outfit Type to determine material style if shirt is enabled
        const isLeather = config.outfit === 'warrior';
        
        // Procedural Texture Generation
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        if (isLeather) {
            // Leather color sync
            ctx.fillStyle = LEATHER_COLOR;
            ctx.fillRect(0, 0, 512, 512);
            
            // Add some leather-like grain
            for (let i = 0; i < 2000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.01)';
                ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
            }
            
            // Simple stitching lines
            ctx.strokeStyle = LEATHER_DETAIL;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.setLineDash([10, 8]);
            ctx.strokeRect(10, 10, 492, 492);
            
            ctx.strokeRect(128, 0, 256, 512); // Central panel
            
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);
        } else {
            // Checkered / Plaid Pattern using shirtColor
            const baseColor = config.shirtColor || '#ffffff';
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 512, 512);
            
            // Generate complementary or darker stripe color
            const darken = (c: string, amt: number) => {
                const num = parseInt(c.replace("#",""), 16);
                let r = (num >> 16) - amt;
                let b = ((num >> 8) & 0x00FF) - amt;
                let g = (num & 0x0000FF) - amt;
                return "#" + (0x1000000 + (r<0?0:r)*0x10000 + (b<0?0:b)*0x100 + (g<0?0:g)).toString(16).slice(1);
            };
            const stripeColor = darken(baseColor, 40);

            // Plaid Stripes
            ctx.fillStyle = stripeColor;
            ctx.globalAlpha = 0.4;
            // Vertical
            ctx.fillRect(100, 0, 60, 512);
            ctx.fillRect(350, 0, 60, 512);
            // Horizontal
            ctx.fillRect(0, 150, 512, 60);
            ctx.fillRect(0, 350, 512, 60);
            
            // Crosshatch areas darker
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = 0.1;
            ctx.fillRect(100, 150, 60, 60);
            ctx.fillRect(350, 350, 60, 60);
            ctx.fillRect(100, 350, 60, 60);
            ctx.fillRect(350, 150, 60, 60);
        }

        const shirtTex = new THREE.CanvasTexture(canvas);
        shirtTex.wrapS = THREE.RepeatWrapping;
        shirtTex.wrapT = THREE.RepeatWrapping;
        
        // Compensate for cylinder aspect ratio to keep texture proportional
        shirtTex.repeat.set(4, 1); 

        const shirtMat = new THREE.MeshToonMaterial({ map: shirtTex });
        const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });

        const createdMeshes: THREE.Object3D[] = [];

        // 1. Torso Shirt
        const torsoRadiusTop = 0.31;
        const torsoRadiusBottom = 0.25;
        const shirtLen = 0.42; 
        
        const shirtTorsoGeo = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, shirtLen, 16);
        const shirtTorso = new THREE.Mesh(shirtTorsoGeo, shirtMat);
        shirtTorso.position.y = shirtLen/2 + 0.12;
        shirtTorso.scale.set(1, 1, 0.7); 
        shirtTorso.castShadow = true;
        
        parts.torso.add(shirtTorso);
        createdMeshes.push(shirtTorso);
        
        // Female Breast Coverage
        if (config.bodyType === 'female' && parts.chest) {
            const breastShirtGeo = new THREE.SphereGeometry(0.135, 16, 16);
            const chestChildren = [...parts.chest.children];
            for (let i = 0; i < chestChildren.length; i++) {
                const child = chestChildren[i];
                if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material !== outlineMat) {
                   const bPos = child.position.clone();
                   const bRot = child.rotation.clone();
                   const breast = new THREE.Mesh(breastShirtGeo, shirtMat);
                   breast.position.copy(bPos);
                   breast.rotation.copy(bRot);
                   breast.scale.set(1.05, 0.95, 0.65);
                   parts.chest.add(breast);
                   createdMeshes.push(breast);
                }
            }
        }

        // 2. Sleeves
        const armPairs = [
            { arm: parts.rightArm, forearm: parts.rightForeArm },
            { arm: parts.leftArm, forearm: parts.leftForeArm }
        ];

        armPairs.forEach(({ arm, forearm }) => {
            if (!arm || !forearm) return;

            // Updated for Slimmer Arms to match new shoulders
            const deltRadius = 0.075;
            const deltGeo = new THREE.SphereGeometry(deltRadius, 16, 16);
            deltGeo.scale(1.0, 1.0, 0.95);
            const delt = new THREE.Mesh(deltGeo, shirtMat);
            delt.position.y = 0.0; 
            arm.add(delt);
            createdMeshes.push(delt);

            const upperArmLen = 0.32;
            const uTop = 0.075;
            const uBot = 0.065;
            const upperGeo = new THREE.CylinderGeometry(uTop, uBot, upperArmLen * 0.9, 12);
            upperGeo.translate(0, -upperArmLen/2 + 0.02, 0); 
            const upperSleeve = new THREE.Mesh(upperGeo, shirtMat);
            upperSleeve.position.y = 0.02;
            arm.add(upperSleeve);
            createdMeshes.push(upperSleeve);
            
            // Elbow
            const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), shirtMat);
            elbow.position.y = -upperArmLen + 0.02;
            arm.add(elbow);
            createdMeshes.push(elbow);

            const lowerArmLen = 0.22;
            const fTop = 0.065;
            const fBot = 0.045; 
            const lowerGeo = new THREE.CylinderGeometry(fTop, fBot, lowerArmLen, 12);
            lowerGeo.translate(0, -lowerArmLen/2, 0);
            
            const lowerSleeve = new THREE.Mesh(lowerGeo, shirtMat);
            lowerSleeve.scale.set(1.0, 1, 0.85); 
            forearm.add(lowerSleeve);
            createdMeshes.push(lowerSleeve);
        });

        return createdMeshes;
    }
}