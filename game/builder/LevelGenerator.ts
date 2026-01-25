
import * as THREE from 'three';
import { BuildingParts } from './BuildingParts';
import { getCottage } from '../building/Cottage';
import { getGatehouse } from '../building/Gatehouse';
import { getLShape } from '../building/LShape';
import { getLonghouse } from '../building/Longhouse';
import { getRoundhouse } from '../building/Roundhouse';
import { getTheForge } from '../building/TheForge';
import type { Blueprint } from '../building/BlueprintTypes';
type BuildEnvironment = {
    group: THREE.Group;
    obstacles: THREE.Object3D[];
    addObstacle?: (obj: THREE.Object3D) => void;
};

export class LevelGenerator {
    static buildDevLevel(environment: BuildEnvironment) {
        if (!environment) return;
        
        const GRID = 1.3333;
        
        this.buildStructure(environment, getTheForge(), -27 * GRID, 36 * GRID);
        this.buildStructure(environment, getCottage(), -20 * GRID, 45 * GRID, Math.PI / 2, 0x64b5f6);
        this.buildStructure(environment, getLonghouse(), -10 * GRID, 35 * GRID, 0, 0x81c784);
        this.buildStructure(environment, getLShape(), -38 * GRID, 30 * GRID, 0, 0xe57373);
        this.buildStructure(environment, getRoundhouse(), -50 * GRID, 45 * GRID, 0, 0x9575cd);
        this.buildStructure(environment, getGatehouse(), -15 * GRID, 20 * GRID, 0, 0xffb74d);
    }

    static buildTownLevel(environment: BuildEnvironment) {
        if (!environment) return;

        const GRID = 1.3333;

        this.buildStructure(environment, getGatehouse(), -14 * GRID, 12 * GRID, 0, 0xffd54f);
        this.buildStructure(environment, getLonghouse(), 10 * GRID, 12 * GRID, Math.PI, 0x90caf9);
        this.buildStructure(environment, getCottage(), -6 * GRID, -10 * GRID, Math.PI / 2, 0xa5d6a7);
        this.buildStructure(environment, getTheForge(), 12 * GRID, -8 * GRID, Math.PI / 2, 0xef9a9a);
        this.buildStructure(environment, getRoundhouse(), -18 * GRID, -4 * GRID, 0, 0xb39ddb);
    }

    private static buildStructure(environment: BuildEnvironment, blueprint: Blueprint, originX: number, originZ: number, blueprintRotation: number = 0, color?: number) {
        const GRID = 1.3333;
        blueprint.forEach(part => {
            let localX = part.x;
            let localZ = part.z;
            
            // Center adjustment logic from original Game.ts
            if (part.type === 'foundation' || part.type === 'roof' || part.type === 'round_foundation' || part.type === 'round_wall') {
                localX += 0.5; localZ += 0.5;
            } else if (part.type !== 'pillar') {
                if (part.rotation === Math.PI / 2) localZ += 0.5; else localX += 0.5;
            }
            
            const rx = localX * Math.cos(blueprintRotation) - localZ * Math.sin(blueprintRotation);
            const rz = localX * Math.sin(blueprintRotation) + localZ * Math.cos(blueprintRotation);
            
            const finalX = originX + (rx * GRID);
            const finalZ = originZ + (rz * GRID);
            const finalRot = (part.rotation || 0) + blueprintRotation;
            
            const FOUNDATION_HEIGHT = 0.4;
            let y = 0;
            if (part.type === 'foundation' || part.type === 'round_foundation') y = 0.2; 
            else if (part.type === 'wall' || part.type === 'pillar' || part.type === 'round_wall') y = FOUNDATION_HEIGHT + 1.65; 
            else if (part.type === 'doorway') y = FOUNDATION_HEIGHT + 1.65;
            else if (part.type === 'door') y = FOUNDATION_HEIGHT + 1.175;
            else if (part.type === 'roof') y = FOUNDATION_HEIGHT + 3.3; 
            
            this.placeStructure(environment, part.type, finalX, y, finalZ, finalRot, color);
        });
    }

    private static placeStructure(environment: BuildEnvironment, type: any, x: number, y: number, z: number, rotation: number, color?: number) {
        const mesh = BuildingParts.createStructureMesh(type, false, color);
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotation;
        
        const applyUserData = (obj: THREE.Object3D) => { 
            obj.userData = { ...obj.userData, type: 'hard', material: 'wood', structureType: type }; 
        };

        const registerObstacle = (obj: THREE.Object3D) => {
            if (environment.addObstacle) {
                environment.addObstacle(obj);
            } else {
                environment.obstacles.push(obj);
            }
        };
        
        if (mesh instanceof THREE.Group) {
            mesh.traverse(applyUserData);
            mesh.traverse(child => {
                if (child instanceof THREE.Mesh && child.userData.type === 'hard') registerObstacle(child);
            });
        } else {
            applyUserData(mesh);
            registerObstacle(mesh);
        }
        environment.group.add(mesh);
    }
}
