import { HERO_IMAGE_PATH, UI_IMAGE_PATH } from '../constants.js';

export const mainMenuScreenHTML = `
<div id="main-menu-screen" style="display: none;">
    
    <div class="main-menu-top-bar">
        <div class="profile-area">
            <img src="${HERO_IMAGE_PATH}/elsa_hero_icon.png" alt="Player Avatar" class="profile-avatar" id="main-menu-avatar">
            <div class="profile-info">
                <span class="player-name" id="main-menu-player-name">Player123</span>
                <div class="player-level">
                    <span id="main-menu-player-level">LVL 5</span>
                    <div class="level-progress-bar"><div class="level-progress" id="main-menu-level-progress"></div></div>
                </div>
            </div>
        </div>
        <div class="top-right-cluster">
            <div class="currency-display">
                <div class="currency-item">
                    <img src="${UI_IMAGE_PATH}/magic_crystal.png" alt="Crystals">
                    <span id="main-menu-crystals">1,250</span>
                </div>
                <div class="currency-item">
                    <img src="${UI_IMAGE_PATH}/gold_coin.png" alt="Gold">
                    <span id="main-menu-gold">8,940</span>
                </div>
                <button class="shop-button"><img src="${UI_IMAGE_PATH}/shop_plus_icon.png" alt="Shop"></button>
            </div>
            <button class="settings-button-small" id="settings-button-main-menu">
                <img src="${UI_IMAGE_PATH}/gear_icon.png" alt="Settings">
            </button>
            <div class="reward-banner">
                <img src="${UI_IMAGE_PATH}/reward_scroll.png" alt="Reward Scroll" class="reward-scroll-img">
                <span class="reward-text">Collect Reward</span>
            </div>
        </div>
    </div>

    <div class="main-content-area">
        <div class="arena-progress">
            <img src="${UI_IMAGE_PATH}/arena_badge.png" alt="Arena Badge" class="arena-badge-img">
            <div class="arena-info">
                <h3>Arena: Enchanted Plains</h3>
                <div class="arena-progress-bar">
                    <div class="arena-progress-fill"></div>
                    <div class="arena-trophy-count">
                        <img src="${UI_IMAGE_PATH}/trophy_icon.png" alt="Trophy">
                        <span>0 / 100</span>
                    </div>
                </div>
            </div>
        </div>
    
        <div class="battle-hub">
            <div class="deck-display">
                <!-- Populated by JS -->
            </div>
            
            <div class="deck-tabs">
                <button class="deck-tab-button" id="deck-tab-1" data-deck="1">Deck 1</button>
                <button class="deck-tab-button" id="deck-tab-2" data-deck="2">Deck 2</button>
                <button class="deck-tab-button" id="deck-tab-3" data-deck="3">Deck 3</button>
            </div>
        
            <div class="battle-buttons">
                <button class="battle-button story-button" id="story-mode-button">
                    <img src="${UI_IMAGE_PATH}/story_mode_icon.png" alt="Story Mode">
                    <span>Story</span>
                </button>
                <button class="battle-button coop-button" id="coop-mode-button">
                    <img src="${UI_IMAGE_PATH}/handshake_icon.png" alt="Co-op Mode">
                    <span>Co-op</span>
                </button>
            </div>
        </div>
    </div>

    <div class="main-menu-bottom-nav">
        <button class="nav-button" id="treasure-nav-button">
            <img src="${UI_IMAGE_PATH}/chest_icon.png" alt="Treasure">
            <span>Treasure</span>
        </button>
        <button class="nav-button" id="cards-nav-button">
            <img src="${UI_IMAGE_PATH}/deck_icon.png" alt="Cards">
            <span>Cards</span>
        </button>
        <button class="nav-button" id="battle-nav-button" disabled>
            <img src="${UI_IMAGE_PATH}/crossed_swords_icon.png" alt="Battle">
            <span>Battle</span>
            <span class="coming-soon-tag">SOON</span>
        </button>
        <button class="nav-button" disabled>
            <img src="${UI_IMAGE_PATH}/trophy_icon.png" alt="Arena">
            <span>Arena</span>
            <span class="coming-soon-tag">SOON</span>
        </button>
        <button class="nav-button" id="glitches-nav-button">
            <img src="${UI_IMAGE_PATH}/glitch_nav_icon.png" alt="Glitches">
            <span>Glitches</span>
        </button>
        
    </div>

</div>
`;