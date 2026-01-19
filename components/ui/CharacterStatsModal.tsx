import React from 'react';
import { EntityStats } from '../../types';

interface CharacterStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: EntityStats;
    name: string;
    bodyType: string;
}

export const CharacterStatsModal: React.FC<CharacterStatsModalProps> = ({ isOpen, onClose, stats, name, bodyType }) => {
    if (!isOpen) return null;

    const experience = 1540;
    const nextLevelXp = 2000;
    const level = 1;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onContextMenu={(e) => e.preventDefault()}>
            <div className="bg-slate-900/95 border-2 border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{name} Status</h2>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Level {level} {bodyType === 'male' ? 'Hero' : 'Heroine'}</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    {/* Primary Bars */}
                    <div className="space-y-4">
                        {/* Health */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Vitality</span>
                                <span className="text-[10px] font-mono text-slate-400">{stats.health} / {stats.maxHealth}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }} />
                            </div>
                        </div>

                        {/* Chakra */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Chakra</span>
                                <span className="text-[10px] font-mono text-slate-400">{stats.chakra} / {stats.maxChakra}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${(stats.chakra / stats.maxChakra) * 100}%` }} />
                            </div>
                        </div>

                        {/* Experience */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Progression</span>
                                <span className="text-[10px] font-mono text-slate-400">{experience} / {nextLevelXp}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_10px_rgba(202,138,4,0.5)]" style={{ width: `${(experience / nextLevelXp) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-3">
                            <StatRow label="Strength" value={stats.strength} color="text-orange-400" />
                            <StatRow label="Dexterity" value={stats.dexterity} color="text-emerald-400" />
                            <StatRow label="Damage" value={stats.damage} color="text-red-300" />
                        </div>
                        <div className="space-y-3">
                            <StatRow label="Defense" value={stats.defense} color="text-slate-300" />
                            <StatRow label="Evasion" value={stats.evasion} color="text-blue-300" />
                            <StatRow label="Soak" value={stats.soak} color="text-indigo-300" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
    <div className="flex items-center justify-between group">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
        <span className={`text-sm font-black font-mono ${color}`}>{value}</span>
    </div>
);
