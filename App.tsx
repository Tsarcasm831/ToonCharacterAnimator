
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
  
  const [dialogue, setDialogue] = useState<string | null>(null);

  const [gameInstance, setGameInstance] = useState<Game | null>(null);

  const handleExport = () => {
      if (gameInstance) ModelExporter.exportAndDownloadZip(gameInstance['player']);
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

  const handleSelectStructure = (type: StructureType) => {
      setActiveStructure(type);
      if (gameInstance) gameInstance.setBuildingType(type);
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
    if (gameInstance) {
      gameInstance['player'].isTalking = false;
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
              setGameInstance(g);
              g['inputManager'].onToggleInventory = toggleInventory;
              g.onBuilderToggle = (active) => setIsBuilderMode(active);
              g.onBiomeUpdate = (b) => setCurrentBiome(b);
              g.onDialogueTrigger = (content) => setDialogue(content);
          }}
          controlsDisabled={isInventoryOpen || !!dialogue}
        />
      </div>

      {!isInventoryOpen && !isBuilderMode && <Header biome={currentBiome} />}
      
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

      {!isInventoryOpen && <MobileControls game={gameInstance} />}

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
