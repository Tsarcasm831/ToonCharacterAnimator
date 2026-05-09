import type { SettlementSaveData, SettlementState } from './SettlementTypes';

const SAVE_KEY = 'tca-settlement-loop-v1';

export class SettlementSaveSystem {
  static save(state: SettlementState): void {
    const payload: SettlementSaveData = {
      version: state.version,
      width: state.width,
      height: state.height,
      cells: state.cells,
      resources: state.resources,
      resourceNodes: state.resourceNodes,
      buildings: state.buildings,
      jobs: state.jobs,
      settlers: state.settlers,
      logs: state.logs,
      elapsed: state.elapsed,
      threat: state.threat,
      threatSpawned: state.threatSpawned,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }

  static load(): SettlementSaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SettlementSaveData;
      if (!parsed || parsed.version !== 1) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  static clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
