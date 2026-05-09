import type { ResourceCost, ResourceTotals, SettlementResource } from './SettlementTypes';

export class ResourceLedger {
  static createInitial(): ResourceTotals {
    return { wood: 8, stone: 4, food: 12 };
  }

  static canAfford(resources: ResourceTotals, cost: ResourceCost = {}): boolean {
    return (Object.entries(cost) as [SettlementResource, number][])
      .every(([resource, amount]) => resources[resource] >= amount);
  }

  static spend(resources: ResourceTotals, cost: ResourceCost = {}): boolean {
    if (!this.canAfford(resources, cost)) return false;
    (Object.entries(cost) as [SettlementResource, number][]).forEach(([resource, amount]) => {
      resources[resource] -= amount;
    });
    return true;
  }

  static add(resources: ResourceTotals, resource: SettlementResource, amount: number): void {
    resources[resource] += amount;
  }

  static describeCost(cost: ResourceCost = {}): string {
    const parts = (Object.entries(cost) as [SettlementResource, number][])
      .filter(([, amount]) => amount > 0)
      .map(([resource, amount]) => `${amount} ${resource}`);
    return parts.length > 0 ? parts.join(', ') : 'no resources';
  }
}
