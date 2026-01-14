
import React, { useState } from 'react';
import { PlayerConfig, PlayerInput } from '../../types';
import { SkeletonLegend } from './controls/SkeletonLegend';
import { ControlSection } from './controls/ControlSection';
import { ActionControls } from './controls/ActionControls';
import { BodyControls } from './controls/BodyControls';
import { OutfitControls } from './controls/OutfitControls';
import { FaceControls } from './controls/FaceControls';
import { RiggingControls } from './controls/RiggingControls';
import { EquipmentRiggingControls } from './controls/EquipmentRiggingControls';
import { Slider } from './CommonControls';

interface ControlPanelProps {
    config: PlayerConfig;
    manualInput: Partial<PlayerInput>;
    isDeadUI: boolean;
    setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
    setManualInput: React.Dispatch<React.SetStateAction<Partial<PlayerInput>>>;
    handleDeathToggle: () => void;
    triggerAction: (key: keyof PlayerInput) => void;
    onExport: () => void;
    onSpawnAnimals: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    config, 
    manualInput, 
    isDeadUI, 
    setConfig, 
    setManualInput, 
    handleDeathToggle, 
    triggerAction,
    onExport,
    onSpawnAnimals
}) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Accordion state
    const [sections, setSections] = useState({
        settings: false,
        environment: false,
        actions: false,
        body: false,
        outfit: false,
        face: false,
        rigging: false,
        equipmentRigging: false
    });

    const toggleSection = (key: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleConfigChange = (key: keyof PlayerConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <>
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="absolute bottom-4 right-4 z-20 p-3 bg-white/90 backdrop-blur-md shadow-lg rounded-xl border border-white/50 text-gray-600 hover:text-blue-600 transition-all hover:scale-105 active:scale-95"
                    title="Open Controls"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            )}

            {isOpen && <SkeletonLegend />}

            <div className={`absolute top-0 right-0 h-full w-80 bg-white/90 backdrop-blur-md shadow-2xl z-20 overflow-y-auto p-4 border-l border-white/50 transition-transform duration-300 ease-in-out scrollbar-hide ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">Controls</h2>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        title="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-4 pb-20">
                    
                    <ControlSection title="Settings" isOpen={sections.settings} onToggle={() => toggleSection('settings')}>
                        <div className="space-y-4">
                            <Slider 
                                label="Volume" 
                                value={config.globalVolume} 
                                min={0} 
                                max={1} 
                                step={0.01} 
                                onChange={(v) => handleConfigChange('globalVolume', v)} 
                            />
                        </div>
                    </ControlSection>

                    <ControlSection title="Environment" isOpen={sections.environment} onToggle={() => toggleSection('environment')}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase">Auto Cycle</label>
                                <button 
                                    onClick={() => handleConfigChange('isAutoTime', !config.isAutoTime)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${config.isAutoTime ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.isAutoTime ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            
                            <Slider 
                                label="Time of Day" 
                                value={config.timeOfDay} 
                                min={0} 
                                max={24} 
                                step={0.1} 
                                onChange={(v) => {
                                    handleConfigChange('timeOfDay', v);
                                    handleConfigChange('isAutoTime', false);
                                }} 
                            />
                            
                            <Slider 
                                label="Cycle Speed" 
                                value={config.timeSpeed} 
                                min={0} 
                                max={10} 
                                step={0.1} 
                                onChange={(v) => handleConfigChange('timeSpeed', v)} 
                            />
                            
                            <p className="text-[10px] text-gray-400 italic">1.0 = 10 min full cycle (6d/4n)</p>
                        </div>
                    </ControlSection>

                    <ControlSection title="Actions" isOpen={sections.actions} onToggle={() => toggleSection('actions')}>
                        <ActionControls 
                            manualInput={manualInput}
                            config={config}
                            setConfig={setConfig}
                            isDeadUI={isDeadUI}
                            setManualInput={setManualInput}
                            handleDeathToggle={handleDeathToggle}
                            triggerAction={triggerAction}
                            onExport={onExport}
                            onSpawnAnimals={onSpawnAnimals}
                        />
                    </ControlSection>

                    <ControlSection title="Body" isOpen={sections.body} onToggle={() => toggleSection('body')}>
                        <BodyControls config={config} setConfig={setConfig} />
                    </ControlSection>

                    <ControlSection title="Outfit" isOpen={sections.outfit} onToggle={() => toggleSection('outfit')}>
                        <OutfitControls config={config} setConfig={setConfig} />
                    </ControlSection>

                    <ControlSection title="Face & Details" isOpen={sections.face} onToggle={() => toggleSection('face')}>
                        <FaceControls config={config} setConfig={setConfig} />
                    </ControlSection>

                    <ControlSection title="Rigging" isOpen={sections.rigging} onToggle={() => toggleSection('rigging')}>
                        <RiggingControls config={config} setConfig={setConfig} />
                    </ControlSection>

                    <ControlSection title="Equipment Rigging" isOpen={sections.equipmentRigging} onToggle={() => toggleSection('equipmentRigging')}>
                        <EquipmentRiggingControls config={config} setConfig={setConfig} />
                    </ControlSection>

                </div>
            </div>
        </>
    );
};
