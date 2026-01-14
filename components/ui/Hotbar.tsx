
import React from 'react';
import { ITEM_ICONS } from '../../data/constants';
import { InventoryItem } from '../../types';

interface HotbarProps {
    inventory: (InventoryItem | null)[];
    selectedSlot: number;
    onSelectSlot: (index: number) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({ inventory, selectedSlot, onSelectSlot }) => {
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2 p-2 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {Array.from({ length: 8 }).map((_, i) => {
                const item = inventory[i];
                return (
                    <div 
                        key={i}
                        onClick={() => onSelectSlot(i)}
                        className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden group ${
                            selectedSlot === i 
                            ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-110 -translate-y-2 border-2 border-white' 
                            : 'bg-white/40 hover:bg-white/60 border border-white/20'
                        }`}
                    >
                        <span className={`absolute top-1 left-1.5 text-[10px] font-black pointer-events-none ${selectedSlot === i ? 'text-blue-200' : 'text-gray-500'}`}>
                            {i + 1}
                        </span>
                        
                        {item ? (
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-2xl drop-shadow-md select-none">{ITEM_ICONS[item.name] || '📦'}</span>
                                <span className={`text-[8px] font-bold uppercase mt-0.5 tracking-tight ${selectedSlot === i ? 'text-white' : 'text-gray-700'}`}>
                                    {item.name}
                                </span>
                                {item.count > 1 && (
                                    <div className="absolute top-1 right-1 bg-black/60 rounded px-1 min-w-[12px] text-center border border-white/10">
                                        <span className="text-[8px] font-black text-white">{item.count}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`w-6 h-6 rounded-md border-2 border-dashed ${selectedSlot === i ? 'border-blue-300/40' : 'border-gray-400/20'}`} />
                        )}

                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                    </div>
                );
            })}
        </div>
    );
};
