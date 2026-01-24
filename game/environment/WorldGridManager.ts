
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
    private parent: THREE.Object3D;
    private group: THREE.Group;
    private isVisible: boolean = false;
    private labelPool: LabelPoolMember[] = [];
    private readonly poolSize = 200; // Drastically reduced from 10000 to avoid freezing startup
    private readonly cellSize = 1.3333; 
    private readonly devWorldRadius = 100; // Radius to cover the entire dev scene area
    private lastUpdatePos = new THREE.Vector3(Infinity, Infinity, Infinity);

    constructor(parent: THREE.Object3D) {
        this.parent = parent;
        this.group = new THREE.Group();
        this.group.visible = false;
        this.parent.add(this.group);
        this.buildGridLines();
        this.initLabelPool();
    }

    private buildGridLines() {
        const worldRadius = this.devWorldRadius; 
        
        const majorLineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
        const minorLineMat = new THREE.LineBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.2 });
        
        const majorPoints: THREE.Vector3[] = [];
        const minorPoints: THREE.Vector3[] = [];

        // Use integer steps to avoid floating point drift
        // worldRadius is approx 100. cellSize is 1.33. 100/1.33 = 75 cells.
        const cellRadius = Math.ceil(worldRadius / this.cellSize);
        
        for (let i = -cellRadius; i <= cellRadius; i++) {
            const x = i * this.cellSize;
            
            // We want major lines at patch boundaries.
            // Patches are 10 cells wide.
            // Boundaries are at indices -15, -5, 5, 15, etc.
            // This corresponds to i % 10 === 5 or -5.
            const isMajor = Math.abs(i % 10) === 5;

            const targetPoints = isMajor ? majorPoints : minorPoints;
            targetPoints.push(new THREE.Vector3(x, 0.05, -worldRadius));
            targetPoints.push(new THREE.Vector3(x, 0.05, worldRadius));
        }

        for (let j = -cellRadius; j <= cellRadius; j++) {
            const z = j * this.cellSize;
            
            const isMajor = Math.abs(j % 10) === 5;

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
        const labelGeo = new THREE.PlaneGeometry(1.1, 0.55);
        
        for (let i = 0; i < this.poolSize; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            
            const tex = new THREE.CanvasTexture(canvas);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.anisotropy = 4;

            const mat = new THREE.MeshBasicMaterial({ 
                map: tex, 
                transparent: true,
                depthTest: false, // keep labels visible over terrain textures
                depthWrite: false, 
            });

            const mesh = new THREE.Mesh(labelGeo, mat);
            mesh.renderOrder = 2;
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

    private updateLabel(member: LabelPoolMember, ix: number, iz: number, color: string) {
        const key = `${ix},${iz}_${color}`;
        
        if (member.currentKey === key) return;

        const ctx = member.context;
        ctx.clearRect(0, 0, 128, 64);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, 128, 64);
        
        // Left accent
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 6, 64);

        // Text
        const label = `${ix},${iz}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px monospace';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeText(label, 70, 32);
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 6;
        ctx.fillText(label, 70, 32);
        ctx.shadowBlur = 0;

        member.texture.needsUpdate = true;
        member.currentKey = key;
    }

    update(playerPos: THREE.Vector3) {
        if (!this.isVisible) return;

        // Throttled distance check: only update if player moved significantly
        if (playerPos.distanceToSquared(this.lastUpdatePos) < 0.04) return;
        this.lastUpdatePos.copy(playerPos);

        const biomeSize = ENV_CONSTANTS.BIOME_SIZE;
        // Reduce check radius to what's reasonably visible to save sorting time
        // Camera is usually not seeing more than 40 units away clearly for labels
        const visibleRadius = 40; 
        const sqRadius = visibleRadius * visibleRadius;
        const cellCount = Math.ceil(visibleRadius / this.cellSize);

        // Identify center cell
        const centerIx = Math.round(playerPos.x / this.cellSize);
        const centerIz = Math.round(playerPos.z / this.cellSize);

        // Collect valid visible cells
        const visibleCells: {ix: number, iz: number, distSq: number}[] = [];

        for (let ix = centerIx - cellCount; ix <= centerIx + cellCount; ix++) {
            for (let iz = centerIz - cellCount; iz <= centerIz + cellCount; iz++) {
                const cx = (ix + 0.5) * this.cellSize;
                const cz = (iz + 0.5) * this.cellSize;
                
                const dx = cx - playerPos.x;
                const dz = cz - playerPos.z;
                const distSq = dx * dx + dz * dz;

                if (distSq <= sqRadius) {
                    visibleCells.push({ ix, iz, distSq });
                }
            }
        }

        // Sort by distance to prioritize closest labels
        visibleCells.sort((a, b) => a.distSq - b.distSq);

        // Render up to poolSize
        let poolIdx = 0;
        const count = Math.min(visibleCells.length, this.poolSize);

        for (let i = 0; i < count; i++) {
            const cell = visibleCells[i];
            const member = this.labelPool[poolIdx];
            
            const cx = (cell.ix + 0.5) * this.cellSize;
            const cz = (cell.iz + 0.5) * this.cellSize;

            // Determine Biome
            const bx = Math.round(cx / biomeSize);
            const bz = Math.round(cz / biomeSize);
            const biome = BIOME_DATA[`${bx},${bz}`] || BIOME_DATA['0,0'];

            member.mesh.position.set(cx, 0.08, cz);
            member.mesh.visible = true;
            this.updateLabel(member, cell.ix, cell.iz, biome.color);
            
            poolIdx++;
        }

        // Hide remaining pool members
        for (let i = poolIdx; i < this.poolSize; i++) {
            this.labelPool[i].mesh.visible = false;
        }
    }

    toggle() {
        this.setVisible(!this.isVisible);
    }

    setVisible(visible: boolean) {
        if (this.isVisible === visible) return;
        this.isVisible = visible;
        this.group.visible = visible;
        if (!visible) {
            this.labelPool.forEach(m => m.mesh.visible = false);
            this.lastUpdatePos.set(Infinity, Infinity, Infinity);
        }
    }

    dispose() {
        this.parent.remove(this.group);
        this.group.traverse(child => {
            if (child instanceof THREE.LineSegments) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        this.labelPool.forEach(member => {
            member.texture.dispose();
        });
        this.labelPool = [];
    }
}
