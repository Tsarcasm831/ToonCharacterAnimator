
import * as THREE from 'three';
import { WORLD_SHAPE_POINTS } from '../../data/worldShape';
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
        // 1. Convert points to Shape
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        WORLD_SHAPE_POINTS.forEach(p => {
            if (p[0] < minX) minX = p[0];
            if (p[0] > maxX) maxX = p[0];
            if (p[1] < minZ) minZ = p[1];
            if (p[1] > maxZ) maxZ = p[1];
        });

        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;

        const scale = 50.0; // Scale up the world

        const shape = new THREE.Shape();
        WORLD_SHAPE_POINTS.forEach((p, i) => {
            // Flip Z because 2D shape Y is usually 3D Z, and sometimes winding order matters
            // p[0] is X, p[1] is Y (Z).
            const x = (p[0] - centerX) * scale;
            const z = (p[1] - centerZ) * scale; 
            if (i === 0) {
                shape.moveTo(x, z); // Note: using z as y for shape, will rotate later
            } else {
                shape.lineTo(x, z);
            }
        });

        // 2. Create Geometry from Shape
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 10, // Thickness of the land
            bevelEnabled: true,
            bevelThickness: 2,
            bevelSize: 2,
            bevelSegments: 2
        });

        // Rotate to lie flat on XZ plane
        // Extrude creates along Z axis.
        geometry.rotateX(Math.PI / 2);

        // 3. Material
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x4ade80, // Grass green
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

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
        water.position.y = -2;
        this.group.add(water);
    }

    update(dt: number, config: PlayerConfig, playerPos: THREE.Vector3) {
        if (!this.group.visible) return;
        // Update logic for world scene
    }

    // Interface methods for compatibility with Player/Game
    getBiomeAt(pos: THREE.Vector3): { name: string, color: string } {
        return { name: 'World', color: '#4ade80' };
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
