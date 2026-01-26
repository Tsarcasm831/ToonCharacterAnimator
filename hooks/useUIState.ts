import { useState } from 'react';
import { EntityStats } from '../types';

export function useUIState() {
  const [notification, setNotification] = useState<string | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isShopkeeperChatOpen, setIsShopkeeperChatOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isKeybindsOpen, setIsKeybindsOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isLandMapOpen, setIsLandMapOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [isAreaMapOpen, setIsAreaMapOpen] = useState(false);
  const [isLandSelectionOpen, setIsLandSelectionOpen] = useState(false);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [isEnemiesModalOpen, setIsEnemiesModalOpen] = useState(false);
  const [isCharacterStatsOpen, setIsCharacterStatsOpen] = useState(false);
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [statsForModal, setStatsForModal] = useState<EntityStats | null>(null);
  const [statsUnitName, setStatsUnitName] = useState<string>('Hero');
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [selectedUnitStats, setSelectedUnitStats] = useState<EntityStats | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [interactionText, setInteractionText] = useState<string | null>(null);
  const [interactionProgress, setInteractionProgress] = useState<number | null>(null);
  const [isTravelOpen, setIsTravelOpen] = useState(false);
  const [isDeadUI, setIsDeadUI] = useState(false);
  
  const [builderLogs, setBuilderLogs] = useState<{ id: string, message: string, timestamp: number }[]>([]);
  const [isBuilderLogOpen, setIsBuilderLogOpen] = useState(false);

  const addBuilderLog = (message: string) => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now()
    };
    setBuilderLogs(prev => [newLog, ...prev]);
  };

  const clearBuilderLogs = () => setBuilderLogs([]);
  const toggleBuilderLog = () => setIsBuilderLogOpen(prev => !prev);

  const toggleInventory = () => {
    if (isTradeOpen) setIsTradeOpen(false);
    if (isForgeOpen) setIsForgeOpen(false);
    setIsInventoryOpen(prev => !prev);
  };

  const toggleKeybinds = () => setIsKeybindsOpen(prev => !prev);
  const toggleQuestLog = () => setIsQuestLogOpen(prev => !prev);

  return {
    notification, setNotification,
    isInventoryOpen, setIsInventoryOpen, toggleInventory,
    isTradeOpen, setIsTradeOpen,
    isShopkeeperChatOpen, setIsShopkeeperChatOpen,
    isForgeOpen, setIsForgeOpen,
    isKeybindsOpen, setIsKeybindsOpen, toggleKeybinds,
    isQuestLogOpen, setIsQuestLogOpen, toggleQuestLog,
    isLandMapOpen, setIsLandMapOpen,
    isWorldMapOpen, setIsWorldMapOpen,
    isAreaMapOpen, setIsAreaMapOpen,
    isLandSelectionOpen, setIsLandSelectionOpen,
    isSpawnModalOpen, setIsSpawnModalOpen,
    isEnemiesModalOpen, setIsEnemiesModalOpen,
    isCharacterStatsOpen, setIsCharacterStatsOpen,
    isTravelOpen, setIsTravelOpen,
    dialogue, setDialogue,
    statsForModal, setStatsForModal,
    statsUnitName, setStatsUnitName,
    selectedSlot, setSelectedSlot,
    selectedUnitStats, setSelectedUnitStats,
    selectedUnit, setSelectedUnit,
    interactionText, setInteractionText,
    interactionProgress, setInteractionProgress,
    isDeadUI, setIsDeadUI,
    builderLogs, addBuilderLog, clearBuilderLogs,
    isBuilderLogOpen, setIsBuilderLogOpen, toggleBuilderLog
  };
}
