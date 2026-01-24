import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A covered supply wagon/cart.
 */
export class SupplyCart {
    private static readonly GRID_SIZE = 1.3333;
    private static readonly LENGTH = 2.5;
    private static readonly WIDTH = 1.2;
    private static readonly WHEEL_RADIUS = 0.5;

    private static woodMaterial: THREE.MeshStandardMaterial;
    private static fabricMaterial: THREE.MeshStandardMaterial;
    private static metalMaterial: THREE.MeshStandardMaterial;

    private static mergeGeometriesSafe(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
        const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
        geometries.forEach(g => g.dispose());
        return merged ?? new THREE.BufferGeometry();
    }

    private static initMaterials() {
        if (this.woodMaterial) return;

        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x5d4037,
            roughness: 0.9,
            side: THREE.DoubleSide
        });

        this.fabricMaterial = new THREE.MeshStandardMaterial({
            color: 0xd7ccc8, // Off-white/Beige canvas
            roughness: 0.8,
            flatShading: false,
            side: THREE.DoubleSide
        });

        this.metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x424242,
            roughness: 0.4,
            metalness: 0.8,
            side: THREE.DoubleSide
        });
    }

    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();

        // 1. Chassis (Wood)
        const chassisMesh = this.createChassis();
        group.add(chassisMesh);

        // 2. Wheels (Wood + Metal)
        const wheelsMesh = this.createWheels();
        group.add(wheelsMesh);

        // 3. Cover (Fabric)
        const coverMesh = this.createCover();
        group.add(coverMesh);

        if (isGhost) {
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xffff00,
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
                        structureType: 'supply_cart',
                        material: 'wood'
                    };
                }
            });
        }
        
        return group;
    }

    private static createChassis(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];

        // Main bed
        const bed = new THREE.BoxGeometry(this.WIDTH, 0.2, this.LENGTH);
        bed.translate(0, this.WHEEL_RADIUS, 0); // Sit above axle height
        geometries.push(bed);

        // Side rails
        const railGeo = new THREE.BoxGeometry(0.1, 0.4, this.LENGTH);
        const railL = railGeo.clone();
        railL.translate(-this.WIDTH/2 + 0.05, this.WHEEL_RADIUS + 0.3, 0);
        geometries.push(railL);

        const railR = railGeo.clone();
        railR.translate(this.WIDTH/2 - 0.05, this.WHEEL_RADIUS + 0.3, 0);
        geometries.push(railR);

        // Hitch/Tongue at front
        const tongue = new THREE.BoxGeometry(0.15, 0.1, 1.0);
        tongue.translate(0, this.WHEEL_RADIUS, this.LENGTH/2 + 0.5);
        geometries.push(tongue);

        const merged = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(merged, this.woodMaterial);
    }

    private static createWheels(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        const thickness = 0.15;
        
        // 4 Wheels
        const positions = [
            { x: -this.WIDTH/2 - thickness/2, z: -this.LENGTH/3 },
            { x:  this.WIDTH/2 + thickness/2, z: -this.LENGTH/3 },
            { x: -this.WIDTH/2 - thickness/2, z:  this.LENGTH/3 },
            { x:  this.WIDTH/2 + thickness/2, z:  this.LENGTH/3 },
        ];

        const wheelGeo = new THREE.CylinderGeometry(this.WHEEL_RADIUS, this.WHEEL_RADIUS, thickness, 12);
        wheelGeo.rotateZ(Math.PI / 2); // Make it vertical

        positions.forEach(pos => {
            const w = wheelGeo.clone();
            w.translate(pos.x, this.WHEEL_RADIUS, pos.z);
            geometries.push(w);
        });

        // Axles
        const axleGeo = new THREE.CylinderGeometry(0.08, 0.08, this.WIDTH + 0.4, 6);
        axleGeo.rotateZ(Math.PI / 2);
        
        const axleFront = axleGeo.clone();
        axleFront.translate(0, this.WHEEL_RADIUS, this.LENGTH/3);
        geometries.push(axleFront);

        const axleRear = axleGeo.clone();
        axleRear.translate(0, this.WHEEL_RADIUS, -this.LENGTH/3);
        geometries.push(axleRear);

        const merged = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(merged, this.woodMaterial); 
        // Note: Realistically wheels might have metal rims, but for simplicity we group them as wood here.
        // If strict metal rims are needed, create a separate method and merge into metalMaterial.
    }

    private static createCover(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        
        // Use a cylinder cut in half for the canvas top
        const coverRadius = this.WIDTH / 2;
        const coverGeo = new THREE.CylinderGeometry(coverRadius, coverRadius, this.LENGTH * 0.95, 16, 1, true, 0, Math.PI);
        
        // Rotate to align with cart length
        coverGeo.rotateY(Math.PI / 2); // Align cylinder axis with Z? No, Cylinder default is Y-up.
        coverGeo.rotateZ(Math.PI / 2); // Now axis is X. 
        // We want axis along Z.
        coverGeo.rotateY(Math.PI / 2); 
        
        // Orient the opening down
        // The thetaLength is PI, starting at 0. 
        // We need to rotate it around Z axis to make the arch point up.
        // Actually, easiest is just rotateX or Z until it looks right.
        
        // Cylinder default: along Y. rotateZ(90) -> along X.
        // Let's restart orientation:
        // Cylinder along Z axis:
        const c2 = new THREE.CylinderGeometry(coverRadius, coverRadius, this.LENGTH * 0.95, 16, 1, true, 0, Math.PI);
        c2.rotateX(Math.PI / 2); // Now along Z axis.
        // The open side depends on thetaStart. default 0 faces +Z? 
        // A Half cylinder usually faces one way. Rotate around Z to point arch up.
        c2.rotateZ(Math.PI / 2); 

        // Position on top of rails
        c2.translate(0, this.WHEEL_RADIUS + 0.4 + 0.1, 0); // 0.4 is rail height
        
        geometries.push(c2);

        // Add "ribs" to the cover for detail (slightly larger cylinders)
        const numRibs = 4;
        for(let i=0; i<numRibs; i++) {
            const z = -this.LENGTH/2 + (this.LENGTH/(numRibs-1)) * i;
            // Create a thin band
            const rib = new THREE.CylinderGeometry(coverRadius + 0.02, coverRadius + 0.02, 0.1, 16, 1, true, 0, Math.PI);
            rib.rotateX(Math.PI / 2);
            rib.rotateZ(Math.PI / 2);
            rib.translate(0, this.WHEEL_RADIUS + 0.5, z * 0.9);
            geometries.push(rib);
        }

        const merged = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(merged, this.fabricMaterial);
    }
}