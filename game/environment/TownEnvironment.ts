import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { LevelGenerator } from '../builder/LevelGenerator';
import { ObjectFactory } from './ObjectFactory';
import { LightingManager } from './LightingManager';
import { WorldGridManager } from './WorldGridManager';

export class TownEnvironment {
    public group: THREE.Group;
    private scene: THREE.Scene;
    public obstacles: THREE.Object3D[] = [];
    private ground: THREE.Mesh | null = null;
    private arenaGround: THREE.Mesh | null = null;
    private lightingManager: LightingManager;
    private worldGrid: WorldGridManager;
    private isBuilt = false;

    // Square bounds are enforced via PlayerUtils custom polygon (set by SceneManager)
    private readonly SIZE = 100; // 100x100 grid
    private readonly ARENA_SIZE = 100; // Second 100x100 grid for arena
    
    // Arena configuration
    private readonly ARENA_RADIUS = 20; // From ArenaBuilder config
    private readonly ARENA_CENTER = new THREE.Vector3(100, 0, 0); // Center of arena grid
    private readonly ARENA_FLOOR_HEIGHT = 0.1; // From ArenaBuilder createFloor()

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.visible = true;
        this.scene.add(this.group);
        this.lightingManager = new LightingManager(this.scene);
        const halfSize = this.SIZE / 2;
        const totalWidth = this.SIZE + this.ARENA_SIZE;
        const halfTotalWidth = totalWidth / 2;
        this.worldGrid = new WorldGridManager(this.group, {
            bounds: { minX: -halfSize, maxX: halfSize + this.ARENA_SIZE, minZ: -halfSize, maxZ: halfSize },
        });

        this.buildGround();
        this.buildTown();
    }

    private buildGround() {
        // Main town ground (left grid)
        const geometry = new THREE.PlaneGeometry(this.SIZE, this.SIZE, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.05 });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        plane.userData = { type: 'ground' };

        this.group.add(plane);
        this.obstacles.push(plane);
        this.ground = plane;

        // Arena ground (right grid) - positioned directly next to the main grid
        const arenaGeometry = new THREE.PlaneGeometry(this.ARENA_SIZE, this.ARENA_SIZE, 1, 1);
        const arenaMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9, metalness: 0.05 });
        const arenaPlane = new THREE.Mesh(arenaGeometry, arenaMaterial);
        arenaPlane.rotation.x = -Math.PI / 2;
        arenaPlane.position.set(this.SIZE, 0, 0); // Position to the right of main grid (starts at X=50)
        arenaPlane.receiveShadow = true;
        arenaPlane.userData = { type: 'ground' };

        this.group.add(arenaPlane);
        this.obstacles.push(arenaPlane);
        this.arenaGround = arenaPlane;
    }

    private buildTown() {
        if (this.isBuilt) return;
        this.isBuilt = true;

        LevelGenerator.buildTownLevel(this);

        const forgePos = new THREE.Vector3(14, 0, -6);
        const { group: forgeGroup, obstacles: forgeObstacles } = ObjectFactory.createForge(forgePos, Math.PI / 2);
        this.group.add(forgeGroup);
        forgeObstacles.forEach(obstacle => this.addObstacle(obstacle));

        const { group: barrelGroup, obstacle: barrelObstacle } = ObjectFactory.createBarrel(new THREE.Vector3(-6, 0, -12));
        this.group.add(barrelGroup);
        this.addObstacle(barrelObstacle);

        const { group: crateGroup, obstacle: crateObstacle } = ObjectFactory.createCrate(new THREE.Vector3(-4, 0, -11));
        this.group.add(crateGroup);
        this.addObstacle(crateObstacle);

        const { group: lightpoleGroup, obstacle: lightpoleObstacle } = ObjectFactory.createLightpole(new THREE.Vector3(4, 0, 6));
        this.group.add(lightpoleGroup);
        this.addObstacle(lightpoleObstacle);

        const wallA = ObjectFactory.createWall(new THREE.Vector3(-22, 0, 0), Math.PI / 2);
        this.group.add(wallA.group);
        this.addObstacle(wallA.obstacle);

        const wallB = ObjectFactory.createWall(new THREE.Vector3(22, 0, 0), Math.PI / 2);
        this.group.add(wallB.group);
        this.addObstacle(wallB.obstacle);
    }

    setVisible(visible: boolean) {
        this.group.visible = visible;
    }

    dispose() {
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }

        this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        this.ground = null;
        this.obstacles = [];
        this.lightingManager.dispose();
        this.worldGrid.dispose();
    }

    addObstacle(obj: THREE.Object3D) {
        if (!obj.parent) {
            this.group.add(obj);
        }
        this.obstacles.push(obj);
    }

    toggleWorldGrid(visible?: boolean) {
        if (typeof visible === 'boolean') {
            this.worldGrid.setVisible(visible);
            return;
        }
        this.worldGrid.toggle();
    }

    getBiomeAt(_pos: THREE.Vector3): { name: string; color: string } {
        return { name: 'Town', color: '#9e9e9e' };
    }

    /**
     * Check if a position is within the arena boundary
     */
    public isPositionInArena(pos: THREE.Vector3): boolean {
        const dx = pos.x - this.ARENA_CENTER.x;
        const dz = pos.z - this.ARENA_CENTER.z;
        const distanceSquared = dx * dx + dz * dz;
        return distanceSquared <= (this.ARENA_RADIUS * this.ARENA_RADIUS);
    }

    /**
     * Get the appropriate ground height for a position
     * Returns arena floor height if within arena, otherwise normal ground height
     */
    public getGroundHeightAt(pos: THREE.Vector3): number {
        if (this.isPositionInArena(pos)) {
            return this.ARENA_FLOOR_HEIGHT;
        }
        return 0; // Normal ground level
    }

    damageObstacle(_object: THREE.Object3D, _amount: number): string | null {
        // No destructible obstacles in the empty town scene
        return null;
    }

    update(_dt: number, _config: PlayerConfig, _playerPosition: THREE.Vector3) {
        this.lightingManager.update(_dt, _config);
        this.worldGrid.update(_playerPosition);
    }
}
