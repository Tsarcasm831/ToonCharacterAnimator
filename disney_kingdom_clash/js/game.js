import * as THREE from 'three';
import { preloadAll } from './assets.js';
import * as GridManager from './managers/gridManager.js';
import * as UnitManager from './managers/unitManager.js';
import * as EnemyManager from './managers/enemyManager.js';
import * as HeroManager from './managers/heroManager.js';
import * as UI from './ui.js';
import * as ProjectileManager from './utils/projectile.js';
import * as HeroAbilityVfx from './utils/heroAbilityVfx.js';
import { initPlanning, getSelectedDeck, renderPlanningScreen } from './planning.js';
import * as GameState from './gameState.js';
import { initSettings } from './utils/settings.js';
import { setUserProperty, saveUser, getCurrentUser, addXP, addTrophies, loadUser } from './utils/user.js';
import { initDOM } from './ui/domManager.js';
import { initMainMenu, updateMainMenuUI } from './mainMenu.js';
import { initGlitchesScreen } from './glitches.js';
import { initTreasureScreen, updateTreasureScreen } from './treasure.js';
import * as MusicPlayer from './utils/musicPlayer.js';
import { initEventListeners } from './ui/eventManager.js';
import { HERO_IMAGE_PATH } from './constants.js';
import { GLITCH_DATA } from './data/glitchData.js';
import { initRealmSelect } from './realmSelect.js';
import * as sceneManager from './managers/sceneManager.js';
import { initLobbyScreen } from './lobby.js';
import { initStarterHeroModal } from './ui/starterHeroModal.js';

let scene, camera, renderer, controls;
const clock = new THREE.Clock();
let currentStageData = null;
let gameLoopId = null;

async function hookupWebsimMetadata() {
    try {
        const project = await window.websim.getCurrentProject();
        if (project && project.title) {
            document.title = project.title;
        }

        const creator = await window.websim.getCreator();
        if (creator && creator.username) {
            const menuScreen = document.getElementById('menu-screen');
            if (menuScreen) {
                let creatorEl = document.getElementById('creator-info');
                if (!creatorEl) {
                    creatorEl = document.createElement('div');
                    creatorEl.id = 'creator-info';
                    creatorEl.style.position = 'absolute';
                    creatorEl.style.bottom = '20px';
                    creatorEl.style.left = '20px';
                    creatorEl.style.transform = 'none';
                    creatorEl.style.background = 'rgba(0,0,0,0.4)';
                    creatorEl.style.padding = '8px 15px';
                    creatorEl.style.borderRadius = '20px';
                    creatorEl.style.display = 'flex';
                    creatorEl.style.alignItems = 'center';
                    creatorEl.style.gap = '10px';
                    menuScreen.appendChild(creatorEl);
                }

                const avatarUrl = creator.avatar_url ? `https://images.websim.com/avatar/${creator.username}` : '';
                const profileUrl = `https://websim.com/@${creator.username}/profile`;

                creatorEl.innerHTML = `
                    <a href="${profileUrl}" target="_blank" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #fff;">
                        ${avatarUrl ? `<img src="${avatarUrl}" style="width: 30px; height: 30px; border-radius: 50%;">` : ''}
                        <span style="font-size: 1.1em; text-shadow: 1px 1px 2px #000;">Created by @${creator.username}</span>
                    </a>
                `;
            }
        }
        
        // Get the current WebSim user and update the player profile
        const websimUser = await window.websim.getUser();
        if (websimUser && websimUser.username) {
            setUserProperty('name', websimUser.username);
            const avatarUrl = websimUser.avatar_url ? `https://images.websim.com/avatar/${websimUser.username}` : `${HERO_IMAGE_PATH}/elsa_hero_icon.png`;
            setUserProperty('avatar', avatarUrl);
            
            // Now that the local user data is updated, refresh the main menu UI
            updateMainMenuUI();
        }

    } catch(e) {
        console.error("Could not hook up websim metadata", e);
    }
}

function main() {
    // Inject all HTML screens into the document body
    initDOM();

    // Load user data first to ensure it's available for all other modules.
    loadUser();

    // Cache music on load
    MusicPlayer.cacheMusicOnLoad();
    MusicPlayer.cacheModelsOnLoad();

    // Initialize systems
    MusicPlayer.initMusicPlayer();
    initSettings();
    initMainMenu();
    initGlitchesScreen();
    initTreasureScreen();
    initRealmSelect(() => UI.showScreen('planning-screen', 'realm-select-screen'));
    initLobbyScreen();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'lobby') {
        UI.showScreen('main-menu-screen');
        updateMainMenuUI();
    } else {
        UI.showScreen('menu-screen');
    }

    hookupWebsimMetadata();
    initEventListeners();
    initPlanning();

    if (getCurrentUser().needsStarterHero) {
        initStarterHeroModal(() => {
            updateMainMenuUI();
            renderPlanningScreen();
        });
    }
}

export function togglePauseMenu() {
    const isPaused = GameState.togglePause();
    const modal = document.getElementById('in-game-settings-modal');
    if(isPaused) {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

export async function startGame(stageData, realmData) {
    currentStageData = { ...realmData, ...stageData }; // Combine stage and realm data
    delete currentStageData.stages; // Avoid confusion

    document.getElementById('planning-screen').style.display = 'none';
    document.getElementById('main-menu-screen').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'flex';
    await initGameScene();
}

async function initGameScene() {
    await preloadAll();
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-canvas').style.display = 'block';
    document.getElementById('game-ui').style.display = 'block';

    const sceneObjects = sceneManager.initScene(currentStageData);
    scene = sceneObjects.scene;
    camera = sceneObjects.camera;
    renderer = sceneObjects.renderer;
    controls = sceneObjects.controls;
    
    GameState.init();
    GridManager.setupGrid(scene, camera, handleCellClick);
    ProjectileManager.init();
    HeroAbilityVfx.init(scene);
    UnitManager.init(scene, camera);
    UnitManager.setDeck(getSelectedDeck());
    EnemyManager.init(scene, endGame, camera, currentStageData);
    HeroManager.init(getSelectedDeck()); 
    UI.init(currentStageData);
    
    animate();
}

function cleanupGameScene() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    // Cleanup managers to remove listeners and DOM elements
    EnemyManager.destroy();
    UnitManager.destroy();
    GridManager.destroyGrid();
    ProjectileManager.init(); // Resets projectiles
    HeroAbilityVfx.init(null);

    if (renderer) {
        renderer.dispose(); // clean up webgl resources
    }
    
    // The scene and its contents will be garbage collected since a new one is created.
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    currentStageData = null;
}

function endGame(isVictory) {
    if (GameState.isGameEnded()) return; // Prevent multiple calls
    GameState.setGameEnded(true);

    // Stop the main game loop updates immediately
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    // Start a cleanup/fadeout loop
    cleanupLoop();

    console.log(`Game Over. Victory: ${isVictory}`);

    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');
    const button = document.getElementById('game-over-close-button');

    modal.style.display = 'flex';

    const statsContainer = document.getElementById('victory-stats-container');
    if (statsContainer) statsContainer.innerHTML = ''; // Clear previous stats

    if (isVictory) {
        // Add XP
        if (currentStageData && currentStageData.xpReward) {
            addXP(currentStageData.xpReward);
        }

        // Award Trophies
        if (currentStageData && currentStageData.trophyReward) {
            addTrophies(currentStageData.id);
        }

        // Add a chest if there's an empty slot
        const user = getCurrentUser();
        const emptySlotIndex = user.chests.findIndex(c => c === null);
        if (emptySlotIndex !== -1) {
            // TODO: decide which chest to award based on level
            const chestTypes = ['magical', 'gold'];
            const awardedChestType = chestTypes[Math.floor(Math.random() * chestTypes.length)];
            user.chests[emptySlotIndex] = { type: awardedChestType, state: 'locked' };
        }

        // Set reward flag in user data
        setUserProperty('pendingReward', true);
        saveUser();
        title.textContent = 'Victory!';
        title.className = 'victory';
        message.textContent = 'You have stabilized the realm! You can now collect a reward from the main menu.';
        button.className = 'victory';

        // Display purification stats
        if (statsContainer) {
            statsContainer.style.display = 'block';
            const purifiedCounts = GameState.getPurifiedEnemyCounts();
            
            const statsTitle = document.createElement('h3');
            statsTitle.textContent = 'Disruptions Stabilized';
            statsContainer.appendChild(statsTitle);

            const statsGrid = document.createElement('div');
            statsGrid.className = 'victory-stats-grid';
            statsContainer.appendChild(statsGrid);

            const hasStats = Object.keys(purifiedCounts).length > 0;

            if (hasStats) {
                for (const glitchId in purifiedCounts) {
                    const count = purifiedCounts[glitchId];
                    const glitchData = GLITCH_DATA[glitchId];
                    if (glitchData) {
                        const statItem = document.createElement('div');
                        statItem.className = 'victory-stat-item';
                        statItem.innerHTML = `
                            <img src="${glitchData.image}" alt="${glitchData.name}">
                            <span>${glitchData.name} x${count}</span>
                        `;
                        statsGrid.appendChild(statItem);
                    }
                }
            } else {
                 statsGrid.innerHTML = `<p>No disruptions were stabilized.</p>`;
            }
            statsContainer.appendChild(statsGrid);
        }
    } else {
        title.textContent = 'Defeat';
        title.className = 'defeat';
        message.textContent = 'Stabilization failed! The Disruptions have overwritten the realm.';
        button.className = 'defeat';
        if (statsContainer) statsContainer.style.display = 'none';
    }
}

export function returnToMenu(force = false) {
    if (force && gameLoopId) {
        // cleanupGameScene will cancel the animation frame
    }
    
    cleanupGameScene();
    GameState.setGameEnded(false);
    
    // Hide game, show main menu
    document.getElementById('game-canvas').style.display = 'none';
    document.getElementById('game-ui').style.display = 'none';
    document.getElementById('coop-ui').style.display = 'none';
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('in-game-settings-modal').style.display = 'none';
    UI.showScreen('main-menu-screen');
    updateMainMenuUI();
}

function handleCellClick(i, j) {
    UnitManager.setSelectedCell(i, j);
    UI.updateSelectionInfo(i, j);
    if (i === null && j === null) {
        GridManager.updateSelectionIndicator(null, null);
    }
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

function animate() {
    gameLoopId = requestAnimationFrame(animate);
    
    if (GameState.isGamePaused()) return;

    const delta = clock.getDelta() * GameState.getGameSpeed();
    
    if (controls) controls.update();
    
    // Game is stopped by cancelling the frame in endGame
    GridManager.update(delta);
    ProjectileManager.update(delta);
    HeroAbilityVfx.update(delta);
    UnitManager.update(delta);
    EnemyManager.update(delta);
    HeroManager.updateAbilityButtonsState();
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// A separate loop for post-game animations (like enemy fade-outs)
function cleanupLoop() {
    if (scene) { // Check if scene still exists
        const delta = clock.getDelta();
        EnemyManager.update(delta); // Let EnemyManager handle fade-outs
        ProjectileManager.update(delta);
        HeroAbilityVfx.update(delta);
        if(renderer && camera) renderer.render(scene, camera);
        requestAnimationFrame(cleanupLoop);
    }
}
main();