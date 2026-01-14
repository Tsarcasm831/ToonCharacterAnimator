
import React, { useState, useEffect, useRef } from 'react';
import Scene from './components/Scene.tsx';
import { PlayerConfig, PlayerInput, DEFAULT_CONFIG, Quest, InventoryItem } from './types.ts';
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
import LoadingScreen from './components/ui/LoadingScreen.tsx';
import { ModelExporter } from './game/ModelExporter.ts';
import { Game } from './game/Game.ts';
import { StructureType } from './game/builder/BuildingParts.ts';
import * as THREE from 'three';

const INITIAL_QUESTS: Quest[] = [
  {
    id: '1',
    title: 'Timber Wharf Guard\'s Request',
    description: 'The city guard is looking for help clearing out some of the local wildlife that has been harassing travelers near the Timber Wharf.',
    status: 'active',
    objectives: [
      { label: 'Wolves defeated', current: 0, target: 5 },
      { label: 'Collect Thick Fur', current: 0, target: 3 }
    ],
    reward: '500 Gold Coins & Steel Dagger'
  },
  {
    id: '2',
    title: 'The Wandering Yeti',
    description: 'Legends speak of a passive Yeti wandering the Frostfell Peaks. Track it down and see if you can observe its behavior without scaring it away.',
    status: 'active',
    objectives: [
      { label: 'Find the Yeti', current: 0, target: 1 }
    ],
    reward: 'Yeti Fur Boots & 1200 XP'
  }
];

const App: React.FC = () => {
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
  const [activeStructure, setActiveStructure] = useState<StructureType>('foundation');
  const [currentBiome, setCurrentBiome] = useState({ name: 'Verdant Meadows', color: '#4ade80' });
  const [playerRotation, setPlayerRotation] = useState(0);
  const [isTravelOpen, setIsTravelOpen] = useState(false);
  const [activeScene, setActiveScene] = useState<'dev' | 'world'>('dev');
  const [isLoading, setIsLoading] = useState(false);

  const [inventory, setInventory] = useState<(InventoryItem | null)[]>(() => {
    const inv = Array(32).fill(null);
    inv[2] = { name: 'Bow', count: 1 };
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
    inv[18] = { name: 'Axe', count: 1 };
    inv[19] = { name: 'Sword', count: 1 };
    inv[20] = { name: 'Pickaxe', count: 1 };
    inv[21] = { name: 'Halberd', count: 1 };

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

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
    window.addEventListener('contextmenu', preventContextMenu, true);
    return () => window.removeEventListener('contextmenu', preventContextMenu, true);
  }, []);

  const handleExport = () => {
      if (gameInstance.current) ModelExporter.exportAndDownloadZip(gameInstance.current['player']);
  };

  const handleSpawnAnimal = (type: string, count: number) => {
    if (gameInstance.current) {
        gameInstance.current.spawnAnimal(type, count);
    }
  };

  useEffect(() => {
    const item = inventory[selectedSlot];
    const itemName = item ? item.name : null;
    setConfig(prev => ({ ...prev, selectedItem: itemName }));
  }, [selectedSlot, inventory]);

  const triggerAction = (key: keyof PlayerInput) => {
    setManualInput(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
        setManualInput(prev => ({ ...prev, [key]: false }));
    }, 100);
  };

  const handleDeathToggle = () => {
      triggerAction('isDead');
      setIsDeadUI(prev => !prev);
  };

  const handleInteractionUpdate = (text: string | null, prog: number | null) => {
      setInteractionText(text);
      setProgress(prog);
  };

  const toggleInventory = () => {
    if (isTradeOpen) setIsTradeOpen(false);
    if (isForgeOpen) setIsForgeOpen(false);
    setIsInventoryOpen(prev => !prev);
  };
  const toggleKeybinds = () => setIsKeybindsOpen(prev => !prev);
  const toggleQuestLog = () => setIsQuestLogOpen(prev => !prev);

  const handleToggleWorldMap = (pos: THREE.Vector3) => {
    if (activeScene === 'world') {
      setPlayerPosForMap(pos);
      setIsWorldMapOpen(prev => !prev);
    } else {
      setIsWorldMapOpen(false);
    }
  };

  const handleSelectStructure = (type: StructureType) => {
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
    
    // Check for stack
    let found = false;
    for (let i = 0; i < newInv.length; i++) {
        const slot = newInv[i];
        if (slot && slot.name === item) {
            slot.count++;
            found = true;
            break;
        }
    }
    
    if (!found) {
        const emptyIdx = newInv.findIndex(s => s === null);
        if (emptyIdx === -1) {
            alert("Inventory Full!");
            return;
        }
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
    if (gameInstance.current) {
      gameInstance.current['player'].isTalking = false;
    }
  };

  const handleTravel = (scene: 'dev' | 'world') => {
      if (scene === activeScene) {
          setIsTravelOpen(false);
          return;
      }
      setIsLoading(true);
      setIsTravelOpen(false);
      setTimeout(() => {
          setActiveScene(scene);
      }, 500);
  };

  return (
    <div className="w-screen h-screen relative bg-gray-900 overflow-hidden font-sans">
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
              setTimeout(() => setIsLoading(false), 800);
          }}
          onToggleWorldMap={handleToggleWorldMap}
          onToggleQuestLog={toggleQuestLog}
          controlsDisabled={isInventoryOpen || isTradeOpen || isForgeOpen || !!dialogue || isKeybindsOpen || isQuestLogOpen || isLoading || isSpawnModalOpen}
        />
      </div>

      <LoadingScreen isVisible={isLoading} message={`Traveling to ${activeScene === 'dev' ? 'Dev Scene' : 'World Scene'}...`} />

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
                      <button 
                        onClick={() => handleTravel('dev')}
                        className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${activeScene === 'dev' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                      >
                          Dev Scene
                          {activeScene === 'dev' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </button>
                      <button 
                        onClick={() => handleTravel('world')}
                        className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${activeScene === 'world' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                      >
                          World Scene
                          {activeScene === 'world' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </button>
                  </div>
              )}
          </div>
      </div>

      <InteractionOverlay text={interactionText} progress={progress} />

      {!isInventoryOpen && !isTradeOpen && !isForgeOpen && !isBuilderMode && !isQuestLogOpen && (
          <Hotbar inventory={inventory} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
      )}

      {isBuilderMode && !isInventoryOpen && !isTradeOpen && !isForgeOpen && (
          <BuilderUI activeType={activeStructure} onSelectType={handleSelectStructure} />
      )}

      {!isInventoryOpen && !isTradeOpen && !isForgeOpen && !isBuilderMode && !isQuestLogOpen && (
          <ControlPanel 
            config={config}
            manualInput={manualInput}
            isDeadUI={isDeadUI}
            setConfig={setConfig}
            setManualInput={setManualInput}
            handleDeathToggle={handleDeathToggle}
            triggerAction={triggerAction}
            onExport={handleExport}
            onSpawnAnimals={() => setIsSpawnModalOpen(true)}
          />
      )}

      {!isInventoryOpen && !isTradeOpen && !isForgeOpen && !isQuestLogOpen && <MobileControls game={gameInstance.current} />}

      <InventoryModal 
          isOpen={isInventoryOpen}
          onClose={() => setIsInventoryOpen(false)}
          config={config}
          inventory={inventory}
          equipmentSlots={equipmentSlots}
          onEquip={setSelectedSlot}
          onInventoryChange={setInventory}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          coins={coins}
      />

      <TradeModal
          isOpen={isTradeOpen}
          onClose={() => { setIsTradeOpen(false); if(gameInstance.current) gameInstance.current['player'].isTalking = false; }}
          inventory={inventory}
          coins={coins}
          onBuy={handleBuy}
          onSell={handleSell}
      />

      <ForgeModal
          isOpen={isForgeOpen}
          onClose={() => setIsForgeOpen(false)}
          inventory={inventory}
          onInventoryChange={setInventory}
      />

      <KeybindsModal 
          isOpen={isKeybindsOpen}
          onClose={() => setIsKeybindsOpen(false)}
      />

      <WorldMapModal 
          isOpen={isWorldMapOpen}
          onClose={() => setIsWorldMapOpen(false)}
          playerPos={playerPosForMap}
      />

      <QuestLogModal 
          isOpen={isQuestLogOpen}
          onClose={() => setIsQuestLogOpen(false)}
          quests={quests}
      />

      <SpawnAnimalsModal 
        isOpen={isSpawnModalOpen}
        onClose={() => setIsSpawnModalOpen(false)}
        onSpawn={handleSpawnAnimal}
      />

      {dialogue && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xl px-4 animate-fade-in-up">
              <div className="bg-black/80 backdrop-blur-md border-2 border-white/20 rounded-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs">Guard</h3>
                  </div>
                  <p className="text-white text-lg font-medium leading-relaxed mb-6 italic">
                      "{dialogue}"
                  </p>
                  <div className="flex justify-end">
                      <button 
                        onClick={closeDialogue}
                        className="px-6 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-blue-400 hover:text-white transition-all shadow-lg active:scale-95"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
