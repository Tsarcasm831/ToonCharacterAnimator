import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum ShamanState { IDLE, PATROL, CHASE, ATTACK, DEAD }

export class Shaman {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: ShamanState = ShamanState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    isDead: boolean = false;
    isSkinned: boolean = false;
    maxHealth: number = 60; // Shamans are tougher
    health: number = 60;
    hitbox: THREE.Group;
    
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    private walkTime: number = 0;
    private attackCooldown: number = 0;
    private moveSpeedVal: number = 2.0; // Slightly slower, more deliberate movement
    private readonly collisionSize = new THREE.Vector3(0.9, 2.0, 0.9); // Taller collision box
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastStuckPos.copy(this.position);

        // --- Model Construction (Shaman) ---
        this.group = new THREE.Group();
        this.group.userData.entityType = 'Shaman';
        
        this.model = this.createShamanModel(); 
        this.group.add(this.model.group);

        // --- Hitbox ---
        this.hitbox = new THREE.Group();
        this.hitbox.userData = { type: 'creature', parent: this, entityType: 'Shaman' };
        this.group.add(this.hitbox);
        
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        // Main Body Hitbox
        const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.9), hitboxMat);
        bodyHitbox.position.set(0, 1.05, 0);
        bodyHitbox.userData = { type: 'creature', parent: this, entityType: 'Shaman' };
        this.hitbox.add(bodyHitbox);

        // --- Health Bar ---
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 2.6, 0); // Higher for Shaman
        const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.15), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide }));
        this.healthBarGroup.add(bg);
        
        const fgGeo = new THREE.PlaneGeometry(1.16, 0.11);
        fgGeo.translate(0.58, 0, 0);
        this.healthBarFill = new THREE.Mesh(fgGeo, new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide }));
        this.healthBarFill.position.set(-0.58, 0, 0.01);
        this.healthBarGroup.add(this.healthBarFill);
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    private createShamanModel() {
        const parts: any = {};
        const shamanGroup = new THREE.Group();
        shamanGroup.userData.type = 'creature';
        shamanGroup.userData.entityType = 'Shaman';

        // Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x2A4B7C, roughness: 0.7 }); // Blue skin
        const furMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 1.0 });  // Brown Fur
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xEFEBE0, roughness: 0.4 }); // Bone/Skull
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.9 }); // Staff wood
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }); 
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 }); // Glowing eyes

        // 1. Torso (Taller than Imp)
        const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.35);
        const torso = new THREE.Mesh(torsoGeo, skinMat);
        torso.position.y = 1.2; // Higher center of mass
        shamanGroup.add(torso);
        parts.torso = torso;

        // --- Fur Cape/Cloak ---
        // Create a cape using a flattened cone or box on the back
        const capeGeo = new THREE.BoxGeometry(0.7, 1.4, 0.1);
        const cape = new THREE.Mesh(capeGeo, furMat);
        cape.position.set(0, 0.1, -0.25); // Behind torso
        cape.rotation.x = 0.1; // Slight angle outwards
        torso.add(cape);

        // Fur Collar
        const collarGeo = new THREE.BoxGeometry(0.8, 0.25, 0.5);
        const collar = new THREE.Mesh(collarGeo, furMat);
        collar.position.set(0, 0.45, 0);
        torso.add(collar);

        // 2. Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.5, 0); // Relative to torso
        torso.add(headGroup);
        parts.head = headGroup;

        const headGeo = new THREE.BoxGeometry(0.4, 0.45, 0.4);
        const head = new THREE.Mesh(headGeo, skinMat);
        headGroup.add(head);

        // Large Horns
        const hornGeo = new THREE.ConeGeometry(0.08, 0.5, 8);
        hornGeo.translate(0, 0.25, 0); 
        
        const leftHorn = new THREE.Mesh(hornGeo, hornMat);
        leftHorn.position.set(-0.15, 0.2, 0);
        leftHorn.rotation.z = 0.4;
        leftHorn.rotation.x = -0.3;
        headGroup.add(leftHorn);

        const rightHorn = new THREE.Mesh(hornGeo, hornMat);
        rightHorn.position.set(0.15, 0.2, 0);
        rightHorn.rotation.z = -0.4;
        rightHorn.rotation.x = -0.3;
        headGroup.add(rightHorn);

        // Eyes
        const eyeGeo = new THREE.PlaneGeometry(0.1, 0.05);
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.1, 0.05, 0.21);
        headGroup.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.1, 0.05, 0.21);
        headGroup.add(rightEye);

        // Ears
        const earGeo = new THREE.ConeGeometry(0.06, 0.4, 4);
        earGeo.rotateZ(Math.PI / 2);
        const leftEar = new THREE.Mesh(earGeo, skinMat);
        leftEar.position.set(-0.25, 0, 0);
        headGroup.add(leftEar);
        const rightEar = new THREE.Mesh(earGeo, skinMat);
        rightEar.position.set(0.25, 0, 0);
        rightEar.rotation.z = Math.PI;
        headGroup.add(rightEar);

        // 3. Arms (Longer)
        const armGeo = new THREE.BoxGeometry(0.15, 0.65, 0.15);
        armGeo.translate(0, -0.25, 0); 

        // Left Arm (Holding Skull)
        const lArmGroup = new THREE.Group();
        lArmGroup.position.set(-0.4, 0.3, 0);
        torso.add(lArmGroup);
        const lArm = new THREE.Mesh(armGeo, skinMat);
        lArmGroup.add(lArm);
        parts.armL = lArmGroup;

        // Held Skull (Left Hand)
        const handSkullGroup = new THREE.Group();
        handSkullGroup.position.set(0, -0.6, 0.1);
        lArmGroup.add(handSkullGroup);
        const skullGeo = new THREE.IcosahedronGeometry(0.12, 0);
        const handSkull = new THREE.Mesh(skullGeo, boneMat);
        handSkullGroup.add(handSkull);

        // Right Arm (Holding Staff)
        const rArmGroup = new THREE.Group();
        rArmGroup.position.set(0.4, 0.3, 0);
        torso.add(rArmGroup);
        const rArm = new THREE.Mesh(armGeo, skinMat);
        rArmGroup.add(rArm);
        parts.armR = rArmGroup;

        // --- Staff Construction ---
        const staffGroup = new THREE.Group();
        staffGroup.position.set(0, -0.5, 0.1); // In hand
        rArmGroup.add(staffGroup);

        // Staff Pole
        const poleGeo = new THREE.CylinderGeometry(0.04, 0.03, 1.8);
        const pole = new THREE.Mesh(poleGeo, woodMat);
        pole.position.y = 0.2; // Center offset
        staffGroup.add(pole);

        // Staff Skull Topper
        const staffSkull = new THREE.Mesh(skullGeo, boneMat);
        staffSkull.position.y = 1.15; // Top of pole
        staffGroup.add(staffSkull);
        
        // Feathers/Decoration on staff
        const featherGeo = new THREE.BoxGeometry(0.02, 0.3, 0.1);
        const feather = new THREE.Mesh(featherGeo, furMat);
        feather.position.set(0.1, 1.0, 0);
        feather.rotation.z = -0.5;
        staffGroup.add(feather);

        // 4. Hips & Loincloth
        const hipsGeo = new THREE.BoxGeometry(0.55, 0.25, 0.35);
        const hips = new THREE.Mesh(hipsGeo, furMat); // Fur texture for loincloth
        hips.position.y = -0.45;
        torso.add(hips);

        // 5. Legs (Longer)
        const legGeo = new THREE.BoxGeometry(0.18, 0.75, 0.18);
        legGeo.translate(0, -0.35, 0); 

        // Left Leg
        const lLegGroup = new THREE.Group();
        lLegGroup.position.set(-0.18, -0.1, 0);
        hips.add(lLegGroup);
        const lLeg = new THREE.Mesh(legGeo, skinMat);
        lLegGroup.add(lLeg);
        // Fur Boots
        const bootGeo = new THREE.BoxGeometry(0.22, 0.25, 0.22);
        const lBoot = new THREE.Mesh(bootGeo, furMat);
        lBoot.position.set(0, -0.6, 0);
        lLegGroup.add(lBoot);
        parts.legL = lLegGroup;

        // Right Leg
        const rLegGroup = new THREE.Group();
        rLegGroup.position.set(0.18, -0.1, 0);
        hips.add(rLegGroup);
        const rLeg = new THREE.Mesh(legGeo, skinMat);
        rLegGroup.add(rLeg);
        // Fur Boots
        const rBoot = new THREE.Mesh(bootGeo, furMat);
        rBoot.position.set(0, -0.6, 0);
        rLegGroup.add(rBoot);
        parts.legR = rLegGroup;

        return { group: shamanGroup, parts: parts };
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return;
        
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        if (this.state !== ShamanState.PATROL) {
            this.state = ShamanState.PATROL;
            this.findPatrolPoint();
        }

        let currentSpeed = (this.stateTimer > 4.0 && this.stateTimer < 6.0) ? 0 : this.moveSpeedVal;

        if (currentSpeed > 0) {
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) {
                this.findPatrolPoint();
                this.stateTimer = 0;
            }

            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;

            if (toTarget.length() > 0.1) {
                this.rotationY += (Math.atan2(toTarget.x, toTarget.z) - this.rotationY) * 3.0 * dt; // Slower turning
                
                const step = currentSpeed * dt;
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));

                if (PlayerUtils.isWithinBounds(nextPos) && !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) {
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
            }

            this.walkTime += dt * currentSpeed;

            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) {
                    this.findPatrolPoint();
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
        const time = this.walkTime * 4.0; 

        if (moveSpeed > 0) {
            // --- Walking Animation ---
            
            // Legs (Standard walk cycle)
            if (parts.legL) parts.legL.rotation.x = Math.sin(time) * 0.4;
            if (parts.legR) parts.legR.rotation.x = Math.sin(time + Math.PI) * 0.4;

            // Left Arm (Holding Skull - swings naturally)
            if (parts.armL) {
                parts.armL.rotation.x = Math.sin(time + Math.PI) * 0.4;
                parts.armL.rotation.z = 0.2; // Held out slightly
            }

            // Right Arm (Holding Staff - moves less, acts as stabilizer)
            if (parts.armR) {
                // Staff hits ground or stays relatively steady
                parts.armR.rotation.x = Math.sin(time) * 0.2 - 0.2; 
                parts.armR.rotation.z = -0.1;
            }

            // Bobbing
            if (parts.torso) {
                parts.torso.position.y = 1.2 + Math.abs(Math.sin(time)) * 0.03;
                parts.torso.rotation.z = Math.cos(time) * 0.02; // Slight sway
            }

        } else {
            // --- Idle Animation ---
            const breath = Math.sin(this.stateTimer * 1.5) * 0.02;
            
            // Legs reset
            if (parts.legL) parts.legL.rotation.x = THREE.MathUtils.lerp(parts.legL.rotation.x, 0, dt * 5);
            if (parts.legR) parts.legR.rotation.x = THREE.MathUtils.lerp(parts.legR.rotation.x, 0, dt * 5);
            
            // Arms
            if (parts.armL) {
                // Lift skull slightly during idle
                parts.armL.rotation.x = THREE.MathUtils.lerp(parts.armL.rotation.x, -0.2 + breath, dt * 5);
                parts.armL.rotation.z = 0.2;
            }
            if (parts.armR) {
                // Plant staff
                parts.armR.rotation.x = THREE.MathUtils.lerp(parts.armR.rotation.x, 0, dt * 5);
            }

            // Head Looking
            if (parts.head) {
                parts.head.rotation.y = Math.sin(this.stateTimer * 0.3) * 0.3; // Scans area
                parts.head.rotation.x = Math.sin(this.stateTimer * 0.7) * 0.05;
            }
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);

        const skinMesh = this.model.parts.torso;
        if (skinMesh && skinMesh.material) {
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
        this.state = ShamanState.DEAD;
        this.healthBarGroup.visible = false;
        
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'cloth'; // Drops cloth/fur

        // Dramatic death: Fall backwards
        this.group.rotation.x = -Math.PI / 2;
        this.group.position.y = 0.3;
        this.hitbox.position.y = -0.5;
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0x333333);
            }
        });
    }
}