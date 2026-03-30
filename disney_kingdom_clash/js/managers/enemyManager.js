import * as THREE from 'three';
import { getAsset } from '../assets.js';
import { applyOnKill } from '../abilities/abilityHandlers.js';
import { GLITCH_DATA } from '../data/glitchData.js';
import { createPurifiedModel } from '../utils/placeholders.js';
import { WAVES_CONFIG } from '../data/waveData.js';
import * as UnitManager from './unitManager.js';
import * as GameState from '../gameState.js';
import * as UI from '../ui.js';

let scene;
let enemies = [];
const mixers = [];
let spawnTimer = 3.0; // Initial delay
let endGameCallback = null;
let camera;
const GLITCH_IDS = Object.keys(GLITCH_DATA);

let WAVES = [];
let currentWaveIndex = 0;
let enemiesSpawnedThisWave = 0;
let gameEnded = false;

const PATH_WAYPOINTS = [
    new THREE.Vector3(11.5, 0, 12),    // Start (bottom-right)
    new THREE.Vector3(11.5, 0, -13.5), // Top-right corner
    new THREE.Vector3(-11.5, 0, -13.5),// Top-left corner
    new THREE.Vector3(-11.5, 0, 12)    // End (bottom-left)
];

export function init(mainScene, onGameEnd, mainCamera, stageData) {
    scene = mainScene;
    endGameCallback = onGameEnd;
    camera = mainCamera;

    WAVES = []; // Reset waves
    if (!stageData || !stageData.id) {
        console.error("Invalid stageData passed to EnemyManager.init. Defaulting to first level.", stageData);
        WAVES = WAVES_CONFIG['enchanted_plains_1'] || [];
    } else if (!WAVES_CONFIG[stageData.id]) {
        console.error(`Wave config not found for stage ID: ${stageData.id}. Defaulting to first level.`);
        WAVES = WAVES_CONFIG['enchanted_plains_1'] || [];
    } else {
        const levelId = stageData.id;
        WAVES = WAVES_CONFIG[levelId] || [];
    }
    
    // Initialize wave counter
    UI.updateWave(1, WAVES.length || 0);

    enemies = [];
    mixers.length = 0;
    spawnTimer = 3.0;
    currentWaveIndex = 0;
    enemiesSpawnedThisWave = 0;
    gameEnded = false;
}

export function destroy() {
    enemies.forEach(e => {
        if (e.model && e.model.parent) {
            scene.remove(e.model);
        }
        if (e.healthBar && e.healthBar.container) {
            e.healthBar.container.remove();
        }
    });
    enemies = [];
    mixers.length = 0;
    spawnTimer = 3.0;
    currentWaveIndex = 0;
    enemiesSpawnedThisWave = 0;
    gameEnded = false;
}

function toScreenPosition(vec3, camera) {
    const vector = vec3.clone();
    vector.project(camera);
    const x = (vector.x * .5 + .5) * window.innerWidth;
    const y = (vector.y * -.5 + .5) * window.innerHeight;
    return { x, y };
}

export function dealDamage(enemy, damage, attacker) {
    if (enemy.hp <= 0 || enemy.isPurified) return; // Don't damage already defeated/purified enemies

    let finalDamage = damage;
    
    // Apply curse if active and not expired
    if (enemy.curseUntil && enemy.curseUntil > performance.now()) {
        finalDamage *= enemy.curseMultiplier;
    } else if (enemy.curseUntil) {
        // Clean up expired curse
        enemy.curseMultiplier = 1.0;
        enemy.curseUntil = 0;
    }

    enemy.hp -= finalDamage;

    // Update health bar
    if (enemy.healthBar) {
        const healthPercentage = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
        enemy.healthBar.fill.style.width = `${healthPercentage}%`;
    }

    if (enemy.hp <= 0) {
        enemy.killer = attacker;
        purifyEnemy(enemy);
    }
}

export function update(delta) {
    if (gameEnded) {
        // Only process fade-out for purified enemies after game has ended
        enemies.forEach((e, i) => {
            if (e.isPurified) {
                updatePurified(e, delta);
            }
        });
        pruneEnemies();
        return;
    }

    // Check for victory condition
    if (currentWaveIndex >= WAVES.length && enemies.length === 0) {
        gameEnded = true;
        endGameCallback(true); // Victory!
        return; // Stop further processing
    }

    // Spawn logic
    if (currentWaveIndex < WAVES.length) {
        const currentWave = WAVES[currentWaveIndex];
        // Are we ready to start the next wave? (current wave done spawning and all enemies dead)
        if (enemiesSpawnedThisWave >= currentWave.count && enemies.length === 0) {
            currentWaveIndex++;
            enemiesSpawnedThisWave = 0;
            spawnTimer = 0; // reset for the new wave's interval
            if (currentWaveIndex < WAVES.length) {
                console.log(`Starting Wave ${currentWaveIndex + 1}`);
                UI.updateWave(currentWaveIndex + 1, WAVES.length);
            }
        }
        // Is it time to spawn an enemy for the current wave?
        else if (enemiesSpawnedThisWave < currentWave.count) {
            spawnTimer += delta;
            if (spawnTimer >= currentWave.interval) {
                spawnTimer = 0;
                spawnEnemy();
                enemiesSpawnedThisWave++;
            }
        }
    }

    enemies.forEach((e, i) => {
        e.mixer.update(delta);
        if (e.isPurified) {
            updatePurified(e, delta);
        } else if (!gameEnded) {
            updateEnemyMovement(e, delta, i)
        }
    });
    updateHealthBars();
    pruneEnemies();
}

function spawnEnemy() {
    const currentWave = WAVES[currentWaveIndex];
    const availableGlitches = currentWave.glitchTypes || GLITCH_IDS;
    const randomGlitchId = availableGlitches[Math.floor(Math.random() * availableGlitches.length)];
    const glitchData = GLITCH_DATA[randomGlitchId];

    const modelData = getAsset(randomGlitchId);
    if (!modelData) {
        console.error(`Could not get asset for glitch: ${randomGlitchId}`);
        return;
    }
    const model = modelData.scene.clone();
    const mixer = new THREE.AnimationMixer(model);
    const walkClip = THREE.AnimationClip.findByName(modelData.animations, 'walk');
    if (walkClip) mixer.clipAction(walkClip).play();

    model.position.copy(PATH_WAYPOINTS[0]);
    scene.add(model);
    
    // Health Bar
    const healthBarContainer = document.createElement('div');
    healthBarContainer.className = 'health-bar-container';
    const healthBarFill = document.createElement('div');
    healthBarFill.className = 'health-bar-fill';
    healthBarContainer.appendChild(healthBarFill);
    document.getElementById('game-ui').appendChild(healthBarContainer);

    const enemy = { 
        id: randomGlitchId,
        model, 
        mixer, 
        hp: currentWave.hp, 
        maxHp: currentWave.hp,
        speed: currentWave.speed,
        targetWaypointIndex: 1,
        isPurified: false,
        purifyTimer: 0,
        slowUntil: 0,
        slowAmount: 0,
        frozenUntil: 0,
        burnUntil: 0,
        burnDamage: 0,
        burnTickTimer: 0,
        killer: null,
        curseMultiplier: 1.0,
        curseUntil: 0,
        healthBar: {
            container: healthBarContainer,
            fill: healthBarFill,
        },
    };
    enemies.push(enemy);
    mixers.push(mixer);
}

function updatePurified(enemy, delta) {
    enemy.purifyTimer += delta;
    if (enemy.purifyTimer > 3.0) { // Fade out after 3 seconds
        const opacity = Math.max(0, 1 - (enemy.purifyTimer - 3.0) / 2.0); // 2 second fade
        if (enemy.model.children[0].material) {
            enemy.model.children[0].material.opacity = opacity;
        }
        if (opacity <= 0) {
            enemy.toBeRemoved = true;
        }
    }
}

function purifyEnemy(enemy) {
    enemy.isPurified = true;
    enemy.purifyTimer = 0;

    // Stop animations and effects
    enemy.mixer.stopAllAction();
    if (enemy.healthBar) {
        enemy.healthBar.container.remove();
        enemy.healthBar = null;
    }

    // Give rewards
    if (enemy.killer) {
        applyOnKill(enemy.killer, enemy);
    }
    
    GameState.trackPurifiedEnemy(enemy.id);
    UI.updatePurifiedCount();
    
    const manaReward = 5;
    GameState.addMana(manaReward);
    UI.updateMana();

    // Track purification for end-of-game stats
    console.log(`Purified enemy: ${enemy.id}`);
    
    // Replace model with purified version
    const oldPosition = enemy.model.position.clone();
    scene.remove(enemy.model);

    const purifiedModelData = createPurifiedModel(enemy.id);
    if (purifiedModelData) {
        enemy.model = purifiedModelData.scene;
        enemy.model.position.copy(oldPosition);
        scene.add(enemy.model);
    } else {
        console.warn(`Could not create purified model for ${enemy.id}`);
        // Mark for removal if model fails
        enemy.toBeRemoved = true;
    }
}

function updateEnemyMovement(e, delta, enemyIndex) {
    if (e.frozenUntil && e.frozenUntil > performance.now()) {
        const material = e.model.getObjectByName("Body")?.material;
        if(material) material.emissive = new THREE.Color(0xADD8E6);
        return; // Frozen
    }
    // Handle slow effect
    let currentSpeed = e.speed;
    const isSlowed = e.slowUntil > performance.now();
    if (isSlowed) {
        currentSpeed *= (1 - e.slowAmount);
        const material = e.model.getObjectByName("Body")?.material;
        if (material && material.color.getHex() !== 0x8888FF) material.color.set(0x8888FF); // Tint blue when slowed
    } else {
        const material = e.model.getObjectByName("Body")?.material;
        if (material && material.color.getHex() !== 0x282828) material.color.set(0x282828); // Reset color
    }
    
    // Handle burn effect
    if (e.burnUntil > performance.now()) {
        e.burnTickTimer += delta;
        if(e.burnTickTimer >= 1.0) { // Tick every second
            dealDamage(e, e.burnDamage, null); // Use dealDamage to correctly handle purification
            e.burnTickTimer = 0;
        }
    } else if (e.burnDamage > 0) { // Check if burn was active before
        e.burnDamage = 0; // Clear burn when it expires
    }

    const material = e.model.getObjectByName("Body")?.material;
    if(material) material.emissive = new THREE.Color(0x000000); // Reset emissive color

    if (e.targetWaypointIndex >= PATH_WAYPOINTS.length) {
        // Reached the end
        e.hp = 0;

        // Remove from world immediately to prevent further processing
        if (e.healthBar) {
            e.healthBar.container.remove();
            e.healthBar = null; // Important to null it out
        }
        e.toBeRemoved = true; // Mark for pruning from array
    
        if(!gameEnded) {
            gameEnded = true;
            endGameCallback(false); // Defeat
        }
        return; // Important to return here after handling
    }

    const targetWaypoint = PATH_WAYPOINTS[e.targetWaypointIndex];
    const moveDirection = targetWaypoint.clone().sub(e.model.position).normalize();
    e.model.position.add(moveDirection.multiplyScalar(currentSpeed * delta));

    // Simple look-at for turning corners
    e.model.lookAt(targetWaypoint);

    if (e.model.position.distanceTo(targetWaypoint) < 0.2) {
        e.targetWaypointIndex++;
    }
}

function updateHealthBars() {
    enemies.forEach(enemy => {
        if (enemy.model && enemy.healthBar && !enemy.isPurified) {
            if (enemy.hp > 0) {
                const screenPos = toScreenPosition(enemy.model.position, camera);
                enemy.healthBar.container.style.transform = `translate(-50%, -50%) translate(${screenPos.x}px, ${screenPos.y - 40}px)`;
                enemy.healthBar.container.style.opacity = '1';
            } else {
                enemy.healthBar.container.style.opacity = '0';
            }
        }
    });
}

function pruneEnemies() {
    const remainingEnemies = [];
    
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.toBeRemoved) {
            if(e.model && e.model.parent) {
                scene.remove(e.model);
            }
        } else {
            remainingEnemies.push(e);
        }
    }
    enemies = remainingEnemies;
}

export function findNearestEnemy(pos) {
    let nearestEnemy = null;
    let minDistance = Infinity;

    enemies.forEach(enemy => {
        if (enemy.isPurified) return;
        const distance = pos.distanceTo(enemy.model.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    });
    return nearestEnemy;
}

export function findEnemiesInRadius(position, radius) {
    const enemiesInRadius = [];
    enemies.forEach(enemy => {
        if (enemy.isPurified) return;
        const distance = position.distanceTo(enemy.model.position);
        if (distance <= radius) {
            enemiesInRadius.push(enemy);
        }
    });
    return enemiesInRadius;
}

export function applyKnockback(enemy, distance) {
    if (enemy.targetWaypointIndex === 0) return; // Cannot knock back from spawn

    const targetWaypoint = PATH_WAYPOINTS[enemy.targetWaypointIndex];
    const prevWaypoint = PATH_WAYPOINTS[enemy.targetWaypointIndex - 1];
    const pathSegmentDirection = targetWaypoint.clone().sub(prevWaypoint).normalize();

    // Move backwards along the path segment
    enemy.model.position.sub(pathSegmentDirection.multiplyScalar(distance));

    // Check if we got pushed behind the previous waypoint and clamp position
    const distToPrev = enemy.model.position.distanceTo(prevWaypoint);
    const segmentLength = prevWaypoint.distanceTo(targetWaypoint);
    if (distToPrev > segmentLength) {
         enemy.model.position.copy(prevWaypoint);
    }
}

export function getAllEnemies() {
    return enemies.filter(e => !e.isPurified);
}

export function getWaveInfo() {
    return { current: currentWaveIndex + 1, total: WAVES.length };
}