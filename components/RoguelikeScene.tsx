import React, { useMemo, useState } from 'react';
import { GameHUD } from './ui/hud/GameHUD';
import { CombatLogEntry } from './ui/hud/CombatLog';
import { TurnIndicatorUI } from './ui/hud/TurnIndicatorUI';
import { UnitStatsTooltip } from './ui/hud/UnitStatsTooltip';
import { DEFAULT_CONFIG, EntityStats, InventoryItem } from '../types';

const defaultStats: EntityStats = { ...DEFAULT_CONFIG.stats };

const initialCombatLog: CombatLogEntry[] = [
    {
        id: 'roguelike-boot',
        text: 'Roguelike scene loaded (unrigged preview).',
        type: 'system',
        timestamp: Date.now(),
    },
];

const RoguelikeScene: React.FC = () => {
    const [isCombatActive, setIsCombatActive] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [combatLog] = useState<CombatLogEntry[]>(initialCombatLog);

    const bench = useMemo<(InventoryItem | null)[]>(() => new Array(8).fill(null), []);

    const turnQueue = useMemo(
        () => [
            { id: 'rogue-hero', isFriendly: true, name: 'Hero', currentInitiative: 14, stats: defaultStats },
            { id: 'rogue-enemy', isFriendly: false, name: 'Enemy', currentInitiative: 10, stats: defaultStats },
        ],
        []
    );

    return (
        <div className="w-full h-full relative" onClick={() => {}}>
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_45%,_#020617_100%)]" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
                    Roguelike Scene Preview
                </div>
            </div>

            <GameHUD
                activeScene="combat"
                currentBiome={{ name: 'Roguelike Arena', color: '#f97316' }}
                playerRotation={0}
                inventory={[]}
                bench={bench}
                selectedSlot={0}
                onSelectSlot={() => {}}
                selectedUnit={null}
                interactionText={null}
                interactionProgress={null}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                isCombatActive={isCombatActive}
                setIsCombatActive={setIsCombatActive}
                stats={defaultStats}
                isFemale={false}
                combatLog={combatLog}
                onOpenTravel={() => {}}
                onToggleBestiary={() => {}}
                onEndTurn={() => {}}
                onWaitTurn={() => {}}
                onDefend={() => {}}
                isPlayerTurn={true}
            />

            {isCombatActive && <TurnIndicatorUI queue={turnQueue} currentUnitId="rogue-hero" phase="player" />}

            <UnitStatsTooltip
                visible={false}
                stats={undefined}
                unitName={undefined}
                x={0}
                y={0}
            />
        </div>
    );
};

export default RoguelikeScene;
