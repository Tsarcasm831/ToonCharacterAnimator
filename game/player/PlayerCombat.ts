
import * as THREE from 'three';
import type { Player } from './Player';
import { PlayerInput } from '../../types';
import { PlayerPhysics } from './PlayerPhysics';
import { ParticleManager } from '../managers/ParticleManager';
import { Environment } from '../environment/Environment';
import { ArrowBuilder } from '../model/equipment/ArrowBuilder';
import { Wolf } from '../entities/animal/aggressive/Wolf';
import { Bear } from '../entities/animal/aggressive/Bear';
import { Yeti } from '../entities/animal/neutral/Yeti';
import { Deer } from '../entities/animal/neutral/Deer';
import { Chicken } from '../entities/animal/neutral/Chicken';
import { Pig } from '../entities/animal/neutral/Pig';
import { Sheep } from '../entities/animal/neutral/Sheep';
import { Spider } from '../entities/animal/aggressive/Spider';
import { Lizard } from '../entities/animal/neutral/Lizard';
import { Horse } from '../entities/animal/tameable/Horse';

export interface Projectile {
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    life: number;
    startPos: THREE.Vector3;
    type: 'arrow' | 'fireball' | 'heal';
    owner?: any; // To prevent friendly fire if needed
}

export class PlayerCombat {
    private static _tempBox1 = new THREE.Box3();
    private static _tempBox2 = new THREE.Box3();
    private static _tempVec = new THREE.Vector3();
    public static activeProjectiles: Projectile[] = [];

    public static spawnProjectile(
        scene: THREE.Scene,
        startPos: THREE.Vector3,
        direction: THREE.Vector3,
        type: 'arrow' | 'fireball' | 'heal',
        owner?: any
    ) {
        const spawnPos = startPos.clone();
        
        let mesh: THREE.Object3D;
        let speed = 20.0;
        let life = 3.0;

        if (type === 'fireball') {
            const geo = new THREE.SphereGeometry(0.2, 16, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xff4400,
                emissive: 0xff8800,
                emissiveIntensity: 5.0,
                transparent: true,
                opacity: 0.9
            });
            mesh = new THREE.Mesh(geo, mat);
            speed = 25.0;
            life = 2.0;
        } else if (type === 'heal') {
            const geo = new THREE.SphereGeometry(0.2, 16, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                emissive: 0x44ff44,
                emissiveIntensity: 2.0,
                transparent: true,
                opacity: 0.8
            });
            mesh = new THREE.Mesh(geo, mat);
            speed = 15.0;
            life = 2.0;
        } else {
            // Arrow
            mesh = ArrowBuilder.buildArrow();
            if (owner && owner.model && owner.model.group) {
                mesh.quaternion.copy(owner.model.group.quaternion);
            }
        }

        mesh.position.copy(spawnPos);
        scene.add(mesh);

        const velocity = direction.clone().normalize().multiplyScalar(speed);
        
        this.activeProjectiles.push({
            mesh,
            velocity,
            life,
            startPos: spawnPos,
            type,
            owner
        });

        // Add initial particles
        // Note: we need access to particleManager. 
        // For now we skip immediate particle emit on spawn from static method unless we pass it.
        // The update loop will handle trail particles if we want.
    }

    static updateProjectiles(dt: number, environment: any, particleManager: ParticleManager, entities: any[] = []) {
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const p = this.activeProjectiles[i];
            
            // Move
            const moveStep = p.velocity.clone().multiplyScalar(dt);
            p.mesh.position.add(moveStep);
            
            // Fireball visuals
            if (p.type === 'fireball') {
                p.mesh.rotation.y += dt * 10;
                p.mesh.rotation.z += dt * 5;
                const scale = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
                p.mesh.scale.setScalar(scale);
                
                // Trail
                if (Math.random() > 0.4) {
                    particleManager.emit(p.mesh.position, 1, 'spark');
                }
            }

            // Check Collision (Environment & Entities)
            // Pass null as owner for environment check (not needed) but important for entity check
            if (this.checkProjectileCollision(p, environment, particleManager, entities)) {
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
    }

    static update(player: Player, dt: number, input: PlayerInput, environment: any, particleManager: ParticleManager, entities: any[] = []) {
        // Player input handling
        const isFireballPressed = !!input.fireball;
        if (isFireballPressed && !player.wasFireballKeyPressed) {
            this.handleFireballInput(player, dt, input, particleManager);
        }
        player.wasFireballKeyPressed = isFireballPressed;

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
            
            // Cleanup bow state if not holding bow
            if (player.isFiringBow) {
                player.isFiringBow = false;
                player.bowState = 'draw';
            }
        }

        // Update Input History
        player.wasAttack1Pressed = !!input.attack1;
        player.wasAttack2Pressed = !!input.attack2;

        // Update Timers & Logic
        this.updateAxeSwing(player, dt, environment, particleManager, entities);
        this.updateFishing(player, dt);
        this.updateBowLogic(player, dt);
        this.updatePunchCombo(player, dt, input, environment.obstacles);
        this.updateFireballLogic(player, dt, particleManager);
    }

    private static checkProjectileCollision(p: Projectile, environment: any, particleManager: ParticleManager, entities: any[]): boolean {
        const pos = p.mesh.position;
        // 1. Check Obstacles (Trees/Rocks)
        for (const obs of environment.obstacles) {
            const obsPos = new THREE.Vector3();
            obs.getWorldPosition(obsPos);
            
            const dist = pos.distanceTo(obsPos);
            if (dist < 1.5) {
                const matType = obs.userData.type === 'hard' ? 'stone' : 'wood';
                if (p.type === 'fireball') {
                    particleManager.emit(pos, 15, 'spark');
                    environment.damageObstacle(obs, 2);
                } else {
                    particleManager.emit(pos, 5, matType === 'stone' ? 'spark' : 'wood');
                }
                return true;
            }
        }

        // 2. Check Entities
        for (const ent of entities) {
            if (ent && ent.hitbox && !ent.isDead) {
                const projectilePoint = pos;
                let hit = false;
                ent.hitbox.children.forEach(part => {
                    if (part instanceof THREE.Mesh) {
                        part.updateMatrixWorld(true);
                        this._tempBox1.setFromObject(part);
                        if (this._tempBox1.containsPoint(projectilePoint)) {
                            hit = true;
                        }
                    }
                });

                if (hit) {
                    const damage = p.type === 'fireball' ? 15 : 5;
                    ent.takeDamage(damage); 
                    if (p.type === 'fireball') {
                        particleManager.emit(pos, 20, 'spark');
                    } else {
                        particleManager.emit(pos, 8, 'wood');
                    }
                    return true;
                }
            }
        }

        return false;
    }

    private static handleFireballInput(player: Player, dt: number, input: PlayerInput, particleManager: ParticleManager) {
        if (!player.isFireballCasting && !player.status.isDead) {
            player.isFireballCasting = true;
            player.fireballTimer = 0;
            player.hasSpawnedFireball = false;
        }
    }

    private static updateFireballLogic(player: Player, dt: number, particleManager: ParticleManager) {
        if (player.isFireballCasting) {
            player.fireballTimer += dt;
            
            // Energy build particles
            if (!player.hasSpawnedFireball && player.fireballTimer < 0.4) {
                if (Math.random() > 0.5) {
                    const spawnPos = player.mesh.position.clone();
                    spawnPos.y += 1.3;
                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.mesh.quaternion);
                    spawnPos.addScaledVector(forward, 0.4);
                    particleManager.emit(spawnPos, 1, 'spark');
                }
            }

            if (!player.hasSpawnedFireball && player.fireballTimer >= 0.4) {
                this.spawnFireball(player, particleManager);
                player.hasSpawnedFireball = true;
            }

            if (player.fireballTimer >= 0.8) {
                player.isFireballCasting = false;
                player.fireballTimer = 0;
            }
        }
    }

    private static spawnFireball(player: Player, particleManager: ParticleManager) {
        const spawnPos = player.mesh.position.clone();
        spawnPos.y += 1.35; 
        
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.mesh.quaternion);
        spawnPos.addScaledVector(forward, 1.0);

        const fireballGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const fireballMat = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            emissive: 0xff8800,
            emissiveIntensity: 5.0,
            transparent: true,
            opacity: 0.9
        });
        
        const fireball = new THREE.Mesh(fireballGeo, fireballMat);
        fireball.position.copy(spawnPos);
        
        if (player.mesh.parent) {
            player.mesh.parent.add(fireball);
        }

        const speed = 25.0;
        const velocity = forward.clone().normalize().multiplyScalar(speed);
        
        this.activeProjectiles.push({
            mesh: fireball,
            velocity: velocity,
            life: 2.0,
            startPos: spawnPos.clone(),
            type: 'fireball'
        });

        particleManager.emit(spawnPos, 10, 'spark'); 
    }

    private static handleBowInput(player: Player, dt: number, input: PlayerInput, particleManager: ParticleManager) {
        // If in release phase, only return if the timer hasn't finished. 
        if (player.bowState === 'release' && player.bowTimer < 0.3) {
            return; 
        }

        if (input.attack1) {
            // DRAW / CHARGE
            if (!player.isFiringBow || player.bowState === 'release') {
                player.isFiringBow = true;
                player.bowState = 'draw';
                player.bowCharge = 0;
                player.bowTimer = 0;
            }

            if (player.bowState === 'draw') {
                player.bowTimer += dt;
                player.bowCharge = Math.min(1.0, player.bowTimer / 0.6); 
                
                if (player.bowCharge >= 1.0) {
                    player.bowState = 'hold';
                }
            }
        } else {
            // RELEASE
            if (player.isFiringBow && (player.bowState === 'draw' || player.bowState === 'hold')) {
                player.bowState = 'release';
                player.bowTimer = 0;
                
                if (player.bowCharge > 0.25) {
                    this.fireArrow(player, particleManager);
                } else {
                    // Canceled or short draw
                    player.isFiringBow = false;
                    player.bowState = 'draw';
                    player.bowCharge = 0;
                }
            }
        }
    }

    private static fireArrow(player: Player, particleManager: ParticleManager) {
        const spawnPos = player.mesh.position.clone();
        spawnPos.y += 1.35; 
        
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.mesh.quaternion);
        const left = new THREE.Vector3(1, 0, 0).applyQuaternion(player.mesh.quaternion);
        
        spawnPos.addScaledVector(forward, 0.8);
        spawnPos.addScaledVector(left, 0.2); 

        const arrow = ArrowBuilder.buildArrow();
        arrow.position.copy(spawnPos);
        arrow.quaternion.copy(player.mesh.quaternion);
        
        if (player.mesh.parent) {
            player.mesh.parent.add(arrow);
        }

        const speed = 20.0;
        const velocity = forward.clone().normalize().multiplyScalar(speed);
        
        this.activeProjectiles.push({
            mesh: arrow,
            velocity: velocity,
            life: 3.0,
            startPos: spawnPos.clone(),
            type: 'arrow'
        });

        particleManager.emit(spawnPos, 5, 'spark'); 
    }

    private static updateBowLogic(player: Player, dt: number) {
        if (player.isFiringBow && player.bowState === 'release') {
            player.bowTimer += dt;
            if (player.bowTimer > 0.45) { // Slightly longer for full animation settle
                player.isFiringBow = false;
                player.bowState = 'draw';
                player.bowCharge = 0;
                player.bowTimer = 0;
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

    private static getWeaponDamage(item: string | null): number {
        if (item === 'Sword') return 5;
        if (item === 'Axe') return 4;
        if (item === 'Pickaxe') return 3;
        if (item === 'Halberd') return 4;
        return 1; 
    }

    private static updateAxeSwing(player: Player, dt: number, environment: any, particleManager: ParticleManager, entities: any[]) {
        if (player.isAxeSwing) {
            player.axeSwingTimer += dt;
            const item = player.config.selectedItem;
            
            let duration = 0.9;
            if (item === 'Sword') duration = 0.6;
            if (item === 'Knife') duration = 0.4;
            
            const impactTime = duration * 0.5; 
            
            if (!player.hasHit && player.axeSwingTimer > impactTime) {
                this.checkChoppingImpact(player, environment, particleManager, entities);
                player.hasHit = true;
            }

            if (player.axeSwingTimer > duration) { 
                player.isAxeSwing = false; 
                player.axeSwingTimer = 0; 
                player.hasHit = false;
            }
        }
    }

    private static checkChoppingImpact(player: Player, environment: any, particleManager: ParticleManager, entities: any[]) {
        player.model.group.updateMatrixWorld(true);

        const playerPos = player.mesh.position;
        const damage = this.getWeaponDamage(player.config.selectedItem);
        
        let dealer: THREE.Object3D | null = null;
        if (player.config.selectedItem) {
            dealer = player.model.equippedMeshes.heldItem || null;
            if (dealer) {
                const subPart = dealer.getObjectByName('damagePart');
                if (subPart) dealer = subPart;
            }
        } else {
            dealer = player.model.parts.rightHand;
        }

        if (!dealer) return;

        this._tempBox1.setFromObject(dealer);
        this._tempBox1.expandByScalar(0.25);

        for (const ent of entities) {
            if (ent && ent.hitbox && !ent.isDead) {
                if (playerPos.distanceTo(ent.group.position) < 4.5) {
                    let hit = false;
                    ent.hitbox.children.forEach(part => {
                        if (part instanceof THREE.Mesh) {
                            part.updateMatrixWorld(true);
                            this._tempBox2.setFromObject(part);
                            if (this._tempBox1.intersectsBox(this._tempBox2)) {
                                hit = true;
                            }
                        }
                    });

                    if (hit) {
                        ent.takeDamage(damage);
                        const impactPoint = new THREE.Vector3();
                        this._tempBox1.getCenter(impactPoint);
                        particleManager.emit(impactPoint, 10, 'wood'); 
                        return; 
                    }
                }
            }
        }

        const item = player.config.selectedItem;
        const canChop = item === 'Axe' || item === 'Pickaxe' || item === 'Halberd';
        if (!canChop) return;

        const playerForward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.mesh.quaternion).normalize();
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
             closest.getWorldPosition(obsPos);
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
