
import React from 'react';
import { PlayerConfig, OutfitType } from '../../../types';
import { OUTFIT_PRESETS } from '../../../data/constants';
import { ColorPicker } from '../CommonControls';

interface OutfitControlsProps {
    config: PlayerConfig;
    setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
}

export const OutfitControls: React.FC<OutfitControlsProps> = ({ config, setConfig }) => {

    const handleConfigChange = (key: keyof PlayerConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleOutfitChange = (outfit: OutfitType) => {
        const preset = OUTFIT_PRESETS[outfit];
        if (preset) {
            setConfig(prev => ({
                ...prev,
                ...preset
            }));
        }
    };

    const handleEquipmentChange = (key: keyof PlayerConfig['equipment']) => {
        setConfig(prev => ({
            ...prev,
            equipment: {
                ...prev.equipment,
                [key]: !prev.equipment[key]
            }
        }));
    };

    const handleHairToggle = () => {
        setConfig(prev => ({
            ...prev,
            hairStyle: prev.hairStyle === 'bald' ? 'crew' : 'bald'
        }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Outfit Template</label>
                    <select 
                        value={config.outfit} 
                        onChange={(e) => handleOutfitChange(e.target.value as OutfitType)} 
                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="nude">Natural (Nude)</option>
                        <option value="naked">Standard (Underwear)</option>
                        <option value="peasant">Commoner / Peasant</option>
                        <option value="warrior">Combatant / Warrior</option>
                        <option value="noble">Regal / Noble</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Combat Readiness</label>
                    <div className="flex bg-black/40 rounded-xl p-1.5 border border-white/5">
                        <button 
                            onClick={() => handleConfigChange('weaponStance', 'side')} 
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${config.weaponStance === 'side' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Hip Sheath
                        </button>
                        <button 
                            onClick={() => handleConfigChange('weaponStance', 'shoulder')} 
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${config.weaponStance === 'shoulder' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Shoulder Mount
                        </button>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modular Equipment</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            {id: 'helm', label: 'Helm'}, {id: 'hood', label: 'Hood'}, {id: 'mageHat', label: 'Mage Hat'},
                            {id: 'mask', label: 'Mask'}, {id: 'shoulders', label: 'Pads'}, {id: 'shield', label: 'Shield'},
                            {id: 'robe', label: 'Robe'}, {id: 'quiltedArmor', label: 'Quilted'}, {id: 'leatherArmor', label: 'Leather'},
                            {id: 'heavyLeatherArmor', label: 'H.Leather'}, {id: 'ringMail', label: 'RingMail'}, {id: 'plateMail', label: 'PlateMail'},
                            {id: 'shirt', label: 'Shirt'}, {id: 'pants', label: 'Pants'}, {id: 'shoes', label: 'Shoes'},
                            {id: 'bracers', label: 'Bracers'}, {id: 'cape', label: 'Cape'}, {id: 'belt', label: 'Belt'}
                        ].map((eq) => (
                            <button 
                                key={eq.id}
                                onClick={() => handleEquipmentChange(eq.id as any)} 
                                className={`py-2 text-[9px] font-black uppercase tracking-tighter rounded-lg border transition-all ${
                                    config.equipment[eq.id as keyof typeof config.equipment] 
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' 
                                    : 'bg-black/20 border-white/5 text-slate-600 hover:border-white/20'
                                }`}
                            >
                                {eq.label}
                            </button>
                        ))}
                        <button 
                            onClick={handleHairToggle} 
                            className={`py-2 text-[9px] font-black uppercase tracking-tighter rounded-lg border transition-all ${
                                config.hairStyle !== 'bald' 
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[inset_0_0_10px_rgba(34,197,94,0.2)]' 
                                : 'bg-black/20 border-white/5 text-slate-600 hover:border-white/20'
                            }`}
                        >
                            Hair
                        </button>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5 bg-black/20 p-4 rounded-xl">
                    <div className="grid grid-cols-1 gap-4">
                        {config.equipment.robe && (
                            <>
                                <ColorPicker label="Robe Primary" value={config.robeColor} onChange={(v) => handleConfigChange('robeColor', v)} />
                                <ColorPicker label="Robe Secondary" value={config.robeTrimColor} onChange={(v) => handleConfigChange('robeTrimColor', v)} />
                            </>
                        )}
                        <ColorPicker label="Apparel Base" value={config.shirtColor} onChange={(v) => handleConfigChange('shirtColor', v)} />
                        <ColorPicker label="Apparel Pattern" value={config.shirtColor2} onChange={(v) => handleConfigChange('shirtColor2', v)} />
                        <ColorPicker label="Legwear Color" value={config.pantsColor} onChange={(v) => handleConfigChange('pantsColor', v)} />
                        <ColorPicker label="Apron Base" value={config.apronColor} onChange={(v) => handleConfigChange('apronColor', v)} />
                    </div>
                </div>
            </div>
        </div>
    );
};
