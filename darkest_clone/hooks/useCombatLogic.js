import { useGameStore } from '../state/GameState.jsx';
import { useShallow } from 'zustand/react/shallow';

export function useCombatLogic() {
    const { 
        selectedSkill, 
        setSelectedSkill, 
        executeSkill,
        heroes,
        isMoving,
        setMoving,
        moveHero,
    } = useGameStore(useShallow((state) => ({
        selectedSkill: state.selectedSkill,
        setSelectedSkill: state.setSelectedSkill,
        executeSkill: state.executeSkill,
        heroes: state.heroes,
        isMoving: state.isMoving,
        setMoving: state.setMoving,
        moveHero: state.moveHero,
    })));

    const handleSelectSkill = (skill) => {
        // if skill is a stress attack, and all heroes are afflicted, don't allow selection.
        if (skill.stress_damage) {
            const livingHeroes = heroes.filter(h => h.hp > 0);
            if (livingHeroes.every(h => h.affliction)) {
                return; // Cannot select skill
            }
        }
        setSelectedSkill(skill);
    };

    const handleMoveButtonClick = () => {
        setMoving(!isMoving);
    };

    const handleTargetSelect = (targetId) => {
        if (isMoving) {
            moveHero(targetId);
        } else if (selectedSkill) {
            executeSkill(targetId);
        }
    };

    return {
        selectedSkill,
        isMoving,
        handleSelectSkill,
        handleMoveButtonClick,
        handleTargetSelect,
    };
}

