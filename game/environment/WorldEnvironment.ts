
import * as THREE from 'three';
import { getLandHeightAt, worldWidth, worldDepth, isWorldPointInLand } from './landTerrain';
import { PlayerConfig } from '../../types';

export class WorldEnvironment {
    public group: THREE.Group;
    private scene: THREE.Scene;
    private mesh: THREE.Mesh | null = null;
    public obstacles: THREE.Object3D[] = [];
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.build();
    }

    setVisible(visible: boolean) {
        this.group.visible = visible;
    }

    private build() {
        // Build a terrain mesh that only includes triangles fully inside the land polygon.
        const step = 1;
        const segmentsX = Math.max(1, Math.floor(worldWidth / step));
        const segmentsZ = Math.max(1, Math.floor(worldDepth / step));
        const vertsX = segmentsX + 1;
        const vertsZ = segmentsZ + 1;
        const totalVerts = vertsX * vertsZ;

        const positions = new Float32Array(totalVerts * 3);
        const uvs = new Float32Array(totalVerts * 2);
        const inside = new Array<boolean>(totalVerts);

        const startX = -worldWidth / 2;
        const startZ = -worldDepth / 2;

        let v = 0;
        for (let z = 0; z < vertsZ; z += 1) {
            const zPos = startZ + z * step;
            for (let x = 0; x < vertsX; x += 1) {
                const xPos = startX + x * step;
                const yPos = getLandHeightAt(xPos, zPos);
                const idx = v * 3;
                positions[idx] = xPos;
                positions[idx + 1] = yPos;
                positions[idx + 2] = zPos;

                const uvIdx = v * 2;
                uvs[uvIdx] = x / segmentsX;
                uvs[uvIdx + 1] = 1 - z / segmentsZ;

                inside[v] = isWorldPointInLand(xPos, zPos);
                v += 1;
            }
        }

        const indices: number[] = [];
        for (let z = 0; z < segmentsZ; z += 1) {
            for (let x = 0; x < segmentsX; x += 1) {
                const a = x + z * vertsX;
                const b = x + (z + 1) * vertsX;
                const c = (x + 1) + (z + 1) * vertsX;
                const d = (x + 1) + z * vertsX;

                if (inside[a] && inside[b] && inside[c] && inside[d]) {
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        // 4. Material
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xf8fbff, // Snow
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide
        });

        // Add subtle snow texture detail without relying on external assets.
        const snowCanvas = document.createElement('canvas');
        const size = 256;
        snowCanvas.width = size;
        snowCanvas.height = size;
        const ctx = snowCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#f8fbff';
            ctx.fillRect(0, 0, size, size);
            for (let i = 0; i < 20000; i += 1) {
                const shade = 230 + Math.floor(Math.random() * 25);
                ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
                ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
            }
        }
        const snowTexture = new THREE.CanvasTexture(snowCanvas);
        snowTexture.wrapS = THREE.RepeatWrapping;
        snowTexture.wrapT = THREE.RepeatWrapping;
        snowTexture.repeat.set(100, 100);
        material.map = snowTexture;

        material.transparent = false;

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.userData = { type: 'ground' };
        
        this.group.add(this.mesh);
        this.obstacles.push(this.mesh);

        // Add a simple water plane below
        const waterGeo = new THREE.PlaneGeometry(2000, 2000);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -25; // Lowered from -18 to -25
        this.group.add(water);
    }

    update(dt: number, config: PlayerConfig, playerPos: THREE.Vector3) {
        if (!this.group.visible) return;
        // Update logic for world scene
    }

    // Interface methods for compatibility with Player/Game
    getBiomeAt(pos: THREE.Vector3): { name: string, color: string } {
        return { name: 'Snow', color: '#ffffff' };
    }

    damageObstacle(obj: THREE.Object3D, amount: number): string | null {
        return null;
    }

    addObstacle(obj: THREE.Object3D) {
        this.group.add(obj);
        this.obstacles.push(obj);
    }
    
    toggleWorldGrid() {
        // No grid in world scene yet
    }
}
