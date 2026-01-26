import { useState } from 'react';
import { StructureType } from '../game/builder/BuildingParts';
import * as THREE from 'three';

export function useEnvironmentState() {
  const [selectedLand, setSelectedLand] = useState<{
    id: string;
    name: string;
    points: number[][];
    color?: string;
    texture?: string;
    biomeType?: string;
  } | null>(null);
  const [isEnvironmentBuilt, setIsEnvironmentBuilt] = useState(false);
  const [isVisualLoadingDone, setIsVisualLoadingDone] = useState(false);
  const [isBuilderMode, setIsBuilderModeState] = useState(false);
  const setIsBuilderMode = (value: boolean) => {
    console.log('useEnvironmentState.setIsBuilderMode called with:', value);
    setIsBuilderModeState(value);
  };
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
