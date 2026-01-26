import { createRoom } from './BlueprintTypes';
import type { Blueprint } from './BlueprintTypes';

export const getTheForge = (): Blueprint => {
    return createRoom(5, 5, [
        { x: 1, z: 0 },
        { x: 3, z: 5 }
    ]);
};
