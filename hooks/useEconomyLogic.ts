import React from 'react';
import { InventoryItem } from '../types';

interface UseEconomyLogicProps {
  inventory: (InventoryItem | null)[];
  setInventory: (items: (InventoryItem | null)[]) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
}

export function useEconomyLogic({
  inventory,
  setInventory,
  coins,
  setCoins
}: UseEconomyLogicProps) {

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

  return { handleBuy, handleSell };
}
