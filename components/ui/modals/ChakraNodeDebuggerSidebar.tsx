import React from 'react';

export type ChakraSidebarTargetKind = 'node' | 'connection';

export interface ChakraDebuggerSidebarEntry {
    id: string;
    name: string;
    color: string;
}

export interface ChakraSidebarHoverTarget {
    kind: ChakraSidebarTargetKind;
    id: string;
    label: string;
    color: string;
    clientX: number;
    clientY: number;
}

interface ChakraNodeDebuggerSidebarProps {
    isOpen: boolean;
    nodes: ChakraDebuggerSidebarEntry[];
    connections: ChakraDebuggerSidebarEntry[];
    onHoverTarget: (target: ChakraSidebarHoverTarget | null) => void;
}

export const ChakraNodeDebuggerSidebar: React.FC<ChakraNodeDebuggerSidebarProps> = ({ isOpen, nodes, connections, onHoverTarget }) => {
    if (!isOpen) return null;

    const handleHover = (
        kind: ChakraSidebarTargetKind,
        entry: ChakraDebuggerSidebarEntry,
        element: HTMLButtonElement
    ) => {
        const rect = element.getBoundingClientRect();
        onHoverTarget({
            kind,
            id: entry.id,
            label: entry.name,
            color: entry.color,
            clientX: rect.right,
            clientY: rect.top + rect.height * 0.5
        });
    };

    return (
        <aside className="absolute left-4 top-20 bottom-4 z-[62] w-72 pointer-events-auto">
            <div className="h-full bg-slate-950/90 backdrop-blur-xl border border-cyan-400/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-cyan-400/10 bg-black/30">
                    <h3 className="text-cyan-300 text-xs font-black uppercase tracking-[0.16em]">Chakra Node Debugger</h3>
                    <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-wider">J Stage 3: network-only legend</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    <div className="text-[10px] text-cyan-300/90 font-black uppercase tracking-[0.18em] px-1">Nodes ({nodes.length})</div>
                    {nodes.length === 0 ? (
                        <div className="text-[11px] text-slate-400 bg-black/20 border border-white/10 rounded-xl p-3">
                            No chakra nodes detected yet.
                        </div>
                    ) : (
                        nodes.map((node) => (
                            <button
                                key={node.id}
                                type="button"
                                onMouseEnter={(e) => handleHover('node', node, e.currentTarget)}
                                onFocus={(e) => handleHover('node', node, e.currentTarget)}
                                onMouseLeave={() => onHoverTarget(null)}
                                onBlur={() => onHoverTarget(null)}
                                className="w-full text-left flex items-center gap-3 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-cyan-300/40 hover:bg-cyan-500/[0.08] transition-colors"
                            >
                                <span
                                    className="w-4 h-4 rounded-sm border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                                    style={{ backgroundColor: node.color }}
                                    aria-hidden
                                />
                                <span className="text-[11px] text-slate-200 font-semibold tracking-wide">{node.name}</span>
                            </button>
                        ))
                    )}

                    <div className="pt-2 text-[10px] text-cyan-300/90 font-black uppercase tracking-[0.18em] px-1">Connections ({connections.length})</div>
                    {connections.length === 0 ? (
                        <div className="text-[11px] text-slate-400 bg-black/20 border border-white/10 rounded-xl p-3">
                            No chakra connections detected yet.
                        </div>
                    ) : (
                        connections.map((connection) => (
                            <button
                                key={connection.id}
                                type="button"
                                onMouseEnter={(e) => handleHover('connection', connection, e.currentTarget)}
                                onFocus={(e) => handleHover('connection', connection, e.currentTarget)}
                                onMouseLeave={() => onHoverTarget(null)}
                                onBlur={() => onHoverTarget(null)}
                                className="w-full text-left flex items-center gap-3 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-cyan-300/40 hover:bg-cyan-500/[0.08] transition-colors"
                            >
                                <span
                                    className="w-4 h-4 rounded-sm border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                                    style={{ backgroundColor: connection.color }}
                                    aria-hidden
                                />
                                <span className="text-[11px] text-slate-200 font-semibold tracking-wide">{connection.name}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
};
