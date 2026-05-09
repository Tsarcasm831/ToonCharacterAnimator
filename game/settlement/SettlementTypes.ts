export type SettlementResource = 'wood' | 'stone' | 'food';
export type SettlementRole = 'Builder' | 'Hauler' | 'Gatherer';
export type SettlementTool = 'select' | 'stockpile' | 'floor' | 'wall' | 'chop' | 'mine';
export type BuildingType = 'floor' | 'wall' | 'stockpile';
export type BuildingStatus = 'blueprint' | 'complete';
export type ResourceNodeType = 'tree' | 'rock' | 'food';
export type JobType = 'chop' | 'mine' | 'build';
export type JobStatus = 'pending' | 'reserved' | 'active' | 'blocked' | 'complete';
export type ThreatStatus = 'waiting' | 'approaching' | 'resolved';

export interface GridCell {
  x: number;
  y: number;
  stockpile: boolean;
  buildingId?: string;
}

export interface GridPosition {
  x: number;
  y: number;
}

export type ResourceTotals = Record<SettlementResource, number>;

export interface ResourceCost {
  wood?: number;
  stone?: number;
  food?: number;
}

export interface ResourceNode {
  id: string;
  type: ResourceNodeType;
  x: number;
  y: number;
  amount: number;
  designated: boolean;
  depleted: boolean;
}

export interface SettlementBuilding {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  status: BuildingStatus;
  requiredResources?: ResourceCost;
}

export interface SettlementJob {
  id: string;
  type: JobType;
  target: GridPosition;
  status: JobStatus;
  reservedBy?: string;
  requiredResources?: ResourceCost;
  workRequired: number;
  workDone: number;
  sourceId?: string;
  buildingId?: string;
  blockedReason?: string;
}

export interface CarriedResource {
  type: SettlementResource;
  amount: number;
}

export interface Settler {
  id: string;
  name: string;
  role: SettlementRole;
  x: number;
  y: number;
  target?: GridPosition;
  status: string;
  currentJobId?: string;
  carrying?: CarriedResource;
  health: number;
}

export interface Threat {
  id: string;
  type: 'wolf';
  x: number;
  y: number;
  status: ThreatStatus;
  targetSettlerId?: string;
  timer: number;
  health: number;
}

export interface EventLogEntry {
  id: string;
  text: string;
  time: number;
}

export interface SettlementState {
  version: number;
  width: number;
  height: number;
  cells: GridCell[];
  resources: ResourceTotals;
  resourceNodes: ResourceNode[];
  buildings: SettlementBuilding[];
  jobs: SettlementJob[];
  settlers: Settler[];
  selectedTool: SettlementTool;
  speed: number;
  paused: boolean;
  logs: EventLogEntry[];
  elapsed: number;
  threat?: Threat;
  threatSpawned: boolean;
}

export interface SettlementDebugInfo {
  totalJobs: number;
  reservedJobs: number;
  activeJobs: number;
  blockedJobs: number;
  idleSettlers: number;
  selectedTool: SettlementTool;
}

export interface SettlementSnapshot {
  state: SettlementState;
  debug: SettlementDebugInfo;
}

export type SettlementSaveData = Omit<SettlementState, 'selectedTool' | 'paused' | 'speed'>;
