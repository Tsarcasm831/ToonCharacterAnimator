import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum DeerState {
    IDLE,
    PATROL,
    FLEE,
    DEAD
}

export class Deer {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: DeerState = DeerState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    
    maxHealth: number = 35; // Moderate
    health: number = 35;
    
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    private moveSpeedVal: number = 2.2; // Fast walking speed
    private isFleeing: boolean = false;

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        // Light Brown / Tan color
        const deerData = ObjectFactory.createDeerModel ? ObjectFactory.createDeerModel(0xC19A6B) : ObjectFactory.createBearModel(0xC19A6B);
        this.group = new THREE.Group();
        this.group.add(deerData.group);
        this.model = deerData;
        
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);

        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        // Body: Slender and tall
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 1.8), hitboxMat);
        bodyHitbox.position.y = 1.2;
        bodyHitbox.userData = { type: 'creature' };
        this.hitbox.add(bodyHitbox);

        // Neck: Long, angled up
        const neckHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.5), hitboxMat);
        neckHitbox.position.set(0, 1.9, 1.2);
        neckHitbox.rotation.x = -Math.PI / 6;
        neckHitbox.userData = { type: 'creature' };
        this.hitbox.add(neckHitbox);

        // Head
        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.8), hitboxMat);
        headHitbox.position.set(0, 2.5, 1.5);
        headHitbox.userData = { type: 'creature' };
        this.hitbox.add(headHitbox);

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 3.2, 0); // High up
        
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

        // Flee logic decay
        if (this.isFleeing && this.stateTimer > 5.0) {
            this.isFleeing = false;
            this.moveSpeedVal = 2.2; // Return to normal speed
        }

        if (this.state !== DeerState.PATROL) {
            this.state = DeerState.PATROL;
            this.findPatrolPoint();
        }

        let currentSpeed = 0;
        if (this.state === DeerState.PATROL) {
            currentSpeed = this.moveSpeedVal;
            
            if (this.isFleeing) {
                currentSpeed = 5.0; // Sprint!
            } else {
                // Skittish Behavior: Pause frequently to "listen"
                // Cycle: Walk 3s, Pause 2s
                const cycle = this.stateTimer % 5.0;
                if (cycle > 3.0) {
                    currentSpeed = 0; 
                }
            }

            if (this.position.distanceTo(this.targetPos) < 1.0 || (this.stateTimer > 10.0 && !this.isFleeing)) {
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
                
                // Turn faster if fleeing
                const turnSpeed = this.isFleeing ? 8.0 : 3.0;
                this.rotationY += diff * turnSpeed * dt; 
                
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
        // If fleeing, run further
        const range = this.isFleeing ? 40 : 25;
        this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range);
        if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0);
    }

    private animate(dt: number, currentSpeed: number) {
        const parts = this.model.parts;
        // Bounding run if fast, elegant trot if slow
        const time = this.walkTime * (this.isFleeing ? 2.0 : 1.2); 
        
        if (currentSpeed > 0) {
            // Legs
            const legSwing = Math.sin(time) * (this.isFleeing ? 1.0 : 0.6);
            if(parts.legFR) parts.legFR.rotation.x = legSwing;
            if(parts.legBL) parts.legBL.rotation.x = legSwing;
            if(parts.legFL) parts.legFL.rotation.x = -legSwing;
            if(parts.legBR) parts.legBR.rotation.x = -legSwing;
            
            // Alert Head: Upright while moving
            if(parts.head) {
                parts.head.rotation.x = -0.2; // Chin up
            }
            
            // Bounding body
            if(parts.body) parts.body.position.y = 1.2 + Math.abs(Math.cos(time)) * 0.15;
            
            // Tail flicker
            if(parts.tail) parts.tail.rotation.x = Math.PI/4 + Math.sin(time * 5) * 0.2; // Tail up when running (white flag)

        } else {
            // IDLE: Alternate between grazing and scanning
            // Use stateTimer to decide
            const scanPhase = (this.stateTimer % 5.0) > 3.0; // The pause phase
            
            if (parts.head) {
                if (scanPhase) {
                    // Scanning: Head high, look around
                    parts.head.rotation.x = -0.3; // Head high
                    parts.head.rotation.y = Math.sin(this.stateTimer * 2.0) * 0.3; // Look left/right
                } else {
                    // Grazing: Head down
                    parts.head.rotation.x = 0.8; 
                    parts.head.rotation.y = 0;
                }
            }
            
            // Breathing
            const breath = Math.sin(this.stateTimer * 1.5) * 0.02;
            if(parts.body) parts.body.scale.set(1, 1 + breath, 1);
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        
        // Trigger Flee
        this.isFleeing = true;
        this.stateTimer = 0; // Reset timer to allow full flee duration
        this.findPatrolPoint(); // Pick a new spot immediately

        const percent = Math.max(0, this.health / this.maxHealth);
        this.healthBarFill.scale.x = percent;
        if (percent < 0.3) (this.healthBarFill.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
        
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
        this.state = DeerState.DEAD;
        this.healthBarGroup.visible = false;
        if (this.model.parts.body.material) {
            this.model.parts.body.material.emissiveIntensity = 0;
        }
        
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'venison';
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = true;
            child.userData.material = 'venison';
        });
        
        this.model.group.rotation.z = Math.PI / 2;
        this.model.group.position.y = 0.5;
        this.hitbox.position.y = -0.6;
        this.hitbox.rotation.z = -Math.PI / 2; 
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; });
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0x5A2D0C); // Dark meat color
            }
        });
    }
}