import React, { useState, useEffect, useRef } from 'react';
import Scene from './components/Scene.tsx';
import { PlayerConfig, PlayerInput, DEFAULT_CONFIG } from './types.ts';
import { Header } from './components/ui/Header.tsx';
import { InteractionOverlay } from './components/ui/InteractionOverlay.tsx';
import { Hotbar } from './components/ui/Hotbar.tsx';
import { ControlPanel } from './components/ui/ControlPanel.tsx';
import { InventoryModal } from './components/ui/InventoryModal.tsx';
import { BuilderUI } from './components/ui/BuilderUI.tsx';
import { MobileControls } from './components/ui/MobileControls.tsx';
import { KeybindsModal } from './components/ui/KeybindsModal.tsx';
import { ModelExporter } from './game/ModelExporter.ts';
import { Game } from './game/Game.ts';
import { StructureType } from './game/builder/BuildingParts.ts';

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
  const [isTravelOpen, setIsTravelOpen] = useState(false);
  const [activeScene, setActiveScene] = useState<'dev' | 'world'>('world');

  const [inventory, setInventory] = useState<string[]>(() => {
    const inv = Array(32).fill('');
    // Keep Knife and Fishing Pole on Hotbar
    inv[2] = 'Bow';
    inv[4] = 'Knife';
    inv[5] = 'Fishing Pole';
    
    // Clothing items in inventory
    inv[8] = 'Shirt';
    inv[9] = 'Pants';
    inv[10] = 'Shoes';
    inv[11] = 'Mask';
    inv[12] = 'Hood';
    inv[13] = 'Quilted Armor';
    inv[14] = 'Leather Armor';
    inv[15] = 'Heavy Leather Armor';
    inv[16] = 'RingMail';
    inv[17] = 'Plate Mail';

    // Moved Weapons to main inventory
    inv[18] = 'Axe';
    inv[19] = 'Sword';
    inv[20] = 'Pickaxe';
    inv[21] = 'Halberd';

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
  const [isKeybindsOpen, setIsKeybindsOpen] = useState(false);
  
  const [dialogue, setDialogue] = useState<string | null>(null);

  const gameInstance = useRef<Game | null>(null);

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', preventContextMenu);
    return () => window.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  const handleExport = () => {
      if (gameInstance.current) ModelExporter.exportAndDownloadZip(gameInstance.current['player']);
  };

  useEffect(() => {
    const itemName = inventory[selectedSlot] || null;
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

  const toggleInventory = () => setIsInventoryOpen(prev => !prev);
  const toggleKeybinds = () => setIsKeybindsOpen(prev => !prev);

  const handleSelectStructure = (type: StructureType) => {
      setActiveStructure(type);
      if (gameInstance.current) gameInstance.current.setBuildingType(type);
  };

  const handleEquipItem = (item: string, slotId: string) => {
      const existing = equipmentSlots[slotId];
      let newInv = [...inventory];
      if (existing) {
          const emptyIdx = newInv.findIndex(s => s === '');
          if (emptyIdx !== -1) newInv[emptyIdx] = existing;
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
      const emptyIdx = newInv.findIndex(s => s === '');
      if (emptyIdx !== -1) {
          newInv[emptyIdx] = item;
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

  const closeDialogue = () => {
    setDialogue(null);
    if (gameInstance.current) {
      gameInstance.current['player'].isTalking = false;
    }
  };

  const handleTravel = (scene: 'dev' | 'world') => {
      setActiveScene(scene);
      setIsTravelOpen(false);
      if (gameInstance.current) {
          gameInstance.current.switchScene(scene);
      }
  };

  return (
    <div className="w-screen h-screen relative bg-gray-900 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <Scene 
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
              g.onBuilderToggle = (active) => setIsBuilderMode(active);
              g.onBiomeUpdate = (b) => setCurrentBiome(b);
              g.onDialogueTrigger = (content) => setDialogue(content);
          }}
          controlsDisabled={isInventoryOpen || !!dialogue || isKeybindsOpen}
        />
      </div>

      {!isInventoryOpen && !isBuilderMode && <Header biome={currentBiome} />}
      
      {/* Travel Button Top Center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[50]">
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

      {!isInventoryOpen && !isBuilderMode && (
          <Hotbar inventory={inventory} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
      )}

      {isBuilderMode && !isInventoryOpen && (
          <BuilderUI activeType={activeStructure} onSelectType={handleSelectStructure} />
      )}

      {!isInventoryOpen && !isBuilderMode && (
          <ControlPanel 
            config={config}
            manualInput={manualInput}
            isDeadUI={isDeadUI}
            setConfig={setConfig}
            setManualInput={setManualInput}
            handleDeathToggle={handleDeathToggle}
            triggerAction={triggerAction}
            onExport={handleExport}
          />
      )}

      {!isInventoryOpen && <MobileControls game={gameInstance.current} />}

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

      <KeybindsModal 
          isOpen={isKeybindsOpen}
          onClose={() => setIsKeybindsOpen(false)}
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
