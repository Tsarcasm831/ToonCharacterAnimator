import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Game } from '../game/core/Game';
import { PlayerConfig, PlayerInput, InventoryItem, ActiveScene } from '../types';
import { WorldMapModal } from './ui/WorldMapModal';
import { useGame } from '../hooks/useGame';
import { useGlobalState } from '../contexts/GlobalContext';

interface SceneProps {
  activeScene: ActiveScene;
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

const SingleBiomeScene: React.FC<SceneProps> = ({
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
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const gameRef = useRef<Game | null>(null);
  const { uiState } = useGlobalState();

  useEffect(() => {
    // Open land selection on mount
    uiState.setIsLandSelectionOpen(true);
  }, []);

  const handleGameReady = (game: Game) => {
    gameRef.current = game;
    if (onGameReady) onGameReady(game);
    
    // Initialize with a default 100x100 grid (2x2 land units)
    // Points relative to center
    const defaultPoints = [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2]
    ];
    game.sceneManager.updateSingleBiomeLand(defaultPoints, { name: 'Default Grid', color: '#4ade80', type: 'Grass' });
    
    // Disable environment systems if needed, but SingleBiomeEnvironment handles its own build
    const env = game.sceneManager.environment;
    if (env) {
      // If we somehow still have the main environment loaded (shouldn't happen with new SceneManager logic)
      (env as any).grassManager = null;
      (env as any).snowSystem = null;
      (env as any).debrisSystem = { update: () => {}, dispose: () => {} };
    }
    
    if (onEnvironmentReady) onEnvironmentReady();
  };

  useGame({
    containerRef,
    config,
    manualInput,
    initialInventory,
    activeScene,
    onGameReady: handleGameReady,
    onEnvironmentReady,
    onInventoryUpdate,
    onInteractionUpdate,
    onSlotSelect,
    onToggleWorldMap,
    onToggleQuestLog,
    controlsDisabled,
    showGrid,
    isCombatActive
  });

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

export default SingleBiomeScene;
