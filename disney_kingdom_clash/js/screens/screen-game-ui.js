import { UI_IMAGE_PATH, GLITCH_IMAGE_PATH } from '../constants.js';

export const gameUiHTML = `
<div id="game-ui">
    <div id="top-bar">
        <div id="game-stats">
            <div class="stat-item health-stat">
                <img src="${UI_IMAGE_PATH}/hp_icon.png" alt="Health Icon">
                <div class="stat-details">
                    <span class="stat-label">Health</span>
                    <div class="stat-bar">
                        <div id="hp-bar-fill" class="stat-bar-fill"></div>
                        <span id="hp-value" class="stat-value">10/10</span>
                    </div>
                </div>
            </div>
            <div class="stat-item mana-stat">
                <img src="${UI_IMAGE_PATH}/mana_icon.png" alt="Mana Icon">
                <div class="stat-details">
                    <span class="stat-label">Mana</span>
                    <span id="mana-value" class="stat-value">100</span>
                </div>
            </div>
            <div class="stat-item purified-stat">
                <img src="${GLITCH_IMAGE_PATH}/purified_sprite.png" alt="Purified Icon">
                <div class="stat-details">
                    <span class="stat-label">Stabilized</span>
                    <span id="purified-value" class="stat-value">0</span>
                </div>
            </div>
        </div>

        <div id="wave-info" class="hud-box-center">
            <span id="level-name-value">Enchanted Plains</span>
            <div class="wave-separator"></div>
            <img src="${UI_IMAGE_PATH}/crossed_swords_icon.png" alt="Wave Icon">
            <span id="wave-value">Wave 1/1</span>
        </div>

        <div id="game-controls" class="hud-box-right">
            <button id="game-settings-button"><img src="${UI_IMAGE_PATH}/gear_icon.png" alt="Settings"></button>
            <button id="game-speed-button"><span>1x</span></button>
        </div>
    </div>

    <div id="objective-banner"></div>

    <div id="bottom-bar">
        <div id="selection-info">
            <div id="unit-details" class="hidden">
                <img id="unit-info-img" src="" alt="Unit">
                <div id="unit-info-text">
                    <h3 id="unit-info-name"></h3>
                    <p>Damage: <span id="unit-info-damage"></span></p>
                    <p>Atk Speed: <span id="unit-info-cooldown"></span>s</p>
                    <p id="unit-info-ability-line">Ability: <span id="unit-info-ability"></span></p>
                </div>
            </div>
            <div id="selection-prompt">
                <p>Selected Cell: <span id="selected-cell-label">None</span></p>
            </div>
        </div>

        <div id="controls-bar">
            <div id="hero-abilities-container" class="hero-ability-container">
                <!-- Hero ability buttons will be dynamically added here -->
            </div>
            <button id="summon-button">
                <img src="${UI_IMAGE_PATH}/summon_icon.png" alt="Summon">
                <span>Summon (50)</span>
            </button>
            <button id="merge-button" disabled>
                <img src="${UI_IMAGE_PATH}/merge_icon.png" alt="Merge">
                <span>Merge</span>
            </button>
        </div>
    </div>
</div>
`;