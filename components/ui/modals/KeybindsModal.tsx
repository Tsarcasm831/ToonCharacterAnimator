
import React from 'react';

interface KeybindsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = [
    {
        title: "Movement",
        binds: [
            { keys: ["W", "A", "S", "D"], label: "Movement" },
            { keys: ["Shift"], label: "Run" },
            { keys: ["Space"], label: "Jump" },
            { keys: ["V"], label: "POV Mode" },
            { keys: ["X"], label: "Camera Focus Cycle" },
        ]
    },
    {
        title: "Combat & Action",
        binds: [
            { keys: ["LMB"], label: "Attack / Cast (Fishing)" },
            { keys: ["R"], label: "Cast Fireball" },
            { keys: ["C"], label: "Combat Stance" },
            { keys: ["E"], label: "Interact / Talk" },
            { keys: ["F"], label: "Pick Up / Skin" },
            { keys: ["L"], label: "Summon Skill" },
            { keys: ["1-8"], label: "Equip Hotbar Slot" },
        ]
    },
    {
        title: "Building",
        binds: [
            { keys: ["B"], label: "Toggle Build Mode" },
            { keys: ["T"], label: "Rotate Ghost (Build Mode)" },
            { keys: ["LMB"], label: "Place Structure" },
        ]
    },
    {
        title: "System & Debug",
        binds: [
            { keys: ["`"], label: "Toggle this list" },
            { keys: ["I"], label: "Inventory" },
            { keys: ["Q"], label: "Quest Log" },
            { keys: ["M"], label: "Land Map" },
            { keys: ["T"], label: "World Grid Overlay" },
            { keys: ["U"], label: "Obstacle Hitboxes" },
            { keys: ["G"], label: "Player Hitboxes" },
            { keys: ["J"], label: "Skeleton Mode" },
            { keys: ["H"], label: "Hands Debug" },
            { keys: ["K"], label: "Die / Ragdoll" },
            { keys: ["]"], label: "Teleport to Town" },
        ]
    }
];

export const KeybindsModal: React.FC<KeybindsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Command Reference</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Master your avatar</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[70vh] grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <div key={cat.title} className="space-y-4">
                            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border-l-2 border-blue-500 pl-3">
                                {cat.title}
                            </h3>
                            <div className="space-y-2.5">
                                {cat.binds.map((bind) => (
                                    <div key={bind.label} className="flex items-center justify-between group">
                                        <span className="text-slate-300 text-xs font-medium group-hover:text-white transition-colors">{bind.label}</span>
                                        <div className="flex gap-1">
                                            {bind.keys.map(k => (
                                                <kbd key={k} className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded shadow-inner text-[10px] font-black text-white min-w-[24px] text-center">
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-800/30 flex justify-center">
                    <button 
                        onClick={onClose}
                        className="px-8 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-blue-400 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
