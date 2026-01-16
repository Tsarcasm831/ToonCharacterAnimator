
import React, { useState, useEffect, useRef } from 'react';
import Scene from './components/Scene.tsx';
import { PlayerConfig, PlayerInput, DEFAULT_CONFIG, Quest, InventoryItem, QuestStatus } from './types.ts';
import { Header } from './components/ui/Header.tsx';
import { InteractionOverlay } from './components/ui/InteractionOverlay.tsx';
import { Hotbar } from './components/ui/Hotbar.tsx';
import { ControlPanel } from './components/ui/ControlPanel.tsx';
import { InventoryModal } from './components/ui/InventoryModal.tsx';
import { TradeModal } from './components/ui/TradeModal.tsx';
import { ForgeModal } from './components/ui/ForgeModal.tsx';
import { BuilderUI } from './components/ui/BuilderUI.tsx';
import { MobileControls } from './components/ui/MobileControls.tsx';
import { KeybindsModal } from './components/ui/KeybindsModal.tsx';
import { WorldMapModal } from './components/ui/WorldMapModal.tsx';
import { QuestLogModal } from './components/ui/QuestLogModal.tsx';
import { SpawnAnimalsModal } from './components/ui/SpawnAnimalsModal.tsx';
import { Compass } from './components/ui/Compass.tsx';
import { MainMenu } from './components/ui/MainMenu.tsx';
import LoadingScreen from './components/ui/LoadingScreen.tsx';
import { ModelExporter } from './game/ModelExporter.ts';
import { Game } from './game/Game.ts';
import { BuildType } from './game/builder/BuildingBlueprints.ts';
import * as THREE from 'three';

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
  
  // States for synchronization
  const [isEnvironmentBuilt, setIsEnvironmentBuilt] = useState(false);
  const [isVisualLoadingDone, setIsVisualLoadingDone] = useState(false);

  const [config, setConfig] = useState<PlayerConfig>(DEFAULT_CONFIG);
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
  const [activeStructure, setActiveStructure] = useState<BuildType>('foundation');
  const [currentBiome, setCurrentBiome] = useState({ name: 'Verdant Meadows', color: '#4ade80' });
  const [playerRotation, setPlayerRotation] = useState(0);
  const [isTravelOpen, setIsTravelOpen] = useState(false);
  const [activeScene, setActiveScene] = useState<'dev' | 'world'>('dev');
  const [notification, setNotification] = useState<string | null>(null);

  const [inventory, setInventory] = useState<(InventoryItem | null)[]>(() => {
    const inv = Array(32).fill(null);
    inv[1] = { name: 'Axe', count: 1 };
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
  
  const [equipmentSlots, setEquipmentSlots] = useState<Record<string, string | null>>({
      helm: null, mask: null, hood: null, shoulder: null, torso: null, legs: null, boots: null, mount: null, amulet: null, gloves: null, ring1: null, ring2: null, focus: null
  });

  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [isDeadUI, setIsDeadUI] = useState(false);
  const [interactionText, setInteractionText] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [coins, setCoins] = useState(1250);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isKeybindsOpen, setIsKeybindsOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [playerPosForMap, setPlayerPosForMap] = useState(new THREE.Vector3());
  
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [dialogue, setDialogue] = useState<string | null>(null);

  const gameInstance = useRef<Game | null>(null);

  // Sync effect: Move to READY only when environment is built AND visual runner finished
  useEffect(() => {
    if (gameState === 'LOADING' && isEnvironmentBuilt && isVisualLoadingDone) {
        // Final sanity check delay to let any last-millisecond GPU updates settle
        const t = setTimeout(() => {
            setGameState('READY');
        }, 300);
        return () => clearTimeout(t);
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
    }

    setQuests(prev => prev.map(q => q.id === questId ? { ...q, rewardClaimed: true } : q));
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

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); return false; };
    window.addEventListener('contextmenu', preventContextMenu, true);
    return () => window.removeEventListener('contextmenu', preventContextMenu, true);
  }, []);

  const handleExport = () => { if (gameInstance.current) ModelExporter.exportAndDownloadZip(gameInstance.current['player']); };
  const handleSpawnAnimal = (type: string, count: number) => { if (gameInstance.current) gameInstance.current.spawnAnimal(type, count); };

  useEffect(() => {
    const item = inventory[selectedSlot];
    setConfig(prev => ({ ...prev, selectedItem: item ? item.name : null }));
  }, [selectedSlot, inventory]);

  const triggerAction = (key: keyof PlayerInput) => {
    setManualInput(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setManualInput(prev => ({ ...prev, [key]: false })), 100);
  };

  const handleDeathToggle = () => { triggerAction('isDead'); setIsDeadUI(prev => !prev); };
  const handleInteractionUpdate = (text: string | null, prog: number | null) => { setInteractionText(text); setProgress(prog); };

  const toggleInventory = () => {
    if (isTradeOpen) setIsTradeOpen(false);
    if (isForgeOpen) setIsForgeOpen(false);
    setIsInventoryOpen(prev => !prev);
  };
  const toggleKeybinds = () => setIsKeybindsOpen(prev => !prev);
  const toggleQuestLog = () => setIsQuestLogOpen(prev => !prev);

  const handleToggleWorldMap = (pos: THREE.Vector3) => {
    if (activeScene === 'world') { setPlayerPosForMap(pos); setIsWorldMapOpen(prev => !prev); }
    else setIsWorldMapOpen(false);
  };

  const handleSelectStructure = (type: BuildType) => {
      setActiveStructure(type);
      if (gameInstance.current) gameInstance.current.setBuildingType(type);
  };

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

  const handleTravel = (scene: 'dev' | 'world') => {
      if (scene === activeScene) { setIsTravelOpen(false); return; }
      setIsEnvironmentBuilt(false);
      setIsVisualLoadingDone(false);
      setGameState('LOADING');
      setIsTravelOpen(false);
      setTimeout(() => setActiveScene(scene), 100);
  };

  const handleEnterWorld = () => {
      setIsEnvironmentBuilt(false);
      setIsVisualLoadingDone(false);
      setGameState('LOADING');
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

  const isHUDDisabled = isInventoryOpen || isTradeOpen || isForgeOpen || !!dialogue || isKeybindsOpen || isQuestLogOpen || isSpawnModalOpen || gameState !== 'PLAYING';

  return (
    <div className="w-screen h-screen relative bg-gray-900 overflow-hidden font-sans">
      
      {gameState !== 'MENU' && (
        <div className="absolute inset-0 z-0">
            <Scene 
            key={activeScene}
            activeScene={activeScene}
            config={config} 
            manualInput={manualInput} 
            initialInventory={inventory}
            onInventoryUpdate={setInventory} 
            onSlotSelect={setSelectedSlot} 
            onInteractionUpdate={handleInteractionUpdate}
            onGameReady={(g) => {
                gameInstance.current = g;
                g['inputManager'].onToggleInventory = toggleInventory;
                g['inputManager'].onToggleKeybinds = toggleKeybinds;
                g['inputManager'].onToggleQuestLog = toggleQuestLog;
                g.onBuilderToggle = (active) => setIsBuilderMode(active);
                g.onBiomeUpdate = (b) => setCurrentBiome(b);
                g.onDialogueTrigger = (content) => setDialogue(content);
                g.onTradeTrigger = () => setIsTradeOpen(true);
                g.onForgeTrigger = () => setIsForgeOpen(true);
                g.onRotationUpdate = (r) => setPlayerRotation(r);
            }}
            onEnvironmentReady={handleEnvironmentReady}
            onToggleWorldMap={handleToggleWorldMap}
            onToggleQuestLog={toggleQuestLog}
            controlsDisabled={isHUDDisabled}
            />
        </div>
      )}

      {gameState === 'MENU' && <MainMenu onStart={handleEnterWorld} />}

      <LoadingScreen 
        isVisible={gameState === 'LOADING'} 
        isSystemReady={isEnvironmentBuilt}
        onFinished={handleVisualLoadingFinished}
      />

      {gameState === 'READY' && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md cursor-pointer animate-fade-in"
            onClick={handleStartPlaying}
        >
             <div className="text-center animate-pulse group">
                <div className="mb-6 inline-block p-4 rounded-full bg-blue-600/20 border border-blue-500/50 group-hover:bg-blue-600/40 transition-all duration-300">
                    <svg className="w-12 h-12 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-[0.2em] drop-shadow-[0_0_25px_rgba(37,99,235,0.8)] group-hover:scale-105 transition-transform duration-300">
                    Click to Start
                </h1>
                <p className="text-slate-300 text-sm md:text-base font-bold uppercase tracking-[0.4em] mt-6 opacity-60">
                    Your adventure awaits
                </p>
             </div>
        </div>
      )}

      {notification && gameState === 'PLAYING' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down">
          <div className="bg-blue-600 border-2 border-white/20 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
             <span className="text-white text-lg">📜</span>
             <span className="text-white font-black uppercase tracking-widest text-[10px] whitespace-nowrap">{notification}</span>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <>
            {!isInventoryOpen && !isTradeOpen && !isForgeOpen && !isBuilderMode && !isQuestLogOpen && <Header biome={currentBiome} />}
            {!isInventoryOpen && !isTradeOpen && !isForgeOpen && !isBuilderMode && !isQuestLogOpen && <Compass rotation={playerRotation} />}

            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[50]">
                <div className="relative">
                    <button 
                        onClick={() => setIsTravelOpen(!isTravelOpen)}
                        className="px-6 py-2 bg-black/40 backdrop-blur-md border-2 border-white/20 rounded-full text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600/80 hover:border-blue-400 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Travel
                        <svg className={`w-3 h-3 transition-transform ${isTravelOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {isTravelOpen && (
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 animate-fade-in-down">
                            <button onClick={() => handleTravel('dev')} className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${activeScene === 'dev' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}>Dev Scene{activeScene === 'dev' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}</button>
                            <button onClick={() => handleTravel('world')} className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${activeScene === 'world' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}>World Scene{activeScene === 'world' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}</button>
                        </div>
                    )}
                </div>
            </div>

            <InteractionOverlay text={interactionText} progress={progress} />
            {!isInventoryOpen && !isTradeOpen && !isForgeOpen && !isBuilderMode && !isQuestLogOpen && <Hotbar inventory={inventory} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />}
            {isBuilderMode && !isInventoryOpen && !isTradeOpen && !isForgeOpen && <BuilderUI activeType={activeStructure} onSelectType={handleSelectStructure} />}
            {!isInventoryOpen && !isTradeOpen && !isForgeOpen && !isBuilderMode && !isQuestLogOpen && <ControlPanel config={config} manualInput={manualInput} isDeadUI={isDeadUI} setConfig={setConfig} setManualInput={setManualInput} handleDeathToggle={handleDeathToggle} triggerAction={triggerAction} onExport={handleExport} onSpawnAnimals={() => setIsSpawnModalOpen(true)} />}
            {!isInventoryOpen && !isTradeOpen && !isForgeOpen && !isQuestLogOpen && <MobileControls game={gameInstance.current} />}
            <InventoryModal isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} config={config} inventory={inventory} equipmentSlots={equipmentSlots} onEquip={setSelectedSlot} onInventoryChange={setInventory} onEquipItem={handleEquipItem} onUnequipItem={handleUnequipItem} coins={coins} />
            <TradeModal isOpen={isTradeOpen} onClose={() => { setIsTradeOpen(false); if(gameInstance.current) gameInstance.current['player'].isTalking = false; }} inventory={inventory} coins={coins} onBuy={handleBuy} onSell={handleSell} />
            <ForgeModal isOpen={isForgeOpen} onClose={() => setIsForgeOpen(false)} inventory={inventory} onInventoryChange={setInventory} />
            <KeybindsModal isOpen={isKeybindsOpen} onClose={() => setIsKeybindsOpen(false)} />
            <WorldMapModal isOpen={isWorldMapOpen} onClose={() => setIsWorldMapOpen(false)} playerPos={playerPosForMap} />
            <QuestLogModal isOpen={isQuestLogOpen} onClose={() => setIsQuestLogOpen(false)} quests={quests} onClaimReward={claimQuestReward} />
            <SpawnAnimalsModal isOpen={isSpawnModalOpen} onClose={() => setIsSpawnModalOpen(false)} onSpawn={handleSpawnAnimal} />
        </>
      )}

      {dialogue && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xl px-4 animate-fade-in-up">
              <div className="bg-black/80 backdrop-blur-md border-2 border-white/20 rounded-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-start mb-4"><h3 className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs">Guard</h3></div>
                  <p className="text-white text-lg font-medium leading-relaxed mb-6 italic">"{dialogue}"</p>
                  <div className="flex justify-end"><button onClick={closeDialogue} className="px-6 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-blue-400 hover:text-white transition-all shadow-lg active:scale-95">Close</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
