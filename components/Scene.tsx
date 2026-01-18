
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Game } from "../game/Game";
import { PlayerConfig, PlayerInput, InventoryItem } from '../types';

interface SceneProps {
  activeScene: 'dev' | 'world' | 'combat';
  config: PlayerConfig;
  manualInput: Partial<PlayerInput>;
  initialInventory: (InventoryItem | null)[];
  onInventoryUpdate?: (items: (InventoryItem | null)[]) => void;
  onSlotSelect?: (slotIndex: number) => void;
  onInteractionUpdate?: (text: string | null, progress: number | null) => void;
  onGameReady?: (game: Game) => void;
  onEnvironmentReady?: () => void;
  onToggleWorldMap?: (pos: THREE.Vector3) => void;
  onToggleQuestLog?: () => void;
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
    onEnvironmentReady,
    onToggleWorldMap,
    onToggleQuestLog,
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
    if (onEnvironmentReady) {
        game.onEnvironmentReady = onEnvironmentReady;
    }

    // Hook up callbacks
    game.onInventoryUpdate = onInventoryUpdate;
    game.onInteractionUpdate = onInteractionUpdate;
    if (onSlotSelect) {
        game.setSlotSelectCallback(onSlotSelect);
        if (onToggleWorldMap) game.onToggleWorldMapCallback = onToggleWorldMap;
        if (onEnvironmentReady) game.onEnvironmentReady = onEnvironmentReady;
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
      
      // Handle scene switching
      // We check private property access pattern or expose a getter, but for now 
      // we can infer it needs switching if prop changed.
      // Actually, Scene component is re-mounted if key changes in App, which forces reconstruction.
      // But if App uses same key, we must switch manually. App uses `key={activeScene}` so this is handled by re-mount.
      
      game.setConfig(config);
      game.setManualInput(manualInput);
      
      game.setInventory(initialInventory);
      
      game.onInventoryUpdate = onInventoryUpdate;
      game.onInteractionUpdate = onInteractionUpdate;
      if (onSlotSelect) game.setSlotSelectCallback(onSlotSelect);
      
      game.setControlsActive(!controlsDisabled);

      game['inputManager'].onToggleQuestLog = onToggleQuestLog;

  }, [config, manualInput, initialInventory, onInventoryUpdate, onSlotSelect, onInteractionUpdate, onToggleQuestLog, onEnvironmentReady, controlsDisabled]);

  return <div ref={containerRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />;
};

export default Scene;
