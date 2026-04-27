import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Game } from '../game/core/Game';
import { ActiveScene, InventoryItem, PlayerConfig, PlayerInput } from '../types';
import { useGame } from '../hooks/useGame';
import { WorldMapModal } from './ui/modals/WorldMapModal';

interface StarterSceneProps {
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

const STARTER_LAND_POINTS = [
  [48, 48],
  [52, 48],
  [52, 52],
  [48, 52],
];

const STARTER_BIOME = {
  name: 'Starter Meadow',
  color: '#4ade80',
  type: 'Grass',
};

const Starter: React.FC<StarterSceneProps> = ({
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
  isCombatActive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);

  const handleGameReady = (game: Game) => {
    onGameReady?.(game);

    game.player.mesh.scale.setScalar(1);
    game.sceneManager.updateSingleBiomeLand(STARTER_LAND_POINTS, STARTER_BIOME, {
      spawnHive: false,
    });
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
    isCombatActive,
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

export default Starter;
