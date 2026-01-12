
import React from 'react';
import { StructureType } from '../../game/builder/BuildingParts';

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
];

export const BuilderUI: React.FC<BuilderUIProps> = ({ activeType, onSelectType }) => {
    return (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4 animate-fade-in-up">
            {/* Contextual Help */}
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest flex gap-4 shadow-xl">
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">R</kbd> Rotate</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">LMB</kbd> Build</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded border border-white/20">B</kbd> Exit</span>
            </div>

            {/* Part Selection */}
            <div className="flex gap-3 p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                {BUILD_PARTS.map((part) => (
                    <button
                        key={part.id}
                        onClick={() => onSelectType(part.id)}
                        className={`group relative flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-all duration-300 ${
                            activeType === part.id 
                            ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-110 -translate-y-2 border-2 border-white' 
                            : 'bg-white/10 hover:bg-white/20 border border-white/10'
                        }`}
                    >
                        <span className="text-3xl mb-1 drop-shadow-md">{part.icon}</span>
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
