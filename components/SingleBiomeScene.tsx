import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Game } from '../game/core/Game';
import { PlayerConfig, PlayerInput, InventoryItem, ActiveScene } from '../types';
import { WorldMapModal } from './ui/modals/WorldMapModal';
import { useGame } from '../hooks/useGame';
import { useGlobalState } from '../contexts/GlobalContext';
import { Land23 } from '../data/lands/Land23';
import { CITIES } from '../data/lands/cities';
import { calculateBounds, landCoordsToWorld } from '../game/environment/landTerrain';

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
  const { uiState, environmentState } = useGlobalState();
  const { setSelectedLand } = environmentState;

  useEffect(() => {
    // Open land selection on mount
    uiState.setIsLandSelectionOpen(true);
  }, []);

  const handleGameReady = (game: Game) => {
    gameRef.current = game;
    if (onGameReady) onGameReady(game);

    // Make the player 2x smaller relative to the land for this scene.
    const playerScale = 0.5;
    game.player.mesh.scale.setScalar(playerScale);

    game.sceneManager.updateSingleBiomeLand(Land23.points, { name: Land23.name, color: Land23.color, type: 'Snow' });
    game.sceneManager.singleBiomeEnvironment?.syncSkySphereToLand(Land23.points);
    setSelectedLand({ name: Land23.name, color: Land23.color, points: Land23.points });

    const yureiCity = CITIES.find(city => city.name === 'Yureigakure');
    if (yureiCity) {
      const { centerX, centerZ } = calculateBounds(Land23.points);
      const spawnWorld = landCoordsToWorld(yureiCity.x, yureiCity.y, centerX, centerZ);
      const spawnY = 5;

      game.player.mesh.position.set(spawnWorld.x, spawnY, spawnWorld.z);
      const targetHeight = 1.7 * playerScale;
      const cameraHeight = 3.2 * playerScale;
      const cameraDistance = 5.0 * playerScale;
      game.renderManager.controls.target.set(spawnWorld.x, spawnY + targetHeight, spawnWorld.z);
      game.renderManager.camera.position.set(spawnWorld.x, spawnY + cameraHeight, spawnWorld.z + cameraDistance);
      game.player.locomotion.position.copy(game.player.mesh.position);
      game.player.locomotion.previousPosition.copy(game.player.mesh.position);
      const GRID_SIZE = 1.3333;
      game.sceneManager.singleBiomeEnvironment?.setCircularWallCenter(
        new THREE.Vector2(spawnWorld.x - GRID_SIZE * 5, spawnWorld.z)
      );
    }
    
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
