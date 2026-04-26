import * as THREE from 'three';

export function getRandomSphericalCoordinate(radius: number): THREE.Vector3 {
  const phi = Math.acos(2 * Math.random() - 1);
  const theta = Math.random() * 2 * Math.PI;

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}
