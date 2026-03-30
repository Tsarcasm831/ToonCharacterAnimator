/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { GameState, Unit, Phase, ActiveSynergy } from '../types';
import { BOARD_SIZE, BENCH_SIZE, SHOP_SIZE, UNITS_DATABASE, LEVEL_PROBABILITIES, XP_TO_LEVEL, TRAIT_EFFECTS } from '../constants';

function calculateSynergies(board: (Unit | null)[][]): ActiveSynergy[] {
  const uniqueUnits = new Set<string>();
  const traitCounts: Record<string, number> = {};

  board.forEach(row => {
    row.forEach(unit => {
      if (unit && unit.owner === 'player') {
        if (!uniqueUnits.has(unit.name)) {
          uniqueUnits.add(unit.name);
          unit.traits.forEach(trait => {
            traitCounts[trait] = (traitCounts[trait] || 0) + 1;
          });
        }
      }
    });
  });

  const result: ActiveSynergy[] = [];
  for (const [trait, count] of Object.entries(traitCounts)) {
    const effectDef = TRAIT_EFFECTS[trait];
    if (!effectDef) continue;

    let activeThreshold: number | null = null;
    let nextThreshold: number | null = null;

    for (const t of effectDef.thresholds) {
      if (count >= t.count) {
        activeThreshold = t.count;
      } else if (nextThreshold === null) {
        nextThreshold = t.count;
      }
    }

    result.push({ trait, count, activeThreshold, nextThreshold });
  }

  return result.sort((a, b) => {
    if (a.activeThreshold !== b.activeThreshold) {
      return (b.activeThreshold || 0) - (a.activeThreshold || 0);
    }
    return b.count - a.count;
  });
}

function autoCombine(board: (Unit | null)[][], bench: (Unit | null)[]): { board: (Unit | null)[][], bench: (Unit | null)[], combined: boolean } {
  let combined = false;
  let newBoard = board.map(row => [...row]);
  let newBench = [...bench];

  const playerUnits: { unit: Unit, location: 'board' | 'bench', x?: number, y?: number, index?: number }[] = [];
  
  newBoard.forEach((row, y) => {
    row.forEach((unit, x) => {
      if (unit && unit.owner === 'player') {
        playerUnits.push({ unit, location: 'board', x, y });
      }
    });
  });
  
  newBench.forEach((unit, index) => {
    if (unit && unit.owner === 'player') {
      playerUnits.push({ unit, location: 'bench', index });
    }
  });

  const groups: Record<string, typeof playerUnits> = {};
  playerUnits.forEach(p => {
    const key = `${p.unit.name}-${p.unit.starLevel}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  for (const key in groups) {
    const group = groups[key];
    if (group.length >= 3 && group[0].unit.starLevel < 3) {
      const toCombine = group.slice(0, 3);
      
      let targetLocation = toCombine[0];
      for (const p of toCombine) {
        if (p.location === 'board') {
          targetLocation = p;
          break;
        }
      }

      toCombine.forEach(p => {
        if (p.location === 'board') {
          newBoard[p.y!][p.x!] = null;
        } else {
          newBench[p.index!] = null;
        }
      });

      const baseUnit = toCombine[0].unit;
      const upgradedUnit: Unit = {
        ...baseUnit,
        id: Math.random().toString(36).substr(2, 9),
        starLevel: baseUnit.starLevel + 1,
        hp: baseUnit.maxHp * 2, // Heal to full on combine
        maxHp: baseUnit.maxHp * 2,
        ad: baseUnit.ad * 2,
      };

      if (targetLocation.location === 'board') {
        upgradedUnit.position = { x: targetLocation.x!, y: targetLocation.y! };
        upgradedUnit.benchIndex = null;
        newBoard[targetLocation.y!][targetLocation.x!] = upgradedUnit;
      } else {
        upgradedUnit.position = null;
        upgradedUnit.benchIndex = targetLocation.index!;
        newBench[targetLocation.index!] = upgradedUnit;
      }

      combined = true;
      break;
    }
  }

  if (combined) {
    const next = autoCombine(newBoard, newBench);
    return { board: next.board, bench: next.bench, combined: true };
  }

  return { board: newBoard, bench: newBench, combined: false };
}

interface GameStore extends GameState {
  setPhase: (phase: Phase) => void;
  addGold: (amount: number) => void;
  buyUnit: (shopIndex: number) => void;
  moveUnitToBoard: (unitId: string, x: number, y: number) => void;
  moveUnitToBench: (unitId: string, benchIndex: number) => void;
  sellUnit: (unitId: string) => void;
  rerollShop: () => void;
  buyXP: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  playerGold: 1,
  playerLevel: 1,
  playerXP: 0,
  playerHealth: 100,
  currentPhase: 'PREP',
  roundNumber: 1,
  board: Array(BOARD_SIZE.rows).fill(null).map(() => Array(BOARD_SIZE.cols).fill(null)),
  bench: Array(BENCH_SIZE).fill(null),
  shop: Array(SHOP_SIZE).fill(null),
  activeSynergies: [],
  gameOver: false,

  setPhase: (phase) => set({ currentPhase: phase }),
  addGold: (amount) => set((state) => ({ playerGold: state.playerGold + amount })),

  resetGame: () => set({
    playerGold: 1,
    playerLevel: 1,
    playerXP: 0,
    playerHealth: 100,
    currentPhase: 'PREP',
    roundNumber: 1,
    board: Array(BOARD_SIZE.rows).fill(null).map(() => Array(BOARD_SIZE.cols).fill(null)),
    bench: Array(BENCH_SIZE).fill(null),
    shop: Array(SHOP_SIZE).fill(null),
    activeSynergies: [],
    gameOver: false,
  }),

  buyXP: () => set((state) => {
    if (state.playerGold < 4 || state.playerLevel >= 9) return state;
    let newXp = state.playerXP + 4;
    let newLevel = state.playerLevel;
    let requiredXp = XP_TO_LEVEL[newLevel];

    while (newXp >= requiredXp && newLevel < 9) {
      newXp -= requiredXp;
      newLevel++;
      requiredXp = XP_TO_LEVEL[newLevel];
    }

    return {
      playerGold: state.playerGold - 4,
      playerXP: newXp,
      playerLevel: newLevel
    };
  }),

  rerollShop: () => set((state) => {
    const odds = LEVEL_PROBABILITIES[state.playerLevel] || LEVEL_PROBABILITIES[1];
    
    const newShop = Array(SHOP_SIZE).fill(null).map(() => {
      const roll = Math.random() * 100;
      let cumulative = 0;
      let selectedTier = 1;
      
      for (let i = 0; i < odds.length; i++) {
        cumulative += odds[i];
        if (roll <= cumulative) {
          selectedTier = i + 1;
          break;
        }
      }

      const availableUnits = UNITS_DATABASE.filter(u => u.cost === selectedTier);
      const pool = availableUnits.length > 0 ? availableUnits : UNITS_DATABASE.filter(u => u.cost === 1);
      const baseUnit = pool[Math.floor(Math.random() * pool.length)];
      
      return {
        ...baseUnit,
        id: Math.random().toString(36).substr(2, 9),
        owner: 'player',
        position: null,
        benchIndex: null,
      } as Unit;
    });
    return { shop: newShop };
  }),

  buyUnit: (shopIndex) => set((state) => {
    const unit = state.shop[shopIndex];
    if (!unit || state.playerGold < unit.cost) return state;

    const firstEmptyBenchIndex = state.bench.findIndex(s => s === null);
    if (firstEmptyBenchIndex === -1) return state;

    let newBench = [...state.bench];
    newBench[firstEmptyBenchIndex] = { ...unit, benchIndex: firstEmptyBenchIndex };

    const newShop = [...state.shop];
    newShop[shopIndex] = null;

    const combineResult = autoCombine(state.board, newBench);

    return {
      playerGold: state.playerGold - unit.cost,
      bench: combineResult.bench,
      board: combineResult.board,
      shop: newShop,
      activeSynergies: combineResult.combined ? calculateSynergies(combineResult.board) : state.activeSynergies,
    };
  }),

  sellUnit: (unitId) => set((state) => {
    let unit: Unit | null = null;
    let fromBenchIndex: number | null = null;
    let fromBoardPos: { x: number, y: number } | null = null;

    state.bench.forEach((u, i) => { if (u?.id === unitId) { unit = u; fromBenchIndex = i; } });
    if (!unit) {
      state.board.forEach((row, ry) => {
        row.forEach((u, rx) => { if (u?.id === unitId) { unit = u; fromBoardPos = { x: rx, y: ry }; } });
      });
    }

    if (!unit) return state;

    const newBoard = state.board.map(row => [...row]);
    const newBench = [...state.bench];

    if (fromBenchIndex !== null) newBench[fromBenchIndex] = null;
    if (fromBoardPos !== null) newBoard[fromBoardPos.y][fromBoardPos.x] = null;

    const refund = unit.cost * Math.pow(3, unit.starLevel - 1);

    return {
      board: newBoard,
      bench: newBench,
      playerGold: state.playerGold + refund,
      activeSynergies: calculateSynergies(newBoard)
    };
  }),

  moveUnitToBoard: (unitId, x, y) => set((state) => {
    if (state.currentPhase !== 'PREP') return state;
    if (y < BOARD_SIZE.rows / 2) return state;

    let draggedUnit: Unit | null = null;
    let fromBenchIndex: number | null = null;
    let fromBoardPos: { x: number, y: number } | null = null;

    state.bench.forEach((u, i) => { if (u?.id === unitId) { draggedUnit = u; fromBenchIndex = i; } });
    if (!draggedUnit) {
      state.board.forEach((row, ry) => {
        row.forEach((u, rx) => { if (u?.id === unitId) { draggedUnit = u; fromBoardPos = { x: rx, y: ry }; } });
      });
    }

    if (!draggedUnit) return state;

    const targetUnit = state.board[y][x];

    const newBoard = state.board.map(row => [...row]);
    const newBench = [...state.bench];

    if (fromBenchIndex !== null) newBench[fromBenchIndex] = null;
    if (fromBoardPos !== null) newBoard[fromBoardPos.y][fromBoardPos.x] = null;

    newBoard[y][x] = { ...draggedUnit, position: { x, y }, benchIndex: null };

    if (targetUnit) {
      if (fromBenchIndex !== null) {
        newBench[fromBenchIndex] = { ...targetUnit, position: null, benchIndex: fromBenchIndex };
      }
      if (fromBoardPos !== null) {
        newBoard[fromBoardPos.y][fromBoardPos.x] = { ...targetUnit, position: { x: fromBoardPos.x, y: fromBoardPos.y }, benchIndex: null };
      }
    }

    return { board: newBoard, bench: newBench, activeSynergies: calculateSynergies(newBoard) };
  }),

  moveUnitToBench: (unitId, benchIndex) => set((state) => {
    if (state.currentPhase !== 'PREP') return state;

    let draggedUnit: Unit | null = null;
    let fromBenchIndex: number | null = null;
    let fromBoardPos: { x: number, y: number } | null = null;

    state.bench.forEach((u, i) => { if (u?.id === unitId) { draggedUnit = u; fromBenchIndex = i; } });
    if (!draggedUnit) {
      state.board.forEach((row, ry) => {
        row.forEach((u, rx) => { if (u?.id === unitId) { draggedUnit = u; fromBoardPos = { x: rx, y: ry }; } });
      });
    }

    if (!draggedUnit) return state;

    const targetUnit = state.bench[benchIndex];

    const newBoard = state.board.map(row => [...row]);
    const newBench = [...state.bench];

    if (fromBenchIndex !== null) newBench[fromBenchIndex] = null;
    if (fromBoardPos !== null) newBoard[fromBoardPos.y][fromBoardPos.x] = null;

    newBench[benchIndex] = { ...draggedUnit, position: null, benchIndex };

    if (targetUnit) {
      if (fromBenchIndex !== null) {
        newBench[fromBenchIndex] = { ...targetUnit, position: null, benchIndex: fromBenchIndex };
      }
      if (fromBoardPos !== null) {
        newBoard[fromBoardPos.y][fromBoardPos.x] = { ...targetUnit, position: { x: fromBoardPos.x, y: fromBoardPos.y }, benchIndex: null };
      }
    }

    return { board: newBoard, bench: newBench, activeSynergies: calculateSynergies(newBoard) };
  }),
}));
