
import * as THREE from 'three';
import type { Player } from '../Player';
import { PlayerInput } from '../../types';
import { LowLevelCityGuard } from '../LowLevelCityGuard';

export class PlayerInteraction {

    static update(player: Player, dt: number, input: PlayerInput, obstacles: THREE.Object3D[], entities: any[] = []) {
        // Ledge Climbing
        if (player.isLedgeGrabbing) {
            this.updateClimb(player, dt);
            return; 
        }

        // Picking Up
        if (player.isPickingUp) {
            player.pickUpTime += dt;
            if (player.pickUpTime > 1.2) { 
                player.isPickingUp = false; 
                player.pickUpTime = 0; 
            }
        }

        // Interaction
        if (input.interact && !player.isInteracting) {
            player.isInteracting = true;
            player.interactTimer = 0;
        }

        if (player.isInteracting) {
            player.interactTimer += dt;
            if (player.interactTimer > 0.4) {
                player.isInteracting = false;
                player.interactTimer = 0;
            }
        }

        // Skinning Check & Logic
        const hasKnife = player.config.selectedItem === 'Knife';
        const skinnableTarget = this.getSkinnableTargetNearby(player, obstacles);
        player.canSkin = !!skinnableTarget && hasKnife;

        // Dialogue Check (Guard Interaction)
        this.checkGuardsNearby(player, entities);

        if (input.isPickingUp) {
            if (player.canSkin && !player.isSkinning && !player.isPickingUp) {
                player.isSkinning = true;
                player.skinningTimer = 0;
            } else if (!player.isSkinning && !player.isPickingUp) {
                player.isPickingUp = true;
            }
        }

        if (player.isSkinning) {
            // Cancel if moving
            if (input.x !== 0 || input.y !== 0 || input.jump) {
                player.isSkinning = false;
                player.skinningTimer = 0;
                player.skinningProgress = 0;
            } else {
                player.skinningTimer += dt;
                player.skinningProgress = Math.min(player.skinningTimer / player.maxSkinningTime, 1.0);
                
                if (player.skinningTimer >= player.maxSkinningTime) {
                    player.isSkinning = false;
                    player.skinningTimer = 0;
                    player.addItem('Fur'); 

                    // Mark as harvested so it can't be skinned again
                    if (skinnableTarget) {
                        // Check if it's a living entity like a Wolf
                        // Entities store themselves in the group's userData.parent
                        const entityRoot = skinnableTarget.parent?.userData.type === 'creature' ? skinnableTarget.parent : skinnableTarget;
                        const entity = entityRoot.userData.parent;

                        if (entity && typeof entity.markAsSkinned === 'function') {
                            entity.markAsSkinned();
                        } else {
                            // Fallback for static objects
                            skinnableTarget.userData.isSkinnable = false;
                            skinnableTarget.traverse(c => c.userData.isSkinnable = false);
                        }
                    }
                }
            }
        } else {
            player.skinningProgress = 0;
        }
    }

    private static updateClimb(player: Player, dt: number) {
        player.ledgeGrabTime += dt;
        const climbDuration = 1.2; 
        const progress = Math.min(player.ledgeGrabTime / climbDuration, 1.0);
        
        if (progress < 0.15) {
            player.mesh.position.copy(player.ledgeStartPos);
        } else if (progress < 0.65) {
            const t = (progress - 0.15) / 0.5; 
            const ease = 1 - Math.pow(1 - t, 3); 
            
            player.mesh.position.x = player.ledgeStartPos.x;
            player.mesh.position.z = player.ledgeStartPos.z;
            player.mesh.position.y = THREE.MathUtils.lerp(player.ledgeStartPos.y, player.ledgeTargetPos.y, ease);
        } else {
            const t = (progress - 0.65) / 0.35; 
            const ease = 1 - Math.pow(1 - t, 2); 
            
            player.mesh.position.y = player.ledgeTargetPos.y;
            
            const startVec = new THREE.Vector3(player.ledgeStartPos.x, 0, player.ledgeStartPos.z);
            const targetVec = new THREE.Vector3(player.ledgeTargetPos.x, 0, player.ledgeTargetPos.z);
            const currentVec = new THREE.Vector3().lerpVectors(startVec, targetVec, ease);
            
            player.mesh.position.x = currentVec.x;
            player.mesh.position.z = currentVec.z;
        }

        if (progress >= 1.0) {
            player.mesh.position.copy(player.ledgeTargetPos);
            player.isLedgeGrabbing = false;
            player.ledgeGrabTime = 0;
            player.isJumping = false;
            player.jumpVelocity = 0;
        }
    }

    private static getSkinnableTargetNearby(player: Player, obstacles: THREE.Object3D[]): THREE.Object3D | null {
        const skinnables = obstacles.filter(o => o.userData.isSkinnable);
        let best = null;
        let minDist = 1.5;

        for (const sk of skinnables) {
            const skPos = new THREE.Vector3();
            sk.getWorldPosition(skPos);
            const dist = player.mesh.position.distanceTo(skPos);
            if (dist < minDist) { 
                minDist = dist;
                best = sk;
            }
        }
        return best;
    }

    private static checkGuardsNearby(player: Player, entities: any[]) {
        player.canTalk = false;
        player.talkingTarget = null;

        for (const entity of entities) {
            if (entity instanceof LowLevelCityGuard) {
                // Ignore guards in combat
                if (entity.isInCombat()) continue;

                const dist = player.mesh.position.distanceTo(entity.position);
                if (dist < 2.0) {
                    player.canTalk = true;
                    player.talkingTarget = entity;
                    break;
                }
            }
        }
    }
}
