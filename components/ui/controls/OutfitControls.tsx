
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
        <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Preset Outfit</label>
                <select 
                    value={config.outfit} 
                    onChange={(e) => handleOutfitChange(e.target.value as OutfitType)} 
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none text-gray-700"
                >
                    <option value="nude">Nude</option>
                    <option value="naked">Naked</option>
                    <option value="peasant">Peasant</option>
                    <option value="warrior">Warrior</option>
                    <option value="noble">Noble</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Weapon Pose</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button 
                        onClick={() => handleConfigChange('weaponStance', 'side')} 
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${config.weaponStance === 'side' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
                    >
                        Side (Hip)
                    </button>
                    <button 
                        onClick={() => handleConfigChange('weaponStance', 'shoulder')} 
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${config.weaponStance === 'shoulder' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                    >
                        Shoulder
                    </button>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Equipment</label>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleEquipmentChange('helm')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.helm ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-400'}`}>Helm</button>
                    <button onClick={() => handleEquipmentChange('hood')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.hood ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-400'}`}>Hood</button>
                    <button onClick={() => handleEquipmentChange('mageHat')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.mageHat ? 'bg-indigo-100 border-indigo-500 text-indigo-800' : 'bg-white border-gray-200 text-gray-400'}`}>Mage Hat</button>
                    <button onClick={() => handleEquipmentChange('mask')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.mask ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-400'}`}>Mask</button>
                    <button onClick={() => handleEquipmentChange('shoulders')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.shoulders ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-400'}`}>Pads</button>
                    <button onClick={() => handleEquipmentChange('shield')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.shield ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-amber-400'}`}>Shield</button>
                    <button onClick={() => handleEquipmentChange('robe')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.robe ? 'bg-indigo-100 border-indigo-500 text-indigo-800' : 'bg-white border-gray-200 text-gray-400'}`}>Robe</button>
                    <button onClick={() => handleEquipmentChange('quiltedArmor')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.quiltedArmor ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-400'}`}>Quilted</button>
                    <button onClick={() => handleEquipmentChange('leatherArmor')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.leatherArmor ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-400'}`}>Leather</button>
                    <button onClick={() => handleEquipmentChange('heavyLeatherArmor')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.heavyLeatherArmor ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-400'}`}>H.Leather</button>
                    <button onClick={() => handleEquipmentChange('ringMail')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.ringMail ? 'bg-slate-200 border-slate-600 text-slate-800' : 'bg-white border-gray-200 text-gray-400'}`}>RingMail</button>
                    <button onClick={() => handleEquipmentChange('plateMail')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.plateMail ? 'bg-blue-100 border-blue-600 text-blue-800' : 'bg-white border-gray-200 text-gray-400'}`}>PlateMail</button>
                    <button onClick={() => handleEquipmentChange('shirt')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.shirt ? 'bg-red-100 border-red-500 text-red-800' : 'bg-white border-gray-200 text-gray-400'}`}>Shirt</button>
                    <button onClick={() => handleEquipmentChange('pants')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.pants ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-200 text-gray-400'}`}>Pants</button>
                    <button onClick={() => handleEquipmentChange('blacksmithApron')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.blacksmithApron ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-white border-gray-200 text-gray-400'}`}>Apron</button>
                    <button onClick={() => handleEquipmentChange('shoes')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.shoes ? 'bg-stone-100 border-stone-500 text-stone-800' : 'bg-white border-gray-200 text-gray-400'}`}>Shoes</button>
                    <button onClick={() => handleEquipmentChange('bracers')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.bracers ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-400'}`}>Bracers</button>
                    <button onClick={() => handleEquipmentChange('cape')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.cape ? 'bg-purple-100 border-purple-500 text-purple-800' : 'bg-white border-gray-200 text-gray-400'}`}>Cape</button>
                    <button onClick={() => handleEquipmentChange('belt')} className={`py-1.5 text-[10px] font-bold rounded border ${config.equipment.belt ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : 'bg-white border-gray-200 text-gray-400'}`}>Belt</button>
                    <button onClick={handleHairToggle} className={`py-1.5 text-[10px] font-bold rounded border ${config.hairStyle !== 'bald' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-200 text-gray-400'}`}>Hair</button>
                </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-gray-100">
                {config.equipment.robe && (
                    <>
                        <ColorPicker label="Robe Color" value={config.robeColor} onChange={(v) => handleConfigChange('robeColor', v)} />
                        <ColorPicker label="Robe Trim" value={config.robeTrimColor} onChange={(v) => handleConfigChange('robeTrimColor', v)} />
                    </>
                )}
                {config.equipment.mageHat && (
                    <>
                        <ColorPicker label="Hat Color" value={config.mageHatColor} onChange={(v) => handleConfigChange('mageHatColor', v)} />
                        <ColorPicker label="Band Color" value={config.mageHatBandColor} onChange={(v) => handleConfigChange('mageHatBandColor', v)} />
                    </>
                )}
                <ColorPicker label="Shirt Base" value={config.shirtColor} onChange={(v) => handleConfigChange('shirtColor', v)} />
                <ColorPicker label="Shirt Sec." value={config.shirtColor2} onChange={(v) => handleConfigChange('shirtColor2', v)} />
                <ColorPicker label="Pants" value={config.pantsColor} onChange={(v) => handleConfigChange('pantsColor', v)} />
                <ColorPicker label="Apron" value={config.apronColor} onChange={(v) => handleConfigChange('apronColor', v)} />
                <ColorPicker label="Apron Detail" value={config.apronDetailColor} onChange={(v) => handleConfigChange('apronDetailColor', v)} />
            </div>
        </div>
    );
};
