import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum SpiderState {
    IDLE,
    PATROL,
    CHASE,
    ATTACK,
    DEAD
}

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
    
    maxHealth: number = 30; // Tougher than a lizard, weaker than a bear
    health: number = 30;
    
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    private attackCooldown: number = 0;
    private moveSpeedVal: number = 2.0;

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        // dark grey/black color
        const spiderData = ObjectFactory.createSpiderModel ? ObjectFactory.createSpiderModel(0x1a1a1a) : ObjectFactory.createBearModel(0x1a1a1a);
        this.group = new THREE.Group();
        this.group.add(spiderData.group);
        this.model = spiderData;
        
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);

        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        // Cephalothorax (Head/Body segment)
        const thoraxHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), hitboxMat);
        thoraxHitbox.position.set(0, 0.5, 0.5);
        thoraxHitbox.userData = { type: 'creature' };
        this.hitbox.add(thoraxHitbox);

        // Abdomen (Large rear segment)
        const abdomenHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.4), hitboxMat);
        abdomenHitbox.position.set(0, 0.7, -0.6);
        abdomenHitbox.userData = { type: 'creature' };
        this.hitbox.add(abdomenHitbox);

        // Wide Leg Span Hitbox (Optional, helps with clicking the legs)
        const legSpanHitbox = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 2.5), hitboxMat);
        legSpanHitbox.position.set(0, 0.2, 0);
        legSpanHitbox.userData = { type: 'creature' };
        this.hitbox.add(legSpanHitbox);

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 1.8, 0); 
        
        const bgGeo = new THREE.PlaneGeometry(1.0, 0.15);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.healthBarGroup.add(bg);

        const fgGeo = new THREE.PlaneGeometry(0.96, 0.11);
        fgGeo.translate(0.48, 0, 0); 
        const fgMat = new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide });
        this.healthBarFill = new THREE.Mesh(fgGeo, fgMat);
        this.healthBarFill.position.set(-0.48, 0, 0.01); 
        this.healthBarGroup.add(this.healthBarFill);

        this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[]) {
        if (this.isDead) return;

        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // Passive/Patrol Logic
        if (this.state !== SpiderState.PATROL) {
            this.state = SpiderState.PATROL;
            this.findPatrolPoint();
        }

        let currentSpeed = 0;
        if (this.state === SpiderState.PATROL) {
            currentSpeed = this.moveSpeedVal;
            
            // Spiders often stop completely to sense vibrations
            if (this.stateTimer > 4.0 && this.stateTimer < 6.0) {
                currentSpeed = 0;
            }

            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) {
                this.findPatrolPoint();
                this.stateTimer = 0;
            }
        }

        if (currentSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                const desiredRot = Math.atan2(toTarget.x, toTarget.z);
                let diff = desiredRot - this.rotationY;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.rotationY += diff * 5.0 * dt; // Fast turning
                const step = currentSpeed * dt;
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));
                if (PlayerUtils.isWithinBounds(nextPos)) {
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
            }
            this.walkTime += dt * currentSpeed;
        }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() {
        const range = 15;
        this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range);
        if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0);
    }

    private animate(dt: number, moveSpeed: number) {
        const parts = this.model.parts;
        const time = this.walkTime * 4.0; // Rapid leg movement
        
        if (moveSpeed > 0) {
            // Check if we have 8 legs defined, otherwise fall back to 4
            if (parts.legL1) {
                // 8-Legged Wave Animation
                // Alternating tripods is common, or waves. 
                // Group A: L1, R2, L3, R4
                // Group B: R1, L2, R3, L4
                const groupA = Math.sin(time);
                const groupB = Math.sin(time + Math.PI); // Opposite phase

                const lift = 0.5; // Leg lift height

                parts.legL1.rotation.x = groupA * lift;
                parts.legR2.rotation.x = groupA * lift;
                parts.legL3.rotation.x = groupA * lift;
                parts.legR4.rotation.x = groupA * lift;

                parts.legR1.rotation.x = groupB * lift;
                parts.legL2.rotation.x = groupB * lift;
                parts.legR3.rotation.x = groupB * lift;
                parts.legL4.rotation.x = groupB * lift;

            } else {
                // Fallback 4-leg animation (if using quadruped model)
                const legSwing = Math.sin(time) * 0.7;
                if(parts.legFR) parts.legFR.rotation.x = legSwing;
                if(parts.legBL) parts.legBL.rotation.x = legSwing;
                if(parts.legFL) parts.legFL.rotation.x = -legSwing;
                if(parts.legBR) parts.legBR.rotation.x = -legSwing;
            }

            // Thorax bounce
            if(parts.body) parts.body.position.y = 0.5 + Math.abs(Math.cos(time * 2)) * 0.05;

        } else {
            // Idle breathing (slow pulsing of abdomen)
            const breath = Math.sin(this.stateTimer * 2.0) * 0.02;
            if(parts.abdomen) {
                parts.abdomen.scale.set(1 + breath, 1 + breath, 1 + breath);
            } else if (parts.body) {
                parts.body.scale.set(1 + breath, 1 + breath, 1 + breath);
            }
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        const percent = Math.max(0, this.health / this.maxHealth);
        this.healthBarFill.scale.x = percent;
        if (percent < 0.3) (this.healthBarFill.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
        
        // Flash body red
        const mainPart = this.model.parts.body || this.model.parts.abdomen;
        if(mainPart && mainPart.material) {
            mainPart.material.emissive.setHex(0xff0000);
            mainPart.material.emissiveIntensity = 0.5;
        }

        if (this.health <= 0) {
            this.die();
        } else {
            setTimeout(() => { 
                if (!this.isDead && mainPart && mainPart.material) { 
                    mainPart.material.emissiveIntensity = 0; 
                } 
            }, 100);
        }
    }

    private die() {
        this.isDead = true;
        this.state = SpiderState.DEAD;
        this.healthBarGroup.visible = false;
        
        const mainPart = this.model.parts.body || this.model.parts.abdomen;
        if (mainPart && mainPart.material) {
            mainPart.material.emissiveIntensity = 0;
        }
        
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'silk';
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = true;
            child.userData.material = 'silk';
        });
        
        // Death curl: legs curl in
        this.model.group.rotation.x = Math.PI; // Flip on back
        this.model.group.position.y = 0.5;
        this.hitbox.position.y = -0.5;
        
        // Optional: Curl legs inward if possible
        if (this.model.parts.legL1) {
            for (let i = 1; i <= 4; i++) {
                if(this.model.parts[`legL${i}`]) this.model.parts[`legL${i}`].rotation.x = 2;
                if(this.model.parts[`legR${i}`]) this.model.parts[`legR${i}`].rotation.x = 2;
            }
        }
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; });
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0x555555); // Dried husk gray
            }
        });
    }
}