import * as THREE from 'three';
import { Environment } from '../../../Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum LizardState { IDLE, PATROL, FLEE, DEAD }

export class Lizard {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: LizardState = LizardState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 20; health: number = 20; hitbox: THREE.Group; 
    private healthBarGroup: THREE.Group; 
    private uiRefs: any;
    private walkTime: number = 0; private moveSpeedVal: number = 3.5; private readonly collisionSize = new THREE.Vector3(0.5, 0.4, 1.2); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; this.position.copy(initialPos); this.lastStuckPos.copy(this.position);
        const lizardData = ObjectFactory.createLizardModel ? ObjectFactory.createLizardModel(0x6B8E23) : ObjectFactory.createBearModel(0x6B8E23); this.group = new THREE.Group(); this.group.add(lizardData.group); this.model = lizardData; if (!ObjectFactory.createLizardModel) lizardData.group.scale.set(0.4, 0.4, 0.4);
        
        this.hitbox = new THREE.Group(); 
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox); 
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        
        // Elongated Lizard Hull
        const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.8), hitboxMat); 
        bodyBox.position.y = 0.15; 
        bodyBox.userData = { type: 'creature' }; 
        this.hitbox.add(bodyBox);
        
        const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.35), hitboxMat); 
        headBox.position.set(0, 0.22, 0.5); 
        headBox.userData = { type: 'creature' }; 
        this.hitbox.add(headBox);
        
        const tailBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.8), hitboxMat); 
        tailBox.position.set(0, 0.1, -0.6); 
        tailBox.userData = { type: 'creature' }; 
        this.hitbox.add(tailBox);

        // Enhanced Health Bar
        this.healthBarGroup = new THREE.Group(); 
        this.healthBarGroup.position.set(0, 1.2, 0); 
        this.uiRefs = PlayerUtils.createHealthBar(this.healthBarGroup, this.maxHealth, 0x6B8E23, 'Lizard');
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt;
        if (this.state !== LizardState.PATROL) { this.state = LizardState.PATROL; this.findPatrolPoint(); }
        let currentSpeed = (this.stateTimer % 5.0 > 3.0) ? 0 : this.moveSpeedVal;
        if (currentSpeed > 0) {
            if (this.position.distanceTo(this.targetPos) < 0.5 || this.stateTimer > 10.0) { this.findPatrolPoint(); this.stateTimer = 0; }
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) { this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 8.0 * dt; const step = currentSpeed * dt; const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step)); if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) { this.position.x = nextPos.x; this.position.z = nextPos.z; } }
            this.walkTime += dt * currentSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() { const range = 10; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }
    private animate(dt: number, currentSpeed: number) { const parts = this.model.parts; const time = this.walkTime * 3.0; if (currentSpeed > 0) { const legSwing = Math.sin(time) * 0.8; if(parts.legFR) parts.legFR.rotation.x = legSwing; if(parts.legBL) parts.legBL.rotation.x = legSwing; if(parts.legFL) parts.legFL.rotation.x = -legSwing; if(parts.legBR) parts.legBR.rotation.x = -legSwing; if(parts.body) parts.body.rotation.y = Math.sin(time) * 0.1; if(parts.tail) parts.tail.rotation.y = -Math.sin(time) * 0.3; } else { const breath = Math.sin(this.stateTimer * 4.0) * 0.01; if(parts.body) parts.body.scale.set(1 + breath, 1 + breath, 1 + breath); } }
    
    takeDamage(amount: number) { 
        if (this.isDead) return; 
        this.health -= amount; 
        PlayerUtils.updateHealthBar(this.uiRefs, this.health, this.maxHealth);
        if(this.model.parts.body.material) { this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; } 
        if (this.health <= 0) this.die(); 
        else setTimeout(() => { if (!this.isDead && this.model.parts.body.material) this.model.parts.body.material.emissiveIntensity = 0; }, 100); 
    }
    
    private die() { this.isDead = true; this.state = LizardState.DEAD; this.healthBarGroup.visible = false; this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'scales'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = true; child.userData.material = 'scales'; }); this.model.group.rotation.z = Math.PI; this.model.group.position.y = 0.2; this.hitbox.position.y = -0.5; }
    markAsSkinned() { this.isSkinned = true; this.hitbox.userData.isSkinnable = false; this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.setHex(0x333333); } }); }
}