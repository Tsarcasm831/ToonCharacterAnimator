
import React from 'react';

interface HeaderProps {
    biome?: { name: string, color: string };
}

export const Header: React.FC<HeaderProps> = ({ biome }) => (
    <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex flex-col md:flex-row md:items-start justify-end">
        {biome && (
            <div className="mt-4 md:mt-0 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Current Location</span>
                    <div 
                        className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl flex items-center gap-2 group transition-all"
                        style={{ boxShadow: `0 4px 15px -3px ${biome.color}44` }}
                    >
                        <div 
                            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                            style={{ backgroundColor: biome.color }}
                        />
                        <span className="text-white text-xs font-black uppercase tracking-widest group-hover:scale-105 transition-transform">
                            {biome.name}
                        </span>
                    </div>
                </div>
            </div>
        )}
    </div>
);
