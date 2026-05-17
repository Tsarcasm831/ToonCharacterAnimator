import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { PlayerUtils } from '../../../player/PlayerUtils';
import { AIUtils } from '../../../core/AIUtils';

export enum PigState { IDLE, PATROL, FLEE, DEAD }

export class Pig {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: PigState = PigState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    maxHealth: number = 30;
    health: number = 30;
    hitbox: THREE.Group;
    
    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    private walkTime: number = 0;
    private moveSpeedVal: number = 1.8;
    private readonly collisionSize = new THREE.Vector3(1.0, 0.9, 1.5);
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastStuckPos.copy(this.position);

        // --- VISUAL OVERHAUL ---
        // Instead of calling ObjectFactory, we build a custom pig here to match the image
        const pigData = this.buildPigModel(); 
        
        this.group = new THREE.Group();
        this.group.add(pigData.group);
        this.model = pigData;

        this.hitbox = this.model.group;
        this.hitbox.userData = { type: 'creature', parent: this };
        
        // Propagate userData for raycasting
        this.hitbox.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.userData = { ...child.userData, type: 'creature', parent: this };
            }
        });

        // Health Bar Setup
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 1.8, 0); // Raised slightly higher for new model
        
        const bg = new THREE.Mesh(
            new THREE.PlaneGeometry(1.0, 0.15),
            new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide })
        );
        this.healthBarGroup.add(bg);
        
        const fgGeo = new THREE.PlaneGeometry(0.96, 0.11);
        fgGeo.translate(0.48, 0, 0);
        this.healthBarFill = new THREE.Mesh(
            fgGeo,
            new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide })
        );
        this.healthBarFill.position.set(-0.48, 0, 0.01);
        this.healthBarGroup.add(this.healthBarFill);
        this.group.add(this.healthBarGroup);

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    /**
     * Constructs a detailed pig mesh matching the reference image.
     * Includes: Snout, Ears, Hooves, Tail, and Pivot Joints.
     */
    private buildPigModel() {
        const pigGroup = new THREE.Group();
        
        // Colors derived from the image
        const skinColor = 0xE0C8C0; // Pale pinkish-beige
        const hoofColor = 0x3D2E25; // Dark muddy brown
        const eyeColor = 0x1a1a1a;
        
        const material = new THREE.MeshLambertMaterial({ color: skinColor });
        const hoofMaterial = new THREE.MeshLambertMaterial({ color: hoofColor });
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: eyeColor });

        // 1. MAIN BODY (The "Barrel")
        const bodyGeo = new THREE.BoxGeometry(0.9, 0.9, 1.7);
        const bodyMesh = new THREE.Mesh(bodyGeo, material);
        bodyMesh.position.y = 0.8; // Lift body off ground
        bodyMesh.castShadow = true;
        pigGroup.add(bodyMesh);

        // 2. HEAD GROUP (Attached to Body)
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.3, 0.85);
        bodyMesh.add(headGroup);

        const headGeo = new THREE.BoxGeometry(0.75, 0.7, 0.8);
        const headMesh = new THREE.Mesh(headGeo, material);
        headMesh.position.set(0, 0, 0.3);
        headGroup.add(headMesh);

        const snoutGeo = new THREE.BoxGeometry(0.35, 0.25, 0.15);
        const snoutMesh = new THREE.Mesh(snoutGeo, material);
        snoutMesh.position.set(0, -0.1, 0.45);
        headMesh.add(snoutMesh);
        
        const nostrilGeo = new THREE.BoxGeometry(0.06, 0.06, 0.05);
        const nostrilL = new THREE.Mesh(nostrilGeo, new THREE.MeshLambertMaterial({color: 0x8b5a5a}));
        const nostrilR = new THREE.Mesh(nostrilGeo, new THREE.MeshLambertMaterial({color: 0x8b5a5a}));
        nostrilL.position.set(0.1, 0, 0.06);
        nostrilR.position.set(-0.1, 0, 0.06);
        snoutMesh.add(nostrilL);
        snoutMesh.add(nostrilR);

        const earGeo = new THREE.BoxGeometry(0.15, 0.25, 0.05);
        const earL = new THREE.Mesh(earGeo, material);
        earL.position.set(0.28, 0.4, 0.1);
        earL.rotation.z = -0.2;
        earL.rotation.x = 0.2;
        headMesh.add(earL);

        const earR = new THREE.Mesh(earGeo, material);
        earR.position.set(-0.28, 0.4, 0.1);
        earR.rotation.z = 0.2;
        earR.rotation.x = 0.2;
        headMesh.add(earR);

        const eyeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.02);
        const eyeL = new THREE.Mesh(eyeGeo, eyeMaterial);
        eyeL.position.set(0.38, 0.1, 0.2);
        headMesh.add(eyeL);

        const eyeR = new THREE.Mesh(eyeGeo, eyeMaterial);
        eyeR.position.set(-0.38, 0.1, 0.2);
        headMesh.add(eyeR);

        // 3. LEGS (With Pivot Points and Hooves)
        const createLeg = (x: number, z: number) => {
            const legGroup = new THREE.Group();
            legGroup.position.set(x, -0.3, z);

            const legGeo = new THREE.BoxGeometry(0.25, 0.5, 0.25);
            const legMesh = new THREE.Mesh(legGeo, material);
            legMesh.position.y = -0.25;
            legMesh.castShadow = true;
            
            const hoofGeo = new THREE.BoxGeometry(0.24, 0.12, 0.24);
            const hoofMesh = new THREE.Mesh(hoofGeo, hoofMaterial);
            hoofMesh.position.y = -0.3;
            legMesh.add(hoofMesh);

            legGroup.add(legMesh);
            return legGroup;
        };

        const legFL = createLeg(0.3, 0.6);
        const legFR = createLeg(-0.3, 0.6);
        const legBL = createLeg(0.3, -0.6);
        const legBR = createLeg(-0.3, -0.6);

        bodyMesh.add(legFL);
        bodyMesh.add(legFR);
        bodyMesh.add(legBL);
        bodyMesh.add(legBR);

        // 4. TAIL (Curled)
        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.2, -0.85);
        const tailGeo = new THREE.TorusGeometry(0.1, 0.03, 8, 12, Math.PI * 1.5);
        const tailMesh = new THREE.Mesh(tailGeo, material);
        tailMesh.rotation.y = Math.PI / 2;
        tailMesh.rotation.z = Math.PI / 4;
        tailGroup.add(tailMesh);
        bodyMesh.add(tailGroup);

        return {
            group: pigGroup,
            parts: {
                body: bodyMesh,
                head: headGroup,
                legFL: legFL,
                legFR: legFR,
                legBL: legBL,
                legBR: legBR
            }
        };
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return;
        this.stateTimer += dt;

        if (this.state !== PigState.PATROL) { this.state = PigState.PATROL; this.findPatrolPoint(); }

        let currentSpeed = (this.stateTimer > 4.0 && this.stateTimer < 9.0) ? 0 : this.moveSpeedVal;

        if (currentSpeed > 0) {
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 15.0) {
                this.findPatrolPoint();
                this.stateTimer = 0;
            }

            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;

            if (toTarget.length() > 0.1) {
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, 3.0);
                const avoidanceRot = AIUtils.getAdvancedAvoidanceSteering(this.position, this.rotationY, this.collisionSize, environment.obstacles);
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, 6.0);
                
                const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, currentSpeed, dt, this.collisionSize, environment.obstacles);
                this.position.x = nextPos.x;
                this.position.z = nextPos.z;
            }
            this.walkTime += dt * currentSpeed;

            if (this.position.distanceTo(this.lastStuckPos) < 0.001) {
                this.stuckTimer += dt;
                if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; }
            } else {
                this.stuckTimer = 0;
                this.lastStuckPos.copy(this.position);
            }
        } else {
            this.stuckTimer = 0;
            this.lastStuckPos.copy(this.position);
        }

        // Slightly lift pig so hooves don't clip through ground
        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z) + 0.1;
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() {
        const range = 20;
        this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range);
        if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0);
    }

    private animate(dt: number, currentSpeed: number) {
        const parts = this.model.parts;
        if (!parts) return; // Safety check

        if (currentSpeed > 0) {
            const legSwing = Math.sin(this.walkTime * 8.0) * 0.5;

            if(parts.legFR) parts.legFR.rotation.x = legSwing;
            if(parts.legBL) parts.legBL.rotation.x = legSwing;
            if(parts.legFL) parts.legFL.rotation.x = -legSwing;
            if(parts.legBR) parts.legBR.rotation.x = -legSwing;
            
            if(parts.head) parts.head.rotation.x = 0;
            if(parts.body) parts.body.rotation.z = Math.cos(this.walkTime * 8.0) * 0.05; 

        } else {
            if(parts.head) {
                parts.head.rotation.x = (this.stateTimer > 4.5 && this.stateTimer < 8.5) 
                    ? 0.3 + (Math.sin(this.stateTimer * 10.0) * 0.05) 
                    : 0;
            }
            
            const breath = Math.sin(this.stateTimer * 3.0) * 0.01;
            if(parts.body) {
                parts.body.scale.set(1 + breath, 1 + breath, 1 + breath);
                parts.body.rotation.z = 0;
            }
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);
        
        // Flash red
        if(this.model.parts.body.material) {
            this.model.parts.body.material.emissive.setHex(0xff0000);
            this.model.parts.body.material.emissiveIntensity = 0.5;
        }
        
        if (this.health <= 0) this.die();
        else setTimeout(() => {
            if (!this.isDead && this.model.parts.body.material) this.model.parts.body.material.emissiveIntensity = 0;
        }, 100);
    }

    private die() { 
        this.isDead = true; 
        this.state = PigState.DEAD; 
        this.healthBarGroup.visible = false; 
        
        this.hitbox.userData.isSkinnable = true; 
        this.hitbox.userData.material = 'pork'; 
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = true;
            child.userData.material = 'pork';
        });

        // Rotate the whole group to simulate falling over
        this.model.group.rotation.z = Math.PI / 2; 
        this.model.group.position.y = 0.4; 
    }

    markAsSkinned() { 
        this.isSkinned = true; 
        this.hitbox.userData.isSkinnable = false; 
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = false;
        });

        // Change color to represent skinned meat
        this.model.group.traverse((obj: any) => { 
            if (obj.isMesh && obj.material) { 
                obj.material = obj.material.clone(); 
                obj.material.color.setHex(0x8B4513); 
            } 
        }); 
    }
}