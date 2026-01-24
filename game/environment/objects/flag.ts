import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class Flag {
    private static woodMaterial: THREE.MeshStandardMaterial;
    private static clothMaterial: THREE.MeshStandardMaterial;
    private static goldMaterial: THREE.MeshStandardMaterial;

    private static initMaterials() {
        if (this.woodMaterial) return;

        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x5d4037,
            roughness: 0.8
        });

        // Banner Red based on the image hint
        this.clothMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b0000, // Dark Red
            roughness: 0.7,
            side: THREE.DoubleSide
        });

        this.goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 0.8
        });
    }

    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();

        // 1. Pole Structure
        const poleHeight = 3.5;
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, poleHeight, 8);
        poleGeo.translate(0, poleHeight / 2, 0);

        // Crossbar (holding the flag)
        const crossbarLen = 1.4;
        const crossbarGeo = new THREE.BoxGeometry(crossbarLen, 0.08, 0.08);
        crossbarGeo.translate(0.3, poleHeight - 0.2, 0); // Offset slightly to right

        // Top Ornament
        const topGeo = new THREE.OctahedronGeometry(0.15);
        topGeo.translate(0, poleHeight, 0);

        // Merge wood parts
        const woodParts = BufferGeometryUtils.mergeGeometries([poleGeo, crossbarGeo]);
        const structureMesh = new THREE.Mesh(woodParts, this.woodMaterial);
        
        // Ornament mesh
        const ornamentMesh = new THREE.Mesh(topGeo, this.goldMaterial);

        // 2. Cloth Banner
        const clothWidth = 1.0;
        const clothHeight = 2.0;
        // Use high segments for wavy deformation
        const clothGeo = new THREE.PlaneGeometry(clothWidth, clothHeight, 8, 12);
        
        const posAttribute = clothGeo.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);

            // Base position logic: The plane is centered at 0,0. 
            // We want top edge at y=0, hanging down.
            // Move it down by half height first.
            vertex.y -= clothHeight / 2;

            // Apply "Wind" / Sag
            // The lower the vertex (more negative Y), the more it waves
            const verticalProgress = Math.abs(vertex.y) / clothHeight; // 0 at top, 1 at bottom
            
            // Wave function
            const wave = Math.sin(vertex.y * 3.0 + vertex.x * 2.0) * 0.15;
            vertex.z += wave * verticalProgress; // Top is rigid, bottom waves

            // "Hang" curve - slight curve in middle
            vertex.z += Math.sin(vertex.x * Math.PI) * 0.05 * verticalProgress;

            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        clothGeo.computeVertexNormals();
        // Position cloth under the crossbar
        clothGeo.translate(0.3, poleHeight - 0.25, 0);
        
        const clothMesh = new THREE.Mesh(clothGeo, this.clothMaterial);

        if (isGhost) {
            const ghostMat = new THREE.MeshStandardMaterial({
                color: 0x44ff44,
                transparent: true,
                opacity: 0.4,
                wireframe: true
            });
            structureMesh.material = ghostMat;
            ornamentMesh.material = ghostMat;
            clothMesh.material = ghostMat;
        } else {
            structureMesh.castShadow = true;
            structureMesh.receiveShadow = true;
            structureMesh.userData = { type: 'hard', structureType: 'flag_pole', material: 'wood' };
            
            clothMesh.castShadow = true;
            clothMesh.receiveShadow = true;
            // Cloth usually doesn't have collision ('hard') in games, but can if desired
            clothMesh.userData = { type: 'decoration', structureType: 'flag_cloth', material: 'cloth' }; 
            
            ornamentMesh.castShadow = true;
        }

        group.add(structureMesh);
        group.add(ornamentMesh);
        group.add(clothMesh);

        return group;
    }
}