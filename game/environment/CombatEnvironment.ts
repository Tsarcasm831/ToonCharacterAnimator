
import * as THREE from 'three';
import { PlayerConfig } from '../../types';

export class CombatEnvironment {
    public group: THREE.Group;
    private scene: THREE.Scene;
    public obstacles: THREE.Object3D[] = [];
    
    // Grid Config
    public readonly GRID_ROWS = 13;
    public readonly GRID_COLS = 13;
    private readonly HEX_SIZE = 1.5; // Increased size for better spacing on small grid
    private readonly HEX_HEIGHT = 0.5;

    private gridLabelsGroup: THREE.Group | null = null;
    private hexMeshes: THREE.Mesh[] = [];
    private neutralMat: THREE.MeshStandardMaterial | null = null;
    public isCombatStarted: boolean = false;
    
    // Pre-calculated spacing
    private readonly WIDTH: number;
    private readonly HEIGHT: number;
    private readonly HORIZ_DIST: number;
    private readonly VERT_DIST: number;
    private readonly OFFSET_X: number;
    private readonly OFFSET_Z: number;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.visible = false; // Hidden by default
        this.scene.add(this.group);
        
        // Init constants
        this.WIDTH = Math.sqrt(3) * this.HEX_SIZE;
        this.HEIGHT = 2 * this.HEX_SIZE;
        this.HORIZ_DIST = this.WIDTH;
        this.VERT_DIST = 0.75 * this.HEIGHT;
        const totalWidth = this.GRID_COLS * this.HORIZ_DIST + (this.HORIZ_DIST / 2);
        const totalHeight = this.GRID_ROWS * this.VERT_DIST;
        this.OFFSET_X = -totalWidth / 2 + (this.HORIZ_DIST / 2);
        this.OFFSET_Z = -totalHeight / 2 + (this.VERT_DIST / 2);

        this.buildGrid();
    }

    public setVisible(visible: boolean) {
        this.group.visible = visible;
        if (!visible && this.gridLabelsGroup) {
            this.gridLabelsGroup.visible = false;
        }
    }

    public dispose() {
        // Remove from scene
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }

        // Dispose geometries and materials
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

        if (this.neutralMat) {
            this.neutralMat.dispose();
        }

        // Clear references
        this.hexMeshes = [];
        this.obstacles = [];
        this.occupiedCells.clear();
        this.gridLabelsGroup = null;
    }

    public toggleGridLabels(visible: boolean) {
        if (!this.gridLabelsGroup) {
            this.buildGridLabels();
        }
        if (this.gridLabelsGroup) {
            this.gridLabelsGroup.visible = visible;
        }
    }

    public getGridPosition(position: THREE.Vector3): { r: number, c: number } | null {
        let minDesc = Infinity;
        let bestGrid = null;

        for (let r = 0; r < this.GRID_ROWS; r++) {
            for (let c = 0; c < this.GRID_COLS; c++) {
                const xPos = c * this.HORIZ_DIST + ((r % 2) * (this.HORIZ_DIST / 2)) + this.OFFSET_X;
                const zPos = r * this.VERT_DIST + this.OFFSET_Z;
                
                const distSq = (position.x - xPos) ** 2 + (position.z - zPos) ** 2;
                if (distSq < minDesc) {
                    minDesc = distSq;
                    bestGrid = { r, c };
                }
            }
        }
        return bestGrid;
    }

    public getWorldPosition(r: number, c: number): THREE.Vector3 {
        const xPos = c * this.HORIZ_DIST + ((r % 2) * (this.HORIZ_DIST / 2)) + this.OFFSET_X;
        const zPos = r * this.VERT_DIST + this.OFFSET_Z;
        return new THREE.Vector3(xPos, 0, zPos);
    }

    private occupiedCells: Set<string> = new Set();

    public setCellOccupied(r: number, c: number, occupied: boolean) {
        const key = `${r},${c}`;
        if (occupied) {
            this.occupiedCells.add(key);
        } else {
            this.occupiedCells.delete(key);
        }
    }

    public isCellOccupied(r: number, c: number): boolean {
        return this.occupiedCells.has(`${r},${c}`);
    }

    public getPath(start: THREE.Vector3, end: THREE.Vector3): { r: number, c: number }[] {
        const startGrid = this.getGridPosition(start);
        const endGrid = this.getGridPosition(end);

        if (!startGrid || !endGrid) return [];
        if (startGrid.r === endGrid.r && startGrid.c === endGrid.c) return [];

        // Simple A* or BFS for hex grid
        const queue: { r: number, c: number, path: { r: number, c: number }[] }[] = [{ ...startGrid, path: [] }];
        const visited = new Set<string>();
        visited.add(`${startGrid.r},${startGrid.c}`);

        while (queue.length > 0) {
            const { r, c, path } = queue.shift()!;

            if (r === endGrid.r && c === endGrid.c) {
                return path;
            }

            const neighbors = this.getNeighbors(r, c);
            for (const neighbor of neighbors) {
                const key = `${neighbor.r},${neighbor.c}`;
                // Allow moving to the neighbor if it's not occupied OR if it is the destination
                // DURING COMBAT AI, we do NOT restrict movement by territory
                const isDest = neighbor.r === endGrid.r && neighbor.c === endGrid.c;
                if (!visited.has(key) && (!this.isCellOccupied(neighbor.r, neighbor.c) || isDest)) {
                    visited.add(key);
                    queue.push({ ...neighbor, path: [...path, neighbor] });
                }
            }
        }

        return [];
    }

    private getNeighbors(r: number, c: number): { r: number, c: number }[] {
        const neighbors: { r: number, c: number }[] = [];
        const directions = [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            r % 2 === 0 ? [1, -1] : [1, 1],
            r % 2 === 0 ? [-1, -1] : [-1, 1]
        ];

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.GRID_ROWS && nc >= 0 && nc < this.GRID_COLS) {
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    public snapToGrid(position: THREE.Vector3): THREE.Vector3 {
        const gridPos = this.getGridPosition(position);
        if (!gridPos) return position.clone();
        const snapped = this.getWorldPosition(gridPos.r, gridPos.c);
        snapped.y = position.y;
        return snapped;
    }

    private buildGridLabels() {
        this.gridLabelsGroup = new THREE.Group();
        this.group.add(this.gridLabelsGroup);

        const labelGeo = new THREE.PlaneGeometry(1.5, 1.5);

        for (let r = 0; r < this.GRID_ROWS; r++) {
            for (let c = 0; c < this.GRID_COLS; c++) {
                const xPos = c * this.HORIZ_DIST + ((r % 2) * (this.HORIZ_DIST / 2)) + this.OFFSET_X;
                const zPos = r * this.VERT_DIST + this.OFFSET_Z;

                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 128;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Draw a subtle dark circle background for better readability
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.beginPath();
                    ctx.arc(64, 64, 60, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw text
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.font = 'bold 54px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${r},${c}`, 64, 64);
                }

                const texture = new THREE.CanvasTexture(canvas);
                const mat = new THREE.MeshBasicMaterial({ 
                    map: texture,
                    transparent: true,
                    depthTest: true,
                    depthWrite: false, 
                    side: THREE.DoubleSide
                });

                const mesh = new THREE.Mesh(labelGeo, mat);
                // Positioned slightly above the hex surface (surface is at 0)
                mesh.position.set(xPos, 0.02, zPos);
                // Rotate to lie flat on the ground
                mesh.rotation.x = -Math.PI / 2;
                
                this.gridLabelsGroup.add(mesh);
            }
        }
    }

    private buildGrid() {
        const hexGeo = new THREE.CylinderGeometry(this.HEX_SIZE, this.HEX_SIZE, this.HEX_HEIGHT, 6);
        
        const matRed = new THREE.MeshStandardMaterial({ color: 0x662222, roughness: 0.7, flatShading: true });
        const matGreen = new THREE.MeshStandardMaterial({ color: 0x224422, roughness: 0.7, flatShading: true });
        const matBorder = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9 });

        for (let r = 0; r < this.GRID_ROWS; r++) {
            for (let c = 0; c < this.GRID_COLS; c++) {
                const hexGroup = new THREE.Group();
                
                // Calculate position
                const xPos = c * this.HORIZ_DIST + ((r % 2) * (this.HORIZ_DIST / 2)) + this.OFFSET_X;
                const zPos = r * this.VERT_DIST + this.OFFSET_Z;

                hexGroup.position.set(xPos, 0, zPos);

                // Main Tile - Top half (r < rows/2) is red, bottom half is green
                const isTopHalf = r < this.GRID_ROWS / 2;
                const mesh = new THREE.Mesh(hexGeo, isTopHalf ? matRed : matGreen);
                mesh.position.y = -this.HEX_HEIGHT / 2; // Top surface at y=0
                mesh.receiveShadow = true;
                mesh.userData.originalMat = isTopHalf ? matRed : matGreen;
                mesh.userData.type = 'ground'; // Mark as ground
                this.hexMeshes.push(mesh);
                
                // Slight inset for border visual
                mesh.scale.set(0.95, 1, 0.95);
                
                // Border/Base
                const border = new THREE.Mesh(hexGeo, matBorder);
                border.position.y = -this.HEX_HEIGHT / 2 - 0.05;
                border.scale.set(1.0, 1.0, 1.0);

                hexGroup.add(border);
                hexGroup.add(mesh);
                
                // Metadata for game logic
                hexGroup.userData = { 
                    type: 'ground', 
                    gridPos: { r, c },
                    isHex: true 
                };
                
                // We add the actual mesh to obstacles so collision works on the surface
                this.obstacles.push(mesh);
                this.group.add(hexGroup);
            }
        }
        
        // Add a floor plane way below to catch falling objects
        const floorGeo = new THREE.PlaneGeometry(300, 300);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -10;
        // Make floor intersectable for dragging logic raycasts
        floor.userData = { type: 'ground' }; 
        this.group.add(floor);
        this.obstacles.push(floor);
        
        // Add some arena lighting
        const arenaLight = new THREE.PointLight(0x00ffff, 0.5, 50);
        arenaLight.position.set(0, 10, 0);
        this.group.add(arenaLight);
    }

    update(dt: number, config: PlayerConfig, playerPos: THREE.Vector3) {
        if (!this.group.visible) return;
    }

    /**
     * Toggle the red/green team coloration on the grid.
     * When combat starts, we turn off the colors to neutral.
     */
    public setCombatStarted(started: boolean) {
        this.isCombatStarted = started;
        
        if (!this.neutralMat) {
            this.neutralMat = new THREE.MeshStandardMaterial({ color: 0x3d4852, roughness: 0.7, flatShading: true });
        }
        
        this.hexMeshes.forEach(mesh => {
            if (started) {
                mesh.material = this.neutralMat!;
            } else {
                mesh.material = mesh.userData.originalMat;
            }
        });
    }

    // Interface compatibility with Environment
    getBiomeAt(pos: THREE.Vector3): { name: string, color: string } {
        return { name: 'Combat Arena', color: '#607d8b' };
    }

    damageObstacle(obj: THREE.Object3D, amount: number): string | null {
        // Hexes are indestructible
        return null;
    }

    addObstacle(obj: THREE.Object3D) {
        this.group.add(obj);
        this.obstacles.push(obj);
    }
    
    toggleWorldGrid() {
        // Already a grid
    }
}
