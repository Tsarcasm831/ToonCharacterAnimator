import { PlayerInput } from '../../../types';
import { ParticleManager } from '../../managers/ParticleManager';

export abstract class BaseAction {
    protected player: any;
    
    constructor(player: any) {
        this.player = player;
    }
    
    abstract handleInput(input: PlayerInput): void;
    abstract update(dt: number, environment?: any, particleManager?: ParticleManager, entities?: any[]): void;
    abstract get isActive(): boolean;
    abstract clear(): void;
}
