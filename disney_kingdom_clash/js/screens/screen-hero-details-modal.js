export const heroDetailsModalHTML = `
<div id="hero-details-modal" class="menu-overlay">
    <div class="modal-content">
        <button id="modal-close-button" class="close-button">&times;</button>
        <h2 id="modal-hero-name"></h2>

        <div class="modal-tabs">
            <button class="tab-button active" data-tab="stats">Stats</button>
            <button class="tab-button" data-tab="equipment">Equipment</button>
            <button class="tab-button" data-tab="levels">Levels</button>
            <button class="tab-button" data-tab="star-level">Star Level</button>
        </div>

        <div class="modal-tab-content">
            <div id="stats-tab" class="tab-pane active">
                <div class="stats-tab-layout">
                    <div class="stats-column stats-hero-visual">
                        <img id="stats-hero-preview" src="" alt="Hero Preview">
                        <div class="stats-hero-name" id="stats-hero-name-display"></div>
                        <div class="stats-hero-rarity" id="stats-hero-rarity-display"></div>
                    </div>
                    <div class="stats-column stats-hero-details">
                        <div class="stats-section">
                            <h4>Role</h4>
                            <div class="tags-container" id="stats-hero-tags">
                                <!-- Tags will be populated by JS -->
                            </div>
                        </div>
                        <div class="stats-section">
                            <h4>Lore</h4>
                            <p id="stats-hero-lore"></p>
                        </div>
                         <div class="stats-section">
                            <h4>Hero Ability</h4>
                            <p><strong><span id="stats-hero-ability-name"></span>:</strong> <span id="stats-hero-ability-desc"></span></p>
                        </div>
                    </div>
                </div>
            </div>
            <div id="equipment-tab" class="tab-pane">
                <h3>Equipment</h3>
                <div class="equipment-layout">
                    <div class="equipment-column">
                        <div class="equipment-slot" data-slot="weapon">
                            <span class="slot-name">Weapon</span>
                            <div class="slot-icon-placeholder"></div>
                        </div>
                        <div class="equipment-slot" data-slot="accessory1">
                            <span class="slot-name">Accessory 1</span>
                            <div class="slot-icon-placeholder"></div>
                        </div>
                    </div>
                    <div class="character-preview-container">
                        <img id="equipment-hero-preview" src="" alt="Hero Preview">
                    </div>
                    <div class="equipment-column">
                         <div class="equipment-slot" data-slot="outfit">
                            <span class="slot-name">Outfit</span>
                            <div class="slot-icon-placeholder"></div>
                        </div>
                        <div class="equipment-slot" data-slot="accessory2">
                            <span class="slot-name">Accessory 2</span>
                            <div class="slot-icon-placeholder"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="levels-tab" class="tab-pane">
                 <div class="level-display-container">
                    <div class="level-hero-preview">
                        <img id="level-details-img" src="" alt="Hero Level Preview">
                    </div>
                    <div class="level-hero-details">
                        <h3 id="level-details-level">Level 1</h3>
                        <p>Damage: <span id="level-details-damage"></span></p>
                        <p>Atk Speed: <span id="level-details-cooldown"></span>s</p>
                        <p>Ability: <span id="level-details-ability"></span></p>
                    </div>
                </div>
                <div class="level-selector">
                    <button id="level-selector-btn-1" class="level-selector-button active" data-level="1">
                        <img src="" alt="Level 1 Icon">
                        <span>LVL 1</span>
                    </button>
                    <button id="level-selector-btn-2" class="level-selector-button" data-level="2">
                        <img src="" alt="Level 2 Icon">
                        <span>LVL 2</span>
                    </button>
                    <button id="level-selector-btn-3" class="level-selector-button" data-level="3">
                        <img src="" alt="Level 3 Icon">
                        <span>LVL 3</span>
                    </button>
                    <button id="level-selector-btn-4" class="level-selector-button" data-level="4">
                        <img src="" alt="Level 4 Icon">
                        <span>LVL 4</span>
                    </button>
                    <button id="level-selector-btn-5" class="level-selector-button" data-level="5">
                        <img src="" alt="Level 5 Icon">
                        <span>LVL 5</span>
                    </button>
                </div>
            </div>
            <div id="star-level-tab" class="tab-pane">
                <div class="star-level-header">
                    <h3>Star Level</h3>
                    <div id="star-level-display" class="star-level-display">
                        <!-- Stars will be populated by JS -->
                    </div>
                </div>
                <div class="star-level-info">
                    <div class="star-level-bonus current">
                        <h4>Current Bonus (&#9733;<span id="star-level-current-num">1</span>)</h4>
                        <div id="star-level-current-bonus-container" class="bonus-description">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                    <div id="star-level-next-section" class="star-level-bonus next">
                        <h4>Next Bonus (&#9733;<span id="star-level-next-num">2</span>)</h4>
                        <div id="star-level-next-bonus-container" class="bonus-description">
                             <!-- Populated by JS -->
                        </div>
                    </div>
                </div>
                <div id="star-level-upgrade-section" class="star-level-upgrade-section">
                    <p class="upgrade-requirements-title">Upgrade Requirements</p>
                    <div class="upgrade-cost">
                        <img id="star-level-shard-icon" src="" alt="Hero Shard">
                        <span id="star-level-upgrade-cost">0 / 0</span>
                    </div>
                    <button id="star-level-upgrade-button" disabled>Upgrade</button>
                </div>
                 <div id="star-level-max-message" class="star-level-max-message" style="display: none;">
                    <p>This hero has reached the maximum star level!</p>
                </div>
            </div>
        </div>
        
        <button id="modal-confirm-button">Add to Deck</button>
    </div>
</div>
`;