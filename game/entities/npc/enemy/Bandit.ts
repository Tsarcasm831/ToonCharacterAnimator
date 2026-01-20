import * as THREE from 'three';
import { DEFAULT_CONFIG, EntityStats } from '../../../../types';
import { HumanoidEntity } from '../../HumanoidEntity';
import { Environment } from '../../../environment/Environment';
import { CombatEnvironment } from '../../../environment/CombatEnvironment';
import { AIUtils } from '../../../core/AIUtils';
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
    
    private healthBar: THREE.Mesh | null = null;
    private healthBarBack: THREE.Mesh | null = null;
    private chakraBar: THREE.Mesh | null = null;
    private chakraBarBack: THREE.Mesh | null = null;
    private barsGroup: THREE.Group | null = null;

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
        
        this.initStatBars();
        this.model.sync(this.config, true);
    }

    private initStatBars() {
        this.barsGroup = new THREE.Group();
        this.model.group.add(this.barsGroup);

        const barGeo = new THREE.PlaneGeometry(0.8, 0.1);
        const healthMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const chakraMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

        const healthBg = new THREE.Mesh(barGeo, bgMat);
        this.healthBar = new THREE.Mesh(barGeo, healthMat);
        this.healthBar.position.z = 0.01;

        const chakraBg = new THREE.Mesh(barGeo, bgMat);
        this.chakraBar = new THREE.Mesh(barGeo, chakraMat);
        this.chakraBar.position.z = 0.01;

        // Add back-side meshes for visibility from both sides
        this.healthBarBack = new THREE.Mesh(barGeo, healthMat);
        this.healthBarBack.position.z = -0.01;
        this.healthBarBack.rotation.y = Math.PI;
        
        this.chakraBarBack = new THREE.Mesh(barGeo, chakraMat);
        this.chakraBarBack.position.z = -0.01;
        this.chakraBarBack.rotation.y = Math.PI;

        healthBg.position.y = 2.6;
        this.healthBar.position.y = 2.6;
        this.healthBarBack.position.y = 2.6;
        
        chakraBg.position.y = 2.45;
        this.chakraBar.position.y = 2.45;
        this.chakraBarBack.position.y = 2.45;

        this.barsGroup.add(healthBg);
        this.barsGroup.add(this.healthBar);
        this.barsGroup.add(this.healthBarBack);
        this.barsGroup.add(chakraBg);
        this.barsGroup.add(this.chakraBar);
        this.barsGroup.add(this.chakraBarBack);
    }

    private updateStatBars(cameraPos: THREE.Vector3, isCombatActive: boolean) {
        if (!this.barsGroup) return;
        
        this.barsGroup.visible = isCombatActive;
        if (!isCombatActive) return;

        this.barsGroup.lookAt(cameraPos);
        
        if (this.healthBar && this.healthBarBack && this.stats) {
            const scale = Math.max(0, this.stats.health / this.stats.maxHealth);
            this.healthBar.scale.x = scale;
            this.healthBarBack.scale.x = scale;
            
            const offset = -0.4 * (1 - scale);
            this.healthBar.position.x = offset;
            this.healthBarBack.position.x = -offset; // Inverted for back side
        }
        if (this.chakraBar && this.chakraBarBack && this.stats) {
            const scale = Math.max(0, (this.stats.chakra || 0) / (this.stats.maxChakra || 100));
            this.chakraBar.scale.x = scale;
            this.chakraBarBack.scale.x = scale;
            
            const offset = -0.4 * (1 - scale);
            this.chakraBar.position.x = offset;
            this.chakraBarBack.position.x = -offset; // Inverted for back side
        }
    }

    update(dt: number, environment: Environment | CombatEnvironment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false, isCombatActive: boolean = true) {
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
            this.updateModel(dt);
            this.model.sync(this.config, true);
            return;
        }

        // --- NEW COMBAT AI ---
        const cameraPos = (env as any).scene?.userData?.camera?.position || new THREE.Vector3(0, 10, 10);
        this.updateStatBars(cameraPos, isCombatActive);

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

        this.group.position.copy(this.position);
        this.model.group.rotation.y = this.rotationY;

        if (skipAnimation) return;

        this.speedFactor = THREE.MathUtils.lerp(this.speedFactor, 0, dt * 6);
        
        const animContext = {
            config: this.config, model: this.model, status: this.status, cameraHandler: this.cameraHandler,
            isCombatStance: true,
            isJumping: false, isAxeSwing: this.isStriking, axeSwingTimer: this.strikeTimer, isPunch: false,
            isPickingUp: false, pickUpTime: 0, isInteracting: false, isWaving: false, isSkinning: false,
            isFishing: false, isDragged: false, walkTime: this.walkTime, lastStepCount: this.lastStepCount, didStep: false
        };
        
        this.animator.animate(animContext, dt, Math.abs(this.speedFactor) > 0.1, { x: 0, y: 0, isRunning: false, isPickingUp: false, isDead: false, jump: false } as any, env.obstacles);
        this.walkTime = animContext.walkTime;
        this.lastStepCount = animContext.lastStepCount;
        this.updateModel(dt);
        this.model.sync(this.config, true);
    }
}
