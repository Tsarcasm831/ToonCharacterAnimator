export const glitchDetailsModalHTML = `
<div id="glitch-details-modal" class="menu-overlay">
    <div class="modal-content">
        <button id="glitch-modal-close-button" class="close-button">&times;</button>
        <h2 id="glitch-modal-title">Glitch Details</h2>

        <div class="glitch-comparison-container">
            <div id="glitch-state-corrupted" class="glitch-state-panel corrupted">
                <h3 id="glitch-modal-corrupted-name">Corrupted State</h3>
                <div class="glitch-modal-image-container">
                    <img id="glitch-modal-corrupted-img" class="glitch-modal-image" src="" alt="Corrupted Glitch">
                </div>
            </div>
            <div id="glitch-state-purified" class="glitch-state-panel purified">
                <h3 id="glitch-modal-purified-name">Purified State</h3>
                <div class="glitch-modal-image-container">
                    <img id="glitch-modal-purified-img" class="glitch-modal-image" src="" alt="Purified Glitch">
                </div>
            </div>
        </div>

        <p id="glitch-modal-description" class="glitch-modal-description">
            Description of the glitch will appear here.
        </p>
    </div>
</div>
`;

