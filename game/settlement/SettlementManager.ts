import { JobManager } from './JobManager';
import { ResourceLedger } from './ResourceLedger';
import { SettlementGrid } from './SettlementGrid';
import { SettlementSaveSystem } from './SettlementSaveSystem';
import { SettlerManager } from './SettlerManager';
import type {
  BuildingType,
  EventLogEntry,
  SettlementBuilding,
  SettlementDebugInfo,
  SettlementSaveData,
  SettlementSnapshot,
  SettlementState,
  SettlementTool,
  Threat,
} from './SettlementTypes';

type Listener = (snapshot: SettlementSnapshot) => void;

export class SettlementManager {
  private state: SettlementState;
  private listeners = new Set<Listener>();
  private logCounter = 0;
  private idCounter = 0;

  constructor() {
    this.state = this.createFreshState();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): SettlementSnapshot {
    return {
      state: this.state,
      debug: this.getDebugInfo(),
    };
  }

  getState(): SettlementState {
    return this.state;
  }

  tick(dt: number): void {
    if (this.state.paused) return;
    const scaledDt = dt * this.state.speed;
    this.state.elapsed += scaledDt;

    SettlerManager.updateSettlers(this.state, scaledDt, (message) => this.addLog(message));
    this.cleanupCompletedJobs();
    this.updateThreat(scaledDt);
    this.emit();
  }

  setTool(tool: SettlementTool): void {
    this.state.selectedTool = tool;
    this.addLog(`Tool selected: ${tool}.`);
    this.emit();
  }

  setSpeed(speed: number): void {
    this.state.speed = speed;
    this.state.paused = speed === 0;
    this.addLog(speed === 0 ? 'Simulation paused.' : `Simulation speed set to ${speed}x.`);
    this.emit();
  }

  handleCellAction(x: number, y: number): void {
    const tool = this.state.selectedTool;
    if (tool === 'select') return;
    if (tool === 'stockpile') this.placeStockpile(x, y);
    if (tool === 'floor') this.placeBlueprint('floor', x, y);
    if (tool === 'wall') this.placeBlueprint('wall', x, y);
    if (tool === 'chop') this.designateNode('tree', x, y);
    if (tool === 'mine') this.designateNode('rock', x, y);
    this.rebuildJobs();
    this.emit();
  }

  save(): void {
    SettlementSaveSystem.save(this.state);
    this.addLog('Settlement saved locally.');
    this.emit();
  }

  load(): void {
    const data = SettlementSaveSystem.load();
    if (!data) {
      this.addLog('No local settlement save found.');
      this.emit();
      return;
    }
    this.state = this.hydrateSave(data);
    this.rebuildJobs();
    this.addLog('Settlement loaded from local save.');
    this.emit();
  }

  reset(): void {
    SettlementSaveSystem.clear();
    this.state = this.createFreshState();
    this.addLog('Settlement reset.');
    this.emit();
  }

  private createFreshState(): SettlementState {
    const width = SettlementGrid.DEFAULT_SIZE;
    const height = SettlementGrid.DEFAULT_SIZE;
    return {
      version: 1,
      width,
      height,
      cells: SettlementGrid.createCells(width, height),
      resources: ResourceLedger.createInitial(),
      resourceNodes: SettlementGrid.createResourceNodes(),
      buildings: [],
      jobs: [],
      settlers: SettlerManager.createInitialSettlers(),
      selectedTool: 'stockpile',
      speed: 1,
      paused: false,
      logs: [],
      elapsed: 0,
      threatSpawned: false,
    };
  }

  private hydrateSave(data: SettlementSaveData): SettlementState {
    return {
      ...data,
      selectedTool: 'stockpile',
      speed: 1,
      paused: false,
      logs: data.logs?.slice(-40) ?? [],
    };
  }

  private placeStockpile(x: number, y: number): void {
    const result = SettlementGrid.canPlaceBuilding(
      this.state.width,
      this.state.height,
      this.state.cells,
      this.state.resourceNodes,
      this.state.buildings,
      'stockpile',
      x,
      y,
    );
    if (!result.ok) {
      this.addLog(`Cannot place stockpile: ${result.reason}.`);
      return;
    }
    const cell = SettlementGrid.getCell(this.state.cells, this.state.width, x, y);
    if (!cell) return;
    cell.stockpile = true;
    this.addLog(`Stockpile placed at ${x},${y}.`);
  }

  private placeBlueprint(type: Exclude<BuildingType, 'stockpile'>, x: number, y: number): void {
    const result = SettlementGrid.canPlaceBuilding(
      this.state.width,
      this.state.height,
      this.state.cells,
      this.state.resourceNodes,
      this.state.buildings,
      type,
      x,
      y,
    );
    if (!result.ok) {
      this.addLog(`Cannot place ${type}: ${result.reason}.`);
      return;
    }

    const building: SettlementBuilding = {
      id: this.nextId('building'),
      type,
      x,
      y,
      status: 'blueprint',
      requiredResources: JobManager.getBuildCost(type),
    };
    this.state.buildings.push(building);
    this.addLog(`${type === 'wall' ? 'Wall' : 'Floor'} blueprint placed at ${x},${y}.`);
  }

  private designateNode(type: 'tree' | 'rock', x: number, y: number): void {
    const node = SettlementGrid.getNodeAt(this.state.resourceNodes, x, y, type);
    if (!node) {
      this.addLog(type === 'tree' ? 'No tree on that tile.' : 'No rock on that tile.');
      return;
    }
    if (node.designated) {
      this.addLog(`${type === 'tree' ? 'Tree' : 'Rock'} is already designated.`);
      return;
    }
    node.designated = true;
    this.addLog(`${type === 'tree' ? 'Tree marked for chopping' : 'Rock marked for mining'} at ${x},${y}.`);
  }

  private rebuildJobs(): void {
    this.state.jobs = JobManager.rebuildJobs(this.state.resourceNodes, this.state.buildings, this.state.jobs)
      .filter((job) => job.status !== 'complete');
  }

  private cleanupCompletedJobs(): void {
    this.state.jobs = this.state.jobs.filter((job) => job.status !== 'complete');
  }

  private updateThreat(dt: number): void {
    if (!this.state.threatSpawned && this.state.elapsed >= 75) {
      this.state.threat = this.createThreat();
      this.state.threatSpawned = true;
      this.addLog('A hungry wolf is approaching from the ruins.');
    }

    const threat = this.state.threat;
    if (!threat || threat.status !== 'approaching') return;

    const target = this.findThreatTarget(threat);
    if (!target) return;

    const dx = target.x - threat.x;
    const dy = target.y - threat.y;
    const distance = Math.hypot(dx, dy);
    const step = 1.8 * dt;
    if (distance <= 1.2) {
      threat.timer += dt;
      if (threat.timer > 3.5) {
        const defenderCount = this.state.settlers.filter((settler) => settler.health > 0).length;
        if (defenderCount >= 2) {
          threat.status = 'resolved';
          this.addLog('The settlers drove the wolf off with tools and torches.');
        } else {
          const settler = this.state.settlers.find((item) => item.health > 0);
          if (settler) {
            settler.health = Math.max(0, settler.health - 25);
            this.addLog(`${settler.name} was hurt before the wolf fled.`);
          }
          threat.status = 'resolved';
        }
      }
      return;
    }

    threat.x += (dx / distance) * step;
    threat.y += (dy / distance) * step;
  }

  private createThreat(): Threat {
    return {
      id: this.nextId('threat'),
      type: 'wolf',
      x: 0,
      y: Math.floor(this.state.height * 0.5),
      status: 'approaching',
      timer: 0,
      health: 10,
    };
  }

  private findThreatTarget(threat: Threat): { x: number; y: number } | null {
    const stockpile = SettlementGrid.nearestStockpile(this.state.cells, threat);
    const livingSettlers = this.state.settlers.filter((settler) => settler.health > 0);
    if (livingSettlers.length === 0) return stockpile;

    let best = livingSettlers[0];
    let bestDistance = Infinity;
    livingSettlers.forEach((settler) => {
      const distance = Math.abs(threat.x - settler.x) + Math.abs(threat.y - settler.y);
      if (distance < bestDistance) {
        best = settler;
        bestDistance = distance;
      }
    });
    return best ?? stockpile;
  }

  private getDebugInfo(): SettlementDebugInfo {
    const jobs = this.state.jobs.filter((job) => job.status !== 'complete');
    return {
      totalJobs: jobs.length,
      reservedJobs: jobs.filter((job) => !!job.reservedBy).length,
      activeJobs: jobs.filter((job) => job.status === 'active').length,
      blockedJobs: jobs.filter((job) => job.status === 'blocked').length,
      idleSettlers: this.state.settlers.filter((settler) => !settler.currentJobId && !settler.carrying).length,
      selectedTool: this.state.selectedTool,
    };
  }

  private addLog(text: string): void {
    const entry: EventLogEntry = {
      id: `log-${this.logCounter += 1}`,
      text,
      time: Math.round(this.state.elapsed),
    };
    this.state.logs = [entry, ...this.state.logs].slice(0, 40);
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private nextId(prefix: string): string {
    this.idCounter += 1;
    return `${prefix}-${Date.now()}-${this.idCounter}`;
  }
}
