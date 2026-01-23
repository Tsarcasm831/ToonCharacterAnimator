import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { Environment } from '../../../environment/Environment';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';
import { HumanoidEntity } from '../../HumanoidEntity';

enum WarlockState { IDLE, PATROL, CHASE, CAST, RETREAT }

export class Warlock extends HumanoidEntity {
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
    
    private smoothedHeadTarget = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        super(scene, initialPos, Warlock.createConfig(tint));
        
        this.lastStuckPos.copy(this.position);
        this.model.sync(this.config, true);
    }

    private static createConfig(tint?: string): PlayerConfig {
        // Warlocks can be male or female, typically slim
        const isFemale = Math.random() > 0.5;
        const bodyVariants = ['slim', 'average'] as const;
        const randomVariant = bodyVariants[Math.floor(Math.random() * bodyVariants.length)];

        return { 
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
                mask: true, hood: true, quiltedArmor: false, leatherArmor: false, 
                heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: true, 
                blacksmithApron: false, mageHat: true, bracers: true, cape: true, belt: true,
                skirt: false, skullcap: false, shorts: false
            }, 
            selectedItem: null, 
            weaponStance: 'side', 
            isAssassinHostile: true, 
            tintColor: tint 
        } as any;
    }

    private setState(newState: WarlockState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isCasting = (newState === WarlockState.CAST);
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

    update(dt: number, environment: Environment | CombatEnvironment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false, isCombatActive: boolean = true) {
        if (this.isDead) return;
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;

        // Snapping check for combat arena
        if (env instanceof CombatEnvironment && this.state !== WarlockState.CAST && this.state !== WarlockState.RETREAT) {
            const snapped = env.snapToGrid(this.position);
            this.position.lerp(snapped, 5.0 * dt);
        }

        if (!isCombatActive) {
            this.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            if (skipAnimation) return;
            
            this.targetPosition.copy(this.position);
            this.targetRotationY = this.rotationY;
            
            // Calculate speed for animation
            const dist = this.position.distanceTo(this.lastFramePos);
            const speed = dist / dt;
            this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, speed, dt * 6);
            const animY = Math.abs(this.speedFactor) > 0.1 ? -1 : 0;

            const animContext = {
                config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
                isCombatStance: false,
                isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: false,
                isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
                isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false,
                isFireballCasting: false, fireballTimer: 0, isSummoning: false, summonTimer: 0
            };
            this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: false, isPickingUp: false, isDead: this.isDead, jump: false } as any, env.obstacles);
            this.walkTime = animContext.walkTime;
            this.lastStepCount = animContext.lastStepCount;
            
            this.updateModel(dt);
            this.model.sync(this.config, true);
            return;
        }

        let bestTarget = null;
        let bestDist = 35.0; // Increased from 22.0
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // Warlocks keep distance and cast spells
        if (isCombatActive && bestTarget) {
            if (this.state === WarlockState.PATROL || this.state === WarlockState.IDLE) {
                this.setState(WarlockState.CHASE);
            }
            if (this.state === WarlockState.CHASE) {
                if (distToTarget < 15.0 && distToTarget > 8.0 && this.attackCooldown <= 0) {
                    this.setState(WarlockState.CAST);
                } else if (distToTarget < 8.0) {
                    this.setState(WarlockState.RETREAT);
                } else if (distToTarget > 40.0) { // Increased from 30.0
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
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
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
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, 8.0);
                const avoidanceRot = AIUtils.getAdvancedAvoidanceSteering(this.position, this.rotationY, new THREE.Vector3(0.6, 2.0, 0.6), env.obstacles);
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
                dt * 8.0
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
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: this.state === WarlockState.CHASE, isPickingUp: false, isDead: this.isDead, jump: false } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        
        this.targetPosition.copy(this.position);
        this.targetRotationY = this.rotationY;
        
        this.updateModel(dt);
        this.model.sync(this.config, true);
    }
}
