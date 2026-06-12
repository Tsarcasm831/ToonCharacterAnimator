import React from 'react';
import { useRPGStore } from '../state/rpgStore';
import { HOTBAR_SIZE } from '../types';
import type { RPGToast } from '../types';
import { isInTown, TOWN_NAME, WORLD_NAME } from '../data/worldLayout';
import { GoldBadge, ItemSlot } from './common';

// ============================================================================
// In-game HUD. Mounted unconditionally; renders nothing outside playing/dead.
// Root is pointer-events-none; interactive children opt back in.
// ============================================================================

const TOAST_BORDERS: Record<RPGToast['tone'], string> = {
  info: 'border-l-sky-500',
  gold: 'border-l-yellow-400',
  loot: 'border-l-amber-400',
  danger: 'border-l-red-500',
  success: 'border-l-emerald-500',
};

const HUD_KEYFRAMES = `
@keyframes rpg-vignette-out { 0% { opacity: 0.75; } 100% { opacity: 0; } }
@keyframes rpg-hpbar-flash { 0% { opacity: 0.65; } 100% { opacity: 0; } }
@keyframes rpg-toast-in { 0% { opacity: 0; transform: translateX(24px); } 100% { opacity: 1; transform: translateX(0); } }
@keyframes rpg-save-flash {
  0%, 55% { border-color: rgba(16,185,129,0.7); background-color: rgba(6,78,59,0.55); }
  100% { border-color: rgba(255,255,255,0.1); background-color: rgba(0,0,0,0.6); }
}
`;

const HudChip: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={`flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 px-3 py-1.5 ${className ?? ''}`}
  >
    {children}
  </div>
);

export const RPGHud: React.FC = () => {
  const phase = useRPGStore((s) => s.phase);
  const character = useRPGStore((s) => s.character);
  const progress = useRPGStore((s) => s.progress);
  const inventory = useRPGStore((s) => s.inventory);
  const playerPosition = useRPGStore((s) => s.playerPosition);
  const interaction = useRPGStore((s) => s.interaction);
  const toasts = useRPGStore((s) => s.toasts);
  const damageEventSeq = useRPGStore((s) => s.damageEventSeq);
  const lastSavedAt = useRPGStore((s) => s.lastSavedAt);
  const openPanel = useRPGStore((s) => s.openPanel);
  const useItemAt = useRPGStore((s) => s.useItemAt);

  if (phase !== 'playing' && phase !== 'dead') return null;

  const dead = phase === 'dead';
  const inTown = playerPosition ? isInTown(playerPosition[0], playerPosition[2]) : false;
  const hpPct = progress.maxHp > 0 ? Math.max(0, Math.min(100, (progress.hp / progress.maxHp) * 100)) : 0;
  const xpPct = progress.xpToNext > 0 ? Math.max(0, Math.min(100, (progress.xp / progress.xpToNext) * 100)) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-[100] select-none">
      <style>{HUD_KEYFRAMES}</style>

      {/* Damage vignette: re-keyed per damage event so the animation restarts. */}
      {damageEventSeq > 0 && (
        <div
          key={`vignette-${damageEventSeq}`}
          className="pointer-events-none absolute inset-0 z-[110]"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 42%, rgba(185,28,28,0.55) 100%)',
            animation: 'rpg-vignette-out 400ms ease-out forwards',
          }}
        />
      )}

      {!dead && (
        <>
          {/* Top-left: identity */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <HudChip>
              <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black shrink-0">
                {progress.level}
              </span>
              <span className="text-white text-sm font-black tracking-tight pr-1">
                {character?.name ?? 'Hunter'}
              </span>
            </HudChip>
            <HudChip>
              <span className="text-sm">{inTown ? '🏘️' : '🌲'}</span>
              <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                {inTown ? TOWN_NAME : WORLD_NAME}
              </span>
            </HudChip>
          </div>

          {/* Top-right: gold / kills / save / panel buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
            <GoldBadge amount={progress.gold} />
            <HudChip>
              <span className="text-sm">🐺</span>
              <span className="text-white font-mono text-xs font-bold">×{progress.kills}</span>
            </HudChip>
            <div className="relative group">
              <div
                key={`save-${lastSavedAt ?? 'never'}`}
                className="flex items-center bg-black/60 backdrop-blur-md rounded-full border border-white/10 px-2.5 py-1.5"
                style={lastSavedAt ? { animation: 'rpg-save-flash 2000ms ease-out forwards' } : undefined}
              >
                <span className="text-sm">💾</span>
              </div>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block whitespace-nowrap bg-slate-950/95 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                Autosaves every 10 min
              </div>
            </div>
            <button
              type="button"
              onClick={() => openPanel('inventory')}
              className="bg-black/60 backdrop-blur-md rounded-full border border-white/10 px-3 py-1.5 text-xs font-black text-slate-200 hover:bg-black/80 hover:scale-105 transition-all duration-150"
            >
              🎒 <span className="text-slate-500">I</span>
            </button>
            <button
              type="button"
              onClick={() => openPanel('profile')}
              className="bg-black/60 backdrop-blur-md rounded-full border border-white/10 px-3 py-1.5 text-xs font-black text-slate-200 hover:bg-black/80 hover:scale-105 transition-all duration-150"
            >
              👤 <span className="text-slate-500">P</span>
            </button>
            <button
              type="button"
              onClick={() => openPanel('pause')}
              className="bg-black/60 backdrop-blur-md rounded-full border border-white/10 px-3 py-1.5 text-xs font-black text-slate-200 hover:bg-black/80 hover:scale-105 transition-all duration-150"
            >
              ⏸ <span className="text-slate-500">Esc</span>
            </button>
          </div>

          {/* Center: interaction prompt */}
          {interaction.label && (
            <div className="absolute left-1/2 top-[58%] -translate-x-1/2 flex flex-col items-center gap-1.5">
              <div className="animate-pulse bg-black/70 backdrop-blur-md rounded-full border border-white/15 px-4 py-2 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                {interaction.label}
              </div>
              {interaction.progress != null && (
                <div className="w-36 h-1.5 bg-black/60 border border-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100"
                    style={{ width: `${Math.max(0, Math.min(100, interaction.progress * 100))}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bottom-center: vitals + hotbar */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto">
            {/* HP bar */}
            <div className="relative w-[440px] h-5 bg-black/70 border border-white/10 rounded-full overflow-hidden shadow-lg">
              <div
                className="h-full bg-gradient-to-r from-red-800 via-red-600 to-red-500 transition-all duration-300 ease-out"
                style={{ width: `${hpPct}%` }}
              />
              {damageEventSeq > 0 && (
                <div
                  key={`hpflash-${damageEventSeq}`}
                  className="absolute inset-0 bg-red-500"
                  style={{ animation: 'rpg-hpbar-flash 400ms ease-out forwards' }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-white drop-shadow-md">
                  {progress.hp}/{progress.maxHp}
                </span>
              </div>
            </div>
            {/* XP bar */}
            <div className="w-[440px] h-1.5 bg-black/60 border border-white/10 rounded-full overflow-hidden group relative">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-300"
                style={{ width: `${xpPct}%` }}
              />
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold text-white drop-shadow-md">
                  {progress.xp}/{progress.xpToNext} XP
                </span>
              </div>
            </div>
            {/* Hotbar */}
            <div className="flex gap-1.5 p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
              {Array.from({ length: HOTBAR_SIZE }).map((_, i) => (
                <div key={i} className="relative">
                  <ItemSlot item={inventory[i] ?? null} size="md" onClick={() => useItemAt(i)} />
                  <span className="absolute top-0.5 left-1 text-[8px] font-black text-slate-500 pointer-events-none z-10">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Toasts (kept visible while dead so the death cause reads) */}
      <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2 z-[120]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 bg-black/75 backdrop-blur-md border border-white/10 border-l-4 ${TOAST_BORDERS[t.tone]} rounded-xl pl-3 pr-4 py-2 shadow-xl`}
            style={{ animation: 'rpg-toast-in 200ms ease-out' }}
          >
            {t.icon && <span className="text-base">{t.icon}</span>}
            <span className="text-white text-xs font-bold">{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
