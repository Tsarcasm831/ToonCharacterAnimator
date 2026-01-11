
import * as THREE from 'three';

export type StructureType = 'foundation' | 'wall' | 'doorway' | 'door' | 'roof';

export class BuildingParts {
    static getGeometry(type: StructureType): THREE.BufferGeometry {
        switch (type) {
            case 'foundation':
                return new THREE.BoxGeometry(2, 0.4, 2);
            case 'wall':
                return new THREE.BoxGeometry(2, 2.5, 0.2);
            case 'doorway':
                // Proportions for a 2.5m tall doorway with a 2.1m opening
                const postWidth = 0.4;
                const totalWidth = 2.0;
                const holeWidth = 1.2;
                const totalHeight = 2.5;
                const lintelHeight = 0.4; // 2.5 - 2.1 = 0.4m lintel
                const depth = 0.2;
                
                // CRITICAL: Convert to non-indexed so manual attribute merging works correctly
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
                    // Dispose temp geometries
                    g.dispose();
                });

                mergedGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
                mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                return mergedGeo;

            case 'door':
                // Match the 1.2m x 2.1m doorway opening
                return new THREE.BoxGeometry(1.2, 2.1, 0.15); 
            case 'roof':
                const roofGeo = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    -1, 0, -1,  1, 0, -1,  0, 1, 0,
                    1, 0, -1,   1, 0, 1,   0, 1, 0,
                    1, 0, 1,   -1, 0, 1,   0, 1, 0,
                    -1, 0, 1,  -1, 0, -1,  0, 1, 0
                ]);
                roofGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                roofGeo.computeVertexNormals();
                return roofGeo;
            default:
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }

    static createStructureMesh(type: StructureType, isGhost: boolean = false): THREE.Mesh {
        const geo = this.getGeometry(type);
        let mat: THREE.Material;

        if (isGhost) {
            mat = new THREE.MeshStandardMaterial({
                color: 0x44ff44,
                transparent: true,
                opacity: 0.4,
                wireframe: true
            });
        } else {
            const color = type === 'foundation' ? 0x795548 : (type === 'roof' ? 0x4e342e : 0x8d6e63);
            mat = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.8,
                metalness: 0.1,
                flatShading: true
            });
        }

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = !isGhost;
        mesh.receiveShadow = !isGhost;
        
        // Pivot adjustments to keep bottom at Y=0 relative to foundation surface
        if (type === 'wall' || type === 'doorway') mesh.position.y = 1.25; // 2.5 / 2
        if (type === 'foundation') mesh.position.y = 0.2; // 0.4 / 2
        if (type === 'door') mesh.position.y = 1.05; // 2.1 / 2
        if (type === 'roof') mesh.position.y = 0;

        return mesh;
    }
}
