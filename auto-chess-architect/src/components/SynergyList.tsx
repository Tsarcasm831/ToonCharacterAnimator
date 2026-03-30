import { useGameStore } from '../store/useGameStore';
import { TRAIT_EFFECTS } from '../constants';
import { motion } from 'motion/react';

import { memo } from 'react';

export const SynergyList = memo(function SynergyList() {
  const activeSynergies = useGameStore(state => state.activeSynergies);

  if (activeSynergies.length === 0) return null;

  return (
    <div className="fixed left-80 top-24 ml-6 w-64 flex flex-col gap-3 z-40">
      <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2">Active Traits</h3>
      {activeSynergies.map((synergy) => {
        const effectDef = TRAIT_EFFECTS[synergy.trait];
        const isActive = synergy.activeThreshold !== null;
        
        return (
          <motion.div 
            key={synergy.trait}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
              isActive 
                ? 'bg-neutral-900/80 border-neutral-700 shadow-lg' 
                : 'bg-neutral-900/40 border-neutral-800/50 grayscale opacity-70'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {synergy.count}
                </div>
                <span className={`font-bold ${isActive ? 'text-neutral-100' : 'text-neutral-400'}`}>
                  {synergy.trait}
                </span>
              </div>
            </div>
            
            <div className="flex gap-1 mb-2">
              {effectDef.thresholds.map((t, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full ${
                    synergy.count >= t.count 
                      ? 'bg-blue-500' 
                      : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>

            <div className="text-[10px] text-neutral-400 leading-tight">
              {effectDef.thresholds.map((t, i) => (
                <div key={i} className={synergy.activeThreshold === t.count ? 'text-blue-400 font-bold' : ''}>
                  <span className="opacity-50 mr-1">{t.count}</span>
                  {t.effect}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
