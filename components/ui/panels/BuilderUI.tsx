
import React, { useState, useCallback } from 'react';
import { StructureType } from '../../../game/builder/BuildingParts';
import { BUILDING_COSTS } from '../../../data/constants';

interface BuilderUIProps {
    activeType: StructureType;
    onSelectType: (type: StructureType) => void;
}

const BUILD_PARTS: { id: StructureType, label: string, icon: string, description: string }[] = [
    { id: 'foundation', label: 'Foundation', icon: '🧱', description: 'A flat base for starting a structure.' },
    { id: 'wall', label: 'Wall', icon: '🪵', description: 'A basic wooden wall segment.' },
    { id: 'doorway', label: 'Doorway', icon: '⛩️', description: 'An opening for adding a door.' },
    { id: 'door', label: 'Door', icon: '🚪', description: 'A working door for a doorway.' },
    { id: 'roof', label: 'Roof', icon: '🏠', description: 'A sloped cover for buildings.' },
    { id: 'palisade', label: 'Palisade', icon: '🪵', description: 'A defensive wooden wall.' },
    { id: 'event_tent', label: 'Marquee', icon: '🎪', description: 'A decorative gathering tent.' },
    { id: 'firepit', label: 'Firepit', icon: '🔥', description: 'A campfire ring for warmth and cooking.' },
    { id: 'potion_tent', label: 'Witch Hut', icon: '🧙‍♀️', description: 'A small alchemy workspace.' },
    { id: 'supply_cart', label: 'Cart', icon: '🛒', description: 'A cart for supplies and camp clutter.' },
    { id: 'stone_wall', label: 'Stone Wall', icon: '🪨', description: 'A rugged stone barrier.' },
    { id: 'torch', label: 'Torch', icon: '🕯️', description: 'A small standing light source.' },
    { id: 'wooden_wall', label: 'Fence', icon: '🪜', description: 'A simple wooden fence.' },
    { id: 'flag', label: 'Flag', icon: '🚩', description: 'A banner marker for your camp.' },
    { id: 'lightpole', label: 'Lightpole', icon: '💡', description: 'A taller camp light.' },
    { id: 'barrel', label: 'Barrel', icon: '🛢️', description: 'Storage clutter for camps and roads.' },
    { id: 'crate', label: 'Crate', icon: '📦', description: 'A wooden storage crate.' },
    { id: 'tire', label: 'Tire', icon: '⭕', description: 'A discarded tire prop.' },
    { id: 'pallet', label: 'Pallet', icon: '🪵', description: 'A stackable wooden pallet.' },
    { id: 'road_sign', label: 'Sign', icon: '🛑', description: 'A roadside marker.' },
    { id: 'animal_pen', label: 'Animal Pen', icon: '🐷', description: 'A fenced pen for animals.' },
    { id: 'blueprint_forge', label: 'Forge', icon: '⚒️', description: 'A complete forge blueprint.' },
    { id: 'blueprint_cottage', label: 'Cottage', icon: '🏡', description: 'A small home blueprint.' },
    { id: 'blueprint_longhouse', label: 'Longhouse', icon: '🛖', description: 'A large communal hall blueprint.' },
    { id: 'blueprint_l_shape', label: 'Mansion', icon: '🏘️', description: 'A larger L-shaped home blueprint.' },
    { id: 'blueprint_roundhouse', label: 'Roundhouse', icon: '🏟️', description: 'A circular building blueprint.' },
    { id: 'blueprint_gatehouse', label: 'Gatehouse', icon: '🏰', description: 'A fortified entry blueprint.' },
];

export const BuilderUI: React.FC<BuilderUIProps> = ({ activeType, onSelectType }) => {
    const [lastSelectTime, setLastSelectTime] = useState(0);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [hoveredPartId, setHoveredPartId] = useState<StructureType | null>(null);
    const activePart = BUILD_PARTS.find(part => part.id === activeType);
    const hoveredPart = BUILD_PARTS.find(part => part.id === hoveredPartId);
    
    const DEBOUNCE_TIME = 150; // ms between selections

    const handleSelectType = useCallback((type: StructureType) => {
        const currentTime = Date.now();
        if (currentTime - lastSelectTime >= DEBOUNCE_TIME) {
            setLastSelectTime(currentTime);
            setSelectedItemId(type);
            onSelectType(type);
        }
    }, [lastSelectTime, onSelectType]);

    const getCostText = (type: StructureType) => {
        const cost = BUILDING_COSTS[type];
        if (!cost) return 'Free';
        const parts = Object.entries(cost).map(([name, amount]) => `${amount} ${name}`);
        return parts.length ? parts.join(' + ') : 'Free';
    };

    return (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 animate-fade-in-up w-full max-w-4xl">
            {hoveredPart && (
                <div className="absolute bottom-full left-1/2 z-50 mb-3 w-64 -translate-x-1/2 rounded-2xl border border-emerald-400/30 bg-black/90 p-3 text-white shadow-2xl shadow-emerald-950/50 backdrop-blur-xl pointer-events-none">
                    <div className="flex gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-3xl">
                            {hoveredPart.icon}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-black uppercase tracking-wider text-emerald-300">{hoveredPart.label}</div>
                            <div className="mt-1 text-xs leading-snug text-stone-300">{hoveredPart.description}</div>
                            <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-amber-300">Cost: {getCostText(hoveredPart.id)}</div>
                        </div>
                    </div>
                </div>
            )}
            {/* Contextual Help */}
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest flex flex-wrap items-center gap-4 shadow-xl">
                <span className="flex items-center gap-1.5 text-white">
                    <span className="text-white/60">Building</span>
                    <span className="font-black text-white">
                        {activePart ? `${activePart.icon} ${activePart.label}` : 'Select Part'}
                    </span>
                </span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">Left Click</kbd> Select / Place / Confirm</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">Right Click</kbd> Cancel</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">R</kbd> Rotate</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">B</kbd> Exit</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">.</kbd> Log</span>
            </div>

            {/* Part Selection */}
            <div className="flex gap-2 p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-x-auto max-w-full no-scrollbar">
                {BUILD_PARTS.map((part) => (
                    <button type="button"
                        key={part.id}
                        onClick={() => handleSelectType(part.id)}
                        onMouseEnter={() => setHoveredPartId(part.id)}
                        onMouseLeave={() => setHoveredPartId(null)}
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
