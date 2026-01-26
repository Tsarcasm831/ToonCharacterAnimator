
import React from 'react';
import { PlayerInput, PlayerConfig } from '../../../types';
import { Button, ToggleButton } from '../panels/CommonControls';

interface ActionControlsProps {
    manualInput: Partial<PlayerInput>;
    config?: PlayerConfig;
    setConfig?: React.Dispatch<React.SetStateAction<PlayerConfig>>;
    isDeadUI: boolean;
    setManualInput: React.Dispatch<React.SetStateAction<Partial<PlayerInput>>>;
    handleDeathToggle: () => void;
    triggerAction: (key: keyof PlayerInput) => void;
    onExport: () => void;
    onSpawnAnimals: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
    manualInput,
    config,
    setConfig,
    isDeadUI,
    setManualInput,
    handleDeathToggle,
    triggerAction,
    onExport,
    onSpawnAnimals
}) => {
    const toggleInput = (key: keyof PlayerInput) => {
        setManualInput(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleEntity = (key: 'showNPC' | 'showAssassin' | 'showGuard' | 'isAssassinHostile') => {
        if (!setConfig || !config) return;
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <ToggleButton 
                    label={manualInput.isRunning ? 'Running' : 'Walk / Run'}
                    isActive={!!manualInput.isRunning}
                    onClick={() => toggleInput('isRunning')}
                    activeColor="blue"
                />
                <ToggleButton 
                    label={manualInput.combat ? 'In Combat' : 'Combat Mode'}
                    isActive={!!manualInput.combat}
                    onClick={() => toggleInput('combat')}
                    activeColor="orange"
                />
                <ToggleButton 
                    label={isDeadUI ? 'Resurrect' : 'Die / Ragdoll'}
                    isActive={isDeadUI}
                    onClick={handleDeathToggle}
                    activeColor="red"
                />
                <button 
                    onMouseDown={() => setManualInput(prev => ({...prev, jump: true}))} 
                    onMouseUp={() => setManualInput(prev => ({...prev, jump: false}))} 
                    onMouseLeave={() => setManualInput(prev => ({...prev, jump: false}))} 
                    className="p-2 rounded-lg font-bold text-[10px] uppercase tracking-wider bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 active:bg-blue-50 active:text-blue-600 active:border-blue-200 transition-all"
                >
                    Jump (Hold)
                </button>
            </div>

            {config && setConfig && (
                <div className="grid grid-cols-2 gap-2">
                    <ToggleButton 
                        label={config.showNPC ? 'Hide NPC' : 'Show NPC'}
                        isActive={config.showNPC}
                        onClick={() => toggleEntity('showNPC')}
                        activeColor="green"
                    />
                    <ToggleButton 
                        label={config.showGuard ? 'Hide Guard' : 'Show Guard'}
                        isActive={config.showGuard}
                        onClick={() => toggleEntity('showGuard')}
                        activeColor="blue"
                    />
                    <ToggleButton 
                        label={config.showAssassin ? 'Hide Sin' : 'Show Sin'}
                        isActive={config.showAssassin}
                        onClick={() => toggleEntity('showAssassin')}
                        activeColor="purple"
                    />
                    <ToggleButton 
                        label={config.isAssassinHostile ? 'Aggro ON' : 'Aggro OFF'}
                        isActive={config.isAssassinHostile}
                        onClick={() => toggleEntity('isAssassinHostile')}
                        activeColor="red"
                        className={!config.showAssassin ? 'opacity-50 cursor-not-allowed' : ''}
                    />
                </div>
            )}

            <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => triggerAction('attack1')} className="hover:text-red-600 hover:border-red-200">Punch</Button>
                <Button onClick={() => triggerAction('attack2')} className="hover:text-red-600 hover:border-red-200">Swing</Button>
                <Button onClick={() => triggerAction('interact')} className="hover:text-blue-600 hover:border-blue-200">Interact</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => triggerAction('isPickingUp')}>Pick Up (F)</Button>
                <Button onClick={() => triggerAction('toggleFirstPerson')}>POV Mode (V)</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => triggerAction('wave')} className="hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 flex justify-center gap-2">
                    <span>👋 Wave</span>
                </Button>
                <Button onClick={() => triggerAction('leftHandWave')} className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex justify-center gap-2">
                    <span>🤳 Left Wave</span>
                </Button>
            </div>
            
            <div className="grid grid-cols-1">
                <Button 
                    onClick={() => triggerAction('summon')} 
                    className={`flex justify-center gap-2 ${config?.selectedItem ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'}`}
                    disabled={!!config?.selectedItem}
                >
                    <span>✨ Summon (L)</span>
                </Button>
            </div>

            <div className="pt-2 border-t border-gray-100">
                <Button 
                    onClick={onSpawnAnimals} 
                    variant="success"
                    className="w-full flex justify-center items-center gap-2 py-3"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Manage Animals
                </Button>
            </div>

            <Button onClick={onExport} variant="primary" className="w-full flex justify-center items-center gap-2 py-3 bg-indigo-600 border-indigo-500 hover:bg-indigo-700 text-white">
                <span>Download .ZIP</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </Button>
        </div>
    );
};
