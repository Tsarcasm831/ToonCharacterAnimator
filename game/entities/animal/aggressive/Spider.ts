
import * as THREE from 'three';
import { Environment } from '../../../Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum SpiderState { IDLE, PATROL, CHASE, ATTACK, DEAD }

export class Spider {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: SpiderState = SpiderState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null; isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 30; health: number = 30; hitbox: THREE.Group; private healthBarGroup: THREE.Group; private healthBarFill: THREE.Mesh; private walkTime: number = 0; private attackCooldown: number = 0; private moveSpeedVal: number = 2.0; private readonly collisionSize = new THREE.Vector3(1.2, 0.9, 1.4); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; this.position.copy(initialPos); this.lastStuckPos.copy(this.position);
        const spiderData = ObjectFactory.createSpiderModel ? ObjectFactory.createSpiderModel(0x1a1a1a) : ObjectFactory.createBearModel(0x1a1a1a); this.group = new THREE.Group(); this.group.add(spiderData.group); this.model = spiderData;
        
        this.hitbox = new THREE.Group(); 
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox); 
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        
        // Spider segments
        const thoraxBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), hitboxMat); 
        thoraxBox.position.set(0, 0.35, 0.2); 
        thoraxBox.userData = { type: 'creature' }; 
        this.hitbox.add(thoraxBox);
        
        const abdomenBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.0), hitboxMat); 
        abdomenBox.position.set(0, 0.5, -0.5); 
        abdomenBox.userData = { type: 'creature' }; 
        this.hitbox.add(abdomenBox);

        const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), hitboxMat);
        headBox.position.set(0, 0.4, 0.45);
        headBox.userData = { type: 'creature' };
        this.hitbox.add(headBox);

        this.healthBarGroup = new THREE.Group(); this.healthBarGroup.position.set(0, 1.8, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.15), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })); this.healthBarGroup.add(bg); const fgGeo = new THREE.PlaneGeometry(0.96, 0.11); fgGeo.translate(0.48, 0, 0); this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })); this.healthBarFill.position.set(-0.48, 0, 0.01); this.healthBarGroup.add(this.healthBarFill); this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt; if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.state !== SpiderState.PATROL) { this.state = SpiderState.PATROL; this.findPatrolPoint(); }
        let currentSpeed = (this.stateTimer > 4.0 && this.stateTimer < 6.0) ? 0 : this.moveSpeedVal;
        if (currentSpeed > 0) {
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) { this.findPatrolPoint(); this.stateTimer = 0; }
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) { this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 5.0 * dt; const step = currentSpeed * dt; const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step)); if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) { this.position.x = nextPos.x; this.position.z = nextPos.z; } }
            this.walkTime += dt * currentSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() { const range = 15; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }
    private animate(dt: number, moveSpeed: number) { const parts = this.model.parts; const time = this.walkTime * 4.0; if (moveSpeed > 0) { if (parts.legL1) { const groupA = Math.sin(time), groupB = Math.sin(time + Math.PI), lift = 0.5; parts.legL1.rotation.x = groupA * lift; parts.legR2.rotation.x = groupA * lift; parts.legL3.rotation.x = groupA * lift; parts.legR4.rotation.x = groupA * lift; parts.legR1.rotation.x = groupB * lift; parts.legL2.rotation.x = groupB * lift; parts.legR3.rotation.x = groupB * lift; parts.legL4.rotation.x = groupB * lift; } if(parts.body) parts.body.position.y = 0.5 + Math.abs(Math.cos(time * 2)) * 0.05; } else { const breath = Math.sin(this.stateTimer * 2.0) * 0.02; if(parts.abdomen) parts.abdomen.scale.set(1 + breath, 1 + breath, 1 + breath); } }
    takeDamage(amount: number) { if (this.isDead) return; this.health -= amount; this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth); const mainPart = this.model.parts.body || this.model.parts.abdomen; if(mainPart && mainPart.material) { mainPart.material.emissive.setHex(0xff0000); mainPart.material.emissiveIntensity = 0.5; } if (this.health <= 0) this.die(); else setTimeout(() => { if (!this.isDead && mainPart && mainPart.material) mainPart.material.emissiveIntensity = 0; }, 100); }
    private die() { this.isDead = true; this.state = SpiderState.DEAD; this.healthBarGroup.visible = false; this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'silk'; this.model.group.rotation.x = Math.PI; this.model.group.position.y = 0.5; this.hitbox.position.y = -0.5; }
    markAsSkinned() { this.isSkinned = true; this.hitbox.userData.isSkinnable = false; this.hitbox.userData.type = 'soft'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; child.userData.type = 'soft'; }); this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.setHex(0x000000); if (obj.material.emissive) obj.material.emissive.setHex(0x000000); } }); }
}
