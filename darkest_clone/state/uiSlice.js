export const createUiSlice = (set, get) => ({
    // Modal state
    characterModalId: null,
    // Combat UI state
    selectedSkill: null,
    isMoving: false, 
    attackAnimation: null,

    // === ACTIONS ===
    setSelectedSkill: (skill) => {
        set({ selectedSkill: skill, isMoving: false });
    },

    setCharacterModalId: (id) => {
        set({ characterModalId: id });
    },

    setMoving: (moving) => {
        set({ isMoving: moving, selectedSkill: null });
    },
    
    setAttackAnimation: (animation) => {
        set({ attackAnimation: animation });
    },
});

