
import React from 'react';
import { PlayerConfig } from '../../../types';
import { Slider } from '../CommonControls';

interface EquipmentRiggingControlsProps {
    config: PlayerConfig;
    setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
}

export const EquipmentRiggingControls: React.FC<EquipmentRiggingControlsProps> = ({ config, setConfig }) => {

    const handleConfigChange = (key: keyof PlayerConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const hasShirt = config.equipment.shirt || config.equipment.quiltedArmor || config.equipment.leatherArmor;
    const isMale = config.bodyType === 'male';

    return (
        <div className="space-y-6">
            {config.equipment.helm && (
                <div className="space-y-2 border-b border-gray-100 pb-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Helm Rigging</h5>
                    <Slider label="Helm X" value={config.helmX} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('helmX', v)} />
                    <Slider label="Helm Y" value={config.helmY} min={0.0} max={0.15} step={0.002} onChange={(v) => handleConfigChange('helmY', v)} />
                    <Slider label="Helm Z" value={config.helmZ} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('helmZ', v)} />
                    <Slider label="Helm Rot X" value={config.helmRotX} min={-0.5} max={0.5} step={0.02} onChange={(v) => handleConfigChange('helmRotX', v)} />
                    <Slider label="Helm Scale" value={config.helmScale} min={0.5} max={1.5} step={0.02} onChange={(v) => handleConfigChange('helmScale', v)} />
                </div>
            )}

            {config.equipment.mageHat && (
                <div className="space-y-2 border-b border-gray-100 pb-4">
                    <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Mage Hat Rigging</h5>
                    <Slider label="Hat X" value={config.mageHatX} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('mageHatX', v)} />
                    <Slider label="Hat Y" value={config.mageHatY} min={0.0} max={0.25} step={0.002} onChange={(v) => handleConfigChange('mageHatY', v)} />
                    <Slider label="Hat Z" value={config.mageHatZ} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('mageHatZ', v)} />
                    <Slider label="Hat Rot X" value={config.mageHatRotX} min={-0.8} max={0.2} step={0.02} onChange={(v) => handleConfigChange('mageHatRotX', v)} />
                    <Slider label="Hat Scale" value={config.mageHatScale} min={0.5} max={1.5} step={0.02} onChange={(v) => handleConfigChange('mageHatScale', v)} />
                </div>
            )}

            {config.equipment.hood && (
                <div className="space-y-2 border-b border-gray-100 pb-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hood Rigging</h5>
                    <Slider label="Hood X" value={config.hoodX} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('hoodX', v)} />
                    <Slider label="Hood Y" value={config.hoodY} min={0.0} max={0.15} step={0.002} onChange={(v) => handleConfigChange('hoodY', v)} />
                    <Slider label="Hood Z" value={config.hoodZ} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('hoodZ', v)} />
                    <Slider label="Hood Scale" value={config.hoodScale} min={0.5} max={1.5} step={0.02} onChange={(v) => handleConfigChange('hoodScale', v)} />
                </div>
            )}

            {hasShirt && (
                <div className="space-y-2 border-b border-gray-100 pb-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shirt Rigging</h5>
                    <Slider label="Offset X" value={config.shirtX} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('shirtX', v)} />
                    <Slider label="Offset Y" value={config.shirtY} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('shirtY', v)} />
                    <Slider label="Offset Z" value={config.shirtZ} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('shirtZ', v)} />
                    
                    <h6 className="text-[8px] font-bold text-blue-500 uppercase mt-2">Rotation</h6>
                    <Slider label="Rot X" value={config.shirtRotX} min={-1.5} max={1.5} step={0.05} onChange={(v) => handleConfigChange('shirtRotX', v)} />
                    <Slider label="Rot Y" value={config.shirtRotY} min={-1.5} max={1.5} step={0.05} onChange={(v) => handleConfigChange('shirtRotY', v)} />
                    <Slider label="Rot Z" value={config.shirtRotZ} min={-1.5} max={1.5} step={0.05} onChange={(v) => handleConfigChange('shirtRotZ', v)} />

                    <h6 className="text-[8px] font-bold text-blue-500 uppercase mt-2">Scale & Stretch</h6>
                    <Slider label="Global Scale" value={config.shirtScale} min={0.8} max={1.2} step={0.01} onChange={(v) => handleConfigChange('shirtScale', v)} />
                    <Slider label="Stretch X" value={config.shirtStretchX} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('shirtStretchX', v)} />
                    <Slider label="Stretch Y" value={config.shirtStretchY} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('shirtStretchY', v)} />
                    <Slider label="Stretch Z" value={config.shirtStretchZ} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('shirtStretchZ', v)} />

                    {isMale && (
                        <>
                            <h6 className="text-[8px] font-bold text-green-500 uppercase mt-4">Ab-Cover Rigging</h6>
                            <Slider label="Ab X" value={config.shirtAbsX} min={-0.2} max={0.2} step={0.001} onChange={(v) => handleConfigChange('shirtAbsX', v)} />
                            <Slider label="Ab Y" value={config.shirtAbsY} min={-0.2} max={0.2} step={0.001} onChange={(v) => handleConfigChange('shirtAbsY', v)} />
                            <Slider label="Ab Z" value={config.shirtAbsZ} min={-0.2} max={0.2} step={0.001} onChange={(v) => handleConfigChange('shirtAbsZ', v)} />
                            <Slider label="Ab Scale" value={config.shirtAbsScale} min={0.5} max={2.0} step={0.01} onChange={(v) => handleConfigChange('shirtAbsScale', v)} />
                            <Slider label="Ab Spacing" value={config.shirtAbsSpacing} min={0.5} max={2.0} step={0.01} onChange={(v) => handleConfigChange('shirtAbsSpacing', v)} />
                        </>
                    )}
                </div>
            )}

            {config.equipment.blacksmithApron && (
                <div className="space-y-2 border-b border-gray-100 pb-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Apron Rigging</h5>
                    <h6 className="text-[8px] font-bold text-orange-500 uppercase mt-2">Bib (Top)</h6>
                    <Slider label="Bib X" value={config.apronBibX} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('apronBibX', v)} />
                    <Slider label="Bib Y" value={config.apronBibY} min={0.0} max={0.4} step={0.002} onChange={(v) => handleConfigChange('apronBibY', v)} />
                    <Slider label="Bib Z" value={config.apronBibZ} min={0.1} max={0.4} step={0.002} onChange={(v) => handleConfigChange('apronBibZ', v)} />
                    <Slider label="Bib Scale" value={config.apronBibScale} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('apronBibScale', v)} />

                    <h6 className="text-[8px] font-bold text-orange-500 uppercase mt-2">Skirt (Bottom)</h6>
                    <Slider label="Skirt X" value={config.apronSkirtX} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('apronSkirtX', v)} />
                    <Slider label="Skirt Y" value={config.apronSkirtY} min={-0.2} max={0.2} step={0.002} onChange={(v) => handleConfigChange('apronSkirtY', v)} />
                    <Slider label="Skirt Z" value={config.apronSkirtZ} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('apronSkirtZ', v)} />
                    <Slider label="Skirt Scale X" value={config.apronSkirtScaleX} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('apronSkirtScaleX', v)} />
                    <Slider label="Skirt Scale Y" value={config.apronSkirtScaleY} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('apronSkirtScaleY', v)} />
                    <Slider label="Skirt Scale Z" value={config.apronSkirtScaleZ} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('apronSkirtScaleZ', v)} />

                    <h6 className="text-[8px] font-bold text-orange-500 uppercase mt-2">Straps</h6>
                    <Slider label="Strap Y" value={config.apronStrapY} min={0.2} max={0.5} step={0.002} onChange={(v) => handleConfigChange('apronStrapY', v)} />
                    <Slider label="Strap Z" value={config.apronStrapZ} min={-0.1} max={0.2} step={0.002} onChange={(v) => handleConfigChange('apronStrapZ', v)} />
                    <Slider label="Strap Rot X" value={config.apronStrapRotX} min={-Math.PI} max={0} step={0.02} onChange={(v) => handleConfigChange('apronStrapRotX', v)} />
                    <Slider label="Strap Rot Z" value={config.apronStrapRotZ} min={0} max={0.5} step={0.01} onChange={(v) => handleConfigChange('apronStrapRotZ', v)} />
                </div>
            )}

            {config.equipment.mask && (
                <div className="space-y-2 border-b border-gray-100 pb-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mask Rigging</h5>
                    <Slider label="Mask X" value={config.maskX} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('maskX', v)} />
                    <Slider label="Mask Y" value={config.maskY} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('maskY', v)} />
                    <Slider label="Mask Z" value={config.maskZ} min={-0.1} max={0.1} step={0.002} onChange={(v) => handleConfigChange('maskZ', v)} />
                    <Slider label="Mask Rot X" value={config.maskRotX} min={-1.5} max={1.5} step={0.05} onChange={(v) => handleConfigChange('maskRotX', v)} />
                    <Slider label="Mask Scale" value={config.maskScale} min={0.8} max={1.2} step={0.01} onChange={(v) => handleConfigChange('maskScale', v)} />
                    
                    <h6 className="text-[8px] font-bold text-blue-500 uppercase mt-2">Geometry Stretch</h6>
                    <Slider label="Stretch X" value={config.maskStretchX} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('maskStretchX', v)} />
                    <Slider label="Stretch Y" value={config.maskStretchY} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('maskStretchY', v)} />
                    <Slider label="Stretch Z" value={config.maskStretchZ} min={0.5} max={1.5} step={0.01} onChange={(v) => handleConfigChange('maskStretchZ', v)} />
                </div>
            )}

            {config.equipment.shoulders && (
                <div className="space-y-2 border-b border-gray-100 pb-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shoulder Rigging</h5>
                    <Slider label="Pads X" value={config.shoulderX} min={0} max={0.3} step={0.005} onChange={(v) => handleConfigChange('shoulderX', v)} />
                    <Slider label="Pads Y" value={config.shoulderY} min={-0.1} max={0.2} step={0.005} onChange={(v) => handleConfigChange('shoulderY', v)} />
                    <Slider label="Pads Z" value={config.shoulderZ} min={-0.2} max={0.2} step={0.005} onChange={(v) => handleConfigChange('shoulderZ', v)} />
                    <Slider label="Pads Scale" value={config.shoulderScale} min={0.5} max={2.0} step={0.05} onChange={(v) => handleConfigChange('shoulderScale', v)} />
                </div>
            )}

            {config.equipment.shield && (
                <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shield Rigging</h5>
                    <Slider label="Shield X" value={config.shieldX} min={-0.2} max={0.3} step={0.005} onChange={(v) => handleConfigChange('shieldX', v)} />
                    <Slider label="Shield Y" value={config.shieldY} min={-0.4} max={0.2} step={0.005} onChange={(v) => handleConfigChange('shieldY', v)} />
                    <Slider label="Shield Z" value={config.shieldZ} min={-0.2} max={0.2} step={0.005} onChange={(v) => handleConfigChange('shieldZ', v)} />
                    <Slider label="Shield Rot Z" value={config.shieldRotZ} min={-Math.PI} max={Math.PI} step={0.02} onChange={(v) => handleConfigChange('shieldRotZ', v)} />
                    <Slider label="Shield Scale" value={config.shieldScale} min={0.5} max={2.0} step={0.05} onChange={(v) => handleConfigChange('shieldScale', v)} />
                </div>
            )}

            {!config.equipment.helm && !config.equipment.mask && !config.equipment.hood && !config.equipment.mageHat && !config.equipment.shoulders && !config.equipment.shield && !hasShirt && (
                <div className="text-center py-6 text-gray-400 italic text-[10px]">
                    Equip armor items to see rigging controls
                </div>
            )}
        </div>
    );
};
