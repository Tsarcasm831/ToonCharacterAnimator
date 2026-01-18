
import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { PlayerModel } from '../../../PlayerModel';
import { PlayerAnimator } from '../../../PlayerAnimator';
import { Environment } from '../../../Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';

enum WarlockState { IDLE, PATROL, CHASE, CAST, RETREAT }

export class Warlock {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    private state: WarlockState = WarlockState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isCasting: boolean = false;
    private castTimer: number = 0;
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
        
        // Warlocks can be male or female, typically slim
        const isFemale = Math.random() > 0.5;
        const bodyVariants = ['slim', 'average'] as const;
        const randomVariant = bodyVariants[Math.floor(Math.random() * bodyVariants.length)];
        
        this.config = { 
            ...DEFAULT_CONFIG, 
            bodyType: isFemale ? 'female' : 'male', 
            bodyVariant: randomVariant, 
            outfit: 'noble', 
            skinColor: '#d4c4b0',
            shirtColor: '#1a0a2e',
            pantsColor: '#0d0518',
            bootsColor: '#0a0a0a',
            robeColor: '#1a0a2e',
            robeTrimColor: '#6b21a8',
            mageHatColor: '#1a0a2e',
            mageHatBandColor: '#9333ea',
            hairStyle: isFemale ? 'crew' : 'bald',
            hairColor: '#1a1a1a',
            stats: { ...CLASS_STATS.warlock },
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, 
                mask: false, hood: Math.random() > 0.5, quiltedArmor: false, leatherArmor: false, 
                heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: true, 
                blacksmithApron: false, mageHat: Math.random() > 0.5, bracers: false, cape: true, belt: true
            }, 
            selectedItem: null,
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

    private setState(newState: WarlockState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isCasting = (newState === WarlockState.CAST);
        if (this.isCasting) this.castTimer = 0;
    }

    private findPatrolPoint(environment: Environment) {
        const limit = PlayerUtils.WORLD_LIMIT - 15;
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
        let bestDist = 22.0;
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // Warlocks keep distance and cast spells
        if (bestTarget) {
            if (this.state === WarlockState.PATROL || this.state === WarlockState.IDLE) {
                this.setState(WarlockState.CHASE);
            }
            if (this.state === WarlockState.CHASE) {
                if (distToTarget < 15.0 && distToTarget > 8.0 && this.attackCooldown <= 0) {
                    this.setState(WarlockState.CAST);
                } else if (distToTarget < 8.0) {
                    this.setState(WarlockState.RETREAT);
                } else if (distToTarget > 30.0) {
                    this.setState(WarlockState.PATROL);
                } else {
                    this.targetPos.copy(this.currentTarget!.position);
                }
            }
            if (this.state === WarlockState.CAST) {
                this.castTimer += dt;
                if (this.castTimer > 1.0) {
                    this.setState(WarlockState.RETREAT);
                    this.attackCooldown = 2.5 + Math.random() * 1.5;
                }
            }
            if (this.state === WarlockState.RETREAT) {
                if (distToTarget > 12.0 || this.stateTimer > 2.0) {
                    this.setState(WarlockState.CHASE);
                }
            }
        } else if (this.state !== WarlockState.PATROL && this.state !== WarlockState.IDLE) {
            this.setState(WarlockState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case WarlockState.PATROL:
                moveSpeed = 2.0;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 22.0) {
                    this.findPatrolPoint(environment);
                    this.stateTimer = 0;
                }
                break;
            case WarlockState.CHASE:
                moveSpeed = 3.5;
                break;
            case WarlockState.CAST:
                moveSpeed = 0; // Standing still while casting
                break;
            case WarlockState.RETREAT:
                if (this.currentTarget) {
                    const dirAway = new THREE.Vector3()
                        .subVectors(this.position, this.currentTarget.position)
                        .normalize();
                    const next = this.position.clone().add(dirAway.multiplyScalar(4.0 * dt));
                    if (!PlayerUtils.checkCollision(next, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                moveSpeed = -4.0;
                break;
        }

        // Stuck detection
        if (moveSpeed !== 0 && this.state !== WarlockState.CAST) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) {
                    this.setState(WarlockState.PATROL);
                    this.findPatrolPoint(environment);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        // Movement
        if (this.state !== WarlockState.CAST && this.state !== WarlockState.RETREAT) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toGoal.y = 0;
            if (toGoal.length() > 0.1) {
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(toGoal.x, toGoal.z), 6.0 * dt);
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
        const animY = (this.state === WarlockState.RETREAT) ? 1 : (Math.abs(this.speedFactor) > 0.1 ? -1 : 0);

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === WarlockState.CAST || this.state === WarlockState.RETREAT || this.state === WarlockState.CHASE),
            isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false,
            isFireballCasting: this.isCasting, fireballTimer: this.castTimer,
            isSummoning: this.isCasting, summonTimer: this.castTimer
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: this.state === WarlockState.CHASE, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, true);
    }
}
