export const planningScreenHTML = `
<div id="planning-screen" class="menu-overlay">
    <h2>Prepare For Battle</h2>
    <div id="planning-content">
        <div id="deck-container" class="planning-section">
            <h3>Your Deck (<span id="deck-count">0</span>/5)</h3>
            <div id="deck-heroes-list" class="hero-list deck-list">
                 <!-- Populated by planning.js -->
            </div>
        </div>
        <div id="collection-container" class="planning-section">
            <h3>Available Heroes</h3>
            <div id="available-heroes-list" class="hero-list collection-list">
                <!-- Populated by planning.js -->
            </div>
        </div>
    </div>
    <div class="planning-buttons">
        <button class="back-button" data-target="realm-select-screen">Back</button>
        <button id="start-battle-button" disabled>Start Battle</button>
    </div>
</div>
`;