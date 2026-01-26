import * as THREE from 'three';
// Note: In a real project environment, ensure BufferGeometryUtils is available via your bundler setup.
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A procedurally generated "Half Wall" made entirely of stone.
 * Low height, suitable for cover, matching the visual reference (image_a0bc11).
 */
export class StoneHWall {
    private static readonly GRID_SIZE = 1.3333 * 4;
    private static readonly TOTAL_HEIGHT = 1.2; // Low wall height (cover height)
    private static readonly WALL_DEPTH = 0.6; // Thicker than the fence

    // Reusable materials
    private static rockMaterial: THREE.MeshStandardMaterial;

    private static mergeGeometriesSafe(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
        const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
        geometries.forEach(g => g.dispose());
        return merged ?? new THREE.BufferGeometry();
    }

    private static initMaterials() {
        if (this.rockMaterial) return;

        this.rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a5a5a,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
    }

    /**
     * Creates a complete Stone Half Wall group.
     */
    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();

        // 1. Create Rock Pile
        const rockMesh = this.createRockPile();
        group.add(rockMesh);

        if (isGhost) {
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x44ff44,
                        transparent: true,
                        opacity: 0.4,
                        wireframe: true
                    });
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
            });
        } else {
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData = { 
                        type: 'hard', 
                        structureType: 'stone_h_wall',
                        material: 'stone'
                    };
                }
            });
        }

        return group;
    }

    /**
     * Generates a dense pile of rocks.
     */
    private static createRockPile(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        
        // Increased density compared to the base of the composite wall
        const numRocks = 260; // 4x length
        
        const baseGeo = new THREE.DodecahedronGeometry(0.2, 0).toNonIndexed();
        baseGeo.deleteAttribute('uv');

        for (let i = 0; i < numRocks; i++) {
            const geo = baseGeo.clone();
            
            // Spread rocks across the full volume
            const x = (Math.random() - 0.5) * this.GRID_SIZE;
            
            // Vertical distribution: More rocks at bottom, fewer at top for a tapered look
            // Using power of 2 to bias towards bottom
            const yNormalized = Math.pow(Math.random(), 1.5); 
            const y = yNormalized * this.TOTAL_HEIGHT; 
            
            // Depth variation (thicker at bottom)
            const depthScale = 1.0 - (yNormalized * 0.5); // Taper depth as it goes up
            const z = (Math.random() - 0.5) * (this.WALL_DEPTH * depthScale);

            // Randomize scale/rot
            const scale = 0.6 + Math.random() * 0.5;
            geo.scale(scale, scale, scale);
            
            geo.rotateX(Math.random() * Math.PI);
            geo.rotateY(Math.random() * Math.PI);
            geo.rotateZ(Math.random() * Math.PI);

            geo.translate(x, y, z);
            geometries.push(geo);
        }

        // Add a central filler block to prevent see-through gaps
        // Sized slightly smaller than the bounding box
        const fillerBox = new THREE.BoxGeometry(
            this.GRID_SIZE * 0.95, 
            this.TOTAL_HEIGHT * 0.8, 
            this.WALL_DEPTH * 0.5
        );
        let filler = fillerBox.toNonIndexed();
        filler.deleteAttribute('uv');
        // Position filler in the middle vertically
        filler.translate(0, this.TOTAL_HEIGHT * 0.4, 0); 
        geometries.push(filler);

        const mergedGeo = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(mergedGeo, this.rockMaterial);
    }
}