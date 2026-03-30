import * as THREE from 'three';
import { getActiveDeck } from './utils/user.js';
import * as ProjectileManager from './utils/projectile.js';
import { preloadAll } from './assets.js';

import * as CoopGameState from './managers/coop/coopGameState.js';
import * as CoopSceneManager from './managers/coop/coopSceneManager.js';
import * as CoopGridManager from './managers/coop/coopGridManager.js';
import * as CoopUnitManager from './managers/coop/coopUnitManager.js';
import * as CoopEnemyManager from './managers/coop/coopEnemyManager.js';
import * as CoopAiManager from './managers/coop/coopAiManager.js';
import * as CoopUiManager from './managers/coop/coopUiManager.js';

// --- Private variables ---
let scene, camera, renderer, controls, gameLoopId;
const clock = new THREE.Clock();

function animate() {
    gameLoopId = requestAnimationFrame(animate);

    if (CoopGameState.coopGameState.isPaused) return;

    const delta = clock.getDelta();
    if(controls) controls.update();

    ProjectileManager.update(delta);
    CoopUnitManager.update(delta);
    CoopEnemyManager.update(delta);
    CoopAiManager.update(delta);
    
    if(renderer && scene && camera) renderer.render(scene, camera);
}

function endGame(isVictory) {
    if (gameLoopId === null) return; // Prevent multiple calls
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null; // Mark game as ended

    CoopGameState.coopGameState.isPaused = false; // Ensure game is unpaused on end

    console.log(`Co-op Game Over. Victory: ${isVictory}`);

    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');
    const button = document.getElementById('game-over-close-button');
    const statsContainer = document.getElementById('victory-stats-container');

    modal.style.display = 'flex';
    if(statsContainer) statsContainer.style.display = 'none';

    if (isVictory) {
        title.textContent = 'Victory!';
        title.className = 'victory';
        message.textContent = 'You have stabilized the realm together!';
        button.className = 'victory';
    } else {
        title.textContent = 'Defeat';
        title.className = 'defeat';
        message.textContent = 'The Disruptions have overwhelmed your team.';
        button.className = 'defeat';
    }
}

function initCoopEventListeners() {
    const p1SummonButton = document.getElementById('p1-summon-button');
    if (p1SummonButton) {
        const newSummonButton = p1SummonButton.cloneNode(true);
        p1SummonButton.parentNode.replaceChild(newSummonButton, p1SummonButton);
        newSummonButton.addEventListener('click', () => CoopUnitManager.trySummon('p1'));
    }
    const p1MergeButton = document.getElementById('p1-merge-button');
    if(p1MergeButton) {
        const newMergeButton = p1MergeButton.cloneNode(true);
        p1MergeButton.parentNode.replaceChild(newMergeButton, p1MergeButton);
        newMergeButton.disabled = true; // P1 merge not implemented yet
    }

    const coopSettingsButton = document.getElementById('coop-settings-button');
    if (coopSettingsButton) {
        const newSettingsButton = coopSettingsButton.cloneNode(true);
        coopSettingsButton.parentNode.replaceChild(newSettingsButton, coopSettingsButton);
        newSettingsButton.addEventListener('click', toggleCoopPauseMenu);
    }

    // Re-wire in-game settings modal buttons for co-op context
    const resumeGameButton = document.getElementById('resume-game-button');
    if (resumeGameButton) {
        const newResumeButton = resumeGameButton.cloneNode(true);
        resumeGameButton.parentNode.replaceChild(newResumeButton, resumeGameButton);
        newResumeButton.addEventListener('click', toggleCoopPauseMenu);
    }

    const quitGameButton = document.getElementById('quit-game-button');
    if (quitGameButton) {
        const newQuitButton = quitGameButton.cloneNode(true);
        quitGameButton.parentNode.replaceChild(newQuitButton, quitGameButton);
        newQuitButton.addEventListener('click', () => {
             if (gameLoopId) {
                cancelAnimationFrame(gameLoopId);
                gameLoopId = null;
            }
            CoopGameState.coopGameState.isPaused = false;
            document.getElementById('game-canvas').style.display = 'none';
            document.getElementById('coop-ui').style.display = 'none';
            document.getElementById('in-game-settings-modal').style.display = 'none';
            document.getElementById('main-menu-screen').style.display = 'flex';
        });
    }

    const gameOverButton = document.getElementById('game-over-close-button');
    const returnToMenu = () => {
        document.getElementById('game-canvas').style.display = 'none';
        document.getElementById('coop-ui').style.display = 'none';
        document.getElementById('game-over-modal').style.display = 'none';
        document.getElementById('main-menu-screen').style.display = 'flex';
        // When returning to menu, ensure main UI is hidden and coop UI is hidden.
        const gameUi = document.getElementById('game-ui');
        if (gameUi) gameUi.style.display = 'none';
    };
    // Re-bind listener to prevent duplicates from previous games
    const newGameOverButton = gameOverButton.cloneNode(true);
    gameOverButton.parentNode.replaceChild(newGameOverButton, gameOverButton);
    newGameOverButton.addEventListener('click', () => {
        // Make sure co-op UI is hidden when returning to menu.
        const coopUi = document.getElementById('coop-ui');
        if (coopUi) coopUi.style.display = 'none';
        returnToMenu();
    });
}

function toggleCoopPauseMenu() {
    CoopGameState.coopGameState.isPaused = !CoopGameState.coopGameState.isPaused;
    const modal = document.getElementById('in-game-settings-modal');
    if (modal) {
        modal.style.display = CoopGameState.coopGameState.isPaused ? 'flex' : 'none';
    }
}

export async function initCoopMode() {
    console.log("Initializing Co-op Mode...");
    if (gameLoopId) cancelAnimationFrame(gameLoopId);

    document.querySelectorAll('.menu-overlay, #menu-screen').forEach(el => el.style.display = 'none');
    
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';

    await preloadAll();

    loadingScreen.style.display = 'none';

    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.innerHTML = `<canvas id="game-canvas"></canvas>`;
    canvasContainer.style.display = 'block';

    const coopUi = document.getElementById('coop-ui');
    if (coopUi) {
        coopUi.style.display = 'block';
    }

    const sceneObjects = CoopSceneManager.initScene();
    scene = sceneObjects.scene;
    camera = sceneObjects.camera;
    renderer = sceneObjects.renderer;
    controls = sceneObjects.controls;

    CoopGameState.init();
    CoopGridManager.init(scene);
    
    const p1_deck = getActiveDeck().map(heroId => `${heroId}_lvl1`);
    const ai_deck = ['groot_lvl1', 'lumiere_lvl1', 'minnie_lvl1', 'winnie_the_pooh_lvl1', 'elsa_lvl1'];

    ProjectileManager.init();
    CoopUnitManager.init(scene, camera, p1_deck, ai_deck);
    CoopEnemyManager.init(scene, endGame);
    CoopAiManager.init();
    CoopUiManager.init();

    initCoopEventListeners();
    CoopUiManager.update();

    animate();
}