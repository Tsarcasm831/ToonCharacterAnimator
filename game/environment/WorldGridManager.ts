
import * as THREE from 'three';
import { BIOME_DATA, ENV_CONSTANTS } from './EnvironmentTypes';

export class WorldGridManager {
    private scene: THREE.Scene;
    private group: THREE.Group;
    private isVisible: boolean = false;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.visible = false;
        this.scene.add(this.group);
        this.build();
    }

    private build() {
        const patchSize = ENV_CONSTANTS.PATCH_SIZE;
        const biomeSize = ENV_CONSTANTS.BIOME_SIZE;
        const cellSize = 1.3333; // 1/3 of previous 4
        // Covering expanded world (radius 7 patches)
        const worldRadius = patchSize * 7.5; 
        
        // 1. GRID LINES
        const majorLineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
        const minorLineMat = new THREE.LineBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.3 });
        
        const majorPoints: THREE.Vector3[] = [];
        const minorPoints: THREE.Vector3[] = [];

        // Adjust loop to align with center
        const start = -Math.ceil(worldRadius / cellSize) * cellSize;
        
        for (let x = start; x <= worldRadius; x += cellSize) {
            const distFromBound = Math.abs((x % patchSize) - (patchSize/2));
            const isMajor = Math.abs(x % patchSize) < 0.1 || Math.abs(distFromBound) < 0.1;

            const targetPoints = isMajor ? majorPoints : minorPoints;
            targetPoints.push(new THREE.Vector3(x, 0.05, -worldRadius));
            targetPoints.push(new THREE.Vector3(x, 0.05, worldRadius));
        }

        for (let z = start; z <= worldRadius; z += cellSize) {
            const distFromBound = Math.abs((z % patchSize) - (patchSize/2));
            const isMajor = Math.abs(z % patchSize) < 0.1 || Math.abs(distFromBound) < 0.1;

            const targetPoints = isMajor ? majorPoints : minorPoints;
            targetPoints.push(new THREE.Vector3(-worldRadius, 0.05, z));
            targetPoints.push(new THREE.Vector3(worldRadius, 0.05, z));
        }

        const majorGeo = new THREE.BufferGeometry().setFromPoints(majorPoints);
        const minorGeo = new THREE.BufferGeometry().setFromPoints(minorPoints);
        
        this.group.add(new THREE.LineSegments(majorGeo, majorLineMat));
        this.group.add(new THREE.LineSegments(minorGeo, minorLineMat));

        // 2. LABELS - Show Patch Index (P) and Biome Index (B)
        const labelGeo = new THREE.PlaneGeometry(1.8, 0.9);
        labelGeo.scale(0.5, 0.5, 1);
        
        // Loop through expanded patches
        for (let px = -7; px <= 7; px++) {
            for (let pz = -7; pz <= 7; pz++) {
                const cx = px * patchSize;
                const cz = pz * patchSize;
                
                // Calculate Biome Index
                const bx = Math.round(cx / biomeSize);
                const bz = Math.round(cz / biomeSize);
                
                const biome = BIOME_DATA[`${bx},${bz}`];
                if (biome) {
                    const text = `P:${px},${pz}\nB:${bx},${bz}`;
                    const label = this.createLabel(text, biome.color);
                    label.geometry = labelGeo;
                    label.position.set(cx, 0.1, cz);
                    label.rotation.x = -Math.PI / 2;
                    this.group.add(label);
                }
            }
        }
    }

    private createLabel(text: string, accentColor: string): THREE.Mesh {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.Mesh();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 128, 64);
        
        // Bottom bar with biome color
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 60, 128, 4);

        // Text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const lines = text.split('\n');
        
        ctx.font = 'bold 20px Arial';
        ctx.fillText(lines[0], 64, 20);
        
        if (lines.length > 1) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(lines[1], 64, 42);
        }

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ 
            map: tex, 
            transparent: true,
            depthTest: true,
            depthWrite: false, 
        });
        
        return new THREE.Mesh(undefined, mat);
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.group.visible = this.isVisible;
    }
}
