import React from 'react';
import Scene from '../../Scene';
import CombatScene from '../../CombatScene';
import MPTestScene from '../../MPTestScene';
import SingleBiomeScene from '../../SingleBiomeScene';
import TownScene from '../../TownScene';
import { useGlobalState } from '../../../contexts/GlobalContext';
import { CombatLogEntry } from '../hud/CombatLog';
import { MainMenu } from '../menus/MainMenu';
import LoadingScreen from '../overlays/LoadingScreen';
import { MobileControls } from '../hud/MobileControls';
import { DialogueOverlay } from '../overlays/DialogueOverlay';
import { GameHUD } from '../hud/GameHUD';
import { BuilderUI } from '../panels/BuilderUI';
import { BuilderLog } from '../panels/BuilderLog';
import { ControlPanel } from '../panels/ControlPanel';
import * as THREE from 'three';
import { CITIES } from '../../../data/lands/cities';
import { getTownWallCenters } from '../../../game/environment/townWalls';
import { useIsMobileDevice } from '../../../hooks/useIsMobileDevice';

export const Game: React.FC = () => {
    const isMobileDevice = useIsMobileDevice();
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
        isInventoryOpen, isTradeOpen, isShopkeeperChatOpen, isForgeOpen, isKeybindsOpen, isQuestLogOpen, isSpawnModalOpen, isEnemiesModalOpen, isCharacterStatsOpen, isLandMapOpen, isTravelOpen, isAreaMapOpen,
        setIsTravelOpen, setIsLandMapOpen, setIsAreaMapOpen,
        setDialogue,
        setIsDeadUI, isDeadUI,
        setIsSpawnModalOpen, setIsEnemiesModalOpen,
        toggleInventory, toggleKeybinds, toggleQuestLog,
        setStatsForModal, setStatsUnitName, setIsCharacterStatsOpen,
        setSelectedUnitStats, setSelectedUnit,
        setIsTradeOpen, setIsShopkeeperChatOpen, setIsForgeOpen,
        notification, setNotification,
        setIsLandSelectionOpen
    } = uiState;
    const { isCombatActive, setIsCombatActive, combatLog, addCombatLog } = combatState;
    const {
        currentBiome, playerRotation, setPlayerRotation, isBuilderMode, activeStructure, setPlayerPosForMap, 
        setIsEnvironmentBuilt, setIsVisualLoadingDone, isEnvironmentBuilt, isVisualLoadingDone,
        setIsBuilderMode, setCurrentBiome, setActiveStructure, showGrid, setShowGrid, selectedLand 
    } = environmentState;

    // Effects
    React.useEffect(() => {
        if (notification) {
            const t = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(t);
        }
    }, [notification, setNotification]);

    // Gate scene mounting so the loading screen can paint before heavy initialization begins
    const [shouldMountScene, setShouldMountScene] = React.useState(false);
    const mountSceneTimeout = React.useRef<number | null>(null);

    const isHUDDisabled = isInventoryOpen || isTradeOpen || isShopkeeperChatOpen || isForgeOpen || !!dialogue || isKeybindsOpen || isQuestLogOpen || isSpawnModalOpen || isEnemiesModalOpen || isCharacterStatsOpen || isLandMapOpen || isAreaMapOpen || gameState !== 'PLAYING' || isTravelOpen;
    const selectedLandRef = React.useRef(selectedLand);
    const activeSceneRef = React.useRef(activeScene);

    React.useEffect(() => {
        selectedLandRef.current = selectedLand;
    }, [selectedLand]);

    React.useEffect(() => {
        activeSceneRef.current = activeScene;
    }, [activeScene]);

    // Handlers
    const handleEnterWorld = (startInCombat: boolean = false, startInLand: boolean = false, startInDev: boolean = false, startInTown: boolean = false) => {
        setIsEnvironmentBuilt(false);
        setIsVisualLoadingDone(false);
        setIsCombatActive(false);
        setGameState('LOADING');
        setShouldMountScene(false);
        if (mountSceneTimeout.current) window.clearTimeout(mountSceneTimeout.current);
        if (startInDev) {
          setActiveScene('dev');
        } else if (startInTown) {
          setActiveScene('town');
        } else if (startInLand) {
          setActiveScene('land');
        } else if (startInCombat) {
          setActiveScene('combat');
        } else {
          setActiveScene('dev');
        }
        // Defer mounting the scene to next tick to allow loading UI to paint
        mountSceneTimeout.current = window.setTimeout(() => {
          setShouldMountScene(true);
        }, 150);
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

    React.useEffect(() => {
        return () => {
            if (mountSceneTimeout.current) window.clearTimeout(mountSceneTimeout.current);
            // Cleanup game instance and 3D resources on unmount
            if (gameInstance.current) {
                // Dispose of Three.js resources if the game instance has a dispose method
                // Using type assertion to bypass TypeScript check since dispose may be added dynamically
                const game = gameInstance.current as any;
                if (game.dispose && typeof game.dispose === 'function') {
                    game.dispose();
                }
                gameInstance.current = null;
            }
        };
    }, []);

    const handleMapToggle = (pos: THREE.Vector3) => {
        setPlayerPosForMap(pos);
        if (activeScene === 'land') {
            setIsLandMapOpen(true);
        } else if (activeScene === 'singleBiome') {
            setIsAreaMapOpen(true);
        } else {
            setIsTravelOpen(true);
        }
    };

    const handleTravelOpen = () => {
        setIsTravelOpen(true);
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
        game.inputManager.onToggleBuilderLog = uiState.toggleBuilderLog;
        game.inputManager.onToggleGrid = () => setShowGrid(prev => !prev);
        game.inputManager.onTeleportToTown = () => {
            if (activeSceneRef.current !== 'singleBiome') return;
            const land = selectedLandRef.current;
            if (!land?.points?.length) return;
            const wallCenters = getTownWallCenters(land, CITIES);
            const target = wallCenters[0];
            if (!target) return;

            const spawnY = 5;
            const controls = game.renderManager.controls;
            const camera = game.renderManager.camera;
            const cameraOffset = camera.position.clone().sub(controls.target);
            const targetPos = new THREE.Vector3(target.x, spawnY, target.y);

            game.player.mesh.position.copy(targetPos);
            game.player.locomotion.position.copy(targetPos);
            game.player.locomotion.previousPosition.copy(targetPos);
            game.player.locomotion.velocity.set(0, 0, 0);
            controls.target.set(target.x, spawnY + 1.7, target.y);
            camera.position.copy(controls.target).add(cameraOffset);
        };
        
        game.onBuilderToggle = (active: boolean) => environmentState.setIsBuilderMode(active);
        game.onBuildingTypeChange = (type: any) => environmentState.setActiveStructure(type);
        game.onBiomeUpdate = (b: any) => environmentState.setCurrentBiome(b);
        game.onBuildLog = (message: string) => uiState.addBuilderLog(message);
        
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
        game.onEnterTown = () => {
            setIsEnvironmentBuilt(false);
            setIsVisualLoadingDone(false);
            setIsCombatActive(false);
            setGameState('LOADING');
            setTimeout(() => setActiveScene('town'), 100);
        };
    };

    const handleExport = () => {
        import('../../../game/core/ModelExporter').then(({ ModelExporter }) => {
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
                        <>
                            <MainMenu onStart={handleEnterWorld} onShowEnemies={onShowEnemies} isMobile={isMobileDevice} />
                            {/* Mobile notice hidden as it is obscured by animator 3D logo */}
                            {/* {isMobileDevice && (
                                <div className="absolute inset-0 z-[120] flex items-end justify-center p-6 pointer-events-none">
                                    <div className="bg-black/70 border border-white/10 rounded-2xl px-5 py-4 text-center backdrop-blur">
                                        <p className="text-xs text-slate-300 uppercase tracking-[0.3em]">Mobile Notice</p>
                                        <p className="mt-2 text-sm font-bold text-white">this section is better served on desktop</p>
                                    </div>
                                </div>
                            )} */}
                        </>
                    ) : (
                        <>
                            {shouldMountScene && (activeScene === 'combat' ? (
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
                            ) : activeScene === 'mp' ? (
                                <MPTestScene 
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
                                    onToggleQuestLog={uiState.toggleQuestLog}
                                    showGrid={showGrid}
                                    isCombatActive={isCombatActive}
                                />
                            ) : activeScene === 'singleBiome' ? (
                                <SingleBiomeScene
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
                            ) : activeScene === 'town' ? (
                                <TownScene
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
                            ))}
                            
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
                                        onOpenTravel={handleTravelOpen}
                                        onToggleBestiary={onShowEnemies}
                                        onChangeLand={() => {
                                            console.log("Game: Change Land Clicked");
                                            setIsLandSelectionOpen(true);
                                        }}
                                        isBuilderMode={isBuilderMode}
                                    />
                                    
                                    {isBuilderMode && (
                                        <BuilderUI 
                                            activeType={activeStructure} 
                                            onSelectType={onSelectStructure} 
                                        />
                                    )}
                                    
                                    <BuilderLog />

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
            
            {gameState === 'PLAYING' && notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
                    <div className="bg-blue-600 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl border border-blue-400/50">
                        {notification}
                    </div>
                </div>
            )}
        </div>
    );
};
