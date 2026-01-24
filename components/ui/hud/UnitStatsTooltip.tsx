
import React from 'react';
import { EntityStats } from '../../../types';

interface UnitStatsTooltipProps {
    stats?: EntityStats;
    unitName?: string;
    x: number;
    y: number;
    visible: boolean;
}

export const UnitStatsTooltip: React.FC<UnitStatsTooltipProps> = ({
    stats,
    unitName,
    x,
    y,
    visible
}) => {
    if (!visible || !stats) return null;

    const hpPercent = stats.maxHealth > 0 ? (stats.health / stats.maxHealth) * 100 : 100;
    const mpPercent = stats.maxMana > 0 ? (stats.mana / stats.maxMana) * 100 : 100;

    return (
        <div 
            className="fixed z-[100] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            style={{ 
                left: x + 15, 
                top: y - 10,
                transform: 'translateY(-50%)'
            }}
        >
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl p-3 min-w-[180px]">
                {/* Unit Name */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-bold text-white tracking-wide">{unitName || 'Unknown'}</span>
                </div>

                {/* HP Bar */}
                <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-white/60 mb-1">
                        <span>HP</span>
                        <span>{stats.health}/{stats.maxHealth}</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                            style={{ width: `${hpPercent}%` }}
                        />
                    </div>
                </div>

                {/* MP Bar */}
                <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-white/60 mb-1">
                        <span>MP</span>
                        <span>{stats.mana}/{stats.maxMana}</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                            style={{ width: `${mpPercent}%` }}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-white/50">ATK</span>
                        <span className="text-orange-400 font-bold">{stats.strength}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/50">DEF</span>
                        <span className="text-cyan-400 font-bold">{stats.defense}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/50">SPD</span>
                        <span className="text-green-400 font-bold">{stats.attackSpeed}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/50">LVL</span>
                        <span className="text-yellow-400 font-bold">{stats.dexterity}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
