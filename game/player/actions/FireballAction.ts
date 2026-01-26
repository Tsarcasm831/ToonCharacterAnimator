import * as THREE from 'three';
import { PlayerInput } from '../../../types';
import { ParticleManager } from '../../managers/ParticleManager';
import { ProjectileManager } from '../../managers/ProjectileManager';
import { BaseAction } from './BaseAction';

export class FireballAction extends BaseAction {
    // State
    isFireballCasting: boolean = false;
    fireballTimer: number = 0;
    hasSpawnedFireball: boolean = false;

    constructor(player: any) {
        super(player);
    }

    handleInput(): void {
        if (!this.isFireballCasting && !this.player.status.isDead) {
            this.isFireballCasting = true;
            this.fireballTimer = 0;
            this.hasSpawnedFireball = false;
        }
    }

    update(dt: number, particleManager?: ParticleManager): void {
        if (this.isFireballCasting) {
            this.fireballTimer += dt;
            
            // Generate particles during cast windup
            if (!this.hasSpawnedFireball && this.fireballTimer < 0.4) {
                if (Math.random() > 0.5) {
                    const tempVec1 = new THREE.Vector3();
                    const tempVec2 = new THREE.Vector3();
                    tempVec1.copy(this.player.mesh.position);
                    tempVec1.y += 1.3;
                    tempVec2.set(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
                    tempVec1.addScaledVector(tempVec2, 0.4);
                    particleManager?.emit(tempVec1, 1, 'spark');
                }
            }

            // Spawn fireball at the right moment
            if (!this.hasSpawnedFireball && this.fireballTimer >= 0.4) {
                this.spawnFireball(particleManager);
                this.hasSpawnedFireball = true;
            }

            // End casting
            if (this.fireballTimer >= 0.8) {
                this.isFireballCasting = false;
                this.fireballTimer = 0;
            }
        }
    }

    get isActive(): boolean {
        return this.isFireballCasting;
    }

    clear(): void {
        this.isFireballCasting = false;
        this.fireballTimer = 0;
        this.hasSpawnedFireball = false;
    }

    private spawnFireball(particleManager?: ParticleManager): void {
        const tempVec1 = new THREE.Vector3();
        const tempVec2 = new THREE.Vector3();
        tempVec1.copy(this.player.mesh.position);
        tempVec1.y += 1.35; 
        
        tempVec2.set(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
        tempVec1.addScaledVector(tempVec2, 1.0);

        ProjectileManager.spawnProjectile(this.player.scene, tempVec1, tempVec2, 'fireball', this.player);
        particleManager?.emit(tempVec1, 10, 'spark'); 
    }
}
