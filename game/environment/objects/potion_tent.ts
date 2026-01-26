import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A messy, dark, organic-shaped potion tent/hut.
 */
export class PotionTent {
    private static readonly HEIGHT = 3.5;
    private static readonly RADIUS = 2.0;

    private static clothMaterial: THREE.MeshStandardMaterial;
    private static woodMaterial: THREE.MeshStandardMaterial;
    private static propMaterial: THREE.MeshStandardMaterial;

    private static mergeGeometriesSafe(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
        const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
        geometries.forEach(g => g.dispose());
        return merged ?? new THREE.BufferGeometry();
    }

    private static initMaterials() {
        if (this.clothMaterial) return;

        this.clothMaterial = new THREE.MeshStandardMaterial({
            color: 0x3e362e, // Dark brownish grey
            roughness: 1.0,
            flatShading: true,
            side: THREE.DoubleSide
        });

        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x211713, // Very dark wood
            roughness: 0.9
        });

        this.propMaterial = new THREE.MeshStandardMaterial({
            color: 0x8d6e63, // Clay/Bone color
            roughness: 0.6
        });
    }

    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();

        // 1. Tattered Cloth Structure
        const tentMesh = this.createStructure();
        group.add(tentMesh);

        // 2. Wooden Poles poking out
        const polesMesh = this.createPoles();
        group.add(polesMesh);

        // 3. Clutter (Pots, skulls)
        const clutterMesh = this.createClutter();
        group.add(clutterMesh);

        if (isGhost) {
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xff00ff, // Different ghost color for distinct look
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
                        structureType: 'potion_tent',
                        material: child.material === this.clothMaterial ? 'cloth' : 'wood'
                    };
                }
            });
        }
        
        return group;
    }

    private static createStructure(): THREE.Mesh {
        // Create a cone with many segments to allow for deformation
        const geo = new THREE.ConeGeometry(this.RADIUS, this.HEIGHT, 16, 8, true).toNonIndexed();
        
        const posAttribute = geo.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);

            // 1. Add "Sag" - move middle vertices inward
            const heightRatio = (vertex.y + this.HEIGHT/2) / this.HEIGHT; // 0 to 1
            const sagFactor = Math.sin(heightRatio * Math.PI) * 0.3; 
            
            // Push vertices inward towards center X/Z based on sag
            vertex.x *= (1.0 - sagFactor * 0.5);
            vertex.z *= (1.0 - sagFactor * 0.5);

            // 2. Add Noise - Random jaggedness for tattered look
            vertex.x += (Math.random() - 0.5) * 0.15;
            vertex.y += (Math.random() - 0.5) * 0.15;
            vertex.z += (Math.random() - 0.5) * 0.15;

            // 3. Make the entrance - Push vertices near Z-front inward or open them
            if (vertex.z > this.RADIUS * 0.5 && vertex.y < 0) {
                 // Simple way to "open" the flap: scale them down or move them
                 vertex.x *= 1.5; // Widen the opening
            }

            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geo.computeVertexNormals();
        geo.translate(0, this.HEIGHT/2, 0);

        return new THREE.Mesh(geo, this.clothMaterial);
    }

    private static createPoles(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        const numPoles = 5;

        for(let i=0; i<numPoles; i++) {
            const height = this.HEIGHT * 1.2;
            const pole = new THREE.CylinderGeometry(0.05, 0.08, height, 5).toNonIndexed();
            pole.deleteAttribute('uv'); // Strip UVs to ensure compatibility
            
            // Rotate and tilt to follow cone shape roughly
            const angle = (i / numPoles) * Math.PI * 2;
            pole.translate(0, height/2, 0);
            pole.rotateZ(0.2); // Tilt outward
            pole.rotateY(angle);
            
            // Move from center
            pole.translate(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
            
            geometries.push(pole);
        }

        const merged = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(merged, this.woodMaterial);
    }

    private static createClutter(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        
        // Add random pots/jars around the base
        for(let i=0; i<8; i++) {
            const size = 0.2 + Math.random() * 0.2;
            const pot = new THREE.DodecahedronGeometry(size, 0).toNonIndexed();
            pot.deleteAttribute('uv');
            
            // Squash it
            pot.scale(1, 0.8, 1);
            
            // Random placement near entrance or around side
            const angle = Math.random() * Math.PI * 1.5 + Math.PI / 4; // Avoid back
            const dist = this.RADIUS * (0.8 + Math.random() * 0.4);
            
            pot.translate(Math.cos(angle) * dist, size/2, Math.sin(angle) * dist);
            geometries.push(pot);
        }
        
        // Add a "Skull" (simplified)
        const skullHead = new THREE.SphereGeometry(0.15, 6, 6).toNonIndexed();
        skullHead.deleteAttribute('uv');
        skullHead.translate(1.2, 0.15, 0.8);
        geometries.push(skullHead);

        const merged = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(merged, this.propMaterial);
    }
}