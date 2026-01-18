import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { PlayerModel } from '../../../PlayerModel';
import { PlayerAnimator } from '../../../PlayerAnimator';
import { Environment } from '../../../Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';

enum RangerState { IDLE, PATROL, STALK, ATTACK, REPOSITION }

export class Ranger {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    private state: RangerState = RangerState.PATROL;
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
        
        // Rangers are agile forest protectors - slim/average builds with green attire
        const isFemale = Math.random() > 0.5;
        
        this.config = { 
            ...DEFAULT_CONFIG, 
            bodyType: isFemale ? 'female' : 'male', 
            bodyVariant: 'slim', 
            outfit: 'peasant', 
            skinColor: isFemale ? '#ffe4c4' : '#deb887',
            shirtColor: '#2e8b57',
            pantsColor: '#556b2f',
            bootsColor: '#8b4513',
            hoodColor: '#228b22',
            hairStyle: isFemale ? 'crew' : 'bald',
            hairColor: '#8b4513',
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, 
                mask: false, hood: true, quiltedArmor: false, leatherArmor: true, 
                heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, 
                blacksmithApron: false, mageHat: false, bracers: true, cape: true, belt: true
            }, 
            selectedItem: 'Bow',
            weaponStance: 'side',
            isAssassinHostile: false,
            tintColor: tint || '#228b22'
        };
        
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        this.model.sync(this.config, true);
    }

    private setState(newState: RangerState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isStriking = (newState === RangerState.ATTACK);
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
        let bestDist = 25.0;
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // Rangers prefer ranged combat - keep distance
        if (bestTarget) {
            if (this.state === RangerState.PATROL || this.state === RangerState.IDLE) {
                this.setState(RangerState.STALK);
            }
            if (this.state === RangerState.STALK) {
                if (distToTarget < 18.0 && distToTarget > 10.0 && this.attackCooldown <= 0) {
                    this.setState(RangerState.ATTACK);
                } else if (distToTarget < 8.0) {
                    this.setState(RangerState.REPOSITION);
                } else if (distToTarget > 30.0) {
                    this.setState(RangerState.PATROL);
                } else {
                    this.targetPos.copy(this.currentTarget!.position);
                }
            }
            if (this.state === RangerState.ATTACK) {
                this.strikeTimer += dt;
                if (this.strikeTimer > 0.8) {
                    this.setState(RangerState.REPOSITION);
                    this.attackCooldown = 1.5 + Math.random();
                }
            }
            if (this.state === RangerState.REPOSITION) {
                if (distToTarget > 12.0 || this.stateTimer > 1.5) {
                    this.setState(RangerState.STALK);
                }
            }
        } else if (this.state !== RangerState.PATROL && this.state !== RangerState.IDLE) {
            this.setState(RangerState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case RangerState.PATROL:
                moveSpeed = 2.8;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 20.0) {
                    this.findPatrolPoint(environment);
                    this.stateTimer = 0;
                }
                break;
            case RangerState.STALK:
                moveSpeed = 3.5;
                break;
            case RangerState.ATTACK:
                moveSpeed = 0; // Standing still while shooting
                break;
            case RangerState.REPOSITION:
                if (this.currentTarget) {
                    const dirAway = new THREE.Vector3()
                        .subVectors(this.position, this.currentTarget.position)
                        .normalize();
                    // Add lateral movement for unpredictability
                    const lateral = new THREE.Vector3(-dirAway.z, 0, dirAway.x).multiplyScalar(Math.sin(this.stateTimer * 3) * 0.5);
                    const moveDir = dirAway.add(lateral).normalize();
                    const next = this.position.clone().add(moveDir.multiplyScalar(5.0 * dt));
                    if (!PlayerUtils.checkCollision(next, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                moveSpeed = 5.0;
                break;
        }

        if (moveSpeed !== 0 && this.state !== RangerState.ATTACK) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) {
                    this.setState(RangerState.PATROL);
                    this.findPatrolPoint(environment);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        if (this.state !== RangerState.ATTACK && this.state !== RangerState.REPOSITION) {
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
                dt * 8.0
            );
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles), dt * 6);
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
            isCombatStance: (this.state === RangerState.ATTACK || this.state === RangerState.STALK),
            isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false,
            isBowDraw: this.isStriking, bowDrawTimer: this.strikeTimer
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: this.state === RangerState.REPOSITION, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, true);
    }
}
