
import * as THREE from 'three';

export interface TreeData {
    id: string;
    group: THREE.Group;
    trunk: THREE.Object3D;
    leaves: THREE.Mesh;
    health: number;
    shudderTimer: number;
    basePosition: THREE.Vector3;
}

export interface RockData {
    id: string;
    mesh: THREE.Mesh;
    health: number;
    shudderTimer: number;
    basePosition: THREE.Vector3;
}

export interface FallingObject {
    mesh: THREE.Group;
    velocity: number;
    axis: THREE.Vector3;
    angle: number;
}

export interface Debris {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    rotVelocity: THREE.Vector3;
    life: number;
}

export const ENV_CONSTANTS = {
    POND_X: 8,
    POND_Z: 6,
    POND_RADIUS: 4.5,
    POND_DEPTH: 1.8
};

export const BIOME_DATA: Record<string, { name: string, color: string }> = {
    '0,0':   { name: 'Verdant Meadows', color: '#4ade80' },
    '1,0':   { name: 'Golden Dunes', color: '#facc15' },
    '1,1':   { name: 'Gravel Pass', color: '#94a3b8' },
    '0,1':   { name: 'Highland Trail', color: '#a8a29e' },
    '-1,1':  { name: 'Timber Wharf', color: '#b45309' },
    '-1,0':  { name: 'Basalt Cliffs', color: '#475569' },
    '-1,-1': { name: 'Industrial Foundry', color: '#334155' },
    '0,-1':  { name: 'Frostfell Peak', color: '#f8fafc' },
    '1,-1':  { name: 'Autumnal Grove', color: '#ea580c' },
    'water': { name: 'Hidden Oasis', color: '#3b82f6' }
};
