import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Game } from "../game/core/Game";
import { PlayerConfig, PlayerInput, InventoryItem, EntityStats, TurnPhase } from '../types';
import { CombatLog, CombatLogEntry } from './ui/hud/CombatLog';
import { UnitStatsTooltip } from './ui/hud/UnitStatsTooltip';
import { PlayerBench } from './ui/hud/PlayerBench';
import { useGame } from '../hooks/useGame';

interface TurnQueueUnit {
    id: string;
    isFriendly: boolean;
    name: string;
    currentInitiative: number;
    stats: EntityStats;
}

interface TooltipState {
    visible: boolean;
    stats?: EntityStats;
    unitName?: string;
    x: number;
    y: number;
}

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
    combatLog: CombatLogEntry[];
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    controlsDisabled?: boolean;
}

const PHASE_META: Record<TurnPhase, { label: string; accent: string; pill: string; description: string }> = {
    [TurnPhase.INITIATIVE_ROLL]: {
        label: 'Setup',
        accent: 'from-amber-400/25 via-orange-400/10 to-transparent',
        pill: 'border-amber-300/30 bg-amber-400/15 text-amber-100',
        description: 'Initiative is being sorted and the frontline is settling into position.',
    },
    [TurnPhase.PLAYER_TURN]: {
        label: 'Ally Turn',
        accent: 'from-emerald-400/25 via-cyan-400/10 to-transparent',
        pill: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100',
        description: 'Select a friendly unit, review its move rings, then commit an action.',
    },
    [TurnPhase.AI_TURN]: {
        label: 'Enemy Turn',
        accent: 'from-rose-400/25 via-orange-400/10 to-transparent',
        pill: 'border-rose-300/30 bg-rose-400/15 text-rose-100',
        description: 'Hold the line while the enemy resolves its moves across the hex board.',
    },
    [TurnPhase.TURN_END]: {
        label: 'Turn End',
        accent: 'from-slate-300/20 via-slate-400/10 to-transparent',
        pill: 'border-white/15 bg-white/10 text-white',
        description: 'Effects resolve and the turn queue refreshes for the next exchange.',
    },
    [TurnPhase.VICTORY]: {
        label: 'Victory',
        accent: 'from-yellow-300/30 via-amber-300/10 to-transparent',
        pill: 'border-yellow-300/30 bg-yellow-300/15 text-yellow-100',
        description: 'The board is yours. Review survivors, then prepare for the next fight.',
    },
    [TurnPhase.DEFEAT]: {
        label: 'Defeat',
        accent: 'from-rose-500/30 via-red-500/10 to-transparent',
        pill: 'border-rose-300/30 bg-rose-400/15 text-rose-100',
        description: 'Your formation collapsed. Reposition and try a cleaner opener.',
    },
};

const normalizeUnitName = (unit: { entity?: any; constructor?: { name?: string } } | null | undefined) => {
    const rawName = unit?.entity?.constructor?.name || unit?.constructor?.name || 'Unit';
    return rawName === 'Player' ? 'Hero' : rawName;
};

const getUnitStats = (unit?: any | null, fallback?: EntityStats) => {
    return fallback || unit?.stats || unit?.status?.getStats?.();
};

const getHealthPercent = (stats?: EntityStats) => {
    if (!stats?.maxHealth) return 0;
    return Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));
};

const formatStat = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '--';
    return Math.round(value * 10) / 10;
};

const Panel: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({
    title,
    subtitle,
    children,
    className = '',
}) => (
    <section className={`rounded-[28px] border border-white/10 bg-slate-950/74 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl ${className}`}>
        <div className="border-b border-white/8 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">{title}</p>
            {subtitle && <p className="mt-1 text-sm text-white/65">{subtitle}</p>}
        </div>
        <div className="p-5">{children}</div>
    </section>
);

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
    combatLog,
    showGrid,
    setShowGrid,
    controlsDisabled = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0 });
    const [turnQueue, setTurnQueue] = useState<TurnQueueUnit[]>([]);
    const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
    const [turnPhase, setTurnPhase] = useState<TurnPhase>(TurnPhase.INITIATIVE_ROLL);
    const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
    const [selectedStats, setSelectedStats] = useState<EntityStats | undefined>(undefined);
    const [selectedBenchSlot, setSelectedBenchSlot] = useState(0);

    const safeManualInput = useMemo<Partial<PlayerInput>>(() => {
        return {
            ...manualInput,
            ...LOCKED_COMBAT_INPUT,
        };
    }, [manualInput]);

    const hideTooltip = useCallback(() => {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }, []);

    const handleTurnQueueUpdate = useCallback((queue: any[]) => {
        const uiQueue: TurnQueueUnit[] = queue.map((unit) => ({
            id: unit.id,
            isFriendly: unit.isFriendly,
            name: normalizeUnitName(unit),
            currentInitiative: unit.currentInitiative,
            stats: unit.stats,
        }));
        setTurnQueue(uiQueue);
    }, []);

    const handleTurnChanged = useCallback((unit: { id: string; entity?: any; stats?: EntityStats }) => {
        setCurrentUnitId(unit.id);

        if (unit.entity && unit.id === unit.entity?.id) {
            setSelectedUnit(unit.entity);
            setSelectedStats(unit.stats);
        }
    }, []);

    const handleTurnPhaseChange = useCallback((phase: TurnPhase) => {
        setTurnPhase(phase);
    }, []);

    const handleGameReady = useCallback((game: Game) => {
        onGameReady?.(game);

        game.onUnitSelect = (stats, unit) => {
            setSelectedUnit(unit ?? null);
            setSelectedStats(stats);
        };

        if (game.combatManager) {
            game.combatManager.onShowTooltip = (stats, name, x, y) => {
                setTooltip({ visible: true, stats, unitName: name, x: x || 0, y: y || 0 });
            };
            game.combatManager.onHideTooltip = hideTooltip;
        }
    }, [hideTooltip, onGameReady]);

    const { gameRef, endTurn, waitTurn, defend } = useGame({
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
        onTurnQueueUpdate: handleTurnQueueUpdate,
        onTurnChanged: handleTurnChanged,
        onTurnPhaseChange: handleTurnPhaseChange,
    });

    useEffect(() => {
        if (!isCombatActive) {
            setTurnQueue([]);
            setCurrentUnitId(null);
            setTurnPhase(TurnPhase.INITIATIVE_ROLL);
            setSelectedUnit(null);
            setSelectedStats(undefined);
            hideTooltip();
        }
    }, [hideTooltip, isCombatActive]);

    const isPlayerTurn = turnPhase === TurnPhase.PLAYER_TURN;
    const selectedUnitStats = getUnitStats(selectedUnit, selectedStats);
    const selectedUnitName = normalizeUnitName(selectedUnit);
    const phaseMeta = PHASE_META[turnPhase] || PHASE_META[TurnPhase.INITIATIVE_ROLL];
    const activeQueueUnit = turnQueue.find((unit) => unit.id === currentUnitId) || null;
    const upNextUnit = turnQueue.find((unit) => unit.id !== currentUnitId) || null;
    const friendlyUnits = turnQueue.filter((unit) => unit.isFriendly);
    const enemyUnits = turnQueue.filter((unit) => !unit.isFriendly);
    const aliveFriendlies = friendlyUnits.filter((unit) => unit.stats.health > 0).length;
    const aliveEnemies = enemyUnits.filter((unit) => unit.stats.health > 0).length;
    const selectedBenchItem = bench[selectedBenchSlot];

    return (
        <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top,#16324a_0%,#08111d_38%,#04070c_100%)] text-white" onClick={hideTooltip}>
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-400/10 via-transparent to-transparent" />
                <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-slate-950/55 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-slate-950/70 to-transparent" />
            </div>

            <div ref={containerRef} className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} />

            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
                <div className="pointer-events-auto px-4 pb-3 pt-4 sm:px-6">
                    <div className={`overflow-hidden rounded-[30px] border border-white/12 bg-slate-950/76 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl`}>
                        <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-r ${phaseMeta.accent} pointer-events-none`} />
                        <div className="relative flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] ${phaseMeta.pill}`}>
                                    {phaseMeta.label}
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Board State</div>
                                    <div className="mt-1 flex items-center gap-3 text-sm">
                                        <span className="font-semibold text-cyan-100">{aliveFriendlies} allies</span>
                                        <span className="text-white/25">vs</span>
                                        <span className="font-semibold text-rose-100">{aliveEnemies} enemies</span>
                                    </div>
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Active Unit</div>
                                    <div className="mt-1 text-sm font-semibold text-white">
                                        {activeQueueUnit ? activeQueueUnit.name : 'Awaiting opener'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
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
                                {!isCombatActive ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsCombatActive(true)}
                                        className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-5 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-50 transition hover:bg-emerald-400/25"
                                    >
                                        Start Combat
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={defend}
                                            disabled={!isPlayerTurn}
                                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Defend
                                        </button>
                                        <button
                                            type="button"
                                            onClick={waitTurn}
                                            disabled={!isPlayerTurn}
                                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Wait
                                        </button>
                                        <button
                                            type="button"
                                            onClick={endTurn}
                                            disabled={!isPlayerTurn}
                                            className="rounded-full border border-cyan-300/35 bg-cyan-400/15 px-5 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-50 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            End Turn
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 sm:px-6 lg:flex-row">
                    <div className="pointer-events-auto flex w-full flex-col gap-4 lg:max-w-[320px]">
                        <Panel
                            title="Selected Unit"
                            subtitle={selectedUnit ? `${selectedUnitName} is currently in focus.` : 'Click a unit to inspect its battlefield profile.'}
                        >
                            {selectedUnit && selectedUnitStats ? (
                                <div className="space-y-4">
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-lg font-black tracking-tight text-white">{selectedUnitName}</div>
                                                <div className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">
                                                    {selectedUnit === gameRef.current?.player ? 'Hero Unit' : selectedUnit?.constructor?.name || 'Battle Unit'}
                                                </div>
                                            </div>
                                            <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                                                selectedUnitStats.health > 0
                                                    ? 'border-emerald-300/25 bg-emerald-400/15 text-emerald-100'
                                                    : 'border-rose-300/25 bg-rose-400/15 text-rose-100'
                                            }`}>
                                                {selectedUnitStats.health > 0 ? 'Ready' : 'Downed'}
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="mb-2 flex items-center justify-between text-xs text-white/65">
                                                <span>Health</span>
                                                <span>{formatStat(selectedUnitStats.health)} / {formatStat(selectedUnitStats.maxHealth)}</span>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-300 to-lime-200" style={{ width: `${getHealthPercent(selectedUnitStats)}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">Damage</div>
                                            <div className="mt-2 text-xl font-black text-white">{formatStat(selectedUnitStats.damage)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">Defense</div>
                                            <div className="mt-2 text-xl font-black text-white">{formatStat(selectedUnitStats.defense)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">Range</div>
                                            <div className="mt-2 text-xl font-black text-white">{formatStat(selectedUnitStats.range)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">Speed</div>
                                            <div className="mt-2 text-xl font-black text-white">{formatStat(selectedUnitStats.attackSpeed)}</div>
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-cyan-300/10 bg-cyan-400/[0.05] p-4 text-sm leading-6 text-cyan-50/85">
                                        Right-click any unit on the board for a floating stat card. Left-click keeps this panel synced to your current tactical focus.
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm leading-6 text-white/55">
                                    The battlefield is now framed more like an auto-battler: keep the 3D arena in the middle, click pieces to inspect them, and use the top command rail to manage your turn.
                                </div>
                            )}
                        </Panel>

                        <Panel title="Battle Plan" subtitle={phaseMeta.description}>
                            <div className="space-y-3 text-sm text-white/70">
                                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Up Next</div>
                                    <div className="mt-2 text-base font-semibold text-white">{upNextUnit ? upNextUnit.name : 'Queue is forming'}</div>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Bench Focus</div>
                                    <div className="mt-2 text-base font-semibold text-white">{selectedBenchItem?.name || 'Empty slot selected'}</div>
                                    <div className="mt-1 text-xs text-white/45">
                                        {selectedBenchItem ? `Quantity: ${selectedBenchItem.count}` : 'Use the lower tray to review summons, consumables, or loadout pieces.'}
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>

                    <div className="min-h-[260px] flex-1" />

                    <div className="pointer-events-auto flex w-full flex-col gap-4 lg:max-w-[360px]">
                        <Panel title="Turn Queue" subtitle="Auto-chess style readability, but mapped to your live hex combatants.">
                            <div className="space-y-3">
                                {turnQueue.slice(0, 8).map((unit, index) => {
                                    const isActive = unit.id === currentUnitId;
                                    const healthPercent = getHealthPercent(unit.stats);

                                    return (
                                        <div
                                            key={unit.id}
                                            className={`rounded-[22px] border px-4 py-3 transition ${
                                                isActive
                                                    ? unit.isFriendly
                                                        ? 'border-cyan-300/30 bg-cyan-400/10'
                                                        : 'border-rose-300/30 bg-rose-400/10'
                                                    : 'border-white/8 bg-white/[0.03]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-xs font-black uppercase ${
                                                        unit.isFriendly
                                                            ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
                                                            : 'border-rose-300/20 bg-rose-400/10 text-rose-100'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-bold text-white">{unit.name}</div>
                                                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                                                            {unit.isFriendly ? 'Allied Front' : 'Enemy Front'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Init</div>
                                                    <div className="text-sm font-black text-white">{formatStat(unit.currentInitiative)}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                                <div className={`h-full rounded-full ${unit.isFriendly ? 'bg-gradient-to-r from-cyan-400 to-emerald-300' : 'bg-gradient-to-r from-rose-500 to-orange-300'}`} style={{ width: `${healthPercent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {turnQueue.length === 0 && (
                                    <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/50">
                                        Queue will populate as soon as combat begins.
                                    </div>
                                )}
                            </div>
                        </Panel>

                        <div className="relative min-h-[240px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/74 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                            <CombatLog entries={combatLog} />
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto px-4 pb-4 sm:px-6">
                    <div className="rounded-[30px] border border-white/10 bg-slate-950/76 px-4 py-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Bench Rail</div>
                                <div className="mt-1 text-sm text-white/65">Keep your reserve visible like an auto-battler tray, while the board stays fully 3D.</div>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
                                {selectedBenchItem ? `${selectedBenchItem.name} x${selectedBenchItem.count}` : 'Select a bench slot'}
                            </div>
                        </div>
                        <div className="overflow-x-auto pb-1">
                            <PlayerBench inventory={bench} selectedSlot={selectedBenchSlot} onSelectSlot={setSelectedBenchSlot} />
                        </div>
                    </div>
                </div>
            </div>

            <UnitStatsTooltip
                visible={tooltip.visible}
                stats={tooltip.stats}
                unitName={tooltip.unitName}
                x={tooltip.x}
                y={tooltip.y}
            />
        </div>
    );
};

export default CombatScene;
