import * as THREE from 'three';
import type { Player } from './Player';
import { PlayerInput } from '../../types';
import { LowLevelCityGuard } from '../entities/npc/friendly/LowLevelCityGuard';
import { Blacksmith } from '../entities/npc/friendly/Blacksmith';
// Standardized to lowercase npc folder
import { Shopkeeper } from '../entities/npc/friendly/Shopkeeper';

export class PlayerInteraction {

    static update(player: Player, dt: number, input: PlayerInput, obstacles: THREE.Object3D[], entities: any[] = []) {
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

        // Generic Interaction Check (Forge, etc.)
        const interactableTarget = this.getInteractableTargetNearby(player, obstacles);
        // Set the interactable target on the player
        player.interactableTarget = interactableTarget;

        // Dialogue Check
        this.checkNPCInteraction(player, entities);

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
                        const entityRoot = skinnableTarget.parent?.userData.type === 'creature' ? skinnableTarget.parent : skinnableTarget;
                        const entity = entityRoot.userData.parent;

                        if (entity && typeof entity.markAsSkinned === 'function') {
                            entity.markAsSkinned();
                        } else {
                            // Fallback for static objects
                            skinnableTarget.userData.isSkinnable = false;
                            skinnableTarget.userData.type = 'soft'; // Disable collision
                            skinnableTarget.traverse(c => {
                                c.userData.isSkinnable = false;
                                c.userData.type = 'soft';
                            });
                        }
                    }
                }
            }
        } else {
            player.skinningProgress = 0;
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

    private static getInteractableTargetNearby(player: Player, obstacles: THREE.Object3D[]): THREE.Object3D | null {
        const interactables = obstacles.filter(o => o.userData.interactType);
        let best = null;
        let minDist = 2.0;

        for (const it of interactables) {
            const itPos = new THREE.Vector3();
            it.getWorldPosition(itPos);
            const dist = player.mesh.position.distanceTo(itPos);
            if (dist < minDist) { 
                minDist = dist;
                best = it;
            }
        }
        return best;
    }

    private static checkNPCInteraction(player: Player, entities: any[]) {
        player.canTalk = false;
        player.talkingTarget = null;

        for (const entity of entities) {
            const name = entity.constructor.name;
            
            // Check Guards
            if (name === 'LowLevelCityGuard' || entity instanceof LowLevelCityGuard) {
                if (entity.isInCombat()) continue;
                const dist = player.mesh.position.distanceTo(entity.position);
                if (dist < 2.0) {
                    player.canTalk = true;
                    player.talkingTarget = entity;
                    break;
                }
            }
            // Check Blacksmith
            if (name === 'Blacksmith' || entity instanceof Blacksmith) {
                const dist = player.mesh.position.distanceTo(entity.position);
                if (dist < 2.5) { 
                    player.canTalk = true;
                    player.talkingTarget = entity;
                    break;
                }
            }
            // Check Shopkeeper
            if (name === 'Shopkeeper' || entity instanceof Shopkeeper) {
                const dist = player.mesh.position.distanceTo(entity.position);
                if (dist < 2.5) {
                    player.canTalk = true;
                    player.talkingTarget = entity;
                    break;
                }
            }
        }
    }
}