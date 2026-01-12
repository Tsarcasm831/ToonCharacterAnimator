
import * as THREE from 'three';
import { BuildingParts, StructureType } from './BuildingParts';
import { Environment } from '../Environment';
import { PlayerUtils } from '../player/PlayerUtils';

export class BuilderManager {
    private scene: THREE.Scene;
    private ghostMesh: THREE.Object3D | null = null;
    private currentType: StructureType = 'foundation';
    private ghostRotation: number = 0;
    private isActive: boolean = false;
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    setActive(active: boolean) {
        this.isActive = active;
        if (!active) {
            this.clearGhost();
        } else {
            this.updateGhost();
        }
    }

    setType(type: StructureType) {
        this.currentType = type;
        if (this.isActive) this.updateGhost();
    }

    rotate() {
        this.ghostRotation += Math.PI / 2;
        if (this.ghostMesh) {
            this.ghostMesh.rotation.y = this.ghostRotation;
        }
    }

    private clearGhost() {
        if (this.ghostMesh) {
            this.scene.remove(this.ghostMesh);
            this.ghostMesh = null;
        }
    }

    private updateGhost() {
        this.clearGhost();
        this.ghostMesh = BuildingParts.createStructureMesh(this.currentType, true);
        this.ghostMesh.rotation.y = this.ghostRotation;
        this.scene.add(this.ghostMesh);
    }

    update(playerPos: THREE.Vector3, playerRotation: number, environment: Environment, camera: THREE.Camera, mousePos: {x: number, y: number}) {
        if (!this.isActive || !this.ghostMesh) return;

        // Reset rotation to user selection every frame
        this.ghostMesh.rotation.y = this.ghostRotation;

        // Raycast from mouse to ground plane at player's height
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePos, camera);
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -playerPos.y);
        const hit = new THREE.Vector3();
        let targetPos = raycaster.ray.intersectPlane(plane, hit);

        // Fallback to player forward if no intersection (looking at sky)
        if (!targetPos) {
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation);
            targetPos = playerPos.clone().add(forward.multiplyScalar(3.2));
        }

        const gridSize = 1.3333;
        const halfGrid = gridSize / 2;

        // Snapping Logic
        if (this.currentType === 'foundation') {
            // Foundation snaps to grid CENTERS
            this.ghostMesh.position.x = Math.floor(targetPos.x / gridSize) * gridSize + halfGrid;
            this.ghostMesh.position.z = Math.floor(targetPos.z / gridSize) * gridSize + halfGrid;
        } else if (this.currentType === 'wall') {
            // Walls snap to grid EDGES based on rotation (1 grid wide)
            let normRot = this.ghostRotation % (Math.PI * 2);
            if (normRot < 0) normRot += Math.PI * 2;
            const isFacingZ = Math.abs(Math.cos(normRot)) > 0.5;

            if (isFacingZ) {
                // Snap X to center (of cell), Z to edge (line)
                this.ghostMesh.position.x = Math.floor(targetPos.x / gridSize) * gridSize + halfGrid;
                this.ghostMesh.position.z = Math.round(targetPos.z / gridSize) * gridSize;
            } else {
                // Snap Z to center, X to edge
                this.ghostMesh.position.z = Math.floor(targetPos.z / gridSize) * gridSize + halfGrid;
                this.ghostMesh.position.x = Math.round(targetPos.x / gridSize) * gridSize;
            }
        } else if (this.currentType === 'doorway' || this.currentType === 'door') {
            // 2-Grid Wide Objects: Snap to Grid Intersections (Lines) on both axes
            // This centers the 2-grid wide object on the vertex between two cells
            this.ghostMesh.position.x = Math.round(targetPos.x / gridSize) * gridSize;
            this.ghostMesh.position.z = Math.round(targetPos.z / gridSize) * gridSize;
        } else if (this.currentType === 'roof') {
            // Roofs snap to centers
            this.ghostMesh.position.x = Math.floor(targetPos.x / gridSize) * gridSize + halfGrid;
            this.ghostMesh.position.z = Math.floor(targetPos.z / gridSize) * gridSize + halfGrid;
        }

        // Vertical Snapping (Align on top of foundations)
        // Since walls/doors snap to edges, the center point might be between foundations (height 0)
        // We need to probe slightly offset points to detect if we are adjacent to a foundation
        let groundHeight = 0;
        
        // Filter obstacles for specific types
        let obstaclesToCheck = environment.obstacles;
        if (this.currentType === 'door') {
            // When placing a door, ignore doorways and walls so we snap to the foundation/floor
            obstaclesToCheck = environment.obstacles.filter(obj => 
                obj.userData.structureType !== 'doorway' && 
                obj.userData.structureType !== 'wall'
            );
        }

        if (this.currentType === 'wall' || this.currentType === 'doorway' || this.currentType === 'door') {
             // Determine orientation to probe perpendicular
            let normRot = this.ghostRotation % (Math.PI * 2);
            if (normRot < 0) normRot += Math.PI * 2;
            const isFacingZ = Math.abs(Math.cos(normRot)) > 0.5;

            // Probe center
            const hCenter = PlayerUtils.getGroundHeight(this.ghostMesh.position, { torsoWidth: 0.1 } as any, obstaclesToCheck);
            
            // Probe offsets (perpendicular to wall)
            // If facing Z (running along X), probe +/- Z
            // If facing X (running along Z), probe +/- X
            const offset = gridSize / 2; // Check the center of the adjacent cells
            
            const p1 = this.ghostMesh.position.clone();
            const p2 = this.ghostMesh.position.clone();

            if (isFacingZ) {
                p1.z -= offset;
                p2.z += offset;
            } else {
                p1.x -= offset;
                p2.x += offset;
            }

            const h1 = PlayerUtils.getGroundHeight(p1, { torsoWidth: 0.1 } as any, obstaclesToCheck);
            const h2 = PlayerUtils.getGroundHeight(p2, { torsoWidth: 0.1 } as any, obstaclesToCheck);

            groundHeight = Math.max(hCenter, h1, h2);
        } else {
            // Foundation/Roof - just check center
            groundHeight = PlayerUtils.getGroundHeight(this.ghostMesh.position, { torsoWidth: 0.1 } as any, obstaclesToCheck);
        }

        // Auto-rotate door to match doorway if detected
        let isSnappedToDoorway = false;
        if (this.currentType === 'door') {
            let closestDist = Infinity;
            let closestDoorway: THREE.Object3D | null = null;

            environment.obstacles.forEach(obj => {
                if (obj.userData.structureType !== 'doorway') return;
                
                const structure = obj.parent;
                if (!structure) return;
                
                // Check flat distance (ignore Y)
                const dx = structure.position.x - this.ghostMesh!.position.x;
                const dz = structure.position.z - this.ghostMesh!.position.z;
                const dist = Math.sqrt(dx*dx + dz*dz);

                if (dist < 2.0 && dist < closestDist) {
                    closestDist = dist;
                    closestDoorway = structure;
                }
            });

            if (closestDoorway) {
                // Snap rotation to the doorway
                this.ghostMesh.rotation.y = closestDoorway.rotation.y;
                // Snap position exactly to the doorway
                this.ghostMesh.position.x = closestDoorway.position.x;
                this.ghostMesh.position.z = closestDoorway.position.z;
                
                // Override Y position to align with doorway
                // Doorway Y is center at base + 1.375
                // Door Y should be base + 1.175
                // So Door Y = Doorway Y - 0.2
                this.ghostMesh.position.y = closestDoorway.position.y - 0.2;
                isSnappedToDoorway = true;
            }
        }

        const baseHeight = groundHeight > 0.1 ? groundHeight : 0;

        if (!isSnappedToDoorway) {
            if (this.currentType === 'foundation') {
                this.ghostMesh.position.y = baseHeight + 0.2; 
            } else if (this.currentType === 'wall') {
                // Wall is 2.75m tall, center is 1.375
                this.ghostMesh.position.y = baseHeight + 1.375; 
            } else if (this.currentType === 'doorway') {
                // Doorway is 2.75m tall, center is 1.375
                this.ghostMesh.position.y = baseHeight + 1.375;
            } else if (this.currentType === 'door') {
                this.ghostMesh.position.y = baseHeight + 1.175; 
            } else if (this.currentType === 'roof') {
                this.ghostMesh.position.y = baseHeight + 2.75; 
            }
        }
    }

    build(environment: Environment) {
        if (!this.isActive || !this.ghostMesh) return;

        const realMesh = BuildingParts.createStructureMesh(this.currentType, false);
        realMesh.position.copy(this.ghostMesh.position);
        realMesh.rotation.copy(this.ghostMesh.rotation);
        
        // Apply user data to all meshes in the structure
        const applyUserData = (obj: THREE.Object3D) => {
            obj.userData = { 
                ...obj.userData, // Merge existing userData
                type: 'hard', 
                material: 'wood',
                structureType: this.currentType 
            };
        };

        if (realMesh instanceof THREE.Group) {
            realMesh.traverse(applyUserData);
        } else {
            applyUserData(realMesh);
        }
        
        this.scene.add(realMesh);

        // For collision, if it's a group (like doorway), add children individually
        // so the player can walk through the gap
        if (realMesh instanceof THREE.Group) {
            realMesh.children.forEach(child => environment.obstacles.push(child));
        } else {
            environment.obstacles.push(realMesh);
        }
    }
}
