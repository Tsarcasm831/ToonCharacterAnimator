import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { AIUtils } from '../../../core/AIUtils';

export enum YetiState { IDLE, PATROL, DEAD }

export class Yeti {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any; // Holds parts: body, head, armL, armR, legL, legR, shinL, shinR
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
    private collisionSize = new THREE.Vector3(2.0, 3.5, 2.0); 
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

        // Align model so feet rest on ground and derive collision size from actual geometry
        const bbox = new THREE.Box3().setFromObject(this.model.group);
        const size = bbox.getSize(new THREE.Vector3());
        if (isFinite(bbox.min.y)) {
            this.model.group.position.y -= bbox.min.y;
            this.collisionSize.set(Math.max(1.8, size.x), size.y, Math.max(1.8, size.z));
        }

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
        const barHeight = Math.max(4.2, bbox.max.y + 0.8);
        this.healthBarGroup.position.set(0, barHeight, 0); // Higher for biped
        
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
            legGroup.position.set(xOffset, -0.9, 0); // Hip position relative to torso
            torso.add(legGroup);

            // Thigh
            const thighGeo = new THREE.BoxGeometry(0.5, 1.0, 0.5);
            const thigh = new THREE.Mesh(thighGeo, furMat);
            // Center of thigh mesh is at 0,0,0. Since height is 1.0, 
            // the top is at +0.5, bottom at -0.5.
            thigh.position.y = -0.5; 
            legGroup.add(thigh);

            // Shin Group (Knee Pivot)
            const shinGroup = new THREE.Group();
            // Attach knee exactly at the bottom of the thigh mesh (-0.5)
            shinGroup.position.y = -0.5; 
            thigh.add(shinGroup);

            // Store reference for animation
            if (isLeft) parts.shinL = shinGroup;
            else parts.shinR = shinGroup;

            // Shin Mesh
            const shinGeo = new THREE.BoxGeometry(0.45, 0.9, 0.45);
            const shin = new THREE.Mesh(shinGeo, furMat);
            // Center of shin mesh is 0,0,0. Height is 0.9.
            // We want top of shin to be at pivot (0,0,0).
            shin.position.y = -0.45; 
            shinGroup.add(shin);

            // Foot
            const footGeo = new THREE.BoxGeometry(0.5, 0.2, 0.7);
            const foot = new THREE.Mesh(footGeo, skinMat);
            // Foot attached to bottom of shin (-0.9 relative to knee)
            foot.position.set(0, -0.9, 0.1); 
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
            this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, 3.0);
            const avoidanceRot = AIUtils.getAdvancedAvoidanceSteering(this.position, this.rotationY, this.collisionSize, environment.obstacles);
            this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, 5.0);

            const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, moveSpeed, dt, this.collisionSize, environment.obstacles);
            this.position.x = nextPos.x;
            this.position.z = nextPos.z;
        }
        
        this.walkTime += dt * moveSpeed;
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
        } else {
            this.stuckTimer = 0;
            this.lastStuckPos.copy(this.position);
        }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z) + 0.1;
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
        const time = this.walkTime * 3.0; // Speed up animation slightly for better feel

        if (moveSpeed > 0) {
            // Bipedal Walk Cycle
            const stride = 0.6; // Leg swing amplitude
            const kneeBend = 0.8; // Knee flexibility
            const armSwing = 0.5; // Arm swing amplitude

            // Legs: Inverse of each other
            if (parts.legL) parts.legL.rotation.x = Math.sin(time) * stride;
            if (parts.legR) parts.legR.rotation.x = Math.sin(time + Math.PI) * stride;

            // Knees: Bend when leg lifts (using sine wave offset)
            if (parts.shinL) {
                const val = Math.sin(time);
                parts.shinL.rotation.x = val > 0 ? val * kneeBend : 0;
            }
            if (parts.shinR) {
                const val = Math.sin(time + Math.PI);
                parts.shinR.rotation.x = val > 0 ? val * kneeBend : 0;
            }

            // Arms: Opposite to legs (Right leg forward = Left arm forward)
            if (parts.armL) parts.armL.rotation.x = Math.sin(time + Math.PI) * armSwing;
            if (parts.armR) parts.armR.rotation.x = Math.sin(time) * armSwing;
            
            // Body Bob
            if (parts.body) {
                parts.body.position.y = 2.0 + Math.sin(time * 2) * 0.05; // Bob twice per cycle
                parts.body.rotation.z = Math.cos(time) * 0.05; // Slight sway
            }

        } else {
            // Idle Animation (Breathing/Intimidating)
            const breath = Math.sin(this.stateTimer * 2.0) * 0.05;
            const resetSpeed = dt * 5;
            
            // Reset Rotations
            if (parts.legL) parts.legL.rotation.x = THREE.MathUtils.lerp(parts.legL.rotation.x, 0, resetSpeed);
            if (parts.legR) parts.legR.rotation.x = THREE.MathUtils.lerp(parts.legR.rotation.x, 0, resetSpeed);

            if (parts.shinL) parts.shinL.rotation.x = THREE.MathUtils.lerp(parts.shinL.rotation.x, 0, resetSpeed);
            if (parts.shinR) parts.shinR.rotation.x = THREE.MathUtils.lerp(parts.shinR.rotation.x, 0, resetSpeed);
            
            // Arms hang loose but breath
            if (parts.armL) {
                parts.armL.rotation.x = THREE.MathUtils.lerp(parts.armL.rotation.x, 0, resetSpeed);
                parts.armL.rotation.z = 0.1 + breath; // Breathe out slightly
            }
            if (parts.armR) {
                parts.armR.rotation.x = THREE.MathUtils.lerp(parts.armR.rotation.x, 0, resetSpeed);
                parts.armR.rotation.z = -0.1 - breath;
            }

            if (parts.body) {
                parts.body.position.y = THREE.MathUtils.lerp(parts.body.position.y, 2.0, resetSpeed);
                parts.body.scale.set(1 + breath*0.5, 1 + breath*0.5, 1 + breath*0.8); // Chest heaving
                parts.body.rotation.z = THREE.MathUtils.lerp(parts.body.rotation.z, 0, resetSpeed);
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
