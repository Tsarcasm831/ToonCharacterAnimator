import * as THREE from 'three';
import { EntityStats, PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { PlayerModel } from '../../../model/PlayerModel';
import { PlayerAnimator } from '../../../animator/PlayerAnimator';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';

enum ClericState { IDLE, PATROL, SUPPORT, CAST, RETREAT }

export class Cleric {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    stats: EntityStats;
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    private state: ClericState = ClericState.PATROL;
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
        
        // Clerics are holy healers - average builds with white/gold robes
        const isFemale = Math.random() > 0.4;
        
        this.config = { 
            ...DEFAULT_CONFIG, 
            bodyType: isFemale ? 'female' : 'male', 
            bodyVariant: 'average', 
            outfit: 'noble', 
            skinColor: isFemale ? '#ffe4c4' : '#f5deb3',
            shirtColor: '#f5f5f5',
            pantsColor: '#dcdcdc',
            bootsColor: '#d4af37',
            robeColor: '#f5f5f5',
            robeTrimColor: '#ffd700',
            mageHatColor: '#f5f5f5',
            mageHatBandColor: '#ffd700',
            hairStyle: isFemale ? 'crew' : 'bald',
            hairColor: isFemale ? '#ffd700' : '#d4af37',
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, 
                mask: false, hood: false, quiltedArmor: false, leatherArmor: false, 
                heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: true, 
                blacksmithApron: false, mageHat: true, bracers: true, cape: true, belt: true,
                skirt: false, skullcap: false, shorts: false
            }, 
            selectedItem: null,
            weaponStance: 'side',
            isAssassinHostile: false,
            tintColor: tint || '#ffd700'
        };
        this.stats = { ...CLASS_STATS.cleric };
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        this.model.sync(this.config, true);
    }

    private setState(newState: ClericState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isCasting = (newState === ClericState.CAST);
        if (this.isCasting) this.castTimer = 0;
    }

    private findPatrolPoint(environment: Environment | CombatEnvironment) {
        if (environment instanceof CombatEnvironment) {
            const r = Math.floor(Math.random() * 8);
            const c = Math.floor(Math.random() * 8);
            this.targetPos.copy(environment.getWorldPosition(r, c));
            return;
        }
        const limit = PlayerUtils.WORLD_LIMIT - 15;
        this.targetPos.set(
            (Math.random() - 0.5) * (limit * 2),
            0,
            (Math.random() - 0.5) * (limit * 2)
        );
    }

    update(dt: number, environment: Environment | CombatEnvironment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;

        // Snapping check for combat arena
        if (env instanceof CombatEnvironment && this.state !== ClericState.CAST && this.state !== ClericState.RETREAT) {
            const snapped = env.snapToGrid(this.position);
            this.position.lerp(snapped, 5.0 * dt);
        }

        let bestTarget = null;
        let bestDist = 20.0;
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // Clerics stay at medium range and cast support spells
        if (bestTarget) {
            if (this.state === ClericState.PATROL || this.state === ClericState.IDLE) {
                this.setState(ClericState.SUPPORT);
            }
            if (this.state === ClericState.SUPPORT) {
                if (distToTarget < 12.0 && distToTarget > 6.0 && this.attackCooldown <= 0) {
                    this.setState(ClericState.CAST);
                } else if (distToTarget < 5.0) {
                    this.setState(ClericState.RETREAT);
                } else if (distToTarget > 25.0) {
                    this.setState(ClericState.PATROL);
                } else {
                    this.targetPos.copy(this.currentTarget!.position);
                }
            }
            if (this.state === ClericState.CAST) {
                this.castTimer += dt;
                if (this.castTimer > 1.2) {
                    this.setState(ClericState.SUPPORT);
                    this.attackCooldown = 3.0 + Math.random() * 1.5;
                }
            }
            if (this.state === ClericState.RETREAT) {
                if (distToTarget > 8.0 || this.stateTimer > 2.0) {
                    this.setState(ClericState.SUPPORT);
                }
            }
        } else if (this.state !== ClericState.PATROL && this.state !== ClericState.IDLE) {
            this.setState(ClericState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case ClericState.PATROL:
                moveSpeed = 2.0;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 25.0) {
                    this.findPatrolPoint(env);
                    this.stateTimer = 0;
                }
                break;
            case ClericState.SUPPORT:
                moveSpeed = 3.0;
                break;
            case ClericState.CAST:
                moveSpeed = 0;
                break;
            case ClericState.RETREAT:
                if (this.currentTarget) {
                    const dirAway = new THREE.Vector3()
                        .subVectors(this.position, this.currentTarget.position)
                        .normalize();
                    const next = this.position.clone().add(dirAway.multiplyScalar(3.5 * dt));
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                moveSpeed = -3.5;
                break;
        }

        if (moveSpeed !== 0 && this.state !== ClericState.CAST) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.8) {
                    this.setState(ClericState.PATROL);
                    this.findPatrolPoint(env);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        if (this.state !== ClericState.CAST && this.state !== ClericState.RETREAT) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toGoal.y = 0;
            if (toGoal.length() > 0.1) {
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(toGoal.x, toGoal.z), 5.0 * dt);
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
                dt * 6.0
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
        const animY = (this.state === ClericState.RETREAT) ? 1 : (Math.abs(this.speedFactor) > 0.1 ? -1 : 0);

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === ClericState.CAST || this.state === ClericState.SUPPORT),
            isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false,
            isFireballCasting: this.isCasting, fireballTimer: this.castTimer,
            isSummoning: this.isCasting, summonTimer: this.castTimer
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: false, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, true);
    }
}
