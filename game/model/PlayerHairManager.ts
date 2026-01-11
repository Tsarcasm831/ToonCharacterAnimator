
import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { PlayerPartsRegistry } from './PlayerPartsRegistry';
import { PlayerMaterials } from './PlayerMaterials';
import { HairBuilder } from './mesh/HairBuilder';

export class PlayerHairManager {
    private partsRegistry: PlayerPartsRegistry;
    private materials: PlayerMaterials;
    
    private lastHairHash: string = '';
    private hairInertia = new THREE.Vector3();
    private hairTargetInertia = new THREE.Vector3();

    // Physics tracking for realistic lag
    private prevHeadPos = new THREE.Vector3();
    private prevHeadQuat = new THREE.Quaternion();
    private isFirstUpdate = true;
    
    // Smoothing for the "spiky" transition
    private smoothedSpeed: number = 0;

    constructor(registry: PlayerPartsRegistry, materials: PlayerMaterials) {
        this.partsRegistry = registry;
        this.materials = materials;
    }

    updateConfig(config: PlayerConfig) {
        const hash = `${config.hairStyle}_${config.headScale}`;
        if (hash === this.lastHairHash) return;
        this.lastHairHash = hash;
        
        const head = this.partsRegistry.parts.head;
        if (head) {
            const hairCap = head.getObjectByName('HairCap');
            if (hairCap) {
                hairCap.visible = config.hairStyle !== 'bald';
            }
        }
        
        HairBuilder.build(this.partsRegistry.parts, config, this.materials.hair);
    }

    updatePhysics(dt: number, rootVelocity: THREE.Vector3) {
        const head = this.partsRegistry.parts.head;
        if (!head || dt <= 0) return;

        const hairMesh = head.getObjectByName('HairInstanced') as THREE.InstancedMesh;
        if (!hairMesh) return;

        // 1. Capture World State
        const currentHeadPos = new THREE.Vector3();
        const currentHeadQuat = new THREE.Quaternion();
        head.getWorldPosition(currentHeadPos);
        head.getWorldQuaternion(currentHeadQuat);

        if (this.isFirstUpdate) {
            this.prevHeadPos.copy(currentHeadPos);
            this.prevHeadQuat.copy(currentHeadQuat);
            this.isFirstUpdate = false;
            return;
        }

        // 2. Calculate Linear Acceleration (captures the "bob")
        const deltaPos = currentHeadPos.clone().sub(this.prevHeadPos).divideScalar(dt);
        
        // Sanitize for teleports
        if (deltaPos.length() > 20) deltaPos.set(0,0,0);

        // 3. Calculate Angular Velocity
        const invPrevQuat = this.prevHeadQuat.clone().invert();
        const deltaQuat = currentHeadQuat.clone().multiply(invPrevQuat);
        const rotationAxis = new THREE.Vector3(0, 1, 0); 
        const angle = 2 * Math.acos(THREE.MathUtils.clamp(deltaQuat.w, -1, 1));
        const angularSpeed = angle / dt;
        
        // 4. Combine into Target Inertia
        // Position lag - reduced from 0.08 to 0.045 for "heavier" feel
        this.hairTargetInertia.copy(deltaPos).multiplyScalar(-0.045);

        // Centrifugal swing when turning
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(currentHeadQuat);
        const turnSwing = forward.clone().cross(rotationAxis).multiplyScalar(angularSpeed * -0.012);
        this.hairTargetInertia.add(turnSwing);

        // Tighter clamp to prevent "exploding" look
        this.hairTargetInertia.clampLength(0, 0.18);

        // 5. Transform to Head Local Space
        const invHeadRot = currentHeadQuat.clone().invert();
        this.hairTargetInertia.applyQuaternion(invHeadRot);

        // 6. Enhanced Spring Damping
        // Damping speed reduced to prevent snapping
        const springStrength = 7.0; 
        this.hairInertia.lerp(this.hairTargetInertia, Math.min(1.0, springStrength * dt));

        // 7. Speed Smoothing for Shader (Prevents instant spikiness)
        const currentSpeed = deltaPos.length();
        this.smoothedSpeed = THREE.MathUtils.lerp(this.smoothedSpeed, currentSpeed, Math.min(1.0, dt * 5.0));

        // 8. Update Shader Uniforms
        if (hairMesh.userData.uInertia) {
            hairMesh.userData.uInertia.value.copy(this.hairInertia);
            
            if (hairMesh.userData.uGravity) {
                const worldDown = new THREE.Vector3(0, -0.03, 0); // Slight sag
                worldDown.applyQuaternion(invHeadRot);
                hairMesh.userData.uGravity.value.copy(worldDown);
            }

            if (hairMesh.userData.uSpeed) {
                // Pass smoothed speed
                hairMesh.userData.uSpeed.value = this.smoothedSpeed;
            }
        }

        // Store for next frame
        this.prevHeadPos.copy(currentHeadPos);
        this.prevHeadQuat.copy(currentHeadQuat);
    }
    
    syncColor(color: string) {
        const head = this.partsRegistry.parts.head;
        const hairMesh = head?.getObjectByName('HairInstanced') as THREE.InstancedMesh;
        if (hairMesh && hairMesh.material) {
             (hairMesh.material as THREE.MeshToonMaterial).color.set(color);
        }
    }
}
