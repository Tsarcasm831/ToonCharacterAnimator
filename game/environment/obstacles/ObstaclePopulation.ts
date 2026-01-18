import * as THREE from 'three';
import { TreeData, RockData, ENV_CONSTANTS } from '../EnvironmentTypes';
import { ObjectFactory } from '../ObjectFactory';
import { ScatterFactory } from '../objects/ScatterFactory';
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

type PopulateOptions = {
    yieldEvery?: number;
    yieldFrame?: () => Promise<void>;
};

const maybeYield = async (count: number, options?: PopulateOptions) => {
    if (!options?.yieldEvery || !options?.yieldFrame) return;
    if (count % options.yieldEvery === 0) {
        await options.yieldFrame();
    }
};

export async function initBiomes(ctx: ObstacleInitContext, options?: PopulateOptions) {
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
        await maybeYield(i + 1, options);
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
        await maybeYield(i + 1, options);
    }
    for (let i = 0; i < 10; i++) {
        const x = wharfX + (Math.random() - 0.5) * 35;
        const z = wharfZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        const { group, obstacle } = ObjectFactory.createBarrel(pos);
        ctx.scene.add(group);
        ctx.obstacles.push(obstacle);
        await maybeYield(i + 1, options);
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
        await maybeYield(i + 1, options);
    }

    // Autumnal Grove
    const autumnX = 40, autumnZ = -40;
    for (let i = 0; i < 14; i++) {
        const x = autumnX + (Math.random() - 0.5) * 35;
        const z = autumnZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        ctx.createAutumnTree(pos);
        await maybeYield(i + 1, options);
    }

    // Gravel Pass
    const gravelX = 40, gravelZ = 40;
    for (let i = 0; i < 10; i++) {
        const x = gravelX + (Math.random() - 0.5) * 35;
        const z = gravelZ + (Math.random() - 0.5) * 35;
        if (isInsideHouse(x, z)) continue;
        const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
        ctx.createDeadTree(pos);
        await maybeYield(i + 1, options);
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
        await maybeYield(i + 1, options);
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
        await maybeYield(i + 1, options);
    }
}

export async function initWorldScatter(ctx: ObstacleInitContext, options?: PopulateOptions) {
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

    const pebbleInstances: { position: THREE.Vector3; scale: number; color: number; rotation: THREE.Euler }[] = [];
    const mushroomInstances: { position: THREE.Vector3; scale: number; capColor: number }[] = [];
    let treeIndex = 0;
    for (const tree of ctx.trees.values()) {
        treeIndex += 1;
        const pos = tree.basePosition;
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 0.5 + Math.random() * 1.5;
            const sx = pos.x + Math.cos(angle) * r;
            const sz = pos.z + Math.sin(angle) * r;
            const sy = PlayerUtils.getTerrainHeight(sx, sz);

            if (isInsideHouse(sx, sz)) continue;

            if (Math.random() > 0.4) {
                // Use new dense tufts occasionally
                const grass = Math.random() > 0.6 
                    ? ObjectFactory.createGrassTuft(new THREE.Vector3(sx, sy, sz))
                    : ObjectFactory.createGrass(new THREE.Vector3(sx, sy, sz), 'short');
                ctx.scene.add(grass);
                ctx.decorativeItems.push(grass);
            }

            if (Math.random() > 0.7) {
                const s = 0.4 + Math.random() * 0.4;
                const capColors = ScatterFactory.getMushroomCapColors();
                const capColor = capColors[Math.floor(Math.random() * capColors.length)];
                mushroomInstances.push({ position: new THREE.Vector3(sx, sy, sz), scale: s, capColor });
            }
        }
        await maybeYield(treeIndex, options);
    }

    let rockIndex = 0;
    for (const rock of ctx.rocks.values()) {
        rockIndex += 1;
        const pos = rock.basePosition;
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 0.8 + Math.random() * 1.2;
            const sx = pos.x + Math.cos(angle) * r;
            const sz = pos.z + Math.sin(angle) * r;
            const sy = PlayerUtils.getTerrainHeight(sx, sz);

            if (isInsideHouse(sx, sz)) continue;

            const s = 0.05 + Math.random() * 0.12;
            const colors = [0x757575, 0x616161, 0x9e9e9e, 0x5d4037];
            const colorVal = colors[Math.floor(Math.random() * colors.length)];
            pebbleInstances.push({
                position: new THREE.Vector3(sx, sy + s * 0.5, sz),
                scale: s,
                color: colorVal,
                rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
            });

            if (Math.random() > 0.8) {
                const grass = ObjectFactory.createGrassTuft(new THREE.Vector3(sx, sy, sz));
                ctx.scene.add(grass);
                ctx.decorativeItems.push(grass);
            }
        }
        await maybeYield(rockIndex, options);
    }

    for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        if (isInsideHouse(x, z)) continue;
        const y = PlayerUtils.getTerrainHeight(x, z);
        if (y > -0.1) {
            const grass = Math.random() > 0.5 
                ? ObjectFactory.createGrassTuft(new THREE.Vector3(x, y, z))
                : ObjectFactory.createGrass(new THREE.Vector3(x, y, z), Math.random() > 0.8 ? 'tall' : 'short');
            ctx.scene.add(grass);
            ctx.decorativeItems.push(grass);
        }
        await maybeYield(i + 1, options);
    }

    if (pebbleInstances.length > 0) {
        const geometry = ScatterFactory.getPebbleGeometry();
        const material = ScatterFactory.getPebbleInstancedMaterial();
        const mesh = new THREE.InstancedMesh(geometry, material, pebbleInstances.length);
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        pebbleInstances.forEach((instance, idx) => {
            dummy.position.copy(instance.position);
            dummy.rotation.copy(instance.rotation);
            dummy.scale.setScalar(instance.scale);
            dummy.updateMatrix();
            mesh.setMatrixAt(idx, dummy.matrix);
            color.setHex(instance.color);
            mesh.setColorAt(idx, color);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: 'soft' };
        ctx.scene.add(mesh);
        ctx.decorativeItems.push(mesh);
    }

    if (mushroomInstances.length > 0) {
        const stalkGeo = ScatterFactory.getMushroomStalkGeometry();
        const stalkMat = ScatterFactory.getMushroomStalkMaterial();
        const capGeo = ScatterFactory.getMushroomCapGeometry();
        const capMat = ScatterFactory.getMushroomCapInstancedMaterial();

        const stalks = new THREE.InstancedMesh(stalkGeo, stalkMat, mushroomInstances.length);
        const caps = new THREE.InstancedMesh(capGeo, capMat, mushroomInstances.length);
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        mushroomInstances.forEach((instance, idx) => {
            dummy.position.copy(instance.position);
            dummy.scale.setScalar(instance.scale);
            dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
            dummy.updateMatrix();
            stalks.setMatrixAt(idx, dummy.matrix);

            dummy.position.y += 0.12 * instance.scale;
            dummy.updateMatrix();
            caps.setMatrixAt(idx, dummy.matrix);

            color.setHex(instance.capColor);
            caps.setColorAt(idx, color);
        });
        stalks.instanceMatrix.needsUpdate = true;
        caps.instanceMatrix.needsUpdate = true;
        if (caps.instanceColor) caps.instanceColor.needsUpdate = true;
        stalks.userData = { type: 'soft' };
        caps.userData = { type: 'soft' };
        ctx.scene.add(stalks);
        ctx.scene.add(caps);
        ctx.decorativeItems.push(stalks, caps);
    }
}

export async function initMidLevelFillers(ctx: ObstacleInitContext, options?: PopulateOptions) {
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

    let treeIndex = 0;
    for (const tree of ctx.trees.values()) {
        treeIndex += 1;
        if (Math.random() > 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const r = 1.5 + Math.random() * 1.0;
            const x = tree.basePosition.x + Math.cos(angle) * r;
            const z = tree.basePosition.z + Math.sin(angle) * r;
            if (isInsideHouse(x, z)) continue;
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
        await maybeYield(treeIndex, options);
    }
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
        await maybeYield(i + 1, options);
    }
}

export async function initStorytellingRemnants(ctx: ObstacleInitContext, options?: PopulateOptions) {
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
    let fireIndex = 0;
    for (const pos of fireLocations) {
        fireIndex += 1;
        if (isInsideHouse(pos.x, pos.z)) continue;
        pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        const fire = ObjectFactory.createCampfire(pos);
        ctx.scene.add(fire);
        ctx.decorativeItems.push(fire);
        // Add to obstacles for collision
        ctx.obstacles.push(fire);
        await maybeYield(fireIndex, options);
    }

    for (let i = 0; i < 5; i++) {
        const pos = new THREE.Vector3(-25, 0, 30 + i * 2);
        if (isInsideHouse(pos.x, pos.z)) continue;
        pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        const fence = ObjectFactory.createFence(pos, Math.PI / 2);
        ctx.addObstacle(fence);
        await maybeYield(i + 1, options);
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
        await maybeYield(i + 1, options);
    }

    const signLocs = [
        { pos: new THREE.Vector3(-15, 0, 0), type: 'yield' as const },
        { pos: new THREE.Vector3(-30, 0, -30), type: 'stop' as const }
    ];
    let signIndex = 0;
    for (const cfg of signLocs) {
        signIndex += 1;
        if (isInsideHouse(cfg.pos.x, cfg.pos.z)) continue;
        cfg.pos.y = PlayerUtils.getTerrainHeight(cfg.pos.x, cfg.pos.z);
        const sign = ObjectFactory.createRoadSign(cfg.pos, cfg.type);
        ctx.addObstacle(sign);
        await maybeYield(signIndex, options);
    }
}

export async function initAtmosphericEffects(ctx: ObstacleInitContext, options?: PopulateOptions) {
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
    let treeIndex = 0;
    for (const tree of ctx.trees.values()) {
        treeIndex += 1;
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
        await maybeYield(treeIndex, options);
    }

    // 2. Fireflies in Meadows and Autumn Grove
    const fireflySpawns = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(40, 0, -40),
        new THREE.Vector3(-10, 0, 10)
    ];
    let fireflyIndex = 0;
    for (const pos of fireflySpawns) {
        fireflyIndex += 1;
        if (isInsideHouse(pos.x, pos.z)) continue;
        pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        const flies = ObjectFactory.createAtmosphericMotes(pos, 10, 0xaaff00);
        ctx.scene.add(flies);
        ctx.decorativeItems.push(flies);
        await maybeYield(fireflyIndex, options);
    }

    // 3. Frost Glitter in Peaks
    const frostMotes = ObjectFactory.createAtmosphericMotes(new THREE.Vector3(0, 0, -40), 15, 0x00ffff);
    ctx.scene.add(frostMotes);
    ctx.decorativeItems.push(frostMotes);
}

export async function initPondDecorations(ctx: ObstacleInitContext, options?: PopulateOptions) {
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
        await maybeYield(i + 1, options);
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
        await maybeYield(i + 1, options);
    }

    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const x = centerX + Math.cos(angle) * (radius + 0.2);
        const z = centerZ + Math.sin(angle) * (radius + 0.2);
        if (isInsideHouse(x, z)) continue;
        ctx.createRockAt(new THREE.Vector2(x, z), 0.3 + Math.random() * 0.4);
        await maybeYield(i + 1, options);
    }
}
