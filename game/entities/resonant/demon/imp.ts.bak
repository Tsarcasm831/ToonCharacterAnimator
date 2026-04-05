import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { ObjectFactory } from '../../../environment/ObjectFactory'; // Kept for types/consistency, though we build the model locally
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum ImpState { IDLE, PATROL, CHASE, ATTACK, DEAD }

export class Imp {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any; // Stores references to body parts
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: ImpState = ImpState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    isDead: boolean = false;
    isSkinned: boolean = false;
    maxHealth: number = 40; // Slightly higher than spider?
    health: number = 40;
    hitbox: THREE.Group;
    
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    private walkTime: number = 0;
    private attackCooldown: number = 0;
    private moveSpeedVal: number = 2.5; // Imps are slightly faster
    private readonly collisionSize = new THREE.Vector3(0.8, 1.5, 0.8); // Tall and thin
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastStuckPos.copy(this.position);

        // --- Model Construction (Blue Imp) ---
        this.group = new THREE.Group();
        this.group.userData.entityType = 'Imp';
        
        // Build the Imp Mesh manually to ensure it looks like the concept art
        this.model = this.createImpModel(); 
        this.group.add(this.model.group);

        // --- Hitbox ---
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this, entityType: 'Imp' };
        this.group.add(this.hitbox);
        
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        // Main Body Hitbox (Vertical Box)
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), hitboxMat);
        bodyHitbox.position.set(0, 0.8, 0);
        bodyHitbox.userData = { type: 'creature', parent: this, entityType: 'Imp' };
        this.hitbox.add(bodyHitbox);

        // --- Health Bar ---
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 2.2, 0); // Position above head
        const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.15), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide }));
        this.healthBarGroup.add(bg);
        
        const fgGeo = new THREE.PlaneGeometry(0.96, 0.11);
        fgGeo.translate(0.48, 0, 0);
        this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide }));
        this.healthBarFill.position.set(-0.48, 0, 0.01);
        this.healthBarGroup.add(this.healthBarFill);
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    private createImpModel() {
        const parts: any = {};
        const impGroup = new THREE.Group();
        impGroup.userData.type = 'creature';
        impGroup.userData.entityType = 'Imp';

        // Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x2A4B7C, roughness: 0.7 }); // Blue skin
        const clothMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 1.0 }); // Loincloth
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });  // Dark horns
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Glowing red eyes

        // 1. Torso
        const torsoGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
        const torso = new THREE.Mesh(torsoGeo, skinMat);
        torso.position.y = 0.9;
        impGroup.add(torso);
        parts.torso = torso;

        // 2. Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.4, 0); // Relative to torso
        torso.add(headGroup);
        parts.head = headGroup;

        const headGeo = new THREE.BoxGeometry(0.35, 0.4, 0.35);
        const head = new THREE.Mesh(headGeo, skinMat);
        headGroup.add(head);

        // Horns
        const hornGeo = new THREE.ConeGeometry(0.06, 0.3, 8);
        hornGeo.translate(0, 0.15, 0); // Pivot at base
        
        const leftHorn = new THREE.Mesh(hornGeo, hornMat);
        leftHorn.position.set(-0.1, 0.2, 0);
        leftHorn.rotation.z = 0.3;
        leftHorn.rotation.x = -0.2;
        headGroup.add(leftHorn);

        const rightHorn = new THREE.Mesh(hornGeo, hornMat);
        rightHorn.position.set(0.1, 0.2, 0);
        rightHorn.rotation.z = -0.3;
        rightHorn.rotation.x = -0.2;
        headGroup.add(rightHorn);

        // Eyes
        const eyeGeo = new THREE.PlaneGeometry(0.08, 0.04);
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.08, 0.05, 0.18);
        headGroup.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.08, 0.05, 0.18);
        headGroup.add(rightEye);

        // Ears (Pointed)
        const earGeo = new THREE.ConeGeometry(0.05, 0.3, 4);
        earGeo.rotateZ(Math.PI / 2);
        const leftEar = new THREE.Mesh(earGeo, skinMat);
        leftEar.position.set(-0.2, 0, 0);
        headGroup.add(leftEar);
        const rightEar = new THREE.Mesh(earGeo, skinMat);
        rightEar.position.set(0.2, 0, 0);
        rightEar.rotation.z = Math.PI;
        headGroup.add(rightEar);

        // 3. Arms
        const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
        armGeo.translate(0, -0.2, 0); // Pivot at shoulder

        // Left Arm
        const lArmGroup = new THREE.Group();
        lArmGroup.position.set(-0.32, 0.2, 0);
        torso.add(lArmGroup);
        const lArm = new THREE.Mesh(armGeo, skinMat);
        lArmGroup.add(lArm);
        parts.armL = lArmGroup;

        // Right Arm
        const rArmGroup = new THREE.Group();
        rArmGroup.position.set(0.32, 0.2, 0);
        torso.add(rArmGroup);
        const rArm = new THREE.Mesh(armGeo, skinMat);
        rArmGroup.add(rArm);
        parts.armR = rArmGroup;

        // 4. Loincloth / Hips
        const hipsGeo = new THREE.BoxGeometry(0.48, 0.2, 0.32);
        const hips = new THREE.Mesh(hipsGeo, clothMat);
        hips.position.y = -0.35;
        torso.add(hips);

        // 5. Legs
        const legGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        legGeo.translate(0, -0.3, 0); // Pivot at hip

        // Left Leg
        const lLegGroup = new THREE.Group();
        lLegGroup.position.set(-0.15, -0.1, 0);
        hips.add(lLegGroup);
        const lLeg = new THREE.Mesh(legGeo, skinMat);
        lLegGroup.add(lLeg);
        parts.legL = lLegGroup;

        // Right Leg
        const rLegGroup = new THREE.Group();
        rLegGroup.position.set(0.15, -0.1, 0);
        hips.add(rLegGroup);
        const rLeg = new THREE.Mesh(legGeo, skinMat);
        rLegGroup.add(rLeg);
        parts.legR = rLegGroup;

        return { group: impGroup, parts: parts };
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return;
        
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // Basic AI Logic
        if (this.state !== ImpState.PATROL) {
            this.state = ImpState.PATROL;
            this.findPatrolPoint();
        }

        let currentSpeed = (this.stateTimer > 4.0 && this.stateTimer < 6.0) ? 0 : this.moveSpeedVal;

        if (currentSpeed > 0) {
            // New patrol point logic
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) {
                this.findPatrolPoint();
                this.stateTimer = 0;
            }

            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;

            if (toTarget.length() > 0.1) {
                // Smooth rotation
                this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 5.0 * dt;
                
                const step = currentSpeed * dt;
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));

                if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) {
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
            }

            this.walkTime += dt * currentSpeed;

            // Anti-stuck logic
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) {
                    this.findPatrolPoint(); // Force new target
                    this.stuckTimer = 0;
                    this.stateTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() {
        const range = 15;
        this.targetPos.set(
            this.position.x + (Math.random() - 0.5) * range,
            0,
            this.position.z + (Math.random() - 0.5) * range
        );
        if (!PlayerUtils.isWithinBounds(this.targetPos)) {
            this.targetPos.set(0, 0, 0);
        }
    }

    private animate(dt: number, moveSpeed: number) {
        const parts = this.model.parts;
        // Bipedal Animation speed
        const time = this.walkTime * 5.0; 

        if (moveSpeed > 0) {
            // Walk Cycle
            // Legs move in sine wave, offset by PI
            if (parts.legL) parts.legL.rotation.x = Math.sin(time) * 0.5;
            if (parts.legR) parts.legR.rotation.x = Math.sin(time + Math.PI) * 0.5;

            // Arms move opposite to legs
            if (parts.armL) {
                parts.armL.rotation.x = Math.sin(time + Math.PI) * 0.5;
                parts.armL.rotation.z = 0.1; // Slight flare
            }
            if (parts.armR) {
                parts.armR.rotation.x = Math.sin(time) * 0.5;
                parts.armR.rotation.z = -0.1;
            }

            // Body Bob
            if (parts.torso) parts.torso.position.y = 0.9 + Math.abs(Math.sin(time)) * 0.05;

        } else {
            // Idle Animation
            const breath = Math.sin(this.stateTimer * 2.0) * 0.02;
            
            // Reset Rotations
            if (parts.legL) parts.legL.rotation.x = THREE.MathUtils.lerp(parts.legL.rotation.x, 0, dt * 5);
            if (parts.legR) parts.legR.rotation.x = THREE.MathUtils.lerp(parts.legR.rotation.x, 0, dt * 5);
            
            // Arms hang loosely with breath
            if (parts.armL) {
                parts.armL.rotation.x = THREE.MathUtils.lerp(parts.armL.rotation.x, 0, dt * 5);
                parts.armL.rotation.z = 0.1 + breath;
            }
            if (parts.armR) {
                parts.armR.rotation.x = THREE.MathUtils.lerp(parts.armR.rotation.x, 0, dt * 5);
                parts.armR.rotation.z = -0.1 - breath;
            }

            // Head look around slightly
            if (parts.head) {
                parts.head.rotation.y = Math.sin(this.stateTimer * 0.5) * 0.2;
                parts.head.rotation.x = Math.sin(this.stateTimer * 0.8) * 0.05;
            }
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);

        // Flash Red logic
        const skinMesh = this.model.parts.torso;
        if (skinMesh && skinMesh.material) {
            const oldColor = skinMesh.material.emissive.getHex();
            skinMesh.material.emissive.setHex(0xff0000);
            skinMesh.material.emissiveIntensity = 0.5;
            
            setTimeout(() => {
                if (!this.isDead && skinMesh && skinMesh.material) {
                    skinMesh.material.emissive.setHex(0x000000);
                    skinMesh.material.emissiveIntensity = 0;
                }
            }, 100);
        }

        if (this.health <= 0) this.die();
    }

    private die() {
        this.isDead = true;
        this.state = ImpState.DEAD;
        this.healthBarGroup.visible = false;
        
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'leather'; // Imps drop leather/skin

        // Fall over animation (Rotate whole group backward)
        this.group.rotation.x = -Math.PI / 2;
        this.group.position.y = 0.2;
        this.hitbox.position.y = -0.5;
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0x333333); // Greyed out/bloody look
            }
        });
    }
}