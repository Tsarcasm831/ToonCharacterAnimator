import * as THREE from 'three';
import { PlayerInput } from '../../../types';
import { ParticleManager } from '../../managers/ParticleManager';
import { ProjectileManager } from '../../managers/ProjectileManager';
import { BaseAction } from './BaseAction';

export class BowAction extends BaseAction {
    // State
    isFiringBow: boolean = false;
    bowState: 'draw' | 'hold' | 'release' = 'draw';
    bowCharge: number = 0;
    bowTimer: number = 0;

    constructor(player: any) {
        super(player);
    }

    handleInput(input: PlayerInput): void {
        // Bow input will be handled by a separate method that takes dt and particleManager
        // This is needed because BaseAction's handleInput signature doesn't match our needs
    }

    handleBowInput(dt: number, input: PlayerInput, particleManager: ParticleManager): void {
        if (this.bowState === 'release' && this.bowTimer < 0.3) {
            return; 
        }

        if (input.attack1) {
            // DRAW / CHARGE
            if (!this.isFiringBow || this.bowState === 'release') {
                this.isFiringBow = true;
                this.bowState = 'draw';
                this.bowCharge = 0;
                this.bowTimer = 0;
            }
            // CHARGE
            if (this.bowState === 'draw') {
                this.bowCharge = Math.min(this.bowCharge + dt * 1.2, 1.0);
                if (this.bowCharge >= 1.0) {
                    this.bowState = 'hold';
                }
            }
        } else {
            // RELEASE
            if (this.isFiringBow && (this.bowState === 'draw' || this.bowState === 'hold')) {
                this.fireArrow(particleManager);
                this.bowState = 'release';
                this.bowTimer = 0;
            }
        }
    }

    update(dt: number): void {
        if (this.isFiringBow && this.bowState === 'release') {
            this.bowTimer += dt;
            if (this.bowTimer > 0.45) { 
                this.isFiringBow = false;
                this.bowState = 'draw';
                this.bowCharge = 0;
                this.bowTimer = 0;
            }
        }
    }

    get isActive(): boolean {
        return this.isFiringBow;
    }

    clear(): void {
        this.isFiringBow = false;
        this.bowState = 'draw';
        this.bowCharge = 0;
        this.bowTimer = 0;
    }

    private fireArrow(particleManager: ParticleManager): void {
        const tempVec1 = new THREE.Vector3();
        const tempVec2 = new THREE.Vector3();
        tempVec1.copy(this.player.mesh.position);
        tempVec1.y += 1.35; 
        
        const forward = tempVec2.set(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
        const left = new THREE.Vector3(); // Need to not overwrite tempVec1 yet, or use a 3rd temp
        left.set(1, 0, 0).applyQuaternion(this.player.mesh.quaternion);
        
        tempVec1.addScaledVector(forward, 0.8);
        tempVec1.addScaledVector(left, 0.2); 

        ProjectileManager.spawnProjectile(this.player.scene, tempVec1, forward, 'arrow', this.player);
        particleManager.emit(tempVec1, 5, 'spark'); 
    }
}
