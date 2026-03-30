export const cardsScreenHTML = `
<div id="cards-screen" class="menu-overlay">
    <div class="menu-overlay-content">
        <div class="cards-screen-content">
            <div class="current-deck-section">
                <div class="section-banner deck-banner"></div>
                <div id="cards-deck-display">
                    <!-- Populated by cards.js -->
                </div>
            </div>
            <div class="hero-collection-section">
                <div class="section-banner collection-banner"></div>
                <div id="hero-collection-grid" class="hero-collection-grid">
                    <!-- Populated by cards.js -->
                </div>
            </div>
        </div>
        <button class="back-button" data-target="main-menu-screen">Back</button>
    </div>
</div>
`;

