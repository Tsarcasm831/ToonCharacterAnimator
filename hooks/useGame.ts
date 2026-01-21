import React, { useEffect, useRef } from 'react';
import { Game } from '../game/core/Game';
import { PlayerConfig, PlayerInput, InventoryItem } from '../types';
import { SceneType } from '../game/managers/SceneManager';
import * as THREE from 'three';

interface UseGameProps {
    containerRef: React.RefObject<HTMLDivElement>;
    config: PlayerConfig;
    manualInput: Partial<PlayerInput>;
    initialInventory: (InventoryItem | null)[];
    activeScene: SceneType;
    onGameReady?: (game: Game) => void;
    onEnvironmentReady?: () => void;
    onInventoryUpdate?: (items: (InventoryItem | null)[]) => void;
    onInteractionUpdate?: (text: string | null, progress: number | null) => void;
    onSlotSelect?: (slotIndex: number) => void;
    onToggleWorldMap?: (pos: THREE.Vector3) => void;
    onToggleQuestLog?: () => void;
    onToggleInventory?: () => void;
    onRotationUpdate?: (rotation: number) => void;
    onAttackHit?: (type: string, count: number) => void;
    controlsDisabled?: boolean;
    showGrid?: boolean;
    isCombatActive?: boolean;
}

export const useGame = ({
    containerRef,
    config,
    manualInput,
    initialInventory,
    activeScene,
    onGameReady,
    onEnvironmentReady,
    onInventoryUpdate,
    onInteractionUpdate,
    onSlotSelect,
    onToggleWorldMap,
    onToggleQuestLog,
    onToggleInventory,
    onRotationUpdate,
    onAttackHit,
    controlsDisabled = false,
    showGrid = false,
    isCombatActive = false
}: UseGameProps) => {
    const gameRef = useRef<Game | null>(null);

    // Initialization
    useEffect(() => {
        if (!containerRef.current) return;

        // Prevent double init if strict mode
        if (gameRef.current) return;

        const game = new Game(containerRef.current, config, manualInput, initialInventory, activeScene);
        gameRef.current = game;

        if (onGameReady) onGameReady(game);
        if (onEnvironmentReady) game.onEnvironmentReady = onEnvironmentReady;

        // Callbacks
        game.onInventoryUpdate = onInventoryUpdate;
        game.onInteractionUpdate = onInteractionUpdate;
        if (onRotationUpdate) game.onRotationUpdate = onRotationUpdate;
        if (onAttackHit) game.onAttackHit = onAttackHit;

        if (onSlotSelect) {
            game.setSlotSelectCallback(onSlotSelect);
            if (onToggleWorldMap) game.onToggleWorldMapCallback = onToggleWorldMap;
        }

        if (onToggleInventory) {
            game.onToggleInventoryCallback = onToggleInventory;
        }

        // Additional input callbacks
        if (game.inputManager) {
            if (onToggleInventory) {
                game.onToggleInventoryCallback = onToggleInventory;
                game.inputManager.onToggleInventory = () => {
                    if (game.onToggleInventoryCallback) game.onToggleInventoryCallback();
                };
            }
            game.inputManager.onToggleQuestLog = onToggleQuestLog;
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
            gameRef.current = null;
        };
    }, []); // Run once

    // Sync Props
    useEffect(() => {
        const game = gameRef.current;
        if (!game) return;

        // If scene changed in props but we initialized with a fixed one, handle switch?
        // Game constructor takes activeScene. SwitchScene is method on Game/SceneManager.
        // If activeScene prop changes, we should switch scene.
        if (game.getActiveScene() !== activeScene) {
            game.switchScene(activeScene);
        }

        game.setConfig(config);
        game.setManualInput(manualInput);
        
        // Only update inventory if it changed? Game.ts sets items directly.
        // We assume initialInventory is only for init, but if it updates from outside (like load game), we might need it?
        // Use `setInventory` method.
        // NOTE: React props might pass a new array reference every render. 
        // We should check deep equality or trust the game to handle it efficiently?
        // Or better, only call setInventory if it's not the same as internal state?
        // For now, let's trust the prop is authoritative.
        // But wait, Game updates inventory internally then calls onInventoryUpdate.
        // If onInventoryUpdate updates parent state, parent passes back new inventory prop.
        // This could cause a loop if we just naively set it back.
        // Game.ts: setInventory calls player.inventory.setItems.
        // Let's assume parent manages state and Game reflects it.
        // game.setInventory(initialInventory); // Maybe only if different?

        game.onInventoryUpdate = onInventoryUpdate;
        game.onInteractionUpdate = onInteractionUpdate;
        
        if (onSlotSelect) game.setSlotSelectCallback(onSlotSelect);
        
        game.setControlsActive(!controlsDisabled);
        game.toggleGrid(showGrid);
        game.setCombatActive(isCombatActive);

        if (game.inputManager) {
            game.inputManager.onToggleQuestLog = onToggleQuestLog;
        }

        if (game.combatManager) {
             // Re-bind combat manager tooltip callbacks if needed, though they are usually bound once in Scene component
             // Scene component binds specific state setters.
             // We might need to expose a way to bind these dynamically or pass them in props.
        }

    }, [config, manualInput, activeScene, controlsDisabled, showGrid, isCombatActive, onInventoryUpdate, onInteractionUpdate, onSlotSelect, onToggleQuestLog, initialInventory]);

    return gameRef;
};
