
import React from 'react';
import { ITEM_ICONS, ITEM_IMAGES } from '../../../data/constants';
import { InventoryItem, EntityStats } from '../../../types';

interface HotbarProps {
    inventory: (InventoryItem | null)[];
    selectedSlot: number;
    onSelectSlot: (index: number) => void;
    stats: EntityStats;
}

export const Hotbar: React.FC<HotbarProps> = ({ inventory, selectedSlot, onSelectSlot, stats }) => {
    const healthPercent = (stats.health / stats.maxHealth) * 100;
    const chakraPercent = (stats.chakra / stats.maxChakra) * 100;
    const xpPercent = (stats.xp / stats.maxXp) * 100;

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
            
            <div className="flex items-center gap-4">
                {/* Health Bubble (Left) */}
                <div className="relative w-16 h-16 rounded-full border-2 border-red-900/50 bg-black/60 shadow-[0_0_20px_rgba(220,38,38,0.3)] overflow-hidden shrink-0 group">
                    <div 
                        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-900 via-red-600 to-red-500 transition-all duration-500 ease-out"
                        style={{ height: `${healthPercent}%` }}
                    />
                    <div className="absolute inset-0 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] rounded-full" />
                    {/* Gloss */}
                    <div className="absolute top-2 left-3 w-4 h-2 bg-white/20 rounded-full blur-[2px]" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-black text-white/90 drop-shadow-md group-hover:opacity-100 opacity-0 transition-opacity">
                            {Math.round(stats.health)}
                        </span>
                    </div>
                </div>

                {/* Hotbar Slots Container */}
                <div className="flex gap-2 p-2 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
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
                                    <div className="flex flex-col items-center justify-center w-full h-full">
                                        {ITEM_IMAGES[item.name] ? (
                                            <img src={ITEM_IMAGES[item.name]} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl drop-shadow-md select-none">{ITEM_ICONS[item.name] || '📦'}</span>
                                        )}
                                        
                                        {!ITEM_IMAGES[item.name] && (
                                            <span className={`text-[8px] font-bold uppercase mt-0.5 tracking-tight ${selectedSlot === i ? 'text-white' : 'text-gray-700'}`}>
                                                {item.name}
                                            </span>
                                        )}
                                        
                                        {item.count > 1 && (
                                            <div className="absolute top-1 right-1 bg-black/60 rounded px-1 min-w-[12px] text-center border border-white/10 z-10">
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

                {/* Chakra Bubble (Right) */}
                <div className="relative w-16 h-16 rounded-full border-2 border-blue-900/50 bg-black/60 shadow-[0_0_20px_rgba(37,99,235,0.3)] overflow-hidden shrink-0 group">
                    <div 
                        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-900 via-blue-600 to-blue-500 transition-all duration-500 ease-out"
                        style={{ height: `${chakraPercent}%` }}
                    />
                    <div className="absolute inset-0 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] rounded-full" />
                    {/* Gloss */}
                    <div className="absolute top-2 left-3 w-4 h-2 bg-white/20 rounded-full blur-[2px]" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-black text-white/90 drop-shadow-md group-hover:opacity-100 opacity-0 transition-opacity">
                            {Math.round(stats.chakra)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Experience Bar */}
            <div className="w-[480px] h-2 bg-black/60 border border-white/10 rounded-full overflow-hidden shadow-lg relative group">
                 <div 
                    className="h-full bg-gradient-to-r from-yellow-600 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                    style={{ width: `${xpPercent}%` }}
                 />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[8px] font-bold text-white drop-shadow-md uppercase tracking-wider">
                         XP {Math.floor(stats.xp)} / {stats.maxXp}
                     </span>
                 </div>
            </div>

        </div>
    );
};
