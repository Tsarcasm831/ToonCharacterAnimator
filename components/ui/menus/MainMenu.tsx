import React, { useState, useEffect, useRef } from 'react';
import { MenuBackground } from './MenuBackground';
import { Units } from '../pages/Units';
import { Map } from '../pages/Map';
import { X, Send } from 'lucide-react';
import type { ActiveScene } from '../../../hooks/useGameState';

interface MainMenuProps {
    activeScene: ActiveScene;
    onSceneChange: (scene: ActiveScene) => void;
    onStart: (scene: ActiveScene) => void;
    onShowEnemies: () => void;
    onOpenCharacterCreator: () => void;
    isMobile?: boolean;
    showVideoBackground?: boolean;
}

const sceneOptions: Array<{ id: ActiveScene; label: string; activeClassName?: string }> = [
    { id: 'dev', label: 'Dev Scene', activeClassName: 'bg-green-500 border-green-400' },
    { id: 'starter', label: 'Starter Scene' },
    { id: 'combat', label: 'Combat Arena' },
    { id: 'land', label: 'Land Scene' },
    { id: 'town', label: 'Town Scene' },
    { id: 'town2', label: 'Town 2 Scene' },
    { id: 'tdgame', label: 'Top Down Game' },
    { id: 'singleBiome', label: 'Single Biome' },
    { id: 'roguelike', label: 'Roguelike Scene' },
    { id: 'darkest', label: 'Darkest Clone' },
    { id: 'gameLoop', label: 'Game Loop' },
    { id: 'loop', label: 'Settlement Loop', activeClassName: 'bg-amber-500 border-amber-400' }
];

const sceneOptionsLeft = sceneOptions.slice(0, Math.ceil(sceneOptions.length / 2));
const sceneOptionsRight = sceneOptions.slice(Math.ceil(sceneOptions.length / 2));

export const MainMenu: React.FC<MainMenuProps> = ({ activeScene, onSceneChange, onStart, onShowEnemies, onOpenCharacterCreator, isMobile = false, showVideoBackground = false }) => {
    const [showOptions, setShowOptions] = React.useState(false);
    const [showUnits, setShowUnits] = React.useState(false);
    const [showMap, setShowMap] = React.useState(false);
    const [showChat, setShowChat] = React.useState(false);
    const [chatInput, setChatInput] = React.useState('');
    const [chatMessages, setChatMessages] = React.useState<Array<{ type: 'system' | 'user' | 'command'; content: string }>>([
        { type: 'system', content: 'Press Enter to open chat. Type /tut1co to complete tutorial 1.' }
    ]);
    const chatInputRef = useRef<HTMLInputElement>(null);
    const hideControls = isMobile;

    React.useEffect(() => {
        if (!showUnits && !showMap) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowUnits(false);
                setShowMap(false);
                setShowChat(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showUnits, showMap]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            console.log('[MainMenu] Key pressed:', event.key, 'target:', event.target);
            if ((event.target as HTMLElement).closest('input, textarea, select, .no-capture')) return;
            
            if (event.key === 'Enter') {
                console.log('[MainMenu] Enter key detected, toggling chat');
                event.preventDefault();
                setShowChat(prev => {
                    const newState = !prev;
                    console.log('[MainMenu] Chat state:', prev, '->', newState);
                    if (newState) {
                        setTimeout(() => chatInputRef.current?.focus(), 100);
                    }
                    return newState;
                });
            }
        };

        console.log('[MainMenu] Attaching keydown listener');
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            console.log('[MainMenu] Removing keydown listener');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = chatInput.trim();
        if (!trimmedInput) return;

        setChatMessages(prev => [...prev, { type: 'user', content: trimmedInput }]);

        if (trimmedInput === '/tut1co') {
            localStorage.setItem('tutorial1Completed', 'true');
            setChatMessages(prev => [...prev, { type: 'command', content: 'Tutorial 1 completed! You will receive sticks and stones when you enter the world.' }]);
        } else if (trimmedInput.startsWith('/')) {
            setChatMessages(prev => [...prev, { type: 'system', content: `Unknown command: ${trimmedInput}` }]);
        }

        setChatInput('');
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center">
            <MenuBackground showVideo={showVideoBackground} />
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                {!hideControls && (
                    <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in">
                        <button
                            type="button"
                            onClick={() => setShowUnits(true)}
                            className="px-8 py-2 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-full border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                        >
                            Open Units Roster
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowMap(true)}
                            className="px-8 py-2 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-full border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                        >
                            Open World Map
                        </button>

                        <button
                            type="button"
                            onClick={onOpenCharacterCreator}
                            className="px-8 py-2 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-full border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                        >
                            Open Character Creator
                        </button>
                    </div>
                )}
                <div className="text-center space-y-8 p-12 rounded-3xl bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-sm animate-fade-in">
                    {isMobile && (
                        <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl px-6 py-4 backdrop-blur-md animate-pulse">
                            <p className="text-[10px] text-blue-300 uppercase tracking-[0.3em] font-bold">Mobile Notice</p>
                            <p className="mt-1 text-sm font-black text-white uppercase tracking-wider">Better on Desktop</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                            SAIRON<span className="text-blue-500">RPG</span>
                        </h1>
                        <p className="text-slate-400 text-sm md:text-base font-bold uppercase tracking-[0.4em] drop-shadow-md">
                            Interactive Character Studio and Game
                        </p>
                    </div>

                    {!hideControls && (
                        <div className="flex flex-col gap-6 items-center">
                            <button 
                                type="button"
                                onClick={() => onStart(activeScene)}
                                className="px-16 py-5 bg-white text-black font-black text-xl uppercase tracking-widest rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] active:scale-95 transform hover:-translate-y-1"
                            >
                                Enter World
                            </button>

                            <button
                                type="button"
                                aria-expanded={showOptions}
                                className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer"
                                onClick={() => setShowOptions(!showOptions)}
                            >
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${showOptions ? 'bg-purple-500 border-purple-400' : 'border-white/20 group-hover:border-white/40'}`}>
                                    {showOptions && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-slate-300 text-xs font-black uppercase tracking-widest select-none">Scene Options</span>
                            </button>

                            {showOptions && (
                                <div className="flex flex-col gap-4 items-stretch animate-fade-in w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                        <div className="flex flex-col gap-4">
                                            {sceneOptionsLeft.map((sceneOption) => {
                                                const isSelected = activeScene === sceneOption.id;
                                                const selectedClasses = sceneOption.activeClassName ?? 'bg-blue-500 border-blue-400';

                                                return (
                                                    <button
                                                        key={sceneOption.id}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        className="w-full flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                                        onClick={() => onSceneChange(sceneOption.id)}
                                                    >
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? selectedClasses : 'border-white/20 group-hover:border-white/30'}`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">{sceneOption.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            {sceneOptionsRight.map((sceneOption) => {
                                                const isSelected = activeScene === sceneOption.id;
                                                const selectedClasses = sceneOption.activeClassName ?? 'bg-blue-500 border-blue-400';

                                                return (
                                                    <button
                                                        key={sceneOption.id}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        className="w-full flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                                        onClick={() => onSceneChange(sceneOption.id)}
                                                    >
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? selectedClasses : 'border-white/20 group-hover:border-white/30'}`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">{sceneOption.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onShowEnemies}
                                        className="px-4 py-2 rounded-xl bg-red-600/15 border border-red-500/30 text-red-300 hover:bg-red-600/25 transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Show Enemies
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="absolute bottom-8 text-center text-white/20 text-[10px] font-mono">
                    v1.0.0 • React • Three.js
                </div>
            </div>
            {showUnits && !hideControls && (
                <div
                    className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowUnits(false)}
                >
                    <div
                        className="relative w-[min(1200px,96vw)] h-[min(92dvh,92vh)] sm:h-[90vh] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="sticky top-0 z-20 flex justify-end p-3 bg-gradient-to-b from-black/80 to-transparent">
                            <button
                                type="button"
                                onClick={() => setShowUnits(false)}
                                className="h-10 w-10 flex items-center justify-center bg-black/60 text-white border border-white/10 rounded-full hover:bg-black/80"
                                aria-label="Close units roster"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Units />
                        </div>
                    </div>
                </div>
            )}
            {showMap && !hideControls && (
                <div
                    className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowMap(false)}
                >
                    <div
                        className="relative w-[min(1200px,96vw)] h-[min(88dvh,88vh)] sm:h-[82vh] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="sticky top-0 z-20 flex justify-end p-3 bg-gradient-to-b from-black/80 to-transparent">
                            <button
                                type="button"
                                onClick={() => setShowMap(false)}
                                className="h-10 w-10 flex items-center justify-center bg-black/60 text-white border border-white/10 rounded-full hover:bg-black/80"
                                aria-label="Close world map"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Map />
                        </div>
                    </div>
                </div>
            )}
            {showChat && !hideControls && (
                <div className="absolute bottom-8 left-8 z-[150] w-[400px] max-w-[calc(100vw-4rem)]">
                    <div className="bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
                            <span className="text-white text-xs font-black uppercase tracking-widest">Chat</span>
                            <button
                                type="button"
                                onClick={() => setShowChat(false)}
                                className="text-white/60 hover:text-white transition-colors"
                                aria-label="Close chat"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="h-48 overflow-y-auto p-3 space-y-2">
                            {chatMessages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`text-xs ${
                                        msg.type === 'system' ? 'text-slate-400 italic' :
                                        msg.type === 'command' ? 'text-green-400 font-bold' :
                                        'text-white'
                                    }`}
                                >
                                    {msg.type === 'user' && <span className="text-blue-400 font-bold mr-2">You:</span>}
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    ref={chatInputRef}
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type a command..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white/30"
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 transition-colors"
                                    aria-label="Send message"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
