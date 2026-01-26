
import React from 'react';
import { EntityStats } from '../../../types';

interface CombatStatusBarProps {
    stats: EntityStats;
    isFemale: boolean;
}

export const CombatStatusBar: React.FC<CombatStatusBarProps> = ({ stats, isFemale }) => {
    const hpPct = (stats.health / stats.maxHealth) * 100;
    const chakraPct = (stats.chakra / stats.maxChakra) * 100;

    return (
        <div className="absolute top-8 left-8 z-[60] flex flex-col gap-4 animate-fade-in-right pointer-events-auto">
            {/* Main Portrait & Bars Panel */}
            <div className="bg-slate-950/80 backdrop-blur-md border-2 border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[320px]">
                {/* Class Icon / Avatar placeholder */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 border border-white/20 flex items-center justify-center text-3xl shadow-inner relative overflow-hidden">
                    <span>{isFemale ? '🙋‍♀️' : '🙋‍♂️'}</span>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_10px_#4ade80]" />
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Vitality</span>
                        <span className="text-[10px] font-mono text-red-400 font-bold">{Math.ceil(stats.health)} / {stats.maxHealth}</span>
                    </div>
                    <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                        <div 
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            style={{ width: `${hpPct}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Chakra</span>
                        <span className="text-[10px] font-mono text-blue-400 font-bold">{Math.ceil(stats.chakra)} / {stats.maxChakra}</span>
                    </div>
                    <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                            style={{ width: `${chakraPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats Tray */}
            <div className="flex gap-2 animate-fade-in-right" style={{ animationDelay: '100ms' }}>
                <StatBadge label="STR" value={stats.strength} color="text-orange-400" />
                <StatBadge label="DEX" value={stats.dexterity} color="text-emerald-400" />
                <StatBadge label="DEF" value={stats.defense} color="text-slate-400" />
                <StatBadge label="DMG" value={stats.damage} color="text-red-400" />
            </div>
        </div>
    );
};

const StatBadge: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xl">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-black font-mono ${color}`}>{value}</span>
    </div>
);
