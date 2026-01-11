import * as THREE from 'three';
import { Environment } from './Environment';
import { ObjectFactory } from './environment/ObjectFactory';
import { PlayerUtils } from './player/PlayerUtils';

export enum WolfState {
    IDLE,
    PATROL,
    CHASE,
    ATTACK,
    DEAD
}

export class Wolf {
    scene: THREE.Scene;
    group: THREE.Group;
    model: any;
    position: THREE.Vector3 = new THREE.Vector3();
    rotationY: number = 0;
    state: WolfState = WolfState.PATROL;
    stateTimer: number = 0;
    targetPos: THREE.Vector3 = new THREE.Vector3();
    currentTarget: { position: THREE.Vector3, isDead?: boolean } | null = null;
    isDead: boolean = false;
    health: number = 100;
    
    private walkTime: number = 0;
    private attackCooldown: number = 0;

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.position.copy(initialPos);
        
        const wolfData = ObjectFactory.createWolfModel(0x666666);
        this.group = new THREE.Group();
        this.group.add(wolfData.group);
        this.model = wolfData;
        
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(dt: number, environment: Environment, potentialTargets: { position: THREE.Vector3, isDead?: boolean }[]) {
        if (this.isDead) return;

        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // 1. Target Selection (Hostile to Archer and others)
        let bestTarget = null;
        let bestDist = 15.0; // Vision range
        
        for (const t of potentialTargets) {
            if (t.isDead) continue;
            const d = this.position.distanceTo(t.position);
            if (d < bestDist) {
                bestDist = d;
                bestTarget = t;
            }
        }
        
        this.currentTarget = bestTarget;
        const distToTarget = bestTarget ? bestDist : Infinity;

        // State Transitions
        if (bestTarget) {
            if (this.state === WolfState.PATROL || this.state === WolfState.IDLE) {
                this.state = WolfState.CHASE;
                this.stateTimer = 0;
            }
            
            if (this.state === WolfState.CHASE) {
                if (distToTarget < 2.0) {
                    this.state = WolfState.ATTACK;
                    this.stateTimer = 0;
                } else {
                    this.targetPos.copy(bestTarget.position);
                }
            }

            if (this.state === WolfState.ATTACK) {
                if (distToTarget > 3.0) {
                    this.state = WolfState.CHASE;
                    this.stateTimer = 0;
                } else if (this.attackCooldown <= 0 && this.stateTimer > 0.5) {
                    // Attack logic would go here
                    this.attackCooldown = 1.5;
                    this.stateTimer = 0;
                }
            }
        } else {
            if (this.state !== WolfState.PATROL && this.state !== WolfState.IDLE) {
                this.state = WolfState.PATROL;
                this.stateTimer = 0;
                this.findPatrolPoint();
            }
        }

        // Movement & Animation
        let moveSpeed = 0;
        if (this.state === WolfState.PATROL) {
            moveSpeed = 2.0;
            if (this.position.distanceTo(this.targetPos) < 1.0 || this.stateTimer > 10.0) {
                this.findPatrolPoint();
                this.stateTimer = 0;
            }
        } else if (this.state === WolfState.CHASE) {
            moveSpeed = 6.0;
        }

        if (moveSpeed > 0) {
            const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.position);
            toTarget.y = 0;
            if (toTarget.length() > 0.1) {
                const desiredRot = Math.atan2(toTarget.x, toTarget.z);
                let diff = desiredRot - this.rotationY;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.rotationY += diff * 5.0 * dt;

                const step = moveSpeed * dt;
                const nextPos = this.position.clone().add(new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).multiplyScalar(step));
                
                // Simple boundary check
                if (PlayerUtils.isWithinBounds(nextPos)) {
                    this.position.x = nextPos.x;
                    this.position.z = nextPos.z;
                }
            }
            this.walkTime += dt * moveSpeed;
        }

        // Update visuals
        this.position.y = PlayerUtils.getTerrainHeight(this.position.x, this.position.z);
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;

        this.animate(dt, moveSpeed);
    }

    private findPatrolPoint() {
        const range = 20;
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
        const speed = moveSpeed > 0 ? moveSpeed * 1.5 : 1.0;
        const time = this.walkTime;

        if (moveSpeed > 0) {
            // Leg animation
            const legSwing = Math.sin(time * 2.0) * 0.5;
            parts.legFR.rotation.x = legSwing;
            parts.legBL.rotation.x = legSwing;
            parts.legFL.rotation.x = -legSwing;
            parts.legBR.rotation.x = -legSwing;
            
            // Body bob
            parts.body.position.y = 0.6 + Math.abs(Math.cos(time * 2.0)) * 0.1;
            
            // Tail wag
            parts.tail.rotation.y = Math.sin(time * 4.0) * 0.3;
        } else {
            // Idle breathing
            const breath = Math.sin(this.stateTimer * 2.0) * 0.02;
            parts.body.scale.set(1 + breath, 1 + breath, 1 + breath);
        }
    }

    takeDamage(amount: number) {
        this.health -= amount;
        if (this.health <= 0 && !this.isDead) {
            this.die();
        }
    }

    private die() {
        this.isDead = true;
        this.state = WolfState.DEAD;
        this.model.group.rotation.z = Math.PI / 2;
        this.model.group.position.y = 0.15;
    }
}
