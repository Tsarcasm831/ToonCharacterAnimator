import { LAND_SHAPE_POINTS } from '../../data/landShape';

export const LAND_SCALE = 50.0;

let minX = Infinity;
let maxX = -Infinity;
let minZ = Infinity;
let maxZ = -Infinity;

LAND_SHAPE_POINTS.forEach((p) => {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minZ) minZ = p[1];
    if (p[1] > maxZ) maxZ = p[1];
});

export const centerX = (minX + maxX) / 2;
export const centerZ = (minZ + maxZ) / 2;
export const worldMinX = (minX - centerX) * LAND_SCALE;
export const worldMaxX = (maxX - centerX) * LAND_SCALE;
export const worldMinZ = (minZ - centerZ) * LAND_SCALE;
export const worldMaxZ = (maxZ - centerZ) * LAND_SCALE;

export const worldWidth = worldMaxX - worldMinX;
export const worldDepth = worldMaxZ - worldMinZ;

export const landCoordsToWorld = (x: number, z: number) => ({
    x: (x - centerX) * LAND_SCALE,
    z: (z - centerZ) * LAND_SCALE
});

// Pre-calculate world space points to avoid re-calculating them for every check
const WORLD_LAND_SHAPE_POINTS = LAND_SHAPE_POINTS.map(p => {
    const world = landCoordsToWorld(p[0], p[1]);
    return [world.x, world.z];
});

const isPointInPolygon = (x: number, z: number, points: number[][]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i][0], zi = points[i][1];
        const xj = points[j][0], zj = points[j][1];

        const intersect = ((zi > z) !== (zj > z))
            && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

export const isWorldPointInLand = (x: number, z: number) => {
    // Fast bounding box check
    if (x < worldMinX || x > worldMaxX || z < worldMinZ || z > worldMaxZ) {
        return false;
    }
    return isPointInPolygon(x, z, WORLD_LAND_SHAPE_POINTS);
};

export const getLandHeightAt = (x: number, z: number) => {
    // Check if point is inside the land polygon
    if (!isWorldPointInLand(x, z)) {
        return -30.0; // Underwater
    }

    // Return a flat height for the land
    // Using a constant value that is above the water level (water is at -25)
    return 5.0;
};
