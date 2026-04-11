import heroData from '../data/heroes.json';
import enemyData from '../data/enemies.json';
import dungeonTemplates from '../data/dungeonTemplates.json';

export const createGameSlice = (set, get) => ({
    // Core state
    gamePhase: 'menu', // 'menu', 'dungeon', 'combat', 'loading'
    isLoading: false,

    // === INITIALIZATION ===
    startGame: async () => {
        set({ isLoading: true, gamePhase: 'loading' });
        try {
            // --- Game Initialization Logic ---
            const dungeonTemplate = dungeonTemplates[0];

            // Initialize slices
            get()._initializeCombat(heroData, enemyData);
            get()._initializeDungeon(dungeonTemplate);

            set({
                gamePhase: 'dungeon',
                isLoading: false,
            });

            // After setting up dungeon, check if start room has combat
            const currentStartRoom = get().dungeon.rooms.find(r => r.id === get().currentRoomId);
            if (currentStartRoom && currentStartRoom.hasCombat) {
                get().moveToRoom(currentStartRoom.id);
            }

        } catch (error) {
            console.error("Failed to load game data:", error);
            set({ isLoading: false, gamePhase: 'menu' }); // Revert to menu on error
        }
    },
});
