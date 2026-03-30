import * as THREE from 'three';

export const GRID_COLS = 5;
export const GRID_ROWS = 4;
export const P1_GRID = Array.from({ length: GRID_COLS }, () => Array(GRID_ROWS).fill(null));
export const P2_GRID = Array.from({ length: GRID_COLS }, () => Array(GRID_ROWS).fill(null));

export const P1_ORIGIN = new THREE.Vector3(-1, 0, 14);
export const P2_ORIGIN = new THREE.Vector3(-1, 0, -14);

function createGrid(scene, origin) {
    const CELL_SIZE = 4;
    const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const geo = new THREE.PlaneGeometry(CELL_SIZE * 0.95, CELL_SIZE * 0.95);

    for (let i = 0; i < GRID_COLS; i++) {
        for (let j = 0; j < GRID_ROWS; j++) {
            const mesh = new THREE.Mesh(geo, mat);
            const x = origin.x + (i - (GRID_COLS - 1) / 2) * CELL_SIZE;
            const z = origin.z + (j - (GRID_ROWS - 1) / 2) * -CELL_SIZE;
            mesh.position.set(x, 0.1, z);
            mesh.rotation.x = -Math.PI / 2;
            mesh.receiveShadow = true;
            scene.add(mesh);
        }
    }
}

export function init(scene) {
    P1_GRID.forEach(row => row.fill(null));
    P2_GRID.forEach(row => row.fill(null));
    createGrid(scene, P1_ORIGIN);
    createGrid(scene, P2_ORIGIN);
}

export function gridToWorld(i, j, origin) {
    const CELL_SIZE = 4;
    const x = origin.x + (i - (GRID_COLS - 1) / 2) * CELL_SIZE;
    const z = origin.z + (j - (GRID_ROWS - 1) / 2) * -CELL_SIZE;
    return new THREE.Vector3(x, 0.1, z);
}