
import * as THREE from 'three';
import { Environment } from '../../../Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum ChickenState { IDLE, PATROL, FLEE, DEAD }

export class Chicken {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: ChickenState = ChickenState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 10; health: number = 10; hitbox: THREE.Group; private healthBarGroup: THREE.Group; private healthBarFill: THREE.Mesh; private walkTime: number = 0; private moveSpeedVal: number = 2.0; private readonly collisionSize = new THREE.Vector3(0.5, 0.5, 0.6); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; this.position.copy(initialPos); this.lastStuckPos.copy(this.position);
        const chickenData = ObjectFactory.createChickenModel ? ObjectFactory.createChickenModel(0xFFFFFF) : ObjectFactory.createBearModel(0xFFFFFF); this.group = new THREE.Group(); this.group.add(chickenData.group); this.model = chickenData; if (!ObjectFactory.createChickenModel) chickenData.group.scale.set(0.3, 0.3, 0.3);
        
        this.hitbox = new THREE.Group(); 
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        
        // Compact Chicken Hull
        const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.4), hitboxMat); 
        bodyBox.position.y = 0.4; 
        bodyBox.userData = { type: 'creature' }; 
        this.hitbox.add(bodyBox);
        
        const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.18), hitboxMat); 
        headBox.position.set(0, 0.7, 0.15); 
        headBox.userData = { type: 'creature' }; 
        this.hitbox.add(headBox);

        this.healthBarGroup = new THREE.Group(); this.healthBarGroup.position.set(0, 1.0, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.1), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })); this.healthBarGroup.add(bg); const fgGeo = new THREE.PlaneGeometry(0.56, 0.06); fgGeo.translate(0.28, 0, 0); this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })); this.healthBarFill.position.set(-0.28, 0, 0.01); this.healthBarGroup.add(this.healthBarFill); this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt;
        if (this.state !== ChickenState.PATROL) { this.state = ChickenState.PATROL; this.findPatrolPoint(); }
        let currentSpeed = (this.stateTimer % 5.0 < 2.0) ? this.moveSpeedVal : 0;
        if (currentSpeed > 0) {
            if (this.position.distanceTo(this.targetPos) < 0.5 || this.stateTimer > 10.0) { this.findPatrolPoint(); this.stateTimer = 0; }
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) { this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 10.0 * dt; const step = currentSpeed * dt; const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step)); if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) { this.position.x = nextPos.x; this.position.z = nextPos.z; } }
            this.walkTime += dt * currentSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() { const range = 8; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }
    private animate(dt: number, currentSpeed: number) { const parts = this.model.parts; if (currentSpeed > 0) { const legSwing = Math.sin(this.walkTime * 5.0) * 0.4; if(parts.legFR) parts.legFR.rotation.x = legSwing; if(parts.legBL) parts.legBL.rotation.x = legSwing; if(parts.legFL) parts.legFL.rotation.x = -legSwing; if(parts.legBR) parts.legBR.rotation.x = -legSwing; if(parts.head) { parts.head.position.z = 0.4 + (Math.sin(this.walkTime * 5.0) * 0.1); parts.head.rotation.x = 0; } } else if(parts.head) { if (this.stateTimer % 5.0 > 2.5 && this.stateTimer % 5.0 < 4.5) { parts.head.rotation.x = 0.8 + Math.abs(Math.sin(this.stateTimer * 10.0)) * 0.3; parts.head.position.y = 0.5 - Math.abs(Math.sin(this.stateTimer * 10.0)) * 0.1; } else { parts.head.rotation.x = 0; parts.head.position.y = 0.7; if (Math.random() < 0.05) parts.head.rotation.y = (Math.random() - 0.5); } } }
    takeDamage(amount: number) { if (this.isDead) return; this.health -= amount; this.moveSpeedVal = 4.0; this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth); if(this.model.parts.body.material) { this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; } if (this.health <= 0) this.die(); else setTimeout(() => { if (!this.isDead && this.model.parts.body.material) { this.model.parts.body.material.emissiveIntensity = 0; this.moveSpeedVal = 2.0; } }, 500); }
    private die() { this.isDead = true; this.state = ChickenState.DEAD; this.healthBarGroup.visible = false; this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'chicken_meat'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = true; child.userData.material = 'chicken_meat'; }); this.model.group.rotation.z = Math.PI; this.model.group.position.y = 0.3; this.hitbox.position.y = -0.3; }
    markAsSkinned() { this.isSkinned = true; this.hitbox.userData.isSkinnable = false; this.hitbox.userData.type = 'soft'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; child.userData.type = 'soft'; }); this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.setHex(0x000000); if (obj.material.emissive) obj.material.emissive.setHex(0x000000); } }); }
}
