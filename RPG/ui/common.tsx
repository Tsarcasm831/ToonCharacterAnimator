import React from 'react';
import type { InventoryItem } from '../../types';
import { getItemDef, getItemIcon, RARITY_BORDERS, RARITY_COLORS } from '../data/items';

// ============================================================================
// Shared UI primitives for the RPG overlays. Dark slate glassmorphism,
// matching the house style of components/ui/*.
// ============================================================================

// -- Relative time -------------------------------------------------------------

/** "just now" / "4m ago" / "2h ago" / "3d ago" */
export function relativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/** seconds -> "hh:mm" */
export function formatPlaytime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// -- ItemSlot --------------------------------------------------------------------

const SLOT_SIZES = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-[72px] h-[72px]',
} as const;

const SLOT_ICON_TEXT = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' } as const;

export interface ItemSlotProps {
  item: InventoryItem | null;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  showTooltip?: boolean;
}

export const ItemSlot: React.FC<ItemSlotProps> = ({
  item,
  size = 'md',
  selected = false,
  onClick,
  onDoubleClick,
  showTooltip = true,
}) => {
  const def = item ? getItemDef(item.name) : undefined;
  const icon = item ? getItemIcon(item.name) : null;
  const rarityBorder = def ? RARITY_BORDERS[def.rarity] : 'border-white/10';
  const rarityColor = def ? RARITY_COLORS[def.rarity] : 'text-stone-300';

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`relative ${SLOT_SIZES[size]} rounded-lg border flex items-center justify-center select-none transition-all duration-150 group/slot ${
        item
          ? `bg-slate-800/80 ${rarityBorder} ${onClick || onDoubleClick ? 'cursor-pointer hover:bg-slate-700/80 hover:brightness-110' : ''}`
          : `bg-slate-900/60 border-dashed border-slate-700/60 ${onClick ? 'cursor-pointer hover:bg-slate-800/40' : ''}`
      } ${selected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : ''}`}
    >
      {item && icon && (
        <>
          {icon.image ? (
            <img
              src={icon.image}
              alt={item.name}
              decoding="async"
              className="w-full h-full object-contain p-1 pointer-events-none"
            />
          ) : (
            <span className={`${SLOT_ICON_TEXT[size]} drop-shadow-md pointer-events-none`}>{icon.emoji}</span>
          )}
          {item.count > 1 && (
            <span className="absolute bottom-0.5 right-0.5 bg-black/70 border border-white/10 rounded px-1 text-[9px] font-black text-white leading-tight z-10 pointer-events-none">
              {item.count}
            </span>
          )}

          {showTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover/slot:block z-[400] pointer-events-none">
              <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-left">
                <div className={`text-sm font-black leading-tight ${rarityColor}`}>{item.name}</div>
                {def && (
                  <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    {def.kind} · {def.rarity}
                  </div>
                )}
                {def?.description && (
                  <p className="text-slate-300 text-[11px] leading-snug mt-1.5">{def.description}</p>
                )}
                {def?.equip?.bonus && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {def.equip.bonus.damage ? (
                      <span className="text-red-400 text-[10px] font-black">+{def.equip.bonus.damage} DMG</span>
                    ) : null}
                    {def.equip.bonus.defense ? (
                      <span className="text-sky-400 text-[10px] font-black">+{def.equip.bonus.defense} DEF</span>
                    ) : null}
                    {def.equip.bonus.maxHp ? (
                      <span className="text-emerald-400 text-[10px] font-black">+{def.equip.bonus.maxHp} HP</span>
                    ) : null}
                  </div>
                )}
                {def?.consume && (
                  <div className="text-emerald-400 text-[10px] font-black mt-1.5">
                    Use: {def.consume.effectLabel}
                  </div>
                )}
                {def && (
                  <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-800">
                    <span className="text-yellow-400 text-[10px]">🪙</span>
                    <span className="text-yellow-100 font-mono text-[10px] font-bold">{def.value}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// -- PanelShell ------------------------------------------------------------------

export interface PanelShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind width class for the panel, e.g. 'w-[840px]'. */
  width?: string;
}

export const PanelShell: React.FC<PanelShellProps> = ({ title, subtitle, onClose, children, width }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className={`${width ?? 'w-[760px]'} max-w-[94vw] max-h-[90vh] flex flex-col bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden`}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-700/80 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h2>
            {subtitle && (
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:text-white hover:scale-110 transition-all duration-150 mt-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

// -- GoldBadge ----------------------------------------------------------------------

export const GoldBadge: React.FC<{ amount: number }> = ({ amount }) => (
  <div className="flex items-center gap-2 bg-yellow-950/40 border border-yellow-500/20 px-3 py-1 rounded-full">
    <span className="text-yellow-400 text-sm">🪙</span>
    <span className="text-white font-mono font-bold text-sm">{amount.toLocaleString()}</span>
  </div>
);

// -- StatRow ---------------------------------------------------------------------------

export const StatRow: React.FC<{ label: string; value: React.ReactNode; accent?: string }> = ({
  label,
  value,
  accent,
}) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80 last:border-b-0">
    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{label}</span>
    <span className={`font-mono text-sm font-bold ${accent ?? 'text-white'}`}>{value}</span>
  </div>
);
