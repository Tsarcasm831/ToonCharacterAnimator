import * as THREE from 'three';
import { EntityStats, PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { PlayerModel } from '../../../model/PlayerModel';
import { PlayerAnimator } from '../../../animator/PlayerAnimator';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { CLASS_STATS } from '../../../../data/stats';

enum AssassinState { IDLE, PATROL, SURVIVAL, CHASE, STALK, INVESTIGATE, ATTACK, RETREAT, DUEL }

export class Assassin {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
    stats: EntityStats;
    position: THREE.Vector3 = new THREE.Vector3();
    lastFramePos: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    velocity: THREE.Vector3 = new THREE.Vector3();
    private state: AssassinState = AssassinState.PATROL;
    private stateTimer: number = 0;
    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    private currentPath: { r: number, c: number }[] = [];
    private pathIndex: number = 0;
    private moveTarget: THREE.Vector3 | null = null;
    private duelTimer: number = 0;
    private strafeDir: number = 1; 
    private attackCooldown: number = 0;
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();
    private isStriking: boolean = false;
    private strikeTimer: number = 0;
    private isPickingUp: boolean = false;
    private pickUpTimer: number = 0;
    private speedFactor: number = 0;
    private lastStepCount: number = 0;
    private walkTime: number = 0;
    public status = { isDead: false, recoverTimer: 0 };
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
        // Added missing bracers, cape, belt to equipment
        this.config = { ...DEFAULT_CONFIG, bodyType: 'male', bodyVariant: 'slim', outfit: 'warrior', skinColor: '#d7ccc8', shirtColor: '#000000', pantsColor: '#000000', hairStyle: 'bald', equipment: { helm: false, shoulders: true, shield: false, shirt: true, pants: true, shoes: true, mask: true, hood: true, quiltedArmor: false, leatherArmor: false, heavyLeatherArmor: false, ringMail: false, plateMail: false, robe: false, blacksmithApron: false, mageHat: false, bracers: true, cape: false, belt: true, skirt: false, skullcap: false, shorts: false }, selectedItem: 'Knife', weaponStance: 'side', isAssassinHostile: false, tintColor: tint };
        this.stats = { ...CLASS_STATS.assassin };
        this.model = new PlayerModel(this.config);
        this.animator = new PlayerAnimator();
        this.model.group.position.copy(this.position);
        this.scene.add(this.model.group);
        this.model.sync(this.config, true);
    }

    private setState(newState: AssassinState) {
        if (this.state === newState) return;
        this.state = newState; this.stateTimer = 0; this.isStriking = (newState === AssassinState.ATTACK); this.isPickingUp = (newState === AssassinState.INVESTIGATE);
        if (this.isStriking) this.strikeTimer = 0; if (this.isPickingUp) this.pickUpTimer = 0;
        if (newState === AssassinState.DUEL) { this.duelTimer = 1.0 + Math.random() * 2.0; this.strafeDir = Math.random() > 0.5 ? 1 : -1; }
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

    update(dt: number, environment: Environment | CombatEnvironment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false, isCombatActive: boolean = true) {
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
                        this.position.addScaledVector(dir, 5.0 * dt);
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
            this.model.group.position.copy(this.position);
            this.model.group.rotation.y = this.rotationY;
            if (skipAnimation) return;
            this.model.update(dt, new THREE.Vector3(0, 0, 0));
            this.model.sync(this.config, true);
            return;
        }

        let bestTarget = null; let bestDist = 35.0; // Increased from 20.0
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) { bestDist = d; bestTarget = t; }
        }
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        if (isCombatActive && bestTarget) { 
            if (this.state === AssassinState.PATROL || this.state === AssassinState.IDLE) this.setState(AssassinState.CHASE);
            if (this.state === AssassinState.CHASE) {
                if (distToTarget < 4.0) this.setState(AssassinState.DUEL);
                else if (distToTarget > 40.0) this.setState(AssassinState.PATROL); 
                else this.targetPos.copy(this.currentTarget.position);
            }
            if (this.state === AssassinState.DUEL) {
                this.duelTimer -= dt; this.targetPos.copy(this.currentTarget.position);
                if (distToTarget > 5.0) this.setState(AssassinState.CHASE);
                else if (this.duelTimer <= 0 && this.attackCooldown <= 0) this.setState(AssassinState.ATTACK);
            }
            if (this.state === AssassinState.ATTACK && this.strikeTimer > 0.6) { this.setState(AssassinState.RETREAT); this.attackCooldown = 1.5 + Math.random(); }
            if (this.state === AssassinState.RETREAT && this.stateTimer > 0.8) this.setState(AssassinState.DUEL);
        } else if (this.state !== AssassinState.PATROL && this.state !== AssassinState.IDLE) {
            this.setState(AssassinState.PATROL);
        }

        let moveSpeed = 0;
        switch (this.state) {
            case AssassinState.PATROL: moveSpeed = 2.8; if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 25.0) { this.findPatrolPoint(environment); this.stateTimer = 0; } break;
            case AssassinState.CHASE: moveSpeed = 5.5; break;
            case AssassinState.DUEL:
                moveSpeed = 2.5; const toTargetDuel = new THREE.Vector3().subVectors(this.currentTarget!.position, this.position).normalize();
                const right = new THREE.Vector3(0, 1, 0).cross(toTargetDuel).normalize();
                const strafeVec = right.multiplyScalar(this.strafeDir * 2.5);
                if (distToTarget < 2.0) strafeVec.add(toTargetDuel.clone().multiplyScalar(-1.5));
                else if (distToTarget > 3.0) strafeVec.add(toTargetDuel.clone().multiplyScalar(1.5));
                const duelNext = this.position.clone().add(strafeVec.multiplyScalar(dt));
                if (!PlayerUtils.checkCollision(duelNext, this.config, env.obstacles) && PlayerUtils.isWithinBounds(duelNext)) { this.position.x = duelNext.x; this.position.z = duelNext.z; }
                break;
            case AssassinState.ATTACK: this.strikeTimer += dt; if (this.strikeTimer < 0.2) { const step = new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0), this.rotationY).multiplyScalar(8.0 * dt); const next = this.position.clone().add(step); if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) this.position.copy(next); } break;
            case AssassinState.RETREAT: const step = new THREE.Vector3().subVectors(this.position, this.currentTarget!.position).normalize().multiplyScalar(4.0 * dt); const next = this.position.clone().add(step); if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) this.position.copy(next); moveSpeed = -4.0; break;
        }

        if (moveSpeed !== 0) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.setState(AssassinState.PATROL); this.findPatrolPoint(environment); this.stuckTimer = 0; this.stateTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        }

        if (this.state !== AssassinState.DUEL && this.state !== AssassinState.RETREAT && this.state !== AssassinState.ATTACK) {
            const toGoal = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toGoal.y = 0;
            if (toGoal.length() > 0.1) {
                this.rotationY += (Math.atan2(toGoal.x, toGoal.z) - this.rotationY) * 8.0 * dt;
                if (moveSpeed > 0) { const step = moveSpeed * dt; const next = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step)); if (!PlayerUtils.checkCollision(next, this.config, env.obstacles) && PlayerUtils.isWithinBounds(next)) { this.position.x = next.x; this.position.z = next.z; } }
            }
        } else if (this.currentTarget) {
            const toTarget = new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize();
            this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(toTarget.x, toTarget.z), dt * 15.0);
        }

        this.position.y = THREE.MathUtils.lerp(this.position.y, PlayerUtils.getGroundHeight(this.position, this.config, env.obstacles), dt * 6);
        this.model.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        if (this.currentTarget) {
            this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 1.0, dt * 4.0);
            this.smoothedHeadTarget.lerp(this.currentTarget.position.clone().add(new THREE.Vector3(0,1.6,0)), dt * 5.0);
            this.cameraHandler.cameraWorldPosition.copy(this.smoothedHeadTarget);
        } else { this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, 0.0, dt * 4.0); }

        let targetSpeedAnim = (this.state === AssassinState.DUEL) ? 2.0 : moveSpeed;
        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, targetSpeedAnim, dt * 6);

        let animX = (this.state === AssassinState.DUEL) ? this.strafeDir : 0;
        let animY = (this.state === AssassinState.RETREAT) ? 1 : (Math.abs(this.speedFactor) > 0.1 ? -1 : 0);

        const animContext = { config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler, isCombatStance: (this.state === AssassinState.DUEL || this.state === AssassinState.ATTACK || this.state === AssassinState.RETREAT), isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false, isPickingUp: this.isPickingUp, pickUpTime: this.pickUpTimer, isInteracting: false, isWaving: false, isSkinning: false, isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false };
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1 || this.state === AssassinState.DUEL, { x: animX, y: animY, isRunning: this.state === AssassinState.CHASE, isPickingUp: this.isPickingUp, isDead: false, jump: false } as any, env.obstacles);
        this.walkTime = animContext.walkTime; this.lastStepCount = animContext.lastStepCount;
        this.model.update(dt, new THREE.Vector3(0, 0, 0));
        this.model.sync(this.config, true);
    }
}
