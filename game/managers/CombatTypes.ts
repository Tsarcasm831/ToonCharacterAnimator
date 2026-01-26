import * as THREE from 'three';
import { EntityStats, UnitState } from '../../types';

export interface CombatUnit {
    id: string;
    entity: any;
    stats: EntityStats;
    isFriendly: boolean;
    gridPos: { r: number; c: number } | null;
    isAlive: boolean;
    currentInitiative: number;
    baseDefense: number; // Store original defense for temporary bonuses
    
    // Auto-Battler State (To be deprecated/modified for turn-based)
    state: UnitState;
    attackTimer: number;
    target: CombatUnit | null;
    path: { r: number; c: number }[];
    nextMovePos: THREE.Vector3 | null;
}
