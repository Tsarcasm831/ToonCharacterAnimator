import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class Torch {
    private static woodMaterial: THREE.MeshStandardMaterial;
    private static metalMaterial: THREE.MeshStandardMaterial;
    private static flameMaterial: THREE.MeshStandardMaterial;

    private static initMaterials() {
        if (this.woodMaterial) return;

        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x3e2723, // Dark Wood
            roughness: 0.9,
            flatShading: true
        });

        this.metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x424242, // Dark Iron
            roughness: 0.4,
            metalness: 0.6,
            flatShading: true
        });

        this.flameMaterial = new THREE.MeshStandardMaterial({
            color: 0xffa000,
            emissive: 0xff5722,
            emissiveIntensity: 2.0,
            toneMapped: false
        });
    }

    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();

        // 1. The Post
        const postHeight = 2.2;
        const postGeo = new THREE.CylinderGeometry(0.06, 0.08, postHeight, 6);
        postGeo.translate(0, postHeight / 2, 0);
        const postMesh = new THREE.Mesh(postGeo, this.woodMaterial);
        
        // 2. The Lantern Cage (Top)
        const cageGeo = new THREE.BoxGeometry(0.35, 0.5, 0.35);
        cageGeo.translate(0, postHeight + 0.25, 0);
        const cageMesh = new THREE.Mesh(cageGeo, this.metalMaterial);

        // 3. The Flame/Light Source geometry
        const lightGeo = new THREE.DodecahedronGeometry(0.12);
        lightGeo.translate(0, postHeight + 0.25, 0);
        const lightMesh = new THREE.Mesh(lightGeo, this.flameMaterial);

        if (isGhost) {
            // Apply ghost material to everything
            const ghostMat = new THREE.MeshStandardMaterial({
                color: 0x44ff44,
                transparent: true,
                opacity: 0.4,
                wireframe: true
            });
            postMesh.material = ghostMat;
            cageMesh.material = ghostMat;
            lightMesh.material = ghostMat;
            
            group.add(postMesh);
            group.add(cageMesh);
            group.add(lightMesh);
        } else {
            postMesh.castShadow = true;
            postMesh.receiveShadow = true;
            cageMesh.castShadow = true;
            
            // Add actual PointLight only if not a ghost
            const light = new THREE.PointLight(0xffaa00, 3, 8);
            light.position.set(0, postHeight + 0.3, 0);
            light.castShadow = true;
            light.shadow.bias = -0.001;
            group.add(light);

            // User data for interaction/collision
            const applyUserData = (mesh: THREE.Mesh, matType: string) => {
                mesh.userData = { 
                    type: 'hard', 
                    structureType: 'torch', 
                    material: matType 
                };
            };
            
            applyUserData(postMesh, 'wood');
            applyUserData(cageMesh, 'metal');
            
            group.add(postMesh);
            group.add(cageMesh);
            group.add(lightMesh);
        }

        return group;
    }
}