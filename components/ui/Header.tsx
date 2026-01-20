import React from 'react';

interface HeaderProps {
    biome?: { name: string, color: string };
    activeScene?: string;
    onToggleWorldMap?: () => void;
    onToggleBestiary?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ biome, activeScene, onToggleWorldMap, onToggleBestiary }) => {
    const isLand = activeScene === 'land';

    return (
        <div className="absolute top-6 md:top-8 left-0 w-full p-6 z-10 pointer-events-none flex flex-col md:flex-row items-start justify-between">
            <div className="flex gap-2 pointer-events-auto">
                <button 
                    onClick={onToggleWorldMap}
                    className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-blue-600/80 transition-all shadow-xl"
                >
                    <span className="text-xs font-black uppercase tracking-widest text-white">Travel</span>
                </button>
                <button 
                    onClick={onToggleBestiary}
                    className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-red-600/80 transition-all shadow-xl"
                >
                    <span className="text-xs font-black uppercase tracking-widest text-white">Bestiary</span>
                </button>
            </div>

            {biome && (
                <div className="mt-4 md:mt-0 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex flex-col items-end">
                        <p className="text-white/60 text-[10px] tracking-widest uppercase">Current Location</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse" />
                            <span className="text-white font-bold tracking-wider text-sm uppercase">
                                {isLand ? 'Land' : activeScene}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
