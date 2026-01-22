
import * as THREE from 'three';
import { EntityStats, DEFAULT_CONFIG } from '../../../../types';
import { HumanoidEntity } from '../../../entities/HumanoidEntity';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { Environment } from '../../../environment/Environment';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';
import { PlayerCombat } from '../../../player/PlayerCombat';

enum MageState { IDLE, PATROL, CHASE, ATTACK, RETREAT }

export class Mage extends HumanoidEntity {
    velocity: THREE.Vector3 = new THREE.Vector3();
    stats: EntityStats;
    
    private state: MageState = MageState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean, isWolf?: boolean } | null = null;
    private currentPath: { r: number, c: number }[] = [];
    private pathIndex: number = 0;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isCasting: boolean = false;
    private castTimer: number = 0;
    private hasCastSpell: boolean = false;
    private speedFactor: number = 0;
    
    private smoothedHeadTarget = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        const config = { 
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
            stats: { ...CLASS_STATS.mage },
            // Added missing bracers, cape, belt to equipment
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, mask: false, hood: false, quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: true, blacksmithApron: false, mageHat: false, bracers: false, cape: true, belt: true,
                skirt: false, skullcap: false, shorts: false
            }, 
            selectedItem: null, 
            weaponStance: 'side', 
            isAssassinHostile: false, 
            tintColor: tint 
        } as any;

        super(scene, initialPos, config);
        
        this.stats = { ...CLASS_STATS.mage };
        this.lastStuckPos.copy(this.position);
        this.lastFramePos.copy(this.position);
    }
    
    private setState(newState: MageState) {
        if (this.state === newState) return;
        this.state = newState; 
        this.stateTimer = 0; 
        this.isCasting = (newState === MageState.ATTACK);
        if (this.isCasting) {
            this.castTimer = 0;
            this.hasCastSpell = false;
        }
    }

    private findPatrolPoint(environment: Environment | CombatEnvironment) {
        if (environment instanceof CombatEnvironment) {
            const r = Math.floor(Math.random() * 8);
            const c = Math.floor(Math.random() * 8);
            this.targetPos.copy(environment.getWorldPosition(r, c));
            return;
        }
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

    update(dt: number, environment: Environment | CombatEnvironment, potentialTargets: { position: THREE.Vector3, isDead?: boolean, isWolf?: boolean }[], skipAnimation: boolean = false, isCombatActive: boolean = true) {
        if (this.isDead) return;
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;

        // Snapping check for combat arena
        if (env instanceof CombatEnvironment) {
            const snapped = env.snapToGrid(this.position);
            if (isCombatActive) {
                // Cell-by-cell movement
                if (this.currentPath.length > 0) {
                    const targetGrid = this.currentPath[this.pathIndex];
                    const targetPos = env.getWorldPosition(targetGrid.r, targetGrid.c);
                    
                    const distSq = this.position.distanceToSquared(targetPos);
                    if (distSq < 0.01) {
                        this.pathIndex++;
                        if (this.pathIndex >= this.currentPath.length) {
                            this.currentPath = [];
                        }
                    } else {
                        const dir = new THREE.Vector3().subVectors(targetPos, this.position).normalize();
                        this.position.addScaledVector(dir, 3.0 * dt);
                        this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(dir.x, dir.z), 10.0 * dt);
                    }
                } else if (this.targetPos && this.position.distanceToSquared(this.targetPos) > 1.0) {
                    this.currentPath = env.getPath(this.position, this.targetPos);
                    this.pathIndex = 0;
                }
            } else {
                this.position.lerp(snapped, 5.0 * dt);
            }
        }

        if (!isCombatActive) {
            this.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            if (skipAnimation) return;
            
            // Sync target vars to prevent snapping
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
                isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
            };
            this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: false, isPickingUp: false, isDead: this.isDead, jump: false } as any, env.obstacles);
            this.walkTime = animContext.walkTime;
            this.lastStepCount = animContext.lastStepCount;

            this.updateModel(dt);
            this.model.sync(this.config, true);
            return;
        }

        const cameraPos = (env as any).scene?.userData?.camera?.position || new THREE.Vector3(0, 10, 10);
        // this.updateStatBars(cameraPos, isCombatActive); // Handled by EntityManager

        let bestTarget = null; let bestDist = 40.0; // Increased from 25.0
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        if (isCombatActive && bestTarget) { 
            if (this.state === MageState.PATROL || this.state === MageState.IDLE) this.setState(MageState.CHASE);
            
            if (this.state === MageState.CHASE) { 
                if (distToTarget < 12.0) this.setState(MageState.ATTACK); 
                else if (distToTarget > 45.0) this.setState(MageState.PATROL); 
                else this.targetPos.copy(this.currentTarget!.position); 
            }
            
            if (this.state === MageState.ATTACK) {
                this.castTimer += dt;
                
                // Spawn Projectile
                if (this.castTimer > 0.6 && !this.hasCastSpell && this.currentTarget) {
                    const dir = new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize();
                    PlayerCombat.spawnProjectile(this.scene, this.position.clone().add(new THREE.Vector3(0, 1.4, 0)), dir, 'fireball', this);
                    this.hasCastSpell = true;
                }

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
                    if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) {
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

        // Movement
        if (this.state !== MageState.ATTACK && this.state !== MageState.RETREAT) {
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
 
            // Face target during attack/retreat
            this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(this.currentTarget.position.x - this.position.x, this.currentTarget.position.z - this.position.z), dt * 10.0); 
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, env.obstacles), dt * 6);
        this.group.position.copy(this.position);
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
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: animX, y: animY, isRunning: this.state === MageState.CHASE, isPickingUp: false, isDead: this.isDead, jump: false } as any, (environment as any).obstacles);
        this.walkTime = animContext.walkTime; 
        this.lastStepCount = animContext.lastStepCount; 
        this.targetPosition.copy(this.position);
        this.targetRotationY = this.rotationY;
        this.updateModel(dt);
        this.model.sync(this.config, true);
    }
}
