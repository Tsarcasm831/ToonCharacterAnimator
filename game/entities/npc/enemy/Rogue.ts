import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { Environment } from '../../../environment/Environment';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';
import { HumanoidEntity } from '../../HumanoidEntity';

enum RogueState { IDLE, PATROL, STALK, CHASE, ATTACK, RETREAT }

export class Rogue extends HumanoidEntity {
    velocity: THREE.Vector3 = new THREE.Vector3();
    
    private state: RogueState = RogueState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private speedFactor: number = 0;
    
    private smoothedHeadTarget = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        super(scene, initialPos, Rogue.createConfig(tint));
        
        this.lastStuckPos.copy(this.position);
        this.model.sync(this.config, true);
    }

    private static createConfig(tint?: string): PlayerConfig {
        // Rogues are slim and agile
        const isFemale = Math.random() > 0.6;
        
        return { 
            ...DEFAULT_CONFIG, 
            bodyType: isFemale ? 'female' : 'male', 
            bodyVariant: 'slim', 
            outfit: 'warrior', 
            skinColor: isFemale ? '#f5deb3' : '#d4a574',
            shirtColor: '#1a1a1a',
            pantsColor: '#0d0d0d',
            bootsColor: '#0a0a0a',
            hoodColor: '#1a1a1a',
            hairStyle: isFemale ? 'crew' : 'bald',
            hairColor: isFemale ? '#2d1810' : '#1a1a1a',
            stats: { ...CLASS_STATS.rogue },
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, 
                mask: true, hood: true, quiltedArmor: false, leatherArmor: true, 
                heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, 
                blacksmithApron: false, mageHat: false, bracers: true, cape: true, belt: true,
                skirt: false, skullcap: false, shorts: false
            }, 
            selectedItem: 'Knife',
            weaponStance: 'side',
            isAssassinHostile: true,
            tintColor: tint 
        } as any;
    }

    private setState(newState: RogueState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isStriking = (newState === RogueState.ATTACK);
        if (this.isStriking) this.strikeTimer = 0;
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
        if (this.isDead) return;
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;

        // Snapping check for combat arena
        if (env instanceof CombatEnvironment && this.state !== RogueState.ATTACK && this.state !== RogueState.RETREAT) {
            const snapped = env.snapToGrid(this.position);
            this.position.lerp(snapped, 5.0 * dt);
        }

        const cameraPos = (env as any).scene?.userData?.camera?.position || new THREE.Vector3(0, 10, 10);
        // this.updateStatBars(cameraPos, isCombatActive);

        if (!isCombatActive) {
            this.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            if (skipAnimation) return;
            
            this.targetPosition.copy(this.position);
            this.targetRotationY = this.rotationY;
            
            this.updateModel(dt);
            this.model.sync(this.config, true);
            return;
        }

        let bestTarget = null;
        let bestDist = 40.0; // Increased from 25.0
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // Rogues stalk before attacking
        if (isCombatActive && bestTarget) {
            if (this.state === RogueState.PATROL || this.state === RogueState.IDLE) {
                this.setState(RogueState.STALK);
            }
            if (this.state === RogueState.STALK) {
                if (distToTarget < 5.0) this.setState(RogueState.CHASE);
                else if (distToTarget > 45.0) this.setState(RogueState.PATROL); // Increased from 30.0
                else this.targetPos.copy(this.currentTarget!.position);
            }
            if (this.state === RogueState.CHASE) {
                if (distToTarget < 2.0 && this.attackCooldown <= 0) this.setState(RogueState.ATTACK);
                else if (distToTarget > 8.0) this.setState(RogueState.STALK);
                else this.targetPos.copy(this.currentTarget!.position);
            }
            if (this.state === RogueState.ATTACK && this.strikeTimer > 0.5) {
                this.setState(RogueState.RETREAT);
                this.attackCooldown = 0.8 + Math.random() * 0.5;
            }
            if (this.state === RogueState.RETREAT && this.stateTimer > 0.4) {
                this.setState(RogueState.CHASE);
            }
        } else if (this.state !== RogueState.PATROL && this.state !== RogueState.IDLE) {
            this.setState(RogueState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case RogueState.PATROL:
                moveSpeed = 3.0;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 18.0) {
                    this.findPatrolPoint(environment);
                    this.stateTimer = 0;
                }
                break;
            case RogueState.STALK:
                moveSpeed = 3.5; // Slow approach
                break;
            case RogueState.CHASE:
                moveSpeed = 7.0; // Very fast
                break;
            case RogueState.ATTACK:
                this.strikeTimer += dt;
                if (this.strikeTimer < 0.15) {
                    const step = new THREE.Vector3(0, 0, 1)
                        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY)
                        .multiplyScalar(10.0 * dt);
                    const next = this.position.clone().add(step);
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                break;
            case RogueState.RETREAT:
                if (this.currentTarget) {
                    const step = new THREE.Vector3()
                        .subVectors(this.position, this.currentTarget.position)
                        .normalize()
                        .multiplyScalar(6.0 * dt);
                    const next = this.position.clone().add(step);
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                moveSpeed = -6.0;
                break;
        }

        // Stuck detection
        if (moveSpeed !== 0) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.0) {
                    this.setState(RogueState.PATROL);
                    this.findPatrolPoint(environment);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        // Movement
        if (this.state !== RogueState.ATTACK && this.state !== RogueState.RETREAT) {
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
                dt * 15.0
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

        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, moveSpeed, dt * 8);
        const animY = (this.state === RogueState.RETREAT) ? 1 : (Math.abs(this.speedFactor) > 0.1 ? -1 : 0);

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: true,
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: this.state === RogueState.CHASE, isPickingUp: false, isDead: this.isDead, jump: false } as any, env.obstacles);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        
        this.targetPosition.copy(this.position);
        this.targetRotationY = this.rotationY;
        
        this.updateModel(dt);
        this.model.sync(this.config, true);
    }
}
