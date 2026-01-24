import { useState, useCallback } from 'react';
import { CombatLogEntry } from '../components/ui/hud/CombatLog';

export function useCombatState() {
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);

  const addCombatLog = useCallback((text: string, type: CombatLogEntry['type'] = 'info') => {
      setCombatLog(prev => [
          ...prev.slice(-20),
          { id: Math.random().toString(36).substr(2, 9), text, type, timestamp: Date.now() }
      ]);
  }, []);

  return {
    isCombatActive,
    setIsCombatActive,
    combatLog,
    setCombatLog,
    addCombatLog
  };
}
