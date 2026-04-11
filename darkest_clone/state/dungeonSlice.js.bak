import { v4 as uuidv4 } from 'uuid';

export const createDungeonSlice = (set, get) => ({
    // Dungeon state
    dungeon: null, // { rooms: [], connections: {} }
    currentRoomId: null,
    lightLevel: 100,
    isTransitioning: false,

    // === ACTIONS ===
    _initializeDungeon: (dungeonTemplate) => {
        const newDungeon = {
            ...dungeonTemplate,
            rooms: dungeonTemplate.rooms.map(room => ({...room, isVisited: false, isScouted: false, curioInteracted: false})),
        };
        const startRoom = newDungeon.rooms.find(r => r.isStart);
        if (startRoom) {
            startRoom.isVisited = true;
        }
        
        set({
            dungeon: newDungeon,
            currentRoomId: startRoom ? startRoom.id : null,
            lightLevel: 100,
        });
    },

    interactWithCurio: (roomId) => {
        const { dungeon } = get();
        const room = dungeon.rooms.find(r => r.id === roomId);

        if (!room || !room.hasCurio || room.curioInteracted) {
            return;
        }

        // Mark as interacted
        const newRooms = dungeon.rooms.map(r => 
            r.id === roomId ? { ...r, curioInteracted: true } : r
        );

        // Simple loot effect for now
        get()._addLog("You open the chest and find some supplies! The torch burns brighter.");
        const newLightLevel = Math.min(100, get().lightLevel + 25);

        set({
            dungeon: { ...dungeon, rooms: newRooms },
            lightLevel: newLightLevel,
        });
    },
    
    moveToRoom: (nextRoomId) => {
        const { dungeon, lightLevel, isTransitioning } = get();
        if (isTransitioning) return;
        
        const nextRoom = dungeon.rooms.find(r => r.id === nextRoomId);

        if (!nextRoom) return;

        set({ isTransitioning: true });

        setTimeout(() => {
            // Update room states
            const newRooms = dungeon.rooms.map(room => {
                if (room.id === nextRoomId) {
                    return { ...room, isVisited: true };
                }
                return room;
            });

            // Update light level
            const newLightLevel = Math.max(0, lightLevel + (nextRoom.lightModifier || 0));

            set({
                dungeon: { ...dungeon, rooms: newRooms },
                currentRoomId: nextRoomId,
                lightLevel: newLightLevel
            });

            // Trigger room events
            if (nextRoom.hasCombat) {
                 get()._startCombat();
            }

            // End transition
            setTimeout(() => {
                set({ isTransitioning: false });
            }, 300); // This should match the exit animation duration of the overlay

        }, 300); // This should match the enter animation duration of the overlay
    },
});