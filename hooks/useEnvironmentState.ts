import { useState } from 'react';
import { StructureType } from '../game/builder/BuildingParts';
import * as THREE from 'three';

export function useEnvironmentState() {
  const [selectedLand, setSelectedLand] = useState<{ name: string; points: number[][]; color?: string } | null>(null);
  const [isEnvironmentBuilt, setIsEnvironmentBuilt] = useState(false);
  const [isVisualLoadingDone, setIsVisualLoadingDone] = useState(false);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [activeStructure, setActiveStructure] = useState<StructureType>('foundation');
  const [currentBiome, setCurrentBiome] = useState({ name: 'Verdant Meadows', color: '#4ade80' });
  const [playerRotation, setPlayerRotation] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [playerPosForMap, setPlayerPosForMap] = useState(new THREE.Vector3());

  return {
    isEnvironmentBuilt, setIsEnvironmentBuilt,
    selectedLand, setSelectedLand,
    isVisualLoadingDone, setIsVisualLoadingDone,
    isBuilderMode, setIsBuilderMode,
    activeStructure, setActiveStructure,
    currentBiome, setCurrentBiome,
    playerRotation, setPlayerRotation,
    showGrid, setShowGrid,
    playerPosForMap, setPlayerPosForMap
  };
}
