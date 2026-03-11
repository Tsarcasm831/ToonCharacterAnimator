import * as THREE from 'three';
import { HexagonEntity, HexState } from './xenoswarm_hex';

export class HiveMindController {
    public entities: HexagonEntity[] = [];
    public corePosition: THREE.Vector3;
    public radius: number = 3;
    public isSwarmMode: boolean = false;
    public isRolling: boolean = false;
    private scene: THREE.Scene;
    private target: THREE.Vector3 | null = null;
    
    // Rolling mechanics
    private rollDirection: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
    private moveSpeed: number = 5.0;

    constructor(scene: THREE.Scene, position: THREE.Vector3, count: number = 50) {
        this.scene = scene;
        this.corePosition = position.clone();
        
        // Generate the hive
        this.generateHive(count);
    }

    private generateHive(count: number) {
        // Simple Fibonacci sphere algorithm for even distribution
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
            const radiusAtY = Math.sqrt(1 - y * y); // Radius at y
            
            const theta = phi * i; // Golden angle increment
            
            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            // Is this an inner shell protector? (First 20% are inner)
            const isInner = i < count * 0.2;
            const hex = new HexagonEntity(`hex_${i}`, isInner);
            
            // Set initial position on sphere surface
            const offset = new THREE.Vector3(x, y, z).multiplyScalar(isInner ? this.radius * 0.5 : this.radius);
            hex.mesh.position.copy(this.corePosition).add(offset);
            
            // Orient outwards
            hex.mesh.lookAt(this.corePosition);
            // Rotate 180 so flat side faces out (if needed, depending on cylinder orientation)
            // The hex geometry was rotated X 90 in constructor, so Z is out.
            // lookAt points +Z at target. So we want -Z to point at corePosition?
            // Actually lookAt makes +Z point to target. 
            // If we lookAt core, +Z points to core. We want +Z to point OUT.
            // So lookAt (position + (position - core))
            const outwardPos = hex.mesh.position.clone().add(offset);
            hex.mesh.lookAt(outwardPos);

            this.entities.push(hex);
            this.scene.add(hex.mesh);
        }
    }

    public update(deltaTime: number, playerPosition?: THREE.Vector3) {
        // Move core if rolling
        if (!this.isSwarmMode && this.isRolling) {
             // Logic to move corePosition based on rolling
             this.corePosition.add(this.rollDirection.clone().multiplyScalar(this.moveSpeed * deltaTime));
             
             // Wrap around if it goes too far (simple test bounds)
             if (this.corePosition.z > 50) this.corePosition.z = -50;
        }

        // Determine which hexes are touching ground to trigger propulsion
        const bottomThreshold = this.corePosition.y - this.radius + 0.5;

        this.entities.forEach(hex => {
            // Update individual behavior
            // If in swarm mode, target might be player
            const swarmTarget = this.isSwarmMode && playerPosition ? playerPosition : undefined;
            
            // If latched, we need to enforce sphere shape + breathing/jitter
            if (hex.currentState === HexState.LATCHED || hex.currentState === HexState.PROPULSION) {
                this.updateLatchedHex(hex, deltaTime);
            }

            hex.update(deltaTime, swarmTarget);
        });
    }

    private updateLatchedHex(hex: HexagonEntity, deltaTime: number) {
        // Calculate ideal position on sphere
        // For now, we just keep them relative to core.
        // In a real physics simulation, they would be spring joints.
        // Here we just hard snap them back to radius, but allow propulsion extension.
        
        const directionFromCore = new THREE.Vector3().subVectors(hex.mesh.position, this.corePosition).normalize();
        
        // Check if this hex is at the bottom (Propulsion trigger)
        // Dot product with down vector (0, -1, 0)
        // If dot > 0.8 (mostly down), it's a foot
        const down = new THREE.Vector3(0, -1, 0);
        const isFoot = directionFromCore.dot(down) > 0.8;

        if (isFoot && !this.isSwarmMode) {
             hex.setPropulsionMode(true);
        } else if (hex.currentState === HexState.PROPULSION) {
             hex.setPropulsionMode(false);
        }

        // Apply Position
        const currentRadius = this.radius + (hex.extensionFactor * 0.5); // Add piston height
        const targetPos = this.corePosition.clone().add(directionFromCore.multiplyScalar(currentRadius));
        
        // Soft follow
        hex.mesh.position.lerp(targetPos, deltaTime * 5);
        
        // Orientation
        const outwardPos = hex.mesh.position.clone().add(directionFromCore);
        hex.mesh.lookAt(outwardPos);
    }

    public shatter() {
        this.isSwarmMode = true;
        this.entities.forEach(hex => hex.detachFromHive());
    }

    public reform() {
        this.isSwarmMode = false;
        // In a complex version, they would pathfind back.
        // For now, they will just snap to LATCHED state and lerp back in updateLatchedHex
        this.entities.forEach(hex => {
            if (hex.currentState !== HexState.GUARDIAN) {
                hex.currentState = HexState.LATCHED;
            }
        });
    }

    public setTarget(target: THREE.Vector3) {
        this.target = target;
    }

    public teleport(position: THREE.Vector3) {
        const offset = new THREE.Vector3().subVectors(position, this.corePosition);
        this.corePosition.copy(position);
        
        this.entities.forEach(hex => {
            hex.mesh.position.add(offset);
        });
    }

    public dispose() {
        this.entities.forEach(hex => {
            this.scene.remove(hex.mesh);
            if (hex.mesh.geometry) hex.mesh.geometry.dispose();
            if (hex.mesh.material) {
                if (Array.isArray(hex.mesh.material)) {
                    hex.mesh.material.forEach(m => m.dispose());
                } else {
                    hex.mesh.material.dispose();
                }
            }
        });
        this.entities = [];
    }
}
