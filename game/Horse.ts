import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum HorseState {
    IDLE,
    PATROL,
    FLEE, // Horses typically flee rather than chase, though logic below keeps it passive
    DEAD
}

export class Horse {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: HorseState = HorseState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    
    maxHealth: number = 40; // Slightly less than a bear
    health: number = 40;
    
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    
    // Horses are faster than bears
    private moveSpeedVal: number = 2.8; 

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        // Assumes you add createHorseModel to your factory, or use a generic quadruped with brown color
        const horseData = ObjectFactory.createHorseModel ? ObjectFactory.createHorseModel(0x8B4513) : ObjectFactory.createBearModel(0x8B4513); 
        this.group = new THREE.Group();
        this.group.add(horseData.group);
        this.model = horseData;
        
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);

        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        // Body: Longer and slightly thinner than a bear
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 2.4), hitboxMat);
        bodyHitbox.position.y = 1.1;
        bodyHitbox.userData = { type: 'creature' };
        this.hitbox.add(bodyHitbox);

        // Neck: Upright
        const neckHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.6), hitboxMat);
        neckHitbox.position.set(0, 1.8, 1.4); 
        neckHitbox.rotation.x = -Math.PI / 8; // Slight angle for neck
        neckHitbox.userData = { type: 'creature' };
        this.hitbox.add(neckHitbox);

        // Head: At end of neck
        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.8), hitboxMat);
        headHitbox.position.set(0, 2.3, 1.7);
        headHitbox.userData = { type: 'creature' };
        this.hitbox.add(headHitbox);

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 3.0, 0); // Higher up due to horse height
        
        const bgGeo = new THREE.PlaneGeometry(1.2, 0.18);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.healthBarGroup.add(bg);

        const fgGeo = new THREE.PlaneGeometry(1.16, 0.14);
        fgGeo.translate(0.58, 0, 0); 
        const fgMat = new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide });
        this.healthBarFill = new THREE.Mesh(fgGeo, fgMat);
        this.healthBarFill.position.set(-0.58, 0, 0.01); 
        this.healthBarGroup.add(this.healthBarFill);

        this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[]) {
        if (this.isDead) return;

        this.stateTimer += dt;

        // Passive behavior: Always return to patrol
        if (this.state !== HorseState.PATROL) {
            this.state = HorseState.PATROL;
            this.findPatrolPoint();
        }

        let currentSpeed = 0;
        if (this.state === HorseState.PATROL) {
            currentSpeed = this.moveSpeedVal;
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) { // Changes direction faster than bear
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
        const range = 30; // Horses roam further
        this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range);
        if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0);
    }

    private animate(dt: number, currentSpeed: number) {
        const parts = this.model.parts;
        // Faster animation frequency for trotting
        const time = this.walkTime * 1.2; 
        
        if (currentSpeed > 0) {
            // Trot animation (Diagonal pairs)
            const legSwing = Math.sin(time * 2.0) * 0.5;
            if(parts.legFR) parts.legFR.rotation.x = legSwing;
            if(parts.legBL) parts.legBL.rotation.x = legSwing;
            if(parts.legFL) parts.legFL.rotation.x = -legSwing;
            if(parts.legBR) parts.legBR.rotation.x = -legSwing;
            
            // Horse bobbing is more subtle but faster
            if(parts.body) parts.body.position.y = 1.1 + Math.abs(Math.cos(time * 2.0)) * 0.1;
            
            // Tail sway
            if(parts.tail) parts.tail.rotation.z = Math.sin(time * 2.0) * 0.2;
        } else {
            // Idle breathing
            const breath = Math.sin(this.stateTimer * 1.0) * 0.02;
            if(parts.body) parts.body.scale.set(1, 1 + breath, 1);
            // Occasional idle head bob
            if(parts.head && Math.random() < 0.01) parts.head.rotation.x = (Math.random() * 0.2) - 0.1;
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
            // Passive logic: Horse just takes it (or you could add this.state = HorseState.FLEE here later)
        }
    }

    private die() {
        this.isDead = true;
        this.state = HorseState.DEAD;
        this.healthBarGroup.visible = false;
        if (this.model.parts.body.material) {
            this.model.parts.body.material.emissiveIntensity = 0;
        }
        
        // Setup for skinning/looting
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'leather'; // Changed from bear_fur
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = true;
            child.userData.material = 'leather';
        });
        
        this.model.group.rotation.z = Math.PI / 2;
        this.model.group.position.y = 0.5; // Slightly higher body thickness
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
                obj.material.color.multiplyScalar(0.3); // Darken carcass
            }
        });
    }
}