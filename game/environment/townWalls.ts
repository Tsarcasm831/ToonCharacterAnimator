import * as THREE from 'three';
import { calculateBounds, landCoordsToWorld } from './landTerrain';

export type TownLand = {
  name?: string;
  points?: number[][];
};

export type TownCity = {
  name?: string;
  desc?: string;
  x: number;
  y: number;
};

export const getTownWallCenters = (land: TownLand | null | undefined, cities: TownCity[]): THREE.Vector2[] => {
  if (!land?.points?.length) return [];
  const landName = String(land.name || '').toLowerCase();
  if (!landName) return [];
  const { centerX, centerZ } = calculateBounds(land.points);

  return cities
    .filter(city => {
      const desc = String(city.desc || '').toLowerCase();
      const name = String(city.name || '').toLowerCase();
      return desc.includes(landName) || name.includes(landName);
    })
    .map(city => {
      const spawnWorld = landCoordsToWorld(city.x, city.y, centerX, centerZ);
      return new THREE.Vector2(spawnWorld.x, spawnWorld.z);
    });
};
