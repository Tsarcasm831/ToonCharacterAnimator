
import * as THREE from 'three';
import { BuildingParts, StructureType } from './BuildingParts';
import { Environment } from '../environment/Environment';
import { PlayerUtils } from '../player/PlayerUtils';

export class BuilderManager {
    private scene: THREE.Scene;
    private ghostMesh: THREE.Object3D | null = null;
    private currentType: StructureType = 'foundation';
    private ghostRotation: number = 0;
    private isActive: boolean = false;
    private _rayCoords = new THREE.Vector2();
    
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

        this.ghostMesh.rotation.y = this.ghostRotation;

        const raycaster = new THREE.Raycaster();
        this._rayCoords.set(mousePos.x, mousePos.y);
        raycaster.setFromCamera(this._rayCoords, camera);
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -playerPos.y);
        const hit = new THREE.Vector3();
        let targetPos = raycaster.ray.intersectPlane(plane, hit);

        if (!targetPos) {
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation);
            targetPos = playerPos.clone().add(forward.multiplyScalar(3.2));
        }

        const gridSize = 1.3333;
        const halfGrid = gridSize / 2;

        if (this.currentType === 'foundation') {
            this.ghostMesh.position.x = Math.floor(targetPos.x / gridSize) * gridSize + halfGrid;
            this.ghostMesh.position.z = Math.floor(targetPos.z / gridSize) * gridSize + halfGrid;
        } else if (this.currentType === 'wall') {
            let normRot = this.ghostRotation % (Math.PI * 2);
            if (normRot < 0) normRot += Math.PI * 2;
            const isFacingZ = Math.abs(Math.cos(normRot)) > 0.5;

            if (isFacingZ) {
                this.ghostMesh.position.x = Math.floor(targetPos.x / gridSize) * gridSize + halfGrid;
                this.ghostMesh.position.z = Math.round(targetPos.z / gridSize) * gridSize;
            } else {
                this.ghostMesh.position.z = Math.floor(targetPos.z / gridSize) * gridSize + halfGrid;
                this.ghostMesh.position.x = Math.round(targetPos.x / gridSize) * gridSize;
            }
        } else if (this.currentType === 'doorway' || this.currentType === 'door') {
            this.ghostMesh.position.x = Math.round(targetPos.x / gridSize) * gridSize;
            this.ghostMesh.position.z = Math.round(targetPos.z / gridSize) * gridSize;
        } else if (this.currentType === 'roof') {
            this.ghostMesh.position.x = Math.floor(targetPos.x / gridSize) * gridSize + halfGrid;
            this.ghostMesh.position.z = Math.floor(targetPos.z / gridSize) * gridSize + halfGrid;
        }

        let groundHeight = 0;
        let obstaclesToCheck = environment.obstacles;
        if (this.currentType === 'door') {
            obstaclesToCheck = environment.obstacles.filter(obj => 
                obj.userData.structureType !== 'doorway' && 
                obj.userData.structureType !== 'wall'
            );
        }

        if (this.currentType === 'wall' || this.currentType === 'doorway' || this.currentType === 'door') {
            let normRot = this.ghostRotation % (Math.PI * 2);
            if (normRot < 0) normRot += Math.PI * 2;
            const isFacingZ = Math.abs(Math.cos(normRot)) > 0.5;

            const hCenter = PlayerUtils.getGroundHeight(this.ghostMesh.position, { torsoWidth: 0.1 } as any, obstaclesToCheck);
            const offset = gridSize / 2; 
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
            groundHeight = PlayerUtils.getGroundHeight(this.ghostMesh.position, { torsoWidth: 0.1 } as any, obstaclesToCheck);
        }

        let isSnappedToDoorway = false;
        if (this.currentType === 'door') {
            let closestDist = Infinity;
            let closestDoorway: THREE.Object3D | null = null;

            environment.obstacles.forEach(obj => {
                if (obj.userData.structureType !== 'doorway') return;
                
                const structure = obj.parent;
                if (!structure) return;
                
                const dx = structure.position.x - this.ghostMesh!.position.x;
                const dz = structure.position.z - this.ghostMesh!.position.z;
                const dist = Math.sqrt(dx*dx + dz*dz);

                if (dist < 2.0 && dist < closestDist) {
                    closestDist = dist;
                    closestDoorway = structure;
                }
            });

            if (closestDoorway) {
                this.ghostMesh.rotation.y = closestDoorway.rotation.y;
                this.ghostMesh.position.x = closestDoorway.position.x;
                this.ghostMesh.position.z = closestDoorway.position.z;
                // Door center 1.175, Doorway center 1.65. Offset = 1.65 - 1.175 = 0.475
                this.ghostMesh.position.y = closestDoorway.position.y - 0.475;
                isSnappedToDoorway = true;
            }
        }

        const baseHeight = groundHeight > 0.1 ? groundHeight : 0;

        if (!isSnappedToDoorway) {
            if (this.currentType === 'foundation') {
                this.ghostMesh.position.y = baseHeight + 0.2; 
            } else if (this.currentType === 'wall') {
                this.ghostMesh.position.y = baseHeight + 1.65; 
            } else if (this.currentType === 'doorway') {
                this.ghostMesh.position.y = baseHeight + 1.65;
            } else if (this.currentType === 'door') {
                this.ghostMesh.position.y = baseHeight + 1.175; 
            } else if (this.currentType === 'roof') {
                this.ghostMesh.position.y = baseHeight + 3.3; 
            }
        }
    }

    build(environment: { obstacles: THREE.Object3D[] }) {
        if (!this.isActive || !this.ghostMesh) return;

        const realMesh = BuildingParts.createStructureMesh(this.currentType, false);
        realMesh.position.copy(this.ghostMesh.position);
        realMesh.rotation.copy(this.ghostMesh.rotation);
        
        const applyUserData = (obj: THREE.Object3D) => {
            obj.userData = { 
                ...obj.userData, 
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

        if (realMesh instanceof THREE.Group) {
            realMesh.children.forEach(child => environment.obstacles.push(child));
        } else {
            environment.obstacles.push(realMesh);
        }
    }
}
