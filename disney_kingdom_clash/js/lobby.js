import * as UI from './ui.js';
import { initCoopMode } from './coop.js';

let createdRoomName = null;

function showCreateRoomModal() {
    document.getElementById('create-room-modal').style.display = 'flex';
}

function hideCreateRoomModal() {
    document.getElementById('create-room-modal').style.display = 'none';
}

function showInviteTypeModal(roomName) {
    const modal = document.getElementById('invite-type-modal');
    modal.style.display = 'flex';
    document.getElementById('invite-type-room-name').textContent = `Room "${roomName}" Created!`;
}

function hideInviteTypeModal() {
    document.getElementById('invite-type-modal').style.display = 'none';
}

function showWaitingRoomModal(roomName) {
    const modal = document.getElementById('waiting-room-modal');
    modal.style.display = 'flex';
    document.getElementById('waiting-room-title').textContent = `Room: ${roomName}`;
}

function hideWaitingRoomModal() {
    document.getElementById('waiting-room-modal').style.display = 'none';
}

export function initLobbyScreen() {
    const roomList = document.querySelector('.room-list');
    const createRoomButton = document.querySelector('.create-room-button');
    const refreshButton = document.querySelector('.refresh-button');
    const backButton = document.querySelector('.back-button-lobby');

    // Create Room Modal controls
    const confirmCreateButton = document.getElementById('confirm-create-room-button');
    const cancelCreateButton = document.getElementById('cancel-create-room-button');
    const roomNameInput = document.getElementById('room-name-input');

    // Invite Type Modal controls
    const playWithAIButton = document.getElementById('play-with-ai-button');
    const waitForPlayerButton = document.getElementById('wait-for-player-button');
    const cancelInviteTypeButton = document.getElementById('cancel-invite-type-button');

    // Waiting Room Modal controls
    const startWithAIButton = document.getElementById('start-with-ai-button');
    const cancelWaitingButton = document.getElementById('cancel-waiting-button');

    if (!roomList || !createRoomButton || !refreshButton || !backButton) {
        console.warn("Lobby screen elements not found, aborting init.");
        return;
    }

    function renderRooms(rooms) {
        roomList.innerHTML = ''; // Clear existing rooms
        if (!rooms || rooms.length === 0) {
            roomList.innerHTML = '<p style="text-align: center; color: #ccc; padding: 20px 0;">No rooms available. Create one!</p>';
            return;
        }
        rooms.forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            const isFull = room.players.length >= room.maxPlayers;
            roomItem.innerHTML = `
                <span class="room-name">${room.name}</span>
                <span class="room-players">${room.players.length}/${room.maxPlayers}</span>
                <button class="join-button" data-room-id="${room.id}" ${isFull ? 'disabled' : ''}>${isFull ? 'Full' : 'Join'}</button>
            `;
            roomList.appendChild(roomItem);
        });
    }
    
    async function fetchAndRenderRooms() {
        // This is a placeholder for the actual API call.
        // Since the multiplayer API is not defined, we'll use mock data.
        console.log("Fetching and rendering rooms (mock)...");
        const mockRooms = [
            { id: 'room1', name: "Mickey's Fun House", players: [{id: 'p1'}], maxPlayers: 2 },
            { id: 'room2', name: "Goofy's Game Room", players: [{id: 'p1'}], maxPlayers: 2 },
            { id: 'room3', name: "Realm of Story", players: [{id: 'p1'}, {id: 'p2'}], maxPlayers: 2 },
            { id: 'room4', name: "Donald's Duck Pond", players: [], maxPlayers: 2 },
        ];
        renderRooms(mockRooms);
    }

    createRoomButton.addEventListener('click', () => {
        showCreateRoomModal();
    });

    confirmCreateButton.addEventListener('click', () => {
        createdRoomName = roomNameInput.value.trim();
        if (createdRoomName) {
            console.log(`Creating room: ${createdRoomName}`);
            // Placeholder for websim.multiplayer.createRoom(roomName);
            // On success, show the next step.
            hideCreateRoomModal();
            showInviteTypeModal(createdRoomName);
        } else {
            alert("Please enter a room name.");
        }
    });
    
    cancelCreateButton.addEventListener('click', hideCreateRoomModal);

    playWithAIButton.addEventListener('click', async () => {
        console.log(`Starting co-op mode with AI for room: ${createdRoomName}`);
        hideInviteTypeModal();
        await initCoopMode();
    });

    waitForPlayerButton.addEventListener('click', () => {
        console.log(`Waiting for player in room: ${createdRoomName}`);
        hideInviteTypeModal();
        showWaitingRoomModal(createdRoomName);
        // Here, we would listen for a 'playerJoined' event from the multiplayer service.
    });

    cancelInviteTypeButton.addEventListener('click', hideInviteTypeModal);
    
    startWithAIButton.addEventListener('click', async () => {
        console.log(`Decided to start with AI from waiting room: ${createdRoomName}`);
        hideWaitingRoomModal();
        await initCoopMode();
    });
    
    cancelWaitingButton.addEventListener('click', () => {
        console.log(`Cancelled waiting for room: ${createdRoomName}`);
        hideWaitingRoomModal();
        // Here we should also notify the service that the room is closed.
        fetchAndRenderRooms(); // Refresh room list
    });

    refreshButton.addEventListener('click', fetchAndRenderRooms);

    roomList.addEventListener('click', async (event) => {
        if (event.target.classList.contains('join-button') && !event.target.disabled) {
            const roomId = event.target.dataset.roomId;
            console.log(`Joining room: ${roomId}`);
            // Placeholder for websim.multiplayer.joinRoom(roomId);
            // On success, transition to the co-op game.
            await initCoopMode();
        }
    });
    
    backButton.addEventListener('click', () => {
        UI.showScreen('main-menu-screen', 'lobby-screen');
    });

    // Initial load when the screen is shown
    fetchAndRenderRooms();
}