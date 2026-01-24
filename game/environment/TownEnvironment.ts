import * as THREE from 'three';
import { PlayerConfig } from '../../types';

export class TownEnvironment {
    public group: THREE.Group;
    private scene: THREE.Scene;
    public obstacles: THREE.Object3D[] = [];
    private gridHelper: THREE.GridHelper | null = null;
    private ground: THREE.Mesh | null = null;

    // Square bounds are enforced via PlayerUtils custom polygon (set by SceneManager)
    private readonly SIZE = 100; // 100x100 grid

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.visible = false;
        this.scene.add(this.group);

        this.buildGround();
        this.buildGrid();
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

    private buildGrid() {
        const grid = new THREE.GridHelper(this.SIZE, this.SIZE, 0x666666, 0x444444);
        grid.position.y = 0.01; // Slightly above ground to avoid z-fighting
        grid.visible = false; // Toggled by toggleWorldGrid
        this.group.add(grid);
        this.gridHelper = grid;
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

        this.gridHelper = null;
        this.ground = null;
        this.obstacles = [];
    }

    addObstacle(obj: THREE.Object3D) {
        if (!obj.parent) {
            this.group.add(obj);
        }
        this.obstacles.push(obj);
    }

    toggleWorldGrid(visible?: boolean) {
        if (!this.gridHelper) return;
        if (typeof visible === 'boolean') {
            this.gridHelper.visible = visible;
            return;
        }
        this.gridHelper.visible = !this.gridHelper.visible;
    }

    getBiomeAt(_pos: THREE.Vector3): { name: string; color: string } {
        return { name: 'Town', color: '#9e9e9e' };
    }

    damageObstacle(_object: THREE.Object3D, _amount: number): string | null {
        // No destructible obstacles in the empty town scene
        return null;
    }

    update(_dt: number, _config: PlayerConfig, _playerPosition: THREE.Vector3) {
        // No dynamic systems for the empty town scene yet
    }
}
