
import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum WolfState { IDLE, PATROL, CHASE, ATTACK, DEAD }

export class Wolf {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: WolfState = WolfState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null; isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 17; health: number = 17; hitbox: THREE.Group; private healthBarGroup: THREE.Group; private healthBarFill: THREE.Mesh; private walkTime: number = 0; private attackCooldown: number = 0; private readonly collisionSize = new THREE.Vector3(0.8, 0.8, 1.3); private readonly GROVE_X_MIN = 20; private readonly GROVE_X_MAX = 60; private readonly GROVE_Z_MIN = -60; private readonly GROVE_Z_MAX = -20; private readonly GROVE_CENTER = new THREE.Vector3(40, 0, -40); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; const spawnPos = initialPos.clone(); if (!this.isInsideGrove(spawnPos)) spawnPos.copy(this.GROVE_CENTER); this.position.copy(spawnPos); this.lastStuckPos.copy(this.position);
        const wolfData = ObjectFactory.createWolfModel(0x666666); this.group = new THREE.Group(); this.group.add(wolfData.group); this.model = wolfData;
        this.hitbox = new THREE.Group(); this.hitbox.userData = { type: 'creature', parent: this }; this.group.add(this.hitbox); const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.3), hitboxMat); bodyHitbox.position.y = 0.55; bodyHitbox.userData = { type: 'creature' }; this.hitbox.add(bodyHitbox);
        const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.6), hitboxMat); headHitbox.position.set(0, 0.95, 0.6); headHitbox.userData = { type: 'creature' }; this.hitbox.add(headHitbox);
        const snoutHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.5), hitboxMat); snoutHitbox.position.set(0, 0.8, 1.1); snoutHitbox.userData = { type: 'creature' }; this.hitbox.add(snoutHitbox);
        this.healthBarGroup = new THREE.Group(); this.healthBarGroup.position.set(0, 1.7, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.15), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })); this.healthBarGroup.add(bg); const fgGeo = new THREE.PlaneGeometry(0.96, 0.11); fgGeo.translate(0.48, 0, 0); this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })); this.healthBarFill.position.set(-0.48, 0, 0.01); this.healthBarGroup.add(this.healthBarFill); this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    private isInsideGrove(pos: THREE.Vector3): boolean { return pos.x >= this.GROVE_X_MIN && pos.x <= this.GROVE_X_MAX && pos.z >= this.GROVE_Z_MIN && pos.z <= this.GROVE_Z_MAX; }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt; if (this.attackCooldown > 0) this.attackCooldown -= dt;
        let bestTarget = null; let bestDist = 15.0; 
        for (const t of potentialTargets) { if (t.isDead || !this.isInsideGrove(t.position)) continue; const d = this.position.distanceTo(t.position); if (d < bestDist) { bestDist = d; bestTarget = t; } }
        this.currentTarget = bestTarget; const distToTarget = bestTarget ? bestDist : Infinity;
        if (bestTarget) { if (this.state === WolfState.PATROL || this.state === WolfState.IDLE) { this.state = WolfState.CHASE; this.stateTimer = 0; } if (this.state === WolfState.CHASE) { if (distToTarget < 2.0) { this.state = WolfState.ATTACK; this.stateTimer = 0; } else this.targetPos.copy(bestTarget.position); } if (this.state === WolfState.ATTACK) { if (distToTarget > 3.0) { this.state = WolfState.CHASE; this.stateTimer = 0; } else if (this.attackCooldown <= 0 && this.stateTimer > 0.5) { this.attackCooldown = 1.5; this.stateTimer = 0; } } }
        else if (this.state !== WolfState.PATROL && this.state !== WolfState.IDLE) { this.state = WolfState.PATROL; this.stateTimer = 0; this.findPatrolPoint(); }

        let moveSpeed = 0;
        if (this.state === WolfState.PATROL) { moveSpeed = 2.0; if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0 || !this.isInsideGrove(this.position)) { this.findPatrolPoint(); this.stateTimer = 0; } }
        else if (this.state === WolfState.CHASE) moveSpeed = 6.0;

        if (moveSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 5.0 * dt;
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(moveSpeed * dt));
                if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) { this.position.x = nextPos.x; this.position.z = nextPos.z; }
            }
            this.walkTime += dt * moveSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.state = WolfState.PATROL; this.findPatrolPoint(); this.stuckTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, moveSpeed);
    }

    private findPatrolPoint() { if (!this.isInsideGrove(this.position)) { this.targetPos.copy(this.GROVE_CENTER); return; } const range = 15; const candidate = new THREE.Vector3(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); candidate.x = THREE.MathUtils.clamp(candidate.x, this.GROVE_X_MIN + 1, this.GROVE_X_MAX - 1); candidate.z = THREE.MathUtils.clamp(candidate.z, this.GROVE_Z_MIN + 1, this.GROVE_Z_MAX - 1); this.targetPos.copy(candidate); }
    private animate(dt: number, moveSpeed: number) { const parts = this.model.parts; if (moveSpeed > 0) { const legSwing = Math.sin(this.walkTime * 2.0) * 0.5; parts.legFR.rotation.x = legSwing; parts.legBL.rotation.x = legSwing; parts.legFL.rotation.x = -legSwing; parts.legBR.rotation.x = -legSwing; parts.body.position.y = 0.6 + Math.abs(Math.cos(this.walkTime * 2.0)) * 0.1; parts.tail.rotation.y = Math.sin(this.walkTime * 4.0) * 0.3; } else { const breath = Math.sin(this.stateTimer * 2.0) * 0.02; parts.body.scale.set(1 + breath, 1 + breath, 1 + breath); } }
    takeDamage(amount: number) { if (this.isDead) return; this.health -= amount; this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth); this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; if (this.health <= 0) this.die(); else { setTimeout(() => { if (!this.isDead) { this.model.parts.body.material.emissiveIntensity = 0; } }, 100); this.state = WolfState.CHASE; } }
    private die() { this.isDead = true; this.state = WolfState.DEAD; this.healthBarGroup.visible = false; this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'flesh'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = true; child.userData.material = 'flesh'; }); this.model.group.rotation.z = Math.PI / 2; this.model.group.position.y = 0.15; this.hitbox.position.y = -0.4; }
    markAsSkinned() { this.isSkinned = true; this.hitbox.userData.isSkinnable = false; this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; }); this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.multiplyScalar(0.3); } }); }
}
