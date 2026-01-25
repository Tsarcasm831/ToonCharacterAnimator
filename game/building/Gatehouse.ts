import { createRoom } from './BlueprintTypes';
import type { Blueprint } from './BlueprintTypes';

export const getGatehouse = (): Blueprint => {
    const parts = [] as Blueprint;

    const left = createRoom(2, 3, [{ x: 2, z: 1 }]);
    parts.push(...left);

    const right = createRoom(2, 3, [{ x: 0, z: 1 }]);
    right.forEach((part) => {
        part.x += 4;
    });
    parts.push(...right);

    return parts;
};
