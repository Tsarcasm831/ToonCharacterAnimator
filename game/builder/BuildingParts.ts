
import * as THREE from 'three';

export type StructureType = 'foundation' | 'wall' | 'doorway' | 'door' | 'roof' | 'pillar' | 'round_foundation' | 'round_wall';

export class BuildingParts {
    static getGeometry(type: StructureType): THREE.BufferGeometry {
        const GRID_SIZE = 1.3333;
        
        switch (type) {
            case 'foundation':
                return new THREE.BoxGeometry(GRID_SIZE, 0.4, GRID_SIZE);
            case 'round_foundation':
                // Covers approx 3x3 grid
                return new THREE.CylinderGeometry(2.5, 2.5, 0.4, 32);
            case 'wall':
                return new THREE.BoxGeometry(GRID_SIZE, 3.3, 0.2); 
            case 'round_wall':
                // A segment of a cylinder wall
                // Radius matches foundation (2.5). 
                // 8 segments = 45 degrees each.
                const innerR = 2.3;
                const outerR = 2.5;
                const height = 3.3;
                // Create arc
                const shape = new THREE.Shape();
                const angle = Math.PI / 4; // 45 deg
                
                // Outer arc
                shape.absarc(0, 0, outerR, -angle/2, angle/2, false);
                // Inner arc
                shape.absarc(0, 0, innerR, angle/2, -angle/2, true);
                
                const extrudeSettings = {
                    depth: height,
                    bevelEnabled: false,
                    curveSegments: 8
                };
                const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                // Rotate to stand up (Extrude is along Z) -> Rotate X -90
                geo.rotateX(-Math.PI / 2);
                // Center Y
                geo.translate(0, height/2, 0);
                return geo;
            case 'pillar':
                return new THREE.BoxGeometry(0.3, 3.3, 0.3);
            case 'doorway':
                const postWidth = 0.26;
                const totalWidth = GRID_SIZE;
                const holeWidth = totalWidth - (postWidth * 2); 
                const totalHeight = 3.3; 
                const lintelHeight = 0.95; 
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

    static createStructureMesh(type: StructureType, isGhost: boolean = false, customColor?: number): THREE.Object3D {
        const getMat = (t: StructureType) => {
            if (isGhost) {
                return new THREE.MeshStandardMaterial({
                    color: 0x44ff44,
                    transparent: true,
                    opacity: 0.4,
                    wireframe: true
                });
            } else {
                let color = 0x8d6e63; // Default Wood
                
                if (customColor !== undefined && (t === 'wall' || t === 'round_wall' || t === 'doorway' || t === 'pillar')) {
                    color = customColor;
                } else {
                    // Standard structural colors
                    if (t === 'foundation' || t === 'round_foundation') color = 0x795548;
                    if (t === 'roof') color = 0x4e342e;
                    if (t === 'pillar') color = 0x5d4037;
                }

                return new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.8,
                    metalness: 0.1,
                    flatShading: true
                });
            }
        };

        const mat = getMat(type);
        const geo = this.getGeometry(type);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = !isGhost;
        mesh.receiveShadow = !isGhost;
        
        return mesh;
    }
}
