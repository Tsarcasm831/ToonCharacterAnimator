import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { PlayerModel } from '../../../PlayerModel';
import { PlayerAnimator } from '../../../PlayerAnimator';
import { Environment } from '../../../Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';

enum BanditState { IDLE, PATROL, CHASE, ATTACK, RETREAT }

export class Bandit {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    private state: BanditState = BanditState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private speedFactor: number = 0;
    private lastStepCount: number = 0;
    private walkTime: number = 0;
    private status = { isDead: false, recoverTimer: 0 };
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
        
        // Randomize body type
        const bodyVariants = ['average', 'muscular', 'heavy'] as const;
        const randomVariant = bodyVariants[Math.floor(Math.random() * bodyVariants.length)];
        
        this.config = { 
            ...DEFAULT_CONFIG, 
            bodyType: 'male', 
            bodyVariant: randomVariant, 
            outfit: 'peasant', 
            skinColor: '#c9a882',
            shirtColor: '#4a4a4a',
            pantsColor: '#2d2d2d',
            bootsColor: '#1a1a1a',
            hairStyle: Math.random() > 0.5 ? 'bald' : 'crew',
            hairColor: '#2d2d2d',
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, 
                mask: Math.random() > 0.6, hood: Math.random() > 0.5, quiltedArmor: false, 
                leatherArmor: Math.random() > 0.5, heavyLeatherArmor: false, ringMail: false, 
                plateMail: false, robe: false, blacksmithApron: false, mageHat: false,
                bracers: Math.random() > 0.5, cape: false, belt: true
            }, 
            selectedItem: 'Axe',
            weaponStance: 'side',
            isAssassinHostile: true,
            tintColor: tint 
        };
        
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        this.model.sync(this.config, true);
    }

    private setState(newState: BanditState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isStriking = (newState === BanditState.ATTACK);
        if (this.isStriking) this.strikeTimer = 0;
    }

    private findPatrolPoint(environment: Environment) {
        const limit = PlayerUtils.WORLD_LIMIT - 10;
        this.targetPos.set(
            (Math.random() - 0.5) * (limit * 2),
            0,
            (Math.random() - 0.5) * (limit * 2)
        );
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        let bestTarget = null;
        let bestDist = 18.0;
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // State machine
        if (bestTarget) {
            if (this.state === BanditState.PATROL || this.state === BanditState.IDLE) {
                this.setState(BanditState.CHASE);
            }
            if (this.state === BanditState.CHASE) {
                if (distToTarget < 2.5) this.setState(BanditState.ATTACK);
                else if (distToTarget > 25.0) this.setState(BanditState.PATROL);
                else this.targetPos.copy(this.currentTarget!.position);
            }
            if (this.state === BanditState.ATTACK && this.strikeTimer > 0.7) {
                this.setState(BanditState.RETREAT);
                this.attackCooldown = 1.0 + Math.random();
            }
            if (this.state === BanditState.RETREAT && this.stateTimer > 0.6) {
                this.setState(BanditState.CHASE);
            }
        } else if (this.state !== BanditState.PATROL && this.state !== BanditState.IDLE) {
            this.setState(BanditState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case BanditState.PATROL:
                moveSpeed = 2.5;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 20.0) {
                    this.findPatrolPoint(environment);
                    this.stateTimer = 0;
                }
                break;
            case BanditState.CHASE:
                moveSpeed = 5.0;
                break;
            case BanditState.ATTACK:
                this.strikeTimer += dt;
                if (this.strikeTimer < 0.25) {
                    const step = new THREE.Vector3(0, 0, 1)
                        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY)
                        .multiplyScalar(6.0 * dt);
                    const next = this.position.clone().add(step);
                    if (!PlayerUtils.checkCollision(next, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                break;
            case BanditState.RETREAT:
                if (this.currentTarget) {
                    const step = new THREE.Vector3()
                        .subVectors(this.position, this.currentTarget.position)
                        .normalize()
                        .multiplyScalar(3.5 * dt);
                    const next = this.position.clone().add(step);
                    if (!PlayerUtils.checkCollision(next, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                moveSpeed = -3.5;
                break;
        }

        // Stuck detection
        if (moveSpeed !== 0) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) {
                    this.setState(BanditState.PATROL);
                    this.findPatrolPoint(environment);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        // Movement
        if (this.state !== BanditState.ATTACK && this.state !== BanditState.RETREAT) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toGoal.y = 0;
            if (toGoal.length() > 0.1) {
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(toGoal.x, toGoal.z), 8.0 * dt);
                if (moveSpeed > 0) {
                    const step = moveSpeed * dt;
                    const next = this.position.clone().add(
                        new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step)
                    );
                    if (!PlayerUtils.checkCollision(next, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.x = next.x;
                        this.position.z = next.z;
                    }
                }
            }
        } else if (this.currentTarget) {
            this.rotationY = THREE.MathUtils.lerp(
                this.rotationY,
                Math.atan2(this.currentTarget.position.x - this.position.x, this.currentTarget.position.z - this.position.z),
                dt * 12.0
            );
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles), dt * 6);
        this.model.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        // Head tracking
        if (this.currentTarget) {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 1.0, dt * 4.0);
            this.smoothedHeadTarget.lerp(this.currentTarget.position.clone().add(new THREE.Vector3(0, 1.6, 0)), dt * 5.0);
            this.cameraHandler.cameraWorldPosition.copy(this.smoothedHeadTarget);
        } else {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 0.0, dt * 4.0);
        }

        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, moveSpeed, dt * 6);
        const animY = (this.state === BanditState.RETREAT) ? 1 : (Math.abs(this.speedFactor) > 0.1 ? -1 : 0);

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === BanditState.ATTACK || this.state === BanditState.RETREAT || this.state === BanditState.CHASE),
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: this.state === BanditState.CHASE, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, true);
    }
}
