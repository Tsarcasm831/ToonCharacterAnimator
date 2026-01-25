
import * as THREE from 'three';
import { Wall } from './wall';
import { EventTent } from '../environment/objects/event_tent';
import { Firepit } from '../environment/objects/firepit';
import { PotionTent } from '../environment/objects/potion_tent';
import { SupplyCart } from '../environment/objects/supply_cart';
import { StoneHWall } from '../environment/objects/stone_h_wall';
import { Torch } from '../environment/objects/torch_stand';
import { WoodenWall } from '../environment/objects/wooden_wall';
import { Flag } from '../environment/objects/flag';
import { ObjectFactory } from '../environment/ObjectFactory';
import { getCottage } from '../building/Cottage';
import { getGatehouse } from '../building/Gatehouse';
import { getLShape } from '../building/LShape';
import { getLonghouse } from '../building/Longhouse';
import { getRoundhouse } from '../building/Roundhouse';
import { getTheForge } from '../building/TheForge';
import type { BlueprintPart } from '../building/BlueprintTypes';

export type StructureType = 'foundation' | 'wall' | 'doorway' | 'door' | 'roof' | 'pillar' | 'round_foundation' | 'round_wall' | 
                            'palisade' | 'event_tent' | 'firepit' | 'potion_tent' | 'supply_cart' | 'stone_wall' | 'torch' | 'wooden_wall' | 'flag' | 'lightpole' |
                            'barrel' | 'crate' | 'tire' | 'pallet' | 'road_sign' |
                            'blueprint_forge' | 'blueprint_cottage' | 'blueprint_longhouse' | 'blueprint_l_shape' | 'blueprint_roundhouse' | 'blueprint_gatehouse';

export class BuildingParts {
    static getGeometry(type: StructureType): THREE.BufferGeometry {
        const GRID_SIZE = 1.3333;
        
        switch (type) {
            case 'foundation':
                return new THREE.BoxGeometry(GRID_SIZE, 0.4, GRID_SIZE);
            case 'round_foundation':
                return new THREE.CylinderGeometry(2.5, 2.5, 0.4, 32);
            case 'wall':
                return new THREE.BoxGeometry(GRID_SIZE, 3.3, 0.2); 
            case 'round_wall':
                const innerR = 2.3;
                const outerR = 2.5;
                const height = 3.3;
                const shape = new THREE.Shape();
                const angle = Math.PI / 4; 
                shape.absarc(0, 0, outerR, -angle/2, angle/2, false);
                shape.absarc(0, 0, innerR, angle/2, -angle/2, true);
                const extrudeSettings = {
                    depth: height,
                    bevelEnabled: false,
                    curveSegments: 8
                };
                const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                // Center vertically like standard walls
                geo.translate(0, 0, -height/2);
                geo.rotateX(-Math.PI / 2);
                return geo;
            case 'pillar':
                return new THREE.BoxGeometry(0.3, 3.3, 0.3);
            case 'doorway':
                // This is used for the Ghost / Merged representation
                const postWidth = 0.05; // Significant clearance
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
                return new THREE.BoxGeometry(1.23, 2.35, 0.15); // Much wider door to fit the wider gap
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
        // Handle complex custom structures
        if (type === 'palisade') return Wall.create(isGhost);
        if (type === 'event_tent') return EventTent.create(isGhost);
        if (type === 'firepit') return Firepit.create(isGhost);
        if (type === 'potion_tent') return PotionTent.create(isGhost);
        if (type === 'supply_cart') return SupplyCart.create(isGhost);
        if (type === 'stone_wall') return StoneHWall.create(isGhost);
        if (type === 'torch') return Torch.create(isGhost);
        if (type === 'wooden_wall') return WoodenWall.create(isGhost);
        if (type === 'flag') return Flag.create(isGhost);
        if (type === 'barrel') {
            const result = ObjectFactory.createBarrel(new THREE.Vector3());
            if (isGhost) this.applyGhostMaterial(result.group);
            (result.group as any)._obstacle = result.obstacle;
            return result.group;
        }
        if (type === 'crate') {
            const result = ObjectFactory.createCrate(new THREE.Vector3());
            if (isGhost) this.applyGhostMaterial(result.group);
            (result.group as any)._obstacle = result.obstacle;
            return result.group;
        }
        if (type === 'tire') {
            const result = ObjectFactory.createTire(new THREE.Vector3());
            if (isGhost) this.applyGhostMaterial(result.group);
            (result.group as any)._obstacle = result.obstacle;
            return result.group;
        }
        if (type === 'pallet') {
            const result = ObjectFactory.createPallet(new THREE.Vector3());
            const group = result instanceof THREE.Group ? result : (result as any).group;
            if (isGhost) this.applyGhostMaterial(group);
            return group;
        }
        if (type === 'road_sign') {
            const result = ObjectFactory.createRoadSign(new THREE.Vector3());
            const group = result instanceof THREE.Group ? result : (result as any).group;
            if (isGhost) this.applyGhostMaterial(group);
            return group;
        }
        if (type === 'lightpole') {
            try {
                const result = ObjectFactory.createLightpole(new THREE.Vector3(0, 0, 0));
                if (!result || !result.group) {
                    console.error('BuildingParts: ObjectFactory.createLightpole returned invalid result:', result);
                    return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
                }
                if (isGhost) {
                    result.group.traverse((child) => {
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
                }
                // Store obstacle reference for later use
                (result.group as any)._obstacle = result.obstacle;
                return result.group;
            } catch (error) {
                console.error('BuildingParts: Error creating lightpole:', error);
                return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
            }
        }

        // Blueprint handling
        if (type.startsWith('blueprint_')) {
            const group = new THREE.Group();
            let blueprintParts: BlueprintPart[] = [];
            
            switch (type) {
                case 'blueprint_forge': blueprintParts = getTheForge(); break;
                case 'blueprint_cottage': blueprintParts = getCottage(); break;
                case 'blueprint_longhouse': blueprintParts = getLonghouse(); break;
                case 'blueprint_l_shape': blueprintParts = getLShape(); break;
                case 'blueprint_roundhouse': blueprintParts = getRoundhouse(); break;
                case 'blueprint_gatehouse': blueprintParts = getGatehouse(); break;
            }

            const GRID_SIZE = 1.3333;
            
            blueprintParts.forEach(part => {
                const mesh = this.createStructureMesh(part.type, isGhost);
                
                // Position based on grid
                mesh.position.x = part.x * GRID_SIZE;
                mesh.position.z = part.z * GRID_SIZE;
                
                // Adjust height
                if (part.yOffset) mesh.position.y += part.yOffset;
                
                // Apply rotation if needed
                if (part.rotation) {
                    mesh.rotation.y = part.rotation;
                }

                // Standard vertical offsets based on type (matching BuilderManager logic roughly, 
                // but usually handled by the mesh creation or part definition. 
                // However, createStructureMesh returns centered meshes or specific groups.
                // Standard parts need placement adjustment.
                
                if (part.type === 'wall' || part.type === 'doorway' || part.type === 'pillar') {
                    mesh.position.y += 1.65;
                } else if (part.type === 'foundation') {
                    mesh.position.y += 0.2;
                } else if (part.type === 'roof') {
                    mesh.position.y += 3.3;
                } else if (part.type === 'round_wall') {
                    mesh.position.y += 1.65;
                } else if (part.type === 'round_foundation') {
                    mesh.position.y += 0.2;
                }
                
                group.add(mesh);
            });
            
            return group;
        }

        const getMat = (t: StructureType) => {
            if (isGhost) {
                return new THREE.MeshStandardMaterial({
                    color: 0x44ff44,
                    transparent: true,
                    opacity: 0.4,
                    wireframe: true
                });
            } else {
                let color = 0x8d6e63; 
                if (customColor !== undefined && (t === 'wall' || t === 'round_wall' || t === 'doorway' || t === 'pillar')) {
                    color = customColor;
                } else {
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

        if (type === 'doorway' && !isGhost) {
            // Build as a Group to allow per-component collision checking
            const GRID_SIZE = 1.3333;
            const postWidth = 0.05; // Thin posts
            const totalWidth = GRID_SIZE;
            const holeWidth = totalWidth - (postWidth * 2); 
            const totalHeight = 3.3; 
            const lintelHeight = 0.95; 
            const depth = 0.25; 

            const group = new THREE.Group();
            
            const postGeo = new THREE.BoxGeometry(postWidth, totalHeight, depth);
            const lPost = new THREE.Mesh(postGeo, mat);
            lPost.position.x = -(totalWidth/2 - postWidth/2);
            lPost.castShadow = true;
            lPost.receiveShadow = true;
            group.add(lPost);

            const rPost = new THREE.Mesh(postGeo, mat);
            rPost.position.x = +(totalWidth/2 - postWidth/2);
            rPost.castShadow = true;
            rPost.receiveShadow = true;
            group.add(rPost);

            const lintelGeo = new THREE.BoxGeometry(holeWidth, lintelHeight, depth);
            const lintel = new THREE.Mesh(lintelGeo, mat);
            lintel.position.y = (totalHeight/2 - lintelHeight/2);
            lintel.castShadow = true;
            lintel.receiveShadow = true;
            group.add(lintel);

            return group;
        }

        const geo = this.getGeometry(type);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = !isGhost;
        mesh.receiveShadow = !isGhost;
        
        return mesh;
    }

    private static applyGhostMaterial(obj: THREE.Object3D) {
        obj.traverse((child) => {
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
    }
}
