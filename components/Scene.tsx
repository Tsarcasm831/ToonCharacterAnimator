import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Game } from "../game/Game";
import { PlayerConfig, PlayerInput } from '../types';

interface SceneProps {
  activeScene: 'dev' | 'world';
  config: PlayerConfig;
  manualInput: Partial<PlayerInput>;
  initialInventory: string[];
  onInventoryUpdate?: (items: string[]) => void;
  onSlotSelect?: (slotIndex: number) => void;
  onInteractionUpdate?: (text: string | null, progress: number | null) => void;
  onGameReady?: (game: Game) => void;
  onToggleWorldMap?: (pos: THREE.Vector3) => void;
  controlsDisabled?: boolean;
}

const Scene: React.FC<SceneProps> = ({ 
    activeScene,
    config, 
    manualInput, 
    initialInventory, 
    onInventoryUpdate, 
    onSlotSelect, 
    onInteractionUpdate, 
    onGameReady,
    onToggleWorldMap,
    controlsDisabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Game
    const game = new Game(containerRef.current, config, manualInput, initialInventory, activeScene);
    gameRef.current = game;
    
    if (onGameReady) onGameReady(game);

    // Hook up callbacks
    game.onInventoryUpdate = onInventoryUpdate;
    game.onInteractionUpdate = onInteractionUpdate;
    if (onSlotSelect) {
        game.setSlotSelectCallback(onSlotSelect);
    }
    if (onToggleWorldMap) {
        game.onToggleWorldMapCallback = onToggleWorldMap;
    }

    game.start();

    const handleResize = () => game.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      game.stop();
    };
  }, []); // Run once on mount

  // Sync props to Game instance
  useEffect(() => {
      const game = gameRef.current;
      if (!game) return;
      game.setConfig(config);
      game.setManualInput(manualInput);
      
      // Update inventory from React state if it changes (e.g. drag & drop)
      game.setInventory(initialInventory);
      
      // Update callbacks
      game.onInventoryUpdate = onInventoryUpdate;
      game.onInteractionUpdate = onInteractionUpdate;
      if (onSlotSelect) game.setSlotSelectCallback(onSlotSelect);
      
      // Sync Control State
      game.setControlsActive(!controlsDisabled);

  }, [config, manualInput, initialInventory, onInventoryUpdate, onSlotSelect, onInteractionUpdate, controlsDisabled]);

  return <div ref={containerRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />;
};

export default Scene;
