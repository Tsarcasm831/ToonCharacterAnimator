import React, { createContext, useContext, ReactNode, useRef } from 'react';
import { Game } from '../game/core/Game';
import { useGameState } from '../hooks/useGameState';
import { usePlayerState } from '../hooks/usePlayerState';
import { useInventoryState } from '../hooks/useInventoryState';
import { useUIState } from '../hooks/useUIState';
import { useCombatState } from '../hooks/useCombatState';
import { useEnvironmentState } from '../hooks/useEnvironmentState';
import { useQuestState } from '../hooks/useQuestState';
import { useEquipmentLogic } from '../hooks/useEquipmentLogic';
import { useEconomyLogic } from '../hooks/useEconomyLogic';

interface GlobalContextType {
  gameState: ReturnType<typeof useGameState>;
  playerState: ReturnType<typeof usePlayerState>;
  inventoryState: ReturnType<typeof useInventoryState>;
  uiState: ReturnType<typeof useUIState>;
  combatState: ReturnType<typeof useCombatState>;
  environmentState: ReturnType<typeof useEnvironmentState>;
  questState: ReturnType<typeof useQuestState>;
  equipmentLogic: ReturnType<typeof useEquipmentLogic>;
  economyLogic: ReturnType<typeof useEconomyLogic>;
  gameInstance: React.MutableRefObject<Game | null>;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const gameState = useGameState();
  const playerState = usePlayerState();
  const inventoryState = useInventoryState();
  const uiState = useUIState();
  const combatState = useCombatState();
  const environmentState = useEnvironmentState();
  
  // Dependent states
  const questState = useQuestState(
    inventoryState.inventory, 
    playerState.setCoins, 
    inventoryState.setInventory, 
    uiState.setNotification
  );

  const equipmentLogic = useEquipmentLogic({
    inventory: inventoryState.inventory,
    setInventory: inventoryState.setInventory,
    equipmentSlots: inventoryState.equipmentSlots,
    setEquipmentSlots: inventoryState.setEquipmentSlots,
    setConfig: playerState.setConfig
  });

  const economyLogic = useEconomyLogic({
    inventory: inventoryState.inventory,
    setInventory: inventoryState.setInventory,
    coins: playerState.coins,
    setCoins: playerState.setCoins
  });

  const gameInstance = useRef<Game | null>(null);

  const value: GlobalContextType = {
    gameState,
    playerState,
    inventoryState,
    uiState,
    combatState,
    environmentState,
    questState,
    equipmentLogic,
    economyLogic,
    gameInstance
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalProvider');
  }
  return context;
};
