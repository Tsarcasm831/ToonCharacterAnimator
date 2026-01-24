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
    private lightingManager: LightingManager;
    private worldGrid: WorldGridManager;
    private isBuilt = false;

    // Square bounds are enforced via PlayerUtils custom polygon (set by SceneManager)
    private readonly SIZE = 100; // 100x100 grid

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.visible = true;
        this.scene.add(this.group);
        this.lightingManager = new LightingManager(this.scene);
        const halfSize = this.SIZE / 2;
        this.worldGrid = new WorldGridManager(this.group, {
            bounds: { minX: -halfSize, maxX: halfSize, minZ: -halfSize, maxZ: halfSize },
        });

        this.buildGround();
        this.buildTown();
    }

    private buildGround() {
        const geometry = new THREE.PlaneGeometry(this.SIZE, this.SIZE, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.05 });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        plane.userData = { type: 'ground' };

        this.group.add(plane);
        this.obstacles.push(plane);
        this.ground = plane;
    }

    private buildTown() {
        if (this.isBuilt) return;
        this.isBuilt = true;

        LevelGenerator.buildTownLevel(this);

        const forgePos = new THREE.Vector3(14, 0, -6);
        const { group: forgeGroup, obstacles: forgeObstacles } = ObjectFactory.createForge(forgePos, Math.PI / 2);
        this.group.add(forgeGroup);
        forgeObstacles.forEach(obstacle => this.addObstacle(obstacle));

        const barrel = ObjectFactory.createBarrel(new THREE.Vector3(-6, 0, -12));
        this.group.add(barrel);
        this.addObstacle(barrel);

        const crate = ObjectFactory.createCrate(new THREE.Vector3(-4, 0, -11));
        this.group.add(crate);
        this.addObstacle(crate);

        const lightpole = ObjectFactory.createLightpole(new THREE.Vector3(4, 0, 6));
        this.group.add(lightpole);
        this.addObstacle(lightpole);

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

    damageObstacle(_object: THREE.Object3D, _amount: number): string | null {
        // No destructible obstacles in the empty town scene
        return null;
    }

    update(_dt: number, _config: PlayerConfig, _playerPosition: THREE.Vector3) {
        this.lightingManager.update(_dt, _config);
        this.worldGrid.update(_playerPosition);
    }
}
