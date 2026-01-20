import { useState } from 'react';
import { PlayerConfig, PlayerInput, DEFAULT_CONFIG } from '../types';
import { CLASS_STATS } from '../data/stats';

export function usePlayerState() {
  const [config, setConfig] = useState<PlayerConfig>({
      ...DEFAULT_CONFIG,
      stats: { ...CLASS_STATS.hero }
  });
  
  const [manualInput, setManualInput] = useState<Partial<PlayerInput>>({
    isRunning: false,
    jump: false,
    isDead: false,
    isPickingUp: false,
    interact: false,
    attack1: false,
    attack2: false
  });

  const [coins, setCoins] = useState(1250);

  return {
    config,
    setConfig,
    manualInput,
    setManualInput,
    coins,
    setCoins
  };
}
