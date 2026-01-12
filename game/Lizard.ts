import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum LizardState {
    IDLE,
    PATROL,
    FLEE,
    DEAD
}

export class Lizard {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: LizardState = LizardState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    
    maxHealth: number = 20; // Fragile
    health: number = 20;
    
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    
    // Lizards are fast scurriers
    private moveSpeedVal: number = 3.5; 

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        // Green/Olive color
        const lizardData = ObjectFactory.createLizardModel ? ObjectFactory.createLizardModel(0x6B8E23) : ObjectFactory.createBearModel(0x6B8E23);
        this.group = new THREE.Group();
        this.group.add(lizardData.group);
        this.model = lizardData;
        
        // Scale the model down if using a generic factory model
        if (!ObjectFactory.createLizardModel) {
            lizardData.group.scale.set(0.4, 0.4, 0.4);
        }

        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);

        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        // Body: Long, flat, low to ground
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 1.2), hitboxMat);
        bodyHitbox.position.y = 0.3;
        bodyHitbox.userData = { type: 'creature' };
        this.hitbox.add(bodyHitbox);

        // Head: Small, front
        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), hitboxMat);
        headHitbox.position.set(0, 0.4, 0.8);
        headHitbox.userData = { type: 'creature' };
        this.hitbox.add(headHitbox);

        // Tail: Long tail hitbox
        const tailHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.8), hitboxMat);
        tailHitbox.position.set(0, 0.2, -0.8);
        tailHitbox.userData = { type: 'creature' };
        this.hitbox.add(tailHitbox);

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 1.2, 0); // Much lower health bar
        
        const bgGeo = new THREE.PlaneGeometry(0.8, 0.12); // Smaller bar
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.healthBarGroup.add(bg);

        const fgGeo = new THREE.PlaneGeometry(0.76, 0.08);
        fgGeo.translate(0.38, 0, 0); 
        const fgMat = new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide });
        this.healthBarFill = new THREE.Mesh(fgGeo, fgMat);
        this.healthBarFill.position.set(-0.38, 0, 0.01); 
        this.healthBarGroup.add(this.healthBarFill);

        this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[]) {
        if (this.isDead) return;

        this.stateTimer += dt;

        if (this.state !== LizardState.PATROL) {
            this.state = LizardState.PATROL;
            this.findPatrolPoint();
        }

        let currentSpeed = 0;
        if (this.state === LizardState.PATROL) {
            currentSpeed = this.moveSpeedVal;
            // Lizards stop and go frequently
            const moveDuration = 3.0;
            const pauseDuration = 2.0;
            const cycle = this.stateTimer % (moveDuration + pauseDuration);
            
            if (cycle > moveDuration) {
                currentSpeed = 0; // Pause
            }

            if (this.position.distanceTo(this.targetPos) < 0.5 || this.stateTimer > 10.0) {
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
                this.rotationY += diff * 8.0 * dt; // Turn very fast
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
        const range = 10; // Short range patrol
        this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range);
        if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0);
    }

    private animate(dt: number, currentSpeed: number) {
        const parts = this.model.parts;
        // High frequency animation (scurry)
        const time = this.walkTime * 3.0; 
        
        if (currentSpeed > 0) {
            const legSwing = Math.sin(time) * 0.8;
            if(parts.legFR) parts.legFR.rotation.x = legSwing;
            if(parts.legBL) parts.legBL.rotation.x = legSwing;
            if(parts.legFL) parts.legFL.rotation.x = -legSwing;
            if(parts.legBR) parts.legBR.rotation.x = -legSwing;
            
            // Sinuous body movement (side to side)
            if(parts.body) parts.body.rotation.y = Math.sin(time) * 0.1;
            
            // Fast tail wag
            if(parts.tail) parts.tail.rotation.y = -Math.sin(time) * 0.3;
        } else {
            // Very fast, shallow breathing (reptilian)
            const breath = Math.sin(this.stateTimer * 4.0) * 0.01;
            if(parts.body) parts.body.scale.set(1 + breath, 1 + breath, 1 + breath);
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
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
        this.state = LizardState.DEAD;
        this.healthBarGroup.visible = false;
        if (this.model.parts.body.material) {
            this.model.parts.body.material.emissiveIntensity = 0;
        }
        
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'scales';
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = true;
            child.userData.material = 'scales';
        });
        
        this.model.group.rotation.z = Math.PI; // Flip belly up
        this.model.group.position.y = 0.2; 
        this.hitbox.position.y = -0.5;
        this.hitbox.rotation.z = -Math.PI; 
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; });
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0x333333); // Turns grey/dried out
            }
        });
    }
}