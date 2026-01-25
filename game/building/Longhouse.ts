import { createRoom } from './BlueprintTypes';
import type { Blueprint } from './BlueprintTypes';

export const getLonghouse = (): Blueprint => {
    return createRoom(3, 7, [
        { x: 0, z: 3 },
        { x: 3, z: 3 }
    ]);
};
