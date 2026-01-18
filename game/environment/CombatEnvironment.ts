
import * as THREE from 'three';
import { PlayerConfig } from '../../types';

export class CombatEnvironment {
    public group: THREE.Group;
    private scene: THREE.Scene;
    public obstacles: THREE.Object3D[] = [];
    
    // Grid Config
    private readonly GRID_ROWS = 8;
    private readonly GRID_COLS = 8;
    private readonly HEX_SIZE = 2.5; // Slightly larger hexes for better arena feel
    private readonly HEX_HEIGHT = 0.5;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.visible = false; // Hidden by default
        this.scene.add(this.group);
        this.buildGrid();
    }

    setVisible(visible: boolean) {
        this.group.visible = visible;
    }

    private buildGrid() {
        // Hexagon math (Pointy topped)
        // Width = sqrt(3) * size
        // Height = 2 * size
        // Horiz spacing = Width
        // Vert spacing = 3/4 * Height
        
        const width = Math.sqrt(3) * this.HEX_SIZE;
        const height = 2 * this.HEX_SIZE;
        const horizDist = width;
        const vertDist = 0.75 * height;

        const hexGeo = new THREE.CylinderGeometry(this.HEX_SIZE, this.HEX_SIZE, this.HEX_HEIGHT, 6);
        
        const matA = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.7, flatShading: true });
        const matB = new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.7, flatShading: true });
        const matBorder = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9 });

        // Center the grid around (0,0)
        // Offset calculation for odd-r layout
        const totalWidth = this.GRID_COLS * horizDist + (horizDist / 2);
        const totalHeight = this.GRID_ROWS * vertDist;
        const offsetX = -totalWidth / 2 + (horizDist / 2);
        const offsetZ = -totalHeight / 2 + (vertDist / 2);

        for (let r = 0; r < this.GRID_ROWS; r++) {
            for (let c = 0; c < this.GRID_COLS; c++) {
                const hexGroup = new THREE.Group();
                
                // Calculate position
                // Offset odd rows
                const xPos = c * horizDist + ((r % 2) * (horizDist / 2)) + offsetX;
                const zPos = r * vertDist + offsetZ;

                hexGroup.position.set(xPos, 0, zPos);

                // Main Tile
                const isEven = (r + c) % 2 === 0;
                const mesh = new THREE.Mesh(hexGeo, isEven ? matA : matB);
                mesh.position.y = -this.HEX_HEIGHT / 2; // Top surface at y=0
                mesh.receiveShadow = true;
                
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
        this.group.add(floor);
        
        // Add some arena lighting
        const arenaLight = new THREE.PointLight(0x00ffff, 0.5, 50);
        arenaLight.position.set(0, 10, 0);
        this.group.add(arenaLight);
    }

    update(dt: number, config: PlayerConfig, playerPos: THREE.Vector3) {
        if (!this.group.visible) return;
        
        // Potential future logic: Highlight hex under player
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
