import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum PigState {
    IDLE,
    PATROL,
    FLEE,
    DEAD
}

export class Pig {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: PigState = PigState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    
    maxHealth: number = 30; // Tougher than sheep
    health: number = 30;
    
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    private moveSpeedVal: number = 1.8; // Trot speed

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        // Pink color
        const pigData = ObjectFactory.createPigModel ? ObjectFactory.createPigModel(0xFFC0CB) : ObjectFactory.createBearModel(0xFFC0CB);
        this.group = new THREE.Group();
        this.group.add(pigData.group);
        this.model = pigData;
        
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);

        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        // Body: Stout cylinder
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.5), hitboxMat);
        bodyHitbox.position.y = 0.6;
        bodyHitbox.userData = { type: 'creature' };
        this.hitbox.add(bodyHitbox);

        // Head: Lower, attached to front
        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), hitboxMat);
        headHitbox.position.set(0, 0.8, 1.0);
        headHitbox.userData = { type: 'creature' };
        this.hitbox.add(headHitbox);

        // Snout: Distinct hitbox for headshots/visual
        const snoutHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), hitboxMat);
        snoutHitbox.position.set(0, 0.7, 1.4); 
        snoutHitbox.userData = { type: 'creature' };
        this.hitbox.add(snoutHitbox);

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 1.5, 0); 
        
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

        if (this.state !== PigState.PATROL) {
            this.state = PigState.PATROL;
            this.findPatrolPoint();
        }

        let currentSpeed = 0;
        if (this.state === PigState.PATROL) {
            currentSpeed = this.moveSpeedVal;
            
            // Pigs root around often (stop moving)
            if (this.stateTimer > 4.0 && this.stateTimer < 9.0) {
                currentSpeed = 0; 
            }
            
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 15.0) {
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
                this.rotationY += diff * 3.0 * dt; 
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
        const range = 20;
        this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range);
        if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0);
    }

    private animate(dt: number, currentSpeed: number) {
        const parts = this.model.parts;
        const time = this.walkTime * 2.5; // Quick trot steps
        
        if (currentSpeed > 0) {
            // Trot cycle
            const legSwing = Math.sin(time) * 0.6;
            if(parts.legFR) parts.legFR.rotation.x = legSwing;
            if(parts.legBL) parts.legBL.rotation.x = legSwing;
            if(parts.legFL) parts.legFL.rotation.x = -legSwing;
            if(parts.legBR) parts.legBR.rotation.x = -legSwing;
            
            // Head steady while trotting
            if(parts.head) parts.head.rotation.x = 0;
            
            // Waddle
            if(parts.body) parts.body.rotation.z = Math.sin(time) * 0.05;
        } else {
            // Rooting Animation (digging nose in ground)
            const rootCycle = Math.sin(this.stateTimer * 5.0); // Fast sniffing motion
            
            if(parts.head) {
                 // Head down to ground
                if (this.stateTimer > 4.5 && this.stateTimer < 8.5) {
                    parts.head.rotation.x = 0.6 + (rootCycle * 0.1); // Bob head while down
                } else {
                    parts.head.rotation.x = 0; // Head Up
                }
            }
            
            // Heavy Breathing
            const breath = Math.sin(this.stateTimer * 3.0) * 0.03;
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
        this.state = PigState.DEAD;
        this.healthBarGroup.visible = false;
        if (this.model.parts.body.material) {
            this.model.parts.body.material.emissiveIntensity = 0;
        }
        
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'pork'; // Changed resource
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = true;
            child.userData.material = 'pork';
        });
        
        this.model.group.rotation.z = Math.PI / 2;
        this.model.group.position.y = 0.4;
        this.hitbox.position.y = -0.5;
        this.hitbox.rotation.z = -Math.PI / 2; 
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; });
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0x8B4513); // Dark brown/bloody look
            }
        });
    }
}