import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { useEconomyLogic } from '../useEconomyLogic';
import { InventoryItem } from '../../types';

describe('useEconomyLogic', () => {
  const setupHook = (initialInventory: (InventoryItem | null)[], initialCoins: number) => {
    return renderHook(() => {
      const [inventory, setInventory] = useState<(InventoryItem | null)[]>(initialInventory);
      const [coins, setCoins] = useState(initialCoins);
      const economy = useEconomyLogic({ inventory, setInventory, coins, setCoins });
      return { inventory, coins, ...economy };
    });
  };

  it('handles buying and selling items with coin updates', () => {
    const { result } = setupHook([null, null], 10);

    act(() => {
      result.current.handleBuy('Potion', 5);
    });

    expect(result.current.inventory[0]).toEqual({ name: 'Potion', count: 1 });
    expect(result.current.coins).toBe(5);

    act(() => {
      result.current.handleSell(0, 5);
    });

    expect(result.current.inventory[0]).toBeNull();
    expect(result.current.coins).toBe(10);
  });

  it('prevents purchases that would push coins negative (regression)', () => {
    const { result } = setupHook([null], 2);

    act(() => {
      result.current.handleBuy('Elixir', 5);
    });

    expect(result.current.inventory[0]).toBeNull();
    expect(result.current.coins).toBe(2);
  });
});
