import * as THREE from 'three';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';

// ============================================================================
// WildWolf — a reusable, territory-parameterized wolf.
//
// Unlike Wolf.ts (hard-locked to the starter grove rectangle), WildWolf is
// anchored to a configurable den: it wanders within `wanderRadius`, chases
// targets that come within `aggroRange`, and gives up the chase ("leashes")
// when it strays farther than `leashRadius` from its den. Damage to the
// target is delivered via the `onAttackTarget` callback so this class stays
// free of any knowledge about the player or game-mode state.
//
// This file lives in the shared engine layer and must NOT import from RPG/.
// The options interface below mirrors `WildWolfOptions` in RPG/types.ts.
// ============================================================================

export interface WildWolfOptions {
    /** Leash anchor; wolf wanders within wanderRadius and gives up chase beyond leashRadius. */
    den: { x: number; z: number };
    wanderRadius?: number;   // default 18
    leashRadius?: number;    // default 38
    aggroRange?: number;     // default 14
    attackRange?: number;    // default 2.1
    attackCooldown?: number; // default 1.6
    maxHealth?: number;      // default 20
    attackDamage?: number;   // default 9
    moveSpeed?: number;      // default 3.4
    chaseSpeed?: number;     // default 6.2
    /** Called when an attack lands on the target (player). */
    onAttackTarget?: (damage: number) => void;
    /** Extra damage added to every hit the wolf RECEIVES (player gear/level scaling). */
    getIncomingDamageBonus?: () => number;
    /** Ground height sampler; defaults to PlayerUtils.getTerrainHeight. */
    terrainHeightAt?: (x: number, z: number) => number;
}

export enum WildWolfState { IDLE, PATROL, CHASE, ATTACK, RETURN, DEAD }

/** Seconds after lunge start at which the bite connects. */
const LUNGE_HIT_TIME = 0.3;
/** Total duration of the lunge animation. */
const LUNGE_DURATION = 0.45;
/** Duration of the fall-over animation after death. */
const DEATH_SETTLE_DURATION = 0.4;

export class WildWolf {
    public scene: THREE.Scene;
    public group: THREE.Group;
    public hitbox: THREE.Group;
    public model: any;
    public position: THREE.Vector3 = new THREE.Vector3();
    public rotationY: number = 0;
    public state: WildWolfState = WildWolfState.IDLE;
    public isDead: boolean = false;
    public isSkinned: boolean = false;
    public health: number;
    public maxHealth: number;

    // -- Territory / combat tuning (resolved from options) ---------------------
    private readonly den: { x: number; z: number };
    private readonly wanderRadius: number;
    private readonly leashRadius: number;
    private readonly aggroRange: number;
    private readonly attackRange: number;
    private readonly attackCooldown: number;
    private readonly attackDamage: number;
    private readonly moveSpeed: number;
    private readonly chaseSpeed: number;
    private readonly onAttackTarget?: (damage: number) => void;
    private readonly getIncomingDamageBonus?: () => number;
    private readonly terrainHeightAt: (x: number, z: number) => number;

    // -- FSM internals -----------------------------------------------------------
    private stateTimer: number = 0;
    private idleDuration: number = 2.0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3; isDead?: boolean } | null = null;
    private attackCooldownTimer: number = 0;
    /** While > 0, the wolf was recently damaged and will chase well beyond aggroRange. */
    private provokedTimer: number = 0;

    // -- Lunge attack -----------------------------------------------------------------
    private lungeActive: boolean = false;
    private lungeTimer: number = 0;
    private lungeHitPending: boolean = false;
    private lungeTarget: { position: THREE.Vector3; isDead?: boolean } | null = null;

    // -- Locomotion / animation -----------------------------------------------------------
    private walkTime: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private readonly collisionSize = new THREE.Vector3(0.8, 0.8, 1.3);
    private readonly sizeScale: number;
    private headTurnTimer: number = 0;
    private headTurnTarget: number = 0;
    private deathTimer: number = 0;
    private disposed: boolean = false;

    // -- Visuals --------------------------------------------------------------------------
    private furMaterial: THREE.MeshStandardMaterial;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    private readonly disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, options: WildWolfOptions) {
        this.scene = scene;
        this.den = { x: options.den.x, z: options.den.z };
        this.wanderRadius = options.wanderRadius ?? 18;
        this.leashRadius = options.leashRadius ?? 38;
        this.aggroRange = options.aggroRange ?? 14;
        this.attackRange = options.attackRange ?? 2.1;
        this.attackCooldown = options.attackCooldown ?? 1.6;
        this.maxHealth = options.maxHealth ?? 20;
        this.health = this.maxHealth;
        this.attackDamage = options.attackDamage ?? 9;
        this.moveSpeed = options.moveSpeed ?? 3.4;
        this.chaseSpeed = options.chaseSpeed ?? 6.2;
        this.onAttackTarget = options.onAttackTarget;
        this.getIncomingDamageBonus = options.getIncomingDamageBonus;
        this.terrainHeightAt = options.terrainHeightAt ?? ((x, z) => PlayerUtils.getTerrainHeight(x, z));

        this.position.copy(initialPos);
        this.lastStuckPos.copy(this.position);
        this.walkTime = Math.random() * Math.PI * 2;
        this.idleDuration = 1 + Math.random() * 2;

        // Per-instance variation: scale 0.9-1.15, grey-brown tint range.
        this.sizeScale = 0.9 + Math.random() * 0.25;
        const tint = new THREE.Color(0x6e6258).offsetHSL(
            (Math.random() - 0.5) * 0.03,
            (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.12
        );

        const wolfData = ObjectFactory.createWolfModel(tint.getHex());
        this.model = wolfData;
        this.model.group.scale.setScalar(this.sizeScale);

        // FaunaFactory caches one material per color; clone it so per-instance
        // effects (hit flash, skinned darkening, dispose) never leak to others.
        let sourceMat: THREE.MeshStandardMaterial | null = null;
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && !sourceMat) sourceMat = obj.material;
        });
        this.furMaterial = sourceMat
            ? (sourceMat as THREE.MeshStandardMaterial).clone()
            : new THREE.MeshStandardMaterial({ color: tint, flatShading: true });
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh) obj.material = this.furMaterial;
        });
        this.disposables.push(this.furMaterial);

        this.group = new THREE.Group();
        this.group.add(this.model.group);
        this.group.userData = { type: 'creature', parent: this, entityType: 'wolf' };

        // Separate invisible hitbox (Pig pattern) so collision/raycast tagging
        // never interferes with the visual model.
        this.hitbox = new THREE.Group();
        const hitboxGeo = new THREE.BoxGeometry(0.8, 1.0, 1.6);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        this.disposables.push(hitboxGeo, hitboxMat);
        const hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitboxMesh.position.y = 0.6 * this.sizeScale;
        hitboxMesh.scale.setScalar(this.sizeScale);
        this.hitbox.add(hitboxMesh);
        this.group.add(this.hitbox);
        this.hitbox.userData = { type: 'creature', parent: this, entityType: 'wolf' };
        this.hitbox.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.userData = { ...child.userData, type: 'creature', parent: this, entityType: 'wolf' };
            }
        });

        // Health bar (billboarded toward scene.userData.camera; shown only when
        // damaged or actively hunting).
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 1.7 * this.sizeScale, 0);
        const bgGeo = new THREE.PlaneGeometry(1.0, 0.15);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        this.disposables.push(bgGeo, bgMat);
        this.healthBarGroup.add(new THREE.Mesh(bgGeo, bgMat));
        const fgGeo = new THREE.PlaneGeometry(0.96, 0.11);
        fgGeo.translate(0.48, 0, 0);
        const fgMat = new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide });
        this.disposables.push(fgGeo, fgMat);
        this.healthBarFill = new THREE.Mesh(fgGeo, fgMat);
        this.healthBarFill.position.set(-0.48, 0, 0.01);
        this.healthBarGroup.add(this.healthBarFill);
        this.healthBarGroup.visible = false;
        this.group.add(this.healthBarGroup);

        this.position.y = this.terrainHeightAt(this.position.x, this.position.z) + 0.05;
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    // =====================================================================
    // Update
    // =====================================================================

    update(
        dt: number,
        environment: { obstacles: THREE.Object3D[] },
        potentialTargets: { position: THREE.Vector3; isDead?: boolean }[],
        skipAnimation: boolean = false
    ): void {
        if (this.isDead) {
            this.settleCorpse(dt);
            return;
        }

        this.stateTimer += dt;
        if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
        if (this.provokedTimer > 0) this.provokedTimer -= dt;

        const distFromDen = Math.hypot(this.position.x - this.den.x, this.position.z - this.den.z);
        this.updateTargetSelection(potentialTargets);
        this.updateStateMachine(distFromDen);
        this.updateLunge(dt);

        // -- Movement ------------------------------------------------------
        let speed = 0;
        if (this.state === WildWolfState.PATROL) speed = this.moveSpeed;
        else if (this.state === WildWolfState.CHASE) speed = this.chaseSpeed;
        else if (this.state === WildWolfState.RETURN) speed = this.moveSpeed * 1.3;

        if (this.state === WildWolfState.ATTACK && this.currentTarget) {
            // Hold position but keep facing the target.
            this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.currentTarget.position, this.position, dt, 8.0);
        }

        if (speed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                const obstacles = environment?.obstacles ?? [];
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, 5.0);
                const avoidanceRot = AIUtils.getAdvancedAvoidanceSteering(this.position, this.rotationY, this.collisionSize, obstacles);
                this.rotationY = AIUtils.smoothLookAt(
                    this.rotationY,
                    this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))),
                    this.position, dt, 8.0
                );
                const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, speed, dt, this.collisionSize, obstacles);
                this.position.x = nextPos.x;
                this.position.z = nextPos.z;
            }
            this.walkTime += dt * speed;

            // Stuck detection (mirrors Wolf.ts).
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) {
                    this.state = WildWolfState.PATROL;
                    this.findPatrolPoint();
                    this.stuckTimer = 0;
                    this.stateTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        } else {
            this.stuckTimer = 0;
            this.lastStuckPos.copy(this.position);
        }

        // -- Grounding + visual smoothing ----------------------------------------
        this.position.y = this.terrainHeightAt(this.position.x, this.position.z) + 0.05;
        const lerpFactor = Math.min(dt * 15, 1.0);
        this.group.position.lerp(this.position, lerpFactor);
        let rotDiff = this.rotationY - this.group.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        this.group.rotation.y += rotDiff * lerpFactor;

        this.updateHealthBar();

        if (skipAnimation) return;
        this.animate(dt, speed);
    }

    private updateTargetSelection(potentialTargets: { position: THREE.Vector3; isDead?: boolean }[]) {
        // While returning home the wolf is deaf to provocation: this prevents
        // leash-edge flip-flopping.
        if (this.state === WildWolfState.RETURN) {
            this.currentTarget = null;
            return;
        }

        const chasing = this.state === WildWolfState.CHASE || this.state === WildWolfState.ATTACK;
        let effectiveAggro = this.aggroRange * (chasing ? 1.5 : 1.0);
        if (this.provokedTimer > 0) effectiveAggro = Math.max(effectiveAggro, this.leashRadius);

        let best: { position: THREE.Vector3; isDead?: boolean } | null = null;
        let bestDist = effectiveAggro;
        for (const t of potentialTargets) {
            if (!t || t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; best = t; }
        }
        this.currentTarget = best;
    }

    private updateStateMachine(distFromDen: number) {
        // The leash: a hunting wolf that strays too far from its den gives up
        // and trots home.
        if ((this.state === WildWolfState.CHASE || this.state === WildWolfState.ATTACK) && distFromDen > this.leashRadius) {
            this.state = WildWolfState.RETURN;
            this.stateTimer = 0;
            this.currentTarget = null;
            this.provokedTimer = 0;
            this.targetPos.set(this.den.x, 0, this.den.z);
            return;
        }

        switch (this.state) {
            case WildWolfState.IDLE: {
                if (this.currentTarget) {
                    this.state = WildWolfState.CHASE;
                    this.stateTimer = 0;
                } else if (this.stateTimer >= this.idleDuration) {
                    this.state = WildWolfState.PATROL;
                    this.stateTimer = 0;
                    this.findPatrolPoint();
                }
                break;
            }
            case WildWolfState.PATROL: {
                if (this.currentTarget) {
                    this.state = WildWolfState.CHASE;
                    this.stateTimer = 0;
                } else if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) {
                    this.state = WildWolfState.IDLE;
                    this.stateTimer = 0;
                    this.idleDuration = 1 + Math.random() * 2;
                }
                break;
            }
            case WildWolfState.CHASE: {
                if (!this.currentTarget) {
                    this.state = WildWolfState.PATROL;
                    this.stateTimer = 0;
                    this.findPatrolPoint();
                } else {
                    const dist = this.position.distanceTo(this.currentTarget.position);
                    if (dist <= this.attackRange) {
                        this.state = WildWolfState.ATTACK;
                        this.stateTimer = 0;
                    } else {
                        this.targetPos.copy(this.currentTarget.position);
                    }
                }
                break;
            }
            case WildWolfState.ATTACK: {
                if (!this.currentTarget) {
                    this.state = WildWolfState.PATROL;
                    this.stateTimer = 0;
                    this.findPatrolPoint();
                    break;
                }
                const dist = this.position.distanceTo(this.currentTarget.position);
                if (dist > this.attackRange * 1.3 && !this.lungeActive) {
                    this.state = WildWolfState.CHASE;
                    this.stateTimer = 0;
                    this.targetPos.copy(this.currentTarget.position);
                } else if (this.attackCooldownTimer <= 0 && !this.lungeActive) {
                    // Start a lunge; the bite lands LUNGE_HIT_TIME later.
                    this.lungeActive = true;
                    this.lungeTimer = 0;
                    this.lungeHitPending = true;
                    this.lungeTarget = this.currentTarget;
                    this.attackCooldownTimer = this.attackCooldown;
                }
                break;
            }
            case WildWolfState.RETURN: {
                this.targetPos.set(this.den.x, 0, this.den.z);
                if (distFromDen < this.wanderRadius * 0.5) {
                    this.state = WildWolfState.IDLE;
                    this.stateTimer = 0;
                    this.idleDuration = 1 + Math.random() * 2;
                }
                break;
            }
        }
    }

    private updateLunge(dt: number) {
        if (!this.lungeActive) return;
        this.lungeTimer += dt;

        // Impact moment: the hit only lands if the target is still in reach and alive.
        if (this.lungeHitPending && this.lungeTimer >= LUNGE_HIT_TIME) {
            this.lungeHitPending = false;
            const target = this.lungeTarget;
            if (
                target && !target.isDead &&
                this.position.distanceTo(target.position) <= this.attackRange * 1.4
            ) {
                this.onAttackTarget?.(this.attackDamage);
            }
        }

        if (this.lungeTimer >= LUNGE_DURATION) {
            this.lungeActive = false;
            this.lungeTarget = null;
            this.model.group.rotation.x = 0;
            this.model.group.position.y = 0;
            this.model.group.position.z = 0;
        }
    }

    private findPatrolPoint() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * this.wanderRadius;
        this.targetPos.set(
            this.den.x + Math.sin(angle) * radius,
            0,
            this.den.z + Math.cos(angle) * radius
        );
    }

    // =====================================================================
    // Animation
    // =====================================================================

    private animate(dt: number, speed: number) {
        const parts = this.model.parts;
        if (!parts) return;

        if (this.lungeActive) {
            // Brief forward tilt + hop toward the target.
            const t = Math.min(1, this.lungeTimer / LUNGE_DURATION);
            const pulse = Math.sin(t * Math.PI);
            this.model.group.rotation.x = -pulse * 0.4;
            this.model.group.position.y = pulse * 0.22 * this.sizeScale;
            this.model.group.position.z = pulse * 0.3 * this.sizeScale;
        }

        if (speed > 0) {
            const legSwing = Math.sin(this.walkTime * 2.0) * 0.5;
            if (parts.legFR) parts.legFR.rotation.x = legSwing;
            if (parts.legBL) parts.legBL.rotation.x = legSwing;
            if (parts.legFL) parts.legFL.rotation.x = -legSwing;
            if (parts.legBR) parts.legBR.rotation.x = -legSwing;
            if (parts.body) parts.body.position.y = 0.6 + Math.abs(Math.cos(this.walkTime * 2.0)) * 0.1;
            if (parts.tail) parts.tail.rotation.y = Math.sin(this.walkTime * 4.0) * 0.3;
            if (parts.head) parts.head.rotation.y = THREE.MathUtils.lerp(parts.head.rotation.y, 0, Math.min(1, dt * 6));
        } else {
            const breath = Math.sin(this.stateTimer * 2.0) * 0.02;
            if (parts.body) parts.body.scale.set(1 + breath, 1 + breath, 1 + breath);

            // Subtle idle: occasional head turn.
            this.headTurnTimer -= dt;
            if (this.headTurnTimer <= 0) {
                this.headTurnTimer = 2 + Math.random() * 4;
                this.headTurnTarget = (Math.random() - 0.5) * 1.4;
            }
            if (parts.head) {
                parts.head.rotation.y = THREE.MathUtils.lerp(parts.head.rotation.y, this.headTurnTarget, Math.min(1, dt * 3));
            }
        }
    }

    /** Brief fall-onto-the-side animation after death, then the corpse rests. */
    private settleCorpse(dt: number) {
        if (this.deathTimer >= DEATH_SETTLE_DURATION) return;
        this.deathTimer += dt;
        const t = Math.min(1, this.deathTimer / DEATH_SETTLE_DURATION);
        const eased = t * t * (3 - 2 * t);
        this.model.group.rotation.z = eased * (Math.PI / 2);
        this.model.group.position.y = eased * 0.15 * this.sizeScale;
        const parts = this.model.parts;
        if (parts) {
            if (parts.legFR) parts.legFR.rotation.x = eased * 0.8;
            if (parts.legFL) parts.legFL.rotation.x = -eased * 0.8;
            if (parts.legBR) parts.legBR.rotation.x = eased * 1.2;
            if (parts.legBL) parts.legBL.rotation.x = -eased * 1.2;
            if (parts.head) parts.head.rotation.x = eased * 0.5;
        }
    }

    // =====================================================================
    // Health bar
    // =====================================================================

    private updateHealthBar() {
        const hunting = this.state === WildWolfState.CHASE || this.state === WildWolfState.ATTACK;
        this.healthBarGroup.visible = !this.isDead && (this.health < this.maxHealth || hunting);
        if (!this.healthBarGroup.visible) return;

        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);

        // Billboard toward the active camera (Pig pattern: scene.userData.camera).
        const camPos = this.scene.userData?.camera?.position;
        if (!camPos) return;
        const toCamera = new THREE.Vector3().subVectors(camPos, this.group.position);
        toCamera.y = 0;
        if (toCamera.lengthSq() > 0.0001) {
            this.healthBarGroup.rotation.y = Math.atan2(toCamera.x, toCamera.z) - this.group.rotation.y;
        }
    }

    // =====================================================================
    // Damage / death / loot
    // =====================================================================

    takeDamage(amount: number): void {
        if (this.isDead) return;
        const total = amount + (this.getIncomingDamageBonus?.() ?? 0);
        this.health -= total;
        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);

        // Red emissive flash.
        this.furMaterial.emissive.setHex(0xff0000);
        this.furMaterial.emissiveIntensity = 0.5;

        if (this.health <= 0) {
            this.die();
        } else {
            setTimeout(() => {
                if (!this.isDead && !this.disposed) this.furMaterial.emissiveIntensity = 0;
            }, 100);
            // Retaliate: chase the attacker even from beyond normal aggro range.
            this.provokedTimer = 6;
            if (this.state === WildWolfState.IDLE || this.state === WildWolfState.PATROL || this.state === WildWolfState.RETURN) {
                this.state = WildWolfState.CHASE;
                this.stateTimer = 0;
            }
        }
    }

    getDeathDrops(): { itemName: string; count: number }[] {
        return [
            { itemName: 'Raw Meat', count: 2 },
            { itemName: 'Bone Fragments', count: 1 },
            { itemName: 'Wolf Pelt', count: 1 },
        ];
    }

    private die() {
        this.isDead = true;
        this.state = WildWolfState.DEAD;
        this.deathTimer = 0;
        this.healthBarGroup.visible = false;
        this.furMaterial.emissive.setHex(0x000000);
        this.furMaterial.emissiveIntensity = 0;

        // Cancel any in-flight lunge pose.
        this.lungeActive = false;
        this.lungeHitPending = false;
        this.lungeTarget = null;
        this.model.group.rotation.x = 0;
        this.model.group.position.z = 0;

        // Corpse is skinnable. PlayerInteraction.getSkinRewards resolves the
        // entity root as `target.parent` when that parent has
        // userData.type === 'creature', then reads userData.skinRewards as an
        // array of { itemName, count } — set the same shape on every level.
        const skinRewards = [{ itemName: 'Wolf Pelt', count: 2 }];
        const applyCorpseUserData = (obj: THREE.Object3D) => {
            obj.userData.isSkinnable = true;
            obj.userData.material = 'flesh';
            obj.userData.skinRewards = skinRewards;
        };
        applyCorpseUserData(this.group);
        applyCorpseUserData(this.hitbox);
        this.hitbox.traverse(applyCorpseUserData);
        applyCorpseUserData(this.model.group);
    }

    markAsSkinned(): void {
        this.isSkinned = true;
        const clearSkinnable = (obj: THREE.Object3D) => {
            obj.userData.isSkinnable = false;
        };
        clearSkinnable(this.group);
        clearSkinnable(this.hitbox);
        this.hitbox.traverse(clearSkinnable);
        clearSkinnable(this.model.group);
        this.model.group.traverse(clearSkinnable);
        // Darken the (per-instance) fur to read as a skinned carcass.
        this.furMaterial.color.multiplyScalar(0.3);
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        if (this.group.parent) this.group.parent.remove(this.group);
        for (const resource of this.disposables) resource.dispose();
        this.disposables.length = 0;
        // NOTE: wolf model geometries/base materials are cached in FaunaFactory
        // and shared between instances — never disposed here.
    }
}
