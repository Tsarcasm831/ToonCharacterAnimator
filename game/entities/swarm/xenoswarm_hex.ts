import * as THREE from 'three';

/**
 * Represents a single hexagonal plate creature.
 * These entities can lock together to form a larger sphere, 
 * or detach to swarm enemies.
 */

// The distinct states of existence for a Hexagon
export enum HexState {
    // Rigidly attached to the hive structure (The Ball)
    LATCHED = 'LATCHED', 
    
    // Acting as a "foot" - compressing/extending to roll the ball
    PROPULSION = 'PROPULSION', 
    
    // Detached, floating, defying gravity
    FREE_FLOATING = 'FREE_FLOATING', 
    
    // Attached to a target/enemy to dissolve them
    CONSUMING = 'CONSUMING',
    
    // Inner layer protecting the core (young)
    GUARDIAN = 'GUARDIAN' 
}

export interface HexStats {
    hardness: number;       // Resistance to damage
    dissolveRate: number;   // How fast it eats enemies
    extensionLimit: number; // How far it can push out (for rolling)
    magneticForce: number;  // How strongly it latches to neighbors
}

export class HexagonEntity {
    public id: string;
    public mesh: THREE.Mesh;
    
    // The current behavioral state
    public currentState: HexState;
    
    // Visual properties
    public color: string; // "Steel Grey" or "Brown"
    public metallicRoughness: number; 
    
    // Physics properties
    public velocity: THREE.Vector3;
    public gravityScale: number; // 1.0 = normal, 0.0 = defy gravity, -1.0 = antigrav
    
    // The "Piston" mechanic: 
    // 0 = neutral, 1 = fully extended, -1 = fully retracted
    public extensionFactor: number; 

    // Links to neighbors (max 6 for a hexagon)
    private neighbors: HexagonEntity[];

    constructor(id: string, isInnerShell: boolean) {
        this.id = id;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.neighbors = [];
        
        // Default visuals
        this.color = isInnerShell ? "#5C4033" : "#71797E"; // Dark Brown (inner) vs Steel Grey (outer)
        this.metallicRoughness = 0.8;
        
        // Default State
        this.currentState = isInnerShell ? HexState.GUARDIAN : HexState.LATCHED;
        this.extensionFactor = 0;
        this.gravityScale = 1.0;

        // Create Mesh
        // Cylinder with 6 radial segments = Hexagon
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 6); 
        geometry.rotateX(Math.PI / 2); // Rotate so the flat face points out
        
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.2,
            metalness: this.metallicRoughness
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }

    /**
     * The heartbeat of the entity. Call this every frame.
     */
    update(deltaTime: number, target?: THREE.Vector3) {
        switch (this.currentState) {
            case HexState.LATCHED:
                this.updateLatchedBehavior();
                break;
            case HexState.PROPULSION:
                this.updatePropulsionBehavior(deltaTime);
                break;
            case HexState.FREE_FLOATING:
                this.updateSwarmBehavior(deltaTime, target);
                break;
            case HexState.CONSUMING:
                this.updateDissolveLogic(deltaTime);
                break;
        }

        // Apply visual updates based on state
        // For example, pulse scaling if in propulsion
        if (this.currentState === HexState.PROPULSION) {
            // Visualize extension by moving mesh locally along its normal or scaling
             // If local Y is "out", we translate locally
             // But geometry is rotated, so Z is "out" (originally Y up, rotated X 90)
             // Let's assume Z is forward for the plate
        }
    }

    // --- BEHAVIORAL LOGIC ---

    /**
     * Logic for when the hex is part of the ball structure.
     * It rigidly follows the parent transform but allows for small jitter/breathing.
     */
    private updateLatchedBehavior() {
        this.gravityScale = 1.0; 
        this.extensionFactor = 0; // Neutral position
        // Logic to snap position to neighbor grid goes here
    }

    /**
     * Logic for the "Feet". 
     * If this hex is touching the ground, it extends/contracts 
     * to push the center of mass forward.
     */
    private updatePropulsionBehavior(deltaTime: number) {
        // Pulse the extension to create movement
        // This simulates the "squished" bottom and rolling force
        this.extensionFactor = Math.sin(deltaTime * 10); 
        
        // Visual feedback for propulsion (piston effect)
        // Assuming the mesh is child of the hive container, we can move it locally
        // Or if it's world space, we rely on the controller to position it, 
        // and we just add the offset here.
    }

    /**
     * Logic for when the ball shatters and this hex flies 
     * individually towards a target or floats.
     */
    private updateSwarmBehavior(deltaTime: number, target?: THREE.Vector3) {
        this.gravityScale = 0.0; // Defy gravity
        
        if (target) {
            // Simple seek behavior
            const direction = new THREE.Vector3().subVectors(target, this.mesh.position).normalize();
            const speed = 5.0;
            
            // Add to velocity
            this.velocity.add(direction.multiplyScalar(speed * deltaTime));
            
            // Dampen velocity
            this.velocity.multiplyScalar(0.95);
            
            // Apply velocity
            this.mesh.position.add(this.velocity.multiplyScalar(deltaTime));
            
            // Look at target
            this.mesh.lookAt(target);
        } else {
            // Idle float / Orbit logic
            this.mesh.rotation.x += deltaTime;
            this.mesh.rotation.y += deltaTime * 0.5;
        }
    }

    /**
     * Logic for damage dealing.
     */
    private updateDissolveLogic(deltaTime: number) {
        // Heat up or vibrate
        // Decrease target HP
        this.mesh.scale.setScalar(0.9 + Math.sin(deltaTime * 20) * 0.1);
    }

    // --- INTERACTIONS ---

    /**
     * Triggered when the main ball needs to roll.
     */
    public setPropulsionMode(active: boolean) {
        if (this.currentState === HexState.GUARDIAN) return; // Inner shell never leaves
        
        this.currentState = active ? HexState.PROPULSION : HexState.LATCHED;
    }

    /**
     * Triggered when the ball "shatters" to attack.
     */
    public detachFromHive() {
        if (this.currentState === HexState.GUARDIAN) return;
        
        this.currentState = HexState.FREE_FLOATING;
        this.neighbors = []; // Break links
    }

    /**
     * Called when the swarm is reforming the ball.
     */
    public latchTo(neighbor: HexagonEntity) {
        if (this.neighbors.length < 6) {
            this.neighbors.push(neighbor);
            this.currentState = HexState.LATCHED;
        }
    }
}