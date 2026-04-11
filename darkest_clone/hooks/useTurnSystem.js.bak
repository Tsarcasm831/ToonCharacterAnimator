import { useEffect } from 'react';
import { useGameStore } from '../state/GameState.jsx';

/* @tweakable Delay in milliseconds for the AI to take its turn */
const aiActionDelay = 1000;

export function useTurnSystem() {
    const { 
        turnQueue, 
        currentTurnIndex, 
        isPlayerTurn, 
        runEnemyAI, 
        combatState,
    } = useGameStore(state => ({
        turnQueue: state.turnQueue,
        currentTurnIndex: state.currentTurnIndex,
        isPlayerTurn: state.isPlayerTurn,
        runEnemyAI: state.runEnemyAI,
        combatState: state.combatState,
    }));

    const allCharacters = useGameStore(state => [...state.heroes, ...state.enemies]);
    
    const activeCharacter = turnQueue.length > 0 ? allCharacters.find(c => c.combatId === turnQueue[currentTurnIndex]) : null;

    useEffect(() => {
        if (!isPlayerTurn && combatState === 'ongoing' && turnQueue.length > 0) {
            const timer = setTimeout(() => {
                runEnemyAI();
            }, aiActionDelay); // Delay for AI action
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, currentTurnIndex, combatState, runEnemyAI, turnQueue]);

    return {
        activeCharacter,
        isPlayerTurn,
        combatState,
    };
}