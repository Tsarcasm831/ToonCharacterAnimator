import { createRoom } from './BlueprintTypes';
import type { Blueprint, BlueprintPart } from './BlueprintTypes';

export const getLShape = (): Blueprint => {
    const parts: BlueprintPart[] = [];
    const main = createRoom(3, 5, [{ x: 1, z: 0 }]);
    parts.push(...main);

    // Side block 2x2 attached
    for (let x = 3; x < 5; x++) {
        for (let z = 3; z < 5; z++) {
            parts.push({ type: 'foundation', x, z });
        }
    }

    // Walls for extension
    parts.push({ type: 'wall', x: 3, z: 3, rotation: 0 });
    parts.push({ type: 'wall', x: 4, z: 3, rotation: 0 });
    parts.push({ type: 'wall', x: 3, z: 5, rotation: 0 });
    parts.push({ type: 'wall', x: 4, z: 5, rotation: 0 });

    parts.push({ type: 'wall', x: 5, z: 3, rotation: Math.PI / 2 });
    parts.push({ type: 'doorway', x: 5, z: 4, rotation: Math.PI / 2 });

    // Pillars for extension corners
    parts.push({ type: 'pillar', x: 5, z: 3 });
    parts.push({ type: 'pillar', x: 5, z: 5 });

    return parts;
};
