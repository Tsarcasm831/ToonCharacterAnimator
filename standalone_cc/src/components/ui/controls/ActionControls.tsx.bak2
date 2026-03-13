import React from 'react';
import type { PlayerInput } from '../../../types';
import { Button, ToggleButton } from '../panels/CommonControls';

interface ActionControlsProps {
    manualInput: Partial<PlayerInput>;
    isDeadUI: boolean;
    movementMode: 'idle' | 'walk' | 'run';
    setManualInput: React.Dispatch<React.SetStateAction<Partial<PlayerInput>>>;
    handleDeathToggle: () => void;
    handleMovementToggle: () => void;
    triggerAction: (key: keyof PlayerInput) => void;
    onExport: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
    manualInput,
    isDeadUI,
    movementMode,
    setManualInput,
    handleDeathToggle,
    handleMovementToggle,
    triggerAction,
    onExport
}) => {
    const toggleInput = (key: keyof PlayerInput) => {
        setManualInput(prev => ({ ...prev, [key]: !prev[key] }));
    };
    const [showHelp, setShowHelp] = React.useState(false);

    return (
        <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white/70 p-2.5">
                <button
                    type="button"
                    onClick={() => setShowHelp((prev) => !prev)}
                    aria-expanded={showHelp}
                    className="w-full flex items-center justify-between text-left"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Actions Help</span>
                    <span className="text-[10px] font-mono text-gray-500">{showHelp ? 'Hide' : 'Show'}</span>
                </button>
                {showHelp && (
                    <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-gray-500">
                        <p><span className="font-bold text-gray-700">Move:</span> Cycles Idle → Walk → Run.</p>
                        <p><span className="font-bold text-gray-700">Combat Mode:</span> Enables combat stance and combat input handling.</p>
                        <p><span className="font-bold text-gray-700">Summon:</span> Disabled while carrying a selected inventory item.</p>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <ToggleButton 
                    label={`Move: ${movementMode.toUpperCase()}`}
                    isActive={movementMode !== 'idle'}
                    onClick={handleMovementToggle}
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
                    type="button"
                    onMouseDown={() => setManualInput(prev => ({...prev, jump: true}))} 
                    onMouseUp={() => setManualInput(prev => ({...prev, jump: false}))} 
                    onMouseLeave={() => setManualInput(prev => ({...prev, jump: false}))} 
                    className="p-2 rounded-lg font-bold text-[10px] uppercase tracking-wider bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 active:bg-blue-50 active:text-blue-600 active:border-blue-200 transition-all"
                >
                    Jump (Hold)
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => triggerAction('attack1')} className="hover:text-red-600 hover:border-red-200">Punch</Button>
                <Button onClick={() => triggerAction('attack2')} className="hover:text-red-600 hover:border-red-200">Swing</Button>
                <Button onClick={() => triggerAction('interact')} className="hover:text-blue-600 hover:border-blue-200">Interact</Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
                <Button onClick={() => triggerAction('isPickingUp')}>Pick Up (F)</Button>
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
                    className={`flex justify-center gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200`}
                >
                    <span>✨ Summon (L)</span>
                </Button>
            </div>

            <Button onClick={onExport} variant="primary" className="w-full flex justify-center items-center gap-2 py-3 bg-indigo-600 border-indigo-500 hover:bg-indigo-700 text-white">
                <span>Download .ZIP</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </Button>
        </div>
    );
};
