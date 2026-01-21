
import * as THREE from 'three';
import { EntityStats, DEFAULT_CONFIG } from '../../../../types';
import { HumanoidEntity } from '../../../entities/HumanoidEntity';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';

enum MonkState { IDLE, PATROL, CHASE, FLURRY, RECOVER }

export class Monk extends HumanoidEntity {
    velocity: THREE.Vector3 = new THREE.Vector3();
    stats: EntityStats;
    
    private state: MonkState = MonkState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isPunching: boolean = false;
    private punchTimer: number = 0;
    private comboCount: number = 0;
    private speedFactor: number = 0;
    
    private smoothedHeadTarget = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        // Monks are martial artists - slim/average builds with simple robes
        const isFemale = Math.random() > 0.6;
        
        const config = { 
            ...DEFAULT_CONFIG, 
            bodyType: isFemale ? 'female' : 'male', 
            bodyVariant: 'average', 
            outfit: 'noble', 
            skinColor: isFemale ? '#f5deb3' : '#d2b48c',
            shirtColor: '#ff8c00',
            pantsColor: '#8b4513',
            bootsColor: '#654321',
            robeColor: '#ff8c00',
            robeTrimColor: '#8b0000',
            hairStyle: 'bald',
            stats: { ...CLASS_STATS.monk },
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: false, 
                mask: false, hood: false, quiltedArmor: false, leatherArmor: false, 
                heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: true, 
                blacksmithApron: false, mageHat: false, bracers: false, cape: false, belt: true,
                skirt: false, skullcap: false, shorts: false
            }, 
            selectedItem: null, // Unarmed combat
            weaponStance: 'side',
            isAssassinHostile: false,
            tintColor: tint || '#ff8c00'
        } as any;

        super(scene, initialPos, config);
        
        this.stats = { ...CLASS_STATS.monk };
        this.lastStuckPos.copy(this.position);
        this.lastFramePos.copy(this.position);
    }
    
    private setState(newState: MonkState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isPunching = (newState === MonkState.FLURRY);
        if (this.isPunching) {
            this.punchTimer = 0;
            this.comboCount++;
        }
        if (newState === MonkState.RECOVER) {
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
        if (this.isDead) return;
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;
        // const cameraPos = (env as any).scene?.userData?.camera?.position || new THREE.Vector3(0, 10, 10);
        // this.updateStatBars(cameraPos, isCombatActive);

        // Snapping check for combat arena
        if (env instanceof CombatEnvironment) {
            const snapped = env.snapToGrid(this.position);
            if (this.state !== MonkState.FLURRY && this.state !== MonkState.RECOVER) {
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
        let bestDist = 30.0; // Increased from 18.0
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // Monks use rapid flurry attacks
        if (isCombatActive && bestTarget) {
            if (this.state === MonkState.PATROL || this.state === MonkState.IDLE) {
                this.setState(MonkState.CHASE);
            }
            if (this.state === MonkState.CHASE) {
                if (distToTarget < 2.5 && this.attackCooldown <= 0) this.setState(MonkState.FLURRY);
                else if (distToTarget > 35.0) this.setState(MonkState.PATROL); // Increased from 25.0
                else this.targetPos.copy(this.currentTarget!.position);
            }
            if (this.state === MonkState.FLURRY && this.punchTimer > 0.35) {
                // Rapid combo - up to 4 hits
                if (this.comboCount < 4 && distToTarget < 3.0) {
                    this.setState(MonkState.FLURRY);
                } else {
                    this.setState(MonkState.RECOVER);
                    this.attackCooldown = 1.0 + Math.random() * 0.5;
                }
            }
            if (this.state === MonkState.RECOVER && this.stateTimer > 0.6) {
                this.setState(MonkState.CHASE);
            }
        } else if (this.state !== MonkState.PATROL && this.state !== MonkState.IDLE) {
            this.setState(MonkState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case MonkState.PATROL:
                moveSpeed = 3.0;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 18.0) {
                    this.findPatrolPoint(env);
                    this.stateTimer = 0;
                }
                break;
            case MonkState.CHASE:
                moveSpeed = 6.5; // Very fast
                break;
            case MonkState.FLURRY:
                this.punchTimer += dt;
                if (this.punchTimer < 0.12) {
                    const step = new THREE.Vector3(0, 0, 1)
                        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY)
                        .multiplyScalar(8.0 * dt);
                    const next = this.position.clone().add(step);
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                break;
            case MonkState.RECOVER:
                // Slight backstep during recovery
                if (this.currentTarget && this.stateTimer < 0.3) {
                    const step = new THREE.Vector3()
                        .subVectors(this.position, this.currentTarget.position)
                        .normalize()
                        .multiplyScalar(3.0 * dt);
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
                if (this.stuckTimer > 1.2) {
                    this.setState(MonkState.PATROL);
                    this.findPatrolPoint(env);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        if (this.state !== MonkState.FLURRY && this.state !== MonkState.RECOVER) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toGoal.y = 0;
            if (toGoal.length() > 0.1) {
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(toGoal.x, toGoal.z), 10.0 * dt);
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
        const animY = Math.abs(this.speedFactor) > 0.1 ? -1 : 0;

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === MonkState.FLURRY || this.state === MonkState.CHASE),
            isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: this.isPunching, punchTimer: this.punchTimer,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: this.state === MonkState.CHASE, isPickingUp: false, isDead: false, jump: false } as any, env.obstacles);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.updateModel(dt);
        this.model.sync(this.config, true);
    }
}
