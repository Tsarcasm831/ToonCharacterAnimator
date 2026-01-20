
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Game } from "../game/core/Game";
import { PlayerConfig, PlayerInput, InventoryItem, EntityStats } from '../types';
import { GameHUD } from './ui/GameHUD';
import { CombatLogEntry } from './ui/CombatLog';
import { UnitStatsTooltip } from './ui/UnitStatsTooltip';

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
    const gameRef = useRef<Game | null>(null);
    
    // Tooltip state for right-click unit stats
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        stats?: EntityStats;
        unitName?: string;
        x: number;
        y: number;
    }>({ visible: false, x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Game in combat mode
        const game = new Game(containerRef.current, config, manualInput, [], 'combat');
        gameRef.current = game;

        if (onGameReady) onGameReady(game);
        if (onEnvironmentReady) {
            game.onEnvironmentReady = onEnvironmentReady;
        }

        // Hook up callbacks
        game.onInteractionUpdate = onInteractionUpdate;
        game.onRotationUpdate = onRotationUpdate;
        game.onAttackHit = onAttackHit;
        game['inputManager'].onToggleQuestLog = onToggleQuestLog;

        // Wire up tooltip callbacks for combat
        if (game.combatManager) {
            game.combatManager.onShowTooltip = (stats, name, x, y) => {
                setTooltip({ visible: true, stats, unitName: name, x: x || 0, y: y || 0 });
            };
            game.combatManager.onHideTooltip = () => {
                setTooltip(prev => ({ ...prev, visible: false }));
            };
        }

        game.start();

        const handleResize = () => game.resize();
        window.addEventListener('resize', handleResize);

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => handleResize());
            resizeObserver.observe(containerRef.current);
        }

        requestAnimationFrame(() => handleResize());

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver?.disconnect();
            game.stop();
        };
    }, []); // Run once on mount

    // Sync props to Game instance
    useEffect(() => {
        const game = gameRef.current;
        if (!game) return;

        game.setConfig(config);
        game.setManualInput(manualInput);
        game.setControlsActive(!controlsDisabled);
        game.toggleGrid(showGrid);
        game.setCombatActive(isCombatActive);
    }, [config, manualInput, controlsDisabled, showGrid, isCombatActive]);

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
