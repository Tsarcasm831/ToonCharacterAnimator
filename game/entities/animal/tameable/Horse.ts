
import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { AIUtils } from '../../../core/AIUtils';

export enum HorseState { IDLE, PATROL, FLEE, DEAD }

export class Horse {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: HorseState = HorseState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 40; health: number = 40; hitbox: THREE.Group; private healthBarGroup: THREE.Group; private healthBarFill: THREE.Mesh; private walkTime: number = 0; private moveSpeedVal: number = 2.8; private readonly collisionSize = new THREE.Vector3(1.0, 1.2, 2.4); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; this.position.copy(initialPos); this.lastStuckPos.copy(this.position);
        const horseData = ObjectFactory.createHorseModel ? ObjectFactory.createHorseModel(0x8B4513) : ObjectFactory.createBearModel(0x8B4513); this.group = new THREE.Group(); this.group.add(horseData.group); this.model = horseData;
        this.hitbox = this.model.group;
        this.hitbox.userData = { type: 'creature', parent: this };
        this.hitbox.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.userData = { ...child.userData, type: 'creature', parent: this };
            }
        });
        this.healthBarGroup = new THREE.Group(); this.healthBarGroup.position.set(0, 3.0, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.18), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })); this.healthBarGroup.add(bg); const fgGeo = new THREE.PlaneGeometry(1.16, 0.14); fgGeo.translate(0.58, 0, 0); this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })); this.healthBarFill.position.set(-0.58, 0, 0.01); this.healthBarGroup.add(this.healthBarFill); this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt;
        if (this.state !== HorseState.PATROL) { this.state = HorseState.PATROL; this.findPatrolPoint(); }
        let currentSpeed = this.moveSpeedVal;
        if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) { this.findPatrolPoint(); this.stateTimer = 0; }
        if (currentSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, 3.0);
                const avoidanceRot = AIUtils.getAdvancedAvoidanceSteering(this.position, this.rotationY, this.collisionSize, environment.obstacles);
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, 6.0);
                
                const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, currentSpeed, dt, this.collisionSize, environment.obstacles);
                this.position.x = nextPos.x;
                this.position.z = nextPos.z;
            }
            this.walkTime += dt * currentSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z) + 0.12;
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() { const range = 30; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }
    private animate(dt: number, currentSpeed: number) { const parts = this.model.parts; if (currentSpeed > 0) { const legSwing = Math.sin(this.walkTime * 1.2 * 2.0) * 0.5; if(parts.legFR) parts.legFR.rotation.x = legSwing; if(parts.legBL) parts.legBL.rotation.x = legSwing; if(parts.legFL) parts.legFL.rotation.x = -legSwing; if(parts.legBR) parts.legBR.rotation.x = -legSwing; if(parts.body) parts.body.position.y = 1.1 + Math.abs(Math.cos(this.walkTime * 1.2 * 2.0)) * 0.1; if(parts.tail) parts.tail.rotation.z = Math.sin(this.walkTime * 1.2 * 2.0) * 0.2; } else { const breath = Math.sin(this.stateTimer * 1.0) * 0.02; if(parts.body) parts.body.scale.set(1, 1 + breath, 1); if(parts.head && Math.random() < 0.01) parts.head.rotation.x = (Math.random() * 0.2) - 0.1; } }
    takeDamage(amount: number) { if (this.isDead) return; this.health -= amount; this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth); if(this.model.parts.body.material) { this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; } if (this.health <= 0) this.die(); else setTimeout(() => { if (!this.isDead && this.model.parts.body.material) this.model.parts.body.material.emissiveIntensity = 0; }, 100); }
    private die() { 
        this.isDead = true; 
        this.state = HorseState.DEAD; 
        this.healthBarGroup.visible = false; 
        this.hitbox.userData.isSkinnable = true; 
        this.hitbox.userData.material = 'leather'; 
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = true;
            child.userData.material = 'leather';
        });
        this.model.group.rotation.z = Math.PI / 2; 
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
                obj.material.color.multiplyScalar(0.3); 
            } 
        }); 
    }
}
