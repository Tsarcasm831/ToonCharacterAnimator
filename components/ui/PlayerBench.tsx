
import React from 'react';
import { ITEM_ICONS } from '../../data/constants';
import { InventoryItem } from '../../types';

interface PlayerBenchProps {
    inventory: (InventoryItem | null)[];
    selectedSlot: number;
    onSelectSlot: (index: number) => void;
}

export const PlayerBench: React.FC<PlayerBenchProps> = ({ inventory, selectedSlot, onSelectSlot }) => {
    // Create an array of 13 slots
    const slots = Array.from({ length: 13 });

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
             {/* Container */}
             <div className="flex gap-2 p-3 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
                {slots.map((_, i) => {
                    const item = inventory[i];
                    return (
                        <div 
                            key={i}
                            onClick={() => onSelectSlot(i)}
                            className={`relative w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden group ${
                                selectedSlot === i 
                                ? 'bg-slate-700 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] -translate-y-2' 
                                : 'bg-slate-800/60 border border-white/10 hover:bg-slate-700/80 hover:border-white/30'
                            }`}
                        >
                            {/* Slot Number */}
                            <span className="absolute top-1 left-1.5 text-[10px] font-bold text-slate-500 group-hover:text-slate-300">
                                {i + 1}
                            </span>
                            
                            {item ? (
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-3xl drop-shadow-lg transform group-hover:scale-110 transition-transform select-none">
                                        {ITEM_ICONS[item.name] || '📦'}
                                    </span>
                                    {item.count > 1 && (
                                        <div className="absolute bottom-1 right-1 bg-black/80 rounded px-1.5 py-0.5 min-w-[16px] text-center border border-white/10">
                                            <span className="text-[9px] font-bold text-white">{item.count}</span>
                                        </div>
                                    )}
                                    <span className={`absolute -bottom-6 text-[8px] font-black uppercase tracking-tight transition-all duration-200 group-hover:bottom-1 bg-black/80 px-1 rounded ${selectedSlot === i ? 'text-white bottom-1' : 'text-gray-300'}`}>
                                        {item.name}
                                    </span>
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/5 group-hover:border-white/10 transition-colors" />
                            )}

                            {/* Shine effect */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        </div>
                    );
                })}
             </div>
        </div>
    );
};
