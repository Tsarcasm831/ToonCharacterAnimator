
import * as THREE from 'three';
import { TreeData, RockData, ENV_CONSTANTS } from '../EnvironmentTypes';
import { ObjectFactory } from '../ObjectFactory';
import { PlayerUtils } from '../../player/PlayerUtils';

export type ObstacleInitContext = {
    scene: THREE.Scene;
    obstacles: THREE.Object3D[];
    trees: Map<string, TreeData>;
    rocks: Map<string, RockData>;
    decorativeItems: THREE.Object3D[];
    addObstacle: (obj: THREE.Object3D) => void;
    createAutumnTree: (pos: THREE.Vector3) => void;
    createDeadTree: (pos: THREE.Vector3) => void;
    createRockAt: (xz: THREE.Vector2, scale?: number) => void;
};

export function initBiomes(ctx: ObstacleInitContext) {
    const GRID_SIZE = 1.3333;
    const houseMinX = -27 * GRID_SIZE;
    const houseMaxX = (-27 + 5) * GRID_SIZE;
    const houseMinZ = 36 * GRID_SIZE;
    const houseMaxZ = (36 + 5) * GRID_SIZE;
    const houseMargin = 2.0;

    const isInsideHouse = (x: number, z: number) => {
        return x > (houseMinX - houseMargin) && x < (houseMaxX + houseMargin) &&
               z > (houseMinZ - houseMargin) && z < (houseMaxZ + houseMargin);
    };

    // Golden Dunes
    const duneX = 40, duneZ = 0;
    for (let i = 0; i < 15; i++) {
        const x = duneX + (Math.random() - 0.5) * 35;
        const z = duneZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        const { group, trunk } = ObjectFactory.createCactus(pos, 0.8 + Math.random() * 0.6);
        ctx.scene.add(group);
        ctx.obstacles.push(trunk);
    }

    // Timber Wharf
    const wharfX = -40, wharfZ = 40;
    for (let i = 0; i < 6; i++) {
        const x = wharfX + (Math.random() - 0.5) * 30;
        const z = wharfZ + (Math.random() - 0.5) * 30;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        const { group, obstacle } = ObjectFactory.createLightpole(pos);
        group.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
        ctx.scene.add(group);
        ctx.obstacles.push(obstacle);
    }
    for (let i = 0; i < 10; i++) {
        const x = wharfX + (Math.random() - 0.5) * 35;
        const z = wharfZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        const { group, obstacle } = ObjectFactory.createBarrel(pos);
        ctx.scene.add(group);
        ctx.obstacles.push(obstacle);
    }

    // Frostfell Peaks
    const frostX = 0, frostZ = -40;
    for (let i = 0; i < 12; i++) {
        const x = frostX + (Math.random() - 0.5) * 35;
        const z = frostZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        const { group, trunk } = ObjectFactory.createPineTree(pos, 1.5 + Math.random());
        ctx.scene.add(group);
        ctx.obstacles.push(trunk);
    }

    // Autumnal Grove
    const autumnX = 40, autumnZ = -40;
    for (let i = 0; i < 14; i++) {
        const x = autumnX + (Math.random() - 0.5) * 35;
        const z = autumnZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        ctx.createAutumnTree(pos);
    }

    // Gravel Pass
    const gravelX = 40, gravelZ = 40;
    for (let i = 0; i < 10; i++) {
        const x = gravelX + (Math.random() - 0.5) * 35;
        const z = gravelZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        ctx.createDeadTree(pos);
    }

    // Industrial Foundry
    const foundryX = -40, foundryZ = -40;
    for (let i = 0; i < 12; i++) {
        const x = foundryX + (Math.random() - 0.5) * 35;
        const z = foundryZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        const { group, obstacle } = ObjectFactory.createTire(pos);
        group.rotation.y = Math.random() * Math.PI * 2;
        ctx.scene.add(group);
        ctx.obstacles.push(obstacle);
    }
    for (let i = 0; i < 8; i++) {
        const x = foundryX + (Math.random() - 0.5) * 35;
        const z = foundryZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        const { group, obstacle } = ObjectFactory.createCrate(pos);
        group.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
        ctx.scene.add(group);
        ctx.obstacles.push(obstacle);
    }
}

export function initWorldScatter(ctx: ObstacleInitContext) {
    const GRID_SIZE = 1.3333;
    const houseMinX = -27 * GRID_SIZE;
    const houseMaxX = (-27 + 5) * GRID_SIZE;
    const houseMinZ = 36 * GRID_SIZE;
    const houseMaxZ = (36 + 5) * GRID_SIZE;
    const houseMargin = 2.0;

    const isInsideHouse = (x: number, z: number) => {
        return x > (houseMinX - houseMargin) && x < (houseMaxX + houseMargin) &&
               z > (houseMinZ - houseMargin) && z < (houseMaxZ + houseMargin);
    };

    ctx.trees.forEach(tree => {
        const pos = tree.basePosition;
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 0.5 + Math.random() * 1.5;
            const sx = pos.x + Math.cos(angle) * r;
            const sz = pos.z + Math.sin(angle) * r;
            const sy = PlayerUtils.getTerrainHeight(sx, sz);

            if (isInsideHouse(sx, sz)) continue;

            if (Math.random() > 0.4) {
                const grass = ObjectFactory.createGrass(new THREE.Vector3(sx, sy, sz), 'short');
                ctx.scene.add(grass);
                ctx.decorativeItems.push(grass);
            }

            if (Math.random() > 0.7) {
                const mush = ObjectFactory.createMushroom(new THREE.Vector3(sx, sy, sz));
                ctx.scene.add(mush);
                ctx.decorativeItems.push(mush);
            }
        }
    });

    ctx.rocks.forEach(rock => {
        const pos = rock.basePosition;
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 0.8 + Math.random() * 1.2;
            const sx = pos.x + Math.cos(angle) * r;
            const sz = pos.z + Math.sin(angle) * r;
            const sy = PlayerUtils.getTerrainHeight(sx, sz);

            if (isInsideHouse(sx, sz)) continue;

            const pebble = ObjectFactory.createPebble(new THREE.Vector3(sx, sy, sz));
            ctx.scene.add(pebble);
            ctx.decorativeItems.push(pebble);
        }
    });

    for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        if (isInsideHouse(x, z)) continue;
        const y = PlayerUtils.getTerrainHeight(x, z);
        if (y > -0.1) {
            const grass = ObjectFactory.createGrass(
                new THREE.Vector3(x, y, z),
                Math.random() > 0.8 ? 'tall' : 'short'
            );
            ctx.scene.add(grass);
            ctx.decorativeItems.push(grass);
        }
    }
}

export function initMidLevelFillers(ctx: ObstacleInitContext) {
    const GRID_SIZE = 1.3333;
    const houseMinX = -27 * GRID_SIZE;
    const houseMaxX = (-27 + 5) * GRID_SIZE;
    const houseMinZ = 36 * GRID_SIZE;
    const houseMaxZ = (36 + 5) * GRID_SIZE;
    const houseMargin = 2.0;

    const isInsideHouse = (x: number, z: number) => {
        return x > (houseMinX - houseMargin) && x < (houseMaxX + houseMargin) &&
               z > (houseMinZ - houseMargin) && z < (houseMaxZ + houseMargin);
    };

    ctx.trees.forEach(tree => {
        if (Math.random() > 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const r = 1.5 + Math.random() * 1.0;
            const x = tree.basePosition.x + Math.cos(angle) * r;
            const z = tree.basePosition.z + Math.sin(angle) * r;
            if (isInsideHouse(x, z)) return;
            const y = PlayerUtils.getTerrainHeight(x, z);
            const bush = ObjectFactory.createBush(new THREE.Vector3(x, y, z), 0.8 + Math.random() * 0.4);
            ctx.scene.add(bush);
            ctx.decorativeItems.push(bush);
        }
        if (tree.basePosition.z < -10) {
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 1.0 + Math.random() * 2.0;
                const x = tree.basePosition.x + Math.cos(angle) * r;
                const z = tree.basePosition.z + Math.sin(angle) * r;
                if (isInsideHouse(x, z)) continue;
                const y = PlayerUtils.getTerrainHeight(x, z);
                const fern = ObjectFactory.createFern(new THREE.Vector3(x, y, z));
                ctx.scene.add(fern);
                ctx.decorativeItems.push(fern);
            }
        }
    });
    const radius = ENV_CONSTANTS.POND_RADIUS;
    const centerX = ENV_CONSTANTS.POND_X;
    const centerZ = ENV_CONSTANTS.POND_Z;
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius + 0.4 + Math.random() * 0.8;
        const x = centerX + Math.cos(angle) * r;
        const z = centerZ + Math.sin(angle) * r;
        if (isInsideHouse(x, z)) continue;
        const y = PlayerUtils.getTerrainHeight(x, z);
        const reeds = ObjectFactory.createReeds(new THREE.Vector3(x, y, z));
        ctx.scene.add(reeds);
        ctx.decorativeItems.push(reeds);
    }
}

export function initStorytellingRemnants(ctx: ObstacleInitContext) {
    const GRID_SIZE = 1.3333;
    const houseMinX = -27 * GRID_SIZE;
    const houseMaxX = (-27 + 5) * GRID_SIZE;
    const houseMinZ = 36 * GRID_SIZE;
    const houseMaxZ = (36 + 5) * GRID_SIZE;
    const houseMargin = 2.0;

    const isInsideHouse = (x: number, z: number) => {
        return x > (houseMinX - houseMargin) && x < (houseMaxX + houseMargin) &&
               z > (houseMinZ - houseMargin) && z < (houseMaxZ + houseMargin);
    };

    const fireLocations = [
        new THREE.Vector3(-8, 0, 5),
        new THREE.Vector3(45, 0, -45)
    ];
    fireLocations.forEach(pos => {
        if (isInsideHouse(pos.x, pos.z)) return;
        pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        const fire = ObjectFactory.createCampfire(pos);
        ctx.scene.add(fire);
        ctx.decorativeItems.push(fire);
        // Add to obstacles for collision
        ctx.obstacles.push(fire);
    });

    for (let i = 0; i < 5; i++) {
        const pos = new THREE.Vector3(-25, 0, 30 + i * 2);
        if (isInsideHouse(pos.x, pos.z)) continue;
        pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        const fence = ObjectFactory.createFence(pos, Math.PI / 2);
        ctx.addObstacle(fence);
    }

    const foundryX = -40, foundryZ = -40;
    for (let i = 0; i < 4; i++) {
        const x = foundryX + (Math.random() - 0.5) * 20;
        const z = foundryZ + (Math.random() - 0.5) * 20;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        const pallet = ObjectFactory.createPallet(pos);
        pallet.rotation.y = Math.random() * Math.PI;
        ctx.addObstacle(pallet);
    }

    const signLocs = [
        { pos: new THREE.Vector3(-15, 0, 0), type: 'yield' as const },
        { pos: new THREE.Vector3(-30, 0, -30), type: 'stop' as const }
    ];
    signLocs.forEach(cfg => {
        if (isInsideHouse(cfg.pos.x, cfg.pos.z)) return;
        cfg.pos.y = PlayerUtils.getTerrainHeight(cfg.pos.x, cfg.pos.z);
        const sign = ObjectFactory.createRoadSign(cfg.pos, cfg.type);
        ctx.addObstacle(sign);
    });
}

export function initAtmosphericEffects(ctx: ObstacleInitContext) {
    const GRID_SIZE = 1.3333;
    const houseMinX = -27 * GRID_SIZE;
    const houseMaxX = (-27 + 5) * GRID_SIZE;
    const houseMinZ = 36 * GRID_SIZE;
    const houseMaxZ = (36 + 5) * GRID_SIZE;
    const houseMargin = 2.0;

    const isInsideHouse = (x: number, z: number) => {
        return x > (houseMinX - houseMargin) && x < (houseMaxX + houseMargin) &&
               z > (houseMinZ - houseMargin) && z < (houseMaxZ + houseMargin);
    };

    // 1. Hanging Moss on Trees
    ctx.trees.forEach(tree => {
        // Standard trees and Autumn trees get moss
        const isStandard = tree.group.name !== 'pine'; // Pine uses createPineTree which returns different structure
        if (isStandard && Math.random() > 0.4) {
            const count = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 1.0 + Math.random() * 0.8;
                const h = 2.5 + Math.random() * 1.5;
                const mossPos = new THREE.Vector3(Math.cos(angle) * r, h, Math.sin(angle) * r);
                const moss = ObjectFactory.createHangingMoss(mossPos);
                tree.group.add(moss);
                ctx.decorativeItems.push(moss);
            }
        }
    });

    // 2. Fireflies in Meadows and Autumn Grove
    const fireflySpawns = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(40, 0, -40),
        new THREE.Vector3(-10, 0, 10)
    ];
    fireflySpawns.forEach(pos => {
        if (isInsideHouse(pos.x, pos.z)) return;
        pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        const flies = ObjectFactory.createAtmosphericMotes(pos, 10, 0xaaff00);
        ctx.scene.add(flies);
        ctx.decorativeItems.push(flies);
    });

    // 3. Frost Glitter in Peaks
    const frostMotes = ObjectFactory.createAtmosphericMotes(new THREE.Vector3(0, 0, -40), 15, 0x00ffff);
    ctx.scene.add(frostMotes);
    ctx.decorativeItems.push(frostMotes);
}

export function initPondDecorations(ctx: ObstacleInitContext) {
    const GRID_SIZE = 1.3333;
    const houseMinX = -27 * GRID_SIZE;
    const houseMaxX = (-27 + 5) * GRID_SIZE;
    const houseMinZ = 36 * GRID_SIZE;
    const houseMaxZ = (36 + 5) * GRID_SIZE;
    const houseMargin = 2.0;

    const isInsideHouse = (x: number, z: number) => {
        return x > (houseMinX - houseMargin) && x < (houseMaxX + houseMargin) &&
               z > (houseMinZ - houseMargin) && z < (houseMaxZ + houseMargin);
    };

    const radius = ENV_CONSTANTS.POND_RADIUS;
    const centerX = ENV_CONSTANTS.POND_X;
    const centerZ = ENV_CONSTANTS.POND_Z;

    for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const r = radius + (Math.random() - 0.5) * 0.4;
        const x = centerX + Math.cos(angle) * r;
        const z = centerZ + Math.sin(angle) * r;
        if (isInsideHouse(x, z)) continue;
        const y = PlayerUtils.getTerrainHeight(x, z);
        const cattail = ObjectFactory.createCattail(new THREE.Vector3(x, y, z));
        ctx.scene.add(cattail);
        ctx.decorativeItems.push(cattail);
    }

    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (radius - 1.0);
        const x = centerX + Math.cos(angle) * r;
        const z = centerZ + Math.sin(angle) * r;
        if (isInsideHouse(x, z)) continue;
        const pad = ObjectFactory.createLilyPad(new THREE.Vector3(x, 0, z));
        pad.rotation.z = Math.PI / 2;
        ctx.scene.add(pad);
        ctx.decorativeItems.push(pad);
    }

    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const x = centerX + Math.cos(angle) * (radius + 0.2);
        const z = centerZ + Math.sin(angle) * (radius + 0.2);
        if (isInsideHouse(x, z)) continue;
        ctx.createRockAt(new THREE.Vector2(x, z), 0.3 + Math.random() * 0.4);
    }
}
