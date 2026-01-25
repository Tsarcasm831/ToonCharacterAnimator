
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Game } from "../game/core/Game";
import { PlayerConfig, PlayerInput, InventoryItem, EntityStats, TurnPhase } from '../types';
import { GameHUD } from './ui/hud/GameHUD';
import { CombatLogEntry } from './ui/hud/CombatLog';
import { UnitStatsTooltip } from './ui/hud/UnitStatsTooltip';
import { TurnIndicatorUI } from './ui/hud/TurnIndicatorUI';
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

    // Turn System State
    const [turnQueue, setTurnQueue] = useState<any[]>([]);
    const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
    const [turnPhase, setTurnPhase] = useState<string>('prep');

    const { gameRef, endTurn, waitTurn, defend } = useGame({
        containerRef,
        config,
        manualInput,
        initialInventory: [], 
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
        isCombatActive,
        // Turn Events
        onTurnQueueUpdate: (queue) => {
            // Transform queue to UI friendly format if needed, or just pass it
            // The queue from TurnManager is CombatUnit[]
            // We need to map it to what TurnIndicatorUI expects
            const uiQueue = queue.map(u => ({
                id: u.id,
                isFriendly: u.isFriendly,
                name: u.entity.constructor.name === 'Player' ? 'Hero' : u.entity.constructor.name,
                currentInitiative: u.currentInitiative,
                stats: u.stats
            }));
            setTurnQueue(uiQueue);
        },
        onTurnChanged: (unit) => {
            setCurrentUnitId(unit.id);
        },
        onTurnPhaseChange: (phase) => {
            switch (phase) {
                case TurnPhase.PLAYER_TURN:
                    setTurnPhase('player');
                    break;
                case TurnPhase.AI_TURN:
                    setTurnPhase('ai');
                    break;
                case TurnPhase.TURN_END:
                    setTurnPhase('end');
                    break;
                default:
                    setTurnPhase('prep');
            }
        }
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
                onEndTurn={endTurn}
                onWaitTurn={waitTurn}
                onDefend={defend}
                isPlayerTurn={turnPhase === 'player'}
            />

            {/* Turn Indicator (Only show if combat active) */}
            {isCombatActive && (
                <TurnIndicatorUI 
                    queue={turnQueue}
                    currentUnitId={currentUnitId}
                    phase={turnPhase}
                />
            )}
            
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
