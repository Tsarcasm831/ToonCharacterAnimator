
import React from 'react';
import { PlayerConfig, BodyVariant } from '../../../types';
import { BODY_PRESETS } from '../../../data/constants';
import { ColorPicker, ToggleButton } from '../CommonControls';

interface BodyControlsProps {
    config: PlayerConfig;
    setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
}

export const BodyControls: React.FC<BodyControlsProps> = ({ config, setConfig }) => {
    
    const handleConfigChange = (key: keyof PlayerConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleBodyVariantChange = (variant: BodyVariant) => {
        const preset = BODY_PRESETS[variant];
        setConfig(prev => ({
            ...prev,
            bodyVariant: variant,
            ...preset
        }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identity Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleButton 
                            label="Masculine"
                            isActive={config.bodyType === 'male'}
                            onClick={() => handleConfigChange('bodyType', 'male')}
                            activeColor="blue"
                        />
                        <ToggleButton 
                            label="Feminine"
                            isActive={config.bodyType === 'female'}
                            onClick={() => handleConfigChange('bodyType', 'female')}
                            activeColor="pink"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Anatomy Variant</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['average', 'muscular', 'slim', 'heavy'].map(variant => (
                            <button 
                                key={variant} 
                                onClick={() => handleBodyVariantChange(variant as BodyVariant)} 
                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                    config.bodyVariant === variant 
                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                                    : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                {variant}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="bg-black/20 p-4 rounded-xl space-y-4">
                        <ColorPicker label="Dermal Tone" value={config.skinColor} onChange={(v) => handleConfigChange('skinColor', v)} />
                        <ColorPicker label="Follicle Color" value={config.hairColor} onChange={(v) => handleConfigChange('hairColor', v)} />
                    </div>
                </div>
            </div>
        </div>
    );
};
