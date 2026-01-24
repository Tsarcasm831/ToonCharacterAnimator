import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { calculateBounds, isPointInPolygon, landCoordsToWorld, LAND_SCALE } from './landTerrain';
import { LightingManager } from './LightingManager';
import { WorldGridManager } from './WorldGridManager';
import { ObjectFactory } from './ObjectFactory';
import { PlayerUtils } from '../player/PlayerUtils';

export class SingleBiomeEnvironment {
    public group: THREE.Group;
    private scene: THREE.Scene;
    private mesh: THREE.Mesh | null = null;
    public obstacles: THREE.Object3D[] = [];
    private landPoints: number[][] | null = null;
    private lightingManager: LightingManager;
    private worldGrid: WorldGridManager;
    private circularWallGroups: THREE.Object3D[] = [];
    private circularWallCenter: THREE.Vector2 | null = null;
    private currentBiome: { name: string, color: string, type: string } = { name: 'Grass', color: '#4ade80', type: 'Grass' };
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.lightingManager = new LightingManager(scene);
        this.worldGrid = new WorldGridManager(this.group);
    }

    public syncSkySphereToLand(points?: number[][]) {
        const landPoints = points ?? this.landPoints;
        if (!landPoints) return;
        const bounds = calculateBounds(landPoints);
        const worldWidth = bounds.worldMaxX - bounds.worldMinX;
        const worldDepth = bounds.worldMaxZ - bounds.worldMinZ;
        this.updateSkySphereForBounds(worldWidth, worldDepth);
    }

    public setLandData(points: number[][], biome?: { name: string, color: string, type?: string }) {
        this.landPoints = points;
        if (biome) {
            this.currentBiome = {
                name: biome.name,
                color: biome.color,
                type: biome.type || 'Grass'
            };
        }
        this.build();
    }

    public setVisible(visible: boolean) {
        this.group.visible = visible;
        if (!visible) {
             // We might want to handle lighting visibility too, but LightingManager adds to scene root
             // Usually LightingManager handles its own cleanup or we can hide lights
        }
    }

    public dispose() {
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }

        this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        if (this.mesh) {
            this.mesh = null;
        }
        this.obstacles = [];
        this.lightingManager.dispose();
        this.worldGrid.dispose();
        PlayerUtils.setCustomLandPolygon(null); // Clear constraint
    }

    private build() {
        if (!this.landPoints) return;

        // Dispose existing mesh if any
        if (this.mesh) {
            this.group.remove(this.mesh);
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.dispose());
            } else {
                this.mesh.material.dispose();
            }
            this.mesh = null;
            this.obstacles = [];
        }

        const bounds = calculateBounds(this.landPoints);
        const { worldMinX, worldMaxX, worldMinZ, worldMaxZ, centerX, centerZ } = bounds;
        const worldWidth = worldMaxX - worldMinX;
        const worldDepth = worldMaxZ - worldMinZ;
        this.updateSkySphereForBounds(worldWidth, worldDepth);

        // Convert raw land points to world space for the polygon check
        const worldPoints = this.landPoints.map(p => {
            const w = landCoordsToWorld(p[0], p[1], centerX, centerZ);
            return [w.x, w.z];
        });

        // Set player constraint
        PlayerUtils.setCustomLandPolygon(worldPoints);

        // Build a terrain mesh that only includes triangles fully inside the land polygon.
        const step = 4;
        const segmentsX = Math.max(1, Math.floor(worldWidth / step));
        const segmentsZ = Math.max(1, Math.floor(worldDepth / step));
        const vertsX = segmentsX + 1;
        const vertsZ = segmentsZ + 1;
        const totalVerts = vertsX * vertsZ;

        const positions = new Float32Array(totalVerts * 3);
        const uvs = new Float32Array(totalVerts * 2);
        const inside = new Array<boolean>(totalVerts);

        const startX = worldMinX;
        const startZ = worldMinZ;

        let v = 0;
        for (let z = 0; z < vertsZ; z += 1) {
            const zPos = startZ + z * step;
            for (let x = 0; x < vertsX; x += 1) {
                const xPos = startX + x * step;
                // Flat terrain for now
                const yPos = 0;
                
                const idx = v * 3;
                positions[idx] = xPos;
                positions[idx + 1] = yPos;
                positions[idx + 2] = zPos;

                const uvIdx = v * 2;
                uvs[uvIdx] = x / segmentsX;
                uvs[uvIdx + 1] = 1 - z / segmentsZ;

                // Use the world space points for the check
                inside[v] = isPointInPolygon(xPos, zPos, worldPoints);
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

        // Material - Based on biome
        const material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(this.currentBiome.color),
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.userData = { type: 'ground', terrainType: this.currentBiome.type };
        
        this.group.add(this.mesh);
        this.obstacles.push(this.mesh);

        if (this.circularWallCenter) {
            this.addCircularWall(this.circularWallCenter, 2);
        }
    }

    private updateSkySphereForBounds(worldWidth: number, worldDepth: number) {
        const halfWidth = worldWidth * 0.5;
        const halfDepth = worldDepth * 0.5;
        const landRadius = Math.sqrt((halfWidth * halfWidth) + (halfDepth * halfDepth));
        const skyRadius = landRadius * 1.2;
        this.lightingManager.setSkySphereRadius(skyRadius);
    }

    update(dt: number, config: PlayerConfig, playerPos: THREE.Vector3) {
        if (!this.group.visible) return;
        this.lightingManager.update(dt, config);
        this.worldGrid.update(playerPos);
    }

    // Interface methods for compatibility with Player/Game
    getBiomeAt(pos: THREE.Vector3): { name: string, color: string, type: string } {
        return this.currentBiome;
    }

    damageObstacle(obj: THREE.Object3D, amount: number): string | null {
        return null;
    }

    addObstacle(obj: THREE.Object3D) {
        this.group.add(obj);
        this.obstacles.push(obj);
    }
    
    toggleWorldGrid(visible?: boolean) {
        if (typeof visible === 'boolean') {
            this.worldGrid.setVisible(visible);
            return;
        }
        this.worldGrid.toggle();
    }

    public setCircularWallCenter(center: THREE.Vector2 | null) {
        this.circularWallCenter = center;
        if (!this.mesh) return;
        if (center) {
            this.addCircularWall(center, 2);
        } else {
            this.clearCircularWalls();
        }
    }

    private addCircularWall(center: THREE.Vector2, diameterInGrids: number) {
        const GRID_SIZE = 1.3333;
        const WALL_LENGTH = GRID_SIZE * 4;
        const wallScale = 0.5;
        const segmentCount = 8;
        const targetRadius = (diameterInGrids * GRID_SIZE) * 0.5;
        const segmentLength = WALL_LENGTH * wallScale;
        const minRadius = segmentLength / (2 * Math.sin(Math.PI / segmentCount));
        const radius = Math.max(targetRadius, minRadius);

        this.clearCircularWalls();

        for (let i = 0; i < segmentCount; i += 1) {
            const angleA = (i / segmentCount) * Math.PI * 2;
            const angleB = ((i + 1) / segmentCount) * Math.PI * 2;
            const v1 = new THREE.Vector2(
                center.x + Math.cos(angleA) * radius,
                center.y + Math.sin(angleA) * radius
            );
            const v2 = new THREE.Vector2(
                center.x + Math.cos(angleB) * radius,
                center.y + Math.sin(angleB) * radius
            );
            const mid = v1.clone().add(v2).multiplyScalar(0.5);
            const dir = v2.clone().sub(v1);
            const rotation = Math.atan2(dir.y, dir.x) + Math.PI / 2;
            const y = PlayerUtils.getTerrainHeight(mid.x, mid.y);
            const { group, obstacle } = ObjectFactory.createWall(new THREE.Vector3(mid.x, y, mid.y), rotation);
            group.scale.setScalar(wallScale);
            this.group.add(group);
            this.obstacles.push(obstacle);
            this.circularWallGroups.push(group);
        }
    }

    private clearCircularWalls() {
        this.circularWallGroups.forEach(group => {
            this.group.remove(group);
            group.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.circularWallGroups = [];
    }
}
