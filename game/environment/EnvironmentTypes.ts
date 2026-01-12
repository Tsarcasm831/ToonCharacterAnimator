
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
    POND_DEPTH: 1.8,
    PATCH_SIZE: 13.3333,
    BIOME_SIZE: 40.0
};

export const BIOME_DATA: Record<string, { name: string, color: string, type: string }> = {
    // --- 3x3 Inner Core ---
    '0,0':   { name: 'Verdant Meadows', color: '#4ade80', type: 'Grass' },
    '1,0':   { name: 'Golden Dunes', color: '#facc15', type: 'Sand' },
    '1,1':   { name: 'Gravel Pass', color: '#94a3b8', type: 'Gravel' },
    '0,1':   { name: 'Highland Trail', color: '#a8a29e', type: 'Dirt' },
    '-1,1':  { name: 'Timber Wharf', color: '#b45309', type: 'Wood' },
    '-1,0':  { name: 'Basalt Cliffs', color: '#475569', type: 'Stone' },
    '-1,-1': { name: 'Industrial Foundry', color: '#334155', type: 'Metal' },
    '0,-1':  { name: 'Frostfell Peak', color: '#f8fafc', type: 'Snow' },
    '1,-1':  { name: 'Autumnal Grove', color: '#ea580c', type: 'Leaves' },

    // --- 5x5 Outer Ring Extension ---
    '2,0':   { name: 'Crystal Crags', color: '#a5f3fc', type: 'Stone' },
    '2,1':   { name: 'Obsidian Fields', color: '#1a1a1a', type: 'Obsidian' },
    '2,2':   { name: 'Neon City Ruins', color: '#f472b6', type: 'Metal' },
    '1,2':   { name: 'Toxic Swamps', color: '#4d7c0f', type: 'Toxic' },
    '0,2':   { name: 'Petrified Forest', color: '#78350f', type: 'Wood' },
    '-1,2':  { name: 'Marble Spires', color: '#e2e8f0', type: 'Marble' },
    '-2,2':  { name: 'Void Rift', color: '#4c1d95', type: 'Obsidian' },
    '-2,1':  { name: 'Crimson Valley', color: '#991b1b', type: 'Crimson' },
    '-2,0':  { name: 'Steam Outpost', color: '#b45309', type: 'Metal' },
    '-2,-1': { name: 'Ancient Ruins', color: '#44403c', type: 'Stone' },
    '-2,-2': { name: 'Abyssal Depth', color: '#0f172a', type: 'Obsidian' },
    '-1,-2': { name: 'Frozen Lake', color: '#bae6fd', type: 'Snow' },
    '0,-2':  { name: 'Glacial Plateau', color: '#f1f5f9', type: 'Snow' },
    '1,-2':  { name: 'Scorched Earth', color: '#450a0a', type: 'Gravel' },
    '2,-2':  { name: 'Sulphur Springs', color: '#fde047', type: 'Sand' },
    '2,-1':  { name: 'Hidden Oasis', color: '#1d4ed8', type: 'Sand' },

    'water': { name: 'Hidden Oasis', color: '#3b82f6', type: 'Water' }
};
