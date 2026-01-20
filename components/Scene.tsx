import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Game } from "../game/core/Game";
import { PlayerConfig, PlayerInput, InventoryItem } from '../types';
import { WorldMapModal } from './ui/WorldMapModal';

interface SceneProps {
  activeScene: 'dev' | 'land' | 'combat';
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
  showGrid?: boolean;
  isCombatActive?: boolean;
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
    controlsDisabled = false,
    showGrid = false,
    isCombatActive = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);

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
      
      game.setConfig(config);
      game.setManualInput(manualInput);
      
      game.setInventory(initialInventory);
      
      game.onInventoryUpdate = onInventoryUpdate;
      game.onInteractionUpdate = onInteractionUpdate;
      if (onSlotSelect) game.setSlotSelectCallback(onSlotSelect);
      
      game.setControlsActive(!controlsDisabled);

      game.toggleGrid(showGrid);
      game.setCombatActive(isCombatActive);

      game['inputManager'].onToggleQuestLog = onToggleQuestLog;

  }, [config, manualInput, initialInventory, onInventoryUpdate, onSlotSelect, onInteractionUpdate, onToggleQuestLog, onEnvironmentReady, controlsDisabled, showGrid, isCombatActive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, .no-capture')) return;
      if (e.repeat) return;

      if (e.code === 'Comma') {
        e.preventDefault();
        setIsWorldMapOpen(prev => !prev);
      }

      if (e.code === 'Escape') {
        setIsWorldMapOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div ref={containerRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />
      <WorldMapModal isOpen={isWorldMapOpen} onClose={() => setIsWorldMapOpen(false)} />
    </>
  );
};

export default Scene;
