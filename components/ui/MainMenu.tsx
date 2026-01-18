
import React from 'react';
import { MenuBackground } from './MenuBackground';

interface MainMenuProps {
    onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center">
            <MenuBackground />
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                <div className="text-center space-y-8 p-12 rounded-3xl bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-sm animate-fade-in">
                    <div className="space-y-2">
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                            ANIMATOR<span className="text-blue-500">3D</span>
                        </h1>
                        <p className="text-slate-400 text-sm md:text-base font-bold uppercase tracking-[0.4em] drop-shadow-md">
                            Interactive Character Studio
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 items-center">
                        <button 
                            onClick={onStart}
                            className="px-16 py-5 bg-white text-black font-black text-xl uppercase tracking-widest rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] active:scale-95 transform hover:-translate-y-1"
                        >
                            Enter World
                        </button>
                        
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-4 opacity-70">
                            Press Start to Begin
                        </p>
                    </div>
                </div>
                
                <div className="absolute bottom-8 text-center text-white/20 text-[10px] font-mono">
                    v1.0.0 • React • Three.js
                </div>
            </div>
        </div>
    );
};
