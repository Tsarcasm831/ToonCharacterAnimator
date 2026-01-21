import * as THREE from 'three';
import { EntityStats, DEFAULT_CONFIG } from '../../../../types';
import { HumanoidEntity } from '../../HumanoidEntity';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { Environment } from '../../../environment/Environment';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';

enum GuardState { PATROL, CHASE, DUEL, ATTACK }

export class LowLevelCityGuard extends HumanoidEntity {
    public isLeftHandWaving: boolean = false;
    public leftHandWaveTimer: number = 0;
    
    stats: EntityStats;
    
    private state: GuardState = GuardState.PATROL;
    private stateTimer: number = 0;
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private patrolTarget = new THREE.Vector3();
    private attackCooldown: number = 0;
    private duelTimer: number = 0;
    private strafeDir: number = 1;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, initialRot: number = 0, tint?: string) {
        // Added missing bracers, cape, belt to equipment
        const config = { ...DEFAULT_CONFIG, bodyType: 'male', bodyVariant: 'average', skinColor: '#ffdbac', hairStyle: 'crew', hairColor: '#3e2723', shirtColor: '#4a3728', pantsColor: '#718096', bootsColor: '#8d6e63', equipment: { helm: true, shoulders: true, shield: false, shirt: true, pants: true, shoes: true, mask: false, hood: false, quiltedArmor: true, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, blacksmithApron: false, mageHat: false, bracers: true, cape: false, belt: true, skirt: false, skullcap: false, shorts: false }, selectedItem: 'Halberd', weaponStance: 'shoulder', tintColor: tint } as any;
        
        super(scene, initialPos, config);
        
        this.rotationY = initialRot;
        this.patrolTarget.copy(initialPos);
        this.lastStuckPos.copy(this.position);
        this.stats = { ...CLASS_STATS.hero }; // Using hero stats for guards for now
    }

    private setState(newState: GuardState) {
        if (this.state === newState) return;
        this.state = newState; this.stateTimer = 0;
        if (newState === GuardState.DUEL) { this.duelTimer = 2.0 + Math.random() * 2.0; this.strafeDir = Math.random() > 0.5 ? 1 : -1; }
        this.isStriking = (newState === GuardState.ATTACK); if (this.isStriking) this.strikeTimer = 0;
    }

    public isInCombat(): boolean { return this.state === GuardState.CHASE || this.state === GuardState.DUEL || this.state === GuardState.ATTACK; }

    update(dt: number, playerPosition: THREE.Vector3, environment: Environment | CombatEnvironment, enemies: { position: THREE.Vector3, isDead?: boolean }[] = [], skipAnimation: boolean = false, isCombatActive: boolean = true) {
        this.stateTimer += dt; if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const env = environment as any;

        // Snapping check for combat arena
        if (env instanceof CombatEnvironment) {
            const snapped = env.snapToGrid(this.position);
            // Snap more aggressively in combat arena
            this.position.lerp(snapped, 5.0 * dt);
        }

        if (!isCombatActive) {
            this.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            if (skipAnimation) return;

            if (this.isLeftHandWaving) {
                this.leftHandWaveTimer += dt;
                if (this.leftHandWaveTimer > 2.5) {
                    this.isLeftHandWaving = false;
                    this.leftHandWaveTimer = 0;
                }
            }

            const animContext = { config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler, isCombatStance: false, isJumping: false, isAxeSwing: false, axeSwingTimer: 0, isPunch: false, isPickingUp: false, isInteracting: false, isWaving: false, isLeftHandWaving: this.isLeftHandWaving, leftHandWaveTimer: this.leftHandWaveTimer, isSkinning: false, isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false };
            this.animator.animate(animContext, dt, false, { x: 0, y: 0, isRunning: false, isPickingUp: false, isDead: false, jump: false } as any);
            this.walkTime = animContext.walkTime;
            this.lastStepCount = animContext.lastStepCount;

            this.updateModel(dt);
            this.model.sync(this.config, false);
            return;
        }

        let bestTarget = null; let bestDist = 25.0; // Increased search range
        for (const e of enemies) { if (e.isDead) continue; const d = this.position.distanceTo(e.position); if (d < bestDist) { bestDist = d; bestTarget = e; } }
        this.currentTarget = bestTarget;

        let moveSpeed = 0; let isMoving = false; let animX = 0; let animY = 0;

        if (this.currentTarget) {
            const dist = this.position.distanceTo(this.currentTarget.position);
            if (this.state === GuardState.PATROL) this.setState(GuardState.CHASE);
            if (this.state === GuardState.CHASE) { if (dist < 3.0) this.setState(GuardState.DUEL); else if (dist > 15.0) this.setState(GuardState.PATROL); else { 
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.currentTarget.position, this.position, dt, 8.0);
                const avoidanceRot = AIUtils.getAvoidanceSteering(this.position, this.rotationY, new THREE.Vector3(0.6, 2.0, 0.6), env.obstacles);
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, 12.0);

                if (moveSpeed > 0) {
                    const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, moveSpeed, dt, new THREE.Vector3(0.6, 2.0, 0.6), env.obstacles);
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
                moveSpeed = 3.5; isMoving = true; animY = -1; 
            } }
            else if (this.state === GuardState.DUEL) { 
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.currentTarget.position, this.position, dt, 12.0);
                const r = new THREE.Vector3(0,1,0).cross(new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize()).normalize(); 
                const stepV = r.multiplyScalar(this.strafeDir * 1.5); 
                if (dist < 2.0) stepV.add(new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize().negate().multiplyScalar(1.0)); 
                else if (dist > 3.0) stepV.add(new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize().multiplyScalar(1.0)); 
                const n = this.position.clone().add(stepV.multiplyScalar(dt)); 
                if (!PlayerUtils.checkCollision(n, this.config, env.obstacles) && PlayerUtils.isWithinBounds(n)) { 
                    this.position.x = n.x; 
                    this.position.z = n.z; 
                } 
                isMoving = true; 
                moveSpeed = 1.5; 
                animX = this.strafeDir; 
                this.duelTimer -= dt; 
                if (dist > 4.5) this.setState(GuardState.CHASE); 
                else if (this.duelTimer <= 0 && this.attackCooldown <= 0 && dist < 2.5) this.setState(GuardState.ATTACK); 
            }
            else if (this.state === GuardState.ATTACK) { 
                this.strikeTimer += dt; 
                if (this.strikeTimer > 1.2) { 
                    this.attackCooldown = 2.0 + Math.random(); 
                    this.setState(GuardState.DUEL); 
                } 
                if (this.strikeTimer < 0.3) { 
                    const step = new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0), this.rotationY).multiplyScalar(2.0 * dt); 
                    const n = this.position.clone().add(step); 
                    if (!PlayerUtils.checkCollision(n, this.config, env.obstacles) && PlayerUtils.isWithinBounds(n)) this.position.copy(n); 
                } 
            }
        } else { 
            this.setState(GuardState.PATROL); 
            if (this.position.distanceTo(this.patrolTarget) > 1.0) { 
                const toGoal = new THREE.Vector3().subVectors(this.patrolTarget, this.position);
                toGoal.y = 0;
                if (toGoal.length() > 0.1) {
                    this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.patrolTarget, this.position, dt, 8.0);
                    const avoidanceRot = AIUtils.getAvoidanceSteering(this.position, this.rotationY, new THREE.Vector3(0.6, 2.0, 0.6), env.obstacles);
                    this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, 12.0);

                    if (moveSpeed > 0) {
                        const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, moveSpeed, dt, new THREE.Vector3(0.6, 2.0, 0.6), env.obstacles);
                        this.position.x = nextPos.x;
                        this.position.z = nextPos.z;
                    }
                }
                moveSpeed = 2.5; isMoving = true; animY = -1; 
            } 
        }

        if ((this.state === GuardState.CHASE || this.state === GuardState.PATROL) && moveSpeed > 0) { 
            const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, moveSpeed, dt, new THREE.Vector3(0.6, 2.0, 0.6), env.obstacles);
            this.position.x = nextPos.x;
            this.position.z = nextPos.z;
        }

        if (moveSpeed !== 0) { 
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { 
                this.stuckTimer += dt; 
                if (this.stuckTimer > 1.5) { 
                    this.setState(GuardState.PATROL); 
                    this.stuckTimer = 0; 
                    this.stateTimer = 0; 
                } 
            } else { 
                this.stuckTimer = 0; 
                this.lastStuckPos.copy(this.position); 
            } 
        } else { 
            this.stuckTimer = 0; 
            this.lastStuckPos.copy(this.position); 
        }

        if (this.currentTarget && !this.currentTarget.isDead) { 
            const toE = new THREE.Vector3().subVectors(this.currentTarget.position, this.position); 
            const d = toE.length(); 
            if (d < 0.9) { 
                const step = toE.normalize().negate().multiplyScalar((0.9 - d) * 5.0 * dt); 
                const n = this.position.clone().add(step); 
                if (PlayerUtils.isWithinBounds(n)) this.position.copy(n); 
            } 
        }

        this.updateGroundHeight(env);
        this.group.position.copy(this.position); 
        // We handle model rotation in updateModel or manual override?
        // updateModel sets group.rotation.y = rotationY.
        // Let's use it for consistency. But we haven't called it yet.
        
        if (skipAnimation) return;

        if (this.isLeftHandWaving) {
            this.leftHandWaveTimer += dt;
            if (this.leftHandWaveTimer > 2.5) {
                this.isLeftHandWaving = false;
                this.leftHandWaveTimer = 0;
            }
        }

        const lookT = this.currentTarget?.position || playerPosition; 
        this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, this.position.distanceTo(lookT) < 8.0 ? 1.0 : 0.0, dt * 3.0); 
        this.cameraHandler.cameraWorldPosition.copy(lookT).y += 1.6;
        
        const animContext = { config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler, isCombatStance: (this.state === GuardState.DUEL || this.state === GuardState.ATTACK), isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false, isPickingUp: false, isInteracting: false, isWaving: false, isLeftHandWaving: this.isLeftHandWaving, leftHandWaveTimer: this.leftHandWaveTimer, isSkinning: false, isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false };
        this.animator.animate(animContext, dt, isMoving, { x: animX, y: animY, isRunning: moveSpeed > 3.0, isPickingUp: false, isDead: false, jump: false } as any);
        this.walkTime = animContext.walkTime; 
        this.lastStepCount = animContext.lastStepCount; 
        
        this.updateModel(dt);
        this.model.sync(this.config, !!this.currentTarget);
    }
}
