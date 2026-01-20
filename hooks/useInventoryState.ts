import { useState } from 'react';
import { InventoryItem } from '../types';

export function useInventoryState() {
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

      return {
        inventory,
        setInventory,
        bench,
        setBench,
        equipmentSlots,
        setEquipmentSlots
      };
}
