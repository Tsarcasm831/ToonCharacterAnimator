import * as THREE from 'three';
import { DEFAULT_CONFIG, EntityStats } from '../../../../types';
import { HumanoidEntity } from '../../HumanoidEntity';
import { Environment } from '../../../environment/Environment';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';

enum BanditState { IDLE, PATROL, CHASE, ATTACK, RETREAT }

export class Bandit extends HumanoidEntity {
    velocity: THREE.Vector3 = new THREE.Vector3();
    stats: EntityStats;
    
    private state: BanditState = BanditState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private speedFactor: number = 0;
    
    // Properties removed: healthBar, etc. are now in HumanoidEntity

    private currentPath: { r: number, c: number }[] = [];
    private pathIndex: number = 0;

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        // Randomize body type
        const bodyVariants = ['average', 'muscular', 'heavy'] as const;
        const randomVariant = bodyVariants[Math.floor(Math.random() * bodyVariants.length)];
        
        const config = { 
            ...DEFAULT_CONFIG, 
            bodyType: 'male', 
            bodyVariant: randomVariant, 
            outfit: 'peasant', 
            skinColor: '#c9a882',
            shirtColor: '#4a4a4a',
            pantsColor: '#2d2d2d',
            bootsColor: '#1a1a1a',
            hairStyle: Math.random() > 0.5 ? 'bald' : 'crew',
            hairColor: '#2d2d2d',
            stats: { ...CLASS_STATS.bandit },
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, 
                mask: Math.random() > 0.6, hood: Math.random() > 0.5, quiltedArmor: false, 
                leatherArmor: Math.random() > 0.5, heavyLeatherArmor: false, ringMail: false, 
                plateMail: false, robe: false, blacksmithApron: false, mageHat: false,
                bracers: Math.random() > 0.5, cape: false, belt: true,
                skirt: false, skullcap: false, shorts: false
            }, 
            selectedItem: 'Axe',
            weaponStance: 'side',
            isAssassinHostile: true,
            tintColor: tint 
        } as any;

        super(scene, initialPos, config);
        
        this.stats = { ...CLASS_STATS.bandit };
        this.lastStuckPos.copy(this.position);
        
        // this.initStatBars(); // Handled by HumanoidEntity
        this.model.sync(this.config, true);
    }

    private findPatrolPoint(environment: Environment | CombatEnvironment) {
        const landmarks = environment.obstacles.filter(o => o.userData.type === 'hard');
        if (landmarks.length > 0 && Math.random() > 0.4) {
            const obj = landmarks[Math.floor(Math.random() * landmarks.length)];
            const pos = new THREE.Vector3(); obj.getWorldPosition(pos);
            const candidate = pos.clone().add(new THREE.Vector3((Math.random()-0.5)*25, 0, (Math.random()-0.5)*25));
            if (PlayerUtils.isWithinBounds(candidate, 2.0)) this.targetPos.copy(candidate);
            else this.targetPos.set(0, 0, 0);
        } else {
            const limit = 50; // Use a reasonable limit for dev scene
            this.targetPos.set((Math.random() - 0.5) * (limit * 2), 0, (Math.random() - 0.5) * (limit * 2));
        }
    }

    private updatePatrol(dt: number, environment: Environment | CombatEnvironment) {
        // Patrol behavior similar to assassin
        if (this.state === BanditState.IDLE || this.stateTimer > 20.0) {
            this.state = BanditState.PATROL;
            this.stateTimer = 0;
            this.findPatrolPoint(environment);
        }

        const moveSpeed = 2.5; // Patrol speed
        const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
        toGoal.y = 0;
        
        if (toGoal.length() > 0.1) {
            this.rotationY += (Math.atan2(toGoal.x, toGoal.z) - this.rotationY) * 8.0 * dt;
            const step = moveSpeed * dt;
            const next = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));
            
            // Simple collision check - just stay within bounds for now
            if (PlayerUtils.isWithinBounds(next)) {
                this.position.x = next.x;
                this.position.z = next.z;
            }
        } else if (this.position.distanceTo(this.targetPos) < 1.5) {
            // Reached target, find new point
            this.findPatrolPoint(environment);
            this.stateTimer = 0;
        }

        // Update speed factor for animation
        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, moveSpeed, dt * 6);
        if (toGoal.length() < 0.1) {
            this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, 0, dt * 6);
        }
    }

    update(dt: number, environment: Environment | CombatEnvironment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false, isCombatActive: boolean = true) {
        if (this.isDead) return;
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;

        if (!isCombatActive) {
            // Snapping check for combat arena pre-combat
            if (env instanceof CombatEnvironment) {
                const snapped = env.snapToGrid(this.position);
                this.position.lerp(snapped, 5.0 * dt);
            } else {
                // Dev scene patrol behavior
                this.updatePatrol(dt, environment);
                this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, env.obstacles), dt * 6);
            }
            
            this.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            
            if (skipAnimation) return;

            const animContext = {
                config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
                isCombatStance: false,
                isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: false,
                isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
                isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
            };
            
            this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: 0, isRunning: false, isPickingUp: false, isDead: this.isDead, jump: false } as any, env.obstacles);
            this.walkTime = animContext.walkTime;
            this.lastStepCount = animContext.lastStepCount;
            this.targetPosition.copy(this.position);
            this.targetRotationY = this.rotationY;
            this.updateModel(dt);
            this.model.sync(this.config, true);
            return;
        }

        // --- NEW COMBAT AI ---
        const cameraPos = (env as any).scene?.userData?.camera?.position || new THREE.Vector3(0, 10, 10);
        // this.updateStatBars(cameraPos, isCombatActive); // Handled by EntityManager

        // Movement Logic
        const target = potentialTargets[0]; // Simple AI: target the first available target (Archer)
        this.currentTarget = target;

        if (target && !target.isDead) {
            const distSq = this.position.distanceToSquared(target.position);
            const arena = env as CombatEnvironment;
            
            const meleeRangeSq = 1.6 * 1.6; 

            if (distSq > meleeRangeSq) {
                // Move toward target
                if (this.currentPath.length === 0 || this.pathIndex >= this.currentPath.length) {
                    this.currentPath = arena.getPath(this.position, target.position);
                    this.pathIndex = 0;
                }

                if (this.currentPath.length > 0) {
                    const targetCell = this.currentPath[this.pathIndex];
                    const targetPos = arena.getWorldPosition(targetCell.r, targetCell.c);
                    const toCell = new THREE.Vector3().subVectors(targetPos, this.position);
                    const cellDistSq = toCell.lengthSq();

                    if (cellDistSq < 0.05) {
                        this.pathIndex++;
                    } else {
                        const moveDir = toCell.normalize();
                        const speed = 3.0;
                        this.position.addScaledVector(moveDir, speed * dt);
                        this.rotationY = Math.atan2(moveDir.x, moveDir.z);
                        this.speedFactor = speed;
                    }
                }
            } else {
                // Within 1 grid cell: Attack
                this.speedFactor = 0;
                this.rotationY = Math.atan2(target.position.x - this.position.x, target.position.z - this.position.z);
                
                if (this.attackCooldown <= 0) {
                    this.isStriking = true;
                    this.strikeTimer = 0;
                    this.attackCooldown = 1.5; // Attack every 1.5s
                }
            }
        }

        if (this.isStriking) {
            this.strikeTimer += dt;
            if (this.strikeTimer > 0.8) {
                this.isStriking = false;
            }
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, environment.obstacles), dt * 6);
        this.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        // Only lerp speed to 0 if not in combat movement
        if (!(this.currentTarget && !this.currentTarget.isDead)) {
            this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, 0, dt * 6);
        }
        
        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: true,
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: 0, isRunning: false, isPickingUp: false, isDead: this.isDead, jump: false } as any, env.obstacles);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.targetPosition.copy(this.position);
        this.targetRotationY = this.rotationY;
        this.updateModel(dt);
        this.model.sync(this.config, true);
    }
}
