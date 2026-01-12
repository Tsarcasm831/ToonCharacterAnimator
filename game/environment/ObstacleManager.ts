import * as THREE from 'three';
import { TreeData, RockData } from './EnvironmentTypes';
import { ObjectFactory } from './ObjectFactory';
import { DebrisSystem } from './DebrisSystem';
import { PlayerUtils } from '../player/PlayerUtils';
import {
    ObstacleInitContext,
    initAtmosphericEffects,
    initBiomes,
    initMidLevelFillers,
    initPondDecorations,
    initStorytellingRemnants,
    initWorldScatter
} from './obstacles/ObstaclePopulation';

export class ObstacleManager {
    obstacles: THREE.Object3D[] = [];
    private parent: THREE.Object3D;
    private trees: Map<string, TreeData> = new Map();
    private rocks: Map<string, RockData> = new Map();
    private decorativeItems: THREE.Object3D[] = [];
    private debrisSystem: DebrisSystem;
    private clock = new THREE.Clock();

    constructor(parent: THREE.Object3D, debrisSystem: DebrisSystem) {
        this.parent = parent;
        this.debrisSystem = debrisSystem;
    }

    init() {
        const block = ObjectFactory.createBlueBlock();
        this.addObstacle(block);

        this.createTreeAt(new THREE.Vector2(-5, -4));
        this.createRockAt(new THREE.Vector2(2, 4), 1.0);

        const wolfPos = new THREE.Vector3(2.5, PlayerUtils.getTerrainHeight(2.5, 2.5), 2.5);
        const wolf = ObjectFactory.createDeadWolf(wolfPos, Math.PI / 3);
        this.parent.add(wolf.group);
        this.obstacles.push(wolf.obstacle);

        const initContext: ObstacleInitContext = {
            scene: this.parent as THREE.Scene, // This cast is a bit hacky but works since Scene is Object3D
            obstacles: this.obstacles,
            trees: this.trees,
            rocks: this.rocks,
            decorativeItems: this.decorativeItems,
            addObstacle: this.addObstacle.bind(this),
            createAutumnTree: this.createAutumnTree.bind(this),
            createDeadTree: this.createDeadTree.bind(this),
            createRockAt: this.createRockAt.bind(this)
        };
        initPondDecorations(initContext);
        initBiomes(initContext);
        initWorldScatter(initContext);
        initMidLevelFillers(initContext);
        initStorytellingRemnants(initContext);
        initAtmosphericEffects(initContext);
    }

    private createTreeAt(xz: THREE.Vector2) {
        const y = PlayerUtils.getTerrainHeight(xz.x, xz.y);
        this.createTree(new THREE.Vector3(xz.x, y, xz.y));
    }

    private createRockAt(xz: THREE.Vector2, scale: number = 1.0) {
        const y = PlayerUtils.getTerrainHeight(xz.x, xz.y);
        this.createRock(new THREE.Vector3(xz.x, y, xz.y), scale);
    }


    addObstacle(obj: THREE.Object3D) {
        if (!obj.parent) {
            this.parent.add(obj);
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
                this.parent.add(mush);
                this.decorativeItems.push(mush);
            }
        });
    }

    private createRock(position: THREE.Vector3, scale: number = 1.0) {
        const { group, rock } = ObjectFactory.createRock(position, scale);
        this.parent.add(group);
        this.obstacles.push(rock);
        this.rocks.set(rock.uuid, {
            id: rock.uuid, mesh: rock, health: 10, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createTree(position: THREE.Vector3) {
        const { group, trunk, leaves } = ObjectFactory.createTree(position);
        this.parent.add(group);
        this.obstacles.push(trunk);
        this.trees.set(trunk.uuid, {
            id: trunk.uuid, group: group, trunk: trunk, leaves: leaves, health: 8, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createAutumnTree(position: THREE.Vector3) {
        const { group, trunk, leaves } = ObjectFactory.createAutumnTree(position);
        this.parent.add(group);
        this.obstacles.push(trunk);
        this.trees.set(trunk.uuid, {
            id: trunk.uuid, group: group, trunk: trunk, leaves: leaves, health: 8, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createDeadTree(position: THREE.Vector3) {
        const { group, obstacle } = ObjectFactory.createDeadTree(position);
        this.parent.add(group);
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
                this.parent.remove(tree.group);
                this.debrisSystem.addFallingTree(fallingGroup);
                const stump = ObjectFactory.createStump(tree.basePosition, tree.group.quaternion, trunkMat);
                this.parent.add(stump);
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
                this.parent.remove(rock.mesh.parent || rock.mesh);
            }
            return 'stone';
        }
        return null;
    }

    // Fixed: Completed the update method and fixed truncated lines
    update(dt: number) {
        const time = this.clock.getElapsedTime();
        const water = this.parent.getObjectByName('pond_water');
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
