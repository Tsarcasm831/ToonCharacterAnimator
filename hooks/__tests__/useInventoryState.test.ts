import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInventoryState } from '../useInventoryState';
import { InventoryItem } from '../../types';

describe('useInventoryState', () => {
  it('allows adding and removing items in the inventory', () => {
    const { result } = renderHook(() => useInventoryState());

    act(() => {
      const nextInventory = [...result.current.inventory];
      nextInventory[5] = { name: 'Test Item', count: 1 };
      result.current.setInventory(nextInventory);
    });

    expect(result.current.inventory[5]).toEqual({ name: 'Test Item', count: 1 });

    act(() => {
      const nextInventory = [...result.current.inventory];
      nextInventory[5] = null;
      result.current.setInventory(nextInventory);
    });

    expect(result.current.inventory[5]).toBeNull();
  });

  it('preserves inventory size when removing the final item (regression)', () => {
    const { result } = renderHook(() => useInventoryState());
    const emptyInventory: (InventoryItem | null)[] = Array(60).fill(null);
    emptyInventory[59] = { name: 'Last Item', count: 1 };

    act(() => {
      result.current.setInventory(emptyInventory);
    });

    act(() => {
      const nextInventory = [...result.current.inventory];
      nextInventory[59] = null;
      result.current.setInventory(nextInventory);
    });

    expect(result.current.inventory).toHaveLength(60);
    expect(result.current.inventory[59]).toBeNull();
  });
});
