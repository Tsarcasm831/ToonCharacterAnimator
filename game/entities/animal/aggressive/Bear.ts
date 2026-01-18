import * as THREE from 'three';
import { Environment } from '../../../Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum BearState { IDLE, PATROL, CHASE, ATTACK, DEAD }

export class Bear {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: BearState = BearState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null; isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 50; health: number = 50; hitbox: THREE.Group; 
    private healthBarGroup: THREE.Group; 
    private uiRefs: any;
    private walkTime: number = 0; private attackCooldown: number = 0; private readonly collisionSize = new THREE.Vector3(1.4, 1.4, 2.2); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; this.position.copy(initialPos); this.lastStuckPos.copy(this.position);
        const bearData = ObjectFactory.createBearModel(0x5C4033); this.group = new THREE.Group(); this.group.add(bearData.group); this.model = bearData;
        
        this.hitbox = new THREE.Group(); 
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        
        // Detailed Bear Hull
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.8), hitboxMat); 
        mainBody.position.y = 0.9; 
        mainBody.userData = { type: 'creature' }; 
        this.hitbox.add(mainBody);
        
        const neckHump = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.7), hitboxMat);
        neckHump.position.set(0, 1.25, 0.8);
        neckHump.rotation.x = -0.3;
        neckHump.userData = { type: 'creature' };
        this.hitbox.add(neckHump);

        const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.7), hitboxMat); 
        headBox.position.set(0, 1.4, 1.3); 
        headBox.userData = { type: 'creature' }; 
        this.hitbox.add(headBox);
        
        const snoutBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.4), hitboxMat); 
        snoutBox.position.set(0, 1.25, 1.7); 
        snoutBox.userData = { type: 'creature' }; 
        this.hitbox.add(snoutBox);

        // Enhanced Health Bar
        this.healthBarGroup = new THREE.Group(); 
        this.healthBarGroup.position.set(0, 2.5, 0); 
        this.uiRefs = PlayerUtils.createHealthBar(this.healthBarGroup, this.maxHealth, 0x5C4033, 'Bear');
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt; if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.state !== BearState.PATROL) { this.state = BearState.PATROL; this.findPatrolPoint(); }

        let moveSpeed = 0;
        if (this.state === BearState.PATROL) { moveSpeed = 1.5; if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 15.0) { this.findPatrolPoint(); this.stateTimer = 0; } }

        if (moveSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 3.0 * dt; 
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(moveSpeed * dt));
                if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) { this.position.x = nextPos.x; this.position.z = nextPos.z; }
            }
            this.walkTime += dt * moveSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, moveSpeed);
    }

    private findPatrolPoint() { const range = 20; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }
    private animate(dt: number, moveSpeed: number) { const parts = this.model.parts; const time = this.walkTime * 0.8; if (moveSpeed > 0) { const legSwing = Math.sin(time * 1.5) * 0.6; parts.legFR.rotation.x = legSwing; parts.legBL.rotation.x = legSwing; parts.legFL.rotation.x = -legSwing; parts.legBR.rotation.x = -legSwing; parts.body.position.y = 0.9 + Math.abs(Math.cos(time * 1.5)) * 0.15; } else { const breath = Math.sin(this.stateTimer * 1.5) * 0.03; parts.body.scale.set(1 + breath, 1 + breath, 1 + breath); } }
    
    takeDamage(amount: number) { 
        if (this.isDead) return; 
        this.health -= amount; 
        PlayerUtils.updateHealthBar(this.uiRefs, this.health, this.maxHealth);
        this.model.parts.body.material.emissive.setHex(0xff0000); 
        this.model.parts.body.material.emissiveIntensity = 0.5; 
        if (this.health <= 0) this.die(); 
        else { setTimeout(() => { if (!this.isDead) { this.model.parts.body.material.emissiveIntensity = 0; } }, 100); } 
    }
    
    private die() { this.isDead = true; this.state = BearState.DEAD; this.healthBarGroup.visible = false; this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'bear_fur'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = true; child.userData.material = 'bear_fur'; }); this.model.group.rotation.z = Math.PI / 2; this.model.group.position.y = 0.3; this.hitbox.position.y = -0.6; }
    markAsSkinned() { this.isSkinned = true; this.hitbox.userData.isSkinnable = false; this.hitbox.userData.type = 'soft'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; child.userData.type = 'soft'; }); this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.setHex(0x000000); if (obj.material.emissive) obj.material.emissive.setHex(0x000000); } }); }
}