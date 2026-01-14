
import React from 'react';
import { AnimalPreview } from './AnimalPreview';

interface SpawnAnimalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSpawn: (type: string, count: number) => void;
}

const ANIMALS = [
    { id: 'wolf', name: 'Wolf', rarity: 'Aggressive', color: 'text-red-400' },
    { id: 'bear', name: 'Bear', rarity: 'Aggressive', color: 'text-red-400' },
    { id: 'spider', name: 'Giant Spider', rarity: 'Aggressive', color: 'text-red-400' },
    { id: 'deer', name: 'Deer', rarity: 'Neutral', color: 'text-emerald-400' },
    { id: 'horse', name: 'Horse', rarity: 'Tameable', color: 'text-blue-400' },
    { id: 'sheep', name: 'Sheep', rarity: 'Neutral', color: 'text-emerald-400' },
    { id: 'pig', name: 'Pig', rarity: 'Neutral', color: 'text-emerald-400' },
    { id: 'chicken', name: 'Chicken', rarity: 'Neutral', color: 'text-emerald-400' },
    { id: 'lizard', name: 'Lizard', rarity: 'Neutral', color: 'text-emerald-400' },
    { id: 'owl', name: 'Owl', rarity: 'Ambient', color: 'text-slate-400' },
    { id: 'yeti', name: 'Yeti', rarity: 'Mythical', color: 'text-purple-400' },
];

export const SpawnAnimalsModal: React.FC<SpawnAnimalsModalProps> = ({ isOpen, onClose, onSpawn }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[80vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Spawn Wildlife</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Populate the world with creatures</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
                    {ANIMALS.map((animal) => (
                        <div key={animal.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex flex-col items-center group hover:border-blue-500/30 transition-all">
                            <div className="w-full aspect-square bg-black/40 rounded-lg overflow-hidden mb-4 relative">
                                <AnimalPreview type={animal.id} />
                                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[8px] font-black uppercase tracking-widest ${animal.color}`}>
                                    {animal.rarity}
                                </div>
                            </div>
                            
                            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-4">{animal.name}</h3>
                            
                            <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                                <button 
                                    onClick={() => onSpawn(animal.id, 1)}
                                    className="py-2 rounded-lg bg-slate-700 text-white text-[10px] font-black uppercase tracking-tighter hover:bg-blue-600 transition-colors"
                                >
                                    Spawn 1
                                </button>
                                <button 
                                    onClick={() => onSpawn(animal.id, 5)}
                                    className="py-2 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-tighter hover:bg-blue-500 transition-colors shadow-lg"
                                >
                                    Spawn 5
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 bg-slate-800/30 flex justify-center">
                    <button onClick={onClose} className="px-8 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-blue-400 hover:text-white transition-all active:scale-95">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
