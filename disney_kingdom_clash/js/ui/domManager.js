import { 
    mainMenuScreenHTML,
    menuScreenHTML,
    optionsScreenHTML,
    instructionsScreenHTML,
    planningScreenHTML,
    heroDetailsModalHTML,
    treasureScreenHTML,
    loadingScreenHTML,
    gameUiHTML,
    gameCanvasHTML,
    cardsScreenHTML,
    glitchesScreenHTML,
    gameOverModalHTML,
    glitchDetailsModalHTML,
    rewardModalHTML,
    realmSelectScreenHTML,
    lobbyScreenHTML,
    inGameSettingsModalHTML,
    changelogModalHTML,
    createRoomModalHTML,
    inviteTypeModalHTML,
    waitingRoomModalHTML,
    coopUiHTML,
    starterHeroModalHTML
} from '../screens/screens.js';

export function initDOM() {
    document.getElementById('app-container').innerHTML = `
        <div id="canvas-container"></div>
        ${mainMenuScreenHTML}
        ${menuScreenHTML}
        ${optionsScreenHTML}
        ${instructionsScreenHTML}
        ${planningScreenHTML}
        ${heroDetailsModalHTML}
        ${treasureScreenHTML}
        ${loadingScreenHTML}
        ${cardsScreenHTML}
        ${glitchesScreenHTML}
        ${gameOverModalHTML}
        ${glitchDetailsModalHTML}
        ${realmSelectScreenHTML}
        ${lobbyScreenHTML}
        ${inGameSettingsModalHTML}
        ${createRoomModalHTML}
        ${inviteTypeModalHTML}
        ${waitingRoomModalHTML}
        ${gameUiHTML}
        ${coopUiHTML}
        ${starterHeroModalHTML}
        ${gameCanvasHTML}
        ${rewardModalHTML}
        ${changelogModalHTML}
    `;
}