
import * as THREE from 'three';

export type StructureType = 'foundation' | 'wall' | 'doorway' | 'door' | 'roof';

export class BuildingParts {
    static getGeometry(type: StructureType): THREE.BufferGeometry {
        const GRID_SIZE = 1.3333;
        
        switch (type) {
            case 'foundation':
                return new THREE.BoxGeometry(GRID_SIZE, 0.4, GRID_SIZE);
            case 'wall':
                return new THREE.BoxGeometry(GRID_SIZE, 3.3, 0.2); // 2.75 * 1.2 = 3.3
            case 'doorway':
                // Proportions for a 3.3m tall doorway (20% increase)
                // Door opening height remains 2.35m
                const postWidth = 0.26;
                const totalWidth = GRID_SIZE;
                const holeWidth = totalWidth - (postWidth * 2); 
                const totalHeight = 3.3; 
                const lintelHeight = 0.95; // 3.3 - 2.35 = 0.95
                const depth = 0.2;
                
                const leftPost = new THREE.BoxGeometry(postWidth, totalHeight, depth).toNonIndexed();
                leftPost.translate(-(totalWidth/2 - postWidth/2), 0, 0);
                
                const rightPost = new THREE.BoxGeometry(postWidth, totalHeight, depth).toNonIndexed();
                rightPost.translate(+(totalWidth/2 - postWidth/2), 0, 0);
                
                const lintel = new THREE.BoxGeometry(holeWidth, lintelHeight, depth).toNonIndexed();
                lintel.translate(0, (totalHeight/2 - lintelHeight/2), 0);

                const geometries = [leftPost, rightPost, lintel];
                const totalPosCount = geometries.reduce((sum, g) => sum + g.attributes.position.count, 0);
                
                const mergedGeo = new THREE.BufferGeometry();
                const positions = new Float32Array(totalPosCount * 3);
                const normals = new Float32Array(totalPosCount * 3);
                const uvs = new Float32Array(totalPosCount * 2);

                let offset = 0;
                geometries.forEach(g => {
                    const pos = g.attributes.position.array;
                    const norm = g.attributes.normal.array;
                    const uv = g.attributes.uv.array;
                    
                    positions.set(pos, offset * 3);
                    normals.set(norm, offset * 3);
                    uvs.set(uv, offset * 2);
                    
                    offset += g.attributes.position.count;
                    g.dispose();
                });

                mergedGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
                mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                return mergedGeo;

            case 'door':
                return new THREE.BoxGeometry(0.8, 2.35, 0.15); 
            case 'roof':
                const halfSize = GRID_SIZE / 2;
                const roofGeo = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    -halfSize, 0, -halfSize,  halfSize, 0, -halfSize,  0, 1, 0,
                    halfSize, 0, -halfSize,   halfSize, 0, halfSize,   0, 1, 0,
                    halfSize, 0, halfSize,   -halfSize, 0, halfSize,   0, 1, 0,
                    -halfSize, 0, halfSize,  -halfSize, 0, -halfSize,  0, 1, 0
                ]);
                roofGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                roofGeo.computeVertexNormals();
                return roofGeo;
            default:
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }

    static createStructureMesh(type: StructureType, isGhost: boolean = false): THREE.Object3D {
        const GRID_SIZE = 1.3333;

        const getMat = (t: StructureType) => {
            if (isGhost) {
                return new THREE.MeshStandardMaterial({
                    color: 0x44ff44,
                    transparent: true,
                    opacity: 0.4,
                    wireframe: true
                });
            } else {
                const color = t === 'foundation' ? 0x795548 : (t === 'roof' ? 0x4e342e : 0x8d6e63);
                return new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.8,
                    metalness: 0.1,
                    flatShading: true
                });
            }
        };

        if (type === 'doorway') {
            const group = new THREE.Group();
            const mat = getMat(type);
            
            const totalWidth = GRID_SIZE * 2; 
            const postWidth = 0.3;
            const totalHeight = 3.3; 
            const depth = 0.2;
            const lintelHeight = 0.95;
            const holeWidth = totalWidth - (postWidth * 2);

            const leftGeo = new THREE.BoxGeometry(postWidth, totalHeight, depth);
            const leftPost = new THREE.Mesh(leftGeo, mat);
            leftPost.position.set(-(totalWidth/2 - postWidth/2), 0, 0);
            leftPost.castShadow = !isGhost;
            leftPost.receiveShadow = !isGhost;
            leftPost.userData = { type: 'hard', material: 'wood', structureType: 'doorway' };
            group.add(leftPost);

            const rightGeo = new THREE.BoxGeometry(postWidth, totalHeight, depth);
            const rightPost = new THREE.Mesh(rightGeo, mat);
            rightPost.position.set(+(totalWidth/2 - postWidth/2), 0, 0);
            rightPost.castShadow = !isGhost;
            rightPost.receiveShadow = !isGhost;
            rightPost.userData = { type: 'hard', material: 'wood', structureType: 'doorway' };
            group.add(rightPost);

            const lintelGeo = new THREE.BoxGeometry(holeWidth, lintelHeight, depth);
            const lintel = new THREE.Mesh(lintelGeo, mat);
            lintel.position.set(0, (totalHeight/2) - (lintelHeight/2), 0);
            lintel.castShadow = !isGhost;
            lintel.receiveShadow = !isGhost;
            lintel.userData = { type: 'hard', material: 'wood', structureType: 'doorway' };
            group.add(lintel);

            return group;
        }

        if (type === 'door') {
             const width = (GRID_SIZE * 2) - 0.6; 
             const geo = new THREE.BoxGeometry(width, 2.35, 0.15);
             const mat = getMat(type);
             const mesh = new THREE.Mesh(geo, mat);
             mesh.position.y = 1.175;
             mesh.castShadow = !isGhost;
             mesh.receiveShadow = !isGhost;
             return mesh;
        }

        const geo = this.getGeometry(type);
        const mat = getMat(type);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = !isGhost;
        mesh.receiveShadow = !isGhost;
        
        if (type === 'wall') mesh.position.y = 1.65; // 3.3 / 2
        if (type === 'foundation') mesh.position.y = 0.2; 
        if (type === 'roof') mesh.position.y = 0;

        return mesh;
    }
}
