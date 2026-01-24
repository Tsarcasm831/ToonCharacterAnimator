import * as THREE from 'three';
// Note: In a real project environment, ensure BufferGeometryUtils is available via your bundler setup.
// Usually imported like: import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// For this context, assuming it exists globally or via a similar path managed by the environment.
// If not available, the geometry merging logic would need to be done manually, which is significantly more complex.
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A procedurally generated composite wall consisting of a stone base,
 * wooden palisade logs with pointed tops, and rope bindings, matching the visual reference.
 */
export class Wall {
    // Dimensions based on BuildingParts.ts grid size and general proportions of the reference image.
    // 4x longer as requested
    private static readonly GRID_SIZE = 1.3333 * 4;
    private static readonly TOTAL_HEIGHT = 3.3;
    private static readonly ROCK_HEIGHT = 1.0;
    private static readonly WALL_DEPTH = 0.4; // Slightly thicker than standard walls to accommodate rocks

    // Reusable materials
    private static rockMaterial: THREE.MeshStandardMaterial;
    private static woodMaterial: THREE.MeshStandardMaterial;
    private static ropeMaterial: THREE.MeshStandardMaterial;

    /**
     * Safely merge geometries while guaranteeing a non-null return value and cleaning up sources.
     */
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
            flatShading: true // Low-poly look for rocks
        });

        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x6d4f3a, // Slightly darker, weathered wood color
            roughness: 0.8,
            metalness: 0.05,
            flatShading: true
        });

        this.ropeMaterial = new THREE.MeshStandardMaterial({
            color: 0xc2b280, // Beige rope color
            roughness: 1.0,
            flatShading: true
        });
    }

    /**
     * Creates a complete Wall group containing rocks, logs, and ropes.
     */
    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();

        // 1. Create Rock Base
        const rockMesh = this.createRocks();
        group.add(rockMesh);

        // 2. Create Wooden Palisade
        const logMesh = this.createLogs();
        group.add(logMesh);

        // 3. Create Rope Bindings
        const ropeMesh = this.createRopes();
        ropeMesh.position.y = this.ROCK_HEIGHT - 0.2;
        group.add(ropeMesh);

        // Apply ghost styling if necessary, otherwise set shadow properties
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
                    // Add user data for collision detection mentioned in BuildingParts.ts/BuilderManager.ts
                    child.userData = { 
                        type: 'hard', 
                        structureType: 'wall',
                        material: child.material === this.rockMaterial ? 'stone' : 'wood'
                    };
                }
            });
        }

        return group;
    }

    /**
     * Generates a pile of rocks using merged Dodecahedron geometries.
     */
    private static createRocks(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        const numRocks = 160; // Increased for 4x length
        // Use non-indexed geometry so all merged rocks share identical attribute sets
        const baseGeo = new THREE.DodecahedronGeometry(0.15, 0).toNonIndexed(); // Low poly sphere-ish shape
        baseGeo.deleteAttribute('uv');

        for (let i = 0; i < numRocks; i++) {
            const geo = baseGeo.clone();
            
            // Randomize position within the base bounding box
            const x = (Math.random() - 0.5) * this.GRID_SIZE;
            const y = Math.random() * this.ROCK_HEIGHT * 0.8 + 0.1; // Bias towards bottom
            const z = (Math.random() - 0.5) * this.WALL_DEPTH;

            // Randomize scale and rotation for irregularity
            const scale = 0.8 + Math.random() * 0.6;
            geo.scale(scale, scale, scale);
            
            geo.rotateX(Math.random() * Math.PI);
            geo.rotateY(Math.random() * Math.PI);
            geo.rotateZ(Math.random() * Math.PI);

            geo.translate(x, y, z);
            geometries.push(geo);
        }

        // Add a central filler block to ensure no gaps look straight through
        // Convert to non-indexed and strip UVs so it matches the rock geometries' attribute set
        const fillerBox = new THREE.BoxGeometry(this.GRID_SIZE * 0.9, this.ROCK_HEIGHT * 0.8, this.WALL_DEPTH * 0.6);
        let filler = fillerBox.toNonIndexed();

        filler.deleteAttribute('uv');
        filler.translate(0, this.ROCK_HEIGHT / 2, 0);
        geometries.push(filler);

        const mergedGeo = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(mergedGeo, this.rockMaterial);
    }

    /**
     * Generates the vertical logs with pointed tops.
     */
    private static createLogs(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        const logRadius = 0.12;
        // Calculate how many logs fit across the width with slight overlap
        const numLogs = Math.ceil(this.GRID_SIZE / (logRadius * 1.8)); 
        const stepX = this.GRID_SIZE / numLogs;
        const startX = -(this.GRID_SIZE / 2) + stepX / 2;

        const logBaseHeight = this.TOTAL_HEIGHT - this.ROCK_HEIGHT;

        for (let i = 0; i < numLogs; i++) {
            // Introduce height variation for the hand-built look
            const heightVariation = (Math.random() - 0.5) * 0.3;
            const currentLogHeight = logBaseHeight + heightVariation;
            const coneHeight = 0.4;
            const cylinderHeight = currentLogHeight - coneHeight;

            // 1. Cylinder Body
            const cylGeo = new THREE.CylinderGeometry(logRadius * 0.9, logRadius, cylinderHeight, 8);
            cylGeo.translate(0, cylinderHeight / 2, 0);

            // 2. Pointed Top (Cone)
            const coneGeo = new THREE.ConeGeometry(logRadius * 0.9, coneHeight, 8);
            coneGeo.translate(0, cylinderHeight + coneHeight / 2, 0);

            // Merge cylinder and cone for a single log
            let logGeo = BufferGeometryUtils.mergeGeometries([cylGeo, coneGeo]);
            if (!logGeo) {
                cylGeo.dispose();
                coneGeo.dispose();
                continue;
            }

            // Position along X axis
            const xPos = startX + i * stepX;
            
            // Add slight random tilt (rotation) and depth offset (z)
            logGeo.rotateZ((Math.random() - 0.5) * 0.1); // Tilt left/right slightly
            logGeo.rotateX((Math.random() - 0.5) * 0.05); // Tilt forward/back slightly
            const zOffset = (Math.random() - 0.5) * 0.05;

            logGeo.translate(xPos, this.ROCK_HEIGHT, zOffset);
            geometries.push(logGeo);
        }

        const mergedLogsGeo = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(mergedLogsGeo, this.woodMaterial);
    }

    /**
     * Generates horizontal rope bindings across the logs.
     */
    private static createRopes(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        const ropeRadius = 0.04;
        const logSectionHeight = this.TOTAL_HEIGHT - this.ROCK_HEIGHT;

        // Create two bands of rope, one lower, one higher
        const heights = [logSectionHeight * 0.3, logSectionHeight * 0.7];

        heights.forEach(h => {
            // Use a rough cylinder stretched horizontally to simulate a bundle of ropes
            // Slightly wider than grid size to wrap around ends
            const ropeGeo = new THREE.CylinderGeometry(ropeRadius, ropeRadius, this.GRID_SIZE * 1.05, 6);
            ropeGeo.rotateZ(Math.PI / 2); // Lay flat
            
            // Add some noise to the rope shape so it's not perfectly straight
            const positions = ropeGeo.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                 positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.05);
                 positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 0.02);
            }
            positions.needsUpdate = true;
            ropeGeo.computeVertexNormals();

            // Position slightly in front of the log center line
            ropeGeo.translate(0, h, 0.1);
            geometries.push(ropeGeo);
            
            // Add a second strand slightly offset for visual complexity
            const ropeGeo2 = ropeGeo.clone();
            ropeGeo2.translate(0, -0.05, -0.02);
            ropeGeo2.rotateY(0.05); // Slight twist
            geometries.push(ropeGeo2);
        });

        const mergedRopeGeo = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(mergedRopeGeo, this.ropeMaterial);
    }
}