
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Game } from "../game/core/Game";
import { PlayerConfig, PlayerInput, InventoryItem, EntityStats } from '../types';
import { GameHUD } from './ui/GameHUD';
import { CombatLogEntry } from './ui/CombatLog';
import { UnitStatsTooltip } from './ui/UnitStatsTooltip';
import { useGame } from '../hooks/useGame';

interface CombatSceneProps {
    config: PlayerConfig;
    manualInput: Partial<PlayerInput>;
    bench: (InventoryItem | null)[];
    onGameReady?: (game: Game) => void;
    onEnvironmentReady?: () => void;
    onInteractionUpdate?: (text: string | null, progress: number | null) => void;
    onToggleQuestLog?: () => void;
    onRotationUpdate?: (rotation: number) => void;
    onAttackHit?: (type: string, count: number) => void;
    isCombatActive: boolean;
    setIsCombatActive: (active: boolean) => void;
    combatLog: CombatLogEntry[];
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    controlsDisabled?: boolean;
}

const CombatScene: React.FC<CombatSceneProps> = ({
    config,
    manualInput,
    bench,
    onGameReady,
    onEnvironmentReady,
    onInteractionUpdate,
    onToggleQuestLog,
    onRotationUpdate,
    onAttackHit,
    isCombatActive,
    setIsCombatActive,
    combatLog,
    showGrid,
    setShowGrid,
    controlsDisabled = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Tooltip state for right-click unit stats
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        stats?: EntityStats;
        unitName?: string;
        x: number;
        y: number;
    }>({ visible: false, x: 0, y: 0 });

    const gameRef = useGame({
        containerRef,
        config,
        manualInput,
        initialInventory: [], // Combat scene doesn't really use main inventory for items like Land does, but we pass empty for now or bench?
        activeScene: 'combat',
        onGameReady: (game) => {
            if (onGameReady) onGameReady(game);
            
            // Wire up tooltip callbacks for combat
            if (game.combatManager) {
                game.combatManager.onShowTooltip = (stats, name, x, y) => {
                    setTooltip({ visible: true, stats, unitName: name, x: x || 0, y: y || 0 });
                };
                game.combatManager.onHideTooltip = () => {
                    setTooltip(prev => ({ ...prev, visible: false }));
                };
            }
        },
        onEnvironmentReady,
        onInteractionUpdate,
        onToggleQuestLog,
        onRotationUpdate,
        onAttackHit,
        controlsDisabled,
        showGrid,
        isCombatActive
    });

    // Hide tooltip when clicking anywhere
    const handleClick = () => {
        if (tooltip.visible) {
            setTooltip(prev => ({ ...prev, visible: false }));
        }
    };

    return (
        <div className="w-full h-full relative" onClick={handleClick}>
            <div ref={containerRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />
            
            <GameHUD 
                activeScene="combat"
                currentBiome={{ name: 'Combat Arena', color: '#ef4444' }}
                playerRotation={0}
                inventory={[]}
                bench={bench}
                selectedSlot={0}
                onSelectSlot={() => {}}
                selectedUnit={gameRef.current?.combatManager?.selectedUnit}
                interactionText={null}
                interactionProgress={null}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                isCombatActive={isCombatActive}
                setIsCombatActive={setIsCombatActive}
                stats={config.stats}
                isFemale={config.bodyType === 'female'}
                combatLog={combatLog}
                onOpenTravel={() => {}}
                onToggleBestiary={() => {}}
            />
            
            {/* Unit Stats Tooltip (shown on right-click) */}
            <UnitStatsTooltip 
                visible={tooltip.visible}
                stats={tooltip.stats}
                unitName={tooltip.unitName}
                x={tooltip.x}
                y={tooltip.y}
            />
        </div>
    );
};

export default CombatScene;
