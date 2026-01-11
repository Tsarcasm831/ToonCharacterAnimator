
import React from 'react';
import { PlayerInput, PlayerConfig } from '../../../types';

interface ActionControlsProps {
    manualInput: Partial<PlayerInput>;
    config?: PlayerConfig;
    setConfig?: React.Dispatch<React.SetStateAction<PlayerConfig>>;
    isDeadUI: boolean;
    setManualInput: React.Dispatch<React.SetStateAction<Partial<PlayerInput>>>;
    handleDeathToggle: () => void;
    triggerAction: (key: keyof PlayerInput) => void;
    onExport: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
    manualInput,
    config,
    setConfig,
    isDeadUI,
    setManualInput,
    handleDeathToggle,
    triggerAction,
    onExport
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
                <button onClick={() => toggleInput('isRunning')} className={`p-2 rounded-lg font-bold text-xs border transition-all ${manualInput.isRunning ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>{manualInput.isRunning ? 'Running' : 'Walk / Run'}</button>
                <button onClick={() => toggleInput('combat')} className={`p-2 rounded-lg font-bold text-xs border transition-all ${manualInput.combat ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-600'}`}>{manualInput.combat ? 'In Combat' : 'Combat Mode'}</button>
                <button onClick={handleDeathToggle} className={`p-2 rounded-lg font-bold text-xs border transition-all ${isDeadUI ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}>{isDeadUI ? 'Resurrect' : 'Die / Ragdoll'}</button>
                <button onMouseDown={() => setManualInput(prev => ({...prev, jump: true}))} onMouseUp={() => setManualInput(prev => ({...prev, jump: false}))} onMouseLeave={() => setManualInput(prev => ({...prev, jump: false}))} className="p-2 rounded-lg font-bold text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-blue-50">Jump (Hold)</button>
            </div>

            {config && setConfig && (
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => toggleEntity('showNPC')} 
                        className={`p-2 rounded-lg font-bold text-[10px] border transition-all ${config.showNPC ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        {config.showNPC ? 'Hide NPC' : 'Show NPC'}
                    </button>
                    <button 
                        onClick={() => toggleEntity('showGuard')} 
                        className={`p-2 rounded-lg font-bold text-[10px] border transition-all ${config.showGuard ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        {config.showGuard ? 'Hide Guard' : 'Show Guard'}
                    </button>
                    <button 
                        onClick={() => toggleEntity('showAssassin')} 
                        className={`p-2 rounded-lg font-bold text-[10px] border transition-all ${config.showAssassin ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        {config.showAssassin ? 'Hide Sin' : 'Show Sin'}
                    </button>
                    <button 
                        onClick={() => toggleEntity('isAssassinHostile')} 
                        className={`p-2 rounded-lg font-bold text-[10px] border transition-all ${config.isAssassinHostile ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}
                        disabled={!config.showAssassin}
                    >
                        {config.isAssassinHostile ? 'Aggro ON' : 'Aggro OFF'}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2">
                <button onClick={() => triggerAction('attack1')} className="p-2 rounded-lg font-bold text-xs bg-white border border-gray-200 text-gray-600 hover:text-red-600">Punch</button>
                <button onClick={() => triggerAction('attack2')} className="p-2 rounded-lg font-bold text-xs bg-white border border-gray-200 text-gray-600 hover:text-red-600">Swing</button>
                <button onClick={() => triggerAction('interact')} className="p-2 rounded-lg font-bold text-xs bg-white border border-gray-200 text-gray-600 hover:text-blue-600">Interact</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => triggerAction('isPickingUp')} className="p-2 rounded-lg font-bold text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Pick Up (F)</button>
                <button onClick={() => triggerAction('toggleFirstPerson')} className="p-2 rounded-lg font-bold text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">POV Mode (V)</button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => triggerAction('wave')} className="py-2 rounded-lg font-bold text-xs bg-pink-50 border border-pink-200 text-pink-600 hover:bg-pink-100 shadow-sm flex items-center justify-center gap-2">
                    <span>👋 Wave Hello</span>
                </button>
                <button 
                    onClick={() => triggerAction('summon')} 
                    className={`py-2 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-2 ${config?.selectedItem ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100'}`}
                    disabled={!!config?.selectedItem}
                    title={config?.selectedItem ? "Unequip items to summon" : "Summoning Skill (L)"}
                >
                    <span>✨ Summon (L)</span>
                </button>
            </div>

            <button onClick={onExport} className="w-full py-2 rounded-lg font-bold text-xs bg-indigo-600 text-white shadow hover:bg-indigo-700 flex items-center justify-center gap-2"><span>Download .ZIP</span><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
        </div>
    );
};
