
import React from 'react';
import { PlayerConfig, OutfitType } from '../../../types';
import { OUTFIT_PRESETS } from '../../../data/constants';
import { ColorPicker, ToggleButton } from '../panels/CommonControls';

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
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleButton 
                            label="Hip Sheath"
                            isActive={config.weaponStance === 'side'}
                            onClick={() => handleConfigChange('weaponStance', 'side')}
                            activeColor="blue"
                        />
                        <ToggleButton 
                            label="Shoulder Mount"
                            isActive={config.weaponStance === 'shoulder'}
                            onClick={() => handleConfigChange('weaponStance', 'shoulder')}
                            activeColor="blue"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modular Equipment</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            {id: 'helm', label: 'Helm'}, {id: 'skullcap', label: 'Skullcap'}, {id: 'hood', label: 'Hood'}, {id: 'mageHat', label: 'Mage Hat'},
                            {id: 'mask', label: 'Mask'}, {id: 'shoulders', label: 'Pads'}, {id: 'shield', label: 'Shield'},
                            {id: 'robe', label: 'Robe'}, {id: 'skirt', label: 'Skirt'}, {id: 'quiltedArmor', label: 'Quilted'}, {id: 'leatherArmor', label: 'Leather'}, {id: 'leatherDoublet', label: 'Doublet'},
                            {id: 'heavyLeatherArmor', label: 'H.Leather'}, {id: 'ringMail', label: 'RingMail'}, {id: 'plateMail', label: 'PlateMail'},
                            {id: 'shirt', label: 'Shirt'}, {id: 'pants', label: 'Pants'}, {id: 'hideBreeches', label: 'Hide'}, {id: 'leatherPants', label: 'L.Pants'}, {id: 'chainLeggings', label: 'Chain'}, {id: 'plateLeggings', label: 'Plate'}, {id: 'warlordLegPlates', label: 'Warlord'}, {id: 'greaves', label: 'Greaves'}, {id: 'shorts', label: 'Shorts'}, {id: 'shoes', label: 'Shoes'},
                            {id: 'bracers', label: 'Bracers'}, {id: 'gloves', label: 'Gloves'}, {id: 'cape', label: 'Cape'}, {id: 'belt', label: 'Belt'}
                        ].map((eq) => (
                            <ToggleButton 
                                key={eq.id}
                                label={eq.label}
                                isActive={!!config.equipment[eq.id as keyof typeof config.equipment]}
                                onClick={() => handleEquipmentChange(eq.id as any)}
                                activeColor="blue"
                            />
                        ))}
                        <ToggleButton 
                            label="Hair"
                            isActive={config.hairStyle !== 'bald'}
                            onClick={handleHairToggle}
                            activeColor="green"
                        />
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
