import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Game } from '../game/core/Game';
import { PlayerConfig, PlayerInput, InventoryItem } from '../types';
import { PlayerBench } from './ui/hud/PlayerBench';
import { useGame } from '../hooks/useGame';

const LOCKED_COMBAT_INPUT: Partial<PlayerInput> = {
    x: 0,
    y: 0,
    isRunning: false,
    jump: false,
    isPickingUp: false,
    attack1: false,
    attack2: false,
    interact: false,
    combat: false,
    wave: false,
    leftHandWave: false,
    summon: false,
    toggleBuilder: false,
    rotateGhost: false,
    fireball: false,
    crouch: false,
};

const DEFAULT_COMBAT_CAMERA = {
    position: { x: -0.3337032581374143, y: 12.039609406014813, z: 28.56928570429027 },
    target: { x: -0.16410461568110918, y: 0, z: 5.734082475602378 },
};

interface ShopUnit {
    id: string;
    name: string;
    tier: string;
    role: string;
    cost: number;
}

interface CombatEncounterRound {
    enemyType: string;
    enemyCount: number;
}

const SHOP_UNITS: ShopUnit[] = [
    { id: 'unit-1', name: 'Vanguard Sentinel', tier: 'Tier 1', role: 'Frontline', cost: 1 },
    { id: 'unit-2', name: 'Arc Ranger', tier: 'Tier 2', role: 'Ranged', cost: 2 },
    { id: 'unit-3', name: 'Storm Adept', tier: 'Tier 3', role: 'Caster', cost: 3 },
    { id: 'unit-4', name: 'Iron Paladin', tier: 'Tier 4', role: 'Bruiser', cost: 4 },
    { id: 'unit-5', name: 'Shade Assassin', tier: 'Tier 5', role: 'Skirmisher', cost: 5 },
];

const combatEncounter: CombatEncounterRound[] = [
    { enemyType: 'imp', enemyCount: 1 },
    { enemyType: 'imp', enemyCount: 2 },
    { enemyType: 'imp', enemyCount: 3 },
];

interface CombatSceneProps {
    config: PlayerConfig;
    manualInput: Partial<PlayerInput>;
    bench: (InventoryItem | null)[];
    onGameReady?: (game: Game) => void;
    onEnvironmentReady?: () => void;
    onInteractionUpdate?: (text: string | null, progress: number | null) => void;
    onToggleQuestLog?: () => void;
    onRotationUpdate?: (rotation: number) => void;
    onAttackHit?: (type: string, count: number) => void;
    isCombatActive: boolean;
    setIsCombatActive: (active: boolean) => void;
    combatLog?: unknown[];
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    onBenchItemPlaced?: (slotIndex: number) => void;
    controlsDisabled?: boolean;
}

const CombatScene: React.FC<CombatSceneProps> = ({
    config,
    manualInput,
    bench,
    onGameReady,
    onEnvironmentReady,
    onInteractionUpdate,
    onToggleQuestLog,
    onRotationUpdate,
    onAttackHit,
    isCombatActive,
    setIsCombatActive,
    showGrid,
    setShowGrid,
    onBenchItemPlaced,
    controlsDisabled = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const prevCombatActiveRef = useRef(isCombatActive);
    const [selectedBenchSlot, setSelectedBenchSlot] = useState(0);
    const [cameraInfo, setCameraInfo] = useState<{
        position: { x: number; y: number; z: number };
        target: { x: number; y: number; z: number };
        rotationDeg: { x: number; y: number; z: number };
        distance: number;
    } | null>(null);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
    const [showCameraPanel, setShowCameraPanel] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [selectedShopUnit, setSelectedShopUnit] = useState<ShopUnit | null>(null);
    const [currentCombatRound, setCurrentCombatRound] = useState(1);
    const [isRoundInProgress, setIsRoundInProgress] = useState(false);
    const [draggedBenchItem, setDraggedBenchItem] = useState<{ index: number; item: InventoryItem } | null>(null);
    const hoveredDropCellRef = useRef<{ r: number; c: number } | null>(null);
    const previewMarkerRef = useRef<THREE.Mesh | null>(null);

    const safeManualInput = useMemo<Partial<PlayerInput>>(() => {
        return {
            ...manualInput,
            ...LOCKED_COMBAT_INPUT,
        };
    }, [manualInput]);

    const applyDefaultCamera = (game: Game) => {
        game.renderManager.camera.position.set(
            DEFAULT_COMBAT_CAMERA.position.x,
            DEFAULT_COMBAT_CAMERA.position.y,
            DEFAULT_COMBAT_CAMERA.position.z
        );
        game.renderManager.controls.target.set(
            DEFAULT_COMBAT_CAMERA.target.x,
            DEFAULT_COMBAT_CAMERA.target.y,
            DEFAULT_COMBAT_CAMERA.target.z
        );
        game.renderManager.controls.update();
    };

    const handleGameReady = (game: Game) => {
        if (isCombatActive) {
            applyDefaultCamera(game);
        }
        onGameReady?.(game);
    };

    const { gameRef } = useGame({
        containerRef,
        config,
        manualInput: safeManualInput,
        initialInventory: [],
        activeScene: 'combat',
        onGameReady: handleGameReady,
        onEnvironmentReady,
        onInteractionUpdate,
        onToggleQuestLog,
        onRotationUpdate,
        onAttackHit,
        controlsDisabled,
        showGrid,
        isCombatActive,
    });

    useEffect(() => {
        if (!showCameraPanel) return;

        let frame = 0;
        let lastUpdate = 0;

        const tick = (now: number) => {
            const game = gameRef.current;
            const camera = game?.renderManager?.camera;
            const controls = game?.renderManager?.controls;

            if (camera && controls && now - lastUpdate >= 150) {
                lastUpdate = now;
                setCameraInfo({
                    position: {
                        x: camera.position.x,
                        y: camera.position.y,
                        z: camera.position.z,
                    },
                    target: {
                        x: controls.target.x,
                        y: controls.target.y,
                        z: controls.target.z,
                    },
                    rotationDeg: {
                        x: camera.rotation.x * (180 / Math.PI),
                        y: camera.rotation.y * (180 / Math.PI),
                        z: camera.rotation.z * (180 / Math.PI),
                    },
                    distance: camera.position.distanceTo(controls.target),
                });
            }

            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [gameRef, showCameraPanel]);

    const format3 = (value: number) => value.toFixed(3);

    const handleCopyCameraSettings = async () => {
        if (!cameraInfo) return;
        const payload = {
            cameraPosition: cameraInfo.position,
            cameraTarget: cameraInfo.target,
            cameraRotationDeg: cameraInfo.rotationDeg,
            cameraDistance: cameraInfo.distance,
        };
        const text = JSON.stringify(payload, null, 2);

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                const copied = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (!copied) {
                    throw new Error('execCommand copy failed');
                }
            }
            setCopyStatus('copied');
            window.setTimeout(() => setCopyStatus('idle'), 1500);
        } catch {
            setCopyStatus('error');
            window.setTimeout(() => setCopyStatus('idle'), 1500);
        }
    };

    useEffect(() => {
        if (!isCombatActive) {
            setSelectedBenchSlot(0);
            setCurrentCombatRound(1);
            setIsRoundInProgress(false);
        }
    }, [isCombatActive]);

    useEffect(() => {
        if (!isShopOpen) {
            setSelectedShopUnit(null);
        }
    }, [isShopOpen]);

    useEffect(() => {
        const wasActive = prevCombatActiveRef.current;
        if (isCombatActive && !wasActive && gameRef.current) {
            applyDefaultCamera(gameRef.current);
        }
        prevCombatActiveRef.current = isCombatActive;
    }, [gameRef, isCombatActive]);

    const selectedBenchItem = bench[selectedBenchSlot];

    const totalEncounterRounds = combatEncounter.length;
    const displayRound = Math.min(currentCombatRound, totalEncounterRounds);
    const canStartCurrentRound = !isRoundInProgress && currentCombatRound <= totalEncounterRounds;
    const canDebugNextRound = isRoundInProgress
        ? currentCombatRound < totalEncounterRounds
        : currentCombatRound <= totalEncounterRounds;

    const startRound = (roundNumber: number) => {
        const game = gameRef.current;
        if (!game) return;

        if (roundNumber < 1 || roundNumber > totalEncounterRounds) return;

        const roundConfig = combatEncounter[roundNumber - 1];
        if (!roundConfig) return;

        applyDefaultCamera(game);
        const started = game.startCombatEncounterRound(roundConfig.enemyType, roundConfig.enemyCount);
        if (!started) return;

        setCurrentCombatRound(roundNumber);
        setIsRoundInProgress(true);
        setIsCombatActive(true);
    };

    const handleRoundControlClick = () => {
        if (!canStartCurrentRound) return;
        startRound(currentCombatRound);
    };

    const handleDebugNextRound = () => {
        if (!canDebugNextRound) return;
        const targetRound = isRoundInProgress ? currentCombatRound + 1 : currentCombatRound;
        startRound(targetRound);
    };

    useEffect(() => {
        if (!isCombatActive || !isRoundInProgress) return;

        const checkRoundProgress = () => {
            const game = gameRef.current;
            if (!game) return;

            const hasLivingImp = game.entityManager.imps.some((imp) => !imp.isDead);
            if (!hasLivingImp) {
                setIsRoundInProgress(false);
                if (currentCombatRound >= totalEncounterRounds) {
                    setIsCombatActive(false);
                    return;
                }

                setCurrentCombatRound((prev) => Math.min(prev + 1, totalEncounterRounds));
            }
        };

        // Round completion does not need frame-perfect polling.
        const intervalId = window.setInterval(checkRoundProgress, 150);
        checkRoundProgress();

        return () => window.clearInterval(intervalId);
    }, [currentCombatRound, gameRef, isCombatActive, isRoundInProgress, setIsCombatActive, totalEncounterRounds]);

    const handleBenchItemDragStart = (index: number, item: InventoryItem) => {
        setDraggedBenchItem({ index, item });
    };

    const handleBenchItemDragEnd = () => {
        setDraggedBenchItem(null);
        hoveredDropCellRef.current = null;
        if (previewMarkerRef.current) {
            previewMarkerRef.current.visible = false;
        }
    };

    const updateDragPreviewFromScreen = (screenX: number, screenY: number) => {
        const game = gameRef.current;
        const arena = game?.sceneManager?.combatEnvironment;
        const camera = game?.renderManager?.camera;
        const renderer = game?.renderManager?.renderer;
        if (!game || !arena || !camera || !renderer) return;

        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((screenX - rect.left) / rect.width) * 2 - 1,
            -((screenY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(arena.group.children, true);
        const hexHit = hits.find((hit) => {
            const object = hit.object;
            return object.userData?.isHex || object.parent?.userData?.isHex;
        });

        if (!hexHit) {
            hoveredDropCellRef.current = null;
            if (previewMarkerRef.current) previewMarkerRef.current.visible = false;
            return;
        }

        const gridPos = arena.getGridPosition(hexHit.point);
        if (!gridPos) {
            hoveredDropCellRef.current = null;
            if (previewMarkerRef.current) previewMarkerRef.current.visible = false;
            return;
        }

        hoveredDropCellRef.current = gridPos;
        const snapped = arena.getWorldPosition(gridPos.r, gridPos.c);
        const isOccupied = arena.isCellOccupied(gridPos.r, gridPos.c);

        if (previewMarkerRef.current) {
            previewMarkerRef.current.visible = true;
            previewMarkerRef.current.position.set(snapped.x, 0.08, snapped.z);
            const mat = previewMarkerRef.current.material as THREE.MeshBasicMaterial;
            mat.color.setHex(isOccupied ? 0xdc2626 : 0x06b6d4);
            mat.opacity = isOccupied ? 0.45 : 0.7;
        }
    };

    const handleBoardDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!draggedBenchItem) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        updateDragPreviewFromScreen(e.clientX, e.clientY);
    };

    const handleBoardDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (!draggedBenchItem) return;
        e.preventDefault();

        updateDragPreviewFromScreen(e.clientX, e.clientY);

        const game = gameRef.current;
        const cell = hoveredDropCellRef.current;
        if (!game || !cell) {
            setDraggedBenchItem(null);
            return;
        }

        const placed = game.deployCombatBenchUnitAtCell(draggedBenchItem.item.name, cell.r, cell.c);
        if (placed) {
            onBenchItemPlaced?.(draggedBenchItem.index);
        }
        hoveredDropCellRef.current = null;
        if (previewMarkerRef.current) previewMarkerRef.current.visible = false;
        setDraggedBenchItem(null);
    };

    useEffect(() => {
        const game = gameRef.current;
        const arena = game?.sceneManager?.combatEnvironment;
        if (!game || !arena) return;

        if (!previewMarkerRef.current) {
            const markerGeo = new THREE.RingGeometry(0.7, 1.05, 6);
            const markerMat = new THREE.MeshBasicMaterial({
                color: 0x06b6d4,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide,
            });
            const marker = new THREE.Mesh(markerGeo, markerMat);
            marker.rotation.x = -Math.PI / 2;
            marker.visible = false;
            arena.group.add(marker);
            previewMarkerRef.current = marker;
        }

        if (!draggedBenchItem && previewMarkerRef.current) {
            previewMarkerRef.current.visible = false;
        }

        return () => {
            if (previewMarkerRef.current) {
                const marker = previewMarkerRef.current;
                marker.parent?.remove(marker);
                marker.geometry.dispose();
                (marker.material as THREE.Material).dispose();
                previewMarkerRef.current = null;
            }
        };
    }, [draggedBenchItem, gameRef]);

    return (
        <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top,#16324a_0%,#08111d_38%,#04070c_100%)] text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-400/10 via-transparent to-transparent" />
                <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-slate-950/55 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-slate-950/70 to-transparent" />
            </div>

            <div
                ref={containerRef}
                className="absolute inset-0"
                onContextMenu={(e) => e.preventDefault()}
                onDragOver={handleBoardDragOver}
                onDrop={handleBoardDrop}
            />

            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
                <div className="pointer-events-auto px-4 pb-3 pt-4 sm:px-6">
                    <div className="overflow-hidden rounded-[30px] border border-white/12 bg-slate-950/76 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                        <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-r ${isCombatActive ? 'from-emerald-400/25 via-cyan-400/10 to-transparent' : 'from-slate-300/20 via-slate-400/10 to-transparent'} pointer-events-none`} />
                        <div className="relative flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsShopOpen((prev) => !prev)}
                                    className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] transition ${
                                        isShopOpen
                                            ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-50'
                                            : 'border-white/15 bg-white/10 text-white hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:text-cyan-50'
                                    }`}
                                >
                                    Shop
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (gameRef.current) {
                                            applyDefaultCamera(gameRef.current);
                                        }
                                    }}
                                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/70 transition hover:border-white/20 hover:bg-white/10"
                                >
                                    Reset To Default
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCameraPanel((prev) => !prev)}
                                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] transition ${
                                        showCameraPanel
                                            ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-50'
                                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                >
                                    Camera Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowGrid(!showGrid)}
                                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] transition ${
                                        showGrid
                                            ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-50'
                                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                >
                                    {showGrid ? 'Hex Grid On' : 'Hex Grid Off'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRoundControlClick}
                                    disabled={!canStartCurrentRound}
                                    className={`group rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition ${
                                        canStartCurrentRound
                                            ? 'border-cyan-300/35 bg-cyan-400/10 text-cyan-50 hover:border-emerald-300/45 hover:bg-emerald-400/15'
                                            : 'border-white/10 bg-white/5 text-white/60'
                                    }`}
                                >
                                    {isRoundInProgress ? (
                                        <span>Round {displayRound} / {totalEncounterRounds} Live</span>
                                    ) : canStartCurrentRound ? (
                                        <>
                                            <span className="group-hover:hidden">Round {displayRound} / {totalEncounterRounds}</span>
                                            <span className="hidden group-hover:inline">Start Round {displayRound}</span>
                                        </>
                                    ) : (
                                        <span>Encounter Complete</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDebugNextRound}
                                    disabled={!canDebugNextRound}
                                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition ${
                                        canDebugNextRound
                                            ? 'border-amber-300/35 bg-amber-400/15 text-amber-50 hover:bg-amber-400/25'
                                            : 'border-white/10 bg-white/5 text-white/45'
                                    }`}
                                >
                                    Next Round (Debug)
                                </button>
                                {isCombatActive && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsRoundInProgress(false);
                                            setIsCombatActive(false);
                                        }}
                                        className="rounded-full border border-rose-300/35 bg-rose-400/15 px-5 py-2 text-xs font-black uppercase tracking-[0.24em] text-rose-50 transition hover:bg-rose-400/25"
                                    >
                                        Stop Board
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={`pointer-events-auto overflow-hidden px-4 transition-all duration-300 ease-out sm:px-6 ${
                        isShopOpen ? 'max-h-[70vh] translate-y-0 pb-3 opacity-100' : 'max-h-0 -translate-y-2 pb-0 opacity-0'
                    }`}
                >
                    <div className="relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/95 shadow-[0_20px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                        <div className="border-b border-white/10 px-6 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Shop</div>
                                    <div className="mt-1 text-sm text-white/70">Select a unit to open its detail panel.</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsShopOpen(false)}
                                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/80 transition hover:border-white/25 hover:bg-white/10"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto p-6">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                {SHOP_UNITS.map((unit) => (
                                    <button
                                        key={unit.id}
                                        type="button"
                                        onClick={() => setSelectedShopUnit(unit)}
                                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/[0.08]"
                                    >
                                        <div className="mb-3 h-24 rounded-2xl border border-dashed border-white/20 bg-gradient-to-br from-cyan-400/10 to-slate-900/40 p-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                                            Image Placeholder
                                        </div>
                                        <div className="text-sm font-black text-white">{unit.name}</div>
                                        <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100/80">{unit.tier}</div>
                                        <div className="mt-3 text-xs text-white/70">Role: {unit.role}</div>
                                        <div className="text-xs text-white/70">Cost: {unit.cost}</div>
                                        <div className="mt-3 text-[11px] text-white/50">Stats placeholder</div>
                                        <div className="text-[11px] text-white/50">Skills placeholder</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 sm:px-6 lg:flex-row">
                    <div className="min-h-[260px] flex-1" />
                    {showCameraPanel && (
                        <div className="pointer-events-auto flex w-full flex-col gap-4 lg:max-w-[360px]">
                            <div className="relative min-h-[240px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/74 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                                <div className="border-b border-white/8 px-5 py-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Camera Orientation</p>
                                        <button
                                            type="button"
                                            onClick={handleCopyCameraSettings}
                                            className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/20"
                                        >
                                            {copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Copy Failed' : 'Copy Settings'}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4 p-5 text-xs text-white/75">
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono">
                                        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Position</div>
                                        {cameraInfo ? `${format3(cameraInfo.position.x)}, ${format3(cameraInfo.position.y)}, ${format3(cameraInfo.position.z)}` : '--'}
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono">
                                        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Target</div>
                                        {cameraInfo ? `${format3(cameraInfo.target.x)}, ${format3(cameraInfo.target.y)}, ${format3(cameraInfo.target.z)}` : '--'}
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono">
                                        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Rotation (Deg)</div>
                                        {cameraInfo ? `${format3(cameraInfo.rotationDeg.x)}, ${format3(cameraInfo.rotationDeg.y)}, ${format3(cameraInfo.rotationDeg.z)}` : '--'}
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono">
                                        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Distance</div>
                                        {cameraInfo ? format3(cameraInfo.distance) : '--'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pointer-events-auto px-4 pb-4 sm:px-6">
                    <div className="mx-auto w-full max-w-[900px] rounded-[30px] border border-white/10 bg-slate-950/76 px-4 py-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Bench Rail</div>
                                <div className="mt-1 text-sm text-white/65">Keep your reserve visible while the board remains clear.</div>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
                                {selectedBenchItem ? `${selectedBenchItem.name} x${selectedBenchItem.count}` : 'Select a bench slot'}
                            </div>
                        </div>
                        <div className="overflow-x-auto pb-1">
                            <PlayerBench
                                inventory={bench}
                                selectedSlot={selectedBenchSlot}
                                onSelectSlot={setSelectedBenchSlot}
                                onItemDragStart={handleBenchItemDragStart}
                                onItemDragEnd={handleBenchItemDragEnd}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {selectedShopUnit && (
                <div
                    className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
                    onClick={() => setSelectedShopUnit(null)}
                >
                    <div
                        className="w-full max-w-xl rounded-[28px] border border-cyan-300/20 bg-slate-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Unit Details</div>
                                <div className="mt-1 text-lg font-black text-white">{selectedShopUnit.name}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedShopUnit(null)}
                                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/80 transition hover:border-white/25 hover:bg-white/10"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mb-4 h-36 rounded-2xl border border-dashed border-white/20 bg-gradient-to-br from-cyan-400/10 to-slate-900/50 p-4 text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                            Character Image Placeholder
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Stats</div>
                                <div className="mt-2 text-xs text-white/70">HP: --</div>
                                <div className="text-xs text-white/70">Attack: --</div>
                                <div className="text-xs text-white/70">Defense: --</div>
                                <div className="text-xs text-white/70">Range: --</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Skills</div>
                                <div className="mt-2 text-xs text-white/70">Skill 1 placeholder</div>
                                <div className="text-xs text-white/70">Skill 2 placeholder</div>
                                <div className="text-xs text-white/70">Passive placeholder</div>
                                <div className="text-xs text-white/70">Ultimate placeholder</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombatScene;
