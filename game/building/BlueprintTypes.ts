import type { StructureType } from '../builder/BuildingParts';

export interface BlueprintPart {
    type: StructureType;
    x: number; // Grid coordinate (0, 1, 2...)
    z: number; // Grid coordinate
    rotation?: number; // 0, PI/2, etc.
    yOffset?: number; // Optional height offset
}

export type Blueprint = BlueprintPart[];

export type DoorLocation = { x: number; z: number; rot?: number };

// Helper to create a simple rectangular room with pillars
export const createRoom = (
    width: number,
    depth: number,
    doorLocations: DoorLocation[] = []
): Blueprint => {
    const parts: BlueprintPart[] = [];

    // Foundations
    for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
            parts.push({ type: 'foundation', x, z });
        }
    }

    // Walls & Doors (North & South)
    for (let x = 0; x < width; x++) {
        const isDoorN = doorLocations.find((d) => d.x === x && d.z === 0);
        parts.push({ type: isDoorN ? 'doorway' : 'wall', x, z: 0, rotation: 0 });

        const isDoorS = doorLocations.find((d) => d.x === x && d.z === depth);
        parts.push({ type: isDoorS ? 'doorway' : 'wall', x, z: depth, rotation: 0 });
    }

    // Walls & Doors (West & East)
    for (let z = 0; z < depth; z++) {
        const isDoorW = doorLocations.find((d) => d.x === 0 && d.z === z);
        parts.push({ type: isDoorW ? 'doorway' : 'wall', x: 0, z, rotation: Math.PI / 2 });

        const isDoorE = doorLocations.find((d) => d.x === width && d.z === z);
        parts.push({ type: isDoorE ? 'doorway' : 'wall', x: width, z, rotation: Math.PI / 2 });
    }

    // Pillars at Corners
    parts.push({ type: 'pillar', x: 0, z: 0 });
    parts.push({ type: 'pillar', x: width, z: 0 });
    parts.push({ type: 'pillar', x: 0, z: depth });
    parts.push({ type: 'pillar', x: width, z: depth });

    return parts;
};
