
import React from 'react';
import { MenuBackground } from './MenuBackground';
import { Units } from '../pages/Units';
import { Map } from '../pages/Map';
import { X } from 'lucide-react';

interface MainMenuProps {
    onStart: (startInCombat: boolean, startInLand: boolean, startInDev: boolean, startInTown: boolean, startInSingleBiome: boolean) => void;
    onShowEnemies: () => void;
    isMobile?: boolean;
    showVideoBackground?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, onShowEnemies, isMobile = false, showVideoBackground = false }) => {
    const [startInCombat, setStartInCombat] = React.useState(false);
    const [startInLand, setStartInLand] = React.useState(false);
    const [startInDev, setStartInDev] = React.useState(false);
    const [startInTown, setStartInTown] = React.useState(false);
    const [startInSingleBiome, setStartInSingleBiome] = React.useState(false);
    const [showOptions, setShowOptions] = React.useState(false);
    const [showUnits, setShowUnits] = React.useState(false);
    const [showMap, setShowMap] = React.useState(false);
    const hideControls = isMobile;

    React.useEffect(() => {
        if (!showUnits && !showMap) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowUnits(false);
                setShowMap(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showUnits, showMap]);

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center">
            <MenuBackground showVideo={showVideoBackground} />
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                {!hideControls && (
                    <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in">
                        <button
                            type="button"
                            onClick={() => setShowUnits(true)}
                            className="px-8 py-2 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-full border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                        >
                            Open Units Roster
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowMap(true)}
                            className="px-8 py-2 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-full border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                        >
                            Open World Map
                        </button>
                    </div>
                )}
                <div className="text-center space-y-8 p-12 rounded-3xl bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-sm animate-fade-in">
                    {isMobile && (
                        <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl px-6 py-4 backdrop-blur-md animate-pulse">
                            <p className="text-[10px] text-blue-300 uppercase tracking-[0.3em] font-bold">Mobile Notice</p>
                            <p className="mt-1 text-sm font-black text-white uppercase tracking-wider">Better on Desktop</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                            SAIRON<span className="text-blue-500">RPG</span>
                        </h1>
                        <p className="text-slate-400 text-sm md:text-base font-bold uppercase tracking-[0.4em] drop-shadow-md">
                            Interactive Character Studio and Game
                        </p>
                    </div>

                    {!hideControls && (
                        <div className="flex flex-col gap-6 items-center">
                            <button 
                                type="button"
                                onClick={() => onStart(startInCombat, startInLand, startInDev, startInTown, startInSingleBiome)}
                                className="px-16 py-5 bg-white text-black font-black text-xl uppercase tracking-widest rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] active:scale-95 transform hover:-translate-y-1"
                            >
                                Enter World
                            </button>

                            <button
                                type="button"
                                aria-expanded={showOptions}
                                className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer"
                                onClick={() => setShowOptions(!showOptions)}
                            >
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${showOptions ? 'bg-purple-500 border-purple-400' : 'border-white/20 group-hover:border-white/40'}`}>
                                    {showOptions && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-slate-300 text-xs font-black uppercase tracking-widest select-none">Scene Options</span>
                            </button>

                            {showOptions && (
                                <div className="flex flex-col gap-4 items-center animate-fade-in">
                                    <button
                                        type="button"
                                        aria-pressed={startInDev}
                                        className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                        onClick={() => {
                                            const next = !startInDev;
                                            setStartInDev(next);
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${startInDev ? 'bg-green-500 border-green-400' : 'border-white/20 group-hover:border-white/30'}`}>
                                            {startInDev && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">Dev Scene</span>
                                    </button>

                                    <button
                                        type="button"
                                        aria-pressed={startInCombat}
                                        className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                        onClick={() => {
                                            const next = !startInCombat;
                                            setStartInCombat(next);
                                            if (next) {
                                                setStartInLand(false);
                                                setStartInTown(false);
                                            }
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${startInCombat ? 'bg-blue-500 border-blue-400' : 'border-white/20 group-hover:border-white/30'}`}>
                                            {startInCombat && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">Combat Arena</span>
                                    </button>

                                    <button
                                        type="button"
                                        aria-pressed={startInLand}
                                        className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                        onClick={() => {
                                            const next = !startInLand;
                                            setStartInLand(next);
                                            if (next) {
                                                setStartInCombat(false);
                                                setStartInTown(false);
                                            }
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${startInLand ? 'bg-blue-500 border-blue-400' : 'border-white/20 group-hover:border-white/30'}`}>
                                            {startInLand && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">Land Scene</span>
                                    </button>

                                    
                                    <button
                                        type="button"
                                        aria-pressed={startInTown}
                                        className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                        onClick={() => {
                                            const next = !startInTown;
                                            setStartInTown(next);
                                            if (next) {
                                                setStartInCombat(false);
                                                setStartInLand(false);
                                                setStartInSingleBiome(false);
                                            }
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${startInTown ? 'bg-blue-500 border-blue-400' : 'border-white/20 group-hover:border-white/30'}`}>
                                            {startInTown && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">Town Scene</span>
                                    </button>

                                    <button
                                        type="button"
                                        aria-pressed={startInSingleBiome}
                                        className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                        onClick={() => {
                                            const next = !startInSingleBiome;
                                            setStartInSingleBiome(next);
                                            if (next) {
                                                setStartInCombat(false);
                                                setStartInLand(false);
                                                setStartInTown(false);
                                                setStartInDev(false);
                                            }
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${startInSingleBiome ? 'bg-blue-500 border-blue-400' : 'border-white/20 group-hover:border-white/30'}`}>
                                            {startInSingleBiome && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">Single Biome</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="absolute bottom-8 text-center text-white/20 text-[10px] font-mono">
                    v1.0.0 • React • Three.js
                </div>
            </div>
            {showUnits && !hideControls && (
                <div
                    className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowUnits(false)}
                >
                    <div
                        className="relative w-[min(1200px,96vw)] h-[min(92dvh,92vh)] sm:h-[90vh] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="sticky top-0 z-20 flex justify-end p-3 bg-gradient-to-b from-black/80 to-transparent">
                            <button
                                type="button"
                                onClick={() => setShowUnits(false)}
                                className="h-10 w-10 flex items-center justify-center bg-black/60 text-white border border-white/10 rounded-full hover:bg-black/80"
                                aria-label="Close units roster"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Units />
                        </div>
                    </div>
                </div>
            )}
            {showMap && !hideControls && (
                <div
                    className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowMap(false)}
                >
                    <div
                        className="relative w-[min(1200px,96vw)] h-[min(88dvh,88vh)] sm:h-[82vh] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="sticky top-0 z-20 flex justify-end p-3 bg-gradient-to-b from-black/80 to-transparent">
                            <button
                                type="button"
                                onClick={() => setShowMap(false)}
                                className="h-10 w-10 flex items-center justify-center bg-black/60 text-white border border-white/10 rounded-full hover:bg-black/80"
                                aria-label="Close world map"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Map />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
