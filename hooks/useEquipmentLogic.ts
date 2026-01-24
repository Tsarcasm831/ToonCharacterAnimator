import React from 'react';
import { InventoryItem, PlayerConfig } from '../types';

interface UseEquipmentLogicProps {
  inventory: (InventoryItem | null)[];
  setInventory: (items: (InventoryItem | null)[]) => void;
  equipmentSlots: Record<string, string | null>;
  setEquipmentSlots: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
}

export function useEquipmentLogic({
  inventory,
  setInventory,
  equipmentSlots,
  setEquipmentSlots,
  setConfig
}: UseEquipmentLogicProps) {

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
            eq.leatherDoublet = (item === 'Leather Doublet');
            eq.ringMail = (item === 'RingMail');
            eq.plateMail = (item === 'Plate Mail');
        }
        if (slotId === 'legs') {
            if (item === 'Pants') eq.pants = true;
            eq.hideBreeches = (item === 'Hide Breeches');
            eq.leatherPants = (item === 'Leather Pants');
            eq.chainLeggings = (item === 'Chain Leggings');
            eq.plateLeggings = (item === 'Plate Leggings');
            eq.warlordLegPlates = (item === 'Warlord Leg Plates');
        }
        if (slotId === 'boots') eq.shoes = true;
        if (slotId === 'helm') eq.helm = true;
        if (slotId === 'mask') eq.mask = true;
        if (slotId === 'hood') eq.hood = true;
        if (slotId === 'shoulder') eq.shoulders = true;
        if (slotId === 'weapon') next.selectedItem = item;
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
                eq.leatherDoublet = false;
                eq.ringMail = false;
                eq.plateMail = false;
            }
            if (slotId === 'legs') eq.pants = false;
            if (slotId === 'legs') {
                eq.hideBreeches = false;
                eq.leatherPants = false;
                eq.chainLeggings = false;
                eq.plateLeggings = false;
                eq.warlordLegPlates = false;
            }
            if (slotId === 'boots') eq.shoes = false;
            if (slotId === 'helm') eq.helm = false;
            if (slotId === 'mask') eq.mask = false;
            if (slotId === 'hood') eq.hood = false;
            if (slotId === 'shoulder') eq.shoulders = false;
            if (slotId === 'weapon') next.selectedItem = null;
            next.equipment = eq;
            return next;
        });
    }
  };

  return { handleEquipItem, handleUnequipItem };
}
