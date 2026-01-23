import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Game } from '../game/core/Game';
import { PlayerConfig, PlayerInput, InventoryItem, ActiveScene } from '../types';
import { WorldMapModal } from './ui/WorldMapModal';
import { useGame } from '../hooks/useGame';
import { BIOME_DATA } from '../game/environment/EnvironmentTypes';
import { ObjectFactory } from '../game/environment/ObjectFactory';

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

// Temporarily suppress building prefabs (forge, dev block) while keeping pond/trees
const suppressBuildings = (() => {
  let patched = false;
  let originals: Record<string, any> | null = null;
  return {
    apply: () => {
      if (patched) return;
      originals = {
        createForge: ObjectFactory.createForge,
        createBlueBlock: ObjectFactory.createBlueBlock
      };

      ObjectFactory.createForge = (pos: THREE.Vector3, rot: number) => ({ group: new THREE.Group(), obstacles: [] });
      ObjectFactory.createBlueBlock = () => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.01, 0.01, 0.01),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        mesh.position.set(0, -9999, 0);
        return mesh;
      };
      patched = true;
    },
    restore: () => {
      if (!patched || !originals) return;
      ObjectFactory.createForge = originals.createForge;
      ObjectFactory.createBlueBlock = originals.createBlueBlock;
      originals = null;
      patched = false;
    }
  };
})();

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

  // Force a single biome and expand to a 16x16 grid (centered around origin)
  useEffect(() => {
    const originalBiomeData = { ...BIOME_DATA };
    const single = BIOME_DATA['0,0']; // Verdant Meadows
    // Populate -8..7 (16 cells) in both axes with the single biome
    for (let x = -8; x <= 7; x++) {
      for (let z = -8; z <= 7; z++) {
        BIOME_DATA[`${x},${z}`] = single;
      }
    }
    // Keep water entry intact
    BIOME_DATA['water'] = originalBiomeData['water'];

    suppressBuildings.apply();

    return () => {
      // Restore original biome data to avoid leaking into other scenes
      Object.keys(BIOME_DATA).forEach(k => delete (BIOME_DATA as any)[k]);
      Object.entries(originalBiomeData).forEach(([k, v]) => {
        (BIOME_DATA as any)[k] = v;
      });
      suppressBuildings.restore();
    };
  }, []);

  useGame({
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
