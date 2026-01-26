import React from 'react';
import { EntityStats } from '../../../types';

// We'll define a simplified interface for the UI to avoid importing heavy game logic types directly if possible,
// but for now let's just match the shape we expect from CombatUnit
interface UIUnit {
    id: string;
    isFriendly: boolean;
    name: string;
    currentInitiative: number;
    stats: EntityStats;
}

interface TurnIndicatorUIProps {
    queue: UIUnit[];
    currentUnitId: string | null;
    phase: string; // 'player', 'ai', 'end', etc.
}

export const TurnIndicatorUI: React.FC<TurnIndicatorUIProps> = ({ queue, currentUnitId, phase }) => {
    // We only show top 8 units in queue to avoid clutter
    const displayQueue = queue.slice(0, 8);

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-[40]">
            {/* Phase Indicator */}
            <div className={`px-6 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-lg text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-4 ${
                phase === 'player' ? 'bg-blue-600/80 text-white' : 
                phase === 'ai' ? 'bg-red-600/80 text-white' : 
                'bg-slate-900/80 text-slate-400'
            }`}>
                {phase === 'player' ? 'Player Turn' : phase === 'ai' ? 'Enemy Turn' : 'Preparing...'}
            </div>

            {/* Turn Queue */}
            <div className="flex items-center gap-2 p-2 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl">
                {displayQueue.map((unit, index) => {
                    const isActive = unit.id === currentUnitId;
                    const isFriendly = unit.isFriendly;
                    
                    return (
                        <div 
                            key={unit.id}
                            className={`relative transition-all duration-300 ${isActive ? 'scale-110 mx-2' : 'scale-90 opacity-70'}`}
                        >
                            {/* Order Badge */}
                            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/80 border border-white/20 flex items-center justify-center z-10">
                                <span className="text-[10px] font-bold text-white">{index + 1}</span>
                            </div>

                            {/* Portrait Container */}
                            <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 shadow-lg relative ${
                                isActive 
                                    ? (isFriendly ? 'border-blue-400 shadow-blue-500/30' : 'border-red-400 shadow-red-500/30') 
                                    : (isFriendly ? 'border-blue-900/50' : 'border-red-900/50')
                            }`}>
                                <div className={`absolute inset-0 ${isFriendly ? 'bg-blue-900' : 'bg-red-900'}`} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Placeholder Icon based on name/type */}
                                    <span className="text-[8px] font-black uppercase text-white/90 text-center leading-tight px-1">
                                        {unit.name}
                                    </span>
                                </div>
                                
                                {/* Health Bar (Mini) */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                    <div 
                                        className={`h-full ${isFriendly ? 'bg-blue-400' : 'bg-red-400'}`} 
                                        style={{ width: `${(unit.stats.health / unit.stats.maxHealth) * 100}%` }}
                                    />
                                </div>
                            </div>
                            
                            {/* Active Indicator Arrow */}
                            {isActive && (
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-white/90 animate-bounce">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                                        <path d="M5 0L0 6H10L5 0Z" fill="currentColor" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
