import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum BearState { IDLE, PATROL, CHASE, ATTACK, DEAD }

export class Bear {
    scene: THREE.Scene; group: THREE.Group; model: any; position: THREE.Vector3 = new THREE.Vector3(); rotationY: number = 0; state: BearState = BearState.PATROL; stateTimer: number = 0; targetPos: THREE.Vector3 = new THREE.Vector3(); currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null; isDead: boolean = false; isSkinned: boolean = false; maxHealth: number = 50; health: number = 50; hitbox: THREE.Group; private healthBarGroup: THREE.Group; private healthBarFill: THREE.Mesh; private walkTime: number = 0; private attackCooldown: number = 0; private readonly collisionSize = new THREE.Vector3(1.4, 1.4, 2.2); private stuckTimer: number = 0; private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene; this.position.copy(initialPos); this.lastStuckPos.copy(this.position);
        // Base color ignored here as we override it immediately
        const bearData = ObjectFactory.createBearModel(0x5C4033); 
        this.group = new THREE.Group(); this.group.add(bearData.group); this.model = bearData;
        
        // --- NEW: Improve Bear Appearance based on image reference ---
        this.improveMaterials();
        // -------------------------------------------------------------

        this.group.userData.entityType = 'Bear';
        this.model.group.userData.type = 'creature';
        this.model.group.userData.entityType = 'Bear';
        this.hitbox = this.model.group;
        this.hitbox.userData = { type: 'creature', parent: this, entityType: 'Bear' };
        this.hitbox.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.userData = { ...child.userData, type: 'creature', parent: this, entityType: 'Bear' };
            }
        });
        this.healthBarGroup = new THREE.Group(); this.healthBarGroup.position.set(0, 2.5, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.18), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })); this.healthBarGroup.add(bg); const fgGeo = new THREE.PlaneGeometry(1.16, 0.14); fgGeo.translate(0.58, 0, 0); this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })); this.healthBarFill.position.set(-0.58, 0, 0.01); this.healthBarGroup.add(this.healthBarFill); this.group.add(this.healthBarGroup);
        this.group.position.copy(this.position); this.scene.add(this.group);
    }

    /**
     * Upgrades the materials to look more like the reference image.
     * Uses StandardMaterial for lighting and applies color variations.
     */
    private improveMaterials() {
        // Colors derived from the reference image
        const darkFur = new THREE.Color(0x3b2614);   // Deep brown for legs/lower body
        const mediumFur = new THREE.Color(0x7a5c3f); // Main body brown
        const goldenFur = new THREE.Color(0xa88054); // Lighter highlights for hump/shoulders

        const parts = this.model.parts;

        // Helper to create fur material
        const createFurMat = (color: THREE.Color) => {
            return new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.9, // Fur is very rough, not shiny
                metalness: 0.0,
                flatShading: false, // Ensure smooth lighting across low-poly faces
                // Add a tiny bit of warm emissive to simulate sun scattering through fur
                emissive: new THREE.Color(0x332211),
                emissiveIntensity: 0.1
            });
        };

        // Apply varied materials if parts exist
        if (parts.body && parts.body.isMesh) {
            // Main body gets the medium brown, slightly golden tone
            parts.body.material = createFurMat(mediumFur);
            // Try to make the top of the body (hump area) lighter if possible. 
            // Since we don't have texture maps, we blend towards golden.
            parts.body.material.color.lerp(goldenFur, 0.3);
            parts.body.castShadow = true;
            parts.body.receiveShadow = true;
        }

        // Legs are generally darker on grizzlies
        const legParts = [parts.legFR, parts.legFL, parts.legBR, parts.legBL];
        legParts.forEach(leg => {
            if (leg && leg.isMesh) {
                leg.material = createFurMat(darkFur);
                leg.castShadow = true;
                leg.receiveShadow = true;
            }
        });

        // If there is a separate head part, give it the lighter golden-brown look
        if (parts.head && parts.head.isMesh) {
             parts.head.material = createFurMat(goldenFur);
             parts.head.castShadow = true;
             parts.head.receiveShadow = true;
        }

        // Ensure any other parts also get standard material so they react to light
        this.model.group.traverse((child: any) => {
            if (child.isMesh && !(child.material instanceof THREE.MeshStandardMaterial)) {
                child.material = createFurMat(mediumFur);
                child.castShadow = true;
            }
        });
    }


    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return; this.stateTimer += dt; if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.state !== BearState.PATROL) { this.state = BearState.PATROL; this.findPatrolPoint(); }

        let moveSpeed = 0;
        if (this.state === BearState.PATROL) { moveSpeed = 1.5; if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 15.0) { this.findPatrolPoint(); this.stateTimer = 0; } }

        if (moveSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, 3.0);
                const avoidanceRot = AIUtils.getAvoidanceSteering(this.position, this.rotationY, this.collisionSize, environment.obstacles);
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, 5.0);

                const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, moveSpeed, dt, this.collisionSize, environment.obstacles);
                this.position.x = nextPos.x;
                this.position.z = nextPos.z;
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
    takeDamage(amount: number) { if (this.isDead) return; this.health -= amount; this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth); this.model.parts.body.material.emissive.setHex(0xff0000); this.model.parts.body.material.emissiveIntensity = 0.5; if (this.health <= 0) this.die(); else { setTimeout(() => { if (!this.isDead) { 
        // Reset emissive to the "fur" color instead of black
        this.model.parts.body.material.emissive.setHex(0x332211); 
        this.model.parts.body.material.emissiveIntensity = 0.1; 
    } }, 100); } }
    private die() {
        this.isDead = true;
        this.state = BearState.DEAD;
        this.healthBarGroup.visible = false;
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'bear_fur';
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = true;
            child.userData.material = 'bear_fur';
        });
        this.model.group.rotation.z = Math.PI / 2;
        this.model.group.position.y = 0.3;
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
                // When skinned, remove the nice fur properties and make it dark/bloody
                obj.material.color.setHex(0x331111);
                obj.material.emissiveIntensity = 0;
                obj.material.roughness = 0.6;
            }
        });
    }
}