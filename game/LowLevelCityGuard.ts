
import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../types';
import { PlayerModel } from './PlayerModel';
import { PlayerAnimator } from './PlayerAnimator';
import { Environment } from './Environment';
import { PlayerUtils } from './player/PlayerUtils';

enum GuardState {
    PATROL,
    CHASE,
    DUEL,
    ATTACK
}

export class LowLevelCityGuard {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    
    private walkTime: number = 0;
    private lastStepCount: number = 0;
    private status = { isDead: false, recoverTimer: 0 };
    
    // AI State
    private state: GuardState = GuardState.PATROL;
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private patrolTarget = new THREE.Vector3();
    
    // Combat Logic
    private attackCooldown: number = 0;
    private duelTimer: number = 0;
    private strafeDir: number = 1;

    private cameraHandler = {
        blinkTimer: 0, isBlinking: false, eyeLookTarget: new THREE.Vector2(), eyeLookCurrent: new THREE.Vector2(),
        eyeMoveTimer: 0, lookAtCameraTimer: 0, cameraGazeTimer: 0, isLookingAtCamera: false,
        headLookWeight: 0, cameraWorldPosition: new THREE.Vector3()
    };

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, initialRot: number = 0, tint?: string) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.patrolTarget.copy(initialPos);
        this.rotationY = initialRot;

        this.config = {
            ...DEFAULT_CONFIG,
            bodyType: 'male',
            bodyVariant: 'average',
            skinColor: '#ffdbac',
            hairStyle: 'crew',
            hairColor: '#3e2723',
            shirtColor: '#4a3728', 
            pantsColor: '#718096', 
            bootsColor: '#8d6e63', 
            equipment: {
                helm: true, shoulders: true, shield: false,
                shirt: true, pants: true, shoes: true, mask: false, hood: false,
                quiltedArmor: true, leatherArmor: false, heavyLeatherArmor: false,
                ringMail: false, plateMail: false
            },
            selectedItem: 'Halberd',
            weaponStance: 'shoulder',
            tintColor: tint
        };

        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;
        this.scene.add(this.model.group);
        this.model.sync(this.config, false);
    }

    private setState(newState: GuardState) {
        if (this.state === newState) return;
        this.state = newState;
        
        if (newState === GuardState.DUEL) {
            this.duelTimer = 2.0 + Math.random() * 2.0; // Duel for 2-4s before decision
            this.strafeDir = Math.random() > 0.5 ? 1 : -1;
        }
        if (newState === GuardState.ATTACK) {
            this.strikeTimer = 0;
            this.isStriking = true;
        } else {
            this.isStriking = false;
        }
    }

    public isInCombat(): boolean {
        return this.state === GuardState.CHASE || this.state === GuardState.DUEL || this.state === GuardState.ATTACK;
    }

    update(dt: number, playerPosition: THREE.Vector3, environment: Environment, enemies: { position: THREE.Vector3, isDead?: boolean }[] = []) {
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // 1. Target Selection
        let bestTarget = null;
        let bestDist = 12.0;

        for (const e of enemies) {
            if (e.isDead) continue;
            const d = this.position.distanceTo(e.position);
            if (d < bestDist) {
                bestDist = d;
                bestTarget = e;
            }
        }
        this.currentTarget = bestTarget;

        let moveSpeed = 0;
        let isMoving = false;
        let animX = 0;
        let animY = 0;

        if (this.currentTarget) {
            const dist = this.position.distanceTo(this.currentTarget.position);
            
            // State Machine Transition
            if (this.state === GuardState.PATROL) {
                this.setState(GuardState.CHASE);
            }

            if (this.state === GuardState.CHASE) {
                if (dist < 3.0) {
                    this.setState(GuardState.DUEL);
                } else if (dist > 15.0) {
                    this.setState(GuardState.PATROL);
                }
            }

            if (this.state === GuardState.DUEL) {
                this.duelTimer -= dt;
                if (dist > 4.5) {
                    this.setState(GuardState.CHASE);
                } else if (this.duelTimer <= 0 && this.attackCooldown <= 0 && dist < 2.5) {
                    this.setState(GuardState.ATTACK);
                }
            }

            if (this.state === GuardState.ATTACK) {
                this.strikeTimer += dt;
                if (this.strikeTimer > 1.2) {
                    this.attackCooldown = 2.0 + Math.random(); // Recovery
                    this.setState(GuardState.DUEL);
                }
            }

            // --- Behavior per State ---
            
            if (this.state === GuardState.CHASE) {
                // Run to target
                const dir = new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize();
                const desiredRot = Math.atan2(dir.x, dir.z);
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, desiredRot, dt * 5.0);
                moveSpeed = 3.5;
                isMoving = true;
                animY = -1;
            } 
            else if (this.state === GuardState.DUEL) {
                // Strafe / Circle
                const toTarget = new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize();
                const desiredRot = Math.atan2(toTarget.x, toTarget.z);
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, desiredRot, dt * 10.0); // Face target fast
                
                const right = new THREE.Vector3(0, 1, 0).cross(toTarget).normalize();
                const strafeVec = right.multiplyScalar(this.strafeDir * 1.5); // Slower strafe
                
                // Maintain range
                if (dist < 2.0) strafeVec.add(toTarget.clone().multiplyScalar(-1.0)); // Back up
                else if (dist > 3.0) strafeVec.add(toTarget.clone().multiplyScalar(1.0)); // Creep forward

                const nextPos = this.position.clone().add(strafeVec.multiplyScalar(dt));
                if (!PlayerUtils.checkCollision(nextPos, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(nextPos)) {
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
                
                isMoving = true;
                moveSpeed = 1.5;
                animX = this.strafeDir;
            }
            else if (this.state === GuardState.ATTACK) {
                // Stand still and swing
                moveSpeed = 0;
                isMoving = false;
                // Maybe lunge a tiny bit
                if (this.strikeTimer < 0.3) {
                    const lunge = new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0), this.rotationY);
                    const lungeStep = lunge.multiplyScalar(2.0 * dt);
                    const lungeNext = this.position.clone().add(lungeStep);
                    if (!PlayerUtils.checkCollision(lungeNext, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(lungeNext)) {
                        this.position.copy(lungeNext);
                    }
                }
            }

        } else {
            // Idle / Patrol Logic
            this.setState(GuardState.PATROL);
            const distToHome = this.position.distanceTo(this.patrolTarget);
            if (distToHome > 1.0) {
                const dir = new THREE.Vector3().subVectors(this.patrolTarget, this.position).normalize();
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(dir.x, dir.z), dt * 3.0);
                moveSpeed = 2.5;
                isMoving = true;
                animY = -1;
            }
        }

        // Apply Movement (Chase/Patrol) - Duel handles its own position
        if ((this.state === GuardState.CHASE || this.state === GuardState.PATROL) && moveSpeed > 0) {
            const step = moveSpeed * dt;
            const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));
            if (!PlayerUtils.checkCollision(nextPos, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(nextPos)) {
                this.position.x = nextPos.x;
                this.position.z = nextPos.z;
            }
        }

        // --- Entity Collision Avoidance ---
        if (this.currentTarget && !this.currentTarget.isDead) {
            const toEntity = new THREE.Vector3().subVectors(this.currentTarget.position, this.position);
            const dist = toEntity.length();
            const minSep = 0.9;
            if (dist < minSep) {
                const pushDir = toEntity.normalize().negate();
                const pushStr = (minSep - dist) * 5.0 * dt; 
                const pushNext = this.position.clone().add(pushDir.multiplyScalar(pushStr));
                if (PlayerUtils.isWithinBounds(pushNext)) {
                    this.position.copy(pushNext);
                }
            }
        }

        const groundH = PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles);
        this.position.y = groundH;
        this.model.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;

        // Head tracking
        const lookTarget = this.currentTarget?.position || playerPosition;
        const lookDist = this.position.distanceTo(lookTarget);
        this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, lookDist < 8.0 ? 1.0 : 0.0, dt * 3.0);
        this.cameraHandler.cameraWorldPosition.copy(lookTarget).y += 1.6;

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === GuardState.DUEL || this.state === GuardState.ATTACK), 
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer,
            isPunch: false, isPickingUp: false, isInteracting: false, isWaving: false, isSkinning: false, isFishing: false, isDragged: false,
            walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };

        this.animator.animate(animContext, dt, isMoving, {
            x: animX, y: animY, isRunning: moveSpeed > 3.0, isPickingUp: false, isDead: false, jump: false
        } as any);
        
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, !!this.currentTarget);
    }
}
