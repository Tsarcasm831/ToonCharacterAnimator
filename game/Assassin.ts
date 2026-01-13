
import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../types';
import { PlayerModel } from './PlayerModel';
import { PlayerAnimator } from './PlayerAnimator';
import { Environment } from './Environment';
import { PlayerUtils } from './player/PlayerUtils';

enum AssassinState {
    IDLE,
    PATROL,      
    SURVIVAL,    
    CHASE,       
    STALK,       
    INVESTIGATE, 
    ATTACK,
    RETREAT,     // New: Jump back after hit
    DUEL         // New: Circle/Strafe waiting for opening
}

export class Assassin {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    
    // AI State
    private state: AssassinState = AssassinState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    
    // Combat Logic
    private duelTimer: number = 0;
    private strafeDir: number = 1; // 1 or -1
    private attackCooldown: number = 0;

    // Stuck Recovery
    private evaluationTimer: number = 0;
    
    // Action Flags
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private isPickingUp: boolean = false;
    private pickUpTimer: number = 0;
    
    // Animation Smoothing
    private speedFactor: number = 0;

    // Internal state for Animator compatibility
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
            shirtColor: '#000000', 
            pantsColor: '#000000',
            hairStyle: 'bald',
            equipment: {
                helm: false, shoulders: true, shield: false,
                shirt: true, pants: true, shoes: true, mask: true, hood: true,
                quiltedArmor: false,
                leatherArmor: false,
                heavyLeatherArmor: false,
                ringMail: false,
                plateMail: false,
                // Add missing robe property
                robe: false,
                // Added missing blacksmithApron property
                blacksmithApron: false
            },
            selectedItem: 'Knife',
            weaponStance: 'side',
            isAssassinHostile: false,
            tintColor: tint
        };

        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        this.model.sync(this.config, true);
    }

    private setState(newState: AssassinState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.isStriking = (newState === AssassinState.ATTACK);
        this.isPickingUp = (newState === AssassinState.INVESTIGATE);
        
        if (this.isStriking) this.strikeTimer = 0;
        if (this.isPickingUp) this.pickUpTimer = 0;

        // Reset duel params on entry
        if (newState === AssassinState.DUEL) {
            this.duelTimer = 1.0 + Math.random() * 2.0; // Strafe for 1-3 seconds
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
            // Ensure patrol point itself is within bounds
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

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[]) {
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // 1. Target Selection
        let bestTarget = null;
        let bestDist = 20.0; // Vision range
        
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) {
                bestDist = d;
                bestTarget = t;
            }
        }
        
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // State Transitions
        if (this.config.isAssassinHostile && bestTarget) {
            // Combat Logic State Machine
            if (this.state === AssassinState.PATROL || this.state === AssassinState.IDLE) {
                this.setState(AssassinState.CHASE);
            }
            
            // From CHASE -> DUEL
            if (this.state === AssassinState.CHASE) {
                if (distToTarget < 4.0) {
                    this.setState(AssassinState.DUEL);
                } else if (distToTarget > 25.0) {
                    this.setState(AssassinState.PATROL); // Lost target
                } else {
                    this.targetPos.copy(this.currentTarget.position);
                }
            }

            // From DUEL -> ATTACK or CHASE
            if (this.state === AssassinState.DUEL) {
                this.duelTimer -= dt;
                
                // Keep looking at target
                this.targetPos.copy(this.currentTarget.position);

                if (distToTarget > 5.0) {
                    this.setState(AssassinState.CHASE);
                } else if (this.duelTimer <= 0 && this.attackCooldown <= 0) {
                    this.setState(AssassinState.ATTACK);
                }
            }

            // From ATTACK -> RETREAT
            if (this.state === AssassinState.ATTACK) {
                if (this.strikeTimer > 0.6) { // Animation done
                    this.setState(AssassinState.RETREAT);
                    this.attackCooldown = 1.5 + Math.random(); // Cooldown
                }
            }

            // From RETREAT -> DUEL
            if (this.state === AssassinState.RETREAT) {
                if (this.stateTimer > 0.8) { // Retreat for 0.8s
                    this.setState(AssassinState.DUEL);
                }
            }

        } else {
            // No target
            if (this.state !== AssassinState.PATROL && this.state !== AssassinState.IDLE) {
                this.setState(AssassinState.PATROL);
            }
        }

        // --- Movement Logic ---
        let moveSpeed = 0;
        let turnSpeed = 8.0;
        let strafeX = 0;
        let strafeZ = 0; // Forward/Back in local space

        switch (this.state) {
            case AssassinState.PATROL:
                moveSpeed = 2.8;
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 25.0) {
                    this.findPatrolPoint(environment);
                    this.stateTimer = 0;
                }
                break;

            case AssassinState.CHASE:
                moveSpeed = 5.5; 
                break;

            case AssassinState.DUEL:
                moveSpeed = 0.0; // Handled manually via strafe calculation below
                // Strafe logic
                // Vector to target
                const toTarget = new THREE.Vector3().subVectors(this.currentTarget!.position, this.position).normalize();
                const right = new THREE.Vector3(0, 1, 0).cross(toTarget).normalize();
                
                // Circle around
                const circleSpeed = 2.5;
                const strafeVec = right.multiplyScalar(this.strafeDir * circleSpeed);
                
                // Maintain ideal distance (2.5m)
                const idealDist = 2.5;
                if (distToTarget < idealDist - 0.5) {
                    strafeVec.add(toTarget.clone().multiplyScalar(-1.5)); // Back up
                } else if (distToTarget > idealDist + 0.5) {
                    strafeVec.add(toTarget.clone().multiplyScalar(1.5)); // Close in
                }

                // Apply to position manually since this isn't forward movement
                const duelStep = strafeVec.multiplyScalar(dt);
                const duelNext = this.position.clone().add(duelStep);
                if (!PlayerUtils.checkCollision(duelNext, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(duelNext)) {
                    this.position.x = duelNext.x;
                    this.position.z = duelNext.z;
                }
                
                // Animation Params for strafing
                strafeX = this.strafeDir; 
                break;

            case AssassinState.ATTACK:
                moveSpeed = 0;
                this.strikeTimer += dt;
                // Lunge forward slightly during attack start
                if (this.strikeTimer < 0.2) {
                    const lungeDir = new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0), this.rotationY);
                    const lungeStep = lungeDir.multiplyScalar(8.0 * dt);
                    const lungeNext = this.position.clone().add(lungeStep);
                    if (!PlayerUtils.checkCollision(lungeNext, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(lungeNext)) {
                        this.position.copy(lungeNext);
                    }
                }
                break;

            case AssassinState.RETREAT:
                // Move backward away from target
                const retreatDir = new THREE.Vector3().subVectors(this.position, this.currentTarget!.position).normalize();
                const retreatStep = retreatDir.multiplyScalar(4.0 * dt);
                const retreatNext = this.position.clone().add(retreatStep);
                if (!PlayerUtils.checkCollision(retreatNext, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(retreatNext)) {
                    this.position.copy(retreatNext);
                }
                moveSpeed = -4.0; // Animation backwards
                break;
        }

        // Orientation & Standard Movement
        if (this.state !== AssassinState.DUEL && this.state !== AssassinState.RETREAT && this.state !== AssassinState.ATTACK) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;
            const distToGoal = toTarget.length();
            
            if (distToGoal > 0.1) {
                const steer = toTarget.clone().normalize();
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
        } else if (this.currentTarget && (this.state === AssassinState.DUEL || this.state === AssassinState.ATTACK || this.state === AssassinState.RETREAT)) {
            // Face target constantly
            const toTarget = new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize();
            const desiredRot = Math.atan2(toTarget.x, toTarget.z);
            let diff = desiredRot - this.rotationY;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.rotationY += diff * 15.0 * dt; // Fast turn
        }

        // --- ENTITY COLLISION AVOIDANCE ---
        if (this.currentTarget && !this.currentTarget.isDead) {
            const toEntity = new THREE.Vector3().subVectors(this.currentTarget.position, this.position);
            const dist = toEntity.length();
            const minSep = 0.9; // Personal space
            if (dist < minSep) {
                const pushDir = toEntity.normalize().negate();
                const pushStr = (minSep - dist) * 5.0 * dt; 
                const pushStep = pushDir.multiplyScalar(pushStr);
                const pushNext = this.position.clone().add(pushStep);
                // Respect boundaries even when being pushed
                if (PlayerUtils.isWithinBounds(pushNext)) {
                    this.position.copy(pushNext);
                }
            }
        }

        const groundH = PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles);
        this.position.y = THREE.MathUtils.lerp(this.position.y, groundH, dt * 6);

        this.model.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;
        
        let targetSpeed = moveSpeed;
        if (this.state === AssassinState.DUEL) targetSpeed = 2.0; 
        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, targetSpeed, dt * 6);

        // Target Gaze
        if (this.currentTarget) {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 1.0, dt * 4.0);
            this.smoothedHeadTarget.lerp(this.currentTarget.position.clone().add(new THREE.Vector3(0,1.6,0)), dt * 5.0);
            this.cameraHandler.cameraWorldPosition.copy(this.smoothedHeadTarget);
        } else {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 0.0, dt * 4.0);
        }

        // Resolve Animation Input
        let animX = 0;
        let animY = 0;
        if (this.state === AssassinState.DUEL) {
            animX = this.strafeDir;
            animY = 0;
        } else if (this.state === AssassinState.RETREAT) {
            animY = 1; // Backwards
        } else if (Math.abs(this.speedFactor) > 0.1) {
            animY = -1; // Forward
        }

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: (this.state === AssassinState.DUEL || this.state === AssassinState.ATTACK || this.state === AssassinState.RETREAT),
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer,
            isPunch: false, isPickingUp: this.isPickingUp, pickUpTime: this.pickUpTimer,
            isInteracting: false, isWaving: false, isSkinning: false, isFishing: false, isDragged: false,
            walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };

        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1 || this.state === AssassinState.DUEL, {
            x: animX, y: animY, 
            isRunning: this.state === AssassinState.CHASE, isPickingUp: this.isPickingUp, isDead: false, jump: false
        } as any);
        
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, true);
    }
}
