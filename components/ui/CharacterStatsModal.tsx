
import React from 'react';
import { PlayerConfig } from '../../types';

interface CharacterStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: PlayerConfig;
}

export const CharacterStatsModal: React.FC<CharacterStatsModalProps> = ({ isOpen, onClose, config }) => {
    if (!isOpen) return null;

    // Derived stats for demo purposes
    const stats = {
        level: 5,
        health: 450,
        maxHealth: 500,
        chakra: 120,
        maxChakra: 200,
        experience: 1540,
        nextLevelXp: 2000,
        str: config.bodyVariant === 'muscular' ? 18 : 12,
        dex: config.bodyVariant === 'slim' ? 18 : 12,
        int: 14
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onContextMenu={(e) => e.preventDefault()}>
            <div className="bg-slate-900/95 border-2 border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Character Status</h2>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Level {stats.level} {config.bodyType === 'male' ? 'Hero' : 'Heroine'}</p>
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
                    {/* Bars */}
                    <div className="space-y-4">
                        {/* Health */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Health</span>
                                <span className="text-[10px] font-mono text-slate-400">{stats.health} / {stats.maxHealth}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-red-600 to-red-500" style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }} />
                            </div>
                        </div>

                        {/* Chakra */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Chakra</span>
                                <span className="text-[10px] font-mono text-slate-400">{stats.chakra} / {stats.maxChakra}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${(stats.chakra / stats.maxChakra) * 100}%` }} />
                            </div>
                        </div>

                        {/* Experience */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Experience</span>
                                <span className="text-[10px] font-mono text-slate-400">{stats.experience} / {stats.nextLevelXp}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" style={{ width: `${(stats.experience / stats.nextLevelXp) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl font-black text-white">{stats.str}</div>
                            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Strength</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl font-black text-white">{stats.dex}</div>
                            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Dexterity</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl font-black text-white">{stats.int}</div>
                            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Intellect</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
