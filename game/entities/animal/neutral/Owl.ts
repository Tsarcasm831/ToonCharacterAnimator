
import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum OwlState { IDLE, PATROL, CHASE, SWOOP, RETREAT, FALLING, DEAD }

export class Owl {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: OwlState = OwlState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null; isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 8; health: number = 8; private verticalSpeed: number = 0; hitbox: THREE.Group; private healthBarGroup: THREE.Group; private healthBarFill: THREE.Mesh; private animTime: number = 0; private attackCooldown: number = 0;

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; const terrainH = PlayerUtils.getTerrainHeight(initialPos.x, initialPos.z); this.position.set(initialPos.x, terrainH + 8, initialPos.z);
        const owlData = ObjectFactory.createOwlModel(0x8B4513); this.group = new THREE.Group(); this.group.add(owlData.group); this.model = owlData;
        
        // Ensure model and children are marked as soft to avoid blocking player
        this.model.group.userData.type = 'soft';
        this.model.group.traverse((child: THREE.Object3D) => {
             child.userData.type = 'soft';
        });

        const bbox = new THREE.Box3().setFromObject(this.model.group);
        const hitboxSize = bbox.getSize(new THREE.Vector3());
        const hitboxCenter = bbox.getCenter(new THREE.Vector3());
        // Reduce hitbox height for flying entity to allow walking under
        const hitboxMesh = new THREE.Mesh(new THREE.BoxGeometry(hitboxSize.x, 1.0, hitboxSize.z), new THREE.MeshBasicMaterial({ visible: false }));
        hitboxMesh.position.copy(hitboxCenter);
        this.hitbox = new THREE.Group();
        this.hitbox.add(hitboxMesh);
        this.model.group.add(this.hitbox);
        this.hitbox.userData = { type: 'soft', parent: this };
        this.hitbox.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.userData = { ...child.userData, type: 'soft', parent: this };
            }
        });
        this.healthBarGroup = new THREE.Group(); this.healthBarGroup.position.set(0, 0.8, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.1), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })); this.healthBarGroup.add(bg); const fgGeo = new THREE.PlaneGeometry(0.58, 0.08); fgGeo.translate(0.29, 0, 0); this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })); this.healthBarFill.position.set(-0.29, 0, 0.01); this.healthBarGroup.add(this.healthBarFill);
        this.group.add(this.healthBarGroup); this.group.position.copy(this.position); this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.state === OwlState.FALLING) { this.handleFalling(dt); return; }
        if (this.state === OwlState.DEAD) return;
        this.stateTimer += dt; if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.state !== OwlState.PATROL) { this.state = OwlState.PATROL; this.findPatrolPoint(); }
        this.updateMovement(dt);
        if (skipAnimation) return;
        this.animate(dt);
    }

    private updateMovement(dt: number) {
        let moveSpeed = 4.0; let terrainY = PlayerUtils.getTerrainHeight(this.position.x, this.position.z); let desiredY = terrainY + 8.0;
        if (this.position.distanceTo(this.targetPos) < 1.0) this.findPatrolPoint(); 
        const toTarget = new THREE.Vector3(this.targetPos.x - this.position.x, 0, this.targetPos.z - this.position.z);
        if (toTarget.length() > 0.1) {
            this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 4.0 * dt;
            const nextX = this.position.x + Math.sin(this.rotationY) * moveSpeed * dt;
            const nextZ = this.position.z + Math.cos(this.rotationY) * moveSpeed * dt;
            if (PlayerUtils.isWithinBounds(new THREE.Vector3(nextX, 0, nextZ))) { this.position.x = nextX; this.position.z = nextZ; }
        }
        this.position.y += (desiredY - this.position.y) * dt;
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;
    }

    private handleFalling(dt: number) { this.verticalSpeed -= 9.8 * dt; this.position.y += this.verticalSpeed * dt; this.group.rotation.z += 2.0 * dt; this.group.rotation.x += 1.0 * dt; const terrainH = PlayerUtils.getTerrainHeight(this.position.x, this.position.z); if (this.position.y <= terrainH) { this.position.y = terrainH; this.settleDeath(); } this.group.position.copy(this.position); }
    private findPatrolPoint() { const range = 30; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }
    private animate(dt: number) { const parts = this.model.parts; this.animTime += dt * 4.0; const angle = Math.sin(this.animTime) * 0.5; parts.wingL.rotation.z = angle + 0.2; parts.wingR.rotation.z = -angle - 0.2; }
    takeDamage(amount: number) { if (this.isDead) return; this.health -= amount; this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth); this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; if (this.health <= 0) this.die(); else setTimeout(() => { if (!this.isDead) this.model.parts.body.material.emissiveIntensity = 0; }, 100); }
    private die() { this.isDead = true; this.state = OwlState.FALLING; this.healthBarGroup.visible = false; }
    private settleDeath() { 
        this.state = OwlState.DEAD; 
        this.hitbox.userData.isSkinnable = true; 
        this.hitbox.userData.material = 'feathers'; 
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = true;
            child.userData.material = 'feathers';
        });
        this.group.rotation.set(0, 0, 0); 
        this.model.group.rotation.x = Math.PI / 2; 
        this.model.group.position.y = 0.1; 
        this.model.parts.wingL.rotation.z = 1.5; 
        this.model.parts.wingR.rotation.z = -1.5; 
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
