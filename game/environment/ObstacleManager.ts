
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
        this.scene.add(obj);
        this.obstacles.push(obj);
    }

    addLogs(logs: THREE.Mesh[]) {
        logs.forEach(log => this.obstacles.push(log));
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
        // Map dead wood as choppable tree
        this.trees.set(obstacle.uuid, {
            id: obstacle.uuid, group: group, trunk: obstacle as any, leaves: undefined as any, health: 4, shudderTimer: 0, basePosition: group.position.clone()
        });
    }

    update(dt: number) {
        const time = this.clock.getElapsedTime();
        const water = this.scene.getObjectByName('pond_water');
        // Fix: Cast material to THREE.ShaderMaterial to resolve TypeScript error when accessing uniforms
        if (water && (water as THREE.Mesh).material instanceof THREE.ShaderMaterial) {
            ((water as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uTime.value = time;
        }

        this.decorativeItems.forEach(item => {
            const phase = item.userData.phase || 0;
            if (item instanceof THREE.Group && item.name !== 'foliage') {
                const sway = Math.sin(time * 0.6 + phase) * 0.04;
                item.rotation.x = sway;
                item.rotation.z = sway * 0.5;
            }
            if (item instanceof THREE.Mesh && item.geometry instanceof THREE.ShapeGeometry) {
                item.position.y = -0.38 + Math.sin(time * 1.5 + phase) * 0.01;
            }
        });

        this.trees.forEach(tree => {
            if (tree.leaves) {
                tree.leaves.children.forEach((child: any) => {
                    if (child.isMesh && child.userData.initialY !== undefined) {
                        const phase = child.userData.phase || 0;
                        child.rotation.x = Math.sin(time * 0.8 + phase) * 0.05;
                        child.rotation.z = Math.cos(time * 0.5 + phase) * 0.05;
                    }
                });
            }
            if (tree.shudderTimer > 0) {
                tree.shudderTimer -= dt;
                const intensity = tree.shudderTimer > 0 ? 0.1 * (tree.shudderTimer / 0.3) : 0;
                tree.group.position.set(
                    tree.basePosition.x + (Math.random() - 0.5) * intensity,
                    tree.basePosition.y,
                    tree.basePosition.z + (Math.random() - 0.5) * intensity
                );
            }
        });

        this.rocks.forEach(rock => {
            if (rock.shudderTimer > 0) {
                rock.shudderTimer -= dt;
                const intensity = rock.shudderTimer > 0 ? 0.05 * (rock.shudderTimer / 0.2) : 0;
                const shakeX = (Math.random() - 0.5) * intensity;
                const shakeZ = (Math.random() - 0.5) * intensity;
                const target = rock.mesh.parent instanceof THREE.Group ? rock.mesh.parent : rock.mesh;
                target.position.set(rock.basePosition.x + shakeX, rock.basePosition.y, rock.basePosition.z + shakeZ);
            }
        });
    }

    damageObstacle(object: THREE.Object3D, amount: number): string | null {
        const tree = this.trees.get(object.uuid);
        if (tree) {
            tree.health -= amount;
            tree.shudderTimer = 0.3;
            if (tree.health <= 0) this.cutDownTree(tree);
            return 'wood';
        }
        const rock = this.rocks.get(object.uuid);
        if (rock) {
            rock.health -= amount;
            rock.shudderTimer = 0.2;
            if (rock.health <= 0) this.shatterRock(rock);
            return 'stone';
        }
        return object.userData.material || null;
    }

    private shatterRock(rock: RockData) {
        this.obstacles = this.obstacles.filter(o => o !== rock.mesh);
        this.rocks.delete(rock.id);
        if (rock.mesh.parent instanceof THREE.Group) this.scene.remove(rock.mesh.parent);
        else this.scene.remove(rock.mesh);
        this.debrisSystem.spawnRockDebris(rock.basePosition, rock.mesh.material as THREE.Material);
    }

    private cutDownTree(tree: TreeData) {
        this.obstacles = this.obstacles.filter(o => o !== tree.trunk);
        this.trees.delete(tree.trunk.uuid);
        tree.group.visible = false;
        
        const trunkPos = new THREE.Vector3();
        tree.trunk.getWorldPosition(trunkPos);
        
        // Find material safely (trunk could be Mesh or Group)
        let mat: THREE.Material | undefined;
        if ((tree.trunk as any).material) {
            mat = (tree.trunk as any).material;
        } else if (tree.trunk.children.length > 0 && (tree.trunk.children[0] as any).material) {
            mat = (tree.trunk.children[0] as any).material;
        }
        
        if (!mat) {
             mat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        }

        const stump = ObjectFactory.createStump(trunkPos, tree.trunk.quaternion, mat);
        this.addObstacle(stump);
        
        const fallGroup = ObjectFactory.createFallingTrunk(trunkPos, mat);
        if (tree.leaves) {
            const fallingFoliage = tree.leaves.clone();
            fallingFoliage.position.y = 1.75;
            fallGroup.add(fallingFoliage);
        }
        this.debrisSystem.addFallingTree(fallGroup);
    }
}
