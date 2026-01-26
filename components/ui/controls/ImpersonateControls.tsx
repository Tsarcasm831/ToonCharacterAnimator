
import React from 'react';
import { PlayerConfig, DEFAULT_CONFIG } from '../../../types';

interface ImpersonateControlsProps {
    setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
}

const NPC_PRESETS: { name: string; role: string; color: string; config: Partial<PlayerConfig> }[] = [
    {
        name: "City Guard",
        role: "Defender",
        color: "bg-blue-600",
        config: {
            bodyType: 'male', bodyVariant: 'average', skinColor: '#ffdbac', hairStyle: 'crew', hairColor: '#3e2723',
            shirtColor: '#4a3728', pantsColor: '#718096', bootsColor: '#8d6e63',
            equipment: { ...DEFAULT_CONFIG.equipment, helm: true, shoulders: true, shirt: true, pants: true, shoes: true, quiltedArmor: true, bracers: true, belt: true },
            selectedItem: 'Halberd', weaponStance: 'shoulder'
        }
    },
    {
        name: "Knight",
        role: "Tank",
        color: "bg-slate-500",
        config: {
            bodyType: 'male', bodyVariant: 'muscular', outfit: 'warrior', skinColor: '#e0c8a8',
            shirtColor: '#37474f', pantsColor: '#263238', bootsColor: '#1a1a1a', hairStyle: 'bald',
            equipment: { ...DEFAULT_CONFIG.equipment, helm: true, shoulders: true, shield: true, shirt: true, pants: true, shoes: true, plateMail: true, bracers: true, cape: true, belt: true },
            selectedItem: 'Sword', weaponStance: 'side'
        }
    },
    {
        name: "Assassin",
        role: "Stealth",
        color: "bg-red-900",
        config: {
            bodyType: 'male', bodyVariant: 'slim', outfit: 'warrior', skinColor: '#d7ccc8',
            shirtColor: '#000000', pantsColor: '#000000', hairStyle: 'bald',
            equipment: { ...DEFAULT_CONFIG.equipment, shoulders: true, shirt: true, pants: true, shoes: true, mask: true, hood: true, bracers: true, belt: true },
            selectedItem: 'Knife', weaponStance: 'side'
        }
    },
    {
        name: "Ranger",
        role: "Ranged",
        color: "bg-emerald-600",
        config: {
            bodyType: 'female', bodyVariant: 'slim', outfit: 'peasant', skinColor: '#ffe4c4',
            shirtColor: '#2e8b57', pantsColor: '#556b2f', bootsColor: '#8b4513', hoodColor: '#228b22', hairStyle: 'crew', hairColor: '#8b4513',
            equipment: { ...DEFAULT_CONFIG.equipment, hood: true, leatherArmor: true, shirt: true, pants: true, shoes: true, bracers: true, cape: true, belt: true },
            selectedItem: 'Bow', weaponStance: 'side'
        }
    },
    {
        name: "Mage",
        role: "Caster",
        color: "bg-indigo-600",
        config: {
            bodyType: 'female', bodyVariant: 'slim', outfit: 'noble', skinColor: '#d4c4b0',
            shirtColor: '#1a0a2e', pantsColor: '#0d0518', robeColor: '#1a0a2e', robeTrimColor: '#6b21a8',
            mageHatColor: '#1a0a2e', mageHatBandColor: '#9333ea', hairStyle: 'bald',
            equipment: { ...DEFAULT_CONFIG.equipment, robe: true, mageHat: true, shirt: true, pants: true, shoes: true, cape: true, belt: true },
            selectedItem: null, weaponStance: 'side'
        }
    },
    {
        name: "Cleric",
        role: "Healer",
        color: "bg-yellow-500",
        config: {
            bodyType: 'female', bodyVariant: 'average', outfit: 'noble', skinColor: '#ffe4c4',
            shirtColor: '#f5f5f5', pantsColor: '#dcdcdc', bootsColor: '#d4af37', robeColor: '#f5f5f5', robeTrimColor: '#ffd700',
            mageHatColor: '#f5f5f5', mageHatBandColor: '#ffd700', hairStyle: 'crew', hairColor: '#ffd700',
            equipment: { ...DEFAULT_CONFIG.equipment, robe: true, mageHat: true, shirt: true, pants: true, shoes: true, cape: true, belt: true },
            selectedItem: null, weaponStance: 'side'
        }
    },
    {
        name: "Berserker",
        role: "Damage",
        color: "bg-orange-700",
        config: {
            bodyType: 'male', bodyVariant: 'heavy', outfit: 'warrior', skinColor: '#c9a882',
            shirtColor: '#8b0000', pantsColor: '#4a2020', bootsColor: '#2d1a1a', hairStyle: 'bald', hairColor: '#8b0000',
            equipment: { ...DEFAULT_CONFIG.equipment, heavyLeatherArmor: true, shirt: true, pants: true, shoes: true, bracers: true, belt: true },
            selectedItem: 'Halberd', weaponStance: 'shoulder'
        }
    },
    {
        name: "Blacksmith",
        role: "Civilian",
        color: "bg-orange-900",
        config: {
            bodyType: 'male', bodyVariant: 'muscular', skinColor: '#ffdbac', hairStyle: 'bald',
            shirtColor: '#000000', pantsColor: '#808080', bootsColor: '#000000', apronColor: '#4e342e', apronDetailColor: '#3e2723',
            equipment: { ...DEFAULT_CONFIG.equipment, blacksmithApron: true, shirt: true, pants: true, shoes: true, belt: true },
            selectedItem: 'Pickaxe', weaponStance: 'side'
        }
    },
    {
        name: "Shopkeeper",
        role: "Civilian",
        color: "bg-purple-800",
        config: {
            bodyType: 'female', bodyVariant: 'average', outfit: 'noble', hairStyle: 'crew',
            shirtColor: '#6a4c93', pantsColor: '#4a2f7a',
            equipment: { ...DEFAULT_CONFIG.equipment, robe: true, cape: true, belt: true, shirt: true, pants: true, shoes: true },
            selectedItem: null, weaponStance: 'side'
        }
    },
    {
        name: "Monk",
        role: "Brawler",
        color: "bg-amber-600",
        config: {
            bodyType: 'male', bodyVariant: 'average', outfit: 'noble', skinColor: '#d2b48c',
            shirtColor: '#ff8c00', pantsColor: '#8b4513', bootsColor: '#654321', robeColor: '#ff8c00', robeTrimColor: '#8b0000',
            hairStyle: 'bald',
            equipment: { ...DEFAULT_CONFIG.equipment, robe: true, belt: true, shirt: true, pants: true, shoes: false },
            selectedItem: null, weaponStance: 'side'
        }
    }
];

export const ImpersonateControls: React.FC<ImpersonateControlsProps> = ({ setConfig }) => {
    
    const applyPreset = (preset: typeof NPC_PRESETS[0]) => {
        setConfig(prev => ({
            ...prev,
            ...preset.config,
            // Ensure equipment object is merged correctly to reset unspecified slots
            equipment: {
                ...DEFAULT_CONFIG.equipment,
                ...preset.config.equipment
            }
        }));
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <h3 className="text-blue-200 font-bold text-sm uppercase tracking-wider mb-1">Identity Theft</h3>
                <p className="text-blue-300/70 text-xs">Transform your appearance instantly to match any known entity in the realm. (Humanoids only)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {NPC_PRESETS.map((npc) => (
                    <button
                        key={npc.name}
                        onClick={() => applyPreset(npc)}
                        className="relative group overflow-hidden bg-slate-800 border border-slate-700 hover:border-white/30 rounded-xl p-4 text-left transition-all hover:shadow-xl active:scale-95"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 ${npc.color} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`} />
                        
                        <div className="relative z-10">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white/90 mb-2 ${npc.color} bg-opacity-80`}>
                                {npc.role}
                            </span>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{npc.name}</h4>
                            <div className="mt-4 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-slate-300 uppercase">Apply Look</span>
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
