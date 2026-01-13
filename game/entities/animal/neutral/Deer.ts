
import * as THREE from 'three';
import { Environment } from '../../../Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum DeerState { IDLE, PATROL, FLEE, DEAD }

export class Deer {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: DeerState = DeerState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 35; health: number = 35; hitbox: THREE.Group; private healthBarGroup: THREE.Group; private healthBarFill: THREE.Mesh; private walkTime: number = 0; private moveSpeedVal: number = 2.2; private isFleeing: boolean = false; private readonly collisionSize = new THREE.Vector3(0.8, 1.8, 1.8); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; this.position.copy(initialPos); this.lastStuckPos.copy(this.position);
        const deerData = ObjectFactory.createDeerModel ? ObjectFactory.createDeerModel(0xC19A6B) : ObjectFactory.createBearModel(0xC19A6B); this.group = new THREE.Group(); this.group.add(deerData.group); this.model = deerData;
        
        this.hitbox = new THREE.Group(); 
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox); 
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        
        // Slender Deer Hull
        const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 1.4), hitboxMat); 
        bodyBox.position.y = 1.15; 
        bodyBox.userData = { type: 'creature' }; 
        this.hitbox.add(bodyBox);
        
        const neckBox = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.35), hitboxMat); 
        neckBox.position.set(0, 1.8, 0.8); 
        neckBox.rotation.x = -Math.PI / 4.5; 
        neckBox.userData = { type: 'creature' }; 
        this.hitbox.add(neckBox);
        
        const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.5), hitboxMat); 
        headBox.position.set(0, 2.3, 1.1); 
        headBox.userData = { type: 'creature' }; 
        this.hitbox.add(headBox);

        this.healthBarGroup = new THREE.Group(); this.healthBarGroup.position.set(0, 3.2, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.15), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })); this.healthBarGroup.add(bg); const fgGeo = new THREE.PlaneGeometry(0.96, 0.11); fgGeo.translate(0.48, 0, 0); this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })); this.healthBarFill.position.set(-0.48, 0, 0.01); this.healthBarGroup.add(this.healthBarFill); this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt;
        if (this.isFleeing && this.stateTimer > 5.0) { this.isFleeing = false; this.moveSpeedVal = 2.2; }
        if (this.state !== DeerState.PATROL) { this.state = DeerState.PATROL; this.findPatrolPoint(); }
        let currentSpeed = this.isFleeing ? 5.0 : ((this.stateTimer % 5.0 > 3.0) ? 0 : this.moveSpeedVal);
        if (this.state === DeerState.PATROL && currentSpeed > 0) { if (this.position.distanceTo(this.targetPos) < 1.0 || (this.stateTimer > 10.0 && !this.isFleeing)) { this.findPatrolPoint(); this.stateTimer = 0; } }

        if (currentSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * (this.isFleeing ? 8.0 : 3.0) * dt; 
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(currentSpeed * dt));
                if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) { this.position.x = nextPos.x; this.position.z = nextPos.z; }
            }
            this.walkTime += dt * currentSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; this.isFleeing = false; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() { const range = this.isFleeing ? 40 : 25; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }
    private animate(dt: number, currentSpeed: number) { const parts = this.model.parts; const time = this.walkTime * (this.isFleeing ? 2.0 : 1.2); if (currentSpeed > 0) { const legSwing = Math.sin(time) * (this.isFleeing ? 1.0 : 0.6); if(parts.legFR) parts.legFR.rotation.x = legSwing; if(parts.legBL) parts.legBL.rotation.x = legSwing; if(parts.legFL) parts.legFL.rotation.x = -legSwing; if(parts.legBR) parts.legBR.rotation.x = -legSwing; if(parts.head) parts.head.rotation.x = -0.2; if(parts.body) parts.body.position.y = 1.2 + Math.abs(Math.cos(time)) * 0.15; if(parts.tail) parts.tail.rotation.x = Math.PI/4 + Math.sin(time * 5) * 0.2; } else { if (parts.head) { if ((this.stateTimer % 5.0) > 3.0) { parts.head.rotation.x = -0.3; parts.head.rotation.y = Math.sin(this.stateTimer * 2.0) * 0.3; } else { parts.head.rotation.x = 0.8; parts.head.rotation.y = 0; } } const breath = Math.sin(this.stateTimer * 1.5) * 0.02; if(parts.body) parts.body.scale.set(1, 1 + breath, 1); } }
    takeDamage(amount: number) { if (this.isDead) return; this.health -= amount; this.isFleeing = true; this.stateTimer = 0; this.findPatrolPoint(); this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth); if(this.model.parts.body.material) { this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; } if (this.health <= 0) this.die(); else setTimeout(() => { if (!this.isDead && this.model.parts.body.material) this.model.parts.body.material.emissiveIntensity = 0; }, 100); }
    private die() { this.isDead = true; this.state = DeerState.DEAD; this.healthBarGroup.visible = false; this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'venison'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = true; child.userData.material = 'venison'; }); this.model.group.rotation.z = Math.PI / 2; this.model.group.position.y = 0.5; this.hitbox.position.y = -0.6; }
    markAsSkinned() { this.isSkinned = true; this.hitbox.userData.isSkinnable = false; this.hitbox.userData.type = 'soft'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; child.userData.type = 'soft'; }); this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.setHex(0x000000); if (obj.material.emissive) obj.material.emissive.setHex(0x000000); } }); }
}
