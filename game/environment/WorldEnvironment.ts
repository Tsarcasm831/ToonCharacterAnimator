
import * as THREE from 'three';
import { getLandHeightAt, worldWidth, worldDepth } from './landTerrain';
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
        // Use PlaneGeometry for consistent resolution matching the heightmap function
        // 1 vertex per unit for good terrain fidelity
        const segmentsX = Math.floor(worldWidth);
        const segmentsZ = Math.floor(worldDepth);

        const geometry = new THREE.PlaneGeometry(worldWidth, worldDepth, segmentsX, segmentsZ);
        geometry.rotateX(-Math.PI / 2); // Rotate to lie flat on XZ plane

        const positions = geometry.attributes.position;

        // Apply heightmap to vertices
        for (let i = 0; i < positions.count; i += 1) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            
            // getLandHeightAt now handles the "outside polygon" check internally
            // returning a low value (-30) for underwater areas
            const y = getLandHeightAt(x, z);
            positions.setY(i, y);
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        // 4. Material
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
        water.position.y = -18; // 10m below the lowest terrain surface
        this.group.add(water);
    }

    update(dt: number, config: PlayerConfig, playerPos: THREE.Vector3) {
        if (!this.group.visible) return;
        // Update logic for world scene
    }

    // Interface methods for compatibility with Player/Game
    getBiomeAt(pos: THREE.Vector3): { name: string, color: string } {
        return { name: 'Land', color: '#4ade80' };
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
