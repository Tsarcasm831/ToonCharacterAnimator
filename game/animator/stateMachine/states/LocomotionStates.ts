import { AnimationState } from '../StateMachine';
import { LocomotionAnimator } from '../../LocomotionAnimator';
import { PlayerInput } from '../../../../types';
import * as THREE from 'three';

const locomotion = new LocomotionAnimator();

export class IdleState implements AnimationState {
    name = 'idle';
    
    enter(player: any) {}
    
    update(player: any, dt: number, input: PlayerInput, obstacles?: THREE.Object3D[]) {
        const parts = player.model.parts;
        const damp = 10 * dt;
        
        const isRightArmAction = player.combat.isPunch || player.combat.isAxeSwing || player.isInteracting;
        const skipArms = player.combat.isFiringBow || isRightArmAction;

        locomotion.animateIdle(player, parts, damp, skipArms);
    }
    
    exit(player: any) {}
}

export class MoveState implements AnimationState {
    name = 'move';
    
    enter(player: any) {}
    
    update(player: any, dt: number, input: PlayerInput, obstacles?: THREE.Object3D[]) {
        const parts = player.model.parts;
        const damp = 10 * dt;
        
        const isRightArmAction = player.combat.isPunch || player.combat.isAxeSwing || player.isInteracting;
        const skipArms = player.combat.isFiringBow || isRightArmAction;

        locomotion.animateMovement(player, parts, dt, damp, input, skipArms);
    }
    
    exit(player: any) {}
}

export class JumpState implements AnimationState {
    name = 'jump';
    
    enter(player: any) {}
    
    update(player: any, dt: number, input: PlayerInput, obstacles?: THREE.Object3D[]) {
        const parts = player.model.parts;
        const damp = 10 * dt;
        
        const isRightArmAction = player.combat.isPunch || player.combat.isAxeSwing || player.isInteracting;
        const skipArms = player.combat.isFiringBow || isRightArmAction;

        locomotion.animateJump(player, parts, dt, damp, input, skipArms);
    }
    
    exit(player: any) {}
}
