import * as UI from '../ui.js';
import * as GameState from '../gameState.js';
import { getSelectedDeck } from '../planning.js';
import { initCardsScreen } from '../cards.js';
import { initGlitchesScreen } from '../glitches.js';
import { initLobbyScreen } from '../lobby.js';
import { initMainMenu, updateMainMenuUI } from '../mainMenu.js';
import { renderRealmSelectScreen } from '../realmSelect.js';
import { initTreasureScreen, updateTreasureScreen } from '../treasure.js';
import * as MusicPlayer from '../utils/musicPlayer.js';
import { startGame, togglePauseMenu, returnToMenu } from '../game.js';
import { LEVEL_DATA } from '../data/levelData.js';
import { initChangelog } from '../changelog.js';

export function initEventListeners() {
    // Initial Menu screen buttons
    document.getElementById('play-button').addEventListener('click', () => {
        UI.showScreen('main-menu-screen', 'menu-screen');
        updateMainMenuUI();
        MusicPlayer.startMusic();
    });
    document.getElementById('options-button').addEventListener('click', () => UI.showScreen('options-screen', 'menu-screen'));
    document.getElementById('instructions-button').addEventListener('click', () => UI.showScreen('instructions-screen', 'menu-screen'));

    // Main menu navigation
    document.getElementById('story-mode-button').addEventListener('click', () => {
        renderRealmSelectScreen();
        UI.showScreen('realm-select-screen', 'main-menu-screen');
    });
    document.getElementById('coop-mode-button').addEventListener('click', () => { 
        UI.showScreen('lobby-screen', 'main-menu-screen');
        initLobbyScreen();
    });
    document.getElementById('treasure-nav-button').addEventListener('click', () => {
        UI.showScreen('treasure-screen', 'main-menu-screen');
        updateTreasureScreen();
    });
    document.getElementById('cards-nav-button').addEventListener('click', () => {
        UI.showScreen('cards-screen', 'main-menu-screen');
        initCardsScreen();
    });
    document.getElementById('settings-button-main-menu').addEventListener('click', () => UI.showScreen('options-screen', 'main-menu-screen'));
    document.getElementById('glitches-nav-button').addEventListener('click', () => {
        UI.showScreen('glitches-screen', 'main-menu-screen');
        initGlitchesScreen();
    });
    
    // Init changelog button
    initChangelog();

    // Generic Back buttons
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const fromScreen = e.target.closest('.menu-overlay');
            const toScreen = e.target.dataset.target;
            if (fromScreen) {
                UI.showScreen(toScreen, fromScreen.id);
            } else {
                 UI.showScreen(toScreen);
            }
            if (toScreen === 'main-menu-screen') {
                updateMainMenuUI();
            }
        });
    });

    // Game Over button
    document.getElementById('game-over-close-button').addEventListener('click', () => returnToMenu(true));

    // Treasure screen tabs
    document.getElementById('treasure-screen').addEventListener('click', (e) => {
        if (e.target.matches('.tab-button')) {
            const screen = e.target.closest('.menu-overlay');
            if (!screen) return;

            const tabId = e.target.dataset.tab;
            
            screen.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            screen.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

            e.target.classList.add('active');
            screen.querySelector(`#${tabId}-tab`).classList.add('active');
        }
    });

    // Planning screen button
    document.getElementById('start-battle-button').addEventListener('click', () => {
        const deck = getSelectedDeck();
        if (deck.length > 0) {
             const stageData = GameState.getSelectedLevel();
             const realmData = GameState.getSelectedRealm();
             startGame(stageData, realmData);
        }
    });
    
    // In-game controls
    const gameSpeedButton = document.getElementById('game-speed-button');
    if (gameSpeedButton) {
        const gameSpeedSpan = gameSpeedButton.querySelector('span');
        gameSpeedButton.addEventListener('click', () => {
            let currentSpeed = GameState.getGameSpeed();
            let newSpeed;
            if (currentSpeed === 1.0) {
                newSpeed = 2.0;
            } else {
                newSpeed = 1.0;
            }
            GameState.setGameSpeed(newSpeed);
            if (gameSpeedSpan) {
                gameSpeedSpan.textContent = `${newSpeed}x`;
            }
        });
    }

    const gameSettingsButton = document.getElementById('game-settings-button');
    if (gameSettingsButton) {
        gameSettingsButton.addEventListener('click', togglePauseMenu);
    }
    
    document.getElementById('resume-game-button').addEventListener('click', togglePauseMenu);
    document.getElementById('quit-game-button').addEventListener('click', () => {
        if (GameState.isGamePaused()) {
            GameState.togglePause(); // Unpause before quitting
        }
        returnToMenu(true); // force quit
    });

    // Reward Modal close button
    document.getElementById('reward-modal-close-button').addEventListener('click', () => {
        document.getElementById('reward-modal').style.display = 'none';
    });
}