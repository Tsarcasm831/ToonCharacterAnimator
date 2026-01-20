import React, { RefObject } from 'react';
import Scene from '../Scene';
import LandScene from '../LandScene';
import CombatScene from '../CombatScene';
import { Game } from '../../game/core/Game';
import { PlayerConfig, PlayerInput, InventoryItem, EntityStats } from '../../types';
import { StructureType } from '../../game/builder/BuildingParts';
import { CombatLogEntry } from './CombatLog';
import { MainMenu } from './MainMenu';
import LoadingScreen from './LoadingScreen';
import { MobileControls } from './MobileControls';
import { DialogueOverlay } from './DialogueOverlay';
import { GameHUD } from './GameHUD';
import { BuilderUI } from './BuilderUI';
import { ControlPanel } from './ControlPanel';
import * as THREE from 'three';

type GameState = 'MENU' | 'LOADING' | 'READY' | 'PLAYING';

interface GameScreenProps {
    activeScene: 'dev' | 'world' | 'combat';
    gameState: GameState;
    setGameState: (state: GameState) => void;
    config: PlayerConfig;
    manualInput: Partial<PlayerInput>;
    bench: (InventoryItem | null)[];
    inventory: (InventoryItem | null)[];
    gameInstance: RefObject<Game | null>;
    game: Game | null;
    isCombatActive: boolean;
    showGrid: boolean;
    combatLog: CombatLogEntry[];
    dialogue: string | null;
    
    // HUD Props
    currentBiome: { name: string, color: string };
    playerRotation: number;
    selectedSlot: number;
    interactionText: string | null;
    interactionProgress: number | null;
    isHUDDisabled: boolean;
    isBuilderMode: boolean;
    activeStructure: StructureType;
    isDeadUI: boolean;
    
    // Callbacks
    onStart: (startInCombat: boolean, startInLand: boolean) => void;
    onShowEnemies: () => void;
    onGameReady: (game: Game) => void;
    onEnvironmentReady: () => void;
    onInteractionUpdate: (text: string | null, progress: number | null) => void;
    onToggleQuestLog: () => void;
    setPlayerRotation: (rot: number) => void;
    addCombatLog: (text: string, type: 'damage' | 'info') => void;
    setIsCombatActive: (active: boolean) => void;
    setShowGrid: (show: boolean) => void;
    setInventory: (items: (InventoryItem | null)[]) => void;
    setSelectedSlot: (slot: number) => void;
    setPlayerPosForMap: (pos: THREE.Vector3) => void;
    setIsTravelOpen: (open: boolean) => void;
    setIsLandMapOpen: (open: boolean) => void;
    onCloseDialogue: () => void;
    onSelectStructure: (type: StructureType) => void;
    onExport: () => void;
    onSpawnAnimals: () => void;
    
    // Config Setters
    setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
    setManualInput: React.Dispatch<React.SetStateAction<Partial<PlayerInput>>>;
    handleDeathToggle: () => void;
    triggerAction: (key: keyof PlayerInput) => void;
    
    // Loading props
    isSystemReady: boolean;
    onLoadingFinished: () => void;
    onVisualLoadingFinished: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
    activeScene,
    gameState,
    setGameState,
    config,
    manualInput,
    bench,
    inventory,
    gameInstance,
    game,
    isCombatActive,
    showGrid,
    combatLog,
    dialogue,
    currentBiome,
    playerRotation,
    selectedSlot,
    interactionText,
    interactionProgress,
    isHUDDisabled,
    isBuilderMode,
    activeStructure,
    isDeadUI,
    onStart,
    onShowEnemies,
    onGameReady,
    onEnvironmentReady,
    onInteractionUpdate,
    onToggleQuestLog,
    setPlayerRotation: setPlayerRotationCallback,
    addCombatLog,
    setIsCombatActive,
    setShowGrid,
    setInventory,
    setSelectedSlot,
    setPlayerPosForMap,
    setIsTravelOpen,
    setIsLandMapOpen,
    onCloseDialogue,
    onSelectStructure,
    onExport,
    onSpawnAnimals,
    setConfig,
    setManualInput,
    handleDeathToggle,
    triggerAction,
    isSystemReady,
    onLoadingFinished,
    onVisualLoadingFinished
}) => {
    const handleMapToggle = (pos: THREE.Vector3) => {
        setPlayerPosForMap(pos);
        if (activeScene === 'land') {
            setIsLandMapOpen(true);
        } else {
            setIsTravelOpen(true);
        }
    };

    const handleTravelMenuOpen = () => {
        setIsLandMapOpen(false);
        setIsTravelOpen(true);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-start pt-24 pb-24">
            <div className="w-full flex-1 bg-black border-x border-t border-white/10 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0">
                    {gameState === 'MENU' ? (
                        <MainMenu onStart={onStart} onShowEnemies={onShowEnemies} />
                    ) : (
                        <>
                            {activeScene === 'combat' ? (
                                <CombatScene 
                                    config={config}
                                    manualInput={manualInput}
                                    bench={bench}
                                    onGameReady={onGameReady}
                                    onEnvironmentReady={() => {
                                        onEnvironmentReady();
                                        onVisualLoadingFinished();
                                    }}
                                    onInteractionUpdate={onInteractionUpdate}
                                    onToggleQuestLog={onToggleQuestLog}
                                    onRotationUpdate={setPlayerRotationCallback}
                                    onAttackHit={(type, count) => {
                                        addCombatLog(`${type.charAt(0).toUpperCase() + type.slice(1)} struck for damage!`, 'damage');
                                    }}
                                    isCombatActive={isCombatActive}
                                    setIsCombatActive={setIsCombatActive}
                                    combatLog={combatLog}
                                    showGrid={showGrid}
                                    setShowGrid={setShowGrid}
                                />
                            ) : activeScene === 'land' ? (
                                <LandScene 
                                    config={config} 
                                    manualInput={manualInput}
                                    initialInventory={inventory}
                                    onInventoryUpdate={setInventory}
                                    onSlotSelect={setSelectedSlot}
                                    onInteractionUpdate={onInteractionUpdate}
                                    onGameReady={onGameReady}
                                    onEnvironmentReady={() => {
                                        onEnvironmentReady();
                                        onVisualLoadingFinished();
                                    }}
                                    onToggleWorldMap={handleMapToggle}
                                    onToggleQuestLog={onToggleQuestLog}
                                    showGrid={showGrid}
                                    isCombatActive={isCombatActive}
                                />
                            ) : (
                                <Scene 
                                    activeScene={activeScene}
                                    config={config} 
                                    manualInput={manualInput}
                                    initialInventory={inventory}
                                    onInventoryUpdate={setInventory}
                                    onSlotSelect={setSelectedSlot}
                                    onInteractionUpdate={onInteractionUpdate}
                                    onGameReady={onGameReady}
                                    onEnvironmentReady={() => {
                                        onEnvironmentReady();
                                        onVisualLoadingFinished();
                                    }}
                                    onToggleWorldMap={handleMapToggle}
                                    onToggleQuestLog={onToggleQuestLog}
                                    showGrid={showGrid}
                                    isCombatActive={isCombatActive}
                                />
                            )}
                            
                            {!isHUDDisabled && (
                                <>
                                    <GameHUD 
                                        activeScene={activeScene}
                                        currentBiome={currentBiome}
                                        playerRotation={playerRotation}
                                        inventory={inventory}
                                        bench={bench}
                                        selectedSlot={selectedSlot}
                                        onSelectSlot={setSelectedSlot}
                                        interactionText={interactionText}
                                        interactionProgress={interactionProgress}
                                        showGrid={showGrid}
                                        setShowGrid={setShowGrid}
                                        isCombatActive={isCombatActive}
                                        setIsCombatActive={setIsCombatActive}
                                        stats={config.stats}
                                        isFemale={config.bodyType === 'female'}
                                        combatLog={combatLog}
                                        onOpenTravel={handleTravelMenuOpen}
                                        onToggleBestiary={onShowEnemies}
                                    />
                                    
                                    {isBuilderMode && (
                                        <BuilderUI 
                                            activeStructure={activeStructure} 
                                            onSelectStructure={onSelectStructure} 
                                        />
                                    )}
                                    
                                    <ControlPanel 
                                        config={config}
                                        manualInput={manualInput}
                                        isDeadUI={isDeadUI}
                                        setConfig={setConfig}
                                        setManualInput={setManualInput}
                                        handleDeathToggle={handleDeathToggle}
                                        triggerAction={triggerAction}
                                        onExport={onExport}
                                        onSpawnAnimals={onSpawnAnimals}
                                    />
                                </>
                            )}
                            
                            <LoadingScreen 
                                isVisible={gameState === 'LOADING'}
                                isSystemReady={isSystemReady}
                                onFinished={onLoadingFinished}
                            />
                            
                            <DialogueOverlay dialogue={dialogue} onClose={onCloseDialogue} />
                            <MobileControls game={game} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
