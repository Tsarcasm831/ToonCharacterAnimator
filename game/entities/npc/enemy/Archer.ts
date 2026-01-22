import * as THREE from 'three';
import { EntityStats, DEFAULT_CONFIG } from '../../../../types';
import { HumanoidEntity } from '../../HumanoidEntity';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { Environment } from '../../../environment/Environment';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';
import { PlayerCombat } from '../../../player/PlayerCombat';

enum ArcherState { IDLE, PATROL, CHASE, DUEL, ATTACK, RETREAT }

export class Archer extends HumanoidEntity {
    velocity: THREE.Vector3 = new THREE.Vector3();
    stats: EntityStats;
    
    private state: ArcherState = ArcherState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean, isWolf?: boolean } | null = null;
    private currentPath: { r: number, c: number }[] = [];
    private pathIndex: number = 0;
    private duelTimer: number = 0;
    private strafeDir: number = 1;
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isFiring: boolean = false;
    private fireTimer: number = 0;
    private hasFired: boolean = false;
    private speedFactor: number = 0;
    
    // Stat bars handled by HumanoidEntity

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        // Added missing bracers, cape, belt to equipment
        const config = { 
            ...DEFAULT_CONFIG, 
            bodyType: 'male', 
            bodyVariant: 'slim', 
            outfit: 'warrior', 
            skinColor: '#d7ccc8', 
            shirtColor: '#2e7d32', 
            pantsColor: '#1b5e20', 
            hairStyle: 'bald', 
            equipment: { 
                helm: false, shoulders: false, shield: false, shirt: true, pants: true, shoes: true, 
                mask: false, hood: true, quiltedArmor: false, leatherArmor: true, heavyLeatherArmor: false, 
                ringMail: false, plateMail: false, robe: false, blacksmithApron: false, mageHat: false, 
                bracers: true, cape: false, belt: true, skirt: false, skullcap: false, shorts: false 
            }, 
            selectedItem: 'Bow', 
            weaponStance: 'side', 
            isAssassinHostile: false, 
            tintColor: tint 
        } as any;

        super(scene, initialPos, config);
        
        this.stats = { ...CLASS_STATS.archer };
        this.lastStuckPos.copy(this.position);
        
        // this.initStatBars(); // Handled by HumanoidEntity
        this.model.sync(this.config, true);
    }

    private setState(newState: ArcherState) {
        if (this.state === newState) return;
        this.state = newState; this.stateTimer = 0; this.isFiring = (newState === ArcherState.ATTACK);
        if (this.isFiring) {
            this.fireTimer = 0;
            this.hasFired = false;
        }
        if (newState === ArcherState.DUEL) { this.duelTimer = 1.0 + Math.random() * 2.0; this.strafeDir = Math.random() > 0.5 ? 1 : -1; }
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
            const candidate = pos.clone().add(new THREE.Vector3((Math.random()-0.5)*25, 0, (Math.random()-0.5)*25));
            if (PlayerUtils.isWithinBounds(candidate, 2.0)) this.targetPos.copy(candidate);
            else this.targetPos.set(0, 0, 0);
        } else {
            const limit = PlayerUtils.WORLD_LIMIT - 5;
            this.targetPos.set((Math.random() - 0.5) * (limit * 2), 0, (Math.random() - 0.5) * (limit * 2));
        }
    }

    update(dt: number, environment: Environment | CombatEnvironment, potentialTargets: { position: THREE.Vector3, isDead?: boolean, isWolf?: boolean }[], skipAnimation: boolean = false, isCombatActive: boolean = true) {
        if (this.isDead) return;
        
        // Handle External Control (Auto-Battler)
        if (this.externalControl) {
            this.stateTimer += dt;
            
            // Map external state to internal flags
            this.isFiring = (this.combatState === 'ATTACKING');
            const isMoving = (this.combatState === 'MOVING');
            
            // Handle Fire Logic (Visuals only)
            if (this.isFiring) {
                this.fireTimer += dt;
                // Sync fire animation: Draw (0-0.6) -> Fire (0.6) -> Recover (0.6-1.2)
                // If combatState stays ATTACKING, we loop.
                if (this.fireTimer > 1.2) {
                    this.fireTimer = 0;
                    this.hasFired = false;
                }
                
                if (this.fireTimer > 0.6 && !this.hasFired) {
                    // We need a target to fire AT. 
                    // BaseEntity doesn't store current target reference from CombatSystem (yet).
                    // For visuals, we can just fire forward or look at rotation.
                    const dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
                    PlayerCombat.spawnProjectile(this.scene, this.position.clone().add(new THREE.Vector3(0, 1.4, 0)), dir, 'arrow', this);
                    this.hasFired = true;
                }
            } else {
                this.fireTimer = 0;
                this.hasFired = false;
            }

            if (!skipAnimation) {
                const animContext = {
                    config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
                    isCombatStance: (this.combatState !== 'IDLE' && this.combatState !== 'DEAD'),
                    isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: false,
                    isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
                    isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false,
                    isBowDraw: this.isFiring, bowDrawTimer: this.fireTimer
                };
                
                // Calculate speed factor from actual movement
                const currentPos = this.position.clone();
                const dist = currentPos.distanceTo(this.lastFramePos);
                const speed = dist / dt;
                this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, speed, dt * 6);
                
                this.animator.animate(animContext, dt, isMoving, { x: 0, y: 1, isRunning: speed > 4.0, isPickingUp: false, isDead: this.isDead, jump: false } as any, (environment as any).obstacles);
                this.walkTime += dt * speed; // Update walk cycle
            }
            
            this.updateModel(dt); // Updates lastFramePos
            this.model.sync(this.config, true);
            return;
        }

        // --- Standard Logic (Legacy / Manual) ---
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;

        if (!isCombatActive) {
            // Snapping check for combat arena pre-combat
            if (env instanceof CombatEnvironment) {
                const snapped = env.snapToGrid(this.position);
                this.position.lerp(snapped, 5.0 * dt);
            }
            
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
                isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false,
                isBowDraw: false, bowDrawTimer: 0
            };
            this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: animY, isRunning: false, isPickingUp: false, isDead: this.isDead, jump: false } as any, env.obstacles);
            this.walkTime = animContext.walkTime;
            this.lastStepCount = animContext.lastStepCount;

            this.updateModel(dt);
            this.model.sync(this.config, true);
            return;
        }

        // --- NEW COMBAT AI ---
        const cameraPos = (env as any).scene?.userData?.camera?.position || new THREE.Vector3(0, 10, 10);
        // this.updateStatBars(cameraPos, isCombatActive); // Handled by EntityManager

        // Movement Logic
        const target = potentialTargets[0]; // Simple AI: target the first available target (Bandit)
        this.currentTarget = target;

        if (target && !target.isDead) {
            const distSq = this.position.distanceToSquared(target.position);
            const arena = env as CombatEnvironment;
            
            // Ranged range is 4 grid cells.
            // One cell step is ~1.51 units. 4 cells is ~6.04 units.
            const rangeDistSq = 6.2 * 6.2; 

            if (distSq > rangeDistSq) {
                // Move toward target until in range
                if (this.currentPath.length === 0 || this.pathIndex >= this.currentPath.length) {
                    const currentGrid = arena.getGridPosition(this.position);
                    const targetGrid = arena.getGridPosition(target.position);
                    if (currentGrid && targetGrid) {
                        this.currentPath = arena.getPath(this.position, target.position);
                        this.pathIndex = 0;
                    }
                }

                if (this.currentPath.length > 0) {
                    const targetCell = this.currentPath[this.pathIndex];
                    const targetPos = arena.getWorldPosition(targetCell.r, targetCell.c);
                    const toCell = new THREE.Vector3().subVectors(targetPos, this.position);
                    const cellDistSq = toCell.lengthSq();

                    if (cellDistSq < 0.1) {
                        this.pathIndex++;
                    } else {
                        const moveDir = toCell.normalize();
                        const speed = 4.0;
                        this.position.addScaledVector(moveDir, speed * dt);
                        this.rotationY = Math.atan2(moveDir.x, moveDir.z);
                        this.speedFactor = speed;
                    }
                }
            } else {
                // Within range: Fire
                this.speedFactor = 0;
                this.rotationY = Math.atan2(target.position.x - this.position.x, target.position.z - this.position.z);
                
                if (this.attackCooldown <= 0) {
                    this.isFiring = true;
                    this.fireTimer = 0;
                    this.hasFired = false;
                    this.attackCooldown = 2.0;
                }
            }
        }

        if (this.isFiring) {
            this.fireTimer += dt;
            if (this.fireTimer > 0.6 && !this.hasFired && this.currentTarget) {
                const dir = new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize();
                PlayerCombat.spawnProjectile(this.scene, this.position.clone().add(new THREE.Vector3(0, 1.4, 0)), dir, 'arrow', this);
                this.hasFired = true;
            }
            if (this.fireTimer > 1.2) {
                this.isFiring = false;
            }
        }

        this.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, 0, dt * 6);
        
        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: true,
            isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false,
            isBowDraw: this.isFiring, bowDrawTimer: this.fireTimer
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
