
import * as THREE from 'three';
import { DEFAULT_CONFIG } from '../../../../types';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { AIUtils } from '../../../core/AIUtils';
import { CLASS_STATS } from '../../../../data/stats';
import { HumanoidEntity } from '../../HumanoidEntity';

enum SentinelState { IDLE, PATROL, INTERCEPT, GUARD, ATTACK }

export class Sentinel extends HumanoidEntity {
    velocity: THREE.Vector3 = new THREE.Vector3();
    
    private state: SentinelState = SentinelState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private guardTimer: number = 0;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private speedFactor: number = 0;
    
    private smoothedHeadTarget = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        super(scene, initialPos, Sentinel.createConfig(tint));
        
        this.stats = { ...CLASS_STATS.sentinel };
        this.lastStuckPos.copy(this.position);
        
        this.model.sync(this.config, true);
    }

    private static createConfig(tint?: string): any {
        // Sentinels are heavy defensive warriors - heavy/muscular builds with full armor
        const bodyVariants = ['heavy', 'muscular'] as const;
        const randomVariant = bodyVariants[Math.floor(Math.random() * bodyVariants.length)];
        
        return { 
            ...DEFAULT_CONFIG, 
            bodyType: 'male', 
            bodyVariant: randomVariant, 
            outfit: 'warrior', 
            skinColor: '#d2b48c',
            shirtColor: '#4682b4',
            pantsColor: '#2f4f4f',
            bootsColor: '#1c1c1c',
            hairStyle: 'bald',
            stats: { ...CLASS_STATS.sentinel },
            equipment: { 
                helm: true, shoulders: true, shield: true, shirt: true, pants: true, shoes: true, 
                mask: true, hood: false, quiltedArmor: false, leatherArmor: false, 
                heavyLeatherArmor: false, ringMail: false, plateMail: true, robe: false, 
                blacksmithApron: false, mageHat: false, bracers: true, cape: true, belt: true,
                skirt: false, skullcap: false, shorts: false
            }, 
            selectedItem: 'Sword',
            weaponStance: 'side',
            isAssassinHostile: false,
            tintColor: tint 
        } as any;
    }

    private setState(newState: SentinelState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isStriking = (newState === SentinelState.ATTACK);
        if (this.isStriking) this.strikeTimer = 0;
        if (newState === SentinelState.GUARD) {
            this.guardTimer = 2.0 + Math.random() * 1.5;
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
        if (this.isDead) return;
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;
        // const cameraPos = (env as any).scene?.userData?.camera?.position || new THREE.Vector3(0, 10, 10);
        // this.updateStatBars(cameraPos, isCombatActive);

        // Snapping check for combat arena
        if (env instanceof CombatEnvironment && this.state !== SentinelState.ATTACK && this.state !== SentinelState.GUARD) {
            const snapped = env.snapToGrid(this.position);
            this.position.lerp(snapped, 5.0 * dt);
        }

        if (!isCombatActive) {
            this.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            if (skipAnimation) return;
            
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
                isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
            };
            this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: false, isPickingUp: false, isDead: false, jump: false } as any);
            this.walkTime = animContext.walkTime;
            this.lastStepCount = animContext.lastStepCount;

            this.updateModel(dt);
            this.model.sync(this.config, true);
            return;
        }

        let bestTarget = null;
        let bestDist = 30.0; // Increased from 18.0
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // Sentinels intercept and hold ground
        if (isCombatActive && bestTarget) {
            if (this.state === SentinelState.PATROL || this.state === SentinelState.IDLE) {
                this.setState(SentinelState.INTERCEPT);
            }
            if (this.state === SentinelState.INTERCEPT) {
                if (distToTarget < 4.0) this.setState(SentinelState.GUARD);
                else if (distToTarget > 35.0) this.setState(SentinelState.PATROL); // Increased from 25.0
                else this.targetPos.copy(this.currentTarget!.position);
            }
            if (this.state === SentinelState.GUARD) {
                this.guardTimer -= dt;
                if (distToTarget > 5.0) this.setState(SentinelState.INTERCEPT);
                else if (this.guardTimer <= 0 && this.attackCooldown <= 0) this.setState(SentinelState.ATTACK);
            }
            if (this.state === SentinelState.ATTACK && this.strikeTimer > 0.9) {
                this.setState(SentinelState.GUARD);
                this.attackCooldown = 2.0 + Math.random();
            }
        } else if (this.state !== SentinelState.PATROL && this.state !== SentinelState.IDLE) {
            this.setState(SentinelState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case SentinelState.PATROL:
                moveSpeed = 1.8; // Slow patrol due to heavy armor
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 28.0) {
                    this.findPatrolPoint(env);
                    this.stateTimer = 0;
                }
                break;
            case SentinelState.INTERCEPT:
                moveSpeed = 3.5;
                break;
            case SentinelState.GUARD:
                moveSpeed = 0; // Standing ground
                break;
            case SentinelState.ATTACK:
                this.strikeTimer += dt;
                if (this.strikeTimer < 0.35) {
                    const step = new THREE.Vector3(0, 0, 1)
                        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY)
                        .multiplyScalar(4.0 * dt);
                    const next = this.position.clone().add(step);
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                break;
        }

        if (moveSpeed !== 0) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 2.0) {
                    this.setState(SentinelState.PATROL);
                    this.findPatrolPoint(env);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        if (this.state !== SentinelState.GUARD && this.state !== SentinelState.ATTACK) {
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
        const animY = Math.abs(this.speedFactor) > 0.1 ? -1 : 0;

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === SentinelState.GUARD || this.state === SentinelState.ATTACK),
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: this.state === SentinelState.INTERCEPT, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.updateModel(dt);
        this.model.sync(this.config, true);
    }
}
