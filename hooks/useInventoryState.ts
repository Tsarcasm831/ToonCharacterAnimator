import { useState } from 'react';
import { InventoryItem } from '../types';

// Helper to create initial state with some flavor items
const getInitialInventory = (): (InventoryItem | null)[] => {
  const inv = Array(60).fill(null); // Increased size for a dense "bag" feel
  
  // Hotbar (Slots 0-7)
  inv[0] = { name: 'Potion of Healing', count: 3 };
  inv[1] = { name: 'Axe', count: 1 };
  inv[2] = { name: 'Mana Potion', count: 2 };
  
  // Equipment placeholders (Slots 8+)
  inv[8] = { name: 'Sword', count: 1 };
  inv[9] = { name: 'Shield', count: 1 };
  inv[10] = { name: 'Helm', count: 1 };
  inv[11] = { name: 'Plate Mail', count: 1 };
  inv[12] = { name: 'Gold Ring', count: 1 };
  
  // Random loot
  inv[20] = { name: 'Bone Dust', count: 5 };
  inv[21] = { name: 'Scrap Metal', count: 12 };
  inv[22] = { name: 'Wood', count: 300 };
  
  return inv;
};

export function useInventoryState() {
  const [inventory, setInventory] = useState<(InventoryItem | null)[]>(getInitialInventory());
  const [bench, setBench] = useState<(InventoryItem | null)[]>(Array(6).fill(null)); // Bench for units/abilities
  
  // Load slot layouts from localStorage
  const [slotLayouts, setSlotLayouts] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('inventory-slot-layouts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const updateSlotLayouts = (layouts: Record<string, any>) => {
    setSlotLayouts(layouts);
    try {
      localStorage.setItem('inventory-slot-layouts', JSON.stringify(layouts));
    } catch (e) {
      console.error('Failed to save slot layouts', e);
    }
  };

  const [equipmentSlots, setEquipmentSlots] = useState<Record<string, string | null>>({
    helm: null,
    mask: null,
    hood: null,
    shoulder: null,
    torso: null,
    legs: null,
    boots: null,
    mount: null,
    amulet: null,
    gloves: null,
    ring1: null,
    ring2: null,
    focus: null,
    weapon: null
  });

  return {
    inventory,
    setInventory,
    bench,
    setBench,
    equipmentSlots,
    setEquipmentSlots,
    slotLayouts,
    updateSlotLayouts
  };
}