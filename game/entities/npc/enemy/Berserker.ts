
import * as THREE from 'three';
import { EntityStats, PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { PlayerModel } from '../../../model/PlayerModel';
import { PlayerAnimator } from '../../../animator/PlayerAnimator';
import { Environment } from '../../../environment/Environment';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';

enum BerserkerState { IDLE, PATROL, RAGE, ATTACK, RECOVER }

export class Berserker {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    stats: EntityStats;
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    private state: BerserkerState = BerserkerState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private currentPath: { r: number, c: number }[] = [];
    private pathIndex: number = 0;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private comboCount: number = 0;
    private speedFactor: number = 0;
    private lastStepCount: number = 0;
    private walkTime: number = 0;
    public status = { isDead: false, recoverTimer: 0 };
    private cameraHandler = {
        blinkTimer: 0, isBlinking: false, eyeLookTarget: new THREE.Vector2(), eyeLookCurrent: new THREE.Vector2(),
        eyeMoveTimer: 0, lookAtCameraTimer: 0, cameraGazeTimer: 0, isLookingAtCamera: false,
        headLookWeight: 0, cameraWorldPosition: new THREE.Vector3()
    };
    private smoothedHeadTarget = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastFramePos.copy(initialPos);
        this.lastStuckPos.copy(this.position);
        
        // Berserkers are heavy/muscular builds
        const bodyVariants = ['muscular', 'heavy'] as const;
        const randomVariant = bodyVariants[Math.floor(Math.random() * bodyVariants.length)];
        
        this.config = { 
            ...DEFAULT_CONFIG, 
            bodyType: 'male', 
            bodyVariant: randomVariant, 
            outfit: 'warrior', 
            skinColor: '#c9a882',
            shirtColor: '#8b0000',
            pantsColor: '#4a2020',
            bootsColor: '#2d1a1a',
            hairStyle: Math.random() > 0.5 ? 'bald' : 'crew',
            hairColor: '#8b0000',
            stats: { ...CLASS_STATS.berserker },
            equipment: { 
                helm: false, shoulders: Math.random() > 0.5, shield: false, shirt: true, pants: true, shoes: true, 
                mask: false, hood: false, quiltedArmor: false, leatherArmor: false, 
                heavyLeatherArmor: Math.random() > 0.5, ringMail: false, plateMail: false, robe: false, 
                blacksmithApron: false, mageHat: false, bracers: true, cape: false, belt: true,
                skirt: false, skullcap: false, shorts: false
            }, 
            selectedItem: 'Axe',
            weaponStance: 'side',
            isAssassinHostile: true,
            tintColor: tint 
        };
        this.stats = { ...CLASS_STATS.berserker };
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        this.model.sync(this.config, true);
    }

    private setState(newState: BerserkerState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isStriking = (newState === BerserkerState.ATTACK);
        if (this.isStriking) {
            this.strikeTimer = 0;
            this.comboCount++;
        }
        if (newState === BerserkerState.RECOVER) {
            this.comboCount = 0;
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
            if (isCombatActive) {
                // Cell-by-cell movement
                if (this.currentPath.length > 0) {
                    const targetGrid = this.currentPath[this.pathIndex];
                    const targetPos = env.getWorldPosition(targetGrid.r, targetGrid.c);
                    
                    const distSq = this.position.distanceToSquared(targetPos);
                    if (distSq < 0.01) {
                        this.pathIndex++;
                        if (this.pathIndex >= this.currentPath.length) {
                            this.currentPath = [];
                        }
                    } else {
                        const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                        this.position.addScaledVector(dir, 6.0 * dt);
                        this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(dir.x, dir.z), 10.0 * dt);
                    }
                } else if (this.targetPos && this.position.distanceToSquared(this.targetPos) > 1.0) {
                    this.currentPath = env.getPath(this.position, this.targetPos);
                    this.pathIndex = 0;
                }
            } else {
                this.position.lerp(snapped, 5.0 * dt);
            }
        }

        if (!isCombatActive) {
            this.model.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            if (skipAnimation) return;
            this.model.update(dt, new THREE.Vector3(0, 0, 0));
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

        // Berserkers rage and attack relentlessly
        if (isCombatActive && bestTarget) {
            if (this.state === BerserkerState.PATROL || this.state === BerserkerState.IDLE) {
                this.setState(BerserkerState.RAGE);
            }
            if (this.state === BerserkerState.RAGE) {
                if (distToTarget < 3.0 && this.attackCooldown <= 0) this.setState(BerserkerState.ATTACK);
                else if (distToTarget > 40.0) this.setState(BerserkerState.PATROL); // Increased from 28.0
                else this.targetPos.copy(this.currentTarget!.position);
            }
            if (this.state === BerserkerState.ATTACK && this.strikeTimer > 0.6) {
                // Combo attacks - up to 3 swings
                if (this.comboCount < 3 && distToTarget < 4.0) {
                    this.setState(BerserkerState.ATTACK);
                } else {
                    this.setState(BerserkerState.RECOVER);
                    this.attackCooldown = 1.5 + Math.random();
                }
            }
            if (this.state === BerserkerState.RECOVER && this.stateTimer > 1.0) {
                this.setState(BerserkerState.RAGE);
            }
        } else if (this.state !== BerserkerState.PATROL && this.state !== BerserkerState.IDLE) {
            this.setState(BerserkerState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case BerserkerState.PATROL:
                moveSpeed = 2.5;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 20.0) {
                    this.findPatrolPoint(environment);
                    this.stateTimer = 0;
                }
                break;
            case BerserkerState.RAGE:
                moveSpeed = 6.5; // Fast charge
                break;
            case BerserkerState.ATTACK:
                this.strikeTimer += dt;
                if (this.strikeTimer < 0.2) {
                    const step = new THREE.Vector3(0, 0, 1)
                        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY)
                        .multiplyScalar(8.0 * dt);
                    const next = this.position.clone().add(step);
                if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                break;
            case BerserkerState.RECOVER:
                moveSpeed = 0; // Standing still, catching breath
                break;
        }

        // Stuck detection
        if (moveSpeed !== 0) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) {
                    this.setState(BerserkerState.PATROL);
                    this.findPatrolPoint(env);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        // Movement
        if (this.state !== BerserkerState.ATTACK && this.state !== BerserkerState.RECOVER) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toGoal.y = 0;
            if (toGoal.length() > 0.1) {
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, 8.0);
                const avoidanceRot = AIUtils.getAvoidanceSteering(this.position, this.rotationY, new THREE.Vector3(0.6, 2.0, 0.6), env.obstacles);
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, 12.0);

                if (moveSpeed > 0) {
                    const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, moveSpeed, dt, new THREE.Vector3(0.6, 2.0, 0.6), env.obstacles);
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
            }
        } else if (this.currentTarget) {
            this.rotationY = THREE.MathUtils.lerp(
                this.rotationY,
                Math.atan2(this.currentTarget.position.x - this.position.x, this.currentTarget.position.z - this.position.z),
                dt * 12.0
            );
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, env.obstacles), dt * 6);
        this.model.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        if (this.currentTarget) {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 1.0, dt * 4.0);
            this.smoothedHeadTarget.lerp(this.currentTarget.position.clone().add(new THREE.Vector3(0, 1.6, 0)), dt * 5.0);
            this.cameraHandler.cameraWorldPosition.copy(this.smoothedHeadTarget);
        } else {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 0.0, dt * 4.0);
        }

        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, moveSpeed, dt * 6);
        const animY = Math.abs(this.speedFactor) > 0.1 ? -1 : 0;

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === BerserkerState.RAGE || this.state === BerserkerState.ATTACK),
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: this.state === BerserkerState.RAGE, isPickingUp: false, isDead: false, jump: false } as any, env.obstacles);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, true);
    }
}
