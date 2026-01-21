
import React, { useState } from 'react';
import { Map as MapIcon, ChevronRight, CheckCircle2, Circle, Navigation } from 'lucide-react';
import { PlayerConfig, Quest } from '../../types';
import { LAND_SHAPE_POINTS } from '../../data/landShape';
import { CITIES } from '../../data/lands/cities';

interface MissionProps {
    quests: Quest[];
    config: PlayerConfig;
}

export const Mission: React.FC<MissionProps> = ({ quests, config }) => {
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(quests[0]?.id || null);
    const selectedQuest = quests.find(q => q.id === selectedQuestId);

    // Map logic similar to LandMapModal
    const worldScale = 50.0;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    LAND_SHAPE_POINTS.forEach(p => {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minZ) minZ = p[1];
        if (p[1] > maxZ) maxZ = p[1];
    });

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const worldPoints = LAND_SHAPE_POINTS.map(p => ({
        x: (p[0] - centerX) * worldScale,
        z: (p[1] - centerZ) * worldScale
    }));

    const viewBoxSize = 400;
    const padding = 40;
    const maxExtent = Math.max(Math.abs(Math.min(...worldPoints.map(p => p.x))), Math.abs(Math.max(...worldPoints.map(p => p.x))), Math.abs(Math.min(...worldPoints.map(p => p.z))), Math.abs(Math.max(...worldPoints.map(p => p.z))));
    const mapScale = (viewBoxSize - padding * 2) / (2 * maxExtent);

    const scaledPoints = worldPoints.map(p => ({
        x: p.x * mapScale + viewBoxSize / 2,
        z: p.z * mapScale + viewBoxSize / 2
    }));

    const pathData = scaledPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.z}`).join(' ') + ' Z';

    const yureigakure = CITIES.find(city => city.name === 'Yureigakure');
    const yureigakurePoint = yureigakure
        ? {
            x: (yureigakure.x - centerX) * worldScale * mapScale + viewBoxSize / 2,
            z: (yureigakure.y - centerZ) * worldScale * mapScale + viewBoxSize / 2
        }
        : null;

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent shrink-0">
                <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Strategic Command</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Plan your next deployment</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <MapIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Region: Verdant Meadows</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Side: Quest Tree */}
                <div className="w-80 flex flex-col gap-4 overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2 flex items-center justify-between">
                        <span>Active Operations</span>
                        <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full text-[8px]">{quests.length}</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {quests.map((quest) => (
                            <button
                                key={quest.id}
                                onClick={() => setSelectedQuestId(quest.id)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                                    selectedQuestId === quest.id
                                        ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-1.5 rounded-lg ${
                                        quest.status === 'completed' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                                    }`}>
                                        {quest.status === 'completed' ? (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                            <Circle className="w-3 h-3 text-blue-400" />
                                        )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${
                                        quest.status === 'completed' ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>
                                        {quest.status}
                                    </span>
                                </div>
                                <h4 className={`text-sm font-bold truncate transition-colors ${
                                    selectedQuestId === quest.id ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                }`}>
                                    {quest.title}
                                </h4>
                                <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${
                                            quest.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${(quest.objectives[0]?.current / quest.objectives[0]?.target) * 100}%` }}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Side: Main Preview & Details */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    {/* World Preview - NOW A TOP DOWN MAP */}
                    <div className="flex-1 bg-slate-900 rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl group flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
                            <svg 
                                width="100%" 
                                height="100%" 
                                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} 
                                className="max-w-full max-h-full drop-shadow-[0_0_30px_rgba(74,222,128,0.2)]"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                {/* Grid Pattern */}
                                <defs>
                                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.05" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />

                                {/* Landmass */}
                                <path 
                                    d={pathData} 
                                    fill="#4ade80" 
                                    stroke="#16a34a" 
                                    strokeWidth="3" 
                                    opacity="0.9"
                                    className="animate-pulse"
                                    style={{ animationDuration: '4s' }}
                                />

                                {/* Points of Interest */}
                                <circle cx={viewBoxSize/2} cy={viewBoxSize/2} r="7" fill="#ef4444" opacity="0.18" />
                                <circle cx={viewBoxSize/2} cy={viewBoxSize/2} r="4" fill="#ef4444" stroke="#fecaca" strokeWidth="1.5" />
                                <text x={viewBoxSize/2 + 10} y={viewBoxSize/2 + 4} className="text-[14px] font-black fill-white uppercase tracking-widest drop-shadow-md">Command Post</text>
                                {yureigakurePoint && (
                                    <g>
                                        <circle cx={yureigakurePoint.x} cy={yureigakurePoint.z} r="5" fill="#38bdf8" opacity="0.2" />
                                        <circle cx={yureigakurePoint.x} cy={yureigakurePoint.z} r="2.8" fill="#38bdf8" stroke="#bae6fd" strokeWidth="1" />
                                        <text x={yureigakurePoint.x + 8} y={yureigakurePoint.z + 4} className="text-[12px] font-bold fill-sky-100 uppercase tracking-widest drop-shadow">Yureigakure</text>
                                    </g>
                                )}
                            </svg>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                        
                        {/* Overlay Content */}
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-sm">
                                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">
                                    Verdant Meadows
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    A peaceful region currently undergoing resource scarcity. Local craftsmen require assistance with materials. Topographic scan complete.
                                </p>
                            </div>
                            <div className="flex gap-3 pointer-events-auto">
                                <button className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-400 hover:text-white transition-all active:scale-95 shadow-xl flex items-center gap-2">
                                    <Navigation className="w-3 h-3" />
                                    Deploy Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quest Details (Horizontal Tree/Flow) */}
                    <div className="h-48 bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                        {selectedQuest ? (
                            <>
                                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/20">
                                        <ChevronRight className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight text-white">{selectedQuest.title}</h3>
                                        <p className="text-xs text-slate-400 font-medium">{selectedQuest.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 overflow-x-auto custom-scrollbar-h pb-2">
                                    {selectedQuest.objectives.map((obj, i) => (
                                        <div key={i} className="min-w-[200px] bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Objective {i + 1}</span>
                                                <span className="text-[10px] font-mono text-slate-500">{obj.current} / {obj.target}</span>
                                            </div>
                                            <p className="text-xs font-bold text-white truncate">{obj.label}</p>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 transition-all duration-500"
                                                    style={{ width: `${(obj.current / obj.target) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="min-w-[200px] bg-yellow-500/5 rounded-2xl p-4 border border-yellow-500/20 flex flex-col gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Reward</span>
                                        <p className="text-xs font-bold text-white leading-relaxed">{selectedQuest.reward}</p>
                                        <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase text-yellow-500/50 italic">
                                            <span>🎁</span>
                                            <span>Pending Completion</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-black uppercase tracking-widest opacity-20">
                                Select an operation to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
