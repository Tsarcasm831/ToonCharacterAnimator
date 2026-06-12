import React, { useState } from 'react';
import { useRPGStore } from '../state/rpgStore';
import { EQUIP_SLOTS, HOTBAR_SIZE, INVENTORY_SIZE } from '../types';
import { getItemDef, RARITY_COLORS } from '../data/items';
import { ItemSlot, PanelShell, StatRow } from './common';

// ============================================================================
// 8x5 inventory grid (row 0 = hotbar) + paper-doll equipment + stats.
// ============================================================================

export const InventoryPanel: React.FC = () => {
  const activePanel = useRPGStore((s) => s.activePanel);
  const inventory = useRPGStore((s) => s.inventory);
  const equipment = useRPGStore((s) => s.equipment);
  const progress = useRPGStore((s) => s.progress);
  const closePanel = useRPGStore((s) => s.closePanel);
  const moveItem = useRPGStore((s) => s.moveItem);
  const useItemAt = useRPGStore((s) => s.useItemAt);
  const equipItemAt = useRPGStore((s) => s.equipItemAt);
  const removeItemAt = useRPGStore((s) => s.removeItemAt);
  const unequipSlot = useRPGStore((s) => s.unequipSlot);
  const getDamageBonus = useRPGStore((s) => s.getDamageBonus);
  const getDefense = useRPGStore((s) => s.getDefense);

  const [selected, setSelected] = useState<number | null>(null);
  const [confirmDrop, setConfirmDrop] = useState(false);

  if (activePanel !== 'inventory') return null;

  const select = (i: number | null) => {
    setSelected(i);
    setConfirmDrop(false);
  };

  const handleSlotClick = (i: number) => {
    if (selected === null) {
      if (inventory[i]) select(i);
      return;
    }
    if (selected === i) {
      select(null);
      return;
    }
    moveItem(selected, i);
    select(null);
  };

  const handleSlotDoubleClick = (i: number) => {
    const it = inventory[i];
    if (!it) return;
    const def = getItemDef(it.name);
    if (def?.consume) useItemAt(i);
    else if (def?.equip) equipItemAt(i);
    select(null);
  };

  const selectedItem = selected !== null ? inventory[selected] : null;
  const selectedDef = selectedItem ? getItemDef(selectedItem.name) : undefined;

  return (
    <PanelShell title="Inventory" subtitle="Row one doubles as your hotbar" onClose={closePanel} width="w-[880px]">
      <div className="flex gap-6">
        {/* Left: grid + detail strip */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-8 gap-1.5 w-fit">
            {Array.from({ length: INVENTORY_SIZE }).map((_, i) => (
              <div key={i} className="relative">
                <ItemSlot
                  item={inventory[i] ?? null}
                  size="md"
                  selected={selected === i}
                  onClick={() => handleSlotClick(i)}
                  onDoubleClick={() => handleSlotDoubleClick(i)}
                />
                {i < HOTBAR_SIZE && (
                  <div className="absolute -bottom-[3px] left-1.5 right-1.5 h-[2px] rounded-full bg-amber-500/50 pointer-events-none" />
                )}
              </div>
            ))}
          </div>
          <div className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-2.5">
            Click to select · click again to move · double-click to use or equip
          </div>

          {/* Detail strip */}
          <div className="mt-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4 min-h-[92px]">
            {selectedItem ? (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={`text-sm font-black ${selectedDef ? RARITY_COLORS[selectedDef.rarity] : 'text-white'}`}>
                    {selectedItem.name}
                    {selectedItem.count > 1 && (
                      <span className="text-slate-500 font-mono text-xs ml-1.5">×{selectedItem.count}</span>
                    )}
                  </div>
                  {selectedDef && (
                    <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                      {selectedDef.kind} · {selectedDef.rarity}
                    </div>
                  )}
                  <p className="text-slate-300 text-xs leading-snug mt-1.5">
                    {selectedDef?.description ?? 'An unremarkable curio.'}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {selectedDef?.consume && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selected !== null) useItemAt(selected);
                        select(null);
                      }}
                      className="rounded-full text-xs font-black uppercase tracking-widest px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 transition-all duration-150"
                    >
                      Use
                    </button>
                  )}
                  {selectedDef?.equip && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selected !== null) equipItemAt(selected);
                        select(null);
                      }}
                      className="rounded-full text-xs font-black uppercase tracking-widest px-4 py-2 bg-sky-600 text-white hover:bg-sky-500 hover:scale-105 transition-all duration-150"
                    >
                      Equip
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirmDrop) {
                        setConfirmDrop(true);
                        return;
                      }
                      if (selected !== null) removeItemAt(selected);
                      select(null);
                    }}
                    className={`rounded-full text-xs font-black uppercase tracking-widest px-4 py-2 transition-all duration-150 ${
                      confirmDrop
                        ? 'bg-red-600 text-white hover:bg-red-500 scale-105'
                        : 'bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {confirmDrop ? 'Confirm?' : 'Drop'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[60px] text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                Select an item to inspect it
              </div>
            )}
          </div>
        </div>

        {/* Right: paper doll + stats */}
        <div className="w-56 shrink-0 flex flex-col gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Equipped</div>
            <div className="flex flex-col gap-2">
              {EQUIP_SLOTS.map((slot) => {
                const itemName = equipment[slot.id];
                return (
                  <div key={slot.id} className="flex items-center gap-3">
                    <ItemSlot
                      item={itemName ? { name: itemName, count: 1 } : null}
                      size="sm"
                      onClick={itemName ? () => unequipSlot(slot.id) : undefined}
                    />
                    <div className="min-w-0">
                      <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{slot.label}</div>
                      <div
                        className={`text-xs font-bold truncate ${
                          itemName
                            ? RARITY_COLORS[getItemDef(itemName)?.rarity ?? 'common']
                            : 'text-slate-700'
                        }`}
                      >
                        {itemName ?? '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-3">
              Click a slot to unequip
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Stats</div>
            <StatRow label="⚔ Damage Bonus" value={`+${getDamageBonus()}`} accent="text-red-400" />
            <StatRow label="🛡 Defense" value={getDefense()} accent="text-sky-400" />
            <StatRow label="❤ Max HP" value={progress.maxHp} accent="text-emerald-400" />
            <StatRow label="🪙 Gold" value={progress.gold.toLocaleString()} accent="text-yellow-400" />
          </div>
        </div>
      </div>
    </PanelShell>
  );
};
