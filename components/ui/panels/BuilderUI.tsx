
import React, { useState, useCallback } from 'react';
import { StructureType } from '../../../game/builder/BuildingParts';

interface BuilderUIProps {
    activeType: StructureType;
    onSelectType: (type: StructureType) => void;
}

const BUILD_PARTS: { id: StructureType, label: string, icon: string }[] = [
    { id: 'foundation', label: 'Foundation', icon: '🧱' },
    { id: 'wall', label: 'Wall', icon: '🪵' },
    { id: 'doorway', label: 'Doorway', icon: '⛩️' },
    { id: 'door', label: 'Door', icon: '🚪' },
    { id: 'roof', label: 'Roof', icon: '🏠' },
    { id: 'palisade', label: 'Palisade', icon: '🪵' },
    { id: 'event_tent', label: 'Marquee', icon: '🎪' },
    { id: 'firepit', label: 'Firepit', icon: '🔥' },
    { id: 'potion_tent', label: 'Witch Hut', icon: '🧙‍♀️' },
    { id: 'supply_cart', label: 'Cart', icon: '🛒' },
    { id: 'stone_wall', label: 'Stone Wall', icon: '🪨' },
    { id: 'torch', label: 'Torch', icon: '🕯️' },
    { id: 'wooden_wall', label: 'Fence', icon: '🪜' },
    { id: 'flag', label: 'Flag', icon: '🚩' },
    { id: 'lightpole', label: 'Lightpole', icon: '💡' },
    { id: 'barrel', label: 'Barrel', icon: '🛢️' },
    { id: 'crate', label: 'Crate', icon: '📦' },
    { id: 'tire', label: 'Tire', icon: '⭕' },
    { id: 'pallet', label: 'Pallet', icon: '🪵' },
    { id: 'road_sign', label: 'Sign', icon: '🛑' },
    { id: 'blueprint_forge', label: 'Forge', icon: '⚒️' },
    { id: 'blueprint_cottage', label: 'Cottage', icon: '🏡' },
    { id: 'blueprint_longhouse', label: 'Longhouse', icon: '🛖' },
    { id: 'blueprint_l_shape', label: 'Mansion', icon: '🏘️' },
    { id: 'blueprint_roundhouse', label: 'Roundhouse', icon: '🏟️' },
    { id: 'blueprint_gatehouse', label: 'Gatehouse', icon: '🏰' },
];

export const BuilderUI: React.FC<BuilderUIProps> = ({ activeType, onSelectType }) => {
    const [lastSelectTime, setLastSelectTime] = useState(0);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    
    const DEBOUNCE_TIME = 150; // ms between selections

    const handleSelectType = useCallback((type: StructureType) => {
        const currentTime = Date.now();
        if (currentTime - lastSelectTime >= DEBOUNCE_TIME) {
            setLastSelectTime(currentTime);
            setSelectedItemId(type);
            onSelectType(type);
        }
    }, [lastSelectTime, onSelectType]);

    return (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4 animate-fade-in-up w-full max-w-4xl">
            {/* Contextual Help */}
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest flex gap-4 shadow-xl">
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">1-5</kbd> Select</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">R</kbd> Rotate</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">Enter</kbd> Build</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">B</kbd> Exit</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">.</kbd> Log</span>
            </div>

            {/* Part Selection */}
            <div className="flex gap-2 p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-x-auto max-w-full no-scrollbar">
                {BUILD_PARTS.map((part) => (
                    <button
                        key={part.id}
                        onClick={() => handleSelectType(part.id)}
                        className={`group relative flex flex-col items-center justify-center min-w-[5rem] h-20 rounded-xl transition-all duration-300 ${
                            activeType === part.id 
                            ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-105 -translate-y-2 border-2 border-white' 
                            : 'bg-white/10 hover:bg-white/20 border border-white/10'
                        }`}
                    >
                        <span className="text-2xl mb-1 drop-shadow-md">{part.icon}</span>
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${activeType === part.id ? 'text-white' : 'text-gray-400'}`}>
                            {part.label}
                        </span>
                        
                        {/* Hover Highlight */}
                        <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>
                ))}
            </div>
        </div>
    );
};
