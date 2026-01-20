import React, { useRef } from 'react';
import * as THREE from 'three';
import { Game } from "../game/core/Game";
import { PlayerConfig, PlayerInput, InventoryItem } from '../types';
import { useGame } from '../hooks/useGame';

interface LandSceneProps {
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

const LandScene: React.FC<LandSceneProps> = ({
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

  useGame({
      containerRef,
      config,
      manualInput,
      initialInventory,
      activeScene: 'land',
      onGameReady,
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

  return <div ref={containerRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />;
};

export default LandScene;
