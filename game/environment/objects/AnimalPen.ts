import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class AnimalPen {
    private static woodMaterial: THREE.MeshStandardMaterial;

    private static initMaterials() {
        if (this.woodMaterial) return;
        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x5d4037,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: true
        });
    }

    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();
        
        const radius = 4; // Radius of the pen
        const segments = 12; // Number of fence segments
        const gateIndex = 0; // Index for the gate (open or gate object)
        
        const postGeo = new THREE.BoxGeometry(0.15, 1.2, 0.15);
        
        // Pre-calculate segment properties
        const segmentAngle = (Math.PI * 2) / segments;
        const chordLength = 2 * radius * Math.sin(segmentAngle / 2);
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const nextAngle = ((i + 1) / segments) * Math.PI * 2;
            
            // Post at current angle
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            
            const post = new THREE.Mesh(postGeo, this.woodMaterial);
            post.position.set(x, 0.6, z);
            post.rotation.y = angle;
            post.castShadow = !isGhost;
            post.receiveShadow = !isGhost;
            group.add(post);

            const midAngle = (angle + nextAngle) / 2;
            const railX = Math.sin(midAngle) * radius;
            const railZ = Math.cos(midAngle) * radius;
            
            if (i !== gateIndex) { 
                // Regular Fence Segment
                const currentRailGeo = new THREE.BoxGeometry(chordLength, 0.1, 0.05);
                
                const rail1 = new THREE.Mesh(currentRailGeo, this.woodMaterial);
                rail1.position.set(railX, 0.9, railZ);
                rail1.rotation.y = midAngle + Math.PI / 2; // Perpendicular to radius
                rail1.castShadow = !isGhost;
                rail1.receiveShadow = !isGhost;
                group.add(rail1);

                const rail2 = new THREE.Mesh(currentRailGeo, this.woodMaterial);
                rail2.position.set(railX, 0.5, railZ);
                rail2.rotation.y = midAngle + Math.PI / 2;
                rail2.castShadow = !isGhost;
                rail2.receiveShadow = !isGhost;
                group.add(rail2);
            } else {
                 // Gate Segment - Closed
                const gateGeo = new THREE.BoxGeometry(chordLength * 0.9, 0.8, 0.05);
                const gate = new THREE.Mesh(gateGeo, this.woodMaterial);
                gate.position.set(railX, 0.6, railZ);
                gate.rotation.y = midAngle + Math.PI / 2;
                gate.castShadow = !isGhost;
                gate.receiveShadow = !isGhost;
                group.add(gate);
            }
        }

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
                    child.userData = { 
                        type: 'hard', 
                        structureType: 'animal_pen',
                        material: 'wood'
                    };
                }
            });
        }

        return group;
    }
}
