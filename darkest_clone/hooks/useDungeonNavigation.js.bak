import { useGameStore } from '../state/GameState.jsx';

export function useDungeonNavigation() {
    const { dungeon, moveToRoom, currentRoomId } = useGameStore(state => ({
        dungeon: state.dungeon,
        moveToRoom: state.moveToRoom,
        currentRoomId: state.currentRoomId,
    }));

    const handleMoveTo = (roomId) => {
        // Prevent moving to the same room
        if (roomId === currentRoomId) return;
        moveToRoom(roomId);
    };

    const getConnections = (roomId) => {
        if (!dungeon || !dungeon.connections[roomId]) {
            return [];
        }
        return dungeon.connections[roomId];
    };

    return {
        handleMoveTo,
        getConnections
    };
}