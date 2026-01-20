import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, PageType } from './components/ui/Navigation';
import { HomeView, UnitsView, MissionView, MusicView } from './components/ui/PageViews';
import { EntityStats, PlayerConfig, PlayerInput, DEFAULT_CONFIG, Quest, InventoryItem, QuestStatus } from './types';
import { CombatLogEntry } from './components/ui/CombatLog';
import { ModelExporter } from './game/core/ModelExporter';
import { Game } from './game/core/Game';
import { StructureType } from './game/builder/BuildingParts';
import { CLASS_STATS } from './data/stats';
import * as THREE from 'three';

import { GameScreen } from './components/ui/GameScreen';
import { GlobalModals } from './components/ui/GlobalModals';
import { LandMapModal } from './components/ui/LandMapModal';

const INITIAL_QUESTS: Quest[] = [
  {
    id: '1',
    title: 'Lumberjack\'s Task',
    description: 'The Timber Wharf is running low on supplies. Head out into the meadows and collect 100 pieces of wood for the local craftsmen.',
    status: 'active',
    objectives: [
      { label: 'Collect Wood', current: 0, target: 100 }
    ],
    reward: '100 Gold Coins & 100 Wood',
    rewardClaimed: false
  }
];

const COAL_QUEST: Quest = {
  id: '2',
  title: 'Coal Story Bro',
  description: 'Now that you have plenty of wood, it\'s time to refine it. Use the Blacksmith\'s forge to smelt your wood into coal. We need a steady supply for the upcoming winter.',
  status: 'active',
  objectives: [
    { label: 'Create Coal', current: 0, target: 50 }
  ],
  reward: '500 Gold Coins & Steel Axe',
  rewardClaimed: false
};

type GameState = 'MENU' | 'LOADING' | 'READY' | 'PLAYING';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [activePage, setActivePage] = useState<PageType>('home');
  
  // States for synchronization
  const [isEnvironmentBuilt, setIsEnvironmentBuilt] = useState(false);
  const [isVisualLoadingDone, setIsVisualLoadingDone] = useState(false);

  const [config, setConfig] = useState<PlayerConfig>({
      ...DEFAULT_CONFIG,
      stats: { ...CLASS_STATS.hero }
  });
  const [manualInput, setManualInput] = useState<Partial<PlayerInput>>({
    isRunning: false,
    jump: false,
    isDead: false,
    isPickingUp: false,
    interact: false,
    attack1: false,
    attack2: false
  });
  
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [activeStructure, setActiveStructure] = useState<StructureType>('foundation');
  const [currentBiome, setCurrentBiome] = useState({ name: 'Verdant Meadows', color: '#4ade80' });
  const [playerRotation, setPlayerRotation] = useState(0);
  const [isTravelOpen, setIsTravelOpen] = useState(false);
  const [activeScene, setActiveScene] = useState<'dev' | 'land' | 'combat'>('dev');
  const [notification, setNotification] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);

  const [interactionText, setInteractionText] = useState<string | null>(null);
  const [interactionProgress, setInteractionProgress] = useState<number | null>(null);
  const [coins, setCoins] = useState(1250);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [statsForModal, setStatsForModal] = useState<EntityStats | null>(null);
  const [statsUnitName, setStatsUnitName] = useState<string>('Hero');
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isShopkeeperChatOpen, setIsShopkeeperChatOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isKeybindsOpen, setIsKeybindsOpen] = useState(false);
  const [isLandMapOpen, setIsLandMapOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [isEnemiesModalOpen, setIsEnemiesModalOpen] = useState(false);
  const [isCharacterStatsOpen, setIsCharacterStatsOpen] = useState(false);
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [selectedUnitStats, setSelectedUnitStats] = useState<EntityStats | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [playerPosForMap, setPlayerPosForMap] = useState(new THREE.Vector3());
  const gameInstance = useRef<Game | null>(null);

  const [inventory, setInventory] = useState<(InventoryItem | null)[]>(() => {
    const inv = Array(32).fill(null);
    inv[1] = { name: 'Axe', count: 1 };
    inv[2] = { name: 'Staff', count: 1 };
    inv[4] = { name: 'Knife', count: 1 };
    inv[5] = { name: 'Fishing Pole', count: 1 };
    inv[8] = { name: 'Shirt', count: 1 };
    inv[9] = { name: 'Pants', count: 1 };
    inv[10] = { name: 'Shoes', count: 1 };
    inv[11] = { name: 'Mask', count: 1 };
    inv[12] = { name: 'Hood', count: 1 };
    inv[13] = { name: 'Quilted Armor', count: 1 };
    inv[14] = { name: 'Leather Armor', count: 1 };
    inv[15] = { name: 'Heavy Leather Armor', count: 1 };
    inv[16] = { name: 'RingMail', count: 1 };
    inv[17] = { name: 'Plate Mail', count: 1 };
    inv[19] = { name: 'Sword', count: 1 };
    inv[20] = { name: 'Pickaxe', count: 1 };
    inv[21] = { name: 'Halberd', count: 1 };
    inv[22] = { name: 'Bow', count: 1 }; 
    return inv;
  });

  const [bench, setBench] = useState<(InventoryItem | null)[]>(Array(13).fill(null));
  
  const [equipmentSlots, setEquipmentSlots] = useState<Record<string, string | null>>({
      helm: null, mask: null, hood: null, shoulder: null, torso: null, legs: null, boots: null, mount: null, amulet: null, gloves: null, ring1: null, ring2: null, focus: null
  });

  const [isDeadUI, setIsDeadUI] = useState(false);

  const toggleInventory = () => {
    if (isTradeOpen) setIsTradeOpen(false);
    if (isForgeOpen) setIsForgeOpen(false);
    setIsInventoryOpen(prev => !prev);
  };
  const toggleKeybinds = () => setIsKeybindsOpen(prev => !prev);
  const toggleQuestLog = () => setIsQuestLogOpen(prev => !prev);

  const handleSelectStructure = (type: StructureType) => {
    setActiveStructure(type);
    if (gameInstance.current) gameInstance.current.setBuildingType(type);
  };

  const handleTrade = (items: (InventoryItem | null)[], totalCost: number) => {
    setInventory(items);
    setCoins(prev => prev - totalCost);
  };

  const handleClaimReward = (questId: string) => {
    claimQuestReward(questId);
  };

  const addCombatLog = useCallback((text: string, type: CombatLogEntry['type'] = 'info') => {
      setCombatLog(prev => [
          ...prev.slice(-20),
          { id: Math.random().toString(36).substr(2, 9), text, type, timestamp: Date.now() }
      ]);
  }, []);

  const handleInteractionUpdate = (text: string | null, prog: number | null) => { 
    setInteractionText(text); 
    setInteractionProgress(prog); 
  };

  const handleEnvironmentReady = () => {
    setIsEnvironmentBuilt(true);
  };

  const handleVisualLoadingFinished = () => {
    setIsVisualLoadingDone(true);
  };

  const handleStartPlaying = () => {
    setGameState('PLAYING');
  };

  const handleExport = () => { 
    if (gameInstance.current && gameInstance.current.player) {
      ModelExporter.exportAndDownloadZip(gameInstance.current.player.mesh);
    }
  };

  const handleEnterWorld = (startInCombat: boolean = false) => {
    setIsEnvironmentBuilt(false);
    setIsVisualLoadingDone(false);
    setIsCombatActive(false);
    setGameState('LOADING');
    if (startInCombat) {
      setActiveScene('combat');
    }
    // Spawn a spider for testing
    setTimeout(() => {
      if (gameInstance.current) {
        const player = gameInstance.current.player;
        if (!player) return;
        
        const playerPos = player.position;
        if (!playerPos) return;
        
        const spawnPos = playerPos.clone().add(new THREE.Vector3(5, 0, 5));
        
        if (!gameInstance.current.entityManager) return;
        
        gameInstance.current.entityManager.spawnAnimalGroup('spider', 1, gameInstance.current.environment, spawnPos);
      }
    }, 2000);
  };

  useEffect(() => {
    if (gameState === 'LOADING' && isEnvironmentBuilt && isVisualLoadingDone) {
        // We stay in LOADING state until LoadingScreen component signals completion
        // The signal comes via onLoadingFinished which calls handleStartPlaying ('PLAYING')
        // Removing the intermediate 'READY' transition that was potentially blocking
    }
  }, [gameState, isEnvironmentBuilt, isVisualLoadingDone]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const claimQuestReward = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.status !== 'completed' || quest.rewardClaimed) return;

    if (questId === '1') {
      setCoins(c => c + 100);
      const nextInv = [...inventory];
      let added = false;
      for (let i = 0; i < nextInv.length; i++) {
        if (nextInv[i]?.name === 'Wood') {
          nextInv[i]!.count += 100;
          added = true;
          break;
        }
      }
      if (!added) {
        const emptyIdx = nextInv.findIndex(s => s === null);
        if (emptyIdx !== -1) nextInv[emptyIdx] = { name: 'Wood', count: 100 };
      }
      setInventory(nextInv);
      setNotification(`Claimed rewards for ${quest.title}!`);
      setQuests(prev => [...prev.map(q => q.id === questId ? { ...q, rewardClaimed: true } : q), COAL_QUEST]);
      return;
    }

    if (questId === '2') {
        setCoins(c => c + 500);
        const nextInv = [...inventory];
        const emptyIdx = nextInv.findIndex(s => s === null);
        if (emptyIdx !== -1) nextInv[emptyIdx] = { name: 'Steel Axe', count: 1 };
        setInventory(nextInv);
        setNotification(`Claimed rewards for ${quest.title}! (+500 Gold, +Steel Axe)`);
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, rewardClaimed: true } : q));
    }
  };

  useEffect(() => {
    const totalWood = inventory.reduce((sum, item) => item?.name === 'Wood' ? sum + item.count : sum, 0);
    const totalCoal = inventory.reduce((sum, item) => item?.name === 'Coal' ? sum + item.count : sum, 0);

    setQuests(prev => prev.map(q => {
        if (q.id === '1' && q.status === 'active') {
            const woodObj = q.objectives.find(o => o.label === 'Collect Wood');
            if (!woodObj) return q;
            const newObjectives = q.objectives.map(obj => obj.label === 'Collect Wood' ? { ...obj, current: totalWood } : obj);
            const isDone = newObjectives.every(o => o.current >= o.target);
            if (isDone) {
                setNotification(`Quest Completed: ${q.title}! (Open Log to Claim)`);
                return { ...q, objectives: newObjectives, status: 'completed' as QuestStatus };
            }
            if (woodObj.current !== totalWood) return { ...q, objectives: newObjectives };
        }
        if (q.id === '2' && q.status === 'active') {
            const coalObj = q.objectives.find(o => o.label === 'Create Coal');
            if (!coalObj) return q;
            const newObjectives = q.objectives.map(obj => obj.label === 'Create Coal' ? { ...obj, current: totalCoal } : obj);
            const isDone = newObjectives.every(o => o.current >= o.target);
            if (isDone) {
                setNotification(`Quest Completed: ${q.title}! (Open Log to Claim)`);
                return { ...q, objectives: newObjectives, status: 'completed' as QuestStatus };
            }
            if (coalObj.current !== totalCoal) return { ...q, objectives: newObjectives };
        }
        return q;
    }));
  }, [inventory]);

  const handleSpawnAnimal = (type: string, count: number) => { 
    if (gameInstance.current) {
        const playerPos = gameInstance.current.player.position;
        const spawnPos = playerPos.clone().add(new THREE.Vector3(2, 0, 2));
        gameInstance.current.entityManager.spawnAnimalGroup(type, count, gameInstance.current.environment, spawnPos);
    }
  };

  useEffect(() => {
    const item = inventory[selectedSlot];
    setConfig(prev => ({ ...prev, selectedItem: item ? item.name : null }));
  }, [selectedSlot, inventory]);

  const triggerAction = (key: keyof PlayerInput) => {
    setManualInput(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setManualInput(prev => ({ ...prev, [key]: false })), 100);
  };

  const handleDeathToggle = () => { triggerAction('isDead'); setIsDeadUI(prev => !prev); };

  const handleEquipItem = (item: string, slotId: string) => {
      const existing = equipmentSlots[slotId];
      let newInv = [...inventory];
      if (existing) {
          const emptyIdx = newInv.findIndex(s => s === null);
          if (emptyIdx !== -1) newInv[emptyIdx] = { name: existing, count: 1 };
      }
      setEquipmentSlots(prev => ({ ...prev, [slotId]: item }));
      setConfig(prev => {
          const next = { ...prev };
          const eq = { ...prev.equipment };
          if (slotId === 'torso') {
              eq.shirt = true;
              eq.quiltedArmor = (item === 'Quilted Armor');
              eq.leatherArmor = (item === 'Leather Armor');
              eq.heavyLeatherArmor = (item === 'Heavy Leather Armor');
              eq.ringMail = (item === 'RingMail');
              eq.plateMail = (item === 'Plate Mail');
          }
          if (slotId === 'legs') eq.pants = true;
          if (slotId === 'boots') eq.shoes = true;
          if (slotId === 'helm') eq.helm = true;
          if (slotId === 'mask') eq.mask = true;
          if (slotId === 'hood') eq.hood = true;
          if (slotId === 'shoulder') eq.shoulders = true;
          next.equipment = eq;
          return next;
      });
  };

  const handleUnequipItem = (slotId: string) => {
      const item = equipmentSlots[slotId];
      if (!item) return;
      const newInv = [...inventory];
      const emptyIdx = newInv.findIndex(s => s === null);
      if (emptyIdx !== -1) {
          newInv[emptyIdx] = { name: item, count: 1 };
          setInventory(newInv);
          setEquipmentSlots(prev => ({ ...prev, [slotId]: null }));
          setConfig(prev => {
              const next = { ...prev };
              const eq = { ...prev.equipment };
              if (slotId === 'torso') {
                  eq.shirt = false;
                  eq.quiltedArmor = false;
                  eq.leatherArmor = false;
                  eq.heavyLeatherArmor = false;
                  eq.ringMail = false;
                  eq.plateMail = false;
              }
              if (slotId === 'legs') eq.pants = false;
              if (slotId === 'boots') eq.shoes = false;
              if (slotId === 'helm') eq.helm = false;
              if (slotId === 'mask') eq.mask = false;
              if (slotId === 'hood') eq.hood = false;
              if (slotId === 'shoulder') eq.shoulders = false;
              next.equipment = eq;
              return next;
          });
      }
  };

  const handleBuy = (item: string, price: number) => {
    if (coins < price) return;
    const newInv = [...inventory];
    let found = false;
    for (let i = 0; i < newInv.length; i++) {
        const slot = newInv[i];
        if (slot && slot.name === item) { slot.count++; found = true; break; }
    }
    if (!found) {
        const emptyIdx = newInv.findIndex(s => s === null);
        if (emptyIdx === -1) { alert("Inventory Full!"); return; }
        newInv[emptyIdx] = { name: item, count: 1 };
    }
    setCoins(prev => prev - price);
    setInventory(newInv);
  };

  const handleSell = (index: number, price: number) => {
    const item = inventory[index];
    if (!item) return;
    setCoins(prev => prev + (price * item.count));
    const newInv = [...inventory];
    newInv[index] = null;
    setInventory(newInv);
  };

  const closeDialogue = () => {
    setDialogue(null);
    if (gameInstance.current) gameInstance.current['player'].isTalking = false;
  };

  const handleTravel = (scene: 'dev' | 'land' | 'combat') => {
      if (scene === activeScene) { setIsTravelOpen(false); return; }
      setIsEnvironmentBuilt(false);
      setIsVisualLoadingDone(false);
      setIsCombatActive(false);
      setGameState('LOADING');
      setIsTravelOpen(false);
      setCombatLog([]); // Clear log on transition
      setTimeout(() => setActiveScene(scene), 100);
  };

  const isHUDDisabled = isInventoryOpen || isTradeOpen || isShopkeeperChatOpen || isForgeOpen || !!dialogue || isKeybindsOpen || isQuestLogOpen || isSpawnModalOpen || isEnemiesModalOpen || isCharacterStatsOpen || isLandMapOpen || gameState !== 'PLAYING';

  return (
    <div className="w-screen h-screen relative bg-slate-950 overflow-hidden font-sans text-slate-50">
      <div className="absolute inset-0 z-0">
        {activePage === 'home' && <HomeView />}
        {activePage === 'units' && <UnitsView />}
        {activePage === 'mission' && <MissionView quests={quests} config={config} />}
        {activePage === 'music' && <MusicView />}
        
        {activePage === 'game' && (
          <GameScreen 
            gameState={gameState}
            setGameState={setGameState}
            onStart={handleEnterWorld}
            onShowEnemies={() => setIsEnemiesModalOpen(true)}
            activeScene={activeScene}
            config={config}
            manualInput={manualInput}
            bench={bench}
            inventory={inventory}
            gameInstance={gameInstance}
            game={gameInstance.current}
            isCombatActive={isCombatActive}
            showGrid={showGrid}
            combatLog={combatLog}
            dialogue={dialogue}
            currentBiome={currentBiome}
            playerRotation={playerRotation}
            selectedSlot={selectedSlot}
            interactionText={interactionText}
            interactionProgress={interactionProgress}
            isHUDDisabled={isHUDDisabled}
            isBuilderMode={isBuilderMode}
            activeStructure={activeStructure}
            isDeadUI={isDeadUI}
            onGameReady={(g) => {
                gameInstance.current = g;
                g['inputManager'].onToggleInventory = toggleInventory;
                g['inputManager'].onToggleKeybinds = toggleKeybinds;
                g['inputManager'].onToggleQuestLog = toggleQuestLog;
                g.onBuilderToggle = (active) => setIsBuilderMode(active);
                g.onBiomeUpdate = (b) => setCurrentBiome(b);
                g.onDialogueTrigger = (content) => setDialogue(content);
                g.onTradeTrigger = () => setIsTradeOpen(true);
                g.onShopkeeperTrigger = () => setIsShopkeeperChatOpen(true);
                g.onForgeTrigger = () => setIsForgeOpen(true);
                g.onRotationUpdate = (r) => setPlayerRotation(r);
                g.onShowCharacterStats = (stats, name) => {
                    if (stats) setStatsForModal(stats);
                    else setStatsForModal(config.stats);
                    if (name) setStatsUnitName(name);
                    setIsCharacterStatsOpen(true);
                };
                g.onUnitSelect = (stats, unit) => {
                    if (stats) setSelectedUnitStats(stats);
                    else setSelectedUnitStats(config.stats);
                    setSelectedUnit(unit);
                };
                g.onAttackHit = (type, count) => {
                    addCombatLog(`${type.charAt(0).toUpperCase() + type.slice(1)} struck for damage!`, 'damage');
                };
            }}
            onEnvironmentReady={handleEnvironmentReady}
            onInteractionUpdate={handleInteractionUpdate}
            onToggleQuestLog={toggleQuestLog}
            setPlayerRotation={setPlayerRotation}
            addCombatLog={addCombatLog}
            setIsCombatActive={setIsCombatActive}
            setShowGrid={setShowGrid}
            setInventory={setInventory}
            setSelectedSlot={setSelectedSlot}
            setPlayerPosForMap={setPlayerPosForMap}
            setIsTravelOpen={setIsTravelOpen}
            setIsLandMapOpen={setIsLandMapOpen}
            onCloseDialogue={closeDialogue}
            onSelectStructure={handleSelectStructure}
            onExport={handleExport}
            onSpawnAnimals={() => setIsSpawnModalOpen(true)}
            setConfig={setConfig}
            setManualInput={setManualInput}
            handleDeathToggle={handleDeathToggle}
            triggerAction={triggerAction}
            isSystemReady={isEnvironmentBuilt && isVisualLoadingDone}
            onLoadingFinished={handleStartPlaying}
            onVisualLoadingFinished={handleVisualLoadingFinished}
          />
        )}
      </div>

      <Navigation activePage={activePage} onPageChange={setActivePage} />

      <GlobalModals
        isInventoryOpen={isInventoryOpen}
        toggleInventory={toggleInventory}
        inventory={inventory}
        setInventory={setInventory}
        equipmentSlots={equipmentSlots}
        handleEquipItem={handleEquipItem}
        handleUnequipItem={handleUnequipItem}
        coins={coins}
        stats={config.stats}
        bodyType={config.bodyType}
        isTradeOpen={isTradeOpen}
        setIsTradeOpen={setIsTradeOpen}
        onBuy={handleBuy}
        onSell={handleSell}
        isShopkeeperChatOpen={isShopkeeperChatOpen}
        setIsShopkeeperChatOpen={setIsShopkeeperChatOpen}
        isForgeOpen={isForgeOpen}
        setIsForgeOpen={setIsForgeOpen}
        isKeybindsOpen={isKeybindsOpen}
        toggleKeybinds={toggleKeybinds}
        isQuestLogOpen={isQuestLogOpen}
        toggleQuestLog={toggleQuestLog}
        quests={quests}
        handleClaimReward={handleClaimReward}
        isTravelOpen={isTravelOpen}
        setIsTravelOpen={setIsTravelOpen}
        activeScene={activeScene}
        handleTravel={handleTravel}
        isSpawnModalOpen={isSpawnModalOpen}
        setIsSpawnModalOpen={setIsSpawnModalOpen}
        handleSpawnAnimal={handleSpawnAnimal}
        isEnemiesModalOpen={isEnemiesModalOpen}
        setIsEnemiesModalOpen={setIsEnemiesModalOpen}
        isCharacterStatsOpen={isCharacterStatsOpen}
        setIsCharacterStatsOpen={setIsCharacterStatsOpen}
        statsForModal={statsForModal}
        statsUnitName={statsUnitName}
      />

      <LandMapModal 
        isOpen={isLandMapOpen}
        onClose={() => setIsLandMapOpen(false)}
        playerPos={playerPosForMap}
      />

      {notification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
              <div className="bg-blue-600 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl border border-blue-400/50">
                  {notification}
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
