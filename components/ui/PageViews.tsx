
import React, { useState } from 'react';
import { Archer } from '../../game/entities/npc/enemy/Archer';
import { Assassin } from '../../game/entities/npc/enemy/Assassin';
import { Bandit } from '../../game/entities/npc/enemy/Bandit';
import { Berserker } from '../../game/entities/npc/enemy/Berserker';
import { Knight } from '../../game/entities/npc/friendly/Knight';
import { Mage } from '../../game/entities/npc/enemy/Mage';
import { Rogue } from '../../game/entities/npc/enemy/Rogue';
import { Warlock } from '../../game/entities/npc/enemy/Warlock';
import { Paladin } from '../../game/entities/npc/friendly/Paladin';
import { Ranger } from '../../game/entities/npc/friendly/Ranger';
import { Monk } from '../../game/entities/npc/friendly/Monk';
import { Cleric } from '../../game/entities/npc/friendly/Cleric';
import { Sentinel } from '../../game/entities/npc/friendly/Sentinel';
import { Wolf } from '../../game/entities/animal/aggressive/Wolf';
import { Bear } from '../../game/entities/animal/aggressive/Bear';
import { Spider } from '../../game/entities/animal/aggressive/Spider';
import { Deer } from '../../game/entities/animal/neutral/Deer';
import { Chicken } from '../../game/entities/animal/neutral/Chicken';
import { Lizard } from '../../game/entities/animal/neutral/Lizard';
import { Owl } from '../../game/entities/animal/neutral/Owl';
import { Pig } from '../../game/entities/animal/neutral/Pig';
import { Sheep } from '../../game/entities/animal/neutral/Sheep';
import { Yeti } from '../../game/entities/animal/neutral/Yeti';
import { EnemyPreview } from './EnemyPreview';
import { CLASS_STATS } from '../../data/stats';
import { Heart, Zap, Sword, Shield, Wind, Target, Map as MapIcon, ChevronRight, CheckCircle2, Circle, Navigation } from 'lucide-react';
import { PlayerConfig, Quest } from '../../types';
import { WORLD_SHAPE_POINTS } from '../../data/worldShape';
import { CITIES } from '../../data/lands/cities';

const ENEMIES = [
    { id: 'archer', name: 'Archer', description: 'Ranged combatant using precise bow attacks.', class: Archer },
    { id: 'assassin', name: 'Assassin', description: 'Quick and deadly, specializes in critical strikes.', class: Assassin },
    { id: 'bandit', name: 'Bandit', description: 'A common ruffian with balanced combat skills.', class: Bandit },
    { id: 'berserker', name: 'Berserker', description: 'Sacrifices defense for overwhelming raw power.', class: Berserker },
    { id: 'mage', name: 'Mage', description: 'Wielder of arcane energies and elemental spells.', class: Mage },
    { id: 'rogue', name: 'Rogue', description: 'Master of stealth and rapid dual-wield attacks.', class: Rogue },
    { id: 'warlock', name: 'Warlock', description: 'Commands dark magic and debilitating curses.', class: Warlock },
];

const ALLIES = [
    { id: 'paladin', name: 'Paladin', description: 'Holy warrior wielding divine power and righteous fury.', class: Paladin },
    { id: 'ranger', name: 'Ranger', description: 'Forest protector skilled in archery and tracking.', class: Ranger },
    { id: 'monk', name: 'Monk', description: 'Martial artist with lightning-fast unarmed strikes.', class: Monk },
    { id: 'cleric', name: 'Cleric', description: 'Divine healer channeling holy light to aid allies.', class: Cleric },
    { id: 'sentinel', name: 'Sentinel', description: 'Stalwart defender who holds the line against foes.', class: Sentinel },
    { id: 'knight', name: 'Knight', description: 'Heavily armored warrior with high survivability.', class: Knight },
];

const FAUNA = [
    { id: 'wolf', name: 'Wolf', description: 'Pack hunter that patrols the grove with fierce loyalty.', class: Wolf },
    { id: 'bear', name: 'Bear', description: 'Powerful omnivore with immense strength and thick hide.', class: Bear },
    { id: 'spider', name: 'Spider', description: 'Eight-legged arachnid with venomous bite and web attacks.', class: Spider },
    { id: 'deer', name: 'Deer', description: 'Gentle herbivore with impressive antlers and swift agility.', class: Deer },
    { id: 'chicken', name: 'Chicken', description: 'Common farm bird that pecks at seeds and insects.', class: Chicken },
    { id: 'lizard', name: 'Lizard', description: 'Small reptile that basks in sunlight and darts quickly.', class: Lizard },
    { id: 'owl', name: 'Owl', description: 'Nocturnal bird of prey with silent flight and keen vision.', class: Owl },
    { id: 'pig', name: 'Pig', description: 'Domesticated animal known for intelligence and foraging.', class: Pig },
    { id: 'sheep', name: 'Sheep', description: 'Woolly herbivore that grazes peacefully in meadows.', class: Sheep },
    { id: 'yeti', name: 'Yeti', description: 'Mythical mountain creature with white fur and great strength.', class: Yeti },
];

const StatBadge = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase leading-none">{label}</span>
            <span className="text-xs font-bold text-white leading-tight">{value}</span>
        </div>
    </div>
);


export const HomeView: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
        <h1 className="text-6xl font-black mb-4">HOME</h1>
        <p className="text-slate-400 uppercase tracking-[0.3em]">Welcome back, Commander</p>
    </div>
);

export const UnitsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'enemies' | 'allies' | 'fauna'>('enemies');
    
    const currentList = activeTab === 'enemies' ? ENEMIES : activeTab === 'allies' ? ALLIES : FAUNA;

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden">
            {/* Header */}
            <div className="px-8 py-8 border-b border-white/5 flex justify-between items-end bg-gradient-to-b from-white/5 to-transparent">
                <div>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Units Roster</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em] mt-2">Database of all discovered lifeforms</p>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('enemies')}
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                            activeTab === 'enemies' 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        👹 Enemies ({ENEMIES.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('allies')}
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                            activeTab === 'allies' 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        ⚔️ Allies ({ALLIES.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('fauna')}
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                            activeTab === 'fauna' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        🦌 Fauna ({FAUNA.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {currentList.map((entity) => {
                        const stats = CLASS_STATS[entity.id];
                        return (
                            <div 
                                key={entity.id}
                                className={`group bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex gap-8 hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.02] hover:border-white/20`}
                            >
                                <div className={`w-40 h-40 bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-white/30 shrink-0`}>
                                    <EnemyPreview type={entity.id} />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-2xl font-black uppercase tracking-tight transition-colors group-hover:text-blue-400`}>
                                            {entity.name}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            activeTab === 'enemies'
                                                ? 'bg-red-900/20 text-red-400 border-red-500/20'
                                                : activeTab === 'allies'
                                                ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20'
                                                : 'bg-blue-900/20 text-blue-400 border-blue-500/20'
                                        }`}>
                                            {activeTab === 'enemies' ? 'Threat' : activeTab === 'allies' ? 'Ally' : 'Neutral'}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-xs mt-2 leading-relaxed font-medium line-clamp-2">
                                        {entity.description}
                                    </p>
                                    
                                    {stats && (
                                        <div className="mt-auto pt-4 grid grid-cols-3 gap-2">
                                            <StatBadge icon={Heart} label="HP" value={stats.health} color="text-red-500" />
                                            <StatBadge icon={Zap} label="MP" value={stats.chakra} color="text-blue-500" />
                                            <StatBadge icon={Sword} label="ATK" value={stats.damage} color="text-orange-500" />
                                            <StatBadge icon={Shield} label="DEF" value={stats.defense} color="text-emerald-500" />
                                            <StatBadge icon={Wind} label="EVA" value={stats.evasion} color="text-cyan-500" />
                                            <StatBadge icon={Target} label="DEX" value={stats.dexterity} color="text-purple-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


interface MissionViewProps {
    quests: Quest[];
    config: PlayerConfig;
}

export const MissionView: React.FC<MissionViewProps> = ({ quests, config }) => {
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(quests[0]?.id || null);
    const selectedQuest = quests.find(q => q.id === selectedQuestId);

    // Map logic similar to WorldMapModal
    const worldScale = 50.0;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    WORLD_SHAPE_POINTS.forEach(p => {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minZ) minZ = p[1];
        if (p[1] > maxZ) maxZ = p[1];
    });

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const worldPoints = WORLD_SHAPE_POINTS.map(p => ({
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

export const MusicView: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
        <h1 className="text-6xl font-black mb-4">MUSIC</h1>
        <p className="text-slate-400 uppercase tracking-[0.3em]">Soundtrack selection</p>
    </div>
);
