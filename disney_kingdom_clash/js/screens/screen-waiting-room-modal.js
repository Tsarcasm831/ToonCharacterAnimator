export const waitingRoomModalHTML = `
<div id="waiting-room-modal" class="menu-overlay" style="z-index: 106;">
    <div class="modal-content">
        <h2 id="waiting-room-title">Waiting...</h2>
        <div class="waiting-room-content">
            <div class="spinner"></div>
            <p>Waiting for another player to join.</p>
            <p class="room-code-info">Share this room or wait for a public join.</p>
        </div>
        <div class="modal-actions">
             <button id="start-with-ai-button" class="start-ai-button">Start with AI</button>
             <button id="cancel-waiting-button" class="cancel-button">Cancel</button>
        </div>
    </div>
</div>
`;

