
import React from 'react';
import { Header } from './Header';
import { Compass } from './Compass';
import { Hotbar } from './Hotbar';
import { PlayerBench } from './PlayerBench';
import { InteractionOverlay } from './InteractionOverlay';
import { CombatLog, CombatLogEntry } from './CombatLog';
import { InventoryItem, EntityStats } from '../../types';

interface GameHUDProps {
    activeScene: string;
    currentBiome: { name: string, color: string };
    playerRotation: number;
    inventory: (InventoryItem | null)[];
    bench: (InventoryItem | null)[];
    selectedSlot: number;
    onSelectSlot: (idx: number) => void;
    selectedUnit?: any;
    interactionText: string | null;
    interactionProgress: number | null;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    isCombatActive: boolean;
    setIsCombatActive: (active: boolean) => void;
    stats: EntityStats;
    isFemale: boolean;
    combatLog: CombatLogEntry[];
    onOpenTravel: () => void;
    onToggleBestiary: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
    activeScene, currentBiome, playerRotation, inventory, bench, selectedSlot, onSelectSlot,
    selectedUnit, interactionText, interactionProgress, showGrid, setShowGrid, isCombatActive, setIsCombatActive,
    stats, isFemale, combatLog, onOpenTravel, onToggleBestiary
}) => {
    const isCombat = activeScene === 'combat';

    return (
        <>
            {/* Standard Exploration Header */}
            {!isCombat && <Header biome={currentBiome} onOpenTravel={onOpenTravel} onToggleBestiary={onToggleBestiary} />}
            {!isCombat && <Compass rotation={playerRotation} />}
            
            {/* Combat HUD Elements */}
            {isCombat && (
                <>
                    <CombatLog entries={combatLog} />
                    {selectedUnit && (
                        <div className="absolute top-24 left-8 z-[50] w-64 h-96 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-4">
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                <div className="w-full h-full bg-gradient-to-b from-blue-500/20 to-transparent" />
                            </div>
                            <div className="relative p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/70">Selected Ally</h3>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                </div>
                                <div className="flex-1 flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 mb-4">
                                    <div className="text-[10px] text-white/30 uppercase tracking-tighter">Unit Model Preview</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-white tracking-wide">
                                        {selectedUnit.constructor.name === 'Player' ? 'Hero' : selectedUnit.constructor.name}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" 
                                                style={{ width: `${(selectedUnit.stats?.hp / selectedUnit.stats?.maxHp) * 100 || 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-blue-400">HP</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <InteractionOverlay text={interactionText} progress={interactionProgress} />

            {/* Bottom Controls / Hotbars */}
            {!isCombat && (activeScene === 'dev' || activeScene === 'land') && (
                <Hotbar inventory={inventory} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
            )}

            {isCombat && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[50] flex flex-col items-center gap-6 w-full max-w-5xl px-4 pointer-events-none">
                    {/* Tactical Command Panel */}
                    <div className="flex items-center gap-4 pointer-events-auto bg-slate-900/60 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl animate-fade-in-up">
                        {!isCombatActive && (
                            <button 
                                onClick={() => setIsCombatActive(true)}
                                className="px-10 py-3 rounded-full bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(37,99,235,0.4)] border-2 border-blue-400 hover:bg-blue-500 hover:scale-105 transition-all active:scale-95 animate-pulse"
                            >
                                Start Combat
                            </button>
                        )}
                        <button 
                            onClick={() => setShowGrid(!showGrid)}
                            className={`px-6 py-3 rounded-full backdrop-blur-md border-2 transition-all group flex items-center gap-3 ${showGrid ? 'bg-indigo-600/40 border-indigo-400' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                        >
                            <div className={`p-1 rounded-lg transition-colors ${showGrid ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-white/10'}`}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Grid Labels</span>
                        </button>
                    </div>
                    
                    {/* Ability / Unit Bench */}
                    <div className="pointer-events-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <PlayerBench inventory={bench} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
                    </div>
                </div>
            )}
        </>
    );
};
