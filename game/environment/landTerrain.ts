import { LAND_SHAPE_POINTS } from '../../data/landShape';

export const LAND_SCALE = 50.0;

// Helper to calculate bounds from points
export const calculateBounds = (points: number[][]) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    points.forEach((p) => {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minZ) minZ = p[1];
        if (p[1] > maxZ) maxZ = p[1];
    });

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const worldMinX = (minX - centerX) * LAND_SCALE;
    const worldMaxX = (maxX - centerX) * LAND_SCALE;
    const worldMinZ = (minZ - centerZ) * LAND_SCALE;
    const worldMaxZ = (maxZ - centerZ) * LAND_SCALE;
    
    return { minX, maxX, minZ, maxZ, centerX, centerZ, worldMinX, worldMaxX, worldMinZ, worldMaxZ };
};

// Default bounds for backward compatibility
const defaultBounds = calculateBounds(LAND_SHAPE_POINTS);

export const centerX = defaultBounds.centerX;
export const centerZ = defaultBounds.centerZ;
export const worldMinX = defaultBounds.worldMinX;
export const worldMaxX = defaultBounds.worldMaxX;
export const worldMinZ = defaultBounds.worldMinZ;
export const worldMaxZ = defaultBounds.worldMaxZ;

export const worldWidth = worldMaxX - worldMinX;
export const worldDepth = worldMaxZ - worldMinZ;

export const landCoordsToWorld = (x: number, z: number, cX = centerX, cZ = centerZ) => ({
    x: (x - cX) * LAND_SCALE,
    z: (z - cZ) * LAND_SCALE
});

// Pre-calculate world space points to avoid re-calculating them for every check
const WORLD_LAND_SHAPE_POINTS = LAND_SHAPE_POINTS.map(p => {
    const world = landCoordsToWorld(p[0], p[1]);
    return [world.x, world.z];
});

export const isPointInPolygon = (x: number, z: number, points: number[][]) => {
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

// Generic check with custom points and bounds
export const isPointInLandShape = (x: number, z: number, points: number[][], bounds: { worldMinX: number, worldMaxX: number, worldMinZ: number, worldMaxZ: number }) => {
    // Fast bounding box check
    if (x < bounds.worldMinX || x > bounds.worldMaxX || z < bounds.worldMinZ || z > bounds.worldMaxZ) {
        return false;
    }
    return isPointInPolygon(x, z, points);
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
