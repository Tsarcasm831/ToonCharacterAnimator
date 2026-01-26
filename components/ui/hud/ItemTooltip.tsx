
import React from 'react';
import { ItemData } from '../../../types';
import { ITEM_ICONS, ITEM_IMAGES } from '../../../data/constants';

interface ItemTooltipProps {
    item: ItemData | null;
    x: number;
    y: number;
    visible: boolean;
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({
    item,
    x,
    y,
    visible
}) => {
    if (!visible || !item) return null;

    const rarityColors = {
        common: 'text-stone-400',
        uncommon: 'text-green-400',
        rare: 'text-blue-400',
        epic: 'text-purple-400',
        legendary: 'text-orange-400'
    };

    const typeColors = {
        weapon: 'bg-red-900/20 text-red-400 border-red-900/50',
        armor: 'bg-blue-900/20 text-blue-400 border-blue-900/50',
        consumable: 'bg-green-900/20 text-green-400 border-green-900/50',
        material: 'bg-amber-900/20 text-amber-400 border-amber-900/50',
        quest: 'bg-purple-900/20 text-purple-400 border-purple-900/50'
    };

    const itemImage = ITEM_IMAGES[item.name];

    return (
        <div 
            className="fixed z-[1000] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            style={{ 
                left: x + 20, 
                top: y,
                transform: 'translateY(-50%)'
            }}
        >
            <div className="bg-[#0c0a09]/95 backdrop-blur-md rounded border-2 border-[#4a3b2a] shadow-2xl p-4 min-w-[220px] max-w-[300px] font-serif">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-[#4a3b2a]/50">
                    <div className="w-12 h-12 flex items-center justify-center bg-black/40 border border-[#4a3b2a]/30 rounded overflow-hidden flex-shrink-0">
                        {itemImage ? (
                            <img src={itemImage} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl filter drop-shadow-md">
                                {ITEM_ICONS[item.name] || '📦'}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-lg font-bold tracking-wide leading-tight ${rarityColors[item.rarity]}`}>
                            {item.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">
                            {item.rarity} {item.type}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-stone-300 italic mb-4 leading-relaxed">
                    "{item.description}"
                </p>

                {/* Stats */}
                {item.stats && Object.keys(item.stats).length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#4a3b2a]/30">
                        {item.stats.damage && (
                            <div className="flex justify-between text-xs">
                                <span className="text-stone-500">Damage</span>
                                <span className="text-red-400 font-bold">+{item.stats.damage}</span>
                            </div>
                        )}
                        {item.stats.defense && (
                            <div className="flex justify-between text-xs">
                                <span className="text-stone-500">Defense</span>
                                <span className="text-blue-400 font-bold">+{item.stats.defense}</span>
                            </div>
                        )}
                        {item.stats.healthBonus && (
                            <div className="flex justify-between text-xs">
                                <span className="text-stone-500">Health</span>
                                <span className="text-green-400 font-bold">+{item.stats.healthBonus}</span>
                            </div>
                        )}
                        {item.stats.manaBonus && (
                            <div className="flex justify-between text-xs">
                                <span className="text-stone-500">Mana</span>
                                <span className="text-purple-400 font-bold">+{item.stats.manaBonus}</span>
                            </div>
                        )}
                        {item.stats.speedBonus && (
                            <div className="flex justify-between text-xs">
                                <span className="text-stone-500">Speed</span>
                                <span className="text-yellow-400 font-bold">+{item.stats.speedBonus}</span>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Type Badge */}
                <div className="mt-4 flex justify-end">
                    <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-tighter ${typeColors[item.type]}`}>
                        {item.type}
                    </span>
                </div>
            </div>
        </div>
    );
};
