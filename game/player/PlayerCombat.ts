import * as THREE from 'three';
import type { Player } from './Player';
import { PlayerInput } from '../../types';
import { ParticleManager } from '../managers/ParticleManager';
import { ArrowBuilder } from '../model/equipment/weapons/ArrowBuilder';

export interface Projectile {
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    life: number;
    startPos: THREE.Vector3;
    type: 'arrow' | 'fireball' | 'heal';
    owner?: any; 
}

export class PlayerCombat {
    private player: Player;
    
    // State
    isCombatStance: boolean = false;
    wasCombatKeyPressed: boolean = false;
    wasAttack1Pressed: boolean = false;
    wasAttack2Pressed: boolean = false;
    wasFireballKeyPressed: boolean = false;

    // Attacks
    isAxeSwing: boolean = false;
    axeSwingTimer: number = 0;
    hasHit: boolean = false;
    isPunch: boolean = false;
    punchTimer: number = 0;
    comboChain: number = 0; 

    // Fireball
    isFireballCasting: boolean = false;
    fireballTimer: number = 0;
    hasSpawnedFireball: boolean = false;

    // Summoning (kept here as it's an "action")
    isSummoning: boolean = false;
    summonTimer: number = 0;

    // Bow
    isFiringBow: boolean = false;
    bowState: 'draw' | 'hold' | 'release' = 'draw';
    bowCharge: number = 0;
    bowTimer: number = 0;

    // Fishing
    isFishing: boolean = false;
    isReeling: boolean = false;
    fishingTimer: number = 0;
    isChargingFishing: boolean = false;
    fishingCharge: number = 0;
    fishingChargeTime: number = 0;
    needsReclick: boolean = false;

    // Projectiles
    static activeProjectiles: Projectile[] = [];
    private static _tempBox1 = new THREE.Box3();
    private static _tempBox2 = new THREE.Box3();

    private static readonly _tempVec1 = new THREE.Vector3();
    private static readonly _tempVec2 = new THREE.Vector3();
    private static readonly _tempQuat = new THREE.Quaternion();

    constructor(player: Player) {
        this.player = player;
    }

    update(dt: number, input: PlayerInput, environment: any, particleManager: ParticleManager, entities: any[] = []) {
        // Projectiles are updated globally by Game.ts, but if not, we can do it here?
        // Game.ts calls PlayerCombat.updateProjectiles.
        // So we don't need to call it here if Game.ts does it.
        // But Player.ts calls this.combat.update.
        // If we remove it from here, Player projectiles won't update if Game.ts doesn't call it.
        // But Game.ts DOES call it (line 350).
        // So I will remove it from here to avoid double update.
        
        // Input Handling
        this.handleInput(dt, input, particleManager);

        // Logic Updates
        this.updateAxeSwing(dt, environment, particleManager, entities);
        this.updateFishing(dt);
        this.updateBowLogic(dt);
        this.updatePunchCombo(dt, input, environment.obstacles);
        this.updateFireballLogic(dt, particleManager);
        this.updateSummoning(dt, input);
    }

    private handleInput(dt: number, input: PlayerInput, particleManager: ParticleManager) {
        // Combat Stance Toggle
        if (input.combat && !this.wasCombatKeyPressed) {
            this.isCombatStance = !this.isCombatStance;
        }
        this.wasCombatKeyPressed = !!input.combat;

        // Fireball
        const isFireballPressed = !!input.fireball;
        if (isFireballPressed && !this.wasFireballKeyPressed) {
            this.handleFireballInput();
        }
        this.wasFireballKeyPressed = isFireballPressed;

        // Summoning
        if (input.summon && !this.isSummoning && !this.player.config.selectedItem && !this.player.locomotion.isJumping) {
            this.isSummoning = true;
            this.summonTimer = 0;
        }

        // Weapon Specifics
        if (this.player.config.selectedItem === 'Fishing Pole') {
            this.handleFishingInput(dt, input);
        } else if (this.player.config.selectedItem === 'Bow') {
            this.handleBowInput(dt, input, particleManager);
        } else {
            // Melee
            if (input.attack1) {
                if (this.player.config.selectedItem) {
                    this.playAxeSwing();
                } else {
                    this.playPunch();
                }
            }
            if (input.attack2) {
                if (this.player.config.selectedItem) {
                    this.playAxeSwing();
                }
            }
            
            // Cleanup bow state if not holding bow
            if (this.isFiringBow) {
                this.isFiringBow = false;
                this.bowState = 'draw';
            }
        }

        this.wasAttack1Pressed = !!input.attack1;
        this.wasAttack2Pressed = !!input.attack2;
    }

    static spawnProjectile(
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
        
        PlayerCombat.activeProjectiles.push({
            mesh,
            velocity,
            life,
            startPos: spawnPos,
            type,
            owner
        });
    }

    static updateProjectiles(dt: number, environment: any, particleManager: ParticleManager, entities: any[]) {
        for (let i = PlayerCombat.activeProjectiles.length - 1; i >= 0; i--) {
            const p = PlayerCombat.activeProjectiles[i];
            
            // Move
            this._tempVec1.copy(p.velocity).multiplyScalar(dt);
            p.mesh.position.add(this._tempVec1);
            
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

            // Check Collision
            if (PlayerCombat.checkProjectileCollision(p, environment, particleManager, entities)) {
                if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                PlayerCombat.activeProjectiles.splice(i, 1);
                continue;
            }

            // Check Max Distance
            if (p.mesh.position.distanceTo(p.startPos) > 40.0) {
                 if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                 PlayerCombat.activeProjectiles.splice(i, 1);
                 continue;
            }

            p.life -= dt;
            if (p.life <= 0) {
                if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                PlayerCombat.activeProjectiles.splice(i, 1);
            }
        }
    }

    private static checkProjectileCollision(p: Projectile, environment: any, particleManager: ParticleManager, entities: any[]): boolean {
        const pos = p.mesh.position;
        // 1. Check Obstacles
        for (const obs of environment.obstacles) {
            obs.getWorldPosition(this._tempVec1);
            
            const dist = pos.distanceTo(this._tempVec1);
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
            if (ent && !ent.isDead) {
                if (p.owner === ent) continue; // Don't hit self

                let hitboxParts: THREE.Object3D[] = [];
                if (typeof ent.getHitboxParts === 'function') {
                    hitboxParts = ent.getHitboxParts();
                } else if (ent.hitbox) {
                    hitboxParts = ent.hitbox.children;
                }

                const projectilePoint = pos;
                let hit = false;
                
                for (const part of hitboxParts) {
                    if (part instanceof THREE.Mesh || part instanceof THREE.Group) {
                        // For Groups, setFromObject calculates AABB of all children
                        // For Meshes, it calculates AABB of geometry transformed by world matrix
                        // updateMatrixWorld should be called to ensure accuracy
                        // Note: Calling updateMatrixWorld on every frame for every part might be expensive, 
                        // but usually the scene update handles it. We force it just in case.
                        // part.updateMatrixWorld(true); 
                        
                        PlayerCombat._tempBox1.setFromObject(part);
                        if (PlayerCombat._tempBox1.containsPoint(projectilePoint)) {
                            hit = true;
                            break;
                        }
                    }
                }

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

    private handleFireballInput() {
        if (!this.isFireballCasting && !this.player.status.isDead) {
            this.isFireballCasting = true;
            this.fireballTimer = 0;
            this.hasSpawnedFireball = false;
        }
    }

    private updateFireballLogic(dt: number, particleManager: ParticleManager) {
        if (this.isFireballCasting) {
            this.fireballTimer += dt;
            
            if (!this.hasSpawnedFireball && this.fireballTimer < 0.4) {
                if (Math.random() > 0.5) {
                    PlayerCombat._tempVec1.copy(this.player.mesh.position);
                    PlayerCombat._tempVec1.y += 1.3;
                    PlayerCombat._tempVec2.set(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
                    PlayerCombat._tempVec1.addScaledVector(PlayerCombat._tempVec2, 0.4);
                    particleManager.emit(PlayerCombat._tempVec1, 1, 'spark');
                }
            }

            if (!this.hasSpawnedFireball && this.fireballTimer >= 0.4) {
                this.spawnFireball(particleManager);
                this.hasSpawnedFireball = true;
            }

            if (this.fireballTimer >= 0.8) {
                this.isFireballCasting = false;
                this.fireballTimer = 0;
            }
        }
    }

    private spawnFireball(particleManager: ParticleManager) {
        PlayerCombat._tempVec1.copy(this.player.mesh.position);
        PlayerCombat._tempVec1.y += 1.35; 
        
        PlayerCombat._tempVec2.set(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
        PlayerCombat._tempVec1.addScaledVector(PlayerCombat._tempVec2, 1.0);

        PlayerCombat.spawnProjectile(this.player.scene, PlayerCombat._tempVec1, PlayerCombat._tempVec2, 'fireball', this.player);
        particleManager.emit(PlayerCombat._tempVec1, 10, 'spark'); 
    }

    private handleBowInput(dt: number, input: PlayerInput, particleManager: ParticleManager) {
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

            if (this.bowState === 'draw') {
                this.bowTimer += dt;
                this.bowCharge = Math.min(1.0, this.bowTimer / 0.6); 
                
                if (this.bowCharge >= 1.0) {
                    this.bowState = 'hold';
                }
            }
        } else {
            // RELEASE
            if (this.isFiringBow && (this.bowState === 'draw' || this.bowState === 'hold')) {
                this.bowState = 'release';
                this.bowTimer = 0;
                
                if (this.bowCharge > 0.25) {
                    this.fireArrow(particleManager);
                } else {
                    this.isFiringBow = false;
                    this.bowState = 'draw';
                    this.bowCharge = 0;
                }
            }
        }
    }

    private fireArrow(particleManager: ParticleManager) {
        PlayerCombat._tempVec1.copy(this.player.mesh.position);
        PlayerCombat._tempVec1.y += 1.35; 
        
        const forward = PlayerCombat._tempVec2.set(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
        const left = PlayerCombat._tempVec1.clone(); // Need to not overwrite tempVec1 yet, or use a 3rd temp
        left.set(1, 0, 0).applyQuaternion(this.player.mesh.quaternion);
        
        PlayerCombat._tempVec1.addScaledVector(forward, 0.8);
        PlayerCombat._tempVec1.addScaledVector(left, 0.2); 

        PlayerCombat.spawnProjectile(this.player.scene, PlayerCombat._tempVec1, forward, 'arrow', this.player);
        particleManager.emit(PlayerCombat._tempVec1, 5, 'spark'); 
    }

    private updateBowLogic(dt: number) {
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

    private handleFishingInput(dt: number, input: PlayerInput) {
        if (!input.attack1) {
            this.needsReclick = false;
        }
        
        if (this.needsReclick) return;

        if (this.isFishing) {
            if (input.attack1) {
                this.isReeling = true;
            } else {
                this.isReeling = false;
            }
            return;
        }

        if (input.attack1) {
            if (!this.isChargingFishing) {
                this.isChargingFishing = true;
                this.fishingChargeTime = 0;
            }
            this.fishingChargeTime += dt * 3.0;
            this.fishingCharge = (Math.sin(this.fishingChargeTime - Math.PI/2) + 1) / 2;
        } else {
            if (this.isChargingFishing) {
                this.isChargingFishing = false;
                this.isFishing = true; 
                this.isReeling = false;
                this.fishingTimer = 0.3; 
                const weapon = this.player.model.equippedMeshes.heldItem;
                if (weapon) {
                    const minStr = 0.2; 
                    const str = minStr + this.fishingCharge * (1.0 - minStr);
                    weapon.userData.castStrength = str;
                }
                this.fishingCharge = 0;
            }
        }
    }

    private updateFishing(dt: number) {
        if (this.isFishing) {
            this.fishingTimer += dt;
        } else {
            this.fishingTimer = 0;
        }
    }

    private playPunch() {
        if (!this.isPunch) {
            this.isPunch = true;
            this.punchTimer = 0;
            this.comboChain = 1;
        }
    }

    private playAxeSwing() {
        if (!this.isAxeSwing) {
            this.isAxeSwing = true;
            this.axeSwingTimer = 0;
            this.hasHit = false;
        }
    }

    private getWeaponDamage(item: string | null): number {
        if (item === 'Sword') return 5;
        if (item === 'Axe') return 4;
        if (item === 'Pickaxe') return 3;
        if (item === 'Halberd') return 4;
        return 1; 
    }

    private updateAxeSwing(dt: number, environment: any, particleManager: ParticleManager, entities: any[]) {
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

    private checkChoppingImpact(environment: any, particleManager: ParticleManager, entities: any[]) {
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

        PlayerCombat._tempBox1.setFromObject(dealer);
        PlayerCombat._tempBox1.expandByScalar(0.25);

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
                            PlayerCombat._tempBox2.setFromObject(part);
                            if (PlayerCombat._tempBox1.intersectsBox(PlayerCombat._tempBox2)) {
                                hit = true;
                                break;
                            }
                        }
                    }

                    if (hit) {
                        ent.takeDamage(damage);
                        const impactPoint = new THREE.Vector3();
                        PlayerCombat._tempBox1.getCenter(impactPoint);
                        // Emit blood/flesh effect for entities, wood for objects is handled below
                        particleManager.emit(impactPoint, 10, 'spark'); 
                        return; 
                    }
                }
            }
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
             } else if (materialType === 'stone') {
                 particleManager.emit(impactPos, 15, 'spark');
             }
        }
    }

    private updatePunchCombo(dt: number, input: PlayerInput, obstacles: THREE.Object3D[]) {
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

    private updateSummoning(dt: number, input: PlayerInput) {
        if (this.isSummoning) {
            if (input.x !== 0 || input.y !== 0 || input.jump) {
                this.isSummoning = false;
                this.summonTimer = 0;
            } else {
                this.summonTimer += dt;
                if (this.summonTimer > 6.0) {
                    this.isSummoning = false;
                    this.summonTimer = 0;
                }
            }
        }
    }

    clearActionStates() {
        this.isFireballCasting = false;
        this.fireballTimer = 0;
        this.isSummoning = false;
        this.summonTimer = 0;
        this.isFishing = false;
        this.isChargingFishing = false;
        this.isFiringBow = false;
        this.bowState = 'draw';
    }
}
