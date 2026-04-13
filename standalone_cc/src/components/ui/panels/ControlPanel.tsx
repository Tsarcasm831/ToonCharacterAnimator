
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
import RandomizeControls from '../controls/RandomizeControls';
import LoadoutControls from '../controls/LoadoutControls';
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
    onSpawnAnimals?: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    movementMode?: 'idle' | 'walk' | 'run';
    handleMovementToggle?: () => void;
    zoomLevel?: number;
    onBackToMainMenu?: () => void;
    onPanelStateChange?: (state: { isOpen: boolean; activeTab: TabKey; isMobileLayout: boolean }) => void;
    onResetToBaseCharacter?: () => void;
}

type TabKey = 'settings' | 'environment' | 'actions' | 'impersonate' | 'body' | 'outfit' | 'face' | 'rigging' | 'eq_rigging' | 'randomize' | 'loadouts';

export const ControlPanel: React.FC<ControlPanelProps> = ({
    config,
    manualInput,
    isDeadUI,
    setConfig,
    setManualInput,
    handleDeathToggle,
    triggerAction,
    onExport,
    onSpawnAnimals = () => {},
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onPanelStateChange,
    onBackToMainMenu,
    onResetToBaseCharacter
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDevMode, setIsDevMode] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('randomize');
    const [isMobileLayout, setIsMobileLayout] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(max-width: 1024px)').matches : false
    );
    
    const showLegend = activeTab === 'rigging' && isOpen;

    const handleConfigChange = (key: keyof PlayerConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 1024px)');
        const handleChange = () => setIsMobileLayout(mediaQuery.matches);
        handleChange();
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    React.useEffect(() => {
        onPanelStateChange?.({ isOpen, activeTab, isMobileLayout });
    }, [activeTab, isMobileLayout, isOpen, onPanelStateChange]);

    const TABS: { id: TabKey; label: string; icon: string }[] = [
        { id: 'impersonate', label: 'Impersonate', icon: '' },
        { id: 'actions', label: 'Actions & Input', icon: '' },
        { id: 'randomize', label: 'Randomize', icon: '' },
        { id: 'loadouts', label: 'Loadouts', icon: '' },
        { id: 'settings', label: 'Game Settings', icon: '' },
        { id: 'environment', label: 'Environment', icon: '' },
        { id: 'body', label: 'Body Details', icon: '' },
        { id: 'outfit', label: 'Outfit & Gear', icon: '' },
        { id: 'face', label: 'Face & Features', icon: '' },
        { id: 'rigging', label: 'Bone Rigging', icon: '' },
        { id: 'eq_rigging', label: 'Gear Rigging', icon: '' },
    ];
    const DEV_ONLY_TABS: TabKey[] = ['impersonate', 'actions', 'settings', 'environment', 'rigging', 'eq_rigging'];
    const visibleTabs = isDevMode ? TABS : TABS.filter(tab => !DEV_ONLY_TABS.includes(tab.id));

    React.useEffect(() => {
        if (!isDevMode && DEV_ONLY_TABS.includes(activeTab)) {
            setActiveTab('randomize');
        }
    }, [activeTab, isDevMode]);

    return (
        <>
            {/* Trigger Button */}
            {!isOpen && onBackToMainMenu && (
                <button
                    type="button"
                    onClick={onBackToMainMenu}
                    className="absolute bottom-20 right-4 z-[65] rounded-full border border-white/10 bg-black/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 shadow-lg transition-colors hover:bg-black/90"
                    aria-label="Back to main menu"
                >
                    Back to Main Menu
                </button>
            )}

            {!isOpen && (
                <button type="button" 
                    onClick={() => setIsOpen(true)}
                    className="absolute bottom-4 right-4 z-[60] p-4 bg-slate-900/90 backdrop-blur-md shadow-2xl rounded-full border border-white/20 text-white hover:bg-blue-600 hover:border-blue-400 transition-all hover:scale-105 active:scale-95 group"
                    title="Open Studio OS"
                >
                    <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                </button>
            )}

            {/* Skeleton Overlay */}
            {showLegend && <SkeletonLegend />}

            {/* Split UI Layout */}
            {isOpen && (
                <div className={`fixed z-[100] pointer-events-none animate-fade-in overflow-hidden ${isMobileLayout ? 'inset-0 flex items-start p-2' : 'inset-x-0 top-4 bottom-4 flex justify-between'}`}>
                    
                    {/* LEFT PANEL: Navigation */}
                    {!isMobileLayout && (
                    <div className="w-72 h-full bg-slate-950/90 backdrop-blur-xl border border-white/10 border-l-0 rounded-l-none rounded-r-[2rem] shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
                        <div className="p-8 border-b border-white/5">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Studio<span className="text-blue-500">OS</span></h2>
                            <div className="mt-1 flex items-center gap-2">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Workspace Navigation</p>
                                <button
                                    type="button"
                                    onClick={() => setIsDevMode(prev => !prev)}
                                    className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-colors ${
                                        isDevMode
                                            ? 'border-red-400/80 bg-red-500/70 text-white hover:bg-red-500'
                                            : 'border-red-500/50 bg-red-600/20 text-red-300 hover:bg-red-600/35'
                                    }`}
                                    aria-pressed={isDevMode}
                                    title={isDevMode ? 'Disable Dev Mode' : 'Enable Dev Mode'}
                                >
                                    {isDevMode ? 'Dev On' : 'Dev Off'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
                            {visibleTabs.map(tab => (
                                <button type="button"
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
                        <div className="p-6 border-t border-white/5 bg-black/20 space-y-3">
                            {/* Undo/Redo Controls */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onUndo}
                                    disabled={!canUndo}
                                    className={`flex-1 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                                        canUndo
                                            ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500 hover:text-white'
                                            : 'bg-slate-800/30 border border-slate-700/30 text-slate-600 cursor-not-allowed'
                                    }`}
                                    title="Undo (Ctrl+Z)"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Undo
                                </button>
                                <button
                                    type="button"
                                    onClick={onRedo}
                                    disabled={!canRedo}
                                    className={`flex-1 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                                        canRedo
                                            ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500 hover:text-white'
                                            : 'bg-slate-800/30 border border-slate-700/30 text-slate-600 cursor-not-allowed'
                                    }`}
                                    title="Redo (Ctrl+Y)"
                                >
                                    Redo
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                                    </svg>
                                </button>
                            </div>
                            <button type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                Exit Studio
                            </button>
                        </div>
                    </div>
                    )}

                    {/* CENTER: CLEAR SPACE FOR CHARACTER VIEW */}
                    {!isMobileLayout && <div className="flex-1 flex items-center justify-center pointer-events-none" />}

                    {/* RIGHT PANEL: Content & Settings */}
                    <div className={`${isMobileLayout ? 'w-full h-[calc(100dvh-1rem)] rounded-2xl' : 'w-[450px] h-full border-r-0 rounded-l-[2rem] rounded-r-none'} bg-slate-950/90 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden pointer-events-auto`}>
                        <div className={`${isMobileLayout ? 'p-4 pb-3' : 'p-8 pb-4'} border-b border-white/5 flex justify-between items-start`}>
                            <div>
                                <h3 className={`${isMobileLayout ? 'text-xl' : 'text-2xl'} font-black text-white uppercase tracking-tight`}>
                                    {TABS.find(t => t.id === activeTab)?.label}
                                </h3>
                                <div className="h-1.5 w-16 bg-blue-500 mt-2 rounded-full shadow-[0_0_10px_#3b82f6]" />
                            </div>
                            <button type="button" 
                                onClick={() => setIsOpen(false)}
                                aria-label="Close Studio OS panel"
                                className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-red-500/20 rounded-xl transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {isMobileLayout && (
                            <div className="px-4 pt-3 overflow-x-auto custom-scrollbar border-b border-white/5">
                                <div className="flex gap-2 min-w-max pb-3">
                                    {visibleTabs.map(tab => (
                                        <button
                                            type="button"
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                activeTab === tab.id
                                                    ? 'bg-blue-600/30 border-blue-400/60 text-white'
                                                    : 'bg-white/5 border-white/10 text-slate-400'
                                            }`}
                                        >
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={`${isMobileLayout ? 'p-4' : 'p-8'} flex-1 overflow-y-auto custom-scrollbar`}>
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
                                    <ImpersonateControls setConfig={setConfig} onResetToBase={onResetToBaseCharacter} />
                                )}

                                {activeTab === 'randomize' && (
                                    <RandomizeControls config={config} setConfig={setConfig} />
                                )}

                                {activeTab === 'loadouts' && (
                                    <LoadoutControls config={config} setConfig={setConfig} />
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
                                                <button type="button" 
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
                        <div className={`${isMobileLayout ? 'p-4' : 'p-6'} bg-black/40 border-t border-white/5`}>
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
