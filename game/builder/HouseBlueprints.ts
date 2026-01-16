
import { StructureType } from './BuildingParts';

export interface BlueprintPart {
    type: StructureType;
    x: number; // Grid coordinate (0, 1, 2...)
    z: number; // Grid coordinate
    rotation?: number; // 0, PI/2, etc.
    yOffset?: number; // Optional height offset
}

export type Blueprint = BlueprintPart[];

// Helper to create a simple rectangular room with pillars
const createRoom = (width: number, depth: number, doorLocations: {x: number, z: number, rot?: number}[] = []): Blueprint => {
    const parts: BlueprintPart[] = [];
    
    // Foundations
    for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
            parts.push({ type: 'foundation', x, z });
        }
    }

    // Walls & Doors (North & South)
    for (let x = 0; x < width; x++) {
        const isDoorN = doorLocations.find(d => d.x === x && d.z === 0);
        parts.push({ type: isDoorN ? 'doorway' : 'wall', x, z: 0, rotation: 0 });
        
        const isDoorS = doorLocations.find(d => d.x === x && d.z === depth);
        parts.push({ type: isDoorS ? 'doorway' : 'wall', x, z: depth, rotation: 0 });
    }

    // Walls & Doors (West & East)
    for (let z = 0; z < depth; z++) {
        const isDoorW = doorLocations.find(d => d.x === 0 && d.z === z);
        parts.push({ type: isDoorW ? 'doorway' : 'wall', x: 0, z, rotation: Math.PI / 2 });

        const isDoorE = doorLocations.find(d => d.x === width && d.z === z);
        parts.push({ type: isDoorE ? 'doorway' : 'wall', x: width, z, rotation: Math.PI / 2 });
    }

    // Pillars at Corners
    parts.push({ type: 'pillar', x: 0, z: 0 });
    parts.push({ type: 'pillar', x: width, z: 0 });
    parts.push({ type: 'pillar', x: 0, z: depth });
    parts.push({ type: 'pillar', x: width, z: depth });

    return parts;
};

export class HouseBlueprints {
    
    // 1. The Forge (Original 5x5 Blacksmith House)
    static getTheForge(): Blueprint {
        return createRoom(5, 5, [
            { x: 1, z: 0 }, 
            { x: 3, z: 5 }
        ]);
    }

    // 2. The Cottage (Cozy 3x4)
    static getCottage(): Blueprint {
        return createRoom(3, 4, [
            { x: 1, z: 4 }
        ]);
    }

    // 3. The Longhouse (Narrow 3x6)
    static getLonghouse(): Blueprint {
        return createRoom(3, 7, [
             { x: 0, z: 3 }, // Side door
             { x: 3, z: 3 }  // Side door
        ]);
    }

    // 4. The L-Shape (Compound structure)
    static getLShape(): Blueprint {
        const parts: BlueprintPart[] = [];
        const main = createRoom(3, 5, [{ x: 1, z: 0 }]); 
        parts.push(...main);

        // Side block 2x2 attached
        for(let x=3; x<5; x++) {
            for(let z=3; z<5; z++) {
                parts.push({ type: 'foundation', x, z });
            }
        }
        // Walls for extension
        parts.push({ type: 'wall', x: 3, z: 3, rotation: 0 });
        parts.push({ type: 'wall', x: 4, z: 3, rotation: 0 });
        parts.push({ type: 'wall', x: 3, z: 5, rotation: 0 });
        parts.push({ type: 'wall', x: 4, z: 5, rotation: 0 });
        
        parts.push({ type: 'wall', x: 5, z: 3, rotation: Math.PI/2 });
        parts.push({ type: 'doorway', x: 5, z: 4, rotation: Math.PI/2 }); 

        // Pillars for extension corners
        parts.push({ type: 'pillar', x: 5, z: 3 });
        parts.push({ type: 'pillar', x: 5, z: 5 });

        return parts;
    }

    // 5. The Roundhouse
    static getRoundhouse(): Blueprint {
        const parts: BlueprintPart[] = [];
        
        // Large round foundation (covers ~2x2 to 3x3)
        parts.push({ type: 'round_foundation', x: 0, z: 0 });
        
        // Circular walls around the perimeter
        // 8 segments
        for(let i=0; i<8; i++) {
            // Leave one segment open for door
            if (i === 6) {
                continue; 
            }
            parts.push({ type: 'round_wall', x: 0, z: 0, rotation: i * (Math.PI / 4) });
        }
        
        return parts;
    }

    // 6. The Gatehouse (Two small structures with a gap)
    static getGatehouse(): Blueprint {
        const parts: BlueprintPart[] = [];
        
        const left = createRoom(2, 3, [{x:2, z:1}]); 
        parts.push(...left);

        const right = createRoom(2, 3, [{x:0, z:1}]); 
        right.forEach(p => p.x += 4);
        parts.push(...right);
        
        return parts;
    }
}
