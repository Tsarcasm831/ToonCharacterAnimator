import * as THREE from 'three';
import { Door } from './objects/Door';

export class DoorManager {
    private doors: Door[] = [];

    constructor() {
        // Initialize door manager
    }

    public addDoor(door: Door): void {
        this.doors.push(door);
    }

    public removeDoor(door: Door): void {
        const index = this.doors.indexOf(door);
        if (index > -1) {
            this.doors.splice(index, 1);
        }
    }

    public update(dt: number): void {
        // Update all door animations
        for (const door of this.doors) {
            door.update(dt);
        }
    }

    public getDoorObjects(): THREE.Object3D[] {
        const objects: THREE.Object3D[] = [];
        for (const door of this.doors) {
            objects.push(...door.getObstacleObjects());
        }
        return objects;
    }

    public findDoorAtPosition(position: THREE.Vector3, range: number = 2.0): Door | null {
        for (const door of this.doors) {
            if (door.isPlayerInRange(position, range)) {
                return door;
            }
        }
        return null;
    }

    public dispose(): void {
        // Clean up all doors
        for (const door of this.doors) {
            // Remove from parent scene if present
            if (door.mesh.parent) {
                door.mesh.parent.remove(door.mesh);
            }
            
            // Dispose geometries and materials
            door.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    } else if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    }
                }
            });
        }
        
        this.doors = [];
    }
}
