import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCombatState } from '../useCombatState';

describe('useCombatState', () => {
  it('tracks combat activation and log entries', () => {
    const { result } = renderHook(() => useCombatState());

    expect(result.current.isCombatActive).toBe(false);
    expect(result.current.combatLog).toHaveLength(0);

    act(() => {
      result.current.setIsCombatActive(true);
      result.current.addCombatLog('Enemy spotted', 'info');
    });

    expect(result.current.isCombatActive).toBe(true);
    expect(result.current.combatLog).toHaveLength(1);
    expect(result.current.combatLog[0].text).toBe('Enemy spotted');
    expect(result.current.combatLog[0].type).toBe('info');
  });

  it('keeps the most recent combat log entries when over capacity (regression)', () => {
    const { result } = renderHook(() => useCombatState());

    act(() => {
      for (let i = 0; i < 30; i += 1) {
        result.current.addCombatLog(`Entry ${i}`);
      }
    });

    expect(result.current.combatLog).toHaveLength(21);
    expect(result.current.combatLog[20].text).toBe('Entry 29');
  });
});
