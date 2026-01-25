import type { Blueprint, BlueprintPart } from './BlueprintTypes';

export const getRoundhouse = (): Blueprint => {
    const parts: BlueprintPart[] = [];

    // Large round foundation (covers ~2x2 to 3x3)
    parts.push({ type: 'round_foundation', x: 0, z: 0 });

    // Circular walls around the perimeter
    // 8 segments
    for (let i = 0; i < 8; i++) {
        // Leave one segment open for door
        if (i === 6) {
            continue;
        }
        parts.push({ type: 'round_wall', x: 0, z: 0, rotation: i * (Math.PI / 4) });
    }

    return parts;
};
