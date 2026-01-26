
import React, { useState } from 'react';
import { PlayerConfig, PlayerInput } from '../../../types';
import { SkeletonLegend } from '../controls/SkeletonLegend';
import { ActionControls } from '../controls/ActionControls';
import { BodyControls } from '../controls/BodyControls';
import { OutfitControls } from '../controls/OutfitControls';
import { FaceControls } from '../controls/FaceControls';
import { RiggingControls } from '../controls/RiggingControls';
import { EquipmentRiggingControls } from '../controls/EquipmentRiggingControls';
import { ImpersonateControls } from '../controls/ImpersonateControls';
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

type TabKey = 'settings' | 'environment' | 'actions' | 'impersonate' | 'body' | 'outfit' | 'face' | 'rigging' | 'eq_rigging';

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
    const [activeTab, setActiveTab] = useState<TabKey>('actions');
    
    const showLegend = activeTab === 'rigging' && isOpen;

    const handleConfigChange = (key: keyof PlayerConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const TABS: { id: TabKey; label: string; icon: string }[] = [
        { id: 'actions', label: 'Actions & Input', icon: '🎮' },
        { id: 'impersonate', label: 'Impersonate', icon: '🎭' },
        { id: 'settings', label: 'Game Settings', icon: '⚙️' },
        { id: 'environment', label: 'Environment', icon: '🌍' },
        { id: 'body', label: 'Body Details', icon: '💪' },
        { id: 'outfit', label: 'Outfit & Gear', icon: '👕' },
        { id: 'face', label: 'Face & Features', icon: '👀' },
        { id: 'rigging', label: 'Bone Rigging', icon: '🦴' },
        { id: 'eq_rigging', label: 'Gear Rigging', icon: '🛡️' },
    ];

    return (
        <>
            {/* Trigger Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="absolute bottom-4 right-4 z-[60] p-4 bg-slate-900/90 backdrop-blur-md shadow-2xl rounded-full border border-white/20 text-white hover:bg-blue-600 hover:border-blue-400 transition-all hover:scale-105 active:scale-95 group"
                    title="Open Studio OS"
                >
                    <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            )}

            {/* Skeleton Overlay */}
            {showLegend && <SkeletonLegend />}

            {/* Split UI Layout */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-between p-4 pointer-events-none animate-fade-in overflow-hidden">
                    
                    {/* LEFT PANEL: Navigation */}
                    <div className="w-72 h-full bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
                        <div className="p-8 border-b border-white/5">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Studio<span className="text-blue-500">OS</span></h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Workspace Navigation</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full px-8 py-4 text-left flex items-center gap-4 transition-all relative group ${
                                        activeTab === tab.id 
                                        ? 'text-white bg-white/5' 
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                    }`}
                                >
                                    <span className={`text-xl transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'scale-110' : ''}`}>
                                        {tab.icon}
                                    </span>
                                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_15px_#3b82f6] rounded-r-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Global Controls at Bottom of Nav */}
                        <div className="p-6 border-t border-white/5 bg-black/20">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                Exit Studio
                            </button>
                        </div>
                    </div>

                    {/* CENTER: CLEAR SPACE FOR CHARACTER VIEW */}
                    <div className="flex-1 flex items-center justify-center pointer-events-none" />

                    {/* RIGHT PANEL: Content & Settings */}
                    <div className="w-[450px] h-full bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
                        <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                                    {TABS.find(t => t.id === activeTab)?.label}
                                </h3>
                                <div className="h-1.5 w-16 bg-blue-500 mt-2 rounded-full shadow-[0_0_10px_#3b82f6]" />
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-red-500/20 rounded-xl transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="animate-fade-in-right">
                                {activeTab === 'actions' && (
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
                                )}

                                {activeTab === 'impersonate' && (
                                    <ImpersonateControls setConfig={setConfig} />
                                )}

                                {activeTab === 'settings' && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-6">
                                            <Slider 
                                                label="Global Volume" 
                                                value={config.globalVolume} 
                                                min={0} max={1} step={0.01} 
                                                onChange={(v) => handleConfigChange('globalVolume', v)} 
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'environment' && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-6">
                                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Auto Day Cycle</label>
                                                <button 
                                                    onClick={() => handleConfigChange('isAutoTime', !config.isAutoTime)}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${config.isAutoTime ? 'bg-blue-600' : 'bg-slate-800'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.isAutoTime ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            <Slider 
                                                label="Time of Day (Hr)" 
                                                value={config.timeOfDay} 
                                                min={0} max={24} step={0.1} 
                                                onChange={(v) => {
                                                    handleConfigChange('timeOfDay', v);
                                                    handleConfigChange('isAutoTime', false);
                                                }} 
                                            />
                                            <Slider 
                                                label="Cycle Speed" 
                                                value={config.timeSpeed} 
                                                min={0} max={10} step={0.1} 
                                                onChange={(v) => handleConfigChange('timeSpeed', v)} 
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'body' && (
                                    <BodyControls config={config} setConfig={setConfig} />
                                )}

                                {activeTab === 'outfit' && (
                                    <OutfitControls config={config} setConfig={setConfig} />
                                )}

                                {activeTab === 'face' && (
                                    <FaceControls config={config} setConfig={setConfig} />
                                )}

                                {activeTab === 'rigging' && (
                                    <RiggingControls config={config} setConfig={setConfig} />
                                )}

                                {activeTab === 'eq_rigging' && (
                                    <EquipmentRiggingControls config={config} setConfig={setConfig} />
                                )}
                            </div>
                        </div>
                        
                        {/* Footer Context Info */}
                        <div className="p-6 bg-black/40 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Session ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
                                <span className="text-blue-500/50">Core.V1.Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
