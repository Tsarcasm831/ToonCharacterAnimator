import { HERO_IMAGE_PATH, UI_IMAGE_PATH } from '../constants.js';

export const treasureScreenHTML = `
<div id="treasure-screen" class="menu-overlay">
    <div class="treasure-modal-content">
        <div class="treasure-header">
            <h2 class="treasure-title">Treasures</h2>
            <div class="modal-tabs treasure-tabs">
                <button class="tab-button active" data-tab="chests">Chests</button>
                <button class="tab-button" data-tab="shop">Shop</button>
            </div>
        </div>

        <div class="modal-tab-content treasure-body">
            <div id="chests-tab" class="tab-pane active">
                <div class="chest-slots-container">
                    <!-- Chest slots will be populated by treasure.js -->
                </div>
                <div class="chest-info-panel">
                    <h3>Chest Queue</h3>
                    <p>Win battles in any mode to earn chests. Unlock them to find Gold, Hero Cards, and Crystals!</p>
                </div>
            </div>
            <div id="shop-tab" class="tab-pane">
                 <div class="shop-offers-container">
                    <div class="shop-section">
                        <h4>Featured</h4>
                        <div id="featured-deals-grid" class="daily-deals-grid">
                            <!-- Featured items populated by treasure.js -->
                        </div>
                    </div>
                    <div class="shop-section">
                        <h4>Daily Deals <span id="daily-deal-timer" class="daily-deal-timer"></span></h4>
                        <div id="daily-deals-grid" class="daily-deals-grid">
                            <!-- Daily items populated by treasure.js -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <button class="back-button" data-target="main-menu-screen">Back</button>
</div>
`;