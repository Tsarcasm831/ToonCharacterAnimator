
import * as THREE from 'three';
import type { Player } from '../Player';
import { PlayerInput } from '../../types';
import { PlayerPhysics } from './PlayerPhysics';
import { ParticleManager } from '../ParticleManager';
import { Environment } from '../Environment';
import { ArrowBuilder } from '../model/equipment/ArrowBuilder';

export class PlayerCombat {
    static update(player: Player, dt: number, input: PlayerInput, environment: Environment, particleManager: ParticleManager) {
        // Update projectiles
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const p = this.activeProjectiles[i];
            
            // Move
            const moveStep = p.velocity.clone().multiplyScalar(dt);
            p.mesh.position.add(moveStep);
            
            // Check Collision
            if (this.checkProjectileCollision(p.mesh.position, environment, particleManager)) {
                if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                this.activeProjectiles.splice(i, 1);
                continue;
            }

            // Check Max Distance (40m)
            if (p.mesh.position.distanceTo(p.startPos) > 40.0) {
                 if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                 this.activeProjectiles.splice(i, 1);
                 continue;
            }

            p.life -= dt;
            if (p.life <= 0) {
                if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                this.activeProjectiles.splice(i, 1);
            }
        }
        
        // Handle Inputs
        if (player.config.selectedItem === 'Fishing Pole') {
            this.handleFishingInput(player, dt, input);
        } else if (player.config.selectedItem === 'Bow') {
            this.handleBowInput(player, dt, input, particleManager);
        } else {
            // Other weapons support continuous hold (Auto-attack)
            if (input.attack1) {
                if (player.config.selectedItem) {
                    this.playAxeSwing(player);
                } else {
                    this.playPunch(player);
                }
            }
            if (input.attack2) {
                if (player.config.selectedItem) {
                    this.playAxeSwing(player);
                }
            }
        }

        // Update Input History
        player.wasAttack1Pressed = !!input.attack1;
        player.wasAttack2Pressed = !!input.attack2;

        // Update Timers & Logic
        this.updateAxeSwing(player, dt, environment, particleManager);
        this.updateFishing(player, dt);
        this.updateBowLogic(player, dt);
        this.updatePunchCombo(player, dt, input, environment.obstacles);
    }

    private static checkProjectileCollision(pos: THREE.Vector3, environment: Environment, particleManager: ParticleManager): boolean {
        for (const obs of environment.obstacles) {
            const obsPos = new THREE.Vector3();
            obs.getWorldPosition(obsPos);
            
            // Simple distance check for collision (approx 1.5m radius for trees/rocks)
            const dist = pos.distanceTo(obsPos);
            if (dist < 1.5) {
                const matType = obs.userData.type === 'hard' ? 'stone' : 'wood';
                particleManager.emit(pos, 5, matType === 'stone' ? 'spark' : 'wood');
                return true;
            }
        }
        return false;
    }

    private static handleBowInput(player: Player, dt: number, input: PlayerInput, particleManager: ParticleManager) {
        if (player.bowState === 'release') return; // Locked during release animation

        if (input.attack1) {
            // DRAW / CHARGE
            if (!player.isFiringBow) {
                player.isFiringBow = true;
                player.bowState = 'draw';
                player.bowCharge = 0;
                player.bowTimer = 0;
            }

            if (player.bowState === 'draw') {
                player.bowTimer += dt;
                player.bowCharge = Math.min(1.0, player.bowTimer / 0.6); // 0.6s to full draw
                
                if (player.bowCharge >= 1.0) {
                    player.bowState = 'hold';
                    // Optional: Screenshake or sound to indicate full draw
                }
            }
        } else {
            // RELEASE
            if (player.isFiringBow && (player.bowState === 'draw' || player.bowState === 'hold')) {
                // Fire!
                player.bowState = 'release';
                player.bowTimer = 0;
                
                // Visuals
                if (player.bowCharge > 0.3) {
                    // Only fire if drawn enough
                    this.fireArrow(player, particleManager);
                } else {
                    // Cancelled / Weak shot
                    player.isFiringBow = false;
                }
            }
        }
    }

    private static activeProjectiles: { 
        mesh: THREE.Group, 
        velocity: THREE.Vector3, 
        life: number,
        startPos: THREE.Vector3 
    }[] = [];

    private static fireArrow(player: Player, particleManager: ParticleManager) {
        // Find arrow spawn point (approx left hand position)
        const spawnPos = player.mesh.position.clone();
        spawnPos.y += 1.35; // Shoulder height
        
        // Offset forward and slightly left to match bow position
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.mesh.quaternion);
        const left = new THREE.Vector3(1, 0, 0).applyQuaternion(player.mesh.quaternion);
        
        spawnPos.addScaledVector(forward, 0.8);
        spawnPos.addScaledVector(left, 0.2); // Align with bow hold

        // Create Arrow
        const arrow = ArrowBuilder.buildArrow();
        arrow.position.copy(spawnPos);
        arrow.quaternion.copy(player.mesh.quaternion);
        
        // Add to scene
        if (player.mesh.parent) {
            player.mesh.parent.add(arrow);
        }

        // Launch
        const speed = 20.0;
        // Clone forward to ensure velocity is independent
        const velocity = forward.clone().normalize().multiplyScalar(speed);
        
        this.activeProjectiles.push({
            mesh: arrow,
            velocity: velocity,
            life: 3.0, // Fallback lifetime
            startPos: spawnPos.clone()
        });

        // Emit particle/projectile
        particleManager.emit(spawnPos, 5, 'spark'); 
    }

    private static updateBowLogic(player: Player, dt: number) {
        if (player.isFiringBow && player.bowState === 'release') {
            player.bowTimer += dt;
            if (player.bowTimer > 0.4) { // Recovery time
                player.isFiringBow = false;
                player.bowState = 'draw';
                player.bowCharge = 0;
            }
        }
    }

    private static handleFishingInput(player: Player, dt: number, input: PlayerInput) {
        if (!input.attack1) {
            player.needsReclick = false;
        }
        
        if (player.needsReclick) return;

        if (player.isFishing) {
            if (input.attack1) {
                player.isReeling = true;
            } else {
                player.isReeling = false;
            }
            return;
        }

        if (input.attack1) {
            if (!player.isChargingFishing) {
                player.isChargingFishing = true;
                player.fishingChargeTime = 0;
            }
            player.fishingChargeTime += dt * 3.0;
            player.fishingCharge = (Math.sin(player.fishingChargeTime - Math.PI/2) + 1) / 2;
        } else {
            if (player.isChargingFishing) {
                player.isChargingFishing = false;
                player.isFishing = true; 
                player.isReeling = false;
                player.fishingTimer = 0.3; 
                const weapon = player.model.equippedMeshes.heldItem;
                if (weapon) {
                    const minStr = 0.2; 
                    const str = minStr + player.fishingCharge * (1.0 - minStr);
                    weapon.userData.castStrength = str;
                }
                player.fishingCharge = 0;
            }
        }
    }

    private static updateFishing(player: Player, dt: number) {
        if (player.isFishing) {
            player.fishingTimer += dt;
        } else {
            player.fishingTimer = 0;
        }
    }

    private static playPunch(player: Player) {
        if (!player.isPunch) {
            player.isPunch = true;
            player.punchTimer = 0;
            player.comboChain = 1;
        }
    }

    private static playAxeSwing(player: Player) {
        if (!player.isAxeSwing) {
            player.isAxeSwing = true;
            player.axeSwingTimer = 0;
            player.hasHit = false;
        }
    }

    private static updateAxeSwing(player: Player, dt: number, environment: Environment, particleManager: ParticleManager) {
        if (player.isAxeSwing) {
            player.axeSwingTimer += dt;
            const item = player.config.selectedItem;
            const isAxe = item === 'Axe' || item === 'Halberd';
            const isPick = item === 'Pickaxe';
            
            let duration = 0.9;
            if (item === 'Sword') duration = 0.6;
            if (item === 'Knife') duration = 0.4;
            
            const impactTime = duration * 0.45; // Slightly earlier impact
            
            if (!player.hasHit && player.axeSwingTimer > impactTime) {
                if (isAxe || isPick) {
                    this.checkChoppingImpact(player, environment, particleManager);
                }
                player.hasHit = true;
            }

            if (player.axeSwingTimer > duration) { 
                player.isAxeSwing = false; 
                player.axeSwingTimer = 0; 
                player.hasHit = false;
            }
        }
    }

    private static checkChoppingImpact(player: Player, environment: Environment, particleManager: ParticleManager) {
        // Generous hit range for tree trunks (includes reach + trunk radius)
        const hitRange = 2.0; 
        const playerPos = player.mesh.position;
        
        // Character is rotated by PI in local space, so forward is +Z in its local space.
        // We use applyQuaternion to find world forward.
        const playerForward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.mesh.quaternion).normalize();
        playerForward.y = 0; 

        let closest: THREE.Object3D | null = null;
        let minDist = Infinity;

        for (const obs of environment.obstacles) {
            if (obs.userData.type === 'hard') {
                const obsPos = new THREE.Vector3();
                obs.getWorldPosition(obsPos);
                
                // Calculate horizontal distance to center of obstacle
                const dx = obsPos.x - playerPos.x;
                const dz = obsPos.z - playerPos.z;
                const distXZ = Math.sqrt(dx * dx + dz * dz);

                if (distXZ < hitRange) {
                    const dirToObs = new THREE.Vector3(dx, 0, dz).normalize();
                    const dot = playerForward.dot(dirToObs);

                    // Impact in a ~140 degree front cone
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
             closest.getWorldPosition(obsPos);
             
             // Visual hit point roughly at weapon tip height
             const impactPos = playerPos.clone().lerp(obsPos, 0.5);
             impactPos.y += 1.1; 

             const materialType = environment.damageObstacle(closest, 1);
             
             if (materialType === 'wood') {
                 particleManager.emit(impactPos, 12, 'wood');
             } else if (materialType === 'stone') {
                 particleManager.emit(impactPos, 15, 'spark');
             }
        }
    }

    private static updatePunchCombo(player: Player, dt: number, input: PlayerInput, obstacles: THREE.Object3D[]) {
        if (!player.isPunch) return;

        player.punchTimer += dt;
        const t = player.punchTimer;
        
        if (t > 0.2 && t < 0.4) {
            PlayerPhysics.applyForwardImpulse(player, dt, 2.0, obstacles);
        }
        if (player.comboChain >= 2 && t > 0.8 && t < 1.0) {
            PlayerPhysics.applyForwardImpulse(player, dt, 2.0, obstacles);
        }
        if (player.comboChain >= 3 && t > 1.4 && t < 1.6) {
            PlayerPhysics.applyForwardImpulse(player, dt, 2.5, obstacles);
        }

        const punch1Dur = 0.6;
        const punch2Dur = 1.2;
        const punch3Dur = 1.8;
        const isHolding = input.attack1 || false;

        if (player.comboChain === 1 && t > punch1Dur) {
            if (isHolding) player.comboChain = 2;
            else { player.isPunch = false; player.punchTimer = 0; }
        } else if (player.comboChain === 2 && t > punch2Dur) {
            if (isHolding) player.comboChain = 3;
            else { player.isPunch = false; player.punchTimer = 0; }
        } else if (player.comboChain === 3 && t > punch3Dur) {
            player.isPunch = false;
            player.comboChain = 1;
            player.punchTimer = 0;
        }
    }
}
