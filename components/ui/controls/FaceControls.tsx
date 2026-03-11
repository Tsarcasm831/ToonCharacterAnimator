
import React from 'react';
import { PlayerConfig } from '../../../types';
import { Slider, ColorPicker, ToggleButton } from '../panels/CommonControls';

interface FaceControlsProps {
    config: PlayerConfig;
    setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
}

export const FaceControls: React.FC<FaceControlsProps> = ({ config, setConfig }) => {

    const handleConfigChange = (key: keyof PlayerConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const toggleBrain = () => {
        setConfig(prev => ({ ...prev, showBrain: !prev.showBrain }));
    };
    
    const toggleOrgans = () => {
        setConfig(prev => ({ ...prev, showOrgans: !prev.showOrgans }));
    };

    const toggleDebugHead = () => {
        setConfig(prev => ({ ...prev, debugHead: !prev.debugHead }));
    };

    const toggleChakraNetwork = () => {
        setConfig(prev => ({ ...prev, showChakraNetwork: !prev.showChakraNetwork }));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <ToggleButton label="Brain" isActive={config.showBrain} onClick={toggleBrain} activeColor="pink" />
                <ToggleButton label="Organs" isActive={config.showOrgans} onClick={toggleOrgans} activeColor="red" />
                <ToggleButton label="Debug Mask" isActive={config.debugHead} onClick={toggleDebugHead} activeColor="purple" />
                <ToggleButton label="Chakra Net" isActive={config.showChakraNetwork} onClick={toggleChakraNetwork} activeColor="blue" />
            </div>
            {config.showBrain && <Slider label="Brain Size" value={config.brainSize} min={0.5} max={2.0} step={0.1} onChange={(v) => handleConfigChange('brainSize', v)} />}
            
            <div className="space-y-2">
                <ColorPicker label="Eyes" value={config.eyeColor} onChange={(v) => handleConfigChange('eyeColor', v)} />
                <ColorPicker label="Lips" value={config.lipColor} onChange={(v) => handleConfigChange('lipColor', v)} />
            </div>

            <div className="space-y-2">
                <Slider label="Iris Size" value={config.irisScale} min={0.25} max={0.75} step={0.05} onChange={(v) => handleConfigChange('irisScale', v)} />
                <Slider label="Pupil Size" value={config.pupilScale} min={0.25} max={0.75} step={0.05} onChange={(v) => handleConfigChange('pupilScale', v)} />
                <Slider label="Nose H" value={config.noseHeight} min={-0.05} max={0.05} step={0.005} onChange={(v) => handleConfigChange('noseHeight', v)} />
                <Slider label="Nose Fwd" value={config.noseForward} min={-0.05} max={0.05} step={0.005} onChange={(v) => handleConfigChange('noseForward', v)} />
                <Slider label="Jaw Size" value={config.chinSize} min={0.5} max={1.5} step={0.05} onChange={(v) => handleConfigChange('chinSize', v)} />
            </div>
        </div>
    );
};
