import * as THREE from 'three';
import { Environment } from '../../../environment/Environment';
import { AIUtils } from '../../../core/AIUtils';
import { PlayerUtils } from '../../../player/PlayerUtils';

export enum DeerState { IDLE, PATROL, FLEE, DEAD }

export class Deer {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: DeerState = DeerState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    isDead: boolean = false;
    isSkinned: boolean = false;
    maxHealth: number = 35;
    health: number = 35;
    hitbox: THREE.Group;
    isMale: boolean;

    private healthBarGroup: THREE.Group;
    private healthBarFill: THREE.Mesh;
    private walkTime: number = 0;
    private moveSpeedVal: number = 2.2;
    private isFleeing: boolean = false;
    private readonly collisionSize = new THREE.Vector3(0.8, 1.8, 1.8);
    private stuckTimer: number = 0;
    private lastStuckPos: THREE.Vector3 = new THREE.Vector3();

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, isMale: boolean = Math.random() > 0.5) {
        this.scene = scene;
        this.position.copy(initialPos);
        this.lastStuckPos.copy(this.position);
        this.isMale = isMale;

        const deerData = this.isMale ? this.createBuckModel() : this.createDoeModel();

        this.group = new THREE.Group();
        this.group.add(deerData.group);
        this.model = deerData;
        this.hitbox = this.model.group;

        this.hitbox.userData = { type: 'creature', parent: this, species: 'deer', gender: this.isMale ? 'male' : 'female' };
        this.hitbox.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.userData = { ...child.userData, type: 'creature', parent: this };
            }
        });

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.set(0, 3.2, 0);
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

    // --- HELPER: Create Segmented Leg ---
    // Creates an Upper Leg -> Lower Leg -> Hoof hierarchy with proper pivot points
    private createLeg(parent: THREE.Object3D, x: number, y: number, z: number, mat: THREE.Material, hoofMat: THREE.Material, partsStore: any, name: string) {
        // Upper Leg (Thigh/Shoulder)
        // Geo translated down so origin is at the top (The Hip/Shoulder joint)
        const upperLen = 0.7;
        const upperGeo = new THREE.CylinderGeometry(0.14, 0.11, upperLen, 6);
        upperGeo.translate(0, -upperLen / 2, 0); 
        const upperLeg = new THREE.Mesh(upperGeo, mat);
        upperLeg.position.set(x, y, z);
        upperLeg.castShadow = true;
        parent.add(upperLeg);

        // Lower Leg (Shin/Forearm)
        const lowerLen = 0.7;
        const lowerGeo = new THREE.CylinderGeometry(0.10, 0.08, lowerLen, 6);
        lowerGeo.translate(0, -lowerLen / 2, 0); // Origin at Knee/Elbow
        const lowerLeg = new THREE.Mesh(lowerGeo, mat);
        lowerLeg.position.y = -upperLen + 0.05; // Attach to bottom of upper
        upperLeg.add(lowerLeg);

        // Hoof
        const hoofGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.15, 6);
        hoofGeo.translate(0, -0.075, 0); // Origin at Ankle
        const hoof = new THREE.Mesh(hoofGeo, hoofMat);
        hoof.position.y = -lowerLen;
        lowerLeg.add(hoof);

        // Store references for animation
        partsStore[name + '_upper'] = upperLeg;
        partsStore[name + '_lower'] = lowerLeg;
        partsStore[name + '_hoof'] = hoof;
    }

    private createBuckModel(): { group: THREE.Group, parts: any } {
        const parts: any = {};
        const group = new THREE.Group();

        const coatColor = 0x8B5A2B;
        const whiteColor = 0xF0EAD6;
        const hoofColor = 0x333333;
        const antlerColor = 0xE3DAC9;

        const mainMat = new THREE.MeshLambertMaterial({ color: coatColor });
        const whiteMat = new THREE.MeshLambertMaterial({ color: whiteColor });
        const hoofMat = new THREE.MeshLambertMaterial({ color: hoofColor });
        const antlerMat = new THREE.MeshLambertMaterial({ color: antlerColor });

        // Body
        const bodyGeo = new THREE.BoxGeometry(1.1, 1.2, 2.2);
        parts.body = new THREE.Mesh(bodyGeo, mainMat);
        parts.body.position.y = 1.45;
        parts.body.castShadow = true;
        group.add(parts.body);

        // Belly
        const belly = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), whiteMat);
        belly.rotation.x = Math.PI / 2;
        belly.position.y = -0.61;
        parts.body.add(belly);

        // NECK FIX: Smoother transition
        // Using a cylinder that angles correctly from the chest
        const neckLen = 0.9;
        const neckGeo = new THREE.CylinderGeometry(0.3, 0.45, neckLen, 8);
        neckGeo.translate(0, neckLen / 2, 0); // Pivot at base
        const neck = new THREE.Mesh(neckGeo, mainMat);
        neck.position.set(0, 0.1, 0.9); // Start inside body
        neck.rotation.x = Math.PI / 4; // Angle up and forward
        parts.body.add(neck);

        const throat = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), whiteMat);
        throat.position.set(0, neckLen/2, 0.28);
        throat.rotation.y = Math.PI;
        throat.rotation.x = -Math.PI/12;
        neck.add(throat);

        // Head (Attached to end of neck)
        const headGeo = new THREE.BoxGeometry(0.5, 0.55, 0.8);
        parts.head = new THREE.Mesh(headGeo, mainMat);
        parts.head.position.set(0, neckLen, 0.1); // Sit on top of neck
        parts.head.rotation.x = -Math.PI/4; // Counter-rotate neck angle so head is level
        neck.add(parts.head);

        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), hoofMat);
        nose.position.set(0, -0.1, 0.5);
        parts.head.add(nose);

        // Ears
        const earGeo = new THREE.BoxGeometry(0.5, 0.2, 0.05);
        const earL = new THREE.Mesh(earGeo, mainMat);
        earL.position.set(0.4, 0.2, -0.2);
        earL.rotation.set(0, -0.3, 0.3);
        parts.head.add(earL);
        const earR = earL.clone();
        earR.position.x = -0.4;
        earR.rotation.set(0, 0.3, -0.3);
        parts.head.add(earR);

        // Antlers
        const antlerGroup = new THREE.Group();
        parts.head.add(antlerGroup);
        const beamGeo = new THREE.CylinderGeometry(0.04, 0.08, 1.2, 5);
        const beamL = new THREE.Mesh(beamGeo, antlerMat);
        beamL.position.set(0.25, 0.6, -0.2);
        beamL.rotation.set(-0.5, 0, 0.5);
        antlerGroup.add(beamL);
        const beamR = beamL.clone();
        beamR.position.x = -0.25;
        beamR.rotation.z = -0.5;
        antlerGroup.add(beamR);
        const tineGeo = new THREE.ConeGeometry(0.03, 0.4, 5);
        const addTine = (p: any, y: number, z: number) => {
            const t = new THREE.Mesh(tineGeo, antlerMat);
            t.position.y = y; t.rotation.z = z; p.add(t);
        };
        addTine(beamL, -0.3, -0.8); addTine(beamR, -0.3, 0.8);
        addTine(beamL, 0.1, -0.6); addTine(beamR, 0.1, 0.6);
        addTine(beamL, 0.4, -0.4); addTine(beamR, 0.4, 0.4);

        // SEGMENTED LEGS
        // Origin of legs is relative to body center
        this.createLeg(parts.body, 0.35, -0.3, 0.8, mainMat, hoofMat, parts, 'legFL');
        this.createLeg(parts.body, -0.35, -0.3, 0.8, mainMat, hoofMat, parts, 'legFR');
        this.createLeg(parts.body, 0.35, -0.3, -0.8, mainMat, hoofMat, parts, 'legBL');
        this.createLeg(parts.body, -0.35, -0.3, -0.8, mainMat, hoofMat, parts, 'legBR');

        // Tail
        parts.tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.4), mainMat);
        parts.tail.position.set(0, 0.5, -1.1);
        const tailWhite = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.38), whiteMat);
        tailWhite.rotation.x = Math.PI / 2; tailWhite.position.y = -0.06;
        parts.tail.add(tailWhite);
        parts.body.add(parts.tail);

        group.scale.set(0.8, 0.8, 0.8);
        return { group, parts };
    }

    private createDoeModel(): { group: THREE.Group, parts: any } {
        const parts: any = {};
        const group = new THREE.Group();

        const coatColor = 0xC19A6B;
        const whiteColor = 0xF0EAD6;
        const hoofColor = 0x333333;

        const mainMat = new THREE.MeshLambertMaterial({ color: coatColor });
        const whiteMat = new THREE.MeshLambertMaterial({ color: whiteColor });
        const hoofMat = new THREE.MeshLambertMaterial({ color: hoofColor });

        // Body
        parts.body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 2.0), mainMat);
        parts.body.position.y = 1.35;
        parts.body.castShadow = true;
        group.add(parts.body);
        
        const belly = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), whiteMat);
        belly.rotation.x = Math.PI / 2; belly.position.y = -0.56;
        parts.body.add(belly);

        // NECK FIX
        const neckLen = 0.8;
        const neckGeo = new THREE.CylinderGeometry(0.22, 0.38, neckLen, 8);
        neckGeo.translate(0, neckLen/2, 0);
        const neck = new THREE.Mesh(neckGeo, mainMat);
        neck.position.set(0, 0.1, 0.8);
        neck.rotation.x = Math.PI / 3.5;
        parts.body.add(neck);

        // Head
        parts.head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.75), mainMat);
        parts.head.position.set(0, neckLen, 0.1);
        parts.head.rotation.x = -Math.PI/3.5; // Level head
        neck.add(parts.head);

        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), hoofMat);
        nose.position.set(0, -0.1, 0.45);
        parts.head.add(nose);

        const earGeo = new THREE.BoxGeometry(0.6, 0.25, 0.05);
        const earL = new THREE.Mesh(earGeo, mainMat);
        earL.position.set(0.45, 0.25, -0.15); earL.rotation.set(0, -0.4, 0.4);
        parts.head.add(earL);
        const earR = earL.clone();
        earR.position.x = -0.45; earR.rotation.set(0, 0.4, -0.4);
        parts.head.add(earR);

        // SEGMENTED LEGS
        this.createLeg(parts.body, 0.3, -0.25, 0.7, mainMat, hoofMat, parts, 'legFL');
        this.createLeg(parts.body, -0.3, -0.25, 0.7, mainMat, hoofMat, parts, 'legFR');
        this.createLeg(parts.body, 0.3, -0.25, -0.7, mainMat, hoofMat, parts, 'legBL');
        this.createLeg(parts.body, -0.3, -0.25, -0.7, mainMat, hoofMat, parts, 'legBR');

        // Tail
        parts.tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.35), mainMat);
        parts.tail.position.set(0, 0.45, -1.0);
        const tailWhite = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.33), whiteMat);
        tailWhite.rotation.x = Math.PI / 2; tailWhite.position.y = -0.06;
        parts.tail.add(tailWhite);
        parts.body.add(parts.tail);

        group.scale.set(0.75, 0.75, 0.75);
        return { group, parts };
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[], skipAnimation: boolean = false) {
        if (this.isDead) return;
        this.stateTimer += dt;
        if (this.isFleeing && this.stateTimer > 5.0) { this.isFleeing = false; this.moveSpeedVal = 2.2; }
        if (this.state !== DeerState.PATROL) { this.state = DeerState.PATROL; this.findPatrolPoint(); }
        let currentSpeed = this.isFleeing ? 5.0 : ((this.stateTimer % 5.0 > 3.0) ? 0 : this.moveSpeedVal);
        
        if (this.state === DeerState.PATROL && currentSpeed > 0) { 
            if (this.position.distanceTo(this.targetPos) < 1.0 || (this.stateTimer > 10.0 && !this.isFleeing)) { 
                this.findPatrolPoint(); this.stateTimer = 0; 
            } 
        }

        if (currentSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position); toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                const lerpSpeed = this.isFleeing ? 8.0 : 3.0;
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.targetPos, this.position, dt, lerpSpeed);
                const avoidanceRot = AIUtils.getAvoidanceSteering(this.position, this.rotationY, this.collisionSize, environment.obstacles);
                this.rotationY = AIUtils.smoothLookAt(this.rotationY, this.position.clone().add(new THREE.Vector3(Math.sin(avoidanceRot), 0, Math.cos(avoidanceRot))), this.position, dt, lerpSpeed * 1.5);

                const nextPos = AIUtils.getNextPosition(this.position, this.rotationY, currentSpeed, dt, this.collisionSize, environment.obstacles);
                this.position.x = nextPos.x;
                this.position.z = nextPos.z;
            }
            this.walkTime += dt * currentSpeed;
            if (this.position.distanceTo(this.lastStuckPos) < 0.001) { 
                this.stuckTimer += dt; 
                if (this.stuckTimer > 1.5) { this.findPatrolPoint(); this.stuckTimer = 0; this.stateTimer = 0; this.isFleeing = false; } 
            } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }
        } else { this.stuckTimer = 0; this.lastStuckPos.copy(this.position); }

        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position); this.group.rotation.y = this.rotationY;

        if (skipAnimation) return;
        this.animate(dt, currentSpeed);
    }

    private findPatrolPoint() { const range = this.isFleeing ? 40 : 25; this.targetPos.set(this.position.x + (Math.random() - 0.5) * range, 0, this.position.z + (Math.random() - 0.5) * range); if (!PlayerUtils.isWithinBounds(this.targetPos)) this.targetPos.set(0, 0, 0); }

    // --- ARTICULATED ANIMATION SYSTEM ---
    private animate(dt: number, currentSpeed: number) {
        const parts = this.model.parts;
        const speedMult = this.isFleeing ? 1.8 : 1.0;
        const t = this.walkTime * 1.2 * speedMult; 
        const baseBodyY = this.isMale ? 1.45 : 1.35;

        if (currentSpeed > 0) {
            // Quadruped Walk Cycle: BL -> FL -> BR -> FR
            // We use offsets of Math.PI/2 to synchronize the diagonal pairs slightly delayed
            
            // Helper to animate a full leg
            // phase: The timing offset
            // isFront: Front legs bend backward at knee, Back legs bend forward at 'knee' (actually hock visual)
            const animateLeg = (name: string, phase: number, isFront: boolean) => {
                if(!parts[name + '_upper']) return;

                // Main swing (Hip/Shoulder)
                const swing = Math.sin(t + phase) * (this.isFleeing ? 0.8 : 0.5);
                parts[name + '_upper'].rotation.x = swing;

                // Knee Articulation
                // We only bend the knee when the leg is moving forward (swing phase) to lift the hoof
                // The 'lift' calculation detects when the leg is swinging forward
                const lift = Math.sin(t + phase); 
                
                if (isFront) {
                    // Front Leg: Knee bends backwards (positive X rotation in this context)
                    // Bend when lift is positive (swinging forward)
                    const kneeBend = lift > 0 ? lift * 1.2 : 0;
                    parts[name + '_lower'].rotation.x = kneeBend;
                    parts[name + '_hoof'].rotation.x = -kneeBend * 0.5; // Slight hoof compensation
                } else {
                    // Back Leg: Visual "Knee" (Stifle) bends forward, but the hock (lower leg visual) 
                    // angles back. In this simple rig, we rotate the lower leg positive to simulate lift.
                    const kneeBend = lift > 0 ? lift * 1.0 : 0;
                    parts[name + '_lower'].rotation.x = kneeBend; 
                    parts[name + '_hoof'].rotation.x = -kneeBend * 0.8; 
                }
            };

            // Apply animation with phases
            animateLeg('legFL', 0, true);
            animateLeg('legBR', 0, false); // Diagonal pair moves together-ish
            animateLeg('legFR', Math.PI, true);
            animateLeg('legBL', Math.PI, false);

            // Body Bob
            if (parts.body) {
                parts.body.position.y = baseBodyY + Math.abs(Math.cos(t * 2)) * 0.05;
                parts.body.rotation.z = Math.cos(t) * 0.02; // Slight roll
            }
            if (parts.tail) parts.tail.rotation.x = Math.PI/4 + Math.sin(t * 3) * 0.2;
            if (parts.head) parts.head.rotation.x = (this.isMale ? -Math.PI/4 : -Math.PI/3.5) + Math.cos(t) * 0.1;

        } else {
            // IDLE ANIMATION
            // Reset Rotations gently
            const resetLeg = (name: string) => {
                if(parts[name + '_upper']) {
                    parts[name + '_upper'].rotation.x = THREE.MathUtils.lerp(parts[name + '_upper'].rotation.x, 0, dt * 5);
                    parts[name + '_lower'].rotation.x = THREE.MathUtils.lerp(parts[name + '_lower'].rotation.x, 0, dt * 5);
                    parts[name + '_hoof'].rotation.x = THREE.MathUtils.lerp(parts[name + '_hoof'].rotation.x, 0, dt * 5);
                }
            }
            resetLeg('legFL'); resetLeg('legFR'); resetLeg('legBL'); resetLeg('legBR');

            // Idle behaviors
            if (parts.head) {
                if ((this.stateTimer % 5.0) > 3.0) {
                    // Graze
                    parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, 0.2, dt * 5);
                } else {
                    // Alert
                    const neutralHead = this.isMale ? -Math.PI/4 : -Math.PI/3.5;
                    parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, neutralHead, dt * 5);
                }
            }
            const breath = Math.sin(this.stateTimer * 1.5) * 0.02;
            if (parts.body) {
                parts.body.scale.set(1, 1 + breath, 1);
                parts.body.position.y = baseBodyY;
            }
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.isFleeing = true;
        this.stateTimer = 0;
        this.findPatrolPoint();
        this.healthBarFill.scale.x = Math.max(0, this.health / this.maxHealth);
        this.model.group.traverse((child: any) => {
            if (child.isMesh && child.material && child.material.emissive) {
                child.userData.originalEmissive = child.material.emissive.getHex();
                child.material.emissive.setHex(0xff0000);
                child.material.emissiveIntensity = 0.5;
            }
        });
        if (this.health <= 0) this.die(); 
        else setTimeout(() => { if (!this.isDead) this.model.group.traverse((c: any) => { if(c.isMesh && c.material) { c.material.emissive.setHex(c.userData.originalEmissive || 0); c.material.emissiveIntensity = 0; }}) }, 100);
    }

    private die() {
        this.isDead = true;
        this.state = DeerState.DEAD;
        this.healthBarGroup.visible = false;
        this.hitbox.userData.isSkinnable = true;
        this.hitbox.userData.material = 'venison';
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = true;
            child.userData.material = 'venison';
        });
        this.model.group.rotation.z = Math.PI / 2;
        this.model.group.position.y = this.isMale ? 0.6 : 0.5;
        this.model.group.traverse((child: any) => {
             if (child.isMesh && child.material && child.material.emissive) {
                 child.material.emissive.setHex(0x000000);
                 child.material.emissiveIntensity = 0;
             }
        });
    }

    markAsSkinned() {
        this.isSkinned = true;
        this.hitbox.userData.isSkinnable = false;
        this.hitbox.traverse((child: THREE.Object3D) => {
            child.userData.isSkinnable = false;
        });
        const skinnedColor = 0x5A2D0C;
        this.model.group.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                obj.material = obj.material.clone();
                obj.material.color.setHex(skinnedColor);
                if(obj.material.name === 'antlerMat') obj.material.color.setHex(0x3A1D0C);
            }
        });
    }
}