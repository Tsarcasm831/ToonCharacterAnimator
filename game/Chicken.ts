import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum ChickenState {
    IDLE,
    PATROL,
    FLEE,
    DEAD
}

export class Chicken {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: ChickenState = ChickenState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    
    maxHealth: number = 10; // Very fragile
    health: number = 10;
    
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    private moveSpeedVal: number = 2.0; // Surprisingly quick

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        // White color
        const chickenData = ObjectFactory.createChickenModel ? ObjectFactory.createChickenModel(0xFFFFFF) : ObjectFactory.createBearModel(0xFFFFFF);
        this.group = new THREE.Group();
        this.group.add(chickenData.group);
        this.model = chickenData;
        
        // Scale down if using a generic model, chickens are small
        if (!ObjectFactory.createChickenModel) {
            chickenData.group.scale.set(0.3, 0.3, 0.3);
        }

        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);

        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        // Body: Small and round
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), hitboxMat);
        bodyHitbox.position.y = 0.4;
        bodyHitbox.userData = { type: 'creature' };
        this.hitbox.add(bodyHitbox);

        // Head: Tiny, on top/front
        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), hitboxMat);
        headHitbox.position.set(0, 0.7, 0.4);
        headHitbox.userData = { type: 'creature' };
        this.hitbox.add(headHitbox);

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 1.0, 0); // Low bar
        
        // Smaller bar for smaller creature
        const bgGeo = new THREE.PlaneGeometry(0.6, 0.1);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.healthBarGroup.add(bg);

        const fgGeo = new THREE.PlaneGeometry(0.56, 0.06);
        fgGeo.translate(0.28, 0, 0); 
        const fgMat = new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide });
        this.healthBarFill = new THREE.Mesh(fgGeo, fgMat);
        this.healthBarFill.position.set(-0.28, 0, 0.01); 
        this.healthBarGroup.add(this.healthBarFill);

        this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[]) {
        if (this.isDead) return;

        this.stateTimer += dt;

        if (this.state !== ChickenState.PATROL) {
            this.state = ChickenState.PATROL;
            this.findPatrolPoint();
        }

        let currentSpeed = 0;
        if (this.state === ChickenState.PATROL) {
            // Jerky movement: Move for 2s, Stop to peck for 3s
            const cycle = this.stateTimer % 5.0;
            
            if (cycle < 2.0) {
                currentSpeed = this.moveSpeedVal;
            } else {
                currentSpeed = 0; // Pecking time
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
                this.rotationY += diff * 10.0 * dt; // Turns instantly (twitchy)
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
        const range = 8; // Small area
        this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range);
        if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0);
    }

    private animate(dt: number, currentSpeed: number) {
        const parts = this.model.parts;
        const time = this.walkTime * 5.0; // Fast legs
        
        if (currentSpeed > 0) {
            // Fast walk
            const legSwing = Math.sin(time) * 0.4;
            if(parts.legFR) parts.legFR.rotation.x = legSwing;
            if(parts.legBL) parts.legBL.rotation.x = legSwing;
            if(parts.legFL) parts.legFL.rotation.x = -legSwing;
            if(parts.legBR) parts.legBR.rotation.x = -legSwing;
            
            // Classic Chicken Head Bob (Forward/Back)
            // Head snaps forward and holds, then resets
            const bob = Math.sin(time);
            if(parts.head) {
                parts.head.position.z = 0.4 + (bob * 0.1); 
                parts.head.rotation.x = 0;
            }
            
            // Body twitch
            if(parts.body) parts.body.rotation.z = Math.sin(time * 0.5) * 0.05;

        } else {
            // PECKING Animation
            const peckCycle = Math.sin(this.stateTimer * 10.0); // Fast pecks
            
            if(parts.head) {
                // If in pecking phase (middle of the stop cycle)
                if (this.stateTimer % 5.0 > 2.5 && this.stateTimer % 5.0 < 4.5) {
                    // Snap head down to ground
                    parts.head.rotation.x = 0.8 + Math.abs(peckCycle) * 0.3;
                    parts.head.position.y = 0.5 - Math.abs(peckCycle) * 0.1;
                } else {
                    // Look around nervously
                    parts.head.rotation.x = 0;
                    parts.head.position.y = 0.7;
                    // Twitch head occasionally
                    if (Math.random() < 0.05) parts.head.rotation.y = (Math.random() - 0.5);
                }
            }
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
            // Panic!
            this.moveSpeedVal = 4.0; // Run faster when hit
            setTimeout(() => { 
                if (!this.isDead && this.model.parts.body.material) { 
                    this.model.parts.body.material.emissiveIntensity = 0; 
                    this.moveSpeedVal = 2.0; // Reset speed
                } 
            }, 500);
        }
    }

    private die() {
        this.isDead = true;
        this.state = ChickenState.DEAD;
        this.healthBarGroup.visible = false;
        if (this.model.parts.body.material) {
            this.model.parts.body.material.emissiveIntensity = 0;
        }
        
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'chicken_meat';
        this.hitbox.children.forEach(child => {
            child.userData.isSkinnable = true;
            child.userData.material = 'chicken_meat';
        });
        
        // Feet up
        this.model.group.rotation.z = Math.PI; 
        this.model.group.position.y = 0.3;
        this.hitbox.position.y = -0.3;
        this.hitbox.rotation.z = -Math.PI; 
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; });
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0xffaaaa); // Raw meat pink
            }
        });
    }
}