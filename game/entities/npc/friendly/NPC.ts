import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../../types';
import { HumanoidEntity } from '../../HumanoidEntity';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { AIUtils } from '../../../core/AIUtils';
import { OUTFIT_PRESETS, BODY_PRESETS } from '../../../../data/constants';

export type NpcBehaviorMode = 'idle' | 'roam' | 'conversation' | 'work';
export type NpcGesture = 'none' | 'wave' | 'interact';

export interface NpcBehaviorConfig {
    mode?: NpcBehaviorMode;
    anchor?: THREE.Vector3;
    waypoints?: THREE.Vector3[];
    speed?: number;
    pauseMin?: number;
    pauseMax?: number;
    lookTarget?: THREE.Vector3 | null;
    gesture?: NpcGesture;
    gestureCycle?: number;
}

export class NPC extends HumanoidEntity {
    public behaviorMode: NpcBehaviorMode = 'idle';
    public behaviorAnchor: THREE.Vector3;
    public behaviorWaypoints: THREE.Vector3[] = [];
    public behaviorWaypointIndex: number = 0;
    public behaviorSpeed: number = 1.1;
    public behaviorPauseMin: number = 1.2;
    public behaviorPauseMax: number = 3.2;
    public behaviorPauseTimer: number = 0;
    public behaviorLookTarget: THREE.Vector3 | null = null;
    public behaviorGesture: NpcGesture = 'none';
    public behaviorGestureCycle: number = 2.8;

    private readonly collisionSize = new THREE.Vector3(0.7, 1.8, 0.7);
    private readonly tempBehaviorTarget = new THREE.Vector3();
    private behaviorIsMoving: boolean = false;
    private behaviorIsInteracting: boolean = false;
    private behaviorIsWaving: boolean = false;

    constructor(scene: THREE.Scene, partialConfig: Partial<PlayerConfig>, initialPos: THREE.Vector3) {
        let resolvedConfig = { ...DEFAULT_CONFIG };
        const variant = partialConfig.bodyVariant || resolvedConfig.bodyVariant;
        if (BODY_PRESETS[variant]) resolvedConfig = { ...resolvedConfig, ...BODY_PRESETS[variant] };
        const outfit = partialConfig.outfit || resolvedConfig.outfit;
        if (OUTFIT_PRESETS[outfit]) resolvedConfig = { ...resolvedConfig, ...OUTFIT_PRESETS[outfit] };

        const finalConfig = {
            ...resolvedConfig,
            ...partialConfig,
            equipment: {
                ...DEFAULT_CONFIG.equipment,
                ...(resolvedConfig.equipment ?? {}),
                ...(partialConfig.equipment ?? {})
            },
            stats: {
                ...DEFAULT_CONFIG.stats,
                ...(resolvedConfig.stats ?? {}),
                ...(partialConfig.stats ?? {})
            }
        };
        if (!partialConfig.hairStyle) finalConfig.hairStyle = 'crew';

        super(scene, initialPos, finalConfig);
        this.behaviorAnchor = initialPos.clone();
    }

    setBehavior(config: NpcBehaviorConfig) {
        this.behaviorMode = config.mode ?? this.behaviorMode;
        this.behaviorAnchor.copy(config.anchor ?? this.position);
        this.behaviorWaypoints = (config.waypoints ?? []).map((point) => point.clone());
        this.behaviorWaypointIndex = 0;
        this.behaviorSpeed = config.speed ?? this.behaviorSpeed;
        this.behaviorPauseMin = config.pauseMin ?? this.behaviorPauseMin;
        this.behaviorPauseMax = config.pauseMax ?? this.behaviorPauseMax;
        this.behaviorLookTarget = config.lookTarget ? config.lookTarget.clone() : null;
        this.behaviorGesture = config.gesture ?? this.behaviorGesture;
        this.behaviorGestureCycle = config.gestureCycle ?? this.behaviorGestureCycle;
        this.behaviorPauseTimer = 0;
    }

    update(dt: number, targetEyePosition: THREE.Vector3, environment: Environment, skipAnimation: boolean = false) {
        if (this.isDead) return;
        this.updateGroundHeight(environment);
        
        // Use targetEyePosition (player's eye) as camera pos for stat bars in dev scene
        // We assume 'isCombatActive' is false for pure NPCs usually, but we want bars if damaged.
        // this.updateStatBars(targetEyePosition, false); // Handled by EntityManager
        
        if (!PlayerUtils.isWithinBounds(this.position)) {
            const limit = PlayerUtils.WORLD_LIMIT - 1.0;
            this.position.x = THREE.MathUtils.clamp(this.position.x, -limit, limit);
            this.position.z = THREE.MathUtils.clamp(this.position.z, -limit, limit);
        }

        this.updateBehavior(dt, environment);

        const distToPlayer = this.position.distanceTo(targetEyePosition);
        if (!this.behaviorLookTarget && !this.behaviorIsMoving && distToPlayer < 4.0) {
            this.targetRotationY = Math.atan2(targetEyePosition.x - this.position.x, targetEyePosition.z - this.position.z);
        }

        if (skipAnimation) {
            this.updateModel(dt);
            this.model.sync(this.config, false);
            return;
        }

        this.cameraHandler.headLookWeight = THREE.MathUtils.lerp(this.cameraHandler.headLookWeight, distToPlayer < 5.0 ? 1.0 : 0.0, dt * 2.0);
        this.cameraHandler.cameraWorldPosition.copy(targetEyePosition);

        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: false, isJumping: false, isAxeSwing: false, isPunch: false, isPickingUp: false,
            isInteracting: this.behaviorIsInteracting, isWaving: this.behaviorIsWaving, isSkinning: false, isFishing: false, isDragged: false,
            walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };

        this.animator.animate(animContext, dt, this.behaviorIsMoving, {
            x: 0,
            y: this.behaviorIsMoving ? 1 : 0,
            isRunning: this.behaviorSpeed > 1.8,
            isPickingUp: false,
            isDead: false,
            jump: false
        } as any);
        
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        
        this.updateModel(dt);
        this.model.sync(this.config, false);
    }

    private updateBehavior(dt: number, environment: Environment) {
        const obstacles = environment?.obstacles ?? [];
        this.behaviorIsMoving = false;
        this.behaviorIsInteracting = false;
        this.behaviorIsWaving = false;

        if (this.behaviorMode === 'roam' && this.behaviorWaypoints.length > 0) {
            if (this.behaviorPauseTimer > 0) {
                this.behaviorPauseTimer = Math.max(0, this.behaviorPauseTimer - dt);
            } else {
                const waypoint = this.behaviorWaypoints[this.behaviorWaypointIndex];
                this.tempBehaviorTarget.copy(waypoint);
                this.tempBehaviorTarget.y = this.targetPosition.y;

                const distanceToWaypoint = this.position.distanceTo(this.tempBehaviorTarget);
                if (distanceToWaypoint < 0.4) {
                    this.behaviorWaypointIndex = (this.behaviorWaypointIndex + 1) % this.behaviorWaypoints.length;
                    this.behaviorPauseTimer = this.behaviorPauseMin + Math.random() * Math.max(0.1, this.behaviorPauseMax - this.behaviorPauseMin);
                } else {
                    const desiredRotation = Math.atan2(this.tempBehaviorTarget.x - this.position.x, this.tempBehaviorTarget.z - this.position.z);
                    this.targetRotationY = AIUtils.getAdvancedAvoidanceSteering(this.position, desiredRotation, this.collisionSize, obstacles, 1.6);
                    const nextPos = AIUtils.getNextPosition(this.position, this.targetRotationY, this.behaviorSpeed, dt, this.collisionSize, obstacles);
                    this.targetPosition.x = nextPos.x;
                    this.targetPosition.z = nextPos.z;
                    this.behaviorIsMoving = true;
                }
            }
        } else {
            this.targetPosition.x = this.behaviorAnchor.x;
            this.targetPosition.z = this.behaviorAnchor.z;
        }

        if (!this.behaviorIsMoving) {
            if (this.behaviorLookTarget) {
                this.targetRotationY = Math.atan2(this.behaviorLookTarget.x - this.position.x, this.behaviorLookTarget.z - this.position.z);
            }
            if (this.behaviorGesture !== 'none') {
                const cycleTime = this.behaviorGestureCycle > 0 ? (performance.now() / 1000) % this.behaviorGestureCycle : 0;
                if (this.behaviorGesture === 'wave') {
                    this.behaviorIsWaving = cycleTime < this.behaviorGestureCycle * 0.28;
                } else if (this.behaviorGesture === 'interact') {
                    this.behaviorIsInteracting = cycleTime < this.behaviorGestureCycle * 0.45;
                }
            }
        }
    }
}
