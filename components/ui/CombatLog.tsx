
import React, { useEffect, useRef } from 'react';

export interface CombatLogEntry {
    id: string;
    text: string;
    type: 'info' | 'damage' | 'heal' | 'system';
    timestamp: number;
}

interface CombatLogProps {
    entries: CombatLogEntry[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ entries }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [entries]);

    return (
        <div className="absolute top-8 right-8 z-[60] w-72 h-48 pointer-events-none flex flex-col">
            <div className="bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl pointer-events-auto">
                <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Log</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"
                >
                    {entries.map((entry) => (
                        <div key={entry.id} className="animate-fade-in-up flex gap-2 items-start">
                            <span className="text-[8px] font-mono text-slate-600 mt-0.5">
                                {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(':')[2]}s
                            </span>
                            <p className={`text-[11px] font-bold leading-tight ${
                                entry.type === 'damage' ? 'text-red-400' :
                                entry.type === 'heal' ? 'text-emerald-400' :
                                entry.type === 'system' ? 'text-blue-400' :
                                'text-slate-300'
                            }`}>
                                {entry.text}
                            </p>
                        </div>
                    ))}
                    {entries.length === 0 && (
                        <div className="h-full flex items-center justify-center italic text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                            Waiting for input...
                        </div>
                    )}
                </div>
            </div>
            <div className="h-8 bg-gradient-to-t from-slate-950/0 to-slate-950/40 mt-[-2rem] pointer-events-none z-10 rounded-b-2xl" />
        </div>
    );
};
