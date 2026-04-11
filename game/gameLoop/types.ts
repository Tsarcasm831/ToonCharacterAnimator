import { EntityStats } from '../../types';

export type GameLoopPhase =
    | 'town'
    | 'missionSelection'
    | 'dungeonExploration'
    | 'camp'
    | 'expeditionRewards';

export type MissionObjectiveType = 'explore' | 'eliminateBoss' | 'collectRelic';

export type DungeonRoomType =
    | 'start'
    | 'combat'
    | 'treasure'
    | 'trap'
    | 'event'
    | 'camp'
    | 'boss';

export interface Quirk {
    id: string;
    name: string;
    description: string;
    isPositive: boolean;
}

export interface Affliction {
    id: string;
    name: string;
    description: string;
    stressModifier: number;
    skipTurnChance: number;
}

export interface Virtue {
    id: string;
    name: string;
    description: string;
    stressResistBonus: number;
}

export interface Hero {
    id: string;
    name: string;
    classId: string;
    level: number;
    xp: number;
    stats: EntityStats;
    stress: number;
    quirks: Quirk[];
    affliction?: Affliction;
    virtue?: Virtue;
    abilities: string[];
    available: boolean;
    isDead: boolean;
}

export interface Resources {
    gold: number;
    heirlooms: number;
    supplyChests: number;
}

export interface Reward {
    gold?: number;
    heirlooms?: number;
    supplyChests?: number;
}

export interface DungeonRoom {
    id: string;
    type: DungeonRoomType;
    visited: boolean;
    depth: number;
    enemyPool?: string[];
    reward?: Reward;
    eventId?: string;
    connectedRoomIds: string[];
}

export interface DungeonLayout {
    id: string;
    theme: string;
    rooms: DungeonRoom[];
    startRoomId: string;
    bossRoomId: string;
}

export interface MissionDefinition {
    id: string;
    title: string;
    dungeonTheme: string;
    objective: MissionObjectiveType;
    difficulty: number;
    expectedRewards: Reward;
}

export interface ActiveMission {
    mission: MissionDefinition;
    dungeon: DungeonLayout;
    completed: boolean;
}

export interface EventChoiceOutcome {
    stressDelta?: number;
    reward?: Reward;
    afflictionId?: string;
}

export interface EventChoice {
    id: string;
    text: string;
    outcome: EventChoiceOutcome;
}

export interface EventDefinition {
    id: string;
    description: string;
    choices: EventChoice[];
}

export interface RunState {
    seed: number;
    day: number;
    difficulty: number;
    phase: GameLoopPhase;
    resources: Resources;
    roster: Hero[];
    partyHeroIds: string[];
    missionPool: MissionDefinition[];
    activeMission?: ActiveMission;
}

export interface StressResult {
    reachedResolveCheck: boolean;
    reachedHeartAttack: boolean;
}
