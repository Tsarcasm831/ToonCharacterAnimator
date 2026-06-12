import React, { useState } from 'react';
import { useRPGStore } from '../state/rpgStore';
import { getNpcDef } from '../data/npcs';
import { getBuyPrice, getItemDef, getSellPrice, RARITY_COLORS } from '../data/items';
import { INVENTORY_SIZE } from '../types';
import { GoldBadge, ItemSlot, PanelShell } from './common';

// ============================================================================
// Vendor screen: buy from stock on the left, sell from inventory on the right.
// ============================================================================

export const TradePanel: React.FC = () => {
  const activePanel = useRPGStore((s) => s.activePanel);
  const tradeNpcId = useRPGStore((s) => s.tradeNpcId);
  const inventory = useRPGStore((s) => s.inventory);
  const gold = useRPGStore((s) => s.progress.gold);
  const closePanel = useRPGStore((s) => s.closePanel);
  const buyItem = useRPGStore((s) => s.buyItem);
  const sellItemAt = useRPGStore((s) => s.sellItemAt);

  const [selected, setSelected] = useState<number | null>(null);

  if (activePanel !== 'trade' || !tradeNpcId) return null;
  const npc = getNpcDef(tradeNpcId);
  if (!npc?.shop) return null;

  const shop = npc.shop;
  const multipliers = shop.buyMultipliers ?? {};
  const multiplierEntries = Object.entries(multipliers);

  const selectedItem = selected !== null ? inventory[selected] : null;
  const selectedMul = selectedItem ? (multipliers[selectedItem.name] ?? 1) : 1;
  const selectedUnitPrice = selectedItem ? getSellPrice(selectedItem.name, selectedMul) : 0;

  return (
    <PanelShell title={shop.title} subtitle={`${npc.name} · ${npc.role}`} onClose={closePanel} width="w-[920px]">
      <div className="flex items-center justify-between gap-4 mb-5">
        {multiplierEntries.length > 0 ? (
          <div className="flex-1 bg-amber-950/40 border border-amber-500/30 rounded-xl px-4 py-2.5 text-amber-300 text-xs font-bold">
            ✦ {npc.name} pays{' '}
            {multiplierEntries.map(([item, mul], i) => (
              <span key={item}>
                {i > 0 && <span className="text-amber-500/60"> · </span>}
                <span className="font-black">{mul}×</span> for {item}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <GoldBadge amount={gold} />
      </div>

      <div className="flex gap-6">
        {/* Buy */}
        <div className="flex-1 min-w-0">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Buy</div>
          <div className="flex flex-col gap-2">
            {shop.stock.map(({ name }) => {
              const def = getItemDef(name);
              const price = getBuyPrice(name);
              const affordable = gold >= price;
              return (
                <div
                  key={name}
                  className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 hover:border-slate-600 transition-all duration-150"
                >
                  <ItemSlot item={{ name, count: 1 }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-black truncate ${def ? RARITY_COLORS[def.rarity] : 'text-white'}`}>
                      {name}
                    </div>
                    <div className="text-slate-500 text-[10px] leading-tight truncate">
                      {def?.description ?? ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-yellow-400 text-[10px]">🪙</span>
                    <span className={`font-mono text-xs font-bold ${affordable ? 'text-yellow-100' : 'text-red-400'}`}>
                      {price}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => buyItem(name)}
                    className={`shrink-0 rounded-full text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 transition-all duration-150 ${
                      affordable
                        ? 'bg-yellow-600 text-white hover:bg-yellow-500 hover:scale-105 cursor-pointer'
                        : 'bg-red-950/50 border border-red-900/50 text-red-500/70 cursor-not-allowed'
                    }`}
                  >
                    Buy
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sell */}
        <div className="w-[380px] shrink-0">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">
            Sell · click an item to sell one
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: INVENTORY_SIZE }).map((_, i) => {
              const it = inventory[i] ?? null;
              const mul = it ? (multipliers[it.name] ?? 1) : 1;
              return (
                <div key={i} className={`rounded-lg ${it && mul > 1 ? 'ring-1 ring-amber-400/70' : ''}`}>
                  <ItemSlot
                    item={it}
                    size="sm"
                    selected={selected === i}
                    onClick={
                      it
                        ? () => {
                            setSelected(i);
                            sellItemAt(i, 1);
                          }
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Selected stack strip */}
          <div className="mt-4 bg-slate-950/60 border border-slate-800 rounded-xl p-3 min-h-[72px]">
            {selectedItem ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black truncate ${
                        RARITY_COLORS[getItemDef(selectedItem.name)?.rarity ?? 'common']
                      }`}
                    >
                      {selectedItem.name}
                    </span>
                    {getItemDef(selectedItem.name)?.equip && (
                      <span className="bg-sky-950/60 border border-sky-500/30 text-sky-300 rounded px-1.5 py-px text-[8px] font-black uppercase tracking-widest shrink-0">
                        equippable
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] font-bold mt-1 ${selectedMul > 1 ? 'text-amber-300' : 'text-slate-400'}`}>
                    🪙 {selectedUnitPrice} each{selectedMul > 1 ? ` · ${selectedMul}× bonus` : ''} · ×
                    {selectedItem.count} held
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sellItemAt(selected!, selectedItem.count);
                    setSelected(null);
                  }}
                  className="shrink-0 rounded-full text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 transition-all duration-150"
                >
                  Sell all (+{selectedUnitPrice * selectedItem.count}g)
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[48px] text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                Select an item to see its price
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelShell>
  );
};
