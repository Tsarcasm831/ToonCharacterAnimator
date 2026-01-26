
import React from 'react';
import { ITEM_ICONS } from '../../../data/constants';
import { InventoryItem } from '../../../types';

interface PlayerBenchProps {
    inventory: (InventoryItem | null)[];
    selectedSlot: number;
    onSelectSlot: (index: number) => void;
}

export const PlayerBench: React.FC<PlayerBenchProps> = ({ inventory, selectedSlot, onSelectSlot }) => {
    const slots = Array.from({ length: 13 });

    return (
        <div className="flex gap-2 p-3 bg-slate-950/90 backdrop-blur-2xl rounded-[2rem] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)]">
            {slots.map((_, i) => {
                const item = inventory[i];
                return (
                    <div 
                        key={i}
                        onClick={() => onSelectSlot(i)}
                        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden group ${
                            selectedSlot === i 
                            ? 'bg-blue-600/40 border-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6),inset_0_0_15px_rgba(59,130,246,0.4)] -translate-y-3' 
                            : 'bg-slate-900/60 border border-white/5 hover:bg-slate-800/80 hover:border-white/20 hover:-translate-y-1'
                        }`}
                    >
                        {/* Inner Bezel Effect */}
                        <div className="absolute inset-[2px] rounded-2xl border border-white/5 pointer-events-none" />

                        {/* Slot Number */}
                        <span className={`absolute top-1 left-2 text-[8px] font-black transition-colors ${selectedSlot === i ? 'text-blue-300' : 'text-slate-600 group-hover:text-slate-400'}`}>
                            {i + 1}
                        </span>
                        
                        {item ? (
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-3xl drop-shadow-2xl transform group-hover:scale-110 transition-transform select-none">
                                    {ITEM_ICONS[item.name] || '📦'}
                                </span>
                                {item.count > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-blue-600 rounded-md px-1 py-0.5 min-w-[16px] text-center border border-white/20 shadow-lg">
                                        <span className="text-[8px] font-black text-white">{item.count}</span>
                                    </div>
                                )}
                                <div className={`absolute -bottom-8 group-hover:bottom-1 transition-all duration-300 bg-slate-950/90 px-1.5 py-0.5 rounded-md border border-white/10 whitespace-nowrap ${selectedSlot === i ? 'bottom-1 opacity-100' : 'opacity-0'}`}>
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-white">
                                        {item.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-white/5 group-hover:border-white/10 transition-colors opacity-40" />
                        )}

                        {/* Tactical Scanline Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none" />
                        {selectedSlot === i && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-pulse" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
