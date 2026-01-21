import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Game } from "../game/core/Game";
import { PlayerConfig, PlayerInput, InventoryItem } from '../types';
import { useGame } from '../hooks/useGame';
import { MPManager } from '../game/managers/MPManager';

interface MPTestSceneProps {
    config: PlayerConfig;
    manualInput: Partial<PlayerInput>;
    initialInventory: (InventoryItem | null)[];
    onInventoryUpdate?: (items: (InventoryItem | null)[]) => void;
    onSlotSelect?: (slotIndex: number) => void;
    onInteractionUpdate?: (text: string | null, progress: number | null) => void;
    onGameReady?: (game: Game) => void;
    onEnvironmentReady?: () => void;
    onToggleQuestLog?: () => void;
    controlsDisabled?: boolean;
    showGrid?: boolean;
    isCombatActive?: boolean;
}

const MPTestScene: React.FC<MPTestSceneProps> = ({ 
    config, 
    manualInput, 
    initialInventory, 
    onInventoryUpdate, 
    onSlotSelect, 
    onInteractionUpdate, 
    onGameReady,
    onEnvironmentReady,
    onToggleQuestLog,
    controlsDisabled = false,
    showGrid = false,
    isCombatActive = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mpManagerRef = useRef<MPManager | null>(null);

    // Use the existing game hook to initialize the core game loop
    const game = useGame({
        containerRef,
        config,
        manualInput,
        initialInventory,
        activeScene: 'mp',
        onGameReady: (g) => {
            // Initialize Multiplayer Manager when game is ready
            mpManagerRef.current = new MPManager(g);
            mpManagerRef.current.connect();
            g.onUpdate = (dt) => mpManagerRef.current?.update(dt);
            if (onGameReady) onGameReady(g);
        },
        onEnvironmentReady,
        onInventoryUpdate,
        onInteractionUpdate,
        onSlotSelect,
        onToggleQuestLog,
        controlsDisabled,
        showGrid,
        isCombatActive
    });

    useEffect(() => {
        return () => {
            // Cleanup MP connection on unmount
            if (mpManagerRef.current) {
                mpManagerRef.current.disconnect();
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />
    );
};

export default MPTestScene;
