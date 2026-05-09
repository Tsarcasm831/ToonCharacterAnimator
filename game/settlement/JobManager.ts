import { ResourceLedger } from './ResourceLedger';
import type {
  ResourceCost,
  ResourceNode,
  Settler,
  SettlementBuilding,
  SettlementJob,
  SettlementRole,
} from './SettlementTypes';

const BUILD_COSTS: Record<'floor' | 'wall', ResourceCost> = {
  floor: { wood: 1 },
  wall: { wood: 2, stone: 1 },
};

export class JobManager {
  static getBuildCost(type: 'floor' | 'wall'): ResourceCost {
    return { ...BUILD_COSTS[type] };
  }

  static rebuildJobs(nodes: ResourceNode[], buildings: SettlementBuilding[], existingJobs: SettlementJob[] = []): SettlementJob[] {
    const jobs: SettlementJob[] = [];

    nodes.forEach((node) => {
      if (!node.designated || node.depleted) return;
      if (node.type === 'tree') jobs.push(this.createGatherJob('chop', node.id, node.x, node.y));
      if (node.type === 'rock') jobs.push(this.createGatherJob('mine', node.id, node.x, node.y));
    });

    buildings.forEach((building) => {
      if (building.status !== 'blueprint' || building.type === 'stockpile') return;
      jobs.push({
        id: `job-build-${building.id}`,
        type: 'build',
        target: { x: building.x, y: building.y },
        status: 'pending',
        requiredResources: building.requiredResources ?? {},
        workRequired: building.type === 'wall' ? 3.2 : 2,
        workDone: 0,
        buildingId: building.id,
      });
    });

    const workById = new Map(existingJobs.map((job) => [job.id, job.workDone]));
    return jobs.map((job) => ({
      ...job,
      workDone: Math.min(job.workRequired, workById.get(job.id) ?? 0),
    }));
  }

  static reserveBestJob(jobs: SettlementJob[], settler: Settler, settlers: Settler[]): SettlementJob | null {
    const candidates = jobs.filter((job) => job.status === 'pending');
    const sorted = candidates.sort((a, b) => {
      const roleScore = this.roleScore(settler.role, b) - this.roleScore(settler.role, a);
      if (roleScore !== 0) return roleScore;
      const distA = Math.abs(settler.x - a.target.x) + Math.abs(settler.y - a.target.y);
      const distB = Math.abs(settler.x - b.target.x) + Math.abs(settler.y - b.target.y);
      return distA - distB;
    });

    const busySettlerIds = new Set(settlers.map((s) => s.currentJobId).filter(Boolean));
    const job = sorted.find((candidate) => !candidate.reservedBy && !busySettlerIds.has(candidate.id));
    if (!job) return null;

    job.reservedBy = settler.id;
    job.status = 'reserved';
    job.blockedReason = undefined;
    return job;
  }

  static releaseJob(jobs: SettlementJob[], jobId: string, reason?: string): void {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    job.reservedBy = undefined;
    job.status = reason ? 'blocked' : 'pending';
    job.blockedReason = reason;
  }

  static completeJob(jobs: SettlementJob[], jobId: string): void {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    job.status = 'complete';
    job.reservedBy = undefined;
  }

  static describeJob(job?: SettlementJob): string {
    if (!job) return 'Idle';
    if (job.type === 'build') return `Build ${ResourceLedger.describeCost(job.requiredResources)}`;
    if (job.type === 'chop') return 'Chop tree';
    if (job.type === 'mine') return 'Mine rock';
    return job.type;
  }

  private static createGatherJob(type: 'chop' | 'mine', sourceId: string, x: number, y: number): SettlementJob {
    return {
      id: `job-${type}-${sourceId}`,
      type,
      target: { x, y },
      status: 'pending',
      workRequired: type === 'chop' ? 2.4 : 3,
      workDone: 0,
      sourceId,
    };
  }

  private static roleScore(role: SettlementRole, job: SettlementJob): number {
    if (role === 'Builder') return job.type === 'build' ? 100 : 35;
    if (role === 'Gatherer') return job.type === 'chop' || job.type === 'mine' ? 100 : 25;
    return job.type === 'build' ? 60 : 70;
  }
}
