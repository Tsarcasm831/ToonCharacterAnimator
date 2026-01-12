
import * as THREE from 'three';
import { BIOME_DATA, ENV_CONSTANTS } from './EnvironmentTypes';

interface LabelPoolMember {
    mesh: THREE.Mesh;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
    currentKey: string;
}

export class WorldGridManager {
    private scene: THREE.Scene;
    private group: THREE.Group;
    private isVisible: boolean = false;
    private labelPool: LabelPoolMember[] = [];
    private readonly poolSize = 256; // More than enough for 10m radius at 1.33m spacing
    private readonly cellSize = 1.3333; // 40/30 or 4/3
    private lastUpdatePos = new THREE.Vector3(Infinity, Infinity, Infinity);

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.visible = false;
        this.scene.add(this.group);
        this.buildGridLines();
        this.initLabelPool();
    }

    private buildGridLines() {
        const patchSize = ENV_CONSTANTS.PATCH_SIZE;
        const worldRadius = patchSize * 7.5; 
        
        const majorLineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
        const minorLineMat = new THREE.LineBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.2 });
        
        const majorPoints: THREE.Vector3[] = [];
        const minorPoints: THREE.Vector3[] = [];

        const start = -Math.ceil(worldRadius / this.cellSize) * this.cellSize;
        
        for (let x = start; x <= worldRadius; x += this.cellSize) {
            const distFromBound = Math.abs((x % patchSize) - (patchSize/2));
            const isMajor = Math.abs(x % patchSize) < 0.1 || Math.abs(distFromBound) < 0.1;

            const targetPoints = isMajor ? majorPoints : minorPoints;
            targetPoints.push(new THREE.Vector3(x, 0.05, -worldRadius));
            targetPoints.push(new THREE.Vector3(x, 0.05, worldRadius));
        }

        for (let z = start; z <= worldRadius; z += this.cellSize) {
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
    }

    private initLabelPool() {
        const labelGeo = new THREE.PlaneGeometry(0.8, 0.4);
        
        for (let i = 0; i < this.poolSize; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 32;
            const ctx = canvas.getContext('2d')!;
            
            const tex = new THREE.CanvasTexture(canvas);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;

            const mat = new THREE.MeshBasicMaterial({ 
                map: tex, 
                transparent: true,
                depthTest: true,
                depthWrite: false, 
            });

            const mesh = new THREE.Mesh(labelGeo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.visible = false;
            mesh.frustumCulled = true;
            this.group.add(mesh);

            this.labelPool.push({
                mesh,
                canvas,
                context: ctx,
                texture: tex,
                currentKey: ''
            });
        }
    }

    private updateLabel(member: LabelPoolMember, x: number, z: number, color: string) {
        const rx = Math.round(x);
        const rz = Math.round(z);
        const key = `${rx},${rz}_${color}`;
        
        if (member.currentKey === key) return;

        const ctx = member.context;
        ctx.clearRect(0, 0, 64, 32);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, 64, 32);
        
        // Left accent
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 4, 32);

        // Text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`${rx},${rz}`, 34, 16);

        member.texture.needsUpdate = true;
        member.currentKey = key;
    }

    update(playerPos: THREE.Vector3) {
        if (!this.isVisible) return;

        // Throttled distance check: only update if player moved significantly
        if (playerPos.distanceToSquared(this.lastUpdatePos) < 0.04) return;
        this.lastUpdatePos.copy(playerPos);

        const biomeSize = ENV_CONSTANTS.BIOME_SIZE;
        const visibleRadius = 10;
        const sqRadius = visibleRadius * visibleRadius;
        const cellCount = Math.ceil(visibleRadius / this.cellSize);

        // Find current cell center index
        const px = Math.floor(playerPos.x / this.cellSize);
        const pz = Math.floor(playerPos.z / this.cellSize);

        let poolIdx = 0;

        for (let ix = px - cellCount; ix <= px + cellCount; ix++) {
            for (let iz = pz - cellCount; iz <= pz + cellCount; iz++) {
                if (poolIdx >= this.poolSize) break;

                // Cell center in world space
                const cx = (ix + 0.5) * this.cellSize;
                const cz = (iz + 0.5) * this.cellSize;

                const dx = cx - playerPos.x;
                const dz = cz - playerPos.z;
                const distSq = dx * dx + dz * dz;

                if (distSq <= sqRadius) {
                    const member = this.labelPool[poolIdx];
                    
                    // Determine Biome
                    const bx = Math.round(cx / biomeSize);
                    const bz = Math.round(cz / biomeSize);
                    const biome = BIOME_DATA[`${bx},${bz}`] || BIOME_DATA['0,0'];

                    member.mesh.position.set(cx, 0.08, cz);
                    member.mesh.visible = true;
                    this.updateLabel(member, cx, cz, biome.color);
                    
                    poolIdx++;
                }
            }
        }

        // Hide remaining pool members
        for (let i = poolIdx; i < this.poolSize; i++) {
            this.labelPool[i].mesh.visible = false;
        }
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.group.visible = this.isVisible;
        if (!this.isVisible) {
            this.labelPool.forEach(m => m.mesh.visible = false);
            this.lastUpdatePos.set(Infinity, Infinity, Infinity);
        }
    }
}
