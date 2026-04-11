import React from 'react';
import DevScene from '../../DevScene';
import CombatScene from '../../CombatScene';
import MPTestScene from '../../MPTestScene';
import SingleBiomeScene from '../../SingleBiomeScene';
import TownScene from '../../TownScene';
import Town2Scene from '../../Town2Scene';
import TDGameScene from '../../TDGameScene';
import RoguelikeScene from '../../RoguelikeScene';
import { useGlobalState } from '../../../contexts/GlobalContext';

import { CombatLogEntry } from '../hud/CombatLog';
import { MainMenu } from '../menus/MainMenu';
import LoadingScreen from '../overlays/LoadingScreen';
import { MobileControls } from '../hud/MobileControls';
import { DialogueOverlay } from '../overlays/DialogueOverlay';
import { GameHUD } from '../hud/GameHUD';
import { ChakraNodeDebuggerSidebar, type ChakraDebuggerSidebarEntry, type ChakraSidebarHoverTarget } from '../modals/ChakraNodeDebuggerSidebar';
import { BuilderUI } from '../panels/BuilderUI';
import { BuilderLog } from '../panels/BuilderLog';
import { ControlPanel } from '../panels/ControlPanel';
import * as THREE from 'three';
import type { DialogueContent } from '../../../game/core/Game';
import { CITIES } from '../../../data/lands/cities';
import { getTownWallCenters } from '../../../game/environment/townWalls';
import { useIsMobileDevice } from '../../../hooks/useIsMobileDevice';
import { useUndoRedo } from '../../../hooks/useUndoRedo';
import type { ActiveScene } from '../../../hooks/useGameState';

export const Game: React.FC = () => {
    const isMobileDevice = useIsMobileDevice();
    const {
        gameState: gameStateContext,
        playerState,
        inventoryState,
        uiState,
        combatState,
        environmentState,
        questState,
        gameInstance
    } = useGlobalState();

    const { activeScene, gameState, setGameState, setActiveScene } = gameStateContext;
    const { config, setConfig, manualInput, setManualInput } = playerState;
    const { inventory, bench, setInventory, setBench } = inventoryState;

    // Undo/Redo functionality
    const { undo, redo, canUndo, canRedo } = useUndoRedo(config, setConfig);
    const { 
        dialogue, 
        selectedSlot, setSelectedSlot,
        interactionText, interactionProgress, setInteractionText, setInteractionProgress,
        isInventoryOpen, isTradeOpen, isShopkeeperChatOpen, isForgeOpen, isKeybindsOpen, isQuestLogOpen, isSpawnModalOpen, isEnemiesModalOpen, isCharacterStatsOpen, isLandMapOpen, isAreaMapOpen, isTravelOpen,
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
    const [lastScene, setLastScene] = React.useState<string | null>(null);
    const [isSceneInitializing, setIsSceneInitializing] = React.useState(false);
    const mountSceneTimeout = React.useRef<number | null>(null);
    const visualReadyTimeout = React.useRef<number | null>(null);
    const viewportRef = React.useRef<HTMLDivElement | null>(null);
    const [showChakraNodeSidebar, setShowChakraNodeSidebar] = React.useState(false);
    const [chakraNodeLegend, setChakraNodeLegend] = React.useState<ChakraDebuggerSidebarEntry[]>([]);
    const [chakraConnectionLegend, setChakraConnectionLegend] = React.useState<ChakraDebuggerSidebarEntry[]>([]);
    const chakraNodeLegendSignatureRef = React.useRef('');
    const chakraSidebarVisibleRef = React.useRef(false);
    const chakraHoverTargetRef = React.useRef<ChakraSidebarHoverTarget | null>(null);
    const chakraArrowPathRef = React.useRef<SVGPathElement | null>(null);
    const chakraProjectVecRef = React.useRef(new THREE.Vector3());
    const chakraCameraDirRef = React.useRef(new THREE.Vector3());
    const arenaVictoryHandledRef = React.useRef(false);

    const isHUDDisabled = isInventoryOpen || isTradeOpen || isShopkeeperChatOpen || isForgeOpen || !!dialogue || isKeybindsOpen || isQuestLogOpen || isSpawnModalOpen || isEnemiesModalOpen || isCharacterStatsOpen || isLandMapOpen || isAreaMapOpen || gameState !== 'PLAYING' || isTravelOpen;
    const selectedLandRef = React.useRef(selectedLand);
    const activeSceneRef = React.useRef(activeScene);

    React.useEffect(() => {
        selectedLandRef.current = selectedLand;
    }, [selectedLand]);

    React.useEffect(() => {
        activeSceneRef.current = activeScene;
    }, [activeScene]);

    React.useEffect(() => {
        if (!isCombatActive) {
            arenaVictoryHandledRef.current = false;
        }
    }, [isCombatActive, activeScene]);

    // Mount scene immediately when loading starts
    React.useEffect(() => {
        if (gameState === 'LOADING' && !shouldMountScene && !isSceneInitializing) {
            setIsSceneInitializing(true);
            // Small delay to ensure LoadingScreen component is rendered first
            mountSceneTimeout.current = window.setTimeout(() => {
                setShouldMountScene(true);
                setIsSceneInitializing(false);
            }, 50);
        }
    }, [gameState, shouldMountScene, isSceneInitializing]);

    // Safety watchdog: surface hung loading in console without force-finishing.
    React.useEffect(() => {
        if (gameState === 'LOADING' && (!isEnvironmentBuilt || !isVisualLoadingDone) && shouldMountScene) {
            const t = setTimeout(() => {
                console.warn(`[Game.tsx] Loading is still in progress for ${activeScene} scene after 30s.`);
            }, 30000);
            return () => clearTimeout(t);
        }
    }, [gameState, activeScene, isEnvironmentBuilt, isVisualLoadingDone, shouldMountScene]);

    // Reset shouldMountScene when activeScene changes while in LOADING state
    React.useEffect(() => {
        if (gameState === 'LOADING' && activeScene !== lastScene) {
            console.log(`[Game.tsx] Scene change detected: ${lastScene} -> ${activeScene}. Resetting mount state.`);
            setShouldMountScene(false);
            setLastScene(activeScene);
            
            // Re-trigger mounting after a short delay
            const t = setTimeout(() => {
                setShouldMountScene(true);
            }, 100);
            return () => clearTimeout(t);
        }
    }, [gameState, activeScene, lastScene]);

    const scheduleVisualLoadingDone = () => {
        if (visualReadyTimeout.current) {
            window.clearTimeout(visualReadyTimeout.current);
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                visualReadyTimeout.current = window.setTimeout(() => {
                    setIsVisualLoadingDone(true);
                }, 800);
            });
        });
    };

    // Handlers
    const handleEnterWorld = (scene: ActiveScene = activeScene) => {
        setIsEnvironmentBuilt(false);
        setIsVisualLoadingDone(false);
        setIsCombatActive(false);
        setGameState('LOADING');
        setShouldMountScene(false);
        setIsSceneInitializing(false);
        if (mountSceneTimeout.current) window.clearTimeout(mountSceneTimeout.current);
        if (visualReadyTimeout.current) window.clearTimeout(visualReadyTimeout.current);
        setActiveScene(scene);
        // Defer mounting the scene to next tick to allow loading UI to paint
        mountSceneTimeout.current = window.setTimeout(() => {
          setShouldMountScene(true);
        }, 150);
    };

    const handleEnvironmentReady = () => {
        console.log(`[Game.tsx] Environment ready for scene: ${activeSceneRef.current}`);
        setIsEnvironmentBuilt(true);
        // Ensure visual loading also proceeds immediately if we are switching scenes
        if (gameState === 'LOADING') {
            scheduleVisualLoadingDone();
        }
    };

    const handleStartPlaying = () => {
        setGameState('PLAYING');
    };

    const handleInteractionUpdate = (text: string | null, prog: number | null) => { 
        setInteractionText(text); 
        setInteractionProgress(prog); 
    };

    const hideChakraHoverArrow = React.useCallback(() => {
        const arrowPath = chakraArrowPathRef.current;
        if (!arrowPath) return;
        arrowPath.style.opacity = '0';
        arrowPath.setAttribute('d', '');
    }, []);

    const handleChakraSidebarHover = React.useCallback((target: ChakraSidebarHoverTarget | null) => {
        chakraHoverTargetRef.current = target;
        if (!target) hideChakraHoverArrow();
    }, [hideChakraHoverArrow]);

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
            if (visualReadyTimeout.current) window.clearTimeout(visualReadyTimeout.current);
            chakraNodeLegendSignatureRef.current = '';
            chakraSidebarVisibleRef.current = false;
            chakraHoverTargetRef.current = null;
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

    React.useEffect(() => {
        const game = gameInstance.current;
        if (!game) return;
        if (config.showChakraNetwork && game.player.isDebugHands) {
            game.player.toggleHandsDebug();
        }
    }, [config.showChakraNetwork, gameInstance]);

    React.useEffect(() => {
        if (!showChakraNodeSidebar) {
            chakraHoverTargetRef.current = null;
            hideChakraHoverArrow();
        }
    }, [showChakraNodeSidebar, hideChakraHoverArrow]);

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

    const onDialogueChoice = (choiceId: string) => {
        const currentDialogue = dialogue;
        if (!currentDialogue || typeof currentDialogue === 'string') return;

        if (currentDialogue.actorId === 'captain_bren') {
            if (choiceId === 'quest') {
                const questDialogue = questState.handleTown2Interaction('captain_bren');
                if (questDialogue) {
                    setDialogue({
                        text: questDialogue,
                        actorId: 'captain_bren',
                        choices: [
                            { id: 'quest', label: 'Quest' },
                            { id: 'explore_wilderness', label: 'Explore Wilderness' }
                        ]
                    });
                }
                return;
            }

            if (choiceId === 'explore_wilderness') {
                setDialogue(null);
                setIsTravelOpen(false);
                if (gameInstance.current) gameInstance.current.player.isTalking = false;
                handleEnterWorld('land');
            }
        }
    };

    const handleRotationUpdate = React.useCallback((rotation: number) => {
        setPlayerRotation((prev) => (Math.abs(prev - rotation) < 0.01 ? prev : rotation));
    }, [setPlayerRotation]);

    const onShowEnemies = () => {
        setIsEnemiesModalOpen(true);
    };

    const handleOpenStandaloneCC = React.useCallback(() => {
        window.open('/standalone_cc/index.html', '_blank', 'noopener,noreferrer');
    }, []);

    const onSelectStructure = (type: any) => {
        environmentState.setActiveStructure(type);
        if (gameInstance.current) gameInstance.current.setBuildingType(type);
    };

    const onGameReady = (game: any) => {
        gameInstance.current = game;
        setShowChakraNodeSidebar(false);
        setChakraNodeLegend([]);
        setChakraConnectionLegend([]);
        chakraNodeLegendSignatureRef.current = '';
        chakraSidebarVisibleRef.current = false;
        chakraHoverTargetRef.current = null;
        hideChakraHoverArrow();
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
        game.inputManager.onToggleSkeletonMode = () => {
            game.player.toggleSkeletonMode();
            const showChakraNetwork = !!game.player.config.showChakraNetwork;
            setConfig(prev => (
                prev.showChakraNetwork === showChakraNetwork
                    ? prev
                    : { ...prev, showChakraNetwork }
            ));
        };
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
        
        game.onDialogueTrigger = (content: string | DialogueContent) => setDialogue(content);
        game.onTradeTrigger = () => uiState.setIsTradeOpen(true);
        game.onShopkeeperTrigger = () => uiState.setIsShopkeeperChatOpen(true);
        game.onForgeTrigger = () => uiState.setIsForgeOpen(true);
        game.onNpcInteraction = ({ scene, target }) => {
            const actorId = target?.group?.userData?.actorId;
            if (scene === 'town2' && actorId) {
                if (actorId === 'captain_bren') {
                    return {
                        dialogue: {
                            text: 'Captain Bren stands at the gate, scanning the road.',
                            actorId: 'captain_bren',
                            choices: [
                                { id: 'quest', label: 'Quest' },
                                { id: 'explore_wilderness', label: 'Explore Wilderness' }
                            ]
                        },
                        mode: 'dialogue',
                        suppressDefault: true
                    };
                }

                const dialogue = questState.handleTown2Interaction(actorId);
                if (dialogue) {
                    return {
                        dialogue,
                        mode: 'dialogue',
                        suppressDefault: true
                    };
                }
            }

            if (target?.group?.userData?.interactionMode) {
                return {
                    mode: target.group.userData.interactionMode,
                    suppressDefault: false
                };
            }

            return null;
        };
        game.onRotationUpdate = handleRotationUpdate;
        game.onTurnPhaseChange = (phase: string) => {
            if (phase === 'victory' && !arenaVictoryHandledRef.current) {
                arenaVictoryHandledRef.current = true;
                questState.registerCombatVictory();
            }
        };
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
        game.onEnterTown2 = () => {
            setIsEnvironmentBuilt(false);
            setIsVisualLoadingDone(false);
            setIsCombatActive(false);
            setGameState('LOADING');
            setTimeout(() => setActiveScene('town2'), 100);
        };

        const previousOnUpdate = game.onUpdate;
        game.onUpdate = (dt: number) => {
            previousOnUpdate?.(dt);
            const player = game.player;
            if (!player) return;

            const sidebarVisible = typeof player.isChakraDebugSidebarActive === 'function'
                ? !!player.isChakraDebugSidebarActive()
                : false;

            if (chakraSidebarVisibleRef.current !== sidebarVisible) {
                chakraSidebarVisibleRef.current = sidebarVisible;
                setShowChakraNodeSidebar(sidebarVisible);
                if (!sidebarVisible) {
                    chakraNodeLegendSignatureRef.current = '';
                    setChakraNodeLegend([]);
                    setChakraConnectionLegend([]);
                    chakraHoverTargetRef.current = null;
                    hideChakraHoverArrow();
                }
            }

            if (!sidebarVisible) {
                hideChakraHoverArrow();
                return;
            }

            const nodeLegend = (typeof player.getChakraNodeLegend === 'function'
                ? player.getChakraNodeLegend()
                : []) as ChakraDebuggerSidebarEntry[];
            const connectionLegend = (typeof player.getChakraConnectionLegend === 'function'
                ? player.getChakraConnectionLegend()
                : []) as ChakraDebuggerSidebarEntry[];
            const signature = [
                nodeLegend.map(entry => `${entry.id}:${entry.name}:${entry.color}`).join('|'),
                connectionLegend.map(entry => `${entry.id}:${entry.name}:${entry.color}`).join('|')
            ].join('||');
            if (signature !== chakraNodeLegendSignatureRef.current) {
                chakraNodeLegendSignatureRef.current = signature;
                setChakraNodeLegend(nodeLegend);
                setChakraConnectionLegend(connectionLegend);
            }

            const hoverTarget = chakraHoverTargetRef.current;
            if (!hoverTarget) {
                hideChakraHoverArrow();
                return;
            }

            const worldPoint = typeof player.getChakraDebugWorldPoint === 'function'
                ? player.getChakraDebugWorldPoint(hoverTarget.kind, hoverTarget.id)
                : null;
            if (!worldPoint) {
                hideChakraHoverArrow();
                return;
            }

            const camera = game.renderManager?.camera as THREE.PerspectiveCamera | undefined;
            const rendererElement = game.renderManager?.renderer?.domElement as HTMLCanvasElement | undefined;
            const viewportElement = viewportRef.current;
            const arrowPath = chakraArrowPathRef.current;
            if (!camera || !rendererElement || !viewportElement || !arrowPath) return;

            camera.getWorldDirection(chakraCameraDirRef.current);
            const toPoint = worldPoint.clone().sub(camera.position);
            if (toPoint.dot(chakraCameraDirRef.current) <= 0) {
                hideChakraHoverArrow();
                return;
            }

            chakraProjectVecRef.current.copy(worldPoint).project(camera);
            const rendererRect = rendererElement.getBoundingClientRect();
            const viewportRect = viewportElement.getBoundingClientRect();

            const screenX = rendererRect.left + ((chakraProjectVecRef.current.x + 1) * 0.5 * rendererRect.width);
            const screenY = rendererRect.top + (((1 - chakraProjectVecRef.current.y) * 0.5) * rendererRect.height);
            const clampedScreenX = Math.min(rendererRect.right - 8, Math.max(rendererRect.left + 8, screenX));
            const clampedScreenY = Math.min(rendererRect.bottom - 8, Math.max(rendererRect.top + 8, screenY));

            const startX = hoverTarget.clientX - viewportRect.left;
            const startY = hoverTarget.clientY - viewportRect.top;
            const endX = clampedScreenX - viewportRect.left;
            const endY = clampedScreenY - viewportRect.top;
            const controlOffset = Math.max(36, Math.min(180, Math.abs(endX - startX) * 0.4));
            const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${(startX + controlOffset).toFixed(1)} ${startY.toFixed(1)} ${(endX - controlOffset * 0.45).toFixed(1)} ${endY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;

            arrowPath.setAttribute('d', d);
            arrowPath.setAttribute('stroke', hoverTarget.color);
            arrowPath.style.opacity = (chakraProjectVecRef.current.z < -1 || chakraProjectVecRef.current.z > 1) ? '0.45' : '1';
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

    const showGlobalHUD = !isHUDDisabled && activeScene !== 'combat' && activeScene !== 'roguelike';

    return (
        <div className="w-full h-full flex flex-col items-center justify-start">
            <div ref={viewportRef} className="w-full flex-1 bg-black border-x border-t border-white/10 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0">
                    {gameState === 'MENU' ? (
                        <>
                            <MainMenu
                                activeScene={activeScene}
                                onSceneChange={setActiveScene}
                                onStart={handleEnterWorld}
                                onShowEnemies={onShowEnemies}
                                onOpenStandaloneCC={handleOpenStandaloneCC}
                                isMobile={isMobileDevice}
                                showVideoBackground={true}
                            />
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
                            {shouldMountScene && (
                                <div className={`absolute inset-0 transition-opacity duration-500 ${gameState === 'PLAYING' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                    {activeScene === 'combat' ? (
                                        <CombatScene 
                                            config={config}
                                            manualInput={manualInput}
                                            bench={bench}
                                            onGameReady={onGameReady}
                                            onEnvironmentReady={() => {
                                                handleEnvironmentReady();
                                                scheduleVisualLoadingDone();
                                            }}
                                            onInteractionUpdate={handleInteractionUpdate}
                                            onToggleQuestLog={uiState.toggleQuestLog}
                                            onRotationUpdate={handleRotationUpdate}
                                            onAttackHit={(type, count) => {
                                                addCombatLog(`${type.charAt(0).toUpperCase() + type.slice(1)} struck for damage!`, 'damage');
                                            }}
                                            isCombatActive={isCombatActive}
                                            setIsCombatActive={setIsCombatActive}
                                            combatLog={combatLog}
                                            showGrid={showGrid}
                                            setShowGrid={setShowGrid}
                                            onBenchItemPlaced={(slotIndex) => {
                                                setBench((prev) => {
                                                    if (slotIndex < 0 || slotIndex >= prev.length) {
                                                        return prev;
                                                    }
                                                    const current = prev[slotIndex];
                                                    if (!current) {
                                                        return prev;
                                                    }

                                                    const next = [...prev];
                                                    if (current.count <= 1) {
                                                        next[slotIndex] = null;
                                                    } else {
                                                        next[slotIndex] = {
                                                            ...current,
                                                            count: current.count - 1,
                                                        };
                                                    }
                                                    return next;
                                                });
                                            }}
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
                                                scheduleVisualLoadingDone();
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
                                                scheduleVisualLoadingDone();
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
                                                scheduleVisualLoadingDone();
                                            }}
                                            onToggleWorldMap={handleMapToggle}
                                            onToggleQuestLog={uiState.toggleQuestLog}
                                            showGrid={showGrid}
                                            isCombatActive={isCombatActive}
                                        />
                                    ) : activeScene === 'town2' ? (
                                        <Town2Scene
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
                                                scheduleVisualLoadingDone();
                                            }}
                                            onToggleWorldMap={handleMapToggle}
                                            onToggleQuestLog={uiState.toggleQuestLog}
                                            showGrid={showGrid}
                                            isCombatActive={isCombatActive}
                                        />
                                    ) : activeScene === 'tdgame' ? (
                                        <TDGameScene
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
                                                scheduleVisualLoadingDone();
                                            }}
                                            onToggleWorldMap={handleMapToggle}
                                            onToggleQuestLog={uiState.toggleQuestLog}
                                            showGrid={showGrid}
                                            isCombatActive={isCombatActive}
                                        />
                                    ) : activeScene === 'roguelike' ? (
                                        <RoguelikeScene />
                                    ) : (
                                        <DevScene 
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
                                                scheduleVisualLoadingDone();
                                            }}
                                            onToggleWorldMap={handleMapToggle}
                                            onToggleQuestLog={uiState.toggleQuestLog}
                                            showGrid={showGrid}
                                            isCombatActive={isCombatActive}
                                        />
                                    )}
                                </div>
                            )}
                            
                            {isBuilderMode && (
                                <>
                                {console.log('BuilderUI rendering - isBuilderMode:', isBuilderMode, 'gameState:', gameState, 'activeStructure:', activeStructure, 'activeScene:', activeScene)}
                                <BuilderUI 
                                    activeType={activeStructure} 
                                    onSelectType={onSelectStructure} 
                                />
                                </>
                            )}
                            
                            {showGlobalHUD && (
                                <>
                                    <svg className="absolute inset-0 z-[63] pointer-events-none" aria-hidden>
                                        <defs>
                                            <marker id="chakraHoverArrowHead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                                                <path d="M0,0 L8,4 L0,8 z" fill="context-stroke" />
                                            </marker>
                                        </defs>
                                        <path
                                            ref={chakraArrowPathRef}
                                            d=""
                                            fill="none"
                                            stroke="#67e8f9"
                                            strokeWidth="2.25"
                                            strokeLinecap="round"
                                            markerEnd="url(#chakraHoverArrowHead)"
                                            style={{ opacity: 0, transition: 'opacity 120ms ease-out' }}
                                        />
                                    </svg>

                                    <ChakraNodeDebuggerSidebar 
                                        isOpen={showChakraNodeSidebar} 
                                        nodes={chakraNodeLegend} 
                                        connections={chakraConnectionLegend}
                                        onHoverTarget={handleChakraSidebarHover}
                                    />

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
                                        onUndo={undo}
                                        onRedo={redo}
                                        canUndo={canUndo}
                                        canRedo={canRedo}
                                    />
                                </>
                            )}
                            
                            <LoadingScreen 
                                isVisible={gameState === 'LOADING'}
                                isSystemReady={isSystemReady}
                                onFinished={handleStartPlaying}
                                isLoadingScene={isSceneInitializing || !isSystemReady}
                            />
                            
                            <DialogueOverlay dialogue={dialogue} onClose={onCloseDialogue} onSelectChoice={onDialogueChoice} />
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
