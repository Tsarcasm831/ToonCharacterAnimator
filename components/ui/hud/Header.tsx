import React from 'react';

interface HeaderProps {
    biome?: { name: string, color: string };
    activeScene?: string;
    onOpenTravel?: () => void;
    onToggleBestiary?: () => void;
    onChangeLand?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ biome, activeScene, onOpenTravel, onToggleBestiary, onChangeLand }) => {
    const isLand = activeScene === 'land';
    const isSingleBiome = activeScene === 'singleBiome';

    return (
        <div className="absolute top-4 md:top-8 left-0 w-full px-4 md:px-6 z-10 pointer-events-none flex flex-row items-start justify-between">
            <div className="flex gap-2 pointer-events-auto">
                <button 
                    onClick={onOpenTravel}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-blue-600/80 transition-all shadow-xl"
                >
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">Travel</span>
                </button>
                <button 
                    onClick={onToggleBestiary}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-red-600/80 transition-all shadow-xl"
                >
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">Bestiary</span>
                </button>
                {isSingleBiome && (
                    <button 
                        onClick={onChangeLand}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-green-600/80 transition-all shadow-xl"
                    >
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">Change Land</span>
                    </button>
                )}
            </div>

            {biome && (
                <div className="flex items-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex flex-col items-end">
                        <p className="text-white/60 text-[8px] md:text-[10px] tracking-widest uppercase">Current Location</p>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse" />
                            <span className="text-white font-bold tracking-wider text-[10px] md:text-sm uppercase whitespace-nowrap">
                                {biome?.name || (isLand ? 'Land' : activeScene)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
