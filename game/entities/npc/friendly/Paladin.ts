import * as THREE from 'three';
import { EntityStats, DEFAULT_CONFIG } from '../../../../types';
import { HumanoidEntity } from '../../../entities/HumanoidEntity';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';

// Add missing RETREAT state to fix compilation errors
enum PaladinState { IDLE, PATROL, CHASE, DUEL, ATTACK, HEAL, RETREAT }

export class Paladin extends HumanoidEntity {
    velocity: THREE.Vector3 = new THREE.Vector3();
    stats: EntityStats;
    
    private state: PaladinState = PaladinState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private currentPath: { r: number, c: number }[] = [];
    private pathIndex: number = 0;
    private duelTimer: number = 0;
    private strafeDir: number = 1;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private speedFactor: number = 0;
    
    private smoothedHeadTarget = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        const config = { 
            ...DEFAULT_CONFIG, 
            bodyType: 'male', 
            bodyVariant: 'muscular', 
            outfit: 'warrior', 
            skinColor: '#f5deb3',
            shirtColor: '#f5f5dc',
            pantsColor: '#daa520',
            bootsColor: '#8b7355',
            hairStyle: 'crew',
            hairColor: '#d4af37',
            stats: { ...CLASS_STATS.paladin },
            equipment: { 
                helm: true, shoulders: true, shield: true, shirt: true, pants: true, shoes: true, 
                mask: false, hood: false, quiltedArmor: false,
                blacksmithApron: false, leatherArmor: false, heavyLeatherArmor: false,
                ringMail: false, plateMail: true, robe: false, mageHat: false,
                bracers: true, cape: true, belt: true,
                skirt: false, skullcap: false, shorts: false
            },
            selectedItem: 'Sword',
            weaponStance: 'side',
            isAssassinHostile: false,
            tintColor: tint 
        } as any;

        super(scene, initialPos, config);
        
        this.stats = { ...CLASS_STATS.paladin };
        this.lastStuckPos.copy(this.position);
    }

    private setState(newState: PaladinState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isStriking = (newState === PaladinState.ATTACK);
        if (this.isStriking) this.strikeTimer = 0;
        if (newState === PaladinState.DUEL) {
            this.duelTimer = 1.5 + Math.random() * 2.0;
            this.strafeDir = Math.random() > 0.5 ? 1 : -1;
        }
    }

    private findPatrolPoint(environment: Environment | CombatEnvironment) {
        if (environment instanceof CombatEnvironment) {
            const r = Math.floor(Math.random() * 8);
            const c = Math.floor(Math.random() * 8);
            this.targetPos.copy(environment.getWorldPosition(r, c));
            return;
        }
        const limit = PlayerUtils.WORLD_LIMIT - 10;
        this.targetPos.set(
            (Math.random() - 0.5) * (limit * 2),
            0,
            (Math.random() - 0.5) * (limit * 2)
        );
    }

    update(dt: number, environment: Environment | CombatEnvironment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false, isCombatActive: boolean = true) {
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;

        // Snapping check for combat arena
        if (env instanceof CombatEnvironment) {
            const snapped = env.snapToGrid(this.position);
            if (this.state !== PaladinState.ATTACK && this.state !== PaladinState.RETREAT) {
                this.position.lerp(snapped, 5.0 * dt);
            }
        }

        if (!isCombatActive) {
            this.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            if (skipAnimation) return;
            this.updateModel(dt);
            this.model.sync(this.config, true);
            return;
        }

        let bestTarget = null;
        let bestDist = 35.0; // Increased from 20.0
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        if (isCombatActive && bestTarget) {
            if (this.state === PaladinState.PATROL || this.state === PaladinState.IDLE) {
                this.setState(PaladinState.CHASE);
            }
            if (this.state === PaladinState.CHASE) {
                if (distToTarget < 4.0) this.setState(PaladinState.DUEL);
                else if (distToTarget > 40.0) this.setState(PaladinState.PATROL); // Increased from 30.0
                else this.targetPos.copy(this.currentTarget!.position);
            }
            if (this.state === PaladinState.DUEL) {
                this.duelTimer -= dt;
                this.targetPos.copy(this.currentTarget!.position);
                if (distToTarget > 5.5) this.setState(PaladinState.CHASE);
                else if (this.duelTimer <= 0 && this.attackCooldown <= 0) this.setState(PaladinState.ATTACK);
            }
            if (this.state === PaladinState.ATTACK && this.strikeTimer > 0.8) {
                this.setState(PaladinState.RETREAT);
                this.attackCooldown = 1.8 + Math.random();
            }
            if (this.state === PaladinState.RETREAT) {
                if (this.stateTimer > 0.7) this.setState(PaladinState.DUEL);
            }
        } else if (this.state !== PaladinState.PATROL && this.state !== PaladinState.IDLE) {
            this.setState(PaladinState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case PaladinState.PATROL:
                moveSpeed = 2.0;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 25.0) {
                    this.findPatrolPoint(env);
                    this.stateTimer = 0;
                }
                break;
            case PaladinState.CHASE:
                moveSpeed = 4.0;
                break;
            case PaladinState.DUEL:
                moveSpeed = 1.8;
                const toTargetDuel = new THREE.Vector3().subVectors(this.currentTarget!.position, this.position).normalize();
                const right = new THREE.Vector3(0, 1, 0).cross(toTargetDuel).normalize();
                const strafeVec = right.multiplyScalar(this.strafeDir * 1.8);
                if (distToTarget < 2.5) strafeVec.add(toTargetDuel.clone().multiplyScalar(-1.2));
                else if (distToTarget > 3.5) strafeVec.add(toTargetDuel.clone().multiplyScalar(1.2));
                const duelNext = this.position.clone().add(strafeVec.multiplyScalar(dt));
                if (!PlayerUtils.checkCollision(duelNext, this.config, env.obstacles) && PlayerUtils.isWithinBounds(duelNext)) {
                    this.position.x = duelNext.x;
                    this.position.z = duelNext.z;
                }
                break;
            case PaladinState.ATTACK:
                this.strikeTimer += dt;
                if (this.strikeTimer < 0.3) {
                    const step = new THREE.Vector3(0, 0, 1)
                        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY)
                        .multiplyScalar(5.0 * dt);
                    const next = this.position.clone().add(step);
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                break;
            case PaladinState.RETREAT:
                if (this.currentTarget) {
                    const step = new THREE.Vector3()
                        .subVectors(this.position, this.currentTarget.position)
                        .normalize()
                        .multiplyScalar(2.5 * dt);
                    const next = this.position.clone().add(step);
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                moveSpeed = -2.5;
                break;
        }

        if (moveSpeed !== 0) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.05) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 10.0) {
                    const escape = PlayerUtils.findUnstuckPosition(this.position, env.obstacles);
                    if (escape) {
                        this.position.copy(escape);
                        this.stuckTimer = 0;
                        this.setState(PaladinState.PATROL);
                        this.findPatrolPoint(env);
                    }
                } else if (this.stuckTimer > 2.0) {
                     if (this.stuckTimer % 3.0 < dt) {
                         this.setState(PaladinState.PATROL);
                         this.findPatrolPoint(env);
                     }
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        if (this.state !== PaladinState.DUEL && this.state !== PaladinState.ATTACK && this.state !== PaladinState.RETREAT) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toGoal.y = 0;
            if (toGoal.length() > 0.1) {
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(toGoal.x, toGoal.z), 6.0 * dt);
                if (moveSpeed > 0) {
                    const step = moveSpeed * dt;
                    const next = this.position.clone().add(
                        new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step)
                    );
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.x = next.x;
                        this.position.z = next.z;
                    }
                }
            }
        } else if (this.currentTarget) {
            this.rotationY = THREE.MathUtils.lerp(
                this.rotationY,
                Math.atan2(this.currentTarget.position.x - this.position.x, this.currentTarget.position.z - this.position.z),
                dt * 10.0
            );
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, env.obstacles), dt * 6);
        this.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        if (this.currentTarget) {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 1.0, dt * 4.0);
            this.smoothedHeadTarget.lerp(this.currentTarget.position.clone().add(new THREE.Vector3(0, 1.6, 0)), dt * 5.0);
            this.cameraHandler.cameraWorldPosition.copy(this.smoothedHeadTarget);
        } else {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 0.0, dt * 4.0);
        }

        let targetSpeedAnim = (this.state === PaladinState.DUEL) ? 1.5 : moveSpeed;
        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, targetSpeedAnim, dt * 6);
        const animX = (this.state === PaladinState.DUEL) ? this.strafeDir : 0;
        const animY = Math.abs(this.speedFactor) > 0.1 ? -1 : 0;

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === PaladinState.DUEL || this.state === PaladinState.ATTACK || this.state === PaladinState.RETREAT),
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1 || this.state === PaladinState.DUEL, { x: animX, y: animY, isRunning: this.state === PaladinState.CHASE, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.updateModel(dt);
        this.model.sync(this.config, true);
    }
}
