import * as THREE from 'three';
import { PlayerInput } from '../../../types';
import { ParticleManager } from '../../managers/ParticleManager';
import { BaseAction } from './BaseAction';

export class MeleeAction extends BaseAction {
    // State
    isAxeSwing: boolean = false;
    axeSwingTimer: number = 0;
    hasHit: boolean = false;
    isPunch: boolean = false;
    punchTimer: number = 0;
    comboChain: number = 0;
    
    // Callback for hit notifications
    onAttackHit?: (type: string, count: number) => void;
    
    // Sound manager
    private soundManager: any;

    constructor(player: any, onAttackHit?: (type: string, count: number) => void, soundManager?: any) {
        super(player);
        this.onAttackHit = onAttackHit;
        this.soundManager = soundManager;
    }

    handleInput(input: PlayerInput): void {
        if (input.attack1) {
            if (this.player.config.selectedItem) {
                if (!this.isAxeSwing) {
                    this.playAxeSwing();
                }
            } else {
                // Only start punch if not already punching
                if (!this.isPunch) {
                    this.playPunch();
                }
            }
        }
        if (input.attack2) {
            if (this.player.config.selectedItem) {
                if (!this.isAxeSwing) {
                    this.playAxeSwing();
                }
            }
        }
    }

    update(dt: number, environment?: any, particleManager?: ParticleManager, entities?: any[]): void {
        if (this.isAxeSwing) {
            this.updateAxeSwing(dt, environment!, particleManager!, entities!);
        }
        // Punch updates are handled by updatePunchComboWithInput to have access to input
    }

    get isActive(): boolean {
        return this.isAxeSwing || this.isPunch;
    }

    clear(): void {
        this.isAxeSwing = false;
        this.axeSwingTimer = 0;
        this.hasHit = false;
        this.isPunch = false;
        this.punchTimer = 0;
        this.comboChain = 0;
    }

    private playAxeSwing(): void {
        if (!this.isAxeSwing) {
            this.isAxeSwing = true;
            this.axeSwingTimer = 0;
            this.hasHit = false;
        }
    }

    private playPunch(): void {
        if (!this.isPunch) {
            this.isPunch = true;
            this.punchTimer = 0;
            this.comboChain = 1;
        }
    }

    private getWeaponDamage(item: string | null): number {
        if (item === 'Sword') return 5;
        if (item === 'Axe') return 4;
        if (item === 'Pickaxe') return 3;
        if (item === 'Halberd') return 4;
        return 1; 
    }

    private updateAxeSwing(dt: number, environment: any, particleManager: ParticleManager, entities: any[]): void {
        if (this.isAxeSwing) {
            this.axeSwingTimer += dt;
            const item = this.player.config.selectedItem;
            
            let duration = 0.9;
            if (item === 'Sword') duration = 0.6;
            if (item === 'Knife') duration = 0.4;
            
            const impactTime = duration * 0.5; 
            
            if (!this.hasHit && this.axeSwingTimer > impactTime) {
                this.checkChoppingImpact(environment, particleManager, entities);
                this.hasHit = true;
            }

            if (this.axeSwingTimer > duration) { 
                this.isAxeSwing = false; 
                this.axeSwingTimer = 0; 
                this.hasHit = false;
            }
        }
    }

    private checkChoppingImpact(environment: any, particleManager: ParticleManager, entities: any[]): void {
        this.player.model.group.updateMatrixWorld(true);

        const playerPos = this.player.mesh.position;
        const damage = this.getWeaponDamage(this.player.config.selectedItem);
        
        let dealer: THREE.Object3D | null = null;
        if (this.player.config.selectedItem) {
            dealer = this.player.model.equippedMeshes.heldItem || null;
            if (dealer) {
                const subPart = dealer.getObjectByName('damagePart');
                if (subPart) dealer = subPart;
            }
        } else {
            dealer = this.player.model.parts.rightHand;
        }

        if (!dealer) return;

        const tempBox1 = new THREE.Box3();
        const tempBox2 = new THREE.Box3();
        tempBox1.setFromObject(dealer);
        tempBox1.expandByScalar(0.25);

        let hitCount = 0;

        for (const ent of entities) {
            if (ent && !ent.isDead) {
                // Check distance first to avoid expensive hitbox checks
                const dist = playerPos.distanceTo(ent.group ? ent.group.position : ent.position);
                if (dist < 4.5) {
                    let hit = false;
                    
                    let hitboxParts: THREE.Object3D[] = [];
                    if (typeof ent.getHitboxParts === 'function') {
                        hitboxParts = ent.getHitboxParts();
                    } else if (ent.hitbox) {
                        hitboxParts = ent.hitbox.children;
                    }

                    for (const part of hitboxParts) {
                        if (part instanceof THREE.Mesh) {
                            part.updateMatrixWorld(true);
                            tempBox2.setFromObject(part);
                            if (tempBox1.intersectsBox(tempBox2)) {
                                hit = true;
                                break;
                            }
                        }
                    }

                    if (hit) {
                        ent.takeDamage(damage);
                        hitCount++;
                        const impactPoint = new THREE.Vector3();
                        tempBox1.getCenter(impactPoint);
                        // Emit blood/flesh effect for entities, wood for objects is handled below
                        particleManager.emit(impactPoint, 10, 'spark'); 
                        // Don't return here - we want to hit multiple entities
                    }
                }
            }
        }

        // Notify about successful hits
        if (hitCount > 0 && this.onAttackHit) {
            const weaponType = this.player.config.selectedItem?.toLowerCase() || 'punch';
            this.onAttackHit(weaponType, hitCount);
        }

        const item = this.player.config.selectedItem;
        const canChop = item === 'Axe' || item === 'Pickaxe' || item === 'Halberd';
        if (!canChop) return;

        const playerForward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.player.mesh.quaternion).normalize();
        playerForward.y = 0; 
        const hitRange = 2.0;

        let closest: THREE.Object3D | null = null;
        let minDist = Infinity;

        for (const obs of environment.obstacles) {
            if (obs.userData.type === 'hard' && !obs.userData.type?.includes('creature')) {
                const obsPos = new THREE.Vector3();
                obs.getWorldPosition(obsPos);
                
                const dx = obsPos.x - playerPos.x;
                const dz = obsPos.z - playerPos.z;
                const distXZ = Math.sqrt(dx * dx + dz * dz);

                if (distXZ < hitRange) {
                    const dirToObs = new THREE.Vector3(dx, 0, dz).normalize();
                    const dot = playerForward.dot(dirToObs);

                    if (dot > 0.35) {
                        if (distXZ < minDist) {
                            minDist = distXZ;
                            closest = obs;
                        }
                    }
                }
            }
        }

        if (closest) { 
             const obsPos = new THREE.Vector3();
             (closest as THREE.Object3D).getWorldPosition(obsPos);
             const impactPos = playerPos.clone().lerp(obsPos, 0.5);
             impactPos.y += 1.1; 

             const materialType = environment.damageObstacle(closest, 1);
             
             if (materialType === 'wood') {
                 particleManager.emit(impactPos, 12, 'wood');
                 // Play wood chop sound
                 if (this.soundManager && this.soundManager.playWoodChop) {
                     this.soundManager.playWoodChop();
                 }
             } else if (materialType === 'stone') {
                 particleManager.emit(impactPos, 15, 'spark');
             }
        }
    }

    private updatePunchCombo(dt: number, obstacles: THREE.Object3D[]): void {
        if (!this.isPunch) return;

        this.punchTimer += dt;
        const t = this.punchTimer;
        
        if (t > 0.2 && t < 0.4) {
            this.player.locomotion.applyForwardImpulse(dt, 2.0, obstacles);
        }
        if (this.comboChain >= 2 && t > 0.8 && t < 1.0) {
            this.player.locomotion.applyForwardImpulse(dt, 2.0, obstacles);
        }
        if (this.comboChain >= 3 && t > 1.4 && t < 1.6) {
            this.player.locomotion.applyForwardImpulse(dt, 2.5, obstacles);
        }

        const punch1Dur = 0.6;
        const punch2Dur = 1.2;
        const punch3Dur = 1.8;
        // Note: We need access to input to check if attack1 is still held
        // This will be handled by passing input from PlayerCombat

        if (this.comboChain === 1 && t > punch1Dur) {
            this.isPunch = false; 
            this.punchTimer = 0; 
        } else if (this.comboChain === 2 && t > punch2Dur) {
            this.isPunch = false; 
            this.punchTimer = 0; 
        } else if (this.comboChain === 3 && t > punch3Dur) {
            this.isPunch = false;
            this.comboChain = 1;
            this.punchTimer = 0;
        }
    }

    // Method to update punch combo with input
    updatePunchComboWithInput(dt: number, input: PlayerInput, obstacles: THREE.Object3D[]): void {
        if (!this.isPunch) return;

        this.punchTimer += dt;
        const t = this.punchTimer;
        
        if (t > 0.2 && t < 0.4) {
            this.player.locomotion.applyForwardImpulse(dt, 2.0, obstacles);
        }
        if (this.comboChain >= 2 && t > 0.8 && t < 1.0) {
            this.player.locomotion.applyForwardImpulse(dt, 2.0, obstacles);
        }
        if (this.comboChain >= 3 && t > 1.4 && t < 1.6) {
            this.player.locomotion.applyForwardImpulse(dt, 2.5, obstacles);
        }

        const punch1Dur = 0.6;
        const punch2Dur = 1.2;
        const punch3Dur = 1.8;
        const isHolding = input.attack1 || false;

        if (this.comboChain === 1 && t > punch1Dur) {
            if (isHolding) this.comboChain = 2;
            else { this.isPunch = false; this.punchTimer = 0; }
        } else if (this.comboChain === 2 && t > punch2Dur) {
            if (isHolding) this.comboChain = 3;
            else { this.isPunch = false; this.punchTimer = 0; }
        } else if (this.comboChain === 3 && t > punch3Dur) {
            this.isPunch = false;
            this.comboChain = 1;
            this.punchTimer = 0;
        }
    }
}
