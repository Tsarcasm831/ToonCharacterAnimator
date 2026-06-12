import type { RPGContainerDef, WolfDenDef } from '../types';

// ============================================================================
// The single source of truth for the Thornwood Vale map. The terrain height
// function here drives BOTH the rendered ground mesh (RPG/world/RPGWorld.ts)
// and the physics samplers handed to PlayerUtils, so they can never disagree.
// Coordinates are world meters. +Z is south (toward the player's start camp),
// -Z is north (toward Briarhollow town).
// ============================================================================

export const WORLD_NAME = 'Thornwood Vale';
export const TOWN_NAME = 'Briarhollow';

// -- Bounds -------------------------------------------------------------------

export const WORLD_EXTENT = 180; // playable square: [-180, 180] on both axes
export const WORLD_POLYGON: number[][] = [
  [-WORLD_EXTENT, -WORLD_EXTENT],
  [WORLD_EXTENT, -WORLD_EXTENT],
  [WORLD_EXTENT, WORLD_EXTENT],
  [-WORLD_EXTENT, WORLD_EXTENT],
];

// -- Town plateau ---------------------------------------------------------------

export const TOWN_RECT = { minX: -52, maxX: 52, minZ: -160, maxZ: -78 };
export const TOWN_CENTER: [number, number] = [0, -118];
export const TOWN_PLATEAU_HEIGHT = 2.0;
export const TOWN_FEATHER = 16; // meters of smooth blend around the plateau
/** The gate opening is centered on the south wall. */
export const TOWN_GATE: [number, number] = [0, TOWN_RECT.maxZ];
export const TOWN_GATE_WIDTH = 8;

// -- Player start -----------------------------------------------------------------

export const SPAWN_CAMP: [number, number] = [10, 128];
export const SPAWN_FACING_Y = Math.PI; // face north, toward the road & town
export const TOWN_RESPAWN: [number, number] = [0, -100]; // plaza-side respawn

// -- Road (camp -> town gate) -------------------------------------------------------

export const ROAD_PATH: [number, number][] = [
  [12, 132],
  [8, 110],
  [-2, 78],
  [-8, 44],
  [-4, 8],
  [2, -34],
  [0, -60],
  [0, -84],
];
export const ROAD_HALF_WIDTH = 3.2;
export const ROAD_FEATHER = 3.5;

// -- Lake ----------------------------------------------------------------------------

export const LAKE = { x: -95, z: 45, radius: 26, depth: 2.6 };
export const WATER_LEVEL = -0.55;

// -- Wolf dens --------------------------------------------------------------------------

export const WOLF_DENS: WolfDenDef[] = [
  { id: 'den_east', center: [85, 55], packSize: 4, wanderRadius: 24 },
  { id: 'den_west', center: [-72, -18], packSize: 3, wanderRadius: 22 },
  { id: 'den_north', center: [98, -112], packSize: 4, wanderRadius: 24 },
];
export const WOLF_RESPAWN_SEC = 75;
export const WOLF_RESPAWN_MIN_PLAYER_DIST = 40;

// -- Containers ------------------------------------------------------------------------------

export const CONTAINERS: RPGContainerDef[] = [
  {
    id: 'starter_chest',
    kind: 'chest',
    mode: 'loot',
    position: [13, 125.5],
    rotationY: -Math.PI / 3,
    label: 'Traveler’s Cache',
    loot: [
      { name: 'Potion of Healing', count: 2 },
      { name: 'Red Berries', count: 2 },
    ],
    lootGold: 15,
  },
  {
    id: 'road_barrel',
    kind: 'barrel',
    mode: 'loot',
    position: [-9, 30],
    label: 'Roadside Barrel',
    loot: [
      { name: 'Red Berries', count: 3 },
      { name: 'Porkchop', count: 1 },
    ],
  },
  {
    id: 'lake_ruin_chest',
    kind: 'chest',
    mode: 'loot',
    position: [-118, 56],
    rotationY: Math.PI / 2.4,
    label: 'Sunken Strongbox',
    loot: [
      { name: 'Gold Ring', count: 1 },
      { name: 'Potion of Healing', count: 1 },
    ],
    lootGold: 10,
  },
  {
    id: 'den_crate',
    kind: 'crate',
    mode: 'loot',
    position: [68, 40],
    label: 'Abandoned Supply Crate',
    loot: [
      { name: 'Rope', count: 2 },
      { name: 'Potion of Healing', count: 1 },
    ],
  },
  {
    id: 'wardens_cache',
    kind: 'chest',
    mode: 'loot',
    position: [148, 96],
    rotationY: Math.PI,
    label: 'Wardens’ Cache',
    loot: [{ name: 'Halberd', count: 1 }],
    lootGold: 25,
  },
  {
    id: 'town_stash',
    kind: 'chest',
    mode: 'storage',
    position: [16, -134],
    rotationY: Math.PI,
    label: 'Your Stash',
    capacity: 24,
  },
];

// ============================================================================
// Terrain math
// ============================================================================

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 0 inside the town rect, rising to 1 beyond the feather band. */
function townOutsideFactor(x: number, z: number): number {
  const dx = Math.max(TOWN_RECT.minX - x, 0, x - TOWN_RECT.maxX);
  const dz = Math.max(TOWN_RECT.minZ - z, 0, z - TOWN_RECT.maxZ);
  const d = Math.hypot(dx, dz);
  return smoothstep(0, TOWN_FEATHER, d);
}

/** Distance from (x,z) to the road polyline. */
export function distToRoad(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < ROAD_PATH.length - 1; i++) {
    const [ax, az] = ROAD_PATH[i];
    const [bx, bz] = ROAD_PATH[i + 1];
    const abx = bx - ax;
    const abz = bz - az;
    const len2 = abx * abx + abz * abz || 1;
    const t = Math.min(1, Math.max(0, ((x - ax) * abx + (z - az) * abz) / len2));
    const px = ax + abx * t;
    const pz = az + abz * t;
    best = Math.min(best, Math.hypot(x - px, z - pz));
  }
  return best;
}

/** 1 on the road surface, fading to 0 across the feather band. */
export function roadMaskAt(x: number, z: number): number {
  const d = distToRoad(x, z);
  return 1 - smoothstep(ROAD_HALF_WIDTH, ROAD_HALF_WIDTH + ROAD_FEATHER, d);
}

function baseHills(x: number, z: number): number {
  return (
    1.7 * Math.sin(x * 0.021) * Math.cos(z * 0.017) +
    1.05 * Math.sin(x * 0.043 + 1.7) * Math.cos(z * 0.038 + 0.6) +
    0.45 * Math.sin(x * 0.09 + 0.3) * Math.sin(z * 0.085 + 2.1)
  );
}

/** Rim hills near the world border keep the horizon natural. */
function rimHeight(x: number, z: number): number {
  const r = Math.max(Math.abs(x), Math.abs(z));
  return smoothstep(WORLD_EXTENT - 34, WORLD_EXTENT + 6, r) * 13;
}

function lakeDepression(x: number, z: number): number {
  const d = Math.hypot(x - LAKE.x, z - LAKE.z);
  const t = 1 - smoothstep(LAKE.radius * 0.35, LAKE.radius, d);
  return t * (LAKE.depth + 1.4);
}

/**
 * THE terrain height function. Used by the ground mesh, PlayerUtils samplers,
 * prop placement, and entity grounding.
 */
export function terrainHeightAt(x: number, z: number): number {
  let h = baseHills(x, z);
  h *= 1 - 0.6 * roadMaskAt(x, z); // calm the road
  h += rimHeight(x, z);
  h -= lakeDepression(x, z);
  // Blend to the flat town plateau.
  const outside = townOutsideFactor(x, z);
  return TOWN_PLATEAU_HEIGHT * (1 - outside) + h * outside;
}

/** Water depth at a point (0 when dry). */
export function waterDepthAt(x: number, z: number): number {
  const d = Math.hypot(x - LAKE.x, z - LAKE.z);
  if (d > LAKE.radius) return 0;
  const ground = terrainHeightAt(x, z);
  return Math.max(0, WATER_LEVEL - ground);
}

export function isInTown(x: number, z: number): boolean {
  return x >= TOWN_RECT.minX && x <= TOWN_RECT.maxX && z >= TOWN_RECT.minZ && z <= TOWN_RECT.maxZ;
}

/** Keep-out test for scattering trees/rocks/grass. */
export function isClearForProps(x: number, z: number): boolean {
  if (isInTown(x, z)) return false;
  const dx = Math.max(TOWN_RECT.minX - x, 0, x - TOWN_RECT.maxX);
  const dz = Math.max(TOWN_RECT.minZ - z, 0, z - TOWN_RECT.maxZ);
  if (Math.hypot(dx, dz) < 10) return false; // wall apron
  if (distToRoad(x, z) < ROAD_HALF_WIDTH + 2.5) return false;
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.radius + 3) return false;
  if (Math.hypot(x - SPAWN_CAMP[0], z - SPAWN_CAMP[1]) < 9) return false;
  return true;
}

// -- World clock -------------------------------------------------------------------------
// NOTE: LightingManager's clock is sunrise-based: timeOfDay 0 = sunrise,
// noon = 7.2, sunset = 14.4 (DAY_RATIO 0.6 of a 600s cycle), night 14.4-24.

export const INITIAL_TIME_OF_DAY = 4.8; // mid-morning sun
export const TIME_SPEED = 0.35; // full day/night ≈ 28.5 real minutes
