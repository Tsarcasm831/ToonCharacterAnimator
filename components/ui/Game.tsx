import React from 'react';
import Scene from '../Scene';
import LandScene from '../LandScene';
import CombatScene from '../CombatScene';
import { useGlobalState } from '../../contexts/GlobalContext';
import { CombatLogEntry } from './CombatLog';
import { MainMenu } from './MainMenu';
import LoadingScreen from './LoadingScreen';
import { MobileControls } from './MobileControls';
import { DialogueOverlay } from './DialogueOverlay';
import { GameHUD } from './GameHUD';
import { BuilderUI } from './BuilderUI';
import { ControlPanel } from './ControlPanel';
import * as THREE from 'three';

export const Game: React.FC = () => {
    const {
        gameState: gameStateContext,
        playerState,
        inventoryState,
        uiState,
        combatState,
        environmentState,
        gameInstance
    } = useGlobalState();

    const { activeScene, gameState, setGameState, setActiveScene } = gameStateContext;
    const { config, setConfig, manualInput, setManualInput } = playerState;
    const { inventory, bench, setInventory } = inventoryState;
    const { 
        dialogue, 
        selectedSlot, setSelectedSlot,
        interactionText, interactionProgress, setInteractionText, setInteractionProgress,
        isInventoryOpen, isTradeOpen, isShopkeeperChatOpen, isForgeOpen, isKeybindsOpen, isQuestLogOpen, isSpawnModalOpen, isEnemiesModalOpen, isCharacterStatsOpen, isLandMapOpen, isTravelOpen,
        setIsTravelOpen, setIsLandMapOpen,
        setDialogue,
        setIsDeadUI, isDeadUI,
        setIsSpawnModalOpen, setIsEnemiesModalOpen,
        toggleInventory, toggleKeybinds, toggleQuestLog,
        setStatsForModal, setStatsUnitName, setIsCharacterStatsOpen,
        setSelectedUnitStats, setSelectedUnit,
        setIsTradeOpen, setIsShopkeeperChatOpen, setIsForgeOpen
    } = uiState;
    const { isCombatActive, setIsCombatActive, combatLog, addCombatLog } = combatState;
    const { 
        currentBiome, playerRotation, setPlayerRotation, isBuilderMode, activeStructure, setPlayerPosForMap, 
        setIsEnvironmentBuilt, setIsVisualLoadingDone, isEnvironmentBuilt, isVisualLoadingDone,
        setIsBuilderMode, setCurrentBiome, setActiveStructure, showGrid, setShowGrid 
    } = environmentState;

    const isHUDDisabled = isInventoryOpen || isTradeOpen || isShopkeeperChatOpen || isForgeOpen || !!dialogue || isKeybindsOpen || isQuestLogOpen || isSpawnModalOpen || isEnemiesModalOpen || isCharacterStatsOpen || isLandMapOpen || gameState !== 'PLAYING' || isTravelOpen;

    // Handlers
    const handleEnterWorld = (startInCombat: boolean = false, startInLand: boolean = false) => {
        setIsEnvironmentBuilt(false);
        setIsVisualLoadingDone(false);
        setIsCombatActive(false);
        setGameState('LOADING');
        if (startInLand) {
          setActiveScene('land');
        } else if (startInCombat) {
          setActiveScene('combat');
        }
        // Spawn a spider for testing
        setTimeout(() => {
          if (gameInstance.current) {
            const player = gameInstance.current.player;
            if (!player) return;
            
            const playerPos = player.position;
            if (!playerPos) return;
            
            const spawnPos = playerPos.clone().add(new THREE.Vector3(5, 0, 5));
            
            if (!gameInstance.current.entityManager) return;
            
            gameInstance.current.entityManager.spawnAnimalGroup('spider', 1, gameInstance.current.sceneManager.environment, spawnPos);
          }
        }, 2000);
    };

    const handleEnvironmentReady = () => {
        setIsEnvironmentBuilt(true);
    };

    const handleVisualLoadingFinished = () => {
        setIsVisualLoadingDone(true);
    };

    const handleStartPlaying = () => {
        setGameState('PLAYING');
    };

    const handleInteractionUpdate = (text: string | null, prog: number | null) => { 
        setInteractionText(text); 
        setInteractionProgress(prog); 
    };

    // Sync hotbar selection with character selected item
    React.useEffect(() => {
        const selectedItem = inventory[selectedSlot];
        if (selectedItem) {
            // Check if it's a weapon/tool
            const isWeapon = [
                'Sword', 'Axe', 'Pickaxe', 'Knife', 'Halberd', 
                'Staff', 'Fishing Pole', 'Bow'
            ].includes(selectedItem.name);
            
            if (isWeapon) {
                setConfig(prev => ({ ...prev, selectedItem: selectedItem.name }));
            } else {
                // If selecting something else in hotbar (like a potion), 
                // we might want to keep the current weapon or clear it.
                // For now, let's only update if it's a weapon to match user intent.
            }
        } else {
            // Empty slot selected
            setConfig(prev => ({ ...prev, selectedItem: null }));
        }
    }, [selectedSlot, inventory]);

    const triggerAction = (key: keyof typeof manualInput) => {
        setManualInput(prev => ({ ...prev, [key]: true }));
        setTimeout(() => setManualInput(prev => ({ ...prev, [key]: false })), 100);
    };

    const handleDeathToggle = () => { 
        triggerAction('isDead'); 
        setIsDeadUI(prev => !prev); 
    };

    const handleMapToggle = (pos: THREE.Vector3) => {
        setPlayerPosForMap(pos);
        if (activeScene === 'land') {
            setIsLandMapOpen(true);
        } else {
            setIsTravelOpen(true);
        }
    };

    const onCloseDialogue = () => {
        setDialogue(null);
        if (gameInstance.current) gameInstance.current.player.isTalking = false;
    };

    const onShowEnemies = () => {
        setIsEnemiesModalOpen(true);
    };

    const onSelectStructure = (type: any) => {
        environmentState.setActiveStructure(type);
        if (gameInstance.current) gameInstance.current.setBuildingType(type);
    };

    const onGameReady = (game: any) => {
        gameInstance.current = game;
        // Bind game callbacks here if needed, or rely on game observing state?
        // The previous implementation bound callbacks to the game instance.
        // We should replicate that or ensure the game instance reads from context/props updates.
        // Game.ts calls callbacks like onInventoryUpdate. 
        // We need to re-bind them here because the Game instance is created inside Scene components and passed up.
        // Wait, Scene components create the game? No, GameScreen passes onGameReady to Scene.
        // Scene initializes Game.
        
        game.inputManager.onToggleInventory = uiState.toggleInventory;
        game.inputManager.onToggleKeybinds = uiState.toggleKeybinds;
        game.inputManager.onToggleQuestLog = uiState.toggleQuestLog;
        game.onBuilderToggle = (active: boolean) => environmentState.setIsBuilderMode(active);
        game.onBiomeUpdate = (b: any) => environmentState.setCurrentBiome(b);
        game.onDialogueTrigger = (content: string) => setDialogue(content);
        game.onTradeTrigger = () => uiState.setIsTradeOpen(true);
        game.onShopkeeperTrigger = () => uiState.setIsShopkeeperChatOpen(true);
        game.onForgeTrigger = () => uiState.setIsForgeOpen(true);
        game.onRotationUpdate = (r: number) => setPlayerRotation(r);
        game.onShowCharacterStats = (stats: any, name: string) => {
            if (stats) uiState.setStatsForModal(stats);
            else uiState.setStatsForModal(config.stats);
            if (name) uiState.setStatsUnitName(name);
            uiState.setIsCharacterStatsOpen(true);
        };
        game.onUnitSelect = (stats: any, unit: any) => {
            if (stats) uiState.setSelectedUnitStats(stats);
            else uiState.setSelectedUnitStats(config.stats);
            uiState.setSelectedUnit(unit);
        };
        game.onAttackHit = (type: string, count: number) => {
            addCombatLog(`${type.charAt(0).toUpperCase() + type.slice(1)} struck for damage!`, 'damage');
        };
    };

    const handleExport = () => {
         import('../../game/core/ModelExporter').then(({ ModelExporter }) => {
             if (gameInstance.current && gameInstance.current.player) {
                 ModelExporter.exportAndDownloadZip(gameInstance.current.player.mesh as any);
             }
         });
    };

    const handleSpawnAnimals = () => {
        setIsSpawnModalOpen(true);
    };

    const isSystemReady = isEnvironmentBuilt && isVisualLoadingDone;

    return (
        <div className="w-full h-full flex flex-col items-center justify-start">
            <div className="w-full flex-1 bg-black border-x border-t border-white/10 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0">
                    {gameState === 'MENU' ? (
                        <MainMenu onStart={handleEnterWorld} onShowEnemies={onShowEnemies} />
                    ) : (
                        <>
                            {activeScene === 'combat' ? (
                                <CombatScene 
                                    config={config}
                                    manualInput={manualInput}
                                    bench={bench}
                                    onGameReady={onGameReady}
                                    onEnvironmentReady={() => {
                                        handleEnvironmentReady();
                                        handleVisualLoadingFinished();
                                    }}
                                    onInteractionUpdate={handleInteractionUpdate}
                                    onToggleQuestLog={uiState.toggleQuestLog}
                                    onRotationUpdate={setPlayerRotation}
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
                                    onInteractionUpdate={handleInteractionUpdate}
                                    onGameReady={onGameReady}
                                    onEnvironmentReady={() => {
                                        handleEnvironmentReady();
                                        handleVisualLoadingFinished();
                                    }}
                                    onToggleWorldMap={handleMapToggle}
                                    onToggleQuestLog={uiState.toggleQuestLog}
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
                                    onInteractionUpdate={handleInteractionUpdate}
                                    onGameReady={onGameReady}
                                    onEnvironmentReady={() => {
                                        handleEnvironmentReady();
                                        handleVisualLoadingFinished();
                                    }}
                                    onToggleWorldMap={handleMapToggle}
                                    onToggleQuestLog={uiState.toggleQuestLog}
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
                                        onOpenTravel={() => handleMapToggle(environmentState.playerPosForMap || new THREE.Vector3())}
                                        onToggleBestiary={onShowEnemies}
                                    />
                                    
                                    {isBuilderMode && (
                                        <BuilderUI 
                                            activeType={activeStructure} 
                                            onSelectType={onSelectStructure} 
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
                                        onExport={handleExport}
                                        onSpawnAnimals={handleSpawnAnimals}
                                    />
                                </>
                            )}
                            
                            <LoadingScreen 
                                isVisible={gameState === 'LOADING'}
                                isSystemReady={isSystemReady}
                                onFinished={handleStartPlaying}
                            />
                            
                            <DialogueOverlay dialogue={dialogue} onClose={onCloseDialogue} />
                            <MobileControls game={gameInstance.current} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
