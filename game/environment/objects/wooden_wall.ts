import * as THREE from 'three';
// Note: In a real project environment, ensure BufferGeometryUtils is available via your bundler setup.
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A procedurally generated wooden fence wall consisting of vertical posts
 * and horizontal rails, matching the visual reference (image_a0bccc).
 */
export class WoodenWall {
    // Dimensions based on BuildingParts.ts grid size
    private static readonly GRID_SIZE = 1.3333; // Match single grid cell width
    private static readonly TOTAL_HEIGHT = 1.2;
    private static readonly POST_SIZE = 0.12;
    private static readonly RAIL_HEIGHT = 0.1;
    private static readonly RAIL_DEPTH = 0.06;

    // Reusable materials
    private static woodMaterial: THREE.MeshStandardMaterial;

    /**
     * Safely merge geometries while guaranteeing a non-null return value and cleaning up sources.
     */
    private static mergeGeometriesSafe(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
        const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
        geometries.forEach(g => g.dispose());
        return merged ?? new THREE.BufferGeometry();
    }

    private static initMaterials() {
        if (this.woodMaterial) return;

        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x5d4037, // Matching HumanRemnantsFactory fence_wood
            roughness: 0.9,
            metalness: 0.0,
            flatShading: true
        });
    }

    /**
     * Creates a complete Wooden Wall group.
     */
    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();

        // 1. Create Vertical Posts (at the edges of the 1.3333 grid)
        const postGeo = new THREE.BoxGeometry(this.POST_SIZE, this.TOTAL_HEIGHT, this.POST_SIZE);
        
        const post1 = new THREE.Mesh(postGeo, this.woodMaterial);
        post1.position.set(-(this.GRID_SIZE / 2), this.TOTAL_HEIGHT / 2, 0);
        post1.castShadow = true;
        group.add(post1);

        const post2 = new THREE.Mesh(postGeo, this.woodMaterial);
        post2.position.set(+(this.GRID_SIZE / 2), this.TOTAL_HEIGHT / 2, 0);
        post2.castShadow = true;
        group.add(post2);

        // 2. Create Horizontal Rails (spanning between posts)
        const railGeo = new THREE.BoxGeometry(this.GRID_SIZE, this.RAIL_HEIGHT, this.RAIL_DEPTH);
        
        const rail1 = new THREE.Mesh(railGeo, this.woodMaterial);
        rail1.position.set(0, 0.95, 0);
        rail1.castShadow = true;
        group.add(rail1);

        const rail2 = new THREE.Mesh(railGeo, this.woodMaterial);
        rail2.position.set(0, 0.45, 0);
        rail2.castShadow = true;
        group.add(rail2);

        if (isGhost) {
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x44ff44,
                        transparent: true,
                        opacity: 0.4,
                        wireframe: true
                    });
                }
                child.castShadow = false;
                child.receiveShadow = false;
            });
        } else {
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.receiveShadow = true;
                    child.userData = { 
                        type: 'hard', 
                        structureType: 'wooden_wall',
                        material: 'wood'
                    };
                }
            });
        }

        return group;
    }

    /**
     * Generates the vertical support posts.
     */
    private static createPosts(): THREE.Mesh {
        return new THREE.Mesh(); // Placeholder to satisfy compiler if needed, though removed from create()
    }

    /**
     * Generates the horizontal rails connecting the posts.
     */
    private static createRails(): THREE.Mesh {
        return new THREE.Mesh(); // Placeholder
    }
}