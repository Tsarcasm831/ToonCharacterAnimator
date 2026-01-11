
import * as THREE from 'three';
import { BuildingParts, StructureType } from './BuildingParts';
import { Environment } from '../Environment';
import { PlayerUtils } from '../player/PlayerUtils';

export class BuilderManager {
    private scene: THREE.Scene;
    private ghostMesh: THREE.Mesh | null = null;
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

    update(playerPos: THREE.Vector3, playerRotation: number, environment: Environment) {
        if (!this.isActive || !this.ghostMesh) return;

        // Position ghost 3m in front of player
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation);
        const targetPos = playerPos.clone().add(forward.multiplyScalar(3.2));

        const gridSize = 2.0;
        const halfGrid = 1.0;

        // Snapping Logic
        if (this.currentType === 'foundation') {
            // Foundation snaps to grid CENTERS
            this.ghostMesh.position.x = Math.round(targetPos.x / gridSize) * gridSize;
            this.ghostMesh.position.z = Math.round(targetPos.z / gridSize) * gridSize;
        } else if (this.currentType === 'wall' || this.currentType === 'doorway' || this.currentType === 'door') {
            // Walls/Doors snap to grid EDGES based on rotation
            // Normalize ghostRotation to 0..2PI
            let normRot = this.ghostRotation % (Math.PI * 2);
            if (normRot < 0) normRot += Math.PI * 2;

            // Check if we are facing Z or X
            const isFacingZ = Math.abs(Math.cos(normRot)) > 0.5;

            if (isFacingZ) {
                // Snap X to center, Z to edge
                this.ghostMesh.position.x = Math.round(targetPos.x / gridSize) * gridSize;
                this.ghostMesh.position.z = Math.round((targetPos.z - halfGrid) / gridSize) * gridSize + halfGrid;
            } else {
                // Snap Z to center, X to edge
                this.ghostMesh.position.z = Math.round(targetPos.z / gridSize) * gridSize;
                this.ghostMesh.position.x = Math.round((targetPos.x - halfGrid) / gridSize) * gridSize + halfGrid;
            }
        } else if (this.currentType === 'roof') {
            // Roofs snap to centers
            this.ghostMesh.position.x = Math.round(targetPos.x / gridSize) * gridSize;
            this.ghostMesh.position.z = Math.round(targetPos.z / gridSize) * gridSize;
        }

        // Vertical Snapping (Align on top of foundations)
        const groundHeight = PlayerUtils.getGroundHeight(this.ghostMesh.position, { torsoWidth: 0.1 } as any, environment.obstacles);
        const baseHeight = groundHeight > 0.1 ? groundHeight : 0;

        if (this.currentType === 'foundation') {
            this.ghostMesh.position.y = baseHeight + 0.2; 
        } else if (this.currentType === 'wall' || this.currentType === 'doorway') {
            this.ghostMesh.position.y = baseHeight + 1.25; // Centered pivot for 2.5m height
        } else if (this.currentType === 'door') {
            this.ghostMesh.position.y = baseHeight + 1.05; // Centered pivot for 2.1m height
        } else if (this.currentType === 'roof') {
            // Roofs sit on top of 2.5m walls
            this.ghostMesh.position.y = baseHeight + 2.5; 
        }
    }

    build(environment: Environment) {
        if (!this.isActive || !this.ghostMesh) return;

        const realMesh = BuildingParts.createStructureMesh(this.currentType, false);
        realMesh.position.copy(this.ghostMesh.position);
        realMesh.rotation.copy(this.ghostMesh.rotation);
        realMesh.userData = { type: 'hard', material: 'wood' };
        
        this.scene.add(realMesh);
        environment.obstacles.push(realMesh);
    }
}
