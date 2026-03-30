import * as THREE from 'three';
import * as CoopGameState from './coopGameState.js';
import * as CoopUiManager from './coopUiManager.js';
import { getAsset } from '../../assets.js';
import { GLITCH_DATA } from '../../data/glitchData.js';

let scene, onGameEndCallback;
let enemies = [];
let gameEnded = false;

export const PATH_WAYPOINTS = [
    new THREE.Vector3(-13, 0, 25), // P1 side spawn
    new THREE.Vector3(-13, 0, -25),// P2 side spawn
    new THREE.Vector3(-13, 0, 0),  // T-junction (converge point)
    new THREE.Vector3(9, 0, 0)     // Exit
];

export function init(mainScene, onGameEnd) {
    scene = mainScene;
    onGameEndCallback = onGameEnd;
    enemies = [];
    gameEnded = false;
}

function spawnEnemy() {
    CoopGameState.coopGameState.wave++;
    CoopUiManager.update();

    const waveSize = 1 + CoopGameState.coopGameState.wave;
    for (let i = 0; i < waveSize; i++) {
        setTimeout(() => {
            const randomGlitchId = 'glitch_wolf';
            const modelData = getAsset(randomGlitchId);
            if (!modelData) return;

            const model = modelData.scene.clone();
            const mixer = new THREE.AnimationMixer(model);
            const walkClip = THREE.AnimationClip.findByName(modelData.animations, 'walk');
            if (walkClip) mixer.clipAction(walkClip).play();

            const spawnPointIndex = i % 2; // Alternates between 0 and 1
            model.position.copy(PATH_WAYPOINTS[spawnPointIndex]);
            scene.add(model);
            
            const enemy = { 
                id: randomGlitchId, model, mixer, 
                hp: 500 * (1 + CoopGameState.coopGameState.wave * 0.2), 
                maxHp: 500, speed: 2.5,
                targetWaypointIndex: 2, // First target for all is the T-junction
            };
            enemies.push(enemy);
        }, i * 1000); // Stagger spawns within a wave
    }
}

export function update(delta) {
    if (gameEnded) return;

    if (CoopGameState.coopGameState.wave >= CoopGameState.coopGameState.totalWaves && enemies.length === 0) {
        if (onGameEndCallback) onGameEndCallback(true);
        gameEnded = true;
        return;
    }

    if(enemies.length === 0 && CoopGameState.coopGameState.wave < CoopGameState.coopGameState.totalWaves) {
        CoopGameState.coopGameState.enemySpawnTimer -= delta;
        if (CoopGameState.coopGameState.enemySpawnTimer <= 0) {
            spawnEnemy();
            CoopGameState.coopGameState.enemySpawnTimer = 10.0; // Time between waves
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if(e.toBeRemoved) {
            scene.remove(e.model);
            enemies.splice(i, 1);
            continue;
        }

        e.mixer.update(delta);

        if(e.hp <= 0) {
            e.toBeRemoved = true;
            CoopGameState.coopGameState.p1_mana += 10;
            CoopGameState.coopGameState.p2_mana += 10;
            CoopUiManager.update();
            continue;
        }
        
        const targetIndex = e.targetWaypointIndex;

        if (targetIndex >= PATH_WAYPOINTS.length) {
            CoopGameState.coopGameState.hp--;
            CoopUiManager.update();
            e.toBeRemoved = true;
            if (CoopGameState.coopGameState.hp <= 0) {
                if (onGameEndCallback) onGameEndCallback(false);
                gameEnded = true;
                return;
            }
            continue;
        }

        const targetWaypoint = PATH_WAYPOINTS[targetIndex];
        const moveDirection = targetWaypoint.clone().sub(e.model.position).normalize();
        e.model.position.add(moveDirection.multiplyScalar(e.speed * delta));
        e.model.lookAt(targetWaypoint);

        if (e.model.position.distanceTo(targetWaypoint) < 0.2) {
            e.targetWaypointIndex++;
        }
    }
}

export function findNearestEnemy(pos) {
    let nearestEnemy = null;
    let minDistance = Infinity;
    enemies.forEach(enemy => {
        const distance = pos.distanceTo(enemy.model.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    });
    return nearestEnemy;
}

export function dealDamage(enemy, damage) {
    if (enemy.hp <= 0) return;
    enemy.hp -= damage;
}