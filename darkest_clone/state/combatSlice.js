import { v4 as uuidv4 } from 'uuid';

export const createCombatSlice = (set, get) => ({
    // Combat state
    heroes: [],
    enemies: [],
    _heroData: [],
    _enemyData: [],
    turnQueue: [],
    currentTurnIndex: 0,
    combatLog: [],
    isPlayerTurn: false,
    combatState: 'ongoing', // 'ongoing', 'victory', 'defeat'

    /* @tweakable Stress gained when a hero takes HP damage */
    stressFromDamage: 5,
    /* @tweakable List of possible afflictions */
    possibleAfflictions: ["Fearful", "Paranoid", "Selfish", "Masochistic"],

    // === ACTIONS ===
    _initializeCombat: (heroData, enemyData) => {
        const combatHeroes = heroData.map(h => ({ ...h, combatId: uuidv4(), stress: 0, affliction: null, hp: h.maxHp }));
        set({ 
            heroes: combatHeroes, 
            _heroData: heroData,
            _enemyData: enemyData,
            combatLog: ['Your journey begins...'],
        });
    },

    _startCombat: () => {
         const { _enemyData, heroes } = get();
         const newEnemies = _enemyData.map(e => ({ ...e, combatId: uuidv4(), hp: e.maxHp }));
         const allCharacters = [...heroes, ...newEnemies];
         const turnQueue = allCharacters.sort((a,b) => b.speed - a.speed).map(c => c.combatId);

        set({
            gamePhase: 'combat',
            combatState: 'ongoing',
            enemies: newEnemies,
            turnQueue: turnQueue,
            currentTurnIndex: 0,
            isPlayerTurn: allCharacters.find(c => c.combatId === turnQueue[0])?.type === 'hero',
            combatLog: ['A new battle begins!', ...get().combatLog]
        });
    },

    executeSkill: (targetId) => {
        const { selectedSkill, turnQueue, currentTurnIndex } = get();
        if (!selectedSkill) return;

        const attackerId = turnQueue[currentTurnIndex];
        const { allCharacters } = get()._getCharacterLists();
        const attacker = allCharacters.find(c => c.combatId === attackerId);

        let logMessage = '';
        let target;
        let requiresTargetUpdate = false;
        
        const setAnimation = (target) => {
             get().setAttackAnimation({ attacker, skill: selectedSkill, targetId: target.combatId });
        };

        const handleStress = (target, amount) => {
            if (target.type !== 'hero' || target.hp <= 0 || target.affliction) return target;

            const newStress = Math.min(target.maxStress, target.hp > 0 ? target.stress + amount : target.stress);
            if (newStress > target.stress) {
                 get()._addLog(`${target.name} is stressed! (+${amount})`);
            }
            let newAffliction = target.affliction;

            if (newStress >= target.maxStress && !target.affliction) {
                const { possibleAfflictions } = get();
                newAffliction = possibleAfflictions[Math.floor(Math.random() * possibleAfflictions.length)];
                get()._addLog(`${target.name}'s resolve is tested... ${newAffliction.toUpperCase()}!`);
                return { ...target, stress: newStress, affliction: newAffliction };
            }
            return { ...target, stress: newStress };
        };

        if (selectedSkill.damage_modifier) {
            target = allCharacters.find(c => c.combatId === targetId);
            if (!target) return;
            setAnimation(target);

            const damage = Math.round(attacker.damage * selectedSkill.damage_modifier);
            const newHp = Math.max(0, target.hp - damage);
            logMessage = `${attacker.name} uses ${selectedSkill.name} on ${target.name} for ${damage} damage!`;
            
            const baseUpdate = { ...target, hp: newHp };
            const finalUpdate = target.type === 'hero' ? handleStress(baseUpdate, get().stressFromDamage) : baseUpdate;

            const updateCharacter = (c) => c.combatId === targetId ? finalUpdate : c;

            set(state => ({
                heroes: state.heroes.map(updateCharacter),
                enemies: state.enemies.map(updateCharacter),
            }));
            requiresTargetUpdate = true;
        } else if (selectedSkill.heal) {
            target = get().heroes.find(c => c.combatId === targetId);
            if(!target) return;
            setAnimation(target);

            const newHp = Math.min(target.maxHp, target.hp + selectedSkill.heal);
             logMessage = `${attacker.name} uses ${selectedSkill.name} on ${target.name}, healing for ${selectedSkill.heal} HP.`;

            const updateCharacter = (c) => c.combatId === targetId ? { ...c, hp: newHp } : c;
            set(state => ({ heroes: state.heroes.map(updateCharacter) }));
            requiresTargetUpdate = true;
        } else if (selectedSkill.stress_damage) {
            target = get().heroes.find(c => c.combatId === targetId);
            if (!target) return;
            setAnimation(target);

            logMessage = `${attacker.name} uses ${selectedSkill.name} on ${target.name}! Their resolve is tested.`;
            
            const finalUpdate = handleStress(target, selectedSkill.stress_damage);
            const updateCharacter = (c) => c.combatId === targetId ? finalUpdate : c;
            set(state => ({ heroes: state.heroes.map(updateCharacter) }));
            requiresTargetUpdate = true;
        }

        if (requiresTargetUpdate) {
            set(state => ({
                combatLog: [logMessage, ...state.combatLog],
                selectedSkill: null,
            }));
            setTimeout(() => get()._endTurn(), 200);
        }
    },

    _killAllEnemies: () => {
        get()._addLog("DEV: Slaying all fiends...");
        set(state => ({
            enemies: state.enemies.map(e => ({ ...e, hp: 0 })),
        }));
        setTimeout(() => get()._endTurn(), 100);
    },

    moveHero: (targetId) => {
        const { turnQueue, currentTurnIndex, heroes } = get();
        const moverId = turnQueue[currentTurnIndex];

        const mover = heroes.find(h => h.combatId === moverId);
        const target = heroes.find(h => h.combatId === targetId);

        if (!mover || !target || mover.combatId === target.combatId) return;

        const moverPosition = mover.position;
        const targetPosition = target.position;

        const newHeroes = heroes.map(hero => {
            if (hero.combatId === moverId) return { ...hero, position: targetPosition };
            if (hero.combatId === targetId) return { ...hero, position: moverPosition };
            return hero;
        });

        const logMessage = `${mover.name} and ${target.name} swap positions.`;
        set({
            heroes: newHeroes,
            isMoving: false,
            combatLog: [logMessage, ...get().combatLog]
        });

        setTimeout(() => get()._endTurn(), 200);
    },

    // === TURN MANAGEMENT ===
    _endTurn: () => {
        const { heroes, enemies, turnQueue } = get();
        const livingIds = [...heroes, ...enemies].filter(c => c.hp > 0).map(c => c.combatId);

        const newTurnQueue = turnQueue.filter(id => livingIds.includes(id));
        
        if (get().enemies.every(e => e.hp <= 0)) {
            set({ combatState: 'victory', combatLog: ['Victory!', ...get().combatLog] });
            return;
        }
        if (get().heroes.every(h => h.hp <= 0)) {
            set({ combatState: 'defeat', combatLog: ['Defeat!', ...get().combatLog] });
            return;
        }

        const newIndex = (get().currentTurnIndex + 1) % newTurnQueue.length;
        const nextCharId = newTurnQueue[newIndex];
        const { allCharacters } = get()._getCharacterLists();
        const nextChar = allCharacters.find(c => c.combatId === nextCharId);

        set({
            currentTurnIndex: newIndex,
            turnQueue: newTurnQueue,
            isPlayerTurn: nextChar?.type === 'hero',
        });
    },

    endCombat: () => {
        const { dungeon, currentRoomId } = get();
        const currentRoom = dungeon.rooms.find(r => r.id === currentRoomId);
        
        const newRooms = dungeon.rooms.map(room => {
            if (room.id === currentRoomId) {
                return { ...room, hasCombat: false };
            }
            return room;
        });

        set({
            gamePhase: 'dungeon',
            combatState: 'ongoing',
            enemies: [], 
            dungeon: { ...dungeon, rooms: newRooms }
        });
    },
    
    // === ENEMY AI ===
    runEnemyAI: () => {
        const { turnQueue, currentTurnIndex, heroes } = get();
        const attackerId = turnQueue[currentTurnIndex];
        const { allCharacters } = get()._getCharacterLists();
        const attacker = allCharacters.find(c => c.combatId === attackerId);

        if (!attacker || attacker.type !== 'enemy') return;

        const livingHeroes = heroes.filter(h => h.hp > 0);
        if (livingHeroes.length === 0) return;

        const skill = attacker.skills[Math.floor(Math.random() * attacker.skills.length)];
        let target;

        if (skill.stress_damage) {
            const nonAfflictedHeroes = livingHeroes.filter(h => !h.affliction);
            if (nonAfflictedHeroes.length > 0) {
                 target = nonAfflictedHeroes[Math.floor(Math.random() * nonAfflictedHeroes.length)];
            } else {
                 target = livingHeroes[Math.floor(Math.random() * livingHeroes.length)];
            }
        } else {
             target = livingHeroes[Math.floor(Math.random() * livingHeroes.length)];
        }

        set({ selectedSkill: skill });
        get().executeSkill(target.combatId);
    },

    _addLog: (message) => {
        set(state => ({ combatLog: [message, ...state.combatLog] }));
    },

    // === HELPERS ===
    _getCharacterLists: () => {
        const { heroes, enemies } = get();
        return { heroes, enemies, allCharacters: [...heroes, ...enemies] };
    },
});