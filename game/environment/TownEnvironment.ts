import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { LightingManager } from './LightingManager';
import { WorldGridManager } from './WorldGridManager';

export class TownEnvironment {
    public group: THREE.Group;
    private scene: THREE.Scene;
    public obstacles: THREE.Object3D[] = [];
    private ground: THREE.Mesh | null = null;
    private lightingManager: LightingManager;
    private worldGrid: WorldGridManager;

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
