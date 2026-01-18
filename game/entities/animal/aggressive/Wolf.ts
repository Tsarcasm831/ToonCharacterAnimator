import * as THREE from 'three';
import { Environment } from '../../../Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum WolfState { IDLE, PATROL, CHASE, ATTACK, DEAD }

export class Wolf {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: WolfState = WolfState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null; isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 17; health: number = 17; hitbox: THREE.Group; 
    private healthBarGroup: THREE.Group; 
    private uiRefs: any; // Holds refs to update UI
    private walkTime: number = 0; private attackCooldown: number = 0; private readonly collisionSize = new THREE.Vector3(0.8, 0.8, 1.3); private readonly GROVE_X_MIN = 20; private readonly GROVE_X_MAX = 60; private readonly GROVE_Z_MIN = -60; private readonly GROVE_Z_MAX = -20; private readonly GROVE_CENTER = new THREE.Vector3(40, 0, -40); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; const spawnPos = initialPos.clone(); if (!this.isInsideGrove(spawnPos)) spawnPos.copy(this.GROVE_CENTER); this.position.copy(spawnPos); this.lastStuckPos.copy(this.position);
        const wolfData = ObjectFactory.createWolfModel(0x666666); this.group = new THREE.Group(); this.group.add(wolfData.group); this.model = wolfData;
        
        this.hitbox = new THREE.Group(); 
        this.hitbox.userData = { type: 'creature', parent: this }; 
        this.group.add(this.hitbox); 
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        
        const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 1.1), hitboxMat); 
        bodyBox.position.y = 0.6; 
        bodyBox.userData = { type: 'creature' }; 
        this.hitbox.add(bodyBox);
        
        const neckBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.5), hitboxMat);
        neckBox.position.set(0, 0.85, 0.4);
        neckBox.rotation.x = -0.4;
        neckBox.userData = { type: 'creature' };
        this.hitbox.add(neckBox);

        const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.4), hitboxMat); 
        headBox.position.set(0, 1.05, 0.7); 
        headBox.userData = { type: 'creature' }; 
        this.hitbox.add(headBox);

        const snoutBox = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.35), hitboxMat); 
        snoutBox.position.set(0, 0.95, 1.0); 
        snoutBox.userData = { type: 'creature' }; 
        this.hitbox.add(snoutBox);

        // Enhanced Health Bar
        this.healthBarGroup = new THREE.Group(); 
        this.healthBarGroup.position.set(0, 1.7, 0); 
        this.uiRefs = PlayerUtils.createHealthBar(this.healthBarGroup, this.maxHealth, 0x666666, 'Wolf');
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    private isInsideGrove(pos: THREE.Vector3): boolean { return pos.x >= this.GROVE_X_MIN && pos.x <= this.GROVE_X_MAX && pos.z >= this.GROVE_Z_MIN && pos.z <= this.GROVE_Z_MAX; }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt; if (this.attackCooldown > 0) this.attackCooldown -= dt;
        let bestTarget = null; let bestDist = 15.0; 
        for (const t of potentialTargets) { if (t.isDead || !this.isInsideGrove(t.position)) continue; const d = this.position.distanceTo(t.position); if (d < bestDist) { bestDist = d; bestTarget = t; } }
        this.currentTarget = bestTarget; const distToTarget = bestTarget ? bestDist : Infinity;
        
        if (bestTarget) { 
            if (this.state === WolfState.PATROL || this.state === WolfState.IDLE) { this.state = WolfState.CHASE; this.stateTimer = 0; } 
            if (this.state === WolfState.CHASE) { 
                if (distToTarget < 2.5) { this.state = WolfState.ATTACK; this.stateTimer = 0; } 
                else this.targetPos.copy(bestTarget.position); 
            } 
            if (this.state === WolfState.ATTACK) { 
                if (distToTarget > 5.0) { this.state = WolfState.CHASE; this.stateTimer = 0; } 
                else if (this.attackCooldown <= 0 && this.stateTimer > 1.2) { 
                    this.attackCooldown = 1.0 + Math.random() * 1.5; 
                    this.stateTimer = 0; 
                } 
            } 
        }
        else if (this.state !== WolfState.PATROL && this.state !== WolfState.IDLE) { this.state = WolfState.PATROL; this.stateTimer = 0; this.findPatrolPoint(); }

        let moveSpeed = 0;
        if (this.state === WolfState.PATROL) { moveSpeed = 2.0; if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0 || !this.isInsideGrove(this.position)) { this.findPatrolPoint(); this.stateTimer = 0; } }
        else if (this.state === WolfState.CHASE) moveSpeed = 6.0;

        if (moveSpeed > 0 || this.state === WolfState.ATTACK) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (this.state === WolfState.ATTACK || this.state === WolfState.CHASE) {
                if (this.currentTarget) {
                    const dir = new THREE.Vector3().subVectors(this.currentTarget.position, this.position).normalize();
                    this.rotationY = THREE.MathUtils.lerp(this.rotationY, Math.atan2(dir.x, dir.z), 10.0 * dt);
                }
            } else if (toTarget.length() > 0.1) {
                this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 5.0 * dt;
            }
            let currentMoveSpeed = moveSpeed;
            if (this.state === WolfState.ATTACK) {
                if (this.stateTimer >= 0.4 && this.stateTimer < 0.7) currentMoveSpeed = 12.0; else currentMoveSpeed = 0;
            }
            if (currentMoveSpeed > 0) {
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(currentMoveSpeed * dt));
                if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) { this.position.x = nextPos.x; this.position.z = nextPos.z; }
            }
            this.walkTime += dt * currentMoveSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001 && currentMoveSpeed > 0) { this.stuckTimer += dt; if (this.stuckTimer > 1.5) { this.state = WolfState.PATROL; this.findPatrolPoint(); this.stuckTimer = 0; } }
            else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, moveSpeed);
    }

    private findPatrolPoint() { if (!this.isInsideGrove(this.position)) { this.targetPos.copy(this.GROVE_CENTER); return; } const range = 15; const candidate = new THREE.Vector3(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); candidate.x = THREE.MathUtils.clamp(candidate.x, this.GROVE_X_MIN + 1, this.GROVE_X_MAX - 1); candidate.z = THREE.MathUtils.clamp(candidate.z, this.GROVE_Z_MIN + 1, this.GROVE_Z_MAX - 1); this.targetPos.copy(candidate); }
    
    private animate(dt: number, moveSpeed: number) { 
        const parts = this.model.parts; 
        const lerp = THREE.MathUtils.lerp;
        const animDamp = 10 * dt;
        if (this.state === WolfState.ATTACK) { this.animateAttack(dt); return; }
        parts.head.rotation.x = lerp(parts.head.rotation.x, 0, animDamp);
        parts.body.rotation.x = lerp(parts.body.rotation.x, 0, animDamp);
        if (moveSpeed > 0) { 
            const legSwing = Math.sin(this.walkTime * 2.0) * 0.5; 
            parts.legFR.rotation.x = legSwing; parts.legBL.rotation.x = legSwing; 
            parts.legFL.rotation.x = -legSwing; parts.legBR.rotation.x = -legSwing; 
            parts.body.position.y = lerp(parts.body.position.y, 0.6 + Math.abs(Math.cos(this.walkTime * 2.0)) * 0.1, animDamp * 2); 
            parts.tail.rotation.y = Math.sin(this.walkTime * 4.0) * 0.3; 
        } else { 
            const breath = Math.sin(this.stateTimer * 2.0) * 0.02; 
            parts.body.scale.set(1 + breath, 1 + breath, 1 + breath); 
            parts.legFR.rotation.x = lerp(parts.legFR.rotation.x, 0, animDamp); parts.legFL.rotation.x = lerp(parts.legFL.rotation.x, 0, animDamp);
            parts.legBR.rotation.x = lerp(parts.legBR.rotation.x, 0, animDamp); parts.legBL.rotation.x = lerp(parts.legBL.rotation.x, 0, animDamp);
            parts.body.position.y = lerp(parts.body.position.y, 0.6, animDamp);
        } 
    }

    private animateAttack(dt: number) {
        const parts = this.model.parts;
        const lerp = THREE.MathUtils.lerp;
        const t = this.stateTimer;
        const animDamp = 15 * dt;

        if (t < 0.4) {
            const p = t / 0.4;
            parts.body.position.y = lerp(parts.body.position.y, 0.35, animDamp);
            parts.body.rotation.x = lerp(parts.body.rotation.x, 0.2, animDamp);
            parts.head.rotation.x = lerp(parts.head.rotation.x, -0.3, animDamp);
            parts.legFR.rotation.x = lerp(parts.legFR.rotation.x, 0.5, animDamp); parts.legFL.rotation.x = lerp(parts.legFL.rotation.x, 0.5, animDamp);
            parts.legBR.rotation.x = lerp(parts.legBR.rotation.x, -0.8, animDamp); parts.legBL.rotation.x = lerp(parts.legBL.rotation.x, -0.8, animDamp);
            parts.tail.rotation.x = lerp(parts.tail.rotation.x, -0.8, animDamp);
        } else if (t < 0.8) {
            const p = (t - 0.4) / 0.4;
            const jumpHeight = Math.sin(p * Math.PI) * 0.5;
            parts.body.position.y = 0.6 + jumpHeight;
            parts.body.rotation.x = lerp(parts.body.rotation.x, -0.4, animDamp * 2);
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0.5, animDamp * 2);
            parts.legFR.rotation.x = lerp(parts.legFR.rotation.x, -1.2, animDamp * 2); parts.legFL.rotation.x = lerp(parts.legFL.rotation.x, -1.2, animDamp * 2);
            parts.legBR.rotation.x = lerp(parts.legBR.rotation.x, 1.0, animDamp * 2); parts.legBL.rotation.x = lerp(parts.legBL.rotation.x, 1.0, animDamp * 2);
            parts.tail.rotation.x = lerp(parts.tail.rotation.x, 0.5, animDamp);
        } else {
            const p = Math.min(1.0, (t - 0.8) / 0.4);
            const impactCrouch = (1.0 - p) * 0.25;
            parts.body.position.y = lerp(parts.body.position.y, 0.6 - impactCrouch, animDamp);
            parts.body.rotation.x = lerp(parts.body.rotation.x, 0, animDamp);
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0, animDamp);
            parts.legFR.rotation.x = lerp(parts.legFR.rotation.x, 0, animDamp); parts.legFL.rotation.x = lerp(parts.legFL.rotation.x, 0, animDamp);
            parts.legBR.rotation.x = lerp(parts.legBR.rotation.x, 0, animDamp); parts.legBL.rotation.x = lerp(parts.legBL.rotation.x, 0, animDamp);
            parts.tail.rotation.x = lerp(parts.tail.rotation.x, -0.4, animDamp);
        }
    }

    takeDamage(amount: number) { 
        if (this.isDead) return; 
        this.health -= amount; 
        PlayerUtils.updateHealthBar(this.uiRefs, this.health, this.maxHealth);
        
        this.model.parts.body.material.emissive.setHex(0xff0000); 
        this.model.parts.body.material.emissiveIntensity = 0.5; 
        if (this.health <= 0) this.die(); 
        else { 
            setTimeout(() => { if (!this.isDead) { this.model.parts.body.material.emissiveIntensity = 0; } }, 100); 
            this.state = WolfState.CHASE; 
        } 
    }
    
    private die() { this.isDead = true; this.state = WolfState.DEAD; this.healthBarGroup.visible = false; this.hitbox.userData.isSkinnable = true; this.hitbox.userData.material = 'flesh'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = true; child.userData.material = 'flesh'; }); this.model.group.rotation.z = Math.PI / 2; this.model.group.position.y = 0.15; this.hitbox.position.y = -0.4; }
    markAsSkinned() { this.isSkinned = true; this.hitbox.userData.isSkinnable = false; this.hitbox.userData.type = 'soft'; this.hitbox.children.forEach(child => { child.userData.isSkinnable = false; child.userData.type = 'soft'; }); this.model.group.traverse((obj: any) => { if (obj.isMesh && obj.material) { obj.material = obj.material.clone(); obj.material.color.setHex(0x000000); if (obj.material.emissive) obj.material.emissive.setHex(0x000000); } }); }
}