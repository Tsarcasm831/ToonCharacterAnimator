import { JobManager } from './JobManager';
import { ResourceLedger } from './ResourceLedger';
import { SettlementGrid } from './SettlementGrid';
import type {
  GridPosition,
  ResourceNode,
  Settler,
  SettlementBuilding,
  SettlementJob,
  SettlementState,
} from './SettlementTypes';

type LogFn = (message: string) => void;

export class SettlerManager {
  static createInitialSettlers(): Settler[] {
    return [
      { id: 'settler-anton', name: 'Anton Jr.', role: 'Builder', x: 15, y: 16, status: 'Idle', health: 100 },
      { id: 'settler-mara', name: 'Mara Vale', role: 'Hauler', x: 16, y: 16, status: 'Idle', health: 100 },
      { id: 'settler-toma', name: 'Toma Reed', role: 'Gatherer', x: 17, y: 16, status: 'Idle', health: 100 },
    ];
  }

  static updateSettlers(state: SettlementState, dt: number, log: LogFn): void {
    this.unblockAffordableBuildJobs(state);

    state.settlers.forEach((settler) => {
      if (settler.health <= 0) {
        settler.status = 'Injured';
        return;
      }

      if (settler.carrying) {
        this.updateCarryingSettler(state, settler, dt, log);
        return;
      }

      const currentJob = state.jobs.find((job) => job.id === settler.currentJobId);
      if (currentJob) {
        this.updateJobSettler(state, settler, currentJob, dt, log);
        return;
      }

      const nextJob = JobManager.reserveBestJob(state.jobs, settler, state.settlers);
      if (nextJob) {
        settler.currentJobId = nextJob.id;
        settler.status = `Reserved: ${JobManager.describeJob(nextJob)}`;
        log(`${settler.name} reserved ${nextJob.type} at ${nextJob.target.x},${nextJob.target.y}.`);
      } else {
        settler.status = this.getIdleReason(state);
      }
    });
  }

  private static updateCarryingSettler(state: SettlementState, settler: Settler, dt: number, log: LogFn): void {
    const stockpile = SettlementGrid.nearestStockpile(state.cells, settler);
    if (!stockpile) {
      settler.status = `Carrying ${settler.carrying?.type}; needs stockpile`;
      return;
    }

    settler.status = `Hauling ${settler.carrying.amount} ${settler.carrying.type}`;
    if (this.moveToward(settler, stockpile, dt)) {
      ResourceLedger.add(state.resources, settler.carrying.type, settler.carrying.amount);
      log(`${settler.name} deposited ${settler.carrying.amount} ${settler.carrying.type}.`);
      settler.carrying = undefined;
      settler.status = 'Idle';
    }
  }

  private static updateJobSettler(
    state: SettlementState,
    settler: Settler,
    job: SettlementJob,
    dt: number,
    log: LogFn,
  ): void {
    if (job.status === 'complete') {
      settler.currentJobId = undefined;
      settler.status = 'Idle';
      return;
    }

    if (job.type === 'build' && job.status === 'reserved') {
      if (!ResourceLedger.spend(state.resources, job.requiredResources)) {
        const reason = `Missing ${ResourceLedger.describeCost(job.requiredResources)}`;
        log(`${settler.name} cannot build at ${job.target.x},${job.target.y}: ${reason}.`);
        JobManager.releaseJob(state.jobs, job.id, reason);
        settler.currentJobId = undefined;
        settler.status = reason;
        return;
      }
      log(`${settler.name} started construction at ${job.target.x},${job.target.y}.`);
    }

    if (!this.isAdjacentOrSame(settler, job.target)) {
      settler.status = `Moving to ${job.type}`;
      this.moveToward(settler, job.target, dt);
      return;
    }

    job.status = 'active';
    settler.status = `${JobManager.describeJob(job)} (${Math.ceil(job.workRequired - job.workDone)}s)`;
    job.workDone += dt;

    if (job.workDone < job.workRequired) return;

    if (job.type === 'chop' || job.type === 'mine') {
      this.completeGatherJob(state, settler, job, log);
      return;
    }

    this.completeBuildJob(state.buildings, settler, job, log);
    JobManager.completeJob(state.jobs, job.id);
    settler.currentJobId = undefined;
    settler.status = 'Idle';
  }

  private static completeGatherJob(state: SettlementState, settler: Settler, job: SettlementJob, log: LogFn): void {
    const node = state.resourceNodes.find((item) => item.id === job.sourceId);
    if (!node || node.depleted) {
      JobManager.completeJob(state.jobs, job.id);
      settler.currentJobId = undefined;
      return;
    }

    node.depleted = true;
    node.designated = false;
    const resource = node.type === 'rock' ? 'stone' : 'wood';
    const amount = node.amount;
    settler.carrying = { type: resource, amount };
    settler.currentJobId = undefined;
    JobManager.completeJob(state.jobs, job.id);
    log(`${settler.name} gathered ${amount} ${resource}.`);
  }

  private static completeBuildJob(buildings: SettlementBuilding[], settler: Settler, job: SettlementJob, log: LogFn): void {
    const building = buildings.find((item) => item.id === job.buildingId);
    if (building) {
      building.status = 'complete';
      log(`${building.type === 'wall' ? 'Wall' : 'Floor'} completed by ${settler.name}.`);
    }
  }

  private static moveToward(settler: Settler, target: GridPosition, dt: number): boolean {
    const speed = 3.4;
    const step = speed * dt;
    const dx = target.x - settler.x;
    const dy = target.y - settler.y;
    const distance = Math.hypot(dx, dy);
    settler.target = target;

    if (distance <= step || distance < 0.05) {
      settler.x = target.x;
      settler.y = target.y;
      settler.target = undefined;
      return true;
    }

    settler.x += (dx / distance) * step;
    settler.y += (dy / distance) * step;
    return false;
  }

  private static isAdjacentOrSame(settler: Settler, target: GridPosition): boolean {
    return Math.abs(settler.x - target.x) + Math.abs(settler.y - target.y) <= 1.2;
  }

  private static getIdleReason(state: SettlementState): string {
    const openJobs = state.jobs.filter((job) => job.status !== 'complete');
    if (openJobs.length === 0) return 'Idle: no jobs';
    const blocked = openJobs.find((job) => job.status === 'blocked' && job.blockedReason);
    if (blocked) return `Idle: ${blocked.blockedReason}`;
    return 'Idle: jobs reserved';
  }

  private static unblockAffordableBuildJobs(state: SettlementState): void {
    state.jobs.forEach((job) => {
      if (job.status !== 'blocked' || job.type !== 'build') return;
      if (!ResourceLedger.canAfford(state.resources, job.requiredResources)) return;
      job.status = 'pending';
      job.blockedReason = undefined;
    });
  }
}
