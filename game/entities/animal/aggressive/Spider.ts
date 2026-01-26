import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { AIUtils } from '../../../core/AIUtils';

export enum SpiderState { IDLE, PATROL, CHASE, ATTACK, DEAD }

export class Spider {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: SpiderState = SpiderState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    isDead: boolean = false;
    isSkinned: boolean = false;
    maxHealth: number = 30;
    health: number = 30;
    hitbox: THREE.Group;
    
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    private walkTime: number = 0;
    private attackCooldown: number = 0;
    private moveSpeedVal: number = 2.0;
    private readonly collisionSize = new THREE.Vector3(1.2, 0.9, 1.4);
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastStuckPos.copy(this.position);

        // Model Creation
        const spiderData = ObjectFactory.createSpiderModel 
            ? ObjectFactory.createSpiderModel(0x1a1a1a) 
            : ObjectFactory.createBearModel(0x1a1a1a); // Fallback
            
        this.group = new THREE.Group();
        this.group.add(spiderData.group);
        this.model = spiderData;

        // User Data / Tags
        this.group.userData.entityType = 'Spider';
        this.model.group.userData.type = 'creature';
        this.model.group.userData.entityType = 'Spider';
        this.hitbox = this.model.group;
        this.hitbox.userData = { type: 'creature', parent: this, entityType: 'Spider' };

        // Propagate userdata to children for raycasting
        this.hitbox.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.userData = { ...child.userData, type: 'creature', parent: this, entityType: 'Spider' };
            }
        });

        // Health Bar Setup
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 2.0, 0);
        
        const bg = new THREE.Mesh(
            new THREE.PlaneGeometry(1.0, 0.15), 
            new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })
        );
        this.healthBarGroup.add(bg);
        
        const fgGeo = new THREE.PlaneGeometry(0.96, 0.11);
        fgGeo.translate(0.48, 0, 0);
        this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide }));
        this.healthBarFill.position.set(-0.48, 0, 0.01);
        this.healthBarGroup.add(this.healthBarFill);
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return;
        
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // Simple State Logic
        if (this.state !== SpiderState.PATROL) {
            this.state = SpiderState.PATROL;
            this.findPatrolPoint();
        }

        // Pause occasionally to look realistic
        let currentSpeed = (this.stateTimer > 4.0 && this.stateTimer < 6.0) ? 0 : this.moveSpeedVal;

        if (currentSpeed > 0) {
            // Check destination arrival
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) {
                this.findPatrolPoint();
                this.stateTimer = 0;
            }

            // Movement Logic
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;

            if (toTarget.length() > 0.1) {
                // Smooth rotation
                const targetRotation = Math.atan2(toTarget.x, toTarget.z);
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, 5.0);
                const avoidanceRot = AIUtils.getAdvancedAvoidanceSteering(this.position, this.rotationY, this.collisionSize, environment.obstacles);
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, 10.0);

                const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, currentSpeed, dt, this.collisionSize, environment.obstacles);
                this.position.x = nextPos.x;
                this.position.z = nextPos.z;
            }
            this.walkTime += dt * currentSpeed;

            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        } else {
            this.stuckTimer = 0;
            this.lastStuckPos.copy(this.position);
        }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z) + 0.1;
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() {
        const range = 15;
        this.targetPos.set(
            this.position.x + (Math.random() - 0.5) * range,
            0,
            this.position.z + (Math.random() - 0.5) * range
        );
        if (!PlayerUtils.isWithinBounds(this.targetPos)) {
            this.targetPos.set(0, 0, 0);
        }
    }

    private animate(dt: number, moveSpeed: number) {
        const parts = this.model.parts;
        // Faster animation speed looks more insect-like
        const time = this.walkTime * 10.0; 
        
        if (moveSpeed > 0) {
            // --- Realistic Tripod Gait ---
            // Group A: L1, R2, L3, R4
            // Group B: R1, L2, R3, L4
            
            const legGroups = [
                { side: 'L', index: 1, group: 0 }, { side: 'R', index: 1, group: 1 },
                { side: 'L', index: 2, group: 1 }, { side: 'R', index: 2, group: 0 },
                { side: 'L', index: 3, group: 0 }, { side: 'R', index: 3, group: 1 },
                { side: 'L', index: 4, group: 1 }, { side: 'R', index: 4, group: 0 },
            ];

            legGroups.forEach(item => {
                // Offset calculation: Group 0 is normal, Group 1 is PI offset
                const groupOffset = item.group === 0 ? 0 : Math.PI;
                const legCycle = time + groupOffset;
                
                const sin = Math.sin(legCycle);
                const cos = Math.cos(legCycle); // Used for forward/back swing

                // Calculate Phases
                // Lift phase: when sin is positive. Plant phase: when sin is negative.
                const isLiftPhase = sin > 0;
                
                // --- Joint Angles ---
                
                // 1. Coxa/Femur (Base Leg)
                // Swing forward/back (Y axis)
                const swingRange = 0.35; 
                let rotY = cos * swingRange;
                // Add bias so front legs angle forward, back legs angle backward
                const baseAngle = (item.index < 2.5) ? 0.3 : -0.3; 
                
                // Lift (Z axis) - Creates the up/down step
                // We arch UP (negative Z on left, positive on right usually, depends on model)
                const sideMod = item.side === 'L' ? -1 : 1;
                const liftHeight = Math.max(0, sin) * 0.4;
                const baseLift = 0.5; // Natural arch
                let rotZ = sideMod * (baseLift + liftHeight);

                // 2. Tibia (Knee)
                // Always bent downwards relative to femur to make contact with ground
                // When leg lifts, knee bends more (curls in)
                const kneeBend = -1.5 - (isLiftPhase ? 0.4 : 0.0); 
                let tibiaZ = sideMod * kneeBend;

                // 3. Tarsus (Foot)
                // Slight adjustment to keep tip down
                let tarsusZ = sideMod * -0.5;

                // Apply rotations
                const leg = parts[`leg${item.side}${item.index}`];
                const tibia = parts[`leg${item.side}${item.index}_tibia`];
                const tarsus = parts[`leg${item.side}${item.index}_tarsus`];

                if (leg) {
                    leg.rotation.y = rotY + (sideMod * baseAngle * 0.5); 
                    leg.rotation.z = rotZ;
                }
                if (tibia) {
                    tibia.rotation.z = tibiaZ;
                    // Slight sway in knee
                    tibia.rotation.y = sin * 0.1; 
                }
                if (tarsus) {
                    tarsus.rotation.z = tarsusZ;
                }
            });
            
            // --- Body Physics ---
            if (parts.body) {
                // Bob up and down (2 steps per cycle)
                parts.body.position.y = 0.45 - Math.abs(Math.sin(time)) * 0.05;
                
                // Roll body slightly side to side based on which legs are planting
                parts.body.rotation.z = Math.sin(time) * 0.05;
                
                // Pitch body slightly forward when moving
                parts.body.rotation.x = 0.05;
            }

        } else {
            // --- Idle Animation ---
            // Slow, heavy breathing
            const breath = Math.sin(this.stateTimer * 2.0) * 0.02;
            if (parts.abdomen) {
                parts.abdomen.scale.set(1 + breath, 1 + breath, 1 + breath);
            }
            
            // Reset body rotation
            if (parts.body) {
                parts.body.rotation.z *= 0.95;
                parts.body.rotation.x *= 0.95;
                parts.body.position.y = THREE.MathUtils.lerp(parts.body.position.y, 0.45, 0.1);
            }

            // Idle leg twitch / stance
            for (let i = 1; i <= 4; i++) {
                for (let side of ['L', 'R']) {
                    const sideMod = side === 'L' ? -1 : 1;
                    const leg = parts[`leg${side}${i}`];
                    const tibia = parts[`leg${side}${i}_tibia`];
                    const tarsus = parts[`leg${side}${i}_tarsus`];

                    // Resting pose: Arched "M" shape
                    if (leg) {
                        leg.rotation.z = sideMod * 0.5;
                        leg.rotation.y = (i < 2.5 ? 0.3 : -0.3) * sideMod; 
                    }
                    if (tibia) tibia.rotation.z = sideMod * -1.5;
                    if (tarsus) tarsus.rotation.z = sideMod * -0.5;
                }
            }
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);
        
        const mainPart = this.model.parts.body || this.model.parts.abdomen;
        if(mainPart && mainPart.material) {
            const oldColor = mainPart.material.emissive.getHex();
            mainPart.material.emissive.setHex(0xff0000);
            mainPart.material.emissiveIntensity = 0.5;
            
            setTimeout(() => {
                if (!this.isDead && mainPart && mainPart.material) {
                    mainPart.material.emissive.setHex(oldColor);
                    mainPart.material.emissiveIntensity = 0;
                }
            }, 100);
        }
        
        if (this.health <= 0) this.die();
    }

    private die() { 
        this.isDead = true; 
        this.state = SpiderState.DEAD; 
        this.healthBarGroup.visible = false; 
        
        // Setup Looting
        this.hitbox.userData.isSkinnable = true; 
        this.hitbox.userData.material = 'silk'; 
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = true;
            child.userData.material = 'silk';
        });

        // Death Animation (curl legs)
        const parts = this.model.parts;
        for (let i = 1; i <= 4; i++) {
            for (let side of ['L', 'R']) {
                const sideMod = side === 'L' ? -1 : 1;
                const leg = parts[`leg${side}${i}`];
                const tibia = parts[`leg${side}${i}_tibia`];
                
                if (leg) leg.rotation.z = sideMod * 1.5; // Curl in
                if (tibia) tibia.rotation.z = sideMod * -2.5; // Curl tight
            }
        }
        
        // Flip over
        this.model.group.rotation.x = Math.PI; 
        this.model.group.position.y = 0.5; 
    }

    markAsSkinned() { 
        this.isSkinned = true; 
        this.hitbox.userData.isSkinnable = false; 
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = false;
        });
        
        this.model.group.traverse((obj: any) => { 
            if (obj.isMesh && obj.material) { 
                obj.material = obj.material.clone(); 
                obj.material.color.setHex(0x555555); // Grayed out
            } 
        }); 
    }
}