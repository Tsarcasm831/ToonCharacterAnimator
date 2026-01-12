
import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum WolfState {
    IDLE,
    PATROL,
    CHASE,
    ATTACK,
    DEAD
}

export class Wolf {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: WolfState = WolfState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    isDead: boolean = false;
    isSkinned: boolean = false;
    
    // Stats
    maxHealth: number = 17;
    health: number = 17;
    
    // Components
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    private attackCooldown: number = 0;

    // Biome Bounds for Autumnal Grove (Grid 1, -1)
    // Center: X=40, Z=-40. Biome Size: 40
    private readonly GROVE_X_MIN = 20;
    private readonly GROVE_X_MAX = 60;
    private readonly GROVE_Z_MIN = -60;
    private readonly GROVE_Z_MAX = -20;
    private readonly GROVE_CENTER = new THREE.Vector3(40, 0, -40);

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        
        // Ensure initial position is in the grove
        const spawnPos = initialPos.clone();
        if (!this.isInsideGrove(spawnPos)) {
            spawnPos.copy(this.GROVE_CENTER);
        }
        this.position.copy(spawnPos);
        
        const wolfData = ObjectFactory.createWolfModel(0x666666);
        this.group = new THREE.Group();
        this.group.add(wolfData.group);
        this.model = wolfData;
        
        // --- IMPROVED HITBOX (Composite Shape) ---
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this };
        this.group.add(this.hitbox);

        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        // 1. Body Hitbox (Main Mass)
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.3), hitboxMat);
        bodyHitbox.position.y = 0.55;
        bodyHitbox.userData = { type: 'creature' };
        this.hitbox.add(bodyHitbox);

        // 2. Head Hitbox (Vertical reach)
        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.6), hitboxMat);
        headHitbox.position.set(0, 0.95, 0.6);
        headHitbox.userData = { type: 'creature' };
        this.hitbox.add(headHitbox);

        // 3. Snout Hitbox (Frontal reach)
        const snoutHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.5), hitboxMat);
        snoutHitbox.position.set(0, 0.8, 1.1);
        snoutHitbox.userData = { type: 'creature' };
        this.hitbox.add(snoutHitbox);

        // --- HEALTH BAR ---
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 1.7, 0); 
        
        // Background (Red/Black)
        const bgGeo = new THREE.PlaneGeometry(1.0, 0.15);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.healthBarGroup.add(bg);

        // Foreground (Green)
        const fgGeo = new THREE.PlaneGeometry(0.96, 0.11);
        // Pivot left for scaling
        fgGeo.translate(0.48, 0, 0); 
        const fgMat = new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide });
        this.healthBarFill = new THREE.Mesh(fgGeo, fgMat);
        this.healthBarFill.position.set(-0.48, 0, 0.01); 
        this.healthBarGroup.add(this.healthBarFill);

        this.healthBarGroup.rotation.y = 0; 
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    private isInsideGrove(pos: THREE.Vector3): boolean {
        return pos.x >= this.GROVE_X_MIN && pos.x <= this.GROVE_X_MAX &&
               pos.z >= this.GROVE_Z_MIN && pos.z <= this.GROVE_Z_MAX;
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[]) {
        if (this.isDead) return;

        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // 1. Target Selection (Only if target is INSIDE the grove)
        let bestTarget = null;
        let bestDist = 15.0; 
        
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            // WOLF BINDING: Only consider targets physically in the grove
            if (!this.isInsideGrove(t.position)) continue;

            const d = this.position.distanceTo(t.position);
            if (d < bestDist) {
                bestDist = d;
                bestTarget = t;
            }
        }
        
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // State Transitions
        if (bestTarget) {
            if (this.state === WolfState.PATROL || this.state === WolfState.IDLE) {
                this.state = WolfState.CHASE;
                this.stateTimer = 0;
            }
            
            if (this.state === WolfState.CHASE) {
                if (distToTarget < 2.0) {
                    this.state = WolfState.ATTACK;
                    this.stateTimer = 0;
                } else {
                    this.targetPos.copy(bestTarget.position);
                }
            }

            if (this.state === WolfState.ATTACK) {
                if (distToTarget > 3.0) {
                    this.state = WolfState.CHASE;
                    this.stateTimer = 0;
                } else if (this.attackCooldown <= 0 && this.stateTimer > 0.5) {
                    this.attackCooldown = 1.5;
                    this.stateTimer = 0;
                }
            }
        } else {
            // No target or target left the grove
            if (this.state !== WolfState.PATROL && this.state !== WolfState.IDLE) {
                this.state = WolfState.PATROL;
                this.stateTimer = 0;
                this.findPatrolPoint();
            }
        }

        // Movement & Animation
        let moveSpeed = 0;
        if (this.state === WolfState.PATROL) {
            moveSpeed = 2.0;
            
            // Re-evaluate patrol point if we arrived, or if we are outside the grove (return to territory)
            const needsNewPoint = this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0;
            const isEscaped = !this.isInsideGrove(this.position);

            if (needsNewPoint || isEscaped) {
                this.findPatrolPoint();
                this.stateTimer = 0;
            }
        } else if (this.state === WolfState.CHASE) {
            moveSpeed = 6.0;
        }

        if (moveSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                const desiredRot = Math.atan2(toTarget.x, toTarget.z);
                let diff = desiredRot - this.rotationY;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.rotationY += diff * 5.0 * dt;

                const step = moveSpeed * dt;
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));
                
                // Allow movement as long as it's within world bounds, 
                // findPatrolPoint will pull it back if it strays too far.
                if (PlayerUtils.isWithinBounds(nextPos)) {
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
            }
            this.walkTime += dt * moveSpeed;
        }

        // Update visuals
        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;

        this.animate(dt, moveSpeed);
    }

    private findPatrolPoint() {
        // If we are far outside the grove, prioritize returning to center
        if (!this.isInsideGrove(this.position)) {
            this.targetPos.copy(this.GROVE_CENTER);
            return;
        }

        const range = 15; // Patrol range within the biome
        const candidate = new THREE.Vector3(
            this.position.x + (Math.random() - 0.5) * range,
            0,
            this.position.z + (Math.random() - 0.5) * range
        );

        // Clamp patrol point strictly to the Grove boundaries
        candidate.x = THREE.MathUtils.clamp(candidate.x, this.GROVE_X_MIN + 1, this.GROVE_X_MAX - 1);
        candidate.z = THREE.MathUtils.clamp(candidate.z, this.GROVE_Z_MIN + 1, this.GROVE_Z_MAX - 1);
        
        this.targetPos.copy(candidate);
    }

    private animate(dt: number, moveSpeed: number) {
        const parts = this.model.parts;
        const time = this.walkTime;

        if (moveSpeed > 0) {
            // Leg animation
            const legSwing = Math.sin(time * 2.0) * 0.5;
            parts.legFR.rotation.x = legSwing;
            parts.legBL.rotation.x = legSwing;
            parts.legFL.rotation.x = -legSwing;
            parts.legBR.rotation.x = -legSwing;
            
            // Body bob
            parts.body.position.y = 0.6 + Math.abs(Math.cos(time * 2.0)) * 0.1;
            
            // Tail wag
            parts.tail.rotation.y = Math.sin(time * 4.0) * 0.3;
        } else {
            // Idle breathing
            const breath = Math.sin(this.stateTimer * 2.0) * 0.02;
            parts.body.scale.set(1 + breath, 1 + breath, 1 + breath);
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        
        this.health -= amount;
        
        // Update Health Bar
        const percent = Math.max(0, this.health / this.maxHealth);
        this.healthBarFill.scale.x = percent;
        
        if (percent < 0.3) (this.healthBarFill.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
        else if (percent < 0.6) (this.healthBarFill.material as THREE.MeshBasicMaterial).color.setHex(0xffff00);

        this.model.parts.body.material.emissive.setHex(0xff0000);
        this.model.parts.body.material.emissiveIntensity = 0.5;
        
        if (this.health <= 0) {
            this.die();
        } else {
            setTimeout(() => {
                if (!this.isDead) {
                    this.model.parts.body.material.emissive.setHex(0x000000);
                    this.model.parts.body.material.emissiveIntensity = 0;
                }
            }, 100);
            // Get angry
            this.state = WolfState.CHASE; 
        }
    }

    private die() {
        this.isDead = true;
        this.state = WolfState.DEAD;
        this.healthBarGroup.visible = false;

        // Reset hit tint immediately
        if (this.model.parts.body.material) {
            this.model.parts.body.material.emissive.setHex(0x000000);
            this.model.parts.body.material.emissiveIntensity = 0;
        }

        // Enable skinning
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'flesh';
        
        // Also apply to child meshes for thorough interaction detection
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = true;
            child.userData.material = 'flesh';
        });

        // Pose as dead
        this.model.group.rotation.z = Math.PI / 2;
        this.model.group.position.y = 0.15;
        
        // Slightly move hitbox lower to match the fallen body
        this.hitbox.position.y = -0.4;
    }

    markAsSkinned() {
        this.isSkinned = true;
        
        // Disable interaction
        this.hitbox.userData.isSkinnable = false;
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = false;
        });

        // Visual feedback: Darken the model to show it's "spent"
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                // Clone material so we don't affect other wolves if sharing
                obj.material = obj.material.clone();
                obj.material.color.multiplyScalar(0.3); // Charred/Darkened look
            }
        });
    }
}
