import { PlayerInput } from '../../../types';
import * as THREE from 'three';

export interface AnimationState {
    name: string;
    enter(player: any): void;
    update(player: any, dt: number, input: PlayerInput, obstacles?: THREE.Object3D[]): void;
    exit(player: any): void;
}

export class StateMachine {
    currentState: AnimationState | null = null;
    player: any;

    constructor(player: any) {
        this.player = player;
    }

    changeState(newState: AnimationState) {
        if (this.currentState === newState) return;
        
        if (this.currentState) {
            this.currentState.exit(this.player);
        }

        // console.log(`State change: ${this.currentState?.name} -> ${newState.name}`);
        this.currentState = newState;
        
        if (this.currentState) {
            this.currentState.enter(this.player);
        }
    }

    update(dt: number, input: PlayerInput, obstacles?: THREE.Object3D[]) {
        if (this.currentState) {
            this.currentState.update(this.player, dt, input, obstacles);
        }
    }
    
    get currentName(): string {
        return this.currentState ? this.currentState.name : 'none';
    }
}
