import React from 'react';
import { useRPGStore } from '../state/rpgStore';
import { EQUIP_SLOTS } from '../types';
import { RPG_CLASSES } from '../data/classes';
import { getItemDef, RARITY_COLORS } from '../data/items';
import { PlayerPreview } from '../../components/ui/previews/PlayerPreview';
import { formatPlaytime, PanelShell, StatRow } from './common';

// ============================================================================
// Character sheet: 3D portrait, level/XP, stats, equipment summary.
// ============================================================================

export const CharacterProfile: React.FC = () => {
  const activePanel = useRPGStore((s) => s.activePanel);
  const character = useRPGStore((s) => s.character);
  const progress = useRPGStore((s) => s.progress);
  const equipment = useRPGStore((s) => s.equipment);
  const closePanel = useRPGStore((s) => s.closePanel);
  const getDamageBonus = useRPGStore((s) => s.getDamageBonus);
  const getDefense = useRPGStore((s) => s.getDefense);

  if (activePanel !== 'profile' || !character) return null;

  const cls = RPG_CLASSES[character.classId];
  const xpPct = progress.xpToNext > 0 ? Math.max(0, Math.min(100, (progress.xp / progress.xpToNext) * 100)) : 0;

  return (
    <PanelShell title={character.name} subtitle={`${cls.name} · ${cls.tagline}`} onClose={closePanel} width="w-[820px]">
      <div className="flex gap-6">
        {/* Left: 3D portrait */}
        <div className="w-72 shrink-0">
          <div className="h-[340px] bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.07),transparent_60%)] z-10" />
            <PlayerPreview config={character.config} />
          </div>
          <div className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-2 text-center">
            Drag to rotate
          </div>
        </div>

        {/* Right: progression, stats, equipment */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Level + XP */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-sm font-black shrink-0">
                  {progress.level}
                </span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Level</span>
              </div>
              <span className="text-slate-400 font-mono text-xs font-bold">
                {progress.xp} / {progress.xpToNext} XP
              </span>
            </div>
            <div className="h-2 bg-black/60 border border-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Statistics</div>
            <StatRow label="❤ Max HP" value={progress.maxHp} accent="text-emerald-400" />
            <StatRow label="⚔ Damage Bonus" value={`+${getDamageBonus()}`} accent="text-red-400" />
            <StatRow label="🛡 Defense" value={getDefense()} accent="text-sky-400" />
            <StatRow label="🪙 Gold" value={progress.gold.toLocaleString()} accent="text-yellow-400" />
            <StatRow label="🐺 Wolves Slain" value={progress.kills} />
            <StatRow label="💀 Deaths" value={progress.deaths} accent="text-red-400" />
            <StatRow label="⏳ Time Played" value={formatPlaytime(progress.playTimeSec)} />
          </div>

          {/* Equipment */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Equipment</div>
            {EQUIP_SLOTS.map((slot) => {
              const itemName = equipment[slot.id];
              const def = itemName ? getItemDef(itemName) : undefined;
              return (
                <StatRow
                  key={slot.id}
                  label={slot.label}
                  value={itemName ?? '—'}
                  accent={itemName ? RARITY_COLORS[def?.rarity ?? 'common'] : 'text-slate-700'}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PanelShell>
  );
};
