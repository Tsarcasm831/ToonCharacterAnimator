import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum YetiState { IDLE, PATROL, DEAD }

export class Yeti {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any; // Holds parts: body, head, armL, armR, legL, legR
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: YetiState = YetiState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    maxHealth: number = 100;
    health: number = 100;
    hitbox: THREE.Group;
    
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    private walkTime: number = 0;
    private moveSpeedVal: number = 2.5;
    
    // Adjusted collision for a large biped
    private readonly collisionSize = new THREE.Vector3(2.0, 3.5, 2.0); 
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    // Visual Constants based on the image
    private readonly furColor = 0x3E3228; // Dark Brown/Grey
    private readonly skinColor = 0x2A1F18; // Darker skin for chest/face
    private readonly clawColor = 0xC0B090; // Bone color

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastStuckPos.copy(this.position);

        // 1. Build the Custom Yeti Model (Bipedal, Bulky)
        this.group = new THREE.Group();
        this.model = this.buildYetiModel();
        this.group.add(this.model.group);

        // 2. Setup Hitbox
        this.hitbox = this.model.group;
        this.hitbox.userData = { type: 'creature', parent: this };
        this.hitbox.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.userData = { ...child.userData, type: 'creature', parent: this };
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // 3. Health Bar
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 4.2, 0); // Higher for biped
        
        const bg = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.2), 
            new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })
        );
        this.healthBarGroup.add(bg);
        
        const fgGeo = new THREE.PlaneGeometry(1.46, 0.16);
        fgGeo.translate(0.73, 0, 0);
        this.healthBarFill = new THREE.Mesh(
            fgGeo, 
            new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })
        );
        this.healthBarFill.position.set(-0.73, 0, 0.01);
        this.healthBarGroup.add(this.healthBarFill);
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    private buildYetiModel(): any {
        const parts: any = {};
        const group = new THREE.Group();

        // Materials
        const furMat = new THREE.MeshStandardMaterial({ color: this.furColor, roughness: 0.9 });
        const skinMat = new THREE.MeshStandardMaterial({ color: this.skinColor, roughness: 0.7 });
        const clawMat = new THREE.MeshStandardMaterial({ color: this.clawColor, roughness: 0.4 });

        // --- Torso (Bulky, hunchback) ---
        const torsoGeo = new THREE.BoxGeometry(1.4, 1.8, 1.0);
        const torso = new THREE.Mesh(torsoGeo, furMat);
        torso.position.y = 2.0; // Legs will be below
        torso.castShadow = true;
        group.add(torso);
        parts.body = torso;

        // Chest/Pec muscle definition (Skin color patch)
        const chestGeo = new THREE.BoxGeometry(1.0, 0.8, 0.2);
        const chest = new THREE.Mesh(chestGeo, skinMat);
        chest.position.set(0, 0.3, 0.45);
        torso.add(chest);

        // --- Head (Low set, aggressive) ---
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.0, 0.4); // Hunch forward
        torso.add(headGroup);
        parts.head = headGroup;

        // Skull
        const skullGeo = new THREE.BoxGeometry(0.7, 0.7, 0.8);
        const skull = new THREE.Mesh(skullGeo, furMat);
        headGroup.add(skull);

        // Face (Skin)
        const faceGeo = new THREE.BoxGeometry(0.5, 0.4, 0.1);
        const face = new THREE.Mesh(faceGeo, skinMat);
        face.position.set(0, -0.05, 0.41);
        headGroup.add(face);

        // Brow Ridge / Mane
        const browGeo = new THREE.BoxGeometry(0.75, 0.2, 0.9);
        const brow = new THREE.Mesh(browGeo, furMat);
        brow.position.set(0, 0.3, 0);
        headGroup.add(brow);

        // Eyes (Glowing)
        const eyeGeo = new THREE.BoxGeometry(0.08, 0.05, 0.05);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(0.15, 0.0, 0.46);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(-0.15, 0.0, 0.46);
        headGroup.add(eyeL);
        headGroup.add(eyeR);

        // Teeth/Tusks
        const tuskGeo = new THREE.ConeGeometry(0.04, 0.15, 4);
        const tuskL = new THREE.Mesh(tuskGeo, clawMat);
        tuskL.position.set(0.15, -0.3, 0.4);
        tuskL.rotation.x = Math.PI;
        const tuskR = tuskL.clone();
        tuskR.position.set(-0.15, -0.3, 0.4);
        headGroup.add(tuskL);
        headGroup.add(tuskR);


        // --- Arms (Long, Gorilla-like) ---
        const createArm = (isLeft: boolean) => {
            const armGroup = new THREE.Group();
            const xOffset = isLeft ? 0.8 : -0.8;
            armGroup.position.set(xOffset, 0.6, 0); // Shoulder position
            torso.add(armGroup);

            // Upper Arm
            const uArmGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
            const uArm = new THREE.Mesh(uArmGeo, furMat);
            uArm.position.y = -0.6;
            armGroup.add(uArm);

            // Forearm
            const fArmGroup = new THREE.Group();
            fArmGroup.position.y = -1.1; // Elbow
            uArm.add(fArmGroup);

            const fArmGeo = new THREE.BoxGeometry(0.45, 1.1, 0.45);
            const fArm = new THREE.Mesh(fArmGeo, furMat);
            fArm.position.y = -0.5;
            fArmGroup.add(fArm);

            // Hand (Large)
            const handGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const hand = new THREE.Mesh(handGeo, skinMat);
            hand.position.y = -1.2;
            fArmGroup.add(hand);

            // Claws
            for(let i=0; i<3; i++) {
                const claw = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 4), clawMat);
                claw.rotation.x = -Math.PI / 4;
                claw.position.set((i-1)*0.12, -0.2, 0.1);
                hand.add(claw);
            }

            return armGroup;
        };

        parts.armL = createArm(true);
        parts.armR = createArm(false);

        // --- Legs (Stout, Short) ---
        const createLeg = (isLeft: boolean) => {
            const legGroup = new THREE.Group();
            const xOffset = isLeft ? 0.4 : -0.4;
            legGroup.position.set(xOffset, -0.9, 0); // Hip position
            torso.add(legGroup);

            // Thigh
            const thighGeo = new THREE.BoxGeometry(0.5, 1.0, 0.5);
            const thigh = new THREE.Mesh(thighGeo, furMat);
            thigh.position.y = -0.5;
            legGroup.add(thigh);

            // Shin
            const shinGroup = new THREE.Group();
            shinGroup.position.y = -1.0; // Knee
            thigh.add(shinGroup);

            const shinGeo = new THREE.BoxGeometry(0.45, 0.9, 0.45);
            const shin = new THREE.Mesh(shinGeo, furMat);
            shin.position.y = -0.45;
            shinGroup.add(shin);

            // Foot
            const footGeo = new THREE.BoxGeometry(0.5, 0.2, 0.7);
            const foot = new THREE.Mesh(footGeo, skinMat);
            foot.position.set(0, -1.0, 0.1);
            shinGroup.add(foot);

            return legGroup;
        };

        parts.legL = createLeg(true);
        parts.legR = createLeg(false);

        return { group, parts };
    }

    update(dt: number, environment: Environment, skipAnimation: boolean = false) {
        if (this.isDead) return;
        this.stateTimer += dt;

        if (this.state !== YetiState.PATROL) {
            this.state = YetiState.PATROL;
            this.findPatrolPoint();
        }

        let moveSpeed = this.moveSpeedVal;

        // Pathfinding / Movement Logic
        if (this.position.distanceTo(this.targetPos) < 1.5 || this.stateTimer > 15.0) {
            this.findPatrolPoint();
            this.stateTimer = 0;
        }

        const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
        toTarget.y = 0;

        if (toTarget.length() > 0.1) {
            // Smooth rotation
            const targetRotation = Math.atan2(toTarget.x, toTarget.z);
            let rotDiff = targetRotation - this.rotationY;
            // Normalize angle
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            
            this.rotationY += rotDiff * 5.0 * dt;

            const nextPos = this.position.clone().add(
                new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(moveSpeed * dt)
            );

            if (PlayerUtils.isWithinBounds(nextPos) && 
                !PlayerUtils.checkBoxCollision(nextPos, this.collisionSize, environment.obstacles)) {
                this.position.x = nextPos.x;
                this.position.z = nextPos.z;
            }
        }

        this.walkTime += dt * moveSpeed;

        // Stuck detection
        if (moveSpeed > 0) {
            if (this.position.distanceTo(this.lastStuckPos) < 0.01) {
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
        this.animate(dt, moveSpeed);
    }

    private findPatrolPoint() {
        const range = 25;
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
        const time = this.walkTime * 2.0; // Speed up animation slightly

        if (moveSpeed > 0) {
            // Bipedal Walk Cycle
            const stride = 0.5; // Leg swing amplitude
            const armSwing = 0.4; // Arm swing amplitude

            // Legs: Inverse of each other
            if (parts.legL) parts.legL.rotation.x = Math.sin(time) * stride;
            if (parts.legR) parts.legR.rotation.x = Math.sin(time + Math.PI) * stride;

            // Arms: Opposite to legs (Right leg forward = Left arm forward)
            if (parts.armL) parts.armL.rotation.x = Math.sin(time + Math.PI) * armSwing;
            if (parts.armR) parts.armR.rotation.x = Math.sin(time) * armSwing;
            
            // Body Bob
            if (parts.body) {
                parts.body.position.y = 2.0 + Math.abs(Math.sin(time)) * 0.1;
                parts.body.rotation.z = Math.sin(time) * 0.05; // Slight sway
            }

        } else {
            // Idle Animation (Breathing/Intimidating)
            const breath = Math.sin(this.stateTimer * 2.0) * 0.05;
            
            // Reset Rotations
            if (parts.legL) parts.legL.rotation.x = THREE.MathUtils.lerp(parts.legL.rotation.x, 0, dt * 5);
            if (parts.legR) parts.legR.rotation.x = THREE.MathUtils.lerp(parts.legR.rotation.x, 0, dt * 5);
            
            // Arms hang loose but breath
            if (parts.armL) {
                parts.armL.rotation.x = THREE.MathUtils.lerp(parts.armL.rotation.x, 0, dt * 5);
                parts.armL.rotation.z = 0.1 + breath; // Breathe out slightly
            }
            if (parts.armR) {
                parts.armR.rotation.x = THREE.MathUtils.lerp(parts.armR.rotation.x, 0, dt * 5);
                parts.armR.rotation.z = -0.1 - breath;
            }

            if (parts.body) {
                parts.body.position.y = 2.0;
                parts.body.scale.set(1 + breath*0.5, 1 + breath*0.5, 1 + breath*0.8); // Chest heaving
            }
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);
        
        // Flash red
        this.model.group.traverse((child: any) => {
            if (child.isMesh && child.material && child.material.emissive) {
                child.material.emissive.setHex(0xff0000);
                child.material.emissiveIntensity = 0.5;
            }
        });

        if (this.health <= 0) {
            this.die();
        } else {
            setTimeout(() => {
                if (!this.isDead) {
                     this.model.group.traverse((child: any) => {
                        if (child.isMesh && child.material && child.material.emissive) {
                            child.material.emissiveIntensity = 0;
                        }
                    });
                }
            }, 100);
        }
    }

    private die() {
        this.isDead = true;
        this.state = YetiState.DEAD;
        this.healthBarGroup.visible = false;
        
        // Make skinnable
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'thick_dark_fur'; // Updated material name
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = true;
            child.userData.material = 'thick_dark_fur';
        });

        // Fall over logic (Face down or back)
        const fallAnim = () => {
             if (this.model.group.rotation.x < Math.PI / 2) {
                 this.model.group.rotation.x += 0.1;
                 this.model.group.position.y = Math.max(0.5, this.model.group.position.y - 0.1);
                 requestAnimationFrame(fallAnim);
             }
        }
        fallAnim();
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = false;
        });

        // Visually represent skinned state (Red/Bloody)
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(0x550000); // Dark red meat color
                obj.material.roughness = 0.3; // Wet look
            }
        });
    }
}