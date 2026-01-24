
import * as THREE from 'three';
import { TreeData, RockData, ENV_CONSTANTS } from './EnvironmentTypes';
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

interface CollectibleLog {
    mesh: THREE.Mesh;
    timer: number;
    maxTime: number;
    isCollected: boolean;
}

export class ObstacleManager {
    obstacles: THREE.Object3D[] = [];
    private parent: THREE.Object3D;
    private trees: Map<string, TreeData> = new Map();
    private rocks: Map<string, RockData> = new Map();
    private decorativeItems: THREE.Object3D[] = [];
    private debrisSystem: DebrisSystem;
    private clock = new THREE.Clock();

    private collectibleLogs: CollectibleLog[] = [];
    public onLogPickedUp?: () => void;

    constructor(parent: THREE.Object3D, debrisSystem: DebrisSystem) {
        this.parent = parent;
        this.debrisSystem = debrisSystem;
    }

    init() {
        void this.initAsync();
    }

    async initAsync(batchSize: number = 20) {
        const yieldFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const shouldYield = batchSize > 0;
        const block = ObjectFactory.createBlueBlock();
        this.addObstacle(block);

        // --- BLACKSMITH FORGE ---
        const forgePos = new THREE.Vector3(-30.2, 0, 51.5);
        const { group: forgeGroup, obstacles: forgeObs } = ObjectFactory.createForge(forgePos, -Math.PI / 2);
        this.parent.add(forgeGroup);
        this.decorativeItems.push(forgeGroup);
        forgeObs.forEach(o => this.addObstacle(o));

        this.createTreeAt(new THREE.Vector2(-5, -4));
        this.createRockAt(new THREE.Vector2(2, 4), 1.0);

        this.createBerryBushAt(new THREE.Vector2(3, 2));
        this.createBerryBushAt(new THREE.Vector2(-4, 3));

        const wolfPos = new THREE.Vector3(2.5, PlayerUtils.getTerrainHeight(2.5, 2.5), 2.5);
        const wolf = ObjectFactory.createDeadWolf(wolfPos, Math.PI / 3);
        this.parent.add(wolf.group);
        this.obstacles.push(wolf.obstacle);

        const initContext: ObstacleInitContext = {
            scene: this.parent as THREE.Scene,
            obstacles: this.obstacles,
            trees: this.trees,
            rocks: this.rocks,
            decorativeItems: this.decorativeItems,
            addObstacle: this.addObstacle.bind(this),
            createAutumnTree: this.createAutumnTree.bind(this),
            createDeadTree: this.createDeadTree.bind(this),
            createRockAt: this.createRockAt.bind(this)
        };
        if (shouldYield) await yieldFrame();
        await initPondDecorations(initContext, { yieldEvery: batchSize, yieldFrame });
        if (shouldYield) await yieldFrame();
        await initBiomes(initContext, { yieldEvery: batchSize, yieldFrame });
        if (shouldYield) await yieldFrame();
        await initWorldScatter(initContext, { yieldEvery: batchSize, yieldFrame });
        if (shouldYield) await yieldFrame();
        await initMidLevelFillers(initContext, { yieldEvery: batchSize, yieldFrame });
        if (shouldYield) await yieldFrame();
        await initStorytellingRemnants(initContext, { yieldEvery: batchSize, yieldFrame });
        if (shouldYield) await yieldFrame();
        await initAtmosphericEffects(initContext, { yieldEvery: batchSize, yieldFrame });
    }

    private createTreeAt(xz: THREE.Vector2) {
        const y = PlayerUtils.getTerrainHeight(xz.x, xz.y);
        this.createTree(new THREE.Vector3(xz.x, y, xz.y));
    }

    private createRockAt(xz: THREE.Vector2, scale: number = 1.0) {
        const y = PlayerUtils.getTerrainHeight(xz.x, xz.y);
        if (Math.random() < 0.2) {
            this.createCopperOreRock(new THREE.Vector3(xz.x, y, xz.y), scale);
        } else {
            this.createRock(new THREE.Vector3(xz.x, y, xz.y), scale);
        }
    }

    private createBerryBushAt(xz: THREE.Vector2, scale: number = 1.0) {
        const y = PlayerUtils.getTerrainHeight(xz.x, xz.y);
        const adjustedY = y + 0.05;
        const berryBush = ObjectFactory.createBerryBush(new THREE.Vector3(xz.x, adjustedY, xz.y), scale);
        if (berryBush) {
            this.parent.add(berryBush);
            this.decorativeItems.push(berryBush);
        } else {
            console.error("ObstacleManager: Failed to create berry bush at", xz);
        }
    }

    addObstacle(obj: THREE.Object3D) {
        if (!obj) {
            console.error("ObstacleManager: Attempted to add undefined obstacle");
            return;
        }
        if (!obj.parent) {
            this.parent.add(obj);
        }
        this.obstacles.push(obj);
    }

    addLogs(logs: THREE.Mesh[]) {
        logs.forEach(log => {
            this.collectibleLogs.push({
                mesh: log,
                timer: 2.0,
                maxTime: 2.0,
                isCollected: false
            });
            
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
        const result = ObjectFactory.createRock(position, scale);
        if (!result || !result.group || !result.rock) {
            console.error("ObstacleManager: Failed to create rock at", position, result);
            return;
        }
        const { group, rock } = result;
        this.parent.add(group);
        this.obstacles.push(rock);
        this.rocks.set(rock.uuid, {
            id: rock.uuid, mesh: rock, health: 10, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createCopperOreRock(position: THREE.Vector3, scale: number = 1.0) {
        const result = ObjectFactory.createCopperOreRock(position, scale);
        if (!result || !result.group || !result.rock) {
            console.error("ObstacleManager: Failed to create copper ore at", position, result);
            return;
        }
        const { group, rock } = result;
        this.parent.add(group);
        this.obstacles.push(rock);
        this.rocks.set(rock.uuid, {
            id: rock.uuid, mesh: rock, health: 15, shudderTimer: 0, basePosition: group.position.clone(), hasOre: true, oreType: 'copper'
        });
    }

    private createTree(position: THREE.Vector3) {
        const result = ObjectFactory.createTree(position);
        if (!result || !result.group || !result.trunk) {
            console.error("ObstacleManager: Failed to create tree at", position, result);
            return;
        }
        const { group, trunk, leaves } = result;
        this.parent.add(group);
        this.obstacles.push(trunk);
        this.trees.set(trunk.uuid, {
            id: trunk.uuid, group: group, trunk: trunk, leaves: leaves, health: 8, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createAutumnTree(position: THREE.Vector3) {
        const result = ObjectFactory.createAutumnTree(position);
        if (!result || !result.group || !result.trunk) {
            console.error("ObstacleManager: Failed to create autumn tree at", position, result);
            return;
        }
        const { group, trunk, leaves } = result;
        this.parent.add(group);
        this.obstacles.push(trunk);
        this.trees.set(trunk.uuid, {
            id: trunk.uuid, group: group, trunk: trunk, leaves: leaves, health: 8, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    private createDeadTree(position: THREE.Vector3) {
        const result = ObjectFactory.createDeadTree(position);
        if (!result || !result.group || !result.obstacle) {
            console.error("ObstacleManager: Failed to create dead tree at", position, result);
            return;
        }
        const { group, obstacle } = result;
        this.parent.add(group);
        this.obstacles.push(obstacle);
        this.trees.set(obstacle.uuid, {
            id: obstacle.uuid, group: group, trunk: obstacle as any, leaves: undefined as any, health: 4, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

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

    update(dt: number) {
        const time = this.clock.getElapsedTime();
        const water = this.parent.getObjectByName('pond_water');
        if (water && (water as THREE.Mesh).material instanceof THREE.ShaderMaterial) {
            ((water as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uTime.value = time;
        }

        for (let i = this.collectibleLogs.length - 1; i >= 0; i--) {
            const log = this.collectibleLogs[i];
            log.timer -= dt;

            if (log.timer < 0.3) {
                const s = Math.max(0, log.timer / 0.3);
                log.mesh.scale.set(s, s, s);
            }

            if (log.timer <= 0) {
                this.parent.remove(log.mesh);
                this.onLogPickedUp?.();
                this.collectibleLogs.splice(i, 1);
            }
        }

        this.decorativeItems.forEach(item => {
            // Optimization: Skip InstancedMesh objects, they shouldn't be globally rotated 
            // from origin (0,0,0) as it creates floating bugs for distant objects.
            if (item instanceof THREE.InstancedMesh) return;

            if (item instanceof THREE.Group) {
                if (item.userData.type === 'berryBush') {
                    const berryBushInstance = item.userData.berryBushInstance;
                    if (berryBushInstance && berryBushInstance.update) {
                        berryBushInstance.update(dt);
                    }
                } else {
                    item.children.forEach(child => {
                        if (child.userData.isMote) {
                            const mPhase = child.userData.phase;
                            const mSpeed = child.userData.speed;
                            const originY = child.userData.originY;
                            child.position.y = originY + Math.sin(time * mSpeed + mPhase) * 0.5;
                            child.position.x += Math.sin(time * 0.5 + mPhase) * 0.005;
                        } else if (child.userData.isFlame) {
                            const fPhase = child.userData.phase;
                            const bScale = child.userData.baseScale;
                            const bY = child.userData.baseY;
                            const flicker = Math.sin(time * 15.0 + fPhase);
                            const s = bScale * (1.0 + flicker * 0.15);
                            child.scale.set(s, s * (1.8 + flicker * 0.2), s);
                            child.position.y = bY + flicker * 0.02;
                            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                                child.material.emissiveIntensity = 2.0 + flicker * 0.8;
                            }
                        } else if (child.userData.isFlameLight) {
                            const lPhase = child.userData.phase;
                            if (child instanceof THREE.Light) {
                                child.intensity = 1.5 + Math.sin(time * 12.0 + lPhase) * 0.5;
                            }
                        }
                    });
                }
            } else {
                // Only apply swaying rotation to objects that have a specific phase
                if (item.userData.phase !== undefined) {
                    const phase = item.userData.phase || 0;
                    item.rotation.z = Math.sin(time * 1.5 + phase) * 0.05;
                }
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

    dispose() {
        this.decorativeItems.forEach(item => {
            this.parent.remove(item);
            item.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.trees.forEach(tree => {
            this.parent.remove(tree.group);
            tree.group.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.rocks.forEach(rock => {
            this.parent.remove(rock.mesh.parent || rock.mesh);
            const target = rock.mesh.parent || rock.mesh;
            target.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.collectibleLogs.forEach(log => {
            this.parent.remove(log.mesh);
            log.mesh.geometry.dispose();
            if (Array.isArray(log.mesh.material)) {
                log.mesh.material.forEach(m => m.dispose());
            } else {
                log.mesh.material.dispose();
            }
        });

        this.obstacles = [];
        this.trees.clear();
        this.rocks.clear();
        this.decorativeItems = [];
        this.collectibleLogs = [];
    }
}
