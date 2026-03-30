export const createRoomModalHTML = `
<div id="create-room-modal" class="menu-overlay" style="z-index: 105;">
    <div class="modal-content">
        <h2>Create Co-op Room</h2>
        <div class="create-room-form">
            <label for="room-name-input">Room Name:</label>
            <input type="text" id="room-name-input" placeholder="My Awesome Room" maxlength="30">
        </div>
        <div class="modal-actions">
            <button id="confirm-create-room-button">Create</button>
            <button id="cancel-create-room-button" class="cancel-button">Cancel</button>
        </div>
    </div>
</div>
`;

