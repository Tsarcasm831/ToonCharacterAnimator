import { useGameStore } from '../store/useGameStore';
import { LEVEL_PROBABILITIES, XP_TO_LEVEL } from '../constants';
import { Coins, Swords, Shield, Zap, ArrowUpCircle } from 'lucide-react';
import { motion } from 'motion/react';

import { memo } from 'react';

export const Shop = memo(function Shop() {
  const { shop, playerGold, playerLevel, buyUnit, rerollShop, addGold, buyXP, currentPhase } = useGameStore();
  const odds = LEVEL_PROBABILITIES[playerLevel] || LEVEL_PROBABILITIES[1];
  const isOpen = currentPhase === 'PREP';

  return (
    <aside className={`fixed left-0 top-16 bottom-0 w-80 bg-neutral-950/95 backdrop-blur-xl border-r border-neutral-800 z-40 transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Shop</span>
            <div className="text-[10px] font-mono text-neutral-500 flex gap-1">
              <span className="text-gray-400">{odds[0]}%</span>
              <span className="text-green-400">{odds[1]}%</span>
              <span className="text-blue-400">{odds[2]}%</span>
              <span className="text-purple-400">{odds[3]}%</span>
              <span className="text-yellow-400">{odds[4]}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                if (playerGold >= 2) {
                  addGold(-2);
                  rerollShop();
                }
              }}
              disabled={playerGold < 2}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Reroll (2)
            </button>
            <button 
              onClick={buyXP}
              disabled={playerGold < 4 || playerLevel >= 9}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-blue-400" />
              Buy XP (4)
            </button>
          </div>
          <button 
            onClick={() => addGold(10)}
            className="w-full py-1.5 bg-neutral-800/50 hover:bg-neutral-700/50 rounded-lg text-[10px] font-bold text-neutral-500 transition-all active:scale-95"
          >
            Cheat +10g
          </button>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          {shop.map((unit, i) => (
            <motion.div 
              key={unit ? unit.id : `empty-${i}`}
              whileHover={unit && playerGold >= unit.cost ? { x: 4, scale: 1.02 } : {}}
              whileTap={unit && playerGold >= unit.cost ? { scale: 0.95 } : {}}
              className={`h-24 rounded-xl border-2 p-3 flex flex-col justify-between transition-all relative overflow-hidden ${
                unit 
                  ? playerGold >= unit.cost 
                    ? 'bg-neutral-900 border-neutral-700 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer' 
                    : 'bg-neutral-900/50 border-neutral-800 opacity-60 grayscale cursor-not-allowed'
                  : 'bg-neutral-900/20 border-dashed border-neutral-800'
              }`}
              onClick={() => {
                if (unit && playerGold >= unit.cost) {
                  // Play UI click sound here eventually
                  buyUnit(i);
                }
              }}
            >
              {unit ? (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold">{unit.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {unit.traits.map(t => (
                          <span key={t} className="text-[8px] px-1 bg-neutral-800 rounded text-neutral-400 uppercase font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 font-bold bg-neutral-950/50 px-2 py-0.5 rounded-full ${
                      unit.cost === 1 ? 'text-gray-400' :
                      unit.cost === 2 ? 'text-green-400' :
                      unit.cost === 3 ? 'text-blue-400' :
                      unit.cost === 4 ? 'text-purple-400' :
                      'text-yellow-400'
                    }`}>
                      <Coins className="w-3 h-3" />
                      {unit.cost}
                    </div>
                  </div>
                  <div className="flex gap-3 text-[10px] text-neutral-500">
                    <div className="flex items-center gap-1"><Swords className="w-3 h-3" /> {unit.ad}</div>
                    <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> {unit.hp}</div>
                  </div>
                </>
              ) : (
                <div className="m-auto text-neutral-700 font-bold uppercase text-xs">Sold</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </aside>
  );
});
