import * as THREE from 'three';
import { Environment } from '../../../Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum PigState { IDLE, PATROL, FLEE, DEAD }

export class Pig {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: PigState = PigState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 30; health: number = 30; hitbox: THREE.Group; 
    private healthBarGroup: THREE.Group; 
    private uiRefs: any;
    private walkTime: number = 0; private moveSpeedVal: number = 1.8; private readonly collisionSize = new THREE.Vector3(1.0, 0.9, 1.5); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; this.position.copy(initialPos); this.lastStuckPos.copy(this.position);
        const pigData = ObjectFactory.createPigModel ? ObjectFactory.createPigModel(0xFFC0CB) : ObjectFactory.createBearModel(0xFFC0CB); this.group = new THREE.Group(); this.group.add(pigData.group); this.model = pigData;
        
        this.hitbox = new THREE.Group(); 
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox); 
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        
        // Stout Pig Hull
        const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 1.1), hitboxMat); 
        bodyBox.position.y = 0.55; 
        bodyBox.userData = { type: 'creature' }; 
        this.hitbox.add(bodyBox);
        
        const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.45), hitboxMat); 
        headBox.position.set(0, 0.75, 0.65); 
        headBox.userData = { type: 'creature' }; 
        this.hitbox.add(headBox);
        
        const snoutBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.25), hitboxMat); 
        snoutBox.position.set(0, 0.65, 0.95); 
        snoutBox.userData = { type: 'creature' }; 
        this.hitbox.add(snoutBox);

        // Enhanced Health Bar
        this.healthBarGroup = new THREE.Group(); 
        this.healthBarGroup.position.set(0, 1.5, 0); 
        this.uiRefs = PlayerUtils.createHealthBar(this.healthBarGroup, this.maxHealth, 0xFFC0CB, 'Pig');
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt;
        if (this.state !== PigState.PATROL) { this.state = PigState.PATROL; this.findPatrolPoint(); }
        let currentSpeed = (this.stateTimer > 4.0 && this.stateTimer < 9.0) ? 0 : this.moveSpeedVal;
        if (currentSpeed > 0) {
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 15.0) { this.findPatrolPoint(); this.stateTimer = 0; }
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) { this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 3.0 * dt; const step = currentSpeed * dt; const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step)); if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) { this.position.x = nextPos.x; this.position.z = nextPos.z; } }
            this.walkTime += dt * currentSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() { const range = 20; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }
    private animate(dt: number, currentSpeed: number) { const parts = this.model.parts; if (currentSpeed > 0) { const legSwing = Math.sin(this.walkTime * 2.5) * 0.6; if(parts.legFR) parts.legFR.rotation.x = legSwing; if(parts.legBL) parts.legBL.rotation.x = legSwing; if(parts.legFL) parts.legFL.rotation.x = -legSwing; if(parts.legBR) parts.legBR.rotation.x = -legSwing; if(parts.head) parts.head.rotation.x = 0; if(parts.body) parts.body.rotation.z = Math.sin(this.walkTime * 2.5) * 0.05; } else { if(parts.head) parts.head.rotation.x = (this.stateTimer > 4.5 && this.stateTimer < 8.5) ? 0.6 + (Math.sin(this.stateTimer * 5.0) * 0.1) : 0; const breath = Math.sin(this.stateTimer * 3.0) * 0.03; if(parts.body) parts.body.scale.set(1 + breath, 1 + breath, 1 + breath); } }
    
    takeDamage(amount: number) { 
        if (this.isDead) return; 
        this.health -= amount; 
        PlayerUtils.updateHealthBar(this.uiRefs, this.health, this.maxHealth);
        if(this.model.parts.body.material) { this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; } 
        if (this.health <= 0) this.die(); 
        else setTimeout(() => { if (!this.isDead && this.model.parts.body.material) this.model.parts.body.material.emissiveIntensity = 0; }, 100); 
    }
    
    private die() { this.isDead = true; this.state = PigState.DEAD; this.healthBarGroup.visible = false; this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'pork'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = true; child.userData.material = 'pork'; }); this.model.group.rotation.z = Math.PI / 2; this.model.group.position.y = 0.4; this.hitbox.position.y = -0.5; }
    markAsSkinned() { this.isSkinned = true; this.hitbox.userData.isSkinnable = false; this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.setHex(0x8B4513); } }); }
}