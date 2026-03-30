export const lobbyScreenHTML = `
<div id="lobby-screen" class="menu-overlay">
    <div class="lobby-content">
        <div class="lobby-disclaimer">
            <strong>Under Development</strong>
            <p>This feature is not yet functional.</p>
        </div>
        <h1>Co-op Lobby</h1>
        <div class="room-list">
            <!-- Example Room -->
            <div class="room-item">
                <span class="room-name">Mickey's Fun House</span>
                <span class="room-players">1/2</span>
                <button class="join-button">Join</button>
            </div>
             <div class="room-item">
                <span class="room-name">Goofy's Game Room</span>
                <span class="room-players">1/2</span>
                <button class="join-button">Join</button>
            </div>
             <div class="room-item">
                <span class="room-name">Realm of Story</span>
                <span class="room-players">2/2</span>
                <button class="join-button" disabled>Full</button>
            </div>
        </div>
        <div class="lobby-actions">
            <button class="create-room-button">Create Room</button>
            <button class="refresh-button">Refresh</button>
        </div>
    </div>
    <button class="back-button-lobby back-button" data-target="main-menu-screen">Back to Menu</button>
</div>
`;