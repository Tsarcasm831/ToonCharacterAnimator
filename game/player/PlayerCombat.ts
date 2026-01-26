import * as THREE from 'three';
import type { Player } from './Player';
import { PlayerInput } from '../../types';
import { ParticleManager } from '../managers/ParticleManager';
import { ProjectileManager } from '../managers/ProjectileManager';
import { MeleeAction } from './actions/MeleeAction';
import { BowAction } from './actions/BowAction';
import { FireballAction } from './actions/FireballAction';

export class PlayerCombat {
    private player: Player;
    private soundManager: any;
    
    // Action instances
    private meleeAction: MeleeAction;
    private bowAction: BowAction;
    private fireballAction: FireballAction;
    
    // State
    isCombatStance: boolean = false;
    wasCombatKeyPressed: boolean = false;
    wasAttack1Pressed: boolean = false;
    wasAttack2Pressed: boolean = false;
    wasFireballKeyPressed: boolean = false;

    // Fireball state (now delegated to fireballAction)
    // isFireballCasting, fireballTimer, hasSpawnedFireball

    // Summoning (kept here as it's an "action")
    isSummoning: boolean = false;
    summonTimer: number = 0;

    // Bow state (now delegated to bowAction)
    // isFiringBow, bowState, bowCharge, bowTimer

    // Fishing
    isFishing: boolean = false;
    isReeling: boolean = false;
    fishingTimer: number = 0;
    isChargingFishing: boolean = false;
    fishingCharge: number = 0;
    fishingChargeTime: number = 0;
    needsReclick: boolean = false;

    // Callback for attack hits
    onAttackHit?: (type: string, count: number) => void;

    constructor(player: Player, soundManager?: any) {
        this.player = player;
        this.soundManager = soundManager;
        this.meleeAction = new MeleeAction(player, (type: string, count: number) => {
            this.onAttackHit?.(type, count);
        }, soundManager);
        this.bowAction = new BowAction(player);
        this.fireballAction = new FireballAction(player);
    }

    update(dt: number, input: PlayerInput, environment: any, particleManager: ParticleManager, entities: any[] = []) {
        // Input Handling
        this.handleInput(dt, input, particleManager);

        // Update Actions
        this.meleeAction.update(dt, environment, particleManager, entities);
        this.meleeAction.updatePunchComboWithInput(dt, input, environment.obstacles);
        this.bowAction.update(dt);
        this.fireballAction.update(dt, particleManager);
        
        // Logic Updates
        this.updateFishing(dt);
        this.updateSummoning(dt, input);
    }

    private handleInput(dt: number, input: PlayerInput, particleManager: ParticleManager) {
        // Combat Stance Toggle
        if (input.combat && !this.wasCombatKeyPressed) {
            this.isCombatStance = !this.isCombatStance;
        }
        this.wasCombatKeyPressed = !!input.combat;

        // Melee Combat (delegated to meleeAction)
        this.meleeAction.handleInput(input);

        // Fireball
        const isFireballPressed = !!input.fireball;
        if (isFireballPressed && !this.wasFireballKeyPressed) {
            this.fireballAction.handleInput();
        }
        this.wasFireballKeyPressed = isFireballPressed;

        // Summoning
        if (input.summon && !this.isSummoning && !this.player.config.selectedItem && !this.player.locomotion.isJumping) {
            this.isSummoning = true;
            this.summonTimer = 0;
        }

        // Weapon Specifics
        if (this.player.config.selectedItem === 'Fishing Pole') {
            this.handleFishingInput(dt, input);
        } else if (this.player.config.selectedItem === 'Bow') {
            this.bowAction.handleBowInput(dt, input, particleManager);
        }

        this.wasAttack1Pressed = !!input.attack1;
        this.wasAttack2Pressed = !!input.attack2;
    }

    static spawnProjectile(
        scene: THREE.Scene,
        startPos: THREE.Vector3,
        direction: THREE.Vector3,
        type: 'arrow' | 'fireball' | 'heal',
        owner?: any
    ) {
        ProjectileManager.spawnProjectile(scene, startPos, direction, type, owner);
    }

    static updateProjectiles(dt: number, environment: any, particleManager: ParticleManager, entities: any[]) {
        ProjectileManager.updateProjectiles(dt, environment, particleManager, entities);
    }

    // Getters for backward compatibility with animator
    get isAxeSwing() { 
        const value = this.meleeAction?.isAxeSwing || false;
        //console.log('isAxeSwing getter:', value);
        return value;
    }
    get isPunch() { 
        const value = this.meleeAction?.isPunch || false;
        //console.log('isPunch getter:', value, 'comboChain:', this.meleeAction?.comboChain);
        return value;
    }
    get comboChain() { return this.meleeAction?.comboChain || 0; }
    get punchTimer() { return this.meleeAction?.punchTimer || 0; }
    get axeSwingTimer() { return this.meleeAction?.axeSwingTimer || 0; }
    get hasHit() { return this.meleeAction?.hasHit || false; }
    get isFiringBow() { return this.bowAction?.isFiringBow || false; }
    get bowCharge() { return this.bowAction?.bowCharge || 0; }
    get bowState() { return this.bowAction?.bowState || 'draw'; }
    get bowTimer() { return this.bowAction?.bowTimer || 0; }
    get isFireballCasting() { return this.fireballAction?.isFireballCasting || false; }
    get fireballTimer() { return this.fireballAction?.fireballTimer || 0; }
    get hasSpawnedFireball() { return this.fireballAction?.hasSpawnedFireball || false; }

    // Method to clear bow state when switching weapons
    clearBowState() {
        this.bowAction.clear();
    }

    private handleFishingInput(dt: number, input: PlayerInput) {
        if (!input.attack1) {
            this.needsReclick = false;
        }
        
        if (this.needsReclick) return;

        if (this.isFishing) {
            if (input.attack1) {
                this.isReeling = true;
            } else {
                this.isReeling = false;
            }
            return;
        }

        if (input.attack1) {
            if (!this.isChargingFishing) {
                this.isChargingFishing = true;
                this.fishingChargeTime = 0;
            }
            this.fishingChargeTime += dt * 3.0;
            this.fishingCharge = (Math.sin(this.fishingChargeTime - Math.PI/2) + 1) / 2;
        } else {
            if (this.isChargingFishing) {
                this.isChargingFishing = false;
                this.isFishing = true; 
                this.isReeling = false;
                this.fishingTimer = 0.3; 
                const weapon = this.player.model.equippedMeshes.heldItem;
                if (weapon) {
                    const minStr = 0.2; 
                    const str = minStr + this.fishingCharge * (1.0 - minStr);
                    weapon.userData.castStrength = str;
                }
                this.fishingCharge = 0;
            }
        }
    }

    private updateFishing(dt: number) {
        if (this.isFishing) {
            this.fishingTimer += dt;
        } else {
            this.fishingTimer = 0;
        }
    }

    private updateSummoning(dt: number, input: PlayerInput) {
        if (this.isSummoning) {
            if (input.x !== 0 || input.y !== 0 || input.jump) {
                this.isSummoning = false;
                this.summonTimer = 0;
            } else {
                this.summonTimer += dt;
                if (this.summonTimer > 6.0) {
                    this.isSummoning = false;
                    this.summonTimer = 0;
                }
            }
        }
    }

    clearActionStates() {
        this.isSummoning = false;
        this.summonTimer = 0;
        this.isFishing = false;
        this.isChargingFishing = false;
        
        // Clear action states
        this.meleeAction.clear();
        this.bowAction.clear();
        this.fireballAction.clear();
    }
}
