import React, { createContext, useContext, ReactNode, useRef, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
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
import { useAuthState } from '../hooks/useAuthState';
import { loadGameSave, saveGame, GameSaveData } from '../lib/saveManager';
import { isSupabaseEnabled } from '../lib/supabase';

const SAVE_SLOT = 'main';
const AUTOSAVE_DEBOUNCE_MS = 5000;

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
  user: User | null;
  isAuthLoading: boolean;
  isSaveLoaded: boolean;
  hasSavedCharacter: boolean;
  manualSave: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const gameState = useGameState();
  const playerState = usePlayerState();
  const inventoryState = useInventoryState();
  const uiState = useUIState();
  const combatState = useCombatState();
  const environmentState = useEnvironmentState();
  const { user, isAuthLoading } = useAuthState();
  
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
  const [isSaveLoaded, setIsSaveLoaded] = React.useState(false);
  const [hasSavedCharacter, setHasSavedCharacter] = React.useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaveLoadedRef = useRef(false);
  const hasSavedCharacterRef = useRef(false);

  const buildSaveData = useCallback((): GameSaveData => ({
    version: 1,
    playerState: {
      coins: playerState.coins,
      config: playerState.config,
    },
    inventoryState: {
      inventory: inventoryState.inventory,
      equipmentSlots: inventoryState.equipmentSlots,
    },
    questState: {
      quests: questState.quests,
    },
  }), [playerState.coins, playerState.config, inventoryState.inventory, inventoryState.equipmentSlots, questState.quests]);

  const hydrateSave = useCallback((data: GameSaveData) => {
    playerState.setCoins(data.playerState.coins);
    playerState.setConfig(data.playerState.config);
    inventoryState.setInventory(data.inventoryState.inventory);
    inventoryState.setEquipmentSlots(data.inventoryState.equipmentSlots);
    if (data.questState?.quests) {
      questState.setQuests(data.questState.quests);
    }
  }, [playerState, inventoryState, questState]);

  const manualSave = useCallback(async () => {
    if (!isSupabaseEnabled || !user) return;
    try {
      await saveGame(SAVE_SLOT, buildSaveData());
      setHasSavedCharacter(true);
      hasSavedCharacterRef.current = true;
      uiState.setNotification('Game saved.');
    } catch (err) {
      console.error('[save] manualSave failed:', err);
      uiState.setNotification('Save failed. Check your connection.');
      throw err;
    }
  }, [user, buildSaveData, uiState]);

  const scheduleAutosave = useCallback(() => {
    if (!isSupabaseEnabled || !user || !isSaveLoadedRef.current || !hasSavedCharacterRef.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      try {
        await saveGame(SAVE_SLOT, buildSaveData());
      } catch (err) {
        console.error('[save] autosave failed:', err);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [user, buildSaveData]);

  // Load save when user logs in (or on first mount if already logged in)
  useEffect(() => {
    if (!isSupabaseEnabled || isAuthLoading) return;
    if (!user) {
      setIsSaveLoaded(false);
      setHasSavedCharacter(false);
      isSaveLoadedRef.current = false;
      hasSavedCharacterRef.current = false;
      return;
    }

    loadGameSave(SAVE_SLOT).then((row) => {
      if (row?.save_data) {
        hydrateSave(row.save_data);
      }
      const userHasCharacter = !!row?.save_data?.playerState?.config;
      setHasSavedCharacter(userHasCharacter);
      hasSavedCharacterRef.current = userHasCharacter;
      setIsSaveLoaded(true);
      isSaveLoadedRef.current = true;
    }).catch((err) => {
      console.error('[save] loadGameSave failed:', err);
      setHasSavedCharacter(false);
      hasSavedCharacterRef.current = false;
      setIsSaveLoaded(true);
      isSaveLoadedRef.current = true;
    });
  }, [user, isAuthLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave on meaningful state changes
  useEffect(() => {
    scheduleAutosave();
  }, [playerState.coins, playerState.config, inventoryState.inventory, inventoryState.equipmentSlots, questState.quests]); // eslint-disable-line react-hooks/exhaustive-deps

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
    gameInstance,
    user,
    isAuthLoading,
    isSaveLoaded,
    hasSavedCharacter,
    manualSave,
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
