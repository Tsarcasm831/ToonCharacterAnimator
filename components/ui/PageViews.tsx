
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
import { Heart, Zap, Sword, Shield, Wind, Target, Map as MapIcon, ChevronRight, CheckCircle2, Circle, Navigation, Play, Pause, Volume2, SkipForward, SkipBack, Music } from 'lucide-react';
import { PlayerConfig, Quest } from '../../types';
import { LAND_SHAPE_POINTS } from '../../data/landShape';
import { CITIES } from '../../data/lands/cities';

interface Track {
    id: string;
    title: string;
    artist: string;
    duration: string;
    fileUrl: string;
}

interface Album {
    id: string;
    title: string;
    artist: string;
    year: string;
    genre: string;
    coverColor: string;
    tracks: Track[];
}

const ALBUMS: Album[] = [
    {
        id: 'journeys',
        title: 'Journeys',
        artist: 'Traveler',
        year: '2024',
        genre: 'Ambient',
        coverColor: 'bg-gradient-to-br from-blue-500 to-purple-600',
        tracks: [
            {
                id: 'beyond-the-pale',
                title: 'Beyond the Pale',
                artist: 'Traveler',
                duration: '4:12',
                fileUrl: '/assets/music/Journeys/Beyond the Pale.mp3'
            },
            {
                id: 'discovery',
                title: 'Discovery',
                artist: 'Traveler',
                duration: '4:03',
                fileUrl: '/assets/music/Journeys/Discovery.mp3'
            },
            {
                id: 'travel-1',
                title: 'Travel 1',
                artist: 'Traveler',
                duration: '2:58',
                fileUrl: '/assets/music/Journeys/Travel 1.mp3'
            }
        ]
    },
    {
        id: 'echoes',
        title: 'Echoes of Tomorrow',
        artist: 'Future Sound',
        year: '2024',
        genre: 'Electronic',
        coverColor: 'bg-gradient-to-br from-cyan-500 to-teal-600',
        tracks: [
            {
                id: 'digital-dawn',
                title: 'Digital Dawn',
                artist: 'Future Sound',
                duration: '3:56',
                fileUrl: '/assets/music/Echoes of Tomorrow/Digital Dawn.mp3'
            },
            {
                id: 'eerie-chant',
                title: 'Eerie Chant',
                artist: 'Future Sound',
                duration: '2:40',
                fileUrl: '/assets/music/Echoes of Tomorrow/Eerie Chant.mp3'
            }
        ]
    },
    {
        id: 'legends',
        title: 'Legends of the Realm',
        artist: 'Mythic Orchestra',
        year: '2024',
        genre: 'Orchestral',
        coverColor: 'bg-gradient-to-br from-orange-500 to-red-600',
        tracks: [
            {
                id: 'combat-battle',
                title: 'Combat Battle Music',
                artist: 'Mythic Orchestra',
                duration: '4:15',
                fileUrl: '/assets/music/Legends of the Realm/Combat Battle Music.mp3'
            },
            {
                id: 'hidden-wings',
                title: 'Hidden Wings _ 隠した翼 _ Kakushita Tsubasa',
                artist: 'Mythic Orchestra',
                duration: '2:58',
                fileUrl: '/assets/music/Legends of the Realm/Hidden Wings _ 隠した翼 _ Kakushita Tsubasa.mp3'
            },
            {
                id: 'service-tunnels',
                title: 'In the Service Tunnels',
                artist: 'Mythic Orchestra',
                duration: '2:04',
                fileUrl: '/assets/music/Legends of the Realm/In the Service Tunnels.mp3'
            },
            {
                id: 'kurogane',
                title: 'Kurogane',
                artist: 'Mythic Orchestra',
                duration: '3:16',
                fileUrl: '/assets/music/Legends of the Realm/Kurogane.mp3'
            },
            {
                id: 'nikolai-theme',
                title: 'Nikolai Theme',
                artist: 'Mythic Orchestra',
                duration: '6:12',
                fileUrl: '/assets/music/Legends of the Realm/Nikolai Theme.mp3'
            },
            {
                id: 'overworld-bg-2',
                title: 'Overworld BG 2',
                artist: 'Mythic Orchestra',
                duration: '3:04',
                fileUrl: '/assets/music/Legends of the Realm/Overworld BG 2.mp3'
            },
            {
                id: 'sairon-curious',
                title: 'Sairon - Curious',
                artist: 'Mythic Orchestra',
                duration: '2:40',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Curious.mp3'
            },
            {
                id: 'sairon-emotional-2',
                title: 'Sairon - Emotional 2',
                artist: 'Mythic Orchestra',
                duration: '3:18',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Emotional 2.mp3'
            },
            {
                id: 'sairon-emotional',
                title: 'Sairon - Emotional',
                artist: 'Mythic Orchestra',
                duration: '3:00',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Emotional.mp3'
            },
            {
                id: 'sairon-end-game',
                title: 'Sairon - End Game',
                artist: 'Mythic Orchestra',
                duration: '3:56',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - End Game.mp3'
            },
            {
                id: 'sairon-enemy-incoming',
                title: 'Sairon - Enemy Incoming',
                artist: 'Mythic Orchestra',
                duration: '2:12',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Enemy Incoming.mp3'
            },
            {
                id: 'sairon-homura-theme',
                title: 'Sairon - Homura\'s Theme',
                artist: 'Mythic Orchestra',
                duration: '3:16',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Homura\'s Theme.mp3'
            },
            {
                id: 'sairon-incoming-threat',
                title: 'Sairon - Incoming Threat',
                artist: 'Mythic Orchestra',
                duration: '2:18',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Incoming Threat.mp3'
            },
            {
                id: 'sairon-intro-original',
                title: 'Sairon - Intro Original',
                artist: 'Mythic Orchestra',
                duration: '4:12',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Intro Original.mp3'
            },
            {
                id: 'sairon-intro-remaster',
                title: 'Sairon - Intro Remaster',
                artist: 'Mythic Orchestra',
                duration: '2:52',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Intro Remaster.mp3'
            },
            {
                id: 'sairon-intro-v2',
                title: 'Sairon - Intro v2',
                artist: 'Mythic Orchestra',
                duration: '3:30',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Intro v2.mp3'
            },
            {
                id: 'sairon-seena-theme',
                title: 'Sairon - Seena Theme',
                artist: 'Mythic Orchestra',
                duration: '1:22',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Seena Theme.mp3'
            },
            {
                id: 'sairon-to-the-rescue',
                title: 'Sairon - To the Rescue',
                artist: 'Mythic Orchestra',
                duration: '1:28',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - To the Rescue.mp3'
            },
            {
                id: 'sairon-yureigakure-theme',
                title: 'Sairon - Yureigakure Theme',
                artist: 'Mythic Orchestra',
                duration: '1:22',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Yureigakure Theme.mp3'
            },
            {
                id: 'sairon-overworld',
                title: 'Sairon Overworld',
                artist: 'Mythic Orchestra',
                duration: '6:52',
                fileUrl: '/assets/music/Legends of the Realm/Sairon Overworld.mp3'
            },
            {
                id: 'combat',
                title: 'Combat',
                artist: 'Mythic Orchestra',
                duration: '4:02',
                fileUrl: '/assets/music/Legends of the Realm/Combat.mp3'
            }
        ]
    },
    {
        id: 'grey-matter-tavern',
        title: 'Grey Matter Tavern',
        artist: 'Various Artists',
        year: '2024',
        genre: 'Tavern Music',
        coverColor: 'bg-gradient-to-br from-amber-600 to-orange-700',
        tracks: [
            {
                id: 'success-the-obsession',
                title: 'Success the Obsession',
                artist: 'Various Artists',
                duration: '3:45',
                fileUrl: '/assets/music/Grey Matter Tavern/1 - Success the Obsession.mp3'
            },
            {
                id: 'team-of-one',
                title: 'Team of One',
                artist: 'Various Artists',
                duration: '4:12',
                fileUrl: '/assets/music/Grey Matter Tavern/2 - Team of One.mp3'
            },
            {
                id: 'grey-matter-tavern',
                title: 'Grey Matter Tavern',
                artist: 'Various Artists',
                duration: '3:28',
                fileUrl: '/assets/music/Grey Matter Tavern/3 - Grey Matter Tavern.mp3'
            },
            {
                id: 'bonnie-clyde',
                title: 'Bonnie & Clyde',
                artist: 'Various Artists',
                duration: '3:56',
                fileUrl: '/assets/music/Grey Matter Tavern/4 - Bonnie & Clyde.mp3'
            },
            {
                id: 'little-airplane',
                title: 'Little Airplane',
                artist: 'Various Artists',
                duration: '4:03',
                fileUrl: '/assets/music/Grey Matter Tavern/5 - Little Airplane.mp3'
            },
            {
                id: 'out-of-control',
                title: 'Out Of Control',
                artist: 'Various Artists',
                duration: '3:32',
                fileUrl: '/assets/music/Grey Matter Tavern/6 - Out Of Control.mp3'
            },
            {
                id: 'all-my-best-days',
                title: 'All My Best Days',
                artist: 'Various Artists',
                duration: '4:18',
                fileUrl: '/assets/music/Grey Matter Tavern/7 - All My Best Days.mp3'
            },
            {
                id: 'glorious',
                title: 'Glorious',
                artist: 'Various Artists',
                duration: '3:44',
                fileUrl: '/assets/music/Grey Matter Tavern/8 - Glorious.mp3'
            },
            {
                id: 'riddle-me',
                title: 'Riddle Me',
                artist: 'Various Artists',
                duration: '3:15',
                fileUrl: '/assets/music/Grey Matter Tavern/9 - Riddle Me.mp3'
            },
            {
                id: 'below-zero',
                title: 'Below Zero (feat. Meathook)',
                artist: 'Various Artists',
                duration: '4:27',
                fileUrl: '/assets/music/Grey Matter Tavern/10 - Below Zero (feat. Meathook).mp3'
            },
            {
                id: 'success-the-obsession-cover',
                title: 'Success the Obsession (Selfless Cut Cover)',
                artist: 'Various Artists',
                duration: '3:52',
                fileUrl: '/assets/music/Grey Matter Tavern/11 - Success the Obsession (Selfless Cut Cover).mp3'
            }
        ]
    }
];

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
    const activeScene = 'land';
    const isLand = activeScene === 'land';
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
                                    
                                    {isLand && stats && (
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

export const MusicView: React.FC = () => {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handlePlayTrack = (track: Track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        if (audioRef.current) {
            audioRef.current.src = track.fileUrl;
            audioRef.current.play();
        }
    };

    const handleTogglePlayPause = () => {
        if (!currentTrack) return;
        
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden">
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />
            
            {/* Header */}
            <div className="px-8 py-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Music Library</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em] mt-2">Game Soundtracks & Ambient Music</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <Music className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">{ALBUMS.length} Albums</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Albums Grid */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ALBUMS.map((album) => (
                            <div
                                key={album.id}
                                className={`group bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.02] hover:border-white/20 cursor-pointer ${
                                    selectedAlbum?.id === album.id ? 'ring-2 ring-purple-500/50' : ''
                                }`}
                                onClick={() => setSelectedAlbum(album)}
                            >
                                {/* Album Cover */}
                                <div className={`h-48 ${album.coverColor} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Music className="w-16 h-16 text-white/50" />
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{album.title}</h3>
                                        <p className="text-xs text-white/70 font-medium">{album.artist}</p>
                                    </div>
                                </div>
                                
                                {/* Album Info */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-slate-500">{album.year}</span>
                                            <span className="text-[10px] font-black uppercase text-purple-400">{album.genre}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-400">{album.tracks.length} tracks</span>
                                    </div>
                                    
                                    {/* Track List Preview */}
                                    <div className="space-y-1">
                                        {album.tracks.slice(0, 3).map((track, index) => (
                                            <div key={track.id} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 truncate">{index + 1}. {track.title}</span>
                                                <span className="text-slate-500">{track.duration}</span>
                                            </div>
                                        ))}
                                        {album.tracks.length > 3 && (
                                            <div className="text-xs text-slate-500 font-medium">
                                                +{album.tracks.length - 3} more tracks
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side Panel - Track List & Player */}
                {selectedAlbum && (
                    <div className="w-96 bg-slate-900/50 border-l border-white/5 flex flex-col">
                        {/* Album Header */}
                        <div className="p-6 border-b border-white/5">
                            <div className={`h-32 ${selectedAlbum.coverColor} rounded-2xl mb-4 relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Music className="w-12 h-12 text-white/50" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedAlbum.title}</h3>
                            <p className="text-sm text-slate-400 font-medium">{selectedAlbum.artist} • {selectedAlbum.year}</p>
                            <p className="text-xs text-purple-400 font-black uppercase tracking-widest mt-1">{selectedAlbum.genre}</p>
                        </div>

                        {/* Track List */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="space-y-2">
                                {selectedAlbum.tracks.map((track, index) => (
                                    <div
                                        key={track.id}
                                        className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                                            currentTrack?.id === track.id
                                                ? 'bg-purple-600/20 border-purple-500/30'
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                        }`}
                                        onClick={() => handlePlayTrack(track)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    currentTrack?.id === track.id && isPlaying
                                                        ? 'bg-purple-500'
                                                        : 'bg-white/10'
                                                }`}>
                                                    {currentTrack?.id === track.id && isPlaying ? (
                                                        <Pause className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <Play className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{track.title}</p>
                                                    <p className="text-xs text-slate-400">{track.artist}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500">{track.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Now Playing Bar */}
                        {currentTrack && (
                            <div className="p-4 border-t border-white/5 bg-slate-900/80">
                                <div className="mb-3">
                                    <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                                    <p className="text-xs text-slate-400">{currentTrack.artist}</p>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleTogglePlayPause}
                                            className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-4 h-4 text-white" />
                                            ) : (
                                                <Play className="w-4 h-4 text-white" />
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Volume2 className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
