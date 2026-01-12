import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum YetiState {
    IDLE,
    PATROL,
    CHASE,
    ATTACK,
    DEAD
}

export class Yeti {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: YetiState = YetiState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    isDead: boolean = false;
    isSkinned: boolean = false;
    
    maxHealth: number = 100; // Tanky mini-boss
    health: number = 100;
    
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    private attackCooldown: number = 0;
    private moveSpeedVal: number = 2.5; // Fast lumbering stride

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        // Ice White color
        const yetiData = ObjectFactory.createBearModel(0xEEFFFF);
        this.group = new THREE.Group();
        this.group.add(yetiData.group);
        this.model = yetiData;
        
        // Scale up: Yetis are big
        this.model.group.scale.set(1.2, 1.2, 1.2);

        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);

        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        // Body: Vertical and wide (Chest/Torso)
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 1.0), hitboxMat);
        bodyHitbox.position.y = 1.8; // Standing height
        bodyHitbox.userData = { type: 'creature' };
        this.hitbox.add(bodyHitbox);

        // Head: High up
        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), hitboxMat);
        headHitbox.position.set(0, 3.0, 0.3); // Forward hunch
        headHitbox.userData = { type: 'creature' };
        this.hitbox.add(headHitbox);

        // Arms (Massive reach)
        const armHitbox = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.8), hitboxMat);
        armHitbox.position.set(0, 2.0, 0.5);
        armHitbox.userData = { type: 'creature' };
        this.hitbox.add(armHitbox);

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 3.8, 0); 
        
        // Boss-style health bar (larger)
        const bgGeo = new THREE.PlaneGeometry(1.5, 0.2);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.healthBarGroup.add(bg);

        const fgGeo = new THREE.PlaneGeometry(1.46, 0.16);
        fgGeo.translate(0.73, 0, 0); 
        const fgMat = new THREE.MeshBasicMaterial({ color: 0xff3333, side: THREE.DoubleSide }); // Red bar for enemy
        this.healthBarFill = new THREE.Mesh(fgGeo, fgMat);
        this.healthBarFill.position.set(-0.73, 0, 0.01); 
        this.healthBarGroup.add(this.healthBarFill);

        this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[]) {
        if (this.isDead) return;

        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // --- Aggression Logic ---
        const detectionRange = 15;
        const attackRange = 2.5;

        // Find closest target (Player)
        let closestDist = Infinity;
        let closestTarget = null;

        // Assuming potentialTargets[0] is player for now, or loop through them
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < closestDist) {
                closestDist = d;
                closestTarget = t;
            }
        }

        // State Machine
        if (this.state === YetiState.DEAD) return;

        if (closestTarget && closestDist < detectionRange) {
            this.currentTarget = closestTarget;
            if (closestDist < attackRange) {
                this.state = YetiState.ATTACK;
            } else {
                this.state = YetiState.CHASE;
            }
        } else {
            this.currentTarget = null;
            if (this.state === YetiState.CHASE || this.state === YetiState.ATTACK) {
                this.state = YetiState.PATROL;
                this.findPatrolPoint();
            }
        }

        // Behavior
        let moveSpeed = 0;

        if (this.state === YetiState.ATTACK) {
            moveSpeed = 0;
            // Face the target
            if (this.currentTarget) {
                const toTarget = new THREE.Vector3().subVectors(this.currentTarget.position, this.position);
                this.rotationY = Math.atan2(toTarget.x, toTarget.z);
                
                if (this.attackCooldown <= 0) {
                    this.performAttack();
                }
            }
        } else if (this.state === YetiState.CHASE) {
            moveSpeed = this.moveSpeedVal * 1.5; // Runs fast
            if (this.currentTarget) {
                this.targetPos.copy(this.currentTarget.position);
            }
        } else if (this.state === YetiState.PATROL) {
            moveSpeed = this.moveSpeedVal;
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) {
                this.findPatrolPoint();
                this.stateTimer = 0;
            }
        }

        // Movement Application
        if (moveSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                const desiredRot = Math.atan2(toTarget.x, toTarget.z);
                let diff = desiredRot - this.rotationY;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.rotationY += diff * 4.0 * dt; 
                
                const step = moveSpeed * dt;
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));
                
                if (PlayerUtils.isWithinBounds(nextPos)) {
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
            }
            this.walkTime += dt * moveSpeed;
        }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;
        this.animate(dt, moveSpeed);
    }

    private performAttack() {
        this.attackCooldown = 1.5;
        // Logic to damage player would go here (e.g. callback or event)
        console.log("Yeti Smash!"); 
    }

    private findPatrolPoint() {
        const range = 25;
        this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range);
        if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0);
    }

    private animate(dt: number, moveSpeed: number) {
        const parts = this.model.parts;
        // Scale time for heavy, lumbering movement
        const time = this.walkTime * 0.8; 
        
        // --- BIPEDAL CONVERSION ---
        // Force the quadruped model to stand up
        if (parts.body) {
            // Rotate body to be vertical (leaning forward slightly: -70 degrees)
            parts.body.rotation.x = -Math.PI / 2.5; 
            parts.body.position.y = 1.5; // Lift body up
        }

        // Fix leg orientations to point down from the vertical body
        const legOffset = Math.PI / 2.5; // Counteract body rotation
        
        if (moveSpeed > 0) {
            // Bipedal Walk Cycle
            const stride = Math.sin(time);
            
            // Legs (Rear legs of bear become legs of Yeti)
            // Left Leg
            if(parts.legBL) parts.legBL.rotation.x = legOffset + stride * 0.6;
            // Right Leg
            if(parts.legBR) parts.legBR.rotation.x = legOffset - stride * 0.6;
            
            // Arms (Front legs of bear become Arms)
            // Arms swing opposite to legs
            // Left Arm
            if(parts.legFL) parts.legFL.rotation.x = legOffset - stride * 0.6;
            // Right Arm
            if(parts.legFR) parts.legFR.rotation.x = legOffset + stride * 0.6;
            
            // Lumbering side-to-side sway
            if(parts.body) parts.body.rotation.z = Math.cos(time) * 0.1;

        } else if (this.state === YetiState.ATTACK) {
            // Smash Animation
            // Raise both arms
            const smash = Math.sin(this.attackCooldown * 10); // Rapid shake or raise
            if (this.attackCooldown > 1.0) {
                 // Wind up
                 if(parts.legFL) parts.legFL.rotation.x = legOffset - 2.0; // Arms up
                 if(parts.legFR) parts.legFR.rotation.x = legOffset - 2.0; 
            } else {
                 // Slam
                 if(parts.legFL) parts.legFL.rotation.x = legOffset + 0.5; // Arms down
                 if(parts.legFR) parts.legFR.rotation.x = legOffset + 0.5; 
            }
             // Legs Stand firm
             if(parts.legBL) parts.legBL.rotation.x = legOffset;
             if(parts.legBR) parts.legBR.rotation.x = legOffset;

        } else {
            // IDLE Breathing
            const breath = Math.sin(this.stateTimer * 1.0) * 0.05;
            if(parts.body) {
                parts.body.scale.set(1 + breath, 1 + breath, 1 + breath);
            }
            
            // Arms hang loosely
            if(parts.legFL) parts.legFL.rotation.x = legOffset;
            if(parts.legFR) parts.legFR.rotation.x = legOffset;
            if(parts.legBL) parts.legBL.rotation.x = legOffset;
            if(parts.legBR) parts.legBR.rotation.x = legOffset;
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        
        // Aggro on hit logic
        if (this.state !== YetiState.ATTACK && this.state !== YetiState.CHASE) {
            this.state = YetiState.CHASE;
        }

        const percent = Math.max(0, this.health / this.maxHealth);
        this.healthBarFill.scale.x = percent;
        
        // Flash red
        if(this.model.parts.body.material) {
            this.model.parts.body.material.emissive.setHex(0xff0000);
            this.model.parts.body.material.emissiveIntensity = 0.5;
        }

        if (this.health <= 0) {
            this.die();
        } else {
            setTimeout(() => { 
                if (!this.isDead && this.model.parts.body.material) { 
                    this.model.parts.body.material.emissiveIntensity = 0; 
                } 
            }, 100);
        }
    }

    private die() {
        this.isDead = true;
        this.state = YetiState.DEAD;
        this.healthBarGroup.visible = false;
        if (this.model.parts.body.material) {
            this.model.parts.body.material.emissiveIntensity = 0;
        }
        
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'thick_white_fur';
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = true;
            child.userData.material = 'thick_white_fur';
        });
        
        // Face plant death
        this.model.group.rotation.x = Math.PI / 2;
        this.model.group.position.y = 0.5;
        this.hitbox.position.y = -10; // Move hitbox away
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; });
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0xaaaaaa); // Grey skinned look
            }
        });
    }
}