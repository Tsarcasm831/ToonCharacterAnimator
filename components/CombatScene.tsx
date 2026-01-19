
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Game } from "../game/core/Game";
import { PlayerConfig, PlayerInput, InventoryItem } from '../types';
import { GameHUD } from './ui/GameHUD';
import { CombatLogEntry } from './ui/CombatLog';

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
    controlsDisabled = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Game | null>(null);

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

    return (
        <div className="w-full h-full relative">
            <div ref={containerRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />
            
            <GameHUD 
                activeScene="combat"
                currentBiome={{ name: 'Combat Arena', color: '#ef4444' }}
                playerRotation={0} // This could be synced if needed
                inventory={[]} // Combat uses bench
                bench={bench}
                selectedSlot={0} // Internal state in App.tsx
                onSelectSlot={() => {}} // Internal state in App.tsx
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
        </div>
    );
};

export default CombatScene;
