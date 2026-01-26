import { createRoom } from './BlueprintTypes';
import type { Blueprint } from './BlueprintTypes';

export const getCottage = (): Blueprint => {
    return createRoom(3, 4, [
        { x: 1, z: 4 }
    ]);
};
