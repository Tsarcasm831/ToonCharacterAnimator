import React from 'react';
import { useRPGStore } from '../state/rpgStore';
import { CONTAINERS } from '../data/worldLayout';
import { INVENTORY_SIZE } from '../types';
import { ItemSlot, PanelShell } from './common';

// ============================================================================
// Loot caches (one-time) and the persistent town stash.
// ============================================================================

export const ContainerPanel: React.FC = () => {
  const activePanel = useRPGStore((s) => s.activePanel);
  const containerId = useRPGStore((s) => s.containerId);
  const containers = useRPGStore((s) => s.containers);
  const inventory = useRPGStore((s) => s.inventory);
  const closePanel = useRPGStore((s) => s.closePanel);
  const takeContainerItem = useRPGStore((s) => s.takeContainerItem);
  const takeAllFromContainer = useRPGStore((s) => s.takeAllFromContainer);
  const depositToContainer = useRPGStore((s) => s.depositToContainer);

  if (activePanel !== 'container' || !containerId) return null;
  const def = CONTAINERS.find((d) => d.id === containerId);
  const state = containers[containerId];
  if (!def || !state) return null;

  const isLoot = def.mode === 'loot';

  /** Take just the coin purse, mirroring the store's looted bookkeeping. */
  const takeGold = () => {
    const s = useRPGStore.getState();
    const c = s.containers[containerId];
    if (!c || c.gold <= 0) return;
    s.addGold(c.gold);
    const emptied = c.items.every((x) => !x);
    useRPGStore.setState({
      containers: {
        ...s.containers,
        [containerId]: { ...c, gold: 0, looted: isLoot && emptied },
      },
    });
  };

  if (isLoot) {
    const hasAnything = state.gold > 0 || state.items.some((x) => !!x);
    return (
      <PanelShell title={def.label} subtitle="One-time cache" onClose={closePanel} width="w-[520px]">
        <div className="flex flex-wrap gap-1.5">
          {state.items.map((it, i) => (
            <ItemSlot key={i} item={it} size="md" onClick={it ? () => takeContainerItem(i) : undefined} />
          ))}
          {state.items.every((x) => !x) && (
            <div className="w-full text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest py-4">
              Nothing but dust and splinters
            </div>
          )}
        </div>

        {state.gold > 0 && (
          <button
            type="button"
            onClick={takeGold}
            className="mt-4 w-full flex items-center justify-between bg-yellow-950/40 border border-yellow-500/30 rounded-xl px-4 py-3 hover:bg-yellow-950/70 hover:border-yellow-500/50 transition-all duration-150 group"
          >
            <span className="flex items-center gap-2">
              <span className="text-yellow-400 text-lg">🪙</span>
              <span className="text-yellow-100 font-mono font-bold text-sm">{state.gold} gold</span>
            </span>
            <span className="text-yellow-500/70 text-[10px] font-black uppercase tracking-widest group-hover:text-yellow-300 transition-colors">
              Take
            </span>
          </button>
        )}

        <button
          type="button"
          disabled={!hasAnything}
          onClick={takeAllFromContainer}
          className={`mt-4 w-full rounded-full text-sm font-black uppercase tracking-widest px-4 py-3 transition-all duration-150 ${
            hasAnything
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-[1.02] shadow-lg shadow-amber-900/30 cursor-pointer'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          Take All
        </button>
      </PanelShell>
    );
  }

  // Storage mode
  const capacity = def.capacity ?? 24;
  const used = state.items.filter((x) => !!x).length;

  return (
    <PanelShell title={def.label} subtitle="Storage" onClose={closePanel} width="w-[880px]">
      <div className="flex items-stretch gap-4">
        {/* Stash */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Stash</div>
            <div className="text-slate-600 text-[9px] font-bold uppercase tracking-widest font-mono">
              {used}/{capacity} slots
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl p-3 w-fit">
            {state.items.map((it, i) => (
              <ItemSlot key={i} item={it} size="md" onClick={it ? () => takeContainerItem(i) : undefined} />
            ))}
          </div>
          <div className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-2">
            Click to withdraw
          </div>
        </div>

        {/* Arrows */}
        <div className="flex flex-col items-center justify-center text-slate-600 shrink-0">
          <span className="text-2xl font-black select-none">⇄</span>
        </div>

        {/* Player inventory */}
        <div className="flex-1 min-w-0">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Your Pack</div>
          <div className="grid grid-cols-8 gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl p-3 w-fit">
            {Array.from({ length: INVENTORY_SIZE }).map((_, i) => {
              const it = inventory[i] ?? null;
              return (
                <ItemSlot key={i} item={it} size="sm" onClick={it ? () => depositToContainer(i) : undefined} />
              );
            })}
          </div>
          <div className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-2">
            Click to deposit
          </div>
        </div>
      </div>
    </PanelShell>
  );
};
