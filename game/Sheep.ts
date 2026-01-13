
import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum SheepState {
    IDLE,
    PATROL,
    FLEE,
    DEAD
}

export class Sheep {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: SheepState = SheepState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    
    maxHealth: number = 25;
    health: number = 25;
    
    hitbox: THREE.Group;
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    
    private walkTime: number = 0;
    private moveSpeedVal: number = 1.0; 
    private readonly collisionSize = new THREE.Vector3(1.1, 1.1, 1.6);

    // Stuck Detection
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastStuckPos.copy(this.position);
        const sheepData = ObjectFactory.createSheepModel ? ObjectFactory.createSheepModel(0xFFFDD0) : ObjectFactory.createBearModel(0xFFFDD0);
        this.group = new THREE.Group();
        this.group.add(sheepData.group);
        this.model = sheepData;
        
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });

        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.6), hitboxMat);
        bodyHitbox.position.y = 0.8;
        bodyHitbox.userData = { type: 'creature' };
        this.hitbox.add(bodyHitbox);

        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.7), hitboxMat);
        headHitbox.position.set(0, 1.1, 1.0);
        headHitbox.userData = { type: 'creature' };
        this.hitbox.add(headHitbox);

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
        if (this.state !== SheepState.PATROL) { this.state = SheepState.PATROL; this.findPatrolPoint(); }

        let currentSpeed = (this.stateTimer > 5.0 && this.stateTimer < 10.0) ? 0 : this.moveSpeedVal;
        if (this.state === SheepState.PATROL && currentSpeed > 0) {
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
                this.rotationY += diff * 2.0 * dt; 
                const step = currentSpeed * dt;
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));
                if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) {
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
            }
            this.walkTime += dt * currentSpeed;

            // Stuck detection
            const distMoved = this.position.distanceTo(this.lastStuckPos);
            if (distMoved < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) {
                    this.findPatrolPoint();
                    this.stuckTimer = 0;
                    this.stateTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        } else {
            this.stuckTimer = 0;
            this.lastStuckPos.copy(this.position);
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

    private animate(dt: number, currentSpeed: number) {
        const parts = this.model.parts;
        if (currentSpeed > 0) {
            const legSwing = Math.sin(this.walkTime * 1.5) * 0.5;
            if(parts.legFR) parts.legFR.rotation.x = legSwing; if(parts.legBL) parts.legBL.rotation.x = legSwing;
            if(parts.legFL) parts.legFL.rotation.x = -legSwing; if(parts.legBR) parts.legBR.rotation.x = -legSwing;
            if(parts.head) parts.head.rotation.x = 0;
            if(parts.body) parts.body.position.y = 0.8 + Math.abs(Math.cos(this.walkTime * 1.5)) * 0.05;
        } else {
            if(parts.head) parts.head.rotation.x = (Math.sin(this.stateTimer * 0.5) > 0.5) ? 0.5 : 0;
            const breath = Math.sin(this.stateTimer * 2.0) * 0.02;
            if(parts.body) parts.body.scale.set(1 + breath, 1 + breath, 1 + breath);
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);
        if(this.model.parts.body.material) { this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; }
        if (this.health <= 0) this.die();
        else { setTimeout(() => { if (!this.isDead && this.model.parts.body.material) { this.model.parts.body.material.emissiveIntensity = 0; } }, 100); }
    }

    private die() {
        this.isDead = true; this.state = SheepState.DEAD; this.healthBarGroup.visible = false;
        this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'wool';
        this.model.group.rotation.z = Math.PI / 2; this.model.group.position.y = 0.4; this.hitbox.position.y = -0.5;
    }

    markAsSkinned() {
        this.isSkinned = true; this.hitbox.userData.isSkinnable = false;
        this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.setHex(0xffc0cb); } });
    }
}
