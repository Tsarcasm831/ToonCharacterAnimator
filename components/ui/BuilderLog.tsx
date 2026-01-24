import React, { useEffect, useRef, useState } from 'react';
import { useGlobalState } from '../../contexts/GlobalContext';

export const BuilderLog: React.FC = () => {
    const { uiState } = useGlobalState();
    const { builderLogs, isBuilderLogOpen, clearBuilderLogs, toggleBuilderLog } = uiState;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [builderLogs, isBuilderLogOpen]);

    if (!isBuilderLogOpen) return null;

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1500); // Reset after 1.5 seconds
        });
    };

    return (
        <div className="builder-log-container absolute top-24 right-4 w-96 max-h-[60vh] flex flex-col bg-black/80 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">Builder Log</h3>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={clearBuilderLogs}
                        className="p-1.5 hover:bg-white/10 rounded text-xs text-white/60 hover:text-white transition-colors"
                        title="Clear Logs"
                    >
                        Clear
                    </button>
                    <button 
                        onClick={toggleBuilderLog}
                        className="p-1.5 hover:bg-white/10 rounded text-xs text-white/60 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs"
            >
                {builderLogs.length === 0 ? (
                    <div className="text-white/30 text-center py-8 italic">
                        No structures built yet...
                    </div>
                ) : (
                    builderLogs.map((log) => (
                        <div 
                            key={log.id} 
                            className={`group relative bg-white/5 hover:bg-white/10 p-2 rounded border border-white/5 hover:border-white/20 transition-all cursor-pointer ${
                                copiedId === log.id ? 'bg-green-600/20 border-green-400/40 animate-pulse' : ''
                            }`}
                            onClick={() => copyToClipboard(log.message, log.id)}
                            title="Click to copy"
                        >
                            <div className="text-blue-400 mb-1 opacity-50 text-[10px]">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="text-gray-300 break-all pr-6">
                                {log.message}
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className={`${
                                    copiedId === log.id 
                                        ? 'bg-green-600 text-white animate-pulse' 
                                        : 'bg-blue-600 text-white'
                                } text-[9px] px-1.5 py-0.5 rounded`}>
                                    {copiedId === log.id ? 'COPIED' : 'COPY'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-2 border-t border-white/10 text-[10px] text-white/40 text-center">
                Click any entry to copy details
            </div>
        </div>
    );
};
