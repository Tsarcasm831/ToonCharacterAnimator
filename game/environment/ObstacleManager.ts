import * as THREE from 'three';
import { TreeData, RockData, ENV_CONSTANTS } from './EnvironmentTypes';
import { ObjectFactory } from './ObjectFactory';
import { DebrisSystem } from './DebrisSystem';
import { PlayerUtils } from '../player/PlayerUtils';

export class ObstacleManager {
    obstacles: THREE.Object3D[] = [];
    private scene: THREE.Scene;
    private trees: Map<string, TreeData> = new Map();
    private rocks: Map<string, RockData> = new Map();
    private decorativeItems: THREE.Object3D[] = [];
    private debrisSystem: DebrisSystem;
    private clock = new THREE.Clock();

    constructor(scene: THREE.Scene, debrisSystem: DebrisSystem) {
        this.scene = scene;
        this.debrisSystem = debrisSystem;
    }

    init() {
        const block = ObjectFactory.createBlueBlock();
        this.addObstacle(block);

        this.createTreeAt(new THREE.Vector2(-5, -4));
        this.createRockAt(new THREE.Vector2(2, 4), 1.0);

        const wolfPos = new THREE.Vector3(2.5, PlayerUtils.getTerrainHeight(2.5, 2.5), 2.5);
        const wolf = ObjectFactory.createDeadWolf(wolfPos, Math.PI / 3);
        this.scene.add(wolf.group);
        this.obstacles.push(wolf.obstacle);

        this.initPondDecorations();
        this.initBiomes();
        this.initWorldScatter();
        this.initMidLevelFillers();
        this.initStorytellingRemnants();
        this.initAtmosphericEffects();
    }

    private initBiomes() {
        // Golden Dunes
        const duneX = 40, duneZ = 0;
        for (let i = 0; i < 15; i++) {
            const x = duneX + (Math.random() - 0.5) * 35;
            const z = duneZ + (Math.random() - 0.5) * 35;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            const { group, trunk } = ObjectFactory.createCactus(pos, 0.8 + Math.random() * 0.6);
            this.scene.add(group);
            this.obstacles.push(trunk);
        }

        // Timber Wharf
        const wharfX = -40, wharfZ = 40;
        for (let i = 0; i < 6; i++) {
            const x = wharfX + (Math.random() - 0.5) * 30;
            const z = wharfZ + (Math.random() - 0.5) * 30;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            const { group, obstacle } = ObjectFactory.createLightpole(pos);
            group.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
            this.scene.add(group);
            this.obstacles.push(obstacle);
        }
        for (let i = 0; i < 10; i++) {
            const x = wharfX + (Math.random() - 0.5) * 35;
            const z = wharfZ + (Math.random() - 0.5) * 35;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            const { group, obstacle } = ObjectFactory.createBarrel(pos);
            this.scene.add(group);
            this.obstacles.push(obstacle);
        }

        // Frostfell Peaks
        const frostX = 0, frostZ = -40;
        for (let i = 0; i < 12; i++) {
            const x = frostX + (Math.random() - 0.5) * 35;
            const z = frostZ + (Math.random() - 0.5) * 35;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            const { group, trunk } = ObjectFactory.createPineTree(pos, 1.5 + Math.random());
            this.scene.add(group);
            this.obstacles.push(trunk);
        }

        // Autumnal Grove
        const autumnX = 40, autumnZ = -40;
        for (let i = 0; i < 14; i++) {
            const x = autumnX + (Math.random() - 0.5) * 35;
            const z = autumnZ + (Math.random() - 0.5) * 35;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            this.createAutumnTree(pos);
        }

        // Gravel Pass
        const gravelX = 40, gravelZ = 40;
        for (let i = 0; i < 10; i++) {
            const x = gravelX + (Math.random() - 0.5) * 35;
            const z = gravelZ + (Math.random() - 0.5) * 35;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            this.createDeadTree(pos);
        }

        // Industrial Foundry
        const foundryX = -40, foundryZ = -40;
        for (let i = 0; i < 12; i++) {
            const x = foundryX + (Math.random() - 0.5) * 35;
            const z = foundryZ + (Math.random() - 0.5) * 35;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            const { group, obstacle } = ObjectFactory.createTire(pos);
            group.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(group);
            this.obstacles.push(obstacle);
        }
        for (let i = 0; i < 8; i++) {
            const x = foundryX + (Math.random() - 0.5) * 35;
            const z = foundryZ + (Math.random() - 0.5) * 35;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            const { group, obstacle } = ObjectFactory.createCrate(pos);
            group.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
            this.scene.add(group);
            this.obstacles.push(obstacle);
        }
    }

    private initWorldScatter() {
        this.trees.forEach(tree => {
            const pos = tree.basePosition;
            for(let i=0; i<3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 0.5 + Math.random() * 1.5;
                const sx = pos.x + Math.cos(angle) * r;
                const sz = pos.z + Math.sin(angle) * r;
                const sy = PlayerUtils.getTerrainHeight(sx, sz);
                
                if (Math.random() > 0.4) {
                    const grass = ObjectFactory.createGrass(new THREE.Vector3(sx, sy, sz), 'short');
                    this.scene.add(grass);
                    this.decorativeItems.push(grass);
                }
                
                if (Math.random() > 0.7) {
                    const mush = ObjectFactory.createMushroom(new THREE.Vector3(sx, sy, sz));
                    this.scene.add(mush);
                    this.decorativeItems.push(mush);
                }
            }
        });

        this.rocks.forEach(rock => {
            const pos = rock.basePosition;
            for(let i=0; i<4; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 0.8 + Math.random() * 1.2;
                const sx = pos.x + Math.cos(angle) * r;
                const sz = pos.z + Math.sin(angle) * r;
                const sy = PlayerUtils.getTerrainHeight(sx, sz);
                
                const pebble = ObjectFactory.createPebble(new THREE.Vector3(sx, sy, sz));
                this.scene.add(pebble);
                this.decorativeItems.push(pebble);
            }
        });

        for(let i=0; i<40; i++) {
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            const y = PlayerUtils.getTerrainHeight(x, z);
            if (y > -0.1) {
                const grass = ObjectFactory.createGrass(new THREE.Vector3(x, y, z), Math.random() > 0.8 ? 'tall' : 'short');
                this.scene.add(grass);
                this.decorativeItems.push(grass);
            }
        }
    }

    private initMidLevelFillers() {
        this.trees.forEach(tree => {
            if (Math.random() > 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const r = 1.5 + Math.random() * 1.0;
                const x = tree.basePosition.x + Math.cos(angle) * r;
                const z = tree.basePosition.z + Math.sin(angle) * r;
                const y = PlayerUtils.getTerrainHeight(x, z);
                const bush = ObjectFactory.createBush(new THREE.Vector3(x, y, z), 0.8 + Math.random() * 0.4);
                this.scene.add(bush);
                this.decorativeItems.push(bush);
            }
            if (tree.basePosition.z < -10) {
                for(let i=0; i<2; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = 1.0 + Math.random() * 2.0;
                    const x = tree.basePosition.x + Math.cos(angle) * r;
                    const z = tree.basePosition.z + Math.sin(angle) * r;
                    const y = PlayerUtils.getTerrainHeight(x, z);
                    const fern = ObjectFactory.createFern(new THREE.Vector3(x, y, z));
                    this.scene.add(fern);
                    this.decorativeItems.push(fern);
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
            const y = PlayerUtils.getTerrainHeight(x, z);
            const reeds = ObjectFactory.createReeds(new THREE.Vector3(x, y, z));
            this.scene.add(reeds);
            this.decorativeItems.push(reeds);
        }
    }

    private initStorytellingRemnants() {
        const fireLocations = [
            new THREE.Vector3(-8, 0, 5),
            new THREE.Vector3(45, 0, -45)
        ];
        fireLocations.forEach(pos => {
            pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
            const fire = ObjectFactory.createCampfire(pos);
            this.scene.add(fire);
            this.decorativeItems.push(fire);
        });

        for (let i = 0; i < 5; i++) {
            const pos = new THREE.Vector3(-25, 0, 30 + i * 2);
            pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
            const fence = ObjectFactory.createFence(pos, Math.PI / 2);
            this.addObstacle(fence);
        }

        const foundryX = -40, foundryZ = -40;
        for (let i = 0; i < 4; i++) {
            const x = foundryX + (Math.random() - 0.5) * 20;
            const z = foundryZ + (Math.random() - 0.5) * 20;
            const pos = new THREE.Vector3(x, PlayerUtils.getTerrainHeight(x, z), z);
            const pallet = ObjectFactory.createPallet(pos);
            pallet.rotation.y = Math.random() * Math.PI;
            this.addObstacle(pallet);
        }

        const signLocs = [
            { pos: new THREE.Vector3(-15, 0, 0), type: 'yield' as const },
            { pos: new THREE.Vector3(-30, 0, -30), type: 'stop' as const }
        ];
        signLocs.forEach(cfg => {
            cfg.pos.y = PlayerUtils.getTerrainHeight(cfg.pos.x, cfg.pos.z);
            const sign = ObjectFactory.createRoadSign(cfg.pos, cfg.type);
            this.addObstacle(sign);
        });
    }

    private initAtmosphericEffects() {
        // 1. Hanging Moss on Trees
        this.trees.forEach(tree => {
            // Standard trees and Autumn trees get moss
            const isStandard = tree.group.name !== 'pine'; // Pine uses createPineTree which returns different structure
            if (isStandard && Math.random() > 0.4) {
                const count = 1 + Math.floor(Math.random() * 3);
                for(let i=0; i<count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = 1.0 + Math.random() * 0.8;
                    const h = 2.5 + Math.random() * 1.5;
                    const mossPos = new THREE.Vector3(Math.cos(angle)*r, h, Math.sin(angle)*r);
                    const moss = ObjectFactory.createHangingMoss(mossPos);
                    tree.group.add(moss);
                    this.decorativeItems.push(moss);
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
            pos.y = PlayerUtils.getTerrainHeight(pos.x, pos.z);
            const flies = ObjectFactory.createAtmosphericMotes(pos, 10, 0xaaff00);
            this.scene.add(flies);
            this.decorativeItems.push(flies);
        });

        // 3. Frost Glitter in Peaks
        const frostMotes = ObjectFactory.createAtmosphericMotes(new THREE.Vector3(0, 0, -40), 15, 0x00ffff);
        this.scene.add(frostMotes);
        this.decorativeItems.push(frostMotes);
    }

    private createTreeAt(xz: THREE.Vector2) {
        const y = PlayerUtils.getTerrainHeight(xz.x, xz.y);
        this.createTree(new THREE.Vector3(xz.x, y, xz.y));
    }

    private createRockAt(xz: THREE.Vector2, scale: number = 1.0) {
        const y = PlayerUtils.getTerrainHeight(xz.x, xz.y);
        this.createRock(new THREE.Vector3(xz.x, y, xz.y), scale);
    }

    private initPondDecorations() {
        const radius = ENV_CONSTANTS.POND_RADIUS;
        const centerX = ENV_CONSTANTS.POND_X;
        const centerZ = ENV_CONSTANTS.POND_Z;

        for (let i = 0; i < 18; i++) {
            const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            const r = radius + (Math.random() - 0.5) * 0.4;
            const x = centerX + Math.cos(angle) * r;
            const z = centerZ + Math.sin(angle) * r;
            const y = PlayerUtils.getTerrainHeight(x, z);
            const cattail = ObjectFactory.createCattail(new THREE.Vector3(x, y, z));
            this.scene.add(cattail);
            this.decorativeItems.push(cattail);
        }

        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * (radius - 1.0);
            const x = centerX + Math.cos(angle) * r;
            const z = centerZ + Math.sin(angle) * r;
            const pad = ObjectFactory.createLilyPad(new THREE.Vector3(x, 0, z));
            pad.rotation.z = Math.PI / 2; 
            this.scene.add(pad);
            this.decorativeItems.push(pad);
        }

        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const x = centerX + Math.cos(angle) * (radius + 0.2);
            const z = centerZ + Math.sin(angle) * (radius + 0.2);
            this.createRockAt(new THREE.Vector2(x, z), 0.3 + Math.random() * 0.4);
        }
    }

    addObstacle(obj: THREE.Object3D) {
        if (!obj.parent) {
            this.scene.add(obj);
        }
        this.obstacles.push(obj);
    }

    addLogs(logs: THREE.Mesh[]) {
        logs.forEach(log => {
            this.obstacles.push(log);
            const pos = log.position;
            for(let i=0; i<2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 0.3 + Math.random() * 0.4;
                const sx = pos.x + Math.cos(angle) * r;
                const sz = pos.z + Math.sin(angle) * r;
                const sy = PlayerUtils.getTerrainHeight(sx, sz);
                const mush = ObjectFactory.createMushroom(new THREE.Vector3(sx, sy, sz));
                this.scene.add(mush);
                this.decorativeItems.push(mush);
            }
        });
    }

    private createRock(position: THREE.Vector3, scale: number = 1.0) {
        const { group, rock } = ObjectFactory.createRock(position, scale);
        this.scene.add(group);
        this.obstacles.push(rock);
        this.rocks.set(rock.uuid, {
            id: rock.uuid, mesh: rock, health: 10, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createTree(position: THREE.Vector3) {
        const { group, trunk, leaves } = ObjectFactory.createTree(position);
        this.scene.add(group);
        this.obstacles.push(trunk);
        this.trees.set(trunk.uuid, {
            id: trunk.uuid, group: group, trunk: trunk, leaves: leaves, health: 8, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createAutumnTree(position: THREE.Vector3) {
        const { group, trunk, leaves } = ObjectFactory.createAutumnTree(position);
        this.scene.add(group);
        this.obstacles.push(trunk);
        this.trees.set(trunk.uuid, {
            id: trunk.uuid, group: group, trunk: trunk, leaves: leaves, health: 8, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createDeadTree(position: THREE.Vector3) {
        const { group, obstacle } = ObjectFactory.createDeadTree(position);
        this.scene.add(group);
        this.obstacles.push(obstacle);
        this.trees.set(obstacle.uuid, {
            id: obstacle.uuid, group: group, trunk: obstacle as any, leaves: undefined as any, health: 4, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    // Fixed: Added missing damageObstacle method
    damageObstacle(object: THREE.Object3D, amount: number): string | null {
        let tree = this.trees.get(object.uuid);
        if (tree) {
            tree.health -= amount;
            tree.shudderTimer = 0.3;
            if (tree.health <= 0) {
                this.obstacles = this.obstacles.filter(o => o.uuid !== object.uuid);
                this.trees.delete(object.uuid);
                const trunkMat = (tree.trunk as any).children[0].material;
                const fallingGroup = ObjectFactory.createFallingTrunk(tree.basePosition, trunkMat);
                this.scene.remove(tree.group);
                this.debrisSystem.addFallingTree(fallingGroup);
                const stump = ObjectFactory.createStump(tree.basePosition, tree.group.quaternion, trunkMat);
                this.scene.add(stump);
                this.obstacles.push(stump);
            }
            return 'wood';
        }
        let rock = this.rocks.get(object.uuid);
        if (rock) {
            rock.health -= amount;
            rock.shudderTimer = 0.2;
            const worldPos = new THREE.Vector3();
            rock.mesh.getWorldPosition(worldPos);
            this.debrisSystem.spawnRockDebris(worldPos, rock.mesh.material as THREE.Material);
            if (rock.health <= 0) {
                this.obstacles = this.obstacles.filter(o => o.uuid !== object.uuid);
                this.rocks.delete(object.uuid);
                this.scene.remove(rock.mesh.parent || rock.mesh);
            }
            return 'stone';
        }
        return null;
    }

    // Fixed: Completed the update method and fixed truncated lines
    update(dt: number) {
        const time = this.clock.getElapsedTime();
        const water = this.scene.getObjectByName('pond_water');
        if (water && (water as THREE.Mesh).material instanceof THREE.ShaderMaterial) {
            ((water as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uTime.value = time;
        }

        this.decorativeItems.forEach(item => {
            if (item instanceof THREE.Group) {
                item.children.forEach(child => {
                    if (child.userData.isMote) {
                        const mPhase = child.userData.phase;
                        const mSpeed = child.userData.speed;
                        const originY = child.userData.originY;
                        child.position.y = originY + Math.sin(time * mSpeed + mPhase) * 0.5;
                        child.position.x += Math.sin(time * 0.5 + mPhase) * 0.005;
                    }
                });
            } else {
                const phase = item.userData.phase || 0;
                item.rotation.z = Math.sin(time * 1.5 + phase) * 0.05;
            }
        });

        this.trees.forEach(tree => {
            if (tree.shudderTimer > 0) {
                tree.shudderTimer -= dt;
                const s = Math.sin(tree.shudderTimer * 50) * 0.05;
                tree.group.position.x = tree.basePosition.x + s;
                if (tree.shudderTimer <= 0) tree.group.position.copy(tree.basePosition);
            }
        });

        this.rocks.forEach(rock => {
            if (rock.shudderTimer > 0) {
                rock.shudderTimer -= dt;
                const s = Math.sin(rock.shudderTimer * 60) * 0.03;
                rock.mesh.position.x = s;
                if (rock.shudderTimer <= 0) rock.mesh.position.set(0, rock.mesh.position.y, 0);
            }
        });
    }
}
