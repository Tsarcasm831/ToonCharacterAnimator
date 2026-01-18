
import React, { useState } from 'react';
import { Archer } from '../../game/entities/npc/enemy/Archer';
import { Assassin } from '../../game/entities/npc/enemy/Assassin';
import { Bandit } from '../../game/entities/npc/enemy/Bandit';
import { Berserker } from '../../game/entities/npc/enemy/Berserker';
import { Knight } from '../../game/entities/npc/enemy/Knight';
import { Mage } from '../../game/entities/npc/enemy/Mage';
import { Rogue } from '../../game/entities/npc/enemy/Rogue';
import { Warlock } from '../../game/entities/npc/enemy/Warlock';
import { Paladin } from '../../game/entities/npc/friendly/Paladin';
import { Ranger } from '../../game/entities/npc/friendly/Ranger';
import { Monk } from '../../game/entities/npc/friendly/Monk';
import { Cleric } from '../../game/entities/npc/friendly/Cleric';
import { Sentinel } from '../../game/entities/npc/friendly/Sentinel';
import { EnemyPreview } from './EnemyPreview';

interface EnemiesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ENEMIES = [
    { id: 'archer', name: 'Archer', description: 'Ranged combatant using precise bow attacks.', class: Archer },
    { id: 'assassin', name: 'Assassin', description: 'Quick and deadly, specializes in critical strikes.', class: Assassin },
    { id: 'bandit', name: 'Bandit', description: 'A common ruffian with balanced combat skills.', class: Bandit },
    { id: 'berserker', name: 'Berserker', description: 'Sacrifices defense for overwhelming raw power.', class: Berserker },
    { id: 'knight', name: 'Knight', description: 'Heavily armored warrior with high survivability.', class: Knight },
    { id: 'mage', name: 'Mage', description: 'Wielder of arcane energies and elemental spells.', class: Mage },
    { id: 'rogue', name: 'Rogue', description: 'Master of stealth and rapid dual-wield attacks.', class: Rogue },
    { id: 'warlock', name: 'Warlock', description: 'Commands dark magic and debilitating curses.', class: Warlock },
];

const ALLIES = [
    { id: 'paladin', name: 'Paladin', description: 'Holy warrior wielding divine power and righteous fury.', class: Paladin },
    { id: 'ranger', name: 'Ranger', description: 'Forest protector skilled in archery and tracking.', class: Ranger },
    { id: 'monk', name: 'Monk', description: 'Martial artist with lightning-fast unarmed strikes.', class: Monk },
    { id: 'cleric', name: 'Cleric', description: 'Divine healer channeling holy light to aid allies.', class: Cleric },
    { id: 'sentinel', name: 'Sentinel', description: 'Stalwart defender who holds the line against foes.', class: Sentinel },
];

export const EnemiesModal: React.FC<EnemiesModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'enemies' | 'allies'>('enemies');
    
    if (!isOpen) return null;

    const currentList = activeTab === 'enemies' ? ENEMIES : ALLIES;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border-2 border-white/10 rounded-3xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Combat Bestiary</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Combatants of the Arena</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors group"
                    >
                        <svg className="w-8 h-8 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-8 py-4 border-b border-white/5 flex gap-4">
                    <button
                        onClick={() => setActiveTab('enemies')}
                        className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs transition-all ${
                            activeTab === 'enemies' 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        👹 Enemies ({ENEMIES.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('allies')}
                        className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs transition-all ${
                            activeTab === 'allies' 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        ⚔️ Allies ({ALLIES.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentList.map((entity) => (
                            <div 
                                key={entity.id}
                                className={`group bg-black/40 border rounded-2xl p-6 flex gap-6 hover:bg-white/5 transition-all duration-300 ${
                                    activeTab === 'enemies' 
                                        ? 'border-red-900/20 hover:border-red-500/40' 
                                        : 'border-emerald-900/20 hover:border-emerald-500/40'
                                }`}
                            >
                                <div className={`w-32 h-32 bg-slate-800 rounded-xl overflow-hidden border transition-colors shrink-0 ${
                                    activeTab === 'enemies'
                                        ? 'border-red-900/30 group-hover:border-red-500/50'
                                        : 'border-emerald-900/30 group-hover:border-emerald-500/50'
                                }`}>
                                    <EnemyPreview type={entity.id} />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className={`text-xl font-black uppercase tracking-wider transition-colors ${
                                        activeTab === 'enemies'
                                            ? 'text-white group-hover:text-red-400'
                                            : 'text-white group-hover:text-emerald-400'
                                    }`}>
                                        {entity.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                        {entity.description}
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            activeTab === 'enemies'
                                                ? 'bg-red-900/30 text-red-400'
                                                : 'bg-emerald-900/30 text-emerald-400'
                                        }`}>
                                            {activeTab === 'enemies' ? 'Enemy' : 'Ally'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-white/5 bg-white/5 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-lg"
                    >
                        Close Bestiary
                    </button>
                </div>
            </div>
        </div>
    );
};
