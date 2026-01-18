import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { PlayerModel } from '../../../PlayerModel';
import { PlayerAnimator } from '../../../PlayerAnimator';
import { Environment } from '../../../Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';

enum MageState { IDLE, PATROL, CHASE, ATTACK, RETREAT }

export class Mage {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    private state: MageState = MageState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean, isWolf?: boolean } | null = null;
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
        
        this.config = { 
            ...DEFAULT_CONFIG, 
            bodyType: 'male', 
            bodyVariant: 'slim', 
            outfit: 'noble', 
            skinColor: '#d7ccc8', 
            shirtColor: '#000000', 
            pantsColor: '#000000', 
            bootsColor: '#000000',
            robeColor: '#000000',
            robeTrimColor: '#111111',
            hairStyle: 'bald', 
            // Added missing bracers, cape, belt to equipment
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, mask: false, hood: false, quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: true, blacksmithApron: false, mageHat: false, bracers: false, cape: true, belt: true
            }, 
            selectedItem: null, 
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

    private setState(newState: MageState) {
        if (this.state === newState) return;
        this.state = newState; 
        this.stateTimer = 0; 
        this.isCasting = (newState === MageState.ATTACK);
        if (this.isCasting) this.castTimer = 0;
    }

    private findPatrolPoint(environment: Environment) {
        const landmarks = environment.obstacles.filter(o => o.userData.type === 'hard');
        if (landmarks.length > 0 && Math.random() > 0.4) {
            const obj = landmarks[Math.floor(Math.random() * landmarks.length)];
            const pos = new THREE.Vector3(); obj.getWorldPosition(pos);
            const candidate = pos.clone().add(new THREE.Vector3((Math.random()-0.5)*30, 0, (Math.random()-0.5)*30));
            if (PlayerUtils.isWithinBounds(candidate, 2.0)) this.targetPos.copy(candidate);
            else this.targetPos.set(0, 0, 0);
        } else {
            const limit = PlayerUtils.WORLD_LIMIT - 10;
            this.targetPos.set((Math.random() - 0.5) * (limit * 2), 0, (Math.random() - 0.5) * (limit * 2));
        }
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean, isWolf?: boolean }[], skipAnimation: boolean = false) {
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        let bestTarget = null; let bestDist = 25.0;
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        if (this.config.isAssassinHostile && bestTarget) {
            if (this.state === MageState.PATROL || this.state === MageState.IDLE) this.setState(MageState.CHASE);
            
            if (this.state === MageState.CHASE) { 
                if (distToTarget < 12.0) this.setState(MageState.ATTACK); 
                else if (distToTarget > 35.0) this.setState(MageState.PATROL); 
                else this.targetPos.copy(this.currentTarget.position); 
            }
            
            if (this.state === MageState.ATTACK) {
                this.castTimer += dt;
                // Mage stands still while casting (animation logic handles the visuals)
                if (this.castTimer > 0.8) { // Fireball animation cycle is roughly 0.8s
                    this.setState(MageState.RETREAT);
                    this.attackCooldown = 2.0 + Math.random() * 2.0;
                }
            }

            if (this.state === MageState.RETREAT) {
                if (distToTarget > 18.0 || this.stateTimer > 1.5) {
                    this.setState(MageState.CHASE);
                }
            }
        } else if (this.state !== MageState.PATROL && this.state !== MageState.IDLE) {
            this.setState(MageState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case MageState.PATROL: 
                moveSpeed = 2.5; 
                if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 20.0) { 
                    this.findPatrolPoint(environment); 
                    this.stateTimer = 0; 
                } 
                break;
            case MageState.CHASE: 
                moveSpeed = 4.0; 
                break;
            case MageState.ATTACK: 
                moveSpeed = 0; 
                break;
            case MageState.RETREAT: 
                // Move away from target
                if (this.currentTarget) {
                    const dirAway = new THREE.Vector3().subVectors(this.position, this.currentTarget.position).normalize();
                    const next = this.position.clone().add(dirAway.multiplyScalar(4.5 * dt));
                    if (!PlayerUtils.checkCollision(next, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(next)) {
                        this.position.copy(next);
                    }
                }
                moveSpeed = -4.0; 
                break;
        }

        if (moveSpeed !== 0 && this.state !== MageState.ATTACK) { 
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { 
                this.stuckTimer += dt; 
                if (this.stuckTimer > 1.5) { 
                    this.setState(MageState.PATROL); 
                    this.findPatrolPoint(environment); 
                    this.stuckTimer = 0; 
                    this.stateTimer = 0; 
                } 
            } else { 
                this.stuckTimer = 0; 
                this.lastStuckPos.copy(this.position); 
            } 
        }

        if (this.state !== MageState.ATTACK && this.state !== MageState.RETREAT) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position); toGoal.y = 0;
            if (toGoal.length() > 0.1) {
                this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(toGoal.x, toGoal.z), 6.0 * dt);
                if (moveSpeed > 0) { 
                    const step = moveSpeed * dt; 
                    const next = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step)); 
                    if (!PlayerUtils.checkCollision(next, this.config, environment.obstacles) && PlayerUtils.isWithinBounds(next)) { 
                        this.position.x = next.x; this.position.z = next.z; 
                    } 
                }
            }
        } else if (this.currentTarget) { 
            // Face target during attack/retreat
            this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(this.currentTarget.position.x - this.position.x, this.currentTarget.position.z - this.position.z), dt * 10.0); 
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles), dt * 6);
        this.model.group.position.copy(this.position); 
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        if (this.currentTarget) { 
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 1.0, dt * 4.0); 
            this.smoothedHeadTarget.lerp(this.currentTarget.position.clone().add(new THREE.Vector3(0,1.6,0)), dt * 5.0); 
            this.cameraHandler.cameraWorldPosition.copy(this.smoothedHeadTarget); 
        } else { 
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 0.0, dt * 4.0); 
        }

        let targetSpeedAnim = (this.state === MageState.ATTACK) ? 0 : moveSpeed;
        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, targetSpeedAnim, dt * 6);
        let animX = 0;
        let animY = (this.state === MageState.RETREAT) ? 1 : (Math.abs(this.speedFactor) > 0.1 ? -1 : 0);

        const animContext = { 
            config: this.config, 
            model: this.model, 
            status: this.status, 
            cameraHandler: this.cameraHandler, 
            isCombatStance: (this.state === MageState.ATTACK || this.state === MageState.RETREAT || this.state === MageState.CHASE), 
            isJumping: false, 
            isAxeSwing: false, 
            axeSwingTimer: 0, 
            isPunch: false, 
            isPickingUp: false, 
            pickUpTime: 0, 
            isInteracting: false, 
            isWaving: false, 
            isSkinning: false, 
            isFishing: false, 
            isDragged: false, 
            walkTime: this.walkTime, 
            lastStepCount: this.lastStepCount, 
            didStep: false, 
            isFireballCasting: this.isCasting, 
            fireballTimer: this.castTimer 
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: animX, y: animY, isRunning: this.state === MageState.CHASE, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime; 
        this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0)); 
        this.model.sync(this.config, true);
    }
}
