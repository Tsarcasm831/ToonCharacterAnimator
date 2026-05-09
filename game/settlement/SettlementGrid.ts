import type {
  BuildingType,
  GridCell,
  GridPosition,
  ResourceNode,
  ResourceNodeType,
  SettlementBuilding,
} from './SettlementTypes';

export class SettlementGrid {
  static readonly DEFAULT_SIZE = 32;

  static createCells(width = SettlementGrid.DEFAULT_SIZE, height = SettlementGrid.DEFAULT_SIZE): GridCell[] {
    const cells: GridCell[] = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        cells.push({ x, y, stockpile: false });
      }
    }
    return cells;
  }

  static createResourceNodes(): ResourceNode[] {
    const nodes: Array<Omit<ResourceNode, 'id' | 'designated' | 'depleted'>> = [
      { type: 'tree', x: 6, y: 6, amount: 5 },
      { type: 'tree', x: 8, y: 9, amount: 5 },
      { type: 'tree', x: 22, y: 8, amount: 5 },
      { type: 'tree', x: 25, y: 18, amount: 5 },
      { type: 'tree', x: 11, y: 24, amount: 5 },
      { type: 'rock', x: 18, y: 5, amount: 4 },
      { type: 'rock', x: 23, y: 12, amount: 4 },
      { type: 'rock', x: 7, y: 21, amount: 4 },
      { type: 'food', x: 13, y: 11, amount: 3 },
      { type: 'food', x: 20, y: 22, amount: 3 },
    ];

    return nodes.map((node, index) => ({
      ...node,
      id: `node-${index + 1}`,
      designated: false,
      depleted: false,
    }));
  }

  static getCell(cells: GridCell[], width: number, x: number, y: number): GridCell | undefined {
    return cells[y * width + x];
  }

  static inBounds(width: number, height: number, x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < width && y < height;
  }

  static sameCell(a: GridPosition, b: GridPosition): boolean {
    return a.x === b.x && a.y === b.y;
  }

  static isOccupiedByNode(nodes: ResourceNode[], x: number, y: number): boolean {
    return nodes.some((node) => !node.depleted && node.x === x && node.y === y);
  }

  static getNodeAt(nodes: ResourceNode[], x: number, y: number, type?: ResourceNodeType): ResourceNode | undefined {
    return nodes.find((node) => !node.depleted && node.x === x && node.y === y && (!type || node.type === type));
  }

  static getBuildingAt(buildings: SettlementBuilding[], x: number, y: number): SettlementBuilding | undefined {
    return buildings.find((building) => building.x === x && building.y === y);
  }

  static canPlaceBuilding(
    width: number,
    height: number,
    cells: GridCell[],
    nodes: ResourceNode[],
    buildings: SettlementBuilding[],
    type: BuildingType,
    x: number,
    y: number,
  ): { ok: boolean; reason?: string } {
    if (!SettlementGrid.inBounds(width, height, x, y)) return { ok: false, reason: 'outside the map' };
    if (SettlementGrid.isOccupiedByNode(nodes, x, y)) return { ok: false, reason: 'resource node blocks that tile' };
    if (SettlementGrid.getBuildingAt(buildings, x, y)) return { ok: false, reason: 'tile already has a structure' };
    const cell = SettlementGrid.getCell(cells, width, x, y);
    if (!cell) return { ok: false, reason: 'invalid tile' };
    if (type === 'stockpile' && cell.stockpile) return { ok: false, reason: 'stockpile already exists there' };
    return { ok: true };
  }

  static nearestStockpile(cells: GridCell[], from: GridPosition): GridPosition | null {
    let best: GridPosition | null = null;
    let bestDistance = Infinity;
    cells.forEach((cell) => {
      if (!cell.stockpile) return;
      const distance = Math.abs(cell.x - from.x) + Math.abs(cell.y - from.y);
      if (distance < bestDistance) {
        best = { x: cell.x, y: cell.y };
        bestDistance = distance;
      }
    });
    return best;
  }
}
