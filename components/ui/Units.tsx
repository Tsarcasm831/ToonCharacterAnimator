
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
import { Heart, Zap, Sword, Shield, Wind, Target } from 'lucide-react';

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

export const Units: React.FC = () => {
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
