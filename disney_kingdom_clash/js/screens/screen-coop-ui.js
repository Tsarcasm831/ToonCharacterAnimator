import { UI_IMAGE_PATH, GLITCH_IMAGE_PATH } from '../constants.js';

export const coopUiHTML = `
<div id="coop-ui">
    <div id="top-bar-coop">
        <!-- Player 1 Stats -->
        <div id="player1-stats" class="player-stats">
            <div class="stat-item mana-stat">
                <img src="${UI_IMAGE_PATH}/mana_icon.png" alt="Mana Icon">
                <div class="stat-details">
                    <span class="stat-label">P1 Mana</span>
                    <span id="p1-mana-value" class="stat-value">100</span>
                </div>
            </div>
        </div>

        <!-- Center Info -->
        <div id="center-info-coop">
            <div class="stat-item health-stat">
                <img src="${UI_IMAGE_PATH}/hp_icon.png" alt="Health Icon">
                <div class="stat-details">
                    <span class="stat-label">Team Health</span>
                    <div class="stat-bar">
                        <div id="coop-hp-bar-fill" class="stat-bar-fill"></div>
                        <span id="coop-hp-value" class="stat-value">10/10</span>
                    </div>
                </div>
            </div>
            <div id="wave-info-coop" class="hud-box-center">
                <span id="level-name-value-coop">Co-op Battle</span>
                <div class="wave-separator"></div>
                <img src="${UI_IMAGE_PATH}/crossed_swords_icon.png" alt="Wave Icon">
                <span id="wave-value-coop">Wave 1/1</span>
            </div>
        </div>

        <!-- Player 2 Stats Placeholder for layout -->
        <div class="player-stats player-stats-right" style="visibility: hidden;">
            <div class="stat-item mana-stat">
                <img src="${UI_IMAGE_PATH}/mana_icon.png" alt="Mana Icon">
                <div class="stat-details">
                    <span class="stat-label">P2 Mana</span>
                    <span class="stat-value">100</span>
                </div>
            </div>
        </div>

        <!-- Player 2 Stats Placeholder for layout -->
        <div id="coop-controls">
             <button id="coop-settings-button"><img src="${UI_IMAGE_PATH}/gear_icon.png" alt="Settings"></button>
        </div>
    </div>

    <div id="bottom-bar-coop">
        <!-- Player 1 Controls -->
        <div id="player1-controls" class="player-controls">
            <div class="controls-bar">
                <button id="p1-summon-button" class="coop-summon-button">
                    <img src="${UI_IMAGE_PATH}/summon_icon.png" alt="Summon">
                    <span>Summon (50)</span>
                </button>
                <button id="p1-merge-button" class="coop-merge-button" disabled>
                    <img src="${UI_IMAGE_PATH}/merge_icon.png" alt="Merge">
                    <span>Merge</span>
                </button>
            </div>
        </div>
    </div>
</div>
`;