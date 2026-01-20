import { LAND_SHAPE_POINTS } from '../../data/landShape';

const LAND_SCALE = 50.0;

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

const centerX = (minX + maxX) / 2;
const centerZ = (minZ + maxZ) / 2;
const worldMinX = (minX - centerX) * LAND_SCALE;
const worldMaxX = (maxX - centerX) * LAND_SCALE;
const worldMinZ = (minZ - centerZ) * LAND_SCALE;
const worldMaxZ = (maxZ - centerZ) * LAND_SCALE;
const xRange = Math.max(1, worldMaxX - worldMinX);
const zRange = Math.max(1, worldMaxZ - worldMinZ);

const smoothstep = (a: number, b: number, t: number) => {
    const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
};

const hash2D = (x: number, z: number) => {
    const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return s - Math.floor(s);
};

const valueNoise = (x: number, z: number) => {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const xf = x - xi;
    const zf = z - zi;
    const u = xf * xf * (3 - 2 * xf);
    const v = zf * zf * (3 - 2 * zf);
    const n00 = hash2D(xi, zi);
    const n10 = hash2D(xi + 1, zi);
    const n01 = hash2D(xi, zi + 1);
    const n11 = hash2D(xi + 1, zi + 1);
    const nx0 = n00 * (1 - u) + n10 * u;
    const nx1 = n01 * (1 - u) + n11 * u;
    return nx0 * (1 - v) + nx1 * v;
};

const fbm = (x: number, z: number) => {
    let amp = 1.0;
    let freq = 0.008;
    let sum = 0.0;
    let norm = 0.0;
    for (let i = 0; i < 4; i += 1) {
        sum += valueNoise(x * freq, z * freq) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2.0;
    }
    return sum / Math.max(0.0001, norm);
};

export const landCoordsToWorld = (x: number, z: number) => ({
    x: (x - centerX) * LAND_SCALE,
    z: (z - centerZ) * LAND_SCALE
});

export const getLandHeightAt = (x: number, z: number) => {
    const northness = (z - worldMinZ) / zRange;
    const edgeFade = smoothstep(0.02, 0.08, (x - worldMinX) / xRange) *
        smoothstep(0.02, 0.08, (worldMaxX - x) / xRange) *
        smoothstep(0.02, 0.08, northness) *
        smoothstep(0.02, 0.08, 1 - northness);

    const plains = 2.0 + fbm(x + 100, z - 50) * 3.0;
    const plateaus = 10.0 + Math.floor(fbm(x - 200, z + 80) * 3.0) * 3.5 + fbm(x * 0.5, z * 0.5) * 2.0;
    const mountains = 20.0 + Math.pow(fbm(x - 300, z + 200), 2.0) * 45.0;

    const southBlend = smoothstep(0.0, 0.45, northness);
    const northBlend = smoothstep(0.55, 1.0, northness);
    const centerWeight = 1.0 - Math.abs(northness - 0.5) * 2.0;

    const heightSouth = plains + (plateaus - plains) * southBlend;
    const heightNorth = plateaus + (mountains - plateaus) * northBlend;
    const height = heightSouth + (heightNorth - heightSouth) * smoothstep(0.4, 0.6, northness);

    return height * edgeFade * (0.65 + 0.35 * centerWeight);
};
