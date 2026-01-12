
import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../types';
import { PlayerModel } from './PlayerModel';
import { PlayerAnimator } from './PlayerAnimator';
import { Environment } from './Environment';
import { PlayerUtils } from './player/PlayerUtils';

enum ArcherState {
    IDLE,
    PATROL,
    CHASE,
    DUEL, // Range maintenance
    ATTACK,
    RETREAT
}

export class Archer {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    
    // AI State
    private state: ArcherState = ArcherState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    
    // Combat Logic
    private duelTimer: number = 0;
    private strafeDir: number = 1;
    private attackCooldown: number = 0;
    private arrowTimer: number = 0;

    // Action Flags
    private isFiring: boolean = false;
    private fireTimer: number = 0;
    
    // Animation Smoothing
    private speedFactor: number = 0;
    private lastStepCount: number = 0;
    private walkTime: number = 0;
    private status = { isDead: false, recoverTimer: 0 };
    private cameraHandler = {
        blinkTimer: 0,
        isBlinking: false,
        eyeLookTarget: new THREE.Vector2(),
        eyeLookCurrent: new THREE.Vector2(),
        eyeMoveTimer: 0,
        lookAtCameraTimer: 0,
        cameraGazeTimer: 0,
        isLookingAtCamera: false,
        headLookWeight: 0,
        cameraWorldPosition: new THREE.Vector3()
    };

    private smoothedHeadTarget = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastFramePos.copy(initialPos);
        
        this.config = {
            ...DEFAULT_CONFIG,
            bodyType: 'male',
            bodyVariant: 'slim',
            outfit: 'warrior',
            skinColor: '#d7ccc8',
            shirtColor: '#2e7d32', // Green shirt
            pantsColor: '#1b5e20', // Green pants
            hairStyle: 'bald',
            equipment: {
                helm: false, shoulders: false, shield: false,
                shirt: true, pants: true, shoes: true, mask: false, hood: true,
                quiltedArmor: false,
                leatherArmor: true,
                heavyLeatherArmor: false,
                ringMail: false,
                plateMail: false,
                // Add missing robe property
                robe: false
            },
            selectedItem: 'Bow', // Equip bow
            weaponStance: 'side',
            isAssassinHostile: false,
            tintColor: tint
        };

        // Custom shoes color (green) - note: config doesn't have direct shoes color, 
        // but it's usually derived or handled in PlayerModel sync.
        // For Archer we'll stick to green theme.

        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        this.model.sync(this.config, true);
    }

    private setState(newState: ArcherState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isFiring = (newState === ArcherState.ATTACK);
        
        if (this.isFiring) this.fireTimer = 0;

        if (newState === ArcherState.DUEL) {
            this.duelTimer = 1.0 + Math.random() * 2.0;
            this.strafeDir = Math.random() > 0.5 ? 1 : -1;
        }
    }

    private findPatrolPoint(environment: Environment) {
        const landmarks = environment.obstacles.filter(o => o.userData.type === 'hard');
        if (landmarks.length > 0 && Math.random() > 0.4) {
            const obj = landmarks[Math.floor(Math.random() * landmarks.length)];
            const pos = new THREE.Vector3();
            obj.getWorldPosition(pos);
            const offset = new THREE.Vector3((Math.random()-0.5)*25, 0, (Math.random()-0.5)*25);
            const candidate = pos.clone().add(offset);
            if (PlayerUtils.isWithinBounds(candidate, 2.0)) {
                this.targetPos.copy(candidate);
            } else {
                this.targetPos.set(0, 0, 0);
            }
        } else {
            const limit = PlayerUtils.WORLD_LIMIT - 5;
            this.targetPos.set((Math.random() - 0.5) * (limit * 2), 0, (Math.random() - 0.5) * (limit * 2));
        }
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean, isWolf?: boolean }[]) {
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        let bestTarget = null;
        let bestDist = 30.0; // Longer vision range for archer
        
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            
            // Prioritize wolves if they are close
            let weight = 1.0;
            if (t.isWolf) weight = 0.8; // Lower weight = more attractive target
            
            if (d * weight < bestDist) {
                bestDist = d;
                bestTarget = t;
            }
        }
        
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // State Transitions
        if (this.config.isAssassinHostile && bestTarget) {
            if (this.state === ArcherState.PATROL || this.state === ArcherState.IDLE) {
                this.setState(ArcherState.CHASE);
            }
            
            if (this.state === ArcherState.CHASE) {
                if (distToTarget < 15.0) { // Range for bow
                    this.setState(ArcherState.DUEL);
                } else if (distToTarget > 40.0) {
                    this.setState(ArcherState.PATROL);
                } else {
                    this.targetPos.copy(this.currentTarget.position);
                }
            }

            if (this.state === ArcherState.DUEL) {
                this.duelTimer -= dt;
                this.targetPos.copy(this.currentTarget.position);

                if (distToTarget > 20.0) {
                    this.setState(ArcherState.CHASE);
                } else if (distToTarget < 8.0) {
                    this.setState(ArcherState.RETREAT);
                } else if (this.duelTimer <= 0 && this.attackCooldown <= 0) {
                    this.setState(ArcherState.ATTACK);
                }
            }

            if (this.state === ArcherState.ATTACK) {
                if (this.fireTimer > 1.2) { // Bow animation timing
                    this.setState(ArcherState.DUEL);
                    this.attackCooldown = 2.0 + Math.random();
                }
            }

            if (this.state === ArcherState.RETREAT) {
                if (distToTarget > 12.0 || this.stateTimer > 2.0) {
                    this.setState(ArcherState.DUEL);
                }
            }

        } else {
            if (this.state !== ArcherState.PATROL && this.state !== ArcherState.IDLE) {
                this.setState(ArcherState.PATROL);
            }
        }

        // Movement Logic
        let moveSpeed = 0;
        let turnSpeed = 8.0;
        let strafeX = 0;

        switch (this.state) {
            case ArcherState.PATROL:
                moveSpeed = 2.8;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 25.0) {
                    this.findPatrolPoint(environment);
                    this.stateTimer = 0;
                }
                break;

            case ArcherState.CHASE:
                moveSpeed = 5.0; 
                break;

            case ArcherState.DUEL:
                moveSpeed = 0.0;
                const toTarget = new THREE.Vector3().subVectors(this.currentTarget!.position, this.position).normalize();
                const right = new THREE.Vector3(0, 1, 0).cross(toTarget).normalize();
                const circleSpeed = 2.0;
                const strafeVec = right.multiplyScalar(this.strafeDir * circleSpeed);
                
                const idealDist = 12.0;
                if (distToTarget < idealDist - 1.0) {
                    strafeVec.add(toTarget.clone().multiplyScalar(-2.0));
                } else if (distToTarget > idealDist + 1.0) {
                    strafeVec.add(toTarget.clone().multiplyScalar(2.0));
                }

                const duelStep = strafeVec.multiplyScalar(dt);
                const duelNext = this.position.clone().add(duelStep);
                if (!PlayerUtils.checkCollision(duelNext, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(duelNext)) {
                    this.position.x = duelNext.x;
                    this.position.z = duelNext.z;
                }
                strafeX = this.strafeDir; 
                break;

            case ArcherState.ATTACK:
                moveSpeed = 0;
                this.fireTimer += dt;
                break;

            case ArcherState.RETREAT:
                const retreatDir = new THREE.Vector3().subVectors(this.position, this.currentTarget!.position).normalize();
                const retreatStep = retreatDir.multiplyScalar(5.0 * dt);
                const retreatNext = this.position.clone().add(retreatStep);
                if (!PlayerUtils.checkCollision(retreatNext, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(retreatNext)) {
                    this.position.copy(retreatNext);
                }
                moveSpeed = -4.5;
                break;
        }

        // Orientation
        if (this.state !== ArcherState.DUEL && this.state !== ArcherState.RETREAT && this.state !== ArcherState.ATTACK) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toGoal.y = 0;
            const distToGoal = toGoal.length();
            
            if (distToGoal > 0.1) {
                const steer = toGoal.clone().normalize();
                const desiredRot = Math.atan2(steer.x, steer.z);
                let diff = desiredRot - this.rotationY;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.rotationY += diff * turnSpeed * dt;
                
                if (moveSpeed > 0) {
                    const step = moveSpeed * dt;
                    const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));
                    if (!PlayerUtils.checkCollision(nextPos, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(nextPos)) {
                        this.position.x = nextPos.x;
                        this.position.z = nextPos.z;
                    }
                }
            }
        } else if (this.currentTarget) {
            const toTarget = new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize();
            const desiredRot = Math.atan2(toTarget.x, toTarget.z);
            let diff = desiredRot - this.rotationY;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.rotationY += diff * 12.0 * dt;
        }

        const groundH = PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles);
        this.position.y = THREE.MathUtils.lerp(this.position.y, groundH, dt * 6);

        this.model.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;
        
        let targetSpeed = moveSpeed;
        if (this.state === ArcherState.DUEL) targetSpeed = 1.5; 
        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, targetSpeed, dt * 6);

        if (this.currentTarget) {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 1.0, dt * 4.0);
            this.smoothedHeadTarget.lerp(this.currentTarget.position.clone().add(new THREE.Vector3(0,1.6,0)), dt * 5.0);
            this.cameraHandler.cameraWorldPosition.copy(this.smoothedHeadTarget);
        } else {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 0.0, dt * 4.0);
        }

        let animX = 0;
        let animY = 0;
        if (this.state === ArcherState.DUEL) {
            animX = this.strafeDir;
            animY = 0;
        } else if (this.state === ArcherState.RETREAT) {
            animY = 1;
        } else if (Math.abs(this.speedFactor) > 0.1) {
            animY = -1;
        }

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === ArcherState.DUEL || this.state === ArcherState.ATTACK || this.state === ArcherState.RETREAT),
            isJumping: false, isAxeSwing: false, axeSwingTimer: 0,
            isPunch: false, isPickingUp: false, pickUpTime: 0,
            isInteracting: false, isWaving: false, isSkinning: false, isFishing: false, isDragged: false,
            walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false,
            // Archer specific animation flags if they existed in PlayerAnimator
            isBowDraw: this.isFiring, bowDrawTimer: this.fireTimer
        };

        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1 || this.state === ArcherState.DUEL, {
            x: animX, y: animY, 
            isRunning: this.state === ArcherState.CHASE, isPickingUp: false, isDead: false, jump: false
        } as any);
        
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, true);
    }
}
