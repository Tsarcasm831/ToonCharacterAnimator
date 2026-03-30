import * as THREE from 'three';
import * as UI from '../ui.js';

export const GRID_ROWS = 5;
export const GRID_COLS = 5;
export const CELL_SIZE = 4;
export const GRID = Array.from({ length: GRID_COLS }, () => Array(GRID_ROWS).fill(null));

let cellMeshes = [];
let scene, camera, onClickCallback;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedIndicator;

export function setupGrid(mainScene, mainCamera, callback) {
    scene = mainScene;
    camera = mainCamera;
    onClickCallback = callback;

    const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const geo = new THREE.PlaneGeometry(CELL_SIZE * 0.95, CELL_SIZE * 0.95);

    for (let i = 0; i < GRID_COLS; i++) {
        for (let j = 0; j < GRID_ROWS; j++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(gridToWorld(i, j));
            mesh.rotation.x = -Math.PI / 2;
            mesh.userData = { gridPos: [i, j] };
            mesh.receiveShadow = true;
            scene.add(mesh);
            cellMeshes.push(mesh);
        }
    }
    
    const indicatorGeo = new THREE.BoxGeometry(CELL_SIZE * 1.05, 0.2, CELL_SIZE * 1.05);
    const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    selectedIndicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    selectedIndicator.visible = false;
    scene.add(selectedIndicator);

    window.addEventListener('click', onMouseClick);
}

export function destroyGrid() {
    // remove cell meshes
    cellMeshes.forEach(mesh => {
        if (mesh.parent) mesh.parent.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
    cellMeshes = [];

    // remove selection indicator
    if (selectedIndicator) {
        if (selectedIndicator.parent) selectedIndicator.parent.remove(selectedIndicator);
        selectedIndicator.geometry.dispose();
        selectedIndicator.material.dispose();
        selectedIndicator = null;
    }

    // clear GRID data
    for (let i = 0; i < GRID_COLS; i++) {
        for (let j = 0; j < GRID_ROWS; j++) {
            GRID[i][j] = null;
        }
    }

    // remove event listener
    window.removeEventListener('click', onMouseClick);
}

export function update(delta) {
    // any grid-specific updates can go here
}

export function updateSelectionIndicator(i, j) {
    if (i === null || j === null) {
        selectedIndicator.visible = false;
    } else {
        selectedIndicator.position.copy(gridToWorld(i, j));
        selectedIndicator.visible = true;
    }
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cellMeshes);
    if (intersects.length > 0) {
        const [i, j] = intersects[0].object.userData.gridPos;
        onClickCallback(i, j);
        updateSelectionIndicator(i,j);
    } else {
        const clickedElement = event.target;
        // If click was on canvas but not a cell, deselect. Also check if it's not a UI button.
        const isGameCanvas = clickedElement.id === 'game-canvas';
        const isUI = clickedElement.closest('#game-ui');

        if (isGameCanvas && !isUI) {
            onClickCallback(null, null);
            updateSelectionIndicator(null, null);
        }
    }
}

export function gridToWorld(i, j) {
    const x = (i - (GRID_COLS - 1) / 2) * CELL_SIZE;
    const z = (j - (GRID_ROWS - 1) / 2) * -CELL_SIZE;
    return new THREE.Vector3(x, 0.05, z);
}